# Architecture

## CloutCards Inspiration

CloutCards separates responsibilities:

- Smart contract: escrow deposits and TEE-authorized withdrawals.
- TEE backend: game logic, randomness, card privacy, signed event trail.
- Frontend: poker UI, hand history, verification panel.

Sui Big Two adapts the verifiability idea instead of copying the exact stack.

## Sui Big Two v1

```text
Frontend / SDK
  - generate deck
  - commit deck
  - call Move entry functions
  - render table and history
  - verify reveal, original deal, and replay events

Sui Move
  - GameRoom shared object
  - player list and current hands
  - original dealt hands for reveal verification
  - turn state
  - rule validation
  - winner calculation
  - events for audit history
  - optional testnet SUI stake escrow and winner claim

Verifier
  - recompute deck commitment
  - check all 52 cards are unique
  - check dealHands(deck) equals the actual dealt hands
  - replay plays and passes
  - compare replayed winner with room winner
```

## Data Model

### Card Encoding

Cards are encoded as `u8` values from `0` to `51`.

```text
rank = card / 4
suit = card % 4
```

Ranks are ordered for Big Two:

```text
0=3, 1=4, 2=5, 3=6, 4=7, 5=8, 6=9, 7=10, 8=J, 9=Q, 10=K, 11=A, 12=2
```

Suits are ordered:

```text
0=clubs, 1=diamonds, 2=hearts, 3=spades
```

The smallest card is `3C`, encoded as `0`. The first play must contain `0`.

### Rule Simplifications

This demo uses a deterministic Big Two variant rather than every local house rule:

- A straight is five consecutive rank indexes. This means `J Q K A 2` is legal,
  while wraparound straights such as `A 2 3 4 5` are not.
- Flush comparison uses the highest card power in the flush.
- Five-card hand strength is `straight < flush < full house < four of a kind < straight flush`.

These rules are implemented consistently in both Move and TypeScript.

### GameRoom

```text
GameRoom
|-- id
|-- dealer: address
|-- players: vector<address>
|-- hands: vector<vector<u8>>
|-- original_hands: vector<vector<u8>>
|-- deck_commitment: vector<u8>
|-- current_player: u8
|-- last_play: vector<u8>
|-- last_combo_type: u8
|-- last_combo_rank: u8
|-- last_player: u8
|-- pass_count: u8
|-- status: u8
|-- winner: Option<address>
|-- revealed_deck: vector<u8>
|-- reveal_salt: vector<u8>
|-- revealed: bool
`-- first_turn: bool
```

## Entry Functions

```text
create_room(deck_commitment)
create_room_with_stake(deck_commitment, stake)
join_room(room)
join_room_with_stake(room, stake)
deal_cards(room, hand0, hand1, hand2, hand3)
play_cards(room, cards)
pass_turn(room)
reveal_deck(room, deck, salt)
claim_pot(room)
```

`deal_cards` stores both mutable current hands and immutable original hands.
`reveal_deck` verifies the commitment and asserts that slicing the revealed deck
into four 13-card hands matches `original_hands`.

## Event Trail

The contract emits events for:

- Room creation
- Player join
- Deal
- Play
- Pass
- Game end
- Deck reveal
- Pot claim

Move events are on-chain events produced by signed Sui transactions. They are
not standalone TEE signatures like CloutCards' EIP-712 event log.

## Presentation Narrative

The strongest demo story:

1. Start a game and show the deck commitment.
2. Play through several moves.
3. Open History Explorer and show each action as an on-chain event from a signed
   transaction.
4. End the game and reveal deck + salt.
5. Press "Verify" and show both the recomputed commitment and the deal match.
6. Show the testnet stake locked in the GameRoom pot and explain that settlement
   follows Move state instead of a server balance.
7. Explain that Web2 games usually ask users to trust the server, while this
   demo lets users verify history and asset settlement independently.
