import { RANKS, SUITS, type Card, type Combo, type Rank, type Suit } from "./types.js";

const COMBO_STRENGTH: Record<Combo["type"], number> = {
  none: 0,
  single: 1,
  pair: 2,
  triple: 3,
  straight: 4,
  flush: 5,
  fullHouse: 6,
  fourKind: 7,
  straightFlush: 8,
};

export function rankIndex(card: Card): number {
  return Math.floor(card / 4);
}

export function suitIndex(card: Card): number {
  return card % 4;
}

export function cardRank(card: Card): Rank {
  const rank = RANKS[rankIndex(card)];
  if (!rank) {
    throw new Error(`Invalid card rank for ${card}`);
  }
  return rank;
}

export function cardSuit(card: Card): Suit {
  const suit = SUITS[suitIndex(card)];
  if (!suit) {
    throw new Error(`Invalid card suit for ${card}`);
  }
  return suit;
}

export function cardPower(card: Card): number {
  return rankIndex(card) * 4 + suitIndex(card);
}

export function formatCard(card: Card): string {
  const suitSymbol: Record<Suit, string> = {
    diamonds: "D",
    clubs: "C",
    hearts: "H",
    spades: "S",
  };
  return `${cardRank(card)}${suitSymbol[cardSuit(card)]}`;
}

export function sortCards(cards: readonly Card[]): Card[] {
  return [...cards].sort((a, b) => cardPower(a) - cardPower(b));
}

export function analyzePlay(cards: readonly Card[]): Combo {
  const unique = new Set(cards);
  if (unique.size !== cards.length) {
    return none(cards.length);
  }

  if (![1, 2, 3, 4, 5].includes(cards.length)) {
    return none(cards.length);
  }

  const sorted = sortCards(cards);
  const ranks = sorted.map(rankIndex);
  const suits = sorted.map(suitIndex);
  const rankCounts = countValues(ranks);

  if (cards.length === 1) {
    return { type: "single", size: 1, rankScore: cardPower(sorted[0]!) };
  }

  if (cards.length === 2 && rankCounts.size === 1) {
    return { type: "pair", size: 2, rankScore: maxCardPower(sorted) };
  }

  if (cards.length === 3 && rankCounts.size === 1) {
    return { type: "triple", size: 3, rankScore: maxCardPower(sorted) };
  }

  if (cards.length === 4 && rankCounts.size === 1) {
    return { type: "fourKind", size: 4, rankScore: rankWithCount(rankCounts, 4) };
  }

  if (cards.length !== 5) {
    return none(cards.length);
  }

  const isFlush = new Set(suits).size === 1;
  const isStraight = isConsecutiveRanks(ranks);

  if (isFlush && isStraight) {
    return { type: "straightFlush", size: 5, rankScore: maxCardPower(sorted) };
  }

  const counts = [...rankCounts.values()].sort((a, b) => b - a);
  if (counts[0] === 4) {
    return {
      type: "fourKind",
      size: 5,
      rankScore: rankWithCount(rankCounts, 4),
    };
  }

  if (counts[0] === 3 && counts[1] === 2) {
    return {
      type: "fullHouse",
      size: 5,
      rankScore: rankWithCount(rankCounts, 3),
    };
  }

  if (isFlush) {
    return { type: "flush", size: 5, rankScore: maxCardPower(sorted) };
  }

  if (isStraight) {
    return { type: "straight", size: 5, rankScore: maxCardPower(sorted) };
  }

  return none(cards.length);
}

export function isValidPlay(cards: readonly Card[], lastPlay: readonly Card[] = []): boolean {
  const play = analyzePlay(cards);
  if (play.type === "none") {
    return false;
  }

  if (lastPlay.length === 0) {
    return true;
  }

  const last = analyzePlay(lastPlay);
  if (last.type === "none" || play.size !== last.size) {
    return false;
  }

  if (play.size === 5 && play.type !== last.type) {
    return COMBO_STRENGTH[play.type] > COMBO_STRENGTH[last.type];
  }

  if (play.type !== last.type) {
    return false;
  }

  return play.rankScore > last.rankScore;
}

export function hasWon(hand: readonly Card[]): boolean {
  return hand.length === 0;
}

export function containsThreeClubs(cards: readonly Card[]): boolean {
  return cards.includes(0);
}

function none(size: number): Combo {
  return { type: "none", size, rankScore: -1 };
}

function countValues(values: readonly number[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function isConsecutiveRanks(ranks: readonly number[]): boolean {
  const unique = [...new Set(ranks)].sort((a, b) => a - b);
  if (unique.length !== 5) {
    return false;
  }
  return unique[4]! - unique[0]! === 4;
}

function maxCardPower(cards: readonly Card[]): number {
  return Math.max(...cards.map(cardPower));
}

function rankWithCount(counts: ReadonlyMap<number, number>, expectedCount: number): number {
  for (const [rank, count] of counts) {
    if (count === expectedCount) {
      return rank;
    }
  }
  return -1;
}

