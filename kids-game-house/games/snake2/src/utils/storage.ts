// 本地存储工具函数

const STORAGE_KEY = 'snake-game-data'

export interface StoredData {
  highScore: number
  playCount: number
  difficulty: string
  isMuted: boolean
  lastPlayed: number
}

/**
 * 从 localStorage 加载游戏数据
 */
export function loadGameData(): StoredData {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('加载游戏数据失败:', e)
  }
  
  // 返回默认数据
  return {
    highScore: 0,
    playCount: 0,
    difficulty: 'medium',
    isMuted: false,
    lastPlayed: 0
  }
}

/**
 * 保存游戏数据到 localStorage
 */
export function saveGameData(data: Partial<StoredData>): void {
  try {
    const existing = loadGameData()
    const merged = { ...existing, ...data, lastPlayed: Date.now() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  } catch (e) {
    console.error('保存游戏数据失败:', e)
  }
}

/**
 * 增加游玩次数
 */
export function incrementPlayCount(): number {
  const data = loadGameData()
  data.playCount += 1
  saveGameData({ playCount: data.playCount })
  return data.playCount
}

/**
 * 更新最高分
 */
export function updateHighScore(score: number): number {
  const data = loadGameData()
  if (score > data.highScore) {
    data.highScore = score
    saveGameData({ highScore: score })
  }
  return data.highScore
}
