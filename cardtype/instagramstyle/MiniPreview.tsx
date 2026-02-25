"use client";

import type { FC } from "react";

const NICKNAME = "Jiho_Lee";

export type MiniPreviewProps = {
  className?: string;
};

/**
 * 카드 설정 모달·드래그앤드롭 위치에서 쓰는 인스타 스타일 미니 프리뷰.
 * 1:1 정사각 고정, 여백은 아래 내용부(아이콘·아이디/Text·Tag)로.
 */
const MiniPreview: FC<MiniPreviewProps> = ({ className = "" }) => {
  return (
    <div
      className={`flex h-full w-full min-h-0 flex-col rounded-md border border-zinc-300 bg-white overflow-hidden shadow-sm ${className}`}
    >
      <div className="flex shrink-0 items-center gap-0.5 border-b border-zinc-200 bg-white px-0.5 py-px">
        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
        <span className="min-w-0 flex-1 truncate text-[5px] font-medium text-zinc-700">{NICKNAME}</span>
        <span className="text-[5px] text-zinc-400">⋯</span>
      </div>
      <div
        className="flex min-h-0 w-full flex-1 items-center justify-center bg-zinc-100 dark:bg-zinc-700"
        style={{ aspectRatio: "1 / 1", maxHeight: "55%" }}
      >
        <span className="text-[5px] text-zinc-500">1:1</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between border-t border-zinc-200 bg-white px-0.5 py-0">
          <div className="flex items-center gap-0.5">
            <span className="h-1 w-1 rounded-sm bg-zinc-400" />
            <span className="h-1 w-1 rounded-sm bg-zinc-400" />
            <span className="h-1 w-1 rounded-sm bg-zinc-400" />
          </div>
          <span className="h-1 w-1 rounded-sm bg-zinc-400" />
        </div>
        <div className="shrink-0 bg-white px-0.5 pt-0 pb-0.5 leading-tight">
          <span className="text-[4px] font-semibold text-zinc-700">{NICKNAME}</span>
          <span className="text-[4px] text-zinc-500"> Text Example</span>
        </div>
        <div className="min-h-0 flex-1" />
        <div className="shrink-0 border-t border-zinc-100 bg-white px-0.5 py-px">
          <span className="text-[4px] text-zinc-400 line-clamp-1">#Tag1 #Tag2</span>
        </div>
      </div>
    </div>
  );
};

export default MiniPreview;
