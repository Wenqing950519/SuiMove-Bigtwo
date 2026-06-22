# Sui Big Two V2 PRD & Product Roadmap

**Version:** 1.0
**Source:** `V2_PRODUCT_SPEC.md`
**Last updated:** 2026-06-22
**Audience:** Product, engineering, design, reviewers, portfolio readers
**Status:** Product planning draft for V2 execution

---

## 1. Executive Summary

Sui Big Two V2 is a Web3 multiplayer card-game product built around one simple promise:

> Players should be able to enjoy Big Two like a normal card game, while the integrity of the deck, hands, game events, stake, reveal, and final result can be publicly checked.

The project should not be positioned as "a card game with wallet login." Its strongest product angle is **verifiable game integrity**: a familiar multiplayer game where the user interface stays simple, but every important action leaves a cryptographic or on-chain trail.

The current V2 implementation already has a strong prototype foundation:

- A refined `/v2` flow covering wallet login, lobby, ready room, and four-seat table.
- Big Two gameplay against AI bots.
- Database-backed room creation and joining.
- Sui wallet sign-in through nonce verification and session cookies.
- A deployed Sui testnet package with `big_two` and `stake_session`.
- A solo verifiable stake session using commit-reveal.
- A verification panel that explains and displays integrity checks.

However, the current product is still a **hybrid demo**, not yet the full trustless multiplayer product. Real four-human multiplayer, authoritative state sync, hidden-hand privacy, real 4-way pot settlement, operational hardening, and production deployment are still required.

This PRD defines the product direction, V2 MVP scope, functional requirements, success metrics, risk model, and a phased roadmap from the current prototype to a portfolio-ready verifiable multiplayer game.

---

## 2. Product Thesis

### 2.1 Core Thesis

Most Web3 game demos either expose too much technical complexity or fail to show why a blockchain is useful. Sui Big Two V2 should solve this by making verifiability visible but not intrusive.

The user should feel:

- "I am playing a normal game."
- "I only see my own hand."
- "The table tells me whether the game is still auditable."
- "At the end, the deck and result can be checked."
- "The operator cannot secretly alter the cards or payout without leaving evidence."

### 2.2 Product One-Liner

**Sui Big Two is a multiplayer Big Two table where every deal, play, reveal, and stake outcome can be audited.**

### 2.3 Product Positioning

| Dimension | Product Direction |
|---|---|
| Category | Verifiable Web3 card game |
| Primary experience | Normal four-player Big Two |
| Differentiator | Public game-integrity verification |
| Chain role | Identity, commitment, stake escrow, reveal proof, audit references |
| Backend role | Multiplayer sync, hidden-state delivery, rule validation, event logs |
| Portfolio value | Shows what Web3 adds beyond wallet login |

### 2.4 What This Is Not

Sui Big Two V2 is not:

- A real-money gambling product.
- A casino-style game.
- A generic lobby with a wallet attached.
- A fully private cryptographic card protocol.
- A zero-knowledge proof product.
- A fully on-chain game where every turn must wait for a transaction.

The product should stay honest: V2 can be a strong verifiable multiplayer prototype before it becomes a fully trust-minimized production protocol.

---

## 3. Problem & Opportunity

### 3.1 User Problem

In online card games, players have no practical way to know whether:

- The deck was fairly generated.
- Hands were changed after the game started.
- The server gave hidden advantages to one player.
- The event history was rewritten.
- The winner and payout matched the actual game.

Most users do not want to read smart contracts while playing, but they do want simple confidence signals: "is this table still fair?"

### 3.2 Product Opportunity

Big Two is a familiar rules-based game with clear hidden-information requirements. That makes it a strong vehicle for demonstrating Web3 verification:

- Cards and hands can be represented deterministically.
- Deck commitments can be checked after reveal.
- Turn events can be replayed.
- Stake settlement can be tied to the recorded winner.
- A verification panel can make technical integrity understandable.

