import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { app } from '../services/appBridge'
import { gameActions } from '../platform/gameBridge'
import type { GameLifecycle } from '../platform/GameLifecycle'
import type { GameLifecycleContext } from '../platform/GameLifecycle'
import { createLifecycleContext } from '../platform/frameworkSession'
import { hostCanvas2D } from '../platform/hostCanvas2D'
import { resizeCanvasForMobile, injectMobileStyles } from '../utils/mobileHelper'
import { bindCanvasPointerInput } from '../utils/canvasMobileUtils'
import { resolveGtrsCanvasStyle } from '../utils/gtrsCanvasTheme'

let activeHost: GameLifecycle | null = null

export function destroyJewelMatch(): void {
  activeHost?.destroy()
  activeHost = null
}

export async function initJewelMatch(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroyJewelMatch()
  const lifecycleCtx = createLifecycleContext('jewelMatch', engine, onEnd)
  if (!lifecycleCtx?.canvas) {
    onEnd()
    return
  }
  activeHost = startJewelMatchLifecycle(lifecycleCtx)
}

function startJewelMatchLifecycle(lifecycleCtx: GameLifecycleContext): GameLifecycle {
  const canvas = lifecycleCtx.canvas!
  const engine = lifecycleCtx.engine

  const W = 400
  const H = 600
  const ctx = canvas.getContext('2d')!
  if (!ctx) {
    throw new Error('[JewelMatch] Cannot get 2D context!')
  }
  ctx.imageSmoothingEnabled = true

  const COLS = 6  // 减少列数
  const ROWS = 8  // 减少行数
  const GEM_SIZE = 52  // 更大的宝石
  const GAP = 4  // 宝石间距
  const OFFSET_X = (W - COLS * (GEM_SIZE + GAP)) / 2
  const OFFSET_Y = 100

  const JELLY_FALLBACK = {
    primary: '#FFD700',
    background: '#1a1a2e',
    backgroundDark: '#0f3460',
    bgGradMid: '#16213e',
    text: '#FFFFFF',
    accent: '#FFD700',
    hudBg: 'rgba(255,255,255,0.6)',
    danger: '#FF4444',
    muted: '#666666',
    palette: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF9F43', '#FF69B4', '#9932CC'],
  }
  const gtrs = resolveGtrsCanvasStyle('jewelMatch', JELLY_FALLBACK)

  // 可爱动物主题宝石类型 - 更浅的颜色
  const GEM_TYPES = [
    { emoji: '🐱', color: gtrs.palette[0] ?? '#FFE4E1', light: '#FFF0F5', dark: '#FFB6C1', name: '猫咪' },
    { emoji: '🐶', color: gtrs.palette[1] ?? '#E0F0FF', light: '#F0F8FF', dark: '#B8DBFF', name: '狗狗' },
    { emoji: '🐰', color: gtrs.palette[2] ?? '#FFF0F5', light: '#FFFAFA', dark: '#FFCCD5', name: '兔子' },
    { emoji: '🦊', color: gtrs.palette[3] ?? '#FFF5E6', light: '#FFFDF5', dark: '#FFE4B5', name: '狐狸' },
    { emoji: '🐨', color: gtrs.palette[4] ?? '#F5F5F5', light: '#FAFAFA', dark: '#D8D8D8', name: '考拉' },
    { emoji: '🦄', color: gtrs.palette[5] ?? '#F3E5F5', light: '#FDF5FF', dark: '#E1BEE7', name: '独角兽' },
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
  
  // ====== 道具系统 ======
  let inventory: string[] = [] // 道具库存
  
  // 道具图标映射
  const powerupIcons: Record<string, string> = {
    'shuffle': '🔄',    // 洗牌 - 重新排列
    'hint': '💡'        // 提示 - 显示可消除组合
  }
  
  // 特殊道具类型（自动触发）
  type SpecialGemType = 'bomb' | 'rocket_h' | 'rocket_v' | 'rainbow'
  
  // 检查并生成特殊道具
  function checkAndCreateSpecialGem(matches: { x: number; y: number }[], count: number) {
    if (matches.length === 0) return
    
    // 4个消除生成炸弹
    if (count >= 4 && count < 5) {
      createSpecialGem(matches[Math.floor(matches.length / 2)], 'bomb')
    }
    // 5个消除生成火箭（随机方向）
    else if (count >= 5 && count < 7) {
      const isHorizontal = Math.random() > 0.5
      createSpecialGem(matches[Math.floor(matches.length / 2)], isHorizontal ? 'rocket_h' : 'rocket_v')
    }
    // 7个以上消除生成彩虹宝石
    else if (count >= 7) {
      createSpecialGem(matches[Math.floor(matches.length / 2)], 'rainbow')
    }
  }
  
  // 创建特殊道具
  function createSpecialGem(pos: { x: number; y: number }, type: SpecialGemType) {
    const gem = board[pos.y]?.[pos.x]
    if (gem) {
      gem.special = type
      audioService.buff()
    }
  }
  
  // 触发特殊道具效果
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
  
  // 炸弹效果 - 消除周围3x3区域
  async function triggerBombEffect(centerX: number, centerY: number) {
    const affected: { x: number; y: number }[] = []
    
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = centerX + dx
        const ny = centerY + dy
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && board[ny]?.[nx]?.type >= 0) {
          affected.push({ x: nx, y: ny })
        }
      }
    }
    
    // 添加爆炸粒子效果
    affected.forEach(pos => {
      const g = GEM_TYPES[board[pos.y][pos.x].type]
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
      board[pos.y][pos.x].type = -1
    })
    
    engine.addScore(affected.length * 30, OFFSET_X + centerX * (GEM_SIZE + GAP) + GEM_SIZE / 2, OFFSET_Y + centerY * (GEM_SIZE + GAP) + GEM_SIZE / 2)
    audioService.win()
    
    await new Promise(r => setTimeout(r, 300))
    await processMatches()
  }
  
  // 火箭效果 - 消除整行或整列
  async function triggerRocketEffect(x: number, y: number, direction: 'horizontal' | 'vertical') {
    const affected: { x: number; y: number }[] = []
    
    if (direction === 'horizontal') {
      for (let cx = 0; cx < COLS; cx++) {
        if (board[y]?.[cx]?.type >= 0) {
          affected.push({ x: cx, y })
        }
      }
    } else {
      for (let cy = 0; cy < ROWS; cy++) {
        if (board[cy]?.[x]?.type >= 0) {
          affected.push({ x, y: cy })
        }
      }
    }
    
    // 添加特效
    affected.forEach(pos => {
      const g = GEM_TYPES[board[pos.y][pos.x].type]
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
      board[pos.y][pos.x].type = -1
    })
    
    engine.addScore(affected.length * 25, OFFSET_X + x * (GEM_SIZE + GAP) + GEM_SIZE / 2, OFFSET_Y + y * (GEM_SIZE + GAP) + GEM_SIZE / 2)
    audioService.win()
    
    await new Promise(r => setTimeout(r, 300))
    await processMatches()
  }
  
  // 彩虹效果 - 消除所有同类型宝石
  async function triggerRainbowEffect(x: number, y: number) {
    const targetType = board[y]?.[x]?.type
    if (targetType === undefined || targetType < 0) return
    
    const affected: { x: number; y: number }[] = []
    
    for (let cy = 0; cy < ROWS; cy++) {
      for (let cx = 0; cx < COLS; cx++) {
        if (board[cy]?.[cx]?.type === targetType) {
          affected.push({ x: cx, y: cy })
        }
      }
    }
    
    // 添加彩虹特效
    affected.forEach(pos => {
      const g = GEM_TYPES[targetType]
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
      board[pos.y][pos.x].type = -1
    })
    
    engine.addScore(affected.length * 40, OFFSET_X + x * (GEM_SIZE + GAP) + GEM_SIZE / 2, OFFSET_Y + y * (GEM_SIZE + GAP) + GEM_SIZE / 2)
    audioService.win()
    
    await new Promise(r => setTimeout(r, 300))
    await processMatches()
  }
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id
    }))
    
    // 道具系统已移除 - 每个游戏有自己的道具获取逻辑
    //     app.setupCustomPowerupBar('jewelMatch', powerups, inventory, (powerupId) => {
    //       if (usePowerup(powerupId)) {
    //         audioService.collect()
    //         updateHTMLPowerupBar()
    //       }
    //     })
  }
  
  // 使用道具
  function usePowerup(type: string): boolean {
    const index = inventory.indexOf(type)
    if (index === -1) return false
    
    inventory.splice(index, 1)
    
    switch (type) {
      case 'shuffle':
        // 洗牌 - 随机重新排列
        const gems: any[] = []
        for (let y = 0; y < ROWS; y++) {
          for (let x = 0; x < COLS; x++) {
            if (board[y][x]) gems.push(board[y][x].type)
          }
        }
        // Fisher-Yates 洗牌
        for (let i = gems.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[gems[i], gems[j]] = [gems[j], gems[i]]
        }
        let idx = 0
        for (let y = 0; y < ROWS; y++) {
          for (let x = 0; x < COLS; x++) {
            if (idx < gems.length) {
              board[y][x] = { type: gems[idx], scale: 1, offsetX: 0, offsetY: 0, bounce: 0.5 }
              idx++
            }
          }
        }
        audioService.collect()
        break
        
      case 'hint':
        // 提示 - 高亮一个可消除的宝石
        const hint = findHint()
        if (hint) {
          hintGem = { x: hint.x, y: hint.y, time: Date.now() + 3000 }
          audioService.collect()
        }
        break
    }
    
    return true
  }
  
  // 查找提示
  function findHint(): { x: number; y: number } | null {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (!board[y][x]) continue
        // 检查向右交换
        if (x < COLS - 1 && board[y][x+1]) {
          const temp = board[y][x].type
          board[y][x].type = board[y][x+1].type
          board[y][x+1].type = temp
          const matches = findMatches()
          board[y][x+1].type = board[y][x].type
          board[y][x].type = temp
          if (matches.length > 0) {
            return { x, y }
          }
        }
        // 检查向下交换
        if (y < ROWS - 1 && board[y+1] && board[y+1][x]) {
          const temp = board[y][x].type
          board[y][x].type = board[y+1][x].type
          board[y+1][x].type = temp
          const matches = findMatches()
          board[y+1][x].type = board[y][x].type
          board[y][x].type = temp
          if (matches.length > 0) {
            return { x, y }
          }
        }
      }
    }
    return null
  }

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
  }

  function wouldMatch(x: number, y: number, type: number): boolean {
    if (x >= 2 && board[y][x-1]?.type === type && board[y][x-2]?.type === type) return true
    if (y >= 2 && board[y-1]?.[x]?.type === type && board[y-2]?.[x]?.type === type) return true
    return false
  }

  function drawGem(x: number, y: number, type: number, highlight: boolean, pulse: number = 0) {
    const gx = OFFSET_X + x * (GEM_SIZE + GAP) + GEM_SIZE / 2
    const gy = OFFSET_Y + y * (GEM_SIZE + GAP) + GEM_SIZE / 2
    const gem = board[y]?.[x]
    
    // 应用动画偏移
    const displayX = x + (gem?.offsetX ? gem.offsetX / (GEM_SIZE + GAP) : 0)
    const displayY = y + (gem?.offsetY ? gem.offsetY / (GEM_SIZE + GAP) : 0)
    
    const finalGx = OFFSET_X + displayX * (GEM_SIZE + GAP) + GEM_SIZE / 2
    const finalGy = OFFSET_Y + displayY * (GEM_SIZE + GAP) + GEM_SIZE / 2
    
    const gemType = GEM_TYPES[type]
    const size = (GEM_SIZE + pulse) * (gem?.scale || 1)
    const halfSize = size * 0.42
    
    // 选中时的柔和光环
    if (highlight) {
      const glowPulse = 1 + Math.sin(Date.now() * 0.005) * 0.15
      ctx.shadowBlur = 20 * glowPulse
      ctx.shadowColor = gtrs.accent
      ctx.strokeStyle = `${gtrs.accent}cc`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.roundRect(finalGx - halfSize - 3, finalGy - halfSize - 3, (halfSize + 3) * 2, (halfSize + 3) * 2, 14)
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // 柔和阴影
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    ctx.beginPath()
    ctx.roundRect(finalGx - halfSize + 2, finalGy - halfSize + 2, halfSize * 2, halfSize * 2, 12)
    ctx.fill()

    // 宝石主体（清新渐变）
    const bodyGrad = ctx.createRadialGradient(
      finalGx - halfSize * 0.3, finalGy - halfSize * 0.3, 0,
      finalGx, finalGy, halfSize
    )
    bodyGrad.addColorStop(0, gemType.light)
    bodyGrad.addColorStop(0.5, gemType.color)
    bodyGrad.addColorStop(1, gemType.dark)

    ctx.fillStyle = bodyGrad
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    ctx.roundRect(finalGx - halfSize, finalGy - halfSize, halfSize * 2, halfSize * 2, 12)
    ctx.fill()
    ctx.globalAlpha = 1

    // 大面积高光（清新感）
    const bigHighlight = ctx.createRadialGradient(
      finalGx - halfSize * 0.4, finalGy - halfSize * 0.4, 0,
      finalGx, finalGy, halfSize * 0.7
    )
    bigHighlight.addColorStop(0, 'rgba(255,255,255,0.7)')
    bigHighlight.addColorStop(0.5, 'rgba(255,255,255,0.2)')
    bigHighlight.addColorStop(1, 'rgba(255,255,255,0)')
    
    ctx.fillStyle = bigHighlight
    ctx.beginPath()
    ctx.roundRect(finalGx - halfSize * 0.9, finalGy - halfSize * 0.9, halfSize * 1.8, halfSize * 1.8, 10)
    ctx.fill()

    // 小高光点
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.beginPath()
    ctx.arc(finalGx - halfSize * 0.25, finalGy - halfSize * 0.25, halfSize * 0.18, 0, Math.PI * 2)
    ctx.fill()

    // 边缘高光
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(finalGx - halfSize, finalGy - halfSize, halfSize * 2, halfSize * 2, 12)
    ctx.stroke()

    // 边框（柔和颜色）
    ctx.strokeStyle = highlight ? `${gtrs.accent}e6` : gemType.dark
    ctx.lineWidth = highlight ? 2.5 : 1.5
    ctx.beginPath()
    ctx.roundRect(finalGx - halfSize, finalGy - halfSize, halfSize * 2, halfSize * 2, 12)
    ctx.stroke()

    // 可爱图标（emoji）
    ctx.font = `${Math.floor(halfSize * 1.3)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(gemType.emoji, finalGx, finalGy)
    
    // 特殊道具标识
    if (gem.special) {
      drawSpecialGemIndicator(gem.special, finalGx, finalGy, halfSize)
    }
  }
  
  // 绘制特殊道具标识
  function drawSpecialGemIndicator(type: string, cx: number, cy: number, size: number) {
    ctx.save()
    
    const pulse = 0.8 + Math.sin(Date.now() * 0.005) * 0.2
    
    switch (type) {
      case 'bomb':
        // 炸弹标识 - 黑色圆圈带火花
        ctx.beginPath()
        ctx.arc(cx, cy + size * 0.3, size * 0.35, 0, Math.PI * 2)
        ctx.fillStyle = '#333'
        ctx.fill()
        ctx.strokeStyle = '#FF6B6B'
        ctx.lineWidth = 2 * pulse
        ctx.stroke()
        
        // 火花
        ctx.fillStyle = gtrs.accent
        for (let i = 0; i < 4; i++) {
          const angle = (Math.PI * 2 * i) / 4
          ctx.beginPath()
          ctx.moveTo(cx, cy + size * 0.3)
          ctx.lineTo(
            cx + Math.cos(angle) * size * 0.5,
            cy + size * 0.3 + Math.sin(angle) * size * 0.5
          )
          ctx.strokeStyle = gtrs.accent
          ctx.lineWidth = 2
          ctx.stroke()
        }
        break
        
      case 'rocket_h':
      case 'rocket_v':
        // 火箭标识 - 箭头
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
        
        // 火焰
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
        // 彩虹标识 - 彩虹光环
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

  function shadeColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.min(255, Math.max(0, (num >> 16) + amt))
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt))
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt))
    return `rgb(${R},${G},${B})`
  }

  function drawClouds() {
    const time = Date.now() * 0.0003
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    
    // 云朵1
    const cloud1X = (50 + Math.sin(time) * 10) % W
    drawCloud(cloud1X, 60, 40)
    
    // 云朵2
    const cloud2X = (200 + Math.sin(time * 0.7) * 15) % W
    drawCloud(cloud2X, 100, 30)
    
    // 云朵3
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
    // 清新渐变背景
    const bgGrad = ctx.createLinearGradient(0, 0, W, H)
    bgGrad.addColorStop(0, gtrs.background)
    bgGrad.addColorStop(0.3, gtrs.bgGradMid ?? gtrs.backgroundDark)
    bgGrad.addColorStop(0.6, gtrs.primary)
    bgGrad.addColorStop(1, gtrs.backgroundDark)
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)
    
    // 可爱云朵装饰
    drawClouds()

    // 顶部标题栏（玻璃态效果）
    ctx.fillStyle = gtrs.hudBg
    ctx.fillRect(0, 0, W, 85)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, 85)
    ctx.lineTo(W, 85)
    ctx.stroke()

    // 分数显示（带发光效果）
    ctx.shadowBlur = 20
    ctx.shadowColor = gtrs.accent
    ctx.fillStyle = gtrs.accent
    ctx.font = 'bold 42px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(engine.getScore()), W / 2, 50)
    ctx.shadowBlur = 0
    
    // 分数标签
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = '12px sans-serif'
    ctx.fillText('SCORE', W / 2, 70)

    // 连击特效
    if (combo >= 2) {
      const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.1
      ctx.save()
      ctx.translate(W / 2, 105)
      ctx.scale(pulse, pulse)
      
      ctx.shadowBlur = 15
      ctx.shadowColor = '#FF6B6B'
      ctx.fillStyle = '#FF6B6B'
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText(`🔥 ${combo} COMBO!`, 0, 0)
      ctx.shadowBlur = 0
      
      ctx.restore()
    }

    // 棋盘背景（玻璃态圆角矩形）
    const boardW = COLS * (GEM_SIZE + GAP) + 30
    const boardH = ROWS * (GEM_SIZE + GAP) + 30
    const boardX = OFFSET_X - 15
    const boardY = OFFSET_Y - 15
    
    // 外层阴影
    ctx.shadowBlur = 30
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    ctx.beginPath()
    ctx.roundRect(boardX, boardY, boardW, boardH, 20)
    ctx.fill()
    ctx.shadowBlur = 0
    
    // 内层边框
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // 内部网格线（淡淡的）
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

    // 绘制宝石
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

    // 粒子效果
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

    // 倒计时（移到棋盘下方）
    const elapsed = Date.now() - lastMoveTime
    const remaining = Math.max(0, MOVE_TIMEOUT - elapsed)
    const seconds = Math.ceil(remaining / 1000)
    const progress = remaining / MOVE_TIMEOUT
    
    // 进度条背景（放在棋盘下方）
    const barWidth = 150
    const barHeight = 8
    const boardBottom = OFFSET_Y + ROWS * (GEM_SIZE + GAP) + 20
    const barX = W / 2 - barWidth / 2
    const barY = boardBottom + 10
    
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.beginPath()
    ctx.roundRect(barX, barY, barWidth, barHeight, 4)
    ctx.fill()
    
    // 进度条填充
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
    
    // 时间文字（居中在进度条上方）
    ctx.fillStyle = seconds <= 10 ? '#FF4444' : 'rgba(255,255,255,0.9)'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${seconds}s`, W / 2, barY - 8)

    // 底部提示（优雅的样式）
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('💎 点击相邻宝石交换位置', W / 2, H - 25)
  }

  async function trySwap(x1: number, y1: number, x2: number, y2: number): Promise<boolean> {
    // 交换动画：使用offsetX实现水平移动
    const gem1 = board[y1][x1]
    const gem2 = board[y2][x2]
    
    if (!gem1 || !gem2) return false
    
    // 设置初始偏移（准备动画）
    const distance = (GEM_SIZE + GAP)
    if (x2 > x1) {
      gem1.offsetX = distance  // 向右
      gem2.offsetX = -distance // 向左
    } else if (x2 < x1) {
      gem1.offsetX = -distance // 向左
      gem2.offsetX = distance  // 向右
    } else if (y2 > y1) {
      gem1.offsetY = distance  // 向下
      gem2.offsetY = -distance // 向上
    } else if (y2 < y1) {
      gem1.offsetY = -distance // 向上
      gem2.offsetY = distance  // 向下
    }
    
    // 执行交换动画（10帧）
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
    
    // 清除偏移
    gem1.offsetX = 0
    gem1.offsetY = 0
    gem2.offsetX = 0
    gem2.offsetY = 0
    
    // 实际交换数据
    board[y1][x1] = gem2
    board[y2][x2] = gem1

    const matches = findMatches()
    if (matches.length > 0) {
      lastMoveTime = Date.now()
      combo++
      audioService.win()
      return true
    }

    // 无效交换，交换回来（带动画）
    board[y2][x2] = gem2
    board[y1][x1] = gem1
    
    // 返回动画
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
    
    combo = 0
    audioService.lose()
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

  async function processMatches() {
    const matches = findMatches()
    if (matches.length === 0) return

    // 检查是否生成特殊道具
    checkAndCreateSpecialGem(matches, matches.length)

    // 检查是否有特殊道具需要触发
    for (const m of matches) {
      const gem = board[m.y]?.[m.x]
      if (gem?.special) {
        await triggerSpecialGem(m.x, m.y)
        return
      }
    }

    const points = matches.length * 20 * combo

    // 消除动画：缩小效果
    for (let i = 0; i < 10; i++) {
      matches.forEach(m => {
        const gem = board[m.y]?.[m.x]
        if (gem && gem.scale > 0.1) {
          gem.scale *= 0.85
        }
      })
      await new Promise(r => setTimeout(r, 30))
    }

    // 爆炸粒子（更柔和）
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

    if (combo >= 3) engine.triggerRandomBuff()

    await new Promise(r => setTimeout(r, 200))

    // 下落填充动画
    for (let x = 0; x < COLS; x++) {
      let writeY = ROWS - 1
      for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y][x]?.type >= 0) {
          if (writeY !== y) {
            board[writeY][x] = { ...board[y][x], offsetY: (y - writeY) * (GEM_SIZE + GAP) }
            board[y][x] = { type: -1, scale: 1 }
          }
          writeY--
        }
      }
      for (let y = writeY; y >= 0; y--) {
        board[y][x] = { 
          type: Math.floor(Math.random() * GEM_TYPES.length),
          offsetY: -50 - Math.random() * 100 // 从上方落下
        }
      }
    }

    // 下落动画
    for (let frame = 0; frame < 15; frame++) {
      let hasOffset = false
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const gem = board[y][x]
          if (gem && gem.offsetY && gem.offsetY !== 0) {
            hasOffset = true
            gem.offsetY *= 0.7 // 缓动效果
            if (Math.abs(gem.offsetY) < 1) gem.offsetY = 0
          }
        }
      }
      if (!hasOffset) break
      await new Promise(r => setTimeout(r, 20))
    }

    // 清除offsetY
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (board[y][x]) board[y][x].offsetY = 0
      }
    }

    await new Promise(r => setTimeout(r, 150))
    processMatches()
  }

  async function handleClickAt(mx: number, my: number) {
    if (animating || gameEnded) return

    const x = Math.floor((mx - OFFSET_X) / (GEM_SIZE + GAP))
    const y = Math.floor((my - OFFSET_Y) / (GEM_SIZE + GAP))

    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
      selected = null
      return
    }

    if (!selected) {
      selected = { x, y }
      audioService.collect()
    } else if (selected.x === x && selected.y === y) {
      selected = null
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
      } else {
        selected = { x, y }
        audioService.collect()
      }
    }
  }

  let unbindJewel: (() => void) | null = null

  function checkTimeout() {
    if (gameEnded) return
    if (Date.now() - lastMoveTime > MOVE_TIMEOUT) {
      gameEnded = true
      unbindJewel?.()
      unbindJewel = null
      audioService.lose()
      gameActions.gameOver({ victory: false, score: engine.getScore() })
    }
  }

  return hostCanvas2D(lifecycleCtx, {
    onInit() {
      initBoard()
      lastMoveTime = Date.now()
      resizeCanvasForMobile(canvas)
      injectMobileStyles()
      updateHTMLPowerupBar()
      unbindJewel = bindCanvasPointerInput(canvas, (x, y) => {
        void handleClickAt(x, y)
      })
      draw()
    },
    onUpdate(_dt) {
      if (gameEnded) return
      checkTimeout()
    },
    onRender() {
      draw()
    },
    onDestroy() {
      gameEnded = true
      unbindJewel?.()
      unbindJewel = null
      app.removePowerupBar?.()
    },
  })
}
