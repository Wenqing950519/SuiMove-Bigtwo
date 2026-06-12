import test from "node:test";
import assert from "node:assert/strict";
import { commitDeck, dealHands, generateDeck, verifyDeck } from "./deck.js";
import { analyzePlay, containsThreeClubs, formatCard, isValidPlay } from "./rules.js";
import { replayGame, verifyDealMatchesCommitment } from "./verifier.js";

test("card formatting follows Big Two order", () => {
  assert.equal(formatCard(0), "3C");
  assert.equal(formatCard(51), "2S");
});

test("detects core combinations", () => {
  assert.equal(analyzePlay([0]).type, "single");
  assert.equal(analyzePlay([0, 1]).type, "pair");
  assert.equal(analyzePlay([0, 1, 2]).type, "triple");
  assert.equal(analyzePlay([0, 5, 10, 15, 16]).type, "straight");
  assert.equal(analyzePlay([0, 4, 8, 12, 16]).type, "straightFlush");
  assert.equal(analyzePlay([0, 4, 8, 12, 3]).type, "none");
  assert.equal(analyzePlay([0, 1, 2, 3]).type, "fourKind");
  assert.equal(analyzePlay([0, 1, 2, 3]).size, 4);
  assert.equal(analyzePlay([0, 1, 2, 3, 4]).type, "fourKind");
  assert.equal(analyzePlay([0, 1, 2, 4, 5]).type, "fullHouse");
});

test("compares legal plays", () => {
  assert.equal(isValidPlay([1], [0]), true);
  assert.equal(isValidPlay([2], [1]), true);
  assert.equal(isValidPlay([3], [2]), true);
  assert.equal(isValidPlay([0], [1]), false);
  assert.equal(isValidPlay([4, 5], [0, 1]), true);
  assert.equal(isValidPlay([4, 5, 6, 7], [0, 1, 2, 3]), true);
  assert.equal(isValidPlay([0, 1, 2, 3], [4, 5, 6, 7]), false);
  assert.equal(isValidPlay([0, 1, 2, 3], [0, 1, 2, 3, 4]), false);
  assert.equal(isValidPlay([4, 5, 6], [0, 1]), false);
});

test("deck commitment is deterministic", () => {
  const deck = generateDeck();
  const salt = new Uint8Array([1, 2, 3]);
  const commitment = commitDeck(deck, salt);
  assert.equal(verifyDeck(deck, salt, commitment), true);
  assert.equal(verifyDeck([...deck].reverse(), salt, commitment), false);
});

test("deals four thirteen-card hands", () => {
  const hands = dealHands(generateDeck());
  assert.equal(hands.length, 4);
  assert.deepEqual(hands.map((hand) => hand.length), [13, 13, 13, 13]);
  assert.equal(containsThreeClubs(hands[0]!), true);
});

test("deal verification binds commitment deck to actual hands", () => {
  const deck = generateDeck();
  const salt = new Uint8Array([7, 8, 9]);
  const commitment = commitDeck(deck, salt);
  const fairHands = dealHands(deck);
  const stackedHands = [fairHands[1]!, fairHands[0]!, fairHands[2]!, fairHands[3]!];

  assert.equal(verifyDeck(deck, salt, commitment), true);
  assert.equal(
    verifyDealMatchesCommitment({ deck, salt, commitment, dealtHands: fairHands }),
    true,
  );
  assert.equal(
    verifyDealMatchesCommitment({ deck, salt, commitment, dealtHands: stackedHands }),
    false,
  );
});

test("replay rejects duplicate deal events", () => {
  const hands = dealHands(generateDeck());
  const result = replayGame(["a", "b", "c", "d"], [
    { kind: "deal", hands },
    { kind: "deal", hands },
  ]);

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /Duplicate deal event/);
});