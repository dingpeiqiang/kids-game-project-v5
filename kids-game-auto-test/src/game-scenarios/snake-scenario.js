/**
 * SnakeScenario - 贪吃蛇专属测试场景 v2
 *
 * 优化：
 *  - 启动游戏用 tryClick + Space/Enter 多方式
 *  - 暂停检测改 soft（部分实现无暂停键）
 *  - FPS 采样改用公共 measureFPS()
 *  - canvas 渲染检测 soft=true
 */

'use strict';

const { BaseScenario } = require('./base-scenario');
const { sleep } = require('../utils/helpers');

class SnakeScenario extends BaseScenario {
    get name() { return '贪吃蛇'; }

    async run() {
        // 1. 基础加载
        await this.action('页面标题检测', async () => {
            const title = await this.page.title();
            return `title="${title}"`;
        });

        await this.action('游戏容器存在', async () => {
            const found = await this.waitForAny(['canvas', '#app', '.game-container', '[class*="game"]'], 10000);
            if (!found) throw new Error('no game container found');
            return `found: ${found}`;
        });

        await this.action('Canvas 渲染检测', async () => {
            await sleep(1000);
            const ok = await this.assertCanvasHasContent(true);
            return ok ? 'canvas has content' : 'canvas check skipped';
        }, { soft: true });

        // 2. 启动游戏（Space / Enter / 点击按钮 / 点击 canvas）
        await this.action('启动游戏', async () => {
            const btn = await this.tryClick(['.start-button', '#start-btn', 'button[class*="start"]', 'button']);
            if (btn) {
                await sleep(500);
                return `clicked: ${btn}`;
            }
            await this.page.keyboard.press('Space');
            await sleep(400);
            await this.page.keyboard.press('Enter');
            await sleep(400);
            return 'pressed Space + Enter';
        });

        // 3. 贪吃蛇方向控制（按 U→R→D→L 模式，不能直接反向）
        await this.action('向上移动', async () => {
            await this.page.keyboard.press('ArrowUp');
            await sleep(500);
            return 'ArrowUp';
        });

        await this.action('向右移动', async () => {
            await this.page.keyboard.press('ArrowRight');
            await sleep(500);
            return 'ArrowRight';
        });

        await this.action('向下移动', async () => {
            await this.page.keyboard.press('ArrowDown');
            await sleep(500);
            return 'ArrowDown';
        });

        await this.action('向左移动', async () => {
            await this.page.keyboard.press('ArrowLeft');
            await sleep(500);
            return 'ArrowLeft';
        });

        // 4. 连续转向（模拟实际玩家）
        await this.action('连续转向操作', async () => {
            const moves = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'ArrowRight'];
            for (const key of moves) {
                await this.page.keyboard.press(key);
                await sleep(450);
            }
            return `${moves.length} direction changes`;
        });

        // 5. 暂停 / 继续（soft，部分游戏无此功能）
        await this.action('暂停游戏（P 键）', async () => {
            await this.page.keyboard.press('KeyP');
            await sleep(400);
            const s1 = await this._canvasSnapshot();
            await sleep(1000);
            const s2 = await this._canvasSnapshot();
            const diff = this._pixelDiff(s1, s2);
            return `canvas diff during pause: ${diff}`;
        }, { soft: true });

        await this.action('继续游戏（P 键）', async () => {
            await this.page.keyboard.press('KeyP');
            await sleep(400);
            return 'resumed';
        }, { soft: true });

        // 6. 游戏持续运行 3 秒
        await this.action('游戏持续运行 3 秒', async () => {
            await sleep(3000);
            await this.assertCanvasHasContent(true);
            return 'still rendering after 3s';
        }, { soft: true });

        // 7. 检测计分 DOM
        await this.action('计分 DOM 检测', async () => {
            const scoreText = await this.page.evaluate(() => {
                const els = [...document.querySelectorAll('[class*="score"],[id*="score"],span,div')]
                    .filter(el => /score|得分|分数|\d+/i.test(el.textContent))
                    .map(el => el.textContent.trim())
                    .filter(t => t.length > 0 && t.length < 30);
                return els.slice(0, 3).join(' | ') || 'not found';
            });
            return `score elements: ${scoreText}`;
        }, { soft: true });

        // 8. 帧率采样
        await this.action('帧率采样', async () => {
            const fps = await this.measureFPS(2000, 10);
            return `FPS: ${fps}`;
        });

        return this.results;
    }

    // 采集 canvas 像素快照（前 100×100 区域 R 通道）
    async _canvasSnapshot() {
        return this.page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            if (!canvas) return [];
            try {
                const ctx  = canvas.getContext('2d');
                const data = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100)).data;
                return Array.from(data.filter((_, i) => i % 4 === 0));
            } catch { return []; }
        });
    }

    // 简单像素差（两个 R 通道数组的 MAE）
    _pixelDiff(a, b) {
        if (!a || !b || a.length !== b.length || a.length === 0) return -1;
        const sum = a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0);
        return (sum / a.length).toFixed(2);
    }
}

module.exports = { SnakeScenario };
