// RPG塔防射击 - 渲染模块
// 负责所有UI和游戏对象的绘制

import type { GameState } from './types'
import { CANVAS_WIDTH, CANVAS_HEIGHT, SCALE_RATIO } from './config'
import { drawTurret } from './turrets'
import { drawEnemy } from './enemies'
import { drawPlayer, drawProjectiles } from './combat'
import { drawTrap } from './traps'
import { drawEnemyBullets } from './enemyBullets'

/**
 * 辅助函数：绘制圆角矩形
 */
function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

/**
 * 辅助函数：绘制面板
 */
function drawPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string = 'rgba(15, 25, 45, 0.85)') {
  ctx.save()
  ctx.fillStyle = color
  drawRoundedRect(ctx, x, y, w, h, 8)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.restore()
}

/**
 * 辅助函数：绘制血条
 */
function drawHPBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, current: number, max: number) {
  const ratio = Math.max(0, current / max)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  drawRoundedRect(ctx, x, y, w, h, h / 2)
  ctx.fill()
  const hpColor = ratio > 0.5 ? '#4ADE80' : ratio > 0.25 ? '#FBBF24' : '#EF4444'
  ctx.fillStyle = hpColor
  drawRoundedRect(ctx, x, y, w * ratio, h, h / 2)
  ctx.fill()
  if (ratio > 0) {
    ctx.save()
    ctx.shadowColor = hpColor
    ctx.shadowBlur = 6
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    drawRoundedRect(ctx, x, y, w * ratio, h / 2, h / 2)
    ctx.fill()
    ctx.restore()
  }
}

/**
 * 绘制资源面板（左上）
 */
function drawResourcePanel(ctx: CanvasRenderingContext2D, state: GameState) {
  const TOP_Y = 12
  const resPanelW = 120
  drawPanel(ctx, 12, TOP_Y, resPanelW, 75)
  
  // 图标行
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#E0F2FE'
  ctx.fillText('💎', 22, TOP_Y + 22)
  ctx.fillText(`${state.resources.crystals}`, 40, TOP_Y + 22)
  
  ctx.fillStyle = '#FDE68A'
  ctx.fillText('⚡', 22 + 65, TOP_Y + 22)
  ctx.fillText(`${state.resources.energy}`, 40 + 65, TOP_Y + 22)
  
  // 第二行
  ctx.fillStyle = '#F472B6'
  ctx.fillText('🔪', 22, TOP_Y + 42)
  ctx.fillText(`${state.resources.kills}`, 40, TOP_Y + 42)
  
  ctx.fillStyle = '#A78BFA'
  ctx.fillText('🏆', 22 + 65, TOP_Y + 42)
  ctx.fillText(`${state.resources.score}`, 40 + 65, TOP_Y + 42)
  
  // 第三行：EXP进度
  ctx.fillStyle = '#9CA3AF'
  ctx.font = '9px sans-serif'
  ctx.fillText(`经验 ${state.player.exp}/${state.player.expToLevel}`, 22, TOP_Y + 62)
}

/**
 * 绘制波次信息面板（中上）
 */
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
    ctx.fillStyle = '#4ADE80'
    ctx.fillText(`⚔ ${Math.ceil(state.timeLeft)}s`, CANVAS_WIDTH / 2, TOP_Y + 44)
  } else {
    ctx.fillText('等待中...', CANVAS_WIDTH / 2, TOP_Y + 44)
  }
}

/**
 * 绘制玩家状态面板（右上）
 */
