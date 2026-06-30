import { PICKUP_DEFS } from '../config'
import { gradeLabel } from '../logic/gameLoop'
import type { GameState, PlayMode } from '../types'

export type HudAction =
  | { type: 'mode'; mode: PlayMode }
  | { type: 'clearScreen' }
  | { type: 'reset' }
  | { type: 'pause' }
  | { type: 'endAfterResult' }

export interface SkyFrenzyHud {
  root: HTMLElement
  sync: (state: GameState) => void
  onAction: (handler: (action: HudAction) => void) => void
  openModeMenu: () => Promise<PlayMode>
  resetOverlays: () => void
  dispose: () => void
}

export function createSkyFrenzyHud(parent: HTMLElement): SkyFrenzyHud {
  const root = document.createElement('div')
  root.className = 'sky-frenzy-hud'
  root.innerHTML = `
    <style>
      .sky-frenzy-hud {
        position: absolute; inset: 0; pointer-events: none;
        font-family: system-ui, sans-serif; color: #fff;
        text-shadow: 0 1px 3px rgba(0,0,0,.45);
      }
      .sf-top {
        display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 10px;
        background: linear-gradient(180deg, rgba(25,45,80,.88), transparent);
      }
      .sf-pill {
        background: rgba(12,24,48,.75); border-radius: 10px; padding: 5px 10px; font-size: 12px;
      }
      .sf-side {
        position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
        display: flex; flex-direction: column; gap: 8px; pointer-events: auto;
      }
      .sf-btn {
        border: none; border-radius: 12px; padding: 10px 12px; font-size: 12px; cursor: pointer;
        background: rgba(255,255,255,.12); color: #fff; min-width: 72px;
      }
      .sf-btn.primary { background: linear-gradient(135deg,#6bcbff,#4d96ff); }
      .sf-btn.warn { background: linear-gradient(135deg,#ff8e53,#ff6b6b); }
      .sf-btn:disabled { opacity: .45; cursor: not-allowed; }
      .sf-bottom {
        position: absolute; left: 0; right: 0; bottom: 0; padding: 8px 12px 14px;
        background: linear-gradient(0deg, rgba(10,20,40,.9), transparent);
        display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;
        font-size: 12px;
      }
      .sf-modal {
        position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,.5); pointer-events: auto; z-index: 20;
      }
      .sf-card {
        background: rgba(18,32,58,.96); border-radius: 18px; padding: 22px 24px;
        max-width: 340px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,.35);
      }
      .sf-card h2 { margin: 0 0 8px; font-size: 22px; }
      .sf-card p { margin: 6px 0; font-size: 13px; opacity: .9; line-height: 1.45; }
      .sf-row { display: flex; gap: 10px; justify-content: center; margin-top: 14px; flex-wrap: wrap; }
      .sf-hint {
        position: absolute; left: 50%; bottom: 72px; transform: translateX(-50%);
        font-size: 12px; opacity: .8; text-align: center; max-width: 92%;
      }
    </style>
    <div class="sf-top">
      <div class="sf-pill" id="sfScore">分数 0</div>
      <div class="sf-pill" id="sfBest">最高 0</div>
      <div class="sf-pill" id="sfCombo" style="display:none">连击 x0</div>
      <div class="sf-pill" id="sfHp">生命 8</div>
      <div class="sf-pill" id="sfWave">波次 1/6</div>
      <div class="sf-pill" id="sfTime">用时 0s</div>
    </div>
    <div class="sf-hint" id="sfHint">拖拽移动 · WASD · 自动开火 · 清屏技能无扣分</div>
    <div class="sf-side">
      <button type="button" class="sf-btn" id="sfMode">休闲</button>
      <button type="button" class="sf-btn primary" id="sfClear">清屏</button>
      <button type="button" class="sf-btn" id="sfPause">暂停</button>
      <button type="button" class="sf-btn warn" id="sfReset">重置</button>
    </div>
    <div class="sf-bottom">
      <span class="sf-pill" id="sfFire">弹幕 Lv.1</span>
      <span class="sf-pill" id="sfBuff">增益 —</span>
      <span class="sf-pill" id="sfCd">清屏就绪</span>
    </div>
    <div class="sf-modal" id="sfModal" style="display:none"></div>
  `
  parent.style.position = 'relative'
  parent.appendChild(root)

  let actionHandler: ((action: HudAction) => void) | null = null
  const modal = root.querySelector('#sfModal') as HTMLElement

  const emit = (action: HudAction) => actionHandler?.(action)

  root.querySelector('#sfClear')?.addEventListener('click', () => emit({ type: 'clearScreen' }))
  root.querySelector('#sfReset')?.addEventListener('click', () => emit({ type: 'reset' }))
  root.querySelector('#sfPause')?.addEventListener('click', () => emit({ type: 'pause' }))
  root.querySelector('#sfMode')?.addEventListener('click', () => {
    const btn = root.querySelector('#sfMode') as HTMLButtonElement
    const next: PlayMode = btn.textContent?.includes('竞技') ? 'casual' : 'compete'
    emit({ type: 'mode', mode: next })
  })

  const openModeMenu = (): Promise<PlayMode> =>
    new Promise(resolve => {
      modal.style.display = 'flex'
      modal.innerHTML = `
        <div class="sf-card">
          <h2>天际狂潮</h2>
          <p>3D俯视角趣味空战：全自动开火、连环爆炸解压，也可竞速冲榜与无伤挑战。</p>
          <div class="sf-row">
            <button type="button" class="sf-btn primary" id="sfPickCasual">休闲解压</button>
            <button type="button" class="sf-btn warn" id="sfPickCompete">极限竞技</button>
          </div>
        </div>
      `
      modal.querySelector('#sfPickCasual')?.addEventListener('click', () => {
        modal.style.display = 'none'
        resolve('casual')
      })
      modal.querySelector('#sfPickCompete')?.addEventListener('click', () => {
        modal.style.display = 'none'
        resolve('compete')
      })
    })

  let resultDismissed = false
  let pauseShown = false

  const sync = (state: GameState) => {
    const set = (id: string, text: string) => {
      const el = root.querySelector(id)
      if (el) el.textContent = text
    }
    set('#sfScore', `分数 ${state.score}`)
    set('#sfBest', `最高 ${state.records.bestScore}`)
    set('#sfHp', `生命 ${state.player.hp}/${state.player.maxHp}`)
    set('#sfWave', `波次 ${Math.min(state.waveIndex + 1, state.totalWaves)}/${state.totalWaves}`)
    set('#sfTime', `用时 ${state.elapsedSec.toFixed(0)}s`)
    set('#sfFire', `弹幕 Lv.${state.player.bulletTier}`)
    const buffParts: string[] = []
    if (state.player.shield > 0) buffParts.push(`护盾 ${state.player.shield.toFixed(0)}s`)
    if (state.slowMoTimer > 0) buffParts.push(`缓速 ${state.slowMoTimer.toFixed(0)}s`)
    if (state.player.fireTierTimer > 0) buffParts.push(`火力 ${state.player.fireTierTimer.toFixed(0)}s`)
    set('#sfBuff', buffParts.length ? buffParts.join(' · ') : '增益 —')
    set('#sfCd', state.clearScreenCd > 0 ? `清屏 ${state.clearScreenCd.toFixed(0)}s` : '清屏就绪')

    const comboEl = root.querySelector('#sfCombo') as HTMLElement
    if (state.combo > 1) {
      comboEl.style.display = 'block'
      comboEl.textContent = `连击 x${state.combo}`
    } else {
      comboEl.style.display = 'none'
    }

    const modeBtn = root.querySelector('#sfMode') as HTMLButtonElement
    modeBtn.textContent = state.mode === 'casual' ? '模式·休闲' : '模式·竞技'

    const clearBtn = root.querySelector('#sfClear') as HTMLButtonElement
    clearBtn.disabled = state.clearScreenCd > 0 || state.phase !== 'playing'

    if ((state.phase === 'victory' || state.phase === 'defeat') && !resultDismissed) {
      const fast =
        state.records.fastestClearSec < 999999 ? state.records.fastestClearSec.toFixed(0) : '—'
      modal.style.display = 'flex'
      modal.innerHTML = `
        <div class="sf-card">
          <h2>${state.phase === 'victory' ? '通关！' : '战机坠落'}</h2>
          <p>评级：${gradeLabel(state)}</p>
          <p>本局 ${state.score} 分 · 最高连击 ${state.combo} · 用时 ${state.elapsedSec.toFixed(1)}s</p>
          <p>历史最快 ${fast}s · 无伤通关 ${state.records.flawlessClears} 次</p>
          <div class="sf-row">
            <button type="button" class="sf-btn primary" id="sfAgain">再来一局</button>
            <button type="button" class="sf-btn" id="sfLobby">返回大厅</button>
          </div>
        </div>
      `
      modal.querySelector('#sfAgain')?.addEventListener('click', () => {
        resultDismissed = true
        modal.style.display = 'none'
        emit({ type: 'reset' })
      })
      modal.querySelector('#sfLobby')?.addEventListener('click', () => emit({ type: 'endAfterResult' }))
    } else if (state.phase === 'paused') {
      modal.style.display = 'flex'
      modal.innerHTML = `
        <div class="sf-card">
          <h2>暂停</h2>
          <p>道具：${Object.values(PICKUP_DEFS).map(d => d.label).join(' / ')}</p>
          <div class="sf-row">
            <button type="button" class="sf-btn primary" id="sfResume">继续</button>
          </div>
        </div>
      `
      modal.querySelector('#sfResume')?.addEventListener('click', () => emit({ type: 'pause' }))
    } else {
      if (!modal.querySelector('#sfPickCasual')) modal.style.display = 'none'
    }
  }

  return {
    root,
    sync,
    onAction: h => {
      actionHandler = h
    },
    openModeMenu,
    resetOverlays: () => {
      resultDismissed = false
      pauseShown = false
      modal.style.display = 'none'
    },
    dispose: () => root.remove(),
  }
}