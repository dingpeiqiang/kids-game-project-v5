/**
 * 游戏容器布局元数据 —— 壳层统一适配。
 * 每个 gameId 必须且只能声明一种方向：portrait | landscape（禁止 auto / 双模式）。
 * 方向以 gameOrientation.ts 目录为准（操作体验评估）。
 */
import { GAME_ORIENTATION_CATALOG, assertGameOrientationCatalogComplete } from './gameOrientation'

export type GameOrientationMode = 'portrait' | 'landscape'

export interface GameLayoutConfig {
  designWidth: number
  designHeight: number
  /** 仅竖屏游戏：画布占可用高度比例 */
  portraitHeightRatio?: number
  orientation: GameOrientationMode
  /** Phaser / 自管 DOM，不由壳层创建 mainGameCanvas */
  externalCanvas?: boolean
  /** 仅横屏游戏：移动端竖屏持机时 CSS 旋转 + 提示 */
  forceLandscapeOnMobile?: boolean
  hidePlatformScore?: boolean
  hidePlatformPause?: boolean
  compactFooter?: boolean
  showPowerupSlot?: boolean
}

const DEFAULT_LAYOUT: GameLayoutConfig = {
  designWidth: 400,
  designHeight: 600,
  portraitHeightRatio: 0.88,
  orientation: 'portrait',
}

/** 按 gameId 覆盖默认布局；orientation 须与 GAME_ORIENTATION_CATALOG 一致 */
const LAYOUT_OVERRIDES: Record<string, Partial<GameLayoutConfig>> = {
  // —— 竖屏（显式声明，避免仅依赖 DEFAULT）——
  eliminate: { orientation: 'portrait' },
  tetris: { orientation: 'portrait' },
  jewelMatch: { orientation: 'portrait' },
  match3: { orientation: 'portrait' },
  bubbleShooter: { orientation: 'portrait' },
  sort: { orientation: 'portrait' },
  memoryMatch: { orientation: 'portrait' },
  colorTap: { orientation: 'portrait' },
  whackMole: { orientation: 'portrait' },
  pop: { orientation: 'portrait' },
  fruitSlice: { orientation: 'portrait' },
  cookieCut: { orientation: 'portrait' },
  dodge: { orientation: 'portrait' },
  neonRun: { orientation: 'portrait' },
  slimeJump: { orientation: 'portrait' },
  snake: { orientation: 'portrait' },
  starCatcher: { orientation: 'portrait' },
  bouncePath: { orientation: 'portrait' },
  stack: { orientation: 'portrait' },

  contraRpg: {
    designWidth: 680,
    designHeight: 320,
    orientation: 'landscape',
    forceLandscapeOnMobile: true,
    hidePlatformScore: true,
  },
  wangzheRpg: {
    designWidth: 660,
    designHeight: 360,
    orientation: 'landscape',
    forceLandscapeOnMobile: true,
    hidePlatformScore: true,
  },
  plantsVsZombies: {
    designWidth: 720,
    designHeight: 600,
    orientation: 'landscape',
    forceLandscapeOnMobile: true,
    hidePlatformScore: true,
  },
  dnfRpg: {
    designWidth: 880,
    designHeight: 440,
    orientation: 'landscape',
    forceLandscapeOnMobile: true,
    hidePlatformScore: true,
  },
  racingRun: { designHeight: 720, portraitHeightRatio: 0.95, orientation: 'portrait' },
  cuteTankBattle: { designWidth: 750, designHeight: 1334, orientation: 'portrait' },
  superMario: {
    designWidth: 960,
    designHeight: 540,
    orientation: 'landscape',
    forceLandscapeOnMobile: true,
    hidePlatformScore: true,
  },
  spaceShooter: { externalCanvas: true, hidePlatformScore: true, orientation: 'portrait' },
  kingBaby: {
    designWidth: 1280,
    designHeight: 720,
    orientation: 'landscape',
    forceLandscapeOnMobile: true,
    hidePlatformScore: true,
  },
  cloudBallRush3d: {
    designWidth: 960,
    designHeight: 540,
    orientation: 'landscape',
    externalCanvas: true,
    hidePlatformScore: true,
    hidePlatformPause: true,
    compactFooter: true,
    forceLandscapeOnMobile: true,
  },
  voxelRealm: {
    designWidth: 960,
    designHeight: 540,
    orientation: 'landscape',
    externalCanvas: true,
    hidePlatformScore: true,
    hidePlatformPause: true,
    compactFooter: true,
    forceLandscapeOnMobile: true,
  },
  dragonShooter: {
    designWidth: 400,
    designHeight: 600,
    orientation: 'portrait',
    externalCanvas: true,
    hidePlatformScore: true,
  },
  beatDragon: {
    designWidth: 400,
    designHeight: 600,
    orientation: 'portrait',
    hidePlatformScore: true,
  },
  rpgShooterTD: {
    designWidth: 400,
    designHeight: 600,
    orientation: 'portrait',
    externalCanvas: true,
    hidePlatformScore: true,
  },
  rpgShooter: { externalCanvas: true, hidePlatformScore: true, orientation: 'portrait' },
  happyDefense: {
    designWidth: 960,
    designHeight: 540,
    orientation: 'landscape',
    externalCanvas: true,
    hidePlatformScore: true,
    hidePlatformPause: true,
    compactFooter: true,
    forceLandscapeOnMobile: true,
  },
  plantZombieDefense: {
    designWidth: 960,
    designHeight: 540,
    orientation: 'landscape',
    externalCanvas: true,
    hidePlatformScore: true,
    hidePlatformPause: true,
    compactFooter: true,
    forceLandscapeOnMobile: true,
  },
  plantZombieDefense2d: {
    designWidth: 960,
    designHeight: 540,
    orientation: 'landscape',
    forceLandscapeOnMobile: true,
    hidePlatformScore: true,
    hidePlatformPause: true,
    compactFooter: true,
  },
  skyFrenzy: {
    designWidth: 960,
    designHeight: 540,
    orientation: 'landscape',
    externalCanvas: true,
    hidePlatformScore: true,
    hidePlatformPause: true,
    compactFooter: true,
    forceLandscapeOnMobile: true,
  },
  skyRush3d: {
    designWidth: 960,
    designHeight: 540,
    orientation: 'landscape',
    externalCanvas: true,
    hidePlatformScore: true,
    hidePlatformPause: true,
    compactFooter: true,
    forceLandscapeOnMobile: true,
  },
  towerDefense: { hidePlatformScore: true, orientation: 'portrait' },
}

