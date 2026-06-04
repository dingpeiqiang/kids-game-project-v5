// ============================================================================
// 🎮 LevelGTRSManager - GTRS规范与关卡系统整合管理器
// ============================================================================
// 
// 📌 功能说明:
//   1. 统一管理关卡配置与GTRS资源的映射关系
//   2. 提供基于GTRS规范的资源加载和验证
//   3. 支持主题版本兼容性检查
//   4. 实现智能资源缓存和性能优化
// ============================================================================

import { ILevelConfig, IGTRSCompatibility, ILevelResources } from '../types/level-types'

/**
 * ⭐ GTRS资源配置结构体
 */
export interface GTRSResourceConfig {
  /** 资源ID（在关卡中使用的标识） */
  resourceId: string
  
  /** GTRS路径（如：resources.images.scene.background） */
  gtrsPath: string
  
  /** 资源类型（自动解析） */
  resourceType: 'image' | 'audio' | 'ui' | 'spine' | 'particle'
  
  /** 优先级（用于加载顺序） */
  priority: 'critical' | 'high' | 'normal' | 'low'
  
  /** 是否已在GTRS中加载 */
  isLoaded: boolean
  
  /** 实际加载路径（经过GTRS解析） */
  actualPath?: string
  
  /** 加载状态信息 */
  loadStatus?: {
    /** 是否成功 */
    success: boolean
    /** 错误信息 */
    error?: string
    /** 加载耗时（ms） */
    loadTimeMs?: number
    /** 加载大小（bytes） */
    sizeBytes?: number
  }
}

/**
 * ⭐ GTRS主题加载配置
 */
export interface GTRSThemeConfig {
  /** 主题ID */
  themeId: string
  
  /** GTRS配置完整对象 */
  gtrsConfig: any
  
  /** 主题版本 */
  version: string
  
  /** 主题作者 */
  author?: string
  
  /** 主题描述 */
  description?: string
  
  /** 主题资源统计 */
  resourceStats: {
    images: number
    audio: number
    ui: number
    total: number
    totalSizeKB: number
  }
}

/**
 * ⭐ 资源加载策略配置
 */
export interface ResourceLoadStrategy {
  /** 并行加载数量 */
  parallelLoads: number
  
  /** 预加载资源列表 */
  preloadList: string[]
  
  /** 延迟加载资源列表 */
  lazyLoadList: string[]
  
  /** 按需加载回调 */
  onDemandLoader?: (resourceId: string) => Promise<void>
  
  /** 加载超时时间（ms） */
  timeoutMs: number
}

/**
 * ⭐ LevelGTRSManager - 核心管理器类
 */
export class LevelGTRSManager {
  // 单例实例
  private static instance: LevelGTRSManager
  
  // 当前加载的主题配置
  private currentTheme?: GTRSThemeConfig
  
  // 关卡GTRS映射缓存
  private gtrsMappings: Map<string, GTRSResourceConfig[]> = new Map()
  
  // 已加载资源缓存
  private loadedResources: Map<string, any> = new Map()
  
  // 资源加载策略
  private loadStrategy: ResourceLoadStrategy = {
    parallelLoads: 5,
    preloadList: [],
    lazyLoadList: [],
    timeoutMs: 10000
  }
  
  // 性能监控
  private performanceMetrics = {
    totalLoadTime: 0,
    successfulLoads: 0,
    failedLoads: 0,
    cachedHits: 0,
    loadErrors: [] as Array<{ resourceId: string; error: string; timestamp: number }>
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): LevelGTRSManager {
    if (!LevelGTRSManager.instance) {
      LevelGTRSManager.instance = new LevelGTRSManager()
    }
    return LevelGTRSManager.instance
  }
  
  /**
   * 加载并解析GTRS主题配置
   */
  async loadGTRSTheme(themeId: string, gtrsConfig: any): Promise<GTRSThemeConfig> {
    console.log(`[LevelGTRSManager] 开始加载GTRS主题: ${themeId}`)
    
    // 验证GTRS配置格式
    this.validateGTRSConfig(gtrsConfig)
    
    // 创建主题配置
    this.currentTheme = {
      themeId,
      gtrsConfig,
      version: gtrsConfig.specMeta?.version || '1.0.0',
      author: gtrsConfig.themeInfo?.themeAuthor,
      description: gtrsConfig.themeInfo?.themeDescription,
      resourceStats: this.calculateResourceStats(gtrsConfig)
    }
    
    console.log(`[LevelGTRSManager] 主题加载完成: ${themeId}，共${this.currentTheme.resourceStats.total}个资源`)
    
    return this.currentTheme
  }
  
