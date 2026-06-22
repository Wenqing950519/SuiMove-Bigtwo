module big_two::stake_session;

use std::hash;
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::event;
use sui::sui::SUI;

const E_BAD_STAKE: u64 = 1;
const E_NOT_PLAYER: u64 = 2;
const E_BAD_REVEAL: u64 = 3;

/// 單人「可驗證下注場次」。
/// 玩家先把賭注鎖進來、並把牌堆承諾（sha3(deck||salt)）記上鏈；
/// 牌局結束後揭示 deck + salt，合約在鏈上重算雜湊驗證沒被竄改，通過才退回賭注。
/// 用於「你 vs AI」的單人 demo：下注、承諾、揭示、退款全部真的在鏈上發生。
public struct StakeSession has key {
    id: UID,
    player: address,
    deck_commitment: vector<u8>,
    stake_amount: u64,
    pot: Balance<SUI>,
}

public struct SessionOpened has copy, drop {
    session_id: ID,
    player: address,
    deck_commitment: vector<u8>,
    stake_amount: u64,
}

public struct SessionSettled has copy, drop {
    session_id: ID,
    player: address,
    won: bool,
    refunded: u64,
    computed_commitment: vector<u8>,
}

/// 開場：質押 SUI + 記錄牌堆承諾，產生一個屬於玩家的 StakeSession 物件。
entry fun open_session(deck_commitment: vector<u8>, stake: Coin<SUI>, ctx: &mut TxContext) {
    let amount = coin::value(&stake);
    assert!(amount > 0, E_BAD_STAKE);
    let player = tx_context::sender(ctx);

    let session = StakeSession {
        id: object::new(ctx),
        player,
        deck_commitment,
        stake_amount: amount,
        pot: coin::into_balance(stake),
    };

    event::emit(SessionOpened {
        session_id: object::id(&session),
        player,
        deck_commitment: copy session.deck_commitment,
        stake_amount: amount,
    });

    transfer::transfer(session, player);
}

/// 結算：揭示 deck + salt，鏈上重算 sha3 必須等於開場承諾，通過才退回賭注並銷毀場次。
entry fun settle_session(
    session: StakeSession,
    deck: vector<u8>,
    salt: vector<u8>,
    won: bool,
    ctx: &mut TxContext,
) {
    let StakeSession { id, player, deck_commitment, stake_amount: _, pot } = session;
    assert!(tx_context::sender(ctx) == player, E_NOT_PLAYER);

    let mut bytes = copy deck;
    vector::append(&mut bytes, copy salt);
    let computed = hash::sha3_256(bytes);
    assert!(computed == deck_commitment, E_BAD_REVEAL);

    let amount = balance::value(&pot);
    let session_id = object::uid_to_inner(&id);

    event::emit(SessionSettled {
        session_id,
        player,
        won,
        refunded: amount,
        computed_commitment: copy computed,
    });

    transfer::public_transfer(coin::from_balance(pot, ctx), player);
    object::delete(id);
}
