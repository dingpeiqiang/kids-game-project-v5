/**
 * 小地图渲染模块（优化版）
 * 支持分支路径展示、房间类型图标和节点状态
 */

import * as C from '../config'
import type { Player } from '../types'
import type { RoomNodeStatus } from '../types'
import type { DungeonManager } from '../logic/dungeon'

// 房间类型图标映射
const ROOM_TYPE_ICONS: Record<string, string> = {
  entry: '▶',
  normal: '●',
  boss: '▼',
  treasure: '◆',
  rest: '✚',
  secret: '?',
}

// 房间类型颜色映射
const ROOM_TYPE_COLORS: Record<string, string> = {
  entry: '#4ade80',
  normal: '#a78bfa',
  boss: '#ef4444',
  treasure: '#fbbf24',
  rest: '#22d3ee',
  secret: '#f472b6',
}

// 节点状态颜色映射
const STATUS_COLORS: Record<RoomNodeStatus, string> = {
  current: '#fbbf24',
  completed: '#7c3aed',
  available: '#a78bfa',
  unknown: 'rgba(139, 92, 246, 0.3)',
  locked: '#ef4444',
}

// ============ 小地图绘制入口 ============

export function drawMiniMap(
  ctx: CanvasRenderingContext2D,
  rightX: number,
  dungeon: DungeonManager,
  player: Player | null,
): void {
  const mapWidth = C.RIGHT_PANEL_WIDTH - 10
  const mapHeight = 150
  const mapX = rightX + 5
  const mapY = 10

  const currentLevel = dungeon.getCurrentLevel()
  const currentRoom = dungeon.getCurrentRoom()

  // 获取节点布局
  const layout = dungeon.getRoomGraphLayout()

  drawMiniMapFrame(ctx, mapX, mapY, mapWidth, mapHeight)
  drawMiniMapTitle(ctx, mapX, mapY, mapWidth, currentLevel.name, currentRoom.name)

  const mapAreaY = mapY + 26
  const mapAreaH = 80
  const mapAreaX = mapX + 4
  const mapAreaW = mapWidth - 8

  drawMiniMapBackground(ctx, mapAreaX, mapAreaY, mapAreaW, mapAreaH)
  drawMiniMapGraph(ctx, mapAreaX, mapAreaY, mapAreaW, mapAreaH, layout, dungeon)
  drawMiniMapProgress(ctx, mapAreaX, mapAreaY, mapAreaW, mapAreaH, dungeon, player)
  drawMiniMapLegend(ctx, mapX, mapAreaY, mapAreaH)
}

// ============ 框架绘制 ============

function drawMiniMapFrame(
  ctx: CanvasRenderingContext2D,
  mapX: number, mapY: number, mapWidth: number, mapHeight: number,
): void {
  const outerGradient = ctx.createLinearGradient(mapX, mapY, mapX + mapWidth, mapY + mapHeight)
  outerGradient.addColorStop(0, '#3d3d3d')
  outerGradient.addColorStop(0.3, '#5a5a5a')
  outerGradient.addColorStop(0.7, '#5a5a5a')
  outerGradient.addColorStop(1, '#3d3d3d')
  ctx.fillStyle = outerGradient
  ctx.beginPath()
  ctx.roundRect(mapX - 3, mapY - 3, mapWidth + 6, mapHeight + 6, 4)
  ctx.fill()

  const innerGradient = ctx.createLinearGradient(mapX, mapY, mapX + mapWidth, mapY + mapHeight)
  innerGradient.addColorStop(0, '#1a1a1a')
  innerGradient.addColorStop(0.5, '#252525')
  innerGradient.addColorStop(1, '#1a1a1a')
  ctx.fillStyle = innerGradient
  ctx.beginPath()
  ctx.roundRect(mapX, mapY, mapWidth, mapHeight, 2)
  ctx.fill()
}

