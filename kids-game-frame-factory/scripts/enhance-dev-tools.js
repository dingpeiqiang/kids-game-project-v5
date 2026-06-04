/**
 * 🛠️ 增强版开发工具脚本 v2.0
 * 
 * 提供智能化的游戏开发脚手架工具，支持：
 * 1. 游戏项目快速初始化 (支持不同游戏类型模板)
 * 2. GTRS配置自动化生成和验证
 * 3. 资源映射辅助工具和预设
 * 4. 框架完整性检查和依赖管理
 * 5. 开发环境快速配置
 * 6. 项目生命周期管理
 * 
 * 使用方法:
 * 命令行: node enhance-dev-tools.js <command> [options]
 * 向导界面: 使用 game-wizard.bat 或 GameWizard.ps1
 * 
 * 支持的命令:
 * - check     : 检查框架完整性
 * - create    : 创建新游戏项目
 * - guide     : 显示开发指南
 * - validate  : 验证GTRS配置
 * - analyze   : 分析项目依赖
 * - upgrade   : 检查框架升级
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 增强版开发工具主类
 */
class EnhancedDevTools {
  constructor() {
    this.templateDir = path.join(__dirname, '../templates/game-template');
    this.frameworkVersion = '3.1.0';
  }

  /**
   * 检查框架完整性
   */
  checkFrameworkIntegrity() {
    console.log('🔍 检查框架完整性...');
    
    const requiredFiles = [
      'src/scenes/GameScene.ts',
      'src/types/level-types.ts',
      'templates/game-template/AI_INSTRUCTIONS.md'
    ];
    
    let allGood = true;
    const checkResults = [];
    
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        checkResults.push({
          file,
          status: '✅',
          size: `${Math.round(stats.size / 1024)}KB`,
          modified: stats.mtime.toLocaleDateString()
        });
      } else {
        checkResults.push({ file, status: '❌', size: '0KB', modified: 'N/A' });
        allGood = false;
      }
    }
    
    // 显示检查结果
    console.table(checkResults);
    
    if (allGood) {
      console.log('✅ 框架结构完整，版本 v' + this.frameworkVersion);
    } else {
      console.log('⚠️  发现缺失文件，建议重新初始化框架');
    }
    
    return allGood;
  }

  /**
   * 智能创建新游戏项目 (增强版)
   */
  async createNewGame(gameId, gameName, description = '', gameType = 'custom') {
    console.log(`🎮 创建新游戏项目: ${gameName} (${gameId}, 类型: ${gameType})`);
    
    // 验证gameId格式
    if (!/^[a-z][a-z0-9_]*$/.test(gameId)) {
      throw new Error('游戏ID必须是小写字母开头，只能包含小写字母、数字和下划线');
    }
    
    // 检查目标目录
    const targetDir = path.join(process.cwd(), gameId);
    if (fs.existsSync(targetDir)) {
      throw new Error(`目录 ${gameId} 已存在`);
    }
    
    // 检查游戏类型有效性
    const validGameTypes = ['casual', 'action', 'educational', 'custom'];
    if (!validGameTypes.includes(gameType)) {
      throw new Error(`不支持的游戏类型: ${gameType}. 支持的类型: ${validGameTypes.join(', ')}`);
    }
    
    // 显示项目信息摘要
    this.showProjectSummary(gameId, gameName, description, gameType);
    
    try {
      // 复制模板
      console.log(`📁 复制游戏模板到 ${gameId}...`);
      this.copyDirectory(this.templateDir, targetDir);
      
      // 更新游戏配置
      console.log('📝 更新游戏配置...');
      this.updateGameConfig(targetDir, gameId, gameName, description);
      
      // 根据游戏类型调整配置
      console.log('🎮 根据游戏类型调整配置...');
      this.adjustForGameType(targetDir, gameId, gameType);
      
      // 初始化资源文件
      console.log('🎨 初始化资源配置文件...');
      this.initResourceConfigForType(targetDir, gameId, gameType);
      
      // 创建开发配置
      console.log('⚙️  创建开发配置...');
      this.createDevConfig(targetDir, gameId, gameType);
      
      // 显示完成消息
      console.log(`\n✅ 游戏项目 ${gameName} 创建成功！`);
      console.log('='.repeat(50));
      
      // 显示项目结构
      this.showProjectStructure(targetDir);
      
      return {
        gameId,
        gameName,
        gameType,
        path: targetDir,
        frameworkVersion: this.frameworkVersion,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      // 清理失败的项目
      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
        console.log('🧹 已清理失败的项目目录');
      }
      throw error;
    }
  }

  /**
   * 显示项目信息摘要
   */
  showProjectSummary(gameId, gameName, description, gameType) {
    const summary = {
      '🎮 游戏名称': gameName,
      '🆔 游戏ID': gameId,
      '🎨 游戏类型': gameType,
      '📝 游戏描述': description || '(未设置)',
      '🗂️  项目目录': path.join(process.cwd(), gameId),
      '📦 框架版本': this.frameworkVersion,
      '⏰ 创建时间': new Date().toLocaleString()
    };
    
    console.log('📋 项目信息摘要:');
    console.log('='.repeat(40));
    for (const [key, value] of Object.entries(summary)) {
      console.log(`${key.padEnd(12)}: ${value}`);
    }
    console.log('='.repeat(40));
    console.log();
  }

  /**
   * 根据游戏类型调整配置
   */
  adjustForGameType(gameDir, gameId, gameType) {
    const gameConfigPath = path.join(gameDir, 'src/config/game-config.json');
    
    if (fs.existsSync(gameConfigPath)) {
      const config = JSON.parse(fs.readFileSync(gameConfigPath, 'utf8'));
      
      // 根据游戏类型调整配置
      switch (gameType) {
        case 'casual':
          config.gameType = 'casual';
          config.difficultyIncrement = 0.1;
          config.timeLimit = 300; // 5分钟
          config.maxScore = 1000;
          config.allowedHints = 3;
          config.movementType = 'grid_based';
          break;
          
        case 'action':
          config.gameType = 'action';
          config.difficultyIncrement = 0.15;
          config.timeLimit = 180; // 3分钟
          config.maxScore = 5000;
          config.allowedHints = 0;
          config.movementType = 'free_movement';
          break;
          
        case 'educational':
          config.gameType = 'educational';
          config.difficultyIncrement = 0.05;
          config.timeLimit = 600; // 10分钟
          config.maxScore = 2000;
          config.allowedHints = 5;
          config.movementType = 'tap_interaction';
          break;
          
        case 'custom':
          config.gameType = 'custom';
          config.difficultyIncrement = 0.1;
          config.timeLimit = 300;
          config.maxScore = 3000;
          config.allowedHints = 2;
          config.movementType = 'custom';
          break;
      }
      
      fs.writeFileSync(gameConfigPath, JSON.stringify(config, null, 2), 'utf8');
      console.log(`   ✅ 已根据 ${gameType} 类型调整游戏配置`);
    }
  }

  /**
   * 根据游戏类型初始化资源配置
   */
  initResourceConfigForType(gameDir, gameId, gameType) {
    const configDir = path.join(gameDir, 'src/config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // 读取基础GTRS配置
    let baseGtrsPath = path.join(this.templateDir, 'src/config/GTRS.json');
    if (!fs.existsSync(baseGtrsPath)) {
      baseGtrsPath = path.join(__dirname, '../templates/game-template/src/config/GTRS.json');
    }
    
    if (fs.existsSync(baseGtrsPath)) {
      const baseGtrs = JSON.parse(fs.readFileSync(baseGtrsPath, 'utf8'));
      
      // 更新specMeta
      baseGtrs.specMeta.gameId = gameId;
      baseGtrs.specMeta.gameName = gameId.charAt(0).toUpperCase() + gameId.slice(1);
      baseGtrs.specMeta.gameType = gameType;
      baseGtrs.specMeta.createdAt = new Date().toISOString();
      baseGtrs.specMeta.frameworkVersion = this.frameworkVersion;
      
      // 更新themeInfo
      baseGtrs.themeInfo.themeId = gameId + '_default';
      baseGtrs.themeInfo.displayName = '默认主题';
      
      // 根据游戏类型调整全局样式
      switch (gameType) {
        case 'casual': // 休闲游戏 - 明亮活泼
          baseGtrs.globalStyle.primaryColor = '#FF6B6B';
          baseGtrs.globalStyle.secondaryColor = '#4ECDC4';
          baseGtrs.globalStyle.backgroundColor = '#F7FFF7';
          baseGtrs.globalStyle.textColor = '#26547C';
          break;
        case 'action': // 动作游戏 - 动感强烈
          baseGtrs.globalStyle.primaryColor = '#FFA500';
          baseGtrs.globalStyle.secondaryColor = '#FF4500';
          baseGtrs.globalStyle.backgroundColor = '#1A1A2E';
          baseGtrs.globalStyle.textColor = '#E6E6E6';
          break;
        case 'educational': // 教育游戏 - 明亮舒适
          baseGtrs.globalStyle.primaryColor = '#3CB371';
          baseGtrs.globalStyle.secondaryColor = '#FFD700';
          baseGtrs.globalStyle.backgroundColor = '#F0F8FF';
          baseGtrs.globalStyle.textColor = '#2F4F4F';
          break;
        default: // 自定义 - 中性色调
          baseGtrs.globalStyle.primaryColor = '#4ECDC4';
          baseGtrs.globalStyle.secondaryColor = '#FF6B6B';
          baseGtrs.globalStyle.backgroundColor = '#F7FFF7';
          baseGtrs.globalStyle.textColor = '#26547C';
      }
      
      // 根据游戏类型调整资源预设
      this.adjustResourcesForType(baseGtrs.resources, gameId, gameType);
      
      fs.writeFileSync(
        path.join(configDir, 'GTRS.json'),
        JSON.stringify(baseGtrs, null, 2),
        'utf8'
      );
      console.log(`    ✅ 已为 ${gameType} 类型生成GTRS配置`);
    } else {
      // 回退到简单配置
      this.initResourceConfig(gameDir, gameId);
    }
  }

  /**
   * 根据游戏类型调整资源
   */
  adjustResourcesForType(resources, gameId, gameType) {
    const themePath = `/themes/${gameId}_default/assets`;
    
    // 重置资源
    resources.images = {
      scene: {},
      ui: {},
      icon: {},
      effect: {}
    };
    resources.audio = {
      bgm: {},
      effect: {},
      voice: {}
    };
    
    // 添加基础资源
    resources.images.scene.background = {
      key: 'bg_main',
      src: `${themePath}/scene/bg_main.png`,
      width: 720,
      height: 1280,
      description: '游戏背景图',
      tags: ['background']
    };
    
    resources.images.ui.button_start = {
      key: 'btn_start',
      src: `${themePath}/ui/btn_start.png`,
      width: 256,
      height: 96,
      description: '开始按钮',
      tags: ['ui', 'button']
    };
    
    resources.images.ui.button_exit = {
      key: 'btn_exit',
      src: `${themePath}/ui/btn_exit.png`,
      width: 256,
      height: 96,
      description: '退出按钮',
      tags: ['ui', 'button']
    };
    
    // 根据游戏类型添加特定资源
    switch (gameType) {
      case 'casual': // 休闲游戏资源
        resources.images.scene.tile_pattern = {
          key: 'tile_pattern',
          src: `${themePath}/scene/tile_pattern.png`,
          width: 64,
          height: 64,
          description: '拼图图案',
          tags: ['tile', 'pattern']
        };
        resources.audio.bgm.main = {
          key: 'bgm_relax',
          src: `${themePath}/audio/bgm_relax.mp3`,
          format: 'mp3',
          duration: 180,
          description: '休闲背景音乐',
          loop: true
        };
        resources.audio.effect.complete = {
          key: 'sfx_complete',
          src: `${themePath}/audio/sfx_complete.mp3`,
          format: 'mp3',
          duration: 2,
          description: '完成音效',
          loop: false
        };
        break;
        
      case 'action': // 动作游戏资源
        resources.images.effect.explosion = {
          key: 'explosion',
          src: `${themePath}/effect/explosion.png`,
          width: 128,
          height: 128,
          description: '爆炸效果',
          tags: ['effect', 'explosion']
        };
        resources.audio.bgm.action = {
          key: 'bgm_action',
          src: `${themePath}/audio/bgm_action.mp3`,
          format: 'mp3',
          duration: 180,
          description: '动作背景音乐',
          loop: true
        };
        resources.audio.effect.collision = {
          key: 'sfx_collision',
          src: `${themePath}/audio/sfx_collision.mp3`,
          format: 'mp3',
          duration: 1,
          description: '碰撞音效',
          loop: false
        };
        break;
        
      case 'educational': // 教育游戏资源
        resources.images.icon.correct = {
          key: 'icon_correct',
          src: `${themePath}/icon/icon_correct.png`,
          width: 64,
          height: 64,
          description: '正确图标',
          tags: ['icon', 'correct']
        };
        resources.images.icon.wrong = {
          key: 'icon_wrong',
          src: `${themePath}/icon/icon_wrong.png`,
          width: 64,
          height: 64,
          description: '错误图标',
          tags: ['icon', 'wrong']
        };
        resources.audio.voice.hint = {
          key: 'voice_hint',
          src: `${themePath}/audio/voice_hint.mp3`,
          format: 'mp3',
          duration: 3,
          description: '提示语音',
          loop: false
        };
        break;
    }
  }

  /**
   * 创建开发配置
   */
  createDevConfig(gameDir, gameId, gameType) {
    // 创建package.json脚本
    const packagePath = path.join(gameDir, 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // 添加项目特定的开发脚本
      packageJson.scripts = {
        ...packageJson.scripts,
        'dev-fast': 'vite --host --port 3000',
        'build-prod': 'vite build && npm run type-check',
        'type-check': 'npx tsc --noEmit',
        'format': 'prettier --write "src/**/*.{ts,js,json}"',
        'lint': 'eslint src --ext .ts,.js',
        'analyze': 'npx tsc --noEmit --listFiles',
        'gtrs-check': 'node -e "const fs=require(\"fs\");try{const gtrs=JSON.parse(fs.readFileSync(\"src/config/GTRS.json\",\"utf8\"));console.log(\"✅ GTRS配置有效，版本:\",gtrs.specMeta.version)}catch(e){console.error(\"❌ GTRS配置错误:\",e.message)}"',
        'generate-assets': 'echo "运行资源生成脚本..."'
      };
      
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2), 'utf8');
    }
    
    // 创建vite配置文件
    const viteConfigPath = path.join(gameDir, 'vite.config.ts');
    if (!fs.existsSync(viteConfigPath)) {
      const viteConfig = `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    sourcemap: true,
    target: 'es2020',
    rollupOptions: {
      external: ['phaser'],
      output: {
        globals: {
          phaser: 'Phaser'
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['phaser']
  },
  server: {
    port: 3000,
    host: true,
    open: true
  }
})`;
      
      fs.writeFileSync(viteConfigPath, viteConfig, 'utf8');
    }
    
    // 创建快速开始文档
    const quickStartPath = path.join(gameDir, 'QUICK_START.md');
    const quickStartContent = `# 🚀 ${gameId} - 快速开始指南

## 📋 项目信息
- **游戏名称**: ${gameId.charAt(0).toUpperCase() + gameId.slice(1)}
- **游戏类型**: ${gameType}
- **框架版本**: ${this.frameworkVersion}
- **创建时间**: ${new Date().toLocaleString()}

## 🏗️ 项目结构
\`\`\`
${gameId}/
├── src/scenes/MyGameScene.ts     # 游戏主场景（必须修改）
├── src/config/GTRS.json          # 资源配置文件  
├── src/config/game-config.json   # 游戏基础配置
├── src/config/difficulty.json    # 难度配置
├── src/components/               # Vue组件
├── public/                       # 静态资源
└── AI_INSTRUCTIONS.md            # 详细开发指南
\`\`\`

## 🚀 开发流程
1. 阅读 \`AI_INSTRUCTIONS.md\` 了解开发规范
2. 修改 \`MyGameScene.ts\` 实现游戏逻辑
3. 创建游戏资源并配置 \`GTRS.json\`
4. 运行 \`npm run dev\` 预览游戏
5. 运行 \`npm run build-prod\` 构建生产版本

## 📝 核心文件说明
1. \`MyGameScene.ts\` - 必须实现3个抽象方法:
   - \`createGameObjects()\`: 创建游戏对象
   - \`gameLoop(time, delta)\`: 游戏主循环逻辑
   - \`handleGameOver()\`: 游戏结束处理

2. \`GTRS.json\` - 资源配置文件:
   - 遵循GTRS v1.0.0规范
   - 保持三层资源对齐
   - 资源路径: /themes/{gameId}_default/assets/

## ⚡ 快捷命令
\`\`\`bash
# 启动开发服务器
npm run dev-fast

# 类型检查
npm run type-check

# 格式化代码
npm run format

# 检查GTRS配置
npm run gtrs-check

# 构建生产版本
npm run build-prod
\`\`\`

## 🎯 游戏开发要点
- 使用框架内置API: \`this.addScore()\`, \`this.gridToPixelCenter()\`
- 资源通过GTRS统一管理，不要硬编码资源路径
- 考虑移动端适配，使用响应式UI组件
- 开发完成后生成SQL注册文件

## 🐛 常见问题
1. **Phaser未找到**: 已通过CDN引入，代码中不要import
2. **资源加载失败**: 检查GTRS.json中的路径配置
3. **类型检查错误**: 运行 \`npm run type-check\` 查看详情
4. **游戏无法启动**: 确保实现了全部3个抽象方法

---

📅 最后更新: ${new Date().toLocaleDateString()}
🛠️ 创建工具: kids-game-frame-factory v${this.frameworkVersion}
`;
    
    fs.writeFileSync(quickStartPath, quickStartContent, 'utf8');
  }

  /**
   * 显示项目结构
   */
  showProjectStructure(gameDir) {
    const getFileTree = (dir, prefix = '') => {
      const items = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => {
        // 目录在前，文件在后
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

      let output = '';
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const isLast = i === items.length - 1;
        const connector = prefix + (isLast ? '└── ' : '├── ');
        
        if (item.isDirectory()) {
          const icon = this.getIconForDir(item.name);
          output += `${connector}${icon} ${item.name}/\n`;
          const childPrefix = prefix + (isLast ? '    ' : '│   ');
          output += getFileTree(path.join(dir, item.name), childPrefix);
        } else {
          const icon = this.getIconForFile(item.name);
          const size = this.getFileSize(path.join(dir, item.name));
          output += `${connector}${icon} ${item.name} ${size}\n`;
        }
      }
      return output;
    };

    const tree = getFileTree(gameDir);
    console.log('📁 项目结构:');
    console.log('```');
    console.log(gameDir.split(path.sep).pop() + '/');
    console.log(tree);
    console.log('```');
  }

  getIconForDir(dirName) {
    const icons = {
      'src': '📁',
      'config': '⚙️',
      'components': '🧩',
      'scenes': '🎬',
      'utils': '🛠️',
      'assets': '🎨',
      'public': '🌐',
      'docs': '📖',
      'templates': '📋',
      'scripts': '📜'
    };
    return icons[dirName] || '📂';
  }

  getIconForFile(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const icons = {
      '.ts': '📄',
      '.js': '📄',
      '.json': '📝',
      '.vue': '🔷',
      '.md': '📘',
      '.html': '🌐',
      '.css': '🎨',
      '.scss': '🎨',
      '.png': '🖼️',
      '.jpg': '🖼️',
      '.mp3': '🎵',
      '.wav': '🎵',
      '.gitignore': '📛',
      '.gitattributes': '📛',
      'package': '📦'
    };
    
    if (fileName === 'package.json') return '📦';
    if (fileName === 'README.md') return '📖';
    if (fileName === 'AI_INSTRUCTIONS.md') return '📘';
    return icons[ext] || '📄';
  }

  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) return '';
      
      const size = stats.size;
      if (size < 1024) return `(${size}B)`;
      if (size < 1024 * 1024) return `(${Math.round(size / 1024)}KB)`;
      return `(${Math.round(size / (1024 * 1024))}MB)`;
    } catch {
      return '';
    }
  }

  /**
   * 生成GTRS配置工具
   */
  generateGTRSAssistant(gameDir) {
    console.log('🔄 生成GTRS配置助手...');
    
    const gtrsHelperContent = `
/**
 * 🎨 GTRS配置助手 - ${path.basename(gameDir)}
 * 
 * 自动生成和管理GTRS资源映射配置
 */

export class GTRSConfigHelper {
  constructor(gameId) {
    this.gameId = gameId;
    this.gtrsVersion = '1.0.0';
    this.resourceCategories = {
      images: ['scene', 'ui', 'icon', 'effect'],
      audio: ['bgm', 'effect', 'voice']
    };
  }

  /**
   * 创建初始GTRS配置结构
   */
  createDefaultConfig() {
    return {
      specMeta: {
        version: this.gtrsVersion,
        gameId: this.gameId,
        gameName: '游戏名称',
        description: '请在此处添加游戏描述'
      },
      themeInfo: {
        themeId: this.gameId + '_default',
        displayName: '默认主题',
        version: '1.0.0'
      },
      globalStyle: {
        primaryColor: '#FF6B6B',
        secondaryColor: '#4ECDC4',
        fontFamily: 'Arial, sans-serif'
      },
      resources: {
        images: {
          scene: {},
          ui: {},
          icon: {},
          effect: {}
        },
        audio: {
          bgm: {},
          effect: {},
          voice: {}
        }
      }
    };
  }

  /**
   * 添加图像资源配置
   */
  addImageResource(category, resourceId, path, metadata = {}) {
    if (!this.resourceCategories.images.includes(category)) {
      throw new Error(\`不支持的图像分类: \${category}\`);
    }

    return {
      key: resourceId,
      src: path,
      width: metadata.width || 256,
      height: metadata.height || 256,
      description: metadata.description || '游戏资源',
      tags: metadata.tags || []
    };
  }

  /**
   * 添加音频资源配置
   */
  addAudioResource(category, resourceId, path, metadata = {}) {
    if (!this.resourceCategories.audio.includes(category)) {
      throw new Error(\`不支持的音频分类: \${category}\`);
    }

    return {
      key: resourceId,
      src: path,
      format: metadata.format || 'mp3',
      duration: metadata.duration || 30,
      description: metadata.description || '音效资源',
      loop: category === 'bgm'  // BGM默认循环
    };
  }

  /**
   * 验证GTRS配置完整性
   */
  validateGTRSConfig(gtrsConfig) {
    const issues = [];
    
    // 检查specMeta
    if (!gtrsConfig.specMeta) {
      issues.push('缺少 specMeta 字段');
    } else {
      if (!gtrsConfig.specMeta.version) issues.push('缺少版本号');
      if (!gtrsConfig.specMeta.gameId) issues.push('缺少游戏ID');
    }

    // 检查themeInfo
    if (!gtrsConfig.themeInfo) {
      issues.push('缺少 themeInfo 字段');
    }

    // 检查resources结构
    if (!gtrsConfig.resources) {
      issues.push('缺少 resources 字段');
    }

    return {
      valid: issues.length === 0,
      issues,
      suggestion: issues.length > 0 ? '请补充缺失的必填字段' : '配置完整'
    };
  }
}

// 使用示例
/*
const helper = new GTRSConfigHelper('my-game');
const config = helper.createDefaultConfig();

// 添加资源
config.resources.images.scene.background = 
  helper.addImageResource('scene', 'background', '/themes/my-game_default/assets/scene/bg.png', {
    width: 1280,
    height: 720,
    description: '游戏背景图'
  });

// 验证配置
const validation = helper.validateGTRSConfig(config);
console.log('GTRS配置验证:', validation);
*/
`;
    
    const helperPath = path.join(gameDir, 'src/utils/GTRSHelper.ts');
    fs.writeFileSync(helperPath, gtrsHelperContent, 'utf8');
    
    console.log(`✅ GTRS配置助手已生成: ${helperPath}`);
  }

  /**
   * 框架使用指南
   */
  showFrameworkGuide() {
    console.log('\n🚀 kids-game-frame-factory v' + this.frameworkVersion);
    console.log('='.repeat(50));
    console.log('\n📖 核心开发流程:');
    console.log('   1. 编写 GAME_DESIGN_DOCUMENT.md');
    console.log('   2. 生成资源 (Sharp + Node.js WAV)');
    console.log('   3. 配置 GTRS.json');
    console.log('   4. 实现 MyGameScene.ts');
    console.log('   5. 数据库注册');
    console.log('\n🔑 关键文件:');
    console.log('   - AI_INSTRUCTIONS.md: 完整的AI开发指南');
    console.log('   - level-editor-prototype.html: 可视化关卡编辑器');
    console.log('   - LevelGTRSManager.ts: 资源管理器');
    console.log('\n📞 支持功能:');
    console.log('   - GTRS规范支持 ✅');
    console.log('   - 组件化架构 ✅');
    console.log('   - 事件驱动 ✅');
    console.log('   - TypeScript类型 ✅');
  }

  // ========== 辅助方法 ==========

  copyDirectory(source, destination) {
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }

    const files = fs.readdirSync(source);
    for (const file of files) {
      const srcPath = path.join(source, file);
      const destPath = path.join(destination, file);
      
      const stats = fs.statSync(srcPath);
      if (stats.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  updateGameConfig(gameDir, gameId, gameName, description) {
    // 更新package.json
    const packagePath = path.join(gameDir, 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      packageJson.name = gameId;
      packageJson.description = description || gameName;
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2), 'utf8');
    }
    
    // 创建GAME_DESIGN_DOCUMENT.md模板
    const gddPath = path.join(gameDir, 'GAME_DESIGN_DOCUMENT.md');
    if (!fs.existsSync(gddPath)) {
      const gddContent = `# 🎮 ${gameName} - 游戏设计文档

## 游戏概述
- **游戏ID**: ${gameId}
- **游戏名称**: ${gameName}
- **目标年龄**: 3-8岁
- **游戏类型**: [填入游戏类型]
- **预计开发时间**: [填入预计时间]

## 核心玩法
[在此处描述游戏的核心玩法]

## 游戏资源列表
| 资源类型 | 资源名称 | 用途 | 规格 |
|---------|----------|------|------|
| 背景图片 | bg_main | 主游戏背景 | 720x1280 PNG |
| 角色精灵 | player | 玩家角色 | 128x128 PNG |
| 音效 | bgm_main | 背景音乐 | MP3 格式 |
| UI元素 | button_start | 开始按钮 | 160x64 PNG |

## GTRS资源配置计划
[在此处规划GTRS资源映射]

## 开发计划
- [ ] 阶段1: 基础游戏逻辑实现
- [ ] 阶段2: 资源生成和配置
- [ ] 阶段3: UI界面开发
- [ ] 阶段4: 测试和优化

## 技术实现要点
- **游戏引擎**: Phaser 3
- **开发框架**: kids-game-frame-factory v${this.frameworkVersion}
- **资源规范**: GTRS v1.0.0
- **目标性能**: 60 FPS稳定运行`;
      
      fs.writeFileSync(gddPath, gddContent, 'utf8');
    }
  }

  initResourceConfig(gameDir, gameId) {
    const configDir = path.join(gameDir, 'src/config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // 创建初始GTRS配置
    const gtrsConfig = {
      specMeta: {
        version: '1.0.0',
        gameId: gameId,
        gameName: '请填写游戏名称',
        description: '请在此处添加游戏描述',
        author: '开发者姓名'
      },
      themeInfo: {
        themeId: gameId + '_default',
        displayName: '默认主题',
        version: '1.0.0',
        author: '开发者姓名',
        description: '默认游戏主题',
        primaryColor: '#4ECDC4',
        secondaryColor: '#FF6B6B'
      },
      globalStyle: {
        primaryColor: '#4ECDC4',
        secondaryColor: '#FF6B6B',
        accentColor: '#FFD166',
        backgroundColor: '#F7FFF7',
        textColor: '#26547C',
        fontFamily: '"Microsoft YaHei", sans-serif'
      },
      resources: {
        images: {
          scene: {
            placeholder: {
              key: 'bg_placeholder',
              src: `/themes/${gameId}_default/assets/scene/bg_placeholder.png`,
              width: 720,
              height: 1280,
              description: '背景占位图',
              tags: ['background']
            }
          },
          ui: {},
          icon: {},
          effect: {}
        },
        audio: {
          bgm: {
            placeholder: {
              key: 'bgm_placeholder',
              src: `/themes/${gameId}_default/assets/audio/bgm_placeholder.mp3`,
              format: 'mp3',
              duration: 60,
              description: '背景音乐占位',
              loop: true
            }
          },
          effect: {},
          voice: {}
        }
      }
    };
    
    fs.writeFileSync(
      path.join(configDir, 'GTRS.json'),
      JSON.stringify(gtrsConfig, null, 2),
      'utf8'
    );
  }
}

