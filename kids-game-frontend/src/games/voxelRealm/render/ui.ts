import type { BlockType, CompeteState, PlayMode, WorldMeta } from '../types'
import { BIOME_LABELS, BLOCK_COLORS, BUILD_THEMES, COMPETE_KIND_LABEL, GAME_CONFIG } from '../config'

export type VoxelToolbarAction = 'toggleDay' | 'resetWorld' | 'saveExit'

export interface VoxelHudApi {
  root: HTMLElement
  setMode: (mode: PlayMode) => void
  setMeta: (meta: WorldMeta) => void
  setHotbar: (blocks: BlockType[], index: number) => void
  setStats: (score: number, placed: number, broken: number) => void
  setCompete: (compete: CompeteState | null) => void
  setHint: (text: string) => void
  openModeMenu: (seed: number) => Promise<{ mode: PlayMode; competeKind?: 'themeBuild' | 'terrainRace' }>
  onToolbar: (handler: (action: VoxelToolbarAction) => void) => void
  dispose: () => void
}

function blockSwatch(type: BlockType): string {
  const c = BLOCK_COLORS[type]
  const r = Math.round(c.r * 255)
  const g = Math.round(c.g * 255)
  const b = Math.round(c.b * 255)
  return `rgb(${r},${g},${b})`
}

