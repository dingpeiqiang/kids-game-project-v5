import type { ArcRotateCamera, Scene } from '@babylonjs/core'
import { worldToGrid } from './config'

export interface PointerPick {
  gx: number
  gz: number
}

export function pickGridAt(
  scene: Scene,
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): PointerPick | null {
  const rect = canvas.getBoundingClientRect()
  const x = clientX - rect.left
  const y = clientY - rect.top
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
  const rect = canvas.getBoundingClientRect()
  const pick = scene.pick(clientX - rect.left, clientY - rect.top)
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
  const onPointer = (ev: PointerEvent) => {
    if (ev.button !== 0) return
    const sunId = pickSunIdAt(scene, canvas, ev.clientX, ev.clientY)
    const pick = pickGridAt(scene, canvas, ev.clientX, ev.clientY)
    handlers.onTap(pick, sunId)
  }
  canvas.addEventListener('pointerdown', onPointer, { passive: true })
  return () => canvas.removeEventListener('pointerdown', onPointer)
}