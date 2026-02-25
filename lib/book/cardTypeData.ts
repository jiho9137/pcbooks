/**
 * 카드타입별 세부 데이터(JSON) 읽기/쓰기 헬퍼.
 * cardtype003(인스타): { caption, tags }
 */

export type InstagramCardTypeData = { caption?: string; tags?: string };

export function getInstagramCaption(data: Record<string, unknown> | null | undefined): string {
  if (!data || typeof data !== "object") return "";
  const v = data.caption;
  return typeof v === "string" ? v : "";
}

export function getInstagramTags(data: Record<string, unknown> | null | undefined): string {
  if (!data || typeof data !== "object") return "";
  const v = data.tags;
  return typeof v === "string" ? v : "";
}

export function setInstagramCaption(
  prev: Record<string, unknown>,
  caption: string
): Record<string, unknown> {
  return { ...prev, caption };
}

export function setInstagramTags(
  prev: Record<string, unknown>,
  tags: string
): Record<string, unknown> {
  return { ...prev, tags };
}

/** 카드 객체에서 인스타 캡션/태그 읽기 (새 형식 + 예전 frontCaption 등 호환) */
export function getInstagramCaptionFromCard(
  card: { frontCardTypeData?: Record<string, unknown> | null; backCardTypeData?: Record<string, unknown> | null; frontCaption?: string | null; backCaption?: string | null },
  side: "front" | "back"
): string {
  const data = side === "front" ? card.frontCardTypeData : card.backCardTypeData;
  const fromData = getInstagramCaption(data);
  if (fromData) return fromData;
  const legacy = side === "front" ? card.frontCaption : card.backCaption;
  return typeof legacy === "string" ? legacy : "";
}

export function getInstagramTagsFromCard(
  card: { frontCardTypeData?: Record<string, unknown> | null; backCardTypeData?: Record<string, unknown> | null; frontTags?: string | null; backTags?: string | null },
  side: "front" | "back"
): string {
  const data = side === "front" ? card.frontCardTypeData : card.backCardTypeData;
  const fromData = getInstagramTags(data);
  if (fromData) return fromData;
  const legacy = side === "front" ? card.frontTags : card.backTags;
  return typeof legacy === "string" ? legacy : "";
}
