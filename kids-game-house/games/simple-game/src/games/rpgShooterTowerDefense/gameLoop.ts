// RPG塔防射击 - 游戏循环模块
// 负责游戏主循环、状态更新、碰撞检测等核心逻辑

import type { GameState } from './types'
import { updatePlayer, playerShoot } from './combat'
import { updateProjectiles } from './combat'
import { updateTurrets } from './turrets'
import { updateEnemies } from './enemies'
import { updateTraps } from './traps'
import { updateWaveSystem } from './waves'
import { resetCombo } from './state'
import { updateEnemyBullets } from './enemyBullets'

/**
 * 游戏主循环
 */
export function gameLoop(
  state: GameState,
  ctx: CanvasRenderingContext2D,
  renderFn: (ctx: CanvasRenderingContext2D, state: GameState) => void,
  cleanupFn: () => void,
  onEndFn: () => void,
  lastTimeRef: { value: number }  // 使用引用传递时间
): number {
  const currentTime = performance.now()
  const dt = Math.min((currentTime - lastTimeRef.value) / 1000, 0.1) // 限制最大dt防止跳帧
  lastTimeRef.value = currentTime
  
  // 更新逻辑
  if (state.gameStarted && !state.gameEnded) {
    updateGame(state, dt, currentTime)
  }
  
  // 渲染
  renderFn(ctx, state)
  
  return requestAnimationFrame(() => 
    gameLoop(state, ctx, renderFn, cleanupFn, onEndFn, lastTimeRef)
  )
}

/**
 * 更新游戏状态
 */
function updateGame(state: GameState, dt: number, now: number) {
  // 波次系统
  updateWaveSystem(state, dt)
  
  // 玩家更新
  updatePlayer(state, dt)
  
  // 连击计时器
  if (state.combo.timer > 0) {
    state.combo.timer -= dt
    if (state.combo.timer <= 0) {
      resetCombo(state)
    }
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
  
  // 记录射击前的投射物数量
  const projectileCountBefore = state.projectiles.length
  
  // 玩家自动攻击
  playerShoot(state, now)
  
  // 如果产生了新的投射物，播放射击音效（由调用方处理）
  const shouldPlayShootSound = state.projectiles.length > projectileCountBefore
  
  // 炮台更新
  updateTurrets(state, now)
  
  // 敌人更新
  updateEnemies(state, dt)
  
  // 敌人子弹更新
  updateEnemyBullets(state, dt)
  
  // 投射物更新
  updateProjectiles(state, dt)
  
  // 陷阱更新
  updateTraps(state, dt)
  
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
  
  // 检查游戏结束
  if (state.gameEnded) {
    setTimeout(() => {
      onEndFn()
    }, 2000)
  }
  
  // 返回是否需要播放射击音效
  return shouldPlayShootSound
}
