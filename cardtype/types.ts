/**
 * 포토카드 타입 공통 타입
 * 크기(frontWh, backWh)는 54×86 배수 단위로 사용 (가로=54×n, 세로=86×n)
 */
export interface LayoutConfig {
  /** 앞면 크기 [가로, 세로] — 54×86 배수 */
  frontWh: [number, number];
  /** 뒷면 크기 [가로, 세로] — 54×86 배수 */
  backWh: [number, number];
  subpages?: boolean;
  font?: string;
  textPosition?: { x: number; y: number };
  imagePosition?: { x: number; y: number };
}

export interface CardStyleConfig {
  borderRadius?: number;
  shadow?: boolean;
}

export interface CardTypeDefinition {
  id: string;
  name: string;
  description?: string;
}
