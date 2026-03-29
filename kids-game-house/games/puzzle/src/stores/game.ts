/**
 * 🎮 游戏通用 Store（模板版）
 *
 * 包含所有游戏共用的状态与逻辑：
 * - 游戏生命周期（开始/结束/暂停/继续）
 * - 分数系统（带关卡倍率）
 * - 关卡系统（20 关渐进式难度）
 * - 持久化（localStorage）
 * - 平台集成（成绩上报）
 * - 事件系统（解耦 Phaser ↔ Vue）
 *
 * ⚠️  游戏特有逻辑（碰撞检测、角色移动等）不在此文件中实现，
 *      由 scenes/GameScene.ts 负责，通过事件系统与此 store 通信。
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  type LevelConfig,
  type LevelProgress,
  type LevelTransition,
  getLevelConfig,
} from '@/types/level'

// ── 类型 ────────────────────────────────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard'

export type GameEventType = 'score' | 'gameover' | 'levelup' | 'level_complete' | 'pause' | 'resume'
type GameEventCallback = (event: GameEventType, data?: any) => void

/**
 * 自定义游戏配置（从难度选择页面传入，覆盖预设值）
 * null 表示完全使用难度预设
 */
export interface CustomGameConfig {
  /** 游戏速度（覆盖难度预设，含义由具体游戏决定） */
  speed?: number
  /** 普通目标分数 */
  normalFoodScore?: number
  /** 奖励目标分数 */
  bonusFoodScore?: number
  /** 特殊道具分数 */
  specialFoodScore?: number
  /** 是否启用动态难度 */
  enableDynamicDifficulty?: boolean
  /** 是否开启粒子效果 */
  enableParticles?: boolean
  /** 是否在失焦时自动暂停 */
  autoPauseOnBlur?: boolean
  /** BGM 音量 0-1 */
  bgmVolume?: number
  /** SFX 音量 0-1 */
  sfxVolume?: number
  /** 静音 */
  muted?: boolean
}

// ── localStorage key（使用游戏 ID 以避免多游戏冲突） ─────────────────────────
// 在 init-game 脚本中 puzzle 会被替换为真实 ID
const STORAGE_KEY_STATE    = 'puzzle-game-state'
const STORAGE_KEY_PROGRESS = 'puzzle-level-progress'

// ── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = defineStore('game', () => {

  // ─── 通用游戏状态 ──────────────────────────────────────────────────────────
  const isPlaying   = ref(false)
  const isPaused    = ref(false)
  const isGameOver  = ref(false)
  const score       = ref(0)
  const highScore   = ref(0)
  const playCount   = ref(0)
  const difficulty  = ref<Difficulty>('medium')

  // 自定义游戏配置（从 DifficultyView 传入）
  const customConfig = ref<CustomGameConfig | null>(null)

  /** 设置自定义配置 */
  const setCustomConfig = (cfg: CustomGameConfig | null) => {
    customConfig.value = cfg
  }

  /** 设置难度 */
  const setDifficulty = (d: Difficulty) => {
    difficulty.value = d
  }

  // ─── 关卡系统状态 ──────────────────────────────────────────────────────────
  const currentLevel = ref(1)
  const levelConfig  = ref<LevelConfig>(getLevelConfig(1, 'medium'))
  const levelTransition = ref<LevelTransition>({
    isActive    : false,
    fromLevel   : 0,
    toLevel     : 0,
    toLevelName : '',
  })
  const levelProgress = ref<LevelProgress>({
    maxUnlockedLevel : 1,
    levelHighScores  : {},
  })

  // 加载关卡进度
  const loadLevelProgress = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROGRESS)
      if (saved) {
        const data = JSON.parse(saved) as LevelProgress
        levelProgress.value = data
        console.log('🏰 关卡进度已加载:', data)
      }
    } catch (e) {
      console.error('加载关卡进度失败:', e)
    }
  }

  // 保存关卡进度
  const saveLevelProgress = () => {
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(levelProgress.value))
    } catch (e) {
      console.error('保存关卡进度失败:', e)
    }
  }

  /**
   * 初始化关卡（游戏开始时调用）
   * 从第 1 关开始
   */
  const initLevel = () => {
    currentLevel.value = 1
    levelConfig.value  = getLevelConfig(1, difficulty.value)
    levelTransition.value = { isActive: false, fromLevel: 0, toLevel: 0, toLevelName: '' }
    console.log('🏰 关卡系统已初始化，第 1 关:', levelConfig.value.name)
  }

  /**
   * 检查是否需要升级（在 addScore 之后调用）
   */
  const checkLevelUp = (): boolean => {
    if (score.value >= levelConfig.value.scoreToNext) {
      const nextLevel = currentLevel.value + 1
      if (nextLevel > 20) return false

      const nextConfig = getLevelConfig(nextLevel, difficulty.value)

      currentLevel.value = nextLevel
      levelConfig.value  = nextConfig

      // 更新解锁进度
      if (nextLevel > levelProgress.value.maxUnlockedLevel) {
        levelProgress.value.maxUnlockedLevel = nextLevel
        saveLevelProgress()
      }

      // 触发过渡动画
      levelTransition.value = {
        isActive    : true,
        fromLevel   : currentLevel.value - 1,
        toLevel     : nextLevel,
        toLevelName : nextConfig.name,
      }

      // 触发事件
      emitEvent('levelup', {
        fromLevel : nextLevel - 1,
        toLevel   : nextLevel,
        levelName : nextConfig.name,
      })

      // 2.5 秒后关闭过渡 UI，应用新关卡参数
      setTimeout(() => {
        levelTransition.value.isActive = false
        // 通知游戏场景应用新参数（通过 customConfig）
        applyLevelConfig(nextConfig)
      }, 2500)

      return true
    }
    return false
  }

  /**
   * 将关卡配置参数写入 customConfig，GameScene 可通过 gameStore.customConfig 读取
   */
  const applyLevelConfig = (cfg: LevelConfig) => {
    customConfig.value = {
      ...customConfig.value,
      speed            : cfg.speed,
      normalFoodScore  : cfg.foodScore,
      bonusFoodScore   : cfg.bonusScore,
      specialFoodScore : cfg.coinScore,
    }
    console.log('🏰 已应用关卡参数:', cfg.name, {
      speed     : cfg.speed,
      obstacles : cfg.obstacleCount,
      foodScore : cfg.foodScore,
    })
  }

  /**
   * 游戏结束时保存当前关卡的最高分
   */
  const saveLevelHighScore = () => {
    const lvl  = currentLevel.value
    const prev = levelProgress.value.levelHighScores[lvl] || 0
    if (score.value > prev) {
      levelProgress.value.levelHighScores[lvl] = score.value
      saveLevelProgress()
    }
  }

  /**
   * 手动关闭关卡过渡 UI
   */
  const dismissLevelTransition = () => {
    if (levelTransition.value.isActive) {
      levelTransition.value.isActive = false
      applyLevelConfig(levelConfig.value)
    }
  }

  // ─── 独立部署 / 平台集成 ───────────────────────────────────────────────────
  const gameStartTime = ref<number | null>(null)

  const getGameDuration = (): number => {
    if (!gameStartTime.value) return 0
    return Math.floor((Date.now() - gameStartTime.value) / 1000)
  }

  // ─── 游戏事件系统（解耦 Phaser ↔ Vue） ───────────────────────────────────
  let _eventCallback: GameEventCallback | null = null

  const setEventCallback = (cb: GameEventCallback) => {
    _eventCallback = cb
  }

  const emitEvent = (event: GameEventType, data?: any) => {
    _eventCallback?.(event, data)
  }

  // ─── 持久化 ───────────────────────────────────────────────────────────────

  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATE)
      if (saved) {
        const data = JSON.parse(saved)
        highScore.value  = data.highScore  || 0
        playCount.value  = data.playCount  || 0
        difficulty.value = data.difficulty || 'medium'
      }
    } catch (e) {
      console.error('Failed to load game state:', e)
    }
  }

  const saveToStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify({
        highScore  : highScore.value,
        playCount  : playCount.value,
        difficulty : difficulty.value,
      }))
    } catch (e) {
      console.error('Failed to save game state:', e)
    }
  }

  // ─── 游戏生命周期 ──────────────────────────────────────────────────────────

  /** 开始游戏（重置所有状态） */
  const startGame = () => {
    score.value        = 0
    isPlaying.value    = true
    isPaused.value     = false
    isGameOver.value   = false
    playCount.value   += 1
    gameStartTime.value = Date.now()
    initLevel()
    saveToStorage()
    console.log('▶️ 游戏开始，难度:', difficulty.value)
  }

  /** 结束游戏 */
  const endGame = () => {
    isPlaying.value  = false
    isGameOver.value = true
    emitEvent('gameover')
    saveLevelHighScore()

    if (score.value > highScore.value) {
      highScore.value = score.value
      saveToStorage()
    }

    // 独立部署模式：自动提交成绩
    const sessionToken = localStorage.getItem('sessionToken')
    if (sessionToken) {
      submitScoreToPlatform(sessionToken)
    }
  }

  /** 暂停/继续 */
  const togglePause = () => {
    if (!isPlaying.value || isGameOver.value) return
    isPaused.value = !isPaused.value
    emitEvent(isPaused.value ? 'pause' : 'resume')
  }

  /** 加分（带关卡升级检测） */
  const addScore = (points: number) => {
    score.value += points
    if (score.value > highScore.value) {
      highScore.value = score.value
      saveToStorage()
    }
    // 检查是否升级
    checkLevelUp()
  }

  // ─── 平台成绩上报 ──────────────────────────────────────────────────────────

  const submitScoreToPlatform = async (sessionToken: string) => {
    const platformUrl = localStorage.getItem('platformUrl') || 'http://localhost:8080'
    const duration    = getGameDuration()

    console.log('[GameStore] 提交成绩到平台:', {
      token    : sessionToken.substring(0, 8) + '...',
      score    : score.value,
      duration,
    })

    try {
      const res = await fetch(`${platformUrl}/api/game/result`, {
        method  : 'POST',
        headers : {
          'Content-Type' : 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          sessionToken,
          score    : score.value,
          duration,
          level    : currentLevel.value,
          isWin    : true,
          details  : {
            highScore : highScore.value,
            playCount : playCount.value,
          },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        console.log('✅ 成绩上报成功:', data)
      } else {
        console.info('ℹ️ 成绩上报未成功（不影响游戏）:', res.status)
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : '未知错误'
      console.warn('⚠️ 成绩上报失败（后端未启动或网络问题）:', msg)
    }
  }

  // ─── 初始化 ───────────────────────────────────────────────────────────────
  loadFromStorage()
  loadLevelProgress()

  // ─── 返回 ─────────────────────────────────────────────────────────────────
  return {
    // 状态
    isPlaying,
    isPaused,
    isGameOver,
    score,
    highScore,
    playCount,
    difficulty,
    customConfig,

    // 关卡系统
    currentLevel,
    levelConfig,
    levelTransition,
    levelProgress,

    // computed
    isMaxLevel: computed(() => currentLevel.value >= 20),

    // 方法
    setDifficulty,
    setCustomConfig,
    startGame,
    endGame,
    togglePause,
    addScore,
    initLevel,
    checkLevelUp,
    applyLevelConfig,
    dismissLevelTransition,
    saveLevelHighScore,
    loadFromStorage,
    saveToStorage,

    // 事件系统
    setEventCallback,
    emitEvent,

    // 工具
    getGameDuration,
  }
})
