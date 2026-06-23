import { NextResponse } from "next/server"
import { fail } from "@/lib/api"
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE, loginMessage, makeSessionToken, verifyNonceToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { verifyPersonalMessageSignature } from "@mysten/sui/verify"
import { normalizeSuiAddress } from "@mysten/sui/utils"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST /api/auth/verify — 驗證簽章並建立 session
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { address?: unknown; signature?: unknown; nonce?: unknown }
    | null
  if (
    !body ||
    typeof body.address !== "string" ||
    typeof body.signature !== "string" ||
    typeof body.nonce !== "string"
  ) {
    return fail("缺少 address / signature / nonce")
  }

  let address: string
  try {
    address = normalizeSuiAddress(body.address)
  } catch {
    return fail("address 格式不正確")
  }

  if (!verifyNonceToken(body.nonce, address)) return fail("登入挑戰已失效，請重新登入")

  const message = new TextEncoder().encode(loginMessage(body.nonce))
  try {
    const publicKey = await verifyPersonalMessageSignature(message, body.signature)
    if (normalizeSuiAddress(publicKey.toSuiAddress()) !== address) {
      return fail("簽章與錢包地址不符", 401)
    }
  } catch {
    return fail("簽章驗證失敗", 401)
  }

  await prisma.user.upsert({
    where: { walletAddress: address },
    update: {},
    create: { walletAddress: address },
  })

  const res = NextResponse.json({ ok: true, data: { address } })
  res.cookies.set(SESSION_COOKIE_NAME, makeSessionToken(address), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
  return res
}
