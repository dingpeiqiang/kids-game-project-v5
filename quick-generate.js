#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎮 植物大战僵尸 - 图片生成快速向导');
console.log('=' .repeat(60));

// 检查 bitart-generator 是否已构建
const bitartPath = path.join(__dirname, 'kids-game-frame-factory/bitart-generator/target/release/bitart.exe');
if (!fs.existsSync(bitartPath)) {
  console.log('❌ 找不到编译的 bitart-generator!');
  console.log('请先构建: cd kids-game-frame-factory/bitart-generator && cargo build --release');
  process.exit(1);
}

console.log('✅ 找到 bitart-generator');

// 导入生成器
const PixelArtGenerator = require('./pixel-art-generator.js');
const generator = new PixelArtGenerator();

console.log('\n🎯 快速选择:');
console.log('  1. 生成所有图片');
console.log('  2. 只生成植物');
console.log('  3. 只生成僵尸');
console.log('  4. 生成特定植物');
console.log('  5. 生成特定僵尸');
console.log('  0. 退出');

// 简单的交互式提示
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\n请选择 (0-5): ', async (answer) => {
  switch (answer.trim()) {
    case '1':
      console.log('\n🚀 开始生成所有图片...');
      await generator.generateAll();
      break;
      
    case '2':
      console.log('\n🌱 开始生成植物...');
      generator.generateAllPlants();
      break;
      
    case '3':
      console.log('\n🧟 开始生成僵尸...');
      generator.generateAllZombies();
      break;
      
    case '4':
      console.log('\n可用的植物: sunflower, peashooter, iceshooter, repeater, cherrybomb, potatomine, wallnut');
      rl.question('输入植物名称: ', (plantName) => {
        generator.generatePlant(plantName.trim());
        rl.close();
      });
      return;
      
    case '5':
      console.log('\n可用的僵尸: normal, conehead, buckethead, newspaper');
      rl.question('输入僵尸类型: ', (zombieType) => {
        generator.generateZombie(zombieType.trim());
        rl.close();
      });
      return;
      
    case '0':
      console.log('👋 再见!');
      break;
      
    default:
      console.log('❌ 无效选择');
  }
  
  rl.close();
});
