-- 001_schema.sql — normalised core schema for the School Script platform.
-- All money is stored as bigint kobo (1 NGN = 100 kobo).

begin;

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Settings, roles and permissions
-- ---------------------------------------------------------------------------
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.roles (
  key text primary key,
  name text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.permissions (
  key text primary key,
  description text not null,
  module text not null
);

create table public.role_permissions (
  role_key text not null references public.roles(key) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  primary key (role_key, permission_key)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  role text not null default 'parent' references public.roles(key),
  is_active boolean not null default true,
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles(role);

-- Extra permission sets (custom roles) granted on top of the primary role.
create table public.user_roles (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_key text not null references public.roles(key) on delete cascade,
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (profile_id, role_key)
);

-- ---------------------------------------------------------------------------
-- Academic structure
-- ---------------------------------------------------------------------------
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  start_date date not null,
  end_date date not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_date > start_date)
);
create unique index sessions_one_current on public.sessions(is_current) where is_current;

create table public.terms (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  name text not null,
  term_number smallint not null check (term_number between 1 and 3),
  start_date date not null,
  end_date date not null,
  next_term_begins date,
  school_days smallint,
  is_current boolean not null default false,
  is_locked boolean not null default false,
  created_at timestamptz not null default now(),
  unique (session_id, term_number),
  check (end_date > start_date)
);
create unique index terms_one_current on public.terms(is_current) where is_current;

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  level_group text not null check (level_group in ('nursery','primary','junior','senior')),
  sort_order int not null default 0
);

create table public.arms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  staff_no text not null unique,
  title text,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  gender text check (gender in ('male','female')),
  photo_url text,
  qualification text,
  trcn_number text,
  department text,
  position text,
  staff_type text not null default 'teaching' check (staff_type in ('teaching','non_teaching')),
  contract_type text not null default 'permanent' check (contract_type in ('permanent','contract','part_time')),
  date_employed date,
  status text not null default 'active' check (status in ('active','on_leave','suspended','resigned','retired')),
  bank_name text,
  account_number text,
  account_name text,
  next_of_kin jsonb,
  show_in_directory boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.class_arms (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  arm_id uuid not null references public.arms(id) on delete restrict,
  form_teacher_id uuid references public.staff(id) on delete set null,
  capacity int,
  unique (class_id, arm_id)
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  category text not null default 'core' check (category in ('core','elective','trade','religious')),
  department text
);

create table public.class_subjects (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  arm_id uuid references public.arms(id) on delete cascade,
  is_compulsory boolean not null default true
);
create unique index class_subjects_uniq on public.class_subjects(class_id, subject_id, coalesce(arm_id, '00000000-0000-0000-0000-000000000000'::uuid));

create table public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  class_arm_id uuid not null references public.class_arms(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  unique (class_arm_id, subject_id, session_id)
);
create index teacher_assignments_staff_idx on public.teacher_assignments(staff_id);

-- ---------------------------------------------------------------------------
-- Students and guardians
-- ---------------------------------------------------------------------------
create table public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  admission_no text not null unique,
  first_name text not null,
  middle_name text,
  last_name text not null,
  gender text not null check (gender in ('male','female')),
  date_of_birth date,
  state_of_origin text,
  lga text,
  religion text,
  blood_group text,
  genotype text,
  photo_url text,
  previous_school text,
  class_arm_id uuid references public.class_arms(id) on delete set null,
  house text,
  boarding_status text not null default 'day' check (boarding_status in ('day','boarding')),
  student_type text not null default 'returning' check (student_type in ('new','returning')),
  medical_notes text,
  emergency_contacts jsonb,
  status text not null default 'active' check (status in ('active','graduated','withdrawn','suspended','transferred')),
  admitted_on date default current_date,
  created_at timestamptz not null default now()
);
create index students_class_arm_idx on public.students(class_arm_id);
create index students_status_idx on public.students(status);

create table public.guardians (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null,
  phone text,
  email text,
  address text,
  occupation text,
  created_at timestamptz not null default now()
);

create table public.student_guardians (
  student_id uuid not null references public.students(id) on delete cascade,
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  relationship text not null,
  is_primary boolean not null default false,
  primary key (student_id, guardian_id)
);
create index student_guardians_guardian_idx on public.student_guardians(guardian_id);

create table public.student_subjects (
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  primary key (student_id, subject_id, session_id)
);

