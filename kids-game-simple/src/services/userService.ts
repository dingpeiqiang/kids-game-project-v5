/**
 * userService.ts — 用户服务（对接 kids-game-backend）
 *
 * 架构说明：
 *   认证层（登录/注册/Token）  → kids-game-backend API（/api/auth、/api/user）
 *   排行榜（分数同步/排名查询） → kids-game-backend API（/api/leaderboard）
 *   其他游戏数据（签到/道具）   → localStorage
 *
 * 游客模式：
 *   未登录时自动降级到纯 localStorage，用户体验不受影响
 *   分数同步到排行榜需要登录后才能进行
 */
import { apiClient, tokenStore } from './apiClient'
import type { AuthResponseData, UserInfoData } from './apiClient'
import { getLevelByExp, ALL_ACHIEVEMENTS } from '../types/user'
import type { UserAccount, UserSession, GameRecord } from '../types/user'
import { GAMES } from '../games/gameRegistry'

import {
  submitScore,
  getTopList,
  getUserRank,
  type LeaderboardEntry,
  type UserRankInfo
} from './leaderboardService'
import {
  apiCollectDailyReward,
  apiGetSignInInfo,
  apiHasSignedInToday,
  apiGetFavoriteList,
  apiAddFavorite,
  apiGameSettle,
  type SignInResponseData,
  type SignInInfoData
} from './apiClient'

// 架构说明：
//   认证层（登录/注册/Token）  → kids-game-backend API（/api/auth、/api/user）
//   排行榜（分数同步/排名查询） → kids-game-backend API（/api/leaderboard）
//   其他游戏数据（签到/道具）   → localStorage
const LOCAL_KEYS = {
  // 账号缓存（本地快速切换用，不含密码）
  accounts: 'ugp_accounts',
  session:  'ugp_session',
  // 游戏数据前缀（按 userId 隔离）
  gameData: (uid: string) => `ugp_gd_${uid}`,
}

// 游戏数据结构（存 localStorage）
interface LocalGameData {
  coins: number
  studyCoins: number   // 游学币（来自后端 fatiguePoints）
  exp: number
  bestScores: Record<string, number>
  gameRecords: GameRecord[]
  achievements: string[]
  loginDays: number
  consecutiveLoginDays: number
  lastLoginDate: string
  todayGames: number
  todayDate: string
  items: Record<string, number>
  guideSkipped: Record<string, boolean>
  favorites: string[]
  dailyRewardCollected: string
  weeklyRewardCollected: number
}

// 随机头像
const DEFAULT_AVATARS = ['🐼','🦊','🐸','🐨','🦁','🐯','🐻','🐺','🦄','🐹','🐭','🐱','🐶','🦋','🐙']
function pickAvatar(): string {
  return DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)]
}

function defaultGameData(): LocalGameData {
  const today = new Date().toDateString()
  return {
    coins: 0,
    studyCoins: 0,
    exp: 0,
    bestScores: {},
    gameRecords: [],
    achievements: [],
    loginDays: 1,
    consecutiveLoginDays: 1,
    lastLoginDate: today,
    todayGames: 0,
    todayDate: today,
    items: {},
    guideSkipped: {},
    favorites: [],
    dailyRewardCollected: '',
    weeklyRewardCollected: 0,
  }
}

// ─────────────────────────────────────────────
// 本地账号缓存（用于"快速切换"列表展示）
// ─────────────────────────────────────────────
interface LocalAccountMeta {
  id: string
  username: string
  avatar: string
  exp: number
  userId?: number  // 后端 userId
}

function loadLocalAccounts(): LocalAccountMeta[] {
  try {
    const list: LocalAccountMeta[] = JSON.parse(localStorage.getItem(LOCAL_KEYS.accounts) || '[]')
    const cleaned = list.filter(a => a.id && a.id !== 'undefined' && a.id !== 'null')
    if (cleaned.length !== list.length) saveLocalAccounts(cleaned)
    return cleaned
  }
  catch { return [] }
}

function saveLocalAccounts(list: LocalAccountMeta[]) {
  localStorage.setItem(LOCAL_KEYS.accounts, JSON.stringify(list))
}

function upsertLocalAccount(meta: LocalAccountMeta) {
  const list = loadLocalAccounts()
  const idx = list.findIndex(a => a.id === meta.id)
  if (idx >= 0) list[idx] = meta
  else list.push(meta)
  saveLocalAccounts(list)
}

