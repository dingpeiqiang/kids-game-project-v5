/** 移动端环境检测与安全区 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.innerWidth < 768
  const ua = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  )
  return coarse || narrow || ua
}

export function getVisualViewportSize(): { width: number; height: number } {
  const vv = window.visualViewport
  return {
    width: vv?.width ?? window.innerWidth,
    height: vv?.height ?? window.innerHeight,
  }
}

export function installMobileShellGuards(): void {
  if (typeof document === 'undefined') return

  document.addEventListener(
    'touchmove',
    (e) => {
      const layer = document.getElementById('game-layer')
      if (layer?.classList.contains('show')) {
        const target = e.target as Node | null
        if (target && layer.contains(target)) {
          e.preventDefault()
        }
      }
    },
    { passive: false },
  )

  let lastTouchEnd = 0
  document.addEventListener(
    'touchend',
    (e) => {
      const now = Date.now()
      if (now - lastTouchEnd < 350) {
        const layer = document.getElementById('game-layer')
        if (layer?.classList.contains('show')) {
          e.preventDefault()
        }
      }
      lastTouchEnd = now
    },
    { passive: false },
  )
}