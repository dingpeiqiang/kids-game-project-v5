// RPG Shooter 塔防融合版 - 波次管理系统

import type { GameState, EnemyType } from './types'
import { getWaveConfig, TOTAL_WAVES } from './config'
import { spawnEnemyFromEdge } from './enemies'
import { startWave, startBreak } from './state'
import { playSound, bgmManager } from './sounds'

// 初始化波次系统
export function initWaveSystem(state: GameState): void {
  state.wave = 0
  state.waveInProgress = false
  state.breakTime = 10  // 开始前给10秒准备时间
  state.enemySpawnQueue = []
  state.spawnTimer = 0
}

// 更新波次系统
export function updateWaveSystem(state: GameState, dt: number): void {
  // 游戏未开始
  if (!state.gameStarted) return
  
  // 游戏已结束
  if (state.gameEnded) return
  
  // 休息时间
  if (!state.waveInProgress) {
    updateBreakTime(state, dt)
    return
  }
  
  // 波次进行中
  updateWaveProgress(state, dt)
  
  // 生成敌人
  updateEnemySpawning(state, dt)
  
  // 检查波次结束
  checkWaveEnd(state)
}

// 更新休息时间
function updateBreakTime(state: GameState, dt: number): void {
  if (state.breakTime > 0) {
    state.breakTime -= dt
    
    // 倒计时显示
    if (Math.floor(state.breakTime) !== Math.floor(state.breakTime + dt)) {
      const seconds = Math.ceil(state.breakTime)
      if (seconds > 0) {
        state.floatTexts.push({
          text: `⏱️ ${seconds}秒后开始`,
          x: 200,
          y: 300,
          life: 1,
          color: '#4ECDC4',
          size: 20,
          vy: -0.3
        })
      }
    }
    
    if (state.breakTime <= 0) {
      // 开始新波次
      const nextWave = state.wave + 1
      if (nextWave <= TOTAL_WAVES) {
        startNewWave(state, nextWave)
      } else {
        // 所有波次完成，胜利
        victory(state)
      }
    }
  } else if (state.wave === 0) {
    // 第一波前的准备时间结束
    startNewWave(state, 1)
  }
}

// 开始新波次
function startNewWave(state: GameState, waveNumber: number): void {
  const waveConfig = getWaveConfig(waveNumber)
  
  startWave(state, waveNumber)
  
  // 构建敌人生成队列
  buildSpawnQueue(state, waveConfig)
  
  // 波次开始提示
  playSound('waveStart')

  setTimeout(() => {
    if (!state.gameEnded) {
      state.floatTexts.push({
        text: `⚔️ 第${waveNumber}波开始!`,
        x: 200,
        y: 300,
        life: 2,
        color: '#FF6B6B',
        size: 28,
        vy: -0.5
      })
    }
  }, 500)
}

// 构建敌人生成队列
function buildSpawnQueue(
  state: GameState,
  waveConfig: ReturnType<typeof getWaveConfig>
): void {
  state.enemySpawnQueue = []
  
  for (const enemyConfig of waveConfig.enemies) {
    const count = enemyConfig.count
    const interval = enemyConfig.spawnInterval
    
    for (let i = 0; i < count; i++) {
      state.enemySpawnQueue.push({
        type: enemyConfig.type,
        delay: i * interval
      })
    }
  }
  
  // 按延迟排序
  state.enemySpawnQueue.sort((a, b) => a.delay - b.delay)
  
  // Boss战特殊处理
  if (waveConfig.boss) {
    // 在波次中途生成Boss
    const midDelay = waveConfig.duration * 1000 / 2
    state.enemySpawnQueue.push({
      type: 'boss',
      delay: midDelay
    })
  }
}

// 更新波次进度（无时间限制，波次持续到清完所有敌人）
function updateWaveProgress(state: GameState, dt: number): void {
  // 波次无时间限制，timeLeft 仅用于 UI 显示（设为 Infinity 表示不限时）
  // 不再递减 timeLeft，不再触发时间警告
}

