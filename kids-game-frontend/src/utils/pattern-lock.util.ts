/**
 * 图案解锁工具类
 * 提供图案解锁的加密存储、验证和管理功能
 * 同时支持本地存储(localStorage)和后端存储(API)
 */

// 图案解锁点的位置定义 (3x3 网格)
export interface PatternPoint {
  row: number;
  col: number;
}

// 图案解锁数据
export interface PatternLockData {
  pattern: string; // 加密后的图案数据
  userId: number;
  userType: 'parent' | 'kid';
  createdAt: number;
}

// 存储键名常量
const PATTERN_LOCK_KEY = 'pattern_lock_data';
const CURRENT_USER_TYPE_KEY = 'current_user_type';

/**
 * 生成随机盐值
 */
function generateSalt(): string {
  return Array.from({ length: 16 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * 简单的加密函数（实际项目中应使用更安全的加密方式）
 */
function encryptPattern(pattern: string, salt: string): string {
  const combined = pattern + salt;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `${salt}:${hash.toString(16)}`;
}

/**
 * 验证图案是否匹配
 */
function verifyPattern(inputPattern: string, storedPattern: string): boolean {
  const [salt, expectedHash] = storedPattern.split(':');
  const inputHash = encryptPattern(inputPattern, salt);
  return inputHash === storedPattern;
}

/**
 * 将图案点数组转换为字符串
 */
export function patternToString(points: PatternPoint[]): string {
  return points.map(p => `${p.row}-${p.col}`).join('|');
}

/**
 * 将字符串转换为图案点数组
 */
export function stringToPattern(str: string): PatternPoint[] {
  if (!str) return [];
  return str.split('|').map(part => {
    const [row, col] = part.split('-').map(Number);
    return { row, col };
  });
}

/**
 * 验证图案是否有效（至少4个点，不重复）
 */
export function isValidPattern(points: PatternPoint[]): boolean {
  if (points.length < 4) return false;
  
  // 检查是否有重复点
  const seen = new Set<string>();
  for (const point of points) {
    const key = `${point.row}-${point.col}`;
    if (seen.has(key)) return false;
    seen.add(key);
  }
  
  // 检查点是否在有效范围内 (0-2)
  for (const point of points) {
    if (point.row < 0 || point.row > 2 || point.col < 0 || point.col > 2) {
      return false;
    }
  }
  
  return true;
}

// ==================== 后端 API 调用 ====================

/**
 * 后端 API 基础路径
 */
const API_BASE_URL = '/api/pattern-lock';

/**
 * 保存图案解锁到后端
 */
async function saveToBackend(pattern: string, userId: number, userType: 'parent' | 'kid'): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userType,
        pattern,
      }),
    });
    
    if (!response.ok) {
      console.warn('[PatternLock] 后端保存失败:', response.status);
    } else {
      console.log('[PatternLock] 图案解锁已保存到后端');
    }
  } catch (error) {
    console.warn('[PatternLock] 后端保存失败(网络错误):', error);
    // 网络错误不抛出，继续使用本地存储
  }
}

/**
 * 从后端验证图案解锁
 */
async function validateFromBackend(pattern: string, userId: number, userType: 'parent' | 'kid'): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userType,
        pattern,
      }),
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.data && result.data.valid !== undefined) {
        console.log('[PatternLock] 后端验证完成');
        return result.data.valid;
      }
    }
  } catch (error) {
    console.warn('[PatternLock] 后端验证失败(网络错误):', error);
  }
  return false;
}

/**
 * 检查后端是否存在图案解锁
 */
