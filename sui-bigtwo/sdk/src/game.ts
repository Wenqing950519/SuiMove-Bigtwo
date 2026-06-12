import { Transaction } from "@mysten/sui/transactions";
import type { Card } from "./types.js";

export interface PackageConfig {
  packageId: string;
  moduleName?: string;
}

const DEFAULT_MODULE = "big_two";

export function createRoomTx(config: PackageConfig, deckCommitment: number[]): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.packageId}::${config.moduleName ?? DEFAULT_MODULE}::create_room`,
    arguments: [tx.pure.vector("u8", deckCommitment)],
  });
  return tx;
}

export function createRoomWithStakeTx(
  config: PackageConfig,
  deckCommitment: number[],
  stakeMist: bigint | number | string,
): Transaction {
  const tx = new Transaction();
  const [stakeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(stakeMist)]);
  tx.moveCall({
    target: `${config.packageId}::${config.moduleName ?? DEFAULT_MODULE}::create_room_with_stake`,
    arguments: [tx.pure.vector("u8", deckCommitment), stakeCoin],
  });
  return tx;
}

export function joinRoomTx(config: PackageConfig, roomId: string): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.packageId}::${config.moduleName ?? DEFAULT_MODULE}::join_room`,
    arguments: [tx.object(roomId)],
  });
  return tx;
}

export function joinRoomWithStakeTx(
  config: PackageConfig,
  roomId: string,
  stakeMist: bigint | number | string,
): Transaction {
  const tx = new Transaction();
  const [stakeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(stakeMist)]);
  tx.moveCall({
    target: `${config.packageId}::${config.moduleName ?? DEFAULT_MODULE}::join_room_with_stake`,
    arguments: [tx.object(roomId), stakeCoin],
  });
  return tx;
}

export function dealCardsTx(
  config: PackageConfig,
  roomId: string,
  hands: readonly [Card[], Card[], Card[], Card[]],
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.packageId}::${config.moduleName ?? DEFAULT_MODULE}::deal_cards`,
    arguments: [
      tx.object(roomId),
      tx.pure.vector("u8", hands[0]),
      tx.pure.vector("u8", hands[1]),
      tx.pure.vector("u8", hands[2]),
      tx.pure.vector("u8", hands[3]),
    ],
  });
  return tx;
}

export function playCardsTx(config: PackageConfig, roomId: string, cards: readonly Card[]): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.packageId}::${config.moduleName ?? DEFAULT_MODULE}::play_cards`,
    arguments: [tx.object(roomId), tx.pure.vector("u8", [...cards])],
  });
  return tx;
}

export function passTurnTx(config: PackageConfig, roomId: string): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.packageId}::${config.moduleName ?? DEFAULT_MODULE}::pass_turn`,
    arguments: [tx.object(roomId)],
  });
  return tx;
}

export function revealDeckTx(
  config: PackageConfig,
  roomId: string,
  deck: readonly Card[],
  salt: Uint8Array,
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.packageId}::${config.moduleName ?? DEFAULT_MODULE}::reveal_deck`,
    arguments: [
      tx.object(roomId),
      tx.pure.vector("u8", [...deck]),
      tx.pure.vector("u8", [...salt]),
    ],
  });
  return tx;
}

export function claimPotTx(config: PackageConfig, roomId: string): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.packageId}::${config.moduleName ?? DEFAULT_MODULE}::claim_pot`,
    arguments: [tx.object(roomId)],
  });
  return tx;
}