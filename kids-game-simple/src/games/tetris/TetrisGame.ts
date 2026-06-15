// Tetris 游戏主类
import type { GameEngine } from '../../services/gameEngine'
import { audioService } from '../../services/audio'
import { createPowerupManager } from '../../services/powerupManager'
import { app } from '../../services/appBridge'
import { applyCanvasMobileStyles, bindCanvasPointerInput } from '../../utils/canvasMobileUtils'
import { ParticleSystem } from './ParticleSystem'

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
    { color: '#FF6B6B', blocks: [[1,1,1,1]] },           // I - 红色
    { color: '#FFD93D', blocks: [[1,1],[1,1]] },         // O - 黄色
    { color: '#4ECDC4', blocks: [[0,1,1],[1,1,0]] },     // S - 青色
    { color: '#9B59B6', blocks: [[1,1,0],[0,1,1]] },     // Z - 紫色
    { color: '#FF8E53', blocks: [[1,0,0],[1,1,1]] },     // J - 橙色
    { color: '#4D96FF', blocks: [[0,0,1],[1,1,1]] },     // L - 蓝色
    { color: '#6BCB77', blocks: [[0,1,0],[1,1,1]] },     // T - 绿色
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
  
  private calculateLayout() {
    const W = this.canvas.width
    const H = this.canvas.height
    this.BLOCK_SIZE = Math.floor((H - 100) / this.ROWS)
    this.OFFSET_X = (W - this.COLS * this.BLOCK_SIZE) / 2
  }
  
  public init() {
    // 初始化第一个方块
    this.currentPiece = this.randomShape()
    this.nextPiece = this.randomShape()
    
    // 更新道具栏
    this.updateHTMLPowerupBar()
    
    // 设置事件监听
    this.setupEventListeners()
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
  
  private unbindPointer: (() => void) | null = null

  private handleCanvasTap(mx: number, my: number) {
    if (this.gameEnded) return
    const W = this.canvas.width
    const H = this.canvas.height

    if (my > H * 0.72) {
      if (this.canPlace(this.currentPiece, 0, 1)) {
        this.currentPiece.y++
        this.score += 1
      }
      return
    }

    if (mx < W / 3 && this.canPlace(this.currentPiece, -1, 0)) {
      this.currentPiece.x--
      audioService.collect()
    } else if (mx > (W * 2) / 3 && this.canPlace(this.currentPiece, 1, 0)) {
      this.currentPiece.x++
      audioService.collect()
    } else {
      this.rotate()
    }
  }

  private teardownInput() {
    this.unbindPointer?.()
    this.unbindPointer = null
    document.onkeydown = null
  }

  private setupEventListeners() {
    this.teardownInput()
    applyCanvasMobileStyles(this.canvas)

    document.onkeydown = (e) => {
      if (this.gameEnded) return
      switch (e.key) {
        case 'ArrowLeft':
          if (this.canPlace(this.currentPiece, -1, 0)) {
            this.currentPiece.x--
            audioService.collect()
          }
          break
        case 'ArrowRight':
          if (this.canPlace(this.currentPiece, 1, 0)) {
            this.currentPiece.x++
            audioService.collect()
          }
          break
        case 'ArrowDown':
          if (this.canPlace(this.currentPiece, 0, 1)) {
            this.currentPiece.y++
            this.score += 1
          }
          break
        case 'ArrowUp':
          this.rotate()
          break
        case ' ':
          while (this.canPlace(this.currentPiece, 0, 1)) {
            this.currentPiece.y++
            this.score += 2
          }
          this.placePiece()
          break
      }
    }

    this.unbindPointer = bindCanvasPointerInput(this.canvas, (x, y) => {
      this.handleCanvasTap(x, y)
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
      this.currentPiece.blocks.map((row: number[]) => row[i]).reverse()
    )
    const old = this.currentPiece.blocks
    this.currentPiece.blocks = rotated
    if (!this.canPlace(this.currentPiece)) {
      this.currentPiece.blocks = old
    } else {
      audioService.collect()
    }
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
        
        // 消除特效
        this.createLineClearEffect(y)
        
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
    
    // 应用屏幕震动
    this.ctx.save()
    if (this.screenShake.duration > 0) {
      this.ctx.translate(this.screenShake.x, this.screenShake.y)
    }
    
    // 背景渐变
    const grad = this.ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#1a1a2e')
    grad.addColorStop(1, '#16213e')
    this.ctx.fillStyle = grad
    this.ctx.fillRect(0, 0, W, H)
    
    // 绘制棋盘背景
    this.ctx.fillStyle = 'rgba(255,255,255,0.05)'
    this.ctx.fillRect(this.OFFSET_X, this.OFFSET_Y, this.COLS * this.BLOCK_SIZE, this.ROWS * this.BLOCK_SIZE)
    
    // 绘制网格线
    this.drawGrid()
    
    // 绘制已放置的方块
    this.drawPlacedBlocks()
    
    // 绘制当前方块
    this.drawCurrentPiece()
    
    // 绘制粒子效果
    this.particleSystem.render(this.ctx)
    
    // 绘制UI
    this.drawUI()
    
    // 绘制下一个方块预览
    this.drawNextPiece()
    
    this.ctx.restore()
  }
  
  private drawGrid() {
    this.ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    this.ctx.lineWidth = 1
    for (let x = 0; x <= this.COLS; x++) {
      this.ctx.beginPath()
      this.ctx.moveTo(this.OFFSET_X + x * this.BLOCK_SIZE, this.OFFSET_Y)
      this.ctx.lineTo(this.OFFSET_X + x * this.BLOCK_SIZE, this.OFFSET_Y + this.ROWS * this.BLOCK_SIZE)
      this.ctx.stroke()
    }
    for (let y = 0; y <= this.ROWS; y++) {
      this.ctx.beginPath()
      this.ctx.moveTo(this.OFFSET_X, this.OFFSET_Y + y * this.BLOCK_SIZE)
      this.ctx.lineTo(this.OFFSET_X + this.COLS * this.BLOCK_SIZE, this.OFFSET_Y + y * this.BLOCK_SIZE)
      this.ctx.stroke()
    }
  }
  
  private drawPlacedBlocks() {
    for (let y = 0; y < this.ROWS; y++) {
      for (let x = 0; x < this.COLS; x++) {
        if (this.board[y][x]) {
          this.ctx.shadowBlur = 8
          this.ctx.shadowColor = this.board[y][x]
          this.ctx.fillStyle = this.board[y][x]
          this.ctx.fillRect(
            this.OFFSET_X + x * this.BLOCK_SIZE + 2, 
            this.OFFSET_Y + y * this.BLOCK_SIZE + 2, 
            this.BLOCK_SIZE - 4, 
            this.BLOCK_SIZE - 4
          )
          
          // 如果方块上有道具，显示小图标
          const powerup = this.boardPowerups[y][x]
          if (powerup) {
            this.ctx.font = '10px sans-serif'
            this.ctx.textAlign = 'center'
            this.ctx.fillText(
              this.powerupIcons[powerup] || '?', 
              this.OFFSET_X + x * this.BLOCK_SIZE + this.BLOCK_SIZE / 2,
              this.OFFSET_Y + y * this.BLOCK_SIZE + this.BLOCK_SIZE / 2 + 3
            )
          }
          
          this.ctx.shadowBlur = 0
        }
      }
    }
  }
  
  private drawCurrentPiece() {
    if (this.currentPiece) {
      this.ctx.shadowBlur = 15
      this.ctx.shadowColor = this.currentPiece.color
      for (let y = 0; y < this.currentPiece.blocks.length; y++) {
        for (let x = 0; x < this.currentPiece.blocks[y].length; x++) {
          if (this.currentPiece.blocks[y][x]) {
            const px = this.OFFSET_X + (this.currentPiece.x + x) * this.BLOCK_SIZE
            const py = this.OFFSET_Y + (this.currentPiece.y + y) * this.BLOCK_SIZE
            this.ctx.fillStyle = this.currentPiece.color
            this.ctx.fillRect(px + 2, py + 2, this.BLOCK_SIZE - 4, this.BLOCK_SIZE - 4)
          }
        }
      }
      this.ctx.shadowBlur = 0
    }
  }

  
  private drawUI() {
    const W = this.canvas.width

    this.ctx.fillStyle = 'rgba(0,0,0,0.45)'
    this.ctx.beginPath()
    this.ctx.roundRect(10, 8, W - 20, 40, 10)
    this.ctx.fill()
    const comboLabel = this.combo > 1 ? ` · ${this.combo}连击` : ''
    this.ctx.fillStyle = '#4D96FF'
    this.ctx.font = 'bold 15px sans-serif'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(
      `等级 ${this.level} · 消行 ${this.lines}${comboLabel}`,
      W / 2,
      28,
    )

    // 显示激活的道具状态（左侧小字，避免挡棋盘）
    const now = Date.now()
    let statusY = 95
    
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
  
  private drawNextPiece() {
    const W = this.canvas.width
    
    // 下一个方块标题
    this.ctx.fillStyle = 'rgba(255,255,255,0.3)'
    this.ctx.font = '14px sans-serif'
    this.ctx.textAlign = 'right'
    this.ctx.fillText('NEXT', W - 20, 35)
    
    if (this.nextPiece) {
      // 如果激活了预览道具，高亮显示
      if ((window as any).tetrisPreview && Date.now() < (window as any).tetrisPreview) {
        this.ctx.shadowBlur = 15
        this.ctx.shadowColor = '#FFD700'
      } else {
        this.ctx.shadowBlur = 10
      }
      this.ctx.shadowColor = this.nextPiece.color
      
      for (let y = 0; y < this.nextPiece.blocks.length; y++) {
        for (let x = 0; x < this.nextPiece.blocks[y].length; x++) {
          if (this.nextPiece.blocks[y][x]) {
            const px = W - 120 + x * 20
            const py = 50 + y * 20
            this.ctx.fillStyle = this.nextPiece.color
            this.ctx.fillRect(px, py, 18, 18)
          }
        }
      }
      this.ctx.shadowBlur = 0
    }
  }
}