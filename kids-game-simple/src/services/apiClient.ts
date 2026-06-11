/**
 * apiClient.ts — 对接 kids-game-backend (Spring Boot, 端口 8080)
 *
 * 覆盖接口：
 *   POST /api/user/register   — 注册
 *   POST /api/auth/login      — 登录（返回 accessToken + refreshToken）
 *   POST /api/auth/refresh    — 刷新 Token
 *   POST /api/auth/logout     — 登出
 *   GET  /api/user/{userId}   — 获取用户信息
 *   POST /api/signin/collect  — 用户签到领奖
 *   GET  /api/signin/info     — 获取用户签到信息
 *   GET  /api/signin/today    — 检查用户今天是否已签到
 *
 * 不走后端的数据（保留本地 localStorage）：
 *   游戏分数、道具、成就、战绩 —— 后端对应接口尚未完全实现
 */

// 后端基地址：通过 .env 注入，默认指向 kids-game-backend
// 开发环境使用相对路径 /api，走 Vite 代理；生产环境使用完整 URL
const API_BASE = import.meta.env.DEV 
  ? '/api'  // 开发环境：使用 /api 前缀，由 Vite 代理到 http://localhost:8080/api
  : ((import.meta.env.VITE_API_BASE as string) || 'http://localhost:8080/api')

// ─────────────────────────────────────────────
// 通用响应结构（kids-game-backend Result<T>）
// ─────────────────────────────────────────────
export interface BackendResult<T = any> {
  code: number    // 200 = 成功
  msg: string
  data?: T
}

// 统一认证响应 DTO（POST /api/auth/login）
export interface AuthResponseData {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  userId: number
  userType: number  // 0-KID, 1-PARENT, 2-ADMIN
  username: string
  nickname: string
  avatar: string
  roles: string[]
  fatiguePoints: number
  dailyAnswerPoints: number
  grade?: string
  parentId?: number
}

// 用户信息 DTO（GET /api/user/{userId}）
export interface UserInfoData {
  userId: number
  userType: number
  username: string
  nickname: string
  avatar: string
  status: number
  fatiguePoints: number
  lastLoginTime: number
  createTime: number
}

// 用户排名数据 DTO
export interface UserRankData {
  rank: number | null
  score: number
  hasRecord: boolean
}

// 游戏评论数据 DTO
export interface GameCommentData {
  id: string
  gameId: number
  userId: number
  username: string
  nickname: string
  content: string
  score: number
  createdAt: number
}

// 提交评论请求 DTO
export interface SubmitCommentRequest {
  gameId: number
  content: string
  score: number
}

// 签到响应数据 DTO
export interface SignInResponseData {
  success: boolean
  message: string
  coinsReward?: number
  expReward?: number
  consecutiveDays?: number
  alreadySignedIn?: boolean
}

// 签到信息数据 DTO
export interface SignInInfoData {
  consecutiveDays: number
  hasSignedInToday: boolean
  recentSignIns?: any[]
}

// ─────────────────────────────────────────────
// 本地 Token 管理
// ─────────────────────────────────────────────
const TOKEN_KEY = 'sgp_access_token'
const REFRESH_KEY = 'sgp_refresh_token'
const USER_ID_KEY = 'sgp_user_id'

class TokenStore {
  getAccess(): string | null { return localStorage.getItem(TOKEN_KEY) }
  getRefresh(): string | null { return localStorage.getItem(REFRESH_KEY) }
  getUserId(): string | null { return localStorage.getItem(USER_ID_KEY) }

  save(access: string, refresh: string, userId: number | string) {
    localStorage.setItem(TOKEN_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
    localStorage.setItem(USER_ID_KEY, String(userId))
  }

  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_ID_KEY)
  }
}

export const tokenStore = new TokenStore()

// ─────────────────────────────────────────────
// HTTP 基础工具
// ─────────────────────────────────────────────
async function request<T = any>(
  path: string,
  options: RequestInit = {},
  withAuth = true
): Promise<BackendResult<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (withAuth) {
    const token = tokenStore.getAccess()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
    const json: BackendResult<T> = await res.json()
    return json
  } catch (err) {
    console.error('[apiClient] 请求失败:', path, err)
    return { code: -1, msg: '网络请求失败' }
  }
}

// ─────────────────────────────────────────────
// 公开 API
// ─────────────────────────────────────────────

/**
 * 注册
 * POST /api/user/register
 * userType: 'KID' | 'PARENT'
 */
