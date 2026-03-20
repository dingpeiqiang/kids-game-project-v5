import {
  IStorageService,
  StorageConfig,
  StorageItem,
} from '../interfaces/ServiceInterface';

/**
 * 存储服务实现
 * 提供统一的存储接口，支持多种存储后端
 */
export class StorageService implements IStorageService {
  private config: StorageConfig;
  private items: Map<string, StorageItem> = new Map();
  private autoSaveTimer: number | null = null;
  private isInitialized: boolean = false;
  private storage: Storage | null = null;

  constructor(config?: Partial<StorageConfig>) {
    this.config = {
      storageType: 'local',
      keyPrefix: 'game_',
      autoSave: false,
      autoSaveInterval: 30000, // 30秒
      ...config,
    };
  }

  /**
   * 初始化存储服务
   */
  initialize(config: StorageConfig): void {
    this.config = { ...this.config, ...config };
    this.isInitialized = true;

    // 根据存储类型选择后端
    if (typeof window !== 'undefined') {
      switch (this.config.storageType) {
        case 'local':
          this.storage = window.localStorage;
          break;
        case 'session':
          this.storage = window.sessionStorage;
          break;
        case 'custom':
        default:
          this.storage = null;
          break;
      }
    }

    // 启动自动保存
    if (this.config.autoSave) {
      this.startAutoSave();
    }

    this.log('StorageService initialized', config);
  }

  /**
   * 保存数据
   */
  save(key: string, value: any, ttl?: number): void {
    const fullKey = this.getFullKey(key);
    const now = Date.now();
    const expireTime = ttl ? now + ttl * 1000 : 0;

    const item: StorageItem = {
      key: fullKey,
      value,
      expireTime,
      createTime: now,
      updateTime: now,
    };

    this.items.set(fullKey, item);

    // 如果有存储后端，同步保存
    if (this.storage) {
      try {
        this.storage.setItem(fullKey, JSON.stringify(item));
      } catch (error) {
        console.error('[StorageService] Failed to save to storage:', error);
      }
    }

    this.log(`Saved key: ${key}`, { ttl });
  }

  /**
   * 加载数据
   */
  load<T = any>(key: string): T | null {
    const fullKey = this.getFullKey(key);

    // 先从内存中查找
    let item = this.items.get(fullKey);

    // 如果内存中没有，尝试从存储后端加载
    if (!item && this.storage) {
      try {
        const stored = this.storage.getItem(fullKey);
        if (stored) {
          item = JSON.parse(stored) as StorageItem;
          this.items.set(fullKey, item);
        }
      } catch (error) {
        console.error('[StorageService] Failed to load from storage:', error);
      }
    }

    if (!item) {
      return null;
    }

    // 检查是否过期
    if (item.expireTime > 0 && item.expireTime < Date.now()) {
      this.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * 删除数据
   */
  delete(key: string): boolean {
    const fullKey = this.getFullKey(key);
    const existed = this.items.delete(fullKey);

    if (this.storage) {
      try {
        this.storage.removeItem(fullKey);
      } catch (error) {
        console.error('[StorageService] Failed to delete from storage:', error);
      }
    }

    this.log(`Deleted key: ${key}`, { existed });
    return existed;
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    const count = this.items.size;
    this.items.clear();

    if (this.storage) {
      try {
        // 只删除带有前缀的键
        const keys = Object.keys(this.storage);
        keys.forEach(key => {
          if (key.startsWith(this.config.keyPrefix)) {
            this.storage!.removeItem(key);
          }
        });
      } catch (error) {
        console.error('[StorageService] Failed to clear storage:', error);
      }
    }

    this.log('Cleared all data', { count });
  }

  /**
   * 检查数据是否存在
   */
  exists(key: string): boolean {
    const fullKey = this.getFullKey(key);
    return this.items.has(fullKey);
  }

  /**
   * 获取所有键
   */
  keys(): string[] {
    return Array.from(this.items.keys())
      .filter(key => key.startsWith(this.config.keyPrefix))
      .map(key => key.slice(this.config.keyPrefix.length));
  }

  /**
   * 批量保存
   */
  saveBatch(items: Array<{ key: string; value: any; ttl?: number }>): void {
    items.forEach(({ key, value, ttl }) => this.save(key, value, ttl));
    this.log(`Batch saved ${items.length} items`);
  }

  /**
   * 批量加载
   */
  loadBatch<T = any>(keys: string[]): Map<string, T> {
    const result = new Map<string, T>();

    keys.forEach(key => {
      const value = this.load<T>(key);
      if (value !== null) {
        result.set(key, value);
      }
    });

    this.log(`Batch loaded ${result.size} items`, { requested: keys.length });
    return result;
  }

  /**
   * 清理过期数据
   */
  cleanExpired(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, item] of this.items.entries()) {
      if (item.expireTime > 0 && item.expireTime < now) {
        this.items.delete(key);
        cleanedCount++;

        if (this.storage) {
          try {
            this.storage.removeItem(key);
          } catch (error) {
            console.error('[StorageService] Failed to delete expired item:', error);
          }
        }
      }
    }

    this.log('Cleaned expired items', { count: cleanedCount });
  }

  /**
   * 启动自动保存
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = window.setInterval(() => {
      this.flushToStorage();
    }, this.config.autoSaveInterval);

    this.log('Started auto save', { interval: this.config.autoSaveInterval });
  }

  /**
   * 停止自动保存
   */
  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    this.log('Stopped auto save');
  }

  /**
   * 将内存数据刷新到存储后端
   */
  private flushToStorage(): void {
    if (!this.storage) return;

    try {
      for (const [key, item] of this.items.entries()) {
        this.storage.setItem(key, JSON.stringify(item));
      }
      this.log('Flushed data to storage', { count: this.items.size });
    } catch (error) {
      console.error('[StorageService] Failed to flush to storage:', error);
    }
  }

  /**
   * 获取完整键名
   */
  private getFullKey(key: string): string {
    return this.config.keyPrefix + key;
  }

  /**
   * 记录日志
   */
  private log(message: string, data?: any): void {
    console.log(`[StorageService] ${message}`, data ? data : '');
  }

  /**
   * 获取统计信息
   */
  getStatistics(): Record<string, any> {
    return {
      totalItems: this.items.size,
      keys: this.keys(),
      autoSaveEnabled: this.config.autoSave,
      autoSaveInterval: this.config.autoSaveInterval,
      storageType: this.config.storageType,
      isInitialized: this.isInitialized,
    };
  }

  /**
   * 销毁存储服务
   */
  destroy(): void {
    this.stopAutoSave();
    this.clear();
  }
}
