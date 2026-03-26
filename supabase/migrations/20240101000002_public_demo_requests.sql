create table if not exists public_demo_requests (
  id uuid default gen_random_uuid() primary key,
  ip_address text not null,
  product text,
  platform text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_demo_requests_ip_date
  on public_demo_requests (ip_address, created_at);

alter table public_demo_requests enable row level security;

create policy "service role only" on public_demo_requests
  for all using (false);
