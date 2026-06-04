// ============================================================================
// 🎮 GTRS关卡整合工具 - 简化版API
// ============================================================================
// 
// 📌 功能说明:
//   为游戏开发提供简化的GTRS-关卡整合API
//   基于LevelGTRSManager封装常用功能
// ============================================================================

import { LevelGTRSManager } from './LevelGTRSManager'
import type { ILevelConfig } from '../types/level-types'

export class GTRSLevelIntegration {
  private static instance: GTRSLevelIntegration
  private gtrsManager = LevelGTRSManager.getInstance()
  
  /**
   * 获取单例实例
   */
  public static getInstance(): GTRSLevelIntegration {
    if (!GTRSLevelIntegration.instance) {
      GTRSLevelIntegration.instance = new GTRSLevelIntegration()
    }
    return GTRSLevelIntegration.instance
  }
  
  /**
   * 初始化GTRS主题
   */
  async initTheme(themeName: string, gtrsConfig: any) {
    console.log(`🎨 初始化GTRS主题: ${themeName}`)
    
    try {
      const theme = await this.gtrsManager.loadGTRSTheme(themeName, gtrsConfig)
      
      console.log(`✅ GTRS主题初始化成功:`)
      console.log(`   主题: ${theme.themeId}`)
      console.log(`   版本: ${theme.version}`)
      console.log(`   资源总数: ${theme.resourceStats.total}个`)
      
      return theme
    } catch (error) {
      console.error(`❌ GTRS主题初始化失败:`, error)
      throw error
    }
  }
  
  /**
   * 配置关卡GTRS映射（开发者友好API）
   */
  configureLevel(levelId: string, levelConfig: ILevelConfig, options?: {
    /** 自动尝试传统资源映射 */
    autoMapTraditional?: boolean
    /** 严格模式（任何映射失败都会抛出异常） */
    strictMode?: boolean
    /** 预加载策略 */
    preloadStrategy?: 'all' | 'critical' | 'none'
  }) {
    console.log(`🔧 配置关卡GTRS映射: ${levelId}`)
    
    try {
      const missingResources = this.gtrsManager.registerLevelGTRSMapping(levelId, levelConfig)
      
      // 验证兼容性
      const compatibility = this.gtrsManager.validateLevelGTRSCompatibility(levelConfig)
      
      if (missingResources.length > 0) {
        console.warn(`⚠️ 关卡 ${levelId} 有以下资源缺失:`, missingResources)
        
        if (options?.strictMode) {
          throw new Error(`检测到 ${missingResources.length} 个缺失资源，strict模式启用，配置失败`)
        }
      }
      
      // 生成资源报告
      const report = this.generateLevelResourceReport(levelId, levelConfig, compatibility)
      
      console.log(`✅ 关卡 ${levelId} GTRS映射配置完成`)
      console.log(`   GTRS合规性: ${compatibility.gtrsCompliance?.passed ? '✅ 通过' : '❌ 未通过'}`)
      console.log(`   资源统计: ${report.totalResources}个资源` + 
                 (report.estimatedSizeKB > 0 ? `，预估大小: ${report.estimatedSizeKB}KB` : ''))
      
      return {
        success: true,
        levelId,
        missingResources,
        compatibility,
        report
      }
    } catch (error) {
      console.error(`❌ 关卡 ${levelId} GTRS映射配置失败:`, error)
      throw error
    }
  }
  
