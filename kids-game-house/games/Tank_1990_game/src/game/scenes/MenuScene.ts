// ─────────────────────────────────────────────
//  src/game/scenes/MenuScene.ts
//  Lightweight Phaser scene that exists only to
//  hold the "background" canvas while React
//  renders the actual menu overlay on top.
// ─────────────────────────────────────────────

import Phaser from 'phaser';
import { GAME_W, GAME_H, TILE } from '../config';
import { EventBus } from '../EventBus';

export class MenuScene extends Phaser.Scene {
  private demoTank!: Phaser.GameObjects.Image;
  private demoDir = 0;
  private demoT = 0;

  constructor() { super({ key: 'Menu' }); }

  create(): void {
    // Dark grid background
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000).setOrigin(0);
    const g = this.add.graphics();
    g.lineStyle(1, 0x111111, 1);
    for (let x = 0; x <= GAME_W; x += TILE) g.lineBetween(x, 0, x, GAME_H);
    for (let y = 0; y <= GAME_H; y += TILE) g.lineBetween(0, y, GAME_W, y);

    // Scanlines
    for (let y = 0; y < GAME_H; y += 4) {
      this.add.rectangle(0, y, GAME_W, 2, 0x000000, 0.18).setOrigin(0);
    }

    // Animated demo tank in centre
    this.demoTank = this.add.image(GAME_W / 2, GAME_H / 2 - 20, 'player_0_0').setScale(4);

    // Tell React the menu is active
    EventBus.emit('scene-ready', this);

    // Space / Enter starts the game (fallback when React component not available)
    this.input.keyboard!.once('keydown-SPACE', this.startGame, this);
    this.input.keyboard!.once('keydown-ENTER', this.startGame, this);

    // React → Phaser
    EventBus.on('resume-game', this.noop);
    EventBus.on('menu-requested', this.noop);
  }

  private startGame(): void {
    this.scene.start('Game', { level: 0, lives: 3, score: 0 });
  }

  private noop(): void { /* handled by React */ }

  update(): void {
    this.demoT++;
    if (this.demoT % 80 === 0) this.demoDir = (this.demoDir + 1) % 4;
    const fr = Math.floor(this.demoT / 10) % 2;
    this.demoTank.setTexture(`player_${this.demoDir}_${fr}`);
  }

  shutdown(): void {
    EventBus.off('resume-game', this.noop);
    EventBus.off('menu-requested', this.noop);
  }
}
