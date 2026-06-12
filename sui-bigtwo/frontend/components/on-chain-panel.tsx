"use client"

import { useMemo, useState } from "react"
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"
import { CircleDollarSign, ExternalLink, Link2, Loader2, RadioTower, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  SUI_BIGTWO_CHAIN,
  SUI_BIGTWO_MODULE,
  SUI_BIGTWO_NETWORK,
  SUI_BIGTWO_PACKAGE_ID,
  SUI_BIGTWO_PUBLISH_DIGEST,
  explorerObjectUrl,
  explorerTxUrl,
} from "@/lib/sui-config"
import { shortHash } from "@/lib/big-two"

type ObjectChange = {
  type: string
  objectType?: string
  objectId?: string
  owner?: unknown
}

type ExecuteResult = {
  digest: string
  objectChanges?: ObjectChange[]
  events?: unknown[]
  rawEffects?: number[]
}

interface OnChainPanelProps {
  commitment: string | null
  onRoomCreated?: (roomId: string) => void
}

const STAKE_MIST = 100_000_000
const STAKE_LABEL = "0.1 testnet SUI"
const FULL_POT_LABEL = "0.4 testnet SUI"

const COPY = {
  title: "鏈上可驗證",
  network: "Sui testnet",
  connectHint: "先連接 Sui Wallet，再把目前牌局的承諾雜湊與底注送上鏈。",
  readyHint: "已取得牌堆承諾雜湊，可以送出押注建立房間交易。",
  packageLabel: "Package",
  publishLabel: "Publish tx",
  createRoom: "押注並鏈上建立",
  noCommitment: "請先按「建立房間」產生牌堆承諾",
  connected: "已連接",
  disconnected: "未連接",
  roomLabel: "GameRoom",
  txLabel: "Create room tx",
  pending: "等待錢包簽名押注交易...",
  success: "鏈上房間已建立",
  fail: "交易失敗",
  stakeTitle: "固定底注",
  stakeBody: `建立房間時會鎖入 ${STAKE_LABEL}；4 人滿桌後底池應為 ${FULL_POT_LABEL}，終局由 winner 呼叫 claim_pot 領走。`,
} as const

function hexToBytes(hex: string): number[] {
  const value = hex.startsWith("0x") ? hex.slice(2) : hex
  if (value.length % 2 !== 0) throw new Error("Invalid hex commitment")
  const bytes: number[] = []
  for (let i = 0; i < value.length; i += 2) {
    bytes.push(Number.parseInt(value.slice(i, i + 2), 16))
  }
  return bytes
}

function findCreatedRoomId(result: ExecuteResult): string | null {
  const change = result.objectChanges?.find(
    (item) =>
      item.type === "created" &&
      item.objectType === `${SUI_BIGTWO_PACKAGE_ID}::${SUI_BIGTWO_MODULE}::GameRoom` &&
      typeof item.objectId === "string",
  )
  return change?.objectId ?? null
}

export function OnChainPanel({ commitment, onRoomCreated }: OnChainPanelProps) {
  const currentAccount = useCurrentAccount()
  const client = useSuiClient()
  const [roomId, setRoomId] = useState<string | null>(null)
  const [txDigest, setTxDigest] = useState<string | null>(null)
  const [message, setMessage] = useState<string>(COPY.connectHint)

  const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction<ExecuteResult>({
    execute: async ({ bytes, signature }) => {
      const result = await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showObjectChanges: true,
          showEvents: true,
          showRawEffects: true,
        },
      })

      return {
        digest: result.digest,
        objectChanges: result.objectChanges ?? undefined,
        events: result.events ?? undefined,
        rawEffects: result.rawEffects ?? undefined,
      }
    },
  })

  const canCreateRoom = !!currentAccount && !!commitment && !isPending
  const statusMessage = useMemo(() => {
    if (message !== COPY.connectHint) return message
    if (!currentAccount) return COPY.connectHint
    if (!commitment) return COPY.noCommitment
    return COPY.readyHint
  }, [commitment, currentAccount, message])

  const accountLabel = useMemo(() => {
    if (!currentAccount) return COPY.disconnected
    return `${COPY.connected} ${shortHash(currentAccount.address)}`
  }, [currentAccount])

  function createOnChainRoom() {
    if (!commitment) {
      setMessage(COPY.noCommitment)
      return
    }

    const tx = new Transaction()
    const [stakeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(STAKE_MIST)])
    tx.moveCall({
      target: `${SUI_BIGTWO_PACKAGE_ID}::${SUI_BIGTWO_MODULE}::create_room_with_stake`,
      arguments: [tx.pure.vector("u8", hexToBytes(commitment)), stakeCoin],
    })

    setMessage(COPY.pending)
    signAndExecuteTransaction(
      {
        transaction: tx,
        chain: SUI_BIGTWO_CHAIN,
      },
      {
        onSuccess: (result) => {
          const createdRoom = findCreatedRoomId(result)
          setTxDigest(result.digest)
          setRoomId(createdRoom)
          if (createdRoom) onRoomCreated?.(createdRoom)
          setMessage(createdRoom ? COPY.success : "交易成功，但未找到 GameRoom object change")
        },
        onError: (error) => {
          setMessage(`${COPY.fail}: ${error.message}`)
        },
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <RadioTower className="size-4" />
            {COPY.title}
          </span>
          <Badge variant="outline" className="font-mono text-[10px]">
            {SUI_BIGTWO_NETWORK}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">{accountLabel}</span>
          <ConnectButton connectText="連接錢包" />
        </div>

        <div className="rounded-md border border-amber-400/40 bg-amber-50 p-3 text-sm text-amber-950">
          <div className="flex items-center gap-2 font-medium">
            <CircleDollarSign className="size-4" />
            {COPY.stakeTitle}: {STAKE_LABEL}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/80">{COPY.stakeBody}</p>
        </div>

        <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{COPY.packageLabel}</span>
            <a
              href={explorerObjectUrl(SUI_BIGTWO_PACKAGE_ID)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 font-mono text-xs text-foreground hover:underline"
            >
              {shortHash(SUI_BIGTWO_PACKAGE_ID)}
              <ExternalLink className="size-3" />
            </a>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{COPY.publishLabel}</span>
            <a
              href={explorerTxUrl(SUI_BIGTWO_PUBLISH_DIGEST)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 font-mono text-xs text-foreground hover:underline"
            >
              {shortHash(SUI_BIGTWO_PUBLISH_DIGEST)}
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>

        <Button onClick={createOnChainRoom} disabled={!canCreateRoom}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
          {COPY.createRoom}
        </Button>

        <p className="text-xs leading-relaxed text-muted-foreground">{statusMessage}</p>

        {(roomId || txDigest) && (
          <div className="space-y-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
            <div className="flex items-center gap-2 font-medium text-emerald-700">
              <ShieldCheck className="size-4" />
              {COPY.success}
            </div>
            {roomId && (
              <a
                href={explorerObjectUrl(roomId)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 text-xs hover:underline"
              >
                <span className="text-muted-foreground">{COPY.roomLabel}</span>
                <span className="flex items-center gap-1 font-mono text-foreground">
                  {shortHash(roomId)}
                  <ExternalLink className="size-3" />
                </span>
              </a>
            )}
            {txDigest && (
              <a
                href={explorerTxUrl(txDigest)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 text-xs hover:underline"
              >
                <span className="text-muted-foreground">{COPY.txLabel}</span>
                <span className="flex items-center gap-1 font-mono text-foreground">
                  {shortHash(txDigest)}
                  <ExternalLink className="size-3" />
                </span>
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}