function drawMiniMapTitle(
  ctx: CanvasRenderingContext2D,
  mapX: number, mapY: number, mapWidth: number,
  levelName: string, roomName: string,
): void {
  const headerGradient = ctx.createLinearGradient(mapX, mapY, mapX, mapY + 26)
  headerGradient.addColorStop(0, '#1e0a2e')
  headerGradient.addColorStop(1, '#150520')
  ctx.fillStyle = headerGradient
  ctx.fillRect(mapX + 1, mapY + 1, mapWidth - 2, 24)

  ctx.strokeStyle = '#4a2c6a'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(mapX + 1, mapY + 25)
  ctx.lineTo(mapX + mapWidth - 1, mapY + 25)
  ctx.stroke()

  ctx.fillStyle = '#b87fff'
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'center'
  ctx.shadowColor = '#8b5cf6'
  ctx.shadowBlur = 4
  ctx.fillText(levelName, mapX + mapWidth / 2, mapY + 11)
  ctx.shadowBlur = 0

  ctx.fillStyle = '#e9d5ff'
  ctx.font = '7px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(roomName, mapX + mapWidth / 2, mapY + 23)
}

function drawMiniMapBackground(
  ctx: CanvasRenderingContext2D,
  mapAreaX: number, mapAreaY: number, mapAreaW: number, mapAreaH: number,
): void {
  const mapBgGradient = ctx.createRadialGradient(
    mapAreaX + mapAreaW / 2, mapAreaY + mapAreaH / 2, 0,
    mapAreaX + mapAreaW / 2, mapAreaY + mapAreaH / 2, Math.max(mapAreaW, mapAreaH) / 1.5,
  )
  mapBgGradient.addColorStop(0, '#1a0a2e')
  mapBgGradient.addColorStop(0.5, '#0f051a')
  mapBgGradient.addColorStop(1, '#0a0210')
  ctx.fillStyle = mapBgGradient
  ctx.beginPath()
  ctx.roundRect(mapAreaX, mapAreaY, mapAreaW, mapAreaH, 2)
  ctx.fill()

  // 网格线
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.08)'
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const lineX = mapAreaX + (mapAreaW / 4) * i
    ctx.beginPath()
    ctx.moveTo(lineX, mapAreaY)
    ctx.lineTo(lineX, mapAreaY + mapAreaH)
    ctx.stroke()
  }
  for (let i = 0; i <= 2; i++) {
    const lineY = mapAreaY + (mapAreaH / 2) * i
    ctx.beginPath()
    ctx.moveTo(mapAreaX, lineY)
    ctx.lineTo(mapAreaX + mapAreaW, lineY)
    ctx.stroke()
  }
}

// ============ 房间图绘制 ============

interface GraphNodeLayout {
  roomId: number
  status: RoomNodeStatus
  children: number[]
  roomType: string
  depth: number
}

function drawMiniMapGraph(
  ctx: CanvasRenderingContext2D,
  mapAreaX: number, mapAreaY: number, mapAreaW: number, mapAreaH: number,
  layout: GraphNodeLayout[],
  dungeon: DungeonManager,
): void {
  if (layout.length === 0) return

  // 计算每一层的节点数
  const depthGroups = new Map<number, GraphNodeLayout[]>()
  for (const node of layout) {
    if (!depthGroups.has(node.depth)) {
      depthGroups.set(node.depth, [])
    }
    depthGroups.get(node.depth)!.push(node)
  }

  const maxDepth = Math.max(...layout.map(n => n.depth))
  const depthCount = maxDepth + 1

  // 计算每个节点的位置
  const nodePositions = new Map<number, { x: number; y: number }>()
  const paddingX = 8
  const paddingY = 6
  const usableW = mapAreaW - paddingX * 2
  const usableH = mapAreaH - paddingY * 2

  for (const [depth, nodes] of depthGroups) {
    const count = nodes.length
    const layerX = mapAreaX + paddingX + (depth / Math.max(depthCount - 1, 1)) * usableW
    const spacingY = usableH / (count + 1)

    nodes.sort((a, b) => a.roomId - b.roomId) // 按ID排序，保证位置稳定
    nodes.forEach((node, idx) => {
      const layerY = mapAreaY + paddingY + spacingY * (idx + 1)
      nodePositions.set(node.roomId, { x: layerX, y: layerY })
    })
  }

  // 先绘制连线
  for (const node of layout) {
    const from = nodePositions.get(node.roomId)
    if (!from) continue

    for (const childId of node.children) {
      const to = nodePositions.get(childId)
      if (!to) continue

      const isConnected = node.status === 'completed' || node.status === 'current'
      drawBranchLine(ctx, from.x, from.y, to.x, to.y, isConnected, node.status)
    }
  }

  // 再绘制节点
  for (const node of layout) {
    const pos = nodePositions.get(node.roomId)
    if (!pos) continue

    const isCurrentRoom = node.roomId === dungeon.getCurrentRoomId()
    drawRoomNode(ctx, pos.x, pos.y, node.status, node.roomType, isCurrentRoom, node.roomId)
  }
}

function drawBranchLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  isActive: boolean, parentStatus: RoomNodeStatus,
): void {
  const midX = (x1 + x2) / 2

  ctx.strokeStyle = isActive
    ? '#a78bfa'
    : parentStatus === 'available'
      ? 'rgba(139, 92, 246, 0.3)'
      : 'rgba(139, 92, 246, 0.1)'
  ctx.lineWidth = isActive ? 2 : 1.5

  if (parentStatus === 'current') {
    ctx.shadowColor = '#8b5cf6'
    ctx.shadowBlur = 4
  }

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.quadraticCurveTo(midX, (y1 + y2) / 2, x2, y2)
  ctx.stroke()

  ctx.shadowBlur = 0

  // 激活路径上的小光点
  if (isActive) {
    ctx.fillStyle = 'rgba(139, 92, 246, 0.4)'
    ctx.beginPath()
    ctx.arc(midX, (y1 + y2) / 2, 3, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#a78bfa'
    ctx.shadowColor = '#8b5cf6'
    ctx.shadowBlur = 3
    ctx.beginPath()
    ctx.arc(midX, (y1 + y2) / 2, 1.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }
}

function drawRoomNode(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  status: RoomNodeStatus,
  roomType: string,
  isCurrent: boolean,
  roomId: number,
): void {
  ctx.save()

  const nodeSize = isCurrent ? 14 : 10
  const halfSize = nodeSize / 2

  if (isCurrent) {
    // 当前房间发光效果
    ctx.shadowColor = ROOM_TYPE_COLORS[roomType] || '#a78bfa'
    ctx.shadowBlur = 15
    ctx.fillStyle = `rgba(251, 191, 36, 0.15)`
    ctx.beginPath()
    ctx.arc(x, y, nodeSize + 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  // 背景
  const bgColor = STATUS_COLORS[status] || 'rgba(139, 92, 246, 0.3)'
  ctx.fillStyle = isCurrent
    ? '#fbbf24'
    : status === 'completed'
      ? '#5b21b6'
      : bgColor
  ctx.globalAlpha = status === 'unknown' ? 0.4 : 0.9

  // 绘制节点形状
  drawNodeShape(ctx, x, y, nodeSize, roomType, status)

  ctx.globalAlpha = 1

  // 已完成房间的边框
  if (status === 'completed') {
    ctx.strokeStyle = '#7c3aed'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, halfSize + 2, 0, Math.PI * 2)
    ctx.stroke()
  }

  // 锁定房间的锁图标
  if (status === 'locked') {
    ctx.fillStyle = '#ef4444'
    ctx.font = '8px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🔒', x, y)
  }

  // 当前房间的箭头标记
  if (isCurrent) {
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 9px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = '#fbbf24'
    ctx.shadowBlur = 6
    ctx.fillText('▶', x, y)
    ctx.shadowBlur = 0
  }

  ctx.restore()
}

function drawNodeShape(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number,
  roomType: string, _status: RoomNodeStatus,
): void {
  const half = size / 2

  switch (roomType) {
    case 'entry':
      // 三角形（入口标记）
      ctx.beginPath()
      ctx.moveTo(x + half, y)
      ctx.lineTo(x - half, y - half * 0.8)
      ctx.lineTo(x - half, y + half * 0.8)
      ctx.closePath()
      ctx.fill()
      break

    case 'boss':
      // 菱形（Boss房）
      ctx.beginPath()
      ctx.moveTo(x, y - half)
      ctx.lineTo(x + half, y)
      ctx.lineTo(x, y + half)
      ctx.lineTo(x - half, y)
      ctx.closePath()
      ctx.fill()
      // 红色描边
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 1.5
      ctx.stroke()
      break

    case 'treasure':
      // 方形（宝箱房）
      ctx.beginPath()
      ctx.rect(x - half * 0.8, y - half * 0.8, half * 1.6, half * 1.6)
      ctx.fill()
      // 金色边框
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 1.5
      ctx.stroke()
      break

    case 'rest':
      // 圆形（休息房）
      ctx.beginPath()
      ctx.arc(x, y, half * 0.9, 0, Math.PI * 2)
      ctx.fill()
      break

    case 'secret':
      // 虚线圆圈（隐藏房）
      ctx.beginPath()
      ctx.arc(x, y, half * 0.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.setLineDash([2, 2])
      ctx.strokeStyle = '#f472b6'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.setLineDash([])
      break

    default:
      // 圆形（普通房）
      ctx.beginPath()
      ctx.arc(x, y, half * 0.8, 0, Math.PI * 2)
      ctx.fill()
      break
  }
}

// ============ 进度条 ============

function drawMiniMapProgress(
  ctx: CanvasRenderingContext2D,
  mapAreaX: number, mapAreaY: number, mapAreaW: number, _mapAreaH: number,
  dungeon: DungeonManager,
  player: Player | null,
): void {
  const progressBarY = mapAreaY + 84
  const progressBarH = 4

  // 背景
  const progressBgGradient = ctx.createLinearGradient(mapAreaX, progressBarY, mapAreaX + mapAreaW, progressBarY)
  progressBgGradient.addColorStop(0, '#1a0a2e')
  progressBgGradient.addColorStop(1, '#0f051a')
  ctx.fillStyle = progressBgGradient
  ctx.beginPath()
  ctx.roundRect(mapAreaX, progressBarY, mapAreaW, progressBarH, 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)'
  ctx.lineWidth = 1
  ctx.stroke()

  if (player) {
    const room = dungeon.getCurrentRoom()
    // 计算进度：完成的节点数 + 当前房间的进展
    const layout = dungeon.getRoomGraphLayout()
    const completedCount = layout.filter(n => n.status === 'completed').length
    const totalCount = Math.max(layout.length, 1)
    const baseProgress = completedCount / totalCount

    const roomProgress = room.width > 0 ? Math.min(1, player.x / room.width) : 0
    const playerProgress = Math.min(1, baseProgress + roomProgress / totalCount)
    const progressWidth = playerProgress * mapAreaW

    if (progressWidth > 1) {
      const progressGradient = ctx.createLinearGradient(mapAreaX, progressBarY, mapAreaX + progressWidth, progressBarY)
      progressGradient.addColorStop(0, '#22d3ee')
      progressGradient.addColorStop(0.5, '#06b6d4')
      progressGradient.addColorStop(1, '#0891b2')
      ctx.fillStyle = progressGradient
      ctx.beginPath()
      ctx.roundRect(mapAreaX + 1, progressBarY + 1, progressWidth - 2, progressBarH - 2, 1)
      ctx.fill()
    }

    // 玩家位置指示器
    const playerPosX = mapAreaX + Math.min(progressWidth, mapAreaW) - 2
    ctx.fillStyle = '#fff'
    ctx.shadowColor = '#22d3ee'
    ctx.shadowBlur = 5
    ctx.beginPath()
    ctx.arc(playerPosX, progressBarY + progressBarH / 2, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }
}

// ============ 图例 ============

function drawMiniMapLegend(
  ctx: CanvasRenderingContext2D,
  mapX: number, mapAreaY: number, _mapAreaH: number,
): void {
  const legendY = mapAreaY + 92
  const items = [
    { color: '#a78bfa', icon: '●', label: '普通' },
    { color: '#fbbf24', icon: '◆', label: '宝箱' },
    { color: '#ef4444', icon: '▼', label: 'Boss' },
    { color: '#22d3ee', icon: '✚', label: '休息' },
    { color: '#f472b6', icon: '?', label: '隐藏' },
  ]

  const itemWidth = 23
  const maxItems = Math.min(items.length, Math.floor((C.RIGHT_PANEL_WIDTH - 15) / itemWidth))

  for (let i = 0; i < maxItems; i++) {
    const item = items[i]
    const lx = mapX + 4 + i * itemWidth

    ctx.fillStyle = item.color
    ctx.font = '6px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(item.icon, lx + 5, legendY + 4)

    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '5px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(item.label, lx + 5, legendY + 12)
  }
}