/**
 * 认证工具
 * 提供用户登录状态检查和管理的工具函数
 */

import { API_CONSTANTS } from '@/services/api.types';

/**
 * 检查用户是否已登录
 * @returns boolean 是否已登录
 */
export function isLoggedIn(): boolean {
  try {
    // 检查是否有有效的token（使用统一的 key）
    const token = localStorage.getItem(API_CONSTANTS.TOKEN_KEY);
    const parentToken = localStorage.getItem(API_CONSTANTS.PARENT_TOKEN_KEY);
    // 管理员也使用 TOKEN_KEY
    
    if (!token && !parentToken) {
      return false;
    }

    // 检查是否有用户信息
    const userInfo = localStorage.getItem('userInfo');
    const parentInfo = localStorage.getItem('parentInfo');
    const adminInfo = localStorage.getItem('adminInfo');
    
    const user = JSON.parse(parentInfo || adminInfo || userInfo || '{}');
    const userId = user.userId || user.parentId || user.adminId || user.id || 0;
    
    return userId > 0;
    
  } catch (e) {
    console.warn('[Auth] 检查登录状态失败:', e);
    return false;
  }
}

/**
 * 获取当前用户ID
 * @returns number 用户ID，未登录返回0
 */
export function getCurrentUserId(): number {
  try {
    if (!isLoggedIn()) {
      return 0;
    }

    const userInfo = localStorage.getItem('userInfo');
    const parentInfo = localStorage.getItem('parentInfo');
    const adminInfo = localStorage.getItem('adminInfo');
    
    const user = JSON.parse(parentInfo || adminInfo || userInfo || '{}');
    return user.userId || user.parentId || user.adminId || user.id || 0;
    
  } catch (e) {
    console.warn('[Auth] 获取用户ID失败:', e);
    return 0;
  }
}

/**
 * 获取当前用户名
 * @returns string 用户名
 */
export function getCurrentUserName(): string {
  try {
    const userInfo = localStorage.getItem('userInfo');
    const parentInfo = localStorage.getItem('parentInfo');
    const adminInfo = localStorage.getItem('adminInfo');
    
    const user = JSON.parse(parentInfo || adminInfo || userInfo || '{}');
    return user.username || user.nickname || user.phone || '未知玩家';
  } catch (e) {
    console.warn('[Auth] 获取用户名失败:', e);
    return '未知玩家';
  }
}

/**
 * 获取当前用户类型
 * @returns string 用户类型: 'kid' | 'parent' | 'admin' | 'unknown'
 */
export function getCurrentUserType(): string {
  try {
    if (localStorage.getItem('adminInfo')) {
      return 'admin';
    }
    if (localStorage.getItem('parentInfo')) {
      return 'parent';
    }
    if (localStorage.getItem('userInfo')) {
      return 'kid';
    }
    return 'unknown';
  } catch (e) {
    console.warn('[Auth] 获取用户类型失败:', e);
    return 'unknown';
  }
}

/**
 * 清除所有登录信息
 */
export function clearAllAuth(): void {
  try {
    // 清除token（使用统一的 key）
    localStorage.removeItem(API_CONSTANTS.TOKEN_KEY);
    localStorage.removeItem(API_CONSTANTS.PARENT_TOKEN_KEY);
    
    // 清除用户信息
    localStorage.removeItem('userInfo');
    localStorage.removeItem('parentInfo');
    localStorage.removeItem('adminInfo');
    
    console.log('[Auth] 已清除所有登录信息');
  } catch (e) {
    console.error('[Auth] 清除登录信息失败:', e);
  }
}

/**
 * 检查并重定向到登录页
 * @param redirectPath 重定向路径，默认为'/login'
 * @returns boolean 是否需要重定向
 */
export function checkAndRedirectToLogin(redirectPath: string = '/login'): boolean {
  if (!isLoggedIn()) {
    console.warn('[Auth] 用户未登录，跳转到登录页');
    if (window.location.pathname !== redirectPath) {
      window.location.href = redirectPath;
    }
    return true;
  }
  return false;
}

/**
 * 验证游戏启动权限
 * @returns boolean 是否有权限启动游戏
 */
export function validateGameStartPermission(): boolean {
  if (!isLoggedIn()) {
    alert('请先登录后再玩游戏');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return false;
  }
  return true;
}