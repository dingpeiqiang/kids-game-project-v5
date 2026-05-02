// ============================================
// dragonShooter 绘制系统
// ============================================

import type {
  Dragon, DragonSegment,
  CustomRoute,
  GameState
} from './types'
import type { RouteEditor as RouteEditorType } from './routes'
import {
  COLORS, BASE_W, BASE_H, CANVAS_W, CANVAS_H, CANVAS_OFFSET_X, CANVAS_OFFSET_Y,
  SCENES, DRAGON_CONFIGS, POWERUP_ICONS
} from './constants'
import { lightenColor } from './effects'

/**
 * 创建渲染器实例 - 封装所有绘制函数和 render 主循环
 * 通过闭包共享 ctx、state 等上下文
 */
export function createRenderer(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  routeEditor: RouteEditorType,
  customRoutes: CustomRoute[]
) {

  // ========== 云朵 ==========
  function drawCloud(ctx: CanvasRenderingContext2D, cloud: { x: number; y: number; size: number; opacity: number }) {
    ctx.save()
    ctx.globalAlpha = cloud.opacity
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2)
    ctx.arc(cloud.x + cloud.size * 0.4, cloud.y - cloud.size * 0.1, cloud.size * 0.4, 0, Math.PI * 2)
    ctx.arc(cloud.x + cloud.size * 0.8, cloud.y, cloud.size * 0.45, 0, Math.PI * 2)
    ctx.arc(cloud.x + cloud.size * 0.4, cloud.y + cloud.size * 0.2, cloud.size * 0.35, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // ========== 路线轨迹 ==========
  function drawRouteTrail(dragon: Dragon) {
    const route = dragon.routeFollower['route']
    if (!route || !route.points || route.points.length < 2) return
    
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    
    ctx.beginPath()
    ctx.moveTo(route.points[0].x, route.points[0].y)
    
    for (let i = 1; i < route.points.length; i++) {
      ctx.lineTo(route.points[i].x, route.points[i].y)
    }
    
    ctx.stroke()
    ctx.restore()
  }

  // ========== 龙 ==========
  function drawDragon(dragon: Dragon) {
    if (!dragon.alive) return

    for (let i = dragon.segments.length - 1; i >= 0; i--) {
      const seg = dragon.segments[i]
      drawDragonSegment(seg, seg.hp, seg.maxHp, dragon.type, dragon.slowed)
    }
  }

  function drawDragonSegment(seg: DragonSegment, dragonHp: number, dragonMaxHp: number, type: keyof typeof DRAGON_CONFIGS, isSlowed: boolean) {
    ctx.save()
    ctx.translate(seg.x, seg.y)

    const config = DRAGON_CONFIGS[type]
    const isRetracting = (seg as any)._isRetracting || false

    // 光晕
    ctx.shadowColor = seg.color
    ctx.shadowBlur = type === 'boss' ? 18 : 10

    // 龙身
    if (!seg.isHead) {
      ctx.fillStyle = seg.color
      ctx.beginPath()
      ctx.arc(0, 0, seg.size, 0, Math.PI * 2)
      ctx.fill()

      // 血量数字
      const hpText = Math.round(dragonHp).toString()
      const fontSize = Math.max(10, seg.size * 0.5)
      const hpRatio = dragonMaxHp > 0 ? dragonHp / dragonMaxHp : 1
      const r = Math.round(255 * (1 - hpRatio))
      const g = Math.round(255 * hpRatio)

      ctx.strokeStyle = '#000'
      ctx.lineWidth = 1.5
      ctx.font = `${fontSize}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.strokeText(hpText, 0, 1)
      ctx.fillStyle = `rgb(${r}, ${g}, 50)`
      ctx.fillText(hpText, 0, 1)
    }

    // 龙纹（精英/BOSS有）
    if (seg.hasPattern) {
      ctx.strokeStyle = lightenColor(seg.color, 40)
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, seg.size * 0.65, 0, Math.PI * 2)
      ctx.stroke()
    }

    if (seg.isHead) {
      // 回缩状态闪烁红边框
      if (isRetracting) {
        const flashIntensity = Math.sin(Date.now() * 0.01) * 0.5 + 0.5
        ctx.strokeStyle = `rgba(255, 0, 0, ${flashIntensity})`
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.arc(0, 0, seg.size + 6, 0, Math.PI * 2)
        ctx.stroke()
      }
      
      // 眼睛
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(-seg.size * 0.28, -seg.size * 0.12, seg.size * 0.2, 0, Math.PI * 2)
      ctx.arc(seg.size * 0.28, -seg.size * 0.12, seg.size * 0.2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#222222'
      ctx.beginPath()
      ctx.arc(-seg.size * 0.28, -seg.size * 0.12, seg.size * 0.09, 0, Math.PI * 2)
      ctx.arc(seg.size * 0.28, -seg.size * 0.12, seg.size * 0.09, 0, Math.PI * 2)
      ctx.fill()

      // 龙角
      if (seg.hasHorn) {
        ctx.strokeStyle = lightenColor(seg.color, 50)
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(-seg.size * 0.45, -seg.size * 0.2)
        ctx.lineTo(-seg.size * 0.8, -seg.size * 0.5)
        ctx.moveTo(seg.size * 0.45, -seg.size * 0.2)
        ctx.lineTo(seg.size * 0.8, -seg.size * 0.5)
        ctx.stroke()
      }

      // 龙须
      ctx.strokeStyle = lightenColor(seg.color, 45)
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(-seg.size * 0.4, -seg.size * 0.1)
      ctx.quadraticCurveTo(-seg.size * 0.8, -seg.size * 0.4, -seg.size * 1.0, -seg.size * 0.25)
      ctx.moveTo(seg.size * 0.4, -seg.size * 0.1)
      ctx.quadraticCurveTo(seg.size * 0.8, -seg.size * 0.4, seg.size * 1.0, -seg.size * 0.25)
      ctx.stroke()

      // BOSS显示"王"
      if (type === 'boss') {
        ctx.fillStyle = COLORS.accent
        ctx.font = `bold ${seg.size * 0.65}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('王', 0, 0)
      }

      // 宝箱龙显示"宝"
      if (type === 'treasure') {
        ctx.fillStyle = '#FFD700'
        ctx.font = `bold ${seg.size * 0.6}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('宝', 0, 0)
      }

      // 金币龙显示"$"
      if (type === 'coin') {
        ctx.fillStyle = '#FFD700'
        ctx.font = `bold ${seg.size * 0.7}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('$', 0, 0)
      }
    }

    // 减速效果
    if (isSlowed) {
      ctx.strokeStyle = '#87CEEB'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.arc(0, 0, seg.size + 4, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // 道具图标
    if (seg.attachedPowerUp) {
      const icon = POWERUP_ICONS[seg.attachedPowerUp]
      const pulse = 1 + Math.sin(Date.now() / 150) * 0.15

      ctx.save()
      ctx.translate(0, -seg.size - 12)
      ctx.scale(pulse, pulse)

      ctx.shadowColor = icon.color
      ctx.shadowBlur = 10
      ctx.fillStyle = icon.color
      ctx.beginPath()
      ctx.arc(0, 0, 7, 0, Math.PI * 2)
      ctx.fill()

      ctx.shadowBlur = 0
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(icon.icon, 0, 1)

      ctx.restore()
    }

    ctx.restore()
  }

  // ========== 玩家 ==========
  function drawPlayer() {
    ctx.save()
    ctx.translate(state.playerX, BASE_H - 55)

    // 无敌状态护盾特效
    if (state.invincibleTimer > 0) {
      const shieldPulse = 1 + Math.sin(Date.now() / 100) * 0.1
      const shieldRotation = Date.now() / 500

      ctx.save()
      ctx.rotate(shieldRotation)

      ctx.strokeStyle = 'rgba(79, 195, 247, 0.6)'
      ctx.lineWidth = 3
      ctx.shadowColor = '#4FC3F7'
      ctx.shadowBlur = 20
      ctx.beginPath()
      ctx.arc(0, 0, 35 * shieldPulse, 0, Math.PI * 2)
      ctx.stroke()

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.lineWidth = 2
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.arc(0, 0, 28 * shieldPulse, 0, Math.PI * 2)
      ctx.stroke()

      ctx.restore()

      for (let i = 0; i < 8; i++) {
        const angle = (Date.now() / 300) + (i * Math.PI / 4)
        const px = Math.cos(angle) * 32 * shieldPulse
        const py = Math.sin(angle) * 32 * shieldPulse

        ctx.fillStyle = '#4FC3F7'
        ctx.shadowColor = '#4FC3F7'
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(px, py, 3, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    }

    ctx.shadowBlur = 0

    // 国风小侠客身体
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 20)
    grad.addColorStop(0, COLORS.gold)
    grad.addColorStop(1, '#CD853F')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(0, 0, 20, 0, Math.PI * 2)
    ctx.fill()

    // 斗笠
    ctx.fillStyle = '#8B4513'
    ctx.beginPath()
    ctx.moveTo(-26, -4)
    ctx.lineTo(0, -28)
    ctx.lineTo(26, -4)
    ctx.closePath()
    ctx.fill()

    // 帽带
    ctx.strokeStyle = '#654321'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-18, -8)
    ctx.lineTo(18, -8)
    ctx.stroke()

    // 眼睛
    ctx.fillStyle = '#333333'
    ctx.beginPath()
    ctx.arc(-6, -2, 3, 0, Math.PI * 2)
    ctx.arc(6, -2, 3, 0, Math.PI * 2)
    ctx.fill()

    // 微笑
    ctx.strokeStyle = '#333333'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(0, 4, 6, 0.1 * Math.PI, 0.9 * Math.PI)
    ctx.stroke()

    ctx.restore()

    // 准星（玩家头顶）
    ctx.save()
    ctx.translate(state.playerX, BASE_H - 100)

    const aimPulse = 1 + Math.sin(Date.now() / 150) * 0.15
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)'
    ctx.lineWidth = 2
    ctx.shadowColor = COLORS.gold
    ctx.shadowBlur = 8

    ctx.beginPath()
    ctx.arc(0, 0, 6 * aimPulse, 0, Math.PI * 2)
    ctx.stroke()

    const crossSize = 10 * aimPulse
    ctx.beginPath()
    ctx.moveTo(0, -crossSize)
    ctx.lineTo(0, -crossSize + 5)
    ctx.moveTo(0, crossSize)
    ctx.lineTo(0, crossSize - 5)
    ctx.moveTo(-crossSize, 0)
    ctx.lineTo(-crossSize + 5, 0)
    ctx.moveTo(crossSize, 0)
    ctx.lineTo(crossSize - 5, 0)
    ctx.stroke()

    ctx.restore()
  }

  // ========== 子弹 ==========
  function drawBullets() {
    for (const b of state.bullets) {
      ctx.save()
      ctx.translate(b.x, b.y)

      ctx.shadowColor = COLORS.gold
      ctx.shadowBlur = 15
      ctx.fillStyle = COLORS.gold
      ctx.beginPath()
      ctx.arc(0, 0, 8, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(-2, -2, 3, 0, Math.PI * 2)
      ctx.fill()

      // 尾迹
      const trail = ctx.createLinearGradient(0, 0, 0, 26)
      trail.addColorStop(0, 'rgba(255, 215, 0, 0.85)')
      trail.addColorStop(1, 'transparent')
      ctx.fillStyle = trail
      ctx.fillRect(-4, 0, 8, 26)

      ctx.restore()
    }
  }

  // ========== 粒子 ==========
  function drawParticles() {
    for (const p of state.particles) {
      ctx.save()
      ctx.globalAlpha = p.life / p.maxLife
      ctx.fillStyle = p.color
      ctx.shadowColor = p.color
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  // ========== 道具 ==========
  function drawPowerUps() {
    for (const p of state.powerUps) {
      ctx.save()
      const bob = Math.sin(p.bobPhase) * 4
      ctx.translate(p.x, p.y + bob)

      const pulse = 1 + Math.sin(Date.now() / 150) * 0.15
      ctx.scale(pulse, pulse)

      const icon = POWERUP_ICONS[p.type]

      // 外层光晕
      ctx.shadowColor = icon.color
      ctx.shadowBlur = 25
      ctx.fillStyle = 'rgba(255, 215, 0, 0.4)'
      ctx.beginPath()
      ctx.arc(0, 0, 18, 0, Math.PI * 2)
      ctx.fill()

      // 白色边框
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.arc(0, 0, 14, 0, Math.PI * 2)
      ctx.stroke()

      // 深色背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.beginPath()
      ctx.arc(0, 0, 12, 0, Math.PI * 2)
      ctx.fill()

      // 图标
      ctx.shadowBlur = 0
      ctx.font = 'bold 20px sans-serif'
      ctx.fillStyle = '#FFFFFF'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(icon.icon, 0, 1)

      ctx.restore()
    }
  }

  // ========== 金币掉落 ==========
  function drawCoinDrops() {
    ctx.fillStyle = '#FFD700'
    ctx.strokeStyle = '#DAA520'
    ctx.lineWidth = 1.5
    for (const c of state.coinDrops) {
      ctx.save()
      ctx.translate(c.x, c.y)
      ctx.beginPath()
      ctx.arc(0, 0, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#DAA520'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('$', 0, 1)
      ctx.restore()
    }
  }

  // ========== 浮动文字 ==========
  function drawFloatTexts() {
    for (const ft of state.floatTexts) {
      ctx.save()
      ctx.globalAlpha = ft.life
      ctx.fillStyle = ft.color
      ctx.shadowColor = ft.color
      ctx.shadowBlur = 8
      ctx.font = `bold ${ft.size}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(ft.text, ft.x, ft.y)
      ctx.restore()
    }
  }

  // ========== HUD ==========
  function drawHUD() {
    const scene = SCENES[state.currentScene]

    ctx.textAlign = 'left'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillStyle = '#FFFFFF'
    ctx.shadowColor = 'rgba(0,0,0,0.8)'
    ctx.shadowBlur = 4
    ctx.fillText(`${scene.name} ${state.level}关`, 12, 24)

    ctx.textAlign = 'right'
    for (let i = 0; i < state.playerMaxHP; i++) {
      ctx.fillStyle = i < state.playerHP ? '#FF6B6B' : '#555'
      ctx.beginPath()
      ctx.arc(BASE_W - 14 - i * 20, 20, 7, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.font = 'bold 13px sans-serif'
    ctx.fillStyle = '#FFE066'
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 3
    ctx.fillText(`${state.score}`, BASE_W - 12, 42)

    ctx.fillStyle = '#888'
    ctx.font = '14px sans-serif'
    ctx.fillText(state.isPaused ? '>' : '||', BASE_W - 14, 60)

    ctx.textAlign = 'left'
    ctx.font = '12px sans-serif'
    ctx.fillStyle = '#ccc'
    if (state.mode === 'challenge') {
      const m = Math.floor(state.timeLeft / 60)
      const s = Math.floor(state.timeLeft % 60)
      ctx.fillText(`${m}:${s.toString().padStart(2,'0')}`, 12, BASE_H - 10)
    } else {
      ctx.fillText('无尽', 12, BASE_H - 10)
    }

    if (state.coins > 0) {
      ctx.textAlign = 'right'
      ctx.fillStyle = '#FFD700'
      ctx.fillText(`${state.coins}`, BASE_W - 12, BASE_H - 10)
    }

    ctx.shadowBlur = 0
  }

  // ========== 开始界面 ==========
  function drawStartScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, BASE_H / 2 - 180, BASE_W, 360)

    ctx.fillStyle = COLORS.gold
    ctx.shadowColor = COLORS.gold
    ctx.shadowBlur = 20
    ctx.font = 'bold 30px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🐉 打龙小游戏', BASE_W / 2, BASE_H / 2 - 100)

    ctx.shadowBlur = 0
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '14px sans-serif'
    ctx.fillText('国风卡通·休闲割草', BASE_W / 2, BASE_H / 2 - 70)
    ctx.fillText('滑动控制·自动射击', BASE_W / 2, BASE_H / 2 - 50)
    ctx.fillText('龙体分裂·越打越爽', BASE_W / 2, BASE_H / 2 - 30)

    ctx.fillStyle = COLORS.accent
    ctx.font = 'bold 16px sans-serif'
    ctx.fillText('🎮 开始闯关', BASE_W / 2 - 75, BASE_H / 2 + 10)

    ctx.fillStyle = COLORS.jade
    ctx.fillText('💫 无尽挑战', BASE_W / 2 + 75, BASE_H / 2 + 10)

    ctx.fillStyle = '#9370DB'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText('✏️ 绘制路线', BASE_W / 2, BASE_H / 2 + 50)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.font = '12px sans-serif'
    ctx.fillText('点击对应按钮', BASE_W / 2, BASE_H / 2 + 80)
  }

  // ========== 路线编辑界面 ==========
  function drawRouteEditor() {
    ctx.fillStyle = 'rgba(20, 20, 40, 0.95)'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    ctx.save()
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 4])
    ctx.strokeRect(CANVAS_OFFSET_X, CANVAS_OFFSET_Y, BASE_W, BASE_H)
    ctx.restore()

    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('✏️ 绘制龙的路线', CANVAS_OFFSET_X + BASE_W / 2, CANVAS_OFFSET_Y + 60)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.font = '13px sans-serif'
    ctx.fillText('在下方区域按下并拖动鼠标绘制', CANVAS_OFFSET_X + BASE_W / 2, CANVAS_OFFSET_Y + 90)
    ctx.fillText('保存后路线会保留，可继续编辑', CANVAS_OFFSET_X + BASE_W / 2, CANVAS_OFFSET_Y + 110)

    if (routeEditor.getCurrentPoints().length > 0) {
      routeEditor.drawCurrentRoute()
    }

    // 按钮区域
    const btnY = CANVAS_H - 80
    const btnH = 50
    const btnW = 85
    const btnGap = 5
    const btnStartX = (CANVAS_W - (btnW * 4 + btnGap * 3)) / 2

    ctx.fillStyle = '#FF6B6B'
    ctx.fillRect(btnStartX, btnY, btnW, btnH)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 13px sans-serif'
    ctx.fillText('🗑️ 清除', btnStartX + btnW / 2, btnY + 32)

    ctx.fillStyle = '#4CAF50'
    ctx.fillRect(btnStartX + btnW + btnGap, btnY, btnW, btnH)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('💾 保存', btnStartX + btnW + btnGap + btnW / 2, btnY + 32)

    ctx.fillStyle = '#2196F3'
    ctx.fillRect(btnStartX + (btnW + btnGap) * 2, btnY, btnW, btnH)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('📥 导出', btnStartX + (btnW + btnGap) * 2 + btnW / 2, btnY + 32)

    ctx.fillStyle = COLORS.accent
    ctx.fillRect(btnStartX + (btnW + btnGap) * 3, btnY, btnW, btnH)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('⬅️ 返回', btnStartX + (btnW + btnGap) * 3 + btnW / 2, btnY + 32)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.font = '11px sans-serif'
    ctx.fillText('可在边框外绘制路线', CANVAS_W / 2, btnY + btnH + 15)
    
    drawFloatTexts()
  }

  // ========== 暂停遮罩 ==========
  function drawPauseOverlay() {
    if (!state.isPaused) return

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.fillRect(0, 0, BASE_W, BASE_H)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('⏸️ 已暂停', BASE_W / 2, BASE_H / 2 - 20)

    ctx.font = '16px sans-serif'
    ctx.fillText('点击继续', BASE_W / 2, BASE_H / 2 + 20)
  }

  // ========== 游戏结束 ==========
  function drawGameOver(victory: boolean) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(0, 0, BASE_W, BASE_H)

    ctx.fillStyle = victory ? '#90EE90' : COLORS.accent
    ctx.font = 'bold 30px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(victory ? '🎉 通关!' : '💀 失败', BASE_W / 2, BASE_H / 2 - 80)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = '16px sans-serif'
    ctx.fillText(`最高连击: ${state.maxCombo}`, BASE_W / 2, BASE_H / 2 - 45)
    ctx.fillText(`总击杀: ${state.totalKills}`, BASE_W / 2, BASE_H / 2 - 22)
    ctx.fillText(`到达关卡: ${state.level}`, BASE_W / 2, BASE_H / 2 + 1)
    ctx.fillText(`金币: ${state.coins}`, BASE_W / 2, BASE_H / 2 + 24)
    ctx.fillStyle = COLORS.gold
    ctx.fillText(`得分: ${state.score}`, BASE_W / 2, BASE_H / 2 + 52)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '14px sans-serif'
    ctx.fillText('正在返回...', BASE_W / 2, BASE_H / 2 + 85)
  }

  // ========== 主渲染函数 ==========
  function render() {
    // 清除画布
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    // 路线编辑模式
    if (state.phase === 'routeEdit') {
      drawRouteEditor()
      return
    }

    // 游戏模式：居中+裁剪
    ctx.save()
    ctx.translate(CANVAS_OFFSET_X, CANVAS_OFFSET_Y)

    ctx.beginPath()
    ctx.rect(0, 0, BASE_W, BASE_H)
    ctx.clip()

    const scene = SCENES[state.currentScene]

    // 背景
    const grad = ctx.createLinearGradient(0, 0, 0, BASE_H)
    grad.addColorStop(0, scene.bg[0])
    grad.addColorStop(0.5, scene.bg[1])
    grad.addColorStop(1, scene.bg[2])
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, BASE_W, BASE_H)

    // 云朵和尘埃
    for (const cloud of state.clouds) {
      drawCloud(ctx, cloud)
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    for (const dust of state.dusts) {
      ctx.beginPath()
      ctx.arc(dust.x, dust.y, dust.size, 0, Math.PI * 2)
      ctx.fill()
    }

    if (state.phase === 'start') {
      drawStartScreen()
    } else {
      // 路线轨迹
      if (state.dragons.length > 0) {
        drawRouteTrail(state.dragons[0])
      }
      
      for (const dragon of state.dragons) {
        drawDragon(dragon)
      }
      drawBullets()
      drawPlayer()
      drawParticles()
      drawPowerUps()
      drawCoinDrops()
      drawFloatTexts()
      drawHUD()

      if (state.isPaused) {
        drawPauseOverlay()
      }

      if (state.phase === 'gameOver') {
        drawGameOver(false)
      }
    }

    ctx.restore()
  }

  return { render }
}
