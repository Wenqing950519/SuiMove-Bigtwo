import { prisma } from "@/lib/prisma"
import { fail, ok } from "@/lib/api"
import { getSessionAddress } from "@/lib/auth"
import { STAKE_MIST, createUniqueRoomCode, ensurePermanentAiRooms, toRoomSummary } from "@/lib/room"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await ensurePermanentAiRooms(prisma)
    const rooms = await prisma.room.findMany({
      where: { status: { not: "FINISHED" } },
      orderBy: [{ code: "asc" }, { createdAt: "desc" }],
      take: 50,
      include: { players: { select: { seatIndex: true, walletAddress: true } } },
    })
    return ok(rooms.map(toRoomSummary))
  } catch (error) {
    return fail((error as Error).message ?? "Failed to load rooms", 500)
  }
}

export async function POST(req: Request) {
  const walletAddress = getSessionAddress(req)
  if (!walletAddress) return fail("Please sign in with your Sui wallet", 401)
  const body = (await req.json().catch(() => null)) as { nickname?: unknown } | null
  const nickname = typeof body?.nickname === "string" ? body.nickname.slice(0, 40) : undefined

  try {
    const room = await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { walletAddress },
        update: nickname ? { nickname } : {},
        create: { walletAddress, nickname },
      })

      const active = await tx.roomPlayer.findFirst({
        where: { userId: user.id, room: { status: { not: "FINISHED" } } },
        include: { room: { select: { code: true } } },
      })
      if (active) throw new Error(`你已經在房間 ${active.room.code} 中`)

      const code = await createUniqueRoomCode(tx)
      return tx.room.create({
        data: {
          code,
          stakeAmount: STAKE_MIST,
          createdById: user.id,
          players: { create: { userId: user.id, seatIndex: 0, walletAddress } },
        },
        include: { players: { select: { seatIndex: true, walletAddress: true } } },
      })
    })
    return ok(toRoomSummary(room), { status: 201 })
  } catch (error) {
    return fail((error as Error).message ?? "Failed to create room", 400)
  }
}
