import { NextResponse } from "next/server"

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init)
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

const WALLET_RE = /^0x[0-9a-fA-F]{1,64}$/

export function parseWalletBody(body: unknown): { walletAddress: string; nickname?: string } {
  if (!body || typeof body !== "object") throw new Error("請提供請求內容")
  const { walletAddress, nickname } = body as Record<string, unknown>
  if (typeof walletAddress !== "string" || !WALLET_RE.test(walletAddress)) {
    throw new Error("walletAddress 格式不正確（需為 0x 開頭的位址）")
  }
  if (nickname !== undefined && typeof nickname !== "string") {
    throw new Error("nickname 格式不正確")
  }
  return { walletAddress, nickname: nickname?.slice(0, 40) }
}
