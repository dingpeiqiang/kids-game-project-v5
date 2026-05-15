import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { app } from '../App'

export function initStack(engine: GameEngine, onEnd: () => void) {
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

  // === 游戏配置 ===
  const BLOCK_HEIGHT = 28 // 每层方块高度（增大更解压）
  const PERFECT_THRESHOLD = 8 // 完美对齐的像素容差（更大更容易完美）
  const MIN_WIDTH = 10 // 最小方块宽度，低于此游戏结束（增大更友好）
  const BASE_SPEED = 0.5 // 初始摆动速度
  const SPEED_INCREMENT = 0.002 // 每层速度增量（几乎不增长）

  // 彩虹色阶（暖色→冷色渐变）
  const BLOCK_COLORS = [
    '#FF6B6B', '#FF8E53', '#FFD93D', '#6BCB77', '#4ECDC4',
    '#45B7AA', '#4D96FF', '#6C5CE7', '#A29BFE', '#FD79A8',
    '#E17055', '#00CEC9', '#0984E3', '#6C5B7B', '#C44569',
  ]

  // 特殊方块类型
  type SpecialBlockType = 'bonus' | 'bomb' | 'lucky' | 'shrink' | 'expand' | 'slow' | 'none'
  
  // 特殊方块配置
  const SPECIAL_BLOCK_CONFIG: Record<SpecialBlockType, { color: string, icon: string, name: string }> = {
    bonus: { color: '#FFD700', icon: '⭐', name: '奖励' },
    bomb: { color: '#FF4444', icon: '💣', name: '炸弹' },
    lucky: { color: '#9B59B6', icon: '🍀', name: '幸运' },
    shrink: { color: '#3498DB', icon: '🔻', name: '缩小' },
    expand: { color: '#2ECC71', icon: '📐', name: '加宽' },
    slow: { color: '#1ABC9C', icon: '🐢', name: '减速' },
    none: { color: '', icon: '', name: '' }
  }

  // 背景渐变（随高度变化）
  const BG_STAGES = [
    { h: 0,  top: '#87CEEB', bot: '#E0F7FA' },   // 天空
    { h: 8,  top: '#5DADE2', bot: '#85C1E9' },   // 高空
    { h: 16, top: '#2E4057', bot: '#5DADE2' },   // 平流层
    { h: 25, top: '#1a1a2e', bot: '#16213e' },   // 太空
  ]

  // === 游戏状态 ===
  interface Layer {
    x: number       // 左边x
    w: number       // 宽度
    y: number       // y位置
    color: string   // 颜色
    special?: SpecialBlockType // 特殊方块类型
  }

  interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    color: string
    size: number
    rot: number
    rotSpeed: number
  }

  interface FloatText {
    text: string
    x: number
    y: number
    life: number
    color: string
    size: number
  }

  // 天气粒子
  interface WeatherParticle {
    x: number
    y: number
    speed: number
    type: 'rain' | 'snow'
  }

  // 小动物角色
  interface Character {
    x: number
    y: number
    targetX: number
    type: 'cat' | 'dog' | 'bird' | 'rabbit'
    frame: number
    frameTimer: number
  }

  // 解压气泡
  interface Bubble {
    x: number
    y: number
    size: number
    speed: number
    wobble: number
    wobbleSpeed: number
    color: string
  }

  // 彩虹粒子
  interface RainbowParticle {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    color: string
    size: number
  }

  // 云朵
  interface Cloud {
    x: number
    y: number
    speed: number
    size: number
  }

  let layers: Layer[] = []
  let currentBlock = { x: 0, w: 0, dir: 1, special: 'none' as SpecialBlockType }
  let fallingPieces: { x: number, y: number, w: number, color: string, vy: number, vx: number, rot: number, rotSpeed: number }[] = []
  let particles: Particle[] = []
  let floatTexts: FloatText[] = []
  let cameraY = 0
  let targetCameraY = 0
  let gameStarted = false
  let gameEnded = false
  let comboPerfect = 0 // 连续完美次数
  let shakeAmount = 0
  
  // 新游戏元素
  let weatherParticles: WeatherParticle[] = []
  let currentWeather: 'sunny' | 'rainy' | 'snowy' = 'sunny'
  let weatherTimer = 0
  let characters: Character[] = []
  let nextCharTimer = 0
  let currentSpecialBlock: SpecialBlockType = 'none'
  
  // 解压元素
  let bubbles: Bubble[] = []
  let rainbowParticles: RainbowParticle[] = []
  let clouds: Cloud[] = []
  
  // ====== 道具系统（库存模式）======
  let inventory: string[] = [] // 道具库存
  
  // 道具图标映射
  const powerupIcons: Record<string, string> = {
    'widen': '↔️',      // 加宽 - 方块宽度×1.5
    'slow': '🐌',       // 减速 - 摆动速度减半
    'perfect': '✨',    // 完美 - 下次自动完美对齐
    'revive': '💖'      // 复活 - 游戏结束时恢复一次
  }
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id
    }))
    
    app.setupCustomPowerupBar('stack', powerups, inventory, (powerupId) => {
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
      case 'widen':
        // 加宽 - 方块宽度×1.5
        currentBlock.w = Math.min(currentBlock.w * 1.5, W * 0.8)
        audioService.win()
        console.log('[道具] 方块加宽')
        break
        
      case 'slow':
        // 减速 - 摆动速度减半，持续10秒
        ;(window as any).stackSlow = Date.now() + 10000
        audioService.collect()
        console.log('[道具] 减速生效，持续10秒')
        break
        
      case 'perfect':
        // 完美 - 下次自动完美对齐
        ;(window as any).stackPerfect = true
        audioService.win()
        console.log('[道具] 下次自动完美对齐')
        break
        
      case 'revive':
        // 复活 - 游戏结束时恢复一次
        ;(window as any).stackRevive = true
        audioService.win()
        console.log('[道具] 复活已准备')
        break
    }
    
    return true
  }

  // 初始化底层基座
  const baseWidth = W * 0.55
  const baseX = (W - baseWidth) / 2
  const baseY = H - 60

  layers.push({
    x: baseX,
    w: baseWidth,
    y: baseY,
    color: '#B0B0B0',
  })

  // 生成第一块方块
  spawnBlock()

  // 随机生成特殊方块类型（更友好的概率分布）
  function getRandomSpecialBlock(): SpecialBlockType {
    if (layers.length < 5) return 'none'
    const rand = Math.random()
    if (rand < 0.15) return 'bonus'      // 15% 奖励方块
    if (rand < 0.20) return 'bomb'       // 5% 炸弹方块（降低概率）
    if (rand < 0.30) return 'lucky'      // 10% 幸运方块
    if (rand < 0.38) return 'shrink'     // 8% 缩小方块
    if (rand < 0.48) return 'expand'     // 10% 加宽方块（新增）
    if (rand < 0.58) return 'slow'       // 10% 减速方块（新增）
    return 'none'
  }

  // 处理特殊方块效果
  function handleSpecialBlock(type: SpecialBlockType) {
    switch (type) {
      case 'bonus':
        engine.addScore(500, W / 2, layers[layers.length - 1].y - cameraY)
        floatTexts.push({ text: '🎁 奖励+500', x: W / 2, y: layers[layers.length - 1].y - cameraY - 20, life: 1, color: '#FFD700', size: 20 })
        audioService.win()
        break
      case 'bomb':
        shakeAmount = 15
        if (layers.length > 3) {
          const removeCount = Math.min(1, layers.length - 2) // 只炸掉1层，更友好
          for (let i = 0; i < removeCount; i++) {
            const removed = layers.pop()!
            dropPiece(removed.x, removed.y, removed.w, removed.color)
          }
          if (layers.length > 1) {
            targetCameraY = Math.max(0, baseY - layers[layers.length - 1].y - H * 0.55)
          }
        }
        floatTexts.push({ text: '💥 炸弹！', x: W / 2, y: layers[layers.length - 1].y - cameraY - 20, life: 1, color: '#FF4444', size: 24 })
        audioService.lose()
        break
      case 'lucky':
        const luckyScore = Math.floor(Math.random() * 300) + 100 // 降低随机范围
        engine.addScore(luckyScore, W / 2, layers[layers.length - 1].y - cameraY)
        floatTexts.push({ text: `🍀 幸运+${luckyScore}`, x: W / 2, y: layers[layers.length - 1].y - cameraY - 20, life: 1, color: '#9B59B6', size: 20 })
        audioService.collect()
        break
      case 'shrink':
        if (currentBlock.w > MIN_WIDTH * 2) {
          currentBlock.w *= 0.85 // 缩小幅度更小，更友好
        }
        floatTexts.push({ text: '🔻 方块缩小', x: W / 2, y: layers[layers.length - 1].y - cameraY - 20, life: 1, color: '#3498DB', size: 18 })
        break
      case 'expand':
        // 加宽方块 - 下一个方块变大
        currentBlock.w = Math.min(currentBlock.w * 1.3, W * 0.6)
        floatTexts.push({ text: '📐 方块加宽', x: W / 2, y: layers[layers.length - 1].y - cameraY - 20, life: 1, color: '#2ECC71', size: 18 })
        audioService.collect()
        break
      case 'slow':
        // 减速方块 - 下一个方块速度变慢
        currentBlock.dir *= 0.7
        floatTexts.push({ text: '🐢 速度减慢', x: W / 2, y: layers[layers.length - 1].y - cameraY - 20, life: 1, color: '#1ABC9C', size: 18 })
        audioService.collect()
        break
    }
  }

  function spawnBlock() {
    const top = layers[layers.length - 1]
    const speed = BASE_SPEED + (layers.length - 1) * SPEED_INCREMENT
    const special = getRandomSpecialBlock()
    currentBlock = {
      x: -top.w,
      w: top.w,
      dir: speed,
      special,
    }
  }

  function getBlockColor(layerIndex: number): string {
    return BLOCK_COLORS[layerIndex % BLOCK_COLORS.length]
  }

  function getBackground(topY: number): { top: string; bot: string } {
    const layerCount = Math.floor((baseY - topY) / BLOCK_HEIGHT)
    let bg = BG_STAGES[0]
    for (let i = BG_STAGES.length - 1; i >= 0; i--) {
      if (layerCount >= BG_STAGES[i].h) {
        bg = BG_STAGES[i]
        break
      }
    }
    return bg
  }

  function placeBlock() {
    if (gameEnded) return

    const top = layers[layers.length - 1]
    const y = top.y - BLOCK_HEIGHT
    
    // 处理特殊方块颜色
    let color = getBlockColor(layers.length)
    if (currentBlock.special !== 'none') {
      color = SPECIAL_BLOCK_CONFIG[currentBlock.special].color
    }

    // 计算重叠
    const overlapLeft = Math.max(currentBlock.x, top.x)
    const overlapRight = Math.min(currentBlock.x + currentBlock.w, top.x + top.w)
    const overlapWidth = overlapRight - overlapLeft

    if (overlapWidth <= 0) {
      // 完全落空！
      dropPiece(currentBlock.x, y, currentBlock.w, color)
      endGame()
      return
    }

    const isPerfect = Math.abs(currentBlock.x - top.x) < PERFECT_THRESHOLD

    if (isPerfect) {
      // 完美对齐！使用上一层的位置和宽度
      comboPerfect++
      layers.push({ x: top.x, w: top.w, y, color, special: currentBlock.special })

      // 完美奖励
      const perfectBonus = comboPerfect >= 5 ? 200 : comboPerfect >= 3 ? 100 : comboPerfect >= 2 ? 50 : 25
      engine.addScore(perfectBonus * comboPerfect, W / 2, y - cameraY)

      // 浮动文字
      let text = '完美!'
      let size = 22
      let textColor = '#FFD700'
      if (comboPerfect >= 5) { text = '🔥 无敌!'; size = 32; textColor = '#FF6B6B' }
      else if (comboPerfect >= 3) { text = '太棒了!'; size = 28; textColor = '#FF8E53' }
      else if (comboPerfect >= 2) { text = '厉害!'; size = 24; textColor = '#6BCB77' }

      floatTexts.push({ text, x: W / 2, y: y - cameraY - 10, life: 1, color: textColor, size })

      // 完美粒子（金色）
      for (let i = 0; i < 20 + comboPerfect * 5; i++) {
        particles.push({
          x: top.x + Math.random() * top.w,
          y: y - cameraY,
          vx: (Math.random() - 0.5) * 8,
          vy: -Math.random() * 6 - 2,
          life: 1,
          color: comboPerfect >= 5 ? '#FF6B6B' : '#FFD700',
          size: 3 + Math.random() * 4,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.2,
        })
      }

      // 屏幕震动
      shakeAmount = Math.min(6, 2 + comboPerfect)

      audioService.win()
      if (comboPerfect >= 3) engine.triggerRandomBuff()
    } else {
      // 非完美：切割方块
      comboPerfect = 0

      const cutLeft = currentBlock.x < top.x
      const cutX = cutLeft ? currentBlock.x : overlapRight
      const cutW = currentBlock.w - overlapWidth

      // 切掉的部分变成碎片
      if (cutW > 0) {
        dropPiece(cutX, y, cutW, color)
      }

      // 保留重叠部分
      layers.push({ x: overlapLeft, w: overlapWidth, y, color, special: currentBlock.special })

      // 基础分数
      engine.addScore(10, overlapLeft + overlapWidth / 2, y - cameraY)

      // 切割粒子
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: cutLeft ? overlapLeft : overlapRight,
          y: y - cameraY,
          vx: (cutLeft ? -1 : 1) * (Math.random() * 4 + 1),
          vy: -Math.random() * 3,
          life: 1,
          color,
          size: 2 + Math.random() * 3,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.3,
        })
      }

      audioService.click()
    }

    // 处理特殊方块效果
    if (currentBlock.special !== 'none') {
      handleSpecialBlock(currentBlock.special)
    }

    // 检查是否太小
    const newBlock = layers[layers.length - 1]
    if (newBlock.w < MIN_WIDTH) {
      endGame()
      return
    }

    // 更新相机目标
    targetCameraY = Math.max(0, baseY - newBlock.y - H * 0.55)

    // 生成下一块
    spawnBlock()
  }

  function dropPiece(x: number, y: number, w: number, color: string) {
    fallingPieces.push({
      x, y, w, color,
      vy: 0,
      vx: (Math.random() - 0.5) * 2,
      rot: 0,
      rotSpeed: (Math.random() - 0.5) * 0.1,
    })
  }

  function endGame() {
    gameEnded = true
    engine.endGame()
    // 延迟一点显示结果，让碎片有时间掉落
    setTimeout(() => onEnd(), 800)
  }

  // === 渲染 ===
  function draw() {
    // 相机平滑跟随
    cameraY += (targetCameraY - cameraY) * 0.08
    if (shakeAmount > 0) shakeAmount *= 0.85
    if (shakeAmount < 0.1) shakeAmount = 0

    ctx.save()
    // 屏幕震动
    if (shakeAmount > 0) {
      ctx.translate(
        (Math.random() - 0.5) * shakeAmount * 2,
        (Math.random() - 0.5) * shakeAmount * 2,
      )
    }

    // 背景渐变
    const bg = getBackground(cameraY)
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, bg.top)
    grad.addColorStop(1, bg.bot)
    ctx.fillStyle = grad
    ctx.fillRect(-10, -10, W + 20, H + 20)

    // 远景装饰（星星，太空阶段）
    if (cameraY > 400) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      for (let i = 0; i < 30; i++) {
        const sx = ((i * 137 + 50) % W)
        const sy = ((i * 89 + 30 + cameraY * 0.3) % (H + 40)) - 20
        const ss = 1 + (i % 3)
        ctx.beginPath()
        ctx.arc(sx, sy, ss, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // 绘制已堆叠的方块
    for (const layer of layers) {
      const screenY = layer.y + cameraY
      if (screenY < -BLOCK_HEIGHT || screenY > H + BLOCK_HEIGHT) continue
      drawBlock(layer.x, screenY, layer.w, layer.color)
      // 绘制特殊方块图标
      if (layer.special && layer.special !== 'none') {
        const icon = SPECIAL_BLOCK_CONFIG[layer.special].icon
        ctx.font = '14px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(icon, layer.x + layer.w / 2, screenY + BLOCK_HEIGHT / 2 + 5)
      }
    }

    // 绘制当前摆动的方块（始终显示）
    if (!gameEnded) {
      const screenY = (layers[layers.length - 1].y - BLOCK_HEIGHT) + cameraY
      let color = getBlockColor(layers.length)
      if (currentBlock.special !== 'none') {
        color = SPECIAL_BLOCK_CONFIG[currentBlock.special].color
      }
      // 摆动方块阴影
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      ctx.fillRect(currentBlock.x + 3, screenY + 3, currentBlock.w, BLOCK_HEIGHT)
      drawBlock(currentBlock.x, screenY, currentBlock.w, color)
      // 绘制当前方块的特殊图标
      if (currentBlock.special !== 'none') {
        const icon = SPECIAL_BLOCK_CONFIG[currentBlock.special].icon
        ctx.font = '14px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(icon, currentBlock.x + currentBlock.w / 2, screenY + BLOCK_HEIGHT / 2 + 5)
      }
    }

    // 绘制掉落碎片
    fallingPieces.forEach((piece, i) => {
      piece.vy += 0.5 // 重力
      piece.y += piece.vy
      piece.x += piece.vx
      piece.rot += piece.rotSpeed

      const screenY = piece.y + cameraY
      if (screenY > H + 100) { fallingPieces.splice(i, 1); return }

      ctx.save()
      ctx.translate(piece.x + piece.w / 2, screenY + BLOCK_HEIGHT / 2)
      ctx.rotate(piece.rot)
      ctx.globalAlpha = Math.max(0, 1 - (screenY / H) * 0.5)
      drawBlock(-piece.w / 2, -BLOCK_HEIGHT / 2, piece.w, piece.color)
      ctx.globalAlpha = 1
      ctx.restore()
    })

    // 粒子
    particles.forEach((p, i) => {
      p.life -= 0.02
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.12
      p.rot += p.rotSpeed

      if (p.life <= 0) { particles.splice(i, 1); return }

      ctx.save()
      ctx.globalAlpha = p.life
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
      ctx.globalAlpha = 1
      ctx.restore()
    })

    // 浮动文字
    floatTexts.forEach((ft, i) => {
      ft.life -= 0.015
      ft.y -= 1.2

      if (ft.life <= 0) { floatTexts.splice(i, 1); return }

      ctx.save()
      ctx.globalAlpha = ft.life
      ctx.fillStyle = ft.color
      ctx.font = `bold ${ft.size}px sans-serif`
      ctx.textAlign = 'center'
      ctx.shadowColor = ft.color
      ctx.shadowBlur = 10
      ctx.fillText(ft.text, ft.x, ft.y)
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
      ctx.restore()
    })

    // 绘制天气效果
    if (currentWeather === 'rainy') {
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.5)'
      ctx.lineWidth = 1
      weatherParticles.forEach((p, i) => {
        p.y += p.speed
        if (p.y > H) {
          p.y = -10
          p.x = Math.random() * W
        }
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x + 2, p.y + 10)
        ctx.stroke()
      })
    } else if (currentWeather === 'snowy') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      weatherParticles.forEach((p, i) => {
        p.y += p.speed
        p.x += Math.sin(p.y * 0.02) * 0.5
        if (p.y > H) {
          p.y = -10
          p.x = Math.random() * W
        }
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // 绘制小动物角色
    characters.forEach((char, i) => {
      char.x += (char.targetX - char.x) * 0.03
      char.frameTimer++
      if (char.frameTimer > 15) {
        char.frame = (char.frame + 1) % 4
        char.frameTimer = 0
      }
      
      if (char.y + cameraY < -30 || char.y + cameraY > H + 30) {
        characters.splice(i, 1)
        return
      }

      const screenY = char.y + cameraY
      ctx.save()
      ctx.translate(char.x, screenY)
      
      let emoji = '🐱'
      switch (char.type) {
        case 'cat': emoji = ['🐱', '😺', '😸', '😻'][char.frame]; break
        case 'dog': emoji = ['🐶', '🐕', '🦮', '🐩'][char.frame]; break
        case 'bird': emoji = ['🐦', '🕊️', '🦅', '🦆'][char.frame]; break
        case 'rabbit': emoji = ['🐰', '🐇', '🐰', '🐇'][char.frame]; break
      }
      
      ctx.font = '24px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(emoji, 0, 0)
      ctx.restore()
    })

    // 绘制云朵
    clouds.forEach((cloud, i) => {
      cloud.x += cloud.speed
      if (cloud.x > W + cloud.size) {
        cloud.x = -cloud.size
      }
      const screenY = cloud.y + cameraY * 0.2
      if (screenY > -cloud.size && screenY < H + cloud.size) {
        ctx.save()
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.beginPath()
        const cx = cloud.x
        const cy = screenY
        const s = cloud.size
        ctx.arc(cx, cy, s * 0.4, 0, Math.PI * 2)
        ctx.arc(cx + s * 0.3, cy - s * 0.1, s * 0.35, 0, Math.PI * 2)
        ctx.arc(cx + s * 0.6, cy, s * 0.3, 0, Math.PI * 2)
        ctx.arc(cx - s * 0.3, cy - s * 0.05, s * 0.25, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    })

    // 绘制解压气泡
    bubbles.forEach((bubble, i) => {
      bubble.y -= bubble.speed
      bubble.wobble += bubble.wobbleSpeed
      bubble.x += Math.sin(bubble.wobble) * 0.5
      
      if (bubble.y < -bubble.size) {
        bubbles.splice(i, 1)
        return
      }
      
      ctx.save()
      ctx.globalAlpha = 0.6
      ctx.fillStyle = bubble.color
      ctx.beginPath()
      ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2)
      ctx.fill()
      
      // 气泡高光
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.beginPath()
      ctx.arc(bubble.x - bubble.size * 0.3, bubble.y - bubble.size * 0.3, bubble.size * 0.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })

    // 绘制彩虹粒子
    rainbowParticles.forEach((rp, i) => {
      rp.x += rp.vx
      rp.y += rp.vy
      rp.life -= 0.01
      rp.vy += 0.05
      
      if (rp.life <= 0) {
        rainbowParticles.splice(i, 1)
        return
      }
      
      ctx.save()
      ctx.globalAlpha = rp.life
      ctx.fillStyle = rp.color
      ctx.beginPath()
      ctx.arc(rp.x, rp.y, rp.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })

    // === HUD ===
    // 分数（左上角）
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 32px sans-serif'
    ctx.textAlign = 'left'
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 4
    ctx.fillText(String(engine.getScore()), 15, 38)
    ctx.shadowBlur = 0

    // 层数（右上角）
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`${layers.length - 1} 层`, W - 15, 35)

    // 连续完美指示器
    if (comboPerfect >= 2) {
      ctx.save()
      ctx.fillStyle = comboPerfect >= 5 ? '#FF6B6B' : comboPerfect >= 3 ? '#FF8E53' : '#FFD700'
      ctx.font = 'bold 18px sans-serif'
      ctx.textAlign = 'center'
      ctx.shadowColor = ctx.fillStyle
      ctx.shadowBlur = 8
      ctx.fillText(`🔥 ${comboPerfect}x 连续完美`, W / 2, 35)
      ctx.shadowBlur = 0
      ctx.restore()
    }

    // 引导提示
    if (!gameStarted) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'
      ctx.fillRect(0, H / 2 - 60, W, 120)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('🏗️ 叠叠乐', W / 2, H / 2 - 15)
      ctx.font = 'bold 20px sans-serif'
      ctx.fillText('👆 点击屏幕放置方块', W / 2, H / 2 + 15)
      ctx.font = '14px sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillText('⭐ 奖励方块 +500分 | 🍀 幸运方块 | 📐 加宽方块', W / 2, H / 2 + 45)
    }

    ctx.restore()
  }

  function drawBlock(x: number, y: number, w: number, color: string) {
    // 主体
    const grad = ctx.createLinearGradient(x, y, x, y + BLOCK_HEIGHT)
    grad.addColorStop(0, lightenColor(color, 30))
    grad.addColorStop(0.5, color)
    grad.addColorStop(1, darkenColor(color, 20))
    ctx.fillStyle = grad
    ctx.fillRect(x, y, w, BLOCK_HEIGHT)

    // 顶部高光
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fillRect(x, y, w, 3)

    // 左侧高光
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.fillRect(x, y, 2, BLOCK_HEIGHT)

    // 底部阴影
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    ctx.fillRect(x, y + BLOCK_HEIGHT - 2, w, 2)
  }

  function lightenColor(hex: string, amt: number): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, (num >> 16) + amt)
    const g = Math.min(255, ((num >> 8) & 0xFF) + amt)
    const b = Math.min(255, (num & 0xFF) + amt)
    return `rgb(${r},${g},${b})`
  }

  function darkenColor(hex: string, amt: number): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.max(0, (num >> 16) - amt)
    const g = Math.max(0, ((num >> 8) & 0xFF) - amt)
    const b = Math.max(0, (num & 0xFF) - amt)
    return `rgb(${r},${g},${b})`
  }

  // === 输入处理 ===
  canvas.onclick = null
  canvas.ontouchend = null
  
  function handleTap() {
    if (gameEnded) return
    if (!gameStarted) {
      gameStarted = true
    }
    placeBlock()
  }

  canvas.onclick = () => handleTap()
  canvas.ontouchend = (e) => {
    e.preventDefault()
    handleTap()
  }

  // 初始化天气粒子
  function initWeatherParticles() {
    weatherParticles = []
    for (let i = 0; i < 50; i++) {
      weatherParticles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        speed: 2 + Math.random() * 3,
        type: currentWeather === 'snowy' ? 'snow' : 'rain'
      })
    }
  }

  // 切换天气
  function switchWeather() {
    const weathers: ('sunny' | 'rainy' | 'snowy')[] = ['sunny', 'rainy', 'snowy']
    const currentIndex = weathers.indexOf(currentWeather)
    let newWeather = weathers[(currentIndex + 1) % weathers.length]
    // 避免连续两次相同天气
    if (newWeather === currentWeather) {
      newWeather = weathers[(currentIndex + 2) % weathers.length]
    }
    currentWeather = newWeather
    initWeatherParticles()
    floatTexts.push({
      text: currentWeather === 'sunny' ? '☀️ 晴天' : currentWeather === 'rainy' ? '🌧️ 雨天' : '❄️ 雪天',
      x: W / 2, y: H / 3, life: 1, color: '#fff', size: 24
    })
  }

  // 生成小动物
  function spawnCharacter() {
    if (characters.length >= 3) return
    
    const types: ('cat' | 'dog' | 'bird' | 'rabbit')[] = ['cat', 'dog', 'bird', 'rabbit']
    const charType = types[Math.floor(Math.random() * types.length)]
    const side = Math.random() > 0.5 ? 'left' : 'right'
    
    characters.push({
      x: side === 'left' ? -20 : W + 20,
      y: layers[layers.length - 1].y - Math.random() * 100,
      targetX: W * 0.3 + Math.random() * W * 0.4,
      type: charType,
      frame: 0,
      frameTimer: 0
    })
    
    floatTexts.push({
      text: charType === 'cat' ? '🐱 猫咪来了!' : 
            charType === 'dog' ? '🐶 狗狗来了!' :
            charType === 'bird' ? '🐦 小鸟来了!' : '🐰 兔子来了!',
      x: W / 2, y: H / 3, life: 0.8, color: '#FFD700', size: 18
    })
  }

  // 生成解压气泡
  function spawnBubble() {
    const bubbleColors = ['rgba(100, 200, 255, 0.5)', 'rgba(200, 150, 255, 0.5)', 'rgba(150, 255, 200, 0.5)', 'rgba(255, 200, 150, 0.5)']
    bubbles.push({
      x: Math.random() * W,
      y: H + 20,
      size: 10 + Math.random() * 20,
      speed: 0.5 + Math.random() * 1.5,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
      color: bubbleColors[Math.floor(Math.random() * bubbleColors.length)]
    })
  }

  // 生成彩虹粒子
  function spawnRainbowParticles(x: number, y: number, count: number = 10) {
    const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']
    for (let i = 0; i < count; i++) {
      rainbowParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3 - 1,
        life: 1,
        color: rainbowColors[i % rainbowColors.length],
        size: 3 + Math.random() * 3
      })
    }
  }

  // 初始化云朵
  function initClouds() {
    clouds = []
    for (let i = 0; i < 5; i++) {
      clouds.push({
        x: Math.random() * W,
        y: 50 + Math.random() * 150,
        speed: 0.1 + Math.random() * 0.2,
        size: 40 + Math.random() * 30
      })
    }
  }

  // === 游戏循环 ===
  function loop() {
    if (!document.getElementById('mainGameCanvas') || gameEnded) {
      // 即使gameEnded，也多渲染几帧让碎片掉落
      if (gameEnded && (fallingPieces.length > 0 || particles.length > 0)) {
        updateFallingPieces()
        draw()
        requestAnimationFrame(loop)
      }
      return
    }

    // 更新摆动方块位置（始终摆动，无论是否开始）
    currentBlock.x += currentBlock.dir
    if (currentBlock.x + currentBlock.w > W) {
      currentBlock.dir = -Math.abs(currentBlock.dir)
    }
    if (currentBlock.x < 0) {
      currentBlock.dir = Math.abs(currentBlock.dir)
    }

    // 天气变化逻辑（每30秒切换一次）
    if (gameStarted) {
      weatherTimer++
      if (weatherTimer > 1800) {
        weatherTimer = 0
        switchWeather()
      }

      // 小动物生成逻辑（每15秒可能生成一个）
      nextCharTimer++
      if (nextCharTimer > 900 && Math.random() > 0.7) {
        nextCharTimer = 0
        spawnCharacter()
      }

      // 解压气泡生成（持续生成）
      if (Math.random() > 0.95) {
        spawnBubble()
      }

      // 彩虹粒子生成（完美对齐时已生成，这里随机生成一些）
      if (Math.random() > 0.98) {
        spawnRainbowParticles(Math.random() * W, Math.random() * H, 5)
      }
    }

    updateFallingPieces()
    draw()
    requestAnimationFrame(loop)
  }

  function updateFallingPieces() {
    // 粒子在 draw 里更新了，碎片也在 draw 里更新了
  }

  initClouds()
  engine.start()
  
      
  // 首次绘制（避免黑屏）
  draw()
  
  loop()
}
