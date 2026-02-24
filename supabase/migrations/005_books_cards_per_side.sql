-- 책별 한 면당 카드 수 (가로·세로). null이면 북타입 기본값 사용
alter table books add column if not exists cards_per_side_rows int;
alter table books add column if not exists cards_per_side_cols int;
