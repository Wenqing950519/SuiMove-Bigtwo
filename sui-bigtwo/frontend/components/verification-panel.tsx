"use client"

import { CheckCircle2, XCircle, HelpCircle, Fingerprint, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PlayingCard } from "@/components/playing-card"
import type { TamperReport, VerificationState } from "@/lib/use-big-two-game"
import { SEAT_NAMES } from "@/lib/use-big-two-game"
import { shortHash } from "@/lib/big-two"
import { cn } from "@/lib/utils"

const COPY = {
  pending: "\u5f85\u9a57\u8b49",
  pass: "\u901a\u904e",
  fail: "\u5931\u6557",
  title: "\u53ef\u9a57\u8b49\u6027\u6aa2\u67e5",
  notVerified: "\u5c1a\u672a\u9a57\u8b49",
  verified: "\u9a57\u8b49\u901a\u904e",
  failed: "\u9a57\u8b49\u5931\u6557",
  commitment: "\u724c\u5806\u627f\u8afe\u96dc\u6e4a",
  revealHash: "\u63ed\u793a\u5f8c\u91cd\u7b97\u96dc\u6e4a",
  notGenerated: "\u5f85\u7522\u751f",
  hashCheck: "1. \u63ed\u793a\u724c\u5806\u7b26\u5408\u627f\u8afe",
  dealCheck: "2. \u5be6\u969b\u767c\u724c\u7b26\u5408\u63ed\u793a\u724c\u5806",
  help: "\u9a57\u8b49\u5206\u6210\u5169\u5c64\uff1a\u7b2c\u4e00\u5c64\u53ea\u6aa2\u67e5\u63ed\u793a deck \u8207 salt \u662f\u5426\u80fd\u91cd\u7b97\u51fa\u627f\u8afe\u96dc\u6e4a\uff1b\u7b2c\u4e8c\u5c64\u624d\u6aa2\u67e5\u9019\u526f deck \u5207\u51fa\u7684\u624b\u724c\u662f\u5426\u7b49\u65bc\u5be6\u969b\u767c\u724c\u5feb\u7167\u3002",
  tamperTitle: "\u4f5c\u5f0a\u6a21\u64ec\u5df2\u555f\u7528",
  tamperHelp: "\u9019\u4e0d\u662f\u6539\u8b8a\u63ed\u793a\u7684\u539f\u59cb\u724c\u5806\uff0c\u800c\u662f\u6539\u8b8a\u300c\u5be6\u969b\u767c\u724c\u7d00\u9304\u300d\u3002\u6240\u4ee5\u63ed\u793a\u96dc\u6e4a\u4ecd\u53ef\u4ee5\u901a\u904e\uff0c\u4f46\u767c\u724c\u5339\u914d\u61c9\u8a72\u5931\u6557\u3002",
  deckPreview: "\u63ed\u793a\u724c\u5806\u9810\u89bd",
  deckPlaceholder: "\u6309\u4e0b\u300c\u63ed\u793a\u4e26\u9a57\u8b49\u300d\u5f8c\uff0c\u9019\u88e1\u6703\u986f\u793a\u53ef\u91cd\u7b97\u7684\u5b8c\u6574\u724c\u5e8f\u3002",
} as const

function StatusPill({ value, label }: { value: boolean | null; label: string }) {
  const isPass = value === true
  const isFail = value === false
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
        isPass && "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
        isFail && "border-destructive/40 bg-destructive/10 text-destructive",
        value === null && "border-border bg-muted/40 text-muted-foreground",
      )}
    >
      {isPass && <CheckCircle2 className="size-4" />}
      {isFail && <XCircle className="size-4" />}
      {value === null && <HelpCircle className="size-4" />}
      <span className="font-medium">{label}</span>
      <span className="ml-auto font-mono text-xs">
        {value === null ? COPY.pending : isPass ? COPY.pass : COPY.fail}
      </span>
    </div>
  )
}

function HashRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Fingerprint className="size-3.5" />
        {label}
      </span>
      <code className="font-mono text-xs text-foreground">
        {value ? shortHash(value) : COPY.notGenerated}
      </code>
    </div>
  )
}

export function VerificationPanel({
  verification,
  tamperReport,
}: {
  verification: VerificationState
  tamperReport?: TamperReport | null
}) {
  const { commitment, revealHash, revealedDeck, dealMatches, hashMatches } = verification

  const overall =
    dealMatches === null || hashMatches === null
      ? null
      : dealMatches && hashMatches

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            {COPY.title}
            <Badge
              variant={
                overall === null
                  ? "secondary"
                  : overall
                    ? "default"
                    : "destructive"
              }
            >
              {overall === null ? COPY.notVerified : overall ? COPY.verified : COPY.failed}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {tamperReport?.active && (
            <div className="rounded-md border border-amber-400/50 bg-amber-400/10 p-3 text-sm text-amber-900">
              <div className="mb-1 flex items-center gap-2 font-medium">
                <AlertTriangle className="size-4" />
                {COPY.tamperTitle}
              </div>
              <p className="leading-relaxed">{tamperReport.summary}</p>
              <p className="mt-1 font-mono text-xs">{tamperReport.detail}</p>
              <p className="mt-2 text-xs leading-relaxed text-amber-900/80">{COPY.tamperHelp}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <HashRow label={COPY.commitment} value={commitment} />
            <HashRow label={COPY.revealHash} value={revealHash} />
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <StatusPill value={hashMatches} label={COPY.hashCheck} />
            <StatusPill value={dealMatches} label={COPY.dealCheck} />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{COPY.help}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{COPY.deckPreview}</CardTitle>
        </CardHeader>
        <CardContent>
          {revealedDeck ? (
            <div className="flex flex-col gap-4">
              {[0, 1, 2, 3].map((seat) => (
                <div key={seat} className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    {SEAT_NAMES[seat]}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {revealedDeck
                      .slice(seat * 13, seat * 13 + 13)
                      .map((c) => (
                        <PlayingCard key={c.id} card={c} size="sm" />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{COPY.deckPlaceholder}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}