-- ============================================================
-- Migration: جدول scheduled_posts + cron job للإشعارات
-- تاريخ: 2024-03-28
-- ============================================================

-- ─── 1. إنشاء جدول scheduled_posts ───────────────────────────

create table if not exists scheduled_posts (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade,
  user_email   text not null,
  caption      text not null,
  image_url    text,
  platform     text not null default 'instagram'
                 check (platform in ('instagram', 'tiktok', 'twitter', 'facebook', 'snapchat')),
  scheduled_at timestamptz not null,
  status       text not null default 'pending'
                 check (status in ('pending', 'notified', 'cancelled')),
  notified_at  timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Index على الحالة والوقت (للـ cron query)
create index if not exists idx_scheduled_posts_pending
  on scheduled_posts (scheduled_at, status)
  where status = 'pending';

-- ─── 2. Row Level Security ────────────────────────────────────

alter table scheduled_posts enable row level security;

-- المستخدم يرى ويعدّل منشوراته فقط
create policy "user_own_scheduled_posts_select" on scheduled_posts
  for select using (auth.uid() = user_id);

create policy "user_own_scheduled_posts_insert" on scheduled_posts
  for insert with check (auth.uid() = user_id);

create policy "user_own_scheduled_posts_update" on scheduled_posts
  for update using (auth.uid() = user_id);

create policy "user_own_scheduled_posts_delete" on scheduled_posts
  for delete using (auth.uid() = user_id);

-- Service role يملك كل الصلاحيات (للـ edge function)
create policy "service_role_all_scheduled_posts" on scheduled_posts
  for all using (auth.role() = 'service_role');

-- ─── 3. Trigger: auto-update updated_at ──────────────────────

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger scheduled_posts_updated_at
  before update on scheduled_posts
  for each row execute function update_updated_at_column();

-- ─── 4. تفعيل pg_cron و pg_net (Extensions) ──────────────────
-- ملاحظة: يجب تفعيل هذه الـ Extensions من Supabase Dashboard
-- Dashboard → Database → Extensions → pg_cron + pg_net

-- ─── 5. Cron Job — كل 5 دقائق ────────────────────────────────
-- يستدعي edge function notify-scheduled-posts عبر pg_net + pg_cron

-- نحذف أي cron قديم بنفس الاسم أولاً
select cron.unschedule('notify-scheduled-posts') where exists (
  select 1 from cron.job where jobname = 'notify-scheduled-posts'
);

-- جدولة الـ cron
select cron.schedule(
  'notify-scheduled-posts',  -- اسم الـ cron
  '*/5 * * * *',             -- كل 5 دقائق
  $$
  select
    net.http_post(
      url      := (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_URL') || '/functions/v1/notify-scheduled-posts',
      headers  := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY')
      ),
      body     := '{}'::jsonb
    );
  $$
);
