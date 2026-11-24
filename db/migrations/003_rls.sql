-- 003_rls.sql — Row Level Security on every table, plus explicit grants.
-- Grants say WHICH operations a role may attempt; policies say WHICH rows.

begin;

-- Enable RLS everywhere and start from zero grants.
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

-- Authenticated users may attempt CRUD; policies narrow it down per role.
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public'
           and tablename not in ('audit_logs','receipts','number_counters','profiles','result_tokens') loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

grant select on public.audit_logs, public.receipts to authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;
grant select, insert, update, delete on public.result_tokens to authenticated;

-- Anonymous visitors: read public website content, submit forms.
grant select on public.sessions, public.terms, public.classes, public.arms, public.class_arms,
  public.subjects, public.class_subjects, public.grade_scales, public.assessment_components,
  public.news, public.events, public.gallery_albums, public.gallery_items, public.vacancies,
  public.announcements, public.fee_items, public.fee_structures to anon;
grant insert (name, email, phone, subject, message) on public.contact_messages to anon;
grant insert (vacancy_id, full_name, email, phone, qualification, cover_letter) on public.job_applications to anon;

-- ---------------------------------------------------------------------------
-- Settings, roles, permissions
-- ---------------------------------------------------------------------------
create policy settings_select on public.settings for select to authenticated using ((select public.is_staff()));
create policy settings_write on public.settings for all to authenticated
  using ((select public.has_permission('settings.manage'))) with check ((select public.has_permission('settings.manage')));

create policy roles_select on public.roles for select to authenticated using (true);
create policy roles_write on public.roles for all to authenticated
  using ((select public.has_permission('roles.manage')) and not is_system)
  with check ((select public.has_permission('roles.manage')) and not is_system);

create policy permissions_select on public.permissions for select to authenticated using (true);

create policy role_permissions_select on public.role_permissions for select to authenticated using (true);
create policy role_permissions_write on public.role_permissions for all to authenticated
  using ((select public.has_permission('roles.manage')) and role_key <> 'super_admin')
  with check ((select public.has_permission('roles.manage')) and role_key <> 'super_admin');

create policy user_roles_select on public.user_roles for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.has_permission('roles.manage')));
create policy user_roles_write on public.user_roles for all to authenticated
  using ((select public.has_permission('roles.manage'))) with check ((select public.has_permission('roles.manage')));

create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.has_permission('staff.view')) or (select public.has_permission('roles.manage')));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Academic structure: publicly readable, managed by academics.manage
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['sessions','terms','classes','arms','class_arms','subjects','class_subjects',
                           'grade_scales','assessment_components']
  loop
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', t || '_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select public.has_permission(''academics.manage'')))', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select public.has_permission(''academics.manage''))) with check ((select public.has_permission(''academics.manage'')))', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select public.has_permission(''academics.manage'')))', t || '_delete', t);
  end loop;
end $$;

create policy teacher_assignments_select on public.teacher_assignments for select to authenticated using ((select public.is_staff()));
create policy teacher_assignments_write on public.teacher_assignments for all to authenticated
  using ((select public.has_permission('academics.manage'))) with check ((select public.has_permission('academics.manage')));

-- ---------------------------------------------------------------------------
-- Staff
-- ---------------------------------------------------------------------------
create policy staff_select on public.staff for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.has_permission('staff.view')) or (select public.has_permission('payroll.view')));
create policy staff_write on public.staff for all to authenticated
  using ((select public.has_permission('staff.manage'))) with check ((select public.has_permission('staff.manage')));

-- ---------------------------------------------------------------------------
-- Students and guardians
-- ---------------------------------------------------------------------------
create policy students_select on public.students for select to authenticated using (public.can_view_student(id));
create policy students_write on public.students for all to authenticated
  using ((select public.has_permission('students.manage'))) with check ((select public.has_permission('students.manage')));

create policy guardians_select on public.guardians for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.has_permission('students.view')));
create policy guardians_write on public.guardians for all to authenticated
  using ((select public.has_permission('students.manage'))) with check ((select public.has_permission('students.manage')));

create policy student_guardians_select on public.student_guardians for select to authenticated using (public.can_view_student(student_id));
create policy student_guardians_write on public.student_guardians for all to authenticated
  using ((select public.has_permission('students.manage'))) with check ((select public.has_permission('students.manage')));

create policy student_subjects_select on public.student_subjects for select to authenticated using (public.can_view_student(student_id));
create policy student_subjects_write on public.student_subjects for all to authenticated
  using ((select public.has_permission('students.manage')) or (select public.has_permission('academics.manage')))
  with check ((select public.has_permission('students.manage')) or (select public.has_permission('academics.manage')));

