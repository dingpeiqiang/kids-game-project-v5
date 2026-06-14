import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { app } from '../services/appBridge'

export function initCookieCut(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  const W = 400, H = 600
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false

  // 各种饼干形状
  const COOKIES = [
    { shape: 'star', emoji: '⭐', color: '#FFD700' },
    { shape: 'heart', emoji: '❤️', color: '#FF6B6B' },
    { shape: 'circle', emoji: '🍪', color: '#D2691E' },
    { shape: 'moon', emoji: '🌙', color: '#F0E68C' },
    { shape: 'flower', emoji: '🌸', color: '#FF69B4' },
  ]

  const cookies: any[] = []
  const particles: any[] = []
  const slices: any[] = []
  let lastSpawn = 0
  let gameStartTime = Date.now()
  const GAME_DURATION = 60000
  let gameEnded = false
  let isSlicing = false
  let lastX = 0, lastY = 0
  
  // ====== 道具系统（库存模式）======
  let inventory: string[] = [] // 道具库存
  
  // 道具图标映射
  const powerupIcons: Record<string, string> = {
    'slow': '🐌',       // 减速 - 饼干速度减半
    'score2x': '✨',    // 双倍分数 - 10秒内×2
    'freeze': '❄️',     // 冻结 - 暂停所有饼干3秒
    'magnet': '🧲'      // 磁铁 - 自动吸引附近饼干
  }
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id
    }))
    
    app.setupCustomPowerupBar('cookieCut', powerups, inventory, (powerupId) => {
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
        // 减速 - 饼干速度减半，持续8秒
        ;(window as any).cookieSlow = Date.now() + 8000
        audioService.collect()
        console.log('[道具] 减速生效，持续8秒')
        break
        
      case 'score2x':
        // 双倍分数 - 10秒内×2
        ;(window as any).cookieScore2x = Date.now() + 10000
        audioService.win()
        console.log('[道具] 双倍分数生效，持续10秒')
        break
        
      case 'freeze':
        // 冻结 - 暂停所有饼干3秒
        ;(window as any).cookieFreeze = Date.now() + 3000
        audioService.win()
        console.log('[道具] 冻结生效，持续3秒')
        break
        
      case 'magnet':
        // 磁铁 - 自动吸引附近饼干，持续6秒
        ;(window as any).cookieMagnet = Date.now() + 6000
        audioService.win()
        console.log('[道具] 磁铁生效，持续6秒')
        break
    }
    
    return true
  }

  function spawnCookie() {
    const size = 50 + Math.random() * 20
    const x = 60 + Math.random() * (W - 120)
    const template = COOKIES[Math.floor(Math.random() * COOKIES.length)]
    
    cookies.push({
      x,
      y: H + size,
      vx: (Math.random() - 0.5) * 1.5,  // 减小水平速度，从3降到1.5
      vy: -(3 + Math.random() * 2),     // 减小垂直速度，从5-8降到3-5
      size,
      rotation: 0,
      rotSpeed: (Math.random() - 0.5) * 0.08,  // 减小旋转速度，从0.15降到0.08
      ...template,
      sliced: false
    })
  }

  function draw() {
    // 温暖的面包店背景
    ctx.fillStyle = '#2D1B0E'
    ctx.fillRect(0, 0, W, H)
    
    // 渐变覆盖
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, 'rgba(139, 69, 19, 0.3)')
    grad.addColorStop(1, 'rgba(101, 67, 33, 0.5)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // 切割轨迹
    slices.forEach((s, i) => {
      s.life -= 0.05
      if (s.life <= 0) { slices.splice(i, 1); return }
      
      ctx.lineCap = 'round'
      ctx.lineWidth = 16 * s.life
      ctx.strokeStyle = `rgba(255, 200, 100, ${s.life * 0.6})`
      ctx.beginPath()
      ctx.moveTo(s.x1, s.y1)
      ctx.lineTo(s.x2, s.y2)
      ctx.stroke()
      
      ctx.lineWidth = 4 * s.life
      ctx.strokeStyle = `rgba(255, 255, 255, ${s.life})`
      ctx.stroke()
    })

    // 饼干
    cookies.forEach(c => {
      if (c.sliced) return
      
      ctx.save()
      ctx.translate(c.x, c.y)
      ctx.rotate(c.rotation)
      
      // 发光
      ctx.shadowColor = c.color
      ctx.shadowBlur = 15
      
      ctx.font = `${c.size}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(c.emoji, 0, 0)
      ctx.restore()
    })

    // 粒子
    particles.forEach((p, i) => {
      p.life -= 0.02
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.25
      
      if (p.life <= 0) { particles.splice(i, 1); return }
      
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })

    const elapsedHud = Date.now() - gameStartTime
    const remainingHud = Math.max(0, GAME_DURATION - elapsedHud)
    const secondsHud = Math.ceil(remainingHud / 1000)
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.beginPath()
    ctx.roundRect(10, 8, W - 20, 40, 10)
    ctx.fill()
    ctx.fillStyle = secondsHud <= 10 ? '#FF4444' : '#D2691E'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const streak = engine.getCombo()
    const comboLabel = streak >= 2 ? ` · 🔥${streak}连击` : ''
    ctx.fillText(`⏱ 剩余 ${secondsHud} 秒${comboLabel}`, W / 2, 28)

    // 提示
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '18px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🍪 滑动切割上升的饼干!', W / 2, H - 25)
  }

  function update() {
    for (let i = cookies.length - 1; i >= 0; i--) {
      const c = cookies[i]
      
      c.x += c.vx
      c.y += c.vy
      c.rotation += c.rotSpeed
      
      // 左右边界
      if (c.x < c.size / 2) {
        c.x = c.size / 2
        c.vx *= -0.8
      }
      if (c.x > W - c.size / 2) {
        c.x = W - c.size / 2
        c.vx *= -0.8
      }
      
      // 超出顶部移除
      if (c.y < -c.size * 2) {
        combo = 0
        cookies.splice(i, 1)
      }
    }

    const now = Date.now()
    if (now - lastSpawn > 1500 && cookies.length < 3) {  // 增加生成间隔，从900ms增加到1500ms
      spawnCookie()
      lastSpawn = now
    }
  }

  function checkSlice(x1: number, y1: number, x2: number, y2: number) {
    const sliceLen = Math.hypot(x2 - x1, y2 - y1)
    if (sliceLen < 20) return

    for (let i = cookies.length - 1; i >= 0; i--) {
      const c = cookies[i]
      if (c.sliced) continue

      const dx = x2 - x1
      const dy = y2 - y1
      const fx = c.x - x1
      const fy = c.y - y1
      const t = Math.max(0, Math.min(1, (fx * dx + fy * dy) / (sliceLen * sliceLen || 1)))
      const dist = Math.hypot(c.x - (x1 + t * dx), c.y - (y1 + t * dy))
      
      if (dist < c.size / 2 + 25) {
        c.sliced = true
        const earned = engine.addScore(15, c.x, c.y)
        audioService.win()
        
        // 饼干碎屑
        for (let j = 0; j < 18; j++) {
          particles.push({
            x: c.x,
            y: c.y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1,
            color: ['#D2691E', '#FFD700', '#F4A460', '#8B4513'][Math.floor(Math.random() * 4)],
            size: 4 + Math.random() * 6
          })
        }
        
        if (engine.getCombo() >= 3) engine.triggerRandomBuff()
        cookies.splice(i, 1)
      }
    }
  }

  function getPos(e: MouseEvent | TouchEvent) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  canvas.onmousedown = canvas.ontouchstart = (e) => {
    e.preventDefault()
    isSlicing = true
    const pos = getPos(e as any)
    lastX = pos.x
    lastY = pos.y
  }

  canvas.onmousemove = canvas.ontouchmove = (e) => {
    if (!isSlicing) return
    e.preventDefault()
    
    const pos = getPos(e as any)
    slices.push({ x1: lastX, y1: lastY, x2: pos.x, y2: pos.y, life: 1 })
    checkSlice(lastX, lastY, pos.x, pos.y)
    
    lastX = pos.x
    lastY = pos.y
  }

  canvas.onmouseup = canvas.ontouchend = () => isSlicing = false
  canvas.onmouseleave = canvas.ontouchcancel = () => isSlicing = false

  function loop() {
    if (!document.getElementById('mainGameCanvas') || gameEnded) return
    if (!engine.canTick()) {
      draw()
      requestAnimationFrame(loop)
      return
    }
    
    if (Date.now() - gameStartTime > GAME_DURATION) {
      gameEnded = true
      engine.setVictory(false)
      engine.endGame()
      onEnd()
      return
    }
    
    update()
    draw()
    requestAnimationFrame(loop)
  }

  engine.start()
  spawnCookie()
  setTimeout(spawnCookie, 500)
  
      
  loop()
}
