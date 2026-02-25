"use client";

import type { InventoryCard, SlotAssignments } from "@/lib/book/types";
import { getInstagramCaptionFromCard, getInstagramTagsFromCard } from "@/lib/book/cardTypeData";
import dynamic from "next/dynamic";

const CardFaceViewInstagram = dynamic(
  () => import("@/cardtype/instagramstyle/CardFaceView").then((m) => m.default),
  { ssr: false }
);

type DragData = { cardId?: string; from?: string; pageId?: string; slotIndex?: number };

type Props = {
  pageId: string;
  slotCount: number;
  rows: number;
  cols: number;
  slotAssignments: SlotAssignments;
  inventoryCards: InventoryCard[];
  cardDisplaySide: Record<string, "front" | "back">;
  onToggleDisplaySide?: (cardId: string) => void;
  onCardContextMenu?: (card: InventoryCard) => void;
  setSlotAssignments: React.Dispatch<React.SetStateAction<SlotAssignments>>;
  setInventoryCards: React.Dispatch<React.SetStateAction<InventoryCard[]>>;
};

function parseDragData(raw: string): DragData | null {
  try {
    return JSON.parse(raw) as DragData;
  } catch {
    return null;
  }
}

export function SlotGrid({
  pageId,
  slotCount,
  rows,
  cols,
  slotAssignments,
  inventoryCards,
  cardDisplaySide,
  onToggleDisplaySide,
  onCardContextMenu,
  setSlotAssignments,
  setInventoryCards,
}: Props) {
  const slots = slotAssignments[pageId] ?? [];

  const handleDrop = (e: React.DragEvent, targetSlotIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const raw = e.dataTransfer.getData("text/plain") || e.dataTransfer.getData("application/json");
    if (!raw) return;
    const data = parseDragData(raw);
    if (!data) return;

    if (data.from === "slot" && data.pageId != null && data.slotIndex != null) {
      if (data.pageId === pageId && data.slotIndex === targetSlotIndex) return;
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
        tgtCopy[targetSlotIndex] = cardObj;
        next[pageId] = tgtCopy.slice(0, slotCount);
        return next;
      });
    } else if (data.cardId) {
      const card = inventoryCards.find((c) => c.id === data.cardId);
      if (!card) return;
      setSlotAssignments((prev) => {
        const arr = prev[pageId] ?? Array(slotCount).fill(null);
        const next = arr.length >= slotCount ? [...arr] : [...arr, ...Array(slotCount - arr.length).fill(null)];
        next[targetSlotIndex] = card;
        return { ...prev, [pageId]: next.slice(0, slotCount) };
      });
      setInventoryCards((prev) => prev.filter((c) => c.id !== data.cardId));
    }
  };

  return (
    <div
      data-card-grid
      className="grid gap-2 w-full"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        aspectRatio: `${cols * 54} / ${rows * 86}`,
      }}
    >
      {Array.from({ length: slotCount }, (_, i) => {
        const rawSlot = slots[i] ?? null;
        const slotCard = rawSlot && typeof rawSlot === "object" ? rawSlot : (typeof rawSlot === "string" ? inventoryCards.find((c) => c.id === rawSlot) ?? null : null);
        const slotSide = slotCard ? (cardDisplaySide[slotCard.id] ?? "front") : "front";
        const slotTypeId = slotCard ? (slotSide === "front" ? slotCard.frontCardTypeId : slotCard.backCardTypeId) : "";
        const slotImg = slotCard ? (slotSide === "front" ? slotCard.frontImage : slotCard.backImage) : null;
        const slotImgSrc = (slotTypeId === "cardtype002" || slotTypeId === "cardtype003") && slotImg && typeof slotImg === "string" && (slotImg.startsWith("http") || slotImg.startsWith("data:")) ? slotImg : null;
        const slotShowImage = slotCard && (slotSide === "front" ? (slotCard.frontShowImage ?? true) : (slotCard.backShowImage ?? true));
        const slotFilterEnabled = slotCard && (slotSide === "front" ? (slotCard.frontFilterColorEnabled ?? false) : (slotCard.backFilterColorEnabled ?? false));
        const slotFilterColor = slotCard ? (slotSide === "front" ? (slotCard.frontFilterColor ?? "#000000") : (slotCard.backFilterColor ?? "#000000")) : "#000000";
        const slotFilterOpacity = slotCard ? (slotSide === "front" ? (slotCard.frontFilterOpacity ?? 50) : (slotCard.backFilterOpacity ?? 50)) : 50;
        const slotCaption = slotCard ? getInstagramCaptionFromCard(slotCard, slotSide) : "";
        const slotTags = slotCard ? getInstagramTagsFromCard(slotCard, slotSide) : "";
        const isInstagramStyle = slotTypeId === "cardtype003";

        return (
          <div
            key={i}
            className={`relative flex min-w-0 items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-700 ${!slotCard ? "min-h-0" : ""}`}
            style={{ aspectRatio: "54 / 86" }}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
            onDrop={(e) => handleDrop(e, i)}
          >
            {slotCard ? (
              <div
                role="button"
                tabIndex={0}
                className="absolute inset-0 rounded-lg overflow-hidden border border-zinc-300 bg-white dark:border-zinc-500 dark:bg-zinc-600 cursor-grab active:cursor-grabbing"
                draggable
                onClick={(ev) => {
                  ev.stopPropagation();
                  onToggleDisplaySide?.(slotCard.id);
                }}
                onContextMenu={(ev) => {
                  ev.preventDefault();
                  ev.stopPropagation();
                  onCardContextMenu?.(slotCard);
                }}
                onDragOver={(ev) => { ev.preventDefault(); ev.stopPropagation(); ev.dataTransfer.dropEffect = "move"; }}
                onDrop={(ev) => handleDrop(ev, i)}
                onDragStart={(ev) => {
                  ev.dataTransfer.setData("text/plain", JSON.stringify({ from: "slot", pageId, slotIndex: i }));
                  ev.dataTransfer.effectAllowed = "move";
                }}
              >
                {isInstagramStyle ? (
                  <CardFaceViewInstagram
                    imageUrl={slotImgSrc ?? null}
                    caption={slotCaption}
                    tags={slotTags}
                    showImage={!!slotShowImage}
                    filterEnabled={!!slotFilterEnabled}
                    filterColor={slotFilterColor}
                    filterOpacity={slotFilterOpacity}
                    className="h-full w-full"
                    style={{ minHeight: 0 }}
                  />
                ) : slotImgSrc && slotShowImage ? (
                  <>
                    <img src={slotImgSrc} alt="" className="h-full w-full object-cover" draggable={false} />
                    {slotFilterEnabled && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ backgroundColor: slotFilterColor, opacity: slotFilterOpacity / 100 }}
                      />
                    )}
                  </>
                ) : null}
              </div>
            ) : (
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{i + 1}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
