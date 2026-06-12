"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  DoorOpen,
  UserPlus,
  Layers,
  Hand,
  SkipForward,
  Flag,
  Eye,
  AlertTriangle,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { EventType, GameEvent } from "@/lib/use-big-two-game"
import { cn } from "@/lib/utils"

const EVENT_META: Record<
  EventType,
  { label: string; icon: typeof DoorOpen; tone: string }
> = {
  room_created: { label: "房間建立", icon: DoorOpen, tone: "text-sky-600" },
  player_joined: { label: "玩家入座", icon: UserPlus, tone: "text-emerald-600" },
  deal: { label: "發牌", icon: Layers, tone: "text-amber-600" },
  play: { label: "出牌", icon: Hand, tone: "text-foreground" },
  pass: { label: "跳過", icon: SkipForward, tone: "text-muted-foreground" },
  game_end: { label: "遊戲結束", icon: Flag, tone: "text-destructive" },
  reveal: { label: "揭示驗證", icon: Eye, tone: "text-sky-600" },
  tamper: { label: "作弊模擬", icon: AlertTriangle, tone: "text-amber-700" },
}

function EventRow({ event }: { event: GameEvent }) {
  const [open, setOpen] = useState(false)
  const meta = EVENT_META[event.type]
  const Icon = meta.icon
  const time = new Date(event.timestamp).toLocaleTimeString("zh-TW")

  return (
    <Card className="overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/50"
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
        <Icon className={cn("size-4 shrink-0", meta.tone)} />
        <span className="text-sm font-medium">{meta.label}</span>
        {event.player && (
          <Badge variant="outline" className="text-[10px]">
            {event.player}
          </Badge>
        )}
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
          {time}
        </span>
      </button>
      {open && (
        <div className="border-t border-border bg-muted/30 px-3 py-2">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              交易摘要
            </span>
            <code className="truncate font-mono text-[11px] text-foreground">
              {event.txDigest}
            </code>
          </div>
          <pre className="overflow-x-auto rounded-md bg-background p-2 font-mono text-[11px] leading-relaxed text-foreground">
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        </div>
      )}
    </Card>
  )
}

export function HistoryExplorer({ events }: { events: GameEvent[] }) {
  return (
    <div className="flex flex-col gap-2">
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          尚無事件。建立房間後，鏈上事件歷史會顯示在這裡。
        </p>
      ) : (
        [...events]
          .reverse()
          .map((event) => <EventRow key={event.id} event={event} />)
      )}
    </div>
  )
}
