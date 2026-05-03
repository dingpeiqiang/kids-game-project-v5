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

    // ── 选中/未选中特效 ──
    if (!state.isSelected) {
      // 未选中：灰色虚线环 + 暗淡
      ctx.save()
      ctx.globalAlpha = 0.5
      ctx.setLineDash([6, 4])
      ctx.strokeStyle = 'rgba(180, 180, 180, 0.7)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, 28, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()

      // 提示文字
      ctx.fillStyle = 'rgba(200, 200, 200, 0.8)'
      ctx.font = 'bold 9px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.shadowColor = 'rgba(0,0,0,0.8)'
      ctx.shadowBlur = 3
      ctx.fillText('点击选中', 0, -30)
      ctx.shadowBlur = 0
    } else {
      // 选中：金色脉冲光环
      const selPulse = 1 + Math.sin(Date.now() / 200) * 0.08
      ctx.save()
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.6 + Math.sin(Date.now() / 200) * 0.2})`
      ctx.lineWidth = 2.5
      ctx.shadowColor = '#FFD700'
      ctx.shadowBlur = 15
      ctx.beginPath()
      ctx.arc(0, 0, 28 * selPulse, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()

      // 四角星光
      const starAngle = Date.now() / 800
      ctx.strokeStyle = '#FFD700'
      ctx.lineWidth = 1.5
      ctx.shadowColor = '#FFD700'
      ctx.shadowBlur = 6
      for (let i = 0; i < 4; i++) {
        const a = starAngle + (i * Math.PI / 2)
        const sx = Math.cos(a) * 32
        const sy = Math.sin(a) * 32
        ctx.beginPath()
        ctx.moveTo(sx - 4, sy)
        ctx.lineTo(sx + 4, sy)
        ctx.moveTo(sx, sy - 4)
        ctx.lineTo(sx, sy + 4)
        ctx.stroke()
      }
      ctx.shadowBlur = 0
    }

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

    // 按钮区域 - 6个按钮：新建 清除 保存 优化 导出 返回
    const btnY = CANVAS_H - 80
    const btnH = 50
    const btnW = 62
    const btnGap = 4
    const totalBtns = 6
    const btnStartX = (CANVAS_W - (btnW * totalBtns + btnGap * (totalBtns - 1))) / 2

    // 新建按钮
    ctx.fillStyle = '#9C27B0'
    ctx.fillRect(btnStartX, btnY, btnW, btnH)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 11px sans-serif'
    ctx.fillText('➕ 新建', btnStartX + btnW / 2, btnY + 32)

    // 清除按钮
    ctx.fillStyle = '#FF6B6B'
    ctx.fillRect(btnStartX + btnW + btnGap, btnY, btnW, btnH)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('🗑️ 清除', btnStartX + btnW + btnGap + btnW / 2, btnY + 32)

    // 保存按钮
    ctx.fillStyle = '#4CAF50'
    ctx.fillRect(btnStartX + (btnW + btnGap) * 2, btnY, btnW, btnH)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('💾 保存', btnStartX + (btnW + btnGap) * 2 + btnW / 2, btnY + 32)

    // 优化按钮
    ctx.fillStyle = '#FF9800'
    ctx.fillRect(btnStartX + (btnW + btnGap) * 3, btnY, btnW, btnH)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('✨ 优化', btnStartX + (btnW + btnGap) * 3 + btnW / 2, btnY + 32)

    // 导出按钮
    ctx.fillStyle = '#2196F3'
    ctx.fillRect(btnStartX + (btnW + btnGap) * 4, btnY, btnW, btnH)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('📥 导出', btnStartX + (btnW + btnGap) * 4 + btnW / 2, btnY + 32)

    // 返回按钮
    ctx.fillStyle = COLORS.accent
    ctx.fillRect(btnStartX + (btnW + btnGap) * 5, btnY, btnW, btnH)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('⬅️ 返回', btnStartX + (btnW + btnGap) * 5 + btnW / 2, btnY + 32)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.font = '11px sans-serif'
    ctx.fillText('✨优化：抽稀+圆滑后保存', CANVAS_W / 2, btnY + btnH + 15)
    
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

      if (state.phase === 'powerup_select') {
        drawPowerUpSelectOverlay()
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
        // 正面：先把坐标系翻正（恢复为正常方向）
        ctx.scale(-1, 1)
        ctx.scale(Math.abs(flipScaleX), 1)
      } else {
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

        // 道具图标
        ctx.save()
        ctx.shadowBlur = 20
        ctx.shadowColor = card.color
        ctx.fillStyle = card.color
        ctx.font = '36px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(card.icon, 0, -cardH / 4 + 10)
        ctx.restore()

        // 名称
        ctx.save()
        ctx.shadowBlur = 0
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 11px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(card.name || '', 0, 8)
        ctx.restore()

        // 描述（多行截断）
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
