// Tetris 游戏入口文件
import type { GameEngine } from '../../services/gameEngine'
import { audioService } from '../../services/audio'
import { TetrisGame } from './TetrisGame'

let animationId: number | null = null
let gameInstance: TetrisGame | null = null

export function initTetris(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  
  gameInstance = new TetrisGame(canvas, ctx, engine, onEnd)
  
  gameInstance.init()
  
  let lastTime = 0
  function gameLoop(timestamp: number) {
    if (!document.getElementById('mainGameCanvas')) return
    
    const deltaTime = timestamp - lastTime
    if (deltaTime >= 16) {
      gameInstance?.update(deltaTime)
      gameInstance?.render()
      lastTime = timestamp
    }
    
    animationId = requestAnimationFrame(gameLoop)
  }
  
  animationId = requestAnimationFrame(gameLoop)
}

export function destroyTetris() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  gameInstance = null
}