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

  const FRUITS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🥝', '🍉', '🍌', '🥭', '🍍']
  const fruits: any[] = []
  const particles: any[] = []
  const slices: any[] = []
  const sliceEffects: any[] = [] // 切割特效
  let combo = 0
  let lastSpawn = Date.now()
  let gameStartTime = Date.now()
  const GAME_DURATION = 60000
  let gameEnded = false
  let missedCount = 0
  let isSlicing = false
  let lastX = 0, lastY = 0
  let scorePopups: any[] = [] // 分数弹出效果
  
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
    const size = 50 + Math.random() * 15
    const x = 50 + Math.random() * (W - 100)
    
    // 向上抛物线（适度速度，更容易切割）
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4
    const speed = 7 + Math.random() * 3
    
    fruits.push({
      x,
      y: H + size,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.06,
      size,
      rotation: 0,
      rotSpeed: (Math.random() - 0.5) * 0.1,
      emoji: FRUITS[Math.floor(Math.random() * FRUITS.length)],
      sliced: false,
      scale: 1,
      alpha: 1
    })
  }

  function draw() {
    // 背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, H)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(0.5, '#16213e')
    gradient.addColorStop(1, '#0f3460')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, W, H)

    // 添加背景装饰线
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    for (let i = 0; i < H; i += 50) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(W, i)
      ctx.stroke()
    }

    // 切割轨迹
    slices.forEach((s, i) => {
      s.life -= 0.04
      if (s.life <= 0) { slices.splice(i, 1); return }
      
      ctx.lineCap = 'round'
      ctx.lineWidth = 18 * s.life
      ctx.strokeStyle = `rgba(255,100,100,${s.life * 0.6})`
      ctx.beginPath()
      ctx.moveTo(s.x1, s.y1)
      ctx.lineTo(s.x2, s.y2)
      ctx.stroke()
      
      ctx.lineWidth = 6 * s.life
      ctx.strokeStyle = `rgba(255,255,255,${s.life * 0.9})`
      ctx.stroke()
      
      // 切割轨迹发光效果
      ctx.shadowColor = `rgba(255,150,150,${s.life})`
      ctx.shadowBlur = 15 * s.life
      ctx.lineWidth = 10 * s.life
      ctx.strokeStyle = `rgba(255,200,200,${s.life * 0.3})`
      ctx.stroke()
      ctx.shadowBlur = 0
    })

    // 水果
    fruits.forEach(f => {
      if (f.sliced && f.alpha <= 0) return
      
      ctx.save()
      ctx.translate(f.x, f.y)
      ctx.rotate(f.rotation)
      ctx.globalAlpha = f.alpha || 1
      ctx.scale(f.scale || 1, f.scale || 1)
      
      // 水果发光效果
      ctx.shadowColor = 'rgba(255,200,100,0.5)'
      ctx.shadowBlur = 12
      ctx.shadowOffsetY = 2
      
      ctx.font = `${f.size}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(f.emoji, 0, 0)
      
      ctx.restore()
    })

    // 粒子
    particles.forEach((p, i) => {
      p.life -= 0.02
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.25
      p.vx *= 0.99
      
      if (p.life <= 0) { particles.splice(i, 1); return }
      
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.shadowColor = p.color
      ctx.shadowBlur = 10 * p.life
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    })

    // 切割特效
    sliceEffects.forEach((e, i) => {
      e.life -= 0.03
      if (e.life <= 0) { sliceEffects.splice(i, 1); return }
      
      ctx.save()
      ctx.globalAlpha = e.life
      ctx.translate(e.x, e.y)
      ctx.rotate(e.rotation + e.life * Math.PI * 2)
      
      const scale = 1 + e.life * 2
      ctx.font = `${e.size * scale}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(e.emoji, 0, 0)
      
      ctx.restore()
    })

    // 分数弹出
    scorePopups.forEach((popup, i) => {
      popup.life -= 0.025
      popup.y -= 1.5
      popup.x += (Math.random() - 0.5) * 2
      
      if (popup.life <= 0) { scorePopups.splice(i, 1); return }
      
      ctx.save()
      ctx.globalAlpha = popup.life
      ctx.fillStyle = popup.color
      ctx.font = `${popup.size}px sans-serif`
      ctx.textAlign = 'center'
      ctx.shadowColor = popup.color
      ctx.shadowBlur = 10
      ctx.fillText(popup.text, popup.x, popup.y)
      ctx.shadowBlur = 0
      ctx.restore()
    })

    // 分数
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 42px sans-serif'
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(255,215,0,0.5)'
    ctx.shadowBlur = 10
    ctx.fillText(String(engine.getScore()), W / 2, 55)
    ctx.shadowBlur = 0
    
    // 连击
    if (combo >= 2) {
      ctx.fillStyle = combo >= 5 ? '#FFD700' : '#FF6B6B'
      ctx.font = `bold ${26 + Math.min(combo, 10) * 2}px sans-serif`
      ctx.shadowColor = combo >= 5 ? 'rgba(255,215,0,0.8)' : 'rgba(255,107,107,0.8)'
      ctx.shadowBlur = 15
      const bounce = Math.sin(Date.now() / 100) * 3
      ctx.fillText(`${combo} 连击!`, W / 2, 100 + bounce)
      ctx.shadowBlur = 0
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
    ctx.font = 'bold 26px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`${seconds}s`, W - 15, 50)

    // 提示
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
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

    // 生成（较高频率，更容易切割）
    const now = Date.now()
    const spawnInterval = Math.max(800, 1500 - combo * 50) // 连击越高生成越快
    if (now - lastSpawn > spawnInterval && fruits.length < 5) {
      spawnFruit()
      lastSpawn = now
      
      // 随机双水果生成
      if (Math.random() < 0.3 + combo * 0.02) {
        setTimeout(spawnFruit, 150)
      }
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
        
        const score = 10 * combo
        engine.addScore(score, f.x, f.y)
        
        // 根据连击数播放不同音效
        if (combo >= 5) {
          audioService.crit()
        } else if (combo >= 3) {
          audioService.sliceCombo(combo)
        } else {
          audioService.slice()
        }
        
        // 增强粒子效果（更多粒子）
        const particleCount = 30 + combo * 5
        for (let j = 0; j < particleCount; j++) {
          const angle = (Math.PI * 2 / particleCount) * j + Math.random() * 0.3
          const speed = 3 + Math.random() * 8
          particles.push({
            x: f.x,
            y: f.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            color: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF9F43', '#FF69B4', '#9932CC'][Math.floor(Math.random() * 7)],
            size: 4 + Math.random() * 8
          })
        }
        
        // 添加水果切开特效（两半飞散）
        sliceEffects.push({
          x: f.x - f.size * 0.3,
          y: f.y,
          emoji: f.emoji,
          size: f.size * 0.6,
          rotation: -0.5,
          life: 0.6,
          vx: -3,
          vy: -2
        })
        sliceEffects.push({
          x: f.x + f.size * 0.3,
          y: f.y,
          emoji: f.emoji,
          size: f.size * 0.6,
          rotation: 0.5,
          life: 0.6,
          vx: 3,
          vy: -2
        })
        
        // 分数弹出效果
        scorePopups.push({
          x: f.x,
          y: f.y,
          text: `+${score}`,
          color: combo >= 5 ? '#FFD700' : combo >= 3 ? '#FF6B6B' : '#6BCB77',
          size: combo >= 5 ? 32 : combo >= 3 ? 28 : 24,
          life: 1
        })
        
        // 高连击时的特殊效果
        if (combo >= 5) {
          // 添加星星特效
          for (let j = 0; j < 8; j++) {
            const angle = (Math.PI * 2 / 8) * j
            sliceEffects.push({
              x: f.x,
              y: f.y,
              emoji: '⭐',
              size: 25,
              rotation: 0,
              life: 0.8,
              vx: Math.cos(angle) * 4,
              vy: Math.sin(angle) * 4
            })
          }
          audioService.combo()
        } else if (combo === 3) {
          audioService.combo()
        }
        
        if (combo >= 3) engine.triggerRandomBuff()
        
        // 延迟移除水果，显示淡出效果
        f.alpha = 0.8
        f.scale = 1.2
        setTimeout(() => {
          const idx = fruits.indexOf(f)
          if (idx !== -1) fruits.splice(idx, 1)
        }, 100)
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
  
      
  // 首次绘制（避免黑屏）
  draw()
  
  // 启动游戏循环
  loop()
}