  /**
   * 加载关卡资源（简化版）
   */
  async loadLevel(levelId: string, levelConfig: ILevelConfig, callbacks?: {
    /** 加载进度回调 */
    onProgress?: (loaded: number, total: number) => void
    /** 单个资源加载完成回调 */
    onResourceLoaded?: (resourceId: string, success: boolean) => void
    /** 所有资源加载完成回调 */
    onComplete?: (result: any) => void
  }) {
    console.log(`📦 开始加载关卡资源: ${levelId}`)
    
    // 注册映射（如果尚未注册）
    const missingResources = this.gtrsManager.registerLevelGTRSMapping(levelId, levelConfig)
    if (missingResources.length > 0) {
      console.warn(`⚠️ 加载前发现 ${missingResources.length} 个缺失资源`)
    }
    
    // 模拟进度更新
    let loadedCount = 0
    const totalResources = this.getTotalResourceCount(levelConfig)
    
    const interval = setInterval(() => {
      if (callbacks?.onProgress) {
        loadedCount = Math.min(loadedCount + Math.floor(totalResources / 10), totalResources - 1)
        const progressPercentage = Math.floor((loadedCount / totalResources) * 100)
        callbacks.onProgress(loadedCount, totalResources)
        
        // 模拟单个资源加载回调
        if (callbacks?.onResourceLoaded && loadedCount % 5 === 0) {
          callbacks.onResourceLoaded(`resource_${loadedCount}`, true)
        }
      }
    }, 200)
    
    try {
      // 实际加载资源
      const result = await this.gtrsManager.loadLevelResources(levelId, levelConfig)
      
      clearInterval(interval)
      
      // 最终进度更新
      if (callbacks?.onProgress) {
        callbacks.onProgress(totalResources, totalResources)
      }
      
      console.log(`✅ 关卡 ${levelId} 资源加载完成`)
      console.log(`   成功加载: ${result.loaded} 个`)
      console.log(`   加载失败: ${result.failed} 个`)
      console.log(`   缓存命中: ${result.loaded - result.success} 个`)
      
      // 调用完成回调
      if (callbacks?.onComplete) {
        callbacks.onComplete({
          success: result.success,
          loadedCount: result.loaded,
          errorCount: result.failed,
          resources: result.resources
        })
      }
      
      return result
    } catch (error) {
      clearInterval(interval)
      console.error(`❌ 关卡 ${levelId} 资源加载失败:`, error)
      throw error
    }
  }
  
  /**
   * 快速创建GTRS映射（适用于简单关卡）
   */
  createSimpleGTRSMapping(
    levelId: string,
    resources: Record<string, {
      /** GTRS路径 */
      gtrsPath: string
      /** 资源类型 */
      type: 'background' | 'character' | 'sound' | 'music' | 'ui'
      /** 权重（0-1，影响加载顺序） */
      weight?: number
    }>
  ): Record<string, string> {
    const mapping: Record<string, string> = {}
    
    for (const [resourceId, config] of Object.entries(resources)) {
      mapping[resourceId] = config.gtrsPath
    }
    
    console.log(`📝 创建简单GTRS映射: ${Object.keys(mapping).length}个资源`)
    return mapping
  }
  
  /**
   * 检查关卡GTRS合规性
   */
  checkCompliance(levelConfig: ILevelConfig): {
    passed: boolean
    score: number
    issues: Array<{
      type: 'error' | 'warning' | 'info'
      message: string
      suggestion?: string
    }>
    recommendations: string[]
  } {
    const compatibility = this.gtrsManager.validateLevelGTRSCompatibility(levelConfig)
    
    const issues: Array<{ type: 'error' | 'warning' | 'info'; message: string; suggestion?: string }> = []
    let score = 100
    
    // 处理错误
    if (compatibility.gtrsCompliance?.errors) {
      for (const error of compatibility.gtrsCompliance.errors) {
        issues.push({
          type: 'error',
          message: `资源 "${error.resourceId}" 存在问题: ${error.message}`,
          suggestion: error.errorType === 'RESOURCE_NOT_FOUND' ? 
            '请检查GTRS路径是否正确，或添加对应资源' : 
            '请修复GTRS配置'
        })
        score -= 20 // 每个错误扣20分
      }
    }
    
    // 处理警告
    if (compatibility.gtrsCompliance?.warnings) {
      for (const warning of compatibility.gtrsCompliance.warnings) {
        issues.push({
          type: 'warning',
          message: `资源 "${warning.resourceId}" 需要注意: ${warning.message}`,
          suggestion: warning.warningType === 'LARGE_SIZE' ? 
            '考虑压缩图片大小以优化加载性能' : 
            '检查资源质量是否符合要求'
        })
        score -= 5 // 每个警告扣5分
      }
    }
    
    // 添加建议
    const recommendations: string[] = []
    
    if (issues.length === 0) {
      recommendations.push('关卡GTRS配置完美，无需修改')
    } else {
      if (issues.some(i => i.type === 'error')) {
        recommendations.push('请优先修复所有错误级别的GTRS配置问题')
      }
      recommendations.push('考虑使用createSimpleGTRSMapping()快速创建映射')
      recommendations.push('建议运行loadLevel()进行完整资源加载测试')
    }
    
    return {
      passed: compatibility.gtrsCompliance?.passed || false,
      score: Math.max(0, score), // 确保分数不低于0
      issues,
      recommendations
    }
  }
  
