#!/usr/bin/env node

/**
 * 构建版本号生成脚本
 * 每次构建时在 dist 目录生成 version.json，用于前端检测版本更新
 *
 * 使用方式：
 *   node scripts/generate-version.js [outputDir]
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

function generateVersion() {
  const now = new Date()
  const y = now.getFullYear()
  const M = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  const s = String(now.getSeconds()).padStart(2, '0')
  return `${y}${M}${d}-${h}${m}${s}`
}

function main() {
  const outputDir = join(rootDir, process.argv[2] || 'dist')

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  const versionInfo = {
    version: generateVersion(),
    buildTime: new Date().toISOString(),
  }

  const filePath = join(outputDir, 'version.json')
  writeFileSync(filePath, JSON.stringify(versionInfo, null, 2))
  console.log(`Version: ${versionInfo.version} -> ${filePath}`)
}

main()