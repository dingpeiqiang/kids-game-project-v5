import type { GameGuide } from '../../types'
import { getCombinedControlGuideHint, getGameControlPreset } from './gameControlRegistry'

/**
 * 在引导页 ops 末尾追加统一操作文案（触屏 + PC），与 registry preset 一致。
 */
export function mergeGuideWithControlHint(gameId: string, guide: GameGuide): GameGuide {
  const preset = getGameControlPreset(gameId)
  const hint = getCombinedControlGuideHint(preset)
  const lines = hint.split('\n').filter(Boolean)
  const extraOps = lines.map((line, i) => ({
    icon: i === 0 ? '🎮' : '⌨️',
    text: line,
  }))
  return {
    ...guide,
    ops: [...guide.ops, ...extraOps],
  }
}