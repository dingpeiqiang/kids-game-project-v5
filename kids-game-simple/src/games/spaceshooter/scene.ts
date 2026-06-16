import { Scene, Math as PhaserMath } from 'phaser'
import type { Textures, Input, GameObjects } from 'phaser'
import type { GameEngine } from '../../services/gameEngine'
import { gameActions } from '../../platform/gameBridge'
import { audioService } from '../../services/audio'
import type { Bullet, Enemy, EnemyBullet, Particle, Shockwave, FloatText, Powerup, Star, SceneState, Turret, TransformState, TransformType } from './types'
import {
  BASE_W, BASE_H, ENEMY_TYPES, getLevelConfig, getLevelBossConfig,
  PLAYER_W as PW, PLAYER_H as PH, BULLET_SPEED, SHOOT_CD,
  STAR_COUNT,
  MAX_BULLETS, MAX_ENEMY_BULLETS, MAX_PARTICLES, MAX_FLOAT_TEXTS, MAX_SHOCKWAVES, MAX_POWERUPS, MAX_TURRETS,
  TRANSFORM_CONFIGS, getRandomTransformType
} from './config'
import { renderToCanvas } from './renderer'

// 私有常量（仅 scene 内部使用）
const PLAYER_W = PW
const PLAYER_H = PH
const SAFE_L = 20
const SAFE_R = 25
const SAFE_T = 15
const SAFE_B = 15
const TOUCH_OFFSET_Y = 80

export class SpaceShooterScene extends Scene {
  private engine!: GameEngine
  private onEnd!: () => void
  gameTexture!: Textures.CanvasTexture  // public for renderer
  ctx!: CanvasRenderingContext2D

  // 游戏状态
  playerX = BASE_W / 2
  playerY = BASE_H - 55
  bullets: Bullet[] = []
  enemies: Enemy[] = []
  enemyBullets: EnemyBullet[] = []
  particles: Particle[] = []
  shockwaves: Shockwave[] = []
  floatTexts: FloatText[] = []
  powerups: Powerup[] = []
  stars: Star[] = []
  turrets: Turret[] = []  // 自动炮台数组

  gameStarted = false
  gameEnded = false
  gameWon = false
  lastShot = 0
  elapsed = 0
  startTime = 0
  difficulty = 1
  combo = 0
  maxCombo = 0
  comboTimer = 0
  shakeAmt = 0
  slowMo = 0
  slowMoFactor = 1
  playerHP = 5
  maxHP = 5
  invincible = 0
  shieldTimer = 0
  isDying = false
  dieTimer = 0
  playerLevel = 1

  // Buff
  tripleShot = 0; tripleShotTimers: number[] = []; tripleStacks = 0
  spreadShot = 0; spreadShotTimers: number[] = []; spreadStacks = 0
  rapidShot = 0; rapidShotTimers: number[] = []; rapidStacks = 0
  laserShot = 0; laserShotTimers: number[] = []; laserStacks = 0
  pierceShot = 0; pierceShotTimers: number[] = []; pierceStacks = 0

  screenFlash = 0; damageFlash = 0; spawnTimer = 0; waveCount = 0
  totalKills = 0

  // 闪电道具
  lightningShot = 0; lightningShotTimers: number[] = []; lightningStacks = 0; lightningTimer = 0

  // 变身系统
  transform: TransformState | null = null
  transformCooldown = 0  // 变身冷却时间(ms)

  // 导弹系统
  missiles: import('./types').Missile[] = []
  missileTimer = 0       // 导弹发射计时器(ms)
  missileActive = false  // 是否激活导弹模式
  missileCount = 1       // 每轮发射的导弹数量

  // 闪电球系统
  lightningBalls: import('./types').LightningBall[] = []
  lightningBallTimer = 0 // 闪电球生成计时器(ms)
  lightningBallActive = false // 是否激活闪电球模式

  respawnsLeft = 3
  private _particlesThisFrame = 0

  finalBossSpawned = false
  finalBossWarningShown = false
  finalBoss: Enemy | null = null
  bossMinionTimer = 0

  // ===== 关卡阶段系统 =====
  /** 当前关卡（1~10），只有击杀当关 Boss 才能进入下一关 */
  currentStage = 1
  /**
   * 关卡内阶段:
   * 'wave'       — 普通敌人波次，玩家热身
   * 'boss'       — Boss 出现并战斗中
   * 'transition' — Boss 死亡后的庆祝/过渡动画
   */
  stagePhase: 'wave' | 'boss' | 'transition' = 'wave'
  /** wave 阶段已经过的时间(ms)，超过阈值后召唤 Boss */
  waveTimer = 0
  /** 各关 wave 阶段持续时间(ms)，统一为 1 分钟后出现 Boss */
  private get waveduration(): number {
    // 所有关卡都是 60 秒后出现 Boss
    return 60000
  }
  /** transition 阶段计时(ms) */
  transitionTimer = 0
  /** 过渡阶段持续时间(ms) */
  private readonly TRANSITION_MS = 2500
  /** 当前关卡 Boss 是否已经生成 */
  stageBossSpawned = false
  /** Boss倒计时（秒） */
  bossCountdown = 0

  mouseDown = false

  constructor(engine: GameEngine, onEnd: () => void) {
    super({ key: 'SpaceShooterScene' })
    this.engine = engine
    this.onEnd = onEnd
  }

  preload() {
    const texture = this.textures.createCanvas('gameCanvas', BASE_W, BASE_H)
    if (!texture) throw new Error('Failed to create canvas texture')
    this.gameTexture = texture
    this.ctx = this.gameTexture.getContext() as CanvasRenderingContext2D
    this.ctx.imageSmoothingEnabled = true
    this.ctx.imageSmoothingQuality = 'high'
  }

  create() {
    this.gameImage = this.add.image(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'gameCanvas'
    )
    this.initStars()
    this.setupInput()
    this.startTime = Date.now()
  }

  private gameImage!: GameObjects.Image

  update(_time: number, delta: number) {
    if (!this.engine.canTick()) {
      this.renderToCanvas()
      this.gameTexture.refresh()
      return
    }

    if (this.gameEnded && !this.gameWon) {
      this.renderToCanvas()
      this.gameTexture.refresh()
      return
    }

    if (this.isDying) {
      this.dieTimer -= delta
      this.updateParticles()
      this.updateShockwaves()
      this.updateFloatTexts()
      this.renderToCanvas()
      this.gameTexture.refresh()
      if (this.dieTimer <= 0) {
        this.isDying = false
        if (this.respawnsLeft > 0) {
          this.respawnPlayer()
        } else {
          this.gameEnded = true
          this.time.delayedCall(800, () => this.doEnd())
        }
      }
      return
    }

    let dt = delta
    this._particlesThisFrame = 0
    if (this.slowMo > 0) {
      this.slowMo -= delta / 1000
      dt *= this.slowMoFactor
    }

    if (this.gameStarted) {
      this.elapsed = (Date.now() - this.startTime) / 1000
      // difficulty 基于关卡编号，而非纯时间
      this.difficulty = 1 + (this.currentStage - 1) * 0.3
    }

    if (this.gameStarted) {
      const levelCfg = getLevelConfig(this.currentStage)

      // ─── 过渡阶段：Boss 死亡后的庆祝，等待后进入下一关 ───
      if (this.stagePhase === 'transition') {
        this.transitionTimer -= dt
        if (this.transitionTimer <= 0) {
          this.currentStage++
          if (this.currentStage > 10) this.currentStage = 10
          this.stagePhase = 'wave'
          this.waveTimer = 0
          this.stageBossSpawned = false
          // 清除所有残余敌人和子弹，给玩家一个干净的开始
          this.enemies = []
          this.enemyBullets = []
          this.spawnTimer = 0
          // 初始化Boss倒计时（从10秒开始）
          this.bossCountdown = 10
      
          const newCfg = getLevelConfig(this.currentStage)
          this.floatTexts.push({
            text: `★ 第 ${this.currentStage} 关 — ${newCfg.label}`,
            x: BASE_W / 2, y: BASE_H / 2 - 30, life: 3.0, color: '#00E5FF', size: 24, vy: -0.5, scale: 1.4
          })
          this.floatTexts.push({
            text: newCfg.desc,
            x: BASE_W / 2, y: BASE_H / 2 + 5, life: 2.5, color: '#B0BEC5', size: 14, vy: -0.3, scale: 1
          })
          // 添加关卡开始的特殊效果
          this.addShockwave(BASE_W / 2, BASE_H / 2, 80, '#00E5FF')
          this.screenFlash = 0.2
          audioService.win()
                  
          // 如果是第一关，添加额外的新手提示
          if (this.currentStage === 1) {
            this.time.delayedCall(1000, () => {
              if (!this.gameEnded) {
                this.floatTexts.push({
                  text: '拖动飞船移动，自动射击',
                  x: BASE_W / 2, y: BASE_H * 0.7, life: 3.0, color: '#FFFFFF', size: 16, vy: -0.3, scale: 1.0
                })
              }
            })
          }
                  
          // 添加庆祝特效
          for (let i = 0; i < 3; i++) {
            this.time.delayedCall(i * 200, () => {
              if (!this.gameEnded) {
                const x = Math.random() * BASE_W
                const y = Math.random() * BASE_H * 0.5
                this.explode(x, y, ['#FFD700', '#00E5FF', '#FF4444'][i], 15, 5)
              }
            })
          }
        }
        // 过渡期只更新特效和渲染
        this.shoot()
        this.updateBullets()
        this.updateEnemies(dt)
        this.updateEnemyBullets()
        this.updatePowerups(dt)
        this.updateTurrets(dt)
        this.updateParticles()
        this.updateShockwaves()
        this.updateFloatTexts()
        this.updateTimers(dt)
        this.renderToCanvas()
        this.gameTexture.refresh()
        return
      }

      // ─── 第10关：最终 Boss（wave 阶段直接生成） ───
      if (this.currentStage >= 10 && !this.finalBossSpawned && !this.gameEnded) {
        if (!this.finalBossWarningShown) {
          this.finalBossWarningShown = true
          this.floatTexts.push({ text: '⚠️ 最终决战!', x: BASE_W / 2, y: BASE_H / 2, life: 3.0, color: '#FF6B6B', size: 22, vy: -0.5, scale: 1.3 })
          this.floatTexts.push({ text: '击败最终Boss赢得胜利！', x: BASE_W / 2, y: BASE_H / 2 + 30, life: 2.5, color: '#FF9800', size: 14, vy: -0.3, scale: 1 })
        }
        this.spawnFinalBoss()
      }

      // ─── Wave 阶段：生成普通敌人波次 ───
      if (this.stagePhase === 'wave' && this.currentStage < 10) {
        this.waveTimer += dt

        // Boss 出现前 10s 倒计时提示
        const remaining = this.waveduration - this.waveTimer
        if (remaining > 0 && remaining < 10000 && !this.stageBossSpawned) {
          const secs = Math.ceil(remaining / 1000)
          // 只在秒数变化时更新提示，避免重复添加
          const existingText = this.floatTexts.find(ft => ft.text.startsWith('Boss 倒计时:'))
          if (!existingText || existingText.text !== `Boss 倒计时: ${secs}`) {
            // 移除旧的倒计时提示
            if (existingText) {
              const index = this.floatTexts.indexOf(existingText)
              if (index > -1) this.floatTexts.splice(index, 1)
            }
            this.floatTexts.push({ text: `Boss 倒计时: ${secs}`, x: BASE_W / 2, y: BASE_H * 0.4, life: 1.2, color: '#FF8C00', size: 18, vy: -0.4, scale: 1.2 })
          }
        }

        // wave 时间到 → 召唤 Boss，切换到 boss 阶段
        if (this.waveTimer >= this.waveduration && !this.stageBossSpawned) {
          this.stageBossSpawned = true
          this.stagePhase = 'boss'
          
          // 获取当前关卡的Boss配置
          const bossCfg = getLevelBossConfig(this.currentStage)
          const warningText = bossCfg ? bossCfg.warningText : '⚠️ BOSS 来袭!'
          
          this.floatTexts.push({ text: warningText, x: BASE_W / 2, y: BASE_H / 2 - 20, life: 2.5, color: '#FF4444', size: 22, vy: -0.5, scale: 1.4 })
          this.addShockwave(BASE_W / 2, 0, 80, '#FF0000')
          this.screenFlash = 0.2; this.shakeAmt = 1
          
          // 添加额外的视觉效果
          this.time.delayedCall(300, () => {
            if (!this.gameEnded) {
              this.addShockwave(BASE_W / 2, BASE_H / 2, 60, '#FFD700')
            }
          })
          
          this.spawnLevelBoss(this.currentStage)
        }

        // 普通敌人生成
        this.spawnTimer -= dt
        if (this.spawnTimer <= 0) {
          this.spawnEnemy()
          this.spawnTimer = levelCfg.spawnMs
          this.waveCount++
          if (this.waveCount % 3 === 0) {
            this.time.delayedCall(120, () => { if (!this.gameEnded) this.spawnEnemy() })
            this.time.delayedCall(280, () => { if (!this.gameEnded) this.spawnEnemy() })
          }
        }
      } else if (this.stagePhase === 'boss' && this.currentStage < 10) {
        // ─── Boss 阶段：持续生成普通敌人，保持场上压力 ───
        this.spawnTimer -= dt
        if (this.spawnTimer <= 0) {
          if (this.enemies.filter(e => e.bossId === undefined).length < 12) {
            this.spawnEnemy()
          }
          this.spawnTimer = Math.max(800, levelCfg.spawnMs * 0.9)
        }
      }
    }

    // 自动射击
    if (this.gameStarted) this.shoot()

    // 更新逻辑
    this.updateBullets()
    this.updateEnemies(dt)
    this.updateEnemyBullets()
    this.updatePowerups(dt)
    this.updateTurrets(dt)
    this.updateMissiles(dt)
    this.updateLightningBalls(dt)
    this.updateParticles()
    this.updateShockwaves()
    this.updateFloatTexts()
    this.updateTimers(dt)

    // 渲染
    this.renderToCanvas()
    this.gameTexture.refresh()
  }

