/**
 * 宠物消消乐 - 优化版
 * 更解压、更爽快的三消游戏体验
 */

export interface GameEngine {
  start(): void;
  endGame(): void;
  addScore(points: number, x?: number, y?: number): void;
  getScore(): number;
  triggerRandomBuff(): void;
}

export interface AudioService {
  initOnGesture(): void;
  collect(): void;
  win(): void;
  lose(): void;
}

export function initJewelMatch(engine: GameEngine, audioService: AudioService, onEnd: () => void) {
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

  // 优化的棋盘尺寸：7x9（原6x8）
  const COLS = 7
  const ROWS = 9
  const GEM_SIZE = 48
  const GAP = 3
  const OFFSET_X = (W - COLS * (GEM_SIZE + GAP)) / 2
  const OFFSET_Y = 100

  // 7种宝石类型（新增钻石）
  const GEM_TYPES = [
    { emoji: '🔴', color: '#FF4444', glow: '#FF6666', name: '红宝石' },
    { emoji: '🟠', color: '#FF8C00', glow: '#FFAA33', name: '橙宝石' },
    { emoji: '🟡', color: '#FFD700', glow: '#FFEC8B', name: '黄宝石' },
    { emoji: '🟢', color: '#32CD32', glow: '#90EE90', name: '绿宝石' },
    { emoji: '🔵', color: '#1E90FF', glow: '#87CEEB', name: '蓝宝石' },
    { emoji: '🟣', color: '#9932CC', glow: '#DA70D6', name: '紫宝石' },
    { emoji: '💎', color: '#00FFFF', glow: '#E0FFFF', name: '钻石' },
  ]
  
  // 道具类型定义
  const POWERUP_TYPES = [
    { id: 'bomb', emoji: '💣', color: '#FF4444', glow: '#FF6666', name: '炸弹', desc: '消除3x3范围' },
    { id: 'rainbow', emoji: '🌈', color: '#FFD700', glow: '#FFEC8B', name: '彩虹', desc: '消除所有同色' },
    { id: 'lightning', emoji: '⚡', color: '#00FFFF', glow: '#87CEEB', name: '闪电', desc: '消除整行整列' },
    { id: 'shuffle', emoji: '🔄', color: '#9932CC', glow: '#DA70D6', name: '洗牌', desc: '重新排列' },
  ]
  
  // 道具生成规则
  const POWERUP_CHANCES = {
    3: 0,       // 3连消：0%概率
    4: 0.15,    // 4连消：15%概率
    5: 0.25,    // 5连消：25%概率
    6: 0.35,    // 6连消：35%概率
    7: 0.45,    // 7连消：45%概率
    8: 0.55,    // 8连消：55%概率
    9: 0.65,    // 9连消：65%概率
    10: 0.8,    // 10+连消：80%概率
  }

  let board: any[][] = []
  let selected: { x: number; y: number } | null = null
  let animating = false
  let particles: any[] = []
  let combo = 0
  let lastMoveTime = Date.now()
  const MOVE_TIMEOUT = 60000  // 延长到60秒
  let gameEnded = false
  let hintGem: { x: number; y: number; time: number } | null = null
  
  // ====== 道具系统（自动生成）======
  // 触发道具效果
  async function triggerPowerupEffect(powerupId: string, x: number, y: number) {
    switch (powerupId) {
      case 'bomb':
        // 炸弹 - 消除3x3范围
        eliminateArea(x, y, 1)
        createPowerupEffect(x, y, POWERUP_TYPES.find(p => p.id === 'bomb')!.color)
        audioService.win()
        break
        
      case 'rainbow':
        // 彩虹 - 清除所有同色宝石
        if (board[y][x]) {
          const targetType = board[y][x].type
          eliminateAllOfType(targetType)
          createRainbowEffect(x, y)
          audioService.win()
        }
        break
        
      case 'lightning':
        // 闪电 - 消除整行整列
        eliminateRowAndColumn(x, y)
        createLightningEffect(x, y)
        audioService.win()
        break
        
      case 'shuffle':
        // 洗牌 - 重新排列所有宝石
        shuffleBoard()
        createShuffleEffect()
        audioService.win()
        break
    }
    
    setTimeout(() => processMatches(), 300)
  }
  
  // 消除整行整列
  function eliminateRowAndColumn(x: number, y: number) {
    // 消除整行
    for (let cx = 0; cx < COLS; cx++) {
      if (board[y][cx] && board[y][cx].type >= 0) {
        createExplosion(cx, y, board[y][cx].type)
        board[y][cx] = { type: -1, scale: 1 }
      }
    }
    
    // 消除整列
    for (let cy = 0; cy < ROWS; cy++) {
      if (board[cy][x] && board[cy][x].type >= 0) {
        createExplosion(x, cy, board[cy][x].type)
        board[cy][x] = { type: -1, scale: 1 }
      }
    }
    
    engine.addScore(COLS + ROWS, OFFSET_X + x * (GEM_SIZE + GAP), OFFSET_Y + y * (GEM_SIZE + GAP))
  }
  
  // 创建道具特效
  function createPowerupEffect(x: number, y: number, color: string) {
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20
      particles.push({
        x: OFFSET_X + x * (GEM_SIZE + GAP) + GEM_SIZE / 2,
        y: OFFSET_Y + y * (GEM_SIZE + GAP) + GEM_SIZE / 2,
        vx: Math.cos(angle) * 6,
        vy: Math.sin(angle) * 6,
        life: 1,
        color: color,
        size: 6 + Math.random() * 4
      })
    }
  }
  
  // 创建彩虹特效
  function createRainbowEffect(x: number, y: number) {
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: OFFSET_X + x * (GEM_SIZE + GAP) + GEM_SIZE / 2,
        y: OFFSET_Y + y * (GEM_SIZE + GAP) + GEM_SIZE / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        color: `hsl(${Math.random() * 360}, 100%, 70%)`,
        size: 4 + Math.random() * 4
      })
    }
  }
  
  // 创建闪电特效
  function createLightningEffect(x: number, y: number) {
    for (let cx = 0; cx < COLS; cx++) {
      for (let i = 0; i < 5; i++) {
        particles.push({
          x: OFFSET_X + cx * (GEM_SIZE + GAP) + GEM_SIZE / 2,
          y: OFFSET_Y + y * (GEM_SIZE + GAP) + GEM_SIZE / 2,
          vx: (Math.random() - 0.5) * 3,
          vy: -5 - Math.random() * 5,
          life: 1,
          color: '#00FFFF',
          size: 3 + Math.random() * 3
        })
      }
    }
    for (let cy = 0; cy < ROWS; cy++) {
      for (let i = 0; i < 5; i++) {
        particles.push({
          x: OFFSET_X + x * (GEM_SIZE + GAP) + GEM_SIZE / 2,
          y: OFFSET_Y + cy * (GEM_SIZE + GAP) + GEM_SIZE / 2,
          vx: -5 - Math.random() * 5,
          vy: (Math.random() - 0.5) * 3,
          life: 1,
          color: '#00FFFF',
          size: 3 + Math.random() * 3
        })
      }
    }
  }
  
  // 根据消除数量计算道具生成概率
  function shouldSpawnPowerup(matchCount: number): string | null {
    const key = Math.min(matchCount, 10) as keyof typeof POWERUP_CHANCES
    const chance = POWERUP_CHANCES[key]
    if (Math.random() < chance) {
      return POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)].id
    }
    return null
  }
  
  // 洗牌效果
  function shuffleBoard() {
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
          board[y][x] = { type: gems[idx], scale: 1, offsetX: 0, offsetY: 0 }
          idx++
        }
      }
    }
  }
  
  // 洗牌特效
  function createShuffleEffect() {
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: OFFSET_X + Math.random() * COLS * (GEM_SIZE + GAP),
        y: OFFSET_Y + Math.random() * ROWS * (GEM_SIZE + GAP),
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        color: `hsl(${Math.random() * 360}, 100%, 70%)`,
        size: 3 + Math.random() * 4
      })
    }
  }
  
  // 单个消除（锤子）
  function eliminateSingle(x: number, y: number) {
    if (!board[y][x]) return
    
    const gem = board[y][x]
    const g = GEM_TYPES[gem.type]
    
    // 粒子爆炸
    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15
      particles.push({
        x: OFFSET_X + x * (GEM_SIZE + GAP) + GEM_SIZE / 2,
        y: OFFSET_Y + y * (GEM_SIZE + GAP) + GEM_SIZE / 2,
        vx: Math.cos(angle) * (5 + Math.random() * 3),
        vy: Math.sin(angle) * (5 + Math.random() * 3),
        life: 1,
        color: g.color,
        size: 4 + Math.random() * 4
      })
    }
    
    board[y][x] = { type: -1, scale: 1 }
    engine.addScore(50, OFFSET_X + x * (GEM_SIZE + GAP), OFFSET_Y + y * (GEM_SIZE + GAP))
    
    setTimeout(() => processMatches(), 200)
  }
  
  // 范围消除（炸弹）
  function eliminateArea(centerX: number, centerY: number, radius: number) {
    let count = 0
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx
        const y = centerY + dy
        if (x >= 0 && x < COLS && y >= 0 && y < ROWS && board[y][x]) {
          const gem = board[y][x]
          const g = GEM_TYPES[gem.type]
          
          // 粒子爆炸
          for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5
            particles.push({
              x: OFFSET_X + x * (GEM_SIZE + GAP) + GEM_SIZE / 2,
              y: OFFSET_Y + y * (GEM_SIZE + GAP) + GEM_SIZE / 2,
              vx: Math.cos(angle) * (4 + Math.random() * 4),
              vy: Math.sin(angle) * (4 + Math.random() * 4),
              life: 1,
              color: g.color,
              size: 4 + Math.random() * 3
            })
          }
          
          board[y][x] = { type: -1, scale: 1 }
          count++
        }
      }
    }
    
    engine.addScore(count * 30, OFFSET_X + centerX * (GEM_SIZE + GAP), OFFSET_Y + centerY * (GEM_SIZE + GAP))
    setTimeout(() => processMatches(), 200)
  }
  
  // 清除所有同色（彩虹）
  function eliminateAllOfType(targetType: number) {
    let count = 0
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (board[y][x] && board[y][x].type === targetType) {
          const g = GEM_TYPES[targetType]
          
          // 华丽的彩虹粒子
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6
            particles.push({
              x: OFFSET_X + x * (GEM_SIZE + GAP) + GEM_SIZE / 2,
              y: OFFSET_Y + y * (GEM_SIZE + GAP) + GEM_SIZE / 2,
              vx: Math.cos(angle) * (3 + Math.random() * 2),
              vy: Math.sin(angle) * (3 + Math.random() * 2),
              life: 1,
              color: `hsl(${Math.random() * 360}, 100%, 70%)`,
              size: 3 + Math.random() * 3
            })
          }
          
          board[y][x] = { type: -1, scale: 1 }
          count++
        }
      }
    }
    
    engine.addScore(count * 40, W / 2, H / 2)
    setTimeout(() => processMatches(), 200)
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
    const gem = board[y]?.[x]
    
    const displayX = x + (gem?.offsetX ? gem.offsetX / (GEM_SIZE + GAP) : 0)
    const displayY = y + (gem?.offsetY ? gem.offsetY / (GEM_SIZE + GAP) : 0)
    
    const finalGx = OFFSET_X + displayX * (GEM_SIZE + GAP) + GEM_SIZE / 2
    const finalGy = OFFSET_Y + displayY * (GEM_SIZE + GAP) + GEM_SIZE / 2
    
    const gemType = GEM_TYPES[type]
    const size = (GEM_SIZE + pulse) * (gem?.scale || 1)

    // 选中时的华丽光环
    if (highlight) {
      ctx.shadowBlur = 20
      ctx.shadowColor = 'rgba(255,215,0,0.6)'
      ctx.strokeStyle = 'rgba(255,215,0,0.7)'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(finalGx, finalGy, size * 0.55, 0, Math.PI * 2)
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // 宝石阴影
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.beginPath()
    ctx.arc(finalGx + 3, finalGy + 3, size * 0.45, 0, Math.PI * 2)
    ctx.fill()

    // 宝石主体（带光晕）
    const outerGrad = ctx.createRadialGradient(
      finalGx - size * 0.1, finalGy - size * 0.1, 0,
      finalGx, finalGy, size * 0.48
    )
    outerGrad.addColorStop(0, highlight ? '#FFF8DC' : gemType.color)
    outerGrad.addColorStop(0.5, gemType.color)
    outerGrad.addColorStop(1, shadeColor(gemType.color, -30))

    ctx.fillStyle = outerGrad
    ctx.shadowBlur = 15
    ctx.shadowColor = gemType.glow
    ctx.beginPath()
    ctx.arc(finalGx, finalGy, size * 0.45, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // 内部高光
    const innerGrad = ctx.createRadialGradient(
      finalGx - size * 0.15, finalGy - size * 0.15, 0,
      finalGx, finalGy, size * 0.35
    )
    innerGrad.addColorStop(0, 'rgba(255,255,255,0.8)')
    innerGrad.addColorStop(0.5, 'rgba(255,255,255,0.3)')
    innerGrad.addColorStop(1, 'rgba(255,255,255,0)')

    ctx.fillStyle = innerGrad
    ctx.beginPath()
    ctx.arc(finalGx, finalGy, size * 0.35, 0, Math.PI * 2)
    ctx.fill()

    // 顶部高光点
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.beginPath()
    ctx.arc(finalGx - size * 0.12, finalGy - size * 0.15, size * 0.1, 0, Math.PI * 2)
    ctx.fill()

    // 边框
    ctx.strokeStyle = highlight ? 'rgba(255,215,0,0.8)' : shadeColor(gemType.color, 25)
    ctx.lineWidth = 2
    ctx.stroke()
  }

  function drawPowerupGem(x: number, y: number, powerupId: string, highlight: boolean) {
    const gem = board[y]?.[x]
    const powerup = POWERUP_TYPES.find(p => p.id === powerupId)
    
    if (!powerup) return
    
    const displayX = x + (gem?.offsetX ? gem.offsetX / (GEM_SIZE + GAP) : 0)
    const displayY = y + (gem?.offsetY ? gem.offsetY / (GEM_SIZE + GAP) : 0)
    
    const finalGx = OFFSET_X + displayX * (GEM_SIZE + GAP) + GEM_SIZE / 2
    const finalGy = OFFSET_Y + displayY * (GEM_SIZE + GAP) + GEM_SIZE / 2
    
    const pulse = 3 + Math.sin(Date.now() / 200) * 2
    const size = (GEM_SIZE + pulse) * (gem?.scale || 1)

    // 道具发光特效
    ctx.shadowBlur = 25
    ctx.shadowColor = powerup.glow
    ctx.fillStyle = powerup.color
    ctx.beginPath()
    ctx.roundRect(finalGx - size * 0.42, finalGy - size * 0.42, size * 0.84, size * 0.84, 8)
    ctx.fill()
    ctx.shadowBlur = 0

    // 边框
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = highlight ? 4 : 2
    ctx.stroke()

    // 内部装饰线
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(finalGx - size * 0.35, finalGy - size * 0.35, size * 0.7, size * 0.7, 6)
    ctx.stroke()

    // 道具图标
    ctx.font = `${size * 0.5}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(powerup.emoji, finalGx, finalGy)

    // 选中光环
    if (highlight) {
      ctx.shadowBlur = 25
      ctx.shadowColor = 'rgba(255,215,0,0.8)'
      ctx.strokeStyle = 'rgba(255,215,0,0.9)'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.roundRect(finalGx - size * 0.48, finalGy - size * 0.48, size * 0.96, size * 0.96, 12)
      ctx.stroke()
      ctx.shadowBlur = 0
    }
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
    // 华丽的渐变背景
    const bgGrad = ctx.createLinearGradient(0, 0, W, H)
    bgGrad.addColorStop(0, '#1a1a2e')
    bgGrad.addColorStop(0.5, '#16213e')
    bgGrad.addColorStop(1, '#0f3460')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)
    
    // 动态星空背景
    for (let i = 0; i < 60; i++) {
      const alpha = 0.3 + Math.sin(Date.now() * 0.001 + i) * 0.2
      ctx.fillStyle = `rgba(255,255,255,${alpha})`
      ctx.beginPath()
      ctx.arc((i * 73) % W, (i * 47) % H, 1 + (i % 2), 0, Math.PI * 2)
      ctx.fill()
    }

    // 顶部标题栏
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.fillRect(0, 0, W, 85)
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, 85)
    ctx.lineTo(W, 85)
    ctx.stroke()

    // 分数显示（带发光）
    ctx.shadowBlur = 25
    ctx.shadowColor = '#FFD700'
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 44px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(engine.getScore()), W / 2, 50)
    ctx.shadowBlur = 0
    
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '14px sans-serif'
    ctx.fillText('SCORE', W / 2, 70)

    // 连击特效
    if (combo >= 2) {
      const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.15
      ctx.save()
      ctx.translate(W / 2, 105)
      ctx.scale(pulse, pulse)
      
      ctx.shadowBlur = 20
      ctx.shadowColor = '#FF6B6B'
      ctx.fillStyle = '#FF6B6B'
      ctx.font = 'bold 26px sans-serif'
      ctx.fillText(`🔥 ${combo} COMBO!`, 0, 0)
      ctx.shadowBlur = 0
      
      ctx.restore()
    }

    // 棋盘背景
    const boardW = COLS * (GEM_SIZE + GAP) + 30
    const boardH = ROWS * (GEM_SIZE + GAP) + 30
    const boardX = OFFSET_X - 15
    const boardY = OFFSET_Y - 15
    
    ctx.shadowBlur = 35
    ctx.shadowColor = 'rgba(0,0,0,0.6)'
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.beginPath()
    ctx.roundRect(boardX, boardY, boardW, boardH, 20)
    ctx.fill()
    ctx.shadowBlur = 0
    
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx.lineWidth = 2
    ctx.stroke()

    // 绘制宝石和道具方块
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const gem = board[y]?.[x]
        if (!gem) continue

        const isSelected = selected?.x === x && selected?.y === y
        const isHint = hintGem?.x === x && hintGem?.y === y

        if (gem.powerup) {
          drawPowerupGem(x, y, gem.powerup, isSelected)
        } else if (gem.type >= 0) {
          const pulse = isHint ? Math.sin(Date.now() / 150) * 6 : 0
          drawGem(x, y, gem.type, isSelected, pulse)
        }
      }
    }

    // 粒子效果
    particles.forEach((p, i) => {
      p.life -= 0.02
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.2

      if (p.life <= 0) { particles.splice(i, 1); return }

      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.shadowBlur = 20
      ctx.shadowColor = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    })

    // 倒计时
    const elapsed = Date.now() - lastMoveTime
    const remaining = Math.max(0, MOVE_TIMEOUT - elapsed)
    const seconds = Math.ceil(remaining / 1000)
    const progress = remaining / MOVE_TIMEOUT
    
    const barWidth = 180
    const barHeight = 10
    const boardBottom = OFFSET_Y + ROWS * (GEM_SIZE + GAP) + 20
    const barX = W / 2 - barWidth / 2
    const barY = boardBottom + 10
    
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.beginPath()
    ctx.roundRect(barX, barY, barWidth, barHeight, 5)
    ctx.fill()
    
    const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0)
    if (seconds <= 15) {
      gradient.addColorStop(0, '#FF4444')
      gradient.addColorStop(1, '#FF6B6B')
    } else {
      gradient.addColorStop(0, '#4ECDC4')
      gradient.addColorStop(1, '#44A08D')
    }
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.roundRect(barX, barY, barWidth * progress, barHeight, 5)
    ctx.fill()
    
    ctx.fillStyle = seconds <= 15 ? '#FF4444' : 'rgba(255,255,255,0.9)'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${seconds}s`, W / 2, barY - 8)

    // 道具说明
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText('💣炸弹 💫彩虹 ⚡闪电 🔄洗牌', W / 2, barY + 20)

    // 底部提示
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText('💎 点击相邻宝石交换位置 | 4连消以上可能生成道具', W / 2, H - 25)
  }

  async function trySwap(x1: number, y1: number, x2: number, y2: number): Promise<boolean> {
    const gem1 = board[y1][x1]
    const gem2 = board[y2][x2]
    
    if (!gem1 || !gem2) return false
    
    const distance = (GEM_SIZE + GAP)
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

  function hasEmptySpaces(): boolean {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (board[y][x]?.type === -1) return true
      }
    }
    return false
  }

  async function applyGravityAndFill(matchCount: number = 0, spawnPowerupAt: {x: number, y: number} | null = null): Promise<void> {
    let needsFill = false
    const powerupToSpawn = matchCount >= 4 ? shouldSpawnPowerup(matchCount) : null
    
    for (let x = 0; x < COLS; x++) {
      let writeY = ROWS - 1
      for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y][x]?.type >= 0 || board[y][x]?.powerup) {
          if (writeY !== y) {
            board[writeY][x] = { ...board[y][x], offsetY: (y - writeY) * (GEM_SIZE + GAP) }
            board[y][x] = { type: -1, scale: 1 }
            needsFill = true
          }
          writeY--
        }
      }
      for (let y = writeY; y >= 0; y--) {
        const shouldPlacePowerup = powerupToSpawn && spawnPowerupAt?.x === x && spawnPowerupAt?.y === y
        
        if (shouldPlacePowerup) {
          board[y][x] = {
            type: -2,
            powerup: powerupToSpawn,
            offsetY: -60 - Math.random() * 120,
            scale: 1,
            pulse: 0
          }
        } else {
          let newType: number
          do {
            newType = Math.floor(Math.random() * GEM_TYPES.length)
          } while (wouldCreateMatch(x, y, newType))
          board[y][x] = { 
            type: newType,
            offsetY: -60 - Math.random() * 120,
            scale: 1
          }
        }
        needsFill = true
      }
    }

    if (needsFill) {
      for (let frame = 0; frame < 20; frame++) {
        let hasOffset = false
        for (let y = 0; y < ROWS; y++) {
          for (let x = 0; x < COLS; x++) {
            const gem = board[y][x]
            if (gem && gem.offsetY && gem.offsetY !== 0) {
              hasOffset = true
              gem.offsetY *= 0.7
              if (Math.abs(gem.offsetY) < 0.5) gem.offsetY = 0
            }
          }
        }
        if (!hasOffset) break
        await new Promise(r => setTimeout(r, 16))
      }

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (board[y][x]) {
            board[y][x].offsetY = 0
            board[y][x].offsetX = 0
          }
        }
      }
    }
  }

  function wouldCreateMatch(x: number, y: number, type: number): boolean {
    if (x >= 2 && board[y]?.[x-1]?.type === type && board[y]?.[x-2]?.type === type) return true
    if (y >= 2 && board[y-1]?.[x]?.type === type && board[y-2]?.[x]?.type === type) return true
    if (x >= 1 && x < COLS - 1 && board[y]?.[x-1]?.type === type && board[y]?.[x+1]?.type === type) return true
    if (y >= 1 && y < ROWS - 1 && board[y-1]?.[x]?.type === type && board[y+1]?.[x]?.type === type) return true
    return false
  }

  async function processMatches() {
    const matches = findMatches()
    const hasEmpty = hasEmptySpaces()
    
    if (matches.length === 0 && !hasEmpty) return

    const matchCount = matches.length
    
    if (matchCount > 0) {
      const points = matchCount * 25 * combo
      engine.addScore(points, W / 2, H / 2)

      for (let i = 0; i < 12; i++) {
        matches.forEach(m => {
          const gem = board[m.y]?.[m.x]
          if (gem && gem.scale > 0.1) {
            gem.scale *= 0.8
          }
        })
        await new Promise(r => setTimeout(r, 25))
      }

      let powerupSpawnPosition: {x: number, y: number} | null = null
      
      matches.forEach((m, index) => {
        const gem = board[m.y]?.[m.x]
        
        if (gem && gem.powerup) {
          triggerPowerupEffect(gem.powerup, m.x, m.y)
          board[m.y][m.x] = { type: -1, scale: 1 }
        } else if (gem && gem.type >= 0) {
          const g = GEM_TYPES[gem.type]
          for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5
            particles.push({
              x: OFFSET_X + m.x * (GEM_SIZE + GAP) + GEM_SIZE / 2,
              y: OFFSET_Y + m.y * (GEM_SIZE + GAP) + GEM_SIZE / 2,
              vx: Math.cos(angle) * (4 + Math.random() * 4),
              vy: Math.sin(angle) * (4 + Math.random() * 4),
              life: 1,
              color: g.color,
              size: 5 + Math.random() * 4
            })
          }
          board[m.y][m.x] = { type: -1, scale: 1 }
          
          if (matchCount >= 4 && index === Math.floor(matches.length / 2) && !powerupSpawnPosition) {
            powerupSpawnPosition = { x: m.x, y: m.y }
          }
        }
      })

      if (combo >= 3) engine.triggerRandomBuff()

      await new Promise(r => setTimeout(r, 200))
    }

    await applyGravityAndFill(matchCount, powerupSpawnPosition)

    await new Promise(r => setTimeout(r, 150))
    
    const newMatches = findMatches()
    if (newMatches.length > 0) {
      processMatches()
    } else {
      combo = 0
    }
  }

  canvas.onclick = null
  
  canvas.onclick = async (e) => {
    if (animating || gameEnded) return

    const rect = canvas.getBoundingClientRect()
    const sx = W / rect.width
    const sy = H / rect.height
    const mx = (e.clientX - rect.left) * sx
    const my = (e.clientY - rect.top) * sy

    // ====== 正常游戏逻辑 ======
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
  
  draw()
  loop()
}
