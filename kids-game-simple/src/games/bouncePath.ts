import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { app } from '../services/appBridge'
import { resizeCanvasForMobile } from '../utils/mobileHelper'
import { applyCanvasMobileStyles, bindCanvasPointerTapAndMove } from '../utils/canvasMobileUtils'

export function initBouncePath(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  const W = 400, H = 600
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false

  const BALL_COLORS = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#FF69B4', '#9B59B6']
  let ball = { x: W / 2, y: H - 80, vx: 0, vy: 0, r: 15, color: BALL_COLORS[0] }
  const stars: any[] = []
  const particles: any[] = []
  let gameStartTime = Date.now()
  const GAME_DURATION = 60000
  let gameEnded = false
  let targetX = W / 2
  let trail: any[] = []
  
  // ====== 道具系统（库存模式）======
  let inventory: string[] = [] // 道具库存
  
  // 道具图标映射
  const powerupIcons: Record<string, string> = {
    'slow': '🐌',        // 减速 - 球速度减半
    'magnet': '🧲',      // 磁铁 - 自动吸引星星
    'multiball': '⚪',   // 多球 - 分裂成3个球
    'score2x': '✨'      // 双倍分数 - 10秒内分数翻倍
  }
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id
    }))
    
    app.setupCustomPowerupBar('bouncePath', powerups, inventory, (powerupId) => {
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
    console.log('[道具] 使用道具:', type)
    
    switch (type) {
      case 'slow':
        // 减速 - 球速度减半，持续8秒
        ball.vx *= 0.5
        ball.vy *= 0.5
        audioService.win()
        console.log('[道具] 减速生效')
        
        // 8秒后恢复
        setTimeout(() => {
          ball.vx *= 2
          ball.vy *= 2
        }, 8000)
        break
        
      case 'magnet':
        // 磁铁 - 星星向球移动，持续6秒
        ;(window as any).bounceMagnet = Date.now() + 6000
        audioService.collect()
        console.log('[道具] 磁铁生效，持续6秒')
        break
        
      case 'multiball':
        // 多球 - 暂时不实现复杂逻辑，改为大球效果
        ball.r = Math.min(ball.r * 1.5, 30)
        audioService.win()
        console.log('[道具] 球变大')
        
        // 5秒后恢复
        setTimeout(() => {
          ball.r = 15
        }, 5000)
        break
        
      case 'score2x':
        // 双倍分数 - 10秒内分数翻倍
        ;(window as any).bounceScore2x = Date.now() + 10000
        audioService.win()
        console.log('[道具] 双倍分数生效，持续10秒')
        break
    }
    
    return true
  }

  function spawnStar() {
    const size = 20 + Math.random() * 15
    stars.push({
      x: Math.random() * (W - 60) + 30,
      y: Math.random() * (H - 150) + 80,
      size,
      collected: false,
      pulse: Math.random() * Math.PI * 2
    })
  }

  function draw() {
    // 渐变背景
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#0f0c29')
    grad.addColorStop(0.5, '#302b63')
    grad.addColorStop(1, '#24243e')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // 绘制星星
    stars.forEach(s => {
      if (s.collected) return
      s.pulse += 0.05
      const pulse = Math.sin(s.pulse) * 3
      
      // 发光效果
      ctx.shadowBlur = 20
      ctx.shadowColor = '#FFD93D'
      
      ctx.font = `${s.size + pulse}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('⭐', s.x, s.y)
      
      ctx.shadowBlur = 0
    })

    // 绘制拖尾
    trail.forEach((t, i) => {
      t.life -= 0.05
      if (t.life <= 0) { trail.splice(i, 1); return }
      
      ctx.globalAlpha = t.life * 0.5
      ctx.fillStyle = ball.color
      ctx.beginPath()
      ctx.arc(t.x, t.y, ball.r * t.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })

    // 绘制球
    ctx.shadowBlur = 15
    ctx.shadowColor = ball.color
    ctx.fillStyle = ball.color
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2)
    ctx.fill()
    
    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.beginPath()
    ctx.arc(ball.x - ball.r * 0.3, ball.y - ball.r * 0.3, ball.r * 0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    const elapsedHud = Date.now() - gameStartTime
    const remainingHud = Math.max(0, GAME_DURATION - elapsedHud)
    const secondsHud = Math.ceil(remainingHud / 1000)
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.beginPath()
    ctx.roundRect(10, 8, W - 20, 40, 10)
    ctx.fill()
    ctx.fillStyle = secondsHud <= 10 ? '#FF6B6B' : '#4ECDC4'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const streak = engine.getCombo()
    const comboLabel = streak >= 2 ? ` · 🔥${streak}` : ''
    ctx.fillText(`⏱ 剩余 ${secondsHud} 秒${comboLabel}`, W / 2, 28)

    // 绘制粒子
    particles.forEach((p, i) => {
      p.life -= 0.03
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.1
      
      if (p.life <= 0) { particles.splice(i, 1); return }
      
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })
  }

  function update() {
    // 球跟随目标
    const dx = targetX - ball.x
    ball.x += dx * 0.15
    ball.vx = dx * 0.1
    
    // 碰壁反弹
    if (ball.x < ball.r) {
      ball.x = ball.r
      ball.vx *= -0.8
    }
    if (ball.x > W - ball.r) {
      ball.x = W - ball.r
      ball.vx *= -0.8
    }
    
    // 上下反弹
    if (ball.y < ball.r + 70) {
      ball.y = ball.r + 70
      ball.vy *= -0.9
    }
    if (ball.y > H - ball.r - 50) {
      ball.y = H - ball.r - 50
      ball.vy *= -0.8
    }
    
    // 重力
    ball.vy += 0.15
    ball.y += ball.vy
    
    // 添加拖尾
    if (Math.abs(ball.vx) > 0.5 || Math.abs(ball.vy) > 0.5) {
      trail.push({ x: ball.x, y: ball.y, life: 1 })
    }

    // 检测收集星星
    const isMagnet = (window as any).bounceMagnet && Date.now() < (window as any).bounceMagnet
    
    stars.forEach(s => {
      if (s.collected) return
      
      // 磁铁效果 - 星星向球移动
      if (isMagnet) {
        const dx = ball.x - s.x
        const dy = ball.y - s.y
        const dist = Math.hypot(dx, dy)
        if (dist > 0 && dist < 200) {
          s.x += (dx / dist) * 2
          s.y += (dy / dist) * 2
        }
      }
      
      const dist = Math.hypot(ball.x - s.x, ball.y - s.y)
      if (dist < ball.r + s.size / 2) {
        s.collected = true
        let base = 20
        if ((window as any).bounceScore2x && Date.now() < (window as any).bounceScore2x) base *= 2
        engine.addScore(base, s.x, s.y)
        audioService.win()
        
        // 粒子爆炸
        for (let i = 0; i < 20; i++) {
          particles.push({
            x: s.x,
            y: s.y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1,
            color: '#FFD93D',
            size: 3 + Math.random() * 5
          })
        }
        
        if (engine.getCombo() >= 3) engine.triggerRandomBuff()
      }
    })
    
    // 重新生成星星
    if (stars.filter(s => !s.collected).length < 3) {
      spawnStar()
    }
  }

  // 初始化Canvas尺寸（移动端适配）
  resizeCanvasForMobile(canvas)
  applyCanvasMobileStyles(canvas)

  const unbindPointer = bindCanvasPointerTapAndMove(
    canvas,
    (x) => {
      targetX = x
    },
    (x) => {
      targetX = x
      ball.vy = -8
      audioService.collect()
    },
  )

  function loop() {
    if (!document.getElementById('mainGameCanvas') || gameEnded) {
      unbindPointer()
      return
    }

    const elapsed = Date.now() - gameStartTime
    if (elapsed > GAME_DURATION) {
      gameEnded = true
      unbindPointer()
      engine.setVictory(false)
      engine.endGame()
      onEnd()
      return
    }
    
    update()
    draw()
    requestAnimationFrame(loop)
  }

  // 初始生成星星
  for (let i = 0; i < 5; i++) spawnStar()
  
      
  loop()
}
