# Sui Big Two V2 — Product Spec & Delivery Plan

**Owner:** Product
**Status:** Living document
**Last updated:** 2026-06-22
**Audience:** Engineering, design, future contributors

---

## 1. Product summary

Sui Big Two is a four-player Big Two (鋤大弟/大老二) card game whose differentiator is **public verifiability**: players enjoy a normal game UI, while every deal and play leaves an on-chain, cryptographically checkable fingerprint so no operator can secretly alter the cards.

**One-liner:** "A Big Two table you can audit — the house literally cannot cheat."

**Three audiences:**
- **Players** — a clean, playable multiplayer card table.
- **Reviewers / interviewers / portfolio readers** — a concrete demonstration of what Web3 adds (public verifiability of game integrity).
- **Technical auditors** — a clear mapping between game rules, events, commit‑reveal, and on‑chain state.

---

## 2. Current architecture

```
sui-bigtwo/
├─ move/                         # Sui Move smart contracts (Move 2024)
│  └─ sources/
│     ├─ big_two.move            # Full 4-player on-chain game (rooms, stake, deal,
│     │                          #   play, pass, reveal, claim_pot) + events
│     └─ stake_session.move      # NEW: solo "verifiable stake session"
│                                #   (open_session / settle_session)
│     Deployed (testnet) package: 0x6c8f32af...59d44  (modules: big_two, stake_session)
│
└─ frontend/                     # Next.js 16 (App Router) + React 19 + Tailwind v4
   ├─ app/
   │  ├─ page.tsx                # legacy demo (/)
   │  ├─ docs/                   # Chinese docs (/docs)
   │  ├─ v2/page.tsx             # V2 app: login → lobby → ready room → table
   │  └─ api/
   │     ├─ auth/                # nonce / verify / me / logout (wallet sign-in)
   │     └─ rooms/               # list / create / [code] / [code]/join
   ├─ lib/
   │  ├─ big-two.ts              # pure game engine (deal, combos, validation, commit hash)
   │  ├─ big-two-bot.ts          # medium-strength AI move chooser
   │  ├─ use-v2-game.ts          # client-side game state machine (deal, turns, bots, reveal)
   │  ├─ auth.ts                 # HMAC session + nonce tokens
   │  ├─ prisma.ts               # Prisma client singleton
   │  ├─ room.ts / api.ts        # room helpers + API response/validation helpers
   │  ├─ sui-config.ts           # package id, module names, explorer URLs
   │  └─ sui-tx.ts               # builds open_session / settle_session transactions
   ├─ prisma/schema.prisma       # users, rooms, room_players, game_states,
   │                             #   game_events, verification_snapshots
   └─ prisma/seed.ts             # seeds ROBO (3 AI) + DUOS (2 AI)
```

**Stack:** Next.js 16 / React 19 / TypeScript / Tailwind v4 / Prisma + Supabase (PostgreSQL) / @mysten/dapp-kit + @mysten/sui (Sui testnet) / @noble/hashes (sha3).

**Runtime truth model today:** gameplay runs **client-side** (you + 3 AI). The database stores rooms/players; the chain stores an optional per-game stake + commitment + reveal. Real 4-human authoritative play is **not yet** wired.

---

## 3. What ships today (DONE)

| Area | Capability | State |
|---|---|---|
| UI | Refined light design system; login, lobby, ready room, four-seat table | ✅ |
| Gameplay | Full Big Two rules vs 3 medium AI bots; turn flow, win detection | ✅ |
| Ready room | Per-seat ready state; AI pre-ready; "fill AI & start" for the 2-AI room | ✅ |
| Lobby | Reads real rooms from DB; create/join writes to DB; offline mock fallback | ✅ |
| Auth | Sui Wallet connect, nonce personal-message sign-in, HMAC session cookie, balance read (≥1 SUI gate) | ✅ |
| API security | Room create/join derive identity from server session (no client-supplied wallet) | ✅ |
| On-chain (solo) | `open_session` stakes 1 SUI + commits deck hash; `settle_session` verifies commit‑reveal **on-chain** and refunds | ✅ (pending live wallet test) |
| Verification panel | Local commit‑reveal check + on-chain session id / settle status | ✅ |
| Contracts | `big_two` (4-player) + `stake_session` deployed to testnet | ✅ |

