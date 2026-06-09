import { GAME_CONFIG, LANE_PATHS, TOWER_LAYOUTS, CREEP_CAMPS, ROSHAN_POS } from '../config'

// ============================================================
// Dota 风格地图渲染
// 世界: 1000x540, 对角河道分割, 三路兵线, 野区
// ============================================================

export function drawBackground(ctx: CanvasRenderingContext2D, worldWidth: number, worldHeight: number): void {
  const w = worldWidth
  const h = worldHeight

  // 1. 天辉/夜魇双色地形（被河道对角线分割）
  drawTerrain(ctx, w, h)

  // 2. 河道（对角线，宽蓝带）
  drawRiver(ctx, w, h)

  // 3. 高地边缘线
  drawHighGroundCliffs(ctx, w, h)

  // 4. 三路兵线道路
  drawLane(ctx, 'top', w)
  drawLane(ctx, 'mid', w)
  drawLane(ctx, 'bot', w)

  // 5. 双方基地
  drawBase(ctx, 0, 380, 180, 160, 'player')
  drawBase(ctx, 820, 0, 180, 160, 'enemy')

  // 6. 野区树木（密集树林）
  drawTrees(ctx, w, h)

  // 7. 野怪营地
  drawCreepCamps(ctx)

  // 8. Roshan 巢穴
  drawRoshanPit(ctx)
}

