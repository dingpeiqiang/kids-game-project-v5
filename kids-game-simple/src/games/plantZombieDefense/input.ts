import type { Scene } from '@babylonjs/core'
import { worldToGrid } from './config'
import { applyCanvasMobileStyles } from '../../utils/canvasMobileUtils'

export interface PointerPick {
  gx: number
  gz: number
}

/** client 坐标 → Babylon pick 用的画布像素坐标 */
export function clientToPickCoords(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  }
}

export function pickGridAt(
  scene: Scene,
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): PointerPick | null {
  const { x, y } = clientToPickCoords(canvas, clientX, clientY)
  const pick = scene.pick(x, y)
  if (!pick?.hit || !pick.pickedMesh) return null
  const meta = pick.pickedMesh.metadata as { gx?: number; gz?: number; sunId?: number } | undefined
  if (meta?.sunId != null) return null
  if (meta?.gx != null && meta?.gz != null) {
    return { gx: meta.gx, gz: meta.gz }
  }
  const p = pick.pickedPoint
  if (!p) return null
  return worldToGrid(p.x, p.z)
}

export function pickSunIdAt(
  scene: Scene,
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): number | null {
  const { x, y } = clientToPickCoords(canvas, clientX, clientY)
  const pick = scene.pick(x, y)
  const meta = pick?.pickedMesh?.metadata as { sunId?: number } | undefined
  return meta?.sunId ?? null
}

export function bindCanvasInput(
  canvas: HTMLCanvasElement,
  scene: Scene,
  handlers: {
    onTap: (pick: PointerPick | null, sunId: number | null) => void
  },
): () => void {
  applyCanvasMobileStyles(canvas)

  const onPointer = (ev: PointerEvent) => {
    if (ev.button !== 0) return
    ev.preventDefault()
    const sunId = pickSunIdAt(scene, canvas, ev.clientX, ev.clientY)
    const pick = pickGridAt(scene, canvas, ev.clientX, ev.clientY)
    handlers.onTap(pick, sunId)
  }
  canvas.addEventListener('pointerdown', onPointer, { passive: false })
  return () => canvas.removeEventListener('pointerdown', onPointer)
}