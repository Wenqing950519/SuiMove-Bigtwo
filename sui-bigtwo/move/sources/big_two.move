module big_two::big_two;

use std::hash;
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::event;
use sui::sui::SUI;

const STATUS_WAITING: u8 = 0;
const STATUS_PLAYING: u8 = 1;
const STATUS_ENDED: u8 = 2;

const COMBO_NONE: u8 = 0;
const COMBO_SINGLE: u8 = 1;
const COMBO_PAIR: u8 = 2;
const COMBO_TRIPLE: u8 = 3;
const COMBO_STRAIGHT: u8 = 4;
const COMBO_FLUSH: u8 = 5;
const COMBO_FULL_HOUSE: u8 = 6;
const COMBO_FOUR_KIND: u8 = 7;
const COMBO_STRAIGHT_FLUSH: u8 = 8;

const PLAYER_COUNT: u64 = 4;
const HAND_SIZE: u64 = 13;
const DECK_SIZE: u8 = 52;
const THREE_CLUBS: u8 = 0;

const E_BAD_STATUS: u64 = 1;
const E_ROOM_FULL: u64 = 2;
const E_ALREADY_JOINED: u64 = 3;
const E_NOT_PLAYER: u64 = 4;
const E_NOT_DEALER: u64 = 5;
const E_NEED_FOUR_PLAYERS: u64 = 6;
const E_BAD_HAND: u64 = 7;
const E_BAD_CARD: u64 = 8;
const E_DUPLICATE_CARD: u64 = 9;
const E_NOT_YOUR_TURN: u64 = 10;
const E_ILLEGAL_PLAY: u64 = 11;
const E_CARD_NOT_IN_HAND: u64 = 12;
const E_WEAK_PLAY: u64 = 13;
const E_FIRST_PLAY: u64 = 14;
const E_CANNOT_PASS: u64 = 15;
const E_BAD_REVEAL: u64 = 16;
const E_ALREADY_REVEALED: u64 = 17;
const E_BAD_STAKE: u64 = 18;
const E_POT_CLAIMED: u64 = 19;
const E_NOT_WINNER: u64 = 20;

public struct GameRoom has key {
    id: UID,
    dealer: address,
    players: vector<address>,
    hands: vector<vector<u8>>,
    original_hands: vector<vector<u8>>,
    deck_commitment: vector<u8>,
    current_player: u8,
    last_play: vector<u8>,
    last_combo_type: u8,
    last_combo_rank: u8,
    last_player: u8,
    pass_count: u8,
    status: u8,
    winner: Option<address>,
    revealed_deck: vector<u8>,
    reveal_salt: vector<u8>,
    revealed: bool,
    first_turn: bool,
    stake_amount: u64,
    pot: Balance<SUI>,
    pot_claimed: bool,
}

public struct RoomCreated has copy, drop {
    room_id: ID,
    creator: address,
    deck_commitment: vector<u8>,
    stake_amount: u64,
    pot_value: u64,
}

public struct PlayerJoined has copy, drop {
    room_id: ID,
    player: address,
    seat: u8,
    stake_amount: u64,
    pot_value: u64,
}

public struct PotClaimed has copy, drop {
    room_id: ID,
    winner: address,
    amount: u64,
}

public struct CardsDealt has copy, drop {
    room_id: ID,
    starter: u8,
    hands: vector<vector<u8>>,
}

public struct CardsPlayed has copy, drop {
    room_id: ID,
    player: address,
    seat: u8,
    cards: vector<u8>,
    combo_type: u8,
    combo_rank: u8,
}

public struct TurnPassed has copy, drop {
    room_id: ID,
    player: address,
    seat: u8,
    pass_count: u8,
}

public struct GameEnded has copy, drop {
    room_id: ID,
    winner: address,
    seat: u8,
}

public struct DeckRevealed has copy, drop {
    room_id: ID,
    deck: vector<u8>,
    salt: vector<u8>,
    computed_commitment: vector<u8>,
}

entry fun create_room(deck_commitment: vector<u8>, ctx: &mut TxContext) {
    let creator = tx_context::sender(ctx);
    let mut players = vector::empty<address>();
    vector::push_back(&mut players, creator);

    let room = GameRoom {
        id: object::new(ctx),
        dealer: creator,
        players,
        hands: vector::empty<vector<u8>>(),
        original_hands: vector::empty<vector<u8>>(),
        deck_commitment: deck_commitment,
        current_player: 0,
        last_play: vector::empty<u8>(),
        last_combo_type: COMBO_NONE,
        last_combo_rank: 0,
        last_player: 0,
        pass_count: 0,
        status: STATUS_WAITING,
        winner: option::none<address>(),
        revealed_deck: vector::empty<u8>(),
        reveal_salt: vector::empty<u8>(),
        revealed: false,
        first_turn: true,
        stake_amount: 0,
        pot: balance::zero<SUI>(),
        pot_claimed: false,
    };

    event::emit(RoomCreated {
        room_id: object::id(&room),
        creator,
        deck_commitment: copy room.deck_commitment,
        stake_amount: 0,
        pot_value: 0,
    });

    transfer::share_object(room);
}

