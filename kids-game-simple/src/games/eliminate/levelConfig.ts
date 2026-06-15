// 极速消除游戏关卡配置

import { getCachedGTRSTheme } from '../../services/gtrsThemeLoader'
import { readGtrsSceneList } from '../../utils/gtrsSceneMeta'

const DEFAULT_BLOCK_COLORS = ['#FF6B6B', '#FF8E53', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6']

export interface LevelConfig {
  level: number
  name: string
  targetScore: number // 目标分数（次要目标）
  targetStars: number // 目标星星数量（主要目标）
  timeLimit: number // 时间限制（毫秒）
  colorCount: number // 颜色数量（影响难度）
  itemSpawnRate: number // 道具生成概率 (0-1)
  starSpawnRate: number // 星星生成概率 (0-1)
  minComboForBonus: number // 最小连击数获得奖励
  description: string
}

export const ELIMINATE_LEVELS: LevelConfig[] = [
  {
    level: 1,
    name: '新手入门',
    targetScore: 2000,
    targetStars: 8,
    timeLimit: 60000,
    colorCount: 3,
    itemSpawnRate: 0.03, // 降低道具生成率
    starSpawnRate: 0.12,
    minComboForBonus: 6,
    description: '消除方块收集8颗星星！'
  },
  {
    level: 2,
    name: '初露锋芒',
    targetScore: 3500,
    targetStars: 10,
    timeLimit: 55000,
    colorCount: 4,
    itemSpawnRate: 0.025,
    starSpawnRate: 0.11,
    minComboForBonus: 6,
    description: '收集10颗星星，时间更紧了！'
  },
  {
    level: 3,
    name: '渐入佳境',
    targetScore: 5500,
    targetStars: 12,
    timeLimit: 50000,
    colorCount: 4,
    itemSpawnRate: 0.02,
    starSpawnRate: 0.10,
    minComboForBonus: 7,
    description: '颜色变多了，收集12颗星星！'
  },
  {
    level: 4,
    name: '小试牛刀',
    targetScore: 8000,
    targetStars: 15,
    timeLimit: 45000,
    colorCount: 5,
    itemSpawnRate: 0.015,
    starSpawnRate: 0.09,
    minComboForBonus: 7,
    description: '继续保持连击，收集15颗星星！'
  },
  {
    level: 5,
    name: '游刃有余',
    targetScore: 11500,
    targetStars: 18,
    timeLimit: 40000,
    colorCount: 5,
    itemSpawnRate: 0.012,
    starSpawnRate: 0.08,
    minComboForBonus: 7,
    description: '一半的征程，收集18颗星星！'
  },
  {
    level: 6,
    name: '高手进阶',
    targetScore: 16000,
    targetStars: 22,
    timeLimit: 35000,
    colorCount: 5,
    itemSpawnRate: 0.01,
    starSpawnRate: 0.07,
    minComboForBonus: 8,
    description: '挑战升级，收集22颗星星！'
  },
  {
    level: 7,
    name: '炉火纯青',
    targetScore: 22000,
    targetStars: 26,
    timeLimit: 30000,
    colorCount: 6,
    itemSpawnRate: 0.008,
    starSpawnRate: 0.06,
    minComboForBonus: 8,
    description: '所有颜色都出现了，收集26颗星星！'
  },
  {
    level: 8,
    name: '登峰造极',
    targetScore: 30000,
    targetStars: 30,
    timeLimit: 25000,
    colorCount: 6,
    itemSpawnRate: 0.006,
    starSpawnRate: 0.05,
    minComboForBonus: 9,
    description: '高手的对决，收集30颗星星！'
  },
  {
    level: 9,
    name: '超凡脱俗',
    targetScore: 42000,
    targetStars: 35,
    timeLimit: 20000,
    colorCount: 6,
    itemSpawnRate: 0.004,
    starSpawnRate: 0.04,
    minComboForBonus: 10,
    description: '接近巅峰，收集35颗星星！'
  },
  {
    level: 10,
    name: '至尊王者',
    targetScore: 60000,
    targetStars: 40,
    timeLimit: 15000,
    colorCount: 6,
    itemSpawnRate: 0.002,
    starSpawnRate: 0.03,
    minComboForBonus: 12,
    description: '最终挑战，收集40颗星星证明实力！'
  }
]

// 根据关卡获取颜色数组
export function getLevelColors(level: number): string[] {
  const theme = getCachedGTRSTheme('eliminate')
  const allColors = readGtrsSceneList(theme, 'game_palette') ?? DEFAULT_BLOCK_COLORS
  const config = ELIMINATE_LEVELS.find(l => l.level === level)
  if (!config) return allColors

  return allColors.slice(0, config.colorCount)
}

// 获取下一关配置
export function getNextLevel(currentLevel: number): LevelConfig | null {
  const nextLevel = currentLevel + 1
  return ELIMINATE_LEVELS.find(l => l.level === nextLevel) || null
}

// 检查是否通关（基于星星收集）
export function isLevelCompleted(currentLevel: number, collectedStars: number): boolean {
  const config = ELIMINATE_LEVELS.find(l => l.level === currentLevel)
  if (!config) return false
  return collectedStars >= config.targetStars
}
