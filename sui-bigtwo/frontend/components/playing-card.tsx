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
  sm: "h-14 w-10 rounded-lg p-1.5",
  md: "h-20 w-14 rounded-xl p-2",
  lg: "h-28 w-20 rounded-2xl p-2.5",
} as const

const CORNER_SIZES = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-sm",
} as const

const CENTER_SIZES = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-[2.6rem]",
} as const

const INK = "#2E3D40"
const RED = "#C8434C"

const CARD_BASE =
  "relative flex flex-col justify-between bg-white font-semibold border border-[#E7E2D7] shadow-[0_6px_16px_rgba(46,61,64,0.10)] transition-transform duration-150"

const BACK_SIZES = {
  xs: "h-11 w-8 rounded-md",
  sm: "h-14 w-10 rounded-lg",
  md: "h-20 w-14 rounded-xl",
  lg: "h-28 w-20 rounded-2xl",
} as const

const BACK_BASE =
  "relative overflow-hidden bg-[#2E7E6E] border border-[#1f5e52] ring-1 ring-white/40 shadow-[0_4px_10px_rgba(33,108,94,0.20)]"
const BACK_BORDER = "before:absolute before:inset-[3px] before:rounded-[inherit] before:border before:border-white/30"
const BACK_PATTERN =
  "after:absolute after:inset-0 after:bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.14)_0,rgba(255,255,255,0.14)_1.5px,transparent_1.5px,transparent_7px)]"

export function PlayingCard({
  card,
  size = "md",
  raised = false,
  selectable = false,
  onClick,
}: PlayingCardProps) {
  const red = SUIT_IS_RED[card.suit]
  const Tag = selectable ? "button" : "div"
  const suitColor = red ? RED : INK
  const symbol = SUIT_SYMBOL[card.suit]

  return (
    <Tag
      type={selectable ? "button" : undefined}
      onClick={onClick}
      aria-pressed={selectable ? raised : undefined}
      aria-label={`${SUIT_LABEL[card.suit]} ${card.rank}`}
      title={`${SUIT_LABEL[card.suit]} ${card.rank}`}
      style={{ color: suitColor }}
      className={cn(
        CARD_BASE,
        SIZES[size],
        selectable &&
          "cursor-pointer hover:-translate-y-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2FA98E]/50",
        raised && "-translate-y-5 ring-2 ring-[#2FA98E] ring-offset-1 ring-offset-white",
      )}
    >
      <span className={cn("flex flex-col items-start leading-none", CORNER_SIZES[size])}>
        <span className="font-bold tracking-tight">{card.rank}</span>
        <span className="leading-none">{symbol}</span>
      </span>

      <span className={cn("absolute inset-0 flex items-center justify-center leading-none", CENTER_SIZES[size])}>
        {symbol}
      </span>

      <span className={cn("flex rotate-180 flex-col items-start self-end leading-none", CORNER_SIZES[size])}>
        <span className="font-bold tracking-tight">{card.rank}</span>
        <span className="leading-none">{symbol}</span>
      </span>
    </Tag>
  )
}

export function CardBack({ size = "md" }: { size?: "xs" | "sm" | "md" | "lg" }) {
  return (
    <div
      aria-hidden="true"
      className={cn(BACK_BASE, BACK_BORDER, BACK_PATTERN, BACK_SIZES[size])}
    />
  )
}
