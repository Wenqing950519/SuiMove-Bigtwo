# V2 後端啟用步驟（Phase 2：房間資料庫）

程式碼已全部建好（Prisma schema、DB client、4 支房間 API、Lobby 已接 API）。
以下是**只能由你在本機 / 你的資料庫上執行**的步驟。做完 Lobby 就會從真實資料庫讀寫房間；
在做完之前，Lobby 會自動以「離線示範資料」運作，不會壞掉。

## 已自動完成
- `prisma/schema.prisma`：users / rooms / room_players / game_states / game_events / verification_snapshots
- `lib/prisma.ts`：Prisma client 單例
- `lib/room.ts`、`lib/api.ts`：四碼房號產生+碰撞檢查、回應/驗證工具
- API：
  - `GET  /api/rooms`：可加入房間列表
  - `POST /api/rooms`：建立房間（建立者入座 0 號）
  - `GET  /api/rooms/[code]`：房間詳情
  - `POST /api/rooms/[code]/join`：加入房間（補空位，坐滿轉「即將開始」）
- `app/v2/page.tsx` Lobby 已改為呼叫上述 API，失敗自動退回離線資料
- `prisma/seed.ts`：3 個示範房間
- `package.json`：加入 `@prisma/client`、`prisma`、`tsx` 與 `db:*` 指令

## 你要做的（人工步驟）

### 1. 安裝相依套件
```bash
cd frontend
npm install
```
（`postinstall` 會自動跑 `prisma generate`。）

### 2. 準備一個 PostgreSQL 資料庫，二選一
- **本機 Postgres**：自行安裝後建立資料庫 `bigtwo`。
- **Supabase（免安裝，推薦）**：開一個免費專案，到 Settings → Database 複製 connection string。

### 3. 設定環境變數
```bash
cp .env.example .env
# 編輯 .env，把 DATABASE_URL 換成你的連線字串
```

### 4. 建表 + 灌入示範資料
```bash
npm run db:migrate   # 第一次會要你輸入 migration 名稱，例如 init
npm run db:seed      # 建立 3 個示範房間
```

### 5. 啟動
```bash
npm run dev
```
打開 `/v2` → 連接 → Lobby。此時標題下會顯示「已連線後端資料庫」，
建立 / 加入房間都會實際寫入資料庫。`npm run db:studio` 可開視覺化檢視資料。

## 備註
- 目前以「開發用臨時錢包位址」代替登入（存在 localStorage）。Phase 3 接上 Sui Wallet 後即可替換 `getDevWallet()`。
- 「一個 wallet 同時只能在一個未結束房間」規則已在 API 強制。
- 牌桌的多人同步、鏈上事件仍是 Phase 4 / Phase 5，尚未接。
