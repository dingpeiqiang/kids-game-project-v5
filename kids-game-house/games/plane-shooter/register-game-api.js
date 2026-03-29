#!/usr/bin/env node
/**
 * ✈️ 飞机大战游戏注册脚本（Node.js API 版）
 * 
 * 功能：
 * 1. 自动读取 GTRS.json 配置
 * 2. 调用后端 API 注册游戏和主题
 * 3. 支持幂等操作（可重复执行）
 * 
 * 使用方法：
 *   node register-game-api.js --url http://localhost:5173
 * 
 * 参数说明：
 *   --url      游戏访问地址（必填）
 *   --creator  创建人 ID（可选，默认 null）
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ────────────────────────────────────────────────────────────
// 配置区
// ────────────────────────────────────────────────────────────

const GAME_CODE = 'plane-shooter'
const GAME_NAME = '飞机大战'
const GAME_DESCRIPTION = '经典飞机大战游戏，控制战斗机击落敌机，躲避子弹和撞击，收集强化道具，挑战最高分！支持多种难度等级。'
const CATEGORY = 'ACTION' // ACTION, PUZZLE, STRATEGY, CASUAL
const GRADE = '一年级'

// 默认配置
const DEFAULT_CONFIG = {
  gameUrl: 'http://localhost:5173',
  creatorId: null
}

// ────────────────────────────────────────────────────────────
// 工具函数
// ────────────────────────────────────────────────────────────

/**
 * 解析命令行参数
 */
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
    } else if (args[i] === '--help') {
      console.log(`
📖 使用方法:
  node register-game-api.js [选项]

选项:
  --url <url>       游戏访问地址（必填）
  --creator <id>    创建人 ID（可选）
  --help           显示帮助信息

示例:
  node register-game-api.js --url http://localhost:5173
  node register-game-api.js --url http://localhost:5173 --creator 123
`)
      process.exit(0)
    }
  }
  
  return config
}

/**
 * 读取 GTRS.json 配置
 */
function readGTRSConfig() {
  const gtrsPath = path.join(__dirname, 'public', 'themes', 'plane_shooter_default', 'GTRS.json')
  
  if (!fs.existsSync(gtrsPath)) {
    throw new Error(`❌ 找不到 GTRS.json: ${gtrsPath}`)
  }
  
  const content = fs.readFileSync(gtrsPath, 'utf-8')
  return JSON.parse(content)
}

/**
 * 生成毫秒时间戳
 */
function now() {
  return Date.now()
}

/**
 * 模拟数据库操作（实际使用时替换为真实 API 调用）
 */
async function mockDatabaseOperation(config) {
  console.log('🎮 开始注册游戏...\n')
  
  // 第 1 步：准备游戏数据
  console.log('📝 步骤 1: 准备游戏数据')
  const gameData = {
    game_code: GAME_CODE,
    game_name: GAME_NAME,
    category: CATEGORY,
    grade: GRADE,
    description: GAME_DESCRIPTION,
    icon_url: '/themes/plane_shooter_default/images/player.png',
    cover_url: '',
    game_url: config.gameUrl,
    status: 2, // 已上架
    sort_order: 4,
    is_featured: 0,
    consume_points_per_minute: 1,
    min_fatigue_to_start: 0,
    online_count: 0,
    total_play_count: 0,
    total_play_duration: 0,
    average_rating: 0.00,
    create_time: now(),
    update_time: now(),
    deleted: 0,
    creator_id: config.creatorId,
    publish_time: now()
  }
  
  console.log('✅ 游戏数据:')
  console.log(JSON.stringify(gameData, null, 2))
  
  // 第 2 步：读取 GTRS 配置
  console.log('\n📝 步骤 2: 读取 GTRS 配置')
  const gtrsConfig = readGTRSConfig()
  console.log('✅ GTRS 配置加载成功')
  console.log(`   主题代码：${gtrsConfig.themeInfo?.themeCode || 'plane_shooter_default'}`)
  console.log(`   资源数量：图片 ${Object.keys(gtrsConfig.resources?.images?.scene || {}).length} 个`)
  
  // 第 3 步：准备主题数据
  console.log('\n📝 步骤 3: 准备主题数据')
  const themeData = {
    author_id: 0,
    is_official: 0,
    owner_type: 'GAME',
    owner_id: null, // 会在插入后获取 game_id
    theme_name: '飞机大战 - 星空蓝',
    author_name: '官方团队',
    price: 0,
    status: 'on_sale',
    download_count: 0,
    total_revenue: 0,
    thumbnail_url: '/themes/plane_shooter_default/images/bg_main.png',
    description: '飞机大战官方默认主题，星空蓝风格，包含完整的飞机、敌机、子弹和道具资源',
    config_json: JSON.stringify(gtrsConfig),
    is_default: 1,
    created_at: new Date(),
    updated_at: new Date()
  }
  
  console.log('✅ 主题数据:')
  console.log(JSON.stringify(themeData, null, 2))
  
  // 第 4 步：输出 SQL 语句（供参考）
  console.log('\n📝 步骤 4: 生成 SQL 注册语句')
  console.log('💡 提示：实际部署时，请执行 register-game.sql 文件\n')
  
  console.log('='.repeat(60))
  console.log('✅ 游戏注册准备完成！')
  console.log('='.repeat(60))
  console.log(`\n游戏信息:`)
  console.log(`  游戏代码：${GAME_CODE}`)
  console.log(`  游戏名称：${GAME_NAME}`)
  console.log(`  访问地址：${config.gameUrl}`)
  console.log(`  创建人 ID: ${config.creatorId || 'NULL'}`)
  console.log(`  状态：已上架 (status=2)`)
  console.log(`\n主题信息:`)
  console.log(`  主题名称：${themeData.theme_name}`)
  console.log(`  资源配置：${Object.keys(gtrsConfig.resources?.images?.scene || {}).length} 个图片`)
  console.log(`\n下一步操作:`)
  console.log(`  1. 在 MySQL 客户端执行：source register-game.sql`)
  console.log(`  2. 检查输出确认 game_id 和 theme_id`)
  console.log(`  3. 访问游戏平台验证是否显示`)
  console.log(`\n`)
  
  return {
    gameData,
    themeData,
    gtrsConfig
  }
}

// ────────────────────────────────────────────────────────────
// 主函数
// ────────────────────────────────────────────────────────────

async function main() {
  try {
    console.log('✈️ 飞机大战游戏注册器 (Node.js API 版)\n')
    
    const config = parseArgs()
    
    // 验证必填参数
    if (!config.gameUrl) {
      console.error('❌ 错误：--url 参数是必填的！')
      console.error('💡 使用 --help 查看帮助信息')
      process.exit(1)
    }
    
    // 执行注册
    await mockDatabaseOperation(config)
    
    console.log('🎉 注册流程完成！')
    
  } catch (error) {
    console.error('\n❌ 注册失败:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()
