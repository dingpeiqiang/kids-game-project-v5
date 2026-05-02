// ============================================
// Dragon Shooter 路线加载器
// 从 JSON 文件动态加载路线配置（一个路线一个文件）
// ============================================

import type { CustomRoute } from './types'

// 单个路线文件接口
interface SingleRouteFile {
  version: string
  lastModified: string
  route: CustomRoute
}

// 路线索引文件接口（可选）
interface RouteIndex {
  version: string
  lastModified: string
  levels: Record<number, string>  // 关卡号 -> 文件名
  custom: string[]                // 自定义路线文件名列表
}

// 默认路线（如果 JSON 文件不存在时使用）
// 注意：也导入 constants.ts 中的 LEVEL_SPECIFIC_ROUTES 作为回退
import { PRESET_ROUTES } from './constants'

const DEFAULT_LEVEL_ROUTES: Record<number, CustomRoute> = {
  1: {
    id: 'level_1_default',
    name: '第1关 - 默认波浪',
    points: generateDefaultRoute('wave', 1)
  },
  3: {
    id: 'level_3_default',
    name: '第3关 - 默认Z字形',
    points: generateDefaultRoute('zigzag', 3)
  },
  5: {
    id: 'level_5_default',
    name: '第5关 - 默认螺旋',
    points: generateDefaultRoute('spiral', 5)
  },
  10: {
    id: 'level_10_default',
    name: '第10关 - 默认BOSS',
    points: generateDefaultRoute('boss', 10)
  }
}

// 从 constants.ts 导入的关卡专属路线（generateLevelRoute 生成）
// 已在 constants.ts 中为 1/3/5/10 关配置了专属路线

// 生成默认路线点
function generateDefaultRoute(type: string, level: number): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = []
  const totalPoints = 1600
  const centerX = 180
  const baseH = 640
  
  for (let i = 0; i <= totalPoints; i++) {
    const progress = i / totalPoints
    
    switch (type) {
      case 'wave':
        points.push({
          x: centerX + Math.sin(progress * Math.PI * 4) * 40,
          y: -200 + progress * (baseH + 400)
        })
        break
      case 'zigzag':
        const zigzag = Math.sin(progress * Math.PI * 12) > 0 ? 1 : -1
        points.push({
          x: centerX + zigzag * 80,
          y: -200 + progress * (baseH + 400)
        })
        break
      case 'spiral':
        const radius = 60 + progress * 30
        points.push({
          x: centerX + Math.cos(progress * Math.PI * 16) * radius,
          y: -200 + progress * (baseH + 400)
        })
        break
      case 'boss':
        const wave1 = Math.sin(progress * Math.PI * 6) * 50
        const wave2 = Math.cos(progress * Math.PI * 10) * 30
        points.push({
          x: centerX + wave1 + wave2,
          y: -200 + progress * (baseH + 400)
        })
        break
      default:
        points.push({
          x: centerX,
          y: -200 + progress * (baseH + 400)
        })
    }
  }
  
  return points
}

// 路线加载器类
export class RouteLoader {
  private levelRoutes: Record<number, CustomRoute> = {}
  private customRoutes: CustomRoute[] = []
  private loaded: boolean = false
  
  // 异步加载所有路线
  async loadRoutes(): Promise<void> {
    try {
      console.log('🔄 开始加载路线...')
      
      // 1. 尝试加载索引文件（如果有）
      const indexLoaded = await this.loadIndexFile()
      
      if (indexLoaded) {
        console.log('✅ 使用索引文件加载路线')
      } else {
        console.log('⚠️  索引文件不存在，尝试直接加载关卡文件')
        // 2. 如果没有索引文件，直接加载已知的关卡
        await this.loadKnownLevels()
      }
      
      // 3. 加载自定义路线
      await this.loadCustomRoutes()
      
      this.loaded = true
      console.log('✅ 路线加载完成')
      
    } catch (error) {
      console.error('❌ 加载路线失败:', error)
      // 失败时使用默认路线
      this.levelRoutes = DEFAULT_LEVEL_ROUTES
      this.customRoutes = []
      this.loaded = true
    }
  }
  
  // 加载索引文件
  private async loadIndexFile(): Promise<boolean> {
    try {
      const response = await fetch('/games/dragonShooter/routes/index.json', {
        cache: 'no-cache'
      })
      
      if (!response.ok) return false
      
      const index: RouteIndex = await response.json()
      
      // 加载关卡路线
      for (const [levelStr, filename] of Object.entries(index.levels)) {
        const level = parseInt(levelStr)
        const route = await this.loadSingleRoute(`/games/dragonShooter/routes/levels/${filename}`)
        if (route) {
          this.levelRoutes[level] = route
        }
      }
      
      console.log(`✅ 已加载 ${Object.keys(this.levelRoutes).length} 个关卡路线`)
      return true
      
    } catch (error) {
      console.warn('⚠️  加载索引文件失败:', error)
      return false
    }
  }
  
