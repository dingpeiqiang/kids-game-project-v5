import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { app } from '../App'

export function initColorTap(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  const W = 400, H = 600
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false

  const COLORS = [
    { name: '红', hex: '#FF6B6B', emoji: '🔴' },
    { name: '蓝', hex: '#4ECDC4', emoji: '🔵' },
    { name: '黄', hex: '#FFD93D', emoji: '🟡' },
    { name: '绿', hex: '#6BCB77', emoji: '🟢' },
    { name: '紫', hex: '#9B59B6', emoji: '🟣' },
    { name: '橙', hex: '#FF9F43', emoji: '🟠' },
  ]

  const SHAPES = ['circle', 'square', 'triangle', 'star']

  let currentColor = 0
  let currentShape = 0
  let score = 0
  let combo = 0
  let timeLeft = 30 // 每轮30秒
  let roundTime = Date.now()
  let particles: any[] = []
  let gameEnded = false
  let gameStartTime = Date.now()
  const TOTAL_TIME = 90000 // 90秒
  let targetButton: number | null = null
  
  // ====== 道具系统（库存模式）======
  let inventory: string[] = [] // 道具库存
  
  // 道具图标映射
  const powerupIcons: Record<string, string> = {
    'time_plus': '⏰',     // 加时 - 增加10秒
    'auto_tap': '🤖',     // 自动点击 - 5秒内自动正确点击
    'score3x': '✨',      // 三倍分数 - 10秒内分数×3
    'freeze': '❄️'        // 冻结 - 停止计时8秒
  }
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id
    }))
    
    app.setupCustomPowerupBar('colorTap', powerups, inventory, (powerupId) => {
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
      case 'time_plus':
        // 加时 - 增加10秒
        timeLeft += 10
        audioService.win()
        console.log('[道具] 加时10秒，剩余:', timeLeft)
        break
        
      case 'auto_tap':
        // 自动点击 - 5秒内自动正确点击
        ;(window as any).colorAutoTap = Date.now() + 5000
        audioService.win()
        console.log('[道具] 自动点击生效，持续5秒')
        break
        
      case 'score3x':
        // 三倍分数 - 10秒内分数×3
        ;(window as any).colorScore3x = Date.now() + 10000
        audioService.win()
        console.log('[道具] 三倍分数生效，持续10秒')
        break
        
      case 'freeze':
        // 冻结 - 停止计时8秒
        ;(window as any).colorFreeze = Date.now() + 8000
        audioService.collect()
        console.log('[道具] 冻结计时8秒')
        break
    }
    
    return true
  }

  function spawnChallenge() {
    currentColor = Math.floor(Math.random() * COLORS.length)
    currentShape = Math.floor(Math.random() * SHAPES.length)
    targetButton = null
    roundTime = Date.now()
  }

  function draw() {
    // 背景
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, W, H)

    // 顶部标题
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🎯 颜色Tap', W / 2, 40)

    // 目标提示
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '22px sans-serif'
    ctx.fillText(`目标: ${COLORS[currentColor].name}`, W / 2, 90)

    // 绘制当前形状
    const shapeX = W / 2
    const shapeY = 200
    const shapeSize = 80
    const color = COLORS[currentColor].hex

    ctx.shadowColor = color
    ctx.shadowBlur = 20
    ctx.fillStyle = color
    
    ctx.beginPath()
    if (currentShape === 0) { // circle
      ctx.arc(shapeX, shapeY, shapeSize / 2, 0, Math.PI * 2)
    } else if (currentShape === 1) { // square
      ctx.roundRect(shapeX - shapeSize / 2, shapeY - shapeSize / 2, shapeSize, shapeSize, 10)
    } else if (currentShape === 2) { // triangle
      ctx.moveTo(shapeX, shapeY - shapeSize / 2)
      ctx.lineTo(shapeX + shapeSize / 2, shapeY + shapeSize / 2)
      ctx.lineTo(shapeX - shapeSize / 2, shapeY + shapeSize / 2)
      ctx.closePath()
    } else { // star
      drawStar(shapeX, shapeY, 5, shapeSize / 2, shapeSize / 4)
    }
    ctx.fill()
    ctx.shadowBlur = 0

    // 选择按钮区域
    const btnY = 420
    const btnSize = 55
    const gap = 15
    const totalWidth = COLORS.length * btnSize + (COLORS.length - 1) * gap
    const startX = (W - totalWidth) / 2 + btnSize / 2

    COLORS.forEach((c, i) => {
      const bx = startX + i * (btnSize + gap)
      
      // 按钮背景
      const grad = ctx.createRadialGradient(bx - 5, btnY - 5, 0, bx, btnY, btnSize / 2)
      grad.addColorStop(0, lightenColor(c.hex, 40))
      grad.addColorStop(1, c.hex)
      
      ctx.shadowColor = c.hex
      ctx.shadowBlur = 10
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(bx, btnY, btnSize / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // 标签
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(c.name, bx, btnY + 25)
    })

    // 粒子
    particles.forEach((p, i) => {
      p.life -= 0.025
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.15
      
      if (p.life <= 0) { particles.splice(i, 1); return }
      
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })

    // 分数
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 42px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(engine.getScore()), W / 2, H - 100)
    
    if (combo >= 3) {
      ctx.fillStyle = '#FF6B6B'
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText(`${combo} 连击!`, W / 2, H - 60)
    }

    // 倒计时
    const elapsed = Date.now() - gameStartTime
    const remaining = Math.max(0, TOTAL_TIME - elapsed)
    const seconds = Math.ceil(remaining / 1000)
    
    ctx.fillStyle = seconds <= 10 ? '#FF4444' : '#fff'
    ctx.font = 'bold 22px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`${seconds}s`, W - 15, 35)

    // 提示
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '16px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('👆 点击下方按钮匹配颜色!', W / 2, H - 25)
  }

  function drawStar(cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
    let rot = Math.PI / 2 * 3
    let x = cx
    let y = cy
    const step = Math.PI / spikes

    ctx.moveTo(cx, cy - outerRadius)
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius
      y = cy + Math.sin(rot) * outerRadius
      ctx.lineTo(x, y)
      rot += step

      x = cx + Math.cos(rot) * innerRadius
      y = cy + Math.sin(rot) * innerRadius
      ctx.lineTo(x, y)
      rot += step
    }
    ctx.lineTo(cx, cy - outerRadius)
    ctx.closePath()
  }

  function lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const R = Math.min(255, (num >> 16) + percent)
    const G = Math.min(255, ((num >> 8) & 0xFF) + percent)
    const B = Math.min(255, (num & 0xFF) + percent)
    return `rgb(${R},${G},${B})`
  }

  function handleClick(x: number, y: number) {
    const btnY = 420
    const btnSize = 55
    const gap = 15
    const totalWidth = COLORS.length * btnSize + (COLORS.length - 1) * gap
    const startX = (W - totalWidth) / 2 + btnSize / 2

    COLORS.forEach((c, i) => {
      const bx = startX + i * (btnSize + gap)
      const dist = Math.hypot(x - bx, y - btnY)
      
      if (dist < btnSize / 2) {
        if (i === currentColor) {
          // 正确！
          combo++
          const baseScore = 10 * combo
          engine.addScore(baseScore, bx, btnY)
          audioService.win()
          
          // 爆炸效果
          for (let j = 0; j < 15; j++) {
            particles.push({
              x: bx,
              y: btnY,
              vx: (Math.random() - 0.5) * 12,
              vy: (Math.random() - 0.5) * 12,
              life: 1,
              color: c.hex,
              size: 6 + Math.random() * 6
            })
          }
          
          if (combo >= 5) engine.triggerRandomBuff()
          
          // 下一个
          spawnChallenge()
        } else {
          // 错误
          combo = 0
          audioService.lose()
          
          // 抖动效果
          for (let j = 0; j < 8; j++) {
            particles.push({
              x: bx,
              y: btnY,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              life: 1,
              color: '#666',
              size: 4 + Math.random() * 4
            })
          }
        }
      }
    })
  }

  function getPos(e: MouseEvent | TouchEvent) {
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (W / rect.width),
      y: (e.clientY - rect.top) * (H / rect.height)
    }
  }

  canvas.onclick = (e) => {
    const pos = getPos(e)
    handleClick(pos.x, pos.y)
  }

  canvas.ontouchend = (e) => {
    e.preventDefault()
    if (e.changedTouches.length > 0) {
      const rect = canvas.getBoundingClientRect()
      const x = (e.changedTouches[0].clientX - rect.left) * (W / rect.width)
      const y = (e.changedTouches[0].clientY - rect.top) * (H / rect.height)
      handleClick(x, y)
    }
  }

  function loop() {
    if (!document.getElementById('mainGameCanvas') || gameEnded) return
    
    const elapsed = Date.now() - gameStartTime
    if (elapsed > TOTAL_TIME) {
      gameEnded = true
      engine.endGame()
      onEnd()
      return
    }
    
    draw()
    requestAnimationFrame(loop)
  }

  engine.start()
  spawnChallenge()
  
      
  loop()
}
