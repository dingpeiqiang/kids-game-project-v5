
//  src/game/scenes/GameOverScene.ts

import Phaser from 'phaser';
import { GAME_W, GAME_H, HS_KEY } from '../config';
import { GameOverData } from '../../types';

export class GameOverScene extends Phaser.Scene {
  private score = 0;

  constructor() { super({ key: 'GameOver' }); }

  init(data: GameOverData): void { this.score = data.score ?? 0; }

  create(): void {
    const W2 = GAME_W / 2, H = GAME_H;

    this.add.rectangle(0, 0, GAME_W, H, 0x000000).setOrigin(0);

    // Red flash fade-out
    const rf = this.add.rectangle(0, 0, GAME_W, H, 0xff0000, 0.2).setOrigin(0);
    this.tweens.add({ targets: rf, alpha: 0, duration: 2600 });

    // Scanlines
    for (let y = 0; y < H; y += 4)
      this.add.rectangle(0, y, GAME_W, 2, 0x000000, 0.3).setOrigin(0);

    // Title drops in from top
    const t1 = this.add.text(W2, -60, 'GAME', this.ts(48)).setOrigin(0.5);
    const t2 = this.add.text(W2, -120, 'OVER', this.ts(48)).setOrigin(0.5);
    this.tweens.add({ targets: t1, y: 90, duration: 620, ease: 'Bounce.Out' });
    this.tweens.add({ targets: t2, y: 155, duration: 720, delay: 100, ease: 'Bounce.Out' });

    const hs = +(localStorage.getItem(HS_KEY) ?? 0);
    const isNew = this.score > 0 && this.score >= hs;

    this.add.text(W2, 225, `SCORE  ${pad(this.score)}`, this.ts(12, '#ffffff')).setOrigin(0.5);

    if (isNew) {
      const nt = this.add.text(W2, 256, '★ NEW HIGH SCORE ★', this.ts(9, '#ffdd00')).setOrigin(0.5);
      this.tweens.add({ targets: nt, scaleX: 1.15, scaleY: 1.15, duration: 600, yoyo: true, repeat: -1 });
    }
    this.add.text(W2, isNew ? 282 : 258, `BEST   ${pad(hs)}`, this.ts(9, '#666666')).setOrigin(0.5);

    // Buttons appear after brief delay
    this.time.delayedCall(1200, () => {
      const ct = this.add.text(W2, H - 72, 'SPACE  ─  TRY AGAIN', this.ts(10, '#ffdd00')).setOrigin(0.5);
      this.tweens.add({ targets: ct, alpha: 0.1, duration: 500, yoyo: true, repeat: -1 });
      this.add.text(W2, H - 44, 'M  ─  MAIN MENU', this.ts(8, '#555')).setOrigin(0.5);
      this.add.text(W2, H - 22, `R  ─  HIGH SCORES  [ BEST: ${pad(hs)} ]`, this.ts(7, '#444')).setOrigin(0.5);

      this.input.keyboard!.once('keydown-SPACE', () => this.scene.start('Game', { level: 0, lives: 3, score: 0 }));
      this.input.keyboard!.once('keydown-ENTER', () => this.scene.start('Game', { level: 0, lives: 3, score: 0 }));
      this.input.keyboard!.once('keydown-M', () => this.scene.start('Menu'));
    });
  }

  private ts(size: number, color = '#ff2222'): Phaser.Types.GameObjects.Text.TextStyle {
    return { fontSize: `${size}px`, fontFamily: '"Press Start 2P"', color, stroke: '#440000', strokeThickness: 4 };
  }
}

//  src/game/scenes/LevelCompleteScene.ts

import { LevelCompleteData } from '../../types';
import { TOTAL_LEVELS } from '../levels/LevelLoader';

export class LevelCompleteScene extends Phaser.Scene {
  private data2!: LevelCompleteData;

  constructor() { super({ key: 'LevelComplete' }); }

  init(data: LevelCompleteData): void { this.data2 = data; }

