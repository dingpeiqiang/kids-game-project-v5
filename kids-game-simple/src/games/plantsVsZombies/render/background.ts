import { GAME_CONFIG, COLORS } from '../config'

export function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = COLORS.sky
  ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.HUD_HEIGHT)
  
  ctx.fillStyle = '#2D5A27'
  ctx.fillRect(0, GAME_CONFIG.HUD_HEIGHT, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.HUD_HEIGHT)
  
  for (let row = 0; row < GAME_CONFIG.GRID_ROWS; row++) {
    for (let col = 0; col < GAME_CONFIG.GRID_COLS; col++) {
      const x = col * GAME_CONFIG.CELL_WIDTH
      const y = row * GAME_CONFIG.CELL_HEIGHT + GAME_CONFIG.HUD_HEIGHT
      
      ctx.fillStyle = (row + col) % 2 === 0 ? COLORS.grass : COLORS.grassDark
      ctx.fillRect(x, y, GAME_CONFIG.CELL_WIDTH, GAME_CONFIG.CELL_HEIGHT)
      
      ctx.strokeStyle = COLORS.gridLine
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, GAME_CONFIG.CELL_WIDTH, GAME_CONFIG.CELL_HEIGHT)
    }
  }
  
  for (let row = 0; row < GAME_CONFIG.GRID_ROWS; row++) {
    const y = row * GAME_CONFIG.CELL_HEIGHT + GAME_CONFIG.HUD_HEIGHT + GAME_CONFIG.CELL_HEIGHT / 2
    ctx.strokeStyle = 'rgba(139, 115, 85, 0.3)'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(GAME_CONFIG.CANVAS_WIDTH, y)
    ctx.stroke()
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 2
    ctx.setLineDash([20, 20])
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(GAME_CONFIG.CANVAS_WIDTH, y)
    ctx.stroke()
    ctx.setLineDash([])
  }
}