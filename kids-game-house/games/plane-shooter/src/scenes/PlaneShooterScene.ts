// ============================================================================
// ✈️ 飞机大战游戏场景 - PlaneShooterScene.ts
// ============================================================================

import GameScene from './GameScene'
import { useGameStore } from '@/stores/game'

// ============================================================================
// 游戏对象接口定义
// ============================================================================

interface GameObject {
  sprite: Phaser.GameObjects.Image
  isActive: boolean
  speed: number
}

interface Enemy extends GameObject {
  type: 'small' | 'medium' | 'large'
  health: number
  scoreValue: number
  shootTimer?: Phaser.Time.TimerEvent
}

interface Bullet extends GameObject {
  isPlayerBullet: boolean
  damage: number
}

interface Prop extends GameObject {
  propType: 'double' | 'shield' | 'heart' | 'bomb'
}

// ============================================================================
// 飞机大战场景类
// ============================================================================

export default class PlaneShooterScene extends GameScene {
  // ─── 玩家相关 ──────────────────────────────────────────────────────
  private player!: GameObject
  private playerHealth: number = 3
  private maxHealth: number = 3
  private hasShield: boolean = false
  private doubleBulletTimer: Phaser.Time.TimerEvent | null = null
  
  // ─── 敌机管理 ──────────────────────────────────────────────────────
  private enemies: Enemy[] = []
  private enemySpawnTimer: Phaser.Time.TimerEvent | null = null
  private enemySpawnInterval: number = 1500 // 毫秒
  
  // ─── 子弹管理 ──────────────────────────────────────────────────────
  private playerBullets: Bullet[] = []
  private enemyBullets: Bullet[] = []
  private lastShootTime: number = 0
  private shootInterval: number = 300 // 毫秒
  
  // ─── 道具系统 ──────────────────────────────────────────────────────
  private props: Prop[] = []
  private propDropChance: number = 0.15 // 15% 掉率
  private bombCount: number = 0
  
  // ─── UI 元素 ──────────────────────────────────────────────────────
  private healthText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text
  private timeText!: Phaser.GameObjects.Text
  private bombText!: Phaser.GameObjects.Text
  private gameOverText!: Phaser.GameObjects.Text
  
  // ─── 游戏数值 ──────────────────────────────────────────────────────
  private gameTime: number = 0
  private difficultyMultiplier: number = 1
  // score 继承自 GameScene 基类
  
  // ─── 输入控制 ──────────────────────────────────────────────────────
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: { up: any; down: any; left: any; right: any }
  private canMove: boolean = true

  // ─── 预加载资源 ────────────────────────────────────────────────────
  preload(): void {
    this.preloadFromGTRS() // ✅ 从 GTRS.json 加载所有资源
  }

