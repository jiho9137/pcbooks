-- 카드 기준 저장: 한 장의 카드 = 한 행. 카드타입별 세부 데이터는 jsonb.
create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  front_card_type_id text not null default 'cardtype001',
  back_card_type_id text not null default 'cardtype001',
  front_image text,
  back_image text,
  front_show_image boolean not null default true,
  back_show_image boolean not null default true,
  front_filter_color_enabled boolean not null default false,
  back_filter_color_enabled boolean not null default false,
  front_filter_color text not null default '#000000',
  back_filter_color text not null default '#000000',
  front_filter_opacity int not null default 50,
  back_filter_opacity int not null default 50,
  front_card_type_data jsonb default '{}',
  back_card_type_data jsonb default '{}',
  inventory_position int not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_cards_book_id on cards(book_id);

alter table cards enable row level security;

drop policy if exists "Allow anon read" on cards;
create policy "Allow anon read" on cards for select using (true);

drop policy if exists "Allow anon insert" on cards;
create policy "Allow anon insert" on cards for insert with check (true);

drop policy if exists "Allow anon update" on cards;
create policy "Allow anon update" on cards for update using (true);

drop policy if exists "Allow anon delete" on cards;
create policy "Allow anon delete" on cards for delete using (true);
