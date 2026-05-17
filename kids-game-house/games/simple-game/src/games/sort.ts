import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { GAME_ITEMS, ITEM_UNLOCK_TIMES, ITEM_SPAWN_WEIGHTS } from '../data/items'
import { app } from '../App'
import { bindCanvasEvents, getPointerPos, resizeCanvasForMobile } from '../utils/mobileHelper'

export function initSort(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  
  const W = 400, H = 600
  const TUBE_W = 50
  const TUBE_H = 180
  const BALL_R = 18
  const LIQUID_HEIGHT = BALL_R * 2 // 每个液体单元的高度
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
  let lastClickTime = 0 // 防止快速连击
  let clickEffect: { tube: number; time: number } | null = null // 点击特效
  let winAnimation = false // 胜利动画状态
  
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
              }
    })
  }
  
  // 使用道具
  function usePowerup(type: string): boolean {
    // 动画进行中，禁止使用道具
    if (animatingBall) {
      return false
    }
    
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
      const isSelected = selectedTube === idx
      
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      
      // 根据状态设置边框样式
      if (isSelected) {
        // 选中：黄色粗边框 + 光晕
        ctx.strokeStyle = '#FFD93D'
        ctx.lineWidth = 4
        ctx.shadowBlur = 20
        ctx.shadowColor = '#FFD93D'
      } else {
        // 普通：淡色边框
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'
        ctx.lineWidth = 2
        ctx.shadowBlur = 0
      }
      
      ctx.beginPath()
      ctx.roundRect(x - TUBE_W / 2, y, TUBE_W, TUBE_H, 8)
      ctx.fill()
      ctx.stroke()
      
      // 点击特效（扩散圆环）
      if (clickEffect && clickEffect.tube === idx && clickEffect.time > 0) {
        const progress = 1 - clickEffect.time / 20
        const radius = TUBE_W / 2 + progress * 15
        const alpha = 1 - progress
        
        ctx.strokeStyle = `rgba(255, 217, 61, ${alpha})`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(x, y + TUBE_H / 2, radius, 0, Math.PI * 2)
        ctx.stroke()
      }
      
      ctx.shadowBlur = 0
      
      // 绘制液体
      tube.forEach((color, liquidIdx) => {
        const liquidBottom = y + TUBE_H
        const liquidTop = liquidBottom - (liquidIdx + 1) * LIQUID_HEIGHT
        const liquidHeight = LIQUID_HEIGHT
        
        // 如果是动画中的液体
        if (animatingBall && animatingBall.fromTube === idx && liquidIdx === tube.length - 1) {
          return // 跳过，由动画绘制
        }
        
        // 液体主体（矩形）
        const liquidGrad = ctx.createLinearGradient(x - TUBE_W / 2 + 4, liquidTop, x - TUBE_W / 2 + 4, liquidBottom)
        liquidGrad.addColorStop(0, lightenColor(color, 30))
        liquidGrad.addColorStop(0.5, color)
        liquidGrad.addColorStop(1, darkenColor(color, 20))
        
        ctx.fillStyle = liquidGrad
        ctx.shadowBlur = 8
        ctx.shadowColor = color
        
        // 绘制液体矩形（留出试管边缘）
        const margin = 4
        ctx.fillRect(
          x - TUBE_W / 2 + margin,
          liquidTop,
          TUBE_W - margin * 2,
          liquidHeight - 1 // 留一点缝隙
        )
        ctx.shadowBlur = 0
        
        // 液体表面张力效果（顶部弧形）
        if (liquidIdx === tube.length - 1) {
          ctx.fillStyle = lightenColor(color, 40)
          ctx.beginPath()
          ctx.ellipse(
            x,
            liquidTop,
            TUBE_W / 2 - margin,
            4,
            0,
            0,
            Math.PI * 2
          )
          ctx.fill()
        }
        
        // 液体高光效果
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.fillRect(
          x - TUBE_W / 2 + margin + 3,
          liquidTop + 2,
          4,
          liquidHeight - 4
        )
      })
    })
    
    // 绘制动画中的液体流动
    if (animatingBall) {
      const progress = animatingBall.progress
      const fromX = 30 + animatingBall.fromTube * tubeSpacing
      const toX = 30 + animatingBall.toTube * tubeSpacing
      const fromY = H - 220 + TUBE_H - LIQUID_HEIGHT - (animatingBall.fromIndex) * LIQUID_HEIGHT
      const toY = H - 220 + TUBE_H - LIQUID_HEIGHT - (animatingBall.targetIndex) * LIQUID_HEIGHT
      
      // 抛物线路径（更像液体倾倒）
      const currentX = fromX + (toX - fromX) * progress
      const arcHeight = -100 // 更高的弧线，模拟倾倒
      const currentY = fromY + (toY - fromY) * progress + Math.sin(progress * Math.PI) * arcHeight
      
      // 液体流动效果（拉伸的椭圆形）
      const stretch = 1 + Math.sin(progress * Math.PI) * 0.5 // 中间拉伸
      const liquidWidth = (TUBE_W - 8) * stretch
      const liquidHeight = LIQUID_HEIGHT / stretch
      
      // 液体渐变
      const liquidGrad = ctx.createLinearGradient(
        currentX - liquidWidth / 2,
        currentY - liquidHeight / 2,
        currentX - liquidWidth / 2,
        currentY + liquidHeight / 2
      )
      liquidGrad.addColorStop(0, lightenColor(animatingBall.color, 30))
      liquidGrad.addColorStop(0.5, animatingBall.color)
      liquidGrad.addColorStop(1, darkenColor(animatingBall.color, 20))
      
      ctx.fillStyle = liquidGrad
      ctx.shadowBlur = 15
      ctx.shadowColor = animatingBall.color
      
      // 绘制流动的液体（圆角矩形）
      ctx.beginPath()
      ctx.roundRect(
        currentX - liquidWidth / 2,
        currentY - liquidHeight / 2,
        liquidWidth,
        liquidHeight,
        5
      )
      ctx.fill()
      ctx.shadowBlur = 0
      
      // 液体高光
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.fillRect(
        currentX - liquidWidth / 2 + 3,
        currentY - liquidHeight / 2 + 2,
        4,
        liquidHeight - 4
      )
      
      // 液滴效果（在流动路径上）
      if (progress > 0.2 && progress < 0.8) {
        const dropCount = 3
        for (let i = 0; i < dropCount; i++) {
          const dropProgress = progress + (i - 1) * 0.1
          if (dropProgress > 0 && dropProgress < 1) {
            const dropX = fromX + (toX - fromX) * dropProgress
            const dropY = fromY + (toY - fromY) * dropProgress + Math.sin(dropProgress * Math.PI) * arcHeight + 15
            const dropSize = 3 + Math.random() * 2
            
            ctx.fillStyle = animatingBall.color
            ctx.globalAlpha = 0.6
            ctx.beginPath()
            ctx.arc(dropX, dropY, dropSize, 0, Math.PI * 2)
            ctx.fill()
            ctx.globalAlpha = 1
          }
        }
      }
    }
    
    // 粒子效果
    particles.forEach((p, i) => {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.15
      p.life--
      
      // 根据生命周期调整透明度和大小
      const lifeRatio = p.life / 60
      ctx.globalAlpha = Math.max(0, lifeRatio)
      ctx.fillStyle = p.color
      
      // 胜利粒子更大更明显，普通粒子保持原样
      const currentSize = p.size * lifeRatio
      ctx.beginPath()
      ctx.arc(p.x, p.y, Math.max(0.1, currentSize), 0, Math.PI * 2)
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
    
    // 操作提示（胜利动画时不显示）
    if (!winAnimation) {
      if (selectedTube !== -1) {
        ctx.fillStyle = '#FFD93D'
        ctx.font = 'bold 16px sans-serif'
        ctx.fillText('👆 点击其他管子移动液体', W / 2, H - 20)
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.font = '14px sans-serif'
        ctx.fillText('💡 点击有液体的管子开始', W / 2, H - 20)
      }
    }
    
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
    
    // 点击特效衰减
    if (clickEffect) {
      clickEffect.time--
      if (clickEffect.time <= 0) {
        clickEffect = null
      }
    }
    
    // 检查超时
    if (now - gameStartTime > 120000) {
      engine.endGame()
      audioService.lose()
      onEnd()
      return
    }
    
    // 检查胜利
    if (checkWin()) {
      winAnimation = true
      engine.addScore(score + 100, W / 2, H / 2)
      audioService.win()
      
      // 添加胜利文字
      floatingTexts.push({
        text: '🎉 完成！',
        x: W / 2,
        y: H / 2 - 50,
        life: 80,
        color: '#FFD93D',
        size: 36
      })
      
      // 胜利特效 - 优化版（更简洁优雅）
      const centerX = W / 2
      const centerY = H / 2
      
      // 从中心向外爆发的粒子（数量减少，速度降低）
      for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 / 30) * i
        const speed = 2 + Math.random() * 3
        particles.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: COLORS[i % COLORS.length],
          life: 40 + Math.random() * 20,
          size: 3 + Math.random() * 3
        })
      }
      
      // 添加一些上升的彩带粒子
      for (let i = 0; i < 15; i++) {
        particles.push({
          x: Math.random() * W,
          y: H + 10,
          vx: (Math.random() - 0.5) * 2,
          vy: -3 - Math.random() * 2,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          life: 50 + Math.random() * 20,
          size: 2 + Math.random() * 2
        })
      }
      
      setTimeout(() => {
        onEnd()
      }, 1500)
      return
    }
  }
  
  // 初始化Canvas尺寸（移动端适配）
  resizeCanvasForMobile(canvas)
  
  // 点击处理（兼容鼠标和触摸）
  const handleClick = (e: MouseEvent | TouchEvent) => {
    // 动画进行中，禁止操作
    if (animatingBall) {
      return
    }
    
    // 防抖：300ms内不响应重复点击
    const now = Date.now()
    if (now - lastClickTime < 300) {
      return
    }
    lastClickTime = now
    
    const pos = getPointerPos(e, canvas)
    const mx = pos.x
    const my = pos.y
    
    const tubeSpacing = (W - 60) / (tubes.length - 1)
    
    // 找到点击的管子（精确检测）
    let clickedTube = -1
    for (let i = 0; i < tubes.length; i++) {
      const x = 30 + i * tubeSpacing
      const y = H - 220
      // 精确点击区域：管子的宽度和高度范围内
      if (mx >= x - TUBE_W / 2 && mx <= x + TUBE_W / 2 && 
          my >= y && my <= y + TUBE_H) {
        clickedTube = i
        break
      }
    }
    
    if (clickedTube === -1) {
      // 点击空白区域，取消选择
      if (selectedTube !== -1) {
        selectedTube = -1
        audioService.click()
      }
      return
    }
    
    // 第一次点击：选择有液体的管子
    if (selectedTube === -1) {
      if (tubes[clickedTube].length > 0) {
        selectedTube = clickedTube
        // 触发点击特效
        clickEffect = { tube: clickedTube, time: 20 }
        audioService.click()
      }
    } else {
      // 已选中管子，再次点击
      if (clickedTube === selectedTube) {
        // 点击同一个管子：取消选择
        selectedTube = -1
        // 触发点击特效
        clickEffect = { tube: clickedTube, time: 20 }
        audioService.click()
      } else {
        // 点击不同管子：尝试移动液体
        const fromTube = tubes[selectedTube]
        const toTube = tubes[clickedTube]
        
        // 检查移动条件
        if (fromTube.length === 0) {
          // 源管子为空，取消选择
          selectedTube = -1
          audioService.click()
        } else if (toTube.length >= 4) {
          // 目标管子已满，提示错误（可选：添加视觉反馈）
          selectedTube = -1
          audioService.click()
        } else {
          const ballColor = fromTube[fromTube.length - 1]
          
          // 检查颜色是否匹配（空管或同色）
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
            // 颜色不匹配，取消选择
            selectedTube = -1
            audioService.click()
          }
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
  
  // 颜色辅助函数
  function lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, (num >> 16) + Math.round(255 * percent / 100))
    const g = Math.min(255, ((num >> 8) & 0xFF) + Math.round(255 * percent / 100))
    const b = Math.min(255, (num & 0xFF) + Math.round(255 * percent / 100))
    return `rgb(${r},${g},${b})`
  }
  
  function darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.max(0, (num >> 16) - Math.round(255 * percent / 100))
    const g = Math.max(0, ((num >> 8) & 0xFF) - Math.round(255 * percent / 100))
    const b = Math.max(0, (num & 0xFF) - Math.round(255 * percent / 100))
    return `rgb(${r},${g},${b})`
  }
  
  initLevel()
  
  // 清除旧的事件监听器
  canvas.onclick = null
  canvas.onmousedown = null
  canvas.onmousemove = null
  canvas.ontouchstart = null
  canvas.ontouchmove = null
  
  // 只绑定点击事件（不绑定移动事件，避免状态混乱）
  const handleInteraction = (e: MouseEvent | TouchEvent) => {
    e.preventDefault()
    handleClick(e)
  }
  
  canvas.addEventListener('click', handleInteraction)
  canvas.addEventListener('touchstart', handleInteraction, { passive: false })
      
  loop()
}
