/**
 * 道具栏管理模块
 */

import type { PlatformContext } from './types'

export function setupCustomPowerupBar(
  ctx: PlatformContext,
  gameId: string,
  powerups: Array<{ id: string; icon: string; name: string }>,
  inventory: string[],
  onUse: (powerupId: string) => void
) {
  const container = createPowerupContainer()

  // 道具栏容器
  container.innerHTML = createPowerupBarHTML(powerups, inventory)

  // 绑定点击事件
  powerups.forEach(powerup => {
    const btn = container.querySelector(`.powerup-btn[data-powerup="${powerup.id}"]`)
    btn?.addEventListener('click', () => {
      const count = inventory.filter(id => id === powerup.id).length
      if (count > 0) {
        onUse(powerup.id)
        updatePowerupCount(container, powerup.id, count - 1)
      }
    })
  })
}

export function removePowerupBar() {
  const container = document.getElementById('powerupBarContainer')
  if (container) {
    container.remove()
  }
}

function createPowerupContainer(): HTMLElement {
  // 移除旧道具栏
  removePowerupBar()

  const container = document.createElement('div')
  container.id = 'powerupBarContainer'
  const bottom = 'calc(16px + env(safe-area-inset-bottom, 0px))'
  container.style.cssText = `position:absolute;bottom:${bottom};left:50%;transform:translateX(-50%);z-index:1000;display:flex;gap:10px;max-width:96vw;overflow-x:auto;padding:0 8px;-webkit-overflow-scrolling:touch;`
  document.getElementById('game-layer')!.appendChild(container)
  return container
}

function createPowerupBarHTML(
  powerups: Array<{ id: string; icon: string; name: string }>,
  inventory: string[]
): string {
  return powerups.map(p => {
    const count = inventory.filter(id => id === p.id).length
    return `
        <button type="button" class="powerup-btn" data-powerup="${p.id}" title="${p.name}" style="min-width:52px;min-height:52px;border:none;border-radius:14px;background:rgba(255,255,255,0.15);backdrop-filter:blur(8px);color:#fff;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;flex-shrink:0;">
          <span class="powerup-icon" style="font-size:22px;line-height:1">${p.icon}</span>
          <span class="powerup-count" style="font-size:11px;font-weight:700">${count}</span>
        </button>
      `
  }).join('')
}

function updatePowerupCount(container: HTMLElement, powerupId: string, newCount: number) {
  const btn = container.querySelector(`.powerup-btn[data-powerup="${powerupId}"]`)
  if (btn) {
    const countEl = btn.querySelector('.powerup-count')
    if (countEl) {
      countEl.textContent = String(newCount)
    }
  }
}