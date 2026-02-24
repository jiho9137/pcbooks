"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { bookTypes } from "@/booktype";
import { cardTypes } from "@/cardtype";

type Book = {
  id: string;
  title: string;
  booktype_id: string;
  cardtype_id: string;
  cards_per_side_rows?: number | null;
  cards_per_side_cols?: number | null;
};

export default function BookSettingsPage() {
  const params = useParams();
  const id = params.id as string;
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingCards, setSavingCards] = useState(false);
  const [cardsSaveError, setCardsSaveError] = useState<string | null>(null);
  const [rowsInput, setRowsInput] = useState<number | "">("");
  const [colsInput, setColsInput] = useState<number | "">("");

  async function saveCardsPerSide(rows: number, cols: number) {
    if (!supabase || !id || savingCards) return;
    setSavingCards(true);
    setCardsSaveError(null);
    const { error } = await supabase.from("books").update({ cards_per_side_rows: rows, cards_per_side_cols: cols }).eq("id", id);
    if (error) {
      setCardsSaveError(error.message);
    } else {
      setBook((b) => (b ? { ...b, cards_per_side_rows: rows, cards_per_side_cols: cols } : null));
    }
    setSavingCards(false);
  }

  useEffect(() => {
    if (!supabase || !id) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("books")
        .select("id, title, booktype_id, cardtype_id, cards_per_side_rows, cards_per_side_cols")
        .eq("id", id)
        .single();
      if (error && data == null) {
        const fallback = await supabase.from("books").select("id, title, booktype_id, cardtype_id").eq("id", id).single();
        setBook(fallback.data ?? null);
      } else {
        setBook(data ?? null);
      }
    })().finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (book) {
      setRowsInput(book.cards_per_side_rows ?? "");
      setColsInput(book.cards_per_side_cols ?? "");
    }
  }, [book?.id, book?.cards_per_side_rows, book?.cards_per_side_cols]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-100 dark:bg-zinc-900">
        <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
          <Link href="/bookshelf" className="text-sm text-zinc-600 dark:text-zinc-400">
            ← 책장
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center">
          <p className="text-zinc-500 dark:text-zinc-400">불러오는 중...</p>
        </main>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-100 dark:bg-zinc-900">
        <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
          <Link href="/bookshelf" className="text-sm text-zinc-600 dark:text-zinc-400">
            ← 책장
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center">
          <p className="text-zinc-500 dark:text-zinc-400">책을 찾을 수 없습니다.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            href={`/book/${id}`}
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← 책
          </Link>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            책 설정
          </h1>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 p-6">
        <div className="mx-auto w-full max-w-md space-y-6">
          <section>
            <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              책 타입
            </h2>
            {(() => {
              const bt = bookTypes.find((b) => b.definition.id === book.booktype_id);
              if (!bt) {
                return (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {book.booktype_id} (알 수 없는 타입)
                  </p>
                );
              }
              return (
                <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-600 dark:bg-zinc-800">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {bt.definition.name}
                  </p>
                  {bt.definition.description && (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {bt.definition.description}
                    </p>
                  )}
                  <dl className="mt-3 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <div>
                      <dt className="inline font-medium">표지 크기 </dt>
                      <dd className="inline">{bt.cover.wh.join(" × ")}</dd>
                    </div>
                  </dl>
                </div>
              );
            })()}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              한 면당 카드 수
            </h2>
            {(() => {
              const bt = bookTypes.find((b) => b.definition.id === book.booktype_id);
              const defaultRows = bt?.spread.cardsPerSide[0] ?? 2;
              const defaultCols = bt?.spread.cardsPerSide[1] ?? 2;
              const rows = rowsInput !== "" ? rowsInput : (book.cards_per_side_rows ?? defaultRows);
              const cols = colsInput !== "" ? colsInput : (book.cards_per_side_cols ?? defaultCols);
              const r = typeof rows === "number" ? rows : defaultRows;
              const c = typeof cols === "number" ? cols : defaultCols;
              return (
                <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-600 dark:bg-zinc-800">
                  <div className="flex flex-wrap items-end gap-4">
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">세로 (행)</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={rows}
                        onChange={(e) => {
                          const v = Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1));
                          setRowsInput(v);
                          saveCardsPerSide(v, c);
                        }}
                        className="w-20 rounded border border-zinc-300 bg-white px-2 py-1.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">가로 (열)</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={cols}
                        onChange={(e) => {
                          const v = Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1));
                          setColsInput(v);
                          saveCardsPerSide(r, v);
                        }}
                        className="w-20 rounded border border-zinc-300 bg-white px-2 py-1.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                      />
                    </label>
                    {savingCards && <span className="text-xs text-zinc-500">저장 중…</span>}
                  </div>
                  {cardsSaveError && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {cardsSaveError}
                      {cardsSaveError.includes("does not exist") || cardsSaveError.includes("column") ? " Supabase SQL 에디터에서 마이그레이션 005(books에 cards_per_side_rows, cards_per_side_cols 컬럼 추가)를 실행해 주세요." : ""}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    한 면당 {r}×{c}칸
                  </p>
                </div>
              );
            })()}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              포토카드 타입
            </h2>
            {(() => {
              const ct = cardTypes.find((c) => c.definition.id === book.cardtype_id);
              if (!ct) {
                return (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {book.cardtype_id} (알 수 없는 타입)
                  </p>
                );
              }
              return (
                <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-600 dark:bg-zinc-800">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {ct.definition.name}
                  </p>
                  {ct.definition.description && (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {ct.definition.description}
                    </p>
                  )}
                  <dl className="mt-3 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <div>
                      <dt className="inline font-medium">앞면 크기 </dt>
                      <dd className="inline">{ct.layout.frontWh.join(" × ")}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium">뒷면 크기 </dt>
                      <dd className="inline">{ct.layout.backWh.join(" × ")}</dd>
                    </div>
                  </dl>
                </div>
              );
            })()}
          </section>
        </div>
      </main>
    </div>
  );
}
