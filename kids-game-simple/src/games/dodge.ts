import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { DODGE_POWERUPS } from '../data/powerups'
import { app } from '../App'

export function initDodge(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  if (!canvas) return
  
  const W = 400, H = 600
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  
  // 游戏状态
  let px = W / 2, py = H - 100, pSize = 20
  let score = 0
  let obstacles: any[] = []
  let coins: any[] = []
  let powerups: any[] = [] // 道具数组
  let speed = 0.8
  let speedLevel = 1
  let showLevelUp = 0  // 等级提升提示计时器
  let invincible = 0
  let obsTimer = 0
  let dragging = false
  let lastMx = 0
  
  // 道具效果状态
  let shield = 0 // 护盾
  let magnet = 0 // 磁铁
  let double = 0 // 双倍积分
  let slow = 0 // 减速
  let ghost = 0 // 幽灵模式
  let life = 0 // 额外生命
  
  // 粒子效果
  const PARTICLES: any[] = []
  const TRAIL: any[] = []
  const EXPLOSIONS: any[] = [] // 爆炸效果
  
  // 所有道具类型（随游戏时间逐步解锁）- 轻量躲避专属
  const ALL_POWERUP_TYPES = [
    { type: 'shield', icon: '🛡️', color: '#4D96FF', name: '护盾', effect: 'immune' },
    { type: 'magnet', icon: '🧲', color: '#FF6B6B', name: '磁铁', effect: 'magnet' },
    { type: 'double', icon: '✨', color: '#FFD93D', name: '双倍', effect: 'double' },
    { type: 'slow', icon: '❄️', color: '#00CED1', name: '减速', effect: 'slow' },
    { type: 'bomb', icon: '💣', color: '#FF4500', name: '炸弹', effect: 'bomb' },
    { type: 'ghost', icon: '👻', color: '#9370DB', name: '幽灵', effect: 'ghost' },
    { type: 'life', icon: '❤️', color: '#FF69B4', name: '生命', effect: 'life' },
    { type: 'star', icon: '⭐', color: '#FFD700', name: '星星', effect: 'score3x' },
  ]
  
  // ====== 道具系统（库存模式）======
  let inventory: string[] = [] // 道具库存
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = ALL_POWERUP_TYPES.map(p => ({
      id: p.type,
      icon: p.icon,
      name: p.name
    }))
    
    app.setupCustomPowerupBar('dodge', powerups, inventory, (powerupId) => {
      if (usePowerup(powerupId)) {
        audioService.collect()
              }
    })
  }
  
  // 使用道具（从库存中激活）
  function usePowerup(type: string): boolean {
    const index = inventory.indexOf(type)
    if (index === -1) return false
    
    inventory.splice(index, 1)
    console.log('[道具] 使用道具:', type)
    
    // 找到对应的配置
    const config = ALL_POWERUP_TYPES.find(p => p.type === type)
    if (!config) return false
    
    // 创建虚拟道具对象用于激活
    activatePowerup({ ...config, x: px, y: py })
    
    return true
  }
  
  // 根据游戏时间获取已解锁的道具类型
  let unlockedTypes: typeof ALL_POWERUP_TYPES = []
  function updateUnlockedTypes(time: number) {
    const count = Math.min(2 + Math.floor(time / 12), ALL_POWERUP_TYPES.length)
    unlockedTypes = ALL_POWERUP_TYPES.slice(0, count)
  }
  
  function spawnPowerup() {
    if (Math.random() < 0.006) { // 降低出现频率
      const config = unlockedTypes[Math.floor(Math.random() * unlockedTypes.length)]
      powerups.push({
        x: Math.random() * (W - 60) + 30,
        y: -25,
        ...config,
        vy: speed * 0.5
      })
    }
  }
  
  function activatePowerup(p: any) {
    audioService.win()
    
    // 激活特效
    for (let i = 0; i < 25; i++) {
      PARTICLES.push({
        x: p.x,
        y: p.y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1,
        color: p.color,
        size: 4 + Math.random() * 4
      })
    }
    
    switch (p.type) {
      case 'shield':
        shield = 8
        break
      case 'magnet':
        magnet = 10
        break
      case 'double':
        double = 8
        break
      case 'slow':
        slow = 6  // 减速持续6秒
        break
      case 'ghost':
        ghost = 5  // 幽灵模式5秒
        invincible = 5
        break
      case 'life':
        life += 1  // 额外生命
        break
      case 'star':
      case 'score3x':
        double = 12  // 长时间双倍
        engine.addScore(50, p.x, p.y)
        score += 50
        break
      case 'bomb':
        // 炸弹效果：清除所有障碍并加分
        obstacles.forEach(o => {
          for (let i = 0; i < 12; i++) {
            EXPLOSIONS.push({
              x: o.x,
              y: o.y,
              r: 0,
              maxR: 30 + o.r,
              color: o.type === 0 ? '#FF6B6B' : '#9B59B6'
            })
          }
          score += 30
          engine.addScore(30, o.x, o.y)
        })
        obstacles = []
        break
    }
  }
  
  function draw() {
    // 渐变背景（更鲜艳）
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#1a1a4e')
    grad.addColorStop(0.5, '#2d1b4e')
    grad.addColorStop(1, '#1a1a3e')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
    
    // 星空背景（更密更亮）
    for (let i = 0; i < 50; i++) {
      const alpha = 0.2 + Math.sin(Date.now() * 0.002 + i) * 0.3
      ctx.fillStyle = `rgba(255,255,255,${alpha})`
      ctx.beginPath()
      ctx.arc((i * 137) % W, (i * 89) % H, 1 + (i % 3), 0, Math.PI * 2)
      ctx.fill()
    }
    
    // 爆炸效果
    EXPLOSIONS.forEach((e, i) => {
      e.r += 4
      if (e.r >= e.maxR) {
        EXPLOSIONS.splice(i, 1)
        return
      }
      ctx.strokeStyle = e.color
      ctx.lineWidth = 3
      ctx.globalAlpha = 1 - e.r / e.maxR
      ctx.beginPath()
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 1
    })
    
    // 拖尾效果
    TRAIL.forEach((t, i) => {
      t.life -= 0.04
      if (t.life <= 0) {
        TRAIL.splice(i, 1)
        return
      }
      ctx.globalAlpha = t.life * 0.6
      ctx.fillStyle = invincible > 0 || double > 0 ? '#FFD93D' : '#4ECDC4'
      ctx.beginPath()
      ctx.arc(t.x, t.y, pSize * t.life * 0.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })
    
    // 道具解锁提示（当解锁新道具时显示）
    if (unlockedTypes.length > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`道具库: ${unlockedTypes.length}/${ALL_POWERUP_TYPES.length}`, W - 10, 18)
    }
    
    // 绘制玩家
    const pulse = Math.sin(Date.now() * 0.006) * 3
    const playerColor = (invincible > 0 || double > 0) ? '#FFD93D' : (ghost > 0 ? '#9370DB' : '#4ECDC4')
    
    // 护盾光环
    if (shield > 0) {
      ctx.strokeStyle = 'rgba(77, 150, 255, 0.8)'
      ctx.lineWidth = 3
      ctx.setLineDash([8, 4])
      ctx.beginPath()
      ctx.arc(px, py, pSize + 12 + Math.sin(Date.now() * 0.008) * 3, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }
    
    // 磁铁范围指示
    if (magnet > 0) {
      ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(px, py, 120, 0, Math.PI * 2)
      ctx.stroke()
    }
    

    
    // 玩家主体
    ctx.fillStyle = playerColor
    ctx.shadowBlur = invincible > 0 || double > 0 ? 25 : 15
    ctx.shadowColor = playerColor
    ctx.beginPath()
    ctx.arc(px, py, pSize + pulse, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    
    // 玩家高光
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.beginPath()
    ctx.arc(px - 6, py - 6, 6, 0, Math.PI * 2)
    ctx.fill()
    
    // 玩家眼睛
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(px - 5, py - 3, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(px + 5, py - 3, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#222'
    ctx.beginPath()
    ctx.arc(px - 4, py - 3, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(px + 6, py - 3, 2, 0, Math.PI * 2)
    ctx.fill()
    
    // 绘制障碍物
    const obsPulse = Math.sin(Date.now() * 0.01) * 2
    obstacles.forEach(o => {
      ctx.save()
      ctx.translate(o.x, o.y)
      ctx.rotate(Date.now() * 0.003 * (o.type === 0 ? 1 : -1))
      
      const r = o.r + obsPulse
      const obsColor = o.type === 0 ? '#FF4757' : '#A855F7'
      
      // 外发光
      ctx.shadowBlur = 25
      ctx.shadowColor = obsColor
      
      // 障碍物主体
      ctx.fillStyle = obsColor
      ctx.beginPath()
      if (o.type === 0) ctx.roundRect(-r, -r, r * 2, r * 2, 6)
      else ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.fill()
      
      // 白色描边
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 3
      ctx.shadowBlur = 0
      ctx.stroke()
      
      // 绘制骷髅头图标
      ctx.font = `${r * 1.5}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('💀', 0, 0)
      
      // 内部高光
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      if (o.type === 0) {
        ctx.fillRect(-r + 5, -r + 5, r * 0.6, r * 0.6)
      } else {
        ctx.beginPath()
        ctx.arc(-r * 0.35, -r * 0.35, r * 0.35, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    })
    
    // 绘制金币
    coins.forEach(c => {
      const glow = Math.sin(Date.now() * 0.01) * 0.3 + 0.7
      ctx.globalAlpha = glow
      ctx.fillStyle = '#FFD700'
      ctx.shadowBlur = 15
      ctx.shadowColor = '#FFD700'
      
      // 旋转椭圆效果
      const scaleX = Math.abs(Math.cos(Date.now() * 0.005))
      ctx.beginPath()
      ctx.ellipse(c.x, c.y, 10 * scaleX, 10, 0, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
      
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('$', c.x, c.y + 3)
    })
    
    // 绘制道具
    powerups.forEach(p => {
      const floatY = Math.sin(Date.now() * 0.005 + p.x) * 5
      const pulse2 = Math.sin(Date.now() * 0.008) * 2 + 15
      
      ctx.shadowBlur = 15
      ctx.shadowColor = p.color
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y + floatY, pulse2, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      
      // 白色边框
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(p.x, p.y + floatY, pulse2 + 2, 0, Math.PI * 2)
      ctx.stroke()
      
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(p.icon, p.x, p.y + floatY + 6)
    })
    
    // 粒子效果
    PARTICLES.forEach((p, i) => {
      p.life -= 0.025
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.2
      
      if (p.life <= 0) {
        PARTICLES.splice(i, 1)
        return
      }
      
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })
    
    // UI显示 - 顶部道具栏
    const activeItems: { icon: string; time: number; color: string }[] = []
    if (shield > 0) activeItems.push({ icon: '🛡️', time: shield, color: '#4D96FF' })
    if (magnet > 0) activeItems.push({ icon: '🧲', time: magnet, color: '#FF6B6B' })
    if (double > 0) activeItems.push({ icon: '✨', time: double, color: '#FFD93D' })
    
  activeItems.forEach((item, i) => {
      ctx.fillStyle = item.color
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`${item.icon} ${item.time.toFixed(1)}s`, 10 + i * 70, 52)
    })

    // 局内 HUD：得分/连击由 CanvasGamePlay 顶栏展示
    const buffBits: string[] = []
    if (double > 0) buffBits.push('✨双倍')
    if (shield > 0) buffBits.push('🛡️')
    if (magnet > 0) buffBits.push('🧲')
    if (ghost > 0) buffBits.push('👻')
    if (slow > 0) buffBits.push('❄️')
    const buffLabel = buffBits.length ? ` · ${buffBits.join(' ')}` : ''
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.beginPath()
    ctx.roundRect(10, 8, W - 20, 36, 10)
    ctx.fill()
    ctx.fillStyle = '#4ECDC4'
    ctx.font = 'bold 15px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`速度 Lv.${speedLevel}${buffLabel}`, W / 2, 26)

    // 道具状态栏（顶部右侧）
    const activeBuffs: { icon: string; time: number; name: string }[] = []
    if (shield > 0) activeBuffs.push({ icon: '🛡️', time: shield, name: '护盾' })
    if (magnet > 0) activeBuffs.push({ icon: '🧲', time: magnet, name: '磁铁' })
    if (double > 0) activeBuffs.push({ icon: '✨', time: double, name: '双倍' })
    if (slow > 0) activeBuffs.push({ icon: '❄️', time: slow, name: '减速' })
    if (ghost > 0) activeBuffs.push({ icon: '👻', time: ghost, name: '幽灵' })
    
    activeBuffs.forEach((buff, i) => {
      const bx = W - 50 - i * 42
      const by = 35
      const pulse = Math.sin(Date.now() * 0.008 + i) * 3
      
      // 高亮背景
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.beginPath()
      ctx.roundRect(bx - 18, by - 18, 36, 36, 8)
      ctx.fill()
      
      // 闪烁边框
      ctx.strokeStyle = `rgba(255,215,0,${0.6 + Math.sin(Date.now() * 0.01) * 0.4})`
      ctx.lineWidth = 2
      ctx.stroke()
      
      // 道具图标
      ctx.font = '22px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(buff.icon, bx, by - 2)
      
      // 剩余时间条
      const barW = 28
      const barH = 4
      const remaining = Math.max(0, buff.time / (buff.name === '护盾' ? 8 : buff.name === '磁铁' ? 10 : buff.name === '双倍' ? 8 : buff.name === '减速' ? 6 : 5))
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(bx - barW/2, by + 14, barW, barH)
      ctx.fillStyle = '#4CAF50'
      ctx.fillRect(bx - barW/2, by + 14, barW * remaining, barH)
    })
    
    // 等级提升提示
    if (showLevelUp > 0) {
      ctx.globalAlpha = showLevelUp / 60
      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 20px sans-serif'
      ctx.shadowBlur = 20
      ctx.shadowColor = '#FFD700'
      ctx.fillText(`⬆️ 速度 Lv.${speedLevel}`, W / 2, H / 2 - 80)
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    }
  }
  
  function update(dt: number) {
    // 更新已解锁道具类型
    const gameTime = score / 50  // 粗略估算游戏时间
    updateUnlockedTypes(gameTime)
    
    // 更新道具持续时间
    if (magnet > 0) magnet -= dt / 1000
    if (shield > 0) shield -= dt / 1000
    if (double > 0) double -= dt / 1000
    if (slow > 0) slow -= dt / 1000
    if (ghost > 0) ghost -= dt / 1000
    if (invincible > 0) invincible -= dt
    if (showLevelUp > 0) showLevelUp -= 1
    
    // 生成障碍物
    obsTimer += dt
    const spawnRate = 700
    if (obsTimer > spawnRate) {
      obsTimer = 0
      const type = Math.random() < 0.3 ? 1 : 0
      obstacles.push({
        x: Math.random() * (W - 60) + 30,
        y: -25,
        r: type === 0 ? 20 : 16,
        type,
        vx: (Math.random() - 0.5) * 2
      })
    }
    
    // 更新障碍物位置（考虑减速效果）
    const spd = slow > 0 ? speed * 0.4 : speed
    obstacles.forEach(o => {
      o.y += spd
      o.x += o.vx
      if (o.x < o.r || o.x > W - o.r) o.vx *= -1
    })
    obstacles = obstacles.filter(o => o.y < H + 30)
    
    // 生成金币
    if (Math.random() < 0.015) {
      coins.push({ x: Math.random() * (W - 40) + 20, y: -15 })
    }
    
    // 磁铁效果：吸引金币
    if (magnet > 0) {
      coins.forEach(c => {
        const dx = px - c.x, dy = py - c.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 120 && dist > 0) {
          c.x += dx / dist * 6
          c.y += dy / dist * 6
        }
      })
    }
    
    coins.forEach(c => { c.y += 2 })
    coins = coins.filter(c => c.y < H + 20)
    
    // 生成道具
    spawnPowerup()
    powerups.forEach(p => { p.y += p.vy })
    powerups = powerups.filter(p => p.y < H + 30)
    
    // 收集道具 - 添加到库存
    powerups = powerups.filter(p => {
      if (Math.hypot(px - p.x, py - p.y) < pSize + 15) {
        // 添加到库存而不是立即激活
        inventory.push(p.type)
        
        // 显示拾取特效
        audioService.win()
        for (let i = 0; i < 25; i++) {
          PARTICLES.push({
            x: p.x,
            y: p.y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1,
            color: p.color,
            size: 4 + Math.random() * 4
          })
        }
        
        // 更新 HTML 道具栏
                
        return false
      }
      return true
    })
    
    // 收集金币
    coins = coins.filter(c => {
      if (Math.hypot(px - c.x, py - c.y) < pSize + 12) {
        const pts = double > 0 ? 40 : 20
        engine.addScore(pts, c.x, c.y)
        
        // 收集粒子
        for (let i = 0; i < 12; i++) {
          PARTICLES.push({
            x: c.x,
            y: c.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 2,
            life: 1,
            color: '#FFD700',
            size: 3 + Math.random() * 4
          })
        }
        audioService.click()
        return false
      }
      return c.y < H + 20
    })
    
    // 碰撞检测
    if (invincible <= 0) {
      for (const o of obstacles) {
        const d = Math.hypot(px - o.x, py - o.y)
        if (d < pSize + o.r - 4) {
          if (shield > 0) {
            shield = 0
            // 护盾爆炸效果
            for (let i = 0; i < 20; i++) {
              PARTICLES.push({
                x: px,
                y: py,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                life: 1,
                color: '#4D96FF',
                size: 5 + Math.random() * 5
              })
            }
            obstacles = obstacles.filter(x => x !== o)
            audioService.win()
            break
          } else if (double > 0) {
            // 双倍模式下消灭障碍
            obstacles = obstacles.filter(x => x !== o)
            score += 50
            engine.addScore(50, o.x, o.y)
            for (let i = 0; i < 15; i++) {
              PARTICLES.push({
                x: o.x,
                y: o.y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1,
                color: '#FFD93D',
                size: 4 + Math.random() * 4
              })
            }
            audioService.click()
          } else {
            audioService.fail()
            engine.setVictory(false)
            engine.endGame()
            onEnd()
            return
          }
        }
      }
    }
    
    // 速度增长
    score += 1
    if (score % 100 === 0) engine.addScore(5, W / 2, H / 2)
    if (score % 300 === 0) engine.triggerRandomBuff()
    // 速度逐级提升：初始1.2，每500分升一级，最高3级（2.2）
    const newLevel = Math.min(3, 1 + Math.floor(score / 500))
    if (newLevel > speedLevel) {
      speedLevel = newLevel
      audioService.win()
      showLevelUp = 60
    }
    speed = 1.2 + (speedLevel - 1) * 0.5
  }
  
  // 事件监听
  canvas.onmousedown = null
  canvas.onmousemove = null
  canvas.onmouseup = null
  canvas.ontouchstart = null
  canvas.ontouchmove = null
  
  canvas.onmousedown = (e) => { 
    e.preventDefault()
    dragging = true
    lastMx = e.clientX 
  }
  canvas.onmousemove = (e) => {
    if (!dragging) return
    e.preventDefault()
    const dx = e.clientX - lastMx
    px += dx
    px = Math.max(pSize, Math.min(W - pSize, px))
    lastMx = e.clientX
    TRAIL.push({ x: px, y: py, life: 1 })
  }
  canvas.onmouseup = () => { dragging = false }

  canvas.ontouchstart = (e) => {
    e.preventDefault()
    dragging = true
    lastMx = e.touches[0].clientX
  }
  canvas.ontouchmove = (e) => {
    if (!dragging) return
    e.preventDefault()
    const dx = e.touches[0].clientX - lastMx
    px += dx
    px = Math.max(pSize, Math.min(W - pSize, px))
    lastMx = e.touches[0].clientX
    TRAIL.push({ x: px, y: py, life: 1 })
  }
  canvas.ontouchend = () => { dragging = false }

  let last = 0
  function loop(ts: number) {
    if (!document.getElementById('mainGameCanvas')) return
    const dt = ts - last
    last = ts
    update(dt)
    draw()
    requestAnimationFrame(loop)
  }
  
      
  requestAnimationFrame(loop)
}