  /**
   * 注册关卡GTRS映射
   */
  registerLevelGTRSMapping(levelId: string, levelConfig: ILevelConfig): string[] {
    const resources = levelConfig.resources
    if (!resources) {
      console.warn(`[LevelGTRSManager] 关卡 ${levelId} 没有资源配置，跳过映射注册`)
      return []
    }
    
    const gtrsMappings: GTRSResourceConfig[] = []
    const missingResources: string[] = []
    
    // 处理GTRS映射配置
    if (resources.gtrsResourceMapping) {
      for (const [resourceId, gtrsPath] of Object.entries(resources.gtrsResourceMapping)) {
        try {
          // 验证GTRS路径是否存在
          const actualPath = this.resolveGTRSPath(gtrsPath)
          
          if (actualPath) {
            gtrsMappings.push({
              resourceId,
              gtrsPath,
              resourceType: this.detectResourceType(gtrsPath),
              priority: resources.loadStrategy?.priority || 'normal',
              isLoaded: false
            })
          } else {
            missingResources.push(`${resourceId}: ${gtrsPath}`)
          }
        } catch (error) {
          console.warn(`[LevelGTRSManager] 资源 ${resourceId} 的GTRS路径解析失败:`, error)
          missingResources.push(`${resourceId}: ${gtrsPath} (解析失败)`)
        }
      }
    }
    
    // 也处理传统的资源列表（尝试自动映射）
    this.autoMapTraditionalResources(levelId, resources, gtrsMappings, missingResources)
    
    // 保存映射
    this.gtrsMappings.set(levelId, gtrsMappings)
    
    if (missingResources.length > 0) {
      console.warn(`[LevelGTRSManager] 关卡 ${levelId} 缺失以下资源:`, missingResources)
    }
    
    console.log(`[LevelGTRSManager] 关卡 ${levelId} 映射注册完成: ${gtrsMappings.length}个GTRS映射`)
    return missingResources
  }
  
  /**
   * 加载关卡所需的所有资源
   */
  async loadLevelResources(levelId: string, levelConfig: ILevelConfig): Promise<{
    success: boolean
    loaded: number
    failed: number
    resources: Map<string, any>
    errors: Array<{ resourceId: string; error: string }>
  }> {
    const startTime = Date.now()
    
    const mappings = this.gtrsMappings.get(levelId)
    if (!mappings) {
      throw new Error(`关卡 ${levelId} 未注册GTRS映射，请先调用registerLevelGTRSMapping`)
    }
    
    if (!this.currentTheme) {
      throw new Error('当前未加载任何GTRS主题，请先调用loadGTRSTheme')
    }
    
    console.log(`[LevelGTRSManager] 开始加载关卡 ${levelId} 资源，共${mappings.length}个资源`)
    
    // 根据资源优先级排序
    const sortedMappings = this.sortByPriority(mappings)
    
    // 加载资源
    const results = await this.loadResources(sortedMappings)
    
    const totalTime = Date.now() - startTime
    
    console.log(`[LevelGTRSManager] 关卡 ${levelId} 资源加载完成:`)
    console.log(`  ✅ 成功: ${results.successful} 个`)
    console.log(`  ❌ 失败: ${results.failed} 个`)
    console.log(`  ⏱️  耗时: ${totalTime}ms`)
    console.log(`  💾 缓存命中: ${results.cached} 个`)
    
    // 更新关卡配置中的加载状态
    this.updateLevelConfigWithLoadStatus(levelId, results, totalTime)
    
    return {
      success: results.failed === 0,
      loaded: results.successful,
      failed: results.failed,
      resources: this.loadedResources,
      errors: results.errors
    }
  }
  
  /**
   * 验证关卡配置的GTRS兼容性
   */
  validateLevelGTRSCompatibility(levelConfig: ILevelConfig): IGTRSCompatibility {
    const compatibility: IGTRSCompatibility = {
      gtrsCompliance: {
        passed: false,
        errors: [],
        warnings: []
      }
    }
    
    if (!this.currentTheme) {
      compatibility.gtrsCompliance!.errors!.push({
        resourceId: 'ALL',
        errorType: 'VERSION_MISMATCH',
        message: '未加载GTRS主题配置'
      })
      return compatibility
    }
    
    const resources = levelConfig.resources
    if (!resources) {
      compatibility.gtrsCompliance!.errors!.push({
        resourceId: 'ALL',
        errorType: 'MISSING_PATH',
        message: '关卡配置缺少resources字段'
      })
      return compatibility
    }
    
    // 检查GTRS映射
    if (resources.gtrsResourceMapping) {
      for (const [resourceId, gtrsPath] of Object.entries(resources.gtrsResourceMapping)) {
        const actualPath = this.resolveGTRSPath(gtrsPath)
        if (!actualPath) {
          compatibility.gtrsCompliance!.errors!.push({
            resourceId,
            errorType: 'RESOURCE_NOT_FOUND',
            message: `GTRS路径 ${gtrsPath} 未找到`
          })
        }
      }
    }
    
    compatibility.gtrsCompliance!.passed = compatibility.gtrsCompliance!.errors!.length === 0
    return compatibility
  }
  
