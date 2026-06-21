import { audioService } from '../../services/audio'
import { app } from '../../services/appBridge'
import { gameActions } from '../../platform/gameBridge'
import type { GameLifecycleContext } from '../../platform/GameLifecycle'
import { runCanvasLifecycle, type GameLifecycle } from '../../platform/GameLifecycle'
import { requireMainGameCanvas } from '../../platform/canvasHost'
import { applyCanvasMobileStyles } from '../../utils/canvasMobileUtils'
import { bindGameCanvasControls } from '../../platform/mobileControls'
import type { MobileControlRuntime } from '../../platform/mobileControls'
import { getCachedGTRSTheme } from '../../services/gtrsThemeLoader'
import { resolveGtrsCanvasStyle } from '../../utils/gtrsCanvasTheme'
import { readGtrsSceneMeta } from '../../utils/gtrsSceneMeta'

const W = 400
const H = 600
const GAME_DURATION = 60_000

export function startStarCatcherLifecycle(ctx: GameLifecycleContext): GameLifecycle {
  const canvas = ctx.canvas ?? requireMainGameCanvas()
  const ctx2d = canvas.getContext('2d')!
  ctx2d.imageSmoothingEnabled = false
  const engine = ctx.engine

  const STAR_FALLBACK = {
    primary: '#87CEEB',
    background: '#0a0a1a',
    backgroundDark: '#050510',
    text: '#FFFFFF',
    accent: '#FFD700',
    hudBg: 'rgba(0,0,0,0.4)',
    danger: '#FF4444',
    muted: '#666666',
    palette: ['#87CEEB', '#FFD700'],
  }
  const gtrs = resolveGtrsCanvasStyle('starCatcher', STAR_FALLBACK)
  const theme = getCachedGTRSTheme('starCatcher')
  const starNormal = readGtrsSceneMeta(theme, 'star_normal') ?? gtrs.primary
  const starGold = gtrs.accent
  const playerGlow = readGtrsSceneMeta(theme, 'player_glow') ?? (theme?.globalStyle?.secondaryColor ?? '#FF69B4')

  const player = { x: W / 2, y: H - 100, size: 40 }
  const stars: Array<{
    x: number
    y: number
    size: number
    vy: number
    type: string
    rotation: number
  }> = []
  const obstacles: Array<{ x: number; y: number; size: number; vy: number; type: string }> = []
  const particles: Array<{
    x: number
    y: number
    vx: number
    vy: number
    life: number
    color: string
    size: number
  }> = []
  let lastSpawn = 0
  let gameStartTime = Date.now()
  let gameEnded = false
  let mouseX = W / 2
  let inventory: string[] = []
  let controls: MobileControlRuntime | null = null

  const powerupIcons: Record<string, string> = {
    magnet: '\u{1F9F2}',
    shield: '🛡️',
    score2x: '✨',
    slow: '🐌',
  }

  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id,
    }))
    app.setupCustomPowerupBar('starCatcher', powerups, inventory, powerupId => {
      if (usePowerup(powerupId)) audioService.collect()
    })
  }

  function usePowerup(type: string): boolean {
    const index = inventory.indexOf(type)
    if (index === -1) return false
    inventory.splice(index, 1)
    const win = window as unknown as Record<string, number>
    switch (type) {
      case 'magnet':
        win.starMagnet = Date.now() + 8000
        audioService.win()
        break
      case 'shield':
        win.starShield = Date.now() + 5000
        audioService.win()
        break
      case 'score2x':
        win.starScore2x = Date.now() + 10_000
        audioService.win()
        break
      case 'slow':
        win.starSlow = Date.now() + 8000
        audioService.collect()
        break
    }
    return true
  }

  function spawnStar() {
    stars.push({
      x: 40 + Math.random() * (W - 80),
      y: -30,
      size: 25 + Math.random() * 15,
      vy: 2 + Math.random() * 2,
      type: Math.random() < 0.3 ? 'gold' : 'normal',
      rotation: 0,
    })
  }

  function spawnObstacle() {
    obstacles.push({
      x: 40 + Math.random() * (W - 80),
      y: -30,
      size: 30,
      vy: 3 + Math.random() * 2,
      type: 'cloud',
    })
  }

  function draw() {
    ctx2d.fillStyle = gtrs.background
    ctx2d.fillRect(0, 0, W, H)
    for (let i = 0; i < 50; i++) {
      const sx = (i * 73) % W
      const sy = (i * 137) % H
      const twinkle = Math.sin(Date.now() / 500 + i) * 0.5 + 0.5
      ctx2d.fillStyle = `rgba(255, 255, 255, ${0.3 + twinkle * 0.4})`
      ctx2d.beginPath()
      ctx2d.arc(sx, sy, 1 + twinkle, 0, Math.PI * 2)
      ctx2d.fill()
    }
    stars.forEach(s => {
      ctx2d.save()
      ctx2d.translate(s.x, s.y)
      ctx2d.rotate(s.rotation)
      ctx2d.shadowColor = s.type === 'gold' ? starGold : starNormal
      ctx2d.shadowBlur = 20
      const emoji = s.type === 'gold' ? '🌟' : '⭐'
      ctx2d.font = `${s.size}px sans-serif`
      ctx2d.textAlign = 'center'
      ctx2d.textBaseline = 'middle'
      ctx2d.fillText(emoji, 0, 0)
      ctx2d.restore()
    })
    obstacles.forEach(o => {
      ctx2d.font = '50px sans-serif'
      ctx2d.textAlign = 'center'
      ctx2d.textBaseline = 'middle'
      ctx2d.fillText('☁️', o.x, o.y)
    })
    ctx2d.save()
    ctx2d.translate(player.x, player.y)
    ctx2d.shadowColor = playerGlow
    ctx2d.shadowBlur = 15
    ctx2d.font = `${player.size}px sans-serif`
    ctx2d.textAlign = 'center'
    ctx2d.textBaseline = 'middle'
    ctx2d.fillText('🧚', 0, 0)
    ctx2d.restore()
    particles.forEach((p, i) => {
      p.life -= 0.03
      p.x += p.vx
      p.y += p.vy
      if (p.life <= 0) {
        particles.splice(i, 1)
        return
      }
      ctx2d.globalAlpha = p.life
      ctx2d.fillStyle = p.color
      ctx2d.beginPath()
      ctx2d.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx2d.fill()
      ctx2d.globalAlpha = 1
    })
    const elapsedHud = Date.now() - gameStartTime
    const remainingHud = Math.max(0, GAME_DURATION - elapsedHud)
    const secondsHud = Math.ceil(remainingHud / 1000)
    ctx2d.fillStyle = gtrs.hudBg
    ctx2d.beginPath()
    ctx2d.roundRect(10, 8, W - 20, 40, 10)
    ctx2d.fill()
    ctx2d.fillStyle = secondsHud <= 10 ? gtrs.danger : gtrs.accent
    ctx2d.font = 'bold 16px sans-serif'
    ctx2d.textAlign = 'center'
    ctx2d.textBaseline = 'middle'
    const streak = engine.getCombo()
    const comboLabel = streak >= 3 ? ` · 🔥${streak}连击` : ''
    ctx2d.fillText(`⏱ 剩余 ${secondsHud} 秒${comboLabel}`, W / 2, 28)
    ctx2d.fillStyle = 'rgba(255,255,255,0.4)'
    ctx2d.font = '16px sans-serif'
    ctx2d.fillText('�� 移动收集星星，躲避乌云!', W / 2, H - 25)
  }

  function update() {
    const win = window as unknown as Record<string, number>
    const slowMult = win.starSlow && Date.now() < win.starSlow ? 0.5 : 1
    const targetX = Math.max(30, Math.min(W - 30, mouseX))
    player.x += (targetX - player.x) * 0.15

    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i]
      s.y += s.vy * slowMult
      s.rotation += 0.05
      const dist = Math.hypot(player.x - s.x, player.y - s.y)
      if (dist < player.size + s.size / 2) {
        let base = s.type === 'gold' ? 20 : 10
        if (win.starScore2x && Date.now() < win.starScore2x) base *= 2
        gameActions.addScore(base, s.x, s.y, 'starCatcher')
        audioService.win()
        for (let j = 0; j < 12; j++) {
          particles.push({
            x: s.x,
            y: s.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1,
            color: s.type === 'gold' ? starGold : starNormal,
            size: 4 + Math.random() * 4,
          })
        }
        if (engine.getCombo() >= 5) engine.triggerRandomBuff()
        stars.splice(i, 1)
        continue
      }
      if (s.y > H + 50) {
        gameActions.breakCombo()
        stars.splice(i, 1)
      }
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i]
      o.y += o.vy * slowMult
      const dist = Math.hypot(player.x - o.x, player.y - o.y)
      const shielded = win.starShield && Date.now() < win.starShield
      if (!shielded && dist < player.size + o.size / 2) {
        gameActions.addScore(-30, player.x, player.y, 'starCatcher')
        gameActions.breakCombo()
        audioService.lose()
        for (let j = 0; j < 15; j++) {
          particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            life: 1,
            color: '#666',
            size: 5 + Math.random() * 5,
          })
        }
        obstacles.splice(i, 1)
        continue
      }
      if (o.y > H + 50) obstacles.splice(i, 1)
    }

    const now = Date.now()
    if (now - lastSpawn > 600) {
      if (stars.length < 4) spawnStar()
      if (obstacles.length < 2 && Math.random() < 0.3) spawnObstacle()
      lastSpawn = now
    }
  }

  return runCanvasLifecycle(ctx, {
    onInit() {
      applyCanvasMobileStyles(canvas)
      gameStartTime = Date.now()
      updateHTMLPowerupBar()
      controls = bindGameCanvasControls(canvas, {
        gameId: 'starCatcher',
        viewWidth: W,
        viewHeight: H,
        layout: { viewWidth: W, viewHeight: H, buttons: [] },
        onAction: (action, payload) => {
          if (gameEnded) return
          const x = payload.x ?? mouseX
          if (action === 'tap' || action === 'swipe') {
            mouseX = x
          }
        },
      })
    },
    onUpdate() {
      if (gameEnded) return
      if (Date.now() - gameStartTime > GAME_DURATION) {
        gameEnded = true
        gameActions.gameOver({ victory: false, score: engine.getScore() })
        return
      }
      update()
    },
    onRender() {
      draw()
    },
    onDestroy() {
      controls?.dispose()
      controls = null
      app.removePowerupBar?.()
    },
  })
}