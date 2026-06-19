import type { GameEngine } from '../../services/gameEngine'
import { gameActions } from '../../platform/gameBridge'
import { audioService } from '../../services/audio'
import { ParticleSystem } from './ParticleSystem'
import { ComboSystem } from './ComboSystem'
import { Renderer } from './Renderer'
import type { Shooter, Projectile, MatchPosition, PowerupType, SpecialBubbleType } from './types'
import { applyCanvasMobileStyles, bindCanvasAimAndShoot } from '../../utils/canvasMobileUtils'
import { resolveGtrsCanvasStyle } from '../../utils/gtrsCanvasTheme'

interface LevelConfig {
  level: number
  name: string
  rows: number
  cols: number
  timeLimit: number
  bubbleColors: number
  powerupChance: number
  description: string
}

export class BubbleShooterGame {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private engine: GameEngine
  private onEnd: () => void
  
  // 游戏常量
  private readonly W = 400
  private readonly H = 600
  private COLS = 10
  private ROWS = 8
  private readonly BUBBLE_SIZE = 35
  private readonly SHOOTER_Y: number
  private readonly GTRS = resolveGtrsCanvasStyle('bubbleShooter', {
    primary: '#4ECDC4',
    background: '#0f0c29',
    backgroundDark: '#24243e',
    bgGradMid: '#302b63',
    text: '#FFFFFF',
    accent: '#FFD700',
    hudBg: 'rgba(15,25,45,0.85)',
    danger: '#FF4444',
    muted: '#666666',
    palette: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4ECDC4', '#4D96FF', '#FF69B4'],
  })
  private readonly COLORS = this.GTRS.palette
  
  // 关卡配置
  private readonly LEVELS: LevelConfig[] = [
    { level: 1, name: '新手入门', rows: 4, cols: 6, timeLimit: 60, bubbleColors: 3, powerupChance: 0.1, description: '简单的开始，熟悉游戏操作' },
    { level: 2, name: '初露锋芒', rows: 5, cols: 7, timeLimit: 55, bubbleColors: 3, powerupChance: 0.12, description: '增加一点难度' },
    { level: 3, name: '渐入佳境', rows: 5, cols: 8, timeLimit: 55, bubbleColors: 4, powerupChance: 0.15, description: '更多颜色选择' },
    { level: 4, name: '步步为营', rows: 6, cols: 8, timeLimit: 50, bubbleColors: 4, powerupChance: 0.18, description: '时间更加紧张' },
    { level: 5, name: '乘风破浪', rows: 6, cols: 9, timeLimit: 50, bubbleColors: 5, powerupChance: 0.2, description: '五种颜色挑战' },
    { level: 6, name: '激流勇进', rows: 7, cols: 9, timeLimit: 45, bubbleColors: 5, powerupChance: 0.22, description: '更高的挑战' },
    { level: 7, name: '巅峰对决', rows: 7, cols: 10, timeLimit: 45, bubbleColors: 6, powerupChance: 0.25, description: '全部六种颜色' },
    { level: 8, name: '极限挑战', rows: 8, cols: 10, timeLimit: 40, bubbleColors: 6, powerupChance: 0.28, description: '时间紧迫！' },
    { level: 9, name: '地狱模式', rows: 8, cols: 10, timeLimit: 35, bubbleColors: 6, powerupChance: 0.3, description: '真正的挑战开始' },
    { level: 10, name: '终极考验', rows: 8, cols: 10, timeLimit: 30, bubbleColors: 6, powerupChance: 0.35, description: '你能通过吗？' }
  ]
  
  // 当前关卡
  private currentLevel: number = 1
  private currentLevelConfig: LevelConfig
  private levelComplete: boolean = false
  private levelTransitioning: boolean = false
  private gameWon: boolean = false
  private levelCompleteTime: number = 0
  
  // 游戏状态
  private board: (number | null)[][] = []
  private specialBoard: (SpecialBubbleType | null)[][] = []
  private shooter: Shooter
  private projectile: Projectile | null = null
  private mouseX: number = 0
  private mouseY: number = 0
  private currentChargeTime: number = 0
  private currentPowerup: PowerupType | null = null
  private nextPowerup: PowerupType | null = null
  private isSlowMotion: boolean = false
  private slowMotionTimer: number = 0
  private isTimeFrozen: boolean = false
  private timeFreezeTimer: number = 0
  private isDoubleScore: boolean = false
  private doubleScoreTimer: number = 0
  
  // 系统模块
  private particleSystem: ParticleSystem
  private comboSystem: ComboSystem
  private renderer: Renderer
  
