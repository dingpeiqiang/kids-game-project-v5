/**
 * 游戏容器布局元数据 —— 壳层统一适配，各游戏只声明设计分辨率与横竖屏策略
 */
export type GameOrientationMode = 'portrait' | 'landscape' | 'auto'

export interface GameLayoutConfig {
  designWidth: number
  designHeight: number
  /** 竖屏时画布占可用高度比例 */
  portraitHeightRatio?: number
  orientation: GameOrientationMode
  /** Phaser / 自管 DOM，不由壳层创建 mainGameCanvas */
  externalCanvas?: boolean
  /** 横屏时强制旋转（移动端） */
  forceLandscapeOnMobile?: boolean
  /** 游戏自绘 HUD 时隐藏壳层顶栏得分 */
  hidePlatformScore?: boolean
  /** 游戏内已有暂停菜单时隐藏壳层暂停按钮（返回仍保留） */
  hidePlatformPause?: boolean
  /** 横屏/3D 时底栏更矮（仅当游戏已启用道具挂载时有效） */
  compactFooter?: boolean
  /**
   * 是否在壳层预留底栏挂载点（默认 false）。
   * 道具属于游戏玩法，推荐在 canvas 内自绘；仅遗留 HTML 道具栏游戏可设为 true。
   */
  showPowerupSlot?: boolean
}

const DEFAULT_LAYOUT: GameLayoutConfig = {
  designWidth: 400,
  designHeight: 600,
  portraitHeightRatio: 0.88,
  orientation: 'portrait',
}

/** 按 gameId 覆盖默认布局（从 gameSession 历史逻辑收敛） */
const LAYOUT_OVERRIDES: Record<string, Partial<GameLayoutConfig>> = {
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
  racingRun: { designHeight: 720, portraitHeightRatio: 0.95 },
  cuteTankBattle: { designWidth: 750, designHeight: 1334 },
  spaceShooter: { externalCanvas: true, hidePlatformScore: true },
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
    externalCanvas: true,
    hidePlatformScore: true,
  },
  beatDragon: {
    designWidth: 400,
    designHeight: 600,
    externalCanvas: true,
    hidePlatformScore: true,
  },
  parkingLot: {
    designWidth: 400,
    designHeight: 600,
    externalCanvas: true,
    hidePlatformScore: true,
  },
  rpgShooterTD: {
    designWidth: 400,
    designHeight: 600,
    externalCanvas: true,
    hidePlatformScore: true,
  },
  rpgShooter: { externalCanvas: true, hidePlatformScore: true },
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
  towerDefense: { hidePlatformScore: true },
}

export function getGameLayoutConfig(gameId: string, registrationLayout?: Partial<GameLayoutConfig>): GameLayoutConfig {
  const base = { ...DEFAULT_LAYOUT, ...LAYOUT_OVERRIDES[gameId], ...registrationLayout }
  if (base.orientation === 'landscape') {
    base.forceLandscapeOnMobile = base.forceLandscapeOnMobile ?? true
  }
  return base as GameLayoutConfig
}

export function isLandscapeLayout(cfg: GameLayoutConfig): boolean {
  return cfg.orientation === 'landscape'
}