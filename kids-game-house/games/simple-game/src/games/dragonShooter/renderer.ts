// ============================================
// dragonShooter 绘制系统
// ============================================

import type {
  Dragon, DragonSegment,
  GameState
} from './types'
import type { RouteEditor as RouteEditorType } from './routes'
import {
  COLORS, BASE_W, BASE_H, CANVAS_W, CANVAS_H, CANVAS_OFFSET_X, CANVAS_OFFSET_Y,
  SCENES, DRAGON_CONFIGS, POWERUP_ICONS, POWERUP_SEGMENT_COLORS
} from './constants'
import { lightenColor } from './effects'

/**
 * 创建渲染器实例 - 封装所有绘制函数和 render 主循环
 * 通过闭包共享 ctx、state 等上下文
 */
export function createRenderer(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  routeEditor: RouteEditorType
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

    // 路线颜色和龙的颜色一致（shiftHue 后的），透明度降低
    const headColor = dragon.segments[0]?.color || '#FFD700'
    ctx.save()
    ctx.strokeStyle = headColor + '4D'  // 4D ≈ 30% opacity
    ctx.lineWidth = 2.5
    ctx.setLineDash([5, 5])
    ctx.shadowColor = headColor
    ctx.shadowBlur = 6

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

    // dragon.segments 是游戏坐标，和子弹/道具一样
    // 主渲染循环（1001行）已有 ctx.translate(CANVAS_OFFSET_X, CANVAS_OFFSET_Y)
    for (let i = dragon.segments.length - 1; i >= 0; i--) {
      const seg = dragon.segments[i]
      drawDragonSegment(seg, seg.hp, seg.maxHp, dragon.type, dragon.slowed, dragon._isBoosting)
    }
  }

  function drawDragonSegment(seg: DragonSegment, dragonHp: number, dragonMaxHp: number, type: keyof typeof DRAGON_CONFIGS, isSlowed: boolean, isBoosting: boolean) {
    ctx.save()
    ctx.translate(seg.x, seg.y)

    const config = DRAGON_CONFIGS[type]
    const isRetracting = (seg as any)._isRetracting || false
    const hpRatio = dragonMaxHp > 0 ? dragonHp / dragonMaxHp : 1
    const t = Date.now()

    // --- 基础描边 + 光晕 ---
    ctx.shadowColor = seg.color
    ctx.shadowBlur = type === 'boss' ? 22 : 12

    // --- 身体节段（非龙头） ---
    if (!seg.isHead) {
      // 受伤闪烁：血量低时白色闪烁
      const damagedFlash = hpRatio < 0.3 ? (Math.sin(t * 0.008) * 0.5 + 0.5) * 0.6 : 0

      // 径向渐变（3D 球形感）
      const grad = ctx.createRadialGradient(
        -seg.size * 0.25, -seg.size * 0.25, seg.size * 0.05,
        0, 0, seg.size
      )
      if (damagedFlash > 0) {
        grad.addColorStop(0, '#FFFFFF')
        grad.addColorStop(0.5, lightenColor(seg.color, 30))
        grad.addColorStop(1, lightenColor(seg.color, -20))
      } else {
        grad.addColorStop(0, lightenColor(seg.color, 50))
        grad.addColorStop(0.45, seg.color)
        grad.addColorStop(1, lightenColor(seg.color, -30))
      }
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(0, 0, seg.size, 0, Math.PI * 2)
      ctx.fill()

      // 高光叠加层（左上白色椭圆）
      ctx.save()
      ctx.globalAlpha = 0.45
      const hlGrad = ctx.createRadialGradient(
        -seg.size * 0.3, -seg.size * 0.3, 0,
        -seg.size * 0.2, -seg.size * 0.2, seg.size * 0.55
      )
      hlGrad.addColorStop(0, 'rgba(255,255,255,0.9)')
      hlGrad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = hlGrad
      ctx.beginPath()
      ctx.arc(0, 0, seg.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // 道具节段专属光环（不断脉冲）
      if (seg.attachedPowerUp) {
        const pulseRing = 1 + Math.sin(t / 200) * 0.12
        const glowCfg = POWERUP_SEGMENT_COLORS[seg.attachedPowerUp] as unknown as { glowColor: string } | undefined
        ctx.save()
        ctx.strokeStyle = glowCfg?.glowColor ?? '#FFFFFF'
        ctx.lineWidth = 2.5
        ctx.globalAlpha = 0.5 + Math.sin(t / 200) * 0.3
        ctx.shadowColor = glowCfg?.glowColor ?? '#FFFFFF'
        ctx.shadowBlur = 12
        ctx.beginPath()
        ctx.arc(0, 0, (seg.size + 5) * pulseRing, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }

      // 龙纹（精英/BOSS 有鳞片环）
      if (seg.hasPattern && !seg.attachedPowerUp) {
        ctx.strokeStyle = `rgba(255,255,255,0.25)`
        ctx.lineWidth = 1.5
        for (let r = 0.4; r < 0.95; r += 0.2) {
          ctx.beginPath()
          ctx.arc(0, 0, seg.size * r, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      // 减速冰霜效果
      if (isSlowed) {
        ctx.strokeStyle = 'rgba(135, 206, 235, 0.7)'
        ctx.lineWidth = 2
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.arc(0, 0, seg.size + 4, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
      }

      // 加速火焰拖尾特效
      if (isBoosting) {
        const boostPulse = Math.sin(t * 0.015) * 0.3 + 0.7
        const boostGrad = ctx.createRadialGradient(0, 0, seg.size * 0.5, 0, 0, seg.size * 2)
        boostGrad.addColorStop(0, `rgba(255, 100, 0, ${boostPulse * 0.6})`)
        boostGrad.addColorStop(0.5, `rgba(255, 50, 0, ${boostPulse * 0.3})`)
        boostGrad.addColorStop(1, 'rgba(255, 0, 0, 0)')
        ctx.fillStyle = boostGrad
        ctx.beginPath()
        ctx.arc(0, 0, seg.size * 1.8, 0, Math.PI * 2)
        ctx.fill()

        ctx.save()
        ctx.strokeStyle = `rgba(255, 150, 0, ${boostPulse * 0.9})`
        ctx.lineWidth = 3
        ctx.shadowColor = '#FF6600'
        ctx.shadowBlur = 15
        ctx.beginPath()
        ctx.arc(0, 0, seg.size + 5, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }

      // 血量数字
      const hpText = Math.round(dragonHp).toString()
      const fontSize = Math.max(9, seg.size * 0.48)
      ctx.strokeStyle = 'rgba(0,0,0,0.7)'
      ctx.lineWidth = 2
      ctx.font = `bold ${fontSize}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.strokeText(hpText, 0, 1)
      ctx.fillStyle = hpRatio < 0.3 ? '#FFFFFF' : `rgb(${Math.round(255 * (1 - hpRatio))}, ${Math.round(255 * hpRatio)}, 50)`
      ctx.fillText(hpText, 0, 1)
    }

    // --- 龙头 ---
    if (seg.isHead) {
      const breathScale = 1 + Math.sin(t * 0.003) * 0.04  // 呼吸微微缩放
      ctx.scale(breathScale, breathScale)

      // 龙身渐变（底色）
      const headGrad = ctx.createRadialGradient(
        -seg.size * 0.3, -seg.size * 0.3, seg.size * 0.05,
        0, 0, seg.size
      )
      headGrad.addColorStop(0, lightenColor(seg.color, 60))
      headGrad.addColorStop(0.5, seg.color)
      headGrad.addColorStop(1, lightenColor(seg.color, -25))

      // 回缩状态闪烁红边框
      if (isRetracting) {
        const flashIntensity = Math.sin(t * 0.01) * 0.5 + 0.5
        ctx.save()
        ctx.strokeStyle = `rgba(255, 60, 60, ${flashIntensity})`
        ctx.lineWidth = 5
        ctx.shadowColor = '#FF4444'
        ctx.shadowBlur = 20
        ctx.beginPath()
        ctx.arc(0, 0, seg.size + 6, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }

      // 头部主体
      ctx.shadowBlur = 18
      ctx.fillStyle = headGrad
      ctx.beginPath()
      ctx.arc(0, 0, seg.size, 0, Math.PI * 2)
      ctx.fill()

      // 高光
      ctx.save()
      ctx.globalAlpha = 0.4
      const shineGrad = ctx.createRadialGradient(
        -seg.size * 0.3, -seg.size * 0.35, 0,
        -seg.size * 0.2, -seg.size * 0.25, seg.size * 0.6
      )
      shineGrad.addColorStop(0, 'rgba(255,255,255,0.9)')
      shineGrad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = shineGrad
      ctx.beginPath()
      ctx.arc(0, 0, seg.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // 龙鳞纹理（头部鳞片纹）
      ctx.strokeStyle = `rgba(255,255,255,0.2)`
      ctx.lineWidth = 1
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        const rx = Math.cos(a) * seg.size * 0.65
        const ry = Math.sin(a) * seg.size * 0.65
        ctx.beginPath()
        ctx.arc(rx, ry, seg.size * 0.18, 0, Math.PI * 2)
        ctx.stroke()
      }

      // 眼睛（带眼神光）
      ctx.shadowBlur = 0
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(-seg.size * 0.28, -seg.size * 0.08, seg.size * 0.22, 0, Math.PI * 2)
      ctx.arc(seg.size * 0.28, -seg.size * 0.08, seg.size * 0.22, 0, Math.PI * 2)
      ctx.fill()

      // 眼珠（竖瞳）
      const blink = Math.sin(t * 0.0015) > 0.97 ? 0.1 : 1  // 偶尔眨眼
      ctx.fillStyle = '#111111'
      ctx.save()
      ctx.scale(1, blink)
      ctx.beginPath()
      ctx.ellipse(-seg.size * 0.28, -seg.size * 0.08, seg.size * 0.08, seg.size * 0.16, 0, 0, Math.PI * 2)
      ctx.ellipse(seg.size * 0.28, -seg.size * 0.08, seg.size * 0.08, seg.size * 0.16, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // 眼神光（高光点）
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.beginPath()
      ctx.arc(-seg.size * 0.32, -seg.size * 0.14, seg.size * 0.06, 0, Math.PI * 2)
      ctx.arc(seg.size * 0.24, -seg.size * 0.14, seg.size * 0.06, 0, Math.PI * 2)
      ctx.fill()

      // 龙角
      if (seg.hasHorn) {
        ctx.shadowColor = seg.color
        ctx.shadowBlur = 6
        const hornGrad = ctx.createLinearGradient(-seg.size, -seg.size * 0.5, seg.size * 0.5, -seg.size * 0.5)
        hornGrad.addColorStop(0, lightenColor(seg.color, 60))
        hornGrad.addColorStop(1, lightenColor(seg.color, -10))
        ctx.strokeStyle = hornGrad
        ctx.lineWidth = 3.5
        ctx.lineCap = 'round'

        ctx.beginPath()
        ctx.moveTo(-seg.size * 0.45, -seg.size * 0.15)
        ctx.quadraticCurveTo(-seg.size * 0.65, -seg.size * 0.5, -seg.size * 0.9, -seg.size * 0.65)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(seg.size * 0.45, -seg.size * 0.15)
        ctx.quadraticCurveTo(seg.size * 0.65, -seg.size * 0.5, seg.size * 0.9, -seg.size * 0.65)
        ctx.stroke()
      }

      // 龙须（随时间轻微摆动）
      ctx.shadowBlur = 0
      const whiskerWave = Math.sin(t * 0.004) * 0.08
      ctx.strokeStyle = lightenColor(seg.color, 50)
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(-seg.size * 0.4, -seg.size * 0.05)
      ctx.quadraticCurveTo(
        -seg.size * 0.75, -seg.size * 0.3 + whiskerWave * 10,
        -seg.size * 1.1, -seg.size * 0.15 + whiskerWave * 15
      )
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(seg.size * 0.4, -seg.size * 0.05)
      ctx.quadraticCurveTo(
        seg.size * 0.75, -seg.size * 0.3 - whiskerWave * 10,
        seg.size * 1.1, -seg.size * 0.15 - whiskerWave * 15
      )
      ctx.stroke()

      // BOSS 显示"王"
      if (type === 'boss') {
        ctx.fillStyle = '#FFD700'
        ctx.font = `bold ${seg.size * 0.65}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = '#FFD700'
        ctx.shadowBlur = 10
        ctx.strokeStyle = '#8B4513'
        ctx.lineWidth = 2
        ctx.strokeText('王', 0, 1)
        ctx.fillText('王', 0, 1)
      }

      // 龙头加速火焰特效（整体发光拖尾）
      if (isBoosting) {
        const pulse = Math.sin(t * 0.02) * 0.25 + 0.75
        ctx.save()
        // 外层橙红光芒
        const boostGlow = ctx.createRadialGradient(0, 0, seg.size * 0.8, 0, 0, seg.size * 2.5)
        boostGlow.addColorStop(0, `rgba(255, 80, 0, ${pulse * 0.5})`)
        boostGlow.addColorStop(0.5, `rgba(255, 30, 0, ${pulse * 0.25})`)
        boostGlow.addColorStop(1, 'rgba(255, 0, 0, 0)')
        ctx.fillStyle = boostGlow
        ctx.beginPath()
        ctx.arc(0, 0, seg.size * 2.2, 0, Math.PI * 2)
        ctx.fill()

        // 火焰描边环
        ctx.strokeStyle = `rgba(255, 150, 0, ${pulse})`
        ctx.lineWidth = 3.5
        ctx.shadowColor = '#FF6600'
        ctx.shadowBlur = 20
        ctx.beginPath()
        ctx.arc(0, 0, seg.size + 6, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }

      // 宝箱龙/金币龙已废弃（无分裂后不再使用），此处留空
      // 防止 TS 报错：treasure/coin 类型已被 Dragon.type 移除
      void type;
    }

    // 道具图标
    if (seg.attachedPowerUp) {
      const icon = POWERUP_ICONS[seg.attachedPowerUp]
      const pulse = 1 + Math.sin(t / 150) * 0.15

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
    // 使用 state.playerY（编辑器设置的起点位置），默认为底部
    const playerDrawY = state.playerY ?? BASE_H - 55
    ctx.translate(state.playerX, playerDrawY)

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

    // ═══════════════════════════════════════
    // 英雄射手角色设计
    // ═══════════════════════════════════════

    // 1. 披风/斗篷（动态飘动效果）
    const capeWave = Math.sin(Date.now() / 200) * 3
    ctx.save()
    ctx.fillStyle = 'rgba(139, 0, 0, 0.7)'  // 深红色披风
    ctx.beginPath()
    ctx.moveTo(-18, 5)
    ctx.quadraticCurveTo(-22 + capeWave, 25, -15 + capeWave * 1.5, 35)
    ctx.lineTo(15 - capeWave * 1.5, 35)
    ctx.quadraticCurveTo(22 - capeWave, 25, 18, 5)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    // 2. 身体盔甲（金属质感）
    const armorGrad = ctx.createLinearGradient(-15, -15, 15, 15)
    armorGrad.addColorStop(0, '#C0C0C0')  // 银色高光
    armorGrad.addColorStop(0.5, '#808080')  // 中灰色
    armorGrad.addColorStop(1, '#505050')  // 深灰阴影
    ctx.fillStyle = armorGrad
    ctx.beginPath()
    ctx.arc(0, 0, 18, 0, Math.PI * 2)
    ctx.fill()

    // 盔甲边缘装饰
    ctx.strokeStyle = '#FFD700'  // 金色边框
    ctx.lineWidth = 2
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(0, 0, 18, 0, Math.PI * 2)
    ctx.stroke()
    ctx.shadowBlur = 0

    // 3. 头盔/头饰
    const helmetGrad = ctx.createRadialGradient(-5, -10, 0, 0, -5, 15)
    helmetGrad.addColorStop(0, '#E8E8E8')
    helmetGrad.addColorStop(1, '#909090')
    ctx.fillStyle = helmetGrad
    ctx.beginPath()
    ctx.arc(0, -8, 14, 0, Math.PI * 2)
    ctx.fill()

    // 头盔顶部装饰（羽饰）
    ctx.fillStyle = '#DC143C'  // 深红色羽毛
    ctx.beginPath()
    ctx.moveTo(-8, -18)
    ctx.quadraticCurveTo(0, -28, 8, -18)
    ctx.quadraticCurveTo(0, -22, -8, -18)
    ctx.fill()

    // 4. 面部细节
    // 眼睛（锐利的眼神）
    ctx.fillStyle = '#1E90FF'  // 蓝色眼睛
    ctx.shadowColor = '#1E90FF'
    ctx.shadowBlur = 4
    ctx.beginPath()
    ctx.ellipse(-5, -6, 3, 2, 0, 0, Math.PI * 2)
    ctx.ellipse(5, -6, 3, 2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // 眼眉（严肃表情）
    ctx.strokeStyle = '#404040'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(-8, -10)
    ctx.lineTo(-2, -9)
    ctx.moveTo(2, -9)
    ctx.lineTo(8, -10)
    ctx.stroke()

    // 5. 武器 - 弓箭
    ctx.save()
    // 旋转坐标系到射击方向
    // state.shootAngle: Canvas 标准角度（0=右，-PI/2=上）
    ctx.rotate(state.shootAngle)

    // 弓身（垂直于射击方向，开口朝后）
    ctx.strokeStyle = '#8B4513'  // 棕色木弓
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.shadowColor = '#8B4513'
    ctx.shadowBlur = 4
    ctx.beginPath()
    // 弓身是弧形，开口朝向负X方向（后方）
    ctx.arc(0, 0, 22, -Math.PI / 2.5, Math.PI / 2.5)
    ctx.stroke()
    ctx.shadowBlur = 0

    // 弓弦（连接弓的两端）
    ctx.strokeStyle = '#E0E0E0'  // 浅灰色弦
    ctx.lineWidth = 1.5
    ctx.beginPath()
    const bowTopX = 22 * Math.cos(-Math.PI / 2.5)
    const bowTopY = 22 * Math.sin(-Math.PI / 2.5)
    const bowBottomX = 22 * Math.cos(Math.PI / 2.5)
    const bowBottomY = 22 * Math.sin(Math.PI / 2.5)
    ctx.moveTo(bowTopX, bowTopY)
    ctx.lineTo(bowBottomX, bowBottomY)
    ctx.stroke()

    // 箭矢（沿射击方向）
    ctx.strokeStyle = '#FFD700'  // 金色箭杆
    ctx.lineWidth = 2.5
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 6
    ctx.beginPath()
    ctx.moveTo(-5, 0)   // 箭尾
    ctx.lineTo(35, 0)   // 箭头位置
    ctx.stroke()
    ctx.shadowBlur = 0

    // 箭头（三角形）
    ctx.fillStyle = '#FF4500'  // 橙红色箭头
    ctx.beginPath()
    ctx.moveTo(38, 0)      // 箭头尖端
    ctx.lineTo(30, -4)     // 左翼
    ctx.lineTo(33, 0)      // 中间凹进
    ctx.lineTo(30, 4)      // 右翼
    ctx.closePath()
    ctx.fill()

    // 箭羽（尾部装饰）
    ctx.fillStyle = '#DC143C'  // 深红色羽毛
    ctx.beginPath()
    ctx.moveTo(-5, 0)
    ctx.lineTo(-10, -3)
    ctx.lineTo(-8, 0)
    ctx.lineTo(-10, 3)
    ctx.closePath()
    ctx.fill()

    ctx.restore()

    // ── 选中/未选中特效 ──
    if (!state.isSelected) {
      // 未选中：灰色虚线环 + 暗淡
      ctx.save()
      ctx.globalAlpha = 0.6
      ctx.setLineDash([6, 4])
      ctx.strokeStyle = 'rgba(180, 180, 180, 0.7)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, 32, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()

      // 提示文字
      ctx.fillStyle = 'rgba(200, 200, 200, 0.9)'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.shadowColor = 'rgba(0,0,0,0.8)'
      ctx.shadowBlur = 3
      ctx.fillText('👆 点击选中', 0, -35)
      ctx.shadowBlur = 0
    } else {
      // 选中：金色脉冲光环 + 能量粒子
      const selPulse = 1 + Math.sin(Date.now() / 200) * 0.08
      ctx.save()
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.7 + Math.sin(Date.now() / 200) * 0.2})`
      ctx.lineWidth = 3
      ctx.shadowColor = '#FFD700'
      ctx.shadowBlur = 18
      ctx.beginPath()
      ctx.arc(0, 0, 32 * selPulse, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()

      // 四角星光（增强版）
      const starAngle = Date.now() / 600
      ctx.strokeStyle = '#FFD700'
      ctx.lineWidth = 2
      ctx.shadowColor = '#FFD700'
      ctx.shadowBlur = 10
      for (let i = 0; i < 4; i++) {
        const a = starAngle + (i * Math.PI / 2)
        const sx = Math.cos(a) * 38
        const sy = Math.sin(a) * 38
        // 十字星芒
        ctx.beginPath()
        ctx.moveTo(sx - 6, sy)
        ctx.lineTo(sx + 6, sy)
        ctx.moveTo(sx, sy - 6)
        ctx.lineTo(sx, sy + 6)
        ctx.stroke()
        // 小光点
        ctx.fillStyle = '#FFFACD'
        ctx.beginPath()
        ctx.arc(sx, sy, 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0

      // 选中提示
      ctx.fillStyle = 'rgba(255, 215, 0, 0.9)'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.shadowColor = 'rgba(0,0,0,0.8)'
      ctx.shadowBlur = 3
      ctx.fillText('✨ 已选中', 0, -35)
      ctx.shadowBlur = 0
    }

    ctx.restore()

    // 🎯 已删除：射击方向指示器（箭头、虚线、角度刻度、度数文字）
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

      const icon = POWERUP_ICONS[p.type as keyof typeof POWERUP_ICONS]

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
    const m = Math.floor(state.timeLeft / 60)
    const s = Math.floor(state.timeLeft % 60)
    ctx.fillText(`${m}:${s.toString().padStart(2,'0')}`, 12, BASE_H - 10)

    if (state.coins > 0) {
      ctx.textAlign = 'right'
      ctx.fillStyle = '#FFD700'
      ctx.fillText(`${state.coins}`, BASE_W - 12, BASE_H - 10)
    }

    // ====== 有持续时间的道具状态栏（底部） ======
    if (state.activeBuffs.length > 0) {
      const buffBarY = BASE_H - 8
      ctx.textAlign = 'left'
      for (let i = 0; i < state.activeBuffs.length; i++) {
        const buff = state.activeBuffs[i]
        const bw = 52
        const bh = 16
        const bx = 8 + i * (bw + 4)

        // 背景
        ctx.fillStyle = 'rgba(0,0,0,0.65)'
        ctx.beginPath()
        ctx.roundRect(bx, buffBarY - bh, bw, bh, 4)
        ctx.fill()

        // 进度条（从右往左缩短）
        const ratio = Math.max(0, buff.remaining / buff.duration)
        if (ratio > 0) {
          ctx.fillStyle = buff.color
          ctx.globalAlpha = 0.5
          ctx.beginPath()
          ctx.roundRect(bx + 1, buffBarY - bh + 1, (bw - 2) * ratio, bh - 2, 3)
          ctx.fill()
          ctx.globalAlpha = 1
        }

        // 图标
        ctx.fillStyle = '#fff'
        ctx.font = '10px sans-serif'
        ctx.textBaseline = 'middle'
        ctx.fillText(buff.icon, bx + 3, buffBarY - bh / 2)

        // 剩余秒数
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 9px sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText(buff.remaining.toFixed(1) + 's', bx + bw - 3, buffBarY - bh / 2)
        ctx.textAlign = 'left'

        // 层数
        if (buff.stacks && buff.stacks > 1) {
          ctx.fillStyle = '#FFD700'
          ctx.font = 'bold 8px sans-serif'
          ctx.textAlign = 'right'
          ctx.fillText('x' + buff.stacks, bx + bw - 3, buffBarY - bh / 2 - 10)
          ctx.textAlign = 'left'
        }
      }
      ctx.textBaseline = 'alphabetic'
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
    ctx.fillText('🎮 开始闯关', BASE_W / 2, BASE_H / 2 + 10)

    ctx.fillStyle = '#9370DB'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText('✏️ 绘制路线', BASE_W / 2, BASE_H / 2 + 45)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.font = '12px sans-serif'
    ctx.fillText('点击对应按钮', BASE_W / 2, BASE_H / 2 + 75)
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

    // 如果启用预览，先显示游戏场景效果（作为背景）
    if (routeEditor.showPreview) {
      routeEditor.drawGamePreview()
    }

    // 然后绘制路线（在预览背景之上）
    if (routeEditor.getCurrentPoints().length > 0) {
      routeEditor.drawCurrentRoute()
    }

    // 🎯 绘制玩家起点标记（如果有设置）
    routeEditor.drawPlayerStartPoint()

    // 🎯 简化版：4个核心按钮
    const modeText = routeEditor.activeMode === 'route' ? '✏️ 画路线中' :
                     routeEditor.activeMode === 'playerStart' ? '🎯 设置起点中' : ''
    if (modeText) {
      ctx.save()
      ctx.fillStyle = routeEditor.activeMode === 'route' ? '#9C27B0' : '#2E7D32'
      ctx.shadowColor = ctx.fillStyle
      ctx.shadowBlur = 10
      const indicatorW = 140
      const indicatorH = 32
      const radius = 16
      ctx.beginPath()
      ctx.moveTo(CANVAS_W / 2 - indicatorW / 2 + radius, 45)
      ctx.lineTo(CANVAS_W / 2 + indicatorW / 2 - radius, 45)
      ctx.quadraticCurveTo(CANVAS_W / 2 + indicatorW / 2, 45, CANVAS_W / 2 + indicatorW / 2, 45 + radius)
      ctx.lineTo(CANVAS_W / 2 + indicatorW / 2, 45 + indicatorH - radius)
      ctx.quadraticCurveTo(CANVAS_W / 2 + indicatorW / 2, 45 + indicatorH, CANVAS_W / 2 + indicatorW / 2 - radius, 45 + indicatorH)
      ctx.lineTo(CANVAS_W / 2 - indicatorW / 2 + radius, 45 + indicatorH)
      ctx.quadraticCurveTo(CANVAS_W / 2 - indicatorW / 2, 45 + indicatorH, CANVAS_W / 2 - indicatorW / 2, 45 + indicatorH - radius)
      ctx.lineTo(CANVAS_W / 2 - indicatorW / 2, 45 + radius)
      ctx.quadraticCurveTo(CANVAS_W / 2 - indicatorW / 2, 45, CANVAS_W / 2 - indicatorW / 2 + radius, 45)
      ctx.closePath()
      ctx.fill()
      
      ctx.shadowBlur = 0
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 13px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(modeText, CANVAS_W / 2, 45 + indicatorH / 2 + 1)
      ctx.restore()
    }

    // 🎯 简化版：4个核心按钮
    const totalBtns = 4
    const btnY = CANVAS_H - 85
    const btnH = 50
    const btnW = 70
    const btnGap = 10
    const totalWidth = btnW * totalBtns + btnGap * (totalBtns - 1)
    const btnStartX = (CANVAS_W - totalWidth) / 2

    // 辅助函数：绘制带圆角和阴影的按钮
    function drawButton(x: number, y: number, w: number, h: number, color: string, text: string, isActive: boolean = false) {
      ctx.save()
      
      // 按钮背景（圆角矩形）
      ctx.fillStyle = color
      if (isActive) {
        // 激活状态：添加光晕效果
        ctx.shadowColor = color
        ctx.shadowBlur = 15
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
        ctx.shadowBlur = 5
        ctx.shadowOffsetY = 2
      }
      
      // 绘制圆角矩形
      const radius = 10
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + w - radius, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
      ctx.lineTo(x + w, y + h - radius)
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
      ctx.lineTo(x + radius, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
      ctx.fill()
      
      // 按钮文字
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0
      ctx.fillStyle = isActive ? '#000' : '#FFFFFF'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, x + w / 2, y + h / 2 + 1)
      
      ctx.restore()
    }

    // 1. 画路线（默认模式）
    const isRouteMode = routeEditor.activeMode === 'route'
    drawButton(btnStartX, btnY, btnW, btnH, isRouteMode ? '#E040FB' : '#9C27B0', '✏️ 画路线', isRouteMode)
    
    // 2. 设置起点
    const isPlayerStartMode = routeEditor.activeMode === 'playerStart'
    drawButton(btnStartX + btnW + btnGap, btnY, btnW, btnH, isPlayerStartMode ? '#00FF88' : '#2E7D32', '🎯 起点', isPlayerStartMode)
    
    // 3. 保存
    drawButton(btnStartX + (btnW + btnGap) * 2, btnY, btnW, btnH, '#4CAF50', '💾 保存')
    
    // 4. 返回
    drawButton(btnStartX + (btnW + btnGap) * 3, btnY, btnW, btnH, '#FF5722', '⬅️ 返回')

    // 简洁提示
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('点击画布绘制 | 切换模式后重新点击', CANVAS_W / 2, btnY + btnH + 18)
    
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

  // ========== 关卡完成界面 ==========
  function drawLevelComplete() {
    // 全屏遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    ctx.fillRect(0, 0, BASE_W, BASE_H)

    // 标题
    ctx.fillStyle = '#4CAF50'
    ctx.font = 'bold 36px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🎉 关卡通过!', BASE_W / 2, BASE_H / 2 - 100)

    // 分割线
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(BASE_W / 2 - 120, BASE_H / 2 - 70)
    ctx.lineTo(BASE_W / 2 + 120, BASE_H / 2 - 70)
    ctx.stroke()

    // 统计信息
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '18px sans-serif'
    ctx.fillText(`第 ${state.level - 1} 关`, BASE_W / 2, BASE_H / 2 - 40)

    ctx.font = '16px sans-serif'
    ctx.fillStyle = '#AAAAAA'
    ctx.fillText(`击杀: ${state.levelCompleteKills}`, BASE_W / 2, BASE_H / 2 - 10)
    ctx.fillText(`得分: ${state.levelCompleteScore}`, BASE_W / 2, BASE_H / 2 + 20)

    // 分割线
    ctx.beginPath()
    ctx.moveTo(BASE_W / 2 - 80, BASE_H / 2 + 45)
    ctx.lineTo(BASE_W / 2 + 80, BASE_H / 2 + 45)
    ctx.stroke()

    // 下一关按钮
    const btnW = 200
    const btnH = 50
    const btnX = BASE_W / 2 - btnW / 2
    const btnY = BASE_H / 2 + 60

    // 按钮背景（带渐变）
    const grad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH)
    grad.addColorStop(0, '#4CAF50')
    grad.addColorStop(1, '#388E3C')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.roundRect(btnX, btnY, btnW, btnH, 10)
    ctx.fill()

    // 按钮文字
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 20px sans-serif'
    ctx.fillText(`进入第 ${state.level} 关`, BASE_W / 2, btnY + 33)

    // 提示
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '12px sans-serif'
    ctx.fillText('点击按钮继续', BASE_W / 2, btnY + btnH + 20)
  }

  // ========== 主渲染函数 ==========
  function render() {
    // 清除画布
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    // 路线编辑模式
    if (state.phase === 'routeEdit') {
      drawRouteEditor()
      drawFloatTexts()
      return
    }

    // 关卡过渡动画（全屏遮罩 + 大字）
    if (state.levelTransition) {
      // 画半透明黑色背景
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
      // 大字居中
      const alpha = Math.min(1, state.levelTransitionTimer)
      ctx.globalAlpha = alpha
      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 48px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = '#FF8E00'
      ctx.shadowBlur = 20
      ctx.fillText(`第 ${state.level} 关`, CANVAS_W / 2, CANVAS_H / 2 - 20)
      ctx.font = 'bold 20px sans-serif'
      ctx.fillStyle = '#FFFFFF'
      ctx.shadowBlur = 10
      ctx.fillText('准备开始...', CANVAS_W / 2, CANVAS_H / 2 + 30)
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
      ctx.textAlign = 'left'
      drawFloatTexts()
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
      // 路线轨迹（路线存游戏坐标，在 translate 区域内绘制）
      if (state.dragons.length > 0) {
        for (const dragon of state.dragons) {
          drawRouteTrail(dragon)
        }
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

      if (state.phase === 'powerup_select') {
        drawPowerUpSelectOverlay()
      }

      if (state.phase === 'levelComplete') {
        drawLevelComplete()
      }
    }

    ctx.restore()
  }

  // ========== 缓动函数 ==========
  function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
  }
  function easeOutBack(t: number): number {
    const c1 = 1.70158, c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }
  function easeOutQuad(t: number): number {
    return 1 - (1 - t) * (1 - t)
  }

  // ========== 圆角矩形辅助 ==========
  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
  ) {
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

  // ========== 道具选择弹窗 ==========
  function drawPowerUpSelectOverlay() {
    const ps = state.powerupSelect
    if (!ps) return
    const t = Date.now()

    // 半透明黑色遮罩（关闭时渐隐）
    const overlayAlpha = ps.closing ? (1 - ps.closeProgress) * 0.75 : 0.75
    ctx.fillStyle = `rgba(0, 0, 0, ${overlayAlpha})`
    ctx.fillRect(0, 0, BASE_W, BASE_H)

    // 标题
    ctx.save()
    ctx.globalAlpha = ps.closing ? (1 - ps.closeProgress) : 1
    ctx.fillStyle = '#FFE066'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = '#FFE066'
    ctx.shadowBlur = 10
    ctx.fillText('✨ 选择你的仙术 ✨', BASE_W / 2, BASE_H / 2 - 110)
    ctx.restore()

    // 三张卡片
    const cardW = 90
    const cardH = 120
    const cardGap = 20
    const totalW = cardW * 3 + cardGap * 2
    const startX = (BASE_W - totalW) / 2
    const cardY = BASE_H / 2 - cardH / 2

    ps.cards.forEach((card, i) => {
      const cx = startX + i * (cardW + cardGap) + cardW / 2
      const cy = cardY + cardH / 2
      const isRevealed = ps.revealedIdx === i
      const isOtherRevealed = ps.revealedIdx !== null && ps.revealedIdx !== i
      const flipT = isRevealed ? ps.revealProgress : (isOtherRevealed ? 1 : 0)
      const closeScale = ps.closing ? Math.max(0.01, 1 - ps.closeProgress * 0.3) : 1
      // 悬浮动画
      const floatY = isRevealed ? 0 : Math.sin(t / 400 + i * 1.2) * 4

      ctx.save()
      ctx.translate(cx, cy + floatY)
      ctx.scale(closeScale, closeScale)

      // 绕卡片中心翻转：scaleX 从 1(背面) → 0 → -1(正面)
      // 翻到一半(flipT=0.5)时 scaleX=0，之后显示正面
      const flipScaleX = Math.max(-1, 1 - flipT * 2)  // 1→0→-1
      const showingFront = flipT > 0.5

      if (showingFront) {
        // 🎯 修复：正面显示时，使用正常坐标系（不翻转）
        // 因为 flipScaleX 是负数，取绝对值后恢复正常方向
        ctx.scale(Math.abs(flipScaleX), 1)
      } else {
        // 背面：正常翻转
        ctx.scale(flipScaleX, 1)
      }

      if (showingFront) {
        // === 正面（坐标系已翻正）===
        const faceGrad = ctx.createLinearGradient(-cardW / 2, -cardH / 2, cardW / 2, cardH / 2)
        faceGrad.addColorStop(0, '#2a2a4a')
        faceGrad.addColorStop(1, '#1a1a2e')
        const radius = 12
        roundRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, radius)
        ctx.fillStyle = faceGrad
        ctx.fill()
        ctx.strokeStyle = card.color
        ctx.lineWidth = 2.5
        ctx.shadowColor = card.color
        ctx.shadowBlur = 15
        ctx.stroke()

        // 选中高亮（仅选中卡有金边）
        ctx.strokeStyle = '#FFD700'
        ctx.lineWidth = 3
        ctx.shadowColor = '#FFD700'
        ctx.shadowBlur = 20
        roundRect(ctx, -cardW / 2 - 3, -cardH / 2 - 3, cardW + 6, cardH + 6, radius + 2)
        ctx.stroke()

        // 🎯 修复：道具图标（正常绘制，不需要额外翻转）
        ctx.save()
        ctx.shadowBlur = 20
        ctx.shadowColor = card.color
        ctx.fillStyle = card.color
        ctx.font = '36px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(card.icon, 0, -cardH / 4 + 10)
        ctx.restore()

        // 🎯 修复：名称（正常绘制）
        ctx.save()
        ctx.shadowBlur = 0
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 11px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(card.name || '', 0, 8)
        ctx.restore()

        // 🎯 修复：描述（多行截断，正常绘制）
        ctx.save()
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.font = '9px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        const descText = card.desc || ''
        if (descText.length > 12) {
          ctx.fillText(descText.slice(0, 12), 0, 24)
          ctx.fillText(descText.slice(12, 24), 0, 36)
        } else {
          ctx.fillText(descText, 0, 24)
        }
        ctx.restore()
      } else {
        // === 背面 ===
        const backGrad = ctx.createLinearGradient(-cardW / 2, -cardH / 2, cardW / 2, cardH / 2)
        backGrad.addColorStop(0, '#3a2a5a')
        backGrad.addColorStop(1, '#2a1a4a')
        const radius = 12
        roundRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, radius)
        ctx.fillStyle = backGrad
        ctx.fill()

        ctx.strokeStyle = isOtherRevealed ? 'rgba(255,255,255,0.15)' : 'rgba(180, 120, 255, 0.8)'
        ctx.lineWidth = isOtherRevealed ? 1 : 2
        ctx.shadowColor = '#9B59B6'
        ctx.shadowBlur = isOtherRevealed ? 4 : 10
        roundRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, radius)
        ctx.stroke()

        // 问号符文
        ctx.shadowBlur = 8
        ctx.shadowColor = '#BB77FF'
        ctx.fillStyle = 'rgba(180, 120, 255, 0.9)'
        ctx.font = 'bold 40px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('?', 0, -8)

        // 装饰线
        ctx.strokeStyle = 'rgba(180, 120, 255, 0.5)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(-cardW * 0.3, cardH * 0.25)
        ctx.lineTo(cardW * 0.3, cardH * 0.25)
        ctx.stroke()
        ctx.fillStyle = 'rgba(180, 120, 255, 0.7)'
        ctx.font = '9px sans-serif'
        ctx.fillText('点击选择', 0, cardH * 0.25 + 14)
      }

      ctx.restore()
    })
  }

  return { render }
}
