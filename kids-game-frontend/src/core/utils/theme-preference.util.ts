/**
 * 主题偏好本地缓存工具类
 * 
 * 用于在 localStorage 中缓存用户的主题偏好
 * 作为后端数据库的补充，提供快速加载和降级容错能力
 */

import { storageUtil } from './storage.util';

const STORAGE_PREFIX = 'theme_preference_';

export interface ThemePreferenceData {
  themeId: number;
  ownerType: string;
  ownerId: number;
  updatedAt: number;
}

/**
 * 主题偏好本地缓存工具
 */
export class ThemePreferenceUtil {
  
  /**
   * 生成本地存储 key
   * @param ownerType 所有者类型（GAME/APPLICATION）
   * @param ownerId 所有者 ID
   */
  private static getStorageKey(ownerType: string, ownerId: number): string {
    return `${STORAGE_PREFIX}${ownerType}_${ownerId}`;
  }
  
  /**
   * 保存用户主题偏好到本地
   * @param ownerType 所有者类型
   * @param ownerId 所有者 ID
   * @param themeId 主题 ID
   */
  static saveLocal(ownerType: string, ownerId: number, themeId: number): void {
    const key = this.getStorageKey(ownerType, ownerId);
    const data: ThemePreferenceData = {
      themeId,
      ownerType,
      ownerId,
      updatedAt: Date.now()
    };
    storageUtil.setItem(key, data);
    console.log('[ThemePreferenceUtil] 保存本地主题偏好:', data);
  }
  
  /**
   * 从本地获取用户主题偏好
   * @param ownerType 所有者类型
   * @param ownerId 所有者 ID
   * @returns 主题 ID，如果没有返回 null
   */
  static getLocal(ownerType: string, ownerId: number): number | null {
    const key = this.getStorageKey(ownerType, ownerId);
    const data = storageUtil.getItem<ThemePreferenceData>(key);
    
    if (data && data.themeId) {
      console.log('[ThemePreferenceUtil] 读取本地主题偏好:', data);
      return data.themeId;
    }
    
    console.log('[ThemePreferenceUtil] 未找到本地主题偏好');
    return null;
  }
  
  /**
   * 清除本地偏好
   * @param ownerType 所有者类型
   * @param ownerId 所有者 ID
   */
  static removeLocal(ownerType: string, ownerId: number): void {
    const key = this.getStorageKey(ownerType, ownerId);
    storageUtil.removeItem(key);
    console.log('[ThemePreferenceUtil] 清除本地主题偏好:', key);
  }
  
  /**
   * 检查本地偏好是否过期（可选功能）
   * @param ownerType 所有者类型
   * @param ownerId 所有者 ID
   * @param maxAge 最大年龄（毫秒），默认 7 天
   * @returns 是否过期
   */
  static isExpired(ownerType: string, ownerId: number, maxAge: number = 7 * 24 * 60 * 60 * 1000): boolean {
    const key = this.getStorageKey(ownerType, ownerId);
    const data = storageUtil.getItem<ThemePreferenceData>(key);
    
    if (!data || !data.updatedAt) {
      return true;
    }
    
    const now = Date.now();
    const age = now - data.updatedAt;
    
    return age > maxAge;
  }
}
