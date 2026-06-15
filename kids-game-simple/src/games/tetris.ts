import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { createPowerupManager } from '../services/powerupManager'
import { app } from '../services/appBridge'
import { gameActions } from '../platform/gameBridge'
import type { GameLifecycle } from '../platform/GameLifecycle'
import { resolveGtrsCanvasStyle } from '../utils/gtrsCanvasTheme'
import { readGtrsSceneMeta } from '../utils/gtrsSceneMeta'
import type { GameLifecycleContext } from '../platform/GameLifecycle'
import { createLifecycleContext } from '../platform/frameworkSession'
import { hostCanvas2D } from '../platform/hostCanvas2D'

let activeHost: GameLifecycle | null = null

export function destroyTetris(): void {
  activeHost?.destroy()
  activeHost = null
}

export async function initTetris(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroyTetris()
  const lifecycleCtx = createLifecycleContext('tetris', engine, onEnd)
  if (!lifecycleCtx?.canvas) {
    onEnd()
    return
  }
  activeHost = startTetrisLifecycle(lifecycleCtx)
}

function startTetrisLifecycle(lifecycleCtx: GameLifecycleContext): GameLifecycle {
  const canvas = lifecycleCtx.canvas!
  const engine = lifecycleCtx.engine
  
  // 响应式Canvas尺寸 - 手机端适配
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const W = isMobile ? Math.min(400, window.innerWidth * 0.85) : 400
  const H = isMobile ? Math.min(600, window.innerHeight * 0.6) : 600
  
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  
  // 设置Canvas实际尺寸
  canvas.width = W
  canvas.height = H

  // 创建道具管理器
  const powerupManager = createPowerupManager('tetris')

  const COLS = 10
  const ROWS = 20
  const TETRIS_FALLBACK = {
    primary: '#4ECDC4',
    background: '#1a1a2e',
    backgroundDark: '#16213e',
    text: '#FFFFFF',
    accent: '#FFD93D',
    hudBg: 'rgba(0,0,0,0.45)',
    danger: '#FF6B6B',
    muted: '#B0B0B0',
    palette: ['#FF6B6B', '#FFD93D', '#4ECDC4', '#9B59B6', '#FF8E53', '#4D96FF', '#6BCB77'],
  }
  const gtrs = resolveGtrsCanvasStyle('tetris', TETRIS_FALLBACK)
  // 根据屏幕高度动态调整方块大小和偏移
  const TOP_MARGIN = isMobile ? 40 : 60
  const BLOCK = Math.floor((H - TOP_MARGIN * 2) / ROWS)
  const OFFSET_X = (W - COLS * BLOCK) / 2
  const OFFSET_Y = TOP_MARGIN

  const SHAPES = [
    { color: gtrs.palette[0] ?? '#FF6B6B', blocks: [[1,1,1,1]] },
    { color: gtrs.palette[1] ?? '#FFD93D', blocks: [[1,1],[1,1]] },
    { color: gtrs.palette[2] ?? '#4ECDC4', blocks: [[0,1,1],[1,1,0]] },
    { color: gtrs.palette[3] ?? '#9B59B6', blocks: [[1,1,0],[0,1,1]] },
    { color: gtrs.palette[4] ?? '#FF8E53', blocks: [[1,0,0],[1,1,1]] },
    { color: gtrs.palette[5] ?? '#4D96FF', blocks: [[0,0,1],[1,1,1]] },
    { color: gtrs.palette[6] ?? '#6BCB77', blocks: [[0,1,0],[1,1,1]] },
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
    // 暂时注释掉，因为App类中没有setupCustomPowerupBar方法
    // const powerups = Object.keys(powerupIcons).map(id => ({
    //   id,
    //   icon: powerupIcons[id],
    //   name: id
    // }))
    // 
    // app.setupCustomPowerupBar('tetris', powerups, inventory, (powerupId) => {
    //   if (usePowerup(powerupId)) {
    //     audioService.collect()
    //     updateHTMLPowerupBar() // 使用后更新
    //   }
    // })
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
      gameActions.addScore(points, W / 2, H / 2, 'tetris')
      audioService.win()
      
      if (lines >= 50) {
        gameEnded = true
        gameActions.gameOver({ victory: true, score: engine.getScore(), stats: { lines, level } })
      }
    }
    
    current = nextShape
    nextShape = randomShape()
    
    if (!canPlace(current)) {
      gameEnded = true
      gameActions.gameOver({ victory: false, score: engine.getScore(), stats: { lines, level } })
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
    grad.addColorStop(0, gtrs.background)
    grad.addColorStop(1, gtrs.backgroundDark)
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
    ctx.fillStyle = gtrs.text
    const fontSize = isMobile ? 18 : 24
    ctx.font = `bold ${fontSize}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(String(score), W / 4, TOP_MARGIN - 10)
    
    ctx.font = `${isMobile ? 12 : 14}px sans-serif`
    ctx.fillText(`行: ${lines}`, W / 4, TOP_MARGIN + 10)
    ctx.fillText(`等级: ${level}`, W / 4, TOP_MARGIN + 30)
    
    // 显示激活的道具状态
    const now = Date.now()
    let statusY = TOP_MARGIN + 50
    
    if ((window as any).tetrisSlowDrop && now < (window as any).tetrisSlowDrop) {
      const remaining = Math.ceil(((window as any).tetrisSlowDrop - now) / 1000)
      ctx.fillStyle = gtrs.primary
      ctx.fillText(`🐌 减速: ${remaining}s`, W / 4, statusY)
      statusY += isMobile ? 18 : 20
    }
    
    if ((window as any).tetrisScore2x && now < (window as any).tetrisScore2x) {
      const remaining = Math.ceil(((window as any).tetrisScore2x - now) / 1000)
      ctx.fillStyle = gtrs.accent
      ctx.fillText(`✨ 双倍分数: ${remaining}s`, W / 4, statusY)
      statusY += isMobile ? 18 : 20
    }
    
    if ((window as any).tetrisPreview && now < (window as any).tetrisPreview) {
      const remaining = Math.ceil(((window as any).tetrisPreview - now) / 1000)
      ctx.fillStyle = gtrs.muted
      ctx.fillText(`👁️ 预览: ${remaining}s`, W / 4, statusY)
      statusY += isMobile ? 18 : 20
    }

    // 下一个方块预览
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = `${isMobile ? 12 : 14}px sans-serif`
    ctx.textAlign = 'right'
    const previewX = isMobile ? W - 10 : W - 20
    const previewY = TOP_MARGIN - 10
    ctx.fillText('NEXT', previewX, previewY)
    
    if (nextShape) {
      // 如果激活了预览道具，高亮显示
      if ((window as any).tetrisPreview && Date.now() < (window as any).tetrisPreview) {
        ctx.shadowBlur = 15
        ctx.shadowColor = '#FFD700'
      } else {
        ctx.shadowBlur = 10
      }
      ctx.shadowColor = nextShape.color
      const previewBlockSize = isMobile ? 15 : 18
      const previewStartX = isMobile ? W - 90 : W - 120
      const previewStartY = TOP_MARGIN + 5
      for (let y = 0; y < nextShape.blocks.length; y++) {
        for (let x = 0; x < nextShape.blocks[y].length; x++) {
          if (nextShape.blocks[y][x]) {
            const px = previewStartX + x * (previewBlockSize + 2)
            const py = previewStartY + y * (previewBlockSize + 2)
            ctx.fillStyle = nextShape.color
            ctx.fillRect(px, py, previewBlockSize, previewBlockSize)
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

  // 控制 - 键盘
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

  // 鼠标/触摸控制
  let touchStartX = 0
  let touchStartY = 0
  let lastTouchTime = 0
  
  canvas.onclick = (e) => {
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // 原有的控制逻辑
    if (x < W / 3 && canPlace(current, -1, 0)) { current.x--; audioService.collect() }
    else if (x > W * 2 / 3 && canPlace(current, 1, 0)) { current.x++; audioService.collect() }
    else rotate()
  }
  
  // 触摸事件处理
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault()
    const touch = e.touches[0]
    const rect = canvas.getBoundingClientRect()
    touchStartX = touch.clientX - rect.left
    touchStartY = touch.clientY - rect.top
    lastTouchTime = Date.now()
  }, { passive: false })
  
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault()
    if (gameEnded) return
    
    const touch = e.touches[0]
    const rect = canvas.getBoundingClientRect()
    const touchX = touch.clientX - rect.left
    const touchY = touch.clientY - rect.top
    
    // 计算滑动距离
    const deltaX = touchX - touchStartX
    const deltaY = touchY - touchStartY
    
    // 水平滑动超过阈值时移动方块
    if (Math.abs(deltaX) > 30) {
      if (deltaX > 0 && canPlace(current, 1, 0)) {
        current.x++
        audioService.collect()
        touchStartX = touchX // 重置起点以支持连续滑动
      } else if (deltaX < 0 && canPlace(current, -1, 0)) {
        current.x--
        audioService.collect()
        touchStartX = touchX
      }
    }
    
    // 垂直向下滑动加速下落
    if (deltaY > 30 && canPlace(current, 0, 1)) {
      current.y++
      score += 1
      touchStartY = touchY
    }
  }, { passive: false })
  
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault()
    if (gameEnded) return
    
    const touch = e.changedTouches[0]
    const rect = canvas.getBoundingClientRect()
    const touchEndX = touch.clientX - rect.left
    const touchEndY = touch.clientY - rect.top
    
    // 检测是否为快速点击（非滑动）
    const timeDiff = Date.now() - lastTouchTime
    const distDiff = Math.sqrt(
      Math.pow(touchEndX - touchStartX, 2) + 
      Math.pow(touchEndY - touchStartY, 2)
    )
    
    // 如果是快速点击且移动距离小，则旋转方块
    if (timeDiff < 200 && distDiff < 10) {
      rotate()
    }
  }, { passive: false })
  
  // 手机端添加虚拟按钮
  if (isMobile) {
    createMobileControls(canvas, W, H)
  }
  
  // 创建手机端虚拟控制按钮
  function createMobileControls(canvas: HTMLCanvasElement, W: number, H: number) {
    // 清除可能存在的旧按钮
    const existingButtons = document.querySelectorAll('.tetris-mobile-btn')
    existingButtons.forEach(btn => btn.remove())
    
    // 创建按钮容器
    const buttonContainer = document.createElement('div')
    buttonContainer.className = 'tetris-mobile-controls'
    buttonContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
      z-index: 1000;
      pointer-events: auto;
    `
    
    // 左移按钮
    const leftBtn = document.createElement('button')
    leftBtn.className = 'tetris-mobile-btn'
    leftBtn.innerHTML = '⬅️'
    leftBtn.style.cssText = `
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(77, 150, 255, 0.8);
      color: white;
      font-size: 24px;
      border: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      touch-action: manipulation;
    `
    
    // 右移按钮
    const rightBtn = document.createElement('button')
    rightBtn.className = 'tetris-mobile-btn'
    rightBtn.innerHTML = '➡️'
    rightBtn.style.cssText = `
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(77, 150, 255, 0.8);
      color: white;
      font-size: 24px;
      border: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      touch-action: manipulation;
    `
    
    // 旋转按钮
    const rotateBtn = document.createElement('button')
    rotateBtn.className = 'tetris-mobile-btn'
    rotateBtn.innerHTML = '🔄'
    rotateBtn.style.cssText = `
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(255, 107, 107, 0.8);
      color: white;
      font-size: 24px;
      border: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      touch-action: manipulation;
    `
    
    // 快速下落按钮
    const dropBtn = document.createElement('button')
    dropBtn.className = 'tetris-mobile-btn'
    dropBtn.innerHTML = '⬇️'
    dropBtn.style.cssText = `
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(107, 203, 119, 0.8);
      color: white;
      font-size: 24px;
      border: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      touch-action: manipulation;
    `
    
    // 绑定事件
    leftBtn.addEventListener('touchstart', (e) => {
      e.preventDefault()
      if (!gameEnded && canPlace(current, -1, 0)) {
        current.x--
        audioService.collect()
      }
    })
    
    rightBtn.addEventListener('touchstart', (e) => {
      e.preventDefault()
      if (!gameEnded && canPlace(current, 1, 0)) {
        current.x++
        audioService.collect()
      }
    })
    
    rotateBtn.addEventListener('touchstart', (e) => {
      e.preventDefault()
      if (!gameEnded) {
        rotate()
      }
    })
    
    dropBtn.addEventListener('touchstart', (e) => {
      e.preventDefault()
      if (!gameEnded) {
        while (canPlace(current, 0, 1)) {
          current.y++
          score += 2
        }
        placeShape()
      }
    })
    
    // 添加到页面
    buttonContainer.appendChild(leftBtn)
    buttonContainer.appendChild(rightBtn)
    buttonContainer.appendChild(rotateBtn)
    buttonContainer.appendChild(dropBtn)
    document.body.appendChild(buttonContainer)
    
  }

  let mobileControlRoot: HTMLElement | null = null

  function teardownTetrisInput() {
    document.onkeydown = null
    canvas.onclick = null
    mobileControlRoot?.remove()
    mobileControlRoot = null
    document.querySelectorAll('.tetris-mobile-btn').forEach(btn => btn.remove())
    document.querySelectorAll('.tetris-mobile-controls').forEach(el => el.remove())
  }

  current = randomShape()
  nextShape = randomShape()

  return hostCanvas2D(lifecycleCtx, {
    onInit() {
      if (isMobile) {
        createMobileControls(canvas, W, H)
        mobileControlRoot = document.querySelector('.tetris-mobile-controls')
      }
    },
    onUpdate(_dt) {
      if (!gameEnded) update()
    },
    onRender() {
      draw()
    },
    onDestroy() {
      teardownTetrisInput()
      app.removePowerupBar?.()
    },
  })
}
