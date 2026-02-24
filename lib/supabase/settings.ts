import { supabase } from "./client";

const KEY_BOOK_ARRANGEMENT = "book_arrangement";

export type Arrangement = { rows: number; cols: number };

const defaultArrangement: Arrangement = { rows: 6, cols: 6 };

export async function getArrangementFromSupabase(): Promise<Arrangement> {
  if (!supabase) return defaultArrangement;
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", KEY_BOOK_ARRANGEMENT)
    .single();

  if (error || !data?.value) return defaultArrangement;

  const v = data.value as { rows?: number; cols?: number };
  return {
    rows: Math.min(12, Math.max(1, Number(v.rows) ?? defaultArrangement.rows)),
    cols: Math.min(12, Math.max(1, Number(v.cols) ?? defaultArrangement.cols)),
  };
}

export async function setArrangementInSupabase(
  arr: Arrangement
): Promise<void> {
  if (!supabase) return;
  const rows = Math.min(12, Math.max(1, arr.rows));
  const cols = Math.min(12, Math.max(1, arr.cols));
  await supabase.from("app_settings").upsert(
    { key: KEY_BOOK_ARRANGEMENT, value: { rows, cols } },
    { onConflict: "key" }
  );
}
