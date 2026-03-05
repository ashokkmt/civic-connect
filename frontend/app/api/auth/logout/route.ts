import { NextResponse } from "next/server";

const TOKEN_COOKIE = "auth_token";

export async function POST() {
  const next = NextResponse.json({ success: true }, { status: 200 });
  next.cookies.set({
    name: TOKEN_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return next;
}
