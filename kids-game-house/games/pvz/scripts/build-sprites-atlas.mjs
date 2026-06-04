import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

const SCENE_DIR = 'themes/pvz/assets/scene';
const OUTPUT_SPRITES = `${SCENE_DIR}/sprites.png`;
const OUTPUT_JSON = `${SCENE_DIR}/sprites.json`;

// 每个精灵帧尺寸（160x160）
const FRAME_W = 160;
const FRAME_H = 160;

// 精灵列表（顺序与原 sprites.json 一致）
const SPRITES = [
  'peashooter.png', 'sunflower.png', 'wallnut.png', 'iceshooter.png',
  'repeater.png', 'cherrybomb.png', 'potatomine.png', 'zombie_normal.png',
  'zombie_conehead.png', 'zombie_buckethead.png', 'zombie_newspaper.png',
  'pea.png', 'ice_pea.png', 'sun.png', 'lawnmower.png', 'shovel.png', 'grass_tile.png'
];

async function buildSpritesAtlas() {
  console.log('🎮 开始构建 sprites 图集...\n');

  const frames = {};
  let totalWidth = 0;
  const images = [];

  // 加载所有精灵图片
  for (const sprite of SPRITES) {
    const filePath = path.join(SCENE_DIR, sprite);
    try {
      const buffer = await fs.readFile(filePath);
      const img = sharp(buffer);
      const meta = await img.metadata();
      console.log(`✅ 加载: ${sprite} (${meta.width}x${meta.height})`);

      // 将 80x80 放大到 160x160，保持透明
      const resized = await sharp(buffer)
        .resize(FRAME_W, FRAME_H, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer();

      images.push({ name: sprite, buffer: resized });
      totalWidth += FRAME_W;
    } catch (e) {
      console.error(`❌ 加载失败: ${sprite} - ${e.message}`);
    }
  }

  if (images.length === 0) {
    console.error('❌ 没有可用的精灵图片');
    return;
  }

  console.log(`\n📐 图集尺寸: ${totalWidth}x${FRAME_H}`);

  // 创建空白画布
  const canvas = sharp({
    create: {
      width: totalWidth,
      height: FRAME_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  });

  // 合成所有精灵
  let xOffset = 0;
  const composites = [];

  for (const img of images) {
    frames[img.name] = {
      frame: { x: xOffset, y: 0, w: FRAME_W, h: FRAME_H },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: FRAME_W, h: FRAME_H },
      sourceSize: { w: FRAME_W, h: FRAME_H }
    };

    composites.push({
      input: img.buffer,
      left: xOffset,
      top: 0
    });

    xOffset += FRAME_W;
  }

  // 生成图集图片
  await canvas.composite(composites).png().toFile(OUTPUT_SPRITES);
  console.log(`\n💾 图集已保存: ${OUTPUT_SPRITES}`);

  // 生成 TexturePacker 格式 JSON
  const atlasJson = {
    frames,
    meta: {
      app: 'https://sharp.js.org',
      version: '2.0',
      image: 'sprites.png',
      format: 'RGBA8888',
      size: { w: totalWidth, h: FRAME_H },
      scale: '1'
    }
  };

  await fs.writeFile(OUTPUT_JSON, JSON.stringify(atlasJson, null, 2));
  console.log(`💾 图集配置已保存: ${OUTPUT_JSON}`);

  console.log('\n✅ sprites 图集构建完成!');
}

buildSpritesAtlas().catch(console.error);