  private inputBound = false

  // === 输入处理（触摸拖动战机，逻辑坐标 BASE_W×BASE_H）===
  private setupInput() {
    if (this.inputBound) return
    this.inputBound = true

    const applyPointer = (pointer: Input.Pointer) => {
      const pos = this.screenToLogical(pointer)
      this.playerX = pos.x
      this.playerY = pos.y - TOUCH_OFFSET_Y
      this.clampPlayer()
    }

    const onDown = (pointer: Input.Pointer) => {
      if (this.gameEnded) return
      this.mouseDown = true
      applyPointer(pointer)
      if (!this.gameStarted) {
        this.gameStarted = true
        this.startTime = Date.now()
      }
    }

    const onMove = (pointer: Input.Pointer) => {
      if (this.gameEnded || !pointer.isDown) return
      applyPointer(pointer)
    }

    const onUp = () => {
      this.mouseDown = false
    }

    this.input.on('pointerdown', onDown)
    this.input.on('pointermove', onMove)
    this.input.on('pointerup', onUp)
    this.input.on('pointerupoutside', onUp)
    this.input.on('pointercancel', onUp)

    this.events.once('shutdown', () => {
      this.input.off('pointerdown', onDown)
      this.input.off('pointermove', onMove)
      this.input.off('pointerup', onUp)
      this.input.off('pointerupoutside', onUp)
      this.input.off('pointercancel', onUp)
      this.inputBound = false
    })
  }

  private screenToLogical(pointer: Input.Pointer): { x: number; y: number } {
    const cam = this.cameras.main
    // Phaser FIT 缩放下 pointer 已在相机空间，减去 scroll 即逻辑坐标
    return { x: pointer.x - cam.scrollX, y: pointer.y - cam.scrollY }
  }

  private clampPlayer() {
    this.playerX = PhaserMath.Clamp(this.playerX, PLAYER_W / 2, BASE_W - PLAYER_W / 2)
    this.playerY = PhaserMath.Clamp(this.playerY, PLAYER_H / 2, BASE_H - 25)
  }

  // === 等级/伤害 ===
  /** 外部和渲染器通过此方法读取当前关卡 */
  private getPowerupLevel(): number { return this.currentStage }
  getPlayerLevel(): number { return this.currentStage }
  private getPlayerDamage(): number {
    if (this.currentStage >= 10) return 12
    if (this.currentStage >= 9) return 10
    if (this.currentStage >= 8) return 8
    if (this.currentStage >= 6) return 6
    if (this.currentStage >= 4) return 4
    if (this.currentStage >= 2) return 3
    return 2
  }
  private getPowerupDropRate(): number { return Math.min(0.12, 0.07 + this.currentStage * 0.004) }

  private getRandomPowerupType(): string {
    const level = this.getPowerupLevel()
    
    // 敌人太多时降低道具生成概率
    const enemyCount = this.enemies.length
    const maxEnemies = 25
    const enemyPenalty = enemyCount > maxEnemies ? Math.min(0.5, (enemyCount - maxEnemies) * 0.05) : 0
    
    let r = Math.random()
    // 如果敌人太多，有概率直接返回null（不生成道具）
    if (r < enemyPenalty) return 'heal' // 返回heal但实际会被概率过滤
    
    r = Math.random()
    
    if (level >= 8) {
      if (r < 0.04) return 'laser'; if (r < 0.08) return 'shield'
      if (r < 0.13) return 'rapid'; if (r < 0.18) return 'pierce'
      if (r < 0.23) return 'lightning'; if (r < 0.27) return 'missile'
      if (r < 0.31) return 'lightning_ball'; if (r < 0.35) return 'transform'
      if (r < 0.39) return 'turret_wide'; if (r < 0.43) return 'turret_sniper'
      if (r < 0.47) return 'turret_burst'; if (r < 0.51) return 'turret'
      if (r < 0.73) return 'triple'; if (r < 0.93) return 'spread'; return 'heal'
    } else if (level >= 6) {
      if (r < 0.03) return 'laser'; if (r < 0.07) return 'shield'
      if (r < 0.12) return 'rapid'; if (r < 0.17) return 'pierce'
      if (r < 0.22) return 'lightning'; if (r < 0.26) return 'missile'
      if (r < 0.30) return 'lightning_ball'; if (r < 0.34) return 'transform'
      if (r < 0.38) return 'turret_wide'; if (r < 0.42) return 'turret_sniper'
      if (r < 0.46) return 'turret_burst'; if (r < 0.50) return 'turret'
      if (r < 0.72) return 'triple'; if (r < 0.92) return 'spread'; return 'heal'
    } else if (level >= 4) {
      if (r < 0.02) return 'laser'; if (r < 0.05) return 'shield'
      if (r < 0.10) return 'rapid'; if (r < 0.15) return 'pierce'
      if (r < 0.20) return 'lightning'; if (r < 0.24) return 'missile'
      if (r < 0.28) return 'lightning_ball'; if (r < 0.32) return 'transform'
      if (r < 0.36) return 'turret_wide'; if (r < 0.40) return 'turret_sniper'
      if (r < 0.44) return 'turret_burst'; if (r < 0.48) return 'turret'
      if (r < 0.70) return 'triple'; if (r < 0.90) return 'spread'; return 'heal'
    } else if (level >= 2) {
      if (r < 0.02) return 'laser'; if (r < 0.04) return 'shield'
      if (r < 0.09) return 'rapid'; if (r < 0.14) return 'pierce'
      if (r < 0.19) return 'missile'; if (r < 0.23) return 'lightning_ball'
      if (r < 0.27) return 'transform'; if (r < 0.32) return 'turret'
      if (r < 0.37) return 'turret_wide'; if (r < 0.59) return 'triple'
      if (r < 0.85) return 'spread'; return 'heal'
    } else {
      if (r < 0.30) return 'triple'; if (r < 0.55) return 'spread'
      if (r < 0.75) return 'heal'; if (r < 0.88) return 'turret'; return 'turret_wide'
    }
  }

  // === 道具使用 ===
  private activateBuff(buffType: string, duration: number): void {
    switch (buffType) {
      case 'tripleShot': this.tripleShotTimers.push(duration); this.tripleStacks++; this.tripleShot = duration; break
      case 'spreadShot': this.spreadShotTimers.push(duration); this.spreadStacks++; this.spreadShot = duration; break
      case 'rapidShot': this.rapidShotTimers.push(duration); this.rapidStacks++; this.rapidShot = duration; break
      case 'laserShot': this.laserShotTimers.push(duration); this.laserStacks++; this.laserShot = duration; break
      case 'pierceShot': this.pierceShotTimers.push(duration); this.pierceStacks++; this.pierceShot = duration; break
      case 'lightningShot': this.lightningShotTimers.push(duration); this.lightningStacks++; this.lightningShot = duration; break
    }
  }