### 3.3 Strategic Opportunity

The strongest external story is:

> A normal game UI with a transparent integrity layer underneath.

This is stronger than a pure technical demo because it shows product thinking:

- User-friendly lobby and table.
- Real wallet identity.
- Clear hidden-hand promise.
- Backend and chain responsibilities separated.
- Verification surfaced in plain language.
- Product roadmap acknowledges current trust gaps.

---

## 4. Target Users

### 4.1 Player

**Goal:** Play a fast, understandable Big Two game.
**Needs:**

- Connect wallet quickly.
- Join or create a room.
- Understand whether enough players are present.
- See only their own hand.
- Play, pass, and follow turns without confusion.
- See simple trust status without technical overload.

**Success moment:** The player finishes a game and sees that the result can be verified.

### 4.2 Technical Reviewer

**Goal:** Understand whether the Web3 architecture adds real value.
**Needs:**

- Clear mapping between UI actions, backend events, and Sui state.
- Commit-reveal explanation.
- Event replay model.
- Trust boundary documentation.
- Links to transaction digests and object IDs.

**Success moment:** The reviewer can explain why this is more than a Web2 game with a wallet.

### 4.3 Portfolio Reader / Interviewer

**Goal:** Assess product and engineering maturity.
**Needs:**

- Clear product narrative.
- Honest limitation disclosure.
- Working demo path.
- Roadmap showing good judgment.
- Evidence that the project handles security, privacy, and deployment realities.

**Success moment:** The reader sees a coherent product direction, not just isolated code.

### 4.4 Admin / Operator

**Goal:** Operate test rooms safely and inspect issues.
**Needs:**

- Whitelisted admin access.
- Room and player visibility.
- Transaction digest visibility.
- Failed verification inspection.
- Ability to close or clean test rooms.

**Success moment:** The admin can diagnose a stuck or suspicious room without mutating game truth invisibly.

---

## 5. Product Goals

### 5.1 MVP Goals

The V2 MVP should prove:

1. Four real users can join the same room.
2. Each player sees only their own hand.
3. The backend validates every move before accepting it.
4. The game state is synced across players in near real time.
5. A deck commitment exists before gameplay begins.
6. Game events form an auditable event chain.
7. Post-game reveal can verify deck, hands, event replay, and winner.
8. At least one meaningful Sui transaction is linked to the room.
9. Wallet identity and basic balance eligibility are enforced.
10. The product can be deployed to a Node-capable host.

### 5.2 Product Quality Goals

- A non-technical user can start playing within 60 seconds after wallet connection.
- A technical user can inspect verification signals without opening devtools.
- The UI must not expose opponent hands during the game.
- The system must clearly distinguish demo trust, backend trust, and on-chain trust.
- Errors should be visible, recoverable, and explainable.

### 5.3 Portfolio Goals

- The project should be easy to present in a demo video.
- The README and docs should describe the trust model honestly.
- The roadmap should show a credible path from prototype to verifiable multiplayer.
- The final artifact should communicate product, engineering, and Web3 judgment.

---

## 6. Non-Goals

The following are explicitly outside the first V2 MVP:

- Mainnet deployment.
- Real-money gambling or compliance workflows.
- Fiat payments.
- Global ranked matchmaking.
- Native mobile app.
- Zero-knowledge hidden-card proof system.
- TEE-based dealer.
- Fully decentralized peer-to-peer room discovery.
- Fully on-chain play/pass for every move.
- Advanced bot economy or token rewards.

These can be explored later, but including them in the MVP would blur the product and slow delivery.

---

## 7. Current State Assessment

### 7.1 Already Working or Mostly Working

