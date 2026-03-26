/**
 * 通用游戏框架 - 类型定义
 */

// 游戏状态枚举
export enum GameStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'gameover',
  VICTORY = 'victory'
}

// 游戏难度
export type Difficulty = 'easy' | 'medium' | 'hard'

// 基础位置接口
export interface Position {
  x: number
  y: number
}

// 基础游戏实体
export interface GameEntity {
  id: string
  position: Position
  rotation?: number
  scale?: number
  visible?: boolean
}

// 游戏配置
export interface GameConfig {
  width: number
  height: number
  cellSize?: number
  difficulty: Difficulty
  maxLevel: number
}

// 游戏得分记录
export interface ScoreRecord {
  score: number
  level: number
  duration: number
  timestamp: number
  details?: Record<string, any>
}

// 游戏事件类型
export type GameEventType = 
  | 'game_start'
  | 'game_pause'
  | 'game_resume'
  | 'game_over'
  | 'victory'
  | 'level_up'
  | 'score_change'
  | 'collision'
  | 'item_collect'
  | 'error'

// 游戏事件数据
export interface GameEvent {
  type: GameEventType
  data?: any
  timestamp: number
}

// 游戏事件回调
export type GameEventCallback = (event: GameEvent) => void

// 玩家信息
export interface PlayerInfo {
  userId: number
  userName: string
  userType?: number
  parentId?: number
}

// 会话信息
export interface SessionInfo {
  sessionId: number
  userId: number
  gameId: number
  sessionToken: string
}

// 平台通信消息
export interface PlatformMessage {
  type: string
  sessionId?: string
  data?: any
}
