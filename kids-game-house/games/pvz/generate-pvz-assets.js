/**
 * PVZ 资源生成器 - 为 PC 端全屏重构生成全套游戏素材
 * 
 * 设计原则：
 * - 统一尺寸 80×80px，适配 5×9 网格
 * - 使用 Phaser 兼容的 PNG 格式
 * - 每种实体都有独特的视觉外观
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, 'assets', 'generated');

// 确保输出目录
if (!fs.existsSync(OUTPUT)) fs.mkdirSync(OUTPUT, { recursive: true });

const W = 80, H = 80;

// ── 工具函数 ──
function makeBuffer(draw) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${draw()}</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// ── 植物 ──

function drawPeashooter() {
  return `
    <!-- 茎 -->
    <rect x="35" y="45" width="10" height="30" rx="3" fill="#2d8a2d"/>
    <!-- 叶子 -->
    <ellipse cx="25" cy="62" rx="15" ry="8" fill="#3ba53b" transform="rotate(-20,25,62)"/>
    <ellipse cx="55" cy="65" rx="13" ry="7" fill="#3ba53b" transform="rotate(15,55,65)"/>
    <!-- 头部 -->
    <circle cx="40" cy="32" r="20" fill="#4ecb4e"/>
    <circle cx="40" cy="32" r="17" fill="#5fd85f"/>
    <!-- 嘴巴/炮管 -->
    <rect x="52" y="26" width="18" height="12" rx="4" fill="#3ba53b"/>
    <rect x="62" y="28" width="12" height="8" rx="3" fill="#2d8a2d"/>
    <!-- 嘴巴内部 -->
    <rect x="66" y="30" width="8" height="4" rx="2" fill="#1a5c1a"/>
    <!-- 眼睛 -->
    <circle cx="34" cy="28" r="6" fill="white"/>
    <circle cx="46" cy="28" r="6" fill="white"/>
    <circle cx="36" cy="27" r="3" fill="#111"/>
    <circle cx="48" cy="27" r="3" fill="#111"/>
    <circle cx="37" cy="26" r="1.2" fill="white"/>
    <circle cx="49" cy="26" r="1.2" fill="white"/>
    <!-- 高光 -->
    <ellipse cx="35" cy="20" rx="5" ry="3" fill="rgba(255,255,255,0.3)"/>
  `;
}

function drawSunflower() {
  return `
    <!-- 茎 -->
    <rect x="37" y="48" width="6" height="28" rx="3" fill="#2d8a2d"/>
    <!-- 叶子 -->
    <ellipse cx="25" cy="65" rx="12" ry="6" fill="#3ba53b" transform="rotate(-15,25,65)"/>
    <!-- 花瓣 -->
    ${Array.from({length: 10}, (_, i) => {
      const angle = i * 36 * Math.PI / 180;
      const cx = 40 + Math.cos(angle) * 22;
      const cy = 30 + Math.sin(angle) * 22;
      return `<ellipse cx="${cx}" cy="${cy}" rx="11" ry="7" fill="#ffd700" transform="rotate(${i*36},${cx},${cy})"/>`;
    }).join('\n    ')}
    <!-- 中心 -->
    <circle cx="40" cy="30" r="14" fill="#8b5e14"/>
    <circle cx="40" cy="30" r="11" fill="#a06b18"/>
    <!-- 笑脸 -->
    <circle cx="35" cy="28" r="2.5" fill="#111"/>
    <circle cx="45" cy="28" r="2.5" fill="#111"/>
    <circle cx="36" cy="27" r="1" fill="white"/>
    <circle cx="46" cy="27" r="1" fill="white"/>
    <path d="M34 34 Q40 40 46 34" stroke="#111" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  `;
}

function drawWallnut() {
  return `
    <!-- 主体 -->
    <ellipse cx="40" cy="42" rx="28" ry="32" fill="#c8923a"/>
    <ellipse cx="40" cy="42" rx="25" ry="29" fill="#d4a044"/>
    <!-- 裂纹装饰 -->
    <path d="M30 30 Q35 38 28 48" stroke="#b07828" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M48 28 Q52 36 46 45" stroke="#b07828" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <!-- 眼睛 -->
    <circle cx="33" cy="35" r="5" fill="white"/>
    <circle cx="47" cy="35" r="5" fill="white"/>
    <circle cx="34" cy="34" r="3" fill="#111"/>
    <circle cx="48" cy="34" r="3" fill="#111"/>
    <circle cx="35" cy="33" r="1.2" fill="white"/>
    <circle cx="49" cy="33" r="1.2" fill="white"/>
    <!-- 嘴巴（坚定的表情） -->
    <path d="M34 48 L46 48" stroke="#6b4410" stroke-width="2.5" stroke-linecap="round"/>
    <!-- 高光 -->
    <ellipse cx="32" cy="25" rx="6" ry="3" fill="rgba(255,255,255,0.2)"/>
  `;
}

function drawIceShooter() {
  return `
    <!-- 茎 -->
    <rect x="35" y="45" width="10" height="30" rx="3" fill="#1a6b8a"/>
    <!-- 叶子 -->
    <ellipse cx="25" cy="62" rx="15" ry="8" fill="#2896b8" transform="rotate(-20,25,62)"/>
    <ellipse cx="55" cy="65" rx="13" ry="7" fill="#2896b8" transform="rotate(15,55,65)"/>
    <!-- 头部 -->
    <circle cx="40" cy="32" r="20" fill="#34aadd"/>
    <circle cx="40" cy="32" r="17" fill="#5cc2f0"/>
    <!-- 嘴巴/炮管 -->
    <rect x="52" y="26" width="18" height="12" rx="4" fill="#2896b8"/>
    <rect x="62" y="28" width="12" height="8" rx="3" fill="#1a6b8a"/>
    <!-- 冰晶装饰 -->
    <polygon points="65,22 68,28 62,28" fill="#a0e8ff" opacity="0.8"/>
    <polygon points="70,20 73,26 67,26" fill="#a0e8ff" opacity="0.6"/>
    <!-- 眼睛 -->
    <circle cx="34" cy="28" r="6" fill="white"/>
    <circle cx="46" cy="28" r="6" fill="white"/>
    <circle cx="36" cy="27" r="3" fill="#003"/>
    <circle cx="48" cy="27" r="3" fill="#003"/>
    <circle cx="37" cy="26" r="1.2" fill="#a0e8ff"/>
    <circle cx="49" cy="26" r="1.2" fill="#a0e8ff"/>
    <!-- 高光 -->
    <ellipse cx="35" cy="20" rx="5" ry="3" fill="rgba(255,255,255,0.4)"/>
  `;
}

function drawRepeater() {
  return `
    <!-- 茎 -->
    <rect x="35" y="45" width="10" height="30" rx="3" fill="#2d7a1d"/>
    <!-- 叶子 -->
    <ellipse cx="25" cy="62" rx="15" ry="8" fill="#38a028" transform="rotate(-20,25,62)"/>
    <ellipse cx="55" cy="65" rx="13" ry="7" fill="#38a028" transform="rotate(15,55,65)"/>
    <!-- 头部 -->
    <circle cx="40" cy="32" r="20" fill="#3ab83a"/>
    <circle cx="40" cy="32" r="17" fill="#48d048"/>
    <!-- 双炮管（上下） -->
    <rect x="52" y="22" width="18" height="8" rx="3" fill="#2d8a1d"/>
    <rect x="62" y="24" width="12" height="4" rx="2" fill="#1a6b0a"/>
    <rect x="52" y="34" width="18" height="8" rx="3" fill="#2d8a1d"/>
    <rect x="62" y="36" width="12" height="4" rx="2" fill="#1a6b0a"/>
    <!-- 炮口 -->
    <circle cx="72" cy="26" r="2.5" fill="#1a5c1a"/>
    <circle cx="72" cy="38" r="2.5" fill="#1a5c1a"/>
    <!-- 眼睛 -->
    <circle cx="34" cy="28" r="6" fill="white"/>
    <circle cx="46" cy="28" r="6" fill="white"/>
    <circle cx="36" cy="27" r="3" fill="#111"/>
    <circle cx="48" cy="27" r="3" fill="#111"/>
    <circle cx="37" cy="26" r="1.2" fill="white"/>
    <circle cx="49" cy="26" r="1.2" fill="white"/>
    <!-- 高光 -->
    <ellipse cx="35" cy="20" rx="5" ry="3" fill="rgba(255,255,255,0.3)"/>
  `;
}

function drawCherryBomb() {
  return `
    <!-- 茎 -->
    <path d="M35 30 Q40 15 45 30" stroke="#2d7a1d" stroke-width="4" fill="none" stroke-linecap="round"/>
    <!-- 叶子 -->
    <ellipse cx="40" cy="14" rx="10" ry="5" fill="#3ba53b"/>
    <!-- 左樱桃 -->
    <circle cx="28" cy="45" r="20" fill="#cc2222"/>
    <circle cx="28" cy="45" r="17" fill="#ee3333"/>
    <ellipse cx="22" cy="38" rx="5" ry="3" fill="rgba(255,255,255,0.3)"/>
    <!-- 右樱桃 -->
    <circle cx="52" cy="45" r="20" fill="#cc2222"/>
    <circle cx="52" cy="45" r="17" fill="#ee3333"/>
    <ellipse cx="46" cy="38" rx="5" ry="3" fill="rgba(255,255,255,0.3)"/>
    <!-- 左眼 -->
    <circle cx="22" cy="42" r="3" fill="white"/>
    <circle cx="23" cy="41" r="1.5" fill="#111"/>
    <circle cx="34" cy="42" r="3" fill="white"/>
    <circle cx="35" cy="41" r="1.5" fill="#111"/>
    <!-- 右眼 -->
    <circle cx="46" cy="42" r="3" fill="white"/>
    <circle cx="47" cy="41" r="1.5" fill="#111"/>
    <circle cx="58" cy="42" r="3" fill="white"/>
    <circle cx="59" cy="41" r="1.5" fill="#111"/>
    <!-- 愤怒的嘴 -->
    <path d="M24 50 L32 50" stroke="#111" stroke-width="2" stroke-linecap="round"/>
    <path d="M48 50 L56 50" stroke="#111" stroke-width="2" stroke-linecap="round"/>
    <!-- 怒气符号 -->
    <text x="60" y="25" font-size="14" fill="#ff4444" font-weight="bold">!</text>
  `;
}

function drawPotatoMine() {
  return `
    <!-- 土堆（底部） -->
    <ellipse cx="40" cy="68" rx="30" ry="10" fill="#8b6914" opacity="0.5"/>
    <!-- 主体 -->
    <ellipse cx="40" cy="48" rx="26" ry="24" fill="#c8923a"/>
    <ellipse cx="40" cy="46" rx="23" ry="21" fill="#d4a044"/>
    <!-- 眼睛 -->
    <circle cx="32" cy="40" r="5" fill="white"/>
    <circle cx="48" cy="40" r="5" fill="white"/>
    <circle cx="33" cy="39" r="3" fill="#111"/>
    <circle cx="49" cy="39" r="3" fill="#111"/>
    <circle cx="34" cy="38" r="1.2" fill="white"/>
    <circle cx="50" cy="38" r="1.2" fill="white"/>
    <!-- 嘴巴 -->
    <path d="M33 52 Q40 58 47 52" stroke="#6b4410" stroke-width="2" fill="none" stroke-linecap="round"/>
    <!-- 引信 -->
    <rect x="38" y="18" width="4" height="12" rx="2" fill="#666"/>
    <!-- 火花 -->
    <circle cx="40" cy="16" r="4" fill="#ff6600"/>
    <circle cx="40" cy="16" r="2" fill="#ffcc00"/>
  `;
}

function drawPea() {
  return `
    <circle cx="20" cy="20" r="16" fill="#44cc44"/>
    <circle cx="20" cy="20" r="13" fill="#66ee66"/>
    <ellipse cx="15" cy="14" rx="4" ry="3" fill="rgba(255,255,255,0.4)"/>
  `;
}

function drawIcePea() {
  return `
    <circle cx="20" cy="20" r="16" fill="#2288cc"/>
    <circle cx="20" cy="20" r="13" fill="#44bbff"/>
    <ellipse cx="15" cy="14" rx="4" ry="3" fill="rgba(255,255,255,0.5)"/>
    <!-- 冰晶 -->
    <polygon points="18,6 20,2 22,6" fill="#a0e8ff" opacity="0.7"/>
  `;
}

function drawSun() {
  return `
    <!-- 光芒 -->
    ${Array.from({length: 8}, (_, i) => {
      const angle = i * 45 * Math.PI / 180;
      const x1 = 30 + Math.cos(angle) * 18;
      const y1 = 30 + Math.sin(angle) * 18;
      const x2 = 30 + Math.cos(angle) * 28;
      const y2 = 30 + Math.sin(angle) * 28;
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ffd700" stroke-width="4" stroke-linecap="round"/>`;
    }).join('\n    ')}
    <!-- 主体 -->
    <circle cx="30" cy="30" r="18" fill="#ffdd00"/>
    <circle cx="30" cy="30" r="15" fill="#ffee44"/>
    <!-- 笑脸 -->
    <circle cx="25" cy="27" r="2.5" fill="#b8860b"/>
    <circle cx="35" cy="27" r="2.5" fill="#b8860b"/>
    <path d="M24 33 Q30 39 36 33" stroke="#b8860b" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <!-- 高光 -->
    <ellipse cx="24" cy="21" rx="5" ry="3" fill="rgba(255,255,255,0.4)"/>
  `;
}

// ── 僵尸 ──

function drawZombieNormal() {
  return `
    <!-- 身体 -->
    <rect x="28" y="35" width="24" height="30" rx="5" fill="#7a7a5a"/>
    <!-- 领带 -->
    <rect x="38" y="38" width="4" height="25" fill="#8b0000"/>
    <!-- 手臂（前伸） -->
    <rect x="52" y="30" width="22" height="8" rx="4" fill="#8a9a6a" transform="rotate(-10,52,34)"/>
    <!-- 左手臂 -->
    <rect x="6" y="38" width="16" height="7" rx="3" fill="#8a9a6a" transform="rotate(15,6,41)"/>
    <!-- 腿 -->
    <rect x="30" y="62" width="8" height="16" rx="3" fill="#555540"/>
    <rect x="42" y="62" width="8" height="16" rx="3" fill="#555540"/>
    <!-- 头 -->
    <circle cx="40" cy="22" r="16" fill="#8a9a6a"/>
    <circle cx="40" cy="22" r="14" fill="#9aaa7a"/>
    <!-- 眼睛 -->
    <circle cx="34" cy="20" r="4" fill="#ff4444"/>
    <circle cx="46" cy="20" r="4" fill="#ff4444"/>
    <circle cx="34" cy="20" r="2" fill="#111"/>
    <circle cx="46" cy="20" r="2" fill="#111"/>
    <!-- 嘴 -->
    <path d="M34 28 L40 26 L46 28" stroke="#555" stroke-width="1.5" fill="none"/>
    <!-- 头发 -->
    <path d="M26 18 Q28 6 40 8 Q52 6 54 18" fill="#444" stroke="#333" stroke-width="1"/>
  `;
}

function drawZombieConehead() {
  return `
    <!-- 身体 -->
    <rect x="28" y="35" width="24" height="30" rx="5" fill="#7a7a5a"/>
    <rect x="38" y="38" width="4" height="25" fill="#8b0000"/>
    <!-- 手臂 -->
    <rect x="52" y="30" width="22" height="8" rx="4" fill="#8a9a6a" transform="rotate(-10,52,34)"/>
    <rect x="6" y="38" width="16" height="7" rx="3" fill="#8a9a6a" transform="rotate(15,6,41)"/>
    <!-- 腿 -->
    <rect x="30" y="62" width="8" height="16" rx="3" fill="#555540"/>
    <rect x="42" y="62" width="8" height="16" rx="3" fill="#555540"/>
    <!-- 头 -->
    <circle cx="40" cy="24" r="16" fill="#8a9a6a"/>
    <circle cx="40" cy="24" r="14" fill="#9aaa7a"/>
    <!-- 路障 -->
    <polygon points="40,2 25,20 55,20" fill="#ff8800"/>
    <polygon points="40,6 29,20 51,20" fill="#ffaa22"/>
    <line x1="30" y1="16" x2="50" y2="16" stroke="#cc6600" stroke-width="2"/>
    <line x1="33" y1="11" x2="47" y2="11" stroke="#cc6600" stroke-width="2"/>
    <!-- 眼睛 -->
    <circle cx="34" cy="24" r="3.5" fill="#ff4444"/>
    <circle cx="46" cy="24" r="3.5" fill="#ff4444"/>
    <circle cx="34" cy="24" r="1.8" fill="#111"/>
    <circle cx="46" cy="24" r="1.8" fill="#111"/>
    <!-- 嘴 -->
    <path d="M34 32 L40 30 L46 32" stroke="#555" stroke-width="1.5" fill="none"/>
  `;
}

function drawZombieBuckethead() {
  return `
    <!-- 身体 -->
    <rect x="28" y="40" width="24" height="28" rx="5" fill="#7a7a5a"/>
    <rect x="38" y="43" width="4" height="23" fill="#8b0000"/>
    <!-- 手臂 -->
    <rect x="52" y="35" width="22" height="8" rx="4" fill="#8a9a6a" transform="rotate(-10,52,39)"/>
    <rect x="6" y="42" width="16" height="7" rx="3" fill="#8a9a6a" transform="rotate(15,6,45)"/>
    <!-- 腿 -->
    <rect x="30" y="65" width="8" height="14" rx="3" fill="#555540"/>
    <rect x="42" y="65" width="8" height="14" rx="3" fill="#555540"/>
    <!-- 头 -->
    <circle cx="40" cy="28" r="16" fill="#8a9a6a"/>
    <circle cx="40" cy="28" r="14" fill="#9aaa7a"/>
    <!-- 铁桶 -->
    <rect x="24" y="8" width="32" height="24" rx="3" fill="#888"/>
    <rect x="24" y="8" width="32" height="24" rx="3" fill="none" stroke="#666" stroke-width="2"/>
    <rect x="24" y="14" width="32" height="3" fill="#666"/>
    <rect x="24" y="22" width="32" height="3" fill="#666"/>
    <!-- 铁桶高光 -->
    <rect x="26" y="10" width="6" height="20" rx="2" fill="rgba(255,255,255,0.15)"/>
    <!-- 眼睛（从桶的缝隙看） -->
    <circle cx="34" cy="28" r="3" fill="#ff4444"/>
    <circle cx="46" cy="28" r="3" fill="#ff4444"/>
    <circle cx="34" cy="28" r="1.5" fill="#111"/>
    <circle cx="46" cy="28" r="1.5" fill="#111"/>
    <!-- 嘴 -->
    <path d="M36 35 L40 33 L44 35" stroke="#555" stroke-width="1.5" fill="none"/>
  `;
}

function drawZombieNewspaper() {
  return `
    <!-- 身体 -->
    <rect x="28" y="35" width="24" height="30" rx="5" fill="#7a7a5a"/>
    <!-- 腿 -->
    <rect x="30" y="62" width="8" height="16" rx="3" fill="#555540"/>
    <rect x="42" y="62" width="8" height="16" rx="3" fill="#555540"/>
    <!-- 左手 -->
    <rect x="6" y="38" width="16" height="7" rx="3" fill="#8a9a6a" transform="rotate(15,6,41)"/>
    <!-- 报纸（右手拿着） -->
    <rect x="48" y="20" width="28" height="36" rx="2" fill="#f5f0e0"/>
    <rect x="48" y="20" width="28" height="36" rx="2" fill="none" stroke="#ccc" stroke-width="1"/>
    <!-- 报纸标题 -->
    <rect x="52" y="24" width="20" height="3" fill="#333"/>
    <!-- 报纸内容线条 -->
    <rect x="52" y="30" width="20" height="1.5" fill="#999"/>
    <rect x="52" y="34" width="18" height="1.5" fill="#999"/>
    <rect x="52" y="38" width="20" height="1.5" fill="#999"/>
    <rect x="52" y="42" width="16" height="1.5" fill="#999"/>
    <rect x="52" y="46" width="20" height="1.5" fill="#999"/>
    <!-- 头 -->
    <circle cx="40" cy="22" r="16" fill="#8a9a6a"/>
    <circle cx="40" cy="22" r="14" fill="#9aaa7a"/>
    <!-- 眼睛（戴眼镜） -->
    <circle cx="34" cy="20" r="5" fill="none" stroke="#333" stroke-width="1.5"/>
    <circle cx="46" cy="20" r="5" fill="none" stroke="#333" stroke-width="1.5"/>
    <line x1="39" y1="20" x2="41" y2="20" stroke="#333" stroke-width="1.5"/>
    <circle cx="34" cy="20" r="2.5" fill="#ff4444"/>
    <circle cx="46" cy="20" r="2.5" fill="#ff4444"/>
    <!-- 嘴 -->
    <path d="M35 28 Q40 32 45 28" stroke="#555" stroke-width="1.5" fill="none"/>
    <!-- 头发 -->
    <path d="M26 18 Q30 6 40 8 Q50 6 54 18" fill="#444"/>
  `;
}

function drawLawnmower() {
  return `
    <!-- 底盘 -->
    <rect x="10" y="35" width="60" height="25" rx="5" fill="#cc3333"/>
    <rect x="10" y="35" width="60" height="25" rx="5" fill="none" stroke="#aa2222" stroke-width="2"/>
    <!-- 轮子 -->
    <circle cx="20" cy="63" r="8" fill="#333"/>
    <circle cx="20" cy="63" r="5" fill="#555"/>
    <circle cx="60" cy="63" r="8" fill="#333"/>
    <circle cx="60" cy="63" r="5" fill="#555"/>
    <!-- 引擎 -->
    <rect x="15" y="20" width="30" height="18" rx="3" fill="#666"/>
    <rect x="15" y="20" width="30" height="18" rx="3" fill="none" stroke="#555" stroke-width="1.5"/>
    <!-- 排气管 -->
    <rect x="45" y="22" width="12" height="6" rx="3" fill="#888"/>
    <!-- 刀片区域 -->
    <rect x="50" y="38" width="15" height="18" rx="2" fill="#999"/>
    <line x1="55" y1="40" x2="55" y2="54" stroke="#666" stroke-width="2"/>
    <line x1="60" y1="40" x2="60" y2="54" stroke="#666" stroke-width="2"/>
    <!-- 手柄 -->
    <path d="M15 38 Q8 28 15 18" stroke="#444" stroke-width="4" fill="none" stroke-linecap="round"/>
  `;
}

// ── 生成主函数 ──
async function generateAll() {
  const assets = [
    { name: 'peashooter', draw: drawPeashooter, size: [W, H] },
    { name: 'sunflower', draw: drawSunflower, size: [W, H] },
    { name: 'wallnut', draw: drawWallnut, size: [W, H] },
    { name: 'iceshooter', draw: drawIceShooter, size: [W, H] },
    { name: 'repeater', draw: drawRepeater, size: [W, H] },
    { name: 'cherrybomb', draw: drawCherryBomb, size: [W, H] },
    { name: 'potatomine', draw: drawPotatoMine, size: [W, H] },
    { name: 'pea', draw: drawPea, size: [40, 40] },
    { name: 'ice_pea', draw: drawIcePea, size: [40, 40] },
    { name: 'sun', draw: drawSun, size: [60, 60] },
    { name: 'zombie_normal', draw: drawZombieNormal, size: [W, H] },
    { name: 'zombie_conehead', draw: drawZombieConehead, size: [W, H] },
    { name: 'zombie_buckethead', draw: drawZombieBuckethead, size: [W, H] },
    { name: 'zombie_newspaper', draw: drawZombieNewspaper, size: [W, H] },
    { name: 'lawnmower', draw: drawLawnmower, size: [80, 70] },
  ];

  console.log(`开始生成 ${assets.length} 张资源...`);

  for (const asset of assets) {
    const [w, h] = asset.size;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${asset.draw()}</svg>`;
    const filePath = path.join(OUTPUT, `${asset.name}.png`);
    await sharp(Buffer.from(svg)).png().toFile(filePath);
    console.log(`  ✓ ${asset.name}.png (${w}×${h})`);
  }

  console.log(`\n全部生成完毕！输出目录: ${OUTPUT}`);
}

generateAll().catch(console.error);
