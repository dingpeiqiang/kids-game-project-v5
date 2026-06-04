// Phaser 从 CDN 全局加载，无需 import
import Config from "./Config";

const game = new Phaser.Game({
  type: Phaser.WEBGL,
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  parent: 'game-container',
  scene: Config.scene,
  pixelArt: Config.pixelArt,
  physics: Config.physics
});

// 监听窗口大小变化
window.addEventListener('resize', () => {
  game.scale.refresh();
});

export default game;