  private usePowerupImmediately(type: string): void {
    const level = this.getPowerupLevel()
    switch (type) {
      case 'triple': {
        const dur = 10000; const count = 3
        this.activateBuff('tripleShot', dur)
        for (let i = 0; i < count; i++) {
          const ox = (i - Math.floor(count / 2)) * 8
          this.bullets.push({ x: this.playerX + ox, y: this.playerY - PLAYER_H / 2, vx: 0, vy: -BULLET_SPEED * 1.3, pierce: this.pierceShot > 0 ? 3 : 0, originX: this.playerX })
        }
        this.explode(this.playerX, this.playerY, '#FFD700', 10, 4)
        audioService.win(); break
      }
      case 'spread': {
        const cnt = 7; const ang = 0.18; const dur = 8000
        this.activateBuff('spreadShot', dur)
        for (let i = Math.floor(-cnt / 2); i <= Math.floor(cnt / 2); i++) {
          const a = -Math.PI / 2 + i * ang
          this.bullets.push({ x: this.playerX, y: this.playerY - PLAYER_H / 2, vx: Math.cos(a) * BULLET_SPEED * 1.2, vy: Math.sin(a) * BULLET_SPEED * 1.2, pierce: this.pierceShot > 0 ? 2 : 0, originX: this.playerX })
        }
        this.explode(this.playerX, this.playerY, '#FF6B6B', 10, 4)
        audioService.win(); break
      }
      case 'heal': {
        const old = this.playerHP
        this.playerHP += 1  // 移除上限限制，生命值可以无限叠加
        this.maxHP = this.playerHP  // 同步更新maxHP
        if (this.playerHP > old) {
          this.explode(this.playerX, this.playerY, '#00E676', 12, 3)
          this.floatTexts.push({ text: `+${this.playerHP - old} ❤️`, x: this.playerX, y: this.playerY - 40, life: 1.5, color: '#00E676', size: 22, vy: -2, scale: 1.3 })
        }
        audioService.win(); break
      }
      case 'turret': {
        if (this.turrets.length >= MAX_TURRETS) { audioService.click(); break }
        this.spawnTurret('normal', this.playerX, this.playerY - 30)
        audioService.win(); break
      }
      case 'turret_wide': {
        if (this.turrets.length >= MAX_TURRETS) { audioService.click(); break }
        this.spawnTurret('wide', this.playerX, this.playerY - 30)
        audioService.win(); break
      }
      case 'turret_sniper': {
        if (this.turrets.length >= MAX_TURRETS) { audioService.click(); break }
        this.spawnTurret('sniper', this.playerX, this.playerY - 30)
        audioService.win(); break
      }
      case 'turret_burst': {
        if (this.turrets.length >= MAX_TURRETS) { audioService.click(); break }
        this.spawnTurret('burst', this.playerX, this.playerY - 30)
        audioService.win(); break
      }
      case 'shield': { this.shieldTimer = 20; this.addShockwave(this.playerX, this.playerY, 50, '#4FC3F7'); audioService.win(); break }
      case 'rapid': {
        const durR = 8000; this.activateBuff('rapidShot', durR)
        this.lastShot = Date.now() - SHOOT_CD + 500
        this.explode(this.playerX, this.playerY, '#FF5722', 10, 4)
        audioService.win(); break
      }
      case 'laser': {
        const durL = 6000; this.activateBuff('laserShot', durL)
        const cntL = 3 + this.laserStacks * 2; const spdL = BULLET_SPEED * 2.5
        for (let i = 0; i < cntL; i++) {
          this.time.delayedCall(i * 40, () => {
            if (!this.gameEnded) {
              this.bullets.push({ x: this.playerX, y: this.playerY - PLAYER_H / 2, vx: 0, vy: -spdL, pierce: 3, originX: this.playerX })
              this.explode(this.playerX, this.playerY - PLAYER_H / 2, '#E040FB', 8, 3)
            }
          })
        }
        audioService.win(); break
      }
      case 'pierce': {
        this.activateBuff('pierceShot', 8000)
        this.explode(this.playerX, this.playerY, '#FF9800', 10, 3)
        this.floatTexts.push({ text: '击穿弹', x: this.playerX, y: this.playerY - 30, life: 0.8, color: '#FF9800', size: 14, vy: -1.5, scale: 1 })
        audioService.win(); break
      }
      case 'lightning': {
        this.activateBuff('lightningShot', 10000)
        this.explode(this.playerX, this.playerY, '#FFD700', 15, 6)
        this.explode(this.playerX, this.playerY, '#FFFFFF', 10, 3)
        this.floatTexts.push({ text: '⚡闪电!', x: this.playerX, y: this.playerY - 30, life: 0.8, color: '#FFD700', size: 16, vy: -1.5, scale: 1 })
        audioService.win(); break
      }
      case 'missile': {
        this.activateMissileMode()
        this.explode(this.playerX, this.playerY, '#FF9800', 15, 6)
        this.floatTexts.push({ text: '🚀导弹系统激活!', x: this.playerX, y: this.playerY - 30, life: 1.0, color: '#FF9800', size: 18, vy: -1.5, scale: 1.2 })
        audioService.win(); break
      }
      case 'lightning_ball': {
        this.activateLightningBallMode()
        this.explode(this.playerX, this.playerY, '#FFD700', 15, 6)
        this.floatTexts.push({ text: '⚡闪电球激活!', x: this.playerX, y: this.playerY - 30, life: 1.0, color: '#FFD700', size: 18, vy: -1.5, scale: 1.2 })
        audioService.win(); break
      }
      case 'transform': {
        if (this.transformCooldown > 0) {
          this.floatTexts.push({ text: '变身冷却中!', x: this.playerX, y: this.playerY - 30, life: 0.8, color: '#FF9800', size: 14, vy: -1.2, scale: 1 })
          audioService.click(); break
        }
        const transformType = this.getRandomTransformType()
        this.startTransform(transformType)
        audioService.win(); break
      }
    }
  }

  // === 星空 ===
  private initStars() {
    this.stars.length = 0
    for (let i = 0; i < STAR_COUNT; i++) {
      this.stars.push({ x: Math.random() * BASE_W, y: Math.random() * BASE_H, speed: 0.3 + Math.random() * 1.5, size: 0.5 + Math.random() * 2, bright: 0.3 + Math.random() * 0.7 })
    }
  }

  // === 敌人生成 ===
  private spawnEnemy() {
    const level = this.getPowerupLevel()
    const cfg = getLevelConfig(level)
    let typeIdx = 0
    const totalW = cfg.weights.reduce((a, b) => a + b, 0)
    let rw = Math.random() * totalW
    for (let i = 0; i < cfg.weights.length; i++) {
      rw -= cfg.weights[i]
      if (rw <= 0) { typeIdx = i; break }
    }
    // bossRate 覆盖到 index 7（普通 Boss），Boss 阶段不生成普通 Boss 以保留小怪数量
    if (!this.finalBoss && this.stagePhase !== 'boss' && cfg.bossRate > 0 && Math.random() < cfg.bossRate) typeIdx = 7
    const type = ENEMY_TYPES[typeIdx]
    const hp = type.hp + cfg.hpBonus
    this.enemies.push({
      x: 30 + Math.random() * (BASE_W - 60), y: -type.h,
      w: type.w, h: type.h, hp, maxHp: hp, score: type.score,
      color: type.color, shape: type.shape, speed: type.speed * cfg.spdMul,
      shootTimer: 2000 + Math.random() * 2000,
      behavior: type.behavior,
      phaseX: Math.random() * Math.PI * 2,
      shieldHP: type.behavior === 'shield' ? 1 : 0,
    })
  }

  private spawnFinalBoss() {
    this.finalBossSpawned = true
    const bossType = ENEMY_TYPES[8]  // index 8 = final_boss
    const boss: Enemy = { x: BASE_W / 2, y: 80, w: bossType.w, h: bossType.h, hp: bossType.hp, maxHp: bossType.hp, score: bossType.score, color: bossType.color, shape: bossType.shape, speed: 0, shootTimer: 1500 }
    this.enemies.push(boss)
    this.finalBoss = boss
    this.floatTexts.push({ text: '最终BOSS', x: BASE_W / 2, y: BASE_H / 2, life: 2.5, color: '#FF6B6B', size: 28, vy: -0.8, scale: 1 })
    audioService.win()
  }

  // === 生成关卡 Boss（Lv1~9 各关一个，Lv10 由 spawnFinalBoss 处理）===
  private spawnLevelBoss(level: number) {
    const bossCfg = getLevelBossConfig(level)
    if (!bossCfg) return

    // 直接使用配置中精心设计的 HP，不再乘倍率（HP 已在配置里按关卡合理设定）
    const bossHP = bossCfg.hp

    const boss = {
      x: BASE_W / 2,
      y: -bossCfg.h - 20,
      w: bossCfg.w, h: bossCfg.h,
      hp: bossHP, maxHp: bossHP,
      score: bossCfg.score,
      color: bossCfg.color,
      shape: bossCfg.shape,
      speed: bossCfg.speed,
      shootTimer: bossCfg.shootInterval * 0.5,  // 进场后立刻半周期就开始射击，更有压迫感
      bossId: bossCfg.bossId,
      bossPhase: 0,
      bossTimer: 0,
      bossDir: 1,
      bossShieldTimer: 0,
      bossHasShield: false,
      bossBurstTimer: 0,
    }
    this.enemies.push(boss)
    
    // 名称大字浮现
    this.floatTexts.push({ text: bossCfg.warningText, x: BASE_W / 2, y: BASE_H / 2 - 30, life: 3.0, color: bossCfg.color, size: 22, vy: -0.4, scale: 1.4 })
    this.floatTexts.push({ text: `HP: ${bossHP}`, x: BASE_W / 2, y: BASE_H / 2 + 5, life: 2.0, color: bossCfg.accentColor, size: 14, vy: -0.3, scale: 1.0 })
    
    // 添加额外的视觉效果
    this.explode(BASE_W / 2, -20, bossCfg.color, 30, 6)
    this.addShockwave(BASE_W / 2, 60, 50, bossCfg.color)
    this.screenFlash = 0.15
    this.shakeAmt = 1
    
    // 添加屏幕震动和闪光效果
    this.time.delayedCall(200, () => {
      if (!this.gameEnded) {
        this.screenFlash = 0.1
        this.shakeAmt = 1
      }
    })
    
    audioService.win()
  }

  // === 射击 ===
  private shoot() {
    if (this.bullets.length >= MAX_BULLETS) return
    const now = Date.now()
    let cd = SHOOT_CD
    if (this.rapidShot > 0) cd = SHOOT_CD / (1 + this.rapidStacks * 0.5)
    
    // 变身射速加成
    const fireRateMultiplier = this.getTransformFireRateMultiplier()
    cd /= fireRateMultiplier
    
    if (now - this.lastShot < cd) return
    this.lastShot = now
    const pierceCount = this.pierceShot > 0 ? this.pierceStacks * 2 : 0
    
    // 变身子弹速度
    const bulletSpeed = BULLET_SPEED * this.getTransformBulletSpeed()
    
    if (this.tripleShot > 0) {
      const tripleCount = 3 * this.tripleStacks
      for (let i = 0; i < tripleCount; i++) {
        const ox = (i - (tripleCount - 1) / 2) * 8
        this.bullets.push({ x: this.playerX + ox, y: this.playerY - PLAYER_H / 2, vx: 0, vy: -bulletSpeed, pierce: pierceCount, originX: this.playerX })
      }
    } else if (this.spreadShot > 0) {
      const spreadSteps = 3 + (this.spreadStacks - 1) * 2
      const spreadAngle = 0.18 - Math.min(0.08, (this.spreadStacks - 1) * 0.03)
      for (let i = -spreadSteps; i <= spreadSteps; i++) {
        const a = -Math.PI / 2 + i * spreadAngle
        this.bullets.push({ x: this.playerX, y: this.playerY - PLAYER_H / 2, vx: Math.cos(a) * bulletSpeed, vy: Math.sin(a) * bulletSpeed, pierce: pierceCount, originX: this.playerX })
      }
    } else {
      // 变身子弹数量加成
      const bulletCount = this.getTransformBulletCount()
      if (bulletCount > 1) {
        // 多颗子弹均匀分布
        const spread = 0.15
        for (let i = -Math.floor(bulletCount / 2); i <= Math.floor(bulletCount / 2); i++) {
          const a = -Math.PI / 2 + i * spread
          this.bullets.push({ x: this.playerX, y: this.playerY - PLAYER_H / 2, vx: Math.cos(a) * bulletSpeed * (Math.abs(i) > 0 ? 0.9 : 1), vy: Math.sin(a) * bulletSpeed, pierce: pierceCount, originX: this.playerX })
        }
      } else {
        this.bullets.push({ x: this.playerX, y: this.playerY - PLAYER_H / 2, vx: 0, vy: -bulletSpeed, pierce: pierceCount, originX: this.playerX })
      }
    }
    audioService.click()
  }

