// Phaser 从 CDN 全局加载
import Config from "../Config";
import Button from "../ui/Button";

export default class GameoverScene extends Phaser.Scene {
  constructor() {
    super("gameoverScene");
  }

  init(data) {
    this.m_mobKilled = data.mobKilled;
    this.m_level = data.level;
  }

  create() {
    const bg = this.add.graphics();
    bg.fillStyle(0x5c6bc0);
    bg.fillRect(0, 0, Config.width, Config.height);
    bg.setScrollFactor(0);

    // 使用普通文本替代 bitmapText
    this.add
      .text(Config.width / 2, Config.height / 2 - 100, "Game Over", {
        fontSize: '48px',
        color: '#ff0000',
        fontFamily: 'Arial, sans-serif'
      })
      .setOrigin(0.5);

    this.add
      .text(Config.width / 2, Config.height / 2, `Mobs Killed: ${this.m_mobKilled}, Level: ${this.m_level}`, {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      })
      .setOrigin(0.5);

    new Button(
      Config.width / 2,
      Config.height / 2 + 100,
      "Go to Main",
      this,
      () => this.scene.start("mainScene")
    );
  }
}