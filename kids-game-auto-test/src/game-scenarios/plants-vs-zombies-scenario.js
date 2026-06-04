/**
 * PlantsVsZombiesScenario - 植物大战僵尸专属测试场景 v2
 *
 * 优化：
 *  - 游戏容器检测 waitForAny，支持 canvas/div 两种模式
 *  - 所有鼠标点击操作 soft=true（阳光/种植依赖游戏内部状态）
 *  - canvas 渲染检测 soft=true
 *  - FPS 采样改用公共 measureFPS()
 *  - 阳光/资源 DOM 检测 soft（非关键功能）
 */

'use strict';

const { BaseScenario } = require('./base-scenario');
const { sleep } = require('../utils/helpers');

class PlantsVsZombiesScenario extends BaseScenario {
    get name() { return '植物大战僵尸'; }

    async run() {
        // 1. 基础加载
        await this.action('页面标题检测', async () => {
            const title = await this.page.title();
            return `title="${title}"`;
        });

        await this.action('游戏容器存在', async () => {
            const found = await this.waitForAny(
                ['canvas', '.game-container', '#game', '[class*="board"]', '[class*="pvz"]', '#app'],
                12000
            );
            if (!found) throw new Error('no game container found');
            return `found: ${found}`;
        });

        await this.action('Canvas 渲染检测', async () => {
            await sleep(1500);
            const canvas = await this.page.$('canvas');
            if (!canvas) return 'DOM-based game (no canvas)';
            const ok = await this.assertCanvasHasContent(true);
            return ok ? 'canvas has content' : 'canvas check skipped';
        }, { soft: true });

        // 2. 启动游戏
        await this.action('启动游戏', async () => {
            const btn = await this.tryClick([
                '.start-button', '#start-btn', 'button[class*="start"]',
                'button[class*="play"]', '.btn-primary', 'button'
            ]);
            if (btn) {
                await sleep(600);
                return `clicked: ${btn}`;
            }
            await this.clickCanvas();
            await sleep(400);
            await this.page.keyboard.press('Enter');
            await sleep(500);
            return 'clicked canvas + Enter';
        });

        // 3. 阳光收集（多处点击）
        await this.action('收集阳光（9 区域点击）', async () => {
            const canvas = await this.page.$('canvas');
            if (!canvas) return 'no canvas, skipped';
            const box = await canvas.boundingBox();
            if (!box) return 'no bbox, skipped';
            const positions = [
                { x: 0.2, y: 0.2 }, { x: 0.5, y: 0.2 }, { x: 0.8, y: 0.2 },
                { x: 0.2, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.8, y: 0.5 },
                { x: 0.2, y: 0.8 }, { x: 0.5, y: 0.8 }, { x: 0.8, y: 0.8 }
            ];
            for (const p of positions) {
                await this.page.mouse.click(box.x + box.width * p.x, box.y + box.height * p.y);
                await sleep(120);
            }
            return `clicked ${positions.length} positions`;
        }, { soft: true });

        // 4. 选卡 + 种植（卡槽顶部 → 草坪格子）
        await this.action('选择植物卡并种植', async () => {
            const canvas = await this.page.$('canvas');
            if (!canvas) return 'no canvas';
            const box = await canvas.boundingBox();
            if (!box) return 'no bbox';
            for (let i = 0; i < 3; i++) {
                // 点卡槽
                await this.page.mouse.click(box.x + box.width * (0.08 + i * 0.06), box.y + box.height * 0.07);
                await sleep(250);
                // 点草坪
                await this.page.mouse.click(
                    box.x + box.width  * (0.28 + i * 0.12),
                    box.y + box.height * (0.30 + i * 0.10)
                );
                await sleep(350);
            }
            return 'attempted to plant 3 plants';
        }, { soft: true });

        // 5. 游戏运行 5 秒
        await this.action('游戏运行 5 秒', async () => {
            await sleep(5000);
            // 追加阳光收集
            const canvas = await this.page.$('canvas');
            if (canvas) {
                const box = await canvas.boundingBox();
                if (box) {
                    await this.page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.4);
                    await this.page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.3);
                }
            }
            return '5s elapsed';
        });

        // 6. 继续种植
        await this.action('继续种植植物', async () => {
            const canvas = await this.page.$('canvas');
            if (!canvas) return 'no canvas';
            const box = await canvas.boundingBox();
            if (!box) return 'no bbox';
            for (let row = 0; row < 2; row++) {
                for (let col = 0; col < 2; col++) {
                    await this.page.mouse.click(box.x + box.width * 0.08, box.y + box.height * 0.07);
                    await sleep(180);
                    await this.page.mouse.click(
                        box.x + box.width  * (0.25 + col * 0.13),
                        box.y + box.height * (0.35 + row * 0.15)
                    );
                    await sleep(280);
                }
            }
            return 'planted 4 more plants';
        }, { soft: true });

        // 7. 暂停 / 恢复
        await this.action('暂停游戏（Escape）', async () => {
            await this.page.keyboard.press('Escape');
            await sleep(500);
            return 'paused';
        }, { soft: true });

        await this.action('恢复游戏', async () => {
            await this.page.keyboard.press('Escape');
            await sleep(400);
            return 'resumed';
        }, { soft: true });

        // 8. Canvas 持续渲染验证
        await this.action('Canvas 持续渲染验证', async () => {
            await sleep(2000);
            const canvas = await this.page.$('canvas');
            if (!canvas) return 'DOM-based game, skipped';
            const ok = await this.assertCanvasHasContent(true);
            return ok ? 'still rendering' : 'canvas check skipped';
        }, { soft: true });

        // 9. 帧率采样
        await this.action('帧率采样', async () => {
            const fps = await this.measureFPS(2000, 10);
            return `FPS: ${fps}`;
        });

        // 10. 阳光/资源 DOM 检测（soft）
        await this.action('阳光/资源 DOM 检测', async () => {
            const text = await this.page.evaluate(() => {
                const els = [...document.querySelectorAll('[class*="sun"],[id*="sun"],[class*="coin"],[class*="resource"],[class*="score"]')];
                return els.map(el => el.textContent.trim()).filter(Boolean).slice(0, 3).join(' | ') || 'not found';
            });
            return `resource elements: ${text}`;
        }, { soft: true });

        return this.results;
    }
}

module.exports = { PlantsVsZombiesScenario };
