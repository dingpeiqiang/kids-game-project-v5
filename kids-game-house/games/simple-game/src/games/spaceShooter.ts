import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { app } from '../App'

/**
 * 太空射击游戏 - Phaser ScaleManager ENVELOP 模式
 * 
 * 适配策略：Phaser ENVELOP（等比裁切，全屏无黑边，不变形）
 * - 设计分辨率：400 x 600
 * - Canvas 等比缩放填满屏幕，超出部分在两侧/上下均匀裁切
 * - 关键 UI 放在安全区内，避免被裁切
 * - 渲染：通过 Phaser CanvasTexture 在 Canvas 2D 上绘制，保持原有绘制代码
 */
export function initSpaceShooter(engine: GameEngine, onEnd: () => void) {
  // === 设计分辨率 ===
  const BASE_W = 400, BASE_H = 600

  // === 创建 Phaser 游戏容器 ===
  const gameContainer = document.getElementById('gameCanvas')!
  gameContainer.innerHTML = ''

  // === 判断终端类型 ===
  const isMobile = /Android|iPhone|iPad|iPod|MicroMessenger/i.test(navigator.userAgent) 
    || (window.visualViewport ? window.visualViewport.width < 768 : window.innerWidth < 768)

  // === 创建 Phaser 父容器 ===
  // FIT 模式：等比缩放，画面完整不裁切，空白区域用深色背景填充
  const phaserParent = document.createElement('div')
  phaserParent.id = 'phaser-space-shooter'
  if (isMobile) {
    // 手机：全屏覆盖，深色背景（FIT 模式下空白区域显示此背景色）
    phaserParent.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:1000;background:#0a0a1e;'
  } else {
    // PC：居中显示，限制最大尺寸，深色背景
    phaserParent.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:1000;display:flex;align-items:center;justify-content:center;background:#0a0a1e;'
  }
  document.body.appendChild(phaserParent)

  // === Phaser Scene：太空射击 ===
  class SpaceShooterScene extends Phaser.Scene {
    // Canvas 2D 绘制用的 texture
    private gameTexture!: Phaser.Textures.CanvasTexture
    private ctx!: CanvasRenderingContext2D

    // 游戏状态
    private playerX = BASE_W / 2
    private playerY = BASE_H - 55
    private bullets: { x: number; y: number; vx: number; vy: number }[] = []
    private enemies: { x: number; y: number; w: number; h: number; hp: number; maxHp: number; score: number; color: string; shape: string; speed: number; shootTimer: number }[] = []
    private enemyBullets: { x: number; y: number; vx: number; vy: number; color: string }[] = []
    private particles: { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[] = []
    private floatTexts: { text: string; x: number; y: number; life: number; color: string; size: number }[] = []
    private stars: { x: number; y: number; speed: number; size: number; bright: number }[] = []

    private gameStarted = false
    private gameEnded = false
    private gameWon = false
    private lastShot = 0
    private elapsed = 0
    private startTime = 0
    private difficulty = 1
    private combo = 0
    private comboTimer = 0
    private shakeAmt = 0
    private playerHP = 3
    private maxHP = 3
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
    private screenFlash = 0
    private spawnTimer = 0
    private waveCount = 0

    private mouseDown = false

    // 通关
    private victoryButtonRect: { x: number; y: number; w: number; h: number } | null = null

    // 安全区（ENVELOP 模式下可能裁切，关键 UI 放在此范围内）
    private readonly SAFE_L = 20
    private readonly SAFE_R = 25
    private readonly SAFE_T = 15
    private readonly SAFE_B = 15

    // 配置
    private readonly PLAYER_W = 36
    private readonly PLAYER_H = 32
    private readonly BULLET_SPEED = 10
    private readonly SHOOT_CD = 180
    private readonly STAR_COUNT = 60
    private readonly TOUCH_OFFSET_Y = 80

    private readonly ENEMY_TYPES = [
      { w: 24, h: 20, hp: 1, score: 10, color: '#FF6B6B', shape: 'circle', speed: 1.0 },
      { w: 30, h: 26, hp: 1, score: 25, color: '#FFA502', shape: 'diamond', speed: 0.8 },
      { w: 36, h: 30, hp: 2, score: 60, color: '#FF4757', shape: 'hex', speed: 0.6 },
      { w: 42, h: 36, hp: 3, score: 150, color: '#9C27B0', shape: 'boss', speed: 0.4 },
    ]

    private readonly SHOP_ITEMS = [
      { type: 'heal', name: '回复', icon: '💚', cost: 80, cooldown: 10 },
      { type: 'triple', name: '三连发', icon: '⚡', cost: 100, cooldown: 15 },
      { type: 'spread', name: '扩散弹', icon: '🔴', cost: 150, cooldown: 20 },
      { type: 'rapid', name: '速射', icon: '🔥', cost: 200, cooldown: 18 },
      { type: 'laser', name: '激光', icon: '✨', cost: 250, cooldown: 25 },
      { type: 'shield', name: '无敌', icon: '🛡️', cost: 300, cooldown: 30 },
      { type: 'bomb', name: '清屏', icon: '💣', cost: 500, cooldown: 40 },
    ]

    private itemCooldowns: Record<string, number> = {}

    // 渲染用的 Image 对象
    private gameImage!: Phaser.GameObjects.Image

    constructor() {
      super({ key: 'SpaceShooterScene' })
    }

    preload() {
      // 创建 CanvasTexture 作为渲染目标
      this.gameTexture = this.textures.createCanvas('gameCanvas', BASE_W, BASE_H)
      this.ctx = this.gameTexture.getContext() as CanvasRenderingContext2D
      this.ctx.imageSmoothingEnabled = true
      this.ctx.imageSmoothingQuality = 'high'
    }

    create() {
      // 初始化道具冷却
      this.SHOP_ITEMS.forEach(item => {
        this.itemCooldowns[item.type] = 0
      })

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

      const dt = delta

      if (this.gameStarted) {
        this.elapsed = (Date.now() - this.startTime) / 1000
        this.difficulty = 1 + this.elapsed / 15

        // 通关检测
        const currentLevel = this.getPowerupLevel()
        if (currentLevel >= 10 && !this.gameWon) {
          this.gameWon = true
          this.gameEnded = true
          for (let i = 0; i < 50; i++) {
            this.time.delayedCall(i * 50, () => {
              this.explode(
                Math.random() * BASE_W, Math.random() * BASE_H,
                ['#FFD700', '#FF6B6B', '#4FC3F7', '#00E676', '#E040FB'][Math.floor(Math.random() * 5)],
                30, 8
              )
            })
          }
        }
      }

      // 生成敌人
      if (this.gameStarted) {
        const spawnInterval = Math.max(400, 1800 - this.difficulty * 140)
        this.spawnTimer -= dt
        if (this.spawnTimer <= 0) {
          this.spawnEnemy()
          this.spawnTimer = spawnInterval
          this.waveCount++
          if (this.waveCount % 6 === 0) {
            this.time.delayedCall(200, () => { if (!this.gameEnded) this.spawnEnemy() })
            this.time.delayedCall(400, () => { if (!this.gameEnded) this.spawnEnemy() })
            this.time.delayedCall(600, () => { if (!this.gameEnded) this.spawnEnemy() })
          }
        }
      }

      // 自动射击
      if (this.mouseDown && this.gameStarted) {
        this.shoot()
      }

      // 更新游戏逻辑
      this.updateBullets()
      this.updateEnemies(dt)
      this.updateEnemyBullets()
      this.updateTimers(dt)

      // 绘制到 CanvasTexture
      this.renderToCanvas()

      // 刷新纹理
      this.gameTexture.refresh()
    }

    // === 输入处理 ===
    private setupInput() {
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (this.gameWon) {
          this.handleVictoryClick(pointer)
          return
        }
        if (this.gameEnded) return

        const pos = this.screenToLogical(pointer)

        // 检查道具栏点击
        if (this.checkShopClick(pos.x, pos.y)) return

        this.playerX = pos.x
        this.playerY = pos.y - this.TOUCH_OFFSET_Y
        this.clampPlayer()
        this.mouseDown = true
        if (!this.gameStarted) {
          this.gameStarted = true
          this.startTime = Date.now()
        }
        this.shoot()
      })

      this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (this.gameEnded || !pointer.isDown) return
        const pos = this.screenToLogical(pointer)
        this.playerX = pos.x
        this.playerY = pos.y - this.TOUCH_OFFSET_Y
        this.clampPlayer()
        if (this.mouseDown && this.gameStarted) {
          this.shoot()
        }
      })

      this.input.on('pointerup', () => {
        this.mouseDown = false
      })
    }

    /** 屏幕坐标 → 逻辑坐标（ENVELOP 模式下需要考虑裁切偏移） */
    private screenToLogical(pointer: Phaser.Input.Pointer): { x: number; y: number } {
      const cam = this.cameras.main
      // Phaser 的 pointer 坐标已经是世界坐标
      return { x: pointer.x - cam.scrollX, y: pointer.y - cam.scrollY }
    }

    private clampPlayer() {
      this.playerX = Phaser.Math.Clamp(this.playerX, this.PLAYER_W / 2, BASE_W - this.PLAYER_W / 2)
      this.playerY = Phaser.Math.Clamp(this.playerY, BASE_H * 0.3, BASE_H - 25)
    }

    // === 道具等级系统 ===
    private getPowerupLevel(): number {
      return Math.min(10, Math.floor(this.elapsed / 15) + 1)
    }
    private getPlayerLevel(): number { return this.getPowerupLevel() }
    private getPlayerDamage(): number { return this.getPlayerLevel() >= 6 ? 2 : 1 }
    private getPowerupDropRate(): number {
      return Math.min(0.30, 0.12 + this.getPowerupLevel() * 0.025)
    }

    private getRandomPowerupType(): string {
      const level = this.getPowerupLevel()
      const r = Math.random()
      if (level >= 8) {
        if (r < 0.04) return 'laser'; if (r < 0.07) return 'shield'
        if (r < 0.12) return 'rapid'; if (r < 0.16) return 'magnet'
        if (r < 0.22) return 'bomb'; if (r < 0.42) return 'triple'
        if (r < 0.62) return 'spread'; return 'heal'
      } else if (level >= 6) {
        if (r < 0.03) return 'laser'; if (r < 0.06) return 'shield'
        if (r < 0.11) return 'rapid'; if (r < 0.15) return 'magnet'
        if (r < 0.22) return 'bomb'; if (r < 0.44) return 'triple'
        if (r < 0.66) return 'spread'; return 'heal'
      } else if (level >= 4) {
        if (r < 0.02) return 'laser'; if (r < 0.04) return 'shield'
        if (r < 0.08) return 'rapid'; if (r < 0.12) return 'magnet'
        if (r < 0.20) return 'bomb'; if (r < 0.45) return 'triple'
        if (r < 0.70) return 'spread'; return 'heal'
      } else if (level >= 2) {
        if (r < 0.01) return 'laser'; if (r < 0.02) return 'shield'
        if (r < 0.05) return 'rapid'; if (r < 0.12) return 'bomb'
        if (r < 0.40) return 'triple'; if (r < 0.68) return 'spread'; return 'heal'
      } else {
        if (r < 0.25) return 'triple'; if (r < 0.50) return 'spread'
        if (r < 0.80) return 'heal'; return 'bomb'
      }
    }

    // === 道具使用 ===
    private usePowerupImmediately(type: string): void {
      const level = this.getPowerupLevel()
      switch (type) {
        case 'triple': {
          const dur = 8000 + (level - 1) * 3000
          const count = 3 + Math.floor((level - 1) / 2)
          if (this.tripleShot > 0) { this.tripleStacks++; this.tripleShot += dur * 0.5 }
          else { this.tripleStacks = 0; this.tripleShot = dur }
          for (let i = 0; i < count; i++) {
            const ox = (i - Math.floor(count / 2)) * 8
            this.bullets.push({ x: this.playerX + ox, y: this.playerY - this.PLAYER_H / 2, vx: 0, vy: -this.BULLET_SPEED * 1.2 })
          }
          audioService.win(); break
        }
        case 'spread': {
          const cnt = 5 + (level - 1) * 3
          const ang = 0.2 + (level - 1) * 0.08
          const dur = 6000 + (level - 1) * 2500
          if (this.spreadShot > 0) { this.spreadStacks++; this.spreadShot += dur * 0.5 }
          else { this.spreadStacks = 0; this.spreadShot = dur }
          for (let i = Math.floor(-cnt / 2); i <= Math.floor(cnt / 2); i++) {
            const a = -Math.PI / 2 + i * ang
            this.bullets.push({
              x: this.playerX, y: this.playerY - this.PLAYER_H / 2,
              vx: Math.cos(a) * this.BULLET_SPEED * (1.2 + level * 0.1),
              vy: Math.sin(a) * this.BULLET_SPEED * (1.2 + level * 0.1),
            })
          }
          audioService.win(); break
        }
        case 'heal': {
          const amt = 1 + Math.floor(level / 3)
          const old = this.playerHP
          this.playerHP = Math.min(this.maxHP + 2, this.playerHP + amt)
          if (this.playerHP > old) this.explode(this.playerX, this.playerY, '#00E676', 10 + level * 2, 2)
          audioService.win(); break
        }
        case 'bomb': {
          this.enemies.forEach(en => {
            this.explode(en.x, en.y, en.color, 50 + level * 30, 4 + level * 2)
            engine.addScore(en.score * level, en.x, en.y)
          })
          this.enemies.length = 0; this.enemyBullets.length = 0
          this.screenFlash = Math.min(1.0, 0.3 + level * 0.05); this.shakeAmt = 8 + level * 3
          this.explode(BASE_W / 2, BASE_H / 2, '#FFFFFF', 100 + level * 20, 8 + level)
          audioService.win(); break
        }
        case 'shield': {
          const dur = 2000 + (level - 1) * 1000
          if (this.invincible > 0) this.invincible = Math.min(15, this.invincible + 1.5)
          else this.invincible = dur / 1000
          audioService.win(); break
        }
        case 'rapid': {
          const dur = 5000 + (level - 1) * 3000
          if (this.rapidShot > 0) { this.rapidStacks++; this.rapidShot += dur * 0.5 }
          else { this.rapidStacks = 0; this.rapidShot = dur }
          this.lastShot = Date.now() - this.SHOOT_CD + 1000 / (1 + level * 0.5)
          this.explode(this.playerX, this.playerY, '#FF5722', 25 + level * 4, 5)
          audioService.win(); break
        }
        case 'laser': {
          const dur = 6000 + (level - 1) * 3000
          const cnt = 3 + level * 2
          const spd = this.BULLET_SPEED * (2 + level * 0.3)
          if (this.laserShot > 0) { this.laserStacks++; this.laserShot += dur * 0.5 }
          else { this.laserStacks = 0; this.laserShot = dur }
          for (let i = 0; i < cnt; i++) {
            this.time.delayedCall(i * 50, () => {
              if (!this.gameEnded) {
                this.bullets.push({ x: this.playerX, y: this.playerY - this.PLAYER_H / 2, vx: 0, vy: -spd })
                this.explode(this.playerX, this.playerY - this.PLAYER_H / 2, '#E040FB', 8, 3)
              }
            })
          }
          audioService.win(); break
        }
        case 'magnet': {
          this.explode(this.playerX, this.playerY, '#FF4081', 20 + level * 4, 4)
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
      if (this.difficulty >= 5 && r < 0.18) typeIdx = 3
      else if (this.difficulty >= 3 && r < 0.40) typeIdx = 2
      else if (this.difficulty >= 2 && r < 0.65) typeIdx = 1
      const type = this.ENEMY_TYPES[typeIdx]
      this.enemies.push({
        x: 30 + Math.random() * (BASE_W - 60), y: -type.h,
        w: type.w, h: type.h,
        hp: type.hp + Math.floor(this.difficulty * 0.8),
        maxHp: type.hp + Math.floor(this.difficulty * 0.8),
        score: type.score, color: type.color, shape: type.shape,
        speed: type.speed * (1 + this.difficulty * 0.15),
        shootTimer: 1500 + Math.random() * 2000,
      })
    }

    // === 购买道具 ===
    private buyItem(type: string) {
      const item = this.SHOP_ITEMS.find(i => i.type === type)
      if (!item) return
      if (this.itemCooldowns[type] > 0) {
        audioService.click()
        this.floatTexts.push({ text: `冷却中 ${Math.ceil(this.itemCooldowns[type])}s`, x: BASE_W / 2, y: BASE_H / 2, life: 1, color: '#FFA502', size: 18 })
        return
      }
      if (engine.getScore() < item.cost) {
        audioService.click()
        this.floatTexts.push({ text: `积分不足！`, x: BASE_W / 2, y: BASE_H / 2, life: 1, color: '#FF4757', size: 18 })
        return
      }
      engine.addScore(-item.cost, BASE_W / 2, BASE_H / 2)
      this.itemCooldowns[type] = item.cooldown
      this.usePowerupImmediately(type)
      audioService.win()
      this.floatTexts.push({ text: `${item.icon} ${item.name} -${item.cost}`, x: BASE_W / 2, y: BASE_H / 2, life: 1.2, color: '#00E676', size: 18 })
    }

    // === 检查道具栏点击 ===
    private checkShopClick(clickX: number, clickY: number): boolean {
      const buttonSize = 50, spacing = 10
      const startX = this.SAFE_L
      const totalHeight = this.SHOP_ITEMS.length * (buttonSize + spacing) - spacing
      const startY = (BASE_H - totalHeight) / 2
      for (let i = 0; i < this.SHOP_ITEMS.length; i++) {
        const buttonY = startY + i * (buttonSize + spacing)
        if (clickX >= startX && clickX <= startX + buttonSize &&
            clickY >= buttonY && clickY <= buttonY + buttonSize) {
          this.buyItem(this.SHOP_ITEMS[i].type)
          return true
        }
      }
      return false
    }

    // === 射击 ===
    private shoot() {
      const now = Date.now()
      let cd = this.SHOOT_CD
      if (this.rapidShot > 0) {
        cd = this.SHOOT_CD * (1 - Math.min(0.8, (this.rapidStacks + 1) * 0.2))
      }
      if (now - this.lastShot < cd) return
      this.lastShot = now

      if (this.tripleShot > 0) {
        const base = 3, extra = this.tripleStacks * 2, total = base + extra
        for (let i = 0; i < total; i++) {
          const ox = (i - Math.floor(total / 2)) * 8
          this.bullets.push({ x: this.playerX + ox, y: this.playerY - this.PLAYER_H / 2, vx: 0, vy: -this.BULLET_SPEED })
        }
      } else if (this.spreadShot > 0) {
        const base = 5, extra = this.spreadStacks * 3, total = base + extra
        const baseAngle = 0.2, extraAngle = this.spreadStacks * 0.05
        for (let i = Math.floor(-total / 2); i <= Math.floor(total / 2); i++) {
          const a = -Math.PI / 2 + i * (baseAngle + extraAngle)
          this.bullets.push({ x: this.playerX, y: this.playerY - this.PLAYER_H / 2, vx: Math.cos(a) * this.BULLET_SPEED, vy: Math.sin(a) * this.BULLET_SPEED })
        }
      } else {
        this.bullets.push({ x: this.playerX, y: this.playerY - this.PLAYER_H / 2, vx: 0, vy: -this.BULLET_SPEED })
      }
      audioService.click()
    }

    // === 爆炸粒子 ===
    private explode(x: number, y: number, color: string, count: number, force: number = 5) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2
        const s = Math.random() * force + 1
        this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, color, size: 1.5 + Math.random() * 3 })
      }
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
        b.x += b.vx; b.y += b.vy
        if (b.y < -10 || b.x < -10 || b.x > BASE_W + 10) { this.bullets.splice(i, 1); continue }

        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j]
          if (this.rectCollide(b.x - 3, b.y - 5, 6, 10, e.x - e.w / 2, e.y - e.h / 2, e.w, e.h)) {
            this.bullets.splice(i, 1)
            const dmg = this.getPlayerDamage()
            e.hp -= dmg
            this.explode(b.x, b.y, '#FFD700', 4 + dmg * 2, 2 + dmg)
            if (e.hp <= 0) {
              this.combo++; this.comboTimer = 3
              engine.addScore(e.score * Math.min(this.combo, 20), e.x, e.y)
              const expSize = 20 + e.maxHp * 8, pCnt = 6 + e.maxHp * 3
              this.explode(e.x, e.y, e.color, expSize, pCnt)
              this.explode(e.x, e.y, '#FFD700', expSize * 0.6, pCnt * 0.7)
              if (this.combo >= 10) this.shakeAmt = 8
              else if (this.combo >= 5) this.shakeAmt = 5
              else this.shakeAmt = 2
              if (this.combo >= 5) engine.triggerRandomBuff()
              audioService.win()
              this.enemies.splice(j, 1)
            } else { audioService.click() }
            break
          }
        }
      }
    }

    // === 更新敌人 ===
    private updateEnemies(dt: number) {
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i]
        e.y += e.speed

        if (this.gameStarted && e.y > 20 && e.y < BASE_H * 0.7) {
          e.shootTimer -= dt
          if (e.shootTimer <= 0) {
            if (e.shape === 'boss') {
              for (let angle = -0.3; angle <= 0.3; angle += 0.3) {
                this.enemyBullets.push({ x: e.x, y: e.y + e.h / 2, vy: 4 + this.difficulty * 0.6, vx: Math.sin(angle) * 2, color: e.color })
              }
            } else {
              this.enemyBullets.push({ x: e.x, y: e.y + e.h / 2, vy: 3.5 + this.difficulty * 0.5, vx: 0, color: e.color })
            }
            const baseInt = e.shape === 'boss' ? 1200 : (e.shape === 'hex' ? 1800 : 2500)
            e.shootTimer = Math.max(600, baseInt - this.difficulty * 100) + Math.random() * 800
          }
        }

        if (e.y > BASE_H + 40) { this.enemies.splice(i, 1); continue }

        if (this.invincible <= 0 && this.rectCollide(
          this.playerX - this.PLAYER_W / 2, this.playerY - this.PLAYER_H / 2, this.PLAYER_W, this.PLAYER_H,
          e.x - e.w / 2, e.y - e.h / 2, e.w, e.h
        )) {
          this.playerHP--; this.invincible = 2; this.shakeAmt = 6; this.screenFlash = 0.3; this.combo = 0
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
          this.playerHP--; this.invincible = 2; this.shakeAmt = 5; this.screenFlash = 0.25; this.combo = 0
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
      for (const t in this.itemCooldowns) {
        if (this.itemCooldowns[t] > 0) { this.itemCooldowns[t] -= dt / 1000; if (this.itemCooldowns[t] < 0) this.itemCooldowns[t] = 0 }
      }
      if (this.tripleShot > 0) { this.tripleShot -= dt; if (this.tripleShot <= 0) { this.tripleShot = 0; this.tripleStacks = 0 } }
      if (this.spreadShot > 0) { this.spreadShot -= dt; if (this.spreadShot <= 0) { this.spreadShot = 0; this.spreadStacks = 0 } }
      if (this.rapidShot > 0) { this.rapidShot -= dt; if (this.rapidShot <= 0) { this.rapidShot = 0; this.rapidStacks = 0 } }
      if (this.laserShot > 0) { this.laserShot -= dt; if (this.laserShot <= 0) { this.laserShot = 0; this.laserStacks = 0 } }
      if (this.comboTimer > 0) { this.comboTimer -= dt / 1000; if (this.comboTimer <= 0) this.combo = 0 }
      if (this.shakeAmt > 0) this.shakeAmt *= 0.9
      if (this.shakeAmt < 0.1) this.shakeAmt = 0
      if (this.screenFlash > 0) this.screenFlash -= dt / 1000 * 2
    }

    // === 通关点击 ===
    private handleVictoryClick(pointer: Phaser.Input.Pointer) {
      const pos = this.screenToLogical(pointer)
      if (this.victoryButtonRect) {
        const btn = this.victoryButtonRect
        if (pos.x >= btn.x && pos.x <= btn.x + btn.w && pos.y >= btn.y && pos.y <= btn.y + btn.h) {
          this.doEnd(); return
        }
      }
      this.restartGame()
    }

    private restartGame() {
      this.gameWon = false; this.gameEnded = false; this.gameStarted = false
      this.elapsed = 0; this.startTime = Date.now()
      this.playerHP = 3; this.maxHP = 3; this.playerLevel = 1
      this.bullets.length = 0; this.enemies.length = 0; this.enemyBullets.length = 0
      this.particles.length = 0; this.floatTexts.length = 0
      this.combo = 0; this.invincible = 0
      this.tripleShot = 0; this.spreadShot = 0; this.rapidShot = 0; this.laserShot = 0
      this.initStars()
      this.time.delayedCall(500, () => { this.gameStarted = true })
    }

    private doEnd() {
      const phaserDiv = document.getElementById('phaser-space-shooter')
      if (phaserDiv) phaserDiv.remove()
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

      if (this.gameWon) {
        this.drawParticles(ctx)
        this.drawVictoryScreen(ctx)
        ctx.restore()
        return
      }

      // 敌人子弹
      for (const b of this.enemyBullets) {
        ctx.fillStyle = b.color; ctx.shadowColor = b.color; ctx.shadowBlur = 6
        ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = b.color + '44'
        ctx.beginPath(); ctx.arc(b.x, b.y + 5, 2.5, 0, Math.PI * 2); ctx.fill()
      }
      ctx.shadowBlur = 0

      // 敌人
      for (const e of this.enemies) this.drawEnemy(ctx, e)

      // 玩家子弹
      for (const b of this.bullets) {
        ctx.fillStyle = '#00E5FF'; ctx.shadowColor = '#00E5FF'; ctx.shadowBlur = 8
        ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0
        const trailGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + 12)
        trailGrad.addColorStop(0, 'rgba(0,229,255,0.5)'); trailGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = trailGrad; ctx.fillRect(b.x - 1.5, b.y, 3, 12)
      }
      ctx.shadowBlur = 0

      // 玩家
      if (!this.gameEnded || this.invincible > 0) this.drawPlayer(ctx)

      // 粒子
      this.drawParticles(ctx)

      // 浮动文字
      for (let i = this.floatTexts.length - 1; i >= 0; i--) {
        const ft = this.floatTexts[i]
        ft.y -= 1.5; ft.life -= 0.025
        if (ft.life <= 0) { this.floatTexts.splice(i, 1); continue }
        ctx.globalAlpha = ft.life; ctx.fillStyle = ft.color
        ctx.font = `bold ${ft.size}px sans-serif`; ctx.textAlign = 'center'
        ctx.fillText(ft.text, ft.x, ft.y); ctx.globalAlpha = 1
      }

      // 闪屏
      if (this.screenFlash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${Math.min(0.6, this.screenFlash * 0.3)})`
        ctx.fillRect(-20, -20, BASE_W + 40, BASE_H + 40)
      }

      // HUD
      this.drawHUD(ctx)

      // 开始提示
      if (!this.gameStarted) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, BASE_H / 2 - 55, BASE_W, 110)
        ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('🔫 太空射击', BASE_W / 2, BASE_H / 2 - 10)
        ctx.font = '15px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.fillText('移动飞船躲避敌弹，消灭外星入侵者!', BASE_W / 2, BASE_H / 2 + 18)
        ctx.fillText('点击/长按屏幕连续射击', BASE_W / 2, BASE_H / 2 + 38)
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
      if (this.invincible > 0 && Math.floor(this.invincible * 10) % 2 === 0) return
      const level = this.getPlayerLevel()
      ctx.save(); ctx.translate(this.playerX, this.playerY)

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
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i]
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life -= 0.025
        if (p.life <= 0) { this.particles.splice(i, 1); continue }
        ctx.globalAlpha = p.life; ctx.fillStyle = p.color
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1
      }
    }

    // === 绘制 HUD ===
    private drawHUD(ctx: CanvasRenderingContext2D) {
      ctx.save()

      // 分数（右上安全区）
      ctx.fillStyle = '#FFD700'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'right'
      ctx.fillText(`★ ${engine.getScore()}`, BASE_W - this.SAFE_R, this.SAFE_T + 10)

      // 等级（左上安全区）
      const level = this.getPlayerLevel()
      const levelColors = ['#4FC3F7', '#81D4FA', '#4DD0E1', '#26C6DA', '#00BCD4', '#00ACC1', '#0097A7', '#00838F', '#006064', '#FFD700']
      ctx.fillStyle = levelColors[level - 1] || '#FFD700'
      ctx.font = `bold ${16 + Math.floor(level / 2)}px sans-serif`; ctx.textAlign = 'left'
      ctx.fillText(`✈️ Lv${level}`, this.SAFE_L, this.SAFE_T + 10)

      // 伤害
      ctx.fillStyle = '#FF6B6B'; ctx.font = '12px sans-serif'
      ctx.fillText(`💥 伤害:${level >= 7 ? this.getPlayerDamage() + 'x' : this.getPlayerDamage()}`, this.SAFE_L, this.SAFE_T + 28)

      // 生命值（左下安全区）
      const hpBarW = 100, hpBarH = 8
      const hpX = this.SAFE_L, hpY = BASE_H - this.SAFE_B
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(hpX, hpY - hpBarH, hpBarW, hpBarH)
      const hpRatio = this.playerHP / this.maxHP
      ctx.fillStyle = hpRatio > 0.6 ? '#00E676' : hpRatio > 0.3 ? '#FFA502' : '#FF4757'
      ctx.fillRect(hpX, hpY - hpBarH, hpBarW * hpRatio, hpBarH)
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left'
      ctx.fillText(`❤️ ${this.playerHP}/${this.maxHP}`, hpX, hpY - hpBarH - 3)

      // 道具状态（右下安全区）
      let buffY = BASE_H - this.SAFE_B; ctx.textAlign = 'right'
      if (this.invincible > 0) { ctx.fillStyle = '#4FC3F7'; ctx.font = 'bold 13px sans-serif'; ctx.fillText(`🛡️ 无敌 ${Math.ceil(this.invincible)}s`, BASE_W - this.SAFE_R, buffY); buffY -= 18 }
      if (this.tripleShot > 0) { ctx.fillStyle = '#FFD700'; ctx.font = 'bold 13px sans-serif'; const s = this.tripleStacks > 0 ? ` [Lv${this.tripleStacks + 1}]` : ''; ctx.fillText(`⚡三连发 ${Math.ceil(this.tripleShot / 1000)}s${s}`, BASE_W - this.SAFE_R, buffY); buffY -= 18 }
      if (this.spreadShot > 0) { ctx.fillStyle = '#FF6B6B'; ctx.font = 'bold 13px sans-serif'; const s = this.spreadStacks > 0 ? ` [Lv${this.spreadStacks + 1}]` : ''; ctx.fillText(`🔴扩散弹 ${Math.ceil(this.spreadShot / 1000)}s${s}`, BASE_W - this.SAFE_R, buffY); buffY -= 18 }
      if (this.rapidShot > 0) { ctx.fillStyle = '#FF5722'; ctx.font = 'bold 13px sans-serif'; const s = this.rapidStacks > 0 ? ` [Lv${this.rapidStacks + 1}]` : ''; ctx.fillText(`🔥速射 ${Math.ceil(this.rapidShot / 1000)}s${s}`, BASE_W - this.SAFE_R, buffY); buffY -= 18 }
      if (this.laserShot > 0) { ctx.fillStyle = '#E040FB'; ctx.font = 'bold 13px sans-serif'; const s = this.laserStacks > 0 ? ` [Lv${this.laserStacks + 1}]` : ''; ctx.fillText(`✨激光 ${Math.ceil(this.laserShot / 1000)}s${s}`, BASE_W - this.SAFE_R, buffY); buffY -= 18 }

      // 道具栏（左侧安全区）
      const buttonSize = 50, spacing = 10
      const totalHeight = this.SHOP_ITEMS.length * (buttonSize + spacing) - spacing
      const startX = this.SAFE_L, startY = (BASE_H - totalHeight) / 2
      this.SHOP_ITEMS.forEach((item, index) => {
        const buttonY = startY + index * (buttonSize + spacing)
        const canAfford = engine.getScore() >= item.cost
        const onCooldown = this.itemCooldowns[item.type] > 0
        if (onCooldown) { ctx.fillStyle = 'rgba(50,50,50,0.5)'; ctx.strokeStyle = 'rgba(100,100,100,0.6)' }
        else if (canAfford) { ctx.fillStyle = 'rgba(255,215,0,0.3)'; ctx.strokeStyle = '#FFD700' }
        else { ctx.fillStyle = 'rgba(100,100,100,0.3)'; ctx.strokeStyle = 'rgba(150,150,150,0.5)' }
        ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(startX, buttonY, buttonSize, buttonSize, 8); ctx.fill(); ctx.stroke()
        if (onCooldown) {
          const ratio = this.itemCooldowns[item.type] / item.cooldown
          ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(startX, buttonY + buttonSize - buttonSize * ratio, buttonSize, buttonSize * ratio)
        }
        ctx.font = '24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(item.icon, startX + buttonSize / 2, buttonY + buttonSize / 2 - 8)
        if (onCooldown) { ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(`${Math.ceil(this.itemCooldowns[item.type])}s`, startX + buttonSize / 2, buttonY + buttonSize - 10) }
        else { ctx.fillStyle = canAfford ? '#FFFFFF' : 'rgba(200,200,200,0.7)'; ctx.font = 'bold 11px sans-serif'; ctx.fillText(`${item.cost}`, startX + buttonSize / 2, buttonY + buttonSize - 10) }
      })
      ctx.textBaseline = 'alphabetic'
      ctx.restore()
    }

    // === 绘制通关画面 ===
    private drawVictoryScreen(ctx: CanvasRenderingContext2D) {
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, BASE_W, BASE_H)
      const grad = ctx.createRadialGradient(BASE_W / 2, BASE_H / 2, 0, BASE_W / 2, BASE_H / 2, BASE_W / 2)
      grad.addColorStop(0, 'rgba(255,215,0,0.3)'); grad.addColorStop(0.5, 'rgba(255,107,107,0.2)'); grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad; ctx.fillRect(0, 0, BASE_W, BASE_H)

      ctx.save(); ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 30
      ctx.fillStyle = '#FFD700'; ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('🎉 恭喜通关！', BASE_W / 2, BASE_H / 2 - 80); ctx.restore()

      ctx.fillStyle = '#FFFFFF'; ctx.font = '24px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('你达到了最高等级 Lv10！', BASE_W / 2, BASE_H / 2 - 20)
      ctx.fillStyle = '#00E676'; ctx.font = 'bold 32px sans-serif'
      ctx.fillText(`最终得分: ${engine.getScore()}`, BASE_W / 2, BASE_H / 2 + 40)

      const minutes = Math.floor(this.elapsed / 60)
      const seconds = Math.floor(this.elapsed % 60)
      ctx.fillStyle = '#4FC3F7'; ctx.font = '20px sans-serif'
      ctx.fillText(`游戏时长: ${minutes}分${seconds}秒`, BASE_W / 2, BASE_H / 2 + 90)
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '16px sans-serif'
      ctx.fillText('点击屏幕重新开始', BASE_W / 2, BASE_H / 2 + 150)

      // 返回按钮
      const btnW = 120, btnH = 40
      const btnX = BASE_W - btnW - this.SAFE_R, btnY = BASE_H - btnH - this.SAFE_B
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, 8); ctx.fill(); ctx.stroke()
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('🏠 返回主页', btnX + btnW / 2, btnY + btnH / 2); ctx.textBaseline = 'alphabetic'
      this.victoryButtonRect = { x: btnX, y: btnY, w: btnW, h: btnH }
    }
  }

  // === 创建 Phaser 游戏实例 ===
  // PC 端：FIT 模式 + 限制容器尺寸，画面清晰不放大
  // FIT 模式：等比缩放，画面完整不裁切，空白区域用深色背景填充
  if (!isMobile) {
    // PC 端：限制父容器最大尺寸
    phaserParent.style.maxWidth = '450px'
    phaserParent.style.maxHeight = '800px'
    phaserParent.style.width = '100%'
    phaserParent.style.height = '100%'
    phaserParent.style.aspectRatio = BASE_W + '/' + BASE_H
  }

  const phaserGame = new Phaser.Game({
    type: Phaser.CANVAS,
    width: BASE_W,
    height: BASE_H,
    parent: phaserParent,
    backgroundColor: '#0a0a1e',
    scale: {
      mode: Phaser.Scale.FIT,              // 统一用 FIT，画面完整不裁切
      autoCenter: Phaser.Scale.CENTER_BOTH,
      autoRound: true,
      resizeInterval: 100,
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

  // 游戏结束时清理
  const originalOnEnd = onEnd
  onEnd = () => {
    phaserGame.destroy(true)
    const phaserDiv = document.getElementById('phaser-space-shooter')
    if (phaserDiv) phaserDiv.remove()
    originalOnEnd()
  }

  engine.start()
}
