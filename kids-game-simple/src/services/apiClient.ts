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

import JSEncrypt from 'jsencrypt'

// 后端基地址：开发走 Vite 代理；生产默认同源 /api（Nginx → backend）
function resolveApiBase(): string {
  const raw = (import.meta.env.VITE_API_BASE as string | undefined)?.trim()
  if (import.meta.env.DEV) return '/api'
  if (!raw) return '/api'
  if (raw.startsWith('/')) return raw.replace(/\/$/, '') || '/api'

  if (typeof window !== 'undefined') {
    const pageHost = window.location.hostname
    const pageIsLocal = pageHost === 'localhost' || pageHost === '127.0.0.1'
    try {
      const apiHost = new URL(raw).hostname
      const apiIsLocal = apiHost === 'localhost' || apiHost === '127.0.0.1'
      if (!pageIsLocal && apiIsLocal) {
        console.warn('[apiClient] 页面非本机访问但 API 指向 localhost，已改为同源 /api:', raw)
        return '/api'
      }
    } catch {
      /* 非法 URL，走默认 */
      return '/api'
    }
  }
  return raw.replace(/\/$/, '')
}

const API_BASE = resolveApiBase()

function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  if (API_BASE.endsWith('/api') && p.startsWith('/api/')) {
    return `${API_BASE}${p.slice(4)}`
  }
  if (API_BASE.endsWith('/api') && p === '/api') {
    return API_BASE
  }
  return `${API_BASE}${p}`
}

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
  coins?: number
  exp?: number
  level?: number
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
  coins?: number
  exp?: number
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
  studyCoinsReward?: number
  expReward?: number
  consecutiveDays?: number
  alreadySignedIn?: boolean
  wallet?: { coins: number; studyCoins: number; exp: number; level: number }
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
// 系统 B（frontend shared auth）使用的 key，同步写入以保持两套认证系统登录状态一致
const SHARED_TOKEN_KEY = 'authToken'
const SHARED_REFRESH_KEY = 'refreshToken'
const SHARED_USER_INFO_KEY = 'userInfo'

class TokenStore {
  getAccess(): string | null { return localStorage.getItem(TOKEN_KEY) }
  getRefresh(): string | null { return localStorage.getItem(REFRESH_KEY) }
  getUserId(): string | null { return localStorage.getItem(USER_ID_KEY) }

  save(access: string, refresh: string, userId: number | string) {
    localStorage.setItem(TOKEN_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
    localStorage.setItem(USER_ID_KEY, String(userId))
    // 同步写入系统 B 的 key，使路由守卫 isLoggedIn() 能识别系统 A 的登录状态
    localStorage.setItem(SHARED_TOKEN_KEY, access)
    localStorage.setItem(SHARED_REFRESH_KEY, refresh)
    const uid = Number(userId)
    localStorage.setItem(SHARED_USER_INFO_KEY, JSON.stringify({ id: uid, userId: uid }))
  }

  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_ID_KEY)
    // 同步清除系统 B 的 key，避免登录态残留
    localStorage.removeItem(SHARED_TOKEN_KEY)
    localStorage.removeItem(SHARED_REFRESH_KEY)
    localStorage.removeItem(SHARED_USER_INFO_KEY)
    localStorage.removeItem('parentToken')
    localStorage.removeItem('parentInfo')
    localStorage.removeItem('adminInfo')
  }
}

export const tokenStore = new TokenStore()

// ─────────────────────────────────────────────
// RSA 密码加密（PKCS#1 v1.5，与后端 RSA/ECB/PKCS1Padding 一致）
// ─────────────────────────────────────────────
const PUBLIC_KEY_CACHE_TTL_MS = 10 * 60 * 1000

interface CachedPublicKey {
  publicKey: string
  keyIndex: number
  fetchedAt: number
}

let cachedPublicKey: CachedPublicKey | null = null

