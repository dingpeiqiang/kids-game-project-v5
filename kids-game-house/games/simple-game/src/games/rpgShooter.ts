import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { app } from '../App'
import { RPG_SHOOTER_POWERUPS } from '../data/powerups'

export function initRpgShooter(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  if (!canvas) return
  const W = 400, H = 600
  const ctx = canvas.getContext('2d')!
  if (!ctx) return
  ctx.imageSmoothingEnabled = false

  // === 配置 ===
  const BULLET_SPEED = 7
  const PLAYER_SPEED = 4
  const ENEMY_BASE_SPEED = 1.0
  const STAR_COUNT = 50
  const GAME_DURATION = 90

  // 玩家等级属性表
  const LEVEL_STATS = [
    { hp: 5, atk: 1, speed: 4 },   // Lv1
    { hp: 6, atk: 1, speed: 4 },   // Lv2
    { hp: 7, atk: 2, speed: 4 },   // Lv3
    { hp: 8, atk: 2, speed: 5 },   // Lv4
    { hp: 9, atk: 3, speed: 5 },   // Lv5
    { hp: 10, atk: 3, speed: 5 },  // Lv6
    { hp: 12, atk: 4, speed: 6 }, // Lv7
    { hp: 14, atk: 4, speed: 6 }, // Lv8
    { hp: 16, atk: 5, speed: 6 }, // Lv9
    { hp: 20, atk: 6, speed: 7 }, // Lv10 Max
  ]

  // 敌人类型
  const ENEMY_TYPES = [
    { w: 24, h: 24, hp: 1, score: 10, exp: 5, color: '#FF6B6B', shape: 'circle', speedMult: 1.0 },
    { w: 28, h: 26, hp: 2, score: 20, exp: 12, color: '#FFA502', shape: 'diamond', speedMult: 0.9 },
    { w: 32, h: 30, hp: 4, score: 50, exp: 30, color: '#FF4757', shape: 'hex', speedMult: 0.7 },
    { w: 40, h: 36, hp: 8, score: 120, exp: 80, color: '#9B59B6', shape: 'boss', speedMult: 0.5 },
  ]

  // 掉落物类型（地面拾取：hp/exp/powerup箱）
  const DROP_TYPES = [
    { type: 'hp',      icon: '💚', color: '#00E676', chance: 0.18 },
    { type: 'exp',     icon: '✨', color: '#FFD700', chance: 0.22 },
    { type: 'powerup', icon: '📦', color: '#A855F7', chance: 0.20 }, // 道具箱
  ]

  // === 状态 ===
  let playerX = W / 2, playerY = H / 2
  let playerLevel = 1
  let playerHP = 5, playerMaxHP = 5
  let playerATK = 1
  let playerExp = 0, expToLevel = 20
  let invincible = 0
  let shootAngle = -Math.PI / 2
  let lastShot = 0
  const SHOOT_CD = 250

  let bullets: { x: number; y: number; vx: number; vy: number; atk: number; color: string; tracking: boolean }[] = []
  let enemies: { x: number; y: number; w: number; h: number; hp: number; maxHp: number; score: number; exp: number; color: string; shape: string; speed: number; vx: number; vy: number; type: number }[] = []
  let particles: { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[] = []
  let floatTexts: { text: string; x: number; y: number; life: number; color: string; size: number }[] = []
  let drops: { x: number; y: number; type: string; icon: string; color: string; life: number; vy: number; powerupType?: string }[] = []
  let stars: { x: number; y: number; speed: number; size: number; bright: number }[] = []

  let gameStarted = false
  let gameEnded = false
  let elapsed = 0
  let startTime = Date.now()
  let difficulty = 1
  let waveCount = 0
  let spawnTimer = 0
  let shakeAmt = 0
  let screenFlash = 0
  let score = 0
  let combo = 0
  let comboTimer = 0
  
  // ====== HTML道具栏（库存模式）======
  let inventory: string[] = [] // 道具库存（存放道具id字符串）
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = RPG_SHOOTER_POWERUPS.map(p => ({
      id: p.id,
      icon: p.icon,
      name: p.name
    }))
    
    app.setupCustomPowerupBar('rpgShooter', powerups, inventory, (powerupId) => {
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
    
    switch (type) {
      case 'nuke':
        // ☢️ 核弹：全屏爆炸，消灭所有敌人，每个给分
        enemies.forEach(e => {
          for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2
            const spd = Math.random() * 7 + 2
            particles.push({ x: e.x, y: e.y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, life: 1, color: e.color, size: 3 + Math.random() * 4 })
          }
          const bonus = e.score * 2
          score += bonus
          engine.addScore(bonus, e.x, e.y)
          floatTexts.push({ text: `💥+${bonus}`, x: e.x, y: e.y - 10, life: 1, color: '#FF4757', size: 14 })
        })
        enemies.length = 0
        shakeAmt = 20
        screenFlash = 0.5
        floatTexts.push({ text: '☢️ 核弹清场!', x: W / 2, y: H / 2, life: 2, color: '#FF4757', size: 26 })
        break

      case 'laser':
        // ⚡ 激光弹幕：持续 3 秒，每帧在 update 里额外射击
        laserTimer = 3
        floatTexts.push({ text: '⚡ 激光弹幕!', x: playerX, y: playerY - 40, life: 1.5, color: '#FFD700', size: 20 })
        break

      case 'freeze':
        // ❄️ 时间冻结：敌人静止 4 秒
        freezeTimer = 4
        floatTexts.push({ text: '❄️ 时间冻结!', x: W / 2, y: H / 2, life: 1.5, color: '#74B9FF', size: 22 })
        screenFlash = 0.15
        break

      case 'shield':
        // 🛡️ 护盾：叠加 3 层
        shieldCount += 3
        floatTexts.push({ text: `🛡️ 护盾×${shieldCount}`, x: playerX, y: playerY - 40, life: 1.5, color: '#4D96FF', size: 18 })
        break

      case 'score2x':
        // ✨ 双倍分数：10 秒
        score2xTimer = 10
        floatTexts.push({ text: '✨ 双倍分数!', x: W / 2, y: H / 2 - 20, life: 1.5, color: '#FFD93D', size: 22 })
        break

      case 'clone':
        // 👾 分身弹：持续 5 秒，子弹击中时额外分裂
        cloneTimer = 5
        floatTexts.push({ text: '👾 分身弹!', x: playerX, y: playerY - 40, life: 1.5, color: '#A855F7', size: 18 })
        break
    }
    
    audioService.win()
    return true
  }

  // 速度加成道具
  let speedBoost = 0
  let atkBoost = 0

  // ====== 道具效果状态 ======
  let laserTimer = 0      // 激光弹幕剩余秒数
  let freezeTimer = 0     // 时间冻结剩余秒数
  let cloneTimer = 0      // 分身弹剩余秒数
  let score2xTimer = 0    // 双倍分数剩余秒数
  let shieldCount = 0     // 护盾层数（可叠加）

  // 星空背景初始化
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      speed: 0.3 + Math.random() * 1.5,
      size: 0.5 + Math.random() * 2,
      bright: 0.3 + Math.random() * 0.7,
    })
  }

  // 初始化玩家属性
  function initPlayerStats() {
    const stats = LEVEL_STATS[Math.min(playerLevel - 1, LEVEL_STATS.length - 1)]
    playerMaxHP = stats.hp
    playerHP = Math.min(playerHP, playerMaxHP)
    playerATK = stats.atk
    const currentStats = LEVEL_STATS[Math.min(playerLevel - 2, LEVEL_STATS.length - 1)]
    if (playerLevel > 1 && currentStats) {
      playerMaxHP = Math.max(playerMaxHP, currentStats.hp)
    }
  }

  // 升级
  function levelUp() {
    playerLevel++
    expToLevel = Math.floor(20 * Math.pow(1.5, playerLevel - 1))
    const stats = LEVEL_STATS[Math.min(playerLevel - 1, LEVEL_STATS.length - 1)]
    playerMaxHP = stats.hp
    playerHP = playerMaxHP
    playerATK = stats.atk

    floatTexts.push({
      text: `🎉 Lv.${playerLevel}!`,
      x: playerX, y: playerY - 30,
      life: 1.5, color: '#FFD700', size: 24
    })

    // 升级特效
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 / 20) * i
      particles.push({
        x: playerX, y: playerY,
        vx: Math.cos(angle) * 4,
        vy: Math.sin(angle) * 4,
        life: 1, color: '#FFD700', size: 4
      })
    }

    shakeAmt = 3
    audioService.win()
  }

  // 生成敌人
  function spawnEnemy() {
    const side = Math.floor(Math.random() * 4)
    let x, y, vx, vy

    if (side === 0) { // 从上方
      x = Math.random() * W
      y = -30
      vx = (playerX - x) * 0.01 + (Math.random() - 0.5) * 1
      vy = ENEMY_BASE_SPEED + Math.random() * difficulty * 0.3
    } else if (side === 1) { // 从左
      x = -30
      y = Math.random() * H * 0.6
      vx = ENEMY_BASE_SPEED + Math.random() * difficulty * 0.3
      vy = (playerY - y) * 0.01 + (Math.random() - 0.5) * 0.5
    } else if (side === 2) { // 从右
      x = W + 30
      y = Math.random() * H * 0.6
      vx = -(ENEMY_BASE_SPEED + Math.random() * difficulty * 0.3)
      vy = (playerY - y) * 0.01 + (Math.random() - 0.5) * 0.5
    } else { // 从下方
      x = Math.random() * W
      y = H + 30
      vx = (playerX - x) * 0.01 + (Math.random() - 0.5) * 1
      vy = -(ENEMY_BASE_SPEED + Math.random() * difficulty * 0.3)
    }

    // 根据难度选择敌人类型
    let typeIdx = 0
    const r = Math.random()
    if (difficulty >= 4 && r < 0.1) typeIdx = 3      // Boss
    else if (difficulty >= 3 && r < 0.25) typeIdx = 2 // 重型
    else if (difficulty >= 2 && r < 0.5) typeIdx = 1  // 中型

    const type = ENEMY_TYPES[typeIdx]
    enemies.push({
      x, y,
      w: type.w, h: type.h,
      hp: type.hp + Math.floor(difficulty / 2),
      maxHp: type.hp + Math.floor(difficulty / 2),
      score: type.score, exp: type.exp,
      color: type.color,
      shape: type.shape,
      speed: type.speedMult * (ENEMY_BASE_SPEED + difficulty * 0.2),
      vx, vy, type: typeIdx
    })
  }

  // 生成掉落
  function spawnDrop(x: number, y: number) {
    for (const dropDef of DROP_TYPES) {
      if (Math.random() < dropDef.chance) {
        const drop: typeof drops[0] = {
          x, y,
          type: dropDef.type,
          icon: dropDef.icon,
          color: dropDef.color,
          life: 1,
          vy: 0.5 + Math.random() * 0.5
        }
        // 道具箱随机绑定一种 rpgShooter 道具
        if (dropDef.type === 'powerup') {
          const p = RPG_SHOOTER_POWERUPS[Math.floor(Math.random() * RPG_SHOOTER_POWERUPS.length)]
          drop.powerupType = p.id
          drop.icon = p.icon
          drop.color = p.color
        }
        drops.push(drop)
        break
      }
    }
  }

  // 射击
  function shoot() {
    const now = Date.now()
    if (now - lastShot < SHOOT_CD) return
    lastShot = now

    const effectiveATK = playerATK + Math.floor(atkBoost)
    const bulletColor = atkBoost > 0 ? '#FF6B6B' : '#00E5FF'

    // 寻找最近的敌人
    let nearestEnemy: typeof enemies[0] | null = null
    let nearestDist = Infinity
    for (const e of enemies) {
      const dx = e.x - playerX
      const dy = e.y - playerY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < nearestDist) {
        nearestDist = dist
        nearestEnemy = e
      }
    }

    let angle: number
    let tracking = false
    if (nearestEnemy) {
      // 追踪最近敌人
      angle = Math.atan2(nearestEnemy.y - playerY, nearestEnemy.x - playerX)
      tracking = true
    } else {
      // 无敌人时朝鼠标方向射击
      const dx = targetX - playerX
      const dy = targetY - playerY
      angle = Math.atan2(dy, dx)
    }

    bullets.push({
      x: playerX, y: playerY,
      vx: Math.cos(angle) * BULLET_SPEED,
      vy: Math.sin(angle) * BULLET_SPEED,
      atk: effectiveATK,
      color: bulletColor,
      tracking
    })

    audioService.click()
  }

  // 爆炸粒子
  function explode(x: number, y: number, color: string, count: number, force: number = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * force + 1
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
        size: 1.5 + Math.random() * 3,
      })
    }
  }

  // 碰撞检测
  function rectCollide(ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number): boolean {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
  }

  // === 输入 ===
  let targetX = W / 2, targetY = H / 2
  let touchX: number | null = null
  let keys: { [key: string]: boolean } = {}

  function handleMove(e: MouseEvent | Touch) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    const clientX = 'clientX' in e ? e.clientX : 0
    const clientY = 'clientY' in e ? e.clientY : 0
    targetX = (clientX - rect.left) * scaleX
    targetY = (clientY - rect.top) * scaleY
  }

  function handleTap(e: MouseEvent | Touch) {
    if (!gameStarted) {
      gameStarted = true
      startTime = Date.now()
    }
    handleMove(e)
  }

  // 键盘输入
  document.onkeydown = (e) => {
    keys[e.key.toLowerCase()] = true
    if (!gameStarted) {
      gameStarted = true
      startTime = Date.now()
    }
  }
  document.onkeyup = (e) => {
    keys[e.key.toLowerCase()] = false
  }

  canvas.onclick = (e) => handleTap(e)
  canvas.onmousemove = (e) => handleMove(e)
  canvas.ontouchstart = (e) => {
    e.preventDefault()
    if (e.touches.length > 0) {
      handleTap(e.touches[0])
      handleMove(e.touches[0])
    }
  }
  canvas.ontouchmove = (e) => {
    e.preventDefault()
    if (e.touches.length > 0) handleMove(e.touches[0])
  }
  canvas.ontouchend = (e) => {
    e.preventDefault()
  }

  // === 绘制函数 ===
  function drawPlayer() {
    if (invincible > 0 && Math.floor(invincible * 10) % 2 === 0) return

    ctx.save()
    ctx.translate(playerX, playerY)

    const currentSpeed = PLAYER_SPEED + speedBoost * 0.5
    const stats = LEVEL_STATS[Math.min(playerLevel - 1, LEVEL_STATS.length - 1)]
    const effectiveSpeed = stats.speed + speedBoost * 0.5

    // 移动玩家
    let dx = 0, dy = 0
    if (keys['w'] || keys['arrowup']) dy -= 1
    if (keys['s'] || keys['arrowdown']) dy += 1
    if (keys['a'] || keys['arrowleft']) dx -= 1
    if (keys['d'] || keys['arrowright']) dx += 1

    // 鼠标/触摸方向
    const mouseDx = targetX - playerX
    const mouseDy = targetY - playerY
    const mouseDist = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy)

    if (mouseDist > 10) {
      dx += mouseDx / mouseDist
      dy += mouseDy / mouseDist
    }

    // 标准化并移动
    const moveDist = Math.sqrt(dx * dx + dy * dy)
    if (moveDist > 0) {
      playerX += (dx / moveDist) * effectiveSpeed
      playerY += (dy / moveDist) * effectiveSpeed
    }

    // 边界限制
    playerX = Math.max(20, Math.min(W - 20, playerX))
    playerY = Math.max(20, Math.min(H - 20, playerY))

    // 更新射击角度
    if (mouseDist > 5) {
      shootAngle = Math.atan2(mouseDy, mouseDx)
    }

    // 玩家朝向
    ctx.rotate(shootAngle + Math.PI / 2)

    // 引擎火焰
    const flicker = Math.random() * 4
    const flameGrad = ctx.createLinearGradient(0, 12, 0, 22 + flicker)
    flameGrad.addColorStop(0, '#00E5FF')
    flameGrad.addColorStop(0.5, '#FF6B6B')
    flameGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = flameGrad
    ctx.beginPath()
    ctx.moveTo(-6, 12)
    ctx.lineTo(0, 22 + flicker)
    ctx.lineTo(6, 12)
    ctx.fill()

    // 角色主体（八边形）
    const r = 14
    ctx.fillStyle = speedBoost > 0 ? '#00E5FF' : '#45B7D1'
    ctx.shadowColor = speedBoost > 0 ? '#00E5FF' : '#45B7D1'
    ctx.shadowBlur = 8
    ctx.beginPath()
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i - Math.PI / 8
      const px = Math.cos(angle) * r
      const py = Math.sin(angle) * r
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fill()
    ctx.shadowBlur = 0

    // 内部装饰
    ctx.fillStyle = '#2E86AB'
    ctx.beginPath()
    ctx.arc(0, 0, 6, 0, Math.PI * 2)
    ctx.fill()

    // 核心发光
    ctx.fillStyle = atkBoost > 0 ? '#FF6B6B' : '#00E5FF'
    ctx.shadowColor = ctx.fillStyle
    ctx.shadowBlur = 6
    ctx.beginPath()
    ctx.arc(0, 0, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // 武器指示
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.moveTo(0, -r - 6)
    ctx.lineTo(-3, -r)
    ctx.lineTo(3, -r)
    ctx.closePath()
    ctx.fill()

    ctx.restore()

    // 等级显示
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`Lv.${playerLevel}`, playerX, playerY - 22)
  }

  function drawEnemy(e: typeof enemies[0]) {
    ctx.save()
    ctx.translate(e.x, e.y)

    const size = Math.max(e.w, e.h) / 2

    if (e.shape === 'circle') {
      ctx.fillStyle = e.color
      ctx.shadowColor = e.color
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.arc(0, 0, size, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // 眼睛
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(-3, -2, 2.5, 0, Math.PI * 2)
      ctx.arc(3, -2, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#333'
      ctx.beginPath()
      ctx.arc(-3, -1, 1.2, 0, Math.PI * 2)
      ctx.arc(3, -1, 1.2, 0, Math.PI * 2)
      ctx.fill()
    } else if (e.shape === 'diamond') {
      ctx.fillStyle = e.color
      ctx.shadowColor = e.color
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.moveTo(0, -size)
      ctx.lineTo(size, 0)
      ctx.lineTo(0, size)
      ctx.lineTo(-size, 0)
      ctx.closePath()
      ctx.fill()
      ctx.shadowBlur = 0

      ctx.fillStyle = '#fff'
      ctx.globalAlpha = 0.6
      ctx.beginPath()
      ctx.arc(0, 0, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    } else if (e.shape === 'hex') {
      ctx.fillStyle = e.color
      ctx.shadowColor = e.color
      ctx.shadowBlur = 10
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6
        const px = Math.cos(angle) * size
        const py = Math.sin(angle) * size
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
      ctx.shadowBlur = 0

      // 血量条
      if (e.hp < e.maxHp) {
        const barW = e.w
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fillRect(-barW / 2, -size - 8, barW, 3)
        ctx.fillStyle = '#00E676'
        ctx.fillRect(-barW / 2, -size - 8, barW * (e.hp / e.maxHp), 3)
      }

      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(-4, -2, 3, 0, Math.PI * 2)
      ctx.arc(4, -2, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#333'
      ctx.beginPath()
      ctx.arc(-4, -1, 1.8, 0, Math.PI * 2)
      ctx.arc(4, -1, 1.8, 0, Math.PI * 2)
      ctx.fill()
    } else if (e.shape === 'boss') {
      // Boss - 三角形
      ctx.fillStyle = e.color
      ctx.shadowColor = e.color
      ctx.shadowBlur = 15
      ctx.beginPath()
      ctx.moveTo(0, -size)
      ctx.lineTo(size, size * 0.8)
      ctx.lineTo(-size, size * 0.8)
      ctx.closePath()
      ctx.fill()
      ctx.shadowBlur = 0

      // 血量条
      const barW = e.w + 10
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(-barW / 2, -size - 12, barW, 5)
      ctx.fillStyle = '#FF4757'
      ctx.fillRect(-barW / 2, -size - 12, barW * (e.hp / e.maxHp), 5)

      // 眼睛
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(-5, 0, 4, 0, Math.PI * 2)
      ctx.arc(5, 0, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#FF0000'
      ctx.beginPath()
      ctx.arc(-5, 0, 2, 0, Math.PI * 2)
      ctx.arc(5, 0, 2, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#0a0a1e')
    grad.addColorStop(0.5, '#0d1b2a')
    grad.addColorStop(1, '#1b2838')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // 星星
    for (const s of stars) {
      s.y += s.speed * 0.5
      if (s.y > H) { s.y = -2; s.x = Math.random() * W }

      ctx.fillStyle = `rgba(255,255,255,${s.bright})`
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
      ctx.fill()
    }

    // 网格线（科技感）
    ctx.strokeStyle = 'rgba(0,229,255,0.05)'
    ctx.lineWidth = 1
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }
  }

  function drawHUD() {
    ctx.save()

    // 时间
    const timeLeft = Math.max(0, GAME_DURATION - elapsed)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'left'
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 3
    ctx.fillText(`⏱ ${Math.ceil(timeLeft)}s`, 12, 28)
    ctx.shadowBlur = 0

    // 分数
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`★ ${score}`, W - 12, 28)

    // 等级和经验条
    const expBarW = 120, expBarH = 10
    const expX = W / 2 - expBarW / 2, expY = 15
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.fillRect(expX, expY, expBarW, expBarH)
    ctx.fillStyle = '#9B59B6'
    ctx.fillRect(expX, expY, expBarW * (playerExp / expToLevel), expBarH)
    ctx.strokeStyle = '#9B59B6'
    ctx.lineWidth = 1
    ctx.strokeRect(expX, expY, expBarW, expBarH)

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`Lv.${playerLevel}`, W / 2, expY - 4)

    // 生命值
    const hpBarW = 80, hpBarH = 8
    const hpX = 12, hpY = H - 15
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(hpX, hpY - hpBarH, hpBarW, hpBarH)
    const hpRatio = playerHP / playerMaxHP
    const hpColor = hpRatio > 0.6 ? '#00E676' : hpRatio > 0.3 ? '#FFA502' : '#FF4757'
    ctx.fillStyle = hpColor
    ctx.fillRect(hpX, hpY - hpBarH, hpBarW * hpRatio, hpBarH)

    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`❤️ ${playerHP}/${playerMaxHP}`, hpX, hpY - hpBarH - 4)

    // 攻击加成显示
    if (atkBoost > 0) {
      ctx.fillStyle = '#FF6B6B'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`🔥 ATK+${atkBoost.toFixed(1)}`, W - 12, H - 20)
    }

    // 速度加成显示
    if (speedBoost > 0) {
      ctx.fillStyle = '#00E5FF'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`⚡ SPD+${speedBoost.toFixed(1)}`, W - 12, H - 35)
    }

    // 道具效果状态指示器（左下角）
    let effectY = H - 50
    ctx.textAlign = 'left'
    ctx.font = 'bold 12px sans-serif'
    if (freezeTimer > 0) {
      ctx.fillStyle = '#74B9FF'
      ctx.fillText(`❄️ 冻结 ${freezeTimer.toFixed(1)}s`, 12, effectY)
      effectY -= 18
    }
    if (laserTimer > 0) {
      ctx.fillStyle = '#FFD700'
      ctx.fillText(`⚡ 激光 ${laserTimer.toFixed(1)}s`, 12, effectY)
      effectY -= 18
    }
    if (cloneTimer > 0) {
      ctx.fillStyle = '#A855F7'
      ctx.fillText(`👾 分身 ${cloneTimer.toFixed(1)}s`, 12, effectY)
      effectY -= 18
    }
    if (score2xTimer > 0) {
      ctx.fillStyle = '#FFD93D'
      ctx.fillText(`✨ 2x ${score2xTimer.toFixed(1)}s`, 12, effectY)
      effectY -= 18
    }
    if (shieldCount > 0) {
      ctx.fillStyle = '#4D96FF'
      ctx.fillText(`🛡️ ×${shieldCount}`, 12, effectY)
    }

    // 连击
    if (combo >= 3) {
      ctx.fillStyle = '#FF6B6B'
      ctx.font = 'bold 18px sans-serif'
      ctx.textAlign = 'center'
      ctx.shadowColor = '#FF6B6B'
      ctx.shadowBlur = 8
      ctx.fillText(`${combo}x 连击!`, W / 2, 55)
      ctx.shadowBlur = 0
    }

    ctx.restore()
  }

  // === 游戏主循环 ===
  let lastTime = Date.now()

  function update() {
    if (gameEnded) return

    const now = Date.now()
    const dt = now - lastTime
    lastTime = now

    if (gameStarted) {
      elapsed = (now - startTime) / 1000
      difficulty = 1 + elapsed / 25

      if (elapsed >= GAME_DURATION) {
        gameEnded = true
        engine.endGame()
        setTimeout(() => onEnd(), 600)
        return
      }

      // 自动射击
      shoot()
    }

    // 生成敌人
    if (gameStarted) {
      const spawnInterval = Math.max(300, 1000 - difficulty * 60)
      spawnTimer -= dt
      if (spawnTimer <= 0) {
        spawnEnemy()
        spawnTimer = spawnInterval
        waveCount++

        // Boss波次
        if (waveCount % 20 === 0) {
          setTimeout(() => { if (!gameEnded) spawnEnemy() }, 300)
        }
      }
    }

    // 更新子弹
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i]

      // 追踪子弹：每帧转向最近敌人
      if (b.tracking && enemies.length > 0) {
        const TRACK_STRENGTH = 0.18 // 转向强度（越大转弯越猛）
        let nearestEnemy: typeof enemies[0] | null = null
        let nearestDist = Infinity
        for (const e of enemies) {
          const dx = e.x - b.x
          const dy = e.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < nearestDist) {
            nearestDist = dist
            nearestEnemy = e
          }
        }
        if (nearestEnemy) {
          const dx = nearestEnemy.x - b.x
          const dy = nearestEnemy.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > 0) {
            const desiredVx = (dx / dist) * BULLET_SPEED
            const desiredVy = (dy / dist) * BULLET_SPEED
            b.vx += (desiredVx - b.vx) * TRACK_STRENGTH
            b.vy += (desiredVy - b.vy) * TRACK_STRENGTH
            // 保持速度恒定
            const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy)
            b.vx = (b.vx / speed) * BULLET_SPEED
            b.vy = (b.vy / speed) * BULLET_SPEED
          }
        }
      }

      b.x += b.vx
      b.y += b.vy
      if (b.x < -10 || b.x > W + 10 || b.y < -10 || b.y > H + 10) {
        bullets.splice(i, 1)
        continue
      }

      // 子弹碰敌人
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j]
        if (rectCollide(b.x - 3, b.y - 3, 6, 6, e.x - e.w / 2, e.y - e.h / 2, e.w, e.h)) {
          bullets.splice(i, 1)
          e.hp -= b.atk
          explode(b.x, b.y, '#FFD700', 3, 2)

          // 分身弹：子弹命中时额外产生2颗散射子弹
          if (cloneTimer > 0) {
            for (let c = 0; c < 2; c++) {
              const spreadAngle = Math.atan2(b.vy, b.vx) + (c === 0 ? 0.4 : -0.4)
              bullets.splice(0, 0, {
                x: b.x, y: b.y,
                vx: Math.cos(spreadAngle) * BULLET_SPEED,
                vy: Math.sin(spreadAngle) * BULLET_SPEED,
                atk: b.atk,
                color: '#A855F7',
                tracking: false
              })
            }
          }

          if (e.hp <= 0) {
            // 击杀
            combo++
            comboTimer = 2
            const baseScore = e.score * Math.min(combo, 8)
            const scoreBonus = score2xTimer > 0 ? baseScore * 2 : baseScore
            score += scoreBonus
            engine.addScore(scoreBonus, e.x, e.y)

            floatTexts.push({
              text: combo >= 5 ? `${combo}x +${scoreBonus}` : `+${scoreBonus}`,
              x: e.x, y: e.y, life: 1,
              color: score2xTimer > 0 ? '#FFD93D' : (combo >= 5 ? '#FF6B6B' : '#FFD700'),
              size: combo >= 5 ? 18 : 14
            })

            // 经验
            playerExp += e.exp
            if (playerExp >= expToLevel && playerLevel < 10) {
              playerExp -= expToLevel
              levelUp()
            }

            explode(e.x, e.y, e.color, 12 + e.type * 5, 4)

            if (combo >= 5) {
              shakeAmt = 2
              engine.triggerRandomBuff()
            }

            spawnDrop(e.x, e.y)

            audioService.win()
            enemies.splice(j, 1)
          } else {
            audioService.click()
          }
          break
        }
      }
    }

    // 更新敌人
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i]

      // 冻结时敌人不移动
      if (freezeTimer <= 0) {
        // 追踪玩家
        const dx = playerX - e.x
        const dy = playerY - e.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 0) {
          e.vx += (dx / dist) * 0.02
          e.vy += (dy / dist) * 0.02
        }

        // 限制速度
        const speed = Math.sqrt(e.vx * e.vx + e.vy * e.vy)
        const maxSpeed = e.speed * (1 + difficulty * 0.1)
        if (speed > maxSpeed) {
          e.vx = (e.vx / speed) * maxSpeed
          e.vy = (e.vy / speed) * maxSpeed
        }

        e.x += e.vx
        e.y += e.vy
      }

      // 出屏检查（留一定余量）
      if (e.x < -80 || e.x > W + 80 || e.y < -80 || e.y > H + 80) {
        enemies.splice(i, 1)
        continue
      }

      // 碰撞玩家
      if (invincible <= 0 && rectCollide(
        playerX - 12, playerY - 12, 24, 24,
        e.x - e.w / 2, e.y - e.h / 2, e.w, e.h
      )) {
        if (shieldCount > 0) {
          // 护盾吸收
          shieldCount--
          floatTexts.push({ text: `🛡️ 护盾抵挡! (${shieldCount}剩余)`, x: playerX, y: playerY - 30, life: 1, color: '#4D96FF', size: 14 })
          invincible = 1.0
          shakeAmt = 3
          explode(playerX, playerY, '#4D96FF', 10, 3)
        } else {
          playerHP--
          invincible = 1.5
          shakeAmt = 5
          screenFlash = 0.25
          combo = 0
          explode(playerX, playerY, '#FF4757', 15, 4)
          audioService.pop()
        }

        enemies.splice(i, 1)
        if (playerHP <= 0) {
          gameEnded = true
          engine.endGame()
          explode(playerX, playerY, '#FF4757', 30, 6)
          setTimeout(() => onEnd(), 800)
          return
        }
      }
    }

    // 更新掉落
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i]
      d.y += d.vy
      d.life -= 0.005

      if (d.life <= 0 || d.y > H + 20) {
        drops.splice(i, 1)
        continue
      }

      // 拾取检测
      if (rectCollide(
        playerX - 18, playerY - 18, 36, 36,
        d.x - 10, d.y - 10, 20, 20
      )) {
        if (d.type === 'hp') {
          playerHP = Math.min(playerMaxHP, playerHP + 2)
          floatTexts.push({ text: '💚+2 HP', x: d.x, y: d.y, life: 1, color: '#00E676', size: 14 })
        } else if (d.type === 'exp') {
          playerExp += 8
          if (playerExp >= expToLevel && playerLevel < 10) {
            playerExp -= expToLevel
            levelUp()
          }
          floatTexts.push({ text: '✨+8 EXP', x: d.x, y: d.y, life: 1, color: '#FFD700', size: 14 })
        } else if (d.type === 'powerup' && d.powerupType) {
          // 道具箱：加入库存
          inventory.push(d.powerupType)
          const pCfg = RPG_SHOOTER_POWERUPS.find(p => p.id === d.powerupType)
          floatTexts.push({ text: `${pCfg?.icon ?? '📦'} 获得${pCfg?.name ?? '道具'}!`, x: d.x, y: d.y - 10, life: 1.5, color: pCfg?.color ?? '#A855F7', size: 16 })
          // 刷新 HTML 道具栏
          updateHTMLPowerupBar()
        }
        explode(d.x, d.y, '#fff', 8, 2)
        audioService.win()
        drops.splice(i, 1)
      }
    }

    // 更新计时器
    if (invincible > 0) invincible -= dt / 1000
    if (speedBoost > 0) speedBoost -= dt / 1000 * 0.3
    if (speedBoost < 0) speedBoost = 0
    if (atkBoost > 0) atkBoost -= dt / 1000 * 0.2
    if (atkBoost < 0) atkBoost = 0
    if (comboTimer > 0) {
      comboTimer -= dt / 1000
      if (comboTimer <= 0) combo = 0
    }
    if (shakeAmt > 0) shakeAmt *= 0.9
    if (shakeAmt < 0.1) shakeAmt = 0
    if (screenFlash > 0) screenFlash -= dt / 1000 * 2

    // 道具计时器递减
    const dtSec = dt / 1000
    if (laserTimer > 0) laserTimer -= dtSec
    if (freezeTimer > 0) freezeTimer -= dtSec
    if (cloneTimer > 0) cloneTimer -= dtSec
    if (score2xTimer > 0) score2xTimer -= dtSec

    // 激光弹幕：每帧向8方向发射子弹
    if (laserTimer > 0 && gameStarted) {
      const effectiveATK = playerATK + Math.floor(atkBoost)
      for (let dir = 0; dir < 8; dir++) {
        const angle = (Math.PI * 2 / 8) * dir
        bullets.push({
          x: playerX, y: playerY,
          vx: Math.cos(angle) * BULLET_SPEED * 1.2,
          vy: Math.sin(angle) * BULLET_SPEED * 1.2,
          atk: effectiveATK,
          color: '#FFD700',
          tracking: false
        })
      }
    }
  }

  function render() {
    ctx.save()

    if (shakeAmt > 0) {
      ctx.translate(
        (Math.random() - 0.5) * shakeAmt * 2,
        (Math.random() - 0.5) * shakeAmt * 2,
      )
    }

    drawBackground()

    // 掉落物品
    for (const d of drops) {
      ctx.save()
      ctx.translate(d.x, d.y)
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3
      ctx.shadowColor = d.color
      ctx.shadowBlur = 10
      ctx.fillStyle = d.color
      ctx.beginPath()
      ctx.arc(0, 0, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(d.icon, 0, 0)
      ctx.globalAlpha = 1
      ctx.restore()
    }

    // 敌人
    for (const e of enemies) drawEnemy(e)

    // 玩家子弹
    for (const b of bullets) {
      const bulletColor = b.tracking ? '#00FF88' : b.color
      ctx.fillStyle = bulletColor
      ctx.shadowColor = bulletColor
      ctx.shadowBlur = b.tracking ? 14 : 8
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.tracking ? 5 : 4, 0, Math.PI * 2)
      ctx.fill()

      // 拖尾
      ctx.shadowBlur = 0
      const grad = ctx.createLinearGradient(b.x, b.y, b.x - b.vx * 2, b.y - b.vy * 2)
      grad.addColorStop(0, bulletColor + '88')
      grad.addColorStop(1, 'transparent')
      ctx.strokeStyle = grad
      ctx.lineWidth = b.tracking ? 4 : 3
      ctx.beginPath()
      ctx.moveTo(b.x, b.y)
      ctx.lineTo(b.x - b.vx * 2, b.y - b.vy * 2)
      ctx.stroke()
    }
    ctx.shadowBlur = 0

    // 玩家
    if (!gameEnded || invincible > 0) drawPlayer()

    // 粒子
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05
      p.life -= 0.025
      if (p.life <= 0) { particles.splice(i, 1); continue }

      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    // 浮动文字
    for (let i = floatTexts.length - 1; i >= 0; i--) {
      const ft = floatTexts[i]
      ft.y -= 1.5
      ft.life -= 0.02
      if (ft.life <= 0) { floatTexts.splice(i, 1); continue }

      ctx.globalAlpha = ft.life
      ctx.fillStyle = ft.color
      ctx.font = `bold ${ft.size}px sans-serif`
      ctx.textAlign = 'center'
      ctx.shadowColor = ft.color
      ctx.shadowBlur = 6
      ctx.fillText(ft.text, ft.x, ft.y)
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    }

    // 受伤闪屏
    if (screenFlash > 0) {
      ctx.fillStyle = `rgba(255,50,50,${screenFlash * 0.4})`
      ctx.fillRect(-20, -20, W + 40, H + 40)
    }

    drawHUD()

    // 开始提示
    if (!gameStarted) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)'
      ctx.fillRect(0, H / 2 - 65, W, 130)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('🎮 星际猎手', W / 2, H / 2 - 20)
      ctx.font = '14px sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillText('移动鼠标/键盘控制移动', W / 2, H / 2 + 8)
      ctx.fillText('自动射击 · 击杀敌人获得经验升级!', W / 2, H / 2 + 28)
    }

    ctx.restore()
  }

  function loop() {
    if (!document.getElementById('mainGameCanvas')) return

    update()
    render()
    requestAnimationFrame(loop)
  }

  initPlayerStats()
  engine.start()
  render()
  
  // 初始化 HTML 道具栏
  updateHTMLPowerupBar()
  
  loop()
}
