// ============================================
// Dragon Shooter 路线加载器
// 每关一条专属路线（文件优先，无则程序生成）
// ============================================

import type { CustomRoute, RoutePoint } from './types'

interface SingleRouteFile {
  version: string
  lastModified: string
  route: CustomRoute
}

interface RouteIndex {
  version: string
  lastModified: string
  levels: Record<number, string>
  custom: string[]
}

// 路线加载器类
export class RouteLoader {
  private levelRoutes: Record<number, CustomRoute> = {}
  private customRoutes: CustomRoute[] = []
  private loaded = false

  // 每关唯一专属路线（文件优先，无则程序生成）
  getLevelRoute(level: number): CustomRoute {
    if (this.levelRoutes[level]) return this.levelRoutes[level]
    const types = ['wave', 'zigzag', 'spiral', 'boss']
    const type = types[Math.min(level - 1, types.length - 1)]
    return {
      id: `level_${level}_generated`,
      name: `第${level}关 - ${type}`,
      points: this._generateRoute(type, level)
    }
  }

  // 获取指定关卡需要的龙路线列表（关卡专属 + 自定义）
  getRoutesForLevel(level: number): CustomRoute[] {
    const result: CustomRoute[] = [this.getLevelRoute(level)]
    result.push(...this.customRoutes)
    return result
  }

  getAllLevelRoutes(): Record<number, CustomRoute> { return this.levelRoutes }
  getCustomRoutes(): CustomRoute[] { return this.customRoutes }
  isLoaded(): boolean { return this.loaded }

  async reload(): Promise<void> {
    this.loaded = false
    await this.loadRoutes()
  }

  addCustomRoute(route: CustomRoute): void {
    this.customRoutes.push(route)
    console.log(`✅ 已添加自定义路线: ${route.name}`)
  }

  removeCustomRoute(routeId: string): void {
    const idx = this.customRoutes.findIndex(r => r.id === routeId)
    if (idx >= 0) { this.customRoutes.splice(idx, 1); console.log(`✅ 已删除路线: ${routeId}`) }
  }

  getStats(): { levelCount: number; customCount: number; totalPoints: number } {
    let totalPoints = 0
    Object.values(this.levelRoutes).forEach(r => { totalPoints += r.points.length })
    this.customRoutes.forEach(r => { totalPoints += r.points.length })
    return { levelCount: Object.keys(this.levelRoutes).length, customCount: this.customRoutes.length, totalPoints }
  }

  async loadRoutes(): Promise<void> {
    try {
      console.log('🔄 开始加载路线...')
      await this.loadIndexFile()
      await this.loadCustomRoutes()
      this.loaded = true
      console.log('✅ 路线加载完成')
    } catch (error) {
      console.error('❌ 加载路线失败:', error)
      this.customRoutes = []
      this.loaded = true
    }
  }

  private async loadIndexFile(): Promise<boolean> {
    try {
      const response = await fetch('/games/dragonShooter/routes/index.json', { cache: 'no-cache' })
      if (!response.ok) return false
      const index: RouteIndex = await response.json()
      for (const [levelStr, filename] of Object.entries(index.levels)) {
        const level = parseInt(levelStr)
        const route = await this.loadSingleRoute(`/games/dragonShooter/routes/levels/${filename}`)
        if (route) this.levelRoutes[level] = route
      }
      return true
    } catch { return false }
  }

  private async loadCustomRoutes(): Promise<void> {
    try {
      const indexResponse = await fetch('/games/dragonShooter/routes/custom/index.json', { cache: 'no-cache' })
      if (indexResponse.ok) {
        const index: { files: string[] } = await indexResponse.json()
        for (const filename of index.files) {
          const route = await this.loadSingleRoute(`/games/dragonShooter/routes/custom/${filename}`)
          if (route) this.customRoutes.push(route)
        }
      }
    } catch { this.customRoutes = [] }
  }

  private async loadSingleRoute(url: string): Promise<CustomRoute | null> {
    try {
      const response = await fetch(url, { cache: 'no-cache' })
      if (!response.ok) return null
      const data: SingleRouteFile = await response.json()
      return data.route
    } catch { return null }
  }

  // 程序生成路线（无 JSON 文件时回退）
  private _generateRoute(type: string, level: number): RoutePoint[] {
    const pts: RoutePoint[] = []
    const total = 1600
    const cx = 180
    const baseH = 640
    for (let i = 0; i <= total; i++) {
      const p = i / total
      switch (type) {
        case 'wave':
          pts.push({ x: cx + Math.sin(p * Math.PI * 4) * 40, y: -200 + p * (baseH + 400) })
          break
        case 'zigzag':
          pts.push({ x: cx + (Math.sin(p * Math.PI * 12) > 0 ? 1 : -1) * 80, y: -200 + p * (baseH + 400) })
          break
        case 'spiral':
          pts.push({ x: cx + Math.cos(p * Math.PI * 16) * (60 + p * 30), y: -200 + p * (baseH + 400) })
          break
        case 'boss':
          pts.push({ x: cx + Math.sin(p * Math.PI * 6) * 50 + Math.cos(p * Math.PI * 10) * 30, y: -200 + p * (baseH + 400) })
          break
        default:
          pts.push({ x: cx, y: -200 + p * (baseH + 400) })
      }
    }
    return pts
  }
}

export const routeLoader = new RouteLoader()