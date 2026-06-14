import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { app } from '../services/appBridge'
import { applyCanvasMobileStyles, bindCanvasPointerTapAndMove } from '../utils/canvasMobileUtils'

export function initSlimeJump(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  if (!canvas) {
    console.error('[史莱姆跳] Canvas 元素不存在')
    return
  }
  
  const W = 400, H = 600
  const ctx = canvas.getContext('2d')!
  if (!ctx) {
    console.error('[史莱姆跳] 无法获取 Canvas 上下文')
    return
  }
  ctx.imageSmoothingEnabled = false

  // 史莱姆玩家 - 初始位置在第一个平台上
  const player = {
    x: W / 2,
    y: H - 100 - 35, // 放在平台上方（平台y=H-100，玩家size=35）
    vy: 0,
    size: 35,
    squash: 1,
    onGround: true // 初始在地面上
  }
  
  const platforms: any[] = []
  const particles: any[] = []
  let cameraY = 0
  let targetCameraY = 0 // 目标相机位置，用于平滑跟随
  let score = 0
  let combo = 0
  let lastHeight = H
  let gameStartTime = Date.now()
  const GAME_DURATION = 90000 // 延长游戏时间到90秒
  let gameEnded = false
  let mouseX = W / 2 // 初始鼠标位置在屏幕中央
  
  // 难度系统
  let difficulty = 1 // 难度等级
  let maxCombo = 0 // 最大连击数
  let totalJumps = 0 // 总跳跃次数
  
  // 帧率控制
  let lastTime = 0
  const TARGET_FPS = 60
  const FRAME_TIME = 1000 / TARGET_FPS
  
  // ====== 道具系统（库存模式）======
  let inventory: string[] = [] // 道具库存
  
  // 道具图标映射
  const powerupIcons: Record<string, string> = {
    'jetpack': '🚀',      // 喷气背包 - 向上冲刺
    'shield': '🛡️',     // 护盾 - 免疫一次掉落
    'magnet': '🧲',      // 磁铁 - 自动吸引星星
    'slow': '🐌'          // 减速 - 重力减半
  }
  
  // 障碍物系统
  const obstacles: any[] = []
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    try {
      const powerups = Object.keys(powerupIcons).map(id => ({
        id,
        icon: powerupIcons[id],
        name: id
      }))
      
      if (typeof app !== 'undefined' && app.setupCustomPowerupBar) {
        app.setupCustomPowerupBar('slimeJump', powerups, inventory, (powerupId) => {
          if (usePowerup(powerupId)) {
            audioService.collect()
          }
        })
      }
    } catch (error) {
      console.warn('[史莱姆跳] 更新道具栏失败:', error)
    }
  }
  
  // 使用道具
  function usePowerup(type: string): boolean {
    const index = inventory.indexOf(type)
    if (index === -1) return false
    
    inventory.splice(index, 1)
    console.log('[道具] 使用道具:', type)
    
    switch (type) {
      case 'jetpack':
        // 喷气背包 - 向上冲刺
        player.vy = -15
        audioService.win()
        console.log('[道具] 喷气背包生效')
        break
        
      case 'shield':
        // 护盾 - 免疫一次掉落
        ;(window as any).slimeShield = true
        audioService.win()
        console.log('[道具] 护盾已准备')
        break
        
      case 'magnet':
        // 磁铁 - 自动吸引星星，持续8秒
        ;(window as any).slimeMagnet = Date.now() + 8000
        audioService.win()
        console.log('[道具] 磁铁生效，持续8秒')
        break
        
      case 'slow':
        // 减速 - 重力减半，持续8秒
        ;(window as any).slimeSlow = Date.now() + 8000
        audioService.collect()
        console.log('[道具] 减速生效，持续8秒')
        break
    }
    
    return true
  }

  function spawnPlatform(y: number) {
    // 根据难度调整平台宽度和间距
    const minWidth = Math.max(40, 80 - difficulty * 5)
    const maxWidth = Math.max(60, 120 - difficulty * 8)
    const width = minWidth + Math.random() * (maxWidth - minWidth)
    
    // 平台间距随难度增加
    const minGap = 50 + difficulty * 5
    const maxGap = 80 + difficulty * 8
    const gap = minGap + Math.random() * (maxGap - minGap)
    
    const x = 30 + Math.random() * (W - 60 - width)
    
    // 平台类型概率随难度变化
    const typeRoll = Math.random()
    let type = 'normal'
    if (typeRoll < 0.15 + difficulty * 0.02) {
      type = 'moving' // 移动平台概率随难度增加
    } else if (typeRoll < 0.3 + difficulty * 0.03) {
      type = 'spring' // 弹簧平台
    }
    
    // 移动平台速度随难度增加
    const moveSpeed = 1 + Math.random() * 1.5 + difficulty * 0.3
    
    platforms.push({
      x,
      y,
      width,
      height: 15,
      type,
      moveDir: Math.random() > 0.5 ? 1 : -1,
      moveSpeed,
      hasStar: Math.random() < 0.2 + difficulty * 0.02, // 星星概率随难度增加
      bounce: 0
    })
    
    // 生成障碍物（难度 >= 3 时）
    if (difficulty >= 3 && Math.random() < 0.15 + difficulty * 0.03) {
      spawnObstacle(y - 80 - Math.random() * 50)
    }
  }
  
  function spawnObstacle(y: number) {
    const type = Math.random() < 0.5 ? 'spike' : 'bird'
    obstacles.push({
      x: Math.random() * (W - 40) + 20,
      y,
      type,
      width: type === 'spike' ? 30 : 40,
      height: type === 'spike' ? 30 : 25,
      speed: type === 'bird' ? 2 + Math.random() * 2 : 0,
      direction: Math.random() > 0.5 ? 1 : -1
    })
  }

  function draw() {
    // 背景
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, W, H)

    // 渐变天空
    const skyGrad = ctx.createLinearGradient(0, -cameraY, 0, H - cameraY)
    skyGrad.addColorStop(0, '#0a0a1a')
    skyGrad.addColorStop(1, '#1a1a2e')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, W, H)

    // 平台
    platforms.forEach(p => {
      const py = p.y - cameraY
      if (py < -50 || py > H + 50) return
      
      ctx.save()
      
      // 弹性动画
      if (p.bounce > 0) {
        ctx.translate(p.x + p.width / 2, py)
        ctx.scale(1 + p.bounce * 0.3, 1 - p.bounce * 0.3)
        ctx.translate(-(p.x + p.width / 2), -py)
        p.bounce -= 0.1
      }
      
      if (p.type === 'normal') {
        // 普通平台 - 绿色
        const grad = ctx.createLinearGradient(p.x, py, p.x, py + p.height)
        grad.addColorStop(0, '#6BCB77')
        grad.addColorStop(1, '#4CAF50')
        ctx.fillStyle = grad
        ctx.shadowColor = '#6BCB77'
        ctx.shadowBlur = 8
      } else if (p.type === 'spring') {
        // 弹簧平台 - 橙色
        const grad = ctx.createLinearGradient(p.x, py, p.x, py + p.height)
        grad.addColorStop(0, '#FF9F43')
        grad.addColorStop(1, '#E67E22')
        ctx.fillStyle = grad
        ctx.shadowColor = '#FF9F43'
        ctx.shadowBlur = 12
      } else {
        // 移动平台 - 紫色
        const grad = ctx.createLinearGradient(p.x, py, p.x, py + p.height)
        grad.addColorStop(0, '#9B59B6')
        grad.addColorStop(1, '#8E44AD')
        ctx.fillStyle = grad
        ctx.shadowColor = '#9B59B6'
        ctx.shadowBlur = 10
      }
      
      ctx.beginPath()
      ctx.roundRect(p.x, py, p.width, p.height, 8)
      ctx.fill()
      ctx.shadowBlur = 0
      
      // 星星
      if (p.hasStar) {
        ctx.font = '20px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('⭐', p.x + p.width / 2, py - 10)
      }
      
      ctx.restore()
    })

    // 障碍物绘制
    obstacles.forEach(obs => {
      const oy = obs.y - cameraY
      if (oy < -50 || oy > H + 50) return
      
      ctx.save()
      if (obs.type === 'spike') {
        // 尖刺障碍物
        ctx.fillStyle = '#FF4757'
        ctx.shadowColor = '#FF4757'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.moveTo(obs.x, oy + obs.height)
        ctx.lineTo(obs.x + obs.width / 2, oy)
        ctx.lineTo(obs.x + obs.width, oy + obs.height)
        ctx.closePath()
        ctx.fill()
      } else {
        // 飞鸟障碍物
        ctx.font = '25px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('🦅', obs.x + obs.width / 2, oy + obs.height / 2)
      }
      ctx.restore()
    })

    // 史莱姆
    const py = player.y - cameraY
    ctx.save()
    ctx.translate(player.x, py)
    
    // 挤压变形
    ctx.scale(1 / player.squash, player.squash)
    
    ctx.shadowColor = '#9B59B6'
    ctx.shadowBlur = 15
    ctx.font = `${player.size}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🟢', 0, 0)
    ctx.restore()

    // 粒子绘制
    particles.forEach(p => {
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y - cameraY, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })

    const elapsedHud = Date.now() - gameStartTime
    const remainingHud = Math.max(0, GAME_DURATION - elapsedHud)
    const secondsHud = Math.ceil(remainingHud / 1000)
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.beginPath()
    ctx.roundRect(10, 8, W - 20, 40, 10)
    ctx.fill()
    ctx.fillStyle = secondsHud <= 10 ? '#FF4444' : '#6BCB77'
    ctx.font = 'bold 15px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const jumpLabel = combo >= 3 ? ` · 🔥${combo}跳` : ''
    ctx.fillText(
      `高度 ${score}m · Lv.${difficulty} · ⏱ ${secondsHud}s${jumpLabel}`,
      W / 2,
      28,
    )

    // 提示 - 根据难度显示不同提示
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    
    if (difficulty <= 2) {
      ctx.fillText('🟢 左右移动，跳上平台！', W / 2, H - 25)
    } else if (difficulty <= 5) {
      ctx.fillText('⚠️ 注意躲避障碍物！', W / 2, H - 25)
    } else {
      ctx.fillText('🔥 高难度挑战！保持专注！', W / 2, H - 25)
    }
  }

  function update(deltaTime: number) {
    // 史莱姆物理 - 只有不在地面上时才应用重力
    if (!player.onGround) {
      player.vy += 0.25 * deltaTime // 降低重力，基于时间增量
    }
    player.y += player.vy * deltaTime
    
    // 挤压恢复
    player.squash += (1 - player.squash) * 0.1 * deltaTime
    
    // 左右移动 - 跟随鼠标位置 - 降低移动速度
    const targetX = Math.max(30, Math.min(W - 30, mouseX))
    player.x += (targetX - player.x) * 0.08 * deltaTime
    
    // 平台移动 - 基于时间增量
    platforms.forEach(p => {
      if (p.type === 'moving') {
        p.x += p.moveDir * p.moveSpeed * deltaTime
        if (p.x <= 10 || p.x + p.width >= W - 10) {
          p.moveDir *= -1
        }
      }
    })
    
    // 障碍物更新
    obstacles.forEach(obs => {
      if (obs.type === 'bird') {
        obs.x += obs.speed * obs.direction * deltaTime
        if (obs.x <= 10 || obs.x + obs.width >= W - 10) {
          obs.direction *= -1
        }
      }
    })

    // 平台碰撞
    player.onGround = false
    platforms.forEach(p => {
      // 下落时碰撞
      if (player.vy > 0) {
        const playerBottom = player.y + player.size / 2
        const playerLeft = player.x - player.size / 2
        const playerRight = player.x + player.size / 2
        
        // 更精确的碰撞检测
        if (playerBottom >= p.y && playerBottom <= p.y + p.height + player.vy &&
            playerRight > p.x && playerLeft < p.x + p.width) {
          
          player.y = p.y - player.size / 2
          player.onGround = true
          player.vy = 0 // 重置垂直速度
          
          if (p.type === 'spring') {
            // 弹簧跳跃 - 降低跳跃力度
            player.vy = -13
            p.bounce = 1
            combo++
            totalJumps++
            if (combo > maxCombo) maxCombo = combo
            engine.addScore(20 * combo, player.x, player.y)
            audioService.win()
            
            // 特效
            for (let i = 0; i < 8; i++) {
              particles.push({
                x: player.x,
                y: player.y + player.size / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: -Math.random() * 5,
                life: 1,
                color: '#FF9F43',
                size: 4
              })
            }
          } else {
            // 普通跳跃 - 降低跳跃力度
            player.vy = -8
            player.squash = 0.6
            combo++
            totalJumps++
            if (combo > maxCombo) maxCombo = combo
            engine.addScore(10 * combo, player.x, player.y)
            audioService.collect()
            
            if (combo >= 5) engine.triggerRandomBuff()
          }
          
          // 收集星星
          if (p.hasStar) {
            p.hasStar = false
            engine.addScore(50, p.x + p.width / 2, p.y - 20)
            for (let i = 0; i < 12; i++) {
              particles.push({
                x: p.x + p.width / 2,
                y: p.y - 10,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1,
                color: '#FFD700',
                size: 5
              })
            }
          }
        }
      }
    })

    // 障碍物碰撞检测
    obstacles.forEach(obs => {
      const playerLeft = player.x - player.size / 2
      const playerRight = player.x + player.size / 2
      const playerTop = player.y - player.size / 2
      const playerBottom = player.y + player.size / 2
      
      if (playerRight > obs.x && playerLeft < obs.x + obs.width &&
          playerBottom > obs.y && playerTop < obs.y + obs.height) {
        // 碰撞！如果有护盾则消耗，否则游戏结束
        if ((window as any).slimeShield) {
          ;(window as any).slimeShield = false
          // 移除障碍物
          obstacles.splice(obstacles.indexOf(obs), 1)
          audioService.win()
          console.log('[史莱姆跳] 护盾抵挡障碍物')
        } else {
          gameEnded = true
          engine.setVictory(false)
          engine.endGame()
          cleanup()
          if (typeof app !== 'undefined' && app.removePowerupBar) {
            app.removePowerupBar()
          }
          onEnd()
          return
        }
      }
    })

    // 相机平滑跟随 - 使用缓动函数实现丝滑效果
    if (player.y < lastHeight - 50) {
      targetCameraY = player.y - H * 0.4 // 相机目标位置
      lastHeight = player.y
      score = Math.max(score, Math.floor((H - player.y) / 10))
      
      // 更新难度：每跳10次增加难度
      totalJumps++
      if (totalJumps % 10 === 0 && difficulty < 10) {
        difficulty++
        console.log('[史莱姆跳] 难度提升至:', difficulty)
      }
    }
    
    // 平滑相机移动 - 使用缓动系数
    const smoothFactor = 0.08 // 越小越平滑
    cameraY += (targetCameraY - cameraY) * smoothFactor

    // 生成新平台 - 确保平台在相机视野上方
    const highestPlatform = Math.min(...platforms.map(p => p.y))
    const generateThreshold = cameraY - 150 // 提前生成平台
    if (highestPlatform > generateThreshold) {
      // 生成多个平台，确保连续性
      const count = Math.ceil((cameraY - highestPlatform) / 100) + 2
      for (let i = 0; i < count; i++) {
        const newY = highestPlatform - (50 + Math.random() * 50 + difficulty * 3)
        spawnPlatform(newY)
      }
    }

    // 清理平台 - 只清理远离相机的平台
    for (let i = platforms.length - 1; i >= 0; i--) {
      const p = platforms[i]
      // 如果平台在相机下方很远，且玩家不在上面，则清理
      if (p.y > cameraY + H + 100 && !player.onGround) {
        platforms.splice(i, 1)
      }
    }
    
    // 清理障碍物
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i]
      if (obs.y > cameraY + H + 100 || obs.y < cameraY - 200) {
        obstacles.splice(i, 1)
      }
    }

    // 粒子更新 - 基于时间增量
    particles.forEach((p, i) => {
      p.life -= 0.03 * deltaTime
      p.x += p.vx * deltaTime
      p.y += p.vy * deltaTime
      p.vy += 0.1 * deltaTime
      
      if (p.life <= 0) { 
        particles.splice(i, 1)
        return
      }
    })

    // 掉落检测
    if (player.y > cameraY + H + 100) {
      combo = 0
      // 检查是否有护盾
      if ((window as any).slimeShield) {
        // 消耗护盾，不结束游戏
        ;(window as any).slimeShield = false
        player.y = cameraY + H - 150
        player.vy = 0
        player.x = W / 2
        audioService.win()
        console.log('[史莱姆跳] 护盾生效，免疫掉落')
      } else {
        // 没有护盾，游戏结束
        gameEnded = true
        engine.setVictory(false)
        engine.endGame()
        
        // 设置游戏统计数据
        engine.setGameStats({
          height: score,
          difficulty: difficulty,
          maxCombo: maxCombo,
          totalJumps: totalJumps,
          duration: Math.floor((Date.now() - gameStartTime) / 1000)
        })
        
        cleanup()
        // 清理道具栏
        if (typeof app !== 'undefined' && app.removePowerupBar) {
          app.removePowerupBar()
        }
        onEnd()
        return
      }
    }
  }

  applyCanvasMobileStyles(canvas)
  const unbindPointer = bindCanvasPointerTapAndMove(
    canvas,
    (x) => {
      mouseX = x
    },
    (x) => {
      mouseX = x
    },
  )

  const cleanup = () => {
    unbindPointer()
  }

  function loop(currentTime: number) {
    // 检查 Canvas 是否存在
    const currentCanvas = document.getElementById('mainGameCanvas')
    if (!currentCanvas || gameEnded) {
      cleanup()
      // 清理道具栏
      if (typeof app !== 'undefined' && app.removePowerupBar) {
        app.removePowerupBar()
      }
      return
    }
    
    if (!engine.canTick()) {
      draw()
      requestAnimationFrame(loop)
      return
    }

    // 帧率控制
    const deltaTime = Math.min((currentTime - lastTime) / FRAME_TIME, 2) // 限制最大增量
    lastTime = currentTime
    
    if (Date.now() - gameStartTime > GAME_DURATION) {
      gameEnded = true
      engine.setVictory(false)
      engine.endGame()
      
      // 设置游戏统计数据
      engine.setGameStats({
        height: score,
        difficulty: difficulty,
        maxCombo: maxCombo,
        totalJumps: totalJumps,
        duration: Math.floor((Date.now() - gameStartTime) / 1000)
      })
      
      cleanup()
      // 清理道具栏
      if (typeof app !== 'undefined' && app.removePowerupBar) {
        app.removePowerupBar()
      }
      onEnd()
      return
    }
    
    update(deltaTime)
    draw()
    requestAnimationFrame(loop)
  }

  engine.start()
  
  // 初始平台 - 确保玩家在第一个平台上
  platforms.push({ x: W / 2 - 50, y: H - 100, width: 100, height: 15, type: 'normal' })
  // 生成更多平台，确保有足够的跳跃空间
  for (let i = 0; i < 10; i++) {
    spawnPlatform(H - 200 - i * 70)
  }
  
  // 初始化相机位置
  cameraY = 0
  targetCameraY = 0
  lastHeight = player.y
  
  // 更新道具栏显示
  updateHTMLPowerupBar()
      
  // 启动游戏循环，传入初始时间
  lastTime = performance.now()
  loop(lastTime)
}
