import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { app } from '../services/appBridge'
import { resizeCanvasForMobile } from '../utils/mobileHelper'
import { applyCanvasMobileStyles, bindCanvasPointerInput } from '../utils/canvasMobileUtils'

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
  let timeLeft = 30 // 每轮30秒（道具加时）
  let roundTime = Date.now()
  let particles: any[] = []
  let gameEnded = false
  let gameStartTime = Date.now()
  const TOTAL_TIME = 90000 // 90秒
  let targetButton: number | null = null
  
  // ====== 音频控制变量 ======
  let lastSoundTime = 0
  const MIN_SOUND_INTERVAL = 80 // 最小音效间隔（毫秒）
  let soundVolume = 0.3 // 降低默认音量
  
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
      const now = Date.now()
      if (now - lastSoundTime > MIN_SOUND_INTERVAL && usePowerup(powerupId)) {
        audioService.click() // 使用简单的click音效
        lastSoundTime = now
      }
    })
  }
  
  // 使用道具
  function usePowerup(type: string): boolean {
    const index = inventory.indexOf(type)
    if (index === -1) return false
    
    inventory.splice(index, 1)
    console.log('[道具] 使用道具:', type)
    
    // 控制音效播放频率
    const now = Date.now()
    
    switch (type) {
      case 'time_plus':
        // 加时 - 增加10秒
        timeLeft += 10
        if (now - lastSoundTime > MIN_SOUND_INTERVAL) {
          audioService.collect() // 使用更简短的collect音效
          lastSoundTime = now
        }
        console.log('[道具] 加时10秒，剩余:', timeLeft)
        break
        
      case 'auto_tap':
        // 自动点击 - 5秒内自动正确点击
        ;(window as any).colorAutoTap = Date.now() + 5000
        if (now - lastSoundTime > MIN_SOUND_INTERVAL) {
          audioService.buff() // 使用buff音效表示增益效果
          lastSoundTime = now
        }
        console.log('[道具] 自动点击生效，持续5秒')
        break
        
      case 'score3x':
        // 三倍分数 - 10秒内分数×3
        ;(window as any).colorScore3x = Date.now() + 10000
        if (now - lastSoundTime > MIN_SOUND_INTERVAL) {
          audioService.buff() // 使用buff音效
          lastSoundTime = now
        }
        console.log('[道具] 三倍分数生效，持续10秒')
        break
        
      case 'freeze':
        // 冻结 - 停止计时8秒
        ;(window as any).colorFreeze = Date.now() + 8000
        if (now - lastSoundTime > MIN_SOUND_INTERVAL) {
          audioService.freeze() // 使用专门的freeze音效
          lastSoundTime = now
        }
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

    // 局内 HUD：得分/连击由 CanvasGamePlay 顶栏展示
    const elapsedHud = Date.now() - gameStartTime
    const remainingHud = Math.max(0, TOTAL_TIME - elapsedHud)
    const secondsHud = Math.ceil(remainingHud / 1000)
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.beginPath()
    ctx.roundRect(10, 8, W - 20, 40, 10)
    ctx.fill()
    ctx.fillStyle = secondsHud <= 10 ? '#FF4444' : '#FFD700'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`⏱ 剩余 ${secondsHud} 秒`, W / 2, 28)

    // 目标提示
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.font = '22px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`目标: ${COLORS[currentColor].name}`, W / 2, 78)

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
          const streak = engine.getCombo() + 1
          engine.addScore(10 * streak, bx, btnY)
          
          // 控制音效播放频率，避免声音重叠
          const now = Date.now()
          if (now - lastSoundTime > MIN_SOUND_INTERVAL) {
            audioService.pop() // 使用更清脆的pop音效替代win
            lastSoundTime = now
          }
          
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
          
          if (engine.getCombo() >= 5) engine.triggerRandomBuff()
          
          // 下一个
          spawnChallenge()
        } else {
          engine.breakCombo()
          
          // 控制音效播放频率
          const now = Date.now()
          if (now - lastSoundTime > MIN_SOUND_INTERVAL) {
            audioService.fail() // 使用fail音效替代lose，更简短
            lastSoundTime = now
          }
          
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

  resizeCanvasForMobile(canvas)
  applyCanvasMobileStyles(canvas)

  const unbindPointer = bindCanvasPointerInput(canvas, (x, y) => {
    handleClick(x, y)
  })

  function loop() {
    if (!document.getElementById('mainGameCanvas') || gameEnded) return

    const elapsed = Date.now() - gameStartTime
    if (elapsed > TOTAL_TIME) {
      gameEnded = true
      unbindPointer()
      engine.endGame()
      onEnd()
      return
    }
    
    draw()
    requestAnimationFrame(loop)
  }

  engine.start()
  spawnChallenge()
  
  // 初始化音频上下文（在用户交互后）
  const initAudio = () => {
    audioService.initOnGesture()
    document.removeEventListener('click', initAudio)
    document.removeEventListener('touchstart', initAudio)
  }
  document.addEventListener('click', initAudio, { once: true })
  document.addEventListener('touchstart', initAudio, { once: true })
  
  loop()
}
