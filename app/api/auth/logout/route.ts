import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("pcbooks_session", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}
