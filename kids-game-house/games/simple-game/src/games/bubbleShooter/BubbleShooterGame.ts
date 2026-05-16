import type { GameEngine } from '../../services/gameEngine'
import { audioService } from '../../services/audio'
import { ParticleSystem } from './ParticleSystem'
import { ComboSystem } from './ComboSystem'
import { PowerupSystem } from './PowerupSystem'
import { Renderer } from './Renderer'
import { Shooter, Projectile, MatchPosition } from './types'

export class BubbleShooterGame {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private engine: GameEngine
  private onEnd: () => void
  
  // 游戏常量
  private readonly W = 400
  private readonly H = 600
  private readonly COLS = 10
  private readonly ROWS = 8
  private readonly BUBBLE_SIZE = 35
  private readonly SHOOTER_Y: number
  private readonly COLORS = [
    '#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCB77', '#4D96FF', '#FF69B4'
  ]
  private readonly GAME_DURATION = 90000
  
  // 游戏状态
  private board: (number | null)[][] = []
  private shooter: Shooter
  private projectile: Projectile | null = null
  private mouseX: number = 0
  
  // 系统模块
  private particleSystem: ParticleSystem
  private comboSystem: ComboSystem
  private powerupSystem: PowerupSystem
  private renderer: Renderer
  
  // 游戏计时器
  private gameStartTime: number = 0
  private gameEnded: boolean = false
  
