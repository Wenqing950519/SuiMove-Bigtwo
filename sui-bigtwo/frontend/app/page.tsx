"use client"

import { useState } from "react"
import Link from "next/link"
import { BookOpen, Spade } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { GameTable } from "@/components/game-table"
import { VerificationPanel } from "@/components/verification-panel"
import { HistoryExplorer } from "@/components/history-explorer"
import { DevDemoControls } from "@/components/dev-demo-controls"
import { OnChainPanel } from "@/components/on-chain-panel"
import { RewardClaimDialog } from "@/components/reward-claim-dialog"
import { useBigTwoGame } from "@/lib/use-big-two-game"

const COPY = {
  title: "Sui 大老二",
  subtitle: "牌堆承諾、揭示驗證、事件歷史",
  seed: "種子",
  noRoom: "尚未建立房間",
  verify: "驗證",
  history: "歷史",
  docs: "中文文件",
} as const

export default function Page() {
  const game = useBigTwoGame()
  const dealt = game.hands.length > 0
  const [onChainRoomId, setOnChainRoomId] = useState<string | null>(null)

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-[oklch(0.42_0.07_160)] text-[oklch(0.99_0.01_85)]">
              <Spade className="size-4" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">{COPY.title}</span>
              <span className="text-[11px] text-muted-foreground">
                {COPY.subtitle}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/docs"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <BookOpen className="size-3.5" />
              {COPY.docs}
            </Link>
            <Badge variant="outline" className="font-mono text-[11px]">
              {game.seed !== null ? `${COPY.seed} 0x${game.seed.toString(16)}` : COPY.noRoom}
            </Badge>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <GameTable
            hands={game.hands}
            currentTurn={game.currentTurn}
            lastPlay={game.lastPlay}
            selected={game.selected}
            joinedSeats={game.joinedSeats}
            gameOver={game.gameOver}
            canPass={game.canPass}
            actionMessage={game.actionMessage}
            onToggleSelect={game.toggleSelect}
            onPlay={game.play}
            onPass={game.pass}
            onSort={game.sortMyHand}
            onVerify={game.revealAndVerify}
            onOpenRewardClaim={game.openRewardClaim}
          />
          <DevDemoControls
            roomCreated={game.roomCreated}
            dealt={dealt}
            onCreateRoom={game.createRoom}
            onJoinPlayers={game.joinPlayers}
            onDeal={game.deal}
            onAutoPlay={game.autoPlay}
            onTamper={game.tamperDeal}
            onReveal={game.revealAndVerify}
          />
        </div>

        <aside className="flex flex-col gap-4">
          <OnChainPanel commitment={game.verification.commitment} onRoomCreated={setOnChainRoomId} />
          <Tabs defaultValue="verify">
            <TabsList className="w-full">
              <TabsTrigger value="verify" className="flex-1">
                {COPY.verify}
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1">
                {COPY.history}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="verify" className="mt-4">
              <VerificationPanel verification={game.verification} tamperReport={game.tamperReport} />
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <HistoryExplorer events={game.events} />
            </TabsContent>
          </Tabs>
        </aside>
      </div>

      <RewardClaimDialog
        open={game.rewardClaimOpen && game.gameOver && game.winnerSeat !== null}
        winnerSeat={game.winnerSeat}
        roomId={onChainRoomId}
        claimReady={false}
        onClose={game.dismissRewardClaim}
      />
    </main>
  )
}
