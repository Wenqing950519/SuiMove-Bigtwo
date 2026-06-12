import type { Metadata } from "next"
import Link from "next/link"
import type { ComponentType, ReactNode } from "react"
import {
  ArrowLeft,
  Blocks,
  CheckCircle2,
  Code2,
  ExternalLink,
  FileCheck2,
  GitBranch,
  LockKeyhole,
  Network,
  ShieldAlert,
  WalletCards,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "中文文件｜Sui 大老二可驗證牌局",
  description:
    "Sui Move 大老二中文文件，說明系統架構、可驗證性、Move 合約、操作流程與信任模型。",
}

const PACKAGE_ID =
  "0x94b3f4d9451736b6af3679228852d1749dbb6949dded8da8dbb0cade7682f985"
const PUBLISH_DIGEST = "J6HWyu8trVtFcqE8biD5zCaW3PPYznaVc7gsrwdvm6fX"

const navItems = [
  ["overview", "專案總覽"],
  ["architecture", "系統架構"],
  ["verifiability", "可驗證性"],
  ["contract", "Move 合約"],
  ["rules", "規則模型"],
  ["flow", "操作流程"],
  ["trust", "信任模型"],
] as const

const web3Claims = [
  ["牌堆承諾", "開局前把 sha3_256(deck || salt) 上鏈，先鎖住一副牌。"],
  ["揭示驗證", "終局公開 deck 與 salt，任何人都能重算雜湊。"],
  ["發牌綁定", "揭示出的 deck 必須切出與原始發牌紀錄相同的四手牌。"],
  ["事件歷史", "房間建立、加入、發牌、出牌、pass、結束、揭示都可作為 Move events 審計。"],
  ["押注池", "testnet SUI 可鎖在 GameRoom，勝者依 Move 狀態領取。"],
] as const

const lifecycle = [
  ["WAITING", "建立房間、等待玩家加入、保存 deck commitment。"],
  ["PLAYING", "莊家發牌後進入遊戲，合約驗證出牌與 turn state。"],
  ["ENDED", "某位玩家手牌歸零，winner 寫入 GameRoom。"],
  ["REVEALED", "公開 deck + salt，驗證 hash 與原始發牌是否匹配。"],
] as const

const entryFunctions = [
  ["create_room", "建立不押注房間，寫入 deck commitment。"],
  ["create_room_with_stake", "建立押注房間，將第一筆 testnet SUI 放入 pot。"],
  ["join_room / join_room_with_stake", "玩家加入房間；押注房需支付相同金額。"],
  ["deal_cards", "莊家送出四份 13 張手牌，合約檢查 52 張合法且不重複。"],
  ["play_cards", "驗證輪次、手牌所有權、牌型、大小與首出梅花 3。"],
  ["pass_turn", "允許玩家 pass，三家 pass 後清空 trick 並回到上一位出牌者。"],
  ["reveal_deck", "公開 deck 與 salt，驗證 commitment 以及 dealHands(deck) == original_hands。"],
  ["claim_pot", "遊戲結束後，只有 GameRoom 記錄的 winner 可以領取 pot。"],
] as const

const limitations = [
  ["公開手牌", "目前版本以公開手牌狀態呈現，以便完整檢查發牌、出牌與揭示流程。"],
  ["隨機性邊界", "commitment 可驗證牌局未被事後替換，但不能單獨證明初始牌堆由公平隨機來源產生。"],
  ["測試網押注", "testnet SUI escrow 用於驗證資產流程，不構成正式賭博或主網資金協議。"],
  ["同步範圍", "目前版本聚焦可驗證狀態與操作介面，不包含完整多人即時同步與爭議處理。"],
] as const

function SectionHeading({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <div id={id} className="scroll-mt-24">
      <div className="mb-4">
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight md:text-4xl">
          {title}
        </h2>
        <div className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          {children}
        </div>
      </div>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-md bg-[oklch(0.93_0.03_180)] text-[oklch(0.35_0.08_165)]">
          <Icon className="size-4" />
        </span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="text-sm leading-7 text-muted-foreground">{children}</div>
    </div>
  )
}

function ExternalDocLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-[oklch(0.38_0.09_165)] underline-offset-4 hover:underline"
    >
      {children}
      <ExternalLink className="size-3.5" />
    </a>
  )
}

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            回到遊戲
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1fr_360px] lg:py-16">
          <div>
            <Badge variant="outline" className="mb-4">
              Sui Move technical documentation
            </Badge>
            <h1 className="max-w-4xl text-3xl font-semibold leading-tight md:text-4xl">
              Sui 大老二可驗證牌局文件
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground">
              本文件說明 Sui Move 大老二的系統架構、鏈上狀態、可驗證流程、押注結算與信任邊界。
              系統使用 Sui shared object 保存牌局狀態，並透過 Move events、commit-reveal 與
              testnet SUI escrow 建立可檢查的牌局紀錄。
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge>commit-reveal</Badge>
              <Badge variant="outline">GameRoom shared object</Badge>
              <Badge variant="outline">Move events</Badge>
              <Badge variant="outline">testnet SUI escrow</Badge>
            </div>
          </div>

          <div className="rounded-lg bg-[oklch(0.15_0.03_165)] p-5 text-[oklch(0.96_0.01_85)]">
            <p className="text-xs font-semibold uppercase tracking-normal text-[oklch(0.77_0.1_175)]">
              deployed package
            </p>
            <p className="mt-3 break-all font-mono text-sm">{PACKAGE_ID}</p>
            <div className="mt-5 border-t border-white/15 pt-5">
              <p className="text-xs font-semibold uppercase tracking-normal text-[oklch(0.77_0.1_175)]">
                publish transaction
              </p>
              <p className="mt-3 break-all font-mono text-sm">{PUBLISH_DIGEST}</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-white/15 p-3">
                <p className="text-white/60">Network</p>
                <p className="mt-1 font-mono">sui:testnet</p>
              </div>
              <div className="rounded-md border border-white/15 p-3">
                <p className="text-white/60">Stake</p>
                <p className="mt-1 font-mono">0.1 SUI</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-10">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-20 space-y-1">
            {navItems.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </div>
        </aside>

        <article className="min-w-0 flex-1 space-y-14">
          <section>
            <SectionHeading
              id="overview"
              title="Overview"
            >
              系統將牌局中的關鍵資料拆分為可檢查狀態：牌堆承諾雜湊、原始發牌紀錄、
              Move 事件歷史、終局揭示資料與押注池狀態。使用者可透過驗證面板檢查牌堆揭示與發牌紀錄是否一致。
            </SectionHeading>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {web3Claims.map(([title, body]) => (
                <div key={title} className="rounded-lg border border-border bg-card p-4">
                  <CheckCircle2 className="mb-3 size-5 text-[oklch(0.42_0.07_160)]" />
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionHeading
              id="architecture"
              title="Architecture"
            >
              系統分為三個主要部分：前端與 SDK 負責互動與本地驗證，Sui Move 合約負責共享狀態與規則約束，
              Verifier / Explorer 負責重算承諾、比對發牌資料並重放事件歷史。
            </SectionHeading>

            <div className="grid gap-4 md:grid-cols-3">
              <InfoCard icon={Network} title="Frontend / SDK">
                產生牌堆、洗牌、建立 commitment、渲染桌面、執行操作控制、重算 hash，
                並將事件歷史整理為可閱讀流程。
              </InfoCard>
              <InfoCard icon={Blocks} title="Sui Move">
                GameRoom 是 shared object，保存玩家、手牌、回合、最後出牌、winner、
                revealed deck、stake pot 與 pot claim 狀態。
              </InfoCard>
              <InfoCard icon={FileCheck2} title="Verifier / Explorer">
                重新計算 commitment、檢查 52 張牌唯一性、驗證 revealed deck 是否能切回原始發牌，
                並用事件紀錄重放牌局。
              </InfoCard>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              {lifecycle.map(([state, body]) => (
                <div key={state} className="rounded-lg border border-border bg-card p-4">
                  <p className="font-mono text-sm font-semibold text-[oklch(0.35_0.08_165)]">
                    {state}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionHeading
              id="verifiability"
              title="Verifiability"
            >
              開局時的承諾是 <code className="rounded bg-muted px-1.5 py-0.5">sha3_256(deck || salt)</code>。
              終局時公開 deck 與 salt 後，系統要同時通過兩個檢查：第一，重算 hash 必須等於開局承諾；
              第二，將 revealed deck 切成四份 13 張牌，必須等於當初紀錄的 original_hands。
            </SectionHeading>

            <div className="grid gap-3 md:grid-cols-4">
              {["Commit", "Deal", "Reveal", "Verify"].map((label, index) => (
                <div key={label} className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-3 flex size-8 items-center justify-center rounded-md bg-[oklch(0.87_0.12_170)] font-mono text-sm font-semibold text-[oklch(0.18_0.04_160)]">
                    {index + 1}
                  </div>
                  <h3 className="font-semibold">{label}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {
                      [
                        "先把 deck commitment 上鏈。",
                        "保存實際發出的 original_hands。",
                        "公開 deck 與 salt。",
                        "hash match 且 deal match 才算通過。",
                      ][index]
                    }
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
              <p className="font-semibold">竄改發牌檢查</p>
              <p className="mt-1">
                竄改發牌不是更改揭示牌堆，而是把「實際發牌紀錄」替換成另一組合法但不同的手牌。
                因此 revealed deck 仍然能算出相同 commitment，hash 會過；但 revealed deck 切出來的四手牌
                對不上 original_hands，所以 deal match 會失敗。
              </p>
            </div>
          </section>

          <section>
            <SectionHeading
              id="contract"
              title="Move Contract"
            >
              合約模組為 <code className="rounded bg-muted px-1.5 py-0.5">big_two::big_two</code>。
              它不是只記錄結果，而是把回合狀態、牌型檢查、事件輸出、終局 winner 與 pot claim 都放在
              Move 狀態機裡。
            </SectionHeading>

            <div className="grid gap-3">
              {entryFunctions.map(([name, body]) => (
                <div
                  key={name}
                  className="grid gap-2 rounded-lg border border-border bg-card p-4 md:grid-cols-[240px_1fr]"
                >
                  <code className="font-mono text-sm font-semibold text-[oklch(0.35_0.08_165)]">
                    {name}
                  </code>
                  <p className="text-sm leading-7 text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionHeading
              id="rules"
              title="Rule Model"
            >
              牌用 <code className="rounded bg-muted px-1.5 py-0.5">0..51</code> 編碼；
              <code className="rounded bg-muted px-1.5 py-0.5">rank = card / 4</code>，
              <code className="rounded bg-muted px-1.5 py-0.5">suit = card % 4</code>。
              花色大小為梅花、方塊、紅心、黑桃；第一手必須包含梅花 3。
            </SectionHeading>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard icon={GitBranch} title="牌型強度">
                單張、對子、三條、順子、同花、葫蘆、鐵支、同花順。五張牌比較時，
                強度順序為順子小於同花，小於葫蘆，小於鐵支，小於同花順。
              </InfoCard>
              <InfoCard icon={Code2} title="規則變體">
                本系統採固定規則：J Q K A 2 可視為順子；A 2 3 4 5 這類繞回順不支援。
                同花比較使用該同花中的最大單張 power。
              </InfoCard>
            </div>
          </section>

          <section>
            <SectionHeading
              id="flow"
              title="Operation Flow"
            >
              操作流程由房間建立開始，依序完成鏈上房間建立、發牌、出牌、可驗證性檢查與勝利結算。
              每個階段都會產生可供比對的狀態或事件資料。
            </SectionHeading>

            <div className="space-y-3">
              {[
                ["1", "建立房間", "產生 deck commitment，顯示牌堆承諾雜湊。"],
                ["2", "鏈上建立", "連接 Sui Wallet，在 testnet 建立 GameRoom 並押入 0.1 SUI。"],
                ["3", "發牌與出牌", "執行梅花 3 首出、花色比較、鐵支與 pass 流程。"],
                ["4", "竄改發牌", "替換原始發牌紀錄，使 hash 通過但 deal match 失敗。"],
                ["5", "揭示驗證", "公開 deck + salt，並在驗證面板比對 commitment 與發牌紀錄。"],
                ["6", "勝利結算", "說明 winner、GameRoom pot 與 claim_pot 的鏈上限制。"],
              ].map(([step, title, body]) => (
                <div key={step} className="flex gap-3 rounded-lg border border-border bg-card p-4">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[oklch(0.42_0.07_160)] font-mono text-sm font-semibold text-white">
                    {step}
                  </div>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-7 text-muted-foreground">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionHeading
              id="trust"
              title="Trust Model"
            >
              目前版本可驗證牌局歷史、原始發牌與終局揭示是否一致，並呈現 Move escrow 持有測試網資產的流程。
              系統尚未提供隱藏手牌、公平隨機來源或完整爭議處理。
            </SectionHeading>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard icon={LockKeyhole} title="可以證明">
                revealed deck 是否符合開局 commitment、revealed deck 是否能切回 original_hands、
                Move events 是否形成可重放歷史、winner 是否由 deterministic rules 得出。
              </InfoCard>
              <InfoCard icon={ShieldAlert} title="尚未證明">
                莊家是否公平選牌、手牌是否保密、玩家斷線如何處理、多人真實同步如何爭議解決。
              </InfoCard>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {limitations.map(([title, body]) => (
                <div key={title} className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                  <h3 className="font-semibold text-rose-950">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-rose-950/75">{body}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <WalletCards className="size-5 text-[oklch(0.72_0.12_75)]" />
                <h3 className="font-semibold">升級路線</h3>
              </div>
              <div className="grid gap-3 text-sm leading-7 text-muted-foreground md:grid-cols-3">
                <p>多玩家 seed commit-reveal，降低單一莊家控制牌堆的能力。</p>
                <p>接入 Sui Random object，讓 deck 來源更接近鏈上隨機。</p>
                <p>使用 TEE、ZK 或 mental poker 協議處理隱藏手牌。</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-muted/40 p-5">
            <h2 className="text-lg font-semibold">參考來源</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              以下為可驗證遊戲歷史、鏈上資產管理與可信執行環境相關的公開參考資料。
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <ExternalDocLink href="https://cloutcards.fun/docs/">CloutCards Docs</ExternalDocLink>
              <ExternalDocLink href="https://docs.cloutcards.fun/architecture/verifiability/">
                Verifiability
              </ExternalDocLink>
              <ExternalDocLink href="https://docs.cloutcards.fun/architecture/smart-contracts/">
                Smart Contracts
              </ExternalDocLink>
              <ExternalDocLink href="https://docs.cloutcards.fun/architecture/tee/">
                TEE Architecture
              </ExternalDocLink>
            </div>
          </section>
        </article>
      </div>
    </main>
  )
}
