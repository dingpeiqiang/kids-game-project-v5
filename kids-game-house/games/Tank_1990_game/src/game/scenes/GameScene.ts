//  src/game/scenes/GameScene.ts
//  Core gameplay scene: map, player, enemies,
//  bullets, power-ups, collisions, HUD events.

import Phaser from 'phaser';
import {
  TILE, COLS, ROWS, MAP_W, MAP_H, HUD_W, GAME_W, GAME_H,
  DEPTH, EAGLE_ROW, EAGLE_COL,
  PLAYER_SPAWN_COL, PLAYER_SPAWN_ROW,
  ENEMY_CFG, HS_KEY,
} from '../config';
import { audioManager } from '../AudioManager';
import { TileType, EnemyType, PowerUpType, Direction, GameInitData } from '../../types';
import { LEVELS, TOTAL_LEVELS } from '../levels/LevelLoader';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Bullet } from '../entities/Bullet';
import { PowerUp } from '../entities/PowerUp';
import { EnemyAI } from '../ai/EnemyAI';
import { PowerUpManager } from '../managers/PowerUpManager';
import { EventBus } from '../EventBus';

const PU_TYPES: PowerUpType[] = [
  PowerUpType.STAR, PowerUpType.SHIELD,
  PowerUpType.BOMB, PowerUpType.LIFE, PowerUpType.TIMER,
];

export class GameScene extends Phaser.Scene {
  // ── Init data────
  private lvlIdx!: number;
  private lives!: number;
  private score!: number;

  // ── Tile groups──
  private brickGrp!: Phaser.Physics.Arcade.StaticGroup;
  private steelGrp!: Phaser.Physics.Arcade.StaticGroup;
  private waterGrp!: Phaser.Physics.Arcade.StaticGroup;
  private treeData!: { px: number; py: number }[];

  // ── Eagle────────
  private eagleImg!: Phaser.GameObjects.Image;
  private eagleZone!: Phaser.GameObjects.Rectangle;
  private eagleAlive = true;

  // ── Entities─────
  private player!: Player;
  private enemyGrp!: Phaser.Physics.Arcade.Group;
  private liveEnemies: Enemy[] = [];
  private pBullets!: Phaser.Physics.Arcade.Group;
  private eBullets!: Phaser.Physics.Arcade.Group;
  
  // ── PowerUp System
  private powerUpManager!: PowerUpManager;

  // ── AI───────────
  private ai!: EnemyAI;

  // ── Spawn queue──
  private spawnQ: EnemyType[] = [];
  private spawnTmr = 0;
  private enemiesLeft = 0;
  private killed = 0;
  private powerEvery = 4;

  // ── FX───────────
  private shieldFX!: Phaser.GameObjects.Image;
  private treeLayer!: Phaser.GameObjects.Graphics;

  // ── Misc timers──
  private waterF = 0;
  private waterTmr = 0;
  private frozen = false;
  private frozenTmr = 0;

  // ── Scene state──
  private paused = false;
  private over = false;

  // ── Grid─────────
  private grid!: TileType[][];

  // ── Enemy spawn points ────────────────────
  private readonly SPAWN_COLS = [0, 12, 25];

  constructor() { super({ key: 'Game' }); }

  init(data: GameInitData): void {
    this.lvlIdx = data.level ?? 0;
    this.lives = data.lives ?? 3;
    this.score = data.score ?? 0;
    this.paused = false;
    this.over = false;
  }

  create(): void {
    // Initialize audio
    audioManager.init();
    audioManager.resume();

    const ld = LEVELS[this.lvlIdx];
    this.grid = ld.grid.map(row => [...row]);

    // ── Background ────────────────────────
    this.cameras.main.setBackgroundColor('#000000');
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);
    this.add.rectangle(MAP_W, 0, HUD_W, MAP_H, 0x000000).setOrigin(0);
    this.add.rectangle(MAP_W, 0, 2, MAP_H, 0x333333).setOrigin(0);

    // ── Tile groups ───────────────────────
    this.brickGrp = this.physics.add.staticGroup();
    this.steelGrp = this.physics.add.staticGroup();
    this.waterGrp = this.physics.add.staticGroup();
    this.treeData = [];
    this.buildMap();