  create(): void {
    const { level, score, lives, nextLevel } = this.data2;
    const W2 = GAME_W / 2, H = GAME_H;

    this.add.rectangle(0, 0, GAME_W, H, 0x000000).setOrigin(0);
    for (let y = 0; y < H; y += 4)
      this.add.rectangle(0, y, GAME_W, 2, 0x000000, 0.25).setOrigin(0);

    this.add.text(W2, 58, 'MISSION', this.ts(30, '#44ff88')).setOrigin(0.5);
    this.add.text(W2, 100, 'COMPLETE!', this.ts(30, '#44ff88')).setOrigin(0.5);

    const g = this.add.graphics();
    g.lineStyle(2, 0x224422); g.lineBetween(40, 134, GAME_W - 40, 134);

    this.add.text(W2, 155, `STAGE ${level + 1} CLEAR`, this.ts(11, '#ffdd00')).setOrigin(0.5);

    // Animated score tally
    let shown = 0;
    const sTx = this.add.text(W2, 208, `SCORE  ${pad(0)}`, this.ts(11, '#ffffff')).setOrigin(0.5);
    const maxTicks = Math.min(60, score);
    const inc = maxTicks > 0 ? Math.ceil(score / maxTicks) : score;
    this.time.addEvent({
      delay: 25, repeat: maxTicks,
      callback: () => {
        shown = Math.min(shown + inc, score);
        sTx.setText(`SCORE  ${pad(shown)}`);
      },
    });

    const hs = +(localStorage.getItem(HS_KEY) ?? 0);
    this.add.text(W2, 238, `BEST   ${pad(hs)}`, this.ts(10, '#888')).setOrigin(0.5);
    this.add.text(W2, 264, `LIVES  ${lives}`, this.ts(10, '#44ff88')).setOrigin(0.5);

    g.lineStyle(2, 0x1a1a1a); g.lineBetween(40, 290, GAME_W - 40, 290);
    this.add.text(W2, 302, 'ENEMY SCORE TABLE', this.ts(7, '#555')).setOrigin(0.5);
    ([['BASIC', '100'], ['FAST', '200'], ['ARMORED', '400']] as const).forEach(([n, p], i) => {
      this.add.text(W2 - 90, 322 + i * 18, n, this.ts(7, '#777')).setOrigin(0, 0.5);
      this.add.text(W2 + 90, 322 + i * 18, `${p} pts`, this.ts(7, '#888')).setOrigin(1, 0.5);
    });

    if (nextLevel < TOTAL_LEVELS) {
      const ct = this.add.text(W2, H - 48, `SPACE  ─  STAGE ${nextLevel + 1}`, this.ts(9, '#ffdd00')).setOrigin(0.5);
      this.tweens.add({ targets: ct, alpha: 0.1, duration: 500, yoyo: true, repeat: -1 });
      const cont = () => this.scene.start('Game', { level: nextLevel, lives, score });
      this.input.keyboard!.once('keydown-SPACE', cont);
      this.input.keyboard!.once('keydown-ENTER', cont);
    } else {
      this.add.text(W2, H - 68, '★ CONGRATULATIONS ★', this.ts(10, '#ffdd00')).setOrigin(0.5);
      this.add.text(W2, H - 46, 'YOU SAVED THE BASE!', this.ts(8, '#44ff88')).setOrigin(0.5);
      const ct = this.add.text(W2, H - 24, 'SPACE  ─  PLAY AGAIN', this.ts(9, '#aaa')).setOrigin(0.5);
      this.tweens.add({ targets: ct, alpha: 0.1, duration: 500, yoyo: true, repeat: -1 });
      this.input.keyboard!.once('keydown-SPACE', () => this.scene.start('Menu'));
    }
    this.add.text(W2, H - 12, 'M  ─  MAIN MENU', this.ts(7, '#444')).setOrigin(0.5);
    this.input.keyboard!.once('keydown-M', () => this.scene.start('Menu'));
  }

  private ts(size: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
    return { fontSize: `${size}px`, fontFamily: '"Press Start 2P"', color, stroke: '#003322', strokeThickness: 3 };
  }
}

//  Utility
function pad(n: number): string { return String(n).padStart(6, '0'); }
