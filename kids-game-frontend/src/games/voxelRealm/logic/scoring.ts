import type { BlockType, CompeteState, PlayMode } from '../types'
import { BUILD_THEMES } from '../config'

const CANDY = new Set<BlockType>(['candyPink', 'candyMint', 'candyLemon'])
const PLANT = new Set<BlockType>(['flower', 'leaf', 'grass'])
const GLOW_SET = new Set<BlockType>(['glow', 'water'])

export function scoreThemeBuild(
  placed: number,
  themeId: string,
  blockHistogram: Map<BlockType, number>,
): { score: number; grade: string } {
  const theme = BUILD_THEMES.find(t => t.id === themeId)
  let score = Math.min(400, placed * 4)
  if (theme) {
    let themed = 0
    for (const b of theme.blocks) {
      themed += blockHistogram.get(b) ?? 0
    }
    score += Math.min(350, themed * 6)
    const variety = theme.blocks.filter(b => (blockHistogram.get(b) ?? 0) > 0).length
    score += variety * 25
  }
  let glow = 0
  for (const b of GLOW_SET) glow += blockHistogram.get(b) ?? 0
  score += Math.min(120, glow * 8)
  score = Math.round(Math.min(999, score))
  const grade = score >= 850 ? 'S' : score >= 700 ? 'A' : score >= 520 ? 'B' : score >= 350 ? 'C' : 'D'
  return { score, grade }
}

export function scoreTerrainRace(elapsedMs: number, digCount: number, targetDigs: number): number {
  if (digCount < targetDigs) return Math.round(digCount * 5)
  const sec = elapsedMs / 1000
  const base = 600
  const timeBonus = Math.max(0, 400 - sec * 12)
  return Math.round(Math.min(999, base + timeBonus))
}

export function casualPointsForAction(broken: boolean, placedType?: BlockType): number {
  if (broken) return 2
  if (placedType && CANDY.has(placedType)) return 4
  if (placedType && PLANT.has(placedType)) return 3
  return 1
}

export function canUseBlockInCompete(mode: PlayMode, block: BlockType, allowed: BlockType[] | null): boolean {
  if (mode === 'casual') return true
  if (!allowed) return true
  return allowed.includes(block)
}

export function competeTimeExpired(compete: CompeteState): boolean {
  return compete.running && compete.kind === 'themeBuild' && compete.timeLeft <= 0
}