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
export let customRoutes: CustomRoute[] = []

// ──────────────────────────────────────────────
// Douglas-Peucker 抽稀算法
// ──────────────────────────────────────────────
function perpendicularDistance(point: RoutePoint, lineStart: RoutePoint, lineEnd: RoutePoint): number {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y
  const mag = Math.hypot(dx, dy)
  if (mag === 0) return Math.hypot(point.x - lineStart.x, point.y - lineStart.y)
  return Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / mag
}

export function simplifyDouglasPeucker(points: RoutePoint[], epsilon: number): RoutePoint[] {
  if (points.length < 3) return points
  let maxDist = 0
  let maxIdx = 0
  const start = points[0]
  const end = points[points.length - 1]
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], start, end)
    if (d > maxDist) { maxDist = d; maxIdx = i }
  }
  if (maxDist > epsilon) {
    const left = simplifyDouglasPeucker(points.slice(0, maxIdx + 1), epsilon)
    const right = simplifyDouglasPeucker(points.slice(maxIdx), epsilon)
    return [...left.slice(0, -1), ...right]
  }
  return [start, end]
}

// ──────────────────────────────────────────────
// Centripetal Catmull-Rom（弦长参数化，α=0.5）
// 自动避免畸形拐角，真正贴合尖锐转弯
// ──────────────────────────────────────────────
function interpCentripetal(p0: RoutePoint, p1: RoutePoint, p2: RoutePoint, p3: RoutePoint, t: number): RoutePoint {
  const t2 = t * t
  const t3 = t2 * t
  return {
    x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
  }
}

export function resampleCatmullRom(points: RoutePoint[], numSamples: number): RoutePoint[] {
  if (points.length < 2) return points
  if (points.length === 2) {
    const result: RoutePoint[] = []
    for (let i = 0; i < numSamples; i++) {
      const t = i / (numSamples - 1)
      result.push({ x: points[0].x + (points[1].x - points[0].x) * t, y: points[0].y + (points[1].y - points[0].y) * t })
    }
    return result
  }

  // 弦长参数化：以实际距离为比例分配采样点
  const segLengths: number[] = []
  let totalLen = 0
  for (let i = 0; i < points.length - 1; i++) {
    const d = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y)
    segLengths.push(d)
    totalLen += d
  }

  const result: RoutePoint[] = []
  const n = points.length
  result.push({ ...points[0] })

  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[Math.min(n - 1, i + 1)]
    const p3 = points[Math.min(n - 1, i + 2)]
    const segLen = segLengths[i]
    const segSamples = Math.max(2, Math.round((segLen / totalLen) * numSamples))

    for (let j = 1; j <= segSamples; j++) {
      const t = j / segSamples
      result.push(interpCentripetal(p0, p1, p2, p3, t))
    }
  }
  return result
}

// 优化路线：弦长 Catmull-Rom 生成圆润曲线（不删点，保持形状）
export function optimizeRoute(points: RoutePoint[]): RoutePoint[] {
  if (points.length < 3) return points
  // 用 Catmull-Rom 重采样到 200 个密集点，曲线自然圆润
  return resampleCatmullRom(points, Math.max(200, points.length * 3))
}

// 添加自定义路线
export function addCustomRoute(route: CustomRoute): void {
  customRoutes.push(route)
  saveCustomRoutes()
}

// 清除所有自定义路线
export function clearCustomRoutes(): void {
  customRoutes = []
  saveCustomRoutes()
}

// 获取当前自定义路线
export function getCustomRoutes(): CustomRoute[] {
  return customRoutes
}

// 路线编辑器管理器（支持多路线）
export class RouteEditor {
  private ctx: CanvasRenderingContext2D
  // 多条路线，当前编辑的索引
  private routes: RoutePoint[][] = []
  private currentIndex = 0
  isDrawing = false

