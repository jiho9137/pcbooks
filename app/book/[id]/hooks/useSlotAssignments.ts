"use client";

import { useEffect, useRef, useState } from "react";
import type { SlotAssignments } from "@/lib/book/types";
import { KEY_PREFIX_SLOTS } from "@/lib/bookConstants";

/**
 * 페이지별 슬롯 배치 + localStorage 동기화.
 * @see docs/refactoring-plan.md Phase 2.2
 */
export function useSlotAssignments(bookId: string) {
  const [slotAssignments, setSlotAssignments] = useState<SlotAssignments>({});
  const skipNextSave = useRef(false);
  const storageKey = `${KEY_PREFIX_SLOTS}${bookId}`;

  useEffect(() => {
    if (!bookId) return;
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? (JSON.parse(raw) as SlotAssignments) : {};
      setSlotAssignments(parsed && typeof parsed === "object" ? parsed : {});
      skipNextSave.current = true;
    } catch {
      setSlotAssignments({});
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
      localStorage.setItem(storageKey, JSON.stringify(slotAssignments));
    } catch {
      /* ignore */
    }
  }, [bookId, storageKey, slotAssignments]);

  return [slotAssignments, setSlotAssignments] as const;
}
