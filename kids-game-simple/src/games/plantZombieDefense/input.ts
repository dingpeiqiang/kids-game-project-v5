import type { Scene } from '@babylonjs/core'
import { worldToGrid } from './config'
import { clientToPickCoords } from '../../platform/babylonPickUtils'
import { applyCanvasMobileStyles } from '../../utils/canvasMobileUtils'
import { bindGameCanvasControls } from '../../platform/mobileControls'

export { clientToPickCoords }

export interface PointerPick {
  gx: number
  gz: number
}

export function pickGridAtCanvasPixels(
  scene: Scene,
  logicalX: number,
  logicalY: number,
): PointerPick | null {
  const pick = scene.pick(logicalX, logicalY)
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

export function pickSunIdAtCanvasPixels(
  scene: Scene,
  logicalX: number,
  logicalY: number,
): number | null {
  const pick = scene.pick(logicalX, logicalY)
  const meta = pick?.pickedMesh?.metadata as { sunId?: number } | undefined
  return meta?.sunId ?? null
}

export function pickGridAt(
  scene: Scene,
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): PointerPick | null {
  const { x, y } = clientToPickCoords(canvas, clientX, clientY)
  return pickGridAtCanvasPixels(scene, x, y)
}

export function pickSunIdAt(
  scene: Scene,
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): number | null {
  const { x, y } = clientToPickCoords(canvas, clientX, clientY)
  return pickSunIdAtCanvasPixels(scene, x, y)
}

/** 3D：统一 tap + 格子 pick / 阳光 pick */
export function bindCanvasInput(
  canvas: HTMLCanvasElement,
  scene: Scene,
  handlers: {
    onTap: (pick: PointerPick | null, sunId: number | null) => void
  },
): () => void {
  applyCanvasMobileStyles(canvas)

  const runtime = bindGameCanvasControls(canvas, {
    gameId: 'plantZombieDefense',
    viewWidth: canvas.width,
    viewHeight: canvas.height,
    layout: { viewWidth: canvas.width, viewHeight: canvas.height, buttons: [] },
    onAction: (action, payload) => {
      if (action !== 'tap' || payload.x == null || payload.y == null) return
      const sunId = pickSunIdAtCanvasPixels(scene, payload.x, payload.y)
      const pick = pickGridAtCanvasPixels(scene, payload.x, payload.y)
      handlers.onTap(pick, sunId)
    },
  })
  return () => runtime.dispose()
}