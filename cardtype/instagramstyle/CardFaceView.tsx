"use client";

import { useLayoutEffect, useRef, useState, type FC } from "react";

import heartIcon from "./img/01_heart.png";
import commentIcon from "./img/02_comment.png";
import sendIcon from "./img/03_send.png";
import bookmarkIcon from "./img/04_bookmark.png";
import profileImg from "./img/09_profile.png";

const NICKNAME = "Jiho_Lee";

export type CardFaceViewProps = {
  imageUrl: string | null;
  caption?: string;
  tags?: string;
  showImage?: boolean;
  filterColor?: string;
  filterOpacity?: number;
  filterEnabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * 인스타 스타일 카드 한 면 렌더링.
 * 흰 테두리, 상단 프로필, 정사각(1:1) 메인 이미지, 그 아래 남는 영역에 아이콘·캡션·태그.
 * "00명이 좋아합니다" 미포함.
 */
const CardFaceView: FC<CardFaceViewProps> = ({
  imageUrl,
  caption = "",
  tags = "",
  showImage = true,
  filterColor = "#000000",
  filterOpacity = 50,
  filterEnabled = false,
  className = "",
  style,
}) => {
  const imgSrc = showImage && imageUrl && (imageUrl.startsWith("http") || imageUrl.startsWith("data:")) ? imageUrl : null;
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const captionLineRef = useRef<HTMLParagraphElement>(null);
  const [showMoreVisible, setShowMoreVisible] = useState(false);

  useLayoutEffect(() => {
    if (!caption || captionExpanded) {
      setShowMoreVisible(false);
      return;
    }
    const el = captionLineRef.current;
    if (!el) return;
    setShowMoreVisible(el.scrollHeight > el.clientHeight);
  }, [caption, captionExpanded]);

  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden rounded-lg bg-white text-zinc-900 dark:bg-white dark:text-zinc-900 ${className}`}
      style={{ border: "3px solid #fff", boxShadow: "0 0 0 1px rgba(0,0,0,0.1)", ...style }}
    >
      {/* 상단: 프로필 + 닉네임 + 옵션 */}
      <div className="flex shrink-0 items-center gap-1 border-b border-zinc-200 bg-white px-1 py-0.5">
        <div className="flex h-3 w-3 shrink-0 overflow-hidden rounded-full bg-zinc-300">
          <img src={profileImg.src} alt="" className="h-full w-full object-cover" />
        </div>
        <span className="min-w-0 flex-1 truncate text-[7px] font-semibold">{NICKNAME}</span>
        <span className="shrink-0 text-[7px] text-zinc-500" aria-hidden>⋯</span>
      </div>

      {/* 메인 이미지 영역: 정사각 1:1 (뒷배경까지 정사각) */}
      <div className="relative shrink-0 w-full overflow-hidden bg-zinc-100" style={{ aspectRatio: "1 / 1" }}>
        {imgSrc ? (
          <>
            <img
              src={imgSrc}
              alt=""
              className="h-full w-full object-cover"
            />
            {filterEnabled && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundColor: filterColor, opacity: filterOpacity / 100 }}
              />
            )}
          </>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[7px] text-zinc-400">이미지 없음</span>
        )}
      </div>

      {/* 아래 내용 영역: 남는 세로 공간 전부 사용 */}
      <div className="flex min-h-0 flex-1 flex-col border-t border-zinc-200 bg-white">
        {/* 하트 · 말풍선 · 종이비행기 (왼쪽) / 북마크 (오른쪽) */}
        <div className="flex shrink-0 items-center justify-between gap-0.5 px-1 py-0.5">
          <div className="flex items-center gap-1">
            <img src={heartIcon.src} alt="" className="h-2 w-2 object-contain" />
            <img src={commentIcon.src} alt="" className="h-2 w-2 object-contain" aria-hidden />
            <img src={sendIcon.src} alt="" className="h-2 w-2 object-contain" aria-hidden />
          </div>
          <img src={bookmarkIcon.src} alt="" className="h-2 w-2 object-contain" aria-hidden />
        </div>
        {caption ? (
          <div className="min-h-0 flex-1 overflow-hidden px-1 py-0.5">
            {!captionExpanded ? (
              <div className="flex flex-col gap-0 leading-none">
                <p
                  ref={captionLineRef}
                  className="m-0 text-[7px] leading-tight text-zinc-700 line-clamp-1"
                >
                  <span className="font-semibold">{NICKNAME}</span> {caption}
                </p>
                {showMoreVisible && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCaptionExpanded(true); }}
                    className="mt-0.5 self-start text-[7px] text-zinc-500 hover:text-zinc-700"
                  >
                    더보기
                  </button>
                )}
              </div>
            ) : (
              <p className="text-[7px] leading-tight text-zinc-700 line-clamp-4">
                <span className="font-semibold">{NICKNAME}</span> {caption}
              </p>
            )}
          </div>
        ) : null}
        {tags ? (
          <div className="shrink-0 px-1 py-0.5">
            <p className="text-[6px] leading-tight text-zinc-500 line-clamp-1">{tags}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CardFaceView;
