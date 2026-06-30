/** §3 / §4 / §12 — 萌趣坦克大作战（数值与色板唯一来源） */

export const GAME_ID = 'cuteTankBattle'

/** 设计稿逻辑分辨率（§3.6） */
export const DESIGN_W = 750
export const DESIGN_H = 1334

export const GRID_COLS = 14
export const GRID_ROWS = 10

/** §4.3 色彩板 */
export const PALETTE = {
  primary: '#48C990',
  accent: '#FFD970',
  bg: '#E6F4FF',
  danger: '#E86A6A',
  success: '#76E2B8',
  brick: '#C4986B',
  bullet: '#F2E863',
  base: '#6B98E8',
} as const

/** §3.3 实体数值 */
export const ENTITY = {
  playerTank: {
    kind: 'playerTank' as const,
    name: '玩家萌坦',
    emoji: '🟢',
    color: PALETTE.primary,
    hp: 5,
    moveSpeed: 3,
    bulletDamage: 1,
    fireIntervalSec: 1.2,
    size: 60,
  },
  enemyTank1: {
    kind: 'enemyTank1' as const,
    name: '小兵敌方坦',
    emoji: '🔴',
    color: PALETTE.danger,
    hp: 2,
    moveSpeed: 1.5,
    bulletDamage: 1,
    fireIntervalSec: 2.2,
    size: 60,
  },
  wallBrick: {
    kind: 'wallBrick' as const,
    name: '砖墙障碍',
    emoji: '🧱',
    color: PALETTE.brick,
    hp: 3,
    size: 64,
  },
  homeBase: {
    kind: 'homeBase' as const,
    name: '己方基地',
    emoji: '🏠',
    color: PALETTE.base,
    hp: 8,
    size: 64,
  },
  bulletNormal: {
    kind: 'bulletNormal' as const,
    speed: 6,
    size: 20,
    color: PALETTE.bullet,
  },
} as const

/** §3.4 波次 */
export const WAVES = [
  { wave: 1, enemyCount: 4, enemySpeedMult: 1, extraWalls: 0 },
  { wave: 2, enemyCount: 6, enemySpeedMult: 1, extraWalls: 2 },
  { wave: 3, enemyCount: 8, enemySpeedMult: 1.15, extraWalls: 0 },
] as const

/** 地图编码：0=空地 1=砖墙 2=玩家出生 3=基地 */
export type CellCode = 0 | 1 | 2 | 3

/** 基础地图模板（10 行 × 14 列） */
export const BASE_MAP_TEMPLATE: CellCode[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0],
  [0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0],
  [0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0],
  [0, 1, 0, 1, 0, 0, 3, 0, 0, 1, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
]

export const ASSET_BASE = `/assets/${GAME_ID}`

export const ASSET_PATHS = {
  tankPlayer: `${ASSET_BASE}/sprites/tank_player.png`,
  tankEnemy: `${ASSET_BASE}/sprites/tank_enemy.png`,
  wallBrick: `${ASSET_BASE}/sprites/wall_brick.png`,
  bg: `${ASSET_BASE}/backgrounds/play_bg.webp`,
  iconRestart: `${ASSET_BASE}/ui/icon_restart.png`,
  iconBack: `${ASSET_BASE}/ui/icon_back.png`,
  bgm: `${ASSET_BASE}/audio/bgm_loop.ogg`,
  fire: `${ASSET_BASE}/audio/fire_sound.ogg`,
  win: `${ASSET_BASE}/audio/win_sound.ogg`,
} as const

/** §3.1 星级（基地剩余血量比例） */
export function starsFromBaseRatio(ratio: number): 1 | 2 | 3 {
  if (ratio >= 1) return 3
  if (ratio >= 0.5) return 2
  return 1
}