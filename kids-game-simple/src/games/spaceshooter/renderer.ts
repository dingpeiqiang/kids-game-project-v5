// === 太空射击 - 渲染模块 ===
// 所有绘制函数接收 SceneState 对象，不依赖 Scene 类，避免循环依赖
import type { Enemy, SceneState, Turret, TransformType } from './types'
import { BASE_W, BASE_H, SAFE_L, SAFE_R, SAFE_T, PLAYER_W, PLAYER_H } from './config'
import { LEVEL_BOSS_CONFIGS, TRANSFORM_CONFIGS } from './config'

// 模块级常量（避免每帧重建）
const PU_ICONS: Record<string, string> = {
  triple: '⚡', spread: '🔴', heal: '💚',
  shield: '🛡️', rapid: '🔥', laser: '✨', pierce: '💥', lightning: '⚡', turret: '🔧',
  turret_wide: '🔧', turret_sniper: '🎯', turret_burst: '💥', transform: '⭐'
}

// ========== 主渲染入口 ==========

export function renderToCanvas(s: SceneState): void {
  const ctx = s.ctx
  ctx.clearRect(0, 0, BASE_W, BASE_H)

  // 屏幕震动
  ctx.save()
  if (s.shakeAmt > 0) {
    ctx.translate((Math.random() - 0.5) * s.shakeAmt * 2, (Math.random() - 0.5) * s.shakeAmt * 2)
  }

  // 背景
  drawBackground(ctx, s)

  if (s.gameEnded) {
    drawParticles(ctx, s)
    // 冲击波
    for (let i = s.shockwaves.length - 1; i >= 0; i--) {
      const sw = s.shockwaves[i]
      sw.radius += (sw.maxRadius - sw.radius) * 0.12
      sw.life -= 0.035
      if (sw.life <= 0) { s.shockwaves.splice(i, 1); continue }
      ctx.save()
      ctx.globalAlpha = sw.life * 0.6
      ctx.strokeStyle = sw.color; ctx.lineWidth = 2 + sw.life * 3
      ctx.shadowColor = sw.color; ctx.shadowBlur = 4
      ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2); ctx.stroke()
      ctx.restore()
    }

    // === 游戏结束界面 ===
    const isVictory = s.isVictory()

    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(0, BASE_H / 2 - 80, BASE_W, 160)

    if (isVictory) {
      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 32px sans-serif'
      ctx.textAlign = 'center'
      ctx.shadowColor = '#FFD700'
      ctx.shadowBlur = 6
      ctx.fillText('🎉 恭喜通关!', BASE_W / 2, BASE_H / 2 - 45)
      ctx.shadowBlur = 0
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '18px sans-serif'
      ctx.fillText(`最终得分: ${s.getScore()}`, BASE_W / 2, BASE_H / 2 - 10)
      ctx.fillText(`到达关卡: ${s.getPowerupLevel()}`, BASE_W / 2, BASE_H / 2 + 15)
      ctx.fillText(`最高连击: ${s.combo}x`, BASE_W / 2, BASE_H / 2 + 40)
      ctx.fillStyle = '#4CAF50'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText('✨ 太棒了！点击重新开始 ✨', BASE_W / 2, BASE_H / 2 + 68)
    } else {
      ctx.fillStyle = '#FF4757'
      ctx.font = 'bold 28px sans-serif'
      ctx.textAlign = 'center'
      ctx.shadowColor = '#FF4757'
      ctx.shadowBlur = 4
      ctx.fillText('💀 游戏结束', BASE_W / 2, BASE_H / 2 - 40)
      ctx.shadowBlur = 0
      ctx.fillStyle = '#fff'
      ctx.font = '18px sans-serif'
      ctx.fillText(`最终得分: ${s.getScore()}`, BASE_W / 2, BASE_H / 2 - 5)
      ctx.fillText(`到达关卡: ${s.getPowerupLevel()}`, BASE_W / 2, BASE_H / 2 + 20)
      ctx.fillText(`最高连击: ${s.combo}x`, BASE_W / 2, BASE_H / 2 + 45)
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font = '14px sans-serif'
      ctx.fillText('点击重新开始', BASE_W / 2, BASE_H / 2 + 70)
    }
    ctx.restore()
    return
  }

  // 敌人子弹
  for (const b of s.enemyBullets) {
    ctx.fillStyle = b.color; ctx.shadowColor = b.color; ctx.shadowBlur = 4
    ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = b.color + '66'
    ctx.beginPath(); ctx.arc(b.x, b.y + 7, 4, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(b.x, b.y + 12, 3, 0, Math.PI * 2); ctx.fill()
  }
  ctx.shadowBlur = 0

  // 敌人
  for (const e of s.enemies) drawEnemy(ctx, e)

  // 炮台
  for (const t of s.turrets) drawTurret(ctx, t)

  // 玩家子弹
  for (const b of s.bullets) {
    if (b.pierce > 0) {
      ctx.fillStyle = '#FF9800'; ctx.shadowColor = '#FF9800'; ctx.shadowBlur = 6
      ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI * 2); ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(255,152,0,0.35)'; ctx.fillRect(b.x - 3, b.y, 6, 20)
    } else {
      ctx.fillStyle = '#00E5FF'; ctx.shadowColor = '#00E5FF'; ctx.shadowBlur = 5
      ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(0,229,255,0.3)'; ctx.fillRect(b.x - 2.5, b.y, 5, 16)
    }
  }
  ctx.shadowBlur = 0

  // 导弹
  for (const m of (s as any).missiles || []) {
    ctx.save()
    ctx.translate(m.x, m.y)
    const angle = Math.atan2(m.vy, m.vx)
    ctx.rotate(angle + Math.PI / 2)
    
    // 导弹主体
    ctx.fillStyle = '#FF5722'; ctx.shadowColor = '#FF5722'; ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.moveTo(0, -12)
    ctx.lineTo(-6, 8)
    ctx.lineTo(-3, 5)
    ctx.lineTo(3, 5)
    ctx.lineTo(6, 8)
    ctx.closePath()
    ctx.fill()
    
    // 导弹尾焰
    ctx.shadowBlur = 12
    ctx.fillStyle = '#FF9800'
    ctx.beginPath()
    ctx.moveTo(-3, 5)
    ctx.lineTo(0, 18 + Math.random() * 5)
    ctx.lineTo(3, 5)
    ctx.closePath()
    ctx.fill()
    
    ctx.shadowBlur = 0
    ctx.restore()
  }

  // 闪电球
  for (const lb of (s as any).lightningBalls || []) {
    ctx.save()
    ctx.translate(lb.x, lb.y)
    
    const t = Date.now()
    const pulse = 1 + Math.sin(t / 80) * 0.15
    
    // 外发光
    ctx.shadowColor = lb.color
    ctx.shadowBlur = 15
    ctx.fillStyle = lb.color
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.arc(0, 0, lb.size * pulse * 1.5, 0, Math.PI * 2)
    ctx.fill()
    
    // 主体
    ctx.globalAlpha = 1
    ctx.shadowBlur = 20
    ctx.beginPath()
    ctx.arc(0, 0, lb.size * pulse, 0, Math.PI * 2)
    ctx.fill()
    
    // 内芯
    ctx.shadowBlur = 0
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(0, 0, lb.size * pulse * 0.4, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.restore()
  }

  // 玩家
  if (!s.gameEnded && !s.isDying) drawPlayer(ctx, s)

  // 粒子
  drawParticles(ctx, s)

  // 冲击波
  for (let i = s.shockwaves.length - 1; i >= 0; i--) {
    const sw = s.shockwaves[i]
    ctx.save()
    ctx.globalAlpha = sw.life * 0.6
    ctx.strokeStyle = sw.color; ctx.lineWidth = 2 + sw.life * 3
    ctx.shadowColor = sw.color; ctx.shadowBlur = 4
    ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2); ctx.stroke()
    ctx.restore()
  }

  // 道具
  for (const p of s.powerups) {
    ctx.save(); ctx.translate(p.x, p.y)
    const bob = Math.sin(Date.now() / 200 + p.x) * 3
    ctx.translate(0, bob)
    const pulse = 1 + Math.sin(Date.now() / 150) * 0.15
    ctx.scale(pulse, pulse)
    ctx.fillStyle = 'rgba(255,215,0,0.4)'; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 10
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.shadowBlur = 4
    ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.stroke()
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill()
    ctx.shadowBlur = 0
    ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(PU_ICONS[p.type] || '?', 0, 1)
    ctx.restore()
  }

  // 浮动文字
  for (let i = s.floatTexts.length - 1; i >= 0; i--) {
    const ft = s.floatTexts[i]
    ctx.save()
    ctx.globalAlpha = Math.min(1, ft.life * 2)
    ctx.translate(ft.x, ft.y)
    ctx.scale(ft.scale, ft.scale)
    ctx.fillStyle = ft.color; ctx.shadowColor = ft.color; ctx.shadowBlur = 3
    ctx.font = `bold ${ft.size}px sans-serif`; ctx.textAlign = 'center'
    ctx.fillText(ft.text, 0, 0)
    ctx.restore()
  }
  ctx.globalAlpha = 1

  // 闪屏
  if (s.screenFlash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.6, s.screenFlash * 0.3)})`
    ctx.fillRect(-20, -20, BASE_W + 40, BASE_H + 40)
  }

  // 掉血红色闪烁
  if (s.damageFlash > 0) {
    ctx.fillStyle = `rgba(255,0,0,${Math.min(0.5, s.damageFlash * 1.5)})`
    ctx.fillRect(-20, -20, BASE_W + 40, BASE_H + 40)
  }

  // HUD
  drawHUD(ctx, s)

  // 开始提示
  if (!s.gameStarted) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, BASE_H / 2 - 65, BASE_W, 130)
    ctx.fillStyle = '#fff'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('🔫 太空射击', BASE_W / 2, BASE_H / 2 - 20)
    ctx.font = '14px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.fillText('移动飞船躲避敌弹，消灭外星入侵者!', BASE_W / 2, BASE_H / 2 + 8)
    ctx.fillStyle = '#00E5FF'; ctx.font = 'bold 15px sans-serif'
    ctx.fillText('🤖 自动射击！只需移动飞船！', BASE_W / 2, BASE_H / 2 + 30)
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '12px sans-serif'
    ctx.fillText('点击屏幕开始 · 连击越多越爽！', BASE_W / 2, BASE_H / 2 + 50)
  }

  ctx.restore()
}

// ========== 子绘制函数 ==========

function drawBackground(ctx: CanvasRenderingContext2D, s: SceneState): void {
  const grad = ctx.createLinearGradient(0, 0, 0, BASE_H)
  grad.addColorStop(0, '#0a0a1e'); grad.addColorStop(0.5, '#0d1b2a'); grad.addColorStop(1, '#1b2838')
  ctx.fillStyle = grad; ctx.fillRect(0, 0, BASE_W, BASE_H)

  for (const star of s.stars) {
    star.y += star.speed * s.difficulty * 0.5
    if (star.y > BASE_H) { star.y = -2; star.x = Math.random() * BASE_W }
    ctx.fillStyle = `rgba(255,255,255,${star.bright})`
    ctx.beginPath(); ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2); ctx.fill()
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, s: SceneState): void {
  const level = s.getPlayerLevel()
  ctx.save(); ctx.translate(s.playerX, s.playerY)

  // 获取变身配置
  const transformConfig = s.transform ? TRANSFORM_CONFIGS[s.transform.type] : null

  // 变身光环特效
  if (transformConfig) {
    const transformColor = transformConfig.color
    const accentColor = transformConfig.accentColor
    const pulse = 1 + Math.sin(Date.now() / 80) * 0.08
    const rotation = Date.now() / 400
    ctx.save()
    ctx.rotate(rotation)
    ctx.strokeStyle = transformColor + '88'
    ctx.lineWidth = 4; ctx.shadowColor = transformColor; ctx.shadowBlur = 15
    ctx.beginPath(); ctx.arc(0, 0, 42 * pulse, 0, Math.PI * 2); ctx.stroke()
    ctx.strokeStyle = accentColor + 'AA'
    ctx.lineWidth = 2; ctx.shadowBlur = 8
    ctx.beginPath(); ctx.arc(0, 0, 34 * pulse, 0, Math.PI * 2); ctx.stroke()
    
    // 变身能量粒子
    for (let i = 0; i < 12; i++) {
      const angle = (Date.now() / 200) + (i * Math.PI * 2 / 12)
      const px = Math.cos(angle) * 38 * pulse
      const py = Math.sin(angle) * 38 * pulse
      const particlePulse = 0.6 + 0.4 * Math.sin(Date.now() / 100 + i)
      ctx.fillStyle = transformColor; ctx.shadowColor = transformColor; ctx.shadowBlur = 4
      ctx.globalAlpha = particlePulse
      ctx.beginPath(); ctx.arc(px, py, 4 * particlePulse, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.restore()
  }

  // 护盾特效（道具护盾 - 金色旋转光环）
  if (s.shieldTimer > 0) {
    const pulse = 1 + Math.sin(Date.now() / 100) * 0.1
    const rotation = Date.now() / 500
    ctx.save()
    ctx.rotate(rotation)
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)'
    ctx.lineWidth = 3; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 10
    ctx.beginPath(); ctx.arc(0, 0, 38 * pulse, 0, Math.PI * 2); ctx.stroke()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.lineWidth = 2; ctx.shadowBlur = 5
    ctx.beginPath(); ctx.arc(0, 0, 30 * pulse, 0, Math.PI * 2); ctx.stroke()
    for (let i = 0; i < 10; i++) {
      const angle = (Date.now() / 250) + (i * Math.PI * 2 / 10)
      const px = Math.cos(angle) * 35 * pulse
      const py = Math.sin(angle) * 35 * pulse
      ctx.fillStyle = '#FFD700'; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 2
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()
  }

  // 受伤后无敌闪烁（蓝色脉冲）
  if (s.invincible > 0 && s.shieldTimer <= 0) {
    const flash = Math.sin(Date.now() / 80) * 0.3 + 0.5
    ctx.save()
    ctx.globalAlpha = flash
    ctx.strokeStyle = `rgba(79, 195, 247, ${0.3 + flash * 0.3})`
    ctx.lineWidth = 3; ctx.shadowColor = '#4FC3F7'; ctx.shadowBlur = 6
    ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI * 2); ctx.stroke()
    ctx.strokeStyle = `rgba(255, 255, 255, ${flash * 0.5})`
    ctx.lineWidth = 1.5; ctx.shadowBlur = 3
    ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.stroke()
    ctx.restore()
  }

  // 引擎火焰（变身时改变火焰颜色）
  const flicker = Math.random() * 4
  const flameHeight = transformConfig ? 22 + flicker + level * 3 : 14 + flicker + level * 2
  const flameGrad = ctx.createLinearGradient(0, PLAYER_H / 2, 0, PLAYER_H / 2 + flameHeight)
  
  if (transformConfig) {
    // 变身火焰颜色
    const tc = transformConfig.color
    const ac = transformConfig.accentColor
    flameGrad.addColorStop(0, tc); flameGrad.addColorStop(0.4, ac); flameGrad.addColorStop(0.7, tc); flameGrad.addColorStop(1, 'transparent')
  } else if (level >= 8) {
    flameGrad.addColorStop(0, '#FFD700'); flameGrad.addColorStop(0.3, '#FF6B6B'); flameGrad.addColorStop(0.6, '#E040FB'); flameGrad.addColorStop(1, 'transparent')
  } else if (level >= 5) {
    flameGrad.addColorStop(0, '#00E676'); flameGrad.addColorStop(0.5, '#FF6B6B'); flameGrad.addColorStop(1, 'transparent')
  } else {
    flameGrad.addColorStop(0, '#00E5FF'); flameGrad.addColorStop(0.5, '#FF6B6B'); flameGrad.addColorStop(1, 'transparent')
  }
  ctx.fillStyle = flameGrad
  
  // 变身时火焰更宽
  const flameWidth = transformConfig ? 14 + level : 8 + level
  ctx.beginPath(); ctx.moveTo(-flameWidth - level, PLAYER_H / 2); ctx.lineTo(0, PLAYER_H / 2 + flameHeight); ctx.lineTo(flameWidth + level, PLAYER_H / 2); ctx.fill()

  // 机身颜色（变身时使用变身颜色）
  const bodyColor = transformConfig ? transformConfig.color : (level >= 8 ? '#FFD700' : level >= 5 ? '#9C27B0' : '#45B7D1')
  const bodyShadowBlur = transformConfig ? 10 : (level >= 8 ? 6 : level >= 5 ? 4 : 2)
  ctx.fillStyle = bodyColor; ctx.shadowColor = bodyColor; ctx.shadowBlur = bodyShadowBlur
  
  // 变身时机身更大
  const scale = transformConfig ? 1.2 : 1
  ctx.save()
  ctx.scale(scale, scale)
  
  ctx.beginPath()
  ctx.moveTo(0, -PLAYER_H / 2); ctx.lineTo(-PLAYER_W / 2, PLAYER_H / 2)
  ctx.lineTo(-PLAYER_W / 4, PLAYER_H / 3); ctx.lineTo(PLAYER_W / 4, PLAYER_H / 3)
  ctx.lineTo(PLAYER_W / 2, PLAYER_H / 2); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0

  // 机翼
  const wingSize = transformConfig ? 10 + level : 6 + level
  const wingColor = transformConfig ? transformConfig.color : (level >= 8 ? '#FFA000' : level >= 5 ? '#7B1FA2' : '#2E86AB')
  ctx.fillStyle = wingColor
  ctx.beginPath(); ctx.moveTo(-PLAYER_W / 2 - wingSize, PLAYER_H / 2 + 2); ctx.lineTo(-PLAYER_W / 4, PLAYER_H / 6); ctx.lineTo(-PLAYER_W / 2, PLAYER_H / 2); ctx.fill()
  ctx.beginPath(); ctx.moveTo(PLAYER_W / 2 + wingSize, PLAYER_H / 2 + 2); ctx.lineTo(PLAYER_W / 4, PLAYER_H / 6); ctx.lineTo(PLAYER_W / 2, PLAYER_H / 2); ctx.fill()

  // 驾驶舱
  const cockpitColor = transformConfig ? transformConfig.color : (level >= 8 ? '#FFD700' : level >= 5 ? '#E040FB' : '#00E5FF')
  ctx.fillStyle = cockpitColor; ctx.shadowColor = cockpitColor; ctx.shadowBlur = transformConfig ? 8 : (level >= 8 ? 6 : level >= 5 ? 4 : 3)
  ctx.beginPath(); ctx.ellipse(0, -2, 5 + Math.floor(level / 3), 8 + Math.floor(level / 3), 0, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0
  
  ctx.restore() // 恢复缩放

  // 变身图标显示
  if (transformConfig) {
    ctx.fillStyle = transformConfig.accentColor; ctx.shadowColor = transformConfig.accentColor; ctx.shadowBlur = 6
    ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText(transformConfig.icon, 0, -PLAYER_H / 2 - 12)
    ctx.shadowBlur = 0
  }

  // 等级标识（非变身状态显示）
  if (!transformConfig) {
    ctx.fillStyle = level >= 8 ? '#FFD700' : level >= 5 ? '#E040FB' : '#FFFFFF'
    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText(`Lv${level}`, 0, -PLAYER_H / 2 - 10)
  }
  
  ctx.restore()
}

function drawTurret(ctx: CanvasRenderingContext2D, t: Turret): void {
  ctx.save(); ctx.translate(t.x, t.y)

  const colors: Record<string, { base: string; inner: string; glow: string; barrel: string }> = {
    normal: { base: '#00BCD4', inner: '#006064', glow: '#00BCD4', barrel: '#4DD0E1' },
    wide: { base: '#FF9800', inner: '#E65100', glow: '#FF9800', barrel: '#FFCC80' },
    sniper: { base: '#E040FB', inner: '#880E4F', glow: '#E040FB', barrel: '#EA80FC' },
    burst: { base: '#FF4444', inner: '#C62828', glow: '#FF4444', barrel: '#FF8A80' }
  }

  const typeColors = colors[t.type] || colors.normal
  const lifeRatio = Math.max(0, t.life / 20000)

  // 底座
  ctx.fillStyle = typeColors.base; ctx.shadowColor = typeColors.glow; ctx.shadowBlur = t.type === 'burst' ? 8 : 5
  ctx.beginPath(); ctx.arc(0, 0, t.type === 'sniper' ? 16 : 14, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0

  // 内圆
  ctx.fillStyle = typeColors.inner
  ctx.beginPath(); ctx.arc(0, 0, t.type === 'sniper' ? 11 : 9, 0, Math.PI * 2); ctx.fill()

  // 炮管
  ctx.fillStyle = typeColors.barrel
  if (t.type === 'sniper') {
    // 狙击炮台：长炮管
    ctx.fillRect(-2, -28, 4, 22)
    // 狙击镜
    ctx.fillStyle = '#1A1A2E'
    ctx.beginPath(); ctx.arc(0, -32, 5, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#FFD700'
    ctx.beginPath(); ctx.arc(0, -32, 3, 0, Math.PI * 2); ctx.fill()
  } else if (t.type === 'burst') {
    // 爆发炮台：双炮管
    ctx.fillRect(-6, -20, 4, 16)
    ctx.fillRect(2, -20, 4, 16)
  } else if (t.type === 'wide') {
    // 全屏炮台：扇形炮管
    ctx.beginPath()
    ctx.moveTo(-8, -6)
    ctx.lineTo(-2, -22)
    ctx.lineTo(2, -22)
    ctx.lineTo(8, -6)
    ctx.closePath()
    ctx.fill()
  } else {
    // 普通炮台：标准炮管
    ctx.fillRect(-3, -20, 6, 16)
  }

  // 范围指示（淡显）- 全屏炮台显示全屏范围
  if (t.type === 'wide') {
    ctx.strokeStyle = `rgba(255,152,0,${lifeRatio * 0.15})`
    ctx.lineWidth = 2
    ctx.setLineDash([6, 6])
    ctx.beginPath(); ctx.rect(0 - BASE_W / 2 + 20, 0 - BASE_H / 2 + 20, BASE_W - 40, BASE_H - 40); ctx.stroke()
    ctx.setLineDash([])
  } else {
    ctx.strokeStyle = `rgba(255,255,255,${lifeRatio * 0.2})`
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath(); ctx.arc(0, 0, t.radius, 0, Math.PI * 2); ctx.stroke()
    ctx.setLineDash([])
  }

  // 炮台类型标识
  ctx.fillStyle = typeColors.barrel
  ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  const typeLabel = t.type === 'normal' ? 'N' : t.type === 'wide' ? 'W' : t.type === 'sniper' ? 'S' : 'B'
  ctx.fillText(typeLabel, 0, 5)

  // 剩余时间文字
  ctx.fillStyle = `rgba(255,255,255,${0.5 + lifeRatio * 0.5})`
  ctx.font = 'bold 7px sans-serif'
  ctx.fillText(`${Math.ceil(t.life / 1000)}s`, 0, -8)

  ctx.restore()
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy): void {
  ctx.save(); ctx.translate(e.x, e.y)
  ctx.fillStyle = e.color; ctx.shadowColor = e.color; ctx.shadowBlur = 3

  if (e.shape === 'circle') {
    ctx.beginPath(); ctx.arc(0, 0, e.w / 2, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-4, -2, 3, 0, Math.PI * 2); ctx.arc(4, -2, 3, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(-4, -1, 1.5, 0, Math.PI * 2); ctx.arc(4, -1, 1.5, 0, Math.PI * 2); ctx.fill()
  } else if (e.shape === 'diamond') {
    ctx.beginPath(); ctx.moveTo(0, -e.h / 2); ctx.lineTo(e.w / 2, 0); ctx.lineTo(0, e.h / 2); ctx.lineTo(-e.w / 2, 0); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0
    ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1
  } else if (e.shape === 'hex') {
    ctx.shadowBlur = 4; ctx.beginPath()
    for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i - Math.PI / 6; const px = Math.cos(a) * e.w / 2; const py = Math.sin(a) * e.h / 2; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py) }
    ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-5, -2, 3.5, 0, Math.PI * 2); ctx.arc(5, -2, 3.5, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(-5, -1, 2, 0, Math.PI * 2); ctx.arc(5, -1, 2, 0, Math.PI * 2); ctx.fill()
  } else if (e.shape === 'triangle') {
    // 闪电三角敌 - 快速Z字形
    ctx.shadowBlur = 5; ctx.beginPath()
    ctx.moveTo(0, -e.h / 2); ctx.lineTo(e.w / 2, e.h / 2); ctx.lineTo(-e.w / 2, e.h / 2); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 2, 3, 0, Math.PI * 2); ctx.fill()
  } else if (e.shape === 'square') {
    // 护盾方块敌
    ctx.shadowBlur = 4; ctx.fillRect(-e.w / 2, -e.h / 2, e.w, e.h); ctx.shadowBlur = 0
    ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.5; ctx.fillRect(-e.w / 2 + 3, -e.h / 2 + 3, e.w - 6, e.h - 6); ctx.globalAlpha = 1
  } else if (e.shape === 'pentagon') {
    // 五边形坦克敌 - 大体积高HP
    ctx.shadowBlur = 5; ctx.beginPath()
    for (let i = 0; i < 5; i++) { const a = (Math.PI * 2 / 5) * i - Math.PI / 2; const px = Math.cos(a) * e.w / 2; const py = Math.sin(a) * e.h / 2; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py) }
    ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill()
  } else if (e.shape === 'boss') {
    ctx.beginPath(); ctx.arc(0, 0, e.w / 2, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0
    ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.8
    ctx.fillRect(-3, -e.h / 2, 6, e.h); ctx.fillRect(-e.w / 2, -3, e.w, 6); ctx.globalAlpha = 1
  } else if (e.shape === 'final_boss') {
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.moveTo(0, -e.h / 2); ctx.lineTo(-e.w / 2, 0); ctx.lineTo(-e.w / 3, e.h / 2)
    ctx.lineTo(e.w / 3, e.h / 2); ctx.lineTo(e.w / 2, 0); ctx.closePath(); ctx.fill()
    ctx.shadowBlur = 0
    ctx.fillStyle = '#FFD700'; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 6
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0
    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(-15, -10); ctx.lineTo(15, -10)
    ctx.moveTo(-15, 10); ctx.lineTo(15, 10); ctx.stroke()
  } else if (e.bossId !== undefined) {
    // 关卡专属 Boss 绘制
    drawLevelBoss(ctx, e)
  }

  // 护盾光环
  if (e.shieldHP !== undefined && e.shieldHP > 0) {
    ctx.strokeStyle = '#00E5FF'; ctx.lineWidth = 2
    ctx.shadowColor = '#00E5FF'; ctx.shadowBlur = 4
    ctx.beginPath(); ctx.arc(0, 0, e.w / 2 + 5, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0
    ctx.fillStyle = '#00E5FF'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('盾', 0, -e.h / 2 - 8)
  }
  
  // Boss护盾技能光环
  if ((e as any).bossHasShield) {
    const t = Date.now()
    const pulse = 1 + Math.sin(t / 100) * 0.1
    ctx.save()
    ctx.scale(pulse, pulse)
    ctx.strokeStyle = '#00BCD4'; ctx.lineWidth = 3
    ctx.shadowColor = '#00BCD4'; ctx.shadowBlur = 10
    ctx.beginPath(); ctx.arc(0, 0, e.w / 2 + 10, 0, Math.PI * 2); ctx.stroke()
    // 内部光环
    ctx.strokeStyle = 'rgba(0, 188, 212, 0.5)'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(0, 0, e.w / 2 + 18, 0, Math.PI * 2); ctx.stroke()
    ctx.restore()
  }

  // 血条（只对Boss和精英敌人显示）
  if (e.maxHp > 1) {
    const maxBarW = Math.min(e.w + 4, 80)  // 限制血条最大宽度
    const barW = maxBarW, barH = 3, barY = -e.h / 2 - 6
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-barW / 2, barY, barW, barH)
    const hpRatio = Math.max(0, Math.min(1, e.hp / e.maxHp))  // 确保比例在0-1之间
    ctx.fillStyle = hpRatio > 0.6 ? '#00E676' : hpRatio > 0.3 ? '#FFA502' : '#FF4757'
    ctx.fillRect(-barW / 2, barY, barW * hpRatio, barH)
  }

  // 关卡 Boss 名称标签
  if (e.bossId !== undefined) {
    const bossCfg = LEVEL_BOSS_CONFIGS[e.bossId - 1]
    if (bossCfg) {
      ctx.shadowBlur = 0
      ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillStyle = bossCfg.accentColor
      ctx.fillText(bossCfg.name, 0, -e.h / 2 - 14)
    }
  }

  ctx.restore()
}

/** 关卡专属 Boss 绘制（Lv1~9） */
function drawLevelBoss(ctx: CanvasRenderingContext2D, e: Enemy): void {
  const t = Date.now()
  const bossCfg = LEVEL_BOSS_CONFIGS[(e.bossId ?? 1) - 1]
  const accent = bossCfg?.accentColor ?? '#FFFFFF'
  const enraged = (e.bossPhase ?? 0) >= 1
  const pulse = 1 + Math.sin(t / 180) * 0.06
  ctx.scale(pulse, pulse)
  ctx.shadowBlur = enraged ? 8 : 5

  switch (e.bossId) {
    case 1: {
      // 红眼巡逻者：双眼圆形战机
      ctx.beginPath(); ctx.arc(0, 0, e.w / 2, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#CC2222'
      ctx.beginPath(); ctx.moveTo(-e.w / 2, 0); ctx.lineTo(-e.w / 2 - 10, e.h / 3); ctx.lineTo(-e.w / 4, e.h / 3); ctx.closePath(); ctx.fill()
      ctx.beginPath(); ctx.moveTo(e.w / 2, 0); ctx.lineTo(e.w / 2 + 10, e.h / 3); ctx.lineTo(e.w / 4, e.h / 3); ctx.closePath(); ctx.fill()
      ctx.shadowBlur = 0
      const eyePulse = 0.5 + 0.5 * Math.sin(t / 200)
      ctx.fillStyle = `rgba(255,${enraged ? 50 : 150},0,${eyePulse})`
      ctx.shadowColor = '#FF0000'; ctx.shadowBlur = 4
      ctx.beginPath(); ctx.arc(-7, -4, 5, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(7, -4, 5, 0, Math.PI * 2); ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = '#880000'; ctx.fillRect(-3, e.h / 3, 6, 8)
      break
    }
    case 2: {
      // 菱晶战士：旋转菱形 + 晶核
      const rot = t / 600
      ctx.save(); ctx.rotate(rot)
      ctx.beginPath(); ctx.moveTo(0, -e.h / 2); ctx.lineTo(e.w / 2, 0); ctx.lineTo(0, e.h / 2); ctx.lineTo(-e.w / 2, 0); ctx.closePath(); ctx.fill()
      ctx.restore()
      ctx.save(); ctx.rotate(-rot * 1.5)
      ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.globalAlpha = 0.6
      ctx.beginPath(); ctx.moveTo(0, -e.h * 0.35); ctx.lineTo(e.w * 0.35, 0); ctx.lineTo(0, e.h * 0.35); ctx.lineTo(-e.w * 0.35, 0); ctx.closePath(); ctx.stroke()
      ctx.globalAlpha = 1; ctx.restore()
      ctx.fillStyle = accent; ctx.shadowColor = accent; ctx.shadowBlur = 6
      ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill()
      ctx.shadowBlur = 0
      break
    }
    case 3: {
      // 六翼天蛾：六边形 + 6 条翼
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + t / 1200
        const px = Math.cos(a) * e.w / 2; const py = Math.sin(a) * e.h / 2
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
      }
      ctx.closePath(); ctx.fill()
      ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.globalAlpha = 0.7
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + t / 1200
        const innerR = e.w * 0.45; const outerR = e.w * 0.75
        ctx.beginPath()
        ctx.moveTo(Math.cos(a) * innerR, Math.sin(a) * innerR)
        ctx.lineTo(Math.cos(a) * outerR, Math.sin(a) * outerR)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      ctx.fillStyle = accent; ctx.shadowColor = accent; ctx.shadowBlur = 5
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill()
      ctx.shadowBlur = 0
      break
    }
    case 4: {
      // 幽影重炮：宽体炮台
      ctx.beginPath()
      ctx.moveTo(-e.w / 2, -e.h / 4); ctx.lineTo(e.w / 2, -e.h / 4)
      ctx.lineTo(e.w / 2 + 6, e.h / 4); ctx.lineTo(-e.w / 2 - 6, e.h / 4)
      ctx.closePath(); ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = '#6A1B9A'
      for (let k = -1; k <= 1; k++) {
        ctx.fillRect(k * 16 - 4, e.h / 4, 8, 12)
      }
      ctx.strokeStyle = accent; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.6
      ctx.beginPath(); ctx.moveTo(-e.w / 2, 0); ctx.lineTo(e.w / 2, 0); ctx.stroke()
      ctx.globalAlpha = 1
      const corePulse = 0.7 + 0.3 * Math.sin(t / 150)
      ctx.fillStyle = `rgba(206,147,216,${corePulse})`; ctx.shadowColor = accent; ctx.shadowBlur = 4
      ctx.beginPath(); ctx.arc(0, -e.h / 8, 8, 0, Math.PI * 2); ctx.fill()
      ctx.shadowBlur = 0
      break
    }
    case 5: {
      // 炎核毁灭者：多角星
      const spikes = enraged ? 8 : 6
      ctx.beginPath()
      for (let i = 0; i < spikes * 2; i++) {
        const a = (Math.PI / spikes) * i + t / 800
        const r = i % 2 === 0 ? e.w / 2 : e.w / 4
        const px = Math.cos(a) * r; const py = Math.sin(a) * r
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
      }
      ctx.closePath(); ctx.fill()
      ctx.strokeStyle = accent; ctx.lineWidth = 3
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t / 100)
      ctx.shadowColor = accent; ctx.shadowBlur = 8
      ctx.beginPath(); ctx.arc(0, 0, e.w * 0.6, 0, Math.PI * 2); ctx.stroke()
      ctx.globalAlpha = 1; ctx.shadowBlur = 0
      ctx.fillStyle = '#FFD700'; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 6
      ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill()
      ctx.shadowBlur = 0
      break
    }
    case 6: {
      // 幻影双生：两个镜像小体
      const offset = 14 + Math.sin(t / 400) * 4
      for (const side of [-1, 1]) {
        const ox = side * offset
        ctx.fillStyle = e.color; ctx.shadowColor = e.color; ctx.shadowBlur = 4
        ctx.beginPath()
        ctx.moveTo(ox, -e.h / 2 + 5); ctx.lineTo(ox - e.w / 4, e.h / 2 - 5); ctx.lineTo(ox + e.w / 4, e.h / 2 - 5)
        ctx.closePath(); ctx.fill()
        ctx.fillStyle = accent; ctx.shadowColor = accent; ctx.shadowBlur = 3
        ctx.beginPath(); ctx.arc(ox, -2, 5, 0, Math.PI * 2); ctx.fill()
      }
      ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.globalAlpha = 0.6
      ctx.shadowColor = accent; ctx.shadowBlur = 6
      ctx.beginPath(); ctx.moveTo(-offset, 0); ctx.lineTo(offset, 0); ctx.stroke()
      ctx.globalAlpha = 1; ctx.shadowBlur = 0
      break
    }
    case 7: {
      // 星核宙斯：五角星 + 电弧
      ctx.beginPath()
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI / 5) * i - Math.PI / 2
        const r = i % 2 === 0 ? e.w / 2 : e.w / 4.5
        const px = Math.cos(a) * r; const py = Math.sin(a) * r
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
      }
      ctx.closePath(); ctx.fill()
      ctx.save(); ctx.rotate(t / 400)
      ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.globalAlpha = 0.7
      ctx.shadowColor = accent; ctx.shadowBlur = 5
      for (let i = 0; i < 3; i++) {
        const a = (Math.PI * 2 / 3) * i
        ctx.beginPath(); ctx.arc(0, 0, e.w * 0.55, a, a + Math.PI * 0.5); ctx.stroke()
      }
      ctx.restore(); ctx.globalAlpha = 1; ctx.shadowBlur = 0
      ctx.fillStyle = '#FFD700'; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 8
      ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill()
      ctx.shadowBlur = 0
      break
    }
    case 8: {
      // 深渊吞噬者：黑洞 + 紫色漩涡
      ctx.fillStyle = '#1A1A2E'; ctx.shadowColor = '#7C4DFF'; ctx.shadowBlur = 10
      ctx.beginPath(); ctx.arc(0, 0, e.w / 2, 0, Math.PI * 2); ctx.fill()
      ctx.save(); ctx.rotate(t / 500)
      for (let i = 0; i < 3; i++) {
        const a = (Math.PI * 2 / 3) * i
        ctx.strokeStyle = accent; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.8
        ctx.shadowColor = accent; ctx.shadowBlur = 5
        ctx.beginPath(); ctx.arc(0, 0, e.w * 0.3, a, a + Math.PI * 0.6); ctx.stroke()
      }
      ctx.restore(); ctx.globalAlpha = 1; ctx.shadowBlur = 0
      ctx.strokeStyle = accent; ctx.lineWidth = 3; ctx.globalAlpha = 0.5
      ctx.beginPath(); ctx.arc(0, 0, e.w * 0.48, 0, Math.PI * 2); ctx.stroke()
      ctx.globalAlpha = 1
      ctx.fillStyle = accent; ctx.shadowColor = accent; ctx.shadowBlur = 6
      ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill()
      ctx.shadowBlur = 0
      break
    }
    case 9: {
      // 混沌之主：不规则多边形 + 动态颜色
      const sides = enraged ? 9 : 7
      const colorShift = (Math.sin(t / 300) + 1) / 2
      const r2 = Math.floor(255 * colorShift)
      const b2 = Math.floor(255 * (1 - colorShift))
      ctx.fillStyle = `rgb(${r2},0,${b2})`
      ctx.shadowColor = ctx.fillStyle
      ctx.beginPath()
      for (let i = 0; i < sides; i++) {
        const a = (Math.PI * 2 / sides) * i + t / 700
        const r = (e.w / 2) * (0.85 + 0.15 * Math.sin(t / 200 + i))
        const px = Math.cos(a) * r; const py = Math.sin(a) * r
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
      }
      ctx.closePath(); ctx.fill()
      for (let ring = 0; ring < 2; ring++) {
        ctx.strokeStyle = ring === 0 ? '#FF0066' : '#6600FF'
        ctx.lineWidth = 2; ctx.globalAlpha = 0.6
        ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 3
        ctx.beginPath(); ctx.arc(0, 0, e.w * (0.6 + ring * 0.15), t / 300 + ring, t / 300 + ring + Math.PI * 1.5); ctx.stroke()
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0
      const coreR = 9 + Math.sin(t / 100) * 3
      ctx.fillStyle = '#FF80AB'; ctx.shadowColor = '#FF80AB'; ctx.shadowBlur = 8
      ctx.beginPath(); ctx.arc(0, 0, coreR, 0, Math.PI * 2); ctx.fill()
      ctx.shadowBlur = 0
      break
    }
    default: {
      ctx.beginPath(); ctx.arc(0, 0, e.w / 2, 0, Math.PI * 2); ctx.fill()
      break
    }
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, s: SceneState): void {
  const colorGroups: Record<string, typeof s.particles> = {}
  for (let i = s.particles.length - 1; i >= 0; i--) {
    const p = s.particles[i]
    if (!colorGroups[p.color]) colorGroups[p.color] = []
    colorGroups[p.color].push(p)
  }
  for (const color in colorGroups) {
    ctx.fillStyle = color
    for (const p of colorGroups[color]) {
      ctx.globalAlpha = p.life
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill()
    }
  }
  ctx.globalAlpha = 1
}

const LEVEL_COLORS = ['#4FC3F7', '#81D4FA', '#4DD0E1', '#26C6DA', '#00BCD4', '#00ACC1', '#0097A7', '#00838F', '#006064', '#FFD700']

function drawHUD(ctx: CanvasRenderingContext2D, s: SceneState): void {
  ctx.save()

  // 分数
  ctx.fillStyle = '#FFD700'; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 4
  ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'right'
  ctx.fillText(`★ ${s.getScore()}`, BASE_W - SAFE_R, SAFE_T + 10)
  ctx.shadowBlur = 0

  // 生命值
  const hpRatio = s.playerHP / s.maxHP
  ctx.fillStyle = hpRatio > 0.6 ? '#00E676' : hpRatio > 0.3 ? '#FFA502' : '#FF4757'
  ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'right'
  ctx.fillText(`❤️ ${s.playerHP}/${s.maxHP}`, BASE_W - SAFE_R, SAFE_T + 32)

  // 等级
  const level = s.getPlayerLevel()
  ctx.fillStyle = LEVEL_COLORS[level - 1] || '#FFD700'
  ctx.font = `bold ${16 + Math.floor(level / 2)}px sans-serif`; ctx.textAlign = 'left'
  ctx.fillText(`✈️ Lv${level}`, SAFE_L, SAFE_T + 10)

  // 剩余复活
  if (s.respawnsLeft > 0) {
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left'
    ctx.fillText(`🔄 ×${s.respawnsLeft}`, SAFE_L, SAFE_T + 30)
  }

  // 连击
  if (s.combo >= 3) {
    const pulse = 1 + Math.sin(Date.now() / 100) * 0.08
    const comboColor = s.combo >= 20 ? '#FF4757' : s.combo >= 10 ? '#FFD700' : '#4FC3F7'
    ctx.save()
    ctx.translate(BASE_W / 2, SAFE_T + 35)
    ctx.scale(pulse, pulse)
    ctx.fillStyle = comboColor; ctx.shadowColor = comboColor; ctx.shadowBlur = 5
    ctx.font = `bold ${20 + Math.min(s.combo, 15)}px sans-serif`; ctx.textAlign = 'center'
    ctx.fillText(`${s.combo} COMBO!`, 0, 0)
    ctx.restore()
  }

  // 击杀数
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right'
  ctx.fillText(`💀 ${s.totalKills}`, BASE_W - SAFE_R, SAFE_T + 50)

  // 道具状态（左上角，放大显示）
  let buffY = SAFE_T + 68; ctx.textAlign = 'left'
  if (s.shieldTimer > 0) { ctx.fillStyle = '#FFD700'; ctx.font = 'bold 15px sans-serif'; ctx.fillText(`🛡️护盾 ${Math.ceil(s.shieldTimer)}s`, SAFE_L, buffY); buffY += 20 }
  if (s.invincible > 0) { ctx.fillStyle = '#4FC3F7'; ctx.font = 'bold 15px sans-serif'; ctx.fillText(`💫无敌 ${Math.ceil(s.invincible)}s`, SAFE_L, buffY); buffY += 20 }
  if (s.tripleShot > 0) { ctx.fillStyle = '#FFD700'; ctx.font = 'bold 15px sans-serif'; ctx.fillText(`⚡三连 x${s.tripleStacks} ${Math.ceil(s.tripleShot / 1000)}s`, SAFE_L, buffY); buffY += 20 }
  if (s.spreadShot > 0) { ctx.fillStyle = '#FF6B6B'; ctx.font = 'bold 15px sans-serif'; ctx.fillText(`🔴散射 x${s.spreadStacks} ${Math.ceil(s.spreadShot / 1000)}s`, SAFE_L, buffY); buffY += 20 }
  if (s.rapidShot > 0) { ctx.fillStyle = '#FF5722'; ctx.font = 'bold 15px sans-serif'; ctx.fillText(`🔥速射 x${s.rapidStacks} ${Math.ceil(s.rapidShot / 1000)}s`, SAFE_L, buffY); buffY += 20 }
  if (s.pierceShot > 0) { ctx.fillStyle = '#FF9800'; ctx.font = 'bold 15px sans-serif'; ctx.fillText(`💥击穿 x${s.pierceStacks} ${Math.ceil(s.pierceShot / 1000)}s`, SAFE_L, buffY); buffY += 20 }
  if (s.laserShot > 0) { ctx.fillStyle = '#E040FB'; ctx.font = 'bold 15px sans-serif'; ctx.fillText(`✨激光 x${s.laserStacks} ${Math.ceil(s.laserShot / 1000)}s`, SAFE_L, buffY); buffY += 20 }
  if (s.lightningShot > 0) { ctx.fillStyle = '#FFD700'; ctx.font = 'bold 15px sans-serif'; ctx.fillText(`⚡闪电 x${s.lightningStacks} ${Math.ceil(s.lightningTimer / 1000)}s`, SAFE_L, buffY); buffY += 20 }

  // 变身状态显示
  if (s.transform) {
    const config = TRANSFORM_CONFIGS[s.transform.type]
    const transformRatio = s.transform.duration / s.transform.maxDuration
    const pulse = 1 + Math.sin(Date.now() / 80) * 0.05
    
    ctx.save()
    ctx.translate(BASE_W / 2, buffY - 10)
    ctx.scale(pulse, pulse)
    
    // 变身名称和图标
    ctx.fillStyle = config.color; ctx.shadowColor = config.color; ctx.shadowBlur = 6
    ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText(`${config.icon} ${config.name}`, 0, 0)
    
    // 变身进度条背景
    const barW = 120; const barH = 6
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.beginPath(); ctx.roundRect(-barW / 2, 10, barW, barH, 3); ctx.fill()
    
    // 变身进度条
    const barColor = transformRatio > 0.5 ? config.color : transformRatio > 0.25 ? '#FFA502' : '#FF4757'
    ctx.fillStyle = barColor; ctx.shadowColor = barColor; ctx.shadowBlur = 3
    ctx.beginPath(); ctx.roundRect(-barW / 2, 10, barW * transformRatio, barH, 3); ctx.fill()
    
    // 剩余时间
    ctx.fillStyle = '#FFFFFF'; ctx.shadowBlur = 2; ctx.font = 'bold 11px sans-serif'
    ctx.fillText(`${Math.ceil(s.transform.duration / 1000)}s`, 0, 30)
    
    ctx.restore()
    buffY += 45
  }
  
  // 变身冷却显示
  if (s.transformCooldown > 0) {
    const config = TRANSFORM_CONFIGS.super // 默认显示超级变身图标
    const cooldownRatio = 1 - (s.transformCooldown / 30000) // 30秒冷却
    const cdSeconds = Math.ceil(s.transformCooldown / 1000)
    
    ctx.save()
    ctx.translate(BASE_W / 2, buffY - 5)
    
    // 冷却图标（灰色）
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText(`${config.icon} 变身冷却中`, 0, 0)
    
    // 冷却进度条背景
    const barW = 100; const barH = 4
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.beginPath(); ctx.roundRect(-barW / 2, 12, barW, barH, 2); ctx.fill()
    
    // 冷却进度条
    ctx.fillStyle = '#666666'; ctx.shadowBlur = 0
    ctx.beginPath(); ctx.roundRect(-barW / 2, 12, barW * cooldownRatio, barH, 2); ctx.fill()
    
    // 冷却时间
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = 'bold 10px sans-serif'
    ctx.fillText(`${cdSeconds}s`, 0, 28)
    
    ctx.restore()
    buffY += 35
  }

  ctx.textBaseline = 'alphabetic'
  ctx.restore()
}