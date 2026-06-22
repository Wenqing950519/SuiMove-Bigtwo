# Sui Big Two V2 Deployment & On-chain Readiness

**Goal:** Ship V2 so it runs from a public Node host and Neon Postgres database, not local state.

---

## 1. Current Deployment Target

V2 requires a server runtime. Do not deploy V2 with GitHub Pages static export.

Recommended target:

- App host: Vercel
- Project root: `frontend/`
- Database: Neon Postgres
- Chain: Sui testnet
- Required app route: `/v2`
- Required docs route: `/v2/docs`

Why Neon first:

- The app already uses Prisma + PostgreSQL, so Neon is a drop-in `DATABASE_URL` swap.
- Neon Free may scale compute to zero when idle, but the next request wakes it automatically.
- This is better for a portfolio demo than Supabase Free project pause, which may require dashboard restore after low activity.
Required environment variables:

```env
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require"
AUTH_SECRET="replace-with-a-long-random-production-secret"
```

---


## 2. Manual Setup Required

These steps require the project owner, because they involve external accounts and secrets:

1. Create or log into a Neon account.
2. Create a Neon Postgres project.
3. Copy the pooled connection string if available, otherwise the direct connection string.
4. In Vercel, create/import the project with root directory `frontend/`.
5. Add Vercel environment variables: `DATABASE_URL` and `AUTH_SECRET`.
6. Trigger a production deployment.
7. Run Prisma deploy/seed against the Neon database.
8. If publishing a new Sui package, update `frontend/lib/sui-config.ts` with the new package data.

---

## 3. Local Preflight

From `frontend/`:

```powershell
npm.cmd install
npm.cmd run lint
npm.cmd run build
```

Expected:

- Build passes.
- Lint has no errors. Existing warnings are acceptable until legacy demo cleanup.

---

## 4. Neon Database Setup

1. Create a Neon project.
2. Copy the pooled Neon connection string if available, otherwise the direct connection string.
3. Set `DATABASE_URL` in Vercel and local `.env` if needed.
4. Apply migrations:

```powershell
cd C:\Users\eason\Documents\SuiMove\sui-bigtwo\frontend
npm.cmd run db:deploy
```

5. Seed permanent AI rooms:

```powershell
npm.cmd run db:seed
```

Runtime note:

- `GET /api/rooms` also calls `ensurePermanentAiRooms`, so `ROBO` and `DUOS` are recreated/reset if they were accidentally finished.
- `db:seed` is still useful for a clean production database before first demo.

---

## 5. Vercel Setup

Vercel project settings:

```text
Framework preset: Next.js
Root directory: frontend
Install command: npm install
Build command: npm run build
Output directory: .next
Node runtime: default Vercel Node runtime
```

Environment variables:

```text
DATABASE_URL=...
AUTH_SECRET=...
```

After first deploy:

1. Open `/v2`.
2. Connect wallet and sign in.
3. Confirm lobby loads `DUOS` and `ROBO`.
4. Open `/v2/docs`.
5. Join `ROBO`, start game, wait for AI auto-turns.
6. Leave room and confirm `ROBO` returns to waiting state.

---

## 6. Sui Testnet Publish / Upgrade

From `move/`:

```powershell
cd C:\Users\eason\Documents\SuiMove\sui-bigtwo\move
sui client active-env
sui client switch --env testnet
sui client active-address
sui client gas
sui move build
```

Publish new package:

```powershell
sui client publish --gas-budget 300000000
```

Or upgrade existing package if using the saved UpgradeCap:

```powershell
sui client upgrade --upgrade-capability <UPGRADE_CAP_OBJECT_ID> --gas-budget 300000000
```

Record from publish output:

- Package ID
- UpgradeCap ID
- Publish transaction digest

Update frontend config:

```text
frontend/lib/sui-config.ts
```

Fields to update:

```ts
SUI_BIGTWO_PACKAGE_ID
SUI_BIGTWO_PUBLISH_DIGEST
SUI_BIGTWO_UPGRADE_CAP
```

Then rebuild:

```powershell
cd ..\frontend
npm.cmd run build
```

---

## 7. Current On-chain Boundary

The frontend now has builders for:

- `create_room_with_stake`
- `join_room_with_stake`
- `reveal_deck`
- `claim_pot`
- solo `stake_session.open_session`
- solo `stake_session.settle_session`

Important limitation:

- The deployed `big_two.deal_cards` stores all four hands in plaintext on-chain.
- Therefore the current public V2 MVP should be described as backend-verified hidden-hand multiplayer plus prepared Sui escrow/claim path.
- A production hidden-hand escrow should use the next Move revision: commitments during active play, reveal after finish.

Recommended public wording:

```text
V2 currently runs backend-verified multiplayer with commit-reveal and event replay.
Sui escrow and claim transaction paths are prepared, while full hidden-hand on-chain escrow requires the next contract revision.
```

---

## 8. Public Demo Acceptance Checklist

Before sharing a public URL:

- `/v2` loads without local server.
- `/v2/docs` loads without local server.
- Wallet sign-in works.
- Lobby shows `ROBO` and `DUOS`.
- `ROBO` can start with one human plus three AI.
- AI turns advance through polling.
- A human can leave `ROBO` without deleting the permanent room.
- A custom room can be created and joined.
- Verification panel shows deck commitment, hand commitment, event head, event count, and replay status.
- Build passes in Vercel logs.
- Neon tables contain rooms, room_players, game_states, game_events, verification_snapshots.

---

## 9. Fallback Database Options

Preferred:

```text
Neon Free or Neon Launch
```

Acceptable but less ideal for public demos:

```text
Supabase Free with manual restore risk
Supabase Pro
```

Avoid:

```text
Local PostgreSQL
SQLite on Vercel
GitHub Pages static export
```

---
## 10. Next Contract Work

For the next on-chain milestone:

1. Add a hidden-hand-compatible room module.
2. Store deck commitment and per-hand commitments on-chain.
3. Keep active hands off-chain or encrypted during play.
4. Reveal deck and hand salts after finish.
5. Bind winner claim to verified replay result.
6. Add timeout/abandon pot rules.
7. Update `/v2/docs` and this deployment file after publish.
