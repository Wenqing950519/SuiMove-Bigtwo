import { sha3_256 } from "@noble/hashes/sha3.js"
import { bytesToHex as nobleBytesToHex } from "@noble/hashes/utils.js"

export const SUITS = ["clubs", "diamonds", "hearts", "spades"] as const
export type Suit = (typeof SUITS)[number]

export const RANKS = [
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
  "2",
] as const
export type Rank = (typeof RANKS)[number]

export interface Card {
  id: number
  rank: Rank
  suit: Suit
}

export type ComboType =
  | "none"
  | "single"
  | "pair"
  | "triple"
  | "straight"
  | "flush"
  | "fullHouse"
  | "fourKind"
  | "straightFlush"

export interface Combo {
  type: ComboType
  size: number
  rankScore: number
}

export const COMBO_LABEL: Record<ComboType, string> = {
  none: "無效牌型",
  single: "單張",
  pair: "對子",
  triple: "三條",
  straight: "順子",
  flush: "同花",
  fullHouse: "葫蘆",
  fourKind: "鐵支",
  straightFlush: "同花順",
}

const COMBO_STRENGTH: Record<ComboType, number> = {
  none: 0,
  single: 1,
  pair: 2,
  triple: 3,
  straight: 4,
  flush: 5,
  fullHouse: 6,
  fourKind: 7,
  straightFlush: 8,
}

export const SUIT_SYMBOL: Record<Suit, string> = {
  diamonds: "\u2666",
  clubs: "\u2663",
  hearts: "\u2665",
  spades: "\u2660",
}

export const SUIT_LABEL: Record<Suit, string> = {
  diamonds: "方塊",
  clubs: "梅花",
  hearts: "紅心",
  spades: "黑桃",
}

export const SUIT_IS_RED: Record<Suit, boolean> = {
  diamonds: true,
  clubs: false,
  hearts: true,
  spades: false,
}

export const NUM_PLAYERS = 4
export const CARDS_PER_HAND = 13
export const DECK_SIZE = 52
export const THREE_CLUBS = 0

export function makeCard(id: number): Card {
  if (!Number.isInteger(id) || id < 0 || id >= DECK_SIZE) {
    throw new Error(`Invalid card id ${id}`)
  }

  const rank = RANKS[Math.floor(id / 4)]
  const suit = SUITS[id % 4]
  if (!rank || !suit) throw new Error(`Invalid card id ${id}`)
  return { id, rank, suit }
}

export function makeOrderedDeck(): Card[] {
  return Array.from({ length: DECK_SIZE }, (_, id) => makeCard(id))
}

export function shuffleDeck(deck: Card[], seed: number): Card[] {
  const out = deck.slice()
  let state = seed >>> 0
  const next = () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    return state / 0xffffffff
  }
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function dealHands(deck: Card[]): Card[][] {
  return [
    deck.slice(0, 13),
    deck.slice(13, 26),
    deck.slice(26, 39),
    deck.slice(39, 52),
  ]
}

export function findStarter(hands: Card[][]): number {
  const seat = hands.findIndex((hand) => hand.some((card) => card.id === THREE_CLUBS))
  return seat >= 0 ? seat : 0
}

export function generateSalt(byteLength = 32): Uint8Array {
  const salt = new Uint8Array(byteLength)
  crypto.getRandomValues(salt)
  return salt
}

export function serializeDeck(deck: Card[]): string {
  return deck.map((c) => c.id).join(",")
}

export function serializeHands(hands: Card[][]): string {
  return hands.map((h) => h.map((c) => c.id).join(".")).join("|")
}

export function handsEqual(a: Card[][], b: Card[][]): boolean {
  return serializeHands(a) === serializeHands(b)
}

export function commitmentHash(deck: Card[], salt: Uint8Array): string {
  const bytes = new Uint8Array(deck.length + salt.length)
  bytes.set(deck.map((card) => card.id))
  bytes.set(salt, deck.length)
  return `0x${nobleBytesToHex(sha3_256(bytes))}`
}

export function bytesToHex(bytes: Uint8Array): string {
  return `0x${nobleBytesToHex(bytes)}`
}