// CLI主程序
if (require.main === module) {
  const tools = new EnhancedDevTools();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'check':
    case 'verify':
      console.log('🔍 检查框架完整性...');
      tools.checkFrameworkIntegrity();
      break;
      
    case 'create':
    case 'init':
      if (args.length < 3) {
        console.error('用法: node enhance-dev-tools.js create <game-id> <game-name> [description] [game-type]');
        console.error('game-type可选值: casual, action, educational, custom (默认)');
        process.exit(1);
      }
      
      const gameId = args[1];
      const gameName = args[2];
      const description = args[3] || '';
      const gameType = args[4] || 'custom';
      
      console.log(`🎮 开始创建游戏: ${gameName} (${gameId})`);
      console.log(`🎨 游戏类型: ${gameType}`);
      console.log('='.repeat(50));
      
      tools.createNewGame(gameId, gameName, description, gameType)
        .then(result => {
          console.log('\n' + '='.repeat(50));
          tools.generateGTRSAssistant(result.path);
          console.log('\n📚 下一步:');
          console.log('   1. cd ' + result.gameId);
          console.log('   2. npm install');
          console.log('   3. npm run dev-fast');
          console.log('   4. 阅读 QUICK_START.md 和 AI_INSTRUCTIONS.md');
          
          // 显示开发指南摘要
          console.log('\n' + '='.repeat(50));
          tools.showFrameworkGuide();
        })
        .catch(err => {
          console.error('❌ 创建失败:', err.message);
          console.error('💡 提示: 确保目录不存在且游戏ID格式正确');
          process.exit(1);
        });
      break;
      
    case 'guide':
    case 'help':
      tools.showFrameworkGuide();
      break;
      
    case 'validate':
      // TODO: 实现GTRS验证功能
      console.log('🔄 GTRS配置验证功能开发中...');
      break;
      
    case 'analyze':
      // TODO: 实现依赖分析功能
      console.log('📊 项目依赖分析功能开发中...');
      break;
      
    case 'upgrade':
      // TODO: 实现框架升级检查
      console.log('🔄 框架版本升级检查功能开发中...');
      break;
      
    case 'version':
    case 'v':
      console.log(`🛠️ 增强版开发工具 v2.0`);
      console.log(`📦 框架版本: ${tools.frameworkVersion}`);
      console.log(`📅 更新时间: 2026-03-31`);
      break;
      
    default:
      console.log('🛠️ 增强版开发工具 v2.0');
      console.log('='.repeat(40));
      console.log('\n📖 帮助信息:');
      console.log('  node enhance-dev-tools.js <command> [options]');
      
      console.log('\n🎮 可用命令:');
      console.log('  check/verify             检查框架完整性');
      console.log('  create/init <id> <name> [desc] [type]  创建新游戏');
      console.log('  guide/help               显示开发指南');
      console.log('  validate                 验证GTRS配置');
      console.log('  analyze                  分析项目依赖');
      console.log('  upgrade                  检查框架升级');
      console.log('  version/v                显示版本信息');
      
      console.log('\n🎨 游戏类型选项 (type):');
      console.log('  casual     休闲游戏 (拼图、消消乐等)');
      console.log('  action     动作游戏 (贪吃蛇、射击等)');
      console.log('  educational 教育游戏 (学习、认知等)');
      console.log('  custom     自定义类型 (默认)');
      
      console.log('\n🚀 示例:');
      console.log('  # 创建休闲游戏');
      console.log('  node enhance-dev-tools.js create my-puzzle 拼图游戏 "益智拼图游戏" casual');
      console.log('  ');
      console.log('  # 创建动作游戏');
      console.log('  node enhance-dev-tools.js create snake-game 贪吃蛇 "经典贪吃蛇游戏" action');
      console.log('  ');
      console.log('  # 检查框架');
      console.log('  node enhance-dev-tools.js check');
      console.log('  ');
      console.log('  # 显示帮助');
      console.log('  node enhance-dev-tools.js guide');
      
      console.log('\n💡 提示: 使用 game-wizard.bat 或 GameWizard.ps1 获得交互式界面');
      console.log('     或查看 docs/DEV_TOOLS_GUIDE.md 获取详细使用说明');
      break;
  }
}

module.exports = EnhancedDevTools;