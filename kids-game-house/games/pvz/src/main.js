import Phaser from 'phaser'
import BootScene from './scenes/BootScene.js'
import TitleScene from './scenes/TitleScene.js'
import PlayScene from './scenes/PlayScene.js'
import OverScene from './scenes/OverScene.js'

// ══════════════════════════════════════════════════════════
//  PVZ PC 端全屏布局系统
//  
//  设计原则：基于 80px 素材尺寸反推逻辑分辨率
//  - 素材 80×80px，格子 100×100px（留 20px 边距）
//  - 9 列 × 5 行 = 900×500px 游戏区域
//  - 左边 100px 割草机区 + 右边 100px 僵尸出现区
//  - 顶部 80px UI 栏（卡片栏）
//  - 总计 1100×580px 逻辑分辨率
// ══════════════════════════════════════════════════════════

const COLS = 9
const ROWS = 5
const CELL = 100  // 格子尺寸（素材 80px + 20px 间距）
const GRID_LEFT = 100   // 割草机区域
const GRID_RIGHT = 100  // 僵尸出现区域
const UI_H = 80         // 顶部 UI 栏高度

const BASE_W = GRID_LEFT + COLS * CELL + GRID_RIGHT  // 1100
const BASE_H = UI_H + ROWS * CELL                     // 580
const GRID_W = COLS * CELL                            // 900
const GAME_H = ROWS * CELL                            // 500
const GAME_Y = UI_H                                  // 80

// Phaser 3 游戏配置
const config = {
  type: Phaser.AUTO,
  width: BASE_W,
  height: BASE_H,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  backgroundColor: '#4a7c2e',
  scene: [BootScene, TitleScene, PlayScene, OverScene]
}

// 全局布局常量（必须在 new Phaser.Game 之前设置，场景初始化时即刻需要）
window.GAME_CONFIG = {
  BASE_W, BASE_H,
  COLS, ROWS, CELL,
  UI_H, GAME_Y, GAME_H,
  GRID_LEFT, GRID_RIGHT, GRID_W
}

const game = new Phaser.Game(config)

// 同步挂载到 Phaser.Game 实例，供场景通过 this.game.XXX 访问
Object.assign(game, {
  BASE_W, BASE_H,
  COLS, ROWS, CELL,
  UI_H, GAME_Y, GAME_H,
  GRID_LEFT, GRID_RIGHT, GRID_W
})

window.game = game
