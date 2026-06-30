import { isMobileDevice } from './mobileEnv'

export type Game3dMobileHint =
  | 'skyRush'
  | 'skyFrenzy'
  | 'cloudBall'
  | 'voxel'
  | 'happyDefense'
  | 'plantDefense'

const HINT_TEXT: Record<Game3dMobileHint, string> = {
  skyRush: '左下摇杆移动 · 右下拖动瞄准 · 横屏游玩',
  skyFrenzy: '拖动或 WASD 移动战机 · 自动开火 · 横屏游玩',
  cloudBall: '左下摇杆移动 · 右下区域跳跃 · 横屏游玩',
  voxel: '左下摇杆 · 右下跳跃/破坏/放置 · 右侧滑动视角',
  happyDefense: '点击草地放置塔 · 点塔升级/出售 · 横屏游玩',
  plantDefense: '点草坪种植物 · 点阳光收集 · 横屏游玩',
}

const TOUCH_CLASS = 'game3d-touch-hint'

/**
 * 3D 游戏开局后显示一次触控说明（仅移动端，约 4.5s 淡出）。
 */
export function showGame3dMobileTouchHint(parent: HTMLElement, hint: Game3dMobileHint): () => void {
  if (!isMobileDevice()) return () => {}

  const el = document.createElement('div')
  el.className = TOUCH_CLASS
  el.textContent = HINT_TEXT[hint]
  el.setAttribute('role', 'status')
  parent.appendChild(el)

  const t = window.setTimeout(() => {
    el.classList.add('fade-out')
    window.setTimeout(() => el.remove(), 400)
  }, 4500)

  return () => {
    window.clearTimeout(t)
    el.remove()
  }
}