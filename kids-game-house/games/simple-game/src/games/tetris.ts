import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { createPowerupManager, ActivePowerup } from '../services/powerupManager'
import { app } from '../App'

export function initTetris(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  if (!canvas) return
  
  const W = 400, H = 600
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false

  // 创建道具管理器
  const powerupManager = createPowerupManager('tetris')

  const COLS = 10
  const ROWS = 20
  const BLOCK = Math.floor((H - 100) / ROWS)
  const OFFSET_X = (W - COLS * BLOCK) / 2
  const OFFSET_Y = 60

  const SHAPES = [
    { color: '#FF6B6B', blocks: [[1,1,1,1]] },           // I
    { color: '#FFD93D', blocks: [[1,1],[1,1]] },           // O
    { color: '#4ECDC4', blocks: [[0,1,1],[1,1,0]] },       // S
    { color: '#9B59B6', blocks: [[1,1,0],[0,1,1]] },       // Z
    { color: '#FF8E53', blocks: [[1,0,0],[1,1,1]] },       // J
    { color: '#4D96FF', blocks: [[0,0,1],[1,1,1]] },       // L
    { color: '#6BCB77', blocks: [[0,1,0],[1,1,1]] },       // T
  ]

  let board: string[][] = Array(ROWS).fill(null).map(() => Array(COLS).fill(''))
  let current: any = null
  let nextShape: any = null
  let particles: any[] = []
  
  // 道具系统 - 库存模式
  let inventory: string[] = [] // 道具库存
  let gameTime = 0
  
  // 道具图标映射
  const powerupIcons: Record<string, string> = {
    'clear_line': '🧹',
    'clear_4': '💣',
    'slow_drop': '🐌',
    'score2x': '✨',
    'preview': '👁️'
  }
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id
    }))
    
    app.setupCustomPowerupBar('tetris', powerups, inventory, (powerupId) => {
      if (usePowerup(powerupId)) {
        audioService.collect()
        updateHTMLPowerupBar() // 使用后更新
      }
    })
  }
  
  // 方块上的道具标记（每个方块可能携带一个道具）
  let boardPowerups: (string | null)[][] = Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
  
  let score = 0
  let lines = 0
  let level = 1
  let lastDrop = 0
  let gameEnded = false
  let frameCount = 0 // 帧计数器

  function randomShape() {
    const idx = Math.floor(Math.random() * SHAPES.length)
    return {
      ...SHAPES[idx],
      blocks: SHAPES[idx].blocks.map((r: number[]) => [...r]),
      x: Math.floor(COLS / 2) - 1,
      y: 0
    }
  }

  // ====== 道具系统辅助函数 ======
  
  // 为方块随机分配道具（30%概率）
  function assignPowerupToBlock(): string | null {
    if (Math.random() < 0.3) {
      const powerups = ['clear_line', 'clear_4', 'slow_drop', 'score2x', 'preview']
      return powerups[Math.floor(Math.random() * powerups.length)]
    }
    return null
  }
  
  // 使用库存中的道具
  function usePowerup(type: string): boolean {
    const index = inventory.indexOf(type)
    if (index === -1) return false
    
    // 从库存中移除
    inventory.splice(index, 1)
    
    console.log('[道具] 使用道具:', type)
    
    // 执行效果
    switch (type) {
      case 'clear_line':
        if (ROWS > 0) {
          board.splice(ROWS - 1, 1)
          board.unshift(Array(COLS).fill(''))
          boardPowerups.splice(ROWS - 1, 1)
          boardPowerups.unshift(Array(COLS).fill(null))
          score += 50
          audioService.win()
          console.log('[道具] 消除一行，当前分数:', score)
          
          // 添加粒子效果
          for (let x = 0; x < COLS; x++) {
            particles.push({
              x: OFFSET_X + x * BLOCK + BLOCK / 2,
              y: OFFSET_Y + (ROWS - 1) * BLOCK + BLOCK / 2,
              vx: (Math.random() - 0.5) * 4,
              vy: -Math.random() * 3 - 1,
              life: 1,
              color: '#FFD700',
              size: 4
            })
          }
        }
        break
      case 'clear_4':
        for (let i = 0; i < 4 && ROWS > 0; i++) {
          board.splice(ROWS - 1, 1)
          board.unshift(Array(COLS).fill(''))
          boardPowerups.splice(ROWS - 1, 1)
          boardPowerups.unshift(Array(COLS).fill(null))
        }
        score += 400
        audioService.win()
        console.log('[道具] Tetris! 消除四行，当前分数:', score)
        
        // 添加大量粒子
        for (let row = ROWS - 4; row < ROWS; row++) {
          for (let x = 0; x < COLS; x++) {
            particles.push({
              x: OFFSET_X + x * BLOCK + BLOCK / 2,
              y: OFFSET_Y + row * BLOCK + BLOCK / 2,
              vx: (Math.random() - 0.5) * 6,
              vy: -Math.random() * 4 - 2,
              life: 1,
              color: ['#FF6B6B', '#FFD93D', '#4ECDC4', '#9B59B6'][Math.floor(Math.random() * 4)],
              size: 5
            })
          }
        }
        break
      case 'slow_drop':
        // 临时减速，持续8秒
        ;(window as any).tetrisSlowDrop = Date.now() + 8000
        audioService.collect()
        console.log('[道具] 减速生效，持续8秒')
        break
      case 'score2x':
        // 双倍分数，持续10秒
        ;(window as any).tetrisScore2x = Date.now() + 10000
        audioService.collect()
        console.log('[道具] 双倍分数生效，持续10秒')
        break
      case 'preview':
        // 预览效果，持续10秒
        ;(window as any).tetrisPreview = Date.now() + 10000
        audioService.collect()
        console.log('[道具] 预览效果生效，持续10秒')
        break
    }
    
    return true
  }

  function canPlace(shape: any, dx = 0, dy = 0) {
    for (let y = 0; y < shape.blocks.length; y++) {
      for (let x = 0; x < shape.blocks[y].length; x++) {
        if (shape.blocks[y][x]) {
          const nx = shape.x + x + dx
          const ny = shape.y + y + dy
          if (nx < 0 || nx >= COLS || ny >= ROWS) return false
          if (ny >= 0 && board[ny][nx]) return false
        }
      }
    }
    return true
  }

  function placeShape() {
    // 放置方块，并保存道具信息
    for (let y = 0; y < current.blocks.length; y++) {
      for (let x = 0; x < current.blocks[y].length; x++) {
        if (current.blocks[y][x]) {
          const ny = current.y + y
          const nx = current.x + x
          if (ny >= 0) {
            board[ny][nx] = current.color
            // 30%概率在方块上添加道具
            boardPowerups[ny][nx] = assignPowerupToBlock()
          }
        }
      }
    }
    
    // 消除检测
    let cleared = 0
    let collectedPowerups: string[] = []
    
    for (let y = ROWS - 1; y >= 0; y--) {
      if (board[y].every(c => c !== '')) {
        cleared++
        
        // 收集该行的所有道具
        for (let x = 0; x < COLS; x++) {
          const powerup = boardPowerups[y][x]
          if (powerup) {
            collectedPowerups.push(powerup)
          }
        }
        
        // 消除特效
        for (let x = 0; x < COLS; x++) {
          for (let i = 0; i < 5; i++) {
            particles.push({
              x: OFFSET_X + x * BLOCK + BLOCK / 2,
              y: OFFSET_Y + y * BLOCK + BLOCK / 2,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8 - 3,
              life: 1,
              color: board[y][x],
              size: 3 + Math.random() * 4
            })
          }
        }
        board.splice(y, 1)
        board.unshift(Array(COLS).fill(''))
        boardPowerups.splice(y, 1)
        boardPowerups.unshift(Array(COLS).fill(null))
        y++
      }
    }
    
    // 将收集的道具加入库存
    if (collectedPowerups.length > 0) {
      inventory.push(...collectedPowerups)
      audioService.win()
      updateHTMLPowerupBar() // 更新道具栏显示
    }
    
    if (cleared > 0) {
      let points = [0, 100, 300, 500, 800][cleared] * level
      
      // 应用双倍分数
      if ((window as any).tetrisScore2x && Date.now() < (window as any).tetrisScore2x) {
        points *= 2
      }
      
      score += points
      lines += cleared
      level = Math.floor(lines / 10) + 1
      engine.addScore(points, W / 2, H / 2)
      audioService.win()
      
      if (lines >= 50) {
        engine.endGame()
        gameEnded = true
        onEnd()
      }
    }
    
    current = nextShape
    nextShape = randomShape()
    
    if (!canPlace(current)) {
      engine.endGame()
      gameEnded = true
      onEnd()
    }
  }

  function rotate() {
    const rotated = current.blocks[0].map((_: any, i: number) =>
      current.blocks.map((row: number[]) => row[i]).reverse()
    )
    const old = current.blocks
    current.blocks = rotated
    if (!canPlace(current)) {
      current.blocks = old
    } else {
      audioService.collect()
    }
  }

  function draw() {
    // 背景
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#1a1a2e')
    grad.addColorStop(1, '#16213e')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // 绘制棋盘
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    ctx.fillRect(OFFSET_X, OFFSET_Y, COLS * BLOCK, ROWS * BLOCK)
    
    // 网格
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 1
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath()
      ctx.moveTo(OFFSET_X + x * BLOCK, OFFSET_Y)
      ctx.lineTo(OFFSET_X + x * BLOCK, OFFSET_Y + ROWS * BLOCK)
      ctx.stroke()
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath()
      ctx.moveTo(OFFSET_X, OFFSET_Y + y * BLOCK)
      ctx.lineTo(OFFSET_X + COLS * BLOCK, OFFSET_Y + y * BLOCK)
      ctx.stroke()
    }

    // 绘制已放置的方块
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (board[y][x]) {
          ctx.shadowBlur = 8
          ctx.shadowColor = board[y][x]
          ctx.fillStyle = board[y][x]
          ctx.fillRect(OFFSET_X + x * BLOCK + 2, OFFSET_Y + y * BLOCK + 2, BLOCK - 4, BLOCK - 4)
          
          // 如果方块上有道具，显示小图标
          const powerup = boardPowerups[y][x]
          if (powerup) {
            const icons: Record<string, string> = {
              'clear_line': '🧹',
              'clear_4': '💣',
              'slow_drop': '🐌',
              'score2x': '✨',
              'preview': '👁️'
            }
            ctx.font = '10px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText(icons[powerup] || '?', 
              OFFSET_X + x * BLOCK + BLOCK / 2,
              OFFSET_Y + y * BLOCK + BLOCK / 2 + 3)
          }
          
          ctx.shadowBlur = 0
        }
      }
    }

    // 绘制当前方块
    if (current) {
      ctx.shadowBlur = 15
      ctx.shadowColor = current.color
      for (let y = 0; y < current.blocks.length; y++) {
        for (let x = 0; x < current.blocks[y].length; x++) {
          if (current.blocks[y][x]) {
            const px = OFFSET_X + (current.x + x) * BLOCK
            const py = OFFSET_Y + (current.y + y) * BLOCK
            ctx.fillStyle = current.color
            ctx.fillRect(px + 2, py + 2, BLOCK - 4, BLOCK - 4)
          }
        }
      }
      ctx.shadowBlur = 0
    }

    // 绘制粒子
    particles.forEach((p, i) => {
      p.life -= 0.02
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.1
      
      if (p.life <= 0) { particles.splice(i, 1); return }
      
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })

    // UI
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 24px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(score), W / 4, 35)
    
    ctx.font = '14px sans-serif'
    ctx.fillText(`行: ${lines}`, W / 4, 55)
    ctx.fillText(`等级: ${level}`, W / 4, 75)
    
    // 显示激活的道具状态
    const now = Date.now()
    let statusY = 95
    
    if ((window as any).tetrisSlowDrop && now < (window as any).tetrisSlowDrop) {
      const remaining = Math.ceil(((window as any).tetrisSlowDrop - now) / 1000)
      ctx.fillStyle = '#4ECDC4'
      ctx.fillText(`🐌 减速: ${remaining}s`, W / 4, statusY)
      statusY += 20
    }
    
    if ((window as any).tetrisScore2x && now < (window as any).tetrisScore2x) {
      const remaining = Math.ceil(((window as any).tetrisScore2x - now) / 1000)
      ctx.fillStyle = '#FFD700'
      ctx.fillText(`✨ 双倍分数: ${remaining}s`, W / 4, statusY)
      statusY += 20
    }
    
    if ((window as any).tetrisPreview && now < (window as any).tetrisPreview) {
      const remaining = Math.ceil(((window as any).tetrisPreview - now) / 1000)
      ctx.fillStyle = '#9B59B6'
      ctx.fillText(`👁️ 预览: ${remaining}s`, W / 4, statusY)
      statusY += 20
    }

    // 下一个方块预览
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('NEXT', W - 20, 35)
    
    if (nextShape) {
      // 如果激活了预览道具，高亮显示
      if ((window as any).tetrisPreview && Date.now() < (window as any).tetrisPreview) {
        ctx.shadowBlur = 15
        ctx.shadowColor = '#FFD700'
      } else {
        ctx.shadowBlur = 10
      }
      ctx.shadowColor = nextShape.color
      for (let y = 0; y < nextShape.blocks.length; y++) {
        for (let x = 0; x < nextShape.blocks[y].length; x++) {
          if (nextShape.blocks[y][x]) {
            const px = W - 120 + x * 20
            const py = 50 + y * 20
            ctx.fillStyle = nextShape.color
            ctx.fillRect(px, py, 18, 18)
          }
        }
      }
      ctx.shadowBlur = 0
    }
  }

  function update() {
    gameTime += 0.016
    frameCount++ // 增加帧计数
    
    // 下落速度
    let dropSpeed = Math.max(100, 800 - level * 80)
    
    // 应用慢降效果
    if ((window as any).tetrisSlowDrop && Date.now() < (window as any).tetrisSlowDrop) {
      dropSpeed *= 2 // 速度减半
    }
    
    if (Date.now() - lastDrop > dropSpeed) {
      if (canPlace(current, 0, 1)) {
        current.y++
      } else {
        placeShape()
      }
      lastDrop = Date.now()
    }
  }

  // 控制
  document.onkeydown = (e) => {
    if (gameEnded) return
    switch (e.key) {
      case 'ArrowLeft':
        if (canPlace(current, -1, 0)) { current.x--; audioService.collect() }
        break
      case 'ArrowRight':
        if (canPlace(current, 1, 0)) { current.x++; audioService.collect() }
        break
      case 'ArrowDown':
        if (canPlace(current, 0, 1)) { current.y++; score += 1 }
        break
      case 'ArrowUp':
        rotate()
        break
      case ' ':
        while (canPlace(current, 0, 1)) { current.y++; score += 2 }
        placeShape()
        break
    }
  }

  canvas.onclick = (e) => {
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // 原有的控制逻辑
    if (x < W / 3 && canPlace(current, -1, 0)) { current.x--; audioService.collect() }
    else if (x > W * 2 / 3 && canPlace(current, 1, 0)) { current.x++; audioService.collect() }
    else rotate()
  }

  function loop() {
    if (!document.getElementById('mainGameCanvas')) return
    if (!gameEnded) {
      update()
    }
    draw()
    requestAnimationFrame(loop)
  }

  current = randomShape()
  nextShape = randomShape()
  
  // 初始化 HTML 道具栏
  updateHTMLPowerupBar()
  
  loop()
}
