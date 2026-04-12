// src/game/managers/PowerUpManager.ts
// 道具管理器 - 控制道具的生成、碰撞和效果应用

import Phaser from 'phaser';
import { PowerUp } from '../entities/PowerUp';
import { PowerUpType } from '../../types';
import { Player } from '../entities/Player';
import { EventBus } from '../EventBus';
import { audioManager } from '../AudioManager';

export class PowerUpManager {
  private scene: Phaser.Scene;
  private powerUps: Phaser.Physics.Arcade.Group;
  private spawnTimer = 0;
  private frozen = false;
  private freezeTimer = 0;
  
  // 道具统计
  private pickupHistory: { type: PowerUpType; timestamp: number }[] = [];
  private consecutivePickups = 0; // 连续拾取计数
  private lastPickupTime = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.powerUps = scene.physics.add.group({
      classType: PowerUp,
      runChildUpdate: true,
    });
  }

  // 更新管理器
  update(): void {
    // 更新所有道具
    this.powerUps.children.each((child) => {
      const powerUp = child as PowerUp;
      if (powerUp.active) {
        powerUp.update();
      }
      return true;
    });

    // 处理冻结状态
    if (this.frozen) {
      this.freezeTimer--;
      if (this.freezeTimer <= 0) {
        this.unfreezeAll();
      }
    }
  }

  // 在指定位置生成道具
  spawn(x: number, y: number, type?: PowerUpType): PowerUp | null {
    // 检查是否已有道具
    if (this.powerUps.countActive() >= 1) {
      return null; // 同时只能有一个道具
    }

    const powerUpType = type || this.randomPowerUpType();
    
    // 调整生成位置，确保在可行走区域
    const adjustedPos = this.adjustSpawnPosition(x, y);
    
    const powerUp = new PowerUp(this.scene, {
      scene: this.scene,
      x: adjustedPos.x,
      y: adjustedPos.y,
      type: powerUpType,
    });

    this.powerUps.add(powerUp);
    
    // 播放生成特效
    this.playSpawnEffect(adjustedPos.x, adjustedPos.y);
    
    return powerUp;
  }

  // 调整生成位置，避开障碍物
  private adjustSpawnPosition(x: number, y: number): { x: number; y: number } {
    const TILE = 16;
    const col = Math.floor(x / TILE);
    const row = Math.floor(y / TILE);
    
    // 简单验证：如果在边界内则返回原位置
    if (col >= 0 && col < 26 && row >= 0 && row < 26) {
      return { x, y };
    }
    
    // 否则返回默认位置
    return { x: 200, y: 200 };
  }

  // 播放生成特效
  private playSpawnEffect(x: number, y: number): void {
    // 创建简单的闪光效果
    const flash = this.scene.add.circle(x, y, 20, 0xffff00, 0.6);
    flash.setDepth(100);
    
    this.scene.tweens.add({
      targets: flash,
      scale: 2,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => flash.destroy(),
    });
  }

  // 随机选择道具类型（带权重）
  private randomPowerUpType(): PowerUpType {
    const weights = [
      { type: PowerUpType.STAR, weight: 30 },
      { type: PowerUpType.SHIELD, weight: 25 },
      { type: PowerUpType.BOMB, weight: 10 },
      { type: PowerUpType.LIFE, weight: 15 },
      { type: PowerUpType.TIMER, weight: 20 },
    ];

    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of weights) {
      random -= item.weight;
      if (random <= 0) {
        return item.type;
      }
    }

    return PowerUpType.STAR; // 默认
  }

  // 处理玩家与道具的碰撞
  handleCollision(player: Player, powerUp: PowerUp): void {
    if (!player.alive || !powerUp.active) return;

    // 记录拾取历史
    this.recordPickup(powerUp.type);
    
    // 计算连击奖励
    const comboBonus = this.calculateComboBonus();

    // 应用道具效果
    this.applyEffect(player, powerUp.type);

    // 增加分数（包括连击奖励）
    const baseScore = powerUp.getScoreValue();
    const totalScore = baseScore + comboBonus;
    EventBus.emit('add-score', totalScore);
    
    // 播放道具音效
    audioManager.playPowerUp();
    
    // 显示连击信息
    if (comboBonus > 0) {
      this.showComboMessage(comboBonus);
    }

    // 显示获得提示
    this.showPickupMessage(powerUp.getDescription());

    // 销毁道具
    powerUp.destroy();
  }

  // 记录拾取历史
  private recordPickup(type: PowerUpType): void {
    const now = Date.now();
    this.pickupHistory.push({ type, timestamp: now });
    
    // 保留最近30秒的记录
    this.pickupHistory = this.pickupHistory.filter(
      p => now - p.timestamp < 30000
    );
    
    // 检查是否是连续拾取（5秒内）
    if (now - this.lastPickupTime < 5000) {
      this.consecutivePickups++;
    } else {
      this.consecutivePickups = 1;
    }
    this.lastPickupTime = now;
  }

  // 计算连击奖励
  private calculateComboBonus(): number {
    if (this.consecutivePickups >= 3) {
      return 200; // 3连击以上奖励200分
    } else if (this.consecutivePickups === 2) {
      return 100; // 2连击奖励100分
    }
    return 0;
  }

  // 显示连击消息
  private showComboMessage(bonus: number): void {
    const message = `COMBO x${this.consecutivePickups}! +${bonus}`;
    EventBus.emit('show-message', message);
  }

  // 应用道具效果
  private applyEffect(player: Player, type: PowerUpType): void {
    switch (type) {
      case PowerUpType.STAR:
        this.applyStar(player);
        break;
      case PowerUpType.SHIELD:
        this.applyShield(player);
        break;
      case PowerUpType.BOMB:
        this.applyBomb();
        break;
      case PowerUpType.LIFE:
        this.applyLife();
        break;
      case PowerUpType.TIMER:
        this.applyTimer();
        break;
    }
  }

  // STAR: 升级坦克
  private applyStar(player: Player): void {
    player.upgradeStarLevel();
    // Note: HUD will be updated by GameScene's emitHUD()
  }

  // SHIELD: 添加护盾
  private applyShield(player: Player): void {
    player.addShield(600); // 10秒
    // Note: HUD will be updated by GameScene's emitHUD()
  }

  // BOMB: 摧毁所有敌人
  private applyBomb(): void {
    audioManager.playBomb();
    EventBus.emit('bomb-all-enemies');
  }

  // LIFE: 额外生命
  private applyLife(): void {
    audioManager.playOneUp();
    EventBus.emit('add-life');
  }

  // TIMER: 冻结敌人
  private applyTimer(): void {
    audioManager.playFreeze();
    this.frozen = true;
    this.freezeTimer = 600; // 10秒
    EventBus.emit('enemies-frozen', true);
  }

  // 解冻所有敌人
  private unfreezeAll(): void {
    this.frozen = false;
    EventBus.emit('enemies-frozen', false);
  }

  // 检查是否冻结
  isFrozen(): boolean {
    return this.frozen;
  }

  // 显示拾取提示
  private showPickupMessage(message: string): void {
    // 通过 EventBus 通知 UI 显示消息
    EventBus.emit('show-message', message);
  }

  // 清理所有道具
  clearAll(): void {
    this.powerUps.clear(true, true);
    this.frozen = false;
    this.freezeTimer = 0;
  }

  // 获取当前激活的道具数量
  getActiveCount(): number {
    return this.powerUps.countActive();
  }
}
