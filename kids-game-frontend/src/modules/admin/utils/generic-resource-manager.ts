/**
 * 通用游戏资源管理器核心类
 * 
 * 基于配置驱动的资源管理器，支持不同游戏的资源管理需求
 */

import type {
  ResourceManagerConfig,
  GameResourceConfig,
  ResourceConfig,
  ResourceGroupConfig
} from '../types/resource-manager-config';

import {
  ResourceType,
  ResourceCategory,
  loadGameResourceConfig
} from '../types/resource-manager-config';

/**
 * 资源状态
 */
export enum ResourceStatus {
  UNCHANGED = 'unchanged',
  NEW = 'new',
  MODIFIED = 'modified',
  ERROR = 'error'
}

/**
 * 资源项（带状态）
 */
export interface ResourceItem extends ResourceConfig {
  /** 预览URL */
  previewUrl?: string;
  
  /** 原始URL（用于对比） */
  originalUrl?: string;
  
  /** 资源状态 */
  status: ResourceStatus;
  
  /** 生成时间 */
  generatedAt?: string;
  
  /** 加载状态 */
  loaded?: boolean;
  
  /** 加载错误 */
  loadError?: string;
}

/**
 * 资源管理器事件
 */
export interface ResourceManagerEvents {
  /** 资源配置加载完成 */
  onConfigLoaded?: (config: GameResourceConfig) => void;
  
  /** 资源列表更新 */
  onResourcesUpdated?: (resources: ResourceItem[]) => void;
  
  /** 资源生成进度 */
  onGenerationProgress?: (current: number, total: number, resource: ResourceConfig) => void;
  
  /** 资源生成完成 */
  onGenerationComplete?: (success: boolean, resources: ResourceItem[]) => void;
  
  /** 错误发生 */
  onError?: (error: Error) => void;
}

/**
 * 通用游戏资源管理器
 */
export class GenericResourceManager {
  private config: ResourceManagerConfig;
  private gameConfig: GameResourceConfig | null = null;
  private resources: Map<string, ResourceItem> = new Map();
  private groups: ResourceGroupConfig[] = [];
  private events: ResourceManagerEvents = {};
  
  // 生成状态
  private isGenerating = false;
  private generationProgress = { current: 0, total: 0 };
  
  constructor(config: ResourceManagerConfig) {
    this.config = config;
  }
  
  /**
   * 设置事件监听器
   */
  setEvents(events: ResourceManagerEvents) {
    this.events = { ...this.events, ...events };
  }
  
  /**
   * 初始化资源管理器
   */
  async initialize(): Promise<void> {
    try {
      await this.loadConfig();
      await this.loadResources();
      
      if (this.events.onConfigLoaded) {
        this.events.onConfigLoaded(this.gameConfig!);
      }
      
      console.log('[GenericResourceManager] 初始化成功');
    } catch (error) {
      console.error('[GenericResourceManager] 初始化失败:', error);
      if (this.events.onError) {
        this.events.onError(error as Error);
      }
      throw error;
    }
  }
  
  /**
   * 加载游戏配置
   */
  async loadConfig(): Promise<void> {
    const { gameId, themeId, themeBasePath } = this.config.gameConfig;
    
    this.gameConfig = await loadGameResourceConfig(gameId, themeId, themeBasePath);
    this.groups = this.gameConfig.groups;
    
    console.log('[GenericResourceManager] 配置加载成功:', {
      gameId: this.gameConfig.gameId,
      themeId: this.gameConfig.themeId,
      groups: this.groups.length,
      totalResources: this.getTotalResourceCount()
    });
  }
  
  /**
   * 加载所有资源
   */
  async loadResources(): Promise<void> {
    this.resources.clear();
    
    // 遍历所有分组，加载资源
    for (const group of this.groups) {
      for (const resourceConfig of group.resources) {
        const resourceItem: ResourceItem = {
          ...resourceConfig,
          previewUrl: this.buildPreviewUrl(resourceConfig),
          status: ResourceStatus.UNCHANGED,
          loaded: false
        };
        
        this.resources.set(resourceConfig.key, resourceItem);
      }
    }
    
    // 更新flatResources
    if (this.gameConfig) {
      this.gameConfig.flatResources = this.resources;
    }
    
    if (this.events.onResourcesUpdated) {
      this.events.onResourcesUpdated(this.getAllResources());
    }
  }
  
  /**
   * 获取所有资源
   */
  getAllResources(): ResourceItem[] {
    return Array.from(this.resources.values());
  }
  
  /**
   * 根据类型获取资源
   */
  getResourcesByType(type: ResourceType): ResourceItem[] {
    return this.getAllResources().filter(r => r.type === type);
  }
  
  /**
   * 根据分类获取资源
   */
  getResourcesByCategory(category: ResourceCategory): ResourceItem[] {
    return this.getAllResources().filter(r => r.category === category);
  }
  
  /**
   * 根据分组获取资源
   */
  getResourcesByGroup(groupName: string): ResourceItem[] {
    const group = this.groups.find(g => g.name === groupName);
    if (!group) return [];
    
    return group.resources.map(config => {
      return this.resources.get(config.key) || {
        ...config,
        previewUrl: this.buildPreviewUrl(config),
        status: ResourceStatus.UNCHANGED,
        loaded: false
      };
    });
  }
  