| Area | Current State |
|---|---|
| UI | `/v2` has login, lobby, ready room, and four-seat table |
| Gameplay | Full Big Two rules against medium AI bots |
| Rooms | DB-backed room list, create, join, and mock fallback |
| Auth | Sui wallet nonce sign-in and HMAC session cookie |
| Chain | Deployed Sui testnet package with `big_two` and `stake_session` |
| Solo verification | `open_session` and `settle_session` model for stake bond and commit-reveal |
| Verification panel | Local commit-reveal check and chain session status |
| Data model | Prisma models for users, rooms, players, game states, events, verification snapshots |

### 7.2 Product Gaps

| Gap | Why It Matters |
|---|---|
| No real four-human multiplayer | The headline multiplayer product is not real yet |
| Client-side gameplay truth | Current AI game can be played locally after joining a room |
| Hidden-hand privacy conflict | Existing `big_two.deal_cards` stores all hands plaintext on-chain |
| Solo stake is a bond | Current solo stake is refunded; it is not a real winning pot |
| Room occupancy is partly cosmetic | Joining a DB room does not yet bind the actual game state |
| V2 cannot deploy as static site | API and DB require a Node host |
| Limited hardening | Needs rate limits, validation, RLS review, admin controls, tests |

### 7.3 Honest Product Claim Today

The current product should be described as:

> A playable V2 prototype with wallet login, room flow, AI gameplay, and on-chain anchored solo verification.

It should not yet be described as:

> A fully trustless four-human on-chain Big Two game.

The literal "house cannot cheat" claim becomes defensible only after:

- Real four-player authoritative state.
- Hidden-hand commitment model.
- Post-game reveal and replay.
- Pot claim tied to the verified winner.

---

## 8. Product Scope

### 8.1 V2 MVP Scope

The V2 MVP should include:

- Wallet login with nonce signing.
- Balance eligibility check for testnet SUI.
- Room create and join.
- One active room per wallet.
- Four-player ready room.
- Real-time room presence.
- Backend-authoritative deal, play, pass, and win state.
- Hidden opponent hands.
- Event hash chain.
- Verification panel backed by real data.
- Post-game reveal and replay.
- Sui testnet room or stake reference.
- Admin whitelist and basic admin view.
- Production deployment to a Node host.

### 8.2 V2 MVP+ Scope

The next layer after MVP:

- 1 SUI stake escrow from all four players.
- Winner claim flow.
- Full audit page.
- JSON audit export.
- Match history.
- Leaderboard.
- Mobile table polish.
- Stronger AI or mixed human/AI rooms.

### 8.3 Future Protocol Scope

Potential future direction:

- Contract revision for privacy-preserving hand commitments.
- More gameplay state on-chain.
- Configurable stakes.
- Tournament rooms.
- Reputation or seasonal ranking.
- Stronger anti-collusion tooling.
- Optional cryptographic dealer model.

---

## 9. User Experience Requirements

### 9.1 Entry Flow

**User story:** As a player, I want to connect my Sui wallet and quickly enter the lobby.

Requirements:

- Show a single clear wallet connection action.
- After wallet connection, request nonce signing.
- Display connected address in shortened form.
- Check testnet balance.
- If balance is below threshold, block room creation/join and show faucet guidance.
- If user is an admin, show admin entry.

Acceptance criteria:

- A user can connect and establish a server session.
- A session survives refresh.
- A user with insufficient balance cannot create or join a room.
- Auth APIs do not trust client-supplied wallet addresses.

### 9.2 Lobby

**User story:** As a player, I want to create or join a room without understanding blockchain internals.

Requirements:

- Show available rooms with code, player count, stake, and status.
- Allow create room.
- Allow join by room code.
- Prevent a wallet from joining multiple active rooms.
- Show clear states: waiting, ready, playing, ended.
- Avoid showing internal DB or chain details unless useful.

Acceptance criteria:

- Two browser sessions see the same available room list.
- Creating a room persists to DB.
- Joining a room assigns an available seat.
- Duplicate active-room join is rejected.

### 9.3 Ready Room

**User story:** As a player, I want to know who is seated and when the game will start.