export function createVoxelHud(parent: HTMLElement): VoxelHudApi {
  const root = document.createElement('div')
  root.className = 'voxel-realm-hud'
  root.innerHTML = `
    <style>
      .voxel-realm-hud {
        position: absolute; inset: 0; pointer-events: none; font-family: system-ui, sans-serif;
        color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,.65);
      }
      .voxel-realm-hud .vr-top {
        display: flex; justify-content: space-between; padding: 10px 12px; gap: 8px; flex-wrap: wrap;
      }
      .voxel-realm-hud .vr-pill {
        background: rgba(15,25,40,.72); border-radius: 10px; padding: 6px 10px; font-size: 13px;
      }
      .voxel-realm-hud .vr-center {
        position: absolute; left: 50%; bottom: 18%; transform: translateX(-50%);
        text-align: center; max-width: 90%;
      }
      .voxel-realm-hud .vr-hotbar {
        position: absolute; left: 50%; bottom: 8px; transform: translateX(-50%);
        display: flex; gap: 6px; padding: 6px 8px; background: rgba(10,15,25,.75);
        border-radius: 12px; pointer-events: auto;
      }
      .voxel-realm-hud .vr-slot {
        width: 36px; height: 36px; border-radius: 8px; border: 2px solid rgba(255,255,255,.25);
        box-sizing: border-box;
      }
      .voxel-realm-hud .vr-slot.active { border-color: #ffe566; box-shadow: 0 0 8px #ffe56688; }
      .voxel-realm-hud .vr-menu {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
        background: rgba(12,18,32,.92); border-radius: 16px; padding: 20px 24px;
        pointer-events: auto; min-width: 260px; text-align: center;
      }
      .voxel-realm-hud .vr-btn {
        display: block; width: 100%; margin: 8px 0; padding: 10px 14px;
        border: none; border-radius: 10px; font-size: 15px; cursor: pointer;
        background: linear-gradient(135deg,#5b8cff,#3d6be8); color: #fff;
      }
      .voxel-realm-hud .vr-btn.secondary { background: rgba(255,255,255,.12); }
      .voxel-realm-hud .vr-cross {
        position: absolute; left: 50%; top: 50%; width: 14px; height: 14px;
        transform: translate(-50%,-50%); opacity: .85;
      }
      .voxel-realm-hud .vr-cross::before, .voxel-realm-hud .vr-cross::after {
        content: ''; position: absolute; background: #fff; left: 50%; top: 50%;
      }
      .voxel-realm-hud .vr-cross::before { width: 2px; height: 14px; margin: -7px 0 0 -1px; }
      .voxel-realm-hud .vr-cross::after { width: 14px; height: 2px; margin: -1px 0 0 -7px; }
    </style>
    <div class="vr-top">
      <div class="vr-pill" id="vrBiome">生物群系</div>
      <div class="vr-pill" id="vrScore">积分 0</div>
      <div class="vr-pill" id="vrBlocks">放置 0 · 破坏 0</div>
      <div style="display:flex;gap:6px;pointer-events:auto;margin-left:auto">
        <button type="button" class="vr-btn secondary" id="vrDay" style="width:auto;margin:0;padding:6px 10px;font-size:12px">昼夜</button>
        <button type="button" class="vr-btn secondary" id="vrReset" style="width:auto;margin:0;padding:6px 10px;font-size:12px">重置</button>
        <button type="button" class="vr-btn secondary" id="vrSave" style="width:auto;margin:0;padding:6px 10px;font-size:12px">保存退出</button>
      </div>
    </div>
    <div class="vr-center vr-pill" id="vrHint">点击画面锁定鼠标 · WASD 移动 · 左键破坏 · 右键放置 · Q/E 切换方块</div>
    <div class="vr-pill" id="vrCompete" style="position:absolute;top:52px;left:12px;display:none"></div>
    <div class="vr-cross" aria-hidden="true"></div>
    <div class="vr-hotbar" id="vrHotbar"></div>
    <div class="vr-menu" id="vrMenu" style="display:none"></div>
  `
  parent.style.position = 'relative'
  parent.appendChild(root)

  const elBiome = root.querySelector('#vrBiome') as HTMLElement
  const elScore = root.querySelector('#vrScore') as HTMLElement
  const elBlocks = root.querySelector('#vrBlocks') as HTMLElement
  const elHint = root.querySelector('#vrHint') as HTMLElement
  const elCompete = root.querySelector('#vrCompete') as HTMLElement
  const elHotbar = root.querySelector('#vrHotbar') as HTMLElement
  const elMenu = root.querySelector('#vrMenu') as HTMLElement

  let menuResolver: ((mode: PlayMode, competeKind?: 'themeBuild' | 'terrainRace') => void) | null = null

  const showMenu = (seed: number) => {
    const theme = BUILD_THEMES[Math.abs(seed >> 3) % BUILD_THEMES.length]!
    elMenu.style.display = 'block'
    elMenu.innerHTML = `
      <h2 style="margin:0 0 8px;font-size:20px">方块幻境</h2>
      <p style="margin:0 0 12px;font-size:13px;opacity:.9">自由探索建造，或参加限时竞技</p>
      <button class="vr-btn" data-mode="casual">休闲探索</button>
      <button class="vr-btn secondary" data-mode="compete" data-kind="themeBuild">竞技 · ${theme.title}</button>
      <button class="vr-btn secondary" data-mode="compete" data-kind="terrainRace">竞技 · 地貌改造竞速</button>
    `
    elMenu.querySelectorAll('.vr-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = (btn as HTMLElement).dataset.mode as PlayMode
        const kind = (btn as HTMLElement).dataset.kind as 'themeBuild' | 'terrainRace' | undefined
        elMenu.style.display = 'none'
        menuResolver?.(mode, kind)
        menuResolver = null
      })
    })
  }

  const waitForMode = (): Promise<{ mode: PlayMode; competeKind?: 'themeBuild' | 'terrainRace' }> =>
    new Promise(resolve => {
      menuResolver = (mode, competeKind) => resolve({ mode, competeKind })
    })

  /** 先注册回调再展示菜单，避免极快点击丢失选择 */
  const openModeMenu = (seed: number) => {
    const p = waitForMode()
    showMenu(seed)
    return p
  }

  const setMode = (mode: PlayMode) => {
    void mode
  }

  const setMeta = (meta: WorldMeta) => {
    elBiome.textContent = `${BIOME_LABELS[meta.biome]} · ${meta.isNight ? '夜晚' : '白天'}`
  }

  const setHotbar = (blocks: BlockType[], index: number) => {
    elHotbar.innerHTML = blocks
      .map(
        (b, i) =>
          `<div class="vr-slot${i === index ? ' active' : ''}" title="${b}" style="background:${blockSwatch(b)}"></div>`,
      )
      .join('')
  }

  const setStats = (score: number, placed: number, broken: number) => {
    elScore.textContent = `积分 ${score}`
    elBlocks.textContent = `放置 ${placed} · 破坏 ${broken}`
  }

  const setCompete = (compete: CompeteState | null) => {
    if (!compete || !compete.running) {
      elCompete.style.display = 'none'
      return
    }
    elCompete.style.display = 'block'
    if (compete.kind === 'themeBuild') {
      const theme = BUILD_THEMES.find(t => t.id === compete.themeId)
      elCompete.textContent = `${COMPETE_KIND_LABEL.themeBuild} · ${theme?.title ?? ''} · ${Math.ceil(compete.timeLeft)}s · 已放 ${compete.placedCount}`
    } else {
      elCompete.textContent = `${COMPETE_KIND_LABEL.terrainRace} · 挖掘 ${compete.digCount}/${GAME_CONFIG.raceTargetDigs}`
    }
  }

  const setHint = (text: string) => {
    elHint.textContent = text
  }

  let toolbarHandler: ((action: VoxelToolbarAction) => void) | null = null
  const onToolbar = (handler: (action: VoxelToolbarAction) => void) => {
    toolbarHandler = handler
  }

  root.querySelector('#vrDay')?.addEventListener('click', () => toolbarHandler?.('toggleDay'))
  root.querySelector('#vrReset')?.addEventListener('click', () => toolbarHandler?.('resetWorld'))
  root.querySelector('#vrSave')?.addEventListener('click', () => toolbarHandler?.('saveExit'))

  const dispose = () => {
    root.remove()
  }

  return {
    root,
    setMode,
    setMeta,
    setHotbar,
    setStats,
    setCompete,
    setHint,
    openModeMenu,
    onToolbar,
    dispose,
  }
}