import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { app } from '../App'

// ——————————————————————————————————————————————
//  打地鼠  Whack-a-Mole
//  操作：鼠标点击 / 触屏点击
//  Canvas: 400 x 600
// ——————————————————————————————————————————————

const COLS = 3
const ROWS = 3
const HOLE_COUNT = COLS * ROWS

// 洞口布局（中心坐标）
const HOLE_POSITIONS = (() => {
  const pts: { x: number; y: number }[] = []
  const xStart = 70, xStep = 130
  const yStart = 180, yStep = 130
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      pts.push({ x: xStart + c * xStep, y: yStart + r * yStep })
    }
  }
  return pts
})()

const HOLE_RX = 48  // 椭圆半轴 x
const HOLE_RY = 16  // 椭圆半轴 y
const MOLE_W  = 58
const MOLE_H  = 62

type MoleType = 'normal' | 'gold' | 'bomb'

interface Mole {
  holeIdx: number
  type: MoleType
  state: 'rising' | 'visible' | 'hiding' | 'idle' | 'hit'
  offsetY: number   // 0 = 完全露出，MOLE_H = 隐藏在洞里
  timer: number     // 帧计数
  showDuration: number
  hitScale: number
  hitAlpha: number
}

interface Particle {
  x: number; y: number
  vx: number; vy: number
  color: string
  life: number; maxLife: number
  size: number
}

interface FloatText {
  x: number; y: number
  text: string; color: string
  life: number; vy: number
}

