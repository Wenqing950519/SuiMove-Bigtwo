# Sui Big Two V2 產品需求文件與產品路徑規劃

**版本：** 1.0
**依據文件：** `V2_PRODUCT_SPEC.md`
**更新日期：** 2026-06-22
**目標讀者：** Product、Engineering、Design、作品集讀者、技術審查者
**文件定位：** V2 產品主文件，用於後續開發排期、作品集包裝與對外說明

---

## 1. 產品摘要

Sui Big Two V2 是一個以 Sui 為基礎的四人大老二產品版本。它不是單純把錢包接到一個 Web2 牌桌，而是要把「牌局是否被暗箱操作」這件事變成玩家與審查者都能理解、能查驗、能展示的產品能力。

一句話：

> Sui Big Two V2 是一張可以正常遊玩的大老二牌桌，同時讓發牌、出牌、揭示、下注與勝負結果留下可公開驗證的證據。

目前 V2 已具備相當好的原型基礎：`/v2` 登入、Lobby、Ready Room、四人牌桌、AI 對局、DB 房間 API、錢包 nonce 登入、Sui testnet 套件、solo stake session 與驗證面板都已經成形。

但目前它仍是「產品級原型」，還不是完整的四人真人可信多人遊戲。接下來的產品重點應該是：

1. 先把現有 V2 做成可公開展示、說法誠實的 demo。
2. 再把房間、發牌、出牌、同步改成真正多人可用。
3. 最後把 commit-reveal、event replay、stake escrow 與 winner claim 串成完整可信閉環。

---

## 2. 產品定位

### 2.1 核心定位

Sui Big Two V2 的產品定位應該是：

> 一個以公開驗證為核心差異化的大老二多人牌桌。

它的 Web3 價值不是「使用者用錢包登入」，而是：

- 開局前先鎖定 deck commitment。
- 玩家遊玩時只看到自己的手牌。
- 遊戲事件依序記錄，形成可重放的事件歷史。
- 結束後 reveal deck 與 salt，重新驗證發牌與勝負。
- stake / pot / claim 與可驗證勝者綁定。
- 前端用簡單語言告訴玩家「目前這局是否仍可被查驗」。

### 2.2 對外敘事

建議對外主敘事：

> 玩家看到的是一般大老二；審查者看到的是一套可驗證遊戲歷史。

這比「鏈上大老二」更精準，因為目前最佳產品路徑不是把每一步都放上鏈，而是把鏈用在最能創造信任的地方：身份、承諾、押注、揭示、索賠與公開證據。

### 2.3 產品不是什麼

V2 第一階段不應被定位為：

- 真錢博弈產品。
- Casino 風格遊戲。
- 完全去中心化遊戲協議。
- 零知識撲克協議。
- TEE 發牌系統。
- 每一步出牌都要上鏈的全鏈遊戲。

這些方向都可能是未來延伸，但不應進入 MVP，否則會讓作品集產品焦點變模糊。

---

## 3. 目標使用者

### 3.1 一般玩家

需求：

- 快速連接 Sui Wallet。
- 建立或加入房間。
- 看得懂目前有幾位玩家、誰已準備、輪到誰。
- 只看到自己的手牌。
- 可以順暢出牌、PASS、看上一手牌。
- 不需要理解 hash，也能知道這局是否正常。

成功時刻：

> 玩家完成一局，看到結果可以被驗證，而不是只能相信後台。

### 3.2 技術審查者

需求：

- 看懂 UI 行為、後端事件與 Sui 狀態如何對應。
- 看懂 deck commitment、hand commitment、event replay、reveal verification。
- 能點開 explorer 或 audit view 查交易與狀態。
- 能明確知道哪些地方目前仍信任 backend，哪些地方已可公開驗證。

成功時刻：

> 審查者能說出這個專案的 Web3 價值，而不只是「有接錢包」。

### 3.3 作品集讀者 / 面試官

需求：

- 快速理解產品主張。
- 看到真實可操作 demo。
- 看到清楚的技術架構與限制揭露。
- 看到後續 roadmap 有合理優先順序。

成功時刻：

> 讀者認為這是一個有產品判斷、有架構思考、有誠實風險揭露的 Web3 作品。

### 3.4 管理者 / Operator

需求：