// 更新敌人生成
function updateEnemySpawning(state: GameState, dt: number): void {
  state.spawnTimer += dt * 1000  // 转换为毫秒
  
  // 检查队列中的敌人
  while (state.enemySpawnQueue.length > 0) {
    const nextEnemy = state.enemySpawnQueue[0]
    
    if (state.spawnTimer >= nextEnemy.delay) {
      // 生成敌人
      spawnEnemyFromEdge(state, nextEnemy.type)
      
      // 从队列移除
      state.enemySpawnQueue.shift()
    } else {
      break
    }
  }
}

// 检查波次结束（无时间限制：敌人全部消灭 → 波次结束）
function checkWaveEnd(state: GameState): void {
  // 生成队列清空 + 场上无敌人 → 波次结束
  if (state.enemySpawnQueue.length === 0 && state.enemies.length === 0) {
    endWave(state)
  }
}

// 结束当前波次
function endWave(state: GameState): void {
  state.waveInProgress = false

  // ✅ 固定 15 秒休息时间（清完敌人后等待 15s 再开始下一波）
  startBreak(state, 15)
  
  // 波次完成奖励
  const bonusCrystals = 50 + state.wave * 20
  import('./state').then(({ addCrystals }) => {
    addCrystals(state, bonusCrystals)
  })
  
state.floatTexts.push({
    text: `✅ 第${state.wave}波完成! +${bonusCrystals}💎`,
    x: 200,
    y: 300,
    life: 3,
    color: '#00E676',
    size: 24,
    vy: -0.5
  })

  // 播放波次完成音效
  playSound('waveComplete')

  // 重置生成计时器
  state.spawnTimer = 0
}

// 胜利
function victory(state: GameState): void {
  state.gameEnded = true

  // 停止BGM并播放胜利音效
  bgmManager.stop()
  playSound('waveComplete')
  setTimeout(() => playSound('levelUp'), 300)
  setTimeout(() => playSound('levelUp'), 600)

  state.floatTexts.push({
    text: '🎉 胜利!',
    x: 200,
    y: 280,
    life: 5,
    color: '#FFD700',
    size: 36,
    vy: -0.5
  })
  
  setTimeout(() => {
    state.floatTexts.push({
      text: `最终得分: ${state.resources.score}`,
      x: 200,
      y: 320,
      life: 5,
      color: '#fff',
      size: 20,
      vy: -0.3
    })
  }, 1000)
  
  // 胜利特效
  for (let i = 0; i < 100; i++) {
    setTimeout(() => {
      if (!state.gameStarted) return
      const x = Math.random() * 400
      const y = Math.random() * 600
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 2,
        maxLife: 2,
        color: ['#FFD700', '#FF6B6B', '#00E5FF', '#00E676'][Math.floor(Math.random() * 4)],
        size: 4 + Math.random() * 4
      })
    }, i * 30)
  }
}

// 强制结束波次（玩家死亡时调用）
export function forceEndWave(state: GameState): void {
  state.waveInProgress = false
  state.gameEnded = true
  state.enemySpawnQueue = []

  // 停止BGM并播放游戏结束音效
  bgmManager.stop()
  playSound('gameOver')

  state.floatTexts.push({
    text: '💀 游戏结束',
    x: 200,
    y: 280,
    life: 5,
    color: '#FF4757',
    size: 32,
    vy: -0.5
  })
  
  setTimeout(() => {
    state.floatTexts.push({
      text: `到达波次: ${state.wave}/8`,
      x: 200,
      y: 320,
      life: 5,
      color: '#fff',
      size: 18,
      vy: -0.3
    })
  }, 1000)
}

// 获取当前波次信息
export function getCurrentWaveInfo(state: GameState) {
  if (state.wave === 0) {
    return {
      current: 0,
      total: TOTAL_WAVES,
      inProgress: false,
      breakTime: state.breakTime
    }
  }
  
  return {
    current: state.wave,
    total: TOTAL_WAVES,
    inProgress: state.waveInProgress,
    timeLeft: state.timeLeft,
    enemiesRemaining: state.enemies.length + state.enemySpawnQueue.length
  }
}