entry fun create_room_with_stake(deck_commitment: vector<u8>, stake: Coin<SUI>, ctx: &mut TxContext) {
    let creator = tx_context::sender(ctx);
    let stake_amount = coin::value(&stake);
    assert!(stake_amount > 0, E_BAD_STAKE);

    let mut players = vector::empty<address>();
    vector::push_back(&mut players, creator);

    let room = GameRoom {
        id: object::new(ctx),
        dealer: creator,
        players,
        hands: vector::empty<vector<u8>>(),
        original_hands: vector::empty<vector<u8>>(),
        deck_commitment: deck_commitment,
        current_player: 0,
        last_play: vector::empty<u8>(),
        last_combo_type: COMBO_NONE,
        last_combo_rank: 0,
        last_player: 0,
        pass_count: 0,
        status: STATUS_WAITING,
        winner: option::none<address>(),
        revealed_deck: vector::empty<u8>(),
        reveal_salt: vector::empty<u8>(),
        revealed: false,
        first_turn: true,
        stake_amount,
        pot: coin::into_balance(stake),
        pot_claimed: false,
    };

    event::emit(RoomCreated {
        room_id: object::id(&room),
        creator,
        deck_commitment: copy room.deck_commitment,
        stake_amount,
        pot_value: stake_amount,
    });

    transfer::share_object(room);
}

entry fun join_room(room: &mut GameRoom, ctx: &TxContext) {
    assert!(room.stake_amount == 0, E_BAD_STAKE);
    join_room_internal(room, 0, ctx);
}

entry fun join_room_with_stake(room: &mut GameRoom, stake: Coin<SUI>, ctx: &TxContext) {
    let stake_amount = coin::value(&stake);
    assert!(room.stake_amount > 0, E_BAD_STAKE);
    assert!(stake_amount == room.stake_amount, E_BAD_STAKE);
    balance::join(&mut room.pot, coin::into_balance(stake));
    join_room_internal(room, stake_amount, ctx);
}

entry fun deal_cards(
    room: &mut GameRoom,
    hand0: vector<u8>,
    hand1: vector<u8>,
    hand2: vector<u8>,
    hand3: vector<u8>,
    ctx: &TxContext,
) {
    assert!(room.status == STATUS_WAITING, E_BAD_STATUS);
    assert!(tx_context::sender(ctx) == room.dealer, E_NOT_DEALER);
    assert!(vector::length(&room.players) == PLAYER_COUNT, E_NEED_FOUR_PLAYERS);

    if (room.stake_amount > 0) {
        assert!(balance::value(&room.pot) == room.stake_amount * PLAYER_COUNT, E_BAD_STAKE);
    };

    validate_hands(&hand0, &hand1, &hand2, &hand3);

    let mut hands = vector::empty<vector<u8>>();
    vector::push_back(&mut hands, hand0);
    vector::push_back(&mut hands, hand1);
    vector::push_back(&mut hands, hand2);
    vector::push_back(&mut hands, hand3);

    let starter = find_card_holder(&hands, THREE_CLUBS);

    event::emit(CardsDealt {
        room_id: object::id(room),
        starter,
        hands: copy hands,
    });

    room.original_hands = copy hands;
    room.hands = hands;
    room.current_player = starter;
    room.status = STATUS_PLAYING;
}