- 白名單地址進入 admin view。
- 查看房間、玩家、tx digest、verification failure。
- 清理測試房間。
- 排查卡住的 game state。

成功時刻：

> 管理者可以排查問題，但不能無聲修改牌局真相。

---

## 4. 產品目標

### 4.1 V2 MVP 目標

V2 MVP 完成時，應該能證明：

- 四位真實玩家可以進入同一房間。
- 每位玩家只看到自己的手牌。
- 後端負責驗證發牌、出牌、PASS、勝負。
- 遊戲狀態能跨瀏覽器即時同步。
- 開局前產生 deck commitment。
- 每位玩家有自己的 hand commitment。
- 遊戲事件形成可檢查的 event chain。
- 結束後可 reveal 並 replay，驗證勝負。
- 至少 room / stake / reveal 其中一個核心節點與 Sui testnet 交易或 object 綁定。
- 產品可以部署到 Node host，而不是只依賴 GitHub Pages 靜態站。

### 4.2 作品集目標

作品集版本完成時，應該能做到：

- 有公開 demo URL。
- README 一分鐘內講清楚產品價值。
- docs 說明目前信任模型與未完成限制。
- demo video / GIF 展示完整流程。
- verification panel 顯示真實資料，不只是靜態文案。
- roadmap 清楚區分「現在能展示」與「下一步要補強」。

---

## 5. 非目標

以下不進入 V2 MVP：

- 主網部署。
- 真錢下注與法遵。
- 法幣支付。
- 全球排位賽。
- 原生手機 App。
- 零知識證明。
- TEE 發牌。
- 完全 P2P 房間發現。
- 所有出牌動作上鏈。
- 複雜 token 經濟。

---

## 6. 目前狀態與缺口

### 6.1 已具備能力

| 模組                 | 目前狀態                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------- |
| UI                 | `/v2` 有登入、Lobby、Ready Room、四人牌桌                                                          |
| Gameplay           | 已有完整 Big Two 規則，可與 3 個 AI bot 遊玩                                                         |
| Room API           | 房間列表、建立、加入已接 DB，並有 offline fallback                                                      |
| Auth               | Sui Wallet nonce sign-in、HMAC session cookie、balance read                                |
| On-chain           | testnet 已部署 `big_two` 與 `stake_session`                                                  |
| Solo verification  | `open_session` / `settle_session` 可做 stake bond + commit-reveal                          |
| Verification panel | 已有 local commit-reveal 與 on-chain session 狀態展示                                           |
| Data model         | Prisma schema 已有 users、rooms、room_players、game_states、game_events、verification_snapshots |

### 6.2 主要缺口

| 缺口                                    | 影響                                   |
| ------------------------------------- | ------------------------------------ |
| 還沒有真人多人同步                             | 多人遊戲主張尚未成立                           |
| gameplay 仍主要跑在 client-side            | 牌局真相尚未由 server 或 chain authoritative |
| on-chain `big_two` 目前明文保存四家手牌         | 與「只看自己手牌」的產品承諾衝突                     |
| solo stake 是 bond，不是贏錢 pot            | 不能宣稱玩家可從 AI 贏取 pot                   |
| Lobby 與實際遊戲耦合仍偏展示                     | 加入房間後仍會進入本地 AI 對局                    |
| V2 需要 server 部署                       | GitHub Pages 靜態部署不足                  |
| 安全、測試、admin、mobile、observability 還需補齊 | 不利於公開展示與長時間測試                        |

### 6.3 目前可對外說法

建議說法：

> 目前 V2 是具備錢包登入、房間流程、AI 對戰與 Sui testnet 驗證 session 的產品級原型。

不建議說法：

> 目前已是完全可信、四人真人、不可作弊的鏈上大老二。

真正能支撐「不能暗箱改牌」的完整條件是：

- 真人四人 authoritative gameplay。
- hidden-hand commitment model。
- ordered event chain。
- post-game reveal and replay。
- winner-bound pot claim。

---

## 7. MVP 範圍

### 7.1 必須包含

- Wallet nonce 登入。
- testnet SUI balance check。
- 建立房間 / 加入房間。
- 一個 wallet 同時只能在一個 active room。
- 四人 ready room。
- 即時 presence / ready sync。
- 後端 authoritative deal / play / pass / win。
- 玩家只收到自己的手牌。
- event hash chain。
- verification panel 接真實 room data。
- post-game reveal / replay。
- Sui testnet object 或 tx digest reference。
- admin whitelist。
- Node host 部署。

