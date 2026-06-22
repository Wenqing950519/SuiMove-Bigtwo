import {
  type Card,
  THREE_CLUBS,
  analyzePlay,
  cardStrength,
  containsThreeClubs,
  isValidPlay,
  rankIndex,
  sortHand,
} from "@/lib/big-two"

// 中等強度人機：會湊牌型、優先倒低牌、保留 2、跟牌用最小可壓的牌、壓不過就 PASS。
// 回傳要出的牌；回傳 null 代表 PASS。

const RANK_TWO = 12 // rankIndex of "2"

function combinations(cards: Card[], size: number): Card[][] {
  const results: Card[][] = []
  const pick = (start: number, current: Card[]) => {
    if (current.length === size) {
      results.push(current.slice())
      return
    }
    for (let i = start; i < cards.length; i += 1) {
      current.push(cards[i])
      pick(i + 1, current)
      current.pop()
    }
  }
  pick(0, [])
  return results
}

function allValidPlays(hand: Card[]): Card[][] {
  const plays: Card[][] = []
  for (let size = 1; size <= 5; size += 1) {
    if (size > hand.length) break
    for (const combo of combinations(hand, size)) {
      if (analyzePlay(combo).type !== "none") plays.push(combo)
    }
  }
  return plays
}

function usesTwo(cards: Card[]): boolean {
  return cards.some((card) => rankIndex(card) === RANK_TWO)
}

function score(cards: Card[]): number {
  return analyzePlay(cards).rankScore
}

// 開局：必含梅花3，盡量把低牌湊成大牌型一起倒掉。
function chooseOpening(hand: Card[]): Card[] | null {
  const withThree = allValidPlays(hand).filter(containsThreeClubs)
  if (withThree.length === 0) {
    const single = hand.find((card) => card.id === THREE_CLUBS)
    return single ? [single] : null
  }
  // 牌數多優先（一次倒越多越好），同牌數選 rankScore 最低
  withThree.sort((a, b) => b.length - a.length || score(a) - score(b))
  return withThree[0]
}

// 領牌：優先倒「最低的牌型」（對子/三條/順子…），保留單張與 2；沒有牌型就出最低單張。
function chooseLead(hand: Card[]): Card[] {
  const multis = allValidPlays(hand).filter((c) => c.length >= 2 && !usesTwo(c))
  if (multis.length > 0) {
    multis.sort((a, b) => score(a) - score(b) || b.length - a.length)
    return multis[0]
  }
  // 沒有牌型：出最低、且盡量不是 2 的單張
  const nonTwo = hand.filter((card) => rankIndex(card) !== RANK_TWO)
  const pool = nonTwo.length > 0 ? nonTwo : hand
  return [sortHand(pool)[0]]
}

// 跟牌：找所有能壓過上一手、同張數的組合，挑最小的壓；保留單張 2。
function chooseFollow(hand: Card[], lastPlay: Card[]): Card[] | null {
  const size = lastPlay.length
  if (size > hand.length) return null
  const beats = combinations(hand, size).filter((c) => isValidPlay(c, lastPlay))
  if (beats.length === 0) return null
  beats.sort((a, b) => score(a) - score(b))
  const best = beats[0]
  // 手牌還多時，不為了壓一張小牌而拆掉單張 2
  if (size === 1 && rankIndex(best[0]) === RANK_TWO && hand.length > 5) return null
  return best
}

export function chooseBotMove(
  hand: Card[],
  lastPlay: Card[] | null,
  firstTurn: boolean,
): Card[] | null {
  const sorted = sortHand(hand)
  if (sorted.length === 0) return null
  if (firstTurn) return chooseOpening(sorted)
  if (!lastPlay || lastPlay.length === 0) return chooseLead(sorted)
  return chooseFollow(sorted, lastPlay)
}
