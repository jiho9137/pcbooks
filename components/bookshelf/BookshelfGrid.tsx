"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { bookArrangement } from "@/setting/book_arrangement";
import { getArrangementFromSupabase, type Arrangement } from "@/lib/supabase/settings";
import { getArrangement } from "@/lib/bookshelfArrangement";
import { supabase } from "@/lib/supabase/client";

type Book = {
  id: string;
  title: string;
  booktype_id: string;
  cardtype_id: string;
  created_at?: string;
};

type ContextMenu = { bookId: string; x: number; y: number };

export default function BookshelfGrid() {
  const [arrangement, setArrangement] = useState<Arrangement>(bookArrangement);
  const [books, setBooks] = useState<Book[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const router = useRouter();

  useEffect(() => {
    getArrangementFromSupabase()
      .then(setArrangement)
      .catch(() => setArrangement(getArrangement()));
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("books")
      .select("id, title, booktype_id, cardtype_id, created_at")
      .order("created_at", { ascending: true })
      .then(({ data }) => setBooks(data ?? []));
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu]);

  const { rows, cols } = arrangement;
  const total = rows * cols;
  // UI "행" = 가로 칸 수(columns), "열" = 세로 줄 수(rows)로 사용
  const gridCols = rows;
  const gridRows = cols;

  return (
    <>
      <div
        className="grid w-full max-w-4xl gap-3 p-4"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: total }, (_, i) => {
          const book = books[i];
          const content = book ? (
            <div
              className="flex h-full w-full flex-col"
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ bookId: book.id, x: e.clientX, y: e.clientY });
              }}
            >
              <Link
                href={`/book/${book.id}`}
                className="flex flex-1 flex-col items-center justify-center overflow-hidden p-2 text-center transition hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                <span className="line-clamp-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {book.title || "제목 없음"}
                </span>
              </Link>
            </div>
          ) : null;
          return (
            <div
              key={book?.id ?? `empty-${i}`}
              className="flex aspect-[3/4] flex-col rounded border border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800"
              aria-label={book ? `책: ${book.title}` : `빈 칸 ${i + 1}`}
            >
              {content}
            </div>
          );
        })}
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 min-w-[120px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-600 dark:bg-zinc-800"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700"
            onClick={() => {
              router.push(`/book/${contextMenu.bookId}/settings`);
              setContextMenu(null);
            }}
          >
            책 설정
          </button>
          <button
            type="button"
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-zinc-100 dark:text-red-400 dark:hover:bg-zinc-700"
            onClick={async () => {
              if (!confirm("이 책을 삭제할까요?")) return;
              if (supabase) {
                await supabase.from("books").delete().eq("id", contextMenu.bookId);
              }
              setBooks((prev) => prev.filter((b) => b.id !== contextMenu.bookId));
              setContextMenu(null);
            }}
          >
            책 삭제
          </button>
        </div>
      )}
    </>
  );
}
