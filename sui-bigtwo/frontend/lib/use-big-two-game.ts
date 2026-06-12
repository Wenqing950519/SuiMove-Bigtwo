"use client"

import { useCallback, useMemo, useState } from "react"
import {
  type Card,
  CARDS_PER_HAND,
  NUM_PLAYERS,
  analyzePlay,
  bytesToHex,
  commitmentHash,
  containsThreeClubs,
  dealHands,
  describePlay,
  findSmallestPlayable,
  findStarter,
  formatCard,
  generateSalt,
  handsEqual,
  isValidPlay,
  makeOrderedDeck,
  serializeHands,
  shuffleDeck,
  sortHand,
  COMBO_LABEL,
} from "@/lib/big-two"

export type EventType =
  | "room_created"
  | "player_joined"
  | "deal"
  | "play"
  | "pass"
  | "game_end"
  | "reveal"
  | "tamper"

export interface GameEvent {
  id: string
  type: EventType
  timestamp: number
  txDigest: string
  player: string | null
  payload: Record<string, unknown>
}

export interface VerificationState {
  commitment: string | null
  revealHash: string | null
  revealedDeck: Card[] | null
  dealMatches: boolean | null
  hashMatches: boolean | null
}

export interface TamperReport {
  active: boolean
  summary: string
  detail: string
}

const COPY = {
  initialMessage: "\u5c1a\u672a\u5efa\u7acb\u623f\u9593",
  roomCreated: "\u623f\u9593\u5df2\u5efa\u7acb\uff0c\u7b49\u5f85\u73a9\u5bb6\u5165\u5ea7",
  playersJoined: "\u56db\u4f4d\u73a9\u5bb6\u5df2\u5165\u5ea7\uff0c\u53ef\u4ee5\u767c\u724c",
  sorted: "\u5df2\u4f9d\u5927\u8001\u4e8c\u5927\u5c0f\u6392\u5e8f\u4f60\u7684\u624b\u724c",
  chooseCards: "\u8acb\u5148\u9078\u64c7\u8981\u51fa\u7684\u724c",
  badCombo: "\u9019\u7d44\u724c\u4e0d\u662f\u5408\u6cd5\u724c\u578b\uff1a\u53ea\u80fd\u51fa\u55ae\u5f35\u3001\u5c0d\u5b50\u3001\u4e09\u689d\u3001\u56db\u5f35\u9435\u652f\u6216\u4e94\u5f35\u724c\u578b",
  firstPlayNeedsThreeClubs: "\u7b2c\u4e00\u624b\u5fc5\u9808\u5305\u542b \u6885\u82b13",
  weakPlay: "\u9019\u624b\u724c\u4e0d\u80fd\u58d3\u904e\u4e0a\u4e00\u624b\uff0c\u8acb\u63db\u724c\u6216\u8df3\u904e",
  cannotPass: "\u76ee\u524d\u4e0d\u80fd\u8df3\u904e\uff1a\u65b0\u4e00\u8f2a\u5fc5\u9808\u5148\u51fa\u724c",
  noTamperTarget: "\u8acb\u5148\u767c\u724c\uff0c\u624d\u80fd\u6a21\u64ec\u7ac4\u6539\u767c\u724c\u7d00\u9304",
  verifyPass: "\u9a57\u8b49\u901a\u904e\uff1a\u96dc\u6e4a\u8207\u539f\u59cb\u767c\u724c\u90fd\u4e00\u81f4",
  verifyFail: "\u9a57\u8b49\u672a\u901a\u904e\uff1a\u8acb\u6aa2\u67e5\u96dc\u6e4a\u6216\u767c\u724c\u5339\u914d\u72c0\u614b",
} as const

export const SEAT_NAMES = [
  "\u73a9\u5bb6\u4e00",
  "\u73a9\u5bb6\u4e8c",
  "\u73a9\u5bb6\u4e09",
  "\u73a9\u5bb6\u56db",
]

