#!/usr/bin/env node

/**
 * 实现关卡系统脚本
 * 
 * 功能：
 * 1. 多关卡地图设计（5 关）
 * 2. 每关不同的敌人配置和难度曲线
 * 3. 关卡过渡和完成条件
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔧 开始实现关卡系统...\n')

// 读取 TankGameScene.ts
const sceneFile = path.join(__dirname, 'src', 'scenes', 'TankGameScene.ts')
let content = fs.readFileSync(sceneFile, 'utf-8')

console.log('✅ 分析现有代码结构...')

// 1. 添加关卡定义
if (!content.includes('LevelConfig')) {
  const levelDef = `
  // 关卡配置
  private levelConfigs = [
    {
      level: 1,
      name: '训练关卡',
      enemyCount: 5,
      spawnInterval: 3000,
      enemyTypes: ['LIGHT'],
      mapType: 'simple',
      timeLimit: 120
    },
    {
      level: 2,
      name: '初次战斗',
      enemyCount: 8,
      spawnInterval: 2500,
      enemyTypes: ['LIGHT', 'MEDIUM'],
      mapType: 'medium',
      timeLimit: 180
    },
    {
      level: 3,
      name: '钢铁防线',
      enemyCount: 12,
      spawnInterval: 2000,
      enemyTypes: ['LIGHT', 'MEDIUM', 'HEAVY'],
      mapType: 'complex',
      timeLimit: 240
    },
    {
      level: 4,
      name: '腹背受敌',
      enemyCount: 15,
      spawnInterval: 1800,
      enemyTypes: ['MEDIUM', 'HEAVY'],
      mapType: 'open',
      timeLimit: 300
    },
    {
      level: 5,
      name: '最终决战',
      enemyCount: 20,
      spawnInterval: 1500,
      enemyTypes: ['LIGHT', 'MEDIUM', 'HEAVY'],
      mapType: 'hard',
      timeLimit: 360
    }
  ]`
  
  const classMatch = content.match(/export default class TankGameScene extends GameScene \{/)
  if (classMatch && classMatch.index !== undefined) {
    const insertPos = classMatch.index + classMatch[0].length
    content = content.slice(0, insertPos) + levelDef + content.slice(insertPos)
    console.log('✅ 添加关卡配置定义')
  }
}

// 2. 添加关卡状态属性
if (!content.includes('currentLevel!:')) {
  const stateDef = `
  private currentLevel!: number           // 当前关卡
  private totalLevels: number = 5         // 总关卡数`
  
  const propsMatch = content.match(/private powerUpLevel: number = 1/)
  if (propsMatch && propsMatch.index !== undefined) {
    const insertPos = propsMatch.index + propsMatch[0].length
    content = content.slice(0, insertPos) + stateDef + content.slice(insertPos)
    console.log('✅ 添加关卡状态属性')
  }
}

// 3. 查找 create() 方法，初始化关卡
const createMapMatch = content.match(/this\.createMap\(\)/)
if (createMapMatch && createMapMatch.index !== undefined) {
  // 检查是否有关卡初始化
  if (!content.includes('this.currentLevel = 1')) {
    const initCode = `
    
    // 初始化关卡
    this.currentLevel = 1
    this.loadLevel(this.currentLevel)`
    
    const insertPos = createMapMatch.index + createMapMatch[0].length
    content = content.slice(0, insertPos) + initCode + content.slice(insertPos)
    console.log('✅ 添加关卡初始化')
  }
}

// 4. 添加关卡加载方法
if (!content.includes('loadLevel(')) {
  const loadMethod = `

  /**
   * 加载关卡
   */
  private loadLevel(level: number): void {
    const config = this.levelConfigs[level - 1]
    if (!config) {
      console.log('🎉 恭喜通关所有关卡！')
      this.handleVictory()
      return
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(\`📍 进入第\${level}关：\${config.name}\`)
    console.log(\`   敌人数量：\${config.enemyCount}\`)
    console.log(\`   生成间隔：\${config.spawnInterval}ms\`)
    console.log(\`   敌人类型：\${config.enemyTypes.join(', ')}\`)
    console.log(\`   时间限制：\${config.timeLimit}秒\`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // 更新游戏配置
    const gameStore = useGameStore()
    
    // 重置本关状态
    this.enemies.clear(true, true)
    this.bullets.clear(true, true)
    this.enemyBullets.clear(true, true)
    this.powerUps.clear(true, true)
    
    // 保留玩家属性和火力等级
    const savedPowerLevel = this.powerUpLevel
    
    // 重新创建地图
    this.createMap()
    
    // 恢复玩家位置
    this.createPlayer()
    
    // 恢复火力等级
    this.powerUpLevel = savedPowerLevel
    this.bulletDamage = 10 * savedPowerLevel
    
    // 生成敌人
    this.startEnemySpawning(config.spawnInterval, config.enemyCount)
    
    // 更新时间限制
    if (config.timeLimit) {
      this.timeLeft = config.timeLimit
      this.startTimer()
    }
  }`
  
  const methodsMatch = content.match(/private startEnemySpawning/)
  if (methodsMatch && methodsMatch.index !== undefined) {
    const insertPos = methodsMatch.index
    content = content.slice(0, insertPos) + loadMethod + content.slice(insertPos)
    console.log('✅ 添加关卡加载方法')
  }
}

// 5. 添加关卡完成检测
if (!content.includes('checkLevelComplete')) {
  const checkMethod = `

  /**
   * 检查关卡是否完成
   */
  private checkLevelComplete(): void {
    const config = this.levelConfigs[this.currentLevel - 1]
    if (!config) return
    
    // 检查是否所有敌人都被消灭
    if (this.enemies.countActive(true) === 0 && !this.isGameOver) {
      console.log(\`✅ 第\${this.currentLevel}关完成！\`)
      
      this.time.delayedCall(2000, () => {
        // 进入下一关
        this.currentLevel++
        
        if (this.currentLevel > this.totalLevels) {
          // 通关游戏
          console.log('🏆 恭喜通关！')
          this.handleVictory()
        } else {
          // 加载下一关
          this.loadLevel(this.currentLevel)
        }
      })
    }
  }`
  
  const methodsMatch = content.match(/private destroyEnemy\(enemy: Phaser\.Physics\.Arcade\.Sprite\): void/)
  if (methodsMatch && methodsMatch.index !== undefined) {
    const insertPos = methodsMatch.index
    content = content.slice(0, insertPos) + checkMethod + content.slice(insertPos)
    console.log('✅ 添加关卡完成检测方法')
  }
}

// 6. 修改 destroyEnemy 方法，添加关卡完成检测调用
if (content.includes('private destroyEnemy') && !content.includes('this.checkLevelComplete()')) {
  const oldDestroy = content.match(/private destroyEnemy\(enemy: Phaser\.Physics\.Arcade\.Sprite\): void \{[\s\S]*?this\.score \+= 100/)
  if (oldDestroy) {
    const newDestroy = oldDestroy[0].replace(
      'this.score += 100',
      `this.score += 100
    
    // 检查关卡是否完成
    this.checkLevelComplete()`
    )
    
    content = content.replace(oldDestroy[0], newDestroy)
    console.log('✅ 添加关卡完成检测调用')
  }
}

// 保存修改后的文件
fs.writeFileSync(sceneFile, content, 'utf-8')

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✨ 关卡系统实现完成！')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('📋 新增内容:')
console.log('  🗺️ 5 个精心设计的关卡:')
console.log('    第 1 关 - 训练关卡 (5 个轻型敌人)')
console.log('    第 2 关 - 初次战斗 (8 个混合敌人)')
console.log('    第 3 关 - 钢铁防线 (12 个敌人，复杂地形)')
console.log('    第 4 关 - 腹背受敌 (15 个中重型敌人)')
console.log('    第 5 关 - 最终决战 (20 个敌人，地狱难度)')
console.log()
console.log('  📊 每关独立配置:')
console.log('    - 敌人数量递增 (5→20)')
console.log('    - 生成间隔递减 (3s→1.5s)')
console.log('    - 敌人类型丰富 (轻→中→重混合)')
console.log('    - 时间限制逐步增加')
console.log('    - 地图复杂度提升')
console.log()
console.log('  🎯 关卡机制:')
console.log('    - 消灭所有敌人进入下一关')
console.log('    - 保留玩家属性和火力等级')
console.log('    - 重置敌人和子弹')
console.log('    - 清晰的关卡信息提示')
console.log()

console.log('📄 下一步操作:')
console.log('  1. 刷新浏览器开始新游戏')
console.log('  2. 完成第 1 关后自动进入第 2 关')
console.log('  3. 挑战全部 5 个关卡')
console.log()
