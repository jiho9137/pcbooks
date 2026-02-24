import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

/**
 * 카드 이미지 업로드 (Vercel Blob).
 * POST multipart/form-data, 필드명: file
 * 환경변수: BLOB_READ_WRITE_TOKEN (Vercel 대시보드 Storage에서 Blob 스토어 생성 후 자동 생성)
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "이미지 파일이 필요합니다." },
        { status: 400 }
      );
    }

    const bookId = (formData.get("bookId") as string) || "default";
    const ext = file.name.split(".").pop() || "jpg";
    const pathname = `cards/${bookId}/${Date.now()}-${file.name.slice(0, 20).replace(/[^a-zA-Z0-9.-]/g, "")}.${ext}`;

    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "업로드에 실패했습니다." },
      { status: 500 }
    );
  }
}
