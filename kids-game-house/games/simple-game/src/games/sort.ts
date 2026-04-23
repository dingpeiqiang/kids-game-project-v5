import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { GAME_ITEMS, ITEM_UNLOCK_TIMES, ITEM_SPAWN_WEIGHTS } from '../data/items'
import { app } from '../App'

export function initSort(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  
  const W = 400, H = 600
  const TUBE_W = 50
  const TUBE_H = 180
  const BALL_R = 18
  const COLORS = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#9B59B6', '#FF69B4', '#6BCB77']
  
  // 游戏状态
  let tubes: string[][] = []
  let selectedTube: number = -1
  let animatingBall: any = null
  let score = 0
  let moves = 0
  let gameTime = 0
  let lastTime = Date.now()
  let particles: any[] = []
  let floatingTexts: any[] = []
  let screenShake = 0
  let gameStartTime = Date.now()
  let unlockedItems: string[] = []
  let itemCharge: Record<string, number> = {}
  
  // ====== HTML道具栏（库存模式）======
  let inventory: string[] = [] // 道具库存
  
  // 道具图标映射
  const powerupIcons: Record<string, string> = {
    'hint': '💡',         // 提示 - 高亮下一步操作
    'undo': '↩️',        // 撤销 - 回退一步
    'extra_tube': '🧪',  // 额外管子 - 增加一个空管
    'auto_sort': '✨'     // 自动排序 - 自动完成一个颜色
  }
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id
    }))
    
    app.setupCustomPowerupBar('sort', powerups, inventory, (powerupId) => {
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
    console.log('[道具] 使用道具:', type)
    
    switch (type) {
      case 'hint':
        // 提示 - 高亮下一步操作
        ;(window as any).sortHint = true
        audioService.win()
        console.log('[道具] 提示生效')
        break
        
      case 'undo':
        // 撤销 - 回退一步
        ;(window as any).sortUndo = true
        audioService.collect()
        console.log('[道具] 撤销已准备')
        break
        
      case 'extra_tube':
        // 额外管子 - 增加一个空管
        tubes.push([])
        audioService.win()
        console.log('[道具] 额外管子已添加')
        break
        
      case 'auto_sort':
        // 自动排序 - 自动完成一个颜色
        ;(window as any).sortAutoSort = true
        audioService.win()
        console.log('[道具] 自动排序已准备')
        break
    }
    
    return true
  }
  
  // 初始化关卡
  function initLevel() {
    tubes = []
    
    // 创建4个管子，每个4个球
    const allBalls: string[] = []
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        allBalls.push(COLORS[i])
      }
    }
    
    // 打乱
    for (let i = allBalls.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[allBalls[i], allBalls[j]] = [allBalls[j], allBalls[i]]
    }
    
    // 分配到4个管子
    for (let i = 0; i < 4; i++) {
      tubes.push(allBalls.slice(i * 4, (i + 1) * 4))
    }
    
    // 添加2个空管子
    tubes.push([])
    tubes.push([])
  }
  
  // 检查是否完成
  function checkWin(): boolean {
    return tubes.every(tube => {
      if (tube.length === 0) return true
      if (tube.length !== 4) return false
      return tube.every(color => color === tube[0])
    })
  }
  
  // 创建粒子效果
  function createParticles(x: number, y: number, color: string, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 4
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color,
        life: 40 + Math.random() * 20,
        size: 3 + Math.random() * 4
      })
    }
  }
  
  // 绘制
  function draw() {
    // 屏幕震动
    const shake = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0
    ctx.save()
    ctx.translate(shake, shake)
    
    // 渐变背景
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#1a1a3e')
    grad.addColorStop(0.5, '#2d2d5e')
    grad.addColorStop(1, '#1a1a3e')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
    
    // 星星背景
    for (let i = 0; i < 40; i++) {
      const alpha = 0.2 + Math.sin(Date.now() * 0.002 + i) * 0.15
      ctx.fillStyle = `rgba(255,255,255,${alpha})`
      ctx.beginPath()
      ctx.arc((i * 67) % W, (i * 43) % (H - 100), 1 + (i % 2), 0, Math.PI * 2)
      ctx.fill()
    }
    
    // 绘制管子
    const tubeSpacing = (W - 60) / (tubes.length - 1)
    tubes.forEach((tube, idx) => {
      const x = 30 + idx * tubeSpacing
      const y = H - 220
      
      // 管子背景
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      ctx.strokeStyle = selectedTube === idx ? '#FFD93D' : 'rgba(255,255,255,0.3)'
      ctx.lineWidth = selectedTube === idx ? 3 : 2
      ctx.beginPath()
      ctx.roundRect(x - TUBE_W / 2, y, TUBE_W, TUBE_H, 8)
      ctx.fill()
      ctx.stroke()
      
      // 绘制球
      tube.forEach((color, ballIdx) => {
        const ballY = y + TUBE_H - BALL_R - ballIdx * (BALL_R * 2)
        
        // 如果是动画中的球
        if (animatingBall && animatingBall.fromTube === idx && ballIdx === tube.length - 1) {
          return // 跳过，由动画绘制
        }
        
        // 球体渐变
        const ballGrad = ctx.createRadialGradient(
          x - BALL_R * 0.3, ballY - BALL_R * 0.3, BALL_R * 0.1,
          x, ballY, BALL_R
        )
        ballGrad.addColorStop(0, '#fff')
        ballGrad.addColorStop(0.3, color)
        ballGrad.addColorStop(1, color)
        
        ctx.fillStyle = ballGrad
        ctx.shadowBlur = 10
        ctx.shadowColor = color
        ctx.beginPath()
        ctx.arc(x, ballY, BALL_R, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        
        // 高光
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.beginPath()
        ctx.arc(x - BALL_R * 0.3, ballY - BALL_R * 0.3, BALL_R * 0.25, 0, Math.PI * 2)
        ctx.fill()
      })
    })
    
    // 绘制动画中的球
    if (animatingBall) {
      const progress = animatingBall.progress
      const fromX = 30 + animatingBall.fromTube * tubeSpacing
      const toX = 30 + animatingBall.toTube * tubeSpacing
      const fromY = H - 220 + TUBE_H - BALL_R - (animatingBall.fromIndex) * (BALL_R * 2)
      const toY = H - 220 + TUBE_H - BALL_R - (animatingBall.targetIndex) * (BALL_R * 2)
      
      // 抛物线路径
      const currentX = fromX + (toX - fromX) * progress
      const arcHeight = -80
      const currentY = fromY + (toY - fromY) * progress + Math.sin(progress * Math.PI) * arcHeight
      
      // 球体
      const ballGrad = ctx.createRadialGradient(
        currentX - BALL_R * 0.3, currentY - BALL_R * 0.3, BALL_R * 0.1,
        currentX, currentY, BALL_R
      )
      ballGrad.addColorStop(0, '#fff')
      ballGrad.addColorStop(0.3, animatingBall.color)
      ballGrad.addColorStop(1, animatingBall.color)
      
      ctx.fillStyle = ballGrad
      ctx.shadowBlur = 15
      ctx.shadowColor = animatingBall.color
      ctx.beginPath()
      ctx.arc(currentX, currentY, BALL_R, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      
      // 高光
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.beginPath()
      ctx.arc(currentX - BALL_R * 0.3, currentY - BALL_R * 0.3, BALL_R * 0.25, 0, Math.PI * 2)
      ctx.fill()
    }
    
    // 粒子效果
    particles.forEach((p, i) => {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.15
      p.life--
      ctx.globalAlpha = p.life / 60
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, Math.max(0.1, p.size * (p.life / 60)), 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
      if (p.life <= 0) particles.splice(i, 1)
    })
    
    // 浮动文字
    floatingTexts.forEach((f, i) => {
      f.y -= 1.5
      f.life--
      ctx.globalAlpha = Math.max(0, f.life / 50)
      ctx.fillStyle = f.color
      ctx.font = `bold ${f.size || 20}px sans-serif`
      ctx.textAlign = 'center'
      ctx.shadowBlur = 10
      ctx.shadowColor = f.color
      ctx.fillText(f.text, f.x, f.y)
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
      if (f.life <= 0) floatingTexts.splice(i, 1)
    })
    
    ctx.restore()
    
    // UI层
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${score}`, W / 2, 35)
    
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = '14px sans-serif'
    ctx.fillText(`步数: ${moves}`, W / 2, 55)
    
    // 倒计时
    const now = Date.now()
    const remaining = Math.max(0, 120000 - (now - gameStartTime))
    const seconds = Math.ceil(remaining / 1000)
    
    if (seconds <= 20) {
      ctx.fillStyle = seconds <= 5 ? '#FF6B6B' : '#FFD93D'
      ctx.font = 'bold 18px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`⏱️ ${seconds}s`, W - 20, 35)
    }
  }
  
  // 更新
  function update() {
    const now = Date.now()
    const dt = now - lastTime
    lastTime = now
    gameTime += dt
    
    // 屏幕震动衰减
    if (screenShake > 0) screenShake *= 0.9
    
    // 检查超时
    if (now - gameStartTime > 120000) {
      engine.endGame()
      audioService.lose()
      onEnd()
      return
    }
    
    // 检查胜利
    if (checkWin()) {
      engine.addScore(score + 100, W / 2, H / 2)
      audioService.win()
      
      // 胜利特效
      for (let i = 0; i < 100; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          life: 60 + Math.random() * 30,
          size: 4 + Math.random() * 6
        })
      }
      
      setTimeout(() => {
        onEnd()
      }, 1500)
      return
    }
  }
  
  // 点击处理
  canvas.onclick = (e) => {
    const rect = canvas.getBoundingClientRect()
    const sx = W / rect.width
    const sy = H / rect.height
    const mx = (e.clientX - rect.left) * sx
    const my = (e.clientY - rect.top) * sy
    
    const tubeSpacing = (W - 60) / (tubes.length - 1)
    
    // 找到点击的管子
    let clickedTube = -1
    for (let i = 0; i < tubes.length; i++) {
      const x = 30 + i * tubeSpacing
      if (Math.abs(mx - x) < TUBE_W / 2 + 10 && my > H - 220 && my < H - 40) {
        clickedTube = i
        break
      }
    }
    
    if (clickedTube === -1) return
    
    // 第一次点击：选择管子
    if (selectedTube === -1) {
      if (tubes[clickedTube].length > 0) {
        selectedTube = clickedTube
        audioService.click()
      }
    } else {
      // 第二次点击：移动球
      if (clickedTube === selectedTube) {
        // 取消选择
        selectedTube = -1
        audioService.click()
      } else {
        // 尝试移动
        const fromTube = tubes[selectedTube]
        const toTube = tubes[clickedTube]
        
        if (fromTube.length > 0 && toTube.length < 4) {
          const ballColor = fromTube[fromTube.length - 1]
          
          // 检查是否可以放置（空管或同色）
          if (toTube.length === 0 || toTube[toTube.length - 1] === ballColor) {
            // 开始动画
            animatingBall = {
              fromTube: selectedTube,
              toTube: clickedTube,
              fromIndex: fromTube.length - 1,
              targetIndex: toTube.length,
              color: ballColor,
              progress: 0
            }
            
            const animateMove = () => {
              if (animatingBall) {
                animatingBall.progress += 0.08
                if (animatingBall.progress >= 1) {
                  // 动画完成，实际移动
                  const ball = tubes[animatingBall.fromTube].pop()!
                  tubes[animatingBall.toTube].push(ball)
                  
                  moves++
                  score += 10
                  
                  // 检查是否完成一个管子
                  if (tubes[animatingBall.toTube].length === 4 && 
                      tubes[animatingBall.toTube].every(c => c === ball)) {
                    score += 50
                    floatingTexts.push({
                      text: '+50',
                      x: 30 + animatingBall.toTube * tubeSpacing,
                      y: H - 220,
                      life: 50,
                      color: '#FFD93D',
                      size: 24
                    })
                    
                    // 完成特效
                    for (let i = 0; i < 20; i++) {
                      createParticles(
                        30 + animatingBall.toTube * tubeSpacing,
                        H - 220 + TUBE_H / 2,
                        ball,
                        5
                      )
                    }
                    
                    audioService.crit()
                  } else {
                    audioService.pop()
                  }
                  
                  animatingBall = null
                  selectedTube = -1
                } else {
                  requestAnimationFrame(animateMove)
                }
              }
            }
            animateMove()
          } else {
            // 不能放置
            selectedTube = -1
            audioService.click()
          }
        } else {
          selectedTube = -1
          audioService.click()
        }
      }
    }
  }
  
  // 主循环
  function loop() {
    if (!document.getElementById('mainGameCanvas')) return
    update()
    draw()
    requestAnimationFrame(loop)
  }
  
  initLevel()
  
  // 初始化 HTML 道具栏
  updateHTMLPowerupBar()
  
  loop()
}
