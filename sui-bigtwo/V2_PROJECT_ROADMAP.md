# Sui Big Two V2 Project Roadmap

> 目標：保留現有期末 demo 作為可驗證概念展示，另以 `/v2` 推進成作品集級的多人遊玩版本。V2 的核心不是單純把大老二做成網頁遊戲，而是讓房間、下注、發牌、出牌與揭示驗證都形成可被玩家理解的公開檢查流程。

---

## 0. 進度更新（2026-06-20）

- V2 UI 全面改版為精緻淺色風格（登入 / Lobby / 四人牌桌），手牌可互動、張數即時同步。
- Phase 2 後端骨架已落地：Prisma schema（6 表）、`lib/prisma.ts`、四碼房號工具，以及 `GET/POST /api/rooms`、`GET /api/rooms/[code]`、`POST /api/rooms/[code]/join` 四支 API。
- Lobby 已接 `/api/rooms`，後端未連線時自動退回離線示範資料。
- 待人工：安裝相依套件、設定 `DATABASE_URL`、`prisma migrate` 與 `db:seed`（見 `frontend/BACKEND_SETUP.md`）。

---

## 1. 目前狀態

### 已完成

- 舊版 demo 已可展示：
  - Sui Move testnet 上鏈建立房間。
  - 下注池與勝利領取流程的 demo 概念。
  - 竄改發牌與揭示驗證的可視化說明。
  - 中文 docs 頁面。
  - GitHub Pages / 自訂網域部署基礎。

- V2 前端雛型已建立：
  - `/v2` 路由。
  - 第一畫面：Logo、簡介、連接 Sui Wallet。
  - 第二畫面：房間列表、四碼英文字母房號、搜尋/加入/建立房間。
  - 第三畫面：四人牌桌，玩家只看到自己的手牌，其他三家以蓋牌數量表示剩餘牌數。
  - 右側驗證按鈕預設收合，點擊後展開「為何不能暗箱」檢查面板。
  - UI 已轉為亮色卡牌風格：淺灰白底、薄荷綠、亮黃、白色圓角牌面。

### 目前仍是前端雛型

- 房間資料是靜態 mock data。
- 錢包連接按鈕尚未接真實 Sui Wallet 流程。
- 多人同步尚未實作。
- 後端資料庫尚未建立。
- V2 尚未接真實鏈上 GameRoom 事件。

---

## 2. 產品定位

### 專案一句話

Sui Big Two 是一個基於 Sui Move 的可驗證大老二多人遊戲，玩家可以在一般遊戲 UI 中遊玩，同時透過公開檢查面板確認發牌與出牌紀錄沒有被後台暗箱修改。

### 核心特色

- 四人制大老二。
- 玩家只能看到自己的手牌。
- 每桌固定底注 1 testnet SUI。
- 房間代碼為四位英文字母，例如 `KQAZ`。
- 錢包登入與地址綁定。
- 玩家需要至少 1 testnet SUI 才能加入。
- 右側驗證面板用簡單語言說明：
  - 開局先記下牌堆指紋。
  - 發牌後只公開手牌指紋，不公開他人手牌。
  - 出牌紀錄可重放。
  - 結束揭示後重新計算，確認沒有改牌。

### 目標展示效果

- 一般玩家：看到的是一個清楚、可玩的多人牌桌。
- 教授/面試官/作品集讀者：看到的是 Web3 帶來的公開驗證能力。
- 技術審查者：可以看到規則、事件、commit-reveal 與鏈上資料的對應關係。

---

## 3. 使用者流程

### 3.1 登入頁

- 顯示遊戲 Logo 與短介紹。
- 主要操作只有一個：連接 Sui Wallet。
- 連接後檢查：
  - wallet address。
  - testnet balance >= 1 SUI。
  - 是否為白名單後台地址。

### 3.2 Lobby 房間列表

一般玩家只能看到：

- 建立房間。
- 加入房間。
- 搜尋房間代碼。
- 可加入房間列表。

房間資訊：

- `roomCode`：四位英文字母。
- `stake`：固定 1 SUI。
- `players`：目前人數 / 4。
- `status`：等待中、即將開始、遊戲中、已結束。

白名單管理者額外可以看到：

- 後台入口。
- 所有房間狀態。
- 玩家地址列表。
- 鏈上交易狀態。
- 異常驗證狀態。

### 3.3 遊戲桌

