/**
 * 切饼干游戏 - 游戏状态管理
 */

import type { Cookie, Particle, Slice } from './types'
import type { GameEngine } from '../../services/gameEngine'
import { audioService } from '../../services/audio'
import { app } from '../../App'
import { POWERUP_ICONS } from './config'
import { createFallingCrumbs } from './particles'

export interface GameState {
  cookies: Cookie[]
  particles: Particle[]
  slices: Slice[]
  combo: number
  lastSpawn: number
  gameStartTime: number
  gameEnded: boolean
  inventory: string[]
  shakeIntensity: number // 屏幕震动强度
}

/**
 * 创建初始游戏状态
 */
export function createInitialState(): GameState {
  return {
    cookies: [],
    particles: [],
    slices: [],
    combo: 0,
    lastSpawn: 0,
    gameStartTime: Date.now(),
    gameEnded: false,
    inventory: [],
    shakeIntensity: 0
  }
}

/**
 * 更新 HTML 道具栏
 */
export function updateHTMLPowerupBar(inventory: string[]): void {
  const powerups = Object.keys(POWERUP_ICONS).map(id => ({
    id,
    icon: POWERUP_ICONS[id],
    name: id
  }))
  
  // 注意：这里需要根据实际的 app API 调整
  if ((app as any).setupCustomPowerupBar) {
    ;(app as any).setupCustomPowerupBar('cookieCut', powerups, inventory, (powerupId: string) => {
      if (usePowerup(powerupId, inventory)) {
        audioService.collect()
      }
    })
  }
}

/**
 * 使用道具
 */
export function usePowerup(type: string, inventory: string[]): boolean {
  const index = inventory.indexOf(type)
  if (index === -1) return false
  
  inventory.splice(index, 1)
  console.log('[道具] 使用道具:', type)
  
  switch (type) {
    case 'slow':
      // 减速 - 饼干速度减半，持续8秒
      ;(window as any).cookieSlow = Date.now() + 8000
      audioService.collect()
      console.log('[道具] 减速生效，持续8秒')
      break
      
    case 'score2x':
      // 双倍分数 - 10秒内×2
      ;(window as any).cookieScore2x = Date.now() + 10000
      audioService.win()
      console.log('[道具] 双倍分数生效，持续10秒')
      break
      
    case 'freeze':
      // 冻结 - 暂停所有饼干3秒
      ;(window as any).cookieFreeze = Date.now() + 3000
      audioService.win()
      console.log('[道具] 冻结生效，持续3秒')
      break
      
    case 'magnet':
      // 磁铁 - 自动吸引附近饼干，持续6秒
      ;(window as any).cookieMagnet = Date.now() + 6000
      audioService.win()
      console.log('[道具] 磁铁生效，持续6秒')
      break
  }
  
  return true
}

/**
 * 处理切割成功
 */
export function handleCookieSlice(
  engine: GameEngine,
  state: GameState,
  cookieX: number,
  cookieY: number,
  createParticles: (x: number, y: number) => Particle[]
): void {
  state.combo++
  engine.addScore(15 * state.combo, cookieX, cookieY)
  
  // 播放切割音效（根据连击数）
  if (state.combo >= 3) {
    audioService.sliceCombo(state.combo)
  } else {
    audioService.slice()
  }
  
  // 屏幕震动（连击越高，震动越强）
  state.shakeIntensity = Math.min(10, 3 + state.combo * 0.8)
  
  // 生成饼干碎屑粒子（爆炸效果）
  const newParticles = createParticles(cookieX, cookieY)
  state.particles.push(...newParticles)
  
  // 添加持续掉落的碎屑（掉渣效果 - 像雪花粉末一样飘落到底部）
  setTimeout(() => {
    const fallingCrumbs = createFallingCrumbs(cookieX, cookieY, 20) // 增加到20个
    state.particles.push(...fallingCrumbs)
  }, 100)
  
  setTimeout(() => {
    const moreCrumbs = createFallingCrumbs(cookieX, cookieY + 20, 15) // 增加到15个
    state.particles.push(...moreCrumbs)
  }, 250)
  
  // 连击奖励
  if (state.combo >= 3) {
    engine.triggerRandomBuff()
  }
}
