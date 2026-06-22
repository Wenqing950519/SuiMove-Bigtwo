import type { Prisma, PrismaClient, Room, RoomPlayer, RoomStatus } from "@prisma/client"

export const MAX_SEATS = 4
export const STAKE_MIST = BigInt(1_000_000_000) // 1 SUI

export const PERMANENT_AI_ROOMS = [
  { code: "ROBO", bots: 3 },
  { code: "DUOS", bots: 2 },
] as const

const BOT_NAMES = ["AI West", "AI North", "AI East"]
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

type DbLike = PrismaClient | Prisma.TransactionClient

export function generateRoomCode(): string {
  return Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("")
}

export function isPermanentAiRoom(code: string): boolean {
  return PERMANENT_AI_ROOMS.some((room) => room.code === code.toUpperCase())
}

function botWallet(roomCode: string, seat: number): string {
  const tag = `${roomCode}${seat}`
  let hex = ""
  for (let i = 0; i < tag.length; i += 1) hex += tag.charCodeAt(i).toString(16).padStart(2, "0")
  return `0x${hex.padEnd(40, "0").slice(0, 40)}`
}

async function ensureBotSeats(db: DbLike, roomId: string, roomCode: string, bots: number) {
  for (let seat = 1; seat <= bots; seat += 1) {
    const walletAddress = botWallet(roomCode, seat)
    const user = await db.user.upsert({
      where: { walletAddress },
      update: { nickname: BOT_NAMES[seat - 1] ?? `AI Seat ${seat}` },
      create: { walletAddress, nickname: BOT_NAMES[seat - 1] ?? `AI Seat ${seat}` },
    })

    const existingSeat = await db.roomPlayer.findUnique({
      where: { roomId_seatIndex: { roomId, seatIndex: seat } },
      include: { user: { select: { nickname: true } } },
    })
    if (existingSeat && existingSeat.user.nickname?.startsWith("AI")) continue
    if (existingSeat) continue

    await db.roomPlayer.create({
      data: { roomId, userId: user.id, seatIndex: seat, walletAddress },
    })
  }
}

export async function ensurePermanentAiRooms(db: DbLike) {
  for (const spec of PERMANENT_AI_ROOMS) {
    const existing = await db.room.findUnique({ where: { code: spec.code }, select: { id: true, status: true } })

    if (!existing) {
      const room = await db.room.create({ data: { code: spec.code, status: "WAITING", stakeAmount: STAKE_MIST } })
      await ensureBotSeats(db, room.id, spec.code, spec.bots)
      continue
    }

    if (existing.status === "FINISHED") {
      await resetPermanentAiRoom(db, existing.id, spec.code)
      continue
    }

    await ensureBotSeats(db, existing.id, spec.code, spec.bots)
  }
}

export async function resetPermanentAiRoom(db: DbLike, roomId: string, roomCode: string) {
  const spec = PERMANENT_AI_ROOMS.find((room) => room.code === roomCode.toUpperCase())
  if (!spec) return false

  await db.gameEvent.deleteMany({ where: { roomId } })
  await db.verificationSnapshot.deleteMany({ where: { roomId } })
  await db.gameState.deleteMany({ where: { roomId } })
  await db.roomPlayer.deleteMany({ where: { roomId, user: { nickname: { not: { startsWith: "AI" } } } } })
  await db.room.update({ where: { id: roomId }, data: { status: "WAITING", chainRoomId: null } })
  await ensureBotSeats(db, roomId, spec.code, spec.bots)
  return true
}

export async function createUniqueRoomCode(
  db: PrismaClient | Prisma.TransactionClient,
  attempts = 25,
): Promise<string> {
  for (let i = 0; i < attempts; i += 1) {
    const code = generateRoomCode()
    const existing = await db.room.findUnique({ where: { code }, select: { id: true } })
    if (!existing) return code
  }
  throw new Error("Unable to generate a unique room code")
}

const STATUS_LABEL: Record<RoomStatus, string> = {
  WAITING: "等待玩家",
  STARTING: "準備開始",
  PLAYING: "遊戲中",
  FINISHED: "已結束",
}

const STATUS_TONE: Record<RoomStatus, "open" | "soon" | "waiting" | "playing" | "done"> = {
  WAITING: "waiting",
  STARTING: "soon",
  PLAYING: "playing",
  FINISHED: "done",
}

export function formatStake(mist: bigint): string {
  return `${Number(mist) / 1e9} SUI`
}

type RoomWithPlayers = Room & { players: Pick<RoomPlayer, "seatIndex" | "walletAddress">[] }

export function toRoomSummary(room: RoomWithPlayers) {
  const filled = room.players.length
  return {
    code: room.code,
    stake: formatStake(room.stakeAmount),
    seats: `${filled}/${MAX_SEATS}`,
    filled,
    status: STATUS_LABEL[room.status],
    rawStatus: room.status,
    tone: STATUS_TONE[room.status],
    chainRoomId: room.chainRoomId,
    permanent: isPermanentAiRoom(room.code),
  }
}

export function nextFreeSeat(seats: number[]): number | null {
  for (let i = 0; i < MAX_SEATS; i += 1) {
    if (!seats.includes(i)) return i
  }
  return null
}
