/**
 * 关卡进度管理
 * 使用 localStorage 保存玩家进度
 */

const STORAGE_KEY = 'colorSort_progress'

export interface GameProgress {
  currentLevel: number    // 当前关卡
  unlockedLevels: number  // 已解锁的最高关卡
  bestScores: Record<number, number> // 每关最佳分数
  totalGames: number      // 总游戏次数
  totalWins: number       // 总胜利次数
}

// 获取默认进度
function getDefaultProgress(): GameProgress {
  return {
    currentLevel: 1,
    unlockedLevels: 1,
    bestScores: {},
    totalGames: 0,
    totalWins: 0
  }
}

// 加载进度
export function loadProgress(): GameProgress {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return { ...getDefaultProgress(), ...JSON.parse(saved) }
    }
  } catch (e) {
    console.error('加载进度失败:', e)
  }
  return getDefaultProgress()
}

// 保存进度
export function saveProgress(progress: GameProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch (e) {
    console.error('保存进度失败:', e)
  }
}

// 更新关卡完成状态
export function completeLevel(level: number, score: number): GameProgress {
  const progress = loadProgress()
  
  progress.totalGames++
  progress.totalWins++
  
  // 更新最佳分数
  if (!progress.bestScores[level] || score > progress.bestScores[level]) {
    progress.bestScores[level] = score
  }
  
  // 解锁下一关
  if (level >= progress.unlockedLevels) {
    progress.unlockedLevels = Math.min(level + 1, 10)
    progress.currentLevel = progress.unlockedLevels
  }
  
  saveProgress(progress)
  return progress
}

// 记录失败
export function recordFailure(): GameProgress {
  const progress = loadProgress()
  progress.totalGames++
  saveProgress(progress)
  return progress
}

// 重置进度（用于测试）
export function resetProgress(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// 获取关卡统计信息
export function getLevelStats(level: number): {
  completed: boolean
  bestScore: number
  attempts?: number
} {
  const progress = loadProgress()
  return {
    completed: level < progress.unlockedLevels,
    bestScore: progress.bestScores[level] || 0
  }
}
