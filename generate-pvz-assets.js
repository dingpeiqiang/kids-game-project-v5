import { SDWebUI } from './game-ui-tool/dist/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置 API 地址 (请确保 sd-webui-aki 已启动)
const API_URL = 'http://localhost:7860';
const OUTPUT_DIR = path.join(__dirname, 'kids-game-house', 'games', 'pvz', 'public', 'themes', 'pvz', 'assets', 'scene');

async function generateAssets() {
  console.log('🎨 开始生成 PVZ 卡通风格素材...');
  
  const sd = new SDWebUI(API_URL);
  
  // 检查连接
  const isConnected = await sd.ping();
  if (!isConnected) {
    console.error('❌ 无法连接到 Stable Diffusion API，请确保服务已启动:', API_URL);
    return;
  }

  const assets = [
    // ── 植物 (7种) ──
    { name: 'peashooter.png', prompt: 'game asset, cute pea shooter plant character, green body with leaf collar, large mouth tube, cartoon style, clean lines, professional game art, side view, transparent background' },
    { name: 'sunflower.png', prompt: 'game asset, cheerful sunflower plant character, bright yellow petals around smiling face, green stem, cartoon style, clean lines, professional game art, side view, transparent background' },
    { name: 'wallnut.png', prompt: 'game asset, tough walnut plant character, round brown shell body, worried cute face, green leaf on top, cartoon style, clean lines, professional game art, transparent background' },
    { name: 'iceshooter.png', prompt: 'game asset, ice pea shooter plant, icy blue body with frost crystals, cold expression, leaf collar, cartoon style, clean lines, professional game art, side view, transparent background' },
    { name: 'repeater.png', prompt: 'game asset, double-barrel pea shooter plant, green body with two mouth tubes, determined expression, cartoon style, clean lines, professional game art, side view, transparent background' },
    { name: 'cherrybomb.png', prompt: 'game asset, explosive cherry bomb plant, two red cherries joined together, angry fuse, cartoon style, clean lines, professional game art, transparent background' },
    { name: 'potatomine.png', prompt: 'game asset, potato mine plant, small brown potato body with red eyes, tiny green sprout on top, buried underground, cartoon style, clean lines, professional game art, transparent background' },

    // ── 僵尸 (4种) ──
    { name: 'zombie_normal.png', prompt: 'game asset, classic cartoon zombie character, green decaying skin, tattered brown business suit, arms outstretched, goofy expression, cartoon style, clean lines, professional game art, side view walking pose, transparent background' },
    { name: 'zombie_conehead.png', prompt: 'game asset, conehead zombie character, green skin, orange traffic cone on head, tattered brown suit, arms outstretched, cartoon style, clean lines, professional game art, side view walking pose, transparent background' },
    { name: 'zombie_buckethead.png', prompt: 'game asset, buckethead zombie character, green skin, silver metal bucket on head, tattered brown suit, arms outstretched, cartoon style, clean lines, professional game art, side view walking pose, transparent background' },
    { name: 'zombie_newspaper.png', prompt: 'game asset, newspaper zombie character, green skin, holding crumpled newspaper, angry expression, tattered suit, cartoon style, clean lines, professional game art, side view walking pose, transparent background' },

    // ── 子弹 ──
    { name: 'pea.png', prompt: 'game asset, bright green pea projectile, round and shiny, simple clean design, cartoon style, high quality, transparent background' },
    { name: 'ice_pea.png', prompt: 'game asset, frozen ice pea projectile, icy blue color with frost sparkles, round and shiny, cartoon style, clean lines, high quality, transparent background' },

    // ── 阳光 ──
    { name: 'sun.png', prompt: 'game UI asset, glowing golden sun orb, bright yellow with orange gradient, warm radiating rays, cartoon style, clean vector style, high quality, transparent background' },

    // ── UI/道具 ──
    { name: 'lawnmower.png', prompt: 'game asset, red lawnmower machine, side view, cartoon style, clean lines, simple mechanical design, professional game art, transparent background' },
    { name: 'shovel.png', prompt: 'game UI asset, wooden shovel tool, brown wooden handle with metal blade, cartoon style, clean lines, simple design, transparent background' },
    { name: 'grass_tile.png', prompt: 'seamless tileable grass lawn texture, top-down view, vibrant green with subtle darker green patches, cartoon style, high quality, no borders, professional game background, 192x192 tile' }
  ];

  for (const asset of assets) {
    try {
      console.log(`⏳ 正在生成高质量素材: ${asset.name}...`);
      const result = await sd.generateWithStyle(asset.prompt, 'cartoon', {
        width: 80,
        height: 80,
        steps: 28,
        cfgScale: 8,
        negativePrompt: 'blurry, low resolution, ugly, distorted, watermark, text, signature, realistic, photorealistic, 3d render, messy lines, bad anatomy',
        enableHiresFix: false
      });
      
      if (result.images && result.images.length > 0) {
        const buffer = SDWebUI.base64ToBuffer(result.images[0].base64);
        const outputPath = path.join(OUTPUT_DIR, asset.name);
        fs.writeFileSync(outputPath, buffer);
        console.log(`✅ 已保存: ${outputPath}`);
      }
    } catch (error) {
      console.error(`❌ 生成失败 ${asset.name}:`, error.message);
    }
  }

  console.log('🎉 素材生成完成！请手动更新 sprites.json 索引。');
}

generateAssets();