### 7.2 可以延後

- 4-way stake escrow。
- winner claim pot。
- audit JSON export。
- leaderboard。
- match history。
- 強 AI。
- 3 人變體。
- stake amount configuration。

### 7.3 明確排除

- 主網真錢。
- 複雜 matchmaking。
- token reward。
- full on-chain move validation。
- ZK hidden-card proof。

---

## 8. 使用者流程需求

### 8.1 登入

使用者故事：

> 作為玩家，我想連接 Sui Wallet 並快速進入 Lobby。

需求：

- 顯示單一清楚的連接錢包 CTA。
- 連接後由後端產生 nonce。
- 使用者簽署登入訊息。
- 後端驗證簽章並建立 session。
- 顯示縮短 wallet address。
- 檢查 testnet balance 是否達門檻。
- 不足 1 testnet SUI 時禁止建立與加入房間，並提示 faucet。

驗收標準：

- session 可在 refresh 後維持。
- API 不接受 client 傳入 wallet address 作為身份依據。
- 餘額不足者無法進入 active room。

### 8.2 Lobby

使用者故事：

> 作為玩家，我想建立或加入房間，而不需要理解鏈上 object。

需求：

- 顯示房間 code、玩家數、stake、狀態。
- 支援建立房間。
- 支援輸入 room code 加入。
- 防止同一 wallet 佔多個 active room。
- 清楚顯示 waiting / ready / playing / ended。

驗收標準：

- 建立房間會寫入 DB。
- 兩個瀏覽器可以看到同一份 room list。
- 加入房間會分配座位。
- active room 重複加入會被拒絕。

### 8.3 Ready Room

使用者故事：

> 作為玩家，我想知道誰已入座、誰已準備，以及什麼時候開始。

需求：

- 顯示四個 seat。
- 顯示空位、玩家 address、ready state。
- 全員 ready 才能開始。
- AI seat 如存在，必須清楚標示。

驗收標準：

- ready 狀態 2 秒內同步到其他玩家。
- refresh 後座位不丟失。
- seat state 不合法時不能開始。

### 8.4 牌桌

使用者故事：

> 作為玩家，我想像正常大老二一樣遊玩，並清楚知道輪到誰。

需求：

- 自己在下方，顯示完整手牌。
- 其他三家只顯示牌背與剩餘張數。
- 中央顯示上一手牌。
- 顯示目前 turn。
- 操作包含 hint、play、pass。
- 不合法操作前端可先 disabled，但後端仍必須再次驗證。
- 後端 rejection 要有清楚錯誤訊息。

驗收標準：

- 合法出牌同步到所有 client。
- 非法出牌被後端拒絕。
- opponent hands 不會在 active gameplay API 中回傳。
- 遊戲結束後正確記錄 winner。

### 8.5 驗證面板

使用者故事：

> 作為玩家，我想用簡單方式知道這局是否還能被驗證。

需求：

- 預設不干擾遊戲。
- 顯示 pass / waiting / fail。
- 顯示短 hash、event count、object id、tx digest。
- 可連到 Sui explorer。
- active game 期間不能暴露其他玩家手牌。

第一版應包含：

| 檢查   | 含義                                  |
| ---- | ----------------------------------- |
| 錢包資格 | 已完成 session 與 balance check         |
| 牌堆承諾 | 開局前已鎖定 deck commitment              |
| 我的手牌 | 我的手牌符合自己的 hand commitment           |
| 事件鏈  | 已接受動作形成連續 event chain               |
| 鏈上關聯 | room / session / tx 已連到 Sui testnet |
| 揭示狀態 | 遊戲結束後 reveal 是否通過                   |

驗收標準：

- panel 資料來自真實 room state。
- event order 破壞時顯示 fail。
- reveal mismatch 時顯示 fail。
- 完局後可進入詳細 audit view。

### 8.6 Post-game Audit

使用者故事：

> 作為技術審查者，我想重放一局遊戲並驗證勝負。

需求：

