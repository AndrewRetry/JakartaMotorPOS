create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null,
  role       text not null default 'staff' check (role in ('owner','staff')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
-- so that only users with SERVICE_ROLE key can access the table