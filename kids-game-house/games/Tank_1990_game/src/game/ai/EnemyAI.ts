//  src/game/ai/EnemyAI.ts

import Phaser from 'phaser';
import { Direction, AIState, EnemyType } from '../../types';
import { DV, ENEMY_CFG, TILE, EAGLE_ROW, EAGLE_COL } from '../config';
import { Enemy } from '../entities/Enemy';
import { Bullet } from '../entities/Bullet';

export interface AIContext {
  levelIndex: number;
  player: Phaser.Physics.Arcade.Image | null;
  enemyBullets: Phaser.Physics.Arcade.Group;
  frozen: boolean;
}

export class EnemyAI {
  private ctx: AIContext;

  constructor(ctx: AIContext) { this.ctx = ctx; }

  setContext(ctx: AIContext): void { this.ctx = ctx; }

  update(enemy: Enemy): void {
    if (!enemy.active) return;

    const enemyBody = enemy.body as Phaser.Physics.Arcade.Body | undefined;
    if (!enemyBody) return;

    // Frozen — stop and skip everything else
    if (this.ctx.frozen) {
      enemyBody.setVelocity(0, 0);
      return;
    }

    const animTmr = (enemy.getData('animTmr') as number) + 1;
    let moveTmr = (enemy.getData('moveTmr') as number) - 1;
    let fireTmr = (enemy.getData('fireTmr') as number) - 1;
    let dir = enemy.getData('dir') as Direction;
    let stuckCtr = (enemy.getData('stuckCtr') as number);

    // Animation
    const frameIdx = Math.floor(animTmr / 6) % 2;
    const base = enemy.getSpriteBase();
    const texKey = enemy.isPower && Math.floor(animTmr / 12) % 2 === 0
      ? `power_${dir}_${frameIdx}`
      : `${base}_${dir}_${frameIdx}`;
    enemy.setTexture(texKey);

    // Stuck detection
    const dx = Math.abs(enemy.x - (enemy.getData('lastX') as number));
    const dy = Math.abs(enemy.y - (enemy.getData('lastY') as number));
    stuckCtr = (dx < 1 && dy < 1) ? stuckCtr + 1 : 0;
    if (stuckCtr > 25) moveTmr = 0;
    enemy.setData('stuckCtr', stuckCtr);
    enemy.setData('lastX', enemy.x);
    enemy.setData('lastY', enemy.y);

    // Direction decision
    if (moveTmr <= 0) {
      dir = this.decideDirection(enemy);
      moveTmr = Phaser.Math.Between(55, 170);
    }

    // Apply velocity via body
    const cfg = ENEMY_CFG[enemy.enemyType as EnemyType];
    enemyBody.setVelocity(DV[dir].x * cfg.speed, DV[dir].y * cfg.speed);

    // Fire
    if (fireTmr <= 0) {
      this.fireBullet(enemy, dir);
      const base_rate = cfg.fireRate / 16;
      fireTmr = Math.max(20, base_rate - this.ctx.levelIndex * 8)
        + Phaser.Math.Between(-12, 12);
    }

    enemy.setData('dir', dir);
    enemy.setData('moveTmr', moveTmr);
    enemy.setData('fireTmr', fireTmr);
    enemy.setData('animTmr', animTmr);
  }

  private decideDirection(enemy: Enemy): Direction {
    const rand = Math.random();
    const aggression = 0.28 + this.ctx.levelIndex * 0.10;

    if (this.ctx.player?.active && rand < aggression)
      return this.dirToward(enemy, this.ctx.player.x, this.ctx.player.y);

    const eagleX = EAGLE_COL * TILE + TILE;
    const eagleY = EAGLE_ROW * TILE + 8;
    if (rand < aggression * 1.8)
      return this.dirToward(enemy, eagleX, eagleY);

    const current = enemy.getData('dir') as Direction;
    const choices = [Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT]
      .filter(d => Math.abs(d - current) !== 2);
    return choices[Math.floor(Math.random() * choices.length)];
  }

  private dirToward(enemy: Enemy, tx: number, ty: number): Direction {
    const dx = tx - enemy.x;
    const dy = ty - enemy.y;
    if (Math.abs(dx) > Math.abs(dy))
      return dx > 0 ? Direction.RIGHT : Direction.LEFT;
    return dy > 0 ? Direction.DOWN : Direction.UP;
  }

  private fireBullet(enemy: Enemy, dir: Direction): void {
    if (!enemy.active) return;
    const off = DV[dir];
    const spd = 155 + this.ctx.levelIndex * 8;

    const b = new Bullet(
      enemy.scene,
      enemy.x + off.x * 10,
      enemy.y + off.y * 10,
      dir,
      false,
      spd,
    );

    this.ctx.enemyBullets.add(b, true);

    // Re-apply velocity after group.add() resets the body
    const bulletBody = b.body as Phaser.Physics.Arcade.Body | undefined;
    if (bulletBody) {
      bulletBody.setVelocity(DV[dir].x * spd, DV[dir].y * spd);
    }
  }
}