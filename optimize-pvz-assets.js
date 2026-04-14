/**
 * PVZ 游戏素材优化生成脚本
 * 
 * 使用 game-ui-tool 生成高质量的植物大战僵尸游戏素材
 * 包含完整度检测、自动修复和透明背景处理
 * 
 * 用法:
 *   node optimize-pvz-assets.js [gameId] [themeId]
 *   例如: node optimize-pvz-assets.js pvz pvz
 */

import { SDWebUI } from './game-ui-tool/dist/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从命令行参数获取游戏ID和主题ID
const gameId = process.argv[2] || 'pvz';
const themeId = process.argv[3] || 'pvz';

// 配置 API 地址 (请确保 sd-webui-aki 已启动)
const API_URL = 'http://localhost:7860';
const OUTPUT_DIR = path.join(__dirname, 'kids-game-house', 'games', gameId, 'public', 'themes', themeId, 'assets', 'scene');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generateOptimizedAssets() {
  console.log('🎨 开始生成优化的 PVZ 卡通风格素材...');
  
  const sd = new SDWebUI(API_URL);
  
  // 检查连接
  const isConnected = await sd.ping();
  if (!isConnected) {
    console.error('❌ 无法连接到 Stable Diffusion API，请确保服务已启动:', API_URL);
    return;
  }

  console.log('✅ 成功连接到 SD WebUI API');

  // 定义需要生成的素材列表
  const assets = [
    // ── 植物 (7种) ──
    { 
      name: 'peashooter.png', 
      prompt: 'cute pea shooter plant character, green body with leaf collar, large mouth tube, cartoon style, clean lines, professional game art, side view, transparent background',
      category: 'plant'
    },
    { 
      name: 'sunflower.png', 
      prompt: 'cheerful sunflower plant character, bright yellow petals around smiling face, green stem, cartoon style, clean lines, professional game art, side view, transparent background',
      category: 'plant'
    },
    { 
      name: 'wallnut.png', 
      prompt: 'tough walnut plant character, round brown shell body, worried cute face, green leaf on top, cartoon style, clean lines, professional game art, transparent background',
      category: 'plant'
    },
    { 
      name: 'iceshooter.png', 
      prompt: 'ice pea shooter plant, icy blue body with frost crystals, cold expression, leaf collar, cartoon style, clean lines, professional game art, side view, transparent background',
      category: 'plant'
    },
    { 
      name: 'repeater.png', 
      prompt: 'double-barrel pea shooter plant, green body with two mouth tubes, determined expression, cartoon style, clean lines, professional game art, side view, transparent background',
      category: 'plant'
    },
    { 
      name: 'cherrybomb.png', 
      prompt: 'explosive cherry bomb plant, two red cherries joined together, angry fuse, cartoon style, clean lines, professional game art, transparent background',
      category: 'plant'
    },
    { 
      name: 'potatomine.png', 
      prompt: 'potato mine plant, small brown potato body with red eyes, tiny green sprout on top, buried underground, cartoon style, clean lines, professional game art, transparent background',
      category: 'plant'
    },

    // ── 僵尸 (4种) ──
    { 
      name: 'zombie_normal.png', 
      prompt: 'classic cartoon zombie character, green decaying skin, tattered brown business suit, arms outstretched, goofy expression, cartoon style, clean lines, professional game art, side view walking pose, transparent background',
      category: 'zombie'
    },
    { 
      name: 'zombie_conehead.png', 
      prompt: 'conehead zombie character, green skin, orange traffic cone on head, tattered brown suit, arms outstretched, cartoon style, clean lines, professional game art, side view walking pose, transparent background',
      category: 'zombie'
    },
    { 
      name: 'zombie_buckethead.png', 
      prompt: 'buckethead zombie character, green skin, silver metal bucket on head, tattered brown suit, arms outstretched, cartoon style, clean lines, professional game art, side view walking pose, transparent background',
      category: 'zombie'
    },
    { 
      name: 'zombie_newspaper.png', 
      prompt: 'newspaper zombie character, green skin, holding crumpled newspaper, angry expression, tattered suit, cartoon style, clean lines, professional game art, side view walking pose, transparent background',
      category: 'zombie'
    },

    // ── 子弹 ──
    { 
      name: 'pea.png', 
      prompt: 'bright green pea projectile, round and shiny, simple clean design, cartoon style, high quality, transparent background',
      category: 'projectile'
    },
    { 
      name: 'ice_pea.png', 
      prompt: 'frozen ice pea projectile, icy blue color with frost sparkles, round and shiny, cartoon style, clean lines, high quality, transparent background',
      category: 'projectile'
    },

    // ── 阳光 ──
    { 
      name: 'sun.png', 
      prompt: 'glowing golden sun orb, bright yellow with orange gradient, warm radiating rays, cartoon style, clean vector style, high quality, transparent background',
      category: 'resource'
    },

    // ── UI/道具 ──
    { 
      name: 'lawnmower.png', 
      prompt: 'red lawnmower machine, side view, cartoon style, clean lines, simple mechanical design, professional game art, transparent background',
      category: 'prop'
    },
    { 
      name: 'shovel.png', 
      prompt: 'wooden shovel tool, brown wooden handle with metal blade, cartoon style, clean lines, simple design, transparent background',
      category: 'tool'
    },
    { 
      name: 'grass_tile.png', 
      prompt: 'seamless tileable grass lawn texture, top-down view, vibrant green with subtle darker green patches, cartoon style, high quality, no borders, professional game background, 192x192 tile',
      category: 'background'
    }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const asset of assets) {
    try {
      console.log(`\n⏳ 正在生成高质量素材: ${asset.name} (${asset.category})...`);
      
      // 使用完整度检测和自动修复功能
      const result = await sd.generateWithCompletenessCheck(
        asset.prompt,
        'cartoon', // 使用卡通风格
        {
          width: 160,
          height: 160,
          steps: 30,
          cfgScale: 7.5,
          negativePrompt: 'blurry, low resolution, ugly, distorted, watermark, text, signature, realistic, photorealistic, 3d render, messy lines, bad anatomy, cropped, incomplete, partial view',
          enableHiresFix: true,
          hrUpscaler: 'R-ESRGAN 4x+ Anime6B',
          hrScale: 2,
          denoisingStrength: 0.45,
          
          // 完整度检测选项
          checkCompleteness: true,
          autoFix: true,
          completenessThreshold: 0.8,
        }
      );
      
      if (result.result.images && result.result.images.length > 0) {
        // 获取生成的图片
        const imageBase64 = result.result.images[0].base64;
        
        // 移除背景（如果需要）
        let finalImageBase64 = imageBase64;
        if (asset.category !== 'background') {
          // 对于非背景元素，移除背景以获得透明效果
          try {
            finalImageBase64 = await SDWebUI.removeBackground(imageBase64, {
              bgColor: 'auto',
              tolerance: 40,
              feather: 3
            });
            console.log(`   🖼️  已移除背景`);
          } catch (bgError) {
            console.warn(`   ⚠️  背景移除失败，使用原图:`, bgError.message);
          }
        }
        
        // 保存文件
        const buffer = SDWebUI.base64ToBuffer(finalImageBase64);
        const outputPath = path.join(OUTPUT_DIR, asset.name);
        fs.writeFileSync(outputPath, buffer);
        
        console.log(`✅ 已保存: ${outputPath}`);
        console.log(`   📊 完整度分数: ${(result.completeness.score * 100).toFixed(1)}%`);
        console.log(`   🔧 是否自动修复: ${result.wasFixed ? '是' : '否'}`);
        
        if (result.completeness.issues.length > 0) {
          console.log(`   ⚠️  发现的问题:`);
          result.completeness.issues.forEach(issue => {
            console.log(`     - [${issue.type}] ${issue.description}`);
          });
        }
        
        successCount++;
      } else {
        console.error(`❌ 生成失败 ${asset.name}: 没有返回图片`);
        failCount++;
      }
    } catch (error) {
      console.error(`❌ 生成失败 ${asset.name}:`, error.message);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`🎉 素材生成完成！`);
  console.log(`   ✅ 成功: ${successCount} 个`);
  console.log(`   ❌ 失败: ${failCount} 个`);
  console.log(`   📁 输出目录: ${OUTPUT_DIR}`);
  console.log('='.repeat(50));
  
  if (failCount === 0) {
    console.log('✨ 所有素材均已成功生成并优化！');
  } else {
    console.log('⚠️  部分素材生成失败，请检查错误信息并重试。');
  }
}

// 执行生成
generateOptimizedAssets().catch(console.error);