entry fun play_cards(room: &mut GameRoom, cards: vector<u8>, ctx: &TxContext) {
    assert!(room.status == STATUS_PLAYING, E_BAD_STATUS);

    let player = tx_context::sender(ctx);
    let seat = player_index(room, player);
    assert!(seat == room.current_player, E_NOT_YOUR_TURN);

    let len = vector::length(&cards);
    let (combo_type, combo_rank) = analyze(&cards);
    assert!(combo_type != COMBO_NONE, E_ILLEGAL_PLAY);
    assert!(has_cards(vector::borrow(&room.hands, seat as u64), &cards), E_CARD_NOT_IN_HAND);

    if (room.first_turn) {
        assert!(contains_card(&cards, THREE_CLUBS), E_FIRST_PLAY);
    };

    if (vector::length(&room.last_play) > 0) {
        assert!(len == vector::length(&room.last_play), E_WEAK_PLAY);
        assert!(
            beats(combo_type, combo_rank, room.last_combo_type, room.last_combo_rank, len),
            E_WEAK_PLAY,
        );
    };

    let hand = vector::borrow_mut(&mut room.hands, seat as u64);
    remove_cards(hand, &cards);

    event::emit(CardsPlayed {
        room_id: object::id(room),
        player,
        seat,
        cards: copy cards,
        combo_type,
        combo_rank,
    });

    room.last_play = cards;
    room.last_combo_type = combo_type;
    room.last_combo_rank = combo_rank;
    room.last_player = seat;
    room.pass_count = 0;
    room.first_turn = false;

    if (vector::length(vector::borrow(&room.hands, seat as u64)) == 0) {
        room.status = STATUS_ENDED;
        room.winner = option::some<address>(player);
        event::emit(GameEnded {
            room_id: object::id(room),
            winner: player,
            seat,
        });
    } else {
        room.current_player = next_seat(seat);
    };
}

entry fun pass_turn(room: &mut GameRoom, ctx: &TxContext) {
    assert!(room.status == STATUS_PLAYING, E_BAD_STATUS);
    assert!(vector::length(&room.last_play) > 0, E_CANNOT_PASS);

    let player = tx_context::sender(ctx);
    let seat = player_index(room, player);
    assert!(seat == room.current_player, E_NOT_YOUR_TURN);

    room.pass_count = room.pass_count + 1;

    event::emit(TurnPassed {
        room_id: object::id(room),
        player,
        seat,
        pass_count: room.pass_count,
    });

    if (room.pass_count >= 3) {
        room.current_player = room.last_player;
        room.last_play = vector::empty<u8>();
        room.last_combo_type = COMBO_NONE;
        room.last_combo_rank = 0;
        room.pass_count = 0;
    } else {
        room.current_player = next_seat(seat);
    };
}

entry fun reveal_deck(
    room: &mut GameRoom,
    deck: vector<u8>,
    salt: vector<u8>,
    _ctx: &mut TxContext,
) {
    assert!(room.status == STATUS_ENDED, E_BAD_STATUS);
    assert!(!room.revealed, E_ALREADY_REVEALED);
    validate_deck(&deck);

    let mut bytes = copy deck;
    vector::append(&mut bytes, copy salt);
    let computed = hash::sha3_256(bytes);
    assert!(computed == room.deck_commitment, E_BAD_REVEAL);
    assert!(deck_matches_original_hands(&deck, &room.original_hands), E_BAD_REVEAL);

    event::emit(DeckRevealed {
        room_id: object::id(room),
        deck: copy deck,
        salt: copy salt,
        computed_commitment: copy computed,
    });

    room.revealed_deck = deck;
    room.reveal_salt = salt;
    room.revealed = true;
}

entry fun claim_pot(room: &mut GameRoom, ctx: &mut TxContext) {
    assert!(room.status == STATUS_ENDED, E_BAD_STATUS);
    assert!(!room.pot_claimed, E_POT_CLAIMED);

    let winner = tx_context::sender(ctx);
    assert!(option::is_some(&room.winner), E_BAD_STATUS);
    assert!(*option::borrow(&room.winner) == winner, E_NOT_WINNER);

    let amount = balance::value(&room.pot);
    assert!(amount > 0, E_BAD_STAKE);

    let payout = balance::split(&mut room.pot, amount);
    room.pot_claimed = true;

    event::emit(PotClaimed {
        room_id: object::id(room),
        winner,
        amount,
    });

    transfer::public_transfer(coin::from_balance(payout, ctx), winner);
}

fun join_room_internal(room: &mut GameRoom, stake_amount: u64, ctx: &TxContext) {
    assert!(room.status == STATUS_WAITING, E_BAD_STATUS);
    assert!(vector::length(&room.players) < PLAYER_COUNT, E_ROOM_FULL);

    let player = tx_context::sender(ctx);
    assert!(!has_player(room, player), E_ALREADY_JOINED);

    let seat = vector::length(&room.players) as u8;
    vector::push_back(&mut room.players, player);

    event::emit(PlayerJoined {
        room_id: object::id(room),
        player,
        seat,
        stake_amount,
        pot_value: balance::value(&room.pot),
    });
}

fun has_player(room: &GameRoom, player: address): bool {
    let mut i = 0;
    let n = vector::length(&room.players);
    while (i < n) {
        if (*vector::borrow(&room.players, i) == player) {
            return true
        };
        i = i + 1;
    };
    false
}

