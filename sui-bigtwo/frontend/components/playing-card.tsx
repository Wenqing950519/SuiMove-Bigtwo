"use client"

import { cn } from "@/lib/utils"
import {
  type Card as CardType,
  SUIT_IS_RED,
  SUIT_LABEL,
  SUIT_SYMBOL,
} from "@/lib/big-two"

interface PlayingCardProps {
  card: CardType
  size?: "sm" | "md" | "lg"
  raised?: boolean
  selectable?: boolean
  onClick?: () => void
}

const SIZES = {
  sm: "h-12 w-9 text-[10px]",
  md: "h-16 w-12 text-xs",
  lg: "h-24 w-16 text-sm",
} as const

export function PlayingCard({
  card,
  size = "md",
  raised = false,
  selectable = false,
  onClick,
}: PlayingCardProps) {
  const red = SUIT_IS_RED[card.suit]
  const Tag = selectable ? "button" : "div"
  const corner = `${SUIT_SYMBOL[card.suit]}${card.rank}`
  const suitColor = red ? "#dc2626" : "#171717"

  return (
    <Tag
      type={selectable ? "button" : undefined}
      onClick={onClick}
      aria-pressed={selectable ? raised : undefined}
      aria-label={`${SUIT_LABEL[card.suit]} ${card.rank}`}
      title={`${SUIT_LABEL[card.suit]} ${card.rank}`}
      style={{ color: suitColor }}
      className={cn(
        "relative flex flex-col items-center justify-between rounded-md border bg-[oklch(0.99_0.01_85)] p-1 font-mono shadow-sm transition-transform",
        SIZES[size],
        selectable && "cursor-pointer hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        raised && "-translate-y-4 border-amber-400 ring-2 ring-amber-400",
      )}
    >
      <span className="self-start whitespace-nowrap font-semibold leading-none">
        {corner}
      </span>
      <span className="text-xl leading-none">{SUIT_SYMBOL[card.suit]}</span>
      <span className="self-end rotate-180 whitespace-nowrap font-semibold leading-none">
        {corner}
      </span>
    </Tag>
  )
}

export function CardBack({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-md border border-emerald-900 bg-emerald-800 shadow-sm",
        "bg-[repeating-linear-gradient(45deg,oklch(0.4_0.08_160),oklch(0.4_0.08_160)_4px,oklch(0.45_0.08_160)_4px,oklch(0.45_0.08_160)_8px)]",
        SIZES[size],
      )}
    />
  )
}
