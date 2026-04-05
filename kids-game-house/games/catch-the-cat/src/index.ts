/// <reference path="./phaser.d.ts"/>

import Phaser from 'phaser';
import CatchTheCatGame from "./game";

// 导出到全局
declare global {
    interface Window {
        game: CatchTheCatGame;
        CatchTheCatGame: typeof CatchTheCatGame;
    }
}

(window as any).CatchTheCatGame = CatchTheCatGame;

// Vite 开发模式：自动初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    console.log('[CatchTheCat] Initializing game...');
    console.log('[CatchTheCat] Phaser version:', (window as any).Phaser?.VERSION);
    console.log('[CatchTheCat] DOM loaded, looking for container...');
    
    const container = document.getElementById('catch-the-cat');
    console.log('[CatchTheCat] Container element:', container);
    console.log('[CatchTheCat] Container innerHTML:', container?.innerHTML || 'N/A');
    
    if (container) {
        try {
            console.log('[CatchTheCat] Creating game instance...');
            window.game = new CatchTheCatGame({
                w: 11,
                h: 11,
                r: 20,
                difficulty: 'normal',
                parent: container,
                statusBarAlign: 'center',
                backgroundColor: 0xeeeeee
            });
            console.log('[CatchTheCat] Game created successfully');
            console.log('[CatchTheCat] Game canvas:', window.game?.canvas);
            console.log('[CatchTheCat] Game textures:', window.game?.textures);
            console.log('[CatchTheCat] Container children after game:', container.children.length);
            
            // 检查 canvas 是否被添加
            if (window.game?.canvas) {
                console.log('[CatchTheCat] Canvas dimensions:', window.game.canvas.width, 'x', window.game.canvas.height);
                console.log('[CatchTheCat] Canvas style:', window.game.canvas.style.cssText);
            }
        } catch (error) {
            console.error('[CatchTheCat] Error creating game:', error);
        }
    } else {
        console.error('[CatchTheCat] Container element not found!');
    }
});

