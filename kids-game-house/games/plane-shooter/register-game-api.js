#!/usr/bin/env node
/**
 * ✈️ 飞机大战游戏注册脚本（Node.js 版本）
 * 
 * 用法：
 *   npm run register
 *   或
 *   node register-game-api.js --url http://localhost:5173
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ────────────────────────────────────────────────────────────
// 配置
// ────────────────────────────────────────────────────────────

const GAME_CODE = 'plane-shooter'
const GAME_NAME = '飞机大战'
const DEFAULT_CONFIG = {
  gameUrl: 'http://localhost:5173',  // 默认开发环境地址
  creatorId: null
}

// ────────────────────────────────────────────────────────────
// 读取 GTRS.json
// ────────────────────────────────────────────────────────────

function readGTRSConfig() {
  const gtrsPath = join(__dirname, 'public', 'themes', 'plane_shooter_default', 'GTRS.json')
  try {
    const content = readFileSync(gtrsPath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error('❌ 读取 GTRS.json 失败:', error.message)
    process.exit(1)
  }
}

// ────────────────────────────────────────────────────────────
// 解析命令行参数
// ────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2)
  const config = { ...DEFAULT_CONFIG }
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) {
      config.gameUrl = args[i + 1]
      i++
    } else if (args[i] === '--creator' && args[i + 1]) {
      config.creatorId = parseInt(args[i + 1])
      i++
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
🎮 飞机大战游戏注册工具

用法:
  node register-game-api.js [选项]

选项:
  --url <URL>        游戏部署地址（默认：http://localhost:5173）
  --creator <ID>     创建人用户 ID（可选）
  --help, -h         显示帮助信息

示例:
  # 使用默认配置（本地开发）
  node register-game-api.js
  
  # 指定测试环境地址
  node register-game-api.js --url http://test.example.com
  
  # 指定生产环境地址和创建人
  node register-game-api.js --url https://game.example.com --creator 123
`)
      process.exit(0)
    }
  }
  
  return config
}

// ────────────────────────────────────────────────────────────
// 生成 SQL 脚本
// ────────────────────────────────────────────────────────────

function generateSQL(config) {
  const sqlTemplate = readFileSync(join(__dirname, 'register-game.sql'), 'utf-8')
  
  let sql = sqlTemplate
    .replace(/__GAME_URL__/g, config.gameUrl)
    .replace(/__CREATOR_ID__/g, config.creatorId || 'NULL')
  
  return sql
}

// ────────────────────────────────────────────────────────────
// 模拟数据库操作（实际应调用后端 API）
// ────────────────────────────────────────────────────────────

async function mockDatabaseOperation(config) {
  console.log('\n📋 准备注册数据...\n')
  
  const gameData = {
    game_code: GAME_CODE,
    game_name: GAME_NAME,
    category: 'ACTION',
    grade: '一年级',
    status: 2,  // 已上架
    game_url: config.gameUrl,
    icon_url: '/themes/plane_shooter_default/images/player.png',
    description: '经典飞机大战游戏，控制战斗机击落敌机，躲避子弹和撞击，收集强化道具，挑战最高分！支持多种难度等级。',
    sort_order: 4,
    create_time: Date.now(),
    update_time: Date.now()
  }
  
  const gtrsConfig = readGTRSConfig()
  
  const themeData = {
    theme_name: '飞机大战 - 星空蓝',
    author_name: '官方团队',
    status: 'on_sale',
    is_default: true,
    config_json: JSON.stringify(gtrsConfig),
    thumbnail_url: '/themes/plane_shooter_default/images/bg_main.png'
  }
  
  console.log('✅ 游戏数据:')
  console.log(JSON.stringify(gameData, null, 2))
  console.log('\n✅ 主题数据:')
  console.log(JSON.stringify(themeData, null, 2))
  
  console.log('\n\n⚠️  重要提示：\n')
  console.log('由于无法直接连接数据库，请手动执行以下步骤：\n')
  console.log('1️⃣  打开 MySQL 客户端或数据库管理工具')
  console.log(`2️⃣  选择您的数据库：USE your_database_name;`)
  console.log('3️⃣  执行以下 SQL 命令：\n')
  
  // 生成并显示简化的 SQL
  const sql = generateSQL(config)
  const simplifiedSQL = sql.split('\n').slice(0, 100).join('\n')
  console.log(simplifiedSQL)
  console.log('\n... (完整 SQL 请在 register-game.sql 中查看)\n')
  
  console.log('\n4️⃣  检查输出确认 game_id 和 theme_id')
  console.log('5️⃣  访问游戏平台验证是否显示\n')
}

// ────────────────────────────────────────────────────────────
// 主函数
// ────────────────────────────────────────────────────────────

async function main() {
  const config = parseArgs()
  
  console.log('🎮 飞机大战游戏注册工具\n')
  console.log('='.repeat(60))
  console.log(`📊 游戏代码：${GAME_CODE}`)
  console.log(`📝 游戏名称：${GAME_NAME}`)
  console.log(`🌐 部署地址：${config.gameUrl}`)
  console.log(`👤 创建人 ID: ${config.creatorId || '无'}`)
  console.log('='.repeat(60))
  console.log('')
  
  await mockDatabaseOperation(config)
}

main().catch(console.error)
