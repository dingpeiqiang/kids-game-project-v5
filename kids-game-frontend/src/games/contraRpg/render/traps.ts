import type { Trap } from '../types'
import { GAME_CONFIG } from '../config'

export function drawTraps(ctx: CanvasRenderingContext2D, traps: Trap[], cameraX: number): void {
  const visibleLeft = cameraX - 100
  const visibleRight = cameraX + GAME_CONFIG.CANVAS_WIDTH + 100

  for (const trap of traps) {
    if (trap.x < visibleLeft || trap.x > visibleRight) {
      continue
    }

    const screenX = trap.x - cameraX

    switch (trap.type) {
      case 'spike':
        drawSpikeTrap(ctx, screenX, trap.y, trap.width, trap.height, trap.active)
        break
      case 'laser':
        drawLaserTrap(ctx, screenX, trap.y, trap.width, trap.height, trap.active)
        break
      case 'fire':
        drawFireTrap(ctx, screenX, trap.y, trap.width, trap.height, trap.active)
        break
      case 'electric':
        drawElectricTrap(ctx, screenX, trap.y, trap.width, trap.height, trap.active)
        break
    }
  }
}

function drawSpikeTrap(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, active: boolean): void {
  ctx.save()
  
  const spikeCount = Math.floor(width / 8)
  const spikeWidth = width / spikeCount
  
  for (let i = 0; i < spikeCount; i++) {
    const spikeX = x + i * spikeWidth
    const alpha = active ? 1 : 0.3
    
    ctx.beginPath()
    ctx.moveTo(spikeX, y + height)
    ctx.lineTo(spikeX + spikeWidth / 2, y)
    ctx.lineTo(spikeX + spikeWidth, y + height)
    ctx.closePath()
    
    const gradient = ctx.createLinearGradient(spikeX, y, spikeX, y + height)
    gradient.addColorStop(0, `rgba(255, 100, 50, ${alpha})`)
    gradient.addColorStop(1, `rgba(150, 50, 30, ${alpha})`)
    ctx.fillStyle = gradient
    ctx.fill()
    
    ctx.strokeStyle = `rgba(255, 200, 150, ${alpha})`
    ctx.lineWidth = 1
    ctx.stroke()
  }
  
  ctx.restore()
}

function drawLaserTrap(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, active: boolean): void {
  ctx.save()
  
  const alpha = active ? 1 : 0.1
  const pulse = active ? Math.sin(Date.now() / 100) * 0.3 + 0.7 : 0.3
  
  const gradient = ctx.createLinearGradient(x, y, x + width, y)
  gradient.addColorStop(0, `rgba(0, 255, 200, ${alpha * pulse})`)
  gradient.addColorStop(0.5, `rgba(0, 255, 255, ${alpha})`)
  gradient.addColorStop(1, `rgba(0, 200, 255, ${alpha * pulse})`)
  
  ctx.fillStyle = gradient
  ctx.fillRect(x, y, width, height)
  
  if (active) {
    ctx.shadowColor = 'rgba(0, 255, 200, 0.8)'
    ctx.shadowBlur = 10
    ctx.fillRect(x, y, width, height)
  }
  
  ctx.restore()
}

function drawFireTrap(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, active: boolean): void {
  ctx.save()
  
  const alpha = active ? 1 : 0.2
  const flicker = active ? Math.random() * 0.3 + 0.7 : 0.5
  
  const flameCount = Math.floor(width / 12)
  
  for (let i = 0; i < flameCount; i++) {
    const flameX = x + i * 12 + 6
    const flameHeight = height * (0.7 + Math.random() * 0.3) * flicker
    
    ctx.beginPath()
    ctx.moveTo(flameX, y + height)
    ctx.quadraticCurveTo(flameX - 4, y + height * 0.5, flameX, y)
    ctx.quadraticCurveTo(flameX + 4, y + height * 0.5, flameX, y + height)
    ctx.closePath()
    
    const gradient = ctx.createLinearGradient(flameX, y, flameX, y + height)
    gradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`)
    gradient.addColorStop(0.3, `rgba(255, 200, 50, ${alpha})`)
    gradient.addColorStop(0.7, `rgba(255, 100, 20, ${alpha})`)
    gradient.addColorStop(1, `rgba(200, 50, 0, ${alpha * 0.5})`)
    
    ctx.fillStyle = gradient
    ctx.fill()
    
    if (active) {
      ctx.shadowColor = 'rgba(255, 150, 50, 0.6)'
      ctx.shadowBlur = 8
      ctx.fill()
    }
  }
  
  ctx.restore()
}

function drawElectricTrap(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, active: boolean): void {
  ctx.save()
  
  const alpha = active ? 1 : 0.2
  const pulse = active ? Math.sin(Date.now() / 80) * 0.4 + 0.6 : 0.3
  
  ctx.fillStyle = `rgba(100, 150, 255, ${alpha * 0.3})`
  ctx.fillRect(x, y, width, height)
  
  for (let i = 0; i < 3; i++) {
    const arcX = x + (i + 0.5) * (width / 3)
    const arcY = y + height / 2
    
    ctx.beginPath()
    ctx.arc(arcX, arcY, 6 * pulse, 0, Math.PI * 2)
    
    const gradient = ctx.createRadialGradient(arcX, arcY, 0, arcX, arcY, 6 * pulse)
    gradient.addColorStop(0, `rgba(200, 230, 255, ${alpha})`)
    gradient.addColorStop(0.5, `rgba(100, 180, 255, ${alpha * 0.7})`)
    gradient.addColorStop(1, `rgba(50, 100, 255, ${alpha * 0.3})`)
    
    ctx.fillStyle = gradient
    ctx.fill()
    
    if (active) {
      ctx.shadowColor = 'rgba(100, 180, 255, 0.8)'
      ctx.shadowBlur = 8
      ctx.fill()
    }
  }
  
  ctx.restore()
}