// ============================================================
// 双色地形
// ============================================================
function drawTerrain(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const riverTopY = h * 0.3
  const riverBotY = h * 0.7
  const riverHalf = 36

  // 天辉方（左下）- 浅绿色草地
  ctx.fillStyle = '#3a6b24'
  ctx.beginPath()
  ctx.moveTo(0, h)
  ctx.lineTo(0, riverTopY + riverHalf)
  ctx.lineTo(w * 0.35, riverTopY + riverHalf)
  ctx.quadraticCurveTo(w * 0.5, h * 0.5 + riverHalf, w * 0.65, riverBotY + riverHalf)
  ctx.lineTo(w, riverBotY + riverHalf)
  ctx.lineTo(w, h)
  ctx.closePath()
  ctx.fill()

  // 夜魇方（右上）- 深绿色荒地
  ctx.fillStyle = '#1e3d12'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(w, 0)
  ctx.lineTo(w, riverBotY - riverHalf)
  ctx.lineTo(w * 0.65, riverBotY - riverHalf)
  ctx.quadraticCurveTo(w * 0.5, h * 0.5 - riverHalf, w * 0.35, riverTopY - riverHalf)
  ctx.lineTo(0, riverTopY - riverHalf)
  ctx.closePath()
  ctx.fill()

  // 草地纹理点
  for (let i = 0; i < 120; i++) {
    const gx = (i * 137 + 50) % w
    const gy = (i * 251 + 30) % h
    // 跳过河道区域
    const t = gx / w
    const riverY = riverTopY + t * (riverBotY - riverTopY)
    if (Math.abs(gy - riverY) < riverHalf) continue

    ctx.fillStyle = gy < riverY ? '#254d16' : '#4a8030'
    ctx.beginPath()
    ctx.arc(gx, gy, 1.5 + (i % 3) * 0.8, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ============================================================
// 河道
// ============================================================
function drawRiver(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save()

  const riverTopY = h * 0.3
  const riverBotY = h * 0.7
  const riverHalf = 36

  // 河道深水区
  ctx.fillStyle = 'rgba(15, 40, 80, 0.7)'
  ctx.beginPath()
  ctx.moveTo(0, riverTopY - riverHalf)
  ctx.lineTo(w * 0.35, riverTopY - riverHalf)
  ctx.quadraticCurveTo(w * 0.5, h * 0.5 - riverHalf, w * 0.65, riverBotY - riverHalf)
  ctx.lineTo(w, riverBotY - riverHalf)
  ctx.lineTo(w, riverBotY + riverHalf)
  ctx.lineTo(w * 0.65, riverBotY + riverHalf)
  ctx.quadraticCurveTo(w * 0.5, h * 0.5 + riverHalf, w * 0.35, riverTopY + riverHalf)
  ctx.lineTo(0, riverTopY + riverHalf)
  ctx.closePath()
  ctx.fill()

  // 浅水边缘
  const edge = 8
  ctx.fillStyle = 'rgba(25, 60, 120, 0.5)'
  ctx.beginPath()
  ctx.moveTo(0, riverTopY - riverHalf - edge)
  ctx.lineTo(w * 0.35, riverTopY - riverHalf - edge)
  ctx.quadraticCurveTo(w * 0.5, h * 0.5 - riverHalf - edge, w * 0.65, riverBotY - riverHalf - edge)
  ctx.lineTo(w, riverBotY - riverHalf - edge)
  ctx.lineTo(w, riverBotY - riverHalf)
  ctx.lineTo(w * 0.65, riverBotY - riverHalf)
  ctx.quadraticCurveTo(w * 0.5, h * 0.5 - riverHalf, w * 0.35, riverTopY - riverHalf)
  ctx.lineTo(0, riverTopY - riverHalf)
  ctx.closePath()
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(0, riverTopY + riverHalf)
  ctx.lineTo(w * 0.35, riverTopY + riverHalf)
  ctx.quadraticCurveTo(w * 0.5, h * 0.5 + riverHalf, w * 0.65, riverBotY + riverHalf)
  ctx.lineTo(w, riverBotY + riverHalf)
  ctx.lineTo(w, riverBotY + riverHalf + edge)
  ctx.lineTo(w * 0.65, riverBotY + riverHalf + edge)
  ctx.quadraticCurveTo(w * 0.5, h * 0.5 + riverHalf + edge, w * 0.35, riverTopY + riverHalf + edge)
  ctx.lineTo(0, riverTopY + riverHalf + edge)
  ctx.closePath()
  ctx.fill()

  // 河岸线
  ctx.strokeStyle = 'rgba(80, 150, 220, 0.6)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, riverTopY - riverHalf)
  ctx.lineTo(w * 0.35, riverTopY - riverHalf)
  ctx.quadraticCurveTo(w * 0.5, h * 0.5 - riverHalf, w * 0.65, riverBotY - riverHalf)
  ctx.lineTo(w, riverBotY - riverHalf)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(0, riverTopY + riverHalf)
  ctx.lineTo(w * 0.35, riverTopY + riverHalf)
  ctx.quadraticCurveTo(w * 0.5, h * 0.5 + riverHalf, w * 0.65, riverBotY + riverHalf)
  ctx.lineTo(w, riverBotY + riverHalf)
  ctx.stroke()

  // 河水流动纹
  ctx.strokeStyle = 'rgba(100, 180, 255, 0.3)'
  ctx.lineWidth = 1
  for (let i = 0; i < 12; i++) {
    const t = i / 12
    const rx = t * w
    const ry = riverTopY + t * (riverBotY - riverTopY)
    ctx.beginPath()
    ctx.moveTo(rx - 30, ry - 5)
    ctx.quadraticCurveTo(rx, ry, rx + 30, ry + 5)
    ctx.stroke()
  }

  // 河道中心线
  ctx.strokeStyle = 'rgba(60, 130, 200, 0.4)'
  ctx.lineWidth = 1
  ctx.setLineDash([6, 10])
  ctx.beginPath()
  ctx.moveTo(0, riverTopY)
  ctx.lineTo(w * 0.35, riverTopY)
  ctx.quadraticCurveTo(w * 0.5, h * 0.5, w * 0.65, riverBotY)
  ctx.lineTo(w, riverBotY)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.restore()
}

// ============================================================
// 高地悬崖线
// ============================================================
function drawHighGroundCliffs(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const riverTopY = h * 0.3
  const riverBotY = h * 0.7
  const riverHalf = 36

  // 天辉方高地边缘（河道上方 → 这是天辉的领地边界）
  // 实际上天辉在下半部分，夜魇在上半部分
  // 高地边缘在河道外侧

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 6])

  // 天辉侧高地线
  ctx.beginPath()
  ctx.moveTo(0, riverTopY + riverHalf + 4)
  ctx.lineTo(w * 0.35, riverTopY + riverHalf + 4)
  ctx.quadraticCurveTo(w * 0.5, h * 0.5 + riverHalf + 4, w * 0.65, riverBotY + riverHalf + 4)
  ctx.lineTo(w, riverBotY + riverHalf + 4)
  ctx.stroke()

  // 夜魇侧高地线
  ctx.beginPath()
  ctx.moveTo(0, riverTopY - riverHalf - 4)
  ctx.lineTo(w * 0.35, riverTopY - riverHalf - 4)
  ctx.quadraticCurveTo(w * 0.5, h * 0.5 - riverHalf - 4, w * 0.65, riverBotY - riverHalf - 4)
  ctx.lineTo(w, riverBotY - riverHalf - 4)
  ctx.stroke()

  ctx.setLineDash([])
}

// ============================================================
// 基地
// ============================================================
function drawBase(ctx: CanvasRenderingContext2D, x: number, y: number, bw: number, bh: number, team: 'player' | 'enemy'): void {
  const isPlayer = team === 'player'
  const fill = isPlayer ? 'rgba(30, 60, 130, 0.35)' : 'rgba(130, 30, 30, 0.35)'
  const border = isPlayer ? '#3355cc' : '#cc3333'
  const inner = isPlayer ? 'rgba(40, 80, 160, 0.2)' : 'rgba(160, 40, 40, 0.2)'

  // 外框
  ctx.fillStyle = fill
  ctx.fillRect(x, y, bw, bh)
  ctx.strokeStyle = border
  ctx.lineWidth = 3
  ctx.strokeRect(x, y, bw, bh)

  // 内框
  const pad = 12
  ctx.fillStyle = inner
  ctx.fillRect(x + pad, y + pad, bw - pad * 2, bh - pad * 2)
  ctx.strokeStyle = border
  ctx.lineWidth = 1
  ctx.strokeRect(x + pad, y + pad, bw - pad * 2, bh - pad * 2)

  // 中心圣坛标记
  const cx = x + bw / 2
  const cy = y + bh / 2
  ctx.fillStyle = border
  ctx.beginPath()
  ctx.arc(cx, cy, 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = isPlayer ? '#88aaff' : '#ff8888'
  ctx.beginPath()
  ctx.arc(cx, cy, 8, 0, Math.PI * 2)
  ctx.fill()

  // 标签
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(isPlayer ? '天辉' : '夜魇', cx, cy - 20)
  ctx.fillText(isPlayer ? 'RADIANT' : 'DIRE', cx, cy + 26)

  // 高台阶梯效果
  ctx.fillStyle = isPlayer ? 'rgba(20, 40, 100, 0.2)' : 'rgba(100, 20, 20, 0.2)'
  ctx.fillRect(x + bw, y, 6, bh)
  ctx.fillRect(x, y + bh, bw, 6)
}

// ============================================================
// 兵线道路
// ============================================================
function drawLane(ctx: CanvasRenderingContext2D, lane: 'top' | 'mid' | 'bot', w: number): void {
  const path = LANE_PATHS[lane].player
  if (path.length < 2) return

  const y = path[0].y
  const half = 19

  // 道路主体
  ctx.fillStyle = '#7a6548'
  ctx.fillRect(0, y - half, w, half * 2)

  // 道路边缘
  ctx.strokeStyle = '#4a3a28'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(0, y - half)
  ctx.lineTo(w, y - half)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0, y + half)
  ctx.lineTo(w, y + half)
  ctx.stroke()

  // 中线虚线
  ctx.strokeStyle = '#9a8a6a'
  ctx.lineWidth = 1
  ctx.setLineDash([10, 14])
  ctx.beginPath()
  ctx.moveTo(0, y)
  ctx.lineTo(w, y)
  ctx.stroke()
  ctx.setLineDash([])
}

// ============================================================
// 树木（密集树林）
// ============================================================
function drawTrees(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const riverTopY = h * 0.3
  const riverBotY = h * 0.7
  const riverHalf = 36

  // 判断是否在河道内
  function inRiver(tx: number, ty: number): boolean {
    const t = tx / w
    const riverY = riverTopY + t * (riverBotY - riverTopY)
    return Math.abs(ty - riverY) < riverHalf + 6
  }

  // 判断是否在道路上
  function onLane(ty: number): boolean {
    return (ty > 88 && ty < 132) || (ty > 248 && ty < 292) || (ty > 408 && ty < 452)
  }

  // 判断是否在基地内
  function inBase(tx: number, ty: number): boolean {
    if (tx < 180 && ty > 380) return true
    if (tx > 820 && ty < 160) return true
    return false
  }

  const trees: { x: number; y: number; s: number }[] = []
  const seed = 42

  // 生成大量树木
  for (let i = 0; i < 350; i++) {
    const tx = ((i * 197 + seed * 13) % (w - 60)) + 30
    const ty = ((i * 311 + seed * 7) % (h - 40)) + 20

    if (inRiver(tx, ty)) continue
    if (onLane(ty)) continue
    if (inBase(tx, ty)) continue

    // 跳过太靠近道路边缘的
    if (Math.abs(ty - 110) < 24) continue
    if (Math.abs(ty - 270) < 24) continue
    if (Math.abs(ty - 430) < 24) continue

    trees.push({ x: tx, y: ty, s: 0.7 + (i % 5) * 0.15 })
  }

  // 按 y 排序以便正确绘制（远的先画）
  trees.sort((a, b) => a.y - b.y)

  for (const t of trees) {
    drawTree(ctx, t.x, t.y, t.s)
  }
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
  const s = scale

  // 树干
  ctx.fillStyle = '#4a2a10'
  ctx.fillRect(x - 2 * s, y - 3 * s, 4 * s, 7 * s)

  // 树冠暗
  ctx.fillStyle = '#144508'
  ctx.beginPath()
  ctx.arc(x, y - 6 * s, 7 * s, 0, Math.PI * 2)
  ctx.fill()

  // 树冠亮
  ctx.fillStyle = '#1f6a0e'
  ctx.beginPath()
  ctx.arc(x - 1 * s, y - 7 * s, 4.5 * s, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.arc(x + 2 * s, y - 6 * s, 4 * s, 0, Math.PI * 2)
  ctx.fill()
}

// ============================================================
// 野怪营地
// ============================================================
function drawCreepCamps(ctx: CanvasRenderingContext2D): void {
  for (const camp of CREEP_CAMPS) {
    const isMedium = camp.type === 'medium'

    // 营地地面
    ctx.fillStyle = isMedium ? 'rgba(255, 180, 0, 0.12)' : 'rgba(180, 180, 180, 0.1)'
    ctx.beginPath()
    ctx.arc(camp.x, camp.y, 16, 0, Math.PI * 2)
    ctx.fill()

    // 边框
    ctx.strokeStyle = isMedium ? '#996600' : '#777777'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.arc(camp.x, camp.y, 16, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    // 图标
    ctx.fillStyle = isMedium ? '#cc8800' : '#888888'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(isMedium ? '⚔' : '◈', camp.x, camp.y + 4)
  }
}

// ============================================================
// Roshan 巢穴
// ============================================================
function drawRoshanPit(ctx: CanvasRenderingContext2D): void {
  const { x, y } = ROSHAN_POS

  // 巢穴地面
  ctx.fillStyle = 'rgba(60, 15, 15, 0.45)'
  ctx.beginPath()
  ctx.arc(x, y, 32, 0, Math.PI * 2)
  ctx.fill()

  // 外圈
  ctx.strokeStyle = '#cc3300'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.arc(x, y, 32, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  // 内圈
  ctx.strokeStyle = 'rgba(255, 80, 0, 0.5)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(x, y, 22, 0, Math.PI * 2)
  ctx.stroke()

  // 骷髅标记
  ctx.fillStyle = '#ff3300'
  ctx.font = 'bold 16px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('☠', x, y + 6)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 8px sans-serif'
  ctx.fillText('ROSHAN', x, y + 20)
}