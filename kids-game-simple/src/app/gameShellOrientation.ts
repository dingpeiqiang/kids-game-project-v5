/**
 * 横屏游戏壳层：竖屏持机时显示 #rotate-overlay，并尝试 screen.orientation.lock
 */
import { isMobileDevice } from '../utils/mobileEnv'

const ROTATE_DISMISS_KEY = 'kids_game_rotate_dismiss_session'

let bound = false
let resizeHandler: (() => void) | null = null
let orientationManager: { tryLockLandscape: () => Promise<boolean> } | null = null
let forceLandscapeOnMobile = false
let dismissedThisSession = false
/** 路由页 CanvasGamePlay 横屏对局时为 true */
let routeLandscapeActive = false

function isPortraitViewport(): boolean {
  const vv = window.visualViewport
  const w = vv?.width ?? window.innerWidth
  const h = vv?.height ?? window.innerHeight
  return h >= w
}

function overlayEl(): HTMLElement | null {
  return document.getElementById('rotate-overlay')
}

function layerShowsLandscapeGame(): boolean {
  const layer = document.getElementById('game-layer')
  return !!layer?.classList.contains('show') && layer.classList.contains('landscape-mode')
}

function syncRotateOverlay() {
  const overlay = overlayEl()
  if (!overlay) return

  const shouldConsider =
    isMobileDevice() &&
    forceLandscapeOnMobile &&
    (layerShowsLandscapeGame() || routeLandscapeActive)

  if (!shouldConsider || dismissedThisSession || !isPortraitViewport()) {
    overlay.classList.remove('show')
    return
  }

  overlay.classList.add('show')
}

export function mountLandscapeRotateHint(opts: {
  forceLandscapeOnMobile: boolean
  orientationManager: { tryLockLandscape: () => Promise<boolean> } | null
}) {
  forceLandscapeOnMobile = opts.forceLandscapeOnMobile
  orientationManager = opts.orientationManager

  if (sessionStorage.getItem(ROTATE_DISMISS_KEY) === '1') {
    dismissedThisSession = true
  }

  if (!bound) {
    bound = true
    const btn = document.getElementById('rotateBtn')
    const dismiss = document.getElementById('rotateDismiss')

    btn?.addEventListener('click', async () => {
      const ok = await orientationManager?.tryLockLandscape()
      if (ok || !isPortraitViewport()) {
        overlayEl()?.classList.remove('show')
      }
    })

    dismiss?.addEventListener('click', () => {
      dismissedThisSession = true
      sessionStorage.setItem(ROTATE_DISMISS_KEY, '1')
      overlayEl()?.classList.remove('show')
    })
  }

  if (!resizeHandler) {
    resizeHandler = () => syncRotateOverlay()
    window.addEventListener('resize', resizeHandler)
    window.visualViewport?.addEventListener('resize', resizeHandler)
    window.visualViewport?.addEventListener('scroll', resizeHandler)
  }
  syncRotateOverlay()
}

export function unmountLandscapeRotateHint() {
  routeLandscapeActive = false
  overlayEl()?.classList.remove('show')
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    window.visualViewport?.removeEventListener('resize', resizeHandler)
    window.visualViewport?.removeEventListener('scroll', resizeHandler)
    resizeHandler = null
  }
  orientationManager = null
  forceLandscapeOnMobile = false
}

/** CanvasGamePlay 路由页横屏游戏（无 #game-layer.landscape-mode） */
export function setRouteLandscapeSessionActive(active: boolean): void {
  routeLandscapeActive = active
  syncRotateOverlay()
}

/** 新开一局横屏游戏时允许再次提示（同标签页内用户点过「继续竖屏」后本局不再弹） */
export function resetRotateDismissForNewGame() {
  dismissedThisSession = false
  sessionStorage.removeItem(ROTATE_DISMISS_KEY)
}