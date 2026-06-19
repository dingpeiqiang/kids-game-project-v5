import type { Component } from 'vue'
import type { GameGuide } from '../../types'
import type { GameGuideLoader, GameGuideModule } from './types'

/**
 * 各游戏玩法介绍由对应目录下的 guide 模块提供（懒加载）。
 * 新增游戏：在 `src/games/<id>/guide.ts` 导出 `guide`，并在此注册 loader。
 */
export const GAME_GUIDE_LOADERS: Record<string, GameGuideLoader> = {
  eliminate: () => import('../../games/eliminate/guide').then(m => m),
  tetris: () => import('../../games/tetris/guide').then(m => m),
  jewelMatch: () => import('../../games/jewelMatch/guide').then(m => m),
  match3: () => import('../../games/match3/guide').then(m => m),
  bubbleShooter: () => import('../../games/bubbleShooter/guide').then(m => m),
  sort: () => import('../../games/colorSort/guide').then(m => m),
  memoryMatch: () => import('../../games/memoryMatch/guide').then(m => m),
  colorTap: () => import('../../games/colorTap/guide').then(m => m),
  whackMole: () => import('../../games/whackMole/guide').then(m => m),
  pop: () => import('../../games/pop/guide').then(m => m),
  fruitSlice: () => import('../../games/fruitSlice/guide').then(m => m),
  cookieCut: () => import('../../games/cookieCut/guide').then(m => m),
  dodge: () => import('../../games/dodge/guide').then(m => m),
  neonRun: () => import('../../games/neonRun/guide').then(m => m),
  slimeJump: () => import('../../games/slimeJump/guide').then(m => m),
  superMario: () => import('../../games/superMario/guide').then(m => m),
  snake: () => import('../../games/snake/guide').then(m => m),
  racingRun: () => import('../../games/racingRun/guide').then(m => m),
  starCatcher: () => import('../../games/starCatcher/guide').then(m => m),
  bouncePath: () => import('../../games/bouncePath/guide').then(m => m),
  stack: () => import('../../games/stack/guide').then(m => m),
  spaceShooter: () => import('../../games/spaceshooter/guide').then(m => m),
  towerDefense: () => import('../../games/towerDefense/guide').then(m => m),
  plantsVsZombies: () => import('../../games/plantsVsZombies/guide').then(m => m),
  rpgShooter: () => import('../../games/rpgShooter/guide').then(m => m),
  dragonShooter: () => import('../../games/dragonShooter/guide').then(m => m),
  beatDragon: () => import('../../games/beatDragon/guide').then(m => m),
  kingBaby: () => import('../../games/kingBaby/guide').then(m => m),
  rpgShooterTD: () => import('../../games/rpgShooterTowerDefense/guide').then(m => m),
  contraRpg: () => import('../../games/contraRpg/guide').then(m => m),
  wangzheRpg: () => import('../../games/wangzheRpg/guide').then(m => m),
  happyDefense: () => import('../../games/happyDefense/guide').then(m => m),
  plantZombieDefense: () => import('../../games/plantZombieDefense/guide').then(m => m),
  plantZombieDefense2d: () => import('../../games/plantZombieDefense2d/guide').then(m => m),
  cloudBallRush3d: () => import('../../games/cloudBallRush3d/guide').then(m => m),
  voxelRealm: () => import('../../games/voxelRealm/guide').then(m => m),
  skyFrenzy: () => import('../../games/skyFrenzy/guide').then(m => m),
  skyRush3d: () => import('../../games/skyRush3d/guide').then(m => m),
  cuteTankBattle: () => import('../../games/cuteTankBattle/guide').then(m => m),
  dnfRpg: () => import('../../games/dnfRpg/guide').then(m => m),
}

const guideCache = new Map<string, GameGuide>()
const moduleCache = new Map<string, GameGuideModule>()

export function hasGameGuide(gameId: string): boolean {
  return gameId in GAME_GUIDE_LOADERS
}

export async function loadGameGuideModule(gameId: string): Promise<GameGuideModule | undefined> {
  const cached = moduleCache.get(gameId)
  if (cached) return cached
  const loader = GAME_GUIDE_LOADERS[gameId]
  if (!loader) return undefined
  const mod = await loader()
  moduleCache.set(gameId, mod)
  guideCache.set(gameId, mod.guide)
  return mod
}

export async function loadGameGuide(gameId: string): Promise<GameGuide | undefined> {
  const cached = guideCache.get(gameId)
  if (cached) return cached
  const mod = await loadGameGuideModule(gameId)
  return mod?.guide
}

export function getCachedGameGuide(gameId: string): GameGuide | undefined {
  return guideCache.get(gameId)
}

export async function loadGameGuidePanel(gameId: string): Promise<Component | undefined> {
  const mod = await loadGameGuideModule(gameId)
  return mod?.GuidePage
}

/** @deprecated 仅兼容旧代码；请使用 loadGameGuide */
export const GAME_GUIDES: Record<string, GameGuide> = new Proxy({} as Record<string, GameGuide>, {
  get(_target, prop: string) {
    return guideCache.get(prop)
  },
  has(_target, prop: string) {
    return guideCache.has(prop) || prop in GAME_GUIDE_LOADERS
  },
  ownKeys() {
    return [...Object.keys(GAME_GUIDE_LOADERS), ...guideCache.keys()]
  },
  getOwnPropertyDescriptor(_target, prop: string) {
    if (prop in GAME_GUIDE_LOADERS || guideCache.has(prop)) {
      return { enumerable: true, configurable: true }
    }
    return undefined
  },
})