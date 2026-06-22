# Sui Big Two V2 Product Plan

## Product Positioning

Sui Big Two V2 is the multiplayer product track of the project. The original
demo remains available as a verifiability showcase. V2 focuses on turning the
same idea into a portfolio-ready Web3 card game with account flow, room flow,
hidden hands, backend-enforced gameplay, wallet identity, and a visible audit
panel.

The core product statement:

```text
Players play Big Two like a normal multiplayer card game, while technical users
can inspect simple verification signals directly on the table.
```

V2 should not become a generic Web2 card room with a wallet attached. The product
must preserve the original project's strongest idea: game state should be
auditable, and hidden information should be bound by commitments.

## V1 vs V2

| Area | V1 Current Demo | V2 Product Track |
| --- | --- | --- |
| Purpose | Verifiability proof-of-concept | Portfolio-ready multiplayer game |
| Players | Local simulated players | Real users in rooms |
| Hands | All hands visible for verification | Only own hand visible during play |
| Backend | None / frontend demo state | Room server, WebSocket, database |
| Wallet | Sui Wallet for chain room creation | Wallet identity, eligibility, stake |
| Verification | Full reveal panel and history | Always-visible table-side audit panel |
| Asset Flow | Testnet stake demo | 1 testnet SUI room stake model |
| Security | Demo trust model | Auth, rate limit, WAF, audit logs |

## Product Goals

1. Let users connect a Sui wallet and enter a multiplayer room.
2. Restrict normal users to one active room: either create one room or join one room.
3. Require at least 1 testnet SUI before a user can create or join a room.
4. Support a fixed 1 testnet SUI stake model.
5. Hide other players' hands during play.
6. Validate all gameplay on the backend, not only in the frontend.
7. Show a right-side verification panel on the game table.
8. Preserve post-game verification through deck reveal and event replay.
9. Keep an admin whitelist for the project owner to enter backend/admin views.

## Non-Goals

These are intentionally outside the first V2 production milestone:

- Mainnet gambling.
- Real-money compliance.
- Fully private poker.
- Zero-knowledge proof implementation.
- TEE deployment.
- Fully on-chain play/pass for every action.
- Mobile app.
- Global matchmaking.

## User Roles

### Normal Player

- Connects wallet.
- Must have at least 1 testnet SUI.
- Can create one room or join one room.
- Can only see their own hand.
- Can see other players' card backs and card counts.
- Can inspect the simplified verification panel.

### Technical Player

- Uses the same UI as normal players.
- Reads hashes, short digests, event count, and chain room status.
- Can open a detailed audit view after the game.
- Can download audit JSON in a later milestone.

### Admin

- Wallet address is allowlisted.
- Can enter admin/backend view.
- Can inspect rooms, users, event logs, and verification failures.
- Cannot silently mutate game results without leaving an audit trail.

## V2 Screen Map

```text
/v2
  - wallet login
  - balance check
  - create room
  - join room
  - admin entry if wallet is allowlisted

/v2/room/:roomId
  - four-player table
  - hidden opponent hands
  - own hand
  - action controls
  - right-side verification panel

/v2/room/:roomId/audit
  - event hash chain
  - commitment checks
  - reveal checks
  - replay result

/v2/admin
  - allowlisted admin view
  - room list
  - player sessions
  - failed checks
```

## Right-Side Verification Panel

The right-side panel should be visible on the table at all times. It is not a
full technical document. It is a compact trust dashboard.

The first production version should show five checks:

| Check | What It Means | Display |
| --- | --- | --- |
| Wallet Eligibility | Player wallet has required testnet balance | Pass / Fail + balance |
| Deck Commitment | Room deck commitment exists and is locked | Pass + short hash |
| My Hand | Own hand matches own hand commitment | Pass + short hash |
| Event Chain | Backend game events form a continuous hash chain | Pass + event count |
| Chain Room | Sui GameRoom / package data is linked | Pass + short object id |

Example copy:

```text
即時驗證
全部通過

錢包資格    1.26 testnet SUI    已達 1 SUI 入場門檻
牌堆承諾    0x7f2a...91c8       deck commitment 已鎖定
我的手牌    0x41e9...0ad2       hand commitment 匹配
事件鏈      18 / 18             event hash chain 連續
鏈上房間    0x94b3...f985       Sui testnet 狀態同步
```

The panel must not expose other players' hands during the game.

## Verification Model

V2 separates verification into two layers.

### During Play

During play, hidden cards cannot be fully revealed. The user can still verify:

- Wallet identity.
- Wallet balance eligibility.
- Deck commitment exists.
- Own hand matches own hand commitment.
- Event hash chain has not broken.
- Backend has accepted actions in sequence.
- Sui room reference is attached.

### After Game

After the game ends, the system can reveal:

- Full deck.
- Deck salt.
- Hand salts.
- Original hands.
- Event log.

Then the verifier can check:

