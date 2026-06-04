/// <reference path="../phaser.d.ts"/>

import Phaser from 'phaser';
import MainScene from "../scenes/mainScene";
import { soundManager } from "../utils/soundManager";

/**
 * 音效开关按钮
 * 允许玩家开启/关闭游戏音效
 */
export default class SoundToggleButton extends Phaser.GameObjects.Container {
    private isEnabled: boolean = true;
    private iconText: Phaser.GameObjects.Text;
    
    constructor(scene: MainScene) {
        super(scene, 0, 0);
        
        // 创建按钮背景
        const bg = new Phaser.GameObjects.Graphics(scene);
        const size = scene.r * 1.2;
        bg.fillStyle(0xffffff, 0.8);
        bg.fillRoundedRect(-size/2, -size/2, size, size, size * 0.2);
        bg.lineStyle(2, 0x2196F3, 0.8);
        bg.strokeRoundedRect(-size/2, -size/2, size, size, size * 0.2);
        
        // 创建音效图标（使用文字表示）
        this.iconText = new Phaser.GameObjects.Text(scene, 0, 0, "🔊", {
            fontSize: `${scene.r * 0.8}px`
        });
        
        this.add([bg, this.iconText]);
        
        // 定位到右下角（重置按钮旁边）
        this.setPosition(
            scene.game.canvas.width - scene.r * 6,
            scene.game.canvas.height - scene.r * 1.5
        );
        
        // 添加交互
        this.setSize(size, size);
        this.setInteractive({ useHandCursor: true });
        this.on('pointerdown', this.onClick, this);
        this.on('pointerover', this.onHover, this);
        this.on('pointerout', this.onOut, this);
    }
    
    private onClick(): void {
        this.isEnabled = !this.isEnabled;
        soundManager.setEnabled(this.isEnabled);
        
        // 更新图标
        this.iconText.setText(this.isEnabled ? "🔊" : "🔇");
        
        // 点击动画
        this.scene.tweens.add({
            targets: this,
            scaleX: 0.8,
            scaleY: 0.8,
            duration: 100,
            yoyo: true,
            ease: 'Cubic.easeOut'
        });
        
        // 播放点击音效（如果音效开启）
        if (this.isEnabled) {
            soundManager.playClick();
        }
    }
    
    private onHover(): void {
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 100,
            ease: 'Cubic.easeOut'
        });
    }
    
    private onOut(): void {
        this.scene.tweens.add({
            targets: this,
            scaleX: 1,
            scaleY: 1,
            duration: 100,
            ease: 'Cubic.easeOut'
        });
    }
}
