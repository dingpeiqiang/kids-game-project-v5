// ============================================
// dragonShooter 路线系统
// ============================================

import type { CustomRoute, RoutePoint } from './types'
import {
  CANVAS_OFFSET_X,
  CANVAS_OFFSET_Y,
  PRESET_ROUTES,
  LEVEL_SPECIFIC_ROUTES,
  STORAGE_KEY
} from './constants'

// 存储玩家绘制的自定义路线
let customRoutes: CustomRoute[] = []

// 路线编辑器管理器
export class RouteEditor {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private currentRoute: RoutePoint[] = []
  private isDrawing = false

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas
    this.ctx = ctx
  }

  startDrawing() {
    this.currentRoute = []
    this.isDrawing = true
  }

  addPoint(x: number, y: number) {
    if (!this.isDrawing) return
    this.currentRoute.push({ x, y })
  }

  endDrawing(): CustomRoute | null {
    this.isDrawing = false

    if (this.currentRoute.length < 3) {
      this.currentRoute = []
      return null
    }

    const points: RoutePoint[] = this.currentRoute.map(p => ({
      x: p.x - CANVAS_OFFSET_X,
      y: p.y - CANVAS_OFFSET_Y
    }))

    const route: CustomRoute = {
      id: `custom_${Date.now()}`,
      name: `自定义路线 ${customRoutes.length + 1}`,
      points
    }

    this.currentRoute = []
    return route
  }

  clear() {
    this.currentRoute = []
    this.isDrawing = false
  }

  stopDrawing() {
    this.isDrawing = false
  }

  getCurrentPoints(): RoutePoint[] {
    return this.currentRoute
  }

  drawCurrentRoute() {
    if (this.currentRoute.length < 2) return

    this.ctx.save()
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 3
    this.ctx.setLineDash([8, 4])
    this.ctx.shadowColor = '#FFD700'
    this.ctx.shadowBlur = 10

    this.ctx.beginPath()
    this.ctx.moveTo(this.currentRoute[0].x, this.currentRoute[0].y)
    for (let i = 1; i < this.currentRoute.length; i++) {
      this.ctx.lineTo(this.currentRoute[i].x, this.currentRoute[i].y)
    }
    this.ctx.stroke()

    const start = this.currentRoute[0]
    const end = this.currentRoute[this.currentRoute.length - 1]

    this.ctx.setLineDash([])
    this.ctx.fillStyle = '#90EE90'
    this.ctx.beginPath()
    this.ctx.arc(start.x, start.y, 8, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = '#FF6B6B'
    this.ctx.beginPath()
    this.ctx.arc(end.x, end.y, 8, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.restore()
  }
}

// 获取或创建路线
export function getRouteForDragon(dragonId: number, level: number): CustomRoute {
  const levelRoute = LEVEL_SPECIFIC_ROUTES[level]
  if (levelRoute) {
    console.log(`🎯 使用第 ${level} 关专属路线: ${levelRoute.name}`)
    return levelRoute
  }

  const customRoutesList = getCustomRoutes()
  if (customRoutesList.length > 0) {
    return customRoutesList[dragonId % customRoutesList.length]
  }

  return PRESET_ROUTES[dragonId % PRESET_ROUTES.length]
}

// 从 localStorage 加载自定义路线
export function loadCustomRoutes(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const routes = JSON.parse(stored)
      if (Array.isArray(routes)) {
        customRoutes = routes
        console.log(`✅ 已加载 ${customRoutes.length} 条自定义路线`)
      }
    }
  } catch (error) {
    console.error('❌ 加载自定义路线失败:', error)
    customRoutes = []
  }
}

// 保存自定义路线到 localStorage
export function saveCustomRoutes(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customRoutes))
    console.log(`✅ 已保存 ${customRoutes.length} 条自定义路线`)
  } catch (error) {
    console.error('❌ 保存自定义路线失败:', error)
  }
}

// 导出路线到 JSON 文件
export function exportRoutesToFile(): void {
  try {
    const allRoutes = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      levelSpecificRoutes: LEVEL_SPECIFIC_ROUTES,
      customRoutes: customRoutes,
      totalLevels: Object.keys(LEVEL_SPECIFIC_ROUTES).length,
      totalCustomRoutes: customRoutes.length
    }

    const jsonStr = JSON.stringify(allRoutes, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `dragon_routes_${new Date().getTime()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    console.log(`✅ 已导出 ${allRoutes.totalLevels} 个关卡路线和 ${allRoutes.totalCustomRoutes} 条自定义路线`)
  } catch (error) {
    console.error('❌ 导出路线失败:', error)
  }
}

// 从 JSON 文件导入路线
export function importRoutesFromFile(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)

        if (!data.version || !data.levelSpecificRoutes) {
          throw new Error('无效的路由文件格式')
        }

        if (data.levelSpecificRoutes) {
          Object.assign(LEVEL_SPECIFIC_ROUTES, data.levelSpecificRoutes)
          console.log(`✅ 已导入 ${Object.keys(data.levelSpecificRoutes).length} 个关卡路线`)
        }

        if (data.customRoutes && Array.isArray(data.customRoutes)) {
          customRoutes = [...customRoutes, ...data.customRoutes]
          saveCustomRoutes()
          console.log(`✅ 已导入 ${data.customRoutes.length} 条自定义路线`)
        }

        resolve()
      } catch (error) {
        console.error('❌ 导入路线失败:', error)
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

// 生成代码片段
export function generateCodeSnippet(): string {
  let code = '// 关卡专属路线配置\n'
  code += 'const LEVEL_SPECIFIC_ROUTES: Record<number, CustomRoute> = {\n'

  const levels = Object.keys(LEVEL_SPECIFIC_ROUTES).map(Number).sort((a, b) => a - b)
  levels.forEach((level, index) => {
    const route = LEVEL_SPECIFIC_ROUTES[level]
    code += `  // 第${level}关\n`
    code += `  ${level}: {\n`
    code += `    id: '${route.id}',\n`
    code += `    name: '${route.name}',\n`
    code += `    points: [\n`

    const points = route.points
    const step = Math.max(1, Math.floor(points.length / 10))
    for (let i = 0; i < points.length; i += step) {
      const p = points[i]
      code += `      { x: ${p.x.toFixed(2)}, y: ${p.y.toFixed(2) }},\n`
    }

    code += `    ]\n`
    code += `  }${index < levels.length - 1 ? ',' : ''}\n\n`
  })

  code += '}\n'
  return code
}

// 删除指定的自定义路线
export function deleteCustomRoute(routeId: string): void {
  const index = customRoutes.findIndex(r => r.id === routeId)
  if (index >= 0) {
    customRoutes.splice(index, 1)
    saveCustomRoutes()
    console.log(`✅ 已删除路线: ${routeId}`)
  }
}

// 获取自定义路线列表
export function getCustomRoutes(): CustomRoute[] {
  return customRoutes
}

// 添加自定义路线
export function addCustomRoute(route: CustomRoute): void {
  customRoutes.push(route)
  saveCustomRoutes()
}