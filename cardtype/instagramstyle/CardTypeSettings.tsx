"use client";

import type { FC } from "react";

export type CardTypeSettingsProps = {
  /** 내용 입력란 (캡션) */
  caption: string;
  /** 태그 입력란 (해시태그) */
  tags: string;
  onCaptionChange: (value: string) => void;
  onTagsChange: (value: string) => void;
};

/**
 * 인스타 스타일 카드타입 전용 설정: 내용 입력란, 태그 입력란.
 * 카드타입 전면/후면 드래그앤드롭 위치 오른쪽에 렌더링한다.
 */
const CardTypeSettings: FC<CardTypeSettingsProps> = ({
  caption,
  tags,
  onCaptionChange,
  onTagsChange,
}) => {
  return (
    <div className="space-y-3 rounded-lg border border-zinc-200 bg-white/80 p-3 dark:border-zinc-600 dark:bg-zinc-800/80">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          내용 입력란
        </label>
        <textarea
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="캡션 입력"
          rows={4}
          className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          태그 입력란
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => onTagsChange(e.target.value)}
          placeholder="#태그1 #태그2"
          className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
        />
      </div>
    </div>
  );
};

export default CardTypeSettings;
