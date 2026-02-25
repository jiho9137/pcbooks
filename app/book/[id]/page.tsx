"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { bookTypes } from "@/booktype";
import { getCardTypesForBookType } from "@/lib/cardTypesRegistry";
import { DEFAULT_BOOK_PAGES } from "@/lib/bookConstants";
import type { Book, BookPage, CardSettingsDraft, InventoryCard, SlotAssignments, ViewMode } from "@/lib/book/types";
import { deleteCardImageUrls } from "@/lib/upload";
import { useCardUpload } from "@/app/book/[id]/hooks/useCardUpload";
import { useInventoryCards } from "@/app/book/[id]/hooks/useInventoryCards";
import { useSlotAssignments } from "@/app/book/[id]/hooks/useSlotAssignments";
import { useInventoryResize } from "@/app/book/[id]/hooks/useInventoryResize";
import { CardSettingsModal } from "@/app/book/[id]/components/CardSettingsModal";
import { InventoryGrid } from "@/app/book/[id]/components/InventoryGrid";
import { SlotGrid } from "@/app/book/[id]/components/SlotGrid";

export default function BookPage() {
  const params = useParams();
  const id = params.id as string;
  const [book, setBook] = useState<Book | null>(null);
  const [pages, setPages] = useState<BookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingPage, setAddingPage] = useState(false);
  const [pagesError, setPagesError] = useState<string | null>(null);
  const [addPageError, setAddPageError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("scroll");
  const [flipSpreadIndex, setFlipSpreadIndex] = useState(0);
  const [editingLabelPageId, setEditingLabelPageId] = useState<string | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState("");
  const [pageMenu, setPageMenu] = useState<{ x: number; y: number; page: BookPage } | null>(null);
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);
  const [showInventory, setShowInventory] = useState(true);
  const { inventoryWidth, onResizeStart } = useInventoryResize();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  const [inventoryCards, setInventoryCards] = useInventoryCards(id ?? "");
  const [cardDisplaySide, setCardDisplaySide] = useState<Record<string, "front" | "back">>({});
  const [cardSettingsCardId, setCardSettingsCardId] = useState<string | null>(null);
  const [cardSettingsDraft, setCardSettingsDraft] = useState<CardSettingsDraft | null>(null);
  const [slotAssignments, setSlotAssignments] = useSlotAssignments(id ?? "");
  const cardUpload = useCardUpload(id ?? "", (side, url) => {
    setCardSettingsDraft((d) =>
      d ? { ...d, [side === "front" ? "frontImage" : "backImage"]: url } : d
    );
  });

  useEffect(() => {
    if (!pageMenu) return;
    const close = () => setPageMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [pageMenu]);

  useEffect(() => {
    if (!cardSettingsCardId) return;
    const close = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-card-settings-modal]") == null) {
        setCardSettingsCardId(null);
        setCardSettingsDraft(null);
      }
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [cardSettingsCardId]);

  function handlePageContextMenu(e: React.MouseEvent, page: BookPage) {
    if ((e.target as HTMLElement).closest("[data-card-grid]")) return;
    e.preventDefault();
    setPageMenu({ x: e.clientX, y: e.clientY, page });
  }

  async function deletePage(pageId: string) {
    if (!supabase) return;
    setDeletingPageId(pageId);
    const { error } = await supabase.from("book_pages").delete().eq("id", pageId);
    if (error) {
      setAddPageError(error.message);
      setPageMenu(null);
    } else {
      const remaining = pages.filter((p) => p.id !== pageId).sort((a, b) => a.page_order - b.page_order);
      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].page_order !== i) {
          await supabase.from("book_pages").update({ page_order: i }).eq("id", remaining[i].id);
        }
      }
      setPageMenu(null);
      fetchBookAndPages();
    }
    setDeletingPageId(null);
  }

  async function savePageLabel(pageId: string, value: string) {
    setEditingLabelPageId(null);
    const trimmed = value.trim();
    if (!supabase) return;
    const { error } = await supabase.from("book_pages").update({ label: trimmed || "" }).eq("id", pageId);
    if (!error) {
      setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, label: trimmed || "" } : p)));
    }
  }

  function startEditingLabel(page: BookPage) {
    setEditingLabelPageId(page.id);
    setEditingLabelValue(page.label?.trim() ?? "");
  }

  function startEditingTitle() {
    setTitleInput(book?.title ?? "");
    setEditingTitle(true);
  }

  async function saveTitle() {
    setEditingTitle(false);
    if (!supabase || !id || !book) return;
    const trimmed = titleInput.trim();
    setSavingTitle(true);
    const { error } = await supabase.from("books").update({ title: trimmed || "" }).eq("id", id);
    if (!error) {
      setBook((b) => (b ? { ...b, title: trimmed || "" } : null));
    }
    setSavingTitle(false);
  }

  const fetchBookAndPages = useCallback(() => {
    if (!supabase || !id) {
      setLoading(false);
      return;
    }
    setPagesError(null);
    setAddPageError(null);
    (async () => {
      const [bookRes, pagesRes] = await Promise.all([
        supabase.from("books").select("id, title, booktype_id, cardtype_id, cards_per_side_rows, cards_per_side_cols").eq("id", id).single(),
        supabase.from("book_pages").select("id, book_id, page_order, label").eq("book_id", id).order("page_order", { ascending: true }),
      ]);
      let bookData = bookRes.data;
      if (bookRes.error && bookData == null) {
        const fallback = await supabase.from("books").select("id, title, booktype_id, cardtype_id").eq("id", id).single();
        const raw = fallback.data;
        bookData = raw ? { ...raw, cards_per_side_rows: null, cards_per_side_cols: null } : null;
      }
      setBook(bookData ?? null);
      if (pagesRes.error) {
        setPagesError(pagesRes.error.message);
        setPages([]);
      } else {
        const list = (pagesRes.data ?? []) as BookPage[];
        setPages(list);
        // 페이지가 0매면 기본 10매 자동 생성 (버튼 없이 그냥 기본값)
        if (bookData && list.length === 0 && supabase) {
          const pageRows = Array.from({ length: DEFAULT_BOOK_PAGES }, (_, i) => ({
            book_id: bookData!.id,
            page_order: i,
          }));
          supabase.from("book_pages").insert(pageRows).then(({ error }) => {
            if (error) setPagesError(error.message);
            else fetchBookAndPages();
          });
        }
      }
    })().finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchBookAndPages();
  }, [fetchBookAndPages]);

  async function addPage() {
    if (!supabase || !id || addingPage) return;
    setAddingPage(true);
    setAddPageError(null);
    const nextOrder = pages.length;
    const { error } = await supabase.from("book_pages").insert({ book_id: id, page_order: nextOrder });
    if (error) {
      setAddPageError(error.message);
    } else {
      fetchBookAndPages();
    }
    setAddingPage(false);
  }

  const handleInventoryDropFromSlot = useCallback(
    (data: { from?: string; pageId?: string; slotIndex?: number }) => {
      if (data.from !== "slot" || data.pageId == null || data.slotIndex == null) return;
      const card = slotAssignments[data.pageId]?.[data.slotIndex];
      if (card && typeof card === "object") setInventoryCards((inv) => [card, ...inv]);
      setSlotAssignments((prev) => {
        const arr = prev[data.pageId!] ?? [];
        const next = [...arr];
        next[data.slotIndex!] = null;
        return { ...prev, [data.pageId!]: next };
      });
    },
    [slotAssignments, setSlotAssignments, setInventoryCards]
  );

  const handleCardContextMenu = useCallback((card: InventoryCard) => {
    setCardSettingsCardId(card.id);
    const frontData: Record<string, unknown> =
      card.frontCardTypeData && typeof card.frontCardTypeData === "object"
        ? { ...card.frontCardTypeData }
        : "frontCaption" in card || "frontTags" in card
          ? { caption: (card as { frontCaption?: string }).frontCaption ?? "", tags: (card as { frontTags?: string }).frontTags ?? "" }
          : {};
    const backData: Record<string, unknown> =
      card.backCardTypeData && typeof card.backCardTypeData === "object"
        ? { ...card.backCardTypeData }
        : "backCaption" in card || "backTags" in card
          ? { caption: (card as { backCaption?: string }).backCaption ?? "", tags: (card as { backTags?: string }).backTags ?? "" }
          : {};
    setCardSettingsDraft({
      frontCardTypeId: card.frontCardTypeId,
      backCardTypeId: card.backCardTypeId,
      frontImage: card.frontImage ?? null,
      backImage: card.backImage ?? null,
      frontShowImage: card.frontShowImage ?? true,
      backShowImage: card.backShowImage ?? true,
      frontFilterColorEnabled: card.frontFilterColorEnabled ?? false,
      backFilterColorEnabled: card.backFilterColorEnabled ?? false,
      frontFilterColor: card.frontFilterColor ?? "#000000",
      backFilterColor: card.backFilterColor ?? "#000000",
      frontFilterOpacity: card.frontFilterOpacity ?? 50,
      backFilterOpacity: card.backFilterOpacity ?? 50,
      frontCardTypeData: frontData,
      backCardTypeData: backData,
    });
  }, []);

  const handleCreateCard = useCallback(() => {
    if (!book) return;
    const types = getCardTypesForBookType(book.booktype_id);
    const defaultId = types[0]?.definition.id ?? book.cardtype_id ?? "cardtype001";
    setInventoryCards((prev) => [
      { id: crypto.randomUUID(), frontCardTypeId: defaultId, backCardTypeId: defaultId },
      ...prev,
    ]);
  }, [book]);

  const handleCardSettingsClose = useCallback(() => {
    setCardSettingsCardId(null);
    setCardSettingsDraft(null);
  }, []);

  const handleCardSettingsApply = useCallback(() => {
    if (!cardSettingsCardId || !cardSettingsDraft) return;
    const updated = {
      frontCardTypeId: cardSettingsDraft.frontCardTypeId,
      backCardTypeId: cardSettingsDraft.backCardTypeId,
      frontImage: cardSettingsDraft.frontImage,
      backImage: cardSettingsDraft.backImage,
      frontShowImage: cardSettingsDraft.frontShowImage,
      backShowImage: cardSettingsDraft.backShowImage,
      frontFilterColorEnabled: cardSettingsDraft.frontFilterColorEnabled,
      backFilterColorEnabled: cardSettingsDraft.backFilterColorEnabled,
      frontFilterColor: cardSettingsDraft.frontFilterColor,
      backFilterColor: cardSettingsDraft.backFilterColor,
      frontFilterOpacity: cardSettingsDraft.frontFilterOpacity,
      backFilterOpacity: cardSettingsDraft.backFilterOpacity,
      frontCardTypeData: cardSettingsDraft.frontCardTypeData,
      backCardTypeData: cardSettingsDraft.backCardTypeData,
    };
    setInventoryCards((prev) =>
      prev.map((c) => (c.id === cardSettingsCardId ? { ...c, ...updated } : c))
    );
    setSlotAssignments((prev) => {
      const next = { ...prev };
      for (const [pageId, arr] of Object.entries(next)) {
        next[pageId] = arr.map((v) =>
          v && typeof v === "object" && v.id === cardSettingsCardId ? { ...v, ...updated } : v
        );
      }
      return next;
    });
    handleCardSettingsClose();
  }, [cardSettingsCardId, cardSettingsDraft, handleCardSettingsClose]);

  const handleCardDelete = useCallback(async () => {
    if (!cardSettingsCardId) return;
    let card = inventoryCards.find((c) => c.id === cardSettingsCardId);
    if (!card) {
      for (const arr of Object.values(slotAssignments)) {
        const slot = arr.find(
          (s): s is InventoryCard =>
            s != null && typeof s === "object" && "id" in s && (s as InventoryCard).id === cardSettingsCardId
        );
        if (slot) {
          card = slot;
          break;
        }
      }
    }
    if (!card) return;
    await deleteCardImageUrls([card.frontImage ?? "", card.backImage ?? ""]);
    setInventoryCards((prev) => prev.filter((c) => c.id !== card!.id));
    setSlotAssignments((prev) => {
      const next: SlotAssignments = {};
      for (const [pageId, arr] of Object.entries(prev)) {
        next[pageId] = arr.map((v) =>
          v && (typeof v === "object" ? v.id === card!.id : v === card!.id) ? null : v
        );
      }
      return next;
    });
    handleCardSettingsClose();
  }, [cardSettingsCardId, inventoryCards, slotAssignments, handleCardSettingsClose]);

  const handleToggleDisplaySide = useCallback((cardId: string) => {
    setCardDisplaySide((prev) => ({ ...prev, [cardId]: prev[cardId] === "back" ? "front" : "back" }));
  }, []);

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
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/bookshelf"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 shrink-0"
            >
              ← 책장
            </Link>
            {editingTitle ? (
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => e.key === "Enter" && (saveTitle(), e.currentTarget.blur())}
                className="min-w-[8rem] max-w-[20rem] rounded border border-zinc-300 bg-white px-2 py-1 text-lg font-semibold text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50 dark:focus:border-zinc-500"
                placeholder="제목 없음"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={startEditingTitle}
                className="text-left text-lg font-semibold text-zinc-900 truncate hover:underline focus:underline dark:text-zinc-50"
              >
                {book.title || "제목 없음"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowInventory((v) => !v)}
              className={`shrink-0 rounded px-2 py-1 text-sm font-medium ${showInventory ? "bg-zinc-200 text-zinc-800 dark:bg-zinc-600 dark:text-zinc-100" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"}`}
            >
              카드 인벤토리
            </button>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex rounded-lg border border-zinc-300 dark:border-zinc-600 overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode("scroll")}
                className={`px-3 py-1.5 text-sm font-medium ${viewMode === "scroll" ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-600 dark:text-zinc-50" : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"}`}
              >
                스크롤
              </button>
              <button
                type="button"
                onClick={() => setViewMode("flip")}
                className={`px-3 py-1.5 text-sm font-medium ${viewMode === "flip" ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-600 dark:text-zinc-50" : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"}`}
              >
                넘기기
              </button>
            </div>
            <button
              type="button"
              onClick={addPage}
              disabled={addingPage}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              {addingPage ? "추가 중…" : "페이지 추가"}
            </button>
            <Link
              href={`/book/${id}/settings`}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              책 설정
            </Link>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {showInventory && (
          <>
            <aside
              className="shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 flex flex-col overflow-hidden"
              style={{ width: inventoryWidth }}
            >
              <InventoryGrid
                cards={inventoryCards}
                cardDisplaySide={cardDisplaySide}
                onToggleDisplaySide={handleToggleDisplaySide}
                onCardContextMenu={handleCardContextMenu}
                onDropFromSlot={handleInventoryDropFromSlot}
                onCreateCard={handleCreateCard}
                onClose={() => setShowInventory(false)}
              />
              {cardSettingsCardId && book && cardSettingsDraft && (() => {
                let cardForSettings = inventoryCards.find((c) => c.id === cardSettingsCardId);
                if (!cardForSettings) {
                  for (const arr of Object.values(slotAssignments)) {
                    const slot = arr.find(
                      (s): s is InventoryCard =>
                        s != null && typeof s === "object" && "id" in s && (s as InventoryCard).id === cardSettingsCardId
                    );
                    if (slot) {
                      cardForSettings = slot;
                      break;
                    }
                  }
                }
                if (!cardForSettings) return null;
                return (
                  <CardSettingsModal
                    card={cardForSettings}
                    draft={cardSettingsDraft}
                    onDraftChange={setCardSettingsDraft}
                    onApply={handleCardSettingsApply}
                    onDelete={handleCardDelete}
                    onClose={handleCardSettingsClose}
                    cardUpload={cardUpload}
                    cardTypesForBook={getCardTypesForBookType(book.booktype_id)}
                  />
                );
              })()}
            </aside>
            <div
              role="separator"
              aria-label="인벤토리 너비 조절"
              className="w-1.5 shrink-0 cursor-col-resize bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-600 dark:hover:bg-zinc-500 flex items-center justify-center group"
              onMouseDown={onResizeStart}
            >
              <span className="w-0.5 h-8 rounded-full bg-zinc-400 opacity-0 group-hover:opacity-100 group-active:opacity-100 dark:bg-zinc-300" />
            </div>
          </>
        )}
        <main className="flex min-h-0 flex-1 flex-col overflow-y-scroll overflow-x-hidden p-2">
          <div className="mx-auto w-full max-w-7xl" style={{ zoom: 1.2 }}>
          {(() => {
            const bt = bookTypes.find((b) => b.definition.id === book.booktype_id);
            const defaultPerSide = bt?.spread.cardsPerSide ?? [2, 2];
            const rows = book.cards_per_side_rows ?? defaultPerSide[0];
            const cols = book.cards_per_side_cols ?? defaultPerSide[1];
            const slotCount = rows * cols;
            const spreads: [BookPage | null, BookPage | null][] = [];
            for (let i = 0; i < pages.length; i += 2) {
              spreads.push([pages[i] ?? null, pages[i + 1] ?? null]);
            }

            function renderSpreadSection(
              [left, right]: [BookPage | null, BookPage | null],
              spreadIdx: number
            ) {
              return (
                <section
                  key={left?.id ?? `empty-${spreadIdx}`}
                  className="flex flex-nowrap gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-600 dark:bg-zinc-800"
                >
                  <div
                    className="flex-1 min-w-0 flex flex-col"
                    onContextMenu={(e) => left && handlePageContextMenu(e, left)}
                  >
                    {left ? (
                      <>
                        <div
                          onClick={() => startEditingLabel(left)}
                          className="min-h-[1.5rem] -mt-1 mb-2 cursor-text rounded px-1 -mx-1 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 min-w-0 shrink-0"
                        >
                          {editingLabelPageId === left.id ? (
                            <input
                              type="text"
                              value={editingLabelValue}
                              onChange={(e) => setEditingLabelValue(e.target.value)}
                              onBlur={() => savePageLabel(left.id, editingLabelValue)}
                              onKeyDown={(e) => e.key === "Enter" && (savePageLabel(left.id, editingLabelValue), e.currentTarget.blur())}
                              className="w-full bg-transparent text-sm text-zinc-800 dark:text-zinc-200 outline-none border-none py-0.5"
                              placeholder="라벨"
                              autoFocus
                            />
                          ) : (left.label?.trim() ?? "") ? (
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">{left.label?.trim() ?? ""}</span>
                          ) : null}
                        </div>
                        <SlotGrid
                          pageId={left.id}
                          slotCount={slotCount}
                          rows={rows}
                          cols={cols}
                          slotAssignments={slotAssignments}
                          inventoryCards={inventoryCards}
                          cardDisplaySide={cardDisplaySide}
                          onToggleDisplaySide={handleToggleDisplaySide}
                          onCardContextMenu={handleCardContextMenu}
                          setSlotAssignments={setSlotAssignments}
                          setInventoryCards={setInventoryCards}
                        />
                        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 text-left shrink-0">
                          {spreadIdx * 2 + 1}쪽
                        </p>
                      </>
                    ) : (
                      <div className="flex flex-1 aspect-[54/86] min-h-0 items-center justify-center rounded border border-dashed border-zinc-200 dark:border-zinc-600">
                        <span className="text-xs text-zinc-400">빈 면</span>
                      </div>
                    )}
                  </div>
                  <div
                    className="shrink-0 w-px self-stretch bg-zinc-200 dark:bg-zinc-600"
                    aria-hidden
                  />
                  <div
                    className="flex-1 min-w-0 flex flex-col"
                    onContextMenu={(e) => right && handlePageContextMenu(e, right)}
                  >
                    {right ? (
                      <>
                        <div
                          onClick={() => startEditingLabel(right)}
                          className="min-h-[1.5rem] -mt-1 mb-2 cursor-text rounded px-1 -mx-1 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 min-w-0 shrink-0 text-right"
                        >
                          {editingLabelPageId === right.id ? (
                            <input
                              type="text"
                              value={editingLabelValue}
                              onChange={(e) => setEditingLabelValue(e.target.value)}
                              onBlur={() => savePageLabel(right.id, editingLabelValue)}
                              onKeyDown={(e) => e.key === "Enter" && (savePageLabel(right.id, editingLabelValue), e.currentTarget.blur())}
                              className="w-full bg-transparent text-sm text-zinc-800 dark:text-zinc-200 outline-none border-none py-0.5 text-right"
                              placeholder="라벨"
                              autoFocus
                            />
                          ) : (right.label?.trim() ?? "") ? (
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">{right.label?.trim() ?? ""}</span>
                          ) : null}
                        </div>
                        <SlotGrid
                          pageId={right.id}
                          slotCount={slotCount}
                          rows={rows}
                          cols={cols}
                          slotAssignments={slotAssignments}
                          inventoryCards={inventoryCards}
                          cardDisplaySide={cardDisplaySide}
                          onToggleDisplaySide={handleToggleDisplaySide}
                          onCardContextMenu={handleCardContextMenu}
                          setSlotAssignments={setSlotAssignments}
                          setInventoryCards={setInventoryCards}
                        />
                        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 text-right shrink-0">
                          {spreadIdx * 2 + 2}쪽
                        </p>
                      </>
                    ) : (
                      <div className="flex flex-1 aspect-[54/86] min-h-0 items-center justify-center rounded border border-dashed border-zinc-200 dark:border-zinc-600">
                        <span className="text-xs text-zinc-400">빈 면</span>
                      </div>
                    )}
                  </div>
                </section>
              );
            }

            return (
              <>
                {(pagesError || addPageError) && (
                  <p className="mb-4 text-sm text-red-600 dark:text-red-400">
                    {pagesError ?? addPageError}
                  </p>
                )}
                {viewMode === "scroll" ? (
                  <div className="space-y-6">
                    {spreads.map((s, i) => renderSpreadSection(s, i))}
                  </div>
                ) : (
                  <div className="relative flex justify-center">
                    {spreads.length === 0 ? (
                      <p className="py-8 text-sm text-zinc-500 dark:text-zinc-400">넣을 스프레드가 없습니다.</p>
                    ) : (
                      <div className="w-full max-w-7xl">
                        {renderSpreadSection(spreads[Math.min(flipSpreadIndex, spreads.length - 1)], Math.min(flipSpreadIndex, spreads.length - 1))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setFlipSpreadIndex((i) => Math.max(0, i - 1))}
                      disabled={spreads.length === 0 || flipSpreadIndex <= 0}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white/90 text-lg text-zinc-700 shadow opacity-0 transition-[opacity,transform] duration-200 hover:opacity-100 active:scale-90 active:opacity-70 disabled:opacity-0 disabled:cursor-not-allowed dark:border-zinc-600 dark:bg-zinc-800/90 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      aria-label="이전"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlipSpreadIndex((i) => Math.min(spreads.length - 1, i + 1))}
                      disabled={spreads.length === 0 || flipSpreadIndex >= spreads.length - 1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white/90 text-lg text-zinc-700 shadow opacity-0 transition-[opacity,transform] duration-200 hover:opacity-100 active:scale-90 active:opacity-70 disabled:opacity-0 disabled:cursor-not-allowed dark:border-zinc-600 dark:bg-zinc-800/90 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      aria-label="다음"
                    >
                      →
                    </button>
                  </div>
                )}
              </>
            );
          })()}
          </div>
        </main>
      </div>
      {pageMenu && (
        <div
          className="fixed z-50 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-600 dark:bg-zinc-800"
          style={{ left: pageMenu.x, top: pageMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => deletePage(pageMenu.page.id)}
            disabled={deletingPageId === pageMenu.page.id}
            className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            {deletingPageId === pageMenu.page.id ? "삭제 중…" : "페이지 삭제"}
          </button>
        </div>
      )}
    </div>
  );
}
