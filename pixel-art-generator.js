const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 默认配置
const DEFAULT_OUTPUT_DIR = path.join(__dirname, 'kids-game-house/games/pvz/assets/generated');
const BITART_EXECUTABLE = path.join(__dirname, 'kids-game-frame-factory/bitart-generator/target/release/bitart.exe');

/**
 * 简单的图片生成工具
 */
class PixelArtGenerator {
  constructor(options = {}) {
    this.outputDir = options.outputDir || DEFAULT_OUTPUT_DIR;
    this.bitartPath = options.bitartPath || BITART_EXECUTABLE;
    
    // 确保输出目录存在
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 生成单张图片
   */
  generate(prompt, outputFilename, options = {}) {
    const outputPath = path.join(this.outputDir, outputFilename);
    
    console.log(`🎨 生成图片: ${outputFilename}`);
    console.log(`   提示: ${prompt}`);
    
    try {
      let command = `"${this.bitartPath}" -p "${prompt}" -o "${outputPath}"`;
      
      if (options.gif) {
        command += ' -g';
      }
      
      console.log(`   执行命令: ${command}`);
      
      const result = execSync(command, {
        encoding: 'utf8',
        stdio: 'inherit'
      });
      
      console.log(`✅ 成功: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error(`❌ 失败:`, error.message);
      return null;
    }
  }

  /**
   * 生成植物图片
   */
  generatePlant(plantName, customPrompt = null) {
    const prompts = {
      'sunflower': 'pixel art sunflower, Plants vs Zombies style, retro game sprite, transparent background',
      'peashooter': 'pixel art peashooter plant, Plants vs Zombies style, green color, retro game sprite, transparent background',
      'iceshooter': 'pixel art ice shooter plant, Plants vs Zombies style, blue ice color, retro game sprite, transparent background',
      'repeater': 'pixel art repeater plant, double peashooter, Plants vs Zombies style, retro game sprite, transparent background',
      'cherrybomb': 'pixel art cherry bomb, two cherries, Plants vs Zombies style, red color, retro game sprite, transparent background',
      'potatomine': 'pixel art potato mine, Plants vs Zombies style, brown potato, retro game sprite, transparent background',
      'wallnut': 'pixel art walnut plant, tough defense, Plants vs Zombies style, brown color, retro game sprite, transparent background'
    };
    
    const prompt = customPrompt || prompts[plantName] || prompts['peashooter'];
    return this.generate(prompt, `${plantName}.png`);
  }

  /**
   * 生成僵尸图片
   */
  generateZombie(zombieType, customPrompt = null) {
    const prompts = {
      'normal': 'pixel art zombie, Plants vs Zombies style, retro game sprite, transparent background',
      'conehead': 'pixel art zombie with traffic cone on head, Plants vs Zombies style, retro game sprite, transparent background',
      'buckethead': 'pixel art zombie with metal bucket on head, Plants vs Zombies style, retro game sprite, transparent background',
      'newspaper': 'pixel art zombie reading newspaper, Plants vs Zombies style, retro game sprite, transparent background'
    };
    
    const prompt = customPrompt || prompts[zombieType] || prompts['normal'];
    return this.generate(prompt, `zombie-${zombieType}.png`);
  }

  /**
   * 批量生成所有植物
   */
  generateAllPlants() {
    const plants = ['sunflower', 'peashooter', 'iceshooter', 'repeater', 'cherrybomb', 'potatomine', 'wallnut'];
    const results = {};
    
    for (const plant of plants) {
      results[plant] = this.generatePlant(plant);
    }
    
    return results;
  }

  /**
   * 批量生成所有僵尸
   */
  generateAllZombies() {
    const zombies = ['normal', 'conehead', 'buckethead', 'newspaper'];
    const results = {};
    
    for (const zombie of zombies) {
      results[zombie] = this.generateZombie(zombie);
    }
    
    return results;
  }

  /**
   * 生成所有图片
   */
  async generateAll() {
    console.log('🎮 开始生成植物大战僵尸所有素材...');
    console.log('=' .repeat(60));
    
    const results = {
      plants: this.generateAllPlants(),
      zombies: this.generateAllZombies(),
      extras: {
        pea: this.generate('pixel art green pea projectile, Plants vs Zombies style, retro game sprite, transparent background', 'pea.png'),
        sun: this.generate('pixel art sun, bright yellow, Plants vs Zombies style, retro game sprite, transparent background', 'sun.png')
      }
    };
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ 生成完成!');
    console.log(`📁 输出目录: ${this.outputDir}`);
    
    return results;
  }
}

// 导出模块
module.exports = PixelArtGenerator;

// 如果直接运行此脚本
if (require.main === module) {
  const generator = new PixelArtGenerator();
  
  // 解析命令行参数
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📋 使用方法:');
    console.log('  node pixel-art-generator.js plant <name>    生成指定植物');
    console.log('  node pixel-art-generator.js zombie <type>   生成指定僵尸');
    console.log('  node pixel-art-generator.js all              生成所有图片');
    console.log('  node pixel-art-generator.js "<prompt>" <filename>  自定义生成');
    process.exit(0);
  }
  
  const command = args[0];
  
  switch (command) {
    case 'plant':
      if (args[1]) {
        generator.generatePlant(args[1]);
      }
      break;
      
    case 'zombie':
      if (args[1]) {
        generator.generateZombie(args[1]);
      }
      break;
      
    case 'all':
      generator.generateAll();
      break;
      
    default:
      // 自定义生成
      if (args[1]) {
        generator.generate(command, args[1]);
      }
  }
}
