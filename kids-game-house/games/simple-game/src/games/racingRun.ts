import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { app } from '../App'

// ============================================================
// 🏎️ 极速赛车跑酷 - 超级道具版
// 玩法：左右移动赛车，躲障碍、拾道具、爆破爽感
// 道具：🔥氮气 | 🛡️护盾 | ⚡闪电 | 💣炸弹 | 🧲磁铁 | ⭐无敌 | ✨双分 | ❄️时停 | 💚治疗 | 🌟幽灵 | 🚀狂怒 | 👻穿墙
// ============================================================

const W = 400, H = 600

// 道具类型（超级增强版）
type ItemType = 
  | 'boost' | 'shield' | 'lightning' | 'bomb' | 'magnet' 
  | 'invincible' | 'double' | 'slowmo' | 'repair' | 'star' | 'rage' | 'ghost'

interface Road {
  y: number
  speed: number
}

interface Obstacle {
  x: number
  y: number
  w: number
  h: number
  type: 'car' | 'cone' | 'oil' | 'truck'
  color: string
  emoji: string
  hp: number
}

interface Item {
  x: number
  y: number
  type: ItemType
  emoji: string
  glow: string
  age: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  trail?: boolean
}

interface FloatText {
  x: number
  y: number
  text: string
  color: string
  life: number
  vy: number
}

// 道具配置（超级增强版）
const ITEM_CONFIG: Record<ItemType, { emoji: string; glow: string; label: string; color: string }> = {
  boost:     { emoji: '🔥', glow: '#FF6B00', label: '🔥 氮气冲刺！', color: '#FF6B00' },
  shield:    { emoji: '🛡️', glow: '#4ECDC4', label: '🛡️ 无敌护盾！', color: '#4ECDC4' },
  lightning: { emoji: '⚡', glow: '#FFD700', label: '⚡ 雷霆万钧！', color: '#FFD700' },
  bomb:      { emoji: '💣', glow: '#FF4757', label: '💣 毁灭轰炸！', color: '#FF4757' },
  magnet:    { emoji: '🧲', glow: '#A29BFE', label: '🧲 全屏磁铁！', color: '#A29BFE' },
  invincible:{ emoji: '⭐', glow: '#FFD700', label: '⭐ 无敌星魂！', color: '#FFD700' },
  double:    { emoji: '✨', glow: '#00FF00', label: '✨ 疯狂得分！', color: '#00FF00' },
  slowmo:    { emoji: '❄️', glow: '#00BFFF', label: '❄️ 时间凝固！', color: '#00BFFF' },
  repair:    { emoji: '💚', glow: '#00FF00', label: '💚 满血复活！', color: '#00FF00' },
  star:      { emoji: '🌟', glow: '#FF69B4', label: '🌟 超级护盾！', color: '#FF69B4' },
  rage:      { emoji: '🚀', glow: '#FF1493', label: '🚀 狂怒毁灭！', color: '#FF1493' },
  ghost:     { emoji: '👻', glow: '#9370DB', label: '👻 幽灵穿墙！', color: '#9370DB' },
}

const OBSTACLE_CONFIG = {
  car:   { emoji: '🚗', color: '#FF4757', w: 36, h: 52, hp: 1 },
  cone:  { emoji: '🚧', color: '#FF8C00', w: 28, h: 28, hp: 1 },
  oil:   { emoji: '🛢️', color: '#2C2C54', w: 26, h: 32, hp: 1 },
  truck: { emoji: '🚛', color: '#C0392B', w: 48, h: 68, hp: 3 },
}

