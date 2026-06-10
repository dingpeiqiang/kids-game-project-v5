// 按儿童10大能力发展维度分类
export type GameCategory = 
  | 'logic'           // 逻辑思维
  | 'memory'          // 记忆能力
  | 'attention'       // 专注力
  | 'reaction'        // 反应速度
  | 'coordination'    // 手眼协调
  | 'spatial'         // 空间想象
  | 'strategy'        // 策略规划
  | 'creativity'      // 创造力
  | 'problemSolving'  // 问题解决
  | 'patience'        // 耐心毅力

export interface GameCategoryDef {
  id: GameCategory
  label: string
  icon: string
  color: string
  desc?: string // 能力描述（可选）
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
  favorites: string[] // 收藏的游戏ID列表
  dailyRewardCollected: string // 今日是否领过签到奖励（日期字符串）
  consecutiveLoginDays: number // 连续登录天数
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

// 游戏评论
export interface GameComment {
  id: string
  gameId: string
  content: string
  score: number // 1-5分评分
  playerName: string
  createdAt: number // 时间戳
}

// 游戏评论数据
export interface GameComments {
  [gameId: string]: GameComment[]
}