  constructor(_canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  // 新建一条空路线并开始编辑
  newRoute() {
    this.routes.push([])
    this.currentIndex = this.routes.length - 1
    this.isDrawing = true
  }

  // 删除指定路线
  deleteRoute(index: number) {
    if (index < 0 || index >= this.routes.length) return
    this.routes.splice(index, 1)
    if (this.currentIndex >= this.routes.length) {
      this.currentIndex = Math.max(0, this.routes.length - 1)
    }
    this.isDrawing = false
  }

  // 切换到指定路线编辑
  selectRoute(index: number) {
    if (index < 0 || index >= this.routes.length) return
    this.currentIndex = index
    this.isDrawing = false
  }

  startDrawing() {
    if (this.routes.length === 0) {
      // 没有路线时，新建一条
      this.newRoute()
    } else {
      // 有路线时，不清空，只是启用绘制模式
      // 如果需要在现有路线上继续添加点，保持 isDrawing = true
      // 如果要新建路线，应该调用 newRoute()
      this.isDrawing = true
    }
  }

  addPoint(x: number, y: number) {
    if (!this.isDrawing) return
    const route = this.routes[this.currentIndex]
    const last = route[route.length - 1]
    // 距离阈值从 4 降为 1，大幅降低迟钝感；点数上限 600 防止过长路线导致卡顿
    if (last && Math.hypot(x - last.x, y - last.y) < 1) return
    if (route.length >= 600) return
    route.push({ x, y })
  }

  loadPreviewPoints(points: RoutePoint[]) {
    if (this.routes.length === 0) this.newRoute()
    // 点是画布坐标（来自 routeLoader，JSON 文件存的是游戏坐标，但编辑器显示时需要转换为画布坐标）
    // 注意：loadPreviewPoints 接收的应该是画布坐标（用于编辑器预览）
    this.routes[this.currentIndex] = [...points]
    this.isDrawing = false
  }

  clear() {
    this.routes = []
    this.currentIndex = 0
    this.isDrawing = false
  }

  stopDrawing() {
    this.isDrawing = false
  }

  getCurrentPoints(): RoutePoint[] {
    return this.routes[this.currentIndex] || []
  }

  getAllPoints(): RoutePoint[][] {
    return this.routes
  }

  getRouteCount(): number {
    return this.routes.length
  }

  getCurrentIndex(): number {
    return this.currentIndex
  }

  // 颜色列表（不同路线不同颜色）
  private static readonly COLORS = [
    '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1',
    '#96CEB4', '#FF8C00', '#DA70D6', '#00CED1'
  ]

  private drawSmooth(points: RoutePoint[], color: string, lineWidth: number, dash: boolean) {
    if (points.length < 2) return
    this.ctx.save()
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = lineWidth
    if (dash) this.ctx.setLineDash([8, 4])
    this.ctx.shadowColor = color
    this.ctx.shadowBlur = 8
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'

    // 路线编辑器绘制的点已经是画布坐标，直接绘制
    this.ctx.beginPath()
    this.ctx.moveTo(points[0].x, points[0].y)
    const last = points[points.length - 1]
    if (points.length === 2) {
      this.ctx.lineTo(last.x, last.y)
    } else {
      const secondLast = points[points.length - 2]
      for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i - 1]
        const curr = points[i]
        const next = points[i + 1]
        this.ctx.quadraticCurveTo(
          curr.x,
          curr.y,
          (prev.x + next.x) / 2,
          (prev.y + next.y) / 2
        )
      }
      this.ctx.quadraticCurveTo(
        secondLast.x,
        secondLast.y,
        last.x,
        last.y
      )
    }
    this.ctx.stroke()

    // 起点绿、终点红
    this.ctx.setLineDash([])
    this.ctx.shadowBlur = 0
    this.ctx.fillStyle = '#90EE90'
    this.ctx.beginPath()
    this.ctx.arc(points[0].x, points[0].y, 6, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.fillStyle = '#FF6B6B'
    this.ctx.beginPath()
    this.ctx.arc(last.x, last.y, 6, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.restore()
  }

  drawCurrentRoute() {
    const count = this.routes.length
    this.routes.forEach((route, i) => {
      const color = RouteEditor.COLORS[i % RouteEditor.COLORS.length]
      const isActive = i === this.currentIndex
      this.drawSmooth(route, color, isActive ? 3 : 2, !isActive)
    })
    // 路线编号
    this.routes.forEach((route, i) => {
      if (route.length === 0) return
      const color = RouteEditor.COLORS[i % RouteEditor.COLORS.length]
      this.ctx.save()
      this.ctx.fillStyle = color
      this.ctx.font = 'bold 12px sans-serif'
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'bottom'
      this.ctx.shadowColor = 'rgba(0,0,0,0.8)'
      this.ctx.shadowBlur = 3
      this.ctx.fillText(`${i + 1}`, route[0].x, route[0].y - 10)
      this.ctx.restore()
    })
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