/**
 * 模拟游戏数据（已禁用）
 * 在后端 API 不可用时使用
 * 
 * 注意：为了强制使用真实数据，模拟数据已被禁用
 * 如果 API 调用失败，将显示空列表和错误提示
 */
const MOCK_GAMES: Game[] = [
  // 空数组 - 不再使用模拟数据
];

/**
 * 游戏状态管理
 * 管理游戏会话、游戏记录等状态
 * 使用 Pinia 实现
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { gameApi } from '@/services/game-api.service';
import { kidApi } from '@/services/kid-api.service';
import type { Game, GameRecord } from '@/services/api.types';

export interface GameSession {
  sessionId: number;
  gameId: number;
  gameCode: string;
  gameName: string;
  userId: number; // 用户ID（儿童或家长）
  startTime: number;
  duration: number;
  score: number;
  status: 'playing' | 'paused' | 'ended';
}

export const useGameStore = defineStore('game', () => {
  // ===== 状态 =====

  const currentSession = ref<GameSession | null>(null);
  const gameList = ref<Game[]>([]);
  const gameRecords = ref<GameRecord[]>([]);
  const recentGames = ref<number[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // ===== 计算属性 =====

  const isPlaying = computed(() => {
    return currentSession.value?.status === 'playing';
  });
  const isPaused = computed(() => {
    return currentSession.value?.status === 'paused';
  });
  const currentScore = computed(() => {
    return currentSession.value?.score || 0;
  });
  const currentDuration = computed(() => {
    return currentSession.value?.duration || 0;
  });

  // ===== 方法 =====

  /**
   * 加载游戏列表
   */
  async function loadGameList(grade?: string, category?: string, kidId?: number): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      gameList.value = await gameApi.getList(grade, category, kidId);
      console.info('[GameStore] 已加载', gameList.value.length, '个游戏');
    } catch (err: any) {
      // API 调用失败时，不设置模拟数据，抛出错误让应用处理
      console.error('[GameStore] 加载游戏列表失败:', err.message);
      error.value = `加载游戏列表失败：${err.message}`;
      gameList.value = [];
      // 抛出错误，让调用方知道加载失败
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 开始游戏
   */
  async function startGame(gameId: number, userId?: number): Promise<void> {
    // 直接使用传入的 userId，或者从 localStorage 获取
    let resolvedUserId = userId;
    if (!resolvedUserId) {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        try {
          const parsed = JSON.parse(userInfo);
          resolvedUserId = parsed.id;
        } catch (err) {
          console.error('[GameStore] 解析用户信息失败:', err);
        }
      }
    }
  
    if (!resolvedUserId) {
      throw new Error('用户未登录');
    }
  
    isLoading.value = true;
    error.value = null;
  
    try {
      // 尝试调用 API
      try {
        const sessionId = await gameApi.start(resolvedUserId, gameId);
          
        const game = gameList.value.find(g => g.gameId === gameId);
        if (!game) {
          throw new Error('游戏不存在');
        }
  
        currentSession.value = {
          sessionId,
          gameId,
          gameCode: game.gameCode,
          gameName: game.gameName,
          userId: resolvedUserId, // 保存用户 ID（儿童或家长）
          startTime: Date.now(),
          duration: 0,
          score: 0,
          status: 'playing',
        };
      } catch (apiErr: any) {
        // API 调用失败，抛出错误
        console.error('[GameStore] 开始游戏 API 调用失败:', apiErr.message);
        throw apiErr;
      }
  
      // 添加到最近游戏
      addToRecentGames(gameId);
    } catch (err: any) {
      error.value = err.message || '开始游戏失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 结束游戏
   */
  async function endGame(): Promise<void> {
    if (!currentSession.value) return;

    isLoading.value = true;
    error.value = null;

    try {
      await gameApi.end(
        currentSession.value.sessionId,
        currentSession.value.duration,
        currentSession.value.score
      );

      currentSession.value.status = 'ended';
      currentSession.value = null;
    } catch (err: any) {
      error.value = err.message || '结束游戏失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 游戏心跳
   */
  async function gameHeartbeat(duration: number, score: number): Promise<void> {
    if (!currentSession.value) return;

    try {
      await gameApi.heartbeat(
        currentSession.value.sessionId,
        duration,
        score
      );

      currentSession.value.duration = duration;
      currentSession.value.score = score;
    } catch (err) {
      console.error('游戏心跳失败:', err);
    }
  }

  /**
   * 暂停游戏
   */
  function pauseGame(): void {
    if (currentSession.value && currentSession.value.status === 'playing') {
      currentSession.value.status = 'paused';
    }
  }

  /**
   * 恢复游戏
   */
  function resumeGame(): void {
    if (currentSession.value && currentSession.value.status === 'paused') {
      currentSession.value.status = 'playing';
    }
  }

  /**
   * 添加到最近游戏
   */
  function addToRecentGames(gameId: number): void {
    // 移除已存在的
    const index = recentGames.value.indexOf(gameId);
    if (index > -1) {
      recentGames.value.splice(index, 1);
    }

    // 添加到开头
    recentGames.value.unshift(gameId);

    // 只保留最近5个
    recentGames.value = recentGames.value.slice(0, 5);

    // 保存到 localStorage
    localStorage.setItem('recentGames', JSON.stringify(recentGames.value));
  }

  /**
   * 从 localStorage 恢复最近游戏
   */
  function restoreRecentGames(): void {
    const data = localStorage.getItem('recentGames');
    if (data) {
      try {
        recentGames.value = JSON.parse(data);
      } catch (err) {
        console.error('恢复最近游戏失败:', err);
      }
    }
  }

  /**
   * 加载游戏记录
   */
  async function loadGameRecords(limit: number = 20, kidId?: number): Promise<void> {
    // 从参数或 localStorage 获取 kidId
    let resolvedKidId = kidId;
    if (!resolvedKidId) {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        try {
          const parsed = JSON.parse(userInfo);
          resolvedKidId = parsed.id;
        } catch (err) {
          console.error('[GameStore] 解析用户信息失败:', err);
        }
      }
    }

    if (!resolvedKidId) return;

    isLoading.value = true;
    error.value = null;

    try {
      gameRecords.value = await kidApi.getGameRecords(resolvedKidId, limit);
    } catch (err: any) {
      error.value = err.message || '加载游戏记录失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 获取最近游戏信息
   */
  function getRecentGames(): Game[] {
    return recentGames.value
      .map(gameId => gameList.value.find(g => g.gameId === gameId))
      .filter(Boolean) as Game[];
  }

  /**
   * 获取游戏详情
   */
  function getGameById(gameId: number): Game | undefined {
    return gameList.value.find(g => g.gameId === gameId);
  }

  /**
   * 根据游戏代码获取游戏
   */
  function getGameByCode(gameCode: string): Game | undefined {
    return gameList.value.find(g => g.gameCode === gameCode);
  }

  /**
   * 搜索游戏
   */
  function searchGames(keyword: string): Game[] {
    if (!keyword.trim()) {
      return [];
    }

    const lowerKeyword = keyword.toLowerCase();
    return gameList.value.filter(game => {
      const nameMatch = game.gameName?.toLowerCase().includes(lowerKeyword);
      const descMatch = game.description?.toLowerCase().includes(lowerKeyword);
      const categoryMatch = game.category?.toLowerCase().includes(lowerKeyword);
      return nameMatch || descMatch || categoryMatch;
    });
  }

  return {
    // 状态
    currentSession,
    gameList,
    gameRecords,
    recentGames,
    isLoading,
    error,

    // 计算属性
    isPlaying,
    isPaused,
    currentScore,
    currentDuration,

    // 方法
    loadGameList,
    startGame,
    endGame,
    gameHeartbeat,
    pauseGame,
    resumeGame,
    addToRecentGames,
    restoreRecentGames,
    loadGameRecords,
    getRecentGames,
    getGameById,
    getGameByCode,
    searchGames,
  };
});
