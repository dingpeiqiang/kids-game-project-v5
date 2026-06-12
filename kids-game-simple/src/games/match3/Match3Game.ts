import type { GameEngine } from '../../services/gameEngine'
import { audioService } from '../../services/audio'
import { bindCanvasEvents, getPointerPos, resizeCanvasForMobile, injectMobileStyles } from '../../utils/mobileHelper'

export function initMatch3(engine: GameEngine, onEnd: () => void) {
  console.log('[Match3] 游戏初始化开始')
  
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  if (!canvas) {
    console.error('[Match3] Canvas not found!')
    return
  }
  
  const W = 400, H = 600
  const ctx = canvas.getContext('2d')!
  if (!ctx) {
    console.error('[Match3] Cannot get 2D context!')
    return
  }
  ctx.imageSmoothingEnabled = true
  
  // 游戏配置
  const COLS = 6
  const ROWS = 8
  const GEM_SIZE = 52
  const GAP = 4
  const OFFSET_X = (W - COLS * (GEM_SIZE + GAP)) / 2
  const OFFSET_Y = 85
  
  // 宝石类型定义
  const GEM_TYPES = [
    { color: '#FF4444', glow: '#FF6666', emoji: '💎' },  // 红宝石
    { color: '#FF8C00', glow: '#FFAA33', emoji: '🔶' },  // 橙宝石
    { color: '#FFD700', glow: '#FFEC8B', emoji: '⭐' },  // 黄宝石
    { color: '#32CD32', glow: '#90EE90', emoji: '💚' },  // 绿宝石
    { color: '#1E90FF', glow: '#87CEEB', emoji: '💙' },  // 蓝宝石
    { color: '#9932CC', glow: '#DA70D6', emoji: '💜' },  // 紫宝石
  ]
  
  // 游戏状态
  let board: any[][] = []
  let selected: { x: number; y: number } | null = null
  let animating = false
  let particles: any[] = []
  let matchChain = 0
  let lastMoveTime = Date.now()
  const MOVE_TIMEOUT = 45000
  let gameEnded = false
  
  // 初始化棋盘
  function initBoard() {
    board = []
    for (let y = 0; y < ROWS; y++) {
      board[y] = []
      for (let x = 0; x < COLS; x++) {
        let type
        do {
          type = Math.floor(Math.random() * GEM_TYPES.length)
        } while (wouldMatch(x, y, type))
        board[y][x] = { type, scale: 1, offsetX: 0, offsetY: 0, bounce: 0 }
      }
    }
    
    // 验证棋盘完整性，确保没有空位
    validateBoard()
  }
  
  // 验证棋盘完整性
  function validateBoard() {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (!board[y][x] || board[y][x].type < 0) {
          console.warn(`[Match3] 发现空位: (${x}, ${y})，正在修复...`)
          board[y][x] = {
            type: Math.floor(Math.random() * GEM_TYPES.length),
            scale: 1,
            offsetX: 0,
            offsetY: 0,
            bounce: 0
          }
        }
      }
    }
  }
  
  // 检查是否会形成匹配
  function wouldMatch(x: number, y: number, type: number): boolean {
    if (x >= 2 && board[y][x-1]?.type === type && board[y][x-2]?.type === type) return true
    if (y >= 2 && board[y-1]?.[x]?.type === type && board[y-2]?.[x]?.type === type) return true
    return false
  }
  
  // 绘制单个宝石
  function drawGem(x: number, y: number, type: number, highlight: boolean, pulse: number = 0) {
    const gx = OFFSET_X + x * (GEM_SIZE + GAP) + GEM_SIZE / 2
    const gy = OFFSET_Y + y * (GEM_SIZE + GAP) + GEM_SIZE / 2
    const gem = board[y]?.[x]
    
    const displayX = x + (gem?.offsetX ? gem.offsetX / (GEM_SIZE + GAP) : 0)
    const displayY = y + (gem?.offsetY ? gem.offsetY / (GEM_SIZE + GAP) : 0)
    
    const finalGx = OFFSET_X + displayX * (GEM_SIZE + GAP) + GEM_SIZE / 2
    const finalGy = OFFSET_Y + displayY * (GEM_SIZE + GAP) + GEM_SIZE / 2
    
    const gemType = GEM_TYPES[type]
    const size = (GEM_SIZE + pulse) * (gem?.scale || 1)
    
    // 选中高亮效果
    if (highlight) {
      ctx.shadowBlur = 20
      ctx.shadowColor = 'rgba(255,215,0,0.6)'
      ctx.strokeStyle = 'rgba(255,215,0,0.7)'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(finalGx, finalGy, size * 0.52, 0, Math.PI * 2)
      ctx.stroke()
      ctx.shadowBlur = 0
    }
    
    // 宝石阴影
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    ctx.beginPath()
    ctx.arc(finalGx + 2, finalGy + 2, size * 0.43, 0, Math.PI * 2)
    ctx.fill()
    
    // 宝石主体渐变
    const outerGrad = ctx.createRadialGradient(
      finalGx - size * 0.1, finalGy - size * 0.1, 0,
      finalGx, finalGy, size * 0.45
    )
    outerGrad.addColorStop(0, highlight ? '#FFF8DC' : gemType.color)
    outerGrad.addColorStop(0.6, gemType.color)
    outerGrad.addColorStop(1, shadeColor(gemType.color, -25))
    
    ctx.fillStyle = outerGrad
    ctx.beginPath()
    ctx.arc(finalGx, finalGy, size * 0.43, 0, Math.PI * 2)
    ctx.fill()
    
    // 内部高光
    const innerGrad = ctx.createRadialGradient(
      finalGx - size * 0.15, finalGy - size * 0.15, 0,
      finalGx, finalGy, size * 0.3
    )
    innerGrad.addColorStop(0, 'rgba(255,255,255,0.6)')
    innerGrad.addColorStop(0.6, 'rgba(255,255,255,0.2)')
    innerGrad.addColorStop(1, 'rgba(255,255,255,0)')
    
    ctx.fillStyle = innerGrad
    ctx.beginPath()
    ctx.arc(finalGx, finalGy, size * 0.3, 0, Math.PI * 2)
    ctx.fill()
    
    // 顶部高光点
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.beginPath()
    ctx.arc(finalGx - size * 0.12, finalGy - size * 0.15, size * 0.08, 0, Math.PI * 2)
    ctx.fill()
    
    // 边框
    ctx.strokeStyle = highlight ? 'rgba(255,215,0,0.8)' : shadeColor(gemType.color, 20)
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(finalGx, finalGy, size * 0.43, 0, Math.PI * 2)
    ctx.stroke()
  }
  
  // 颜色明暗处理
  function shadeColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.min(255, Math.max(0, (num >> 16) + amt))
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt))
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt))
    return `rgb(${R},${G},${B})`
  }
  
  // 绘制背景
  function drawBackground() {
    const bgGrad = ctx.createLinearGradient(0, 0, W, H)
    bgGrad.addColorStop(0, '#0f0c29')
    bgGrad.addColorStop(0.5, '#302b63')
    bgGrad.addColorStop(1, '#24243e')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)
    
    // 动态星空
    for (let i = 0; i < 50; i++) {
      const alpha = 0.3 + Math.sin(Date.now() * 0.001 + i) * 0.2
      ctx.fillStyle = `rgba(255,255,255,${alpha})`
      ctx.beginPath()
      ctx.arc((i * 73) % W, (i * 47) % H, 1 + (i % 2), 0, Math.PI * 2)
      ctx.fill()
    }
  }
  
  // 绘制UI
  function drawUI() {
    const elapsedHud = Date.now() - lastMoveTime
    const remainingHud = Math.max(0, MOVE_TIMEOUT - elapsedHud)
    const secondsHud = Math.ceil(remainingHud / 1000)
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.beginPath()
    ctx.roundRect(10, 8, W - 20, 36, 10)
    ctx.fill()
    ctx.fillStyle = secondsHud <= 10 ? '#FF6B6B' : '#A29BFE'
    ctx.font = 'bold 15px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const chainLabel = matchChain >= 2 ? ` · 连锁 ×${matchChain}` : ''
    ctx.fillText(`⏱ 无操作 ${secondsHud} 秒${chainLabel}`, W / 2, 26)

    // 棋盘背景
    const boardW = COLS * (GEM_SIZE + GAP) + 30
    const boardH = ROWS * (GEM_SIZE + GAP) + 30
    const boardX = OFFSET_X - 15
    const boardY = OFFSET_Y - 15
    
    ctx.shadowBlur = 30
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    ctx.beginPath()
    ctx.roundRect(boardX, boardY, boardW, boardH, 20)
    ctx.fill()
    ctx.shadowBlur = 0
    
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // 内部网格线
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    for (let x = 0; x <= COLS; x++) {
      const lineX = OFFSET_X + x * (GEM_SIZE + GAP) - GAP / 2
      ctx.beginPath()
      ctx.moveTo(lineX, OFFSET_Y)
      ctx.lineTo(lineX, OFFSET_Y + ROWS * (GEM_SIZE + GAP))
      ctx.stroke()
    }
    for (let y = 0; y <= ROWS; y++) {
      const lineY = OFFSET_Y + y * (GEM_SIZE + GAP) - GAP / 2
      ctx.beginPath()
      ctx.moveTo(OFFSET_X, lineY)
      ctx.lineTo(OFFSET_X + COLS * (GEM_SIZE + GAP), lineY)
      ctx.stroke()
    }
  }
  
  // 绘制宝石
  function drawGems() {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const gem = board[y]?.[x]
        if (!gem || gem.type < 0) continue
        
        const isSelected = selected?.x === x && selected?.y === y
        const pulse = isSelected ? Math.sin(Date.now() / 150) * 5 : 0
        
        drawGem(x, y, gem.type, isSelected, pulse)
      }
    }
  }
  
  // 绘制粒子效果
  function drawParticles() {
    particles.forEach((p, i) => {
      p.life -= 0.025
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.15
      
      if (p.life <= 0) { particles.splice(i, 1); return }
      
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.shadowBlur = 15
      ctx.shadowColor = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    })
  }
  
  // 绘制倒计时
  function drawTimer() {
    const elapsed = Date.now() - lastMoveTime
    const remaining = Math.max(0, MOVE_TIMEOUT - elapsed)
    const seconds = Math.ceil(remaining / 1000)
    const progress = remaining / MOVE_TIMEOUT
    
    const barWidth = 150
    const barHeight = 8
    const boardBottom = OFFSET_Y + ROWS * (GEM_SIZE + GAP) + 20
    const barX = W / 2 - barWidth / 2
    const barY = boardBottom + 10
    
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.beginPath()
    ctx.roundRect(barX, barY, barWidth, barHeight, 4)
    ctx.fill()
    
    const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0)
    if (seconds <= 10) {
      gradient.addColorStop(0, '#FF4444')
      gradient.addColorStop(1, '#FF6B6B')
    } else {
      gradient.addColorStop(0, '#4ECDC4')
      gradient.addColorStop(1, '#44A08D')
    }
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.roundRect(barX, barY, barWidth * progress, barHeight, 4)
    ctx.fill()
    
    // 底部提示
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '13px sans-serif'
    ctx.fillText('💎 点击选中宝石，再点击相邻宝石交换', W / 2, H - 25)
  }
  
  // 主绘制函数
  function draw() {
    drawBackground()
    drawUI()
    drawGems()
    drawParticles()
    drawTimer()
  }
  
  // 尝试交换宝石
  async function trySwap(x1: number, y1: number, x2: number, y2: number): Promise<boolean> {
    const gem1 = board[y1][x1]
    const gem2 = board[y2][x2]
    
    if (!gem1 || !gem2) return false
    
    const distance = GEM_SIZE + GAP
    
    if (x2 > x1) {
      gem1.offsetX = distance
      gem2.offsetX = -distance
    } else if (x2 < x1) {
      gem1.offsetX = -distance
      gem2.offsetX = distance
    } else if (y2 > y1) {
      gem1.offsetY = distance
      gem2.offsetY = -distance
    } else if (y2 < y1) {
      gem1.offsetY = -distance
      gem2.offsetY = distance
    }
    
    for (let i = 0; i < 10; i++) {
      if (gem1.offsetX) gem1.offsetX *= 0.75
      if (gem1.offsetY) gem1.offsetY *= 0.75
      if (gem2.offsetX) gem2.offsetX *= 0.75
      if (gem2.offsetY) gem2.offsetY *= 0.75
      
      if (Math.abs(gem1.offsetX || 0) < 1 && Math.abs(gem1.offsetY || 0) < 1 &&
          Math.abs(gem2.offsetX || 0) < 1 && Math.abs(gem2.offsetY || 0) < 1) {
        break
      }
      await new Promise(r => setTimeout(r, 20))
    }
    
    gem1.offsetX = 0
    gem1.offsetY = 0
    gem2.offsetX = 0
    gem2.offsetY = 0
    
    board[y1][x1] = gem2
    board[y2][x2] = gem1
    
    const matches = findMatches()
    if (matches.length > 0) {
      lastMoveTime = Date.now()
      matchChain = 1
      audioService.win()
      return true
    }
    
    board[y2][x2] = gem2
    board[y1][x1] = gem1
    
    if (x2 > x1) {
      gem1.offsetX = -distance
      gem2.offsetX = distance
    } else if (x2 < x1) {
      gem1.offsetX = distance
      gem2.offsetX = -distance
    } else if (y2 > y1) {
      gem1.offsetY = -distance
      gem2.offsetY = distance
    } else if (y2 < y1) {
      gem1.offsetY = distance
      gem2.offsetY = -distance
    }
    
    for (let i = 0; i < 10; i++) {
      if (gem1.offsetX) gem1.offsetX *= 0.75
      if (gem1.offsetY) gem1.offsetY *= 0.75
      if (gem2.offsetX) gem2.offsetX *= 0.75
      if (gem2.offsetY) gem2.offsetY *= 0.75
      
      if (Math.abs(gem1.offsetX || 0) < 1 && Math.abs(gem1.offsetY || 0) < 1 &&
          Math.abs(gem2.offsetX || 0) < 1 && Math.abs(gem2.offsetY || 0) < 1) {
        break
      }
      await new Promise(r => setTimeout(r, 20))
    }
    
    gem1.offsetX = 0
    gem1.offsetY = 0
    gem2.offsetX = 0
    gem2.offsetY = 0
    
    matchChain = 0
    engine.breakCombo()
    audioService.lose()
    return false
  }
  
  // 查找匹配
  function findMatches(): { x: number; y: number }[] {
    const matches = new Set<string>()
    
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS - 2; x++) {
        const t = board[y][x]?.type
        if (t >= 0 && t === board[y][x+1]?.type && t === board[y][x+2]?.type) {
          for (let i = 0; i < 3; i++) matches.add(`${x+i},${y}`)
        }
      }
    }
    
    for (let y = 0; y < ROWS - 2; y++) {
      for (let x = 0; x < COLS; x++) {
        const t = board[y][x]?.type
        if (t >= 0 && t === board[y+1]?.[x]?.type && t === board[y+2]?.[x]?.type) {
          for (let i = 0; i < 3; i++) matches.add(`${x},${y+i}`)
        }
      }
    }
    
    return Array.from(matches).map(s => {
      const [x, y] = s.split(',').map(Number)
      return { x, y }
    })
  }
  
  // 处理匹配消除
  async function processMatches(isCascade = false) {
    const matches = findMatches()
    if (matches.length === 0) {
      matchChain = 0
      return
    }
    if (isCascade) matchChain++

    const points = matches.length * 20 * Math.max(1, matchChain)
    engine.addScore(points, W / 2, H / 2)
    
    // 消除动画
    for (let i = 0; i < 10; i++) {
      matches.forEach(m => {
        const gem = board[m.y]?.[m.x]
        if (gem && gem.scale > 0.1) {
          gem.scale *= 0.85
        }
      })
      await new Promise(r => setTimeout(r, 30))
    }
    
    // 爆炸粒子
    matches.forEach(m => {
      const gem = board[m.y]?.[m.x]
      if (gem && gem.type >= 0) {
        const g = GEM_TYPES[gem.type]
        for (let i = 0; i < 10; i++) {
          const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.5
          particles.push({
            x: OFFSET_X + m.x * (GEM_SIZE + GAP) + GEM_SIZE / 2,
            y: OFFSET_Y + m.y * (GEM_SIZE + GAP) + GEM_SIZE / 2,
            vx: Math.cos(angle) * (3 + Math.random() * 3),
            vy: Math.sin(angle) * (3 + Math.random() * 3),
            life: 1,
            color: g.color,
            size: 4 + Math.random() * 3
          })
        }
        board[m.y][m.x] = { type: -1, scale: 1 }
      }
    })
    
    if (matchChain >= 3) engine.triggerRandomBuff()
    
    await new Promise(r => setTimeout(r, 200))
    
    // 下落填充
    for (let x = 0; x < COLS; x++) {
      let writeY = ROWS - 1
      // 从底部向上收集非空宝石
      for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y][x]?.type >= 0) {
          if (writeY !== y) {
            board[writeY][x] = { ...board[y][x], offsetY: (y - writeY) * (GEM_SIZE + GAP) }
            board[y][x] = { type: -1, scale: 1 }
          }
          writeY--
        }
      }
      // 在顶部空位生成新宝石，设置合适的下落距离
      for (let y = writeY; y >= 0; y--) {
        const dropDistance = (writeY - y + 1) * (GEM_SIZE + GAP)
        board[y][x] = { 
          type: Math.floor(Math.random() * GEM_TYPES.length),
          offsetY: -dropDistance,
          scale: 1,
          bounce: 0
        }
      }
    }
    
    // 下落动画
    for (let frame = 0; frame < 20; frame++) {
      let hasOffset = false
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const gem = board[y][x]
          if (gem && gem.offsetY !== undefined && gem.offsetY !== 0) {
            hasOffset = true
            gem.offsetY *= 0.75
            if (Math.abs(gem.offsetY) < 1) gem.offsetY = 0
          }
        }
      }
      if (!hasOffset) break
      await new Promise(r => setTimeout(r, 16))
    }
    
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (board[y][x]) board[y][x].offsetY = 0
      }
    }
    
    // 验证棋盘完整性，确保没有空位
    validateBoard()
    
    await new Promise(r => setTimeout(r, 150))
    processMatches(true)
  }
  
  // 点击处理
  const handleClick = async (e: MouseEvent | TouchEvent) => {
    if (animating || gameEnded) return
    
    const pos = getPointerPos(e, canvas)
    const mx = pos.x
    const my = pos.y
    
    const x = Math.floor((mx - OFFSET_X) / (GEM_SIZE + GAP))
    const y = Math.floor((my - OFFSET_Y) / (GEM_SIZE + GAP))
    
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return
    
    if (!selected) {
      selected = { x, y }
      audioService.collect()
    } else {
      const dx = Math.abs(x - selected.x)
      const dy = Math.abs(y - selected.y)
      
      if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
        animating = true
        const isValid = await trySwap(selected.x, selected.y, x, y)
        if (isValid) {
          await processMatches()
        }
        animating = false
      }
      selected = null
    }
  }
  
  // 检查超时
  function checkTimeout() {
    if (gameEnded) return
    if (Date.now() - lastMoveTime > MOVE_TIMEOUT) {
      engine.setVictory(false)
      engine.endGame()
      gameEnded = true
      audioService.lose()
      onEnd()
    }
  }
  
  // 游戏循环
  function loop() {
    if (!document.getElementById('mainGameCanvas') || gameEnded) return
    
    checkTimeout()
    draw()
    requestAnimationFrame(loop)
  }
  
  // 初始化
  resizeCanvasForMobile(canvas)
  injectMobileStyles()
  
  engine.start()
  initBoard()
  lastMoveTime = Date.now()
  
  bindCanvasEvents(canvas, handleClick as any)
  
  loop()
  
  console.log('[Match3] 游戏初始化完成')
}