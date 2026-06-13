import { BASE_W } from './config'
import type { GameState } from './types'
import { applyCanvasMobileStyles, clientToCanvas } from '../../utils/canvasMobileUtils'

export interface InputState {
  pointerX: number | null
  pointerDown: boolean
}

export function createInputState(): InputState {
  return { pointerX: null, pointerDown: false }
}

export function bindBeatDragonInput(
  canvas: HTMLCanvasElement,
  input: InputState,
  onTap: (x: number, y: number) => void,
): () => void {
  applyCanvasMobileStyles(canvas)

  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault()
    input.pointerDown = true
    const { x, y } = clientToCanvas(canvas, e.clientX, e.clientY)
    input.pointerX = x
    onTap(x, y)
  }

  const onPointerMove = (e: PointerEvent) => {
    const { x } = clientToCanvas(canvas, e.clientX, e.clientY)
    if (!input.pointerDown && e.pointerType === 'mouse') {
      input.pointerX = x
      return
    }
    if (input.pointerDown) input.pointerX = x
  }

  const onPointerUp = () => {
    input.pointerDown = false
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)

  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('pointercancel', onPointerUp)
  }
}

export function applyPlayerMove(state: GameState, input: InputState, margin = 32) {
  if (input.pointerX == null) return
  if (state.phase !== 'playing' && state.phase !== 'waveClear') return
  state.player.x = Math.max(margin, Math.min(BASE_W - margin, input.pointerX))
}