- 顯示 deck commitment。
- 顯示 revealed deck 與 salt。
- 顯示 hand commitments 與 revealed hands。
- 顯示 ordered game events。
- 顯示 replay winner 與 recorded winner。
- 顯示 pot claim target 與 claim status。

驗收標準：

- event replay 可得出 recorded winner。
- mismatch 會明確標紅。
- audit view 可作為作品集截圖或 demo video 素材。

---

## 9. 功能需求

### 9.1 Auth

- 後端產生 nonce。
- nonce 具備過期時間。
- nonce 使用後失效。
- 後端驗證簽章。
- session cookie 在 production 使用 secure flags。
- room/game API 一律從 session 取得 wallet。

### 9.2 Room

- 產生四碼英文字母房號。
- 檢查 room code 唯一。
- 儲存 creator。
- 儲存 status。
- 分配 seat index。
- 防止同一 wallet 重複入座。
- 防止 wallet 同時擁有多個 active room。
- 支援 stale room cleanup。

### 9.3 Game Engine

- 標準 52 張牌。
- 四人各 13 張。
- 驗證牌型。
- 驗證出牌者是否擁有該牌。
- 驗證是否可壓過上一手。
- 驗證 PASS 規則。
- 處理一輪 PASS 後重置。
- 偵測 winner。
- 每個 accepted action 寫入 event。

### 9.4 Backend State

- backend 是 live gameplay 的 authoritative source。
- frontend 只能做預驗證與展示。
- 儲存 current turn、last play、remaining counts、status、winner。
- 儲存 event chain。
- 儲存 verification snapshot。
- 支援 reconnect / resume。

### 9.5 Sui

MVP 最低要求：

- room 或 session 連到 Sui object / tx digest。
- 顯示 package id、module、explorer link。
- reveal 或 settle 有可查交易。

MVP+ 要求：

- 四人各 stake 1 testnet SUI。
- winner claim pot。
- claim target 與 verified winner 綁定。
- 顯示 claim tx digest。

### 9.6 Admin

- admin whitelist 儲存在 server-side。
- 非 admin 禁止進入 `/v2/admin`。
- 顯示 rooms、players、events、verification failures、tx digests。
- admin action 要留下 audit log。

---

## 10. 信任模型

### 10.1 分層責任

| 層        | 責任                                  | 信任程度            |
| -------- | ----------------------------------- | --------------- |
| Frontend | 展示、選牌、預驗證                           | 不可信             |
| Backend  | 多人同步、隱藏手牌派發、規則驗證、事件寫入               | MVP 階段需信任，但要可稽核 |
| Database | 房間、狀態、事件、snapshot 持久化               | 不作為最終真相         |
| Sui      | 身份、承諾、stake、reveal、public reference | 公開驗證層           |
| Verifier | 重算 commitment、重放事件                  | 獨立檢查層           |

### 10.2 Commit-Reveal 檢查

遊戲中：

- 開局鎖定 deck commitment。
- 每位玩家有 hand commitment。
- active game 只回傳自己的 hand。
- 每個 accepted action 依序寫 event。

遊戲後：

- reveal deck 與 salt。
- reveal hand salts。
- 重算 deck commitment。
- 重算 hand commitments。
- 重新 deal hands。
- replay events。
- 比對 replay winner 與 recorded winner。

檢查邏輯：

```text
sha3(deck || deck_salt) == deck_commitment
sha3(hand[i] || hand_salt[i]) == hand_commitment[i]
dealHands(deck) == hands
replay(events) == final_state
replay_winner == recorded_winner
claim_target == recorded_winner
```

### 10.3 Hidden-hand 決策

目前 deployed `big_two.deal_cards` 會把四家手牌明文寫到鏈上，這與「玩家只看到自己手牌」衝突。

建議路線：

1. MVP 先採用 backend-hidden hands：手牌存在 backend / DB，鏈上與 panel 保存 commitments。
2. 文件誠實標明：MVP 階段 backend 仍被信任於 live hidden-state delivery。
3. 後續合約重構為 per-hand commitment / selective reveal。

---

## 11. 安全與防作弊要求

### 11.1 Web 安全

- production 強制 `AUTH_SECRET`。
- secure cookie flags。
- auth / room / action API rate limit。
- 所有 input 用 Zod 或同等 schema 驗證。
- CORS 鎖正式網域。
- Supabase RLS / PostgREST exposure review。
- 避免在 log 中明文輸出完整手牌。

