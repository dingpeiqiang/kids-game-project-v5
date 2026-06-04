// RPG塔防射击 - 渲染模块（重构版）
// 负责所有 Canvas 绘制：游戏对象、UI面板、摇杆、弹窗、炮台按钮
//
// ⚠️ 这是唯一的渲染文件。所有绘制代码都在这里，init.ts 不再包含任何渲染逻辑。

import type { GameState } from './types'
import { CANVAS_WIDTH, CANVAS_HEIGHT, TURRET_CONFIGS } from './config'
import { drawTurret, drawWall } from './turrets'
import { WALL_DISPLAY, WALL_CONFIGS } from './config'
import { drawEnemy } from './enemies'
import { drawPlayer, drawProjectiles } from './combat'
import { drawTrap } from './traps'
import { drawEnemyBullets } from './enemyBullets'
import { drawPowerups } from './powerups'  // 新增道具绘制

// ==================== 类型定义 ====================

/** 虚拟摇杆状态 */
export interface JoystickState {
  active: boolean
  baseX: number
  baseY: number
  currentX: number
  currentY: number
  radius: number
  knobRadius: number
  touchId: number | null
}

/** 按钮区域（用于点击检测） */
export interface ButtonArea {
  x: number; y: number; w: number; h: number
  type?: string
  turret?: any
  value?: number
}

/** 手机端按钮集合 */
export interface MobileButtons {
  turretButtons: ButtonArea[]
  buildButton: ButtonArea | null
  upgradeButton?: ButtonArea
  sellButton?: ButtonArea
  tabButtons?: ButtonArea[]  // 标签页按钮（炮台/城墙切换）
}

/** 渲染上下文 - 从 init.ts 传入的所有渲染所需引用 */
export interface RenderContext {
  state: GameState
  joystick: JoystickState
  selectedTurretForUpgrade: any
  upgradeDialogPos: { x: number; y: number }
  mobileButtonsRef: { current: MobileButtons | null }
}

// ==================== 辅助绘制函数 ====================

/** 圆角矩形路径 */
function drawRoundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/** 绘制圆角矩形面板 */
function drawPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color = 'rgba(15, 25, 45, 0.85)') {
  ctx.save()
  ctx.fillStyle = color
  drawRoundedRectPath(ctx, x, y, w, h, 8)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.restore()
}

/** 绘制血条 */
function drawHPBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, current: number, max: number) {
  const ratio = Math.max(0, current / max)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  drawRoundedRectPath(ctx, x, y, w, h, h / 2)
  ctx.fill()
  const hpColor = ratio > 0.5 ? '#4ADE80' : ratio > 0.25 ? '#FBBF24' : '#EF4444'
  ctx.fillStyle = hpColor
  drawRoundedRectPath(ctx, x, y, w * ratio, h, h / 2)
  ctx.fill()
  if (ratio > 0) {
    ctx.save()
    ctx.shadowColor = hpColor
    ctx.shadowBlur = 6
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    drawRoundedRectPath(ctx, x, y, w * ratio, h / 2, h / 2)
    ctx.fill()
    ctx.restore()
  }
}

/** 绘制背景网格 */
function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
  ctx.lineWidth = 1
  for (let x = 0; x <= CANVAS_WIDTH; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke()
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke()
  }
}

// ==================== UI 面板绘制 ====================

/** 左上：资源面板 */
function drawResourcePanel(ctx: CanvasRenderingContext2D, state: GameState) {
  const TOP_Y = 12
  drawPanel(ctx, 12, TOP_Y, 120, 75)

  ctx.font = '12px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#E0F2FE'; ctx.fillText('💎', 22, TOP_Y + 22); ctx.fillText(`${state.resources.crystals}`, 40, TOP_Y + 22)
  ctx.fillStyle = '#FDE68A'; ctx.fillText('⚡', 22 + 65, TOP_Y + 22); ctx.fillText(`${state.resources.energy}`, 40 + 65, TOP_Y + 22)
  ctx.fillStyle = '#F472B6'; ctx.fillText('🔪', 22, TOP_Y + 42); ctx.fillText(`${state.resources.kills}`, 40, TOP_Y + 42)
  ctx.fillStyle = '#A78BFA'; ctx.fillText('🏆', 22 + 65, TOP_Y + 42); ctx.fillText(`${state.resources.score}`, 40 + 65, TOP_Y + 42)
  ctx.fillStyle = '#9CA3AF'
  ctx.font = '9px sans-serif'
  ctx.fillText(`经验 ${state.player.exp}/${state.player.expToLevel}`, 22, TOP_Y + 62)
}

