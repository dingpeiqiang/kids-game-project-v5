import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { createPowerupManager, ActivePowerup } from '../services/powerupManager'
import { app } from '../App'

interface Point { x: number; y: number }

interface Food {
  x: number; y: number
  color: string
  type: 'normal' | 'bonus' | 'speed' // 普通/金色加分/蓝色加速
  life: number // 帧数倒计时
  pulse: number // 动画脉冲
}

interface Particle {
  x: number; y: number
  vx: number; vy: number
  color: string
  life: number
  maxLife: number
  size: number
}

interface FloatText {
  x: number; y: number
  text: string
  color: string
  life: number
}

// roundRect polyfill
function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export function initSnake(engine: GameEngine, onEnd: () => void) {
  console.log('[贪吃蛇] 开始初始化...')
  
  const cvs = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  if (!cvs) {
    console.error('[贪吃蛇] 找不到 mainGameCanvas 元素')
    return () => {}
  }
  
  const ctx = cvs.getContext('2d')!
  if (!ctx) {
    console.error('[贪吃蛇] 无法获取 2D 上下文')
    return () => {}
  }
  
  const W = cvs.width
  const H = cvs.height
  
  // 检查 canvas 尺寸
  if (W === 0 || H === 0) {
    console.error('[贪吃蛇] Canvas 尺寸为 0', { width: W, height: H })
    return () => {}
  }
  
  console.log('[贪吃蛇] Canvas 尺寸:', W, 'x', H)

  // 创建道具管理器
  const powerupManager = createPowerupManager('snake')

  // 网格配置
  const CELL = 20
  const COLS = Math.floor(W / CELL)
  const ROWS = Math.floor(H / CELL)
  const OFFSET_X = (W - COLS * CELL) / 2
  const OFFSET_Y = (H - ROWS * CELL) / 2 + 10

  // 蛇
  let snake: Point[] = []
  let dir: Point = { x: 1, y: 0 }
  let nextDir: Point = { x: 1, y: 0 }
  let growCount = 0

  // 食物
  let foods: Food[] = []

  // 道具
  let activePowerups: ActivePowerup[] = []

  // 粒子
  let particles: Particle[] = []
  let floatTexts: FloatText[] = []

  // 游戏状态
  let alive = false  // 初始为false，等待用户开始
  let score = 0
  let combo = 0
  let comboTimer = 0
  let speedLevel = 1
  let moveInterval = 150 // 毫秒
  let lastMoveTime = 0
  let frameCount = 0
  let screenShake = 0
  let gameTime = 0
  let gameStarted = false  // 标记游戏是否真正开始
  let isFirstStart = true  // 标记是否是首次启动

  // 道具效果状态
  let speedBoost = 0
  let invincible = 0
  let scoreMultiplier = 1
  let magnetActive = 0
  
  // ====== HTML道具栏（库存模式）======
  let inventory: string[] = [] // 道具库存
  
  // 道具图标映射
  const powerupIcons: Record<string, string> = {
    'invincible': '⭐',   // 无敌 - 5秒内免疫
    'magnet': '🧲',       // 磁铁 - 自动吸引食物
    'slow': '🐌',         // 减速 - 速度减半
    'score2x': '✨'       // 双倍分数 - 10秒内×2
  }
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id
    }))
    
    app.setupCustomPowerupBar('snake', powerups, inventory, (powerupId) => {
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
      case 'invincible':
        // 无敌 - 5秒内免疫
        invincible = Date.now() + 5000
        audioService.win()
        console.log('[道具] 无敌生效，持续5秒')
        break
        
      case 'magnet':
        // 磁铁 - 自动吸引食物，持续8秒
        magnetActive = Date.now() + 8000
        audioService.win()
        console.log('[道具] 磁铁生效，持续8秒')
        break
        
      case 'slow':
        // 减速 - 速度减半，持续8秒
        ;(window as any).snakeSlow = Date.now() + 8000
        audioService.collect()
        console.log('[道具] 减速生效，持续8秒')
        break
        
      case 'score2x':
        // 双倍分数 - 10秒内×2
        scoreMultiplier = 2
        setTimeout(() => { scoreMultiplier = 1 }, 10000)
        audioService.win()
        console.log('[道具] 双倍分数生效，持续10秒')
        break
    }
    
    return true
  }

  // 背景星星
  const stars = Array.from({ length: 40 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.5 + 0.5,
    speed: Math.random() * 0.3 + 0.1,
    twinkle: Math.random() * Math.PI * 2
  }))

  // 食物颜色配置
  const FOOD_COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4ECDC4', '#FF8E53', '#DDA0DD', '#87CEEB', '#FF69B4']
  const BONUS_COLOR = '#FFD700'
  const SPEED_COLOR = '#00E5FF'

  // ====== 初始化 ======
  function init() {
    console.log('[贪吃蛇] 初始化游戏...')
    
    // 蛇初始位置：屏幕中间，长度4
    // 蛇头在最右边，身体向左延伸，这样向右移动时不会撞到自己
    const startX = Math.floor(COLS / 2)
    const startY = Math.floor(ROWS / 2)
    snake = []
    for (let i = 0; i < 4; i++) {
      snake.push({ x: startX - i, y: startY })
    }
    dir = { x: 1, y: 0 }  // 初始方向向右
    nextDir = { x: 1, y: 0 }
    growCount = 0
    alive = false  // 初始为false，等待用户开始
    score = 0
    combo = 0
    comboTimer = 0
    speedLevel = 1
    moveInterval = 150
    lastMoveTime = 0
    foods = []
    activePowerups = []
    particles = []
    floatTexts = []
    gameStarted = false  // 重置游戏开始状态

    // 清除道具效果
    powerupManager.clearAll()
    speedBoost = 0
    invincible = 0
    scoreMultiplier = 1
    magnetActive = 0
    gameTime = 0

    // 生成初始食物
    spawnFood('normal')
    spawnFood('normal')

    console.log('[贪吃蛇] 初始化完成. 蛇位置:', snake, '食物:', foods.length)
    console.log('[贪吃蛇] COLS:', COLS, 'ROWS:', ROWS, 'OFFSET_X:', OFFSET_X, 'OFFSET_Y:', OFFSET_Y)
    
    // 音效
    audioService.click()
  }

  // ====== 食物生成 ======
  function spawnFood(type: 'normal' | 'bonus' | 'speed') {
    let attempts = 0
    while (attempts < 100) {
      const x = Math.floor(Math.random() * (COLS - 2)) + 1
      const y = Math.floor(Math.random() * (ROWS - 2)) + 1
      // 不能在蛇身上
      if (!snake.some(s => s.x === x && s.y === y) && !foods.some(f => f.x === x && f.y === y)) {
        foods.push({
          x, y,
          color: type === 'bonus' ? BONUS_COLOR : type === 'speed' ? SPEED_COLOR : FOOD_COLORS[Math.floor(Math.random() * FOOD_COLORS.length)],
          type,
          life: type === 'normal' ? Infinity : 300, // 特殊食物5秒后消失
          pulse: 0
        })
        return
      }
      attempts++
    }
  }

  // ====== 道具生成 ======
  function spawnPowerup() {
    if (Math.random() < 0.008) { // 0.8%概率每帧生成
      const powerup = powerupManager.spawnPowerup(
        Math.random() * (W - 60) + 30,
        -25,
        1.2
      )
      if (powerup) activePowerups.push(powerup)
    }
  }

  // ====== 粒子 ======
  function addParticles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5
      const speed = 1.5 + Math.random() * 3
      particles.push({
        x: x * CELL + OFFSET_X + CELL / 2,
        y: y * CELL + OFFSET_Y + CELL / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        size: 2 + Math.random() * 3
      })
    }
  }

  function addFloatText(x: number, y: number, text: string, color: string) {
    floatTexts.push({
      x: x * CELL + OFFSET_X + CELL / 2,
      y: y * CELL + OFFSET_Y,
      text,
      color,
      life: 40
    })
  }

  // ====== 道具效果处理 ======
  function activatePowerupEffect(type: string, config: any) {
    switch (type) {
      case 'speed':
        speedBoost = config.duration
        moveInterval = Math.max(60, moveInterval - 30)
        addFloatText(snake[0].x, snake[0].y - 1, '⚡ 加速!', '#FFD700')
        break
      case 'slow':
        speedBoost = -config.duration
        moveInterval = Math.min(250, moveInterval + 30)
        addFloatText(snake[0].x, snake[0].y - 1, '🐌 减速!', '#74B9FF')
        break
      case 'shrink':
        const removeCount = Math.min(3, snake.length - 3)
        if (removeCount > 0) {
          snake.splice(snake.length - removeCount, removeCount)
          addFloatText(snake[0].x, snake[0].y - 1, '✂️ 缩短!', '#FF6B6B')
        }
        break
      case 'score2x':
        scoreMultiplier = 2
        addFloatText(snake[0].x, snake[0].y - 1, '✨ 双倍分数!', '#FFD93D')
        break
      case 'invincible':
        invincible = config.duration
        addFloatText(snake[0].x, snake[0].y - 1, '🛡️ 无敌!', '#4D96FF')
        break
      case 'magnet':
        magnetActive = config.duration
        addFloatText(snake[0].x, snake[0].y - 1, '🧲 磁铁!', '#A855F7')
        break
    }
  }

  // ====== 移动逻辑 ======
  function moveSnake() {
    if (!alive) {
      console.log('[贪吃蛇] moveSnake 被跳过，alive=false')
      return
    }

    dir = { ...nextDir }
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }
    
    console.log('[贪吃蛇] 移动前：head=', head, 'snake=', JSON.stringify(snake))

    // 撞墙检测
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      console.log('[贪吃蛇] 撞墙! head:', head, 'COLS:', COLS, 'ROWS:', ROWS, 'invincible:', invincible)
      if (invincible > 0) {
        // 无敌模式：穿墙
        if (head.x < 0) head.x = COLS - 1
        else if (head.x >= COLS) head.x = 0
        else if (head.y < 0) head.y = ROWS - 1
        else if (head.y >= ROWS) head.y = 0
      } else {
        gameOver()
        return
      }
    }

    // 撞自身检测
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      console.log('[贪吃蛇] 撞自己! head:', head, 'snake:', snake, 'invincible:', invincible)
      if (invincible <= 0) {
        gameOver()
        return
      }
    }

    snake.unshift(head)

    // 检查吃食物
    let ate = false
    for (let i = foods.length - 1; i >= 0; i--) {
      if (foods[i].x === head.x && foods[i].y === head.y) {
        const food = foods[i]
        foods.splice(i, 1)
        ate = true

        // 计分
        let pts = food.type === 'bonus' ? 50 : food.type === 'speed' ? 30 : 10
        
        // 应用双倍分数
        if (powerupManager.hasEffect('score2x') || scoreMultiplier > 1) {
          pts *= 2
        }

        // 连击
        comboTimer = 120
        combo++
        if (combo >= 3) {
          pts *= 1 + (combo - 2) * 0.3
          if (combo % 5 === 0) {
            engine.triggerRandomBuff?.()
          }
        }

        // 加分
        const finalPts = Math.round(pts)
        engine.addScore(finalPts, head.x * CELL + OFFSET_X, head.y * CELL + OFFSET_Y)
        score += finalPts

        // 特效
        addParticles(head.x, head.y, food.color, food.type === 'bonus' ? 20 : 12)
        addFloatText(head.x, head.y, '+' + finalPts, food.color)
        audioService.pop()

        if (food.type === 'bonus') {
          audioService.win()
          addFloatText(head.x, head.y - 1, '✨ 金色奖励!', '#FFD700')
        } else if (food.type === 'speed') {
          moveInterval = Math.max(60, moveInterval - 15)
          addFloatText(head.x, head.y - 1, '⚡ 加速!', '#00E5FF')
        }

        // 蛇变长
        growCount += food.type === 'bonus' ? 2 : 1

        // 生成新食物
        spawnFood('normal')
        if (Math.random() < 0.15) spawnFood('bonus')
        if (Math.random() < 0.1) spawnFood('speed')

        break
      }
    }

    if (!ate && growCount > 0) {
      growCount--
    } else if (!ate) {
      snake.pop() // 没吃到食物，删尾
    }

    // 随机食物刷新（保持场上至少1个特殊食物）
    if (foods.filter(f => f.type !== 'normal').length === 0 && Math.random() < 0.08) {
      spawnFood(Math.random() < 0.5 ? 'bonus' : 'speed')
    }
  }

  // ====== 游戏结束 ======
  function gameOver() {
    console.log('[贪吃蛇] 游戏结束! alive=false')
    alive = false
    screenShake = 10
    if (snake.length > 0) {
      addParticles(snake[0].x, snake[0].y, '#FF4757', 30)
    }
    audioService.pop()

    // 调用统一的结束回调，显示结束页面
    setTimeout(() => onEnd(), 500)
  }

  // ====== 重新开始游戏 ======
  function restartGame() {
    console.log('[贪吃蛇] 重新开始游戏...')
    init()
    gameStarted = true
    alive = true
    isFirstStart = false
    console.log('[贪吃蛇] 游戏重新开始！alive=true, gameStarted=true')
  }

  // ====== 点击方向控制 ======
  function handleClick(e: MouseEvent | TouchEvent) {
    // 如果游戏还未开始，则开始游戏
    if (!gameStarted) {
      gameStarted = true
      alive = true
      isFirstStart = false
      console.log('[贪吃蛇] 游戏首次开始！alive=true, gameStarted=true')
      audioService.click()
      return
    }
    
    // 游戏进行中才响应方向控制
    if (!alive) return
    const rect = cvs.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    let clientX: number, clientY: number
    if ('touches' in e) {
      if (e.touches.length === 0) return
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    const mx = (clientX - rect.left) * scaleX
    const my = (clientY - rect.top) * scaleY

    // 蛇头屏幕位置
    const headX = snake[0].x * CELL + OFFSET_X + CELL / 2
    const headY = snake[0].y * CELL + OFFSET_Y + CELL / 2
    const dx = mx - headX
    const dy = my - headY

    // 根据点击相对蛇头的方向决定转向
    if (Math.abs(dx) > Math.abs(dy)) {
      // 左右
      if (dx > 0 && dir.x !== -1) nextDir = { x: 1, y: 0 }
      else if (dx < 0 && dir.x !== 1) nextDir = { x: -1, y: 0 }
    } else {
      // 上下
      if (dy > 0 && dir.y !== -1) nextDir = { x: 0, y: 1 }
      else if (dy < 0 && dir.y !== 1) nextDir = { x: 0, y: -1 }
    }
  }

  // 键盘控制（备用）
  function handleKey(e: KeyboardEvent) {
    // 如果游戏还未开始，则开始游戏
    if (!gameStarted) {
      gameStarted = true
      alive = true
      isFirstStart = false
      console.log('[贪吃蛇] 游戏首次开始！alive=true, gameStarted=true')
      audioService.click()
      return
    }
    
    // 游戏进行中才响应方向控制
    if (!alive) return
    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W': if (dir.y !== 1) nextDir = { x: 0, y: -1 }; e.preventDefault(); break
      case 'ArrowDown': case 's': case 'S': if (dir.y !== -1) nextDir = { x: 0, y: 1 }; e.preventDefault(); break
      case 'ArrowLeft': case 'a': case 'A': if (dir.x !== 1) nextDir = { x: -1, y: 0 }; e.preventDefault(); break
      case 'ArrowRight': case 'd': case 'D': if (dir.x !== -1) nextDir = { x: 1, y: 0 }; e.preventDefault(); break
    }
  }

  const gameLayer = document.getElementById('gameCanvas')!
  gameLayer.addEventListener('click', handleClick as EventListener)
  gameLayer.addEventListener('touchstart', handleClick as EventListener, { passive: true })
  document.addEventListener('keydown', handleKey)

  // ====== 主循环 ======
  let lastTime = performance.now()
  let rafId: number
  init()

  function loop(time: number) {
    // 如果游戏已结束，停止循环
    if (!alive && gameStarted) {
      console.log('[贪吃蛇] 游戏已结束，停止渲染循环')
      return
    }
    
    const delta = time - lastTime
    lastTime = time
    frameCount++
    gameTime += delta / 1000
    
    // 道具效果检查（放在最前面）
    const slowActive = (window as any).snakeSlow && Date.now() < (window as any).snakeSlow
    const currentMoveInterval = slowActive ? moveInterval * 2 : moveInterval

    // 更新道具管理器（用于管理Buff效果，如双倍分数、无敌等）
    powerupManager.updateGameTime(delta / 1000)
    powerupManager.update(delta)

    // 贪吃蛇不生成下落道具，道具通过吃食物触发
    // 保留 activePowerups 用于显示效果，但不移除初始化逻辑
    activePowerups = []  // 清空，不生成下落道具

    // 蛇移动 - 只有当游戏真正开始后才移动
    if (gameStarted && alive) {
      lastMoveTime += delta
      if (lastMoveTime >= currentMoveInterval) {
        lastMoveTime = 0
        console.log('[贪吃蛇] 执行移动...')
        moveSnake()
      }
    }

    // 连击计时
    if (comboTimer > 0) {
      comboTimer--
      if (comboTimer === 0) combo = 0
    }

    // 更新道具效果计时器
    if (speedBoost > 0) {
      speedBoost -= delta / 1000
      if (speedBoost <= 0) {
        speedBoost = 0
        moveInterval = Math.max(70, 150 - snake.length * 1.5)
      }
    } else if (speedBoost < 0) {
      speedBoost += delta / 1000
      if (speedBoost >= 0) {
        speedBoost = 0
        moveInterval = Math.max(70, 150 - snake.length * 1.5)
      }
    }
    if (invincible > 0) invincible -= delta / 1000
    if (magnetActive > 0) magnetActive -= delta / 1000
    
    // 双倍分数效果由powerupManager管理
    if (!powerupManager.hasEffect('score2x')) {
      scoreMultiplier = 1
    }

    // 食物倒计时
    for (let i = foods.length - 1; i >= 0; i--) {
      if (foods[i].life !== Infinity) {
        foods[i].life--
        foods[i].pulse += 0.15
        if (foods[i].life <= 0) {
          foods.splice(i, 1)
          // 补充一个普通食物
          if (foods.length < 2) spawnFood('normal')
        }
      } else {
        foods[i].pulse += 0.05
      }
      
      // 磁铁效果：吸引食物
      if (magnetActive > 0 && snake.length > 0) {
        const head = snake[0]
        const dx = head.x - foods[i].x
        const dy = head.y - foods[i].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 8 && dist > 0) {
          foods[i].x += dx / dist * 0.3
          foods[i].y += dy / dist * 0.3
        }
      }
    }

    // 粒子更新
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.96
      p.vy *= 0.96
      p.life--
      if (p.life <= 0) particles.splice(i, 1)
    }

    // 浮动文字
    for (let i = floatTexts.length - 1; i >= 0; i--) {
      const ft = floatTexts[i]
      ft.y -= 1
      ft.life--
      if (ft.life <= 0) floatTexts.splice(i, 1)
    }

    // 屏幕震动衰减
    if (screenShake > 0) screenShake *= 0.85
    if (screenShake < 0.5) screenShake = 0

    // 难度：蛇越长越快
    if (alive) {
      const targetInterval = Math.max(70, 150 - snake.length * 1.5)
      moveInterval = moveInterval + (targetInterval - moveInterval) * 0.02
    }
    
    // 道具自动获取：每300分获得一个道具
    const powerupThreshold = Math.floor(score / 300)
    if (powerupThreshold > 0 && powerupThreshold !== (window as any).snakeLastPowerupGiven) {
      ;(window as any).snakeLastPowerupGiven = powerupThreshold
      const powerups = ['invincible', 'magnet', 'slow', 'score2x']
      const random = powerups[Math.floor(Math.random() * powerups.length)]
      inventory.push(random)
            console.log('[道具] 获得道具:', random)
    }

    // ====== 渲染 ======
    ctx.save()
    if (screenShake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * screenShake * 2,
        (Math.random() - 0.5) * screenShake * 2
      )
    }

    // 背景
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
    bgGrad.addColorStop(0, '#0a1a0a')
    bgGrad.addColorStop(0.5, '#0d2818')
    bgGrad.addColorStop(1, '#061208')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // 背景星星
    stars.forEach(s => {
      s.twinkle += 0.03
      ctx.globalAlpha = 0.3 + Math.sin(s.twinkle) * 0.2
      ctx.fillStyle = '#A8E6CF'
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1

    // 游戏区域背景
    ctx.fillStyle = 'rgba(0, 20, 10, 0.5)'
    ctx.fillRect(OFFSET_X, OFFSET_Y, COLS * CELL, ROWS * CELL)

    // 网格线
    ctx.strokeStyle = 'rgba(46, 204, 113, 0.08)'
    ctx.lineWidth = 0.5
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath()
      ctx.moveTo(OFFSET_X + x * CELL, OFFSET_Y)
      ctx.lineTo(OFFSET_X + x * CELL, OFFSET_Y + ROWS * CELL)
      ctx.stroke()
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath()
      ctx.moveTo(OFFSET_X, OFFSET_Y + y * CELL)
      ctx.lineTo(OFFSET_X + COLS * CELL, OFFSET_Y + y * CELL)
      ctx.stroke()
    }

    // 边框
    ctx.strokeStyle = 'rgba(46, 204, 113, 0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(OFFSET_X, OFFSET_Y, COLS * CELL, ROWS * CELL)

    // 食物
    foods.forEach(f => {
      const fx = f.x * CELL + OFFSET_X + CELL / 2
      const fy = f.y * CELL + OFFSET_Y + CELL / 2
      const pulseR = CELL * 0.4 + Math.sin(f.pulse) * 2

      // 光晕
      const glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, CELL)
      glow.addColorStop(0, f.color + '44')
      glow.addColorStop(1, f.color + '00')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(fx, fy, CELL, 0, Math.PI * 2)
      ctx.fill()

      // 食物本体
      ctx.shadowColor = f.color
      ctx.shadowBlur = 8
      const foodGrad = ctx.createRadialGradient(fx - 2, fy - 2, 1, fx, fy, pulseR)
      foodGrad.addColorStop(0, '#fff')
      foodGrad.addColorStop(0.4, f.color)
      foodGrad.addColorStop(1, f.color + '88')
      ctx.fillStyle = foodGrad
      ctx.beginPath()
      ctx.arc(fx, fy, pulseR, 0, Math.PI * 2)
      ctx.fill()

      // 特殊食物图标
      if (f.type === 'bonus') {
        ctx.shadowBlur = 0
        ctx.fillStyle = '#8B6914'
        ctx.font = 'bold 10px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('★', fx, fy)
      } else if (f.type === 'speed') {
        ctx.shadowBlur = 0
        ctx.fillStyle = '#006064'
        ctx.font = 'bold 10px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('⚡', fx, fy)
      }

      // 即将消失闪烁
      if (f.life !== Infinity && f.life < 60 && Math.floor(f.life / 8) % 2 === 0) {
        ctx.globalAlpha = 0.3
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.beginPath()
        ctx.arc(fx, fy, pulseR + 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }
      ctx.shadowBlur = 0
    })

    // 蛇身（从尾到头渲染，头在最上层）
    const snakeLen = snake.length
    for (let i = snakeLen - 1; i >= 0; i--) {
      const s = snake[i]
      const sx = s.x * CELL + OFFSET_X
      const sy = s.y * CELL + OFFSET_Y
      const t = i / snakeLen // 0=头, 1=尾

      // 颜色渐变：头部亮绿 → 尾部深绿
      const r = Math.round(30 + (1 - t) * 16)
      const g = Math.round(180 + (1 - t) * 50)
      const b = Math.round(80 + (1 - t) * 33)
      const bodyColor = `rgb(${r},${g},${b})`

      if (i === 0) {
        // 蛇头 - 带眼睛
        ctx.shadowColor = '#2ECC71'
        ctx.shadowBlur = 10
        const headGrad = ctx.createRadialGradient(sx + CELL / 2 - 2, sy + CELL / 2 - 2, 1, sx + CELL / 2, sy + CELL / 2, CELL * 0.55)
        headGrad.addColorStop(0, '#6BCB77')
        headGrad.addColorStop(1, '#27AE60')
        ctx.fillStyle = headGrad
        roundedRect(ctx, sx + 1, sy + 1, CELL - 2, CELL - 2, 5)
        ctx.fill()
        ctx.shadowBlur = 0

        // 眼睛
        const eyeSize = 3
        ctx.fillStyle = '#fff'
        if (dir.x === 1) {
          ctx.beginPath(); ctx.arc(sx + 14, sy + 6, eyeSize, 0, Math.PI * 2); ctx.fill()
          ctx.beginPath(); ctx.arc(sx + 14, sy + 14, eyeSize, 0, Math.PI * 2); ctx.fill()
          ctx.fillStyle = '#1a1a2e'
          ctx.beginPath(); ctx.arc(sx + 15, sy + 6, 1.5, 0, Math.PI * 2); ctx.fill()
          ctx.beginPath(); ctx.arc(sx + 15, sy + 14, 1.5, 0, Math.PI * 2); ctx.fill()
        } else if (dir.x === -1) {
          ctx.beginPath(); ctx.arc(sx + 6, sy + 6, eyeSize, 0, Math.PI * 2); ctx.fill()
          ctx.beginPath(); ctx.arc(sx + 6, sy + 14, eyeSize, 0, Math.PI * 2); ctx.fill()
          ctx.fillStyle = '#1a1a2e'
          ctx.beginPath(); ctx.arc(sx + 5, sy + 6, 1.5, 0, Math.PI * 2); ctx.fill()
          ctx.beginPath(); ctx.arc(sx + 5, sy + 14, 1.5, 0, Math.PI * 2); ctx.fill()
        } else if (dir.y === -1) {
          ctx.beginPath(); ctx.arc(sx + 6, sy + 6, eyeSize, 0, Math.PI * 2); ctx.fill()
          ctx.beginPath(); ctx.arc(sx + 14, sy + 6, eyeSize, 0, Math.PI * 2); ctx.fill()
          ctx.fillStyle = '#1a1a2e'
          ctx.beginPath(); ctx.arc(sx + 6, sy + 5, 1.5, 0, Math.PI * 2); ctx.fill()
          ctx.beginPath(); ctx.arc(sx + 14, sy + 5, 1.5, 0, Math.PI * 2); ctx.fill()
        } else {
          ctx.beginPath(); ctx.arc(sx + 6, sy + 14, eyeSize, 0, Math.PI * 2); ctx.fill()
          ctx.beginPath(); ctx.arc(sx + 14, sy + 14, eyeSize, 0, Math.PI * 2); ctx.fill()
          ctx.fillStyle = '#1a1a2e'
          ctx.beginPath(); ctx.arc(sx + 6, sy + 15, 1.5, 0, Math.PI * 2); ctx.fill()
          ctx.beginPath(); ctx.arc(sx + 14, sy + 15, 1.5, 0, Math.PI * 2); ctx.fill()
        }

        // 受伤闪烁
        if (!alive && Math.floor(frameCount / 4) % 2 === 0) {
          ctx.fillStyle = 'rgba(255, 71, 87, 0.5)'
          roundedRect(ctx, sx + 1, sy + 1, CELL - 2, CELL - 2, 5)
          ctx.fill()
        }
      } else {
        // 蛇身
        ctx.fillStyle = bodyColor
        roundedRect(ctx, sx + 2, sy + 2, CELL - 4, CELL - 4, 4)
        ctx.fill()

        // 身体光泽
        ctx.fillStyle = 'rgba(255,255,255,0.1)'
        roundedRect(ctx, sx + 3, sy + 3, CELL - 8, (CELL - 4) / 2, 3)
        ctx.fill()
      }
    }

    // 粒子
    particles.forEach(p => {
      ctx.globalAlpha = p.life / p.maxLife
      ctx.fillStyle = p.color
      ctx.shadowColor = p.color
      ctx.shadowBlur = 4
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.shadowBlur = 0
    ctx.globalAlpha = 1

    // 浮动文字
    floatTexts.forEach(ft => {
      ctx.globalAlpha = ft.life / 40
      ctx.fillStyle = ft.color
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(ft.text, ft.x, ft.y)
    })
    ctx.globalAlpha = 1

    // 绘制道具
    activePowerups.forEach(powerup => {
      powerupManager.drawPowerup(ctx, powerup)
    })
    
    // 绘制道具粒子
    powerupManager.drawParticles(ctx)

    // HUD - 顶部信息栏
    ctx.fillStyle = 'rgba(0, 20, 10, 0.7)'
    ctx.fillRect(0, 0, W, 30)

    // 分数
    ctx.fillStyle = '#2ECC71'
    ctx.font = 'bold 13px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(`🐍 长度: ${snake.length}`, 10, 15)

    ctx.fillStyle = '#FFD700'
    ctx.textAlign = 'center'
    ctx.fillText(`⭐ ${score}`, W / 2, 15)

    // 连击
    if (combo >= 3) {
      ctx.fillStyle = '#FF6B6B'
      ctx.textAlign = 'right'
      ctx.fillText(`🔥 连击 x${combo}`, W - 10, 15)
    }
    
    // 绘制激活的道具效果
    powerupManager.drawUI(ctx, 10, 35)

    // 底部操作提示
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('👆 点击方向控制蛇 | 也可用方向键/WASD', W / 2, H - 12)

    // 显示开始提示（仅在游戏未开始时）
    if (!gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(0, H / 2 - 80, W, 160)

      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 28px sans-serif'
      ctx.textAlign = 'center'
      ctx.shadowColor = '#FFD700'
      ctx.shadowBlur = 10
      ctx.fillText('🐍 贪吃蛇', W / 2, H / 2 - 40)
      ctx.shadowBlur = 0

      ctx.fillStyle = '#fff'
      ctx.font = '18px sans-serif'
      ctx.fillText('点击屏幕或按任意键开始', W / 2, H / 2 + 10)
      
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font = '14px sans-serif'
      ctx.fillText('使用方向键/WASD或点击控制方向', W / 2, H / 2 + 40)
    }

    ctx.restore()
    rafId = requestAnimationFrame(loop)
  }
  
      
  rafId = requestAnimationFrame(loop)

  // 清理
  return () => {
    cancelAnimationFrame(rafId)
    gameLayer.removeEventListener('click', handleClick as EventListener)
    gameLayer.removeEventListener('touchstart', handleClick as EventListener)
    document.removeEventListener('keydown', handleKey)
  }
}
