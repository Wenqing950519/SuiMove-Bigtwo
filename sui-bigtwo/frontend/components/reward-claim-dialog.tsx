"use client"

import { useMemo, useState } from "react"
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"
import { CircleDollarSign, ExternalLink, Loader2, Trophy, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  SUI_BIGTWO_CHAIN,
  SUI_BIGTWO_MODULE,
  SUI_BIGTWO_PACKAGE_ID,
  explorerObjectUrl,
  explorerTxUrl,
} from "@/lib/sui-config"
import { SEAT_NAMES } from "@/lib/use-big-two-game"
import { shortHash } from "@/lib/big-two"

interface RewardClaimDialogProps {
  open: boolean
  winnerSeat: number | null
  roomId: string | null
  claimReady?: boolean
  onClose: () => void
}

type ExecuteResult = {
  digest: string
}

const STAKE_LABEL = "0.1 testnet SUI"
const POT_LABEL = "0.4 testnet SUI"

const COPY = {
  title: "勝利結算",
  winner: "本局獲勝者",
  pot: "預期底池",
  stake: "每位玩家底注",
  claim: "鏈上領取底池",
  close: "關閉",
  noWallet: "請先連接 Sui Wallet，才能送出領獎交易。",
  noRoom: "尚未建立鏈上 GameRoom，請先在右側按「押注並鏈上建立」。",
  notFinalized: "目前只有建立房間與押注上鏈，完整牌局尚未同步到鏈上結束狀態，所以現在不能真的領取底池。",
  chainNote: "這個按鈕會呼叫 Move 的 claim_pot。只有當鏈上 GameRoom 已經結束、且目前錢包是鏈上記錄的 winner 時，交易才會成功。",
  localNote: "目前桌面遊戲是 demo 模擬；它會引導領獎流程，但不會自動把每一步出牌同步到鏈上。",
  pending: "等待錢包簽名領獎交易...",
  success: "領獎交易已送出",
  fail: "領獎失敗",
} as const

export function RewardClaimDialog({ open, winnerSeat, roomId, claimReady = false, onClose }: RewardClaimDialogProps) {
  const currentAccount = useCurrentAccount()
  const client = useSuiClient()
  const [txDigest, setTxDigest] = useState<string | null>(null)
  const [message, setMessage] = useState<string>("")

  const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction<ExecuteResult>({
    execute: async ({ bytes, signature }) => {
      const result = await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showEvents: true,
          showEffects: true,
        },
      })
      return { digest: result.digest }
    },
  })

  const winnerName = winnerSeat === null ? "--" : SEAT_NAMES[winnerSeat]
  const disabledReason = useMemo(() => {
    if (!currentAccount) return COPY.noWallet
    if (!roomId) return COPY.noRoom
    if (!claimReady) return COPY.notFinalized
    return ""
  }, [claimReady, currentAccount, roomId])
  const canClaim = !!currentAccount && !!roomId && claimReady && !isPending

  function claimPot() {
    if (!roomId) {
      setMessage(COPY.noRoom)
      return
    }

    if (!claimReady) {
      setMessage(COPY.notFinalized)
      return
    }

    const tx = new Transaction()
    tx.moveCall({
      target: `${SUI_BIGTWO_PACKAGE_ID}::${SUI_BIGTWO_MODULE}::claim_pot`,
      arguments: [tx.object(roomId)],
    })

    setMessage(COPY.pending)
    signAndExecuteTransaction(
      {
        transaction: tx,
        chain: SUI_BIGTWO_CHAIN,
      },
      {
        onSuccess: (result) => {
          setTxDigest(result.digest)
          setMessage(COPY.success)
        },
        onError: (error) => {
          setMessage(`${COPY.fail}: ${error.message}`)
        },
      },
    )
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border bg-background p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-amber-400/20 text-amber-700">
              <Trophy className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">{COPY.title}</h2>
              <p className="text-sm text-muted-foreground">{COPY.winner}: {winnerName}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="關閉">
            <X className="size-4" />
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-md border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CircleDollarSign className="size-3.5" />
              {COPY.stake}
            </div>
            <div className="mt-1 font-mono text-sm font-semibold">{STAKE_LABEL}</div>
          </div>
          <div className="rounded-md border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground">{COPY.pot}</div>
            <div className="mt-1 font-mono text-sm font-semibold">{POT_LABEL}</div>
          </div>
        </div>

        {roomId && (
          <a
            href={explorerObjectUrl(roomId)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center justify-between rounded-md border px-3 py-2 text-xs hover:bg-muted/40"
          >
            <span className="text-muted-foreground">GameRoom</span>
            <span className="flex items-center gap-1 font-mono">
              {shortHash(roomId)}
              <ExternalLink className="size-3" />
            </span>
          </a>
        )}

        <div className="mt-4 space-y-2 rounded-md border border-amber-400/40 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">
          <p>{COPY.chainNote}</p>
          <p>{COPY.localNote}</p>
        </div>

        {(disabledReason || message) && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {message || disabledReason}
          </p>
        )}

        {txDigest && (
          <a
            href={explorerTxUrl(txDigest)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center justify-between rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs hover:underline"
          >
            <span className="text-emerald-700">{COPY.success}</span>
            <span className="flex items-center gap-1 font-mono">
              {shortHash(txDigest)}
              <ExternalLink className="size-3" />
            </span>
          </a>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{COPY.close}</Button>
          <Button onClick={claimPot} disabled={!canClaim}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <CircleDollarSign className="size-4" />}
            {COPY.claim}
          </Button>
        </div>
      </div>
    </div>
  )
}