/** 中上：波次信息面板 */
function drawWavePanel(ctx: CanvasRenderingContext2D, state: GameState) {
  const TOP_Y = 12
  const wavePanelW = 130
  const wavePanelX = (CANVAS_WIDTH - wavePanelW) / 2
  drawPanel(ctx, wavePanelX, TOP_Y, wavePanelW, 60)

  ctx.fillStyle = '#A78BFA'
  ctx.font = 'bold 16px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`第 ${state.wave} / 8 波`, CANVAS_WIDTH / 2, TOP_Y + 24)

  ctx.font = '10px sans-serif'
  ctx.fillStyle = '#9CA3AF'
  if (!state.buildMode.active && state.breakTime > 0) {
    ctx.fillStyle = '#FBBF24'
    ctx.fillText(`⏱ ${Math.ceil(state.breakTime)}秒后开始`, CANVAS_WIDTH / 2, TOP_Y + 44)
  } else if (state.waveInProgress) {
    const remaining = state.enemies.length + state.enemySpawnQueue.length
    ctx.fillStyle = remaining > 0 ? '#4ADE80' : '#00E676'  // 绿色=有敌，亮绿=清完
    const label = remaining > 0 ? `👾 剩余 ${remaining}` : `✅ 清空!`
    ctx.fillText(label, CANVAS_WIDTH / 2, TOP_Y + 44)
  } else {
    ctx.fillText('等待中...', CANVAS_WIDTH / 2, TOP_Y + 44)
  }
}

/** 右上：玩家状态面板 */
function drawPlayerPanel(ctx: CanvasRenderingContext2D, state: GameState) {
  const TOP_Y = 12
  const PADDING = 12
  const playerPanelW = 130
  const playerPanelX = CANVAS_WIDTH - playerPanelW - 12
  drawPanel(ctx, playerPanelX, TOP_Y, playerPanelW, 75)

  ctx.fillStyle = '#F472B6'
  ctx.font = 'bold 11px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('⚔️ 玩家', playerPanelX + PADDING, TOP_Y + 18)

  drawHPBar(ctx, playerPanelX + PADDING, TOP_Y + 24, playerPanelW - PADDING * 2, 10, state.player.hp, state.player.maxHp)
  ctx.fillStyle = '#E0F2FE'
  ctx.font = '9px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(`${state.player.hp}/${state.player.maxHp}`, playerPanelX + playerPanelW - PADDING, TOP_Y + 33)

  ctx.textAlign = 'left'
  ctx.fillStyle = '#9CA3AF'
  ctx.font = '10px sans-serif'
  ctx.fillText('等级', playerPanelX + PADDING, TOP_Y + 50)
  ctx.fillText('攻击', playerPanelX + PADDING + 55, TOP_Y + 50)

  ctx.fillStyle = '#FBBF24'
  ctx.font = 'bold 12px sans-serif'
  ctx.fillText(`${state.player.level}`, playerPanelX + PADDING + 28, TOP_Y + 50)
  ctx.fillStyle = '#EF4444'
  ctx.fillText(`${state.player.atk}`, playerPanelX + PADDING + 55 + 28, TOP_Y + 50)
}