export function shortHash(hash: string): string {
  if (hash.length <= 18) return hash
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`
}

export function rankIndex(card: Card): number {
  return Math.floor(card.id / 4)
}

export function suitIndex(card: Card): number {
  return card.id % 4
}

export function cardStrength(card: Card): number {
  return rankIndex(card) * 4 + suitIndex(card)
}

export function sortHand(hand: Card[]): Card[] {
  return hand.slice().sort((a, b) => cardStrength(a) - cardStrength(b))
}

export function formatCard(card: Card): string {
  return `${SUIT_SYMBOL[card.suit]}${card.rank}`
}

export function analyzePlay(cards: Card[]): Combo {
  const unique = new Set(cards.map((card) => card.id))
  if (unique.size !== cards.length) return none(cards.length)
  if (![1, 2, 3, 4, 5].includes(cards.length)) return none(cards.length)

  const sorted = sortHand(cards)
  const ranks = sorted.map(rankIndex)
  const suits = sorted.map(suitIndex)
  const rankCounts = countValues(ranks)

  if (cards.length === 1) {
    return { type: "single", size: 1, rankScore: cardStrength(sorted[0]) }
  }

  if (cards.length === 2 && rankCounts.size === 1) {
    return { type: "pair", size: 2, rankScore: maxCardStrength(sorted) }
  }

  if (cards.length === 3 && rankCounts.size === 1) {
    return { type: "triple", size: 3, rankScore: maxCardStrength(sorted) }
  }

  if (cards.length === 4 && rankCounts.size === 1) {
    return { type: "fourKind", size: 4, rankScore: rankWithCount(rankCounts, 4) }
  }

  if (cards.length !== 5) return none(cards.length)

  const flush = new Set(suits).size === 1
  const straight = isConsecutiveRanks(ranks)
  const counts = [...rankCounts.values()].sort((a, b) => b - a)

  if (flush && straight) {
    return { type: "straightFlush", size: 5, rankScore: maxCardStrength(sorted) }
  }
  if (counts[0] === 4) {
    return { type: "fourKind", size: 5, rankScore: rankWithCount(rankCounts, 4) }
  }
  if (counts[0] === 3 && counts[1] === 2) {
    return { type: "fullHouse", size: 5, rankScore: rankWithCount(rankCounts, 3) }
  }
  if (flush) return { type: "flush", size: 5, rankScore: maxCardStrength(sorted) }
  if (straight) return { type: "straight", size: 5, rankScore: maxCardStrength(sorted) }

  return none(cards.length)
}

export function isValidPlay(cards: Card[], lastPlay: Card[] = []): boolean {
  const play = analyzePlay(cards)
  if (play.type === "none") return false
  if (lastPlay.length === 0) return true

  const last = analyzePlay(lastPlay)
  if (last.type === "none" || play.size !== last.size) return false

  if (play.size === 5 && play.type !== last.type) {
    return COMBO_STRENGTH[play.type] > COMBO_STRENGTH[last.type]
  }

  return play.type === last.type && play.rankScore > last.rankScore
}

export function containsThreeClubs(cards: Card[]): boolean {
  return cards.some((card) => card.id === THREE_CLUBS)
}

export function describePlay(cards: Card[]): string {
  const combo = analyzePlay(cards)
  return `${COMBO_LABEL[combo.type]} ${cards.map(formatCard).join(" ")}`
}

export function findSmallestPlayable(hand: Card[], lastPlay: Card[] | null, firstTurn: boolean): Card[] | null {
  const sorted = sortHand(hand)
  if (firstTurn) {
    const starter = sorted.find((card) => card.id === THREE_CLUBS)
    return starter ? [starter] : null
  }

  const size = lastPlay?.length ?? 1
  for (const candidate of combinations(sorted, size)) {
    if (isValidPlay(candidate, lastPlay ?? [])) return candidate
  }

  return null
}

function none(size: number): Combo {
  return { type: "none", size, rankScore: -1 }
}

function countValues(values: number[]): Map<number, number> {
  const counts = new Map<number, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return counts
}

function isConsecutiveRanks(ranks: number[]): boolean {
  const unique = [...new Set(ranks)].sort((a, b) => a - b)
  return unique.length === 5 && unique[4] - unique[0] === 4
}

function maxCardStrength(cards: Card[]): number {
  return Math.max(...cards.map(cardStrength))
}

function rankWithCount(counts: ReadonlyMap<number, number>, expected: number): number {
  for (const [rank, count] of counts) {
    if (count === expected) return rank
  }
  return -1
}

function combinations(cards: Card[], size: number): Card[][] {
  const results: Card[][] = []
  const pick = (start: number, current: Card[]) => {
    if (current.length === size) {
      results.push(current.slice())
      return
    }
    for (let i = start; i < cards.length; i++) {
      current.push(cards[i])
      pick(i + 1, current)
      current.pop()
    }
  }
  pick(0, [])
  return results
}
