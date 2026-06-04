/**
 * 用户状态管理
 * 管理儿童用户和家长用户的状态
 * 使用 Pinia 实现
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { kidApi } from '@/services/kid-api.service';
import { parentApi } from '@/services/parent-api.service';
import { API_CONSTANTS } from '@/services/api.types';
import type { Kid, Parent } from '@/services/api.types';

export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  grade: string;
  fatiguePoints: number;
  dailyAnswerPoints: number;
  parentId?: number;
  userType?: 'KID' | 'PARENT' | 'ADMIN';
}

export interface ParentUserInfo {
  parentId: number;
  username: string;
  nickname: string;
  avatar?: string;
  phone: string;
  token?: string;
  fatiguePoints: number;  // 添加疲劳值支持
  dailyAnswerPoints: number;  // 添加每日答题积分
}

export interface AdminUserInfo {
  adminId: number;
  username: string;
  nickname: string;
  avatar?: string;
  token?: string;
  userType: 'ADMIN';
}

export const useUserStore = defineStore('user', () => {
  // ===== 状态 =====

  const currentUser = ref<UserInfo | null>(null);
  const parentUser = ref<ParentUserInfo | null>(null);
  const adminUser = ref<AdminUserInfo | null>(null);
  const favoriteGames = ref<number[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // ===== 计算属性 =====

  const isLoggedIn = computed(() => currentUser.value !== null);
  const isParentLoggedIn = computed(() => parentUser.value !== null);
  const isAdminLoggedIn = computed(() => adminUser.value !== null);
  const hasFatiguePoints = computed(() => {
    return (currentUser.value?.fatiguePoints || 0) > 0;
  });
  const avatar = computed(() => {
    // 优先使用家长的头像，没有则使用儿童的头像
    if (parentUser.value?.avatar) return parentUser.value.avatar;
    return currentUser.value?.avatar || '🐱';
  });
  const username = computed(() => {
    // 优先使用家长的昵称，没有则使用儿童的用户名
    if (parentUser.value?.nickname) return parentUser.value.nickname;
    return currentUser.value?.username || '小玩家';
  });
  const grade = computed(() => currentUser.value?.grade || '1');

  // 家长专用计算属性
  const parentUsername = computed(() => parentUser.value?.nickname || parentUser.value?.phone || '家长');
  const parentAvatar = computed(() => parentUser.value?.avatar || '👨‍👩‍👧');

  // ===== 方法 =====

  /**
   * 统一登录（自动识别儿童或家长）
   */
  async function unifiedLogin(username: string, password: string): Promise<any> {
    isLoading.value = true;
    error.value = null;

    try {
      console.log('[UserStore] 开始统一登录请求...');
      const userData = await kidApi.unifiedLogin(username, password);
      console.log('[UserStore] 登录响应数据:', userData);

      // 保存 token（使用统一的 key）
      if (userData.token) {
        console.log('[UserStore] 保存 token:', userData.token);
        // 根据用户类型保存到不同的 key
        if (userData.userType === 1) {
          // 家长使用 parentToken
          localStorage.setItem(API_CONSTANTS.PARENT_TOKEN_KEY, userData.token);
          parentApi.setParentToken(userData.token);
        } else {
          // 儿童和管理员使用 authToken
          localStorage.setItem(API_CONSTANTS.TOKEN_KEY, userData.token);
          kidApi.setToken(userData.token);
        }
      }

      if (userData.refreshToken) {
        console.log('[UserStore] 保存 refreshToken:', userData.refreshToken);
        localStorage.setItem('refreshToken', userData.refreshToken);
      }

      // 根据用户类型保存不同的用户信息
      if (userData.userType === 0) {
        // 儿童
        currentUser.value = {
          id: userData.userId,
          username: userData.username,
          nickname: userData.nickname,
          avatar: userData.avatar,
          grade: userData.grade || '1',
          fatiguePoints: userData.fatiguePoints || 10,
          dailyAnswerPoints: userData.dailyAnswerPoints || 0,
          parentId: userData.parentId,
          userType: 'KID',
        };

        console.log('[UserStore] 保存儿童信息到 localStorage:', currentUser.value);
        localStorage.setItem('userInfo', JSON.stringify(currentUser.value));
        console.log('[UserStore] 儿童登录成功');
      } else if (userData.userType === 1) {
        // 家长
        parentUser.value = {
          parentId: userData.userId,
          username: userData.username,
          nickname: userData.nickname,
          avatar: userData.avatar,
          phone: userData.username,
          token: userData.token,
          fatiguePoints: userData.fatiguePoints || 10,
          dailyAnswerPoints: userData.dailyAnswerPoints || 0,
        };

        console.log('[UserStore] 保存家长信息到 localStorage:', parentUser.value);
        localStorage.setItem('parentInfo', JSON.stringify(parentUser.value));
        console.log('[UserStore] 家长登录成功');
      } else if (userData.userType === 2) {
        // 管理员
        adminUser.value = {
          adminId: userData.userId,
          username: userData.username,
          nickname: userData.nickname,
          avatar: userData.avatar,
          token: userData.token,
          userType: 'ADMIN',
        };

        console.log('[UserStore] 保存管理员信息到 localStorage:', adminUser.value);
        localStorage.setItem('adminInfo', JSON.stringify(adminUser.value));
        console.log('[UserStore] 管理员登录成功');
      } else {
        throw new Error('未知用户类型');
      }

      return userData;
    } catch (err: any) {
      console.error('[UserStore] 统一登录失败:', err);
      error.value = err.message || '登录失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 儿童登录
   */
  async function kidLogin(username: string, password: string): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      console.log('[UserStore] 开始儿童登录请求...');
      const kidData = await kidApi.login(username, password);
      console.log('[UserStore] 登录响应数据:', kidData);

      // 检查是否有 token（在 deviceId 字段中）
      if (kidData.deviceId) {
        console.log('[UserStore] 保存 token:', kidData.deviceId);
        localStorage.setItem(API_CONSTANTS.TOKEN_KEY, kidData.deviceId);
        kidApi.setToken(kidData.deviceId);
      }

      currentUser.value = {
        id: kidData.kidId,
        username: kidData.username,
        nickname: kidData.nickname,
        avatar: kidData.avatar,
        grade: kidData.grade,
        fatiguePoints: kidData.fatiguePoints,
        dailyAnswerPoints: kidData.dailyAnswerPoints,
        parentId: kidData.parentId,
      };

      console.log('[UserStore] 保存用户信息到 localStorage:', currentUser.value);
      // 保存到 localStorage
      localStorage.setItem('userInfo', JSON.stringify(currentUser.value));
      console.log('[UserStore] 儿童登录成功');
    } catch (err: any) {
      console.error('[UserStore] 儿童登录失败:', err);
      error.value = err.message || '登录失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 家长登录
   */
  async function parentLogin(username: string, password: string): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const parentData = await parentApi.login(username, password);
      console.log('[UserStore] 家长登录成功:', parentData);

      // 将家长数据转换为 ParentUserInfo 接口格式
      parentUser.value = {
        parentId: parentData.userId,
        username: parentData.username, // 使用 username 作为 phone
        nickname: parentData.nickname,
        avatar: parentData.avatar,
        phone: parentData.username,
        token: parentData.token,
        fatiguePoints: parentData.fatiguePoints || 10, // 添加疲劳值，默认10点
        dailyAnswerPoints: parentData.dailyAnswerPoints || 0, // 添加每日答题积分
      };

      // 保存到 localStorage
      localStorage.setItem('parentInfo', JSON.stringify(parentUser.value));
      console.log('[UserStore] 家长登录成功');
    } catch (err: any) {
      console.error('[UserStore] 家长登录失败:', err);
      error.value = err.message || '登录失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 登出（儿童）
   */
  function logoutKid(): void {
    console.log('[UserStore] 开始儿童登出...');
    // 清空用户信息
    currentUser.value = null;
    // 清除所有 localStorage 数据
    localStorage.removeItem('userInfo');
    localStorage.removeItem(API_CONSTANTS.TOKEN_KEY);
    localStorage.removeItem('refreshToken');
    // 清除 API 服务的 token
    kidApi.clearToken();
    console.log('[UserStore] 儿童登出完成');
  }

  /**
   * 登出（家长）
   */
  function logoutParent(): void {
    console.log('[UserStore] 开始家长登出...');
    // 清空家长用户信息
    parentUser.value = null;
    // 清除所有 localStorage 数据
    localStorage.removeItem('parentInfo');
    localStorage.removeItem(API_CONSTANTS.PARENT_TOKEN_KEY);
    localStorage.removeItem('refreshToken');
    // 清除 API 服务的 token
    parentApi.clearToken();
    console.log('[UserStore] 家长登出完成');
  }

  /**
   * 登出（管理员）
   */
  function logoutAdmin(): void {
    adminUser.value = null;
    localStorage.removeItem('adminInfo');
    kidApi.clearToken();
  }

  /**
   * 更新疲劳点
   */
  function updateFatiguePoints(points: number): void {
    if (currentUser.value) {
      currentUser.value.fatiguePoints = points;
      localStorage.setItem('userInfo', JSON.stringify(currentUser.value));
    }
  }

  /**
   * 更新用户信息
   */
  function updateUserInfo(info: Partial<UserInfo>): void {
    if (currentUser.value) {
      currentUser.value = { ...currentUser.value, ...info };
      localStorage.setItem('userInfo', JSON.stringify(currentUser.value));
    }
  }

  /**
   * 从 localStorage 恢复登录状态
   */
  function restoreFromStorage(): void {
    const userInfo = localStorage.getItem('userInfo');
    const parentInfo = localStorage.getItem('parentInfo');
    const adminInfo = localStorage.getItem('adminInfo');
    const favoriteGamesData = localStorage.getItem('favoriteGames');

    // 恢复 token 到 API 服务
    const authToken = localStorage.getItem(API_CONSTANTS.TOKEN_KEY);
    const parentToken = localStorage.getItem(API_CONSTANTS.PARENT_TOKEN_KEY);

    if (authToken) {
      kidApi.setToken(authToken);
      console.log('[UserStore] 恢复儿童/管理员 token');
    }

    if (parentToken) {
      parentApi.setParentToken(parentToken);
      console.log('[UserStore] 恢复家长 token');
    }

    if (userInfo) {
      try {
        currentUser.value = JSON.parse(userInfo);
      } catch (err) {
        console.error('恢复用户信息失败:', err);
        localStorage.removeItem('userInfo');
      }
    }

    if (parentInfo) {
      try {
        parentUser.value = JSON.parse(parentInfo);
      } catch (err) {
        console.error('恢复家长信息失败:', err);
        localStorage.removeItem('parentInfo');
      }
    }

    if (adminInfo) {
      try {
        adminUser.value = JSON.parse(adminInfo);
      } catch (err) {
        console.error('恢复管理员信息失败:', err);
        localStorage.removeItem('adminInfo');
      }
    }

    if (favoriteGamesData) {
      try {
        favoriteGames.value = JSON.parse(favoriteGamesData);
      } catch (err) {
        console.error('恢复收藏游戏失败:', err);
        localStorage.removeItem('favoriteGames');
      }
    }
  }

  /**
   * 静默刷新 Token
   */
  async function refreshTokenSilently(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.log('[UserStore] 没有 refresh token，无法静默刷新');
      return false;
    }

    try {
      console.log('[UserStore] 开始静默刷新 token...');
      await kidApi.refreshToken();
      console.log('[UserStore] Token 刷新成功');
      return true;
    } catch (error) {
      console.error('[UserStore] 刷新 token 失败:', error);
      clearAllLogout();
      return false;
    }
  }

  /**
   * 清空所有登录状态
   */
  function clearAllLogout(): void {
    currentUser.value = null;
    parentUser.value = null;
    adminUser.value = null;
    localStorage.removeItem('userInfo');
    localStorage.removeItem('parentInfo');
    localStorage.removeItem('adminInfo');
    localStorage.removeItem(API_CONSTANTS.TOKEN_KEY);
    localStorage.removeItem(API_CONSTANTS.PARENT_TOKEN_KEY);
    localStorage.removeItem('refreshToken');
    kidApi.clearToken();
    parentApi.clearToken();
    console.log('[UserStore] 已清空所有登录状态');
  }

  /**
   * 切换收藏游戏
   */
  function toggleFavorite(gameId: number): boolean {
    const index = favoriteGames.value.indexOf(gameId);
    if (index > -1) {
      // 取消收藏
      favoriteGames.value.splice(index, 1);
      localStorage.setItem('favoriteGames', JSON.stringify(favoriteGames.value));
      return false;
    } else {
      // 添加收藏
      favoriteGames.value.push(gameId);
      localStorage.setItem('favoriteGames', JSON.stringify(favoriteGames.value));
      return true;
    }
  }

  /**
   * 检查游戏是否已收藏
   */
  function isFavorite(gameId: number): boolean {
    return favoriteGames.value.includes(gameId);
  }

  /**
   * 获取收藏的游戏ID列表
   */
  function getFavoriteGameIds(): number[] {
    return favoriteGames.value;
  }

  /**
   * 刷新疲劳点
   */
  async function refreshFatiguePoints(): Promise<void> {
    if (!currentUser.value) return;

    try {
      const points = await kidApi.getFatiguePoints(currentUser.value.id);
      updateFatiguePoints(points);
    } catch (err) {
      console.error('刷新疲劳点失败:', err);
    }
  }

  /**
   * 刷新家长疲劳点
   */
  async function refreshParentFatiguePoints(): Promise<void> {
    if (!parentUser.value) return;

    try {
      const points = await parentApi.getFatiguePoints(parentUser.value.parentId);
      updateParentFatiguePoints(points);
    } catch (err) {
      console.error('刷新家长疲劳点失败:', err);
    }
  }

  /**
   * 更新家长疲劳点
   */
  function updateParentFatiguePoints(points: number): void {
    if (parentUser.value) {
      parentUser.value.fatiguePoints = points;
      localStorage.setItem('parentInfo', JSON.stringify(parentUser.value));
    }
  }

  /**
   * 检查当前用户（儿童或家长）是否有足够的疲劳点
   */
  function currentUserHasEnoughFatigue(required: number = 1): boolean {
    if (currentUser.value) {
      return currentUser.value.fatiguePoints >= required;
    }
    if (parentUser.value) {
      return parentUser.value.fatiguePoints >= required;
    }
    return false;
  }

  /**
   * 获取当前用户的疲劳点（儿童或家长）
   */
  function getCurrentUserFatiguePoints(): number {
    if (currentUser.value) {
      return currentUser.value.fatiguePoints || 0;
    }
    if (parentUser.value) {
      return parentUser.value.fatiguePoints || 0;
    }
    return 0;
  }

  /**
   * 扣除当前用户的疲劳点
   */
  async function consumeCurrentUserFatiguePoints(points: number = 1): Promise<boolean> {
    if (currentUser.value) {
      return await kidApi.consumeFatiguePoints(currentUser.value.id, points);
    }
    if (parentUser.value) {
      return await parentApi.consumeFatiguePoints(parentUser.value.parentId, points);
    }
    return false;
  }

  return {
    // 状态
    currentUser,
    parentUser,
    adminUser,
    favoriteGames,
    isLoading,
    error,

    // 计算属性
    isLoggedIn,
    isParentLoggedIn,
    isAdminLoggedIn,
    hasFatiguePoints,
    avatar,
    username,
    grade,
    parentUsername,
    parentAvatar,

    // 方法
    unifiedLogin,
    kidLogin,
    parentLogin,
    logoutKid,
    logoutParent,
    logoutAdmin,
    updateFatiguePoints,
    updateUserInfo,
    restoreFromStorage,
    refreshFatiguePoints,
    toggleFavorite,
    isFavorite,
    getFavoriteGameIds,
    currentUserHasEnoughFatigue,
    getCurrentUserFatiguePoints,
    consumeCurrentUserFatiguePoints,
    refreshTokenSilently,
    clearAllLogout,
  };
});
