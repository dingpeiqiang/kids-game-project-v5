import type { GameEngine } from '@shell/services/gameEngine'
import { audioService } from '@shell/services/audio'
import { app } from '@shell/services/appBridge'
import { applyCanvasMobileStyles, bindCanvasPointerInput } from '@shell/utils/canvasMobileUtils'

// ——————————————————————————————————————————————
//  打地鼠  Whack-a-Mole
//  操作：鼠标点击 / 触屏点击
//  Canvas: 400 x 600
// ——————————————————————————————————————————————

const COLS = 3
const ROWS = 3
const HOLE_COUNT = COLS * ROWS

// 洞口布局（中心坐标）
const HOLE_POSITIONS = (() => {
  const pts: { x: number; y: number }[] = []
  const xStart = 70, xStep = 130
  const yStart = 180, yStep = 130
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      pts.push({ x: xStart + c * xStep, y: yStart + r * yStep })
    }
  }
  return pts
})()

const HOLE_RX = 48  // 椭圆半轴 x
const HOLE_RY = 16  // 椭圆半轴 y
const MOLE_W  = 58
const MOLE_H  = 62

type MoleType = 'normal' | 'gold' | 'bomb' | 'double' | 'invisible'

interface Mole {
  holeIdx: number
  type: MoleType
  state: 'rising' | 'visible' | 'hiding' | 'idle' | 'hit'
  offsetY: number   // 0 = 完全露出，MOLE_H = 隐藏在洞里
  timer: number     // 帧计数
  showDuration: number
  hitScale: number
  hitAlpha: number
  isHit?: boolean   // 是否已被击打
}

interface Particle {
  x: number; y: number
  vx: number; vy: number
  color: string
  life: number; maxLife: number
  size: number
}

interface FloatText {
  x: number; y: number
  text: string; color: string
  life: number; vy: number
}

let unbindPointer: (() => void) | null = null
let animationFrameId: number | null = null

