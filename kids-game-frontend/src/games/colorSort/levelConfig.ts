/**
 * ColorSort 关卡配置
 * 
 * 难度设计原则：
 * - 关卡1-3: 入门级，4个颜色，6个管子，简单排列
 * - 关卡4-6: 进阶级，5个颜色，7个管子，中等复杂度
 * - 关卡7-8: 挑战级，6个颜色，8个管子，高复杂度
 * - 关卡9-10: 专家级，6个颜色，9个管子，极高复杂度
 */

export interface LevelConfig {
  level: number
  name: string
  colorCount: number      // 颜色数量
  tubeCount: number       // 管子总数（包含空管）
  ballsPerTube: number    // 每个管子的球数
  timeLimit: number       // 时间限制（秒）
  targetMoves?: number    // 目标步数（可选）
  description: string     // 关卡描述
}

export const COLOR_SORT_LEVELS: LevelConfig[] = [
  {
    level: 1,
    name: '初识色彩',
    colorCount: 3,
    tubeCount: 5,
    ballsPerTube: 3,
    timeLimit: 180,
    description: '欢迎来到色彩排序！将相同颜色的液体分到同一个试管中。'
  },
  {
    level: 2,
    name: '色彩启蒙',
    colorCount: 3,
    tubeCount: 5,
    ballsPerTube: 4,
    timeLimit: 180,
    description: '增加液体层数，需要更多思考。'
  },
  {
    level: 3,
    name: '四色挑战',
    colorCount: 4,
    tubeCount: 6,
    ballsPerTube: 4,
    timeLimit: 150,
    description: '新增一种颜色，难度提升！'
  },
  {
    level: 4,
    name: '五彩斑斓',
    colorCount: 5,
    tubeCount: 7,
    ballsPerTube: 4,
    timeLimit: 150,
    description: '五种颜色交织，考验你的规划能力。'
  },
  {
    level: 5,
    name: '色彩迷宫',
    colorCount: 5,
    tubeCount: 7,
    ballsPerTube: 5,
    timeLimit: 120,
    description: '每管5层液体，需要更深的策略。'
  },
  {
    level: 6,
    name: '六色迷阵',
    colorCount: 5,
    tubeCount: 8,
    ballsPerTube: 5,
    timeLimit: 120,
    description: '更多管子，更多可能性。'
  },
  {
    level: 7,
    name: '彩虹挑战',
    colorCount: 6,
    tubeCount: 8,
    ballsPerTube: 5,
    timeLimit: 120,
    description: '六种颜色，真正的挑战开始！'
  },
  {
    level: 8,
    name: '色彩大师',
    colorCount: 6,
    tubeCount: 8,
    ballsPerTube: 6,
    timeLimit: 90,
    description: '每管6层，时间紧迫！'
  },
  {
    level: 9,
    name: '终极排序',
    colorCount: 6,
    tubeCount: 9,
    ballsPerTube: 6,
    timeLimit: 90,
    description: '九个试管，极限挑战！'
  },
  {
    level: 10,
    name: '色彩传说',
    colorCount: 6,
    tubeCount: 9,
    ballsPerTube: 7,
    timeLimit: 60,
    description: '最高难度！证明你是真正的色彩大师！'
  }
]

// 根据关卡获取颜色列表
export function getLevelColors(level: number): string[] {
  const allColors = [
    '#FF6B6B', // 红色
    '#4ECDC4', // 青色
    '#FFD93D', // 黄色
    '#9B59B6', // 紫色
    '#FF69B4', // 粉色
    '#6BCB77'  // 绿色
  ]
  
  const config = COLOR_SORT_LEVELS.find(l => l.level === level)
  if (!config) return allColors.slice(0, 4) // 默认4色
  
  return allColors.slice(0, config.colorCount)
}

// 获取下一关配置
export function getNextLevel(currentLevel: number): LevelConfig | null {
  const nextLevel = currentLevel + 1
  return COLOR_SORT_LEVELS.find(l => l.level === nextLevel) || null
}

// 检查是否通关所有关卡
export function isGameCompleted(currentLevel: number): boolean {
  return currentLevel >= COLOR_SORT_LEVELS.length
}
