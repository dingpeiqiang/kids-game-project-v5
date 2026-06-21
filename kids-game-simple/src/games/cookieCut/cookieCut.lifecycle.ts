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
import { readGtrsSceneList, readGtrsSceneMeta } from '../../utils/gtrsSceneMeta'

const W = 400
const H = 600
const GAME_DURATION = 60_000

const COOKIE_SHAPES = [
  { shape: 'star', emoji: '⭐' },
  { shape: 'heart', emoji: '❤️' },
  { shape: 'circle', emoji: '🍪' },
  { shape: 'moon', emoji: '🌙' },
  { shape: 'flower', emoji: '🌸' },
] as const

type Cookie = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  rotSpeed: number
  shape: string
  emoji: string
  color: string
  sliced: boolean
}

export function startCookieCutLifecycle(ctx: GameLifecycleContext): GameLifecycle {
  const canvas = ctx.canvas ?? requireMainGameCanvas()
  const g = canvas.getContext('2d')!
  g.imageSmoothingEnabled = false
  const engine = ctx.engine

  const COOKIE_FALLBACK = {
    primary: '#D2691E',
    background: '#2D1B0E',
    backgroundDark: '#1a1008',
    text: '#FFFFFF',
    accent: '#FFD700',
    hudBg: 'rgba(0,0,0,0.4)',
    danger: '#FF4444',
    muted: '#8B4513',
    palette: ['#FFD700', '#FF6B6B', '#D2691E', '#F0E68C', '#FF69B4'],
  }
  const gtrs = resolveGtrsCanvasStyle('cookieCut', COOKIE_FALLBACK)
  const theme = getCachedGTRSTheme('cookieCut')
  const overlayTop = readGtrsSceneMeta(theme, 'overlay_top') ?? 'rgba(139, 69, 19, 0.3)'
  const overlayBottom = readGtrsSceneMeta(theme, 'overlay_bottom') ?? 'rgba(101, 67, 33, 0.5)'
  const cookieColors = readGtrsSceneList(theme, 'game_palette') ?? [...gtrs.palette]
  const crumbColors = readGtrsSceneList(theme, 'crumb_palette') ?? [
    '#D2691E',
    '#FFD700',
    '#F4A460',
    '#8B4513',
  ]

  const cookies: Cookie[] = []
  const particles: Array<{
    x: number
    y: number
    vx: number
    vy: number
    life: number
    color: string
    size: number
  }> = []
  const slices: Array<{ x1: number; y1: number; x2: number; y2: number; life: number }> = []
  let lastSpawn = 0
  let gameStartTime = Date.now()
  let gameEnded = false
  let sliceLastX = 0
  let sliceLastY = 0
  let controls: MobileControlRuntime | null = null
  let inventory: string[] = []

  const powerupIcons: Record<string, string> = {
    slow: '🐌',
    score2x: '✨',
    freeze: '❄️',
    magnet: '\u{1F9F2}',
  }

  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id,
    }))
    app.setupCustomPowerupBar('cookieCut', powerups, inventory, powerupId => {
      if (usePowerup(powerupId)) audioService.collect()
    })
  }

  function usePowerup(type: string): boolean {
    const index = inventory.indexOf(type)
    if (index === -1) return false
    inventory.splice(index, 1)
    const win = window as unknown as Record<string, number>
    switch (type) {
      case 'slow':
        win.cookieSlow = Date.now() + 8000
        break
      case 'score2x':
        win.cookieScore2x = Date.now() + 10_000
        audioService.win()
        break
      case 'freeze':
        win.cookieFreeze = Date.now() + 3000
        audioService.win()
        break
      case 'magnet':
        win.cookieMagnet = Date.now() + 6000
        audioService.win()
        break
    }
    return true
  }

  function spawnCookie() {
    const size = 50 + Math.random() * 20
    const x = 60 + Math.random() * (W - 120)
    const idx = Math.floor(Math.random() * COOKIE_SHAPES.length)
    const template = COOKIE_SHAPES[idx]!
    cookies.push({
      x,
      y: H + size,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -(3 + Math.random() * 2),
      size,
      rotation: 0,
      rotSpeed: (Math.random() - 0.5) * 0.08,
      shape: template.shape,
      emoji: template.emoji,
      color: cookieColors[idx % cookieColors.length]!,
      sliced: false,
    })
  }

  function draw() {
    g.fillStyle = gtrs.background
    g.fillRect(0, 0, W, H)
    const grad = g.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, overlayTop)
    grad.addColorStop(1, overlayBottom)
    g.fillStyle = grad
    g.fillRect(0, 0, W, H)

    slices.forEach((s, i) => {
      s.life -= 0.05
      if (s.life <= 0) {
        slices.splice(i, 1)
        return
      }
      g.lineCap = 'round'
      g.lineWidth = 16 * s.life
      g.strokeStyle = `rgba(255, 200, 100, ${s.life * 0.6})`
      g.beginPath()
      g.moveTo(s.x1, s.y1)
      g.lineTo(s.x2, s.y2)
      g.stroke()
      g.lineWidth = 4 * s.life
      g.strokeStyle = `rgba(255, 255, 255, ${s.life})`
      g.stroke()
    })

    cookies.forEach(c => {
      if (c.sliced) return
      g.save()
      g.translate(c.x, c.y)
      g.rotate(c.rotation)
      g.shadowColor = c.color
      g.shadowBlur = 15
      g.font = `${c.size}px sans-serif`
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText(c.emoji, 0, 0)
      g.restore()
    })

    particles.forEach((p, i) => {
      p.life -= 0.02
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.25
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
    const remainingHud = Math.max(0, GAME_DURATION - elapsedHud)
    const secondsHud = Math.ceil(remainingHud / 1000)
    g.fillStyle = gtrs.hudBg
    g.beginPath()
    g.roundRect(10, 8, W - 20, 40, 10)
    g.fill()
    g.fillStyle = secondsHud <= 10 ? gtrs.danger : gtrs.primary
    g.font = 'bold 16px sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    const streak = engine.getCombo()
    const comboLabel = streak >= 2 ? ` · 🔥${streak}连击` : ''
    g.fillText(`⏱ 剩余 ${secondsHud} 秒${comboLabel}`, W / 2, 28)

    g.fillStyle = 'rgba(255,255,255,0.5)'
    g.font = '18px sans-serif'
    g.fillText('�� 滑动切割上升的饼干!', W / 2, H - 25)
  }

  function update() {
    const win = window as unknown as Record<string, number>
    const frozen = win.cookieFreeze && Date.now() < win.cookieFreeze
    const slow = win.cookieSlow && Date.now() < win.cookieSlow
    const speedMult = frozen ? 0 : slow ? 0.5 : 1

    for (let i = cookies.length - 1; i >= 0; i--) {
      const c = cookies[i]
      c.x += c.vx * speedMult
      c.y += c.vy * speedMult
      c.rotation += c.rotSpeed * speedMult
      if (c.x < c.size / 2) {
        c.x = c.size / 2
        c.vx *= -0.8
      }
      if (c.x > W - c.size / 2) {
        c.x = W - c.size / 2
        c.vx *= -0.8
      }
      if (c.y < -c.size * 2) {
        gameActions.breakCombo()
        cookies.splice(i, 1)
      }
    }

    const now = Date.now()
    if (!frozen && now - lastSpawn > 1500 && cookies.length < 3) {
      spawnCookie()
      lastSpawn = now
    }
  }

  function checkSlice(x1: number, y1: number, x2: number, y2: number) {
    const sliceLen = Math.hypot(x2 - x1, y2 - y1)
    if (sliceLen < 20) return
    const win = window as unknown as Record<string, number>
    const score2x = win.cookieScore2x && Date.now() < win.cookieScore2x

    for (let i = cookies.length - 1; i >= 0; i--) {
      const c = cookies[i]
      if (c.sliced) continue
      const dx = x2 - x1
      const dy = y2 - y1
      const fx = c.x - x1
      const fy = c.y - y1
      const t = Math.max(0, Math.min(1, (fx * dx + fy * dy) / (sliceLen * sliceLen || 1)))
      const dist = Math.hypot(c.x - (x1 + t * dx), c.y - (y1 + t * dy))
      if (dist < c.size / 2 + 25) {
        c.sliced = true
        let pts = 15
        if (score2x) pts *= 2
        gameActions.addScore(pts, c.x, c.y, 'cookieCut')
        audioService.win()
        for (let j = 0; j < 18; j++) {
          particles.push({
            x: c.x,
            y: c.y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1,
            color: crumbColors[Math.floor(Math.random() * crumbColors.length)]!,
            size: 4 + Math.random() * 6,
          })
        }
        if (engine.getCombo() >= 3) engine.triggerRandomBuff()
        cookies.splice(i, 1)
      }
    }
  }

  function onSliceSegment(x1: number, y1: number, x2: number, y2: number) {
    slices.push({ x1, y1, x2, y2, life: 1 })
    checkSlice(x1, y1, x2, y2)
  }

  return runCanvasLifecycle(ctx, {
    onInit() {
      applyCanvasMobileStyles(canvas)
      gameStartTime = Date.now()
      spawnCookie()
      setTimeout(spawnCookie, 500)
      updateHTMLPowerupBar()
      controls = bindGameCanvasControls(canvas, {
        gameId: 'cookieCut',
        viewWidth: W,
        viewHeight: H,
        layout: { viewWidth: W, viewHeight: H, buttons: [] },
        onAction: (action, payload) => {
          if (gameEnded) return
          const x = payload.x ?? 0
          const y = payload.y ?? 0
          if (action === 'tap') {
            sliceLastX = x
            sliceLastY = y
            return
          }
          if (action === 'swipe') {
            const dx = payload.dx ?? 0
            const dy = payload.dy ?? 0
            if (dx === 0 && dy === 0) return
            const x2 = x
            const y2 = y
            onSliceSegment(sliceLastX, sliceLastY, x2, y2)
            sliceLastX = x2
            sliceLastY = y2
          }
        },
      })
    },
    onUpdate() {
      if (gameEnded) return
      if (Date.now() - gameStartTime > GAME_DURATION) {
        gameEnded = true
        gameActions.gameOver({ victory: true, score: engine.getScore() })
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