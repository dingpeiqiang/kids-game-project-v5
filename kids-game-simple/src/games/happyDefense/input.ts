import type { ArcRotateCamera, Scene } from '@babylonjs/core'
import { worldToGrid } from './config'
import { clientToPickCoords } from '../../platform/babylonPickUtils'
import { applyCanvasMobileStyles } from '../../utils/canvasMobileUtils'
import { bindGameCanvasControls } from '../../platform/mobileControls'

export { clientToPickCoords }

export interface PointerPick {
  gx: number
  gz: number
}

/** 画布逻辑像素坐标（与 `bindGameCanvasControls` 的 tap payload 一致） */
export function pickGridAtCanvasPixels(
  scene: Scene,
  logicalX: number,
  logicalY: number,
): PointerPick | null {
  const pick = scene.pick(logicalX, logicalY)
  if (!pick?.hit || !pick.pickedMesh) return null
  const meta = pick.pickedMesh.metadata as { gx?: number; gz?: number } | undefined
  if (meta?.gx != null && meta?.gz != null) {
    return { gx: meta.gx, gz: meta.gz }
  }
  const p = pick.pickedPoint
  if (!p) return null
  return worldToGrid(p.x, p.z)
}

export function pickGridAt(scene: Scene, canvas: HTMLCanvasElement, clientX: number, clientY: number): PointerPick | null {
  const { x, y } = clientToPickCoords(canvas, clientX, clientY)
  return pickGridAtCanvasPixels(scene, x, y)
}

/** 3D 塔防：统一 `tap` + Babylon pick（与 2D `bindGameCanvasControls` 双端一致） */
export function bindCanvasInput(
  canvas: HTMLCanvasElement,
  scene: Scene,
  _camera: ArcRotateCamera,
  handlers: {
    onTap: (pick: PointerPick | null) => void
  },
): () => void {
  applyCanvasMobileStyles(canvas)

  const runtime = bindGameCanvasControls(canvas, {
    gameId: 'happyDefense',
    viewWidth: canvas.width,
    viewHeight: canvas.height,
    layout: { viewWidth: canvas.width, viewHeight: canvas.height, buttons: [] },
    onAction: (action, payload) => {
      if (action !== 'tap' || payload.x == null || payload.y == null) return
      const pick = pickGridAtCanvasPixels(scene, payload.x, payload.y)
      handlers.onTap(pick)
    },
  })
  return () => runtime.dispose()
}