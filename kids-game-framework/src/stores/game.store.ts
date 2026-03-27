/**
 * 📊 通用游戏状态 Store
 * 
 * 管理游戏运行时通用状态：得分、难度、游戏时长等。
 * 
 * ⚠️ 重要：此 Store 包含基础游戏状态管理。
 *    游戏特定的运行时数据（如 snake, food）应该在各游戏自己的 store 中管理。
 * 
 * ⚠️ 关键：Pinia useGameStore() 必须在 Vue 组件 setup 上下文中调用，
 *    不能在 Phaser class 内部调用（会导致热更新后方法丢失）。
 *    解决方案：在 Vue 组件中注入回调函数到 Phaser class。
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { DEFAULT_DIFFICULTY_CONFIGS } from '../types/game.types'
import { getSessionToken, isStandaloneMode, reportGameResult, getGameId } from '../utils/platform-api'
import type { Difficulty, DifficultyConfig, ItemEffectsState } from '../types/game.types'

// 游戏事件类型
export type GameEventType = 'start' | 'pause' | 'resume' | 'gameover' | 'score' | 'levelup'
type GameEventCallback = (event: GameEventType, data?: any) => void

export const useGameStore = defineStore('kids-game', () => {

  // ============================================================================
  // 📊 通用游戏状态
  // ============================================================================

  const isPlaying = ref(false)
  const isPaused = ref(false)
  const isGameOver = ref(false)
  const score = ref(0)
  const highScore = ref(0)
  const playCount = ref(0)
  const difficulty = ref<Difficulty>('medium')

  // 游戏特定的状态应在各游戏自己的 store 中管理
  // 例如：snakeLength（贪吃蛇）、cards（卡牌游戏）等

  // 独立部署模式
  const standaloneMode = ref(isStandaloneMode())
  const sessionToken = ref(getSessionToken())
  const gameId = ref(getGameId())
  const gameStartTime = ref<number | null>(null)

  // 游戏事件回调
  let eventCallback: GameEventCallback | null = null

  // 设置事件回调
  const setEventCallback = (callback: GameEventCallback) => {
    eventCallback = callback
  }

  // 触发事件
  const emitEvent = (event: GameEventType, data?: any) => {
    if (eventCallback) {
      eventCallback(event, data)
    }
  }

  // ============================================================================
  // 🎁 道具效果状态（通用框架）
  // ============================================================================

  const itemEffects = ref<ItemEffectsState>({
    speedMultiplier: 1.0,
    scoreMultiplier: 1.0,
    hasShield: false,
    hasMagnet: false,
    activeEffects: []
  })

  const itemTimers = new Map<string, ReturnType<typeof setTimeout>>()

  /**
   * 重置所有道具效果（游戏开始/结束时调用）
   */
  const resetItemEffects = () => {
    itemTimers.forEach(timer => clearTimeout(timer))
    itemTimers.clear()
    itemEffects.value.speedMultiplier = 1.0
    itemEffects.value.scoreMultiplier = 1.0
    itemEffects.value.hasShield = false
    itemEffects.value.hasMagnet = false
    itemEffects.value.activeEffects = []
  }

  // ============================================================================
  // 💾 存储功能
  // ============================================================================

  // 从 localStorage 加载
  const loadFromStorage = (storageKey: string = 'game-state') => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const data = JSON.parse(saved)
        highScore.value = data.highScore || 0
        playCount.value = data.playCount || 0
        difficulty.value = data.difficulty || 'medium'
      }
    } catch (e) {
      console.error('Failed to load game state:', e)
    }
  }

  // 保存到 localStorage
  const saveToStorage = (storageKey: string = 'game-state') => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        highScore: highScore.value,
        playCount: playCount.value,
        difficulty: difficulty.value
      }))
    } catch (e) {
      console.error('Failed to save game state:', e)
    }
  }

  // 计算游戏时长（秒）
  const getGameDuration = (): number => {
    if (!gameStartTime.value) return 0
    return Math.floor((Date.now() - gameStartTime.value) / 1000)
  }

  // ============================================================================
  // 🎮 游戏生命周期方法（通用）
  // ============================================================================

  // 开始游戏
  const startGame = () => {
    score.value = 0
    isPlaying.value = true
    isPaused.value = false
    isGameOver.value = false
    playCount.value++
    gameStartTime.value = Date.now()
    resetItemEffects()
    saveToStorage()
  }

  // 结束游戏
  const endGame = (storageKey: string = 'game-state') => {
    isPlaying.value = false
    isGameOver.value = true
    emitEvent('gameover')
    resetItemEffects()
    if (score.value > highScore.value) {
      highScore.value = score.value
      saveToStorage(storageKey)
    }
    
    // 如果是独立部署模式，自动提交成绩到平台
    if (standaloneMode.value && sessionToken.value) {
      submitScoreToPlatform()
    }
  }

  // 提交成绩到平台
  const submitScoreToPlatform = async () => {
    const duration = getGameDuration()
    const token = sessionToken.value
    
    if (!token) {
      console.warn('[GameStore] 无 sessionToken，跳过成绩上报')
      return
    }
    
    try {
      const result = await reportGameResult({
        sessionToken: token,
        score: score.value,
        duration,
        level: difficulty.value === 'easy' ? 1 : difficulty.value === 'medium' ? 2 : 3,
        isWin: true
      })
      
      if (result.success) {
        console.log('✅ 成绩上报成功')
      }
    } catch (error) {
      console.warn('⚠️ 成绩上报失败:', error)
    }
  }

  // 暂停/继续
  const togglePause = () => {
    isPaused.value = !isPaused.value
    if (isPaused.value) {
      emitEvent('pause')
    } else {
      emitEvent('resume')
    }
  }

  // 增加分数
  const addScore = (points: number) => {
    const multiplied = Math.round(points * itemEffects.value.scoreMultiplier)
    score.value += multiplied
    emitEvent('score', { score: score.value, added: multiplied })
    if (score.value > highScore.value) {
      highScore.value = score.value
      saveToStorage()
    }
  }

  // 设置难度
  const setDifficulty = (diff: Difficulty, storageKey: string = 'game-state') => {
    difficulty.value = diff
    saveToStorage(storageKey)
  }

  // 获取当前难度配置
  const currentConfig = computed(() => DEFAULT_DIFFICULTY_CONFIGS[difficulty.value])

  // ============================================================================
  // 📤 导出
  // ============================================================================

  return {
    // 状态
    isPlaying,
    isPaused,
    isGameOver,
    score,
    highScore,
    playCount,
    difficulty,
    // 游戏特定状态应在各游戏自己的 store 中管理
    // 独立部署模式
    standaloneMode,
    sessionToken,
    gameId,
    gameStartTime,
    // 道具效果
    itemEffects,
    // 方法
    startGame,
    endGame,
    getGameDuration,
    submitScoreToPlatform,
    togglePause,
    addScore,
    setDifficulty,
    resetItemEffects,
    loadFromStorage,
    saveToStorage,
    setEventCallback,
    emitEvent,
    // 计算属性
    currentConfig
  }
})
