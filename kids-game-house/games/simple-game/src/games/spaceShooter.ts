import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { app } from '../App'
import { Scene, Textures, Input, Math as PhaserMath, GameObjects } from 'phaser'

/**
 * 太空射击游戏 - Phaser ScaleManager FIT 模式
 * 
 * 适配策略：Phaser FIT（等比缩放，完整显示，自动居中）
 * - 设计分辨率：400 x 600
 * - Canvas 等比缩放以适应屏幕，保持完整显示不变形
 * - 自动居中对齐，多余空间用背景色填充
 * - 使用 viewport 单位确保容器完全填满视口
 * - 渲染：通过 Phaser CanvasTexture 在 Canvas 2D 上绘制，保持原有绘制代码
 */
export function initSpaceShooter(engine: GameEngine, onEnd: () => void) {
  // === 设计分辨率 ===（9:16 比例，贴近手机屏幕）
  const BASE_W = 360, BASE_H = 640

  // === 创建 Phaser 游戏容器 ===
  const gameContainer = document.getElementById('gameCanvas')!
  gameContainer.innerHTML = ''

  // === 判断终端类型 ===
  const isMobile = /Android|iPhone|iPad|iPod|MicroMessenger/i.test(navigator.userAgent) 
    || (window.visualViewport ? window.visualViewport.width < 768 : window.innerWidth < 768)

  // === 创建 Phaser 父容器 ===
  const phaserParent = document.createElement('div')
  phaserParent.id = 'phaser-space-shooter'
  // 全屏覆盖，无留白 - 使用 viewport 单位确保完全填满
  phaserParent.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1000;
    background: linear-gradient(to bottom, #0a0a2e 0%, #1a1a3e 50%, #0a0a2e 100%);
    overflow: hidden;
    margin: 0;
    padding: 0;
  `
  document.body.appendChild(phaserParent)

  // === Phaser Scene：太空射击 ===
  class SpaceShooterScene extends Scene {
    // Canvas 2D 绘制用的 texture
    private gameTexture!: Textures.CanvasTexture
    private ctx!: CanvasRenderingContext2D

    // 游戏状态
    private playerX = BASE_W / 2
    private playerY = BASE_H - 55
    private bullets: { x: number; y: number; vx: number; vy: number; pierce: number; originX?: number }[] = []
    private enemies: { x: number; y: number; w: number; h: number; hp: number; maxHp: number; score: number; color: string; shape: string; speed: number; shootTimer: number }[] = []
    private enemyBullets: { x: number; y: number; vx: number; vy: number; color: string }[] = []
    private particles: { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[] = []
    private shockwaves: { x: number; y: number; radius: number; maxRadius: number; life: number; color: string }[] = []
    private floatTexts: { text: string; x: number; y: number; life: number; color: string; size: number; vy: number; scale: number }[] = []
    private powerups: { x: number; y: number; type: string; life: number }[] = []
    private stars: { x: number; y: number; speed: number; size: number; bright: number }[] = []

    private gameStarted = false
    private gameEnded = false
    private gameWon = false
    private lastShot = 0
    private elapsed = 0
    private startTime = 0
    private difficulty = 1
    private combo = 0
    private maxCombo = 0
    private comboTimer = 0
    private shakeAmt = 0
    private slowMo = 0
    private slowMoFactor = 1
    private playerHP = 5
    private maxHP = 5
    private invincible = 0
    private playerLevel = 1
    private tripleShot = 0
    private tripleStacks = 0
    private spreadShot = 0
    private spreadStacks = 0
    private rapidShot = 0
    private rapidStacks = 0
    private laserShot = 0
    private laserStacks = 0
    private pierceShot = 0
    private pierceStacks = 0

    // Buff 上限控制
    private readonly MAX_ACTIVE_BUFFS = 3  // 最多3种不同buff同时激活
    private activeBuffOrder: string[] = [] // 跟踪 buff 激活顺序
    private screenFlash = 0
    private spawnTimer = 0
    private waveCount = 0
    private magnetRange = 0
    private magnetTimer = 0
    private totalKills = 0

    // 最终BOSS状态
    private finalBossSpawned = false  // 是否已生成最终BOSS
    private finalBossWarningShown = false  // 是否已显示BOSS警告
    private finalBoss: typeof this.enemies[0] | null = null  // 最终BOSS引用
    private bossMinionTimer = 0  // 小飞机生成计时器

    private mouseDown = false



    // 安全区（ENVELOP 模式下可能裁切，关键 UI 放在此范围内）
    private readonly SAFE_L = 20
    private readonly SAFE_R = 25
    private readonly SAFE_T = 15
    private readonly SAFE_B = 15

    // 配置
    private readonly PLAYER_W = 36
    private readonly PLAYER_H = 32
    private readonly BULLET_SPEED = 12
    private readonly SHOOT_CD = 120
    private readonly STAR_COUNT = 80
    private readonly TOUCH_OFFSET_Y = 80
    private readonly MAGNET_BASE_RANGE = 80

    // 性能限制：各种对象的最大数量
    private readonly MAX_BULLETS = 30
    private readonly MAX_ENEMY_BULLETS = 40
    private readonly MAX_PARTICLES = 120  // 提升粒子上限到120
    private readonly MAX_FLOAT_TEXTS = 8   // 减少浮动文字上限
    private readonly MAX_SHOCKWAVES = 5    // 限制冲击波数量
    private readonly MAX_POWERUPS = 8

    private readonly ENEMY_TYPES = [
      { w: 24, h: 20, hp: 1, score: 10, color: '#FF6B6B', shape: 'circle', speed: 1.0 },
      { w: 30, h: 26, hp: 1, score: 25, color: '#FFA502', shape: 'diamond', speed: 0.8 },
      { w: 36, h: 30, hp: 2, score: 60, color: '#FF4757', shape: 'hex', speed: 0.6 },
      { w: 42, h: 36, hp: 3, score: 150, color: '#9C27B0', shape: 'boss', speed: 0.4 },
      // 最终BOSS（第10级出现）- 超高血量，固定在顶部
      { w: 80, h: 70, hp: 5000, score: 1000, color: '#FF0000', shape: 'final_boss', speed: 0 },
    ]

    // 道具通过击杀敌人掉落自动拾取，无需手动购买

    // 渲染用的 Image 对象
    private gameImage!: GameObjects.Image

    constructor() {
      super({ key: 'SpaceShooterScene' })
    }

    preload() {
      // 创建 CanvasTexture 作为渲染目标
      const texture = this.textures.createCanvas('gameCanvas', BASE_W, BASE_H)
      if (!texture) throw new Error('Failed to create canvas texture')
      this.gameTexture = texture
      this.ctx = this.gameTexture.getContext() as CanvasRenderingContext2D
      this.ctx.imageSmoothingEnabled = true
      this.ctx.imageSmoothingQuality = 'high'
    }

    create() {
      // 将 CanvasTexture 显示为全屏 Image
      this.gameImage = this.add.image(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        'gameCanvas'
      )

      // 初始化星空
      this.initStars()

      // 设置输入
      this.setupInput()

      // 开始游戏
      this.startTime = Date.now()
    }

    update(_time: number, delta: number) {
      if (this.gameEnded && !this.gameWon) return

      // 慢动作：击杀 boss 时短暂慢放
      let dt = delta
      if (this.slowMo > 0) {
        this.slowMo -= delta / 1000
        dt *= this.slowMoFactor
      }

      if (this.gameStarted) {
        this.elapsed = (Date.now() - this.startTime) / 1000
        this.difficulty = 1 + this.elapsed / 10 // 难度增长加速：15→10秒/级
      }

      // 生成敌人
      if (this.gameStarted) {
        // 检查是否到达第10级且未生成最终BOSS
        const currentLevel = this.getPowerupLevel()
        
        // 每5秒输出一次调试信息
        if (Math.floor(this.elapsed) % 5 === 0 && Math.floor(this.elapsed * 10) % 10 < 2) {
          console.log(`[SpaceShooter] 时间: ${Math.floor(this.elapsed)}s, 等级: Lv${currentLevel}, BOSS已生成: ${this.finalBossSpawned}, 游戏结束: ${this.gameEnded}`)
        }
        
        // 在第9级时显示警告
        if (currentLevel === 9 && !this.finalBossSpawned && !this.finalBossWarningShown) {
          this.finalBossWarningShown = true
          console.log('[SpaceShooter] ⚠️ 第9级，显示BOSS预警')
          this.floatTexts.push({
            text: 'BOSS approaching!',
            x: BASE_W / 2,
            y: BASE_H / 2,
            life: 2.5,
            color: '#FF6B6B',
            size: 20,
            vy: -0.8,
            scale: 1
          })
        }
        
        if (currentLevel >= 10 && !this.finalBossSpawned && !this.gameEnded) {
          console.log('[SpaceShooter] 🔥 第10级，生成最终BOSS！')
          this.spawnFinalBoss()
          return  // 生成BOSS后暂停普通敌人生成
        }
        
        // 如果最终BOSS已存在，减少普通敌人生成频率
        const spawnInterval = this.finalBoss 
          ? Math.max(800, 2000 - this.difficulty * 100)  // BOSS战时生成更慢
          : Math.max(250, 1400 - this.difficulty * 130)  // 正常速度
        
        this.spawnTimer -= dt
        if (this.spawnTimer <= 0) {
          this.spawnEnemy()
          this.spawnTimer = spawnInterval
          this.waveCount++
          // 更密集的波次（每3波，不是4波）
          if (this.waveCount % 3 === 0 && !this.finalBoss) {
            this.time.delayedCall(100, () => { if (!this.gameEnded) this.spawnEnemy() })
            this.time.delayedCall(250, () => { if (!this.gameEnded) this.spawnEnemy() })
          }
        }
      }

      // 自动射击（游戏开始后始终自动开火）
      if (this.gameStarted) {
        this.shoot()
      }

      // 更新游戏逻辑
      this.updateBullets()
      this.updateEnemies(dt)
      this.updateEnemyBullets()
      this.updatePowerups(dt)
      this.updateTimers(dt)

      // 绘制到 CanvasTexture
      this.renderToCanvas()

      // 刷新纹理
      this.gameTexture.refresh()
    }

    // === 输入处理 ===
    private setupInput() {
      this.input.on('pointerdown', (pointer: Input.Pointer) => {
        if (this.gameEnded) return

        const pos = this.screenToLogical(pointer)

        this.playerX = pos.x
        this.playerY = pos.y - this.TOUCH_OFFSET_Y
        this.clampPlayer()
        this.mouseDown = true
        if (!this.gameStarted) {
          this.gameStarted = true
          this.startTime = Date.now()
        }
      })

      this.input.on('pointermove', (pointer: Input.Pointer) => {
        if (this.gameEnded || !pointer.isDown) return
        const pos = this.screenToLogical(pointer)
        this.playerX = pos.x
        this.playerY = pos.y - this.TOUCH_OFFSET_Y
        this.clampPlayer()
      })

      this.input.on('pointerup', () => {
        this.mouseDown = false
      })
    }

    /** 屏幕坐标 → 逻辑坐标（ENVELOP 模式下需要考虑裁切偏移） */
    private screenToLogical(pointer: Input.Pointer): { x: number; y: number } {
      const cam = this.cameras.main
      // Phaser 的 pointer 坐标已经是世界坐标
      return { x: pointer.x - cam.scrollX, y: pointer.y - cam.scrollY }
    }

    private clampPlayer() {
      this.playerX = PhaserMath.Clamp(this.playerX, this.PLAYER_W / 2, BASE_W - this.PLAYER_W / 2)
      this.playerY = PhaserMath.Clamp(this.playerY, BASE_H * 0.3, BASE_H - 25)
    }

    // === 道具等级系统 ===
    private getPowerupLevel(): number {
      // 快速升级模式：每8秒升一级，80秒达到10级
      return Math.min(10, Math.floor(this.elapsed / 8) + 1)
    }
    private getPlayerLevel(): number { return this.getPowerupLevel() }
    private getPlayerDamage(): number { return this.getPlayerLevel() >= 6 ? 2 : 1 }
    private getPowerupDropRate(): number {
      return Math.min(0.30, 0.15 + this.getPowerupLevel() * 0.015) // 降低基础掉率和上限
    }

    private getRandomPowerupType(): string {
      const level = this.getPowerupLevel()
      const r = Math.random()
      if (level >= 8) {
        if (r < 0.05) return 'laser'; if (r < 0.10) return 'shield'
        if (r < 0.16) return 'rapid'; if (r < 0.22) return 'pierce'
        if (r < 0.28) return 'magnet'; if (r < 0.36) return 'bomb'
        if (r < 0.56) return 'triple'; if (r < 0.76) return 'spread'; return 'heal'
      } else if (level >= 6) {
        if (r < 0.04) return 'laser'; if (r < 0.08) return 'shield'
        if (r < 0.14) return 'rapid'; if (r < 0.20) return 'pierce'
        if (r < 0.25) return 'magnet'; if (r < 0.34) return 'bomb'
        if (r < 0.56) return 'triple'; if (r < 0.78) return 'spread'; return 'heal'
      } else if (level >= 4) {
        if (r < 0.03) return 'laser'; if (r < 0.06) return 'shield'
        if (r < 0.11) return 'rapid'; if (r < 0.16) return 'pierce'
        if (r < 0.22) return 'magnet'; if (r < 0.32) return 'bomb'
        if (r < 0.56) return 'triple'; if (r < 0.80) return 'spread'; return 'heal'
      } else if (level >= 2) {
        if (r < 0.02) return 'laser'; if (r < 0.04) return 'shield'
        if (r < 0.08) return 'rapid'; if (r < 0.14) return 'pierce'
        if (r < 0.20) return 'bomb'; if (r < 0.46) return 'triple'
        if (r < 0.72) return 'spread'; return 'heal'
      } else {
        if (r < 0.30) return 'triple'; if (r < 0.55) return 'spread'
        if (r < 0.80) return 'heal'; return 'bomb'
      }
    }

    // === 道具使用 ===
    private activateBuff(buffType: string, duration: number): void {
      // 如果已激活，刷新时长但不叠加
      if (this[buffType] > 0) {
        this[buffType] = duration
        return
      }
      // 超过上限：移除最早激活的 buff
      if (this.activeBuffOrder.length >= this.MAX_ACTIVE_BUFFS) {
        const oldest = this.activeBuffOrder.shift()!
        this[oldest] = 0
        // 清理对应的 stacks
        if (oldest === 'tripleShot') this.tripleStacks = 0
        if (oldest === 'spreadShot') this.spreadStacks = 0
        if (oldest === 'rapidShot') this.rapidStacks = 0
        if (oldest === 'laserShot') this.laserStacks = 0
        if (oldest === 'pierceShot') this.pierceStacks = 0
      }
      this[buffType] = duration
      this.activeBuffOrder.push(buffType)
    }

    private getActiveBuffCount(): number {
      let count = 0
      if (this.tripleShot > 0) count++
      if (this.spreadShot > 0) count++
      if (this.rapidShot > 0) count++
      if (this.laserShot > 0) count++
      if (this.pierceShot > 0) count++
      return count
    }

    private usePowerupImmediately(type: string): void {
      const level = this.getPowerupLevel()
      switch (type) {
        case 'triple': {
          const dur = 5000 // 固定5秒，不再叠加
          const count = 3
          this.activateBuff('tripleShot', dur)
          for (let i = 0; i < count; i++) {
            const ox = (i - Math.floor(count / 2)) * 8
            this.bullets.push({ x: this.playerX + ox, y: this.playerY - this.PLAYER_H / 2, vx: 0, vy: -this.BULLET_SPEED * 1.3, pierce: this.pierceShot > 0 ? 3 : 0, originX: this.playerX })
          }
          this.explode(this.playerX, this.playerY, '#FFD700', 10, 4)
          audioService.win(); break
        }
        case 'spread': {
          const cnt = 7
          const ang = 0.18
          const dur = 4000 // 固定4秒
          this.activateBuff('spreadShot', dur)
          for (let i = Math.floor(-cnt / 2); i <= Math.floor(cnt / 2); i++) {
            const a = -Math.PI / 2 + i * ang
            this.bullets.push({
              x: this.playerX, y: this.playerY - this.PLAYER_H / 2,
              vx: Math.cos(a) * this.BULLET_SPEED * 1.2,
              vy: Math.sin(a) * this.BULLET_SPEED * 1.2,
              pierce: this.pierceShot > 0 ? 2 : 0,
              originX: this.playerX,
            })
          }
          this.explode(this.playerX, this.playerY, '#FF6B6B', 10, 4)
          audioService.win(); break
        }
        case 'heal': {
          const amt = 1
          const old = this.playerHP
          this.playerHP = Math.min(this.maxHP, this.playerHP + amt)
          if (this.playerHP > old) {
            this.explode(this.playerX, this.playerY, '#00E676', 12, 3)
            this.floatTexts.push({ text: `+${this.playerHP - old} ❤️`, x: this.playerX, y: this.playerY - 40, life: 1.5, color: '#00E676', size: 22, vy: -2, scale: 1.3 })
          }
          audioService.win(); break
        }
        case 'bomb': {
          // 🎆 清屏：超级爽快爆炸（不占 buff 位）
          this.enemies.forEach(en => {
            // BOSS免疫清屏，只受到比例伤害
            if (en.shape === 'final_boss') {
              const damagePercent = 0.15 // 造成15%最大血量的伤害
              const damage = Math.floor(en.maxHp * damagePercent)
              en.hp -= damage
              this.explode(en.x, en.y, '#FF0000', 20, 4)
              this.floatTexts.push({ 
                text: `-${damage}`, 
                x: en.x, 
                y: en.y - 20, 
                life: 0.8, 
                color: '#FF6B6B', 
                size: 16, 
                vy: -1.5, 
                scale: 1 
              })
            } else {
              // 普通敌人直接消灭
              this.explode(en.x, en.y, en.color, 30, 5)
              this.addShockwave(en.x, en.y, 50, en.color)
              engine.addScore(en.score, en.x, en.y)
              this.totalKills++
            }
          })
          
          // 移除所有非BOSS敌人
          this.enemies = this.enemies.filter(en => en.shape === 'final_boss')
          this.enemyBullets.length = 0
          
          this.screenFlash = 0.5; this.shakeAmt = 10
          this.addShockwave(BASE_W / 2, BASE_H / 2, 150, '#FFFFFF')
          this.explode(BASE_W / 2, BASE_H / 2, '#FFFFFF', 40, 8)
          this.slowMo = 0.4; this.slowMoFactor = 0.3
          this.floatTexts.push({ text: '清屏！', x: BASE_W / 2, y: BASE_H / 2, life: 1.0, color: '#FFD700', size: 24, vy: -1, scale: 1 })
          audioService.win(); break
        }
        case 'shield': {
          const dur = 10 // 10秒无敌
          this.invincible = dur
          this.addShockwave(this.playerX, this.playerY, 80, '#4FC3F7')
          audioService.win(); break
        }
        case 'rapid': {
          const dur = 4000 // 固定4秒
          this.activateBuff('rapidShot', dur)
          this.lastShot = Date.now() - this.SHOOT_CD + 500
          this.explode(this.playerX, this.playerY, '#FF5722', 10, 4)
          audioService.win(); break
        }
        case 'laser': {
          const dur = 3000 // 固定3秒，强力但短
          this.activateBuff('laserShot', dur)
          const cnt = 5
          const spd = this.BULLET_SPEED * 2.5
          for (let i = 0; i < cnt; i++) {
            this.time.delayedCall(i * 40, () => {
              if (!this.gameEnded) {
                this.bullets.push({ x: this.playerX, y: this.playerY - this.PLAYER_H / 2, vx: 0, vy: -spd, pierce: 3, originX: this.playerX })
                this.explode(this.playerX, this.playerY - this.PLAYER_H / 2, '#E040FB', 8, 3)
              }
            })
          }
          audioService.win(); break
        }
        case 'pierce': {
          const dur = 4000 // 固定4秒
          this.activateBuff('pierceShot', dur)
          this.explode(this.playerX, this.playerY, '#FF9800', 10, 3)
          this.floatTexts.push({ text: '击穿弹', x: this.playerX, y: this.playerY - 30, life: 0.8, color: '#FF9800', size: 14, vy: -1.5, scale: 1 })
          audioService.win(); break
        }
        case 'magnet': {
          const dur = 5 // 固定5秒（不占 buff 位）
          this.magnetRange = this.MAGNET_BASE_RANGE
          this.magnetTimer = dur
          this.explode(this.playerX, this.playerY, '#FF4081', 10, 3)
          this.floatTexts.push({ text: '磁铁', x: this.playerX, y: this.playerY - 30, life: 0.8, color: '#FF4081', size: 14, vy: -1.5, scale: 1 })
          audioService.win(); break
        }
      }
    }

    // === 星空初始化 ===
    private initStars() {
      this.stars.length = 0
      for (let i = 0; i < this.STAR_COUNT; i++) {
        this.stars.push({
          x: Math.random() * BASE_W, y: Math.random() * BASE_H,
          speed: 0.3 + Math.random() * 1.5,
          size: 0.5 + Math.random() * 2,
          bright: 0.3 + Math.random() * 0.7,
        })
      }
    }

    // === 敌人生成 ===
    private spawnEnemy() {
      let typeIdx = 0
      const r = Math.random()
      // 高级敌人更早出现、概率更高
      if (this.difficulty >= 4 && r < 0.25) typeIdx = 3      // boss 4级出 (原5级)
      else if (this.difficulty >= 2.5 && r < 0.45) typeIdx = 2 // hex 2.5级出 (原3级)
      else if (this.difficulty >= 1.5 && r < 0.70) typeIdx = 1 // diamond 1.5级出 (原2级)
      const type = this.ENEMY_TYPES[typeIdx]
      const hpBonus = Math.max(0, Math.floor((this.difficulty - 1) * 0.8))  // 1级后才开始增长，系数0.8
      const hp = type.hp + hpBonus
      this.enemies.push({
        x: 30 + Math.random() * (BASE_W - 60), y: -type.h,
        w: type.w, h: type.h,
        hp, maxHp: hp,
        score: type.score, color: type.color, shape: type.shape,
        speed: type.speed * (1 + this.difficulty * 0.2), // 速度增长更快 (原0.15)
        shootTimer: 2000 + Math.random() * 2000,  // 初始射击间隔更长
      })
    }

    // === 生成最终BOSS ===
    private spawnFinalBoss() {
      console.log('[SpaceShooter] 🎯 spawnFinalBoss 被调用')
      this.finalBossSpawned = true
      const bossType = this.ENEMY_TYPES[4]  // 最终BOSS类型
      
      console.log('[SpaceShooter] BOSS类型:', bossType)
      
      // BOSS固定在屏幕顶部中央（不往下移动）
      const boss = {
        x: BASE_W / 2,
        y: 80,  // 固定在顶部，距离顶部80像素
        w: bossType.w,
        h: bossType.h,
        hp: bossType.hp,
        maxHp: bossType.hp,
        score: bossType.score,
        color: bossType.color,
        shape: bossType.shape,
        speed: 0,  // 速度为0，不移动
        shootTimer: 1500,  // BOSS射击间隔
      }
      
      console.log('[SpaceShooter] BOSS对象:', boss)
      
      this.enemies.push(boss)
      this.finalBoss = boss
      
      console.log('[SpaceShooter] 敌人列表长度:', this.enemies.length)
      console.log('[SpaceShooter] finalBoss引用:', this.finalBoss)
      
      // 显示BOSS警告
      this.floatTexts.push({
        text: '最终BOSS',
        x: BASE_W / 2,
        y: BASE_H / 2,
        life: 2.5,
        color: '#FF6B6B',
        size: 28,
        vy: -0.8,
        scale: 1
      })
      
      console.log('[SpaceShooter] ✅ BOSS生成完成！')
      
      // 播放警告音效
      audioService.win()
    }

    // === 射击 ===
    private shoot() {
      // 子弹数量上限
      if (this.bullets.length >= this.MAX_BULLETS) return
      const now = Date.now()
      let cd = this.SHOOT_CD
      if (this.rapidShot > 0) {
        cd = this.SHOOT_CD * 0.4 // 固定加速，不再叠加
      }
      if (now - this.lastShot < cd) return
      this.lastShot = now

      const pierceCount = this.pierceShot > 0 ? 3 : 0 // 固定穿透数，不再叠加

      if (this.tripleShot > 0) {
        for (let i = 0; i < 3; i++) { // 固定3发，不再叠加
          const ox = (i - 1) * 8
          this.bullets.push({ x: this.playerX + ox, y: this.playerY - this.PLAYER_H / 2, vx: 0, vy: -this.BULLET_SPEED, pierce: pierceCount, originX: this.playerX })
        }
      } else if (this.spreadShot > 0) {
        for (let i = -3; i <= 3; i++) { // 固定7发，不再叠加
          const a = -Math.PI / 2 + i * 0.18
          this.bullets.push({ x: this.playerX, y: this.playerY - this.PLAYER_H / 2, vx: Math.cos(a) * this.BULLET_SPEED, vy: Math.sin(a) * this.BULLET_SPEED, pierce: pierceCount, originX: this.playerX })
        }
      } else {
        this.bullets.push({ x: this.playerX, y: this.playerY - this.PLAYER_H / 2, vx: 0, vy: -this.BULLET_SPEED, pierce: pierceCount, originX: this.playerX })
      }
      audioService.click()
    }

    // === 爆炸粒子 ===
    private explode(x: number, y: number, color: string, count: number, force: number = 5) {
      // 超过粒子上限，减少生成量
      const budget = this.MAX_PARTICLES - this.particles.length
      const actual = Math.min(count, Math.max(3, budget))
      for (let i = 0; i < actual; i++) {
        const a = Math.random() * Math.PI * 2
        const s = Math.random() * force + 1
        this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, color, size: 2 + Math.random() * 4 })
      }
    }

    // === 冲击波 ===
    private addShockwave(x: number, y: number, maxRadius: number, color: string) {
      this.shockwaves.push({ x, y, radius: 0, maxRadius, life: 1, color })
    }

    // === 碰撞检测 ===
    private rectCollide(ax: number, ay: number, aw: number, ah: number,
      bx: number, by: number, bw: number, bh: number): boolean {
      return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
    }

    // === 更新子弹 ===
    private updateBullets() {
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i]
        
        // 曲线路径：根据发射位置和当前位置的差值产生偏移
        if (b.originX !== undefined && b.vx === 0) {
          // 计算玩家移动的距离
          const playerMoveX = this.playerX - b.originX
          // 子弹飞行距离（从发射点算起）
          const flyDistance = (BASE_H - 55) - b.y
          // 曲线系数：飞行越远，偏移越大，但逐渐减弱
          const curveFactor = Math.min(flyDistance / 300, 1.0) * 0.3
          // 应用曲线偏移
          b.x += playerMoveX * curveFactor * 0.1
        }
        
        b.x += b.vx; b.y += b.vy
        if (b.y < -10 || b.x < -10 || b.x > BASE_W + 10) { this.bullets.splice(i, 1); continue }

        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j]
          if (this.rectCollide(b.x - 3, b.y - 5, 6, 10, e.x - e.w / 2, e.y - e.h / 2, e.w, e.h)) {
            // 击穿弹：穿透不消失
            if (b.pierce > 0) {
              b.pierce--
            } else {
              this.bullets.splice(i, 1)
            }
            
            // 计算伤害（BOSS有伤害上限）
            let dmg = this.getPlayerDamage()
            if (e.shape === 'final_boss') {
              // BOSS每次最多受到3点伤害，防止被秒杀
              dmg = Math.min(dmg, 3)
            }
            
            e.hp -= dmg
            this.explode(b.x, b.y, '#FFD700', 6 + dmg * 3, 3 + dmg)
            if (e.hp <= 0) {
              this.combo++; this.comboTimer = 3; this.totalKills++
              if (this.combo > this.maxCombo) this.maxCombo = this.combo

              // 🎆 超爽击杀反馈
              const comboMultiplier = Math.min(this.combo, 30)
              engine.addScore(e.score * comboMultiplier, e.x, e.y)

              // 爆炸规模随连击增大（但限制最大值）
              const expSize = Math.min(60, 25 + e.maxHp * 10 + this.combo * 2)  // 最大60
              const pCnt = Math.min(30, 10 + e.maxHp * 5 + this.combo)  // 最大30
              
              // 根据敌人类型决定爆炸次数（减少后期特效）
              if (e.shape === 'boss') {
                // Boss: 3次爆炸（保持炫酷）
                this.explode(e.x, e.y, e.color, expSize, pCnt)
                this.explode(e.x, e.y, '#FFD700', expSize * 0.7, pCnt * 0.8)
                this.explode(e.x, e.y, '#FFFFFF', Math.floor(expSize * 0.3), pCnt * 0.4)
              } else if (e.maxHp >= 3) {
                // 重型敌人：2次爆炸
                this.explode(e.x, e.y, e.color, expSize, pCnt)
                this.explode(e.x, e.y, '#FFD700', expSize * 0.6, pCnt * 0.6)
              } else {
                // 普通敌人：1次爆炸
                this.explode(e.x, e.y, e.color, expSize, pCnt)
              }

              // 冲击波（限制数量）
              if (this.shockwaves.length < this.MAX_SHOCKWAVES && (e.shape === 'boss' || e.maxHp >= 3)) {
                this.addShockwave(e.x, e.y, 80 + this.combo * 5, e.color)
              }

              // 屏幕震动随连击增强
              if (this.combo >= 20) this.shakeAmt = 14
              else if (this.combo >= 10) this.shakeAmt = 10
              else if (this.combo >= 5) this.shakeAmt = 6
              else this.shakeAmt = 3

              // Boss 击杀慢动作
              if (e.shape === 'boss') {
                this.slowMo = 0.5; this.slowMoFactor = 0.3
                this.screenFlash = 0.4
              }

              // 连击文字（限制显示频率，减小尺寸）
              if (this.combo >= 3 && this.floatTexts.length < this.MAX_FLOAT_TEXTS - 2) {
                const comboText = this.combo >= 20 ? `${this.combo} COMBO` :
                                  this.combo >= 10 ? `${this.combo} COMBO` :
                                  `${this.combo} COMBO`
                const comboColor = this.combo >= 20 ? '#FF6B6B' : this.combo >= 10 ? '#FFD700' : '#4FC3F7'
                const comboSize = Math.min(20, 14 + Math.floor(this.combo / 5))  // 最大20px，增长更慢
                this.floatTexts.push({ text: comboText, x: e.x, y: e.y - 15, life: 1.0, color: comboColor, size: comboSize, vy: -1.5, scale: 1 })
              }

              // 分数飞出（限制数量，减小尺寸）
              if (this.floatTexts.length < this.MAX_FLOAT_TEXTS) {
                const scoreText = `+${e.score * comboMultiplier}`
                this.floatTexts.push({ text: scoreText, x: e.x, y: e.y + 5, life: 0.8, color: '#FFD700', size: 12, vy: -1.0, scale: 1 })
              }

              // 掉落道具
              if (Math.random() < this.getPowerupDropRate() && this.powerups.length < this.MAX_POWERUPS) {
                this.powerups.push({ x: e.x, y: e.y, type: this.getRandomPowerupType(), life: 8 })
              }

              if (this.combo >= 5) engine.triggerRandomBuff()
              audioService.win()
              
              // 最终BOSS被击败的特殊处理
              if (e.shape === 'final_boss') {
                // 超大爆炸特效
                this.explode(e.x, e.y, '#FF0000', 80, 50)
                this.explode(e.x, e.y, '#FFD700', 60, 40)
                this.explode(e.x, e.y, '#FFFFFF', 40, 30)
                
                // 多个冲击波
                this.addShockwave(e.x, e.y, 150, '#FF0000')
                this.time.delayedCall(200, () => this.addShockwave(e.x, e.y, 120, '#FFD700'))
                this.time.delayedCall(400, () => this.addShockwave(e.x, e.y, 90, '#FFFFFF'))
                
                // 屏幕震动和闪光
                this.shakeAmt = 20
                this.screenFlash = 0.6
                this.slowMo = 1.0
                this.slowMoFactor = 0.2
                
                // 显示通关文字
                this.floatTexts.push({
                  text: 'BOSS defeated!',
                  x: BASE_W / 2,
                  y: BASE_H / 2,
                  life: 2.5,
                  color: '#FFD700',
                  size: 24,
                  vy: -0.8,
                  scale: 1
                })
                
                // 标记BOSS已 defeat
                this.finalBoss = null
                
                // 延迟后通关
                this.time.delayedCall(2000, () => {
                  this.gameWon = true
                  this.gameEnded = true
                  engine.setVictory(true)
                  engine.endGame()
                  this.doEnd()
                })
              }
              
              this.enemies.splice(j, 1)
            } else {
              audioService.click()
              // 受击火花
              this.explode(b.x, b.y, '#FFD700', 3, 2)
            }
            if (b.pierce <= 0 && this.bullets[i] !== b) break
          }
        }
      }
    }

    // === 更新敌人 ===
    private updateEnemies(dt: number) {
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i]
        
        // 最终BOSS特殊逻辑
        if (e.shape === 'final_boss') {
          // BOSS固定在顶部，不往下移动
          e.y = 80  // 强制固定在y=80位置
          
          // BOSS左右摆动
          e.x += Math.sin(Date.now() / 1000) * 1.5
          // 限制在屏幕内
          e.x = Math.max(e.w / 2, Math.min(BASE_W - e.w / 2, e.x))
          
          // BOSS射击逻辑
          e.shootTimer -= dt
          if (e.shootTimer <= 0) {
            // 多种攻击模式
            const attackPattern = Math.floor(Math.random() * 3)
            
            if (attackPattern === 0) {
              // 模式1：扇形弹幕
              if (this.enemyBullets.length < this.MAX_ENEMY_BULLETS) {
                for (let angle = -0.6; angle <= 0.6; angle += 0.15) {
                  this.enemyBullets.push({
                    x: e.x,
                    y: e.y + e.h / 2,
                    vy: 4 + this.difficulty * 0.5,
                    vx: Math.sin(angle) * 3,
                    color: '#FF0000'
                  })
                }
              }
            } else if (attackPattern === 1) {
              // 模式2：释放小飞机
              if (this.enemies.length < 15) {
                for (let m = 0; m < 3; m++) {
                  const minion = {
                    x: e.x + (m - 1) * 40,
                    y: e.y + e.h,
                    w: 20,
                    h: 18,
                    hp: 1,
                    maxHp: 1,
                    score: 5,
                    color: '#FF6666',
                    shape: 'circle',
                    speed: 2.0,
                    shootTimer: 3000,
                  }
                  this.enemies.push(minion)
                }
              }
            } else {
              // 模式3：环形弹幕
              if (this.enemyBullets.length < this.MAX_ENEMY_BULLETS) {
                const bulletCount = 12
                for (let b = 0; b < bulletCount; b++) {
                  const angle = (Math.PI * 2 / bulletCount) * b + Date.now() / 1000
                  this.enemyBullets.push({
                    x: e.x,
                    y: e.y,
                    vy: Math.sin(angle) * 3,
                    vx: Math.cos(angle) * 3,
                    color: '#FF4444'
                  })
                }
              }
            }
            
            e.shootTimer = 1200 + Math.random() * 800  // 1.2-2秒射击间隔
          }
        } else {
          // 普通敌人逻辑
          e.y += e.speed

          if (this.gameStarted && e.y > 20 && e.y < BASE_H * 0.7) {
            e.shootTimer -= dt
            if (e.shootTimer <= 0) {
              if (e.shape === 'boss') {
                // Boss 扇形弹幕
                if (this.enemyBullets.length < this.MAX_ENEMY_BULLETS) {
                  for (let angle = -0.4; angle <= 0.4; angle += 0.2) {
                    this.enemyBullets.push({ x: e.x, y: e.y + e.h / 2, vy: 4 + this.difficulty * 0.8, vx: Math.sin(angle) * 2.5, color: e.color })
                  }
                }
              } else if (e.shape === 'hex') {
                // Hex 散弹（难度4+双发）
                if (this.enemyBullets.length < this.MAX_ENEMY_BULLETS) {
                  this.enemyBullets.push({ x: e.x, y: e.y + e.h / 2, vy: 4 + this.difficulty * 0.6, vx: -0.5, color: e.color })
                  this.enemyBullets.push({ x: e.x, y: e.y + e.h / 2, vy: 4 + this.difficulty * 0.6, vx: 0.5, color: e.color })
                }
              } else {
                if (this.enemyBullets.length < this.MAX_ENEMY_BULLETS) {
                  this.enemyBullets.push({ x: e.x, y: e.y + e.h / 2, vy: 3.5 + this.difficulty * 0.5, vx: 0, color: e.color })
                }
              }
              const baseInt = e.shape === 'boss' ? 1500 : (e.shape === 'hex' ? 2200 : 3000)
              e.shootTimer = Math.max(800, baseInt - this.difficulty * 60) + Math.random() * 800
            }
          }

          if (e.y > BASE_H + 40) { this.enemies.splice(i, 1); continue }

          // 敌人与玩家碰撞检测
          if (this.invincible <= 0 && this.rectCollide(
            this.playerX - this.PLAYER_W / 2, this.playerY - this.PLAYER_H / 2, this.PLAYER_W, this.PLAYER_H,
            e.x - e.w / 2, e.y - e.h / 2, e.w, e.h
          )) {
            this.playerHP--; this.invincible = 3; this.shakeAmt = 6; this.screenFlash = 0.3; this.combo = 0
            this.explode(this.playerX, this.playerY, '#FF4757', 20, 5)
            audioService.pop()
            this.enemies.splice(i, 1)
            if (this.playerHP <= 0) {
              this.gameEnded = true; engine.endGame()
              this.explode(this.playerX, this.playerY, '#FF4757', 40, 8)
              this.time.delayedCall(800, () => this.doEnd())
              return
            }
          }
        }
      }
    }

    // === 更新掉落道具 ===
    private updatePowerups(dt: number) {
      for (let i = this.powerups.length - 1; i >= 0; i--) {
        const p = this.powerups[i]
        p.y += 0.8; p.life -= dt / 1000
        if (p.y > BASE_H + 20 || p.life <= 0) { this.powerups.splice(i, 1); continue }

        // 磁铁吸附
        const dx = this.playerX - p.x, dy = this.playerY - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const magnetR = this.magnetRange + this.combo * 5
        if (dist < magnetR && dist > 0) {
          const pull = (1 - dist / magnetR) * 8
          p.x += (dx / dist) * pull
          p.y += (dy / dist) * pull
        }

        // 拾取（范围大）
        const pickRange = 30
        if (dist < pickRange) {
          this.usePowerupImmediately(p.type)
          this.powerups.splice(i, 1)
          continue
        }

        // 闪烁快消失
        if (p.life < 2 && Math.floor(p.life * 5) % 2 === 0) continue
      }
    }

    // === 更新敌人子弹 ===
    private updateEnemyBullets() {
      for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
        const b = this.enemyBullets[i]
        b.x += b.vx || 0; b.y += b.vy
        if (b.y > BASE_H + 10 || b.x < -10 || b.x > BASE_W + 10) { this.enemyBullets.splice(i, 1); continue }

        let destroyed = false
        for (let j = this.bullets.length - 1; j >= 0; j--) {
          const pb = this.bullets[j]
          if (this.rectCollide(pb.x - 3, pb.y - 5, 6, 10, b.x - 4, b.y - 6, 8, 12)) {
            this.bullets.splice(j, 1); this.enemyBullets.splice(i, 1)
            this.explode((pb.x + b.x) / 2, (pb.y + b.y) / 2, '#FFD700', 8, 3)
            audioService.click(); destroyed = true; break
          }
        }
        if (destroyed) continue

        if (this.invincible <= 0 && this.rectCollide(
          b.x - 3, b.y - 5, 6, 10,
          this.playerX - this.PLAYER_W / 2, this.playerY - this.PLAYER_H / 2, this.PLAYER_W, this.PLAYER_H
        )) {
          this.playerHP--; this.invincible = 3; this.shakeAmt = 5; this.screenFlash = 0.25; this.combo = 0
          this.explode(this.playerX, this.playerY, '#FF4757', 15, 4)
          audioService.pop()
          this.enemyBullets.splice(i, 1)
          if (this.playerHP <= 0) {
            this.gameEnded = true; engine.endGame()
            this.explode(this.playerX, this.playerY, '#FF4757', 40, 8)
            this.time.delayedCall(800, () => this.doEnd())
            return
          }
        }
      }
    }

    // === 更新计时器 ===
    private updateTimers(dt: number) {
      if (this.invincible > 0) this.invincible -= dt / 1000
      // Buff 过期时从 activeBuffOrder 中移除
      const buffKeys = ['tripleShot', 'spreadShot', 'rapidShot', 'laserShot', 'pierceShot'] as const
      for (const key of buffKeys) {
        if (this[key] > 0) {
          (this[key] as number) -= dt
          if ((this[key] as number) <= 0) {
            (this[key] as number) = 0
            // 重置 stacks
            if (key === 'tripleShot') this.tripleStacks = 0
            if (key === 'spreadShot') this.spreadStacks = 0
            if (key === 'rapidShot') this.rapidStacks = 0
            if (key === 'laserShot') this.laserStacks = 0
            if (key === 'pierceShot') this.pierceStacks = 0
            // 从活跃 buff 列表移除
            this.activeBuffOrder = this.activeBuffOrder.filter(b => b !== key)
          }
        }
      }
      if (this.magnetTimer > 0) { this.magnetTimer -= dt / 1000; if (this.magnetTimer <= 0) { this.magnetRange = 0; this.magnetTimer = 0 } }
      if (this.comboTimer > 0) { this.comboTimer -= dt / 1000; if (this.comboTimer <= 0) this.combo = 0 }
      if (this.shakeAmt > 0) this.shakeAmt *= 0.88
      if (this.shakeAmt < 0.1) this.shakeAmt = 0
      if (this.screenFlash > 0) this.screenFlash -= dt / 1000 * 2.5
    }

    private doEnd() {
      // 收集游戏统计数据
      const gameStats = {
        score: engine.getScore(),
        maxCombo: this.maxCombo,
        totalKills: this.totalKills,
        gameTime: Math.floor(this.elapsed),
        won: this.gameWon,
        level: this.getPowerupLevel()
      }
      
      // 将统计数据传递给gameEngine，供onEnd使用
      ;(engine as any).setGameStats(gameStats)
      
      // onEnd 中已包含 phaserGame.destroy() 和 phaserDiv.remove()
      onEnd()
    }

    // ====================================
    // ===== Canvas 2D 渲染（原有逻辑）=====
    // ====================================

    private renderToCanvas() {
      const ctx = this.ctx
      ctx.clearRect(0, 0, BASE_W, BASE_H)

      // 屏幕震动
      ctx.save()
      if (this.shakeAmt > 0) {
        ctx.translate((Math.random() - 0.5) * this.shakeAmt * 2, (Math.random() - 0.5) * this.shakeAmt * 2)
      }

      // 背景
      this.drawBackground(ctx)

      if (this.gameEnded) {
        this.drawParticles(ctx)
        // 冲击波
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
          const sw = this.shockwaves[i]
          sw.radius += (sw.maxRadius - sw.radius) * 0.12
          sw.life -= 0.035
          if (sw.life <= 0) { this.shockwaves.splice(i, 1); continue }
          ctx.save()
          ctx.globalAlpha = sw.life * 0.6
          ctx.strokeStyle = sw.color; ctx.lineWidth = 2 + sw.life * 3
          ctx.shadowColor = sw.color; ctx.shadowBlur = 10
          ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2); ctx.stroke()
          ctx.restore()
        }
        
        // === 游戏结束界面（Canvas绘制，与 dragonShooter 统一风格）===
        ctx.fillStyle = 'rgba(0,0,0,0.7)'
        ctx.fillRect(0, BASE_H / 2 - 80, BASE_W, 160)
        ctx.fillStyle = '#FFD700'
        ctx.font = 'bold 28px sans-serif'
        ctx.textAlign = 'center'
        ctx.shadowColor = '#FFD700'
        ctx.shadowBlur = 10
        ctx.fillText('🏆 游戏结束', BASE_W / 2, BASE_H / 2 - 40)
        ctx.shadowBlur = 0
        ctx.fillStyle = '#fff'
        ctx.font = '18px sans-serif'
        ctx.fillText(`最终得分 ${engine.getScore()}`, BASE_W / 2, BASE_H / 2 - 5)
        ctx.fillText(`到达关卡: ${this.getPowerupLevel()}`, BASE_W / 2, BASE_H / 2 + 20)
        ctx.fillText(`最高连击 ${this.combo}x`, BASE_W / 2, BASE_H / 2 + 45)
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.font = '14px sans-serif'
        ctx.fillText('点击重新开始', BASE_W / 2, BASE_H / 2 + 70)
        
        ctx.restore()
        return
      }

      // 敌人子弹
      for (const b of this.enemyBullets) {
        ctx.fillStyle = b.color; ctx.shadowColor = b.color; ctx.shadowBlur = 10  // 增强光晕
        ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill()  // 从3增加到5
        // 添加尾迹效果
        ctx.fillStyle = b.color + '66'  // 半透明尾迹
        ctx.beginPath(); ctx.arc(b.x, b.y + 7, 4, 0, Math.PI * 2); ctx.fill()  // 从2.5增加到4，位置下移
        ctx.beginPath(); ctx.arc(b.x, b.y + 12, 3, 0, Math.PI * 2); ctx.fill()  // 新增第二个尾迹点
      }
      ctx.shadowBlur = 0

      // 敌人
      for (const e of this.enemies) this.drawEnemy(ctx, e)

      // 玩家子弹
      for (const b of this.bullets) {
        // 击穿弹：更大的子弹 + 橙色尾迹
        if (b.pierce > 0) {
          ctx.fillStyle = '#FF9800'; ctx.shadowColor = '#FF9800'; ctx.shadowBlur = 15
          ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI * 2); ctx.fill()  // 从4增加到6
          ctx.shadowBlur = 0
          const trailGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + 20)
          trailGrad.addColorStop(0, 'rgba(255,152,0,0.8)'); trailGrad.addColorStop(1, 'transparent')
          ctx.fillStyle = trailGrad; ctx.fillRect(b.x - 3, b.y, 6, 20)  // 尾迹加宽加长
        } else {
          ctx.fillStyle = '#00E5FF'; ctx.shadowColor = '#00E5FF'; ctx.shadowBlur = 12
          ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill()  // 从3增加到5
          ctx.shadowBlur = 0
          const trailGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + 16)
          trailGrad.addColorStop(0, 'rgba(0,229,255,0.7)'); trailGrad.addColorStop(1, 'transparent')
          ctx.fillStyle = trailGrad; ctx.fillRect(b.x - 2.5, b.y, 5, 16)  // 尾迹加宽加长
        }
      }
      ctx.shadowBlur = 0

      // 玩家
      if (!this.gameEnded || this.invincible > 0) this.drawPlayer(ctx)

      // 粒子
      this.drawParticles(ctx)

      // 冲击波
      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i]
        sw.radius += (sw.maxRadius - sw.radius) * 0.12
        sw.life -= 0.035
        if (sw.life <= 0) { this.shockwaves.splice(i, 1); continue }
        ctx.save()
        ctx.globalAlpha = sw.life * 0.6
        ctx.strokeStyle = sw.color; ctx.lineWidth = 2 + sw.life * 3
        ctx.shadowColor = sw.color; ctx.shadowBlur = 10
        ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2); ctx.stroke()
        ctx.restore()
      }

      // 掉落道具
      const puIcons: Record<string, string> = {
        triple: '⚡', spread: '🔴', heal: '💚', bomb: '💣',
        shield: '🛡️', rapid: '🔥', laser: '✨', pierce: '💥', magnet: '🧲'
      }
      for (const p of this.powerups) {
        ctx.save(); ctx.translate(p.x, p.y)
        const bob = Math.sin(Date.now() / 200 + p.x) * 3
        ctx.translate(0, bob)
        
        // 脉冲动画（让道具更醒目）
        const pulse = 1 + Math.sin(Date.now() / 150) * 0.15
        ctx.scale(pulse, pulse)
        
        // 外层光晕（更大更强）
        ctx.fillStyle = 'rgba(255,215,0,0.4)'; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 25
        ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill()
        
        // 中层圆环（白色边框）
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.shadowBlur = 10
        ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.stroke()
        
        // 内层背景（深色，突出图标）
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill()
        
        ctx.shadowBlur = 0
        
        // 图标（更大更清晰）
        ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(puIcons[p.type] || '?', 0, 1)  // 微调位置居中
        
        ctx.restore()
      }

      // 浮动文字（连击/分数飞出）
      for (let i = this.floatTexts.length - 1; i >= 0; i--) {
        const ft = this.floatTexts[i]
        ft.y += ft.vy; ft.life -= 0.03
        if (ft.life <= 0) { this.floatTexts.splice(i, 1); continue }
        ctx.save()
        ctx.globalAlpha = Math.min(1, ft.life * 2)
        ctx.translate(ft.x, ft.y)
        ctx.scale(ft.scale, ft.scale)
        ctx.fillStyle = ft.color; ctx.shadowColor = ft.color; ctx.shadowBlur = 8
        ctx.font = `bold ${ft.size}px sans-serif`; ctx.textAlign = 'center'
        ctx.fillText(ft.text, 0, 0)
        ctx.restore()
      }
      ctx.globalAlpha = 1

      // 闪屏
      if (this.screenFlash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${Math.min(0.6, this.screenFlash * 0.3)})`
        ctx.fillRect(-20, -20, BASE_W + 40, BASE_H + 40)
      }

      // HUD
      this.drawHUD(ctx)

      // 开始提示
      if (!this.gameStarted) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, BASE_H / 2 - 65, BASE_W, 130)
        ctx.fillStyle = '#fff'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('🔫 太空射击', BASE_W / 2, BASE_H / 2 - 20)
        ctx.font = '14px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.fillText('移动飞船躲避敌弹，消灭外星入侵者!', BASE_W / 2, BASE_H / 2 + 8)
        ctx.fillStyle = '#00E5FF'; ctx.font = 'bold 15px sans-serif'
        ctx.fillText('🤖 自动射击！只需移动飞船！', BASE_W / 2, BASE_H / 2 + 30)
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '12px sans-serif'
        ctx.fillText('点击屏幕开始 · 连击越多越爽！', BASE_W / 2, BASE_H / 2 + 50)
      }

      ctx.restore()
    }

    // === 绘制背景 ===
    private drawBackground(ctx: CanvasRenderingContext2D) {
      const grad = ctx.createLinearGradient(0, 0, 0, BASE_H)
      grad.addColorStop(0, '#0a0a1e'); grad.addColorStop(0.5, '#0d1b2a'); grad.addColorStop(1, '#1b2838')
      ctx.fillStyle = grad; ctx.fillRect(0, 0, BASE_W, BASE_H)

      for (const s of this.stars) {
        s.y += s.speed * this.difficulty * 0.5
        if (s.y > BASE_H) { s.y = -2; s.x = Math.random() * BASE_W }
        ctx.fillStyle = `rgba(255,255,255,${s.bright})`
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill()
      }
    }

    // === 绘制玩家 ===
    private drawPlayer(ctx: CanvasRenderingContext2D) {
      const level = this.getPlayerLevel()
      ctx.save(); ctx.translate(this.playerX, this.playerY)
      
      // 无敌状态特效（不闪烁，而是显示护盾）
      if (this.invincible > 0) {
        // 外层护盾光环（旋转）
        const shieldPulse = 1 + Math.sin(Date.now() / 100) * 0.1
        const shieldRotation = Date.now() / 500
        
        ctx.save()
        ctx.rotate(shieldRotation)
        
        // 第一层：蓝色光晕
        ctx.strokeStyle = 'rgba(79, 195, 247, 0.6)'
        ctx.lineWidth = 3
        ctx.shadowColor = '#4FC3F7'
        ctx.shadowBlur = 20
        ctx.beginPath()
        ctx.arc(0, 0, 35 * shieldPulse, 0, Math.PI * 2)
        ctx.stroke()
        
        // 第二层：白色内环
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.lineWidth = 2
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(0, 0, 28 * shieldPulse, 0, Math.PI * 2)
        ctx.stroke()
        
        // 第三层：能量粒子环绕
        for (let i = 0; i < 8; i++) {
          const angle = (Date.now() / 300) + (i * Math.PI / 4)
          const px = Math.cos(angle) * 32 * shieldPulse
          const py = Math.sin(angle) * 32 * shieldPulse
          ctx.fillStyle = '#4FC3F7'
          ctx.shadowColor = '#4FC3F7'
          ctx.shadowBlur = 8
          ctx.beginPath()
          ctx.arc(px, py, 3, 0, Math.PI * 2)
          ctx.fill()
        }
        
        ctx.restore()
      }

      // 引擎火焰
      const flicker = Math.random() * 4
      const flameHeight = 14 + flicker + level * 2
      const flameGrad = ctx.createLinearGradient(0, this.PLAYER_H / 2, 0, this.PLAYER_H / 2 + flameHeight)
      if (level >= 8) { flameGrad.addColorStop(0, '#FFD700'); flameGrad.addColorStop(0.3, '#FF6B6B'); flameGrad.addColorStop(0.6, '#E040FB'); flameGrad.addColorStop(1, 'transparent') }
      else if (level >= 5) { flameGrad.addColorStop(0, '#00E676'); flameGrad.addColorStop(0.5, '#FF6B6B'); flameGrad.addColorStop(1, 'transparent') }
      else { flameGrad.addColorStop(0, '#00E5FF'); flameGrad.addColorStop(0.5, '#FF6B6B'); flameGrad.addColorStop(1, 'transparent') }
      ctx.fillStyle = flameGrad
      ctx.beginPath(); ctx.moveTo(-8 - level, this.PLAYER_H / 2); ctx.lineTo(0, this.PLAYER_H / 2 + flameHeight); ctx.lineTo(8 + level, this.PLAYER_H / 2); ctx.fill()

      // 机身
      if (level >= 8) { ctx.fillStyle = '#FFD700'; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 15 }
      else if (level >= 5) { ctx.fillStyle = '#9C27B0'; ctx.shadowColor = '#9C27B0'; ctx.shadowBlur = 10 }
      else { ctx.fillStyle = '#45B7D1'; ctx.shadowColor = '#45B7D1'; ctx.shadowBlur = 5 }
      ctx.beginPath()
      ctx.moveTo(0, -this.PLAYER_H / 2); ctx.lineTo(-this.PLAYER_W / 2, this.PLAYER_H / 2)
      ctx.lineTo(-this.PLAYER_W / 4, this.PLAYER_H / 3); ctx.lineTo(this.PLAYER_W / 4, this.PLAYER_H / 3)
      ctx.lineTo(this.PLAYER_W / 2, this.PLAYER_H / 2); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0

      // 机翼
      const wingSize = 6 + level
      ctx.fillStyle = level >= 8 ? '#FFA000' : level >= 5 ? '#7B1FA2' : '#2E86AB'
      ctx.beginPath(); ctx.moveTo(-this.PLAYER_W / 2 - wingSize, this.PLAYER_H / 2 + 2); ctx.lineTo(-this.PLAYER_W / 4, this.PLAYER_H / 6); ctx.lineTo(-this.PLAYER_W / 2, this.PLAYER_H / 2); ctx.fill()
      ctx.beginPath(); ctx.moveTo(this.PLAYER_W / 2 + wingSize, this.PLAYER_H / 2 + 2); ctx.lineTo(this.PLAYER_W / 4, this.PLAYER_H / 6); ctx.lineTo(this.PLAYER_W / 2, this.PLAYER_H / 2); ctx.fill()

      // 驾驶舱
      ctx.fillStyle = level >= 8 ? '#FFD700' : level >= 5 ? '#E040FB' : '#00E5FF'
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = level >= 8 ? 15 : level >= 5 ? 10 : 6
      ctx.beginPath(); ctx.ellipse(0, -2, 5 + Math.floor(level / 3), 8 + Math.floor(level / 3), 0, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0

      // 等级标识
      ctx.fillStyle = level >= 8 ? '#FFD700' : level >= 5 ? '#E040FB' : '#FFFFFF'
      ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(`Lv${level}`, 0, -this.PLAYER_H / 2 - 10)

      ctx.restore()
    }

    // === 绘制敌人 ===
    private drawEnemy(ctx: CanvasRenderingContext2D, e: typeof this.enemies[0]) {
      ctx.save(); ctx.translate(e.x, e.y)
      ctx.fillStyle = e.color; ctx.shadowColor = e.color; ctx.shadowBlur = 8

      if (e.shape === 'circle') {
        ctx.beginPath(); ctx.arc(0, 0, e.w / 2, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-4, -2, 3, 0, Math.PI * 2); ctx.arc(4, -2, 3, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(-4, -1, 1.5, 0, Math.PI * 2); ctx.arc(4, -1, 1.5, 0, Math.PI * 2); ctx.fill()
      } else if (e.shape === 'diamond') {
        ctx.beginPath(); ctx.moveTo(0, -e.h / 2); ctx.lineTo(e.w / 2, 0); ctx.lineTo(0, e.h / 2); ctx.lineTo(-e.w / 2, 0); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0
        ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1
      } else if (e.shape === 'hex') {
        ctx.shadowBlur = 10; ctx.beginPath()
        for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i - Math.PI / 6; const px = Math.cos(a) * e.w / 2; const py = Math.sin(a) * e.h / 2; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py) }
        ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-5, -2, 3.5, 0, Math.PI * 2); ctx.arc(5, -2, 3.5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(-5, -1, 2, 0, Math.PI * 2); ctx.arc(5, -1, 2, 0, Math.PI * 2); ctx.fill()
      } else if (e.shape === 'boss') {
        ctx.beginPath(); ctx.arc(0, 0, e.w / 2, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0
        ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.8
        ctx.fillRect(-3, -e.h / 2, 6, e.h); ctx.fillRect(-e.w / 2, -3, e.w, 6); ctx.globalAlpha = 1
      } else if (e.shape === 'final_boss') {
        // 最终BOSS - 巨大的红色飞船
        ctx.shadowBlur = 20
        
        // 主体
        ctx.beginPath()
        ctx.moveTo(0, -e.h / 2)  // 顶部
        ctx.lineTo(-e.w / 2, 0)  // 左中
        ctx.lineTo(-e.w / 3, e.h / 2)  // 左下
        ctx.lineTo(e.w / 3, e.h / 2)   // 右下
        ctx.lineTo(e.w / 2, 0)   // 右中
        ctx.closePath()
        ctx.fill()
        
        ctx.shadowBlur = 0
        
        // 中心核心（发光）
        ctx.fillStyle = '#FFD700'
        ctx.shadowColor = '#FFD700'
        ctx.shadowBlur = 15
        ctx.beginPath()
        ctx.arc(0, 0, 12, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        
        // 装饰线条
        ctx.strokeStyle = '#FFD700'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(-15, -10)
        ctx.lineTo(15, -10)
        ctx.moveTo(-15, 10)
        ctx.lineTo(15, 10)
        ctx.stroke()
      }

      // 血条
      if (e.maxHp > 1) {
        const barW = e.w + 4, barH = 3, barY = -e.h / 2 - 6
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-barW / 2, barY, barW, barH)
        const hpRatio = e.hp / e.maxHp
        ctx.fillStyle = hpRatio > 0.6 ? '#00E676' : hpRatio > 0.3 ? '#FFA502' : '#FF4757'
        ctx.fillRect(-barW / 2, barY, barW * hpRatio, barH)
      }
      ctx.restore()
    }

    // === 绘制粒子 ===
    private drawParticles(ctx: CanvasRenderingContext2D) {
      // 按颜色分组，减少状态切换
      const colorGroups: Record<string, typeof this.particles> = {}
      
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i]
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life -= 0.025
        if (p.life <= 0) { this.particles.splice(i, 1); continue }
        
        // 分组
        if (!colorGroups[p.color]) colorGroups[p.color] = []
        colorGroups[p.color].push(p)
      }
      
      // 批量绘制相同颜色的粒子
      for (const color in colorGroups) {
        ctx.fillStyle = color
        for (const p of colorGroups[color]) {
          ctx.globalAlpha = p.life
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
    }

    // === 绘制 HUD ===
    private drawHUD(ctx: CanvasRenderingContext2D) {
      ctx.save()

      // 分数（右上安全区）
      ctx.fillStyle = '#FFD700'; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 4
      ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'right'
      ctx.fillText(`★ ${engine.getScore()}`, BASE_W - this.SAFE_R, this.SAFE_T + 10)
      ctx.shadowBlur = 0

      // 生命值（右上安全区，分数下方）
      const hpRatio = this.playerHP / this.maxHP
      ctx.fillStyle = hpRatio > 0.6 ? '#00E676' : hpRatio > 0.3 ? '#FFA502' : '#FF4757'
      ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'right'
      ctx.fillText(`❤️ ${this.playerHP}/${this.maxHP}`, BASE_W - this.SAFE_R, this.SAFE_T + 32)

      // 等级（左上安全区）
      const level = this.getPlayerLevel()
      const levelColors = ['#4FC3F7', '#81D4FA', '#4DD0E1', '#26C6DA', '#00BCD4', '#00ACC1', '#0097A7', '#00838F', '#006064', '#FFD700']
      ctx.fillStyle = levelColors[level - 1] || '#FFD700'
      ctx.font = `bold ${16 + Math.floor(level / 2)}px sans-serif`; ctx.textAlign = 'left'
      ctx.fillText(`✈️ Lv${level}`, this.SAFE_L, this.SAFE_T + 10)

      // 连击（居中）
      if (this.combo >= 3) {
        const pulse = 1 + Math.sin(Date.now() / 100) * 0.08
        const comboColor = this.combo >= 20 ? '#FF4757' : this.combo >= 10 ? '#FFD700' : '#4FC3F7'
        ctx.save()
        ctx.translate(BASE_W / 2, this.SAFE_T + 35)
        ctx.scale(pulse, pulse)
        ctx.fillStyle = comboColor; ctx.shadowColor = comboColor; ctx.shadowBlur = 12
        ctx.font = `bold ${20 + Math.min(this.combo, 15)}px sans-serif`; ctx.textAlign = 'center'
        ctx.fillText(`${this.combo} COMBO!`, 0, 0)
        ctx.restore()
      }

      // 击杀数
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right'
      ctx.fillText(`💀 ${this.totalKills}`, BASE_W - this.SAFE_R, this.SAFE_T + 50)

      // 道具状态（右上安全区，击杀数下方）
      let buffY = this.SAFE_T + 68; ctx.textAlign = 'right'
      if (this.invincible > 0) { ctx.fillStyle = '#4FC3F7'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(`🛡️无敌 ${Math.ceil(this.invincible)}s`, BASE_W - this.SAFE_R, buffY); buffY += 16 }
      if (this.tripleShot > 0) { ctx.fillStyle = '#FFD700'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(`⚡三连 ${Math.ceil(this.tripleShot / 1000)}s`, BASE_W - this.SAFE_R, buffY); buffY += 16 }
      if (this.spreadShot > 0) { ctx.fillStyle = '#FF6B6B'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(`🔴散射 ${Math.ceil(this.spreadShot / 1000)}s`, BASE_W - this.SAFE_R, buffY); buffY += 16 }
      if (this.rapidShot > 0) { ctx.fillStyle = '#FF5722'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(`🔥速射 ${Math.ceil(this.rapidShot / 1000)}s`, BASE_W - this.SAFE_R, buffY); buffY += 16 }
      if (this.pierceShot > 0) { ctx.fillStyle = '#FF9800'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(`💥击穿 ${Math.ceil(this.pierceShot / 1000)}s`, BASE_W - this.SAFE_R, buffY); buffY += 16 }
      if (this.laserShot > 0) { ctx.fillStyle = '#E040FB'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(`✨激光 ${Math.ceil(this.laserShot / 1000)}s`, BASE_W - this.SAFE_R, buffY); buffY += 16 }
      if (this.magnetTimer > 0) { ctx.fillStyle = '#FF4081'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(`🧲磁铁 ${Math.ceil(this.magnetTimer)}s`, BASE_W - this.SAFE_R, buffY); buffY += 16 }

      ctx.textBaseline = 'alphabetic'
      ctx.restore()
    }

  }

  // === 创建 Phaser 游戏实例 ===
  if (!isMobile) {
    // PC 端：限制父容器最大尺寸，保持合理比例
    phaserParent.style.maxWidth = '420px'
    phaserParent.style.maxHeight = '760px'
    phaserParent.style.width = '100%'
    phaserParent.style.height = '100%'
    phaserParent.style.aspectRatio = BASE_W + '/' + BASE_H
  }

  const phaserGame = new Phaser.Game({
    type: Phaser.CANVAS,
    width: BASE_W,
    height: BASE_H,
    parent: phaserParent,
    backgroundColor: '#0a0a2e',
    scale: {
      mode: Phaser.Scale.FIT,              // FIT 模式：等比缩放，完整显示
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: BASE_W,
      height: BASE_H,
      min: { width: BASE_W, height: BASE_H },
      max: { width: BASE_W * 4, height: BASE_H * 4 },
    },
    scene: [SpaceShooterScene],
    input: {
      touch: { capture: true },
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: true,
    },
    audio: { noAudio: true },
    banner: false,
  })

  // 监听窗口大小变化，确保正确适配
  const handleResize = () => {
    if (phaserGame.scale) {
      phaserGame.scale.refresh()
    }
  }
  window.addEventListener('resize', handleResize)
  
  // 移动端：防止滚动和缩放
  if (isMobile) {
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.height = '100%'
  }

  // 游戏结束时清理
  const originalOnEnd = onEnd
  onEnd = () => {
    window.removeEventListener('resize', handleResize)
    if (isMobile) {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.height = ''
    }
    phaserGame.destroy(true)
    const phaserDiv = document.getElementById('phaser-space-shooter')
    if (phaserDiv) phaserDiv.remove()
    originalOnEnd()
  }

  engine.start()
}