```text
sha3(deck || deckSalt) == deckCommitment
sha3(hand[i] || handSalt[i]) == handCommitment[i]
dealHands(deck) == hands
event replay winner == recorded winner
pot claim target == recorded winner
```

## Backend Responsibilities

The backend exists for multiplayer UX and hidden-state management. It must not
be treated as an unquestioned truth source.

Backend responsibilities:

- Wallet session verification.
- Room creation and joining.
- Seat assignment.
- WebSocket state sync.
- Hidden hand delivery.
- Backend-side rule validation.
- Event hash chain generation.
- Audit log persistence.
- Sui balance lookup.
- Sui transaction digest storage.

The frontend may validate rules for responsiveness, but the backend must repeat
the validation before accepting an action.

## Database Responsibilities

The database stores room and event state for real-time multiplayer operations.
It is not the final trust layer.

Required tables:

```text
users
wallets
rooms
room_players
room_hands
game_events
verification_runs
admin_whitelist
```

Important rule:

```text
The database can store hidden hands, but APIs must only return the current
player's own hand.
```

## Sui Responsibilities

Sui should be used where it creates real Web3 value:

- Wallet identity.
- Balance eligibility.
- Shared GameRoom reference.
- Stake escrow.
- Room commitment.
- Reveal and claim transaction digest.
- Public chain explorer links.

The first V2 milestone can keep play/pass off-chain for speed. Later milestones
can move more gameplay on-chain if the UX cost is acceptable.

## Security Requirements

Minimum production-track requirements:

- Wallet signature login with nonce.
- Nonce expiration.
- One active room per wallet.
- Backend validation for all moves.
- WebSocket session authentication.
- API rate limiting.
- CORS allowlist for the production domain.
- Cloudflare WAF in front of the app/API.
- Admin whitelist stored server-side.
- Audit log for admin actions.
- No API returns opponent hands before reveal.

## Roadmap

### Phase 0: Current V2 UI Prototype

Status: in progress.

Deliverables:

- `/v2` route.
- Four-player table layout.
- Opponent hidden hands.
- Own hand visible.
- Right-side verification panel.
- Entry controls for wallet / create / join.

This phase is visual and product-directional. It is not a real multiplayer
server yet.

### Phase 1: Backend and Database Foundation

Deliverables:

- `backend` service scaffold.
- PostgreSQL schema.
- Prisma models.
- Wallet nonce API.
- Wallet signature verify API.
- Room create/join APIs.
- One-active-room enforcement.
- Admin whitelist model.

Success criteria:

- A wallet can log in.
- A wallet with less than 1 testnet SUI is blocked.
- A wallet can create or join only one active room.

### Phase 2: WebSocket Multiplayer Room

Deliverables:

- WebSocket room channel.
- Seat sync.
- Ready state.
- Deal state.
- Turn sync.
- Backend-side play/pass validation.
- Per-player hand delivery.

Success criteria:

- Four browser sessions can join one room.
- Each session sees only its own hand.
- Illegal actions are rejected by the backend.

### Phase 3: Audit Panel Live Data

Deliverables:

- Real deck commitment.
- Hand commitments.
- Event hash chain.
- Event count.
- Sui room object/digest display.
- Basic audit endpoint.

Success criteria:

- The right-side panel reflects actual room state.
- Breaking event order or action validity creates a visible failure.

### Phase 4: Post-Game Reveal and Replay

Deliverables:

- Reveal deck and salts.
- Post-game verifier.
- Audit page.
- Replay winner check.
- JSON export.

Success criteria:

- A completed game can be replayed from the event log.
- The verifier can detect mismatched hands, broken events, or wrong winners.

### Phase 5: Sui Escrow Integration

Deliverables:

- 1 testnet SUI stake transaction.
- Room pot tracking.
- Winner claim flow.
- Sui transaction links.
- Claim status in audit panel.

Success criteria:

- Each player stakes 1 testnet SUI.
- Winner claim is tied to recorded winner.
- Claim status is visible in the UI.

## Portfolio Presentation

The portfolio should present the project as two layers:

```text
V1: verifiable game proof-of-concept
V2: multiplayer product direction
```

Suggested portfolio copy:

```text
Sui Big Two is a Web3 Big Two card game project. V1 demonstrates commit-reveal
verification and Sui Move state. V2 extends the concept into a multiplayer table
where players only see their own hands while a right-side verification panel
shows wallet eligibility, deck commitment, hand commitment, event chain status,
and linked Sui room state.
```

## Definition of Done for V2 MVP

V2 MVP is complete when:

- Four real users can join a room.
- Each user sees only their own hand.
- The backend validates every play/pass.
- The right-side verification panel is backed by real room data.
- Event hash chain is stored and displayed.
- A game can end and be replayed by verifier.
- At least room creation or stake escrow is linked to Sui.
- Admin access is wallet-whitelisted.
- Basic WAF/rate limit/security controls are documented and enabled.