  /**
   * 获取资源统计仪表板数据
   */
  getDashboard() {
    const stats = this.gtrsManager.getResourceStatistics()
    
    return {
      overview: {
        currentTheme: stats.currentTheme || '未设置',
        loadedResources: stats.loadedResourceCount,
        mappedLevels: stats.mappedLevels.length,
        cacheHitRate: stats.cacheUtilization
      },
      performance: {
        totalLoadTimeMS: stats.metrics.totalLoadTime,
        averageLoadTimeMS: stats.metrics.successfulLoads > 0 ? 
          Math.round(stats.metrics.totalLoadTime / stats.metrics.successfulLoads) : 0,
        successRate: stats.metrics.successfulLoads + stats.metrics.failedLoads > 0 ?
          Math.round(stats.metrics.successfulLoads / (stats.metrics.successfulLoads + stats.metrics.failedLoads) * 100) : 100,
        cacheHitRate: stats.metrics.cachedHits > 0 ?
          Math.round(stats.metrics.cachedHits / stats.metrics.successfulLoads * 100) : 0
      },
      errors: stats.metrics.loadErrors.slice(-10) // 最近10个错误
    }
  }
  
  /**
   * 导出当前GTRS配置状态
   */
  exportConfiguration(): {
    timestamp: number
    version: string
    theme: any
    levels: string[]
    statistics: any
    recommendations: string[]
  } {
    const stats = this.gtrsManager.getResourceStatistics()
    const dashboard = this.getDashboard()
    
    return {
      timestamp: Date.now(),
      version: '1.0.0',
      theme: {
        id: dashboard.overview.currentTheme,
        loadedResources: dashboard.overview.loadedResources,
        cacheHitRate: dashboard.overview.cacheHitRate
      },
      levels: stats.mappedLevels,
      statistics: dashboard.performance,
      recommendations: [
        '保持GTRS路径与实际资源文件同步',
        '定期清理未使用的缓存资源',
        '为关键资源设置合理的加载优先级'
      ]
    }
  }
  
  // ============================================================================
  // 🛡️ 私有方法
  // ============================================================================
  
  /**
   * 生成关卡资源报告
   */
  private generateLevelResourceReport(
    levelId: string,
    levelConfig: ILevelConfig,
    compatibility: any
  ): {
    totalResources: number
    hasGTRSMapping: boolean
    estimatedSizeKB: number
    recommendedStrategies: string[]
  } {
    const resources = levelConfig.resources
    let totalResources = 0
    
    // 统计资源数量
    if (resources) {
      totalResources += (resources.backgrounds?.length || 0)
      totalResources += (resources.sprites?.length || 0)
      totalResources += (resources.soundEffects?.length || 0)
      totalResources += (resources.musicTracks?.length || 0)
      totalResources += (resources.others?.length || 0)
    }
    
    // 估算大小（每资源约10KB）
    const estimatedSizeKB = totalResources * 10
    
    // 根据关卡类型推荐策略
    const recommendedStrategies: string[] = []
    
    if (totalResources > 20) {
      recommendedStrategies.push('建议启用lazy loading进行性能优化')
    }
    
    if (estimatedSizeKB > 500) {
      recommendedStrategies.push('资源总量较大，建议进行分包加载')
    }
    
    if (!resources?.gtrsResourceMapping || Object.keys(resources.gtrsResourceMapping).length === 0) {
      recommendedStrategies.push('建议添加GTRS映射以获得更好的资源管理')
    }
    
    return {
      totalResources,
      hasGTRSMapping: !!(resources?.gtrsResourceMapping && Object.keys(resources.gtrsResourceMapping).length > 0),
      estimatedSizeKB,
      recommendedStrategies
    }
  }
  
  /**
   * 获取关卡总资源数
   */
  private getTotalResourceCount(levelConfig: ILevelConfig): number {
    const resources = levelConfig.resources
    if (!resources) return 0
    
    let count = 0
    count += resources.backgrounds?.length || 0
    count += resources.sprites?.length || 0
    count += resources.soundEffects?.length || 0
    count += resources.musicTracks?.length || 0
    count += resources.others?.length || 0
    
    return count
  }
}

/**
 * 全局辅助函数 - 快速初始化
 */
export async function setupGTRSIntegration(themeName: string, gtrsConfig: any) {
  const integration = GTRSLevelIntegration.getInstance()
  return integration.initTheme(themeName, gtrsConfig)
}

/**
 * 全局辅助函数 - 快速配置关卡
 */
export async function configureGTRSLevel(
  levelId: string,
  levelConfig: ILevelConfig,
  options?: any
) {
  const integration = GTRSLevelIntegration.getInstance()
  return integration.configureLevel(levelId, levelConfig, options)
}