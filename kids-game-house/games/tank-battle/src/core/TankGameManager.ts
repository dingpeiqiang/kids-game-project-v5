// ============================================================================
// 🎮 坦克大战 - 游戏管理器
// ============================================================================
// 
// 📌 说明:
//   负责所有核心游戏逻辑，包括：
//   - 玩家受击检测
//   - 复活逻辑
//   - 游戏结束控制
//   - 状态管理
// ============================================================================

import { useGameStore } from '@/stores/game'

/**
 * ⭐ 游戏管理器接口
 */
export interface ITankGameManager {
  playerHit(): void
  respawnPlayer(): void
  handleGameOver(): void
  checkWinCondition(): boolean
}

/**
 * ⭐ 坦克大战游戏管理器
 * 
 * @remarks
 * 核心职责：
 * - 管理玩家生命和复活逻辑
 * - 处理游戏结束和胜利条件
 * - 提供统一的 API 给 Orchestrator 调用
 */
export class TankGameManager implements ITankGameManager {
  protected scene: Phaser.Scene
  protected player: Phaser.Physics.Arcade.Sprite | null
  
  // 状态标志
  protected isDying: boolean = false
  protected isInvincible: boolean = false
  protected isShieldActive: boolean = false
  protected shield: Phaser.GameObjects.Sprite | null = null
  
  // 闪烁定时器
  protected blinkTimer: Phaser.Time.TimerEvent | null = null
  
  constructor(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite) {
    this.scene = scene
    this.player = player
    
    console.log('✅ [TankGameManager] 已创建')
  }
  
  // ===========================================================================
  // 📌 核心方法 - 玩家受击与复活
  // ===========================================================================
  
  /**
   * ⭐ 玩家被击中
   */
  playerHit(): void {
    console.log('🔥 [TankGameManager] playerHit() 被调用')
    
    // 🛡️ 防御检查
    if (this.isDying || !this.player || !this.player.active) {
      console.log('⚠️ 玩家已死亡或正在死亡，跳过受击逻辑')
      return
    }
    
    if (this.isInvincible) {
      console.log('🛡️ 玩家处于无敌状态，免疫伤害')
      return
    }
    
    // 护盾保护
    if (this.isShieldActive && this.shield) {
      console.log('🛡️ 护盾激活，抵消伤害')
      this.destroyShield()
      return
    }
    
    // 💀 扣减生命
    const gameStore = useGameStore()
    const previousLives = gameStore.lives
    gameStore.loseLife()
    
    console.log(`💥 玩家被击中，剩余生命：${gameStore.lives}`)
    
    // 💥 受击反馈
    this.spawnExplosion(this.player.x, this.player.y, 0.6)
    this.cameraShake(200)
    this.playSound('sfx_hit', 0.7)
    
    // ✅ 判断是否复活
    if (previousLives > 1) {
      this.respawnPlayer()
    } else {
      this.handlePlayerDeath()
    }
  }
  
  /**
   * ⭐ 玩家复活
   */
  respawnPlayer(): void {
    console.log('🔄 [TankGameManager] 执行复活流程')
    
    if (!this.player) return
    
    // 1. 清除旧定时器
    this.clearBlinkTimer()
    
    // 2. 计算复活位置
    const startX = (this.scene as any).offsetX + (this.scene as any).gridCols * (this.scene as any).cellSize / 2
    const startY = (this.scene as any).offsetY + (this.scene as any).gridRows * (this.scene as any).cellSize - 200
    
    // 3. 清理周围敌人
    this.clearEnemiesAroundSpawn(startX, startY, 150)
    
    // 4. 传送玩家并恢复状态
    this.player.setPosition(startX, startY)
    this.player.setVelocity(0, 0)
    this.player.setActive(true)
    this.player.setVisible(true)
    this.player.setTexture('player_tank_up')
    
    // ✅ 重置死亡标志
    this.isDying = false
    
    // 5. 启动无敌帧（2.5 秒）
    this.startInvincibilityFrame(2500)
  }
  
