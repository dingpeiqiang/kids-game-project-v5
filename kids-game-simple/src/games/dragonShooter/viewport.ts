// ============================================
// 移动端视口 / 全屏缩放（打龙小游戏）
// ============================================

import { BASE_W, BASE_H, CANVAS_W, CANVAS_H, CANVAS_OFFSET_X, CANVAS_OFFSET_Y } from './constants'

export interface DragonViewportLayout {
  scale: number
  isMobile: boolean
}

/** 供渲染器读取，避免每帧 getComputedStyle */
let layout: DragonViewportLayout = { scale: 1, isMobile: false }

export function getDragonViewportLayout(): DragonViewportLayout {
  return layout
}

export function setDragonViewportLayout(partial: Partial<DragonViewportLayout>): void {
  layout = { ...layout, ...partial }
}

export function detectDragonShooterMobile(): boolean {
  return (
    /Android|iPhone|iPad|iPod|Mobile|MicroMessenger/i.test(navigator.userAgent) ||
    (window.visualViewport ? window.visualViewport.width < 768 : window.innerWidth < 768)
  )
}

function readViewportSize(): { w: number; h: number } {
  const vv = window.visualViewport
  if (vv) {
    return { w: vv.width, h: vv.height }
  }
  return { w: window.innerWidth, h: window.innerHeight }
}

/**
 * 将 canvas 以 FIT 方式铺满可视区域（游戏区 BASE_W×BASE_H 居中，多余画布裁切）
 */
export function applyDragonCanvasFit(canvas: HTMLCanvasElement, host?: HTMLElement): void {
  let windowWidth: number
  let windowHeight: number
  if (host) {
    windowWidth = host.clientWidth
    windowHeight = host.clientHeight
  } else {
    const s = readViewportSize()
    windowWidth = s.w
    windowHeight = s.h
  }

  const scaleX = windowWidth / BASE_W
  const scaleY = windowHeight / BASE_H
  const scale = Math.min(scaleX, scaleY)

  const scaledBaseW = BASE_W * scale
  const scaledBaseH = BASE_H * scale

  const left = (windowWidth - scaledBaseW) / 2 - CANVAS_OFFSET_X * scale
  const top = (windowHeight - scaledBaseH) / 2 - CANVAS_OFFSET_Y * scale

  canvas.style.width = `${CANVAS_W}px`
  canvas.style.height = `${CANVAS_H}px`
  canvas.style.left = `${left}px`
  canvas.style.top = `${top}px`
  canvas.style.transform = `scale(${scale})`
  canvas.style.transformOrigin = '0 0'

  setDragonViewportLayout({ scale, isMobile: true })
}

export function lockMobilePageScroll(): void {
  document.documentElement.style.overflow = 'hidden'
  document.documentElement.style.height = '100%'
  document.body.style.overflow = 'hidden'
  document.body.style.touchAction = 'none'
  document.body.style.position = 'fixed'
  document.body.style.width = '100%'
  document.body.style.height = '100%'
  document.body.style.left = '0'
  document.body.style.top = '0'
}

export function unlockMobilePageScroll(): void {
  document.documentElement.style.overflow = ''
  document.documentElement.style.height = ''
  document.body.style.overflow = ''
  document.body.style.touchAction = ''
  document.body.style.position = ''
  document.body.style.width = ''
  document.body.style.height = ''
  document.body.style.left = ''
  document.body.style.top = ''
}

export function createMobileWrapperStyles(): string {
  const safeTop = 'env(safe-area-inset-top, 0px)'
  const safeBottom = 'env(safe-area-inset-bottom, 0px)'
  const safeLeft = 'env(safe-area-inset-left, 0px)'
  const safeRight = 'env(safe-area-inset-right, 0px)'
  return `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    height: 100dvh;
    width: 100dvw;
    padding: ${safeTop} ${safeRight} ${safeBottom} ${safeLeft};
    box-sizing: border-box;
    z-index: 1000;
    background: #000;
    overflow: hidden;
    touch-action: none;
    margin: 0;
    -webkit-user-select: none;
    user-select: none;
    overscroll-behavior: none;
  `
}