畫面布局：

- 上、左、右、下四位玩家圍繞中間出牌區。
- 自己在下方，顯示完整手牌。
- 其他三家只顯示蓋牌圖樣，蓋牌數量等於剩餘牌數。
- 中間顯示上一手牌。
- 操作按鈕：提示、PASS、出牌。
- 右側浮動「驗證」按鈕，預設收合。

### 3.4 驗證面板

預設不干擾遊戲，只顯示一個「驗證」按鈕。

展開後顯示：

- 目前檢查通過 / 失敗。
- 牌堆指紋。
- 我的手牌指紋。
- 出牌紀錄數量。
- 鏈上房間 ID。
- 簡化檢查邏輯。

文案原則：

- 不寫「for 技術玩家」。
- 不使用過度技術化詞彙當主標。
- 主軸是「為何不能暗箱」。

---

## 4. 前端規劃

### 4.1 路由

目前：

- `/`：舊版 demo。
- `/docs`：中文文件。
- `/v2`：多人遊玩雛型。

後續可以拆成：

- `/v2`：登入與 lobby。
- `/v2/rooms/[roomCode]`：單一房間牌桌。
- `/v2/admin`：白名單後台。

### 4.2 UI 方向

參考風格：

- 淺灰白背景。
- 白色大圓角卡片。
- 薄荷綠作為主色。
- 亮黃作為操作重點。
- 深灰線條與文字。
- 卡牌有現代桌遊感，不走傳統賭場暗色系。

### 4.3 前端狀態

短期可以先用 client state 模擬：

- currentUser。
- walletAddress。
- roomList。
- currentRoom。
- players。
- hands。
- lastPlay。
- verificationStatus。

接後端後改為：

- SWR / TanStack Query 拉取房間資料。
- WebSocket 訂閱房間狀態。
- Sui event subscription 同步鏈上事件。

---

## 5. 後端與資料庫規劃

### 5.1 建議技術選型

若追求最快落地：

- Next.js API Routes。
- PostgreSQL。
- Prisma ORM。
- WebSocket / Socket.IO。

若部署簡化：

- Supabase PostgreSQL。
- Supabase Realtime。
- Next.js 前端。

### 5.2 資料表草案

#### users

```sql
id uuid primary key
wallet_address text unique not null
nickname text
is_admin boolean default false
created_at timestamp
updated_at timestamp
```

#### rooms

```sql
id uuid primary key
room_code text unique not null
status text not null
stake_amount bigint not null
chain_room_id text
created_by uuid references users(id)
created_at timestamp
updated_at timestamp
```

#### room_players

```sql
id uuid primary key
room_id uuid references rooms(id)
user_id uuid references users(id)
seat_index int not null
wallet_address text not null
stake_tx_digest text
joined_at timestamp
unique(room_id, seat_index)
unique(room_id, user_id)
```

#### game_states

```sql
id uuid primary key
room_id uuid references rooms(id)
current_turn int
last_play jsonb
hands_commitment jsonb
remaining_counts jsonb
status text
updated_at timestamp
```

#### game_events

```sql
id uuid primary key
room_id uuid references rooms(id)
event_index int not null
kind text not null
player_seat int
payload jsonb
chain_tx_digest text
created_at timestamp
unique(room_id, event_index)
```

#### verification_snapshots

```sql
id uuid primary key
room_id uuid references rooms(id)
deck_commitment text
revealed_deck_hash text
replay_status text
errors jsonb
created_at timestamp
```

---

## 6. 錢包與登入規劃

### 6.1 登入方式

- 使用 Sui Wallet connect。
- 前端取得 address。
- 後端產生 nonce。
- 使用者簽署登入訊息。
- 後端驗證簽章。
- 建立 session。

### 6.2 加入遊戲限制

- 檢查錢包 testnet balance >= 1 SUI。
- 建立房間或加入房間時鎖定 1 SUI 底注。
- 玩家同一時間限制：
  - 一個 wallet 只能在一個未結束房間中。
  - 一個 wallet 不可佔多個座位。

---

## 7. 鏈上與可驗證機制

### 7.1 短期 MVP

- 後端負責多人同步。
- Sui Move 負責：
  - 建立 GameRoom。
  - 存 deck commitment。
  - 存玩家加入與下注。
  - 存出牌事件摘要。
  - 結束後揭示 deck，驗證 commitment。

