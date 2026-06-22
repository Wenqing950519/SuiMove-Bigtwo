import { NextResponse } from "next/server"
import { SESSION_COOKIE_NAME } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST /api/auth/logout — 清除 session
export async function POST() {
  const res = NextResponse.json({ ok: true, data: { ok: true } })
  res.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 })
  return res
}
