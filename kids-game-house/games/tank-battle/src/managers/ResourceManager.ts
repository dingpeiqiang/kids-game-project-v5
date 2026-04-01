// ============================================================================
// 📦 坦克大战 - 资源管理器
// ============================================================================
// 
// 📌 说明:
//   统一管理所有游戏资源的加载、验证、缓存和容错
//   解决资源加载不稳定的核心问题
// ============================================================================

import { Logger } from '../utils/Logger'

/**
 * ⭐ 资源类型枚举
 */
export enum ResourceType {
  IMAGE = 'image',
  AUDIO = 'audio',
  SPRITE_SHEET = 'sprite_sheet',
  TILEMAP = 'tilemap',
  JSON = 'json',
  TEXT = 'text'
}

/**
 * ⭐ 资源状态枚举
 */
export enum ResourceStatus {
  PENDING = 'pending',      // 待加载
  LOADING = 'loading',      // 加载中
  LOADED = 'loaded',        // 已加载
  FAILED = 'failed',        // 加载失败
  CACHED = 'cached'         // 已缓存
}

/**
 * ⭐ 资源配置接口
 */
export interface IResourceConfig {
  key: string
  type: ResourceType
  url: string
  priority?: number         // 优先级（1-10，10 最高）
  required?: boolean        // 是否必需资源
  retryCount?: number       // 重试次数
}

/**
 * ⭐ 资源加载结果
 */
export interface IResourceLoadResult {
  key: string
  status: ResourceStatus
  error?: string
  duration?: number         // 加载耗时（ms）
  required?: boolean        // 是否必需资源（从配置继承）
}

/**
 * ⭐ 资源统计信息
 */
export interface IResourceStats {
  total: number
  loaded: number
  failed: number
  pending: number
  progress: number          // 进度百分比（0-100）
}

/**
 * ⭐ 资源管理器（单例模式）
 */
class ResourceManagerClass {
  private static instance: ResourceManagerClass
  
  // 资源配置映射
  private resourceConfigs: Map<string, IResourceConfig> = new Map()
  
  // 资源状态映射
  private resourceStatus: Map<string, ResourceStatus> = new Map()
  
  // 加载结果记录
  private loadResults: Map<string, IResourceLoadResult> = new Map()
  
  // 加载队列（按优先级排序）
  private loadQueue: IResourceConfig[] = []
  
  // 超时时间（毫秒）
  private readonly TIMEOUT = 30000  // 30 秒
  
  // 最大重试次数
  private readonly MAX_RETRY = 3
  
  private constructor() {
    Logger.info('📦 [ResourceManager] 已创建')
  }
  
  /**
   * ⭐ 获取单例实例
   */
  static getInstance(): ResourceManagerClass {
    if (!this.instance) {
      this.instance = new ResourceManagerClass()
    }
    return this.instance
  }
  
  // ===========================================================================
  // 📌 公共 API - 资源注册
  // ===========================================================================
  
  /**
   * ⭐ 注册单个资源
   */
  registerResource(config: IResourceConfig): void {
    if (!config.key || !config.url) {
      Logger.error('❌ [ResourceManager] 资源配置无效:', config)
      return
    }
    
    this.resourceConfigs.set(config.key, {
      ...config,
      priority: config.priority ?? 5,
      required: config.required ?? false,
      retryCount: config.retryCount ?? 0
    })
    
    this.resourceStatus.set(config.key, ResourceStatus.PENDING)
    Logger.debug(`📝 [ResourceManager] 注册资源：${config.key}`)
  }
  
  /**
   * ⭐ 批量注册资源
   */
  registerResources(configs: IResourceConfig[]): void {
    configs.forEach(config => this.registerResource(config))
    Logger.info(`✅ [ResourceManager] 批量注册 ${configs.length} 个资源`)
  }
  
  // ===========================================================================
  // 📌 公共 API - 资源加载
  // ===========================================================================
  
