import { createHash, randomBytes } from "node:crypto"
import { Prisma } from "@prisma/client"
import type { PrismaClient } from "@prisma/client"
import { chooseBotMove } from "@/lib/big-two-bot"
import {
  type Card,
  analyzePlay,
  commitmentHash,
  containsThreeClubs,
  dealHands,
  findStarter,
  isValidPlay,
  makeCard,
  makeOrderedDeck,
  shortHash,
  shuffleDeck,
  sortHand,
} from "@/lib/big-two"

export const MULTIPLAYER_SEATS = 4
export const THREE_CLUBS_ID = 0

export type GameActionIntent =
  | { intent: "start" }
  | { intent: "abandon" }
  | { intent: "play"; cardIds: number[] }
  | { intent: "pass" }
  | { intent: "record-chain"; chainRoomId?: string; claimTxDigest?: string; stakeTxDigest?: string }

export type StoredGameMeta = {
  version: 1
  deckIds: number[]
  deckSaltHex: string
  deckCommitment: string
  handSaltsHex: string[]
  handCommitments: string[]
  passCount: number
  firstTurn: boolean
  winnerSeat: number | null
  eventHead: string | null
  revealed: boolean
  revealHash: string | null
  replayStatus: "PENDING" | "PASS" | "FAIL"
  chainRoomId: string | null
  claimTxDigest: string | null
  stakeMode: "backend-verified" | "sui-escrow-linked"
}

type StoredHands = {
  hands: number[][]
  originalHands: number[][]
  remainingCounts: number[]
}

type RoomForPayload = Prisma.RoomGetPayload<{
  include: {
    players: { select: { seatIndex: true; walletAddress: true; stakeTxDigest: true; joinedAt: true; user: { select: { nickname: true } } } }
    gameState: true
    events: { orderBy: { eventIndex: "asc" } }
    verifications: { orderBy: { createdAt: "desc" }; take: 1 }
  }
}>

export function cardIdsToCards(ids: number[]): Card[] {
  return ids.map((id) => makeCard(id))
}

export function cardsToIds(cards: Card[]): number[] {
  return cards.map((card) => card.id)
}

export function saltHexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < clean.length; i += 2) bytes[i / 2] = Number.parseInt(clean.slice(i, i + 2), 16)
  return bytes
}


function randomSaltHex() {
  return `0x${randomBytes(32).toString("hex")}`
}

function sha3Hex(value: string) {
  return `0x${createHash("sha3-256").update(value).digest("hex")}`
}

function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, inner) => {
    if (!inner || typeof inner !== "object" || Array.isArray(inner)) return inner
    return Object.keys(inner)
      .sort()
      .reduce<Record<string, unknown>>((out, key) => {
        out[key] = (inner as Record<string, unknown>)[key]
        return out
      }, {})
  })
}

export function handCommitment(cardIds: number[], saltHex: string): string {
  return sha3Hex(stableJson({ cardIds, saltHex }))
}

export function eventHash(input: {
  previousHash: string | null
  eventIndex: number
  kind: string
  playerSeat: number | null
  payload: unknown
}): string {
  return sha3Hex(stableJson(input))
}

function parseMeta(value: Prisma.JsonValue | null | undefined): StoredGameMeta | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const candidate = value as Partial<StoredGameMeta>
  return candidate.version === 1 ? (candidate as StoredGameMeta) : null
}

function parseHands(value: Prisma.JsonValue | null | undefined): StoredHands | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const candidate = value as Partial<StoredHands>
  if (!Array.isArray(candidate.hands) || !Array.isArray(candidate.originalHands)) return null
  return candidate as StoredHands
}

function lastPlayPayload(value: Prisma.JsonValue | null | undefined): { seat: number; cardIds: number[] } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const candidate = value as { seat?: unknown; cardIds?: unknown }
  if (typeof candidate.seat !== "number" || !Array.isArray(candidate.cardIds)) return null
  return { seat: candidate.seat, cardIds: candidate.cardIds.filter((id): id is number => typeof id === "number") }
}

function nextSeat(seat: number) {
  return (seat + 1) % MULTIPLAYER_SEATS
}

