import { audioService } from '../../services/audio'
import { gameActions } from '../../platform/gameBridge'
import type { GameLifecycleContext } from '../../platform/GameLifecycle'
import type { GameLifecycle } from '../../platform/GameLifecycle'
import { hostCanvas2D } from '../../platform/hostCanvas2D'
import { requireMainGameCanvas } from '../../platform/canvasHost'
import {
  bindMobileControlPreset,
  getGameControlPreset,
} from '../../platform/mobileControls'
import { getCachedGTRSTheme } from '../../services/gtrsThemeLoader'
import { resolveGtrsCanvasStyle } from '../../utils/gtrsCanvasTheme'
import { readGtrsSceneMeta } from '../../utils/gtrsSceneMeta'

const W = 400
const H = 600
const GAME_MS = 60_000
const COLS = 3
const ROWS = 3

type MoleKind = 'normal' | 'gold' | 'bomb'

type Mole = {
  hole: number
  kind: MoleKind
  up: number
  maxUp: number
  visible: boolean
}

export function startWhackMoleLifecycle(ctx: GameLifecycleContext): GameLifecycle {
  const canvas = ctx.canvas ?? requireMainGameCanvas()
  const g = canvas.getContext('2d')!
  g.imageSmoothingEnabled = false
  const engine = ctx.engine

  const WHACK_FALLBACK = {
    primary: '#8D6E63',
    background: '#5D4037',
    backgroundDark: '#3E2723',
    text: '#FFFFFF',
    accent: '#FFD700',
    hudBg: '#8D6E63',
    danger: '#E53935',
    muted: '#6D4C41',
    palette: ['#8D6E63', '#6D4C41', '#3E2723'],
  }
  const gtrs = resolveGtrsCanvasStyle('whackMole', WHACK_FALLBACK)
  const theme = getCachedGTRSTheme('whackMole')
  const moleNormal = readGtrsSceneMeta(theme, 'mole_normal') ?? gtrs.primary
  const holeOuter = readGtrsSceneMeta(theme, 'hole_outer') ?? gtrs.backgroundDark
  const holeInner = readGtrsSceneMeta(theme, 'hole_inner') ?? gtrs.muted
  const moleGold = gtrs.accent
  const moleBomb = gtrs.danger

  const pad = 24
  const holeW = (W - pad * 2) / COLS
  const holeH = (H - 120 - pad * 2) / ROWS
  const holes = Array.from({ length: COLS * ROWS }, (_, i) => ({
    cx: pad + (i % COLS) * holeW + holeW / 2,
    cy: 100 + Math.floor(i / COLS) * holeH + holeH / 2,
    r: Math.min(holeW, holeH) * 0.32,
  }))

  let moles: Mole[] = []
  let gameStart = Date.now()
  let gameEnded = false
  let spawnTimer = 0
  let controls: ReturnType<typeof bindMobileControlPreset> | null = null

  function holeAt(x: number, y: number): number {
    for (let i = 0; i < holes.length; i++) {
      const h = holes[i]!
      if (Math.hypot(x - h.cx, y - h.cy) < h.r + 18) return i
    }
    return -1
  }

  function spawnMole() {
    const occupied = new Set(moles.filter(m => m.visible).map(m => m.hole))
    const free: number[] = []
    for (let i = 0; i < holes.length; i++) {
      if (!occupied.has(i)) free.push(i)
    }
    if (free.length === 0) return

    const hole = free[Math.floor(Math.random() * free.length)]!
    const roll = Math.random()
    let kind: MoleKind = 'normal'
    if (roll < 0.12) kind = 'bomb'
    else if (roll < 0.28) kind = 'gold'

    const elapsed = Date.now() - gameStart
    const speedBoost = Math.min(1.8, 1 + elapsed / 45_000)
    const maxUp = (kind === 'gold' ? 0.55 : kind === 'bomb' ? 0.85 : 0.7) / speedBoost

    moles.push({ hole, kind, up: 0, maxUp, visible: true })
  }

  function whackAt(x: number, y: number) {
    const hi = holeAt(x, y)
    if (hi < 0) return
    const idx = moles.findIndex(m => m.visible && m.hole === hi && m.up > 0.35)
    if (idx < 0) return
    const m = moles[idx]!
    m.visible = false
    const h = holes[m.hole]!
    if (m.kind === 'bomb') {
      gameActions.addScore(-100, h.cx, h.cy, 'whackMole')
      gameActions.breakCombo()
      audioService.fail()
    } else {
      const pts = m.kind === 'gold' ? 30 : 10
      gameActions.addScore(pts, h.cx, h.cy, 'whackMole')
      audioService.pop()
      if (engine.getCombo() >= 5) engine.triggerRandomBuff()
    }
  }

  function drawMoleHead(mole: Mole, h: { cx: number; cy: number; r: number }) {
    const pop = Math.sin(mole.up * Math.PI) * h.r * 0.9
    const cy = h.cy - pop * 0.35
    const rad = h.r * 0.55 + pop * 0.2
    g.fillStyle = mole.kind === 'gold' ? moleGold : mole.kind === 'bomb' ? moleBomb : moleNormal
    g.beginPath()
    g.arc(h.cx, cy, rad, 0, Math.PI * 2)
    g.fill()
    if (mole.kind === 'gold') {
      g.strokeStyle = '#FFF59D'
      g.lineWidth = 3
      g.stroke()
    }
    if (mole.kind === 'bomb') {
      g.fillStyle = '#fff'
      g.font = 'bold 16px sans-serif'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText('!', h.cx, cy)
    }
  }

  function draw() {
    g.fillStyle = gtrs.background
    g.fillRect(0, 0, W, H)
    g.fillStyle = gtrs.hudBg
    g.fillRect(0, 0, W, 88)

    const left = Math.max(0, GAME_MS - (Date.now() - gameStart))
    const sec = Math.ceil(left / 1000)
    g.fillStyle = gtrs.text
    g.font = 'bold 18px sans-serif'
    g.textAlign = 'center'
    g.fillText(`剩余 ${sec} 秒 · 得分 ${engine.getScore()}`, W / 2, 36)
    g.font = '14px sans-serif'
    g.fillStyle = 'rgba(255,255,255,0.85)'
    g.fillText('普通10 · 金色30 · 炸弹-100', W / 2, 62)

    holes.forEach((h, i) => {
      g.fillStyle = holeOuter
      g.beginPath()
      g.ellipse(h.cx, h.cy + 8, h.r + 6, h.r * 0.45, 0, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = holeInner
      g.beginPath()
      g.arc(h.cx, h.cy, h.r, 0, Math.PI * 2)
      g.fill()

      const mole = moles.find(m => m.visible && m.hole === i)
      if (!mole || mole.up <= 0) return
      drawMoleHead(mole, h)
    })
  }

  function update(dtMs: number) {
    spawnTimer += dtMs
    const interval = Math.max(280, 520 - (Date.now() - gameStart) / 120)
    if (spawnTimer >= interval) {
      spawnTimer = 0
      if (Math.random() < 0.75) spawnMole()
    }

    moles.forEach(m => {
      if (!m.visible) return
      m.up += dtMs / 1000 / m.maxUp
      if (m.up >= 1) m.visible = false
    })
    moles = moles.filter(m => m.visible || m.up < 1.2)
  }

  return hostCanvas2D(ctx, {
    onInit() {
      gameStart = Date.now()
      controls = bindMobileControlPreset(canvas, {
        preset: getGameControlPreset('whackMole'),
        viewWidth: W,
        viewHeight: H,
        onAction: (action, payload) => {
          if (action === 'tap' && payload.x != null && payload.y != null) {
            whackAt(payload.x, payload.y)
          }
        },
      })
    },
    onUpdate(dt) {
      if (gameEnded) return
      if (Date.now() - gameStart >= GAME_MS) {
        gameEnded = true
        controls?.dispose()
        controls = null
        audioService.win()
        gameActions.gameOver({ victory: true, score: engine.getScore() })
        return
      }
      update(dt * 1000)
    },
    onRender() {
      draw()
    },
    onDestroy() {
      controls?.dispose()
      controls = null
    },
  })
}