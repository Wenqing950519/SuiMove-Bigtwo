"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Database,
  Fingerprint,
  Hash,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react"
import {
  ConnectModal,
  useCurrentAccount,
  useDisconnectWallet,
  useSignPersonalMessage,
  useSuiClientQuery,
} from "@mysten/dapp-kit"

import { CardBack, PlayingCard } from "@/components/playing-card"
import { Button } from "@/components/ui/button"
import type { Card } from "@/lib/big-two"
import { analyzePlay, containsThreeClubs, isValidPlay, shortHash } from "@/lib/big-two"
import { explorerObjectUrl, explorerTxUrl } from "@/lib/sui-config"

const SEAT_LABELS = ["南家", "西家", "北家", "東家"]

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string }

type RoomSummary = {
  code: string
  stake: string
  seats: string
  filled: number
  status: string
  rawStatus?: string
  tone: "open" | "soon" | "waiting" | "playing" | "done"
  chainRoomId?: string | null
  permanent?: boolean
}

type ActiveRoomPayload = { seatIndex: number; room: RoomSummary } | null

type GamePayload = {
  code: string
  status: "WAITING" | "STARTING" | "PLAYING" | "FINISHED"
  stakeAmount: string
  chainRoomId: string | null
  mySeat: number | null
  players: { seatIndex: number; walletAddress: string; shortAddress: string; nickname?: string | null; isBot?: boolean; stakeTxDigest?: string | null }[]
  game: null | {
    status: string | null
    currentTurn: number | null
    lastPlay: null | { seat: number; cards: Card[] }
    ownHand: Card[]
    remainingCounts: number[]
    winnerSeat: number | null
    canReveal: boolean
  }
  verification: null | {
    deckCommitment: string
    shortDeckCommitment: string
    myHandCommitment: string | null
    shortMyHandCommitment: string | null
    eventHead: string | null
    shortEventHead: string | null
    eventCount: number
    revealHash: string | null
    shortRevealHash: string | null
    replayStatus: "PENDING" | "PASS" | "FAIL" | string
    stakeMode: "backend-verified" | "sui-escrow-linked"
    claimTxDigest: string | null
    audit: null | {
      deckIds: number[]
      deckSaltHex: string
      handSaltsHex: string[]
      originalHands: number[][]
      events: { eventIndex: number; kind: string; playerSeat: number | null; payload: unknown }[]
    }
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init })
  const json = (await res.json()) as ApiResult<T>
  if (!res.ok || !json.ok) throw new Error(json.ok ? "Request failed" : json.error)
  return json.data
}

function normalizeRoomCode(value: string) {
  return value.replace(/[^a-z]/gi, "").toUpperCase().slice(0, 4)
}

function seatPlayer(game: GamePayload | null, seat: number) {
  return game?.players.find((player) => player.seatIndex === seat) ?? null
}