  /**
   * ⭐ 玩家死亡处理
   */
  protected handlePlayerDeath(): void {
    console.log('💀 [TankGameManager] 玩家生命耗尽，游戏结束')
    
    if (!this.player) return
    
    this.isDying = true
    this.isInvincible = true
    
    // 大爆炸特效
    this.spawnExplosion(this.player.x, this.player.y, 2)
    this.playSound('sfx_explosion', 0.9)
    this.cameraShake(400)
    
    this.player.setVisible(false)
    this.player.setActive(false)
    
    // 延迟后显示游戏结束 UI
    this.scene.time.delayedCall(500, () => {
      this.handleGameOver()
    })
  }
  
  /**
   * ⭐ 游戏结束
   */
  handleGameOver(): void {
    console.log('🏁 [TankGameManager] 游戏结束')
    ;(this.scene as any).showGameOverUI?.()
  }
  
  // ===========================================================================
  // 📌 辅助方法
  // ===========================================================================
  
  /**
   * 启动无敌帧
   */
  protected startInvincibilityFrame(duration: number): void {
    this.isInvincible = true
    const savedTexture = 'player_tank_up'
    
    // 闪烁动画（使用 alpha 代替 setVisible）
    this.blinkTimer = this.scene.time.addEvent({
      delay: 100,
      callback: () => {
        if (!this.player || !this.player.active) return
        this.player.setAlpha(this.player.alpha === 0.3 ? 1 : 0.3)
      },
      loop: true,
    })
    
    console.log('🛡️ 无敌帧开始')
    
    // 结束无敌帧
    this.scene.time.delayedCall(duration, () => {
      this.clearBlinkTimer()
      this.isInvincible = false
      
      if (this.player) {
        this.player.setActive(true)
        this.player.setAlpha(1)
        this.player.setTexture(savedTexture)
      }
      
      console.log('🛡️ 无敌帧结束')
    })
  }
  
  /**
   * 清除闪烁定时器
   */
  protected clearBlinkTimer(): void {
    if (this.blinkTimer) {
      this.blinkTimer.destroy()
      this.blinkTimer = null
    }
  }
  
  /**
   * 摧毁护盾
   */
  protected destroyShield(): void {
    if (this.shield) {
      this.shield.destroy()
      this.shield = null
      this.isShieldActive = false
      this.isInvincible = true
      
      this.scene.time.delayedCall(2000, () => {
        this.isInvincible = false
      })
    }
  }
  
  /**
   * 清理复活点周围的敌人
   */
  protected clearEnemiesAroundSpawn(x: number, y: number, radius: number): void {
    const enemiesGroup = (this.scene as any).enemies
    if (!enemiesGroup) return
    
    enemiesGroup.getChildren().forEach((enemy: any) => {
      if (enemy.active) {
        const dx = enemy.x - x
        const dy = enemy.y - y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < radius) {
          enemy.destroy()
          this.spawnExplosion(enemy.x, enemy.y, 0.8)
          ;(this.scene as any).score += 50
        }
      }
    })
  }
  
  /**
   * 生成爆炸特效
   */
  protected spawnExplosion(x: number, y: number, scale: number): void {
    const entityManager = (this.scene as any).entityManager
    if (entityManager) {
      entityManager.spawnExplosion(x, y, scale)
    }
  }
  
  /**
   * 播放音效
   */
  protected playSound(key: string, volume: number): void {
    ;(this.scene as any).playSound?.(key, volume)
  }
  
  /**
   * 相机震动
   */
  protected cameraShake(duration: number): void {
    ;(this.scene as any).cameraShake?.(duration)
  }
  
  /**
   * 检查胜利条件
   */
  checkWinCondition(): boolean {
    // 检查是否还有敌人
    const enemiesGroup = (this.scene as any).enemies
    if (!enemiesGroup) return false
    
    const activeEnemies = enemiesGroup.getChildren().filter((e: any) => e.active)
    return activeEnemies.length === 0
  }
  
  // ===========================================================================
  // 📌 Getter/Setter
  // ===========================================================================
  
  getPlayer(): Phaser.Physics.Arcade.Sprite | null {
    return this.player
  }
  
  setIsDying(value: boolean): void {
    this.isDying = value
  }
  
  setIsInvincible(value: boolean): void {
    this.isInvincible = value
  }
  
  getIsDying(): boolean {
    return this.isDying
  }
  
  getIsInvincible(): boolean {
    return this.isInvincible
  }
}