async function checkExistsInBackend(userId: number, userType: 'parent' | 'kid'): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/exists?userId=${userId}&userType=${userType}`);
    
    if (response.ok) {
      const result = await response.json();
      if (result.data && result.data.exists !== undefined) {
        return result.data.exists;
      }
    }
  } catch (error) {
    console.warn('[PatternLock] 后端检查失败(网络错误):', error);
  }
  return false;
}

// ==================== 本地存储操作 ====================

/**
 * 保存图案解锁数据（同时保存到本地和后端）
 */
export async function savePatternLock(pattern: string, userId: number, userType: 'parent' | 'kid'): Promise<void> {
  try {
    const salt = generateSalt();
    const encryptedPattern = encryptPattern(pattern, salt);
    
    const data: PatternLockData = {
      pattern: encryptedPattern,
      userId,
      userType,
      createdAt: Date.now(),
    };
    
    const existingData = getPatternLockData();
    const updatedData = existingData.filter(d => !(d.userId === userId && d.userType === userType));
    updatedData.push(data);
    
    localStorage.setItem(PATTERN_LOCK_KEY, JSON.stringify(updatedData));
    console.log('[PatternLock] 图案解锁已保存到本地');
    
    // 同时保存到后端
    await saveToBackend(pattern, userId, userType);
  } catch (error) {
    console.error('[PatternLock] 保存图案解锁失败:', error);
    throw error;
  }
}

/**
 * 获取所有图案解锁数据
 */
export function getPatternLockData(): PatternLockData[] {
  try {
    const data = localStorage.getItem(PATTERN_LOCK_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[PatternLock] 获取图案解锁数据失败:', error);
    return [];
  }
}

/**
 * 获取指定用户的图案解锁数据
 */
export function getPatternLockByUser(userId: number, userType: 'parent' | 'kid'): PatternLockData | null {
  const data = getPatternLockData();
  return data.find(d => d.userId === userId && d.userType === userType) || null;
}

/**
 * 验证图案是否正确（先尝试后端，失败则使用本地存储）
 */
export async function validatePattern(inputPattern: string, userId: number, userType: 'parent' | 'kid'): Promise<boolean> {
  // 先尝试后端验证
  const backendValid = await validateFromBackend(inputPattern, userId, userType);
  if (backendValid) {
    return true;
  }
  
  // 后端失败，使用本地存储验证
  const storedData = getPatternLockByUser(userId, userType);
  if (!storedData) return false;
  
  return verifyPattern(inputPattern, storedData.pattern);
}

/**
 * 删除指定用户的图案解锁
 */
export function deletePatternLock(userId: number, userType: 'parent' | 'kid'): void {
  try {
    const data = getPatternLockData();
    const updatedData = data.filter(d => !(d.userId === userId && d.userType === userType));
    localStorage.setItem(PATTERN_LOCK_KEY, JSON.stringify(updatedData));
    console.log('[PatternLock] 图案解锁已删除');
  } catch (error) {
    console.error('[PatternLock] 删除图案解锁失败:', error);
    throw error;
  }
}

/**
 * 清除所有图案解锁数据
 */
export function clearAllPatternLocks(): void {
  localStorage.removeItem(PATTERN_LOCK_KEY);
  console.log('[PatternLock] 所有图案解锁已清除');
}

/**
 * 检查是否存在图案解锁（先检查本地，再检查后端）
 */
export async function hasPatternLock(userId: number, userType: 'parent' | 'kid'): Promise<boolean> {
  // 先检查本地存储
  const localExists = getPatternLockByUser(userId, userType) !== null;
  if (localExists) {
    return true;
  }
  
  // 本地不存在，检查后端
  return checkExistsInBackend(userId, userType);
}

/**
 * 获取所有已保存图案解锁的用户列表
 */
export function getUsersWithPatternLock(): { userId: number; userType: 'parent' | 'kid' }[] {
  const data = getPatternLockData();
  return data.map(d => ({ userId: d.userId, userType: d.userType }));
}

/**
 * 设置当前登录用户类型
 */
export function setCurrentUserType(userType: 'parent' | 'kid'): void {
  localStorage.setItem(CURRENT_USER_TYPE_KEY, userType);
}

/**
 * 获取当前登录用户类型
 */
export function getCurrentUserType(): 'parent' | 'kid' | null {
  const type = localStorage.getItem(CURRENT_USER_TYPE_KEY);
  return (type === 'parent' || type === 'kid') ? type : null;
}

/**
 * 清除当前用户类型
 */
export function clearCurrentUserType(): void {
  localStorage.removeItem(CURRENT_USER_TYPE_KEY);
}

/**
 * 检查是否需要显示图案解锁
 * 如果用户已登录且有图案解锁记录，则需要显示图案解锁
 */
export function needPatternLock(): boolean {
  const parentInfo = localStorage.getItem('parentInfo');
  const userInfo = localStorage.getItem('userInfo');
  
  if (!parentInfo && !userInfo) {
    return false; // 未登录，不需要图案解锁
  }
  
  // 检查是否已验证过图案
  const patternVerified = localStorage.getItem('pattern_verified');
  if (patternVerified === 'true') {
    return false; // 已经验证过图案
  }
  
  // 检查是否有图案解锁记录
  const data = getPatternLockData();
  if (data.length === 0) {
    return false; // 没有设置图案解锁
  }
  
  return true;
}

/**
 * 标记图案验证成功
 */
export function markPatternVerified(): void {
  localStorage.setItem('pattern_verified', 'true');
}

/**
 * 清除图案验证标记（用于退出登录）
 */
export function clearPatternVerified(): void {
  localStorage.removeItem('pattern_verified');
}
