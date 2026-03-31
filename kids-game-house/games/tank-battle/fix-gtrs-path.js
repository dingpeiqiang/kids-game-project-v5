#!/usr/bin/env node

/**
 * 自动修复脚本 - 复制 GTRS.json 到 public 目录并修正路径
 * 
 * 使用方法:
 * node fix-gtrs-path.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 源文件和目标路径
const srcGTRS = path.join(__dirname, 'src', 'config', 'GTRS.json')
const publicDir = path.join(__dirname, 'public', 'themes', 'tank_default')
const destGTRS = path.join(publicDir, 'GTRS.json')

console.log('🔧 开始修复 GTRS 路径问题...\n')

// 读取源 GTRS
if (!fs.existsSync(srcGTRS)) {
  console.error('❌ 错误：找不到源 GTRS.json')
  process.exit(1)
}

const gtrs = JSON.parse(fs.readFileSync(srcGTRS, 'utf-8'))

// 检查资源是否存在
const sceneDir = path.join(publicDir, 'assets', 'scene')
const audioDir = path.join(publicDir, 'assets', 'audio')

let imageCount = 0
let audioCount = 0

// 验证图片资源
if (gtrs.resources?.images?.scene) {
  Object.keys(gtrs.resources.images.scene).forEach(key => {
    const filename = key + '.png'
    const filePath = path.join(sceneDir, filename)
    if (fs.existsSync(filePath)) {
      imageCount++
    } else {
      console.warn(`⚠️  警告：图片不存在 - ${filename}`)
    }
  })
}

// 验证音频资源（占位符可以不存在）
if (gtrs.resources?.audio?.bgm) {
  audioCount += Object.keys(gtrs.resources.audio.bgm).length
}
if (gtrs.resources?.audio?.effect) {
  audioCount += Object.keys(gtrs.resources.audio.effect).length
}

console.log(`✅ 找到 ${imageCount} 个图片资源`)
console.log(`ℹ️  音频资源：${audioCount} 个（开发阶段使用 WebAudio，占位符可选）`)

// 确保目标目录存在
if (!fs.existsSync(publicDir)) {
  console.log(`📁 创建目录：${publicDir}`)
  fs.mkdirSync(publicDir, { recursive: true })
}

// 写入 GTRS.json 到 public 目录
fs.writeFileSync(destGTRS, JSON.stringify(gtrs, null, 2), 'utf-8')
console.log(`\n✅ GTRS.json 已复制到：${destGTRS}`)

// 更新 GameScene.ts 中的导入路径
const gameSceneFile = path.join(__dirname, 'src', 'scenes', 'GameScene.ts')
let gameSceneContent = fs.readFileSync(gameSceneFile, 'utf-8')

// 替换导入方式：从动态 import 改为 fetch
const oldImport = `import('@/config/GTRS.json').then((gtrsModule) => {
      const gtrs = gtrsModule.default`
    
const newImport = `fetch('/themes/tank_default/GTRS.json')
      .then(res => res.json())
      .then((gtrs) => {`

gameSceneContent = gameSceneContent.replace(oldImport, newImport)

// 还需要修改 catch 块
const oldCatch = `}).catch(error => {
      console.error('加载 GTRS 配置失败:', error)
    })`

const newCatch = `})
      .catch(error => {
        console.error('加载 GTRS 配置失败:', error)
      })`

gameSceneContent = gameSceneContent.replace(oldCatch, newCatch)

fs.writeFileSync(gameSceneFile, gameSceneContent, 'utf-8')
console.log(`✅ GameScene.ts 已更新为使用 fetch 加载 GTRS`)

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✨ GTRS 路径修复完成！')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('📋 下一步操作:')
console.log('1. 重启开发服务器: npm run dev')
console.log('2. 刷新浏览器测试游戏')
console.log('3. 如果还有问题，检查浏览器控制台\n')
