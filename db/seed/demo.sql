-- demo.sql — demo school data: 1 session, 6 classes x 2 arms, 15 subjects, 60 students,
-- 8 teachers (+3 admin/bursar staff), scores, fee structures, invoices, payments and payroll.
-- Skips itself if a session already exists. Requires core.sql and the config sync to have run.

begin;

do $$
declare
  v_session uuid; t1 uuid; t2 uuid; t3 uuid;
  v_ca1 uuid; v_ca2 uuid; v_exam uuid;
  r record; s record; i int; v_id uuid; v_inv uuid; v_total bigint; v_amt bigint;
  v_guardian uuid; v_ability numeric; v_day date;
  male_names text[] := array['Chinedu','Tunde','Ibrahim','Emeka','Oluwaseun','Musa','Ikenna','Femi','Abdullahi','Obinna',
                             'Kelechi','Segun','Yusuf','Chukwuma','Damilare','Usman','Nnamdi','Babatunde','Sani','Kunle',
                             'Uche','Ayodeji','Aliyu','Ebuka','Tobi','Hassan','Chidi','Gbenga','Bello','Somto'];
  female_names text[] := array['Adaeze','Folake','Aisha','Ngozi','Temitope','Zainab','Chiamaka','Funmilayo','Hauwa','Ifeoma',
                               'Bisola','Amina','Nneka','Yetunde','Fatima','Chioma','Kemi','Halima','Ebere','Titilayo',
                               'Oluchi','Morenike','Khadija','Amarachi','Bukola','Rukayat','Ogechi','Simisola','Maryam','Ijeoma'];
  last_names text[] := array['Okafor','Adeyemi','Bello','Eze','Ogunleye','Musa','Nwosu','Bakare','Abubakar','Okonkwo',
                             'Adebayo','Ibrahim','Obi','Olawale','Danjuma','Nwachukwu','Ajayi','Sule','Chukwu','Oyelaran',
                             'Umeh','Akinola','Garba','Onyeka','Fashola','Lawal','Ekwueme','Oladipo','Yakubu','Anyanwu'];
  states text[] := array['Lagos','Ogun','Oyo','Anambra','Enugu','Kano','Kaduna','Rivers','Imo','Kwara','Edo','Abuja (FCT)'];
  methods text[] := array['bank_transfer','cash','pos','paystack','bank_transfer','cheque'];
  class_arm_ids uuid[];
  ca_class_level text[];
  ca_class_year int[];