  // === 特效 ===
  private explode(x: number, y: number, color: string, count: number, force: number = 5) {
    const budget = Math.min(MAX_PARTICLES - this.particles.length, 20 - this._particlesThisFrame)
    const actual = Math.min(count, Math.max(1, budget))
    for (let i = 0; i < actual; i++) {
      const a = Math.random() * Math.PI * 2
      const s = Math.random() * force + 1
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, color, size: 2 + Math.random() * 4 })
    }
    this._particlesThisFrame += actual
  }

  private addShockwave(x: number, y: number, maxRadius: number, color: string) {
    this.shockwaves.push({ x, y, radius: 0, maxRadius, life: 1, color })
  }

  private rectCollide(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number): boolean {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
  }

  // === 更新子弹 ===
  private updateBullets() {
    // 变身伤害加成
    const damageMultiplier = this.getTransformDamageMultiplier()
    
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i]
      if (b.originX !== undefined && b.vx === 0) {
        const playerMoveX = this.playerX - b.originX
        const flyDistance = (BASE_H - 55) - b.y
        const curveFactor = Math.min(flyDistance / 300, 1.0) * 0.3
        b.x += playerMoveX * curveFactor * 0.1
      }
      b.x += b.vx; b.y += b.vy
      if (b.y < -10 || b.x < -10 || b.x > BASE_W + 10) { this.bullets.splice(i, 1); continue }

      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j]
        const dx = b.x - e.x; const dy = b.y - e.y
        if (dx * dx + dy * dy > 3600) continue  // 距离快速排除（>60px 免碰撞检测）
        if (this.rectCollide(b.x - 3, b.y - 5, 6, 10, e.x - e.w / 2, e.y - e.h / 2, e.w, e.h)) {
          if (b.pierce > 0) { b.pierce-- } else { this.bullets.splice(i, 1) }

          let dmg = this.getPlayerDamage() * damageMultiplier
          if (e.shape === 'final_boss') dmg = Math.min(dmg, 3 + Math.floor(this.currentStage / 3))

          // 护盾行为：挡掉第一发伤害
          if (e.shieldHP !== undefined && e.shieldHP > 0) {
            e.shieldHP--
            this.explode(b.x, b.y, '#00BCD4', 12, 5)
            this.addShockwave(e.x, e.y, 40, '#00BCD4')
            if (b.pierce <= 0) this.bullets.splice(i, 1)
            continue
          }

          // Boss护盾技能：减免70%伤害
          if (e.bossHasShield) {
            dmg *= 0.3 // 护盾减免70%伤害
            this.explode(b.x, b.y, '#00BCD4', 8, 2)
          }

          e.hp -= dmg
          this.explode(b.x, b.y, '#FFD700', 6 + dmg * 3, 3 + dmg)

          if (e.hp <= 0) {
            this.combo++; this.comboTimer = 3; this.totalKills++
            if (this.combo > this.maxCombo) this.maxCombo = this.combo
            const comboMultiplier = Math.min(this.combo, 30)
            this.gameActions.addScore(e.score * comboMultiplier, e.x, e.y)
            const expSize = Math.min(40, 25 + e.maxHp * 6 + this.combo)
            const pCnt = Math.min(18, 10 + e.maxHp * 3 + Math.floor(this.combo / 2))

            // 分裂行为：死亡时生成2个迷你敌人
            if (e.behavior === 'split' && this.enemies.length < 20) {
              for (let m = 0; m < 2; m++) {
                const ox = (m - 0.5) * 20
                this.enemies.push({
                  x: e.x + ox, y: e.y,
                  w: 18, h: 16, hp: 1, maxHp: 1, score: 8,
                  color: '#E74C3C', shape: 'circle', speed: 1.2,
                  shootTimer: 3000, behavior: 'straight', phaseX: 0,
                })
              }
              this.explode(e.x, e.y, '#FF6B6B', expSize * 0.6, pCnt * 0.6)
            }

            const isLevelBoss = e.bossId !== undefined
            if (e.shape === 'boss' || isLevelBoss) {
              this.explode(e.x, e.y, e.color, expSize, pCnt)
              this.explode(e.x, e.y, '#FFD700', expSize * 0.7, pCnt * 0.8)
              this.explode(e.x, e.y, '#FFFFFF', Math.floor(expSize * 0.3), pCnt * 0.4)
            } else if (e.maxHp >= 3) {
              this.explode(e.x, e.y, e.color, expSize, pCnt)
              this.explode(e.x, e.y, '#FFD700', expSize * 0.6, pCnt * 0.6)
            } else {
              this.explode(e.x, e.y, e.color, expSize, pCnt)
            }

            if (this.shockwaves.length < MAX_SHOCKWAVES && (isLevelBoss || e.maxHp >= 5))
              this.addShockwave(e.x, e.y, 50 + Math.min(this.combo, 15), e.color)

            if (this.combo >= 30) this.shakeAmt = 3
            else if (this.combo >= 15) this.shakeAmt = 1

            if (e.shape === 'boss') { this.slowMo = 0.5; this.slowMoFactor = 0.3; this.screenFlash = 0.4 }

            // 关卡 Boss 击杀特效
            if (isLevelBoss) {
              const bossCfg = getLevelBossConfig(e.bossId!)
              this.slowMo = 0.6; this.slowMoFactor = 0.25; this.screenFlash = 0.45
              this.addShockwave(e.x, e.y, 60, e.color)
              this.time.delayedCall(150, () => this.addShockwave(e.x, e.y, 70, '#FFD700'))
              this.floatTexts.push({ text: `${bossCfg?.name ?? 'BOSS'} 已击败!`, x: BASE_W / 2, y: BASE_H / 2 - 10, life: 2.0, color: e.color, size: 20, vy: -0.6, scale: 1.2 })
              
              // 显示关卡完成提示
              this.floatTexts.push({ text: `第 ${this.currentStage} 关完成!`, x: BASE_W / 2, y: BASE_H / 2 + 20, life: 2.0, color: '#00E5FF', size: 18, vy: -0.5, scale: 1.1 })
              
              // 保证每次击杀 Boss 后掉落至少 1 个道具
              this.powerups.push({ x: e.x, y: e.y, vx: (Math.random() - 0.5) * 2, vy: 1, type: this.getRandomPowerupType(), life: 30 })
              if (this.powerups.length < MAX_POWERUPS) this.powerups.push({ x: e.x + 20, y: e.y + 10, vx: (Math.random() - 0.5) * 2, vy: 1, type: 'heal', life: 30 })
              
              // 进入过渡阶段
              this.stagePhase = 'transition'
              this.transitionTimer = this.TRANSITION_MS
            }

            if (this.combo >= 3 && this.floatTexts.length < MAX_FLOAT_TEXTS - 2) {
              const comboColor = this.combo >= 20 ? '#FF6B6B' : this.combo >= 10 ? '#FFD700' : '#4FC3F7'
              const comboSize = Math.min(20, 14 + Math.floor(this.combo / 5))
              this.floatTexts.push({ text: `${this.combo} COMBO`, x: e.x, y: e.y - 15, life: 1.0, color: comboColor, size: comboSize, vy: -1.5, scale: 1 })
            }
            if (this.floatTexts.length < MAX_FLOAT_TEXTS)
              this.floatTexts.push({ text: `+${e.score * comboMultiplier}`, x: e.x, y: e.y + 5, life: 0.8, color: '#FFD700', size: 12, vy: -1.0, scale: 1 })

            if (!isLevelBoss && Math.random() < this.getPowerupDropRate() && this.powerups.length < MAX_POWERUPS)
              this.powerups.push({ x: e.x, y: e.y, vx: (Math.random() - 0.5) * 2, vy: 1, type: this.getRandomPowerupType(), life: 30 })

            if (this.combo >= 5) this.engine.triggerRandomBuff()
            audioService.win()

            if (e.shape === 'final_boss') {
              this.explode(e.x, e.y, '#FF0000', 80, 50)
              this.explode(e.x, e.y, '#FFD700', 60, 40)
              this.explode(e.x, e.y, '#FFFFFF', 40, 30)
              this.addShockwave(e.x, e.y, 80, '#FF0000')
              this.time.delayedCall(200, () => this.addShockwave(e.x, e.y, 60, '#FFD700'))
              this.shakeAmt = 5; this.screenFlash = 0.4; this.slowMo = 1.0; this.slowMoFactor = 0.2
              this.floatTexts.push({ text: 'BOSS defeated!', x: BASE_W / 2, y: BASE_H / 2, life: 2.5, color: '#FFD700', size: 24, vy: -0.8, scale: 1 })
              this.finalBoss = null
              this.time.delayedCall(2000, () => {
                this.gameWon = true
                this.gameEnded = true
                this.doEnd()
              })
            }
            this.enemies.splice(j, 1)
          } else {
            audioService.click()
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
      if (e.shape === 'final_boss') {
        e.y = 80
        e.x += Math.sin(Date.now() / 1000) * 1.5
        e.x = Math.max(e.w / 2, Math.min(BASE_W - e.w / 2, e.x))
        e.shootTimer -= dt
        if (e.shootTimer <= 0) {
          const attackPattern = Math.floor(Math.random() * 4)
          if (attackPattern === 0) {
            if (this.enemyBullets.length < MAX_ENEMY_BULLETS)
              for (let angle = -0.6; angle <= 0.6; angle += 0.15)
                this.enemyBullets.push({ x: e.x, y: e.y + e.h / 2, vy: Math.abs(4 + this.difficulty * 0.5), vx: Math.sin(angle) * 3, color: '#FF0000' })
            if (this.enemies.length < 18)
              for (let m = 0; m < 2; m++)
                this.enemies.push({ x: e.x + (Math.random() - 0.5) * 80, y: e.y + e.h, w: 22, h: 20, hp: 1, maxHp: 1, score: 8, color: '#FF6666', shape: 'diamond', speed: 1.8, shootTimer: 2000 })
          } else if (attackPattern === 1) {
            if (this.enemies.length < 18)
              for (let m = 0; m < 4; m++)
                this.enemies.push({ x: e.x + (m - 1.5) * 35, y: e.y + e.h, w: 20, h: 18, hp: 1, maxHp: 1, score: 5, color: '#FF6666', shape: 'circle', speed: 2.2, shootTimer: 2500 })
          } else if (attackPattern === 2) {
            if (this.enemyBullets.length < MAX_ENEMY_BULLETS)
              for (let b = 0; b < 16; b++) {
                const angle = (Math.PI * 2 / 16) * b + Date.now() / 1000
                this.enemyBullets.push({ x: e.x, y: e.y, vy: Math.abs(Math.sin(angle)) * 3.5, vx: Math.cos(angle) * 3.5, color: '#FF4444' })
              }
            if (this.enemies.length < 16 && Math.random() < 0.6)
              for (let m = 0; m < 3; m++)
                this.enemies.push({ x: e.x + (m - 1) * 45, y: e.y + e.h, w: 18, h: 16, hp: 1, maxHp: 1, score: 6, color: '#FF8C00', shape: 'triangle', speed: 2.6, shootTimer: 1800, behavior: 'zigzag' })
          } else {
            this.enemies.push({ x: e.x, y: e.y + e.h, w: 28, h: 24, hp: 2, maxHp: 2, score: 15, color: '#9B59B6', shape: 'hex', speed: 1.2, shootTimer: 1500 })
            if (this.enemies.length < 14)
              for (let m = 0; m < 4; m++)
                this.enemies.push({ x: e.x + (m - 1.5) * 30, y: e.y + e.h, w: 20, h: 18, hp: 1, maxHp: 1, score: 5, color: '#FF4757', shape: 'circle', speed: 2.0, shootTimer: 2000 })
          }
          e.shootTimer = 800 + Math.random() * 600
        }
      } else if (e.bossId !== undefined) {
        // === 关卡专属 Boss 逻辑 ===
        this.updateLevelBoss(e, dt, i)
      } else {
        e.y += e.speed
        // 根据行为类型横向移动
        if (e.behavior === 'zigzag' || e.behavior === 'sine') {
          e.phaseX = (e.phaseX ?? 0) + dt * 0.004
          e.x += Math.sin(e.phaseX) * 1.8
          e.x = Math.max(e.w / 2, Math.min(BASE_W - e.w / 2, e.x))
        }
        if (this.gameStarted && e.y > 20 && e.y < BASE_H * 0.7) {
          e.shootTimer -= dt
          if (e.shootTimer <= 0) {
            if (e.shape === 'boss') {
              if (this.enemyBullets.length < MAX_ENEMY_BULLETS)
                for (let angle = -0.4; angle <= 0.4; angle += 0.2)
                  this.enemyBullets.push({ x: e.x, y: e.y + e.h / 2, vy: Math.abs(4 + this.difficulty * 0.8), vx: Math.sin(angle) * 2.5, color: e.color })
            } else if (e.shape === 'hex') {
              if (this.enemyBullets.length < MAX_ENEMY_BULLETS) {
                this.enemyBullets.push({ x: e.x, y: e.y + e.h / 2, vy: 4 + this.difficulty * 0.6, vx: -0.5, color: e.color })
                this.enemyBullets.push({ x: e.x, y: e.y + e.h / 2, vy: 4 + this.difficulty * 0.6, vx: 0.5, color: e.color })
              }
            } else {
              if (this.enemyBullets.length < MAX_ENEMY_BULLETS)
                this.enemyBullets.push({ x: e.x, y: e.y + e.h / 2, vy: 3.5 + this.difficulty * 0.5, vx: 0, color: e.color })
            }
            const baseInt = e.shape === 'boss' ? 1500 : (e.shape === 'hex' ? 2200 : 3000)
            e.shootTimer = Math.max(800, baseInt - this.difficulty * 60) + Math.random() * 800
          }
        }
        const offScreenLimit = this.stagePhase === 'boss' ? BASE_H + 300 : BASE_H + 40;
        if (e.y > offScreenLimit) { this.enemies.splice(i, 1); continue }
        if (this.invincible <= 0 && this.shieldTimer <= 0 && this.rectCollide(this.playerX - PLAYER_W / 2, this.playerY - PLAYER_H / 2, PLAYER_W, PLAYER_H, e.x - e.w / 2, e.y - e.h / 2, e.w, e.h)) {
          this.playerHP--; this.invincible = 3; this.shakeAmt = 1; this.screenFlash = 0.2; this.combo = 0
          this.explode(this.playerX, this.playerY, '#FF4757', 20, 5)
          audioService.pop()
          this.floatTexts.push({ text: '-1 ❤️', x: this.playerX, y: this.playerY - 30, life: 1.0, color: '#FF4757', size: 20, vy: -1.5, scale: 1.3 })
          this.enemies.splice(i, 1)
          if (this.playerHP <= 0) {
            this.onPlayerDeath()
            return
          }
        }
      }
    }
  }

  // === 炮台配置 ===
  private readonly TURRET_CONFIGS = {
    normal: { life: 20000, radius: 220, damage: 2, shootInterval: 220, color: '#00BCD4', name: '普通炮台' },
    wide: { life: 20000, radius: BASE_W * 2, damage: 1, shootInterval: 200, color: '#FF9800', name: '全屏炮台' },
    sniper: { life: 20000, radius: BASE_W * 1.2, damage: 5, shootInterval: 600, color: '#E040FB', name: '狙击炮台' },
    burst: { life: 20000, radius: 250, damage: 3, shootInterval: 800, color: '#FF4444', name: '爆发炮台' }
  }

  // === 生成炮台 ===
  private spawnTurret(type: 'normal' | 'wide' | 'sniper' | 'burst', x: number, y: number) {
    const config = this.TURRET_CONFIGS[type]
    
    this.turrets.push({
      x,
      y,
      life: config.life,
      shootTimer: 0,
      radius: config.radius,
      damage: config.damage,
      type,
      lastAttackTime: Date.now()
    })
    
    this.explode(x, y, config.color, 15, 5)
    this.addShockwave(x, y, 60, config.color)
    this.floatTexts.push({ text: `🔧 ${config.name}部署!`, x, y: y - 30, life: 1.5, color: config.color, size: 16, vy: -1.5, scale: 1.2 })
  }

  // === 更新炮台 ===
  private updateTurrets(dt: number) {
    const now = Date.now()
    
    for (let i = this.turrets.length - 1; i >= 0; i--) {
      const turret = this.turrets[i]
      turret.life -= dt
      
      const config = this.TURRET_CONFIGS[turret.type]
      
      // 炮台生命结束，移除
      if (turret.life <= 0) {
        this.explode(turret.x, turret.y, config.color, 10, 3)
        this.floatTexts.push({ text: '炮台失效', x: turret.x, y: turret.y - 20, life: 0.8, color: config.color, size: 12, vy: -1.0, scale: 1 })
        this.turrets.splice(i, 1)
        continue
      }
      
      // 炮台射击逻辑
      turret.shootTimer -= dt
      if (turret.shootTimer <= 0) {
        // 爆发炮台：每2秒进行一次全屏爆发攻击
        if (turret.type === 'burst' && now - turret.lastAttackTime >= 2000) {
          this.burstTurretAttack(turret)
          turret.lastAttackTime = now
        } else {
          // 寻找范围内的敌人
          let targetEnemy: Enemy | null = null
          let minDist = turret.radius
          
          for (const enemy of this.enemies) {
            const dx = enemy.x - turret.x
            const dy = enemy.y - turret.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            
            if (dist < turret.radius) {
              if (!targetEnemy || dist < minDist) {
                targetEnemy = enemy
                minDist = dist
              }
            }
          }
          
          // 如果找到目标，发射子弹
          if (targetEnemy && this.bullets.length < MAX_BULLETS) {
            const dx = targetEnemy.x - turret.x
            const dy = targetEnemy.y - turret.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            const speed = turret.type === 'sniper' ? BULLET_SPEED * 1.8 : BULLET_SPEED * 0.8
            
            // 狙击炮台发射穿透弹
            this.bullets.push({
              x: turret.x,
              y: turret.y,
              vx: (dx / dist) * speed,
              vy: (dy / dist) * speed,
              pierce: turret.type === 'sniper' ? 2 : 0,
              originX: turret.x
            })
            
            this.explode(turret.x, turret.y, config.color, 5, 2)
          }
        }
        
        turret.shootTimer = config.shootInterval
      }
    }
  }

  // === 爆发炮台全屏攻击 ===
  private burstTurretAttack(turret: typeof this.turrets[0]) {
    const enemyCount = this.enemies.length
    if (enemyCount === 0) return
    
    // 对所有敌人造成伤害并产生特效
    for (const enemy of this.enemies) {
      enemy.hp -= turret.damage * 2
      this.explode(enemy.x, enemy.y, '#FF4444', 15, 8)
      
      if (enemy.hp <= 0) {
        this.combo++
        this.comboTimer = 3
        this.totalKills++
        if (this.combo > this.maxCombo) this.maxCombo = this.combo
        const comboMultiplier = Math.min(this.combo, 30)
        this.gameActions.addScore(enemy.score * comboMultiplier, enemy.x, enemy.y)
        
        this.explode(enemy.x, enemy.y, enemy.color, 30, 10)
        this.addShockwave(enemy.x, enemy.y, 40, enemy.color)
        
        if (this.enemies.length < MAX_ENEMY_BULLETS && Math.random() < 0.1) {
          this.powerups.push({ x: enemy.x, y: enemy.y, vx: (Math.random() - 0.5) * 2, vy: 1, type: this.getRandomPowerupType(), life: 30 })
        }
      }
    }
    
    // 清理死亡的敌人
    this.enemies = this.enemies.filter(e => e.hp > 0)
    
    // 添加全屏冲击波特效
    this.addShockwave(BASE_W / 2, BASE_H / 2, 120, '#FF4444')
    this.screenFlash = 0.15
    this.shakeAmt = 3
  }

  /** 关卡专属 Boss 的移动、阶段转换和攻击逻辑 */
  private updateLevelBoss(e: import('./types').Enemy, dt: number, _idx: number) {
    const bossCfg = getLevelBossConfig(e.bossId!)
    if (!bossCfg) return

    // 血量阶段检测 — 进入下半血时强化
    const hpRatio = e.hp / e.maxHp
    if (hpRatio < 0.5 && e.bossPhase === 0) {
      e.bossPhase = 1
      this.floatTexts.push({ text: '⚠️ ENRAGE!', x: e.x, y: e.y - 30, life: 1.5, color: '#FF4444', size: 18, vy: -1.5, scale: 1.3 })
      this.addShockwave(e.x, e.y, 50, e.color)
      this.screenFlash = 0.15; this.shakeAmt = 3
    }
    const enraged = e.bossPhase! >= 1
    const speedBoost = enraged ? 1.5 : 1.0
    let shootSpeedBoost = enraged ? 1.5 : 1.0

    // 进场：从顶部降落到指定位置
    const targetY = e.h / 2 + 60
    if (e.y < targetY) {
      e.y += 2.5
      return
    }

    // --- 移动模式 ---
    e.bossTimer = (e.bossTimer ?? 0) + dt
    switch (bossCfg.moveMode) {
      case 'zigzag': {
        e.x += e.speed * speedBoost * (e.bossDir ?? 1) * 1.8
        if (e.x > BASE_W - e.w / 2 - 20 || e.x < e.w / 2 + 20) {
          e.bossDir = -(e.bossDir ?? 1)
          e.x = Math.max(e.w / 2 + 20, Math.min(BASE_W - e.w / 2 - 20, e.x))
        }
        break
      }
      case 'sine': {
        e.x = BASE_W / 2 + Math.sin(e.bossTimer! / 900) * (BASE_W / 2 - e.w / 2 - 20) * speedBoost
        break
      }
      case 'hover': {
        // 在玩家正上方悬停，缓慢跟踪
        const tx = this.playerX
        e.x += (tx - e.x) * 0.008 * speedBoost
        e.x = Math.max(e.w / 2 + 10, Math.min(BASE_W - e.w / 2 - 10, e.x))
        break
      }
      case 'strafe': {
        // 横向扫射：停顿 + 快速移动
        if (e.bossTimer! % 2400 < 1200) {
          e.x += e.speed * speedBoost * 2.5 * (e.bossDir ?? 1)
          if (e.x > BASE_W - e.w / 2 - 20 || e.x < e.w / 2 + 20) {
            e.bossDir = -(e.bossDir ?? 1)
          }
        }
        break
      }
      case 'charge': {
        // 快速冲向玩家，然后退回
        if (e.bossTimer! % 3000 < 400) {
          const dx = this.playerX - e.x; const dy = this.playerY - e.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          e.x += (dx / dist) * 4 * speedBoost
          e.y += (dy / dist) * 2 * speedBoost
          e.y = Math.max(targetY * 0.5, Math.min(targetY * 1.4, e.y))
        } else if (e.bossTimer! % 3000 < 700) {
          e.y += (targetY - e.y) * 0.08
        }
        e.x = Math.max(e.w / 2 + 10, Math.min(BASE_W - e.w / 2 - 10, e.x))
        break
      }
    }

    // --- Boss 增强技能 ---
    // 护盾技能
    if (bossCfg.hasShield) {
      e.bossShieldTimer = (e.bossShieldTimer ?? 0) - dt
      // 自动释放护盾
      if (e.bossShieldTimer <= 0 && !e.bossHasShield) {
        const cooldown = bossCfg.shieldCooldown ?? 8000
        // 愤怒时护盾持续更久
        const shieldDuration = enraged ? 4000 : 2500
        e.bossHasShield = true
        e.bossShieldTimer = shieldDuration + cooldown
        this.floatTexts.push({ text: '🛡️ 护盾激活!', x: e.x, y: e.y - 30, life: 1.0, color: '#00BCD4', size: 16, vy: -1.5, scale: 1 })
        this.addShockwave(e.x, e.y, 40, '#00BCD4')
      }
      // 护盾持续时间结束
      const shieldCooldown = bossCfg.shieldCooldown ?? 8000
      if (e.bossHasShield && e.bossShieldTimer <= shieldCooldown) {
        e.bossHasShield = false
        this.floatTexts.push({ text: '护盾消失', x: e.x, y: e.y - 30, life: 0.8, color: '#FF9800', size: 14, vy: -1.2, scale: 1 })
      }
    }

    // 躲避技能
    if (bossCfg.hasDodge && !e.bossHasShield) {
      const chance = bossCfg.dodgeChance ?? 0.15
      // 愤怒时躲避概率提升
      const dodgeChance = enraged ? chance * 1.5 : chance
      if (Math.random() < dodgeChance * dt * 0.001) {
        // 随机向两侧闪避
        const dodgeDir = Math.random() > 0.5 ? 1 : -1
        e.x += dodgeDir * 60
        e.x = Math.max(e.w / 2 + 10, Math.min(BASE_W - e.w / 2 - 10, e.x))
        this.explode(e.x, e.y, '#4CAF50', 15, 3)
      }
    }

    // 爆发技能
    if (bossCfg.hasBurst) {
      e.bossBurstTimer = (e.bossBurstTimer ?? 0) - dt
      // 愤怒时自动触发爆发
      if (enraged && e.bossBurstTimer <= 0 && !e.bossHasShield) {
        e.bossBurstTimer = 12000 // 12秒冷却
        // 爆发状态持续3秒
        const burstDuration = 3000
        const burstEndTime = Date.now() + burstDuration
        
        this.floatTexts.push({ text: '💥 爆发模式!', x: e.x, y: e.y - 30, life: 1.5, color: '#FF4444', size: 18, vy: -1.5, scale: 1.3 })
        this.addShockwave(e.x, e.y, 60, '#FF4444')
        this.screenFlash = 0.2; this.shakeAmt = 4
        
        // 爆发期间提升攻击速度
        shootSpeedBoost = 2.5
      }
    }

    // --- 攻击逻辑 ---
    e.shootTimer -= dt * shootSpeedBoost
    if (e.shootTimer <= 0 && this.enemyBullets.length < MAX_ENEMY_BULLETS) {
      const spd = 4.5 + this.difficulty * 0.5  // 更快的子弹速度
      const bossId = e.bossId ?? 1
      switch (bossCfg.attackMode) {
        case 'aimed': {
          // Lv1：3 发瞄准 + 2 侧向弹，愤怒时 5 发扇形
          const dx = this.playerX - e.x; const dy = this.playerY - e.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const count = enraged ? 5 : 3
          for (let k = 0; k < count; k++) {
            const spread = (k - Math.floor(count / 2)) * 0.15
            const ang = Math.atan2(dy, dx) + spread
            // 修正：确保子弹朝向玩家方向（vy应为正，因为玩家在下方）
            this.enemyBullets.push({ x: e.x, y: e.y + e.h / 2, vx: Math.cos(ang) * spd, vy: Math.abs(Math.sin(ang)) * spd, color: e.color })
          }
          // 侧边固定弹
          this.enemyBullets.push({ x: e.x - e.w / 2, y: e.y, vx: -1.5, vy: spd * 0.8, color: e.color })
          this.enemyBullets.push({ x: e.x + e.w / 2, y: e.y, vx: 1.5, vy: spd * 0.8, color: e.color })
          break
        }
        case 'spread': {
          // Lv2：宽扇 5/7 发 + 直线单发
          const count = enraged ? 7 : 5
          for (let k = 0; k < count; k++) {
            const ang = -Math.PI / 2 + (k - Math.floor(count / 2)) * 0.22
            // 修正：确保子弹向下发射（vy应为正）
            this.enemyBullets.push({ x: e.x, y: e.y + e.h / 2, vx: Math.cos(ang) * spd, vy: Math.abs(Math.sin(ang)) * spd, color: e.color })
          }
          // 额外直射
          this.enemyBullets.push({ x: e.x, y: e.y + e.h / 2, vx: 0, vy: spd * 1.2, color: e.color })
          break
        }
        case 'barrage': {
          // Lv4/Lv9：大扇形弹幕，愤怒时同时发两排
          const count = enraged ? 9 : 6
          for (let k = 0; k < count; k++) {
            const ang = -Math.PI / 2 + (k - Math.floor(count / 2)) * 0.2
            // 修正：确保子弹向下发射（vy应为正）
            this.enemyBullets.push({ x: e.x, y: e.y + e.h / 2, vx: Math.cos(ang) * (spd + 0.8), vy: Math.abs(Math.sin(ang)) * (spd + 0.8), color: e.color })
          }
          if (enraged) {
            // 第二排偏移子弹
            for (let k = 0; k < 4; k++) {
              const ang = -Math.PI / 2 + (k - 1.5) * 0.35
              this.enemyBullets.push({ x: e.x, y: e.y + e.h / 2, vx: Math.cos(ang) * spd * 1.3, vy: Math.abs(Math.sin(ang)) * spd * 1.3, color: e.color })
            }
          }
          // Lv9 额外特效：同时召唤更多小兵
          if (bossId === 9) {
            const spawnCount = enraged ? 4 : 2
            for (let m = 0; m < spawnCount; m++)
              this.enemies.push({ x: e.x + (m - 1.5) * 45, y: e.y + e.h, w: 22, h: 20, hp: 2 + (enraged ? 1 : 0), maxHp: 2 + (enraged ? 1 : 0), score: 10, color: e.color, shape: 'circle', speed: 1.6, shootTimer: 2000 })
          }
          break
        }
        case 'spiral': {
          // Lv5：每次射出旋转螺旋弹，愤怒时双螺旋
          const arms = enraged ? 3 : 2
          const bulletsPerArm = enraged ? 5 : 4
          const baseAngle = (e.bossTimer! / 180) % (Math.PI * 2)
          for (let arm = 0; arm < arms; arm++) {
            for (let k = 0; k < bulletsPerArm; k++) {
              const ang = baseAngle + (Math.PI * 2 / arms) * arm + k * 0.18
              const s = spd * (0.8 + k * 0.1)
              // 修正：确保子弹有向下的分量
              this.enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(ang) * s, vy: Math.abs(Math.sin(ang)) * s, color: e.color })
            }
          }
          break
        }
        case 'laser_sweep': {
          // Lv6：密集激光扫射 + 侧翼斜弹
          const count = enraged ? 8 : 5
          for (let k = 0; k < count; k++) {
            const ang = -Math.PI / 2 + (k - Math.floor(count / 2)) * 0.16
            // 修正：确保子弹向下发射（vy应为正）
            this.enemyBullets.push({ x: e.x, y: e.y + e.h / 2, vx: Math.cos(ang) * spd * 1.6, vy: Math.abs(Math.sin(ang)) * spd * 1.6, color: e.color })
          }
          // 双翼斜弹
          for (const side of [-1, 1]) {
            this.enemyBullets.push({ x: e.x + side * e.w * 0.4, y: e.y + e.h / 4, vx: side * spd * 0.6, vy: spd * 1.1, color: e.color })
            if (enraged) this.enemyBullets.push({ x: e.x + side * e.w * 0.4, y: e.y + e.h / 4, vx: side * spd * 1.1, vy: spd * 0.7, color: e.color })
          }
          break
        }
        case 'shockwave': {
          // Lv7：全方向环形 + 定期召唤，愤怒时双环
          const count = enraged ? 20 : 12
          for (let k = 0; k < count; k++) {
            const ang = (Math.PI * 2 / count) * k + (e.bossTimer! / 500)
            // 修正：确保子弹有向下的分量
            this.enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(ang) * spd, vy: Math.abs(Math.sin(ang)) * spd, color: e.color })
          }
          if (enraged) {
            const inner = 8
            for (let k = 0; k < inner; k++) {
              const ang = (Math.PI * 2 / inner) * k + (e.bossTimer! / 300)
              this.enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(ang) * spd * 0.6, vy: Math.abs(Math.sin(ang)) * spd * 0.6, color: e.color })
            }
          }
          // 每2次攻击召唤小兵（愤怒时每次召唤更多）
          if (this.enemies.length < 16 && Math.random() < (enraged ? 0.8 : 0.5)) {
            const cnt = enraged ? 3 : 2
            for (let m = 0; m < cnt; m++)
              this.enemies.push({ x: e.x + (Math.random() - 0.5) * 100, y: e.y + e.h, w: 22, h: 20, hp: 1 + (enraged ? 1 : 0), maxHp: 1 + (enraged ? 1 : 0), score: 10, color: e.color, shape: 'diamond', speed: 2.0, shootTimer: 1500 })
          }
          this.addShockwave(e.x, e.y, 50, e.color)
          break
        }
        case 'homing': {
          // Lv8：追踪弹 + 横向扫弹，愤怒时加速追踪
          const dx = this.playerX - e.x; const dy = this.playerY - e.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const homingSpd = enraged ? spd * 1.4 : spd * 1.1
          const count = enraged ? 4 : 3
          for (let k = 0; k < count; k++) {
            const off = (k - Math.floor(count / 2)) * 14
            // 修正：确保追踪弹正确朝向玩家（dy应为正，因为玩家在下方）
            this.enemyBullets.push({ x: e.x + off, y: e.y + e.h / 2, vx: (dx / dist) * homingSpd, vy: Math.abs(dy / dist) * homingSpd, color: e.color })
          }
          // 横向扫射弹
          for (const side of [-1, 1]) {
            this.enemyBullets.push({ x: e.x + side * e.w * 0.5, y: e.y, vx: side * spd * 1.2, vy: spd * 0.4, color: e.color })
            if (enraged) this.enemyBullets.push({ x: e.x + side * e.w * 0.3, y: e.y + 10, vx: side * spd * 0.8, vy: spd * 0.8, color: e.color })
          }
          break
        }
      }

      // Boss释放敌人：每次攻击都有概率召唤小兵，关卡越高召唤越多
      if (this.enemies.length < 20) {
        const spawnChance = enraged ? 0.6 : 0.35
        const spawnCount = 1 + Math.floor(bossId / 3) + (enraged ? 1 : 0)
        if (Math.random() < spawnChance) {
          for (let m = 0; m < spawnCount; m++) {
            this.enemies.push({
              x: e.x + (Math.random() - 0.5) * 70,
              y: e.y + e.h + Math.random() * 20,
              w: 20, h: 18, hp: 1 + Math.floor(bossId / 4),
              maxHp: 1 + Math.floor(bossId / 4),
              score: 8 + bossId * 2,
              color: e.color,
              shape: Math.random() < 0.3 ? 'diamond' : 'circle',
              speed: 1.6 + Math.random() * 0.8 + bossId * 0.05,
              shootTimer: 2000 + Math.random() * 1000
            })
          }
        }
      }

      e.shootTimer = bossCfg.shootInterval / shootSpeedBoost + Math.random() * 200
    }

    // 碰撞检测
    if (this.invincible <= 0 && this.shieldTimer <= 0 && this.rectCollide(this.playerX - PLAYER_W / 2, this.playerY - PLAYER_H / 2, PLAYER_W, PLAYER_H, e.x - e.w / 2, e.y - e.h / 2, e.w, e.h)) {
      this.playerHP--; this.invincible = 4; this.shakeAmt = 3; this.screenFlash = 0.2; this.damageFlash = 0.3; this.combo = 0
      this.explode(this.playerX, this.playerY, '#FF4757', 20, 5)
      audioService.pop()
      this.floatTexts.push({ text: '-1 ❤️', x: this.playerX, y: this.playerY - 30, life: 1.0, color: '#FF4757', size: 20, vy: -1.5, scale: 1.3 })
      if (this.playerHP <= 0) {
        this.onPlayerDeath()
      }
    }
  }

  // === 更新道具 ===
  private updatePowerups(dt: number) {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i]
      // 移动道具
      p.x += p.vx
      p.y += p.vy
      // 边缘反弹
      if (p.x <= SAFE_L || p.x >= BASE_W - SAFE_R) {
        p.vx *= -0.8
        p.x = Math.max(SAFE_L, Math.min(p.x, BASE_W - SAFE_R))
      }
      if (p.y <= SAFE_T || p.y >= BASE_H - SAFE_B) {
        p.vy *= -0.8
        p.y = Math.max(SAFE_T, Math.min(p.y, BASE_H - SAFE_B))
      }
      p.life -= dt / 1000
      if (p.y > BASE_H + 20 || p.life <= 0) { this.powerups.splice(i, 1); continue }
      const dx = this.playerX - p.x; const dy = this.playerY - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 30) { this.usePowerupImmediately(p.type); this.powerups.splice(i, 1); continue }
      // 消失前5秒闪烁提示
      if (p.life < 5 && Math.floor(p.life * 10) % 2 === 0) continue
    }
  }

  // === 更新粒子（从渲染器移入，避免渲染时做状态更新） ===
  private updateParticles() {
    let writeIdx = 0
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]
      p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life -= 0.025
      if (p.life > 0) { this.particles[writeIdx++] = p }
    }
    if (writeIdx < this.particles.length) this.particles.length = writeIdx
  }

  // === 更新冲击波（从渲染器移入） ===
  private updateShockwaves() {
    let writeIdx = 0
    for (let i = 0; i < this.shockwaves.length; i++) {
      const sw = this.shockwaves[i]
      sw.radius += (sw.maxRadius - sw.radius) * 0.12
      sw.life -= 0.035
      if (sw.life > 0) { this.shockwaves[writeIdx++] = sw }
    }
    if (writeIdx < this.shockwaves.length) this.shockwaves.length = writeIdx
  }

  // === 更新浮动文字（从渲染器移入） ===
  private updateFloatTexts() {
    let writeIdx = 0
    for (let i = 0; i < this.floatTexts.length; i++) {
      const ft = this.floatTexts[i]
      ft.y += ft.vy; ft.life -= 0.03
      if (ft.life > 0) { this.floatTexts[writeIdx++] = ft }
    }
    if (writeIdx < this.floatTexts.length) this.floatTexts.length = writeIdx
  }

  // === 导弹系统 ===
  private activateMissileMode() {
    this.missileActive = true
    this.missileTimer = 0
    // 根据等级决定导弹数量
    this.missileCount = Math.min(5, 1 + Math.floor(this.currentStage / 2))
    // 立即发射一轮导弹
    this.fireMissiles()
  }

  private fireMissiles() {
    if (!this.missileActive) return
    
    const count = this.missileCount
    
    // 如果有敌人，优先瞄准敌人
    if (this.enemies.length > 0) {
      // 优先瞄准Boss
      const bossEnemy = this.enemies.find(e => e.bossId !== undefined)
      const target = bossEnemy || this.enemies[Math.floor(Math.random() * this.enemies.length)]
      
      for (let i = 0; i < count; i++) {
        const spread = (i - Math.floor(count / 2)) * 30
        this.missiles.push({
          x: this.playerX + spread,
          y: this.playerY - 20,
          vx: 0,
          vy: 0,
          targetX: target.x + (Math.random() - 0.5) * 40,
          targetY: target.y,
          damage: 5 + this.currentStage,
          radius: 40 + this.currentStage * 3
        })
      }
    } else {
      // 没有敌人时，向屏幕上方发射
      for (let i = 0; i < count; i++) {
        const spread = (i - Math.floor(count / 2)) * 30
        this.missiles.push({
          x: this.playerX + spread,
          y: this.playerY - 20,
          vx: 0,
          vy: 0,
          targetX: BASE_W / 2 + (Math.random() - 0.5) * 200,
          targetY: 100 + Math.random() * 100,
          damage: 5 + this.currentStage,
          radius: 40 + this.currentStage * 3
        })
      }
    }
  }

  private updateMissiles(dt: number) {
    // 导弹发射计时
    if (this.missileActive) {
      this.missileTimer -= dt
      if (this.missileTimer <= 0) {
        this.missileTimer = 3000 // 3秒间隔
        this.fireMissiles()
      }
    }
    
    // 更新导弹位置
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i]
      
      // 追踪目标
      const dx = m.targetX - m.x
      const dy = m.targetY - m.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist > 5) {
        const speed = 8
        m.vx += (dx / dist) * 0.3
        m.vy += (dy / dist) * 0.3
        
        // 限制速度
        const currentSpeed = Math.sqrt(m.vx * m.vx + m.vy * m.vy)
        if (currentSpeed > speed) {
          m.vx = (m.vx / currentSpeed) * speed
          m.vy = (m.vy / currentSpeed) * speed
        }
        
        m.x += m.vx
        m.y += m.vy
      } else {
        // 导弹命中目标，爆炸
        this.explode(m.x, m.y, '#FF9800', m.radius, 8)
        this.addShockwave(m.x, m.y, m.radius, '#FF9800')
        
        // 范围伤害
        for (const e of this.enemies) {
          const edx = e.x - m.x
          const edy = e.y - m.y
          const eDist = Math.sqrt(edx * edx + edy * edy)
          if (eDist < m.radius) {
            e.hp -= m.damage
            this.explode(e.x, e.y, '#FFD700', 10, 3)
          }
        }
        
        this.missiles.splice(i, 1)
      }
      
      // 移除超出屏幕的导弹
      if (m.y < -50 || m.y > BASE_H + 50 || m.x < -50 || m.x > BASE_W + 50) {
        this.missiles.splice(i, 1)
      }
    }
  }

  // === 闪电球系统 ===
  private activateLightningBallMode() {
    this.lightningBallActive = true
    this.lightningBallTimer = 0
    // 立即生成闪电球
    this.spawnLightningBall()
    // 设置15秒后关闭
    setTimeout(() => {
      this.lightningBallActive = false
    }, 15000)
  }

  private spawnLightningBall() {
    const colors = ['#FFD700', '#00E5FF', '#FF4081', '#4CAF50']
    const color = colors[Math.floor(Math.random() * colors.length)]
    const angle = Math.random() * Math.PI * 2
    const speed = 3 + Math.random() * 2
    
    this.lightningBalls.push({
      x: this.playerX,
      y: this.playerY - 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      damage: 3 + this.currentStage,
      life: 8000, // 每个闪电球存活8秒
      size: 12 + Math.random() * 6,
      color: color
    })
  }

  private updateLightningBalls(dt: number) {
    // 生成新闪电球
    if (this.lightningBallActive) {
      this.lightningBallTimer -= dt
      if (this.lightningBallTimer <= 0) {
        this.lightningBallTimer = 1500 // 1.5秒生成一个
        this.spawnLightningBall()
      }
    }
    
    // 更新闪电球位置
    for (let i = this.lightningBalls.length - 1; i >= 0; i--) {
      const lb = this.lightningBalls[i]
      
      // 随机改变方向
      if (Math.random() < 0.02) {
        const angle = Math.random() * Math.PI * 2
        const speed = Math.sqrt(lb.vx * lb.vx + lb.vy * lb.vy)
        lb.vx = Math.cos(angle) * speed
        lb.vy = Math.sin(angle) * speed
      }
      
      lb.x += lb.vx
      lb.y += lb.vy
      lb.life -= dt
      
      // 边缘反弹
      if (lb.x <= SAFE_L || lb.x >= BASE_W - SAFE_R) {
        lb.vx *= -0.9
        lb.x = Math.max(SAFE_L, Math.min(lb.x, BASE_W - SAFE_R))
      }
      if (lb.y <= SAFE_T || lb.y >= BASE_H - SAFE_B) {
        lb.vy *= -0.9
        lb.y = Math.max(SAFE_T, Math.min(lb.y, BASE_H - SAFE_B))
      }
      
      // 检测与敌人碰撞
      for (const e of this.enemies) {
        const dx = e.x - lb.x
        const dy = e.y - lb.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < e.w / 2 + lb.size / 2) {
          e.hp -= lb.damage
          this.explode(e.x, e.y, lb.color, 15, 5)
          // 闪电球继续移动不消失
        }
      }
      
      // 移除过期的闪电球
      if (lb.life <= 0) {
        this.explode(lb.x, lb.y, lb.color, lb.size * 2, 4)
        this.lightningBalls.splice(i, 1)
      }
    }
  }

  // === 更新敌弹 ===
  private updateEnemyBullets() {
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i]
      b.x += b.vx || 0; b.y += b.vy
      if (b.y > BASE_H + 10 || b.x < -10 || b.x > BASE_W + 10) { this.enemyBullets.splice(i, 1); continue }
      let destroyed = false
      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const pb = this.bullets[j]
        const dx = pb.x - b.x; const dy = pb.y - b.y
        if (dx * dx + dy * dy > 1600) continue  // 距离快速排除（>40px 免碰撞检测）
        if (this.rectCollide(pb.x - 3, pb.y - 5, 6, 10, b.x - 4, b.y - 6, 8, 12)) {
          this.bullets.splice(j, 1); this.enemyBullets.splice(i, 1)
          this.explode((pb.x + b.x) / 2, (pb.y + b.y) / 2, '#FFD700', 8, 3)
          audioService.click(); destroyed = true; break
        }
      }
      if (destroyed) continue
      if (this.invincible <= 0 && this.shieldTimer <= 0 && this.rectCollide(b.x - 3, b.y - 5, 6, 10, this.playerX - PLAYER_W / 2, this.playerY - PLAYER_H / 2, PLAYER_W, PLAYER_H)) {
        this.playerHP--; this.invincible = 3; this.shakeAmt = 1; this.screenFlash = 0.15; this.damageFlash = 0.3; this.combo = 0
        this.explode(this.playerX, this.playerY, '#FF4757', 15, 4)
        audioService.pop()
        this.floatTexts.push({ text: '-1 ❤️', x: this.playerX, y: this.playerY - 30, life: 1.0, color: '#FF4757', size: 20, vy: -1.5, scale: 1.3 })
        this.enemyBullets.splice(i, 1)
        if (this.playerHP <= 0) {
          this.onPlayerDeath()
          return
        }
      }
    }
  }

  // === 计时器 ===
  private updateTimers(dt: number) {
    if (this.invincible > 0) this.invincible -= dt / 1000
    if (this.shieldTimer > 0) this.shieldTimer -= dt / 1000
    this.stepBuffTimers('tripleShot', dt)
    this.stepBuffTimers('spreadShot', dt)
    this.stepBuffTimers('rapidShot', dt)
    this.stepBuffTimers('laserShot', dt)
    this.stepBuffTimers('pierceShot', dt)
    this.stepBuffTimers('lightningShot', dt)
    if (this.comboTimer > 0) { this.comboTimer -= dt / 1000; if (this.comboTimer <= 0) this.combo = 0 }
    if (this.shakeAmt > 0) this.shakeAmt *= 0.82
    if (this.shakeAmt < 0.1) this.shakeAmt = 0
    if (this.screenFlash > 0) this.screenFlash -= dt / 1000 * 2.5
    if (this.damageFlash > 0) this.damageFlash -= dt / 1000 * 2
    
    // 变身系统计时器
    if (this.transform) {
      this.transform.duration -= dt
      if (this.transform.duration <= 0) {
        this.endTransform()
      }
    }
    if (this.transformCooldown > 0) {
      this.transformCooldown -= dt
    }
  }

  // === 变身系统 ===
  private startTransform(type: TransformType) {
    const config = TRANSFORM_CONFIGS[type]
    if (!config) return
    
    this.transform = {
      type,
      duration: config.duration,
      maxDuration: config.duration,
      level: this.currentStage
    }
    
    // 添加变身特效
    this.screenFlash = 0.3
    this.shakeAmt = 2
    
    // 变身动画粒子效果
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2
      const s = Math.random() * 6 + 3
      this.particles.push({
        x: this.playerX + (Math.random() - 0.5) * 60,
        y: this.playerY + (Math.random() - 0.5) * 60,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 1,
        color: config.color,
        size: Math.random() * 5 + 3
      })
    }
    
    // 添加变身提示文字
    this.floatTexts.push({
      text: `${config.icon} ${config.name} 激活!`,
      x: BASE_W / 2,
      y: BASE_H / 2 - 40,
      life: 2.5,
      color: config.color,
      size: 24,
      vy: -0.6,
      scale: 1.5
    })
    this.floatTexts.push({
      text: config.description,
      x: BASE_W / 2,
      y: BASE_H / 2 - 10,
      life: 2.0,
      color: config.accentColor,
      size: 14,
      vy: -0.4,
      scale: 1
    })
    
    audioService.win()
  }

  private endTransform() {
    if (!this.transform) return
    
    const config = TRANSFORM_CONFIGS[this.transform.type]
    
    // 变身结束特效
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2
      const s = Math.random() * 4 + 2
      this.particles.push({
        x: this.playerX,
        y: this.playerY,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 1,
        color: config.color,
        size: Math.random() * 4 + 2
      })
    }
    
    // 设置冷却时间
    this.transformCooldown = config.cooldown
    this.transform = null
    
    this.floatTexts.push({
      text: '变身结束',
      x: BASE_W / 2,
      y: BASE_H / 2,
      life: 1.5,
      color: '#FF4444',
      size: 20,
      vy: -0.5,
      scale: 1
    })
  }
  
  // 等级变身：升级时自动触发
  private triggerLevelTransform() {
    const level = this.currentStage
    
    // 3级开始解锁变身
    if (level < 3) return
    
    // 根据等级选择变身类型
    const transformType = this.getTransformTypeByLevel()
    this.startTransform(transformType)
  }
  
  // 根据等级获取变身类型（保留用于特殊情况）
  private getTransformTypeByLevel(): TransformType {
    const level = this.currentStage
    if (level >= 10) {
      return 'super' // 超级形态
    } else if (level >= 9) {
      return 'dark' // 暗影形态
    } else if (level >= 7) {
      return 'lightning' // 雷电形态
    } else if (level >= 5) {
      return 'ice' // 冰霜形态
    } else {
      return 'fire' // 3级解锁烈焰形态
    }
  }

  // 随机获取变身类型（道具使用）
  private getRandomTransformType(): TransformType {
    const types: TransformType[] = ['fire', 'ice', 'lightning', 'dark', 'super']
    const level = this.currentStage
    
    // 根据等级解锁不同形态
    let availableTypes = types
    if (level < 3) availableTypes = ['fire']
    else if (level < 5) availableTypes = ['fire', 'ice']
    else if (level < 7) availableTypes = ['fire', 'ice', 'lightning']
    else if (level < 9) availableTypes = ['fire', 'ice', 'lightning', 'dark']
    
    return availableTypes[Math.floor(Math.random() * availableTypes.length)]
  }

  private getTransformDamageMultiplier(): number {
    if (!this.transform) return 1
    return TRANSFORM_CONFIGS[this.transform.type].damage
  }

  private getTransformBulletSpeed(): number {
    if (!this.transform) return 1
    return TRANSFORM_CONFIGS[this.transform.type].bulletSpeed
  }

  private getTransformFireRateMultiplier(): number {
    if (!this.transform) return 1
    return TRANSFORM_CONFIGS[this.transform.type].fireRate
  }

  private getTransformBulletCount(): number {
    if (!this.transform) return 1
    return TRANSFORM_CONFIGS[this.transform.type].bulletCount
  }

  private stepBuffTimers(buffKey: string, dt: number) {
    const timers = this.getBuffTimers(buffKey)
    if (timers.length === 0) return
    for (let i = timers.length - 1; i >= 0; i--) {
      timers[i] -= dt
      if (timers[i] <= 0) {
        timers.splice(i, 1)
        this.decBuffStack(buffKey)
      }
    }
    if (timers.length === 0) {
      this.setBuffField(buffKey, 0)
      this.setBuffStack(buffKey, 0)
    } else {
      this.setBuffField(buffKey, Math.max(...timers))
    }
  }

  private getBuffTimers(key: string): number[] {
    switch (key) {
      case 'tripleShot': return this.tripleShotTimers
      case 'spreadShot': return this.spreadShotTimers
      case 'rapidShot': return this.rapidShotTimers
      case 'laserShot': return this.laserShotTimers
      case 'pierceShot': return this.pierceShotTimers
      case 'lightningShot': return this.lightningShotTimers
      default: return []
    }
  }

  private decBuffStack(key: string) {
    switch (key) {
      case 'tripleShot': this.tripleStacks--; break
      case 'spreadShot': this.spreadStacks--; break
      case 'rapidShot': this.rapidStacks--; break
      case 'laserShot': this.laserStacks--; break
      case 'pierceShot': this.pierceStacks--; break
      case 'lightningShot': this.lightningStacks--; break
    }
  }

  private setBuffStack(key: string, v: number) {
    switch (key) {
      case 'tripleShot': this.tripleStacks = v; break
      case 'spreadShot': this.spreadStacks = v; break
      case 'rapidShot': this.rapidStacks = v; break
      case 'laserShot': this.laserStacks = v; break
      case 'pierceShot': this.pierceStacks = v; break
      case 'lightningShot': this.lightningStacks = v; break
    }
  }

  private setBuffField(key: string, v: number) {
    switch (key) {
      case 'tripleShot': this.tripleShot = v; break
      case 'spreadShot': this.spreadShot = v; break
      case 'rapidShot': this.rapidShot = v; break
      case 'laserShot': this.laserShot = v; break
      case 'pierceShot': this.pierceShot = v; break
      case 'lightningShot': this.lightningShot = v; break
    }
  }

  // === 结束 ===
  private onPlayerDeath() {
    this.isDying = true
    this.dieTimer = 1500
    if (this.respawnsLeft > 0) this.respawnsLeft--
    this.combo = 0
    this.shakeAmt = 4
    this.screenFlash = 0.5
    this.slowMo = 0.4
    this.slowMoFactor = 0.2

    // 第一阶段：大爆炸
    this.explode(this.playerX, this.playerY, '#FF4757', 40, 10)
    this.addShockwave(this.playerX, this.playerY, 80, '#FF4757')

    // 第二阶段：延时爆炸
    this.time.delayedCall(200, () => {
      if (!this.isDying) return
      this.explode(this.playerX - 30, this.playerY - 10, '#FF6B6B', 25, 7)
      this.addShockwave(this.playerX, this.playerY, 60, '#FF6B6B')
      this.shakeAmt = 4
    })

    // 第三阶段：核心爆炸
    this.time.delayedCall(450, () => {
      if (!this.isDying) return
      this.explode(this.playerX, this.playerY, '#FFFFFF', 30, 12)
      this.explode(this.playerX + 20, this.playerY - 15, '#FFD700', 20, 8)
      this.addShockwave(this.playerX, this.playerY, 60, '#FFD700')
      this.shakeAmt = 3
      this.screenFlash = 0.3
    })

    // 第四阶段：余烬
    this.time.delayedCall(800, () => {
      if (!this.isDying) return
      this.explode(this.playerX, this.playerY, '#FF9800', 15, 5)
    })

    audioService.pop()
  }

  private respawnPlayer() {
    this.playerHP = this.maxHP
    this.playerX = BASE_W / 2
    this.playerY = BASE_H - 55
    this.invincible = 8
    this.shakeAmt = 3
    this.screenFlash = 0.2

    // 从天而降光束
    for (let i = 0; i < 20; i++) {
      this.time.delayedCall(i * 30, () => {
        if (this.gameEnded) return
        const x = this.playerX + (Math.random() - 0.5) * 40
        const y = this.playerY - 200 + i * 12
        this.particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: 2 + Math.random(),
          life: 0.8,
          color: i % 3 === 0 ? '#FFD700' : '#FFFFFF',
          size: 2 + Math.random() * 3
        })
      })
    }

    // 落地爆发
    this.time.delayedCall(620, () => {
      if (this.gameEnded) return
      this.explode(this.playerX, this.playerY, '#FFD700', 30, 8)
      this.explode(this.playerX, this.playerY, '#FFFFFF', 20, 6)
      this.addShockwave(this.playerX, this.playerY, 60, '#FFD700')
      this.shakeAmt = 1
      this.screenFlash = 0.15
    })

    this.floatTexts.push({
      text: `⚡ 重启 ×${this.respawnsLeft}`,
      x: BASE_W / 2, y: this.playerY - 60,
      life: 1.5, color: '#FFD700', size: 18, vy: -1.0, scale: 1.2
    })
  }

  private doEnd() {
    const stats = {
      score: this.engine.getScore(),
      maxCombo: this.maxCombo,
      totalKills: this.totalKills,
      gameTime: Math.floor(this.elapsed),
      won: this.gameWon,
      level: this.getPowerupLevel(),
    }
    gameActions.gameOver({
      victory: this.gameWon,
      score: this.engine.getScore(),
      stats,
    })
  }

  // === 渲染 ===
  private renderToCanvas() {
    const s: SceneState = {
      ctx: this.ctx,
      gameEnded: this.gameEnded, gameWon: this.gameWon, gameStarted: this.gameStarted, isDying: this.isDying,
      shakeAmt: this.shakeAmt, screenFlash: this.screenFlash, damageFlash: this.damageFlash,
      difficulty: this.difficulty, combo: this.combo, totalKills: this.totalKills,
      playerX: this.playerX, playerY: this.playerY,
      playerHP: this.playerHP, maxHP: this.maxHP, invincible: this.invincible, shieldTimer: this.shieldTimer, respawnsLeft: this.respawnsLeft,
      stars: this.stars, enemies: this.enemies, bullets: this.bullets,
      enemyBullets: this.enemyBullets, particles: this.particles,
      shockwaves: this.shockwaves, floatTexts: this.floatTexts, powerups: this.powerups,
      turrets: this.turrets,
      tripleShot: this.tripleShot, tripleStacks: this.tripleStacks,
      spreadShot: this.spreadShot, spreadStacks: this.spreadStacks,
      rapidShot: this.rapidShot, rapidStacks: this.rapidStacks,
      laserShot: this.laserShot, laserStacks: this.laserStacks,
      pierceShot: this.pierceShot, pierceStacks: this.pierceStacks,
      lightningShot: this.lightningShot, lightningStacks: this.lightningStacks, lightningTimer: this.lightningTimer,
      transform: this.transform,
      transformCooldown: this.transformCooldown,
      getPlayerLevel: () => this.getPlayerLevel(),
      getPowerupLevel: () => this.getPowerupLevel(),
      getScore: () => this.engine.getScore(),
      isVictory: () => this.engine.isVictory(),
    }
    renderToCanvas(s)
  }
}