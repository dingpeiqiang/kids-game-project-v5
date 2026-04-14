import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置路径
const ASSETS_DIR = path.join(__dirname, 'kids-game-house', 'games', 'pvz', 'public', 'themes', 'pvz', 'assets', 'scene');
const OUTPUT_SPRITES = path.join(ASSETS_DIR, 'sprites.png');
const OUTPUT_JSON = path.join(ASSETS_DIR, 'sprites.json');

// 需要打包的图片列表（按名称排序以确保一致性）
const IMAGE_NAMES = [
  'peashooter.png',
  'sunflower.png',
  'wallnut.png',
  'iceshooter.png',
  'repeater.png',
  'cherrybomb.png',
  'potatomine.png',
  'zombie_normal.png',
  'zombie_conehead.png',
  'zombie_buckethead.png',
  'zombie_newspaper.png',
  'pea.png',
  'ice_pea.png',
  'sun.png',
  'lawnmower.png',
  'shovel.png',
  'grass_tile.png'
];

/**
 * 简单的图集打包逻辑
 * 注意：这是一个基础实现，生产环境建议使用 texturepacker 或 phaser-atlas
 */
async function packAtlas() {
  console.log('📦 开始自动打包图集...');
  
  // 检查 sharp 是否安装
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch (e) {
    console.error('❌ 缺少 sharp 依赖。请运行: npm install sharp');
    return;
  }

  const images = [];
  let totalWidth = 0;
  let maxHeight = 0;
  const padding = 2;

  // 1. 读取所有图片并计算总尺寸
  for (const name of IMAGE_NAMES) {
    const filePath = path.join(ASSETS_DIR, name);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ 跳过不存在的图片: ${name}`);
      continue;
    }

    const buffer = fs.readFileSync(filePath);
    const metadata = await sharp(buffer).metadata();
    
    images.push({
      name,
      buffer,
      width: metadata.width,
      height: metadata.height
    });

    totalWidth += metadata.width + padding;
    maxHeight = Math.max(maxHeight, metadata.height);
  }

  if (images.length === 0) {
    console.error('❌ 没有找到任何图片进行打包。');
    return;
  }

  // 2. 创建画布
  const canvasWidth = totalWidth;
  const canvasHeight = maxHeight + padding * 2;
  
  // 创建一个透明的背景
  const compositeOperations = [];
  let currentX = padding;

  const frames = {};

  for (const img of images) {
    compositeOperations.push({
      input: img.buffer,
      left: currentX,
      top: padding
    });

    frames[img.name] = {
      frame: { x: currentX, y: padding, w: img.width, h: img.height },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: img.width, h: img.height },
      sourceSize: { w: img.width, h: img.height }
    };

    currentX += img.width + padding;
  }

  // 3. 合成大图
  const atlasBuffer = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite(compositeOperations)
  .png()
  .toBuffer();

  // 4. 写入文件
  fs.writeFileSync(OUTPUT_SPRITES, atlasBuffer);
  console.log(`✅ 已生成图集: ${OUTPUT_SPRITES}`);

  // 5. 生成 JSON 索引
  const jsonContent = {
    frames: frames,
    meta: {
      app: "https://github.com/lingma-ai",
      version: "1.0",
      image: "sprites.png",
      format: "RGBA8888",
      size: { w: canvasWidth, h: canvasHeight },
      scale: "1"
    }
  };

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(jsonContent, null, 2));
  console.log(`✅ 已生成索引: ${OUTPUT_JSON}`);
  console.log('🎉 图集打包完成！');
}

packAtlas();
