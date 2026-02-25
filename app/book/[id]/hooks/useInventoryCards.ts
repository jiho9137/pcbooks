"use client";

import { useEffect, useRef, useState } from "react";
import type { InventoryCard } from "@/lib/book/types";
import { KEY_PREFIX_INVENTORY } from "@/lib/bookConstants";

/**
 * 인벤토리 카드 목록 + localStorage 동기화.
 * @see docs/refactoring-plan.md Phase 2.1
 */
export function useInventoryCards(bookId: string) {
  const [cards, setCards] = useState<InventoryCard[]>([]);
  const skipNextSave = useRef(false);
  const storageKey = `${KEY_PREFIX_INVENTORY}${bookId}`;

  function migrateCard(c: InventoryCard): InventoryCard {
    const legacy = c as InventoryCard & { frontCaption?: string; backCaption?: string; frontTags?: string; backTags?: string };
    const frontData =
      c.frontCardTypeData && typeof c.frontCardTypeData === "object"
        ? { ...c.frontCardTypeData }
        : legacy.frontCaption != null || legacy.frontTags != null
          ? { caption: legacy.frontCaption ?? "", tags: legacy.frontTags ?? "" }
          : {};
    const backData =
      c.backCardTypeData && typeof c.backCardTypeData === "object"
        ? { ...c.backCardTypeData }
        : legacy.backCaption != null || legacy.backTags != null
          ? { caption: legacy.backCaption ?? "", tags: legacy.backTags ?? "" }
          : {};
    return { ...c, frontCardTypeData: frontData, backCardTypeData: backData };
  }

  useEffect(() => {
    if (!bookId) return;
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? (JSON.parse(raw) as InventoryCard[]) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      setCards(list.map(migrateCard));
      skipNextSave.current = true;
    } catch {
      setCards([]);
      skipNextSave.current = true;
    }
  }, [bookId, storageKey]);

  useEffect(() => {
    if (!bookId) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(cards));
    } catch {
      /* ignore */
    }
  }, [bookId, storageKey, cards]);

  return [cards, setCards] as const;
}