fun player_index(room: &GameRoom, player: address): u8 {
    let mut i = 0;
    let n = vector::length(&room.players);
    while (i < n) {
        if (*vector::borrow(&room.players, i) == player) {
            return i as u8
        };
        i = i + 1;
    };
    abort E_NOT_PLAYER
}

fun next_seat(seat: u8): u8 {
    (seat + 1) % 4
}

fun validate_hands(
    hand0: &vector<u8>,
    hand1: &vector<u8>,
    hand2: &vector<u8>,
    hand3: &vector<u8>,
) {
    assert!(vector::length(hand0) == HAND_SIZE, E_BAD_HAND);
    assert!(vector::length(hand1) == HAND_SIZE, E_BAD_HAND);
    assert!(vector::length(hand2) == HAND_SIZE, E_BAD_HAND);
    assert!(vector::length(hand3) == HAND_SIZE, E_BAD_HAND);

    let mut card = 0;
    while (card < DECK_SIZE) {
        let count =
            count_card(hand0, card) +
            count_card(hand1, card) +
            count_card(hand2, card) +
            count_card(hand3, card);
        assert!(count == 1, E_DUPLICATE_CARD);
        card = card + 1;
    };

    validate_hand_cards(hand0);
    validate_hand_cards(hand1);
    validate_hand_cards(hand2);
    validate_hand_cards(hand3);
}

fun validate_hand_cards(hand: &vector<u8>) {
    let mut i = 0;
    let n = vector::length(hand);
    while (i < n) {
        let card = *vector::borrow(hand, i);
        assert!(card < DECK_SIZE, E_BAD_CARD);
        i = i + 1;
    };
}

fun validate_deck(deck: &vector<u8>) {
    assert!(vector::length(deck) == 52, E_BAD_HAND);
    let mut card = 0;
    while (card < DECK_SIZE) {
        assert!(count_card(deck, card) == 1, E_DUPLICATE_CARD);
        card = card + 1;
    };
}

fun deck_matches_original_hands(deck: &vector<u8>, hands: &vector<vector<u8>>): bool {
    if (vector::length(hands) != PLAYER_COUNT) {
        return false
    };

    let mut seat = 0;
    while (seat < PLAYER_COUNT) {
        let hand = vector::borrow(hands, seat);
        if (vector::length(hand) != HAND_SIZE) {
            return false
        };

        let mut offset = 0;
        while (offset < HAND_SIZE) {
            let deck_index = seat * HAND_SIZE + offset;
            if (*vector::borrow(deck, deck_index) != *vector::borrow(hand, offset)) {
                return false
            };
            offset = offset + 1;
        };

        seat = seat + 1;
    };

    true
}

fun count_card(cards: &vector<u8>, target: u8): u8 {
    let mut i = 0;
    let mut count = 0;
    let n = vector::length(cards);
    while (i < n) {
        if (*vector::borrow(cards, i) == target) {
            count = count + 1;
        };
        i = i + 1;
    };
    count
}

fun find_card_holder(hands: &vector<vector<u8>>, card: u8): u8 {
    let mut i = 0;
    while (i < PLAYER_COUNT) {
        if (contains_card(vector::borrow(hands, i), card)) {
            return i as u8
        };
        i = i + 1;
    };
    abort E_BAD_HAND
}

fun contains_card(cards: &vector<u8>, target: u8): bool {
    count_card(cards, target) > 0
}

fun has_cards(hand: &vector<u8>, cards: &vector<u8>): bool {
    let mut i = 0;
    let n = vector::length(cards);
    while (i < n) {
        let card = *vector::borrow(cards, i);
        if (count_card(hand, card) < count_card(cards, card)) {
            return false
        };
        i = i + 1;
    };
    true
}

fun remove_cards(hand: &mut vector<u8>, cards: &vector<u8>) {
    let mut i = 0;
    let n = vector::length(cards);
    while (i < n) {
        let card = *vector::borrow(cards, i);
        let idx = index_of(hand, card);
        vector::remove(hand, idx);
        i = i + 1;
    };
}

fun index_of(cards: &vector<u8>, target: u8): u64 {
    let mut i = 0;
    let n = vector::length(cards);
    while (i < n) {
        if (*vector::borrow(cards, i) == target) {
            return i
        };
        i = i + 1;
    };
    abort E_CARD_NOT_IN_HAND
}