Requirements:

- Show four seats.
- Show connected/empty status.
- Show ready status.
- Start only when the required seats are ready.
- Support future mixed human/AI room modes, but label them honestly.

Acceptance criteria:

- All participants see ready updates within 2 seconds.
- The game cannot start with invalid seat state.
- Refreshing does not lose the player seat.

### 9.4 Game Table

**User story:** As a player, I want to play Big Two with clear turn and action feedback.

Requirements:

- Show own hand at bottom.
- Show other players as card backs and remaining counts.
- Show current turn.
- Show last play.
- Provide select, hint, play, and pass actions.
- Disable invalid actions.
- Show backend rejection messages clearly.
- Preserve table layout across desktop and mobile breakpoints.

Acceptance criteria:

- A legal play advances the turn for all clients.
- An illegal play is rejected by backend validation.
- Opponent cards are never sent through normal gameplay APIs before reveal.
- A completed game records winner and final state.

### 9.5 Verification Panel

**User story:** As a player, I want to know whether the game is still verifiable without reading a technical document.

Requirements:

- Default to compact, table-side display.
- Use plain-language labels.
- Show pass/waiting/fail status.
- Show shortened hashes and IDs.
- Link to explorer when a Sui object or transaction exists.
- Never expose opponent hands during active play.

Minimum checks:

| Check | Meaning |
|---|---|
| Wallet eligibility | Player passed balance and session checks |
| Deck commitment | The deck fingerprint was locked before play |
| My hand commitment | My hand matches the commitment assigned to me |
| Event chain | Accepted actions are sequential and tamper-evident |
| Chain reference | Room or stake session is linked to Sui testnet |
| Reveal status | End-game deck reveal has passed, failed, or is pending |

Acceptance criteria:

- Panel reflects actual room data, not static demo values.
- If event order is broken, panel shows failure.
- If reveal hash mismatch occurs, panel shows failure.
- Users can open detailed audit after game completion.

### 9.6 Post-Game Audit

**User story:** As a reviewer, I want to replay a completed game and verify the result.

Requirements:

- Show deck commitment and revealed deck.
- Show hand commitments and revealed hands.
- Show ordered game events.
- Show replayed winner.
- Show recorded winner.
- Show stake claim target and claim status.
- Provide JSON export in a later milestone.

Acceptance criteria:

- Replaying events produces the recorded winner.
- Any mismatch is visible.
- Audit page can be shared or captured for portfolio/demo use.

---

## 10. Functional Requirements

### 10.1 Authentication

- Generate server nonce for wallet address.
- Verify signed personal message.
- Expire nonce after use or timeout.
- Create secure session cookie.
- Require session for room and game APIs.
- Use wallet address from session, not request body.

### 10.2 Room System

- Generate four-letter room codes.
- Enforce unique room code.
- Store room creator.
- Track room status.
- Assign seat indexes.
- Prevent duplicate wallet seats.
- Prevent more than one active room per wallet.
- Support room cleanup for stale rooms.

### 10.3 Gameplay Engine

- Deal standard 52-card deck to four players.
- Validate Big Two hand types.
- Validate play ownership.
- Validate play strength against previous play.
- Validate pass rules.
- Detect round reset after passes.
- Detect winner.
- Record every accepted action as an event.

### 10.4 Backend State

- Backend is authoritative for live gameplay state.
- Frontend may predict, but backend must validate.
- Store current turn, last play, remaining counts, status, and winner.
- Store event chain.
- Store verification snapshots.
- Support refresh and reconnect.

### 10.5 Sui Integration

Minimum MVP:

- Link room to Sui object or stake session.
- Display object ID or transaction digest.
- Record package ID and module name.
- Provide explorer links.

MVP+:

- Create 4-way stake escrow.
- Join with 1 testnet SUI stake.
- Claim pot by verified winner.
- Store claim transaction digest.

