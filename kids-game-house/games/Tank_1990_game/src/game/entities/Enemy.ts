// ─────────────────────────────────────────────
//  src/game/entities/Enemy.ts
// ─────────────────────────────────────────────

import Phaser from 'phaser';
import { Direction, EnemyType, AIState } from '../../types';
import { ENEMY_CFG, DEPTH } from '../config';

// Raw data stored on the enemy image via Phaser's setData / getData
export interface EnemyData {
  type:       EnemyType;
  hp:         number;
  maxHp:      number;
  dir:        Direction;
  state:      AIState;
  moveTmr:    number;
  fireTmr:    number;
  animTmr:    number;
  stuckCtr:   number;
  lastX:      number;
  lastY:      number;
  isPower:    boolean;   // carries a power-up on death
}

/** Thin wrapper around Phaser.Physics.Arcade.Image with typed EnemyData */
export class Enemy extends Phaser.Physics.Arcade.Image {
  public readonly enemyType: EnemyType;
  public isPower: boolean;

  private _hp:    number;
  private _maxHp: number;

  constructor(scene: Phaser.Scene, x: number, y: number, type: EnemyType, isPower: boolean) {
    const cfg  = ENEMY_CFG[type];
    const texKey = `${type.toLowerCase()}_2_0`;
    super(scene, x, y, texKey);

    this.enemyType = type;
    this.isPower   = isPower;
    this._hp       = cfg.hp;
    this._maxHp    = cfg.hp;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true)
        .setDepth(DEPTH.TANK);

    // Initialise typed data bag
    const data: EnemyData = {
      type,
      hp:      cfg.hp,
      maxHp:   cfg.hp,
      dir:     Direction.DOWN,
      state:   AIState.PATROL,
      moveTmr: Phaser.Math.Between(60, 160),
      fireTmr: Phaser.Math.Between(40,  80),
      animTmr: 0,
      stuckCtr: 0,
      lastX:   x,
      lastY:   y,
      isPower,
    };
    this.setData(data);
  }

  // ── Accessors ─────────────────────────────
  get hp():    number { return this.getData('hp') as number; }
  get maxHp(): number { return this.getData('maxHp') as number; }

  /** Applies damage. Returns true if tank is destroyed. */
  takeDamage(amount = 1): boolean {
    const newHp = (this.getData('hp') as number) - amount;
    this.setData('hp', Math.max(0, newHp));
    return newHp <= 0;
  }

  /** Returns the current sprite key prefix for this enemy type + hp level */
  getSpriteBase(): string {
    if (this.enemyType !== EnemyType.ARMORED) return this.enemyType.toLowerCase();
    const ratio = (this.getData('hp') as number) / (this.getData('maxHp') as number);
    if (ratio >= 1.0) return 'armored';
    if (ratio >= 0.67) return 'armored_dmg1';
    if (ratio >= 0.34) return 'armored_dmg2';
    return 'armored_dmg3';
  }
}
