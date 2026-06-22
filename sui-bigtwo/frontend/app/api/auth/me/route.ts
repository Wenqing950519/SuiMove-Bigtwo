import { ok } from "@/lib/api"
import { getSessionAddress } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/auth/me — 目前登入身分
export async function GET(req: Request) {
  return ok({ address: getSessionAddress(req) })
}
