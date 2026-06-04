/// <reference path="../phaser.d.ts"/>

import Phaser from 'phaser';
import MainScene from "../scenes/mainScene";

export default class Block extends Phaser.GameObjects.Arc {
    public readonly i: number;
    public readonly j: number;
    public readonly r: number;
    protected scene: MainScene;

    constructor(scene: MainScene, i: number, j: number, r: number) {
        let position = scene.getPosition(i, j);
        super(scene, position.x, position.y, r, 0, 360, false, 0, 1);
        this.i = i;
        this.j = j;
        this.r = r;
        this.isWall = false;

        let shape = new Phaser.Geom.Circle(this.r / 2, this.r / 2, this.r);
        this.setInteractive(shape, Phaser.Geom.Circle.Contains);
        this.on("pointerdown", () => {
            this.emit("player_click", this.i, this.j);
        });
        
        // 添加悬停效果
        this.on("pointerover", this.onHover, this);
        this.on("pointerout", this.onOut, this);
    }

    private _isWall: boolean;

    get isWall(): boolean {
        return this._isWall;
    }

    set isWall(value: boolean) {
        this._isWall = value;
        if (value) {
            this.fillColor = 0x003366;
            // 墙壁放置动画
            this.playPlaceAnimation();
        } else {
            this.fillColor = 0xb3d9ff;
        }
    }
    
    /**
     * 悬停效果
     */
    private onHover(): void {
        if (this._isWall) return;
        
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 100,
            ease: 'Cubic.easeOut'
        });
        
        // 改变颜色提示
        this.fillColor = 0x66ccff;
    }
    
    /**
     * 离开悬停效果
     */
    private onOut(): void {
        if (this._isWall) return;
        
        this.scene.tweens.add({
            targets: this,
            scaleX: 1,
            scaleY: 1,
            duration: 100,
            ease: 'Cubic.easeOut'
        });
        
        // 恢复原色
        this.fillColor = 0xb3d9ff;
    }
    
    /**
     * 墙壁放置动画
     */
    private playPlaceAnimation(): void {
        // 缩放弹跳效果
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 100,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: this,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 150,
                    ease: 'Bounce.easeOut'
                });
            }
        });
        
        // 颜色闪烁效果 - 使用 setTimeout 替代 delayedCall
        const originalColor = this.fillColor;
        this.fillColor = 0xffffff;
        setTimeout(() => {
            this.fillColor = originalColor;
        }, 50);
    }
}