-- ---------------------------------------------------------------------------
-- Assessment and results
-- ---------------------------------------------------------------------------
create table public.assessment_components (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  max_score numeric(5,2) not null check (max_score > 0),
  is_exam boolean not null default false,
  sort_order int not null default 0
);

create table public.grade_scales (
  id uuid primary key default gen_random_uuid(),
  grade text not null unique,
  min_score numeric(5,2) not null,
  max_score numeric(5,2) not null,
  remark text not null,
  is_pass boolean not null default true,
  sort_order int not null default 0,
  check (max_score >= min_score)
);

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  term_id uuid not null references public.terms(id) on delete cascade,
  component_id uuid not null references public.assessment_components(id) on delete restrict,
  score numeric(5,2) not null check (score >= 0),
  entered_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (student_id, subject_id, component_id, term_id)
);
create index scores_term_subject_idx on public.scores(term_id, subject_id);

create table public.term_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  term_id uuid not null references public.terms(id) on delete cascade,
  class_arm_id uuid references public.class_arms(id) on delete set null,
  total_score numeric(7,2),
  average numeric(5,2),
  position int,
  number_in_class int,
  days_present int,
  days_absent int,
  promotion_decision text,
  status text not null default 'draft' check (status in ('draft','submitted','reviewed','approved','published')),
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (student_id, term_id)
);
create index term_results_term_idx on public.term_results(term_id, status);

create table public.skill_ratings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  term_id uuid not null references public.terms(id) on delete cascade,
  skill text not null,
  rating smallint not null check (rating between 1 and 5),
  unique (student_id, term_id, skill)
);

create table public.remarks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  term_id uuid not null references public.terms(id) on delete cascade,
  remark_type text not null check (remark_type in ('form_teacher','principal')),
  body text not null,
  author_id uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (student_id, term_id, remark_type)
);

create table public.result_tokens (
  id uuid primary key default gen_random_uuid(),
  serial text not null unique,
  pin_hash text not null,
  student_id uuid references public.students(id) on delete cascade,
  term_id uuid references public.terms(id) on delete cascade,
  max_uses int not null default 5 check (max_uses > 0),
  uses int not null default 0 check (uses >= 0),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_arm_id uuid not null references public.class_arms(id) on delete cascade,
  date date not null,
  status text not null check (status in ('present','absent','late','excused')),
  marked_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (student_id, date)
);
create index attendance_date_idx on public.attendance(date, class_arm_id);

-- ---------------------------------------------------------------------------
-- Fees and payments
-- ---------------------------------------------------------------------------
create table public.fee_items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null default 'tuition',
  is_compulsory boolean not null default true
);

create table public.fee_structures (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.terms(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  fee_item_id uuid not null references public.fee_items(id) on delete restrict,
  amount_kobo bigint not null check (amount_kobo >= 0),
  boarding_status text check (boarding_status in ('day','boarding')),
  student_type text check (student_type in ('new','returning'))
);
create unique index fee_structures_uniq on public.fee_structures(term_id, class_id, fee_item_id, coalesce(boarding_status, '*'), coalesce(student_type, '*'));

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null unique,
  student_id uuid not null references public.students(id) on delete restrict,
  term_id uuid references public.terms(id) on delete restrict,
  total_kobo bigint not null default 0 check (total_kobo >= 0),
  discount_kobo bigint not null default 0 check (discount_kobo >= 0),
  paid_kobo bigint not null default 0 check (paid_kobo >= 0),
  status text not null default 'unpaid' check (status in ('unpaid','part_paid','paid','cancelled')),
  due_date date,
  created_at timestamptz not null default now(),
  check (discount_kobo + paid_kobo <= total_kobo)
);
create index invoices_student_idx on public.invoices(student_id);
create index invoices_term_status_idx on public.invoices(term_id, status);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  fee_item_id uuid references public.fee_items(id) on delete set null,
  description text not null,
  amount_kobo bigint not null check (amount_kobo >= 0)
);

