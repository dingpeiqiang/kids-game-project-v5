// ============================================
// Dragon Shooter 路线加载器
// 每关一条专属路线（文件优先，无则程序生成）
// ============================================

import type { CustomRoute, RoutePoint } from './types'

interface RouteIndex {
  version: string
  lastModified: string
  levels: Record<number, string>
  custom: string[]
}

// 路线加载器类
export class RouteLoader {
  // 🎯 关键修改：每个关卡对应多条路线
  private levelRoutes: Record<number, CustomRoute[]> = {}
  private customRoutes: CustomRoute[] = []  // 编辑器绘制的自定义路线
  private loaded = false

  // 获取指定关卡的所有路线（仅关卡文件中的路线，自定义路线不混入）
  getRoutesForLevel(level: number): CustomRoute[] {
    if (this.levelRoutes[level] && this.levelRoutes[level].length > 0) {
      return [...this.levelRoutes[level]]
    }
    // 没有配置文件时，生成一条默认路线
    return [this._generateFallbackRoute(level)]
  }
  
  // 生成默认路线（当没有配置文件时）
  private _generateFallbackRoute(level: number): CustomRoute {
    const types = ['wave', 'zigzag', 'spiral', 'boss']
    const type = types[Math.min(level - 1, types.length - 1)]
    return {
      id: `level_${level}_generated`,
      name: `第${level}关 - ${type}`,
      points: this._generateRoute(type, level)
    }
  }

  getAllLevelRoutes(): Record<number, CustomRoute[]> { return this.levelRoutes }
  getCustomRoutes(): CustomRoute[] { return this.customRoutes }
  isLoaded(): boolean { return this.loaded }

  async reload(): Promise<void> {
    this.loaded = false
    await this.loadRoutes()
  }

  addCustomRoute(route: CustomRoute): void {
    this.customRoutes.push(route)
  }

  removeCustomRoute(routeId: string): void {
    const idx = this.customRoutes.findIndex(r => r.id === routeId)
    if (idx >= 0) { this.customRoutes.splice(idx, 1); console.log(`✅ 已删除路线: ${routeId}`) }
  }

  getStats(): { levelCount: number; customCount: number; totalPoints: number } {
    let totalPoints = 0
    Object.values(this.levelRoutes).forEach(routes => {
      routes.forEach(r => { totalPoints += r.points.length })
    })
    this.customRoutes.forEach(r => { totalPoints += r.points.length })
    return { levelCount: Object.keys(this.levelRoutes).length, customCount: this.customRoutes.length, totalPoints }
  }

  async loadRoutes(): Promise<void> {
    try {
      await this.loadIndexFile()
      await this.loadCustomRoutes()
      this.loaded = true
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
        const routes = await this.loadSingleRoute(`/games/dragonShooter/routes/levels/${filename}`)
        if (routes && routes.length > 0) {
          // 🎯 关键修复：将关卡文件中的所有路线都添加进来
          
          // 将所有路线存储到 levelRoutes[level] 数组中
          this.levelRoutes[level] = routes.map((route, idx) => ({
            id: route.id || `level_${level}_route_${idx}`,
            name: route.name || `第${level}关-路线${idx + 1}`,
            points: route.points,
            playerStartX: route.playerStartX,
            playerStartY: route.playerStartY
          }))
          
          // 打印每条路线的信息
          this.levelRoutes[level].forEach((route, idx) => {
          })
        }
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
          const routes = await this.loadSingleRoute(`/games/dragonShooter/routes/custom/${filename}`)
          if (routes) this.customRoutes.push(...routes)
        }
      }
    } catch { this.customRoutes = [] }
  }

  private async loadSingleRoute(url: string): Promise<CustomRoute[] | null> {
    try {
      const response = await fetch(url, { cache: 'no-cache' })
      if (!response.ok) {
        console.error(`❌ 加载失败: ${response.status} ${response.statusText}`)
        return null
      }
      const data: any = await response.json()
      // 兼容两种格式：单条 {"route": {...}} 或多条 {"routes": [...]}
      if (data.route) {
        return [data.route]
      }
      if (data.routes && Array.isArray(data.routes)) {
        return data.routes
      }
      console.warn(`⚠️ 未知的数据格式`)
      return null
    } catch (error) {
      console.error(`❌ 加载异常:`, error)
      return null
    }
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