// ─────────────────────────────────────────────
//  src/game/scenes/PreloadScene.ts
//  Loads real PNG/JSON assets from public/assets/.
//  If assets are absent (dev / demo mode) the
//  procedural textures from BootScene are used.
// ─────────────────────────────────────────────

import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'Preload' }); }

  preload(): void {
    // ── Progress bar ──────────────────────
    const { width, height } = this.cameras.main;
    const barBg = this.add
      .rectangle(width / 2, height / 2, 300, 20, 0x333333)
      .setOrigin(0.5);
    const bar = this.add
      .rectangle(width / 2 - 150, height / 2, 0, 20, 0xffdd00)
      .setOrigin(0, 0.5);
    const label = this.add
      .text(width / 2, height / 2 + 28, 'LOADING…', {
        fontSize: '9px',
        fontFamily: '"Press Start 2P"',
        color: '#888888',
      })
      .setOrigin(0.5);

    this.load.on('progress', (v: number) => {
      bar.width = 300 * v;
    });

    void barBg; void bar; void label;
  }

  create(): void {
    this.scene.start('Menu');
  }
}
