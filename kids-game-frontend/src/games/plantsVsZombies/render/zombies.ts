import type { Zombie } from '../types'

export function drawZombies(ctx: CanvasRenderingContext2D, zombies: Zombie[]) {
  zombies.forEach(zombie => {
    const { x, y } = zombie.position
    
    ctx.save()
    ctx.translate(x, y)
    
    if (zombie.isSlowed) {
      ctx.shadowColor = '#00BCD4'
      ctx.shadowBlur = 10
    }
    
    switch (zombie.type) {
      case 'normal':
        drawNormalZombie(ctx, zombie.animationFrame, zombie.isEating)
        break
      case 'conehead':
        drawConeheadZombie(ctx, zombie.animationFrame, zombie.isEating)
        break
      case 'buckethead':
        drawBucketheadZombie(ctx, zombie.animationFrame, zombie.isEating)
        break
      case 'pole_vault':
        drawPoleVaultZombie(ctx, zombie.animationFrame, zombie.isJumping, zombie.jumpProgress)
        break
      case 'football':
        drawFootballZombie(ctx, zombie.animationFrame, zombie.isEating)
        break
    }
    
    ctx.restore()
    
    if (zombie.health < zombie.maxHealth) {
      drawHealthBar(ctx, x, y - 50, zombie.health, zombie.maxHealth)
    }
  })
}

