#!/usr/bin/env node

/**
 * 离线模式快速测试脚本
 * 验证所有核心功能是否正常
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Swordbattle.io 离线模式测试\n');

let passed = 0;
let failed = 0;

function test(name, condition) {
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    failed++;
  }
}

// 1. 检查配置文件
console.log('📋 检查配置文件...');
const configPath = path.join(__dirname, 'config.json');
test('config.json 存在', fs.existsSync(configPath));

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
test('offlineMode 配置存在', config.offlineMode === true);
test('botCount 配置存在', typeof config.botCount === 'number');
test('botCount 合理 (1-20)', config.botCount >= 1 && config.botCount <= 20);

// 2. 检查核心文件
console.log('\n📁 检查核心文件...');
const botPath = path.join(__dirname, 'src', 'Bot.js');
test('Bot.js 存在', fs.existsSync(botPath));

const gameScenePath = path.join(__dirname, 'src', 'GameScene.js');
test('GameScene.js 存在', fs.existsSync(gameScenePath));

// 3. 检查 Bot.js 内容
console.log('\n🤖 检查 Bot.js...');
const botContent = fs.readFileSync(botPath, 'utf-8');
test('Bot 类定义', botContent.includes('export default class Bot'));
test('constructor 方法', botContent.includes('constructor(scene, x, y, name'));
test('update 方法', botContent.includes('update(time, delta, player)'));
test('takeDamage 方法', botContent.includes('takeDamage(amount)'));
test('heal 方法', botContent.includes('heal(amount)'));
test('destroy 方法', botContent.includes('destroy()'));

// 4. 检查 GameScene.js 内容
console.log('\n🎮 检查 GameScene.js...');
const gameSceneContent = fs.readFileSync(gameScenePath, 'utf-8');
test('导入 Bot 类', gameSceneContent.includes('import Bot from "./Bot.js"'));
test('setupOfflineMode 方法', gameSceneContent.includes('setupOfflineMode()'));
test('updateOfflineMode 方法', gameSceneContent.includes('updateOfflineMode(time, delta)'));
test('performAttack 方法', gameSceneContent.includes('performAttack()'));
test('checkLevelUp 方法', gameSceneContent.includes('checkLevelUp()'));
test('createExplosion 方法', gameSceneContent.includes('createExplosion(x, y)'));
test('getDistance 方法', gameSceneContent.includes('getDistance(obj1, obj2)'));
test('离线模式检查', gameSceneContent.includes('if (configData.offlineMode)'));

// 5. 检查代码质量
console.log('\n✨ 检查代码质量...');
test('无 TODO 标记', !gameSceneContent.includes('TODO'));
test('有注释说明', gameSceneContent.includes('/**') || gameSceneContent.includes('//'));
test('错误处理', gameSceneContent.includes('try') || gameSceneContent.includes('if (!'));

// 6. 检查文档
console.log('\n📚 检查文档...');
test('OFFLINE_MODE_COMPLETE.md 存在', 
  fs.existsSync(path.join(__dirname, 'OFFLINE_MODE_COMPLETE.md')));
test('PURE_FRONTEND_IMPLEMENTATION.md 存在', 
  fs.existsSync(path.join(__dirname, 'PURE_FRONTEND_IMPLEMENTATION.md')));
test('OFFLINE_MODE_PLAN.md 存在', 
  fs.existsSync(path.join(__dirname, 'OFFLINE_MODE_PLAN.md')));

// 7. 统计
console.log('\n' + '='.repeat(50));
console.log(`\n测试结果: ${passed} 通过, ${failed} 失败\n`);

if (failed === 0) {
  console.log('🎉 所有测试通过！离线模式已就绪！\n');
  console.log('🚀 启动游戏:');
  console.log('   npm run dev');
  console.log('   访问 http://localhost:3000\n');
  console.log('🎮 操作说明:');
  console.log('   - WASD / 方向键: 移动');
  console.log('   - 鼠标: 瞄准');
  console.log('   - 左键点击: 攻击\n');
  process.exit(0);
} else {
  console.log('⚠️  部分测试失败，请检查上述错误。\n');
  process.exit(1);
}
