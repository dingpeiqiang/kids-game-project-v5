// ─────────────────────────────────────────────
//  src/game/scenes/BootScene.ts
//  First scene: generates all textures & anims,
//  then immediately jumps to PreloadScene.
// ─────────────────────────────────────────────

import Phaser from 'phaser';
import { createAllTextures, createAnimations } from '../TextureFactory';
import { EventBus } from '../EventBus';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'Boot' }); }

  create(): void {
    // Generate all procedural textures
    createAllTextures(this);
    createAnimations(this);

    // Hide the HTML loading overlay if present
    const overlay = document.getElementById('loading');
    if (overlay) {
      overlay.style.transition = 'opacity 0.4s';
      overlay.style.opacity    = '0';
      setTimeout(() => overlay.remove(), 450);
    }

    EventBus.emit('scene-ready', this);

    // Small delay so the browser can paint before the game starts
    this.time.delayedCall(100, () => this.scene.start('Preload'));
  }
}