export function initRacingRun(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false

  // ─── 状态 ────────────────────────────────────────────
  let px = W / 2          // 玩家 X
  let pyTarget = W / 2    // 滑动目标
  let playerW = 34
  let playerH = 52
  let speed = 1           // 基础速度
  let boostTimer = 0      // 加速剩余帧（大幅延长）
  let shieldTimer = 0     // 护盾剩余帧
  let magnetTimer = 0     // 磁铁剩余帧
  let invincibleTimer = 0 // 无敌时间
  let doubleTimer = 0     // 双倍分数时间
  let slowmoTimer = 0     // 减速时间
  let rageTimer = 0       // 狂怒时间
  let ghostTimer = 0      // 幽灵穿墙时间
  let combo = 0
  let score = 0
  let distance = 0
  let invincible = 0
  let gameEnded = false
  let shakeFrames = 0
  let frameCount = 0
  let isDragging = false
  let lastTouchX = 0
  let rageTarget: Obstacle | null = null // 狂怒模式追踪目标
  
  // ====== HTML道具栏（库存模式）======
  let inventory: string[] = [] // 道具库存
  
  // 道具图标映射（简化版，选择4种核心道具）
  const powerupIcons: Record<string, string> = {
    'boost': '🔥',       // 氮气冲刺
    'shield': '🛡️',     // 护盾
    'bomb': '💣',        // 炸弹清场
    'slowmo': '❄️'       // 时停
  }
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id
    }))
    
    app.setupCustomPowerupBar('racingRun', powerups, inventory, (powerupId) => {
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
      case 'boost':
        // 氮气冲刺 - 速度×2，持续5秒
        ;(window as any).racingBoost = Date.now() + 5000
        audioService.win()
        console.log('[道具] 氮气冲刺生效')
        break
        
      case 'shield':
        // 护盾 - 免疫一次碰撞
        ;(window as any).racingShield = true
        audioService.win()
        console.log('[道具] 护盾已准备')
        break
        
      case 'bomb':
        // 炸弹清场 - 消除所有障碍
        obstacles.length = 0
        shakeFrames = 20
        audioService.win()
        console.log('[道具] 炸弹清场')
        break
        
      case 'slowmo':
        // 时停 - 减速50%，持续5秒
        slowmoTimer = Math.max(slowmoTimer, 5000)
        audioService.collect()
        console.log('[道具] 时停生效')
        break
    }
    
    return true
  }

  // 道路线（减少数量，降低压迫感）
  const roadLines: Road[] = Array.from({ length: 6 }, (_, i) => ({
    y: i * 110,
    speed: 1
  }))

  // 金币系统
  interface Coin {
    x: number
    y: number
    w: number
    h: number
    rotation: number
    value: number
    collected: boolean
  }
  let coins: Coin[] = []
  let lastCoinTime = 0
  let coinsCollected = 0

  // 路边装饰（更稀疏，移动更慢）
  const sideObjs = Array.from({ length: 4 }, (_, i) => ({
    y: i * 160,
    side: i % 2,
    type: Math.random() > 0.5 ? '🌲' : '🏔️'
  }))

  let obstacles: Obstacle[] = []
  let items: Item[] = []
  let particles: Particle[] = []
  let floatTexts: FloatText[] = []

  let lastObsTime = 0
  let lastItemTime = 0

  // ─── 生成道路障碍 ─────────────────────────────────────
  function spawnObstacle() {
    const types = (Object.keys(OBSTACLE_CONFIG) as (keyof typeof OBSTACLE_CONFIG)[])
    // 卡车较稀少
    const weights = [40, 25, 20, 15]
    let r = Math.random() * 100
    let idx = 0
    for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) { idx = i; break } }
    const type = types[idx]
    const cfg = OBSTACLE_CONFIG[type]
    // 随机道（3条车道）
    const laneW = (W - 80) / 3
    const lane = Math.floor(Math.random() * 3)
    const x = 40 + lane * laneW + laneW / 2

    // 检查重叠：确保与最近的障碍物/道具/金币有足够间距
    const minGap = 80
    const nearObs = obstacles.some(o => Math.abs(o.y) < minGap && Math.abs(o.x - x) < 60)
    const nearItem = items.some(it => Math.abs(it.y) < minGap && Math.abs(it.x - x) < 60)
    const nearCoin = coins.some(c => Math.abs(c.y) < minGap && Math.abs(c.x - x) < 60)
    if (nearObs || nearItem || nearCoin) return // 重叠则跳过

    obstacles.push({
      x, y: -cfg.h,
      w: cfg.w, h: cfg.h,
      type, color: cfg.color,
      emoji: cfg.emoji,
      hp: cfg.hp
    })
  }

  // ─── 生成道具（超级版，更频繁） ─────────────────────────────────────────
  function spawnItem() {
    const types: ItemType[] = ['boost', 'shield', 'lightning', 'bomb', 'magnet', 'invincible', 'double', 'slowmo', 'repair', 'star', 'rage', 'ghost']
    // 权重调整：让所有道具都有机会出现，稀有道具也有较高概率
    const weights = [18, 18, 12, 12, 12, 10, 10, 10, 8, 8, 6, 6]
    let r = Math.random() * 130
    let idx = 0
    for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) { idx = i; break } }
    const type = types[idx]
    const cfg = ITEM_CONFIG[type]
    const laneW = (W - 80) / 3
    const lane = Math.floor(Math.random() * 3)
    const x = 40 + lane * laneW + laneW / 2

    // 检查重叠：确保与最近的障碍物有足够间距
    const minGap = 70
    const nearObs = obstacles.some(o => Math.abs(o.y) < minGap && Math.abs(o.x - x) < 60)
    if (nearObs) return // 重叠则跳过

    items.push({ x, y: -40, type, emoji: cfg.emoji, glow: cfg.glow, age: 0 })
  }

  // ─── 生成金币 ───────────────────────────────────────────
  function spawnCoin() {
    const laneW = (W - 80) / 3
    const lane = Math.floor(Math.random() * 3)
    const x = 40 + lane * laneW + laneW / 2

    // 检查重叠：确保与最近的障碍物/道具不重叠
    const minGap = 60
    const nearObs = obstacles.some(o => Math.abs(o.y) < minGap && Math.abs(o.x - x) < 60)
    const nearItem = items.some(it => Math.abs(it.y) < minGap && Math.abs(it.x - x) < 60)
    if (nearObs || nearItem) return // 重叠则跳过

    // 金币串（3-5个）
    const count = 3 + Math.floor(Math.random() * 3)
    for (let i = 0; i < count; i++) {
      coins.push({
        x: x + (Math.random() - 0.5) * 30,
        y: -20 - i * 25,
        w: 22,
        h: 22,
        rotation: Math.random() * Math.PI * 2,
        value: 10,
        collected: false
      })
    }
  }

  // ─── 激活道具效果（超级爽版·持续时间翻倍+震撼特效） ────────────────────
  function activateItem(type: ItemType, ix: number, iy: number) {
    const cfg = ITEM_CONFIG[type]
    audioService.win()
    spawnFloatText(ix, iy, cfg.label, cfg.color)
    engine.addScore(100, ix, iy)
    score += 100

    // 超级爆炸光粒子（震撼量）
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: ix, y: iy,
        vx: (Math.random() - 0.5) * 25,
        vy: (Math.random() - 0.5) * 25,
        life: 1.5, maxLife: 1.5,
        color: cfg.color,
        size: 8 + Math.random() * 12
      })
    }
    
    // 光晕扩散效果
    for (let i = 0; i < 5; i++) {
      particles.push({
        x: ix, y: iy,
        vx: 0, vy: 0,
        life: 0.8, maxLife: 0.8,
        color: cfg.color,
        size: 40 + i * 25,
        trail: false
      })
    }

    switch (type) {
      case 'boost':
        // 持续时间：10秒（原来3秒）
        boostTimer = 600
        // 添加超级加速特效：大量火焰尾迹
        for (let i = 0; i < 100; i++) {
          particles.push({
            x: px + (Math.random() - 0.5) * 30,
            y: H - 130,
            vx: (Math.random() - 0.5) * 25,
            vy: 8 + Math.random() * 15,
            life: 1.2, maxLife: 1.2,
            color: Math.random() > 0.3 ? '#FF6B00' : '#FFD700',
            size: 6 + Math.random() * 14
          })
        }
        // 屏幕震动
        shakeFrames = 15
        // 添加速度线特效
        for (let i = 0; i < 20; i++) {
          particles.push({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: 0,
            vy: 15 + Math.random() * 10,
            life: 0.5, maxLife: 0.5,
            color: '#FF6B00',
            size: 2,
            trail: true
          })
        }
        break
        
      case 'shield':
        // 持续时间：12秒（原来4秒）
        shieldTimer = 720
        // 超级护盾展开特效
        for (let r = 0; r < 5; r++) {
          setTimeout(() => {
            for (let i = 0; i < 60; i++) {
              const angle = (i / 60) * Math.PI * 2
              particles.push({
                x: px, y: H - 130,
                vx: Math.cos(angle) * (10 + r * 4),
                vy: Math.sin(angle) * (10 + r * 4),
                life: 1.2, maxLife: 1.2,
                color: '#4ECDC4',
                size: 5 + Math.random() * 8
              })
            }
          }, r * 80)
        }
        break
        
      case 'lightning':
        // 清屏所有障碍 + 超级闪电风暴
        shakeFrames = 40
        // 全屏闪电粒子
        for (let i = 0; i < 200; i++) {
          particles.push({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0, maxLife: 1.0,
            color: Math.random() > 0.5 ? '#FFD700' : '#FFFFFF',
            size: 8 + Math.random() * 25
          })
        }
        // 连锁爆炸
        setTimeout(() => {
          obstacles.forEach((o, idx) => {
            setTimeout(() => {
              spawnExplosion(o.x, o.y + o.h / 2, 80, '#FFD700')
              for (let i = 0; i < 40; i++) {
                particles.push({
                  x: o.x, y: o.y,
                  vx: (Math.random() - 0.5) * 35,
                  vy: (Math.random() - 0.5) * 35,
                  life: 2.0, maxLife: 2.0,
                  color: Math.random() > 0.5 ? '#FFFFFF' : '#FFD700',
                  size: 12 + Math.random() * 18
                })
              }
            }, idx * 30)
          })
        }, 150)
        obstacles = []
        break
        
      case 'bomb':
        // 炸掉最近6个障碍（原来3个）
        shakeFrames = 30
        const sorted = [...obstacles].sort((a, b) => Math.abs(a.x - px) - Math.abs(b.x - px))
        const toDestroy = sorted.slice(0, 6)
        toDestroy.forEach((o, idx) => {
          setTimeout(() => {
            spawnExplosion(o.x, o.y + o.h / 2, 80, '#FF4757')
            for (let i = 0; i < 50; i++) {
              particles.push({
                x: o.x, y: o.y,
                vx: (Math.random() - 0.5) * 40,
                vy: (Math.random() - 0.5) * 40,
                life: 2.0, maxLife: 2.0,
                color: Math.random() > 0.5 ? '#FFD700' : '#FF4757',
                size: 12 + Math.random() * 20
              })
            }
            obstacles.splice(obstacles.indexOf(o), 1)
          }, idx * 60)
        })
        break
        
      case 'magnet':
        // 持续时间：15秒（原来5秒），吸引范围翻倍
        magnetTimer = 900
        // 超级磁铁吸引特效
        for (let wave = 0; wave < 3; wave++) {
          setTimeout(() => {
            for (let i = 0; i < 80; i++) {
              const angle = Math.random() * Math.PI * 2
              const dist = 80 + Math.random() * 150
              particles.push({
                x: px + Math.cos(angle) * dist,
                y: (H - 130) + Math.sin(angle) * dist,
                vx: -Math.cos(angle) * 12,
                vy: -Math.sin(angle) * 12,
                life: 1.2, maxLife: 1.2,
                color: '#A29BFE',
                size: 6 + Math.random() * 10
              })
            }
          }, wave * 150)
        }
        break
        
      case 'invincible':
        // 无敌星魂：15秒
        invincible = 900
        invincibleTimer = 900
        // 星光环绕特效
        for (let i = 0; i < 100; i++) {
          const angle = Math.random() * Math.PI * 2
          const dist = 30 + Math.random() * 80
          particles.push({
            x: px + Math.cos(angle) * dist,
            y: (H - 130) + Math.sin(angle) * dist,
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3,
            life: 2, maxLife: 2,
            color: '#FFD700',
            size: 4 + Math.random() * 8
          })
        }
        shakeFrames = 20
        break
        
      case 'double':
        // 双倍分数：20秒
        doubleTimer = 1200
        // 撒钱特效
        for (let i = 0; i < 80; i++) {
          particles.push({
            x: ix + (Math.random() - 0.5) * 100,
            y: iy + (Math.random() - 0.5) * 100,
            vx: (Math.random() - 0.5) * 15,
            vy: Math.random() * 10,
            life: 2, maxLife: 2,
            color: '#00FF00',
            size: 5 + Math.random() * 10
          })
        }
        break
        
      case 'slowmo':
        // 时间减速：12秒
        slowmoTimer = 720
        // 时间扭曲特效
        for (let i = 0; i < 120; i++) {
          particles.push({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1.5, maxLife: 1.5,
            color: '#00BFFF',
            size: 5 + Math.random() * 15
          })
        }
        break
        
      case 'repair':
        // 治疗特效
        for (let wave = 0; wave < 5; wave++) {
          setTimeout(() => {
            for (let i = 0; i < 40; i++) {
              particles.push({
                x: px + (Math.random() - 0.5) * 80,
                y: H - 130,
                vx: (Math.random() - 0.5) * 10,
                vy: -8 - Math.random() * 12,
                life: 1.5, maxLife: 1.5,
                color: '#00FF00',
                size: 6 + Math.random() * 10
              })
            }
          }, wave * 100)
        }
        invincible = 60 // 短暂无敌
        break
        
      case 'star':
        // 超级护盾：18秒
        shieldTimer = 1080
        invincible = 1080
        // 彩虹护盾特效
        const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF']
        for (let wave = 0; wave < 3; wave++) {
          setTimeout(() => {
            for (let i = 0; i < 50; i++) {
              const angle = (i / 50) * Math.PI * 2
              particles.push({
                x: px, y: H - 130,
                vx: Math.cos(angle) * (12 + wave * 5),
                vy: Math.sin(angle) * (12 + wave * 5),
                life: 1.5, maxLife: 1.5,
                color: rainbowColors[wave % rainbowColors.length],
                size: 8 + Math.random() * 10
              })
            }
          }, wave * 120)
        }
        shakeFrames = 25
        break
        
      case 'rage':
        // 狂怒毁灭：10秒，自动追踪并摧毁障碍
        rageTimer = 600
        rageTarget = null
        shakeFrames = 15
        // 狂怒特效
        for (let i = 0; i < 80; i++) {
          particles.push({
            x: px + (Math.random() - 0.5) * 60,
            y: H - 130 + (Math.random() - 0.5) * 60,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            life: 1, maxLife: 1,
            color: Math.random() > 0.5 ? '#FF1493' : '#FF69B4',
            size: 5 + Math.random() * 12
          })
        }
        break
        
      case 'ghost':
        // 幽灵穿墙：12秒
        ghostTimer = 720
        // 幽灵特效
        for (let wave = 0; wave < 3; wave++) {
          setTimeout(() => {
            for (let i = 0; i < 50; i++) {
              const angle = Math.random() * Math.PI * 2
              const dist = Math.random() * 100
              particles.push({
                x: px + Math.cos(angle) * dist,
                y: (H - 130) + Math.sin(angle) * dist,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                life: 1.5, maxLife: 1.5,
                color: '#9370DB',
                size: 4 + Math.random() * 8
              })
            }
          }, wave * 100)
        }
        break
    }
  }

  // ─── 爆炸粒子 ────────────────────────────────────────
  function spawnExplosion(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const spd = 3 + Math.random() * 8
      particles.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 1, maxLife: 1,
        color: Math.random() > 0.4 ? color : '#FFFFFF',
        size: 3 + Math.random() * 7
      })
    }
  }

  // ─── 浮动文字 ────────────────────────────────────────
  function spawnFloatText(x: number, y: number, text: string, color: string) {
    floatTexts.push({ x, y, text, color, life: 1.5, vy: -2 })
  }

  // ─── 绘制赛道背景 ────────────────────────────────────
  function drawRoad() {
    // 渐变背景（黄昏高速感）
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#FF6B35')    // 橙红天际
    grad.addColorStop(0.3, '#F7931E')  // 橙黄
    grad.addColorStop(0.6, '#FF8C42')  // 暖橙
    grad.addColorStop(1, '#FF6B6B')    // 晚霞红
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // 远处天际线
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.4)
    skyGrad.addColorStop(0, '#FF4500')
    skyGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, W, H * 0.4)

    // 路边草地（暗橙色）
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(0, 0, 40, H)
    ctx.fillRect(W - 40, 0, 40, H)

    // 路面（柏油路）
    ctx.fillStyle = '#3d3d3d'
    ctx.fillRect(40, 0, W - 80, H)

    // 路边线（白色实线）
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(40, H); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(W - 40, 0); ctx.lineTo(W - 40, H); ctx.stroke()

    // 车道虚线（黄色，更醒目）
    const laneW = (W - 80) / 3
    for (let lane = 1; lane < 3; lane++) {
      const lx = 40 + lane * laneW
      roadLines.forEach(rl => {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'
        ctx.lineWidth = 2
        ctx.setLineDash([20, 40])
        ctx.beginPath()
        ctx.moveTo(lx, rl.y)
        ctx.lineTo(lx, rl.y + 20)
        ctx.stroke()
      })
    }
    ctx.setLineDash([])

    // 路边装饰（白色剪影）
    sideObjs.forEach(o => {
      ctx.font = '22px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.globalAlpha = 0.7
      const sx = o.side === 0 ? 18 : W - 18
      ctx.fillText(o.type, sx, o.y)
      ctx.globalAlpha = 1
    })
  }

  // ─── 绘制玩家赛车 ────────────────────────────────────
  function drawPlayer() {
    ctx.save()
    if (shakeFrames > 0) {
      ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6)
    }

    const py = H - 130

    // 护盾光环
    if (shieldTimer > 0) {
      const alpha = 0.25 + 0.15 * Math.sin(frameCount * 0.2)
      ctx.strokeStyle = `rgba(78,205,196,${alpha})`
      ctx.lineWidth = 3
      ctx.shadowBlur = 15
      ctx.shadowColor = '#4ECDC4'
      ctx.beginPath()
      ctx.ellipse(px, py, playerW * 0.9, playerH * 0.75, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // 加速火焰尾迹（修正尾迹位置）
    if (boostTimer > 0) {
      for (let i = 0; i < 3; i++) {
        particles.push({
          x: px + (Math.random() - 0.5) * 20,
          y: py - playerH / 2 - 5,  // 修正为车尾方向
          vx: (Math.random() - 0.5) * 3,
          vy: -3 - Math.random() * 4,  // 修正尾迹方向
          life: 0.8, maxLife: 0.8,
          color: Math.random() > 0.5 ? '#FF6B00' : '#FFD700',
          size: 4 + Math.random() * 6,
          trail: true
        })
      }
    }

    // 磁铁光环（增强：更大更明显）
    if (magnetTimer > 0) {
      const alpha = 0.15 + 0.1 * Math.sin(frameCount * 0.15)
      ctx.fillStyle = `rgba(162,155,254,${alpha})`
      ctx.beginPath()
      ctx.arc(px, py, 80, 0, Math.PI * 2)
      ctx.fill()
      // 磁力线
      ctx.strokeStyle = `rgba(162,155,254,${alpha * 0.5})`
      ctx.lineWidth = 1.5
      for (let i = 0; i < 6; i++) {
        const angle = (frameCount * 0.05) + (i / 6) * Math.PI * 2
        ctx.beginPath()
        ctx.arc(px, py, 50 + Math.sin(frameCount * 0.1 + i) * 8, angle, angle + 0.3)
        ctx.stroke()
      }
    }

    // 无敌光环
    if (invincibleTimer > 0) {
      const alpha = 0.2 + 0.15 * Math.sin(frameCount * 0.3)
      ctx.fillStyle = `rgba(255,215,0,${alpha})`
      ctx.beginPath()
      ctx.arc(px, py, 50, 0, Math.PI * 2)
      ctx.fill()
      // 旋转星星
      for (let i = 0; i < 6; i++) {
        const angle = (frameCount * 0.08) + (i / 6) * Math.PI * 2
        const sx = px + Math.cos(angle) * 50
        const sy = py + Math.sin(angle) * 50
        ctx.font = '16px sans-serif'
        ctx.fillText('⭐', sx - 8, sy + 6)
      }
    }

    // 狂怒光环
    if (rageTimer > 0) {
      const alpha = 0.15 + 0.1 * Math.sin(frameCount * 0.4)
      ctx.fillStyle = `rgba(255,20,147,${alpha})`
      ctx.beginPath()
      ctx.arc(px, py, 45, 0, Math.PI * 2)
      ctx.fill()
      // 追踪激光
      if (obstacles.length > 0) {
        const nearest = obstacles.reduce((a, b) => 
          Math.abs(a.x - px) < Math.abs(b.x - px) ? a : b
        )
        ctx.strokeStyle = '#FF1493'
        ctx.lineWidth = 2
        ctx.shadowBlur = 10
        ctx.shadowColor = '#FF1493'
        ctx.beginPath()
        ctx.moveTo(px, py - 25)
        ctx.lineTo(nearest.x, nearest.y + nearest.h/2)
        ctx.stroke()
        ctx.shadowBlur = 0
      }
    }

    // 幽灵穿墙效果
    if (ghostTimer > 0) {
      const alpha = 0.25 + 0.1 * Math.sin(frameCount * 0.2)
      ctx.fillStyle = `rgba(147,112,219,${alpha})`
      ctx.beginPath()
      ctx.arc(px, py, 40, 0, Math.PI * 2)
      ctx.fill()
      // 半透明尾迹
      for (let i = 1; i <= 2; i++) {
        ctx.fillStyle = `rgba(147,112,219,${alpha * (0.4 - i * 0.15)})`
        ctx.beginPath()
        ctx.arc(px, py + i * 10, 32 - i * 5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // 无敌闪烁
    if (invincible > 0 && Math.floor(invincible / 5) % 2 === 0) {
      ctx.restore()
      return
    }

    // 赛车主体（炫酷流线型赛车）
    ctx.shadowBlur = boostTimer > 0 ? 30 : 15
    ctx.shadowColor = boostTimer > 0 ? '#FF6B00' : '#00D9FF'
    
    const isBoosted = boostTimer > 0
    const mainColor = isBoosted ? '#FF6B00' : '#00D9FF'
    const accentColor = isBoosted ? '#FFD700' : '#00FFFF'
    const carWidth = playerW
    const carHeight = playerH
    
    // 车身渐变
    const bodyGrad = ctx.createLinearGradient(px, py - carHeight/2, px, py + carHeight/2)
    bodyGrad.addColorStop(0, mainColor)
    bodyGrad.addColorStop(0.5, isBoosted ? '#FF8C00' : '#00BFFF')
    bodyGrad.addColorStop(1, isBoosted ? '#FF4500' : '#0080FF')
    
    // 主车身（流线型）
    ctx.fillStyle = bodyGrad
    ctx.beginPath()
    ctx.moveTo(px, py - carHeight/2)  // 车头尖
    ctx.quadraticCurveTo(px + carWidth/2.5, py - carHeight/3, px + carWidth/2, py - carHeight/6)
    ctx.lineTo(px + carWidth/2, py + carHeight/3)
    ctx.quadraticCurveTo(px + carWidth/2.5, py + carHeight/2, px, py + carHeight/2)
    ctx.quadraticCurveTo(px - carWidth/2.5, py + carHeight/2, px - carWidth/2, py + carHeight/3)
    ctx.lineTo(px - carWidth/2, py - carHeight/6)
    ctx.quadraticCurveTo(px - carWidth/2.5, py - carHeight/3, px, py - carHeight/2)
    ctx.closePath()
    ctx.fill()
    
    // 车身轮廓发光
    ctx.strokeStyle = accentColor
    ctx.lineWidth = 2
    ctx.stroke()
    
    // 车窗（流线型）
    const windowGrad = ctx.createLinearGradient(px, py - carHeight/4, px, py + carHeight/8)
    windowGrad.addColorStop(0, 'rgba(20, 20, 40, 0.9)')
    windowGrad.addColorStop(1, 'rgba(40, 40, 80, 0.7)')
    ctx.fillStyle = windowGrad
    ctx.beginPath()
    ctx.moveTo(px, py - carHeight/3.5)
    ctx.quadraticCurveTo(px + carWidth/4, py - carHeight/5, px + carWidth/3.5, py - carHeight/8)
    ctx.lineTo(px + carWidth/3.5, py + carHeight/10)
    ctx.quadraticCurveTo(px + carWidth/4, py + carHeight/8, px, py + carHeight/8)
    ctx.quadraticCurveTo(px - carWidth/4, py + carHeight/8, px - carWidth/3.5, py + carHeight/10)
    ctx.lineTo(px - carWidth/3.5, py - carHeight/8)
    ctx.quadraticCurveTo(px - carWidth/4, py - carHeight/5, px, py - carHeight/3.5)
    ctx.closePath()
    ctx.fill()
    
    // 车窗边框
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 1.5
    ctx.stroke()
    
    // 赛车条纹（中线）
    ctx.strokeStyle = accentColor
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(px, py - carHeight/2 + 5)
    ctx.lineTo(px, py + carHeight/6)
    ctx.stroke()
    
    // 车头灯
    ctx.fillStyle = '#FFFFFF'
    ctx.shadowBlur = 10
    ctx.shadowColor = '#FFFFFF'
    ctx.beginPath()
    ctx.ellipse(px - carWidth/4, py - carHeight/3, 4, 6, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(px + carWidth/4, py - carHeight/3, 4, 6, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = isBoosted ? 30 : 15
    ctx.shadowColor = mainColor
    
    // 车轮
    ctx.fillStyle = '#1a1a2e'
    ctx.strokeStyle = '#3a3a5e'
    ctx.lineWidth = 2
    
    // 前轮
    ctx.beginPath()
    ctx.ellipse(px - carWidth/2 - 3, py - carHeight/6, 6, 12, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    ctx.beginPath()
    ctx.ellipse(px + carWidth/2 + 3, py - carHeight/6, 6, 12, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    // 后轮
    ctx.beginPath()
    ctx.ellipse(px - carWidth/2 - 3, py + carHeight/3, 6, 12, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    ctx.beginPath()
    ctx.ellipse(px + carWidth/2 + 3, py + carHeight/3, 6, 12, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    // 车轮中心
    ctx.fillStyle = '#666'
    ctx.beginPath()
    ctx.arc(px - carWidth/2 - 3, py - carHeight/6, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(px + carWidth/2 + 3, py - carHeight/6, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(px - carWidth/2 - 3, py + carHeight/3, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(px + carWidth/2 + 3, py + carHeight/3, 3, 0, Math.PI * 2)
    ctx.fill()
    
    // 车尾扰流板
    ctx.fillStyle = isBoosted ? '#FF4500' : '#0066CC'
    ctx.fillRect(px - carWidth/2 - 2, py + carHeight/2 - 8, carWidth + 4, 8)
    ctx.strokeStyle = accentColor
    ctx.lineWidth = 1
    ctx.strokeRect(px - carWidth/2 - 2, py + carHeight/2 - 8, carWidth + 4, 8)
    
    ctx.shadowBlur = 0

    ctx.restore()
  }

  // ─── 绘制障碍物 ──────────────────────────────────────
  function drawObstacles() {
    obstacles.forEach(o => {
      ctx.shadowBlur = 10
      ctx.shadowColor = o.color
      // 车辆阴影
      ctx.fillStyle = 'rgba(0,0,0,0.4)'
      ctx.fillRect(o.x - o.w / 2 + 4, o.y + 6, o.w, o.h)
      ctx.font = `${o.h}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(o.emoji, o.x, o.y)
      ctx.shadowBlur = 0
    })
  }

  // ─── 绘制道具 ─────────────────────────────────────────
  function drawItems() {
    items.forEach(it => {
      it.age++
      const bounce = Math.sin(it.age * 0.1) * 4
      ctx.shadowBlur = 15 + 8 * Math.sin(it.age * 0.1)
      ctx.shadowColor = it.glow
      ctx.font = '30px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(it.emoji, it.x, it.y + bounce)
      ctx.shadowBlur = 0
    })
  }

  // ─── 绘制金币 ─────────────────────────────────────────
  function drawCoins() {
    coins.forEach(c => {
      ctx.save()
      ctx.translate(c.x, c.y)
      ctx.rotate(c.rotation)
      // 金币发光
      ctx.shadowBlur = 12
      ctx.shadowColor = '#FFD700'
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.arc(0, 0, 10, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#FFA500'
      ctx.beginPath()
      ctx.arc(0, 0, 7, 0, Math.PI * 2)
      ctx.fill()
      // $符号
      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('$', 0, 1)
      ctx.shadowBlur = 0
      ctx.restore()
    })
  }

  // ─── 绘制粒子 ─────────────────────────────────────────
  function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.x += p.vx
      p.y += p.vy
      if (!p.trail) p.vy += 0.15 // 重力
      p.life -= 0.025
      if (p.life <= 0) { particles.splice(i, 1); continue }
      ctx.globalAlpha = p.life / p.maxLife
      ctx.fillStyle = p.color
      ctx.shadowBlur = 6
      ctx.shadowColor = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    }
  }

  // ─── 绘制浮动文字 ────────────────────────────────────
  function drawFloatTexts() {
    for (let i = floatTexts.length - 1; i >= 0; i--) {
      const ft = floatTexts[i]
      ft.y += ft.vy
      ft.life -= 0.02
      if (ft.life <= 0) { floatTexts.splice(i, 1); continue }
      ctx.globalAlpha = Math.min(ft.life, 1)
      ctx.fillStyle = ft.color
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowBlur = 8
      ctx.shadowColor = ft.color
      ctx.fillText(ft.text, ft.x, ft.y)
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    }
  }

  // ─── 绘制 HUD ────────────────────────────────────────
  function drawHUD() {
    // 顶栏底板（暖色调玻璃质感）
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.fillRect(0, 0, W, 50)

    // 分数
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.shadowBlur = 4
    ctx.shadowColor = '#000'
    ctx.fillText(`🏅 ${score}`, 14, 25)

    // 金币
    ctx.fillStyle = '#FFD700'
    ctx.font = '14px sans-serif'
    ctx.fillText(`💰 ${coinsCollected}`, 14, 45)

    // 距离
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`${Math.floor(distance)}m`, 65, 45)

    // 速度仪表
    const spd = Math.round((speed / 4) * 100 + distance / 20)
    ctx.fillStyle = boostTimer > 0 ? '#FF6B00' : '#FFD700'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`${spd} km/h`, W - 14, 25)

    // combo
    if (combo >= 3) {
      ctx.fillStyle = '#FF6B00'
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'center'
      ctx.shadowBlur = 6
      ctx.shadowColor = '#FF6B00'
      ctx.fillText(`🔥 ${combo} 连杀`, W / 2, 40)
    }
    ctx.shadowBlur = 0

    // 道具状态条（底部）
    drawBuffBar()
  }

  function drawBuffBar() {
    const buffs: { label: string; timer: number; max: number; color: string }[] = []
    if (boostTimer > 0)  buffs.push({ label: '🔥氮气', timer: boostTimer,  max: 600, color: '#FF6B00' })
    if (shieldTimer > 0) buffs.push({ label: '🛡️护盾', timer: shieldTimer, max: 720, color: '#00BFFF' })
    if (magnetTimer > 0) buffs.push({ label: '🧲磁铁', timer: magnetTimer, max: 900, color: '#FFD700' })
    if (invincibleTimer > 0) buffs.push({ label: '⭐星魂', timer: invincibleTimer, max: 900, color: '#FFD700' })
    if (doubleTimer > 0) buffs.push({ label: '✨双分', timer: doubleTimer, max: 1200, color: '#00FF00' })
    if (slowmoTimer > 0) buffs.push({ label: '❄️时停', timer: slowmoTimer, max: 720, color: '#87CEEB' })
    if (rageTimer > 0) buffs.push({ label: '🚀狂怒', timer: rageTimer, max: 600, color: '#FF1493' })
    if (ghostTimer > 0) buffs.push({ label: '👻幽灵', timer: ghostTimer, max: 720, color: '#E6E6FA' })
    if (buffs.length === 0) return

    const bw = 90, bh = 18, gap = 10
    const totalW = buffs.length * bw + (buffs.length - 1) * gap
    const startX = (W - totalW) / 2
    const y = H - 28

    buffs.forEach((b, i) => {
      const x = startX + i * (bw + gap)
      // 背景（玻璃质感）
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.beginPath()
      ctx.roundRect(x, y, bw, bh, 6)
      ctx.fill()
      // 进度
      const ratio = b.timer / b.max
      ctx.fillStyle = b.color
      ctx.globalAlpha = 0.9
      ctx.beginPath()
      ctx.roundRect(x + 1, y + 1, (bw - 2) * ratio, bh - 2, 5)
      ctx.fill()
      ctx.globalAlpha = 1
      // 文字
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(b.label, x + bw / 2, y + bh / 2)
    })
  }

  // ─── 更新逻辑 ─────────────────────────────────────────
  function update() {
    frameCount++
    distance += speed * 0.05
    if (shakeFrames > 0) shakeFrames--

    // 玩家平滑跟随
    px += (pyTarget - px) * 0.18

    // 道路线动画（适度速度）
    roadLines.forEach(rl => {
      rl.y += speed * 1.2
      if (rl.y > H) rl.y -= H * 2
    })

    // 路边装饰动画
    sideObjs.forEach(o => {
      o.y += speed * 0.5
      if (o.y > H + 50) o.y = -50
    })

    // 速度递增（增强加速效果）
    const currentSpeed = 1 + distance / 800
    const boost = boostTimer > 0 ? 2.5 : 0     // 增强加速效果
    speed = Math.min(currentSpeed + boost, 10) // 提高最大速度

    // 道具计时器
    if (boostTimer > 0)  boostTimer--
    if (shieldTimer > 0) shieldTimer--
    if (magnetTimer > 0) magnetTimer--
    if (invincibleTimer > 0) invincibleTimer--
    if (doubleTimer > 0) doubleTimer--
    if (slowmoTimer > 0) slowmoTimer--
    if (rageTimer > 0) rageTimer--
    if (ghostTimer > 0) ghostTimer--
    if (invincible > 0)  invincible--
    
    // 狂怒模式：自动追踪并摧毁最近的障碍
    if (rageTimer > 0 && obstacles.length > 0) {
      const nearest = obstacles.reduce((a, b) => 
        Math.abs(a.x - px) < Math.abs(b.x - px) ? a : b
      )
      if (Math.abs(nearest.x - px) < 80 && nearest.y > 100 && nearest.y < H - 50) {
        spawnExplosion(nearest.x, nearest.y + nearest.h/2, 60, '#FF1493')
        for (let i = 0; i < 30; i++) {
          particles.push({
            x: nearest.x, y: nearest.y,
            vx: (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 30,
            life: 1, maxLife: 1,
            color: '#FF1493',
            size: 6 + Math.random() * 10
          })
        }
        obstacles.splice(obstacles.indexOf(nearest), 1)
        score += 50
        engine.addScore(50, nearest.x, nearest.y)
        shakeFrames = 5
      }
    }
    
    // 速度加成（减速时间效果）
    const slowmoFactor = slowmoTimer > 0 ? 0.4 : 1.0
    const speedBoost = boostTimer > 0 ? 2.0 : 1.0

    const now = Date.now()

    // 生成障碍（间距随速度缩短）
    const obsInterval = Math.max(700, 1400 - distance * 0.8)
    if (now - lastObsTime > obsInterval) {
      spawnObstacle()
      if (distance > 300 && Math.random() > 0.6) spawnObstacle() // 双重障碍
      lastObsTime = now
    }

    // 生成道具（更频繁）
    const itemInterval = Math.max(1500, 3000 - distance * 0.5)
    if (now - lastItemTime > itemInterval) {
      spawnItem()
      // 距离远时可能生成多个道具
      if (distance > 500 && Math.random() > 0.5) spawnItem()
      if (distance > 1000 && Math.random() > 0.6) spawnItem()
      lastItemTime = now
    }

    // 生成金币（比道具更频繁）
    const coinInterval = Math.max(800, 1800 - distance * 0.3)
    if (now - lastCoinTime > coinInterval) {
      spawnCoin()
      lastCoinTime = now
    }

    const py = H - 130

    // 障碍物更新（受减速影响）
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i]
      o.y += speed * 0.8 * slowmoFactor

      if (o.y > H + 100) {
        obstacles.splice(i, 1)
        // 成功躲避得分（双倍分数加成）
        const baseScore = (10 + combo * 2) * (doubleTimer > 0 ? 2 : 1)
        score += baseScore
        combo++
        engine.addScore(baseScore, o.x, py)
        if (combo % 5 === 0) engine.triggerRandomBuff()
        continue
      }

      // 碰撞检测（矩形）
      const hitX = Math.abs(o.x - px) < (o.w / 2 + playerW / 2 - 6)
      const hitY = o.y + o.h > py - playerH / 2 + 10 && o.y < py + playerH / 2 - 10

      if (hitX && hitY && invincible <= 0) {
        // 幽灵模式：穿墙无视
        if (ghostTimer > 0) continue
        
        if (shieldTimer > 0 || invincibleTimer > 0) {
          // 护盾吸收
          shieldTimer = 0
          invincibleTimer = 0
          spawnExplosion(o.x, o.y + o.h / 2, 30, '#4ECDC4')
          spawnFloatText(px, py - 40, '🛡️ 护盾挡住！', '#4ECDC4')
          obstacles.splice(i, 1)
          audioService.win()
          invincible = 45
        } else {
          // 受击
          combo = 0
          invincible = 90
          shakeFrames = 25
          audioService.lose()
          spawnExplosion(px, py, 50, '#FF4757')
          spawnFloatText(px, py - 40, '💥 碰撞！', '#FF4757')
          score = Math.max(0, score - 30)
          obstacles.splice(i, 1)
        }
      }
    }

    // 道具更新（与道路速度一致，贴地飞行感）
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i]
      it.y += speed * 1.0 * slowmoFactor

      if (it.y > H + 60) { items.splice(i, 1); continue }

      // 磁铁吸引（增强：范围翻倍，速度更快）
      const magnetRange = magnetTimer > 0 ? 160 : 36
      const dist = Math.sqrt((it.x - px) ** 2 + (it.y - py) ** 2)

      if (magnetTimer > 0 && dist < magnetRange) {
        it.x += (px - it.x) * 0.2
        it.y += (py - it.y) * 0.2
      }

      if (dist < 30) {
        activateItem(it.type, it.x, it.y)
        items.splice(i, 1)
      }
    }

    // 金币更新和碰撞检测（与道路速度一致）
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i]
      c.y += speed * 1.0 * slowmoFactor
      c.rotation += 0.15

      if (c.y > H + 40) { coins.splice(i, 1); continue }

      // 磁铁吸引
      if (magnetTimer > 0) {
        const dist = Math.sqrt((c.x - px) ** 2 + (c.y - py) ** 2)
        if (dist < 160) {
          c.x += (px - c.x) * 0.18
          c.y += (py - c.y) * 0.18
        }
      }

      // 碰撞检测
      const dist = Math.sqrt((c.x - px) ** 2 + (c.y - py) ** 2)
      if (dist < 28) {
        coinsCollected++
        const coinScore = c.value * (doubleTimer > 0 ? 2 : 1)
        score += coinScore
        engine.addScore(coinScore, c.x, c.y)
        // 金币收集特效
        for (let j = 0; j < 8; j++) {
          particles.push({
            x: c.x, y: c.y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 0.6, maxLife: 0.6,
            color: '#FFD700',
            size: 4 + Math.random() * 4
          })
        }
        coins.splice(i, 1)
      }
    }
    
    // 双倍分数效果
    if (doubleTimer > 0) {
      // 每隔一段时间撒金币特效
      if (frameCount % 30 === 0) {
        for (let i = 0; i < 10; i++) {
          particles.push({
            x: Math.random() * W,
            y: 0,
            vx: (Math.random() - 0.5) * 3,
            vy: 5 + Math.random() * 5,
            life: 1.5, maxLife: 1.5,
            color: '#00FF00',
            size: 4 + Math.random() * 6
          })
        }
      }
    }
  }

  // ─── 主渲染 ───────────────────────────────────────────
  function draw() {
    ctx.save()
    if (shakeFrames > 0) {
      ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8)
    }
    drawRoad()
    drawCoins()
    drawObstacles()
    drawItems()
    drawParticles()
    drawPlayer()
    drawHUD()
    drawFloatTexts()
    ctx.restore()
  }

  function loop() {
    if (!document.getElementById('mainGameCanvas') || gameEnded) return
    update()
    draw()
    requestAnimationFrame(loop)
  }

  // ─── 输入控制 ─────────────────────────────────────────

  // 鼠标移动
  canvas.onmousemove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    pyTarget = (e.clientX - rect.left) * scaleX
    pyTarget = Math.max(60, Math.min(W - 60, pyTarget))
  }

  // 触摸控制
  canvas.ontouchstart = (e: TouchEvent) => {
    e.preventDefault()
    isDragging = true
    lastTouchX = e.touches[0].clientX
  }

  canvas.ontouchmove = (e: TouchEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    pyTarget = (e.touches[0].clientX - rect.left) * scaleX
    pyTarget = Math.max(60, Math.min(W - 60, pyTarget))
  }

  canvas.ontouchend = () => { isDragging = false }

  // 键盘
  document.onkeydown = (e: KeyboardEvent) => {
    const step = 100 / 3
    if (e.key === 'ArrowLeft')  { pyTarget = Math.max(60, pyTarget - step); audioService.collect() }
    if (e.key === 'ArrowRight') { pyTarget = Math.min(W - 60, pyTarget + step); audioService.collect() }
    // 点击切换到3个固定车道
    if (e.key === 'a' || e.key === 'A') { pyTarget = 40 + (W - 80) / 6; audioService.collect() }
    if (e.key === 'd' || e.key === 'D') { pyTarget = 40 + (W - 80) * 5 / 6; audioService.collect() }
  }

  // 初始化玩家位置为中间车道
  pyTarget = W / 2
  px = W / 2

  engine.start()
  
  // 初始化 HTML 道具栏
  updateHTMLPowerupBar()
  
  loop()
}
