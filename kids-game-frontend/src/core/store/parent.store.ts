/**
 * 家长管控状态管理
 * 管家长管控规则、记录等
 * 使用 Pinia 实现
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { parentApi } from '@/services/parent-api.service';
import { kidApi } from '@/services/kid-api.service';
import type { ParentLimit, AnswerRecord } from '@/services/api.types';

export const useParentStore = defineStore('parent', () => {
  // ===== 状态 =====

  const parentLimit = ref<ParentLimit | null>(null);
  const answerRecords = ref<AnswerRecord[]>([]);
  const gameRecords = ref<any[]>([]);
  const stats = ref<any>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // ===== 计算属性 =====

  const dailyDurationLimit = computed(() => parentLimit.value?.dailyDuration || 60);
  const singleDurationLimit = computed(() => parentLimit.value?.singleDuration || 30);
  const allowedTimeRange = computed(() => {
    if (!parentLimit.value) return { start: '08:00', end: '20:00' };
    return {
      start: parentLimit.value.allowedTimeStart || '08:00',
      end: parentLimit.value.allowedTimeEnd || '20:00',
    };
  });
  const answerPointsPerQuestion = computed(() => parentLimit.value?.answerGetPoints || 1);
  const dailyAnswerLimit = computed(() => parentLimit.value?.dailyAnswerLimit || 10);

  // ===== 方法 =====

  /**
   * 加载管控规则
   */
  async function loadParentLimit(kidId: number): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      parentLimit.value = await parentApi.getParentLimit(kidId);
    } catch (err: any) {
      error.value = err.message || '加载管控规则失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 更新管控规则
   */
  async function updateParentLimit(limit: ParentLimit): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      await parentApi.updateParentLimit(limit);
      parentLimit.value = limit;
    } catch (err: any) {
      error.value = err.message || '更新管控规则失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 远程暂停游戏
   */
  async function remotePauseGame(kidId: number): Promise<void> {
    try {
      await parentApi.remotePauseGame(kidId);
    } catch (err: any) {
      error.value = err.message || '远程暂停失败';
      throw err;
    }
  }

  /**
   * 远程解锁游戏
   */
  async function remoteUnlockGame(kidId: number): Promise<void> {
    try {
      await parentApi.remoteUnlockGame(kidId);
    } catch (err: any) {
      error.value = err.message || '远程解锁失败';
      throw err;
    }
  }

  /**
   * 加载答题记录
   */
  async function loadAnswerRecords(kidId: number, limit: number = 20): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      answerRecords.value = await kidApi.getAnswerRecords(kidId, limit);
    } catch (err: any) {
      error.value = err.message || '加载答题记录失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 加载游戏记录
   */
  async function loadGameRecords(kidId: number, limit: number = 20): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      gameRecords.value = await kidApi.getGameRecords(kidId, limit);
    } catch (err: any) {
      error.value = err.message || '加载游戏记录失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 加载统计数据
   */
  async function loadStats(kidId: number): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const [gameStats, answerStats] = await Promise.all([
        kidApi.getGameStats(kidId),
        kidApi.getAnswerStats(kidId),
      ]);

      stats.value = {
        game: gameStats,
        answer: answerStats,
      };
    } catch (err: any) {
      error.value = err.message || '加载统计数据失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 检查是否在允许的游戏时间内
   */
  function isInAllowedTimeRange(): boolean {
    const { start, end } = allowedTimeRange.value;
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * 格式化时长
   */
  function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}小时${mins}分钟`;
    }
    return `${mins}分钟`;
  }

  /**
   * 屏蔽游戏
   */
  async function blockGame(kidId: number, gameId: number): Promise<void> {
    try {
      isLoading.value = true;
      await parentApi.blockGame(kidId, gameId);
    } catch (err: any) {
      error.value = err.message || '屏蔽游戏失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 取消屏蔽游戏
   */
  async function unblockGame(kidId: number, gameId: number): Promise<void> {
    try {
      isLoading.value = true;
      await parentApi.unblockGame(kidId, gameId);
    } catch (err: any) {
      error.value = err.message || '取消屏蔽失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 批量屏蔽游戏
   */
  async function batchBlockGames(kidId: number, gameIds: number[]): Promise<void> {
    try {
      isLoading.value = true;
      await parentApi.batchBlockGames(kidId, gameIds);
    } catch (err: any) {
      error.value = err.message || '批量屏蔽失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 批量取消屏蔽游戏
   */
  async function batchUnblockGames(kidId: number, gameIds: number[]): Promise<void> {
    try {
      isLoading.value = true;
      await parentApi.batchUnblockGames(kidId, gameIds);
    } catch (err: any) {
      error.value = err.message || '批量取消屏蔽失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    // 状态
    parentLimit,
    answerRecords,
    gameRecords,
    stats,
    isLoading,
    error,

    // 计算属性
    dailyDurationLimit,
    singleDurationLimit,
    allowedTimeRange,
    answerPointsPerQuestion,
    dailyAnswerLimit,

    // 方法
    loadParentLimit,
    updateParentLimit,
    remotePauseGame,
    remoteUnlockGame,
    loadAnswerRecords,
    loadGameRecords,
    loadStats,
    isInAllowedTimeRange,
    formatDuration,
    blockGame,
    unblockGame,
    batchBlockGames,
    batchUnblockGames,
  };
});