function drawPlayerPanel(ctx: CanvasRenderingContext2D, state: GameState) {
  const TOP_Y = 12
  const PADDING = 12
  const playerPanelW = 130
  const playerPanelX = CANVAS_WIDTH - playerPanelW - 12
  drawPanel(ctx, playerPanelX, TOP_Y, playerPanelW, 75)
  
  // 玩家标识
  ctx.fillStyle = '#F472B6'
  ctx.font = 'bold 11px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('⚔️ 玩家', playerPanelX + PADDING, TOP_Y + 18)
  
  // HP条
  drawHPBar(ctx, playerPanelX + PADDING, TOP_Y + 24, playerPanelW - PADDING * 2, 10, state.player.hp, state.player.maxHp)
  ctx.fillStyle = '#E0F2FE'
  ctx.font = '9px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(`${state.player.hp}/${state.player.maxHp}`, playerPanelX + playerPanelW - PADDING, TOP_Y + 33)
  
  // 等级 + 攻击力
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

/**
 * 绘制连击显示（右侧）
 */
function drawCombo(ctx: CanvasRenderingContext2D, state: GameState) {
  if (state.combo.count > 1) {
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
    
    // 计时条
    const barW = 60
    const timerRatio = state.combo.timer / 2.0
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
    drawRoundedRect(ctx, CANVAS_WIDTH - 15 - barW, 85, barW, 3, 2)
    ctx.fill()
    ctx.fillStyle = comboColor
    drawRoundedRect(ctx, CANVAS_WIDTH - 15 - barW, 85, barW * timerRatio, 3, 2)
    ctx.fill()
    ctx.restore()
  }
}

/**
 * 绘制升级弹窗
 */
export function drawUpgradeDialog(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  selectedTurretForUpgrade: any,
  upgradeDialogPos: { x: number; y: number },
  mobileButtonsRef: { current: any }
) {
  if (!selectedTurretForUpgrade) return
  
  const turret = selectedTurretForUpgrade
  const config = (window as any).TURRET_CONFIGS[turret.type]
  if (!config) return
  
  const nextUpgrade = config.upgradePath.find((u: any) => u.level === turret.level + 1)
  
  // 计算弹窗位置
  const dialogW = 160
  const dialogH = nextUpgrade ? 75 : 50
  let dialogX = upgradeDialogPos.x - dialogW / 2
  let dialogY = upgradeDialogPos.y
  
  // 边界检查
  if (dialogX < 10) dialogX = 10
  if (dialogX + dialogW > CANVAS_WIDTH - 10) dialogX = CANVAS_WIDTH - dialogW - 10
  if (dialogY < 10) dialogY = 10
  if (dialogY + dialogH > CANVAS_HEIGHT - 10) dialogY = CANVAS_HEIGHT - dialogH - 10
  
  upgradeDialogPos.x = dialogX + dialogW / 2
  upgradeDialogPos.y = dialogY
  
  // 弹窗背景
  ctx.fillStyle = 'rgba(15, 25, 45, 0.98)'
  drawRoundedRect(ctx, dialogX, dialogY, dialogW, dialogH, 8)
  ctx.fill()
  ctx.strokeStyle = '#4ECDC4'
  ctx.lineWidth = 2
  ctx.stroke()
  
  // 炮台信息
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 11px sans-serif'
  ctx.textAlign = 'center'
  const typeNames: Record<string, string> = { laser: '激光', missile: '导弹', frost: '冰冻', lightning: '闪电' }
  ctx.fillText(`${typeNames[turret.type]} Lv.${turret.level}`, dialogX + dialogW / 2, dialogY + 18)
  
  if (nextUpgrade) {
    // 升级信息
    ctx.fillStyle = '#FBBF24'
    ctx.font = '10px sans-serif'
    ctx.fillText(`💎 ${nextUpgrade.cost}`, dialogX + dialogW / 2, dialogY + 35)
    
    // 升级按钮
    const btnW = 60
    const btnH = 24
    const btnX = dialogX + 12
    const btnY = dialogY + 45
    
    const canAfford = state.resources.crystals >= nextUpgrade.cost
    ctx.fillStyle = canAfford ? '#4ECDC4' : '#6B7280'
    drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 5)
    ctx.fill()
    
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 10px sans-serif'
    ctx.fillText('⬆️升级', btnX + btnW / 2, btnY + 16)
    
    // 出售按钮
    const sellBtnX = dialogX + dialogW - 72
    const sellValue = Math.floor(config.cost * 0.5)
    ctx.fillStyle = '#EF4444'
    drawRoundedRect(ctx, sellBtnX, btnY, btnW, btnH, 5)
    ctx.fill()
    
    ctx.fillStyle = '#fff'
    ctx.fillText('💰出售', sellBtnX + btnW / 2, btnY + 16)
    
    // 保存按钮区域
    if (!mobileButtonsRef.current) mobileButtonsRef.current = { turretButtons: [], buildButton: null }
    mobileButtonsRef.current.upgradeButton = { x: btnX, y: btnY, w: btnW, h: btnH, turret, type: 'upgrade' }
    mobileButtonsRef.current.sellButton = { x: sellBtnX, y: btnY, w: btnW, h: btnH, turret, type: 'sell', value: sellValue }
  } else {
    // 已满级提示
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('⭐ 已满级', dialogX + dialogW / 2, dialogY + 30)
    
    // 只显示出售按钮
    const btnW = 60
    const btnH = 24
    const btnX = dialogX + (dialogW - btnW) / 2
    const btnY = dialogY + 36
    const sellValue = Math.floor(config.cost * 0.5)
    
    ctx.fillStyle = '#EF4444'
    drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 5)
    ctx.fill()
    
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 10px sans-serif'
    ctx.fillText('💰出售', btnX + btnW / 2, btnY + 16)
    
    if (!mobileButtonsRef.current) mobileButtonsRef.current = { turretButtons: [], buildButton: null }
    mobileButtonsRef.current.sellButton = { x: btnX, y: btnY, w: btnW, h: btnH, turret, type: 'sell', value: sellValue }
  }
}

