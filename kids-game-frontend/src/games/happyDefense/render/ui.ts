import { TOWER_DEFS } from '../config'
import type { BuffKind, GameState, TowerKind } from '../types'
import { computeGrade } from '../logic/gameLoop'

export type HudAction =
  | { type: 'selectTower'; kind: TowerKind }
  | { type: 'nextWave' }
  | { type: 'reset' }
  | { type: 'upgrade' }
  | { type: 'sell' }
  | { type: 'buff'; kind: BuffKind }
  | { type: 'skipBuff' }
  | { type: 'endAfterResult' }

export interface HappyDefenseHud {
  root: HTMLElement
  sync: (state: GameState) => void
  onAction: (handler: (action: HudAction) => void) => void
  dispose: () => void
}

export function createHappyDefenseHud(parent: HTMLElement): HappyDefenseHud {
  const root = document.createElement('div')
  root.className = 'happy-defense-hud'
  root.innerHTML = `
    <style>
      .happy-defense-hud {
        position: absolute; inset: 0; pointer-events: none;
        font-family: system-ui, sans-serif; color: #fff;
        text-shadow: 0 1px 2px rgba(0,0,0,.5);
      }
      .hd-top {
        display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 10px;
        background: linear-gradient(180deg, rgba(20,30,50,.85), transparent);
      }
      .hd-pill {
        background: rgba(15,22,40,.78); border-radius: 10px; padding: 5px 10px; font-size: 12px;
      }
      .hd-bar {
        position: absolute; left: 0; right: 0; bottom: 0; pointer-events: auto;
        padding: 8px 10px 12px; background: linear-gradient(0deg, rgba(12,18,32,.92), rgba(12,18,32,.55));
      }
      .hd-towers { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; margin-bottom: 8px; }
      .hd-tbtn {
        border: 2px solid rgba(255,255,255,.2); border-radius: 12px; padding: 6px 10px;
        background: rgba(255,255,255,.08); color: #fff; font-size: 12px; cursor: pointer;
      }
      .hd-tbtn.active { border-color: #ffe566; box-shadow: 0 0 10px #ffe56666; }
      .hd-actions { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
      .hd-btn {
        border: none; border-radius: 10px; padding: 8px 14px; font-size: 13px; cursor: pointer;
        background: linear-gradient(135deg,#6bcb77,#4caf50); color: #fff;
      }
      .hd-btn.warn { background: linear-gradient(135deg,#ff8e53,#ff6b6b); }
      .hd-btn.secondary { background: rgba(255,255,255,.15); }
      .hd-modal {
        position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,.45); pointer-events: auto;
      }
      .hd-card {
        background: rgba(18,28,48,.95); border-radius: 16px; padding: 20px 22px;
        max-width: 320px; text-align: center;
      }
      .hd-card h2 { margin: 0 0 10px; font-size: 20px; }
      .hd-buff-row { display: flex; flex-direction: column; gap: 8px; margin: 12px 0; }
      .hd-hint {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%,-120%);
        font-size: 13px; opacity: .85; text-align: center; max-width: 90%;
      }
    </style>
    <div class="hd-top">
      <div class="hd-pill" id="hdWave">波次 0/6</div>
      <div class="hd-pill" id="hdHp">基地 20</div>
      <div class="hd-pill" id="hdGold">金币 0</div>
      <div class="hd-pill" id="hdScore">分数 0</div>
      <div class="hd-pill" id="hdBest">最高 0</div>
      <div class="hd-pill" id="hdCombo" style="display:none">连击 x0</div>
    </div>
    <div class="hd-hint" id="hdHint">点击空地放塔 · 点击已有塔升级/出售 · 准备好后点下一波</div>
    <div class="hd-bar">
      <div class="hd-towers" id="hdTowers"></div>
      <div class="hd-actions">
        <button type="button" class="hd-btn secondary" id="hdUpgrade" disabled>升级塔</button>
        <button type="button" class="hd-btn secondary" id="hdSell" disabled>出售</button>
        <button type="button" class="hd-btn" id="hdWaveBtn">下一波</button>
        <button type="button" class="hd-btn warn" id="hdReset">重置战局</button>
      </div>
    </div>
    <div class="hd-modal" id="hdModal" style="display:none"></div>
  `
  parent.style.position = 'relative'
  parent.appendChild(root)

  const towerKinds: TowerKind[] = ['popcorn', 'bubble', 'lightning', 'pierce']
  const elTowers = root.querySelector('#hdTowers') as HTMLElement
  elTowers.innerHTML = towerKinds
    .map(k => {
      const d = TOWER_DEFS[k]
      return `<button type="button" class="hd-tbtn" data-kind="${k}">${d.emoji} ${d.name}<br><small>${d.cost}金</small></button>`
    })
    .join('')

  let actionHandler: ((action: HudAction) => void) | null = null
  let selectedKind: TowerKind = 'popcorn'
  let modalMode: 'none' | 'buff' | 'result' = 'none'

  const emit = (action: HudAction) => actionHandler?.(action)

  elTowers.querySelectorAll('.hd-tbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = (btn as HTMLElement).dataset.kind as TowerKind
      selectedKind = k
      emit({ type: 'selectTower', kind: k })
      elTowers.querySelectorAll('.hd-tbtn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
    })
  })
  ;(elTowers.querySelector('[data-kind="popcorn"]') as HTMLElement)?.classList.add('active')

  root.querySelector('#hdWaveBtn')?.addEventListener('click', () => emit({ type: 'nextWave' }))
  root.querySelector('#hdReset')?.addEventListener('click', () => emit({ type: 'reset' }))
  root.querySelector('#hdUpgrade')?.addEventListener('click', () => emit({ type: 'upgrade' }))
  root.querySelector('#hdSell')?.addEventListener('click', () => emit({ type: 'sell' }))

  const elModal = root.querySelector('#hdModal') as HTMLElement

  const sync = (state: GameState) => {
    const waveLbl = state.phase === 'prep' ? `准备 · 第${state.waveIndex + 1}波` : `第${Math.min(state.waveIndex + 1, state.totalWaves)}波`
    ;(root.querySelector('#hdWave') as HTMLElement).textContent = `${waveLbl} / ${state.totalWaves}`
    ;(root.querySelector('#hdHp') as HTMLElement).textContent = `基地 ${state.baseHp}/${state.maxBaseHp}`
    ;(root.querySelector('#hdGold') as HTMLElement).textContent = `金币 ${state.gold}`
    ;(root.querySelector('#hdScore') as HTMLElement).textContent = `分数 ${state.score}`
    ;(root.querySelector('#hdBest') as HTMLElement).textContent = `最高 ${state.records.bestScore}`
    const comboEl = root.querySelector('#hdCombo') as HTMLElement
    if (state.combo >= 3) {
      comboEl.style.display = 'block'
      comboEl.textContent = `连击 x${state.combo}`
    } else comboEl.style.display = 'none'

    elTowers.querySelectorAll('.hd-tbtn').forEach(btn => {
      const k = (btn as HTMLElement).dataset.kind as TowerKind
      btn.classList.toggle('active', k === state.selectedTower)
    })

    const canWave = state.phase === 'prep' || state.phase === 'buffPick'
    const waveBtn = root.querySelector('#hdWaveBtn') as HTMLButtonElement
    waveBtn.disabled = !canWave || state.waveIndex >= state.totalWaves
    waveBtn.textContent =
      state.waveIndex >= state.totalWaves && state.phase === 'victory' ? '已通关' : '下一波'

    const up = root.querySelector('#hdUpgrade') as HTMLButtonElement
    const sell = root.querySelector('#hdSell') as HTMLButtonElement
    up.disabled = state.selectedTowerId == null
    sell.disabled = state.selectedTowerId == null

    const wantBuff = state.phase === 'buffPick' && state.pendingBuffChoices.length > 0
    const wantResult = state.phase === 'victory' || state.phase === 'defeat'
    if (wantBuff && modalMode !== 'buff') {
      modalMode = 'buff'
      elModal.style.display = 'flex'
      elModal.innerHTML = `
        <div class="hd-card">
          <h2>随机趣味 Buff</h2>
          <p>选一张增益，本局更轻松！</p>
          <div class="hd-buff-row">
            ${state.pendingBuffChoices
              .map(
                b =>
                  `<button type="button" class="hd-btn" data-buff="${b.kind}">${b.label}</button>`,
              )
              .join('')}
          </div>
          <button type="button" class="hd-btn secondary" id="hdSkipBuff">跳过</button>
        </div>`
      elModal.querySelectorAll('[data-buff]').forEach(btn => {
        btn.addEventListener('click', () => {
          emit({ type: 'buff', kind: (btn as HTMLElement).dataset.buff as BuffKind })
        })
      })
      elModal.querySelector('#hdSkipBuff')?.addEventListener('click', () => emit({ type: 'skipBuff' }))
    } else if (wantResult && modalMode !== 'result') {
      modalMode = 'result'
      elModal.style.display = 'flex'
      const grade = state.phase === 'victory' ? computeGrade(state) : '—'
      const time =
        state.phase === 'victory' ? `${state.waveClearTime.toFixed(1)}秒` : '—'
      elModal.innerHTML = `
        <div class="hd-card">
          <h2>${state.phase === 'victory' ? '通关啦！' : '基地失守'}</h2>
          <p>评级 <b>${grade}</b> · 用时 ${time}</p>
          <p>本局分数 <b>${state.score}</b></p>
          <p>历史最高 <b>${state.records.bestScore}</b></p>
          <button type="button" class="hd-btn" id="hdDone">确定</button>
        </div>`
      elModal.querySelector('#hdDone')?.addEventListener('click', () => emit({ type: 'endAfterResult' }))
    } else if (!wantBuff && !wantResult) {
      modalMode = 'none'
      elModal.style.display = 'none'
      elModal.innerHTML = ''
    }

    void selectedKind
  }

  return {
    root,
    sync,
    onAction: h => {
      actionHandler = h
    },
    dispose: () => root.remove(),
  }
}