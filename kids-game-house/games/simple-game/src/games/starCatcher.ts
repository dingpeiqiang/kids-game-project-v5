import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { app } from '../App'

export function initStarCatcher(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  const W = 400, H = 600
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false

  // 玩家（可爱的小精灵）
  const player = { x: W / 2, y: H - 100, size: 40 }
  
  // 星星和障碍物
  const stars: any[] = []
  const obstacles: any[] = []
  const particles: any[] = []
  let combo = 0
  let lastSpawn = 0
  let gameStartTime = Date.now()
  const GAME_DURATION = 60000
  let gameEnded = false
  let mouseX = W / 2
  
  // ====== 道具系统（库存模式）======
  let inventory: string[] = [] // 道具库存
  
  // 道具图标映射
  const powerupIcons: Record<string, string> = {
    'magnet': '🧲',       // 磁铁 - 自动吸引星星
    'shield': '🛡️',      // 护盾 - 免疫障碍物5秒
    'score2x': '✨',      // 双倍分数 - 10秒内×2
    'slow': '🐌'          // 减速 - 所有物体速度减半
  }
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id
    }))
    
    app.setupCustomPowerupBar('starCatcher', powerups, inventory, (powerupId) => {
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
      case 'magnet':
        // 磁铁 - 自动吸引星星，持续8秒
        ;(window as any).starMagnet = Date.now() + 8000
        audioService.win()
        console.log('[道具] 磁铁生效，持续8秒')
        break
        
      case 'shield':
        // 护盾 - 免疫障碍物5秒
        ;(window as any).starShield = Date.now() + 5000
        audioService.win()
        console.log('[道具] 护盾生效，持续5秒')
        break
        
      case 'score2x':
        // 双倍分数 - 10秒内×2
        ;(window as any).starScore2x = Date.now() + 10000
        audioService.win()
        console.log('[道具] 双倍分数生效，持续10秒')
        break
        
      case 'slow':
        // 减速 - 所有物体速度减半，持续8秒
        ;(window as any).starSlow = Date.now() + 8000
        audioService.collect()
        console.log('[道具] 减速生效，持续8秒')
        break
    }
    
    return true
  }

  function spawnStar() {
    stars.push({
      x: 40 + Math.random() * (W - 80),
      y: -30,
      size: 25 + Math.random() * 15,
      vy: 2 + Math.random() * 2,
      type: Math.random() < 0.3 ? 'gold' : 'normal',
      rotation: 0
    })
  }

  function spawnObstacle() {
    obstacles.push({
      x: 40 + Math.random() * (W - 80),
      y: -30,
      size: 30,
      vy: 3 + Math.random() * 2,
      type: 'cloud'
    })
  }

  function draw() {
    // 夜空背景
    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(0, 0, W, H)

    // 星星背景
    for (let i = 0; i < 50; i++) {
      const sx = (i * 73) % W
      const sy = (i * 137) % H
      const twinkle = Math.sin(Date.now() / 500 + i) * 0.5 + 0.5
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + twinkle * 0.4})`
      ctx.beginPath()
      ctx.arc(sx, sy, 1 + twinkle, 0, Math.PI * 2)
      ctx.fill()
    }

    // 星星
    stars.forEach(s => {
      ctx.save()
      ctx.translate(s.x, s.y)
      ctx.rotate(s.rotation)
      
      ctx.shadowColor = s.type === 'gold' ? '#FFD700' : '#87CEEB'
      ctx.shadowBlur = 20
      
      const emoji = s.type === 'gold' ? '🌟' : '⭐'
      ctx.font = `${s.size}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(emoji, 0, 0)
      ctx.restore()
    })

    // 障碍物（乌云）
    obstacles.forEach(o => {
      ctx.font = '50px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('☁️', o.x, o.y)
    })

    // 玩家
    ctx.save()
    ctx.translate(player.x, player.y)
    ctx.shadowColor = '#FF69B4'
    ctx.shadowBlur = 15
    ctx.font = `${player.size}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🧚', 0, 0)
    ctx.restore()

    // 粒子
    particles.forEach((p, i) => {
      p.life -= 0.03
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
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 40px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(engine.getScore()), W / 2, 50)
    
    if (combo >= 3) {
      ctx.fillStyle = '#FF69B4'
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText(`${combo} 连击!`, W / 2, 90)
    }

    // 时间
    const elapsed = Date.now() - gameStartTime
    const remaining = Math.max(0, GAME_DURATION - elapsed)
    const seconds = Math.ceil(remaining / 1000)
    
    ctx.fillStyle = seconds <= 10 ? '#FF4444' : '#fff'
    ctx.font = 'bold 22px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`${seconds}s`, W - 15, 45)

    // 提示
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '16px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🧚 移动收集星星，躲避乌云!', W / 2, H - 25)
  }

  function update() {
    // 玩家跟随鼠标/触摸
    const targetX = Math.max(30, Math.min(W - 30, mouseX))
    player.x += (targetX - player.x) * 0.15

    // 星星下落
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i]
      s.y += s.vy
      s.rotation += 0.05

      // 碰撞检测
      const dist = Math.hypot(player.x - s.x, player.y - s.y)
      if (dist < player.size + s.size / 2) {
        combo++
        const score = s.type === 'gold' ? 20 : 10
        engine.addScore(score * combo, s.x, s.y)
        audioService.win()
        
        // 收集特效
        for (let j = 0; j < 12; j++) {
          particles.push({
            x: s.x,
            y: s.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1,
            color: s.type === 'gold' ? '#FFD700' : '#87CEEB',
            size: 4 + Math.random() * 4
          })
        }
        
        if (combo >= 5) engine.triggerRandomBuff()
        stars.splice(i, 1)
        continue
      }

      // 超出屏幕
      if (s.y > H + 50) {
        combo = 0
        stars.splice(i, 1)
      }
    }

    // 障碍物下落
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i]
      o.y += o.vy

      // 碰撞检测
      const dist = Math.hypot(player.x - o.x, player.y - o.y)
      if (dist < player.size + o.size / 2) {
        engine.addScore(-30, player.x, player.y)
        combo = 0
        audioService.lose()
        
        // 碰撞特效
        for (let j = 0; j < 15; j++) {
          particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            life: 1,
            color: '#666',
            size: 5 + Math.random() * 5
          })
        }
        obstacles.splice(i, 1)
        continue
      }

      if (o.y > H + 50) {
        obstacles.splice(i, 1)
      }
    }

    // 生成
    const now = Date.now()
    if (now - lastSpawn > 600) {
      if (stars.length < 4) spawnStar()
      if (obstacles.length < 2 && Math.random() < 0.3) spawnObstacle()
      lastSpawn = now
    }
  }

  function getPos(e: MouseEvent | TouchEvent) {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * (W / rect.width) }
    }
    return { x: (e.clientX - rect.left) * (W / rect.width) }
  }

  canvas.onmousemove = canvas.ontouchmove = (e) => {
    mouseX = getPos(e as any).x
  }
  canvas.onmousedown = canvas.ontouchstart = (e) => {
    mouseX = getPos(e as any).x
  }

  function loop() {
    if (!document.getElementById('mainGameCanvas') || gameEnded) return
    
    if (Date.now() - gameStartTime > GAME_DURATION) {
      gameEnded = true
      engine.endGame()
      onEnd()
      return
    }
    
    update()
    draw()
    requestAnimationFrame(loop)
  }

  engine.start()
  
  // 初始化 HTML 道具栏
  updateHTMLPowerupBar()
  
  loop()
}
