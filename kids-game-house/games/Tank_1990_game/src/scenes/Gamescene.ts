import Phaser from "phaser";
import { Player } from "../game/entities/Player";
import { Enemy } from "../game/entities/Enemy";
import { EnemyType } from "../types/index";

export class GameScene extends Phaser.Scene {

  player!: Player;
  enemies!: Phaser.GameObjects.Group;

  create() {

    const bullets = this.physics.add.group();

    this.player = new Player(this, {
      spawnX: 400,
      spawnY: 500,
      playerBullets: bullets,
      grid: []
    });

    this.enemies = this.add.group();

    for (let i = 0; i < 5; i++) {

      const enemy = new Enemy(
        this,
        Phaser.Math.Between(50, 750),
        100,
        EnemyType.BASIC,
        false
      );

      this.enemies.add(enemy);
    }

  }

}