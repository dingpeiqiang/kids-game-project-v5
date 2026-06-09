/**
 * 触摸UI渲染模块
 * 负责移动端摇杆、按钮、小地图等UI元素的渲染
 */

import * as C from '../config'
import type { Player, SkillInstance } from '../types'
import type { DungeonManager } from '../logic/dungeon'
import type { TouchButtonState, JoystickState } from '../logic/input-manager'
import { drawMiniMap } from './minimap'

export type { TouchButtonState, JoystickState }

export interface TouchUIData {
  touchButtons: TouchButtonState[]
  joystick: JoystickState
  dungeon: DungeonManager
  player: Player | null
  skills: SkillInstance[]
}

// ============ 主触摸UI绘制入口 ============

export function drawTouchUI(
  ctx: CanvasRenderingContext2D,
  data: TouchUIData,
  totalWidth: number,
  now: number,
): void {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || C.isMobileDevice()
  if (!isTouchDevice) return

  ctx.save()

  const isMobile = C.isMobileDevice()

  // 移动端：摇杆叠加在游戏画面左下角
  if (isMobile) {
    drawJoystick(ctx, data.joystick, true)
    drawActionButtons(ctx, data.touchButtons, data.skills)
  } else {
    // PC端：完整布局
    drawLeftPanel(ctx)
    drawJoystick(ctx, data.joystick, false)

    const rightX = C.LEFT_PANEL_WIDTH + C.CANVAS_WIDTH
    drawRightPanel(ctx, rightX)
    drawMiniMap(ctx, rightX, data.dungeon, data.player)
    drawActionButtons(ctx, data.touchButtons, data.skills)
  }

  ctx.restore()
}

// ============ 左侧面板 ============

function drawLeftPanel(ctx: CanvasRenderingContext2D): void {
  const leftPanelGradient = ctx.createLinearGradient(0, 0, C.LEFT_PANEL_WIDTH, 0)
  leftPanelGradient.addColorStop(0, 'rgba(0,0,0,0.3)')
  leftPanelGradient.addColorStop(1, 'rgba(0,0,0,0.1)')
  ctx.fillStyle = leftPanelGradient
  ctx.fillRect(0, 0, C.LEFT_PANEL_WIDTH, C.CANVAS_HEIGHT)
}

// ============ 右侧面板 ============

function drawRightPanel(ctx: CanvasRenderingContext2D, rightX: number): void {
  const rightPanelGradient = ctx.createLinearGradient(C.RIGHT_PANEL_WIDTH, 0, 0, 0)
  rightPanelGradient.addColorStop(0, 'rgba(0,0,0,0.3)')
  rightPanelGradient.addColorStop(1, 'rgba(0,0,0,0.1)')
  ctx.fillStyle = rightPanelGradient
  ctx.fillRect(rightX, 0, C.RIGHT_PANEL_WIDTH, C.CANVAS_HEIGHT)
}

// ============ 摇杆绘制 ============

