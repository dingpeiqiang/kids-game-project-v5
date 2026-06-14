import { audioService } from '../services/audio'
import { app } from '../services/appBridge'
import { gameActions } from '../platform/gameBridge'
import type { GameLifecycleContext } from '../platform/GameLifecycle'
import { runCanvasLifecycle } from '../platform/GameLifecycle'
import type { GameLifecycle } from '../platform/GameLifecycle'
import { requireMainGameCanvas } from '../platform/canvasHost'
import { resizeCanvasForMobile } from '../utils/mobileHelper'
import { applyCanvasMobileStyles, bindCanvasPointerTapAndMove } from '../utils/canvasMobileUtils'

const W = 400
const H = 600
const GAME_DURATION = 60_000

export function startBouncePathLifecycle(ctx: GameLifecycleContext): GameLifecycle {
  const canvas = ctx.canvas ?? requireMainGameCanvas()
  const g = canvas.getContext('2d')!
  g.imageSmoothingEnabled = false
  const engine = ctx.engine

  const BALL_COLORS = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#FF69B4', '#9B59B6']
  let ball = { x: W / 2, y: H - 80, vx: 0, vy: 0, r: 15, color: BALL_COLORS[0] }
  const stars: Array<{
    x: number
    y: number
    size: number
    collected: boolean
    pulse: number
  }> = []
  const particles: Array<{
    x: number
    y: number
    vx: number
    vy: number
    life: number
    color: string
    size: number
  }> = []
  const trail: Array<{ x: number; y: number; life: number }> = []
  let gameStartTime = Date.now()
  let gameEnded = false
  let targetX = W / 2
  let inventory: string[] = []
  let unbindPointer: (() => void) | null = null

  const powerupIcons: Record<string, string> = {
    slow: '🐌',
    magnet: '��',
    multiball: '⚪',
    score2x: '✨',
  }

  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id,
    }))
    app.setupCustomPowerupBar('bouncePath', powerups, inventory, powerupId => {
      if (usePowerup(powerupId)) audioService.collect()
    })
  }

  function usePowerup(type: string): boolean {
    const index = inventory.indexOf(type)
    if (index === -1) return false
    inventory.splice(index, 1)
    switch (type) {
      case 'slow':
        ;(window as unknown as { bounceSlow?: number }).bounceSlow = Date.now() + 8000
        audioService.win()
        break
      case 'magnet':
        ;(window as unknown as { bounceMagnet?: number }).bounceMagnet = Date.now() + 10000
        audioService.win()
        break
      case 'multiball':
        ball.r = Math.min(ball.r * 1.5, 30)
        audioService.win()
        setTimeout(() => {
          ball.r = 15
        }, 5000)
        break
      case 'score2x':
        ;(window as unknown as { bounceScore2x?: number }).bounceScore2x = Date.now() + 10_000
        audioService.win()
        break
    }
    return true
  }

  function spawnStar() {
    const size = 20 + Math.random() * 15
    stars.push({
      x: Math.random() * (W - 60) + 30,
      y: Math.random() * (H - 150) + 80,
      size,
      collected: false,
      pulse: Math.random() * Math.PI * 2,
    })
  }

  function draw() {
    const grad = g.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#0f0c29')
    grad.addColorStop(0.5, '#302b63')
    grad.addColorStop(1, '#24243e')
    g.fillStyle = grad
    g.fillRect(0, 0, W, H)

    stars.forEach(s => {
      if (s.collected) return
      s.pulse += 0.05
      const pulse = Math.sin(s.pulse) * 3
      g.shadowBlur = 20
      g.shadowColor = '#FFD93D'
      g.font = `${s.size + pulse}px sans-serif`
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText('⭐', s.x, s.y)
      g.shadowBlur = 0
    })

    trail.forEach((t, i) => {
      t.life -= 0.05
      if (t.life <= 0) {
        trail.splice(i, 1)
        return
      }
      g.globalAlpha = t.life * 0.5
      g.fillStyle = ball.color
      g.beginPath()
      g.arc(t.x, t.y, ball.r * t.life, 0, Math.PI * 2)
      g.fill()
      g.globalAlpha = 1
    })

    g.shadowBlur = 15
    g.shadowColor = ball.color
    g.fillStyle = ball.color
    g.beginPath()
    g.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = 'rgba(255,255,255,0.4)'
    g.beginPath()
    g.arc(ball.x - ball.r * 0.3, ball.y - ball.r * 0.3, ball.r * 0.3, 0, Math.PI * 2)
    g.fill()
    g.shadowBlur = 0

    const elapsedHud = Date.now() - gameStartTime
    const remainingHud = Math.max(0, GAME_DURATION - elapsedHud)
    const secondsHud = Math.ceil(remainingHud / 1000)
    g.fillStyle = 'rgba(0,0,0,0.45)'
    g.beginPath()
    g.roundRect(10, 8, W - 20, 40, 10)
    g.fill()
    g.fillStyle = secondsHud <= 10 ? '#FF6B6B' : '#4ECDC4'
    g.font = 'bold 16px sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    const streak = engine.getCombo()
    const comboLabel = streak >= 2 ? ` · 🔥${streak}` : ''
    g.fillText(`⏱ 剩余 ${secondsHud} 秒${comboLabel}`, W / 2, 28)

    particles.forEach((p, i) => {
      p.life -= 0.03
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.1
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
  }

  function update() {
    const dx = targetX - ball.x
    ball.x += dx * 0.15
    ball.vx = dx * 0.1

    if (ball.x < ball.r) {
      ball.x = ball.r
      ball.vx *= -0.8
    }
    if (ball.x > W - ball.r) {
      ball.x = W - ball.r
      ball.vx *= -0.8
    }
    if (ball.y < ball.r + 70) {
      ball.y = ball.r + 70
      ball.vy *= -0.9
    }
    if (ball.y > H - ball.r - 50) {
      ball.y = H - ball.r - 50
      ball.vy *= -0.8
    }

    ball.vy += 0.15
    ball.y += ball.vy

    if (Math.abs(ball.vx) > 0.5 || Math.abs(ball.vy) > 0.5) {
      trail.push({ x: ball.x, y: ball.y, life: 1 })
    }

    const win = window as unknown as { bounceMagnet?: number; bounceScore2x?: number }
    const isMagnet = win.bounceMagnet && Date.now() < win.bounceMagnet

    stars.forEach(s => {
      if (s.collected) return
      if (isMagnet) {
        const mdx = ball.x - s.x
        const mdy = ball.y - s.y
        const dist = Math.hypot(mdx, mdy)
        if (dist > 0 && dist < 200) {
          s.x += (mdx / dist) * 2
          s.y += (mdy / dist) * 2
        }
      }
      const dist = Math.hypot(ball.x - s.x, ball.y - s.y)
      if (dist < ball.r + s.size / 2) {
        s.collected = true
        let base = 20
        if (win.bounceScore2x && Date.now() < win.bounceScore2x) base *= 2
        gameActions.addScore(base, s.x, s.y, 'bouncePath')
        audioService.win()
        for (let i = 0; i < 20; i++) {
          particles.push({
            x: s.x,
            y: s.y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1,
            color: '#FFD93D',
            size: 3 + Math.random() * 5,
          })
        }
        if (engine.getCombo() >= 3) engine.triggerRandomBuff()
      }
    })

    if (stars.filter(s => !s.collected).length < 3) spawnStar()
  }

  return runCanvasLifecycle(ctx, {
    onInit() {
      resizeCanvasForMobile(canvas)
      applyCanvasMobileStyles(canvas)
      gameStartTime = Date.now()
      for (let i = 0; i < 5; i++) spawnStar()
      updateHTMLPowerupBar()
      unbindPointer = bindCanvasPointerTapAndMove(
        canvas,
        x => {
          targetX = x
        },
        x => {
          targetX = x
          ball.vy = -8
          audioService.collect()
        },
      )
    },
    onUpdate(_dt) {
      if (gameEnded) return
      const elapsed = Date.now() - gameStartTime
      if (elapsed > GAME_DURATION) {
        gameEnded = true
        unbindPointer?.()
        unbindPointer = null
        gameActions.gameOver({ victory: false, score: engine.getScore() })
        return
      }
      update()
    },
    onRender() {
      draw()
    },
    onDestroy() {
      unbindPointer?.()
      unbindPointer = null
      app.removePowerupBar?.()
    },
  })
}