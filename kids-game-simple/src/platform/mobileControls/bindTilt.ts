import type { MobileControlHandler } from './types'

export interface BindTiltOptions {
  /** 倾斜灵敏度（gamma/beta 缩放） */
  sensitivity?: number
  /** 无陀螺仪时是否仍绑定键盘（由 bindDesktop 负责） */
  onAction: MobileControlHandler
}

/**
 * DeviceOrientation → move(stickX, stickY)。无权限或桌面端不报错，仅不发送。
 */
export function bindTiltControl(options: BindTiltOptions): () => void {
  const sensitivity = options.sensitivity ?? 0.035
  const onAction = options.onAction

  const onOrient = (e: DeviceOrientationEvent) => {
    const gamma = e.gamma
    const beta = e.beta
    if (gamma == null || beta == null) return
    let sx = Math.max(-1, Math.min(1, gamma * sensitivity))
    let sy = Math.max(-1, Math.min(1, (beta - 45) * sensitivity))
    const mag = Math.hypot(sx, sy)
    if (mag > 1) {
      sx /= mag
      sy /= mag
    }
    onAction('move', {
      stickX: sx,
      stickY: sy,
      stickMagnitude: mag > 0 ? Math.min(1, mag) : 0,
      stickAngle: Math.atan2(sy, sx) * (180 / Math.PI),
      source: 'sensor',
    })
  }

  if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
    return () => {}
  }

  window.addEventListener('deviceorientation', onOrient)

  const requestPerm = async () => {
    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>
    }
    if (typeof DOE.requestPermission === 'function') {
      try {
        const state = await DOE.requestPermission()
        if (state !== 'granted') return
      } catch {
        return
      }
    }
  }
  void requestPerm()

  return () => {
    window.removeEventListener('deviceorientation', onOrient)
  }
}