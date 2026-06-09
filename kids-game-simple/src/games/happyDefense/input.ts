import type { ArcRotateCamera, Scene } from '@babylonjs/core'
import { worldToGrid } from './config'

export interface PointerPick {
  gx: number
  gz: number
}

export function pickGridAt(scene: Scene, canvas: HTMLCanvasElement, clientX: number, clientY: number): PointerPick | null {
  const rect = canvas.getBoundingClientRect()
  const x = clientX - rect.left
  const y = clientY - rect.top
  const pick = scene.pick(x, y)
  if (!pick?.hit || !pick.pickedMesh) return null
  const meta = pick.pickedMesh.metadata as { gx?: number; gz?: number } | undefined
  if (meta?.gx != null && meta?.gz != null) {
    return { gx: meta.gx, gz: meta.gz }
  }
  const p = pick.pickedPoint
  if (!p) return null
  const g = worldToGrid(p.x, p.z)
  return g
}

export function bindCanvasInput(
  canvas: HTMLCanvasElement,
  scene: Scene,
  camera: ArcRotateCamera,
  handlers: {
    onTap: (pick: PointerPick | null) => void
  },
): () => void {
  const onPointer = (ev: PointerEvent) => {
    if (ev.button !== 0) return
    const pick = pickGridAt(scene, canvas, ev.clientX, ev.clientY)
    handlers.onTap(pick)
  }
  canvas.addEventListener('pointerdown', onPointer, { passive: true })
  return () => canvas.removeEventListener('pointerdown', onPointer)
}