#!/usr/bin/env node

/**
 * 修复 level2.json 的 tileset 配置
 */

const fs = require('fs');
const path = require('path');

const mapsDir = path.join(__dirname, '../../kids-game-house/games/mario/src/assets/maps');
const level2Path = path.join(mapsDir, 'level2.json');
const templatePath = path.join(mapsDir, 'super-mario.json');

try {
  // 读取两个文件
  const level2 = JSON.parse(fs.readFileSync(level2Path, 'utf8'));
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

  // 替换 tilesets
  level2.tilesets = template.tilesets;

  // 添加 properties 到 world 层（参考原地图）
  const worldLayer = level2.layers.find(l => l.name === 'world');
  if (worldLayer) {
    worldLayer.properties = [
      { name: 'time', type: 'string', value: '1000' }
    ];
  }

  // 修复 modifiers 和 enemies 图层的 visible 属性（原地图是 false）
  const modifiersLayer = level2.layers.find(l => l.name === 'modifiers');
  if (modifiersLayer) {
    modifiersLayer.visible = false;
  }

  const enemiesLayer = level2.layers.find(l => l.name === 'enemies');
  if (enemiesLayer) {
    enemiesLayer.visible = false;
  }

  // 添加 map properties
  level2.properties = [
    { name: 'mapProp', type: 'string', value: 'level2' }
  ];

  // 更新 tiledversion 和 version
  level2.tiledversion = '1.4.3';
  level2.version = 1.4;

  // 添加 nextlayerid
  level2.nextlayerid = 4;

  // 保存
  fs.writeFileSync(level2Path, JSON.stringify(level2, null, 2));

  console.log('✅ level2.json 已修复！');
  console.log('   - tilesets 配置已更新');
  console.log('   - 图层属性已修复');
  console.log('   - 版本信息已同步');

} catch (error) {
  console.error('❌ 修复失败:', error.message);
  process.exit(1);
}