function fakeTxDigest(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789"
  let out = ""
  for (let i = 0; i < 44; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

let eventCounter = 0
function makeEvent(
  type: EventType,
  player: string | null,
  payload: Record<string, unknown>,
): GameEvent {
  eventCounter += 1
  return {
    id: `evt-${eventCounter}`,
    type,
    timestamp: Date.now(),
    txDigest: fakeTxDigest(),
    player,
    payload,
  }
}

function nextSeat(seat: number): number {
  return (seat + 1) % NUM_PLAYERS
}

function emptyVerification(commitment: string | null): VerificationState {
  return {
    commitment,
    revealHash: null,
    revealedDeck: null,
    dealMatches: null,
    hashMatches: null,
  }
}

export function useBigTwoGame() {
  const [seed, setSeed] = useState<number | null>(null)
  const [nonce, setNonce] = useState<Uint8Array | null>(null)
  const [hands, setHands] = useState<Card[][]>([])
  const [dealtHands, setDealtHands] = useState<Card[][] | null>(null)
  const [joinedSeats, setJoinedSeats] = useState<boolean[]>([false, false, false, false])
  const [currentTurn, setCurrentTurn] = useState(0)
  const [lastPlay, setLastPlay] = useState<{ seat: number; cards: Card[] } | null>(null)
  const [passCount, setPassCount] = useState(0)
  const [firstTurn, setFirstTurn] = useState(true)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [events, setEvents] = useState<GameEvent[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winnerSeat, setWinnerSeat] = useState<number | null>(null)
  const [rewardClaimOpen, setRewardClaimOpen] = useState(false)
  const [actionMessage, setActionMessage] = useState<string>(COPY.initialMessage)
  const [tamperReport, setTamperReport] = useState<TamperReport | null>(null)

  const [verification, setVerification] = useState<VerificationState>(emptyVerification(null))

  const log = useCallback((e: GameEvent) => setEvents((prev) => [...prev, e]), [])
  const roomCreated = seed !== null
  const canPass = hands.length > 0 && !!lastPlay && !gameOver && !firstTurn

  const createRoom = useCallback(async () => {
    const newSeed = Math.floor(Math.random() * 0xffffffff) >>> 0
    const newNonce = generateSalt()
    const shuffled = shuffleDeck(makeOrderedDeck(), newSeed)
    const commitment = commitmentHash(shuffled, newNonce)

    setSeed(newSeed)
    setNonce(newNonce)
    setHands([])
    setDealtHands(null)
    setJoinedSeats([false, false, false, false])
    setCurrentTurn(0)
    setLastPlay(null)
    setPassCount(0)
    setFirstTurn(true)
    setSelected(new Set())
    setGameOver(false)
    setWinnerSeat(null)
    setRewardClaimOpen(false)
    setTamperReport(null)
    setActionMessage(COPY.roomCreated)
    setVerification(emptyVerification(commitment))
    setEvents([])
    log(makeEvent("room_created", null, { "\u627f\u8afe\u96dc\u6e4a": commitment, "\u5ea7\u4f4d\u6578": NUM_PLAYERS }))
  }, [log])

  const joinPlayers = useCallback(() => {
    setJoinedSeats([true, true, true, true])
    SEAT_NAMES.forEach((name, i) => log(makeEvent("player_joined", name, { "\u5ea7\u4f4d": i })))
    setActionMessage(COPY.playersJoined)
  }, [log])

  const deal = useCallback(() => {
    if (seed === null) return
    const shuffled = shuffleDeck(makeOrderedDeck(), seed)
    const dealt = dealHands(shuffled)
    const starter = findStarter(dealt)
    setHands(dealt)
    setDealtHands(dealt.map((h) => h.slice()))
    setCurrentTurn(starter)
    setLastPlay(null)
    setPassCount(0)
    setFirstTurn(true)
    setSelected(new Set())
    setGameOver(false)
    setWinnerSeat(null)
    setRewardClaimOpen(false)
    setTamperReport(null)
    setVerification((prev) => emptyVerification(prev.commitment))
    setActionMessage(`${SEAT_NAMES[starter]} \u6301\u6709 \u6885\u82b13\uff0c\u5fc5\u9808\u5148\u51fa\u5305\u542b \u6885\u82b13 \u7684\u724c`)
    log(
      makeEvent("deal", null, {
        "\u6bcf\u5bb6\u5f35\u6578": CARDS_PER_HAND,
        "\u9996\u51fa\u73a9\u5bb6": SEAT_NAMES[starter],
        "\u624b\u724c\u5f35\u6578": dealt.map((h) => h.length),
      }),
    )
  }, [seed, log])

  const toggleSelect = useCallback((cardId: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) next.delete(cardId)
      else next.add(cardId)
      return next
    })
  }, [])

  const sortMyHand = useCallback(() => {
    setHands((prev) => {
      if (prev.length === 0) return prev
      const next = prev.slice()
      next[0] = sortHand(next[0])
      return next
    })
    setActionMessage(COPY.sorted)
  }, [])

  const applyPlay = useCallback(
    (seat: number, cards: Card[]) => {
      const combo = analyzePlay(cards)
      const sortedCards = sortHand(cards)
      const remaining = hands[seat].filter((c) => !cards.some((x) => x.id === c.id))

      setHands((prev) => {
        const next = prev.slice()
        next[seat] = remaining
        return next
      })
      setLastPlay({ seat, cards: sortedCards })
      setPassCount(0)
      setFirstTurn(false)
      setSelected(new Set())
      setActionMessage(`${SEAT_NAMES[seat]} \u51fa\u4e86 ${describePlay(sortedCards)}`)
      log(
        makeEvent("play", SEAT_NAMES[seat], {
          "\u724c\u578b": COMBO_LABEL[combo.type],
          "\u724c": sortedCards.map(formatCard),
          "\u5269\u9918\u5f35\u6578": remaining.length,
        }),
      )

      if (remaining.length === 0) {
        setGameOver(true)
        setWinnerSeat(seat)
        setRewardClaimOpen(true)
        setActionMessage(`${SEAT_NAMES[seat]} \u51fa\u5b8c\u624b\u724c\uff0c\u904a\u6232\u7d50\u675f`)
        log(makeEvent("game_end", SEAT_NAMES[seat], { "\u52dd\u8005": SEAT_NAMES[seat] }))
        return
      }

      setCurrentTurn(nextSeat(seat))
    },
    [hands, log],
  )

  const play = useCallback(() => {
    if (hands.length === 0 || gameOver) return
    if (currentTurn !== 0) {
      setActionMessage(`\u73fe\u5728\u8f2a\u5230 ${SEAT_NAMES[currentTurn]}`)
      return
    }

    const chosen = sortHand(hands[0].filter((c) => selected.has(c.id)))
    if (chosen.length === 0) {
      setActionMessage(COPY.chooseCards)
      return
    }

    const combo = analyzePlay(chosen)
    if (combo.type === "none") {
      setActionMessage(COPY.badCombo)
      return
    }

    if (firstTurn && !containsThreeClubs(chosen)) {
      setActionMessage(COPY.firstPlayNeedsThreeClubs)
      return
    }

    if (!isValidPlay(chosen, lastPlay?.cards ?? [])) {
      setActionMessage(COPY.weakPlay)
      return
    }

    applyPlay(0, chosen)
  }, [applyPlay, currentTurn, firstTurn, gameOver, hands, lastPlay, selected])

  const passSeat = useCallback(
    (seat: number) => {
      if (!canPass || !lastPlay) {
        setActionMessage(COPY.cannotPass)
        return
      }

      const nextPassCount = passCount + 1
      log(makeEvent("pass", SEAT_NAMES[seat], { "\u9023\u7e8c\u8df3\u904e": nextPassCount }))

      if (nextPassCount >= 3) {
        setCurrentTurn(lastPlay.seat)
        setLastPlay(null)
        setPassCount(0)
        setActionMessage(`\u4e09\u5bb6\u8df3\u904e\uff0c${SEAT_NAMES[lastPlay.seat]} \u53d6\u5f97\u65b0\u4e00\u8f2a\u51fa\u724c\u6b0a`)
      } else {
        setPassCount(nextPassCount)
        setCurrentTurn(nextSeat(seat))
        setActionMessage(`${SEAT_NAMES[seat]} \u8df3\u904e`)
      }
    },
    [canPass, lastPlay, log, passCount],
  )

  const pass = useCallback(() => {
    if (hands.length === 0 || gameOver) return
    if (currentTurn !== 0) {
      setActionMessage(`\u73fe\u5728\u8f2a\u5230 ${SEAT_NAMES[currentTurn]}`)
      return
    }
    passSeat(0)
  }, [currentTurn, gameOver, hands.length, passSeat])

  const autoPlay = useCallback(() => {
    if (hands.length === 0 || gameOver) return
    const seat = currentTurn
    const candidate = findSmallestPlayable(hands[seat], lastPlay?.cards ?? null, firstTurn)

    if (!candidate) {
      passSeat(seat)
      return
    }

    applyPlay(seat, candidate)
  }, [applyPlay, currentTurn, firstTurn, gameOver, hands, lastPlay, passSeat])

  const tamperDeal = useCallback(() => {
    if (!dealtHands || dealtHands.length < 2 || !dealtHands[0]?.length || !dealtHands[1]?.length) {
      setActionMessage(COPY.noTamperTarget)
      return
    }

    const cardA = dealtHands[0][0]
    const cardB = dealtHands[1][0]
    const detail = `${SEAT_NAMES[0]} ${formatCard(cardA)} <-> ${SEAT_NAMES[1]} ${formatCard(cardB)}`
    const summary = `\u4f5c\u5f0a\u6a21\u64ec\uff1a\u767c\u724c\u7d00\u9304\u88ab\u6539\u4e86\u3002${detail}`

    const next = dealtHands.map((h) => h.slice())
    next[0][0] = cardB
    next[1][0] = cardA

    setDealtHands(next)
    setTamperReport({ active: true, summary, detail })
    setVerification((prev) => ({
      ...prev,
      revealHash: null,
      revealedDeck: null,
      dealMatches: null,
      hashMatches: null,
    }))
    setActionMessage(summary)
    log(
      makeEvent("tamper", null, {
        "\u8aaa\u660e": "\u4ea4\u63db\u767c\u724c\u5feb\u7167\u4e2d\u7684\u5169\u5f35\u724c\uff0c\u6a21\u64ec\u5be6\u969b\u767c\u724c\u7d00\u9304\u88ab\u7ac4\u6539",
        "\u88ab\u4ea4\u63db\u7684\u724c": detail,
      }),
    )
  }, [dealtHands, log])

  const revealAndVerify = useCallback(async () => {
    if (seed === null || nonce === null) return
    const revealedDeck = shuffleDeck(makeOrderedDeck(), seed)
    const revealHash = commitmentHash(revealedDeck, nonce)
    const hashMatches = revealHash === verification.commitment

    let dealMatches: boolean | null = null
    if (dealtHands) {
      const reDealt = dealHands(revealedDeck)
      dealMatches = handsEqual(reDealt, dealtHands)
    }

    setVerification((prev) => ({
      ...prev,
      revealHash,
      revealedDeck,
      hashMatches,
      dealMatches,
    }))
    setActionMessage(hashMatches && dealMatches ? COPY.verifyPass : COPY.verifyFail)
    log(
      makeEvent("reveal", null, {
        seed,
        salt: bytesToHex(nonce),
        "\u91cd\u7b97\u96dc\u6e4a": revealHash,
        "\u96dc\u6e4a\u5339\u914d": hashMatches,
        "\u767c\u724c\u5339\u914d": dealMatches,
      }),
    )
  }, [seed, nonce, verification.commitment, dealtHands, log])

  const openRewardClaim = useCallback(() => setRewardClaimOpen(true), [])
  const dismissRewardClaim = useCallback(() => setRewardClaimOpen(false), [])

  const saltHex = useMemo(() => (nonce ? bytesToHex(nonce) : ""), [nonce])
  const dealtHandsForVerify = useMemo(
    () => (dealtHands ? serializeHands(dealtHands) : ""),
    [dealtHands],
  )

  return {
    roomCreated,
    joinedSeats,
    hands,
    currentTurn,
    lastPlay,
    passCount,
    firstTurn,
    selected,
    events,
    gameOver,
    winnerSeat,
    rewardClaimOpen,
    verification,
    dealtHandsForVerify,
    dealtHands,
    tamperReport,
    seed,
    nonce,
    saltHex,
    canPass,
    actionMessage,
    createRoom,
    joinPlayers,
    deal,
    toggleSelect,
    sortMyHand,
    play,
    pass,
    autoPlay,
    tamperDeal,
    revealAndVerify,
    openRewardClaim,
    dismissRewardClaim,
  }
}