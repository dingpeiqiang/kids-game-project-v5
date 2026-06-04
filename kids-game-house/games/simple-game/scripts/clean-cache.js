#!/usr/bin/env node

/**
 * Vite 缓存清理工具
 *
 * 清理内容：
 * 1. Vite 依赖预构建缓存 (node_modules/.vite)
 * 2. 构建产物 (dist)
 * 3. TypeScript 增量构建缓存 (*.tsbuildinfo)
 */

import { rmSync, existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

const pathsToClean = [
  join(rootDir, 'node_modules', '.vite'),
  join(rootDir, 'node_modules', '.cache'),
  join(rootDir, 'dist'),
]

console.log('Cleaning caches...\n')

let cleaned = 0

pathsToClean.forEach((dirPath) => {
  if (existsSync(dirPath)) {
    try {
      rmSync(dirPath, { recursive: true, force: true })
      console.log(`  cleaned: ${dirPath}`)
      cleaned++
    } catch (err) {
      console.error(`  failed: ${dirPath} - ${err.message}`)
    }
  }
})

// 清理 tsbuildinfo 文件
try {
  const files = readdirSync(rootDir)
  for (const f of files) {
    if (f.endsWith('.tsbuildinfo')) {
      rmSync(join(rootDir, f), { force: true })
      console.log(`  cleaned: ${join(rootDir, f)}`)
      cleaned++
    }
  }
} catch (_) {
  // 忽略读取目录错误
}

console.log(cleaned > 0 ? `\nDone. ${cleaned} item(s) cleaned.` : '\nNo cache found.')