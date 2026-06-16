import type { GameEngine } from '../../services/gameEngine'
import { audioService } from '../../services/audio'
import { GAME_ITEMS, ITEM_UNLOCK_TIMES, ITEM_SPAWN_WEIGHTS } from '../../data/items'
import { app } from '../../services/appBridge'
import { gameActions } from '../../platform/gameBridge'
import type { GameLifecycle } from '../../platform/GameLifecycle'
import type { GameLifecycleContext } from '../../platform/GameLifecycle'
import { createCanvasGameLifecycle } from '../../platform/createCanvasGameLifecycle'
import { hostCanvas2D } from '../../platform/hostCanvas2D'
import { applyCanvasMobileStyles, bindCanvasPointerInput } from '../../utils/canvasMobileUtils'
import { resolveGtrsCanvasStyle } from '../../utils/gtrsCanvasTheme'

export function startPopLifecycle(lifecycleCtx: GameLifecycleContext): GameLifecycle {
  const canvas = lifecycleCtx.canvas!
  const engine = lifecycleCtx.engine
  const W = 400
  const H = 600
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  const BALLOONS: any[] = []
  const PARTICLES: any[] = [] // 爆炸粒子
  const POP_FALLBACK = {
    background: '#FFF8E7',
    backgroundDark: '#FFE4B5',
    text: '#333333',
    accent: '#FFD93D',
    hudBg: 'rgba(0,0,0,0.35)',
    danger: '#FF6B6B',
    muted: '#999999',
    palette: ['#FF6B6B', '#4ECDC4', '#FFD93D', '#FF69B4', '#9B59B6', '#FF8E53', '#6BCB77'],
  }
  let gtrs = resolveGtrsCanvasStyle('pop', { ...POP_FALLBACK, primary: '#4ECDC4' })
  let balloonColors = [...gtrs.palette]
  let lastActionTime = Date.now() // 记录最后一次操作时间
  const INACTIVITY_TIMEOUT = 12000 // 12秒无操作判定失败
  let gameStartTime = Date.now() // 游戏开始时间
  let unlockedItems: string[] = [] // 已解锁的道具列表
  let itemCharge: Record<string, number> = {} // 道具数量
  
  // ====== HTML道具栏（库存模式）======
  let inventory: string[] = [] // 道具库存
  
  // 道具图标映射
  const powerupIcons: Record<string, string> = {
    'bomb': '💣',         // 炸弹 - 消除所有气球
    'time_plus': '⏰',    // 加时 - 增加时间
    'double_score': '✨', // 双倍分数 - 10秒内×2
    'slow': '🐌'          // 减速 - 气球速度减半
  }
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id
    }))
    
    app.setupCustomPowerupBar('pop', powerups, inventory, (powerupId) => {
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
    
    switch (type) {
      case 'bomb':
        // 炸弹 - 消除所有气球
        BALLOONS.forEach(b => {
          for (let j = 0; j < 10; j++) {
            PARTICLES.push({
              x: b.x,
              y: b.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              life: 1,
              color: b.color,
              size: 3 + Math.random() * 3
            })
          }
        })
        const n = BALLOONS.length
        gameActions.addScore(n * 10, W / 2, H / 2, 'pop')
        BALLOONS.length = 0
        audioService.win()
        break
        
      case 'time_plus':
        // 加时 - 重置无操作计时器
        lastActionTime = Date.now()
        audioService.win()
        break
        
      case 'double_score':
        // 双倍分数 - 10秒内×2
        ;(window as any).popDoubleScore = Date.now() + 10000
        audioService.win()
        break
        
      case 'slow':
        // 减速 - 气球速度减半，持续8秒
        ;(window as any).popSlow = Date.now() + 8000
        audioService.collect()
        break
    }
    
    return true
  }

  function spawn() {
    const now = Date.now()
    const elapsed = now - gameStartTime
    
    // 更新已解锁道具列表
    unlockedItems = GAME_ITEMS.filter(item => ITEM_UNLOCK_TIMES[item.id as keyof typeof ITEM_UNLOCK_TIMES] <= elapsed).map(item => item.id)
    
    let item: string | null = null
    
    // 20%概率生成带道具的气球
    if (unlockedItems.length > 0 && Math.random() < 0.20) {
      // 根据权重随机选择道具
      let totalWeight = 0
      unlockedItems.forEach(itemId => {
        totalWeight += ITEM_SPAWN_WEIGHTS[itemId as keyof typeof ITEM_SPAWN_WEIGHTS] || 10
      })
      
      if (totalWeight > 0) {
        let random = Math.random() * totalWeight
        let selectedItem = unlockedItems[0]
        
        for (const itemId of unlockedItems) {
          const weight = ITEM_SPAWN_WEIGHTS[itemId as keyof typeof ITEM_SPAWN_WEIGHTS] || 10
          random -= weight
          if (random <= 0) {
            selectedItem = itemId
            break
          }
        }
        
        item = selectedItem
      }
    }
    
    BALLOONS.push({
      x: Math.random() * (W - 60) + 30,
      y: H + 30,
      r: 18 + Math.random() * 14,
      color: balloonColors[Math.floor(Math.random() * balloonColors.length)],
      speed: 0.8 + Math.random() * 1.2, // 降低速度：0.8-2.0
      wobble: Math.random() * Math.PI * 2,
      wobbleSpd: 0.02 + Math.random() * 0.02,
      item: item // 道具类型，null表示没有道具
    })
  }

  function draw() {
    // 渐变背景
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, gtrs.background)
    grad.addColorStop(1, gtrs.backgroundDark)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // 计算剩余时间
    const now = Date.now()
    const remaining = Math.max(0, INACTIVITY_TIMEOUT - (now - lastActionTime))
    const seconds = Math.ceil(remaining / 1000)
    
    // 绘制倒计时背景条
    const barWidth = (remaining / INACTIVITY_TIMEOUT) * (W - 40)
    const barColor =
      remaining < 4000 ? gtrs.danger : remaining < 8000 ? gtrs.accent : gtrs.primary
    
    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    ctx.fillRect(20, 8, W - 40, 6)
    
    ctx.fillStyle = barColor
    ctx.fillRect(20, 8, barWidth, 6)
    
    if (seconds <= 3 && Math.floor(now / 150) % 2 === 0) {
      ctx.fillStyle = `${gtrs.danger}1f`
      ctx.fillRect(0, 0, W, H)
    }

    ctx.fillStyle = gtrs.hudBg
    ctx.beginPath()
    ctx.roundRect(10, 18, W - 20, 34, 10)
    ctx.fill()
    ctx.fillStyle = seconds <= 8 ? gtrs.danger : gtrs.text
    ctx.font = 'bold 15px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const comboLabel = engine.getCombo() >= 3 ? ` · 🔥${engine.getCombo()}连击` : ''
    ctx.fillText(`⏱ 无操作 ${seconds} 秒${comboLabel}`, W / 2, 35)

    // 绘制气球（带摆动和光泽效果）
    BALLOONS.forEach(b => {
      const wx = Math.sin(b.wobble) * 5
      
      // 绳子
      ctx.strokeStyle = gtrs.muted
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(b.x + wx, b.y + b.r)
      ctx.quadraticCurveTo(
        b.x + wx + Math.sin(b.wobble * 2) * 5,
        b.y + b.r + 10,
        b.x + wx,
        b.y + b.r + 15 + b.r * 0.5
      )
      ctx.stroke()
      
      // 气球主体渐变
      const balloonGrad = ctx.createRadialGradient(
        b.x + wx - b.r * 0.3,
        b.y - b.r * 0.3,
        b.r * 0.1,
        b.x + wx,
        b.y,
        b.r
      )
      balloonGrad.addColorStop(0, '#fff')
      balloonGrad.addColorStop(0.3, b.color)
      balloonGrad.addColorStop(1, b.color)
      
      ctx.fillStyle = balloonGrad
      ctx.shadowBlur = 10
      ctx.shadowColor = b.color
      ctx.beginPath()
      ctx.arc(b.x + wx, b.y, b.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      
      // 高光
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.beginPath()
      ctx.ellipse(b.x + wx - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.25, b.r * 0.15, -Math.PI / 4, 0, Math.PI * 2)
      ctx.fill()
      
      // 底部小三角
      ctx.fillStyle = b.color
      ctx.beginPath()
      ctx.moveTo(b.x + wx - 5, b.y + b.r - 2)
      ctx.lineTo(b.x + wx + 5, b.y + b.r - 2)
      ctx.lineTo(b.x + wx, b.y + b.r + 5)
      ctx.closePath()
      ctx.fill()
      
      // 如果气球有道具，显示道具图标
      if (b.item) {
        const itemData = GAME_ITEMS.find(item => item.id === b.item)
        if (itemData) {
          ctx.font = `${Math.floor(b.r * 1.3)}px sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.shadowBlur = 5
          ctx.shadowColor = 'rgba(0,0,0,0.5)'
          ctx.fillText(itemData.icon, b.x + wx, b.y)
          ctx.shadowBlur = 0
        }
      }
    })

    // 绘制粒子效果
    PARTICLES.forEach((p, i) => {
      p.life -= 0.02
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.15
      
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
  }

  function handleTapAt(mx: number, my: number) {
    lastActionTime = Date.now()
    for (let i = BALLOONS.length - 1; i >= 0; i--) {
      const b = BALLOONS[i]
      if (Math.hypot(mx - b.x - Math.sin(b.wobble) * 5, my - b.y) < b.r + 5) {
        gameActions.addScore(10 + Math.round(b.r), b.x, b.y, 'pop')
        if (engine.getCombo() >= 2) engine.triggerRandomBuff()

        if (b.item) {
          itemCharge[b.item] = (itemCharge[b.item] || 0) + 1
          const itemData = GAME_ITEMS.find(item => item.id === b.item)
          if (itemData) {
            for (let j = 0; j < 10; j++) {
              PARTICLES.push({
                x: b.x,
                y: b.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 3,
                life: 1,
                color: gtrs.accent,
                size: 3 + Math.random() * 3,
              })
            }
          }
          updateItemBar()
          audioService.buff()
        }

        for (let j = 0; j < 15; j++) {
          PARTICLES.push({
            x: b.x,
            y: b.y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1,
            color: b.color,
            size: 2 + Math.random() * 4,
          })
        }

        BALLOONS.splice(i, 1)
        audioService.pop()
        break
      }
    }
  }

  // 更新道具栏显示
  function updateItemBar() {
    const items = ['bomb', 'line_h', 'line_v', 'color_bomb', 'hammer', 'shuffle', 'rainbow', 'freeze', 'magnet', 'mega_bomb', 'time_plus', 'double_score']
    items.forEach(itemId => {
      const countEl = document.getElementById(`itemCount_${itemId}`)
      if (countEl) {
        const count = itemCharge[itemId] || 0
        countEl.textContent = String(count)
        
        const slot = countEl.parentElement
        if (slot) {
          if (count > 0) {
            slot.style.borderColor = '#FFD93D'
            slot.style.boxShadow = '0 0 15px rgba(255,217,61,0.5)'
          } else {
            slot.style.borderColor = 'rgba(255,255,255,0.2)'
            slot.style.boxShadow = 'none'
          }
        }
      }
    })
  }
  
  function applyUseGameItem(itemId: string) {
    if (!itemCharge[itemId] || itemCharge[itemId] <= 0) {
      return
    }
    
    // 气球游戏中，道具效果简化为立即生效
    switch (itemId) {
      case 'bomb':
      case 'mega_bomb':
        // 消除屏幕上所有气球
        BALLOONS.forEach(b => {
          for (let j = 0; j < 10; j++) {
            PARTICLES.push({
              x: b.x,
              y: b.y,
              vx: (Math.random() - 0.5) * 12,
              vy: (Math.random() - 0.5) * 12,
              life: 1,
              color: b.color,
              size: 3 + Math.random() * 4
            })
          }
          gameActions.addScore(15, b.x, b.y, 'pop')
        })
        BALLOONS.length = 0
        audioService.win()
        break
      case 'freeze':
      case 'time_plus':
        lastActionTime = Date.now() - (INACTIVITY_TIMEOUT - 10000)
        break
      case 'double_score':
        // 下次得分翻倍（简单实现：立即给分）
        gameActions.addScore(50, W / 2, H / 2, 'pop')
        break
    }
    
    itemCharge[itemId]--
    updateItemBar()
  }

  let unbindPointer: (() => void) | null = null
  let lastSpawnMs = 0

  return hostCanvas2D(lifecycleCtx, {
    onInit() {
      applyCanvasMobileStyles(canvas)
      updateHTMLPowerupBar()
      lastSpawnMs = performance.now()
      unbindPointer = bindCanvasPointerInput(canvas, (x, y) => {
        handleTapAt(x, y)
      })
      ;(window as unknown as { useGameItem?: (id: string) => void }).useGameItem = applyUseGameItem
    },
    onUpdate(_dt) {
      const now = Date.now()
      if (now - lastActionTime > INACTIVITY_TIMEOUT) {
        unbindPointer?.()
        unbindPointer = null
        audioService.lose()
        gameActions.gameOver({ victory: false, score: engine.getScore() })
        return
      }
      const ts = performance.now()
      if (ts - lastSpawnMs > 1200) {
        spawn()
        lastSpawnMs = ts
      }
      BALLOONS.forEach(b => {
        b.y -= b.speed
        b.wobble += b.wobbleSpd
      })
    },
    onRender() {
      draw()
    },
    onDestroy() {
      unbindPointer?.()
      unbindPointer = null
      delete (window as unknown as { useGameItem?: unknown }).useGameItem
      app.removePowerupBar?.()
    },
  })
}

const lifecycle = createCanvasGameLifecycle('pop', startPopLifecycle)

export const initPop = lifecycle.init
export const destroyPop = lifecycle.destroy
