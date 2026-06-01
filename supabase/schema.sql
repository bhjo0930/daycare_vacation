create schema if not exists daycare_vacation;

grant usage on schema daycare_vacation to anon, authenticated, service_role;

do $$
begin
  create type daycare_vacation.leave_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type daycare_vacation.leave_type as enum ('annual', 'half_day', 'sick', 'family');
exception
  when duplicate_object then null;
end $$;

create table if not exists daycare_vacation.staff_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  classroom text not null,
  annual_allowance numeric(4, 1) not null default 15,
  used_days numeric(4, 1) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists daycare_vacation.leave_requests (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references daycare_vacation.staff_members(id) on delete cascade,
  type daycare_vacation.leave_type not null default 'annual',
  start_date date not null,
  end_date date not null,
  days numeric(4, 1) not null,
  reason text not null,
  status daycare_vacation.leave_status not null default 'pending',
  substitute text,
  created_at timestamptz not null default now(),
  constraint leave_date_order check (end_date >= start_date),
  constraint leave_days_positive check (days > 0)
);

alter table daycare_vacation.staff_members enable row level security;
alter table daycare_vacation.leave_requests enable row level security;

do $$
begin
  create policy "Authenticated users can read staff"
  on daycare_vacation.staff_members for select
  to authenticated
  using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Authenticated users can manage staff"
  on daycare_vacation.staff_members for all
  to authenticated
  using (true)
  with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Authenticated users can read leave requests"
  on daycare_vacation.leave_requests for select
  to authenticated
  using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Authenticated users can manage leave requests"
  on daycare_vacation.leave_requests for all
  to authenticated
  using (true)
  with check (true);
exception
  when duplicate_object then null;
end $$;

grant select, insert, update, delete on all tables in schema daycare_vacation to authenticated, service_role;
grant usage, select on all sequences in schema daycare_vacation to authenticated, service_role;

insert into daycare_vacation.staff_members (name, role, classroom, annual_allowance, used_days) values
  ('김하늘', '담임교사', '햇살반', 15, 5.5),
  ('이서윤', '보조교사', '햇살반', 12, 4),
  ('박민지', '담임교사', '바다반', 15, 8),
  ('최유진', '조리사', '공용', 12, 3),
  ('정다은', '원장', '관리', 15, 2)
on conflict do nothing;

insert into daycare_vacation.leave_requests (staff_id, type, start_date, end_date, days, reason, status, substitute)
select id, 'annual', '2026-06-05', '2026-06-05', 1, '가족 일정', 'approved', '이서윤'
from daycare_vacation.staff_members
where name = '김하늘'
and not exists (
  select 1 from daycare_vacation.leave_requests
  where staff_id = daycare_vacation.staff_members.id and start_date = '2026-06-05'
);

insert into daycare_vacation.leave_requests (staff_id, type, start_date, end_date, days, reason, status, substitute)
select id, 'annual', '2026-06-12', '2026-06-13', 2, '개인 휴식', 'approved', '대체교사 A'
from daycare_vacation.staff_members
where name = '박민지'
and not exists (
  select 1 from daycare_vacation.leave_requests
  where staff_id = daycare_vacation.staff_members.id and start_date = '2026-06-12'
);

insert into daycare_vacation.leave_requests (staff_id, type, start_date, end_date, days, reason, status)
select id, 'sick', '2026-06-03', '2026-06-03', 1, '진료', 'approved'
from daycare_vacation.staff_members
where name = '최유진'
and not exists (
  select 1 from daycare_vacation.leave_requests
  where staff_id = daycare_vacation.staff_members.id and start_date = '2026-06-03'
);

insert into daycare_vacation.leave_requests (staff_id, type, start_date, end_date, days, reason, status, substitute)
select id, 'half_day', '2026-06-18', '2026-06-18', 0.5, '오전 반차', 'approved', '김하늘'
from daycare_vacation.staff_members
where name = '이서윤'
and not exists (
  select 1 from daycare_vacation.leave_requests
  where staff_id = daycare_vacation.staff_members.id and start_date = '2026-06-18'
);