// ─────────────────────────────────────────────
// 游戏数据读写（按 userId 隔离）
// ─────────────────────────────────────────────
function loadGameData(uid: string): LocalGameData {
  try {
    const raw = localStorage.getItem(LOCAL_KEYS.gameData(uid))
    if (raw) return { ...defaultGameData(), ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return defaultGameData()
}

function saveGameData(uid: string, data: LocalGameData) {
  localStorage.setItem(LOCAL_KEYS.gameData(uid), JSON.stringify(data))
}

// ─────────────────────────────────────────────
// UserService 主类
// ─────────────────────────────────────────────
class UserService {
  /** 当前登录用户（由后端 API 填充基础信息，本地补充游戏数据） */
  private _current: UserAccount | null = null
  /** 是否已从后端恢复登录状态 */
  private _initialized = false

  constructor() {
    // 同步尝试从 Token 恢复会话（异步，不阻塞启动）
    this._tryRestoreSession()
  }

  // ── 异步恢复会话（页面刷新/重开时自动续登）──────────────────
  private async _tryRestoreSession() {
    const userId = tokenStore.getUserId()
    if (!userId) { this._initialized = true; return }

    try {
      const info = await apiClient.getCurrentUser()
      if (info) {
        this._buildCurrentFromBackend(info)
        await this._loadFavoritesFromBackend()
      } else {
        tokenStore.clear()
      }
    } catch {
      tokenStore.clear()
    }
    this._initialized = true
    // 通知 UI 刷新
    window.dispatchEvent(new CustomEvent('ugp:userChange'))
  }

  /** 从后端用户信息构建 current 对象 */
  private _buildCurrentFromBackend(info: UserInfoData | AuthResponseData) {
    const rawUid = 'userId' in info ? info.userId : (info as AuthResponseData).userId
    if (rawUid == null) {
      console.warn('[UserService] userId is null/undefined in backend response, aborting')
      return
    }
    const uid = String(rawUid)
    const gd = loadGameData(uid)
    const today = new Date().toDateString()

    // 处理每日重置
    if (gd.todayDate !== today) {
      gd.todayGames = 0
      gd.todayDate = today
    }

    if ('fatiguePoints' in info && typeof info.fatiguePoints === 'number') {
      gd.studyCoins = info.fatiguePoints
    }
    if ('coins' in info && typeof (info as AuthResponseData).coins === 'number') {
      gd.coins = (info as AuthResponseData).coins!
    }
    if ('exp' in info && typeof (info as AuthResponseData).exp === 'number') {
      gd.exp = (info as AuthResponseData).exp!
    }
    saveGameData(uid, gd)

    const account: UserAccount = {
      id: uid,
      username: ('username' in info ? info.username : '') || '',
      password: '',    // 本地不存密码
      avatar: ('avatar' in info && info.avatar) ? info.avatar : pickAvatar(),
      createdAt: 'createTime' in info && info.createTime
        ? new Date(info.createTime).toISOString()
        : new Date().toISOString(),
      ...gd,
    }

    this._current = account

    // 更新本地账号缓存（用于快速切换列表）
    upsertLocalAccount({
      id: uid,
      username: account.username,
      avatar: account.avatar,
      exp: gd.exp,
      userId: 'userId' in info ? info.userId : undefined,
    })
  }

  // ── 公开属性 ──────────────────────────────────────────────────
  get current(): UserAccount | null { return this._current }
  get isLoggedIn(): boolean { return this._current !== null && !!tokenStore.getAccess() }

  // ── 注册 ──────────────────────────────────────────────────────
  async register(username: string, password: string, nickname?: string, userType: 'KID' | 'PARENT' = 'KID'): Promise<{ ok: boolean; msg: string }> {
    username = username.trim()
    if (!username || username.length < 4 || username.length > 12) {
      return { ok: false, msg: '账号长度4-12个字符' }
    }
    if (!password || password.length < 4 || password.length > 16) {
      return { ok: false, msg: '密码长度4-16个字符' }
    }

    // 调用后端注册（传递用户类型）
    const res = await apiClient.register(username, password, nickname, userType)
    if (!res.ok) return { ok: false, msg: res.msg }

    // 注册成功后自动登录
    return this.login(username, password)
  }

  // ── 登录 ──────────────────────────────────────────────────────
  async login(username: string, password: string): Promise<{ ok: boolean; msg: string }> {
    const res = await apiClient.login(username, password)
    if (!res.ok || !res.data) return { ok: false, msg: res.msg }

    this._buildCurrentFromBackend(res.data)
    this._dailyCheckIn()
    await this._loadFavoritesFromBackend()
    return { ok: true, msg: res.msg }
  }

  // ── 登出 ──────────────────────────────────────────────────────
  async logout() {
    await apiClient.logout()  // 通知后端（忽略失败）
    this._current = null
  }

  // ── 快速切换账号（本地缓存中选，不重新走后端认证）──────────────
  switchAccount(localId: string) {
    // 快速切换只切本地游戏数据视图，Token 仍是当前登录用户
    // 如需真正切换，需要重新登录
    const list = loadLocalAccounts()
    const meta = list.find(a => a.id === localId)
    if (!meta) return
    const gd = loadGameData(localId)
    const today = new Date().toDateString()
    if (gd.todayDate !== today) { gd.todayGames = 0; gd.todayDate = today }
    this._current = {
      id: meta.id,
      username: meta.username,
      password: '',
      avatar: meta.avatar,
      createdAt: new Date().toISOString(),
      ...gd,
    }
    this._dailyCheckIn()
  }

  // ── 每日签到检查 ──────────────────────────────────────────────
  private _dailyCheckIn() {
    if (!this._current) return
    const u = this._current
    const today = new Date().toDateString()
    if (u.lastLoginDate === today) return

    const yesterday = new Date(Date.now() - 86400000).toDateString()
    u.consecutiveLoginDays = u.lastLoginDate === yesterday ? u.consecutiveLoginDays + 1 : 1
    u.loginDays += 1
    u.lastLoginDate = today
    u.todayGames = 0
    u.todayDate = today

    this.saveUser(u)
    this._checkAchievements(u)
  }

  // ── 从后端加载收藏列表 ──────────────────────────────────────────
  private async _loadFavoritesFromBackend(): Promise<void> {
    if (!this._current) return
    try {
      const res = await apiGetFavoriteList()
      if (res.ok && res.data) {
        // 将后端返回的数字 ID 转换为游戏 ID
        const gameIdMap = this._buildGameIdMap()
        const backendFavorites: string[] = []
        for (const numericId of res.data) {
          const gameId = gameIdMap[numericId]
          if (gameId) backendFavorites.push(gameId)
        }

        // 合并本地和后端的收藏数据（去重）
        const localFavorites = this._current.favorites || []
        const mergedFavorites = [...new Set([...localFavorites, ...backendFavorites])]

        this._current.favorites = mergedFavorites
        this.saveUser(this._current)
        console.log('[UserService] 从后端加载收藏列表:', backendFavorites.length, '个，合并后:', mergedFavorites.length, '个')

        // 如果本地有后端没有的收藏，同步到后端
        const localOnly = localFavorites.filter(f => !backendFavorites.includes(f))
        if (localOnly.length > 0) {
          console.log('[UserService] 同步本地收藏到后端:', localOnly.length, '个')
          for (const gameId of localOnly) {
            const numericId = this.convertGameIdToNumber(gameId)
            if (numericId) {
              try {
                await apiAddFavorite(numericId)
              } catch (e) {
                console.warn('[UserService] 同步收藏失败:', gameId, e)
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('[UserService] 从后端加载收藏失败:', e)
    }
  }

  // ── 构建数字ID到游戏ID的映射 ────────────────────────────────────
  private _buildGameIdMap(): Record<number, string> {
    const map: Record<number, string> = {}
    for (const game of GAMES) {
      const numericId = this.convertGameIdToNumber(game.id)
      if (numericId) map[numericId] = game.id
    }
    return map
  }

  // ── 手动签到领奖 ──────────────────────────────────────────────
  async collectDailyReward(): Promise<{ ok: boolean; msg: string; coins?: number }> {
    if (!this._current) return { ok: false, msg: '请先登录' }

    const today = new Date().toDateString()
    if (this._current.dailyRewardCollected === today) return { ok: false, msg: '今日已领取' }

    // 尝试同步到后端（仅已登录用户）
    if (this.isLoggedIn) {
      try {
        console.log('[UserService] 尝试同步签到到后端...')
        const result = await apiCollectDailyReward()
        
        if (result.ok && result.data) {
          const backendData = result.data
          
          if (backendData.alreadySignedIn) {
            // 后端返回已签到，更新本地状态
            this._current.dailyRewardCollected = today
            this.saveUser(this._current)
            return { ok: false, msg: '今日已签到' }
          }
          
          const coins = backendData.coinsReward || 0
          const exp = backendData.expReward || 0
          const study = backendData.studyCoinsReward || 0
          const consecutiveDays = backendData.consecutiveDays || this._current.consecutiveLoginDays
          const wallet = backendData.wallet

          this._current.dailyRewardCollected = today
          if (wallet) {
            this._current.coins = wallet.coins
            this._current.studyCoins = wallet.studyCoins
            this._current.exp = wallet.exp
          } else {
            this._current.coins += coins
            if (exp > 0) this._current.exp += exp
            if (study > 0) this._current.studyCoins += study
          }
          this._current.consecutiveLoginDays = consecutiveDays
          this.saveUser(this._current)

          console.log('[UserService] 签到成功同步到后端', { coins, exp, study, consecutiveDays })
          return { ok: true, msg: backendData.message || `签到成功！获得 ${coins} 金币`, coins }
        } else {
          console.warn('[UserService] 后端签到失败，使用本地模式:', result.msg)
          // 降级到本地模式
        }
      } catch (error) {
        console.error('[UserService] 后端签到异常，使用本地模式:', error)
        // 降级到本地模式
      }
    }

    // 本地模式（后端不可用时）
    const days = this._current.consecutiveLoginDays
    const baseCoins = 50
    const bonus = Math.min(days - 1, 6) * 10
    const coins = baseCoins + bonus

    this._current.dailyRewardCollected = today
    this._current.coins += coins
    if (days >= 3) this._current.exp += 20

    this.saveUser(this._current)
    return { ok: true, msg: `签到成功！获得 ${coins} 金币`, coins }
  }

  // ── 游戏数据 ──────────────────────────────────────────────────
  async recordGameResult(gameId: string, score: number, gameStats?: any): Promise<{ synced: boolean; rank?: number }> {
    console.log('[UserService] recordGameResult 被调用', { gameId, score, isLoggedIn: this.isLoggedIn })
    
    if (!this._current) {
      console.warn('[UserService] _current 为空，无法记录游戏结果')
      return { synced: false }
    }

    const u = this._current
    const prevBest = u.bestScores[gameId] || 0
    const isNewBest = score > prevBest
    if (isNewBest) u.bestScores[gameId] = score

    const record: GameRecord = { gameId, score, playedAt: new Date().toISOString(), isNewBest }
    u.gameRecords.unshift(record)
    if (u.gameRecords.length > 100) u.gameRecords.pop()

    const levelReached = gameStats?.level ?? 0
    u.todayGames += 1
    this.saveUser(u)

    if (this.isLoggedIn) {
      const numericGameId = this.convertGameIdToNumber(gameId)
      if (numericGameId != null) {
        try {
          const settle = await apiGameSettle(numericGameId, score, levelReached)
          if (settle.ok && settle.data?.success !== false) {
            const d = settle.data!
            if (d.coins != null) u.coins = d.coins
            if (d.studyCoins != null) u.studyCoins = d.studyCoins
            if (d.exp != null) u.exp = d.exp
            this.saveUser(u)
            this._checkAchievements(u)
            return { synced: true, rank: d.rank ?? undefined }
          }
        } catch (e) {
          console.warn('[UserService] 游戏结算失败，使用本地记录', e)
        }
      }
    }

    const coins = Math.min(8, Math.max(1, Math.round(score / 200)))
    const exp = Math.min(10, Math.max(2, Math.round(score / 300)))
    u.coins += coins
    u.exp += exp
    this.saveUser(u)
    this._checkAchievements(u)
    return { synced: false }
  }

  // ── 同步分数到后端排行榜 ─────────────────────────────────────
  private async syncScoreToBackend(gameId: string, score: number, gameStats?: any): Promise<{ synced: boolean; rank?: number }> {
    const accessToken = tokenStore.getAccess()
    const backendUserId = tokenStore.getUserId()

    console.log('[UserService] 开始同步分数到后端', { gameId, score, hasToken: !!accessToken, userId: backendUserId })

    // 未登录时不尝试同步
    if (!accessToken || !backendUserId) {
      console.warn('[UserService] 用户未登录，跳过分数同步')
      return { synced: false }
    }

    // 将字符串 gameId 转换为数字 ID（临时方案：使用哈希或固定映射）
    // TODO: 从后端获取游戏列表并建立映射关系
    const numericGameId = this.convertGameIdToNumber(gameId)
    if (numericGameId === null) {
      console.warn('[UserService] 无法转换游戏 ID:', gameId)
      return { synced: false }
    }

    try {
      console.log('[UserService] 调用 submitScore API...', { gameId: numericGameId, score, gameStats })
      const result = await submitScore(numericGameId, score, accessToken)
      console.log('[UserService] submitScore 返回结果:', result)
      if (result.success) {
        console.log('[UserService] 分数同步成功，排名:', result.rank)
        return { synced: true, rank: result.rank ?? undefined }
      }
    } catch (e) {
      console.warn('[UserService] 分数同步失败:', e)
    }

    return { synced: false }
  }

  // ── 将字符串游戏 ID 转换为数字 ID ──────────────────────────────
  private convertGameIdToNumber(gameId: string): number | null {
    // 简单哈希函数，将字符串转换为数字
    // 注意：这只是一个临时方案，理想情况应该从后端获取游戏列表
    let hash = 0
    for (let i = 0; i < gameId.length; i++) {
      const char = gameId.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    // 取绝对值并确保在合理范围内
    return Math.abs(hash) % 10000 + 1 // 生成 1-10000 之间的数字
  }

  // ── 获取游戏排行榜 ────────────────────────────────────────────
  async getGameLeaderboard(
    gameCode: string,
    type: 'ALL' | 'DAILY' | 'MONTHLY' | 'YEARLY' = 'ALL',
    limit = 20
  ): Promise<LeaderboardEntry[]> {
    try {
      const response = await getTopList(gameCode, type, limit)
      return response.list
    } catch (e) {
      console.warn('[UserService] 获取排行榜失败:', e)
      return []
    }
  }

  // ── 获取用户在游戏中的排名 ────────────────────────────────────
  async getMyGameRank(gameCode: string): Promise<UserRankInfo | null> {
    const accessToken = tokenStore.getAccess()
    if (!accessToken) return null

    try {
      return await getUserRank(gameCode, accessToken)
    } catch (e) {
      console.warn('[UserService] 获取排名失败:', e)
      return null
    }
  }

  addCoins(amount: number) {
    if (!this._current) return
    this._current.coins += amount
    this.saveUser(this._current)
  }

  spendCoins(amount: number): boolean {
    if (!this._current || this._current.coins < amount) return false
    this._current.coins -= amount
    this.saveUser(this._current)
    return true
  }

  updateBest(gameId: string, score: number) {
    if (!this._current) return
    const prev = this._current.bestScores[gameId] || 0
    if (score > prev) { this._current.bestScores[gameId] = score; this.saveUser(this._current) }
  }

  getItem(itemId: string): number { return this._current?.items[itemId] || 0 }

  addItem(itemId: string, count = 1) {
    if (!this._current) return
    this._current.items[itemId] = (this._current.items[itemId] || 0) + count
    this.saveUser(this._current)
  }

  useItem(itemId: string): boolean {
    if (!this._current || !this.getItem(itemId)) return false
    this._current.items[itemId]--
    this.saveUser(this._current)
    return true
  }

  buyItem(itemId: string, price: number): boolean {
    if (!this._current || this._current.coins < price) return false
    this._current.coins -= price
    this.addItem(itemId)
    return true
  }

  skipGuide(gameId: string) {
    if (!this._current) return
    this._current.guideSkipped[gameId] = true
    this.saveUser(this._current)
  }

  resetGuide(gameId: string) {
    if (!this._current) return
    delete this._current.guideSkipped[gameId]
    this.saveUser(this._current)
  }

  incrementGames() {
    if (!this._current) return
    this._current.todayGames++
    this.saveUser(this._current)
  }

  // ── 成就 ──────────────────────────────────────────────────────
  private _checkAchievements(u: UserAccount) {
    const scores = Object.values(u.bestScores) as number[]
    const gameCount = Object.keys(u.bestScores).length
    const totalPlays = u.gameRecords.length

    const conditions: Record<string, () => boolean> = {
      first_game:  () => gameCount > 0,
      score_1000:  () => scores.some(s => s >= 1000),
      score_5000:  () => scores.some(s => s >= 5000),
      score_10000: () => scores.some(s => s >= 10000),
      games_5:     () => gameCount >= 5,
      games_10:    () => gameCount >= 10,
      games_all:   () => gameCount >= 24,
      login_7:     () => u.consecutiveLoginDays >= 7,
      login_30:    () => u.loginDays >= 30,
      play_50:     () => totalPlays >= 50,
      play_100:    () => totalPlays >= 100,
      coins_1000:  () => u.coins >= 1000,
      level_5:     () => getLevelByExp(u.exp).level >= 5,
    }

    let changed = false
    for (const ach of ALL_ACHIEVEMENTS) {
      if (!u.achievements.includes(ach.id) && conditions[ach.id]?.()) {
        u.achievements.push(ach.id)
        changed = true
      }
    }
    if (changed) this.saveUser(u)
  }

  getAchievements() {
    const unlocked = new Set(this._current?.achievements || [])
    return ALL_ACHIEVEMENTS.map(a => ({ ...a, unlocked: unlocked.has(a.id) }))
  }

  // ── 账号列表（本地缓存，用于快速切换 UI）──────────────────────
  getAccountList(): Pick<UserAccount, 'id' | 'username' | 'avatar' | 'exp'>[] {
    return loadLocalAccounts().map(a => ({
      id: a.id,
      username: a.username,
      avatar: a.avatar,
      exp: a.exp,
    }))
  }

  // ── 统计辅助 ──────────────────────────────────────────────────
  getRecentActivity(days = 7): { date: string; count: number }[] {
    if (!this._current) return []
    const result: { date: string; count: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const dateStr = d.toISOString().slice(0, 10)
      const label = i === 0 ? '今天' : i === 1 ? '昨天' : `${d.getMonth()+1}/${d.getDate()}`
      const count = this._current.gameRecords.filter(r => r.playedAt.slice(0, 10) === dateStr).length
      result.push({ date: label, count })
    }
    return result
  }

  getTopGames(limit = 5): { gameId: string; score: number }[] {
    if (!this._current) return []
    return Object.entries(this._current.bestScores)
      .map(([gameId, score]) => ({ gameId, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  // ── 刷新游学币（从后端同步）───────────────────────────────────
  async refreshStudyCoins(): Promise<void> {
    if (!this._current || !this.isLoggedIn) return
    try {
      const info = await apiClient.getCurrentUser()
      if (info && 'fatiguePoints' in info) {
        this._current.studyCoins = info.fatiguePoints
        const gd = loadGameData(this._current.id)
        gd.studyCoins = info.fatiguePoints
        saveGameData(this._current.id, gd)
        window.dispatchEvent(new CustomEvent('ugp:userChange'))
      }
    } catch (e) {
      console.warn('[UserService] 刷新游学币失败', e)
    }
  }

  // ── 持久化 ──────────────────────────────────────────────────────
  saveUser(account: UserAccount) {
    const uid = account.id
    const gd: LocalGameData = {
      coins: account.coins,
      studyCoins: account.studyCoins,
      exp: account.exp,
      bestScores: account.bestScores,
      gameRecords: account.gameRecords,
      achievements: account.achievements,
      loginDays: account.loginDays,
      consecutiveLoginDays: account.consecutiveLoginDays,
      lastLoginDate: account.lastLoginDate,
      todayGames: account.todayGames,
      todayDate: account.todayDate,
      items: account.items,
      guideSkipped: account.guideSkipped,
      favorites: account.favorites || [],
      dailyRewardCollected: account.dailyRewardCollected,
      weeklyRewardCollected: account.weeklyRewardCollected,
    }
    saveGameData(uid, gd)

    // 更新本地账号元数据缓存
    upsertLocalAccount({
      id: uid,
      username: account.username,
      avatar: account.avatar,
      exp: gd.exp,
    })

    if (this._current?.id === uid) this._current = account
  }
}

export const userService = new UserService()
