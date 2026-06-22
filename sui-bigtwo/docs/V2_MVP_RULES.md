# Sui Big Two V2 MVP Rules & Operating Spec

**Status:** Active MVP contract between product and engineering
**Route:** `/v2`
**Updated:** 2026-06-22

---

## 1. MVP Scope

This MVP turns V2 into an independent multiplayer product slice:

- Wallet-authenticated room entry.
- Four seated human players per room.
- Server-authoritative deal, play, pass, and win state.
- Polling-based multiplayer sync.
- Hidden opponent hands during active play.
- Deck commitment before play.
- Per-hand commitments.
- Event hash chain.
- Post-game reveal and replay verification.
- Sui escrow/claim transaction builders prepared for the deployed `big_two` module.
- Permanent AI waiting rooms: `ROBO` and `DUOS`.

The MVP intentionally uses polling instead of WebSocket/Reatime. This keeps the vertical slice simple and replaceable: the API contract can stay while the transport upgrades later.

---

## 2. Game Rules

- Standard four-player Big Two.
- 52 cards, 13 cards per player.
- Card order follows the existing engine: 3 is low, 2 is high; suit order is clubs, diamonds, hearts, spades.
- The player holding clubs 3 starts.
- The opening play must contain clubs 3.
- Valid play sizes are 1, 2, 3, 4, or 5 cards.
- Valid combinations are single, pair, triple, straight, flush, full house, four of a kind, and straight flush.
- A play must match the previous play size.
- Five-card hands can beat lower five-card hand types by combo strength.
- Passing is allowed only after an active play exists.
- When three consecutive players pass, the last player who played leads the next trick.
- The first player with zero cards wins.

---

## 3. Multiplayer Rules

- A room has exactly four seats: South, West, North, East.
- A wallet can occupy only one seat in a non-finished room.
- A room starts only after four players are seated.
- The backend is the live authority for current turn, hands, last play, pass count, and winner.
- The frontend may pre-check actions for UX, but every action must be accepted or rejected by the backend.
- Sync is done through polling `GET /api/rooms/:code/game` every 1.5 seconds in the current MVP.

---

## 4. Permanent AI Rooms

`ROBO` and `DUOS` are permanent waiting rooms, not disposable test rooms.

- `ROBO` always keeps three AI seats, so one human can start a game.
- `DUOS` always keeps two AI seats, so two humans can fill the table.
- When a human leaves a permanent AI room, only the human seat and current game state are cleared.
- AI seats remain in the room.
- The room returns to `WAITING` instead of disappearing.
- Lobby reads automatically recreate/reset these rooms if they were accidentally finished.
- During active play, polling auto-advances AI turns on the server until the turn returns to a human or the game ends.

## 5. Hidden-Hand Rule

During active play:

- The API returns the current user's own hand only.
- Opponent hands are represented only by remaining card counts.
- The database may store hidden hands for MVP operation, but they are not returned through normal gameplay payloads.

After finish:

- The audit payload can reveal deck ids, deck salt, hand salts, original hands, and event history.
- This reveal is what makes post-game verification possible.

---

## 6. Verification Loop

At game start:

- Backend shuffles the deck.
- Backend generates `deckSaltHex`.
- Backend stores `deckCommitment = sha3(deck || deckSalt)`.
- Backend generates one salt per hand.
- Backend stores per-hand commitments.
- Backend creates event 0: `room_started`.

During play:

- Every accepted action becomes a `game_events` row.
- Each event payload includes `previousHash` and `eventHash`.
- `eventHash` is computed over event index, kind, player seat, payload, and previous hash.

At finish:

- Backend stores winner seat.
- Backend reveals deck and salt in the audit payload.
- Backend recomputes reveal hash.
- Backend replays events from original hands.
- `verification_snapshots.replayStatus` becomes `PASS` or `FAIL`.

---

## 7. Sui Escrow Path

The deployed `big_two` module already exposes:

- `create_room_with_stake`
- `join_room_with_stake`
- `deal_cards`
- `play_cards`
- `pass_turn`
- `reveal_deck`
- `claim_pot`

The frontend now has transaction builders for create, join, reveal, and claim.

Important limitation:

- The currently deployed `big_two.deal_cards` stores all hands as plaintext on-chain.
- Therefore the MVP uses backend-hidden hands plus commitments for live play.
- A production hidden-hand escrow should use a revised contract that stores commitments during play and reveals hands only after finish.

MVP wording:

> Backend-verified multiplayer is complete. Sui escrow/claim wiring is prepared, but full hidden-hand on-chain escrow requires the next contract revision.

---

## 8. Definition of Done

The MVP slice is done when:

- Four wallets can sit in one room.
- The room starts only after four seats are filled.
- Each wallet sees only its own hand.
- Legal play/pass actions update all clients through polling.
- Illegal play/pass actions are rejected server-side.
- Deck commitment appears before play.
- Hand commitment appears for the current player.
- Event count and event head update after every accepted action.
- A winner is recorded when a hand reaches zero cards.
- Post-game audit exposes reveal/replay data.
- Replay status is persisted in `verification_snapshots`.
- Sui transaction builders exist for escrow and claim continuation.
- Permanent AI rooms survive human leave/reset and keep AI seats waiting.