export async function startMultiplayerGame(tx: Prisma.TransactionClient, roomId: string) {
  const room = await tx.room.findUnique({
    where: { id: roomId },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  })
  if (!room) throw new Error("Room not found")
  if (room.players.length !== MULTIPLAYER_SEATS) throw new Error("Need four seated players before starting")
  if (room.status === "PLAYING") throw new Error("Game already started")
  if (room.status === "FINISHED") throw new Error("Room already finished")

  const seed = randomBytes(4).readUInt32BE(0)
  const deck = shuffleDeck(makeOrderedDeck(), seed)
  const deckIds = deck.map((card) => card.id)
  const deckSaltHex = randomSaltHex()
  const deckCommitment = commitmentHash(deck, saltHexToBytes(deckSaltHex))
  const handsAsCards = dealHands(deck).map((hand) => sortHand(hand))
  const hands = handsAsCards.map(cardsToIds)
  const handSaltsHex = hands.map(() => randomSaltHex())
  const handCommitments = hands.map((hand, index) => handCommitment(hand, handSaltsHex[index]))
  const starter = findStarter(handsAsCards)
  const firstHash = eventHash({
    previousHash: null,
    eventIndex: 0,
    kind: "room_started",
    playerSeat: null,
    payload: { deckCommitment, handCommitments, starter },
  })

  const meta: StoredGameMeta = {
    version: 1,
    deckIds,
    deckSaltHex,
    deckCommitment,
    handSaltsHex,
    handCommitments,
    passCount: 0,
    firstTurn: true,
    winnerSeat: null,
    eventHead: firstHash,
    revealed: false,
    revealHash: null,
    replayStatus: "PENDING",
    chainRoomId: room.chainRoomId ?? null,
    claimTxDigest: null,
    stakeMode: room.chainRoomId ? "sui-escrow-linked" : "backend-verified",
  }
  const handState: StoredHands = {
    hands,
    originalHands: hands.map((hand) => hand.slice()),
    remainingCounts: hands.map((hand) => hand.length),
  }

  await tx.gameEvent.deleteMany({ where: { roomId } })
  await tx.verificationSnapshot.deleteMany({ where: { roomId } })
  await tx.gameState.upsert({
    where: { roomId },
    update: {
      currentTurn: starter,
      lastPlay: Prisma.JsonNull,
      handsCommitment: meta as unknown as Prisma.InputJsonValue,
      remainingCounts: handState as unknown as Prisma.InputJsonValue,
      status: "PLAYING",
    },
    create: {
      roomId,
      currentTurn: starter,
      lastPlay: Prisma.JsonNull,
      handsCommitment: meta as unknown as Prisma.InputJsonValue,
      remainingCounts: handState as unknown as Prisma.InputJsonValue,
      status: "PLAYING",
    },
  })
  await tx.gameEvent.create({
    data: {
      roomId,
      eventIndex: 0,
      kind: "room_started",
      playerSeat: null,
      payload: { deckCommitment, handCommitments, starter, previousHash: null, eventHash: firstHash },
    },
  })
  await tx.verificationSnapshot.create({
    data: {
      roomId,
      deckCommitment,
      revealedDeckHash: null,
      replayStatus: "PENDING",
      errors: [],
    },
  })
  await tx.room.update({ where: { id: roomId }, data: { status: "PLAYING" } })
}

