import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "pkbooks_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7일

export async function POST(request: NextRequest) {
  const { password } = (await request.json()) as { password?: string };
  const expected = process.env.PKBOOKS_PASSWORD;

  if (!expected) {
    return NextResponse.json(
      { error: "서버 설정 오류" },
      { status: 500 }
    );
  }

  if (password !== expected) {
    return NextResponse.json(
      { error: "비밀번호가 올바르지 않습니다" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}
