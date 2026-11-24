-- demo_academics.sql — Phase 2 demo data: elective registrations and enrolment history.
-- Idempotent: safe to re-run. Requires demo.sql.

begin;

-- JSS students take every optional subject offered to their class.
insert into public.student_subjects (student_id, subject_id, session_id)
select st.id, cs.subject_id, se.id
from public.students st
join public.class_arms ca on ca.id = st.class_arm_id
join public.classes c on c.id = ca.class_id and c.level_group = 'junior'
join public.class_subjects cs on cs.class_id = c.id and not cs.is_compulsory
cross join (select id from public.sessions where is_current) se
where st.status = 'active'
on conflict do nothing;

-- SS students pick three of the six electives, rotated by admission number.
insert into public.student_subjects (student_id, subject_id, session_id)
select x.student_id, x.subject_id, se.id
from (
  select st.id as student_id, cs.subject_id,
         row_number() over (partition by st.id order by s.name) as rn,
         (abs(hashtext(st.admission_no)) % 2) as track
  from public.students st
  join public.class_arms ca on ca.id = st.class_arm_id
  join public.classes c on c.id = ca.class_id and c.level_group = 'senior'
  join public.class_subjects cs on cs.class_id = c.id and not cs.is_compulsory
  join public.subjects s on s.id = cs.subject_id
  where st.status = 'active'
) x
cross join (select id from public.sessions where is_current) se
where (x.track = 0 and x.rn in (1, 3, 5)) or (x.track = 1 and x.rn in (2, 4, 6))
on conflict do nothing;

-- One "enrolled" history row per student.
insert into public.student_class_history (student_id, session_id, to_class_arm_id, action, note, performed_by, created_at)
select st.id, se.id, st.class_arm_id, 'enrolled', 'Demo enrolment', null, coalesce(st.admitted_on::timestamptz, now())
from public.students st
cross join (select id from public.sessions where is_current) se
where not exists (select 1 from public.student_class_history h where h.student_id = st.id);

insert into public.settings (key, value) values ('staff_prefix', '"STF"')
on conflict (key) do nothing;

commit;
