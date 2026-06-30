import type { Plant } from '../types'
import { GAME_CONFIG, gridToPixel } from '../config'

export function drawPlants(ctx: CanvasRenderingContext2D, plants: Plant[]) {
  plants.forEach(plant => {
    const pos = gridToPixel(plant.gridPos)
    
    switch (plant.type) {
      case 'sunflower':
        drawSunflower(ctx, pos.x, pos.y, plant.animationFrame)
        break
      case 'sunflower_double':
        drawDoubleSunflower(ctx, pos.x, pos.y, plant.animationFrame)
        break
      case 'peashooter':
        drawPeashooter(ctx, pos.x, pos.y, plant.animationFrame)
        break
      case 'snowpea':
        drawSnowpea(ctx, pos.x, pos.y, plant.animationFrame)
        break
      case 'repeater':
        drawRepeater(ctx, pos.x, pos.y, plant.animationFrame)
        break
      case 'wallnut':
        drawWallnut(ctx, pos.x, pos.y, plant.health, plant.maxHealth)
        break
      case 'cherry_bomb':
        drawCherryBomb(ctx, pos.x, pos.y, plant.animationFrame)
        break
      case 'potato_mine':
        drawPotatoMine(ctx, pos.x, pos.y, plant.isReady)
        break
      case 'chomper':
        drawChomper(ctx, pos.x, pos.y, plant.animationFrame)
        break
      case 'sunshroom':
        drawSunshroom(ctx, pos.x, pos.y, plant.animationFrame)
        break
      case 'fume_shroom':
        drawFumeShroom(ctx, pos.x, pos.y, plant.animationFrame)
        break
    }
    
    if (plant.health < plant.maxHealth) {
      drawHealthBar(ctx, pos.x, pos.y - 45, plant.health, plant.maxHealth)
    }
  })
}

function drawSunflower(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  ctx.save()
  ctx.translate(x, y)
  
  ctx.fillStyle = '#FFD700'
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + frame * 0.3
    const petalX = Math.cos(angle) * 15
    const petalY = Math.sin(angle) * 15
    ctx.beginPath()
    ctx.ellipse(petalX, petalY, 10, 6, angle, 0, Math.PI * 2)
    ctx.fill()
  }
  
  ctx.fillStyle = '#FFEC8B'
  ctx.beginPath()
  ctx.arc(0, 0, 12, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#8B4513'
  ctx.fillRect(-3, 15, 6, 25)
  
  ctx.fillStyle = '#228B22'
  ctx.beginPath()
  ctx.arc(-8, 20, 8, 0, Math.PI)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(8, 22, 8, 0, Math.PI)
  ctx.fill()
  
  ctx.restore()
}