    // ── Eagle────
    this.eagleAlive = true;
    const ex = EAGLE_COL * TILE + TILE, ey = EAGLE_ROW * TILE + 8;
    this.eagleImg = this.add.image(ex, ey, 'eagle').setOrigin(0.5).setDepth(DEPTH.EAGLE);
    this.eagleZone = this.add.rectangle(ex, ey, 32, 16).setDepth(DEPTH.EAGLE);
    this.physics.add.existing(this.eagleZone, true);

    // ── Bullet groups ─────────────────────
    this.pBullets = this.physics.add.group();  // no classType — Bullet self-registers its body
    this.eBullets = this.physics.add.group();

    // ── PowerUp Manager
    this.powerUpManager = new PowerUpManager(this);

    // ── Enemies──
    this.enemyGrp = this.physics.add.group({ classType: Enemy });
    this.liveEnemies = [];
    this.enemiesLeft = ld.totalEnemies;
    this.killed = 0;
    this.powerEvery = ld.powerEnemyEvery;
    this.buildSpawnQueue(ld.waves, ld.totalEnemies);

    // ── AI───────
    this.ai = new EnemyAI({
      levelIndex: this.lvlIdx,
      player: null,
      enemyBullets: this.eBullets,
      frozen: false,
    });

    // ── Player───
    this.player = new Player(this, {
      spawnX: PLAYER_SPAWN_COL * TILE + TILE / 2,
      spawnY: PLAYER_SPAWN_ROW * TILE + TILE / 2,
      playerBullets: this.pBullets,
      grid: this.grid,
    });

    // ── Shield FX
    this.shieldFX = this.add.image(0, 0, 'shield_fx')
      .setVisible(false).setDepth(DEPTH.SHIELD_FX);

    // ── Tree overlay ──────────────────────
    this.treeLayer = this.add.graphics().setDepth(DEPTH.TREE);
    this.drawTreeLayer();

    // ── Collisions ────────────────────────
    this.setupCollisions();

    // ── ESC → pause ───────────────────────
    this.input.keyboard!
      .addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
      .on('down', this.handlePause.bind(this));

    // ── React → Phaser events ─────────────
    EventBus.on('resume-game', this.doResume.bind(this));
    EventBus.on('restart-game', this.doRestart.bind(this));
    EventBus.on('menu-requested', this.goMenu.bind(this));
    
    // ── PowerUp System Events
    EventBus.on('add-score', (score) => {
      this.score += score;
      this.emitHUD();
    });
    EventBus.on('add-life', () => {
      this.lives++;
      this.showBanner('1UP!', 900);
      this.emitHUD();
    });
    EventBus.on('bomb-all-enemies', () => {
      const alive = this.liveEnemies.filter(e => e.active);
      alive.forEach(e => {
        this.spawnBoom(e.x, e.y, 1.5);
        this.score += ENEMY_CFG[e.enemyType].score;
        e.destroy();
        this.killed++;
      });
      this.liveEnemies = this.liveEnemies.filter(e => e.active);
      this.showBanner('BOMB!', 900);
      this.emitHUD();
      this.checkWin();
    });
    EventBus.on('show-message', (msg) => {
      this.showBanner(msg, 900);
    });

    EventBus.emit('scene-ready', this);

