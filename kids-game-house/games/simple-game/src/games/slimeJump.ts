import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { app } from '../App'

export function initSlimeJump(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  const W = 400, H = 600
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false

  // 史莱姆玩家
  const player = {
    x: W / 2,
    y: H - 150,
    vy: 0,
    size: 35,
    squash: 1,
    onGround: false
  }
  
  const platforms: any[] = []
  const particles: any[] = []
  let cameraY = 0
  let score = 0
  let combo = 0
  let lastHeight = H
  let gameStartTime = Date.now()
  const GAME_DURATION = 60000
  let gameEnded = false
  let mouseX = W / 2
  
  // ====== 道具系统（库存模式）======
  let inventory: string[] = [] // 道具库存
  
  // 道具图标映射
  const powerupIcons: Record<string, string> = {
    'jetpack': '🚀',      // 喷气背包 - 向上冲刺
    'shield': '🛡️',     // 护盾 - 免疫一次掉落
    'magnet': '🧲',      // 磁铁 - 自动吸引星星
    'slow': '🐌'          // 减速 - 重力减半
  }
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id
    }))
    
    app.setupCustomPowerupBar('slimeJump', powerups, inventory, (powerupId) => {
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
    const width = 60 + Math.random() * 80
    const x = 30 + Math.random() * (W - 60 - width)
    const type = Math.random()
    
    platforms.push({
      x,
      y,
      width,
      height: 15,
      type: type < 0.7 ? 'normal' : type < 0.9 ? 'spring' : 'moving',
      moveDir: 1,
      moveSpeed: 1 + Math.random(),
      hasStar: Math.random() < 0.25,
      bounce: 0
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

    // 粒子
    particles.forEach((p, i) => {
      p.life -= 0.03
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.1
      
      if (p.life <= 0) { particles.splice(i, 1); return }
      
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y - cameraY, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })

    // 分数
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 36px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(engine.getScore()), W / 2, 45)
    
    if (combo >= 3) {
      ctx.fillStyle = '#9B59B6'
      ctx.font = 'bold 22px sans-serif'
      ctx.fillText(`${combo} 跳!`, W / 2, 80)
    }

    // 高度
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = '16px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`高度: ${Math.floor(score / 10)}m`, 15, 45)

    // 时间
    const elapsed = Date.now() - gameStartTime
    const remaining = Math.max(0, GAME_DURATION - elapsed)
    const seconds = Math.ceil(remaining / 1000)
    
    ctx.fillStyle = seconds <= 10 ? '#FF4444' : '#fff'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`${seconds}s`, W - 15, 45)

    // 提示
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '16px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🟢 左右移动，跳得更高!', W / 2, H - 25)
  }

  function update() {
    // 史莱姆物理
    player.vy += 0.4 // 重力
    player.y += player.vy
    
    // 挤压恢复
    player.squash += (1 - player.squash) * 0.1
    
    // 左右移动
    const targetX = Math.max(30, Math.min(W - 30, mouseX))
    player.x += (targetX - player.x) * 0.1
    
    // 平台移动
    platforms.forEach(p => {
      if (p.type === 'moving') {
        p.x += p.moveDir * p.moveSpeed
        if (p.x <= 10 || p.x + p.width >= W - 10) {
          p.moveDir *= -1
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
        
        if (playerBottom >= p.y && playerBottom <= p.y + p.height + player.vy &&
            playerRight > p.x && playerLeft < p.x + p.width) {
          
          player.y = p.y - player.size / 2
          player.onGround = true
          
          if (p.type === 'spring') {
            // 弹簧跳跃
            player.vy = -18
            p.bounce = 1
            combo++
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
            // 普通跳跃
            player.vy = -10
            player.squash = 0.6
            combo++
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

    // 相机跟随
    if (player.y < lastHeight - 100) {
      cameraY = player.y - H + 200
      lastHeight = player.y
      score = Math.max(score, H - player.y)
    }

    // 生成新平台
    const highestPlatform = Math.min(...platforms.map(p => p.y))
    if (highestPlatform > cameraY - 100) {
      spawnPlatform(highestPlatform - (50 + Math.random() * 50))
    }

    // 清理平台
    platforms.forEach((p, i) => {
      if (p.y > cameraY + H + 100) {
        platforms.splice(i, 1)
      }
    })

    // 掉落检测
    if (player.y > cameraY + H + 100) {
      combo = 0
      // 重置位置
      player.y = cameraY + H - 150
      player.vy = 0
      player.x = W / 2
    }
  }

  function getPos(e: MouseEvent | TouchEvent) {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * (W / rect.width) }
    }
    return { x: (e.clientX - rect.left) * (W / rect.width) }
  }

  canvas.onmousemove = canvas.ontouchmove = (e) => {
    mouseX = getPos(e as any).x
  }
  canvas.onmousedown = canvas.ontouchstart = (e) => {
    mouseX = getPos(e as any).x
  }

  function loop() {
    if (!document.getElementById('mainGameCanvas') || gameEnded) return
    
    if (Date.now() - gameStartTime > GAME_DURATION) {
      gameEnded = true
      engine.endGame()
      onEnd()
      return
    }
    
    update()
    draw()
    requestAnimationFrame(loop)
  }

  engine.start()
  
  // 初始平台
  platforms.push({ x: W / 2 - 50, y: H - 100, width: 100, height: 15, type: 'normal' })
  for (let i = 0; i < 10; i++) {
    spawnPlatform(H - 200 - i * 70)
  }
  
      
  loop()
}
