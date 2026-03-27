create table if not exists support_tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  email text,
  title text not null,
  description text not null,
  status text default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table support_tickets enable row level security;

create policy "Users can insert their own tickets" on support_tickets
  for insert with check (auth.uid() = user_id or user_id is null);

create policy "Users can view their own tickets" on support_tickets
  for select using (auth.uid() = user_id);

create policy "Service role full access" on support_tickets
  for all using (true);
