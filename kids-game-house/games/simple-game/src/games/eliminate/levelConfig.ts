// 极速消除游戏关卡配置

export interface LevelConfig {
  level: number
  name: string
  targetScore: number // 目标分数
  timeLimit: number // 时间限制（毫秒）
  colorCount: number // 颜色数量（影响难度）
  itemSpawnRate: number // 道具生成概率 (0-1)
  minComboForBonus: number // 最小连击数获得奖励
  description: string
}

export const ELIMINATE_LEVELS: LevelConfig[] = [
  {
    level: 1,
    name: '新手入门',
    targetScore: 1200,
    timeLimit: 22000, // 22秒
    colorCount: 4, // 4种颜色，容易匹配
    itemSpawnRate: 0.15, // 15%道具生成率
    minComboForBonus: 6,
    description: '消除相同颜色的方块，达到1200分！'
  },
  {
    level: 2,
    name: '初露锋芒',
    targetScore: 2000,
    timeLimit: 20000, // 20秒
    colorCount: 4,
    itemSpawnRate: 0.13,
    minComboForBonus: 6,
    description: '时间更紧了，加油！'
  },
  {
    level: 3,
    name: '渐入佳境',
    targetScore: 3200,
    timeLimit: 19000, // 19秒
    colorCount: 5, // 增加到5种颜色
    itemSpawnRate: 0.12,
    minComboForBonus: 7,
    description: '颜色变多了，需要更仔细！'
  },
  {
    level: 4,
    name: '小试牛刀',
    targetScore: 4800,
    timeLimit: 18000, // 18秒
    colorCount: 5,
    itemSpawnRate: 0.10,
    minComboForBonus: 7,
    description: '继续保持连击！'
  },
  {
    level: 5,
    name: '游刃有余',
    targetScore: 6800,
    timeLimit: 17000, // 17秒
    colorCount: 5,
    itemSpawnRate: 0.10,
    minComboForBonus: 7,
    description: '一半的征程，坚持住！'
  },
  {
    level: 6,
    name: '高手进阶',
    targetScore: 9500,
    timeLimit: 16000, // 16秒
    colorCount: 6, // 增加到6种颜色（全部）
    itemSpawnRate: 0.08,
    minComboForBonus: 8,
    description: '所有颜色都出现了，挑战升级！'
  },
  {
    level: 7,
    name: '炉火纯青',
    targetScore: 13000,
    timeLimit: 15000, // 15秒
    colorCount: 6,
    itemSpawnRate: 0.07,
    minComboForBonus: 8,
    description: '时间越来越紧张了！'
  },
  {
    level: 8,
    name: '登峰造极',
    targetScore: 18000,
    timeLimit: 13000, // 13秒
    colorCount: 6,
    itemSpawnRate: 0.05,
    minComboForBonus: 9,
    description: '高手的对决，速度与激情！'
  },
  {
    level: 9,
    name: '超凡脱俗',
    targetScore: 25000,
    timeLimit: 11000, // 11秒
    colorCount: 6,
    itemSpawnRate: 0.04,
    minComboForBonus: 10,
    description: '接近巅峰，最后冲刺！'
  },
  {
    level: 10,
    name: '至尊王者',
    targetScore: 35000,
    timeLimit: 9000, // 9秒
    colorCount: 6,
    itemSpawnRate: 0.03, // 极低道具率
    minComboForBonus: 12,
    description: '最终挑战，证明你的实力！'
  }
]

// 根据关卡获取颜色数组
export function getLevelColors(level: number): string[] {
  const allColors = ['#FF6B6B', '#FF8E53', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6']
  const config = ELIMINATE_LEVELS.find(l => l.level === level)
  if (!config) return allColors
  
  return allColors.slice(0, config.colorCount)
}

// 获取下一关配置
export function getNextLevel(currentLevel: number): LevelConfig | null {
  const nextLevel = currentLevel + 1
  return ELIMINATE_LEVELS.find(l => l.level === nextLevel) || null
}

// 检查是否通关
export function isLevelCompleted(currentLevel: number, score: number): boolean {
  const config = ELIMINATE_LEVELS.find(l => l.level === currentLevel)
  if (!config) return false
  return score >= config.targetScore
}
