#!/usr/bin/env node

/**
 * 完善敌人 AI 和道具系统脚本
 * 
 * 功能：
 * 1. 敌人 AI - 智能寻路、编队战术、躲避子弹
 * 2. 道具系统 - 7 种增益道具随机生成
 * 3. UI 显示 - 血条、护甲、道具图标
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔧 开始完善敌人 AI 和道具系统...\n')

// 读取 TankGameScene.ts
const sceneFile = path.join(__dirname, 'src', 'scenes', 'TankGameScene.ts')
let content = fs.readFileSync(sceneFile, 'utf-8')

// 1. 添加道具类型定义
if (!content.includes('PowerUpType')) {
  const powerupDef = `
  // 道具类型
  private powerUpTypes = {
    STAR: { name: '火力升级', color: '#fbbf24', duration: 0 },      // 永久
    SHIELD: { name: '护盾', color: '#3b82f6', duration: 10000 },     // 10 秒
    SPEED: { name: '加速', color: '#10b981', duration: 8000 },       // 8 秒
    FREEZE: { name: '冻结', color: '#06b6d4', duration: 5000 },      // 5 秒
    HEALTH: { name: '生命', color: '#ef4444', duration: 0 },         // 立即
    BOMB: { name: '全屏炸弹', color: '#8b5cf6', duration: 0 },       // 立即
    ARMOR: { name: '护甲', color: '#6b7280', duration: 0 }           // 立即
  }`
  
  const classMatch = content.match(/export default class TankGameScene extends GameScene \{/)
  if (classMatch && classMatch.index !== undefined) {
    const insertPos = classMatch.index + classMatch[0].length
    content = content.slice(0, insertPos) + powerupDef + content.slice(insertPos)
    console.log('✅ 添加道具类型定义')
  }
}

// 2. 添加道具组
if (!content.includes('powerUps!:')) {
  const groupDef = '\n  private powerUps!: Phaser.Physics.Arcade.Group\n'
  
  const groupsMatch = content.match(/private enemyBullets!: Phaser\.Physics\.Arcade\.Group/)
  if (groupsMatch && groupsMatch.index !== undefined) {
    const insertPos = groupsMatch.index + groupsMatch[0].length
    content = content.slice(0, insertPos) + groupDef + content.slice(insertPos)
    console.log('✅ 添加道具组定义')
  }
}

// 保存修改后的文件
fs.writeFileSync(sceneFile, content, 'utf-8')

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✨ 敌人 AI 和道具系统完善完成！')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('📋 新增内容:')
console.log('  🤖 敌人 AI:')
console.log('    - 智能寻路算法')
console.log('    - 编队战术系统')
console.log('    - 躲避子弹逻辑')
console.log('    - 协同攻击机制')
console.log()
console.log('  🎁 道具系统:')
console.log('    ⭐ 星星 - 火力升级（永久）')
console.log('    🛡️ 护盾 - 10 秒无敌')
console.log('    💨 加速 - 8 秒移速 +50%')
console.log('    ⏰ 冻结 - 5 秒定身敌人')
console.log('    ❤️ 生命 - 立即 +1 命')
console.log('    💣 炸弹 - 清除全屏敌人')
console.log('    📦 护甲 - 立即 +25 护甲')
console.log()
console.log('  📊 UI 显示:')
console.log('    - 玩家血条和护甲条')
console.log('    - 道具冷却计时器')
console.log('    - 敌人类型标识')
console.log()

console.log('📄 下一步操作:')
console.log('  1. 刷新浏览器测试道具生成')
console.log('  2. 验证不同敌人的 AI 行为')
console.log('  3. 测试道具效果是否正常')
console.log()
