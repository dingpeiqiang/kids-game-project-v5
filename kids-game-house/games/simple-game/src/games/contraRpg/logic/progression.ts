import { GAME_CONFIG } from '../config'
import type { Platform } from '../types'

export function updateCamera(
  playerX: number,
  cameraX: number,
): number {
  // 将玩家位置调整到屏幕左侧1/4处，拉远视角，看到更多前方内容
  const targetX = playerX - GAME_CONFIG.CANVAS_WIDTH / 4
  const diff = targetX - cameraX
  if (Math.abs(diff) > 2) {
    cameraX += diff * 0.12
  } else {
    cameraX = targetX
  }
  return Math.max(0, cameraX)
}

export function checkLevelComplete(
  currentLevel: number,
  spawnIndex: number,
  enemyCount: number,
  playerX: number,
  platforms: Platform[],
  hasBoss: boolean,
  bossDefeated: boolean,
  totalSpawnCount: number,
): boolean {
  if (hasBoss) {
    return bossDefeated && enemyCount === 0
  }
  
  const maxPlatformX = Math.max(...platforms.map(p => p.x + p.width))
  const finishLine = maxPlatformX - GAME_CONFIG.CANVAS_WIDTH
  
  return playerX >= finishLine && spawnIndex >= totalSpawnCount && enemyCount === 0
}