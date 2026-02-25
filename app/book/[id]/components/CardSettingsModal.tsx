"use client";

import type { CardSettingsDraft, InventoryCard } from "@/lib/book/types";
import {
  getInstagramCaption,
  getInstagramTags,
  setInstagramCaption,
  setInstagramTags,
} from "@/lib/book/cardTypeData";
import dynamic from "next/dynamic";

const CardTypeSettingsInstagram = dynamic(
  () => import("@/cardtype/instagramstyle/CardTypeSettings").then((m) => m.default),
  { ssr: false }
);

const InstagramMiniPreview = dynamic(
  () => import("@/cardtype/instagramstyle/MiniPreview").then((m) => m.default),
  { ssr: false }
);
type CardUploadApi = {
  uploadingSide: "front" | "back" | null;
  uploadFile: (file: File, side: "front" | "back") => Promise<void>;
  triggerFileSelect: (side: "front" | "back") => void;
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
};

type CardTypeOption = { definition: { id: string; name: string } };

type Props = {
  card: InventoryCard;
  draft: CardSettingsDraft;
  onDraftChange: React.Dispatch<React.SetStateAction<CardSettingsDraft | null>>;
  onApply: () => void;
  onDelete: () => void;
  onClose: () => void;
  cardUpload: CardUploadApi;
  cardTypesForBook: CardTypeOption[];
};

function isUrl(s: string) {
  return s.startsWith("http://") || s.startsWith("https://");
}

function getImgSrc(path: string | null) {
  return !path ? null : isUrl(path) ? path : path;
}

