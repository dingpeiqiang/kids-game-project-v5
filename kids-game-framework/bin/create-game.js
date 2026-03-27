#!/usr/bin/env node

/**
 * Kids Game Scaffold - 项目生成器
 *
 * 用法:
 *   node bin/create-game.js my-game
 *   node bin/create-game.js                    # 交互式模式
 *
 * 参数:
 *   --name, -n     游戏名称（英文，用于目录名）
 *   --output, -o   输出目录（默认: ../games/）
 *
 * 说明:
 *   此脚本复制 template 目录作为游戏起点
 *   游戏开发者需要根据游戏需求修改代码
 */

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const TEMPLATE_DIR = path.join(ROOT_DIR, 'template')

/**
 * 复制目录
 */
async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath)
    } else {
      await fs.copyFile(srcPath, destPath)
    }
  }
}

/**
 * 解析命令行参数
 */
function parseArgs(args) {
  const config = {
    gameName: null,
    outputDir: null
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--name' || arg === '-n') {
      config.gameName = args[i + 1]
      i++
    } else if (arg === '--output' || arg === '-o') {
      config.outputDir = args[i + 1]
      i++
    } else if (!arg.startsWith('-')) {
      config.gameName = arg
    }
  }

  return config
}

/**
 * 主函数
 */
async function main() {
  const args = parseArgs(process.argv.slice(2))

  // 游戏名称（目录名）
  const gameName = args.gameName || 'my-game'

  // 输出目录
  const outputDir = args.outputDir || path.join(ROOT_DIR, '..', 'games')

  // 目标路径
  const targetPath = path.join(outputDir, gameName)

  // 检查目标目录是否存在
  try {
    await fs.access(targetPath)
    console.error(`❌ 目录已存在: ${targetPath}`)
    console.log('   请使用不同的游戏名称，或先删除已有目录')
    process.exit(1)
  } catch {
    // 目录不存在，继续
  }

  // 复制模板
  console.log(`\n📦 创建游戏项目: ${gameName}`)
  console.log(`   模板: ${TEMPLATE_DIR}`)
  console.log(`   输出: ${targetPath}\n`)

  await copyDir(TEMPLATE_DIR, targetPath)

  // 修改 package.json 中的名称
  const packageJsonPath = path.join(targetPath, 'package.json')
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
  packageJson.name = `${gameName}-game`
  packageJson.description = `${gameName} - 基于 Kids Game Framework`
  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))

  console.log('✅ 项目创建成功!')
  console.log('\n   下一步:')
  console.log(`   cd ${path.relative(process.cwd(), targetPath)}`)
  console.log('   npm install')
  console.log('   npm run dev')
  console.log('\n   然后开始开发你的游戏！\n')
}

main().catch(console.error)