function drawNormalZombie(ctx: CanvasRenderingContext2D, frame: number, isEating: boolean) {
  ctx.fillStyle = '#8D6E63'
  ctx.beginPath()
  ctx.arc(0, -35, 18, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(-5, -38, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(5, -38, 5, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(-4, -37, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(6, -37, 2, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#5D4037'
  ctx.beginPath()
  ctx.moveTo(-8, -25)
  ctx.lineTo(0, -18)
  ctx.lineTo(8, -25)
  ctx.closePath()
  ctx.fill()
  
  ctx.fillStyle = '#8D6E63'
  ctx.beginPath()
  ctx.ellipse(0, -5, 15, 18, 0, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(-8, 10, 3, 30)
  ctx.fillRect(5, 10, 3, 30)
  
  const legOffset = Math.sin(frame) * 5
  
  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(-8, 38, 6, 20)
  ctx.fillRect(2, 38 + legOffset, 6, 20)
  
  ctx.fillStyle = '#795548'
  ctx.beginPath()
  ctx.ellipse(-5, 58, 6, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(5, 58 + legOffset, 6, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  
  if (isEating) {
    ctx.fillStyle = '#FF0000'
    ctx.beginPath()
    ctx.moveTo(-3, -22)
    ctx.lineTo(3, -22)
    ctx.lineTo(0, -15)
    ctx.closePath()
    ctx.fill()
    
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.arc(-2, -20, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(2, -20, 3, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawConeheadZombie(ctx: CanvasRenderingContext2D, frame: number, isEating: boolean) {
  ctx.fillStyle = '#FFA500'
  ctx.beginPath()
  ctx.moveTo(-10, -60)
  ctx.lineTo(0, -40)
  ctx.lineTo(10, -60)
  ctx.closePath()
  ctx.fill()
  
  ctx.fillStyle = '#8B4513'
  ctx.fillRect(-4, -40, 8, 8)
  
  ctx.fillStyle = '#8D6E63'
  ctx.beginPath()
  ctx.arc(0, -30, 16, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(-5, -33, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(5, -33, 4, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(-4, -32, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(6, -32, 2, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#5D4037'
  ctx.beginPath()
  ctx.moveTo(-8, -20)
  ctx.lineTo(0, -13)
  ctx.lineTo(8, -20)
  ctx.closePath()
  ctx.fill()
  
  ctx.fillStyle = '#8D6E63'
  ctx.beginPath()
  ctx.ellipse(0, 0, 15, 18, 0, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(-8, 15, 3, 30)
  ctx.fillRect(5, 15, 3, 30)
  
  const legOffset = Math.sin(frame) * 5
  
  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(-8, 43, 6, 20)
  ctx.fillRect(2, 43 + legOffset, 6, 20)
  
  ctx.fillStyle = '#795548'
  ctx.beginPath()
  ctx.ellipse(-5, 63, 6, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(5, 63 + legOffset, 6, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  
  if (isEating) {
    ctx.fillStyle = '#FF0000'
    ctx.beginPath()
    ctx.moveTo(-3, -17)
    ctx.lineTo(3, -17)
    ctx.lineTo(0, -10)
    ctx.closePath()
    ctx.fill()
  }
}

function drawBucketheadZombie(ctx: CanvasRenderingContext2D, frame: number, isEating: boolean) {
  ctx.fillStyle = '#708090'
  ctx.beginPath()
  ctx.arc(0, -45, 18, Math.PI, 0)
  ctx.fill()
  
  ctx.fillStyle = '#5F9EA0'
  ctx.beginPath()
  ctx.arc(0, -45, 14, Math.PI, 0)
  ctx.fill()
  
  ctx.fillStyle = '#8D6E63'
  ctx.beginPath()
  ctx.arc(0, -28, 14, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(-4, -31, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(4, -31, 3, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(-3, -30, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(5, -30, 2, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#5D4037'
  ctx.beginPath()
  ctx.moveTo(-6, -18)
  ctx.lineTo(0, -12)
  ctx.lineTo(6, -18)
  ctx.closePath()
  ctx.fill()
  
  ctx.fillStyle = '#8D6E63'
  ctx.beginPath()
  ctx.ellipse(0, 2, 15, 18, 0, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(-8, 17, 3, 30)
  ctx.fillRect(5, 17, 3, 30)
  
  const legOffset = Math.sin(frame) * 5
  
  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(-8, 45, 6, 20)
  ctx.fillRect(2, 45 + legOffset, 6, 20)
  
  ctx.fillStyle = '#795548'
  ctx.beginPath()
  ctx.ellipse(-5, 65, 6, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(5, 65 + legOffset, 6, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  
  if (isEating) {
    ctx.fillStyle = '#FF0000'
    ctx.beginPath()
    ctx.moveTo(-3, -15)
    ctx.lineTo(3, -15)
    ctx.lineTo(0, -8)
    ctx.closePath()
    ctx.fill()
  }
}

function drawPoleVaultZombie(ctx: CanvasRenderingContext2D, frame: number, isJumping: boolean, jumpProgress: number) {
  ctx.fillStyle = '#8D6E63'
  ctx.beginPath()
  ctx.arc(0, -35, 16, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(-5, -38, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(5, -38, 4, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(-4, -37, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(6, -37, 2, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#5D4037'
  ctx.beginPath()
  ctx.moveTo(-7, -25)
  ctx.lineTo(0, -18)
  ctx.lineTo(7, -25)
  ctx.closePath()
  ctx.fill()
  
  ctx.fillStyle = '#8D6E63'
  ctx.beginPath()
  ctx.ellipse(0, -5, 14, 16, 0, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#8B4513'
  if (isJumping) {
    ctx.save()
    ctx.rotate(Math.PI / 4 + jumpProgress * Math.PI / 2)
    ctx.fillRect(0, -50, 6, 60)
    ctx.restore()
  } else {
    ctx.fillRect(-25, -45, 6, 70)
  }
  
  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(-8, 10, 3, 30)
  ctx.fillRect(5, 10, 3, 30)
  
  const legOffset = isJumping ? Math.sin(jumpProgress * Math.PI) * 20 : Math.sin(frame) * 5
  
  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(-8, 38, 6, 20)
  ctx.fillRect(2, 38 + legOffset, 6, 20)
  
  ctx.fillStyle = '#795548'
  ctx.beginPath()
  ctx.ellipse(-5, 58, 6, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(5, 58 + legOffset, 6, 4, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawFootballZombie(ctx: CanvasRenderingContext2D, frame: number, isEating: boolean) {
  ctx.fillStyle = '#E53935'
  ctx.beginPath()
  ctx.arc(0, -35, 18, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#FFD700'
  ctx.beginPath()
  ctx.arc(0, -35, 14, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 12px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('★', 0, -31)
  
  ctx.fillStyle = '#8D6E63'
  ctx.beginPath()
  ctx.arc(0, -35, 12, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(-4, -37, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(4, -37, 3, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(-3, -36, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(5, -36, 2, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#E53935'
  ctx.beginPath()
  ctx.ellipse(0, 0, 18, 20, 0, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#FFD700'
  ctx.fillRect(-15, -10, 30, 6)
  
  ctx.fillStyle = '#8B4513'
  ctx.fillRect(-8, 15, 4, 30)
  ctx.fillRect(4, 15, 4, 30)
  
  const legOffset = Math.sin(frame) * 4
  
  ctx.fillStyle = '#8B4513'
  ctx.fillRect(-6, 43, 5, 18)
  ctx.fillRect(1, 43 + legOffset, 5, 18)
  
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.ellipse(-3, 61, 8, 5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(4, 61 + legOffset, 8, 5, 0, 0, Math.PI * 2)
  ctx.fill()
  
  if (isEating) {
    ctx.fillStyle = '#FF0000'
    ctx.beginPath()
    ctx.moveTo(-3, -22)
    ctx.lineTo(3, -22)
    ctx.lineTo(0, -15)
    ctx.closePath()
    ctx.fill()
  }
}

function drawHealthBar(ctx: CanvasRenderingContext2D, x: number, y: number, current: number, max: number) {
  const width = 50
  const height = 6
  const ratio = current / max
  
  ctx.fillStyle = '#333'
  ctx.fillRect(x - width / 2, y, width, height)
  
  ctx.fillStyle = ratio > 0.5 ? '#2ECC71' : ratio > 0.25 ? '#F39C12' : '#E74C3C'
  ctx.fillRect(x - width / 2, y, width * ratio, height)
}