export async function apiRegister(
  username: string,
  password: string,
  nickname?: string,
  userType: 'KID' | 'PARENT' = 'KID'
): Promise<{ ok: boolean; msg: string; userId?: number }> {
  const requestBody = {
    username,
    password,
    userType,   // 用户选择的类型：KID 或 PARENT
    nickname: nickname || username, // 如果未提供昵称，使用账号作为昵称
  }
  console.log('[API] 准备调用注册接口', requestBody)
  console.log('[API] JSON.stringify:', JSON.stringify(requestBody))
  
  const res = await request<UserInfoData>(
    '/user/register',
    {
      method: 'POST',
      body: JSON.stringify(requestBody),
    },
    false // 注册不需要 Token
  )

  console.log('[API] 注册接口返回:', res)
  if (res.code === 200 && res.data) {
    return { ok: true, msg: '注册成功！已获得新手双倍卡 x1', userId: res.data.userId }
  }
  console.error('[API] 注册失败:', res)
  return { ok: false, msg: res.msg || '注册失败' }
}

/**
 * 登录（统一认证接口）
 * POST /api/auth/login
 * 注意：登录时不需要传递 userType，后端会根据用户名自动识别用户类型
 */
export async function apiLogin(
  username: string,
  password: string
): Promise<{ ok: boolean; msg: string; data?: AuthResponseData }> {
  console.log('[API] 准备调用登录接口', { username })
  const res = await request<AuthResponseData>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        // 不传递 userType，后端会根据用户名自动识别
      }),
    },
    false
  )

  console.log('[API] 登录接口返回:', res)
  if (res.code === 200 && res.data) {
    const d = res.data
    tokenStore.save(d.accessToken, d.refreshToken, d.userId)
    return { ok: true, msg: `欢迎回来，${d.nickname || d.username}！`, data: d }
  }
  return { ok: false, msg: res.msg || '登录失败' }
}

/**
 * 登出
 * POST /api/auth/logout
 */
export async function apiLogout(): Promise<void> {
  await request('/auth/logout', { method: 'POST' }).catch(() => {/* ignore */})
  tokenStore.clear()
}

/**
 * 刷新 AccessToken
 * POST /api/auth/refresh?refreshToken=...
 */
export async function apiRefreshToken(): Promise<string | null> {
  const refreshToken = tokenStore.getRefresh()
  if (!refreshToken) return null

  const res = await request<{ accessToken: string }>(
    `/auth/refresh?refreshToken=${encodeURIComponent(refreshToken)}`,
    { method: 'POST' },
    false
  )

  if (res.code === 200 && res.data?.accessToken) {
    const userId = tokenStore.getUserId()
    tokenStore.save(res.data.accessToken, refreshToken, userId || '0')
    return res.data.accessToken
  }
  return null
}

/**
 * 获取当前用户信息（根据存储的 userId）
 * GET /api/user/{userId}
 */
export async function apiGetCurrentUser(): Promise<UserInfoData | null> {
  const userId = tokenStore.getUserId()
  if (!userId) return null

  const res = await request<UserInfoData>(`/user/${userId}`)
  if (res.code === 200 && res.data) return res.data

  // Token 可能已过期，尝试刷新
  if (res.code === 401) {
    const newToken = await apiRefreshToken()
    if (newToken) {
      const retry = await request<UserInfoData>(`/user/${userId}`)
      if (retry.code === 200 && retry.data) return retry.data
    }
    // 刷新失败，清除登录态
    tokenStore.clear()
  }
  return null
}

/**
 * 检查后端是否可用（健康检查）
 */
