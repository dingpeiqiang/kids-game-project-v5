import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { app } from '../App'

export function initJewelMatch(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  if (!canvas) {
    console.error('Canvas not found!')
    return
  }
  
  const W = 400, H = 600
  const ctx = canvas.getContext('2d')!
  if (!ctx) {
    console.error('Cannot get 2D context!')
    return
  }
  ctx.imageSmoothingEnabled = true

  const COLS = 6  // 减少列数
  const ROWS = 8  // 减少行数
  const GEM_SIZE = 52  // 更大的宝�?
  const GAP = 4  // 宝石间距
  const OFFSET_X = (W - COLS * (GEM_SIZE + GAP)) / 2
  const OFFSET_Y = 100

  // 宝石类型 - 更清晰的配色
  const GEM_TYPES = [
    { emoji: '🔴', color: '#FF4444', glow: '#FF6666' },  // 红宝�?
    { emoji: '🟠', color: '#FF8C00', glow: '#FFAA33' },  // 橙宝�?
    { emoji: '🟡', color: '#FFD700', glow: '#FFEC8B' },  // 黄宝�?
    { emoji: '🟢', color: '#32CD32', glow: '#90EE90' },  // 绿宝�?
    { emoji: '🔵', color: '#1E90FF', glow: '#87CEEB' },  // 蓝宝�?
    { emoji: '🟣', color: '#9932CC', glow: '#DA70D6' },  // 紫宝�?
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
    'hint': '💡'        // 提示 - 显示可消除组�?
  }
  
  // 更新 HTML 道具�?
  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id
    }))
    
    // ��������ɾ�� - ÿ����Ϸ���Լ��ĵ���ʰȡ����
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
    console.log('[道具] 使用道具:', type)
    
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
        console.log('[道具] 洗牌完成')
        break
        
      case 'hint':
        // 提示 - 高亮一个可消除的宝�?
        const hint = findHint()
        if (hint) {
          hintGem = { x: hint.x, y: hint.y, time: Date.now() + 3000 }
          audioService.collect()
          console.log('[道具] 显示提示')
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
        // 检查向右交�?
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
        // 检查向下交�?
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

    // 选中时的柔和光环（降低强度）
    if (highlight) {
      ctx.shadowBlur = 15
      ctx.shadowColor = 'rgba(255,215,0,0.4)'
      ctx.strokeStyle = 'rgba(255,215,0,0.5)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(finalGx, finalGy, size * 0.52, 0, Math.PI * 2)
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // 宝石阴影（更柔和�?
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    ctx.beginPath()
    ctx.arc(finalGx + 2, finalGy + 2, size * 0.43, 0, Math.PI * 2)
    ctx.fill()

    // 宝石主体（柔和渐变，去除刺眼光晕�?
    const outerGrad = ctx.createRadialGradient(
      finalGx - size * 0.1, finalGy - size * 0.1, 0,
      finalGx, finalGy, size * 0.45
    )
    outerGrad.addColorStop(0, highlight ? '#FFF8DC' : gemType.color)
    outerGrad.addColorStop(0.6, gemType.color)
    outerGrad.addColorStop(1, shadeColor(gemType.color, -25))

    ctx.fillStyle = outerGrad
    ctx.shadowBlur = 0 // 移除光晕效果
    ctx.beginPath()
    ctx.arc(finalGx, finalGy, size * 0.43, 0, Math.PI * 2)
    ctx.fill()

    // 内部高光（更自然�?
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

    // 顶部高光点（更小更精致）
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.beginPath()
    ctx.arc(finalGx - size * 0.12, finalGy - size * 0.15, size * 0.08, 0, Math.PI * 2)
    ctx.fill()

    // 边框（更细）
    ctx.strokeStyle = highlight ? 'rgba(255,215,0,0.6)' : shadeColor(gemType.color, 20)
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  function shadeColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.min(255, Math.max(0, (num >> 16) + amt))
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt))
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt))
    return `rgb(${R},${G},${B})`
  }

  function draw() {
    // 华丽的渐变背�?
    const bgGrad = ctx.createLinearGradient(0, 0, W, H)
    bgGrad.addColorStop(0, '#0f0c29')
    bgGrad.addColorStop(0.5, '#302b63')
    bgGrad.addColorStop(1, '#24243e')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)
    
    // 动态星空背�?
    for (let i = 0; i < 50; i++) {
      const alpha = 0.3 + Math.sin(Date.now() * 0.001 + i) * 0.2
      ctx.fillStyle = `rgba(255,255,255,${alpha})`
      ctx.beginPath()
      ctx.arc((i * 73) % W, (i * 47) % H, 1 + (i % 2), 0, Math.PI * 2)
      ctx.fill()
    }

    // 顶部标题栏（玻璃态效果）
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fillRect(0, 0, W, 85)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, 85)
    ctx.lineTo(W, 85)
    ctx.stroke()

    // 分数显示（带发光效果�?
    ctx.shadowBlur = 20
    ctx.shadowColor = '#FFD700'
    ctx.fillStyle = '#FFD700'
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

    // 倒计时（移到棋盘下方�?
    const elapsed = Date.now() - lastMoveTime
    const remaining = Math.max(0, MOVE_TIMEOUT - elapsed)
    const seconds = Math.ceil(remaining / 1000)
    const progress = remaining / MOVE_TIMEOUT
    
    // 进度条背景（放在棋盘下方�?
    const barWidth = 150
    const barHeight = 8
    const boardBottom = OFFSET_Y + ROWS * (GEM_SIZE + GAP) + 20
    const barX = W / 2 - barWidth / 2
    const barY = boardBottom + 10
    
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.beginPath()
    ctx.roundRect(barX, barY, barWidth, barHeight, 4)
    ctx.fill()
    
    // 进度条填�?
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

    // 底部提示（优雅的样式�?
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
    
    // 执行交换动画�?0帧）
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

    const points = matches.length * 20 * combo
    engine.addScore(points, W / 2, H / 2)

    // 消除动画：缩小效�?
    for (let i = 0; i < 10; i++) {
      matches.forEach(m => {
        const gem = board[m.y]?.[m.x]
        if (gem && gem.scale > 0.1) {
          gem.scale *= 0.85
        }
      })
      await new Promise(r => setTimeout(r, 30))
    }

    // 爆炸粒子（更柔和�?
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
          offsetY: -50 - Math.random() * 100 // 从上方落�?
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

  canvas.onclick = null
  
  canvas.onclick = async (e) => {
    if (animating || gameEnded) return

    const rect = canvas.getBoundingClientRect()
    const sx = W / rect.width
    const sy = H / rect.height
    const mx = (e.clientX - rect.left) * sx
    const my = (e.clientY - rect.top) * sy

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

  function checkTimeout() {
    if (gameEnded) return
    if (Date.now() - lastMoveTime > MOVE_TIMEOUT) {
      engine.endGame()
      gameEnded = true
      audioService.lose()
      onEnd()
    }
  }

  function loop() {
    if (!document.getElementById('mainGameCanvas') || gameEnded) return

    checkTimeout()
    draw()
    requestAnimationFrame(loop)
  }

  engine.start()
  initBoard()
  lastMoveTime = Date.now()
  
  // 初始�?HTML 道具�?
  updateHTMLPowerupBar()
  
  // 首次绘制（避免黑屏）
  draw()
  
  loop()
}
