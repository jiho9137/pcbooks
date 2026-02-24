import { bookTypes } from "@/booktype";
import { cardTypes } from "@/cardtype";
import { cardTypes2 } from "@/cardtype2";
import { cardTypes3 } from "@/cardtype3";
import type { CardTypeModuleId } from "@/booktype/types";

export type CardTypeItem = (typeof cardTypes)[number];

const byModule: Record<CardTypeModuleId, readonly CardTypeItem[]> = {
  cardtype: cardTypes,
  cardtype2: cardTypes2 as unknown as readonly CardTypeItem[],
  cardtype3: cardTypes3 as unknown as readonly CardTypeItem[],
};

/** 선택한 책 타입에 따라 고를 수 있는 카드타입 목록 */
export function getCardTypesForBookType(bookTypeId: string): CardTypeItem[] {
  const bt = bookTypes.find((b) => b.definition.id === bookTypeId);
  const moduleId = bt?.definition.cardTypeModule ?? "cardtype";
  return [...byModule[moduleId]];
}

/** 모든 카드타입 (책 설정/책 보기에서 cardtype_id로 찾을 때 사용) */
export function getAllCardTypes(): CardTypeItem[] {
  return [
    ...cardTypes,
    ...(cardTypes2 as unknown as CardTypeItem[]),
    ...(cardTypes3 as unknown as CardTypeItem[]),
  ];
}

/** cardtype_id로 카드타입 찾기 */
export function findCardTypeById(id: string): CardTypeItem | undefined {
  return getAllCardTypes().find((c) => c.definition.id === id);
}
