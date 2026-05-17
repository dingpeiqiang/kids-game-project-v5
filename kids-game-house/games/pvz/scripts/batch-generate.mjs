/**
 * PVZ 素材批量生成脚本 (Node.js + Sharp)
 * 自动生成所有 PVZ 游戏素材并缩放到目标尺寸
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_BASE = 'http://localhost:7860';

// 尺寸规格
const SIZE_SPEC = {
  plant: { width: 80, height: 80 },
  zombie: { width: 60, height: 120 },
  pea: { width: 15, height: 15 },
  sun: { width: 80, height: 80 },
  mower: { width: 100, height: 60 },
};

const ASSETS = [
  { key: 'peashooter', size: SIZE_SPEC.plant, prompt: 'Plants vs Zombies pea shooter, green pod creature with red mouth, cute cartoon style, standing pose, bright green stem, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete character, clean edges' },
  { key: 'sunflower', size: SIZE_SPEC.plant, prompt: 'Plants vs Zombies sunflower, bright yellow petals, cheerful smiling face, orange center, green stem and leaves, cute cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete character, clean edges' },
  { key: 'wallnut', size: SIZE_SPEC.plant, prompt: 'Plants vs Zombies wall-nut, brown walnut with worried expression, thick shell texture, cute cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete character, clean edges' },
  { key: 'iceshooter', size: SIZE_SPEC.plant, prompt: 'Plants vs Zombies snow pea, icy blue body, light blue pods, cold frost effect, cute cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete character, clean edges' },
  { key: 'repeater', size: SIZE_SPEC.plant, prompt: 'Plants vs Zombies repeater, two pea pods connected, bright green, angry red mouth, cute cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete character, clean edges' },
  { key: 'cherrybomb', size: SIZE_SPEC.plant, prompt: 'Plants vs Zombies cherry bomb, two bright red cherries with angry face, green stem and leaves, cute cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete character, clean edges' },
  { key: 'potatomine', size: SIZE_SPEC.plant, prompt: 'Plants vs Zombies potato mine, brown potato with mining face, dirt particles, cute cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete character, clean edges' },
  { key: 'zombie_normal', size: SIZE_SPEC.zombie, prompt: 'Plants vs Zombies zombie, shambling dead, torn purple shirt, gray skin, green hair, arms outstretched, cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete character, clean edges' },
  { key: 'zombie_conehead', size: SIZE_SPEC.zombie, prompt: 'Plants vs Zombies conehead zombie, orange traffic cone on head, torn purple shirt, gray skin, arms outstretched, cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete character, clean edges' },
  { key: 'zombie_buckethead', size: SIZE_SPEC.zombie, prompt: 'Plants vs Zombies buckethead zombie, gray metal bucket on head, torn purple shirt, gray skin, arms outstretched, cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete character, clean edges' },
  { key: 'zombie_newspaper', size: SIZE_SPEC.zombie, prompt: 'Plants vs Zombies newspaper zombie, holding newspaper, torn purple shirt, gray skin, shambling pose, cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete character, clean edges' },
  { key: 'sun', size: SIZE_SPEC.sun, prompt: 'Plants vs Zombies sun, bright yellow circle, cheerful smiling face, glowing rays, cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete object, clean edges' },
  { key: 'lawnmower', size: SIZE_SPEC.mower, prompt: 'Plants vs Zombies lawn mower, red motorized mower, cog wheels, cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete object, clean edges' },
  { key: 'shovel', size: SIZE_SPEC.plant, prompt: 'Plants vs Zombies shovel, wooden handle, metal blade, cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete object, clean edges' },
  { key: 'pea', size: SIZE_SPEC.pea, prompt: 'Plants vs Zombies pea projectile, bright green circle, cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete object, clean edges' },
  { key: 'ice_pea', size: SIZE_SPEC.pea, prompt: 'Plants vs Zombies ice pea, icy blue circle, frost effect, cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete object, clean edges' },
];

const NEG_PROMPT = 'worst quality, low quality, blurry, text, watermark, signature, cropped, out of frame, multiple characters, duplicate objects, crowd, two heads, extra limbs, messy background, complex background, cluttered background, busy background, shadow, ambient occlusion, reflection, gradient background, colored background, gradient, vignette, border, frame, edge blur, noise, grain, jpeg artifacts, deformed, bad anatomy, bad hands, extra fingers, missing fingers, ugly, disgusting';

const OUTPUT_DIR = path.join(__dirname, '../themes/pvz/assets/scene/');
const TEMP_DIR = path.join(__dirname, '../themes/pvz/generated/');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function resizeWithSharp(buffer, targetWidth, targetHeight) {
  return sharp(buffer)
    .resize(targetWidth, targetHeight, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();
}

async function generateAsset(asset) {
  console.log(`\n🎨 正在生成: ${asset.key} (${asset.size.width}x${asset.size.height})`);
  
  try {
    const response = await fetch(`${API_BASE}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: asset.prompt,
        negative_prompt: NEG_PROMPT,
        width: 1024,
        height: 1024,
        steps: 28,
        cfg_scale: 7,
        sampler_name: 'Euler a',
        batch_size: 1,
        seed: -1,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const base64 = data.images && data.images[0];
    if (!base64) throw new Error('无图片数据');

    const info = data.info ? JSON.parse(data.info) : {};
    const seed = info.seed || 0;
    console.log(`  ✅ 生成成功, seed: ${seed}`);

    // 缩放到目标尺寸
    console.log(`  📐 缩放到 ${asset.size.width}x${asset.size.height}...`);
    
    const rawBuffer = Buffer.from(base64, 'base64');
    const resizedBuffer = await resizeWithSharp(rawBuffer, asset.size.width, asset.size.height);
    
    return {
      key: asset.key,
      buffer: resizedBuffer,
      seed,
      filename: `${asset.key}.png`,
    };
  } catch (error) {
    console.error(`  ❌ 生成失败: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('🎮 PVZ 素材批量生成器');
  console.log('='.repeat(50));
  console.log(`📁 输出目录: ${OUTPUT_DIR}`);
  console.log(`📊 共 ${ASSETS.length} 个资源\n`);

  // 确保目录存在
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  const results = [];
  
  for (let i = 0; i < ASSETS.length; i++) {
    const asset = ASSETS[i];
    console.log(`[${i + 1}/${ASSETS.length}]`);
    
    const result = await generateAsset(asset);
    if (result) {
      // 保存到游戏目录
      const filepath = path.join(OUTPUT_DIR, result.filename);
      fs.writeFileSync(filepath, result.buffer);
      console.log(`  💾 已保存: ${filepath}`);
      
      // 同时保存一份到 generated 目录（原始 1024x1024）
      results.push({ ...result, filepath, status: 'success' });
    } else {
      results.push({ key: asset.key, status: 'failed' });
    }
    
    if (i < ASSETS.length - 1) {
      await sleep(2000);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📋 生成结果汇总');
  console.log('='.repeat(50));
  
  const success = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');
  
  console.log(`✅ 成功: ${success.length}/${ASSETS.length}`);
  if (failed.length > 0) {
    console.log(`❌ 失败: ${failed.length}`);
    failed.forEach(r => console.log(`   - ${r.key}`));
  }
  
  console.log('\n🎉 批量生成完成!');
}

main().catch(console.error);