### 11.2 遊戲防作弊

- 不信任 client 傳來的 hand / state。
- 不在 reveal 前回傳 opponent hands。
- 所有 play/pass 都後端驗證。
- out-of-turn action 直接拒絕。
- duplicate action 直接拒絕。
- event index 與 previous event hash 必須連續。
- refresh / reconnect 必須恢復正確狀態。

### 11.3 Abuse Control

- 一個 wallet 同時只能在一個 active room。
- 建立房間 cooldown。
- 加入房間 cooldown。
- stale room cleanup。
- 早期 public demo 可加 allowlist。
- admin action audit log。

---

## 12. 成功指標

### 12.1 產品指標

| 指標                       | MVP 目標                   |
| ------------------------ | ------------------------ |
| Wallet login completion  | 連接錢包後 80%+ 完成 session    |
| Room create success      | 正常 API / DB 下 95%+ 成功    |
| Four-player completion   | 至少連續 3 局真人測試成功           |
| Illegal action rejection | 測試非法操作 100% 被拒絕          |
| Reconnect recovery       | refresh 後可回到 active room |
| Verification replay      | 完局後可 replay 並驗證 winner   |

### 12.2 作品集指標

| 指標                   | 目標                                 |
| -------------------- | ---------------------------------- |
| Demo clarity         | 2 分鐘內讓讀者理解 Web3 價值                 |
| Docs clarity         | README 清楚說明目前 trust model          |
| Audit visibility     | panel 顯示真實 commitment / event / tx |
| Deployment readiness | public URL 可直接操作 V2                |

### 12.3 工程指標

| 指標             | 目標                                  |
| -------------- | ----------------------------------- |
| Engine tests   | 覆蓋牌型、比較、PASS、winner                 |
| API validation | 所有 write API 有 schema validation    |
| E2E happy path | 至少一條多人對局手動或自動測試流程                   |
| Observability  | failed verification / API error 可追蹤 |

---

## 13. 產品路線圖

整體路線應分成三段：

1. **把現有原型變成可公開展示的 demo。**
2. **把多人遊戲變成真的。**
3. **把可驗證性變成可防守的產品主張。**

---

## 14. Phase 0：保留與校準現有 Demo

目標：

- 保留舊版 `/` 與 `/docs`。
- `/v2` 繼續作為新產品線。
- 修正文案，避免過度宣稱。

交付物：

- README 補 V1 / V2 區分。
- docs 補「目前可驗證到哪裡」。
- 現有 demo flow 不被破壞。

驗收：

- 對外不宣稱已完成真人 trustless multiplayer。
- 可清楚說明 current demo、V2 prototype、future MVP 三層。

優先級：P0
預估：1-2 天

---

## 15. Phase 1：Ship-ready V2 Prototype

目標：

> 先把目前 V2 做成可公開展示、可誠實講清楚價值的作品集 demo。

工作項：

- V2 部署到 Vercel 或其他 Node host。
- 設定 `DATABASE_URL` / `AUTH_SECRET`。
- mobile table layout 修正。
- solo stake 文案改成「可返還的 integrity bond」。
- `open_session` / `settle_session` 加 explorer links。
- Lobby / table 加 loading、empty、error states。
- 補 API input validation 與 basic hardening。

交付物：

- public `/v2` URL。
- wallet sign-in。
- room create / join。
- AI gameplay。
- verification panel with real session data。
- mobile 可用。

驗收：

- 讀者可從 public URL 完成一局 demo。
- panel 能顯示真實 commitment / session / tx 資訊。
- 文案誠實說明目前是 AI / solo verification，不是四人真人終版。

優先級：P0
預估：1-2 週

---

## 16. Phase 2：真人多人基礎

目標：

> 房間、座位、ready、發牌、出牌與 PASS 都能跨 client 真實同步。

工作項：

- realtime room presence。
- ready state sync。
- game state persistence。
- backend authoritative deal。
- backend validate play/pass。
- per-player hand delivery。
- reconnect / resume。

交付物：

- realtime room channel。
- 四真人 seat。
- ready room。
- deal endpoint。
- play/pass endpoint。
- event persistence。
- reconnect support。

驗收：

