# Sui Big Two V2 Architecture

## System Overview

V2 introduces a backend and database while keeping verifiability as the main
product feature.

```text
Browser / Next.js
  - wallet connect
  - room lobby
  - multiplayer table
  - hidden-hand UI
  - right-side verification panel

Backend API
  - wallet auth
  - room lifecycle
  - player eligibility
  - backend rule validation
  - event hash chain
  - audit endpoints

Realtime Layer
  - WebSocket room channels
  - per-player private hand delivery
  - public table state broadcast

Database
  - users
  - wallets
  - rooms
  - players
  - hands
  - events
  - verification runs

Sui
  - wallet identity
  - testnet balance check
  - GameRoom reference
  - commitment / reveal / stake transactions
```

## Recommended Stack

```text
Frontend: Next.js
Backend: Fastify or NestJS
Realtime: Socket.IO or ws
Database: PostgreSQL
ORM: Prisma
Validation: Zod
Security: Cloudflare WAF + backend rate limit
Sui SDK: @mysten/sui
Wallet UI: @mysten/dapp-kit
```

Fastify is enough for this project if the goal is a lean portfolio MVP. NestJS
is better if the project is expected to become a larger backend with modules,
guards, and dependency injection.

## Authentication Flow

Wallet login must prove wallet ownership. The backend should never trust a raw
address sent from the frontend.

```text
1. Client requests login nonce.
2. Backend creates nonce and expiration.
3. Client asks Sui wallet to sign a login message.
4. Client submits address + signature + nonce.
5. Backend verifies signature and nonce.
6. Backend creates session / JWT.
```

Suggested sign-in message:

```text
Sign in to Sui Big Two

Domain: bigtwo.tungowo.com
Address: {walletAddress}
Nonce: {nonce}
Issued At: {isoTimestamp}
Expires At: {isoTimestamp}
Purpose: Multiplayer room authentication
```

Session claims:

```text
userId
walletAddress
isAdmin
activeRoomId
expiresAt
```

## Wallet Eligibility

Normal users can create or join a V2 room only if:

```text
testnet SUI balance >= 1 SUI
```

Admin allowlisted wallets can enter the admin view even if they do not follow
normal player restrictions. Admin bypass should not allow silent mutation of
game outcomes.

## Room Lifecycle

```text
LOBBY
  - room exists
  - players can join
  - max four seats

READY
  - four players seated
  - all eligible
  - stake requirement acknowledged

PLAYING
  - deck committed
  - hands distributed privately
  - turn state active

ENDED
  - winner recorded
  - no more play/pass actions

REVEALED
  - deck and salts revealed
  - replay verifier can run

SETTLED
  - stake / pot outcome finalized
```

## Data Visibility

### Public During Play

- Room id.
- Seat list.
- Wallet short addresses.
- Card counts.
- Current turn.
- Last play.
- Pass state.
- Deck commitment.
- Hand commitment list.
- Event hash chain head.
- Sui room object id / transaction digest.

### Private During Play

- The current player's hand.
- The current player's hand salt.
- Internal deck order.
- Other players' hands.
- Other players' hand salts.

### Public After Reveal

- Deck.
- Deck salt.
- All hands.
- All hand salts.
- Event log.
- Replay result.

## Event Hash Chain

Every accepted game action should create an event record.

```ts
type GameEvent = {
  id: string
  roomId: string
  seq: number
  type: "room_created" | "player_joined" | "deal" | "play" | "pass" | "game_ended" | "reveal" | "claim"
  actorWallet: string | null
  publicPayload: unknown
  privatePayloadHash?: string
  prevEventHash: string
  eventHash: string
  backendSignature?: string
  suiTxDigest?: string
  createdAt: string
}
```

Hash formula:

```text
eventHash = sha256(canonicalJson({
  roomId,
  seq,
  type,
  actorWallet,
  publicPayload,
  privatePayloadHash,
  prevEventHash,
  suiTxDigest
}))
```

Rules:

- `seq` must increase by exactly one.
- `prevEventHash` must equal the previous event's `eventHash`.
- The right-side panel shows event count and latest event hash.
- The detailed audit page can show every event.

## Commitments

### Deck Commitment

```text
deckCommitment = sha3_256(deck || deckSalt)
```

### Hand Commitment

```text
handCommitment[seat] = sha3_256(hand[seat] || handSalt[seat])
```

During play, each player receives only:

```text
own hand
own handSalt
own seat
all handCommitments
deckCommitment
```

This lets a player verify their own hand without revealing other players' hands.

## API Shape

### Auth

```text
POST /api/auth/nonce
POST /api/auth/verify
POST /api/auth/logout
GET  /api/me
```

### Rooms

```text
POST /api/rooms
POST /api/rooms/:roomId/join
POST /api/rooms/:roomId/leave
GET  /api/rooms/:roomId
GET  /api/rooms/:roomId/audit
```