### 10.6 Admin

- Store admin whitelist server-side.
- Show admin-only route.
- Deny non-admin sessions.
- Show rooms, users, events, verification failures, and transaction digests.
- Log admin actions.

---

## 11. Data & Trust Model

### 11.1 Truth Layers

| Layer | Role | Trust Level |
|---|---|---|
| Frontend | UX, local selection, display, lightweight pre-validation | Not trusted |
| Backend | Multiplayer sync, hidden hand delivery, rule validation, event logs | Operationally trusted, auditable |
| Database | Persistence for rooms, state, events, snapshots | Not final truth |
| Sui | Wallet identity, commitments, stake, reveal proof, public references | Public verification layer |
| Verifier | Recomputes commitments and replays events | Independent check |

### 11.2 Commit-Reveal Requirements

During game:

- Lock deck commitment before play.
- Store each player hand commitment.
- Reveal only the current player's own hand to that player.
- Store accepted actions in order.

After game:

- Reveal deck and salts.
- Recompute deck commitment.
- Recompute hand commitments.
- Re-deal hands from deck.
- Replay events.
- Compare replayed winner to recorded winner.

Expected checks:

```text
sha3(deck || deck_salt) == deck_commitment
sha3(hand[i] || hand_salt[i]) == hand_commitment[i]
dealHands(deck) == hands
replay(events) == final_state
replay_winner == recorded_winner
claim_target == recorded_winner
```

### 11.3 Hidden-Hand Privacy

The current deployed `big_two` module stores hands in plaintext on-chain, which is incompatible with the product promise that players only see their own hand during active play.

V2 must choose one of two paths:

1. **Backend-hidden MVP path:** Keep live hands off-chain, store hand commitments, reveal after game.
2. **Contract-revision path:** Publish a revised contract with per-hand commitments and selective reveal semantics.

Recommended approach:

- Use backend-hidden MVP path first for product speed.
- Document that backend is currently trusted for live hidden-state delivery.
- Move toward contract revision for stronger trust minimization.

---

## 12. Security Requirements

### 12.1 Web Security

- Enforce `AUTH_SECRET` in production.
- Secure cookie flags in production.
- Rate limit auth, create room, join room, and action APIs.
- Validate all inputs with schema validation.
- Lock CORS to production domains.
- Review Supabase RLS / PostgREST exposure.
- Avoid logging sensitive hand data in plaintext logs.

### 12.2 Game Integrity

- Do not trust client-submitted hands.
- Do not return opponent hands before reveal.
- Validate every play server-side.
- Store event indexes and previous event hash.
- Reject out-of-turn actions.
- Reject duplicate actions.
- Support reconnect from persisted state.

### 12.3 Abuse Controls

- One active room per wallet.
- Room creation cooldown.
- Join attempts cooldown.
- Stale room cleanup.
- Optional allowlist during early demo.
- Admin action audit log.

---

## 13. Success Metrics

### 13.1 Product Metrics

| Metric | Target for MVP |
|---|---|
| Wallet login completion | 80%+ of users who connect wallet complete session |
| Room creation success | 95%+ under normal DB/API health |
| Four-player game completion | At least 3 consecutive successful manual test games |
| Illegal action rejection | 100% of tested illegal plays rejected |
| Reconnect recovery | Player can refresh and resume in active room |
| Verification completion | Completed game can be replayed and verified |

### 13.2 Portfolio Metrics

| Metric | Target |
|---|---|
| Demo clarity | A reviewer can understand Web3 value in under 2 minutes |
| Docs clarity | README explains current trust model and roadmap honestly |
| Audit visibility | Verification panel displays real data |
| Deployment readiness | Public URL runs V2 without local setup |

### 13.3 Engineering Metrics

| Metric | Target |
|---|---|
| Engine unit tests | Core rule coverage for combos, compare, pass, winner |
| API validation | All write APIs covered by schema validation |
| E2E happy path | One scripted game flow or manual QA checklist |
| Observability | Errors and failed verification checks are logged |

