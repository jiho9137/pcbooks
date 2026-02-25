"use client";

import { useRef, useState } from "react";
import { uploadCardImage } from "@/lib/upload";

type CardImageSide = "front" | "back";

/**
 * 카드 이미지 업로드 진행 상태 + uploadCardImage 호출.
 * @see docs/refactoring-plan.md Phase 2.3
 */
export function useCardUpload(bookId: string, onUploaded: (side: CardImageSide, url: string) => void) {
  const [uploadingSide, setUploadingSide] = useState<CardImageSide | null>(null);
  const [fileInputSide, setFileInputSide] = useState<CardImageSide | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File, side: CardImageSide) => {
    setUploadingSide(side);
    try {
      const url = await uploadCardImage(file, bookId);
      onUploaded(side, url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "업로드에 실패했습니다.");
    } finally {
      setUploadingSide(null);
    }
  };

  const triggerFileSelect = (side: CardImageSide) => {
    setFileInputSide(side);
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const side = fileInputSide;
    e.target.value = "";
    setFileInputSide(null);
    if (!file?.type.startsWith("image/") || !side) return;
    await uploadFile(file, side);
  };

  return {
    uploadingSide,
    uploadFile,
    triggerFileSelect,
    handleFileInputChange,
    fileInputRef,
  };
}