/**
 * 绘制底部炮台选择按钮
 */
export function drawTurretButtons(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  mobileButtonsRef: { current: any },
  isMobile: boolean
) {
  const turretTypes = ['laser', 'missile', 'frost', 'lightning']
  const turretIcons: Record<string, string> = { 
    laser: '🔵',
    missile: '🚀',
    frost: '❄️',
    lightning: '⚡'
  }
  const turretNames: Record<string, string> = { laser: '激光', missile: '导弹', frost: '冰冻', lightning: '闪电' }
  const turretColors: Record<string, string> = {
    laser: '#00D9FF',
    missile: '#FF6B6B',
    frost: '#7FDBFF',
    lightning: '#FFD700'
  }
  const btnW = 58, btnH = 38, btnGap = 6
  
  if (isMobile) {
    // 手机端：底部炮台选择面板
    const btnPanelW = 340
    const btnPanelH = 55
    const btnPanelX = (CANVAS_WIDTH - btnPanelW) / 2
    const btnPanelY = CANVAS_HEIGHT - btnPanelH - 40
    
    drawPanel(ctx, btnPanelX, btnPanelY, btnPanelW, btnPanelH, 'rgba(10, 20, 35, 0.92)')
    
    const startX = btnPanelX + 8
    const btnY = btnPanelY + (btnPanelH - btnH) / 2
    
    turretTypes.forEach((type, i) => {
      const bx = startX + i * (btnW + btnGap)
      const isSelected = state.buildMode.selectedTurret === type
      
      const baseColor = turretColors[type]
      ctx.fillStyle = isSelected ? `${baseColor}CC` : 'rgba(255, 255, 255, 0.08)'
      ctx.beginPath()
      ctx.roundRect(bx, btnY, btnW, btnH, 8)
      ctx.fill()
      
      ctx.strokeStyle = isSelected ? baseColor : 'rgba(255,255,255,0.2)'
      ctx.lineWidth = isSelected ? 3 : 1
      ctx.stroke()
      
      ctx.fillStyle = isSelected ? '#fff' : baseColor
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(turretIcons[type], bx + btnW / 2, btnY + 15)
      
      ctx.fillStyle = isSelected ? '#fff' : '#9CA3AF'
      ctx.font = '8px sans-serif'
      ctx.fillText(turretNames[type], bx + btnW / 2, btnY + 28)
      
      const costs: Record<string, number> = { laser: 40, missile: 80, frost: 50, lightning: 120 }
      ctx.fillStyle = isSelected ? '#fff' : '#FBBF24'
      ctx.font = 'bold 7px sans-serif'
      ctx.fillText(`💎${costs[type]}`, bx + btnW / 2, btnY + 38)
    })
    
    // 保存按钮区域
    mobileButtonsRef.current = {
      turretButtons: turretTypes.map((type, i) => ({
        type,
        x: startX + i * (btnW + btnGap),
        y: btnY,
        w: btnW,
        h: btnH
      })),
      buildButton: null
    }
  } else {
    // PC端面板
    const pcPanelW = 280
    const pcPanelX = (CANVAS_WIDTH - pcPanelW) / 2
    const pcPanelY = CANVAS_HEIGHT - 50
    
    drawPanel(ctx, pcPanelX, pcPanelY, pcPanelW, btnH + 16, 'rgba(15, 25, 45, 0.85)')
    
    turretTypes.forEach((type, i) => {
      const bx = pcPanelX + btnGap + i * (btnW + btnGap)
      const selected = state.buildMode.selectedTurret === type
      
      const baseColor = turretColors[type]
      ctx.fillStyle = selected ? `${baseColor}CC` : 'rgba(255,255,255,0.1)'
      drawRoundedRect(ctx, bx, pcPanelY + 8, btnW, btnH, 6)
      ctx.fill()
      if (selected) {
        ctx.strokeStyle = baseColor
        ctx.lineWidth = 3
        ctx.stroke()
      }
      
      ctx.fillStyle = selected ? '#fff' : baseColor
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(turretIcons[type], bx + btnW / 2, pcPanelY + 22)
      
      ctx.fillStyle = selected ? '#fff' : '#9CA3AF'
      ctx.font = '8px sans-serif'
      ctx.fillText(turretNames[type], bx + btnW / 2, pcPanelY + 36)
      
      const costs: Record<string, number> = { laser: 40, missile: 80, frost: 50, lightning: 120 }
      ctx.fillStyle = selected ? '#fff' : '#FBBF24'
      ctx.font = 'bold 7px sans-serif'
      ctx.fillText(`💎${costs[type]}`, bx + btnW / 2, pcPanelY + 48)
    })
    
    mobileButtonsRef.current = {
      turretButtons: turretTypes.map((type, i) => {
        const bx = pcPanelX + btnGap + i * (btnW + btnGap)
        return {
          type,
          x: bx,
          y: pcPanelY + 8,
          w: btnW,
          h: btnH
        }
      }),
      buildButton: null
    }
  }
}