  /**
   * 获取资源统计信息
   */
  getResourceStatistics() {
    return {
      metrics: this.performanceMetrics,
      currentTheme: this.currentTheme?.themeId,
      loadedResourceCount: this.loadedResources.size,
      mappedLevels: Array.from(this.gtrsMappings.keys()),
      cacheUtilization: `${this.loadedResources.size}/${this.performanceMetrics.successfulLoads}`
    }
  }
  
  /**
   * 清除缓存（可选）
   */
  clearCache(keepCritical: boolean = false) {
    if (keepCritical) {
      // 只保留标记为critical的资源
      for (const [key, value] of this.loadedResources.entries()) {
        // TODO: 根据实际业务逻辑判断是否critical
        if (!key.includes('critical')) {
          this.loadedResources.delete(key)
        }
      }
    } else {
      this.loadedResources.clear()
    }
    
    console.log(`[LevelGTRSManager] 缓存已清除，保留关键资源: ${keepCritical}`)
  }
  
  // ============================================================================
  // 🛡️ 私有方法
  // ============================================================================
  
  /**
   * 验证GTRS配置格式
   */
  private validateGTRSConfig(gtrsConfig: any): void {
    if (!gtrsConfig) {
      throw new Error('GTRS配置不能为空')
    }
    
    if (!gtrsConfig.specMeta) {
      throw new Error('GTRS配置缺少specMeta字段')
    }
    
    if (!gtrsConfig.resources) {
      throw new Error('GTRS配置缺少resources字段')
    }
  }
  
  /**
   * 计算资源统计信息
   */
  private calculateResourceStats(gtrsConfig: any): any {
    const resources = gtrsConfig.resources
    let imageCount = 0
    let audioCount = 0
    let uiCount = 0
    
    // 递归计算资源数量
    const countResources = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return
      
      for (const key in obj) {
        if (typeof obj[key] === 'object') {
          countResources(obj[key])
        } else if (key === 'src' && typeof obj[key] === 'string') {
          // 根据路径判断资源类型
          const src = obj[key]
          if (src.includes('.png') || src.includes('.jpg') || src.includes('.webp')) {
            imageCount++
          } else if (src.includes('.mp3') || src.includes('.wav')) {
            audioCount++
          } else {
            uiCount++
          }
        }
      }
    }
    
    countResources(resources)
    
