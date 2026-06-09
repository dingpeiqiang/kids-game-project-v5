import type { GameState, Tower, TowerType } from '../types'
import { GAME_CONFIG, TOWER_TYPES, COLORS } from '../config'

export function createUI(container: HTMLElement): HTMLElement {
  const ui = document.createElement('div')
  ui.className = 'sky-defense-ui'
  ui.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    font-family: 'Segoe UI', sans-serif;
    color: ${COLORS.text.toString(16).padStart(6, '0')};
  `
  
  const topBar = createTopBar()
  ui.appendChild(topBar)
  
  const towerPanel = createTowerPanel()
  ui.appendChild(towerPanel)
  
  const actionPanel = createActionPanel()
  ui.appendChild(actionPanel)
  
  const gameOverModal = createGameOverModal()
  ui.appendChild(gameOverModal)
  
  const victoryModal = createVictoryModal()
  ui.appendChild(victoryModal)
  
  const waveWarning = createWaveWarning()
  ui.appendChild(waveWarning)
  
  container.appendChild(ui)
  
  return ui
}

function createTopBar(): HTMLElement {
  const bar = document.createElement('div')
  bar.style.cssText = `
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `
  
  const leftSection = document.createElement('div')
  leftSection.style.cssText = `
    display: flex;
    gap: 20px;
    align-items: center;
  `
  
  const waveInfo = document.createElement('div')
  waveInfo.style.cssText = `
    background: rgba(0,0,0,0.6);
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 16px;
  `
  waveInfo.innerHTML = `<span style="color: ${COLORS.wave.toString(16).padStart(6, '0')}">波次</span> <span id="wave-number">1</span> / ${GAME_CONFIG.MAX_WAVES}`
  leftSection.appendChild(waveInfo)
  
  const livesInfo = document.createElement('div')
  livesInfo.style.cssText = `
    background: rgba(0,0,0,0.6);
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 16px;
  `
  livesInfo.innerHTML = `<span>❤️</span> <span id="lives-count" style="color: ${COLORS.health.toString(16).padStart(6, '0')}">${GAME_CONFIG.INITIAL_LIVES}</span>`
  leftSection.appendChild(livesInfo)
  
  bar.appendChild(leftSection)
  
  const rightSection = document.createElement('div')
  rightSection.style.cssText = `
    display: flex;
    gap: 20px;
    align-items: center;
  `
  
  const goldInfo = document.createElement('div')
  goldInfo.style.cssText = `
    background: rgba(0,0,0,0.6);
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 16px;
  `
  goldInfo.innerHTML = `<span>💰</span> <span id="gold-count" style="color: ${COLORS.gold.toString(16).padStart(6, '0')}">${GAME_CONFIG.INITIAL_GOLD}</span>`
  rightSection.appendChild(goldInfo)
  
  const scoreInfo = document.createElement('div')
  scoreInfo.style.cssText = `
    background: rgba(0,0,0,0.6);
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 16px;
  `
  scoreInfo.innerHTML = `<span>🏆</span> <span id="score-count">0</span>`
  rightSection.appendChild(scoreInfo)
  
  bar.appendChild(rightSection)
  
  return bar
}

function createTowerPanel(): HTMLElement {
  const panel = document.createElement('div')
  panel.style.cssText = `
    position: absolute;
    bottom: 10px;
    left: 10px;
    background: rgba(0,0,0,0.7);
    padding: 12px;
    border-radius: 12px;
    display: flex;
    gap: 10px;
  `
  
  TOWER_TYPES.forEach((towerType) => {
    const button = document.createElement('button')
    button.id = `tower-btn-${towerType.id}`
    button.style.cssText = `
      pointer-events: auto;
      background: rgba(50,50,70,0.8);
      border: 2px solid ${towerType.color.toString(16).padStart(6, '0')};
      border-radius: 8px;
      padding: 10px 15px;
      color: white;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      min-width: 80px;
      transition: all 0.2s;
    `
    button.innerHTML = `
      <span style="font-size: 20px">${towerType.icon}</span>
      <span>${towerType.name}</span>
      <span style="color: ${COLORS.gold.toString(16).padStart(6, '0')}; font-size: 12px">💰${towerType.cost}</span>
    `
    button.addEventListener('click', () => {
      const event = new CustomEvent('tower-select', { detail: { towerType } })
      document.dispatchEvent(event)
    })
    panel.appendChild(button)
  })
  
  return panel
}

function createActionPanel(): HTMLElement {
  const panel = document.createElement('div')
  panel.id = 'action-panel'
  panel.style.cssText = `
    position: absolute;
    bottom: 10px;
    right: 10px;
    background: rgba(0,0,0,0.7);
    padding: 12px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    display: none;
  `
  
  const upgradeBtn = document.createElement('button')
  upgradeBtn.id = 'upgrade-btn'
  upgradeBtn.style.cssText = `
    pointer-events: auto;
    background: linear-gradient(135deg, #44aa44, #228822);
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    color: white;
    font-size: 14px;
    cursor: pointer;
    font-weight: bold;
  `
  upgradeBtn.innerHTML = '⬆️ 升级 (💰<span id="upgrade-cost">0</span>)'
  upgradeBtn.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('tower-upgrade'))
  })
  panel.appendChild(upgradeBtn)
  
  const sellBtn = document.createElement('button')
  sellBtn.style.cssText = `
    pointer-events: auto;
    background: linear-gradient(135deg, #aa4444, #882222);
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    color: white;
    font-size: 14px;
    cursor: pointer;
    font-weight: bold;
  `
  sellBtn.innerHTML = '💰 出售 (+💰<span id="sell-value">0</span>)'
  sellBtn.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('tower-sell'))
  })
  panel.appendChild(sellBtn)
  
  const closeBtn = document.createElement('button')
  closeBtn.style.cssText = `
    pointer-events: auto;
    background: rgba(100,100,100,0.8);
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    color: white;
    font-size: 12px;
    cursor: pointer;
  `
  closeBtn.textContent = '✖️ 关闭'
  closeBtn.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('tower-deselect'))
  })
  panel.appendChild(closeBtn)
  
  return panel
}

function createGameOverModal(): HTMLElement {
  const modal = document.createElement('div')
  modal.id = 'gameover-modal'
  modal.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.85);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    display: none;
  `
  
  const title = document.createElement('h1')
  title.style.cssText = `
    color: #ff4444;
    font-size: 48px;
    margin-bottom: 20px;
    text-shadow: 0 0 20px rgba(255,68,68,0.5);
  `
  title.textContent = '游戏结束'
  modal.appendChild(title)
  
  const stats = document.createElement('div')
  stats.style.cssText = `
    background: rgba(50,50,70,0.8);
    padding: 20px 40px;
    border-radius: 12px;
    margin-bottom: 30px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 18px;
  `
  stats.innerHTML = `
    <div>最高波次: <span style="color: ${COLORS.wave.toString(16).padStart(6, '0')}"><span id="final-wave">1</span></span></div>
    <div>最终得分: <span style="color: ${COLORS.gold.toString(16).padStart(6, '0')}"><span id="final-score">0</span></span></div>
    <div>总击杀数: <span style="color: ${COLORS.health.toString(16).padStart(6, '0')}"><span id="final-kills">0</span></span></div>
  `
  modal.appendChild(stats)
  
  const button = document.createElement('button')
  button.style.cssText = `
    pointer-events: auto;
    background: linear-gradient(135deg, #44aaff, #2288dd);
    border: none;
    border-radius: 10px;
    padding: 15px 40px;
    color: white;
    font-size: 20px;
    cursor: pointer;
    font-weight: bold;
    transition: transform 0.2s;
  `
  button.textContent = '🔄 重新开始'
  button.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('game-restart'))
  })
  modal.appendChild(button)
  
  return modal
}