/** 右侧：连击显示 */
function drawCombo(ctx: CanvasRenderingContext2D, state: GameState) {
  if (state.combo.count <= 1) return

  const comboSize = Math.min(16 + state.combo.count, 28)
  const comboColor = state.combo.count >= 10 ? '#FFD700' :
                    state.combo.count >= 5 ? '#FF6B6B' : '#4ECDC4'

  ctx.save()
  ctx.shadowColor = comboColor
  ctx.shadowBlur = 12
  ctx.fillStyle = comboColor
  ctx.font = `bold ${comboSize}px sans-serif`
  ctx.textAlign = 'right'
  ctx.fillText(`${state.combo.count}x`, CANVAS_WIDTH - 15, 65)

  ctx.shadowBlur = 0
  ctx.font = '10px sans-serif'
  ctx.fillText('COMBO', CANVAS_WIDTH - 15, 80)

  // 连击计时条
  const barW = 60
  const timerRatio = Math.max(0, state.combo.timer / 2.0)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
  drawRoundedRectPath(ctx, CANVAS_WIDTH - 15 - barW, 85, barW, 3, 2)
  ctx.fill()
  ctx.fillStyle = comboColor
  drawRoundedRectPath(ctx, CANVAS_WIDTH - 15 - barW, 85, barW * timerRatio, 3, 2)
  ctx.fill()
  ctx.restore()
}

// ==================== 升级/出售弹窗 ====================

/**
 * 绘制升级/出售弹窗（点击炮台后弹出）
 * 同时更新 mobileButtonsRef 中的按钮区域用于点击检测
 */
export function drawUpgradeDialog(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  selectedTurret: any,
  dialogPos: { x: number; y: number },
  mobileButtonsRef: { current: MobileButtons | null }
): void {
  if (!selectedTurret) return

  const config = TURRET_CONFIGS[selectedTurret.type]
  if (!config) return

  const nextUpgrade = config.upgradePath.find((u: any) => u.level === selectedTurret.level + 1)

  // 计算弹窗位置（以炮台为中心锚点，然后做边界约束）
  const dialogW = 160
  const dialogH = nextUpgrade ? 75 : 50
  let dialogX = dialogPos.x - dialogW / 2
  let dialogY = dialogPos.y - dialogH / 2

  const margin = 8

  // 边界约束：左/右
  if (dialogX < margin) dialogX = margin
  if (dialogX + dialogW > CANVAS_WIDTH - margin) dialogX = CANVAS_WIDTH - dialogW - margin

  // 上边界：至少留出顶部资源面板空间（~48px）
  const minY = margin + 48
  if (dialogY < minY) dialogY = minY

  // 下边界：预留底部炮台按钮+摇杆空间（~60px）
  const maxY = CANVAS_HEIGHT - dialogH - margin - 60
  if (dialogY > maxY && maxY > minY) dialogY = maxY

  dialogPos.x = dialogX + dialogW / 2
  dialogPos.y = dialogY

  // 弹窗背景
  ctx.fillStyle = 'rgba(15, 25, 45, 0.98)'
  drawRoundedRectPath(ctx, dialogX, dialogY, dialogW, dialogH, 8)
  ctx.fill()
  ctx.strokeStyle = '#4ECDC4'
  ctx.lineWidth = 2
  ctx.stroke()

  // 炮台名称
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 11px sans-serif'
  ctx.textAlign = 'center'
  const typeNames: Record<string, string> = { laser: '激光', missile: '导弹', frost: '冰冻', lightning: '闪电' }
  ctx.fillText(`${typeNames[selectedTurret.type]} Lv.${selectedTurret.level}`, dialogX + dialogW / 2, dialogY + 18)

  if (!mobileButtonsRef.current) mobileButtonsRef.current = { turretButtons: [], buildButton: null }

  if (nextUpgrade) {
    // 升级费用
    ctx.fillStyle = '#FBBF24'
    ctx.font = '10px sans-serif'
    ctx.fillText(`💎 ${nextUpgrade.cost}`, dialogX + dialogW / 2, dialogY + 35)

    // 升级按钮
    const btnW = 60, btnH = 24
    const btnX = dialogX + 12
    const btnY = dialogY + 45
    const canAfford = state.resources.crystals >= nextUpgrade.cost

    ctx.fillStyle = canAfford ? '#4ECDC4' : '#6B7280'
    drawRoundedRectPath(ctx, btnX, btnY, btnW, btnH, 5)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 10px sans-serif'
    ctx.fillText('⬆️升级', btnX + btnW / 2, btnY + 16)

    // 出售按钮
    const sellBtnX = dialogX + dialogW - 72
    const sellValue = Math.floor(config.cost * 0.5)
    ctx.fillStyle = '#EF4444'
    drawRoundedRectPath(ctx, sellBtnX, btnY, btnW, btnH, 5)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.fillText('💰出售', sellBtnX + btnW / 2, btnY + 16)

    mobileButtonsRef.current.upgradeButton = { x: btnX, y: btnY, w: btnW, h: btnH, turret: selectedTurret, type: 'upgrade' }
    mobileButtonsRef.current.sellButton = { x: sellBtnX, y: btnY, w: btnW, h: btnH, turret: selectedTurret, type: 'sell', value: sellValue }
  } else {
    // 已满级提示
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('⭐ 已满级', dialogX + dialogW / 2, dialogY + 30)

    // 只显示出售按钮
    const btnW = 60, btnH = 24
    const btnX = dialogX + (dialogW - btnW) / 2
    const btnY = dialogY + 36
    const sellValue = Math.floor(config.cost * 0.5)

    ctx.fillStyle = '#EF4444'
    drawRoundedRectPath(ctx, btnX, btnY, btnW, btnH, 5)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 10px sans-serif'
    ctx.fillText('💰出售', btnX + btnW / 2, btnY + 16)

    mobileButtonsRef.current.sellButton = { x: btnX, y: btnY, w: btnW, h: btnH, turret: selectedTurret, type: 'sell', value: sellValue }
    mobileButtonsRef.current.upgradeButton = undefined
  }
}

