import Phaser from 'phaser'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    // 加载精灵图集
    this.load.atlas('sprites', '/assets/sprites.png', '/assets/sprites.json')
    
    // 加载背景图片
    this.load.image('grass', '/assets/newgrass7x12_small.png')
    
    // 加载音频文件
    this.load.audio('peaShoot', ['/assets/audio/effects/pea_shoot.mp3', '/assets/audio/effects/pea_shoot.ogg'])
    this.load.audio('splat', ['/assets/audio/effects/splat.mp3', '/assets/audio/effects/splat.ogg'])
    this.load.audio('zombiesAreComing', ['/assets/audio/effects/zombies_are_coming.mp3', '/assets/audio/effects/zombies_are_coming.ogg'])
  }

  create() {
    const W = this.cameras.main.width   // 490
    const H = this.cameras.main.height  // 290

    // ── 布局常量 ──────────────────────────────────────────────────
    // 顶部卡片栏高度（y = 0 ~ UI_TOP_H，纯 UI 区域，不放置植物）
    this.game.UI_TOP_H  = 65

    // 草地游戏区域：y = UI_TOP_H ~ H
    this.game.GAME_TOP_Y = this.game.UI_TOP_H       // 65
    this.game.GAME_H     = H - this.game.UI_TOP_H   // 225

    // 7 行 × 12 列网格（仅在草地区域内）
    this.game.ROWS       = 7
    this.game.COLS       = 12
    this.game.CELL_WIDTH  = W / this.game.COLS             // ≈ 40.8
    this.game.CELL_HEIGHT = this.game.GAME_H / this.game.ROWS  // ≈ 32.1

    // 切换到标题场景
    this.scene.start('TitleScene')
  }
}