function createVictoryModal(): HTMLElement {
  const modal = document.createElement('div')
  modal.id = 'victory-modal'
  modal.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.85);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    display: none;
  `
  
  const title = document.createElement('h1')
  title.style.cssText = `
    color: ${COLORS.gold.toString(16).padStart(6, '0')};
    font-size: 48px;
    margin-bottom: 20px;
    text-shadow: 0 0 20px rgba(255,215,0,0.5);
  `
  title.textContent = '🎉 胜利！'
  modal.appendChild(title)
  
  const stats = document.createElement('div')
  stats.style.cssText = `
    background: rgba(50,50,70,0.8);
    padding: 20px 40px;
    border-radius: 12px;
    margin-bottom: 30px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 18px;
  `
  stats.innerHTML = `
    <div>通关波次: <span style="color: ${COLORS.wave.toString(16).padStart(6, '0')}">${GAME_CONFIG.MAX_WAVES}</span></div>
    <div>最终得分: <span style="color: ${COLORS.gold.toString(16).padStart(6, '0')}"><span id="victory-score">0</span></span></div>
    <div>总击杀数: <span style="color: ${COLORS.health.toString(16).padStart(6, '0')}"><span id="victory-kills">0</span></span></div>
    <div>剩余血量: <span style="color: ${COLORS.health.toString(16).padStart(6, '0')}"><span id="victory-lives">0</span></span></div>
  `
  modal.appendChild(stats)
  
  const button = document.createElement('button')
  button.style.cssText = `
    pointer-events: auto;
    background: linear-gradient(135deg, #44aa44, #228822);
    border: none;
    border-radius: 10px;
    padding: 15px 40px;
    color: white;
    font-size: 20px;
    cursor: pointer;
    font-weight: bold;
    transition: transform 0.2s;
  `
  button.textContent = '🔄 再玩一次'
  button.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('game-restart'))
  })
  modal.appendChild(button)
  
  return modal
}

function createWaveWarning(): HTMLElement {
  const warning = document.createElement('div')
  warning.id = 'wave-warning'
  warning.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0,0,0,0.9);
    padding: 30px 60px;
    border-radius: 16px;
    text-align: center;
    display: none;
    animation: pulse 0.5s ease-in-out infinite alternate;
  `
  
  const title = document.createElement('div')
  title.style.cssText = `
    font-size: 36px;
    color: ${COLORS.wave.toString(16).padStart(6, '0')};
    font-weight: bold;
    margin-bottom: 10px;
  `
  title.textContent = '第 X 波'
  warning.appendChild(title)
  
  const subtitle = document.createElement('div')
  subtitle.style.cssText = `
    font-size: 18px;
    color: #aaa;
  `
  subtitle.textContent = '怪物即将来袭！'
  warning.appendChild(subtitle)
  
  return warning
}

