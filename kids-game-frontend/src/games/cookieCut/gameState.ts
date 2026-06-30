/**
 * 切饼干游戏 - 游戏状态管理
 */

import type { Cookie, Particle, Slice, Shockwave, ScorePopup, LevelTransition } from './types'
import type { GameEngine } from '@shell/services/gameEngine'
import { gameActions } from '@shell/platform/gameBridge'
import { audioService } from '@shell/services/audio'
import { app } from '@shell/services/appBridge'
import { POWERUP_ICONS } from './config'
import { createFallingCrumbs } from './particles'

export interface GameState {
  cookies: Cookie[]
  particles: Particle[]
  slices: Slice[]
  shockwaves: Shockwave[]
  scorePopups: ScorePopup[]
  combo: number
  lastSpawn: number
  gameStartTime: number
  gameEnded: boolean
  inventory: string[]
  shakeIntensity: number // 屏幕震动强度
  transition: LevelTransition // 关卡过渡动画状态
}

/**
 * 创建初始游戏状态
 */
export function createInitialState(): GameState {
  return {
    cookies: [],
    particles: [],
    slices: [],
    shockwaves: [],
    scorePopups: [],
    combo: 0,
    lastSpawn: 0,
    gameStartTime: Date.now(),
    gameEnded: false,
    inventory: [],
    shakeIntensity: 0,
    transition: {
      active: false,
      level: 1,
      name: '',
      progress: 0,
      direction: 'in'
    }
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
  
  switch (type) {
    case 'slow':
      // 减速 - 饼干速度减半，持续8秒
      ;(window as any).cookieSlow = Date.now() + 8000
      audioService.collect()
      break
      
    case 'score2x':
      // 双倍分数 - 10秒内×2
      ;(window as any).cookieScore2x = Date.now() + 10000
      audioService.win()
      break
      
    case 'freeze':
      // 冻结 - 暂停所有饼干3秒
      ;(window as any).cookieFreeze = Date.now() + 3000
      audioService.win()
      break
      
    case 'magnet':
      // 磁铁 - 自动吸引附近饼干，持续6秒
      ;(window as any).cookieMagnet = Date.now() + 6000
      audioService.win()
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
  const score = 30 * state.combo // 翻倍分数，更爽！
  gameActions.addScore(score, cookieX, cookieY)
  
  // 播放切割音效（根据连击数）
  if (state.combo >= 3) {
    audioService.sliceCombo(state.combo)
  } else {
    audioService.slice()
  }
  
  // 屏幕震动（平衡版）
  state.shakeIntensity = Math.min(25, 6 + state.combo * 2)
  
  // 优化冲击波：减少数量但保持视觉效果
  const SHOCKWAVE_COLORS = ['#FF6B6B', '#FFD700', '#FF9F43']
  state.shockwaves.push({
    x: cookieX,
    y: cookieY,
    radius: 0,
    maxRadius: 100 + state.combo * 20,
    life: 1,
    color: SHOCKWAVE_COLORS[Math.floor(Math.random() * SHOCKWAVE_COLORS.length)]
  })
  
  // 连击高时只加1个额外冲击波
  if (state.combo >= 5) {
    state.shockwaves.push({
      x: cookieX,
      y: cookieY,
      radius: 0,
      maxRadius: 150 + state.combo * 25,
      life: 1,
      color: state.combo >= 10 ? '#FF0000' : '#FFD700'
    })
  }
  
  // 添加分数飘字
  state.scorePopups.push({
    x: cookieX,
    y: cookieY,
    score,
    life: 1,
    combo: state.combo
  })
  
  // 生成饼干碎屑粒子（爆炸效果）
  const newParticles = createParticles(cookieX, cookieY)
  state.particles.push(...newParticles)
  
  // 添加持续掉落的碎屑（掉渣效果）
  setTimeout(() => {
    const fallingCrumbs = createFallingCrumbs(cookieX, cookieY, 10)
    state.particles.push(...fallingCrumbs)
  }, 80)
  
  // 连击奖励
  if (state.combo >= 3) {
    engine.triggerRandomBuff()
  }
}
