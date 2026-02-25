"use client";

import type { InventoryCard } from "@/lib/book/types";
import { getInstagramCaptionFromCard, getInstagramTagsFromCard } from "@/lib/book/cardTypeData";
import dynamic from "next/dynamic";

const CardFaceViewInstagram = dynamic(
  () => import("@/cardtype/instagramstyle/CardFaceView").then((m) => m.default),
  { ssr: false }
);

type DragData = { from?: string; pageId?: string; slotIndex?: number; cardId?: string };

type Props = {
  cards: InventoryCard[];
  cardDisplaySide: Record<string, "front" | "back">;
  onToggleDisplaySide: (cardId: string) => void;
  onCardContextMenu: (card: InventoryCard) => void;
  onDropFromSlot: (data: DragData) => void;
  onCreateCard: () => void;
  onClose: () => void;
};

export function InventoryGrid({
  cards,
  cardDisplaySide,
  onToggleDisplaySide,
  onCardContextMenu,
  onDropFromSlot,
  onCreateCard,
  onClose,
}: Props) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain") || e.dataTransfer.getData("application/json");
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as DragData;
      if (data.from === "slot" && data.pageId != null && data.slotIndex != null) {
        onDropFromSlot(data);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2 p-3 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 shrink-0">카드 인벤토리</h2>
          <button
            type="button"
            onClick={onCreateCard}
            className="shrink-0 rounded border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-600"
          >
            카드 만들기
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600 dark:hover:text-zinc-200 shrink-0"
          aria-label="닫기"
        >
          ×
        </button>
      </div>
      <div
        className="flex-1 overflow-y-auto p-2"
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
        onDrop={handleDrop}
      >
        <div className="grid grid-cols-4 gap-1.5">
          {Array.from({ length: 4 * 50 }, (_, i) => {
            const card = cards[i];
            const num = i + 1;
            const side = card ? (cardDisplaySide[card.id] ?? "front") : "front";
            const typeId = card ? (side === "front" ? card.frontCardTypeId : card.backCardTypeId) : "";
            const currentImage = card ? (side === "front" ? card.frontImage : card.backImage) : null;
            const imgSrc = currentImage && typeof currentImage === "string" && (currentImage.startsWith("http") || currentImage.startsWith("data:")) ? currentImage : null;
            const isFullImageType = typeId === "cardtype002" || typeId === "cardtype003";
            const showImageFlag = side === "front" ? (card?.frontShowImage ?? true) : (card?.backShowImage ?? true);
            const showImage = isFullImageType && imgSrc && showImageFlag;
            const filterEnabled = side === "front" ? (card?.frontFilterColorEnabled ?? false) : (card?.backFilterColorEnabled ?? false);
            const filterColor = side === "front" ? (card?.frontFilterColor ?? "#000000") : (card?.backFilterColor ?? "#000000");
            const filterOpacity = side === "front" ? (card?.frontFilterOpacity ?? 50) : (card?.backFilterOpacity ?? 50);
            const caption = card ? getInstagramCaptionFromCard(card, side) : "";
            const tags = card ? getInstagramTagsFromCard(card, side) : "";
            const isInstagramStyle = typeId === "cardtype003";
            return card ? (
              <div
                key={card.id}
                role="button"
                tabIndex={0}
                draggable
                onDragStart={(e) => {
                  const payload = JSON.stringify({ cardId: card.id });
                  e.dataTransfer.setData("text/plain", payload);
                  e.dataTransfer.setData("application/json", payload);
                  e.dataTransfer.effectAllowed = "move";
                }}
                className="relative aspect-[54/86] rounded border border-zinc-300 bg-white dark:border-zinc-500 dark:bg-zinc-600 flex flex-col items-center justify-center gap-0.5 shadow-sm cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-zinc-400 dark:hover:ring-zinc-500 overflow-hidden"
                onClick={() => onToggleDisplaySide(card.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onCardContextMenu(card);
                }}
              >
                {isInstagramStyle ? (
                  <CardFaceViewInstagram
                    imageUrl={imgSrc ?? null}
                    caption={caption}
                    tags={tags}
                    showImage={!!showImage}
                    filterEnabled={!!filterEnabled}
                    filterColor={filterColor}
                    filterOpacity={filterOpacity}
                    className="absolute inset-0 h-full w-full"
                  />
                ) : showImage ? (
                  <>
                    <img src={imgSrc!} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
                    {filterEnabled && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ backgroundColor: filterColor, opacity: filterOpacity / 100 }}
                      />
                    )}
                  </>
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
    </>
  );
}
