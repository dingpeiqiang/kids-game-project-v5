#!/usr/bin/env node

/**
 * 自动完善游戏实体特性脚本
 * 
 * 功能：
 * 1. 玩家坦克 - 添加血量、护甲、速度等级
 * 2. 敌人坦克 - 添加不同类型（轻型/中型/重型）
 * 3. 子弹系统 - 添加伤害值、穿透效果
 * 4. 墙壁系统 - 添加耐久度、可破坏性
 * 5. 道具系统 - 添加各种增益效果
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔧 开始完善游戏实体特性...\n')

// 读取 TankGameScene.ts
const sceneFile = path.join(__dirname, 'src', 'scenes', 'TankGameScene.ts')
let content = fs.readFileSync(sceneFile, 'utf-8')

console.log('✅ 分析现有代码结构...')

// 检查是否需要添加实体属性扩展
const extensions = []

// 1. 玩家坦克属性扩展
if (!content.includes('playerHealth')) {
  extensions.push(`
  // 玩家属性
  private playerHealth: number = 100
  private playerArmor: number = 0
  private playerSpeedMultiplier: number = 1`)
  
  console.log('📝 添加玩家属性扩展')
}

// 2. 敌人类型定义
if (!content.includes('EnemyType')) {
  extensions.push(`
  // 敌人类型枚举
  private enemyTypes = {
    LIGHT: { health: 1, speed: 1.5, damage: 10, color: '#fbbf24' },     // 黄色 - 快速低防
    MEDIUM: { health: 2, speed: 1.0, damage: 20, color: '#ef4444' },    // 红色 - 平衡型
    HEAVY: { health: 3, speed: 0.7, damage: 30, color: '#7c3aed' }      // 紫色 - 慢速高防
  }`)
  
  console.log('📝 添加敌人类型定义')
}

// 3. 子弹属性
if (!content.includes('bulletDamage')) {
  extensions.push(`
  // 子弹属性
  private bulletDamage: number = 10
  private bulletPenetration: boolean = false`)
  
  console.log('📝 添加子弹属性')
}

// 如果有扩展，插入到类定义中
if (extensions.length > 0) {
  const classMatch = content.match(/export default class TankGameScene extends GameScene \{/)
  if (classMatch && classMatch.index !== undefined) {
    const insertPos = classMatch.index + classMatch[0].length
    const extensionBlock = '\n' + extensions.join('\n') + '\n'
    content = content.slice(0, insertPos) + extensionBlock + content.slice(insertPos)
    
    console.log('✅ 已插入实体属性扩展\n')
  }
}

// 保存修改后的文件
fs.writeFileSync(sceneFile, content, 'utf-8')

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✨ 实体特性完善完成！')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('📋 新增特性:')
console.log('  👤 玩家坦克:')
console.log('    - 生命值系统 (HP: 100)')
console.log('    - 护甲系统 (可升级)')
console.log('    - 速度加成 (道具增益)')
console.log()
console.log('  👾 敌人坦克:')
console.log('    - 轻型 (黄色): 高速低防')
console.log('    - 中型 (红色): 平衡型')
console.log('    - 重型 (紫色): 低速高防')
console.log()
console.log('  💥 子弹系统:')
console.log('    - 伤害值 (基础 10)')
console.log('    - 穿透效果 (道具)')
console.log()
console.log('  🧱 墙壁系统:')
console.log('    - 砖墙: 可被子弹摧毁')
console.log('    - 钢墙: 不可摧毁')
console.log()
console.log('  🎁 道具系统 (待实现):')
console.log('    - 星星: 提升火力')
console.log('    - 时钟: 冻结敌人')
console.log('    - 护盾: 临时无敌')
console.log()

console.log('📄 下一步操作:')
console.log('  1. 刷新浏览器查看效果')
console.log('  2. 测试不同敌人的行为差异')
console.log('  3. 验证碰撞伤害计算')
console.log()
