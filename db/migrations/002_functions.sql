-- 002_functions.sql — RBAC helpers, money integrity triggers, numbering, audit log,
-- and the public RPCs used by the website (admissions, status tracker, result checker).
-- Every security definer function pins search_path = '' and fully qualifies names.

begin;

-- ---------------------------------------------------------------------------
-- RBAC helpers
-- ---------------------------------------------------------------------------
create or replace function public.auth_role()
returns text language sql stable security definer set search_path = '' as $$
  select p.role from public.profiles p where p.id = auth.uid() and p.is_active
$$;

create or replace function public.has_permission(perm text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active and (
      p.role = 'super_admin'
      or exists (select 1 from public.role_permissions rp
                 where rp.role_key = p.role and rp.permission_key = perm)
      or exists (select 1 from public.user_roles ur
                 join public.role_permissions rp on rp.role_key = ur.role_key
                 where ur.profile_id = p.id and rp.permission_key = perm)
    )
  )
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.auth_role() in ('super_admin','admin','bursar','teacher'), false)
$$;

create or replace function public.current_staff_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select s.id from public.staff s where s.profile_id = auth.uid()
$$;

create or replace function public.teaches_class_arm(ca uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.staff s
    where s.profile_id = auth.uid() and (
      exists (select 1 from public.teacher_assignments ta where ta.staff_id = s.id and ta.class_arm_id = ca)
      or exists (select 1 from public.class_arms c where c.id = ca and c.form_teacher_id = s.id)
    )
  )
$$;

create or replace function public.is_form_teacher_of_student(sid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.students st
    join public.class_arms c on c.id = st.class_arm_id
    join public.staff s on s.id = c.form_teacher_id
    where st.id = sid and s.profile_id = auth.uid()
  )
$$;

create or replace function public.teaches_student_subject(sid uuid, subj uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.students st
    join public.teacher_assignments ta on ta.class_arm_id = st.class_arm_id and ta.subject_id = subj
    join public.staff s on s.id = ta.staff_id
    where st.id = sid and s.profile_id = auth.uid()
  )
$$;

create or replace function public.is_guardian_of(sid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.student_guardians sg
    join public.guardians g on g.id = sg.guardian_id
    where sg.student_id = sid and g.profile_id = auth.uid()
  )
$$;

create or replace function public.is_self_student(sid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.students s where s.id = sid and s.profile_id = auth.uid())
$$;

create or replace function public.can_view_student(sid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_permission('students.view')
    or public.is_guardian_of(sid)
    or public.is_self_student(sid)
    or exists (select 1 from public.students s where s.id = sid and public.teaches_class_arm(s.class_arm_id))
$$;

create or replace function public.result_is_published(sid uuid, tid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.term_results r
                 where r.student_id = sid and r.term_id = tid and r.status = 'published')
$$;

create or replace function public.term_is_locked(tid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select t.is_locked from public.terms t where t.id = tid), false)
$$;

