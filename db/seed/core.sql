-- core.sql — system roles and the permission catalogue. Safe to re-run.

begin;

insert into public.roles (key, name, description, is_system) values
  ('super_admin', 'Super Admin', 'Proprietor, Principal or IT. Full access including settings, roles, audit logs and data export.', true),
  ('admin', 'Admin', 'Vice Principal or Admin Officer. Academics, students, staff, announcements and admissions.', true),
  ('bursar', 'Bursar / Accountant', 'Fees, other payments, expenses, payroll and financial reports.', true),
  ('teacher', 'Teacher', 'Assigned classes, arms and subjects only.', true),
  ('parent', 'Parent / Guardian', 'Linked children only.', true),
  ('student', 'Student', 'Own results, timetable and assignments.', true)
on conflict (key) do update set name = excluded.name, description = excluded.description, is_system = true;

insert into public.permissions (key, description, module) values
  ('settings.manage', 'Edit school settings, branding and integrations', 'settings'),
  ('roles.manage', 'Create permission sets and assign roles', 'settings'),
  ('audit.view', 'View the audit log', 'settings'),
  ('data.export', 'Export and back up data', 'settings'),
  ('students.view', 'View all student records', 'students'),
  ('students.manage', 'Create, edit and import students', 'students'),
  ('staff.view', 'View staff records', 'staff'),
  ('staff.manage', 'Create and edit staff, approve leave', 'staff'),
  ('academics.manage', 'Manage sessions, terms, classes, arms, subjects and assignments', 'academics'),
  ('results.enter', 'Enter scores for assigned subjects', 'results'),
  ('results.review', 'Review and override any results', 'results'),
  ('results.publish', 'Publish results and manage result tokens', 'results'),
  ('attendance.mark', 'Mark attendance for assigned classes', 'attendance'),
  ('announcements.manage', 'Create and schedule announcements', 'communication'),
  ('admissions.manage', 'Process applications and admissions', 'admissions'),
  ('cms.manage', 'Edit website news, events, gallery and pages', 'cms'),
  ('fees.view', 'View invoices and payments', 'fees'),
  ('fees.manage', 'Manage fee structures, invoices and discounts', 'fees'),
  ('payments.record', 'Record payments', 'fees'),
  ('payments.reverse', 'Reverse or refund payments', 'fees'),
  ('expenses.manage', 'Record and approve expenses', 'finance'),
  ('reports.finance', 'View financial reports', 'finance'),
  ('payroll.view', 'View salary structures and payroll', 'payroll'),
  ('payroll.manage', 'Prepare payroll runs and payslips', 'payroll'),
  ('payroll.approve', 'Approve payroll runs', 'payroll')
on conflict (key) do update set description = excluded.description, module = excluded.module;

insert into public.role_permissions (role_key, permission_key)
select 'admin', unnest(array[
  'students.view','students.manage','staff.view','staff.manage','academics.manage',
  'results.enter','results.review','results.publish','attendance.mark',
  'announcements.manage','admissions.manage','cms.manage'])
union all
select 'bursar', unnest(array[
  'students.view','fees.view','fees.manage','payments.record','payments.reverse',
  'expenses.manage','reports.finance','payroll.view','payroll.manage'])
union all
select 'teacher', unnest(array['results.enter','attendance.mark'])
on conflict do nothing;

-- Optional permission sets that can be granted on top of a primary role (e.g. to a teacher).
insert into public.roles (key, name, description, is_system) values
  ('exam_officer', 'Exam Officer', 'Review, override and publish results for all classes.', false),
  ('admissions_officer', 'Admissions Officer', 'Process applications and view student records.', false),
  ('records_officer', 'Records Officer', 'View and manage student records, including bulk import.', false)
on conflict (key) do nothing;

insert into public.role_permissions (role_key, permission_key)
select 'exam_officer', unnest(array['results.review','results.publish'])
union all
select 'admissions_officer', unnest(array['admissions.manage','students.view'])
union all
select 'records_officer', unnest(array['students.view','students.manage'])
on conflict do nothing;

commit;
