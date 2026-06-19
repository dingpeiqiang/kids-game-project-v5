/**
 * kids-game-simple 游戏屏幕方向目录（操作体验导向）
 *
 * 规则：每个 gameId 有且仅有一种 orientation（portrait | landscape），
 * 游戏实现与壳层 layout 须一致，禁止同一游戏横竖双模式。
 *
 * 竖屏 portrait：单手/双手竖握，纵向视野或网格点选、下落、跑酷、竖版射击
 * 横屏 landscape：横向卷轴、左右对战、宽战场塔防/RTS、双摇杆横屏射击
 */
import type { GameOrientationMode } from './gameLayout'

export interface GameOrientationEntry {
  orientation: GameOrientationMode
  /** 操作体验简要说明（产品/策划对照用） */
  rationale: string
}

export const GAME_ORIENTATION_CATALOG: Record<string, GameOrientationEntry> = {
  // —— 益智 / 消除 / 记忆（竖屏点选、网格）——
  eliminate: { orientation: 'portrait', rationale: '同色块点消，竖屏网格拇指点选' },
  tetris: { orientation: 'portrait', rationale: '方块下落，经典竖屏棋盘' },
  jewelMatch: { orientation: 'portrait', rationale: '三消交换，竖屏棋盘' },
  match3: { orientation: 'portrait', rationale: '三消，竖屏' },
  bubbleShooter: { orientation: 'portrait', rationale: '泡泡龙发射口在底，竖屏瞄准' },
  sort: { orientation: 'portrait', rationale: '试管倒色，竖屏关卡' },
  memoryMatch: { orientation: 'portrait', rationale: '翻牌矩阵，竖屏' },
  stack: { orientation: 'portrait', rationale: '叠方块，竖向堆高' },

  // —— 反应 / 专注（竖屏全屏点按）——
  colorTap: { orientation: 'portrait', rationale: '快速点色块，竖屏' },
  whackMole: { orientation: 'portrait', rationale: '地鼠网格点敲' },
  pop: { orientation: 'portrait', rationale: '点气球，竖屏' },

  // —— 手眼协调（竖屏滑动/跑酷）——
  fruitSlice: { orientation: 'portrait', rationale: '挥砍水果，竖屏滑动手势' },
  cookieCut: { orientation: 'portrait', rationale: '切饼干滑动，竖屏' },
  dodge: { orientation: 'portrait', rationale: '左右躲障碍，竖屏跑道' },
  neonRun: { orientation: 'portrait', rationale: '纵向无尽跑，竖屏' },
  slimeJump: { orientation: 'portrait', rationale: '向上跳平台，竖屏' },
  snake: { orientation: 'portrait', rationale: '贪吃蛇经典竖屏网格' },
  racingRun: { orientation: 'portrait', rationale: '竖屏赛车道，左右换道' },
  starCatcher: { orientation: 'portrait', rationale: '小精灵接星星，竖屏' },
  bouncePath: { orientation: 'portrait', rationale: '弹珠迷宫，竖屏场地' },

  // —— 竖屏射击 / 塔防（战场纵向或底栏建造）——
  spaceShooter: { orientation: 'portrait', rationale: '竖版太空射击，飞船在底' },
  dragonShooter: { orientation: 'portrait', rationale: '竖屏自动射击打龙' },
  beatDragon: { orientation: 'portrait', rationale: '竖屏节奏/点击打龙' },
  rpgShooter: { orientation: 'portrait', rationale: '竖屏场地 RPG 射击' },
  rpgShooterTD: { orientation: 'portrait', rationale: '竖屏塔防+射击混合' },
  towerDefense: { orientation: 'portrait', rationale: '竖屏格子放塔，底栏选塔' },

  // —— 横屏：卷轴 / 对战 / 宽战场 ——
  superMario: {
    orientation: 'landscape',
    rationale: '横版卷轴跑跳，左右视野+底栏虚拟键',
  },
  contraRpg: {
    orientation: 'landscape',
    rationale: '横版射击闯关，左右移动射击',
  },
  wangzheRpg: {
    orientation: 'landscape',
    rationale: '横版 MOBA 对战，摇杆+技能横屏',
  },
  dnfRpg: {
    orientation: 'landscape',
    rationale: '横版格斗连招，宽战场',
  },
  kingBaby: {
    orientation: 'landscape',
    rationale: '横版动作闯关，宽关卡',
  },
  plantsVsZombies: {
    orientation: 'landscape',
    rationale: '草坪多行塔防，横向战线',
  },
  happyDefense: {
    orientation: 'landscape',
    rationale: '横屏 Phaser 塔防/战场',
  },
  plantZombieDefense: {
    orientation: 'landscape',
    rationale: '横屏植物大战僵尸类',
  },
  plantZombieDefense2d: {
    orientation: 'landscape',
    rationale: '横屏 2D 草坪防线',
  },
  cloudBallRush3d: {
    orientation: 'landscape',
    rationale: '3D 横屏跑球/冲刺',
  },
  voxelRealm: {
    orientation: 'landscape',
    rationale: '3D 横屏探索/战斗',
  },
  skyFrenzy: {
    orientation: 'landscape',
    rationale: '横屏飞行射击',
  },
  skyRush3d: {
    orientation: 'landscape',
    rationale: '3D 横屏飞行',
  },

  // —— 竖屏特例：竖版坦克（双摇杆在屏下）——
  cuteTankBattle: {
    orientation: 'portrait',
    rationale: '俯视角坦克，竖屏大场地+底部摇杆区',
  },
}

export function getCatalogOrientation(gameId: string): GameOrientationMode | undefined {
  return GAME_ORIENTATION_CATALOG[gameId]?.orientation
}

export function getCatalogRationale(gameId: string): string | undefined {
  return GAME_ORIENTATION_CATALOG[gameId]?.rationale
}

/** 开发环境：注册表中的每个游戏必须在目录中有方向定义 */
export function assertGameOrientationCatalogComplete(registeredGameIds: string[]): void {
  if (import.meta.env?.PROD) return
  const missing = registeredGameIds.filter((id) => !GAME_ORIENTATION_CATALOG[id])
  const extra = Object.keys(GAME_ORIENTATION_CATALOG).filter((id) => !registeredGameIds.includes(id))
  if (missing.length || extra.length) {
    const msg = `[gameOrientation] 目录与 GAME_REGISTRY 不一致: missing=${missing.join(',')} extra=${extra.join(',')}`
    console.error(msg)
    throw new Error(msg)
  }
}