export function drawJoystick(ctx: CanvasRenderingContext2D, joystick: JoystickState, isMobile: boolean = false): void {
  // 移动端：摇杆在游戏画面左下角；PC端：在左侧面板中心
  const centerX = isMobile
    ? C.LEFT_PANEL_WIDTH + 60
    : C.LEFT_PANEL_WIDTH / 2
  const centerY = isMobile
    ? C.CANVAS_HEIGHT - 70
    : C.CANVAS_HEIGHT * 0.55
  const outerRadius = 45
  const innerRadius = 20

  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  ctx.beginPath()
  ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2)
  ctx.stroke()

  let stickX = centerX
  let stickY = centerY

  if (joystick.active) {
    const dx = joystick.currentX - joystick.startX
    const dy = joystick.currentY - joystick.startY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > 0) {
      const clampedDistance = Math.min(distance, outerRadius - innerRadius)
      const normalizedX = dx / distance
      const normalizedY = dy / distance

      stickX = centerX + normalizedX * clampedDistance
      stickY = centerY + normalizedY * clampedDistance
    }
  }

  ctx.fillStyle = '#2196F3'
  ctx.beginPath()
  ctx.arc(stickX, stickY, innerRadius, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(stickX, stickY, innerRadius, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 12px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('●', stickX, stickY)
}

// ============ 操作按钮 ============

function drawActionButtons(
  ctx: CanvasRenderingContext2D,
  touchButtons: TouchButtonState[],
  skills: SkillInstance[],
): void {
  const iconMap: Record<string, { icon: string; color: string; isMain: boolean }> = {
    attack: { icon: 'A', color: '#DC2626', isMain: true },
    skill1: { icon: '1', color: '#059669', isMain: false },
    jump: { icon: '↑', color: '#2563EB', isMain: false },
    skill2: { icon: '2', color: '#7C3AED', isMain: false },
  }

  for (const btn of touchButtons) {
    const cfg = iconMap[btn.id]
    if (!cfg) continue
    const cx = btn.x + btn.width / 2
    const cy = btn.y + btn.height / 2
    const r = btn.width / 2
    
    // 获取技能信息（如果是技能按钮）
    let skillInfo: SkillInstance | null = null
    let skillLocked = false
    if (btn.id === 'skill1') {
      if (skills.length > 0) {
        skillInfo = skills[0]
      } else {
        skillLocked = true
      }
    } else if (btn.id === 'skill2') {
      if (skills.length > 1) {
        skillInfo = skills[1]
      } else {
        skillLocked = true
      }
    }
    
    drawTouchBtn(ctx, cx, cy, r, cfg.icon, btn.pressed, cfg.color, cfg.isMain, skillInfo, skillLocked)
  }
}

export function drawTouchBtn(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  label: string, pressed: boolean, color: string,
  isMain: boolean = false,
  skillInfo: SkillInstance | null = null,
  skillLocked: boolean = false,
): void {
  ctx.save()
  ctx.translate(x, y)

  const scale = pressed ? 0.95 : 1
  ctx.scale(scale, scale)

  // 技能锁定状态：显示灰色禁用效果
  if (skillLocked) {
    ctx.fillStyle = 'rgba(100, 100, 100, 0.4)'
    ctx.beginPath()
    ctx.roundRect(-r, -r, r * 2, r * 2, r * 0.3)
    ctx.fill()
    
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // 禁用图标
    ctx.fillStyle = 'rgba(150, 150, 150, 0.6)'
    ctx.font = `bold ${r * 0.65}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, 0, 1)
    
    // 锁图标
    ctx.font = `${r * 0.4}px Arial`
    ctx.fillText('🔒', 0, -r * 0.3)
    
    ctx.restore()
    
    // 显示未解锁提示
    drawLockedSkillTooltip(ctx, x, y - r - 8)
    return
  }

  if (isMain) {
    ctx.shadowColor = color
    ctx.shadowBlur = pressed ? 20 : 12
  } else if (pressed) {
    ctx.shadowColor = color
    ctx.shadowBlur = 10
  }

  const gradient = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r)
  if (pressed) {
    gradient.addColorStop(0, `${color}cc`)
    gradient.addColorStop(1, `${color}88`)
  } else {
    gradient.addColorStop(0, `${color}66`)
    gradient.addColorStop(1, `${color}33`)
  }
  ctx.fillStyle = gradient

  ctx.beginPath()
  ctx.roundRect(-r, -r, r * 2, r * 2, r * 0.3)
  ctx.fill()

  ctx.strokeStyle = pressed ? color : `${color}aa`
  ctx.lineWidth = pressed ? 3 : 2
  ctx.stroke()

  if (!pressed) {
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.beginPath()
    ctx.roundRect(-r * 0.7, -r * 0.8, r * 1.4, r * 0.8, r * 0.2)
    ctx.fill()
  }

  ctx.shadowBlur = 0

  ctx.fillStyle = pressed ? '#fff' : 'rgba(255,255,255,0.9)'
  ctx.font = `bold ${r * 0.65}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (isMain) {
    ctx.shadowColor = '#fff'
    ctx.shadowBlur = 5
  }
  ctx.fillText(label, 0, 1)

  // 绘制技能信息
  if (skillInfo) {
    // 技能图标（显示在按钮中心上方）
    if (skillInfo.icon && !isMain) {
      ctx.font = `${r * 0.5}px Arial`
      ctx.fillText(skillInfo.icon, 0, -r * 0.3)
    }
    
    // 冷却时间显示
    if (skillInfo.currentCooldown > 0) {
      const cooldownSec = Math.ceil(skillInfo.currentCooldown / 1000)
      ctx.fillStyle = '#fff'
      ctx.font = `bold ${r * 0.5}px Arial`
      ctx.fillText(`${cooldownSec}`, 0, 1)
    }
  }

  ctx.restore()

  // 在按钮上方绘制技能名称和介绍（仅技能按钮）
  if (skillInfo && !skillInfo.currentCooldown) {
    drawSkillTooltip(ctx, x, y - r - 8, skillInfo)
  }
}

// 绘制技能提示框
function drawSkillTooltip(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  skill: SkillInstance,
): void {
  ctx.save()
  
  // 背景框
  const padding = 8
  const textWidth = Math.max(
    ctx.measureText(skill.name).width,
    ctx.measureText(skill.description).width
  ) + padding * 2
  const textHeight = 45
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
  ctx.beginPath()
  ctx.roundRect(x - textWidth / 2, y - textHeight, textWidth, textHeight, 6)
  ctx.fill()
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 1
  ctx.stroke()
  
  // 技能图标和名称
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 12px Arial'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  
  const iconX = x - textWidth / 2 + padding
  const iconY = y - textHeight + padding
  
  // 图标
  ctx.font = '14px Arial'
  ctx.fillText(skill.icon || '★', iconX, iconY)
  
  // 名称
  ctx.font = 'bold 11px Arial'
  ctx.fillText(skill.name, iconX + 20, iconY + 2)
  
  // 描述
  ctx.font = '10px Arial'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.fillText(skill.description, iconX, iconY + 20)
  
  // MP消耗
  ctx.font = '9px Arial'
  ctx.fillStyle = '#4488FF'
  ctx.fillText(`MP: ${skill.mpCost}`, iconX, iconY + 35)
  
  ctx.restore()
}

// 绘制未解锁技能提示框
function drawLockedSkillTooltip(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
): void {
  ctx.save()
  
  const padding = 8
  const text = '技能未解锁'
  const textWidth = ctx.measureText(text).width + padding * 2
  const textHeight = 30
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
  ctx.beginPath()
  ctx.roundRect(x - textWidth / 2, y - textHeight, textWidth, textHeight, 6)
  ctx.fill()
  
  ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)'
  ctx.lineWidth = 1
  ctx.stroke()
  
  ctx.fillStyle = '#FF6B6B'
  ctx.font = 'bold 11px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🔒 ' + text, x, y - textHeight / 2)
  
  ctx.restore()
}

