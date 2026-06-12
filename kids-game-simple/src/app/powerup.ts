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
  container.style.cssText = 'position:absolute;bottom:16px;left:50%;transform:translateX(-50%);z-index:1000;display:flex;gap:12px;'
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
        <div class="powerup-btn" data-powerup="${p.id}" title="${p.name}">
          <span class="powerup-icon">${p.icon}</span>
          <span class="powerup-count">${count}</span>
        </div>
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