    this.showBanner(`STAGE ${this.lvlIdx + 1}`);
    this.emitHUD();
  }

  //  MAP BUILDING
  private buildMap(): void {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = this.grid[r][c];
        const px = c * TILE + TILE / 2;
        const py = r * TILE + TILE / 2;

        if (t === TileType.BRICK) {
          const s = this.physics.add.staticImage(px, py, 'brick');
          s.setData('r', r).setData('c', c).setData('hp', 2);
          this.brickGrp.add(s);
        } else if (t === TileType.STEEL) {
          this.steelGrp.create(px, py, 'steel');
        } else if (t === TileType.WATER) {
          const w = this.physics.add.staticImage(px, py, 'water0');
          w.setData('r', r).setData('c', c);
          this.waterGrp.add(w);
        } else if (t === TileType.TREE) {
          this.treeData.push({ px: c * TILE, py: r * TILE });
        } else if (t === TileType.ICE) {
          this.add.image(px, py, 'ice').setDepth(DEPTH.ICE);
        }
      }
    }
    this.brickGrp.refresh();
    this.steelGrp.refresh();
    this.waterGrp.refresh();
  }

  private drawTreeLayer(): void {
    this.treeLayer.clear();
    for (const { px, py } of this.treeData) {
      this.treeLayer.fillStyle(0x0d3d0d); this.treeLayer.fillRect(px, py, 16, 16);
      this.treeLayer.fillStyle(0x1d6b1d);
      this.treeLayer.fillRect(px + 2, py, 4, 8); this.treeLayer.fillRect(px + 10, py, 4, 8);
      this.treeLayer.fillRect(px, py + 6, 8, 10); this.treeLayer.fillRect(px + 8, py + 4, 8, 12);
      this.treeLayer.fillStyle(0x2d8f2d);
      this.treeLayer.fillRect(px + 3, py + 1, 2, 5); this.treeLayer.fillRect(px + 11, py + 1, 2, 5);
    }
  }

  //  COLLISION SETUP
  private setupCollisions(): void {

    // Player vs world
    this.physics.add.collider(this.player, this.brickGrp);
    this.physics.add.collider(this.player, this.steelGrp);
    this.physics.add.collider(this.player, this.waterGrp);
    this.physics.add.collider(this.player, this.enemyGrp);

    // Enemy vs world
    this.physics.add.collider(this.enemyGrp, this.brickGrp);
    this.physics.add.collider(this.enemyGrp, this.steelGrp);
    this.physics.add.collider(this.enemyGrp, this.waterGrp);
    this.physics.add.collider(this.enemyGrp, this.enemyGrp);

    // Player bullets vs steel
    this.physics.add.collider(
      this.pBullets,
      this.steelGrp,
      (b, _) => {
        this.killBullet(b as Bullet);
      }
    );

    // Player bullets vs brick
    this.physics.add.collider(
      this.pBullets,
      this.brickGrp,
      (b, br) => {
        this.hitBrick(
          b as Bullet,
          br as Phaser.Physics.Arcade.Image
        );
      }
    );

    // Enemy bullets vs steel
    this.physics.add.collider(
      this.eBullets,
      this.steelGrp,
      (b, _) => {
        this.killBullet(b as Bullet);
      }
    );

    // Enemy bullets vs brick
    this.physics.add.collider(
      this.eBullets,
      this.brickGrp,
      (b, br) => {
        this.hitBrick(
          b as Bullet,
          br as Phaser.Physics.Arcade.Image
        );
      }
    );

    // Bullet vs bullet
    this.physics.add.overlap(
      this.pBullets,
      this.eBullets,
      (pb, eb) => {
        this.killBullet(pb as Bullet);
        this.killBullet(eb as Bullet);
      }
    );

    // Player bullets vs enemies
    this.physics.add.overlap(
      this.pBullets,
      this.enemyGrp,
      (b, e) => {
        this.hitEnemy(
          b as Bullet,
          e as Enemy
        );
      }
    );

    // Enemy bullets vs player
    this.physics.add.overlap(
      this.eBullets,
      this.player,
      (b, _) => {
        this.hitPlayer(b as Bullet);
      }
    );

    // Eagle hit
    this.physics.add.overlap(
      this.eBullets,
      this.eagleZone,
      (b, _) => {
        this.killBullet(b as Bullet);
        this.killEagle();
      }
    );

    // Enemy touches eagle
    this.physics.add.overlap(
      this.enemyGrp,
      this.eagleZone,
      () => {
        this.killEagle();
      }
    );

    // Player collects power-up
    this.physics.add.overlap(
      this.player,
      this.powerUpManager['powerUps'], // Access the internal group
      (player, pu) => {
        this.powerUpManager.handleCollision(
          player as Player,
          pu as PowerUp
        );
        this.emitHUD();
      }
    );
  }

  //  SPAWN QUEUE
  private buildSpawnQueue(
    waves: { type: EnemyType; count: number }[][],
    total: number,
  ): void {
    let rem = total, wi = 0;
    while (rem > 0) {
      const wave = waves[wi % waves.length];
      for (const { type, count } of wave) {
        for (let i = 0; i < count && rem > 0; i++) {
          this.spawnQ.push(type); rem--;
        }
      }
      wi++;
    }
    // Partial shuffle to mix types naturally
    for (let i = this.spawnQ.length - 1; i > 0; i--) {
      const j = Phaser.Math.Between(0, i);
      [this.spawnQ[i], this.spawnQ[j]] = [this.spawnQ[j], this.spawnQ[i]];
    }
  }

  private spawnEnemy(): void {
    if (this.spawnQ.length === 0) return;
    const living = this.liveEnemies.filter(e => e.active);
    if (living.length >= LEVELS[this.lvlIdx].maxOnScreen) return;

    const type = this.spawnQ.shift()!;
    const isPower = (this.killed + this.spawnQ.length) % this.powerEvery === 0;
    const col = this.SPAWN_COLS[Phaser.Math.Between(0, 2)];
    const sx = col * TILE + TILE / 2;

    // Spawn flash, then add enemy & colliders
    this.doSpawnFlash(sx, TILE / 2, () => {
      const enemy = new Enemy(this, sx, TILE / 2, type, isPower, this.lvlIdx);
      this.enemyGrp.add(enemy, true);
      this.liveEnemies.push(enemy);
      this.physics.add.collider(enemy, this.brickGrp);
      this.physics.add.collider(enemy, this.steelGrp);
      this.physics.add.collider(enemy, this.waterGrp);
      this.enemiesLeft--;
      this.emitHUD();
    });
  }

  private doSpawnFlash(x: number, y: number, cb: () => void): void {
    let idx = 0;
    const img = this.add.image(x, y, 'spawn0').setDepth(DEPTH.SPAWN_FX);
    this.time.addEvent({
      delay: 100, repeat: 7,
      callback: () => {
        idx = (idx + 1) % 4;
        if (img.active) img.setTexture(`spawn${idx}`);
        if (idx === 0 && !img.active) { img.destroy(); cb(); }
      },
      callbackScope: this,
    });
    this.time.delayedCall(820, () => { if (img.active) img.destroy(); cb(); });
  }

  //  COMBAT HANDLERS
  private killBullet(b: Bullet): void {
    if (!b.active) return;
    this.spawnBoom(b.x, b.y, 0.5);
    b.destroy();
  }

  private hitBrick(
    b: Bullet,
    br: Phaser.Physics.Arcade.Image,
  ): void {
    if (!b.active || !br.active) return;
    this.killBullet(b);
    audioManager.playBrickHit();
    const hp = (br.getData('hp') as number) - 1;
    if (hp <= 0) {
      const r = br.getData('r') as number;
      const c = br.getData('c') as number;
      if (r !== undefined) this.grid[r][c] = TileType.EMPTY;
      this.spawnBoom(br.x, br.y, 0.7);
      audioManager.playExplosion();
      br.destroy();
      this.brickGrp.refresh();
    } else {
      br.setData('hp', hp).setTexture('brick_dmg');
    }
  }

  private hitEnemy(b: Bullet, enemy: Enemy): void {
    if (!b.active || !enemy.active) return;
    this.killBullet(b);

    const dead = enemy.takeDamage(1);
    if (dead) {
      const pts = ENEMY_CFG[enemy.enemyType].score;
      this.score += pts;
      this.floatText(enemy.x, enemy.y, `+${pts}`);
      
      // Spawn power-up if this was a power enemy
      if (enemy.isPower) {
        this.powerUpManager.spawn(enemy.x, enemy.y);
      }
      
      this.spawnBoom(enemy.x, enemy.y, 1.8);
      audioManager.playEnemyHit();
      this.liveEnemies = this.liveEnemies.filter(e => e !== enemy);
      enemy.destroy();
      this.killed++;
      this.emitHUD();
      this.checkWin();
    } else {
      // Flash white
      enemy.setTint(0xffffff);
      this.time.delayedCall(80, () => { if (enemy.active) enemy.clearTint(); });
    }
  }

  private hitPlayer(b: Bullet): void {
    if (!b.active) return;
    if (this.player.shieldActive) { this.killBullet(b); return; }
    if (!this.player.alive) return;

    this.killBullet(b);
    this.spawnBoom(this.player.x, this.player.y, 2.2);
    audioManager.playPlayerHit();
    this.player.alive = false;
    this.player.setVisible(false);
    
    // Move player off-screen instead of disabling body
    const body = this.player.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.setVelocity(0, 0);
      // Keep body enabled but move to safe location
      body.reset(-200, -200);
    } else {
      console.warn('[GameScene] Player body is null in hitPlayer');
    }

    this.lives--;
    this.emitHUD();

    if (this.lives < 0) {
      this.time.delayedCall(900, () => this.doGameOver());
    } else {
      this.time.delayedCall(1800, () => this.respawnPlayer());
    }
  }

  private respawnPlayer(): void {
    if (this.over) return;

    const spawnX = PLAYER_SPAWN_COL * TILE + TILE / 2;
    const spawnY = PLAYER_SPAWN_ROW * TILE + TILE / 2;

    // Check if player and body exist
    if (!this.player) {
      console.error('[GameScene] Player object is null/undefined, cannot respawn');
      return;
    }
    
    const body = this.player.body as Phaser.Physics.Arcade.Body | null;
    if (!body) {
      console.error('[GameScene] Player body is null/undefined, cannot respawn');
      return;
    }
    
    // Reset player to spawn position
    body.reset(spawnX, spawnY);
    this.player.setPosition(spawnX, spawnY);
    this.player.setVisible(true);

    // 完全重置玩家状态
    this.player.alive = true;
    this.player.direction = 0; // 重置朝向为上
    this.player.starLevel = 0;
    this.player.shieldActive = true;
    this.player.shieldTimer = 400;
    this.player.animFrame = 0; // 重置动画帧
    
    // 立即设置初始纹理
    this.player.setTexture('player_0_0');
  }

  private killEagle(): void {
    if (!this.eagleAlive) return;
    this.eagleAlive = false;
    this.eagleImg.setTexture('eagle_dead');
    this.spawnBoom(this.eagleImg.x, this.eagleImg.y, 2.5);
    audioManager.playExplosion();
    for (let i = 0; i < 4; i++) {
      this.time.delayedCall(200 * i + 150, () => {
        this.spawnBoom(
          this.eagleImg.x + Phaser.Math.Between(-20, 20),
          this.eagleImg.y + Phaser.Math.Between(-12, 12),
          1.5,
        );
      });
    }
    this.time.delayedCall(1400, () => this.doGameOver());
  }

  private checkWin(): void {
    const remaining = this.spawnQ.length + this.liveEnemies.filter(e => e.active).length;
    if (remaining === 0 && !this.over) {
      this.time.delayedCall(1600, () => this.doLevelComplete());
    }
  }

  //  VFX
  private spawnBoom(x: number, y: number, scale: number): void {
    const s = this.add.sprite(x, y, 'explosion', 0)
      .setScale(scale).setDepth(DEPTH.EXPLOSION);
    s.play('explode').once('animationcomplete', () => s.destroy());
  }

  private floatText(x: number, y: number, msg: string): void {
    const t = this.add.text(x, y - 4, msg, {
      fontSize: '7px',
      fontFamily: '"Press Start 2P"',
      color: '#ffff00',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY);
    this.tweens.add({
      targets: t, y: y - 30, alpha: 0, duration: 900,
      onComplete: () => t.destroy(),
    });
  }

  private showBanner(msg: string, duration = 2200): void {
    const bx = MAP_W / 2, by = MAP_H / 2;
    const bg = this.add.rectangle(bx, by, 260, 50, 0x000000, 0.9).setDepth(DEPTH.OVERLAY);
    const tx = this.add.text(bx, by, msg, {
      fontSize: '16px',
      fontFamily: '"Press Start 2P"',
      color: '#ffdd00',
      stroke: '#cc5500',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1);

    this.time.delayedCall(duration, () => {
      this.tweens.add({
        targets: [bg, tx], alpha: 0, duration: 400,
        onComplete: () => { bg.destroy(); tx.destroy(); },
      });
    });
  }

  //  HUD → REACT
  private emitHUD(): void {
    EventBus.emit('hud-update', {
      score: this.score,
      highScore: +(localStorage.getItem(HS_KEY) ?? 0),
      lives: Math.max(0, this.lives),
      level: this.lvlIdx,
      enemiesLeft: this.spawnQ.length + this.liveEnemies.filter(e => e.active).length,
      starLevel: this.player?.starLevel ?? 0,
      shieldActive: this.player?.shieldActive ?? false,
      frozen: this.frozen,
    });
  }

  //  TRANSITIONS
  private doLevelComplete(): void {
    if (this.over) return;
    this.over = true;
    this.saveHS();
    audioManager.playLevelComplete();
    const next = this.lvlIdx + 1;
    EventBus.emit('level-complete', {
      level: this.lvlIdx,
      score: this.score,
      lives: this.lives,
      nextLevel: next,
    });
    this.scene.start('LevelComplete', {
      level: this.lvlIdx, score: this.score, lives: this.lives, nextLevel: next,
    });
  }

  private doGameOver(): void {
    if (this.over) return;
    this.over = true;
    this.saveHS();
    audioManager.playGameOver();
    EventBus.emit('game-over', { score: this.score });
    this.scene.start('GameOver', { score: this.score });
  }

  private saveHS(): void {
    const hs = +(localStorage.getItem(HS_KEY) ?? 0);
    if (this.score > hs) localStorage.setItem(HS_KEY, String(this.score));
  }

  // ── Pause / resume ────────────────────────
  private handlePause(): void {
    if (this.over) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.physics.pause();
      audioManager.playPause();
      EventBus.emit('game-paused');
    } else {
      this.physics.resume();
      audioManager.playResume();
      EventBus.emit('game-resumed');
    }
  }

  private doResume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.physics.resume();
  }

  private doRestart(): void {
    this.scene.restart({ level: this.lvlIdx, lives: 3, score: this.score });
  }

  private goMenu(): void {
    this.over = true;
    this.scene.start('Menu');
  }

  // Main loop
  update(): void {
    if (this.paused || this.over) return;

    // Only update player when alive
    if (this.player?.alive) {
      this.player.update();
    }

    // Update PowerUp Manager
    this.powerUpManager.update();

    // Shield FX
    if (this.player?.shieldActive && this.player?.alive) {
      this.shieldFX
        .setVisible(true)
        .setPosition(this.player.x, this.player.y)
        .setAlpha(0.5 + 0.5 * Math.sin(this.time.now * 0.012));
    } else {
      this.shieldFX.setVisible(false);
    }

    // Frozen countdown (handled by PowerUpManager)
    if (this.powerUpManager.isFrozen()) {
      this.liveEnemies.forEach(e => { 
        if (e.active) e.setTint(0x88ccff); 
      });
    } else {
      this.liveEnemies.forEach(e => { 
        if (e.active) e.clearTint(); 
      });
    }

    // Update AI context & tick each enemy
    this.ai.setContext({
      levelIndex: this.lvlIdx,
      player: this.player.alive ? this.player : null,
      enemyBullets: this.eBullets,
      frozen: this.powerUpManager.isFrozen(),
    });
    for (let i = this.liveEnemies.length - 1; i >= 0; i--) {
      const e = this.liveEnemies[i];
      if (!e?.active) { this.liveEnemies.splice(i, 1); continue; }
      this.ai.update(e);
    }

    // Spawn cooldown - 关卡越高，生成越快
    this.spawnTmr++;
    const baseInterval = LEVELS[this.lvlIdx].spawnInterval;
    // 每关减少 10% 生成间隔，最低 40 帧
    const adjustedInterval = Math.max(40, Math.floor(baseInterval * (1 - this.lvlIdx * 0.1)));
    
    if (this.spawnTmr >= adjustedInterval) {
      this.spawnTmr = 0;
      this.spawnEnemy();
    }

    // Water animation
    this.waterTmr++;
    if (this.waterTmr >= 28) {
      this.waterTmr = 0;
      this.waterF = 1 - this.waterF;
      this.waterGrp.getChildren().forEach(w =>
        (w as Phaser.Physics.Arcade.Image).setTexture(`water${this.waterF}`),
      );
    }

    // OOB bullet cleanup
    [...this.pBullets.getChildren(), ...this.eBullets.getChildren()].forEach(b => {
      if ((b as Bullet).isOutOfBounds()) b.destroy();
    });

    // Periodic HUD emit (score can change)
    if (this.time.now % 500 < 20) this.emitHUD();
  }

  // ── Scene cleanup
  shutdown(): void {
    EventBus.off('resume-game', this.doResume.bind(this));
    EventBus.off('restart-game', this.doRestart.bind(this));
    EventBus.off('menu-requested', this.goMenu.bind(this));
    
    // Clean up PowerUp system
    if (this.powerUpManager) {
      this.powerUpManager.clearAll();
    }
  }
}