  /**
   * 获取单个资源
   */
  getResource(key: string): ResourceItem | undefined {
    return this.resources.get(key);
  }
  
  /**
   * 获取所有分组
   */
  getGroups(): ResourceGroupConfig[] {
    return this.groups;
  }
  
  /**
   * 获取资源配置
   */
  getConfig(): GameResourceConfig | null {
    return this.gameConfig;
  }
  
  /**
   * 获取资源总数
   */
  getTotalResourceCount(): number {
    return this.resources.size;
  }
  
  /**
   * 重新生成单个资源
   */
  async regenerateResource(key: string): Promise<boolean> {
    const resource = this.resources.get(key);
    if (!resource) {
      console.error(`[GenericResourceManager] 资源不存在: ${key}`);
      return false;
    }
    
    try {
      // 更新状态为生成中
      resource.status = ResourceStatus.NEW;
      
      // TODO: 调用AI生成API
      // 这里需要根据resource.prompt和resource.sizeSpecs生成新资源
      
      // 模拟生成过程
      await this.simulateGeneration(resource);
      
      // 更新预览URL（添加时间戳避免缓存）
      resource.previewUrl = `${this.buildPreviewUrl(resource)}?t=${Date.now()}`;
      resource.generatedAt = new Date().toISOString();
      resource.loaded = true;
      
      // 触发更新事件
      if (this.events.onResourcesUpdated) {
        this.events.onResourcesUpdated(this.getAllResources());
      }
      
      console.log(`[GenericResourceManager] 资源生成成功: ${key}`);
      return true;
    } catch (error) {
      console.error(`[GenericResourceManager] 资源生成失败: ${key}`, error);
      resource.status = ResourceStatus.ERROR;
      resource.loadError = (error as Error).message;
      
      if (this.events.onError) {
        this.events.onError(error as Error);
      }
      
      return false;
    }
  }
  
  /**
   * 重新生成所有资源
   */
  async regenerateAllResources(): Promise<boolean> {
    if (this.isGenerating) {
      console.warn('[GenericResourceManager] 正在生成中，请稍后');
      return false;
    }
    
    this.isGenerating = true;
    this.generationProgress = { current: 0, total: this.resources.size };
    
    const resources = this.getAllResources();
    let successCount = 0;
    let failCount = 0;
    
    try {
      for (let i = 0; i < resources.length; i++) {
        const resource = resources[i];
        
        // 更新进度
        this.generationProgress.current = i + 1;
        
        if (this.events.onGenerationProgress) {
          this.events.onGenerationProgress(
            i + 1,
            resources.length,
            resource
          );
        }
        
        // 生成资源
        const success = await this.regenerateResource(resource.key);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }
      
      const allSuccess = failCount === 0;
      
      if (this.events.onGenerationComplete) {
        this.events.onGenerationComplete(allSuccess, this.getAllResources());
      }
      
      console.log(`[GenericResourceManager] 批量生成完成: 成功${successCount}, 失败${failCount}`);
      return allSuccess;
    } finally {
      this.isGenerating = false;
    }
  }
  
  /**
   * 应用资源（替换原游戏素材）
   */
  async applyResources(): Promise<boolean> {
    try {
      // TODO: 调用后端API应用资源
      // 将生成的资源复制到游戏目录
      
      // 标记所有资源为已应用
      this.resources.forEach(resource => {
        if (resource.status === ResourceStatus.NEW) {
          resource.status = ResourceStatus.UNCHANGED;
        }
      });
      
      if (this.events.onResourcesUpdated) {
        this.events.onResourcesUpdated(this.getAllResources());
      }
      
      console.log('[GenericResourceManager] 资源应用成功');
      return true;
    } catch (error) {
      console.error('[GenericResourceManager] 资源应用失败:', error);
      if (this.events.onError) {
        this.events.onError(error as Error);
      }
      return false;
    }
  }
  
  /**
   * 刷新资源预览
   */
  refreshPreviews(): void {
    this.resources.forEach(resource => {
      resource.previewUrl = `${this.buildPreviewUrl(resource)}?t=${Date.now()}`;
    });
    
    if (this.events.onResourcesUpdated) {
      this.events.onResourcesUpdated(this.getAllResources());
    }
  }
  
  /**
   * 构建预览URL
   */
  private buildPreviewUrl(resource: ResourceConfig): string {
    const { themeBasePath } = this.config.gameConfig;
    
    // 如果path已经是完整路径，直接返回
    if (resource.path.startsWith('http://') || resource.path.startsWith('https://')) {
      return resource.path;
    }
    
    // 否则拼接主题基础路径
    return `${themeBasePath}${resource.path.startsWith('/') ? '' : '/'}${resource.path}`;
  }
  
  /**
   * 模拟生成过程（用于测试）
   */
  private async simulateGeneration(resource: ResourceItem): Promise<void> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  }
  
  /**
   * 销毁资源管理器
   */
  destroy(): void {
    this.resources.clear();
    this.groups = [];
    this.gameConfig = null;
    this.events = {};
  }
}

/**
 * 创建资源管理器实例的工厂函数
 */
export function createResourceManager(config: ResourceManagerConfig): GenericResourceManager {
  return new GenericResourceManager(config);
}