function pemFromBase64Spki(base64: string): string {
  const lines = base64.match(/.{1,64}/g) || [base64]
  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`
}

async function fetchPublicKey(): Promise<CachedPublicKey> {
  const now = Date.now()
  if (cachedPublicKey && now - cachedPublicKey.fetchedAt < PUBLIC_KEY_CACHE_TTL_MS) {
    return cachedPublicKey
  }
  const res = await fetch(apiUrl('/auth/public-key'))
  const json = (await res.json()) as {
    code?: number
    data?: { publicKey?: string; keyIndex?: number }
  }
  if (json.code !== 200 || !json.data?.publicKey) {
    throw new Error('获取登录公钥失败')
  }
  cachedPublicKey = {
    publicKey: json.data.publicKey,
    keyIndex: json.data.keyIndex ?? 0,
    fetchedAt: now,
  }
  return cachedPublicKey
}

/**
 * 加密登录密码；生产环境失败抛错，开发环境可回退明文
 */
async function encryptPasswordForLogin(
  plainPassword: string,
): Promise<{ encryptedPassword: string; keyIndex: number } | null> {
  try {
    const { publicKey, keyIndex } = await fetchPublicKey()
    const encrypt = new JSEncrypt()
    encrypt.setPublicKey(pemFromBase64Spki(publicKey))
    const encryptedPassword = encrypt.encrypt(plainPassword)
    if (!encryptedPassword) return null
    return { encryptedPassword, keyIndex }
  } catch (e) {
    console.warn('[apiClient] RSA 加密失败:', e)
    return null
  }
}

// ─────────────────────────────────────────────
// HTTP 基础工具
// ─────────────────────────────────────────────

/** snake_case → camelCase 字符串转换 */
function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

/** 递归将对象/数组的所有 key 从 snake_case 转为 camelCase */
function deepCamelize<T>(val: unknown): T {
  if (val === null || val === undefined) return val as T
  if (Array.isArray(val)) return val.map(deepCamelize) as unknown as T
  if (typeof val === 'object' && !(val instanceof Date)) {
    const obj = val as Record<string, unknown>
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(obj)) {
      result[snakeToCamel(key)] = deepCamelize(obj[key])
    }
    return result as T
  }
  return val as T
}

function networkFailureMessage(err: unknown): string {
  const msg = String((err as Error)?.message ?? err)
  if (/connection reset/i.test(msg)) {
    return '网络连接被重置，请检查网络或稍后再试'
  }
  if (/failed to fetch/i.test(msg)) {
    return '无法连接服务器，请检查网络或 API 地址'
  }
  return '网络请求失败'
}

// ─────────────────────────────────────────────
// 401 全局自动刷新（单飞模式，避免并发刷新）
// ─────────────────────────────────────────────
const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/public-key', '/auth/register', '/auth/logout']

function isAuthEndpoint(path: string): boolean {
  return AUTH_ENDPOINTS.some(ep => path.includes(ep))
}

let refreshPromise: Promise<string | null> | null = null

function refreshOnce(): Promise<string | null> {
  if (refreshPromise) return refreshPromise
  refreshPromise = apiRefreshToken().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

async function request<T = any>(
  path: string,
  options: RequestInit = {},
  withAuth = true,
): Promise<BackendResult<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (withAuth) {
    const token = tokenStore.getAccess()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const url = apiUrl(path)
  const doFetch = async (): Promise<BackendResult<T>> => {
    try {
      const res = await fetch(url, { ...options, headers })
      const json = await res.json()
      return deepCamelize(json)
    } catch (err) {
      console.error('[apiClient] 请求失败:', path, url, err)
      if (
        err instanceof TypeError &&
        String((err as Error).message).includes('fetch')
      ) {
        console.warn(
          '[apiClient] 多为 SSL/跨域或 API 不可达，当前 API_BASE=',
          API_BASE,
          '；Android 请确认 .env.production 后重新 build + cap sync',
        )
      }
      return { code: -1, msg: networkFailureMessage(err) }
    }
  }

  const result = await doFetch()

  // 401 自动刷新：仅对需鉴权的非认证端点生效，刷新成功后重试一次
  if (result.code === 401 && withAuth && !isAuthEndpoint(path)) {
    const newToken = await refreshOnce()
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`
      return doFetch()
    }
    // 刷新失败，清除登录态
    tokenStore.clear()
  }

  return result
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
  // RSA 加密密码，生产环境强制加密，开发环境可回退明文
  const encrypted = await encryptPasswordForLogin(password)
  let body: Record<string, unknown>
  if (encrypted) {
    body = {
      username,
      encryptedPassword: encrypted.encryptedPassword,
      keyIndex: encrypted.keyIndex,
    }
  } else {
    if (import.meta.env.PROD) {
      return { ok: false, msg: '无法安全加密密码，请检查网络后重试' }
    }
    body = { username, password }
  }

  const res = await request<AuthResponseData>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    false,
  )

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
 * POST /api/auth/refresh（refreshToken 放 request body，避免泄露到 URL/日志）
 */
