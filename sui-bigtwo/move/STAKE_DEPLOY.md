# 發佈 stake_session 模組（Phase 5 · 可驗證下注場次）

新增的 `sources/stake_session.move` 讓單人 AI 局也能真的在鏈上：
質押 1 SUI → 記錄牌堆承諾 → 牌局結束揭示 → 合約驗證沒被竄改 → 退回質押。

合約改了就要**重新發佈**才會生效。以下只有你能在本機跑（需要 sui CLI + 有 gas 的 testnet 地址）。

## 前置確認

```bash
sui --version              # 沒有就先安裝 sui CLI
sui client active-env      # 應該是 testnet，否則：sui client switch --env testnet
sui client active-address  # 確認是有測試幣的地址
sui client gas             # 確認有幾顆 SUI 可付 gas
```

## 1. 先確認能編譯

```bash
cd C:\Users\eason\Documents\SuiMove\sui-bigtwo\move
sui move build
```

看到 `BUILD SUCCESSFUL` 才往下。若報錯把訊息貼給我。

## 2. 發佈（擇一）

**作法 A — 全新發佈（最簡單，推薦）**

```bash
sui client publish --gas-budget 300000000
```

**作法 B — 升級既有套件（保留 lineage，需要 UpgradeCap）**

```bash
sui client upgrade --upgrade-capability 0xc3c4e97be0907d5c9976a53f9e6d5f7b3ecbacbe2cb1a95d9c804e0193e928c8 --gas-budget 300000000
```

## 3. 記下新的 Package ID

發佈成功後，輸出裡找 **Published Objects** 區塊的 `PackageID: 0x...`
（升級則找 upgrade 後的新 package id）。複製那串 `0x...`。

## 4. 把新 Package ID 給我

把那個 `0x...` 貼回對話，我會：
- 更新 `frontend/lib/sui-config.ts` 的 `SUI_BIGTWO_PACKAGE_ID`
- 接上前端的「下注 1 SUI 開局」與「揭示並領回」交易，把驗證面板改讀鏈上真實資料

> 小提醒：`open_session` 一次質押固定金額（前端會用 1 SUI = 1,000,000,000 MIST）。
> 賭注在「揭示驗證通過」後退回你自己——單人 demo 把賭注當成「誠實保證金」，
> 證明牌局沒被竄改就拿回。真正能贏走對手籌碼的是之後的「四人全鏈對戰」模式。
