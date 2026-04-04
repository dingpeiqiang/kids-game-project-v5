// ============================================================================
// 🔥 坦克大战 - Boss 管理系统
// ============================================================================
//
// 📌 说明:
//   管理 Boss 的生成、技能、狂暴状态等
// ============================================================================

import type TankGameScene from '../scenes/TankGameScene'
import { EntityType } from '../managers/EntityManager'
import { Logger } from '../utils/Logger'

/**
 * ⭐ Boss 技能配置
 */
export interface IBossSkill {
  name: string
  cooldown: number
  lastUsed: number
  execute: () => void
}

/**
 * ⭐ Boss 管理器
 */
export class BossManager {
  private scene: TankGameScene
  private boss: any = null
  private skills: IBossSkill[] = []
  private isEnraged: boolean = false
  private speedMultiplier: number = 1.0
  private damageMultiplier: number = 1.0

  constructor(scene: TankGameScene) {
    this.scene = scene
  }

  // ===========================================================================
  // 📌 公共 API
  // ===========================================================================

  /**
   * ⭐ 生成 Boss
   */
  spawnBoss(config: {
    type: string
    x?: number
    y?: number
    health: number
  }): void {
    const { type, health } = config
    const x = config.x ?? this.scene.gridCols * this.cellSize / 2
    const y = config.y ?? 100

    Logger.debug(`🔥 [BossManager] 生成 Boss: ${type}, 位置: (${x}, ${y}), 生命: ${health}`)

    // 通知 TankGameScene 通过 EntityManager 创建 Boss
    this.scene.events.emit('create_boss', {
      x,
      y,
      type,
      health
    })

    // 设置技能
    this.setupSkills()
  }

  /**
   * ⭐ 设置 Boss 技能
   */
  private setupSkills(): void {
    this.skills = [
      {
        name: 'spread_shot',
        cooldown: 5000,
        lastUsed: 0,
        execute: () => this.executeSpreadShot()
      },
      {
        name: 'dash',
        cooldown: 8000,
        lastUsed: 0,
        execute: () => this.executeDash()
      },
      {
        name: 'summon',
        cooldown: 15000,
        lastUsed: 0,
        execute: () => this.executeSummon()
      }
    ]
  }

  /**
   * ⭐ 更新 Boss AI
   */
  update(time: number): void {
    if (!this.boss || !this.boss.active) return

    // 检查并执行技能
    for (const skill of this.skills) {
      if (time - skill.lastUsed > skill.cooldown) {
        if (Math.random() < 0.1) { // 10% 概率触发
          skill.execute()
          skill.lastUsed = time
        }
      }
    }
  }

  /**
   * ⭐ Boss 受击
   */
  onBossHit(damage: number): void {
    if (!this.boss) return

    // 播放受击特效
    this.scene.spawnSparks(this.boss.x, this.boss.y, '#FF0000', 8)

    // 检查狂暴触发（血量低于 30%）
    const healthPercent = this.boss.health / (this.boss.maxHealth || 50)
    if (healthPercent < 0.3 && !this.isEnraged) {
      this.activateEnrage()
    }
  }

  /**
   * ⭐ 激活狂暴状态
   */
  activateEnrage(): void {
    if (this.isEnraged) return

    this.isEnraged = true
    this.speedMultiplier = 1.5
    this.damageMultiplier = 1.5

    Logger.warn(`💀 [BossManager] Boss 进入狂暴状态！`)

    // 播放狂暴特效
    if (this.boss) {
      this.scene.tweens.add({
        targets: this.boss,
        scale: 1.8,
        duration: 500,
        yoyo: true,
        repeat: 2
      })
    }

    // 通知场景 Boss 狂暴
    this.scene.events.emit('boss_enraged', {
      speedMultiplier: this.speedMultiplier,
      damageMultiplier: this.damageMultiplier
    })
  }

  /**
   * ⭐ 清理
   */
  destroy(): void {
    this.boss = null
    this.skills = []
  }

  // ===========================================================================
  // 🔧 私有方法 - Boss 技能
  // ===========================================================================

  /**
   * ⭐ 扩散射击
   */
  private executeSpreadShot(): void {
    if (!this.boss || !this.boss.active) return

    Logger.debug(`🔥 [Boss技能] 扩散射击`)

    // 通知场景执行扩散射击
    this.scene.events.emit('boss_skill', { skill: 'spread_shot' })
  }

  /**
   * ⭐ 冲刺攻击
   */
  private executeDash(): void {
    if (!this.boss || !this.boss.active) return

    Logger.debug(`🔥 [Boss技能] 冲刺攻击`)

    // 通知场景执行冲刺
    this.scene.events.emit('boss_skill', { skill: 'dash' })
  }

  /**
   * ⭐ 召唤小兵
   */
  private executeSummon(): void {
    if (!this.boss || !this.boss.active) return

    Logger.debug(`🔥 [Boss技能] 召唤小兵`)

    // 通知场景召唤小兵
    this.scene.events.emit('boss_skill', { skill: 'summon' })
  }

  // ===========================================================================
  // 📌 Getter
  // ===========================================================================

  getBoss(): any {
    return this.boss
  }

  isBossAlive(): boolean {
    return this.boss && this.boss.active
  }

  getIsEnraged(): boolean {
    return this.isEnraged
  }
}