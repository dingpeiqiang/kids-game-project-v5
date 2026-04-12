// src/game/entities/PowerUp.ts
// 道具实体类 - 处理道具的生成、显示和效果

import Phaser from 'phaser';
import { PowerUpType, Direction } from '../../types';
import { DEPTH, TILE } from '../config';

export interface PowerUpOptions {
  scene: Phaser.Scene;
  x: number;
  y: number;
  type: PowerUpType;
}

export class PowerUp extends Phaser.Physics.Arcade.Image {
  public readonly type: PowerUpType;
  private blinkTimer = 0;
  private visible_flag = true;
  private lifetime = 600; // 10秒 (60fps)

  constructor(scene: Phaser.Scene, options: PowerUpOptions) {
    super(scene, options.x, options.y, PowerUp.getTextureKey(options.type));
    
    this.type = options.type;
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setDepth(DEPTH.POWERUP);
    this.setImmovable(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.allowGravity = false;
    }
    
    // 添加闪烁动画
    this.startBlinking();
  }

  private static getTextureKey(type: PowerUpType): string {
    const keys: Record<PowerUpType, string> = {
      [PowerUpType.STAR]: 'pu_star',
      [PowerUpType.SHIELD]: 'pu_shield',
      [PowerUpType.BOMB]: 'pu_bomb',
      [PowerUpType.LIFE]: 'pu_life',
      [PowerUpType.TIMER]: 'pu_timer',
    };
    return keys[type];
  }

  update(): void {
    if (!this.active) return;

    // 生命周期管理
    this.lifetime--;
    if (this.lifetime <= 0) {
      this.destroy();
      return;
    }

    // 闪烁效果（最后3秒加快闪烁）
    this.blinkTimer++;
    const blinkInterval = this.lifetime < 180 ? 8 : 15;
    if (this.blinkTimer >= blinkInterval) {
      this.blinkTimer = 0;
      this.visible_flag = !this.visible_flag;
      this.setVisible(this.visible_flag);
    }
  }

  private startBlinking(): void {
    this.blinkTimer = 0;
  }

  // 获取道具描述
  getDescription(): string {
    const descriptions: Record<PowerUpType, string> = {
      [PowerUpType.STAR]: '升级坦克',
      [PowerUpType.SHIELD]: '临时护盾',
      [PowerUpType.BOMB]: '摧毁所有敌人',
      [PowerUpType.LIFE]: '额外生命',
      [PowerUpType.TIMER]: '冻结敌人',
    };
    return descriptions[this.type];
  }

  // 获取道具分数
  getScoreValue(): number {
    const scores: Record<PowerUpType, number> = {
      [PowerUpType.STAR]: 500,
      [PowerUpType.SHIELD]: 300,
      [PowerUpType.BOMB]: 1000,
      [PowerUpType.LIFE]: 800,
      [PowerUpType.TIMER]: 400,
    };
    return scores[this.type];
  }
}
