/**
 * 儿童状态管理
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { kidApi } from '@/services/kid-api.service';
import type { Kid } from '@/services/api.types';

export const useKidStore = defineStore('kid', () => {
  // 状态
  const profile = ref<Kid | null>(null);
  const stats = ref<any | null>(null);
  const isOnline = ref(false);
  const currentGame = ref<string | null>(null);

  // 计算属性
  const fatigueLevel = computed(() => profile.value?.fatiguePoints ?? 0);
  const points = computed(() => profile.value?.dailyAnswerPoints ?? 0);
  const schoolAge = computed(() => profile.value?.grade ?? '');

  /**
   * 获取儿童信息
   */
  async function fetchProfile(kidId?: number) {
    try {
      const data = await kidApi.getInfo(kidId);
      profile.value = data;
    } catch (error) {
      console.error('[KidStore] fetchProfile error:', error);
      throw error;
    }
  }

  /**
   * 获取统计数据（简化版本，具体实现需要根据后端 API 调整）
   */
  async function fetchStats() {
    try {
      // 暂时使用 profile 作为 stats，后续需要根据实际 API 调整
      stats.value = profile.value;
    } catch (error) {
      console.error('[KidStore] fetchStats error:', error);
      throw error;
    }
  }

  /**
   * 更新疲劳度（简化版本，具体实现需要根据后端 API 调整）
   */
  async function updateFatigue(level: number) {
    try {
      // 注意：新的 API 可能没有这个方法，需要根据实际情况调整
      if (profile.value) {
        profile.value.fatiguePoints = level;
      }
    } catch (error) {
      console.error('[KidStore] updateFatigue error:', error);
      throw error;
    }
  }

  /**
   * 增加积分
   */
  function addPoints(amount: number) {
    if (profile.value) {
      profile.value.points += amount;
    }
  }

  /**
   * 设置在线状态
   */
  function setOnline(status: boolean) {
    isOnline.value = status;
  }

  /**
   * 设置当前游戏
   */
  function setCurrentGame(gameId: string | null) {
    currentGame.value = gameId;
  }

  return {
    profile,
    stats,
    isOnline,
    currentGame,
    fatigueLevel,
    points,
    schoolAge,
    fetchProfile,
    fetchStats,
    updateFatigue,
    addPoints,
    setOnline,
    setCurrentGame,
  };
});
