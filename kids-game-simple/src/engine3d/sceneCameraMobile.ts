import type { ArcRotateCamera, UniversalCamera } from '@babylonjs/core'
import { isMobileDevice } from '../utils/mobileEnv'

/**
 * 第三人称 ArcRotate 相机：桌面可拖拽环视；手机只跟逻辑，避免与摇杆/瞄准抢触摸。
 */
export function attachGameArcRotateCamera(
  camera: ArcRotateCamera,
  canvas: HTMLCanvasElement,
): void {
  if (isMobileDevice()) {
    camera.detachControl()
    return
  }
  camera.attachControl(canvas, true)
}

/**
 * 第一人称 Universal 相机：桌面 pointer lock + 环视；手机由虚拟摇杆/滑屏驱动 rotation。
 */
export function attachGameUniversalCamera(
  camera: UniversalCamera,
  canvas: HTMLCanvasElement,
): void {
  if (isMobileDevice()) {
    camera.detachControl()
    return
  }
  camera.attachControl(canvas, true)
}