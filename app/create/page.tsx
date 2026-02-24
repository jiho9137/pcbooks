"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { bookTypes } from "@/booktype";
import { cardTypes } from "@/cardtype";
import { supabase } from "@/lib/supabase/client";
import { DEFAULT_BOOK_PAGES } from "@/lib/bookConstants";

export default function CreatePage() {
  const [title, setTitle] = useState("");
  const [bookTypeId, setBookTypeId] = useState(bookTypes[0].definition.id);
  const [cardTypeId, setCardTypeId] = useState(cardTypes[0].definition.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!supabase) {
        setError("Supabase가 연결되지 않았습니다.");
        return;
      }
      const { data: newBook, error: bookErr } = await supabase
        .from("books")
        .insert({
          title: title.trim() || "제목 없음",
          booktype_id: bookTypeId,
          cardtype_id: cardTypeId,
        })
        .select("id")
        .single();
      if (bookErr || !newBook) throw bookErr ?? new Error("책 생성 실패");
      const pageRows = Array.from({ length: DEFAULT_BOOK_PAGES }, (_, i) => ({
        book_id: newBook.id,
        page_order: i,
      }));
      const { error: pagesErr } = await supabase.from("book_pages").insert(pageRows);
      if (pagesErr) throw pagesErr;
      router.push("/bookshelf");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
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
        <div className="mx-auto w-full max-w-md">
          <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            새 책 만들기
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">제목</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="책 제목 (선택)"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50 dark:placeholder:text-zinc-500"
              />
            </label>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                책 타입
              </legend>
              <div className="flex flex-col gap-2">
                {bookTypes.map((bt) => (
                  <label
                    key={bt.definition.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 transition dark:border-zinc-600 dark:bg-zinc-800"
                  >
                    <input
                      type="radio"
                      name="bookType"
                      value={bt.definition.id}
                      checked={bookTypeId === bt.definition.id}
                      onChange={() => setBookTypeId(bt.definition.id)}
                      className="h-4 w-4"
                    />
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {bt.definition.name}
                      </span>
                      {bt.definition.description && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {bt.definition.description}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                포토카드 타입
              </legend>
              <div className="flex flex-col gap-2">
                {cardTypes.map((ct) => (
                  <label
                    key={ct.definition.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 transition dark:border-zinc-600 dark:bg-zinc-800"
                  >
                    <input
                      type="radio"
                      name="cardType"
                      value={ct.definition.id}
                      checked={cardTypeId === ct.definition.id}
                      onChange={() => setCardTypeId(ct.definition.id)}
                      className="h-4 w-4"
                    />
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {ct.definition.name}
                      </span>
                      {ct.definition.description && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {ct.definition.description}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? "만드는 중..." : "만들기"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
