import { put, del } from "@vercel/blob";
import { NextResponse } from "next/server";

const BLOB_URL_PATTERN = /^https:\/\/[^/]+\.(public|private)\.blob\.vercel-storage\.com\//;

/**
 * 카드 이미지 업로드 (Vercel Blob).
 * POST multipart/form-data, 필드명: file
 * 환경변수: BLOB_READ_WRITE_TOKEN (Vercel 대시보드 Storage에서 Blob 스토어 생성 후 자동 생성)
 */
export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN이 설정되지 않았습니다. Vercel Storage에서 Blob 스토어를 생성하세요." },
      { status: 503 }
    );
  }
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

/**
 * Blob 이미지 삭제.
 * DELETE body: { urls: string[] } (우리 Blob 스토어 URL만 삭제됨)
 */
export async function DELETE(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN이 설정되지 않았습니다." },
      { status: 503 }
    );
  }
  try {
    const body = (await request.json()) as { urls?: string[] };
    const urls = Array.isArray(body?.urls) ? body.urls : [];
    const blobUrls = urls.filter((u) => typeof u === "string" && BLOB_URL_PATTERN.test(u));
    if (blobUrls.length > 0) await del(blobUrls);
    return NextResponse.json({ deleted: blobUrls.length });
  } catch (err) {
    console.error("Blob delete error:", err);
    return NextResponse.json(
      { error: "삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
