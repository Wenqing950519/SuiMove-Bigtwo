import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isGithubPages = process.env.GITHUB_PAGES === "true"
const customDomain = process.env.GITHUB_PAGES_CUSTOM_DOMAIN === "true"
const basePath = isGithubPages && !customDomain ? "/SuiMove-Bigtwo" : undefined

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 只有打包 GitHub Pages 靜態站時才用 export；一般開發/伺服器部署需保留 API 路由
  output: isGithubPages ? "export" : undefined,
  trailingSlash: true,
  basePath,
  turbopack: {
    root: __dirname,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
