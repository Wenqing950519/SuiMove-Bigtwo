import { Transaction } from "@mysten/sui/transactions"
import { SUI_BIGTWO_MODULE, SUI_BIGTWO_PACKAGE_ID } from "@/lib/sui-config"

export const STAKE_MODULE = "stake_session"
export const DEFAULT_STAKE_MIST = BigInt(1_000_000_000) // 1 SUI = 1e9 MIST

function hexToBytes(hex: string): number[] {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex
  const out: number[] = []
  for (let i = 0; i < clean.length; i += 2) out.push(parseInt(clean.slice(i, i + 2), 16))
  return out
}

export function buildOpenSession(
  deckCommitmentHex: string,
  stakeMist: bigint = DEFAULT_STAKE_MIST,
): Transaction {
  const tx = new Transaction()
  const [stakeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(stakeMist)])
  tx.moveCall({
    target: `${SUI_BIGTWO_PACKAGE_ID}::${STAKE_MODULE}::open_session`,
    arguments: [tx.pure.vector("u8", hexToBytes(deckCommitmentHex)), stakeCoin],
  })
  return tx
}

export function buildSettleSession(
  sessionObjectId: string,
  deckCardIds: number[],
  saltHex: string,
  won: boolean,
): Transaction {
  const tx = new Transaction()
  tx.moveCall({
    target: `${SUI_BIGTWO_PACKAGE_ID}::${STAKE_MODULE}::settle_session`,
    arguments: [
      tx.object(sessionObjectId),
      tx.pure.vector("u8", deckCardIds),
      tx.pure.vector("u8", hexToBytes(saltHex)),
      tx.pure.bool(won),
    ],
  })
  return tx
}

export function buildCreateBigTwoRoomWithStake(
  deckCommitmentHex: string,
  stakeMist: bigint = DEFAULT_STAKE_MIST,
): Transaction {
  const tx = new Transaction()
  const [stakeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(stakeMist)])
  tx.moveCall({
    target: `${SUI_BIGTWO_PACKAGE_ID}::${SUI_BIGTWO_MODULE}::create_room_with_stake`,
    arguments: [tx.pure.vector("u8", hexToBytes(deckCommitmentHex)), stakeCoin],
  })
  return tx
}

export function buildJoinBigTwoRoomWithStake(
  roomObjectId: string,
  stakeMist: bigint = DEFAULT_STAKE_MIST,
): Transaction {
  const tx = new Transaction()
  const [stakeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(stakeMist)])
  tx.moveCall({
    target: `${SUI_BIGTWO_PACKAGE_ID}::${SUI_BIGTWO_MODULE}::join_room_with_stake`,
    arguments: [tx.object(roomObjectId), stakeCoin],
  })
  return tx
}

export function buildRevealBigTwoDeck(roomObjectId: string, deckCardIds: number[], saltHex: string): Transaction {
  const tx = new Transaction()
  tx.moveCall({
    target: `${SUI_BIGTWO_PACKAGE_ID}::${SUI_BIGTWO_MODULE}::reveal_deck`,
    arguments: [tx.object(roomObjectId), tx.pure.vector("u8", deckCardIds), tx.pure.vector("u8", hexToBytes(saltHex))],
  })
  return tx
}

export function buildClaimBigTwoPot(roomObjectId: string): Transaction {
  const tx = new Transaction()
  tx.moveCall({
    target: `${SUI_BIGTWO_PACKAGE_ID}::${SUI_BIGTWO_MODULE}::claim_pot`,
    arguments: [tx.object(roomObjectId)],
  })
  return tx
}

export function findCreatedSessionId(
  createdObjects: { objectId: string; objectType?: string }[] | undefined,
): string | null {
  if (!createdObjects) return null
  const match = createdObjects.find((o) => o.objectType?.includes("::stake_session::StakeSession"))
  return match?.objectId ?? createdObjects[0]?.objectId ?? null
}
