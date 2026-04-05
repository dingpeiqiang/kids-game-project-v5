// Phaser 从 CDN 全局加载
import Config from "../Config";
import Button from "../ui/Button";

export default class MainScene extends Phaser.Scene {
  constructor() {
    super("mainScene");
  }

  create() {
    const bg = this.add.graphics();
    bg.fillStyle(0xbbdefb);
    bg.fillRect(0, 0, Config.width, Config.height);
    bg.setScrollFactor(0);

    // 使用普通文本替代 bitmapText（字体加载有问题）
    this.add
      .text(Config.width / 2, 150, "Meow Meow Fuzzyface", { 
        fontSize: '40px', 
        color: '#333',
        fontFamily: 'Arial, sans-serif'
      })
      .setOrigin(0.5);

    this.add.image(Config.width / 2, Config.height / 2, "cat");

    new Button(
      Config.width / 2,
      Config.height / 2 + 150,
      "Start Game",
      this,
      () => this.scene.start("playGame")
    );
  }
}