export function initWhackMole(engine: GameEngine, onEnd: () => void) {
  const cvs = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  const ctx = cvs.getContext('2d')!
  const W = cvs.width, H = cvs.height

  // —— 游戏状态 ——
  const moles: Mole[] = Array.from({ length: HOLE_COUNT }, (_, i) => ({
    holeIdx: i, type: 'normal', state: 'idle',
    offsetY: MOLE_H, timer: 0, showDuration: 100,
    hitScale: 1, hitAlpha: 1
  }))

  const particles: Particle[] = []
  const floatTexts: FloatText[] = []

  let gameDuration = 60   // 总时长（秒）
  let timeLeft = gameDuration
  let frameCount = 0
  let nextSpawnTimer = 0
  let spawnInterval = 90  // 初始每90帧出现一只
  let gameEnded = false
  const RISE_FRAMES = 10
  const HIDE_FRAMES = 10
  
  // ====== 道具系统（库存模式）======
  let inventory: string[] = [] // 道具库存
  
  // 道具图标映射
  const powerupIcons: Record<string, string> = {
    'time_plus': '⏰',     // 加时 - 增加15秒
    'slow': '🐌',         // 减速 - 地鼠出现速度减半
    'score2x': '✨',      // 双倍分数 - 10秒内×2
    'auto_hit': '🎯'      // 自动击中 - 5秒内自动打中所有地鼠
  }
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id
    }))
    
    app.setupCustomPowerupBar('whackMole', powerups, inventory, (powerupId) => {
      if (usePowerup(powerupId)) {
        audioService.collect()
        updateHTMLPowerupBar()
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
      case 'time_plus':
        // 加时 - 增加15秒
        timeLeft += 15
        audioService.win()
        console.log('[道具] 加时15秒，剩余:', timeLeft)
        break
        
      case 'slow':
        // 减速 - 地鼠出现速度减半，持续10秒
        ;(window as any).moleSlow = Date.now() + 10000
        audioService.collect()
        console.log('[道具] 减速生效，持续10秒')
        break
        
      case 'score2x':
        // 双倍分数 - 10秒内×2
        ;(window as any).moleScore2x = Date.now() + 10000
        audioService.win()
        console.log('[道具] 双倍分数生效，持续10秒')
        break
        
      case 'auto_hit':
        // 自动击中 - 5秒内自动打中所有地鼠
        ;(window as any).moleAutoHit = Date.now() + 5000
        audioService.win()
        console.log('[道具] 自动击生效，持续5秒')
        break
    }
    
    return true
  }

  // 难度阶段：时间越少，越快
  function updateDifficulty() {
    const elapsed = gameDuration - timeLeft
    if (elapsed < 15) {
      spawnInterval = 90
    } else if (elapsed < 30) {
      spawnInterval = 70
    } else if (elapsed < 45) {
      spawnInterval = 55
    } else {
      spawnInterval = 42
    }
  }

  function spawnMole() {
    const idleHoles = moles
      .map((m, i) => ({ m, i }))
      .filter(({ m }) => m.state === 'idle')
    if (idleHoles.length === 0) return
    const pick = idleHoles[Math.floor(Math.random() * idleHoles.length)]
    const m = pick.m

    // 随机类型：70% normal, 20% gold, 10% bomb
    const rand = Math.random()
    if (rand < 0.70) m.type = 'normal'
    else if (rand < 0.90) m.type = 'gold'
    else m.type = 'bomb'

    m.state = 'rising'
    m.offsetY = MOLE_H
    m.timer = 0
    m.hitScale = 1
    m.hitAlpha = 1
    // gold 停留短，bomb 停留久
    m.showDuration = m.type === 'gold' ? 55 : m.type === 'bomb' ? 140 : 90
  }

  function hitMole(idx: number) {
    const m = moles[idx]
    if (m.state !== 'visible' && m.state !== 'rising') return

    const hole = HOLE_POSITIONS[idx]
    if (m.type === 'bomb') {
      // 踩雷 -100 分（直接减分，不走 engine.addScore 避免负分逻辑问题）
      emitParticles(hole.x, hole.y - MOLE_H * 0.4, '#FF4757', 10)
      spawnFloatText(hole.x, hole.y - MOLE_H * 0.6, '-100', '#FF4757')
      // 手动扣分
      ;(engine as any).state.score = Math.max(0, (engine as any).state.score - 100)
      audioService.play('miss')
    } else {
      const base = m.type === 'gold' ? 30 : 10
      const gained = engine.addScore(base, hole.x, hole.y - MOLE_H * 0.6)
      const color = m.type === 'gold' ? '#FFD700' : '#6BCB77'
      emitParticles(hole.x, hole.y - MOLE_H * 0.4, color, 8)
      spawnFloatText(hole.x, hole.y - MOLE_H * 0.6, `+${gained}`, color)
      audioService.play('score')
    }

    m.state = 'hit'
    m.timer = 0
    m.hitScale = 1.3
    m.hitAlpha = 1
  }

  function emitParticles(x: number, y: number, color: string, n: number) {
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1.5 + Math.random() * 3
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color, size: 3 + Math.random() * 4,
        life: 30, maxLife: 30
      })
    }
  }

  function spawnFloatText(x: number, y: number, text: string, color: string) {
    floatTexts.push({ x, y, text, color, life: 50, vy: -1.2 })
  }

  // —— 绘制 ——
  function drawBackground() {
    // 草地渐变
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#87D37C')
    grad.addColorStop(0.45, '#6BCB77')
    grad.addColorStop(0.46, '#8B6914')
    grad.addColorStop(1, '#6B4A1A')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // 草地线
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, H * 0.45)
    ctx.lineTo(W, H * 0.45)
    ctx.stroke()
  }

  function drawHole(idx: number) {
    const { x, y } = HOLE_POSITIONS[idx]
    // 洞口椭圆（深色）
    ctx.save()
    ctx.fillStyle = '#3B2507'
    ctx.beginPath()
    ctx.ellipse(x, y, HOLE_RX, HOLE_RY, 0, 0, Math.PI * 2)
    ctx.fill()
    // 洞口高光
    ctx.fillStyle = 'rgba(255,255,255,0.07)'
    ctx.beginPath()
    ctx.ellipse(x - 8, y - 4, HOLE_RX * 0.5, HOLE_RY * 0.5, -0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  function drawMole(m: Mole) {
    if (m.state === 'idle') return
    const { x, y } = HOLE_POSITIONS[m.holeIdx]
    const drawY = y - MOLE_H * 0.9 + m.offsetY

    ctx.save()
    ctx.globalAlpha = m.hitAlpha

    // clip：不画出洞口下方
    ctx.beginPath()
    ctx.ellipse(x, y, HOLE_RX + 4, HOLE_RY + 4, 0, Math.PI, Math.PI * 2)
    ctx.rect(x - HOLE_RX - 4, -H, HOLE_RX * 2 + 8, H + y)
    ctx.clip()

    ctx.translate(x, drawY + MOLE_H / 2)
    ctx.scale(m.hitScale, m.hitScale)
    ctx.translate(-MOLE_W / 2, -MOLE_H / 2)

    if (m.type === 'bomb') {
      drawBomb(ctx, 0, 0, MOLE_W, MOLE_H)
    } else {
      drawMoleBody(ctx, 0, 0, MOLE_W, MOLE_H, m.type === 'gold')
    }

    ctx.restore()
  }

  function drawMoleBody(
    c: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    isGold: boolean
  ) {
    const bodyColor = isGold ? '#C8960C' : '#8B5E3C'
    const faceColor = isGold ? '#FFD700' : '#C69B6B'
    const eyeColor = '#2C1A0E'

    // 身体
    c.fillStyle = bodyColor
    c.beginPath()
    c.ellipse(x + w / 2, y + h * 0.6, w * 0.42, h * 0.42, 0, 0, Math.PI * 2)
    c.fill()

    // 脸
    c.fillStyle = faceColor
    c.beginPath()
    c.ellipse(x + w / 2, y + h * 0.38, w * 0.38, h * 0.35, 0, 0, Math.PI * 2)
    c.fill()

    // 眼睛
    c.fillStyle = eyeColor
    c.beginPath()
    c.ellipse(x + w * 0.35, y + h * 0.3, 4, 5, 0, 0, Math.PI * 2)
    c.fill()
    c.beginPath()
    c.ellipse(x + w * 0.65, y + h * 0.3, 4, 5, 0, 0, Math.PI * 2)
    c.fill()

    // 眼睛高光
    c.fillStyle = '#fff'
    c.beginPath()
    c.arc(x + w * 0.35 + 1.5, y + h * 0.28, 1.5, 0, Math.PI * 2)
    c.fill()
    c.beginPath()
    c.arc(x + w * 0.65 + 1.5, y + h * 0.28, 1.5, 0, Math.PI * 2)
    c.fill()

    // 鼻子
    c.fillStyle = '#FF8080'
    c.beginPath()
    c.ellipse(x + w / 2, y + h * 0.42, 5, 3.5, 0, 0, Math.PI * 2)
    c.fill()

    // 牙
    c.fillStyle = '#fff'
    c.fillRect(x + w / 2 - 5, y + h * 0.47, 4.5, 4)
    c.fillRect(x + w / 2 + 0.5, y + h * 0.47, 4.5, 4)

    // 金色光圈
    if (isGold) {
      c.strokeStyle = 'rgba(255,215,0,0.7)'
      c.lineWidth = 3
      c.beginPath()
      c.arc(x + w / 2, y + h * 0.38, w * 0.44, 0, Math.PI * 2)
      c.stroke()
    }
  }

  function drawBomb(
    c: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number
  ) {
    // 炸弹身体
    c.fillStyle = '#2d2d2d'
    c.beginPath()
    c.arc(x + w / 2, y + h * 0.55, w * 0.38, 0, Math.PI * 2)
    c.fill()

    // 反光
    c.fillStyle = 'rgba(255,255,255,0.18)'
    c.beginPath()
    c.ellipse(x + w * 0.38, y + h * 0.42, 8, 6, -0.5, 0, Math.PI * 2)
    c.fill()

    // 导火索
    c.strokeStyle = '#996633'
    c.lineWidth = 3
    c.lineCap = 'round'
    c.beginPath()
    c.moveTo(x + w / 2 + 2, y + h * 0.22)
    c.bezierCurveTo(
      x + w * 0.7, y + h * 0.1,
      x + w * 0.5, y + h * 0.05,
      x + w * 0.62, y - h * 0.02
    )
    c.stroke()

    // 火花
    c.fillStyle = '#FFD700'
    c.shadowColor = '#FF8C00'
    c.shadowBlur = 8
    c.beginPath()
    c.arc(x + w * 0.62, y - h * 0.02, 5, 0, Math.PI * 2)
    c.fill()
    c.shadowBlur = 0

    // 骷髅符号 ☠
    c.fillStyle = '#fff'
    c.font = `bold ${w * 0.42}px sans-serif`
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillText('☠', x + w / 2, y + h * 0.56)
  }

  function drawHUD() {
    // 顶部半透明信息栏
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    roundRect(ctx, 10, 8, W - 20, 52, 12)
    ctx.fill()

    // 剩余时间
    ctx.fillStyle = timeLeft <= 10 ? '#FF4757' : '#FFD700'
    ctx.font = 'bold 22px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(`⏱ ${timeLeft}s`, 22, 34)

    // 分数
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`★ ${engine.getScore()}`, W - 18, 34)

    // 倒计时低于10秒闪红
    if (timeLeft <= 10) {
      ctx.strokeStyle = `rgba(255,71,87,${0.4 + 0.4 * Math.sin(frameCount * 0.25)})`
      ctx.lineWidth = 4
      roundRect(ctx, 2, 2, W - 4, H - 4, 0)
      ctx.stroke()
    }
  }

  function drawLegend() {
    const items = [
      { color: '#8B5E3C', label: '+10 普通' },
      { color: '#FFD700', label: '+30 金色' },
      { color: '#2d2d2d', label: '-100 炸弹' },
    ]
    const startX = 14
    let cx = startX
    const cy = H - 28
    ctx.font = '11px sans-serif'
    ctx.textBaseline = 'middle'
    for (const item of items) {
      ctx.fillStyle = item.color
      ctx.beginPath()
      ctx.arc(cx + 6, cy, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'left'
      ctx.fillText(item.label, cx + 15, cy)
      cx += ctx.measureText(item.label).width + 30
    }
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.save()
      ctx.globalAlpha = p.life / p.maxLife
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  function drawFloatTexts() {
    for (const f of floatTexts) {
      ctx.save()
      ctx.globalAlpha = f.life / 50
      ctx.fillStyle = f.color
      ctx.font = 'bold 20px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = '#000'
      ctx.shadowBlur = 6
      ctx.fillText(f.text, f.x, f.y)
      ctx.restore()
    }
  }

  // —— 主循环 ——
  function update() {
    frameCount++

    // 秒倒计时
    if (frameCount % 60 === 0) {
      timeLeft--
      updateDifficulty()
      if (timeLeft <= 0) {
        gameEnded = true
        engine.endGame()
        onEnd()
        return
      }
    }

    // 生成地鼠
    nextSpawnTimer++
    if (nextSpawnTimer >= spawnInterval) {
      nextSpawnTimer = 0
      spawnMole()
      // 有小概率同时冒两只
      if (Math.random() < 0.25) spawnMole()
    }

    // 更新地鼠
    for (const m of moles) {
      m.timer++
      switch (m.state) {
        case 'rising':
          m.offsetY = MOLE_H * (1 - m.timer / RISE_FRAMES)
          if (m.timer >= RISE_FRAMES) {
            m.offsetY = 0
            m.state = 'visible'
            m.timer = 0
          }
          break
        case 'visible':
          if (m.timer >= m.showDuration) {
            m.state = 'hiding'
            m.timer = 0
          }
          break
        case 'hiding':
          m.offsetY = MOLE_H * (m.timer / HIDE_FRAMES)
          if (m.timer >= HIDE_FRAMES) {
            m.state = 'idle'
            m.offsetY = MOLE_H
          }
          break
        case 'hit':
          m.hitScale = 1.3 - 0.3 * (m.timer / 12)
          m.hitAlpha = 1 - m.timer / 14
          m.offsetY = MOLE_H * (m.timer / 14)
          if (m.timer >= 14) {
            m.state = 'idle'
            m.offsetY = MOLE_H
            m.hitScale = 1
            m.hitAlpha = 1
          }
          break
      }
    }

    // 更新粒子
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.x += p.vx; p.y += p.vy
      p.vy += 0.15
      p.life--
      if (p.life <= 0) particles.splice(i, 1)
    }

    // 更新浮动文字
    for (let i = floatTexts.length - 1; i >= 0; i--) {
      const f = floatTexts[i]
      f.y += f.vy
      f.life--
      if (f.life <= 0) floatTexts.splice(i, 1)
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H)
    drawBackground()

    // 先画洞（底层）
    for (let i = 0; i < HOLE_COUNT; i++) drawHole(i)

    // 画地鼠（注意遮挡顺序：行从上到下）
    for (const m of [...moles].sort((a, b) => {
      return HOLE_POSITIONS[a.holeIdx].y - HOLE_POSITIONS[b.holeIdx].y
    })) {
      drawMole(m)
    }

    drawParticles()
    drawFloatTexts()
    drawHUD()
    drawLegend()
  }

  // —— 输入事件 ——
  function getCanvasPos(clientX: number, clientY: number) {
    const rect = cvs.getBoundingClientRect()
    const scaleX = cvs.width / rect.width
    const scaleY = cvs.height / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  function checkHit(cx: number, cy: number) {
    for (let i = 0; i < HOLE_COUNT; i++) {
      const m = moles[i]
      if (m.state !== 'visible' && m.state !== 'rising') continue
      const { x, y } = HOLE_POSITIONS[i]
      const moleTop = y - MOLE_H * 0.9 + m.offsetY
      const moleBot = moleTop + MOLE_H
      const moleLeft = x - MOLE_W / 2
      const moleRight = x + MOLE_W / 2
      if (cx >= moleLeft && cx <= moleRight && cy >= moleTop && cy <= moleBot) {
        hitMole(i)
        return
      }
    }
  }

  function onMouseDown(e: MouseEvent) {
    const pos = getCanvasPos(e.clientX, e.clientY)
    checkHit(pos.x, pos.y)
  }
  function onTouchStart(e: TouchEvent) {
    e.preventDefault()
    const t = e.touches[0]
    const pos = getCanvasPos(t.clientX, t.clientY)
    checkHit(pos.x, pos.y)
  }

  cvs.addEventListener('mousedown', onMouseDown)
  cvs.addEventListener('touchstart', onTouchStart, { passive: false })

  // —— 启动 ——
  engine.start()

  function loop() {
    if (!document.getElementById('mainGameCanvas') || gameEnded) return
    update()
    draw()
    requestAnimationFrame(loop)
  }
  
  // 初始化 HTML 道具栏
  updateHTMLPowerupBar()
  
  loop()
}

// roundRect helper
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
