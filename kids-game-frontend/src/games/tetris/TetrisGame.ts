// Tetris 游戏主类
import type { GameEngine } from '@shell/services/gameEngine'
import { audioService } from '@shell/services/audio'
import { createPowerupManager } from '@shell/services/powerupManager'
import { app } from '@shell/services/appBridge'
import { bindMobileControlPreset, shouldDrawOnScreenControls } from '@shell/platform/mobileControls'
import { ParticleSystem } from './ParticleSystem'
import { drawTetrisCell, TETRIS_PALETTE } from './tetrisBlockDraw'
import {
  computeHandheldShellFrame,
  drawHandheldControls,
  drawHandheldShellAndLcd,
  handheldTouchLayout,
  tryHapticLight,
  type HandheldShellFrame,
} from './tetrisHandheldShell'

export class TetrisGame {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private engine: GameEngine
  private onEnd: () => void
  
  // 游戏配置
  private readonly COLS = 10
  private readonly ROWS = 20
  private BLOCK_SIZE = 30
  private OFFSET_X = 0
  private OFFSET_Y = 60
  
  // 游戏状态
  private board: string[][] = []
  private boardPowerups: (string | null)[][] = []
  private currentPiece: any = null
  private nextPiece: any = null
  private holdPiece: any = null
  private canHold = true
  private pieceVisualX = 0
  private pieceVisualY = 0
  private lineClearFlash: { row: number; t: number }[] = []
  private repeatLeft = 0
  private repeatRight = 0
  private repeatDown = 0
  private readonly REPEAT_INITIAL_MS = 180
  private readonly REPEAT_RATE_MS = 55
  private particleSystem: ParticleSystem
  private inventory: string[] = []
  private score = 0
  private lines = 0
  private level = 1
  private lastDrop = 0
  private gameEnded = false
  private frameCount = 0
  private gameTime = 0
  private combo = 0
  private screenShake = { x: 0, y: 0, duration: 0 }
  private handheldFrame: HandheldShellFrame | null = null
  
  // 道具系统
  private powerupManager: any
  private powerupIcons: Record<string, string> = {
    'clear_line': '🧹',
    'clear_4': '💣',
    'slow_drop': '🐌',
    'score2x': '✨',
    'preview': '👁️'
  }
  
