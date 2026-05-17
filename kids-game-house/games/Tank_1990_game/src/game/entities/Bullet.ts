// src/game/entities/Bullet.ts

import Phaser from 'phaser';
import { Direction } from '../../types';
import { DV, BULLET_ANGLE, MAP_W, MAP_H } from '../config';

export class Bullet extends Phaser.Physics.Arcade.Image {
  public readonly isPlayer: boolean;
  public readonly dir: Direction;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    dir: Direction,
    isPlayer: boolean,
    speed: number
  ) {
    super(scene, x, y, 'bullet');

    this.isPlayer = isPlayer;
    this.dir = dir;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;

    body.setAllowGravity(false);
    body.setSize(6, 6);
    body.setOffset(5, 5);

    this.setDepth(7)
      .setAngle(BULLET_ANGLE[dir])
      .setData('owned', true);

    // // Apply velocity AFTER body setup
    // body.setVelocity(
    //   DV[dir].x * speed,
    //   DV[dir].y * speed
    // );
  }

  /** Returns true when the bullet has left the map */
  isOutOfBounds(): boolean {
    return (
      this.x < -4 ||
      this.x > MAP_W + 4 ||
      this.y < -4 ||
      this.y > MAP_H + 4
    );
  }
}