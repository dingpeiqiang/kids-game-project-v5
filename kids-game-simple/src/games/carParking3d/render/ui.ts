import type { CameraMode, GameState } from '../types';
import { loadPlayerData } from '../logic/scoreSystem';

const STYLE_ID = 'car-parking3d-ui-styles';

export function injectParkingStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .cp3d-hud {
      position: absolute; left: 0; right: 0; top: 0;
      padding: 10px 12px;
      display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between;
      pointer-events: none; z-index: 20;
      font-family: system-ui, sans-serif; color: #fff;
      text-shadow: 0 1px 3px rgba(0,0,0,.6);
    }
    .cp3d-hud-bar {
      position: absolute; left: 12px; right: 12px; top: 52px; z-index: 19; pointer-events: none;
    }
    .cp3d-meter-label { font-size: 11px; color: rgba(255,255,255,.85); margin-bottom: 4px; }
    .cp3d-meter-track {
      height: 6px; background: rgba(0,0,0,.4); border-radius: 6px; overflow: hidden; margin-bottom: 6px;
    }
    .cp3d-meter-fill {
      height: 100%; width: 0%; background: linear-gradient(90deg,#2ecc71,#3498db);
      transition: width .2s ease;
    }
    .cp3d-meter-fill.warn { background: linear-gradient(90deg,#f39c12,#e74c3c); }
    .cp3d-hud-pill {
      background: rgba(0,0,0,.5); border-radius: 10px; padding: 6px 10px; font-size: 13px;
      backdrop-filter: blur(6px);
    }
    .cp3d-hud-pill b { color: #7ec8ff; }
    .cp3d-hud-pill.time-warn { background: rgba(180,40,40,.65); animation: cp3d-pulse 1s infinite; }
    @keyframes cp3d-pulse { 50% { opacity: .85; } }
    .cp3d-hud-actions { display: flex; gap: 8px; pointer-events: auto; }
    .cp3d-btn {
      border: none; border-radius: 10px; padding: 8px 12px;
      background: rgba(52,152,219,.85); color: #fff; font-size: 12px; cursor: pointer;
    }
    .cp3d-btn:active { transform: scale(0.96); }
    .cp3d-btn.secondary { background: rgba(80,80,80,.75); }
    .cp3d-toast {
      position: absolute; left: 50%; top: 42%; transform: translate(-50%,-50%);
      background: rgba(0,0,0,.72); padding: 10px 16px; border-radius: 12px;
      font-size: 14px; color: #fff; z-index: 25; pointer-events: none; opacity: 0;
      transition: opacity .25s;
    }
    .cp3d-toast.show { opacity: 1; }
    .cp3d-modal-wrap {
      position: absolute; inset: 0; display: none; align-items: center; justify-content: center;
      background: rgba(0,0,0,.55); z-index: 30; padding: 16px;
    }
    .cp3d-modal-wrap.show { display: flex; }
    .cp3d-modal {
      background: linear-gradient(160deg,#fff,#f0f4f8); color: #222;
      border-radius: 16px; max-width: 320px; width: 100%; padding: 20px; text-align: center;
      box-shadow: 0 12px 40px rgba(0,0,0,.25);
    }
    .cp3d-modal h3 { margin: 0 0 8px; font-size: 18px; }
    .cp3d-modal p { margin: 6px 0; font-size: 13px; color: #555; }
    .cp3d-modal .score-big { font-size: 36px; font-weight: 800; color: #2980b9; margin: 12px 0; }
    .cp3d-modal .btn-row { display: flex; gap: 10px; margin-top: 16px; }
    .cp3d-modal .btn-row button { flex: 1; padding: 10px; border: none; border-radius: 10px; cursor: pointer; }
    .cp3d-modal .primary { background: #3498db; color: #fff; }
    .cp3d-modal .ghost { background: #e0e6ed; color: #333; }
    .cp3d-touch {
      position: absolute; inset: 0; pointer-events: none; z-index: 15;
    }
    .cp3d-dpad {
      position: absolute; left: 12px; bottom: 16px; width: 140px; height: 140px;
      pointer-events: auto; display: grid; grid-template-columns: repeat(3,1fr); grid-template-rows: repeat(3,1fr); gap: 4px;
    }
    .cp3d-dpad button {
      border: none; border-radius: 10px; background: rgba(255,255,255,.25); color: #fff; font-size: 18px;
      touch-action: manipulation;
    }
    .cp3d-dpad .empty { background: transparent; pointer-events: none; }
    .cp3d-touch-right {
      position: absolute; right: 12px; bottom: 16px; display: flex; flex-direction: column; gap: 8px;
      pointer-events: auto;
    }
    .cp3d-touch-right button {
      width: 56px; height: 56px; border: none; border-radius: 50%;
      background: rgba(255,255,255,.28); color: #fff; font-size: 20px;
    }
    @media (min-width: 769px) {
      .cp3d-touch { display: none; }
    }
    .cp3d-guide {
      position: absolute; inset: 0; z-index: 40; display: none; align-items: center; justify-content: center;
      background: rgba(0,0,0,.6); padding: 20px;
    }
    .cp3d-guide.show { display: flex; }
    .cp3d-guide-card {
      background: #fff; border-radius: 14px; padding: 18px; max-width: 360px; font-size: 13px; line-height: 1.5;
    }
    .cp3d-guide-card h4 { margin: 0 0 10px; }
    .cp3d-guide-card button { margin-top: 12px; width: 100%; padding: 10px; border: none; border-radius: 10px; background: #3498db; color: #fff; }
  `;
  document.head.appendChild(style);
}

export interface ParkingUI {
  root: HTMLElement;
  updateHud(
    state: GameState,
    levelName: string,
    cameraMode: CameraMode,
    liveParkingScore: number,
    parkingHint?: { center: number; angle: number; inside: boolean }
  ): void;
  showToast(msg: string, ms?: number): void;
  showGuide(onClose: () => void): void;
  showResult(opts: {
    title: string;
    score: number;
    collisions: number;
    isPerfect: boolean;
    isNewBest: boolean;
    hasNext: boolean;
    onNext: () => void;
    onRetry: () => void;
    onExit: () => void;
  }): void;
  hideResult(): void;
  setMobileInput(cb: (input: Partial<{ throttle: number; steering: number; brake: boolean }>) => void): void;
  onViewReset(cb: () => void, onViewCycle: () => void): void;
  destroy(): void;
}

export function createParkingUI(container: HTMLDivElement): ParkingUI {
  injectParkingStyles();
  container.style.position = 'relative';

  const hud = document.createElement('div');
  hud.className = 'cp3d-hud';
  hud.innerHTML = `
    <div class="cp3d-hud-left">
      <span class="cp3d-hud-pill" id="cp3dLevel">关卡</span>
      <span class="cp3d-hud-pill" id="cp3dTime">时间</span>
      <span class="cp3d-hud-pill" id="cp3dColl">碰撞</span>
      <span class="cp3d-hud-pill" id="cp3dScore">得分</span>
      <span class="cp3d-hud-pill" id="cp3dBest">最佳</span>
      <span class="cp3d-hud-pill" id="cp3dCam">视角</span>
    </div>
    <div class="cp3d-hud-actions">
      <button type="button" class="cp3d-btn secondary" id="cp3dBtnReset">重置 R</button>
      <button type="button" class="cp3d-btn" id="cp3dBtnCam">视角 C</button>
    </div>
  `;

  const toast = document.createElement('div');
  toast.className = 'cp3d-toast';

  const modalWrap = document.createElement('div');
  modalWrap.className = 'cp3d-modal-wrap';
  modalWrap.innerHTML = `
    <div class="cp3d-modal">
      <h3 id="cp3dModalTitle">停车完成</h3>
      <div class="score-big" id="cp3dModalScore">0</div>
      <p id="cp3dModalSub"></p>
      <div class="btn-row">
        <button type="button" class="ghost" id="cp3dModalRetry">重试</button>
        <button type="button" class="primary" id="cp3dModalNext">下一关</button>
      </div>
      <button type="button" class="ghost" id="cp3dModalExit" style="margin-top:10px;width:100%">返回大厅</button>
    </div>
  `;

  const guide = document.createElement('div');
  guide.className = 'cp3d-guide';
  guide.innerHTML = `
    <div class="cp3d-guide-card">
      <h4>🚗 3D精准停车大师</h4>
      <p>W/S 前进后退 · A/D 转向 · 空格刹车 · C 切换视角 · R 重置</p>
      <p>停稳后自动判定入位。碰撞扣10分，3次失败。90分以上完美通关！</p>
      <button type="button" id="cp3dGuideOk">开始驾驶</button>
    </div>
  `;

  const touch = document.createElement('div');
  touch.className = 'cp3d-touch';
  touch.innerHTML = `
    <div class="cp3d-dpad">
      <div class="empty"></div>
      <button type="button" data-act="fwd">▲</button>
      <div class="empty"></div>
      <button type="button" data-act="steer-left">◀</button>
      <button type="button" data-act="brake">⏹</button>
      <button type="button" data-act="steer-right">▶</button>
      <div class="empty"></div>
      <button type="button" data-act="rev">▼</button>
      <div class="empty"></div>
    </div>
    <div class="cp3d-touch-right">
      <button type="button" data-act="cam">👁</button>
      <button type="button" data-act="reset">↺</button>
    </div>
  `;

  const meterBar = document.createElement('div');
  meterBar.className = 'cp3d-hud-bar';
  meterBar.innerHTML = `
    <div class="cp3d-meter-label" id="cp3dParkLabel">停车精度</div>
    <div class="cp3d-meter-track"><div class="cp3d-meter-fill" id="cp3dParkFill"></div></div>
    <div class="cp3d-meter-label" id="cp3dParkDetail">—</div>
  `;

  container.appendChild(hud);
  container.appendChild(meterBar);
  container.appendChild(toast);
  container.appendChild(modalWrap);
  container.appendChild(guide);
  container.appendChild(touch);

  let mobileCb: ((input: Partial<{ throttle: number; steering: number; brake: boolean }>) => void) | null = null;
  let resetCb: (() => void) | null = null;
  let camCb: (() => void) | null = null;
  let toastTimer = 0;

  const camLabels: Record<CameraMode, string> = {
    follow: '跟随',
    top: '俯视',
    rear: '后视',
  };

  const setTouchAct = (act: string, active: boolean) => {
    if (!mobileCb) return;
    switch (act) {
      case 'fwd':
        mobileCb({ throttle: active ? 1 : 0 });
        break;
      case 'rev':
        mobileCb({ throttle: active ? -1 : 0 });
        break;
      case 'steer-left':
        mobileCb({ steering: active ? -1 : 0 });
        break;
      case 'steer-right':
        mobileCb({ steering: active ? 1 : 0 });
        break;
      case 'brake':
        mobileCb({ brake: active });
        break;
      default:
        break;
    }
  };

  touch.querySelectorAll('button[data-act]').forEach((btn) => {
    const act = (btn as HTMLButtonElement).dataset.act!;
    if (act === 'cam') {
      btn.addEventListener('click', () => camCb?.());
      return;
    }
    if (act === 'reset') {
      btn.addEventListener('click', () => resetCb?.());
      return;
    }
    const down = (e: Event) => {
      e.preventDefault();
      setTouchAct(act, true);
    };
    const up = (e: Event) => {
      e.preventDefault();
      setTouchAct(act, false);
    };
    btn.addEventListener('touchstart', down);
    btn.addEventListener('touchend', up);
    btn.addEventListener('touchcancel', up);
    btn.addEventListener('mousedown', down);
    btn.addEventListener('mouseup', up);
    btn.addEventListener('mouseleave', up);
  });

  document.getElementById('cp3dBtnReset')?.addEventListener('click', () => resetCb?.());
  document.getElementById('cp3dBtnCam')?.addEventListener('click', () => camCb?.());

  return {
    root: container,
    updateHud(state, levelName, cameraMode, liveParkingScore, parkingHint) {
      const elLevel = document.getElementById('cp3dLevel');
      const elTime = document.getElementById('cp3dTime');
      const elColl = document.getElementById('cp3dColl');
      const elScore = document.getElementById('cp3dScore');
      const elBest = document.getElementById('cp3dBest');
      const elCam = document.getElementById('cp3dCam');
      const fill = document.getElementById('cp3dParkFill');
      const detail = document.getElementById('cp3dParkDetail');
      const data = loadPlayerData();
      const displayScore = state.isPlaying ? Math.max(state.score, liveParkingScore) : state.score;
      if (elLevel) elLevel.innerHTML = `<b>关卡</b> ${state.currentLevel} ${levelName}`;
      const tLeft = Math.max(0, Math.ceil(state.timeRemaining));
      if (elTime) {
        elTime.innerHTML = `<b>时间</b> ${tLeft}s`;
        elTime.classList.toggle('time-warn', tLeft > 0 && tLeft <= 15);
      }
      if (elColl) elColl.innerHTML = `<b>碰撞</b> ${state.collisions}/${state.maxCollisions}`;
      if (elScore) elScore.innerHTML = `<b>得分</b> ${displayScore}`;
      if (elBest) elBest.innerHTML = `<b>最佳</b> ${data.levelBests[state.currentLevel] ?? '-'}`;
      if (elCam) elCam.innerHTML = `<b>视角</b> ${camLabels[cameraMode]}`;
      if (fill && parkingHint) {
        const pct = Math.min(100, Math.max(0, liveParkingScore));
        fill.style.width = `${pct}%`;
        fill.classList.toggle('warn', !parkingHint.inside);
        const ang = Math.round(parkingHint.angle * 45);
        const ctr = Math.round(parkingHint.center * 100);
        if (detail) {
          detail.textContent = parkingHint.inside
            ? `入位良好 · 角度偏差约 ${ang}° · 中心偏差 ${ctr}%`
            : `未完全入位 · 请调整车身`;
        }
      }
    },
    showToast(msg, ms = 1600) {
      toast.textContent = msg;
      toast.classList.add('show');
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => toast.classList.remove('show'), ms);
    },
    showGuide(onClose) {
      guide.classList.add('show');
      const ok = document.getElementById('cp3dGuideOk');
      const handler = () => {
        guide.classList.remove('show');
        ok?.removeEventListener('click', handler);
        onClose();
      };
      ok?.addEventListener('click', handler);
    },
    showResult(opts) {
      document.getElementById('cp3dModalTitle')!.textContent = opts.title;
      document.getElementById('cp3dModalScore')!.textContent = String(opts.score);
      const sub = opts.isPerfect ? '⭐ 完美停车！' : opts.isNewBest ? '🏆 刷新本关最佳！' : `碰撞 ${opts.collisions} 次`;
      document.getElementById('cp3dModalSub')!.textContent = sub;
      const nextBtn = document.getElementById('cp3dModalNext') as HTMLButtonElement;
      nextBtn.style.display = opts.hasNext ? 'block' : 'none';
      modalWrap.classList.add('show');
      const retry = document.getElementById('cp3dModalRetry')!;
      const next = document.getElementById('cp3dModalNext')!;
      const exit = document.getElementById('cp3dModalExit')!;
      const once = (el: HTMLElement, fn: () => void) => {
        const h = () => {
          el.removeEventListener('click', h);
          fn();
        };
        el.addEventListener('click', h);
      };
      once(retry, () => {
        modalWrap.classList.remove('show');
        opts.onRetry();
      });
      once(next, () => {
        modalWrap.classList.remove('show');
        opts.onNext();
      });
      once(exit, () => {
        modalWrap.classList.remove('show');
        opts.onExit();
      });
    },
    hideResult() {
      modalWrap.classList.remove('show');
    },
    setMobileInput(cb) {
      mobileCb = cb;
    },
    onViewReset(cb, onViewCycle) {
      resetCb = cb;
      camCb = onViewCycle;
    },
    destroy() {
      hud.remove();
      meterBar.remove();
      toast.remove();
      modalWrap.remove();
      guide.remove();
      touch.remove();
    },
  };
}