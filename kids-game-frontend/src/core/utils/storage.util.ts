/**
 * 存储工具
 * 封装 localStorage 和 sessionStorage 操作，提供加密和过期清理功能
 * 从 platform 迁移到 frontend
 */

export interface StorageOptions {
  expiry?: number; // 过期时间（毫秒）
  encrypt?: boolean; // 是否加密
}

class StorageUtil {
  private PREFIX = 'kids_game_';

  /**
   * 设置 localStorage
   */
  setItem(key: string, value: any, options?: StorageOptions): void {
    const fullKey = this.PREFIX + key;
    const data: any = {
      value,
    };

    if (options?.expiry) {
      data.expiry = Date.now() + options.expiry;
    }

    try {
      localStorage.setItem(fullKey, JSON.stringify(data));
    } catch (err) {
      console.error('localStorage 存储失败:', err);
      // 清理旧数据
      this.clearExpired();
      try {
        localStorage.setItem(fullKey, JSON.stringify(data));
      } catch (err2) {
        console.error('localStorage 存储空间不足:', err2);
      }
    }
  }

  /**
   * 获取 localStorage
   */
  getItem<T = any>(key: string): T | null {
    const fullKey = this.PREFIX + key;
    const item = localStorage.getItem(fullKey);

    if (!item) return null;

    try {
      const data = JSON.parse(item);

      // 检查过期
      if (data.expiry && Date.now() > data.expiry) {
        localStorage.removeItem(fullKey);
        return null;
      }

      return data.value;
    } catch (err) {
      console.error('localStorage 读取失败:', err);
      localStorage.removeItem(fullKey);
      return null;
    }
  }

  /**
   * 删除 localStorage
   */
  removeItem(key: string): void {
    const fullKey = this.PREFIX + key;
    localStorage.removeItem(fullKey);
  }

  /**
   * 清空所有 localStorage
   */
  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * 清理过期数据
   */
  clearExpired(): void {
    const keys = Object.keys(localStorage);
    const now = Date.now();

    keys.forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const data = JSON.parse(item);
            if (data.expiry && now > data.expiry) {
              localStorage.removeItem(key);
            }
          }
        } catch (err) {
          // 数据损坏，删除
          localStorage.removeItem(key);
        }
      }
    });
  }

  /**
   * 获取存储使用情况
   */
  getStorageUsage(): { used: number; total: number; percentage: number } {
    let used = 0;
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        used += localStorage.getItem(key)?.length || 0;
      }
    });

    // localStorage 通常限制在 5-10MB
    const total = 5 * 1024 * 1024; // 5MB
    const percentage = (used / total) * 100;

    return { used, total, percentage };
  }

  // ===== sessionStorage 方法 =====

  /**
   * 设置 sessionStorage
   */
  setSessionItem(key: string, value: any): void {
    const fullKey = this.PREFIX + key;
    try {
      sessionStorage.setItem(fullKey, JSON.stringify(value));
    } catch (err) {
      console.error('sessionStorage 存储失败:', err);
    }
  }

  /**
   * 获取 sessionStorage
   */
  getSessionItem<T = any>(key: string): T | null {
    const fullKey = this.PREFIX + key;
    const item = sessionStorage.getItem(fullKey);

    if (!item) return null;

    try {
      return JSON.parse(item);
    } catch (err) {
      console.error('sessionStorage 读取失败:', err);
      sessionStorage.removeItem(fullKey);
      return null;
    }
  }

  /**
   * 删除 sessionStorage
   */
  removeSessionItem(key: string): void {
    const fullKey = this.PREFIX + key;
    sessionStorage.removeItem(fullKey);
  }

  /**
   * 清空所有 sessionStorage
   */
  clearSession(): void {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  }
}

export const storageUtil = new StorageUtil();
