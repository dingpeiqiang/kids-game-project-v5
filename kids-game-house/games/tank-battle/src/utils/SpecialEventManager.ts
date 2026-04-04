// ============================================================================
// ⭐ 坦克大战 - 特殊事件系统
// ============================================================================
//
// 📌 说明:
//   管理关卡中的特殊事件，如空投、增援、Boss 出现等
// ============================================================================

import { ISpecialEventConfig, SpecialEventType, ITankLevelParams } from '../types/level-types'
import type TankGameScene from '../scenes/TankGameScene'
import { Logger } from './Logger'

/**
 * ⭐ 特殊事件管理器
 */
export class SpecialEventManager {
  private scene: TankGameScene
  private events: ISpecialEventConfig[] = []
  private triggeredEvents: Set<string> = new Set()
  private eventTimers: Phaser.Time.TimerEvent[] = []
  private onEventTriggered?: (event: ISpecialEventConfig) => void

  constructor(scene: TankGameScene) {
    this.scene = scene
  }

  /**
   * ⭐ 初始化事件系统
   */
  init(events: ISpecialEventConfig[], onEventTriggered?: (event: ISpecialEventConfig) => void): void {
    this.events = events || []
    this.triggeredEvents.clear()
    this.eventTimers.forEach(t => t.destroy())
    this.eventTimers = []
    this.onEventTriggered = onEventTriggered

    // 为每个事件设置定时器
    for (const event of this.events) {
      this.scheduleEvent(event)
    }
  }

  /**
   * ⭐ 调度事件
   */
  private scheduleEvent(event: ISpecialEventConfig): void {
    // 转换为毫秒
    const delay = event.triggerTime * 1000

    const timer = this.scene.time.delayedCall(delay, () => {
      this.triggerEvent(event)
    })

    this.eventTimers.push(timer)
  }

  /**
   * ⭐ 触发事件
   */
  private triggerEvent(event: ISpecialEventConfig): void {
    if (this.triggeredEvents.has(event.id)) {
      return
    }

    this.triggeredEvents.add(event.id)
    event.triggered = true

    Logger.debug(`🎯 [SpecialEventManager] 触发事件: ${event.description} (${event.type})`)

    // 根据事件类型执行相应逻辑
    this.executeEvent(event)

    // 触发回调
    if (this.onEventTriggered) {
      this.onEventTriggered(event)
    }
  }

  /**
   * ⭐ 执行事件效果
   */
  private executeEvent(event: ISpecialEventConfig): void {
    switch (event.type) {
      case SpecialEventType.AIRDROP:
        this.spawnAirdrop(event)
        break

      case SpecialEventType.REINFORCEMENT:
      case SpecialEventType.WAVE_ATTACK:
        this.spawnReinforcement(event)
        break

      case SpecialEventType.BOSS_WARNING:
        this.showBossWarning(event)
        break

      case SpecialEventType.BOSS_SPAWN:
        this.spawnBoss(event)
        break

      case SpecialEventType.BOSS_ENRAGED:
        this.activateBossEnrage(event)
        break

      case SpecialEventType.FREEZE_ALL:
        this.freezeAllEnemies(event)
        break

      case SpecialEventType.SCREEN_BOMB:
        this.triggerScreenBomb(event)
        break
    }
  }

  /**
   * ⭐ 生成空投道具
   */
  private spawnAirdrop(event: ISpecialEventConfig): void {
    const { type } = event.reward
    const x = Phaser.Math.Between(100, 700)
    const y = Phaser.Math.Between(100, 600)

    // 播放空投特效
    this.scene.spawnPowerUpEffect(x, y, '空投！', 0xFFD700)
    this.scene.playSound('sfx_bonus_appears', 0.6)

    // 根据类型生成对应道具
    // 实际道具生成逻辑由 TankGameScene 处理
    Logger.debug(`📦 [空投] 生成 ${type} 道具 at (${x}, ${y})`)
  }