export async function apiHealthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE.replace('/api', '')}/actuator/health`)
    const json = await res.json()
    return json.status === 'UP'
  } catch {
    // 尝试 /api/game/list 作为兜底检测
    try {
      const res2 = await fetch(`${API_BASE}/game/list`)
      return res2.ok
    } catch {
      return false
    }
  }
}

/**
 * 批量获取玩家在多个游戏中的排名
 * POST /api/leaderboard/batch-user-rank
 */
export async function apiGetBatchUserRank(
  userId: number,
  gameIds: number[]
): Promise<{ ok: boolean; data?: Record<number, UserRankData> }> {
  const res = await request<Record<number, UserRankData>>(
    '/leaderboard/batch-user-rank',
    {
      method: 'POST',
      body: JSON.stringify({ userId, gameIds }),
    }
  )

  if (res.code === 200 && res.data) {
    return { ok: true, data: res.data }
  }
  return { ok: false }
}

/**
 * 开始游戏会话
 * POST /api/game/session/start
 */
export interface StartGameSessionRequest {
  gameId: number
}

export interface GameSessionData {
  sessionId: number
  sessionToken: string
  userId: number
  gameId: number
  startTime: number
  status: number  // 0-已结束, 1-进行中
}

export async function apiStartGameSession(gameId: number): Promise<{ ok: boolean; data?: GameSessionData; msg?: string }> {
  try {
    const res = await request<GameSessionData>(
      '/game/session/start',
      {
        method: 'POST',
        body: JSON.stringify({ gameId }),
      }
    )
    
    if (res.code === 200 && res.data) {
      return { ok: true, data: res.data }
    }
    return { ok: false, msg: res.msg }
  } catch (error) {
    console.error('[API] 创建游戏会话失败:', error)
    return { ok: false, msg: String(error) }
  }
}

/**
 * 提交游戏分数到后端排行榜
 * POST /api/game-session/{sessionId}/result
 */
export interface SubmitGameResultRequest {
  sessionId: number
  sessionToken: string
  score: number
  duration: number  // 秒
  lives?: number
  level?: number
  isWin?: boolean
  details?: Record<string, any>
}

export async function apiSubmitGameResult(submitData: SubmitGameResultRequest): Promise<{ ok: boolean; msg?: string }> {
  try {
    const res = await request<void>(
      `/game-session/${submitData.sessionId}/result`,
      {
        method: 'POST',
        body: JSON.stringify(submitData),
      }
    )
    
    if (res.code === 200) {
      return { ok: true }
    }
    return { ok: false, msg: res.msg }
  } catch (error) {
    console.error('[API] 提交游戏结果失败:', error)
    return { ok: false, msg: String(error) }
  }
}

/**
 * 提交游戏评论
 * POST /api/game/{gameId}/comment
 */
export async function apiSubmitComment(
  gameId: number,
  content: string,
  score: number
): Promise<{ ok: boolean; data?: GameCommentData; msg?: string }> {
  try {
    const res = await request<GameCommentData>(
      `/game/${gameId}/comment`,
      {
        method: 'POST',
        body: JSON.stringify({ content, score }),
      }
    )
    
    if (res.code === 200 && res.data) {
      return { ok: true, data: res.data }
    }
    return { ok: false, msg: res.msg }
  } catch (error) {
    console.error('[API] 提交评论失败:', error)
    return { ok: false, msg: String(error) }
  }
}

/**
 * 获取游戏评论列表
 * GET /api/game/{gameId}/comments?page=0&size=20
 */
export async function apiGetComments(
  gameId: number,
  page: number = 0,
  size: number = 20
): Promise<{ ok: boolean; data?: GameCommentData[]; msg?: string }> {
  try {
    const res = await request<GameCommentData[]>(
      `/game/${gameId}/comments?page=${page}&size=${size}`,
      { method: 'GET' }
    )
    
    if (res.code === 200) {
      return { ok: true, data: res.data || [] }
    }
    return { ok: false, msg: res.msg }
  } catch (error) {
    console.error('[API] 获取评论列表失败:', error)
    return { ok: false, msg: String(error) }
  }
}

/**
 * 用户签到领奖
 * POST /api/signin/collect
 */
export async function apiCollectDailyReward(): Promise<{ ok: boolean; data?: SignInResponseData; msg?: string }> {
  try {
    const res = await request<SignInResponseData>(
      '/signin/collect',
      { method: 'POST' }
    )
    
    if (res.code === 200 && res.data) {
      return { ok: true, data: res.data }
    }
    return { ok: false, msg: res.msg }
  } catch (error) {
    console.error('[API] 签到失败:', error)
    return { ok: false, msg: String(error) }
  }
}

/**
 * 获取用户签到信息
 * GET /api/signin/info
 */
export async function apiGetSignInInfo(): Promise<{ ok: boolean; data?: SignInInfoData; msg?: string }> {
  try {
    const res = await request<SignInInfoData>(
      '/signin/info',
      { method: 'GET' }
    )
    
    if (res.code === 200 && res.data) {
      return { ok: true, data: res.data }
    }
    return { ok: false, msg: res.msg }
  } catch (error) {
    console.error('[API] 获取签到信息失败:', error)
    return { ok: false, msg: String(error) }
  }
}

/**
 * 检查用户今天是否已签到
 * GET /api/signin/today
 */
export async function apiHasSignedInToday(): Promise<{ ok: boolean; data?: boolean; msg?: string }> {
  try {
    const res = await request<boolean>(
      '/signin/today',
      { method: 'GET' }
    )
    
    if (res.code === 200) {
      return { ok: true, data: res.data }
    }
    return { ok: false, msg: res.msg }
  } catch (error) {
    console.error('[API] 检查签到状态失败:', error)
    return { ok: false, msg: String(error) }
  }
}

// ─────────────────────────────────────────────
// 兼容旧版 apiClient 接口（供 userService 调用）
// ─────────────────────────────────────────────
class ApiClient {
  /** API 基础地址 */
  readonly baseUrl = API_BASE

  /** 当前是否已登录（有 Token） */
  get isAuthenticated(): boolean {
    return !!tokenStore.getAccess()
  }

  /** 获取带认证的 headers */
  getHeaders(): Record<string, string> {
    const token = tokenStore.getAccess()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  async register(username: string, password: string, nickname?: string, userType: 'KID' | 'PARENT' = 'KID') {
    return apiRegister(username, password, nickname, userType)
  }

  async login(username: string, password: string) {
    return apiLogin(username, password)
  }

  async logout() {
    return apiLogout()
  }

  async getCurrentUser() {
    return apiGetCurrentUser()
  }

  async healthCheck() {
    return apiHealthCheck()
  }
}

export const apiClient = new ApiClient()
