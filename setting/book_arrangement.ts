/**
 * 책장 그리드 배열 (문서: setting/book_arrangement)
 * 나중에 Supabase user_settings 로 덮어쓸 수 있음
 */
export const bookArrangement = {
  rows: 6,
  cols: 6,
} as const;

export type BookArrangement = typeof bookArrangement;
