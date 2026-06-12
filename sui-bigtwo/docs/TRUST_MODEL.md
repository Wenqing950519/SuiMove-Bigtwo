# Trust Model

## What This Demo Proves

The v1 demo proves that a completed game can be audited:

- The final revealed deck matches the commitment published at room creation.
- The revealed deck, when sliced into four 13-card hands, matches the original
  hands stored by the Move contract at deal time.
- Each move appears in the Move event trail.
- The room state follows this project's deterministic Big Two variant.
- A verifier can replay events and detect inconsistent winners, illegal plays,
  duplicate cards, duplicate deal events, deal/commitment mismatches, or reveal
  mismatches.
- In the staked testnet path, Move holds the pot and only the recorded winner can
  claim it after the game ends.

## What This Demo Does Not Prove

The v1 demo does not provide private-card security or unbiased dealer randomness:

- Plaintext hands are visible on-chain.
- The dealer can choose the original deck before committing to it.
- The reveal is now bound to the original deal, but this does not prove the
  dealer chose the deck randomly or fairly before making the commitment.
- There is no TEE, zero-knowledge proof, threshold encryption, or mental poker.
- The staking feature is a testnet escrow demo, not a production gambling protocol;
  it still needs liveness rules, dispute handling, private hands, and fair randomness.

This is acceptable for a UI-focused final-project demo as long as the limitation
is stated honestly.

## Rule Scope

This project uses a documented Big Two variant:

- Straights are five consecutive rank indexes. `J Q K A 2` is legal; wraparound
  straights such as `A 2 3 4 5` are not.
- Flushes compare by their highest card power.
- The goal is deterministic, verifiable behavior across Move and TypeScript,
  not full coverage of every local house rule.

## Upgrade Paths

### Fairer Shuffle

Use commit-reveal seeds from all players:

```text
player_i publishes hash(seed_i)
all players reveal seed_i
deck = shuffle(seed_0 || seed_1 || seed_2 || seed_3)
```

This prevents a single dealer from fully controlling the deck.

### On-Chain Randomness

Sui provides on-chain randomness through the `Random` object. A later version can
derive the deck from Sui randomness and store the resulting commitment.

### Private Hands

Private hands require a separate trust or proof layer:

- TEE signs game events and protects hidden card state.
- ZK proofs show that a played card came from a hidden hand.
- Reveal-at-end protocols verify that no hidden state was changed.

Those are beyond v1, but they are good discussion points for the presentation.
