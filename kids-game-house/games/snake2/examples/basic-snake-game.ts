/**
 * 基础贪吃蛇游戏示例
 * 
 * 演示如何快速创建一个可玩的贪吃蛇游戏
 */

import { SnakeGameLogic } from '../src/scenes/SnakeGameLogic'
import { EventBus } from '../src/core/EventBus'
import { GameEventType } from '../src/components/core/GameEvent'

// ============================================
// 步骤 1: 创建 Phaser 场景
// ============================================

class SnakeGameScene extends Phaser.Scene {
  private gameLogic!: SnakeGameLogic
  
  constructor() {
    super({ key: 'SnakeGameScene' })
  }
  
  preload(): void {
    // 加载必要的资源（如果有）
    // this.load.image('food', 'assets/food.png')
  }
  
  create(): void {
    console.log('🐍 贪吃蛇游戏启动！')
    
    // 创建游戏逻辑实例
    this.gameLogic = new SnakeGameLogic(this)
    
    // 设置事件监听
    this.setupEventListeners()
    
    // 启动游戏
    this.gameLogic.startGame()
  }
  
  update(time: number, delta: number): void {
    // 更新游戏逻辑
    if (this.gameLogic) {
      this.gameLogic.update(delta)
    }
  }
  
  private setupEventListeners(): void {
    const eventBus = EventBus.getInstance()
    
    // 监听游戏开始
    eventBus.on(GameEventType.GAME_START, () => {
      console.log('✅ 游戏开始')
    })
    
    // 监听分数变化
    eventBus.on(GameEventType.SCORE_CHANGED, (event) => {
      console.log(`📊 分数：${event.payload.score}`)
    })
    
    // 监听食物生成
    eventBus.on(GameEventType.FOOD_SPAWN, (event) => {
      console.log(`🍎 食物生成在：(${event.payload.position.x}, ${event.payload.position.y})`)
    })
    
    // 监听游戏结束
    eventBus.on(GameEventType.GAME_OVER, (event) => {
      console.log(`❌ 游戏结束！最终分数：${event.payload.finalScore}`)
      
      // 显示重新开始按钮等
      setTimeout(() => {
        this.scene.restart()
      }, 2000)
    })
  }
}

// ============================================
// 步骤 2: 配置 Phaser 游戏
// ============================================

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scene: [SnakeGameScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  }
}

// ============================================
// 步骤 3: 启动游戏
// ============================================

const game = new Phaser.Game(config)

console.log('🎮 游戏已启动，使用方向键控制蛇的移动')

// ============================================
// 步骤 4: 添加键盘控制
// ============================================

document.addEventListener('keydown', (event) => {
  const scene = game.scene.getScene('SnakeGameScene') as any
  if (!scene || !scene.gameLogic) return
  
  switch (event.key) {
    case 'ArrowUp':
      scene.gameLogic.changeDirection('up')
      break
    case 'ArrowDown':
      scene.gameLogic.changeDirection('down')
      break
    case 'ArrowLeft':
      scene.gameLogic.changeDirection('left')
      break
    case 'ArrowRight':
      scene.gameLogic.changeDirection('right')
      break
  }
})

export default game