  /**
   * ⭐ 生成增援敌人
   */
  private spawnReinforcement(event: ISpecialEventConfig): void {
    const { enemyType, count } = event.reward

    Logger.debug(`👾 [增援] 生成 ${count} 个 ${enemyType} 敌人`)

    // 增援敌人由 TankGameScene 通过事件系统处理
    this.scene.events.emit('reinforcement', {
      enemyType,
      count,
      eventId: event.id
    })
  }

  /**
   * ⭐ 显示 Boss 警告
   */
  private showBossWarning(event: ISpecialEventConfig): void {
    // 显示警告文字
    const warningText = this.scene.add.text(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      '⚠️ Boss 即将来袭！',
      {
        fontSize: '48px',
        fontFamily: 'Arial Black',
        color: '#FF0000',
        stroke: '#000000',
        strokeThickness: 8
      }
    ).setOrigin(0.5).setDepth(9999)

    // 闪烁动画
    this.scene.tweens.add({
      targets: warningText,
      alpha: 0.3,
      duration: 300,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.scene.tweens.add({
          targets: warningText,
          y: warningText.y - 50,
          alpha: 0,
          duration: 500,
          onComplete: () => warningText.destroy()
        })
      }
    })

    // 屏幕震动
    this.scene.cameraShake(500, 5)

    // 播放警告音效
    this.scene.playSound('sfx_boss_appear', 1.0)
  }

  /**
   * ⭐ 生成 Boss
   */
  private spawnBoss(event: ISpecialEventConfig): void {
    const { bossType, health } = event.reward

    Logger.debug(`🔥 [Boss] 生成 Boss: ${bossType}, 生命值: ${health}`)

    // 通知 TankGameScene 生成 Boss
    this.scene.events.emit('boss_spawn', {
      bossType,
      health,
      eventId: event.id
    })
  }

  /**
   * ⭐ Boss 狂暴
   */
  private activateBossEnrage(event: ISpecialEventConfig): void {
    const { speedMultiplier, damageMultiplier } = event.reward

    Logger.warn(`💀 [Boss狂暴] 速度 x${speedMultiplier}, 伤害 x${damageMultiplier}`)

    // 通知 TankGameScene Boss 进入狂暴状态
    this.scene.events.emit('boss_enraged', {
      speedMultiplier,
      damageMultiplier
    })

    // 显示狂暴提示
    const enrageText = this.scene.add.text(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      '💀 Boss 进入狂暴状态！',
      {
        fontSize: '36px',
        fontFamily: 'Arial Black',
        color: '#FF4500',
        stroke: '#000000',
        strokeThickness: 6
      }
    ).setOrigin(0.5).setDepth(9999)

    this.scene.tweens.add({
      targets: enrageText,
      scale: 1.5,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => enrageText.destroy()
    })
  }

  /**
   * ⭐ 冰冻所有敌人
   */
  private freezeAllEnemies(event: ISpecialEventConfig): void {
    const { duration } = event.reward

    Logger.debug(`❄️ [冰冻] 冰冻所有敌人 ${duration}ms`)

    // 通知 TankGameScene 冰冻所有敌人
    this.scene.events.emit('freeze_all', { duration })
  }

  /**
   * ⭐ 全屏炸弹
   */
  private triggerScreenBomb(event: ISpecialEventConfig): void {
    Logger.debug(`💣 [全屏炸弹] 触发全屏爆炸`)

    // 通知 TankGameScene 触发全屏炸弹效果
    this.scene.events.emit('screen_bomb')
  }

  /**
   * ⭐ 获取已触发的事件列表
   */
  getTriggeredEvents(): ISpecialEventConfig[] {
    return this.events.filter(e => e.triggered)
  }

  /**
   * ⭐ 获取待触发的事件数量
   */
  getPendingEventCount(): number {
    return this.events.filter(e => !e.triggered).length
  }

  /**
   * ⭐ 销毁
   */
  destroy(): void {
    this.eventTimers.forEach(t => t.destroy())
    this.eventTimers = []
  }
}