/**
 * 绘制浮动文字
 */
function drawFloatTexts(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const ft of state.floatTexts) {
    ctx.save()
    ctx.globalAlpha = Math.min(1, ft.life)
    ctx.fillStyle = ft.color
    ctx.font = `bold ${ft.size || 14}px sans-serif`
    ctx.textAlign = 'center'
    ctx.shadowColor = ft.color
    ctx.shadowBlur = 8
    ctx.fillText(ft.text, ft.x, ft.y)
    ctx.restore()
  }
}

/**
 * 主渲染函数
 */
export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  selectedTurretForUpgrade: any,
  upgradeDialogPos: { x: number; y: number },
  mobileButtonsRef: { current: any },
  joystick: any
) {
  // 清空画布
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  
  // 绘制网格背景
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
  ctx.lineWidth = 1
  for (let x = 0; x < CANVAS_WIDTH; x += 40) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, CANVAS_HEIGHT)
    ctx.stroke()
  }
  for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(CANVAS_WIDTH, y)
    ctx.stroke()
  }
  
  // 绘制游戏对象
  if (state.gameStarted && !state.gameEnded) {
    // 绘制陷阱
    for (const trap of state.traps) {
      drawTrap(ctx, trap)
    }
    
    // 绘制敌人
    for (const enemy of state.enemies) {
      drawEnemy(ctx, enemy)
    }
    
    // 绘制敌人子弹
    drawEnemyBullets(ctx, state)
    
    // 绘制炮台
    for (const turret of state.turrets) {
      const isSelected = selectedTurretForUpgrade === turret
      drawTurret(ctx, turret, isSelected)
    }
    
    // 绘制玩家
    drawPlayer(ctx, state)
    
    // 绘制玩家子弹
    drawProjectiles(ctx, state)
    
    // 绘制虚拟摇杆
    if (joystick.active) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(joystick.startX, joystick.startY, joystick.radius, 0, Math.PI * 2)
      ctx.stroke()
      
      ctx.fillStyle = 'rgba(78, 205, 196, 0.6)'
      ctx.beginPath()
      ctx.arc(joystick.currentX, joystick.currentY, joystick.knobRadius, 0, Math.PI * 2)
      ctx.fill()
    }
    
    // 绘制UI
    drawResourcePanel(ctx, state)
    drawWavePanel(ctx, state)
    drawPlayerPanel(ctx, state)
    drawCombo(ctx, state)
    drawFloatTexts(ctx, state)
    
    // 绘制升级弹窗
    if (selectedTurretForUpgrade) {
      drawUpgradeDialog(ctx, state, selectedTurretForUpgrade, upgradeDialogPos, mobileButtonsRef)
    }
    
    // 绘制底部按钮
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window)
    drawTurretButtons(ctx, state, mobileButtonsRef, isMobile)
  }
  
  // 绘制开始界面
  if (!state.gameStarted) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🏰 RPG塔防射击', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60)
    
    ctx.font = '16px sans-serif'
    ctx.fillText('建造炮台防御敌人，同时控制角色射击！', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20)
    
    ctx.fillStyle = '#00E676'
    ctx.font = 'bold 18px sans-serif'
    ctx.fillText('点击屏幕开始游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
  }
  
  // 绘制结束界面
  if (state.gameEnded) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 32px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('游戏结束', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)
    
    ctx.font = '18px sans-serif'
    ctx.fillText(`到达波次: ${state.wave}/8`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    ctx.fillText(`最终得分: ${state.resources.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
  }
}
