-- 페이지별 슬롯 배치: "이 페이지의 N번 자리에 어떤 카드가 있는지"
create table if not exists page_slots (
  page_id uuid not null references book_pages(id) on delete cascade,
  slot_index int not null,
  card_id uuid references cards(id) on delete set null,
  primary key (page_id, slot_index)
);

create index if not exists idx_page_slots_card_id on page_slots(card_id);

alter table page_slots enable row level security;

drop policy if exists "Allow anon read" on page_slots;
create policy "Allow anon read" on page_slots for select using (true);

drop policy if exists "Allow anon insert" on page_slots;
create policy "Allow anon insert" on page_slots for insert with check (true);

drop policy if exists "Allow anon update" on page_slots;
create policy "Allow anon update" on page_slots for update using (true);

drop policy if exists "Allow anon delete" on page_slots;
create policy "Allow anon delete" on page_slots for delete using (true);
