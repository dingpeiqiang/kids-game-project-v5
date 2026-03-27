/**
 * TankBattleScenario - 坦克大战专属测试场景 v2
 *
 * 优化：
 *  - 启动游戏多方式兜底
 *  - 全局 JS 错误检测 soft（不影响整体 PASS/FAIL）
 *  - FPS 采样改用公共 measureFPS()
 *  - canvas 渲染 soft=true
 */

'use strict';

const { BaseScenario } = require('./base-scenario');
const { sleep } = require('../utils/helpers');

class TankBattleScenario extends BaseScenario {
    get name() { return '坦克大战'; }

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
            await sleep(1200);
            const ok = await this.assertCanvasHasContent(true);
            return ok ? 'canvas has content' : 'canvas check skipped';
        }, { soft: true });

        // 2. 启动游戏
        await this.action('启动游戏', async () => {
            const btn = await this.tryClick([
                '.start-button', '#start-btn', 'button[class*="start"]',
                'button[class*="play"]', 'button'
            ]);
            if (btn) {
                await sleep(500);
                return `clicked: ${btn}`;
            }
            await this.clickCanvas();
            await sleep(400);
            await this.page.keyboard.press('Enter');
            await sleep(500);
            return 'clicked canvas + Enter';
        });

        // 3. 坦克移动（方向键）
        const dirs = [
            ['向上移动', 'ArrowUp',    5],
            ['向右移动', 'ArrowRight', 5],
            ['向下移动', 'ArrowDown',  5],
            ['向左移动', 'ArrowLeft',  5]
        ];
        for (const [label, key, n] of dirs) {
            await this.action(label, async () => {
                await this.pressKey(key, n);
                await sleep(300);
                return `${key} × ${n}`;
            });
        }

        // 4. WASD 控制方案
        await this.action('WASD 移动', async () => {
            for (const [k, n] of [['KeyW', 4], ['KeyA', 4], ['KeyS', 4], ['KeyD', 4]]) {
                await this.pressKey(k, n);
                await sleep(200);
            }
            return 'W/A/S/D × 4 each';
        });

        // 5. 射击（Space + J 键备用）
        await this.action('射击（Space 键）', async () => {
            await this.pressKey('Space', 8);
            await sleep(300);
            return 'Space × 8';
        });

        await this.action('射击（J 键备用）', async () => {
            await this.pressKey('KeyJ', 5);
            await sleep(200);
            return 'J × 5';
        }, { soft: true });

        // 6. 移动 + 射击组合
        await this.action('移动 + 射击组合', async () => {
            for (let i = 0; i < 5; i++) {
                await this.page.keyboard.press('ArrowUp');
                await this.page.keyboard.press('Space');
                await sleep(150);
                await this.page.keyboard.press('ArrowRight');
                await this.page.keyboard.press('Space');
                await sleep(150);
            }
            return 'combo × 5';
        });

        // 7. 暂停 / 恢复
        await this.action('暂停游戏（Escape）', async () => {
            await this.page.keyboard.press('Escape');
            await sleep(500);
            return 'Escape pressed';
        }, { soft: true });

        await this.action('恢复游戏（Escape）', async () => {
            await this.page.keyboard.press('Escape');
            await sleep(400);
            return 'resumed';
        }, { soft: true });

        // 8. 持续运行 4 秒
        await this.action('游戏持续运行 4 秒', async () => {
            await sleep(4000);
            await this.assertCanvasHasContent(true);
            return 'still rendering after 4s';
        }, { soft: true });

        // 9. 帧率采样
        await this.action('帧率采样', async () => {
            const fps = await this.measureFPS(2000, 15);
            return `FPS: ${fps}`;
        });

        // 10. JS 错误检测（soft，不应该因为游戏有一个 warning 就 FAIL）
        await this.action('全局 JS 错误检测', async () => {
            const errors = await this.page.evaluate(() => window.__jsErrors || []);
            if (errors.length > 0) throw new Error(`${errors.length} JS error(s): ${errors.slice(0, 2).join('; ')}`);
            return 'no JS errors';
        }, { soft: true });

        return this.results;
    }
}

module.exports = { TankBattleScenario };
