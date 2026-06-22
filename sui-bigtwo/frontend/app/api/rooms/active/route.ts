import { prisma } from "@/lib/prisma"
import { fail, ok } from "@/lib/api"
import { getSessionAddress } from "@/lib/auth"
import { toRoomSummary } from "@/lib/room"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const walletAddress = getSessionAddress(req)
  if (!walletAddress) return ok(null)

  try {
    const active = await prisma.roomPlayer.findFirst({
      where: { walletAddress, room: { status: { not: "FINISHED" } } },
      include: {
        room: {
          include: { players: { select: { seatIndex: true, walletAddress: true } } },
        },
      },
      orderBy: { joinedAt: "desc" },
    })

    if (!active) return ok(null)
    return ok({
      seatIndex: active.seatIndex,
      room: toRoomSummary(active.room),
    })
  } catch (error) {
    return fail((error as Error).message || "Failed to load active room", 500)
  }
}
