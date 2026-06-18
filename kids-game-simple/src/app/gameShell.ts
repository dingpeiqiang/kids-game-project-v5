/**
 * 统一游戏容器壳层：顶栏操作、暂停、分数、道具槽、画布挂载区
 * 游戏内容（canvas / Phaser）仅渲染在 #gameCanvas 内
 */
import type { Game } from '../types'
import { gameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { getGameLayoutConfig, isLandscapeLayout, type GameLayoutConfig } from '../games/gameLayout'
import type { GameRegistration } from '../games/gameRegistry'
import {
  applyCanvasMobileStyles,
  computeLandscapeCanvasDisplaySize,
  computePortraitCanvasDisplaySize,
} from '../utils/canvasMobileUtils'
import { isMobileDevice } from '../utils/mobileEnv'
import { OrientationManager } from '../utils/orientation'

export interface GameShellMountOptions {
  game: Game
  registration: GameRegistration
  orientationManager: OrientationManager | null
  onExit: () => void
  onReplay?: () => void
}

let scoreUnsub: (() => void) | null = null
let exitConfirmBound = false
let shellActionsBound = false
let shellChromeAbort: AbortController | null = null
let shellModalAbort: AbortController | null = null
let shellKeydownHandler: ((e: KeyboardEvent) => void) | null = null
let shellOnExit: (() => void) | null = null
let shellHidePlatformPause = false
/** 打开暂停/退出蒙层后短暂忽略「点背景关闭」，避免同一次触摸触发的幽灵 click */
let shellModalSuppressBackdropUntil = 0
const SHELL_MODAL_BACKDROP_GUARD_MS = 450

function el<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null
}

export interface GameShellMountResult {
  layout: GameLayoutConfig
  portraitResizeHandler: (() => void) | null
}

export function mountGameShell(opts: GameShellMountOptions): GameShellMountResult {
  const layout = getGameLayoutConfig(opts.game.id, opts.registration.layout)
  const layer = el('game-layer')!
  const shell = el('game-shell')!
  const viewport = el('game-viewport')!
  const canvasHost = el('gameCanvas')!

  layer.classList.add('show')
  shell.classList.add('game-shell--active')
  shell.dataset.orientation = layout.orientation
  shell.dataset.gameId = opts.game.id

  document.documentElement.classList.add('game-active')
  el('topBar')!.style.display = 'none'
  el('bottomNav')!.style.display = 'none'
  el('mainView')!.style.display = 'none'

  const titleEl = el('gameShellTitle')
  const scoreEl = el('gameShellScore')
  const comboEl = el('gameShellCombo')
  if (titleEl) titleEl.textContent = opts.game.name
  shell.classList.toggle('game-shell--hide-score', !!layout.hidePlatformScore)
  shell.classList.toggle('game-shell--hide-pause', !!layout.hidePlatformPause)
  shell.classList.toggle('game-shell--compact-footer', !!layout.compactFooter)
  shell.classList.toggle('game-shell--external-canvas', !!layout.externalCanvas)
  if (!layout.hidePlatformScore && scoreEl) {
    scoreEl.textContent = '0'
  }
  if (comboEl) {
    comboEl.textContent = ''
    comboEl.classList.remove('show')
  }

  shellHidePlatformPause = !!layout.hidePlatformPause
  bindShellActions(opts)
  bindShellKeyboard()
  if (!layout.hidePlatformScore) {
    bindScoreHud(scoreEl, comboEl)
  } else {
    scoreUnsub?.()
    scoreUnsub = null
  }

  gameEngine.setOrientation(isLandscapeLayout(layout) ? 'landscape' : 'portrait')

  applyLayerDeviceClass(layer)
  resetCanvasHostStyles(canvasHost)
  clearLandscapeClasses(layer)

  let portraitResizeHandler: (() => void) | null = null
  if (layout.externalCanvas) {
    canvasHost.innerHTML = ''
    canvasHost.style.display = 'block'
    canvasHost.style.width = '100%'
    canvasHost.style.height = '100%'
    canvasHost.style.position = 'relative'
    canvasHost.style.flex = '1 1 auto'
    canvasHost.style.alignSelf = 'stretch'
    canvasHost.style.minHeight = '0'
  } else if (isLandscapeLayout(layout)) {
    applyLandscapeShell(layer, canvasHost, layout, opts.orientationManager)
  } else {
    const portrait = setupPortraitCanvas(canvasHost, layout)
    portraitResizeHandler = portrait.onResize
  }

  viewport.setAttribute('aria-label', `${opts.game.name} 游戏区域`)

  return { layout, portraitResizeHandler }
}

