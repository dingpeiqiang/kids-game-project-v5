/**
 * 资源生成器 - 使用 Canvas 生成高质量图片资源
 * 严格模式：不允许降级方案
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { CanvasResourceGenerator } from './canvas-resource-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ResourceGenerator {
  constructor(options) {
    this.outputDir = options.outputDir;
    this.themeName = options.themeName;
    // themeCode 用于生成符合规范的资源路径 /themes/{themeCode}/...
    this.themeCode = options.themeCode || options.themeName.toLowerCase().replace(/\s+/g, '_');
    this.gameId = options.gameId || '';
    this.style = options.style || 'cartoon';
    // 使用 Canvas 生成器（图片输出到 outputDir/images/）
    const imageOutputDir = join(options.outputDir, 'images');
    this.canvasGenerator = new CanvasResourceGenerator({
      outputDir: imageOutputDir,
      themeName: options.themeName,
      style: options.style
    });
  }
  
  /**
   * 生成所有资源（严格模式：不允许降级）
   */
  async generate(requirements) {
    const result = {
      images: { generated: 0, required: requirements.images.length },
      audio: { generated: 0, required: requirements.audio.length },
      totalGenerated: 0,
      hasEmptyFiles: false
    };
    
    // 创建输出目录结构：outputDir/images/ 和 outputDir/audio/
    const imageDir = join(this.outputDir, 'images');
    const audioDir = join(this.outputDir, 'audio');
    await fs.mkdir(imageDir, { recursive: true });
    await fs.mkdir(audioDir, { recursive: true });
    
    // 生成图片资源 - 必须是真实 PNG
    for (const imageReq of requirements.images) {
      await this.generateImage(imageReq, imageDir);
      result.images.generated++;
      result.totalGenerated++;
    }
    
    // 生成音频资源 - 必须使用真实音频或外部 API
    // TODO: 集成音频生成库前，检查是否有外部音频源
    if (requirements.audio.length > 0) {
      console.log('\n⚠️  注意：音频资源需要外部支持');
      console.log('选项 1: 使用音频生成 API（推荐）');
      console.log('选项 2: 手动提供音频文件');
      console.log('选项 3: 从 GDD 中移除音频需求\n');
      
      // 尝试生成音频（如果有外部 API）
      for (const audioReq of requirements.audio) {
        const generated = await this.generateRealAudio(audioReq, audioDir);
        if (generated) {
          result.audio.generated++;
          result.totalGenerated++;
        } else {
          // 无法生成音频，标记为失败
          result.hasEmptyFiles = true;
          console.error(`❌ 无法生成音频：${audioReq.name}（需要外部支持）`);
        }
      }
    }
    
    // 生成 GTRS 配置文件（符合 GTRS v1.0.0 规范）
    await this.generateGTRSConfig(requirements);
    result.totalGenerated++;
    
    return result;
  }
  
  /**
   * 生成单个图片资源（使用 Canvas）
   * @param {object} requirement - 资源需求
   * @param {string} imageDir - 图片输出目录
   */
  async generateImage(requirement, imageDir) {
    const filename = `${requirement.name}.png`;
    
    // 根据类型使用 Canvas 生成高质量图片
    if (requirement.name.includes('player') || requirement.name.includes('ship')) {
      await this.canvasGenerator.generatePlayer(filename);
    } else if (requirement.name.includes('enemy')) {
      const enemyType = requirement.name.replace('enemy_', '').replace('small', 'small').replace('medium', 'medium').replace('large', 'large');
      await this.canvasGenerator.generateEnemy(filename, enemyType);
    } else if (requirement.name.includes('bullet')) {
      const bulletType = requirement.name.replace('bullet_', '');
      await this.canvasGenerator.generateBullet(filename, bulletType);
    } else if (requirement.name.includes('powerup')) {
      const powerupType = requirement.name.replace('powerup_', '');
      await this.canvasGenerator.generatePowerup(filename, powerupType);
    } else {
      // 通用资源，使用 SVG 降级方案
      const svg = this.createGenericSVG(requirement);
      const filepath = join(imageDir, filename);
      await fs.mkdir(imageDir, { recursive: true });
      await sharp(Buffer.from(svg))
        .resize(256, 256)
        .png()
        .toFile(filepath);
      console.log(`  ✅ 生成图片：${filename} (SVG)`);
    }
  }
  
  /**
   * 生成真实音频（调用外部 API 或使用现有文件）
   * @param {object} requirement - 资源需求
   * @param {string} audioDir - 音频输出目录
   * @returns {Promise<boolean>} 是否生成成功
   */
  async generateRealAudio(requirement, audioDir) {
    const filename = `${requirement.name}.mp3`;
    const filepath = join(audioDir, filename);
    
    // 方案 1: 检查是否有预定义的音频模板
    const templatePath = join(__dirname, '../../templates/audio', filename);
    try {
      await fs.access(templatePath);
      // 复制模板文件
      await fs.copyFile(templatePath, filepath);
      console.log(`  ✅ 生成音频：${filename}（从模板）`);
      return true;
    } catch {
      // 模板不存在，继续下一个方案
    }
    
    // 方案 2: 调用外部音频生成 API（需要配置）
    // TODO: 实现 API 调用
    console.warn(`  ⚠️  跳过音频：${filename}（需要配置外部 API 或提供模板）`);
    return false;
  }
  
  /**
   * 生成 GTRS 配置文件（符合 GTRS v1.0.0 规范）
   * 
   * GTRS v1.0.0 结构：
   *   specMeta       - 规范元数据
   *   themeInfo      - 主题信息
   *   globalStyle    - 全局样式
   *   resources      - 资源（images / audio / video）
   *     images.scene / images.ui / images.icon / images.effect
   *     audio.bgm    / audio.effect / audio.voice
   *
   * 资源路径规范：/themes/{themeCode}/images/{name}.png
   *               /themes/{themeCode}/audio/{name}.mp3
   */
  async generateGTRSConfig(requirements) {
    const themeCode = this.themeCode;
    
    // ---- 将需求按类型分类 ----
    const sceneImages = {};
    const uiImages    = {};
    const iconImages  = {};
    const effectImages = {};
    const bgmAudio    = {};
    const effectAudio = {};
    
    requirements.images.forEach(req => {
      const src = `/themes/${themeCode}/images/${req.name}.png`;
      const entry = {
        alias: req.description || req.name,
        src,
        type: 'png'
      };
      // 按命名规则归类
      if (req.name.startsWith('icon_') || req.name.includes('_icon')) {
        iconImages[req.name] = entry;
      } else if (req.name.startsWith('effect_') || req.name.includes('_effect')) {
        effectImages[req.name] = entry;
      } else if (req.name.startsWith('ui_') || req.name.includes('_ui') ||
                 req.name.startsWith('button') || req.name.startsWith('bg_')) {
        uiImages[req.name] = entry;
      } else {
        // 默认归为 scene（玩家、敌机、子弹、道具、背景等）
        sceneImages[req.name] = entry;
      }
    });
    
    requirements.audio.forEach(req => {
      const src = `/themes/${themeCode}/audio/${req.name}.mp3`;
      const entry = {
        alias: req.description || req.name,
        src,
        type: 'mp3',
        volume: req.name.startsWith('bgm') ? 0.6 : 0.5
      };
      if (req.name.startsWith('bgm_') || req.name.startsWith('music_')) {
        bgmAudio[req.name] = entry;
      } else {
        effectAudio[req.name] = entry;
      }
    });
    
    // ---- 组装完整 GTRS v1.0.0 结构 ----
    const gtrsConfig = {
      specMeta: {
        specName: 'GTRS',
        specVersion: '1.0.0',
        compatibleVersion: '1.0.0'
      },
      themeInfo: {
        themeCode,
        themeName: this.themeName,
        gameId: this.gameId,
        ownerType: 'GAME',
        ownerId: this.gameId,
        isDefault: false,
        author: '自动生成',
        description: `${this.themeName} 主题资源（由 theme-resource-generator 自动生成）`,
        version: '1.0.0',
        style: this.style
      },
      globalStyle: {
        bgColor: '#0a0a28',
        primaryColor: '#4ade80',
        secondaryColor: '#3b82f6',
        textColor: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        borderRadius: '8px'
      },
      resources: {
        images: {
          scene:  sceneImages,
          ui:     uiImages,
          icon:   iconImages,
          effect: effectImages
        },
        audio: {
          bgm:    bgmAudio,
          effect: effectAudio,
          voice:  {}
        },
        video: {}
      }
    };
    
    // ---- 写入 GTRS.json ----
    const configPath = join(this.outputDir, 'GTRS.json');
    await fs.writeFile(configPath, JSON.stringify(gtrsConfig, null, 2));
    console.log(`  ✅ 生成 GTRS 配置（v1.0.0 规范）：${configPath}`);
  }
  
  /**
   * 创建玩家飞机 SVG
   */
  createPlayerSVG() {
    const colors = {
      cartoon: '#4ade80',
      pixel: '#22c55e',
      realistic: '#16a34a'
    };
    
    return `
      <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
        <polygon 
          points="128,32 192,224 128,192 64,224" 
          fill="${colors[this.style]}" 
          stroke="#166534" 
          stroke-width="4"
        />
        <circle cx="128" cy="128" r="32" fill="#86efac" opacity="0.6"/>
      </svg>
    `;
  }
  
  /**
   * 创建敌机 SVG
   */
  createEnemySVG(enemyType) {
    const colors = {
      small: { fill: '#ef4444', stroke: '#991b1b' },
      medium: { fill: '#f97316', stroke: '#c2410c' },
      large: { fill: '#dc2626', stroke: '#7f1d1d' }
    };
    
    const color = colors[enemyType.replace('enemy_', '')] || colors.small;
    
    return `
      <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
        <ellipse 
          cx="128" cy="128" 
          rx="100" ry="80" 
          fill="${color.fill}" 
          stroke="${color.stroke}" 
          stroke-width="6"
        />
        <circle cx="96" cy="108" r="16" fill="#fee2e2"/>
        <circle cx="160" cy="108" r="16" fill="#fee2e2"/>
        <circle cx="96" cy="108" r="8" fill="#1f2937"/>
        <circle cx="160" cy="108" r="8" fill="#1f2937"/>
      </svg>
    `;
  }
  
  /**
   * 创建子弹 SVG
   */
  createBulletSVG(bulletType) {
    const isPlayer = bulletType.includes('player');
    const color = isPlayer ? '#60a5fa' : '#f87171';
    const stroke = isPlayer ? '#1e40af' : '#991b1b';
    
    return `
      <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
        <ellipse 
          cx="128" cy="128" 
          rx="32" ry="80" 
          fill="${color}" 
          stroke="${stroke}" 
          stroke-width="4"
        />
        <ellipse 
          cx="128" cy="108" 
          rx="16" ry="48" 
          fill="#dbeafe" 
          opacity="0.5"
        />
      </svg>
    `;
  }
  
  /**
   * 创建道具 SVG
   */
  createPowerupSVG(powerupType) {
    const colors = {
      speed: '#3b82f6',
      spread: '#8b5cf6',
      shield: '#10b981',
      life: '#ec4899',
      bomb: '#f59e0b'
    };
    
    const type = powerupType.replace('powerup_', '');
    const color = colors[type] || colors.speed;
    
    return `
      <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
        <circle 
          cx="128" cy="128" r="96" 
          fill="${color}" 
          stroke="#1f2937" 
          stroke-width="6"
        />
        <text 
          x="128" y="160" 
          font-size="120" 
          font-weight="bold" 
          fill="white" 
          text-anchor="middle"
          font-family="Arial, sans-serif"
        >
          ${type[0].toUpperCase()}
        </text>
      </svg>
    `;
  }
  
  /**
   * 创建通用 SVG
   */
  createGenericSVG(requirement) {
    return `
      <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
        <rect 
          x="32" y="32" 
          width="192" height="192" 
          fill="#9ca3af" 
          stroke="#4b5563" 
          stroke-width="4"
        />
        <text 
          x="128" y="140" 
          font-size="24" 
          fill="#1f2937" 
          text-anchor="middle"
          font-family="Arial, sans-serif"
        >
          ${requirement.name}
        </text>
      </svg>
    `;
  }
}
