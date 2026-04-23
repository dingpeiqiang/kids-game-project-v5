import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { app } from '../App'

export function initSpaceShooter(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  if (!canvas) return
  const W = 400, H = 600
  const ctx = canvas.getContext('2d')!
  if (!ctx) return
  ctx.imageSmoothingEnabled = false

  // === 配置 ===
  const PLAYER_W = 36, PLAYER_H = 32
  const BULLET_SPEED = 8
  const SHOOT_CD = 180 // ms
  const ENEMY_BASE_SPEED = 1.2
  const STAR_COUNT = 60
  const GAME_DURATION = 60

  // 敌人类型
  const ENEMY_TYPES = [
    { w: 28, h: 24, hp: 1, score: 15, color: '#FF6B6B', shape: 'circle' },   // 小兵
    { w: 32, h: 28, hp: 2, score: 30, color: '#FFA502', shape: 'diamond' },  // 中型
    { w: 38, h: 32, hp: 4, score: 80, color: '#FF4757', shape: 'hex' },      // 重型
  ]

  // === 状态 ===
  let playerX = W / 2, playerY = H - 55
  let bullets: { x: number; y: number; vx: number; vy: number }[] = []
  let enemies: { x: number; y: number; w: number; h: number; hp: number; maxHp: number; score: number; color: string; shape: string; speed: number; shootTimer: number }[] = []
  let enemyBullets: { x: number; y: number; vy: number; color: string }[] = []
  let particles: { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[] = []
  let floatTexts: { text: string; x: number; y: number; life: number; color: string; size: number }[] = []
  let powerUps: { x: number; y: number; type: string; life: number; vy: number }[] = []

  let stars: { x: number; y: number; speed: number; size: number; bright: number }[] = []
  let gameStarted = false
  let gameEnded = false
  let lastShot = 0
  let elapsed = 0
  let startTime = Date.now()
  let difficulty = 1
  let combo = 0
  let comboTimer = 0
  let shakeAmt = 0
  let playerHP = 5
  let maxHP = 5
  let invincible = 0 // 无敌时间
  let tripleShot = 0 // 三连发剩余时间
  let spreadShot = 0 // 扇形弹剩余时间
  let screenFlash = 0
  let spawnTimer = 0
  let waveCount = 0
  
  // ====== 道具系统（库存模式）======
  let inventory: string[] = [] // 道具库存
  
  // 道具图标映射
  const powerupIcons: Record<string, string> = {
    'triple': '⚡',      // 三连发
    'spread': '🔴',     // 扩散弹
    'heal': '💚',       // 回复
    'bomb': '💣'        // 全屏清除
  }
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id
    }))
    
    app.setupCustomPowerupBar('spaceShooter', powerups, inventory, (powerupId) => {
      if (usePowerup(powerupId)) {
        audioService.collect()
        updateHTMLPowerupBar()
      }
    })
  }
  
  // 使用道具（从库存中激活）
  function usePowerup(type: string): boolean {
    const index = inventory.indexOf(type)
    if (index === -1) return false
    
    inventory.splice(index, 1)
    console.log('[道具] 使用道具:', type)
    
    switch (type) {
      case 'triple':
        tripleShot = 8000
        floatTexts.push({ text: '⚡ 三连发!', x: playerX, y: playerY, life: 1, color: '#FFD700', size: 18 })
        audioService.win()
        console.log('[道具] 三连发生效，持续8秒')
        break
        
      case 'spread':
        spreadShot = 6000
        floatTexts.push({ text: '🔴 扩散弹!', x: playerX, y: playerY, life: 1, color: '#FF6B6B', size: 18 })
        audioService.win()
        console.log('[道具] 扩散弹生效，持续6秒')
        break
        
      case 'heal':
        const oldHP = playerHP
        playerHP = Math.min(maxHP, playerHP + 2)
        const healed = playerHP - oldHP
        floatTexts.push({ text: `💚 +${healed} HP!`, x: playerX, y: playerY, life: 1, color: '#00E676', size: 18 })
        audioService.win()
        console.log('[道具] 回复', healed, '点生命值')
        break
        
      case 'bomb':
        // 全屏清怪
        enemies.forEach(en => {
          explode(en.x, en.y, en.color, 10, 4)
          engine.addScore(en.score, en.x, en.y)
        })
        enemies.length = 0
        enemyBullets.length = 0
        screenFlash = 0.4
        shakeAmt = 8
        floatTexts.push({ text: '💣 全屏清除!', x: W / 2, y: H / 2, life: 1.5, color: '#FFD700', size: 26 })
        audioService.win()
        console.log('[道具] 炸弹清除所有敌人')
        break
    }
    
    return true
  }

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

  // === 敌人生成 ===
  function spawnEnemy() {
    // 根据难度选择敌人类型
    let typeIdx = 0
    const r = Math.random()
    if (difficulty >= 3 && r < 0.15) typeIdx = 2      // 重型
    else if (difficulty >= 2 && r < 0.4) typeIdx = 1   // 中型

    const type = ENEMY_TYPES[typeIdx]
    const x = 30 + Math.random() * (W - 60)

    enemies.push({
      x,
      y: -type.h,
      w: type.w,
      h: type.h,
      hp: type.hp + Math.floor(difficulty / 3),
      maxHp: type.hp + Math.floor(difficulty / 3),
      score: type.score,
      color: type.color,
      shape: type.shape,
      speed: ENEMY_BASE_SPEED + Math.random() * difficulty * 0.3,
      shootTimer: 1000 + Math.random() * 2000,
    })
  }

  function spawnPowerUp(x: number, y: number) {
    const types = ['triple', 'spread', 'heal', 'bomb']
    const type = types[Math.floor(Math.random() * types.length)]
    powerUps.push({ x, y, type, life: 1, vy: 1.5 })
  }

  // === 射击 ===
  function shoot() {
    const now = Date.now()
    if (now - lastShot < SHOOT_CD) return
    lastShot = now

    if (tripleShot > 0) {
      // 三连发
      bullets.push({ x: playerX - 10, y: playerY - PLAYER_H / 2, vx: 0, vy: -BULLET_SPEED })
      bullets.push({ x: playerX, y: playerY - PLAYER_H / 2 - 5, vx: 0, vy: -BULLET_SPEED })
      bullets.push({ x: playerX + 10, y: playerY - PLAYER_H / 2, vx: 0, vy: -BULLET_SPEED })
    } else if (spreadShot > 0) {
      // 扇形弹（5发）
      for (let i = -2; i <= 2; i++) {
        const angle = -Math.PI / 2 + i * 0.2
        bullets.push({
          x: playerX, y: playerY - PLAYER_H / 2,
          vx: Math.cos(angle) * BULLET_SPEED,
          vy: Math.sin(angle) * BULLET_SPEED,
        })
      }
    } else {
      // 单发
      bullets.push({ x: playerX, y: playerY - PLAYER_H / 2, vx: 0, vy: -BULLET_SPEED })
    }

    audioService.click()
  }

  // === 爆炸粒子 ===
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

  // === 碰撞检测 ===
  function rectCollide(ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number): boolean {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
  }

  // === 输入 ===
  let touchX: number | null = null
  let mouseDown = false

  function handleTap(e: MouseEvent | Touch) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    const clientX = 'clientX' in e ? e.clientX : 0
    const clientY = 'clientY' in e ? e.clientY : 0
    playerX = (clientX - rect.left) * scaleX
    playerY = (clientY - rect.top) * scaleY

    if (!gameStarted) {
      gameStarted = true
      startTime = Date.now()
    }
    shoot()
  }

  function handleMove(e: MouseEvent | Touch) {
    if (gameEnded) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    const clientX = 'clientX' in e ? e.clientX : 0
    const clientY = 'clientY' in e ? e.clientY : 0
    playerX = (clientX - rect.left) * scaleX
    playerY = (clientY - rect.top) * scaleY
    // 限制在屏幕内
    playerX = Math.max(PLAYER_W / 2, Math.min(W - PLAYER_W / 2, playerX))
    playerY = Math.max(H * 0.3, Math.min(H - 25, playerY))

    if (mouseDown && gameStarted) {
      shoot()
    }
  }

  canvas.onclick = (e) => handleTap(e)
  canvas.onmousedown = (e) => { mouseDown = true; handleMove(e) }
  canvas.onmousemove = (e) => handleMove(e)
  canvas.onmouseup = () => { mouseDown = false }
  canvas.ontouchstart = (e) => {
    e.preventDefault()
    if (e.touches.length > 0) handleTap(e.touches[0])
    mouseDown = true
  }
  canvas.ontouchmove = (e) => {
    e.preventDefault()
    if (e.touches.length > 0) handleMove(e.touches[0])
  }
  canvas.ontouchend = (e) => {
    e.preventDefault()
    mouseDown = false
  }

  // === 绘制函数 ===
  function drawPlayer() {
    if (invincible > 0 && Math.floor(invincible * 10) % 2 === 0) return

    ctx.save()
    ctx.translate(playerX, playerY)

    // 引擎火焰
    const flicker = Math.random() * 4
    const flameGrad = ctx.createLinearGradient(0, PLAYER_H / 2, 0, PLAYER_H / 2 + 14 + flicker)
    flameGrad.addColorStop(0, '#00E5FF')
    flameGrad.addColorStop(0.5, '#FF6B6B')
    flameGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = flameGrad
    ctx.beginPath()
    ctx.moveTo(-8, PLAYER_H / 2)
    ctx.lineTo(0, PLAYER_H / 2 + 14 + flicker)
    ctx.lineTo(8, PLAYER_H / 2)
    ctx.fill()

    // 机身
    ctx.fillStyle = '#45B7D1'
    ctx.beginPath()
    ctx.moveTo(0, -PLAYER_H / 2)       // 顶部
    ctx.lineTo(-PLAYER_W / 2, PLAYER_H / 2)   // 左下
    ctx.lineTo(-PLAYER_W / 4, PLAYER_H / 3)
    ctx.lineTo(PLAYER_W / 4, PLAYER_H / 3)
    ctx.lineTo(PLAYER_W / 2, PLAYER_H / 2)    // 右下
    ctx.closePath()
    ctx.fill()

    // 机翼
    ctx.fillStyle = '#2E86AB'
    ctx.beginPath()
    ctx.moveTo(-PLAYER_W / 2 - 6, PLAYER_H / 2 + 2)
    ctx.lineTo(-PLAYER_W / 4, PLAYER_H / 6)
    ctx.lineTo(-PLAYER_W / 2, PLAYER_H / 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(PLAYER_W / 2 + 6, PLAYER_H / 2 + 2)
    ctx.lineTo(PLAYER_W / 4, PLAYER_H / 6)
    ctx.lineTo(PLAYER_W / 2, PLAYER_H / 2)
    ctx.fill()

    // 驾驶舱
    ctx.fillStyle = '#00E5FF'
    ctx.shadowColor = '#00E5FF'
    ctx.shadowBlur = 6
    ctx.beginPath()
    ctx.ellipse(0, -2, 5, 8, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // 特殊武器指示
    if (tripleShot > 0) {
      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('⚡x3', 0, -PLAYER_H / 2 - 8)
    } else if (spreadShot > 0) {
      ctx.fillStyle = '#FF6B6B'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('🔴扩散', 0, -PLAYER_H / 2 - 8)
    }

    ctx.restore()
  }

  function drawEnemy(e: typeof enemies[0]) {
    ctx.save()
    ctx.translate(e.x, e.y)

    // 根据形状绘制
    if (e.shape === 'circle') {
      ctx.fillStyle = e.color
      ctx.shadowColor = e.color
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.arc(0, 0, e.w / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // 眼睛
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(-4, -2, 3, 0, Math.PI * 2)
      ctx.arc(4, -2, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#333'
      ctx.beginPath()
      ctx.arc(-4, -1, 1.5, 0, Math.PI * 2)
      ctx.arc(4, -1, 1.5, 0, Math.PI * 2)
      ctx.fill()
    } else if (e.shape === 'diamond') {
      ctx.fillStyle = e.color
      ctx.shadowColor = e.color
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.moveTo(0, -e.h / 2)
      ctx.lineTo(e.w / 2, 0)
      ctx.lineTo(0, e.h / 2)
      ctx.lineTo(-e.w / 2, 0)
      ctx.closePath()
      ctx.fill()
      ctx.shadowBlur = 0

      // 中心
      ctx.fillStyle = '#fff'
      ctx.globalAlpha = 0.6
      ctx.beginPath()
      ctx.arc(0, 0, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    } else if (e.shape === 'hex') {
      ctx.fillStyle = e.color
      ctx.shadowColor = e.color
      ctx.shadowBlur = 10
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6
        const px = Math.cos(angle) * e.w / 2
        const py = Math.sin(angle) * e.h / 2
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
      ctx.shadowBlur = 0

      // 血量条
      if (e.hp < e.maxHp) {
        const barW = e.w
        const barH = 3
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fillRect(-barW / 2, -e.h / 2 - 8, barW, barH)
        ctx.fillStyle = '#00E676'
        ctx.fillRect(-barW / 2, -e.h / 2 - 8, barW * (e.hp / e.maxHp), barH)
      }

      // 中心眼睛
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(-5, -2, 3.5, 0, Math.PI * 2)
      ctx.arc(5, -2, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#333'
      ctx.beginPath()
      ctx.arc(-5, -1, 2, 0, Math.PI * 2)
      ctx.arc(5, -1, 2, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  function drawBackground() {
    // 深空渐变
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#0a0a1e')
    grad.addColorStop(0.5, '#0d1b2a')
    grad.addColorStop(1, '#1b2838')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // 星星
    for (const s of stars) {
      s.y += s.speed * difficulty * 0.5
      if (s.y > H) { s.y = -2; s.x = Math.random() * W }

      ctx.fillStyle = `rgba(255,255,255,${s.bright})`
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  function drawHUD() {
    ctx.save()

    // 时间（左上）
    const timeLeft = Math.max(0, GAME_DURATION - elapsed)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 22px sans-serif'
    ctx.textAlign = 'left'
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 3
    ctx.fillText(`⏱ ${Math.ceil(timeLeft)}s`, 12, 30)
    ctx.shadowBlur = 0

    // 分数（右上）
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 22px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`★ ${engine.getScore()}`, W - 12, 30)

    // 生命值（左下）
    const hpBarW = 100, hpBarH = 8
    const hpX = 15, hpY = H - 15
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(hpX, hpY - hpBarH, hpBarW, hpBarH)
    const hpRatio = playerHP / maxHP
    const hpColor = hpRatio > 0.6 ? '#00E676' : hpRatio > 0.3 ? '#FFA502' : '#FF4757'
    ctx.fillStyle = hpColor
    ctx.fillRect(hpX, hpY - hpBarH, hpBarW * hpRatio, hpBarH)

    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`❤️ ${playerHP}/${maxHP}`, hpX, hpY - hpBarH - 3)

    // 连击
    if (combo >= 3) {
      ctx.fillStyle = '#FF6B6B'
      ctx.font = 'bold 20px sans-serif'
      ctx.textAlign = 'center'
      ctx.shadowColor = '#FF6B6B'
      ctx.shadowBlur = 10
      ctx.fillText(`${combo}x 连击!`, W / 2, 30)
      ctx.shadowBlur = 0
    }

    // 道具状态
    let buffY = H - 15
    ctx.textAlign = 'right'
    if (tripleShot > 0) {
      ctx.fillStyle = '#FFD700'
      ctx.font = '12px sans-serif'
      ctx.fillText(`⚡三连发 ${Math.ceil(tripleShot / 1000)}s`, W - 15, buffY)
      buffY -= 16
    }
    if (spreadShot > 0) {
      ctx.fillStyle = '#FF6B6B'
      ctx.font = '12px sans-serif'
      ctx.fillText(`🔴扩散弹 ${Math.ceil(spreadShot / 1000)}s`, W - 15, buffY)
      buffY -= 16
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
      difficulty = 1 + elapsed / 20 // 每20秒提升1级

      // 时间到
      if (elapsed >= GAME_DURATION) {
        gameEnded = true
        engine.endGame()
        setTimeout(() => onEnd(), 600)
        return
      }
    }

    // 生成敌人
    if (gameStarted) {
      const spawnInterval = Math.max(400, 1200 - difficulty * 80)
      spawnTimer -= dt
      if (spawnTimer <= 0) {
        spawnEnemy()
        spawnTimer = spawnInterval
        waveCount++

        // 每5波生成一波密集敌人
        if (waveCount % 5 === 0) {
          setTimeout(() => { if (!gameEnded) spawnEnemy() }, 200)
          setTimeout(() => { if (!gameEnded) spawnEnemy() }, 400)
        }
      }
    }

    // 自动射击（按住时）
    if (mouseDown && gameStarted) {
      shoot()
    }

    // 更新子弹
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i]
      b.x += b.vx
      b.y += b.vy
      if (b.y < -10 || b.x < -10 || b.x > W + 10) {
        bullets.splice(i, 1)
        continue
      }

      // 子弹碰敌人
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j]
        if (rectCollide(b.x - 3, b.y - 5, 6, 10, e.x - e.w / 2, e.y - e.h / 2, e.w, e.h)) {
          bullets.splice(i, 1)
          e.hp--
          explode(b.x, b.y, '#FFD700', 4, 2)

          if (e.hp <= 0) {
            // 击杀
            combo++
            comboTimer = 2
            const scoreBonus = e.score * Math.min(combo, 10)
            engine.addScore(scoreBonus, e.x, e.y)

            floatTexts.push({
              text: combo >= 5 ? `${combo}x +${scoreBonus}!` : `+${scoreBonus}`,
              x: e.x, y: e.y, life: 1,
              color: combo >= 5 ? '#FF6B6B' : '#FFD700',
              size: combo >= 5 ? 20 : 16,
            })

            explode(e.x, e.y, e.color, 15 + e.maxHp * 5, 4)
            explode(e.x, e.y, '#FFD700', 8, 3)

            if (combo >= 5) {
              shakeAmt = 3
              engine.triggerRandomBuff()
            } else if (combo >= 3) {
              shakeAmt = 1.5
            }

            // 随机掉道具（15%概率）
            if (Math.random() < 0.15) {
              spawnPowerUp(e.x, e.y)
            }

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
      e.y += e.speed

      // 敌人射击
      if (gameStarted && e.y > 20 && e.y < H * 0.7) {
        e.shootTimer -= dt
        if (e.shootTimer <= 0) {
          enemyBullets.push({
            x: e.x, y: e.y + e.h / 2,
            vy: 3 + difficulty * 0.5,
            color: e.color,
          })
          e.shootTimer = Math.max(800, 2000 - difficulty * 150) + Math.random() * 1000
        }
      }

      // 出屏
      if (e.y > H + 40) {
        enemies.splice(i, 1)
        continue
      }

      // 碰撞玩家
      if (invincible <= 0 && rectCollide(
        playerX - PLAYER_W / 2, playerY - PLAYER_H / 2, PLAYER_W, PLAYER_H,
        e.x - e.w / 2, e.y - e.h / 2, e.w, e.h,
      )) {
        playerHP--
        invincible = 2
        shakeAmt = 6
        screenFlash = 0.3
        combo = 0
        explode(playerX, playerY, '#FF4757', 20, 5)
        audioService.pop()

        enemies.splice(i, 1)
        if (playerHP <= 0) {
          gameEnded = true
          engine.endGame()
          explode(playerX, playerY, '#FF4757', 40, 8)
          setTimeout(() => onEnd(), 800)
          return
        }
      }
    }

    // 更新敌人子弹
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const b = enemyBullets[i]
      b.y += b.vy
      if (b.y > H + 10) {
        enemyBullets.splice(i, 1)
        continue
      }

      // 碰撞玩家
      if (invincible <= 0 && rectCollide(
        b.x - 3, b.y - 5, 6, 10,
        playerX - PLAYER_W / 2, playerY - PLAYER_H / 2, PLAYER_W, PLAYER_H,
      )) {
        playerHP--
        invincible = 2
        shakeAmt = 5
        screenFlash = 0.25
        combo = 0
        explode(playerX, playerY, '#FF4757', 15, 4)
        audioService.pop()
        enemyBullets.splice(i, 1)

        if (playerHP <= 0) {
          gameEnded = true
          engine.endGame()
          explode(playerX, playerY, '#FF4757', 40, 8)
          setTimeout(() => onEnd(), 800)
          return
        }
      }
    }

    // 更新道具
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i]
      p.y += p.vy
      if (p.y > H + 20) { powerUps.splice(i, 1); continue }

      if (rectCollide(
        playerX - PLAYER_W / 2 - 5, playerY - PLAYER_H / 2 - 5, PLAYER_W + 10, PLAYER_H + 10,
        p.x - 12, p.y - 12, 24, 24,
      )) {
        // 拾取道具 - 添加到库存
        inventory.push(p.type)
        floatTexts.push({ text: `+${powerupIcons[p.type] || '?'}`, x: p.x, y: p.y, life: 1, color: '#FFD700', size: 18 })
        explode(p.x, p.y, '#fff', 10, 3)
        audioService.win()
        powerUps.splice(i, 1)
        
        // 更新 HTML 道具栏
        updateHTMLPowerupBar()
      }
    }

    // 更新计时器
    if (invincible > 0) invincible -= dt / 1000
    if (tripleShot > 0) tripleShot -= dt
    if (spreadShot > 0) spreadShot -= dt
    if (comboTimer > 0) {
      comboTimer -= dt / 1000
      if (comboTimer <= 0) combo = 0
    }
    if (shakeAmt > 0) shakeAmt *= 0.9
    if (shakeAmt < 0.1) shakeAmt = 0
    if (screenFlash > 0) screenFlash -= dt / 1000 * 2
  }

  function render() {
    ctx.save()

    // 屏幕震动
    if (shakeAmt > 0) {
      ctx.translate(
        (Math.random() - 0.5) * shakeAmt * 2,
        (Math.random() - 0.5) * shakeAmt * 2,
      )
    }

    drawBackground()

    // 道具
    for (const p of powerUps) {
      ctx.save()
      ctx.translate(p.x, p.y)
      // 光晕
      ctx.shadowColor = p.type === 'triple' ? '#FFD700' : p.type === 'spread' ? '#FF6B6B' : p.type === 'heal' ? '#00E676' : '#FF4757'
      ctx.shadowBlur = 12
      ctx.fillStyle = ctx.shadowColor
      ctx.beginPath()
      ctx.arc(0, 0, 10, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      ctx.fillStyle = '#fff'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const icon = p.type === 'triple' ? '⚡' : p.type === 'spread' ? '🔴' : p.type === 'heal' ? '💚' : '💣'
      ctx.fillText(icon, 0, 0)
      ctx.restore()
    }

    // 敌人子弹
    for (const b of enemyBullets) {
      ctx.fillStyle = b.color
      ctx.shadowColor = b.color
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.arc(b.x, b.y, 3, 0, Math.PI * 2)
      ctx.fill()
      // 拖尾
      ctx.fillStyle = b.color + '44'
      ctx.beginPath()
      ctx.arc(b.x, b.y + 5, 2.5, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.shadowBlur = 0

    // 敌人
    for (const e of enemies) drawEnemy(e)

    // 玩家子弹
    for (const b of bullets) {
      ctx.fillStyle = '#00E5FF'
      ctx.shadowColor = '#00E5FF'
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.arc(b.x, b.y, 3, 0, Math.PI * 2)
      ctx.fill()
      // 拖尾
      ctx.shadowBlur = 0
      const trailGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + 12)
      trailGrad.addColorStop(0, 'rgba(0,229,255,0.5)')
      trailGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = trailGrad
      ctx.fillRect(b.x - 1.5, b.y, 3, 12)
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

    // HUD
    drawHUD()

    // 开始提示
    if (!gameStarted) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.fillRect(0, H / 2 - 55, W, 110)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 22px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('🔫 太空射击', W / 2, H / 2 - 10)
      ctx.font = '15px sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillText('移动飞船躲避敌弹，消灭外星入侵者!', W / 2, H / 2 + 18)
      ctx.fillText('点击/长按屏幕连续射击', W / 2, H / 2 + 38)
    }

    ctx.restore()
  }

  function loop() {
    if (!document.getElementById('mainGameCanvas')) return

    update()
    render()
    requestAnimationFrame(loop)
  }

  engine.start()
  
  // 初始化 HTML 道具栏
  updateHTMLPowerupBar()
  
  render()
  loop()
}
