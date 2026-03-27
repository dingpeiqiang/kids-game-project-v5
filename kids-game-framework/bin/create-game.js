#!/usr/bin/env node

/**
 * Kids Game Scaffold - 项目生成器
 *
 * 用法:
 *   node bin/create-game.js my-game
 *   node bin/create-game.js --name "接金币" --emoji "🪙"
 *   node bin/create-game.js                    # 交互式模式
 *
 * 参数:
 *   --name, -n       游戏中文名（如 "快乐贪吃蛇"）
 *   --name-en        游戏英文名（如 "snake"，用于目录/包名）
 *   --emoji, -e      游戏 emoji（如 "🐍"）
 *   --subtitle       游戏副标题
 *   --hints          操作提示 JSON 数组（如 '["点击屏幕开始","滑动收集金币"]'）
 *   --output, -o     输出目录（默认: ../games/）
 *   --id             游戏 ID（数字，后端 gameId，可选）
 */

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createInterface } from 'readline'

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
 * 递归替换文件内容中的模板变量
 */
async function replaceInFiles(dir, replacements) {
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const filePath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      await replaceInFiles(filePath, replacements)
    } else {
      // 只处理文本文件
      const ext = path.extname(entry.name).toLowerCase()
      const textExts = ['.vue', '.ts', '.js', '.json', '.html', '.css', '.md']
      if (!textExts.includes(ext)) continue

      try {
        let content = await fs.readFile(filePath, 'utf-8')
        let changed = false

        for (const [key, value] of Object.entries(replacements)) {
          const placeholder = `{{${key}}}`
          if (content.includes(placeholder)) {
            content = content.replaceAll(placeholder, value)
            changed = true
          }
        }

        if (changed) {
          await fs.writeFile(filePath, content, 'utf-8')
        }
      } catch {
        // 忽略二进制文件读取错误
      }
    }
  }
}

/**
 * 解析命令行参数
 */
function parseArgs(args) {
  const config = {
    gameName: null,
    gameNameEn: null,
    gameEmoji: null,
    gameSubtitle: null,
    gameHints: null,
    gameId: null,
    outputDir: null
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--name' || arg === '-n') {
      config.gameName = args[i + 1]
      i++
    } else if (arg === '--name-en') {
      config.gameNameEn = args[i + 1]
      i++
    } else if (arg === '--emoji' || arg === '-e') {
      config.gameEmoji = args[i + 1]
      i++
    } else if (arg === '--subtitle') {
      config.gameSubtitle = args[i + 1]
      i++
    } else if (arg === '--hints') {
      config.gameHints = args[i + 1]
      i++
    } else if (arg === '--id') {
      config.gameId = args[i + 1]
      i++
    } else if (arg === '--output' || arg === '-o') {
      config.outputDir = args[i + 1]
      i++
    } else if (!arg.startsWith('-') && !config.gameNameEn) {
      // 位置参数 → 英文名
      config.gameNameEn = arg
    }
  }

  return config
}

/**
 * 交互式输入
 */
function question(rl, prompt, defaultValue) {
  return new Promise((resolve) => {
    const display = defaultValue ? `${prompt} (${defaultValue}): ` : `${prompt}: `
    rl.question(display, (answer) => {
      resolve(answer.trim() || defaultValue || '')
    })
  })
}

/**
 * 主函数
 */
async function main() {
  const args = parseArgs(process.argv.slice(2))

  // 判断是否需要交互式输入
  const needInteractive = !args.gameName || !args.gameNameEn || !args.gameEmoji

  let gameName, gameNameEn, gameEmoji, gameSubtitle, gameHints, gameId

  if (needInteractive) {
    console.log('\n🎮 Kids Game 脚手架 — 创建新游戏\n')

    const rl = createInterface({ input: process.stdin, output: process.stdout })

    gameNameEn = args.gameNameEn || await question(rl, '游戏英文标识（用于目录名）', 'my-game')
    gameName = args.gameName || await question(rl, '游戏中文名', gameNameEn)
    gameEmoji = args.gameEmoji || await question(rl, '游戏 Emoji', '🎮')
    gameSubtitle = args.gameSubtitle || await question(rl, '游戏副标题', '开始你的冒险吧！')
    const hintsStr = args.gameHints || await question(rl, '操作提示（逗号分隔）', '键盘方向键 / WASD 控制方向,空格键暂停')
    gameHints = `["${hintsStr.split(',').map(h => h.trim()).join('","')}"]`
    gameId = args.gameId || await question(rl, '游戏 ID（后端 gameId，回车跳过）', '')

    rl.close()
  } else {
    gameName = args.gameName
    gameNameEn = args.gameNameEn
    gameEmoji = args.gameEmoji
    gameSubtitle = args.gameSubtitle || '开始你的冒险吧！'
    gameId = args.gameId || ''
    gameHints = args.gameHints || `["键盘方向键 / WASD 控制方向","空格键暂停"]`
  }

  // 游戏描述
  const gameDescription = `${gameName} - 一款有趣的儿童游戏`

  // 输出目录
  const outputDir = args.outputDir || path.join(ROOT_DIR, '..', 'games')

  // 目标路径
  const targetPath = path.join(outputDir, gameNameEn)

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
  console.log(`\n📦 创建游戏项目: ${gameName} (${gameNameEn})`)
  console.log(`   模板: ${TEMPLATE_DIR}`)
  console.log(`   输出: ${targetPath}\n`)

  await copyDir(TEMPLATE_DIR, targetPath)

  // PhaserGame 类名（首字母大写 + PhaserGame）
  const gamePhaserClass = gameNameEn.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('') + 'PhaserGame'

  // 模板变量替换
  const replacements = {
    'GAME_ID': gameId || gameNameEn,
    'GAME_NAME': gameName,
    'GAME_NAME_EN': gameNameEn,
    'GAME_CODE': gameNameEn.toUpperCase(),
    'GAME_EMOJI': gameEmoji,
    'GAME_SUBTITLE': gameSubtitle,
    'GAME_DESCRIPTION': gameDescription,
    'GAME_HINTS': gameHints,
    'GAME_PHASER_CLASS': gamePhaserClass
  }

  console.log('📝 替换模板变量...')
  await replaceInFiles(targetPath, replacements)

  // 修改 package.json 中的名称（已在模板替换中完成）
  console.log('✅ 项目创建成功!')
  console.log('\n   下一步:')
  console.log(`   cd ${path.relative(process.cwd(), targetPath)}`)
  console.log('   npm install')
  console.log('   npm run dev')
  console.log('\n   然后开始开发你的游戏！\n')
}

main().catch(console.error)
