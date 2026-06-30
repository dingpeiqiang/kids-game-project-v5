import { LEVELS } from '../config'
import type { GameState, PlayMode, RunStats } from '../types'

export type HudToolbarAction = 'pause' | 'reset' | 'exit' | 'jump'

export interface CloudBallHudApi {
  root: HTMLElement
  openStartMenu: () => Promise<{ mode: PlayMode; levelIndex: number }>
  setPlaying: (state: GameState, stats: RunStats) => void
  showPause: (paused: boolean) => void
  showFallToast: () => void
  showLevelResult: (opts: {
    state: GameState
    stats: RunStats
    stars: 0 | 1 | 2 | 3
    bestMs: number | null
  }) => Promise<'next' | 'retry' | 'levels' | 'exit'>
  onToolbar: (handler: (action: HudToolbarAction) => void) => void
  dispose: () => void
}

export function createCloudBallHud(parent: HTMLElement): CloudBallHudApi {
  const root = document.createElement('div')
  root.className = 'cbr-hud'
  root.innerHTML = `
    <style>
      .cbr-hud { position:absolute; inset:0; pointer-events:none; font-family:system-ui,sans-serif; color:#fff; text-shadow:0 1px 3px rgba(0,0,0,.45); }
      .cbr-top { display:flex; flex-wrap:wrap; gap:8px; padding:10px 12px; }
      .cbr-pill { background:rgba(25,45,70,.75); border-radius:10px; padding:6px 12px; font-size:13px; }
      .cbr-side { position:absolute; right:10px; top:50%; transform:translateY(-50%); display:flex; flex-direction:column; gap:8px; pointer-events:auto; }
      .cbr-btn { border:none; border-radius:12px; padding:10px 14px; font-size:13px; cursor:pointer;
        background:linear-gradient(145deg,#6ec8ff,#4a9ae8); color:#fff; box-shadow:0 2px 8px rgba(0,0,0,.2); }
      .cbr-btn.secondary { background:rgba(255,255,255,.18); }
      .cbr-bottom { position:absolute; left:12px; bottom:12px; pointer-events:auto; }
      .cbr-jump { width:64px; height:64px; border-radius:50%; font-size:14px; }
      .cbr-overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
        background:rgba(12,28,48,.55); pointer-events:auto; }
      .cbr-card { background:rgba(18,36,58,.94); border-radius:18px; padding:22px; max-width:340px; width:92%; text-align:center; }
      .cbr-levels { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:12px 0; }
      .cbr-lv { padding:10px; border-radius:10px; border:none; cursor:pointer; background:rgba(255,255,255,.12); color:#fff; font-size:13px; }
      .cbr-toast { position:absolute; top:22%; left:50%; transform:translateX(-50%); background:rgba(255,200,120,.92);
        color:#1a2a40; padding:8px 16px; border-radius:10px; font-weight:600; opacity:0; transition:opacity .2s; }
    </style>
    <div class="cbr-top">
      <div class="cbr-pill" id="cbrLevel">关卡 1</div>
      <div class="cbr-pill" id="cbrTime">用时 0.0s</div>
      <div class="cbr-pill" id="cbrStars">星光 0/0</div>
      <div class="cbr-pill" id="cbrScore">得分 0</div>
      <div class="cbr-pill" id="cbrBest">最佳 —</div>
      <div class="cbr-pill" id="cbrBuff">增益 —</div>
    </div>
    <div class="cbr-toast" id="cbrToast"></div>
    <div class="cbr-side">
      <button type="button" class="cbr-btn secondary" id="cbrPause">暂停</button>
      <button type="button" class="cbr-btn secondary" id="cbrReset">重置</button>
      <button type="button" class="cbr-btn secondary" id="cbrExit">选关</button>
    </div>
    <div class="cbr-bottom">
      <button type="button" class="cbr-btn cbr-jump" id="cbrJump">跳</button>
    </div>
    <div class="cbr-overlay" id="cbrMenu"></div>
    <div class="cbr-overlay" id="cbrModal" style="display:none"></div>
  `
  parent.style.position = 'relative'
  parent.appendChild(root)

  const elLevel = root.querySelector('#cbrLevel') as HTMLElement
  const elTime = root.querySelector('#cbrTime') as HTMLElement
  const elStars = root.querySelector('#cbrStars') as HTMLElement
  const elScore = root.querySelector('#cbrScore') as HTMLElement
  const elBest = root.querySelector('#cbrBest') as HTMLElement
  const elBuff = root.querySelector('#cbrBuff') as HTMLElement
  const elMenu = root.querySelector('#cbrMenu') as HTMLElement
  const elModal = root.querySelector('#cbrModal') as HTMLElement
  const elToast = root.querySelector('#cbrToast') as HTMLElement

  let toolbarHandler: ((action: HudToolbarAction) => void) | null = null
  let toastTimer = 0

  const bind = (id: string, action: HudToolbarAction) => {
    root.querySelector(id)?.addEventListener('click', () => toolbarHandler?.(action))
  }
  bind('#cbrPause', 'pause')
  bind('#cbrReset', 'reset')
  bind('#cbrExit', 'exit')
  bind('#cbrJump', 'jump')

  const openStartMenu = (): Promise<{ mode: PlayMode; levelIndex: number }> =>
    new Promise(resolve => {
      elMenu.style.display = 'flex'
      const levelBtns = LEVELS.map(
        (lv, i) =>
          `<button type="button" class="cbr-lv" data-lv="${i}">${lv.id}. ${lv.name}</button>`,
      ).join('')
      elMenu.innerHTML = `
        <div class="cbr-card">
          <h2 style="margin:0 0 8px;font-size:20px">云端滚球大冒险</h2>
          <p style="opacity:.85;font-size:14px;margin:0 0 12px">3D平衡滚球 · 治愈解压 · 轻度竞速</p>
          <p style="font-size:13px;margin:0 0 8px">选择模式</p>
          <button type="button" class="cbr-btn" id="cbrCasual" style="width:100%">休闲解压</button>
          <button type="button" class="cbr-btn secondary" id="cbrCompete" style="width:100%;margin-top:8px">极限竞速</button>
          <p style="font-size:13px;margin:16px 0 8px">选择关卡</p>
          <div class="cbr-levels">${levelBtns}</div>
        </div>
      `
      let mode: PlayMode = 'casual'
      let levelIndex = 0
      elMenu.querySelector('#cbrCasual')?.addEventListener('click', () => {
        mode = 'casual'
      })
      elMenu.querySelector('#cbrCompete')?.addEventListener('click', () => {
        mode = 'compete'
      })
      elMenu.querySelectorAll('.cbr-lv').forEach(btn => {
        btn.addEventListener('click', () => {
          levelIndex = Number((btn as HTMLElement).dataset.lv ?? 0)
          elMenu.style.display = 'none'
          resolve({ mode, levelIndex })
        })
      })
    })

  return {
    root,
    openStartMenu,
    setPlaying(state, stats) {
      const def = LEVELS[state.levelIndex]
      elLevel.textContent = `关卡 ${def?.id ?? state.levelIndex + 1} · ${def?.name ?? ''}`
      elTime.textContent = `用时 ${(state.elapsedMs / 1000).toFixed(1)}s`
      elStars.textContent = `星光 ${state.levelStarsCollected}/${state.levelStarTotal}`
      elScore.textContent = `得分 ${state.sessionScore}`
      const best = stats.levelBestMs[def?.id ?? state.levelIndex + 1]
      elBest.textContent = best != null ? `最佳 ${(best / 1000).toFixed(1)}s` : '最佳 —'
      const buffs: string[] = []
      if (state.ball.shieldT > 0) buffs.push(`护盾 ${state.ball.shieldT.toFixed(0)}s`)
      if (state.ball.speedBoostT > 0) buffs.push(`冲刺 ${state.ball.speedBoostT.toFixed(0)}s`)
      if (state.ball.guideT > 0) buffs.push(`导航 ${state.ball.guideT.toFixed(0)}s`)
      elBuff.textContent = buffs.length ? buffs.join(' · ') : '增益 —'
    },
    showPause(paused) {
      elToast.textContent = paused ? '已暂停' : ''
      elToast.style.opacity = paused ? '1' : '0'
    },
    showFallToast() {
      window.clearTimeout(toastTimer)
      elToast.textContent = '坠落啦～已免费重试'
      elToast.style.opacity = '1'
      toastTimer = window.setTimeout(() => {
        elToast.style.opacity = '0'
      }, 1200)
    },
    showLevelResult(opts) {
      const { state, stats, stars, bestMs } = opts
      const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars)
      const flawless = state.flawlessRun && state.falls === 0
      return new Promise(resolve => {
        elModal.style.display = 'flex'
        const hasNext = state.levelIndex < LEVELS.length - 1
        elModal.innerHTML = `
          <div class="cbr-card">
            <h2 style="margin:0 0 8px">关卡通过！</h2>
            <p style="font-size:28px;margin:8px 0">${starStr}</p>
            <p>用时 ${(state.elapsedMs / 1000).toFixed(2)}s · 得分 ${state.sessionScore}</p>
            <p style="opacity:.85;font-size:13px">${flawless ? '完美闯关！' : `坠落 ${state.falls} 次`}</p>
            <p style="opacity:.85;font-size:13px">累计星光 ${stats.bestTotalStars} · 完美 ${stats.perfectClears} 次</p>
            ${bestMs != null ? `<p style="font-size:12px;opacity:.7">本关最佳 ${(bestMs / 1000).toFixed(2)}s</p>` : ''}
            ${hasNext ? '<button type="button" class="cbr-btn" id="cbrNext" style="width:100%;margin-top:10px">下一关</button>' : ''}
            <button type="button" class="cbr-btn secondary" id="cbrRetry" style="width:100%;margin-top:8px">再挑战</button>
            <button type="button" class="cbr-btn secondary" id="cbrLevels" style="width:100%;margin-top:8px">选关</button>
            <button type="button" class="cbr-btn secondary" id="cbrLobby" style="width:100%;margin-top:8px">返回大厅</button>
          </div>
        `
        elModal.querySelector('#cbrNext')?.addEventListener('click', () => {
          elModal.style.display = 'none'
          resolve('next')
        })
        elModal.querySelector('#cbrRetry')?.addEventListener('click', () => {
          elModal.style.display = 'none'
          resolve('retry')
        })
        elModal.querySelector('#cbrLevels')?.addEventListener('click', () => {
          elModal.style.display = 'none'
          resolve('levels')
        })
        elModal.querySelector('#cbrLobby')?.addEventListener('click', () => {
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