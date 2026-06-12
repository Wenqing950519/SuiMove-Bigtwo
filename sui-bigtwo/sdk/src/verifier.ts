import { dealHands, verifyDeck } from "./deck.js";
import {
  analyzePlay,
  containsThreeClubs,
  hasWon,
  isValidPlay,
} from "./rules.js";
import type { Card, ReplayEvent, ReplayResult } from "./types.js";

export interface VerifyCommitmentInput {
  deck: readonly Card[];
  salt: Uint8Array;
  commitment: string;
}

export function verifyDeckCommitment(input: VerifyCommitmentInput): boolean {
  return verifyDeck(input.deck, input.salt, input.commitment);
}

export interface VerifyDealMatchesCommitmentInput extends VerifyCommitmentInput {
  dealtHands: readonly Card[][];
}

export function verifyDealMatchesCommitment(input: VerifyDealMatchesCommitmentInput): boolean {
  if (!verifyDeckCommitment(input)) {
    return false;
  }

  return handsEqual(dealHands(input.deck), input.dealtHands);
}

export function replayGame(players: readonly string[], events: readonly ReplayEvent[]): ReplayResult {
  const errors: string[] = [];
  const hands: Card[][] = [[], [], [], []];
  let currentPlayer = 0;
  let lastPlay: Card[] = [];
  let lastPlayer = -1;
  let passCount = 0;
  let firstTurn = true;
  let winner: string | undefined;
  let hasDeal = false;

  if (players.length !== 4) {
    return { ok: false, errors: ["Replay requires exactly four players"], finalHands: hands };
  }

  for (const event of events) {
    if (winner && event.kind !== "gameEnd") {
      errors.push(`Event ${event.kind} appears after winner was decided`);
      continue;
    }

    if (event.kind === "deal") {
      if (hasDeal) {
        errors.push("Duplicate deal event");
        continue;
      }
      if (!validateHands(event.hands, errors)) {
        continue;
      }
      for (let i = 0; i < 4; i += 1) {
        hands[i] = [...event.hands[i]!];
      }
      currentPlayer = hands.findIndex((hand) => hand.includes(0));
      hasDeal = true;
      continue;
    }

    if (event.kind === "gameEnd") {
      if (!winner) {
        errors.push("GameEnd appeared before replay found a winner");
      } else if (winner !== event.winner) {
        errors.push(`Winner mismatch: replay=${winner}, event=${event.winner}`);
      }
      continue;
    }

    const playerIndex = players.indexOf(event.player);
    if (playerIndex === -1) {
      errors.push(`Unknown player ${event.player}`);
      continue;
    }

    if (event.kind === "play") {
      if (playerIndex !== currentPlayer) {
        errors.push(`Wrong turn: ${event.player} played at seat ${playerIndex}, expected ${currentPlayer}`);
        continue;
      }

      const combo = analyzePlay(event.cards);
      if (combo.type === "none") {
        errors.push(`Illegal combo from ${event.player}: ${event.cards.join(",")}`);
        continue;
      }

      if (firstTurn && !containsThreeClubs(event.cards)) {
        errors.push("First play must contain 3C/card 0");
        continue;
      }

      if (!hasCards(hands[playerIndex]!, event.cards)) {
        errors.push(`${event.player} played cards not in hand`);
        continue;
      }

      if (!isValidPlay(event.cards, lastPlay)) {
        errors.push(`${event.player} played a weaker or incompatible combo`);
        continue;
      }

      removeCards(hands[playerIndex]!, event.cards);
      lastPlay = [...event.cards];
      lastPlayer = playerIndex;
      passCount = 0;
      firstTurn = false;

      if (hasWon(hands[playerIndex]!)) {
        winner = event.player;
      } else {
        currentPlayer = nextSeat(playerIndex);
      }
      continue;
    }

    if (event.kind === "pass") {
      if (playerIndex !== currentPlayer) {
        errors.push(`Wrong turn: ${event.player} passed at seat ${playerIndex}, expected ${currentPlayer}`);
        continue;
      }
      if (lastPlay.length === 0) {
        errors.push("Cannot pass when there is no active play");
        continue;
      }

      passCount += 1;
      if (passCount >= 3) {
        currentPlayer = lastPlayer;
        lastPlay = [];
        passCount = 0;
      } else {
        currentPlayer = nextSeat(playerIndex);
      }
      continue;
    }

  }

  const result: ReplayResult = {
    ok: errors.length === 0,
    errors,
    finalHands: hands,
  };

  if (winner !== undefined) {
    result.winner = winner;
  }

  return result;
}

function validateHands(hands: readonly Card[][], errors: string[]): boolean {
  if (hands.length !== 4) {
    errors.push(`Deal must include four hands, got ${hands.length}`);
    return false;
  }

  const seen = new Set<Card>();
  for (const [seat, hand] of hands.entries()) {
    if (hand.length !== 13) {
      errors.push(`Seat ${seat} has ${hand.length} cards; expected 13`);
      return false;
    }
    for (const card of hand) {
      if (!Number.isInteger(card) || card < 0 || card > 51) {
        errors.push(`Invalid card ${card}`);
        return false;
      }
      if (seen.has(card)) {
        errors.push(`Duplicate card ${card}`);
        return false;
      }
      seen.add(card);
    }
  }
  return true;
}

function hasCards(hand: readonly Card[], cards: readonly Card[]): boolean {
  const counts = new Map<Card, number>();
  for (const card of hand) {
    counts.set(card, (counts.get(card) ?? 0) + 1);
  }
  for (const card of cards) {
    const count = counts.get(card) ?? 0;
    if (count === 0) {
      return false;
    }
    counts.set(card, count - 1);
  }
  return true;
}

function removeCards(hand: Card[], cards: readonly Card[]): void {
  for (const card of cards) {
    const index = hand.indexOf(card);
    if (index === -1) {
      throw new Error(`Cannot remove missing card ${card}`);
    }
    hand.splice(index, 1);
  }
}

function nextSeat(seat: number): number {
  return (seat + 1) % 4;
}
function handsEqual(expected: readonly Card[][], actual: readonly Card[][]): boolean {
  if (expected.length !== actual.length) {
    return false;
  }

  for (let seat = 0; seat < expected.length; seat += 1) {
    const expectedHand = expected[seat];
    const actualHand = actual[seat];
    if (!expectedHand || !actualHand || expectedHand.length !== actualHand.length) {
      return false;
    }

    for (let cardIndex = 0; cardIndex < expectedHand.length; cardIndex += 1) {
      if (expectedHand[cardIndex] !== actualHand[cardIndex]) {
        return false;
      }
    }
  }

  return true;
}