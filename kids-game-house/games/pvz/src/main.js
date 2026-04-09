import Phaser from 'phaser'
import BootScene from './scenes/BootScene.js'
import TitleScene from './scenes/TitleScene.js'
import PlayScene from './scenes/PlayScene.js'
import OverScene from './scenes/OverScene.js'

// Phaser 3 游戏配置
const config = {
  type: Phaser.AUTO,
  width: 490,   // 逻辑宽度（保持不变）
  height: 290,  // 逻辑高度（保持不变）
  parent: 'game-container', // 指定容器 ID
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,        // 适应容器，保持宽高比
    autoCenter: Phaser.Scale.CENTER_BOTH,  // 居中显示
    min: {
      width: 392,  // 最小宽度 (80%)
      height: 232  // 最小高度 (80%)
    },
    max: {
      width: 980,  // 最大宽度 (200%)
      height: 580  // 最大高度 (200%)
    }
  },
  scene: [
    BootScene,
    TitleScene,
    PlayScene,
    OverScene
  ]
}

// 创建游戏实例
const game = new Phaser.Game(config)

// 监听窗口大小变化，自动调整游戏缩放
window.addEventListener('resize', () => {
  if (game.scale) {
    game.scale.refresh()
  }
})

// 导出游戏实例供调试使用
window.game = game