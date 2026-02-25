/**
 * 책 보기(Book View) 관련 타입.
 * @see docs/refactoring-plan.md Phase 0
 */

export type Book = {
  id: string;
  title: string;
  booktype_id: string;
  cardtype_id: string;
  cards_per_side_rows?: number | null;
  cards_per_side_cols?: number | null;
};

export type BookPage = {
  id: string;
  book_id: string;
  page_order: number;
  label?: string | null;
};

export type InventoryCard = {
  id: string;
  frontCardTypeId: string;
  backCardTypeId: string;
  frontImage?: string | null;
  backImage?: string | null;
  /** 이미지 보기 (기본 true) */
  frontShowImage?: boolean;
  backShowImage?: boolean;
  /** 이미지 위 필터: 색상/투명도 (글씨 가독용) */
  frontFilterColorEnabled?: boolean;
  backFilterColorEnabled?: boolean;
  frontFilterColor?: string;
  backFilterColor?: string;
  frontFilterOpacity?: number;
  backFilterOpacity?: number;
  /** 카드타입별 세부 데이터 (박스타입처럼 JSON). 예: cardtype003 → { caption, tags } */
  frontCardTypeData?: Record<string, unknown> | null;
  backCardTypeData?: Record<string, unknown> | null;
}

export type SlotAssignments = Record<string, (InventoryCard | string | null)[]>;

export type CardSettingsDraft = {
  frontCardTypeId: string;
  backCardTypeId: string;
  frontImage: string | null;
  backImage: string | null;
  frontShowImage: boolean;
  backShowImage: boolean;
  frontFilterColorEnabled: boolean;
  backFilterColorEnabled: boolean;
  frontFilterColor: string;
  backFilterColor: string;
  frontFilterOpacity: number;
  backFilterOpacity: number;
  frontCardTypeData: Record<string, unknown>;
  backCardTypeData: Record<string, unknown>;
};

export type ViewMode = "scroll" | "flip";