export function getGameLayoutConfig(
  gameId: string,
  registrationLayout?: Partial<GameLayoutConfig>,
): GameLayoutConfig {
  const catalog = GAME_ORIENTATION_CATALOG[gameId]
  const base = {
    ...DEFAULT_LAYOUT,
    ...(catalog ? { orientation: catalog.orientation } : {}),
    ...LAYOUT_OVERRIDES[gameId],
    ...registrationLayout,
  }
  if (import.meta.env?.DEV && catalog && base.orientation !== catalog.orientation) {
    console.warn(
      `[gameLayout] ${gameId}: layout orientation=${base.orientation} 与目录 ${catalog.orientation} 不一致`,
    )
  }
  if (base.orientation === 'landscape') {
    base.forceLandscapeOnMobile = base.forceLandscapeOnMobile ?? true
    if (base.designWidth < base.designHeight) {
      console.warn(
        `[gameLayout] ${gameId}: orientation=landscape 但 designWidth < designHeight，请核对设计分辨率`,
      )
    }
  } else {
    base.forceLandscapeOnMobile = false
  }
  return base as GameLayoutConfig
}

export function isLandscapeLayout(cfg: GameLayoutConfig): boolean {
  return cfg.orientation === 'landscape'
}

export function isPortraitLayout(cfg: GameLayoutConfig): boolean {
  return cfg.orientation === 'portrait'
}