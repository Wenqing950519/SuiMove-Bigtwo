import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowLeft,
  Bot,
  Database,
  GitBranch,
  Globe2,
  Hash,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  TerminalSquare,
  WalletCards,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Sui Big Two V2 Docs｜多人可驗證 MVP",
  description: "Sui Big Two V2 的 MVP 文件，涵蓋多人房間、永久 AI 房、commit-reveal、event replay、Sui escrow 與部署路線。",
}

const sections = [
  ["overview", "MVP 定位"],
  ["rooms", "房間與 AI"],
  ["gameplay", "多人遊玩"],
  ["verification", "可信閉環"],
  ["chain", "上鏈路徑"],
  ["deploy", "上線部署"],
  ["limits", "限制與下一步"],
] as const

const checks = [
  ["錢包身份", "使用 Sui Wallet nonce 簽署建立 session；API 只信任 session wallet。"],
  ["後端發牌", "四人入座後由 server 產生 deck、salt、hands 與 commitments。"],
  ["隱藏手牌", "遊戲中 API 只回傳當前玩家自己的 hand；其他玩家只顯示剩餘張數。"],
  ["事件鏈", "每個 accepted action 都寫入 eventIndex、previousHash、eventHash。"],
  ["完局揭示", "winner 產生後公開 deck/salt、hand salts、original hands 與 events。"],
  ["Replay 驗證", "後端用 original hands 重放 events，確認 replay winner 等於 recorded winner。"],
] as const

const chainSteps = [
  ["Build Move", "在 move/ 執行 sui move build，確認合約可編譯。"],
  ["Publish / Upgrade", "使用 sui client publish 或 sui client upgrade 發佈到 Sui testnet。"],
  ["更新 Package ID", "把新 package id 寫入 frontend/lib/sui-config.ts。"],
  ["交易 Builder", "前端已準備 create_room_with_stake、join_room_with_stake、reveal_deck、claim_pot builder。"],
  ["Hidden-hand V3", "目前 deployed big_two 會明文保存手牌；完整 hidden-hand escrow 需要下一版合約。"],
] as const

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-[#ded8c9] pt-10">
      <h2 className="text-2xl font-semibold tracking-tight text-[#243233]">{title}</h2>
      <div className="mt-4 text-sm leading-7 text-[#5f6d6e]">{children}</div>
    </section>
  )
}

function Card({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#ded8c9] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#e7f5ef] text-[#1f8f78]">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="font-semibold text-[#243233]">{title}</h3>
      </div>
      <div className="mt-3 text-sm leading-7 text-[#5f6d6e]">{children}</div>
    </div>
  )
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return <pre className="mt-3 overflow-x-auto rounded-lg bg-[#172120] p-4 text-xs leading-6 text-[#e8f5ef]">{children}</pre>
}

