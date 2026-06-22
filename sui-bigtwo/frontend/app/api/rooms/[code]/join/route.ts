import { prisma } from "@/lib/prisma"
import { fail, ok } from "@/lib/api"
import { getSessionAddress } from "@/lib/auth"
import { MAX_SEATS, nextFreeSeat, toRoomSummary } from "@/lib/room"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST /api/rooms/:code/join — 加入房間（自動補空位，坐滿轉為即將開始）
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params
  const walletAddress = getSessionAddress(req)
  if (!walletAddress) return fail("請先登入", 401)
  const body = (await req.json().catch(() => null)) as { nickname?: unknown } | null
  const nickname = typeof body?.nickname === "string" ? body.nickname.slice(0, 40) : undefined

  try {
    const room = await prisma.$transaction(async (tx) => {
      const target = await tx.room.findUnique({
        where: { code: code.toUpperCase() },
        include: { players: true },
      })
      if (!target) throw new Error("找不到房間")
      if (target.status === "FINISHED") throw new Error("房間已結束")

      const user = await tx.user.upsert({
        where: { walletAddress },
        update: nickname ? { nickname } : {},
        create: { walletAddress, nickname },
      })

      const already = target.players.find((p) => p.userId === user.id)
      if (already) {
        return tx.room.findUniqueOrThrow({
          where: { id: target.id },
          include: { players: { select: { seatIndex: true, walletAddress: true } } },
        })
      }

      if (target.players.length >= MAX_SEATS) throw new Error("房間已滿")

      const active = await tx.roomPlayer.findFirst({
        where: { userId: user.id, room: { status: { not: "FINISHED" } } },
        include: { room: { select: { code: true } } },
      })
      if (active) throw new Error(`你已經在房間 ${active.room.code} 中`)

      const seat = nextFreeSeat(target.players.map((p) => p.seatIndex))
      if (seat === null) throw new Error("沒有空位")

      await tx.roomPlayer.create({
        data: { roomId: target.id, userId: user.id, seatIndex: seat, walletAddress },
      })

      const willBeFull = target.players.length + 1 >= MAX_SEATS
      return tx.room.update({
        where: { id: target.id },
        data: willBeFull ? { status: "STARTING" } : {},
        include: { players: { select: { seatIndex: true, walletAddress: true } } },
      })
    })
    return ok(toRoomSummary(room))
  } catch (error) {
    return fail((error as Error).message ?? "加入房間失敗", 400)
  }
}
