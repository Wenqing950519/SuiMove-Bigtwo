import { createHmac, timingSafeEqual } from "node:crypto"

// 無狀態身分機制：HMAC 簽章的 token，不需資料表也不需額外套件。
// nonce token 短效，用於登入挑戰；session token 長效，存在 httpOnly cookie。

const SECRET = process.env.AUTH_SECRET ?? "dev-insecure-secret-change-me"
export const SESSION_COOKIE_NAME = "bigtwo_session"

const NONCE_TTL_MS = 5 * 60 * 1000
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

interface TokenBody {
  kind: "nonce" | "session"
  address: string
  exp: number
}

function sign(data: string): string {
  return createHmac("sha256", SECRET).update(data).digest("base64url")
}

function makeToken(kind: TokenBody["kind"], address: string, ttl: number): string {
  const body: TokenBody = { kind, address, exp: Date.now() + ttl }
  const data = Buffer.from(JSON.stringify(body)).toString("base64url")
  return `${data}.${sign(data)}`
}

function readToken(token: string | undefined | null): TokenBody | null {
  if (!token) return null
  const [data, sig] = token.split(".")
  if (!data || !sig) return null
  const expected = sign(data)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const body = JSON.parse(Buffer.from(data, "base64url").toString()) as TokenBody
    if (typeof body.exp !== "number" || body.exp < Date.now()) return null
    return body
  } catch {
    return null
  }
}

export function makeNonceToken(address: string): string {
  return makeToken("nonce", address, NONCE_TTL_MS)
}

export function verifyNonceToken(token: string, address: string): boolean {
  const body = readToken(token)
  return !!body && body.kind === "nonce" && body.address === address
}

export function loginMessage(nonce: string): string {
  return [
    "Sui Big Two 登入",
    "",
    "簽署此訊息以登入，這不會發起任何交易、也不會花費任何 SUI。",
    "",
    `Nonce: ${nonce}`,
  ].join("\n")
}

export function makeSessionToken(address: string): string {
  return makeToken("session", address, SESSION_TTL_MS)
}

export function readSessionToken(token: string | undefined | null): string | null {
  const body = readToken(token)
  return body && body.kind === "session" ? body.address : null
}

export function getSessionAddress(req: Request): string | null {
  const cookie = req.headers.get("cookie") ?? ""
  const match = cookie.match(/(?:^|;\s*)bigtwo_session=([^;]+)/)
  if (!match) return null
  return readSessionToken(decodeURIComponent(match[1]))
}

export const SESSION_MAX_AGE = SESSION_TTL_MS / 1000
