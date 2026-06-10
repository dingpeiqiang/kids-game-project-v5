import { API_CONSTANTS } from './api-types';

export type ClientUserType = 'kid' | 'parent' | 'admin' | 'unknown';

export const DEFAULT_PLAY_APP_URL = 'http://localhost:3001';
export const DEFAULT_ADMIN_APP_URL = 'http://localhost:3000';

export function getCurrentUserType(): ClientUserType {
  try {
    if (localStorage.getItem('adminInfo')) return 'admin';
    if (localStorage.getItem('parentInfo')) return 'parent';
    if (localStorage.getItem('userInfo')) return 'kid';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

export function isLoggedIn(): boolean {
  try {
    const token = localStorage.getItem(API_CONSTANTS.TOKEN_KEY);
    const parentToken = localStorage.getItem(API_CONSTANTS.PARENT_TOKEN_KEY);
    if (!token && !parentToken) return false;

    const userInfo = localStorage.getItem('userInfo');
    const parentInfo = localStorage.getItem('parentInfo');
    const adminInfo = localStorage.getItem('adminInfo');
    const user = JSON.parse(parentInfo || adminInfo || userInfo || '{}');
    const userId = user.userId || user.parentId || user.adminId || user.id || 0;
    return userId > 0;
  } catch {
    return false;
  }
}

export function clearAllAuth(): void {
  localStorage.removeItem(API_CONSTANTS.TOKEN_KEY);
  localStorage.removeItem(API_CONSTANTS.PARENT_TOKEN_KEY);
  localStorage.removeItem('userInfo');
  localStorage.removeItem('parentInfo');
  localStorage.removeItem('adminInfo');
  localStorage.removeItem('refreshToken');
}

export function getCurrentUserId(): number {
  try {
    if (!isLoggedIn()) return 0;
    const userInfo = localStorage.getItem('userInfo');
    const parentInfo = localStorage.getItem('parentInfo');
    const adminInfo = localStorage.getItem('adminInfo');
    const user = JSON.parse(parentInfo || adminInfo || userInfo || '{}');
    return user.userId || user.parentId || user.adminId || user.id || 0;
  } catch {
    return 0;
  }
}

export function getCurrentUserName(): string {
  try {
    const userInfo = localStorage.getItem('userInfo');
    const parentInfo = localStorage.getItem('parentInfo');
    const adminInfo = localStorage.getItem('adminInfo');
    const user = JSON.parse(parentInfo || adminInfo || userInfo || '{}');
    return user.username || user.nickname || user.phone || '未知玩家';
  } catch {
    return '未知玩家';
  }
}

export function checkAndRedirectToLogin(redirectPath: string = API_CONSTANTS.LOGIN_PATH): boolean {
  if (!isLoggedIn()) {
    if (typeof window !== 'undefined' && window.location.pathname !== redirectPath) {
      window.location.href = redirectPath;
    }
    return true;
  }
  return false;
}

/** 终端游戏启动前校验（含游客试玩 10 分钟） */
export function validateGameStartPermission(): boolean {
  if (typeof window === 'undefined') return true;

  const isGuest = localStorage.getItem('isGuest') === 'true';
  if (isGuest) {
    const guestStartTime = localStorage.getItem('guestStartTime');
    if (guestStartTime) {
      const elapsedMinutes = (Date.now() - parseInt(guestStartTime, 10)) / (1000 * 60);
      if (elapsedMinutes >= 10) {
        alert('游客试玩时间已到（10分钟），请注册或登录后继续游戏！');
        if (window.location.pathname !== API_CONSTANTS.LOGIN_PATH) {
          window.location.href = API_CONSTANTS.LOGIN_PATH;
        }
        return false;
      }
    }
    return true;
  }

  if (!isLoggedIn()) {
    alert('请先登录后再玩游戏');
    if (window.location.pathname !== API_CONSTANTS.LOGIN_PATH) {
      window.location.href = API_CONSTANTS.LOGIN_PATH;
    }
    return false;
  }
  return true;
}