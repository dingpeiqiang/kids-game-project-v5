/**
 * 通用游戏状态管理
 * 所有游戏共用的核心状态
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Difficulty, GameStatus, ScoreRecord, GameEventCallback, GameEvent } from '../types/game.types'
import { getSessionToken, getGameId, reportGameResult } from '../utils/platformApi'

export const useGameStore = defineStore('game', () => {
  // ========== 基础游戏状态 ==========
  const status = ref<GameStatus>(GameStatus.IDLE)
  const score = ref(0)
  const highScore = ref(0)
  const playCount = ref(0)
  const difficulty = ref<Difficulty>('medium')
  const currentLevel = ref(1)
  const gameStartTime = ref<number | null>(null)
  const gameEndTime = ref<number | null>(null)

  // ========== 独立部署模式相关 ==========
  const standaloneMode = ref(false)
  const sessionToken = ref<string | null>(null)
  const gameId = ref<number | null>(null)
  const sessionId = ref<number | null>(null)

  // ========== 游戏事件回调 ==========
  let eventCallback: GameEventCallback | null = null

  // ========== 初始化 ==========
  const init = () => {
    // 检测是否为独立部署模式
    standaloneMode.value = !!getSessionToken()
    sessionToken.value = getSessionToken()
    gameId.value = getGameId()
    
    // 加载本地存储
    loadFromStorage()
  }

  // ========== 本地存储管理 ==========
  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem('game-state')
      if (saved) {
        const data = JSON.parse(saved)
        highScore.value = data.highScore || 0
        playCount.value = data.playCount || 0
        difficulty.value = data.difficulty || 'medium'
      }
    } catch (e) {
      console.error('加载游戏状态失败:', e)
    }
  }

  const saveToStorage = () => {
    try {
      localStorage.setItem('game-state', JSON.stringify({
        highScore: highScore.value,
        playCount: playCount.value,
        difficulty: difficulty.value
      }))
    } catch (e) {
      console.error('保存游戏状态失败:', e)
    }
  }

  // ========== 游戏控制 ==========
  const startGame = () => {
    status.value = GameStatus.PLAYING
    score.value = 0
    playCount.value++
    gameStartTime.value = Date.now()
    gameEndTime.value = null
    saveToStorage()
    emitEvent({ type: 'game_start' })
  }

  const pauseGame = () => {
    if (status.value === GameStatus.PLAYING) {
      status.value = GameStatus.PAUSED
      emitEvent({ type: 'game_pause' })
    }
  }

  const resumeGame = () => {
    if (status.value === GameStatus.PAUSED) {
      status.value = GameStatus.PLAYING
      emitEvent({ type: 'game_resume' })
    }
  }

  const endGame = (isVictory: boolean = false) => {
    status.value = isVictory ? GameStatus.VICTORY : GameStatus.GAME_OVER
    gameEndTime.value = Date.now()
    
    // 更新最高分
    if (score.value > highScore.value) {
      highScore.value = score.value
      saveToStorage()
    }
    
    // 触发结束事件
    emitEvent({ 
      type: isVictory ? 'victory' : 'game_over',
      data: { score: score.value, duration: getGameDuration() }
    })
    
    // 独立部署模式自动上报成绩
    if (standaloneMode.value && sessionToken.value) {
      submitScoreToPlatform(isVictory)
    }
  }

  // ========== 分数管理 ==========
  const addScore = (points: number) => {
    score.value += points
    emitEvent({ 
      type: 'score_change',
      data: { score: score.value, points }
    })
  }

  const setScore = (newScore: number) => {
    score.value = newScore
    emitEvent({ 
      type: 'score_change',
      data: { score: newScore }
    })
  }

  // ========== 等级管理 ==========
  const levelUp = () => {
    currentLevel.value++
    emitEvent({ 
      type: 'level_up',
      data: { level: currentLevel.value }
    })
  }

  const setLevel = (level: number) => {
    currentLevel.value = level
  }

  // ========== 难度管理 ==========
  const setDifficulty = (diff: Difficulty) => {
    difficulty.value = diff
    saveToStorage()
  }

  // ========== 游戏时长 ==========
  const getGameDuration = (): number => {
    if (!gameStartTime.value) return 0
    const endTime = gameEndTime.value || Date.now()
    return Math.floor((endTime - gameStartTime.value) / 1000)
  }

  // ========== 成绩上报 ==========
  const submitScoreToPlatform = async (isVictory: boolean = true) => {
    const duration = getGameDuration()
    const token = sessionToken.value
    
    if (!token) {
      console.warn('[GameStore] 无 sessionToken，跳过成绩上报')
      return
    }
    
    console.log('[GameStore] 提交成绩到平台:', {
      token: token?.substring(0, 8) + '...',
      score: score.value,
      duration,
      level: currentLevel.value
    })
    
    try {
      const result = await reportGameResult({
        sessionToken: token,
        score: score.value,
        duration,
        level: currentLevel.value,
        isWin: isVictory,
        details: {
          highScore: highScore.value,
          playCount: playCount.value,
          difficulty: difficulty.value
        }
      })
      
      if (result.success) {
        console.log('✅ 成绩上报成功，消耗疲劳点:', result.consumePoints)
      } else {
        console.info('ℹ️ 成绩上报未成功（不影响游戏）:', result.message)
      }
    } catch (error) {
      console.warn('⚠️ 成绩上报失败:', error instanceof Error ? error.message : '未知错误')
    }
  }

  // ========== 事件系统 ==========
  const setEventCallback = (callback: GameEventCallback) => {
    eventCallback = callback
  }

  const emitEvent = (event: GameEvent) => {
    if (eventCallback) {
      eventCallback(event)
    }
  }

  // ========== 计算属性 ==========
  const isPlaying = computed(() => status.value === GameStatus.PLAYING)
  const isPaused = computed(() => status.value === GameStatus.PAUSED)
  const isGameOver = computed(() => status.value === GameStatus.GAME_OVER)
  const isVictory = computed(() => status.value === GameStatus.VICTORY)

  // ========== 初始化 ==========
  init()

  return {
    // 状态
    status,
    score,
    highScore,
    playCount,
    difficulty,
    currentLevel,
    gameStartTime,
    gameEndTime,
    // 独立部署模式
    standaloneMode,
    sessionToken,
    gameId,
    sessionId,
    // 方法
    init,
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    addScore,
    setScore,
    levelUp,
    setLevel,
    setDifficulty,
    getGameDuration,
    submitScoreToPlatform,
    setEventCallback,
    emitEvent,
    // 计算属性
    isPlaying,
    isPaused,
    isGameOver,
    isVictory
  }
})
