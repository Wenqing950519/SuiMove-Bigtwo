import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { fail, ok } from "@/lib/api"
import { getSessionAddress } from "@/lib/auth"
import { resetPermanentAiRoom } from "@/lib/room"
import {
  type GameActionIntent,
  advanceAiTurn,
  applyGameAction,
  buildRoomGamePayload,
  getRoomWithGame,
  startMultiplayerGame,
} from "@/lib/multiplayer-game"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params
  const walletAddress = getSessionAddress(req)
  try {
    let room = await getRoomWithGame(prisma, code)
    if (!room) return fail("Room not found", 404)

    for (let i = 0; i < 8; i += 1) {
      const advanced = await prisma.$transaction(async (tx) => advanceAiTurn(tx, room!.id))
      if (!advanced) break
      room = await getRoomWithGame(prisma, code)
      if (!room || room.status === "FINISHED") break
    }

    if (!room) return fail("Room not found", 404)
    return ok(buildRoomGamePayload(room, walletAddress))
  } catch (error) {
    return fail((error as Error).message || "Failed to load room", 500)
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params
  const walletAddress = getSessionAddress(req)
  if (!walletAddress) return fail("Please sign in with your Sui wallet", 401)

  const body = (await req.json().catch(() => null)) as GameActionIntent | null
  if (!body || typeof body !== "object" || typeof body.intent !== "string") {
    return fail("Invalid game action", 400)
  }

  try {
    await prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({
        where: { code: code.toUpperCase() },
        include: { players: { orderBy: { seatIndex: "asc" } }, gameState: true },
      })
      if (!room) throw new Error("Room not found")
      const player = room.players.find((entry) => entry.walletAddress === walletAddress)
      if (!player) throw new Error("You are not seated in this room")

      if (body.intent === "start") {
        await startMultiplayerGame(tx, room.id)
        return
      }

      if (body.intent === "abandon") {
        const reset = await resetPermanentAiRoom(tx, room.id, room.code)
        if (!reset) {
          if (room.status === "WAITING" || room.status === "STARTING") {
            await tx.roomPlayer.delete({ where: { id: player.id } })
            const remaining = await tx.roomPlayer.count({ where: { roomId: room.id } })
            await tx.room.update({ where: { id: room.id }, data: { status: remaining > 0 ? "WAITING" : "FINISHED" } })
          } else {
            await tx.room.update({ where: { id: room.id }, data: { status: "FINISHED" } })
            await tx.gameState.updateMany({ where: { roomId: room.id }, data: { status: "FINISHED" } })
          }
        }
        return
      }

      if (body.intent === "record-chain") {
        if (body.chainRoomId) {
          await tx.room.update({ where: { id: room.id }, data: { chainRoomId: body.chainRoomId } })
        }
        if (body.stakeTxDigest) {
          await tx.roomPlayer.update({ where: { id: player.id }, data: { stakeTxDigest: body.stakeTxDigest } })
        }
        if (body.claimTxDigest && room.gameState?.handsCommitment && typeof room.gameState.handsCommitment === "object") {
          const meta = room.gameState.handsCommitment as Record<string, unknown>
          meta.claimTxDigest = body.claimTxDigest
          meta.stakeMode = "sui-escrow-linked"
          await tx.gameState.update({
            where: { roomId: room.id },
            data: { handsCommitment: meta as Prisma.InputJsonValue },
          })
        }
        return
      }

      await applyGameAction(tx, room.id, player.seatIndex, body)
    })

    const updated = await getRoomWithGame(prisma, code)
    if (!updated) return fail("Room not found after update", 404)
    return ok(buildRoomGamePayload(updated, walletAddress))
  } catch (error) {
    return fail((error as Error).message || "Game action failed", 400)
  }
}
