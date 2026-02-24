-- 페이지별 라벨 (윗쪽에 필요시 입력)
alter table book_pages add column if not exists label text default '';
