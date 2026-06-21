/**
 * 内置 Canvas 游戏视口与画布挂载（自 legacy App.ts startGame 抽取）
 * 横竖屏仅由 getGameLayoutConfig(gameId).orientation 决定，不在此按 gameId 分支。
 */
import {
  DEFAULT_PORTRAIT_HEIGHT_RATIO,
  getGameLayoutConfig,
  isLandscapeLayout,
} from '../games/gameLayout'
import { isExternalCanvas3dGame, prepareGame3dMountHost } from '../platform/game3dHost'
import {
  applyLandscapeMainCanvasDisplaySize,
  computeLandscapeCanvasDisplaySize,
  computePortraitCanvasDisplaySize,
} from '../utils/canvasMobileUtils'
import { isMobileDevice, isPortraitViewport } from '../utils/mobileEnv'

export interface GameViewport {
  gameW: number
  gameH: number
  displayW: number
  displayH: number
  isSpaceShooter: boolean
  isLandscapeGame: boolean
  clearCanvasForPhaser: boolean
  clearCanvasForSpecial: boolean
}

const MOBILE_RE =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i

export function isMobileViewport(): boolean {
  return window.innerWidth < 768 || MOBILE_RE.test(navigator.userAgent)
}

export function shouldForceLandscapeOnMobile(gameId: string): boolean {
  const layout = getGameLayoutConfig(gameId)
  if (layout.orientation !== 'landscape') return false
  return !!layout.forceLandscapeOnMobile && isMobileDevice() && isPortraitViewport()
}

export function resolveGameViewport(
  gameId: string,
  portraitHeldForceLandscape = shouldForceLandscapeOnMobile(gameId),
): GameViewport {
  const layout = getGameLayoutConfig(gameId)
  const isSpaceShooter = gameId === 'spaceShooter'
  const gameW = layout.designWidth
  const gameH = layout.designHeight
  const isLandscapeGame = isLandscapeLayout(layout)

  let displayW = gameW
  let displayH = gameH

  if (!isSpaceShooter && !isExternalCanvas3dGame(gameId)) {
    if (isLandscapeGame) {
      const sized = computeLandscapeCanvasDisplaySize(
        gameW,
        gameH,
        portraitHeldForceLandscape,
      )
      displayW = sized.displayW
      displayH = sized.displayH
    } else {
      const ratio = layout.portraitHeightRatio ?? DEFAULT_PORTRAIT_HEIGHT_RATIO
      const sized = computePortraitCanvasDisplaySize(gameW, gameH, ratio)
      displayW = sized.displayW
      displayH = sized.displayH
    }
  }

  return {
    gameW,
    gameH,
    displayW,
    displayH,
    isSpaceShooter,
    isLandscapeGame,
    clearCanvasForPhaser: isSpaceShooter,
    clearCanvasForSpecial: isExternalCanvas3dGame(gameId),
  }
}

export function syncLandscapeMainCanvas(
  canvas: HTMLCanvasElement,
  vp: GameViewport,
  portraitHeldForceLandscape: boolean,
): void {
  applyLandscapeMainCanvasDisplaySize(
    canvas,
    vp.gameW,
    vp.gameH,
    portraitHeldForceLandscape,
  )
}

export function mountMainGameCanvas(
  host: HTMLElement,
  vp: GameViewport,
  isSpecial: boolean,
  portraitHeldForceLandscape = false,
): HTMLCanvasElement | null {
  host.innerHTML = ''
  host.style.width = '100%'
  host.style.height = '100%'

  if (vp.clearCanvasForSpecial || isSpecial) {
    prepareGame3dMountHost(host)
    return null
  }

  host.style.display = 'flex'
  host.style.alignItems = 'center'
  host.style.justifyContent = 'center'

  if (vp.isSpaceShooter) {
    return null
  }

  const canvas = document.createElement('canvas')
  canvas.id = 'mainGameCanvas'
  canvas.width = vp.gameW
  canvas.height = vp.gameH
  const pixelated =
    'display:block;-webkit-image-rendering:pixelated;image-rendering:pixelated;image-rendering:crisp-edges'

  if (vp.isLandscapeGame) {
    canvas.setAttribute('style', pixelated)
    syncLandscapeMainCanvas(canvas, vp, portraitHeldForceLandscape)
  } else {
    canvas.setAttribute(
      'style',
      `width:${vp.displayW}px;height:${vp.displayH}px;${pixelated}`,
    )
  }

  host.appendChild(canvas)
  return canvas
}