---

## 14. Roadmap Overview

The roadmap should move in three product arcs:

1. **Make the current prototype shippable.**
2. **Make multiplayer real.**
3. **Make verifiability defensible.**

---

## 15. Phase 0: Stabilize Current Demo

**Goal:** Preserve the existing value while preventing overclaiming.

**Status:** Mostly complete.

Deliverables:

- Keep legacy `/` demo available.
- Keep `/docs` available.
- Keep `/v2` isolated from legacy demo.
- Update README with clear V1/V2 distinction.
- Add honest product copy for current trust model.

Acceptance criteria:

- Public docs do not claim fully trustless multiplayer.
- V2 can be presented as a product-track prototype.
- Existing demo path remains unbroken.

Recommended priority: **P0**

---

## 16. Phase 1: Ship-Ready V2 Prototype

**Goal:** Turn the current V2 flow into a polished public demo of solo/AI gameplay plus visible verification.

Key work:

- Deploy V2 to Node-capable host such as Vercel.
- Configure `DATABASE_URL` and `AUTH_SECRET`.
- Polish mobile table layout.
- Add explorer links for `open_session` and `settle_session`.
- Clarify solo stake copy as "returnable integrity bond."
- Add loading, empty, and error states.
- Add production security basics.

Deliverables:

- Public `/v2` URL.
- Working wallet sign-in.
- Working room list/create/join.
- AI gameplay flow.
- Verifiable stake session panel.
- Mobile-responsive table.
- Security baseline doc.

Acceptance criteria:

- A reviewer can open the public URL and complete a demo game.
- The verification panel shows real commitment/session data where available.
- The product copy clearly says AI/solo verification is not the final four-human protocol.

Recommended priority: **P0**

Estimated effort: **1-2 weeks**

---

## 17. Phase 2: Real Multiplayer Foundation

**Goal:** Make room membership and gameplay state real across clients.

Key work:

- Implement real-time room presence.
- Implement ready state sync.
- Persist game state and events.
- Backend-authoritative deal.
- Backend-side move/pass validation.
- Per-player hand delivery.
- Reconnect/resume.

Deliverables:

- Real room channel.
- Four human seats.
- Ready room.
- Backend deal endpoint.
- Play/pass action endpoint.
- Event persistence.
- Reconnect support.

Acceptance criteria:

- Four browser sessions can join the same room.
- Each player sees only their own hand.
- Two clients see each other's actions within 2 seconds.
- Illegal actions are rejected by backend.
- Refreshing mid-game resumes correct state.

Recommended priority: **P0**

Estimated effort: **2-4 weeks**

Dependencies:

- Stable DB schema.
- Realtime transport choice.
- Session-authenticated socket or realtime channel.

---

## 18. Phase 3: Live Verification Layer

**Goal:** Make the verification panel reflect real multiplayer state.

Key work:

- Generate deck commitment before deal.
- Generate hand commitments.
- Create event hash chain.
- Store verification snapshots.
- Show live verification status.
- Add detailed audit route.
- Add failure states.

Deliverables:

- Deck commitment service.
- Hand commitment service.
- Event hash chain implementation.
- Verification snapshot table usage.
- `/v2/rooms/[code]/audit` or equivalent.
- JSON-like audit output.

Acceptance criteria:

- Panel shows real deck commitment.
- Panel shows current player's hand commitment.
- Panel shows event count and chain status.
- Reordered or missing events produce visible failure.
- Completed game can be replayed from stored events.

Recommended priority: **P0**

Estimated effort: **2-3 weeks**

Dependencies:

- Phase 2 backend event model.
- Stable game replay function.

---

## 19. Phase 4: Sui Escrow & Winner Claim

**Goal:** Tie stake and payout to the verified multiplayer game result.

Key work:

