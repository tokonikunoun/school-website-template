-- 004_academics_students.sql — Phase 2: term switching and locking, class history,
-- promotion/graduation, elective integrity, student photo storage and teacher read access.

begin;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.try_uuid(v text)
returns uuid language plpgsql immutable set search_path = '' as $$
begin
  return v::uuid;
exception when others then
  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Class history: every enrolment, promotion, repeat, transfer and graduation
-- ---------------------------------------------------------------------------
create table public.student_class_history (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  from_class_arm_id uuid references public.class_arms(id) on delete set null,
  to_class_arm_id uuid references public.class_arms(id) on delete set null,
  action text not null check (action in ('enrolled','promoted','repeated','moved','graduated','status_change')),
  note text,
  performed_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index student_class_history_student_idx on public.student_class_history(student_id, created_at desc);

alter table public.student_class_history enable row level security;
revoke all on public.student_class_history from anon, authenticated;
grant all on public.student_class_history to service_role;
grant select, insert on public.student_class_history to authenticated;

create policy student_class_history_select on public.student_class_history for select to authenticated
  using (public.can_view_student(student_id) and (select public.is_staff()));
create policy student_class_history_insert on public.student_class_history for insert to authenticated
  with check ((select public.has_permission('students.manage')));

-- ---------------------------------------------------------------------------
-- Terms: one current term (and session); locked terms are frozen.
-- Anyone with academics.manage can lock; only a Super Admin can unlock.
-- ---------------------------------------------------------------------------
create or replace function public.terms_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;
  if tg_op = 'DELETE' then
    if old.is_locked then raise exception 'A locked term cannot be deleted'; end if;
    return old;
  end if;
  if old.is_locked and not new.is_locked and coalesce(public.auth_role(), '') <> 'super_admin' then
    raise exception 'Only a Super Admin can unlock a term' using errcode = '42501';
  end if;
  if old.is_locked and new.is_locked and (
       new.name, new.term_number, new.start_date, new.end_date, new.session_id, new.school_days, new.next_term_begins
     ) is distinct from (
       old.name, old.term_number, old.start_date, old.end_date, old.session_id, old.school_days, old.next_term_begins
     ) then
    raise exception 'This term is locked. Unlock it before editing.';
  end if;
  return new;
end;
$$;
drop trigger if exists terms_guard on public.terms;
create trigger terms_guard before update or delete on public.terms
  for each row execute function public.terms_guard();

create or replace function public.set_current_term(p_term uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare sid uuid;
begin
  if not public.has_permission('academics.manage') then
    raise exception 'Not authorised to change the current term' using errcode = '42501';
  end if;
  select t.session_id into sid from public.terms t where t.id = p_term;
  if sid is null then raise exception 'Term not found'; end if;

  update public.terms set is_current = false where is_current and id <> p_term;
  update public.terms set is_current = true where id = p_term;
  update public.sessions set is_current = false where is_current and id <> sid;
  update public.sessions set is_current = true where id = sid;

  insert into public.audit_logs (actor_id, action, table_name, record_id, new_data)
  values (auth.uid(), 'SET_CURRENT_TERM', 'terms', p_term::text, jsonb_build_object('session_id', sid));
end;
$$;
revoke execute on function public.set_current_term(uuid) from public, anon;
grant execute on function public.set_current_term(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Electives: a student may only register subjects offered to their class/arm.
-- ---------------------------------------------------------------------------
create or replace function public.student_subjects_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.students st
    join public.class_arms ca on ca.id = st.class_arm_id
    join public.class_subjects cs on cs.class_id = ca.class_id and cs.subject_id = new.subject_id
      and (cs.arm_id is null or cs.arm_id = ca.arm_id)
    where st.id = new.student_id
  ) then
    raise exception 'This subject is not offered to the student''s class';
  end if;
  return new;
end;
$$;
drop trigger if exists student_subjects_guard on public.student_subjects;
create trigger student_subjects_guard before insert or update on public.student_subjects
  for each row execute function public.student_subjects_guard();

-- ---------------------------------------------------------------------------
-- Promotion / graduation in one transaction, with history.
-- p_moves: [{ "student_id": uuid, "action": "promote"|"repeat"|"graduate", "to_class_arm_id": uuid|null }]
-- ---------------------------------------------------------------------------
create or replace function public.promote_students(p_moves jsonb, p_session uuid default null)
returns int language plpgsql security definer set search_path = '' as $$
declare m record; old_ca uuid; n int := 0; sess uuid;
begin
  if not public.has_permission('students.manage') then
    raise exception 'Not authorised to promote students' using errcode = '42501';
  end if;
  sess := coalesce(p_session, (select s.id from public.sessions s where s.is_current));

  for m in select * from jsonb_to_recordset(p_moves) as x(student_id uuid, action text, to_class_arm_id uuid) loop
    select st.class_arm_id into old_ca from public.students st
      where st.id = m.student_id and st.status = 'active' for update;
    if not found then continue; end if;

    if m.action = 'graduate' then
      update public.students set status = 'graduated', class_arm_id = null where id = m.student_id;
      insert into public.student_class_history (student_id, session_id, from_class_arm_id, action)
      values (m.student_id, sess, old_ca, 'graduated');
    elsif m.action in ('promote', 'repeat') then
      if m.to_class_arm_id is null then raise exception 'A destination class is required'; end if;
      update public.students set class_arm_id = m.to_class_arm_id, student_type = 'returning' where id = m.student_id;
      insert into public.student_class_history (student_id, session_id, from_class_arm_id, to_class_arm_id, action)
      values (m.student_id, sess, old_ca, m.to_class_arm_id, case m.action when 'promote' then 'promoted' else 'repeated' end);
    else
      raise exception 'Unknown action %', m.action;
    end if;
    n := n + 1;
  end loop;
  return n;
end;
$$;
revoke execute on function public.promote_students(jsonb, uuid) from public, anon;
grant execute on function public.promote_students(jsonb, uuid) to authenticated;

-- Sequential staff numbers (STF/001 …) that continue from existing records.
create or replace function public.generate_staff_no()
returns text language plpgsql security definer set search_path = '' as $$
declare n int; prefix text;
begin
  perform pg_advisory_xact_lock(hashtext('staff_no'));
  prefix := public.setting_text('staff_prefix', 'STF');
  select coalesce(max((substring(s.staff_no from '(\d+)$'))::int), 0) + 1 into n from public.staff s;
  return prefix || '/' || lpad(n::text, 3, '0');
end;
$$;
revoke execute on function public.generate_staff_no() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Teachers: read-only access to guardians of students they can see
-- ---------------------------------------------------------------------------
drop policy if exists guardians_select on public.guardians;
create policy guardians_select on public.guardians for select to authenticated using (
  profile_id = (select auth.uid())
  or (select public.has_permission('students.view'))
  or exists (select 1 from public.student_guardians sg where sg.guardian_id = guardians.id and public.can_view_student(sg.student_id))
);

-- Audit student and staff record changes too.
drop trigger if exists audit_students on public.students;
create trigger audit_students after insert or update or delete on public.students
  for each row execute function public.audit_trigger();
drop trigger if exists audit_terms on public.terms;
create trigger audit_terms after update or delete on public.terms
  for each row execute function public.audit_trigger();

-- ---------------------------------------------------------------------------
-- Student photos: private bucket; staff who can see the student may read,
-- students.manage may write. Path: <student_id>/<file>.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-photos', 'student-photos', false, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists student_photos_select on storage.objects;
create policy student_photos_select on storage.objects for select to authenticated using (
  bucket_id = 'student-photos'
  and public.can_view_student(public.try_uuid((storage.foldername(name))[1]))
);
drop policy if exists student_photos_insert on storage.objects;
create policy student_photos_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'student-photos' and (select public.has_permission('students.manage'))
);
drop policy if exists student_photos_update on storage.objects;
create policy student_photos_update on storage.objects for update to authenticated
  using (bucket_id = 'student-photos' and (select public.has_permission('students.manage')))
  with check (bucket_id = 'student-photos' and (select public.has_permission('students.manage')));
drop policy if exists student_photos_delete on storage.objects;
create policy student_photos_delete on storage.objects for delete to authenticated using (
  bucket_id = 'student-photos' and (select public.has_permission('students.manage'))
);

commit;
