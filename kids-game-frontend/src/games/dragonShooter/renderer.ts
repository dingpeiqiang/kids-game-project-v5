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
import { getDragonViewportLayout } from './viewport'

// ============================================
// 道具卡片几何缓存（模块级常量，避免重复计算）
// ============================================
const _CARD_W = 90
const _CARD_H = 120
const _CARD_GAP = 20
const _CARD_TOTAL_W = _CARD_W * 3 + _CARD_GAP * 2
const _CARD_START_X = (BASE_W - _CARD_TOTAL_W) / 2
const _CARD_Y = BASE_H / 2 - _CARD_H / 2
const _CARD_RADIUS = 12

/** 预创建的圆角矩形路径（用于碰撞检测和绘制） */
interface CardRect { x: number; y: number; w: number; h: number; r: number }
const _cardRects: CardRect[] = [
  { x: _CARD_START_X, y: _CARD_Y, w: _CARD_W, h: _CARD_H, r: _CARD_RADIUS },
  { x: _CARD_START_X + _CARD_W + _CARD_GAP, y: _CARD_Y, w: _CARD_W, h: _CARD_H, r: _CARD_RADIUS },
  { x: _CARD_START_X + (_CARD_W + _CARD_GAP) * 2, y: _CARD_Y, w: _CARD_W, h: _CARD_H, r: _CARD_RADIUS }
]

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

  // ========== 龙鳞纹理 offscreen canvas 缓存 ==========
  const _scalePatternCache = new Map<string, HTMLCanvasElement>()

  function getScalePatternCanvas(size: number, color: string): HTMLCanvasElement {
    const key = `${Math.round(size)}_${color}`
    let cached = _scalePatternCache.get(key)
    if (!cached) {
      cached = document.createElement('canvas')
      cached.width = Math.ceil(size * 2.4)
      cached.height = Math.ceil(size * 2.4)
      const cc = cached.getContext('2d')!
      const cx = cached.width / 2, cy = cached.height / 2
      cc.strokeStyle = 'rgba(255,255,255,0.2)'; cc.lineWidth = 1
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        cc.beginPath()
        cc.arc(Math.cos(a) * size * 0.65, Math.sin(a) * size * 0.65, size * 0.18, 0, Math.PI * 2)
        cc.stroke()
      }
      _scalePatternCache.set(key, cached)
    }
    return cached
  }

  // ========== 路线轨迹（offscreen canvas 缓存，避免每帧重绘所有点） ==========
  const _routeCache = new Map<string, HTMLCanvasElement>()

  function getRouteCacheKey(route: any): string {
    return `${route.id || ''}_${route.points?.length || 0}`
  }

  function drawRouteTrail(dragon: Dragon) {
    const route = dragon.routeFollower['route']
    if (!route || !route.points || route.points.length < 2) return

    const headColor = dragon.segments[0]?.color || '#FFD700'
    const cacheKey = getRouteCacheKey(route)

    let cached = _routeCache.get(cacheKey)
    // 缓存未命中或路线变化时重新渲染
    if (!cached) {
      const bounds = getRouteBounds(route.points)
      const pad = 10
      cached = document.createElement('canvas')
      cached.width = Math.ceil(bounds.w + pad * 2)
      cached.height = Math.ceil(bounds.h + pad * 2)
      const cctx = cached.getContext('2d')!

      cctx.strokeStyle = headColor + '4D'
      cctx.lineWidth = 2.5
      cctx.setLineDash([5, 5])
      cctx.shadowColor = headColor
      cctx.shadowBlur = 6
      cctx.beginPath()
      cctx.moveTo(route.points[0].x - bounds.minX + pad, route.points[0].y - bounds.minY + pad)
      for (let i = 1; i < route.points.length; i++) {
        cctx.lineTo(route.points[i].x - bounds.minX + pad, route.points[i].y - bounds.minY + pad)
      }
      cctx.stroke()
      ;(cached as any)._bounds = bounds
      ;(cached as any)._pad = pad
      _routeCache.set(cacheKey, cached)
    }

    const b = (cached as any)._bounds as { minX: number; minY: number; w: number; h: number }
    const p = (cached as any)._pad as number
    ctx.drawImage(cached, b.minX - p, b.minY - p)
  }

  function getRouteBounds(points: { x: number; y: number }[]) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const p of points) {
      if (p.x < minX) minX = p.x
      if (p.y < minY) minY = p.y
      if (p.x > maxX) maxX = p.x
      if (p.y > maxY) maxY = p.y
    }
    return { minX, minY, w: maxX - minX, h: maxY - minY }
  }

  // ========== 龙（性能优化版） ==========
  let _frameTime = 0

  function drawDragon(dragon: Dragon) {
    if (!dragon.alive) return
    _frameTime = Date.now() // 每帧缓存一次时间
    const mobile = getDragonViewportLayout().isMobile
    const margin = mobile ? 48 : 24
    const segs = dragon.segments
    for (let i = segs.length - 1; i >= 0; i--) {
      const seg = segs[i]
      // 视口外节段跳过绘制（游戏区已 clip，但仍可减少 save/restore）
      if (
        !seg.isHead &&
        (seg.x < -margin || seg.x > BASE_W + margin ||
          seg.y < -margin || seg.y > BASE_H + margin)
      ) {
        continue
      }
      drawDragonSegment(
        seg, seg.hp, seg.maxHp, dragon.type, dragon.slowed, !!dragon._isBoosting,
        mobile && !seg.isHead
      )
    }
  }

  function drawDragonSegment(
    seg: DragonSegment, dragonHp: number, dragonMaxHp: number,
    type: keyof typeof DRAGON_CONFIGS, isSlowed: boolean, isBoosting: boolean,
    simplifiedDraw = false
  ) {
    ctx.save()
    ctx.translate(seg.x, seg.y)

    const isRetracting = (seg as any)._isRetracting || false
    const hpRatio = dragonMaxHp > 0 ? dragonHp / dragonMaxHp : 1
    const t = _frameTime
    const s = seg.size

    // --- 身体节段（非龙头） ---
    if (!seg.isHead) {
      if (simplifiedDraw && !seg.attachedPowerUp) {
        ctx.fillStyle = seg.color
        ctx.beginPath()
        ctx.arc(0, 0, s, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        return
      }
      // 🎯 性能：受伤时才闪烁，减少不必要的计算
      const damagedFlash = hpRatio < 0.3 ? (Math.sin(t * 0.008) * 0.5 + 0.5) * 0.6 : 0

      // 🎯 性能：仅龙头/BOSS/受伤时使用 shadowBlur
      const needShadow = type === 'boss' || hpRatio < 0.3
      if (needShadow) { ctx.shadowColor = seg.color; ctx.shadowBlur = type === 'boss' ? 18 : 8 }

      // 🎯 性能：用简单填充替代 createRadialGradient（省 GPU）
      ctx.fillStyle = damagedFlash > 0 ? '#FFFFFF' : seg.color
      ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill()

      // 🎯 简化高光：不用渐变
      ctx.shadowBlur = 0
      ctx.globalAlpha = 0.3
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath(); ctx.arc(-s * 0.25, -s * 0.25, s * 0.4, 0, Math.PI * 2); ctx.fill()
      ctx.globalAlpha = 1

      // 道具节段专属光环（去掉嵌套 save/restore，手动恢复状态）
      if (seg.attachedPowerUp) {
        const pulseRing = 1 + Math.sin(t / 200) * 0.12
        const glowCfg = POWERUP_SEGMENT_COLORS[seg.attachedPowerUp] as unknown as { glowColor: string } | undefined
        ctx.strokeStyle = glowCfg?.glowColor ?? '#FFFFFF'
        ctx.lineWidth = 2.5
        ctx.globalAlpha = 0.5 + Math.sin(t / 200) * 0.3
        ctx.shadowColor = glowCfg?.glowColor ?? '#FFFFFF'
        ctx.shadowBlur = 10
        ctx.beginPath(); ctx.arc(0, 0, (s + 5) * pulseRing, 0, Math.PI * 2); ctx.stroke()
        ctx.globalAlpha = 1; ctx.shadowBlur = 0
      }

      // 龙纹（已缓存到 offscreen canvas，直接 drawImage）
      if (seg.hasPattern && !seg.attachedPowerUp) {
        const pc = getScalePatternCanvas(s, seg.color)
        ctx.drawImage(pc, -pc.width / 2, -pc.height / 2)
      }

      // 减速冰霜
      if (isSlowed) {
        ctx.strokeStyle = 'rgba(135, 206, 235, 0.7)'; ctx.lineWidth = 2
        ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(0, 0, s + 4, 0, Math.PI * 2); ctx.stroke()
        ctx.setLineDash([])
      }

      // 加速火焰拖尾（性能优化版：去掉每帧 createRadialGradient）
      if (isBoosting) {
        const bp = Math.sin(t * 0.015) * 0.3 + 0.7
        // 用简单的圆形替代昂贵的 radial gradient
        ctx.fillStyle = `rgba(255, 80, 0, ${bp * 0.5})`
        ctx.beginPath(); ctx.arc(0, 0, s * 1.3, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = `rgba(255, 150, 0, ${bp * 0.8})`
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(0, 0, s + 4, 0, Math.PI * 2); ctx.stroke()
      }

      // 血量数字
      const ht = Math.round(dragonHp).toString()
      const fs = Math.max(9, s * 0.48)
      ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 2
      ctx.font = `bold ${fs}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.strokeText(ht, 0, 1)
      ctx.fillStyle = hpRatio < 0.3 ? '#FFFFFF' : `rgb(${Math.round(255 * (1 - hpRatio))}, ${Math.round(255 * hpRatio)}, 50)`
      ctx.fillText(ht, 0, 1)

      ctx.restore()
      return
    }

    // --- 龙头（保留完整视觉效果，减少嵌套save/restore） ---
    if (seg.isHead) {
      const breathScale = 1 + Math.sin(t * 0.003) * 0.04
      ctx.scale(breathScale, breathScale)
      const s2 = s // 已缩放后的size引用

      const headGrad = ctx.createRadialGradient(-s2 * 0.3, -s2 * 0.3, s2 * 0.05, 0, 0, s2)
      headGrad.addColorStop(0, lightenColor(seg.color, 60)); headGrad.addColorStop(0.5, seg.color); headGrad.addColorStop(1, lightenColor(seg.color, -25))

      // 回缩状态闪烁红边框（去掉嵌套 save）
      if (isRetracting) {
        const fi = Math.sin(t * 0.01) * 0.5 + 0.5
        ctx.strokeStyle = `rgba(255, 60, 60, ${fi})`; ctx.lineWidth = 5
        ctx.shadowColor = '#FF4444'; ctx.shadowBlur = 20
        ctx.beginPath(); ctx.arc(0, 0, s2 + 6, 0, Math.PI * 2); ctx.stroke()
      }

      // 头部主体
      ctx.shadowBlur = 18
      ctx.fillStyle = headGrad
      ctx.beginPath(); ctx.arc(0, 0, s2, 0, Math.PI * 2); ctx.fill()

      // 🎯 性能：高光用简单白色半透明圆
      ctx.globalAlpha = 0.4; ctx.fillStyle = '#FFFFFF'
      ctx.beginPath(); ctx.arc(-s2 * 0.3, -s2 * 0.35, s2 * 0.35, 0, Math.PI * 2); ctx.fill()
      ctx.globalAlpha = 1

      // 龙鳞纹理（已缓存 offscreen canvas）
      {
        const pc = getScalePatternCanvas(s2, seg.color)
        ctx.drawImage(pc, -pc.width / 2, -pc.height / 2)
      }

      // 眼睛
      ctx.shadowBlur = 0; ctx.fillStyle = '#FFFFFF'
      ctx.beginPath(); ctx.arc(-s2 * 0.28, -s2 * 0.08, s2 * 0.22, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(s2 * 0.28, -s2 * 0.08, s2 * 0.22, 0, Math.PI * 2); ctx.fill()

      // 眼珠（竖瞳，省掉不必要的 save/restore）
      const blink = Math.sin(t * 0.0015) > 0.97 ? 0.1 : 1
      ctx.fillStyle = '#111111'
      if (blink < 1) {
        ctx.save(); ctx.scale(1, blink)
        ctx.beginPath(); ctx.ellipse(-s2 * 0.28, -s2 * 0.08, s2 * 0.08, s2 * 0.16, 0, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.ellipse(s2 * 0.28, -s2 * 0.08, s2 * 0.08, s2 * 0.16, 0, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
      } else {
        ctx.beginPath(); ctx.ellipse(-s2 * 0.28, -s2 * 0.08, s2 * 0.08, s2 * 0.16, 0, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.ellipse(s2 * 0.28, -s2 * 0.08, s2 * 0.08, s2 * 0.16, 0, 0, Math.PI * 2); ctx.fill()
      }

      // 眼神光
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.beginPath(); ctx.arc(-s2 * 0.32, -s2 * 0.14, s2 * 0.06, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(s2 * 0.24, -s2 * 0.14, s2 * 0.06, 0, Math.PI * 2); ctx.fill()

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

    const { scale: viewportScale, isMobile: isMobileView } = getDragonViewportLayout()
    const level = state.level || 1
    const levelScale = 1 + (level - 1) * 0.05
    const sizeMultiplier =
      (isMobileView && viewportScale > 1.5 ? 1.5 / viewportScale : 1) * levelScale
    const playerSize = 20 * sizeMultiplier  // 基础半径20
    const helmetSize = 15 * sizeMultiplier
    const capeWidth = 18 * sizeMultiplier
    const capeLength = 38 * sizeMultiplier

    // 🎯 等级颜色：从金色→粉金→紫金→钻石（每3关一阶段）
    const levelColorIndex = Math.min(Math.floor((level - 1) / 3), 3)  // 0~3
    const levelColors = [
      '#FFD700',  // Lv1-3: 金色
      '#FF69B4',  // Lv4-6: 粉金
      '#9370DB',  // Lv7-9: 紫金
      '#00CED1',  // Lv10+: 钻石色
    ]
    const levelAccent = levelColors[levelColorIndex]

    // 🎯 武器等级外观（随等级变化）
    const weaponLevel = Math.min(Math.floor((level - 1) / 2), 5)  // 每2关升一级，最高5级
    const weaponColors = ['#A0522D', '#CD853F', '#FFD700', '#FF4500', '#9400D3', '#00FFFF']
    const weaponColor = weaponColors[weaponLevel]
    const weaponGlowIntensity = 8 + weaponLevel * 4  // 光晕强度递增

    // 🎯 增强版：无敌状态护盾特效
    if (state.invincibleTimer > 0) {
      const shieldPulse = 1 + Math.sin(Date.now() / 80) * 0.15
      const shieldRotation = Date.now() / 400

      // 外层护盾（旋转六边形）
      ctx.save()
      ctx.rotate(shieldRotation)
      ctx.strokeStyle = 'rgba(79, 195, 247, 0.8)'
      ctx.lineWidth = 4 * sizeMultiplier
      ctx.shadowColor = '#4FC3F7'
      ctx.shadowBlur = 25 * sizeMultiplier
      
      // 绘制六边形护盾
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2
        const radius = 38 * shieldPulse * sizeMultiplier
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
      
      // 内层圆形护盾
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.lineWidth = 2.5 * sizeMultiplier
      ctx.shadowBlur = 15 * sizeMultiplier
      ctx.beginPath()
      ctx.arc(0, 0, 30 * shieldPulse * sizeMultiplier, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()

      // 护盾粒子效果（更多粒子，更大范围）
      for (let i = 0; i < 12; i++) {
        const angle = (Date.now() / 250) + (i * Math.PI / 6)
        const px = Math.cos(angle) * 35 * shieldPulse * sizeMultiplier
        const py = Math.sin(angle) * 35 * shieldPulse * sizeMultiplier
        const particleSize = (2 + Math.sin(Date.now() / 100 + i)) * sizeMultiplier

        ctx.fillStyle = `rgba(79, 195, 247, ${0.6 + Math.sin(Date.now() / 150 + i) * 0.3})`
        ctx.shadowColor = '#4FC3F7'
        ctx.shadowBlur = 12 * sizeMultiplier
        ctx.beginPath()
        ctx.arc(px, py, particleSize, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    }

    ctx.shadowBlur = 0

    // ═══════════════════════════════════════
    // 🎯 增强版：英雄射手角色设计
    // ═══════════════════════════════════════

    // 1. 披风/斗篷（动态飘动效果 - 更流畅）
    const capeWave = Math.sin(Date.now() / 150) * 4
    ctx.save()
    
    // 披风渐变（颜色随等级变化）
    const capeGrad = ctx.createLinearGradient(0, 5 * sizeMultiplier, 0, capeLength)
    const capeBaseColor = levelColorIndex % 2 === 0 ? '139, 0, 0' : '0, 100, 139'  // 红色系/蓝色系交替
    capeGrad.addColorStop(0, `rgba(${capeBaseColor}, 0.8)`)
    capeGrad.addColorStop(0.5, `rgba(${capeBaseColor}, 0.6)`)
    capeGrad.addColorStop(1, `rgba(${capeBaseColor}, 0.4)`)
    ctx.fillStyle = capeGrad

    ctx.beginPath()
    ctx.moveTo(-capeWidth, 5 * sizeMultiplier)
    ctx.quadraticCurveTo(-24 * sizeMultiplier + capeWave * sizeMultiplier, 25 * sizeMultiplier, -16 * sizeMultiplier + capeWave * 1.8 * sizeMultiplier, capeLength)
    ctx.lineTo(16 * sizeMultiplier - capeWave * 1.8 * sizeMultiplier, capeLength)
    ctx.quadraticCurveTo(24 * sizeMultiplier - capeWave * sizeMultiplier, 25 * sizeMultiplier, capeWidth, 5 * sizeMultiplier)
    ctx.closePath()
    ctx.fill()

    // 披风边缘装饰（等级颜色）
    ctx.strokeStyle = `${levelAccent}80`  // 50% alpha
    ctx.lineWidth = 1.5 * sizeMultiplier
    ctx.stroke()
    ctx.restore()

    // 2. 身体盔甲（金属质感 - 更强光泽）
    const armorGrad = ctx.createRadialGradient(-5 * sizeMultiplier, -5 * sizeMultiplier, 0, 0, 0, playerSize)
    armorGrad.addColorStop(0, '#E8E8E8')  // 亮银色高光
    armorGrad.addColorStop(0.4, '#C0C0C0')  // 银色
    armorGrad.addColorStop(0.7, '#808080')  // 中灰色
    armorGrad.addColorStop(1, '#505050')  // 深灰阴影
    ctx.fillStyle = armorGrad
    ctx.beginPath()
    ctx.arc(0, 0, playerSize, 0, Math.PI * 2)
    ctx.fill()

    // 盔甲边缘装饰（发光效果 - 等级颜色）
    ctx.strokeStyle = levelAccent
    ctx.lineWidth = 2.5 * sizeMultiplier
    ctx.shadowColor = levelAccent
    ctx.shadowBlur = 12 * sizeMultiplier
    ctx.beginPath()
    ctx.arc(0, 0, playerSize, 0, Math.PI * 2)
    ctx.stroke()
    ctx.shadowBlur = 0

    // 盔甲中心徽章（等级数字）
    ctx.fillStyle = levelAccent
    ctx.shadowColor = levelAccent
    ctx.shadowBlur = 8 * sizeMultiplier
    ctx.beginPath()
    ctx.arc(0, 0, 5 * sizeMultiplier, 0, Math.PI * 2)
    ctx.fill()

    // 显示等级数字
    ctx.shadowBlur = 0
    // 显示等级数字
    ctx.shadowBlur = 0
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `bold ${6 * sizeMultiplier}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(Math.min(level, 99)), 0, 1)
    ctx.shadowBlur = 0

    // ═══════════════════════════════════════
    // 🎯 等级星级指示器（头顶更直观显示）
    // ═══════════════════════════════════════
    const starCount = Math.min(Math.ceil(level / 3), 5)  // 每3关一个星，最多5星
    const starY = -52 * sizeMultiplier
    const starSpacing = 8 * sizeMultiplier
    const starSize = 5 * sizeMultiplier

    for (let i = 0; i < starCount; i++) {
      const starX = (i - (starCount - 1) / 2) * starSpacing
      const starPulse = 1 + Math.sin(Date.now() / 200 + i * 0.5) * 0.1

      ctx.fillStyle = levelAccent
      ctx.shadowColor = levelAccent
      ctx.shadowBlur = 8 * sizeMultiplier

      // 绘制五角星
      ctx.beginPath()
      for (let j = 0; j < 5; j++) {
        const angle = (j * 4 * Math.PI / 5) - Math.PI / 2
        const r = j % 2 === 0 ? starSize * starPulse : starSize * starPulse * 0.4
        const sx = starX + Math.cos(angle) * r
        const sy = starY + Math.sin(angle) * r
        if (j === 0) ctx.moveTo(sx, sy)
        else ctx.lineTo(sx, sy)
      }
      ctx.closePath()
      ctx.fill()
    }
    ctx.shadowBlur = 0

    // 3. 头盔/头饰（更立体的设计）
    const helmetGrad = ctx.createRadialGradient(-5 * sizeMultiplier, -10 * sizeMultiplier, 0, 0, -8 * sizeMultiplier, helmetSize)
    helmetGrad.addColorStop(0, '#F0F0F0')  // 更亮的银色
    helmetGrad.addColorStop(0.5, '#C0C0C0')
    helmetGrad.addColorStop(1, '#808080')
    ctx.fillStyle = helmetGrad
    ctx.beginPath()
    ctx.arc(0, -8 * sizeMultiplier, helmetSize, 0, Math.PI * 2)
    ctx.fill()
    
    // 头盔边缘高光
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.lineWidth = 1.5 * sizeMultiplier
    ctx.beginPath()
    ctx.arc(0, -8 * sizeMultiplier, helmetSize, 0, Math.PI * 2)
    ctx.stroke()

    // 头盔顶部装饰（羽饰 - 更大更醒目 - 等级颜色）
    ctx.save()
    const featherWave = Math.sin(Date.now() / 180) * 2 * sizeMultiplier
    ctx.fillStyle = levelAccent
    ctx.shadowColor = levelAccent
    ctx.shadowBlur = 6 * sizeMultiplier
    ctx.beginPath()
    ctx.moveTo(-10 * sizeMultiplier + featherWave, -20 * sizeMultiplier)
    ctx.quadraticCurveTo(0 + featherWave, -32 * sizeMultiplier, 10 * sizeMultiplier + featherWave, -20 * sizeMultiplier)
    ctx.quadraticCurveTo(0 + featherWave, -24 * sizeMultiplier, -10 * sizeMultiplier + featherWave, -20 * sizeMultiplier)
    ctx.fill()
    ctx.restore()

    // 4. 面部细节（更有神韵）
    // 眼睛（发光效果）
    ctx.fillStyle = '#00BFFF'  // 深天蓝眼睛
    ctx.shadowColor = '#00BFFF'
    ctx.shadowBlur = 8 * sizeMultiplier
    ctx.beginPath()
    ctx.ellipse(-5 * sizeMultiplier, -6 * sizeMultiplier, 3.5 * sizeMultiplier, 2.5 * sizeMultiplier, 0, 0, Math.PI * 2)
    ctx.ellipse(5 * sizeMultiplier, -6 * sizeMultiplier, 3.5 * sizeMultiplier, 2.5 * sizeMultiplier, 0, 0, Math.PI * 2)
    ctx.fill()
    
    // 眼白高光
    ctx.fillStyle = '#FFFFFF'
    ctx.shadowBlur = 0
    ctx.beginPath()
    ctx.arc(-4 * sizeMultiplier, -7 * sizeMultiplier, 1.2 * sizeMultiplier, 0, Math.PI * 2)
    ctx.arc(6 * sizeMultiplier, -7 * sizeMultiplier, 1.2 * sizeMultiplier, 0, Math.PI * 2)
    ctx.fill()

    // 眼眉（更锐利的表情）
    ctx.strokeStyle = '#303030'
    ctx.lineWidth = 2 * sizeMultiplier
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(-9 * sizeMultiplier, -11 * sizeMultiplier)
    ctx.lineTo(-2 * sizeMultiplier, -10 * sizeMultiplier)
    ctx.moveTo(2 * sizeMultiplier, -10 * sizeMultiplier)
    ctx.lineTo(9 * sizeMultiplier, -11 * sizeMultiplier)
    ctx.stroke()

    // 5. 武器 - 弓箭（增强版）
    ctx.save()
    // 旋转坐标系到射击方向
    ctx.rotate(state.shootAngle)

    // 弓身（更粗更有质感，颜色随等级变化）
    const bowGrad = ctx.createLinearGradient(-2, -22, 2, 22)
    bowGrad.addColorStop(0, levelAccent)
    bowGrad.addColorStop(0.5, weaponColor)
    bowGrad.addColorStop(1, weaponColor)
    ctx.strokeStyle = bowGrad
    ctx.lineWidth = 4 + weaponLevel * 0.5  // 弓身加粗
    ctx.lineCap = 'round'
    ctx.shadowColor = weaponColor
    ctx.shadowBlur = weaponGlowIntensity
    ctx.beginPath()
    ctx.arc(0, 0, 24, -Math.PI / 2.5, Math.PI / 2.5)
    ctx.stroke()
    ctx.shadowBlur = 0

    // 弓身装饰纹路（颜色随等级变化）
    ctx.strokeStyle = `${levelAccent}66`  // 40% alpha
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(0, 0, 22, -Math.PI / 3, Math.PI / 3)
    ctx.stroke()

    // 弓弦（发光效果，颜色随等级变化）
    ctx.strokeStyle = levelAccent
    ctx.lineWidth = 2
    ctx.shadowColor = levelAccent
    ctx.shadowBlur = weaponGlowIntensity * 0.8
    ctx.beginPath()
    const bowTopX = 24 * Math.cos(-Math.PI / 2.5)
    const bowTopY = 24 * Math.sin(-Math.PI / 2.5)
    const bowBottomX = 24 * Math.cos(Math.PI / 2.5)
    const bowBottomY = 24 * Math.sin(Math.PI / 2.5)
    ctx.moveTo(bowTopX, bowTopY)
    ctx.lineTo(bowBottomX, bowBottomY)
    ctx.stroke()
    ctx.shadowBlur = 0

    // 箭矢（颜色和光效随等级变化）
    const arrowGlow = 0.7 + Math.sin(Date.now() / 150) * 0.3
    ctx.strokeStyle = `${levelAccent}${Math.round(arrowGlow * 255).toString(16).padStart(2, '0')}`
    ctx.lineWidth = 3 + weaponLevel * 0.3
    ctx.shadowColor = levelAccent
    ctx.shadowBlur = weaponGlowIntensity + 2
    ctx.beginPath()
    ctx.moveTo(-6, 0)
    ctx.lineTo(38, 0)
    ctx.stroke()
    ctx.shadowBlur = 0

    // 箭头（颜色随等级变化）
    ctx.fillStyle = levelAccent
    ctx.shadowColor = levelAccent
    ctx.shadowBlur = weaponGlowIntensity
    ctx.beginPath()
    ctx.moveTo(42, 0)
    ctx.lineTo(32, -5)
    ctx.lineTo(35, 0)
    ctx.lineTo(32, 5)
    ctx.closePath()
    ctx.fill()
    ctx.shadowBlur = 0

    // 箭头高光
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.moveTo(40, 0)
    ctx.lineTo(34, -2)
    ctx.lineTo(36, 0)
    ctx.lineTo(34, 2)
    ctx.closePath()
    ctx.fill()

    // 箭羽（颜色随等级变化）
    ctx.save()
    const fletchWave = Math.sin(Date.now() / 120) * 1.5
    ctx.fillStyle = levelAccent
    ctx.shadowColor = levelAccent
    ctx.shadowBlur = weaponGlowIntensity * 0.5
    ctx.beginPath()
    ctx.moveTo(-6, 0)
    ctx.lineTo(-12, -4 + fletchWave)
    ctx.lineTo(-9, 0)
    ctx.lineTo(-12, 4 - fletchWave)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    ctx.restore()

    // ── 选中/未选中特效（增强版）──
    if (!state.isSelected) {
      // 未选中：灰色虚线环 + 暗淡
      ctx.save()
      ctx.globalAlpha = 0.5
      ctx.setLineDash([6, 4])
      ctx.strokeStyle = 'rgba(180, 180, 180, 0.6)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, 35, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()

      // 提示文字（更醒目）
      ctx.fillStyle = 'rgba(220, 220, 220, 0.9)'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.shadowColor = 'rgba(0,0,0,0.9)'
      ctx.shadowBlur = 4
      ctx.fillText('👆 点击选中', 0, -38)
      ctx.shadowBlur = 0
    } else {
      // 选中：金色脉冲光环 + 能量粒子（增强版）
      const selPulse = 1 + Math.sin(Date.now() / 150) * 0.1
      
      // 外层光环（旋转八角星）
      ctx.save()
      const starRotation = Date.now() / 800
      ctx.rotate(starRotation)
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.8 + Math.sin(Date.now() / 150) * 0.2})`
      ctx.lineWidth = 3
      ctx.shadowColor = '#FFD700'
      ctx.shadowBlur = 20
      
      ctx.beginPath()
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        const outerR = 42 * selPulse
        const innerR = 36 * selPulse
        const x1 = Math.cos(angle) * outerR
        const y1 = Math.sin(angle) * outerR
        const midAngle = angle + Math.PI / 8
        const x2 = Math.cos(midAngle) * innerR
        const y2 = Math.sin(midAngle) * innerR
        if (i === 0) ctx.moveTo(x1, y1)
        else ctx.lineTo(x1, y1)
        ctx.lineTo(x2, y2)
      }
      ctx.closePath()
      ctx.stroke()
      ctx.restore()
      
      // 内层圆形光环
      ctx.save()
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 + Math.sin(Date.now() / 200) * 0.3})`
      ctx.lineWidth = 2
      ctx.shadowColor = '#FFFFFF'
      ctx.shadowBlur = 15
      ctx.beginPath()
      ctx.arc(0, 0, 35 * selPulse, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()

      // 四角星光（更大更亮）
      const starAngle = Date.now() / 500
      ctx.strokeStyle = '#FFD700'
      ctx.lineWidth = 2.5
      ctx.shadowColor = '#FFD700'
      ctx.shadowBlur = 15
      for (let i = 0; i < 4; i++) {
        const a = starAngle + (i * Math.PI / 2)
        const sx = Math.cos(a) * 45
        const sy = Math.sin(a) * 45
        // 十字星芒（更长）
        ctx.beginPath()
        ctx.moveTo(sx - 8, sy)
        ctx.lineTo(sx + 8, sy)
        ctx.moveTo(sx, sy - 8)
        ctx.lineTo(sx, sy + 8)
        ctx.stroke()
        // 对角线星芒
        ctx.beginPath()
        ctx.moveTo(sx - 5, sy - 5)
        ctx.lineTo(sx + 5, sy + 5)
        ctx.moveTo(sx - 5, sy + 5)
        ctx.lineTo(sx + 5, sy - 5)
        ctx.stroke()
        // 中心光点（更大）
        ctx.fillStyle = '#FFFACD'
        ctx.shadowColor = '#FFFACD'
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(sx, sy, 3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0
      
      // 能量粒子环绕
      for (let i = 0; i < 6; i++) {
        const particleAngle = (Date.now() / 400) + (i * Math.PI / 3)
        const px = Math.cos(particleAngle) * 40
        const py = Math.sin(particleAngle) * 40
        const particleSize = 2 + Math.sin(Date.now() / 100 + i) * 1
        
        ctx.fillStyle = `rgba(255, 215, 0, ${0.7 + Math.sin(Date.now() / 150 + i) * 0.3})`
        ctx.shadowColor = '#FFD700'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(px, py, particleSize, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0

      // 选中提示（更醒目）
      ctx.fillStyle = 'rgba(255, 215, 0, 1)'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.shadowColor = 'rgba(0,0,0,0.9)'
      ctx.shadowBlur = 5
      ctx.fillText('✨ 已选中 - 可移动', 0, -38)
      ctx.shadowBlur = 0
    }

    ctx.restore()

    // 🎯 已删除：射击方向指示器（箭头、虚线、角度刻度、度数文字）
  }

  // ========== 子弹 ==========
  // 简化的子弹渲染（性能优化版）
  function drawBullets() {
    for (const b of state.bullets) {
      const angle = Math.atan2(b.vy || 0, b.vx || 0)
      ctx.save()
      ctx.translate(b.x, b.y)
      ctx.rotate(angle + Math.PI / 2)

      // 剑形子弹（简化版）
      ctx.fillStyle = '#00FFFF'
      ctx.shadowColor = '#00FFFF'
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.moveTo(0, -22)
      ctx.lineTo(3, -10)
      ctx.lineTo(2, 8)
      ctx.lineTo(0, 12)
      ctx.lineTo(-2, 8)
      ctx.lineTo(-3, -10)
      ctx.closePath()
      ctx.fill()

      // 剑身高光
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'
      ctx.lineWidth = 1
      ctx.shadowBlur = 0
      ctx.beginPath()
      ctx.moveTo(0, -18)
      ctx.lineTo(0, 10)
      ctx.stroke()

      ctx.restore()
    }
  }

  // ========== 🎯 道具加持特效 ==========
  function drawPowerupEffects() {
    // 绘制扩散光环
    for (const ring of state.powerupEffects.rings) {
      ctx.save()
      ctx.globalAlpha = ring.alpha
      ctx.strokeStyle = ring.color
      ctx.lineWidth = ring.lineWidth
      ctx.shadowColor = ring.color
      ctx.shadowBlur = 15
      
      ctx.beginPath()
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2)
      ctx.stroke()
      
      // 内层光晕
      ctx.globalAlpha = ring.alpha * 0.3
      ctx.fillStyle = ring.color
      ctx.beginPath()
      ctx.arc(ring.x, ring.y, ring.radius * 0.9, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.restore()
    }
  }

  function drawScreenFlash() {
    // 新增screenFlash闪烁效果
    if (state.screenFlash && state.screenFlash.alpha > 0) {
      ctx.save()
      ctx.globalAlpha = state.screenFlash.alpha
      ctx.fillStyle = state.screenFlash.color
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
      ctx.restore()
    }
    // 原有flashAlpha效果
    if (state.powerupEffects.flashAlpha > 0) {
      ctx.save()
      ctx.globalAlpha = state.powerupEffects.flashAlpha
      ctx.fillStyle = state.powerupEffects.flashColor
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
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
    // 绘制环形粒子（光环，不填充）
    for (const p of state.particles) {
      if ((p as any).ring) {
        ctx.save()
        ctx.globalAlpha = (p.life / p.maxLife) * 0.6
        ctx.strokeStyle = p.color
        ctx.lineWidth = 3
        ctx.shadowColor = p.color
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }
    }
  }

  // ========== 全屏冲击波 ==========
  function drawScreenWave() {
    const sw = state.powerupEffects.screenWave
    if (!sw || sw.alpha <= 0) return
    ctx.save()
    ctx.globalAlpha = sw.alpha
    ctx.strokeStyle = sw.color
    ctx.lineWidth = 8
    ctx.shadowColor = sw.color
    ctx.shadowBlur = 20
    ctx.beginPath()
    ctx.arc(state.playerX, state.playerY, sw.radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
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

    // 🎯 显示当前伤害值（让玩家看到升级效果）
    ctx.fillStyle = '#FF6B6B'
    ctx.font = 'bold 11px sans-serif'
    ctx.fillText(`⚔️${state.bulletDamage}`, BASE_W - 12, 58)

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
        const bw = 60  // 🎯 增加宽度以容纳更多文字
        const bh = 18  // 🎯 增加高度
        const bx = 8 + i * (bw + 4)

        // 🎯 最后3秒闪烁效果
        const isExpiring = buff.remaining <= 3
        const blinkAlpha = isExpiring ? (Math.sin(Date.now() / 100) * 0.3 + 0.7) : 1

        // 背景（带闪烁）
        ctx.fillStyle = `rgba(0,0,0,${0.65 * blinkAlpha})`
        ctx.beginPath()
        ctx.roundRect(bx, buffBarY - bh, bw, bh, 4)
        ctx.fill()

        // 进度条（从右往左缩短）
        const ratio = Math.max(0, buff.remaining / buff.duration)
        if (ratio > 0) {
          ctx.fillStyle = buff.color
          ctx.globalAlpha = 0.5 * blinkAlpha
          ctx.beginPath()
          ctx.roundRect(bx + 1, buffBarY - bh + 1, (bw - 2) * ratio, bh - 2, 3)
          ctx.fill()
          ctx.globalAlpha = 1
        }

        // 图标
        ctx.fillStyle = '#fff'
        ctx.font = '12px sans-serif'  // 🎯 增大图标
        ctx.textBaseline = 'middle'
        ctx.fillText(buff.icon, bx + 4, buffBarY - bh / 2)

        // 🎯 道具名称缩写（前2个字符）
        ctx.fillStyle = `rgba(255,255,255,${0.8 * blinkAlpha})`
        ctx.font = 'bold 9px sans-serif'
        ctx.textAlign = 'center'
        const shortName = buff.name.substring(0, 2)
        ctx.fillText(shortName, bx + 20, buffBarY - bh / 2)

        // 🎯 剩余秒数（整数，最后3秒红色闪烁）
        const remainingSecs = Math.ceil(buff.remaining)
        ctx.fillStyle = isExpiring ? '#FF4444' : '#fff'
        ctx.font = 'bold 11px sans-serif'  // 🎯 增大数字
        ctx.textAlign = 'right'
        ctx.fillText(`${remainingSecs}s`, bx + bw - 4, buffBarY - bh / 2)
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

  // ========== 开始界面（与 spaceShooter/rpgShooter 同一模板风格） ==========
  function drawStartScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, BASE_H / 2 - 65, BASE_W, 130)
    ctx.fillStyle = '#fff'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('🐉 打龙小游戏', BASE_W / 2, BASE_H / 2 - 20)
    ctx.font = '14px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.fillText('滑动控制飞船，自动射击消灭神龙！', BASE_W / 2, BASE_H / 2 + 8)
    ctx.fillStyle = '#00E5FF'; ctx.font = 'bold 15px sans-serif'
    ctx.fillText('🤖 自动射击！只需移动飞船！', BASE_W / 2, BASE_H / 2 + 30)
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '12px sans-serif'
    ctx.fillText('点击屏幕开始 · 连击越多越爽！', BASE_W / 2, BASE_H / 2 + 50)
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

    // 🎯 简化版：6个核心按钮
    const totalBtns = 6
    const btnY = CANVAS_H - 85
    const btnH = 48
    const btnW = 58
    const btnGap = 6
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

    // 1. 新建路线（开始新的一条）
    drawButton(btnStartX, btnY, btnW, btnH, '#9C27B0', '➕ 新建')
    
    // 2. 重置当前路线
    drawButton(btnStartX + btnW + btnGap, btnY, btnW, btnH, '#FF6B6B', '🗑️ 重置')
    
    // 3. 画路线（默认模式）
    const isRouteMode = routeEditor.activeMode === 'route'
    drawButton(btnStartX + (btnW + btnGap) * 2, btnY, btnW, btnH, isRouteMode ? '#E040FB' : '#7B1FA2', '✏️ 画路线', isRouteMode)
    
    // 4. 设置起点
    const isPlayerStartMode = routeEditor.activeMode === 'playerStart'
    drawButton(btnStartX + (btnW + btnGap) * 3, btnY, btnW, btnH, isPlayerStartMode ? '#00FF88' : '#2E7D32', '🎯 起点', isPlayerStartMode)
    
    // 5. 保存
    drawButton(btnStartX + (btnW + btnGap) * 4, btnY, btnW, btnH, '#4CAF50', '💾 保存')
    
    // 6. 导出JSON
    drawButton(btnStartX + (btnW + btnGap) * 5, btnY, btnW, btnH, '#2196F3', '📥 导出')
    
    // 6. 返回（单独一行，居中）
    const returnBtnW = 100
    const returnBtnX = (CANVAS_W - returnBtnW) / 2
    drawButton(returnBtnX, btnY + btnH + 8, returnBtnW, 40, '#FF5722', '⬅️ 返回')

    // 简洁提示
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('点击“新建”创建多条路线 | “重置”清除当前路线', CANVAS_W / 2, btnY + btnH * 2 + 55)
    
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

  // ========== 游戏结束（区分通关/死亡） ==========
  function drawGameOver(victory: boolean) {
    // 背景遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, BASE_H / 2 - 80, BASE_W, 160)
    
    if (victory) {
      // 🎉 通关特效：金色主题 + 庆祝
      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 32px sans-serif'
      ctx.textAlign = 'center'
      ctx.shadowColor = '#FFD700'
      ctx.shadowBlur = 15
      ctx.fillText('🎉 恭喜通关!', BASE_W / 2, BASE_H / 2 - 45)
      ctx.shadowBlur = 0
      
      // 通关统计信息
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '18px sans-serif'
      ctx.fillText(`最终得分: ${state.score}`, BASE_W / 2, BASE_H / 2 - 10)
      ctx.fillText(`到达关卡: ${state.level}`, BASE_W / 2, BASE_H / 2 + 15)
      ctx.fillText(`最高连击: ${state.maxCombo}x`, BASE_W / 2, BASE_H / 2 + 40)
      
      // 通关提示
      ctx.fillStyle = '#4CAF50'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText('✨ 太棒了！点击重新开始 ✨', BASE_W / 2, BASE_H / 2 + 68)
    } else {
      // 💀 死亡特效：红色主题
      ctx.fillStyle = '#FF4757'
      ctx.font = 'bold 28px sans-serif'
      ctx.textAlign = 'center'
      ctx.shadowColor = '#FF4757'
      ctx.shadowBlur = 10
      ctx.fillText('💀 游戏结束', BASE_W / 2, BASE_H / 2 - 40)
      ctx.shadowBlur = 0
      
      // 死亡统计信息
      ctx.fillStyle = '#fff'
      ctx.font = '18px sans-serif'
      ctx.fillText(`最终得分: ${state.score}`, BASE_W / 2, BASE_H / 2 - 5)
      ctx.fillText(`到达关卡: ${state.level}`, BASE_W / 2, BASE_H / 2 + 20)
      ctx.fillText(`最高连击: ${state.maxCombo}x`, BASE_W / 2, BASE_H / 2 + 45)
      
      // 重试提示
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font = '14px sans-serif'
      ctx.fillText('点击重新开始', BASE_W / 2, BASE_H / 2 + 70)
    }
  }

  // ========== 关卡完成界面 ==========
  function drawLevelComplete() {
    // 🎯 如果正在过渡，使用淡出效果
    const alpha = state.levelTransition ? Math.max(0, state.levelTransitionTimer) : 1
    
    // 全屏遮罩（带透明度）
    ctx.fillStyle = `rgba(0, 0, 0, ${0.85 * alpha})`
    ctx.fillRect(0, 0, BASE_W, BASE_H)

    // 标题（带透明度）
    ctx.globalAlpha = alpha
    ctx.fillStyle = '#4CAF50'
    ctx.font = 'bold 36px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🎉 关卡通过!', BASE_W / 2, BASE_H / 2 - 100)

    // 分割线
    ctx.strokeStyle = `rgba(255,255,255,${0.2 * alpha})`
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

    // 下一关按钮（带透明度）
    const btnW = 200
    const btnH = 50
    const btnX = BASE_W / 2 - btnW / 2
    const btnY = BASE_H / 2 + 60

    // 按钮背景（带渐变和透明度）
    const grad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH)
    grad.addColorStop(0, `rgba(76, 175, 80, ${alpha})`)
    grad.addColorStop(1, `rgba(56, 142, 60, ${alpha})`)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.roundRect(btnX, btnY, btnW, btnH, 10)
    ctx.fill()

    // 按钮文字
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 20px sans-serif'
    ctx.fillText(`进入第 ${state.level} 关`, BASE_W / 2, btnY + 33)

    // 提示
    ctx.fillStyle = `rgba(255,255,255,${0.5 * alpha})`
    ctx.font = '12px sans-serif'
    ctx.fillText('点击按钮继续', BASE_W / 2, btnY + btnH + 20)
    
    ctx.globalAlpha = 1
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

    // 🎯 更新并应用屏幕闪烁效果
    if (state.screenFlash && state.screenFlash.duration > 0) {
      const dt = 1 / 60
      state.screenFlash.duration -= dt
      state.screenFlash.alpha = Math.max(0, state.screenFlash.alpha - dt * 2)
      if (state.screenFlash.duration <= 0) {
        state.screenFlash.alpha = 0
      }
    }

    // 🎯 应用屏幕震动效果
    if (state.screenShake.duration > 0) {
      const shakeX = (Math.random() - 0.5) * state.screenShake.intensity * 2
      const shakeY = (Math.random() - 0.5) * state.screenShake.intensity * 2
      ctx.translate(shakeX, shakeY)

      // 更新震动状态
      const deltaTime = 1 / 60  // 假设60FPS
      state.screenShake.duration -= deltaTime

      // 🎯 同时减少冷却时间
      if (state.screenShake.cooldown > 0) {
        state.screenShake.cooldown -= deltaTime
        if (state.screenShake.cooldown < 0) {
          state.screenShake.cooldown = 0
        }
      }

      if (state.screenShake.duration <= 0) {
        state.screenShake.intensity = 0
        state.screenShake.duration = 0
      }
    }

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
      if (state.dragons.length > 0 && !getDragonViewportLayout().isMobile) {
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
        // 判断是否通关（到达最终关卡或时间到）
        const isVictory = state.level >= 10 || state.timeLeft <= 0
        drawGameOver(isVictory)
      }

      if (state.phase === 'powerup_select') {
        drawPowerUpSelectOverlay()
      }

      if (state.phase === 'levelComplete') {
        drawLevelComplete()
      }
      
      // 🎯 绘制道具加持特效（光环扩散）
      drawPowerupEffects()
      // 🎯 绘制全屏冲击波
      drawScreenWave()
    }

    ctx.restore()

    // 🎯 绘制屏幕闪光（在全屏层面，不受裁剪影响）
    drawScreenFlash()
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

    // 三张卡片（使用预计算几何）
    for (let i = 0; i < ps.cards.length; i++) {
      const card = ps.cards[i]
      const cr = _cardRects[i]
      const cx = cr.x + cr.w / 2
      const cy = cr.y + cr.h / 2

      const isRevealed = ps.revealedIdx === i
      const isOtherRevealed = ps.revealedIdx !== null && ps.revealedIdx !== i
      const flipT = isRevealed ? ps.revealProgress : (isOtherRevealed ? 1 : 0)
      const closeScale = ps.closing ? Math.max(0.01, 1 - ps.closeProgress * 0.3) : 1
      const floatY = isRevealed ? 0 : Math.sin(t / 400 + i * 1.2) * 4
      const flipScaleX = Math.max(-1, 1 - flipT * 2)
      const showingFront = flipT > 0.5

      // 整体变换：位移 + 关闭缩放 + 翻转
      ctx.save()
      ctx.translate(cx, cy + floatY)
      ctx.scale(closeScale * (showingFront ? Math.abs(flipScaleX) : flipScaleX), closeScale)

      if (showingFront) {
        // === 正面：渐变填充 + 描边 ===
        const grad = ctx.createLinearGradient(-_CARD_W / 2, -_CARD_H / 2, _CARD_W / 2, _CARD_H / 2)
        grad.addColorStop(0, '#2a2a4a')
        grad.addColorStop(1, '#1a1a2e')
        ctx.beginPath()
        roundRect(ctx, -_CARD_W / 2, -_CARD_H / 2, _CARD_W, _CARD_H, _CARD_RADIUS)
        ctx.fillStyle = grad
        ctx.fill()
        ctx.strokeStyle = card.color
        ctx.lineWidth = 2.5
        ctx.shadowColor = card.color
        ctx.shadowBlur = 15
        ctx.stroke()

        // 金色选中边框
        ctx.strokeStyle = '#FFD700'
        ctx.lineWidth = 3
        ctx.shadowColor = '#FFD700'
        ctx.shadowBlur = 20
        ctx.beginPath()
        roundRect(ctx, -_CARD_W / 2 - 3, -_CARD_H / 2 - 3, _CARD_W + 6, _CARD_H + 6, _CARD_RADIUS + 2)
        ctx.stroke()

        // 图标
        ctx.shadowBlur = 20
        ctx.shadowColor = card.color
        ctx.fillStyle = card.color
        ctx.font = '36px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(card.icon, 0, -_CARD_H / 4 + 10)

        // 名称
        ctx.shadowBlur = 0
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 11px sans-serif'
        ctx.fillText(card.name || '', 0, 8)

        // 描述（最多24字分两行）
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.font = '9px sans-serif'
        ctx.textBaseline = 'top'
        const descText = card.desc || ''
        if (descText.length > 12) {
          ctx.fillText(descText.slice(0, 12), 0, 24)
          ctx.fillText(descText.slice(12, 24), 0, 36)
        } else {
          ctx.fillText(descText, 0, 24)
        }
      } else {
        // === 背面 ===
        const grad = ctx.createLinearGradient(-_CARD_W / 2, -_CARD_H / 2, _CARD_W / 2, _CARD_H / 2)
        grad.addColorStop(0, '#3a2a5a')
        grad.addColorStop(1, '#2a1a4a')
        ctx.beginPath()
        roundRect(ctx, -_CARD_W / 2, -_CARD_H / 2, _CARD_W, _CARD_H, _CARD_RADIUS)
        ctx.fillStyle = grad
        ctx.fill()

        ctx.strokeStyle = isOtherRevealed ? 'rgba(255,255,255,0.15)' : 'rgba(180, 120, 255, 0.8)'
        ctx.lineWidth = isOtherRevealed ? 1 : 2
        ctx.shadowColor = '#9B59B6'
        ctx.shadowBlur = isOtherRevealed ? 4 : 10
        ctx.beginPath()
        roundRect(ctx, -_CARD_W / 2, -_CARD_H / 2, _CARD_W, _CARD_H, _CARD_RADIUS)
        ctx.stroke()

        // 问号
        ctx.shadowBlur = 8
        ctx.shadowColor = '#BB77FF'
        ctx.fillStyle = 'rgba(180, 120, 255, 0.9)'
        ctx.font = 'bold 40px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('?', 0, -8)

        // 装饰文字
        ctx.strokeStyle = 'rgba(180, 120, 255, 0.5)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(-_CARD_W * 0.3, _CARD_H * 0.25)
        ctx.lineTo(_CARD_W * 0.3, _CARD_H * 0.25)
        ctx.stroke()
        ctx.fillStyle = 'rgba(180, 120, 255, 0.7)'
        ctx.font = '9px sans-serif'
        ctx.fillText('点击选择', 0, _CARD_H * 0.25 + 14)
      }

      ctx.restore()
    }
  }

  return { render }
}