- 四個瀏覽器可進入同一房間。
- 每個 session 只看到自己的手牌。
- 出牌 2 秒內同步到其他玩家。
- illegal action 被後端拒絕。
- refresh 後可回到正確遊戲狀態。

優先級：P0
預估：2-4 週
依賴：realtime 技術選型、session-auth socket/channel、穩定 DB schema

---

## 17. Phase 3：Live Verification Layer

目標：

> 讓 verification panel 不再只是展示，而是真正反映多人遊戲資料。

工作項：

- 開局產生 deck commitment。
- 每位玩家產生 hand commitment。
- 建立 event hash chain。
- 寫入 verification snapshots。
- panel 顯示 live verification status。
- 增加 audit route。
- 增加 failure states。

交付物：

- deck commitment service。
- hand commitment service。
- event hash chain。
- verification snapshot。
- `/v2/rooms/[code]/audit` 或同等 audit view。
- post-game replay function。

驗收：

- panel 顯示真實 deck commitment。
- panel 顯示自己的 hand commitment。
- panel 顯示 event count 與 event chain status。
- event 缺失或順序錯誤時顯示 failure。
- 完局後可 replay 得出 winner。

優先級：P0
預估：2-3 週
依賴：Phase 2 event model、game replay function

---

## 18. Phase 4：Sui Escrow 與 Winner Claim

目標：

> 把下注與勝者索賠綁到已驗證牌局結果。

工作項：

- 決定合約路線：
  - 重構 `big_two`，支援 hidden-hand-compatible commitments；或
  - 新增 escrow / settlement module，讓 off-chain play + on-chain settle。
- 建立 create room stake tx。
- 建立 join room stake tx。
- 追蹤 4-way pot。
- 建立 winner claim tx。
- 顯示 claim status。
- audit view 顯示 tx digest / object id。

交付物：

- 四人 1 testnet SUI stake flow。
- pot status。
- winner claim。
- explorer links。
- contract design doc。

驗收：

- 每位玩家 stake 1 testnet SUI。
- winner 可 claim pot。
- loser 不可 claim。
- claim target 等於 verified winner。
- verification fail 時 claim 被阻擋或標記。

優先級：P1，排在真人多人與 replay 之後
預估：2-4 週

---

## 19. Phase 5：Production Hardening

目標：

> 讓產品足以承受公開展示與延長測試。

工作項：

- API rate limiting。
- CORS lockdown。
- Supabase RLS review。
- `/v2/admin`。
- turn timeout / auto-pass。
- stale room cleanup。
- structured logging。
- error tracking。
- engine unit tests。
- happy-path e2e 或手動 QA script。

交付物：

- admin room/event inspector。
- rate-limit middleware。
- security checklist。
- test suite。
- observability setup。
- QA checklist。

驗收：

- 非 admin 不能進 admin route。
- idle player timeout 後遊戲可繼續。
- 核心規則有 unit tests。
- happy-path 對局可穩定重跑。
- verification failure 可被查到。

優先級：P1
預估：1-3 週

---

## 20. Phase 6：作品集包裝

目標：

> 把專案變成外部讀者看得懂、願意繼續看的作品。

工作項：

- README 改寫為產品導向。
- architecture doc 更新。
- trust model diagram。
- demo video / GIF。
- screenshots。
- public roadmap。
- known limitations。
- deployment notes。

交付物：

- portfolio-ready README。
- V2 architecture doc。
- trust model doc。
- demo media。
- public demo URL。

驗收：

- 不跑本地也能理解產品價值。
- 文件清楚區分 current demo、V2 MVP、future trustless path。
- demo video 展示 wallet、room、table、verification、audit。

優先級：P2
預估：3-5 天

---

## 21. 建議的下一批 10 張 Tickets

| 順序  | Ticket                                      | 優先級 | 預估  |
| ---:| ------------------------------------------- | --- | --- |
| 1   | 部署 V2 到 Vercel 或等效 Node host                | P0  | M   |
| 2   | solo stake 文案與 explorer links               | P0  | S   |
| 3   | 修正 mobile table layout                      | P0  | M   |
| 4   | 所有 write API 補 Zod validation               | P0  | S   |
| 5   | realtime room presence + ready sync         | P0  | L   |
| 6   | persist active game state + accepted events | P0  | M   |
| 7   | deal/play/pass authority 移到 backend         | P0  | L   |
| 8   | event hash chain                            | P0  | M   |
| 9   | post-game reveal + replay endpoint          | P0  | L   |
| 10  | 決定並文件化 Sui escrow contract path             | P1  | M   |