export function CardSettingsModal({
  card,
  draft,
  onDraftChange,
  onApply,
  onDelete,
  onClose,
  cardUpload,
  cardTypesForBook,
}: Props) {
  const handleImageDrop = (side: "front" | "back") => async (e: React.DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove("ring-2", "ring-zinc-400");
    const file = e.dataTransfer.files[0];
    if (!file?.type.startsWith("image/")) return;
    await cardUpload.uploadFile(file, side);
  };

  const cardTypeOptions = cardTypesForBook.map((ct) => ({ id: ct.definition.id, name: ct.definition.name }));

  const getCardTypeMiniPreview = (typeId: string) => {
    if (typeId === "cardtype001") {
      return (
        <div className="flex h-full min-h-full w-full items-center justify-center rounded-md border border-zinc-300 bg-white" title="기본 포토카드" />
      );
    }
    if (typeId === "cardtype002") {
      return (
        <div className="flex h-full min-h-full w-full items-center justify-center rounded-md border border-zinc-300 bg-zinc-100 dark:bg-zinc-600">
          <span className="text-[10px] text-zinc-500">이미지</span>
        </div>
      );
    }
    if (typeId === "cardtype003") {
      return <InstagramMiniPreview className="h-full w-full" />;
    }
    return <div className="h-full w-full rounded-md border border-zinc-300 bg-zinc-50" />;
  };

  const handleCardTypeDrop = (side: "front" | "back") => (e: React.DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove("ring-2", "ring-zinc-400");
    const raw = e.dataTransfer.getData("application/x-card-type-id") || e.dataTransfer.getData("text/plain");
    if (!raw) return;
    let typeId: string | null = null;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed?.cardTypeId) typeId = parsed.cardTypeId;
      else if (typeof raw === "string" && raw.startsWith("cardtype")) typeId = raw;
    } catch {
      if (raw.startsWith("cardtype")) typeId = raw;
    }
    if (typeId && cardTypeOptions.some((o) => o.id === typeId)) {
      onDraftChange((d) => (d ? { ...d, [side === "front" ? "frontCardTypeId" : "backCardTypeId"]: typeId! } : d));
    }
  };

  const renderSideBlock = (side: "front" | "back") => {
    const isFront = side === "front";
    const typeId = isFront ? draft.frontCardTypeId : draft.backCardTypeId;
    const image = isFront ? draft.frontImage : draft.backImage;
    const filterEnabled = isFront ? draft.frontFilterColorEnabled : draft.backFilterColorEnabled;
    const filterColor = isFront ? draft.frontFilterColor : draft.backFilterColor;
    const filterOpacity = isFront ? draft.frontFilterOpacity : draft.backFilterOpacity;
    const setFilterEnabled = (v: boolean) =>
      onDraftChange((d) => (d ? { ...d, [isFront ? "frontFilterColorEnabled" : "backFilterColorEnabled"]: v } : d));
    const setFilterColor = (v: string) =>
      onDraftChange((d) => (d ? { ...d, [isFront ? "frontFilterColor" : "backFilterColor"]: v } : d));
    const setFilterOpacity = (v: number) =>
      onDraftChange((d) => (d ? { ...d, [isFront ? "frontFilterOpacity" : "backFilterOpacity"]: v } : d));
    const setImage = (v: string | null) =>
      onDraftChange((d) => (d ? { ...d, [isFront ? "frontImage" : "backImage"]: v } : d));
    const setTypeId = (v: string) =>
      onDraftChange((d) => (d ? { ...d, [isFront ? "frontCardTypeId" : "backCardTypeId"]: v } : d));
    const typeData = isFront ? draft.frontCardTypeData : draft.backCardTypeData;
    const caption = getInstagramCaption(typeData);
    const tags = getInstagramTags(typeData);
    const setCaption = (v: string) =>
      onDraftChange((d) =>
        d
          ? {
              ...d,
              [isFront ? "frontCardTypeData" : "backCardTypeData"]: setInstagramCaption(
                isFront ? d.frontCardTypeData : d.backCardTypeData,
                v
              ),
            }
          : d
      );
    const setTags = (v: string) =>
      onDraftChange((d) =>
        d
          ? {
              ...d,
              [isFront ? "frontCardTypeData" : "backCardTypeData"]: setInstagramTags(
                isFront ? d.frontCardTypeData : d.backCardTypeData,
                v
              ),
            }
          : d
      );
    const src = getImgSrc(image);

    return (
      <div key={side} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-600 dark:bg-zinc-700/30">
        <h3 className="mb-4 text-base font-semibold text-zinc-800 dark:text-zinc-200">
          {isFront ? "카드타입 전면" : "카드타입 후면"}
        </h3>
        <div className="mb-4 flex gap-4">
          <div
            className="flex w-32 min-h-[120px] shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-200/80 dark:border-zinc-600 dark:bg-zinc-700/80"
            onDragOver={(e) => {
              e.preventDefault();
              (e.currentTarget as HTMLElement).classList.add("ring-2", "ring-zinc-400");
            }}
            onDragLeave={(e) => {
              (e.currentTarget as HTMLElement).classList.remove("ring-2", "ring-zinc-400");
            }}
            onDrop={handleImageDrop(side)}
          >
            {cardUpload.uploadingSide === side ? (
              <span className="text-sm text-zinc-500">업로드 중...</span>
            ) : src ? (
              <img src={src} alt="" className="max-h-[100px] max-w-full object-contain" />
            ) : (
              <span className="px-2 text-center text-xs text-zinc-500">드롭 또는 파일 선택</span>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <input
              type="url"
              value={image && isUrl(image) ? image : ""}
              onChange={(e) => setImage(e.target.value.trim() || null)}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (!v && image && isUrl(image)) setImage(null);
              }}
              placeholder="이미지 URL (http://, https://)"
              className="min-w-0 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={() => cardUpload.triggerFileSelect(side)}
              disabled={cardUpload.uploadingSide !== null}
              className="w-fit shrink-0 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            >
              파일 선택
            </button>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={filterEnabled}
                  onChange={(e) => setFilterEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">필터적용</span>
              </label>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">색상</span>
              <input
                type="color"
                value={filterColor}
                onChange={(e) => setFilterColor(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border border-zinc-300 bg-transparent p-0"
                title="색상 선택"
              />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">투명도</span>
              <input
                type="number"
                min={0}
                max={100}
                value={filterOpacity}
                onChange={(e) => setFilterOpacity(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                className="w-14 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
              <span className="text-sm text-zinc-500">%</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-start gap-4">
          <div className="space-y-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Type : {cardTypeOptions.find((o) => o.id === typeId)?.name ?? "—"}
            </span>
            <div
              className="flex w-32 shrink-0 aspect-[54/86] items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-100/80 dark:border-zinc-600 dark:bg-zinc-700/50"
              onDragOver={(e) => {
                e.preventDefault();
                if (e.dataTransfer.types.includes("application/x-card-type-id") || e.dataTransfer.types.includes("text/plain")) {
                  (e.currentTarget as HTMLElement).classList.add("ring-2", "ring-zinc-400");
                }
              }}
              onDragLeave={(e) => (e.currentTarget as HTMLElement).classList.remove("ring-2", "ring-zinc-400")}
              onDrop={handleCardTypeDrop(side)}
            >
              <div className="h-full w-full p-0.5">
                {getCardTypeMiniPreview(typeId)}
              </div>
            </div>
            <p className="text-[10px] text-zinc-500">카드타입을 끌어다 놓으세요</p>
          </div>
          {typeId === "cardtype003" && (
            <div className="mt-[1.5rem] min-w-[320px] flex-1">
              <CardTypeSettingsInstagram
                caption={caption}
                tags={tags}
                onCaptionChange={setCaption}
                onTagsChange={setTags}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      data-card-settings-modal
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="flex max-h-[90vh] min-h-[560px] min-w-[1728px] flex-col rounded-2xl bg-white shadow-xl dark:bg-zinc-800"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <input
          ref={cardUpload.fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={cardUpload.handleFileInputChange}
          aria-hidden
        />
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-600">
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">카드 설정</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
              onClick={onDelete}
            >
              카드 삭제
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-800 dark:hover:bg-zinc-600 dark:hover:text-zinc-100"
              onClick={onClose}
              aria-label="닫기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4">
          <div className="grid grid-cols-[400px_1fr_1fr] gap-8">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-600 dark:bg-zinc-700/30">
              <h3 className="mb-3 text-base font-semibold text-zinc-800 dark:text-zinc-200">카드타입 고르기</h3>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">미니 예시를 전면/후면 카드타입 드래그앤드롭 박스로 끌어다 놓으면 해당 카드타입이 적용됩니다.</p>
              <div className="flex flex-wrap gap-3">
                {cardTypeOptions.map((opt) => (
                  <div
                    key={opt.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/x-card-type-id", JSON.stringify({ cardTypeId: opt.id }));
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    className="flex cursor-grab active:cursor-grabbing flex-col items-center gap-1 rounded-lg border border-zinc-300 bg-white p-2 shadow-sm hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-zinc-500"
                  >
                    <div className="flex w-16 shrink-0 min-h-0 aspect-[54/86]">
                      {getCardTypeMiniPreview(opt.id)}
                    </div>
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{opt.name}</span>
                  </div>
                ))}
              </div>
            </div>
            {renderSideBlock("front")}
            {renderSideBlock("back")}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onApply}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform active:scale-95 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
