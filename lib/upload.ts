/**
 * 카드 이미지 업로드/삭제 (Vercel Blob API 클라이언트).
 * @see docs/refactoring-plan.md Phase 1
 */

const UPLOAD_ENDPOINT = "/api/upload";

/** Vercel Blob 스토어 URL 여부 */
export function isBlobUrl(url: string | null | undefined): url is string {
  if (!url || typeof url !== "string") return false;
  return /^https:\/\/[^/]+\.(public|private)\.blob\.vercel-storage\.com\//.test(url);
}

/**
 * 카드 이미지를 Blob에 업로드하고 URL 반환.
 * @throws 실패 시 에러 메시지로 reject
 */
export async function uploadCardImage(file: File, bookId: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bookId", bookId);

  const res = await fetch(UPLOAD_ENDPOINT, { method: "POST", body: formData });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data?.error ?? "업로드에 실패했습니다.");
  }

  const data = (await res.json()) as { url?: string };
  if (!data?.url) throw new Error("업로드 응답에 URL이 없습니다.");
  return data.url;
}

/**
 * Blob URL 목록 삭제. Blob URL이 아닌 항목은 무시.
 * 실패해도 예외를 삼키고 호출부는 계속 진행 가능(카드 삭제 시 Blob 실패 무시).
 */
export async function deleteCardImageUrls(urls: string[]): Promise<void> {
  const blobUrls = urls.filter(isBlobUrl);
  if (blobUrls.length === 0) return;

  try {
    const res = await fetch(UPLOAD_ENDPOINT, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: blobUrls }),
    });
    if (!res.ok) {
      console.warn("[upload] Blob 삭제 실패:", res.status, await res.text());
    }
  } catch (err) {
    console.warn("[upload] Blob 삭제 요청 실패:", err);
  }
}