create table public.discounts (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  kind text not null check (kind in ('scholarship','sibling','staff_child','waiver','other')),
  description text,
  amount_kobo bigint not null check (amount_kobo > 0),
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete restrict,
  amount_kobo bigint not null check (amount_kobo > 0),
  method text not null check (method in ('cash','bank_transfer','pos','cheque','paystack','flutterwave')),
  reference text,
  bank text,
  payer_name text,
  paid_at timestamptz not null default now(),
  status text not null default 'confirmed' check (status in ('pending','confirmed','reversed')),
  reversal_reason text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index payments_reference_uniq on public.payments(method, reference) where reference is not null;
create index payments_paid_at_idx on public.payments(paid_at);

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null unique references public.payments(id) on delete restrict,
  receipt_no text not null unique,
  issued_at timestamptz not null default now()
);

create table public.number_counters (
  scope text not null,
  year int not null,
  last_no int not null default 0,
  primary key (scope, year)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  vendor text,
  description text not null,
  amount_kobo bigint not null check (amount_kobo > 0),
  expense_date date not null default current_date,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  attachment_url text,
  recorded_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Payroll
-- ---------------------------------------------------------------------------
create table public.salary_structures (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null unique references public.staff(id) on delete cascade,
  basic_kobo bigint not null check (basic_kobo >= 0),
  allowances jsonb not null default '{}'::jsonb,
  deductions jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  period_month date not null unique check (extract(day from period_month) = 1),
  status text not null default 'draft' check (status in ('draft','prepared','approved','paid')),
  total_gross_kobo bigint not null default 0,
  total_net_kobo bigint not null default 0,
  prepared_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  paid_at timestamptz,
  payment_method text,
  payment_reference text,
  created_at timestamptz not null default now()
);

create table public.payslips (
  id uuid primary key default gen_random_uuid(),
  payroll_run_id uuid not null references public.payroll_runs(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete restrict,
  gross_kobo bigint not null check (gross_kobo >= 0),
  deductions_kobo bigint not null check (deductions_kobo >= 0),
  net_kobo bigint not null check (net_kobo >= 0),
  breakdown jsonb not null default '{}'::jsonb,
  unique (payroll_run_id, staff_id)
);

create table public.staff_loans (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  kind text not null default 'loan' check (kind in ('loan','advance')),
  principal_kobo bigint not null check (principal_kobo > 0),
  monthly_deduction_kobo bigint not null check (monthly_deduction_kobo > 0),
  balance_kobo bigint not null check (balance_kobo >= 0),
  status text not null default 'active' check (status in ('active','settled','cancelled')),
  created_at timestamptz not null default now()
);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  leave_type text not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

-- ---------------------------------------------------------------------------
-- Communication, admissions and CMS
-- ---------------------------------------------------------------------------
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null default 'all' check (audience in ('all','staff','teacher','parent','student','public')),
  class_arm_id uuid references public.class_arms(id) on delete cascade,
  is_banner boolean not null default false,
  publish_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  first_name text not null,
  middle_name text,
  last_name text not null,
  gender text not null check (gender in ('male','female')),
  date_of_birth date,
  class_applied text not null,
  previous_school text,
  guardian_name text not null,
  guardian_relationship text,
  guardian_phone text not null,
  guardian_email text,
  guardian_address text,
  boarding_status text not null default 'day' check (boarding_status in ('day','boarding')),
  exam_date date,
  exam_score numeric(5,2),
  status text not null default 'applied' check (status in ('applied','screened','entrance_exam','offered','accepted','enrolled','rejected')),
  notes text,
  documents jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index applications_status_idx on public.applications(status);

create table public.news (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text not null,
  cover_url text,
  category text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);
create index events_starts_idx on public.events(starts_at);

create table public.gallery_albums (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  cover_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.gallery_albums(id) on delete cascade,
  kind text not null default 'image' check (kind in ('image','video')),
  url text not null,
  caption text,
  sort_order int not null default 0
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text check (char_length(email) <= 200),
  phone text check (char_length(phone) <= 30),
  subject text check (char_length(subject) <= 200),
  message text not null check (char_length(message) between 5 and 5000),
  created_at timestamptz not null default now()
);

create table public.vacancies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text,
  employment_type text not null default 'full_time',
  description text not null,
  requirements text,
  closes_on date,
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  vacancy_id uuid references public.vacancies(id) on delete set null,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (char_length(email) <= 200),
  phone text check (char_length(phone) <= 30),
  qualification text check (char_length(qualification) <= 300),
  cover_letter text check (char_length(cover_letter) <= 5000),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs(created_at desc);
create index audit_logs_table_idx on public.audit_logs(table_name, record_id);

commit;