export function destroyWhackMole() {
  unbindPointer?.()
  unbindPointer = null
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

export function initWhackMole(engine: GameEngine, onEnd: () => void) {
  const cvs = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  const ctx = cvs.getContext('2d')!
  const W = cvs.width, H = cvs.height

  // —— 游戏状态 ——
  const moles: Mole[] = Array.from({ length: HOLE_COUNT }, (_, i) => ({
    holeIdx: i, type: 'normal', state: 'idle',
    offsetY: MOLE_H, timer: 0, showDuration: 100,
    hitScale: 1, hitAlpha: 1
  }))

  const particles: Particle[] = []
  const floatTexts: FloatText[] = []

  let gameDuration = 60   // 总时长（秒），可从设置中读取
  let timeLeft = gameDuration
  let frameCount = 0
  let nextSpawnTimer = 0
  let spawnInterval = 90  // 初始每90帧出现一只
  let gameEnded = false
  const RISE_FRAMES = 10
  const HIDE_FRAMES = 10
  
  // ====== 游戏状态管理 ======
  let scoreMultiplier = 1  // 分数倍数（双倍buff）
  let doubleScoreEndTime = 0  // 双倍分数结束时间
  let currentPhase: 'early' | 'mid' | 'late' = 'early'  // 当前难度阶段
  let backgroundTheme = 'grassland'  // 背景主题
  
  // ====== 道具系统（库存模式）======
  let inventory: string[] = [] // 道具库存
  
  // 道具图标映射
  const powerupIcons: Record<string, string> = {
    'time_plus': '⏰',     // 加时 - 增加15秒
    'slow': '🐌',         // 减速 - 地鼠出现速度减半
    'score2x': '✨',      // 双倍分数 - 10秒内×2
    'auto_hit': '🎯'      // 自动击中 - 5秒内自动打中所有地鼠
  }
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id
    }))
    
    app.setupCustomPowerupBar('whackMole', powerups, inventory, (powerupId: string) => {
      if (usePowerup(powerupId)) {
        audioService.collect()
      }
    })
  }
  
  // 使用道具
  function usePowerup(type: string): boolean {
    const index = inventory.indexOf(type)
    if (index === -1) return false
    
    inventory.splice(index, 1)
    
    switch (type) {
      case 'time_plus':
        // 加时 - 增加15秒
        timeLeft += 15
        audioService.win()
        break
        
      case 'slow':
        // 减速 - 地鼠出现速度减半，持续10秒
        ;(window as any).moleSlow = Date.now() + 10000
        audioService.collect()
        break
        
      case 'score2x':
        // 双倍分数 - 10秒内×2
        ;(window as any).moleScore2x = Date.now() + 10000
        audioService.win()
        break
        
      case 'auto_hit':
        // 自动击中 - 5秒内自动打中所有地鼠
        ;(window as any).moleAutoHit = Date.now() + 5000
        audioService.win()
        break
    }
    
    return true
  }

  // 难度阶段：渐进式动态难度
  function updateDifficulty() {
    const elapsed = gameDuration - timeLeft
    
    // 前期 (0-20秒)：新手友好
    if (elapsed < 20) {
      currentPhase = 'early'
      spawnInterval = 85  // 刷新较慢
    } 
    // 中期 (20-40秒)：节奏提升
    else if (elapsed < 40) {
      currentPhase = 'mid'
      spawnInterval = 60  // 刷新加快
    } 
    // 后期 (40-60秒)：极速挑战
    else {
      currentPhase = 'late'
      spawnInterval = 40  // 极速刷新
    }
  }

  function spawnMole() {
    const idleHoles = moles
      .map((m, i) => ({ m, i }))
      .filter(({ m }) => m.state === 'idle')
    if (idleHoles.length === 0) return
    const pick = idleHoles[Math.floor(Math.random() * idleHoles.length)]
    const m = pick.m

    // 根据地鼠类型概率生成（随难度阶段调整）
    const rand = Math.random()
    let typeProbabilities
    
    if (currentPhase === 'early') {
      // 前期：普通地鼠为主
      typeProbabilities = { normal: 0.70, gold: 0.10, bomb: 0.08, double: 0.12, invisible: 0 }
    } else if (currentPhase === 'mid') {
      // 中期：特殊地鼠增加
      typeProbabilities = { normal: 0.55, gold: 0.12, bomb: 0.10, double: 0.15, invisible: 0.08 }
    } else {
      // 后期：高难度组合
      typeProbabilities = { normal: 0.40, gold: 0.15, bomb: 0.12, double: 0.18, invisible: 0.15 }
    }
    
    // 根据地鼠类型分配
    if (rand < typeProbabilities.normal) m.type = 'normal'
    else if (rand < typeProbabilities.normal + typeProbabilities.gold) m.type = 'gold'
    else if (rand < typeProbabilities.normal + typeProbabilities.gold + typeProbabilities.bomb) m.type = 'bomb'
    else if (rand < typeProbabilities.normal + typeProbabilities.gold + typeProbabilities.bomb + typeProbabilities.double) m.type = 'double'
    else m.type = 'invisible'

    m.state = 'rising'
    m.offsetY = MOLE_H
    m.timer = 0
    m.hitScale = 1
    m.hitAlpha = 1
    m.isHit = false
    
    // 不同类型停留时间
    switch (m.type) {
      case 'gold':
        m.showDuration = 50  // 黄金地鼠停留短
        break
      case 'bomb':
        m.showDuration = 130  // 炸弹地鼠停留久
        break
      case 'double':
        m.showDuration = 70  // 双倍地鼠中等
        break
      case 'invisible':
        m.showDuration = 35  // 隐身地鼠极短
        break
      default:
        m.showDuration = 85  // 普通地鼠
    }
  }

  function hitMole(idx: number) {
    const m = moles[idx]
    if (m.state !== 'visible' && m.state !== 'rising') return
    if (m.isHit) return  // 防止重复击打

    const hole = HOLE_POSITIONS[idx]
    m.isHit = true
    
    // 触发震动反馈（如果支持）
    if (navigator.vibrate) {
      navigator.vibrate(50)  // 轻微震动50ms
    }

    if (m.type === 'bomb') {
      // 炸弹地鼠：误击扣分
      emitParticles(hole.x, hole.y - MOLE_H * 0.4, '#FF4757', 15)
      spawnFloatText(hole.x, hole.y - MOLE_H * 0.6, '-20', '#FF4757')
      ;(engine as any).state.score = Math.max(0, (engine as any).state.score - 20)
      audioService.fail()  // 失败音效
      
      // 炸弹爆炸特效
      emitExplosionEffect(hole.x, hole.y - MOLE_H * 0.4)
    } else if (m.type === 'double') {
      // 双倍地鼠：触发双倍buff
      const baseScore = 15
      const gained = engine.addScore(baseScore * scoreMultiplier, hole.x, hole.y - MOLE_H * 0.6)
      emitParticles(hole.x, hole.y - MOLE_H * 0.4, '#FF6B9D', 12)
      spawnFloatText(hole.x, hole.y - MOLE_H * 0.6, `+${gained} ✨`, '#FF6B9D')
      
      // 激活双倍buff（5秒）
      scoreMultiplier = 2
      doubleScoreEndTime = Date.now() + 5000
      audioService.buff()  // 道具生效音效
      
      // 双倍buff特效
      emitBuffEffect(hole.x, hole.y - MOLE_H * 0.4, '#FF6B9D')
    } else {
      // 普通或黄金地鼠
      const base = m.type === 'gold' ? 30 : 10
      const gained = engine.addScore(base * scoreMultiplier, hole.x, hole.y - MOLE_H * 0.6)
      
      let color, particleCount
      if (m.type === 'gold') {
        color = '#FFD700'
        particleCount = 15
        // 黄金地鼠金光特效
        emitGoldEffect(hole.x, hole.y - MOLE_H * 0.4)
      } else if (m.type === 'invisible') {
        color = '#A78BFA'
        particleCount = 10
      } else {
        color = '#6BCB77'
        particleCount = 8
      }
      
      emitParticles(hole.x, hole.y - MOLE_H * 0.4, color, particleCount)
      spawnFloatText(hole.x, hole.y - MOLE_H * 0.6, `+${gained}`, color)
      audioService.collect()  // 收集音效
    }

    m.state = 'hit'
    m.timer = 0
    m.hitScale = 1.3
    m.hitAlpha = 1
  }

  function emitParticles(x: number, y: number, color: string, n: number) {
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1.5 + Math.random() * 3
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color, size: 3 + Math.random() * 4,
        life: 30, maxLife: 30
      })
    }
  }

  // 炸弹爆炸特效
  function emitExplosionEffect(x: number, y: number) {
    // 大颗粒爆炸效果
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i
      const speed = 3 + Math.random() * 2
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#FF6B35', size: 6 + Math.random() * 4,
        life: 25, maxLife: 25
      })
    }
    // 小颗粒烟雾
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 2
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        color: '#666', size: 2 + Math.random() * 3,
        life: 35, maxLife: 35
      })
    }
  }

  // 双倍buff特效
  function emitBuffEffect(x: number, y: number, color: string) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 2
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color, size: 4 + Math.random() * 3,
        life: 40, maxLife: 40
      })
    }
  }

  // 黄金地鼠金光特效
  function emitGoldEffect(x: number, y: number) {
    // 金色闪光
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 3
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: '#FFD700', size: 3 + Math.random() * 4,
        life: 35, maxLife: 35
      })
    }
    // 白色高光
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1.5 + Math.random() * 2
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color: '#FFF', size: 2 + Math.random() * 2,
        life: 25, maxLife: 25
      })
    }
  }

  function spawnFloatText(x: number, y: number, text: string, color: string) {
    floatTexts.push({ x, y, text, color, life: 50, vy: -1.2 })
  }

  // —— 绘制 ——
  function drawBackground() {
    // 根据主题绘制不同背景
    let grad: CanvasGradient
    
    switch (backgroundTheme) {
      case 'grassland':  // 草地田园
        grad = ctx.createLinearGradient(0, 0, 0, H)
        grad.addColorStop(0, '#87D37C')
        grad.addColorStop(0.45, '#6BCB77')
        grad.addColorStop(0.46, '#8B6914')
        grad.addColorStop(1, '#6B4A1A')
        break
      case 'starry':  // 星空
        grad = ctx.createLinearGradient(0, 0, 0, H)
        grad.addColorStop(0, '#1a1a2e')
        grad.addColorStop(0.5, '#16213e')
        grad.addColorStop(0.51, '#2d1b0e')
        grad.addColorStop(1, '#1a0f0a')
        break
      case 'seaside':  // 海岛
        grad = ctx.createLinearGradient(0, 0, 0, H)
        grad.addColorStop(0, '#87CEEB')
        grad.addColorStop(0.45, '#4FC3F7')
        grad.addColorStop(0.46, '#F4E4C1')
        grad.addColorStop(1, '#D4A574')
        break
      default:
        grad = ctx.createLinearGradient(0, 0, 0, H)
        grad.addColorStop(0, '#87D37C')
        grad.addColorStop(0.45, '#6BCB77')
        grad.addColorStop(0.46, '#8B6914')
        grad.addColorStop(1, '#6B4A1A')
    }
    
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // 地平线
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, H * 0.45)
    ctx.lineTo(W, H * 0.45)
    ctx.stroke()
  }

  function drawHole(idx: number) {
    const { x, y } = HOLE_POSITIONS[idx]
    // 洞口椭圆（深色）
    ctx.save()
    ctx.fillStyle = '#3B2507'
    ctx.beginPath()
    ctx.ellipse(x, y, HOLE_RX, HOLE_RY, 0, 0, Math.PI * 2)
    ctx.fill()
    // 洞口高光
    ctx.fillStyle = 'rgba(255,255,255,0.07)'
    ctx.beginPath()
    ctx.ellipse(x - 8, y - 4, HOLE_RX * 0.5, HOLE_RY * 0.5, -0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  function drawMole(m: Mole) {
    if (m.state === 'idle') return
    const { x, y } = HOLE_POSITIONS[m.holeIdx]
    const drawY = y - MOLE_H * 0.9 + m.offsetY

    ctx.save()
    ctx.globalAlpha = m.hitAlpha

    // clip：不画出洞口下方
    ctx.beginPath()
    ctx.ellipse(x, y, HOLE_RX + 4, HOLE_RY + 4, 0, Math.PI, Math.PI * 2)
    ctx.rect(x - HOLE_RX - 4, -H, HOLE_RX * 2 + 8, H + y)
    ctx.clip()

    ctx.translate(x, drawY + MOLE_H / 2)
    ctx.scale(m.hitScale, m.hitScale)
    ctx.translate(-MOLE_W / 2, -MOLE_H / 2)

    if (m.type === 'bomb') {
      drawBomb(ctx, 0, 0, MOLE_W, MOLE_H)
    } else {
      drawMoleBody(ctx, 0, 0, MOLE_W, MOLE_H, 
        m.type === 'gold', 
        m.type === 'invisible',
        m.state === 'hit'
      )
    }

    ctx.restore()
  }

  function drawMoleBody(
    c: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    isGold: boolean,
    isInvisible: boolean = false,
    isHit: boolean = false
  ) {
    const bodyColor = isGold ? '#C8960C' : '#8B5E3C'
    const faceColor = isGold ? '#FFD700' : '#C69B6B'
    const eyeColor = '#2C1A0E'
    
    // 隐身地鼠半透明
    if (isInvisible) {
      c.globalAlpha = 0.5
    }

    // 身体
    c.fillStyle = bodyColor
    c.beginPath()
    c.ellipse(x + w / 2, y + h * 0.6, w * 0.42, h * 0.42, 0, 0, Math.PI * 2)
    c.fill()

    // 脸
    c.fillStyle = faceColor
    c.beginPath()
    c.ellipse(x + w / 2, y + h * 0.38, w * 0.38, h * 0.35, 0, 0, Math.PI * 2)
    c.fill()

    // 眼睛（被击打后委屈表情）
    if (isHit) {
      // 委屈捂脸表情 - 闭眼
      c.fillStyle = eyeColor
      c.beginPath()
      c.arc(x + w * 0.35, y + h * 0.3, 3, 0, Math.PI * 2)
      c.fill()
      c.beginPath()
      c.arc(x + w * 0.65, y + h * 0.3, 3, 0, Math.PI * 2)
      c.fill()
      
      // 眼泪
      c.fillStyle = '#87CEEB'
      c.beginPath()
      c.ellipse(x + w * 0.35, y + h * 0.35, 2, 3, 0, 0, Math.PI * 2)
      c.fill()
      c.beginPath()
      c.ellipse(x + w * 0.65, y + h * 0.35, 2, 3, 0, 0, Math.PI * 2)
      c.fill()
    } else {
      // 正常睁眼
      c.fillStyle = eyeColor
      c.beginPath()
      c.ellipse(x + w * 0.35, y + h * 0.3, 4, 5, 0, 0, Math.PI * 2)
      c.fill()
      c.beginPath()
      c.ellipse(x + w * 0.65, y + h * 0.3, 4, 5, 0, 0, Math.PI * 2)
      c.fill()

      // 眼睛高光
      c.fillStyle = '#fff'
      c.beginPath()
      c.arc(x + w * 0.35 + 1.5, y + h * 0.28, 1.5, 0, Math.PI * 2)
      c.fill()
      c.beginPath()
      c.arc(x + w * 0.65 + 1.5, y + h * 0.28, 1.5, 0, Math.PI * 2)
      c.fill()
    }

    // 鼻子
    c.fillStyle = '#FF8080'
    c.beginPath()
    c.ellipse(x + w / 2, y + h * 0.42, 5, 3.5, 0, 0, Math.PI * 2)
    c.fill()

    // 嘴巴（被击打后撇嘴）
    if (isHit) {
      c.strokeStyle = '#2C1A0E'
      c.lineWidth = 2
      c.lineCap = 'round'
      c.beginPath()
      c.arc(x + w / 2, y + h * 0.5, 6, Math.PI, 0)
      c.stroke()
    } else {
      // 微笑
      c.strokeStyle = '#2C1A0E'
      c.lineWidth = 2
      c.lineCap = 'round'
      c.beginPath()
      c.arc(x + w / 2, y + h * 0.46, 6, 0, Math.PI)
      c.stroke()
      
      // 牙
      c.fillStyle = '#fff'
      c.fillRect(x + w / 2 - 5, y + h * 0.47, 4.5, 4)
      c.fillRect(x + w / 2 + 0.5, y + h * 0.47, 4.5, 4)
    }

    // 金色光圈
    if (isGold && !isHit) {
      c.strokeStyle = 'rgba(255,215,0,0.7)'
      c.lineWidth = 3
      c.beginPath()
      c.arc(x + w / 2, y + h * 0.38, w * 0.44, 0, Math.PI * 2)
      c.stroke()
    }
    
    // 恢复透明度
    if (isInvisible) {
      c.globalAlpha = 1
    }
  }

  function drawBomb(
    c: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number
  ) {
    // 炸弹身体
    c.fillStyle = '#2d2d2d'
    c.beginPath()
    c.arc(x + w / 2, y + h * 0.55, w * 0.38, 0, Math.PI * 2)
    c.fill()

    // 反光
    c.fillStyle = 'rgba(255,255,255,0.18)'
    c.beginPath()
    c.ellipse(x + w * 0.38, y + h * 0.42, 8, 6, -0.5, 0, Math.PI * 2)
    c.fill()

    // 导火索
    c.strokeStyle = '#996633'
    c.lineWidth = 3
    c.lineCap = 'round'
    c.beginPath()
    c.moveTo(x + w / 2 + 2, y + h * 0.22)
    c.bezierCurveTo(
      x + w * 0.7, y + h * 0.1,
      x + w * 0.5, y + h * 0.05,
      x + w * 0.62, y - h * 0.02
    )
    c.stroke()

    // 火花
    c.fillStyle = '#FFD700'
    c.shadowColor = '#FF8C00'
    c.shadowBlur = 8
    c.beginPath()
    c.arc(x + w * 0.62, y - h * 0.02, 5, 0, Math.PI * 2)
    c.fill()
    c.shadowBlur = 0

    // 骷髅符号 ☠
    c.fillStyle = '#fff'
    c.font = `bold ${w * 0.42}px sans-serif`
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillText('☠', x + w / 2, y + h * 0.56)
  }

  function drawHUD() {
    // 顶栏：得分/连击由 CanvasGamePlay 统一壳层展示，此处仅保留局内计时与 buff
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    roundRect(ctx, 10, 8, W - 20, 44, 12)
    ctx.fill()

    const hudY = 30
    if (scoreMultiplier > 1 && Date.now() < doubleScoreEndTime) {
      const remainingTime = Math.ceil((doubleScoreEndTime - Date.now()) / 1000)
      ctx.fillStyle = timeLeft <= 10 ? '#FF4757' : '#FFD700'
      ctx.font = 'bold 20px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(`⏱ ${timeLeft}s`, 22, hudY)
      ctx.fillStyle = '#FF6B9D'
      ctx.font = 'bold 15px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`✨ 双倍 ${remainingTime}s`, W / 2, hudY)
    } else {
      ctx.fillStyle = timeLeft <= 10 ? '#FF4757' : '#FFD700'
      ctx.font = 'bold 22px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`⏱ 剩余 ${timeLeft} 秒`, W / 2, hudY)
    }

    // 倒计时低于10秒闪红
    if (timeLeft <= 10) {
      ctx.strokeStyle = `rgba(255,71,87,${0.4 + 0.4 * Math.sin(frameCount * 0.25)})`
      ctx.lineWidth = 4
      roundRect(ctx, 2, 2, W - 4, H - 4, 0)
      ctx.stroke()
    }
  }

  function drawLegend() {
    const items = [
      { color: '#8B5E3C', label: '+10 普通' },
      { color: '#FFD700', label: '+30 黄金' },
      { color: '#FF6B9D', label: '+15 双倍' },
      { color: '#A78BFA', label: '+50 隐身' },
      { color: '#2d2d2d', label: '-20 炸弹' },
    ]
    const startX = 14
    let cx = startX
    const cy = H - 28
    ctx.font = '10px sans-serif'
    ctx.textBaseline = 'middle'
    for (const item of items) {
      ctx.fillStyle = item.color
      ctx.beginPath()
      ctx.arc(cx + 6, cy, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'left'
      ctx.fillText(item.label, cx + 15, cy)
      cx += ctx.measureText(item.label).width + 22
    }
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.save()
      ctx.globalAlpha = p.life / p.maxLife
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  function drawFloatTexts() {
    for (const f of floatTexts) {
      ctx.save()
      ctx.globalAlpha = f.life / 50
      ctx.fillStyle = f.color
      ctx.font = 'bold 20px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = '#000'
      ctx.shadowBlur = 6
      ctx.fillText(f.text, f.x, f.y)
      ctx.restore()
    }
  }

  // —— 主循环 ——
  function update() {
    frameCount++

    // 秒倒计时
    if (frameCount % 60 === 0) {
      timeLeft--
      updateDifficulty()
      if (timeLeft <= 0) {
        gameEnded = true
        engine.setVictory(false)
        engine.endGame()
        onEnd()
        return
      }
    }
    
    // 检查双倍buff是否过期
    if (scoreMultiplier > 1 && Date.now() >= doubleScoreEndTime) {
      scoreMultiplier = 1
    }

    // 生成地鼠（根据地鼠阶段调整生成概率）
    nextSpawnTimer++
    if (nextSpawnTimer >= spawnInterval) {
      nextSpawnTimer = 0
      spawnMole()
      
      // 后期有多只地鼠同时出现
      if (currentPhase === 'late' && Math.random() < 0.4) {
        spawnMole()
      } else if (currentPhase === 'mid' && Math.random() < 0.25) {
        spawnMole()
      }
    }

    // 更新地鼠
    for (const m of moles) {
      m.timer++
      switch (m.state) {
        case 'rising':
          m.offsetY = MOLE_H * (1 - m.timer / RISE_FRAMES)
          if (m.timer >= RISE_FRAMES) {
            m.offsetY = 0
            m.state = 'visible'
            m.timer = 0
          }
          break
        case 'visible':
          if (m.timer >= m.showDuration) {
            m.state = 'hiding'
            m.timer = 0
          }
          break
        case 'hiding':
          m.offsetY = MOLE_H * (m.timer / HIDE_FRAMES)
          if (m.timer >= HIDE_FRAMES) {
            m.state = 'idle'
            m.offsetY = MOLE_H
            m.isHit = false  // 重置击打状态
          }
          break
        case 'hit':
          m.hitScale = 1.3 - 0.3 * (m.timer / 12)
          m.hitAlpha = 1 - m.timer / 14
          m.offsetY = MOLE_H * (m.timer / 14)
          if (m.timer >= 14) {
            m.state = 'idle'
            m.offsetY = MOLE_H
            m.hitScale = 1
            m.hitAlpha = 1
            m.isHit = false  // 重置击打状态
          }
          break
      }
    }

    // 更新粒子
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.x += p.vx; p.y += p.vy
      p.vy += 0.15
      p.life--
      if (p.life <= 0) particles.splice(i, 1)
    }

    // 更新浮动文字
    for (let i = floatTexts.length - 1; i >= 0; i--) {
      const f = floatTexts[i]
      f.y += f.vy
      f.life--
      if (f.life <= 0) floatTexts.splice(i, 1)
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H)
    drawBackground()

    // 先画洞（底层）
    for (let i = 0; i < HOLE_COUNT; i++) drawHole(i)

    // 画地鼠（注意遮挡顺序：行从上到下）
    for (const m of [...moles].sort((a, b) => {
      return HOLE_POSITIONS[a.holeIdx].y - HOLE_POSITIONS[b.holeIdx].y
    })) {
      drawMole(m)
    }

    drawParticles()
    drawFloatTexts()
    drawHUD()
    drawLegend()
  }

  // —— 输入事件 ——
  function checkHit(cx: number, cy: number) {
    for (let i = 0; i < HOLE_COUNT; i++) {
      const m = moles[i]
      if (m.state !== 'visible' && m.state !== 'rising') continue
      const { x, y } = HOLE_POSITIONS[i]
      const moleTop = y - MOLE_H * 0.9 + m.offsetY
      const moleBot = moleTop + MOLE_H
      const moleLeft = x - MOLE_W / 2
      const moleRight = x + MOLE_W / 2
      if (cx >= moleLeft && cx <= moleRight && cy >= moleTop && cy <= moleBot) {
        hitMole(i)
        return
      }
    }
  }

  applyCanvasMobileStyles(cvs)
  unbindPointer = bindCanvasPointerInput(cvs, (x, y) => checkHit(x, y))

  // —— 启动 ——
  engine.start()

  function loop() {
    if (!document.getElementById('mainGameCanvas')) {
      unbindPointer?.()
      return
    }
    if (gameEnded) {
      unbindPointer?.()
      return
    }
    if (!engine.canTick()) {
      draw()
      animationFrameId = requestAnimationFrame(loop)
      return
    }
    update()
    draw()
    animationFrameId = requestAnimationFrame(loop)
  }
  
      
  loop()
}

// roundRect helper
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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
