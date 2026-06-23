"use client"

import { useCallback, useEffect, useMemo, useReducer } from "react"
import {
  type Card,
  analyzePlay,
  bytesToHex,
  commitmentHash,
  containsThreeClubs,
  dealHands,
  findStarter,
  generateSalt,
  handsEqual,
  isValidPlay,
  makeOrderedDeck,
  shuffleDeck,
  shortHash,
  sortHand,
} from "@/lib/big-two"
import { chooseBotMove } from "@/lib/big-two-bot"

const HUMAN = 0
const NUM = 4

export const V2_SEAT_NAMES = ["你", "AI 北家", "AI 西家", "AI 東家"]

type LastPlay = { seat: number; cards: Card[] } | null
type Reveal = { hash: string; hashMatches: boolean; dealMatches: boolean } | null

interface State {
  seed: number
  salt: Uint8Array | null
  commitment: string | null
  hands: Card[][]
  dealtHands: Card[][] | null
  currentTurn: number
  lastPlay: LastPlay
  passCount: number
  firstTurn: boolean
  gameOver: boolean
  winnerSeat: number | null
  playCount: number
  message: string
  reveal: Reveal
}

const initialState: State = {
  seed: 0,
  salt: null,
  commitment: null,
  hands: [],
  dealtHands: null,
  currentTurn: 0,
  lastPlay: null,
  passCount: 0,
  firstTurn: true,
  gameOver: false,
  winnerSeat: null,
  playCount: 0,
  message: "發牌中…",
  reveal: null,
}

type Action =
  | { type: "NEW_GAME"; seed: number; salt: Uint8Array; commitment: string; hands: Card[][]; starter: number }
  | { type: "MOVE"; seat: number; cards: Card[] | null }
  | { type: "REVEAL"; reveal: NonNullable<Reveal> }

function nextSeat(seat: number): number {
  return (seat + 1) % NUM
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "NEW_GAME":
      return {
        ...initialState,
        seed: action.seed,
        salt: action.salt,
        commitment: action.commitment,
        hands: action.hands,
        dealtHands: action.hands.map((h) => h.slice()),
        currentTurn: action.starter,
        firstTurn: true,
        message:
          action.starter === HUMAN
            ? "你持有梅花3，請先出包含梅花3的牌"
            : `${V2_SEAT_NAMES[action.starter]} 先出`,
      }

    case "MOVE": {
      const { seat, cards } = action
      if (state.gameOver || seat !== state.currentTurn) return state

      // PASS
      if (!cards) {
        const passCount = state.passCount + 1
        if (passCount >= NUM - 1 && state.lastPlay) {
          const leader = state.lastPlay.seat
          return {
            ...state,
            passCount: 0,
            lastPlay: null,
            currentTurn: leader,
            playCount: state.playCount + 1,
            message: `三家跳過，${V2_SEAT_NAMES[leader]} 重新領牌`,
          }
        }
        return {
          ...state,
          passCount,
          currentTurn: nextSeat(seat),
          playCount: state.playCount + 1,
          message: `${V2_SEAT_NAMES[seat]} 跳過`,
        }
      }

      // PLAY
      const ids = new Set(cards.map((c) => c.id))
      const remaining = state.hands[seat].filter((c) => !ids.has(c.id))
      const hands = state.hands.slice()
      hands[seat] = remaining
      const sorted = sortHand(cards)

      if (remaining.length === 0) {
        return {
          ...state,
          hands,
          lastPlay: { seat, cards: sorted },
          passCount: 0,
          firstTurn: false,
          gameOver: true,
          winnerSeat: seat,
          playCount: state.playCount + 1,
          message: `${V2_SEAT_NAMES[seat]} 出完手牌，遊戲結束`,
        }
      }

      return {
        ...state,
        hands,
        lastPlay: { seat, cards: sorted },
        passCount: 0,
        firstTurn: false,
        currentTurn: nextSeat(seat),
        playCount: state.playCount + 1,
        message: `${V2_SEAT_NAMES[seat]} 出了 ${sorted.length} 張`,
      }
    }

    case "REVEAL":
      return { ...state, reveal: action.reveal }

    default:
      return state
  }
}