fun analyze(cards: &vector<u8>): (u8, u8) {
    if (!valid_play_cards(cards)) {
        return (COMBO_NONE, 0)
    };

    let len = vector::length(cards);

    if (len == 1) {
        return (COMBO_SINGLE, max_card_power(cards))
    };

    if (len == 2) {
        if (all_same_rank(cards)) {
            return (COMBO_PAIR, max_card_power(cards))
        };
        return (COMBO_NONE, 0)
    };

    if (len == 3) {
        if (all_same_rank(cards)) {
            return (COMBO_TRIPLE, max_card_power(cards))
        };
        return (COMBO_NONE, 0)
    };

    if (len == 4) {
        if (all_same_rank(cards)) {
            return (COMBO_FOUR_KIND, rank_with_count(cards, 4))
        };
        return (COMBO_NONE, 0)
    };

    if (len != 5) {
        return (COMBO_NONE, 0)
    };

    let flush = is_flush(cards);
    let straight = is_straight(cards);

    if (flush && straight) {
        return (COMBO_STRAIGHT_FLUSH, max_card_power(cards))
    };

    if (count_rank_groups(cards, 4) == 1) {
        return (COMBO_FOUR_KIND, rank_with_count(cards, 4))
    };

    if (count_rank_groups(cards, 3) == 1 && count_rank_groups(cards, 2) == 1) {
        return (COMBO_FULL_HOUSE, rank_with_count(cards, 3))
    };

    if (flush) {
        return (COMBO_FLUSH, max_card_power(cards))
    };

    if (straight) {
        return (COMBO_STRAIGHT, max_card_power(cards))
    };

    (COMBO_NONE, 0)
}

fun valid_play_cards(cards: &vector<u8>): bool {
    let len = vector::length(cards);
    if (!(len == 1 || len == 2 || len == 3 || len == 4 || len == 5)) {
        return false
    };

    let mut i = 0;
    while (i < len) {
        let card = *vector::borrow(cards, i);
        if (card >= DECK_SIZE || count_card(cards, card) > 1) {
            return false
        };
        i = i + 1;
    };
    true
}

fun beats(
    combo_type: u8,
    combo_rank: u8,
    last_combo_type: u8,
    last_combo_rank: u8,
    len: u64,
): bool {
    if (len == 5 && combo_type != last_combo_type) {
        return combo_type > last_combo_type
    };

    combo_type == last_combo_type && combo_rank > last_combo_rank
}

fun rank(card: u8): u8 {
    card / 4
}

fun suit(card: u8): u8 {
    card % 4
}

fun card_power(card: u8): u8 {
    rank(card) * 4 + suit(card)
}

fun max_card_power(cards: &vector<u8>): u8 {
    let mut i = 0;
    let n = vector::length(cards);
    let mut max = 0;
    while (i < n) {
        let power = card_power(*vector::borrow(cards, i));
        if (power > max) {
            max = power;
        };
        i = i + 1;
    };
    max
}

fun all_same_rank(cards: &vector<u8>): bool {
    let base = rank(*vector::borrow(cards, 0));
    let mut i = 1;
    let n = vector::length(cards);
    while (i < n) {
        if (rank(*vector::borrow(cards, i)) != base) {
            return false
        };
        i = i + 1;
    };
    true
}

fun is_flush(cards: &vector<u8>): bool {
    let base = suit(*vector::borrow(cards, 0));
    let mut i = 1;
    while (i < 5) {
        if (suit(*vector::borrow(cards, i)) != base) {
            return false
        };
        i = i + 1;
    };
    true
}

fun is_straight(cards: &vector<u8>): bool {
    let mut min_rank = 12;
    let mut max_rank = 0;
    let mut i = 0;
    while (i < 5) {
        let current = rank(*vector::borrow(cards, i));
        if (rank_count(cards, current) > 1) {
            return false
        };
        if (current < min_rank) {
            min_rank = current;
        };
        if (current > max_rank) {
            max_rank = current;
        };
        i = i + 1;
    };
    max_rank - min_rank == 4
}

fun rank_count(cards: &vector<u8>, target_rank: u8): u8 {
    let mut i = 0;
    let n = vector::length(cards);
    let mut count = 0;
    while (i < n) {
        if (rank(*vector::borrow(cards, i)) == target_rank) {
            count = count + 1;
        };
        i = i + 1;
    };
    count
}

fun count_rank_groups(cards: &vector<u8>, size: u8): u8 {
    let mut rank_value = 0;
    let mut groups = 0;
    while (rank_value < 13) {
        if (rank_count(cards, rank_value) == size) {
            groups = groups + 1;
        };
        rank_value = rank_value + 1;
    };
    groups
}

fun rank_with_count(cards: &vector<u8>, size: u8): u8 {
    let mut rank_value = 0;
    while (rank_value < 13) {
        if (rank_count(cards, rank_value) == size) {
            return rank_value
        };
        rank_value = rank_value + 1;
    };
    0
}
