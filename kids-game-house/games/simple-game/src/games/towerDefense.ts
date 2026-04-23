import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { app } from '../App'
import { userService } from '../services/userService'
import { apiSubmitGameResult, apiStartGameSession } from '../services/apiClient'

export function initTowerDefense(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  if (!canvas) return
  const W = 400, H = 600
  const ctx = canvas.getContext('2d')!
  if (!ctx) return

  // === 配置 ===
  const GRID = 10          // 格子数
  const CELL = 40          // 每格像素
  const HUD_H = 60         // 顶部操作栏高度
  const PATH_COLOR = 'rgba(100, 100, 130, 0.25)'
  const MAX_COMBO_DISPLAY = 20 // 最大连击显示
  const WAVE_INTERVAL_BASE = 300 // 基础波次间隔（帧）
  
  // 无尽关卡配置 - 平衡优化版（敌人速度再提升一倍）
  const INFINITE_WAVE_CONFIG = {
    baseEnemyCount: 4,        // 基础敌人数量
    enemyGrowthRate: 0.6,     // 敌人数量增长率 - 适度提高
    maxEnemyCount: 28,        // 最大敌人数量上限 - 略微提高
    
    baseHp: 10,               // 基础血量 - 从12降到10，更合理
    hpGrowthRate: 0.08,       // 血量增长率 - 从0.10降到0.08，减缓增长
    
    baseSpeed: 0.08575,       // 基础速度 - 从0.042875提升一倍到0.08575
    speedGrowthRate: 0.001715, // 速度增长率 - 从0.0008575提升一倍到0.001715
    maxSpeedMultiplier: 1.8,  // 最大速度倍数
    
    bossInterval: 5,          // Boss出现间隔
    specialEnemyUnlock: 12,   // 特殊敌人解锁波次
    eliteEnemyUnlock: 25,     // 精英敌人解锁波次
  }

  // 路径拐点（格子坐标）
  const PATH_POINTS = [
    { gx: -1, gy: 1 },
    { gx: 3, gy: 1 },
    { gx: 3, gy: 3 },
    { gx: 7, gy: 3 },
    { gx: 7, gy: 5 },
    { gx: 5, gy: 5 },
    { gx: 5, gy: 7 },
    { gx: 9, gy: 7 },
    { gx: 9, gy: 9 },
  ]
  // 转为像素坐标（格子中心）
  const pathPixels = PATH_POINTS.map(p => ({
    x: p.gx * CELL + CELL / 2,
    y: p.gy * CELL + HUD_H + CELL / 2
  }))

  // 塔类型 - 初始数值较低，通过升级逐步增强
  const TOWER_TYPES = [
    { id: 'laser', name: '激光塔', cost: 50,  damage: 0.8, range: 2.5, fireRate: 140, color: '#00E5FF', bulletColor: '#00E5FF', bulletSpeed: 9, icon: '⚡' },
    { id: 'cannon', name: '火炮塔', cost: 80, damage: 2.5, range: 2.0, fireRate: 260, color: '#FF6B6B', bulletColor: '#FF6B6B', bulletSpeed: 5, icon: '🔥', aoe: 45 },
    { id: 'ice', name: '冰冻塔', cost: 60, damage: 0.3, range: 2.3, fireRate: 200, color: '#70A1FF', bulletColor: '#70A1FF', bulletSpeed: 7, icon: '❄️', slow: 0.4, slowDur: 150 },
    { id: 'plasma', name: '等离子塔', cost: 100, damage: 1.8, range: 2.8, fireRate: 180, color: '#9C27B0', bulletColor: '#9C27B0', bulletSpeed: 8, icon: '💜', piercing: true },
  ]

  // === 状态 ===
  let gold = 150 // 降低初始金币，增加经济压力
  let lives = 40 // 大幅增加生命值，降低挫败感
  let wave = 0
  let waveTimer = 240 // 首波延迟（帧）- 增加初始准备时间到4秒
  let enemiesToSpawn = 0
  let spawnCounter = 0
  let score = 0
  let combo = 0
  let maxCombo = 0 // 记录最高连击
  let lastKillTime = 0
  let selectedTowerType = 0 // 当前选中的塔类型索引
  let animId = 0
  let frameCount = 0
  let screenShake = 0
  let floatingTexts: { x: number; y: number; text: string; color: string; life: number }[] = []
  let flashEffect = 0 // 闪光效果
  let slowMotion = 0 // 慢动作效果
  
  // 游戏会话管理
  let gameStartTime = Date.now() // 游戏开始时间
  let sessionId: number | null = null // 后端session ID
  let sessionToken: string | null = null // 后端session token
  
  // 无尽关卡统计
  let totalWavesCompleted = 0 // 总完成波次数
  let highestWave = 0 // 最高到达波次
  
  // 特殊技能系统
  let specialSkillCharge = 0 // 特殊技能充能
  const SPECIAL_SKILL_MAX_CHARGE = 80 // 降低充能需求，更容易释放技能
  let showSpecialSkillButton = false // 是否显示特殊技能按钮
  
  // ====== 道具系统（库存模式）======
  let inventory: string[] = [] // 道具库存
  
  // 道具图标映射 - 更强大的道具
  const powerupIcons: Record<string, string> = {
    'gold': '💰',        // 金币 - 立即获得150金币
    'freeze': '❄️',      // 冻结 - 停止所有敌人8秒
    'damage_boost': '⚔️', // 伤害提升 - 所有塔伤害×3，持续20秒
    'nuke': '☢️'         // 核弹 - 消灭屏幕上所有敌人
  }
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id
    }))
    
    app.setupCustomPowerupBar('towerDefense', powerups, inventory, (powerupId) => {
      if (usePowerup(powerupId)) {
        audioService.collect()
        updateHTMLPowerupBar()
      }
    })
  }
  
  // 使用道具
  function usePowerup(type: string): boolean {
    const index = inventory.indexOf(type)
    if (index === -1) return false
    
    inventory.splice(index, 1)
    console.log('[道具] 使用道具:', type)
    
    switch (type) {
      case 'gold':
        // 金币 - 立即获得150金币
        gold += 150
        floatingTexts.push({ x: W / 2, y: HUD_H + 30, text: '+150 💰', color: '#FFD700', life: 2 })
        audioService.win()
        console.log('[道具] 获得150金币，当前:', gold)
        break
        
      case 'freeze':
        // 冻结 - 停止所有敌人8秒
        enemies.forEach(e => {
          e.slowTimer = 480 // 8秒 = 480帧（假设60fps）
          e.speed = 0 // 完全停止
        })
        screenShake = 5
        flashEffect = 0.3
        floatingTexts.push({ x: W / 2, y: H / 2, text: '❄️ 冻结8秒!', color: '#00CED1', life: 2.5 })
        audioService.win()
        console.log('[道具] 冻结所有敌人8秒')
        break
        
      case 'damage_boost':
        // 伤害提升 - 所有塔伤害×3，持续20秒
        ;(window as any).tdDamageBoost = Date.now() + 20000
        floatingTexts.push({ x: W / 2, y: HUD_H + 30, text: '⚔️ 伤害×3!', color: '#FF6B6B', life: 2.5 })
        screenShake = 3
        audioService.win()
        console.log('[道具] 伤害提升生效，持续20秒')
        break
        
      case 'nuke':
        // 核弹 - 消灭屏幕上所有敌人
        let killCount = 0
        enemies.forEach(e => {
          addParticles(e.x, e.y, e.color || '#FF6B6B', 15)
          gold += e.reward || 10
          score += 20
          killCount++
        })
        enemies.length = 0
        screenShake = 8
        flashEffect = 0.5
        floatingTexts.push({ x: W / 2, y: H / 2, text: `☢️ 核弹! x${killCount}`, color: '#FF4500', life: 2.5 })
        engine.addScore(killCount * 20, W / 2, H / 2)
        audioService.win()
        console.log('[道具] 核弹消灭', killCount, '个敌人')
        break
    }
    
    return true
  }

  // 地图格子状态
  const grid = Array.from({ length: GRID }, () => Array(GRID).fill(0))
  // 标记路径格子
  PATH_POINTS.forEach(p => {
    const prev = PATH_POINTS[PATH_POINTS.indexOf(p) - 1]
    if (!prev) return
    const dx = Math.sign(p.gx - prev.gx)
    const dy = Math.sign(p.gy - prev.gy)
    let cx = prev.gx, cy = prev.gy
    for (let i = 0; i < Math.abs(p.gx - prev.gx) + Math.abs(p.gy - prev.gy); i++) {
      if (cx >= 0 && cx < GRID && cy >= 0 && cy < GRID) grid[cy][cx] = 1
      cx += dx; cy += dy
    }
    if (p.gx >= 0 && p.gx < GRID && p.gy >= 0 && p.gy < GRID) grid[p.gy][p.gx] = 1
  })
  
  // 标记敌人入口附近的禁止建造区域（起点周围2格）
  const entryPoint = PATH_POINTS[0]  // {gx: -1, gy: 1}
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const gx = entryPoint.gx + dx
      const gy = entryPoint.gy + dy
      if (gx >= 0 && gx < GRID && gy >= 0 && gy < GRID) {
        // 使用距离检查，只标记圆形区域
        if (dx * dx + dy * dy <= 5) {  // 半径约2.2格
          grid[gy][gx] = 1  // 标记为不可建造
        }
      }
    }
  }
  
  // 标记敌人出口附近的禁止建造区域（终点周围2格）
  const exitPoint = PATH_POINTS[PATH_POINTS.length - 1]
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const gx = exitPoint.gx + dx
      const gy = exitPoint.gy + dy
      if (gx >= 0 && gx < GRID && gy >= 0 && gy < GRID) {
        // 使用距离检查，只标记圆形区域
        if (dx * dx + dy * dy <= 5) {  // 半径约2.2格
          grid[gy][gx] = 1  // 标记为不可建造
        }
      }
    }
  }

  const towers: {
    gx: number; gy: number; x: number; y: number
    type: typeof TOWER_TYPES[0]; fireTimer: number; angle: number
    level: number;  // 塔等级 (1-3)
    totalInvestment: number;  // 总投入金币
  }[] = []
  const enemies: {
    x: number; y: number; hp: number; maxHp: number; speed: number
    pathIdx: number; pathProgress: number; slowTimer: number
    reward: number; color: string; size: number; isBoss: boolean
  }[] = []
  const bullets: {
    x: number; y: number; target: typeof enemies[0]; damage: number
    color: string; speed: number; aoe?: number; slow?: number; slowDur?: number; piercing?: boolean
  }[] = []
  const particles: { x: number; y: number; vx: number; vy: number; color: string; life: number; maxLife: number; size: number; type?: string }[] = []

  // === 音效 ===
  const sfx = {
    place: () => audioService.click(),
    shoot: () => audioService.pop(),
    kill: () => audioService.combo(),
    hit: () => audioService.pop(),
  }

  // === 工具函数 ===
  function gridToPixel(gx: number, gy: number) {
    return { x: gx * CELL + CELL / 2, y: gy * CELL + HUD_H + CELL / 2 }
  }
  function pixelToGrid(px: number, py: number) {
    return { gx: Math.floor(px / CELL), gy: Math.floor((py - HUD_H) / CELL) }
  }
  function dist(x1: number, y1: number, x2: number, y2: number) {
    return Math.hypot(x1 - x2, y1 - y2)
  }
  function addParticles(x: number, y: number, color: string, count: number, spread = 3, type = 'normal') {
    for (let i = 0; i < count; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * spread * 2,
        vy: (Math.random() - 0.5) * spread * 2,
        color,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        size: 2 + Math.random() * 3,
        type
      })
    }
  }
  function addFloat(x: number, y: number, text: string, color: string) {
    // 限制浮动文字在游戏区域内，留出足够的边距
    const margin = 30 // 增加边距，防止文字贴边
    const clampedX = Math.max(margin, Math.min(W - margin, x))
    const clampedY = Math.max(HUD_H + margin, Math.min(H - margin, y))
    floatingTexts.push({ x: clampedX, y: clampedY, text, color, life: 50 })
  }

  // === 波次系统 - 无尽模式 ===
  function getWaveConfig(w: number) {
    // 敌人数量：线性增长，有上限
    const enemyCount = Math.min(
      INFINITE_WAVE_CONFIG.baseEnemyCount + w * INFINITE_WAVE_CONFIG.enemyGrowthRate,
      INFINITE_WAVE_CONFIG.maxEnemyCount
    )
    
    // 血量：指数增长
    const hpMul = Math.pow(1 + INFINITE_WAVE_CONFIG.hpGrowthRate, w)
    
    // 速度：线性增长，有上限
    const spdMul = Math.min(
      1 + w * INFINITE_WAVE_CONFIG.speedGrowthRate,
      INFINITE_WAVE_CONFIG.maxSpeedMultiplier
    )
    
    return { 
      count: Math.floor(enemyCount), 
      hpMul, 
      spdMul 
    }
  }
  
  // 获取敌人类型（基于波次解锁）
  function getEnemyType(waveNum: number): 'normal' | 'fast' | 'tank' | 'elite' {
    if (waveNum >= INFINITE_WAVE_CONFIG.eliteEnemyUnlock && Math.random() < 0.15) {
      return 'elite' // 15%概率出现精英敌人
    }
    if (waveNum >= INFINITE_WAVE_CONFIG.specialEnemyUnlock && Math.random() < 0.2) {
      return Math.random() < 0.5 ? 'fast' : 'tank' // 快速或坦克型
    }
    return 'normal'
  }
  
  function spawnEnemy() {
    const cfg = getWaveConfig(wave)
    const isBoss = wave > 0 && wave % INFINITE_WAVE_CONFIG.bossInterval === 0 && enemiesToSpawn === 1
    const enemyType = isBoss ? 'normal' : getEnemyType(wave)
    
    // 根据敌人类型调整属性 - 简化的血量公式（只用指数增长）
    let hpBase = INFINITE_WAVE_CONFIG.baseHp  // 基础血量
    let speedBase = INFINITE_WAVE_CONFIG.baseSpeed + Math.random() * 0.15  // 使用配置的基础速度
    let rewardBase = 5 + wave * 0.6  // 再次降低金币奖励，从6+0.8降到5+0.6
    let size = 10
    let color = `hsl(${wave * 30 + Math.random() * 60}, 70%, 55%)`
    
    switch (enemyType) {
      case 'fast':
        speedBase *= 1.6
        hpBase *= 0.7
        rewardBase *= 1.3
        color = '#00E5FF'
        break
      case 'tank':
        speedBase *= 0.6
        hpBase *= 2.0
        rewardBase *= 1.5
        size = 13
        color = '#9C27B0'
        break
      case 'elite':
        speedBase *= 1.2
        hpBase *= 1.8
        rewardBase *= 2.5
        size = 12
        color = '#FFD700'
        break
    }
    
    if (isBoss) {
      hpBase = 35 * cfg.hpMul  // Boss血量从40降到35，更合理
      speedBase = INFINITE_WAVE_CONFIG.baseSpeed * 0.8 * cfg.spdMul  // Boss速度为基础速度的80%
      rewardBase = 25 + wave * 2  // 再次降低Boss奖励，从30+3降到25+2
      size = 16
      color = '#FF4757'
    } else {
      hpBase *= cfg.hpMul
      speedBase *= cfg.spdMul
    }
    
    enemies.push({
      x: pathPixels[0].x - 20,
      y: pathPixels[0].y,
      hp: hpBase, 
      maxHp: hpBase, 
      speed: speedBase,
      pathIdx: 0, 
      pathProgress: 0,
      slowTimer: 0,
      reward: Math.floor(rewardBase),
      color,
      size,
      isBoss,
    })
    enemiesToSpawn--
  }

  // === 渲染 ===
  function drawBackground() {
    // 深空渐变
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#0a0a1a')
    grad.addColorStop(0.5, '#0d1b2a')
    grad.addColorStop(1, '#1a1a2e')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // 网格线
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL, HUD_H)
      ctx.lineTo(i * CELL, HUD_H + GRID * CELL)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * CELL + HUD_H)
      ctx.lineTo(GRID * CELL, i * CELL + HUD_H)
      ctx.stroke()
    }

    // 路径
    ctx.fillStyle = PATH_COLOR
    PATH_POINTS.forEach((p, i) => {
      const prev = PATH_POINTS[i - 1]
      if (!prev) return
      const dx = Math.sign(p.gx - prev.gx)
      const dy = Math.sign(p.gy - prev.gy)
      let cx = prev.gx, cy = prev.gy
      for (let j = 0; j <= Math.abs(p.gx - prev.gx) + Math.abs(p.gy - prev.gy); j++) {
        if (cx >= 0 && cx < GRID && cy >= 0 && cy < GRID) {
          ctx.fillRect(cx * CELL + 1, cy * CELL + HUD_H + 1, CELL - 2, CELL - 2)
        }
        cx += dx; cy += dy
      }
    })

    // 路径方向箭头
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    for (let i = 1; i < pathPixels.length; i++) {
      const p = pathPixels[i - 1], c = pathPixels[i]
      const mx = (p.x + c.x) / 2, my = (p.y + c.y) / 2
      const angle = Math.atan2(c.y - p.y, c.x - p.x)
      ctx.save()
      ctx.translate(mx, my)
      ctx.rotate(angle)
      ctx.fillText('▸', 0, 4)
      ctx.restore()
    }

    // 入口/出口标记
    ctx.fillStyle = '#2ECC71'
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('入口 →', 25, pathPixels[0].y + 4)
    ctx.fillStyle = '#E74C3C'
    ctx.fillText('→ 终点', W - 25, pathPixels[pathPixels.length - 1].y + 4)
    
    // 绘制入口保护区域（橙色半透明圆形）
    const entryPoint = PATH_POINTS[0]
    const entryPixelX = Math.max(CELL / 2, entryPoint.gx * CELL + CELL / 2)  // 确保在屏幕内
    const entryPixelY = entryPoint.gy * CELL + HUD_H + CELL / 2
    const entryProtectionRadius = Math.sqrt(5) * CELL  // 约2.2格半径
    
    // 入口保护区域背景
    ctx.fillStyle = 'rgba(255, 165, 2, 0.15)'  // 橙色半透明
    ctx.beginPath()
    ctx.arc(entryPixelX, entryPixelY, entryProtectionRadius, 0, Math.PI * 2)
    ctx.fill()
    
    // 入口保护区域边框
    ctx.strokeStyle = 'rgba(255, 165, 2, 0.6)'  // 橙色边框
    ctx.lineWidth = 2
    ctx.setLineDash([8, 4])
    ctx.beginPath()
    ctx.arc(entryPixelX, entryPixelY, entryProtectionRadius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
    
    // 入口保护区域文字提示
    ctx.fillStyle = '#FFA502'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🚫 禁止建造', entryPixelX, entryPixelY - entryProtectionRadius - 8)
    
    // 绘制出口保护区域（红色半透明圆形）
    const exitPoint = PATH_POINTS[PATH_POINTS.length - 1]
    const exitPixelX = exitPoint.gx * CELL + CELL / 2
    const exitPixelY = exitPoint.gy * CELL + HUD_H + CELL / 2
    const exitProtectionRadius = Math.sqrt(5) * CELL  // 约2.2格半径
    
    // 出口保护区域背景
    ctx.fillStyle = 'rgba(231, 76, 60, 0.15)'  // 红色半透明
    ctx.beginPath()
    ctx.arc(exitPixelX, exitPixelY, exitProtectionRadius, 0, Math.PI * 2)
    ctx.fill()
    
    // 出口保护区域边框
    ctx.strokeStyle = 'rgba(231, 76, 60, 0.6)'  // 红色边框
    ctx.lineWidth = 2
    ctx.setLineDash([8, 4])
    ctx.beginPath()
    ctx.arc(exitPixelX, exitPixelY, exitProtectionRadius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
    
    // 出口保护区域文字提示
    ctx.fillStyle = '#E74C3C'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🚫 禁止建造', exitPixelX, exitPixelY - exitProtectionRadius - 8)
    
    // 闪光效果
    if (flashEffect > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashEffect * 0.1})`
      ctx.fillRect(0, 0, W, H)
    }
  }

  function drawTowers() {
    towers.forEach(t => {
      const { x, y, type, angle } = t
      // 底座
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.fillRect(t.gx * CELL + 2, t.gy * CELL + HUD_H + 2, CELL - 4, CELL - 4)

      // 范围指示（选中时）
      if (TOWER_TYPES.indexOf(type) === selectedTowerType) {
        ctx.strokeStyle = type.color + '40'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 3])
        ctx.beginPath()
        ctx.arc(x, y, type.range * CELL, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
      }

      // 塔身
      ctx.save()
      ctx.translate(x, y)

      // 发光底圈 - 根据等级增强
      const glowSize = 22 + t.level * 3  // 等级越高光环越大
      const glowIntensity = Math.min(1.0, 0.4 + t.level * 0.15)  // 等级越高越亮，最大1.0
      const alphaHex = Math.floor(glowIntensity * 255).toString(16).padStart(2, '0')
      const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, glowSize)
      glow.addColorStop(0, type.color + alphaHex)
      glow.addColorStop(1, type.color + '00')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(0, 0, glowSize, 0, Math.PI * 2)
      ctx.fill()
      
      // 高等级额外光环
      if (t.level >= 2) {
        const outerGlow = ctx.createRadialGradient(0, 0, glowSize - 5, 0, 0, glowSize + 8)
        outerGlow.addColorStop(0, '#FFD700' + (t.level === 3 ? '40' : '20'))
        outerGlow.addColorStop(1, '#FFD700' + '00')
        ctx.fillStyle = outerGlow
        ctx.beginPath()
        ctx.arc(0, 0, glowSize + 8, 0, Math.PI * 2)
        ctx.fill()
      }

      // 炮塔基座 - 等级越高越大
      const baseSize = 14 + t.level * 2
      ctx.fillStyle = '#2d3436'
      ctx.beginPath()
      ctx.arc(0, 0, baseSize, 0, Math.PI * 2)
      ctx.fill()
      
      // 基座装饰 - 等级越高越华丽
      ctx.strokeStyle = type.color
      ctx.lineWidth = 2 + t.level * 0.5
      ctx.beginPath()
      ctx.arc(0, 0, baseSize, 0, Math.PI * 2)
      ctx.stroke()
      
      // Lv.2+ 添加内圈装饰
      if (t.level >= 2) {
        ctx.strokeStyle = '#FFD700'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(0, 0, baseSize - 5, 0, Math.PI * 2)
        ctx.stroke()
      }
      
      // Lv.3+ 添加中圈
      if (t.level >= 3) {
        ctx.strokeStyle = '#00E5FF'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(0, 0, baseSize - 9, 0, Math.PI * 2)
        ctx.stroke()
      }
      
      // Lv.4+ 添加外环光效
      if (t.level >= 4) {
        ctx.strokeStyle = '#9C27B0'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 2])
        ctx.beginPath()
        ctx.arc(0, 0, baseSize + 3, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
      }
      
      // Lv.5 添加最内圈和中心宝石
      if (t.level >= 5) {
        ctx.fillStyle = '#FFD700'
        ctx.beginPath()
        ctx.arc(0, 0, 5, 0, Math.PI * 2)
        ctx.fill()
        
        // 中心宝石发光
        ctx.shadowColor = '#FFD700'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(0, 0, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // 炮管 - 等级越高越长越粗
      ctx.rotate(angle)
      const barrelLength = 18 + t.level * 3
      const barrelWidth = 6 + t.level
      ctx.fillStyle = type.color
      ctx.fillRect(0, -barrelWidth/2, barrelLength, barrelWidth)
      
      // 炮口发光
      ctx.fillStyle = '#fff'
      ctx.shadowColor = type.color
      ctx.shadowBlur = 5 + t.level * 3
      ctx.fillRect(barrelLength - 2, -barrelWidth/2 - 2, 6, barrelWidth + 4)
      ctx.shadowBlur = 0

      ctx.restore()

      // 塔图标
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = type.color
      ctx.fillText(type.icon, x, y - 20)
      
      // 显示等级 - 无限等级系统
      if (t.level > 1) {
        ctx.font = 'bold 11px sans-serif'
        ctx.fillStyle = '#FFD700'
        ctx.fillText(`Lv.${t.level}`, x, y + 22)
        
        // 高等级特殊标记
        if (t.level >= 10) {
          ctx.font = 'bold 9px sans-serif'
          ctx.fillStyle = '#FF6B6B'
          ctx.fillText('🔥', x, y + 34)
        } else if (t.level >= 5) {
          const stars = '★'.repeat(Math.min(t.level - 1, 8))
          ctx.font = '9px sans-serif'
          ctx.fillStyle = '#FFA502'
          ctx.fillText(stars, x, y + 34)
        }
      }
      
      // 可升级提示 - 无限等级，始终显示
      const upgradeCost = Math.floor(type.cost * (0.4 + t.level * 0.4))
      ctx.font = 'bold 9px sans-serif'
      ctx.fillStyle = gold >= upgradeCost ? '#00E5FF' : '#666'
      ctx.fillText(`点击升级 ${upgradeCost}💰`, x, y + 46)
    })
  }

  function drawEnemies() {
    enemies.forEach(e => {
      const { x, y, hp, maxHp, color, size, isBoss, slowTimer } = e

      // 减速冰霜效果
      if (slowTimer > 0) {
        ctx.fillStyle = 'rgba(112, 161, 255, 0.15)'
        ctx.beginPath()
        ctx.arc(x, y, size + 6, 0, Math.PI * 2)
        ctx.fill()
      }

      // 敌人身体
      ctx.shadowColor = color
      ctx.shadowBlur = isBoss ? 12 : 6
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // 内部高光
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.beginPath()
      ctx.arc(x - size * 0.25, y - size * 0.25, size * 0.4, 0, Math.PI * 2)
      ctx.fill()

      // Boss 标记
      if (isBoss) {
        ctx.strokeStyle = '#FFD700'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(x, y, size + 3, 0, Math.PI * 2)
        ctx.stroke()
        ctx.font = 'bold 10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillStyle = '#FFD700'
        ctx.fillText('BOSS', x, y - size - 6)
      }

      // 血条
      if (hp < maxHp) {
        const bw = size * 2.5
        const bx = x - bw / 2, by = y - size - 6
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(bx - 1, by - 1, bw + 2, 5)
        ctx.fillStyle = '#E74C3C'
        ctx.fillRect(bx, by, bw, 3)
        ctx.fillStyle = '#2ECC71'
        ctx.fillRect(bx, by, bw * (hp / maxHp), 3)
      }
    })
  }

  function drawBullets() {
    bullets.forEach(b => {
      // 绘制追踪线（从子弹到目标）
      if (enemies.includes(b.target)) {
        ctx.strokeStyle = b.color + '40'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 3])
        ctx.beginPath()
        ctx.moveTo(b.x, b.y)
        ctx.lineTo(b.target.x, b.target.y)
        ctx.stroke()
        ctx.setLineDash([])
      }
      
      ctx.shadowColor = b.color
      ctx.shadowBlur = 10
      ctx.fillStyle = b.color
      ctx.beginPath()
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // 拖尾效果
      ctx.fillStyle = b.color + '66'
      ctx.beginPath()
      ctx.arc(b.x, b.y, 7, 0, Math.PI * 2)
      ctx.fill()
      
      // 内部核心
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(b.x, b.y, 2, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  function drawParticles() {
    particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife)
      
      if (p.type === 'explosion') {
        // 爆炸粒子更大更亮
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife) * 1.5, 0, Math.PI * 2)
        ctx.fill()
        
        // 内部高光
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife) * 0.5, 0, Math.PI * 2)
        ctx.fill()
      } else if (p.type === 'spark') {
        // 火花粒子更小更快
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife) * 0.8, 0, Math.PI * 2)
        ctx.fill()
      } else {
        // 普通粒子
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2)
        ctx.fill()
      }
    })
    ctx.globalAlpha = 1
  }

  function drawFloats() {
    floatingTexts.forEach(f => {
      // 只在完全可见区域内绘制
      if (f.x >= 10 && f.x <= W - 10 && f.y >= HUD_H + 10 && f.y <= H - 10) {
        ctx.globalAlpha = Math.max(0, f.life / 50)
        ctx.font = 'bold 13px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillStyle = f.color
        ctx.fillText(f.text, f.x, f.y)
      }
    })
    ctx.globalAlpha = 1
  }

  function drawHUD() {
    // HUD 背景
    ctx.fillStyle = 'rgba(10,10,26,0.92)'
    ctx.fillRect(0, 0, W, HUD_H)
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, HUD_H)
    ctx.lineTo(W, HUD_H)
    ctx.stroke()

    // 金币
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#FFD700'
    ctx.fillText(`💰 ${gold}`, 10, 20)

    // 生命
    ctx.fillStyle = lives > 5 ? '#2ECC71' : '#E74C3C'
    ctx.fillText(`❤️ ${lives}`, 10, 40)

    // 波次和最高记录
    ctx.fillStyle = '#ddd'
    ctx.textAlign = 'center'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText(`第 ${wave + 1} 波`, W / 2, 20)
    
    // 显示最高波次记录
    if (highestWave > 0) {
      ctx.font = '10px sans-serif'
      ctx.fillStyle = '#FFD700'
      ctx.fillText(`最高: ${highestWave + 1}`, W / 2, 35)
    }

    // 击杀连击 - 更醒目的显示
    if (combo >= 2) {
      const comboColor = combo >= 15 ? '#FF4757' : combo >= 10 ? '#FF6B6B' : combo >= 5 ? '#FFA502' : '#FFD700'
      ctx.fillStyle = comboColor
      ctx.font = `bold ${Math.min(16 + combo, 28)}px sans-serif`
      ctx.fillText(`${combo} 连击!`, W / 2, 40)
      
      // 连击进度条
      const barWidth = 120
      const barHeight = 5
      const barX = W/2 - barWidth/2
      const barY = 48
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.fillRect(barX, barY, barWidth, barHeight)
      ctx.fillStyle = comboColor
      ctx.fillRect(barX, barY, barWidth * Math.min(combo/20, 1), barHeight)
      
      // 显示最高连击记录
      if (maxCombo > 0) {
        ctx.font = '10px sans-serif'
        ctx.fillStyle = '#AAA'
        ctx.fillText(`最高: ${maxCombo}`, W/2, 62)
      }
    }

    // 特殊技能按钮
    if (showSpecialSkillButton || specialSkillCharge > 0) {
      const skillBtnX = W - 60
      const skillBtnY = HUD_H - 50
      const skillBtnSize = 40
      
      // 技能按钮背景
      ctx.fillStyle = specialSkillCharge >= SPECIAL_SKILL_MAX_CHARGE ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'
      ctx.strokeStyle = specialSkillCharge >= SPECIAL_SKILL_MAX_CHARGE ? '#FFD700' : 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(skillBtnX, skillBtnY, skillBtnSize/2, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      
      // 技能图标
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = specialSkillCharge >= SPECIAL_SKILL_MAX_CHARGE ? '#FFD700' : '#AAA'
      ctx.fillText('💥', skillBtnX, skillBtnY + 7)
      
      // 充能指示
      ctx.font = '10px sans-serif'
      ctx.fillStyle = specialSkillCharge >= SPECIAL_SKILL_MAX_CHARGE ? '#FFF' : '#888'
      ctx.fillText(specialSkillCharge >= SPECIAL_SKILL_MAX_CHARGE ? '点击释放' : `${Math.floor(specialSkillCharge/SPECIAL_SKILL_MAX_CHARGE*100)}%`, skillBtnX, skillBtnY + 25)
      
      // 充能条
      const barWidth = 30
      const barHeight = 3
      const barX = skillBtnX - barWidth/2
      const barY = skillBtnY + 30
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.fillRect(barX, barY, barWidth, barHeight)
      ctx.fillStyle = specialSkillCharge >= SPECIAL_SKILL_MAX_CHARGE ? '#FFD700' : '#00E5FF'
      ctx.fillRect(barX, barY, barWidth * (specialSkillCharge/SPECIAL_SKILL_MAX_CHARGE), barHeight)
    }

    // 塔选择栏
    const startX = W - TOWER_TYPES.length * 55 - 10
    TOWER_TYPES.forEach((t, i) => {
      const bx = startX + i * 55
      const selected = i === selectedTowerType
      const affordable = gold >= t.cost

      // 按钮背景
      ctx.fillStyle = selected ? t.color + '33' : 'rgba(255,255,255,0.06)'
      ctx.strokeStyle = selected ? t.color : 'rgba(255,255,255,0.15)'
      ctx.lineWidth = selected ? 2 : 1
      ctx.beginPath()
      ctx.moveTo(bx + 6, 6)
      ctx.lineTo(bx + 42, 6)
      ctx.lineTo(bx + 42, 48)
      ctx.lineTo(bx + 6, 48)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // 塔图标
      ctx.font = '18px sans-serif'
      ctx.textAlign = 'center'
      ctx.globalAlpha = affordable ? 1 : 0.4
      ctx.fillText(t.icon, bx + 24, 28)

      // 名称+费用
      ctx.font = '9px sans-serif'
      ctx.fillStyle = affordable ? '#ccc' : '#666'
      ctx.fillText(t.name, bx + 24, 42)
      ctx.fillStyle = affordable ? '#FFD700' : '#666'
      ctx.fillText(`${t.cost}`, bx + 24, 52)
      ctx.globalAlpha = 1
    })
  }

  // === 更新逻辑 ===
  function update() {
    frameCount++
    
    // 慢动作效果处理
    if (slowMotion > 0) {
      slowMotion--
      if (slowMotion <= 0) {
        // 恢复正常速度
      }
    }
    
    // 闪光效果衰减
    if (flashEffect > 0) {
      flashEffect *= 0.9
      if (flashEffect < 0.1) flashEffect = 0
    }

    // 波次管理
    if (enemiesToSpawn > 0) {
      spawnCounter--
      if (spawnCounter <= 0) {
        spawnEnemy()
        spawnCounter = Math.max(25, 45 - Math.min(wave * 0.5, 15)) // 减缓生成速度，最低25帧间隔
      }
    } else if (enemies.length === 0) {
      waveTimer--
      if (waveTimer <= 0) {
        wave++
        totalWavesCompleted++
        if (wave > highestWave) highestWave = wave
        
        const cfg = getWaveConfig(wave)
        enemiesToSpawn = cfg.count
        spawnCounter = 0
        waveTimer = Math.max(180, WAVE_INTERVAL_BASE - wave * 2) // 随波次缩短间隔，但保持较慢节奏
        
        addFloat(W / 2, H / 2, `第 ${wave + 1} 波!`, '#FFD700')
        
        // 里程碑提示
        if (wave === INFINITE_WAVE_CONFIG.specialEnemyUnlock) {
          setTimeout(() => addFloat(W / 2, H / 2 - 40, '⚡ 快速/坦克敌人出现!', '#00E5FF'), 500)
        }
        if (wave === INFINITE_WAVE_CONFIG.eliteEnemyUnlock) {
          setTimeout(() => addFloat(W / 2, H / 2 - 40, '👑 精英敌人出现!', '#FFD700'), 500)
        }
        
        sfx.place()
      }
    }

    // 移动敌人
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i]
      if (e.pathIdx >= pathPixels.length - 1) {
        // 到达终点
        lives--
        enemies.splice(i, 1)
        screenShake = 6 // 降低震动强度
        flashEffect = 4 // 降低闪光强度
        addFloat(pathPixels[pathPixels.length - 1].x, pathPixels[pathPixels.length - 1].y, '-1 ❤️', '#E74C3C')
        if (lives <= 0) {
          endGame()
          return
        }
        continue
      }

      const target = pathPixels[e.pathIdx + 1]
      const speed = e.slowTimer > 0 ? e.speed * 0.4 : e.speed
      if (e.slowTimer > 0) e.slowTimer--

      const dx = target.x - e.x
      const dy = target.y - e.y
      const d = Math.hypot(dx, dy)
      if (d < speed) {
        e.x = target.x
        e.y = target.y
        e.pathIdx++
      } else {
        e.x += (dx / d) * speed
        e.y += (dy / d) * speed
      }
    }

    // 塔攻击
    towers.forEach(t => {
      t.fireTimer--
      if (t.fireTimer > 0) return

      // 寻找范围内敌人（优先最靠前的）
      let bestEnemy: typeof enemies[0] | null = null
      let bestProgress = -1
      const range = t.type.range * CELL

      for (const e of enemies) {
        if (dist(t.x, t.y, e.x, e.y) <= range) {
          const progress = e.pathIdx * 1000 - dist(e.x, e.y, pathPixels[e.pathIdx].x, pathPixels[e.pathIdx].y)
          if (progress > bestProgress) {
            bestProgress = progress
            bestEnemy = e
          }
        }
      }

      if (bestEnemy) {
        t.angle = Math.atan2(bestEnemy!.y - t.y, bestEnemy!.x - t.x)
        bullets.push({
          x: t.x + Math.cos(t.angle) * 16,
          y: t.y + Math.sin(t.angle) * 16,
          target: bestEnemy!,
          damage: t.type.damage,
          color: t.type.bulletColor,
          speed: t.type.bulletSpeed,
          aoe: t.type.aoe,
          slow: t.type.slow,
          slowDur: t.type.slowDur,
          piercing: t.type.piercing,
        })
        t.fireTimer = t.type.fireRate
        sfx.shoot()
        
        // 射击特效 - 更华丽的效果
        addParticles(
          t.x + Math.cos(t.angle) * 16,
          t.y + Math.sin(t.angle) * 16,
          t.type.bulletColor,
          5,
          2,
          'spark'
        )
      }
    })

    // 移动子弹 - 直接追踪目标
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i]
      // 目标已死亡
      if (!enemies.includes(b.target)) {
        bullets.splice(i, 1)
        continue
      }
      
      // 每帧重新计算到目标的向量（实时追踪）
      const dx = b.target.x - b.x
      const dy = b.target.y - b.y
      const distance = Math.hypot(dx, dy)
      
      // 检测碰撞
      if (distance < b.speed + b.target.size) {
        hitEnemy(b.target, b)
        bullets.splice(i, 1)
      } else {
        // 归一化方向并移动到目标位置
        const moveX = (dx / distance) * b.speed
        const moveY = (dy / distance) * b.speed
        
        b.x += moveX
        b.y += moveY
      }
    }
    
    // 调试：打印第一个子弹的位置信息
    if (bullets.length > 0 && frameCount % 60 === 0) {
      const firstBullet = bullets[0]
      console.log('[子弹追踪] 子弹位置:', firstBullet.x.toFixed(1), firstBullet.y.toFixed(1), 
                '目标位置:', firstBullet.target.x.toFixed(1), firstBullet.target.y.toFixed(1),
                '距离:', Math.hypot(firstBullet.target.x - firstBullet.x, firstBullet.target.y - firstBullet.y).toFixed(1))
    }

    // 粒子更新
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.96
      p.vy *= 0.96
      p.life--
      // 移除超出边界的粒子或生命周期结束的粒子
      if (p.life <= 0 || p.x < -50 || p.x > W + 50 || p.y < HUD_H - 50 || p.y > H + 50) {
        particles.splice(i, 1)
      }
    }

    // 浮动文字更新
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      floatingTexts[i].y -= 0.8
      floatingTexts[i].life--
      // 移除生命周期结束或超出边界的浮动文字
      if (floatingTexts[i].life <= 0 || 
          floatingTexts[i].y < HUD_H || 
          floatingTexts[i].y > H || 
          floatingTexts[i].x < 0 || 
          floatingTexts[i].x > W) {
        floatingTexts.splice(i, 1)
      }
    }

    // 屏幕震动衰减
    if (screenShake > 0) screenShake *= 0.85
    if (screenShake < 0.3) screenShake = 0
  }

  function hitEnemy(enemy: typeof enemies[0], bullet: typeof bullets[0]) {
    // AOE 范围伤害
    if (bullet.aoe !== undefined && bullet.aoe > 0) {
      enemies.forEach(e => {
        if (dist(bullet.x, bullet.y, e.x, e.y) < bullet.aoe!) {
          damageEnemy(e, bullet.damage * 0.6)
        }
      })
      addParticles(bullet.x, bullet.y, bullet.color, 12, 4)
    } else {
      damageEnemy(enemy, bullet.damage)
    }

    // 减速效果
    if (bullet.slow && bullet.slowDur) {
      enemy.slowTimer = bullet.slowDur
    }
    sfx.hit()
  }

  function damageEnemy(enemy: typeof enemies[0], damage: number) {
    enemy.hp -= damage
    addParticles(enemy.x, enemy.y, enemy.color, 4, 2)
    if (enemy.hp <= 0) {
      killEnemy(enemy)
    } else {
      // 受伤闪光效果
      addFloat(enemy.x, enemy.y - 15, `-${damage.toFixed(1)}`, '#FF6B6B')
      
      // 小幅度震动（降低频率）
      if (Math.random() < 0.3) { // 30%概率触发震动
        screenShake = Math.max(screenShake, 1.5)
      }
    }
  }

  function killEnemy(enemy: typeof enemies[0]) {
    const idx = enemies.indexOf(enemy)
    if (idx < 0) return
    enemies.splice(idx, 1)

    gold += enemy.reward
    
    // 为特殊技能充能（提高充能速度）
    specialSkillCharge = Math.min(specialSkillCharge + (enemy.isBoss ? 20 : 5), SPECIAL_SKILL_MAX_CHARGE)
    if (specialSkillCharge >= SPECIAL_SKILL_MAX_CHARGE) {
      showSpecialSkillButton = true
    }
    
    // 更华丽的爆炸效果 - 大幅增加粒子数量
    const particleCount = enemy.isBoss ? 50 : 25
    addParticles(enemy.x, enemy.y, enemy.color, particleCount, enemy.isBoss ? 8 : 5, 'explosion')
    addParticles(enemy.x, enemy.y, '#FFFFFF', enemy.isBoss ? 25 : 12, enemy.isBoss ? 6 : 4, 'spark')
    
    // Boss额外特效
    if (enemy.isBoss) {
      addParticles(enemy.x, enemy.y, '#FFD700', 30, 7, 'explosion')
    }
    
    // 金币获取提示 - 更大更醒目
    addFloat(enemy.x, enemy.y - 10, `+${enemy.reward} 💰`, '#FFD700')
    
    // 连击系统增强 - 更激进的连击奖励
    const now = Date.now()
    if (now - lastKillTime < 3000) { // 延长连击时间窗口到3秒
      combo++
      if (combo > maxCombo) maxCombo = combo
      
      if (combo >= 2) {
        // 通过游戏引擎增加分数来间接增加连击
        engine.addScore(combo * 10, W/2, H/2) // 提高连击分数
        
        // 连击奖励 - 更频繁的奖励
        if (combo % 2 === 0) { // 每2连击就给予奖励
          addFloat(W/2, H/2, `${combo} 连击!`, combo >= 10 ? '#FF4757' : combo >= 5 ? '#FFA502' : '#FFD700')
          screenShake = Math.min(combo * 1.2, 15) // 增强震动
          flashEffect = Math.min(combo * 0.08, 0.6) // 增强闪光
          
          // 连击达到一定数量时给予额外奖励
          if (combo >= 5 && combo % 5 === 0) {
            gold += 20 // 提高奖励金额
            addFloat(W/2, H/2-40, `+20 💰 连击奖励!`, '#FFD700')
            audioService.win()
          }
          
          // 超高连击特殊效果
          if (combo >= 15) {
            slowMotion = 15 // 慢动作效果
            flashEffect = 0.8
            addFloat(W/2, H/2-60, '🔥 超神连击! 🔥', '#FF4757')
          }
        }
      }
      if (combo >= 8 && combo % 8 === 0) {
        engine.triggerRandomBuff()
        addFloat(W/2, H/2-30, '✨ 获得增益!', '#00E5FF')
        screenShake = 12
        flashEffect = 0.5
        audioService.win()
      }
    } else {
      combo = 1
    }
    lastKillTime = now

    // 积分 - 提高基础积分
    const pts = enemy.isBoss ? 200 : 35
    engine.addScore(pts, enemy.x, enemy.y)
    sfx.kill()

    if (enemy.isBoss) {
      screenShake = 18 // 增强Boss死亡震动
      flashEffect = 0.8 // 增强Boss死亡闪光
      slowMotion = 20 // 延长慢动作时间
      
      // Boss死亡特效 - 更华丽
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          addParticles(
            enemy.x + (Math.random() - 0.5) * 40,
            enemy.y + (Math.random() - 0.5) * 40,
            ['#FFD700', '#FF6B6B', '#00E5FF', '#9C27B0'][Math.floor(Math.random() * 4)],
            15,
            6,
            'explosion'
          )
        }, i * 100) // 缩短特效间隔，更密集
      }
      
      // Boss击杀提示
      addFloat(W/2, H/2-80, '👑 BOSS击败! 👑', '#FFD700')
      audioService.win()
    }
  }

  // === 游戏结束 ===
  async function endGame() {
    cancelAnimationFrame(animId)
    
    // 计算游戏时长（秒）
    const duration = Math.floor((Date.now() - gameStartTime) / 1000)
    
    // 如果用户已登录且有有效的session，提交分数到后端
    if (userService.isLoggedIn && userService.current && sessionId && sessionToken) {
      try {
        console.log('[塔防] 准备提交分数:', {
          sessionId,
          score,
          wave: wave + 1,
          duration,
          lives,
        })
        
        // 提交游戏结果
        const result = await apiSubmitGameResult({
          sessionId: sessionId,
          sessionToken: sessionToken,
          score: score,
          duration: duration,
          lives: lives,
          level: wave + 1,  // 使用波次作为关卡
          isWin: false,  // 塔防是无尽模式，失败才结束
          details: {
            wave: wave + 1,
            maxCombo: maxCombo,
            totalWavesCompleted: totalWavesCompleted,
            highestWave: highestWave,
          }
        })
        
        if (result.ok) {
          console.log('[塔防] 分数提交成功')
        } else {
          console.warn('[塔防] 分数提交失败:', result.msg)
        }
      } catch (error) {
        console.error('[塔防] 提交分数异常:', error)
      }
    } else {
      console.log('[塔防] 未登录或无session，跳过分数提交')
    }
    
    onEnd()
  }

  // === 主循环 ===
  function loop() {
    animId = requestAnimationFrame(loop)
    update()

    ctx.save()
    if (screenShake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * screenShake,
        (Math.random() - 0.5) * screenShake
      )
    }

    drawBackground()
    drawTowers()
    drawEnemies()
    drawBullets()
    drawParticles()
    drawFloats()
    drawHUD()

    // 波次倒计时提示
    if (enemiesToSpawn === 0 && enemies.length === 0 && waveTimer > 0) {
      const sec = Math.ceil(waveTimer / 60)
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`下一波: ${sec}s`, W / 2, H - 20)
    }
    
    // 游戏说明（前8秒显示）
    if (frameCount < 480) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.fillRect(10, H - 100, W - 20, 90)
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 1
      ctx.strokeRect(10, H - 100, W - 20, 90)
      
      ctx.fillStyle = '#FFF'
      ctx.font = 'bold 13px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('🎮 解压塔防:', 20, H - 85)
      ctx.font = '11px sans-serif'
      ctx.fillText('• 点击选择塔类型，再点击地图放置', 20, H - 70)
      ctx.fillText('• 点击已建造的塔可以升级 (最高Lv.5)', 20, H - 57)
      ctx.fillText('• 连续击杀获得连击奖励和特效', 20, H - 44)
      ctx.fillText('• 充能满后点击💥释放全屏爆炸', 20, H - 31)
      ctx.fillText('• 道具助你轻松通关，尽情享受!', 20, H - 18)
    }

    ctx.restore()
  }
  
  // 初始化 HTML 道具栏
  updateHTMLPowerupBar()

  // === 输入处理 ===
  function handleClick(px: number, py: number) {
    // HUD 区域 - 选择塔类型
    if (py < HUD_H) {
      const startX = W - TOWER_TYPES.length * 55 - 10
      TOWER_TYPES.forEach((t, i) => {
        const bx = startX + i * 55
        if (px >= bx && px <= bx + 48 && py >= 6 && py <= 54) {
          selectedTowerType = i
        }
      })
      
      // 检查是否点击了特殊技能按钮
      if (showSpecialSkillButton) {
        const skillBtnX = W - 60
        const skillBtnY = HUD_H - 50
        const skillBtnSize = 40
        const distToSkill = Math.hypot(px - skillBtnX, py - skillBtnY)
        if (distToSkill < skillBtnSize/2) {
          activateSpecialSkill()
          return
        }
      }
      
      return
    }

    // 游戏区域 - 放置或升级塔
    const { gx, gy } = pixelToGrid(px, py)
    if (gx < 0 || gx >= GRID || gy < 0 || gy >= GRID) return
    
    // 检查是否点击了已有的塔 - 升级逻辑
    const existingTower = towers.find(t => t.gx === gx && t.gy === gy)
    if (existingTower) {
      upgradeTower(existingTower)
      return
    }
    
    // 检查是否是路径格子
    if (grid[gy][gx] !== 0) {
      addFloat(px, py, '不能在此建造!', '#E74C3C')
      return
    }

    const typeTemplate = TOWER_TYPES[selectedTowerType]
    if (gold < typeTemplate.cost) {
      addFloat(px, py, '金币不足!', '#E74C3C')
      return
    }

    gold -= typeTemplate.cost
    const pos = gridToPixel(gx, gy)
    
    // 为每个塔创建独立的类型对象副本，避免共享引用
    const towerType = {
      ...typeTemplate,
      damage: typeTemplate.damage,
      range: typeTemplate.range,
      fireRate: typeTemplate.fireRate,
    }
    
    towers.push({
      gx, gy, x: pos.x, y: pos.y,
      type: towerType, fireTimer: 0, angle: 0,
      level: 1,
      totalInvestment: typeTemplate.cost,
    })
    grid[gy][gx] = 2 // 标记为塔
    addParticles(pos.x, pos.y, towerType.color, 8, 2)
    sfx.place()
  }
  
  // 升级塔 - 无限等级系统（纯视觉特效）
  function upgradeTower(tower: typeof towers[0]) {
    // 计算升级费用 - 随等级线性增长
    const upgradeCost = Math.floor(tower.type.cost * (0.4 + tower.level * 0.4))
    if (gold < upgradeCost) {
      // 金币不足特效 - 红色闪烁
      addParticles(tower.x, tower.y, '#E74C3C', 12, 3, 'spark')
      screenShake = 2
      flashEffect = 0.2
      return
    }
    
    gold -= upgradeCost
    const oldLevel = tower.level
    tower.level++
    tower.totalInvestment += upgradeCost
      
    // 提升属性 - 每次升级都增强
    tower.type.damage *= 1.15  // 伤害+15%（适中增长）
    tower.type.range *= 1.05   // 范围+5%（小幅增长）
    tower.type.fireRate = Math.max(5, tower.type.fireRate * 0.92)  // 射速+8%（持续加快）
    
    // === 超华丽升级特效（无文字）===
    
    // 1. 多层粒子爆炸 - 彩虹色爆发
    const particleColors = ['#FFD700', '#FF6B6B', '#00E5FF', '#9C27B0', '#FFFFFF']
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        addParticles(
          tower.x + (Math.random() - 0.5) * 10,
          tower.y + (Math.random() - 0.5) * 10,
          particleColors[i],
          20 + tower.level * 2,  // 等级越高粒子越多
          4 + Math.min(tower.level * 0.3, 8),  // 扩散范围有上限
          'explosion'
        )
      }, i * 50)
    }
    
    // 2. 环形冲击波效果 - 扩散光环
    const ringCount = Math.min(3 + Math.floor(tower.level / 10), 6)  // 每10级增加1环，最多6环
    for (let ring = 0; ring < ringCount; ring++) {
      setTimeout(() => {
        addParticles(tower.x, tower.y, tower.type.color, 15 + tower.level, 6 + ring * 3, 'spark')
      }, ring * 80)
    }
    
    // 3. 金色火花雨 - 从上方洒落
    const sparkCount = 30 + tower.level * 2
    addParticles(tower.x, tower.y - 20, '#FFD700', sparkCount, 5 + tower.level * 0.2, 'spark')
    
    // 4. 强烈的屏幕震动 - 随等级增强但有上限
    screenShake = Math.min(6 + tower.level * 0.5, 25)  // 最高25
    
    // 5. 闪光效果 - 随等级增强但有上限
    flashEffect = Math.min(0.3 + tower.level * 0.02, 0.8)  // 最高0.8
    
    // 6. 慢动作瞬间 - 高等级更长
    slowMotion = Math.min(6 + tower.level * 0.3, 20)  // 最高20帧
    
    // 7. 里程碑等级庆祝特效（无文字，纯视觉）
    if (tower.level === 5) {
      // Lv.5 - 蓝色能量爆发
      setTimeout(() => {
        addParticles(tower.x, tower.y, '#00E5FF', 40, 7, 'explosion')
        addParticles(tower.x, tower.y, '#FFFFFF', 20, 6, 'spark')
        screenShake = 12
        flashEffect = 0.5
        slowMotion = 12
        audioService.win()
      }, 400)
    } else if (tower.level === 10) {
      // Lv.10 - 紫色精英特效
      setTimeout(() => {
        addParticles(tower.x, tower.y, '#9C27B0', 50, 8, 'explosion')
        addParticles(tower.x, tower.y, '#FFD700', 30, 6, 'spark')
        addParticles(tower.x, tower.y, '#00E5FF', 25, 7, 'explosion')
        screenShake = 15
        flashEffect = 0.6
        slowMotion = 15
        audioService.win()
      }, 400)
    } else if (tower.level === 20) {
      // Lv.20 - 橙色超级特效
      setTimeout(() => {
        addParticles(tower.x, tower.y, '#FFA502', 60, 9, 'explosion')
        addParticles(tower.x, tower.y, '#FF6B6B', 40, 7, 'spark')
        addParticles(tower.x, tower.y, '#FFD700', 35, 8, 'explosion')
        screenShake = 18
        flashEffect = 0.7
        slowMotion = 18
        audioService.win()
      }, 400)
    } else if (tower.level === 50) {
      // Lv.50 - 顶级塔终极特效
      setTimeout(() => {
        // 多轮彩色爆炸
        for (let i = 0; i < 15; i++) {
          setTimeout(() => {
            addParticles(
              tower.x + (Math.random() - 0.5) * 80,
              tower.y + (Math.random() - 0.5) * 80,
              ['#FFD700', '#FF6B6B', '#00E5FF', '#9C27B0'][Math.floor(Math.random() * 4)],
              30,
              8,
              'explosion'
            )
          }, i * 60)
        }
        // 额外金色光环
        addParticles(tower.x, tower.y, '#FFD700', 60, 10, 'spark')
        addParticles(tower.x, tower.y, '#FFFFFF', 40, 8, 'explosion')
        screenShake = 22
        flashEffect = 0.8
        slowMotion = 22
        audioService.win()
        setTimeout(() => audioService.combo(), 300)
      }, 400)
    } else if (tower.level % 10 === 0 && tower.level > 50) {
      // 每10级一次的庆祝（50级以上）
      setTimeout(() => {
        const celebrationIntensity = Math.min(tower.level / 100, 1.5)
        addParticles(tower.x, tower.y, '#FFD700', 50 * celebrationIntensity, 8, 'explosion')
        addParticles(tower.x, tower.y, '#FF6B6B', 30 * celebrationIntensity, 6, 'spark')
        screenShake = 15 * celebrationIntensity
        flashEffect = 0.6 * celebrationIntensity
        slowMotion = 15 * celebrationIntensity
        audioService.win()
      }, 400)
    }
    
    // 8. 音效叠加
    setTimeout(() => audioService.combo(), 200)
  }
  
  // 激活特殊技能 - 全屏爆炸（降低强度）
  function activateSpecialSkill() {
    if (specialSkillCharge < SPECIAL_SKILL_MAX_CHARGE) return
    
    // 对所有敌人造成伤害（降低伤害值）
    enemies.forEach(enemy => {
      damageEnemy(enemy, 8) // 降低伤害
      addParticles(enemy.x, enemy.y, '#FFD700', 10, 4, 'explosion')
    })
    
    // 重置充能
    specialSkillCharge = 0
    showSpecialSkillButton = false
    
    // 特效（降低强度）
    screenShake = 15
    flashEffect = 12
    addFloat(W/2, H/2, '💥 全屏爆炸! 💥', '#FFD700')
    
    // 播放音效
    audioService.crit()
  }

  function handleMouseMove(px: number, py: number) {
    // 鼠标位置（用于触屏预览，可选增强）
  }

  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    handleClick((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY)
  })
  canvas.addEventListener('touchstart', e => {
    e.preventDefault()
    const touch = e.touches[0]
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    handleClick((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY)
  }, { passive: false })
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    handleMouseMove((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY)
  })

  // === 初始化游戏会话 ===
  async function initGameSession() {
    // 如果用户已登录，创建后端游戏会话
    if (userService.isLoggedIn && userService.current) {
      try {
        // simple-game的塔防游戏ID为1（需要根据实际情况调整）
        const GAME_ID = 1
        
        console.log('[塔防] 创建游戏会话...')
        const result = await apiStartGameSession(GAME_ID)
        
        if (result.ok && result.data) {
          sessionId = result.data.sessionId
          sessionToken = result.data.sessionToken
          console.log('[塔防] 游戏会话创建成功:', sessionId)
        } else {
          console.warn('[塔防] 创建游戏会话失败:', result.msg)
        }
      } catch (error) {
        console.error('[塔防] 创建游戏会话异常:', error)
      }
    }
  }

  // === 启动 ===
  initGameSession()  // 异步初始化会话
  loop()
}