  // 彩虹球状态
  private rainbowMode: boolean = false

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
    this.powerupSystem = new PowerupSystem()
    this.renderer = new Renderer(
      canvas, ctx, this.particleSystem, this.comboSystem,
      this.W, this.H, this.COLORS, this.BUBBLE_SIZE, 
      this.SHOOTER_Y, this.COLS, this.ROWS
    )
  }

  init() {
    this.initBoard()
    this.setupEventListeners()
    this.gameStartTime = Date.now()
    this.powerupSystem.updateHTMLPowerupBar((powerupId) => {
      this.handlePowerupUse(powerupId)
    })
  }

  update() {
    if (this.projectile) {
      this.updateProjectile()
    }
    
    this.particleSystem.update()
    this.comboSystem.update()
    
    const elapsed = Date.now() - this.gameStartTime
    if (elapsed > this.GAME_DURATION && !this.gameEnded) {
      this.gameEnded = true
      this.engine.endGame()
      this.onEnd()
    }
  }

  render() {
    this.renderer.render(
      this.board,
      this.shooter,
      this.projectile,
      this.mouseX,
      this.engine.getScore(),
      this.gameStartTime,
      this.GAME_DURATION
    )
  }

  private initBoard() {
    this.board = []
    for (let y = 0; y < this.ROWS; y++) {
      this.board[y] = []
      for (let x = 0; x < this.COLS; x++) {
        this.board[y][x] = Math.floor(Math.random() * this.COLORS.length)
      }
    }
    this.shooter.color = Math.floor(Math.random() * this.COLORS.length)
  }

  private setupEventListeners() {
    this.canvas.onmousemove = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect()
      this.mouseX = e.clientX - rect.left
      
      const dx = this.mouseX - this.shooter.x
      const dy = -100
      this.shooter.angle = Math.atan2(dy, dx)
      
      if (this.shooter.angle > -0.2) this.shooter.angle = -0.2
      if (this.shooter.angle < -Math.PI + 0.2) this.shooter.angle = -Math.PI + 0.2
    }

    this.canvas.ontouchmove = (e: TouchEvent) => {
      e.preventDefault()
      const rect = this.canvas.getBoundingClientRect()
      const touch = e.touches[0] || e.changedTouches[0]
      this.mouseX = touch.clientX - rect.left
      
      const dx = this.mouseX - this.shooter.x
      const dy = -100
      this.shooter.angle = Math.atan2(dy, dx)
      
      if (this.shooter.angle > -0.2) this.shooter.angle = -0.2
      if (this.shooter.angle < -Math.PI + 0.2) this.shooter.angle = -Math.PI + 0.2
    }

    this.canvas.onclick = () => {
      this.shoot()
    }

    this.canvas.ontouchend = () => {
      this.shoot()
    }
  }

  private shoot() {
    if (this.projectile) return
    
    this.projectile = {
      x: this.shooter.x,
      y: this.shooter.y - this.BUBBLE_SIZE / 2,
      vx: Math.cos(this.shooter.angle) * 8,
      vy: Math.sin(this.shooter.angle) * 8,
      color: this.shooter.color
    }
    
    audioService.click()
  }

  private updateProjectile() {
    if (!this.projectile) return

    this.projectile.x += this.projectile.vx
    this.projectile.y += this.projectile.vy

    // 左右边界反弹
    if (this.projectile.x - this.BUBBLE_SIZE / 2 <= 0) {
      this.projectile.x = this.BUBBLE_SIZE / 2
      this.projectile.vx *= -1
    }
    if (this.projectile.x + this.BUBBLE_SIZE / 2 >= this.W) {
      this.projectile.x = this.W - this.BUBBLE_SIZE / 2
      this.projectile.vx *= -1
    }

    // 顶部碰撞
    if (this.projectile.y - this.BUBBLE_SIZE / 2 <= 30) {
      this.projectile.y = this.BUBBLE_SIZE / 2 + 30
      this.attachBubble()
      return
    }

    // 与已有的泡泡碰撞检测
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this.board[r]?.[c] === null || this.board[r]?.[c] === undefined) continue
        
        const pos = this.renderer.getBubblePos(c, r)
        const dist = Math.hypot(this.projectile.x - pos.bx, this.projectile.y - pos.by)
        
        if (dist < this.BUBBLE_SIZE - 2) {
          this.attachBubble()
          return
        }
      }
    }
  }

  private attachBubble() {
    if (!this.projectile) return
    
    let bestRow = this.ROWS - 1
    let bestCol = Math.floor(this.COLS / 2)
    let bestDist = Infinity

    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this.board[r]?.[c] !== null && this.board[r]?.[c] !== undefined) continue
        
        const pos = this.renderer.getBubblePos(c, r)
        const dist = Math.hypot(this.projectile.x - pos.bx, this.projectile.y - pos.by)
        
        if (dist < bestDist) {
          bestDist = dist
          bestRow = r
          bestCol = c
        }
      }
    }

    if (bestRow >= 0 && bestCol >= 0 && bestRow < this.ROWS && bestCol < this.COLS) {
      this.board[bestRow][bestCol] = this.projectile.color

      const matches = this.findMatches(bestRow, bestCol, this.projectile.color)
      
      if (matches.length >= 3) {
        const baseScore = matches.length * 20
        const totalScore = this.comboSystem.addCombo(baseScore, this.projectile.x, this.projectile.y)
        
        this.engine.addScore(totalScore, this.projectile.x, this.projectile.y)
        audioService.win()
        
        matches.forEach(m => {
          const pos = this.renderer.getBubblePos(m.col, m.row)
          this.particleSystem.addExplosion(pos.bx, pos.by, this.COLORS[this.projectile!.color], 12)
          this.board[m.row][m.col] = null
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
    }

    this.projectile = null
    this.shooter.color = Math.floor(Math.random() * this.COLORS.length)
    this.rainbowMode = false
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
      if (boardColor !== color && !this.rainbowMode) continue
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

  private handlePowerupUse(type: string) {
    switch (type) {
      case 'color_bomb':
        this.useColorBomb()
        break
      case 'rainbow':
        this.useRainbow()
        break
      case 'extra_shot':
        this.useExtraShot()
        break
      case 'clear_row':
        this.useClearRow()
        break
    }
  }

  private useColorBomb() {
    const targetColor = Math.floor(Math.random() * this.COLORS.length)
    let bombCount = 0
    
    for (let y = 0; y < this.ROWS; y++) {
      for (let x = 0; x < this.COLS; x++) {
        if (this.board[y][x] === targetColor) {
          this.board[y][x] = null
          bombCount++
          const pos = this.renderer.getBubblePos(x, y)
          this.particleSystem.addExplosion(pos.bx, pos.by, this.COLORS[targetColor], 10)
        }
      }
    }
    
    this.engine.addScore(bombCount * 30, this.W / 2, this.H / 2)
    audioService.win()
  }

  private useRainbow() {
    this.rainbowMode = true
    audioService.win()
  }

  private useExtraShot() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (!this.projectile && !this.gameEnded) {
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5
          this.projectile = {
            x: this.shooter.x,
            y: this.shooter.y - this.BUBBLE_SIZE / 2,
            vx: Math.cos(angle) * 8,
            vy: Math.sin(angle) * 8,
            color: this.shooter.color
          }
          this.shooter.color = Math.floor(Math.random() * this.COLORS.length)
        }
      }, i * 200)
    }
    audioService.win()
  }

  private useClearRow() {
    let clearedBubbles = 0
    
    for (let y = this.ROWS - 1; y >= 0; y--) {
      let hasBubble = false
      for (let x = 0; x < this.COLS; x++) {
        if (this.board[y][x] !== null) {
          hasBubble = true
          this.board[y][x] = null
          clearedBubbles++
          const pos = this.renderer.getBubblePos(x, y)
          this.particleSystem.addSparkle(pos.bx, pos.by, '#FFD700', 8)
        }
      }
      if (hasBubble) break
    }
    
    this.engine.addScore(clearedBubbles * 20, this.W / 2, this.H / 2)
    audioService.win()
  }
}