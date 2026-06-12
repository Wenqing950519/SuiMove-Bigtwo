export type Card = number;

export type Suit = "clubs" | "diamonds" | "hearts" | "spades";

export type Rank =
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A"
  | "2";

export const RANKS: readonly Rank[] = [
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
] as const;

export const SUITS: readonly Suit[] = [
  "clubs",
  "diamonds",
  "hearts",
  "spades",
] as const;

export type ComboType =
  | "none"
  | "single"
  | "pair"
  | "triple"
  | "straight"
  | "flush"
  | "fullHouse"
  | "fourKind"
  | "straightFlush";

export interface Combo {
  type: ComboType;
  size: number;
  rankScore: number;
}

export interface PlayEvent {
  kind: "play";
  player: string;
  cards: Card[];
}

export interface PassEvent {
  kind: "pass";
  player: string;
}

export interface DealEvent {
  kind: "deal";
  hands: Card[][];
}

export interface GameEndEvent {
  kind: "gameEnd";
  winner: string;
}

export type ReplayEvent = DealEvent | PlayEvent | PassEvent | GameEndEvent;

export interface ReplayResult {
  ok: boolean;
  errors: string[];
  winner?: string;
  finalHands: Card[][];
}