// ==================== 炮台选择按钮 ====================

/**
 * 绘制底部炮台选择按钮（手机端 + PC端）
 * 同时更新 mobileButtonsRef 中的按钮区域用于点击检测
 */
export function drawTurretButtons(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  mobileButtonsRef: { current: MobileButtons | null }
): void {
  const turretTypes = ['laser', 'missile', 'frost', 'lightning']
  const turretIcons: Record<string, string> = { laser: '🔵', missile: '🚀', frost: '❄️', lightning: '⚡' }
  const turretNames: Record<string, string> = { laser: '激光', missile: '导弹', frost: '冰冻', lightning: '闪电' }
  const turretColors: Record<string, string> = {
    laser: '#00D9FF', missile: '#FF6B6B', frost: '#7FDBFF', lightning: '#FFD700'
  }

  const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window)

  if (!state.gameStarted || state.gameEnded) {
    mobileButtonsRef.current = { turretButtons: [], buildButton: null }
    return
  }

  // === 手机端：底部中央面板，炮台+城墙全部平铺显示（无tab） ===
  const btnW = 44, btnH = 38, btnGap = 4
  const cols = 7  // 4炮台 + 3城墙 = 7个按钮
  const panelPadding = 5
  const panelW = cols * btnW + (cols - 1) * btnGap + panelPadding * 2
  const panelH = btnH + panelPadding * 2
  const panelX = (CANVAS_WIDTH - panelW) / 2
  const panelY = CANVAS_HEIGHT - panelH - 8

  drawPanel(ctx, panelX, panelY, panelW, panelH, 'rgba(10, 20, 35, 0.95)')

  const btnStartX = panelX + panelPadding
  const btnY = panelY + panelPadding

  const btnList: { type: string; x: number; y: number; w: number; h: number }[] = []

  // 全部7个按钮：炮台4个 + 城墙3个
  const allTypes = ['laser', 'missile', 'frost', 'lightning', 'stone', 'reinforced', 'fortress']
  const allIcons: Record<string, string> = {
    laser: '🔵', missile: '🚀', frost: '❄️', lightning: '⚡',
    stone: '🧱', reinforced: '🔩', fortress: '🏰'
  }
  const allNames: Record<string, string> = {
    laser: '激光', missile: '导弹', frost: '冰冻', lightning: '闪电',
    stone: '石墙', reinforced: '强化', fortress: '堡垒'
  }
  const allColors: Record<string, string> = {
    laser: '#00D9FF', missile: '#FF6B6B', frost: '#7FDBFF', lightning: '#FFD700',
    stone: '#8B7355', reinforced: '#5A5A6E', fortress: '#3D3D5C'
  }
  const allCosts: Record<string, number> = {
    laser: 40, missile: 80, frost: 50, lightning: 120,
    stone: 30, reinforced: 60, fortress: 120
  }

  for (let i = 0; i < allTypes.length; i++) {
    const type = allTypes[i]
    const bx = btnStartX + i * (btnW + btnGap)
    const isSelected = state.buildMode.selectedTurret === type
    const baseColor = allColors[type]

    ctx.fillStyle = isSelected ? baseColor + 'DD' : 'rgba(255, 255, 255, 0.08)'
    drawRoundedRectPath(ctx, bx, btnY, btnW, btnH, 6)
    ctx.fill()
    ctx.strokeStyle = isSelected ? baseColor : 'rgba(255,255,255,0.1)'
    ctx.lineWidth = isSelected ? 2 : 1
    ctx.stroke()

    ctx.fillStyle = isSelected ? '#fff' : baseColor
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(allIcons[type], bx + btnW / 2, btnY + 14)

    ctx.fillStyle = isSelected ? '#fff' : '#9CA3AF'
    ctx.font = '6px sans-serif'
    ctx.fillText(allNames[type], bx + btnW / 2, btnY + 24)

    ctx.fillStyle = isSelected ? '#fff' : '#FBBF24'
    ctx.font = 'bold 6px sans-serif'
    ctx.fillText(`💎${allCosts[type]}`, bx + btnW / 2, btnY + 33)

    btnList.push({ type, x: bx, y: btnY, w: btnW, h: btnH })
  }

  // ✅ 保留 drawUpgradeDialog 设置的 upgradeButton / sellButton
  const prevUpg = mobileButtonsRef.current?.upgradeButton
  const prevSell = mobileButtonsRef.current?.sellButton
  mobileButtonsRef.current = {
    turretButtons: btnList,
    buildButton: null,
    upgradeButton: prevUpg,
    sellButton: prevSell,
    tabButtons: []
  }
}

