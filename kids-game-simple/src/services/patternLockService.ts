/**
 * patternLockService.ts — 图案解锁服务
 * 
 * 功能：
 * 1. 图案加密存储（盐值+SHA256哈希）
 * 2. 图案验证
 * 3. 双存储策略（localStorage + 后端MySQL）
 * 4. 尝试次数限制与临时锁定机制
 */

import { apiClient, tokenStore } from './apiClient'

// ─────────────────────────────────────────────
// 本地存储 key
// ─────────────────────────────────────────────
const LOCAL_KEYS = {
  patternLock: (userId: string, userType: 'parent' | 'kid') => `ugp_pl_${userType}_${userId}`,
  attemptCount: 'ugp_pl_attempts',
  lockUntil: 'ugp_pl_lockuntil',
}

// ─────────────────────────────────────────────
// 图案数据结构
// ─────────────────────────────────────────────
export interface PatternLockData {
  encryptedPattern: string
  salt: string
  userId: number
  userType: 'PARENT' | 'KID'
}

// ─────────────────────────────────────────────
// 加密工具函数
// ─────────────────────────────────────────────

/** 生成随机盐值 */
function generateSalt(): string {
  return Array.from({ length: 16 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('')
}

/** SHA256 哈希 */
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** 加密图案 */
async function encryptPattern(pattern: string, salt: string): Promise<string> {
  return sha256(pattern + salt)
}

// ─────────────────────────────────────────────
// 尝试次数限制配置
// ─────────────────────────────────────────────
const MAX_ATTEMPTS = 5
const LOCK_DURATION = 60 * 1000 // 60秒

// ─────────────────────────────────────────────
// PatternLockService 主类
// ─────────────────────────────────────────────
class PatternLockService {
  private _attemptCount = 0
  private _lockUntil = 0

  constructor() {
    this._loadAttemptData()
  }

  private _loadAttemptData() {
    try {
      const count = localStorage.getItem(LOCAL_KEYS.attemptCount)
      const until = localStorage.getItem(LOCAL_KEYS.lockUntil)
      this._attemptCount = count ? parseInt(count, 10) : 0
      this._lockUntil = until ? parseInt(until, 10) : 0
    } catch {
      this._attemptCount = 0
      this._lockUntil = 0
    }
  }

  private _saveAttemptData() {
    localStorage.setItem(LOCAL_KEYS.attemptCount, this._attemptCount.toString())
    localStorage.setItem(LOCAL_KEYS.lockUntil, this._lockUntil.toString())
  }

  /** 是否处于锁定状态 */
  get isLocked(): boolean {
    return Date.now() < this._lockUntil
  }

  /** 剩余锁定时间（秒） */
  get remainingLockTime(): number {
    if (!this.isLocked) return 0
    return Math.ceil((this._lockUntil - Date.now()) / 1000)
  }

  /** 剩余尝试次数 */
  get remainingAttempts(): number {
    if (this.isLocked) return 0
    return MAX_ATTEMPTS - this._attemptCount
  }

  /** 增加尝试失败次数 */
  private _incrementAttempts() {
    this._attemptCount++
    if (this._attemptCount >= MAX_ATTEMPTS) {
      this._lockUntil = Date.now() + LOCK_DURATION
    }
    this._saveAttemptData()
  }

  /** 重置尝试次数 */
  private _resetAttempts() {
    this._attemptCount = 0
    this._lockUntil = 0
    this._saveAttemptData()
  }

  // ── 保存图案解锁（双存储策略）────────────────
  async savePatternLock(pattern: string, userId: number, userType: 'PARENT' | 'KID'): Promise<{ ok: boolean; msg: string }> {
    // 验证图案格式（3-9个点，0-8表示3x3网格位置）
    if (!this._validatePattern(pattern)) {
      return { ok: false, msg: '无效的图案格式' }
    }

    // 生成盐值并加密
    const salt = generateSalt()
    const encryptedPattern = await encryptPattern(pattern, salt)

    const data: PatternLockData = {
      encryptedPattern,
      salt,
      userId,
      userType,
    }

    // 本地存储
    try {
      const localKey = LOCAL_KEYS.patternLock(userId.toString(), userType.toLowerCase() as 'parent' | 'kid')
      localStorage.setItem(localKey, JSON.stringify(data))
    } catch (e) {
      console.error('[PatternLockService] 本地存储失败:', e)
    }

    // 后端存储
    const accessToken = tokenStore.getAccess()
    if (accessToken) {
      try {
        const response = await apiClient.savePatternLock(data)
        if (!response.ok) {
          console.warn('[PatternLockService] 后端存储失败:', response.msg)
          // 后端失败不阻止本地存储成功
        }
      } catch (e) {
        console.error('[PatternLockService] 后端存储异常:', e)
      }
    }

    return { ok: true, msg: '图案设置成功' }
  }

  // ── 验证图案解锁 ────────────────────────────
  async validatePattern(pattern: string, userId: number, userType: 'PARENT' | 'KID'): Promise<{ ok: boolean; msg: string }> {
    // 检查是否锁定
    if (this.isLocked) {
      return { ok: false, msg: `已被锁定，请${this.remainingLockTime}秒后重试` }
    }

    // 验证图案格式
    if (!this._validatePattern(pattern)) {
      return { ok: false, msg: '无效的图案格式' }
    }

    // 先从本地获取图案数据
    const localKey = LOCAL_KEYS.patternLock(userId.toString(), userType.toLowerCase() as 'parent' | 'kid')
    let localData: PatternLockData | null = null
    
    try {
      const raw = localStorage.getItem(localKey)
      if (raw) {
        localData = JSON.parse(raw) as PatternLockData
      }
    } catch (e) {
      console.error('[PatternLockService] 读取本地数据失败:', e)
    }

    // 如果本地没有，尝试从后端获取
    if (!localData) {
      const accessToken = tokenStore.getAccess()
      if (accessToken) {
        try {
          const response = await apiClient.getPatternLock(userId, userType)
          if (response.ok && response.data) {
            localData = response.data
            // 缓存到本地
            localStorage.setItem(localKey, JSON.stringify(localData))
          }
        } catch (e) {
          console.error('[PatternLockService] 从后端获取图案失败:', e)
          return { ok: false, msg: '未找到图案解锁设置' }
        }
      } else {
        return { ok: false, msg: '未找到图案解锁设置' }
      }
    }

    // 验证图案
    if (!localData) {
      return { ok: false, msg: '未找到图案解锁设置' }
    }
    const encryptedInput = await encryptPattern(pattern, localData.salt)
    
    if (encryptedInput === localData.encryptedPattern) {
      // 验证成功，重置尝试次数
      this._resetAttempts()
      return { ok: true, msg: '验证成功' }
    } else {
      // 验证失败，增加尝试次数
      this._incrementAttempts()
      
      if (this.isLocked) {
        return { ok: false, msg: `图案错误！已被锁定，请${this.remainingLockTime}秒后重试` }
      }
      
      return { ok: false, msg: `图案错误！剩余${this.remainingAttempts}次尝试机会` }
    }
  }

  // ── 检查是否存在图案解锁设置 ────────────────
  async hasPatternLock(userId: number, userType: 'PARENT' | 'KID'): Promise<boolean> {
    // 先检查本地
    const localKey = LOCAL_KEYS.patternLock(userId.toString(), userType.toLowerCase() as 'parent' | 'kid')
    try {
      if (localStorage.getItem(localKey)) {
        return true
      }
    } catch (e) {
      console.error('[PatternLockService] 检查本地数据失败:', e)
    }

    // 再检查后端
    const accessToken = tokenStore.getAccess()
    if (accessToken) {
      try {
        const response = await apiClient.hasPatternLock(userId, userType)
        return response.ok && response.data?.exists === true
      } catch (e) {
        console.error('[PatternLockService] 检查后端数据失败:', e)
      }
    }

    return false
  }

  // ── 删除图案解锁 ────────────────────────────
  async deletePatternLock(userId: number, userType: 'PARENT' | 'KID'): Promise<{ ok: boolean; msg: string }> {
    // 删除本地存储
    const localKey = LOCAL_KEYS.patternLock(userId.toString(), userType.toLowerCase() as 'parent' | 'kid')
    try {
      localStorage.removeItem(localKey)
    } catch (e) {
      console.error('[PatternLockService] 删除本地数据失败:', e)
    }

    // 删除后端存储
    const accessToken = tokenStore.getAccess()
    if (accessToken) {
      try {
        const response = await apiClient.deletePatternLock(userId, userType)
        if (!response.ok) {
          console.warn('[PatternLockService] 后端删除失败:', response.msg)
        }
      } catch (e) {
        console.error('[PatternLockService] 后端删除异常:', e)
      }
    }

    return { ok: true, msg: '图案已删除' }
  }

  // ── 更新图案解锁 ────────────────────────────
  async updatePatternLock(pattern: string, userId: number, userType: 'PARENT' | 'KID'): Promise<{ ok: boolean; msg: string }> {
    // 先删除旧的
    await this.deletePatternLock(userId, userType)
    // 再保存新的
    return this.savePatternLock(pattern, userId, userType)
  }

  // ── 图案格式验证 ────────────────────────────
  private _validatePattern(pattern: string): boolean {
    // 图案应为数字字符串，每个数字代表3x3网格中的一个点（0-8）
    // 例如："01245" 表示从点0到点1到点2到点4到点5
    if (!/^[0-8]{3,9}$/.test(pattern)) {
      return false
    }
    
    // 检查是否有重复点
    const uniqueChars = new Set(pattern.split(''))
    return uniqueChars.size === pattern.length
  }
}

export const patternLockService = new PatternLockService()
