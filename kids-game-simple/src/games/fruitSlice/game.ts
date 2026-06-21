import { audioService } from '../../services/audio'
import { app } from '../../services/appBridge'
import { gameActions } from '../../platform/gameBridge'
import type { GameLifecycle } from '../../platform/GameLifecycle'
import type { GameLifecycleContext } from '../../platform/GameLifecycle'
import { createCanvasGameLifecycle } from '../../platform/createCanvasGameLifecycle'
import { hostCanvas2D } from '../../platform/hostCanvas2D'
import { applyCanvasMobileStyles } from '../../utils/canvasMobileUtils'
import { bindGameCanvasControls } from '../../platform/mobileControls'
import type { MobileControlRuntime } from '../../platform/mobileControls'
import { getCachedGTRSTheme } from '../../services/gtrsThemeLoader'
import { resolveGtrsCanvasStyle } from '../../utils/gtrsCanvasTheme'
import { readGtrsSceneList } from '../../utils/gtrsSceneMeta'

function startFruitSliceLifecycle(lifecycleCtx: GameLifecycleContext): GameLifecycle {
  const canvas = lifecycleCtx.canvas!
  const engine = lifecycleCtx.engine
  applyCanvasMobileStyles(canvas)

  const W = 400
  const H = 600
  const ctx = canvas.getContext('2d')!
  if (!ctx) {
    throw new Error('fruitSlice: no 2d context')
  }
  ctx.imageSmoothingEnabled = false

  const FRUIT_FALLBACK = {
    primary: '#FFD700',
    background: '#1a1a2e',
    backgroundDark: '#0f3460',
    bgGradMid: '#16213e',
    text: '#FFFFFF',
    accent: '#FFD700',
    hudBg: 'rgba(0,0,0,0.45)',
    danger: '#FF4444',
    muted: '#666666',
    palette: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF9F43', '#FF69B4', '#9932CC'],
  }
  const gtrs = resolveGtrsCanvasStyle('fruitSlice', FRUIT_FALLBACK)
  const theme = getCachedGTRSTheme('fruitSlice')
  const fruitParticleColors = readGtrsSceneList(theme, 'game_palette') ?? [...gtrs.palette]
  const trapParticleColors = readGtrsSceneList(theme, 'trap_palette') ?? [
    '#FF0000',
    '#FF4400',
    '#FF8800',
    '#FFFF00',
  ]

  const FRUITS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🥝', '🍉', '🍌', '🥭', '🍍']
  const TRAPS = ['💣', '💥'] // 陷阱：炸弹、爆炸
  const fruits: any[] = []
  const particles: any[] = []
  const slices: any[] = []
  const sliceEffects: any[] = [] // 切割特效
  let lastSpawn = Date.now()
  let gameStartTime = Date.now()
  const GAME_DURATION = 60000
  let gameEnded = false
  let missedCount = 0
  let sliceLastX = 0
  let sliceLastY = 0
  let controls: MobileControlRuntime | null = null
  let scorePopups: any[] = [] // 分数弹出效果
  
  // 性能优化 - 对象池
  const particlePool: any[] = []
  const sliceEffectPool: any[] = []
  const scorePopupPool: any[] = []
  const slicePool: any[] = []
  
  // 性能优化 - 背景缓存
  let backgroundCanvas: HTMLCanvasElement | null = null
  let backgroundCtx: CanvasRenderingContext2D | null = null
  
  // 性能优化 - 帧率监控
  let frameCount = 0
  let lastFpsUpdate = Date.now()
  let currentFps = 60
  
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
  
  // ====== 对象池函数 ======
  function getParticle(): any {
    if (particlePool.length > 0) {
      return particlePool.pop()
    }
    return {}
  }

  function getSliceEffect(): any {
    if (sliceEffectPool.length > 0) {
      return sliceEffectPool.pop()
    }
    return {}
  }

  function getScorePopup(): any {
    if (scorePopupPool.length > 0) {
      return scorePopupPool.pop()
    }
    return {}
  }

  function getSlice(): any {
    if (slicePool.length > 0) {
      return slicePool.pop()
    }
    return {}
  }

  // 使用道具
  function usePowerup(type: string): boolean {
    const index = inventory.indexOf(type)
    if (index === -1) return false
    
    inventory.splice(index, 1)
    
    switch (type) {
      case 'slow':
        // 减速 - 所有水果速度减半，持续8秒
        fruits.forEach(f => {
          f.vx *= 0.5
          f.vy *= 0.5
          f.gravity *= 0.3
        })
        audioService.win()
        
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
        break
        
      case 'double':
        // 双倍分数 - 10秒内分数翻倍
        ;(window as any).fruitDoubleScore = Date.now() + 10000
        audioService.win()
        break
        
      case 'bomb':
        // 炸弹 - 消除屏幕上所有水果
        let bombCount = 0
        fruits.forEach(f => {
          if (!f.sliced) {
            f.sliced = true
            bombCount++
            // 创建爆炸粒子 - 使用对象池，限制数量
            const maxBombParticles = Math.min(8, 100 - particles.length)
            for (let i = 0; i < maxBombParticles; i++) {
              const p = getParticle()
              p.x = f.x
              p.y = f.y
              p.vx = (Math.random() - 0.5) * 12
              p.vy = (Math.random() - 0.5) * 12
              p.life = 1
              p.color = gtrs.danger
              p.size = 6
              particles.push(p)
            }
          }
        })
        gameActions.addScore(bombCount * 10, W / 2, H / 2)
        audioService.win()
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
    
    // 20%概率生成陷阱水果
    const isTrap = Math.random() < 0.2
    const emoji = isTrap 
      ? TRAPS[Math.floor(Math.random() * TRAPS.length)]
      : FRUITS[Math.floor(Math.random() * FRUITS.length)]
    
    fruits.push({
      x,
      y: H + size,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.06,
      size,
      rotation: 0,
      rotSpeed: (Math.random() - 0.5) * 0.1,
      emoji,
      sliced: false,
      scale: 1,
      alpha: 1,
      isTrap // 标记是否为陷阱
    })
  }

  // 性能优化 - 绘制缓存背景
  function drawBackground() {
    if (!backgroundCanvas) {
      backgroundCanvas = document.createElement('canvas')
      backgroundCanvas.width = W
      backgroundCanvas.height = H
      backgroundCtx = backgroundCanvas.getContext('2d')!
      
      // 绘制背景到缓存
      const gradient = backgroundCtx.createLinearGradient(0, 0, 0, H)
      gradient.addColorStop(0, gtrs.background)
      gradient.addColorStop(0.5, gtrs.bgGradMid ?? gtrs.backgroundDark)
      gradient.addColorStop(1, gtrs.backgroundDark)
      backgroundCtx.fillStyle = gradient
      backgroundCtx.fillRect(0, 0, W, H)
      
      // 添加背景装饰线
      backgroundCtx.strokeStyle = 'rgba(255,255,255,0.05)'
      backgroundCtx.lineWidth = 1
      for (let i = 0; i < H; i += 50) {
        backgroundCtx.beginPath()
        backgroundCtx.moveTo(0, i)
        backgroundCtx.lineTo(W, i)
        backgroundCtx.stroke()
      }
    }
    ctx.drawImage(backgroundCanvas, 0, 0)
  }

  function draw() {
    // 绘制缓存背景
    drawBackground()

    // 切割轨迹 - 反向遍历避免索引问题
    for (let i = slices.length - 1; i >= 0; i--) {
      const s = slices[i]
      s.life -= 0.04
      if (s.life <= 0) {
        slicePool.push(slices.splice(i, 1)[0])
        continue
      }
      
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
      
      // 减少阴影效果仅在高帧率时启用
      if (currentFps > 45) {
        ctx.shadowColor = `rgba(255,150,150,${s.life})`
        ctx.shadowBlur = 15 * s.life
        ctx.lineWidth = 10 * s.life
        ctx.strokeStyle = `rgba(255,200,200,${s.life * 0.3})`
        ctx.stroke()
        ctx.shadowBlur = 0
      }
    }

    // 水果
    for (let i = 0; i < fruits.length; i++) {
      const f = fruits[i]
      if (f.sliced && f.alpha <= 0) continue
      
      ctx.save()
      ctx.translate(f.x, f.y)
      ctx.rotate(f.rotation)
      ctx.globalAlpha = f.alpha || 1
      ctx.scale(f.scale || 1, f.scale || 1)
      
      // 陷阱水果有特殊的红色警告发光效果
      if (f.isTrap) {
        ctx.shadowColor = gtrs.danger
        ctx.shadowBlur = 25
        ctx.shadowOffsetY = 3
      } else {
        // 普通水果的发光效果
        ctx.shadowColor = 'rgba(255,220,100,0.8)'
        ctx.shadowBlur = 15
        ctx.shadowOffsetY = 2
      }
      
      ctx.font = `${f.size}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(f.emoji, 0, 0)
      
      ctx.restore()
    }

    // 粒子 - 反向遍历避免索引问题
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.life -= 0.02
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.25
      p.vx *= 0.99
      
      if (p.life <= 0) {
        particlePool.push(particles.splice(i, 1)[0])
        continue
      }
      
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      // 减少粒子阴影
      if (currentFps > 45) {
        ctx.shadowColor = p.color
        ctx.shadowBlur = 5 * p.life
      }
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    }

    // 切割特效 - 反向遍历避免索引问题
    for (let i = sliceEffects.length - 1; i >= 0; i--) {
      const e = sliceEffects[i]
      e.life -= 0.03
      if (e.life <= 0) {
        sliceEffectPool.push(sliceEffects.splice(i, 1)[0])
        continue
      }
      
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
    }

    // 分数弹出 - 反向遍历避免索引问题
    for (let i = scorePopups.length - 1; i >= 0; i--) {
      const popup = scorePopups[i]
      popup.life -= 0.025
      popup.y -= 1.5
      popup.x += (Math.random() - 0.5) * 2
      
      if (popup.life <= 0) {
        scorePopupPool.push(scorePopups.splice(i, 1)[0])
        continue
      }
      
      ctx.save()
      ctx.globalAlpha = popup.life
      ctx.fillStyle = popup.color
      ctx.font = `${popup.size}px sans-serif`
      ctx.textAlign = 'center'
      if (currentFps > 45) {
        ctx.shadowColor = popup.color
        ctx.shadowBlur = 6
      }
      ctx.fillText(popup.text, popup.x, popup.y)
      ctx.shadowBlur = 0
      ctx.restore()
    }

    const elapsedHud = Date.now() - gameStartTime
    const remainingHud = Math.max(0, GAME_DURATION - elapsedHud)
    const secondsHud = Math.ceil(remainingHud / 1000)
    ctx.fillStyle = gtrs.hudBg
    ctx.beginPath()
    ctx.roundRect(10, 8, W - 20, 40, 10)
    ctx.fill()
    ctx.fillStyle = secondsHud <= 10 ? gtrs.danger : gtrs.accent
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const missLabel = missedCount > 0 ? ` · 漏切 ${missedCount}` : ''
    ctx.fillText(`⏱ 剩余 ${secondsHud} 秒${missLabel}`, W / 2, 28)

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
          engine.breakCombo()
        }
        fruits.splice(i, 1)
      }
    }

    // 生成（较高频率，更容易切割）
    const now = Date.now()
    const streakSpawn = engine.getCombo()
    const spawnInterval = Math.max(800, 1500 - streakSpawn * 50)
    if (now - lastSpawn > spawnInterval && fruits.length < 5) {
      spawnFruit()
      lastSpawn = now
      
      if (Math.random() < 0.3 + streakSpawn * 0.02) {
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
        
        // 检查是不是陷阱！
        if (f.isTrap) {
          engine.breakCombo()
          gameActions.addScore(-50, f.x, f.y)
          
          // 爆炸粒子特效
          for (let j = 0; j < 40; j++) {
            const p = getParticle()
            p.x = f.x
            p.y = f.y
            const angle = Math.random() * Math.PI * 2
            const speed = 3 + Math.random() * 10
            p.vx = Math.cos(angle) * speed
            p.vy = Math.sin(angle) * speed
            p.life = 1
            p.color = trapParticleColors[Math.floor(Math.random() * trapParticleColors.length)]!
            p.size = 5 + Math.random() * 10
            particles.push(p)
          }
          
          audioService.crit() // 播放暴击音效
          
          // 显示陷阱惩罚提示
          const popup = getScorePopup()
          popup.x = f.x
          popup.y = f.y
          popup.text = '-50 陷阱!'
          popup.color = gtrs.danger
          popup.size = 30
          popup.life = 1
          scorePopups.push(popup)
          
        } else {
          const streak = engine.getCombo() + 1
          const earned = engine.addScore(10, f.x, f.y)
          
          if (streak >= 5) {
            audioService.crit()
          } else if (streak >= 3) {
            audioService.sliceCombo(streak)
          } else {
            audioService.slice()
          }
          
          // 优化粒子效果（限制数量，使用对象池）
          const maxParticles = Math.min(20 + streak * 3, 150 - particles.length)
          const particleCount = Math.max(8, maxParticles)
          for (let j = 0; j < particleCount; j++) {
            const angle = (Math.PI * 2 / particleCount) * j + Math.random() * 0.3
            const speed = 3 + Math.random() * 8
            const p = getParticle()
            p.x = f.x
            p.y = f.y
            p.vx = Math.cos(angle) * speed
            p.vy = Math.sin(angle) * speed
            p.life = 1
            p.color = fruitParticleColors[Math.floor(Math.random() * fruitParticleColors.length)]!
            p.size = 4 + Math.random() * 8
            particles.push(p)
          }
          
          // 添加水果切开特效（两半飞散）- 使用对象池
          const se1 = getSliceEffect()
          se1.x = f.x - f.size * 0.3
          se1.y = f.y
          se1.emoji = f.emoji
          se1.size = f.size * 0.6
          se1.rotation = -0.5
          se1.life = 0.6
          se1.vx = -3
          se1.vy = -2
          sliceEffects.push(se1)
          
          const se2 = getSliceEffect()
          se2.x = f.x + f.size * 0.3
          se2.y = f.y
          se2.emoji = f.emoji
          se2.size = f.size * 0.6
          se2.rotation = 0.5
          se2.life = 0.6
          se2.vx = 3
          se2.vy = -2
          sliceEffects.push(se2)
          
          // 分数弹出效果 - 使用对象池
          const popup = getScorePopup()
          popup.x = f.x
          popup.y = f.y
          popup.text = `+${earned}`
          popup.color =
            streak >= 5 ? gtrs.accent : streak >= 3 ? (fruitParticleColors[0] ?? gtrs.danger) : gtrs.primary
          popup.size = streak >= 5 ? 32 : streak >= 3 ? 28 : 24
          popup.life = 1
          scorePopups.push(popup)
          
          // 高连击时的特殊效果 - 限制星星数量
          if (streak >= 5) {
            // 添加星星特效，最多4个
            const starCount = Math.min(4, 50 - sliceEffects.length)
            for (let j = 0; j < starCount; j++) {
              const angle = (Math.PI * 2 / starCount) * j
              const se = getSliceEffect()
              se.x = f.x
              se.y = f.y
              se.emoji = '⭐'
              se.size = 25
              se.rotation = 0
              se.life = 0.8
              se.vx = Math.cos(angle) * 4
              se.vy = Math.sin(angle) * 4
              sliceEffects.push(se)
            }
            audioService.combo()
          } else if (streak === 3) {
            audioService.combo()
          }
          
          if (streak >= 3) engine.triggerRandomBuff()
          
          // 切水果时有概率获得道具
          if (Math.random() < 0.15) { // 15%概率获得道具
            const powerupTypes = ['bomb', 'slow', 'magnet', 'double']
            const randomPowerup = powerupTypes[Math.floor(Math.random() * powerupTypes.length)]
            inventory.push(randomPowerup)
            updateHTMLPowerupBar()
          }
        }
        
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

  function pushSliceSegment(x1: number, y1: number, x2: number, y2: number) {
    const s = getSlice()
    s.x1 = x1
    s.y1 = y1
    s.x2 = x2
    s.y2 = y2
    s.life = 1
    slices.push(s)
    checkSlice(x1, y1, x2, y2)
  }

  // 性能优化 - 游戏结束时清理资源
  function cleanup() {
    controls?.dispose()
    controls = null
    fruits.length = 0
    particles.length = 0
    slices.length = 0
    sliceEffects.length = 0
    scorePopups.length = 0
  }

  return hostCanvas2D(lifecycleCtx, {
    onInit() {
      gameStartTime = Date.now()
      inventory = ['bomb', 'slow', 'double']
      updateHTMLPowerupBar()
      controls = bindGameCanvasControls(canvas, {
        gameId: 'fruitSlice',
        trackOutsideCanvas: true,
        viewWidth: W,
        viewHeight: H,
        layout: { viewWidth: W, viewHeight: H, buttons: [] },
        onAction: (action, payload) => {
          if (gameEnded) return
          const x = payload.x ?? 0
          const y = payload.y ?? 0
          if (action === 'tap') {
            sliceLastX = x
            sliceLastY = y
            return
          }
          if (action === 'swipe') {
            const dx = payload.dx ?? 0
            const dy = payload.dy ?? 0
            if (dx === 0 && dy === 0) return
            pushSliceSegment(sliceLastX, sliceLastY, x, y)
            sliceLastX = x
            sliceLastY = y
          }
        },
      })
      spawnFruit()
      setTimeout(spawnFruit, 400)
      setTimeout(spawnFruit, 800)
      draw()
    },
    onUpdate(_dt) {
      if (gameEnded) return
      frameCount++
      const now = Date.now()
      if (now - lastFpsUpdate >= 1000) {
        currentFps = frameCount
        frameCount = 0
        lastFpsUpdate = now
      }
      if (now - gameStartTime > GAME_DURATION) {
        cleanup()
        gameEnded = true
        gameActions.gameOver({ victory: missedCount < 5, score: engine.getScore() })
        return
      }
      update()
    },
    onRender() {
      draw()
    },
    onDestroy() {
      cleanup()
      app.removePowerupBar?.()
    },
  })
}

const lifecycle = createCanvasGameLifecycle('fruitSlice', startFruitSliceLifecycle)

export const initFruitSlice = lifecycle.init
export const destroyFruitSlice = lifecycle.destroy
