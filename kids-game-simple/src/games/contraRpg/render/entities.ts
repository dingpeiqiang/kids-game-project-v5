import { GAME_CONFIG } from '../config'
import type { Player, Enemy } from '../types'

interface PlayerGradients {
  bodyGlow: CanvasGradient
  bodyGrad: CanvasGradient
  coreGlow: CanvasGradient
  headGlow: CanvasGradient
  gunGlow: CanvasGradient
  levelGlow: CanvasGradient
}

const playerGradientCache = new Map<number, PlayerGradients>()
const shieldGradCache = new Map<string, CanvasGradient>()
const flameGradCache = new Map<string, CanvasGradient>()
const muzzleGradCache = new Map<string, { radial: CanvasGradient; linear: CanvasGradient }>()
const enemyGlowGradCache = new Map<string, CanvasGradient>()
const enemyBodyGradCache = new Map<string, CanvasGradient>()
const auraGradCache = new Map<string, CanvasGradient>()

function getPlayerGradients(ctx: CanvasRenderingContext2D, level: number): PlayerGradients {
  const cached = playerGradientCache.get(level)
  if (cached) return cached

  const bodyColor = level >= 5 ? '#9C27B0' : '#4a90d9'

  const bodyGlow = ctx.createRadialGradient(0, 8, 0, 0, 8, 20 + level * 2)
  bodyGlow.addColorStop(0, `${bodyColor}40`)
  bodyGlow.addColorStop(1, 'transparent')

  const bodyGrad = ctx.createLinearGradient(-(20 + level * 2) / 2, 8, (20 + level * 2) / 2, 8)
  bodyGrad.addColorStop(0, level >= 5 ? '#8E24AA' : '#3a7ac9')
  bodyGrad.addColorStop(0.5, bodyColor)
  bodyGrad.addColorStop(1, level >= 5 ? '#8E24AA' : '#3a7ac9')

  const coreGlow = ctx.createRadialGradient(0, 8, 0, 0, 8, 8)
  coreGlow.addColorStop(0, level >= 5 ? 'rgba(238, 130, 238, 1)' : 'rgba(100, 200, 255, 1)')
  coreGlow.addColorStop(1, 'transparent')

  const headGlow = ctx.createRadialGradient(0, -10, 0, 0, -10, 10 + level + 5)
  headGlow.addColorStop(0, 'rgba(255, 204, 153, 0.3)')
  headGlow.addColorStop(1, 'transparent')

  const gunGlowColor = level >= 5 ? '#E040FB' : '#00E5FF'
  const gunGlow = ctx.createRadialGradient(0, 7, 0, 0, 7, 15)
  gunGlow.addColorStop(0, `${gunGlowColor}60`)
  gunGlow.addColorStop(1, 'transparent')

  const levelGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 15)
  levelGlow.addColorStop(0, level >= 5 ? 'rgba(224, 64, 251, 0.5)' : 'rgba(255, 255, 255, 0.3)')
  levelGlow.addColorStop(1, 'transparent')

  const gradients: PlayerGradients = { bodyGlow, bodyGrad, coreGlow, headGlow, gunGlow, levelGlow }
  playerGradientCache.set(level, gradients)
  return gradients
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  input: { left: boolean; right: boolean; jump: boolean; shoot: boolean; crouch: boolean; stickX: number; stickY: number },
  shieldTimer: number,
  rapidFireTimer: number,
  spreadShotTimer: number,
  transformTimer: number = 0,
  shootAngle: number = 0,
) {
  const p = player
  const t = Date.now()
  const level = p.attackLevel
  const gradients = getPlayerGradients(ctx, level)
  // 判断是否在移动：键盘输入或遥感输入
  const isMoving = input.left || input.right || (Math.abs(input.stickX) > 0.1)
  const isShooting = input.shoot
  const isTransformed = transformTimer > 0
  const isJumping = !p.isGrounded && p.vy < 0
  const isFalling = !p.isGrounded && p.vy >= 0
  const jumpProgress = isJumping ? Math.abs(p.vy) / Math.abs(GAME_CONFIG.PLAYER_JUMP_FORCE) : (isFalling ? p.vy / GAME_CONFIG.GRAVITY / 20 : 0)
  const isRunning = isMoving && p.isGrounded && Math.abs(p.vx) > 5
  const legCycleSpeed = isRunning ? 1.5 : 1

  ctx.save()
  ctx.translate(p.x + p.width / 2, p.y + p.height / 2)

  if (p.invincible > 0 && Math.floor(p.invincible / 100) % 2 === 0) {
    ctx.globalAlpha = 0.5
  }

  if (shieldTimer > 0) {
    const pulse = 1 + Math.sin(t / 100) * 0.1
    const rotation = t / 500

    const shieldKey = `shield_${Math.round(pulse * 10)}`
    let shieldGrad = shieldGradCache.get(shieldKey)
    if (!shieldGrad) {
      shieldGrad = ctx.createRadialGradient(0, 0, 30, 0, 0, 40)
      shieldGrad.addColorStop(0, 'transparent')
      shieldGrad.addColorStop(0.8, 'rgba(68, 136, 255, 0.3)')
      shieldGrad.addColorStop(1, 'rgba(68, 136, 255, 0.8)')
      shieldGradCache.set(shieldKey, shieldGrad)
    }

    ctx.save()
    ctx.rotate(rotation)

    ctx.fillStyle = shieldGrad
    ctx.beginPath()
    ctx.arc(0, 0, 40 * pulse, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = 'rgba(68, 136, 255, 0.9)'
    ctx.lineWidth = 3
    ctx.shadowColor = '#4488ff'
    ctx.shadowBlur = 15
    ctx.beginPath()
    ctx.arc(0, 0, 38 * pulse, 0, Math.PI * 2)
    ctx.stroke()

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.lineWidth = 2
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(0, 0, 30 * pulse, 0, Math.PI * 2)
    ctx.stroke()

    for (let i = 0; i < 8; i++) {
      const angle = (t / 180) + (i * Math.PI * 2 / 8)
      const px = Math.cos(angle) * 35 * pulse
      const py = Math.sin(angle) * 35 * pulse
      const particlePulse = 0.5 + 0.5 * Math.sin(t / 60 + i * 0.5)
      const particleSize = 3 + particlePulse * 2

      ctx.fillStyle = '#88CCFF'
      ctx.shadowColor = '#88CCFF'
      ctx.shadowBlur = particleSize * 2
      ctx.globalAlpha = particlePulse * 0.8
      ctx.beginPath()
      ctx.arc(px, py, particleSize, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.shadowBlur = 0
    ctx.restore()
  }

  // 变身特效：金色光环 + 星芒粒子
  if (isTransformed) {
    const pulse = 1 + Math.sin(t / 80) * 0.15
    const rotation = t / 400

    // 外层大光环
    ctx.save()
    const auraGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 60 * pulse)
    auraGrad.addColorStop(0, 'rgba(255, 215, 0, 0.05)')
    auraGrad.addColorStop(0.4, 'rgba(255, 215, 0, 0.25)')
    auraGrad.addColorStop(0.8, 'rgba(255, 180, 0, 0.1)')
    auraGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = auraGrad
    ctx.beginPath()
    ctx.arc(0, 8, 60 * pulse, 0, Math.PI * 2)
    ctx.fill()

    // 旋转星芒
    ctx.rotate(rotation)
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12
      const r = 45 * pulse
      const sx = Math.cos(angle) * r
      const sy = Math.sin(angle) * r
      const size = 3 + Math.sin(t / 120 + i) * 1.5

      ctx.fillStyle = `rgba(255, 255, 200, ${0.3 + 0.3 * Math.sin(t / 100 + i * 0.5)})`
      ctx.shadowColor = '#FFD700'
      ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.arc(sx, sy, size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.shadowBlur = 0
    ctx.restore()

    // 金色轮廓描边
    ctx.save()
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 + 0.3 * Math.sin(t / 100)})`
    ctx.lineWidth = 2 + Math.sin(t / 60) * 0.5
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 15
    const bw = 20 + level * 2
    const bh = 28
    ctx.strokeRect(-bw / 2 - 6, 8 - bh / 2 - 6, bw + 12, bh + 12)
    ctx.shadowBlur = 0
    ctx.restore()
  }

  if (p.invincible > 0 && shieldTimer <= 0) {
    const flash = Math.sin(t / 60) * 0.3 + 0.5
    ctx.save()
    ctx.globalAlpha = flash

    let auraGrad = auraGradCache.get('invincible')
    if (!auraGrad) {
      auraGrad = ctx.createRadialGradient(0, 0, 25, 0, 0, 35)
      auraGrad.addColorStop(0, 'transparent')
      auraGrad.addColorStop(0.7, 'rgba(79, 195, 247, 0.3)')
      auraGrad.addColorStop(1, 'rgba(79, 195, 247, 0.65)')
      auraGradCache.set('invincible', auraGrad)
    }
    ctx.fillStyle = auraGrad
    ctx.beginPath()
    ctx.arc(0, 0, 35, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = `rgba(79, 195, 247, ${0.6 + flash * 0.3})`
    ctx.lineWidth = 3
    ctx.shadowColor = '#4FC3F7'
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(0, 0, 30, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  if (isMoving || !p.isGrounded) {
    const flameCount = 3
    const flameLevelKey = `flame_${level >= 5 ? 'purple' : 'blue'}`
    for (let i = 0; i < flameCount; i++) {
      const offsetX = (i - 1) * 3
      const flicker = Math.sin(t / 50 + i * 2.3) * 3 + 4
      const flameHeight = 10 + flicker + level * 1.2

      let flameGrad = flameGradCache.get(flameLevelKey)
      if (!flameGrad) {
        flameGrad = ctx.createLinearGradient(-2, 14, -2, 14 + 40)
        if (level >= 5) {
          flameGrad.addColorStop(0, '#76FF03')
          flameGrad.addColorStop(0.3, '#00E676')
          flameGrad.addColorStop(0.6, '#FF6B6B')
          flameGrad.addColorStop(1, 'transparent')
        } else {
          flameGrad.addColorStop(0, '#80DEEA')
          flameGrad.addColorStop(0.4, '#00E5FF')
          flameGrad.addColorStop(0.7, '#FF6B6B')
          flameGrad.addColorStop(1, 'transparent')
        }
        flameGradCache.set(flameLevelKey, flameGrad)
      }

      ctx.fillStyle = flameGrad
      ctx.shadowColor = level >= 5 ? '#76FF03' : '#00E5FF'
      ctx.shadowBlur = 10

      ctx.beginPath()
      const baseWidth = 4 + Math.sin(t / 30 + i) * 2
      ctx.moveTo(offsetX - baseWidth, 14)
      ctx.lineTo(offsetX, 14 + flameHeight)
      ctx.lineTo(offsetX + baseWidth, 14)
      ctx.closePath()
      ctx.fill()
    }
    ctx.shadowBlur = 0
  }

  const bodyColor = isTransformed ? '#FFD700' : (level >= 5 ? '#9C27B0' : '#4a90d9')

  const bodyY = 8
  const bodyWidth = 20 + level * 2
  const bodyHeight = 28

  ctx.shadowColor = bodyColor
  ctx.shadowBlur = 5 + Math.sin(t / 300) * 2
  const breathing = 1 + Math.sin(t / 400) * 0.03
  const sway = isMoving ? Math.sin(t / 100) * 0.5 : 0
  const bodyAngle = (isJumping ? -0.1 - jumpProgress * 0.15 : (isFalling ? 0.1 + jumpProgress * 0.1 : 0)) + sway * 0.05

  ctx.save()
  ctx.scale(breathing, breathing)
  ctx.rotate(bodyAngle)

  // 手臂摆动动画
  const armSwing = isMoving ? Math.sin(t / 60 * legCycleSpeed) * 0.4 : Math.sin(t / 500) * 0.05
  const armLength = 16 + level
  const armWidth = 6

  // 左臂
  ctx.save()
  ctx.translate(-bodyWidth / 2 - 2, bodyY - bodyHeight / 2 + 8)
  ctx.rotate(-armSwing + (isShooting ? 0.3 : 0))
  ctx.fillStyle = bodyColor
  ctx.beginPath()
  ctx.roundRect(-armWidth / 2, 0, armWidth, armLength, 2)
  ctx.fill()
  // 手部
  ctx.fillStyle = '#ffcc99'
  ctx.beginPath()
  ctx.arc(0, armLength, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // 右臂（持枪）- 与枪杆对齐
  ctx.save()
  ctx.translate(bodyWidth / 2 + 2, bodyY - bodyHeight / 2 + 8)
  // 手臂角度与枪杆角度对齐
  const armAngle = armSwing + shootAngle - (p.facingRight ? 0 : Math.PI)
  ctx.rotate(armAngle)
  ctx.fillStyle = bodyColor
  ctx.beginPath()
  ctx.roundRect(-armWidth / 2, 0, armWidth, armLength, 2)
  ctx.fill()
  // 手部
  ctx.fillStyle = '#ffcc99'
  ctx.beginPath()
  ctx.arc(0, armLength, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = gradients.bodyGlow
  ctx.fillRect(-bodyWidth, bodyY - bodyHeight, bodyWidth * 2, bodyHeight * 2)

  ctx.fillStyle = gradients.bodyGrad
  ctx.beginPath()
  ctx.roundRect(-bodyWidth / 2, bodyY - bodyHeight / 2, bodyWidth, bodyHeight, 5)
  ctx.fill()

  ctx.restore()
  ctx.shadowBlur = 0

  ctx.fillStyle = level >= 5 ? '#BA68C8' : '#5AA3DD'
  ctx.fillRect(-bodyWidth / 2 + 4, bodyY - bodyHeight / 2 + 6, bodyWidth - 8, 3)
  ctx.fillRect(-bodyWidth / 2 + 4, bodyY, bodyWidth - 8, 2)
  ctx.fillRect(-bodyWidth / 2 + 4, bodyY + bodyHeight / 2 - 9, bodyWidth - 8, 3)

  const corePulse = 0.8 + 0.2 * Math.sin(t / 150)
  ctx.save()
  ctx.globalAlpha = corePulse
  ctx.fillStyle = gradients.coreGlow
  ctx.beginPath()
  ctx.arc(0, bodyY, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = level >= 5 ? '#E1BEE7' : '#B3E5FC'
  ctx.shadowColor = level >= 5 ? '#E1BEE7' : '#B3E5FC'
  ctx.shadowBlur = 6
  ctx.beginPath()
  ctx.arc(0, bodyY, 4 * corePulse, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  const headRadius = 10 + level
  const headY = -10

  ctx.fillStyle = gradients.headGlow
  ctx.beginPath()
  ctx.arc(0, headY, headRadius + 5, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#ffcc99'
  ctx.shadowColor = '#ffcc99'
  ctx.shadowBlur = 5
  ctx.beginPath()
  ctx.arc(0, headY, headRadius, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.fillStyle = '#333'
  ctx.beginPath()
  ctx.arc(0, headY - 2, headRadius - 2, Math.PI, 0)
  ctx.fill()

  const eyePulse = 0.7 + 0.3 * Math.sin(t / 180)
  const eyeOffset = p.facingRight ? 4 : -4
  const eyeGlowIntensity = 0.5 + Math.sin(t / 100) * 0.3

  ctx.fillStyle = `rgba(255, 255, 255, ${eyeGlowIntensity})`
  ctx.shadowColor = '#FFFFFF'
  ctx.shadowBlur = 6
  ctx.beginPath()
  ctx.arc(eyeOffset, headY - 1, 5, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#000'
  ctx.shadowBlur = 0
  ctx.globalAlpha = eyePulse
  ctx.beginPath()
  ctx.arc(eyeOffset, headY, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(eyeOffset + 1, headY - 1, 1.5, 0, Math.PI * 2)
  ctx.fill()

  // ==================== 霸气武器系统 ====================
  const gunLength = 22 + level * 3
  const gunBaseX = p.facingRight ? bodyWidth / 2 + 6 : -bodyWidth / 2 - 6
  const gunBaseY = bodyY - 10
  
  // 使用射击角度作为武器角度
  const gunAngle = shootAngle

  ctx.save()
  
  // 根据射击角度调整武器位置和方向
  ctx.translate(gunBaseX, gunBaseY)
  ctx.rotate(gunAngle)

  // 武器配色方案 - 根据等级和状态变化
  const isLegendary = level >= 5
  const gunColor1 = isTransformed ? '#FFD700' : (isLegendary ? '#E040FB' : '#00E5FF')
  const gunColor2 = isTransformed ? '#FFA500' : (isLegendary ? '#9C27B0' : '#00838F')
  const metalColor = isLegendary ? '#8D6E63' : '#424242'
  const accentColor = isTransformed ? '#FFEB3B' : (isLegendary ? '#CE93D8' : '#80DEEA')

  // 武器光晕效果
  ctx.save()
  ctx.translate(p.facingRight ? gunLength * 0.7 : gunLength * 0.3, 0)
  const weaponGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, gunLength * 0.4)
  weaponGlow.addColorStop(0, `${gunColor1}40`)
  weaponGlow.addColorStop(0.5, `${gunColor1}20`)
  weaponGlow.addColorStop(1, 'transparent')
  ctx.fillStyle = weaponGlow
  ctx.beginPath()
  ctx.arc(0, 0, gunLength * 0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // 枪身主体 - 更复杂的形状
  const gunDirection = p.facingRight ? 1 : -1
  
  // 枪托/握把
  ctx.fillStyle = '#212121'
  ctx.beginPath()
  ctx.roundRect(p.facingRight ? -8 : -gunLength + 2, -6, 12, 16, 3)
  ctx.fill()
  
  // 枪托金属装饰
  ctx.fillStyle = metalColor
  ctx.beginPath()
  ctx.roundRect(p.facingRight ? -6 : -gunLength + 4, -4, 8, 12, 2)
  ctx.fill()

  // 枪身中部 - 主武器主体
  const bodyStart = p.facingRight ? 6 : -gunLength + 6
  const bodyLength = gunLength - 16
  
  // 外层阴影
  ctx.fillStyle = '#1a1a1a'
  ctx.beginPath()
  ctx.roundRect(bodyStart + gunDirection, -8, bodyLength, 20, 4)
  ctx.fill()
  
  // 主枪身
  const bodyGrad = ctx.createLinearGradient(bodyStart, 0, bodyStart + bodyLength * gunDirection, 0)
  bodyGrad.addColorStop(0, '#555')
  bodyGrad.addColorStop(0.5, '#666')
  bodyGrad.addColorStop(1, '#444')
  ctx.fillStyle = bodyGrad
  ctx.beginPath()
  ctx.roundRect(bodyStart, -7, bodyLength, 18, 4)
  ctx.fill()

  // 枪身高光
  ctx.fillStyle = '#888'
  ctx.beginPath()
  ctx.roundRect(bodyStart + 2, -6, bodyLength - 4, 6, 2)
  ctx.fill()

  // 能量核心/装饰条
  const coreGrad = ctx.createLinearGradient(bodyStart + 4, 0, bodyStart + bodyLength - 4, 0)
  coreGrad.addColorStop(0, gunColor2)
  coreGrad.addColorStop(0.5, gunColor1)
  coreGrad.addColorStop(1, gunColor2)
  ctx.fillStyle = coreGrad
  ctx.shadowColor = gunColor1
  ctx.shadowBlur = 10
  ctx.beginPath()
  ctx.roundRect(bodyStart + 6, -2, bodyLength - 12, 4, 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // 枪管 - 更粗更霸气
  const barrelStart = p.facingRight ? gunLength - 12 : -12
  const barrelLength = 10
  
  // 枪管外层
  ctx.fillStyle = '#333'
  ctx.shadowColor = '#000'
  ctx.shadowBlur = 5
  ctx.beginPath()
  ctx.roundRect(barrelStart - gunDirection * 2, -5, barrelLength + gunDirection * 4, 14, 3)
  ctx.fill()
  ctx.shadowBlur = 0
  
  // 枪管内层
  const barrelGrad = ctx.createLinearGradient(barrelStart, 0, barrelStart + barrelLength * gunDirection, 0)
  barrelGrad.addColorStop(0, '#666')
  barrelGrad.addColorStop(0.5, '#555')
  barrelGrad.addColorStop(1, '#444')
  ctx.fillStyle = barrelGrad
  ctx.beginPath()
  ctx.roundRect(barrelStart, -4, barrelLength, 12, 2)
  ctx.fill()

  // 枪管散热孔/装饰细节
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = '#222'
    ctx.beginPath()
    const holeX = barrelStart + gunDirection * (3 + i * 2)
    ctx.arc(holeX, -2, 1.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(holeX, 2, 1.5, 0, Math.PI * 2)
    ctx.fill()
  }

  // 枪口 - 发光效果
  const muzzleEnd = p.facingRight ? gunLength : 0
  ctx.fillStyle = gunColor1
  ctx.shadowColor = gunColor1
  ctx.shadowBlur = 15 + Math.sin(t / 20) * 5
  ctx.beginPath()
  ctx.arc(muzzleEnd, 3, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // 射击特效
  if (isShooting) {
    const muzzleFlash = 1 + Math.sin(t / 20) * 0.4
    const flashLength = 12 + level * 2.5
    const spread = 8 + level

    // 主枪口火焰光晕
    const flameGlow = ctx.createRadialGradient(muzzleEnd, 3, 0, muzzleEnd, 3, flashLength * 1.5)
    flameGlow.addColorStop(0, '#FFFFFF')
    flameGlow.addColorStop(0.2, gunColor1)
    flameGlow.addColorStop(0.5, '#FF8800')
    flameGlow.addColorStop(1, 'transparent')
    ctx.fillStyle = flameGlow
    ctx.beginPath()
    ctx.arc(muzzleEnd + gunDirection * flashLength * 0.3, 3, flashLength * muzzleFlash, 0, Math.PI * 2)
    ctx.fill()

    // 锥形火焰
    const flameGrad = ctx.createLinearGradient(muzzleEnd, 0, muzzleEnd + gunDirection * flashLength * 2, 0)
    flameGrad.addColorStop(0, '#FFFFFF')
    flameGrad.addColorStop(0.2, '#FFFF00')
    flameGrad.addColorStop(0.4, '#FF8800')
    flameGrad.addColorStop(0.7, '#FF4400')
    flameGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = flameGrad
    ctx.beginPath()
    ctx.moveTo(muzzleEnd, 3 - spread * 0.5)
    ctx.lineTo(muzzleEnd + gunDirection * flashLength * (1.5 + Math.sin(t / 15) * 0.3), 3 + (Math.random() - 0.5) * 4)
    ctx.lineTo(muzzleEnd, 3 + spread * 0.5)
    ctx.closePath()
    ctx.fill()

    // 飞溅火星粒子
    for (let i = 0; i < 5; i++) {
      const sparkAngle = (Math.random() - 0.5) * Math.PI * 0.5
      const sparkDist = flashLength * (0.5 + Math.random() * 0.5)
      const sparkX = muzzleEnd + Math.cos(sparkAngle + gunAngle) * sparkDist * gunDirection
      const sparkY = 3 + Math.sin(sparkAngle + gunAngle) * sparkDist
      const sparkSize = 1 + Math.random() * 2
      
      ctx.fillStyle = `rgba(255, ${100 + Math.random() * 155}, 0, ${0.6 + Math.random() * 0.4})`
      ctx.beginPath()
      ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // 武器状态指示器（传说级武器专属）
  if (isLegendary || isTransformed) {
    const pulse = 0.5 + Math.sin(t / 50) * 0.3
    ctx.fillStyle = `${gunColor1}${Math.round(pulse * 60).toString(16).padStart(2, '0')}`
    ctx.beginPath()
    ctx.arc(p.facingRight ? gunLength * 0.5 : gunLength * 0.5, -12, 4, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()

  // 腿部动画
  const baseLegLength = 14
  const legLength = isJumping ? baseLegLength - 6 : (isFalling ? baseLegLength + 4 : baseLegLength + Math.sin(t / 150) * 1)
  const legCycle = Math.sin(t / 50 * legCycleSpeed)
  const legOffset = isMoving ? legCycle * (isRunning ? 5 : 3) : 0
  const jumpLegAngle = isJumping ? 0.4 + jumpProgress * 0.3 : (isFalling ? -0.1 : 0)

  ctx.fillStyle = level >= 5 ? '#6D4C41' : '#2a5a8a'

  // 左腿
  ctx.save()
  ctx.translate(-bodyWidth / 2 + 5, bodyY + bodyHeight / 2 - 4)
  const leftLegAngle = (isMoving ? -legOffset * 0.15 : 0) + jumpLegAngle
  ctx.rotate(leftLegAngle)
  ctx.beginPath()
  ctx.roundRect(0, 0, 8, legLength, 2)
  ctx.fill()

  ctx.fillStyle = level >= 5 ? '#8D6E63' : '#3a7ac9'
  ctx.fillRect(1, 1, 6, 2)
  ctx.restore()

  // 右腿
  ctx.save()
  ctx.translate(bodyWidth / 2 - 13, bodyY + bodyHeight / 2 - 4)
  const rightLegAngle = (isMoving ? legOffset * 0.15 : 0) - jumpLegAngle
  ctx.rotate(rightLegAngle)
  ctx.beginPath()
  ctx.roundRect(0, 0, 8, legLength, 2)
  ctx.fill()

  ctx.fillStyle = level >= 5 ? '#8D6E63' : '#3a7ac9'
  ctx.fillRect(1, 1, 6, 2)
  ctx.restore()

  // 脚部动画
  const footOffset = isMoving ? Math.sin(t / 45 * legCycleSpeed) * 2 : 0
  const footAngle = isJumping ? -0.2 : (isFalling ? 0.3 : (isMoving ? Math.sin(t / 50 * legCycleSpeed) * 0.3 : 0))

  ctx.fillStyle = level >= 5 ? '#3E2723' : '#1a4a7a'
  
  // 左脚
  ctx.save()
  ctx.translate(-bodyWidth / 2 + 4, bodyY + bodyHeight / 2 + legLength - 6 + footOffset)
  ctx.rotate(footAngle)
  ctx.beginPath()
  ctx.roundRect(0, 0, 10, 7, 2)
  ctx.fill()
  ctx.restore()
  
  // 右脚
  ctx.save()
  ctx.translate(bodyWidth / 2 - 14, bodyY + bodyHeight / 2 + legLength - 6 - footOffset)
  ctx.rotate(-footAngle)
  ctx.beginPath()
  ctx.roundRect(0, 0, 10, 7, 2)
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.translate(0, -bodyHeight / 2 - 12)
  ctx.fillStyle = gradients.levelGlow
  ctx.beginPath()
  ctx.arc(0, 0, 15, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = level >= 5 ? '#E040FB' : '#FFFFFF'
  ctx.font = `bold ${12 + Math.floor(level / 2)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.shadowColor = level >= 5 ? '#E040FB' : '#888'
  ctx.shadowBlur = level >= 5 ? 6 : 3
  ctx.fillText(`Lv${level}`, 0, -bodyHeight / 2 - 10)
  ctx.shadowBlur = 0

  if (p.isSliding) {
    ctx.save()
    for (let i = 0; i < 4; i++) {
      const angle = Math.PI + (Math.sin(t / 50 + i * 1.7) * 0.5) * Math.PI * 0.3
      const dist = Math.sin(t / 60 + i * 2.1) * 7.5 + 12.5
      const sx = Math.cos(angle) * (p.facingRight ? -1 : 1) * dist
      const sy = Math.sin(angle) * dist + 10
      const sparkSize = Math.sin(t / 40 + i * 3.1) * 1.5 + 2.5
      ctx.fillStyle = `rgba(255, ${200 + Math.floor(Math.sin(t / 55 + i * 1.9) * 27.5 + 27.5)}, 100, ${0.5 + Math.sin(t / 65 + i * 2.7) * 0.25})`
      ctx.shadowColor = '#FFD700'
      ctx.shadowBlur = 4
      ctx.beginPath()
      ctx.arc(sx, sy, sparkSize, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  ctx.restore()
}

export function drawEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[]) {
  for (const enemy of enemies) {
    if (enemy.type === 'boss') {
      drawBoss(ctx, enemy)
    } else {
      drawNormalEnemy(ctx, enemy)
    }
  }
}

function drawNormalEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  ctx.save()
  ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2)

  const t = Date.now()
  const pulse = enemy.type === 'elite' ? 1 + Math.sin(t / 150) * 0.1 : 1 + Math.sin(t / 300) * 0.05
  const hpRatio = enemy.hp / enemy.maxHp

  // 飞行敌人：添加翅膀和飞行特效
  if (enemy.behavior === 'fly') {
    const wingFlap = Math.sin(t / 80) * 0.4
    const wingColor = enemy.type === 'elite' ? '#8855ff' : '#66aaff'
    
    // 左翅膀
    ctx.save()
    ctx.translate(-enemy.width / 2 - 5, 0)
    ctx.rotate(-0.5 + wingFlap)
    ctx.fillStyle = wingColor + 'cc'
    ctx.shadowColor = wingColor
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.ellipse(0, 0, 15, 8, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.restore()
    
    // 右翅膀
    ctx.save()
    ctx.translate(enemy.width / 2 + 5, 0)
    ctx.rotate(0.5 - wingFlap)
    ctx.fillStyle = wingColor + 'cc'
    ctx.shadowColor = wingColor
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.ellipse(0, 0, 15, 8, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.restore()
    
    // 飞行尾迹粒子效果
    ctx.fillStyle = 'rgba(100, 150, 255, 0.3)'
    for (let i = 0; i < 3; i++) {
      const offset = i * 8
      const alpha = 0.3 - i * 0.1
      ctx.globalAlpha = alpha
      ctx.beginPath()
      ctx.arc(-offset - 10, Math.sin(t / 50 + i) * 3, 3 + i, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  ctx.save()
  ctx.scale(pulse, pulse)

  if (enemy.recentlyHit > 0) {
    const hitFlash = Math.floor(enemy.recentlyHit / 50) % 2 === 0
    if (hitFlash) {
      ctx.globalAlpha = 0.4
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.roundRect(-enemy.width / 2 - 5, -enemy.height / 2 - 5, enemy.width + 10, enemy.height + 10, 6)
      ctx.fill()
      ctx.globalAlpha = 1
    }
  }

  const glowIntensity = enemy.type === 'elite' ? 0.3 + Math.sin(t / 200) * 0.1 : 0.2
  const glowColor = enemy.color
  const glowKey = `glow_${enemy.color}_${enemy.width}`
  let glowGrad = enemyGlowGradCache.get(glowKey)
  if (!glowGrad) {
    glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, enemy.width)
    glowGrad.addColorStop(0, `${glowColor}40`)
    glowGrad.addColorStop(1, 'transparent')
    enemyGlowGradCache.set(glowKey, glowGrad)
  }
  ctx.fillStyle = glowGrad
  ctx.beginPath()
  ctx.arc(0, 0, enemy.width, 0, Math.PI * 2)
  ctx.fill()

  if (enemy.type === 'elite') {
    const bodyKey = `body_elite_${enemy.color}`
    let mainGrad = enemyBodyGradCache.get(bodyKey)
    if (!mainGrad) {
      mainGrad = ctx.createLinearGradient(-enemy.width / 2, 0, enemy.width / 2, 0)
      mainGrad.addColorStop(0, '#7c3aed')
      mainGrad.addColorStop(0.5, enemy.color)
      mainGrad.addColorStop(1, '#7c3aed')
      enemyBodyGradCache.set(bodyKey, mainGrad)
    }

    ctx.fillStyle = mainGrad
    ctx.shadowColor = enemy.color
    ctx.shadowBlur = enemy.type === 'elite' ? 10 : 5
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6
      const px = Math.cos(angle) * enemy.width / 2
      const py = Math.sin(angle) * enemy.height / 2
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fill()
    ctx.shadowBlur = 0

    const innerGrad = ctx.createLinearGradient(0, -enemy.height / 2, 0, enemy.height / 2)
    innerGrad.addColorStop(0, '#ffdd99')
    innerGrad.addColorStop(0.5, '#ffcc88')
    innerGrad.addColorStop(1, '#ffbb77')
    ctx.fillStyle = innerGrad
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6
      const px = Math.cos(angle) * enemy.width / 3
      const py = Math.sin(angle) * enemy.height / 3
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fill()

    const corePulse = 0.7 + 0.3 * Math.sin(t / 100)
    const coreGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 10)
    coreGlow.addColorStop(0, `rgba(255, 200, 100, ${corePulse})`)
    coreGlow.addColorStop(1, 'transparent')
    ctx.fillStyle = coreGlow
    ctx.beginPath()
    ctx.arc(0, 0, 10, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#FFD700'
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 6
    ctx.beginPath()
    ctx.arc(0, 0, 5 * corePulse, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  } else if (enemy.type === 'melee') {
    // 近战敌人：倒三角 + 尖刺造型，压迫感
    const bodyKey = `body_melee_${enemy.color}`
    let mainGrad = enemyBodyGradCache.get(bodyKey)
    if (!mainGrad) {
      mainGrad = ctx.createLinearGradient(-enemy.width / 2, 0, enemy.width / 2, 0)
      mainGrad.addColorStop(0, '#4a0000')
      mainGrad.addColorStop(0.3, enemy.color)
      mainGrad.addColorStop(0.7, '#ff4400')
      mainGrad.addColorStop(1, '#4a0000')
      enemyBodyGradCache.set(bodyKey, mainGrad)
    }

    ctx.fillStyle = mainGrad
    ctx.shadowColor = enemy.color
    ctx.shadowBlur = 8
    ctx.beginPath()
    const w = enemy.width / 2, h = enemy.height / 2
    ctx.moveTo(0, -h)
    ctx.lineTo(w, h)
    ctx.lineTo(-w, h)
    ctx.closePath()
    ctx.fill()
    ctx.shadowBlur = 0

    // 头顶双角
    ctx.fillStyle = '#ff2200'
    ctx.beginPath()
    ctx.moveTo(-w * 0.5, -h)
    ctx.lineTo(-w * 0.3, -h - 10)
    ctx.lineTo(-w * 0.1, -h)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(w * 0.1, -h)
    ctx.lineTo(w * 0.3, -h - 10)
    ctx.lineTo(w * 0.5, -h)
    ctx.fill()

    // 内层
    ctx.fillStyle = '#ff6644'
    ctx.beginPath()
    ctx.moveTo(0, -h * 0.6)
    ctx.lineTo(w * 0.65, h * 0.7)
    ctx.lineTo(-w * 0.65, h * 0.7)
    ctx.closePath()
    ctx.fill()

    // 双手爪
    ctx.fillStyle = '#aa2200'
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(w * 0.7, h * 0.2)
    ctx.lineTo(w + 10, h * 0.4)
    ctx.lineTo(w + 6, h * 0.15)
    ctx.lineTo(w * 0.7, 0)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(-w * 0.7, h * 0.2)
    ctx.lineTo(-(w + 10), h * 0.4)
    ctx.lineTo(-(w + 6), h * 0.15)
    ctx.lineTo(-w * 0.7, 0)
    ctx.fill()
    ctx.restore()

    // 血条
    const barW = enemy.width + 6, barH = 5
    ctx.fillStyle = '#444'
    ctx.beginPath()
    ctx.roundRect(-barW / 2, -h - 20, barW, barH, 2)
    ctx.fill()
    const meleeBarColor = hpRatio > 0.5 ? '#00E676' : hpRatio > 0.25 ? '#FFA502' : '#FF4757'
    ctx.fillStyle = meleeBarColor
    ctx.beginPath()
    ctx.roundRect(-barW / 2, -h - 20, barW * Math.max(0.15, hpRatio), barH, 2)
    ctx.fill()
  } else {
    const bodyKey = `body_normal_${enemy.color}`
    let mainGrad = enemyBodyGradCache.get(bodyKey)
    if (!mainGrad) {
      mainGrad = ctx.createLinearGradient(-enemy.width / 2, 0, enemy.width / 2, 0)
      mainGrad.addColorStop(0, '#5a3a3a')
      mainGrad.addColorStop(0.5, enemy.color)
      mainGrad.addColorStop(1, '#5a3a3a')
      enemyBodyGradCache.set(bodyKey, mainGrad)
    }

    ctx.fillStyle = mainGrad
    ctx.shadowColor = enemy.color
    ctx.shadowBlur = 4
    ctx.beginPath()
    ctx.roundRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height, 5)
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.fillStyle = '#ffaa88'
    ctx.beginPath()
    ctx.roundRect(-enemy.width / 2 + 4, -enemy.height / 2 + 4, enemy.width - 8, enemy.height - 8, 4)
    ctx.fill()

    const energyHeight = 4
    const energyRatio = Math.max(0.3, hpRatio)
    ctx.fillStyle = '#888'
    ctx.beginPath()
    ctx.roundRect(-enemy.width / 2 + 6, enemy.height / 2 - 8, enemy.width - 12, energyHeight, 2)
    ctx.fill()

    const energyColor = hpRatio > 0.5 ? '#00E676' : hpRatio > 0.25 ? '#FFA502' : '#FF4757'
    ctx.fillStyle = energyColor
    ctx.beginPath()
    ctx.roundRect(-enemy.width / 2 + 6, enemy.height / 2 - 8, (enemy.width - 12) * energyRatio, energyHeight, 2)
    ctx.fill()
  }

  const eyeGlow = 0.6 + 0.4 * Math.sin(t / 80)
  const eyeColor = enemy.type === 'elite' ? '#FFD700' : '#FF4444'

  ctx.fillStyle = `rgba(255, 255, 255, ${eyeGlow * 0.5})`
  ctx.shadowColor = eyeColor
  ctx.shadowBlur = enemy.type === 'elite' ? 8 : 5
  ctx.beginPath()
  ctx.arc(-6, -5, 6, 0, Math.PI * 2)
  ctx.arc(6, -5, 6, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = eyeColor
  ctx.shadowBlur = 4
  ctx.beginPath()
  ctx.arc(-6, -5, 4, 0, Math.PI * 2)
  ctx.arc(6, -5, 4, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#000'
  ctx.shadowBlur = 0
  ctx.beginPath()
  ctx.arc(-6, -4, 2, 0, Math.PI * 2)
  ctx.arc(6, -4, 2, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(-5, -6, 1.5, 0, Math.PI * 2)
  ctx.arc(7, -6, 1.5, 0, Math.PI * 2)
  ctx.fill()

  const mouthOpen = 0.8 + 0.2 * Math.sin(t / 300)
  ctx.fillStyle = '#333'
  ctx.beginPath()
  ctx.arc(0, 3, 4 * mouthOpen, 0, Math.PI)
  ctx.fill()

  if (mouthOpen > 0.9) {
    ctx.fillStyle = '#fff'
    ctx.fillRect(-3, 3, 2, 3)
    ctx.fillRect(1, 3, 2, 3)
  }

  if (enemy.type === 'elite') {
    ctx.fillStyle = '#4a2a7a'
    ctx.shadowColor = '#4a2a7a'
    ctx.shadowBlur = 4

    ctx.beginPath()
    ctx.roundRect(-enemy.width / 2 - 6, -8, 7, 18, 2)
    ctx.fill()

    ctx.beginPath()
    ctx.roundRect(enemy.width / 2 - 1, -8, 7, 18, 2)
    ctx.fill()

    ctx.fillStyle = '#E040FB'
    ctx.shadowColor = '#E040FB'
    ctx.shadowBlur = 6
    ctx.beginPath()
    ctx.arc(-enemy.width / 2 - 2, 5, 3, 0, Math.PI * 2)
    ctx.arc(enemy.width / 2 + 3, 5, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  } else {
    ctx.fillStyle = '#555'
    ctx.beginPath()
    ctx.roundRect(-enemy.width / 2 + 3, enemy.height / 2 - 8, enemy.width - 6, 5, 2)
    ctx.fill()

    ctx.fillStyle = '#666'
    ctx.fillRect(-enemy.width / 2 + 4, enemy.height / 2 - 7, enemy.width - 8, 2)
  }

  ctx.restore()

  if (enemy.type === 'elite' || enemy.hp < enemy.maxHp) {
    const barWidth = Math.min(enemy.width + 12, 55)
    const barHeight = 6
    const barY = -enemy.height / 2 - 14

    const barGlow = ctx.createRadialGradient(0, barY + barHeight / 2, 0, 0, barY + barHeight / 2, barHeight * 2)
    barGlow.addColorStop(0, 'rgba(255, 100, 100, 0.3)')
    barGlow.addColorStop(1, 'transparent')
    ctx.fillStyle = barGlow
    ctx.fillRect(-barWidth / 2 - 5, barY - 5, barWidth + 10, barHeight + 10)

    ctx.fillStyle = 'rgba(0,0,0,0.8)'
    ctx.beginPath()
    ctx.roundRect(-barWidth / 2, barY, barWidth, barHeight, 3)
    ctx.fill()

    const currentHpRatio = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp))
    const hpBarGradient = ctx.createLinearGradient(-barWidth / 2, barY, barWidth / 2, barY)
    hpBarGradient.addColorStop(0, '#FF4757')
    hpBarGradient.addColorStop(0.3, '#FF6B6B')
    hpBarGradient.addColorStop(0.5, '#FFA502')
    hpBarGradient.addColorStop(0.7, '#FFD700')
    hpBarGradient.addColorStop(1, '#00E676')

    ctx.fillStyle = hpBarGradient
    ctx.shadowColor = '#FFFFFF'
    ctx.shadowBlur = 2
    ctx.beginPath()
    ctx.roundRect(-barWidth / 2, barY, barWidth * currentHpRatio, barHeight, 3)
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1
    ctx.strokeRect(-barWidth / 2, barY, barWidth, barHeight)
  }

  if (enemy.type === 'elite') {
    const starGlow = ctx.createRadialGradient(0, -enemy.height / 2 - 20, 0, 0, -enemy.height / 2 - 20, 12)
    starGlow.addColorStop(0, 'rgba(255, 215, 0, 0.6)')
    starGlow.addColorStop(1, 'transparent')
    ctx.fillStyle = starGlow
    ctx.beginPath()
    ctx.arc(0, -enemy.height / 2 - 20, 12, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#FFD700'
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 6
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('★', 0, -enemy.height / 2 - 17)
    ctx.shadowBlur = 0
  }

  ctx.restore()
}

function drawBoss(ctx: CanvasRenderingContext2D, boss: Enemy) {
  ctx.save()
  ctx.translate(boss.x + boss.width / 2, boss.y + boss.height / 2)

  const t = Date.now()
  const hpRatio = boss.hp / boss.maxHp
  const enraged = hpRatio < 0.3

  if (boss.name === 'cavern-guardian') {
    drawCavernGuardian(ctx, boss, t, hpRatio, enraged)
  } else if (boss.name === 'sand-guardian') {
    drawSandGuardian(ctx, boss, t, hpRatio, enraged)
  } else if (boss.name === 'mech-core') {
    drawMechCore(ctx, boss, t, hpRatio, enraged)
  } else {
    drawDefaultBoss(ctx, boss, t, hpRatio, enraged)
  }

  ctx.restore()
}

function drawCavernGuardian(ctx: CanvasRenderingContext2D, boss: Enemy, t: number, hpRatio: number, enraged: boolean) {
  const pulse = 1 + Math.sin(t / (enraged ? 100 : 200)) * (enraged ? 0.12 : 0.08)

  ctx.save()
  ctx.scale(pulse, pulse)

  if (boss.recentlyHit > 0) {
    const hitFlash = Math.floor(boss.recentlyHit / 40) % 2 === 0
    if (hitFlash) {
      ctx.globalAlpha = 0.3
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i - Math.PI / 4
        const r = i % 2 === 0 ? boss.width / 2 + 10 : boss.width / 3 + 8
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r * 0.9)
      }
      ctx.closePath()
      ctx.fill()
      ctx.globalAlpha = 1
    }
  }

  const glowColor = enraged ? '#ff4400' : '#ff8800'
  const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, boss.width)
  glowGrad.addColorStop(0, `${glowColor}60`)
  glowGrad.addColorStop(1, 'transparent')
  ctx.fillStyle = glowGrad
  ctx.beginPath()
  ctx.arc(0, 0, boss.width, 0, Math.PI * 2)
  ctx.fill()

  const mainGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, boss.width / 2)
  mainGradient.addColorStop(0, enraged ? '#ff6633' : '#ffaa33')
  mainGradient.addColorStop(0.5, enraged ? '#cc3300' : '#cc6600')
  mainGradient.addColorStop(1, '#662200')

  ctx.fillStyle = mainGradient
  ctx.shadowColor = glowColor
  ctx.shadowBlur = enraged ? 20 : 15

  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i - Math.PI / 4
    const r = i % 2 === 0 ? boss.width / 2 : boss.width / 3.2
    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r * 0.9)
  }
  ctx.closePath()
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.strokeStyle = enraged ? '#ff6644' : '#ffcc66'
  ctx.lineWidth = 4
  ctx.shadowColor = ctx.strokeStyle
  ctx.shadowBlur = 10
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i - Math.PI / 4
    const r = i % 2 === 0 ? boss.width / 2.5 : boss.width / 4.5
    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r * 0.9)
  }
  ctx.closePath()
  ctx.stroke()
  ctx.shadowBlur = 0

  const corePulse = 0.7 + 0.3 * Math.sin(t / 60)
  const coreGlow = ctx.createRadialGradient(0, 5, 0, 0, 5, 30)
  coreGlow.addColorStop(0, enraged ? 'rgba(255, 100, 0, 0.9)' : 'rgba(255, 165, 0, 0.8)')
  coreGlow.addColorStop(1, 'transparent')
  ctx.fillStyle = coreGlow
  ctx.beginPath()
  ctx.arc(0, 5, 30 * corePulse, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = enraged ? '#ff4400' : '#ff8800'
  ctx.shadowColor = ctx.fillStyle
  ctx.shadowBlur = 15
  ctx.beginPath()
  ctx.arc(0, 5, 20 * corePulse, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#ffaa44'
  ctx.beginPath()
  ctx.arc(0, 5, 12 * corePulse, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#ffcc88'
  ctx.shadowBlur = 8
  ctx.beginPath()
  ctx.arc(0, 5, 6 * corePulse, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  const eyeGlow = enraged ? 0.9 : 0.6 + 0.4 * Math.sin(t / 100)
  ctx.fillStyle = `rgba(255, 200, 0, ${eyeGlow})`
  ctx.shadowColor = '#FFAA00'
  ctx.shadowBlur = enraged ? 15 : 10
  ctx.beginPath()
  ctx.arc(-20, -10, 12, 0, Math.PI * 2)
  ctx.arc(20, -10, 12, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#000'
  ctx.shadowBlur = 0
  ctx.beginPath()
  ctx.arc(-20, -10, 7, 0, Math.PI * 2)
  ctx.arc(20, -10, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#333'
  ctx.beginPath()
  ctx.arc(-19, -11, 3, 0, Math.PI * 2)
  ctx.arc(21, -11, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(-18, -12, 3, 0, Math.PI * 2)
  ctx.arc(22, -12, 3, 0, Math.PI * 2)
  ctx.fill()

  const hornColor = '#8b4513'
  ctx.fillStyle = hornColor
  ctx.beginPath()
  ctx.moveTo(-15, -boss.height / 2 + 10)
  ctx.lineTo(-20, -boss.height / 2 - 15)
  ctx.lineTo(-10, -boss.height / 2 + 5)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(15, -boss.height / 2 + 10)
  ctx.lineTo(20, -boss.height / 2 - 15)
  ctx.lineTo(10, -boss.height / 2 + 5)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#a0522d'
  ctx.beginPath()
  ctx.moveTo(-14, -boss.height / 2 + 8)
  ctx.lineTo(-17, -boss.height / 2 - 10)
  ctx.lineTo(-11, -boss.height / 2 + 6)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(14, -boss.height / 2 + 8)
  ctx.lineTo(17, -boss.height / 2 - 10)
  ctx.lineTo(11, -boss.height / 2 + 6)
  ctx.closePath()
  ctx.fill()

  const armColor = '#5a3a2a'
  ctx.fillStyle = armColor
  ctx.shadowColor = '#6a4a3a'
  ctx.shadowBlur = 5
  ctx.beginPath()
  ctx.moveTo(-boss.width / 2 + 8, 0)
  ctx.lineTo(-boss.width / 2 - 20, -10)
  ctx.lineTo(-boss.width / 2 - 15, 25)
  ctx.lineTo(-boss.width / 2 + 5, 10)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(boss.width / 2 - 8, 0)
  ctx.lineTo(boss.width / 2 + 20, -10)
  ctx.lineTo(boss.width / 2 + 15, 25)
  ctx.lineTo(boss.width / 2 - 5, 10)
  ctx.closePath()
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.fillStyle = '#ff6633'
  ctx.shadowColor = '#ff6633'
  ctx.shadowBlur = 8
  ctx.beginPath()
  ctx.arc(-boss.width / 2 - 12, 8, 8, 0, Math.PI * 2)
  ctx.arc(boss.width / 2 + 12, 8, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.restore()
}

function drawSandGuardian(ctx: CanvasRenderingContext2D, boss: Enemy, t: number, hpRatio: number, enraged: boolean) {
  const pulse = 1 + Math.sin(t / (enraged ? 80 : 180)) * (enraged ? 0.15 : 0.06)
  const sandWave = Math.sin(t / 200) * 3

  ctx.save()
  ctx.scale(pulse, pulse)

  if (boss.recentlyHit > 0) {
    const hitFlash = Math.floor(boss.recentlyHit / 30) % 2 === 0
    if (hitFlash) {
      ctx.globalAlpha = 0.4
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(0, 0, boss.width / 2 + 15, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }
  }

  const glowColor = enraged ? '#ff0066' : '#ffaa00'
  const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, boss.width)
  glowGrad.addColorStop(0, `${glowColor}50`)
  glowGrad.addColorStop(1, 'transparent')
  ctx.fillStyle = glowGrad
  ctx.beginPath()
  ctx.arc(0, 0, boss.width, 0, Math.PI * 2)
  ctx.fill()

  const bodyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, boss.width / 2)
  bodyGradient.addColorStop(0, enraged ? '#ff6633' : '#ffdd88')
  bodyGradient.addColorStop(0.5, enraged ? '#cc3366' : '#cc9944')
  bodyGradient.addColorStop(1, '#663322')

  ctx.fillStyle = bodyGradient
  ctx.shadowColor = glowColor
  ctx.shadowBlur = enraged ? 25 : 15
  ctx.beginPath()
  ctx.ellipse(0, sandWave * 0.5, boss.width / 2, boss.height / 2.5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  const sandTexture = ctx.createRadialGradient(0, 0, 0, 0, 0, boss.width / 2)
  sandTexture.addColorStop(0, 'rgba(255, 200, 100, 0.3)')
  sandTexture.addColorStop(0.5, 'rgba(200, 150, 80, 0.2)')
  sandTexture.addColorStop(1, 'rgba(150, 100, 50, 0.3)')
  ctx.fillStyle = sandTexture
  ctx.beginPath()
  ctx.ellipse(0, sandWave * 0.5, boss.width / 2 - 5, boss.height / 2.5 - 5, 0, 0, Math.PI * 2)
  ctx.fill()

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i
    const r = boss.width / 2 - 10 + Math.sin(t / 300 + i) * 5
    ctx.fillStyle = `rgba(200, 150, 80, ${0.3 + Math.sin(t / 200 + i) * 0.2})`
    ctx.beginPath()
    ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r * 0.7 + sandWave * 0.5, 8, 0, Math.PI * 2)
    ctx.fill()
  }

  const corePulse = 0.6 + 0.4 * Math.sin(t / 80)
  const coreGlow = ctx.createRadialGradient(0, sandWave, 0, 0, sandWave, 35)
  coreGlow.addColorStop(0, enraged ? 'rgba(255, 50, 100, 0.9)' : 'rgba(255, 180, 50, 0.8)')
  coreGlow.addColorStop(1, 'transparent')
  ctx.fillStyle = coreGlow
  ctx.beginPath()
  ctx.arc(0, sandWave, 35 * corePulse, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = enraged ? '#ff3366' : '#ffaa00'
  ctx.shadowColor = ctx.fillStyle
  ctx.shadowBlur = 15
  ctx.beginPath()
  ctx.arc(0, sandWave, 22 * corePulse, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = enraged ? '#ff6699' : '#ffcc44'
  ctx.beginPath()
  ctx.arc(0, sandWave, 14 * corePulse, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = enraged ? '#ffaa99' : '#ffee88'
  ctx.shadowBlur = 8
  ctx.beginPath()
  ctx.arc(0, sandWave, 7 * corePulse, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  const eyeOffset = Math.sin(t / 150) * 2
  ctx.fillStyle = enraged ? '#ff0044' : '#ff6600'
  ctx.shadowColor = ctx.fillStyle
  ctx.shadowBlur = enraged ? 15 : 10
  ctx.beginPath()
  ctx.ellipse(-22 + eyeOffset, -8 + sandWave * 0.3, 10, 14, 0, 0, Math.PI * 2)
  ctx.ellipse(22 + eyeOffset, -8 + sandWave * 0.3, 10, 14, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#000'
  ctx.shadowBlur = 0
  ctx.beginPath()
  ctx.arc(-22 + eyeOffset, -6 + sandWave * 0.3, 6, 0, Math.PI * 2)
  ctx.arc(22 + eyeOffset, -6 + sandWave * 0.3, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#333'
  ctx.beginPath()
  ctx.arc(-21 + eyeOffset, -7 + sandWave * 0.3, 2.5, 0, Math.PI * 2)
  ctx.arc(23 + eyeOffset, -7 + sandWave * 0.3, 2.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#cc8844'
  ctx.shadowColor = '#cc8844'
  ctx.shadowBlur = 5
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI / 4) * i + Math.PI / 4
    const r = boss.width / 2 + 5
    ctx.beginPath()
    ctx.moveTo(Math.cos(angle) * (r - 10), Math.sin(angle) * r * 0.7 + sandWave * 0.5)
    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * (r + 15) * 0.7 + sandWave * 0.5)
    ctx.lineTo(Math.cos(angle) * (r - 5), Math.sin(angle) * (r + 5) * 0.7 + sandWave * 0.5)
    ctx.closePath()
    ctx.fill()
  }
  ctx.shadowBlur = 0

  const sandStorm = []
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 / 12) * i + t / 500
    const dist = boss.width / 2 + 20 + Math.sin(t / 200 + i) * 15
    sandStorm.push({
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist * 0.7 + sandWave * 0.5,
      size: 3 + Math.sin(t / 100 + i) * 2,
      alpha: 0.3 + Math.sin(t / 150 + i) * 0.3
    })
  }
  ctx.fillStyle = '#ccaa66'
  for (const p of sandStorm) {
    ctx.globalAlpha = p.alpha
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  ctx.restore()
}

function drawMechCore(ctx: CanvasRenderingContext2D, boss: Enemy, t: number, hpRatio: number, enraged: boolean) {
  const pulse = 1 + Math.sin(t / (enraged ? 60 : 150)) * (enraged ? 0.15 : 0.05)
  const rotation = t / 1000

  ctx.save()
  ctx.scale(pulse, pulse)

  if (boss.recentlyHit > 0) {
    const hitFlash = Math.floor(boss.recentlyHit / 30) % 2 === 0
    if (hitFlash) {
      ctx.globalAlpha = 0.3
      ctx.fillStyle = '#00FFFF'
      ctx.beginPath()
      ctx.roundRect(-boss.width / 2 - 10, -boss.height / 2 - 10, boss.width + 20, boss.height + 20, 10)
      ctx.fill()
      ctx.globalAlpha = 1
    }
  }

  const glowColor = enraged ? '#ff00ff' : '#00ccff'
  const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, boss.width)
  glowGrad.addColorStop(0, `${glowColor}40`)
  glowGrad.addColorStop(1, 'transparent')
  ctx.fillStyle = glowGrad
  ctx.beginPath()
  ctx.arc(0, 0, boss.width, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#1a1a2e'
  ctx.shadowColor = glowColor
  ctx.shadowBlur = enraged ? 25 : 15
  ctx.beginPath()
  ctx.roundRect(-boss.width / 2, -boss.height / 2, boss.width, boss.height, 10)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.strokeStyle = '#333'
  ctx.lineWidth = 4
  ctx.strokeRect(-boss.width / 2, -boss.height / 2, boss.width, boss.height)

  ctx.strokeStyle = '#444'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, -boss.height / 2)
  ctx.lineTo(0, boss.height / 2)
  ctx.moveTo(-boss.width / 2, 0)
  ctx.lineTo(boss.width / 2, 0)
  ctx.stroke()

  const armorGradient = ctx.createLinearGradient(-boss.width / 2, 0, boss.width / 2, 0)
  armorGradient.addColorStop(0, '#2a2a4a')
  armorGradient.addColorStop(0.5, '#3a3a6a')
  armorGradient.addColorStop(1, '#2a2a4a')
  ctx.fillStyle = armorGradient
  ctx.beginPath()
  ctx.roundRect(-boss.width / 2 + 8, -boss.height / 2 + 8, boss.width - 16, boss.height - 16, 6)
  ctx.fill()

  ctx.fillStyle = '#1a1a2e'
  ctx.beginPath()
  ctx.roundRect(-boss.width / 2 + 15, -boss.height / 2 + 15, boss.width - 30, boss.height - 30, 4)
  ctx.fill()

  const corePulse = 0.6 + 0.4 * Math.sin(t / 50)
  const coreGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 35)
  coreGlow.addColorStop(0, enraged ? 'rgba(255, 0, 255, 0.9)' : 'rgba(0, 200, 255, 0.9)')
  coreGlow.addColorStop(0.5, enraged ? 'rgba(255, 0, 200, 0.4)' : 'rgba(0, 150, 255, 0.4)')
  coreGlow.addColorStop(1, 'transparent')
  ctx.fillStyle = coreGlow
  ctx.beginPath()
  ctx.arc(0, 0, 35 * corePulse, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = enraged ? '#ff00ff' : '#00aaff'
  ctx.shadowColor = ctx.fillStyle
  ctx.shadowBlur = 20
  ctx.beginPath()
  ctx.arc(0, 0, 25 * corePulse, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = enraged ? '#ff44ff' : '#44ddff'
  ctx.beginPath()
  ctx.arc(0, 0, 16 * corePulse, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = enraged ? '#ff88ff' : '#88eeff'
  ctx.shadowBlur = 10
  ctx.beginPath()
  ctx.arc(0, 0, 8 * corePulse, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.save()
  ctx.rotate(rotation)
  ctx.strokeStyle = enraged ? 'rgba(255, 0, 255, 0.5)' : 'rgba(0, 200, 255, 0.5)'
  ctx.lineWidth = 2
  for (let i = 0; i < 4; i++) {
    ctx.beginPath()
    ctx.arc(0, 0, 20 + i * 5, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()

  ctx.fillStyle = '#00ffff'
  ctx.shadowColor = '#00ffff'
  ctx.shadowBlur = 8
  ctx.font = 'bold 16px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('●', 0, 4)
  ctx.shadowBlur = 0

  const eyeGlow = enraged ? 0.9 : 0.6 + 0.4 * Math.sin(t / 80)
  ctx.fillStyle = `rgba(0, 255, 255, ${eyeGlow})`
  ctx.shadowColor = '#00FFFF'
  ctx.shadowBlur = enraged ? 20 : 12
  ctx.beginPath()
  ctx.ellipse(-25, -8, 8, 12, 0, 0, Math.PI * 2)
  ctx.ellipse(25, -8, 8, 12, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#000'
  ctx.shadowBlur = 0
  ctx.beginPath()
  ctx.arc(-25, -8, 5, 0, Math.PI * 2)
  ctx.arc(25, -8, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#333'
  ctx.beginPath()
  ctx.arc(-24, -9, 2, 0, Math.PI * 2)
  ctx.arc(26, -9, 2, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#3a3a6a'
  ctx.shadowColor = '#4a4a8a'
  ctx.shadowBlur = 5
  ctx.beginPath()
  ctx.roundRect(-boss.width / 2 - 10, -15, 15, 30, 3)
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(boss.width / 2 - 5, -15, 15, 30, 3)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.fillStyle = glowColor
  ctx.shadowColor = glowColor
  ctx.shadowBlur = 10
  const gunPulse = 0.7 + 0.3 * Math.sin(t / 60)
  ctx.beginPath()
  ctx.arc(-boss.width / 2 - 3, 0, 8 * gunPulse, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(boss.width / 2 + 3, 0, 8 * gunPulse, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  const legColor = '#2a2a4a'
  ctx.fillStyle = legColor
  ctx.beginPath()
  ctx.roundRect(-boss.width / 2 + 10, boss.height / 2 - 20, 12, 20, 3)
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(boss.width / 2 - 22, boss.height / 2 - 20, 12, 20, 3)
  ctx.fill()

  ctx.fillStyle = '#4a4a8a'
  ctx.beginPath()
  ctx.roundRect(-boss.width / 2 + 12, boss.height / 2 - 18, 8, 12, 2)
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(boss.width / 2 - 20, boss.height / 2 - 18, 8, 12, 2)
  ctx.fill()

  ctx.restore()

  }

function drawDefaultBoss(ctx: CanvasRenderingContext2D, boss: Enemy, t: number, hpRatio: number, enraged: boolean) {
  const pulse = 1 + Math.sin(t / (enraged ? 100 : 200)) * (enraged ? 0.12 : 0.08)

  ctx.save()
  ctx.scale(pulse, pulse)

  if (boss.recentlyHit > 0) {
    const hitFlash = Math.floor(boss.recentlyHit / 40) % 2 === 0
    if (hitFlash) {
      ctx.globalAlpha = 0.3
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI / 5) * i - Math.PI / 2
        const r = i % 2 === 0 ? boss.width / 2 + 10 : boss.width / 3.5 + 8
        const px = Math.cos(angle) * r
        const py = Math.sin(angle) * r * 0.8
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
      ctx.globalAlpha = 1
    }
  }

  const glowColor = enraged ? '#ff0080' : '#a855f7'
  const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, boss.width)
  glowGrad.addColorStop(0, `${glowColor}60`)
  glowGrad.addColorStop(1, 'transparent')
  ctx.fillStyle = glowGrad
  ctx.beginPath()
  ctx.arc(0, 0, boss.width, 0, Math.PI * 2)
  ctx.fill()

  const mainGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, boss.width / 2)
  mainGradient.addColorStop(0, enraged ? '#ff4488' : '#c084fc')
  mainGradient.addColorStop(0.4, enraged ? '#cc0066' : '#9b59b6')
  mainGradient.addColorStop(1, enraged ? '#880044' : '#6c3483')

  ctx.fillStyle = mainGradient
  ctx.shadowColor = glowColor
  ctx.shadowBlur = enraged ? 20 : 15

  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2
    const r = i % 2 === 0 ? boss.width / 2 : boss.width / 3.5
    const px = Math.cos(angle) * r
    const py = Math.sin(angle) * r * 0.8
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
  ctx.shadowBlur = 0

  const innerGlowColor = enraged ? '#ff66aa' : '#d8b4fe'
  ctx.strokeStyle = innerGlowColor
  ctx.lineWidth = 5
  ctx.shadowColor = innerGlowColor
  ctx.shadowBlur = 10

  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2
    const r = i % 2 === 0 ? boss.width / 2.5 : boss.width / 5
    const px = Math.cos(angle) * r
    const py = Math.sin(angle) * r * 0.8
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.stroke()
  ctx.shadowBlur = 0

  const corePulse = 0.7 + 0.3 * Math.sin(t / 60)
  const coreGlow = ctx.createRadialGradient(0, 5, 0, 0, 5, 30)
  coreGlow.addColorStop(0, enraged ? 'rgba(255, 68, 68, 0.8)' : 'rgba(139, 92, 246, 0.8)')
  coreGlow.addColorStop(1, 'transparent')
  ctx.fillStyle = coreGlow
  ctx.beginPath()
  ctx.arc(0, 5, 30 * corePulse, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = enraged ? '#ff4444' : '#8b5cf6'
  ctx.shadowColor = ctx.fillStyle
  ctx.shadowBlur = 15
  ctx.beginPath()
  ctx.arc(0, 5, 20 * corePulse, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = enraged ? '#ff8888' : '#a78bfa'
  ctx.beginPath()
  ctx.arc(0, 5, 12 * corePulse, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = enraged ? '#ffcccc' : '#e9d5ff'
  ctx.shadowBlur = 8
  ctx.beginPath()
  ctx.arc(0, 5, 6 * corePulse, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  const eyeGlow = enraged ? 0.8 + 0.2 * Math.sin(t / 50) : 0.6 + 0.4 * Math.sin(t / 100)
  ctx.fillStyle = `rgba(255, 0, 0, ${eyeGlow * 0.6})`
  ctx.beginPath()
  ctx.arc(-22, -12, 22, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(22, -12, 22, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = enraged ? '#FF4444' : '#FF0000'
  ctx.shadowColor = ctx.fillStyle
  ctx.shadowBlur = enraged ? 15 : 10
  ctx.beginPath()
  ctx.arc(-22, -12, 14, 0, Math.PI * 2)
  ctx.arc(22, -12, 14, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#000'
  ctx.shadowBlur = 0
  ctx.beginPath()
  ctx.arc(-22, -12, 8, 0, Math.PI * 2)
  ctx.arc(22, -12, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(-20, -14, 4, 0, Math.PI * 2)
  ctx.arc(24, -14, 4, 0, Math.PI * 2)
  ctx.fill()

  const wingColor = enraged ? '#881144' : '#4c1d95'
  ctx.fillStyle = wingColor
  ctx.shadowColor = enraged ? '#aa2266' : '#6c2dbd'
  ctx.shadowBlur = 8

  ctx.beginPath()
  ctx.moveTo(-boss.width / 2 + 5, 0)
  ctx.lineTo(-boss.width / 2 - 15, -25)
  ctx.lineTo(-boss.width / 2 - 10, -10)
  ctx.lineTo(-boss.width / 2 - 12, 30)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(boss.width / 2 - 5, 0)
  ctx.lineTo(boss.width / 2 + 15, -25)
  ctx.lineTo(boss.width / 2 + 10, -10)
  ctx.lineTo(boss.width / 2 + 12, 30)
  ctx.closePath()
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.fillStyle = '#7c3aed'
  ctx.shadowColor = '#7c3aed'
  ctx.shadowBlur = 5
  ctx.beginPath()
  ctx.roundRect(-boss.width / 2 - 6, -8, 10, 22, 2)
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(boss.width / 2 - 4, -8, 10, 22, 2)
  ctx.fill()
  ctx.shadowBlur = 0

  const muzzleColor = enraged ? '#FF4444' : '#ff00ff'
  const muzzlePulse = 0.8 + 0.2 * Math.sin(t / 80)
  ctx.fillStyle = muzzleColor
  ctx.shadowColor = muzzleColor
  ctx.shadowBlur = 8
  ctx.beginPath()
  ctx.arc(-boss.width / 2 - 1, 8, 5 * muzzlePulse, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(boss.width / 2 + 1, 8, 5 * muzzlePulse, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.restore()
}

export function drawBossHealthBar(ctx: CanvasRenderingContext2D, boss: Enemy) {
  const t = Date.now()
  const hpRatio = boss.hp / boss.maxHp
  const enraged = hpRatio < 0.3

  let normalColor = '#a855f7'
  let enragedColor = '#ff0080'
  let bossName = '👹 Boss'

  if (boss.name === 'cavern-guardian') {
    normalColor = '#ff8800'
    enragedColor = '#ff4400'
    bossName = '🗡️ 洞穴守卫'
  } else if (boss.name === 'sand-guardian') {
    normalColor = '#ffaa00'
    enragedColor = '#ff0066'
    bossName = '🏜️ 沙漠守卫'
  } else if (boss.name === 'mech-core') {
    normalColor = '#00ccff'
    enragedColor = '#ff00ff'
    bossName = '🤖 机械核心'
  }

  const barWidth = GAME_CONFIG.CANVAS_WIDTH - 40
  const barHeight = 18
  const barX = 20  // 固定在屏幕左侧
  const barY = 20  // 固定在屏幕顶部

  const barGlow = ctx.createRadialGradient(barX + barWidth / 2, barY + barHeight / 2, 0, barX + barWidth / 2, barY + barHeight / 2, barHeight * 3)
  barGlow.addColorStop(0, enraged ? `${enragedColor}60` : `${normalColor}60`)
  barGlow.addColorStop(1, 'transparent')
  ctx.fillStyle = barGlow
  ctx.fillRect(barX - 10, barY - 10, barWidth + 20, barHeight + 20)

  ctx.fillStyle = 'rgba(0,0,0,0.9)'
  ctx.shadowColor = enraged ? enragedColor : normalColor
  ctx.shadowBlur = 10
  ctx.beginPath()
  ctx.roundRect(barX, barY, barWidth, barHeight, 9)
  ctx.fill()
  ctx.shadowBlur = 0

  const hpBarGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY)
  if (enraged) {
    hpBarGradient.addColorStop(0, '#FF1744')
    hpBarGradient.addColorStop(0.5, '#FF4081')
    hpBarGradient.addColorStop(1, '#FF80AB')
  } else {
    hpBarGradient.addColorStop(0, '#FF4757')
    hpBarGradient.addColorStop(0.3, '#FF6B6B')
    hpBarGradient.addColorStop(0.5, '#FFA502')
    hpBarGradient.addColorStop(0.7, '#FFD700')
    hpBarGradient.addColorStop(1, '#00E676')
  }

  ctx.shadowColor = '#FFFFFF'
  ctx.shadowBlur = 3
  ctx.fillStyle = hpBarGradient
  ctx.beginPath()
  ctx.roundRect(barX, barY, barWidth * hpRatio, barHeight, 9)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.strokeRect(barX, barY, barWidth, barHeight)

  const nameGlow = ctx.createRadialGradient(barX + barWidth / 2, barY - 10, 0, barX + barWidth / 2, barY - 10, 20)
  nameGlow.addColorStop(0, 'rgba(255, 215, 0, 0.5)')
  nameGlow.addColorStop(1, 'transparent')
  ctx.fillStyle = nameGlow
  ctx.fillRect(barX + barWidth / 2 - 60, barY - 25, 120, 20)

  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur = 6
  ctx.fillText(bossName, barX + barWidth / 2, barY - 8)
  ctx.shadowBlur = 0

  if (enraged) {
    const warnGlow = ctx.createRadialGradient(0, barY - 25, 0, 0, barY - 25, 15)
    warnGlow.addColorStop(0, 'rgba(255, 71, 87, 0.6)')
    warnGlow.addColorStop(1, 'transparent')
    ctx.fillStyle = warnGlow
    ctx.fillRect(-50, barY - 32, 100, 15)

    ctx.fillStyle = '#FF4757'
    ctx.font = 'bold 12px sans-serif'
    ctx.shadowColor = '#FF4757'
    ctx.shadowBlur = 6
    ctx.fillText('⚠️ 狂暴模式', 0, barY - 22)
    ctx.shadowBlur = 0

    ctx.strokeStyle = `rgba(255, 68, 68, ${0.5 + Math.sin(t / 100) * 0.3})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-barWidth / 2 - 15, barY + barHeight / 2)
    ctx.lineTo(-barWidth / 2 - 5, barY + barHeight / 2)
    ctx.moveTo(barWidth / 2 + 5, barY + barHeight / 2)
    ctx.lineTo(barWidth / 2 + 15, barY + barHeight / 2)
    ctx.stroke()
  }
}