import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { app } from '../App'

export function initBubbleShooter(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  const W = 400, H = 600
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false

  const COLS = 12
  const ROWS = 10
  const BUBBLE_SIZE = 30
  const SHOOTER_Y = H - 50
  
  const COLORS = [
    '#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCB77', '#4D96FF', '#FF69B4'
  ]

  let board: (number | null)[][] = []
  let shooter: { x: number; y: number; color: number; angle: number } = {
    x: W / 2, y: SHOOTER_Y, color: 0, angle: -Math.PI / 2
  }
  let projectile: { x: number; y: number; vx: number; vy: number; color: number } | null = null
  let particles: any[] = []
  let floatingScores: any[] = []
  let combo = 0
  let gameStartTime = Date.now()
  const GAME_DURATION = 90000 // 90秒
  let gameEnded = false
  let mouseX = W / 2
  
  // ====== 道具系统（库存模式）======
  let inventory: string[] = [] // 道具库存
  
  // 道具图标映射
  const powerupIcons: Record<string, string> = {
    'color_bomb': '💣',   // 颜色炸弹 - 消除所有同色泡泡
    'rainbow': '🌈',      // 彩虹球 - 可以匹配任何颜色
    'extra_shot': '⚡',   // 额外射击 - 立即发射3发
    'clear_row': '🧹'     // 清除行 - 消除最底下一行
  }
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id
    }))
    
    app.setupCustomPowerupBar('bubbleShooter', powerups, inventory, (powerupId) => {
      if (usePowerup(powerupId)) {
        audioService.collect()
              }
    })
  }
  
  // 使用道具
  function usePowerup(type: string): boolean {
    const index = inventory.indexOf(type)
    if (index === -1) return false
    
    inventory.splice(index, 1)
    console.log('[道具] 使用道具:', type)
    
    switch (type) {
      case 'color_bomb':
        // 颜色炸弹 - 消除所有同色泡泡
        const targetColor = Math.floor(Math.random() * COLORS.length)
        let bombCount = 0
        for (let y = 0; y < ROWS; y++) {
          for (let x = 0; x < COLS; x++) {
            if (board[y][x] === targetColor) {
              board[y][x] = null
              bombCount++
              // 粒子效果
              const pos = getBubblePos(x, y)
              for (let i = 0; i < 8; i++) {
                particles.push({
                  x: pos.bx,
                  y: pos.by,
                  vx: (Math.random() - 0.5) * 8,
                  vy: (Math.random() - 0.5) * 8,
                  life: 1,
                  color: COLORS[targetColor],
                  size: 4
                })
              }
            }
          }
        }
        engine.addScore(bombCount * 30, W / 2, H / 2)
        audioService.win()
        console.log('[道具] 颜色炸弹消除', bombCount, '个泡泡')
        break
        
      case 'rainbow':
        // 彩虹球 - 下次射击变成彩虹球
        ;(window as any).bubbleRainbow = true
        audioService.win()
        console.log('[道具] 彩虹球生效，下次射击可匹配任意颜色')
        break
        
      case 'extra_shot':
        // 额外射击 - 立即发射3发
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            if (!projectile && !gameEnded) {
              const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5
              projectile = {
                x: shooter.x,
                y: shooter.y,
                vx: Math.cos(angle) * 12,
                vy: Math.sin(angle) * 12,
                color: shooter.color
              }
              shooter.color = Math.floor(Math.random() * COLORS.length)
            }
          }, i * 200)
        }
        audioService.win()
        console.log('[道具] 额外射击3发')
        break
        
      case 'clear_row':
        // 清除行 - 消除最底下一行有泡泡的行
        let clearedBubbles = 0
        for (let y = ROWS - 1; y >= 0; y--) {
          let hasBubble = false
          for (let x = 0; x < COLS; x++) {
            if (board[y][x] !== null) {
              hasBubble = true
              board[y][x] = null
              clearedBubbles++
              const pos = getBubblePos(x, y)
              for (let i = 0; i < 6; i++) {
                particles.push({
                  x: pos.bx,
                  y: pos.by,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  life: 1,
                  color: '#FFD700',
                  size: 3
                })
              }
            }
          }
          if (hasBubble) break // 只清除一行
        }
        engine.addScore(clearedBubbles * 20, W / 2, H / 2)
        audioService.win()
        console.log('[道具] 清除行消除', clearedBubbles, '个泡泡')
        break
    }
    
    return true
  }

  function initBoard() {
    board = []
    for (let y = 0; y < ROWS; y++) {
      board[y] = []
      for (let x = 0; x < COLS; x++) {
        // 奇数行偏移
        const offset = y % 2 === 1 ? BUBBLE_SIZE / 2 : 0
        if (x * BUBBLE_SIZE + offset < W - BUBBLE_SIZE) {
          board[y][x] = Math.floor(Math.random() * COLORS.length)
        } else {
          board[y][x] = null
        }
      }
    }
    shooter.color = Math.floor(Math.random() * COLORS.length)
  }

  function getBubblePos(x: number, y: number): { bx: number; by: number } {
    const offset = y % 2 === 1 ? BUBBLE_SIZE / 2 : 0
    return {
      bx: x * BUBBLE_SIZE + offset + BUBBLE_SIZE / 2,
      by: y * BUBBLE_SIZE + BUBBLE_SIZE / 2 + 30
    }
  }

  function draw() {
    // 渐变背景
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#1a1a2e')
    grad.addColorStop(1, '#16213e')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // 棋盘区域背景
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fillRect(0, 30, W, ROWS * BUBBLE_SIZE + 10)

    // 泡泡
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const color = board[y]?.[x]
        if (color === null || color === undefined) continue
        
        const pos = getBubblePos(x, y)
        
        // 发光
        ctx.shadowColor = COLORS[color]
        ctx.shadowBlur = 10
        
        // 圆形泡泡
        const grad = ctx.createRadialGradient(
          pos.bx - 5, pos.by - 5, 0,
          pos.bx, pos.by, BUBBLE_SIZE / 2
        )
        grad.addColorStop(0, lightenColor(COLORS[color], 40))
        grad.addColorStop(0.7, COLORS[color])
        grad.addColorStop(1, darkenColor(COLORS[color], 20))
        
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(pos.bx, pos.by, BUBBLE_SIZE / 2 - 2, 0, Math.PI * 2)
        ctx.fill()
        
        // 高光
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.beginPath()
        ctx.arc(pos.bx - 5, pos.by - 5, 5, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.shadowBlur = 0
      }
    }

    // 发射轨迹
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(shooter.x, shooter.y)
    ctx.lineTo(
      shooter.x + Math.cos(shooter.angle) * 100,
      shooter.y + Math.sin(shooter.angle) * 100
    )
    ctx.stroke()
    ctx.setLineDash([])

    // 发射器
    ctx.shadowColor = COLORS[shooter.color]
    ctx.shadowBlur = 15
    
    const sGrad = ctx.createRadialGradient(
      shooter.x - 5, shooter.y - 5, 0,
      shooter.x, shooter.y, 20
    )
    sGrad.addColorStop(0, lightenColor(COLORS[shooter.color], 40))
    sGrad.addColorStop(1, COLORS[shooter.color])
    
    ctx.fillStyle = sGrad
    ctx.beginPath()
    ctx.arc(shooter.x, shooter.y, 20, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // 下一个泡泡预览
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('下一个:', W / 2, H - 80)
    
    ctx.fillStyle = COLORS[shooter.color]
    ctx.beginPath()
    ctx.arc(W / 2, H - 55, 15, 0, Math.PI * 2)
    ctx.fill()

    // 飞行中的泡泡
    if (projectile) {
      ctx.shadowColor = COLORS[projectile.color]
      ctx.shadowBlur = 15
      ctx.fillStyle = COLORS[projectile.color]
      ctx.beginPath()
      ctx.arc(projectile.x, projectile.y, BUBBLE_SIZE / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    }

    // 粒子
    particles.forEach((p, i) => {
      p.life -= 0.03
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.2
      
      if (p.life <= 0) { particles.splice(i, 1); return }
      
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })

    // 漂浮分数
    floatingScores.forEach((f, i) => {
      f.life -= 0.02
      f.y -= 1
      
      if (f.life <= 0) { floatingScores.splice(i, 1); return }
      
      ctx.globalAlpha = f.life
      ctx.fillStyle = f.color
      ctx.font = `bold ${f.size}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(f.text, f.x, f.y)
      ctx.globalAlpha = 1
    })

    // 分数
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 36px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(engine.getScore()), W / 2, H - 15)
    
    if (combo >= 2) {
      ctx.fillStyle = '#FF6B6B'
      ctx.font = 'bold 20px sans-serif'
      ctx.fillText(`${combo} 连击!`, W / 2, H - 115)
    }

    // 时间
    const elapsed = Date.now() - gameStartTime
    const remaining = Math.max(0, GAME_DURATION - elapsed)
    const seconds = Math.ceil(remaining / 1000)
    
    ctx.fillStyle = seconds <= 10 ? '#FF4444' : '#fff'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`${seconds}s`, W - 10, H - 15)
  }

  function lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const R = Math.min(255, (num >> 16) + percent)
    const G = Math.min(255, ((num >> 8) & 0xFF) + percent)
    const B = Math.min(255, (num & 0xFF) + percent)
    return `rgb(${R},${G},${B})`
  }

  function darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const R = Math.max(0, (num >> 16) - percent)
    const G = Math.max(0, ((num >> 8) & 0xFF) - percent)
    const B = Math.max(0, (num & 0xFF) - percent)
    return `rgb(${R},${G},${B})`
  }

  function shoot() {
    if (projectile) return
    
    projectile = {
      x: shooter.x,
      y: shooter.y,
      vx: Math.cos(shooter.angle) * 15,
      vy: Math.sin(shooter.angle) * 15,
      color: shooter.color
    }
    audioService.click()
  }

  function findMatches(row: number, col: number, color: number): { row: number; col: number }[] {
    const matches: { row: number; col: number }[] = []
    const visited = new Set<string>()
    const queue: { row: number; col: number }[] = [{ row, col }]
    
    while (queue.length > 0) {
      const { row: r, col: c } = queue.shift()!
      const key = `${r},${c}`
      
      if (visited.has(key)) continue
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue
      if (board[r]?.[c] !== color) continue
      
      visited.add(key)
      matches.push({ row: r, col: c })
      
      // 邻居
      const neighbors = r % 2 === 0
        ? [{ r: r - 1, c: c - 1 }, { r: r - 1, c: c }, { r, c: c - 1 }, { r, c: c + 1 }, { r: r + 1, c: c - 1 }, { r: r + 1, c: c }]
        : [{ r: r - 1, c: c }, { r: r - 1, c: c + 1 }, { r, c: c - 1 }, { r, c: c + 1 }, { r: r + 1, c: c }, { r: r + 1, c: c + 1 }]
      
      neighbors.forEach(n => queue.push({ row: n.r, col: n.c }))
    }
    
    return matches
  }

  function findFloating(): { row: number; col: number }[] {
    const floating: { row: number; col: number }[] = []
    const connected = new Set<string>()
    const queue: { row: number; col: number }[] = []
    
    // 从顶部开始
    for (let x = 0; x < COLS; x++) {
      if (board[0]?.[x] !== null && board[0]?.[x] !== undefined) {
        queue.push({ row: 0, col: x })
      }
    }
    
    while (queue.length > 0) {
      const { row: r, col: c } = queue.shift()!
      const key = `${r},${c}`
      
      if (connected.has(key)) continue
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue
      if (board[r]?.[c] === null || board[r]?.[c] === undefined) continue
      
      connected.add(key)
      
      const neighbors = r % 2 === 0
        ? [{ r: r + 1, c: c - 1 }, { r: r + 1, c: c }, { r, c: c - 1 }, { r, c: c + 1 }, { r: r - 1, c: c - 1 }, { r: r - 1, c: c }]
        : [{ r: r + 1, c: c }, { r: r + 1, c: c + 1 }, { r, c: c - 1 }, { r, c: c + 1 }, { r: r - 1, c: c }, { r: r - 1, c: c + 1 }]
      
      neighbors.forEach(n => queue.push({ row: n.r, col: n.c }))
    }
    
    // 找出所有未连接的泡泡
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r]?.[c] !== null && board[r]?.[c] !== undefined) {
          if (!connected.has(`${r},${c}`)) {
            floating.push({ row: r, col: c })
          }
        }
      }
    }
    
    return floating
  }

  function update() {
    if (!projectile) return

    projectile.x += projectile.vx
    projectile.y += projectile.vy

    // 左右边界
    if (projectile.x < BUBBLE_SIZE / 2) {
      projectile.x = BUBBLE_SIZE / 2
      projectile.vx *= -1
    }
    if (projectile.x > W - BUBBLE_SIZE / 2) {
      projectile.x = W - BUBBLE_SIZE / 2
      projectile.vx *= -1
    }

    // 顶部
    if (projectile.y < BUBBLE_SIZE / 2 + 30) {
      attachBubble()
      return
    }

    // 碰撞检测
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r]?.[c] === null || board[r]?.[c] === undefined) continue
        
        const pos = getBubblePos(c, r)
        const dist = Math.hypot(projectile.x - pos.bx, projectile.y - pos.by)
        
        if (dist < BUBBLE_SIZE - 2) {
          attachBubble()
          return
        }
      }
    }
  }

  function attachBubble() {
    // 找到最近的空位
    let bestRow = 0, bestCol = 0
    let bestDist = Infinity

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r]?.[c] !== null && board[r]?.[c] !== undefined) continue
        
        const pos = getBubblePos(c, r)
        const dist = Math.hypot(projectile!.x - pos.bx, projectile!.y - pos.by)
        
        if (dist < bestDist) {
          bestDist = dist
          bestRow = r
          bestCol = c
        }
      }
    }

    board[bestRow][bestCol] = projectile!.color

    // 检查匹配
    const matches = findMatches(bestRow, bestCol, projectile!.color)
    
    if (matches.length >= 3) {
      combo++
      const score = matches.length * 20 * combo
      engine.addScore(score, projectile!.x, projectile!.y)
      audioService.win()
      
      // 爆炸效果
      matches.forEach(m => {
        const pos = getBubblePos(m.col, m.row)
        for (let i = 0; i < 10; i++) {
          particles.push({
            x: pos.bx,
            y: pos.by,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1,
            color: COLORS[projectile!.color],
            size: 5 + Math.random() * 5
          })
        }
        board[m.row][m.col] = null
      })

      floatingScores.push({
        x: projectile!.x,
        y: projectile!.y,
        text: `+${score}`,
        color: '#FFD700',
        size: 24,
        life: 1
      })

      if (combo >= 3) engine.triggerRandomBuff()

      // 检查漂浮的泡泡
      setTimeout(() => {
        const floating = findFloating()
        if (floating.length > 0) {
          const bonus = floating.length * 30
          engine.addScore(bonus, W / 2, H / 2)
          floatingScores.push({
            x: W / 2,
            y: H / 2,
            text: `漂浮+${bonus}!`,
            color: '#FF69B4',
            size: 28,
            life: 1.5
          })
          floating.forEach(f => {
            board[f.row][f.col] = null
          })
        }
      }, 100)
    } else {
      combo = 0
      audioService.click()
    }

    // 新泡泡
    projectile = null
    shooter.color = Math.floor(Math.random() * COLORS.length)
  }

  function getPos(e: MouseEvent | TouchEvent) {
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (W / rect.width),
      y: (e.clientY - rect.top) * (H / rect.height)
    }
  }

  canvas.onmousemove = canvas.ontouchmove = (e) => {
    const pos = getPos(e as any)
    mouseX = pos.x
    const dx = pos.x - shooter.x
    const dy = pos.y - shooter.y
    shooter.angle = Math.atan2(dy, dx)
    // 限制角度
    if (shooter.angle > -0.1) shooter.angle = -0.1
    if (shooter.angle < -Math.PI + 0.1) shooter.angle = -Math.PI + 0.1
  }

  canvas.onclick = canvas.ontouchend = () => {
    shoot()
  }

  function loop() {
    if (!document.getElementById('mainGameCanvas') || gameEnded) return
    
    if (Date.now() - gameStartTime > GAME_DURATION) {
      gameEnded = true
      engine.endGame()
      onEnd()
      return
    }
    
    update()
    draw()
    requestAnimationFrame(loop)
  }

  engine.start()
  initBoard()
  
      
  loop()
}
