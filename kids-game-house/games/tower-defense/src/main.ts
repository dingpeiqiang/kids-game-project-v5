import Phaser from 'phaser';
import config from './config/phaserConfig';

class TowerDefenseGame {
  private game: Phaser.Game;

  constructor() {
    this.game = new Phaser.Game(config);
  }

  destroy() {
    if (this.game) {
      this.game.destroy(true);
    }
  }
}

// 启动游戏
window.addEventListener('load', () => {
  new TowerDefenseGame();
});