// ==================== 虚拟摇杆绘制 ====================

/**
 * 绘制虚拟摇杆（手机端）
 * 包含激活状态（拖拽中）和未激活状态（静态提示）
 */
export function drawJoystick(
  ctx: CanvasRenderingContext2D,
  joystick: JoystickState,
  gameStarted: boolean,
  gameEnded: boolean
): void {
  const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window)
  if (!isMobile || !gameStarted || gameEnded) return

  if (joystick.active) {
    // === 激活状态：底座 + 摇杆钮 + 连接线 ===
    // 底座圆环
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(joystick.baseX, joystick.baseY, joystick.radius, 0, Math.PI * 2)
    ctx.stroke()

    // 底座填充
    ctx.fillStyle = 'rgba(78, 205, 196, 0.25)'
    ctx.beginPath()
    ctx.arc(joystick.baseX, joystick.baseY, joystick.radius, 0, Math.PI * 2)
    ctx.fill()

    // 摇杆钮（实心高亮）
    ctx.fillStyle = '#4ECDC4'
    ctx.beginPath()
    ctx.arc(joystick.currentX, joystick.currentY, joystick.knobRadius, 0, Math.PI * 2)
    ctx.fill()

    // 摇杆钮白色边框
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()

    // 连接线（底座到摇杆钮）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(joystick.baseX, joystick.baseY)
    ctx.lineTo(joystick.currentX, joystick.currentY)
    ctx.stroke()
  } else {
    // === 未激活状态：醒目的静态提示 ===
    const bx = joystick.baseX
    const by = joystick.baseY
    const r = joystick.radius

    ctx.save()

    // 外圈虚线（醒目青色）
    ctx.strokeStyle = '#4ECDC4'
    ctx.lineWidth = 2.5
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    ctx.arc(bx, by, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    // 内圈淡色填充
    ctx.fillStyle = 'rgba(78, 205, 196, 0.12)'
    ctx.beginPath()
    ctx.arc(bx, by, r - 2, 0, Math.PI * 2)
    ctx.fill()

    // 中心点
    ctx.fillStyle = 'rgba(78, 205, 196, 0.5)'
    ctx.beginPath()
    ctx.arc(bx, by, 6, 0, Math.PI * 2)
    ctx.fill()

    // 方向箭头指示（上/左/右/下）
    ctx.strokeStyle = 'rgba(78, 205, 196, 0.4)'
    ctx.lineWidth = 1.5
    const arrowLen = 10
    const arrowGap = r - 8
    // 上
    ctx.beginPath(); ctx.moveTo(bx, by - arrowGap); ctx.lineTo(bx, by - arrowGap - arrowLen); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(bx - 3, by - arrowGap - arrowLen + 4); ctx.lineTo(bx, by - arrowGap - arrowLen); ctx.lineTo(bx + 3, by - arrowGap - arrowLen + 4); ctx.stroke()
    // 下
    ctx.beginPath(); ctx.moveTo(bx, by + arrowGap); ctx.lineTo(bx, by + arrowGap + arrowLen); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(bx - 3, by + arrowGap + arrowLen - 4); ctx.lineTo(bx, by + arrowGap + arrowLen); ctx.lineTo(bx + 3, by + arrowGap + arrowLen - 4); ctx.stroke()
    // 左
    ctx.beginPath(); ctx.moveTo(bx - arrowGap, by); ctx.lineTo(bx - arrowGap - arrowLen, by); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(bx - arrowGap - arrowLen + 4, by - 3); ctx.lineTo(bx - arrowGap - arrowLen, by); ctx.lineTo(bx - arrowGap - arrowLen + 4, by + 3); ctx.stroke()
    // 右
    ctx.beginPath(); ctx.moveTo(bx + arrowGap, by); ctx.lineTo(bx + arrowGap + arrowLen, by); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(bx + arrowGap + arrowLen - 4, by - 3); ctx.lineTo(bx + arrowGap + arrowLen, by); ctx.lineTo(bx + arrowGap + arrowLen - 4, by + 3); ctx.stroke()

    // 文字标签
    ctx.fillStyle = '#4ECDC4'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🎮 移动', bx, by + r + 18)

    ctx.restore()
  }
}

