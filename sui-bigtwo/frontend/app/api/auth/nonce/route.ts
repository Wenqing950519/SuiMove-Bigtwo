import { fail, ok } from "@/lib/api"
import { loginMessage, makeNonceToken } from "@/lib/auth"
import { normalizeSuiAddress } from "@mysten/sui/utils"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST /api/auth/nonce — 取得登入挑戰
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { address?: unknown } | null
  if (!body || typeof body.address !== "string") return fail("缺少 address")
  let address: string
  try {
    address = normalizeSuiAddress(body.address)
  } catch {
    return fail("address 格式不正確")
  }
  const nonce = makeNonceToken(address)
  return ok({ nonce, message: loginMessage(nonce) })
}
