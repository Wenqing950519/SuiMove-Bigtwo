import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isGithubPages = process.env.GITHUB_PAGES === "true"
const customDomain = process.env.GITHUB_PAGES_CUSTOM_DOMAIN === "true"
const basePath = isGithubPages && !customDomain ? "/SuiMove-Bigtwo" : undefined

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
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
