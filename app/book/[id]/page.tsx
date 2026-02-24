"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { bookTypes } from "@/booktype";
import { getCardTypesForBookType, findCardTypeById } from "@/lib/cardTypesRegistry";
import { DEFAULT_BOOK_PAGES } from "@/lib/bookConstants";

type Book = {
  id: string;
  title: string;
  booktype_id: string;
  cardtype_id: string;
  cards_per_side_rows?: number | null;
  cards_per_side_cols?: number | null;
};

type BookPage = {
  id: string;
  book_id: string;
  page_order: number;
  label?: string | null;
};

type ViewMode = "scroll" | "flip";

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
  const [inventoryWidth, setInventoryWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(256);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  type InventoryCard = {
    id: string;
    frontCardTypeId: string;
    backCardTypeId: string;
    frontImage?: string | null;
    backImage?: string | null;
  };
  const [inventoryCards, setInventoryCards] = useState<InventoryCard[]>([]);
  const [cardDisplaySide, setCardDisplaySide] = useState<Record<string, "front" | "back">>({});
  const [cardSettingsCardId, setCardSettingsCardId] = useState<string | null>(null);
  const [cardSettingsDraft, setCardSettingsDraft] = useState<{
    frontCardTypeId: string;
    backCardTypeId: string;
    frontImage: string | null;
    backImage: string | null;
  } | null>(null);
  const [cardUploadingSide, setCardUploadingSide] = useState<"front" | "back" | null>(null);

  const inventoryStorageKey = `pcbooks_inventory_${id}`;
  const slotsStorageKey = `pcbooks_slots_${id}`;
  const skipNextInventorySave = useRef(false);
  const skipNextSlotsSave = useRef(false);

  useEffect(() => {
    if (!id) return;
    try {
      const raw = localStorage.getItem(inventoryStorageKey);
      const parsed = raw ? (JSON.parse(raw) as InventoryCard[]) : [];
      if (Array.isArray(parsed)) setInventoryCards(parsed);
      skipNextInventorySave.current = true;
    } catch {
      setInventoryCards([]);
      skipNextInventorySave.current = true;
    }
  }, [id, inventoryStorageKey]);

  useEffect(() => {
    if (!id) return;
    if (skipNextInventorySave.current) {
      skipNextInventorySave.current = false;
      return;
    }
    try {
      localStorage.setItem(inventoryStorageKey, JSON.stringify(inventoryCards));
    } catch {
      /* ignore */
    }
  }, [id, inventoryStorageKey, inventoryCards]);

  type SlotAssignments = Record<string, (InventoryCard | string | null)[]>;
  const [slotAssignments, setSlotAssignments] = useState<SlotAssignments>({});

  useEffect(() => {
    if (!id) return;
    try {
      const raw = localStorage.getItem(slotsStorageKey);
      const parsed = raw ? (JSON.parse(raw) as SlotAssignments) : {};
      if (parsed && typeof parsed === "object") setSlotAssignments(parsed);
      skipNextSlotsSave.current = true;
    } catch {
      setSlotAssignments({});
      skipNextSlotsSave.current = true;
    }
  }, [id, slotsStorageKey]);

  useEffect(() => {
    if (!id) return;
    if (skipNextSlotsSave.current) {
      skipNextSlotsSave.current = false;
      return;
    }
    try {
      localStorage.setItem(slotsStorageKey, JSON.stringify(slotAssignments));
    } catch {
      /* ignore */
    }
  }, [id, slotsStorageKey, slotAssignments]);

  useEffect(() => {
    if (!isResizing) return;
    const minW = 200;
    const maxW = 720;
    function onMove(e: MouseEvent) {
      const delta = e.clientX - resizeStartX.current;
      setInventoryWidth((w) => Math.min(maxW, Math.max(minW, resizeStartWidth.current + delta)));
    }
    function onUp() {
      setIsResizing(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isResizing]);

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
              <div className="flex items-center justify-between gap-2 p-3 border-b border-zinc-200 dark:border-zinc-700">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 shrink-0">카드 인벤토리</h2>
                  <button
                    type="button"
                    onClick={() => {
                      if (!book) return;
                      const types = getCardTypesForBookType(book.booktype_id);
                      const defaultId = types[0]?.definition.id ?? book.cardtype_id ?? "cardtype001";
                      setInventoryCards((prev) => [
                        {
                          id: crypto.randomUUID(),
                          frontCardTypeId: defaultId,
                          backCardTypeId: defaultId,
                        },
                        ...prev,
                      ]);
                    }}
                    className="shrink-0 rounded border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-600"
                  >
                    카드 만들기
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInventory(false)}
                  className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600 dark:hover:text-zinc-200 shrink-0"
                  aria-label="닫기"
                >
                  ×
                </button>
              </div>
              <div
                className="flex-1 overflow-y-auto p-2"
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                onDrop={(e) => {
                  e.preventDefault();
                  const raw = e.dataTransfer.getData("text/plain") || e.dataTransfer.getData("application/json");
                  if (!raw) return;
                  try {
                    const data = JSON.parse(raw) as { from?: string; pageId?: string; slotIndex?: number };
                    if (data.from === "slot" && data.pageId != null && data.slotIndex != null) {
                      const card = slotAssignments[data.pageId]?.[data.slotIndex];
                      if (card && typeof card === "object") setInventoryCards((inv) => [card, ...inv]);
                      setSlotAssignments((prev) => {
                        const arr = prev[data.pageId!] ?? [];
                        const next = [...arr];
                        next[data.slotIndex!] = null;
                        return { ...prev, [data.pageId!]: next };
                      });
                    }
                  } catch {
                    /* ignore */
                  }
                }}
              >
                <div className="grid grid-cols-4 gap-1.5">
                  {Array.from({ length: 4 * 50 }, (_, i) => {
                    const card = inventoryCards[i];
                    const num = i + 1;
                    const side = card ? (cardDisplaySide[card.id] ?? "front") : "front";
                    const typeId = card ? (side === "front" ? card.frontCardTypeId : card.backCardTypeId) : "";
                    const typeLabel = typeId ? (findCardTypeById(typeId)?.definition.name ?? typeId) : "";
                    const currentImage = card ? (side === "front" ? card.frontImage : card.backImage) : null;
                    const imgSrc = currentImage && (typeof currentImage === "string" && (currentImage.startsWith("http") || currentImage.startsWith("data:"))) ? currentImage : null;
                    const isFullImageType = typeId === "cardtype002";
                    const showImage = isFullImageType && imgSrc;
                    return card ? (
                      <div
                        key={card.id}
                        role="button"
                        tabIndex={0}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", JSON.stringify({ cardId: card.id }));
                          e.dataTransfer.effectAllowed = "copy";
                        }}
                        className="relative aspect-[54/86] rounded border border-zinc-300 bg-white dark:border-zinc-500 dark:bg-zinc-600 flex flex-col items-center justify-center gap-0.5 shadow-sm cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-zinc-400 dark:hover:ring-zinc-500 overflow-hidden"
                        onClick={() =>
                          setCardDisplaySide((prev) => ({
                            ...prev,
                            [card.id]: prev[card.id] === "back" ? "front" : "back",
                          }))
                        }
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setCardSettingsCardId(card.id);
                          setCardSettingsDraft({
                            frontCardTypeId: card.frontCardTypeId,
                            backCardTypeId: card.backCardTypeId,
                            frontImage: card.frontImage ?? null,
                            backImage: card.backImage ?? null,
                          });
                        }}
                      >
                        {showImage ? (
                          <img src={imgSrc} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
                        ) : null}
                      </div>
                    ) : (
                      <div
                        key={`empty-${i}`}
                        className="aspect-[54/86] rounded border border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-700 flex items-center justify-center"
                      >
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{num}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {cardSettingsCardId && book && cardSettingsDraft && (() => {
                const card = inventoryCards.find((c) => c.id === cardSettingsCardId);
                const cardTypesForBook = getCardTypesForBookType(book.booktype_id);
                if (!card) return null;
                const isUrl = (s: string) => s.startsWith("http://") || s.startsWith("https://");
                const getImgSrc = (path: string | null) =>
                  !path ? null : isUrl(path) ? path : path;
                const close = () => {
                  setCardSettingsCardId(null);
                  setCardSettingsDraft(null);
                };
                const deleteCard = () => {
                  setInventoryCards((prev) => prev.filter((c) => c.id !== card.id));
                  setSlotAssignments((prev) => {
                    const next: SlotAssignments = {};
                    for (const [pageId, arr] of Object.entries(prev)) {
                      next[pageId] = arr.map((v) =>
                        v && (typeof v === "object" ? v.id === card.id : v === card.id) ? null : v
                      );
                    }
                    return next;
                  });
                  close();
                };
                const apply = () => {
                  setInventoryCards((prev) =>
                    prev.map((c) =>
                      c.id === card.id
                        ? {
                            ...c,
                            frontCardTypeId: cardSettingsDraft.frontCardTypeId,
                            backCardTypeId: cardSettingsDraft.backCardTypeId,
                            frontImage: cardSettingsDraft.frontImage,
                            backImage: cardSettingsDraft.backImage,
                          }
                        : c
                    )
                  );
                  close();
                };
                const handleImageDrop = (side: "front" | "back") => async (e: React.DragEvent) => {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).classList.remove("ring-2", "ring-zinc-400");
                  const file = e.dataTransfer.files[0];
                  if (!file?.type.startsWith("image/")) return;
                  setCardUploadingSide(side);
                  try {
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("bookId", id ?? "");
                    const res = await fetch("/api/upload", { method: "POST", body: formData });
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}));
                      alert(data?.error ?? "업로드에 실패했습니다.");
                      return;
                    }
                    const { url } = (await res.json()) as { url: string };
                    setCardSettingsDraft((d) =>
                      d ? { ...d, [side === "front" ? "frontImage" : "backImage"]: url } : d
                    );
                  } finally {
                    setCardUploadingSide(null);
                  }
                };
                const renderImageSection = (side: "front" | "back") => {
                  const image = side === "front" ? cardSettingsDraft.frontImage : cardSettingsDraft.backImage;
                  const label = side === "front" ? "전면 이미지" : "후면 이미지";
                  const setImage = (v: string | null) =>
                    setCardSettingsDraft((d) =>
                      d ? { ...d, [side === "front" ? "frontImage" : "backImage"]: v } : d
                    );
                  const src = getImgSrc(image);
                  return (
                    <div key={side} className="space-y-2">
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</p>
                      <div
                        className="flex min-h-[160px] items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-200/80 dark:border-zinc-600 dark:bg-zinc-700/80"
                        onDragOver={(e) => {
                          e.preventDefault();
                          (e.currentTarget as HTMLElement).classList.add("ring-2", "ring-zinc-400");
                        }}
                        onDragLeave={(e) => {
                          (e.currentTarget as HTMLElement).classList.remove("ring-2", "ring-zinc-400");
                        }}
                        onDrop={handleImageDrop(side)}
                      >
                        {cardUploadingSide === side ? (
                          <span className="text-sm text-zinc-500">업로드 중...</span>
                        ) : src ? (
                          <img src={src} alt="" className="max-h-[140px] max-w-full object-contain" />
                        ) : (
                          <span className="text-sm text-zinc-500">드래그앤드롭 또는 아래에 이미지 주소 입력</span>
                        )}
                      </div>
                      <input
                        type="url"
                        value={image && isUrl(image) ? image : ""}
                        onChange={(e) => {
                          const v = e.target.value.trim();
                          setImage(v || null);
                        }}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (!v && image && isUrl(image)) setImage(null);
                        }}
                        placeholder="또는 이미지 URL (http://, https://)"
                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                      />
                    </div>
                  );
                };
                return (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
                    data-card-settings-modal
                    onClick={(e) => e.target === e.currentTarget && close()}
                  >
                    <div
                      className="flex max-h-[90vh] min-h-[400px] min-w-[1152px] flex-col rounded-2xl bg-white shadow-xl dark:bg-zinc-800"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-600">
                        <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">카드 설정</h2>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                            onClick={deleteCard}
                          >
                            카드 삭제
                          </button>
                          <button
                            type="button"
                            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-800 dark:hover:bg-zinc-600 dark:hover:text-zinc-100"
                            onClick={close}
                            aria-label="닫기"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4">
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <label className="block">
                              <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">카드타입 전면</span>
                              <select
                                value={cardSettingsDraft.frontCardTypeId}
                                onChange={(e) =>
                                  setCardSettingsDraft((d) => (d ? { ...d, frontCardTypeId: e.target.value } : d))
                                }
                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                              >
                                {cardTypesForBook.map((ct) => (
                                  <option key={ct.definition.id} value={ct.definition.id}>{ct.definition.name}</option>
                                ))}
                              </select>
                            </label>
                            {cardSettingsDraft.frontCardTypeId === "cardtype002" && renderImageSection("front")}
                          </div>
                          <div className="space-y-4">
                            <label className="block">
                              <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">카드타입 후면</span>
                              <select
                                value={cardSettingsDraft.backCardTypeId}
                                onChange={(e) =>
                                  setCardSettingsDraft((d) => (d ? { ...d, backCardTypeId: e.target.value } : d))
                                }
                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                              >
                                {cardTypesForBook.map((ct) => (
                                  <option key={ct.definition.id} value={ct.definition.id}>{ct.definition.name}</option>
                                ))}
                              </select>
                            </label>
                            {cardSettingsDraft.backCardTypeId === "cardtype002" && renderImageSection("back")}
                          </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                          <button
                            type="button"
                            onClick={apply}
                            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform active:scale-95 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                          >
                            적용
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </aside>
            <div
              role="separator"
              aria-label="인벤토리 너비 조절"
              className="w-1.5 shrink-0 cursor-col-resize bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-600 dark:hover:bg-zinc-500 flex items-center justify-center group"
              onMouseDown={(e) => {
                e.preventDefault();
                resizeStartX.current = e.clientX;
                resizeStartWidth.current = inventoryWidth;
                setIsResizing(true);
              }}
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
                        <div
                          data-card-grid
                          className="grid gap-2 w-full"
                          style={{
                            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                            aspectRatio: `${cols * 54} / ${rows * 86}`,
                          }}
                        >
                          {Array.from({ length: slotCount }, (_, i) => {
                            const pageId = left.id;
                            const rawSlot = slotAssignments[pageId]?.[i] ?? null;
                            const slotCard = rawSlot && typeof rawSlot === "object" ? rawSlot : (typeof rawSlot === "string" ? inventoryCards.find((c) => c.id === rawSlot) ?? null : null);
                            const slotSide = slotCard ? (cardDisplaySide[slotCard.id] ?? "front") : "front";
                            const slotTypeId = slotCard ? (slotSide === "front" ? slotCard.frontCardTypeId : slotCard.backCardTypeId) : "";
                            const slotImg = slotCard ? (slotSide === "front" ? slotCard.frontImage : slotCard.backImage) : null;
                            const slotImgSrc = slotTypeId === "cardtype002" && slotImg && (typeof slotImg === "string" && (slotImg.startsWith("http") || slotImg.startsWith("data:"))) ? slotImg : null;
                            return (
                              <div
                                key={i}
                                className={`relative flex min-w-0 items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-700 ${!slotCard ? "min-h-0" : ""}`}
                                style={{ aspectRatio: "54 / 86" }}
                                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const raw = e.dataTransfer.getData("text/plain") || e.dataTransfer.getData("application/json");
                                  if (!raw) return;
                                  try {
                                    const data = JSON.parse(raw) as { cardId?: string; from?: string; pageId?: string; slotIndex?: number };
                                    if (data.from === "slot" && data.pageId != null && data.slotIndex != null) {
                                      setSlotAssignments((prev) => {
                                        const card = prev[data.pageId!]?.[data.slotIndex!];
                                        const cardObj = card && typeof card === "object" ? card : null;
                                        if (!cardObj) return prev;
                                        const next = { ...prev };
                                        const srcArr = next[data.pageId!] ?? [];
                                        const srcCopy = [...srcArr];
                                        srcCopy[data.slotIndex!] = null;
                                        next[data.pageId!] = srcCopy;
                                        const tgtArr = next[pageId] ?? Array(slotCount).fill(null);
                                        const tgtCopy = tgtArr.length >= slotCount ? [...tgtArr] : [...tgtArr, ...Array(slotCount - tgtArr.length).fill(null)];
                                        tgtCopy[i] = cardObj;
                                        next[pageId] = tgtCopy.slice(0, slotCount);
                                        return next;
                                      });
                                    } else if (data.cardId) {
                                      const card = inventoryCards.find((c) => c.id === data.cardId);
                                      if (!card) return;
                                      setSlotAssignments((prev) => {
                                        const arr = prev[pageId] ?? Array(slotCount).fill(null);
                                        const next = arr.length >= slotCount ? [...arr] : [...arr, ...Array(slotCount - arr.length).fill(null)];
                                        next[i] = card;
                                        return { ...prev, [pageId]: next.slice(0, slotCount) };
                                      });
                                      setInventoryCards((prev) => prev.filter((c) => c.id !== data.cardId));
                                    }
                                  } catch {
                                    /* ignore */
                                  }
                                }}
                              >
                                {slotCard ? (
                                  <div
                                    className="absolute inset-0 rounded-lg overflow-hidden border border-zinc-300 bg-white dark:border-zinc-500 dark:bg-zinc-600 cursor-grab active:cursor-grabbing"
                                    draggable
                                    onDragOver={(ev) => { ev.preventDefault(); ev.stopPropagation(); ev.dataTransfer.dropEffect = "move"; }}
                                    onDrop={(ev) => {
                                      ev.preventDefault();
                                      ev.stopPropagation();
                                      const raw = ev.dataTransfer.getData("text/plain") || ev.dataTransfer.getData("application/json");
                                      if (!raw) return;
                                      try {
                                        const data = JSON.parse(raw) as { cardId?: string; from?: string; pageId?: string; slotIndex?: number };
                                        if (data.from === "slot" && data.pageId != null && data.slotIndex != null && (data.pageId !== pageId || data.slotIndex !== i)) {
                                          setSlotAssignments((prev) => {
                                            const card = prev[data.pageId!]?.[data.slotIndex!];
                                            const cardObj = card && typeof card === "object" ? card : null;
                                            if (!cardObj) return prev;
                                            const next = { ...prev };
                                            const srcArr = next[data.pageId!] ?? [];
                                            const srcCopy = [...srcArr];
                                            srcCopy[data.slotIndex!] = null;
                                            next[data.pageId!] = srcCopy;
                                            const tgtArr = next[pageId] ?? Array(slotCount).fill(null);
                                            const tgtCopy = tgtArr.length >= slotCount ? [...tgtArr] : [...tgtArr, ...Array(slotCount - tgtArr.length).fill(null)];
                                            tgtCopy[i] = cardObj;
                                            next[pageId] = tgtCopy.slice(0, slotCount);
                                            return next;
                                          });
                                        } else if (data.cardId) {
                                          const card = inventoryCards.find((c) => c.id === data.cardId);
                                          if (!card) return;
                                          setSlotAssignments((prev) => {
                                            const arr = prev[pageId] ?? Array(slotCount).fill(null);
                                            const next = arr.length >= slotCount ? [...arr] : [...arr, ...Array(slotCount - arr.length).fill(null)];
                                            next[i] = card;
                                            return { ...prev, [pageId]: next.slice(0, slotCount) };
                                          });
                                          setInventoryCards((prev) => prev.filter((c) => c.id !== data.cardId));
                                        }
                                      } catch {
                                        /* ignore */
                                      }
                                    }}
                                    onDragStart={(ev) => {
                                      ev.dataTransfer.setData("text/plain", JSON.stringify({ from: "slot", pageId, slotIndex: i }));
                                      ev.dataTransfer.effectAllowed = "move";
                                    }}
                                  >
                                    {slotImgSrc ? <img src={slotImgSrc} alt="" className="h-full w-full object-cover" draggable={false} /> : null}
                                  </div>
                                ) : (
                                  <span className="text-xs text-zinc-400 dark:text-zinc-500">{i + 1}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
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
                        <div
                          data-card-grid
                          className="grid gap-2 w-full"
                          style={{
                            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                            aspectRatio: `${cols * 54} / ${rows * 86}`,
                          }}
                        >
                          {Array.from({ length: slotCount }, (_, i) => {
                            const pageId = right.id;
                            const rawSlot = slotAssignments[pageId]?.[i] ?? null;
                            const slotCard = rawSlot && typeof rawSlot === "object" ? rawSlot : (typeof rawSlot === "string" ? inventoryCards.find((c) => c.id === rawSlot) ?? null : null);
                            const slotSide = slotCard ? (cardDisplaySide[slotCard.id] ?? "front") : "front";
                            const slotTypeId = slotCard ? (slotSide === "front" ? slotCard.frontCardTypeId : slotCard.backCardTypeId) : "";
                            const slotImg = slotCard ? (slotSide === "front" ? slotCard.frontImage : slotCard.backImage) : null;
                            const slotImgSrc = slotTypeId === "cardtype002" && slotImg && (typeof slotImg === "string" && (slotImg.startsWith("http") || slotImg.startsWith("data:"))) ? slotImg : null;
                            return (
                              <div
                                key={i}
                                className={`relative flex min-w-0 items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-700 ${!slotCard ? "min-h-0" : ""}`}
                                style={{ aspectRatio: "54 / 86" }}
                                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const raw = e.dataTransfer.getData("text/plain") || e.dataTransfer.getData("application/json");
                                  if (!raw) return;
                                  try {
                                    const data = JSON.parse(raw) as { cardId?: string; from?: string; pageId?: string; slotIndex?: number };
                                    if (data.from === "slot" && data.pageId != null && data.slotIndex != null) {
                                      setSlotAssignments((prev) => {
                                        const card = prev[data.pageId!]?.[data.slotIndex!];
                                        const cardObj = card && typeof card === "object" ? card : null;
                                        if (!cardObj) return prev;
                                        const next = { ...prev };
                                        const srcArr = next[data.pageId!] ?? [];
                                        const srcCopy = [...srcArr];
                                        srcCopy[data.slotIndex!] = null;
                                        next[data.pageId!] = srcCopy;
                                        const tgtArr = next[pageId] ?? Array(slotCount).fill(null);
                                        const tgtCopy = tgtArr.length >= slotCount ? [...tgtArr] : [...tgtArr, ...Array(slotCount - tgtArr.length).fill(null)];
                                        tgtCopy[i] = cardObj;
                                        next[pageId] = tgtCopy.slice(0, slotCount);
                                        return next;
                                      });
                                    } else if (data.cardId) {
                                      const card = inventoryCards.find((c) => c.id === data.cardId);
                                      if (!card) return;
                                      setSlotAssignments((prev) => {
                                        const arr = prev[pageId] ?? Array(slotCount).fill(null);
                                        const next = arr.length >= slotCount ? [...arr] : [...arr, ...Array(slotCount - arr.length).fill(null)];
                                        next[i] = card;
                                        return { ...prev, [pageId]: next.slice(0, slotCount) };
                                      });
                                      setInventoryCards((prev) => prev.filter((c) => c.id !== data.cardId));
                                    }
                                  } catch {
                                    /* ignore */
                                  }
                                }}
                              >
                                {slotCard ? (
                                  <div
                                    className="absolute inset-0 rounded-lg overflow-hidden border border-zinc-300 bg-white dark:border-zinc-500 dark:bg-zinc-600 cursor-grab active:cursor-grabbing"
                                    draggable
                                    onDragOver={(ev) => { ev.preventDefault(); ev.stopPropagation(); ev.dataTransfer.dropEffect = "move"; }}
                                    onDrop={(ev) => {
                                      ev.preventDefault();
                                      ev.stopPropagation();
                                      const raw = ev.dataTransfer.getData("text/plain") || ev.dataTransfer.getData("application/json");
                                      if (!raw) return;
                                      try {
                                        const data = JSON.parse(raw) as { cardId?: string; from?: string; pageId?: string; slotIndex?: number };
                                        if (data.from === "slot" && data.pageId != null && data.slotIndex != null && (data.pageId !== pageId || data.slotIndex !== i)) {
                                          setSlotAssignments((prev) => {
                                            const card = prev[data.pageId!]?.[data.slotIndex!];
                                            const cardObj = card && typeof card === "object" ? card : null;
                                            if (!cardObj) return prev;
                                            const next = { ...prev };
                                            const srcArr = next[data.pageId!] ?? [];
                                            const srcCopy = [...srcArr];
                                            srcCopy[data.slotIndex!] = null;
                                            next[data.pageId!] = srcCopy;
                                            const tgtArr = next[pageId] ?? Array(slotCount).fill(null);
                                            const tgtCopy = tgtArr.length >= slotCount ? [...tgtArr] : [...tgtArr, ...Array(slotCount - tgtArr.length).fill(null)];
                                            tgtCopy[i] = cardObj;
                                            next[pageId] = tgtCopy.slice(0, slotCount);
                                            return next;
                                          });
                                        } else if (data.cardId) {
                                          const card = inventoryCards.find((c) => c.id === data.cardId);
                                          if (!card) return;
                                          setSlotAssignments((prev) => {
                                            const arr = prev[pageId] ?? Array(slotCount).fill(null);
                                            const next = arr.length >= slotCount ? [...arr] : [...arr, ...Array(slotCount - arr.length).fill(null)];
                                            next[i] = card;
                                            return { ...prev, [pageId]: next.slice(0, slotCount) };
                                          });
                                          setInventoryCards((prev) => prev.filter((c) => c.id !== data.cardId));
                                        }
                                      } catch {
                                        /* ignore */
                                      }
                                    }}
                                    onDragStart={(ev) => {
                                      ev.dataTransfer.setData("text/plain", JSON.stringify({ from: "slot", pageId, slotIndex: i }));
                                      ev.dataTransfer.effectAllowed = "move";
                                    }}
                                  >
                                    {slotImgSrc ? <img src={slotImgSrc} alt="" className="h-full w-full object-cover" draggable={false} /> : null}
                                  </div>
                                ) : (
                                  <span className="text-xs text-zinc-400 dark:text-zinc-500">{i + 1}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
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
