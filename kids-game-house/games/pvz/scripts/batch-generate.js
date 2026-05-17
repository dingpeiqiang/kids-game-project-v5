/**
 * PVZ 素材批量生成脚本
 * 自动生成所有 PVZ 游戏素材
 */

const API_BASE = 'http://localhost:7860';

// 尺寸规格
const SIZE_SPEC = {
  plant: { width: 80, height: 80 },
  zombie: { width: 60, height: 120 },
  pea: { width: 15, height: 15 },
  sun: { width: 80, height: 80 },
  mower: { width: 100, height: 60 },
  background: { width: 490, height: 290 },
};

// 资源配置
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

// 负面提示词
const NEG_PROMPT = 'worst quality, low quality, blurry, text, watermark, signature, cropped, out of frame, multiple characters, duplicate objects, crowd, two heads, extra limbs, messy background, complex background, cluttered background, busy background, shadow, ambient occlusion, reflection, gradient background, colored background, gradient, vignette, border, frame, edge blur, noise, grain, jpeg artifacts, deformed, bad anatomy, bad hands, extra fingers, missing fingers, ugly, disgusting';

// 输出目录
const OUTPUT_DIR = 'd:/工作/sitech/项目/研发/git_workspace/AI/kids-game-project-v5/kids-game-house/themes/pvz/assets/scene/';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function resizeImage(base64, targetWidth, targetHeight) {
  // 创建 Canvas 进行缩放
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, targetWidth, targetHeight);
      
      const scale = Math.min(targetWidth / img.width, targetHeight / img.height);
      const scaledW = img.width * scale;
      const scaledH = img.height * scale;
      const dx = (targetWidth - scaledW) / 2;
      const dy = (targetHeight - scaledH) / 2;
      ctx.drawImage(img, dx, dy, scaledW, scaledH);
      
      const resizedBase64 = canvas.toDataURL('image/png').replace(/^data:image\/\w+;base64,/, '');
      resolve(resizedBase64);
    };
    img.src = 'data:image/png;base64,' + base64;
  });
}

async function generateAsset(asset) {
  console.log(`\n🎨 正在生成: ${asset.key} (${asset.size.width}x${asset.size.height})`);
  
  try {
    // 调用 SD WebUI
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

    // 获取 seed
    const info = data.info ? JSON.parse(data.info) : {};
    const seed = info.seed || 0;
    console.log(`  ✅ 生成成功, seed: ${seed}`);

    // 缩放到目标尺寸
    console.log(`  📐 缩放到 ${asset.size.width}x${asset.size.height}...`);
    
    // 由于是 Node.js 环境，需要用 sharp 或其他方式缩放
    // 这里我们先生成 1024x1024，让游戏代码自己缩放
    const filename = `${asset.key}.png`;
    
    return {
      key: asset.key,
      base64,
      seed,
      filename,
      targetSize: asset.size,
    };
  } catch (error) {
    console.error(`  ❌ 生成失败: ${error.message}`);
    return null;
  }
}

async function saveImage(base64, filepath) {
  const fs = await import('fs');
  const buffer = Buffer.from(base64, 'base64');
  fs.writeFileSync(filepath, buffer);
  console.log(`  💾 已保存: ${filepath}`);
}

async function main() {
  console.log('='.repeat(50));
  console.log('🎮 PVZ 素材批量生成器');
  console.log('='.repeat(50));
  console.log(`📁 输出目录: ${OUTPUT_DIR}`);
  console.log(`📊 共 ${ASSETS.length} 个资源\n`);

  const results = [];
  
  for (let i = 0; i < ASSETS.length; i++) {
    const asset = ASSETS[i];
    console.log(`[${i + 1}/${ASSETS.length}]`);
    
    const result = await generateAsset(asset);
    if (result) {
      const filepath = `${OUTPUT_DIR}${result.filename}`;
      await saveImage(result.base64, filepath);
      results.push({ ...result, filepath, status: 'success' });
    } else {
      results.push({ key: asset.key, status: 'failed' });
    }
    
    // 间隔 2 秒，避免请求过快
    if (i < ASSETS.length - 1) {
      await sleep(2000);
    }
  }

  // 汇总
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

// 运行
main().catch(console.error);
