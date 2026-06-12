# v0 / Vercel AI UI Prompt

Use this prompt after the Move and SDK data shapes are stable.

```text
Build a polished React + TypeScript UI for a Web3 Big Two card game on Sui.

This is not a landing page. The first screen must be the playable table.

Visual direction:
- A premium card-table interface with clear player seats, hand cards, current
  trick, and action controls.
- The app should feel like a serious Web3 game dashboard, not a marketing page.
- Avoid decorative gradient blobs and oversized hero sections.
- Use a restrained palette with green table felt, ivory cards, red/black suits,
  and neutral panels.

Required views:
1. Game Table
   - Four seats around the table.
   - Current turn indicator.
   - Player hand at the bottom.
   - Center trick area showing last play.
   - Buttons for Play, Pass, Sort, Verify.
   - Selected cards must be visibly raised.

2. Verification Panel
   - Deck commitment hash.
   - Recomputed reveal hash.
   - Deal matches revealed deck status.
   - Pass/fail status.
   - Revealed deck preview.
   - Explanation labels only, no long tutorial text.

3. History Explorer
   - Chronological events: room created, players joined, deal, plays, passes,
     game end, reveal.
   - Each event has timestamp/tx digest placeholder, event type, player, and
     compact payload.
   - Expandable event details.

4. Dev Demo Controls
   - Create room.
   - Join as simulated players.
   - Deal demo deck.
   - Auto-play sample sequence.
   - Reveal and verify.

Use lucide-react icons for buttons. Use cards only for repeated event rows and
compact panels. Do not put cards inside cards. Make the UI responsive for
desktop and mobile.
```

