import type { GameEngine } from '../../services/gameEngine'
import { audioService } from '../../services/audio'
import { app } from '../../App'
import { getPointerPos, resizeCanvasForMobile, injectMobileStyles } from '../../utils/mobileHelper'
import { COLOR_SORT_LEVELS, getLevelColors } from './levelConfig'
import { loadProgress, completeLevel, recordFailure } from './progressManager'

export function initColorSort(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  
  const W = 400, H = 600
  const TUBE_W = 50
  const TUBE_H = 180
  const BALL_R = 18
  // 液体高度将根据当前关卡动态计算
  let LIQUID_HEIGHT = TUBE_H / 4 // 默认值，会在 initLevel 中重新计算
  
  // 加载进度和关卡配置
  let progress = loadProgress()
  let currentLevel = progress.currentLevel
  let levelConfig = COLOR_SORT_LEVELS.find(l => l.level === currentLevel) || COLOR_SORT_LEVELS[0]
  let COLORS = getLevelColors(currentLevel)
  
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
  let lastClickTime = 0
  let clickEffect: { tube: number; time: number } | null = null
  let winAnimation = false

  // 初始化关卡（使用关卡配置）
  function initLevel() {
    tubes = []
    COLORS = getLevelColors(currentLevel)
    levelConfig = COLOR_SORT_LEVELS.find(l => l.level === currentLevel) || COLOR_SORT_LEVELS[0]
    
    // 根据当前关卡容量计算液体高度，确保装满时视觉上是满的
    LIQUID_HEIGHT = TUBE_H / levelConfig.ballsPerTube
    
    const totalBalls = levelConfig.colorCount * levelConfig.ballsPerTube
    const allBalls: string[] = []
    
    for (let i = 0; i < levelConfig.colorCount; i++) {
      for (let j = 0; j < levelConfig.ballsPerTube; j++) {
        allBalls.push(COLORS[i])
      }
    }
    
    for (let i = allBalls.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[allBalls[i], allBalls[j]] = [allBalls[j], allBalls[i]]
    }
    
    const filledTubes = levelConfig.tubeCount - 2
    for (let i = 0; i < filledTubes; i++) {
      const startIdx = i * levelConfig.ballsPerTube
      tubes.push(allBalls.slice(startIdx, startIdx + levelConfig.ballsPerTube))
    }
    
    for (let i = filledTubes; i < levelConfig.tubeCount; i++) {
      tubes.push([])
    }
    
    selectedTube = -1
    animatingBall = null
    score = 0
    moves = 0
    gameTime = 0
    particles = []
    floatingTexts = []
    winAnimation = false
    gameStartTime = Date.now()
  }
  
  // 检查胜利（使用关卡配置）
  function checkWin(): boolean {
    return tubes.every(tube => {
      if (tube.length === 0) return true
      if (tube.length !== levelConfig.ballsPerTube) return false
      return tube.every(color => color === tube[0])
    })
  }
  
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
  
  function draw() {
    const shake = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0
    ctx.save()
    ctx.translate(shake, shake)
    
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#1a1a3e')
    grad.addColorStop(0.5, '#2d2d5e')
    grad.addColorStop(1, '#1a1a3e')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
    
    for (let i = 0; i < 40; i++) {
      const alpha = 0.2 + Math.sin(Date.now() * 0.002 + i) * 0.15
      ctx.fillStyle = `rgba(255,255,255,${alpha})`
      ctx.beginPath()
      ctx.arc((i * 67) % W, (i * 43) % (H - 100), 1 + (i % 2), 0, Math.PI * 2)
      ctx.fill()
    }
    
    const tubeSpacing = (W - 60) / (tubes.length - 1)
    tubes.forEach((tube, idx) => {
      const x = 30 + idx * tubeSpacing
      const y = H - 220
      
      const isSelected = selectedTube === idx
      
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      
      if (isSelected) {
        ctx.strokeStyle = '#FFD93D'
        ctx.lineWidth = 4
        ctx.shadowBlur = 20
        ctx.shadowColor = '#FFD93D'
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'
        ctx.lineWidth = 2
        ctx.shadowBlur = 0
      }
      
      ctx.beginPath()
      ctx.roundRect(x - TUBE_W / 2, y, TUBE_W, TUBE_H, 8)
      ctx.fill()
      ctx.stroke()
      
      if (clickEffect && clickEffect.tube === idx && clickEffect.time > 0) {
        const prog = 1 - clickEffect.time / 20
        const radius = TUBE_W / 2 + prog * 15
        const alpha = 1 - prog
        
        ctx.strokeStyle = `rgba(255, 217, 61, ${alpha})`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(x, y + TUBE_H / 2, radius, 0, Math.PI * 2)
        ctx.stroke()
      }
      
      ctx.shadowBlur = 0
      
      // 显示容量指示器
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${tube.length}/${levelConfig.ballsPerTube}`, x, y + TUBE_H + 15)
      
      tube.forEach((color, liquidIdx) => {
        const liquidBottom = y + TUBE_H
        const liquidTop = liquidBottom - (liquidIdx + 1) * LIQUID_HEIGHT
        
        if (animatingBall && animatingBall.fromTube === idx && liquidIdx === tube.length - 1) {
          return
        }
        
        const liquidGrad = ctx.createLinearGradient(x - TUBE_W / 2 + 4, liquidTop, x - TUBE_W / 2 + 4, liquidBottom)
        liquidGrad.addColorStop(0, lightenColor(color, 30))
        liquidGrad.addColorStop(0.5, color)
        liquidGrad.addColorStop(1, darkenColor(color, 20))
        
        ctx.fillStyle = liquidGrad
        ctx.shadowBlur = 8
        ctx.shadowColor = color
        
        const margin = 4
        ctx.fillRect(x - TUBE_W / 2 + margin, liquidTop, TUBE_W - margin * 2, LIQUID_HEIGHT - 1)
        ctx.shadowBlur = 0
        
        if (liquidIdx === tube.length - 1) {
          ctx.fillStyle = lightenColor(color, 40)
          ctx.beginPath()
          ctx.ellipse(x, liquidTop, TUBE_W / 2 - margin, 4, 0, 0, Math.PI * 2)
          ctx.fill()
        }
        
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.fillRect(x - TUBE_W / 2 + margin + 3, liquidTop + 2, 4, LIQUID_HEIGHT - 4)
      })
    })
    
    if (animatingBall) {
      const prog = animatingBall.progress
      const fromX = 30 + animatingBall.fromTube * tubeSpacing
      const toX = 30 + animatingBall.toTube * tubeSpacing
      const fromY = H - 220 + TUBE_H - LIQUID_HEIGHT - (animatingBall.fromIndex) * LIQUID_HEIGHT
      const toY = H - 220 + TUBE_H - LIQUID_HEIGHT - (animatingBall.targetIndex) * LIQUID_HEIGHT
      
      const currentX = fromX + (toX - fromX) * prog
      const arcHeight = -100
      const currentY = fromY + (toY - fromY) * prog + Math.sin(prog * Math.PI) * arcHeight
      
      const stretch = 1 + Math.sin(prog * Math.PI) * 0.5
      const liquidWidth = (TUBE_W - 8) * stretch
      const liquidHeight = LIQUID_HEIGHT / stretch
      
      const liquidGrad = ctx.createLinearGradient(
        currentX - liquidWidth / 2, currentY - liquidHeight / 2,
        currentX - liquidWidth / 2, currentY + liquidHeight / 2
      )
      liquidGrad.addColorStop(0, lightenColor(animatingBall.color, 30))
      liquidGrad.addColorStop(0.5, animatingBall.color)
      liquidGrad.addColorStop(1, darkenColor(animatingBall.color, 20))
      
      ctx.fillStyle = liquidGrad
      ctx.shadowBlur = 15
      ctx.shadowColor = animatingBall.color
      
      ctx.beginPath()
      ctx.roundRect(currentX - liquidWidth / 2, currentY - liquidHeight / 2, liquidWidth, liquidHeight, 5)
      ctx.fill()
      ctx.shadowBlur = 0
      
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.fillRect(currentX - liquidWidth / 2 + 3, currentY - liquidHeight / 2 + 2, 4, liquidHeight - 4)
      
      if (prog > 0.2 && prog < 0.8) {
        for (let i = 0; i < 3; i++) {
          const dropProg = prog + (i - 1) * 0.1
          if (dropProg > 0 && dropProg < 1) {
            const dropX = fromX + (toX - fromX) * dropProg
            const dropY = fromY + (toY - fromY) * dropProg + Math.sin(dropProg * Math.PI) * arcHeight + 15
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
    
    particles.forEach((p, i) => {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.15
      p.life--
      
      const lifeRatio = p.life / 60
      ctx.globalAlpha = Math.max(0, lifeRatio)
      ctx.fillStyle = p.color
      
      const currentSize = p.size * lifeRatio
      ctx.beginPath()
      ctx.arc(p.x, p.y, Math.max(0.1, currentSize), 0, Math.PI * 2)
      ctx.fill()
      
      ctx.globalAlpha = 1
      if (p.life <= 0) particles.splice(i, 1)
    })
    
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
    
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${score}`, W / 2, 35)
    
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = '14px sans-serif'
    ctx.fillText(`步数: ${moves}`, W / 2, 55)
    
    // 关卡信息
    ctx.fillStyle = '#FFD93D'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`第 ${currentLevel} 关`, 15, 35)
    
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '12px sans-serif'
    ctx.fillText(levelConfig.name, 15, 52)
    
    if (!winAnimation) {
      if (selectedTube !== -1) {
        ctx.fillStyle = '#FFD93D'
        ctx.font = 'bold 16px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('👆 点击其他管子移动液体', W / 2, H - 20)
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.font = '14px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('💡 点击有液体的管子开始', W / 2, H - 20)
      }
    }
    
    const now = Date.now()
    const remaining = Math.max(0, levelConfig.timeLimit * 1000 - (now - gameStartTime))
    const seconds = Math.ceil(remaining / 1000)
    
    if (seconds <= 20) {
      ctx.fillStyle = seconds <= 5 ? '#FF6B6B' : '#FFD93D'
      ctx.font = 'bold 18px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`⏱️ ${seconds}s`, W - 20, 35)
    }
  }
  
  function update() {
    const now = Date.now()
    const dt = now - lastTime
    lastTime = now
    gameTime += dt
    
    if (screenShake > 0) screenShake *= 0.9
    
    if (clickEffect) {
      clickEffect.time--
      if (clickEffect.time <= 0) {
        clickEffect = null
      }
    }
    
    if (now - gameStartTime > levelConfig.timeLimit * 1000) {
      recordFailure()
      engine.endGame()
      audioService.lose()
      onEnd()
      return
    }
    
    if (checkWin() && !winAnimation) {
      winAnimation = true
      
      completeLevel(currentLevel, score)
      engine.setVictory(true)
      
      engine.addScore(score + 100, W / 2, H / 2)
      audioService.win()
      
      floatingTexts.push({
        text: '🎉 完成！',
        x: W / 2,
        y: H / 2 - 50,
        life: 80,
        color: '#FFD93D',
        size: 36
      })
      
      const centerX = W / 2
      const centerY = H / 2
      
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
        const nextLevel = currentLevel + 1
        if (nextLevel <= COLOR_SORT_LEVELS.length) {
          currentLevel = nextLevel
          initLevel()
        } else {
          onEnd()
        }
      }, 2000)
      return
    }
  }
  
  resizeCanvasForMobile(canvas)
  injectMobileStyles()
  
  const handleClick = (e: MouseEvent | TouchEvent) => {
    if (animatingBall || winAnimation) return
    
    const now = Date.now()
    if (now - lastClickTime < 300) return
    lastClickTime = now
    
    const pos = getPointerPos(e, canvas)
    const mx = pos.x
    const my = pos.y
    
    const tubeSpacing = (W - 60) / (tubes.length - 1)
    
    let clickedTube = -1
    for (let i = 0; i < tubes.length; i++) {
      const x = 30 + i * tubeSpacing
      const y = H - 220
      if (mx >= x - TUBE_W / 2 && mx <= x + TUBE_W / 2 && 
          my >= y && my <= y + TUBE_H) {
        clickedTube = i
        break
      }
    }
    
    if (clickedTube === -1) {
      if (selectedTube !== -1) {
        selectedTube = -1
        audioService.click()
      }
      return
    }
    
    if (selectedTube === -1) {
      if (tubes[clickedTube].length > 0) {
        selectedTube = clickedTube
        clickEffect = { tube: clickedTube, time: 20 }
        audioService.click()
      }
    } else {
      if (clickedTube === selectedTube) {
        selectedTube = -1
        clickEffect = { tube: clickedTube, time: 20 }
        audioService.click()
      } else {
        const fromTube = tubes[selectedTube]
        const toTube = tubes[clickedTube]
        
        if (fromTube.length === 0) {
          selectedTube = -1
          audioService.click()
        } else if (toTube.length >= levelConfig.ballsPerTube) {
          // 目标管子已满，显示提示
          console.log(`管子 ${clickedTube} 已满: ${toTube.length}/${levelConfig.ballsPerTube}`)
          floatingTexts.push({
            text: '❌ 已满',
            x: 30 + clickedTube * tubeSpacing,
            y: H - 220 - 20,
            life: 80,
            color: '#FF6B6B',
            size: 18
          })
          selectedTube = -1
          audioService.click()
        } else {
          // ✅ 修复：只要目标管子没满就可以倒入，无论颜色是否相同
          console.log(`允许倒入: 从管子${selectedTube}(${fromTube.length}) 到 管子${clickedTube}(${toTube.length}/${levelConfig.ballsPerTube})`)
          const ballColor = fromTube[fromTube.length - 1]
          
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
                const ball = tubes[animatingBall.fromTube].pop()!
                tubes[animatingBall.toTube].push(ball)
                
                moves++
                score += 10
                
                if (tubes[animatingBall.toTube].length === levelConfig.ballsPerTube && 
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
        }
      }
    }
  }
  
  function loop() {
    if (!document.getElementById('mainGameCanvas')) return
    update()
    draw()
    requestAnimationFrame(loop)
  }
  
  canvas.onclick = null
  canvas.onmousedown = null
  canvas.onmousemove = null
  canvas.ontouchstart = null
  canvas.ontouchmove = null
  
  const handleInteraction = (e: MouseEvent | TouchEvent) => {
    e.preventDefault()
    handleClick(e)
  }
  
  canvas.addEventListener('click', handleInteraction)
  canvas.addEventListener('touchstart', handleInteraction, { passive: false })
  
  initLevel()
  loop()
}
