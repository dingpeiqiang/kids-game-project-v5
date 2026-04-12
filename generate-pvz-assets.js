import { SDWebUI } from './game-ui-tool/dist/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置 API 地址 (请确保 sd-webui-aki 已启动)
const API_URL = 'http://localhost:7860';
const OUTPUT_DIR = path.join(__dirname, 'kids-game-house', 'games', 'pvz', 'assets');

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
    { name: 'pea.png', prompt: 'professional game asset, pea shooter bullet, round green projectile, vibrant cartoon style, clean edges, isolated on transparent background' },
    { name: 'ps-idle01.png', prompt: 'professional game asset, pea shooter plant, cute green plant with big mouth, side view, idle pose, vibrant cartoon style, clean lines, isolated' },
    { name: 'sunflower-idle.png', prompt: 'professional game asset, sunflower plant, happy face, bright yellow petals, side view, idle pose, vibrant cartoon style, clean lines, isolated' },
    { name: 'zombie1.png', prompt: 'professional game asset, cartoon zombie character, funny green skin, tattered suit, walking frame 1, side view, clean lines, isolated' },
    { name: 'zombie2.png', prompt: 'professional game asset, cartoon zombie character, funny green skin, tattered suit, walking frame 2, side view, clean lines, isolated' },
    { name: 'zombie3.png', prompt: 'professional game asset, cartoon zombie character, funny green skin, tattered suit, walking frame 3, side view, clean lines, isolated' },
    { name: 'sun1.png', prompt: 'professional game UI asset, glowing sun icon, bright yellow and orange, spinning animation frame 1, clean vector style, isolated' },
    { name: 'sun2.png', prompt: 'professional game UI asset, glowing sun icon, bright yellow and orange, spinning animation frame 2, clean vector style, isolated' },
    { name: 'grass_tile.png', prompt: 'seamless tileable grass lawn texture, top-down view, vibrant green, cartoon style, high quality, no borders' }
  ];

  for (const asset of assets) {
    try {
      console.log(`⏳ 正在生成高质量素材: ${asset.name}...`);
      const result = await sd.generateWithStyle(asset.prompt, 'cartoon', {
        width: 128,
        height: 128,
        steps: 30,
        cfgScale: 9,
        negativePrompt: 'blurry, low resolution, ugly, distorted, watermark, text, signature, realistic, photorealistic, 3d render'
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
