// ============================================================================
// 📦 关卡资源加载器 - 支持差异化加载
// ============================================================================

// Phaser 由宿主通过 CDN 提供（peerDependency），此处声明全局变量类型
declare const Phaser: typeof import('phaser').default
import { ILevelConfig, ILevelResources } from '../types/level-types'

/**
 * ⭐ 资源加载结果
 */
export interface ResourceLoadResult {
  loadedCount: number
  failedCount: number
  loadedIds: string[]
  failedIds: string[]
}

/**
 * ⭐ 关卡资源加载器
 * 
 * @remarks
 * 核心职责：
 * - 根据关卡配置动态提取资源 ID
 * - 只加载该关卡需要的资源（不加载无关资源）
 * - 支持进度追踪和错误处理
 * - 自动缓存跨关卡复用的资源
 */
export class LevelResourceLoader {
  private scene: Phaser.Scene
  private levelConfig: ILevelConfig
  private static loadedCache: Set<string> = new Set()
  
  constructor(scene: Phaser.Scene, levelConfig: ILevelConfig) {
    this.scene = scene
    this.levelConfig = levelConfig
  }
  
  /**
   * ⭐ 加载该关卡的所有资源
   */
  async loadAll(onProgress?: (progress: number) => void): Promise<ResourceLoadResult> {
    const resources = this.levelConfig.resources
    
    if (!resources || Object.keys(resources).length === 0) {
      console.log('⚠️ [ResourceLoader] 该关卡无需加载资源')
      return { 
        loadedCount: 0, 
        failedCount: 0, 
        loadedIds: [], 
        failedIds: [] 
      }
    }
    
    // ========== 步骤 1: 提取所有资源 ID ==========
    const resourceIds = this.extractAllResourceIds(resources)
    console.log(`📦 [ResourceLoader] 待加载资源：${resourceIds.length}个`, resourceIds)
    
    // ========== 步骤 2: 过滤已缓存的资源 ==========
    const needLoadIds = resourceIds.filter(id => !LevelResourceLoader.loadedCache.has(id))
    console.log(
      `📦 [ResourceLoader] 需新加载：${needLoadIds.length}个`, 
      `(已缓存 ${resourceIds.length - needLoadIds.length}个)`
    )
    
    if (needLoadIds.length === 0) {
      // 全部已缓存，直接返回
      return {
        loadedCount: resourceIds.length,
        failedCount: 0,
        loadedIds: resourceIds,
        failedIds: []
      }
    }
    
    // ========== 步骤 3: 注册 Phaser 资源 ==========
    let loadedCount = 0
    const failedIds: string[] = []
    
    for (const resourceId of needLoadIds) {
      try {
        this.registerResource(resourceId)
      } catch (error) {
        console.error(`❌ [ResourceLoader] 注册资源失败：${resourceId}`, error)
        failedIds.push(resourceId)
      }
    }
    
    // ========== 步骤 4: 开始加载并监听进度 ==========
    return new Promise((resolve) => {
      let progress = 0
      
      this.scene.load.on('filecomplete', (key: string) => {
        loadedCount++
        LevelResourceLoader.loadedCache.add(key)
        
        // 更新进度
        const newProgress = loadedCount / needLoadIds.length
        if (onProgress && Math.abs(newProgress - progress) > 0.1) {
          progress = newProgress
          onProgress(progress)
        }
      })
      
      this.scene.load.on('loaderror', (file: any) => {
        console.error(`❌ [ResourceLoader] 加载失败：${file.key}`)
        failedIds.push(file.key)
      })
      
      this.scene.load.on('complete', () => {
        resolve({
          loadedCount,
          failedCount: failedIds.length,
          loadedIds: needLoadIds.filter(id => !failedIds.includes(id)),
          failedIds
        })
      })
      
      // 启动加载
      this.scene.load.start()
    })
  }
  
  /**
   * ⭐ 从配置中提取所有资源 ID
   */
  private extractAllResourceIds(resources: ILevelResources): string[] {
    const ids: string[] = []
    
    if (resources.backgrounds) ids.push(...resources.backgrounds)
    if (resources.sprites) ids.push(...resources.sprites)
    if (resources.soundEffects) ids.push(...resources.soundEffects)
    if (resources.musicTracks) ids.push(...resources.musicTracks)
    if (resources.others) ids.push(...resources.others)
    
    // 去重
    return Array.from(new Set(ids))
  }
  
  /**
   * ⭐ 注册单个资源到 Phaser Loader
   */
  private registerResource(resourceId: string): void {
    const path = this.getResourcePath(resourceId)
    
    // 根据资源类型自动判断加载方式
    if (this.isImage(resourceId)) {
      this.scene.load.image(resourceId, path)
    } else if (this.isAudio(resourceId)) {
      this.scene.load.audio(resourceId, path)
    } else if (this.isSpriteSheet(resourceId)) {
      this.scene.load.spritesheet(resourceId, path, {
        frameWidth: 64,
        frameHeight: 64
      })
    } else {
      // 默认作为图片加载
      this.scene.load.image(resourceId, path)
    }
  }
  
  /**
   * ⭐ 判断资源类型
   */
  private isImage(resourceId: string): boolean {
    return /\.(png|jpg|jpeg|webp)$/i.test(resourceId)
  }
  
  private isAudio(resourceId: string): boolean {
    return /\.(mp3|wav|ogg)$/i.test(resourceId)
  }
  
  private isSpriteSheet(resourceId: string): boolean {
    return resourceId.endsWith('_sheet')
  }
  
  /**
   * ⭐ 获取资源完整路径（简化版本，实际应从 GTRS 读取）
   */
  private getResourcePath(resourceId: string): string {
    if (resourceId.startsWith('/') || resourceId.startsWith('http')) {
      return resourceId // 已经是完整路径
    }
    
    // 根据资源类型推断路径
    if (this.isImage(resourceId)) {
      return `/assets/images/${resourceId}`
    } else if (this.isAudio(resourceId)) {
      return `/assets/audio/${resourceId}`
    }
    
    return `/assets/${resourceId}`
  }
}
