# 🎮 游戏开发规范 - 基于贪吃蛇代码克隆

**版本**: v1.0.3  
**制定日期**: 2026-03-26  
**最后更新**: 2026-03-26  
**适用项目**: Kids Game Platform - 新游戏开发  

---

## 📋 目录

1. [开发理念](#开发理念)
2. [开发流程总览](#开发流程总览)
3. [第一阶段：设计与 GTRS 资源规范](#第一阶段设计与-gtrs-资源规范)
4. [第二阶段：GTRS 资源配置生成](#第二阶段-gtrs-资源配置生成)
5. [第三阶段：代码克隆与适配](#第三阶段代码克隆与适配)
6. [第四阶段：游戏注册与部署](#第四阶段游戏注册与部署)
7. [资源格式规范](#资源格式规范)
8. [最小化改动原则](#最小化改动原则)
9. [检查清单](#检查清单)
10. [附录](#附录)

---

## 🎯 开发理念

### 核心思想

**✅ 已验证架构最大化复用**  
贪吃蛇项目已经测试通过，其架构、通信、状态管理等核心逻辑应当直接复用。

**✅ 最小化改动适配新游戏**  
只修改与游戏特定逻辑相关的部分，其他部分保持 100% 一致。

**✅ 规范化资源配置**  
严格按照GTRS规范组织资源，确保主题系统兼容性。

**✅ 工具化自动化**  
使用 Node.js 脚本自动生成资源和注册游戏，减少手动操作。

**✅ UI 组件完全复用**  
游戏首页、难度选择、进度加载、顶部工具栏、结束界面等 UI 组件 100% 复用，只聚焦游戏核心玩法实现。

### 复用策略详解

#### 🎨 UI 组件层 - 100% 复用

**完全不需要修改的组件**：

| 组件 | 文件路径 | 功能说明 | 复用度 |
|------|----------|----------|--------|
| **游戏首页** | `src/views/HomeView.vue` | 平台首页，展示所有游戏列表 | 100% |
| **难度选择** | `src/components/DifficultySelector.vue` | 游戏开始前选择难度级别 | 100% |
| **进度加载** | `src/components/LoadingProgress.vue` | 显示资源加载进度条 | 100% |
| **顶部工具栏** | `src/components/GameToolbar.vue` | 返回、暂停、音量控制等 | 100% |
| **游戏结束** | `src/views/GameOverView.vue` | 显示分数、星级评价、重来按钮 | 100% |
| **开始界面** | `src/views/StartView.vue` | 游戏标题、开始按钮、说明 | ~90% |

**只需修改文本的组件**：

| 组件 | 修改内容 | 复用度 |
|------|----------|--------|
| `StartView.vue` | 游戏标题、描述文本 | 90% |
| `GameView.vue` | 画布尺寸（可选） | 95% |

#### ⚙️ 核心逻辑层 - 高度复用

| 层次 | 复用度 | 说明 |
|------|--------|------|
| **平台通信层** | 100% | platformApi.ts、消息桥接 |
| **状态管理层** | ~80% | stores/game.ts 核心逻辑 |
| **路由配置** | 100% | router/index.ts |
| **构建配置** | 100% | vite.config.ts |
| **工具函数** | 100% | utils/ 目录 |
| **GTRS 系统** | 100% | Schema、校验、加载器 |

#### 🎮 游戏逻辑层 - 按需定制

| 层次 | 复用度 | 说明 |
|------|--------|------|
| **Phaser 初始化** | 100% | PhaserGame.ts 框架 |
| **场景基类** | ~70% | BaseScene.ts 通用逻辑 |
| **游戏对象** | ~30% | 玩家、敌人、道具等特定对象 |
| **游戏规则** | 0% | 碰撞检测、得分规则等 |
| **资源配置** | 100% | GTRS.json 结构 |

---

### 核心理念：聚焦游戏核心玩法

**你应该做的**：
- ✅ 设计独特的游戏玩法和规则
- ✅ 创建游戏特定的美术资源（通过 Sharp 脚本生成）
- ✅ 实现 Phaser 游戏场景逻辑
- ✅ 配置 GTRS 资源映射

**你不应该做的**：
- ❌ 重新实现 UI 组件（难度选择、进度条、工具栏等）
- ❌ 修改平台通信逻辑
- ❌ 调整状态管理架构
- ❌ 重写游戏结束界面
- ❌ 手动绘制基础 PNG 图片（用脚本生成）
- ❌ 修改路由和构建配置

---

## 🚀 开发流程总览

### 四个阶段

```
┌─────────────────────────────────────────────────────────┐
│  第一阶段：设计与 GTRS 资源规范                            │
│  ├─ 1.1 游戏设计文档                                    │
│  ├─ 1.2 GTRS Schema 定义                                │
│  └─ 1.3 资源清单                                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  第二阶段：GTRS 资源配置生成                              │
│  ├─ 2.1 在 public/themes/default 下创建资源目录           │
│  ├─ 2.2 Node 工具生成 PNG 图片资源                        │
│  ├─ 2.3 Node 工具生成 MP3 音频资源                        │
│  └─ 2.4 生成 GTRS JSON 配置                              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  第三阶段：代码克隆与适配                                 │
│  ├─ 3.1 复制项目框架                                    │
│  ├─ 3.2 适配游戏逻辑                                    │
│  ├─ 3.3 测试验证                                        │
│  └─ 3.4 构建打包                                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  第四阶段：游戏注册与部署                                 │
│  ├─ 4.1 执行游戏注册 SQL                                │
│  ├─ 4.2 运行游戏注册脚本                                │
│  ├─ 4.3 部署到生产环境                                  │
│  └─ 4.4 验证上线                                        │
└─────────────────────────────────────────────────────────┘
```

---

## 📐 第一阶段：设计与 GTRS 资源规范

### 1.1 游戏设计文档

#### 必需内容

创建文件：`game-design.md`

```


```

#### 示例参考

查看贪吃蛇的设计文档作为参考：
- `kids-game-house/snake-vue3/SNAKE_SMOOTH_MOVEMENT_IMPLEMENTATION_COMPLETE.md`
- `kids-game-house/snake-vue3/GTRS_SELF_INSPECTION_REPORT.md`

---

### 1.2 GTRS Schema 定义

完整 GTRS.json 模板参考贪吃蛇标准配置：
- 路径：`kids-game-house/snake-vue3/src/config/GTRS.json`
- 用途：**新游戏开发时的标准参考模板**

---

### 1.3 资源清单

#### 资源清单模板

创建文件：`resource-list.md`

```
# {游戏名称} 资源清单

## 图片资源（PNG）
- background.png (720x1280) - 游戏主背景
- grid.png (720x1280) - 网格背景
- ⚠️ 根据实际游戏需求添加更多...

## 音频资源（MP3）
- bgm_main.mp3 - 主背景音乐
- bgm_gameplay.mp3 - 游戏进行音乐
- bgm_gameover.mp3 - 游戏结束音乐
- button_click.mp3 - 按钮点击音效
- action.mp3 - 游戏动作音效
```

---

## 🎨 第二阶段：GTRS 资源配置生成

### 2.1 目录结构 ⭐ 重要

#### ✅ 正确的目录树

```
kids-game-house/{game-code}/
├── public/
│   └── themes/
│       └── default/              # ⭐ 固定使用 default，不是 game_code
│           ├── audio/            # 对应 GTRS resources.audio
│           │   ├── bgm_main.mp3
│           │   └── ...
│           └── images/           # 对应 GTRS resources.images
│               ├── scene/        # images.scene 分类
│               │   ├── background.png
│               │   └── ...
│               ├── sprite/       # 精灵资源（如适用）
│               ├── ui/           # images.ui 分类
│               ├── icon/         # images.icon 分类
│               └── effect/       # images.effect 分类
├── src/
│   └── config/
│       └── GTRS.json             # GTRS 配置文件
└── scripts/
    ├── generate-resources.mjs
    └── ...
```

#### ❌ 错误的目录树（不要使用）

```
public/themes/{game_code}/        # ❌ 错误！不应该用 game_code
├── scene/
└── audio/
```

---

### 2.2 Node.js 资源生成工具 ⭐ 采用 Sharp 技术

#### 核心特点

**技术选型**: 使用 [Sharp](https://sharp.pixelplumbing.com/) 库进行图像生成和处理
- ✅ **高性能**: 基于 libvips，速度比 canvas 快 4-5 倍
- ✅ **简单易用**: 简洁的 API，无需复杂的底层操作
- ✅ **零系统依赖**: npm 直接安装，无需额外配置
- ✅ **格式丰富**: 支持 PNG、JPEG、WebP 等多种格式

**音频生成**: 使用以下两种方案之一：

**方案一（推荐）**：直接使用 fluent-ffmpeg 生成 MP3
- ✅ 简单快捷，一行代码完成转换
- ✅ 无需临时文件，内存中直接处理
- ✅ 自动清理，无残留文件

**方案二**：先生成 WAV 再转 MP3
- 使用 `fluent-ffmpeg` 或 `lamejs` 进行转换
- 生成临时 WAV → 转 MP3 → 删除 WAV

#### 安装依赖

创建文件：`scripts/package.json`

```json
{
  "name": "{game-code}-scripts",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "sharp": "^0.33.0",        // ⭐ 图像生成
    "fluent-ffmpeg": "^2.1.2"  // ⭐⭐⭐ WAV 转 MP3 工具
  }
}
```

安装命令：
```bash
cd scripts
npm install
```

**核心依赖说明**:
- ✅ **sharp** - 高性能图像生成库
- ✅ **fluent-ffmpeg** - 简单易用的 FFmpeg 封装，WAV → MP3 转换工具
- ✅ **ffmpeg** - 自动下载预编译版本（Windows/macOS/Linux）

---

#### 主生成脚本（采用 Sharp 实现）

创建文件：`scripts/generate-resources.mjs`

```javascript
/**
 * {游戏名称} GTRS 资源生成器
 * 采用 Sharp 技术生成图像资源 + fluent-ffmpeg 生成 MP3 音频
 * 
 * 功能：
 * 1. 使用 Sharp 生成 PNG 图片（高性能、简单 API）
 * 2. 生成 WAV 音频并使用 fluent-ffmpeg 转为 MP3（自动清理 WAV）
 * 3. 生成 GTRS.json 配置文件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';  // ⭐⭐⭐ WAV 转 MP3 工具

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========== 配置 ==========
const GAME_CODE = '{game-code}';  // ⚠️ 修改为实际游戏 code
const GAME_NAME = '{游戏名称}';

// ⭐ 重要：资源输出到固定的 default 目录
const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'themes', 'default');
const ASSETS_DIR = path.join(PUBLIC_DIR, 'assets');
const SCENE_DIR = path.join(ASSETS_DIR, 'scene');
const AUDIO_DIR = path.join(ASSETS_DIR, 'audio');
const OUTPUT_CONFIG = path.join(__dirname, '..', 'src', 'config', 'GTRS.json');

// 游戏设计参数
const GAME_WIDTH = 720;
const GAME_HEIGHT = 1280;

// ========== 工具函数 ==========

/**
 * 确保目录存在
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 创建目录：${dir}`);
  }
}

/**
 * 生成 PNG 图片（使用 Sharp）
 * @param {string} filename - 文件名
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {function} drawFunc - 绘制函数 (x, y, width, height) => { r, g, b, a }
 * @param {string} outputDir - 输出目录
 */
async function generatePNG(filename, width, height, drawFunc, outputDir) {
  // 创建原始数据缓冲区
  const buffer = Buffer.alloc(width * height * 4);
  
  // 填充像素数据
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = drawFunc(x, y, width, height);
      const idx = (y * width + x) * 4;
      buffer[idx] = color.r;
      buffer[idx + 1] = color.g;
      buffer[idx + 2] = color.b;
      buffer[idx + 3] = color.a;
    }
  }
  
  // 使用 Sharp 处理并保存
  const filepath = path.join(outputDir, filename);
  await sharp(buffer, {
    raw: {
      width: width,
      height: height,
      channels: 4
    }
  })
  .png()
  .toFile(filepath);
  
  console.log(`🖼️  生成图片：${filename} (${width}x${height})`);
}

/**
 * 生成 WAV 音频文件（内部使用）
 */
function generateWAVBuffer(duration, frequency, type = 'sine', volume = 0.5) {
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = Math.floor(duration * sampleRate);
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  
  // WAV 文件头
  const header = Buffer.alloc(44);
  
  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  
  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);  // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  header.writeUInt16LE(bitsPerSample, 34);
  
  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  
  // 生成音频数据
  const samples = Buffer.alloc(dataSize);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample;
    
    switch (type) {
      case 'sine':
        sample = Math.sin(2 * Math.PI * frequency * t);
        break;
      case 'square':
        sample = Math.sign(Math.sin(2 * Math.PI * frequency * t));
        break;
      case 'noise':
        sample = Math.random() * 2 - 1;
        break;
      case 'melody':
        const note = Math.floor(t * 4) % 4;
        const freqs = [frequency, frequency * 1.25, frequency * 1.5, frequency * 1.25];
        sample = Math.sin(2 * Math.PI * freqs[note] * t);
        break;
      default:
        sample = Math.sin(2 * Math.PI * frequency * t);
    }
    
    // 应用音量和渐弱
    const fadeOut = 1 - (i / numSamples) * 0.3;
    const value = Math.floor(sample * volume * 32767 * fadeOut);
    samples.writeInt16LE(Math.max(-32768, Math.min(32767, value)), i * 2);
  }
  
  return Buffer.concat([header, samples]);
}

/**
 * 生成 MP3 音频文件（使用 fluent-ffmpeg 转换）
 * @param {string} filename - 文件名（不含扩展名）
 * @param {number} duration - 时长（秒）
 * @param {number} frequency - 频率（Hz）
 * @param {string} type - 波形类型：sine/square/noise/melody
 * @param {number} volume - 音量：0.0-1.0
 */
async function generateMP3(filename, duration, frequency, type = 'sine', volume = 0.5) {
  const tempWavPath = path.join(AUDIO_DIR, `${filename}_temp.wav`);
  const mp3Path = path.join(AUDIO_DIR, `${filename}.mp3`);
  
  try {
    // 1. 生成 WAV 到临时文件
    const wavBuffer = generateWAVBuffer(duration, frequency, type, volume);
    fs.writeFileSync(tempWavPath, wavBuffer);
    
    // 2. 使用 fluent-ffmpeg 转换为 MP3
    await new Promise((resolve, reject) => {
      ffmpeg(tempWavPath)
        .outputOptions([
          '-codec:a libmp3lame',  // MP3 编码器
          '-qscale:a 2',          // 高质量（0-9，越小质量越高）
          '-vn'                   // 无视频
        ])
        .save(mp3Path)
        .on('end', () => {
          console.log(`🎵 生成音频：${filename}.mp3 (${duration}s, ${frequency}Hz, ${type})`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`❌ 转换失败：${filename}`, err.message);
          reject(err);
        });
    });
    
    // 3. 删除临时 WAV 文件
    fs.unlinkSync(tempWavPath);
    
  } catch (error) {
    console.error(`生成 ${filename} 失败:`, error);
    throw error;
  }
}

// ========== 资源生成函数 ==========

/**
 * 生成所有图片资源
 */
async function generateImages() {
  console.log('\n=== 生成图片资源 ===\n');
  
  // 确保目录存在
  ensureDir(SCENE_DIR);
  
  // 1. 游戏主背景 (720x1280)
  await generatePNG('background.png', GAME_WIDTH, GAME_HEIGHT, (x, y, w, h) => {
    // ⭐ 在这里定义背景绘制逻辑
    // 示例：深色渐变背景
    const gradient = y / h;
    const r = Math.floor(26 + gradient * 10);
    const g = Math.floor(26 + gradient * 15);
    const b = Math.floor(46 + gradient * 20);
    return { r, g, b, a: 255 };
  }, SCENE_DIR);
  
  // 2. 网格背景 (720x1280)
  await generatePNG('grid.png', GAME_WIDTH, GAME_HEIGHT, (x, y, w, h) => {
    // ⭐ 在这里定义网格绘制逻辑
    if (x >= w || y >= h) {
      return { r: 0, g: 0, b: 0, a: 0 };
    }
    
    // 绘制网格线
    const gridSize = 50;
    const isGridLine = (x % gridSize < 1) || (y % gridSize < 1);
    
    if (isGridLine) {
      return { r: 100, g: 100, b: 100, a: 80 };
    } else {
      return { r: 0, g: 0, b: 0, a: 0 };
    }
  }, SCENE_DIR);
  
  // ⚠️ 在这里添加更多游戏特定的图片
}

/**
 * 生成所有音频资源（全部输出 MP3）
 */
async function generateAudio() {
  console.log('\n=== 生成音频资源 ===\n');
  
  // 确保目录存在
  ensureDir(AUDIO_DIR);
  
  // 背景音乐
  await generateMP3('bgm_main', 180, 440, 'melody', 0.6);
  await generateMP3('bgm_gameplay', 120, 523, 'melody', 0.4);
  await generateMP3('bgm_gameover', 30, 330, 'melody', 0.5);
  
  // 音效
  await generateMP3('button_click', 0.15, 800, 'sine', 0.5);
  await generateMP3('action', 0.3, 600, 'sine', 0.6);
}

// ========== GTRS 配置生成 ==========

/**
 * 生成 GTRS.json 配置文件
 */
function generateGTRSPreview() {
  console.log('\n📄 生成 GTRS.json 配置...');
  
  const imageList = ['background', 'grid'];
  const audioList = {
    bgm: ['bgm_main', 'bgm_gameplay', 'bgm_gameover'],
    effect: ['button_click', 'action']
  };
  
  const gtrsConfig = {
    $comment: `GTRS v1.0.0 ${GAME_NAME} 内置默认主题`,
    specMeta: {
      compatibleVersion: '1.0.0',
      specName: 'GTRS',
      specVersion: '1.0.0'
    },
    themeInfo: {
      themeId: `${GAME_CODE.replace(/-/g, '_')}_default`,
      gameId: GAME_CODE,
      themeName: `${GAME_NAME} - 默认主题`,
      isDefault: true,
      author: '官方',
      description: `${GAME_NAME}默认主题配置`
    },
    globalStyle: {
      bgColor: '#1a1a2e',
      borderRadius: '8px',
      fontFamily: 'Arial, sans-serif',
      primaryColor: '#4ade80',
      secondaryColor: '#22c55e',
      textColor: '#ffffff'
    },
    resources: buildResources(imageList, audioList)
  };
  
  // 输出到两个位置
  const configOutput = path.join(__dirname, '..', 'src', 'config', 'GTRS.json');
  fs.writeFileSync(configOutput, JSON.stringify(gtrsConfig, null, 4));
  console.log(`✅ GTRS.json 已生成：${configOutput}`);
  
  const publicOutput = path.join(PUBLIC_DIR, 'GTRS.json');
  fs.writeFileSync(publicOutput, JSON.stringify(gtrsConfig, null, 4));
  console.log(`✅ GTRS.json 已复制：${publicOutput}`);
}

function buildResources(imageList, audioList) {
  return {
    images: {
      login: {},
      scene: {},
      ui: {},
      icon: {},
      effect: {}
    },
    audio: {
      bgm: {},
      effect: {},
      voice: {}
    },
    video: {}
  };
}

// ========== 主函数 ==========

async function main() {
  console.log('='.repeat(60));
  console.log(`🎮 ${GAME_NAME} GTRS 资源生成器 (Sharp + fluent-ffmpeg)`);
  console.log('='.repeat(60));
  
  // 1. 创建目录结构
  console.log('\n📂 创建目录结构...');
  ensureDir(ASSETS_DIR);
  ensureDir(SCENE_DIR);
  ensureDir(AUDIO_DIR);
  console.log(`✅ 输出位置：${PUBLIC_DIR}`);
  
  // 2. 生成图片资源（异步）
  await generateImages();
  
  // 3. 生成音频资源（异步）
  await generateAudio();
  
  // 4. 生成 GTRS.json
  generateGTRSPreview();
  
  // 5. 完成总结
  console.log('\n' + '='.repeat(60));
  console.log('✅ 所有资源生成完成！');
  console.log('='.repeat(60));
  console.log(`📊 统计:`);
  console.log(`   - 图片：2 张`);
  console.log(`   - 音频：5 首（全部为 MP3 格式）`);
  console.log(`   - 输出目录：${PUBLIC_DIR}`);
  console.log(`   - 转换工具：fluent-ffmpeg (WAV → MP3)`);
  console.log('');
}

main();
```

---

#### 独立 WAV 转 MP3 工具（可选）

如果需要将现有的 WAV 文件批量转为 MP3，可以创建独立工具：

创建文件：`scripts/convert-wav-to-mp3.mjs`

```javascript
/**
 * WAV 转 MP3 工具
 * 使用 fluent-ffmpeg 批量转换 WAV 文件为 MP3
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const AUDIO_DIR = process.argv[2] || path.join(__dirname, '..', 'public', 'themes', 'default', 'audio');
const BITRATE = '192k';  // 比特率：128k/192k/256k/320k
const QUALITY = 2;       // 质量：0-9，越小质量越高

console.log('='.repeat(60));
console.log('🎵 WAV 转 MP3 工具');
console.log('='.repeat(60));
console.log(`📂 音频目录：${AUDIO_DIR}`);
console.log(`🎼 比特率：${BITRATE}`);
console.log(`⭐ 质量：${QUALITY} (0=最高，9=最低)`);
console.log('');

// 确保目录存在
if (!fs.existsSync(AUDIO_DIR)) {
  console.error(`❌ 目录不存在：${AUDIO_DIR}`);
  process.exit(1);
}

// 查找所有 WAV 文件
const wavFiles = fs.readdirSync(AUDIO_DIR)
  .filter(file => file.toLowerCase().endsWith('.wav') && !file.includes('_temp.wav'))
  .map(file => path.join(AUDIO_DIR, file));

if (wavFiles.length === 0) {
  console.log('⚠️  未找到需要转换的 WAV 文件');
  process.exit(0);
}

console.log(`📋 找到 ${wavFiles.length} 个 WAV 文件\n`);

// 批量转换
async function convertFile(wavPath) {
  const filename = path.basename(wavPath, '.wav');
  const mp3Path = path.join(AUDIO_DIR, `${filename}.mp3`);
  
  // 跳过已存在的 MP3
  if (fs.existsSync(mp3Path)) {
    console.log(`⏭️  跳过：${filename}.mp3 (已存在)`);
    return;
  }
  
  try {
    await new Promise((resolve, reject) => {
      ffmpeg(wavPath)
        .outputOptions([
          '-codec:a libmp3lame',
          `-b:a ${BITRATE}`,
          `-qscale:a ${QUALITY}`,
          '-vn'
        ])
        .save(mp3Path)
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });
    
    console.log(`✅ 转换成功：${filename}.mp3`);
  } catch (error) {
    console.error(`❌ 转换失败：${filename}`, error.message);
  }
}

async function main() {
  for (const wavPath of wavFiles) {
    await convertFile(wavPath);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 批量转换完成！');
  console.log('='.repeat(60));
}

main();
```

**使用方法**：

```bash
# 默认转换 public/themes/default/audio 目录下的所有 WAV
cd scripts
node convert-wav-to-mp3.mjs

# 指定目录
node convert-wav-to-mp3.mjs /path/to/your/audio
```

**输出示例**：
```
============================================================
🎵 WAV 转 MP3 工具
============================================================
📂 音频目录：d:\work\public\themes\default\audio
🎼 比特率：192k
⭐ 质量：2 (0=最高，9=最低)

📋 找到 5 个 WAV 文件

✅ 转换成功：bgm_main.mp3
✅ 转换成功：bgm_gameplay.mp3
✅ 转换成功：bgm_gameover.mp3
✅ 转换成功：button_click.mp3
✅ 转换成功：action.mp3

============================================================
✅ 批量转换完成！
============================================================
```

---

## 🎮 第三阶段：代码克隆与适配

### ⭐ 重要：最大化 UI 组件复用

**核心原则**：
- ✅ **游戏首页** - 直接复用，展示所有游戏列表
- ✅ **难度选择** - 直接复用，游戏开始前选择难度
- ✅ **进度加载** - 直接复用，显示 GTRS 资源加载进度
- ✅ **顶部工具栏** - 直接复用，返回、暂停、音量控制
- ✅ **结束界面** - 直接复用，显示分数、评价、重来按钮

**你只需要关注**：
1. 🎨 使用 Sharp 脚本生成游戏资源（PNG/WAV）
2. 📝 修改 StartView 的游戏标题和描述文本
3. 🎮 实现 Phaser 游戏场景核心逻辑
4. ⚙️ 配置 GTRS.json 资源映射

---

### 3.1 复制项目框架

```bash
# 1. 复制整个项目结构
cd kids-game-house
copy snake-vue3 {game-code}-vue3

# 2. 清理不需要的文件
rm -rf {game-code}-vue3/node_modules
rm -rf {game-code}-vue3/dist

# 3. 修改 package.json
# 将 name 字段改为新游戏名称
```

### 3.2 适配游戏逻辑

**必需修改的文件**：

| 文件 | 修改内容 | 复用度 | 说明 |
|------|----------|--------|------|
| `src/config/GTRS.json` | 更新资源配置 | 30% | 修改资源映射关系 |
| `src/stores/game.ts` | 修改游戏状态逻辑 | 80% | 保留核心框架，调整游戏特定状态 |
| `src/views/StartView.vue` | 更新游戏标题、描述 | 90% | 仅修改文本内容 |
| `src/views/GameView.vue` | 调整画布尺寸（可选） | 95% | 通常不需要修改 |
| `src/phaser/PhaserGame.ts` | **核心游戏逻辑** | 30% | 保留初始化框架，重写游戏场景 |
| `public/themes/default/*` | 资源文件 | 0% | 完全重新生成 |

**完全不需要修改的文件**：

| 文件 | 功能说明 |
|------|----------|
| `src/views/HomeView.vue` | 平台首页 |
| `src/components/DifficultySelector.vue` | 难度选择器 |
| `src/components/LoadingProgress.vue` | 加载进度条 |
| `src/components/GameToolbar.vue` | 顶部工具栏 |
| `src/views/GameOverView.vue` | 游戏结束界面 |
| `src/router/index.ts` | 路由配置 |
| `vite.config.ts` | 构建配置 |
| `src/utils/platformApi.ts` | 平台 API |
| `src/stores/index.ts` | Store 配置 |

### 3.3 测试验证

**UI 组件自动生效验证**：

启动开发服务器后，验证以下 UI 组件是否正常复用：

- [ ] **游戏首页** - 能在平台首页看到新游戏图标
- [ ] **难度选择** - 点击游戏后出现难度选择器
- [ ] **进度加载** - 开始游戏时显示资源加载进度条
- [ ] **顶部工具栏** - 游戏界面上方有返回、暂停、音量按钮
- [ ] **游戏结束** - 游戏结束时显示分数统计和星级评价

```bash
# 1. 安装依赖
cd {game-code}-vue3
npm install

# 2. 启动开发服务器
npm run dev

# 3. 访问 http://localhost:3002
# 验证上述 UI 组件是否正常工作
```

**预期结果**：
- ✅ 所有 UI 组件与贪吃蛇游戏一致
- ✅ 无需手动调整任何样式和布局
- ✅ 响应式、动画效果、交互逻辑完全正常

### 3.4 构建打包

```bash
# 生产环境构建
npm run build

# 输出目录：dist/
```

---

## 🚀 第四阶段：游戏注册与部署 ⭐ 包含 t_game 和 t_theme_info

### 4.1 游戏注册 SQL 脚本

**必需包含的表**:
- ✅ `t_game` - 游戏基本信息表
- ✅ `t_theme_info` - 主题配置表（至少包含一个默认主题）

#### 标准模板

创建文件：`register-game.sql`

```sql
-- ============================================
-- {游戏名称} 游戏注册 SQL 脚本
-- 说明：将游戏注册到数据库
-- 创建时间：YYYY-MM-DD
-- ============================================

-- 1. 在游戏表中注册新游戏
INSERT INTO t_game (
    game_code,
    game_name,
    category,
    grade,
    icon_url,
    cover_url,
    description,
    game_url,
    module_path,
    status,
    sort_order,
    consume_points_per_minute,
    create_time,
    update_time
) VALUES (
    '{GAME_CODE}',                -- 游戏 code
    '{游戏名称}',                  -- 游戏名称
    '{CATEGORY}',                 -- 类型：SHOOTER/STRATEGY/PUZZLE 等
    '三年级',                     -- 年级
    '{ICON_URL}',                 -- 图标 URL
    '',                           -- 封面图
    '{DESCRIPTION}',              -- 描述
    'http://localhost:{PORT}',    -- 端口号
    NULL,
    1,                            -- 状态：active
    {SORT_ORDER},                 -- 排序
    1,                            -- 每分钟消耗积分
    UNIX_TIMESTAMP() * 1000,
    UNIX_TIMESTAMP() * 1000
) ON DUPLICATE KEY UPDATE
    game_name = VALUES(game_name),
    category = VALUES(category),
    grade = VALUES(grade),
    icon_url = VALUES(icon_url),
    description = VALUES(description),
    game_url = VALUES(game_url),
    status = VALUES(status),
    sort_order = VALUES(sort_order),
    update_time = VALUES(update_time);

-- 验证游戏插入
SELECT 
    game_id AS '游戏 ID',
    game_code AS '游戏代码',
    game_name AS '游戏名称',
    category AS '类型',
    grade AS '年级',
    game_url AS '游戏 URL',
    status AS '状态'
FROM t_game
WHERE game_code = '{GAME_CODE}';

-- 2. 插入游戏的默认主题
INSERT INTO t_theme_info (
    theme_name, 
    author_id,
    author_name,
    owner_type,
    owner_id,
    price,
    status,
    thumbnail_url,
    description,
    config_json,
    download_count,
    total_revenue,
    created_at,
    updated_at
)
SELECT 
    '{THEME_NAME}',                                          -- 主题名称
    1,                                                       -- 作者 ID
    '系统管理员',                                             -- 作者名称
    'GAME',                                                  -- 所有者类型
    (SELECT game_id FROM t_game WHERE game_code = '{GAME_CODE}'),  -- 自动获取游戏 ID
    0,                                                       -- 免费主题
    'on_sale',                                               -- 状态
    NULL,                                                    -- 缩略图
    '{DESCRIPTION}',                                         -- 描述
    '{CONFIG_JSON}',                                         -- GTRS 配置
    0,
    0,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM t_theme_info 
    WHERE theme_name = '{THEME_NAME}' 
    AND owner_id = (SELECT game_id FROM t_game WHERE game_code = '{GAME_CODE}')
);

-- 3. 查询验证
SELECT 
    theme_id AS '主题 ID',
    theme_name AS '主题名称',
    owner_type AS '所有者类型',
    owner_id AS '所有者 ID',
    price AS '价格',
    status AS '状态',
    download_count AS '下载次数',
    description AS '描述'
FROM t_theme_info
WHERE owner_type = 'GAME' 
  AND owner_id = (SELECT game_id FROM t_game WHERE game_code = '{GAME_CODE}')
ORDER BY theme_id;

-- 4. 完成提示
SELECT '✅ {游戏名称} 游戏和主题注册完成！' AS '执行结果';
```


### 4.2 运行游戏注册脚本

#### 方式一：直接执行 SQL

```bash
# 连接到 MySQL 并执行
mysql -u root -p kids_game_platform < register-game.sql
```

#### 方式二：使用 Node.js API（可选）

创建文件：`register-game-api.mjs`

```javascript
/**
 * 使用 Node.js API 注册游戏
 * 调用后端 REST API 完成注册
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:8080';

async function registerGame() {
  const gameData = {
    gameCode: '{GAME_CODE}',
    gameName: '{游戏名称}',
    category: '{CATEGORY}',
    grade: '三年级',
    description: '{DESCRIPTION}',
    gameUrl: 'http://localhost:{PORT}',
    status: 'active',
    sortOrder: 1,
    consumePointsPerMinute: 1
  };
  
  // 1. 注册游戏
  const response = await fetch(`${API_BASE}/admin/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gameData)
  });
  
  const result = await response.json();
  console.log('游戏注册结果:', result);
  
  // 2. 上传主题配置
  // ... 调用主题管理 API
}

registerGame();
```

### 4.3 部署到生产环境

#### 前端部署

```bash
# 1. 构建生产版本
npm run build

# 2. 将 dist 目录复制到 Web 服务器
# 例如：Nginx、Apache 等

# 3. 配置反向代理
# 将 /games/{game-code} 代理到对应的端口
```

#### 后端部署

```bash
# 1. 确认数据库已更新
# - t_game 表有记录
# - t_theme_info 表有记录

# 2. 重启后端服务
# 确保游戏列表 API 能读取到新游戏

# 3. 验证 API
GET /api/games/list
# 应该返回新游戏的信息
```

### 4.4 验证上线

**检查清单**:
- [ ] 游戏在平台首页可见
- [ ] 点击图标能正常加载游戏
- [ ] 游戏开始、进行中、结束流程正常
- [ ] 积分系统正常工作
- [ ] 主题切换正常（如有多个主题）
- [ ] 排行榜功能正常
- [ ] 移动端适配正常

---

## 📊 资源格式规范

### ⭐ 重要：音频格式强制要求

**所有音频资源必须使用 MP3 格式**，原因如下：

| 特性 | WAV | MP3 |
|------|-----|-----|
| **文件大小** | 大（10-50MB/分钟） | 小（1-5MB/分钟） |
| **压缩比** | 无损，原始 PCM | 有损压缩，12:1 |
| **网络加载** | ❌ 慢，占用带宽 | ✅ 快，节省流量 |
| **浏览器兼容** | ✅ 支持 | ✅ 支持 |
| **音质** | 完美 | 高质量（192kbps+ 难以区分） |
| **平台要求** | ❌ 不推荐 | ✅ 标准格式 |

**结论**：
- ✅ **背景音乐** - 必须 MP3（文件大，需压缩）
- ✅ **音效** - 必须 MP3（数量多，累积体积大）
- ❌ **WAV** - 仅作为中间格式，转换后立即删除

---

### 图片资源

| 资源类型 | 格式要求 | 尺寸建议 | 用途 |
|---------|---------|---------|------|
| **背景图** | PNG | 720x1280 | 游戏主背景 |
| **精灵图** | PNG | 按需 | 角色、道具等 |
| **UI 元素** | PNG | 按需 | 按钮、图标等 |
| **封面图** | PNG/JPEG | 400x300 | 游戏展示 |

### 音频资源

| 资源类型 | 格式要求 | 时长建议 | 用途 |
|---------|---------|---------|------|
| **背景音乐** | MP3 | 1-3 分钟 | BGM |
| **音效** | MP3 | 0.1-1 秒 | SFX |

---

## ⚡ 最小化改动原则

### 可以直接复用的部分

✅ **100% 复用**:
- `platformApi.ts` - 平台通信接口
- GTRS Schema 结构
- 资源生成脚本框架
- 游戏注册脚本框架

✅ **小幅度修改 **(80-90% 复用):
- `stores/game.ts` - 核心逻辑保留，修改游戏特定状态
- `StartView.vue` - 只修改标题、描述等文本
- `GameOverView.vue` - 只修改文本和跳转链接

✅ **中度修改 **(50-70% 复用):
- `PhaserGame.ts` - 保留初始化、通信逻辑，修改游戏场景

✅ **大量修改 **(30% 复用):
- 游戏场景类（SnakeScene → {Game}Scene）
- 游戏对象（蛇、食物 → 飞机、敌机等）
- 资源配置（GTRS.json 中的资源映射）

### 修改优先级

1. **先改资源配置** (GTRS.json、资源文件)
2. **再改游戏逻辑** (Phaser 游戏场景)
3. **最后改 UI 文本** (Vue 组件)

---

## ✅ 检查清单

### 第一阶段检查清单

- [ ] 游戏设计文档完成
- [ ] GTRS Schema 定义清晰
- [ ] 资源清单完整

### 第二阶段检查清单

- [ ] 目录结构正确 (`/themes/default/assets/`)
- [ ] 资源生成脚本可运行
- [ ] 所有 PNG 图片生成成功
- [ ] 所有 MP3 音频生成成功
- [ ] GTRS.json 配置生成并复制到两个位置

### 第三阶段检查清单

- [ ] 项目框架复制完成
- [ ] package.json 更新
- [ ] GTRS.json 配置更新
- [ ] 游戏逻辑适配完成
- [ ] 开发服务器启动成功
- [ ] 游戏能正常运行

### 第四阶段检查清单

- [ ] SQL 脚本包含 `t_game` 表插入
- [ ] SQL 脚本包含 `t_theme_info` 表插入
- [ ] 游戏注册到数据库
- [ ] 主题配置上传成功
- [ ] 后端 API 能查询到新游戏
- [ ] 前端能正常显示和启动游戏

---

## 📎 附录

### A. UI 组件复用清单 ⭐ 重要

**完全不需要修改的组件（100% 复用）**：

| 组件 | 文件路径 | 功能说明 | 验证点 |
|------|----------|----------|--------|
| 游戏首页 | `src/views/HomeView.vue` | 展示所有游戏列表 | 能看到新游戏图标 |
| 难度选择 | `src/components/DifficultySelector.vue` | 选择简单/普通/困难 | 点击游戏后弹出 |
| 进度加载 | `src/components/LoadingProgress.vue` | 显示 GTRS 资源加载进度 | 开始游戏时显示百分比 |
| 顶部工具栏 | `src/components/GameToolbar.vue` | 返回、暂停、音量控制 | 游戏界面上方可见 |
| 结束界面 | `src/views/GameOverView.vue` | 显示分数、星级、重来按钮 | 游戏结束后弹出 |
| 路由配置 | `src/router/index.ts` | 游戏路由规则 | 无需修改直接可用 |
| 构建配置 | `vite.config.ts` | Vite 打包配置 | 无需修改直接可用 |
| 平台 API | `src/utils/platformApi.ts` | 与后端通信接口 | 无需修改直接可用 |

**只需修改文本的组件（90% 复用）**：

| 组件 | 修改内容 | 示例 |
|------|----------|------|
| `StartView.vue` | 游戏标题、描述、开始按钮文本 | "贪吃蛇" |

**需要适配的组件（70-80% 复用）**：

| 组件 | 适配内容 | 说明 |
|------|----------|------|
| `stores/game.ts` | 游戏状态字段 | 分数、生命数、道具等 |
| `GameView.vue` | 画布尺寸（可选） | 通常保持 720x1280 |

**完全重新实现的部分**：

| 部分 | 文件 | 说明 |
|------|------|------|
| 游戏场景 | `src/phaser/scenes/{Game}Scene.ts` | 核心游戏玩法逻辑 |
| 游戏对象 | `src/phaser/objects/*` | 玩家、敌人、道具等 |
| 资源配置 | `src/config/GTRS.json` | 资源映射关系 |
| 资源文件 | `public/themes/default/*` | PNG/MP3 资源文件 |

---

### B. 参考项目

| 项目 | 路径 | 用途 |
|------|------|------|
| **贪吃蛇** | `snake-vue3` | 主要参考对象，UI 组件最完整 |



---

### C. 常用 SQL 查询

```sql
-- 查询所有已注册游戏
SELECT game_id, game_code, game_name, category, status 
FROM t_game 
ORDER BY sort_order;

-- 查询某个游戏的所有主题
SELECT t.theme_id, t.theme_name, t.price, t.status
FROM t_theme_info t
JOIN t_game g ON t.owner_id = g.game_id
WHERE g.game_code = '{GAME_CODE}'
  AND t.owner_type = 'GAME';

-- 查询游戏及其主题数量
SELECT 
    g.game_code,
    g.game_name,
    COUNT(t.theme_id) AS theme_count
FROM t_game g
LEFT JOIN t_theme_info t ON g.game_id = t.owner_id AND t.owner_type = 'GAME'
GROUP BY g.game_id;
```

### C. 故障排查

**问题 1: 游戏无法启动**
- 检查端口是否被占用
- 检查 GTRS.json 路径是否正确
- 查看浏览器控制台错误信息

**问题 2: 资源加载失败**
- 确认资源文件确实存在于 `/themes/default/assets/`
- 检查 GTRS.json 中的 `src` 路径是否匹配
- 查看网络请求 404 错误

**问题 3: 游戏注册后不可见**
- 确认 `t_game` 表 status = 1 (active)
- 重启后端服务刷新缓存
- 检查前端 API 调用是否正常

---

## 🎉 总结

本规范基于贪吃蛇项目的成功经验，提供了一套完整、可复用的游戏开发流程。

**核心理念**:
1. **设计先行** - 明确游戏设计和资源需求
2. **工具自动化** - 使用 Node.js 脚本生成资源
3. **最大复用** - 直接克隆已验证的代码架构
4. **规范统一** - 严格遵循 GTRS 资源配置
5. **完整注册** - 同时注册 `t_game` 和 `t_theme_info` 表

按照此规范，可以快速、稳定地开发新游戏并接入平台！🚀