export async function apiRefreshToken(): Promise<string | null> {
  const refreshToken = tokenStore.getRefresh()
  if (!refreshToken) return null

  const res = await request<{ accessToken: string }>(
    '/auth/refresh',
    {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    },
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

  // 网络异常等非鉴权错误：保留 Token，避免移动端弱网误清登录态
  if (res.code === -1) {
    console.warn('[apiClient] getCurrentUser 网络失败，保留本地 Token')
    return null
  }

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
// 收藏 API
// ─────────────────────────────────────────────

/**
 * 添加收藏
 * POST /api/favorite/add?gameId=xxx
 */
export async function apiAddFavorite(gameId: number): Promise<{ ok: boolean; msg?: string }> {
  try {
    const res = await request<void>(
      `/favorite/add?gameId=${gameId}`,
      { method: 'POST' }
    )
    
    if (res.code === 200) {
      return { ok: true }
    }
    return { ok: false, msg: res.msg }
  } catch (error) {
    console.error('[API] 添加收藏失败:', error)
    return { ok: false, msg: String(error) }
  }
}

/**
 * 取消收藏
 * POST /api/favorite/remove?gameId=xxx
 */
export async function apiRemoveFavorite(gameId: number): Promise<{ ok: boolean; msg?: string }> {
  try {
    const res = await request<void>(
      `/favorite/remove?gameId=${gameId}`,
      { method: 'POST' }
    )
    
    if (res.code === 200) {
      return { ok: true }
    }
    return { ok: false, msg: res.msg }
  } catch (error) {
    console.error('[API] 取消收藏失败:', error)
    return { ok: false, msg: String(error) }
  }
}

/**
 * 获取收藏列表
 * GET /api/favorite/list
 */
export async function apiGetFavoriteList(): Promise<{ ok: boolean; data?: number[]; msg?: string }> {
  try {
    const res = await request<number[]>(
      '/favorite/list',
      { method: 'GET' }
    )
    
    if (res.code === 200) {
      return { ok: true, data: res.data || [] }
    }
    return { ok: false, msg: res.msg }
  } catch (error) {
    console.error('[API] 获取收藏列表失败:', error)
    return { ok: false, msg: String(error) }
  }
}

/**
 * 检查是否已收藏
 * GET /api/favorite/check?gameId=xxx
 */
export async function apiCheckFavorite(gameId: number): Promise<{ ok: boolean; data?: boolean; msg?: string }> {
  try {
    const res = await request<boolean>(
      `/favorite/check?gameId=${gameId}`,
      { method: 'GET' }
    )
    
    if (res.code === 200) {
      return { ok: true, data: res.data }
    }
    return { ok: false, msg: res.msg }
  } catch (error) {
    console.error('[API] 检查收藏状态失败:', error)
    return { ok: false, msg: String(error) }
  }
}

export interface GameSettleResult {
  success?: boolean
  message?: string
  coinsEarned?: number
  expEarned?: number
  studyCoinsSpent?: number
  coins?: number
  studyCoins?: number
  exp?: number
  level?: number
  rank?: number | null
  sessionScore?: number
}

/** POST /api/user/fatigue/consume — 消耗游学币（与 frontend kidApi 对齐） */
export async function apiConsumeFatiguePoints(
  userId: number,
  userType: 0 | 1,
  points = 1,
): Promise<{ ok: boolean; msg?: string }> {
  const body = new URLSearchParams({
    userId: String(userId),
    userType: String(userType),
    points: String(points),
  })
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }
  const token = tokenStore.getAccess()
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    const res = await fetch(`${API_BASE}/user/fatigue/consume`, {
      method: 'POST',
      headers,
      body,
    })
    const json = (await res.json()) as BackendResult<boolean>
    const normalized = deepCamelize<BackendResult<boolean>>(json)
    if (normalized.code === 200 && normalized.data === true) return { ok: true }
    return { ok: false, msg: normalized.msg || '扣除游学币失败' }
  } catch (err) {
    console.error('[apiClient] consume fatigue failed', err)
    return { ok: false, msg: '网络请求失败' }
  }
}