    return {
      images: imageCount,
      audio: audioCount,
      ui: uiCount,
      total: imageCount + audioCount + uiCount,
      totalSizeKB: 0 // 需要实际加载时计算
    }
  }
  
  /**
   * 解析GTRS路径到实际资源路径
   */
  private resolveGTRSPath(gtrsPath: string): string | null {
    if (!this.currentTheme) return null
    
    const pathSegments = gtrsPath.split('.')
    let current = this.currentTheme.gtrsConfig
    
    for (const segment of pathSegments) {
      if (current && typeof current === 'object' && segment in current) {
        current = current[segment]
      } else {
        return null
      }
    }
    
    // 确保最终找到的是src字段
    if (current && typeof current === 'object' && 'src' in current) {
      return current.src
    }
    
    return typeof current === 'string' ? current : null
  }
  
  /**
   * 检测资源类型
   */
  private detectResourceType(gtrsPath: string): 'image' | 'audio' | 'ui' | 'spine' | 'particle' {
    if (gtrsPath.includes('images')) return 'image'
    if (gtrsPath.includes('audio')) return 'audio'
    if (gtrsPath.includes('ui')) return 'ui'
    if (gtrsPath.includes('spine')) return 'spine'
    if (gtrsPath.includes('particle')) return 'particle'
    return 'image' // 默认类型
  }
  
  /**
   * 自动映射传统资源到GTRS路径
   */
  private autoMapTraditionalResources(
    levelId: string,
    resources: ILevelResources,
    gtrsMappings: GTRSResourceConfig[],
    missingResources: string[]
  ): void {
    // 这里的自动映射逻辑可以根据项目实际情况定制
    // 例如：尝试将backgrounds中的资源ID映射到GTRS的某个路径
    
    const autoMapAttempts = [
      ...(resources.backgrounds || []).map(bg => ({ id: bg, prefix: 'resources.images.scene' })),
      ...(resources.sprites || []).map(sp => ({ id: sp, prefix: 'resources.images.characters' })),
      ...(resources.soundEffects || []).map(se => ({ id: se, prefix: 'resources.audio.effect' }))
    ]
    
    for (const attempt of autoMapAttempts) {
      const gtrsPath = `${attempt.prefix}.${attempt.id}`
      const actualPath = this.resolveGTRSPath(gtrsPath)
      
      if (actualPath) {
        gtrsMappings.push({
          resourceId: attempt.id,
          gtrsPath,
          resourceType: this.detectResourceType(gtrsPath),
          priority: 'normal',
          isLoaded: false
        })
      } else {
        missingResources.push(`${attempt.id}: ${gtrsPath} (自动映射失败)`)
      }
    }
  }
  
  /**
   * 按优先级排序资源
   */
  private sortByPriority(mappings: GTRSResourceConfig[]): GTRSResourceConfig[] {
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 }
    return [...mappings].sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }
  
  /**
   * 加载资源
   */
  private async loadResources(mappings: GTRSResourceConfig[]): Promise<{
    successful: number
    failed: number
    cached: number
    errors: Array<{ resourceId: string; error: string }>
  }> {
    const results = {
      successful: 0,
      failed: 0,
      cached: 0,
      errors: [] as Array<{ resourceId: string; error: string }>
    }
    
    // 分组加载（控制并行数量）
    const groups = this.chunkArray(mappings, this.loadStrategy.parallelLoads)
    
    for (const group of groups) {
      const promises = group.map(async (mapping) => {
        // 检查缓存
        if (this.loadedResources.has(mapping.resourceId)) {
          mapping.isLoaded = true
          results.cached++
          this.performanceMetrics.cachedHits++
          return
        }
        
        try {
          const startTime = Date.now()
          const actualPath = this.resolveGTRSPath(mapping.gtrsPath)
          
          if (!actualPath) {
            throw new Error(`GTRS路径 ${mapping.gtrsPath} 未找到实际资源`)
          }
          
          // 这里应该调用Phaser的加载器或自定义加载逻辑
          // 目前先模拟加载成功
          await this.simulateResourceLoad(actualPath)
          
          const loadTime = Date.now() - startTime
          
          // 标记为已加载
          mapping.isLoaded = true
          mapping.actualPath = actualPath
          mapping.loadStatus = {
            success: true,
            loadTimeMs: loadTime,
            sizeBytes: 1024 // 模拟大小
          }
          
          // 记录到已加载资源缓存
          this.loadedResources.set(mapping.resourceId, {
            path: actualPath,
            type: mapping.resourceType,
            loadTime,
            timestamp: Date.now()
          })
          
          results.successful++
          this.performanceMetrics.successfulLoads++
          this.performanceMetrics.totalLoadTime += loadTime
          
        } catch (error: any) {
          mapping.isLoaded = false
          mapping.loadStatus = {
            success: false,
            error: error.message
          }
          
          results.failed++
          results.errors.push({
            resourceId: mapping.resourceId,
            error: error.message
          })
          
          this.performanceMetrics.failedLoads++
          this.performanceMetrics.loadErrors.push({
            resourceId: mapping.resourceId,
            error: error.message,
            timestamp: Date.now()
          })
        }
      })
      
      await Promise.allSettled(promises)
    }
    
    return results
  }
  
  /**
   * 模拟资源加载（实际项目中替换为真实加载逻辑）
   */
  private async simulateResourceLoad(path: string): Promise<void> {
    // 模拟网络延迟
    const delay = Math.random() * 100 + 50 // 50-150ms
    return new Promise(resolve => setTimeout(resolve, delay))
  }
  
  /**
   * 更新关卡配置中的加载状态
   */
  private updateLevelConfigWithLoadStatus(
    levelId: string,
    results: { successful: number; failed: number; cached: number; errors: Array<{ resourceId: string; error: string }> },
    totalTime: number
  ): void {
    // 在实际项目中，这里可以更新关卡配置的resourceValidation等信息
    console.log(`[LevelGTRSManager] 关卡 ${levelId} 加载状态更新:`, {
      successRate: results.failed === 0 ? '100%' : `${(results.successful / (results.successful + results.failed) * 100).toFixed(1)}%`,
      totalTimeMS: totalTime,
      errorCount: results.errors.length
    })
  }
  
  /**
   * 数组分块
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}