begin
  if exists (select 1 from public.sessions) then
    raise notice 'Demo data already present — skipping';
    return;
  end if;

  select id into v_ca1 from public.assessment_components where key = 'ca1';
  select id into v_ca2 from public.assessment_components where key = 'ca2';
  select id into v_exam from public.assessment_components where is_exam limit 1;
  if v_ca1 is null or v_ca2 is null or v_exam is null then
    raise exception 'Demo seed expects assessment components ca1, ca2 and an exam (default config)';
  end if;

  perform setseed(0.42);

  -- Session and terms ---------------------------------------------------------
  insert into public.sessions (name, start_date, end_date, is_current)
  values ('2026/2027', '2026-09-14', '2027-07-23', true) returning id into v_session;
  insert into public.terms (session_id, name, term_number, start_date, end_date, next_term_begins, school_days, is_current)
  values (v_session, 'First Term', 1, '2026-09-14', '2026-12-18', '2027-01-11', 65, true) returning id into t1;
  insert into public.terms (session_id, name, term_number, start_date, end_date, next_term_begins, school_days)
  values (v_session, 'Second Term', 2, '2027-01-11', '2027-04-09', '2027-04-26', 62) returning id into t2;
  insert into public.terms (session_id, name, term_number, start_date, end_date, next_term_begins, school_days)
  values (v_session, 'Third Term', 3, '2027-04-26', '2027-07-23', '2027-09-13', 60) returning id into t3;

  -- Classes, arms, class arms ------------------------------------------------
  insert into public.classes (name, level_group, sort_order) values
    ('JSS 1','junior',1), ('JSS 2','junior',2), ('JSS 3','junior',3),
    ('SS 1','senior',4), ('SS 2','senior',5), ('SS 3','senior',6);
  insert into public.arms (name) values ('Gold'), ('Diamond');
  insert into public.class_arms (class_id, arm_id, capacity)
  select c.id, a.id, 35 from public.classes c cross join public.arms a;

  -- Subjects ------------------------------------------------------------------
  insert into public.subjects (name, code, category, department) values
    ('English Language','ENG','core','Languages'),
    ('Mathematics','MTH','core','Sciences'),
    ('Basic Science','BSC','core','Sciences'),
    ('Basic Technology','BTE','core','Sciences'),
    ('Social Studies','SOS','core','Arts'),
    ('Civic Education','CVE','core','Arts'),
    ('Christian Religious Studies','CRS','religious','Arts'),
    ('Agricultural Science','AGR','elective','Sciences'),
    ('Computer Studies','CMP','core','Sciences'),
    ('Physics','PHY','elective','Sciences'),
    ('Chemistry','CHM','elective','Sciences'),
    ('Biology','BIO','core','Sciences'),
    ('Economics','ECO','elective','Commercial'),
    ('Literature-in-English','LIT','elective','Arts'),
    ('Government','GOV','elective','Arts');

  insert into public.class_subjects (class_id, subject_id, is_compulsory)
  select c.id, sub.id, sub.category = 'core'
  from public.classes c join public.subjects sub on
    (c.level_group = 'junior' and sub.code in ('ENG','MTH','BSC','BTE','SOS','CVE','CRS','AGR','CMP'))
    or (c.level_group = 'senior' and sub.code in ('ENG','MTH','CVE','AGR','CMP','PHY','CHM','BIO','ECO','LIT','GOV'));

  -- Staff ---------------------------------------------------------------------
  insert into public.staff (staff_no, title, first_name, last_name, email, phone, gender, qualification, trcn_number,
                            department, position, staff_type, date_employed, bank_name, account_number, account_name) values
    ('STF/001','Dr.','Olufemi','Adekunle','principal@brightfield.edu.ng','08031234501','male','Ph.D Educational Administration','TRCN/0012345','Administration','Principal','teaching','2012-09-01','Access Bank','0123456781','Olufemi Adekunle'),
    ('STF/002','Mrs.','Bolanle','Okoro','vp@brightfield.edu.ng','08031234502','female','M.Ed Curriculum Studies','TRCN/0023456','Administration','Vice Principal (Academics)','teaching','2014-01-10','GTBank','0123456782','Bolanle Okoro'),
    ('STF/003','Mr.','Samuel','Etim','bursar@brightfield.edu.ng','08031234503','male','B.Sc Accounting, ICAN','','Accounts','Bursar','non_teaching','2016-05-02','Zenith Bank','0123456783','Samuel Etim'),
    ('STF/004','Mrs.','Folake','Adeyemi','f.adeyemi@brightfield.edu.ng','08031234504','female','B.A (Ed) English','TRCN/0034567','Languages','Head, Languages','teaching','2015-09-07','First Bank','0123456784','Folake Adeyemi'),
    ('STF/005','Mr.','Chinedu','Okafor','c.okafor@brightfield.edu.ng','08031234505','male','B.Sc (Ed) Mathematics','TRCN/0045678','Sciences','Mathematics Teacher','teaching','2017-09-11','UBA','0123456785','Chinedu Okafor'),
    ('STF/006','Mr.','Ibrahim','Musa','i.musa@brightfield.edu.ng','08031234506','male','B.Sc Physics, PGDE','TRCN/0056789','Sciences','Physics Teacher','teaching','2018-01-08','Access Bank','0123456786','Ibrahim Musa'),
    ('STF/007','Mrs.','Ngozi','Eze','n.eze@brightfield.edu.ng','08031234507','female','B.Sc (Ed) Chemistry','TRCN/0067890','Sciences','Head, Sciences','teaching','2016-09-05','GTBank','0123456787','Ngozi Eze'),
    ('STF/008','Miss','Aisha','Bello','a.bello@brightfield.edu.ng','08031234508','female','B.Sc Biology, PGDE','TRCN/0078901','Sciences','Biology Teacher','teaching','2020-09-14','Zenith Bank','0123456788','Aisha Bello'),
    ('STF/009','Mr.','Tunde','Bakare','t.bakare@brightfield.edu.ng','08031234509','male','B.Sc Economics, PGDE','TRCN/0089012','Commercial','Economics Teacher','teaching','2019-01-07','First Bank','0123456789','Tunde Bakare'),
    ('STF/010','Mrs.','Grace','Nwosu','g.nwosu@brightfield.edu.ng','08031234510','female','B.A (Ed) Religious Studies','TRCN/0090123','Arts','Head, Arts','teaching','2015-01-12','UBA','0123456790','Grace Nwosu'),
    ('STF/011','Mr.','Emeka','Obi','e.obi@brightfield.edu.ng','08031234511','male','B.Sc Computer Science','TRCN/0101234','Sciences','Computer Studies Teacher','teaching','2021-09-13','Access Bank','0123456791','Emeka Obi');

  -- Teacher assignments by subject code
  insert into public.teacher_assignments (staff_id, class_arm_id, subject_id, session_id)
  select st.id, ca.id, sub.id, v_session
  from public.class_arms ca
  join public.class_subjects cs on cs.class_id = ca.class_id
  join public.subjects sub on sub.id = cs.subject_id
  join public.staff st on st.staff_no = case sub.code
      when 'ENG' then 'STF/004' when 'LIT' then 'STF/004'
      when 'MTH' then 'STF/005'
      when 'PHY' then 'STF/006' when 'BTE' then 'STF/006'
      when 'CHM' then 'STF/007' when 'BSC' then 'STF/007'
      when 'BIO' then 'STF/008' when 'AGR' then 'STF/008'
      when 'ECO' then 'STF/009' when 'GOV' then 'STF/009'
      when 'CVE' then 'STF/010' when 'SOS' then 'STF/010' when 'CRS' then 'STF/010'
      when 'CMP' then 'STF/011' end;

  -- Form teachers, rotating across the 8 subject teachers
  select array_agg(ca.id order by c.sort_order, a.name desc), array_agg(c.level_group order by c.sort_order, a.name desc),
         array_agg(2027 - c.sort_order order by c.sort_order, a.name desc)
    into class_arm_ids, ca_class_level, ca_class_year
  from public.class_arms ca join public.classes c on c.id = ca.class_id join public.arms a on a.id = ca.arm_id;

  for i in 1..array_length(class_arm_ids, 1) loop
    update public.class_arms set form_teacher_id =
      (select id from public.staff where staff_no = 'STF/' || lpad((4 + ((i - 1) % 8))::text, 3, '0'))
    where id = class_arm_ids[i];
  end loop;

  -- Students and guardians (5 per class arm) ---------------------------------
  for i in 1..60 loop
    insert into public.students (admission_no, first_name, last_name, gender, date_of_birth, state_of_origin, religion,
                                 blood_group, genotype, class_arm_id, house, boarding_status, student_type, admitted_on)
    values (
      public.generate_admission_no(ca_class_year[((i - 1) / 5) + 1]),
      case when i % 2 = 0 then female_names[((i - 1) / 2) % 30 + 1] else male_names[((i - 1) / 2) % 30 + 1] end,
      last_names[((i * 7) % 30) + 1],
      case when i % 2 = 0 then 'female' else 'male' end,
      make_date(ca_class_year[((i - 1) / 5) + 1] - 11, ((i * 5) % 12) + 1, ((i * 3) % 27) + 1),
      states[(i % 12) + 1],
      case when i % 3 = 0 then 'Islam' else 'Christianity' end,
      (array['O+','A+','B+','O-','AB+'])[(i % 5) + 1],
      (array['AA','AS','AA','AA','AC'])[(i % 5) + 1],
      class_arm_ids[((i - 1) / 5) + 1],
      (array['Blue House','Green House','Red House','Yellow House'])[(i % 4) + 1],
      case when i % 4 = 0 then 'boarding' else 'day' end,
      case when ((i - 1) / 5) + 1 <= 2 then 'new' else 'returning' end,
      make_date(ca_class_year[((i - 1) / 5) + 1], 9, 14)
    ) returning id into v_id;

    if i = 13 then
      -- Guardian of student 1 also has a child in JSS 2: one guardian, multiple children.
      select sg.guardian_id into v_guardian from public.student_guardians sg
      join public.students st on st.id = sg.student_id order by st.created_at limit 1;
    else
      insert into public.guardians (full_name, phone, email, address, occupation)
      values (
        (case when i % 3 = 0 then 'Mrs. ' else 'Mr. ' end) || (case when i % 2 = 0 then male_names[(i % 30) + 1] else female_names[(i % 30) + 1] end) || ' ' || last_names[((i * 7) % 30) + 1],
        '080' || lpad((40000000 + i * 1371)::text, 8, '0'),
        'guardian' || i || '@mail.brightfield.edu.ng',
        (i * 3) || ' Adeola Odeku Street, Victoria Island, Lagos',
        (array['Civil Servant','Trader','Engineer','Doctor','Lawyer','Banker','Entrepreneur'])[(i % 7) + 1]
      ) returning id into v_guardian;
    end if;
    insert into public.student_guardians (student_id, guardian_id, relationship, is_primary)
    values (v_id, v_guardian, case when i % 3 = 0 then 'Mother' else 'Father' end, true);
  end loop;

  -- Scores for First Term --------------------------------------------------------
  for s in select st.id, st.class_arm_id, ca.class_id from public.students st join public.class_arms ca on ca.id = st.class_arm_id loop
    v_ability := 45 + random() * 45;
    insert into public.scores (student_id, subject_id, term_id, component_id, score)
    select s.id, cs.subject_id, t1, comp.id,
           round(least(comp.max_score, greatest(comp.max_score * 0.15,
                 comp.max_score * (v_ability + (random() - 0.5) * 30) / 100))::numeric, 0)
    from public.class_subjects cs
    cross join (select id, max_score from public.assessment_components where id in (v_ca1, v_ca2, v_exam)) comp
    where cs.class_id = s.class_id;
  end loop;

  -- Attendance: last 10 school days up to the seed date ----------------------------
  for v_day in select d::date from generate_series(date '2026-11-11', date '2026-11-24', interval '1 day') d
               where extract(isodow from d) < 6 loop
    insert into public.attendance (student_id, class_arm_id, date, status)
    select st.id, st.class_arm_id, v_day,
           case when random() < 0.90 then 'present' when random() < 0.5 then 'late' else 'absent' end
    from public.students st;
  end loop;

  -- Term results, positions and remarks -------------------------------------------
  insert into public.term_results (student_id, term_id, class_arm_id, total_score, average, days_present, days_absent, status, published_at)
  select st.id, t1, st.class_arm_id, x.total, round(x.total / nullif(x.n_subjects, 0), 2),
         55 + (abs(hashtext(st.id::text)) % 10), 10 - (abs(hashtext(st.id::text)) % 10), 'published', now() - interval '2 days'
  from public.students st
  join (select student_id, sum(score) total, count(distinct subject_id) n_subjects
        from public.scores where term_id = t1 group by student_id) x on x.student_id = st.id;

  update public.term_results tr set position = ranked.pos, number_in_class = ranked.n
  from (select id, rank() over (partition by class_arm_id order by average desc) pos,
               count(*) over (partition by class_arm_id) n
        from public.term_results where term_id = t1) ranked
  where ranked.id = tr.id;

  insert into public.remarks (student_id, term_id, remark_type, body)
  select student_id, t1, 'form_teacher', case
      when average >= 75 then 'An outstanding term. Keep up the excellent work and continue to lead by example.'
      when average >= 60 then 'A very good performance. With more consistency you will excel further.'
      when average >= 50 then 'A fair result. More focus on assignments and revision will improve your grades.'
      else 'Below expectation. Please give more attention to your studies and seek help from your teachers.' end
  from public.term_results where term_id = t1
  union all
  select student_id, t1, 'principal', case
      when average >= 70 then 'Excellent result. Well done.'
      when average >= 50 then 'Good effort. Aim higher next term.'
      else 'You can do better. Work harder next term.' end
  from public.term_results where term_id = t1;

  insert into public.skill_ratings (student_id, term_id, skill, rating)
  select st.id, t1, sk, 3 + floor(random() * 3)::int
  from public.students st cross join unnest(array['Punctuality','Neatness','Honesty','Leadership','Sports','Handwriting']) sk;

  -- Result-checker tokens for the first five students -------------------------------
  insert into public.result_tokens (serial, pin_hash, student_id, term_id, max_uses)
  select 'RC2026-' || lpad(rn::text, 4, '0'),
         extensions.crypt(lpad(((rn * 137911) % 1000000)::text, 6, '0'), extensions.gen_salt('bf')),
         id, t1, 5
  from (select id, row_number() over (order by created_at, admission_no) rn from public.students) x where rn <= 5;

  -- Fees ---------------------------------------------------------------------------
  insert into public.fee_items (name, category, is_compulsory) values
    ('Tuition','tuition',true), ('Development Levy','levy',true), ('PTA Levy','levy',true),
    ('ICT Fee','tuition',true), ('Extra Lessons','lesson',false), ('Boarding Fee','boarding',true),
    ('WAEC/NECO Registration','exam',true);

  insert into public.fee_structures (term_id, class_id, fee_item_id, amount_kobo, boarding_status)
  select tm.id, c.id, fi.id,
         case fi.name
           when 'Tuition' then case when c.level_group = 'junior' then 15000000 else 17500000 end
           when 'Development Levy' then 2000000
           when 'PTA Levy' then 500000
           when 'ICT Fee' then 1000000
           when 'Extra Lessons' then 1500000
           when 'Boarding Fee' then 25000000
           when 'WAEC/NECO Registration' then 3500000 end,
         case when fi.name = 'Boarding Fee' then 'boarding' end
  from public.terms tm cross join public.classes c cross join public.fee_items fi
  where tm.session_id = v_session
    and (fi.name <> 'WAEC/NECO Registration' or (c.name = 'SS 3' and tm.term_number = 1));

  i := 0;
  for s in select st.id, st.boarding_status, ca.class_id from public.students st
           join public.class_arms ca on ca.id = st.class_arm_id order by st.created_at, st.admission_no loop
    i := i + 1;
    insert into public.invoices (invoice_no, student_id, term_id, due_date)
    values (public.generate_invoice_no(), s.id, t1, '2026-10-02') returning id into v_inv;

    insert into public.invoice_items (invoice_id, fee_item_id, description, amount_kobo)
    select v_inv, fi.id, fi.name, fs.amount_kobo
    from public.fee_structures fs join public.fee_items fi on fi.id = fs.fee_item_id
    where fs.term_id = t1 and fs.class_id = s.class_id and fi.is_compulsory
      and (fs.boarding_status is null or fs.boarding_status = s.boarding_status);

    select coalesce(sum(amount_kobo), 0) into v_total from public.invoice_items where invoice_id = v_inv;
    update public.invoices set total_kobo = v_total where id = v_inv;

    if i % 10 = 7 then
      insert into public.discounts (invoice_id, kind, description, amount_kobo)
      values (v_inv, 'sibling', '10% sibling discount on tuition', 1500000);
      update public.invoices set discount_kobo = 1500000 where id = v_inv;
      v_total := v_total - 1500000;
    end if;

    if i % 4 = 0 then
      insert into public.payments (invoice_id, student_id, amount_kobo, method, reference, payer_name, paid_at)
      values (v_inv, s.id, v_total, methods[(i % 6) + 1], 'DEMO-' || i || '-A', 'Guardian of student ' || i,
              timestamptz '2026-09-10 10:00+01' + (i || ' days')::interval);
    elsif i % 4 = 1 then
      v_amt := (v_total / 2 / 100) * 100;
      insert into public.payments (invoice_id, student_id, amount_kobo, method, reference, payer_name, paid_at)
      values (v_inv, s.id, v_amt, methods[(i % 6) + 1], 'DEMO-' || i || '-A', 'Guardian of student ' || i,
              timestamptz '2026-09-15 11:30+01' + (i || ' days')::interval);
    elsif i % 4 = 2 then
      v_amt := (v_total * 6 / 10 / 100) * 100;
      insert into public.payments (invoice_id, student_id, amount_kobo, method, reference, payer_name, paid_at)
      values (v_inv, s.id, v_amt, methods[(i % 6) + 1], 'DEMO-' || i || '-A', 'Guardian of student ' || i,
              timestamptz '2026-09-08 09:00+01' + (i || ' days')::interval);
      insert into public.payments (invoice_id, student_id, amount_kobo, method, reference, payer_name, paid_at)
      values (v_inv, s.id, v_total - v_amt, methods[((i + 1) % 6) + 1], 'DEMO-' || i || '-B', 'Guardian of student ' || i,
              timestamptz '2026-10-20 14:00+01' + (i || ' days')::interval);
    end if;
  end loop;

  insert into public.expenses (category, vendor, description, amount_kobo, expense_date, status) values
    ('Fuel','Total Energies, Lekki','Diesel for generator (2,000 litres)', 240000000, '2026-09-18', 'approved'),
    ('Maintenance','Kola Builders Ltd','Repainting of JSS block', 85000000, '2026-09-25', 'approved'),
    ('Stationery','Gbenga Stationers','Exercise books and chalk for First Term', 42000000, '2026-09-12', 'approved'),
    ('Utilities','Eko Electricity (EKEDC)','Electricity bill — September', 38500000, '2026-10-03', 'approved'),
    ('Events','Royal Sound Hire','Inter-house sports PA system', 15000000, '2026-10-30', 'approved'),
    ('Fuel','Total Energies, Lekki','Diesel for generator (1,500 litres)', 180000000, '2026-10-22', 'approved'),
    ('Utilities','Eko Electricity (EKEDC)','Electricity bill — October', 41200000, '2026-11-04', 'approved'),
    ('Maintenance','CoolAir Services','Laboratory air-conditioner servicing', 27500000, '2026-11-12', 'pending');

  -- Payroll --------------------------------------------------------------------
  insert into public.salary_structures (staff_id, basic_kobo, allowances, deductions)
  select st.id,
         case st.staff_no when 'STF/001' then 45000000 when 'STF/002' then 32000000 when 'STF/003' then 28000000
              else 18000000 + (abs(hashtext(st.staff_no)) % 6) * 1000000 end,
         jsonb_build_object('housing', 4000000, 'transport', 2000000,
                            'responsibility', case when st.position ilike 'head%' or st.position ilike '%principal%' or st.position = 'Bursar' then 3000000 else 0 end),
         jsonb_build_object('pension_rate', 0.08, 'paye_rate', 0.07, 'cooperative', 500000)
  from public.staff st;

  insert into public.staff_loans (staff_id, kind, principal_kobo, monthly_deduction_kobo, balance_kobo)
  select id, 'advance', 6000000, 2000000, 4000000 from public.staff where staff_no = 'STF/008';

  insert into public.payroll_runs (period_month, status, paid_at, payment_method, payment_reference)
  values ('2026-10-01', 'paid', '2026-10-28 15:00+01', 'bank_transfer', 'PAY-OCT-2026'),
         ('2026-11-01', 'prepared', null, null, null);

  insert into public.payslips (payroll_run_id, staff_id, gross_kobo, deductions_kobo, net_kobo, breakdown)
  select pr.id, ss.staff_id, g.gross, d.ded, g.gross - d.ded,
         jsonb_build_object('basic', ss.basic_kobo, 'allowances', ss.allowances,
                            'pension', round(ss.basic_kobo * 0.08), 'paye', round(g.gross * 0.07),
                            'cooperative', 500000, 'loan', coalesce(l.monthly_deduction_kobo, 0))
  from public.payroll_runs pr
  cross join public.salary_structures ss
  left join public.staff_loans l on l.staff_id = ss.staff_id and l.status = 'active'
  cross join lateral (select ss.basic_kobo + (ss.allowances->>'housing')::bigint + (ss.allowances->>'transport')::bigint
                             + (ss.allowances->>'responsibility')::bigint as gross) g
  cross join lateral (select round(ss.basic_kobo * 0.08)::bigint + round(g.gross * 0.07)::bigint + 500000
                             + coalesce(l.monthly_deduction_kobo, 0) as ded) d;

  update public.payroll_runs pr set total_gross_kobo = x.g, total_net_kobo = x.n
  from (select payroll_run_id, sum(gross_kobo) g, sum(net_kobo) n from public.payslips group by payroll_run_id) x
  where x.payroll_run_id = pr.id and pr.status <> 'paid';
  -- Paid runs are locked by trigger; set their totals via a fresh insert-time value instead.
  alter table public.payroll_runs disable trigger payroll_runs_guard;
  update public.payroll_runs pr set total_gross_kobo = x.g, total_net_kobo = x.n
  from (select payroll_run_id, sum(gross_kobo) g, sum(net_kobo) n from public.payslips group by payroll_run_id) x
  where x.payroll_run_id = pr.id and pr.status = 'paid';
  alter table public.payroll_runs enable trigger payroll_runs_guard;

  insert into public.leave_requests (staff_id, leave_type, start_date, end_date, reason)
  select id, 'Casual leave', '2026-12-01', '2026-12-03', 'Family function in Enugu' from public.staff where staff_no = 'STF/009';

  -- Website content ----------------------------------------------------------------
  insert into public.announcements (title, body, audience, is_banner, publish_at, expires_at) values
    ('Admissions for 2027/2028 are now open', 'Entrance examination holds on Saturday, 16 January 2027. Apply online today.', 'public', true, now() - interval '3 days', '2027-01-16'),
    ('First Term examinations begin 30 November', 'Students should check the exam timetable with their form teachers.', 'all', false, now() - interval '5 days', '2026-12-18'),
    ('PTA meeting on Saturday, 5 December', 'All parents are invited to the school hall by 10:00am.', 'parent', false, now() - interval '1 day', '2026-12-06');

  insert into public.news (slug, title, excerpt, body, cover_url, category, is_published, published_at) values
    ('students-win-state-science-quiz', 'Our students win the Lagos State Science Quiz',
     'Three SS 2 students took first place among 48 schools at this year''s competition.',
     'Three of our SS 2 students emerged winners at the Lagos State Inter-Schools Science Quiz, beating 48 schools across the state. The team, coached by the Sciences department, answered rapid-fire questions in Physics, Chemistry and Biology.' || chr(10) || chr(10) || 'The Principal congratulated the students at the Monday assembly and thanked parents for their continued support.',
     '/images/news-science.png', 'Achievements', true, now() - interval '6 days'),
    ('inter-house-sports-2026', 'Inter-house sports: Green House takes the trophy',
     'A colourful day of races, relays and march-past in front of parents and guests.',
     'Our biennial inter-house sports competition held on the school field with all four houses competing in track and field events. Green House emerged overall winners, with Yellow House taking the march-past trophy.',
     '/images/news-sports.png', 'Sports', true, now() - interval '20 days'),
    ('new-ict-laboratory-commissioned', 'New ICT laboratory commissioned',
     'Forty new workstations and fibre internet now support Computer Studies and CBT practice.',
     'The new ICT laboratory was commissioned by the Chairman of the Board of Governors. The lab has forty workstations and fibre internet, and will host Computer Studies classes and JAMB CBT practice sessions.',
     '/images/news-ict.png', 'Facilities', true, now() - interval '34 days'),
    ('waec-2026-results', 'Outstanding 2026 WASSCE results',
     '94% of our candidates obtained five credits and above, including English and Mathematics.',
     'We are proud to announce that 94% of our 2026 WASSCE candidates obtained five credits and above, including English Language and Mathematics. We thank our dedicated teachers and supportive parents.',
     '/images/news-graduation.png', 'Academics', true, now() - interval '60 days');

  insert into public.events (title, description, location, starts_at, ends_at) values
    ('First Term Examinations', 'Examinations for all classes.', 'Examination halls', '2026-11-30 08:00+01', '2026-12-11 14:00+01'),
    ('PTA General Meeting', 'Termly meeting of parents and teachers.', 'School hall', '2026-12-05 10:00+01', '2026-12-05 13:00+01'),
    ('Carol Service and Prize-giving Day', 'End-of-term carols and prizes for outstanding students.', 'School hall', '2026-12-17 11:00+01', '2026-12-17 15:00+01'),
    ('Entrance Examination (2027/2028)', 'Entrance examination for JSS 1 and SS 1 applicants.', 'Main campus', '2027-01-16 09:00+01', '2027-01-16 13:00+01'),
    ('Second Term Resumes', 'Boarders arrive on Sunday 10 January.', 'Main campus', '2027-01-11 07:30+01', null);

  insert into public.gallery_albums (slug, title, description, cover_url) values
    ('campus-life', 'Campus life', 'Everyday moments around the school.', '/images/gallery-classroom.png'),
    ('sports-day', 'Sports day 2026', 'Highlights from the inter-house sports.', '/images/news-sports.png'),
    ('graduation', 'Graduation ceremony', 'Celebrating the Class of 2026.', '/images/news-graduation.png');
  insert into public.gallery_items (album_id, kind, url, caption, sort_order)
  select a.id, 'image', x.url, x.caption, x.ord from public.gallery_albums a
  join (values
    ('campus-life', '/images/gallery-classroom.png', 'Mathematics class in session', 1),
    ('campus-life', '/images/gallery-library.png', 'Reading time in the library', 2),
    ('campus-life', '/images/news-ict.png', 'The new ICT laboratory', 3),
    ('campus-life', '/images/news-science.png', 'Chemistry practical', 4),
    ('sports-day', '/images/news-sports.png', 'Relay race final', 1),
    ('graduation', '/images/news-graduation.png', 'The Class of 2026', 1)
  ) as x(slug, url, caption, ord) on x.slug = a.slug;

  insert into public.vacancies (title, department, employment_type, description, requirements, closes_on) values
    ('Physics Teacher (Senior Secondary)', 'Sciences', 'full_time',
     'Teach Physics to SS 1 to SS 3 students and prepare candidates for WASSCE and NECO.',
     'B.Sc/B.Ed Physics, TRCN registration, minimum 3 years experience.', '2026-12-31'),
    ('School Nurse', 'Health', 'full_time',
     'Run the sick bay, keep health records and support boarding students.',
     'Registered Nurse (RN), minimum 2 years experience.', '2026-12-20');

  insert into public.applications (reference, first_name, last_name, gender, date_of_birth, class_applied, previous_school,
                                   guardian_name, guardian_phone, guardian_email, status, exam_date) values
    ('APP-2026-00001','Daniel','Ogunbiyi','male','2015-03-12','JSS 1','Bright Stars Primary School','Mr. Kunle Ogunbiyi','08051112233','kunle.o@mail.brightfield.edu.ng','entrance_exam','2027-01-16'),
    ('APP-2026-00002','Precious','Ekanem','female','2015-07-02','JSS 1','Holy Child Nursery & Primary','Mrs. Ima Ekanem','08051112234',null,'applied',null),
    ('APP-2026-00003','Abdul','Salami','male','2011-11-20','SS 1','Unity Model College','Alhaji Musa Salami','08051112235',null,'screened',null),
    ('APP-2026-00004','Chisom','Agu','female','2015-01-15','JSS 1','Greenfield Primary School','Dr. Nkem Agu','08051112236',null,'offered','2026-11-14'),
    ('APP-2026-00005','Victor','Ademola','male','2014-09-30','JSS 2','Royal Academy','Mr. Tayo Ademola','08051112237',null,'rejected','2026-11-14');
  insert into public.number_counters (scope, year, last_no) values ('application', 2026, 5)
  on conflict (scope, year) do update set last_no = greatest(public.number_counters.last_no, 5);

  -- Keep payment activity as sample audit history; drop the bulk-seed noise.
  delete from public.audit_logs where table_name <> 'payments';
end $$;

commit;