  /**
   * ⭐ 加载所有已注册的资源
   */
  async loadAllResources(scene: Phaser.Scene): Promise<IResourceStats> {
    Logger.info('🚀 [ResourceManager] 开始加载所有资源...')
    
    const startTime = Date.now()
    
    // ✅ 按优先级排序
    this.loadQueue = Array.from(this.resourceConfigs.values())
      .sort((a, b) => (b.priority ?? 5) - (a.priority ?? 5))
    
    const results: IResourceLoadResult[] = []
    
    // ✅ 并发加载（限制同时加载数量）
    const batchSize = 5  // 每批最多 5 个资源
    for (let i = 0; i < this.loadQueue.length; i += batchSize) {
      const batch = this.loadQueue.slice(i, i + batchSize)
      const batchPromises = batch.map(config => 
        this.loadResourceWithRetry(scene, config)
      )
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }
    
    const duration = Date.now() - startTime
    
    // ✅ 生成统计报告
    const stats = this.generateStats()
    Logger.info(`✅ [ResourceManager] 资源加载完成 - 总耗时：${duration}ms`)
    Logger.info(`📊 [ResourceManager] 统计：成功 ${stats.loaded}/${stats.total}, 失败 ${stats.failed}`)
    
    return stats
  }
  
  /**
   * ⭐ 加载单个资源（带重试机制）
   */
  private async loadResourceWithRetry(
    scene: Phaser.Scene,
    config: IResourceConfig
  ): Promise<IResourceLoadResult> {
    const startTime = Date.now()
    
    try {
      this.resourceStatus.set(config.key, ResourceStatus.LOADING)
      
      // ✅ 添加超时保护
      const loadPromise = new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`加载超时（${this.TIMEOUT}ms）`))
        }, this.TIMEOUT)
        
        try {
          // ✅ 根据类型加载资源
          switch (config.type) {
            case ResourceType.IMAGE:
              scene.load.image(config.key, config.url)
              break
            case ResourceType.AUDIO:
              scene.load.audio(config.key, config.url)
              break
            case ResourceType.SPRITE_SHEET:
              scene.load.spritesheet(config.key, config.url, { frameWidth: 64, frameHeight: 64 })
              break
            default:
              scene.load.image(config.key, config.url)
          }
          
          // ✅ 监听加载完成事件
          scene.load.once('complete', () => {
            clearTimeout(timeoutId)
            resolve()
          })
          
          scene.load.once('loaderror', (error: any) => {
            clearTimeout(timeoutId)
            reject(new Error(error.message || '加载失败'))
          })
          
          scene.load.start()
          
        } catch (error) {
          clearTimeout(timeoutId)
          reject(error)
        }
      })
      
      await loadPromise
      
      // ✅ 加载成功
      const duration = Date.now() - startTime
      const result: IResourceLoadResult = {
        key: config.key,
        status: ResourceStatus.LOADED,
        duration,
        required: config.required
      }
      
      this.resourceStatus.set(config.key, ResourceStatus.LOADED)
      this.loadResults.set(config.key, result)
      Logger.success(`✅ [ResourceManager] 资源加载成功：${config.key} (${duration}ms)`)
      
      return result
      
    } catch (error) {
      // ✅ 加载失败，尝试重试
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      Logger.warn(`⚠️ [ResourceManager] 资源加载失败：${config.key} - ${errorMessage}`)
      
      if ((config.retryCount ?? 0) < this.MAX_RETRY) {
        Logger.info(`🔄 [ResourceManager] 重试加载：${config.key} (${(config.retryCount ?? 0) + 1}/${this.MAX_RETRY})`)
        
        const updatedConfig = {
          ...config,
          retryCount: (config.retryCount ?? 0) + 1
        }
        
        // ✅ 延迟后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * (config.retryCount ?? 0) + 1))
        return this.loadResourceWithRetry(scene, updatedConfig)
      }
      
      // ✅ 重试失败，标记为失败
      const duration = Date.now() - startTime
      const result: IResourceLoadResult = {
        key: config.key,
        status: ResourceStatus.FAILED,
        error: errorMessage,
        duration,
        required: config.required
      }
      
      this.resourceStatus.set(config.key, ResourceStatus.FAILED)
      this.loadResults.set(config.key, result)
      Logger.error(`❌ [ResourceManager] 资源加载最终失败：${config.key}`)
      
      // ✅ 如果是必需资源，抛出严重警告
      if (config.required) {
        Logger.error(`🚨 [ResourceManager] 必需资源加载失败：${config.key}`)
      }
      
      return result
    }
  }
  
  // ===========================================================================
  // 📌 公共 API - 资源查询
  // ===========================================================================
  
  /**
   * ⭐ 获取资源状态
   */
  getResourceStatus(key: string): ResourceStatus {
    return this.resourceStatus.get(key) || ResourceStatus.PENDING
  }
  
  /**
   * ⭐ 获取资源加载结果
   */
  getResourceResult(key: string): IResourceLoadResult | undefined {
    return this.loadResults.get(key)
  }
  
  /**
   * ⭐ 检查资源是否已加载
   */
  isResourceLoaded(key: string): boolean {
    return this.resourceStatus.get(key) === ResourceStatus.LOADED
  }
  
  /**
   * ⭐ 获取所有失败的资源
   */
  getFailedResources(): IResourceLoadResult[] {
    return Array.from(this.loadResults.values())
      .filter(result => result.status === ResourceStatus.FAILED)
  }
  
  /**
   * ⭐ 生成统计报告
   */
  generateStats(): IResourceStats {
    const total = this.resourceConfigs.size
    const loaded = Array.from(this.resourceStatus.values())
      .filter(status => status === ResourceStatus.LOADED).length
    const failed = Array.from(this.resourceStatus.values())
      .filter(status => status === ResourceStatus.FAILED).length
    const pending = total - loaded - failed
    
    return {
      total,
      loaded,
      failed,
      pending,
      progress: total > 0 ? Math.round((loaded / total) * 100) : 0
    }
  }
  
  /**
   * ⭐ 打印详细统计报告
   */
  printDetailedReport(): void {
    const stats = this.generateStats()
    
    Logger.info(`
╔════════════════════════════════════════════════════╗
║  📊 资源加载统计报告                                ║
╠────────────────────────────────────────────────────╣
║  总资源数：${String(stats.total).padEnd(36)}║
║  ✅ 成功：${String(stats.loaded).padEnd(37)}║
║  ❌ 失败：${String(stats.failed).padEnd(37)}║
║  ⏳ 待加载：${String(stats.pending).padEnd(36)}║
║  📈 进度：${String(stats.progress).padEnd(36)}║
╚════════════════════════════════════════════════════╝
    `)
    
    // ✅ 列出失败资源
    const failed = this.getFailedResources()
    if (failed.length > 0) {
      Logger.warn('⚠️ 失败资源列表:')
      failed.forEach(result => {
        Logger.warn(`   - ${result.key}: ${result.error || 'Unknown error'}`)
      })
    }
  }
  
  // ===========================================================================
  // 📌 公共 API - 清理
  // ===========================================================================
  
  /**
   * ⭐ 清理所有数据
   */
  clear(): void {
    Logger.info('🧹 [ResourceManager] 清理所有数据...')
    
    this.resourceConfigs.clear()
    this.resourceStatus.clear()
    this.loadResults.clear()
    this.loadQueue = []
    
    Logger.success('✅ [ResourceManager] 清理完成')
  }
  
  /**
   * ⭐ 获取加载队列长度（用于测试）
   */
  getLoadQueueLength(): number {
    return this.loadQueue.length
  }
}

// ============================================================================
// 🎯 导出单例
// ============================================================================

export const ResourceManager = ResourceManagerClass.getInstance()