---

## 22. 風險表

| 風險                               | 影響  | 機率  | 緩解                                                     |
| -------------------------------- | ---:| ---:| ------------------------------------------------------ |
| plaintext on-chain hands 與產品承諾衝突 | 高   | 高   | MVP 用 backend-hidden commitments，後續合約重構                |
| multiplayer sync 複雜度高            | 高   | 中   | 先用 Supabase Realtime 或簡單 socket，避免一開始追求全鏈同步            |
| wallet / faucet 摩擦影響 demo        | 中   | 中   | 加清楚 testnet 指引與錯誤文案                                    |
| 鏈上交易延遲傷害遊戲節奏                     | 中   | 中   | play/pass 先 off-chain，chain 負責 commitment/stake/reveal |
| 對外過度宣稱 trustless                 | 高   | 中   | README、panel、docs 明確標記 current trust model             |
| GitHub Pages 無法承載 V2             | 高   | 高   | V2 改 Node host，舊站保留                                    |
| 測試不足導致規則 bug                     | 中   | 中   | multiplayer 前補 engine unit tests                       |
| 缺 admin 導致 demo 卡住難排查            | 中   | 中   | 早期做最小 admin inspector                                  |

---

## 23. 需要決策的問題

1. Realtime 要用 Supabase Realtime 還是 custom WebSocket？
2. V2 MVP 是否允許 mixed human + AI room？
3. stake 是否固定 1 testnet SUI 到作品集階段結束？
4. 下一版 Move 合約要重構 `big_two`，還是新增 escrow/settlement module？
5. post-game audit 在 reveal 前後各能暴露哪些資料？
6. 玩家斷線或棄局時 pot 如何處理？
7. public demo 是否先做 wallet allowlist，降低測試混亂？

---

## 24. 建議對外文案

### 24.1 短版

Sui Big Two 是一個可驗證的大老二多人遊戲。玩家像普通牌桌一樣遊玩，但牌堆承諾、手牌承諾、事件歷史、揭示結果與勝者索賠都可以被公開查驗。

### 24.2 目前 Demo 說法

目前 V2 原型已支援錢包登入、房間流程、AI 對戰與 Sui testnet 上的 verifiable stake session。它展示了產品方向；真人四人 authoritative multiplayer、完整 hidden-hand settlement 與 winner-bound pot claim 仍在 roadmap 中。

### 24.3 MVP 完成後說法

V2 MVP 支援四個真實 wallet 進入同一房間遊玩。每位玩家只看到自己的手牌，後端驗證每一步出牌，事件歷史形成可檢查鏈，完局後 reveal deck 並 replay 驗證勝負。

---

## 25. Definition of Done

### 25.1 V2 MVP Done

- 四位真實玩家可加入同一房間。
- 每位玩家只看到自己的手牌。
- 後端驗證 deal / play / pass / win。
- game events 依序持久化。
- verification panel 顯示 event chain。
- 開局前產生 deck / hand commitments。
- 完局後可 reveal / replay。
- verification failure 可視化。
- 至少一個 room / stake / reveal transaction 連到 Sui。
- session 安全可用。
- app 部署到 Node-capable host。

### 25.2 Portfolio Done

- public demo URL 可操作。
- README 一分鐘內講清楚產品 thesis。
- architecture docs 說明 frontend / backend / DB / Sui / verifier 分工。
- trust model 誠實標示目前信任邊界。
- demo video / GIF 展示完整流程。
- known limitations 明確且可信。

---

## 26. 最終建議

不要下一步就直接重寫合約。最穩的產品路徑是：

1. **先把現有 V2 原型公開部署並誠實包裝。**
2. **再把真人多人 state 做實。**
3. **接著補 live verification、event replay 與 audit view。**
4. **最後把 stake escrow 與 winner claim 綁到 verified result。**

這條路徑讓專案每個階段都能展示，同時逐步接近最終主張：一張正常可玩的牌桌，但後台不能無聲改牌。