/** POST /api/game/settle — 游戏结束结算（扣游学币、发关卡奖励、单局排行） */
export async function apiGameSettle(
  gameId: number,
  score: number,
  levelReached: number
): Promise<{ ok: boolean; data?: GameSettleResult; msg?: string }> {
  const res = await request<GameSettleResult>('/game/settle', {
    method: 'POST',
    body: JSON.stringify({ gameId, score, levelReached }),
  })
  if (res.code === 200 && res.data) return { ok: true, data: res.data }
  return { ok: false, msg: res.msg }
}

/** GET /api/shop/products（需登录，与 SecurityConfig /api/** 一致） */
export async function apiShopProducts(): Promise<{ ok: boolean; data?: Array<Record<string, unknown>> }> {
  const res = await request<Array<Record<string, unknown>>>('/shop/products', { method: 'GET' })
  if (res.code === 200) return { ok: true, data: res.data || [] }
  return { ok: false, msg: res.msg }
}

/** POST /api/shop/purchase */
export async function apiShopPurchase(productId: number, quantity = 1) {
  const res = await request<Record<string, unknown>>('/shop/purchase', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  })
  if (res.code === 200 && res.data) return { ok: true, data: res.data }
  return { ok: false, msg: res.msg }
}

/** GET /api/task/list */
export async function apiTaskList() {
  const res = await request<Array<Record<string, unknown>>>('/task/list')
  if (res.code === 200) return { ok: true, data: res.data || [] }
  return { ok: false, msg: res.msg }
}

/** POST /api/task/claim */
export async function apiTaskClaim(taskId: number) {
  const res = await request<Record<string, unknown>>('/task/claim', {
    method: 'POST',
    body: JSON.stringify({ taskId }),
  })
  if (res.code === 200 && res.data) return { ok: true, data: res.data }
  return { ok: false, msg: res.msg }
}

/** 游玩记录条目（后端 GET /api/user/game-records 响应） */
export interface GameRecordData {
  gameId: number
  score: number
  playedAt: string
  isNewBest: boolean
}

/** GET /api/user/game-records — 获取用户游玩记录 */
export async function apiGetGameRecords(): Promise<{ ok: boolean; data?: GameRecordData[] }> {
  const res = await request<GameRecordData[]>('/user/game-records', { method: 'GET' })
  if (res.code === 200 && res.data) return { ok: true, data: res.data }
  return { ok: false }
}

/** POST /api/user/game-record — 保存游戏记录 */
export async function apiSaveGameRecord(gameId: number, score: number, isNewBest: boolean): Promise<{ ok: boolean }> {
  const res = await request('/user/game-record', {
    method: 'POST',
    body: JSON.stringify({ gameId, score, isNewBest })
  })
  if (res.code === 200) return { ok: true }
  return { ok: false }
}

/** GET /api/leaderboard/session-top — 单局得分前100 */
export async function apiSessionLeaderboard(gameId: number, limit = 100) {
  const res = await request<{ list: Array<{ rank: number; nickname?: string; username?: string; score: number }> }>(
    `/leaderboard/session-top?gameId=${gameId}&limit=${limit}`,
    { method: 'GET' },
  )
  if (res.code === 200 && res.data) return { ok: true, list: res.data.list || [] }
  return { ok: false, list: [] as Array<{ rank: number; nickname?: string; username?: string; score: number }> }
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

  async addFavorite(gameId: number) {
    return apiAddFavorite(gameId)
  }

  async removeFavorite(gameId: number) {
    return apiRemoveFavorite(gameId)
  }

  async getFavoriteList() {
    return apiGetFavoriteList()
  }

  async checkFavorite(gameId: number) {
    return apiCheckFavorite(gameId)
  }
}

export const apiClient = new ApiClient()
