import { audioService } from '../../services/audio'
import { app } from '../../services/appBridge'
import { gameActions } from '../../platform/gameBridge'
import type { GameLifecycleContext } from '../../platform/GameLifecycle'
import { runCanvasLifecycle, type GameLifecycle } from '../../platform/GameLifecycle'
import { requireMainGameCanvas } from '../../platform/canvasHost'
import { resizeCanvasForMobile } from '../../utils/mobileHelper'
import { applyCanvasMobileStyles, bindCanvasPointerInput } from '../../utils/canvasMobileUtils'
import { resolveGtrsCanvasStyle, type GtrsCanvasStyle } from '../../utils/gtrsCanvasTheme'

const W = 400
const H = 600
const TOTAL_TIME = 90_000

const COLOR_NAMES = ['红', '蓝', '黄', '绿', '紫', '橙'] as const
const COLOR_EMOJI = ['��', '��', '��', '🟢', '🟣', '🟠'] as const

const SHAPES = ['circle', 'square', 'triangle', 'star'] as const

function buildColorTapColors(gtrs: GtrsCanvasStyle) {
  return COLOR_NAMES.map((name, i) => ({
    name,
    hex: gtrs.palette[i % gtrs.palette.length],
    emoji: COLOR_EMOJI[i],
  }))
}

