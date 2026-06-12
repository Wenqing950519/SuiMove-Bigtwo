# Claude Audit Checklist

Use this file when asking Claude to review the implementation.

## Move Contract

- `create_room` shares exactly one `GameRoom` object.
- `join_room` rejects duplicate players and rejects joins after four players.
- `deal_cards` is only callable by the room creator / dealer.
- `deal_cards` requires exactly four hands of 13 cards.
- `deal_cards` rejects duplicate cards and cards outside `0..51`.
- `deal_cards` stores both mutable current hands and `original_hands`.
- The starting player is the holder of card `0` (`3C`).
- `play_cards` requires `ctx.sender()` to equal the current player.
- `play_cards` rejects cards not in the sender's current hand.
- `play_cards` removes played cards from the current hand exactly once.
- `play_cards` validates legal Big Two hand sizes: 1, 2, 3, 5.
- `play_cards` rejects weaker plays against the previous play.
- `play_cards` requires the first play to contain card `0` (`3C`).
- `pass_turn` is rejected when there is no active `last_play`.
- Three consecutive passes reset the trick to the last player.
- A player wins immediately when their current hand length reaches zero.
- `reveal_deck` verifies `sha3_256(deck || salt)`.
- `reveal_deck` verifies `dealHands(deck) == original_hands` by checking all
  four 13-card slices.
- No entry function can mutate an ended game except reveal.

## TypeScript SDK

- `generateDeck` returns all 52 unique cards.
- `shuffleDeck` does not mutate the input deck.
- `commitDeck` uses the same byte layout as Move: deck bytes followed by salt
  bytes, then SHA3-256.
- `verifyDealMatchesCommitment` checks both the hash and the dealt hand slices.
- `rules.ts` and Move use the same card ordering.
- `isValidPlay` covers singles, pairs, triples, straights, flushes,
  full houses, four of a kind, and straight flushes.
- The verifier rejects duplicate cards, duplicate deal events, and impossible
  event sequences.

## Rule Variant

- Straights are five consecutive rank indexes; wraparound straights are not
  supported.
- `J Q K A 2` is legal under this variant.
- Flush comparison uses highest card power.
- Confirm Move and TypeScript remain consistent if these rules change.

## UI / Demo

- The UI never claims hidden-card privacy in v1.
- The UI never claims the dealer's initial deck choice was unbiased.
- The verification panel shows committed hash, recomputed hash, and deal match.
- The event history is readable by non-technical users.
- Failed verification has a visible red state.
- The professor can understand the difference from Web2 in under one minute.
