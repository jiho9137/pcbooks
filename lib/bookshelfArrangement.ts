import { bookArrangement } from "@/setting/book_arrangement";

const STORAGE_KEY = "pcbooks_book_arrangement";

export type Arrangement = { rows: number; cols: number };

export function getArrangement(): Arrangement {
  if (typeof window === "undefined") return { ...bookArrangement };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...bookArrangement };
    const parsed = JSON.parse(raw) as { rows?: number; cols?: number };
    const rows = Math.min(12, Math.max(1, Number(parsed.rows) || bookArrangement.rows));
    const cols = Math.min(12, Math.max(1, Number(parsed.cols) || bookArrangement.cols));
    return { rows, cols };
  } catch {
    return { ...bookArrangement };
  }
}

export function setArrangement(arr: Arrangement): void {
  if (typeof window === "undefined") return;
  const rows = Math.min(12, Math.max(1, arr.rows));
  const cols = Math.min(12, Math.max(1, arr.cols));
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows, cols }));
}
