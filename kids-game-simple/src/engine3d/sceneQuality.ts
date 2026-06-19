import { isMobileDevice } from '../utils/mobileEnv'

/** 移动端关闭实时阴影以减轻 GPU 发热与掉帧 */
export function shouldEnable3dSceneShadows(): boolean {
  return !isMobileDevice()
}

/** 移动端减少 mesh 细分（球体等） */
export function meshSegmentsForDevice(desktop: number, mobile?: number): number {
  const m = mobile ?? Math.max(6, Math.floor(desktop * 0.6))
  return isMobileDevice() ? m : desktop
}