export function unmountGameShell(orientationManager: OrientationManager | null) {
  scoreUnsub?.()
  scoreUnsub = null

  const layer = el('game-layer')
  const shell = el('game-shell')
  const canvasHost = el('gameCanvas')
  const pauseOverlay = el('gamePauseOverlay')

  shellChromeAbort?.abort()
  shellChromeAbort = null
  shellModalAbort?.abort()
  shellModalAbort = null
  unbindShellKeyboard()
  dismissGamePauseOverlay()
  el('game-layer')?.classList.remove('game-layer--modal-open')
  shellHidePlatformPause = false
  shell?.classList.remove(
    'game-shell--active',
    'game-shell--hide-score',
    'game-shell--hide-pause',
    'game-shell--compact-footer',
    'game-shell--powerup-active',
    'game-shell--external-canvas',
  )
  shell?.removeAttribute('data-orientation')
  shell?.removeAttribute('data-game-id')

  layer?.classList.remove('show', 'landscape-mode', 'force-landscape', 'is-mobile')
  layer?.style.removeProperty('--game-ratio')

  if (canvasHost) {
    canvasHost.innerHTML = ''
    resetCanvasHostStyles(canvasHost)
  }

  document.documentElement.classList.remove('game-active')
  el('topBar')!.style.display = 'flex'
  el('bottomNav')!.style.display = 'flex'
  el('mainView')!.style.display = 'block'

  orientationManager?.tryLockPortrait()
}

function shellLayerActive(): boolean {
  return el('game-layer')?.classList.contains('show') ?? false
}

function markShellModalJustOpened() {
  shellModalSuppressBackdropUntil = Date.now() + SHELL_MODAL_BACKDROP_GUARD_MS
}

function shouldIgnoreShellModalBackdropDismiss(): boolean {
  return Date.now() < shellModalSuppressBackdropUntil
}

function syncShellModalBlocking() {
  el('game-layer')?.classList.toggle('game-layer--modal-open', isShellModalOpen())
}

function showPauseOverlay() {
  if (gameEngine.isRunning()) gameEngine.pause()
  el('gamePauseOverlay')?.classList.add('show')
  markShellModalJustOpened()
  syncShellModalBlocking()
}

function handleShellBack() {
  audioService.click()
  if (shellHidePlatformPause) {
    showExitConfirmOverlay()
    return
  }
  if (gameEngine.isRunning()) {
    showPauseOverlay()
    return
  }
  shellOnExit?.()
}

function handleShellPause() {
  audioService.click()
  if (!shellLayerActive()) return
  if (!gameEngine.isRunning()) return
  showPauseOverlay()
}

function handlePauseResume() {
  audioService.click()
  if (!shellLayerActive()) return
  gameEngine.resume()
  el('gamePauseOverlay')?.classList.remove('show')
  syncShellModalBlocking()
}

function handlePauseQuit() {
  audioService.click()
  if (!shellLayerActive()) return
  shellModalSuppressBackdropUntil = 0
  dismissExitConfirmOverlay(false)
  el('gamePauseOverlay')?.classList.remove('show')
  syncShellModalBlocking()
  gameEngine.stop()
  shellOnExit?.()
}

function bindShellChromeControls() {
  shellChromeAbort?.abort()
  shellChromeAbort = new AbortController()
  const signal = shellChromeAbort.signal
  const opts = { signal, passive: false as const }

  const bindShellBtn = (id: string, handler: () => void) => {
    const btn = el<HTMLButtonElement>(id)
    if (!btn) return
    const fire = (e: PointerEvent) => {
      if (!shellLayerActive()) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      handler()
    }
    btn.addEventListener('pointerup', fire, opts)
    btn.addEventListener('click', e => {
      e.preventDefault()
      e.stopPropagation()
    }, opts)
  }

  bindShellBtn('gameShellBack', handleShellBack)
  bindShellBtn('gameShellPause', handleShellPause)
}

