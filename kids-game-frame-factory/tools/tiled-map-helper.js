#!/usr/bin/env node

/**
 * Tiled 地图辅助工具
 * 用于验证、格式化和生成 Tiled 地图
 */

const fs = require('fs');
const path = require('path');

class TiledMapHelper {
  constructor() {
    this.mapsDir = path.join(__dirname, '../../kids-game-house/games/mario/src/assets/maps');
    this.templateMap = path.join(this.mapsDir, 'super-mario.json');
  }

  /**
   * 验证地图文件
   */
  validateMap(mapPath) {
    try {
      const content = fs.readFileSync(mapPath, 'utf8');
      const map = JSON.parse(content);
      
      const errors = [];
      const warnings = [];
      
      // 检查基本结构
      if (!map.height || map.height !== 15) {
        warnings.push('地图高度建议为 15 格');
      }
      
      if (!map.width || map.width < 100) {
        warnings.push('地图宽度建议至少 100 格');
      }
      
      if (!map.layers || !Array.isArray(map.layers)) {
        errors.push('缺少 layers 数组');
        return { valid: false, errors, warnings };
      }
      
      // 检查必需图层
      const layerNames = map.layers.map(l => l.name);
      const requiredLayers = ['world', 'modifiers', 'enemies'];
      
      requiredLayers.forEach(layer => {
        if (!layerNames.includes(layer)) {
          errors.push(`缺少必需图层: ${layer}`);
        }
      });
      
      // 检查 world 图层
      const worldLayer = map.layers.find(l => l.name === 'world');
      if (worldLayer) {
        if (worldLayer.type !== 'tilelayer') {
          errors.push('world 图层必须是 tilelayer 类型');
        }
        if (!worldLayer.data || !Array.isArray(worldLayer.data)) {
          errors.push('world 图层缺少 data 数据');
        }
      }
      
      // 检查 modifiers 图层
      const modifiersLayer = map.layers.find(l => l.name === 'modifiers');
      if (modifiersLayer) {
        if (modifiersLayer.type !== 'objectgroup') {
          errors.push('modifiers 图层必须是 objectgroup 类型');
        }
      }
      
      // 检查 enemies 图层
      const enemiesLayer = map.layers.find(l => l.name === 'enemies');
      if (enemiesLayer) {
        if (enemiesLayer.type !== 'objectgroup') {
          errors.push('enemies 图层必须是 objectgroup 类型');
        }
      }
      
      // 检查瓦片集
      if (!map.tilesets || !Array.isArray(map.tilesets)) {
        errors.push('缺少 tilesets 配置');
      }
      
      return {
        valid: errors.length === 0,
        errors,
        warnings,
        mapInfo: {
          width: map.width,
          height: map.height,
          layerCount: map.layers.length,
          enemiesCount: enemiesLayer?.objects?.length || 0,
          modifiersCount: modifiersLayer?.objects?.length || 0
        }
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`解析错误: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * 从模板创建基础地图
   */
  createFromTemplate(outputPath, options = {}) {
    try {
      const template = JSON.parse(fs.readFileSync(this.templateMap, 'utf8'));
      
      // 应用自定义选项
      if (options.width) template.width = options.width;
      if (options.name) template.properties = [{ name: 'mapProp', type: 'string', value: options.name }];
      
      // 清空 layers 数据，保留结构
      template.layers.forEach(layer => {
        if (layer.name === 'world') {
          // 重置 data 数组
          layer.data = new Array(template.width * template.height).fill(0);
          // 填充地面
          for (let y = template.height - 2; y < template.height; y++) {
            for (let x = 0; x < template.width; x++) {
              layer.data[y * template.width + x] = 1;
            }
          }
        }
        if (layer.name === 'modifiers' || layer.name === 'enemies') {
          layer.objects = [];
        }
      });
      
      // 更新 object id
      template.nextobjectid = 1;
      
      fs.writeFileSync(outputPath, JSON.stringify(template, null, 2));
      console.log(`✅ 已创建基础地图: ${outputPath}`);
      return true;
    } catch (error) {
      console.error(`❌ 创建地图失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 列出所有地图
   */
  listMaps() {
    const files = fs.readdirSync(this.mapsDir);
    const maps = files.filter(f => f.endsWith('.json'));
    
    console.log('\n📋 可用地图:');
    console.log('────────────────────────');
    
    maps.forEach((mapFile, index) => {
      const mapPath = path.join(this.mapsDir, mapFile);
      const result = this.validateMap(mapPath);
      
      const status = result.valid ? '✅' : '❌';
      console.log(`${status} ${mapFile}`);
      
      if (result.mapInfo) {
        console.log(`   尺寸: ${result.mapInfo.width}x${result.mapInfo.height}`);
        console.log(`   敌人: ${result.mapInfo.enemiesCount} 个`);
        console.log(`   道具: ${result.mapInfo.modifiersCount} 个`);
      }
      
      if (result.warnings.length > 0) {
        result.warnings.forEach(w => console.log(`   ⚠️ ${w}`));
      }
      
      if (result.errors.length > 0) {
        result.errors.forEach(e => console.log(`   ❌ ${e}`));
      }
      
      console.log('');
    });
  }

  /**
   * 格式化地图文件
   */
  formatMap(mapPath) {
    try {
      const content = fs.readFileSync(mapPath, 'utf8');
      const map = JSON.parse(content);
      fs.writeFileSync(mapPath, JSON.stringify(map, null, 2));
      console.log(`✅ 已格式化: ${mapPath}`);
      return true;
    } catch (error) {
      console.error(`❌ 格式化失败: ${error.message}`);
      return false;
    }
  }
}

// 命令行界面
const helper = new TiledMapHelper();
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'validate':
    if (args[1]) {
      const mapPath = path.isAbsolute(args[1]) ? args[1] : path.join(helper.mapsDir, args[1]);
      const result = helper.validateMap(mapPath);
      
      console.log(`\n🔍 验证结果: ${path.basename(mapPath)}`);
      console.log('────────────────────────');
      
      if (result.valid) {
        console.log('✅ 地图格式正确！');
      } else {
        console.log('❌ 地图存在错误:');
        result.errors.forEach(e => console.log(`   - ${e}`));
      }
      
      if (result.warnings.length > 0) {
        console.log('\n⚠️ 警告:');
        result.warnings.forEach(w => console.log(`   - ${w}`));
      }
      
      if (result.mapInfo) {
        console.log('\n📊 地图信息:');
        console.log(`   尺寸: ${result.mapInfo.width}x${result.mapInfo.height}`);
        console.log(`   图层数: ${result.mapInfo.layerCount}`);
        console.log(`   敌人: ${result.mapInfo.enemiesCount}`);
        console.log(`   道具: ${result.mapInfo.modifiersCount}`);
      }
      console.log('');
    } else {
      console.log('用法: node tiled-map-helper.js validate <map-file.json>');
    }
    break;

  case 'list':
    helper.listMaps();
    break;

  case 'create':
    const outputName = args[1] || 'new-level.json';
    const width = parseInt(args[2]) || 200;
    const outputPath = path.join(helper.mapsDir, outputName);
    helper.createFromTemplate(outputPath, { width, name: outputName.replace('.json', '') });
    break;

  case 'format':
    if (args[1]) {
      const mapPath = path.isAbsolute(args[1]) ? args[1] : path.join(helper.mapsDir, args[1]);
      helper.formatMap(mapPath);
    } else {
      console.log('用法: node tiled-map-helper.js format <map-file.json>');
    }
    break;

  default:
    console.log(`
🎮 Tiled 地图辅助工具

用法:
  node tiled-map-helper.js list                    - 列出所有地图
  node tiled-map-helper.js validate <map.json>    - 验证地图文件
  node tiled-map-helper.js create [name] [width]  - 创建基础地图
  node tiled-map-helper.js format <map.json>      - 格式化地图文件

示例:
  node tiled-map-helper.js list
  node tiled-map-helper.js validate super-mario.json
  node tiled-map-helper.js create level2.json 250
  node tiled-map-helper.js format level2.json
`);
}
