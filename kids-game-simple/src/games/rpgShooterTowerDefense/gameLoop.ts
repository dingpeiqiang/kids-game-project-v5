// RPG塔防射击 - 游戏循环模块
// 负责每帧逻辑更新（波次、玩家、敌人、炮台、特效等）

import type { GameState } from './types'
import { updateWaveSystem } from './waves'
import { updatePlayer, playerShoot, drawProjectiles } from './combat'
import { updateTurrets, canPlaceTurret, placeTurret, upgradeTurret, sellTurret, updateWalls } from './turrets'
import { updateEnemies, drawEnemy } from './enemies'
import { updateEnemyBullets, drawEnemyBullets } from './enemyBullets'
import { updateProjectiles } from './combat'
import { updateTraps, drawTrap } from './traps'
import { updatePowerups, drawPowerups } from './powerups'  // 新增道具系统
import { resetCombo } from './state'

// 音效类型（简化版，与 init.ts 内联 playSound 兼容）
export type PlaySoundFn = (type: 'select' | 'build' | 'upgrade' | 'sell' | 'shoot' | 'explosion' | 'hit') => void

/**
 * 每帧更新游戏逻辑
 * 从 init.ts 迁移而来（原 updateGame 函数，行 650-725）
 */
export function updateGame(
  state: GameState,
  dt: number,
  now: number,
  playSound: PlaySoundFn,
  onEnd?: () => void,
  cleanup?: () => void
): void {
  // 波次系统
  updateWaveSystem(state, dt)

  // 玩家移动 + 自动攻击
  updatePlayer(state, dt)

  // 连击计时器衰减
  if (state.combo.timer > 0) {
    state.combo.timer -= dt
    if (state.combo.timer <= 0) resetCombo(state)
  }

  // 屏幕震动衰减
  if (state.shakeAmt > 0) {
    state.shakeAmt *= 0.9
    if (state.shakeAmt < 0.5) state.shakeAmt = 0
  }

  // 屏幕闪光衰减
  if (state.screenFlash > 0) {
    state.screenFlash -= dt * 2
    if (state.screenFlash < 0) state.screenFlash = 0
  }

  // ✅ 玩家自动攻击已在 updatePlayer 中调用，此处不再重复调用
  // 避免双重射击导致性能问题

  // 更新各系统
  updateTurrets(state, now)
  updateWalls(state, dt)
  updateEnemies(state, dt)
  updateEnemyBullets(state, dt)
  updateProjectiles(state, dt)
  updateTraps(state, dt)
  updatePowerups(state, dt)  // 新增：更新道具

  // 粒子更新
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i]
    p.x += p.vx * 60 * dt
    p.y += p.vy * 60 * dt
    p.life -= dt
    if (p.life <= 0) state.particles.splice(i, 1)
  }

  // 浮动文字更新
  for (let i = state.floatTexts.length - 1; i >= 0; i--) {
    const text = state.floatTexts[i]
    text.y += text.vy * 60 * dt
    text.life -= dt
    if (text.life <= 0) state.floatTexts.splice(i, 1)
  }

  // 屏幕震动衰减（二次，确保平滑）
  if (state.shakeAmt > 0) {
    state.shakeAmt *= 0.9
    if (state.shakeAmt < 0.5) state.shakeAmt = 0
  }

  // 屏幕闪光衰减（二次）
  if (state.screenFlash > 0) {
    state.screenFlash -= dt * 2
    if (state.screenFlash < 0) state.screenFlash = 0
  }

  // 游戏结束检查
  if (state.gameEnded && !state.gameEndProcessed) {
    state.gameEndProcessed = true
    if (onEnd) setTimeout(onEnd, 2000)
  }
}