- Decide contract path:
  - revise `big_two` for hidden-hand-compatible commitments, or
  - add a new room escrow module for off-chain-play / on-chain-settle.
- Build create-room stake transaction.
- Build join-room stake transaction.
- Track 4-player pot.
- Build winner claim transaction.
- Display claim status.
- Link tx digests in verification panel and audit page.

Deliverables:

- 4-way stake flow.
- Pot status.
- Winner claim.
- Explorer links.
- Contract docs.

Acceptance criteria:

- Each player stakes 1 testnet SUI.
- Winner can claim pot after verified game completion.
- Losers cannot claim pot.
- Claim target matches verified winner.
- Failed verification blocks or flags claim flow.

Recommended priority: **P1 after real multiplayer**

Estimated effort: **2-4 weeks**

Dependencies:

- Phase 2 multiplayer.
- Phase 3 verifier.
- Contract design decision.

---

## 20. Phase 5: Production Hardening

**Goal:** Make the product stable enough for public portfolio review and extended testing.

Key work:

- API rate limiting.
- CORS lockdown.
- RLS review.
- Admin backend.
- Turn timeout and auto-pass.
- Stale room cleanup.
- Structured logging.
- Error tracking.
- Unit and e2e tests.
- QA checklist.

Deliverables:

- `/v2/admin`.
- Rate-limit middleware.
- Security checklist.
- Test suite.
- Observability setup.
- Manual QA script.

Acceptance criteria:

- Non-admin cannot access admin routes.
- Idle player times out and game continues.
- Key engine rules are unit-tested.
- A happy-path game can be tested repeatedly.
- Failed verification states are inspectable.

Recommended priority: **P1**

Estimated effort: **1-3 weeks**

---

## 21. Phase 6: Portfolio Packaging

**Goal:** Turn the project into a clear external artifact.

Key work:

- Rewrite README around product thesis.
- Update architecture docs.
- Add trust model diagram.
- Add demo video or GIF.
- Add screenshots.
- Add public roadmap.
- Add "Known Limitations" section.
- Add deployment notes.

Deliverables:

- Portfolio-ready README.
- V2 architecture doc.
- Trust model doc.
- Demo media.
- Product roadmap.
- Public demo URL.

Acceptance criteria:

- A reader can understand the project without running it locally.
- The docs clearly separate current demo, V2 MVP, and future trustless path.
- The demo video shows wallet, room, table, verification, and audit.

Recommended priority: **P2**

Estimated effort: **3-5 days**

---

## 22. Recommended Execution Order

### 22.1 Fastest High-Value Path

1. Deploy current V2 prototype to a Node host.
2. Polish verification panel copy and explorer links.
3. Fix responsive table issues.
4. Add README trust-model language.
5. Build real multiplayer foundation.
6. Add live event chain and post-game replay.
7. Add 4-way stake escrow.

This path gives a public artifact quickly, then moves toward the harder technical claim.

### 22.2 Critical Path to the Headline Claim

The product's strongest claim is:

> The house cannot secretly change the cards or payout.

That claim requires:

1. Backend-authoritative or contract-authoritative game state.
2. Hidden-hand commitment model.
3. Ordered event chain.
4. Post-game reveal and replay.
5. Winner-bound claim flow.

Without these, the product should say "verifiable prototype" rather than "fully trustless multiplayer."

### 22.3 Recommended Next 10 Tickets

| Order | Ticket | Priority | Effort |
|---:|---|---|---|
| 1 | Deploy V2 to Vercel or equivalent Node host | P0 | M |
| 2 | Add explorer links and clearer solo stake copy | P0 | S |
| 3 | Fix responsive table layout | P0 | M |
| 4 | Add Zod validation to all write APIs | P0 | S |
| 5 | Add realtime room presence and ready state | P0 | L |
| 6 | Persist active game state and accepted events | P0 | M |
| 7 | Move deal/play/pass authority to backend | P0 | L |
| 8 | Implement event hash chain | P0 | M |
| 9 | Implement post-game reveal and replay endpoint | P0 | L |
| 10 | Decide and document Sui escrow contract path | P1 | M |

