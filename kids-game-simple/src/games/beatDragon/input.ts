import { BASE_W } from './config'
import type { GameState } from './types'

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
  const toGame = (clientX: number): number => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    return (clientX - rect.left) * scaleX
  }

  const onPointerDown = (e: PointerEvent) => {
    input.pointerDown = true
    input.pointerX = toGame(e.clientX)
    const y = ((e.clientY - canvas.getBoundingClientRect().top) * canvas.height) / canvas.getBoundingClientRect().height
    onTap(toGame(e.clientX), y)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!input.pointerDown && e.pointerType === 'mouse') {
      input.pointerX = toGame(e.clientX)
      return
    }
    if (input.pointerDown) input.pointerX = toGame(e.clientX)
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