export default function V2MvpPage() {
  const account = useCurrentAccount()
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage()
  const { mutate: disconnect } = useDisconnectWallet()
  const { data: balanceData } = useSuiClientQuery(
    "getBalance",
    { owner: account?.address ?? "" },
    { enabled: !!account?.address },
  )

  const [authed, setAuthed] = useState(false)
  const [signing, setSigning] = useState(false)
  const [rooms, setRooms] = useState<RoomSummary[]>([])
  const [activeRoom, setActiveRoom] = useState<ActiveRoomPayload>(null)
  const [roomCodeInput, setRoomCodeInput] = useState("")
  const [activeCode, setActiveCode] = useState<string | null>(null)
  const [game, setGame] = useState<GamePayload | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const balanceSui = balanceData ? Number(balanceData.totalBalance) / 1e9 : null
  const canEnterRooms = authed && (balanceSui === null || balanceSui >= 1)

  const refreshRooms = useCallback(async () => {
    const [roomData, activeData] = await Promise.all([
      requestJson<RoomSummary[]>("/api/rooms"),
      requestJson<ActiveRoomPayload>("/api/rooms/active"),
    ])
    setRooms(roomData)
    setActiveRoom(activeData)
  }, [])

  const refreshGame = useCallback(async (code: string) => {
    const data = await requestJson<GamePayload>(`/api/rooms/${code}/game`)
    setGame(data)
    return data
  }, [])

  useEffect(() => {
    if (!authed) return
    const initial = window.setTimeout(() => {
      void refreshRooms().catch((error) => setNotice(error.message))
    }, 0)
    const timer = window.setInterval(() => {
      void refreshRooms().catch(() => {})
    }, 3500)
    return () => {
      window.clearTimeout(initial)
      window.clearInterval(timer)
    }
  }, [authed, refreshRooms])

  useEffect(() => {
    if (!activeCode) return
    const initial = window.setTimeout(() => {
      void refreshGame(activeCode).catch((error) => setNotice(error.message))
    }, 0)
    const timer = window.setInterval(() => {
      void refreshGame(activeCode).catch(() => {})
    }, 1500)
    return () => {
      window.clearTimeout(initial)
      window.clearInterval(timer)
    }
  }, [activeCode, refreshGame])

  const signIn = useCallback(async () => {
    if (!account) return
    setSigning(true)
    setNotice(null)
    try {
      const me = await fetch("/api/auth/me").then((res) => res.json()).catch(() => null)
      if (me?.data?.address === account.address) {
        setAuthed(true)
        return
      }
      const nonce = await requestJson<{ nonce: string; message: string }>("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: account.address }),
      })
      const { signature } = await signPersonalMessage({ message: new TextEncoder().encode(nonce.message) })
      await requestJson("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: account.address, signature, nonce: nonce.nonce }),
      })
      setAuthed(true)
    } catch (error) {
      setNotice((error as Error).message)
    } finally {
      setSigning(false)
    }
  }, [account, signPersonalMessage])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!account) {
        setAuthed(false)
        setActiveCode(null)
        setGame(null)
        return
      }
      void signIn()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [account, signIn])

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
    setAuthed(false)
    setActiveCode(null)
    setGame(null)
    disconnect()
  }

  const createRoom = async () => {
    if (!canEnterRooms) return
    setBusy(true)
    setNotice(null)
    try {
      const room = await requestJson<RoomSummary>("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      setActiveCode(room.code)
      await refreshRooms()
      await refreshGame(room.code)
    } catch (error) {
      setNotice((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const joinRoom = async (code: string) => {
    const target = normalizeRoomCode(code)
    if (!target || !canEnterRooms) return
    setBusy(true)
    setNotice(null)
    try {
      await requestJson(`/api/rooms/${target}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      setActiveCode(target)
      await refreshRooms()
      await refreshGame(target)
    } catch (error) {
      setNotice((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const postGameAction = async (body: unknown) => {
    if (!activeCode) return
    setBusy(true)
    setNotice(null)
    try {
      const updated = await requestJson<GamePayload>(`/api/rooms/${activeCode}/game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      setGame(updated)
      setSelectedIds([])
    } catch (error) {
      setNotice((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const selectedCards = useMemo(() => {
    const ownHand = game?.game?.ownHand ?? []
    return ownHand.filter((card) => selectedIds.includes(card.id))
  }, [game, selectedIds])

  const playCheck = useMemo(() => {
    if (!game?.game || game.mySeat === null) return { ok: false, reason: "尚未入座" }
    if (game.game.currentTurn !== game.mySeat) return { ok: false, reason: "還沒輪到你" }
    if (selectedCards.length === 0) return { ok: false, reason: "請選牌" }
    if (analyzePlay(selectedCards).type === "none") return { ok: false, reason: "不合法牌型" }
    if (game.verification?.eventCount === 1 && !containsThreeClubs(selectedCards)) {
      return { ok: false, reason: "首輪必須包含梅花 3" }
    }
    if (!isValidPlay(selectedCards, game.game.lastPlay?.cards ?? [])) return { ok: false, reason: "壓不過上一手" }
    return { ok: true, reason: "可以出牌" }
  }, [game, selectedCards])

  const canPass = !!game?.game?.lastPlay && game.mySeat !== null && game.game.currentTurn === game.mySeat && game.verification?.eventCount !== 1

  const leaveRoomByCode = async (code: string) => {
    setBusy(true)
    setNotice(null)
    try {
      await requestJson<GamePayload>(`/api/rooms/${code}/game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "abandon" }),
      })
      if (activeCode === code) {
        setActiveCode(null)
        setGame(null)
      }
      await refreshRooms()
    } catch (error) {
      setNotice((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const abandonRoom = async () => {
    if (!activeCode) return
    await leaveRoomByCode(activeCode)
  }

  if (!account || !authed) {
    return (
      <main className="min-h-screen bg-[#f6f3eb] text-[#243233]">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-[#ded8c9] bg-white shadow-sm">
            <ShieldCheck className="h-10 w-10 text-[#1f8f78]" />
          </div>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.28em] text-[#1f8f78]">Sui Big Two V2 MVP</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">可驗證多人牌桌</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#667273]">
            這個版本把 V2 做成獨立 MVP：錢包登入、真實房間、後端發牌與規則驗證、多人同步輪詢、commit-reveal、event replay 與 stake/claim 路徑說明。
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            {!account ? (
              <ConnectModal
                trigger={
                  <Button className="h-12 rounded-full bg-[#1f8f78] px-7 text-white hover:bg-[#187966]">
                    <WalletCards className="mr-2 h-4 w-4" /> 連接 Sui Wallet
                  </Button>
                }
              />
            ) : (
              <Button onClick={signIn} disabled={signing} className="h-12 rounded-full bg-[#1f8f78] px-7 text-white hover:bg-[#187966]">
                {signing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                簽署登入
              </Button>
            )}
            <Link href="/v2/docs" className="text-sm font-medium text-[#667273] underline-offset-4 hover:underline">
              查看原始文件
            </Link>
          </div>
          {notice ? <p className="mt-5 text-sm text-[#a1443d]">{notice}</p> : null}
        </div>
      </main>
    )
  }

  if (!activeCode) {
    return (
      <main className="min-h-screen bg-[#f6f3eb] text-[#243233]">
        <div className="mx-auto max-w-6xl px-5 py-8">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ded8c9] pb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1f8f78]">Lobby</p>
              <h1 className="mt-1 text-3xl font-semibold">V2 多人房間</h1>
              <p className="mt-1 text-sm text-[#667273]">目前採 server-authoritative state + polling，同一房間的玩家會看到相同牌局狀態。</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/v2/docs" className="rounded-full border border-[#ded8c9] bg-white px-3 py-1.5 text-sm font-semibold text-[#1f8f78] hover:bg-[#fbfaf6]">
                V2 文件
              </Link>
              <span className="rounded-full border border-[#ded8c9] bg-white px-3 py-1.5 text-sm font-semibold">
                {account.address.slice(0, 6)}...{account.address.slice(-4)}
              </span>
              <span className="rounded-full border border-[#ded8c9] bg-white px-3 py-1.5 text-sm font-semibold">
                {balanceSui === null ? "讀取餘額" : `${balanceSui.toFixed(2)} SUI`}
              </span>
              <Button variant="outline" onClick={logout} className="rounded-full bg-white">登出</Button>
            </div>
          </header>

          {balanceSui !== null && balanceSui < 1 ? (
            <div className="mt-5 rounded-md border border-[#ddb6ac] bg-[#fff1ed] px-4 py-3 text-sm text-[#963f37]">
              你的 testnet SUI 少於 1，暫時不能建立或加入房間。請先到 faucet 領取測試幣。
            </div>
          ) : null}
          {activeRoom ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#f0d8a5] bg-[#fff8e8] px-4 py-3 text-sm text-[#7f5a13]">
              <span>
                你目前在房間 <strong className="font-mono tracking-[0.12em]">{activeRoom.room.code}</strong> 中
                {activeRoom.room.permanent ? "，這是永久 AI 等候房，離開後 AI 會繼續等待。" : "。"}
              </span>
              <span className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setActiveCode(activeRoom.room.code)
                    void refreshGame(activeRoom.room.code)
                  }}
                  className="h-8 rounded-full bg-white px-3 text-xs"
                >
                  回到房間
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => leaveRoomByCode(activeRoom.room.code)}
                  className="h-8 rounded-full bg-white px-3 text-xs text-[#963f37] hover:text-[#963f37]"
                >
                  離開
                </Button>
              </span>
            </div>
          ) : null}
          {notice ? <div className="mt-5 rounded-md border border-[#ddb6ac] bg-[#fff1ed] px-4 py-3 text-sm text-[#963f37]">{notice}</div> : null}

          <section className="grid gap-5 py-7 lg:grid-cols-[1fr_340px]">
            <div className="overflow-hidden rounded-lg border border-[#ded8c9] bg-white shadow-sm">
              <div className="grid grid-cols-[1fr_100px_100px_72px] border-b border-[#ebe5d7] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[#7a8585]">
                <span>房間</span><span>底注</span><span>座位</span><span className="text-right">操作</span>
              </div>
              <div className="divide-y divide-[#eee8da]">
                {rooms.map((room) => (
                  <button
                    key={room.code}
                    type="button"
                    onClick={() => joinRoom(room.code)}
                    disabled={busy || !canEnterRooms || room.rawStatus === "FINISHED"}
                    className="grid w-full grid-cols-[1fr_100px_100px_72px] items-center px-5 py-4 text-left transition hover:bg-[#fbfaf6] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>
                      <span className="font-mono text-2xl font-bold tracking-[0.12em]">{room.code}</span>
                      <span className="ml-3 text-sm text-[#667273]">{room.status}</span>
                    </span>
                    <span className="text-sm font-semibold">{room.stake}</span>
                    <span className="text-sm font-semibold">{room.seats}</span>
                    <span className="text-right"><ArrowLeft className="ml-auto h-4 w-4 rotate-180" /></span>
                  </button>
                ))}
                {rooms.length === 0 ? <p className="px-5 py-8 text-sm text-[#667273]">目前沒有等待中的房間。</p> : null}
              </div>
            </div>

            <aside className="rounded-lg border border-[#ded8c9] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">建立或加入</h2>
              <p className="mt-2 text-sm leading-6 text-[#667273]">MVP 規則要求四位真人入座後才能開始。首輪必須出梅花 3，所有出牌由後端再次驗證。</p>
              <Button onClick={createRoom} disabled={busy || !canEnterRooms} className="mt-5 h-11 w-full rounded-full bg-[#1f8f78] text-white hover:bg-[#187966]">
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                建立房間
              </Button>
              <div className="mt-5 flex gap-2">
                <input
                  value={roomCodeInput}
                  onChange={(event) => setRoomCodeInput(normalizeRoomCode(event.target.value))}
                  placeholder="KQAZ"
                  className="h-11 min-w-0 flex-1 rounded-full border border-[#ded8c9] bg-[#fbfaf6] px-4 font-mono text-sm uppercase outline-none focus:border-[#1f8f78]"
                />
                <Button variant="outline" onClick={() => joinRoom(roomCodeInput)} disabled={busy || roomCodeInput.length !== 4} className="h-11 rounded-full bg-white">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </aside>
          </section>
        </div>
      </main>
    )
  }

  const currentTurn = game?.game?.currentTurn ?? null
  const isMyTurn = game?.mySeat !== null && currentTurn === game?.mySeat && game?.status === "PLAYING"
  const needsPlayers = (game?.players.length ?? 0) < 4
  const gameStarted = !!game?.game
  const winnerSeat = game?.game?.winnerSeat ?? null

  return (
    <main className="min-h-screen bg-[#f6f3eb] text-[#243233]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ded8c9] pb-5">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => { setActiveCode(null); setGame(null); }} className="rounded-full bg-white">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1f8f78]">Room <span className="font-mono">{activeCode}</span></p>
              <h1 className="text-2xl font-semibold">多人可驗證 MVP</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#ded8c9] bg-white px-3 py-1.5 text-sm font-semibold">{game?.status ?? "載入中"}</span>
            <Link href="/v2/docs" className="rounded-full border border-[#ded8c9] bg-white px-3 py-2 text-sm font-semibold text-[#1f8f78] hover:bg-[#fbfaf6]">
              V2 文件
            </Link>
            <Button variant="outline" onClick={() => activeCode && refreshGame(activeCode)} className="rounded-full bg-white">
              <RefreshCw className="mr-2 h-4 w-4" /> 同步
            </Button>
            <Button variant="outline" onClick={abandonRoom} disabled={busy} className="rounded-full bg-white text-[#963f37] hover:text-[#963f37]">
              離開並釋放房間
            </Button>
          </div>
        </header>

        {notice ? <div className="mt-4 rounded-md border border-[#ddb6ac] bg-[#fff1ed] px-4 py-3 text-sm text-[#963f37]">{notice}</div> : null}

        <section className="grid gap-5 py-5 xl:grid-cols-[1fr_380px]">
          <div className="rounded-lg border border-[#ded8c9] bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-4">
              {[0, 1, 2, 3].map((seat) => {
                const player = seatPlayer(game, seat)
                const active = currentTurn === seat && game?.status === "PLAYING"
                const remaining = game?.game?.remainingCounts[seat] ?? 0
                return (
                  <div key={seat} className={`rounded-lg border p-3 ${active ? "border-[#1f8f78] bg-[#effaf6]" : "border-[#ebe5d7] bg-[#fbfaf6]"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{SEAT_LABELS[seat]}</span>
                      {game?.mySeat === seat ? <span className="rounded-full bg-[#1f8f78] px-2 py-0.5 text-xs font-semibold text-white">你</span> : null}
                    </div>
                    <p className="mt-1 truncate font-mono text-xs text-[#667273]">{player ? `${player.nickname ?? player.shortAddress}${player.isBot ? " · AI" : ""}` : "空位"}</p>
                    <div className="mt-3 flex h-12 items-center overflow-hidden">
                      {remaining > 0 ? Array.from({ length: remaining }).map((_, index) => (
                        <div key={index} className="-mr-5"><CardBack size="xs" /></div>
                      )) : <span className="text-xs text-[#667273]">{gameStarted ? "已出完" : "等待發牌"}</span>}
                    </div>
                  </div>
                )
              })}
            </div>

            {!gameStarted ? (
              <div className="mt-5 rounded-lg border border-[#ebe5d7] bg-[#fbfaf6] p-5 text-center">
                <Users className="mx-auto h-8 w-8 text-[#1f8f78]" />
                <h2 className="mt-3 text-lg font-semibold">等待四位玩家入座</h2>
                <p className="mt-2 text-sm text-[#667273]">目前 {game?.players.length ?? 0}/4。滿四人後任一入座玩家可以開始，後端會產生 deck commitment 並發牌。</p>
                <Button onClick={() => postGameAction({ intent: "start" })} disabled={busy || needsPlayers} className="mt-4 rounded-full bg-[#1f8f78] text-white hover:bg-[#187966]">
                  <Play className="mr-2 h-4 w-4" /> 開始牌局
                </Button>
              </div>
            ) : (
              <>
                <div className="mt-5 rounded-lg border border-[#ebe5d7] bg-[#eef4ef] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#667273]">上一手</p>
                  <div className="mt-3 flex min-h-[116px] items-center justify-center gap-2">
                    {game?.game?.lastPlay?.cards.length ? game.game.lastPlay.cards.map((card) => <PlayingCard key={card.id} card={card} size="lg" />) : <span className="text-sm text-[#667273]">尚未有人出牌</span>}
                  </div>
                  <p className="text-center text-sm text-[#667273]">
                    {winnerSeat !== null ? `${SEAT_LABELS[winnerSeat]} 勝出` : currentTurn !== null ? `輪到 ${SEAT_LABELS[currentTurn]}` : "等待同步"}
                  </p>
                </div>

                <div className="mt-5 rounded-lg border border-[#ebe5d7] bg-[#fbfaf6] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1f8f78]">你的手牌</p>
                      <h2 className="text-lg font-semibold">{game?.game?.ownHand.length ?? 0} 張</h2>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => postGameAction({ intent: "pass" })} disabled={busy || !canPass} className="rounded-full bg-white">PASS</Button>
                      <Button onClick={() => postGameAction({ intent: "play", cardIds: selectedIds })} disabled={busy || !playCheck.ok} className="rounded-full bg-[#1f8f78] text-white hover:bg-[#187966]">
                        出牌{selectedIds.length ? ` ${selectedIds.length}` : ""}
                      </Button>
                    </div>
                  </div>
                  <p className={`mt-2 text-sm ${playCheck.ok ? "text-[#1f8f78]" : "text-[#963f37]"}`}>{isMyTurn ? playCheck.reason : "等待其他玩家行動"}</p>
                  <div className="mt-4 flex min-h-[136px] items-end overflow-x-auto pb-3 pl-1 pr-8">
                    {(game?.game?.ownHand ?? []).map((card) => (
                      <div key={card.id} className="-mr-5 shrink-0">
                        <PlayingCard
                          card={card}
                          size="lg"
                          selectable
                          raised={selectedIds.includes(card.id)}
                          onClick={() => setSelectedIds((current) => current.includes(card.id) ? current.filter((id) => id !== card.id) : [...current, card.id])}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-[#ded8c9] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1f8f78]">Verification</p>
                  <h2 className="text-xl font-semibold">可信閉環</h2>
                </div>
                {game?.verification?.replayStatus === "PASS" ? <CheckCircle2 className="h-6 w-6 text-[#1f8f78]" /> : <Clock className="h-6 w-6 text-[#c49a3a]" />}
              </div>
              <div className="mt-4 space-y-2">
                <VerifyRow icon={<Hash className="h-4 w-4" />} label="Deck commitment" value={game?.verification?.shortDeckCommitment ?? "等待開始"} />
                <VerifyRow icon={<Fingerprint className="h-4 w-4" />} label="My hand commitment" value={game?.verification?.shortMyHandCommitment ?? "入座後顯示"} />
                <VerifyRow icon={<Database className="h-4 w-4" />} label="Event chain" value={game?.verification?.shortEventHead ?? "等待事件"} />
                <VerifyRow icon={<RefreshCw className="h-4 w-4" />} label="Event count" value={`${game?.verification?.eventCount ?? 0}`} />
                <VerifyRow icon={<ShieldCheck className="h-4 w-4" />} label="Replay" value={game?.verification?.replayStatus ?? "PENDING"} />
              </div>
              {game?.chainRoomId ? (
                <a href={explorerObjectUrl(game.chainRoomId)} target="_blank" rel="noreferrer" className="mt-3 block truncate rounded-md border border-[#ebe5d7] bg-[#fbfaf6] px-3 py-2 font-mono text-xs text-[#1f8f78] underline-offset-4 hover:underline">
                  Sui room: {shortHash(game.chainRoomId)}
                </a>
              ) : (
                <div className="mt-3 rounded-md border border-[#f0d8a5] bg-[#fff8e8] px-3 py-2 text-xs leading-5 text-[#7f5a13]">
                  Stake escrow path 已在 transaction builders 中補齊；目前 hidden-hand MVP 先以 backend commitment + replay 作可信閉環，正式上鏈 escrow 需搭配不明文保存手牌的合約版本。
                </div>
              )}
              {game?.verification?.claimTxDigest ? (
                <a href={explorerTxUrl(game.verification.claimTxDigest)} target="_blank" rel="noreferrer" className="mt-2 block truncate font-mono text-xs text-[#1f8f78] underline-offset-4 hover:underline">
                  Claim tx: {shortHash(game.verification.claimTxDigest)}
                </a>
              ) : null}
            </div>

            <div className="rounded-lg border border-[#ded8c9] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#c49a3a]" />
                <h2 className="font-semibold">MVP 規則</h2>
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[#667273]">
                <li>四位玩家入座後才能開始。</li>
                <li>首輪必須包含梅花 3。</li>
                <li>後端驗證牌型、牌權、輪次與是否壓過上一手。</li>
                <li>完局後 reveal deck/salt，並用事件重放驗證 winner。</li>
              </ul>
            </div>

            {game?.verification?.audit ? (
              <div className="rounded-lg border border-[#ded8c9] bg-white p-5 shadow-sm">
                <h2 className="font-semibold">Post-game Audit</h2>
                <div className="mt-3 space-y-2 text-xs text-[#667273]">
                  <p>Deck salt: <code className="font-mono">{shortHash(game.verification.audit.deckSaltHex)}</code></p>
                  <p>Reveal hash: <code className="font-mono">{game.verification.shortRevealHash}</code></p>
                  <p>Events: {game.verification.audit.events.length}</p>
                </div>
              </div>
            ) : null}
          </aside>
        </section>
      </div>
    </main>
  )
}

function VerifyRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-[#ebe5d7] bg-[#fbfaf6] px-3 py-2">
      <span className="flex items-center gap-2 text-sm font-medium text-[#667273]">{icon}{label}</span>
      <code className="font-mono text-xs font-semibold text-[#243233]">{value}</code>
    </div>
  )
}
