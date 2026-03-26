/**
 * 飞机大战游戏场景
 * 基于贪吃蛇 PhaserGame.ts 架构适配
 */

import { Scene } from 'phaser'
import { playSound } from '@/utils/audioManager'

export class PlaneShooterScene extends Scene {
  // 玩家对象
  private player!: Phaser.GameObjects.Image
  
  // 输入控制
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: {
    up: Phaser.Input.Keyboard.Key
    down: Phaser.Input.Keyboard.Key
    left: Phaser.Input.Keyboard.Key
    right: Phaser.Input.Keyboard.Key
  }
  
  // 游戏对象组
  private bulletGroup!: Phaser.Physics.Arcade.Group
  private enemyGroup!: Phaser.Physics.Arcade.Group
  private powerUpGroup!: Phaser.Physics.Arcade.Group
  
  // 游戏状态
  private score: number = 0
  private lives: number = 3
  private wave: number = 1
  private bulletLevel: number = 1
  private highScore: number = 0
  
  // 道具效果状态
  private hasShield: boolean = false
  private speedBoost: boolean = false
  private shieldSprite!: Phaser.GameObjects.Graphics | null
  
  // UI 文本
  private scoreText!: Phaser.GameObjects.Text
  private livesText!: Phaser.GameObjects.Text
  private waveText!: Phaser.GameObjects.Text
  
  constructor() {
    super('PlaneShooterScene')
  }
  
  preload(): void {
    // GTRS 资源已在 PhaserGame.ts 中加载
    console.log('[PlaneShooter] 预加载完成')
  }
  
  create(): void {
    console.log('[PlaneShooter] 场景创建开始')
    
    // 初始化游戏状态
    this.score = 0
    this.lives = 3
    this.wave = 1
    this.bulletLevel = 1
    
    // 加载最高分记录
    this.loadHighScore()
    
    // 创建玩家飞机
    this.createPlayer()
    
    // 初始化护盾显示
    this.shieldSprite = null
    
    // 初始化输入
    this.initInput()
    
    // 创建游戏对象组
    this.bulletGroup = this.physics.add.group()
    this.enemyGroup = this.physics.add.group()
    this.powerUpGroup = this.physics.add.group()
    
    // 创建 UI
    this.createUI()
    
    // 设置碰撞检测
    this.setupCollisions()
    
    // 启动射击定时器 (每 200ms 发射一次)
    this.time.addEvent({
      delay: 200,
      callback: this.fireBullet,
      callbackScope: this,
      loop: true
    })
    
    // 启动敌机生成器 (每 2 秒生成一架敌机)
    this.time.addEvent({
      delay: 2000,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    })
    
    console.log('[PlaneShooter] 场景创建完成')
  }
  
  update(): void {
    // 处理玩家移动
    this.handlePlayerMovement()
    
    // 清理超出屏幕的对象
    this.cleanupOffScreenObjects()
    
    // 更新护盾视觉效果
    if (this.hasShield && this.shieldSprite) {
      this.updateShieldEffect()
    }
  }
  
  /**
   * 创建玩家飞机
   */
  private createPlayer(): void {
    const centerX = this.cameras.main.width / 2
    const bottomY = this.cameras.main.height - 100
    
    // 使用 GTRS 资源中的玩家飞机
    this.player = this.add.image(centerX, bottomY, 'player_plane')
    this.player.setDisplaySize(60, 80)
    
    // 添加物理身体
    this.physics.add.existing(this.player)
    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setCollideWorldBounds(true)
    body.setMaxVelocity(500)
    body.setDrag(500)
    
    console.log('[PlaneShooter] 玩家飞机已创建:', { x: centerX, y: bottomY })
  }
  
  /**
   * 初始化输入控制
   */
  private initInput(): void {
    // 方向键
    this.cursors = this.input.keyboard!.createCursorKeys()
    
    // WASD 键
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    }
    
