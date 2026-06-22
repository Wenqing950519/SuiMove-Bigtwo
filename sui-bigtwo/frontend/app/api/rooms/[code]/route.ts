import { prisma } from "@/lib/prisma"
import { fail, ok } from "@/lib/api"
import { toRoomSummary } from "@/lib/room"

export const dynamic = "force-dynamic"

// GET /api/rooms/:code — 單一房間詳情
export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params
  try {
    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        players: {
          select: { seatIndex: true, walletAddress: true, joinedAt: true },
          orderBy: { seatIndex: "asc" },
        },
        gameState: true,
      },
    })
    if (!room) return fail("找不到房間", 404)
    return ok({ ...toRoomSummary(room), players: room.players, gameState: room.gameState })
  } catch (error) {
    return fail((error as Error).message ?? "讀取房間失敗", 500)
  }
}
