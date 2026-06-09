import type { GameState, PlayMode, RunStats } from '../types'

export type HudToolbarAction = 'clearScreen' | 'pause' | 'reset' | 'modeCasual' | 'modeCompete' | 'exit'

export interface SkyRushHudApi {
  root: HTMLElement
  openModeMenu: () => Promise<PlayMode>
  setPlaying: (state: GameState, stats: RunStats) => void
  showWaveToast: (wave: number, label: string) => void
  showPause: (paused: boolean) => void
  showResult: (opts: {
    won: boolean
    score: number
    stats: RunStats
    elapsedMs: number
    maxCombo: number
    flawless: boolean
  }) => Promise<'retry' | 'exit'>
  onToolbar: (handler: (action: HudToolbarAction) => void) => void
  dispose: () => void
}

export function createSkyRushHud(parent: HTMLElement): SkyRushHudApi {
  const root = document.createElement('div')
  root.className = 'sky-rush-hud'
  root.innerHTML = `
    <style>
      .sky-rush-hud {
        position: absolute; inset: 0; pointer-events: none;
        font-family: system-ui, "Segoe UI", sans-serif; color: #fff;
        text-shadow: 0 1px 4px rgba(0,0,0,.5);
      }
      .sky-rush-hud .sr-top {
        display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 12px; align-items: center;
      }
      .sky-rush-hud .sr-pill {
        background: rgba(20, 40, 70, 0.72); border-radius: 10px; padding: 6px 12px; font-size: 13px;
      }
      .sky-rush-hud .sr-side {
        position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
        display: flex; flex-direction: column; gap: 8px; pointer-events: auto;
      }
      .sky-rush-hud .sr-btn {
        border: none; border-radius: 12px; padding: 10px 14px; font-size: 13px; cursor: pointer;
        background: linear-gradient(145deg, #5b9cff, #3d72e8); color: #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,.25);
      }
      .sky-rush-hud .sr-btn.secondary { background: rgba(255,255,255,.15); }
      .sky-rush-hud .sr-bottom {
        position: absolute; left: 50%; bottom: 12px; transform: translateX(-50%);
        display: flex; gap: 10px;
      }
      .sky-rush-hud .sr-menu, .sky-rush-hud .sr-modal {
        position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
        background: rgba(10, 25, 45, 0.55); pointer-events: auto;
      }
      .sky-rush-hud .sr-card {
        background: rgba(15, 30, 55, 0.94); border-radius: 18px; padding: 22px 26px;
        max-width: 320px; width: 90%; text-align: center;
      }
      .sky-rush-hud .sr-toast {
        position: absolute; top: 18%; left: 50%; transform: translateX(-50%);
        background: rgba(255, 220, 120, 0.92); color: #1a2a40; padding: 10px 18px;
        border-radius: 12px; font-weight: 600; opacity: 0; transition: opacity .25s;
      }
      .sky-rush-hud .sr-hp { color: #ff8a8a; }
      .sky-rush-hud .sr-combo { color: #ffe566; }
    </style>
    <div class="sr-top">
      <div class="sr-pill" id="srScore">得分 0</div>
      <div class="sr-pill" id="srBest">最高 0</div>
      <div class="sr-pill sr-combo" id="srCombo">连击 ×0</div>
      <div class="sr-pill sr-hp" id="srHp">生命 ♥8</div>
      <div class="sr-pill" id="srWave">波次 1/6</div>
      <div class="sr-pill" id="srTier">弹幕 Lv.1</div>
      <div class="sr-pill" id="srBuff">增益 —</div>
    </div>
    <div class="sr-toast" id="srToast"></div>
    <div class="sr-side">
      <button type="button" class="sr-btn secondary" id="srPause">暂停</button>
      <button type="button" class="sr-btn" id="srClear">清屏</button>
      <button type="button" class="sr-btn secondary" id="srReset">重开</button>
    </div>
    <div class="sr-bottom sr-pill" id="srHint">拖拽移动 · 自动射击 · C 清屏</div>
    <div class="sr-menu" id="srMenu"></div>
    <div class="sr-modal" id="srModal" style="display:none"></div>
  `
  parent.style.position = 'relative'
  parent.appendChild(root)

  const elScore = root.querySelector('#srScore') as HTMLElement
  const elBest = root.querySelector('#srBest') as HTMLElement
  const elCombo = root.querySelector('#srCombo') as HTMLElement
  const elHp = root.querySelector('#srHp') as HTMLElement
  const elWave = root.querySelector('#srWave') as HTMLElement
  const elTier = root.querySelector('#srTier') as HTMLElement
  const elBuff = root.querySelector('#srBuff') as HTMLElement
  const elMenu = root.querySelector('#srMenu') as HTMLElement
  const elModal = root.querySelector('#srModal') as HTMLElement
  const elToast = root.querySelector('#srToast') as HTMLElement
  const btnPause = root.querySelector('#srPause') as HTMLButtonElement
  const btnClear = root.querySelector('#srClear') as HTMLButtonElement
  const btnReset = root.querySelector('#srReset') as HTMLButtonElement

  let toolbarHandler: ((action: HudToolbarAction) => void) | null = null
  let toastTimer = 0

  const bindBtn = (btn: HTMLButtonElement, action: HudToolbarAction) => {
    btn.addEventListener('click', () => toolbarHandler?.(action))
  }
  bindBtn(btnPause, 'pause')
  bindBtn(btnClear, 'clearScreen')
  bindBtn(btnReset, 'reset')

  const openModeMenu = (): Promise<PlayMode> =>
    new Promise(resolve => {
      elMenu.style.display = 'flex'
      elMenu.innerHTML = `
        <div class="sr-card">
          <h2 style="margin:0 0 8px;font-size:20px">天际狂潮：空战对决</h2>
          <p style="opacity:.85;font-size:14px;margin:0 0 16px">3D俯视角休闲射击 · 解压清屏 · 轻度竞技</p>
          <button type="button" class="sr-btn" id="srCasual" style="width:100%">休闲解压模式</button>
          <button type="button" class="sr-btn secondary" id="srCompete" style="width:100%;margin-top:10px">极限竞技模式</button>
        </div>
      `
      elMenu.querySelector('#srCasual')?.addEventListener('click', () => {
        elMenu.style.display = 'none'
        resolve('casual')
      })
      elMenu.querySelector('#srCompete')?.addEventListener('click', () => {
        elMenu.style.display = 'none'
        resolve('compete')
      })
    })

  return {
    root,
    openModeMenu,
    setPlaying(state, stats) {
      elScore.textContent = `得分 ${state.score}`
      elBest.textContent = `最高 ${stats.bestScore}`
      elCombo.textContent = `连击 ×${state.combo}`
      elHp.textContent = `生命 ♥${state.player.hp}${state.player.shield > 0 ? ` 盾${state.player.shield}` : ''}`
      elWave.textContent = `波次 ${state.wave}/6`
      elTier.textContent = `弹幕 Lv.${state.player.bulletTier}`
      const buffs: string[] = []
      if (state.player.slowMo > 0) buffs.push(`减速 ${state.player.slowMo.toFixed(0)}s`)
      if (state.clearScreenCd > 0) buffs.push(`清屏 ${state.clearScreenCd.toFixed(0)}s`)
      elBuff.textContent = buffs.length ? buffs.join(' · ') : '增益 —'
      btnClear.disabled = state.clearScreenCd > 0
      btnClear.style.opacity = state.clearScreenCd > 0 ? '0.5' : '1'
    },
    showWaveToast(wave, label) {
      elToast.textContent = `第 ${wave} 波 · ${label}`
      elToast.style.opacity = '1'
      window.clearTimeout(toastTimer)
      toastTimer = window.setTimeout(() => {
        elToast.style.opacity = '0'
      }, 2200)
    },
    showPause(paused) {
      btnPause.textContent = paused ? '继续' : '暂停'
    },
    showResult(opts) {
      return new Promise(resolve => {
        elModal.style.display = 'flex'
        const timeSec = (opts.elapsedMs / 1000).toFixed(1)
        const rating = opts.won
          ? opts.flawless
            ? 'S · 无伤通关'
            : 'A · 通关'
          : '继续加油'
        elModal.innerHTML = `
          <div class="sr-card">
            <h2 style="margin:0 0 6px">${opts.won ? '空域制霸！' : '战机撤离'}</h2>
            <p style="font-size:14px;opacity:.9">${rating}</p>
            <p style="font-size:15px;line-height:1.6">
              本局得分 <b>${opts.score}</b><br/>
              用时 ${timeSec}s · 最高连击 ${opts.maxCombo}<br/>
              历史最高 ${opts.stats.bestScore}<br/>
              ${opts.stats.bestClearMs > 0 ? `最快通关 ${(opts.stats.bestClearMs / 1000).toFixed(1)}s` : ''}
            </p>
            <button type="button" class="sr-btn" id="srRetry" style="width:100%">再来一局</button>
            <button type="button" class="sr-btn secondary" id="srExit" style="width:100%;margin-top:8px">返回大厅</button>
          </div>
        `
        elModal.querySelector('#srRetry')?.addEventListener('click', () => {
          elModal.style.display = 'none'
          resolve('retry')
        })
        elModal.querySelector('#srExit')?.addEventListener('click', () => {
          elModal.style.display = 'none'
          resolve('exit')
        })
      })
    },
    onToolbar(handler) {
      toolbarHandler = handler
    },
    dispose() {
      root.remove()
    },
  }
}