    console.log('[PlaneShooter] 输入控制已初始化')
  }
  
  /**
   * 处理玩家移动
   */
  private handlePlayerMovement(): void {
    const baseSpeed = 400
    const speed = this.speedBoost ? baseSpeed * 1.5 : baseSpeed  // 速度提升效果
    const body = this.player.body as Phaser.Physics.Arcade.Body
    
    // X 轴移动
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      body.setAccelerationX(-speed)
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      body.setAccelerationX(speed)
    } else {
      body.setAccelerationX(0)
      body.setVelocityX(body.velocity.x * 0.9) // 摩擦力
    }
    
    // Y 轴移动
    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      body.setAccelerationY(-speed)
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      body.setAccelerationY(speed)
    } else {
      body.setAccelerationY(0)
      body.setVelocityY(body.velocity.y * 0.9) // 摩擦力
    }
  }
  
  /**
   * 发射子弹
   */
  private fireBullet(): void {
    if (!this.player.active) return
    
    // 根据子弹等级创建不同数量的子弹
    const bullets: Phaser.GameObjects.Image[] = []
    
    if (this.bulletLevel === 1) {
      // 单发
      bullets.push(this.createBullet(this.player.x, this.player.y - 40))
    } else if (this.bulletLevel === 2) {
      // 双发
      bullets.push(this.createBullet(this.player.x - 15, this.player.y - 35))
      bullets.push(this.createBullet(this.player.x + 15, this.player.y - 35))
    } else {
      // 散射 (3 发)
      bullets.push(this.createBullet(this.player.x, this.player.y - 40))
      const leftBullet = this.createBullet(this.player.x - 10, this.player.y - 30)
      const rightBullet = this.createBullet(this.player.x + 10, this.player.y - 30)
      
      // 设置散射角度 (需要自定义物理或手动调整速度)
      const leftBody = leftBullet.body as Phaser.Physics.Arcade.Body
      const rightBody = rightBullet.body as Phaser.Physics.Arcade.Body
      leftBody.setVelocityX(-50)
      rightBody.setVelocityX(50)
    }
    
    // 播放射击音效
    this.playSound('effect_fire')
  }
  
  /**
   * 创建单个子弹
   */
  private createBullet(x: number, y: number): Phaser.GameObjects.Image {
    const bullet = this.add.image(x, y, `bullet_player_${this.bulletLevel}`)
    bullet.setDisplaySize(10, 20)
    
    this.physics.add.existing(bullet)
    const body = bullet.body as Phaser.Physics.Arcade.Body
    body.setVelocityY(-800)
    
    this.bulletGroup.add(bullet)
    
    // 自动清理超出屏幕的子弹
    this.time.delayedCall(2000, () => {
      if (bullet.active) {
        bullet.destroy()
      }
    })
    
    return bullet
  }
  
  /**
   * 生成敌机
   */
  private spawnEnemy(): void {
    // 简单随机生成
    const rand = Phaser.Math.Between(1, 100)
    let type: string
    
    if (rand <= 70) {
      type = 'small'
    } else if (rand <= 95) {
      type = 'medium'
    } else {
      type = 'large'
    }
    
    let enemy: Phaser.GameObjects.Image
    let health: number
    let score: number
    let size: number
    
    switch (type) {
      case 'small':
        enemy = this.add.image(
          Phaser.Math.Between(50, this.cameras.main.width - 50),
          -50,
          'enemy_small'
        )
        size = 40
        health = 1
        score = 100
        break
      case 'medium':
        enemy = this.add.image(
          Phaser.Math.Between(50, this.cameras.main.width - 50),
          -50,
          'enemy_medium'
        )
        size = 50
        health = 3
        score = 300
        break
      case 'large':
        enemy = this.add.image(
          Phaser.Math.Between(50, this.cameras.main.width - 50),
          -50,
          'enemy_large'
        )
        size = 80
        health = 10
        score = 1000
        break
      default:
        return
    }
    
    enemy.setDisplaySize(size, size * 1.2)
    this.physics.add.existing(enemy)
    const body = enemy.body as Phaser.Physics.Arcade.Body
    body.setVelocityY(Phaser.Math.Between(100, 200))
    
    // 存储敌机属性
    enemy.setData('health', health)
    enemy.setData('score', score)
    enemy.setData('type', type)
    
    this.enemyGroup.add(enemy)
    
    console.log(`[PlaneShooter] 生成敌机：${type}, HP=${health}`)
  }
  
  /**
   * 设置碰撞检测
   */
  private setupCollisions(): void {
    // 子弹击中敌机
    this.physics.add.overlap(
      this.bulletGroup,
      this.enemyGroup,
      this.onBulletHitEnemy,
      undefined,
      this
    )
    
    // 敌机撞击玩家
    this.physics.add.overlap(
      this.player,
      this.enemyGroup,
      this.onPlayerHit,
      undefined,
      this
    )
    
    // 玩家拾取道具
    this.physics.add.overlap(
      this.player,
      this.powerUpGroup,
      this.collectPowerUp,
      undefined,
      this
    )
  }
  
  /**
   * 子弹击中敌机处理
   */
  private onBulletHitEnemy(bullet: any, enemy: any): void {
    // 销毁子弹
    bullet.destroy()
    
    // 减少敌机生命值
    const health = enemy.getData('health') - 1
    enemy.setData('health', health)
    
    if (health <= 0) {
      // 敌机被摧毁
      const score = enemy.getData('score')
      this.addScore(score)
      
      // 播放爆炸特效
      this.createExplosion(enemy.x, enemy.y)
      
      // 概率掉落道具 (20%)
      if (Phaser.Math.Between(1, 100) <= 20) {
        this.spawnPowerUp(enemy.x, enemy.y)
      }
      
      enemy.destroy()
    }
  }
  
  /**
   * 玩家被撞击处理
   */
  private onPlayerHit(): void {
    // 如果有护盾，免疫一次伤害
    if (this.hasShield) {
      this.removeShield()
      return
    }
    
    console.log('[PlaneShooter] 玩家被撞!')
    
    // 减少生命值
    this.lives--
    this.updateUI()
    
    // 播放受伤效果
    this.tweens.add({
      targets: this.player,
      alpha: 0,
      duration: 100,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.player.alpha = 1
      }
    })
    
    // 检查游戏结束
    if (this.lives <= 0) {
      this.gameOver()
    }
  }
  
  /**
   * 创建爆炸特效
   */
  private createExplosion(x: number, y: number): void {
    // 简单实现：创建一个逐渐消失的圆形
    const explosion = this.add.circle(x, y, 40, 0xffaa00, 0.8)
    
    this.tweens.add({
      targets: explosion,
      scale: 2,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        explosion.destroy()
      }
    })
    
    // 播放爆炸音效
    this.playSound('effect_explosion')
  }
  
  /**
   * 生成道具
   */
  private spawnPowerUp(x: number, y: number): void {
    const types = ['weapon', 'speed', 'shield', 'health', 'bomb']
    const type = Phaser.Utils.Array.GetRandom(types)
    
    const powerUp = this.add.image(x, y, `powerup_${type}`)
    powerUp.setDisplaySize(30, 30)
    
    this.physics.add.existing(powerUp)
    const body = powerUp.body as Phaser.Physics.Arcade.Body
    body.setVelocityY(100)
    
    powerUp.setData('type', type)
    
    this.powerUpGroup.add(powerUp)
    
    console.log(`[PlaneShooter] 生成道具：${type}`)
  }
  
  /**
   * 拾取道具
   */
  private collectPowerUp(player: any, powerUp: any): void {
    const type = powerUp.getData('type')
    console.log(`[PlaneShooter] 获得道具：${type}`)
    
    // 实现道具效果
    switch (type) {
      case 'weapon':
        if (this.bulletLevel < 3) {
          this.bulletLevel++
        }
        break
      case 'speed':
        // 提升移动速度 10 秒
        this.activateSpeedBoost()
        break
      case 'shield':
        // 添加护盾 10 秒
        this.addShield()
        break
      case 'health':
        this.lives = Math.min(this.lives + 1, 5)
        break
      case 'bomb':
        // 清除所有敌人
        this.clearAllEnemies()
        break
    }
    
    this.updateUI()
    this.playSound('effect_powerup')
    powerUp.destroy()
  }
  
  /**
   * 清除所有敌人 (炸弹道具)
   */
  private clearAllEnemies(): void {
    this.enemyGroup.getChildren().forEach((enemy: any) => {
      this.createExplosion(enemy.x, enemy.y)
      this.addScore(enemy.getData('score'))
      enemy.destroy()
    })
  }
  
  /**
   * 增加分数
   */
  private addScore(points: number): void {
    this.score += points
    this.updateUI()
  }
  
  /**
   * 创建 UI
   */
  private createUI(): void {
    const style = { font: '24px Arial', fill: '#ffffff' }
    
    // 分数
    this.scoreText = this.add.text(20, 20, 'Score: 0', style)
    
    // 生命值
    this.livesText = this.add.text(20, 50, `Lives: ${this.lives}`, style)
    
    // 波次
    this.waveText = this.add.text(this.cameras.main.width - 150, 20, `Wave: ${this.wave}`, style)
    
    console.log('[PlaneShooter] UI 已创建')
  }
  
  /**
   * 更新 UI
   */
  private updateUI(): void {
    this.scoreText.setText(`Score: ${this.score}`)
    this.livesText.setText(`Lives: ${this.lives}`)
    this.waveText.setText(`Wave: ${this.wave}`)
  }
  
  /**
   * 清理超出屏幕的对象
   */
  private cleanupOffScreenObjects(): void {
    const screenHeight = this.cameras.main.height
    
    // 清理子弹
    this.bulletGroup.getChildren().forEach((bullet: any) => {
      if (bullet.y < -50 || bullet.y > screenHeight + 50) {
        bullet.destroy()
      }
    })
    
    // 清理敌机
    this.enemyGroup.getChildren().forEach((enemy: any) => {
      if (enemy.y > screenHeight + 50) {
        enemy.destroy()
      }
    })
    
    // 清理道具
    this.powerUpGroup.getChildren().forEach((powerUp: any) => {
      if (powerUp.y > screenHeight + 50) {
        powerUp.destroy()
      }
    })
  }
  
  /**
   * 播放音效
   */
  private playSound(key: string): void {
    // 使用音效管理器播放
    playSound(key as any)
  }
  
  /**
   * 游戏结束
   */
  private gameOver(): void {
    console.log('[PlaneShooter] 游戏结束!', { score: this.score })
    
    // 保存最高分
    this.saveHighScore()
    
    // TODO: 显示游戏结束界面
    // TODO: 提供重新开始选项
    
    // 暂停游戏
    this.physics.pause()
    this.player.setTint(0xff0000)
  }
  
  /**
   * 加载最高分记录
   */
  private loadHighScore(): void {
    const saved = localStorage.getItem('plane-shooter-high-score')
    if (saved) {
      this.highScore = parseInt(saved, 10) || 0
    }
    console.log('[PlaneShooter] 加载最高分:', this.highScore)
  }
  
  /**
   * 保存最高分记录
   */
  private saveHighScore(): void {
    if (this.score > this.highScore) {
      this.highScore = this.score
      localStorage.setItem('plane-shooter-high-score', this.highScore.toString())
      console.log('[PlaneShooter] 🎉 新纪录!', this.highScore)
    }
  }
  
  /**
   * 添加护盾效果
   */
  private addShield(): void {
    this.hasShield = true
    console.log('[PlaneShooter] 🛡️ 护盾激活!')
    
    // 创建护盾视觉效果
    if (!this.shieldSprite) {
      this.shieldSprite = this.add.graphics()
    }
    
    // 10 秒后移除护盾
    this.time.delayedCall(10000, () => {
      this.removeShield()
    })
  }
  
  /**
   * 移除护盾效果
   */
  private removeShield(): void {
    this.hasShield = false
    console.log('[PlaneShooter] ❌ 护盾消失')
    
    if (this.shieldSprite) {
      this.shieldSprite.destroy()
      this.shieldSprite = null
    }
  }
  
  /**
   * 激活速度提升效果
   */
  private activateSpeedBoost(): void {
    this.speedBoost = true
    console.log('[PlaneShooter] ⚡ 速度提升!')
    
    // 10 秒后恢复
    this.time.delayedCall(10000, () => {
      this.speedBoost = false
      console.log('[PlaneShooter] 🐢 速度恢复')
    })
  }
  
  /**
   * 更新护盾视觉效果
   */
  private updateShieldEffect(): void {
    if (!this.shieldSprite || !this.player) return
    
    this.shieldSprite.clear()
    this.shieldSprite.lineStyle(2, 0x00aaff, 0.8)
    this.shieldSprite.strokeCircle(
      this.player.x,
      this.player.y,
      50
    )
  }
}