  // ─── 初始化 ────────────────────────────────────────────────────────
  create(): void {
    super.create() // ⚠️ 必须调用
    
    console.log('✈️ 飞机大战启动')
    console.log('🎨 屏幕尺寸:', this.screenW, 'x', this.screenH)
    console.log('✅ Phaser 游戏场景已创建')
    
    // 读取难度配置
    const gameStore = useGameStore()
    const difficultyValue = gameStore.difficulty
    
    // 根据难度设置速度系数（简单处理：easy=0.8, medium=1.0, hard=1.2）
    if (difficultyValue === 'easy') {
      this.difficultyMultiplier = 0.8
    } else if (difficultyValue === 'hard') {
      this.difficultyMultiplier = 1.2
    }
    console.log(`📊 难度系数：${this.difficultyMultiplier}`)
    
    // 初始化输入
    this.setupInput()
    
    // 创建背景
    this.createBackground()
    
    // 创建玩家
    this.createPlayer()
    
    // 创建 UI
    this.createUI()
    
    // 启动敌机生成器
    this.startEnemySpawner()
    
    // 启动游戏计时器
    this.gameTime = 0
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.gameTime++
        this.updateDifficulty()
      },
      loop: true
    })
  }

  // ─── 创建游戏对象（抽象方法实现）────────────────────────────────────
  protected createGameObjects(): void {
    // 已在 create() 中完成
  }

  // ─── 游戏主循环（每帧调用）─────────────────────────────────────────
  protected gameLoop(_time: number, delta: number): void {
    if (this.isGameOver) return
    
    // 玩家移动
    if (this.canMove) {
      this.handlePlayerMovement(delta)
    }
    
    // 自动射击
    this.handleAutoShoot()
    
    // 更新子弹位置
    this.updateBullets(delta)
    
    // 更新敌机位置和行为
    this.updateEnemies(delta)
    
    // 更新道具位置
    this.updateProps(delta)
    
    // 碰撞检测
    this.checkCollisions()
    
    // 边界检查
    this.checkBoundaries()
  }

  // ─── 游戏结束处理 ──────────────────────────────────────────────────
  protected handleGameOver(): void {
    if (this.isGameOver) return
    this.isGameOver = true
    
    console.log(`💥 游戏结束！最终得分：${this.score}`)
    
    // 停止所有定时器
    this.enemySpawnTimer?.remove()
    this.doubleBulletTimer?.remove()
    
    // 清除所有敌机和子弹
    this.enemies.forEach(enemy => enemy.sprite.destroy())
    this.playerBullets.forEach(bullet => bullet.sprite.destroy())
    this.enemyBullets.forEach(bullet => bullet.sprite.destroy())
    this.props.forEach(prop => prop.sprite.destroy())
    
    // 显示游戏结束文字
    this.gameOverText = this.add.text(this.screenW / 2, this.screenH / 2, 'GAME OVER', {
      fontFamily: 'Arial',
      fontSize: '96px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5)
    
    // 延迟后通知 Vue 层
    this.time.delayedCall(1500, () => {
      this.game.events.emit('gameover', this.score)
    })
  }

  // ─── 辅助方法 ──────────────────────────────────────────────────────

  /**
   * 设置键盘输入
   */
  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    }
  }

  /**
   * 创建滚动背景
   */
  private createBackground(): void {
    // ⭐ 先创建纯色背景（兜底）- 深蓝色星空
    const bgColor = this.add.rectangle(0, 0, this.screenW, this.screenH, 0x0f172a)
    bgColor.setOrigin(0)
    
    // ✅ 再尝试加载背景图片
    if (this.textures.exists('bg_main')) {
      const bg = this.add.image(0, 0, 'bg_main').setOrigin(0)
      
      // 背景滚动效果
      this.tweens.add({
        targets: bg,
        y: -1080,
        duration: 10000,
        ease: 'Linear',
        repeat: -1,
        onUpdate: () => {
          if (bg.y <= -1080) {
            bg.y = 0
          }
        }
      })
    } else {
      console.warn('⚠️ 背景图片不存在，使用纯色背景')
    }
  }

  /**
   * 创建玩家飞机
   */
  private createPlayer(): void {
    const startX = this.screenW / 2
    const startY = this.screenH - 100
    
    console.log('🎮 创建玩家飞机，位置:', { x: startX, y: startY })
    
    this.player = {
      sprite: this.add.image(startX, startY, 'player')
        .setDisplaySize(this.cellSize * 0.8, this.cellSize * 0.8)
        .setDepth(10),
      isActive: true,
      speed: 300 * this.difficultyMultiplier
    }
    
    // 添加护盾效果（如果有）
    if (this.hasShield) {
      this.add.circle(startX, startY, 40, 0x3b82f6, 0.3).setDepth(9)
    }
    
    console.log('✅ 玩家飞机已创建:', this.player.sprite.texture.key)
  }

  /**
   * 创建 UI 文本
   */
  private createUI(): void {
    const style = {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }
    
    // 生命值
    this.healthText = this.add.text(20, 20, `❤️ 生命：${this.playerHealth}/${this.maxHealth}`, style)
    
    // 分数
    this.scoreText = this.add.text(this.screenW / 2, 20, `🎯 得分：${this.score}`, style).setOrigin(0.5, 0)
    
    // 时间
    this.timeText = this.add.text(this.screenW - 20, 20, `⏱️ ${this.formatTime(0)}`, { ...style }).setOrigin(1, 0)
    
    // 炸弹
    this.bombText = this.add.text(20, 60, `💣 炸弹：${this.bombCount}`, style)
  }

  /**
   * 处理玩家移动
   */
  private handlePlayerMovement(delta: number): void {
    const speed = this.player.speed * (delta / 1000)
    let dx = 0
    let dy = 0
    
    // 方向键
    if (this.cursors.left.isDown || this.wasd.left.isDown) dx = -speed
    if (this.cursors.right.isDown || this.wasd.right.isDown) dx = speed
    if (this.cursors.up.isDown || this.wasd.up.isDown) dy = -speed
    if (this.cursors.down.isDown || this.wasd.down.isDown) dy = speed
    
    // 应用移动
    this.player.sprite.x += dx
    this.player.sprite.y += dy
  }

  /**
   * 自动射击
   */
  private handleAutoShoot(): void {
    const now = Date.now()
    
    if (now - this.lastShootTime >= this.shootInterval && this.player.isActive) {
      this.shoot()
      this.lastShootTime = now
    }
  }

  /**
   * 发射子弹
   */
  private shoot(): void {
    const x = this.player.sprite.x
    const y = this.player.sprite.y - 30
    
    // 播放音效
    this.sound.play('sfx_shoot', { volume: 0.3 })
    
    if (this.doubleBulletTimer) {
      // 双发模式
      this.createBullet(x - 20, y, true)
      this.createBullet(x + 20, y, true)
    } else {
      // 单发模式
      this.createBullet(x, y, true)
    }
  }

  /**
   * 创建子弹
   */
  private createBullet(x: number, y: number, isPlayerBullet: boolean): void {
    const bullet: Bullet = {
      sprite: this.add.image(x, y, isPlayerBullet ? 'bullet_player' : 'bullet_enemy')
        .setDisplaySize(this.cellSize * 0.2, this.cellSize * 0.4)
        .setDepth(5),
      isActive: true,
      speed: isPlayerBullet ? 500 : 300,
      isPlayerBullet,
      damage: isPlayerBullet ? 1 : 1
    }
    
    if (isPlayerBullet) {
      this.playerBullets.push(bullet)
    } else {
      this.enemyBullets.push(bullet)
    }
  }

  /**
   * 更新子弹位置
   */
  private updateBullets(delta: number): void {
    const speedFactor = delta / 1000
    
    // 玩家子弹向上
    this.playerBullets.forEach(bullet => {
      if (bullet.isActive) {
        bullet.sprite.y -= bullet.speed * speedFactor
        if (bullet.sprite.y < -50) {
          bullet.sprite.destroy()
          bullet.isActive = false
        }
      }
    })
    
    // 敌机子弹向下
    this.enemyBullets.forEach(bullet => {
      if (bullet.isActive) {
        bullet.sprite.y += bullet.speed * speedFactor
        if (bullet.sprite.y > this.screenH + 50) {
          bullet.sprite.destroy()
          bullet.isActive = false
        }
      }
    })
    
    // 清理不活跃的子弹
    this.playerBullets = this.playerBullets.filter(b => b.isActive)
    this.enemyBullets = this.enemyBullets.filter(b => b.isActive)
  }

  /**
   * 启动敌机生成器
   */
  private startEnemySpawner(): void {
    this.enemySpawnTimer = this.time.addEvent({
      delay: this.enemySpawnInterval / this.difficultyMultiplier,
      callback: this.spawnEnemy,
      loop: true
    })
  }

  /**
   * 生成敌机
   */
  private spawnEnemy = (): void => {
    if (this.isGameOver) return
    
    const rand = Math.random()
    let type: 'small' | 'medium' | 'large' = 'small'
    let health = 1
    let scoreValue = 100
    let texture = 'enemy_small'
    let size = 0.6
    
    if (rand < 0.1 && this.gameTime > 30) {
      // 10% 概率生成大型敌机（30 秒后）
      type = 'large'
      health = 5
      scoreValue = 500
      texture = 'enemy_large'
      size = 1.2
    } else if (rand < 0.3 && this.gameTime > 15) {
      // 20% 概率生成中型敌机（15 秒后）
      type = 'medium'
      health = 3
      scoreValue = 300
      texture = 'enemy_medium'
      size = 0.8
    }
    
    const x = Phaser.Math.Between(100, this.screenW - 100)
    const y = -50
    
    const enemy: Enemy = {
      sprite: this.add.image(x, y, texture)
        .setDisplaySize(this.cellSize * size, this.cellSize * size)
        .setDepth(8),
      isActive: true,
      speed: Phaser.Math.Between(100, 200) * this.difficultyMultiplier,
      type,
      health,
      scoreValue
    }
    
    // 中型和大型敌机会射击
    if (type === 'medium' || type === 'large') {
      enemy.shootTimer = this.time.addEvent({
        delay: type === 'medium' ? 2000 : 1000,
        callback: () => {
          if (enemy.isActive && !this.isGameOver) {
            this.createBullet(enemy.sprite.x, enemy.sprite.y + 30, false)
          }
        },
        loop: true
      })
    }
    
    this.enemies.push(enemy)
  }

  /**
   * 更新敌机位置和行为
   */
  private updateEnemies(delta: number): void {
    const speedFactor = delta / 1000
    
    this.enemies.forEach(enemy => {
      if (enemy.isActive) {
        // 向下移动
        enemy.sprite.y += enemy.speed * speedFactor
        
        // 左右摆动
        enemy.sprite.x += Math.sin(enemy.sprite.y * 0.01) * 2
        
        // 超出屏幕则销毁
        if (enemy.sprite.y > this.screenH + 50) {
          enemy.sprite.destroy()
          enemy.isActive = false
          enemy.shootTimer?.remove()
        }
      }
    })
    
    this.enemies = this.enemies.filter(e => e.isActive)
  }

  /**
   * 更新道具位置
   */
  private updateProps(delta: number): void {
    const speedFactor = delta / 1000
    
    this.props.forEach(prop => {
      if (prop.isActive) {
        prop.sprite.y += 150 * speedFactor
        
        if (prop.sprite.y > this.screenH + 50) {
          prop.sprite.destroy()
          prop.isActive = false
        }
      }
    })
    
    this.props = this.props.filter(p => p.isActive)
  }

  /**
   * 碰撞检测
   */
  private checkCollisions(): void {
    if (!this.player.isActive || this.isGameOver) return
    
    // 玩家子弹击中敌机
    this.playerBullets.forEach(bullet => {
      if (!bullet.isActive) return
      
      this.enemies.forEach(enemy => {
        if (!enemy.isActive) return
        
        const distance = Phaser.Math.Distance.Between(
          bullet.sprite.x,
          bullet.sprite.y,
          enemy.sprite.x,
          enemy.sprite.y
        )
        
        if (distance < this.cellSize * 0.5) {
          // 命中
          bullet.sprite.destroy()
          bullet.isActive = false
          
          enemy.health -= bullet.damage
          
          if (enemy.health <= 0) {
            // 敌机击毁
            this.destroyEnemy(enemy)
          }
        }
      })
    })
    
    // 敌机子弹击中玩家
    this.enemyBullets.forEach(bullet => {
      if (!bullet.isActive) return
      
      const distance = Phaser.Math.Distance.Between(
        bullet.sprite.x,
        bullet.sprite.y,
        this.player.sprite.x,
        this.player.sprite.y
      )
      
      if (distance < this.cellSize * 0.5) {
        bullet.sprite.destroy()
        bullet.isActive = false
        this.playerHit()
      }
    })
    
    // 敌机撞击玩家
    this.enemies.forEach(enemy => {
      if (!enemy.isActive) return
      
      const distance = Phaser.Math.Distance.Between(
        enemy.sprite.x,
        enemy.sprite.y,
        this.player.sprite.x,
        this.player.sprite.y
      )
      
      if (distance < this.cellSize * 0.6) {
        this.destroyEnemy(enemy)
        this.playerHit()
      }
    })
    
    // 玩家拾取道具
    this.props.forEach(prop => {
      if (!prop.isActive) return
      
      const distance = Phaser.Math.Distance.Between(
        prop.sprite.x,
        prop.sprite.y,
        this.player.sprite.x,
        this.player.sprite.y
      )
      
      if (distance < this.cellSize * 0.6) {
        this.collectProp(prop)
      }
    })
  }

  /**
   * 玩家被击中
   */
  private playerHit(): void {
    if (this.hasShield) {
      // 护盾抵挡一次伤害
      this.hasShield = false
      this.sound.play('sfx_hit', { volume: 0.5 })
      return
    }
    
    this.playerHealth--
    this.healthText.setText(`❤️ 生命：${this.playerHealth}/${this.maxHealth}`)
    
    // 播放受伤闪烁效果
    this.tweens.add({
      targets: this.player.sprite,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 3
    })
    
    this.sound.play('sfx_hit', { volume: 0.5 })
    
    if (this.playerHealth <= 0) {
      this.handleGameOver()
    }
  }

  /**
   * 击毁敌机
   */
  private destroyEnemy(enemy: Enemy): void {
    // 增加分数
    this.score += enemy.scoreValue
    this.scoreText.setText(`🎯 得分：${this.score}`)
    
    // 播放爆炸动画
    const explosion = this.add.image(enemy.sprite.x, enemy.sprite.y, 'explosion')
      .setDisplaySize(this.cellSize, this.cellSize)
    this.tweens.add({
      targets: explosion,
      scale: 1.5,
      alpha: 0,
      duration: 300,
      onComplete: () => explosion.destroy()
    })
    
    this.sound.play('sfx_explosion', { volume: 0.4 })
    
    // 随机掉落道具
    if (Math.random() < this.propDropChance) {
      this.spawnProp(enemy.sprite.x, enemy.sprite.y)
    }
    
    // 标记为 inactive
    enemy.sprite.destroy()
    enemy.isActive = false
    enemy.shootTimer?.remove()
  }

  /**
   * 生成道具
   */
  private spawnProp(x: number, y: number): void {
    const rand = Math.random()
    let propType: 'double' | 'shield' | 'heart' | 'bomb' = 'double'
    let texture = 'prop_double'
    
    if (rand < 0.25) {
      propType = 'shield'
      texture = 'prop_shield'
    } else if (rand < 0.40) {
      propType = 'heart'
      texture = 'prop_heart'
    } else if (rand < 0.50) {
      propType = 'bomb'
      texture = 'prop_bomb'
    }
    
    const prop: Prop = {
      sprite: this.add.image(x, y, texture)
        .setDisplaySize(this.cellSize * 0.5, this.cellSize * 0.5)
        .setDepth(7),
      isActive: true,
      speed: 150,
      propType
    }
    
    this.props.push(prop)
  }

  /**
   * 拾取道具
   */
  private collectProp(prop: Prop): void {
    prop.sprite.destroy()
    prop.isActive = false
    
    this.sound.play('sfx_prop', { volume: 0.5 })
    
    switch (prop.propType) {
      case 'double':
        // 双发子弹 10 秒
        if (this.doubleBulletTimer) {
          this.doubleBulletTimer.remove()
        }
        this.doubleBulletTimer = this.time.addEvent({
          delay: 10000,
          callback: () => {
            this.doubleBulletTimer = null
          }
        })
        break
        
      case 'shield':
        this.hasShield = true
        break
        
      case 'heart':
        if (this.playerHealth < this.maxHealth) {
          this.playerHealth++
          this.healthText.setText(`❤️ 生命：${this.playerHealth}/${this.maxHealth}`)
        }
        break
        
      case 'bomb':
        this.bombCount++
        this.bombText.setText(`💣 炸弹：${this.bombCount}`)
        break
    }
  }

  /**
   * 边界检查
   */
  private checkBoundaries(): void {
    const halfSize = this.cellSize * 0.4
    
    // 玩家边界
    if (this.player.sprite.x < halfSize) this.player.sprite.x = halfSize
    if (this.player.sprite.x > this.screenW - halfSize) this.player.sprite.x = this.screenW - halfSize
    if (this.player.sprite.y < halfSize) this.player.sprite.y = halfSize
    if (this.player.sprite.y > this.screenH - halfSize) this.player.sprite.y = this.screenH - halfSize
  }

  /**
   * 更新难度
   */
  private updateDifficulty(): void {
    // 每 30 秒增加难度
    if (this.gameTime % 30 === 0) {
      this.difficultyMultiplier += 0.1
      this.enemySpawnInterval = Math.max(500, this.enemySpawnInterval - 100)
      
      // 重置生成器
      this.enemySpawnTimer?.remove()
      this.startEnemySpawner()
    }
    
    this.timeText.setText(`⏱️ ${this.formatTime(this.gameTime)}`)
  }

  /**
   * 格式化时间
   */
  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
}
