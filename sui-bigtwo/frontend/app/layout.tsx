import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next"
import "@mysten/dapp-kit/dist/index.css"
import "./globals.css"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "Sui Big Two｜可驗證多人牌局 MVP",
  description:
    "一個使用 Sui Move 思路設計的可驗證大老二 MVP，包含多人房間、後端規則驗證、commit-reveal、event replay 與 stake/claim 路徑。",
  generator: "codex",
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-Hant" className="bg-background">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