export function updateUI(state: GameState): void {
  document.getElementById('wave-number')!.textContent = state.wave.toString()
  document.getElementById('lives-count')!.textContent = state.lives.toString()
  document.getElementById('gold-count')!.textContent = state.gold.toString()
  document.getElementById('score-count')!.textContent = state.score.toString()
  
  const livesCount = document.getElementById('lives-count')!
  livesCount.style.color = state.lives <= 5 ? COLORS.healthLow.toString(16).padStart(6, '0') : COLORS.health.toString(16).padStart(6, '0')
}

export function showTowerPanel(show: boolean): void {
  const buttons = document.querySelectorAll<HTMLElement>('[id^="tower-btn-"]')
  buttons.forEach(btn => {
    btn.style.pointerEvents = show ? 'auto' : 'none'
    btn.style.opacity = show ? '1' : '0.5'
  })
}

export function updateTowerButtons(gold: number): void {
  TOWER_TYPES.forEach(towerType => {
    const btn = document.getElementById(`tower-btn-${towerType.id}`) as HTMLButtonElement
    if (btn) {
      btn.disabled = gold < towerType.cost
      btn.style.opacity = gold >= towerType.cost ? '1' : '0.5'
      btn.style.cursor = gold >= towerType.cost ? 'pointer' : 'not-allowed'
    }
  })
}

export function showActionPanel(show: boolean): void {
  const panel = document.getElementById('action-panel')
  if (panel) {
    panel.style.display = show ? 'flex' : 'none'
  }
}

export function updateActionPanel(tower: Tower | null, gold: number): void {
  const upgradeBtn = document.getElementById('upgrade-btn') as HTMLButtonElement
  const upgradeCost = document.getElementById('upgrade-cost')
  const sellValue = document.getElementById('sell-value')
  
  if (tower) {
    const canUpgrade = tower.level < GAME_CONFIG.MAX_TOWER_LEVEL
    const upgradeCostVal = canUpgrade ? Math.floor(tower.type.cost * Math.pow(GAME_CONFIG.UPGRADE_COST_MULTIPLIER, tower.level)) : 0
    const sellVal = Math.floor(tower.totalInvestment * GAME_CONFIG.SELL_REFUND_RATIO)
    
    upgradeCost!.textContent = upgradeCostVal.toString()
    sellValue!.textContent = sellVal.toString()
    
    if (upgradeBtn) {
      upgradeBtn.disabled = !canUpgrade || gold < upgradeCostVal
      upgradeBtn.style.opacity = (canUpgrade && gold >= upgradeCostVal) ? '1' : '0.5'
    }
  }
}

export function showGameOver(show: boolean, stats: { wave: number; score: number; kills: number }): void {
  const modal = document.getElementById('gameover-modal')
  if (modal) {
    modal.style.display = show ? 'flex' : 'none'
    if (show) {
      document.getElementById('final-wave')!.textContent = stats.wave.toString()
      document.getElementById('final-score')!.textContent = stats.score.toString()
      document.getElementById('final-kills')!.textContent = stats.kills.toString()
    }
  }
}

export function showVictory(show: boolean, stats: { score: number; kills: number; lives: number }): void {
  const modal = document.getElementById('victory-modal')
  if (modal) {
    modal.style.display = show ? 'flex' : 'none'
    if (show) {
      document.getElementById('victory-score')!.textContent = stats.score.toString()
      document.getElementById('victory-kills')!.textContent = stats.kills.toString()
      document.getElementById('victory-lives')!.textContent = stats.lives.toString()
    }
  }
}

export function showWaveWarning(show: boolean, waveNumber: number): void {
  const warning = document.getElementById('wave-warning')
  if (warning) {
    warning.style.display = show ? 'block' : 'none'
    if (show) {
      warning.querySelector('div:first-child')!.textContent = `第 ${waveNumber} 波`
    }
  }
}

export function createStartButton(container: HTMLElement): HTMLElement {
  const button = document.createElement('button')
  button.id = 'start-wave-btn'
  button.style.cssText = `
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: auto;
    background: linear-gradient(135deg, #44aa44, #228822);
    border: none;
    border-radius: 10px;
    padding: 15px 40px;
    color: white;
    font-size: 20px;
    cursor: pointer;
    font-weight: bold;
    transition: transform 0.2s;
    box-shadow: 0 4px 15px rgba(68, 170, 68, 0.4);
  `
  button.textContent = '▶️ 开始第 1 波'
  button.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('wave-start'))
  })
  container.appendChild(button)
  return button
}

export function updateStartButton(wave: number, inProgress: boolean): void {
  const button = document.getElementById('start-wave-btn')
  if (button) {
    button.style.display = inProgress ? 'none' : 'block'
    button.textContent = `▶️ 开始第 ${wave} 波`
  }
}