"use client"

import { useState } from "react"
import {
  DoorOpen,
  Users,
  Layers,
  PlayCircle,
  Eye,
  AlertTriangle,
  HelpCircle,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface DevDemoControlsProps {
  roomCreated: boolean
  dealt: boolean
  onCreateRoom: () => void
  onJoinPlayers: () => void
  onDeal: () => void
  onAutoPlay: () => void
  onTamper: () => void
  onReveal: () => void
}

const COPY = {
  title: "Demo \u64cd\u4f5c\u63a7\u5236",
  helpLabel: "\u8aaa\u660e\u7ac4\u6539\u767c\u724c\u8207\u63ed\u793a\u9a57\u8b49",
  helpTitle: "\u9a57\u8b49\u529f\u80fd\u8aaa\u660e",
  closeHelp: "\u95dc\u9589\u8aaa\u660e",
  createRoom: "\u5efa\u7acb\u623f\u9593",
  joinPlayers: "\u73a9\u5bb6\u5165\u5ea7",
  deal: "\u767c\u724c",
  autoPlay: "\u81ea\u52d5\u51fa\u4e00\u6b65",
  tamper: "\u4f5c\u5f0a\u6a21\u64ec",
  reveal: "\u63ed\u793a\u4e26\u9a57\u8b49",
  helpLines: [
    "\u300c\u4f5c\u5f0a\u6a21\u64ec\u300d\u6703\u660e\u78ba\u4ea4\u63db\u5169\u4f4d\u73a9\u5bb6\u5728\u767c\u724c\u7d00\u9304\u4e2d\u7684\u4e00\u5f35\u724c\uff0c\u7528\u4f86\u6f14\u793a\u6709\u4eba\u628a\u5be6\u969b\u767c\u724c\u7d00\u9304\u6539\u6210\u53e6\u4e00\u5957\u5408\u6cd5\u5206\u914d\u3002",
    "\u300c\u63ed\u793a\u4e26\u9a57\u8b49\u300d\u6703\u516c\u958b\u539f\u59cb\u724c\u5806\u8207 salt\uff0c\u91cd\u65b0\u8a08\u7b97 SHA3-256(deck || salt)\uff0c\u518d\u628a\u63ed\u793a\u724c\u5806\u5207\u56de\u56db\u4efd\u624b\u724c\u3002",
    "\u4f5c\u5f0a\u6a21\u64ec\u5f8c\u96dc\u6e4a\u4ecd\u53ef\u80fd\u901a\u904e\uff0c\u56e0\u70ba\u627f\u8afe\u6aa2\u67e5\u53ea\u8b49\u660e\u63ed\u793a\u7684\u724c\u5806\u6c92\u6709\u8b8a\uff1b\u771f\u6b63\u6293\u5230\u4f5c\u5f0a\u7684\u662f\u7b2c\u4e8c\u5c64\u300c\u5be6\u969b\u767c\u724c\u662f\u5426\u7b26\u5408\u63ed\u793a\u724c\u5806\u300d\u3002",
  ],
} as const

export function DevDemoControls({
  roomCreated,
  dealt,
  onCreateRoom,
  onJoinPlayers,
  onDeal,
  onAutoPlay,
  onTamper,
  onReveal,
}: DevDemoControlsProps) {
  const [open, setOpen] = useState(false)

  return (
    <Card className="relative overflow-visible">
      <CardHeader className="pr-14">
        <CardTitle className="text-base">{COPY.title}</CardTitle>
        <button
          type="button"
          aria-label={COPY.helpLabel}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "absolute right-3 top-3 flex size-8 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors",
            "hover:border-foreground/40 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            open && "border-emerald-500/50 bg-emerald-500/10 text-emerald-700",
          )}
        >
          <HelpCircle className="size-4" />
        </button>
        {open && (
          <div className="absolute right-3 top-12 z-20 w-[min(22rem,calc(100vw-2rem))] rounded-md border bg-popover p-4 text-sm shadow-lg">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="font-semibold text-foreground">{COPY.helpTitle}</span>
              <button
                type="button"
                aria-label={COPY.closeHelp}
                onClick={() => setOpen(false)}
                className="rounded-sm p-1 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-3 leading-relaxed text-muted-foreground">
              {COPY.helpLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        <Button variant="secondary" onClick={onCreateRoom}>
          <DoorOpen className="size-4" />
          {COPY.createRoom}
        </Button>
        <Button
          variant="secondary"
          onClick={onJoinPlayers}
          disabled={!roomCreated}
        >
          <Users className="size-4" />
          {COPY.joinPlayers}
        </Button>
        <Button variant="secondary" onClick={onDeal} disabled={!roomCreated}>
          <Layers className="size-4" />
          {COPY.deal}
        </Button>
        <Button variant="secondary" onClick={onAutoPlay} disabled={!dealt}>
          <PlayCircle className="size-4" />
          {COPY.autoPlay}
        </Button>
        <Button variant="outline" onClick={onTamper} disabled={!dealt}>
          <AlertTriangle className="size-4" />
          {COPY.tamper}
        </Button>
        <Button onClick={onReveal} disabled={!roomCreated}>
          <Eye className="size-4" />
          {COPY.reveal}
        </Button>
      </CardContent>
    </Card>
  )
}