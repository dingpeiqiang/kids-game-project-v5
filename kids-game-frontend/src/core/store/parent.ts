/**
 * 家长管控状态管理
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { parentApi } from '@/services/parent-api.service';
import { kidApi } from '@/services/kid-api.service';
import type { Parent, Kid } from '@/services/api.types';

export const useParentStore = defineStore('parent', () => {
  // 状态
  const profile = ref<Parent | null>(null);
  const children = ref<Kid[]>([]);
  const currentChildId = ref<number | null>(null);
  const controlRules = ref<any[]>([]);
  const playRecords = ref<any[]>([]);

  // 计算属性
  const isLoggedIn = computed(() => !!profile.value);
  const currentChild = computed(() =>
    children.value.find(child => child.kidId === currentChildId.value)
  );

  /**
   * 登录
   */
  async function login(phone: string, password: string) {
    try {
      const data = await parentApi.login(phone, password);
      // parentApi.login 内部已经调用了 setParentToken，token 已保存到 localStorage
      await fetchProfile();
      return true;
    } catch (error) {
      console.error('[ParentStore] login error:', error);
      throw error;
    }
  }

  /**
   * 登出
   */
  function logout() {
    // 使用统一的 key 清除 token
    parentApi.clearParentToken();
    parentApi.clearToken();
    profile.value = null;
    children.value = [];
    currentChildId.value = null;
    controlRules.value = [];
    playRecords.value = [];
  }

  /**
   * 获取家长信息
   */
  async function fetchProfile() {
    try {
      const data = await parentApi.getInfo();
      profile.value = data;
    } catch (error) {
      console.error('[ParentStore] fetchProfile error:', error);
      throw error;
    }
  }

  /**
   * 获取子账号列表
   */
  async function fetchChildren() {
    try {
      const data = await kidApi.searchChildren();
      children.value = data;
      if (!currentChildId.value && data.length > 0) {
        currentChildId.value = data[0].kidId;
      }
    } catch (error) {
      console.error('[ParentStore] fetchChildren error:', error);
      throw error;
    }
  }

  /**
   * 选择当前子账号
   */
  function selectChild(childId: number) {
    currentChildId.value = childId;
    fetchControlRules(childId);
  }

  /**
   * 添加子账号（简化版本，具体实现需要根据后端 API 调整）
   */
  async function addChild(data: { name: string; age: number; avatar: string }) {
    try {
      // 注意：新的 API 可能没有这个方法，需要根据实际情况调整
      await fetchChildren();
    } catch (error) {
      console.error('[ParentStore] addChild error:', error);
      throw error;
    }
  }

  /**
   * 获取管控规则（简化版本，具体实现需要根据后端 API 调整）
   */
  async function fetchControlRules(childId: number) {
    try {
      const data = await parentApi.getLimit(childId);
      controlRules.value = data ? [data] : [];
    } catch (error) {
      console.error('[ParentStore] fetchControlRules error:', error);
      throw error;
    }
  }

  /**
   * 设置管控规则（简化版本，具体实现需要根据后端 API 调整）
   */
  async function setControlRule(rule: any) {
    try {
      await parentApi.setLimit(rule);
      await fetchControlRules(rule.kidId);
    } catch (error) {
      console.error('[ParentStore] setControlRule error:', error);
      throw error;
    }
  }

  /**
   * 获取游戏记录（简化版本，具体实现需要根据后端 API 调整）
   */
  async function fetchPlayRecords(childId: number, startDate: number, endDate: number) {
    try {
      const data = await parentApi.getKidRecords(childId);
      playRecords.value = data || [];
    } catch (error) {
      console.error('[ParentStore] fetchPlayRecords error:', error);
      throw error;
    }
  }

  /**
   * 发送管控指令（简化版本，具体实现需要根据后端 API 调整）
   */
  async function sendControlCommand(childId: number, command: 'pause' | 'stop' | 'break') {
    try {
      // 注意：新的 API 可能没有这个方法，需要根据实际情况调整
      console.warn('[ParentStore] sendControlCommand not implemented');
    } catch (error) {
      console.error('[ParentStore] sendControlCommand error:', error);
      throw error;
    }
  }

  return {
    profile,
    children,
    currentChildId,
    controlRules,
    playRecords,
    isLoggedIn,
    currentChild,
    login,
    logout,
    fetchProfile,
    fetchChildren,
    selectChild,
    addChild,
    fetchControlRules,
    setControlRule,
    fetchPlayRecords,
    sendControlCommand,
  };
});