---

## 4. Known limitations / honest gaps

1. **Verifiability is partial.** Solo mode anchors stake + commitment + reveal + refund on-chain, but the **win/lose flag is client-supplied** (opponents are AI). Fully trustless integrity requires 4-human authoritative play.
2. **No real multiplayer.** `game_states` and `game_events` tables exist but are unused; there is no realtime sync, matchmaking, or human-vs-human play.
3. **Hidden hands not preserved on-chain.** The deployed `big_two.deal_cards` writes all four hands as plaintext on-chain — incompatible with the "see only your own hand" promise. Needs per-hand commitments / selective reveal.
4. **Solo pot is a bond, not winnings.** With no staking counterparty, the 1 SUI is refunded on honest reveal; you cannot win chips from AI.
5. **Lobby vs gameplay coupling is cosmetic.** Joining a DB room then plays a local AI game; room occupancy is presentation only.
6. **Deployment target conflict.** V2 needs a server (API + DB); the legacy site is GitHub Pages (static). V2 must deploy to a Node host (e.g. Vercel).
7. **No admin tooling, hardening, tests, mobile layout, or persistence.** See tickets below.

---

## 5. Delivery plan (epics & tickets)

Legend — **Priority:** P0 (core), P1 (pre-launch), P2 (polish). **Effort:** S (<1d), M (1–3d), L (>3d).

### EPIC A — True 4-human on-chain multiplayer  *(the headline value)*

> Goal: 4 real wallets play an authoritative game; integrity is fully verifiable.

- **A1 — Realtime room presence & sync.** *(P0, L)*
  Subscribe to the on-chain `GameRoom` shared object + Sui events (`PlayerJoined`, `CardsPlayed`, `TurnPassed`, `GameEnded`, `DeckRevealed`) and/or Supabase Realtime; reflect seat/turn/last-play state across clients.
  *Acceptance:* two browsers in the same room see each other's joins and plays within ~2s; no manual refresh.

- **A2 — On-chain game lifecycle wiring.** *(P0, L)*
  Build transactions for `create_room_with_stake`, `join_room_with_stake`, `deal_cards`, `play_cards`, `pass_turn`, `reveal_deck`, `claim_pot`; gate UI actions on `current_player`.
  *Acceptance:* a full 4-wallet game can be played start→finish with every action a confirmed testnet tx; winner can `claim_pot`.

- **A3 — Hidden-hand privacy model.** *(P0, L)*
  Resolve plaintext-hands-on-chain. Options: per-hand commitments revealed selectively, or keep hands off-chain with the dealer publishing only per-hand hashes and revealing at end. Requires a Move contract revision + republish.
  *Acceptance:* during play, no opponent's concealed cards are derivable from chain or API; end-of-game reveal still verifies integrity.

- **A4 — Matchmaking & waiting room for humans.** *(P1, M)*
  Real "waiting for players" in the ready room driven by actual room membership; start when 4 humans (or humans+approved bots) are ready.
  *Acceptance:* a 2-AI room can be completed by a second human joining the open seat.

- **A5 — Disconnect / timeout / auto-pass.** *(P1, M)*
  Turn timer; auto-pass on timeout; reconnect resumes state.
  *Acceptance:* if a player is idle past the timer, the turn auto-passes and the game continues.

### EPIC B — Economy: staking & pot  *(下注與領取籌碼)*

- **B1 — Real 4-way pot.** *(P0, M — depends on A2)*
  Each player stakes 1 SUI on join; winner claims the 4 SUI pot via `claim_pot`.
  *Acceptance:* winner's balance increases by the pot minus gas; losers' stakes are transferred; events recorded.

