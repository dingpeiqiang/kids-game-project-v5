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
  const BLOCK_HEIGHT = 24 // 每层方块高度
  const PERFECT_THRESHOLD = 4 // 完美对齐的像素容差
  const MIN_WIDTH = 8 // 最小方块宽度，低于此游戏结束
  const BASE_SPEED = 1.5 // 初始摆动速度
  const SPEED_INCREMENT = 0.08 // 每层速度增量

  // 彩虹色阶（暖色→冷色渐变）
  const BLOCK_COLORS = [
    '#FF6B6B', '#FF8E53', '#FFD93D', '#6BCB77', '#4ECDC4',
    '#45B7AA', '#4D96FF', '#6C5CE7', '#A29BFE', '#FD79A8',
    '#E17055', '#00CEC9', '#0984E3', '#6C5B7B', '#C44569',
  ]

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

  let layers: Layer[] = []
  let currentBlock = { x: 0, w: 0, dir: 1 }
  let fallingPieces: { x: number, y: number, w: number, color: string, vy: number, vx: number, rot: number, rotSpeed: number }[] = []
  let particles: Particle[] = []
  let floatTexts: FloatText[] = []
  let cameraY = 0
  let targetCameraY = 0
  let gameStarted = false
  let gameEnded = false
  let comboPerfect = 0 // 连续完美次数
  let shakeAmount = 0
  
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

  function spawnBlock() {
    const top = layers[layers.length - 1]
    const speed = BASE_SPEED + (layers.length - 1) * SPEED_INCREMENT
    currentBlock = {
      x: -top.w,
      w: top.w,
      dir: speed,
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
    const color = getBlockColor(layers.length)

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
      layers.push({ x: top.x, w: top.w, y, color })

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
      layers.push({ x: overlapLeft, w: overlapWidth, y, color })

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
    }

    // 绘制当前摆动的方块（始终显示）
    if (!gameEnded) {
      const screenY = (layers[layers.length - 1].y - BLOCK_HEIGHT) + cameraY
      const color = getBlockColor(layers.length)
      // 摆动方块阴影
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      ctx.fillRect(currentBlock.x + 3, screenY + 3, currentBlock.w, BLOCK_HEIGHT)
      drawBlock(currentBlock.x, screenY, currentBlock.w, color)
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
      ctx.fillRect(0, H / 2 - 50, W, 100)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 22px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('👆 点击屏幕放置方块', W / 2, H / 2)
      ctx.font = '16px sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillText('对齐越精准，分数越高！', W / 2, H / 2 + 30)
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

    updateFallingPieces()
    draw()
    requestAnimationFrame(loop)
  }

  function updateFallingPieces() {
    // 粒子在 draw 里更新了，碎片也在 draw 里更新了
  }

  engine.start()
  
      
  // 首次绘制（避免黑屏）
  draw()
  
  loop()
}
