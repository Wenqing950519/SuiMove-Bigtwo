import { createHash, randomBytes, randomInt } from "node:crypto";
import type { Card } from "./types.js";

const DECK_SIZE = 52;

export function generateDeck(): Card[] {
  return Array.from({ length: DECK_SIZE }, (_, card) => card);
}

export function assertCard(card: Card): void {
  if (!Number.isInteger(card) || card < 0 || card >= DECK_SIZE) {
    throw new Error(`Invalid card ${card}; expected integer in 0..51`);
  }
}

export function assertDeck(deck: readonly Card[]): void {
  if (deck.length !== DECK_SIZE) {
    throw new Error(`Invalid deck length ${deck.length}; expected 52`);
  }

  const seen = new Set<Card>();
  for (const card of deck) {
    assertCard(card);
    if (seen.has(card)) {
      throw new Error(`Duplicate card ${card}`);
    }
    seen.add(card);
  }
}

export function shuffleDeck(deck: readonly Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

export function generateSalt(byteLength = 32): Uint8Array {
  return randomBytes(byteLength);
}

export function commitDeck(deck: readonly Card[], salt: Uint8Array): string {
  assertDeck(deck);
  const bytes = new Uint8Array(deck.length + salt.length);
  bytes.set(deck);
  bytes.set(salt, deck.length);
  return `0x${createHash("sha3-256").update(bytes).digest("hex")}`;
}

export function verifyDeck(
  deck: readonly Card[],
  salt: Uint8Array,
  commitment: string,
): boolean {
  return commitDeck(deck, salt).toLowerCase() === commitment.toLowerCase();
}

export function dealHands(deck: readonly Card[], playerCount = 4): Card[][] {
  assertDeck(deck);
  if (playerCount !== 4) {
    throw new Error("v1 supports standard four-player Big Two only");
  }

  return [
    deck.slice(0, 13),
    deck.slice(13, 26),
    deck.slice(26, 39),
    deck.slice(39, 52),
  ];
}

export function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) {
    throw new Error("Hex string must have an even number of characters");
  }
  return Uint8Array.from(
    normalized.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
  );
}

export function bytesToHex(bytes: Uint8Array): string {
  return `0x${Buffer.from(bytes).toString("hex")}`;
}

