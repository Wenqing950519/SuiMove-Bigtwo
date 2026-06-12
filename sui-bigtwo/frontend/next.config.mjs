import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isGithubPages = process.env.GITHUB_PAGES === "true"

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isGithubPages ? "/SuiMove-Bigtwo" : undefined,
  turbopack: {
    root: __dirname,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig