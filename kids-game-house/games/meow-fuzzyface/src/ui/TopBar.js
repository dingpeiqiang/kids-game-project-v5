// Phaser 从 CDN 全局加载
import Config from "../Config";

export default class TopBar extends Phaser.GameObjects.Graphics {
  constructor(scene) {
    super(scene);

    // 背景
    this.fillStyle(0x28288c)
      .fillRect(0, 0, Config.width, 30)
      .setDepth(90)
      .setScrollFactor(0);

    this.m_score = 0;
    // 使用普通文本替代 bitmapText
    this.m_scoreLabel = scene.add
      .text(5, 5, `MOBS KILLED ${this.m_score.toString().padStart(6, "0")}`, {
        fontSize: '16px',
        color: '#00ff00',
        fontFamily: 'Courier, monospace'
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.m_level = 1;
    this.m_levelLabel = scene.add
      .text(650, 5, `LEVEL ${this.m_level.toString().padStart(3, "0")}`, {
        fontSize: '16px',
        color: '#ffff00',
        fontFamily: 'Courier, monospace'
      })
      .setScrollFactor(0)
      .setDepth(100);

    scene.add.existing(this);
  }

  gainScore() {
    this.m_score += 1;
    this.m_scoreLabel.text = `MOBS KILLED ${this.m_score.toString().padStart(6, "0")}`;
  }

  gainLevel() {
    this.m_level += 1;
    this.m_levelLabel.text = `LEVEL ${this.m_level.toString().padStart(3, "0")}`;
    
    // 升级时经验上限增加 10
    this.scene.m_expBar.m_maxExp += 10;
    this.scene.m_expBar.reset();
  }
}