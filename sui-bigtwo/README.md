# Sui Big Two

Sui Big Two is a final-project demo inspired by CloutCards' verifiable game
architecture, rebuilt for Sui Move and a Big Two card game.

The project goal is not to claim full private-card security in v1. Instead, the
demo focuses on Web3-native guarantees that are easy to explain and verify:

- A Sui shared object stores the game room and turn state.
- Each important action emits a Move event.
- The deck is committed at game start and revealed at game end.
- The reveal must match both the commitment and the initial dealt hands.
- The frontend can recompute the deck commitment and replay the event history.
- A testnet SUI stake can be locked in the shared GameRoom pot and claimed by the winner.
- The UI exposes a verification panel so users can see what Web3 adds over a
  normal Web2 card game.

## Project Layout

```text
sui-bigtwo/
|-- docs/
|   |-- ARCHITECTURE.md
|   |-- AUDIT_CHECKLIST.md
|   |-- TRUST_MODEL.md
|   `-- V0_UI_PROMPT.md
|-- move/
|   |-- Move.toml
|   `-- sources/
|       `-- big_two.move
`-- sdk/
    |-- package.json
    |-- tsconfig.json
    `-- src/
        |-- deck.ts
        |-- game.ts
        |-- index.ts
        |-- rules.ts
        |-- types.ts
        `-- verifier.ts
```

## Demo Scope

The first implementation is intentionally transparent:

- Four-player standard Big Two.
- Each player receives 13 cards.
- Hands are stored in the Move room object in plaintext for demo verification.
- The contract keeps a copy of the original dealt hands.
- The contract validates turn order, ownership of cards, hand type, comparison
  against the previous play, pass flow, and winner.
- After the game ends, the deck and salt are revealed. The contract verifies
  `sha3_256(deck || salt)` and checks that slicing the deck into four 13-card
  hands matches the original deal.

## Web3 Story

The project should be presented as a verifiable game history system:

1. The game does not rely only on a server database.
2. State transitions are committed to Sui objects and Move events.
3. The final deck reveal can be checked by anyone.
4. The frontend can independently verify the commitment and replay the event
   history.
5. Testnet SUI is held by Move escrow logic instead of a Web2 server balance.

This mirrors CloutCards' idea of a verifiable event trail, but replaces the
Solidity escrow + TEE design with Sui Move shared objects and on-chain events.

## Local Commands

From `sui-bigtwo/sdk`:

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd run test
```

From `sui-bigtwo/move`:

```powershell
sui move build
```

PowerShell may block `npm` directly on Windows. Use `npm.cmd`.