export async function applyGameAction(tx: Prisma.TransactionClient, roomId: string, seat: number, intent: GameActionIntent) {
  const gameState = await tx.gameState.findUnique({ where: { roomId } })
  if (!gameState) throw new Error("Game has not started")
  if (gameState.status === "FINISHED") throw new Error("Game already finished")
  if (gameState.currentTurn !== seat) throw new Error("Not your turn")

  const meta = parseMeta(gameState.handsCommitment)
  const handState = parseHands(gameState.remainingCounts)
  if (!meta || !handState) throw new Error("Game state is corrupt")

  const previousLastPlay = lastPlayPayload(gameState.lastPlay)
  const previousEvent = await tx.gameEvent.findFirst({
    where: { roomId },
    orderBy: { eventIndex: "desc" },
  })
  const eventIndex = (previousEvent?.eventIndex ?? -1) + 1
  const previousHash =
    previousEvent?.payload && typeof previousEvent.payload === "object" && !Array.isArray(previousEvent.payload)
      ? ((previousEvent.payload as { eventHash?: string }).eventHash ?? meta.eventHead)
      : meta.eventHead

  if (intent.intent === "pass") {
    if (meta.firstTurn || !previousLastPlay) throw new Error("Cannot pass before an active play exists")
    const passCount = meta.passCount + 1
    let currentTurn = nextSeat(seat)
    let nextLastPlay: { seat: number; cardIds: number[] } | null = previousLastPlay
    let nextPassCount = passCount
    if (passCount >= MULTIPLAYER_SEATS - 1) {
      currentTurn = previousLastPlay.seat
      nextLastPlay = null
      nextPassCount = 0
    }
    const payload = { action: "pass", passCount, nextTurn: currentTurn }
    const hash = eventHash({ previousHash, eventIndex, kind: "pass", playerSeat: seat, payload })
    meta.passCount = nextPassCount
    meta.eventHead = hash
    await tx.gameEvent.create({ data: { roomId, eventIndex, kind: "pass", playerSeat: seat, payload: { ...payload, previousHash, eventHash: hash } } })
    await tx.gameState.update({
      where: { roomId },
      data: {
        currentTurn,
        lastPlay: nextLastPlay ? (nextLastPlay as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        handsCommitment: meta as unknown as Prisma.InputJsonValue,
        remainingCounts: handState as unknown as Prisma.InputJsonValue,
      },
    })
    return
  }

  if (intent.intent !== "play") throw new Error("Unsupported game action")
  const cardIds = [...new Set(intent.cardIds)].sort((a, b) => a - b)
  if (cardIds.length === 0) throw new Error("Choose at least one card")
  if (!cardIds.every((id) => Number.isInteger(id) && id >= 0 && id < 52)) throw new Error("Invalid card id")

  const hand = handState.hands[seat]
  if (!cardIds.every((id) => hand.includes(id))) throw new Error("Selected cards are not in your hand")

  const cards = sortHand(cardIdsToCards(cardIds))
  const lastCards = previousLastPlay ? cardIdsToCards(previousLastPlay.cardIds) : []
  const combo = analyzePlay(cards)
  if (combo.type === "none") throw new Error("Invalid Big Two combination")
  if (meta.firstTurn && !containsThreeClubs(cards)) throw new Error("Opening play must include 3 of clubs")
  if (!isValidPlay(cards, lastCards)) throw new Error("Play does not beat the previous play")

  const selected = new Set(cardIds)
  handState.hands[seat] = hand.filter((id) => !selected.has(id))
  handState.remainingCounts = handState.hands.map((playerHand) => playerHand.length)
  const winnerSeat = handState.hands[seat].length === 0 ? seat : null
  const payload = {
    action: "play",
    cardIds: cardsToIds(cards),
    combo: combo.type,
    remaining: handState.hands[seat].length,
    winnerSeat,
  }
  const hash = eventHash({ previousHash, eventIndex, kind: "play", playerSeat: seat, payload })
  meta.eventHead = hash
  meta.passCount = 0
  meta.firstTurn = false
  if (winnerSeat !== null) {
    meta.winnerSeat = winnerSeat
    meta.revealed = true
    meta.revealHash = commitmentHash(cardIdsToCards(meta.deckIds), saltHexToBytes(meta.deckSaltHex))
    meta.replayStatus = replayStoredGame(handState.originalHands, await tx.gameEvent.findMany({ where: { roomId }, orderBy: { eventIndex: "asc" } }), {
      eventIndex,
      kind: "play",
      playerSeat: seat,
      payload,
    }).winnerSeat === winnerSeat ? "PASS" : "FAIL"
  }

  await tx.gameEvent.create({ data: { roomId, eventIndex, kind: "play", playerSeat: seat, payload: { ...payload, previousHash, eventHash: hash } } })
  await tx.gameState.update({
    where: { roomId },
    data: {
      currentTurn: winnerSeat === null ? nextSeat(seat) : seat,
      lastPlay: { seat, cardIds: cardsToIds(cards) },
      handsCommitment: meta as unknown as Prisma.InputJsonValue,
      remainingCounts: handState as unknown as Prisma.InputJsonValue,
      status: winnerSeat === null ? "PLAYING" : "FINISHED",
    },
  })

  if (winnerSeat !== null) {
    await tx.room.update({ where: { id: roomId }, data: { status: "FINISHED" } })
    await tx.verificationSnapshot.create({
      data: {
        roomId,
        deckCommitment: meta.deckCommitment,
        revealedDeckHash: meta.revealHash,
        replayStatus: meta.replayStatus,
        errors: meta.replayStatus === "PASS" ? [] : ["Replay winner did not match recorded winner"],
      },
    })
  }
}

function replayStoredGame(
  originalHands: number[][],
  priorEvents: { eventIndex: number; kind: string; playerSeat: number | null; payload: Prisma.JsonValue }[],
  pendingEvent?: { eventIndex: number; kind: string; playerSeat: number | null; payload: unknown },
): { winnerSeat: number | null; ok: boolean } {
  const hands = originalHands.map((hand) => hand.slice())
  const events = pendingEvent ? [...priorEvents, pendingEvent] : priorEvents
  let winnerSeat: number | null = null
  for (const event of events) {
    if (event.kind !== "play") continue
    const payload = event.payload as { cardIds?: unknown; winnerSeat?: unknown }
    if (!Array.isArray(payload.cardIds) || typeof event.playerSeat !== "number") return { winnerSeat: null, ok: false }
    const cardIds = payload.cardIds.filter((id): id is number => typeof id === "number")
    for (const id of cardIds) {
      const index = hands[event.playerSeat].indexOf(id)
      if (index < 0) return { winnerSeat: null, ok: false }
      hands[event.playerSeat].splice(index, 1)
    }
    if (hands[event.playerSeat].length === 0) winnerSeat = event.playerSeat
  }
  return { winnerSeat, ok: true }
}


export async function advanceAiTurn(tx: Prisma.TransactionClient, roomId: string): Promise<boolean> {
  const gameState = await tx.gameState.findUnique({ where: { roomId } })
  if (!gameState || gameState.status !== "PLAYING" || gameState.currentTurn === null) return false

  const player = await tx.roomPlayer.findFirst({
    where: { roomId, seatIndex: gameState.currentTurn },
    include: { user: { select: { nickname: true } } },
  })
  const nickname = player?.user.nickname ?? ""
  if (!player || !nickname.startsWith("AI")) return false

  const meta = parseMeta(gameState.handsCommitment)
  const handState = parseHands(gameState.remainingCounts)
  if (!meta || !handState) return false

  const lastPlay = lastPlayPayload(gameState.lastPlay)
  const hand = cardIdsToCards(handState.hands[player.seatIndex] ?? [])
  const move = chooseBotMove(hand, lastPlay ? cardIdsToCards(lastPlay.cardIds) : null, meta.firstTurn)

  await applyGameAction(
    tx,
    roomId,
    player.seatIndex,
    move ? { intent: "play", cardIds: cardsToIds(move) } : { intent: "pass" },
  )
  return true
}
export function buildRoomGamePayload(room: RoomForPayload, walletAddress: string | null) {
  const players = room.players
    .slice()
    .sort((a, b) => a.seatIndex - b.seatIndex)
    .map((player) => ({
      seatIndex: player.seatIndex,
      walletAddress: player.walletAddress,
      shortAddress: `${player.walletAddress.slice(0, 6)}...${player.walletAddress.slice(-4)}`,
      stakeTxDigest: player.stakeTxDigest,
      nickname: player.user?.nickname ?? null,
      isBot: (player.user?.nickname ?? "").startsWith("AI"),
      joinedAt: player.joinedAt,
    }))
  const mySeat = walletAddress ? players.find((player) => player.walletAddress === walletAddress)?.seatIndex ?? null : null
  const meta = parseMeta(room.gameState?.handsCommitment)
  const handState = parseHands(room.gameState?.remainingCounts)
  const lastPlay = lastPlayPayload(room.gameState?.lastPlay)
  const ownHand = mySeat !== null && handState ? cardIdsToCards(handState.hands[mySeat] ?? []) : []
  const publicHands = handState?.remainingCounts ?? [0, 0, 0, 0]
  const latestSnapshot = room.verifications[0] ?? null

  return {
    code: room.code,
    status: room.status,
    stakeAmount: room.stakeAmount.toString(),
    chainRoomId: meta?.chainRoomId ?? room.chainRoomId,
    mySeat,
    players,
    game: room.gameState
      ? {
          status: room.gameState.status,
          currentTurn: room.gameState.currentTurn,
          lastPlay: lastPlay ? { seat: lastPlay.seat, cards: cardIdsToCards(lastPlay.cardIds) } : null,
          ownHand,
          remainingCounts: publicHands,
          winnerSeat: meta?.winnerSeat ?? null,
          canReveal: !!meta?.revealed,
        }
      : null,
    verification: meta
      ? {
          deckCommitment: meta.deckCommitment,
          shortDeckCommitment: shortHash(meta.deckCommitment),
          myHandCommitment: mySeat !== null ? meta.handCommitments[mySeat] : null,
          shortMyHandCommitment: mySeat !== null ? shortHash(meta.handCommitments[mySeat]) : null,
          eventHead: meta.eventHead,
          shortEventHead: meta.eventHead ? shortHash(meta.eventHead) : null,
          eventCount: room.events.length,
          revealHash: meta.revealHash,
          shortRevealHash: meta.revealHash ? shortHash(meta.revealHash) : null,
          replayStatus: latestSnapshot?.replayStatus ?? meta.replayStatus,
          stakeMode: meta.stakeMode,
          claimTxDigest: meta.claimTxDigest,
          audit:
            room.status === "FINISHED"
              ? {
                  deckIds: meta.deckIds,
                  deckSaltHex: meta.deckSaltHex,
                  handSaltsHex: meta.handSaltsHex,
                  originalHands: handState?.originalHands ?? [],
                  events: room.events.map((event) => ({
                    eventIndex: event.eventIndex,
                    kind: event.kind,
                    playerSeat: event.playerSeat,
                    payload: event.payload,
                  })),
                }
              : null,
        }
      : null,
  }
}

export async function getRoomWithGame(prisma: PrismaClient, code: string) {
  return prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      players: { select: { seatIndex: true, walletAddress: true, stakeTxDigest: true, joinedAt: true, user: { select: { nickname: true } } }, orderBy: { seatIndex: "asc" } },
      gameState: true,
      events: { orderBy: { eventIndex: "asc" } },
      verifications: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  })
}
