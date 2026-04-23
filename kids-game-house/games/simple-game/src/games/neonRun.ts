import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { app } from '../App'

export function initNeonRun(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  const W = 400, H = 600
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false

  const lanes = 3
  const laneW = W / lanes
  let playerLane = 1
  let playerY = H - 120
  let obstacles: any[] = []
  let coins: any[] = []
  let particles: any[] = []
  let speed = 3
  let score = 0
  let combo = 0
  let gameStartTime = Date.now()
  let gameEnded = false
  let lastObs = 0
  let invincible = 0
  
  // ====== 道具系统（库存模式）======
  let inventory: string[] = [] // 道具库存
  
  // 道具图标映射
  const powerupIcons: Record<string, string> = {
    'invincible': '⭐',    // 无敌 - 5秒内免疫
    'slow': '🐌',          // 减速 - 速度减半
    'magnet': '🧲',        // 磁铁 - 自动吸引金币
    'score2x': '✨'        // 双倍分数 - 10秒内×2
  }
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id
    }))
    
    app.setupCustomPowerupBar('neonRun', powerups, inventory, (powerupId) => {
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
      case 'invincible':
        // 无敌 - 5秒内免疫
        invincible = Date.now() + 5000
        audioService.win()
        console.log('[道具] 无敌生效，持续5秒')
        break
        
      case 'slow':
        // 减速 - 速度减半，持续8秒
        ;(window as any).neonSlow = Date.now() + 8000
        audioService.collect()
        console.log('[道具] 减速生效，持续8秒')
        break
        
      case 'magnet':
        // 磁铁 - 自动吸引金币，持续8秒
        ;(window as any).neonMagnet = Date.now() + 8000
        audioService.win()
        console.log('[道具] 磁铁生效，持续8秒')
        break
        
      case 'score2x':
        // 双倍分数 - 10秒内×2
        ;(window as any).neonScore2x = Date.now() + 10000
        audioService.win()
        console.log('[道具] 双倍分数生效，持续10秒')
        break
    }
    
    return true
  }

  function spawnObstacle() {
    const lane = Math.floor(Math.random() * lanes)
    obstacles.push({
      x: lane * laneW + laneW / 2,
      y: -60,
      w: laneW * 0.7,
      h: 50,
      lane,
      color: Math.random() > 0.5 ? '#FF4757' : '#8B0000'
    })
  }

  function spawnCoin() {
    const lane = Math.floor(Math.random() * lanes)
    coins.push({
      x: lane * laneW + laneW / 2,
      y: -40,
      r: 15,
      lane,
      collected: false,
      rotation: 0
    })
  }

  function draw() {
    // 霓虹背景
    ctx.fillStyle = '#0a0a0f'
    ctx.fillRect(0, 0, W, H)
    
    // 网格线
    ctx.strokeStyle = 'rgba(100, 100, 255, 0.1)'
    ctx.lineWidth = 1
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }

    // 绘制跑道
    for (let i = 0; i <= lanes; i++) {
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(i * laneW, 0)
      ctx.lineTo(i * laneW, H)
      ctx.stroke()
    }

    // 绘制障碍物
    obstacles.forEach(o => {
      ctx.shadowBlur = 20
      ctx.shadowColor = o.color
      ctx.fillStyle = o.color
      ctx.fillRect(o.x - o.w / 2, o.y, o.w, o.h)
      
      // 骷髅图标
      ctx.font = '28px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('💀', o.x, o.y + o.h / 2)
      ctx.shadowBlur = 0
    })

    // 绘制金币
    coins.forEach(c => {
      if (c.collected) return
      c.rotation += 0.1
      
      ctx.shadowBlur = 15
      ctx.shadowColor = '#FFD700'
      ctx.font = `${c.r * 2}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.save()
      ctx.translate(c.x, c.y)
      ctx.scale(Math.abs(Math.cos(c.rotation)), 1)
      ctx.fillText('🪙', 0, 0)
      ctx.restore()
      ctx.shadowBlur = 0
    })

    // 绘制玩家
    const px = playerLane * laneW + laneW / 2
    ctx.shadowBlur = invincible > 0 ? 30 : 15
    ctx.shadowColor = invincible > 0 ? '#FFD700' : '#00FFFF'
    ctx.font = '50px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🏃', px, playerY)
    ctx.shadowBlur = 0

    // 绘制粒子
    particles.forEach((p, i) => {
      p.life -= 0.02
      p.x += p.vx
      p.y += p.vy
      
      if (p.life <= 0) { particles.splice(i, 1); return }
      
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })

    // 分数
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(score), W / 2, 40)
    
    if (combo >= 3) {
      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 16px sans-serif'
      ctx.fillText(`🔥 ${combo} 连击`, W / 2, 65)
    }

    // 速度指示
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`速度: ${speed.toFixed(1)}`, W - 20, 35)
  }

  function update() {
    // 道具效果检查
    const slowActive = (window as any).neonSlow && Date.now() < (window as any).neonSlow
    const currentSpeed = slowActive ? speed * 0.5 : speed
    const score2xActive = (window as any).neonScore2x && Date.now() < (window as any).neonScore2x
    
    // 障碍物移动
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i]
      o.y += currentSpeed
      
      // 检测碰撞
      const px = playerLane * laneW + laneW / 2
      if (invincible <= 0 && 
          o.lane === playerLane && 
          o.y + o.h > playerY - 25 && 
          o.y < playerY + 25) {
        combo = 0
        invincible = 60
        audioService.lose()
        
        // 爆炸效果
        for (let j = 0; j < 20; j++) {
          particles.push({
            x: px,
            y: playerY,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            life: 1,
            color: '#FF4757',
            size: 4 + Math.random() * 6
          })
        }
        
        obstacles.splice(i, 1)
        continue
      }
      
      if (o.y > H + 100) {
        obstacles.splice(i, 1)
        const points = score2xActive ? 20 : 10
        score += points
        combo++
        if (combo >= 5) engine.triggerRandomBuff()
      }
    }

    // 金币移动和磁铁效果
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i]
      
      // 磁铁效果：自动吸引金币
      const magnetActive = (window as any).neonMagnet && Date.now() < (window as any).neonMagnet
      if (magnetActive && !c.collected) {
        const px = playerLane * laneW + laneW / 2
        const dx = px - c.x
        const dy = playerY - c.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 200) { // 磁铁范围
          c.x += dx * 0.1
          c.y += dy * 0.1
        }
      }
      
      c.y += speed
      
      const px = playerLane * laneW + laneW / 2
      if (!c.collected && c.lane === playerLane && 
          Math.abs(c.y - playerY) < 40) {
        c.collected = true
        combo++
        const basePoints = 20 * combo
        const points = score2xActive ? basePoints * 2 : basePoints
        score += points
        engine.addScore(points, c.x, c.y)
        audioService.win()
        
        for (let j = 0; j < 10; j++) {
          particles.push({
            x: c.x,
            y: c.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1,
            color: '#FFD700',
            size: 3 + Math.random() * 4
          })
        }
      }
      
      if (c.y > H + 50) {
        coins.splice(i, 1)
      }
    }

    // 无敌时间衰减
    if (invincible > 0) invincible--

    // 生成
    if (Date.now() - lastObs > 1200) {
      if (Math.random() > 0.3) spawnObstacle()
      if (Math.random() > 0.5) spawnCoin()
      lastObs = Date.now()
    }
    
    // 道具自动获取：每500分获得一个道具
    const powerupThreshold = Math.floor(score / 500)
    if (powerupThreshold > 0 && powerupThreshold !== (window as any).neonLastPowerupGiven) {
      ;(window as any).neonLastPowerupGiven = powerupThreshold
      const powerups = ['invincible', 'slow', 'magnet', 'score2x']
      const random = powerups[Math.floor(Math.random() * powerups.length)]
      inventory.push(random)
      updateHTMLPowerupBar()
      console.log('[道具] 获得道具:', random)
    }

    // 速度增加
    speed = 3 + (Date.now() - gameStartTime) / 30000
  }

  // 键盘控制
  document.onkeydown = (e) => {
    if (e.key === 'ArrowLeft' && playerLane > 0) {
      playerLane--
      audioService.collect()
    }
    if (e.key === 'ArrowRight' && playerLane < lanes - 1) {
      playerLane++
      audioService.collect()
    }
  }

  // 触摸控制
  canvas.onclick = canvas.ontouchstart = (e) => {
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX || e.touches[0].clientX
    const clickX = x - rect.left
    
    if (clickX < W / 3 && playerLane > 0) {
      playerLane--
      audioService.collect()
    } else if (clickX > W * 2 / 3 && playerLane < lanes - 1) {
      playerLane++
      audioService.collect()
    }
  }

  function loop() {
    if (!document.getElementById('mainGameCanvas') || gameEnded) return
    update()
    draw()
    requestAnimationFrame(loop)
  }
  
  // 初始化 HTML 道具栏
  updateHTMLPowerupBar()
  
  loop()
}
