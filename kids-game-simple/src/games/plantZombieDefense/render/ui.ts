import { GAME_CONFIG, PLANT_DEFS } from '../config'
import { computeStars } from '../logic/gameLoop'
import { PlantKind, type GameState } from '../types'

export type HudAction =
  | { type: 'selectPlant'; kind: PlantKind }
  | { type: 'nextWave' }
  | { type: 'reset' }
  | { type: 'remove' }
  | { type: 'level'; level: number }
  | { type: 'endAfterResult' }

export interface PlantZombieHud {
  root: HTMLElement
  sync: (state: GameState) => void
  onAction: (handler: (action: HudAction) => void) => void
  dispose: () => void
}

const PLANT_BAR: PlantKind[] = [
  PlantKind.sunflower,
  PlantKind.peashooter,
  PlantKind.wallnut,
  PlantKind.potatoMine,
  PlantKind.snowPea,
]

export function createPlantZombieHud(parent: HTMLElement): PlantZombieHud {
  const root = document.createElement('div')
  root.className = 'plant-zombie-hud'
  root.innerHTML = `
    <style>
      .plant-zombie-hud {
        position: absolute; inset: 0; pointer-events: none;
        font-family: system-ui, sans-serif; color: #fff;
        text-shadow: 0 1px 2px rgba(0,0,0,.45);
      }
      .pzd-top {
        display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 12px;
        background: linear-gradient(180deg, rgba(114,213,102,.35), transparent);
      }
      .pzd-pill {
        background: rgba(255,255,255,.22); border-radius: 12px; padding: 6px 12px; font-size: 13px;
        color: #2d4a28;
      }
      .pzd-bar {
        position: absolute; left: 0; right: 0; bottom: 0; pointer-events: auto;
        padding: 10px 12px 14px; background: linear-gradient(0deg, rgba(194,232,185,.95), rgba(194,232,185,.6));
      }
      .pzd-plants { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 10px; }
      .pzd-pbtn {
        border: 2px solid rgba(114,213,102,.5); border-radius: 14px; padding: 8px 10px;
        background: #fff; color: #2d4a28; font-size: 12px; cursor: pointer; min-width: 72px;
      }
      .pzd-pbtn.active { border-color: #FFD23F; box-shadow: 0 0 12px #ffd23f88; }
      .pzd-pbtn:disabled { opacity: .45; cursor: not-allowed; }
      .pzd-actions { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
      .pzd-btn {
        border: none; border-radius: 12px; padding: 9px 16px; font-size: 13px; cursor: pointer;
        background: linear-gradient(135deg,#72D566,#57B8FF); color: #fff;
      }
      .pzd-btn.warn { background: linear-gradient(135deg,#F27052,#ff8e53); }
      .pzd-btn.secondary { background: rgba(45,74,40,.15); color: #2d4a28; }
      .pzd-modal {
        position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,.4); pointer-events: auto;
      }
      .pzd-card {
        background: #fff; border-radius: 18px; padding: 22px 24px; max-width: 340px; text-align: center;
        color: #2d4a28; box-shadow: 0 8px 32px rgba(0,0,0,.15);
      }
      .pzd-card h2 { margin: 0 0 12px; font-size: 22px; color: #72D566; }
      .pzd-hint {
        position: absolute; top: 42%; left: 50%; transform: translate(-50%,-50%);
        font-size: 13px; color: #2d4a28; text-align: center; max-width: 88%; opacity: .9;
      }
      .pzd-levels { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin: 12px 0; max-height: 120px; overflow-y: auto; }
      .pzd-lvl { padding: 6px 10px; border-radius: 8px; border: 1px solid #72D566; background: #f5fff3; cursor: pointer; font-size: 12px; }
      .pzd-lvl.locked { opacity: .4; pointer-events: none; }
    </style>
    <div class="pzd-top">
      <div class="pzd-pill" id="pzdLevel">第1关</div>
      <div class="pzd-pill" id="pzdWave">波次 0/3</div>
      <div class="pzd-pill" id="pzdSun">☀️ 250</div>
      <div class="pzd-pill" id="pzdHp">🏠 100</div>
      <div class="pzd-pill" id="pzdScore">分数 0</div>
    </div>
    <div class="pzd-hint" id="pzdHint">点击阳光收集 · 点草坪放植物 · 点植物移除(返还20%阳光)</div>
    <div class="pzd-bar">
      <div class="pzd-plants" id="pzdPlants"></div>
      <div class="pzd-actions">
        <button type="button" class="pzd-btn secondary" id="pzdRemove" disabled>🗑️ 移除植物</button>
        <button type="button" class="pzd-btn" id="pzdWaveBtn">开始波次</button>
        <button type="button" class="pzd-btn warn" id="pzdReset">重开本关</button>
      </div>
    </div>
    <div class="pzd-modal" id="pzdModal" style="display:none"></div>
  `
  parent.style.position = 'relative'
  parent.appendChild(root)

  const elPlants = root.querySelector('#pzdPlants') as HTMLElement
  elPlants.innerHTML = PLANT_BAR.map(k => {
    const d = PLANT_DEFS[k]
    return `<button type="button" class="pzd-pbtn" data-kind="${k}">${d.emoji} ${d.name}<br><small>${d.cost}☀️</small></button>`
  }).join('')

  let actionHandler: ((action: HudAction) => void) | null = null
  let selectedKind: PlantKind = PlantKind.peashooter

  const emit = (action: HudAction) => actionHandler?.(action)

  elPlants.querySelectorAll('.pzd-pbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = (btn as HTMLElement).dataset.kind as PlantKind
      selectedKind = k
      emit({ type: 'selectPlant', kind: k })
      elPlants.querySelectorAll('.pzd-pbtn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
    })
  })
  ;(elPlants.querySelector(`[data-kind="${PlantKind.peashooter}"]`) as HTMLElement)?.classList.add('active')

  root.querySelector('#pzdWaveBtn')?.addEventListener('click', () => emit({ type: 'nextWave' }))
  root.querySelector('#pzdReset')?.addEventListener('click', () => emit({ type: 'reset' }))
  root.querySelector('#pzdRemove')?.addEventListener('click', () => emit({ type: 'remove' }))

  const modal = root.querySelector('#pzdModal') as HTMLElement

  return {
    root,
    onAction: h => {
      actionHandler = h
    },
    sync(state: GameState) {
      const elLevel = root.querySelector('#pzdLevel') as HTMLElement
      const elWave = root.querySelector('#pzdWave') as HTMLElement
      const elSun = root.querySelector('#pzdSun') as HTMLElement
      const elHp = root.querySelector('#pzdHp') as HTMLElement
      const elScore = root.querySelector('#pzdScore') as HTMLElement
      const elHint = root.querySelector('#pzdHint') as HTMLElement
      const waveBtn = root.querySelector('#pzdWaveBtn') as HTMLButtonElement
      const removeBtn = root.querySelector('#pzdRemove') as HTMLButtonElement

      elLevel.textContent = `第${state.levelIndex}关`
      elWave.textContent = `波次 ${state.waveIndex}/${state.totalWaves}`
      elSun.textContent = `☀️ ${state.sun}`
      elHp.textContent = `�� ${state.houseHp}/${state.maxHouseHp}`
      elScore.textContent = `分数 ${state.score}`

      elPlants.querySelectorAll('.pzd-pbtn').forEach(btn => {
        const k = (btn as HTMLElement).dataset.kind as PlantKind
        const cost = PLANT_DEFS[k].cost
        ;(btn as HTMLButtonElement).disabled = state.sun < cost
        btn.classList.toggle('active', k === state.selectedPlant)
      })

      removeBtn.disabled = state.selectedPlantId == null
      waveBtn.disabled = state.phase !== 'prep' || state.waveIndex >= state.totalWaves
      waveBtn.textContent = state.phase === 'wave' ? '进攻中…' : '开始波次'

      if (state.phase === 'prep') {
        elHint.style.display = 'block'
        elHint.textContent = '先种向日葵攒阳光，再点「开始波次」抵御僵尸！'
      } else if (state.phase === 'wave') {
        elHint.textContent = '守住小屋！点击飘落的阳光补充资源'
      } else {
        elHint.style.display = 'none'
      }

      if (state.phase === 'victory' || state.phase === 'defeat') {
        modal.style.display = 'flex'
        const stars = state.phase === 'victory' ? computeStars(state) : 0
        const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars)
        const unlocked = state.records.unlockedLevel
        let levelBtns = ''
        for (let i = 1; i <= GAME_CONFIG.totalLevels; i++) {
          const locked = i > unlocked && state.phase === 'victory' ? i > state.levelIndex + 1 : i > unlocked
          levelBtns += `<button type="button" class="pzd-lvl${locked ? ' locked' : ''}" data-lvl="${i}">L${i}</button>`
        }
        modal.innerHTML = `
          <div class="pzd-card">
            <h2>${state.phase === 'victory' ? '通关啦！' : '小屋被攻破'}</h2>
            <p>${starStr}</p>
            <p>得分 ${state.score} · 最高 ${state.records.bestScore}</p>
            <div class="pzd-levels">${levelBtns}</div>
            <button type="button" class="pzd-btn" id="pzdBack">返回大厅</button>
            <button type="button" class="pzd-btn secondary" id="pzdRetry">再玩本关</button>
          </div>
        `
        modal.querySelector('#pzdBack')?.addEventListener('click', () => emit({ type: 'endAfterResult' }))
        modal.querySelector('#pzdRetry')?.addEventListener('click', () => {
          modal.style.display = 'none'
          emit({ type: 'reset' })
        })
        modal.querySelectorAll('.pzd-lvl:not(.locked)').forEach(btn => {
          btn.addEventListener('click', () => {
            const lvl = Number((btn as HTMLElement).dataset.lvl)
            modal.style.display = 'none'
            emit({ type: 'level', level: lvl })
          })
        })
      } else {
        modal.style.display = 'none'
        modal.innerHTML = ''
      }
    },
    dispose() {
      root.remove()
    },
  }
}