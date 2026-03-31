#!/usr/bin/env node
/**
 * 🎨 智能资源生成工具 v1.0
 * 
 * 提供游戏开发资源的智能生成和管理功能：
 * 1. 🖼️ 图像占位符生成
 * 2. 🎵 音频占位符生成
 * 3. 📁 资源目录结构创建
 * 4. 🔄 GTRS配置自动更新
 * 5. 📊 资源分析和优化建议
 * 
 * 使用方法:
 * 1. node resource-generator.js init <game-id>   初始化资源目录结构
 * 2. node resource-generator.js placeholder <dir> 生成占位资源
 * 3. node resource-generator.js validate <dir>    验证资源完整性
 * 4. node resource-generator.js optimize <dir>    资源优化建议
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // 图像处理
const { execSync } = require('child_process');
const crypto = require('crypto');

// 检查sharp是否可用
let sharpAvailable = false;
try {
  require('sharp');
  sharpAvailable = true;
} catch (error) {
  console.warn('⚠️ sharp未安装，部分图像生成功能受限');
  console.warn('  安装: npm install sharp');
}

class ResourceGenerator {
  constructor() {
    this.supportedFormats = {
      images: ['png', 'jpg', 'webp'],
      audio: ['mp3', 'wav', 'ogg']
    };
    this.defaultColors = {
      casual: { primary: '#FF6B6B', secondary: '#4ECDC4' },
      action: { primary: '#FFA500', secondary: '#FF4500' },
      educational: { primary: '#3CB371', secondary: '#FFD700' },
      custom: { primary: '#4ECDC4', secondary: '#FF6B6B' }
    };
  }

  /**
   * 初始化游戏资源目录结构
   */
  async initResourceStructure(gameId, gameType = 'custom') {
    console.log(`🎨 初始化资源目录结构: ${gameId} (${gameType})`);
    
    const themeId = `${gameId}_default`;
    const themeDir = path.join(process.cwd(), 'public', 'themes', themeId);
    const assetsDir = path.join(themeDir, 'assets');
    
    // 创建标准目录结构
    const structure = {
      [assetsDir]: {
        scene: ['background.png', 'tile_pattern.png'],
        ui: ['button_start.png', 'button_exit.png', 'panel_bg.png'],
        icon: ['icon_correct.png', 'icon_wrong.png', 'icon_star.png'],
        effect: ['particle.png', 'explosion.png'],
        audio: {
          bgm: ['bgm_main.mp3'],
          effect: ['sfx_click.mp3', 'sfx_complete.mp3'],
          voice: ['voice_hint.mp3']
        }
      },
      [path.join(themeDir, 'thumbnails')]: [],
      [path.join(themeDir, 'previews')]: []
    };

    // 递归创建目录和占位文件
    this.createStructure(structure, '');
    
    // 创建.keep文件确保目录被git跟踪
    this.createKeepFiles(themeDir);
    
    // 根据游戏类型调整
    this.adjustStructureForType(themeDir, gameType);
    
    // 生成初始资源
    await this.generatePlaceholderResources(themeDir, gameId, gameType);
    
    console.log(`✅ 资源目录结构已创建: ${themeDir}`);
    return { themeId, themeDir, assetsDir };
  }

  /**
   * 根据游戏类型调整目录结构
   */
  adjustStructureForType(themeDir, gameType) {
    const assetsDir = path.join(themeDir, 'assets');
    
    // 不同类型的特定资源目录
    switch (gameType) {
      case 'casual':
        // 休闲游戏需要更多UI和场景元素
        fs.mkdirSync(path.join(assetsDir, 'scene', 'decorations'), { recursive: true });
        fs.mkdirSync(path.join(assetsDir, 'ui', 'popup'), { recursive: true });
        break;
      case 'action':
        // 动作游戏需要更多特效和动画
        fs.mkdirSync(path.join(assetsDir, 'effect', 'explosions'), { recursive: true });
        fs.mkdirSync(path.join(assetsDir, 'effect', 'trails'), { recursive: true });
        fs.mkdirSync(path.join(assetsDir, 'scene', 'obstacles'), { recursive: true });
        break;
      case 'educational':
        // 教育游戏需要更多图标和音效
        fs.mkdirSync(path.join(assetsDir, 'icon', 'numbers'), { recursive: true });
        fs.mkdirSync(path.join(assetsDir, 'icon', 'letters'), { recursive: true });
        fs.mkdirSync(path.join(assetsDir, 'audio', 'voice', 'feedback'), { recursive: true });
        break;
    }
  }

  /**
   * 生成占位资源
   */
  async generatePlaceholderResources(themeDir, gameId, gameType = 'custom') {
    console.log(`🎨 为 ${gameId} 生成占位资源...`);
    
    const colors = this.defaultColors[gameType] || this.defaultColors.custom;
    const assetsDir = path.join(themeDir, 'assets');
    
    // 生成场景资源
    await this.generateImages(assetsDir, 'scene', colors, gameType);
    
    // 生成UI资源
    await this.generateImages(assetsDir, 'ui', colors, gameType);
    
    // 生成图标资源
    await this.generateImages(assetsDir, 'icon', colors, gameType);
    
    // 生成特效资源
    await this.generateImages(assetsDir, 'effect', colors, gameType);
    
    // 生成音频占位资源（使用占位音频或生成简单音效）
    this.generateAudioPlaceholders(assetsDir);
    
    console.log(`✅ 占位资源生成完成，检查: ${themeDir}`);
  }

  /**
   * 生成图像占位资源
   */
  async generateImages(assetsDir, category, colors, gameType) {
    const imageDefs = this.getImageDefinitions(category, gameType);
    const categoryDir = path.join(assetsDir, category);
    
    if (!fs.existsSync(categoryDir)) {
      console.log(`⚠️ 目录不存在: ${categoryDir}`);
      return;
    }
    
    for (const image of imageDefs) {
      const outputPath = path.join(categoryDir, image.filename);
      
      // 如果文件已存在，跳过
      if (fs.existsSync(outputPath)) {
        continue;
      }
      
      // 生成图像
      await this.createPlaceholderImage(
        outputPath,
        image.width,
        image.height,
        colors.primary,
        colors.secondary,
        image.name
      );
      
      console.log(`   ✅ ${category}/${image.filename} (${image.width}x${image.height})`);
    }
  }

  /**
   * 获取图像定义
   */
  getImageDefinitions(category, gameType) {
    const baseImages = {
      scene: [
        { name: '背景', filename: 'bg_main.png', width: 720, height: 1280 },
        { name: '游戏区域', filename: 'game_area.png', width: 640, height: 960 }
      ],
      ui: [
        { name: '开始按钮', filename: 'button_start.png', width: 256, height: 96 },
        { name: '退出按钮', filename: 'button_exit.png', width: 256, height: 96 },
        { name: '设置按钮', filename: 'button_settings.png', width: 128, height: 128 },
        { name: '面板背景', filename: 'panel_bg.png', width: 400, height: 300 }
      ],
      icon: [
        { name: '正确图标', filename: 'icon_correct.png', width: 64, height: 64 },
        { name: '错误图标', filename: 'icon_wrong.png', width: 64, height: 64 },
        { name: '星星图标', filename: 'icon_star.png', width: 64, height: 64 }
      ],
      effect: [
        { name: '粒子效果', filename: 'particle.png', width: 32, height: 32 },
        { name: '爆炸效果', filename: 'explosion.png', width: 128, height: 128 }
      ]
    };
    
    // 根据游戏类型添加特定资源
    switch (gameType) {
      case 'casual':
        baseImages.scene.push(
          { name: '拼图块', filename: 'tile.png', width: 128, height: 128 }
        );
        baseImages.icon.push(
          { name: '时间图标', filename: 'icon_time.png', width: 64, height: 64 }
        );
        break;
      case 'action':
        baseImages.effect.push(
          { name: '轨迹效果', filename: 'trail.png', width: 32, height: 32 },
          { name: '护盾效果', filename: 'shield.png', width: 96, height: 96 }
        );
        break;
      case 'educational':
        baseImages.icon.push(
          { name: '数字1图标', filename: 'number_1.png', width: 64, height: 64 },
          { name: '字母A图标', filename: 'letter_a.png', width: 64, height: 64 }
        );
        break;
    }
    
    return baseImages[category] || [];
  }

  /**
   * 创建占位图像
   */
  async createPlaceholderImage(outputPath, width, height, color1, color2, label) {
    if (!sharpAvailable) {
      this.createTextFilePlaceholder(outputPath, width, height, label);
      return;
    }
    
    try {
      // 创建渐变背景
      const svg = `<svg width="${width}" height="${height}">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#grad1)" />
        <text x="${width/2}" y="${height/2}" 
              font-family="Arial" 
              font-size="${Math.min(width, height)/8}px" 
              fill="white" 
              text-anchor="middle" 
              dominant-baseline="middle">
          ${label}
        </text>
        <text x="${width/2}" y="${height/2 + Math.min(width, height)/6}" 
              font-family="Arial" 
              font-size="${Math.min(width, height)/12}px" 
              fill="rgba(255,255,255,0.7)" 
              text-anchor="middle" 
              dominant-baseline="middle">
          ${width}×${height}
        </text>
      </svg>`;
      
      await sharp(Buffer.from(svg))
        .png()
        .toFile(outputPath);
        
    } catch (error) {
      console.error(`❌ 生成图像失败 (${outputPath}):`, error.message);
      this.createTextFilePlaceholder(outputPath, width, height, label);
    }
  }

  /**
   * 创建文本文件占位符
   */
  createTextFilePlaceholder(outputPath, width, height, label) {
    const content = `占位图像: ${label}\n尺寸: ${width}x${height}\n用途: 游戏资源，应替换为实际图像\n生成时间: ${new Date().toLocaleString()}`;
    fs.writeFileSync(outputPath.replace(/\.(png|jpg|webp)$/, '.txt'), content);
  }

  /**
   * 生成音频占位资源
   */
  generateAudioPlaceholders(assetsDir) {
    const audioDir = path.join(assetsDir, 'audio');
    const categories = ['bgm', 'effect', 'voice'];
    
    categories.forEach(category => {
      const categoryDir = path.join(audioDir, category);
      if (!fs.existsSync(categoryDir)) return;
      
      const files = fs.readdirSync(categoryDir)
        .filter(file => file.match(/\.(mp3|wav|ogg)$/i));
      
      if (files.length === 0) {
        // 创建占位说明文件
        const placeholderFile = category === 'bgm' ? 'bgm_placeholder.mp3.txt' : 'sfx_placeholder.mp3.txt';
        const content = `音频占位文件\n目录: audio/${category}\n说明: 应将此占位文件替换为实际的音频文件\n格式: MP3 (建议使用128kbps或更高音质)\n时长: ${category === 'bgm' ? '60-180秒' : '1-3秒'}\n生成时间: ${new Date().toLocaleString()}`;
        
        fs.writeFileSync(
          path.join(categoryDir, placeholderFile),
          content,
          'utf8'
        );
        console.log(`   📝 创建音频占位说明: audio/${category}/${placeholderFile}`);
      }
    });
  }

  /**
   * 验证资源完整性
   */
  async validateResources(gameDir) {
    console.log(`🔍 验证资源完整性: ${gameDir}`);
    
    const results = {
      valid: true,
      issues: [],
      recommendations: []
    };
    
    // 检查GTRS配置
    const gtrsPath = path.join(gameDir, 'src/config/GTRS.json');
    if (fs.existsSync(gtrsPath)) {
      try {
        const gtrs = JSON.parse(fs.readFileSync(gtrsPath, 'utf8'));
        const validation = this.validateGTRSConfig(gtrs);
        
        if (!validation.valid) {
          results.valid = false;
          results.issues.push('GTRS配置错误');
          results.issues.push(...validation.issues);
        }
        
        // 检查物理文件存在
        const missingFiles = this.checkPhysicalFiles(gtrs, gameDir);
        if (missingFiles.length > 0) {
          results.valid = false;
          results.issues.push('物理资源文件缺失');
          results.issues.push(...missingFiles.map(f => `  - ${f}`));
        }
        
      } catch (error) {
        results.valid = false;
        results.issues.push(`解析GTRS配置失败: ${error.message}`);
      }
    } else {
      results.issues.push('未找到GTRS.json配置文件');
    }
    
    // 检查公共目录结构
    const publicDir = path.join(gameDir, 'public');
    if (fs.existsSync(publicDir)) {
      const themeDirs = fs.readdirSync(publicDir)
        .filter(item => fs.statSync(path.join(publicDir, item)).isDirectory());
      
      if (themeDirs.length === 0) {
        results.recommendations.push('建议创建主题目录: public/{game}_default/');
      }
    }
    
    // 输出结果
    if (results.valid) {
      console.log('✅ 资源完整性验证通过');
    } else {
      console.log('❌ 发现资源完整性问题:');
      results.issues.forEach(issue => console.log(`   ${issue}`));
    }
    
    if (results.recommendations.length > 0) {
      console.log('💡 优化建议:');
      results.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }
    
    return results;
  }

  /**
   * 验证GTRS配置
   */
  validateGTRSConfig(gtrs) {
    const issues = [];
    
    // 检查必填字段
    const requiredFields = ['specMeta', 'themeInfo', 'resources'];
    requiredFields.forEach(field => {
      if (!gtrs[field]) {
        issues.push(`缺少必填字段: ${field}`);
      }
    });
    
    // 检查specMeta
    if (gtrs.specMeta) {
      if (!gtrs.specMeta.version) issues.push('specMeta缺少version字段');
      if (!gtrs.specMeta.gameId) issues.push('specMeta缺少gameId字段');
    }
    
    // 检查资源结构
    if (gtrs.resources) {
      const requiredCategories = ['images', 'audio'];
      requiredCategories.forEach(category => {
        if (!gtrs.resources[category]) {
          issues.push(`resources缺少${category}字段`);
        }
      });
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * 检查物理文件存在
   */
  checkPhysicalFiles(gtrs, gameDir) {
    const missingFiles = [];
    
    // 检查图像资源
    if (gtrs.resources?.images) {
      for (const [category, resources] of Object.entries(gtrs.resources.images)) {
        for (const [key, config] of Object.entries(resources as any)) {
          const src = config.src;
          if (src) {
            const filePath = path.join(gameDir, 'public', src);
            if (!fs.existsSync(filePath)) {
              missingFiles.push(`${src} (${category}/${key})`);
            }
          }
        }
      }
    }
    
    return missingFiles;
  }

  /**
   * 提供资源优化建议
   */
  async provideOptimizationSuggestions(gameDir) {
    console.log(`📊 分析资源优化机会: ${gameDir}`);
    
    const suggestions = [];
    const publicDir = path.join(gameDir, 'public');
    
    if (!fs.existsSync(publicDir)) {
      suggestions.push('未找到public目录，无法分析');
      return suggestions;
    }
    
    // 查找所有图像文件
    const imageFiles = this.findAllFiles(publicDir, /\.(png|jpg|jpeg|webp)$/i);
    
    if (imageFiles.length > 0) {
      const totalSize = await this.calculateTotalSize(imageFiles);
      suggestions.push(`图像资源总数: ${imageFiles.length}个文件`);
      suggestions.push(`图像总大小: ${this.formatBytes(totalSize)}`);
      
      // 分析大文件
      const largeFiles = await this.findLargeFiles(imageFiles, 1024 * 1024); // 1MB以上
      if (largeFiles.length > 0) {
        suggestions.push(`⚠️ 发现${largeFiles.length}个超过1MB的大图像文件`);
        largeFiles.forEach(file => {
          suggestions.push(`  - ${path.relative(publicDir, file.file)} (${this.formatBytes(file.size)})`);
        });
        suggestions.push('💡 建议: 压缩大图像文件或考虑使用WebP格式');
      }
      
      // 检查格式分布
      const formatStats = this.analyzeFileFormats(imageFiles);
      if (formatStats.png > imageFiles.length * 0.7) {
        suggestions.push('💡 建议: PNG格式占比较高，考虑部分使用WebP以获得更好压缩');
      }
    }
    
    // 查找所有音频文件
    const audioFiles = this.findAllFiles(publicDir, /\.(mp3|wav|ogg)$/i);
    if (audioFiles.length > 0) {
      const totalSize = await this.calculateTotalSize(audioFiles);
      suggestions.push(`音频资源总数: ${audioFiles.length}个文件`);
      suggestions.push(`音频总大小: ${this.formatBytes(totalSize)}`);
      
      // 建议使用MP3而非WAV
      const wavFiles = audioFiles.filter(f => f.toLowerCase().endsWith('.wav'));
      if (wavFiles.length > 0) {
        suggestions.push(`⚠️ 发现${wavFiles.length}个WAV格式音频文件，文件较大`);
        suggestions.push('💡 建议: 转换为MP3格式以减小文件大小');
      }
    }
    
    return suggestions;
  }

  /**
   * 辅助方法
   */
  createStructure(structure, basePath) {
    for (const [dirPath, content] of Object.entries(structure)) {
      const fullPath = path.join(basePath, dirPath);
      
      // 创建目录
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
      
      // 处理子目录或文件
      if (Array.isArray(content)) {
        // 创建文件占位符
        content.forEach(file => {
          const filePath = path.join(fullPath, file);
          if (!fs.existsSync(filePath)) {
            const ext = path.extname(file);
            if (ext === '.png' || ext === '.jpg') {
              // 创建图像占位符
              const placeholder = `占位图像: ${file}\n请替换为实际图像文件`;
              fs.writeFileSync(filePath.replace(ext, '.txt'), placeholder);
            } else if (ext === '.mp3' || ext === '.wav') {
              // 创建音频占位符
              const placeholder = `占位音频: ${file}\n请替换为实际音频文件`;
              fs.writeFileSync(filePath.replace(ext, '.txt'), placeholder);
            }
          }
        });
      } else if (typeof content === 'object') {
        // 递归处理子结构
        this.createStructure(content, fullPath);
      }
    }
  }

  createKeepFiles(themeDir) {
    const keepFilePath = path.join(themeDir, '.keep');
    if (!fs.existsSync(keepFilePath)) {
      fs.writeFileSync(keepFilePath, '# 占位文件，确保目录被git跟踪\n');
    }
  }

  findAllFiles(dir, pattern) {
    let results = [];
    
    if (!fs.existsSync(dir)) return results;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        results = results.concat(this.findAllFiles(fullPath, pattern));
      } else if (pattern.test(item)) {
        results.push(fullPath);
      }
    }
    
    return results;
  }

  async calculateTotalSize(files) {
    let totalSize = 0;
    
    for (const file of files) {
      try {
        const stat = fs.statSync(file);
        totalSize += stat.size;
      } catch (error) {
        // 忽略无法访问的文件
      }
    }
    
    return totalSize;
  }

  async findLargeFiles(files, threshold) {
    const largeFiles = [];
    
    for (const file of files) {
      try {
        const stat = fs.statSync(file);
        if (stat.size > threshold) {
          largeFiles.push({
            file,
            size: stat.size
          });
        }
      } catch (error) {
        // 忽略无法访问的文件
      }
    }
    
    return largeFiles;
  }

  analyzeFileFormats(files) {
    const stats = { png: 0, jpg: 0, jpeg: 0, webp: 0 };
    
    for (const file of files) {
      const ext = path.extname(file).toLowerCase().replace('.', '');
      if (stats[ext] !== undefined) {
        stats[ext]++;
      }
    }
    
    return stats;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// CLI主程序
async function main() {
  const generator = new ResourceGenerator();
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'init':
      if (args.length < 2) {
        console.error('用法: node resource-generator.js init <game-id> [game-type]');
        console.error('game-type可选: casual, action, educational, custom (默认)');
        process.exit(1);
      }
      await generator.initResourceStructure(args[1], args[2] || 'custom');
      break;
      
    case 'placeholder':
      if (args.length < 2) {
        console.error('用法: node resource-generator.js placeholder <project-dir> [game-type]');
        process.exit(1);
      }
      await generator.generatePlaceholderResources(
        path.resolve(args[1]),
        path.basename(args[1]),
        args[2] || 'custom'
      );
      break;
      
    case 'validate':
      if (args.length < 2) {
        console.error('用法: node resource-generator.js validate <project-dir>');
        process.exit(1);
      }
      await generator.validateResources(path.resolve(args[1]));
      break;
      
    case 'optimize':
      if (args.length < 2) {
        console.error('用法: node resource-generator.js optimize <project-dir>');
        process.exit(1);
      }
      const suggestions = await generator.provideOptimizationSuggestions(path.resolve(args[1]));
      suggestions.forEach(s => console.log(`   ${s}`));
      break;
      
    case 'help':
    default:
      console.log('🎨 智能资源生成工具 v1.0');
      console.log('='.repeat(50));
      console.log('\n📖 使用方法:');
      console.log('  node resource-generator.js init <game-id>        初始化资源目录结构');
      console.log('  node resource-generator.js placeholder <dir>     生成占位资源');
      console.log('  node resource-generator.js validate <dir>        验证资源完整性');
      console.log('  node resource-generator.js optimize <dir>        资源优化建议');
      console.log('  node resource-generator.js help                  显示帮助');
      
      console.log('\n🎮 游戏类型选项:');
      console.log('  casual     休闲游戏 (明亮活泼色彩)');
      console.log('  action     动作游戏 (动感强烈色彩)');
      console.log('  educational 教育游戏 (明亮舒适色彩)');
      console.log('  custom     自定义 (默认主题色彩)');
      
      console.log('\n🚀 示例:');
      console.log('  # 初始化休闲游戏资源');
      console.log('  node resource-generator.js init my-puzzle-game casual');
      
      console.log('\n  # 在现有项目中生成占位资源');
      console.log('  node resource-generator.js placeholder ./my-game action');
      
      console.log('\n  # 验证资源完整性');
      console.log('  node resource-generator.js validate ./my-game');
      
      console.log('\n  # 分析资源优化机会');
      console.log('  node resource-generator.js optimize ./my-game');
      
      console.log('\n💡 注意:');
      console.log('  - 需要安装sharp以获得完整图像生成功能: npm install sharp');
      console.log('  - 音频占位资源目前仅创建说明文件');
      console.log('  - 建议在项目创建后立即运行此工具');
      break;
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ 运行失败:', err.message);
    process.exit(1);
  });
}

module.exports = ResourceGenerator;