export function useV2Game(roomCode: string, active: boolean) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [selectedIds, setSelectedIds] = useReducer(
    (_prev: number[], next: number[]) => next,
    [],
  )

  const newGame = useCallback((preset?: { seed: number; salt: Uint8Array }) => {
    const seed = preset ? preset.seed : Math.floor(Math.random() * 0xffffffff) >>> 0
    const salt = preset ? preset.salt : generateSalt()
    const deck = shuffleDeck(makeOrderedDeck(), seed)
    const commitment = commitmentHash(deck, salt)
    const hands = dealHands(deck).map((h) => sortHand(h))
    const starter = findStarter(hands)
    setSelectedIds([])
    dispatch({ type: "NEW_GAME", seed, salt, commitment, hands, starter })
  }, [])

  // 人機自動出牌
  useEffect(() => {
    if (!active || state.gameOver || state.hands.length === 0) return
    if (state.currentTurn === HUMAN) return
    const seat = state.currentTurn
    const timer = setTimeout(() => {
      const move = chooseBotMove(state.hands[seat], state.lastPlay?.cards ?? null, state.firstTurn)
      dispatch({ type: "MOVE", seat, cards: move })
    }, 750)
    return () => clearTimeout(timer)
  }, [active, state.currentTurn, state.gameOver, state.hands, state.lastPlay, state.firstTurn])

  const myHand = useMemo(() => state.hands[HUMAN] ?? [], [state.hands])
  const isMyTurn = state.currentTurn === HUMAN && !state.gameOver

  const toggleSelect = useCallback(
    (id: number) =>
      setSelectedIds(
        selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id],
      ),
    [selectedIds],
  )

  const selectHint = useCallback(() => {
    const hint = chooseBotMove(myHand, state.lastPlay?.cards ?? null, state.firstTurn)
    setSelectedIds(hint ? hint.map((c) => c.id) : [])
  }, [myHand, state.lastPlay, state.firstTurn])

  const selectedCards = useMemo(
    () => myHand.filter((c) => selectedIds.includes(c.id)),
    [myHand, selectedIds],
  )

  const playValidity = useMemo(() => {
    if (!isMyTurn || selectedCards.length === 0) return { ok: false, reason: "" }
    if (analyzePlay(selectedCards).type === "none") return { ok: false, reason: "不是合法牌型" }
    if (state.firstTurn && !containsThreeClubs(selectedCards))
      return { ok: false, reason: "第一手必須包含梅花3" }
    if (!isValidPlay(selectedCards, state.lastPlay?.cards ?? []))
      return { ok: false, reason: "壓不過上一手" }
    return { ok: true, reason: "" }
  }, [isMyTurn, selectedCards, state.firstTurn, state.lastPlay])

  const play = useCallback(() => {
    if (!playValidity.ok) return
    dispatch({ type: "MOVE", seat: HUMAN, cards: sortHand(selectedCards) })
    setSelectedIds([])
  }, [playValidity.ok, selectedCards])

  const canPass = isMyTurn && !state.firstTurn && !!state.lastPlay
  const pass = useCallback(() => {
    if (!canPass) return
    dispatch({ type: "MOVE", seat: HUMAN, cards: null })
    setSelectedIds([])
  }, [canPass])

  const reveal = useCallback(() => {
    if (state.salt === null || !state.dealtHands) return
    const deck = shuffleDeck(makeOrderedDeck(), state.seed)
    const hash = commitmentHash(deck, state.salt)
    const hashMatches = hash === state.commitment
    const dealMatches = handsEqual(dealHands(deck).map((h) => sortHand(h)), state.dealtHands)
    dispatch({ type: "REVEAL", reveal: { hash, hashMatches, dealMatches } })
  }, [state.salt, state.dealtHands, state.seed, state.commitment])

  const myHandHash = useMemo(() => {
    if (!state.dealtHands || !state.salt) return null
    return commitmentHash(state.dealtHands[HUMAN], state.salt)
  }, [state.dealtHands, state.salt])

  const opponents = useMemo(
    () =>
      [1, 2, 3].map((seat) => ({
        seat,
        name: V2_SEAT_NAMES[seat],
        cards: state.hands[seat]?.length ?? 13,
        active: state.currentTurn === seat && !state.gameOver,
        state:
          state.winnerSeat === seat
            ? "勝出"
            : state.currentTurn === seat && !state.gameOver
              ? "出牌中"
              : state.lastPlay?.seat === seat
                ? "剛出牌"
                : "等待",
      })),
    [state.hands, state.currentTurn, state.lastPlay, state.gameOver, state.winnerSeat],
  )

  const deckIds = useMemo(
    () => (state.salt ? shuffleDeck(makeOrderedDeck(), state.seed).map((c) => c.id) : []),
    [state.salt, state.seed],
  )

  return {
    seatNames: V2_SEAT_NAMES,
    myHand,
    won: state.gameOver && state.winnerSeat === 0,
    chain: {
      commitmentFull: state.commitment ?? "",
      saltHex: state.salt ? bytesToHex(state.salt) : "",
      deckIds,
    },
    opponents,
    tableCards: state.lastPlay?.cards ?? [],
    lastSeatName: state.lastPlay ? V2_SEAT_NAMES[state.lastPlay.seat] : null,
    currentTurn: state.currentTurn,
    isMyTurn,
    selectedIds,
    selectedCount: selectedCards.length,
    toggleSelect,
    selectHint,
    play,
    pass,
    canPlay: playValidity.ok,
    canPass,
    invalidReason: playValidity.reason,
    gameOver: state.gameOver,
    winnerSeat: state.winnerSeat,
    message: state.message,
    newGame,
    reveal,
    verification: {
      deckCommitment: state.commitment ? shortHash(state.commitment) : "—",
      myHandHash: myHandHash ? shortHash(myHandHash) : "—",
      playCount: state.playCount,
      roomTag: roomCode,
      revealStatus: state.reveal
        ? state.reveal.hashMatches && state.reveal.dealMatches
          ? "pass"
          : "fail"
        : "pending",
      revealHash: state.reveal ? shortHash(state.reveal.hash) : null,
    },
  }
}
