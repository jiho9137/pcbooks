import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "pcbooks_session";

export function middleware(request: NextRequest) {
  const session = request.cookies.get(COOKIE_NAME)?.value;
  const isLoggedIn = session === "1";
  const { pathname } = request.nextUrl;

  // 로그인 필요 경로: /bookshelf, /settings, /create, /book 및 그 하위
  if (
    pathname.startsWith("/bookshelf") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/create") ||
    pathname.startsWith("/book")
  ) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 이미 로그인된 상태에서 로그인 페이지(/) 접근 시 bookshelf로 리다이렉트 (선택)
  if (pathname === "/" && isLoggedIn) {
    return NextResponse.redirect(new URL("/bookshelf", request.url));
  }

  return NextResponse.next();
}