- **B2 — Solo verifiable-stake polish.** *(P1, S)*
  Surface tx digests + explorer links for `open_session` / `settle_session`; clarify copy that solo stake is a returnable integrity bond.
  *Acceptance:* both txs are linkable from the verification panel; copy is unambiguous.

- **B3 — Stake configuration.** *(P2, S)*
  Make stake amount configurable per room (currently fixed 1 SUI).

### EPIC C — Backend completeness

- **C1 — Persist game state & events.** *(P1, M)*
  Use `game_states` / `game_events` for resumable games and an auditable history; map them to on-chain events.
  *Acceptance:* refresh mid-game resumes; an event log is queryable per room.

- **C2 — Match history & leaderboard.** *(P2, M)*
  Per-wallet results, win rate, recent games.

- **C3 — Admin / whitelist backend (`/v2/admin`).** *(P1, M)*
  Whitelisted addresses can view rooms, players, anomalies, tx digests, and force-close test rooms (`is_admin` already on `users`).
  *Acceptance:* non-admin is denied; admin sees live room/player/tx data.

### EPIC D — Security & hardening

- **D1 — API rate limiting & abuse controls.** *(P1, M)* — room create/join, auth endpoints.
- **D2 — CORS lockdown + Zod validation on all inputs.** *(P1, S)*
- **D3 — Supabase RLS / data-API exposure review.** *(P1, S)* — ensure tables aren't publicly readable via PostgREST.
- **D4 — Session/secret management.** *(P1, S)* — enforce `AUTH_SECRET` in prod; rotate; secure cookie flags audited.

### EPIC E — Quality, UX, delivery

- **E1 — Responsive / mobile table layout.** *(P1, M)* — table currently uses desktop absolute positioning.
- **E2 — Empty/loading/error states.** *(P2, S)* — lobby and table edge cases (API down mid-action, etc.).
- **E3 — Automated tests.** *(P1, M)* — unit tests for engine + bot + API; a happy-path e2e.
- **E4 — Observability.** *(P2, S)* — structured logging + error tracking.
- **E5 — Deployment.** *(P0, M)* — deploy V2 to a Node host (Vercel) with `DATABASE_URL` + `AUTH_SECRET`; decide legacy static site coexistence; document.
- **E6 — Portfolio packaging.** *(P2, M)* — README, architecture doc, demo video/GIF, `/docs` update for V2.

### EPIC F — Game depth (optional)

- **F1 — 3-handed Big Two variant** for the 2-AI room *(P2, L)* — engine currently fixed at 4 players.
- **F2 — Stronger AI levels** *(P2, M)* — beyond the current medium heuristic.

---

## 6. Recommended sequencing

1. **Ship-ready demo first (fast win):** E5 (deploy) + B2 + E1 (mobile) → a shareable, honest "verifiable stake demo vs AI." Plus D2/D4 to close the obvious security gaps.
2. **Make the thesis real:** EPIC A (A3 privacy is the long pole) + B1 → genuine trustless 4-human verifiable Big Two.
3. **Operational maturity:** C1/C3, D1/D3, E3/E4.
4. **Depth & polish:** C2, E6, F1/F2.

**Critical-path call:** the product's headline claim ("can't cheat") only becomes literally true after **A2 + A3 + B1**. Everything before that is an excellent prototype with on-chain-anchored integrity for the solo flow.

---

## 7. Environment & ops notes

- **Frontend dir:** `frontend/` — `npm run dev`, `npm run db:seed`, `npm run db:migrate`, `npm run db:studio`.
- **Contract dir:** `move/` — `sui move build`, `sui client publish`.
- **Required env (`frontend/.env`):** `DATABASE_URL` (Supabase Postgres), `AUTH_SECRET` (session signing key).
- **Deployed package (testnet):** `0x6c8f32af9df2d393125dd9755ec986e85c745c7b68b5421085f5b1c2a2259d44` — modules `big_two`, `stake_session`; UpgradeCap `0x07260ec2…3886f4`.
- **Network:** Sui testnet. Players need testnet SUI (faucet: https://faucet.sui.io/).
