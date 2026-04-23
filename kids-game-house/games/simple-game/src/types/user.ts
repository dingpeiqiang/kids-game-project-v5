// ============ 用户账号系统类型 ============

/** 用户等级定义 */
export interface UserLevel {
  level: number
  name: string
  minExp: number
  maxExp: number
  color: string
  icon: string
}

/** 成就定义 */
export interface Achievement {
  id: string
  icon: string
  name: string
  desc: string
  unlocked: boolean
  unlockedAt?: string
}

/** 游戏战绩记录 */
export interface GameRecord {
  gameId: string
  score: number
  playedAt: string   // ISO 时间字符串
  isNewBest: boolean
}

/** 用户账号信息 */
export interface UserAccount {
  id: string            // 唯一 ID
  username: string      // 昵称
  password: string      // 简单密码（MD5 hash）
  avatar: string        // emoji 头像
  createdAt: string     // 注册时间
  coins: number
  exp: number           // 经验值
  bestScores: Record<string, number>
  gameRecords: GameRecord[]       // 最近100条战绩
  achievements: string[]          // 已解锁成就 ID 列表
  loginDays: number               // 累计登录天数
  consecutiveLoginDays: number    // 连续登录天数
  lastLoginDate: string
  todayGames: number
  todayDate: string
  hasDoubleCard: boolean
  items: Record<string, number>
  guideSkipped: Record<string, boolean>
  // 运营数据
  dailyRewardCollected: string    // 今日是否领过签到奖励（日期字符串）
  weeklyRewardCollected: number   // 本周领取次数
}

/** 登录会话 */
export interface UserSession {
  userId: string
  loginAt: string
}

// 等级配置
export const USER_LEVELS: UserLevel[] = [
  { level: 1,  name: '新手玩家', minExp: 0,    maxExp: 100,   color: '#A0A0A0', icon: '🌱' },
  { level: 2,  name: '初级玩家', minExp: 100,  maxExp: 300,   color: '#4ECDC4', icon: '🌿' },
  { level: 3,  name: '进阶玩家', minExp: 300,  maxExp: 600,   color: '#45B7D1', icon: '⭐' },
  { level: 4,  name: '熟练玩家', minExp: 600,  maxExp: 1000,  color: '#5b9bd5', icon: '🌟' },
  { level: 5,  name: '游戏达人', minExp: 1000, maxExp: 2000,  color: '#9B59B6', icon: '💎' },
  { level: 6,  name: '高手玩家', minExp: 2000, maxExp: 4000,  color: '#FF8E53', icon: '🏆' },
  { level: 7,  name: '精英玩家', minExp: 4000, maxExp: 8000,  color: '#FF6B6B', icon: '👑' },
  { level: 8,  name: '传奇玩家', minExp: 8000, maxExp: 999999,color: '#FFD700', icon: '⚡' },
]

/** 根据经验值获取等级信息 */
export function getLevelByExp(exp: number): UserLevel {
  for (let i = USER_LEVELS.length - 1; i >= 0; i--) {
    if (exp >= USER_LEVELS[i].minExp) return USER_LEVELS[i]
  }
  return USER_LEVELS[0]
}

/** 经验进度百分比 */
export function getLevelProgress(exp: number): number {
  const lv = getLevelByExp(exp)
  if (lv.maxExp === 999999) return 100
  return Math.round((exp - lv.minExp) / (lv.maxExp - lv.minExp) * 100)
}

// 所有成就定义
export const ALL_ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  { id: 'first_game',    icon: '🎮', name: '初次体验',    desc: '完成首次游戏' },
  { id: 'score_1000',   icon: '⭐', name: '千分高手',    desc: '单局得分超过1000' },
  { id: 'score_5000',   icon: '🌟', name: '五千达人',    desc: '单局得分超过5000' },
  { id: 'score_10000',  icon: '💎', name: '万分传奇',    desc: '单局得分超过10000' },
  { id: 'games_5',      icon: '🕹️', name: '初尝五味',    desc: '玩过5款不同游戏' },
  { id: 'games_10',     icon: '🏅', name: '游戏达人',    desc: '玩过10款不同游戏' },
  { id: 'games_all',    icon: '🏆', name: '全能玩家',    desc: '玩过全部游戏' },
  { id: 'login_7',      icon: '📅', name: '一周达人',    desc: '连续登录7天' },
  { id: 'login_30',     icon: '🗓️', name: '月度忠实',    desc: '累计登录30天' },
  { id: 'play_50',      icon: '🎯', name: '游戏狂人',    desc: '累计游戏50次' },
  { id: 'play_100',     icon: '🎖️', name: '百战老兵',    desc: '累计游戏100次' },
  { id: 'coins_1000',   icon: '💰', name: '金币富翁',    desc: '累计获得1000金币' },
  { id: 'level_5',      icon: '🌟', name: '达人晋级',    desc: '达到5级游戏达人' },
]