  // 游戏计时器
  private gameStartTime: number = 0
  private gameEnded: boolean = false

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, engine: GameEngine, onEnd: () => void) {
    this.canvas = canvas
    this.ctx = ctx
    this.engine = engine
    this.onEnd = onEnd
    
    // 设置canvas实际尺寸
    this.canvas.width = this.W
    this.canvas.height = this.H
    
    // 发射器位置（底部中央）
    this.SHOOTER_Y = this.H - 60
    
    // 初始化发射器
    this.shooter = {
      x: this.W / 2,
      y: this.SHOOTER_Y,
      color: 0,
      angle: -Math.PI / 2
    }
    
    // 初始化系统
    this.particleSystem = new ParticleSystem()
    this.comboSystem = new ComboSystem()
    this.currentLevelConfig = this.LEVELS[0]
    this.renderer = new Renderer(
      canvas, ctx, this.particleSystem, this.comboSystem,
      this.W, this.H, this.COLORS, this.BUBBLE_SIZE, 
      this.SHOOTER_Y, this.COLS, this.ROWS
    )
  }

  init() {
    this.loadLevel(this.currentLevel)
    this.setupEventListeners()
  }

  loadLevel(levelNum: number) {
    if (levelNum < 1 || levelNum > this.LEVELS.length) {
      return
    }
    
    this.currentLevel = levelNum
    this.currentLevelConfig = this.LEVELS[levelNum - 1]
    this.ROWS = this.currentLevelConfig.rows
    this.COLS = this.currentLevelConfig.cols
    this.levelComplete = false
    this.levelTransitioning = false
    this.gameEnded = false
    
    // 重置道具状态
    this.isSlowMotion = false
    this.isTimeFrozen = false
    this.isDoubleScore = false
    
    // 重置发射器和泡泡状态
    this.projectile = null
    this.shooter.color = this.getNextShooterColor()
    this.nextPowerup = null
    this.generatePowerup()
    this.currentPowerup = this.nextPowerup
    
    this.initBoard()
    this.gameStartTime = Date.now()
    
    this.engine.setMessage(`\u5173\u5361 ${levelNum}: ${this.currentLevelConfig.name}`)
    setTimeout(() => {
      this.engine.setMessage(this.currentLevelConfig.description)
    }, 2000)
    setTimeout(() => {
      this.engine.setMessage('')
    }, 4000)
  }

  update() {
    const now = Date.now()
    
    if (this.isSlowMotion) {
      this.slowMotionTimer -= 16
      if (this.slowMotionTimer <= 0) {
        this.isSlowMotion = false
        this.engine.setMessage('')
      }
    }
    
    if (this.isTimeFrozen) {
      this.timeFreezeTimer -= 16
      if (this.timeFreezeTimer <= 0) {
        this.isTimeFrozen = false
        this.engine.setMessage('')
      }
    }
    
    if (this.isDoubleScore) {
      this.doubleScoreTimer -= 16
      if (this.doubleScoreTimer <= 0) {
        this.isDoubleScore = false
        this.engine.setMessage('')
      }
    }
    
    if (this.projectile) {
      const speedMultiplier = this.isSlowMotion ? 0.3 : 1
      this.updateProjectile(speedMultiplier)
    }
    
    this.particleSystem.update()
    this.comboSystem.update()
    
    // 关卡过渡中不处理游戏逻辑
    if (this.levelTransitioning) {
      const elapsed = now - this.levelCompleteTime
      if (elapsed > 2500) {
        if (this.currentLevel < this.LEVELS.length) {
          this.loadLevel(this.currentLevel + 1)
        } else {
          this.gameEnded = true
          this.engine.setVictory(true)
          this.engine.setMessage('🎉 恭喜通关！')
          setTimeout(() => {
            this.finishWithPlatformResult(true)
          }, 3000)
        }
      }
      return
    }
    
    // 检查关卡完成
    if (!this.levelComplete && !this.gameEnded) {
      if (this.isBoardEmpty()) {
        this.completeLevel()
        return
      }
      
      if (!this.isTimeFrozen) {
        const elapsed = now - this.gameStartTime
        if (elapsed > this.currentLevelConfig.timeLimit * 1000) {
          this.gameEnded = true
          this.engine.setVictory(false)
          this.engine.setMessage('⏰ 时间到！游戏结束')
          setTimeout(() => {
            this.finishWithPlatformResult(false)
          }, 2000)
        }
      }
    }
  }

  render() {
    this.renderer.render(
      this.board,
      this.specialBoard,
      this.shooter,
      this.projectile,
      this.mouseX,
      this.mouseY,
      this.currentChargeTime,
      this.engine.getScore(),
      this.gameStartTime,
      this.currentLevelConfig.timeLimit * 1000,
      this.currentLevel,
      this.LEVELS.length,
      this.currentPowerup
    )
  }

  private isBoardEmpty(): boolean {
    for (let y = 0; y < this.ROWS; y++) {
      for (let x = 0; x < this.COLS; x++) {
        if (this.board[y]?.[x] !== null && this.board[y]?.[x] !== undefined) {
          return false
        }
      }
    }
    return true
  }

  private completeLevel() {
    this.levelComplete = true
    this.levelTransitioning = true
    this.levelCompleteTime = Date.now()
    
    if (this.currentLevel >= this.LEVELS.length) {
      this.gameWon = true
      gameActions.addScore(1000, this.W / 2, this.H / 2)
      this.engine.setMessage('🏆 通关成功！')
    } else {
      const bonusScore = Math.floor((this.currentLevelConfig.timeLimit * 1000 - (Date.now() - this.gameStartTime)) / 100)
      gameActions.addScore(500 + bonusScore, this.W / 2, this.H / 2)
      this.engine.setMessage(`\u2728 \u5173\u5361\u901A\u8FC7\uFF01\u8FDB\u5165\u4E0B\u4E00\u5173`)
    }
    
    audioService.win()
  }

  private initBoard() {
    this.board = []
    this.specialBoard = []
    const maxColor = Math.min(this.currentLevelConfig.bubbleColors, this.COLORS.length)
    const specialChance = Math.min(0.1 + this.currentLevel * 0.02, 0.25)
    
    const filledRows = Math.min(this.currentLevelConfig.rows - 2, 6)
    
    for (let y = 0; y < this.ROWS; y++) {
      this.board[y] = []
      this.specialBoard[y] = []
      for (let x = 0; x < this.COLS; x++) {
        // 底部两行留空，让玩家有空间发射泡泡
        if (y >= this.ROWS - 2) {
          this.board[y][x] = null
          this.specialBoard[y][x] = null
          continue
        }
        
        let color = Math.floor(Math.random() * maxColor)
        let specialType: SpecialBubbleType | null = null
        
        // 避免初始棋盘就有3个或更多相同颜色的泡泡连在一起
        const leftCount = this.countLeftMatches(y, x, color)
        const upCount = this.countUpMatches(y, x, color)
        
        if (leftCount >= 2 || upCount >= 2) {
          let newColor = Math.floor(Math.random() * maxColor)
          while (newColor === color && maxColor > 1) {
            newColor = Math.floor(Math.random() * maxColor)
          }
          color = newColor
        }
        
        // 随机生成特殊泡泡
        if (Math.random() < specialChance && y < filledRows - 2) {
          const specials: SpecialBubbleType[] = ['bomb', 'rainbow', 'sticky']
          specialType = specials[Math.floor(Math.random() * specials.length)]
        }
        
        this.board[y][x] = color
        this.specialBoard[y][x] = specialType
      }
    }
  }

  private countLeftMatches(row: number, col: number, color: number): number {
    let count = 0
    // 检查左边两个位置
    if (col >= 1 && this.board[row]?.[col - 1] === color) count++
    if (col >= 2 && this.board[row]?.[col - 2] === color) count++
    return count
  }

  private countUpMatches(row: number, col: number, color: number): number {
    let count = 0
    // 检查上边两个位置（考虑奇偶行偏移）
    if (row >= 1) {
      const prevCol = row % 2 === 0 ? col - 1 : col
      if (prevCol >= 0 && this.board[row - 1]?.[prevCol] === color) count++
    }
    if (row >= 2) {
      const prevCol = row % 2 === 0 ? col - 1 : col
      if (prevCol >= 0 && this.board[row - 2]?.[prevCol] === color) count++
    }
    // 检查正上方
    if (row >= 1 && this.board[row - 1]?.[col] === color) count++
    if (row >= 2 && this.board[row - 2]?.[col] === color) count++
    return count
  }

  private generatePowerup() {
    if (Math.random() < this.currentLevelConfig.powerupChance) {
      const powerups: PowerupType[] = ['color_bomb', 'clear_row', 'extra_shot', 'multishot', 'time_freeze', 'slow_motion', 'double_score']
      this.nextPowerup = powerups[Math.floor(Math.random() * powerups.length)]
    } else {
      this.nextPowerup = null
    }
  }

  private getNextShooterColor(): number {
    return Math.floor(Math.random() * Math.min(this.currentLevelConfig.bubbleColors, this.COLORS.length))
  }

  private unbindPointer: (() => void) | null = null

  private aimAt(mx: number, my: number, chargeTime: number = 0) {
    this.mouseX = mx
    this.mouseY = my
    this.currentChargeTime = chargeTime
    const dx = mx - this.shooter.x
    const dy = my - this.shooter.y
    this.shooter.angle = Math.atan2(dy, dx)
    if (this.shooter.angle > -0.1) this.shooter.angle = -0.1
    if (this.shooter.angle < -Math.PI + 0.1) this.shooter.angle = -Math.PI + 0.1
  }

  destroy(): void {
    this.teardownInput()
  }

  private finishWithPlatformResult(victory: boolean): void {
    if (this.gameEnded) return
    this.gameEnded = true
    this.teardownInput()
    gameActions.gameOver({
      victory,
      score: this.engine.getScore(),
      stats: { level: this.currentLevel },
    })
  }

  private teardownInput() {
    this.unbindPointer?.()
    this.unbindPointer = null
  }

  private setupEventListeners() {
    this.teardownInput()
    applyCanvasMobileStyles(this.canvas)
    this.unbindPointer = bindCanvasAimAndShoot(
      this.canvas,
      (x, y, chargeTime) => this.aimAt(x, y, chargeTime),
      (x, y, chargeTime) => {
        if (!this.gameEnded && !this.levelTransitioning) {
          this.aimAt(x, y, chargeTime)
          this.shoot(chargeTime)
        }
      },
    )
  }

  private shoot(chargeTime: number = 0) {
    if (this.projectile) return
    
    // 根据蓄力时间计算发射速度
    const minSpeed = 8
    const maxSpeed = 18
    const maxChargeTime = 2000 // 最大蓄力时间（毫秒）
    const chargeRatio = Math.min(chargeTime / maxChargeTime, 1)
    const speed = minSpeed + (maxSpeed - minSpeed) * chargeRatio
    
    // 重置蓄力时间
    this.currentChargeTime = 0
    
    // 发射时的触觉反馈（根据蓄力程度）
    this.triggerVibration(chargeRatio)
    
    this.projectile = {
      x: this.shooter.x,
      y: this.shooter.y - this.BUBBLE_SIZE / 2,
      vx: Math.cos(this.shooter.angle) * speed,
      vy: Math.sin(this.shooter.angle) * speed,
      color: this.shooter.color,
      powerup: this.currentPowerup
    }
    
    // 添加发射特效
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = 3 + Math.random() * 5
      this.particleSystem.addSparkle(
        this.shooter.x + Math.cos(angle) * dist,
        this.shooter.y + Math.sin(angle) * dist,
        this.COLORS[this.shooter.color],
        4
      )
    }
    
    // 道具泡泡特效
    if (this.currentPowerup) {
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2
        const dist = 5 + Math.random() * 8
        this.particleSystem.addSparkle(
          this.shooter.x + Math.cos(angle) * dist,
          this.shooter.y + Math.sin(angle) * dist,
          '#FFD700',
          5
        )
      }
    }
    
    audioService.click()
  }
  
  private triggerVibration(intensity: number) {
    if (!navigator.vibrate) return
    
    // 根据力度设置不同的震动模式
    if (intensity >= 1) {
      navigator.vibrate([30, 20, 30])  // 强烈震动
    } else if (intensity > 0.7) {
      navigator.vibrate(40)  // 中等震动
    } else if (intensity > 0.4) {
      navigator.vibrate(25)  // 轻微震动
    } else {
      navigator.vibrate(15)  // 微弱震动
    }
  }
  
  private triggerCollisionVibration() {
    if (!navigator.vibrate) return
    navigator.vibrate(20)  // 碰撞时轻微震动
  }

  private updateProjectile(speedMultiplier: number = 1) {
    if (!this.projectile) return

    // 添加阻尼效果，让泡泡飞行更自然
    const friction = 0.995
    this.projectile.vx *= friction
    this.projectile.vy *= friction
    
    this.projectile.x += this.projectile.vx * speedMultiplier
    this.projectile.y += this.projectile.vy * speedMultiplier

    // 添加飞行轨迹粒子（更密集）
    if (Math.random() > 0.4) {
      this.particleSystem.addTrail(
        this.projectile.x,
        this.projectile.y,
        this.COLORS[this.projectile.color]
      )
    }

    // 左右边界反弹（添加角度限制，避免无限反弹）
    if (this.projectile.x - this.BUBBLE_SIZE / 2 <= 0) {
      this.projectile.x = this.BUBBLE_SIZE / 2
      this.projectile.vx = Math.abs(this.projectile.vx) * 0.85
      if (this.projectile.vx < 2) this.projectile.vx = 2
      this.playBounceEffect(this.projectile.x, this.projectile.y)
    }
    if (this.projectile.x + this.BUBBLE_SIZE / 2 >= this.W) {
      this.projectile.x = this.W - this.BUBBLE_SIZE / 2
      this.projectile.vx = -Math.abs(this.projectile.vx) * 0.85
      if (Math.abs(this.projectile.vx) < 2) this.projectile.vx = -2
      this.playBounceEffect(this.projectile.x, this.projectile.y)
    }

    // 顶部反弹
    if (this.projectile.y - this.BUBBLE_SIZE / 2 <= 30) {
      this.projectile.y = this.BUBBLE_SIZE / 2 + 30
      this.projectile.vy = Math.abs(this.projectile.vy) * 0.85
      if (this.projectile.vy < 2) this.projectile.vy = 2
      this.playBounceEffect(this.projectile.x, this.projectile.y)
    }

    // 底部反弹
    if (this.projectile.y + this.BUBBLE_SIZE / 2 >= this.SHOOTER_Y) {
      this.projectile.y = this.SHOOTER_Y - this.BUBBLE_SIZE / 2
      this.projectile.vy = -Math.abs(this.projectile.vy) * 0.85
      if (Math.abs(this.projectile.vy) < 2) this.projectile.vy = -2
      this.playBounceEffect(this.projectile.x, this.projectile.y)
    }

    // 检测是否速度过慢（防止泡泡在原地抖动）
    const speed = Math.hypot(this.projectile.vx, this.projectile.vy)
    if (speed < 1.5) {
      // 找到最近的空位附着
      this.findNearestEmptyPosition()
      return
    }

    // 与已有的泡泡碰撞检测（优化：先检测附近的泡泡）
    const nearestBubble = this.findNearestBubble(this.projectile.x, this.projectile.y)
    if (nearestBubble) {
      const pos = this.renderer.getBubblePos(nearestBubble.col, nearestBubble.row)
      const dist = Math.hypot(this.projectile.x - pos.bx, this.projectile.y - pos.by)
      
      // 碰撞检测：两个泡泡半径之和（完整的碰撞距离）
      const collisionDist = this.BUBBLE_SIZE * 0.95
      if (dist < collisionDist) {
        // 添加强烈的碰撞特效
        this.playCollisionEffect(pos.bx, pos.by, this.projectile.color)
        // 碰撞时的触觉反馈
        this.triggerCollisionVibration()
        audioService.win()
        // 根据泡泡实际位置找到最佳附着位置
        this.attachBubbleAtPosition(nearestBubble.row, nearestBubble.col)
        return
      }
    }
  }
  
  private findNearestBubble(x: number, y: number): {row: number, col: number} | null {
    let nearest: {row: number, col: number} | null = null
    let minDist = Infinity
    const searchRadius = this.BUBBLE_SIZE * 2
    
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this.board[r]?.[c] === null || this.board[r]?.[c] === undefined) continue
        
        const pos = this.renderer.getBubblePos(c, r)
        const dist = Math.hypot(x - pos.bx, y - pos.by)
        
        if (dist < searchRadius && dist < minDist) {
          minDist = dist
          nearest = { row: r, col: c }
        }
      }
    }
    
    return nearest
  }

  private playCollisionEffect(x: number, y: number, color: number) {
    // 碰撞火花效果
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 4
      this.particleSystem.addParticle(
        x + Math.cos(angle) * 5,
        y + Math.sin(angle) * 5,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        this.COLORS[color],
        4 + Math.random() * 3,
        0.8
      )
    }
    
    // 添加白色闪光粒子
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 2
      this.particleSystem.addParticle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        '#fff',
        3 + Math.random() * 2,
        0.6
      )
    }
    
    // 添加碰撞时的短暂光晕效果
    this.particleSystem.addExplosion(x, y, this.COLORS[color], 15)
  }

  private playBounceEffect(x: number, y: number) {
    // 添加更强的反弹粒子效果
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 3 + Math.random() * 3
      this.particleSystem.addParticle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        '#fff',
        4 + Math.random() * 2,
        0.7
      )
    }
  }

  private attachBubble(hitRow?: number, hitCol?: number) {
    if (!this.projectile) return
    
    const hasPowerup = this.projectile.powerup
    const powerup = this.projectile.powerup
    
    // 处理道具泡泡效果
    if (hasPowerup) {
      const consumesBubble = ['color_bomb', 'clear_row', 'multishot'].includes(powerup!)
      
      this.usePowerup(powerup!)
      this.currentPowerup = null
      this.generatePowerup()
      
      if (consumesBubble) {
        this.projectile = null
        this.shooter.color = this.getNextShooterColor()
        return
      }
    }
    
    // 找到离泡泡最近的空位
    this.findNearestEmptyPosition()
  }

  private findAttachPosition(hitRow: number, hitCol: number) {
    if (!this.projectile) return
    
    const hasPowerup = this.projectile.powerup
    const powerup = this.projectile.powerup
    
    // 处理道具泡泡效果
    if (hasPowerup) {
      const consumesBubble = ['color_bomb', 'clear_row', 'multishot'].includes(powerup!)
      
      this.usePowerup(powerup!)
      this.currentPowerup = null
      this.generatePowerup()
      
      if (consumesBubble) {
        this.projectile = null
        this.shooter.color = this.getNextShooterColor()
        return
      }
    }
    
    // 找到离泡泡最近的空位
    this.findNearestEmptyPosition()
  }

  private getHexNeighbors(row: number, col: number): Array<{r: number, c: number}> {
    // 六边形网格的六个相邻位置
    if (row % 2 === 0) {
      // 偶数行：偏移向左
      return [
        { r: row - 1, c: col - 1 }, // 左上
        { r: row - 1, c: col },     // 右上
        { r: row, c: col - 1 },       // 左
        { r: row, c: col + 1 },       // 右
        { r: row + 1, c: col - 1 }, // 左下
        { r: row + 1, c: col },     // 右下
      ]
    } else {
      // 奇数行：偏移向右
      return [
        { r: row - 1, c: col },     // 左上
        { r: row - 1, c: col + 1 }, // 右上
        { r: row, c: col - 1 },       // 左
        { r: row, c: col + 1 },       // 右
        { r: row + 1, c: col },     // 左下
        { r: row + 1, c: col + 1 }, // 右下
      ]
    }
  }

  private findBestAttachPosition(neighbors: Array<{r: number, c: number}>): {r: number, c: number} | null {
    if (!this.projectile) return null
    
    const px = this.projectile.x
    const py = this.projectile.y
    
    let bestPos: {r: number, c: number} | null = null
    let bestDist = Infinity
    
    for (const n of neighbors) {
      if (n.r < 0 || n.r >= this.ROWS || n.c < 0 || n.c >= this.COLS) continue
      if (this.board[n.r]?.[n.c] !== null && this.board[n.r]?.[n.c] !== undefined) continue
      
      const pos = this.renderer.getBubblePos(n.c, n.r)
      const dist = Math.hypot(px - pos.bx, py - pos.by)
      
      // 优先选择距离最近的位置
      if (dist < bestDist) {
        bestDist = dist
        bestPos = n
      }
    }
    
    return bestPos
  }

  private findNearestEmptyPosition() {
    if (!this.projectile) return
    
    const px = this.projectile.x
    const py = this.projectile.y
    
    let bestRow = -1
    let bestCol = -1
    let bestDist = Infinity
    
    // 遍历所有格子，找到离泡泡当前位置最近的空位
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this.board[r]?.[c] === null || this.board[r]?.[c] === undefined) {
          const pos = this.renderer.getBubblePos(c, r)
          const dist = Math.hypot(px - pos.bx, py - pos.by)
          
          if (dist < bestDist) {
            bestDist = dist
            bestRow = r
            bestCol = c
          }
        }
      }
    }
    
    // 如果找到了空位
    if (bestRow >= 0 && bestCol >= 0) {
      this.board[bestRow][bestCol] = this.projectile.color
      this.processMatches(bestRow, bestCol)
      return
    }
    
    // 如果棋盘已满，游戏结束
    this.gameEnded = true
    this.engine.setVictory(false)
    this.engine.setMessage('💥 棋盘已满！游戏结束')
    setTimeout(() => {
      this.finishWithPlatformResult(false)
    }, 2000)
  }

  private hasSupport(row: number, col: number): boolean {
    // 最底部一行不需要支撑
    if (row === this.ROWS - 1) return true
    
    // 检查下方相邻位置是否有泡泡
    const neighbors = this.getHexNeighbors(row, col)
    for (const n of neighbors) {
      if (n.r > row && this.board[n.r]?.[n.c] !== null && this.board[n.r]?.[n.c] !== undefined) {
        return true
      }
    }
    return false
  }

  private attachBubbleAtPosition(hitRow: number, hitCol: number) {
    if (!this.projectile) return
    
    const hasPowerup = this.projectile.powerup
    const powerup = this.projectile.powerup
    
    // 处理道具泡泡效果
    if (hasPowerup) {
      const consumesBubble = ['color_bomb', 'clear_row', 'multishot'].includes(powerup!)
      
      this.usePowerup(powerup!)
      this.currentPowerup = null
      this.generatePowerup()
      
      if (consumesBubble) {
        this.projectile = null
        this.shooter.color = this.getNextShooterColor()
        return
      }
    }
    
    // 找到离泡泡最近的空位
    this.findNearestEmptyPosition()
  }

  private processMatches(row: number, col: number) {
    const projectileColor = this.projectile!.color
    const projectileX = this.projectile!.x
    const projectileY = this.projectile!.y
    const specialType = this.specialBoard[row]?.[col]
    
    let effectiveColor = projectileColor
    
    if (specialType === 'rainbow') {
      for (let c = 0; c < this.COLORS.length; c++) {
        const rainbowMatches = this.findMatches(row, col, c)
        if (rainbowMatches.length >= 2) {
          effectiveColor = c
          break
        }
      }
    }
    
    const matches = this.findMatches(row, col, effectiveColor)
      
    if (matches.length >= 3) {
      let baseScore = matches.length * 20
      const totalScore = this.comboSystem.addCombo(baseScore, projectileX, projectileY)
      
      const finalScore = this.isDoubleScore ? totalScore * 2 : totalScore
      gameActions.addScore(finalScore, projectileX, projectileY)
      audioService.win()
      
      matches.forEach((m) => {
        const pos = this.renderer.getBubblePos(m.col, m.row)
        const bubbleSpecial = this.specialBoard[m.row]?.[m.col]
        
        if (bubbleSpecial === 'bomb') {
          this.triggerBombExplosion(m.row, m.col)
        } else {
          this.particleSystem.addExplosion(pos.bx, pos.by, this.COLORS[effectiveColor], 20)
          this.particleSystem.addSparkle(pos.bx, pos.by, '#FFD700', 10)
        }
        
        this.board[m.row][m.col] = null
        this.specialBoard[m.row][m.col] = null
      })

      if (this.comboSystem.getCombo() >= 3) {
        this.engine.triggerRandomBuff()
      }

      setTimeout(() => {
        this.checkFloatingBubbles()
      }, 100)
    } else {
      this.comboSystem.resetCombo()
      audioService.click()
    }

    this.projectile = null
    this.currentPowerup = this.nextPowerup
    this.generatePowerup()
    this.shooter.color = this.getNextShooterColor()
  }

  private triggerBombExplosion(row: number, col: number) {
    const pos = this.renderer.getBubblePos(col, row)
    this.particleSystem.addExplosion(pos.bx, pos.by, '#FF4444', 30)
    
    let bombScore = 0
    const affected = []
    
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = row + dr
        const nc = col + dc
        if (nr >= 0 && nr < this.ROWS && nc >= 0 && nc < this.COLS) {
          if (this.board[nr][nc] !== null && this.board[nr][nc] !== undefined) {
            affected.push({ r: nr, c: nc })
            bombScore += 25
          }
        }
      }
    }
    
    affected.forEach(a => {
      const aPos = this.renderer.getBubblePos(a.c, a.r)
      this.particleSystem.addSparkle(aPos.bx, aPos.by, '#FFD700', 8)
      this.board[a.r][a.c] = null
      this.specialBoard[a.r][a.c] = null
    })
    
    const finalScore = this.isDoubleScore ? bombScore * 2 : bombScore
    gameActions.addScore(finalScore, pos.bx, pos.by)
  }

  private usePowerup(type: string) {
    switch (type) {
      case 'color_bomb':
        this.useColorBomb()
        break
      case 'clear_row':
        this.useClearRow()
        break
      case 'extra_shot':
        this.useExtraShot()
        break
      case 'multishot':
        this.useMultishot()
        break
      case 'time_freeze':
        this.useTimeFreeze()
        break
      case 'slow_motion':
        this.useSlowMotion()
        break
      case 'double_score':
        this.useDoubleScore()
        break
    }
  }

  private useColorBomb() {
    const targetColor = Math.floor(Math.random() * Math.min(this.currentLevelConfig.bubbleColors, this.COLORS.length))
    let bombCount = 0
    
    for (let y = 0; y < this.ROWS; y++) {
      for (let x = 0; x < this.COLS; x++) {
        if (this.board[y][x] === targetColor) {
          this.board[y][x] = null
          bombCount++
          const pos = this.renderer.getBubblePos(x, y)
          this.particleSystem.addExplosion(pos.bx, pos.by, this.COLORS[targetColor], 15)
        }
      }
    }
    
    this.engine.addScore(bombCount * 30, this.W / 2, this.H / 2)
    this.engine.setMessage('💣 颜色炸弹！')
    setTimeout(() => this.engine.setMessage(''), 1500)
    audioService.win()
  }

  private useClearRow() {
    let clearedBubbles = 0
    let clearedRow = -1
    
    for (let y = this.ROWS - 1; y >= 0; y--) {
      let hasBubble = false
      for (let x = 0; x < this.COLS; x++) {
        if (this.board[y][x] !== null) {
          hasBubble = true
          clearedRow = y
          break
        }
      }
      if (hasBubble) break
    }
    
    if (clearedRow >= 0) {
      for (let x = 0; x < this.COLS; x++) {
        if (this.board[clearedRow][x] !== null) {
          this.board[clearedRow][x] = null
          clearedBubbles++
          const pos = this.renderer.getBubblePos(x, clearedRow)
          this.particleSystem.addSparkle(pos.bx, pos.by, '#FFD700', 12)
        }
      }
    }
    
    this.engine.addScore(clearedBubbles * 20, this.W / 2, this.H / 2)
    this.engine.setMessage('🧹 清除行！')
    setTimeout(() => this.engine.setMessage(''), 1500)
    audioService.win()
  }

  private useExtraShot() {
    this.engine.addScore(50, this.W / 2, this.H / 2)
    this.engine.setMessage('⚡ 额外射击！')
    setTimeout(() => this.engine.setMessage(''), 1500)
    audioService.win()
  }

  private useMultishot() {
    const angle = this.shooter.angle
    const speed = 10
    
    setTimeout(() => {
      if (!this.projectile && !this.gameEnded) {
        this.projectile = {
          x: this.shooter.x,
          y: this.shooter.y - this.BUBBLE_SIZE / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: this.getNextShooterColor()
        }
      }
    }, 50)
    
    setTimeout(() => {
      if (!this.projectile && !this.gameEnded) {
        this.projectile = {
          x: this.shooter.x,
          y: this.shooter.y - this.BUBBLE_SIZE / 2,
          vx: Math.cos(angle + 0.15) * speed,
          vy: Math.sin(angle + 0.15) * speed,
          color: this.getNextShooterColor()
        }
      }
    }, 150)
    
    setTimeout(() => {
      if (!this.projectile && !this.gameEnded) {
        this.projectile = {
          x: this.shooter.x,
          y: this.shooter.y - this.BUBBLE_SIZE / 2,
          vx: Math.cos(angle - 0.15) * speed,
          vy: Math.sin(angle - 0.15) * speed,
          color: this.getNextShooterColor()
        }
      }
    }, 250)
    
    this.engine.addScore(100, this.W / 2, this.H / 2)
    this.engine.setMessage('🔫 三连射！')
    setTimeout(() => this.engine.setMessage(''), 1500)
    audioService.win()
  }

  private useTimeFreeze() {
    this.isTimeFrozen = true
    this.timeFreezeTimer = 5000
    this.engine.addScore(50, this.W / 2, this.H / 2)
    this.engine.setMessage('⏸️ 时间冻结！')
    audioService.win()
  }

  private useSlowMotion() {
    this.isSlowMotion = true
    this.slowMotionTimer = 4000
    this.engine.addScore(50, this.W / 2, this.H / 2)
    this.engine.setMessage('🐢 慢动作！')
    audioService.win()
  }

  private useDoubleScore() {
    this.isDoubleScore = true
    this.doubleScoreTimer = 8000
    this.engine.addScore(50, this.W / 2, this.H / 2)
    this.engine.setMessage('💎 双倍分数！')
    audioService.win()
  }

  private findMatches(row: number, col: number, color: number): MatchPosition[] {
    const matches: MatchPosition[] = []
    const visited = new Set<string>()
    const queue: MatchPosition[] = [{ row, col }]
    
    while (queue.length > 0) {
      const { row: r, col: c } = queue.shift()!
      const key = `${r},${c}`
      
      if (visited.has(key)) continue
      if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) continue
      
      const boardColor = this.board[r]?.[c]
      if (boardColor !== color) continue
      if (boardColor === null || boardColor === undefined) continue
      
      visited.add(key)
      matches.push({ row: r, col: c })
      
      const neighbors = r % 2 === 0
        ? [{ r: r - 1, c: c - 1 }, { r: r - 1, c: c }, { r, c: c - 1 }, { r, c: c + 1 }, { r: r + 1, c: c - 1 }, { r: r + 1, c: c }]
        : [{ r: r - 1, c: c }, { r: r - 1, c: c + 1 }, { r, c: c - 1 }, { r, c: c + 1 }, { r: r + 1, c: c }, { r: r + 1, c: c + 1 }]
      
      neighbors.forEach(n => queue.push({ row: n.r, col: n.c }))
    }
    
    return matches
  }

  private checkFloatingBubbles() {
    const floating = this.findFloating()
    if (floating.length > 0) {
      const bonus = floating.length * 30
      this.engine.addScore(bonus, this.W / 2, this.H / 2)
      this.comboSystem.addBonusScore(this.W / 2, this.H / 2, bonus, '漂浮')
      
      floating.forEach(f => {
        const pos = this.renderer.getBubblePos(f.col, f.row)
        this.particleSystem.addSparkle(pos.bx, pos.by, '#FFD700', 8)
        this.board[f.row][f.col] = null
      })
    }
  }

  private findFloating(): MatchPosition[] {
    const floating: MatchPosition[] = []
    const connected = new Set<string>()
    const queue: MatchPosition[] = []
    
    for (let x = 0; x < this.COLS; x++) {
      if (this.board[0]?.[x] !== null && this.board[0]?.[x] !== undefined) {
        queue.push({ row: 0, col: x })
      }
    }
    
    while (queue.length > 0) {
      const { row: r, col: c } = queue.shift()!
      const key = `${r},${c}`
      
      if (connected.has(key)) continue
      if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) continue
      if (this.board[r]?.[c] === null || this.board[r]?.[c] === undefined) continue
      
      connected.add(key)
      
      const neighbors = r % 2 === 0
        ? [{ r: r + 1, c: c - 1 }, { r: r + 1, c: c }, { r, c: c - 1 }, { r, c: c + 1 }, { r: r - 1, c: c - 1 }, { r: r - 1, c: c }]
        : [{ r: r + 1, c: c }, { r: r + 1, c: c + 1 }, { r, c: c - 1 }, { r, c: c + 1 }, { r: r - 1, c: c }, { r: r - 1, c: c + 1 }]
      
      neighbors.forEach(n => queue.push({ row: n.r, col: n.c }))
    }
    
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this.board[r]?.[c] !== null && this.board[r]?.[c] !== undefined) {
          if (!connected.has(`${r},${c}`)) {
            floating.push({ row: r, col: c })
          }
        }
      }
    }
    
    return floating
  }
}