-- ---------------------------------------------------------------------------
-- Results
-- ---------------------------------------------------------------------------
create policy scores_select on public.scores for select to authenticated using (
  (select public.has_permission('results.review'))
  or public.teaches_student_subject(student_id, subject_id)
  or public.is_form_teacher_of_student(student_id)
  or ((public.is_guardian_of(student_id) or public.is_self_student(student_id)) and public.result_is_published(student_id, term_id))
);
create policy scores_insert on public.scores for insert to authenticated with check (
  (select public.has_permission('results.review'))
  or ((select public.has_permission('results.enter')) and public.teaches_student_subject(student_id, subject_id))
);
create policy scores_update on public.scores for update to authenticated
  using ((select public.has_permission('results.review')) or ((select public.has_permission('results.enter')) and public.teaches_student_subject(student_id, subject_id)))
  with check ((select public.has_permission('results.review')) or ((select public.has_permission('results.enter')) and public.teaches_student_subject(student_id, subject_id)));
create policy scores_delete on public.scores for delete to authenticated using ((select public.has_permission('results.review')));

do $$
declare t text;
begin
  foreach t in array array['term_results','skill_ratings','remarks'] loop
    execute format($f$create policy %I on public.%I for select to authenticated using (
      (select public.has_permission('results.review'))
      or public.is_form_teacher_of_student(student_id)
      or ((public.is_guardian_of(student_id) or public.is_self_student(student_id)) and public.result_is_published(student_id, term_id)))$f$,
      t || '_select', t);
    execute format($f$create policy %I on public.%I for all to authenticated
      using ((select public.has_permission('results.review')) or public.is_form_teacher_of_student(student_id))
      with check ((select public.has_permission('results.review')) or public.is_form_teacher_of_student(student_id))$f$,
      t || '_write', t);
  end loop;
end $$;

-- Publishing needs results.publish; form teachers can only move drafts forward to "submitted".
create or replace function public.term_results_status_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return new; end if;
  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published')
     and not public.has_permission('results.publish') then
    raise exception 'Not authorised to publish results' using errcode = '42501';
  end if;
  if new.status in ('reviewed','approved') and (tg_op = 'INSERT' or old.status <> new.status)
     and not public.has_permission('results.review') then
    raise exception 'Not authorised to review results' using errcode = '42501';
  end if;
  if new.status = 'published' and new.published_at is null then new.published_at := now(); end if;
  return new;
end;
$$;
create trigger term_results_status_guard before insert or update on public.term_results
  for each row execute function public.term_results_status_guard();

create policy result_tokens_all on public.result_tokens for all to authenticated
  using ((select public.has_permission('results.publish'))) with check ((select public.has_permission('results.publish')));

-- ---------------------------------------------------------------------------
-- Attendance
-- ---------------------------------------------------------------------------
create policy attendance_select on public.attendance for select to authenticated using (public.can_view_student(student_id));
create policy attendance_write on public.attendance for all to authenticated
  using ((select public.has_permission('students.manage')) or ((select public.has_permission('attendance.mark')) and public.teaches_class_arm(class_arm_id)))
  with check ((select public.has_permission('students.manage')) or ((select public.has_permission('attendance.mark')) and public.teaches_class_arm(class_arm_id)));

-- ---------------------------------------------------------------------------
-- Fees and payments
-- ---------------------------------------------------------------------------
create policy fee_items_select on public.fee_items for select to anon, authenticated using (true);
create policy fee_items_write on public.fee_items for all to authenticated
  using ((select public.has_permission('fees.manage'))) with check ((select public.has_permission('fees.manage')));
create policy fee_structures_select on public.fee_structures for select to anon, authenticated using (true);
create policy fee_structures_write on public.fee_structures for all to authenticated
  using ((select public.has_permission('fees.manage'))) with check ((select public.has_permission('fees.manage')));

create policy invoices_select on public.invoices for select to authenticated
  using ((select public.has_permission('fees.view')) or public.is_guardian_of(student_id) or public.is_self_student(student_id));
create policy invoices_write on public.invoices for all to authenticated
  using ((select public.has_permission('fees.manage'))) with check ((select public.has_permission('fees.manage')));

create policy invoice_items_select on public.invoice_items for select to authenticated using (
  exists (select 1 from public.invoices i where i.id = invoice_id
          and ((select public.has_permission('fees.view')) or public.is_guardian_of(i.student_id) or public.is_self_student(i.student_id))));
create policy invoice_items_write on public.invoice_items for all to authenticated
  using ((select public.has_permission('fees.manage'))) with check ((select public.has_permission('fees.manage')));

create policy discounts_select on public.discounts for select to authenticated using ((select public.has_permission('fees.view')));
create policy discounts_write on public.discounts for all to authenticated
  using ((select public.has_permission('fees.manage'))) with check ((select public.has_permission('fees.manage')));

create policy payments_select on public.payments for select to authenticated
  using ((select public.has_permission('fees.view')) or public.is_guardian_of(student_id) or public.is_self_student(student_id));
create policy payments_insert on public.payments for insert to authenticated
  with check ((select public.has_permission('payments.record')) and recorded_by = (select auth.uid()));
create policy payments_update on public.payments for update to authenticated
  using ((select public.has_permission('payments.reverse'))) with check ((select public.has_permission('payments.reverse')));

