import { audioService } from '@shell/services/audio'
import { app } from '@shell/services/appBridge'
import { gameActions } from '@shell/platform/gameBridge'
import type { GameLifecycleContext } from '@shell/platform/GameLifecycle'
import type { GameLifecycle } from '@shell/platform/GameLifecycle'
import { hostCanvas2D } from '@shell/platform/hostCanvas2D'
import { requireMainGameCanvas } from '@shell/platform/canvasHost'
import { applyCanvasMobileStyles } from '@shell/utils/canvasMobileUtils'
import { bindGameCanvasControls } from '@shell/platform/mobileControls'
import type { MobileControlRuntime } from '@shell/platform/mobileControls'
import { getCachedGTRSTheme } from '@shell/services/gtrsThemeLoader'
import { resolveGtrsCanvasStyle } from '@shell/utils/gtrsCanvasTheme'
import { readGtrsSceneMeta } from '@shell/utils/gtrsSceneMeta'

const W = 400
const H = 600
const RUN_LIMIT_MS = 180_000
const SKULL_EMOJI = '\u{1F480}'

export function startNeonRunLifecycle(ctx: GameLifecycleContext): GameLifecycle {
  const canvas = ctx.canvas ?? requireMainGameCanvas()
  const g = canvas.getContext('2d')!
  g.imageSmoothingEnabled = false
  const engine = ctx.engine

  const NEON_FALLBACK = {
    primary: '#00FFFF',
    background: '#0a0a0f',
    backgroundDark: '#050508',
    text: '#E0E7FF',
    accent: '#FFD700',
    hudBg: 'rgba(0,0,0,0.5)',
    danger: '#FF4757',
    muted: '#8B0000',
    palette: ['#FF4757', '#8B0000'],
  }
  const gtrs = resolveGtrsCanvasStyle('neonRun', NEON_FALLBACK)
  const theme = getCachedGTRSTheme('neonRun')
  const gridLine = readGtrsSceneMeta(theme, 'grid_line') ?? 'rgba(100, 100, 255, 0.1)'
  const laneLine = readGtrsSceneMeta(theme, 'lane_line') ?? 'rgba(0, 255, 255, 0.3)'
  const playerGlow = readGtrsSceneMeta(theme, 'player_glow') ?? gtrs.primary
  const coinColor = gtrs.accent
  const obsColors = [gtrs.danger, gtrs.muted] as const

  const lanes = 3
  const laneW = W / lanes
  let playerLane = 1
  const playerY = H - 120
  let obstacles: Array<{
    x: number
    y: number
    w: number
    h: number
    lane: number
    color: string
  }> = []
  let coins: Array<{
    x: number
    y: number
    r: number
    lane: number
    collected: boolean
    rotation: number
  }> = []
  let particles: Array<{
    x: number
    y: number
    vx: number
    vy: number
    life: number
    color: string
    size: number
  }> = []
  let speed = 3
  let gameStartTime = Date.now()
  let gameEnded = false
  let lastObs = 0
  let hitInvincibleFrames = 0
  let powerInvincibleUntil = 0
  let inventory: string[] = []
  let controls: MobileControlRuntime | null = null

  function laneLeft() {
    if (playerLane > 0) {
      playerLane--
      audioService.collect()
    }
  }

  function laneRight() {
    if (playerLane < lanes - 1) {
      playerLane++
      audioService.collect()
    }
  }

  const powerupIcons: Record<string, string> = {
    invincible: '⭐',
    slow: '🐌',
    magnet: '🧲',
    score2x: '✨',
  }

  const win = () => window as unknown as Record<string, number>

  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id,
    }))
    app.setupCustomPowerupBar('neonRun', powerups, inventory, powerupId => {
      if (usePowerup(powerupId)) audioService.collect()
    })
  }

  function usePowerup(type: string): boolean {
    const index = inventory.indexOf(type)
    if (index === -1) return false
    inventory.splice(index, 1)
    switch (type) {
      case 'invincible':
        powerInvincibleUntil = Date.now() + 5000
        audioService.win()
        break
      case 'slow':
        win().neonSlow = Date.now() + 8000
        audioService.collect()
        break
      case 'magnet':
        win().neonMagnet = Date.now() + 8000
        audioService.win()
        break
      case 'score2x':
        win().neonScore2x = Date.now() + 10_000
        audioService.win()
        break
    }
    return true
  }

  function spawnObstacle() {
    const lane = Math.floor(Math.random() * lanes)
    obstacles.push({
      x: lane * laneW + laneW / 2,
      y: -60,
      w: laneW * 0.7,
      h: 50,
      lane,
      color: Math.random() > 0.5 ? obsColors[0] : obsColors[1],
    })
  }

  function spawnCoin() {
    const lane = Math.floor(Math.random() * lanes)
    coins.push({
      x: lane * laneW + laneW / 2,
      y: -40,
      r: 15,
      lane,
      collected: false,
      rotation: 0,
    })
  }

  function draw() {
    g.fillStyle = gtrs.background
    g.fillRect(0, 0, W, H)
    g.strokeStyle = gridLine
    g.lineWidth = 1
    for (let x = 0; x < W; x += 40) {
      g.beginPath()
      g.moveTo(x, 0)
      g.lineTo(x, H)
      g.stroke()
    }
    for (let y = 0; y < H; y += 40) {
      g.beginPath()
      g.moveTo(0, y)
      g.lineTo(W, y)
      g.stroke()
    }
    for (let i = 0; i <= lanes; i++) {
      g.strokeStyle = laneLine
      g.lineWidth = 2
      g.beginPath()
      g.moveTo(i * laneW, 0)
      g.lineTo(i * laneW, H)
      g.stroke()
    }
    obstacles.forEach(o => {
      g.shadowBlur = 20
      g.shadowColor = o.color
      g.fillStyle = o.color
      g.fillRect(o.x - o.w / 2, o.y, o.w, o.h)
      g.font = '28px sans-serif'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText('��', o.x, o.y + o.h / 2)
      g.shadowBlur = 0
    })
    coins.forEach(c => {
      if (c.collected) return
      c.rotation += 0.1
      g.shadowBlur = 15
      g.shadowColor = coinColor
      g.font = `${c.r * 2}px sans-serif`
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.save()
      g.translate(c.x, c.y)
      g.scale(Math.abs(Math.cos(c.rotation)), 1)
      g.fillText('🪙', 0, 0)
      g.restore()
      g.shadowBlur = 0
    })
    const px = playerLane * laneW + laneW / 2
    const invActive = Date.now() < powerInvincibleUntil || hitInvincibleFrames > 0
    g.shadowBlur = invActive ? 30 : 15
    g.shadowColor = invActive ? gtrs.accent : playerGlow
    g.font = '50px sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText('🏃', px, playerY)
    g.shadowBlur = 0
    particles.forEach((p, i) => {
      p.life -= 0.02
      p.x += p.vx
      p.y += p.vy
      if (p.life <= 0) {
        particles.splice(i, 1)
        return
      }
      g.globalAlpha = p.life
      g.fillStyle = p.color
      g.beginPath()
      g.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      g.fill()
      g.globalAlpha = 1
    })
    const elapsedHud = Date.now() - gameStartTime
    const remainSec = Math.max(0, Math.ceil((RUN_LIMIT_MS - elapsedHud) / 1000))
    g.fillStyle = gtrs.hudBg
    g.beginPath()
    g.roundRect(10, 8, W - 20, 40, 10)
    g.fill()
    g.fillStyle = remainSec <= 30 ? gtrs.danger : gtrs.text
    g.font = 'bold 15px sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    const streak = engine.getCombo()
    const comboLabel = streak >= 3 ? ` · 🔥${streak}` : ''
    g.fillText(`速度 ${speed.toFixed(1)} · ⏱ ${remainSec}s${comboLabel}`, W / 2, 28)
  }

  function isInvincibleNow(): boolean {
    return Date.now() < powerInvincibleUntil || hitInvincibleFrames > 0
  }

  function update() {
    const w = win()
    const slowActive = w.neonSlow && Date.now() < w.neonSlow
    const currentSpeed = slowActive ? speed * 0.5 : speed
    const score2xActive = w.neonScore2x && Date.now() < w.neonScore2x

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i]
      o.y += currentSpeed
      const px = playerLane * laneW + laneW / 2
      if (
        !isInvincibleNow() &&
        o.lane === playerLane &&
        o.y + o.h > playerY - 25 &&
        o.y < playerY + 25
      ) {
        gameActions.breakCombo()
        hitInvincibleFrames = 60
        audioService.lose()
        for (let j = 0; j < 20; j++) {
          particles.push({
            x: px,
            y: playerY,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            life: 1,
            color: gtrs.danger,
            size: 4 + Math.random() * 6,
          })
        }
        obstacles.splice(i, 1)
        continue
      }
      if (o.y > H + 100) {
        obstacles.splice(i, 1)
        const base = score2xActive ? 20 : 10
        gameActions.addScore(base, px, playerY, 'neonRun')
        if (engine.getCombo() >= 5) engine.triggerRandomBuff()
      }
    }

    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i]
      const magnetActive = w.neonMagnet && Date.now() < w.neonMagnet
      if (magnetActive && !c.collected) {
        const px = playerLane * laneW + laneW / 2
        const dx = px - c.x
        const dy = playerY - c.y
        const dist = Math.hypot(dx, dy)
        if (dist < 200) {
          c.x += dx * 0.1
          c.y += dy * 0.1
        }
      }
      c.y += speed
      const px = playerLane * laneW + laneW / 2
      if (!c.collected && c.lane === playerLane && Math.abs(c.y - playerY) < 40) {
        c.collected = true
        let base = 20
        if (score2xActive) base *= 2
        gameActions.addScore(base, c.x, c.y, 'neonRun')
        audioService.win()
        for (let j = 0; j < 10; j++) {
          particles.push({
            x: c.x,
            y: c.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1,
            color: coinColor,
            size: 3 + Math.random() * 4,
          })
        }
      }
      if (c.y > H + 50) coins.splice(i, 1)
    }

    if (hitInvincibleFrames > 0) hitInvincibleFrames--

    if (Date.now() - lastObs > 1200) {
      if (Math.random() > 0.3) spawnObstacle()
      if (Math.random() > 0.5) spawnCoin()
      lastObs = Date.now()
    }

    const powerupThreshold = Math.floor(engine.getScore() / 500)
    if (powerupThreshold > 0 && powerupThreshold !== w.neonLastPowerupGiven) {
      w.neonLastPowerupGiven = powerupThreshold
      const ids = ['invincible', 'slow', 'magnet', 'score2x']
      inventory.push(ids[Math.floor(Math.random() * ids.length)]!)
      updateHTMLPowerupBar()
    }

    speed = 3 + (Date.now() - gameStartTime) / 30_000
  }

  function finishRun() {
    controls?.dispose()
    controls = null
  }

  return hostCanvas2D(ctx, {
    onInit() {
      gameStartTime = Date.now()
      gameEnded = false
      applyCanvasMobileStyles(canvas)
      updateHTMLPowerupBar()
      controls = bindGameCanvasControls(canvas, {
        gameId: 'neonRun',
        viewWidth: W,
        viewHeight: H,
        layout: { viewWidth: W, viewHeight: H, buttons: [] },
        onAction: (action) => {
          if (action === 'lane_left') laneLeft()
          if (action === 'lane_right') laneRight()
        },
      })
    },
    onUpdate(_dt) {
      if (gameEnded) return
      if (Date.now() - gameStartTime > RUN_LIMIT_MS) {
        gameEnded = true
        finishRun()
        audioService.lose()
        gameActions.gameOver({ victory: false, score: engine.getScore() })
        return
      }
      update()
    },
    onRender() {
      draw()
    },
    onDestroy() {
      finishRun()
      app.removePowerupBar?.()
    },
  })
}