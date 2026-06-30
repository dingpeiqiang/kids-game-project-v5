import { applyCanvasMobileStyles } from '@shell/utils/canvasMobileUtils'
import { bindGameCanvasControls } from '@shell/platform/mobileControls'
import type { MobileControlRuntime } from '@shell/platform/mobileControls'
import { BASE_H, BASE_W } from './config'
import type { GameState } from './types'

export interface InputState {
  moveX: number | null
  moveY: number | null
  pointerDown: boolean
}

export interface UiHit {
  kind: 'skill1' | 'ult' | 'auto' | 'result'
}

export function createInputState(): InputState {
  return { moveX: null, moveY: null, pointerDown: false }
}

export function getUiLayout(canvasW: number, canvasH: number) {
  const sx = canvasW / BASE_W
  const sy = canvasH / BASE_H
  const skillR = 52 * Math.min(sx, sy)
  const margin = 24 * sx
  return {
    skill1: { cx: canvasW - margin - skillR, cy: canvasH - margin - skillR * 2.2, r: skillR },
    ult: { cx: canvasW - margin - skillR, cy: canvasH - margin - skillR * 0.6, r: skillR },
    auto: { cx: canvasW - margin - skillR * 2.4, cy: canvasH - margin - skillR, r: skillR * 0.85 },
    result: { x: canvasW * 0.2, y: canvasH * 0.35, w: canvasW * 0.6, h: canvasH * 0.3 },
  }
}

function hitCircle(px: number, py: number, cx: number, cy: number, r: number): boolean {
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r
}

export function hitTestUi(canvasW: number, canvasH: number, px: number, py: number, state: GameState): UiHit | null {
  const ui = getUiLayout(canvasW, canvasH)
  if (state.phase === 'victory' || state.phase === 'defeat') {
    const r = ui.result
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return { kind: 'result' }
    return { kind: 'result' }
  }
  if (hitCircle(px, py, ui.skill1.cx, ui.skill1.cy, ui.skill1.r)) return { kind: 'skill1' }
  if (hitCircle(px, py, ui.ult.cx, ui.ult.cy, ui.ult.r)) return { kind: 'ult' }
  if (hitCircle(px, py, ui.auto.cx, ui.auto.cy, ui.auto.r)) return { kind: 'auto' }
  return null
}

/** 左区拖移英雄 + 右侧自绘技能圈点选（混合 §5.2，preset `swipe_pan`） */
export function bindKingBabyInput(
  canvas: HTMLCanvasElement,
  input: InputState,
  state: GameState,
  onPointer: (canvasX: number, canvasY: number, ui: UiHit | null) => void,
): () => void {
  applyCanvasMobileStyles(canvas)

  let controls: MobileControlRuntime | null = null

  const applyPos = (x: number, y: number, fireTap: boolean) => {
    input.moveX = x
    input.moveY = y
    if (fireTap) {
      input.pointerDown = true
      onPointer(x, y, hitTestUi(canvas.width, canvas.height, x, y, state))
    }
  }

  controls = bindGameCanvasControls(canvas, {
    gameId: 'kingBaby',
    preset: 'swipe_pan',
    viewWidth: canvas.width,
    viewHeight: canvas.height,
    layout: { viewWidth: canvas.width, viewHeight: canvas.height, buttons: [] },
    onAction: (action, payload) => {
      const x = payload.x ?? input.moveX ?? canvas.width / 2
      const y = payload.y ?? input.moveY ?? canvas.height / 2
      if (action === 'tap') {
        applyPos(x, y, true)
        return
      }
      if (action === 'swipe') {
        input.pointerDown = true
        applyPos(x, y, false)
      }
    },
  })

  const onUp = () => {
    input.pointerDown = false
  }
  window.addEventListener('mouseup', onUp)
  canvas.addEventListener('touchend', onUp)

  return () => {
    controls?.dispose()
    controls = null
    window.removeEventListener('mouseup', onUp)
    canvas.removeEventListener('touchend', onUp)
    input.pointerDown = false
  }
}

export function applyHeroMove(state: GameState, input: InputState, canvasW: number, canvasH: number) {
  if (state.phase !== 'playing' || state.hero.dead) return
  if (input.moveX == null || input.moveY == null) return

  const ui = getUiLayout(canvasW, canvasH)
  const sx = canvasW / BASE_W
  const sy = canvasH / BASE_H
  const leftZoneW = canvasW * 0.55
  if (input.moveX > leftZoneW) return

  const gx = (input.moveX / sx)
  const gy = (input.moveY / sy)
  const h = state.hero
  const lerp = state.autoFight ? 0.12 : 0.22
  h.x += (gx - h.x) * lerp
  h.y += (gy - h.y) * lerp
  h.x = Math.max(60, Math.min(BASE_W - 200, h.x))
  h.y = Math.max(60, Math.min(BASE_H - 60, h.y))
  if (gx > h.x) h.facing = 1
  else if (gx < h.x) h.facing = -1

  void ui
}