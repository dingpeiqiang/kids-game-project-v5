// src/game/entities/Player.ts

import Phaser from 'phaser';
import { Direction, TileType } from '../../types';
import {
  TILE, COLS, ROWS, DV, DEPTH,
  PLAYER_SPEED, PLAYER_BULLET_SPEED,
  PLAYER_FIRE_CD, PLAYER_MAX_BULLETS,
} from '../config';
import { Bullet } from './Bullet';
import { audioManager } from '../AudioManager';

export interface PlayerOptions {
  spawnX: number;
  spawnY: number;
  playerBullets: Phaser.Physics.Arcade.Group;
  grid: TileType[][];
}

export class Player extends Phaser.Physics.Arcade.Image {
  public direction: Direction = Direction.UP;
  public starLevel: number = 0;
  public shieldActive: boolean = false;
  public shieldTimer: number = 0;
  public alive: boolean = true;
  public animFrame: number = 0;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private fireKey!: Phaser.Input.Keyboard.Key;
  private wasd!: { up: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private bulletCooldown: number = 0;
  private playerBullets: Phaser.Physics.Arcade.Group;
  private grid: TileType[][];

  constructor(scene: Phaser.Scene, options: PlayerOptions) {
    super(scene, options.spawnX, options.spawnY, 'player_0_0');

    this.playerBullets = options.playerBullets;
    this.grid = options.grid;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true).setDepth(DEPTH.TANK);

    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.fireKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const kb = scene.input.keyboard!;
    this.wasd = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.shieldActive = true;
    this.shieldTimer = 400;
  }

  update(): void {
    if (!this.alive || !this.scene) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    const speed = PLAYER_SPEED(this.starLevel);
    let vx = 0, vy = 0, moved = false;

    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;
    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;

    const prevDir = this.direction;

    if (up) { vy = -speed; this.direction = Direction.UP; moved = true; }
    else if (down) { vy = speed; this.direction = Direction.DOWN; moved = true; }
    else if (left) { vx = -speed; this.direction = Direction.LEFT; moved = true; }
    else if (right) { vx = speed; this.direction = Direction.RIGHT; moved = true; }

    body.setVelocity(vx, vy);

    if (moved && this.direction !== prevDir) {
      if (vx !== 0) this.y = Math.round(this.y / TILE) * TILE + TILE / 2;
      if (vy !== 0) this.x = Math.round(this.x / TILE) * TILE + TILE / 2;
    }

    if (!moved && this.isOnIce()) {
      body.setVelocity(body.velocity.x * 0.9, body.velocity.y * 0.9);
    }

    this.animFrame++;
    this.setTexture(`player_${this.direction}_${Math.floor(this.animFrame / 6) % 2}`);

    if (this.bulletCooldown > 0) this.bulletCooldown--;
    const maxB = PLAYER_MAX_BULLETS(this.starLevel);
    if (
      Phaser.Input.Keyboard.JustDown(this.fireKey) &&
      this.playerBullets.countActive() < maxB &&
      this.bulletCooldown <= 0
    ) {
      this.fireBullet();
    }

    if (this.shieldActive) {
      this.shieldTimer--;
      if (this.shieldTimer <= 0) this.shieldActive = false;
    }
  }

  private fireBullet(): void {
    const off = DV[this.direction];
    const spd = PLAYER_BULLET_SPEED(this.starLevel);

    const bullet = new Bullet(
      this.scene,
      this.x + off.x * 10,
      this.y + off.y * 10,
      this.direction,
      true,
      spd
    );

    this.playerBullets.add(bullet, true);

    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(
      DV[this.direction].x * spd,
      DV[this.direction].y * spd
    );
    
    audioManager.playShoot();
  }

  private isOnIce(): boolean {
    const col = Math.floor(this.x / TILE);
    const row = Math.floor(this.y / TILE);
    return (
      row >= 0 && row < ROWS && col >= 0 && col < COLS &&
      this.grid[row][col] === TileType.ICE
    );
  }

  addShield(frames: number): void {
    this.shieldActive = true;
    this.shieldTimer = Math.max(this.shieldTimer, frames);
  }

  upgradeStarLevel(): void {
    this.starLevel = Math.min(this.starLevel + 1, 3);
  }
}
