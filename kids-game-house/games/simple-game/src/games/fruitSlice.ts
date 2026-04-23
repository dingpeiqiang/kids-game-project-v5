import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { app } from '../App'

export function initFruitSlice(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  if (!canvas) {
    console.error('Canvas not found!')
    return
  }
  
  const W = 400, H = 600
  const ctx = canvas.getContext('2d')!
  if (!ctx) {
    console.error('Cannot get 2D context!')
    return
  }
  ctx.imageSmoothingEnabled = false

  const FRUITS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🥝']
  const fruits: any[] = []
  const particles: any[] = []
  const slices: any[] = []
  let combo = 0
  let lastSpawn = Date.now() // 初始化为当前时间
  let gameStartTime = Date.now()
  const GAME_DURATION = 60000
  let gameEnded = false
  let missedCount = 0
  let isSlicing = false
  let lastX = 0, lastY = 0
  
  // ====== 道具系统 ======
  let inventory: string[] = [] // 道具库存
  
  // 道具图标映射
  const powerupIcons: Record<string, string> = {
    'slow': '🐌',        // 减速 - 水果速度减半
    'magnet': '🧲',      // 磁铁 - 自动吸引水果
    'double': '⭐',      // 双倍分数 - 10秒内分数翻倍
    'bomb': '💣'         // 炸弹 - 消除屏幕上所有水果
  }
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id
    }))
    
    app.setupCustomPowerupBar('fruitSlice', powerups, inventory, (powerupId) => {
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
      case 'slow':
        // 减速 - 所有水果速度减半，持续8秒
        fruits.forEach(f => {
          f.vx *= 0.5
          f.vy *= 0.5
          f.gravity *= 0.3
        })
        audioService.win()
        console.log('[道具] 减速生效，持续8秒')
        
        // 8秒后恢复
        setTimeout(() => {
          fruits.forEach(f => {
            f.vx *= 2
            f.vy *= 2
            f.gravity /= 0.3
          })
        }, 8000)
        break
        
      case 'magnet':
        // 磁铁 - 水果向中心聚集，持续6秒
        ;(window as any).fruitMagnet = Date.now() + 6000
        audioService.collect()
        console.log('[道具] 磁铁生效，持续6秒')
        break
        
      case 'double':
        // 双倍分数 - 10秒内分数翻倍
        ;(window as any).fruitDoubleScore = Date.now() + 10000
        audioService.win()
        console.log('[道具] 双倍分数生效，持续10秒')
        break
        
      case 'bomb':
        // 炸弹 - 消除屏幕上所有水果
        let bombCount = 0
        fruits.forEach(f => {
          if (!f.sliced) {
            f.sliced = true
            bombCount++
            // 创建爆炸粒子
            for (let i = 0; i < 8; i++) {
              particles.push({
                x: f.x,
                y: f.y,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                life: 1,
                color: '#FF4444',
                size: 6
              })
            }
          }
        })
        engine.addScore(bombCount * 10, W / 2, H / 2)
        audioService.win()
        console.log('[道具] 炸弹消除', bombCount, '个水果')
        break
    }
    
    return true
  }

  function spawnFruit() {
    const size = 55
    // 从底部随机位置抛出
    const x = 60 + Math.random() * (W - 120)
    
    // 向上抛物线（极慢速度，超级轻松）
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.2 // 几乎完全垂直
    const speed = 5 + Math.random() * 1.5 // 极低初速度
    
    fruits.push({
      x,
      y: H + size, // 从屏幕底部开始
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.04, // 极低重力，像羽毛一样飘
      size,
      rotation: 0,
      rotSpeed: (Math.random() - 0.5) * 0.05, // 极慢旋转
      emoji: FRUITS[Math.floor(Math.random() * FRUITS.length)],
      sliced: false
    })
  }

  function draw() {
    // 背景
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, W, H)

    // 切割轨迹
    slices.forEach((s, i) => {
      s.life -= 0.06
      if (s.life <= 0) { slices.splice(i, 1); return }
      
      ctx.lineCap = 'round'
      ctx.lineWidth = 14 * s.life
      ctx.strokeStyle = `rgba(255,100,100,${s.life * 0.5})`
      ctx.beginPath()
      ctx.moveTo(s.x1, s.y1)
      ctx.lineTo(s.x2, s.y2)
      ctx.stroke()
      
      ctx.lineWidth = 4 * s.life
      ctx.strokeStyle = `rgba(255,255,255,${s.life})`
      ctx.stroke()
    })

    // 水果
    fruits.forEach(f => {
      if (f.sliced) return
      
      ctx.save()
      ctx.translate(f.x, f.y)
      ctx.rotate(f.rotation)
      ctx.shadowColor = 'rgba(0,0,0,0.4)'
      ctx.shadowBlur = 8
      ctx.shadowOffsetY = 4
      ctx.font = `${f.size}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(f.emoji, 0, 0)
      ctx.restore()
    })

    // 粒子
    particles.forEach((p, i) => {
      p.life -= 0.025
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.3
      
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
    ctx.font = 'bold 38px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(engine.getScore()), W / 2, 55)
    
    // 连击
    if (combo >= 2) {
      ctx.fillStyle = '#FF6B6B'
      ctx.font = 'bold 26px sans-serif'
      ctx.fillText(`${combo} 连击!`, W / 2, 100)
    }

    // 漏掉
    if (missedCount > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.font = 'bold 18px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`漏:${missedCount}`, 15, 50)
    }

    // 时间
    const elapsed = Date.now() - gameStartTime
    const remaining = Math.max(0, GAME_DURATION - elapsed)
    const seconds = Math.ceil(remaining / 1000)
    
    ctx.fillStyle = seconds <= 10 ? '#FF4444' : '#fff'
    ctx.font = 'bold 24px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`${seconds}s`, W - 15, 50)

    // 提示
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '16px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('👆 快速滑动切割水果!', W / 2, H - 25)
  }

  function update() {
    // 磁铁效果
    const isMagnet = (window as any).fruitMagnet && Date.now() < (window as any).fruitMagnet
    if (isMagnet) {
      const centerX = W / 2
      const centerY = H / 2
      fruits.forEach(f => {
        if (!f.sliced) {
          // 向中心吸引
          const dx = centerX - f.x
          const dy = centerY - f.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > 0) {
            f.vx += (dx / dist) * 0.3
            f.vy += (dy / dist) * 0.3
          }
        }
      })
    }
    
    for (let i = fruits.length - 1; i >= 0; i--) {
      const f = fruits[i]
      
      // 应用重力
      f.vy += f.gravity
      
      f.x += f.vx
      f.y += f.vy
      f.rotation += f.rotSpeed
      
      // 左右反弹
      if (f.x < f.size / 2) {
        f.x = f.size / 2
        f.vx = Math.abs(f.vx) * 0.8 // 能量损失
      }
      if (f.x > W - f.size / 2) {
        f.x = W - f.size / 2
        f.vx = -Math.abs(f.vx) * 0.8
      }
      
      // 超出顶部或底部
      if (f.y < -f.size * 2 || f.y > H + f.size * 2) {
        if (!f.sliced) {
          missedCount++
          combo = 0
        }
        fruits.splice(i, 1)
      }
    }

    // 生成（极低频率，配合极慢速度）
    const now = Date.now()
    if (now - lastSpawn > 2200 && fruits.length < 3) { // 增加到2.2秒
      spawnFruit()
      lastSpawn = now
    }
  }

  function checkSlice(x1: number, y1: number, x2: number, y2: number) {
    const sliceLen = Math.hypot(x2 - x1, y2 - y1)
    if (sliceLen < 20) return

    for (let i = fruits.length - 1; i >= 0; i--) {
      const f = fruits[i]
      if (f.sliced) continue

      const dx = x2 - x1
      const dy = y2 - y1
      const fx = f.x - x1
      const fy = f.y - y1
      const t = Math.max(0, Math.min(1, (fx * dx + fy * dy) / (sliceLen * sliceLen || 1)))
      const dist = Math.hypot(f.x - (x1 + t * dx), f.y - (y1 + t * dy))
      
      if (dist < f.size / 2 + 25) {
        f.sliced = true
        combo++
        engine.addScore(10 * combo, f.x, f.y)
        audioService.win()
        
        for (let j = 0; j < 20; j++) {
          particles.push({
            x: f.x,
            y: f.y,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            life: 1,
            color: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF9F43'][Math.floor(Math.random() * 5)],
            size: 5 + Math.random() * 6
          })
        }
        
        if (combo >= 3) engine.triggerRandomBuff()
        
        fruits.splice(i, 1)
      }
    }
  }

  function getPos(e: MouseEvent | TouchEvent) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      }
    }
    const mouseEvent = e as MouseEvent
    return {
      x: (mouseEvent.clientX - rect.left) * scaleX,
      y: (mouseEvent.clientY - rect.top) * scaleY
    }
  }

  canvas.onmousedown = null
  canvas.ontouchstart = null
  canvas.onmousemove = null
  canvas.ontouchmove = null
  canvas.onmouseup = null
  canvas.ontouchend = null
  // 移除 onmouseleave 和 ontouchcancel 的清空，允许滑出边框继续切割
  
  canvas.onmousedown = (e) => {
    e.preventDefault()
    isSlicing = true
    const pos = getPos(e)
    lastX = pos.x
    lastY = pos.y
  }
  
  canvas.ontouchstart = (e) => {
    e.preventDefault()
    isSlicing = true
    const pos = getPos(e)
    lastX = pos.x
    lastY = pos.y
  }

  canvas.onmousemove = (e) => {
    if (!isSlicing) return
    e.preventDefault()
    
    const pos = getPos(e)
    slices.push({ x1: lastX, y1: lastY, x2: pos.x, y2: pos.y, life: 1 })
    checkSlice(lastX, lastY, pos.x, pos.y)
    
    lastX = pos.x
    lastY = pos.y
  }
  
  canvas.ontouchmove = (e) => {
    if (!isSlicing) return
    e.preventDefault()
    
    const pos = getPos(e)
    slices.push({ x1: lastX, y1: lastY, x2: pos.x, y2: pos.y, life: 1 })
    checkSlice(lastX, lastY, pos.x, pos.y)
    
    lastX = pos.x
    lastY = pos.y
  }

  canvas.onmouseup = () => isSlicing = false
  canvas.ontouchend = () => isSlicing = false
  // 不再在 mouseleave 时停止切割
  
  // 添加全局事件监听，即使鼠标滑出Canvas也能继续切割
  const handleGlobalMove = (e: MouseEvent) => {
    if (!isSlicing) return
    
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    const pos = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
    
    slices.push({ x1: lastX, y1: lastY, x2: pos.x, y2: pos.y, life: 1 })
    checkSlice(lastX, lastY, pos.x, pos.y)
    
    lastX = pos.x
    lastY = pos.y
  }
  
  const handleGlobalUp = () => {
    isSlicing = false
  }
  
  document.addEventListener('mousemove', handleGlobalMove)
  document.addEventListener('mouseup', handleGlobalUp)

  function loop() {
    if (!document.getElementById('mainGameCanvas') || gameEnded) return
    
    const now = Date.now()
    if (now - gameStartTime > GAME_DURATION) {
      gameEnded = true
      engine.endGame()
      onEnd()
      return
    }
    
    update()
    draw()
    requestAnimationFrame(loop)
  }

  // 初始化游戏
  engine.start()
  
  // 生成初始水果
  spawnFruit()
  setTimeout(spawnFruit, 400)
  setTimeout(spawnFruit, 800)
  
  // 初始化 HTML 道具栏
  updateHTMLPowerupBar()
  
  // 首次绘制（避免黑屏）
  draw()
  
  // 启动游戏循环
  loop()
}
