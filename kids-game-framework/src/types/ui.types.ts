/**
 * Framework UI Types
 * 框架 UI 组件相关类型定义
 */

import type { ItemEffectsState } from './game.types'

// ============================================
// 按钮相关类型
// ============================================

/** 按钮变体类型 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning'

/** 按钮尺寸类型 */
export type ButtonSize = 'small' | 'medium' | 'large'

/** 按钮配置 */
export interface ButtonConfig {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  fontSize?: string | number
  padding?: string
  borderRadius?: string
}

// ============================================
// 难度选择相关类型
// ============================================

/** 难度等级定义 */
export interface DifficultyLevel {
  id: string
  name: string           // 英文名，如 "Easy"
  nameCN?: string        // 中文名，如 "简单"
  description?: string  // 描述
  icon?: string         // 图标 emoji
  params: Record<string, number>  // 游戏参数：speed, scoreMultiplier 等
}

/** 难度配置 */
export interface DifficultyConfig {
  levels: DifficultyLevel[]
  defaultId?: string     // 默认难度 ID
}

// ============================================
// 加载页面相关类型
// ============================================

/** 加载步骤 */
export interface LoadingStep {
  id: string
  label: string          // 步骤名称
  progress: number       // 进度百分比 (0-100)
  icon?: string          // 步骤图标
}

/** 加载状态 */
export interface LoadingState {
  currentStep: number    // 当前步骤索引
  progress: number        // 总进度 (0-100)
  message?: string       // 当前消息
}

// ============================================
// 游戏状态相关类型
// ============================================

/** 游戏状态 */
export type GameStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'gameover'

/** 游戏结果 */
export interface GameResult {
  score: number
  highScore: number
  duration?: number       // 游戏时长（毫秒）
  isNewRecord?: boolean   // 是否破纪录
}

// ============================================
// 游戏 HUD 相关类型
// ============================================

/** HUD 配置 */
export interface HUDConfig {
  showScore?: boolean
  showHighScore?: boolean
  showItemEffects?: boolean
  showPauseButton?: boolean
  showHomeButton?: boolean
  showFullscreenButton?: boolean
  showSoundToggle?: boolean
}

/** 操作提示配置 */
export interface ControlHint {
  key: string             // 按键标识
  label: string           // 显示文字
  icon?: string           // 图标
}

/** 控制提示配置 */
export interface ControlsConfig {
  hints: ControlHint[]
  position?: 'top' | 'bottom' | 'auto'
  autoHide?: number        // 自动隐藏时间（毫秒），0 表示不隐藏
}

// ============================================
// 视图插槽类型（模板化用）
// ============================================

/** StartView 插槽 */
export interface StartViewSlots {
  /** 标题区插槽 */
  title?: string
  /** 分数记录区插槽 */
  score?: string
  /** 设置区插槽 */
  settings?: string
  /** 操作说明区插槽 */
  instructions?: string
  /** 自定义内容区插槽 */
  extra?: string
}

/** GameOverView 插槽 */
export interface GameOverViewSlots {
  /** 分数区插槽 */
  score?: string
  /** 成就区插槽 */
  achievement?: string
  /** 底部操作区插槽 */
  actions?: string
}

// ============================================
// 游戏容器 Props（框架提供给游戏的接口）
// ============================================

/** 游戏容器 Props */
export interface GameContainerProps {
  // 游戏状态
  status?: GameStatus
  score?: number
  highScore?: number
  isPaused?: boolean
  error?: string | null

  // 道具效果
  itemEffects?: ItemEffectsState

  // 配置
  loadingSteps?: LoadingStep[]
  controlsConfig?: ControlsConfig
  hudConfig?: HUDConfig

  // 游戏名称（用于标题等）
  gameName?: string

  // 游戏特定配置（透传给游戏）
  gameConfig?: Record<string, any>
}

/** 游戏容器 Emits */
export interface GameContainerEmits {
  // 生命周期
  (e: 'init'): void
  (e: 'start'): void
  (e: 'resume'): void
  (e: 'pause'): void
  (e: 'quit'): void
  (e: 'retry'): void

  // 操作
  (e: 'home'): void
  (e: 'fullscreen'): void
  (e: 'soundToggle'): void

  // 游戏输入（由游戏处理）
  (e: 'input', direction: string): void
}

// ============================================
// 主题相关类型（已移至 gtrs.types.ts）
// ============================================

// 主题相关类型见 gtrs.types.ts
// - GTRSTheme
// - ThemeConfig
// - etc.