export default function V2DocsPage() {
  return (
    <main className="min-h-screen bg-[#f6f3eb] text-[#243233]">
      <header className="sticky top-0 z-20 border-b border-[#ded8c9] bg-[#f6f3eb]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <Link href="/v2" className="inline-flex items-center gap-2 text-sm font-medium text-[#5f6d6e] hover:text-[#243233]">
            <ArrowLeft className="h-4 w-4" /> 回到 V2
          </Link>
          <nav className="hidden gap-1 md:flex">
            {sections.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="rounded-md px-2.5 py-1.5 text-xs font-medium text-[#5f6d6e] hover:bg-white hover:text-[#243233]">
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <section className="border-b border-[#ded8c9]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#1f8f78]">Sui Big Two V2 Docs</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">多人可驗證 MVP 文件</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[#5f6d6e]">
              V2 的目標不是只做一個接錢包的牌桌，而是把房間、發牌、出牌、同步、commit-reveal、event replay 與 stake/claim 串成一條可以展示的可信閉環。這份文件是目前 MVP 的公開說明與部署準備入口。
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-[#1f8f78] px-3 py-1.5 text-white">server-authoritative</span>
              <span className="rounded-full border border-[#ded8c9] bg-white px-3 py-1.5">polling sync</span>
              <span className="rounded-full border border-[#ded8c9] bg-white px-3 py-1.5">commit-reveal</span>
              <span className="rounded-full border border-[#ded8c9] bg-white px-3 py-1.5">event replay</span>
              <span className="rounded-full border border-[#ded8c9] bg-white px-3 py-1.5">Sui testnet</span>
            </div>
          </div>
          <div className="rounded-lg bg-[#172120] p-5 text-[#e8f5ef] shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7fd5bd]">Current production target</p>
            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="text-[#9db3ae]">App route</p>
                <p className="mt-1 font-mono">/v2</p>
              </div>
              <div>
                <p className="text-[#9db3ae]">Docs route</p>
                <p className="mt-1 font-mono">/v2/docs</p>
              </div>
              <div>
                <p className="text-[#9db3ae]">Required host</p>
                <p className="mt-1 font-mono">Node server, Vercel recommended</p>
              </div>
              <div>
                <p className="text-[#9db3ae]">Database</p>
                <p className="mt-1 font-mono">Neon Postgres</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-1">
            {sections.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="block rounded-md px-3 py-2 text-sm text-[#5f6d6e] hover:bg-white hover:text-[#243233]">
                {label}
              </a>
            ))}
          </div>
        </aside>

        <article className="space-y-12">
          <Section id="overview" title="MVP 定位">
            <p>
              目前 V2 是 backend-verified multiplayer MVP：遊戲真相由後端維護，玩家端透過 polling 同步。這不是最終 fully trustless protocol，但已經能展示完整的產品閉環：玩家可玩、對手手牌不外洩、事件可追蹤、完局後可 replay。
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Card icon={WalletCards} title="身份">
                Sui Wallet 簽署 nonce 登入。建立/加入/出牌 API 都從 session 取得 wallet，不信任 client 傳入的地址。
              </Card>
              <Card icon={Database} title="狀態">
                房間、座位、game state、event chain、verification snapshot 都存在 PostgreSQL，部署時建議使用 Neon。
              </Card>
              <Card icon={ShieldCheck} title="驗證">
                開局鎖 deck commitment；完局後 reveal deck/salt 並 replay events 驗證 winner。
              </Card>
            </div>
          </Section>

          <Section id="rooms" title="房間與永久 AI 等候房">
            <p>
              `ROBO` 與 `DUOS` 是永久 AI 等候房，不是一次性測試房。真人離開時只清掉真人座位與當局狀態，AI 座位會保留，房間回到等待狀態。
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Card icon={Bot} title="ROBO">
                永久保留 3 個 AI seat，讓 1 位真人可以立即測試完整牌局。適合快速 demo 和單人測試。
              </Card>
              <Card icon={UsersIcon} title="DUOS">
                永久保留 2 個 AI seat，讓 2 位真人補滿四人桌。適合測試真人互動與 AI 混桌。
              </Card>
            </div>
          </Section>

          <Section id="gameplay" title="多人遊玩規則">
            <p>
              四位玩家入座後才能開始。發牌、出牌、PASS、勝負都由後端驗證。首輪必須包含梅花 3；每一手都必須是合法牌型並壓過上一手。
            </p>
            <CodeBlock>{`GET  /api/rooms              # 房間列表，會補回 ROBO/DUOS
GET  /api/rooms/active       # 目前 wallet 所在 active room
POST /api/rooms              # 建立臨時房
POST /api/rooms/:code/join   # 加入房間
GET  /api/rooms/:code/game   # 拉取牌局，同時自動推進 AI turn
POST /api/rooms/:code/game   # start / play / pass / abandon / record-chain`}</CodeBlock>
          </Section>

          <Section id="verification" title="Commit-Reveal 與 Event Replay">
            <p>V2 的可信閉環分成六個檢查點：</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {checks.map(([title, body], index) => (
                <div key={title} className="rounded-lg border border-[#ded8c9] bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#e7f5ef] font-mono text-xs font-bold text-[#1f8f78]">{index + 1}</span>
                    <h3 className="font-semibold text-[#243233]">{title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[#5f6d6e]">{body}</p>
                </div>
              ))}
            </div>
            <CodeBlock>{`sha3(deck || deckSalt) == deckCommitment
sha3(hand[i] || handSalt[i]) == handCommitment[i]
replay(events, originalHands).winner == recordedWinner`}</CodeBlock>
          </Section>

          <Section id="chain" title="上鏈路徑">
            <p>
              目前 frontend 已有 Sui transaction builders，能對應 deployed `big_two` module 的 escrow/reveal/claim flow。要注意：目前 deployed `big_two.deal_cards` 會明文保存四家手牌，所以 production hidden-hand escrow 需要下一版合約修正為 commitment/selective reveal。
            </p>
            <div className="mt-5 space-y-3">
              {chainSteps.map(([title, body]) => (
                <div key={title} className="flex gap-3 rounded-lg border border-[#ded8c9] bg-white p-4 shadow-sm">
                  <Hash className="mt-1 h-4 w-4 shrink-0 text-[#1f8f78]" />
                  <div>
                    <h3 className="font-semibold text-[#243233]">{title}</h3>
                    <p className="mt-1 text-sm leading-7 text-[#5f6d6e]">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="deploy" title="上線部署，不依賴本地">
            <p>
              V2 不能用 GitHub Pages 靜態部署，因為它需要 API routes、Prisma、session cookie 與 PostgreSQL。正式 demo 建議部署到 Vercel，DB 使用 Neon Postgres。
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Card icon={Globe2} title="Vercel">
                Project root 設為 `frontend/`。Build command 使用 `npm run build`。環境變數至少要設定 `DATABASE_URL` 與 `AUTH_SECRET`。
              </Card>
              <Card icon={TerminalSquare} title="Neon / Prisma">
                部署前執行 `npm run db:deploy`，並視需要執行 `npm run db:seed` 建立 `ROBO/DUOS`。Lobby API 也會自動補回永久 AI 房。
              </Card>
            </div>
            <CodeBlock>{`cd frontend
npm install
npm run db:deploy
npm run db:seed
npm run build`}</CodeBlock>
            <p className="mt-4">
              完整操作清單見 <Link href="/v2/docs#deploy" className="font-semibold text-[#1f8f78] underline-offset-4 hover:underline">本節</Link> 與 repo 文件 `docs/V2_DEPLOYMENT.md`。
            </p>
          </Section>

          <Section id="limits" title="限制與下一步">
            <div className="grid gap-4 md:grid-cols-2">
              <Card icon={LockKeyhole} title="目前可信邊界">
                Live hidden-hand state 仍由 backend 保管。這對 MVP 可接受，因為它已提供 post-game reveal/replay，但還不是完全 trustless hidden-card protocol。
              </Card>
              <Card icon={GitBranch} title="下一版合約">
                建議新增 V3 contract：鏈上只保存 deck/hand commitments、stake escrow、winner claim；手牌在完局後 reveal，不在 active game 明文上鏈。
              </Card>
            </div>
          </Section>
        </article>
      </div>
    </main>
  )
}

function UsersIcon(props: { className?: string }) {
  return <RefreshCw {...props} />
}
