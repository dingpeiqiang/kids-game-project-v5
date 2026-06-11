/**
 * 登录成功后写入本地会话（供 userStore / 登录页复用）
 */
import { API_CONSTANTS } from '@/services/api.types';
import type { UnifiedAuthResult } from '@/services/auth-api.service';
import { kidApi } from '@/services/kid-api.service';
import { parentApi } from '@/services/parent-api.service';

export function persistAuthSession(userData: UnifiedAuthResult): void {
  if (userData.userType === 1) {
    localStorage.setItem(API_CONSTANTS.PARENT_TOKEN_KEY, userData.token);
    parentApi.setParentToken(userData.token);
  } else {
    localStorage.setItem(API_CONSTANTS.TOKEN_KEY, userData.token);
    kidApi.setToken(userData.token);
  }

  if (userData.refreshToken) {
    localStorage.setItem('refreshToken', userData.refreshToken);
  }

  if (userData.userType === 0) {
    const kidInfo = {
      id: userData.userId,
      username: userData.username,
      nickname: userData.nickname,
      avatar: userData.avatar,
      grade: userData.grade || '1',
      fatiguePoints: userData.fatiguePoints ?? 10,
      dailyAnswerPoints: userData.dailyAnswerPoints ?? 0,
      parentId: userData.parentId,
      userType: 'KID' as const,
    };
    localStorage.setItem('userInfo', JSON.stringify(kidInfo));
    return;
  }

  if (userData.userType === 1) {
    const parentInfo = {
      parentId: userData.userId,
      username: userData.username,
      nickname: userData.nickname,
      avatar: userData.avatar,
      phone: userData.phone || userData.username,
      token: userData.token,
      fatiguePoints: userData.fatiguePoints ?? 10,
      dailyAnswerPoints: userData.dailyAnswerPoints ?? 0,
    };
    localStorage.setItem('parentInfo', JSON.stringify(parentInfo));
    return;
  }

  if (userData.userType === 2) {
    const adminInfo = {
      adminId: userData.userId,
      username: userData.username,
      nickname: userData.nickname,
      avatar: userData.avatar,
      token: userData.token,
      userType: 'ADMIN' as const,
    };
    localStorage.setItem('adminInfo', JSON.stringify(adminInfo));
  }
}

/** 仅记住家长登录账号（不存密码） */
const PARENT_USERNAME_KEY = 'parentLoginUsername';

export function saveParentLoginUsername(username: string): void {
  try {
    localStorage.setItem(
      PARENT_USERNAME_KEY,
      JSON.stringify({ username: username.trim(), lastLoginTime: Date.now() }),
    );
  } catch {
    /* ignore */
  }
}

export function loadParentLoginUsername(): string {
  try {
    const raw = localStorage.getItem(PARENT_USERNAME_KEY);
    if (raw) {
      const info = JSON.parse(raw) as { username?: string };
      return info.username || '';
    }
    const legacy = localStorage.getItem('parentLoginInfo');
    if (legacy) {
      const info = JSON.parse(legacy) as { username?: string };
      localStorage.removeItem('parentLoginInfo');
      if (info.username) {
        saveParentLoginUsername(info.username);
        return info.username;
      }
    }
  } catch {
    /* ignore */
  }
  return '';
}