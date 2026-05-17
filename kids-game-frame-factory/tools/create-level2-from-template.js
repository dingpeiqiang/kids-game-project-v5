#!/usr/bin/env node

/**
 * 从模板创建 level2.json
 */

const fs = require('fs');
const path = require('path');

const mapsDir = path.join(__dirname, '../../kids-game-house/games/mario/src/assets/maps');
const templatePath = path.join(mapsDir, 'super-mario.json');
const level2Path = path.join(mapsDir, 'level2.json');

try {
  // 读取原地图
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  
  // 复制一份
  const level2 = JSON.parse(JSON.stringify(template));
  
  // 修改一些内容使其成为新关卡
  // 这里可以做一些调整，比如：
  // - 修改地图宽度
  // - 调整敌人位置
  // - 修改道具位置
  
  // 更新 map properties
  if (level2.properties) {
    level2.properties = level2.properties.map(p => {
      if (p.name === 'mapProp') {
        return { ...p, value: 'level2' };
      }
      return p;
    });
  }
  
  // 保存
  fs.writeFileSync(level2Path, JSON.stringify(level2, null, 2));
  
  console.log('✅ level2.json 已从模板创建！');
  console.log('   - 这是 super-mario.json 的副本');
  console.log('   - 可以在 Tiled 编辑器中打开并修改');
  
} catch (error) {
  console.error('❌ 创建失败:', error.message);
  process.exit(1);
}
