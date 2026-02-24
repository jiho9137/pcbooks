"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getArrangement, setArrangement } from "@/lib/bookshelfArrangement";

export default function ArrangementForm() {
  const [rows, setRows] = useState(6);
  const [cols, setCols] = useState(6);
  const router = useRouter();

  useEffect(() => {
    const { rows: r, cols: c } = getArrangement();
    setRows(r);
    setCols(c);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setArrangement({ rows, cols });
    router.push("/bookshelf");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
        책장 배열
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        책이 놓일 칸의 행·열 개수 (1~12)
      </p>
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
        예: 6×6 = 36칸
      </p>
      <button
        type="submit"
        className="w-fit rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        적용하고 책장으로
      </button>
    </form>
  );
}
