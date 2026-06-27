/**
 * 道具栏（DOM 挂载到 #gameShellPowerupSlot 或 body；路由玩法页可挂载 #game-shell 容器）
 */

export function setupCustomPowerupBar(
  _gameId: string,
  powerups: Array<{ id: string; icon: string; name: string }>,
  inventory: string[],
  onUse: (powerupId: string) => void,
) {
  const container = createPowerupContainer()

  container.innerHTML = createPowerupBarHTML(powerups, inventory)

  powerups.forEach((powerup) => {
    const btn = container.querySelector(`.powerup-btn[data-powerup="${powerup.id}"]`)
    btn?.addEventListener('click', () => {
      const count = inventory.filter((id) => id === powerup.id).length
      if (count > 0) {
        onUse(powerup.id)
        updatePowerupCount(container, powerup.id, count - 1)
      }
    })
  })
}

export function removePowerupBar() {
  document.getElementById('powerupBarContainer')?.remove()
  document.getElementById('game-shell')?.classList.remove('game-shell--powerup-active')
}

function createPowerupContainer(): HTMLElement {
  removePowerupBar()

  const container = document.createElement('div')
  container.id = 'powerupBarContainer'
  const bottom = 'calc(16px + env(safe-area-inset-bottom, 0px))'
  container.style.cssText = `position:absolute;bottom:${bottom};left:50%;transform:translateX(-50%);z-index:1000;display:flex;gap:10px;max-width:96vw;overflow-x:auto;padding:0 8px;-webkit-overflow-scrolling:touch;`
  const slot = document.getElementById('gameShellPowerupSlot')
  const parent = slot || document.body
  parent.appendChild(container)
  if (slot) {
    container.style.cssText = `position:relative;bottom:auto;left:auto;transform:none;z-index:1;display:flex;gap:10px;max-width:100%;overflow-x:auto;padding:0;-webkit-overflow-scrolling:touch;`
  }
  return container
}

function createPowerupBarHTML(
  powerups: Array<{ id: string; icon: string; name: string }>,
  inventory: string[],
): string {
  return powerups
    .map((p) => {
      const count = inventory.filter((id) => id === p.id).length
      return `
        <button type="button" class="powerup-btn" data-powerup="${p.id}" title="${p.name}" style="min-width:52px;min-height:52px;border:none;border-radius:14px;background:rgba(255,255,255,0.15);backdrop-filter:blur(8px);color:#fff;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;flex-shrink:0;">
          <span class="powerup-icon" style="font-size:22px;line-height:1">${p.icon}</span>
          <span class="powerup-count" style="font-size:11px;font-weight:700">${count}</span>
        </button>
      `
    })
    .join('')
}

function updatePowerupCount(container: HTMLElement, powerupId: string, newCount: number) {
  const btn = container.querySelector(`.powerup-btn[data-powerup="${powerupId}"]`)
  const countEl = btn?.querySelector('.powerup-count')
  if (countEl) countEl.textContent = String(newCount)
}