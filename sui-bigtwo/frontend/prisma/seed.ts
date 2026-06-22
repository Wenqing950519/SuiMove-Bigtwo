import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// 預設兩間人機房：一間 3 個人機（坐滿座位 1-3，使用者進來補座位 0 即可開打），
// 一間 2 個人機。其餘房間由使用者自己建立。
const BOT_NAMES = ["AI 北家", "AI 西家", "AI 東家"]

const SEED_ROOMS = [
  { code: "ROBO", bots: 3 },
  { code: "DUOS", bots: 2 },
]

function botWallet(roomCode: string, seat: number): string {
  // 以房號+座位產生穩定且唯一的人機位址
  const tag = `${roomCode}${seat}`
  let hex = ""
  for (let i = 0; i < tag.length; i += 1) hex += tag.charCodeAt(i).toString(16).padStart(2, "0")
  return "0x" + hex.padEnd(40, "0").slice(0, 40)
}

async function main() {
  // 清掉舊的示範資料（roomPlayer 會隨 room 一起 cascade）
  await prisma.roomPlayer.deleteMany({})
  await prisma.room.deleteMany({})

  for (const { code, bots } of SEED_ROOMS) {
    const room = await prisma.room.create({
      data: { code, status: "WAITING" },
    })
    for (let seat = 1; seat <= bots; seat += 1) {
      const walletAddress = botWallet(code, seat)
      const user = await prisma.user.upsert({
        where: { walletAddress },
        update: { nickname: BOT_NAMES[seat - 1] },
        create: { walletAddress, nickname: BOT_NAMES[seat - 1] },
      })
      await prisma.roomPlayer.create({
        data: { roomId: room.id, userId: user.id, seatIndex: seat, walletAddress },
      })
    }
  }

  console.log(`Seed 完成：ROBO（3 人機）、DUOS（2 人機）已建立`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