---

## 23. Risk Register

| Risk | Impact | Likelihood | Mitigation |
|---|---:|---:|---|
| Hidden hands conflict with plaintext on-chain state | High | High | Use backend-hidden MVP, then revise contract with hand commitments |
| Multiplayer sync complexity delays MVP | High | Medium | Start with Supabase Realtime or simple socket room before deeper chain sync |
| Wallet friction hurts demo completion | Medium | Medium | Provide clear faucet and testnet guidance |
| Chain transaction latency hurts gameplay | Medium | Medium | Keep play/pass off-chain for MVP; use chain for commitment/stake/reveal |
| Product overclaims trustlessness | High | Medium | Keep trust model and limitations explicit in UI/docs |
| Static hosting cannot run V2 | High | High | Deploy V2 to Vercel/Node host; keep legacy static site separate |
| Insufficient tests in game rules | Medium | Medium | Add engine unit tests before multiplayer complexity expands |
| Admin tooling missing during demos | Medium | Medium | Build minimal admin room/event inspector early |

---

## 24. Open Product Decisions

These decisions should be resolved before Phase 3 or Phase 4:

1. Should MVP use Supabase Realtime or a custom WebSocket server?
2. Should live gameplay remain off-chain with post-game verification, or should more actions become on-chain?
3. Should the next contract be a revised `big_two` module or a separate escrow/settlement module?
4. Should mixed human/AI rooms be part of the MVP, or only solo demo and four-human rooms?
5. Should stake be fixed at 1 testnet SUI for all public demos?
6. What exact data is safe to expose in the audit page before and after reveal?
7. How should stale or abandoned games resolve the pot?

---

## 25. Suggested Product Copy

### 25.1 Short Public Description

Sui Big Two is a Web3 Big Two card game where players can play a normal multiplayer table while the deck, hand commitments, event history, and final result remain auditable.

### 25.2 Honest Current Demo Description

The current V2 prototype supports wallet login, room flow, AI gameplay, and a verifiable stake session on Sui testnet. It demonstrates the product direction, while real four-human authoritative multiplayer and full hidden-hand settlement remain on the roadmap.

### 25.3 Future MVP Description

The V2 MVP will let four real wallets join one room, play with hidden hands, validate moves through the backend, record an auditable event chain, reveal the deck after the game, and verify that the recorded winner matches the replayed game.

---

## 26. Definition of Done

### 26.1 V2 MVP Done

V2 MVP is done when:

- Four real users can join one room.
- Each user sees only their own hand.
- Backend validates every deal, play, pass, and win transition.
- Game events are persisted in order.
- Event hash chain is visible in the verification panel.
- Deck and hand commitments are generated before play.
- Completed game can be revealed and replayed.
- Verification failures are visible.
- At least one Sui room/stake/reveal transaction is linked.
- Wallet sessions are authenticated and secure.
- The app is publicly deployed on a Node-capable host.

### 26.2 Portfolio Done

Portfolio-ready is done when:

- Public demo URL works.
- README explains product thesis in under one minute.
- Architecture docs show frontend, backend, DB, Sui, and verifier responsibilities.
- Trust model clearly says what is trusted today and what is verifiable.
- Demo video or GIF shows the complete flow.
- Known limitations are explicit and credible.

---

## 27. Immediate Next Step Recommendation

The best next move is not to jump straight into a contract rewrite. The fastest path to a stronger product is:

1. **Ship the current V2 prototype publicly and honestly.**
2. **Make real multiplayer state authoritative.**
3. **Add live verification and replay.**
4. **Then connect stake escrow to the verified winner.**

This sequence keeps the project demoable at every step while moving steadily toward the full Web3 promise.