### Actions

```text
POST /api/rooms/:roomId/ready
POST /api/rooms/:roomId/play
POST /api/rooms/:roomId/pass
POST /api/rooms/:roomId/reveal
POST /api/rooms/:roomId/claim
```

### Admin

```text
GET /api/admin/rooms
GET /api/admin/rooms/:roomId
GET /api/admin/events
```

## WebSocket Channels

```text
room:{roomId}:public
  - public table state
  - current turn
  - last play
  - pass state
  - verification summary

room:{roomId}:private:{userId}
  - own hand
  - own hand salt
  - private action errors
```

The server must not broadcast all hands to the public room channel.

## Backend Rule Validation

The backend must reject:

- Action from a user not in the room.
- Action from the wrong turn.
- Cards not in the actor's current hand.
- Invalid combo.
- Weak play.
- Passing when there is no active last play.
- First play missing clubs 3.
- Duplicate event sequence.
- Action after game ended.

Frontend validation is only for better UX.

## Database Draft

```prisma
model User {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  wallets   Wallet[]
  rooms     Room[]   @relation("RoomHost")
}

model Wallet {
  id         String   @id @default(cuid())
  userId     String
  address    String   @unique
  chain      String
  verifiedAt DateTime
  user       User     @relation(fields: [userId], references: [id])
}

model Room {
  id              String   @id @default(cuid())
  hostUserId      String
  status          String
  deckCommitment  String?
  chainRoomId     String?
  stakeMist       BigInt   @default(1000000000)
  currentTurnSeat Int?
  winnerSeat      Int?
  createdAt       DateTime @default(now())
  host            User     @relation("RoomHost", fields: [hostUserId], references: [id])
  players         RoomPlayer[]
  events          GameEvent[]
}

model RoomPlayer {
  id            String   @id @default(cuid())
  roomId        String
  userId        String
  walletAddress String
  seat          Int
  joinedAt      DateTime @default(now())
  room          Room     @relation(fields: [roomId], references: [id])

  @@unique([roomId, seat])
  @@unique([roomId, userId])
}

model RoomHand {
  id             String @id @default(cuid())
  roomId         String
  seat           Int
  encryptedHand  Json?
  handCommitment String
  handSaltHash   String

  @@unique([roomId, seat])
}

model GameEvent {
  id                 String   @id @default(cuid())
  roomId             String
  seq                Int
  type               String
  actorWallet        String?
  publicPayload      Json
  privatePayloadHash String?
  prevEventHash      String
  eventHash          String
  backendSignature   String?
  suiTxDigest        String?
  createdAt          DateTime @default(now())
  room               Room     @relation(fields: [roomId], references: [id])

  @@unique([roomId, seq])
}

model VerificationRun {
  id          String   @id @default(cuid())
  roomId      String
  hashMatches Boolean
  dealMatches Boolean
  replayValid Boolean
  resultJson  Json
  createdAt   DateTime @default(now())
}

model AdminWhitelist {
  id        String   @id @default(cuid())
  address   String   @unique
  note      String?
  createdAt DateTime @default(now())
}
```

## Right-Side Verification Panel Data Contract

The frontend should receive a compact object:

```ts
type VerificationSummary = {
  walletEligibility: {
    status: "pass" | "fail" | "pending"
    balanceMist?: string
  }
  deckCommitment: {
    status: "pass" | "pending"
    hash?: string
  }
  myHandCommitment: {
    status: "pass" | "fail" | "pending"
    hash?: string
  }
  eventChain: {
    status: "pass" | "fail" | "pending"
    count: number
    head?: string
  }
  chainRoom: {
    status: "pass" | "fail" | "pending"
    objectId?: string
    txDigest?: string
  }
}
```

The panel should stay simple. Detailed data belongs in `/audit`.

## Firewall and Deployment

Recommended deployment:

```text
Cloudflare DNS / WAF
  -> Frontend: GitHub Pages or Vercel
  -> Backend: Fly.io / Railway / Render / VPS
  -> Database: Managed PostgreSQL
```

Minimum WAF / API settings:

- HTTPS only.
- Rate limit auth endpoints.
- Rate limit room creation.
- Block obvious bot traffic.
- CORS allowlist: `https://bigtwo.tungowo.com`.
- WebSocket origin check.
- Request body size limit.
- Structured logs for failed auth and failed actions.

## Implementation Order

1. Keep the current `/v2` static prototype.
2. Add backend scaffold.
3. Add Prisma schema.
4. Add wallet login.
5. Add room create/join.
6. Add WebSocket public/private channels.
7. Move V2 UI from static mock data to API data.
8. Add backend rule validation.
9. Add event hash chain.
10. Connect right-side verification panel to real data.
11. Add post-game audit page.
12. Integrate Sui stake and claim.