function drawDoubleSunflower(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  ctx.save()
  ctx.translate(x, y)
  
  ctx.fillStyle = '#FFD700'
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + frame * 0.3
    const petalX = Math.cos(angle) * 12
    const petalY = Math.sin(angle) * 12 - 8
    ctx.beginPath()
    ctx.ellipse(petalX, petalY, 8, 5, angle, 0, Math.PI * 2)
    ctx.fill()
    
    const petalX2 = Math.cos(angle) * 12
    const petalY2 = Math.sin(angle) * 12 + 8
    ctx.beginPath()
    ctx.ellipse(petalX2, petalY2, 8, 5, angle, 0, Math.PI * 2)
    ctx.fill()
  }
  
  ctx.fillStyle = '#FFEC8B'
  ctx.beginPath()
  ctx.arc(0, -8, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(0, 8, 10, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#8B4513'
  ctx.fillRect(-3, 20, 6, 20)
  
  ctx.fillStyle = '#228B22'
  ctx.beginPath()
  ctx.arc(-8, 25, 7, 0, Math.PI)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(8, 27, 7, 0, Math.PI)
  ctx.fill()
  
  ctx.restore()
}

function drawPeashooter(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  ctx.save()
  ctx.translate(x, y)
  
  ctx.fillStyle = '#228B22'
  ctx.beginPath()
  ctx.ellipse(15, 0, 15, 12, 0, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#32CD32'
  ctx.beginPath()
  ctx.arc(-5, 0, 12, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#2E8B57'
  ctx.beginPath()
  ctx.arc(-12, 5, 8, 0, Math.PI)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(-12, -5, 8, Math.PI, 0)
  ctx.fill()
  
  ctx.fillStyle = '#8B4513'
  ctx.fillRect(-2, 12, 4, 18)
  
  ctx.fillStyle = '#228B22'
  ctx.beginPath()
  ctx.arc(-8, 22, 6, 0, Math.PI)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(6, 24, 6, 0, Math.PI)
  ctx.fill()
  
  ctx.restore()
}

function drawSnowpea(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  ctx.save()
  ctx.translate(x, y)
  
  ctx.fillStyle = '#87CEEB'
  ctx.beginPath()
  ctx.ellipse(15, 0, 15, 12, 0, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#ADD8E6'
  ctx.beginPath()
  ctx.arc(-5, 0, 12, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#5F9EA0'
  ctx.beginPath()
  ctx.arc(-12, 5, 8, 0, Math.PI)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(-12, -5, 8, Math.PI, 0)
  ctx.fill()
  
  ctx.fillStyle = '#8B4513'
  ctx.fillRect(-2, 12, 4, 18)
  
  ctx.fillStyle = '#87CEEB'
  ctx.beginPath()
  ctx.arc(-8, 22, 6, 0, Math.PI)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(6, 24, 6, 0, Math.PI)
  ctx.fill()
  
  ctx.restore()
}

function drawRepeater(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  ctx.save()
  ctx.translate(x, y)
  
  ctx.fillStyle = '#228B22'
  ctx.beginPath()
  ctx.ellipse(18, -5, 12, 10, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(18, 5, 12, 10, 0, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#32CD32'
  ctx.beginPath()
  ctx.arc(-5, 0, 12, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#2E8B57'
  ctx.beginPath()
  ctx.arc(-12, 5, 8, 0, Math.PI)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(-12, -5, 8, Math.PI, 0)
  ctx.fill()
  
  ctx.fillStyle = '#8B4513'
  ctx.fillRect(-2, 12, 4, 18)
  
  ctx.fillStyle = '#228B22'
  ctx.beginPath()
  ctx.arc(-8, 22, 6, 0, Math.PI)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(6, 24, 6, 0, Math.PI)
  ctx.fill()
  
  ctx.restore()
}

function drawWallnut(ctx: CanvasRenderingContext2D, x: number, y: number, health: number, maxHealth: number) {
  ctx.save()
  ctx.translate(x, y)
  
  const scale = 0.8 + (health / maxHealth) * 0.2
  
  ctx.fillStyle = '#CD853F'
  ctx.beginPath()
  ctx.ellipse(0, 0, 25 * scale, 22 * scale, 0, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#A0522D'
  ctx.beginPath()
  ctx.ellipse(0, -8 * scale, 18 * scale, 8 * scale, 0, Math.PI, 0)
  ctx.fill()
  
  ctx.fillStyle = '#8B4513'
  ctx.fillRect(-3, 18 * scale, 6, 12 * scale)
  
  if (health < maxHealth) {
    ctx.strokeStyle = '#FF0000'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 0, 28 * scale, 0, Math.PI * 2)
    ctx.stroke()
  }
  
  ctx.restore()
}

function drawCherryBomb(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  ctx.save()
  ctx.translate(x, y)
  
  const pulse = Math.sin(frame * 0.5) * 3 + 30
  
  ctx.fillStyle = '#DC143C'
  ctx.beginPath()
  ctx.arc(-10, 0, pulse * 0.5, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#B22222'
  ctx.beginPath()
  ctx.arc(10, 0, pulse * 0.5, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#8B4513'
  ctx.fillRect(-2, 20, 4, 15)
  
  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 14px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('💣', 0, 5)
  
  ctx.restore()
}

function drawPotatoMine(ctx: CanvasRenderingContext2D, x: number, y: number, isReady: boolean) {
  ctx.save()
  ctx.translate(x, y)
  
  if (!isReady) {
    ctx.fillStyle = '#8B4513'
    ctx.beginPath()
    ctx.ellipse(0, 15, 20, 8, 0, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#654321'
    ctx.fillRect(-8, 5, 16, 20)
  } else {
    ctx.fillStyle = '#8B4513'
    ctx.beginPath()
    ctx.ellipse(0, 8, 18, 6, 0, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#228B22'
    ctx.beginPath()
    ctx.arc(0, -5, 12, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#FF0000'
    ctx.beginPath()
    ctx.arc(0, -8, 4, 0, Math.PI * 2)
    ctx.fill()
  }
  
  ctx.restore()
}

function drawChomper(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  ctx.save()
  ctx.translate(x, y)
  
  const openMouth = Math.sin(frame * 0.3) > 0
  
  ctx.fillStyle = '#8B0000'
  ctx.beginPath()
  ctx.moveTo(15, -15)
  if (openMouth) {
    ctx.quadraticCurveTo(35, 0, 15, 15)
  } else {
    ctx.lineTo(30, 0)
    ctx.lineTo(15, 15)
  }
  ctx.closePath()
  ctx.fill()
  
  ctx.fillStyle = '#DC143C'
  ctx.beginPath()
  ctx.arc(10, 0, 12, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(15, -5, 4, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(16, -5, 2, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#8B4513'
  ctx.fillRect(-5, 10, 10, 20)
  
  ctx.fillStyle = '#228B22'
  ctx.beginPath()
  ctx.arc(-10, 18, 8, 0, Math.PI)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(8, 20, 8, 0, Math.PI)
  ctx.fill()
  
  ctx.restore()
}

function drawSunshroom(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  ctx.save()
  ctx.translate(x, y)
  
  ctx.fillStyle = '#FFB6C1'
  ctx.beginPath()
  ctx.arc(0, -5, 15, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#FF69B4'
  ctx.beginPath()
  ctx.arc(-5, -10, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(5, -12, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(0, -15, 3, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#228B22'
  ctx.fillRect(-2, 10, 4, 15)
  
  ctx.fillStyle = '#32CD32'
  ctx.beginPath()
  ctx.arc(-5, 15, 5, 0, Math.PI)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(5, 17, 5, 0, Math.PI)
  ctx.fill()
  
  ctx.restore()
}

function drawFumeShroom(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  ctx.save()
  ctx.translate(x, y)
  
  ctx.fillStyle = '#8B7355'
  ctx.beginPath()
  ctx.arc(0, -3, 18, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#6B5344'
  ctx.beginPath()
  ctx.arc(-8, -8, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(8, -10, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(0, -13, 4, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#4A3728'
  ctx.fillRect(-2, 12, 4, 18)
  
  ctx.fillStyle = '#228B22'
  ctx.beginPath()
  ctx.arc(-6, 20, 6, 0, Math.PI)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(6, 22, 6, 0, Math.PI)
  ctx.fill()
  
  if (frame > 2) {
    ctx.fillStyle = 'rgba(200, 200, 200, 0.5)'
    ctx.beginPath()
    ctx.ellipse(20 + (frame - 2) * 5, 0, 8, 4, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  
  ctx.restore()
}

function drawHealthBar(ctx: CanvasRenderingContext2D, x: number, y: number, current: number, max: number) {
  const width = 40
  const height = 6
  const ratio = current / max
  
  ctx.fillStyle = '#333'
  ctx.fillRect(x - width / 2, y, width, height)
  
  ctx.fillStyle = ratio > 0.5 ? '#2ECC71' : ratio > 0.25 ? '#F39C12' : '#E74C3C'
  ctx.fillRect(x - width / 2, y, width * ratio, height)
}