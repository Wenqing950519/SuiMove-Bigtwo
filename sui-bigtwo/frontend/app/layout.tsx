import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "@mysten/dapp-kit/dist/index.css"
import "./globals.css"
import { Providers } from "./providers"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Sui \u5927\u8001\u4e8c\uff5c\u53ef\u9a57\u8b49\u724c\u5c40 Demo",
  description:
    "\u4e00\u500b\u4f7f\u7528 Sui Move \u601d\u8def\u8a2d\u8a08\u7684 Web3 \u5927\u8001\u4e8c Demo\uff0c\u5305\u542b\u724c\u5806\u627f\u8afe\u3001\u63ed\u793a\u9a57\u8b49\u8207\u4e8b\u4ef6\u6b77\u53f2\u3002",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
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
    <html lang="zh-Hant" className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}