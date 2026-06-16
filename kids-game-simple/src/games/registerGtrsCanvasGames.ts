/**
 * 已在玩法层读取 GTRS 缓存（resolveGtrsCanvasStyle / readGtrsSceneMeta 等）的游戏 id。
 * 新增适配后请加入此列表，并在 public/themes/{gameId}/gtrs.json 提供主题。
 */
export const GTRS_CANVAS_ADAPTED_GAME_IDS = [
  'snake',
  'colorTap',
  'pop',
  'dodge',
  'whackMole',
  'starCatcher',
  'bouncePath',
  'neonRun',
  'cookieCut',
  'eliminate',
  'happyDefense',
  'fruitSlice',
  'tetris',
  'memoryMatch',
  'jewelMatch',
  'bubbleShooter',
  'sort',
  'slimeJump',
  'stack',
  'match3',
  'racingRun',
  'superMario',
  'spaceShooter',
  'dragonShooter',
  'towerDefense',
  'beatDragon',
  'kingBaby',
  'rpgShooter',
  'contraRpg',
  'wangzheRpg',
  'dnfRpg',
  'plantsVsZombies',
  'plantZombieDefense2d',
  'plantZombieDefense',
  'cuteTankBattle',
  'skyFrenzy',
  'cloudBallRush3d',
  'voxelRealm',
  'rpgShooterTD',
  'skyRush3d',
] as const

export type GtrsCanvasAdaptedGameId = (typeof GTRS_CANVAS_ADAPTED_GAME_IDS)[number]

export function isGtrsCanvasAdapted(gameId: string): gameId is GtrsCanvasAdaptedGameId {
  return (GTRS_CANVAS_ADAPTED_GAME_IDS as readonly string[]).includes(gameId)
}

/** 待适配：FRAMEWORK 大厅游戏减去已适配（便于排期，非运行时门禁） */
export const GTRS_CANVAS_PENDING_GAME_IDS = [] as const