export function startColorTapLifecycle(ctx: GameLifecycleContext): GameLifecycle {
  const canvas = ctx.canvas ?? requireMainGameCanvas()
  const g = canvas.getContext('2d')!
  g.imageSmoothingEnabled = false
  const engine = ctx.engine
  const gtrsStyle = resolveGtrsCanvasStyle('colorTap')
  const COLORS = buildColorTapColors(gtrsStyle)

  let currentColor = 0
  let currentShape = 0
  let particles: Array<{
    x: number
    y: number
    vx: number
    vy: number
    life: number
    color: string
    size: number
  }> = []
  let gameEnded = false
  let gameStartTime = Date.now()
  let inventory: string[] = []
  let lastSoundTime = 0
  const MIN_SOUND_INTERVAL = 80
  let unbindPointer: (() => void) | null = null

  const powerupIcons: Record<string, string> = {
    time_plus: '⏰',
    auto_tap: '🤖',
    score3x: '✨',
    freeze: '❄️',
  }

  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id,
    }))
    app.setupCustomPowerupBar('colorTap', powerups, inventory, powerupId => {
      const now = Date.now()
      if (now - lastSoundTime > MIN_SOUND_INTERVAL && usePowerup(powerupId)) {
        audioService.click()
        lastSoundTime = now
      }
    })
  }

  function usePowerup(type: string): boolean {
    const index = inventory.indexOf(type)
    if (index === -1) return false
    inventory.splice(index, 1)
    const now = Date.now()
    const win = window as unknown as Record<string, number>
    switch (type) {
      case 'time_plus':
        win.colorTimeBonus = (win.colorTimeBonus ?? 0) + 10_000
        if (now - lastSoundTime > MIN_SOUND_INTERVAL) {
          audioService.collect()
          lastSoundTime = now
        }
        break
      case 'auto_tap':
        win.colorAutoTap = Date.now() + 5000
        if (now - lastSoundTime > MIN_SOUND_INTERVAL) {
          audioService.buff()
          lastSoundTime = now
        }
        break
      case 'score3x':
        win.colorScore3x = Date.now() + 10_000
        if (now - lastSoundTime > MIN_SOUND_INTERVAL) {
          audioService.buff()
          lastSoundTime = now
        }
        break
      case 'freeze':
        win.colorFreeze = Date.now() + 8000
        if (now - lastSoundTime > MIN_SOUND_INTERVAL) {
          audioService.freeze()
          lastSoundTime = now
        }
        break
    }
    return true
  }

  function spawnChallenge() {
    currentColor = Math.floor(Math.random() * COLORS.length)
    currentShape = Math.floor(Math.random() * SHAPES.length)
  }

  function drawStar(cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
    let rot = (Math.PI / 2) * 3
    let x = cx
    let y = cy
    const step = Math.PI / spikes
    g.moveTo(cx, cy - outerRadius)
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius
      y = cy + Math.sin(rot) * outerRadius
      g.lineTo(x, y)
      rot += step
      x = cx + Math.cos(rot) * innerRadius
      y = cy + Math.sin(rot) * innerRadius
      g.lineTo(x, y)
      rot += step
    }
    g.lineTo(cx, cy - outerRadius)
    g.closePath()
  }

  function lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const R = Math.min(255, (num >> 16) + percent)
    const G = Math.min(255, ((num >> 8) & 0xFF) + percent)
    const B = Math.min(255, (num & 0xFF) + percent)
    return `rgb(${R},${G},${B})`
  }

  function draw() {
    g.fillStyle = gtrsStyle.background
    g.fillRect(0, 0, W, H)

    const win = window as unknown as Record<string, number>
    const elapsedHud = Date.now() - gameStartTime
    const bonus = win.colorTimeBonus ?? 0
    const remainingHud = Math.max(0, TOTAL_TIME + bonus - elapsedHud)
    const secondsHud = Math.ceil(remainingHud / 1000)
    g.fillStyle = gtrsStyle.hudBg
    g.beginPath()
    g.roundRect(10, 8, W - 20, 40, 10)
    g.fill()
    g.fillStyle = secondsHud <= 10 ? gtrsStyle.danger : gtrsStyle.accent
    g.font = 'bold 20px sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    const streak = engine.getCombo()
    const comboLabel = streak >= 2 ? ` · 🔥${streak}` : ''
    g.fillText(`⏱ 剩余 ${secondsHud} 秒${comboLabel}`, W / 2, 28)

    g.fillStyle = 'rgba(255,255,255,0.85)'
    g.font = '22px sans-serif'
    g.fillText(`目标: ${COLORS[currentColor].name}`, W / 2, 78)

    const shapeX = W / 2
    const shapeY = 200
    const shapeSize = 80
    const color = COLORS[currentColor].hex
    g.shadowColor = color
    g.shadowBlur = 20
    g.fillStyle = color
    g.beginPath()
    if (currentShape === 0) {
      g.arc(shapeX, shapeY, shapeSize / 2, 0, Math.PI * 2)
    } else if (currentShape === 1) {
      g.roundRect(shapeX - shapeSize / 2, shapeY - shapeSize / 2, shapeSize, shapeSize, 10)
    } else if (currentShape === 2) {
      g.moveTo(shapeX, shapeY - shapeSize / 2)
      g.lineTo(shapeX + shapeSize / 2, shapeY + shapeSize / 2)
      g.lineTo(shapeX - shapeSize / 2, shapeY + shapeSize / 2)
      g.closePath()
    } else {
      drawStar(shapeX, shapeY, 5, shapeSize / 2, shapeSize / 4)
    }
    g.fill()
    g.shadowBlur = 0

    const btnY = 420
    const btnSize = 55
    const gap = 15
    const totalWidth = COLORS.length * btnSize + (COLORS.length - 1) * gap
    const startX = (W - totalWidth) / 2 + btnSize / 2

    COLORS.forEach((c, i) => {
      const bx = startX + i * (btnSize + gap)
      const grad = g.createRadialGradient(bx - 5, btnY - 5, 0, bx, btnY, btnSize / 2)
      grad.addColorStop(0, lightenColor(c.hex, 40))
      grad.addColorStop(1, c.hex)
      g.shadowColor = c.hex
      g.shadowBlur = 10
      g.fillStyle = grad
      g.beginPath()
      g.arc(bx, btnY, btnSize / 2, 0, Math.PI * 2)
      g.fill()
      g.shadowBlur = 0
      g.fillStyle = '#fff'
      g.font = 'bold 12px sans-serif'
      g.textAlign = 'center'
      g.fillText(c.name, bx, btnY + 25)
    })

    particles.forEach((p, i) => {
      p.life -= 0.025
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.15
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

    g.fillStyle = 'rgba(255,255,255,0.5)'
    g.font = '16px sans-serif'
    g.fillText('�� 点击下方按钮匹配颜色!', W / 2, H - 25)
  }

  function handleClick(x: number, y: number) {
    const btnY = 420
    const btnSize = 55
    const gap = 15
    const totalWidth = COLORS.length * btnSize + (COLORS.length - 1) * gap
    const startX = (W - totalWidth) / 2 + btnSize / 2

    COLORS.forEach((c, i) => {
      const bx = startX + i * (btnSize + gap)
      const dist = Math.hypot(x - bx, y - btnY)
      if (dist >= btnSize / 2) return

      if (i === currentColor) {
        const streak = engine.getCombo() + 1
        let pts = 10 * streak
        const win = window as unknown as Record<string, number>
        if (win.colorScore3x && Date.now() < win.colorScore3x) pts *= 3
        gameActions.addScore(pts, bx, btnY, 'colorTap')

        const now = Date.now()
        if (now - lastSoundTime > MIN_SOUND_INTERVAL) {
          audioService.pop()
          lastSoundTime = now
        }
        for (let j = 0; j < 15; j++) {
          particles.push({
            x: bx,
            y: btnY,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            life: 1,
            color: c.hex,
            size: 6 + Math.random() * 6,
          })
        }
        if (engine.getCombo() >= 5) engine.triggerRandomBuff()
        spawnChallenge()
      } else {
        gameActions.breakCombo()
        const now = Date.now()
        if (now - lastSoundTime > MIN_SOUND_INTERVAL) {
          audioService.fail()
          lastSoundTime = now
        }
        for (let j = 0; j < 8; j++) {
          particles.push({
            x: bx,
            y: btnY,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1,
            color: gtrsStyle.muted,
            size: 4 + Math.random() * 4,
          })
        }
      }
    })
  }

  return runCanvasLifecycle(ctx, {
    onInit() {
      resizeCanvasForMobile(canvas)
      applyCanvasMobileStyles(canvas)
      gameStartTime = Date.now()
      spawnChallenge()
      updateHTMLPowerupBar()
      unbindPointer = bindCanvasPointerInput(canvas, (x, y) => handleClick(x, y))
      const initAudio = () => {
        audioService.initOnGesture()
        document.removeEventListener('click', initAudio)
        document.removeEventListener('touchstart', initAudio)
      }
      document.addEventListener('click', initAudio, { once: true })
      document.addEventListener('touchstart', initAudio, { once: true })
    },
    onUpdate() {
      if (gameEnded) return
      const win = window as unknown as Record<string, number>
      const bonus = win.colorTimeBonus ?? 0
      const elapsed = Date.now() - gameStartTime
      if (elapsed > TOTAL_TIME + bonus) {
        gameEnded = true
        unbindPointer?.()
        unbindPointer = null
        gameActions.gameOver({ victory: true, score: engine.getScore() })
      }
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