  // 方块形状定义
  private SHAPES = [
    { color: TETRIS_PALETTE[0], blocks: [[1, 1, 1, 1]] },
    { color: TETRIS_PALETTE[1], blocks: [[1, 1], [1, 1]] },
    { color: TETRIS_PALETTE[2], blocks: [[0, 1, 1], [1, 1, 0]] },
    { color: TETRIS_PALETTE[3], blocks: [[1, 1, 0], [0, 1, 1]] },
    { color: TETRIS_PALETTE[4], blocks: [[1, 0, 0], [1, 1, 1]] },
    { color: TETRIS_PALETTE[5], blocks: [[0, 0, 1], [1, 1, 1]] },
    { color: TETRIS_PALETTE[6], blocks: [[0, 1, 0], [1, 1, 1]] },
  ]
  
  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, engine: GameEngine, onEnd: () => void) {
    this.canvas = canvas
    this.ctx = ctx
    this.engine = engine
    this.onEnd = onEnd
    
    // 初始化游戏板
    this.resetBoard()
    
    // 计算布局
    this.calculateLayout()
    
    // 创建道具管理器
    this.powerupManager = createPowerupManager('tetris')
    
    // 初始化粒子系统
    this.particleSystem = new ParticleSystem()
  }
  
  private resetBoard() {
    this.board = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(''))
    this.boardPowerups = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(null))
  }
  
  private isHandheldMode(): boolean {
    return shouldDrawOnScreenControls()
  }

  private calculateLayout() {
    const W = this.canvas.width
    const H = this.canvas.height

    if (this.isHandheldMode()) {
      this.handheldFrame = computeHandheldShellFrame(W, H)
      const { boardRect } = this.handheldFrame
      const innerPad = 3
      const playW = boardRect.w - innerPad * 2
      const playH = boardRect.h - innerPad * 2
      this.BLOCK_SIZE = Math.max(10, Math.floor(Math.min(playH / this.ROWS, playW / this.COLS)))
      const boardW = this.COLS * this.BLOCK_SIZE
      const boardH = this.ROWS * this.BLOCK_SIZE
      this.OFFSET_X = boardRect.x + (boardRect.w - boardW) / 2
      this.OFFSET_Y = boardRect.y + (boardRect.h - boardH) / 2
      return
    }

    this.handheldFrame = null
    const topHud = 52
    const bottomReserve = 48
    const playH = H - topHud - bottomReserve
    this.BLOCK_SIZE = Math.max(12, Math.floor(playH / this.ROWS))
    this.OFFSET_X = (W - this.COLS * this.BLOCK_SIZE) / 2
    this.OFFSET_Y = topHud
  }
  
  public init() {
    this.currentPiece = this.randomShape()
    this.nextPiece = this.randomShape()
    this.holdPiece = null
    this.canHold = true
    this.syncPieceVisual(true)
    this.updateHTMLPowerupBar()
    this.calculateLayout()
    this.setupEventListeners()
  }

  private syncPieceVisual(instant = false) {
    if (!this.currentPiece) return
    if (instant) {
      this.pieceVisualX = this.currentPiece.x
      this.pieceVisualY = this.currentPiece.y
    }
  }

  private lerpPieceVisual(dt: number) {
    if (!this.currentPiece) return
    const t = Math.min(1, dt / 100)
    this.pieceVisualX += (this.currentPiece.x - this.pieceVisualX) * t
    this.pieceVisualY += (this.currentPiece.y - this.pieceVisualY) * t
  }

  private ghostLandingY(): number {
    if (!this.currentPiece) return 0
    let dy = 0
    while (this.canPlace(this.currentPiece, 0, dy + 1)) dy++
    return this.currentPiece.y + dy
  }

  private tryHold() {
    if (!this.canHold || this.gameEnded) return
    tryHapticLight()
    if (!this.holdPiece) {
      this.holdPiece = {
        ...this.currentPiece,
        blocks: this.currentPiece.blocks.map((r: number[]) => [...r]),
        x: Math.floor(this.COLS / 2) - 1,
        y: 0,
      }
      this.currentPiece = this.nextPiece
      this.nextPiece = this.randomShape()
    } else {
      const swap = {
        ...this.holdPiece,
        blocks: this.holdPiece.blocks.map((r: number[]) => [...r]),
        x: Math.floor(this.COLS / 2) - 1,
        y: 0,
      }
      this.holdPiece = {
        ...this.currentPiece,
        blocks: this.currentPiece.blocks.map((r: number[]) => [...r]),
      }
      this.currentPiece = swap
    }
    this.canHold = false
    this.syncPieceVisual(true)
    audioService.collect()
  }
  
  private randomShape() {
    const idx = Math.floor(Math.random() * this.SHAPES.length)
    return {
      ...this.SHAPES[idx],
      blocks: this.SHAPES[idx].blocks.map((r: number[]) => [...r]),
      x: Math.floor(this.COLS / 2) - 1,
      y: 0
    }
  }
  
  private controls: ReturnType<typeof bindMobileControlPreset> | null = null

  private tryMoveLeft() {
    if (this.canPlace(this.currentPiece, -1, 0)) {
      this.currentPiece.x--
      audioService.collect()
    }
  }

  private tryMoveRight() {
    if (this.canPlace(this.currentPiece, 1, 0)) {
      this.currentPiece.x++
      audioService.collect()
    }
  }

  private trySoftDrop() {
    if (this.canPlace(this.currentPiece, 0, 1)) {
      this.currentPiece.y++
      this.score += 1
    }
  }

  private tryHardDrop() {
    while (this.canPlace(this.currentPiece, 0, 1)) {
      this.currentPiece.y++
      this.score += 2
    }
    this.placePiece()
    audioService.collect()
  }

  private teardownInput() {
    this.controls?.dispose()
    this.controls = null
  }

  private setupEventListeners() {
    this.teardownInput()
    const W = this.canvas.width
    const H = this.canvas.height
    const frame = computeHandheldShellFrame(W, H)
    this.handheldFrame = this.isHandheldMode() ? frame : null
    const mobileLayout = this.isHandheldMode()
      ? handheldTouchLayout(frame)
      : { viewWidth: W, viewHeight: H, buttons: [] as never[] }
    this.controls = bindMobileControlPreset(this.canvas, {
      preset: 'joystick_action',
      viewWidth: W,
      viewHeight: H,
      layout: {
        ...mobileLayout,
        joystick: {
          x: -100,
          y: -100,
          radius: 1,
          knobRadius: 1,
          deadZone: 0.99,
          dynamicZoneWidthRatio: 0,
        },
      },
      keyboardProfile: {
        movementKeys: {
          up: ['ArrowUp', 'KeyW'],
          down: ['ArrowDown', 'KeyS'],
          left: ['ArrowLeft', 'KeyA'],
          right: ['ArrowRight', 'KeyD'],
        },
        buttons: {
          Space: 'hard_drop',
          KeyC: 'hold',
          ShiftLeft: 'hold',
          ShiftRight: 'hold',
        },
      },
      onAction: (action, payload) => {
        if (this.gameEnded) return
        if (action === 'button_down') {
          tryHapticLight()
          switch (payload.id) {
            case 'left':
              this.tryMoveLeft()
              this.repeatLeft = this.REPEAT_INITIAL_MS
              break
            case 'right':
              this.tryMoveRight()
              this.repeatRight = this.REPEAT_INITIAL_MS
              break
            case 'rotate':
              this.rotate()
              break
            case 'soft_drop':
              this.trySoftDrop()
              this.repeatDown = this.REPEAT_INITIAL_MS
              break
            case 'hard_drop':
              this.tryHardDrop()
              break
            case 'hold':
              this.tryHold()
              break
          }
          return
        }
        if (action === 'button_up') {
          switch (payload.id) {
            case 'left':
              this.repeatLeft = 0
              break
            case 'right':
              this.repeatRight = 0
              break
            case 'soft_drop':
              this.repeatDown = 0
              break
          }
          return
        }
        if (action === 'move' && payload.source === 'keyboard') {
          const sx = payload.stickX ?? 0
          const sy = payload.stickY ?? 0
          if (sy < -0.5) this.rotate()
          else if (sy > 0.5) this.trySoftDrop()
          else if (sx < -0.5) this.tryMoveLeft()
          else if (sx > 0.5) this.tryMoveRight()
        }
      },
    })
  }
  
  private canPlace(shape: any, dx = 0, dy = 0): boolean {
    for (let y = 0; y < shape.blocks.length; y++) {
      for (let x = 0; x < shape.blocks[y].length; x++) {
        if (shape.blocks[y][x]) {
          const nx = shape.x + x + dx
          const ny = shape.y + y + dy
          if (nx < 0 || nx >= this.COLS || ny >= this.ROWS) return false
          if (ny >= 0 && this.board[ny][nx]) return false
        }
      }
    }
    return true
  }
  
  private rotate() {
    const rotated = this.currentPiece.blocks[0].map((_: any, i: number) =>
      this.currentPiece.blocks.map((row: number[]) => row[i]).reverse(),
    )
    const old = this.currentPiece.blocks
    const oldX = this.currentPiece.x
    this.currentPiece.blocks = rotated
    if (this.canPlace(this.currentPiece)) {
      audioService.collect()
      this.syncPieceVisual(true)
      return
    }
    const kicks = [1, -1, 2, -2]
    for (const dx of kicks) {
      this.currentPiece.x = oldX + dx
      if (this.canPlace(this.currentPiece)) {
        audioService.collect()
        this.syncPieceVisual(true)
        return
      }
    }
    this.currentPiece.blocks = old
    this.currentPiece.x = oldX
  }
  
  private placePiece() {
    // 放置方块，并保存道具信息
    for (let y = 0; y < this.currentPiece.blocks.length; y++) {
      for (let x = 0; x < this.currentPiece.blocks[y].length; x++) {
        if (this.currentPiece.blocks[y][x]) {
          const ny = this.currentPiece.y + y
          const nx = this.currentPiece.x + x
          if (ny >= 0) {
            this.board[ny][nx] = this.currentPiece.color
            // 30%概率在方块上添加道具
            this.boardPowerups[ny][nx] = this.assignPowerupToBlock()
          }
        }
      }
    }
    
    // 消除检测
    this.checkLines()
    
    // 生成新方块
    this.currentPiece = this.nextPiece
    this.nextPiece = this.randomShape()
    this.canHold = true
    this.syncPieceVisual(true)

    // 检查游戏结束
    if (!this.canPlace(this.currentPiece)) {
      this.teardownInput()
      this.engine.endGame()
      this.gameEnded = true
      this.onEnd()
    }
  }
  
  private checkLines() {
    let cleared = 0
    let collectedPowerups: string[] = []
    
    for (let y = this.ROWS - 1; y >= 0; y--) {
      if (this.board[y].every(c => c !== '')) {
        cleared++
        
        // 收集该行的所有道具
        for (let x = 0; x < this.COLS; x++) {
          const powerup = this.boardPowerups[y][x]
          if (powerup) {
            collectedPowerups.push(powerup)
          }
        }
        
        this.createLineClearEffect(y)
        this.lineClearFlash.push({ row: y, t: 1 })

        this.board.splice(y, 1)
        this.board.unshift(Array(this.COLS).fill(''))
        this.boardPowerups.splice(y, 1)
        this.boardPowerups.unshift(Array(this.COLS).fill(null))
        y++
      }
    }
    
    // 将收集的道具加入库存
    if (collectedPowerups.length > 0) {
      this.inventory.push(...collectedPowerups)
      audioService.win()
      this.updateHTMLPowerupBar()
      
      // 道具收集特效
      this.particleSystem.createPowerupCollectEffect(
        this.canvas.width / 2,
        this.canvas.height / 2
      )
    }
    
    if (cleared > 0) {
      let points = [0, 100, 300, 500, 800][cleared] * this.level
      
      // 应用双倍分数
      if ((window as any).tetrisScore2x && Date.now() < (window as any).tetrisScore2x) {
        points *= 2
      }
      
      // 连击加分
      if (this.combo > 1) {
        points = Math.floor(points * (1 + this.combo * 0.1))
      }
      
      this.score += points
      this.lines += cleared
      this.level = Math.floor(this.lines / 10) + 1
      this.engine.addScore(points, this.canvas.width / 2, this.canvas.height / 2)
      audioService.win()
      
      if (this.lines >= 50) {
        this.teardownInput()
        this.engine.endGame()
        this.gameEnded = true
        this.onEnd()
      }
    } else {
      // 没有消除行，重置连击
      this.combo = 0
    }
  }
  
  private createLineClearEffect(row: number) {
    for (let x = 0; x < this.COLS; x++) {
      const px = this.OFFSET_X + x * this.BLOCK_SIZE + this.BLOCK_SIZE / 2
      const py = this.OFFSET_Y + row * this.BLOCK_SIZE + this.BLOCK_SIZE / 2
      this.particleSystem.createLineClearEffect(px, py, this.board[row][x], 10)
    }
    
    // 连击效果
    this.combo++
    if (this.combo > 1) {
      this.particleSystem.createComboEffect(
        this.canvas.width / 2,
        this.canvas.height / 2,
        this.combo
      )
      
      // 屏幕震动
      const shake = this.particleSystem.createScreenShake(3 + this.combo)
      this.screenShake = { x: shake.shakeX, y: shake.shakeY, duration: shake.duration }
    }
  }
  
  private assignPowerupToBlock(): string | null {
    if (Math.random() < 0.3) {
      const powerups = ['clear_line', 'clear_4', 'slow_drop', 'score2x', 'preview']
      return powerups[Math.floor(Math.random() * powerups.length)]
    }
    return null
  }
  
  private usePowerup(type: string): boolean {
    const index = this.inventory.indexOf(type)
    if (index === -1) return false
    
    // 从库存中移除
    this.inventory.splice(index, 1)
    
    
    // 执行效果
    switch (type) {
      case 'clear_line':
        if (this.ROWS > 0) {
          this.board.splice(this.ROWS - 1, 1)
          this.board.unshift(Array(this.COLS).fill(''))
          this.boardPowerups.splice(this.ROWS - 1, 1)
          this.boardPowerups.unshift(Array(this.COLS).fill(null))
          this.score += 50
          audioService.win()
          
          // 添加粒子效果
          for (let x = 0; x < this.COLS; x++) {
            const px = this.OFFSET_X + x * this.BLOCK_SIZE + this.BLOCK_SIZE / 2
            const py = this.OFFSET_Y + (this.ROWS - 1) * this.BLOCK_SIZE + this.BLOCK_SIZE / 2
            this.particleSystem.createLineClearEffect(px, py, '#FFD700', 8)
          }
        }
        break
      case 'clear_4':
        for (let i = 0; i < 4 && this.ROWS > 0; i++) {
          this.board.splice(this.ROWS - 1, 1)
          this.board.unshift(Array(this.COLS).fill(''))
          this.boardPowerups.splice(this.ROWS - 1, 1)
          this.boardPowerups.unshift(Array(this.COLS).fill(null))
        }
        this.score += 400
        audioService.win()
        
        // 添加大量粒子
        for (let row = this.ROWS - 4; row < this.ROWS; row++) {
          for (let x = 0; x < this.COLS; x++) {
            const px = this.OFFSET_X + x * this.BLOCK_SIZE + this.BLOCK_SIZE / 2
            const py = this.OFFSET_Y + row * this.BLOCK_SIZE + this.BLOCK_SIZE / 2
            const colors = ['#FF6B6B', '#FFD93D', '#4ECDC4', '#9B59B6']
            const color = colors[Math.floor(Math.random() * colors.length)]
            this.particleSystem.createLineClearEffect(px, py, color, 12)
          }
        }
        
        // Tetris 特效 - 屏幕震动
        const shake = this.particleSystem.createScreenShake(8)
        this.screenShake = { x: shake.shakeX, y: shake.shakeY, duration: shake.duration }
        break
      case 'slow_drop':
        // 临时减速，持续8秒
        ;(window as any).tetrisSlowDrop = Date.now() + 8000
        audioService.collect()
        break
      case 'score2x':
        // 双倍分数，持续10秒
        ;(window as any).tetrisScore2x = Date.now() + 10000
        audioService.collect()
        break
      case 'preview':
        // 预览效果，持续10秒
        ;(window as any).tetrisPreview = Date.now() + 10000
        audioService.collect()
        break
    }
    
    return true
  }
  
  private updateHTMLPowerupBar() {
    // 道具栏已删除 - 每个游戏有自己的道具拾取机制
    // 这里可以添加自定义的道具栏更新逻辑
  }
  
  public update(deltaTime: number) {
    this.gameTime += deltaTime / 1000
    this.frameCount++
    this.lerpPieceVisual(deltaTime)

    if (this.isHandheldMode() && !this.gameEnded) {
      const step = (acc: number, dir: 'left' | 'right' | 'down') => {
        if (acc <= 0) return 0
        const next = acc - deltaTime
        if (next <= 0) {
          if (dir === 'left') this.tryMoveLeft()
          else if (dir === 'right') this.tryMoveRight()
          else this.trySoftDrop()
          return this.REPEAT_RATE_MS
        }
        return next
      }
      this.repeatLeft = step(this.repeatLeft, 'left')
      this.repeatRight = step(this.repeatRight, 'right')
      this.repeatDown = step(this.repeatDown, 'down')
    }

    for (let i = this.lineClearFlash.length - 1; i >= 0; i--) {
      this.lineClearFlash[i].t -= deltaTime / 280
      if (this.lineClearFlash[i].t <= 0) this.lineClearFlash.splice(i, 1)
    }

    // 下落速度
    let dropSpeed = Math.max(100, 800 - this.level * 80)
    
    // 应用慢降效果
    if ((window as any).tetrisSlowDrop && Date.now() < (window as any).tetrisSlowDrop) {
      dropSpeed *= 2 // 速度减半
    }
    
    if (Date.now() - this.lastDrop > dropSpeed) {
      if (this.canPlace(this.currentPiece, 0, 1)) {
        this.currentPiece.y++
      } else {
        this.placePiece()
      }
      this.lastDrop = Date.now()
    }
    
    // 更新粒子系统
    this.particleSystem.update()
    
    // 更新屏幕震动
    if (this.screenShake.duration > 0) {
      this.screenShake.duration -= deltaTime
      if (this.screenShake.duration <= 0) {
        this.screenShake.x = 0
        this.screenShake.y = 0
      }
    }
    
    // 重置连击（如果一段时间没有消除）
    if (this.frameCount % 180 === 0) { // 约3秒
      this.combo = 0
    }
  }
  
  public render() {
    const W = this.canvas.width
    const H = this.canvas.height
    const handheld = this.isHandheldMode() && this.handheldFrame

    this.ctx.save()
    if (this.screenShake.duration > 0) {
      this.ctx.translate(this.screenShake.x, this.screenShake.y)
    }

    if (handheld) {
      drawHandheldShellAndLcd(this.ctx, this.handheldFrame!)
      const { boardRect } = this.handheldFrame!
      this.ctx.save()
      this.ctx.beginPath()
      this.ctx.roundRect(boardRect.x, boardRect.y, boardRect.w, boardRect.h, boardRect.r)
      this.ctx.clip()
    } else {
      const grad = this.ctx.createLinearGradient(0, 0, 0, H)
      grad.addColorStop(0, '#1a1a2e')
      grad.addColorStop(1, '#16213e')
      this.ctx.fillStyle = grad
      this.ctx.fillRect(0, 0, W, H)
    }

    this.ctx.fillStyle = 'rgba(255,255,255,0.05)'
    this.ctx.fillRect(this.OFFSET_X, this.OFFSET_Y, this.COLS * this.BLOCK_SIZE, this.ROWS * this.BLOCK_SIZE)
    this.drawGrid()
    this.drawPlacedBlocks()
    this.drawLineClearFlash()
    this.drawGhostPiece()
    this.drawCurrentPiece()
    this.particleSystem.render(this.ctx)

    if (handheld) {
      this.ctx.restore()
      this.drawUI()
      this.drawPreviewPanels()
    } else {
      this.drawUI()
      this.drawNextPiece()
    }

    if (handheld) {
      const snap = this.controls?.getSnapshot()
      const pressed = new Set<string>()
      if (snap) {
        for (const b of snap.buttons) {
          if (b.pressed) pressed.add(b.id)
        }
      }
      drawHandheldControls(this.ctx, this.handheldFrame!, pressed)
    }

    this.ctx.restore()
  }
  
  private drawGrid() {
    const g = this.ctx
    g.strokeStyle = 'rgba(51, 51, 51, 0.55)'
    g.lineWidth = 1
    g.setLineDash([3, 4])
    for (let x = 0; x <= this.COLS; x++) {
      g.beginPath()
      g.moveTo(this.OFFSET_X + x * this.BLOCK_SIZE, this.OFFSET_Y)
      g.lineTo(this.OFFSET_X + x * this.BLOCK_SIZE, this.OFFSET_Y + this.ROWS * this.BLOCK_SIZE)
      g.stroke()
    }
    for (let y = 0; y <= this.ROWS; y++) {
      g.beginPath()
      g.moveTo(this.OFFSET_X, this.OFFSET_Y + y * this.BLOCK_SIZE)
      g.lineTo(this.OFFSET_X + this.COLS * this.BLOCK_SIZE, this.OFFSET_Y + y * this.BLOCK_SIZE)
      g.stroke()
    }
    g.setLineDash([])
  }

  private drawPieceBlocks(
    piece: { blocks: number[][]; color: string; x: number; y: number },
    ox: number,
    oy: number,
    cell: number,
    opts?: { ghost?: boolean; powerupGlow?: number },
  ) {
    for (let y = 0; y < piece.blocks.length; y++) {
      for (let x = 0; x < piece.blocks[y].length; x++) {
        if (!piece.blocks[y][x]) continue
        const px = ox + (piece.x + x) * cell
        const py = oy + (piece.y + y) * cell
        drawTetrisCell(this.ctx, px, py, cell, piece.color, opts)
      }
    }
  }

  private drawGhostPiece() {
    if (!this.currentPiece) return
    const gy = this.ghostLandingY()
    if (gy === this.currentPiece.y) return
    this.drawPieceBlocks(
      { ...this.currentPiece, y: gy },
      this.OFFSET_X,
      this.OFFSET_Y,
      this.BLOCK_SIZE,
      { ghost: true },
    )
  }

  private drawLineClearFlash() {
    const t = this.frameCount * 0.08
    for (const f of this.lineClearFlash) {
      const alpha = f.t * (0.35 + 0.25 * Math.sin(t * 12))
      this.ctx.fillStyle = `rgba(255,255,255,${alpha})`
      this.ctx.fillRect(
        this.OFFSET_X,
        this.OFFSET_Y + f.row * this.BLOCK_SIZE,
        this.COLS * this.BLOCK_SIZE,
        this.BLOCK_SIZE,
      )
    }
  }

  private drawPlacedBlocks() {
    const pulse = 0.5 + 0.5 * Math.sin(this.frameCount * 0.06)
    for (let y = 0; y < this.ROWS; y++) {
      for (let x = 0; x < this.COLS; x++) {
        if (!this.board[y][x]) continue
        const powerup = this.boardPowerups[y][x]
        drawTetrisCell(
          this.ctx,
          this.OFFSET_X + x * this.BLOCK_SIZE,
          this.OFFSET_Y + y * this.BLOCK_SIZE,
          this.BLOCK_SIZE,
          this.board[y][x],
          { powerupGlow: powerup ? pulse : 0 },
        )
        if (powerup) {
          this.ctx.font = `${Math.max(9, this.BLOCK_SIZE * 0.32)}px sans-serif`
          this.ctx.textAlign = 'center'
          this.ctx.textBaseline = 'middle'
          this.ctx.fillText(
            this.powerupIcons[powerup] || '?',
            this.OFFSET_X + x * this.BLOCK_SIZE + this.BLOCK_SIZE / 2,
            this.OFFSET_Y + y * this.BLOCK_SIZE + this.BLOCK_SIZE / 2,
          )
        }
      }
    }
  }

  private drawCurrentPiece() {
    if (!this.currentPiece) return
    const vis = {
      ...this.currentPiece,
      x: this.pieceVisualX,
      y: this.pieceVisualY,
    }
    this.drawPieceBlocks(vis, this.OFFSET_X, this.OFFSET_Y, this.BLOCK_SIZE)
  }

  
  private drawUI() {
    const W = this.canvas.width
    const comboLabel = this.combo > 1 ? ` · ${this.combo}连击` : ''
    const statusLine = `Lv${this.level} · ${this.lines}行${comboLabel}`

    if (this.handheldFrame) {
      const { hud } = this.handheldFrame
      this.ctx.fillStyle = '#b8d4e8'
      this.ctx.font = 'bold 12px sans-serif'
      this.ctx.textAlign = 'left'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText(statusLine, hud.x + 12, hud.y + hud.h / 2)
      
      this.ctx.font = 'bold 14px sans-serif'
      this.ctx.fillStyle = '#FFD54F'
      this.ctx.textAlign = 'right'
      const scoreX = hud.x + hud.w - 12
      this.ctx.fillText(`${this.score}`, scoreX, hud.y + hud.h / 2)
      
      this.ctx.font = '9px sans-serif'
      this.ctx.fillStyle = 'rgba(255,255,255,0.45)'
      this.ctx.fillText('得分', scoreX, hud.y + hud.h / 2 - 10)
    } else {
      this.ctx.fillStyle = 'rgba(0,0,0,0.45)'
      this.ctx.beginPath()
      this.ctx.roundRect(10, 8, W - 20, 40, 10)
      this.ctx.fill()
      this.ctx.fillStyle = '#4D96FF'
      this.ctx.font = 'bold 15px sans-serif'
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText(`等级 ${this.level} · 消行 ${this.lines}${comboLabel}`, W / 2, 28)
    }

    const now = Date.now()
    let statusY = this.handheldFrame ? this.handheldFrame.hud.y + this.handheldFrame.hud.h + 8 : 95
    
    if ((window as any).tetrisSlowDrop && now < (window as any).tetrisSlowDrop) {
      const remaining = Math.ceil(((window as any).tetrisSlowDrop - now) / 1000)
      this.ctx.fillStyle = '#4ECDC4'
      this.ctx.fillText(`🐌 减速: ${remaining}s`, W / 4, statusY)
      statusY += 20
    }
    
    if ((window as any).tetrisScore2x && now < (window as any).tetrisScore2x) {
      const remaining = Math.ceil(((window as any).tetrisScore2x - now) / 1000)
      this.ctx.fillStyle = '#FFD700'
      this.ctx.fillText(`✨ 双倍分数: ${remaining}s`, W / 4, statusY)
      statusY += 20
    }
    
    if ((window as any).tetrisPreview && now < (window as any).tetrisPreview) {
      const remaining = Math.ceil(((window as any).tetrisPreview - now) / 1000)
      this.ctx.fillStyle = '#9B59B6'
      this.ctx.fillText(`👁️ 预览: ${remaining}s`, W / 4, statusY)
      statusY += 20
    }
  }
  
  private drawPreviewPanels() {
    const frame = this.handheldFrame
    if (!frame) return
    const { previewHold, previewNext } = frame
    const cellHold = Math.floor(Math.min(previewHold.w - 12, previewHold.h - 24) / 4)
    const cellNext = Math.floor(Math.min(previewNext.w - 12, previewNext.h - 24) / 4)

    this.ctx.fillStyle = 'rgba(255,255,255,0.5)'
    this.ctx.font = 'bold 9px sans-serif'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('HOLD', previewHold.x + previewHold.w / 2, previewHold.y + 10)
    this.ctx.fillText('NEXT', previewNext.x + previewNext.w / 2, previewNext.y + 10)

    const drawMini = (
      piece: typeof this.nextPiece,
      box: { x: number; y: number; w: number; h: number },
      cell: number,
    ) => {
      if (!piece) return
      const bw = piece.blocks[0].length * cell
      const bh = piece.blocks.length * cell
      const ox = box.x + (box.w - bw) / 2
      const oy = box.y + (box.h - bh) / 2 + 8
      for (let y = 0; y < piece.blocks.length; y++) {
        for (let x = 0; x < piece.blocks[y].length; x++) {
          if (piece.blocks[y][x]) {
            drawTetrisCell(this.ctx, ox + x * cell, oy + y * cell, cell, piece.color)
          }
        }
      }
    }

    drawMini(this.holdPiece, previewHold, cellHold)
    drawMini(this.nextPiece, previewNext, cellNext)
  }

  private drawNextPiece() {
    const W = this.canvas.width
    const cell = 18
    const originX = W - 120
    const originY = 50

    this.ctx.fillStyle = 'rgba(255,255,255,0.35)'
    this.ctx.font = '14px sans-serif'
    this.ctx.textAlign = 'right'
    this.ctx.fillText('NEXT', W - 20, 35)

    if (this.nextPiece) {
      for (let y = 0; y < this.nextPiece.blocks.length; y++) {
        for (let x = 0; x < this.nextPiece.blocks[y].length; x++) {
          if (this.nextPiece.blocks[y][x]) {
            drawTetrisCell(
              this.ctx,
              originX + x * cell,
              originY + y * cell,
              cell,
              this.nextPiece.color,
            )
          }
        }
      }
    }
  }
}