import { BASE_H, BASE_W } from './config'
import type { GameState } from './types'
import { applyCanvasMobileStyles, clientToCanvas } from '../../utils/canvasMobileUtils'
import { bindGameCanvasControls } from '../../platform/mobileControls'
import type { MobileControlRuntime } from '../../platform/mobileControls'

export interface InputState {
  pointerX: number | null
  pointerDown: boolean
}

export function createInputState(): InputState {
  return { pointerX: null, pointerDown: false }
}

/** 横向跟手 + 点击选 buff（registry `swipe_pan`；PC 鼠标未按键时仍跟手） */
export function bindBeatDragonInput(
  canvas: HTMLCanvasElement,
  input: InputState,
  onTap: (x: number, y: number) => void,
): () => void {
  applyCanvasMobileStyles(canvas)

  let controls: MobileControlRuntime | null = null

  const setX = (x: number) => {
    input.pointerX = x
  }

  controls = bindGameCanvasControls(canvas, {
    gameId: 'beatDragon',
    viewWidth: BASE_W,
    viewHeight: BASE_H,
    layout: { viewWidth: BASE_W, viewHeight: BASE_H, buttons: [] },
    onAction: (action, payload) => {
      const x = payload.x ?? input.pointerX ?? BASE_W / 2
      const y = payload.y ?? 0
      if (action === 'tap') {
        input.pointerDown = true
        setX(x)
        onTap(x, y)
        return
      }
      if (action === 'swipe') {
        input.pointerDown = true
        setX(x)
      }
    },
  })

  const onMouseMoveHover = (e: MouseEvent) => {
    if (e.buttons !== 0) return
    const { x } = clientToCanvas(canvas, e.clientX, e.clientY)
    setX(x)
  }
  const onMouseUp = () => {
    input.pointerDown = false
  }
  canvas.addEventListener('mousemove', onMouseMoveHover)
  window.addEventListener('mouseup', onMouseUp)

  return () => {
    controls?.dispose()
    controls = null
    canvas.removeEventListener('mousemove', onMouseMoveHover)
    window.removeEventListener('mouseup', onMouseUp)
    input.pointerDown = false
  }
}

export function applyPlayerMove(state: GameState, input: InputState, margin = 32) {
  if (input.pointerX == null) return
  if (state.phase !== 'playing' && state.phase !== 'waveClear') return
  state.player.x = Math.max(margin, Math.min(BASE_W - margin, input.pointerX))
}