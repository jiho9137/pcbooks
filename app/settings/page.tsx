"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getArrangementFromSupabase,
  setArrangementInSupabase,
} from "@/lib/supabase/settings";

const STORAGE_KEY = "pcbooks_book_arrangement";

function getFromLocalStorage(): { rows: number; cols: number } {
  if (typeof window === "undefined") return { rows: 6, cols: 6 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { rows: 6, cols: 6 };
    const p = JSON.parse(raw) as { rows?: number; cols?: number };
    return {
      rows: Math.min(12, Math.max(1, Number(p.rows) || 6)),
      cols: Math.min(12, Math.max(1, Number(p.cols) || 6)),
    };
  } catch {
    return { rows: 6, cols: 6 };
  }
}

function saveToLocalStorage(rows: number, cols: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows, cols }));
}

export default function SettingsPage() {
  const [rows, setRows] = useState(6);
  const [cols, setCols] = useState(6);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getArrangementFromSupabase()
      .then((r) => {
        setRows(r.rows);
        setCols(r.cols);
      })
      .catch(() => {
        const local = getFromLocalStorage();
        setRows(local.rows);
        setCols(local.cols);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const r = Math.min(12, Math.max(1, rows));
    const c = Math.min(12, Math.max(1, cols));
    setArrangementInSupabase({ rows: r, cols: c }).catch(() => {});
    saveToLocalStorage(r, c);
    router.push("/bookshelf");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-100 dark:bg-zinc-900">
        <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
          <Link
            href="/bookshelf"
            className="text-sm text-zinc-600 dark:text-zinc-400"
          >
            ← 책장
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center">
          <p className="text-zinc-500 dark:text-zinc-400">불러오는 중...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
        <Link
          href="/bookshelf"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← 책장
        </Link>
      </header>
      <main className="flex flex-1 flex-col p-6">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
            책장 배열
          </h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            책이 놓일 칸의 행·열 개수 (1~12)
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-6">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">행</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value) || 1)}
                  className="w-20 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">열</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={cols}
                  onChange={(e) => setCols(Number(e.target.value) || 1)}
                  className="w-20 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                />
              </label>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              예: 6×6 = 36칸 (Supabase에 저장됨)
            </p>
            <button
              type="submit"
              className="w-fit rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              적용하고 책장으로
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
