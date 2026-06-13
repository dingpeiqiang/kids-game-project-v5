import type { GameEngine } from '../../services/gameEngine'
import { audioService } from '../../services/audio'
import { applyCanvasMobileStyles, bindCanvasPointerInput } from '../../utils/canvasMobileUtils'

export function createGame(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  if (!canvas) {
    console.error('[GemMatch] Canvas not found!')
    return
  }
  
  const ctx = canvas.getContext('2d')!
  if (!ctx) {
    console.error('[GemMatch] Cannot get 2D context!')
    return
  }
  
  const W = canvas.width
  const H = canvas.height
  
  const COLS = 6
  const ROWS = 8
  const GEM_SIZE = 55
  const GAP = 8
  
  const INFO_PANEL_HEIGHT = 60 // 信息面板高度
  const OFFSET_X = (W - COLS * (GEM_SIZE + GAP)) / 2
  const OFFSET_Y = INFO_PANEL_HEIGHT + ((H - INFO_PANEL_HEIGHT - ROWS * (GEM_SIZE + GAP)) / 2)

  const GEM_TYPES = [
    { emoji: '🐱', color: '#FFE4E1', light: '#FFF0F5', dark: '#FFB6C1', name: '猫咪' },
    { emoji: '🐶', color: '#E0F0FF', light: '#F0F8FF', dark: '#B8DBFF', name: '狗狗' },
    { emoji: '🐰', color: '#FFF0F5', light: '#FFFAFA', dark: '#FFCCD5', name: '兔子' },
    { emoji: '🦊', color: '#FFF5E6', light: '#FFFDF5', dark: '#FFE4B5', name: '狐狸' },
    { emoji: '🐨', color: '#F5F5F5', light: '#FAFAFA', dark: '#D8D8D8', name: '考拉' },
    { emoji: '🦄', color: '#F3E5F5', light: '#FDF5FF', dark: '#E1BEE7', name: '独角兽' },
  ]

  let board: any[][] = []
  let selected: { x: number; y: number } | null = null
  let animating = false
  let particles: any[] = []
  let combo = 0
  let lastMoveTime = Date.now()
  const MOVE_TIMEOUT = 45000
  let gameEnded = false
  let hintGem: { x: number; y: number; time: number } | null = null
  

  let level = 1
  let targetScore = 500
  
  // 拖拽相关状态
  let isDragging = false
  let dragStartGem: { x: number; y: number } | null = null
  const DRAG_THRESHOLD = 10 // 拖拽阈值（像素）
  
  type SpecialGemType = 'bomb' | 'rocket_h' | 'rocket_v' | 'rainbow'

  function checkAndCreateSpecialGem(matches: { x: number; y: number }[], count: number) {
    if (matches.length === 0) return
    
    if (count >= 4 && count < 5) {
      createSpecialGem(matches[Math.floor(matches.length / 2)], 'bomb')
    } else if (count >= 5 && count < 7) {
      const isHorizontal = Math.random() > 0.5
      createSpecialGem(matches[Math.floor(matches.length / 2)], isHorizontal ? 'rocket_h' : 'rocket_v')
    } else if (count >= 7) {
      createSpecialGem(matches[Math.floor(matches.length / 2)], 'rainbow')
    }
  }

  function createSpecialGem(pos: { x: number; y: number }, type: SpecialGemType) {
    const gem = board[pos.y]?.[pos.x]
    if (gem) {
      gem.special = type
      audioService.buff()
    }
  }

  async function triggerSpecialGem(x: number, y: number) {
    const gem = board[y]?.[x]
    if (!gem || !gem.special) return
    
    const specialType = gem.special
    gem.special = undefined
    
    switch (specialType) {
      case 'bomb':
        await triggerBombEffect(x, y)
        break
      case 'rocket_h':
        await triggerRocketEffect(x, y, 'horizontal')
        break
      case 'rocket_v':
        await triggerRocketEffect(x, y, 'vertical')
        break
      case 'rainbow':
        await triggerRainbowEffect(x, y)
        break
    }
  }

  async function triggerBombEffect(centerX: number, centerY: number) {
    const affected: { x: number; y: number }[] = []
    
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = centerX + dx
        const ny = centerY + dy
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && board[ny]?.[nx] && (board[ny][nx].type >= 0 || board[ny][nx].special)) {
          affected.push({ x: nx, y: ny })
        }
      }
    }
    
    affected.forEach(pos => {
      const g = board[pos.y][pos.x].type >= 0 ? GEM_TYPES[board[pos.y][pos.x].type] : GEM_TYPES[0]
      for (let i = 0; i < 15; i++) {
        const angle = (Math.PI * 2 * i) / 15 + Math.random() * 0.5
        particles.push({
          x: OFFSET_X + pos.x * (GEM_SIZE + GAP) + GEM_SIZE / 2,
          y: OFFSET_Y + pos.y * (GEM_SIZE + GAP) + GEM_SIZE / 2,
          vx: Math.cos(angle) * (5 + Math.random() * 3),
          vy: Math.sin(angle) * (5 + Math.random() * 3),
          life: 1,
          color: g.color,
          size: 6 + Math.random() * 4
        })
      }
      board[pos.y][pos.x] = { type: -1, scale: 1 }
    })
    
    engine.addScore(affected.length * 30, OFFSET_X + centerX * (GEM_SIZE + GAP) + GEM_SIZE / 2, OFFSET_Y + centerY * (GEM_SIZE + GAP) + GEM_SIZE / 2)
    audioService.win()
    
    await new Promise(r => setTimeout(r, 300))
    await applyGravityAndFill()
    await new Promise(r => setTimeout(r, 150))
    await processMatches()
  }

  async function triggerRocketEffect(x: number, y: number, direction: 'horizontal' | 'vertical') {
    const affected: { x: number; y: number }[] = []
    
    if (direction === 'horizontal') {
      for (let cx = 0; cx < COLS; cx++) {
        if (board[y]?.[cx] && (board[y][cx].type >= 0 || board[y][cx].special)) {
          affected.push({ x: cx, y })
        }
      }
    } else {
      for (let cy = 0; cy < ROWS; cy++) {
        if (board[cy]?.[x] && (board[cy][x].type >= 0 || board[cy][x].special)) {
          affected.push({ x, y: cy })
        }
      }
    }
    
    affected.forEach(pos => {
      const g = board[pos.y][pos.x].type >= 0 ? GEM_TYPES[board[pos.y][pos.x].type] : GEM_TYPES[0]
      for (let i = 0; i < 8; i++) {
        const angle = direction === 'horizontal' ? (Math.random() > 0.5 ? 0 : Math.PI) : (Math.random() > 0.5 ? Math.PI/2 : -Math.PI/2)
        particles.push({
          x: OFFSET_X + pos.x * (GEM_SIZE + GAP) + GEM_SIZE / 2,
          y: OFFSET_Y + pos.y * (GEM_SIZE + GAP) + GEM_SIZE / 2,
          vx: Math.cos(angle) * (6 + Math.random() * 4),
          vy: Math.sin(angle) * (6 + Math.random() * 4),
          life: 1,
          color: g.color,
          size: 5 + Math.random() * 3
        })
      }
      board[pos.y][pos.x] = { type: -1, scale: 1 }
    })
    
    engine.addScore(affected.length * 25, OFFSET_X + x * (GEM_SIZE + GAP) + GEM_SIZE / 2, OFFSET_Y + y * (GEM_SIZE + GAP) + GEM_SIZE / 2)
    audioService.win()
    
    await new Promise(r => setTimeout(r, 300))
    await applyGravityAndFill()
    await new Promise(r => setTimeout(r, 150))
    await processMatches()
  }

  async function triggerRainbowEffect(x: number, y: number) {
    const targetType = board[y]?.[x]?.type
    let foundTarget = false
    
    const affected: { x: number; y: number }[] = []
    
    for (let cy = 0; cy < ROWS; cy++) {
      for (let cx = 0; cx < COLS; cx++) {
        const gem = board[cy]?.[cx]
        if (gem) {
          if (gem.type >= 0 && (targetType === undefined || targetType < 0 || gem.type === targetType)) {
            affected.push({ x: cx, y: cy })
            foundTarget = true
          } else if (gem.special) {
            affected.push({ x: cx, y: cy })
          }
        }
      }
    }
    
    if (!foundTarget && GEM_TYPES.length > 0) {
      const randomType = Math.floor(Math.random() * GEM_TYPES.length)
      for (let cy = 0; cy < ROWS; cy++) {
        for (let cx = 0; cx < COLS; cx++) {
          if (board[cy]?.[cx]?.type === randomType) {
            affected.push({ x: cx, y: cy })
          }
        }
      }
    }
    
    affected.forEach(pos => {
      const g = board[pos.y][pos.x].type >= 0 ? GEM_TYPES[board[pos.y][pos.x].type] : GEM_TYPES[0]
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5
        particles.push({
          x: OFFSET_X + pos.x * (GEM_SIZE + GAP) + GEM_SIZE / 2,
          y: OFFSET_Y + pos.y * (GEM_SIZE + GAP) + GEM_SIZE / 2,
          vx: Math.cos(angle) * (4 + Math.random() * 3),
          vy: Math.sin(angle) * (4 + Math.random() * 3),
          life: 1,
          color: `hsl(${(Date.now() / 30 + i * 30) % 360}, 100%, 60%)`,
          size: 5 + Math.random() * 3
        })
      }
      board[pos.y][pos.x] = { type: -1, scale: 1 }
    })
    
    engine.addScore(affected.length * 40, OFFSET_X + x * (GEM_SIZE + GAP) + GEM_SIZE / 2, OFFSET_Y + y * (GEM_SIZE + GAP) + GEM_SIZE / 2)
    audioService.win()
    
    await new Promise(r => setTimeout(r, 300))
    await applyGravityAndFill()
    await new Promise(r => setTimeout(r, 150))
    await processMatches()
  }

  function initBoard() {
    board = []
    for (let y = 0; y < ROWS; y++) {
      board[y] = []
      for (let x = 0; x < COLS; x++) {
        let type: number
        do {
          type = Math.floor(Math.random() * GEM_TYPES.length)
        } while (wouldMatch(x, y, type))
        board[y][x] = { type, scale: 1, offsetX: 0, offsetY: 0 }
      }
    }
  }

  function wouldMatch(x: number, y: number, type: number): boolean {
    if (x >= 2) {
      if (board[y][x-1]?.type === type && board[y][x-2]?.type === type) return true
    }
    if (y >= 2) {
      if (board[y-1]?.[x]?.type === type && board[y-2]?.[x]?.type === type) return true
    }
    return false
  }

  function drawGem(x: number, y: number, type: number, highlight: boolean, pulse: number) {
    const gem = board[y][x]
    if (!gem) return
    
    const gemType = GEM_TYPES[type]
    const halfSize = GEM_SIZE / 2
    const finalGx = OFFSET_X + x * (GEM_SIZE + GAP) + halfSize + (gem.offsetX || 0)
    const finalGy = OFFSET_Y + y * (GEM_SIZE + GAP) + halfSize + (gem.offsetY || 0)
    const finalSize = halfSize * (gem.scale || 1) + pulse

    if (highlight) {
      const glowPulse = 0.8 + Math.sin(Date.now() * 0.005) * 0.2
      ctx.shadowBlur = 20 * glowPulse
      ctx.shadowColor = 'rgba(255, 215, 0, 0.5)'
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.roundRect(finalGx - finalSize - 3, finalGy - finalSize - 3, (finalSize + 3) * 2, (finalSize + 3) * 2, 14)
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    ctx.beginPath()
    ctx.roundRect(finalGx - finalSize + 2, finalGy - finalSize + 2, finalSize * 2, finalSize * 2, 12)
    ctx.fill()

    const bodyGrad = ctx.createRadialGradient(
      finalGx - finalSize * 0.3, finalGy - finalSize * 0.3, 0,
      finalGx, finalGy, finalSize
    )
    bodyGrad.addColorStop(0, gemType.light)
    bodyGrad.addColorStop(0.5, gemType.color)
    bodyGrad.addColorStop(1, gemType.dark)

    ctx.fillStyle = bodyGrad
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    ctx.roundRect(finalGx - finalSize, finalGy - finalSize, finalSize * 2, finalSize * 2, 12)
    ctx.fill()
    ctx.globalAlpha = 1

    const bigHighlight = ctx.createRadialGradient(
      finalGx - finalSize * 0.4, finalGy - finalSize * 0.4, 0,
      finalGx, finalGy, finalSize * 0.7
    )
    bigHighlight.addColorStop(0, 'rgba(255,255,255,0.7)')
    bigHighlight.addColorStop(0.5, 'rgba(255,255,255,0.2)')
    bigHighlight.addColorStop(1, 'rgba(255,255,255,0)')
    
    ctx.fillStyle = bigHighlight
    ctx.beginPath()
    ctx.roundRect(finalGx - finalSize * 0.9, finalGy - finalSize * 0.9, finalSize * 1.8, finalSize * 1.8, 10)
    ctx.fill()

    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.beginPath()
    ctx.arc(finalGx - finalSize * 0.25, finalGy - finalSize * 0.25, finalSize * 0.18, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(finalGx - finalSize, finalGy - finalSize, finalSize * 2, finalSize * 2, 12)
    ctx.stroke()

    ctx.strokeStyle = highlight ? 'rgba(255, 215, 0, 0.9)' : gemType.dark
    ctx.lineWidth = highlight ? 2.5 : 1.5
    ctx.beginPath()
    ctx.roundRect(finalGx - finalSize, finalGy - finalSize, finalSize * 2, finalSize * 2, 12)
    ctx.stroke()

    ctx.font = `${Math.floor(finalSize * 1.3)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(gemType.emoji, finalGx, finalGy)
    
    if (gem.special) {
      drawSpecialGemIndicator(gem.special, finalGx, finalGy, finalSize)
    }
  }

  function drawSpecialGemIndicator(type: string, cx: number, cy: number, size: number) {
    ctx.save()
    
    const pulse = 0.8 + Math.sin(Date.now() * 0.005) * 0.2
    
    switch (type) {
      case 'bomb':
        ctx.beginPath()
        ctx.arc(cx, cy + size * 0.3, size * 0.35, 0, Math.PI * 2)
        ctx.fillStyle = '#333'
        ctx.fill()
        ctx.strokeStyle = '#FF6B6B'
        ctx.lineWidth = 2 * pulse
        ctx.stroke()
        
        ctx.fillStyle = '#FFD700'
        for (let i = 0; i < 4; i++) {
          const angle = (Math.PI * 2 * i) / 4
          ctx.beginPath()
          ctx.moveTo(cx, cy + size * 0.3)
          ctx.lineTo(
            cx + Math.cos(angle) * size * 0.5,
            cy + size * 0.3 + Math.sin(angle) * size * 0.5
          )
          ctx.strokeStyle = '#FFD700'
          ctx.lineWidth = 2
          ctx.stroke()
        }
        break
        
      case 'rocket_h':
      case 'rocket_v':
        ctx.fillStyle = '#FF4500'
        ctx.beginPath()
        if (type === 'rocket_h') {
          ctx.moveTo(cx - size * 0.4, cy)
          ctx.lineTo(cx + size * 0.4, cy - size * 0.2)
          ctx.lineTo(cx + size * 0.4, cy + size * 0.2)
          ctx.closePath()
        } else {
          ctx.moveTo(cx, cy - size * 0.4)
          ctx.lineTo(cx - size * 0.2, cy + size * 0.4)
          ctx.lineTo(cx + size * 0.2, cy + size * 0.4)
          ctx.closePath()
        }
        ctx.fill()
        
        ctx.fillStyle = '#FFD700'
        if (type === 'rocket_h') {
          ctx.beginPath()
          ctx.moveTo(cx - size * 0.4, cy)
          ctx.lineTo(cx - size * 0.6, cy - size * 0.15)
          ctx.lineTo(cx - size * 0.6, cy + size * 0.15)
          ctx.closePath()
        } else {
          ctx.beginPath()
          ctx.moveTo(cx, cy + size * 0.4)
          ctx.lineTo(cx - size * 0.15, cy + size * 0.6)
          ctx.lineTo(cx + size * 0.15, cy + size * 0.6)
          ctx.closePath()
        }
        ctx.fill()
        break
        
      case 'rainbow':
        ctx.strokeStyle = '#FF0000'
        ctx.lineWidth = 2 * pulse
        ctx.beginPath()
        ctx.arc(cx, cy + size * 0.3, size * 0.4, Math.PI, 0)
        ctx.stroke()
        
        ctx.strokeStyle = '#FF7F00'
        ctx.beginPath()
        ctx.arc(cx, cy + size * 0.3, size * 0.35, Math.PI, 0)
        ctx.stroke()
        
        ctx.strokeStyle = '#FFFF00'
        ctx.beginPath()
        ctx.arc(cx, cy + size * 0.3, size * 0.3, Math.PI, 0)
        ctx.stroke()
        
        ctx.strokeStyle = '#00FF00'
        ctx.beginPath()
        ctx.arc(cx, cy + size * 0.3, size * 0.25, Math.PI, 0)
        ctx.stroke()
        
        ctx.strokeStyle = '#0000FF'
        ctx.beginPath()
        ctx.arc(cx, cy + size * 0.3, size * 0.2, Math.PI, 0)
        ctx.stroke()
        break
    }
    
    ctx.restore()
  }

  function drawClouds() {
    const time = Date.now() * 0.0003
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    
    const cloud1X = (50 + Math.sin(time) * 10) % W
    drawCloud(cloud1X, 60, 40)
    
    const cloud2X = (200 + Math.sin(time * 0.7) * 15) % W
    drawCloud(cloud2X, 100, 30)
    
    const cloud3X = (350 + Math.sin(time * 0.5) * 12) % W
    drawCloud(cloud3X, 40, 35)
  }
  
  function drawCloud(x: number, y: number, size: number) {
    ctx.beginPath()
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2)
    ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.4, 0, Math.PI * 2)
    ctx.arc(x + size * 0.8, y, size * 0.45, 0, Math.PI * 2)
    ctx.arc(x + size * 0.4, y + size * 0.15, size * 0.35, 0, Math.PI * 2)
    ctx.fill()
  }

  function draw() {
    const bgGrad = ctx.createLinearGradient(0, 0, W, H)
    bgGrad.addColorStop(0, '#FFE4E1')
    bgGrad.addColorStop(0.3, '#F0E68C')
    bgGrad.addColorStop(0.6, '#87CEEB')
    bgGrad.addColorStop(1, '#E6E6FA')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)
    
    drawClouds()

    const elapsedHud = Date.now() - lastMoveTime
    const remainingHud = Math.max(0, MOVE_TIMEOUT - elapsedHud)
    const secondsHud = Math.ceil(remainingHud / 1000)
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.beginPath()
    ctx.roundRect(10, 8, W - 20, 40, 10)
    ctx.fill()
    ctx.fillStyle = secondsHud <= 10 ? '#FF6B6B' : '#5D4037'
    ctx.font = 'bold 15px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const chainLabel = combo > 1 ? ` · 连锁×${combo}` : ''
    ctx.fillText(
      `关卡 ${level} · 目标 ${targetScore} · ⏱ ${secondsHud}s${chainLabel}`,
      W / 2,
      28,
    )

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

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const gem = board[y]?.[x]
        if (!gem || gem.type < 0) continue

        const isSelected = selected?.x === x && selected?.y === y
        const isHint = hintGem?.x === x && hintGem?.y === y
        const pulse = isHint ? Math.sin(Date.now() / 150) * 5 : 0

        drawGem(x, y, gem.type, isSelected, pulse)
      }
    }

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
    
    const barColor = progress > 0.3 ? '#4CAF50' : progress > 0.1 ? '#FF9800' : '#f44336'
    ctx.fillStyle = barColor
    ctx.beginPath()
    ctx.roundRect(barX, barY, barWidth * progress, barHeight, 4)
    ctx.fill()
    
  }

  function getGemAtPos(x: number, y: number) {
    const gemX = Math.floor((x - OFFSET_X) / (GEM_SIZE + GAP))
    const gemY = Math.floor((y - OFFSET_Y) / (GEM_SIZE + GAP))
    
    if (gemX >= 0 && gemX < COLS && gemY >= 0 && gemY < ROWS) {
      return { x: gemX, y: gemY }
    }
    return null
  }

  async function handleClick(x: number, y: number) {
    if (animating || gameEnded) return
    
    const gem = getGemAtPos(x, y)
    if (!gem) return
    
    if (!selected) {
      selected = gem
      audioService.click()
    } else if (selected.x === gem.x && selected.y === gem.y) {
      selected = null
    } else {
      const dx = Math.abs(selected.x - gem.x)
      const dy = Math.abs(selected.y - gem.y)
      
      if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
        animating = true
        const success = await trySwap(selected.x, selected.y, gem.x, gem.y)
        selected = null
        animating = false
        
        if (success) {
          combo = 0
          await processMatches()
          combo = 0
        }
      } else {
        selected = gem
        audioService.click()
      }
    }
  }

  let unbindPointer: (() => void) | null = null

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
      combo++
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
    
    audioService.lose()
    return false
  }

  function hasEmptySpaces(): boolean {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (board[y][x]?.type === -1) return true
      }
    }
    return false
  }

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

  async function applyGravityAndFill() {
    for (let x = 0; x < COLS; x++) {
      let writeY = ROWS - 1
      
      for (let y = ROWS - 1; y >= 0; y--) {
        const gem = board[y][x]
        if (gem && (gem.type >= 0 || gem.special)) {
          if (writeY !== y) {
            board[writeY][x] = { 
              ...gem, 
              offsetY: (y - writeY) * (GEM_SIZE + GAP)
            }
            board[y][x] = { type: -1, scale: 1 }
          }
          writeY--
        }
      }
      
      for (let y = writeY; y >= 0; y--) {
        const newType = Math.floor(Math.random() * GEM_TYPES.length)
        board[y][x] = { 
          type: newType, 
          scale: 1, 
          offsetY: -(writeY - y + 1) * (GEM_SIZE + GAP)
        }
      }
    }

    for (let frame = 0; frame < 15; frame++) {
      let hasMovement = false
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const gem = board[y][x]
          if (gem && gem.offsetY && gem.offsetY !== 0) {
            hasMovement = true
            gem.offsetY *= 0.7
            if (Math.abs(gem.offsetY) < 0.5) {
              gem.offsetY = 0
            }
          }
        }
      }
      if (!hasMovement) break
      await new Promise(r => setTimeout(r, 16))
    }

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (board[y][x]) {
          board[y][x].offsetY = 0
        }
      }
    }
  }

  async function processMatches() {
    const matches = findMatches()
    const hasEmpty = hasEmptySpaces()
    
    if (matches.length === 0 && !hasEmpty) return

    if (matches.length > 0) {
      checkAndCreateSpecialGem(matches, matches.length)

      let specialTriggered = false
      for (const m of matches) {
        const gem = board[m.y]?.[m.x]
        if (gem?.special) {
          await triggerSpecialGem(m.x, m.y)
          specialTriggered = true
          break
        }
      }
      
      if (specialTriggered) return

      const points = matches.length * 20 * (combo + 1)
      engine.addScore(points, W / 2, H / 2)

      if (engine.getScore() >= targetScore) {
        level++
        targetScore = Math.floor(targetScore * 1.5)
        audioService.buff()
      }

      for (let i = 0; i < 10; i++) {
        matches.forEach(m => {
          const gem = board[m.y]?.[m.x]
          if (gem && gem.scale > 0.1) {
            gem.scale *= 0.85
          }
        })
        await new Promise(r => setTimeout(r, 30))
      }

      matches.forEach(m => {
        const gem = board[m.y]?.[m.x]
        if (gem && (gem.type >= 0 || gem.special)) {
          const g = gem.type >= 0 ? GEM_TYPES[gem.type] : GEM_TYPES[0]
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

      if (combo >= 3) engine.triggerRandomBuff()

      await new Promise(r => setTimeout(r, 200))
    }

    await applyGravityAndFill()

    await new Promise(r => setTimeout(r, 150))
    
    const newMatches = findMatches()
    if (newMatches.length > 0) {
      processMatches()
    } else {
      combo = 0
    }
  }

  function gameLoop() {
    draw()
    if (!gameEnded) {
      requestAnimationFrame(gameLoop)
    }
  }

  function init() {
    initBoard()
    lastMoveTime = Date.now()
    gameEnded = false

    applyCanvasMobileStyles(canvas)
    unbindPointer = bindCanvasPointerInput(canvas, (x, y) => {
      void handleClick(x, y)
    })

    gameLoop()
  }

  function destroy() {
    unbindPointer?.()
    unbindPointer = null
    gameEnded = true
    onEnd()
  }

  init()

  return { destroy }
}