function bindShellModalControls() {
  shellModalAbort?.abort()
  shellModalAbort = new AbortController()
  const signal = shellModalAbort.signal
  const opts = { signal, passive: false as const }

  const bindModalBtn = (id: string, handler: () => void) => {
    const btn = el<HTMLButtonElement>(id)
    if (!btn) return
    const fire = (e: PointerEvent) => {
      if (!shellLayerActive()) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      handler()
    }
    btn.addEventListener('pointerup', fire, opts)
    btn.addEventListener('click', e => {
      e.preventDefault()
      e.stopPropagation()
    }, opts)
  }

  bindModalBtn('gamePauseResume', handlePauseResume)
  bindModalBtn('gamePauseQuit', handlePauseQuit)

  const overlay = el('gamePauseOverlay')
  overlay?.addEventListener(
    'click',
    e => {
      if (e.target !== overlay) return
      if (shouldIgnoreShellModalBackdropDismiss()) {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      handlePauseResume()
    },
    { signal },
  )
}

function bindShellActions(opts: GameShellMountOptions) {
  shellOnExit = opts.onExit
  bindShellChromeControls()
  bindShellModalControls()

  if (shellActionsBound) {
    bindExitConfirmActions()
    return
  }
  shellActionsBound = true

  bindExitConfirmActions()
}

function bindScoreHud(scoreEl: HTMLElement | null, comboEl: HTMLElement | null) {
  scoreUnsub?.()
  const update = () => {
    if (scoreEl) scoreEl.textContent = String(gameEngine.getScore())
    if (comboEl) {
      const c = gameEngine.getCombo()
      if (c >= 3) {
        comboEl.textContent = `连击 ${c}`
        comboEl.classList.add('show')
      } else {
        comboEl.textContent = ''
        comboEl.classList.remove('show')
      }
    }
  }
  update()
  scoreUnsub = gameEngine.onScoreChange(update)
}

function applyLayerDeviceClass(layer: HTMLElement) {
  if (isMobileDevice()) layer.classList.add('is-mobile')
  else layer.classList.remove('is-mobile')
}

function clearLandscapeClasses(layer: HTMLElement) {
  layer.classList.remove('landscape-mode', 'force-landscape')
}

function resetCanvasHostStyles(canvas: HTMLElement) {
  canvas.style.display = ''
  canvas.style.alignItems = ''
  canvas.style.justifyContent = ''
  canvas.style.width = ''
  canvas.style.height = ''
  canvas.style.transform = ''
  canvas.style.transformOrigin = ''
  canvas.style.position = ''
  canvas.style.flex = ''
  canvas.style.alignSelf = ''
  canvas.style.minHeight = ''
}

function applyLandscapeShell(
  layer: HTMLElement,
  canvas: HTMLElement,
  layout: GameLayoutConfig,
  orientationManager: OrientationManager | null,
) {
  layer.classList.add('landscape-mode')
  const ratio = layout.designHeight / layout.designWidth
  layer.style.setProperty('--game-ratio', ratio.toString())

  if (!orientationManager) {
    // caller may assign on ctx
  } else {
    orientationManager.tryLockLandscape()
  }
  if (layout.forceLandscapeOnMobile && isMobileDevice()) {
    layer.classList.add('force-landscape')
  }

  canvas.style.display = 'flex'
  canvas.style.alignItems = 'center'
  canvas.style.justifyContent = 'center'
  canvas.style.width = '100%'
  canvas.style.height = '100%'

  const { displayW, displayH } = computeLandscapeCanvasDisplaySize(layout.designWidth, layout.designHeight)
  canvas.innerHTML = `<canvas id="mainGameCanvas" width="${layout.designWidth}" height="${layout.designHeight}" style="display:block;-webkit-image-rendering:pixelated;image-rendering:pixelated;image-rendering:crisp-edges"></canvas>`
  const mainCvs = el<HTMLCanvasElement>('mainGameCanvas')
  if (mainCvs) applyCanvasMobileStyles(mainCvs)
  void displayW
  void displayH
}

export function setupPortraitCanvas(canvas: HTMLElement, layout: GameLayoutConfig) {
  const ratio = layout.portraitHeightRatio ?? 0.88
  const { displayW, displayH } = computePortraitCanvasDisplaySize(layout.designWidth, layout.designHeight, ratio)

  canvas.style.display = 'flex'
  canvas.style.alignItems = 'center'
  canvas.style.justifyContent = 'center'
  canvas.style.width = '100%'
  canvas.style.height = '100%'

  canvas.innerHTML = `<canvas id="mainGameCanvas" width="${layout.designWidth}" height="${layout.designHeight}" style="width:${displayW}px;height:${displayH}px;display:block;-webkit-image-rendering:pixelated;image-rendering:pixelated;image-rendering:crisp-edges"></canvas>`
  const mainCvs = el<HTMLCanvasElement>('mainGameCanvas')
  if (mainCvs) applyCanvasMobileStyles(mainCvs)

  const onResize = () => {
    const elC = el<HTMLCanvasElement>('mainGameCanvas')
    if (!elC) return
    const sized = computePortraitCanvasDisplaySize(layout.designWidth, layout.designHeight, ratio)
    elC.style.width = `${sized.displayW}px`
    elC.style.height = `${sized.displayH}px`
    applyCanvasMobileStyles(elC)
  }

  return { onResize, portraitHeightRatio: ratio }
}

export function getPowerupSlotElement(): HTMLElement | null {
  return el('gameShellPowerupSlot')
}

function showExitConfirmOverlay() {
  if (gameEngine.isRunning()) gameEngine.pause()
  el('gameExitConfirmOverlay')?.classList.add('show')
  markShellModalJustOpened()
  syncShellModalBlocking()
}

export function dismissExitConfirmOverlay(resumeGame = true) {
  shellModalSuppressBackdropUntil = 0
  el('gameExitConfirmOverlay')?.classList.remove('show')
  syncShellModalBlocking()
  if (resumeGame && gameEngine.isRunning() && gameEngine.isPaused()) {
    gameEngine.resume()
  }
}

function isPauseOverlayVisible(): boolean {
  return el('gamePauseOverlay')?.classList.contains('show') ?? false
}

function isExitConfirmVisible(): boolean {
  return el('gameExitConfirmOverlay')?.classList.contains('show') ?? false
}

function isShellModalOpen(): boolean {
  return isPauseOverlayVisible() || isExitConfirmVisible()
}

function bindShellKeyboard() {
  unbindShellKeyboard()
  shellKeydownHandler = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return
    const layer = el('game-layer')
    if (!layer?.classList.contains('show')) return

    if (isExitConfirmVisible()) {
      e.preventDefault()
      dismissExitConfirmOverlay(true)
      return
    }
    if (isPauseOverlayVisible()) {
      e.preventDefault()
      gameEngine.resume()
      el('gamePauseOverlay')?.classList.remove('show')
      syncShellModalBlocking()
      return
    }
    if (gameEngine.isRunning()) {
      e.preventDefault()
      if (shellHidePlatformPause) {
        showExitConfirmOverlay()
      } else {
        showPauseOverlay()
      }
    }
  }
  window.addEventListener('keydown', shellKeydownHandler)
}

