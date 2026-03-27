/**
 * 🎮 游戏核心类型定义
 * 
 * 这些是所有游戏通用的类型定义
 * 游戏特定类型应该在各游戏项目中定义
 */

// ============================================================================
// 🎯 基础游戏类型
// ============================================================================

/** 难度级别 */
export type Difficulty = 'easy' | 'medium' | 'hard'

/** 难度配置 */
export interface DifficultyConfig {
  name: string
  nameCN: string
  speed: number
  scoreMultiplier: number
  color: string
  description: string
}

/** 游戏状态 */
export interface GameState {
  isPlaying: boolean
  isPaused: boolean
  isGameOver: boolean
  score: number
  highScore: number
  playCount: number
  difficulty: Difficulty
}

/** 二维坐标（像素） */
export interface Position {
  x: number
  y: number
}

/** 粒子对象 */
export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
}

// ============================================================================
// 🎮 游戏引擎配置
// ============================================================================

/** 游戏引擎初始化配置 */
export interface GameEngineConfig {
  /** 设计宽度（美术基准，默认 720） */
  designWidth?: number
  /** 设计高度（美术基准，默认 1280） */
  designHeight?: number
  /** 网格列数（默认 32） */
  gridCols?: number
  /** 网格行数（默认 18） */
  gridRows?: number
  /** 基础单元格大小（像素，默认 50） */
  baseCellSize?: number

  // ==================== 屏幕适配 ====================

  /** 游戏画布逻辑宽度（像素），设为 '100%' 则填满容器 */
  canvasWidth?: number | '100%'
  /** 游戏画布逻辑高度（像素），设为 '100%' 则填满容器 */
  canvasHeight?: number | '100%'
  /**
   * 缩放模式（默认 'FIT'）
   * - 'FIT':        保持宽高比，缩放到容器内（推荐大多数游戏）
   * - 'ENVELOP':    保持宽高比，铺满容器（可能裁剪）
   * - 'RESIZE':     画布尺寸跟随容器（网格类游戏适用）
   * - 'EXPAND':     保持宽高比，放大铺满窗口
   * - 'NONE':       不缩放，固定画布尺寸
   */
  scaleMode?: 'FIT' | 'ENVELOP' | 'RESIZE' | 'EXPAND' | 'NONE'
  /** 居中方式（默认 'CENTER_BOTH'） */
  autoCenter?: 'CENTER_BOTH' | 'CENTER_HORIZONTALLY' | 'CENTER_VERTICALLY' | 'NO_CENTER'
  /** 背景颜色（默认 '#1a1a2e'） */
  backgroundColor?: string
}

/** 屏幕适配参数 */
export interface AdaptParams {
  screenW: number
  screenH: number
  scale: number
  safeTop: number
  safeBottom: number
  cellSize: number
  gameAreaX?: number
  gameAreaY?: number
  gridCols?: number
  gridRows?: number
}

// ============================================================================
// 🎁 道具系统类型（通用框架）
// ============================================================================

/** 道具效果状态（供 Pinia store 使用） */
export interface ItemEffectsState {
  speedMultiplier: number
  scoreMultiplier: number
  hasShield: boolean
  hasMagnet: boolean
  activeEffects: Array<{ type: string; icon: string; endTime: number }>
}

/** 道具效果配置 */
export interface ItemEffect {
  type: string
  duration: number
  icon: string
}

// ============================================================================
// 🎭 框架枚举
// ============================================================================

/** 游戏阶段 */
export enum GamePhase {
  NOT_STARTED = 'not_started',
  READY = 'ready',
  PLAYING = 'playing',
  PAUSED = 'paused',
  VICTORY = 'victory',
  DEFEAT = 'defeat',
  GAME_OVER = 'game_over'
}

/** 游戏事件类型 */
export type GameEventType =
  | 'game:start'
  | 'game:pause'
  | 'game:resume'
  | 'game:restart'
  | 'game:over'
  | 'score:change'
  | 'level:complete'
  | 'player:hurt'
  | 'player:die'
  | 'player:powerup'
  | 'item:collect'
  | string

/** 游戏事件处理器 */
export type GameEventHandler = (event: any) => void

// ============================================================================
// 📊 平台 API 类型
// ============================================================================

/** 成绩上报请求体 */
export interface GameReportRequest {
  sessionToken: string
  score: number
  duration: number
  level?: number
  isWin?: boolean
  details?: Record<string, any>
}

/** 成绩上报响应 */
export interface GameReportResponse {
  code: number
  message: string
  data?: {
    consumePoints: number
    sessionId: number
    userId: number
    gameId: number
  }
}

// ============================================================================
// 🎚️ 内置难度配置常量（示例默认值）
// ============================================================================

/** 默认难度配置 */
export const DEFAULT_DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    name: 'easy',
    nameCN: '简单',
    speed: 150,
    scoreMultiplier: 1,
    color: '#4ade80',
    description: '适合小朋友入门，速度慢，奖励多'
  },
  medium: {
    name: 'medium',
    nameCN: '中等',
    speed: 250,
    scoreMultiplier: 1.5,
    color: '#fbbf24',
    description: '标准挑战，速度与激情并存'
  },
  hard: {
    name: 'hard',
    nameCN: '困难',
    speed: 350,
    scoreMultiplier: 2,
    color: '#f87171',
    description: '高手专属，超快反应挑战'
  }
}
