-- 책 페이지 (포토카드북은 페이지 단위 구조, 기본 10매)
create table if not exists book_pages (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  page_order int not null default 0,
  label text default '',
  created_at timestamptz default now(),
  unique(book_id, page_order)
);

create index if not exists idx_book_pages_book_id on book_pages(book_id);

alter table book_pages enable row level security;

drop policy if exists "Allow anon read" on book_pages;
create policy "Allow anon read" on book_pages for select using (true);

drop policy if exists "Allow anon insert" on book_pages;
create policy "Allow anon insert" on book_pages for insert with check (true);

drop policy if exists "Allow anon update" on book_pages;
create policy "Allow anon update" on book_pages for update using (true);

drop policy if exists "Allow anon delete" on book_pages;
create policy "Allow anon delete" on book_pages for delete using (true);

-- 이미 테이블이 있어도 label 컬럼 없으면 추가 (기존 쿼리 한 번만 실행하면 됨)
alter table book_pages add column if not exists label text default '';
