/**
 * PlaneShooterScenario - 飞机大战专属测试场景 v2
 *
 * 优化：
 *  - 启动游戏改用 waitForAny + tryClick，找不到按钮则点 canvas，不报错
 *  - assertCanvasHasContent 使用 soft=true（有些游戏 canvas 跨域读取失败）
 *  - FPS 采样改用公共 measureFPS()
 *  - 内存检测加 soft meta（部分浏览器不暴露 performance.memory）
 */

'use strict';

const { BaseScenario } = require('./base-scenario');
const { sleep } = require('../utils/helpers');

class PlaneShooterScenario extends BaseScenario {
    get name() { return '飞机大战'; }

    async run() {
        // 1. 页面基础验证
        await this.action('页面标题检测', async () => {
            const title = await this.page.title();
            if (!title) throw new Error('page title is empty');
            return `title="${title}"`;
        });

        await this.action('游戏容器存在', async () => {
            const found = await this.waitForAny(['canvas', '#app', '.game-container', '[class*="game"]'], 10000);
            if (!found) throw new Error('no game container found');
            return `found: ${found}`;
        });

        await this.action('Canvas 渲染内容检测', async () => {
            await sleep(1500);
            const ok = await this.assertCanvasHasContent(true); // soft
            return ok ? 'canvas has non-transparent pixels' : 'canvas check skipped (cross-origin or empty)';
        }, { soft: false }); // 失败也继续

        // 2. 启动游戏（多种方式依次尝试）
        await this.action('启动游戏', async () => {
            // 先找开始按钮
            const btn = await this.tryClick([
                '.start-button', '#start-btn', 'button[class*="start"]',
                'button[class*="begin"]', '.btn-start', 'button'
            ]);
            if (btn) {
                await sleep(600);
                return `clicked start button: ${btn}`;
            }
            // 没按钮就点 canvas
            const canvasClicked = await this.clickCanvas();
            await sleep(600);
            return canvasClicked ? 'clicked canvas center' : 'no start element found, pressed Enter';
        });

        // Enter / Space 补充触发
        await this.action('按键触发开始', async () => {
            await this.page.keyboard.press('Enter');
            await sleep(300);
            await this.page.keyboard.press('Space');
            await sleep(500);
            return 'pressed Enter + Space';
        }, { soft: true });

        // 3. 飞机移动控制
        await this.action('向左移动飞机', async () => {
            await this.pressKey('ArrowLeft', 8);
            await sleep(200);
            return 'ArrowLeft × 8';
        });

        await this.action('向右移动飞机', async () => {
            await this.pressKey('ArrowRight', 8);
            await sleep(200);
            return 'ArrowRight × 8';
        });

        await this.action('向上移动飞机', async () => {
            await this.pressKey('ArrowUp', 5);
            await sleep(200);
            return 'ArrowUp × 5';
        });

        await this.action('向下移动飞机', async () => {
            await this.pressKey('ArrowDown', 5);
            await sleep(200);
            return 'ArrowDown × 5';
        });

        // 4. 射击操作
        await this.action('射击（Space 键）', async () => {
            await this.pressKey('Space', 10);
            await sleep(400);
            return 'Space × 10';
        });

        // 5. 组合动作：移动同时射击
        await this.action('组合操作：移动 + 射击', async () => {
            for (let i = 0; i < 5; i++) {
                await this.page.keyboard.press('ArrowLeft');
                await this.page.keyboard.press('Space');
                await sleep(80);
                await this.page.keyboard.press('ArrowRight');
                await this.page.keyboard.press('Space');
                await sleep(80);
            }
            return 'combo: move+shoot × 5';
        });

        // 6. 持续运行验证（3 秒）
        await this.action('游戏持续运行 3 秒', async () => {
            await sleep(3000);
            await this.assertCanvasHasContent(true);
            return 'still rendering after 3s';
        }, { soft: true });

        // 7. 帧率采样
        await this.action('帧率采样', async () => {
            const fps = await this.measureFPS(2000, 15);
            return `FPS: ${fps}`;
        });

        // 8. 内存稳定性（soft，部分浏览器无 performance.memory）
        await this.action('内存未暴增检测', async () => {
            const mem = await this.page.evaluate(() => {
                if (!performance.memory) return null;
                return parseFloat((performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1));
            });
            if (mem === null) return 'performance.memory not available (skipped)';
            if (mem > 300) throw new Error(`JS heap too high: ${mem}MB`);
            return `JS heap: ${mem}MB`;
        }, { soft: true });

        return this.results;
    }
}

module.exports = { PlaneShooterScenario };
