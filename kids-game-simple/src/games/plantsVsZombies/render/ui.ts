import type { PlantType, Sun, Particle, FloatingText, Projectile } from '../types'
import { GAME_CONFIG, COLORS, PLANT_CONFIGS, AVAILABLE_PLANTS } from '../config'

export function drawUI(
  ctx: CanvasRenderingContext2D,
  sun: number,
  lives: number,
  wave: number,
  totalWaves: number,
  selectedPlant: PlantType | null,
  score: number,
  zombiesRemaining: number
) {
  ctx.fillStyle = '#2D5A27'
  ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.HUD_HEIGHT)
  
  ctx.fillStyle = COLORS.sun
  ctx.font = 'bold 24px Arial'
  ctx.textAlign = 'left'
  ctx.fillText(`🌞 ${sun}`, 20, 35)
  
  ctx.fillStyle = COLORS.life
  ctx.font = 'bold 24px Arial'
  ctx.fillText(`❤️ ${lives}`, GAME_CONFIG.CANVAS_WIDTH - 80, 35)
  
  ctx.fillStyle = COLORS.wave
  ctx.font = 'bold 18px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`波次: ${wave}/${totalWaves}`, GAME_CONFIG.CANVAS_WIDTH / 2, 35)
  
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '14px Arial'
  ctx.fillText(`剩余僵尸: ${zombiesRemaining}`, GAME_CONFIG.CANVAS_WIDTH / 2, 60)
  
  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'right'
  ctx.fillText(`得分: ${score}`, GAME_CONFIG.CANVAS_WIDTH - 20, 70)
  
  drawPlantCards(ctx, selectedPlant)
}

function drawPlantCards(ctx: CanvasRenderingContext2D, selectedPlant: PlantType | null) {
  const startY = 50
  const cardWidth = GAME_CONFIG.CARD_WIDTH
  const cardHeight = GAME_CONFIG.CARD_HEIGHT
  const spacing = 10
  const startX = 20
  
  AVAILABLE_PLANTS.forEach((plantType, index) => {
    const config = PLANT_CONFIGS[plantType]
    const x = startX + index * (cardWidth + spacing)
    const y = startY
    
    ctx.fillStyle = selectedPlant === plantType ? COLORS.plantCardSelected : COLORS.plantCardBg
    ctx.fillRect(x, y, cardWidth, cardHeight)
    
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, cardWidth, cardHeight)
    
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(config.name, x + cardWidth / 2, y + 20)
    
    ctx.fillStyle = COLORS.sun
    ctx.font = 'bold 14px Arial'
    ctx.fillText(`${config.sunCost}`, x + cardWidth / 2, y + 45)
    
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '10px Arial'
    ctx.fillText(getPlantIcon(plantType), x + cardWidth / 2, y + 62)
  })
}

function getPlantIcon(type: PlantType): string {
  switch (type) {
    case 'sunflower': return '🌻'
    case 'peashooter': return '🌱'
    case 'snowpea': return '💧'
    case 'repeater': return '🌿'
    case 'wallnut': return '🥜'
    case 'cherry_bomb': return '💣'
    case 'potato_mine': return '🥔'
    case 'chomper': return '👄'
    default: return '🌱'
  }
}

export function drawSuns(ctx: CanvasRenderingContext2D, suns: Sun[]) {
  suns.forEach(sun => {
    if (sun.isCollected) return
    
    ctx.save()
    ctx.translate(sun.x, sun.y)
    
    const pulse = Math.sin(Date.now() / 100) * 3
    
    ctx.fillStyle = COLORS.sunOutline
    ctx.beginPath()
    ctx.arc(0, 0, 25 + pulse, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = COLORS.sun
    ctx.beginPath()
    ctx.arc(0, 0, 18 + pulse, 0, Math.PI * 2)
    ctx.fill()
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const x = Math.cos(angle) * 28
      const y = Math.sin(angle) * 28
      ctx.beginPath()
      ctx.ellipse(x, y, 5, 8, angle, 0, Math.PI * 2)
      ctx.fill()
    }
    
    ctx.restore()
  })
}

export function drawProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]) {
  projectiles.forEach(proj => {
    ctx.save()
    ctx.translate(proj.x, proj.y)
    
    if (proj.type === 'snow_pea') {
      ctx.fillStyle = COLORS.projectile.snow_pea
      ctx.shadowColor = '#00BCD4'
      ctx.shadowBlur = 8
    } else {
      ctx.fillStyle = COLORS.projectile.pea
    }
    
    ctx.beginPath()
    ctx.arc(0, 0, 8, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.restore()
  })
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  particles.forEach(p => {
    const alpha = p.life / p.maxLife
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(0, 0, p.size * alpha, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })
}

export function drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]) {
  texts.forEach(t => {
    ctx.save()
    ctx.globalAlpha = t.life / 60
    ctx.fillStyle = t.color
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(t.text, t.x, t.y)
    ctx.restore()
  })
}

export function drawGameOver(ctx: CanvasRenderingContext2D, isVictory: boolean, score: number, wave: number) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT)
  
  ctx.fillStyle = isVictory ? '#FFD700' : '#E53935'
  ctx.font = 'bold 48px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(isVictory ? '🎉 胜利! 🎉' : '💀 游戏结束 💀', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 - 50)
  
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 24px Arial'
  ctx.fillText(`最终得分: ${score}`, GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 10)
  
  ctx.fillText(`到达波次: ${wave}`, GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 50)
  
  ctx.fillStyle = '#4CAF50'
  ctx.font = '20px Arial'
  ctx.fillText('点击屏幕重新开始', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 100)
}

export function drawStartScreen(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#2D5A27'
  ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT)
  
  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 48px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('🌻 植物大战僵尸 🌻', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 - 80)
  
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '24px Arial'
  ctx.fillText('种植植物，抵御僵尸入侵！', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 - 20)
  
  ctx.font = '18px Arial'
  ctx.fillText('点击顶部卡片选择植物', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 20)
  ctx.fillText('点击草地格子种植', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 50)
  
  ctx.fillStyle = '#4CAF50'
  ctx.font = 'bold 24px Arial'
  ctx.fillText('🎮 点击开始游戏', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 100)
}