/**
 * 🎮 通用游戏基础类型定义
 * 这些类型可以被所有游戏复用，是 kids-game-framework 的一部分
 */

// ==================== 通用枚举 ====================

/** 难度级别 */
export type Difficulty = 'easy' | 'medium' | 'hard'

/** 游戏状态 */
export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover'

// ==================== 通用接口 ====================

/**
 * 基础游戏配置
 */
export interface GameConfig {
  difficulty: Difficulty
  speed: number          // 基础速度（像素/秒）
  scoreMultiplier: number
}

/**
 * 难度配置
 */
export interface DifficultyConfig {
  name: string
  nameCN: string
  speed: number
  scoreMultiplier: number
  color: string
  description: string
}

/**
 * 基础游戏状态（所有游戏通用）
 */
export interface BaseGameState {
  status: GameStatus
  score: number
  highScore: number
  playCount: number
  difficulty: Difficulty
}

/**
 * 通用游戏事件类型
 */
export type GameEventType = 'start' | 'pause' | 'resume' | 'gameover' | 'score' | 'levelup'

/**
 * 游戏事件回调
 */
export type GameEventCallback = (event: GameEventType, data?: any) => void

/**
 * 道具效果基础接口
 */
export interface ItemEffect {
  type: string
  icon: string
  endTime: number
}

/**
 * 道具效果状态（通用结构）
 */
export interface ItemEffectState {
  speedMultiplier: number
  scoreMultiplier: number
  hasShield: boolean
  hasMagnet: boolean
  activeEffects: ItemEffect[]
}

/**
 * 平台 API 接口（供独立部署模式使用）
 */
export interface PlatformAPI {
  getSessionToken(): string | null
  isStandaloneMode(): boolean
  getGameId(): string | null
  reportGameResult(params: {
    sessionToken: string
    score: number
    duration: number
    level: number
    isWin: boolean
    details?: Record<string, any>
  }): Promise<{ success: boolean; message?: string; consumePoints?: number }>
}

/**
 * 游戏生命周期接口
 * 每个游戏需要实现这个接口来提供游戏特定逻辑
 */
export interface IGameLogic {
  /** 游戏初始化 */
  init(cellSize: number): void

  /** 开始游戏 */
  start(): void

  /** 结束游戏 */
  end(): void

  /** 重置游戏 */
  reset(cellSize: number): void

  /** 更新游戏状态（每帧调用） */
  update(deltaTime: number, cellSize: number): void

  /** 获取当前游戏状态 */
  getState(): GameStatus

  /** 获取分数 */
  getScore(): number

  /** 获取高分 */
  getHighScore(): number
}

/**
 * 游戏渲染器接口
 * 框架调用这个接口来渲染游戏画面
 */
export interface IGameRenderer {
  /** 渲染游戏画面 */
  render(state: any): void

  /** 播放音效 */
  playSound(soundKey: string): void

  /** 播放背景音乐 */
  playBgm(type: 'main' | 'gameplay' | 'gameover'): void

  /** 停止背景音乐 */
  stopBgm(): void

  /** 屏幕震动 */
  shake(): void

  /** 创建爆炸效果 */
  createExplosion(x: number, y: number, color: string): void
}

/**
 * 适配参数接口
 */
export interface AdaptParams {
  screenW: number
  screenH: number
  scale: number
  safeTop: number
  safeBottom: number
  cellSize: number
  gameAreaX: number
  gameAreaY: number
  gridCols: number
  gridRows: number
}
