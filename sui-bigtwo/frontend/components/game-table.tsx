"use client"

import { Play, SkipForward, ArrowUpDown, ShieldCheck, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CardBack, PlayingCard } from "@/components/playing-card"
import { SEAT_NAMES } from "@/lib/use-big-two-game"
import { analyzePlay, COMBO_LABEL, type Card as CardType } from "@/lib/big-two"
import { cn } from "@/lib/utils"

interface GameTableProps {
  hands: CardType[][]
  currentTurn: number
  lastPlay: { seat: number; cards: CardType[] } | null
  selected: Set<number>
  joinedSeats: boolean[]
  gameOver: boolean
  canPass: boolean
  actionMessage: string
  onToggleSelect: (id: number) => void
  onPlay: () => void
  onPass: () => void
  onSort: () => void
  onVerify: () => void
  onOpenRewardClaim: () => void
}

function Seat({
  index,
  active,
  joined,
  count,
}: {
  index: number
  active: boolean
  joined: boolean
  count: number
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border px-4 py-3 transition-colors",
        active
          ? "border-amber-400 bg-amber-400/10"
          : "border-border bg-card/40",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "size-2 rounded-full",
            joined ? "bg-emerald-500" : "bg-muted-foreground/40",
          )}
        />
        <span className="text-sm font-medium">{SEAT_NAMES[index]}</span>
        {active && (
          <Badge variant="secondary" className="text-[10px]">
            出牌中
          </Badge>
        )}
      </div>
      {index !== 0 && (
        <div className="flex -space-x-6">
          {count > 0 ? (
            Array.from({ length: Math.min(count, 6) }).map((_, i) => (
              <CardBack key={i} size="sm" />
            ))
          ) : (
            <span className="text-xs text-muted-foreground">無手牌</span>
          )}
        </div>
      )}
      <span className="text-xs text-muted-foreground">剩 {count} 張</span>
    </div>
  )
}

export function GameTable({
  hands,
  currentTurn,
  lastPlay,
  selected,
  joinedSeats,
  gameOver,
  canPass,
  actionMessage,
  onToggleSelect,
  onPlay,
  onPass,
  onSort,
  onVerify,
  onOpenRewardClaim,
}: GameTableProps) {
  const myHand = hands[0] ?? []
  const dealt = hands.length > 0
  const selectedCards = myHand.filter((card) => selected.has(card.id))
  const selectedCombo = selectedCards.length > 0 ? analyzePlay(selectedCards) : null

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[2, 3, 1].map((seat) => (
          <Seat
            key={seat}
            index={seat}
            active={currentTurn === seat && dealt && !gameOver}
            joined={joinedSeats[seat]}
            count={hands[seat]?.length ?? 0}
          />
        ))}
      </div>

      <div className="relative flex min-h-44 items-center justify-center rounded-xl border border-emerald-900/40 bg-[oklch(0.42_0.07_160)] p-6 shadow-inner">
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs uppercase tracking-widest text-emerald-100/70">
            {gameOver ? "遊戲結束" : "目前桌面"}
          </span>
          {lastPlay ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1">
                {lastPlay.cards.map((c) => (
                  <PlayingCard key={c.id} card={c} size="md" />
                ))}
              </div>
              <span className="text-xs text-emerald-50/80">
                {SEAT_NAMES[lastPlay.seat]} 出了 {COMBO_LABEL[analyzePlay(lastPlay.cards).type]}
              </span>
            </div>
          ) : (
            <span className="text-sm text-emerald-50/60">
              {dealt ? "新一輪，請出任意合法牌型" : "請先發牌開始遊戲"}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-800">
        規則提示：首輪必須由持有梅花3的玩家先出，而且第一手必須包含梅花3。
      </div>

      <div className="rounded-md border border-border bg-muted/35 px-3 py-2 text-sm text-muted-foreground">
        {actionMessage}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-2 rounded-full",
                joinedSeats[0] ? "bg-emerald-500" : "bg-muted-foreground/40",
              )}
            />
            <span className="text-sm font-medium">{SEAT_NAMES[0]}（你）</span>
            {currentTurn === 0 && dealt && !gameOver && (
              <Badge variant="secondary" className="text-[10px]">
                輪到你
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            剩 {myHand.length} 張
          </span>
        </div>

        <div className="flex min-h-28 flex-wrap items-end gap-1 rounded-lg border border-border bg-card/40 p-3">
          {myHand.length > 0 ? (
            myHand.map((card) => (
              <PlayingCard
                key={card.id}
                card={card}
                size="lg"
                selectable
                raised={selected.has(card.id)}
                onClick={() => onToggleSelect(card.id)}
              />
            ))
          ) : (
            <span className="text-sm text-muted-foreground">
              目前沒有手牌。
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={onPlay}
            disabled={!dealt || gameOver || currentTurn !== 0 || selected.size === 0}
          >
            <Play className="size-4" />
            出牌
          </Button>
          <Button
            variant="secondary"
            onClick={onPass}
            disabled={!dealt || gameOver || currentTurn !== 0 || !canPass}
          >
            <SkipForward className="size-4" />
            跳過
          </Button>
          <Button variant="outline" onClick={onSort} disabled={!dealt}>
            <ArrowUpDown className="size-4" />
            排序
          </Button>
          <Button variant="outline" onClick={onVerify}>
            <ShieldCheck className="size-4" />
            驗證
          </Button>
          {gameOver && (
            <Button variant="secondary" onClick={onOpenRewardClaim}>
              <Trophy className="size-4" />
              查看結算
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            已選：{selectedCards.length === 0 ? "無" : COMBO_LABEL[selectedCombo?.type ?? "none"]}
          </span>
        </div>
      </div>
    </div>
  )
}
