/**
 * 判断当前主输入面：触屏 vs 键鼠
 */

export function isTouchPrimaryDevice(): boolean {
  if (typeof window === 'undefined') return false
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const noHover = window.matchMedia('(hover: none)').matches
  const touchPoints = navigator.maxTouchPoints > 0
  const uaMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  return (coarse && noHover) || (touchPoints && uaMobile) || (touchPoints && window.innerWidth < 900)
}

export function shouldDrawOnScreenControls(options?: {
  forceShow?: boolean
  forceHide?: boolean
}): boolean {
  if (options?.forceHide) return false
  if (options?.forceShow) return true
  return isTouchPrimaryDevice()
}

export type ControlSurface = 'touch' | 'desktop'

export function getPrimaryControlSurface(): ControlSurface {
  return isTouchPrimaryDevice() ? 'touch' : 'desktop'
}