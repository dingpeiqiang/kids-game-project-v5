// Tetris 游戏入口文件
import type { GameEngine } from '../../services/gameEngine'
import { audioService } from '../../services/audio'
import { TetrisGame } from './TetrisGame'

export function initTetris(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  
  // 创建游戏实例
  const game = new TetrisGame(canvas, ctx, engine, onEnd)
  
  // 初始化游戏
  game.init()
  
  // 启动游戏循环
  let lastTime = 0
  function gameLoop(timestamp: number) {
    if (!document.getElementById('mainGameCanvas')) return
    
    const deltaTime = timestamp - lastTime
    if (deltaTime >= 16) { // 约60fps
      game.update(deltaTime)
      game.render()
      lastTime = timestamp
    }
    
    requestAnimationFrame(gameLoop)
  }
  
  requestAnimationFrame(gameLoop)
}