  // 加载已知的关卡（降级方案）
  private async loadKnownLevels(): Promise<void> {
    const knownLevels = [1, 3, 5, 10]  // 已知的关卡号
    
    for (const level of knownLevels) {
      const filename = `level_${level}.json`
      const route = await this.loadSingleRoute(`/games/dragonShooter/routes/levels/${filename}`)
      
      if (route) {
        this.levelRoutes[level] = route
        console.log(`✅ 已加载第${level}关: ${route.name}`)
      } else {
        console.warn(`⚠️  第${level}关路线文件不存在，使用默认路线`)
        this.levelRoutes[level] = DEFAULT_LEVEL_ROUTES[level]
      }
    }
  }
  
  // 加载单个路线文件
  private async loadSingleRoute(url: string): Promise<CustomRoute | null> {
    try {
      const response = await fetch(url, {
        cache: 'no-cache'
      })
      
      if (!response.ok) {
        return null
      }
      
      const data: SingleRouteFile = await response.json()
      return data.route
      
    } catch (error) {
      console.warn(`⚠️  加载路线文件失败: ${url}`, error)
      return null
    }
  }
  
  // 加载自定义路线
  private async loadCustomRoutes(): Promise<void> {
    try {
      // 尝试从 custom 目录加载所有 JSON 文件
      // 注意：浏览器无法列出目录内容，所以这里需要一个索引文件或硬编码列表
      
      // 方案1：尝试加载 custom/index.json
      const indexResponse = await fetch('/games/dragonShooter/routes/custom/index.json', {
        cache: 'no-cache'
      })
      
      if (indexResponse.ok) {
        const index: { files: string[] } = await indexResponse.json()
        
        for (const filename of index.files) {
          const route = await this.loadSingleRoute(`/games/dragonShooter/routes/custom/${filename}`)
          if (route) {
            this.customRoutes.push(route)
          }
        }
        
        console.log(`✅ 已加载 ${this.customRoutes.length} 条自定义路线`)
        return
      }
      
    } catch (error) {
      console.warn('⚠️  加载自定义路线失败:', error)
      this.customRoutes = []
    }
  }
  
  // 获取关卡路线
  getLevelRoute(level: number): CustomRoute | undefined {
    return this.levelRoutes[level]
  }

  // 获取指定关卡的可用路线列表（含默认路线兜底）
  getRoutesForLevel(level: number): CustomRoute[] {
    const routes: CustomRoute[] = []

    // 1. 优先使用加载的关卡专属路线
    if (this.levelRoutes[level]) {
      routes.push(this.levelRoutes[level])
    }

    // 2. 如果没有专属路线，使用 PRESET_ROUTES 作为回退
    if (routes.length === 0) {
      routes.push(...PRESET_ROUTES)
    }

    // 3. 始终补充自定义路线
    routes.push(...this.customRoutes)

    return routes
  }
  
  // 获取所有关卡路线
  getAllLevelRoutes(): Record<number, CustomRoute> {
    return this.levelRoutes
  }
  
  // 获取自定义路线
  getCustomRoutes(): CustomRoute[] {
    return this.customRoutes
  }
  
  // 获取所有可用路线（关卡 + 自定义）
  getAllRoutes(): CustomRoute[] {
    const levelRoutesList = Object.values(this.levelRoutes)
    return [...levelRoutesList, ...this.customRoutes]
  }
  
  // 检查是否已加载
  isLoaded(): boolean {
    return this.loaded
  }
  
  // 重新加载路线（热更新）
  async reload(): Promise<void> {
    console.log('🔄 重新加载路线...')
    this.loaded = false
    await this.loadRoutes()
  }
  
  // 添加自定义路线（运行时）
  addCustomRoute(route: CustomRoute): void {
    this.customRoutes.push(route)
    console.log(`✅ 已添加自定义路线: ${route.name}`)
  }
  
  // 删除自定义路线
  removeCustomRoute(routeId: string): void {
    const index = this.customRoutes.findIndex(r => r.id === routeId)
    if (index >= 0) {
      this.customRoutes.splice(index, 1)
      console.log(`✅ 已删除自定义路线: ${routeId}`)
    }
  }
  
  // 列出所有可用的关卡号
  getAvailableLevels(): number[] {
    return Object.keys(this.levelRoutes).map(Number).sort((a, b) => a - b)
  }
  
  // 获取路线统计信息
  getStats(): {
    levelCount: number
    customCount: number
    totalPoints: number
  } {
    const levelCount = Object.keys(this.levelRoutes).length
    const customCount = this.customRoutes.length
    
    let totalPoints = 0
    Object.values(this.levelRoutes).forEach(route => {
      totalPoints += route.points.length
    })
    this.customRoutes.forEach(route => {
      totalPoints += route.points.length
    })
    
    return {
      levelCount,
      customCount,
      totalPoints
    }
  }
}

// 创建全局单例
export const routeLoader = new RouteLoader()
