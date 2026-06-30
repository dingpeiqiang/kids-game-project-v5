import type { GameGuide } from '../../types'
import { mergeGuideWithControlHint } from '../mobileControls/mergeGuideWithControlHint'
import type { GameGuideModule } from './types'
import { GAME_GUIDE_LOADERS } from './gameGuideRegistry'

const moduleCache = new Map<string, GameGuideModule>()

export async function loadGameGuideModule(gameId: string): Promise<GameGuideModule | undefined> {
  const cached = moduleCache.get(gameId)
  if (cached) return cached

  const loader = GAME_GUIDE_LOADERS[gameId]
  if (!loader) return undefined

  const mod = await loader()
  moduleCache.set(gameId, mod)
  return mod
}

export async function loadGameGuide(gameId: string): Promise<GameGuide | undefined> {
  const mod = await loadGameGuideModule(gameId)
  if (!mod?.guide) return undefined
  return mergeGuideWithControlHint(gameId, mod.guide)
}

export function clearGameGuideCache(gameId?: string): void {
  if (gameId) moduleCache.delete(gameId)
  else moduleCache.clear()
}