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
    console.log('[CatchTheCat] Phaser version:', Phaser.VERSION);
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
            console.log('[CatchTheCat] Game object:', window.game);
            console.log('[CatchTheCat] Game canvas:', window.game?.canvas);
            console.log('[CatchTheCat] Game textures:', window.game?.textures);
            console.log('[CatchTheCat] Container children after game:', container.children.length);
            console.log('[CatchTheCat] Container HTML after game:', container.innerHTML.substring(0, 200));
            
            // 检查 canvas 是否被添加
            if (window.game?.canvas) {
                console.log('[CatchTheCat] Canvas dimensions:', window.game.canvas.width, 'x', window.game.canvas.height);
                console.log('[CatchTheCat] Canvas style:', window.game.canvas.style.cssText);
                console.log('[CatchTheCat] Canvas parent:', window.game.canvas.parentElement);
                console.log('[CatchTheCat] Canvas in DOM:', document.body.contains(window.game.canvas));
            } else {
                console.error('[CatchTheCat] ERROR: Canvas is null or undefined!');
            }
            
            // 监听游戏就绪事件
            window.game.events.on('ready', () => {
                console.log('[CatchTheCat] Game is ready!');
            });
            
            window.game.events.on('postrender', () => {
                console.log('[CatchTheCat] Post-render event fired');
            });
        } catch (error) {
            console.error('[CatchTheCat] Error creating game:', error);
            console.error('[CatchTheCat] Error stack:', (error as Error).stack);
        }
    } else {
        console.error('[CatchTheCat] Container element not found!');
    }
});

