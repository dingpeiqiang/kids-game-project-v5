// 玩法分类
export type GameCategory = 'eliminate' | 'reaction' | 'slice' | 'action' | 'puzzle' | 'build' | 'shoot' | 'towerDefense' | 'card' | '3d'

export interface GameCategoryDef {
  id: GameCategory
  label: string
  icon: string
  color: string
}

// 游戏定义
export interface Game {
  id: string
  name: string
  desc: string
  type: '2d' | '3d'
  category: GameCategory
  tag: string
  color: string
  players: number
  best: number
  preview: string
}

// 玩家数据
export interface PlayerData {
  name: string
  coins: number
  bestScores: Record<string, number>
  todayGames: number
  todayDate: string
  hasDoubleCard: boolean
  playHistory: string[]
  loginDays: number
  lastLogin: string
  guideSkipped: Record<string, boolean>
  items: Record<string, number> // 道具数量 {道具id: 数量}
}

// Buff 定义
export interface Buff {
  id: string
  icon: string
  text: string
  dur: number
  mult: number
}

// 道具定义
export interface GameItem {
  id: string
  name: string
  desc: string
  icon: string
  price: number // 价格（金币）
  effect: string // 效果描述
  type: 'instant' | 'buff' // 立即生效或增益效果
}

// 游戏引导
export interface GameGuide {
  icon: string
  name: string
  desc: string
  ops: { icon: string; text: string }[]
  tipsTitle: string
  tips: string
  bg: string
}

// 排行榜条目
export interface RankItem {
  name: string
  score: number
}

// 游戏状态
export interface GameState {
  running: boolean
  score: number
  combo: number
  buffs: Record<string, Buff>
  crits: number
  sessionCoins: number
}