create policy receipts_select on public.receipts for select to authenticated using (
  exists (select 1 from public.payments p where p.id = payment_id
          and ((select public.has_permission('fees.view')) or public.is_guardian_of(p.student_id) or public.is_self_student(p.student_id))));

create policy expenses_select on public.expenses for select to authenticated
  using ((select public.has_permission('expenses.manage')) or (select public.has_permission('reports.finance')));
create policy expenses_write on public.expenses for all to authenticated
  using ((select public.has_permission('expenses.manage'))) with check ((select public.has_permission('expenses.manage')));

-- ---------------------------------------------------------------------------
-- Payroll
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['salary_structures','payroll_runs','staff_loans'] loop
    execute format('create policy %I on public.%I for select to authenticated using ((select public.has_permission(''payroll.view'')))', t || '_select', t);
    execute format('create policy %I on public.%I for all to authenticated using ((select public.has_permission(''payroll.manage'')) or (select public.has_permission(''payroll.approve''))) with check ((select public.has_permission(''payroll.manage'')) or (select public.has_permission(''payroll.approve'')))', t || '_write', t);
  end loop;
end $$;

create policy payslips_select on public.payslips for select to authenticated
  using ((select public.has_permission('payroll.view')) or staff_id = (select public.current_staff_id()));
create policy payslips_write on public.payslips for all to authenticated
  using ((select public.has_permission('payroll.manage'))) with check ((select public.has_permission('payroll.manage')));

create policy leave_requests_select on public.leave_requests for select to authenticated
  using (staff_id = (select public.current_staff_id()) or (select public.has_permission('staff.manage')));
create policy leave_requests_insert on public.leave_requests for insert to authenticated
  with check (staff_id = (select public.current_staff_id()) and status = 'pending');
create policy leave_requests_update on public.leave_requests for update to authenticated
  using ((select public.has_permission('staff.manage'))) with check ((select public.has_permission('staff.manage')));

-- ---------------------------------------------------------------------------
-- Communication, admissions, CMS
-- ---------------------------------------------------------------------------
create policy announcements_public on public.announcements for select to anon
  using (audience = 'public' and publish_at <= now() and (expires_at is null or expires_at > now()));
create policy announcements_select on public.announcements for select to authenticated using (
  (select public.has_permission('announcements.manage'))
  or (publish_at <= now() and (expires_at is null or expires_at > now()) and (
      audience in ('all','public')
      or audience = (select public.auth_role())
      or (audience = 'staff' and (select public.is_staff()))
      or (audience = 'teacher' and (select public.auth_role()) = 'teacher'))));
create policy announcements_write on public.announcements for all to authenticated
  using ((select public.has_permission('announcements.manage'))) with check ((select public.has_permission('announcements.manage')));

create policy messages_select on public.messages for select to authenticated
  using (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()));
create policy messages_insert on public.messages for insert to authenticated with check (sender_id = (select auth.uid()));
create policy messages_update on public.messages for update to authenticated
  using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));

create policy applications_all on public.applications for all to authenticated
  using ((select public.has_permission('admissions.manage'))) with check ((select public.has_permission('admissions.manage')));

do $$
declare t text;
begin
  foreach t in array array['news','gallery_albums'] loop
    execute format('create policy %I on public.%I for select to anon, authenticated using (is_published or (select public.has_permission(''cms.manage'')))', t || '_select', t);
    execute format('create policy %I on public.%I for all to authenticated using ((select public.has_permission(''cms.manage''))) with check ((select public.has_permission(''cms.manage'')))', t || '_write', t);
  end loop;
end $$;

create policy events_select on public.events for select to anon, authenticated
  using (is_public or (select public.is_staff()));
create policy events_write on public.events for all to authenticated
  using ((select public.has_permission('cms.manage'))) with check ((select public.has_permission('cms.manage')));

create policy gallery_items_select on public.gallery_items for select to anon, authenticated using (
  exists (select 1 from public.gallery_albums a where a.id = album_id and (a.is_published or (select public.has_permission('cms.manage')))));
create policy gallery_items_write on public.gallery_items for all to authenticated
  using ((select public.has_permission('cms.manage'))) with check ((select public.has_permission('cms.manage')));

create policy contact_messages_insert on public.contact_messages for insert to anon, authenticated with check (true);
create policy contact_messages_select on public.contact_messages for select to authenticated using ((select public.has_permission('cms.manage')));
create policy contact_messages_delete on public.contact_messages for delete to authenticated using ((select public.has_permission('cms.manage')));

create policy vacancies_select on public.vacancies for select to anon, authenticated
  using (is_open or (select public.has_permission('staff.manage')));
create policy vacancies_write on public.vacancies for all to authenticated
  using ((select public.has_permission('staff.manage'))) with check ((select public.has_permission('staff.manage')));

create policy job_applications_insert on public.job_applications for insert to anon, authenticated with check (true);
create policy job_applications_select on public.job_applications for select to authenticated using ((select public.has_permission('staff.manage')));

create policy audit_logs_select on public.audit_logs for select to authenticated using ((select public.has_permission('audit.view')));

-- number_counters: no policies → only security definer functions touch it.

commit;