function unbindShellKeyboard() {
  if (shellKeydownHandler) {
    window.removeEventListener('keydown', shellKeydownHandler)
    shellKeydownHandler = null
  }
}

function bindExitConfirmActions() {
  if (exitConfirmBound) return
  exitConfirmBound = true
  el('gameExitStay')?.addEventListener('click', () => {
    audioService.click()
    dismissExitConfirmOverlay(true)
  })
  el('gameExitConfirm')?.addEventListener('click', () => {
    audioService.click()
    dismissExitConfirmOverlay(false)
    el('gamePauseOverlay')?.classList.remove('show')
    syncShellModalBlocking()
    shellOnExit?.()
  })
  const exitOverlay = el('gameExitConfirmOverlay')
  exitOverlay?.addEventListener('click', e => {
    if (e.target !== exitOverlay) return
    if (shouldIgnoreShellModalBackdropDismiss()) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    dismissExitConfirmOverlay()
  })
}

/** 关闭壳层暂停蒙层（结算、退出前调用） */
export function dismissGamePauseOverlay() {
  dismissExitConfirmOverlay(false)
  const overlay = el('gamePauseOverlay')
  overlay?.classList.remove('show')
  syncShellModalBlocking()
  if (gameEngine.isRunning()) {
    gameEngine.resume()
  }
}