### 7.2 可驗證重點

要避免舊版審計中提到的問題，V2 必須做到：

- 承諾的 deck 必須與實際發出的 hands 綁定。
- reveal 時要驗證：
  - `sha3(deck || salt) == deck_commitment`。
  - `dealHands(deck)` 對應實際手牌 commitment。
  - game events replay 後與最終狀態一致。

### 7.3 前端驗證面板

前端顯示不要過度技術化，但資料要真實：

- Deck commitment。
- Hand commitment。
- GameRoom object id。
- Event count。
- Replay result。
- Reveal result。

玩家點開後看到：

- 綠色：目前紀錄一致。
- 黃色：等待揭示。
- 紅色：發現不一致。

---

## 8. 安全與防火牆規劃

### 8.1 Web 安全

- API rate limit。
- Room create / join rate limit。
- Wallet address allow/block list。
- CORS 限制正式網域。
- Zod 驗證所有 API input。
- 不信任 client 傳來的手牌與遊戲狀態。

### 8.2 遊戲防作弊

- 後端不回傳其他玩家手牌。
- 只回傳其他玩家剩餘張數。
- 出牌前後都在後端驗證規則。
- 鏈上事件與後端事件要能交叉檢查。
- 玩家斷線要有 timeout / auto pass 規則。

### 8.3 管理後台

白名單地址才能進入：

- 房間列表。
- 玩家地址。
- 異常驗證紀錄。
- 鏈上 tx digest。
- 強制關閉測試房間。

---

## 9. 開發里程碑

### Phase 0：保留現有 demo

目標：不破壞舊版 demo。

- 舊版 `/` 保留。
- `/docs` 保留。
- `/v2` 獨立開發。

### Phase 1：V2 前端定稿

目標：完成作品集級 UI。

- 登入頁視覺定稿。
- Lobby 視覺定稿。
- 四人牌桌視覺定稿。
- 驗證面板文案定稿。
- 響應式檢查。

### Phase 2：後端與資料庫

目標：真實房間資料。

- 建立 users / rooms / room_players / game_events。
- 建立 API：
  - create room。
  - join room。
  - get room list。
  - get room detail。
- 建立四碼房號生成與碰撞檢查。

### Phase 3：錢包登入

目標：wallet address 變成真實身份。

- Sui Wallet connect。
- nonce sign-in。
- session。
- balance check。
- admin whitelist。

### Phase 4：多人同步

目標：四位玩家可以同房間互動。

- 房間等待狀態。
- 四人坐滿後開始。
- 發牌只傳自己的手牌。
- WebSocket / realtime sync。
- 出牌 / PASS 同步。

### Phase 5：鏈上驗證接入

目標：把 Web3 特色做實。

- create GameRoom on-chain。
- stake 1 SUI。
- emit game events。
- reveal and verify。
- 前端驗證面板接真實資料。

### Phase 6：作品集包裝

目標：讓外部讀者看得懂價值。

- README 更新。
- Architecture doc 更新。
- Demo video / GIF。
- `/docs` 補 V2 架構。
- GitHub repo 整理。

---

## 10. 優先順序

### 最高優先

1. V2 UI 完成定稿。
2. 後端 room / user / player schema。
3. 錢包登入與餘額檢查。
4. 房間建立與加入流程。
5. 多人房間同步。

### 第二優先

1. 鏈上 GameRoom 重新設計。
2. stake / claim pot。
3. event replay verifier。
4. reveal verification。

### 第三優先

1. 管理後台。
2. 防火牆與 rate limit。
3. 玩家斷線處理。
4. 更完整的規則與測試。

---

## 11. 近期下一步

建議下一次開發直接做以下三件：

1. 把 `/v2` 的 UI 做最後視覺檢查與手機版修正。
2. 建立後端資料模型文件與 Prisma schema。
3. 實作 wallet 登入前的 mock backend flow，先讓建立房間與加入房間從靜態資料變成 API 資料。

---

## 12. 目前部署與版本注意事項

- 正式展示網域：`https://bigtwo.tungowo.com/`
- V2 雛型：`/v2`
- 目前 V2 還不應宣稱已完成多人遊玩。
- 對外說法應是：
  - 舊版 demo 展示可驗證鏈上概念。
  - V2 正在推進為多人遊玩產品版本。
  - 下一步會接資料庫、錢包登入與真實鏈上事件。
