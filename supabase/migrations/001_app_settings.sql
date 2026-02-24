-- Supabase SQL Editor에서 실행
-- 책장 배열 등 앱 설정 저장 (키-값)

create table if not exists app_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- 기본 행/열 6x6
insert into app_settings (key, value)
values ('book_arrangement', '{"rows": 6, "cols": 6}')
on conflict (key) do nothing;

-- 테마: "light" | "dark" | "system" (system = OS 설정 따름)
insert into app_settings (key, value)
values ('theme', '"system"')
on conflict (key) do nothing;

-- RLS: anon으로 읽기/쓰기 (비밀번호 로그인만 쓰므로 앱 접근자만 사용)
alter table app_settings enable row level security;

drop policy if exists "Allow anon read" on app_settings;
create policy "Allow anon read" on app_settings for select using (true);

drop policy if exists "Allow anon upsert" on app_settings;
create policy "Allow anon upsert" on app_settings for all using (true) with check (true);
