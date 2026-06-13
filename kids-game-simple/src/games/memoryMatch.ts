import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { resizeCanvasForMobile } from '../utils/mobileHelper'
import { applyCanvasMobileStyles, bindCanvasPointerInput } from '../utils/canvasMobileUtils'

export function initMemoryMatch(engine: GameEngine, onEnd: () => void) {
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

  // 卡牌图案（用emoji + 颜色组合，不需要图片资源）
  const CARD_TYPES = [
    { emoji: '🌟', color: '#FFD93D', name: '星星' },
    { emoji: '🔥', color: '#FF6B6B', name: '火焰' },
    { emoji: '💎', color: '#4ECDC4', name: '钻石' },
    { emoji: '🌙', color: '#A29BFE', name: '月亮' },
    { emoji: '🍀', color: '#6BCB77', name: '四叶草' },
    { emoji: '🌺', color: '#FF9FF3', name: '花朵' },
    { emoji: '⚡', color: '#FECA57', name: '闪电' },
    { emoji: '🎈', color: '#FF9F43', name: '气球' },
  ]

  // 关卡配置：[列数, 行数]（总牌数 = 列*行，必须是偶数）
  const LEVELS = [
    { cols: 4, rows: 3, pairs: 6 },   // 12张=6对
    { cols: 4, rows: 4, pairs: 8 },   // 16张=8对
    { cols: 5, rows: 4, pairs: 10 },  // 20张=10对
    { cols: 6, rows: 4, pairs: 12 }, // 24张=12对
    { cols: 6, rows: 5, pairs: 15 }, // 30张=15对（需要更多图案）
  ]

  // 扩展图案（关卡5+用）
  const EXTRA_TYPES = [
    { emoji: '🎯', color: '#EE5A24', name: '靶心' },
    { emoji: '🦋', color: '#6C5CE7', name: '蝴蝶' },
    { emoji: '🎵', color: '#00B894', name: '音符' },
    { emoji: '🎪', color: '#E17055', name: '马戏' },
    { emoji: '🎭', color: '#FD79A8', name: '面具' },
    { emoji: '☀️', color: '#F9CA24', name: '太阳' },
    { emoji: '🍄', color: '#D63031', name: '蘑菇' },
  ]

  const ALL_TYPES = [...CARD_TYPES, ...EXTRA_TYPES]

  // 游戏状态
  let currentLevel = 0
  let cards: Card[] = []
  let flippedCards: number[] = []  // 当前翻开的卡牌索引
  let matchedPairs = 0
  let totalPairs = 0
  let gameStartTime = 0
  let gameEnded = false
  let maxCombo = 0
  let isProcessing = false  // 翻牌动画进行中，锁定点击
  let particles: Particle[] = []
  let floatingTexts: FloatText[] = []
  let screenShake = 0
  let levelStartTime = 0

  interface Card {
    x: number
    y: number
    w: number
    h: number
    typeIdx: number
    isFlipped: boolean
    isMatched: boolean
    flipProgress: number  // 0=背面, 1=正面（动画插值）
    shakeProgress: number // 匹配失败时的抖动
    scale: number        // 出现动画
  }

  interface Particle {
    x: number; y: number; vx: number; vy: number
    life: number; maxLife: number; color: string; size: number
  }

  interface FloatText {
    x: number; y: number; text: string; color: string
    life: number; maxLife: number; size: number
  }

  function initLevel(levelIdx: number) {
    currentLevel = levelIdx
    const level = LEVELS[Math.min(levelIdx, LEVELS.length - 1)]
    totalPairs = level.pairs
    matchedPairs = 0
    flippedCards = []
    isProcessing = false
    levelStartTime = Date.now()

    // 选图案
    const shuffled = [...ALL_TYPES].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, level.pairs)

    // 生成卡牌对
    const cardTypes = [...selected, ...selected].sort(() => Math.random() - 0.5)

    // 计算卡牌布局
    const padding = 15
    const topOffset = 85
    const availW = W - padding * 2
    const availH = H - topOffset - padding - 50 // 底部留空间
    const gap = 6
    const cardW = (availW - gap * (level.cols - 1)) / level.cols
    const cardH = (availH - gap * (level.rows - 1)) / level.rows
    const maxCardSize = 75
    const finalW = Math.min(cardW, maxCardSize, cardH)
    const finalH = finalW * 1.25 // 卡牌比例

    // 重新计算间距使卡牌居中
    const totalGridW = level.cols * finalW + (level.cols - 1) * gap
    const totalGridH = level.rows * finalH + (level.rows - 1) * gap
    const startX = (W - totalGridW) / 2
    const startY = topOffset + (availH - totalGridH) / 2

    cards = []
    for (let i = 0; i < cardTypes.length; i++) {
      const row = Math.floor(i / level.cols)
      const col = i % level.cols
      const typeIdx = ALL_TYPES.findIndex(t => t.emoji === cardTypes[i].emoji)
      cards.push({
        x: startX + col * (finalW + gap),
        y: startY + row * (finalH + gap),
        w: finalW,
        h: finalH,
        typeIdx: typeIdx >= 0 ? typeIdx : 0,
        isFlipped: false,
        isMatched: false,
        flipProgress: 0,
        shakeProgress: 0,
        scale: 0,
      })
    }

    // 卡牌入场动画（逐张弹出）
    cards.forEach((card, i) => {
      setTimeout(() => { card.scale = 1 }, i * 30)
    })
  }

  function handleTap(mx: number, my: number) {
    if (gameEnded || isProcessing) return

    const pos = { x: mx, y: my }
    audioService.click()

    for (let i = 0; i < cards.length; i++) {
      const c = cards[i]
      if (c.isMatched || c.isFlipped) continue
      if (c.scale < 0.8) continue // 入场动画中
      if (pos.x >= c.x && pos.x <= c.x + c.w && pos.y >= c.y && pos.y <= c.y + c.h) {
        flipCard(i)
        break
      }
    }
  }

  function flipCard(idx: number) {
    const card = cards[idx]
    card.isFlipped = true
    flippedCards.push(idx)

    if (flippedCards.length === 2) {
      isProcessing = true
      const [a, b] = flippedCards

      if (cards[a].typeIdx === cards[b].typeIdx) {
        // 配对成功！
        setTimeout(() => {
          cards[a].isMatched = true
          cards[b].isMatched = true
          matchedPairs++

          const baseScore = 10 + currentLevel * 5
          const earned = engine.addScore(baseScore, cards[a].x + cards[a].w / 2, cards[a].y)
          const streak = engine.getCombo()
          if (streak > maxCombo) maxCombo = streak

          // 粒子效果
          const ct = ALL_TYPES[cards[a].typeIdx]
          spawnParticles(cards[a].x + cards[a].w / 2, cards[a].y + cards[a].h / 2, ct.color, 12)
          spawnParticles(cards[b].x + cards[b].w / 2, cards[b].y + cards[b].h / 2, ct.color, 12)

          // 浮动文字
          let txt = `+${earned}`
          if (streak >= 3) txt += ` x${streak}连击!`
          addFloatText(
            (cards[a].x + cards[b].x) / 2 + cards[a].w / 2,
            (cards[a].y + cards[b].y) / 2,
            txt, streak >= 5 ? '#FFD93D' : streak >= 3 ? '#FECA57' : '#fff'
          )

          audioService.combo()

          flippedCards = []
          isProcessing = false

          // 检查关卡完成
          if (matchedPairs === totalPairs) {
            setTimeout(() => levelComplete(), 400)
          }
        }, 300)
      } else {
        // 配对失败
        engine.breakCombo()
        setTimeout(() => {
          cards[a].isFlipped = false
          cards[b].isFlipped = false
          cards[a].shakeProgress = 1
          cards[b].shakeProgress = 1
          flippedCards = []
          isProcessing = false
          audioService.pop()
        }, 600)
      }
    }
  }

  function levelComplete() {
    // 大量粒子庆祝
    for (let i = 0; i < 40; i++) {
      spawnParticles(
        Math.random() * W, Math.random() * H * 0.6,
        ALL_TYPES[Math.floor(Math.random() * ALL_TYPES.length)].color, 3
      )
    }

    addFloatText(W / 2, H / 2 - 30, `关卡${currentLevel + 1}通过!`, '#FFD93D', 24)

    audioService.win()

    // 进入下一关或结束
    if (currentLevel + 1 < LEVELS.length) {
      setTimeout(() => initLevel(currentLevel + 1), 1500)
    } else {
      // 全部通关！
      setTimeout(() => {
        gameEnded = true
        engine.setVictory(true)
        engine.endGame()
        onEnd()
      }, 1500)
    }
  }

  function spawnParticles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 3
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1, maxLife: 1,
        color,
        size: 2 + Math.random() * 4,
      })
    }
  }

  function addFloatText(x: number, y: number, text: string, color: string, size = 16) {
    floatingTexts.push({ x, y, text, color, life: 1, maxLife: 1, size })
  }

  // --- 渲染 ---

  function drawCard(card: Card) {
    const cx = card.x + card.w / 2
    const cy = card.y + card.h / 2

    // 入场缩放
    const s = card.scale
    if (s < 0.01) return

    // 抖动
    const shake = card.shakeProgress * Math.sin(card.shakeProgress * 30) * 5

    ctx.save()
    ctx.translate(cx + shake, cy)
    ctx.scale(s, s)

    const hw = card.w / 2
    const hh = card.h / 2

    // 翻牌动画：用 scaleX 模拟
    const flipX = card.isMatched ? 1 : (card.isFlipped ? 1 : 0)
    // flipProgress 动画插值
    card.flipProgress += (flipX - card.flipProgress) * 0.2
    const fp = card.flipProgress
    const scaleX = Math.abs(fp * 2 - 1) // 0→1→0→1 的弧形
    const showFront = fp > 0.5

    ctx.scale(Math.max(0.02, scaleX), 1)

    if (showFront) {
      // === 正面 ===
      // 卡牌背景
      const ct = ALL_TYPES[card.typeIdx]
      const grad = ctx.createLinearGradient(-hw, -hh, -hw, hh)
      grad.addColorStop(0, '#2d2d44')
      grad.addColorStop(1, '#1a1a2e')
      ctx.fillStyle = grad
      roundRect(ctx, -hw, -hh, card.w, card.h, 8)
      ctx.fill()

      // 彩色边框
      ctx.strokeStyle = ct.color
      ctx.lineWidth = 2.5
      roundRect(ctx, -hw, -hh, card.w, card.h, 8)
      ctx.stroke()

      // 发光
      if (card.isMatched) {
        ctx.shadowColor = ct.color
        ctx.shadowBlur = 12
        ctx.strokeStyle = ct.color + '88'
        ctx.lineWidth = 1.5
        roundRect(ctx, -hw, -hh, card.w, card.h, 8)
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      // emoji
      const emojiSize = Math.min(card.w, card.h) * 0.5
      ctx.font = `${emojiSize}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(ct.emoji, 0, -2)

      // 底部名称
      ctx.fillStyle = ct.color
      ctx.font = `bold ${Math.max(9, card.w * 0.16)}px sans-serif`
      ctx.fillText(ct.name, 0, hh - 10)
    } else {
      // === 背面 ===
      const grad = ctx.createLinearGradient(-hw, -hh, -hw, hh)
      grad.addColorStop(0, '#4a3f6b')
      grad.addColorStop(1, '#2d2456')
      ctx.fillStyle = grad
      roundRect(ctx, -hw, -hh, card.w, card.h, 8)
      ctx.fill()

      ctx.strokeStyle = '#6c5ce7'
      ctx.lineWidth = 2
      roundRect(ctx, -hw, -hh, card.w, card.h, 8)
      ctx.stroke()

      // 背面图案：中心问号
      ctx.fillStyle = '#6c5ce755'
      ctx.font = `bold ${Math.min(card.w, card.h) * 0.45}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('?', 0, 0)

      // 四角小装饰
      const dotR = 3
      const d = 8
      ctx.fillStyle = '#6c5ce733'
      const corners: [number, number][] = [[-1, -1], [1, -1], [-1, 1], [1, 1]]
      corners.forEach(([sx, sy]: [number, number]) => {
        ctx.beginPath()
        ctx.arc(sx * (hw - d), sy * (hh - d), dotR, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    ctx.restore()
  }

  function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    c.beginPath()
    c.moveTo(x + r, y)
    c.lineTo(x + w - r, y)
    c.quadraticCurveTo(x + w, y, x + w, y + r)
    c.lineTo(x + w, y + h - r)
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    c.lineTo(x + r, y + h)
    c.quadraticCurveTo(x, y + h, x, y + h - r)
    c.lineTo(x, y + r)
    c.quadraticCurveTo(x, y, x + r, y)
    c.closePath()
  }

  function draw() {
    // 屏幕震动
    ctx.save()
    if (screenShake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * screenShake * 8,
        (Math.random() - 0.5) * screenShake * 8
      )
    }

    // 背景
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
    bgGrad.addColorStop(0, '#0f0c29')
    bgGrad.addColorStop(0.5, '#1a1a3e')
    bgGrad.addColorStop(1, '#24243e')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // 背景装饰：淡淡的圆点
    ctx.globalAlpha = 0.05
    for (let i = 0; i < 20; i++) {
      const bx = ((i * 73 + 17) % W)
      const by = ((i * 47 + 23) % H)
      ctx.fillStyle = '#A29BFE'
      ctx.beginPath()
      ctx.arc(bx, by, 2 + (i % 4), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    // 局内 HUD：得分/连击由 CanvasGamePlay 顶栏展示
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    roundRect(ctx, 10, 8, W - 20, 44, 10)
    ctx.fill()
    ctx.fillStyle = '#A29BFE'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(
      `关卡 ${currentLevel + 1}/${LEVELS.length} · 已配对 ${matchedPairs}/${totalPairs}`,
      W / 2,
      30,
    )

    // 绘制所有卡牌
    cards.forEach(card => drawCard(card))

    // 粒子
    particles.forEach(p => {
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1

    // 浮动文字
    floatingTexts.forEach(ft => {
      ctx.globalAlpha = ft.life
      ctx.fillStyle = ft.color
      ctx.font = `bold ${ft.size}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(ft.text, ft.x, ft.y - (1 - ft.life) * 40)
    })
    ctx.globalAlpha = 1

    ctx.restore()
  }

  function update() {
    const now = Date.now()

    if (gameEnded) return

    // 更新粒子
    particles.forEach(p => {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05
      p.life -= 0.02
    })
    particles = particles.filter(p => p.life > 0)

    // 更新浮动文字
    floatingTexts.forEach(ft => { ft.life -= 0.015 })
    floatingTexts = floatingTexts.filter(ft => ft.life > 0)

    // 屏幕震动衰减
    if (screenShake > 0) screenShake *= 0.9

    // 卡牌抖动衰减
    cards.forEach(c => {
      if (c.shakeProgress > 0) c.shakeProgress *= 0.85
      if (c.shakeProgress < 0.01) c.shakeProgress = 0
      // 缩放动画
      if (c.scale < 1) c.scale = Math.min(1, c.scale + 0.08)
    })
  }

  resizeCanvasForMobile(canvas)
  applyCanvasMobileStyles(canvas)

  const unbindPointer = bindCanvasPointerInput(canvas, (x, y) => {
    handleTap(x, y)
  })

  // --- 主循环 ---

  function loop() {
    if (gameEnded) return
    update()
    draw()
    requestAnimationFrame(loop)
  }

  // 开始游戏
  initLevel(0)
  gameStartTime = Date.now()

  draw()
  loop()

  return () => {
    gameEnded = true
    unbindPointer()
  }
}
