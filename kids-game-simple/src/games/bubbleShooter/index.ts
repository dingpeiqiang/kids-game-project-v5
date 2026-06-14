// bubbleShooter 游戏主入口文件
import type { GameEngine } from '../../services/gameEngine'
import { BubbleShooterGame } from './BubbleShooterGame'

export function initBubbleShooter(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  
  // 创建游戏实例
  const game = new BubbleShooterGame(canvas, ctx, engine, onEnd)
  
  // 初始化游戏
  game.init()
  
  // 启动游戏循环
  function gameLoop() {
    if (!document.getElementById('mainGameCanvas')) return

    if (!engine.canTick()) {
      game.render()
      requestAnimationFrame(gameLoop)
      return
    }

    game.update()
    game.render()

    requestAnimationFrame(gameLoop)
  }
  
  requestAnimationFrame(gameLoop)
}