// ==================== 开始/结束界面 ====================

/** 开始界面 */
export function drawStartScreen(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 32px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('🏰 RPG塔防射击', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60)

  ctx.font = '16px sans-serif'
  ctx.fillText('建造炮台防御敌人，同时控制角色射击！', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20)

  ctx.fillStyle = '#00E676'
  ctx.font = 'bold 18px sans-serif'
  ctx.fillText('点击屏幕开始游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
}

/** 结束界面 */
export function drawEndScreen(ctx: CanvasRenderingContext2D, state: GameState): void {
  // 背景遮罩
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  
  // 判断是否通关（到达第8波）
  const isVictory = state.wave >= 8
  
  if (isVictory) {
    // 🎉 通关特效：金色主题
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 36px sans-serif'
    ctx.textAlign = 'center'
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 15
    ctx.fillText('🎉 恭喜通关!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50)
    ctx.shadowBlur = 0
    
    // 通关统计信息
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '20px sans-serif'
    ctx.fillText(`最终得分: ${state.resources.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10)
    ctx.fillText(`到达波次: ${state.wave}/8`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)
    ctx.fillText(`击杀敌人: ${state.resources.kills}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50)
    
    // 通关提示
    ctx.fillStyle = '#4CAF50'
    ctx.font = 'bold 16px sans-serif'
    ctx.fillText('✨ 太棒了！点击重新开始 ✨', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90)
  } else {
    // 💀 死亡特效：红色主题
    ctx.fillStyle = '#FF4757'
    ctx.font = 'bold 32px sans-serif'
    ctx.textAlign = 'center'
    ctx.shadowColor = '#FF4757'
    ctx.shadowBlur = 10
    ctx.fillText('💀 游戏结束', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)
    ctx.shadowBlur = 0
    
    // 死亡统计信息
    ctx.fillStyle = '#fff'
    ctx.font = '18px sans-serif'
    ctx.fillText(`到达波次: ${state.wave}/8`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    ctx.fillText(`最终得分: ${state.resources.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
    
    // 重试提示
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = '14px sans-serif'
    ctx.fillText('点击重新开始', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70)
  }
}

// ==================== 主渲染函数 ====================

/**
 * 主渲染函数 — 每帧调用一次
 *
 * 渲染顺序：
 * 1. 清空画布 → 背景
 * 2. 游戏对象（陷阱→炮台→敌人→子弹→玩家→粒子→浮动文字）
 * 3. 屏幕特效（闪光）
 * 4. UI 面板（资源/波次/玩家/连击）
 * 5. 升级弹窗（如有选中炮台）
 * 6. 底部炮台按钮
 * 7. 开始/结束界面
 * 8. 虚拟摇杆（裁剪区域外，始终可见）
 */
export function render(ctx: CanvasRenderingContext2D, rc: RenderContext): void {
  const { state, joystick, selectedTurretForUpgrade, upgradeDialogPos, mobileButtonsRef } = rc

  // 1. 清空 + 背景
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // 设置裁剪区域（防止边界残影）
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  ctx.clip()

  // 应用屏幕震动
  if (state.shakeAmt > 0) {
    const shakeX = (Math.random() - 0.5) * state.shakeAmt
    const shakeY = (Math.random() - 0.5) * state.shakeAmt
    ctx.translate(shakeX, shakeY)
  }

  // 2. 背景网格
  drawGrid(ctx)

  if (state.gameStarted && !state.gameEnded) {
    // 3. 游戏对象（按层级顺序）
    for (const trap of state.traps) drawTrap(ctx, trap)
    for (const wall of state.walls) drawWall(ctx, wall)
    for (const turret of state.turrets) drawTurret(ctx, turret, selectedTurretForUpgrade === turret)
    for (const enemy of state.enemies) drawEnemy(ctx, enemy)
    drawEnemyBullets(ctx, state)
    drawProjectiles(ctx, state)
    drawPlayer(ctx, state)
    drawPowerups(ctx, state)  // 新增：绘制道具

    // 4. 粒子特效
    for (const particle of state.particles) {
      const alpha = particle.life / particle.maxLife
      ctx.globalAlpha = alpha
      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    // 5. 浮动文字
    for (const text of state.floatTexts) {
      ctx.globalAlpha = text.life
      ctx.fillStyle = text.color
      ctx.font = `bold ${text.size}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(text.text, text.x, text.y)
    }
    ctx.globalAlpha = 1

    // 6. 屏幕闪光
    if (state.screenFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${state.screenFlash * 0.3})`
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    }

    // 7. UI 面板
    drawResourcePanel(ctx, state)
    drawWavePanel(ctx, state)
    drawPlayerPanel(ctx, state)
    drawCombo(ctx, state)

    // 8. 升级/出售弹窗
    if (selectedTurretForUpgrade) {
      drawUpgradeDialog(ctx, state, selectedTurretForUpgrade, upgradeDialogPos, mobileButtonsRef)
    }

    // 9. 炮台选择按钮
    drawTurretButtons(ctx, state, mobileButtonsRef)
  }

  // 10. 开始/结束界面
  if (!state.gameStarted) drawStartScreen(ctx)
  if (state.gameEnded) drawEndScreen(ctx, state)

  // 恢复裁剪和震动状态
  ctx.restore()

  // 11. 虚拟摇杆（在裁剪区域外绘制，确保始终可见）
  drawJoystick(ctx, joystick, state.gameStarted, state.gameEnded)
}