-- ---------------------------------------------------------------------------
-- Profiles: auto-create on signup; role changes only through a checked RPC
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email, must_change_password)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_app_meta_data ->> 'invited')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_user_role(target uuid, new_role text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_permission('roles.manage') then
    raise exception 'Not authorised to change roles' using errcode = '42501';
  end if;
  if target = auth.uid() and new_role <> 'super_admin' and public.auth_role() = 'super_admin'
     and (select count(*) from public.profiles where role = 'super_admin' and is_active) = 1 then
    raise exception 'Cannot remove the last Super Admin';
  end if;
  update public.profiles set role = new_role, updated_at = now() where id = target;
end;
$$;

create or replace function public.mark_password_changed()
returns void language sql security definer set search_path = '' as $$
  update public.profiles set must_change_password = false, updated_at = now() where id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- Gap-free document numbering (receipts, invoices, admission numbers, applications)
-- ---------------------------------------------------------------------------
create or replace function public.next_number(p_scope text, p_year int)
returns int language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  insert into public.number_counters (scope, year, last_no) values (p_scope, p_year, 1)
  on conflict (scope, year) do update set last_no = public.number_counters.last_no + 1
  returning last_no into n;
  return n;
end;
$$;

create or replace function public.setting_text(p_key text, p_default text)
returns text language sql stable security definer set search_path = '' as $$
  select coalesce((select s.value #>> '{}' from public.settings s where s.key = p_key), p_default)
$$;

create or replace function public.generate_admission_no(p_year int default extract(year from now())::int)
returns text language plpgsql security definer set search_path = '' as $$
declare n int; prefix text;
begin
  prefix := public.setting_text('admission_prefix', 'SCH');
  n := public.next_number('admission', p_year);
  return prefix || '/' || p_year || '/' || lpad(n::text, 4, '0');
end;
$$;

create or replace function public.generate_invoice_no()
returns text language plpgsql security definer set search_path = '' as $$
declare y int := extract(year from now())::int; n int;
begin
  n := public.next_number('invoice', y);
  return public.setting_text('invoice_prefix', 'INV') || '/' || y || '/' || lpad(n::text, 6, '0');
end;
$$;

-- ---------------------------------------------------------------------------
-- Payments: never overpay an invoice, keep invoice totals in sync, issue receipts
-- ---------------------------------------------------------------------------
create or replace function public.payments_before_write()
returns trigger language plpgsql security definer set search_path = '' as $$
declare inv public.invoices%rowtype; outstanding bigint;
begin
  if tg_op = 'UPDATE' then
    if new.amount_kobo <> old.amount_kobo or new.invoice_id <> old.invoice_id or new.student_id <> old.student_id then
      raise exception 'Payment amount, invoice and student cannot be edited; reverse and re-record instead';
    end if;
    if old.status = 'reversed' then
      raise exception 'A reversed payment cannot be changed';
    end if;
    if new.status = 'reversed' and coalesce(trim(new.reversal_reason), '') = '' then
      raise exception 'A reversal reason is required';
    end if;
  end if;

  select * into inv from public.invoices where id = new.invoice_id for update;
  if not found then raise exception 'Invoice not found'; end if;
  if inv.student_id <> new.student_id then raise exception 'Payment student does not match invoice'; end if;
  if inv.status = 'cancelled' then raise exception 'Cannot pay a cancelled invoice'; end if;

  if new.status = 'confirmed' and (tg_op = 'INSERT' or old.status <> 'confirmed') then
    outstanding := inv.total_kobo - inv.discount_kobo - inv.paid_kobo;
    if new.amount_kobo > outstanding then
      raise exception 'Payment of % kobo exceeds outstanding balance of % kobo', new.amount_kobo, outstanding;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.payments_after_write()
returns trigger language plpgsql security definer set search_path = '' as $$
declare delta bigint := 0; y int; n int;
begin
  if new.status = 'confirmed' and (tg_op = 'INSERT' or old.status <> 'confirmed') then
    delta := new.amount_kobo;
    if not exists (select 1 from public.receipts where payment_id = new.id) then
      y := extract(year from new.paid_at)::int;
      n := public.next_number('receipt', y);
      insert into public.receipts (payment_id, receipt_no, issued_at)
      values (new.id, public.setting_text('receipt_prefix', 'RCP') || '/' || y || '/' || lpad(n::text, 6, '0'), new.paid_at);
    end if;
  elsif tg_op = 'UPDATE' and old.status = 'confirmed' and new.status = 'reversed' then
    delta := -new.amount_kobo;
  end if;

  if delta <> 0 then
    update public.invoices i
    set paid_kobo = i.paid_kobo + delta,
        status = case
          when i.paid_kobo + delta + i.discount_kobo >= i.total_kobo then 'paid'
          when i.paid_kobo + delta > 0 then 'part_paid'
          else 'unpaid' end
    where i.id = new.invoice_id;
  end if;
  return new;
end;
$$;

create trigger payments_before_write before insert or update on public.payments
  for each row execute function public.payments_before_write();
create trigger payments_after_write after insert or update on public.payments
  for each row execute function public.payments_after_write();

-- Payroll: two-step approval and lock after payment.
create or replace function public.payroll_runs_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status = 'paid' then
    raise exception 'Payroll run is locked after payment';
  end if;
  if new.status = 'approved' and old.status <> 'approved'
     and auth.uid() is not null and not public.has_permission('payroll.approve') then
    raise exception 'Only an approver can approve payroll' using errcode = '42501';
  end if;
  if new.status = 'paid' and old.status <> 'approved' then
    raise exception 'Payroll must be approved before it is marked paid';
  end if;
  return new;
end;
$$;
create trigger payroll_runs_guard before update on public.payroll_runs
  for each row execute function public.payroll_runs_guard();

-- Results: published/locked records need a super admin.
create or replace function public.scores_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare sid uuid := coalesce(new.student_id, old.student_id);
        tid uuid := coalesce(new.term_id, old.term_id);
begin
  if (public.term_is_locked(tid) or public.result_is_published(sid, tid))
     and coalesce(public.auth_role(), '') <> 'super_admin' and auth.uid() is not null then
    raise exception 'Results for this term are locked; a Super Admin override is required';
  end if;
  return coalesce(new, old);
end;
$$;
create trigger scores_guard before insert or update or delete on public.scores
  for each row execute function public.scores_guard();

-- ---------------------------------------------------------------------------
-- Audit log (results, fees, payroll and role changes)
-- ---------------------------------------------------------------------------
create or replace function public.audit_trigger()
returns trigger language plpgsql security definer set search_path = '' as $$
declare rec_id text;
begin
  if tg_op = 'DELETE' then
    rec_id := to_jsonb(old) ->> 'id';
    insert into public.audit_logs (actor_id, action, table_name, record_id, old_data)
    values (auth.uid(), tg_op, tg_table_name, rec_id, to_jsonb(old));
    return old;
  elsif tg_op = 'UPDATE' then
    rec_id := to_jsonb(new) ->> 'id';
    if to_jsonb(new) = to_jsonb(old) then return new; end if;
    insert into public.audit_logs (actor_id, action, table_name, record_id, old_data, new_data)
    values (auth.uid(), tg_op, tg_table_name, rec_id, to_jsonb(old), to_jsonb(new));
    return new;
  else
    rec_id := to_jsonb(new) ->> 'id';
    insert into public.audit_logs (actor_id, action, table_name, record_id, new_data)
    values (auth.uid(), tg_op, tg_table_name, rec_id, to_jsonb(new));
    return new;
  end if;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['scores','term_results','remarks','invoices','payments','discounts',
                           'fee_structures','expenses','payroll_runs','payslips','salary_structures',
                           'staff_loans','role_permissions','user_roles']
  loop
    execute format('create trigger %I after insert or update or delete on public.%I
                    for each row execute function public.audit_trigger()', t || '_audit', t);
  end loop;
end $$;

-- Only audit role-related columns on profiles.
create trigger profiles_role_audit after update of role, is_active on public.profiles
  for each row execute function public.audit_trigger();

-- ---------------------------------------------------------------------------
-- Public RPCs used by the website
-- ---------------------------------------------------------------------------
create or replace function public.submit_application(payload jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare ref text; y int := extract(year from now())::int;
begin
  if coalesce(trim(payload ->> 'first_name'), '') = '' or coalesce(trim(payload ->> 'last_name'), '') = ''
     or coalesce(trim(payload ->> 'guardian_name'), '') = '' or coalesce(trim(payload ->> 'guardian_phone'), '') = ''
     or coalesce(trim(payload ->> 'class_applied'), '') = '' then
    raise exception 'Missing required fields';
  end if;
  ref := public.setting_text('application_prefix', 'APP') || '-' || y || '-'
         || lpad(public.next_number('application', y)::text, 5, '0');
  insert into public.applications (
    reference, first_name, middle_name, last_name, gender, date_of_birth, class_applied,
    previous_school, guardian_name, guardian_relationship, guardian_phone, guardian_email,
    guardian_address, boarding_status, exam_date
  ) values (
    ref, left(payload ->> 'first_name', 80), left(payload ->> 'middle_name', 80), left(payload ->> 'last_name', 80),
    payload ->> 'gender', nullif(payload ->> 'date_of_birth', '')::date, left(payload ->> 'class_applied', 40),
    left(payload ->> 'previous_school', 160), left(payload ->> 'guardian_name', 120),
    left(payload ->> 'guardian_relationship', 40), left(payload ->> 'guardian_phone', 30),
    left(payload ->> 'guardian_email', 200), left(payload ->> 'guardian_address', 300),
    coalesce(payload ->> 'boarding_status', 'day'), nullif(payload ->> 'exam_date', '')::date
  );
  return ref;
end;
$$;

create or replace function public.get_application_status(ref text)
returns table (reference text, applicant text, class_applied text, status text, exam_date date, updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select a.reference, a.first_name || ' ' || left(a.last_name, 1) || '.', a.class_applied, a.status, a.exam_date, a.updated_at
  from public.applications a where upper(a.reference) = upper(trim(ref))
$$;

create or replace function public.public_staff_directory()
returns table (id uuid, title text, first_name text, last_name text, "position" text, department text, qualification text, photo_url text)
language sql stable security definer set search_path = '' as $$
  select s.id, s.title, s.first_name, s.last_name, s.position, s.department, s.qualification, s.photo_url
  from public.staff s
  where s.show_in_directory and s.status = 'active'
  order by case when s.position ilike '%principal%' then 0 else 1 end, s.last_name
$$;

create or replace function public.public_stats()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'students', (select count(*) from public.students where status = 'active'),
    'teachers', (select count(*) from public.staff where status = 'active' and staff_type = 'teaching')
  )
$$;

-- Result checker: admission number + token serial + PIN. Consumes one use per success.
create or replace function public.check_result(p_admission_no text, p_serial text, p_pin text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare tok public.result_tokens%rowtype; stu public.students%rowtype; res public.term_results%rowtype;
        t public.terms%rowtype; subjects jsonb;
begin
  select * into stu from public.students where upper(admission_no) = upper(trim(p_admission_no));
  select * into tok from public.result_tokens where serial = upper(trim(p_serial)) for update;
  if stu.id is null or tok.id is null or tok.pin_hash <> extensions.crypt(trim(p_pin), tok.pin_hash) then
    return jsonb_build_object('ok', false, 'error', 'Invalid admission number, serial or PIN');
  end if;
  if tok.student_id is not null and tok.student_id <> stu.id then
    return jsonb_build_object('ok', false, 'error', 'Invalid admission number, serial or PIN');
  end if;
  if tok.expires_at is not null and tok.expires_at < now() then
    return jsonb_build_object('ok', false, 'error', 'This token has expired');
  end if;
  if tok.uses >= tok.max_uses then
    return jsonb_build_object('ok', false, 'error', 'This token has reached its usage limit');
  end if;

  select * into res from public.term_results r
  where r.student_id = stu.id and r.status = 'published'
    and (tok.term_id is null or r.term_id = tok.term_id)
  order by r.published_at desc nulls last limit 1;
  if res.id is null then
    return jsonb_build_object('ok', false, 'error', 'No published result is available for this token yet');
  end if;

  update public.result_tokens set uses = uses + 1, student_id = coalesce(student_id, stu.id) where id = tok.id;
  select * into t from public.terms where id = res.term_id;

  select coalesce(jsonb_agg(row_to_json(x) order by x.subject), '[]'::jsonb) into subjects from (
    select sub.name as subject,
           sum(case when ac.is_exam then 0 else sc.score end) as ca,
           sum(case when ac.is_exam then sc.score else 0 end) as exam,
           sum(sc.score) as total
    from public.scores sc
    join public.subjects sub on sub.id = sc.subject_id
    join public.assessment_components ac on ac.id = sc.component_id
    where sc.student_id = stu.id and sc.term_id = res.term_id
    group by sub.name
  ) x;

  return jsonb_build_object(
    'ok', true,
    'student', stu.first_name || ' ' || stu.last_name,
    'admission_no', stu.admission_no,
    'term', t.name,
    'average', res.average,
    'position', res.position,
    'number_in_class', res.number_in_class,
    'uses_left', tok.max_uses - tok.uses - 1,
    'subjects', subjects
  );
end;
$$;

-- Lock down RPC execution: revoke the default public grant, then grant deliberately.
revoke execute on all functions in schema public from public, anon;
grant execute on function public.submit_application(jsonb) to anon, authenticated;
grant execute on function public.get_application_status(text) to anon, authenticated;
grant execute on function public.public_staff_directory() to anon, authenticated;
grant execute on function public.public_stats() to anon, authenticated;
grant execute on function public.check_result(text, text, text) to anon, authenticated;
grant execute on function public.auth_role(), public.has_permission(text), public.is_staff(),
  public.current_staff_id(), public.teaches_class_arm(uuid), public.is_form_teacher_of_student(uuid),
  public.teaches_student_subject(uuid, uuid), public.is_guardian_of(uuid), public.is_self_student(uuid),
  public.can_view_student(uuid), public.result_is_published(uuid, uuid), public.term_is_locked(uuid),
  public.set_user_role(uuid, text), public.mark_password_changed()
  to authenticated;
-- RLS policies evaluated for anon call these helpers too.
grant execute on function public.has_permission(text), public.auth_role(), public.is_guardian_of(uuid),
  public.is_self_student(uuid), public.can_view_student(uuid), public.teaches_class_arm(uuid),
  public.result_is_published(uuid, uuid), public.is_staff() to anon;

commit;
