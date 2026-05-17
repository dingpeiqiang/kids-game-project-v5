#!/usr/bin/env node

/**
 * Flappy Bird 屏幕自适应功能测试脚本
 * 
 * 使用方法：
 * node test-adaptation.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 10002;
const BASE_URL = `http://localhost:${PORT}`;

console.log('🧪 Flappy Bird 屏幕自适应功能测试\n');
console.log('=' .repeat(60));

// 检查项
const checks = [
    {
        name: 'Vite 开发服务器',
        test: () => checkServerRunning(),
        description: '检查 Vite 服务器是否在运行'
    },
    {
        name: 'index.html 结构',
        test: () => checkHTMLStructure(),
        description: '验证游戏容器和全屏按钮存在'
    },
    {
        name: 'Phaser 缩放配置',
        test: () => checkPhaserConfig(),
        description: '验证 FIT 模式和自动居中配置'
    },
    {
        name: 'CSS 响应式样式',
        test: () => checkCSSStyles(),
        description: '验证视口单位和 Flexbox 布局'
    },
    {
        name: '全屏功能代码',
        test: () => checkFullscreenCode(),
        description: '验证全屏 API 调用和事件监听'
    }
];

let passed = 0;
let failed = 0;

async function runTests() {
    for (const check of checks) {
        process.stdout.write(`\n📋 ${check.name}... `);
        try {
            const result = await check.test();
            if (result) {
                console.log('✅ 通过');
                console.log(`   ${check.description}`);
                passed++;
            } else {
                console.log('❌ 失败');
                console.log(`   ${check.description}`);
                failed++;
            }
        } catch (error) {
            console.log('❌ 错误');
            console.log(`   ${error.message}`);
            failed++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n测试结果: ${passed} 通过, ${failed} 失败\n`);

    if (failed === 0) {
        console.log('🎉 所有测试通过！游戏已优化完成。\n');
        console.log('📱 测试建议：');
        console.log('   1. 在浏览器中访问:', BASE_URL);
        console.log('   2. 调整浏览器窗口大小，观察游戏自适应效果');
        console.log('   3. 点击右上角 ⛶ 按钮测试全屏功能');
        console.log('   4. 使用浏览器开发者工具的设备模式测试移动端');
        console.log('   5. 按 F11 测试浏览器原生全屏\n');
    } else {
        console.log('⚠️  部分测试失败，请检查上述错误信息。\n');
    }

    process.exit(failed > 0 ? 1 : 0);
}

// 测试函数
async function checkServerRunning() {
    return new Promise((resolve) => {
        http.get(BASE_URL, (res) => {
            resolve(res.statusCode === 200);
        }).on('error', () => {
            resolve(false);
        });
    });
}

function checkHTMLStructure() {
    const htmlPath = path.join(__dirname, 'index.html');
    const content = fs.readFileSync(htmlPath, 'utf-8');
    
    const hasGameContainer = content.includes('id="game-container"');
    const hasFullscreenBtn = content.includes('id="fullscreen-btn"');
    const hasViewportMeta = content.includes('viewport');
    
    return hasGameContainer && hasFullscreenBtn && hasViewportMeta;
}

function checkPhaserConfig() {
    const gameJsPath = path.join(__dirname, 'js', 'game.js');
    const content = fs.readFileSync(gameJsPath, 'utf-8');
    
    const hasFitMode = content.includes('Phaser.Scale.FIT');
    const hasAutoCenter = content.includes('Phaser.Scale.CENTER_BOTH');
    const hasParent = content.includes("parent: 'game-container'");
    const hasImport = content.includes("import Phaser from 'phaser'");
    
    return hasFitMode && hasAutoCenter && hasParent && hasImport;
}

function checkCSSStyles() {
    const htmlPath = path.join(__dirname, 'index.html');
    const content = fs.readFileSync(htmlPath, 'utf-8');
    
    const hasViewportWidth = content.includes('100vw');
    const hasViewportHeight = content.includes('100vh');
    const hasFlexbox = content.includes('display: flex');
    const hasOverflowHidden = content.includes('overflow: hidden');
    
    return hasViewportWidth && hasViewportHeight && hasFlexbox && hasOverflowHidden;
}

function checkFullscreenCode() {
    const htmlPath = path.join(__dirname, 'index.html');
    const content = fs.readFileSync(htmlPath, 'utf-8');
    
    const hasRequestFullscreen = content.includes('requestFullscreen');
    const hasExitFullscreen = content.includes('exitFullscreen');
    const hasEventListener = content.includes('fullscreenchange');
    const hasToggleLogic = content.includes('fullscreenElement');
    
    return hasRequestFullscreen && hasExitFullscreen && hasEventListener && hasToggleLogic;
}

// 运行测试
runTests().catch(console.error);
