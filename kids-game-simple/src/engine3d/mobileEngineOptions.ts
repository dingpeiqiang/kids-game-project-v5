import { getVisualViewportSize, isMobileDevice } from '../utils/mobileEnv'

/** 各 3D 游戏创建 Babylon 引擎时的统一移动端画质参数 */
export function getMobileEngine3dOptions(): {
  antialias: boolean
  hardwareScalingLevel: number
  mobile: boolean
} {
  const mobile = isMobileDevice()
  if (!mobile) {
    return { antialias: true, hardwareScalingLevel: 1, mobile: false }
  }
  const { width } = getVisualViewportSize()
  const hardwareScalingLevel = width < 400 ? 1.5 : width < 720 ? 1.35 : 1.25
  return { antialias: false, hardwareScalingLevel, mobile: true }
}