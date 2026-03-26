const STORAGE_KEY = 'pvz-game-data'

export interface StoredData {
  highScore: number
  playCount: number
  difficulty: string
  isMuted: boolean
  lastPlayed: number
}

export function loadGameData(): StoredData {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('加载游戏数据失败:', e)
  }
  
  return {
    highScore: 0,
    playCount: 0,
    difficulty: 'medium',
    isMuted: false,
    lastPlayed: 0
  }
}

export function saveGameData(data: Partial<StoredData>): void {
  try {
    const existing = loadGameData()
    const merged = { ...existing, ...data, lastPlayed: Date.now() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  } catch (e) {
    console.error('保存游戏数据失败:', e)
  }
}

export function incrementPlayCount(): number {
  const data = loadGameData()
  data.playCount += 1
  saveGameData({ playCount: data.playCount })
  return data.playCount
}

export function updateHighScore(score: number): number {
  const data = loadGameData()
  if (score > data.highScore) {
    data.highScore = score
    saveGameData({ highScore: score })
  }
  return data.highScore
}
