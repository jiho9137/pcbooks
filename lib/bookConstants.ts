/** 포토카드북 기본 페이지 수 (매) */
export const DEFAULT_BOOK_PAGES = 10;

/** 책별 인벤토리/슬롯 localStorage 키 접두어 (실제 키: `${KEY_PREFIX_INVENTORY}${bookId}` 등) */
export const KEY_PREFIX_INVENTORY = "pcbooks_inventory_";
export const KEY_PREFIX_SLOTS = "pcbooks_slots_";

/** 인벤토리 패널 너비(px) 리사이즈 한계 */
export const INVENTORY_WIDTH_MIN = 200;
export const INVENTORY_WIDTH_MAX = 720;
export const INVENTORY_WIDTH_DEFAULT = 256;
