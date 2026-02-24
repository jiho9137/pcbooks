-- 책 목록 (책장에 올라갈 책)
create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  booktype_id text not null,
  cardtype_id text not null,
  cards_per_side_rows int,
  cards_per_side_cols int,
  created_at timestamptz default now()
);

alter table books enable row level security;

drop policy if exists "Allow anon read" on books;
create policy "Allow anon read" on books for select using (true);

drop policy if exists "Allow anon insert" on books;
create policy "Allow anon insert" on books for insert with check (true);

drop policy if exists "Allow anon update" on books;
create policy "Allow anon update" on books for update using (true);

drop policy if exists "Allow anon delete" on books;
create policy "Allow anon delete" on books for delete using (true);
