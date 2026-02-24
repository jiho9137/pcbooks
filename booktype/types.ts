/**
 * 책 타입 공통 타입
 */
export interface CoverConfig {
  wh: [number, number];
  cover?: string;
  font?: string;
  textPosition?: { x: number; y: number };
}

export interface SpreadConfig {
  /** 내지(스프레드) 캔버스 크기 [가로, 세로] */
  wh: [number, number];
  /** 한 면(페이지)에 들어가는 포토카드 개수 [행, 열] */
  cardsPerSide: [number, number];
  cardArrangement?: string;
  /** true면 양쪽 보기(스프레드), false면 한 쪽만 */
  showSpread: boolean;
}

export interface BookTypeDefinition {
  id: string;
  name: string;
  description?: string;
}
