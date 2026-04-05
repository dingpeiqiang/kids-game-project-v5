/// <reference path="../phaser.d.ts"/>

import Phaser from 'phaser';
import MainScene from "../scenes/mainScene";

/**
 * 计分显示组件
 * 显示当前得分和移动次数
 */
export default class ScoreDisplay extends Phaser.GameObjects.Container {
    private scoreText: Phaser.GameObjects.Text;
    private movesText: Phaser.GameObjects.Text;
    
    constructor(scene: MainScene) {
        super(scene, 0, 0);
        
        // 分数文字
        this.scoreText = new Phaser.GameObjects.Text(scene, 0, 0, "分数: 0", {
            fontSize: `${scene.r * 0.8}px`,
            color: '#2196F3',
            fontStyle: 'bold'
        });
        
        // 移动次数文字
        this.movesText = new Phaser.GameObjects.Text(scene, 0, scene.r * 0.9, "步数: 0", {
            fontSize: `${scene.r * 0.6}px`,
            color: '#666666'
        });
        
        this.add([this.scoreText, this.movesText]);
        
        // 定位到右上角
        this.setPosition(scene.game.canvas.width - scene.r * 2, scene.r);
    }
    
    /**
     * 更新分数显示
     */
    public updateScore(score: number, moves: number): void {
        this.scoreText.setText(`分数: ${score}`);
        this.movesText.setText(`步数: ${moves}`);
        
        // 分数变化时添加动画效果
        if (score > 0) {
            this.scene.tweens.add({
                targets: this.scoreText,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 150,
                yoyo: true,
                ease: 'Cubic.easeOut'
            });
        }
    }
}
