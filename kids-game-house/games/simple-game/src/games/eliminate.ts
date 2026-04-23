import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { storageService } from '../services/storage'
import { GAME_ITEMS, ITEM_UNLOCK_TIMES, ITEM_SPAWN_WEIGHTS } from '../data/items'
import { app } from '../App'

export function initEliminate(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  const W = 400, H = 600
  const GRID = 8, COLS = 6
  const CELL = (W - 40) / COLS, TOP = 80
  const COLORS = ['#FF6B6B', '#FF8E53', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6']
  const BLOCKS: any[] = []
  const PARTICLES: any[] = [] // 粒子效果数组
  let lastActionTime = Date.now() // 记录最后一次操作时间
  const INACTIVITY_TIMEOUT = 15000 // 15秒无操作判定失败
  let screenShake = 0 // 屏幕震动强度
  let comboTexts: any[] = [] // 连击文字特效
  let activeItem: string | null = null // 当前激活的道具
  let itemCharge: Record<string, number> = {} // 道具数量（累积型）
  let gameStartTime = Date.now() // 游戏开始时间
  let unlockedItems: string[] = [] // 已解锁的道具列表
  let doubleScoreActive = false // 双倍分数是否激活
  
  // ====== HTML道具栏（库存模式）======
  let inventory: string[] = [] // 道具库存
  
  // 道具图标映射
  const powerupIcons: Record<string, string> = {
    'bomb': '💣',         // 炸弹 - 消除3x3区域
    'shuffle': '🔀',      // 重排 - 重新排列所有方块
    'hammer': '🔨',       // 锤子 - 消除单个方块
    'freeze': '❄️'        // 冻结 - 暂停计时10秒
  }
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id
    }))
    
    app.setupCustomPowerupBar('eliminate', powerups, inventory, (powerupId) => {
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
      case 'bomb':
        // 炸弹 - 消除3x3区域
        ;(window as any).eliminateBomb = true
        audioService.win()
        console.log('[道具] 炸弹已准备')
        break
        
      case 'shuffle':
        // 重排 - 重新排列所有方块
        ;(window as any).eliminateShuffle = true
        audioService.collect()
        console.log('[道具] 重排已准备')
        break
        
      case 'hammer':
        // 锤子 - 消除单个方块
        ;(window as any).eliminateHammer = true
        audioService.win()
        console.log('[道具] 锤子已准备')
        break
        
      case 'freeze':
        // 冻结 - 暂停计时10秒
        lastActionTime = Date.now() + 10000
        audioService.win()
        console.log('[道具] 冻结生效，增加10秒')
        break
    }
    
    return true
  }

  function initBlocks() {
    BLOCKS.length = 0
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < COLS; c++) {
        BLOCKS.push({
          r, c,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          scale: 1,
          alpha: 1,
          exploding: false,
          rainbow: false,
          item: null // 道具类型
        })
      }
    }
    
    // 随机在一些方块上放置道具
    spawnItemBlocks()
  }
  
  // 生成带道具的方块
  function spawnItemBlocks() {
    const now = Date.now()
    const elapsed = now - gameStartTime
    
    // 更新已解锁道具列表
    unlockedItems = GAME_ITEMS.filter(item => ITEM_UNLOCK_TIMES[item.id as keyof typeof ITEM_UNLOCK_TIMES] <= elapsed).map(item => item.id)
    
    if (unlockedItems.length === 0) return
    
    // 计算总权重
    let totalWeight = 0
    unlockedItems.forEach(itemId => {
      totalWeight += ITEM_SPAWN_WEIGHTS[itemId as keyof typeof ITEM_SPAWN_WEIGHTS] || 10
    })
    
    if (totalWeight === 0) return
    
    // 为每个方块有20%概率生成道具
    BLOCKS.forEach((block) => {
      if (!block || block.item) return
      
      if (Math.random() < 0.20) {
        // 根据权重随机选择道具
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
        
        block.item = selectedItem
      }
    })
  }

  function draw() {
    ctx.save()
    
    // 屏幕震动效果
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake
      const shakeY = (Math.random() - 0.5) * screenShake
      ctx.translate(shakeX, shakeY)
      screenShake *= 0.9 // 震动衰减
      if (screenShake < 0.5) screenShake = 0
    }
    
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(-10, -10, W + 20, H + 20) // 稍微扩大背景避免震动露边

    // 计算剩余时间
    const now = Date.now()
    const remaining = Math.max(0, INACTIVITY_TIMEOUT - (now - lastActionTime))
    const seconds = Math.ceil(remaining / 1000)
    
    // 绘制倒计时背景条
    const barWidth = (remaining / INACTIVITY_TIMEOUT) * (W - 40)
    const barColor = remaining < 5000 ? '#FF6B6B' : remaining < 10000 ? '#FFD93D' : '#4ECDC4'
    
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.fillRect(20, 8, W - 40, 6)
    
    ctx.fillStyle = barColor
    ctx.fillRect(20, 8, barWidth, 6)
    
    // 绘制倒计时数字
    if (seconds <= 10) {
      ctx.fillStyle = seconds <= 3 ? '#FF6B6B' : '#FFD93D'
      ctx.font = 'bold 20px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`⏱️ ${seconds}s`, W - 20, 35)
      
      // 最后3秒闪烁效果
      if (seconds <= 3 && Math.floor(now / 200) % 2 === 0) {
        ctx.fillStyle = 'rgba(255,107,107,0.1)'
        ctx.fillRect(0, 0, W, H)
      }
    }

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(engine.getScore()), W / 2, 45)
    ctx.font = '13px sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fillText('极速消除', W / 2, 65)

    if (engine.getCombo() >= 3) {
      ctx.fillStyle = '#FFD93D'
      ctx.font = 'bold 16px sans-serif'
      ctx.fillText(`🔥 ${engine.getCombo()} 连击`, W / 2, 72)
    }

    // 绘制方块（带动画）
    BLOCKS.forEach((b, i) => {
      if (!b) return
      const x = 20 + b.c * CELL + CELL / 2
      const y = TOP + b.r * CELL + CELL / 2
      const size = CELL * 0.4 * b.scale
      ctx.globalAlpha = b.alpha

      if (b.rainbow) {
        const grad = ctx.createLinearGradient(x - size, y - size, x + size, y + size)
        COLORS.forEach((c, idx) => grad.addColorStop(idx / COLORS.length, c))
        ctx.fillStyle = grad
      } else {
        ctx.fillStyle = b.color
      }

      ctx.beginPath()
      ctx.roundRect(x - size, y - size, size * 2, size * 2, 6)
      ctx.fill()
      
      // 添加高光效果
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.beginPath()
      ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.3, 0, Math.PI * 2)
      ctx.fill()
      
      // 如果方块有道具，显示道具图标
      if (b.item) {
        const itemData = GAME_ITEMS.find(item => item.id === b.item)
        if (itemData) {
          ctx.font = `${Math.floor(size * 1.2)}px sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(itemData.icon, x, y)
        }
      }
      
      ctx.globalAlpha = 1
    })

    // 绘制粒子效果
    PARTICLES.forEach((p, i) => {
      p.life -= p.size > 10 ? 0.03 : 0.02 // 大光晕消失更快
      p.x += p.vx
      p.y += p.vy
      p.vy += p.size > 10 ? 0.05 : 0.2 // 重力效果
      p.vx *= 0.98 // 空气阻力
      
      if (p.life <= 0) {
        PARTICLES.splice(i, 1)
        return
      }
      
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      
      // 大光晕使用半透明效果
      if (p.size > 10) {
        ctx.globalAlpha = p.life * 0.4
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        ctx.fill()
      } else {
        // 普通粒子
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        ctx.fill()
      }
      
      ctx.globalAlpha = 1
    })
    
    // 绘制连击文字特效
    comboTexts.forEach((ct, i) => {
      ct.life -= 0.02
      ct.y -= 1.5
      ct.scale += 0.02
      
      if (ct.life <= 0) {
        comboTexts.splice(i, 1)
        return
      }
      
      ctx.save()
      ctx.globalAlpha = ct.life
      ctx.translate(ct.x, ct.y)
      ctx.scale(ct.scale, ct.scale)
      
      // 文字描边
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'
      ctx.lineWidth = 3
      ctx.font = 'bold 36px sans-serif'
      ctx.textAlign = 'center'
      ctx.strokeText(ct.text, 0, 0)
      
      // 文字填充（渐变色）
      const grad = ctx.createLinearGradient(-30, -15, 30, 15)
      grad.addColorStop(0, '#FFD93D')
      grad.addColorStop(1, '#FF6B6B')
      ctx.fillStyle = grad
      ctx.fillText(ct.text, 0, 0)
      
      ctx.restore()
    })

    ctx.restore() // 恢复震动前的状态
  }

  canvas.onclick = null
  canvas.onclick = (e) => {
    lastActionTime = Date.now() // 更新最后操作时间
    
    // 如果激活了道具，先处理道具效果
    if (activeItem === 'hammer') {
      useHammer(e)
      return
    }
    if (activeItem === 'line_h') {
      useLineH(e)
      return
    }
    if (activeItem === 'line_v') {
      useLineV(e)
      return
    }
    if (activeItem === 'rainbow') {
      useRainbow(e)
      return
    }
    
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY
    const col = Math.floor((mx - 20) / CELL)
    const row = Math.floor((my - TOP) / CELL)
    const idx = row * COLS + col
    if (idx < 0 || idx >= BLOCKS.length || !BLOCKS[idx]) return
    audioService.click()
    eliminate(idx, mx, my)
  }
  
  // 彩虹锤道具效果
  function useHammer(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY
    const col = Math.floor((mx - 20) / CELL)
    const row = Math.floor((my - TOP) / CELL)
    const idx = row * COLS + col
    
    if (idx >= 0 && idx < BLOCKS.length && BLOCKS[idx]) {
      // 直接消除该方块
      eliminate(idx, mx, my)
      activeItem = null
      
      const itemHint = document.getElementById('itemHint')
      if (itemHint) itemHint.style.display = 'none'
    }
  }
  
  // 横排消除
  function useLineH(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY
    const col = Math.floor((mx - 20) / CELL)
    const row = Math.floor((my - TOP) / CELL)
    
    if (row >= 0 && row < GRID) {
      // 消除整行
      for (let c = 0; c < COLS; c++) {
        const idx = row * COLS + c
        if (BLOCKS[idx]) {
          const x = 20 + c * CELL + CELL / 2
          const y = TOP + row * CELL + CELL / 2
          
          for (let i = 0; i < 8; i++) {
            PARTICLES.push({
              x,
              y,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 3,
              life: 1,
              color: BLOCKS[idx].color,
              size: 3 + Math.random() * 3
            })
          }
          
          BLOCKS[idx] = null
        }
      }
      
      screenShake = 12
      engine.addScore(COLS * 10, W / 2, TOP + row * CELL)
      audioService.win()
      
      setTimeout(() => {
        for (let c = 0; c < COLS; c++) {
          let write = GRID - 1
          for (let r = GRID - 1; r >= 0; r--) {
            const cur = r * COLS + c
            if (BLOCKS[cur]) {
              if (write !== r) {
                BLOCKS[write * COLS + c] = BLOCKS[cur]
                BLOCKS[write * COLS + c].r = write
                BLOCKS[write * COLS + c].scale = 0.3
                BLOCKS[cur] = null
              }
              write--
            }
          }
          while (write >= 0) {
            BLOCKS[write * COLS + c] = {
              r: write, c,
              color: COLORS[Math.floor(Math.random() * COLORS.length)],
              scale: 0.1, alpha: 1, exploding: false, rainbow: false, item: null
            }
            write--
          }
        }
        spawnItemBlocks()
      }, 200)
      
      activeItem = null
      const itemHint = document.getElementById('itemHint')
      if (itemHint) itemHint.style.display = 'none'
    }
  }
  
  // 竖排消除
  function useLineV(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY
    const col = Math.floor((mx - 20) / CELL)
    const row = Math.floor((my - TOP) / CELL)
    
    if (col >= 0 && col < COLS) {
      // 消除整列
      for (let r = 0; r < GRID; r++) {
        const idx = r * COLS + col
        if (BLOCKS[idx]) {
          const x = 20 + col * CELL + CELL / 2
          const y = TOP + r * CELL + CELL / 2
          
          for (let i = 0; i < 8; i++) {
            PARTICLES.push({
              x,
              y,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 10,
              life: 1,
              color: BLOCKS[idx].color,
              size: 3 + Math.random() * 3
            })
          }
          
          BLOCKS[idx] = null
        }
      }
      
      screenShake = 12
      engine.addScore(GRID * 10, 20 + col * CELL, H / 2)
      audioService.win()
      
      // 下落填充
      let write = GRID - 1
      for (let r = GRID - 1; r >= 0; r--) {
        const cur = r * COLS + col
        if (BLOCKS[cur]) {
          if (write !== r) {
            BLOCKS[write * COLS + col] = BLOCKS[cur]
            BLOCKS[write * COLS + col].r = write
            BLOCKS[write * COLS + col].scale = 0.3
            BLOCKS[cur] = null
          }
          write--
        }
      }
      while (write >= 0) {
        BLOCKS[write * COLS + col] = {
          r: write, c: col,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          scale: 0.1, alpha: 1, exploding: false, rainbow: false, item: null
        }
        write--
      }
      
      spawnItemBlocks()
      activeItem = null
      const itemHint = document.getElementById('itemHint')
      if (itemHint) itemHint.style.display = 'none'
    }
  }
  
  // 彩虹球
  function useRainbow(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY
    const col = Math.floor((mx - 20) / CELL)
    const row = Math.floor((my - TOP) / CELL)
    const idx = row * COLS + col
    
    if (idx >= 0 && idx < BLOCKS.length && BLOCKS[idx]) {
      BLOCKS[idx].rainbow = true
      BLOCKS[idx].scale = 1.3
      
      const x = 20 + col * CELL + CELL / 2
      const y = TOP + row * CELL + CELL / 2
      for (let i = 0; i < 20; i++) {
        PARTICLES.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          life: 1,
          color: ['#FF6B6B', '#FFD93D', '#4ECDC4', '#9B59B6'][Math.floor(Math.random() * 4)],
          size: 3 + Math.random() * 4
        })
      }
      
      activeItem = null
      audioService.buff()
      
      const itemHint = document.getElementById('itemHint')
      if (itemHint) itemHint.style.display = 'none'
    }
  }

  function eliminate(idx: number, mx: number, my: number) {
    const block = BLOCKS[idx]
    if (!block || block.exploding) return
    const color = block.color

    const same: number[] = []
    const vis = new Set<number>()
    function flood(i: number) {
      if (vis.has(i) || !BLOCKS[i] || BLOCKS[i].color !== color) return
      if (BLOCKS[i].rainbow && color !== BLOCKS[i].color) return
      vis.add(i)
      same.push(i)
      const r = Math.floor(i / COLS), c = i % COLS
      if (r > 0) flood(i - COLS)
      if (r < GRID - 1) flood(i + COLS)
      if (c > 0) flood(i - 1)
      if (c < COLS - 1) flood(i + 1)
    }
    flood(idx)

    if (same.length < 3) {
      engine.breakCombo()
      // 错误反馈动画 - 更强烈的抖动
      same.forEach(i => {
        if (BLOCKS[i]) {
          let shakeCount = 0
          const originalScale = BLOCKS[i].scale
          const shake = () => {
            if (shakeCount < 8) {
              BLOCKS[i].scale = shakeCount % 2 === 0 ? 0.7 : 1.1
              shakeCount++
              setTimeout(shake, 30)
            } else {
              BLOCKS[i].scale = originalScale
            }
          }
          shake()
        }
      })
      return
    }

    same.forEach(i => {
      if (BLOCKS[i]) BLOCKS[i].exploding = true
    })

    // 计算分数和连击倍数
    const basePoints = same.length * 10
    const comboMultiplier = 1 + (same.length - 3) * 0.5 // 超过3个有额外加成
    let pts = Math.round(basePoints * comboMultiplier)
    
    // 双倍分数效果
    if (doubleScoreActive) {
      pts *= 2
      doubleScoreActive = false
    }
    
    engine.addScore(pts, mx, my)
    engine.triggerRandomBuff()
    
    // 收集道具：检查消除的方块中是否有道具
    const collectedItems: string[] = []
    same.forEach(i => {
      if (BLOCKS[i] && BLOCKS[i].item) {
        const itemId = BLOCKS[i].item
        if (!collectedItems.includes(itemId)) {
          collectedItems.push(itemId)
          itemCharge[itemId] = (itemCharge[itemId] || 0) + 1
          
          // 显示收集提示
          const itemData = GAME_ITEMS.find(item => item.id === itemId)
          if (itemData) {
            comboTexts.push({
              text: `+1 ${itemData.icon}`,
              x: mx,
              y: my - 50 - collectedItems.length * 30,
              life: 1,
              scale: 0.8
            })
          }
        }
      }
    })
    
    // 更新道具栏显示
    if (collectedItems.length > 0) {
      updateItemBar()
      audioService.buff()
    }
    
    // 根据消除数量设置震动强度
    screenShake = Math.min(same.length * 1.5, 15)
    
    // 添加连击文字特效
    if (same.length >= 4) {
      comboTexts.push({
        text: `${same.length} 连消!`,
        x: mx,
        y: my - 30,
        life: 1,
        scale: 0.5
      })
    }
    if (same.length >= 6) {
      setTimeout(() => {
        comboTexts.push({
          text: '太棒了!',
          x: mx,
          y: my - 60,
          life: 1,
          scale: 0.5
        })
      }, 100)
    }
    if (same.length >= 8) {
      setTimeout(() => {
        comboTexts.push({
          text: '完美!',
          x: mx,
          y: my - 90,
          life: 1,
          scale: 0.5
        })
      }, 200)
    }

    // 创建更华丽的爆炸粒子效果
    same.forEach(i => {
      const b = BLOCKS[i]
      if (!b) return
      const x = 20 + b.c * CELL + CELL / 2
      const y = TOP + b.r * CELL + CELL / 2
      
      // 主爆炸粒子（更多数量）
      for (let j = 0; j < 12; j++) {
        const angle = (Math.PI * 2 * j) / 12
        const speed = 4 + Math.random() * 6
        PARTICLES.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color: b.color,
          size: 4 + Math.random() * 4
        })
      }
      
      // 小颗粒飞溅效果
      for (let j = 0; j < 8; j++) {
        PARTICLES.push({
          x: x + (Math.random() - 0.5) * 10,
          y: y + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12 - 3,
          life: 0.8,
          color: '#FFF',
          size: 2 + Math.random() * 2
        })
      }
      
      // 彩色光晕效果
      for (let j = 0; j < 5; j++) {
        PARTICLES.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          life: 0.6,
          color: b.color,
          size: 15 + Math.random() * 10
        })
      }
    })

    // Mega buff - 全屏消除更震撼
    if (engine.hasBuff('mega')) {
      setTimeout(() => {
        // 先创建全屏闪光效果
        for (let i = 0; i < 100; i++) {
          PARTICLES.push({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            life: 1,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            size: 5 + Math.random() * 8
          })
        }
        
        BLOCKS.forEach((b, i) => {
          if (b) engine.addScore(10, 20 + (i % COLS) * CELL + CELL / 2, TOP + Math.floor(i / COLS) * CELL + CELL / 2)
        })
        BLOCKS.forEach((_, i) => BLOCKS[i] = null)
        audioService.win()
      }, 200)
    }

    setTimeout(() => {
      same.forEach(i => { BLOCKS[i] = null })
      for (let c = 0; c < COLS; c++) {
        let write = GRID - 1
        for (let r = GRID - 1; r >= 0; r--) {
          const cur = r * COLS + c
          if (BLOCKS[cur]) {
            if (write !== r) { 
              BLOCKS[write * COLS + c] = BLOCKS[cur]
              BLOCKS[write * COLS + c].r = write  // 更新行号
              BLOCKS[write * COLS + c].scale = 0.3 // 下落动画起始缩放更小
              BLOCKS[write * COLS + c].targetY = write // 标记目标位置
              BLOCKS[cur] = null 
            }
            write--
          }
        }
        while (write >= 0) {
          BLOCKS[write * COLS + c] = {
            r: write, c,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            scale: 0.1, alpha: 1, exploding: false, rainbow: false, // 新方块从极小开始
            targetY: write,
            dropAnim: true // 标记需要下落动画
          }
          write--
        }
      }
      
      // 检查是否有可消除的组合，如果没有则重置棋盘
      setTimeout(() => {
        if (!hasValidMove()) {
          resetBoard()
        }
      }, 200)
    }, 150)
  }
  
  // 使用道具函数（供外部调用）
  ;(window as any).useGameItem = (itemId: string) => {
    // 检查是否有道具
    if (!itemCharge[itemId] || itemCharge[itemId] <= 0) {
      showItemHint('没有该道具！')
      setTimeout(() => {
        const hint = document.getElementById('itemHint')
        if (hint) hint.style.display = 'none'
      }, 1000)
      return
    }
    
    switch (itemId) {
      case 'bomb':
        useBomb()
        itemCharge.bomb-- // 使用后减少
        break
      case 'shuffle':
        useShuffle()
        itemCharge.shuffle--
        break
      case 'hammer':
        activeItem = 'hammer'
        showItemHint('点击方块将其消除')
        itemCharge.hammer--
        break
      case 'color_bomb':
        useColorBomb()
        itemCharge.color_bomb--
        break
      case 'line_h':
        activeItem = 'line_h'
        showItemHint('点击任意方块消除整行')
        itemCharge.line_h--
        break
      case 'line_v':
        activeItem = 'line_v'
        showItemHint('点击任意方块消除整列')
        itemCharge.line_v--
        break
      case 'rainbow':
        activeItem = 'rainbow'
        showItemHint('点击方块变为彩虹色')
        itemCharge.rainbow--
        break
      case 'freeze':
        lastActionTime = Date.now() - (INACTIVITY_TIMEOUT - 5000) // 增加5秒
        showItemHint('时间冻结5秒！')
        itemCharge.freeze--
        setTimeout(() => {
          const hint = document.getElementById('itemHint')
          if (hint) hint.style.display = 'none'
        }, 1500)
        break
      case 'time_plus':
        lastActionTime = Date.now() - (INACTIVITY_TIMEOUT - 15000) // 增加15秒
        showItemHint('时间延长15秒！')
        itemCharge.time_plus--
        setTimeout(() => {
          const hint = document.getElementById('itemHint')
          if (hint) hint.style.display = 'none'
        }, 1500)
        break
      case 'double_score':
        doubleScoreActive = true
        showItemHint('下次消除得分翻倍！')
        itemCharge.double_score--
        setTimeout(() => {
          const hint = document.getElementById('itemHint')
          if (hint) hint.style.display = 'none'
        }, 1500)
        break
      case 'mega_bomb':
        useMegaBomb()
        itemCharge.mega_bomb--
        break
    }
    
    // 更新道具栏显示
    updateItemBar()
  }
  
  // 颜色炸弹效果
  function useColorBomb() {
    // 找到数量最多的颜色
    const colorCount: Record<string, number[]> = {}
    BLOCKS.forEach((b, i) => {
      if (b && !b.rainbow) {
        if (!colorCount[b.color]) colorCount[b.color] = []
        colorCount[b.color].push(i)
      }
    })
    
    let maxColor = ''
    let maxCount = 0
    for (const [color, indices] of Object.entries(colorCount)) {
      if (indices.length > maxCount) {
        maxCount = indices.length
        maxColor = color
      }
    }
    
    if (maxColor && maxCount >= 3) {
      // 消除所有该颜色的方块
      colorCount[maxColor].forEach(idx => {
        if (BLOCKS[idx]) {
          const x = 20 + (idx % COLS) * CELL + CELL / 2
          const y = TOP + Math.floor(idx / COLS) * CELL + CELL / 2
          
          for (let i = 0; i < 15; i++) {
            PARTICLES.push({
              x,
              y,
              vx: (Math.random() - 0.5) * 12,
              vy: (Math.random() - 0.5) * 12,
              life: 1,
              color: maxColor,
              size: 4 + Math.random() * 5
            })
          }
          
          BLOCKS[idx] = null
        }
      })
      
      screenShake = 20
      engine.addScore(maxCount * 15, W / 2, H / 2)
      audioService.win()
      
      setTimeout(() => {
        for (let c = 0; c < COLS; c++) {
          let write = GRID - 1
          for (let r = GRID - 1; r >= 0; r--) {
            const cur = r * COLS + c
            if (BLOCKS[cur]) {
              if (write !== r) {
                BLOCKS[write * COLS + c] = BLOCKS[cur]
                BLOCKS[write * COLS + c].r = write
                BLOCKS[write * COLS + c].scale = 0.3
                BLOCKS[cur] = null
              }
              write--
            }
          }
          while (write >= 0) {
            BLOCKS[write * COLS + c] = {
              r: write, c,
              color: COLORS[Math.floor(Math.random() * COLORS.length)],
              scale: 0.1, alpha: 1, exploding: false, rainbow: false, item: null
            }
            write--
          }
        }
        spawnItemBlocks() // 重新生成道具方块
      }, 200)
    }
  }
  
  // 超级炸弹效果（全屏消除）
  function useMegaBomb() {
    BLOCKS.forEach((b, idx) => {
      if (b) {
        const x = 20 + (idx % COLS) * CELL + CELL / 2
        const y = TOP + Math.floor(idx / COLS) * CELL + CELL / 2
        
        for (let i = 0; i < 8; i++) {
          PARTICLES.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            life: 1,
            color: b.color,
            size: 5 + Math.random() * 6
          })
        }
        
        BLOCKS[idx] = null
      }
    })
    
    screenShake = 25
    engine.addScore(BLOCKS.length * 10, W / 2, H / 2)
    audioService.win()
    
    setTimeout(() => {
      initBlocks()
    }, 300)
  }
  
  // 更新道具栏显示
  function updateItemBar() {
    const items = ['bomb', 'line_h', 'line_v', 'color_bomb', 'hammer', 'shuffle', 'rainbow', 'freeze', 'magnet', 'mega_bomb', 'time_plus', 'double_score']
    items.forEach(itemId => {
      const countEl = document.getElementById(`itemCount_${itemId}`)
      if (countEl) {
        const count = itemCharge[itemId] || 0
        countEl.textContent = String(count)
        
        // 根据数量改变样式
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
  
  // 超级炸弹效果
  function useBomb() {
    // 找到数量最多的颜色
    const colorCount: Record<string, number[]> = {}
    BLOCKS.forEach((b, i) => {
      if (b && !b.rainbow) {
        if (!colorCount[b.color]) colorCount[b.color] = []
        colorCount[b.color].push(i)
      }
    })
    
    let maxColor = ''
    let maxCount = 0
    for (const [color, indices] of Object.entries(colorCount)) {
      if (indices.length > maxCount) {
        maxCount = indices.length
        maxColor = color
      }
    }
    
    if (maxColor && maxCount >= 3) {
      // 消除所有该颜色的方块
      colorCount[maxColor].forEach(idx => {
        if (BLOCKS[idx]) {
          const x = 20 + (idx % COLS) * CELL + CELL / 2
          const y = TOP + Math.floor(idx / COLS) * CELL + CELL / 2
          
          // 爆炸粒子
          for (let i = 0; i < 15; i++) {
            PARTICLES.push({
              x,
              y,
              vx: (Math.random() - 0.5) * 12,
              vy: (Math.random() - 0.5) * 12,
              life: 1,
              color: maxColor,
              size: 4 + Math.random() * 5
            })
          }
          
          BLOCKS[idx] = null
        }
      })
      
      screenShake = 20
      engine.addScore(maxCount * 15, W / 2, H / 2)
      audioService.win()
      
      // 下落填充
      setTimeout(() => {
        for (let c = 0; c < COLS; c++) {
          let write = GRID - 1
          for (let r = GRID - 1; r >= 0; r--) {
            const cur = r * COLS + c
            if (BLOCKS[cur]) {
              if (write !== r) {
                BLOCKS[write * COLS + c] = BLOCKS[cur]
                BLOCKS[write * COLS + c].r = write
                BLOCKS[write * COLS + c].scale = 0.3
                BLOCKS[cur] = null
              }
              write--
            }
          }
          while (write >= 0) {
            BLOCKS[write * COLS + c] = {
              r: write, c,
              color: COLORS[Math.floor(Math.random() * COLORS.length)],
              scale: 0.1, alpha: 1, exploding: false, rainbow: false
            }
            write--
          }
        }
      }, 200)
    }
  }
  
  // 重新洗牌效果
  function useShuffle() {
    const colors: string[] = []
    BLOCKS.forEach(b => {
      if (b) colors.push(b.color)
    })
    
    // Fisher-Yates 洗牌算法
    for (let i = colors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[colors[i], colors[j]] = [colors[j], colors[i]]
    }
    
    let colorIdx = 0
    BLOCKS.forEach((b, i) => {
      if (b) {
        b.color = colors[colorIdx++]
        b.scale = 0.5 // 缩小再放大动画
      }
    })
    
    screenShake = 10
    audioService.buff()
    
    // 创建洗牌特效
    for (let i = 0; i < 50; i++) {
      PARTICLES.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 0.8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 3 + Math.random() * 4
      })
    }
  }
  
  // 显示道具提示
  function showItemHint(text: string) {
    let hint = document.getElementById('itemHint')
    if (!hint) {
      hint = document.createElement('div')
      hint.id = 'itemHint'
      hint.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: #fff;
        padding: 16px 24px;
        border-radius: 12px;
        font-size: 16px;
        z-index: 1000;
        pointer-events: none;
        animation: fadeIn 0.3s;
      `
      document.body.appendChild(hint)
    }
    hint.textContent = text
    hint.style.display = 'block'
  }

  // 随机彩虹方块
  setInterval(() => {
    if (Math.random() < 0.003 && !BLOCKS.some(b => b && b.rainbow)) {
      const idx = Math.floor(Math.random() * BLOCKS.length)
      if (BLOCKS[idx]) BLOCKS[idx].rainbow = true
    }
  }, 1000)

  // 检查是否有可消除的组合
  function hasValidMove(): boolean {
    // 检查每个方块是否能形成3个或以上的连接
    for (let i = 0; i < BLOCKS.length; i++) {
      if (!BLOCKS[i]) continue
      
      const color = BLOCKS[i].color
      const r = Math.floor(i / COLS)
      const c = i % COLS
      
      // 使用BFS/DFS检查连通性
      const visited = new Set<number>()
      const queue: number[] = [i]
      visited.add(i)
      let count = 0
      
      while (queue.length > 0 && count < 3) {
        const curr = queue.shift()!
        count++
        
        const cr = Math.floor(curr / COLS)
        const cc = curr % COLS
        
        // 检查四个方向
        const directions = [
          { r: cr - 1, c: cc }, // 上
          { r: cr + 1, c: cc }, // 下
          { r: cr, c: cc - 1 }, // 左
          { r: cr, c: cc + 1 }  // 右
        ]
        
        for (const dir of directions) {
          if (dir.r >= 0 && dir.r < GRID && dir.c >= 0 && dir.c < COLS) {
            const idx = dir.r * COLS + dir.c
            if (!visited.has(idx) && BLOCKS[idx] && BLOCKS[idx].color === color) {
              visited.add(idx)
              queue.push(idx)
            }
          }
        }
      }
      
      if (count >= 3) return true
    }
    return false
  }

  // 重置棋盘（保留分数）
  function resetBoard() {
    // 创建过渡动画
    BLOCKS.forEach((b, i) => {
      if (b) {
        b.scale = 0.1
        b.alpha = 0.3
      }
    })
    
    setTimeout(() => {
      initBlocks()
      // 新方块从小变大
      BLOCKS.forEach(b => {
        if (b) {
          b.scale = 0.1
          b.alpha = 1
        }
      })
    }, 300)
  }

  initBlocks()
  let last = 0
  function loop(ts: number) {
    if (!document.getElementById('mainGameCanvas')) return
    
    // 检查玩家长时间无操作
    const now = Date.now()
    if (now - lastActionTime > INACTIVITY_TIMEOUT) {
      // 玩家长时间未操作，判定失败
      engine.endGame()
      audioService.lose()
      onEnd()
      return
    }
    
    if (ts - last > 16) {
      // 动画更新：方块缩放恢复
      BLOCKS.forEach(b => {
        if (b && b.scale < 1) {
          b.scale += 0.08
          if (b.scale > 1) b.scale = 1
        }
      })
      draw()
      last = ts
    }
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
  
  // 初始化 HTML 道具栏
  updateHTMLPowerupBar()
}
