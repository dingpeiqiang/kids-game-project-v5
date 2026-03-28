/**
 * 资源生成脚本
 * 用法: node generate-resources.mjs
 *
 * 支持生成:
 * - 纯色背景图片
 * - Emoji 素材图
 * - 简单几何图形
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// =============================================
// 游戏配置（修改这里）
// =============================================
const GAME_CONFIG = {
  gameId: '__GAME_ID__',
  gameName: '__GAME_NAME__',
  outputDir: './public/resources/__GAME_ID__',

  // 资源配置
  resources: {
    // 场景资源
    scene: {
      background: { type: 'color', color: '#87CEEB', width: 800, height: 600 }
    },

    // 道具资源
    items: {
      food: { type: 'emoji', emoji: '🍎', size: 40 },
      speedBoost: { type: 'emoji', emoji: '⚡', size: 40 },
      shield: { type: 'emoji', emoji: '🛡️', size: 40 }
    },

    // 角色资源
    characters: {},

    // 特效资源
    effects: {}
  }
}

// =============================================
// SVG 生成函数
// =============================================

function generateColorSvg(options) {
  const { color, width = 100, height = 100 } = options
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="${color}"/>
</svg>`
}

function generateEmojiSvg(options) {
  const { emoji, size = 40 } = options
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <style>
    text { font-size: ${size * 0.8}px; text-anchor: middle; dominant-baseline: central; }
  </style>
  <text x="50%" y="50%">${emoji}</text>
</svg>`
}

function generateShapeSvg(options) {
  const { shape = 'rect', color = '#4CAF50', width = 40, height = 40 } = options

  let shapeElement = ''
  switch (shape) {
    case 'circle':
      shapeElement = `<circle cx="${width/2}" cy="${height/2}" r="${Math.min(width, height)/2}" fill="${color}"/>`
      break
    case 'triangle':
      shapeElement = `<polygon points="${width/2},0 ${width},${height} 0,${height}" fill="${color}"/>`
      break
    default:
      shapeElement = `<rect width="${width}" height="${height}" fill="${color}" rx="5"/>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  ${shapeElement}
</svg>`
}

// =============================================
// 主函数
// =============================================

function generateResource(type, name, options) {
  let svgContent = ''

  switch (options.type) {
    case 'color':
      svgContent = generateColorSvg(options)
      break
    case 'emoji':
      svgContent = generateEmojiSvg(options)
      break
    case 'shape':
      svgContent = generateShapeSvg(options)
      break
    default:
      console.warn(`  ⚠️  未知资源类型: ${options.type}`)
      return
  }

  const outputPath = join(GAME_CONFIG.outputDir, type, `${name}.svg`)
  const dir = dirname(outputPath)

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  writeFileSync(outputPath, svgContent, 'utf8')
  console.log(`  ✅ ${outputPath}`)
}

function main() {
  console.log(`\n🎮 生成游戏资源: ${GAME_CONFIG.gameName} (${GAME_CONFIG.gameId})\n`)

  // 确保输出目录存在
  if (!existsSync(GAME_CONFIG.outputDir)) {
    mkdirSync(GAME_CONFIG.outputDir, { recursive: true })
  }

  // 生成各类资源
  for (const [type, resources] of Object.entries(GAME_CONFIG.resources)) {
    console.log(`📁 ${type}/`)
    for (const [name, options] of Object.entries(resources)) {
      generateResource(type, name, options)
    }
  }

  console.log(`\n✨ 资源生成完成！`)
  console.log(`📂 输出目录: ${GAME_CONFIG.outputDir}\n`)
}

main()
