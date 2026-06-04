# 🤖 AI 开发指南 — 游戏模板

> **你是 AI，这是你开发新游戏的唯一权威指南。完整阅读后再动手。**  
> **本文档已整合所有规范，无需参考其他文档。**

---

## 📋 快速索引

| 章节 | 内容 |
|------|------|
| [零、任务边界](#零任务边界必读) | 你能改什么、不能改什么 |
| [一、完整开发流程](#一完整开发流程) | 7 步完整链路 |
| [二、编写 GDD](#二编写-gdd游戏设计文档) | 游戏设计文档规范 |
| [三、生成资源](#三生成资源sharp--nodejs-wav) | Sharp 生成图片 + WAV 生成音频 |
| [四、配置文件](#四配置文件) | GTRS / 难度 / 游戏参数 |
| [五、实现 MyGameScene.ts](#五实现-mygamescenets核心工作) | 游戏逻辑开发核心 |
| [六、修改 PhaserGame.vue](#六修改-phasergamevue) | 引用你的场景类 |
| [七、数据库注册](#七数据库注册) | 注册到平台 |
| [附录 A：常用代码片段](#附录-a常用代码片段) | 复制即用 |
| [附录 B：常见错误](#附录-b常见错误与解决) | 快速排查 |

---

## 零、任务边界（必读）

### ✅ 你只能修改这 6 类文件

| 文件 | 说明 |
|------|------|
| `GAME_DESIGN_DOCUMENT.md` | 游戏设计文档（开发前必须先写）|
| `generate-resources.mjs` | 资源生成脚本（Sharp + WAV）|
| `src/scenes/MyGameScene.ts` | ⭐ **唯一必须重写的游戏逻辑文件** |
| `src/config/GTRS.json` | 主题资源路径配置 |
| `src/config/difficulty.json` | 游戏难度参数 |
| `src/config/game-config.json` / `game.config.ts` | 游戏 ID、名称等基础参数 |

> ⚠️ 可修改的是 `MyGameScene.ts`（子类），**不是** `GameScene.ts`（基类/框架文件）。

### ❌ 绝对不能修改的文件（框架层，已锁定）

```
src/scenes/GameScene.ts          ← 抽象基类，不要修改
src/router/index.ts              ← 路由已配置好
src/App.vue                      ← 全局布局
src/main.ts                      ← 初始化逻辑
src/views/StartView.vue          ← 首页（已完整）
src/views/DifficultyView.vue     ← 难度选择（已完整）
src/views/GameView.vue           ← 游戏界面（已完整）
src/views/GameOverView.vue       ← 结束界面（已完整）
src/stores/game.ts               ← 游戏状态管理
src/stores/audio.ts              ← 音效系统
src/stores/theme.ts              ← 主题系统
src/components/**                ← 所有 UI 组件
```

> 🚫 如果你觉得上述文件"需要修改"，说明思路方向错了——回到 `MyGameScene.ts`。

---

## 一、完整开发流程

```
[第 1 步] 编写 GAME_DESIGN_DOCUMENT.md（GDD）
    ↓ 确认游戏玩法、资源清单
[第 2 步] 创建 generate-resources.mjs，用 Sharp 生成 PNG + Node.js WAV 生成音频
    → node generate-resources.mjs
    ↓ 生成 public/themes/{game_code}_default/assets/ 下的所有资源文件
[第 3 步] 复制 GTRS.json 到 src/config/
    → Copy-Item public/themes/{game_code}_default/GTRS.json src/config/GTRS.json -Force
    ↓
[第 4 步] 配置 difficulty.json 难度参数
    ↓
[第 5 步] 实现 src/scenes/MyGameScene.ts（游戏逻辑核心）
    → preload() 中调用 this.preloadFromGTRS()
    → 实现三个抽象方法：createGameObjects / gameLoop / handleGameOver
    ↓
[第 6 步] 修改 src/components/game/PhaserGame.vue，引用你的场景类
    ↓
[第 7 步] 本地验证：npm run dev 启动，游戏可正常运行
    ↓
[第 8 步] 生成并执行 register-game-filled.sql 注册到数据库
```

---

## 二、编写 GDD（游戏设计文档）

在游戏目录根目录创建 `GAME_DESIGN_DOCUMENT.md`，使用 `docs/GAME_DESIGN_TEMPLATE.md` 模板。

**资源清单是最关键的部分**（直接影响后续所有步骤）：

### GDD 第4章：资源清单格式（必须严格遵守）

```markdown
### 4.1 图片资源清单

| 资源名称 | 用途描述 | 数量 | 尺寸 | 生成方式 | 优先级 |
|---------|---------|------|------|---------|--------|
| bg | 游戏背景，深蓝色渐变星空 | 1 | 1920x1080 PNG | Sharp 生成 | 必需 |
| player | 玩家飞机，流线型战斗机蓝色 | 1 | 128x128 PNG | Sharp 生成 | 必需 |
| enemy_1 | 小型敌机，红色三角形 | 1 | 64x64 PNG | Sharp 生成 | 必需 |

### 4.2 音频资源清单

| 资源名称 | 用途 | 时长 | 生成方式 | 格式 | 优先级 |
|---------|------|------|---------|------|--------|
| bgm_main | 背景音乐，轻松愉快旋律 | 120s | Node.js WAV → MP3 | MP3 | 必需 |
| sfx_shoot | 射击音效，短促爆破声 | 0.2s | Node.js WAV → MP3 | MP3 | 必需 |
| sfx_explode | 爆炸音效，低频衰减 | 0.5s | Node.js WAV → MP3 | MP3 | 必需 |
```

### ⭐ 三层对齐自查表（写代码前必须填完）

| GDD 资源名称 (key) | GTRS.json 字段路径 | 文件已生成 | 代码使用 |
|-------------------|-------------------|-----------|---------|
| `bg` | `resources.images.scene.bg` | ⬜ | `this.add.image(0, 0, 'bg')` |
| `player` | `resources.images.scene.player` | ⬜ | `this.add.image(x, y, 'player')` |
| `bgm_main` | `resources.audio.bgm.bgm_main` | ⬜ | `this.sound.play('bgm_main', {loop:true})` |
| `sfx_shoot` | `resources.audio.effect.sfx_shoot` | ⬜ | `this.sound.play('sfx_shoot')` |

> **规则**：三列的 key 必须完全一致。`preloadFromGTRS()` 自动对齐第2列和第4列，你只需保证第1列=第2列。

**命名规范**：
- ✅ 推荐：`bg`、`player`、`enemy_1`、`sfx_shoot`（英文+数字，下划线分隔）
- ❌ 禁止：逗号/波浪号范围写法（如 `tile_1,tile_2` 或 `tile_1~tile_3`）、中文命名

---

## 三、生成资源（Sharp + Node.js WAV）

### 资源生成规范

| 方案 | 推荐度 | 说明 |
|------|--------|------|
| **Sharp + Node.js WAV** | ✅ **必须使用** | 程序化生成真实图案 + 音频 |
| AI 图像生成（image_gen 工具）| ⭐ 可选辅助 | 精美插画时使用 |
| theme-resource-generator | ❌ **严禁使用** | 只生成灰色矩形 + 文字，质量极差 |

### 资源目录结构

```
kids-game-house/games/你的游戏/
├── generate-resources.mjs          ← 资源生成脚本（你需要创建）
├── public/
│   └── themes/
│       └── {game_code}_default/    ← 主题目录（命名规则：{game_code}_default）
│           ├── assets/
│           │   ├── scene/          ← 场景图片（bg.png、player.png 等）
│           │   ├── ui/             ← UI 图片（按钮、图标等）
│           │   ├── icon/           ← 图标
│           │   └── audio/          ← 音频（bgm_main.mp3、sfx_*.mp3）
│           └── GTRS.json           ← 由脚本自动生成
└── src/
    └── config/
        └── GTRS.json               ← 从上面复制过来
```

### generate-resources.mjs 完整模板

```javascript
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── 配置（根据你的游戏修改） ─────────────────────────────
const GAME_CODE = 'my-puzzle';           // 游戏代码
const THEME_CODE = `${GAME_CODE}_default`;
const GAME_NAME = '拼图游戏';
const PUBLIC_DIR = path.join(__dirname, 'public', 'themes', THEME_CODE);
const ASSETS_DIR = path.join(PUBLIC_DIR, 'assets');
const SCENE_DIR = path.join(ASSETS_DIR, 'scene');
const AUDIO_DIR = path.join(ASSETS_DIR, 'audio');

// 创建目录
[SCENE_DIR, AUDIO_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

// ─── 图片生成（Sharp） ─────────────────────────────────────
// 示例：生成渐变背景
async function generateBg() {
  const width = 800, height = 600;
  const buffer = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = y / height;
      const idx = (y * width + x) * 4;
      buffer[idx]     = Math.floor(20 + 40 * (1 - t));   // R
      buffer[idx + 1] = Math.floor(20 + 60 * (1 - t));   // G
      buffer[idx + 2] = Math.floor(60 + 100 * (1 - t));  // B
      buffer[idx + 3] = 255;
    }
  }
  await sharp(buffer, { raw: { width, height, channels: 4 } })
    .png().toFile(path.join(SCENE_DIR, 'bg.png'));
  console.log('✔ bg.png');
}

// 示例：生成彩色方块（拼图块）
async function generateTile(id, hueOffset) {
  const size = 128;
  const buffer = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const isBorder = x < 4 || x >= size - 4 || y < 4 || y >= size - 4;
      const idx = (y * size + x) * 4;
      if (isBorder) {
        buffer[idx] = buffer[idx+1] = buffer[idx+2] = 255; buffer[idx+3] = 255;
      } else {
        const grad = ((x + y + hueOffset) / (size * 2)) % 1;
        buffer[idx]     = Math.floor(255 * Math.abs(Math.sin(grad * Math.PI)));
        buffer[idx + 1] = Math.floor(255 * Math.abs(Math.sin(grad * Math.PI + 2)));
        buffer[idx + 2] = Math.floor(255 * Math.abs(Math.sin(grad * Math.PI + 4)));
        buffer[idx + 3] = 255;
      }
    }
  }
  await sharp(buffer, { raw: { width: size, height: size, channels: 4 } })
    .png().toFile(path.join(SCENE_DIR, `tile_${id}.png`));
  console.log(`✔ tile_${id}.png`);
}

// ─── 音频生成（Node.js WAV） ──────────────────────────────
function writeWAV(filename, durationSec, genSample) {
  const sampleRate = 44100;
  const numSamples = Math.floor(durationSec * sampleRate);
  const dataSize = numSamples * 2;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8); header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24); header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
  header.write('data', 36); header.writeUInt32LE(dataSize, 40);
  const samples = Buffer.alloc(dataSize);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const value = Math.max(-32767, Math.min(32767, Math.floor(genSample(t) * 32767)));
    samples.writeInt16LE(value, i * 2);
  }
  fs.writeFileSync(filename, Buffer.concat([header, samples]));
}

function generateAudio() {
  // BGM：4音符循环旋律
  writeWAV(path.join(AUDIO_DIR, 'bgm_main.wav'), 8, (t) => {
    const freqs = [262, 330, 392, 330]; // C E G E
    const note = Math.floor(t * 2) % 4;
    return Math.sin(2 * Math.PI * freqs[note] * t) * 0.4;
  });
  console.log('✔ bgm_main.wav');

  // 音效：短促点击音
  writeWAV(path.join(AUDIO_DIR, 'sfx_click.wav'), 0.15, (t) => {
    return Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 20) * 0.8;
  });
  console.log('✔ sfx_click.wav');
}

// ─── 生成 GTRS.json ────────────────────────────────────────
function generateGTRS() {
  const gtrs = {
    specMeta: { specName: 'GTRS', specVersion: '1.0.0', compatibleVersion: '1.0.0' },
    themeInfo: {
      themeCode: THEME_CODE, themeName: `${GAME_NAME}默认主题`,
      gameId: GAME_CODE, ownerType: 'GAME', ownerId: GAME_CODE,
      isDefault: true, author: '官方团队', description: `${GAME_NAME}默认主题`, version: '1.0.0'
    },
    globalStyle: {
      primaryColor: '#4ade80', secondaryColor: '#22c55e',
      bgColor: '#1a1a2e', textColor: '#ffffff', fontFamily: 'Arial, sans-serif', borderRadius: '8px'
    },
    resources: {
      images: {
        scene: {
          bg: { alias: '游戏背景', src: `/themes/${THEME_CODE}/assets/scene/bg.png`, type: 'png' },
          tile_1: { alias: '拼图块1', src: `/themes/${THEME_CODE}/assets/scene/tile_1.png`, type: 'png' },
          tile_2: { alias: '拼图块2', src: `/themes/${THEME_CODE}/assets/scene/tile_2.png`, type: 'png' }
          // 根据 GDD 补充其他资源
        },
        ui: {}, icon: {}, effect: {}
      },
      audio: {
        bgm: {
          bgm_main: { alias: '背景音乐', src: `/themes/${THEME_CODE}/assets/audio/bgm_main.mp3`, type: 'mp3', volume: 0.6 }
        },
        effect: {
          sfx_click: { alias: '点击音效', src: `/themes/${THEME_CODE}/assets/audio/sfx_click.mp3`, type: 'mp3', volume: 0.8 }
        },
        voice: {}
      },
      video: {}
    }
  };
  const outputPath = path.join(PUBLIC_DIR, 'GTRS.json');
  fs.writeFileSync(outputPath, JSON.stringify(gtrs, null, 2), 'utf8');
  console.log('✔ GTRS.json');
}

// ─── 运行 ─────────────────────────────────────────────────
(async () => {
  console.log(`🎨 生成 ${GAME_NAME} 资源...`);
  await generateBg();
  await generateTile(1, 0);
  await generateTile(2, 60);
  generateAudio();
  generateGTRS();
  console.log('✅ 资源生成完成！');
  console.log('');
  console.log('⚠️  接下来需要将 WAV 转换为 MP3，有两种方式：');
  console.log('   方式1（推荐）：cd ../../kids-game-frame-factory/tools/audio-converter && node convert.js');
  console.log('   方式2：使用 ffmpeg 命令手动转换');
  console.log('   转换后记得复制 GTRS.json：Copy-Item public/themes/${THEME_CODE}/GTRS.json src/config/GTRS.json');
})();
```

### 安装依赖并运行

```bash
cd kids-game-house/games/你的游戏
npm install sharp  # 安装 Sharp（如果还没有）
node generate-resources.mjs
```

### WAV → MP3 转换（必须，最终格式为 MP3）

**方式 1：使用框架 audio-converter 工具**
```powershell
cd kids-game-frame-factory/tools/audio-converter
node convert.js --input ../../kids-game-house/games/你的游戏/public/themes/{game_code}_default/assets/audio --output ../../kids-game-house/games/你的游戏/public/themes/{game_code}_default/assets/audio
```

**方式 2：FFmpeg（如已安装）**
```powershell
$audioDir = "kids-game-house/games/你的游戏/public/themes/{game_code}_default/assets/audio"
Get-ChildItem "$audioDir/*.wav" | ForEach-Object {
  $mp3 = $_.FullName -replace '\.wav$', '.mp3'
  ffmpeg -i $_.FullName -codec:a libmp3lame -qscale:a 2 $mp3
  Remove-Item $_.FullName  # 删除临时 WAV
}
```

### 复制 GTRS.json 到 src/config/

```powershell
# 在游戏目录下执行
Copy-Item public/themes/{game_code}_default/GTRS.json src/config/GTRS.json -Force
```

---

## 四、配置文件

### 4.1 game.config.ts

```typescript
export const GAME_CODE = 'my-puzzle'    // ← 与目录名一致
export const GAME_NAME = '拼图游戏'
export const GAME_VERSION = '1.0.0'
export const API_BASE_URL = 'http://localhost:8080'
```

### 4.2 difficulty.json

三个难度档次必须都保留（`easy` / `normal` / `hard`）：

```json
{
  "difficulties": [
    {
      "id": "easy", "label": "简单", "description": "4×4 棋盘，适合新手",
      "gridCols": 4, "gridRows": 4, "speed": 300, "scoreMultiplier": 1.0
    },
    {
      "id": "normal", "label": "普通", "description": "5×5 棋盘，一般挑战",
      "gridCols": 5, "gridRows": 5, "speed": 200, "scoreMultiplier": 1.5
    },
    {
      "id": "hard", "label": "困难", "description": "6×6 棋盘，高手专属",
      "gridCols": 6, "gridRows": 6, "speed": 150, "scoreMultiplier": 2.0
    }
  ]
}
```

> `gridCols` / `gridRows` / `speed` 会自动传入 `GameScene`，通过 `this.gridCols` 等直接读取。

### 4.3 GTRS.json（已由脚本生成，确认即可）

关键字段确认：
- `specMeta.specVersion` = `"1.0.0"`
- `themeInfo.themeCode` = `"{game_code}_default"`
- 所有 `src` 路径以 `/themes/` 开头，**不含** `/public/` 前缀
- 所有资源文件已实际存在于 `public/` 目录

---

## 五、实现 MyGameScene.ts（核心工作）

### ⭐ 三个必须实现的抽象方法

`GameScene` 是抽象基类，强制要求实现三个方法——不实现 = TypeScript 编译报错：

```typescript
protected abstract createGameObjects(): void   // 创建游戏对象
protected abstract gameLoop(time: number, delta: number): void  // 游戏主循环
protected abstract handleGameOver(): void       // 游戏结束处理
```

### 完整实现模板

```typescript
import GameScene from './GameScene'
import { useGameStore } from '@/stores/game'
import { useAudioStore } from '@/stores/audio'

export default class MyGameScene extends GameScene {

  // ─── 声明游戏对象 ─────────────────────────────────────────
  private player!: Phaser.GameObjects.Image
  private moveTimer: number = 0
  private moveInterval: number = 200

  // ─── 预加载资源（推荐：从 GTRS.json 自动加载） ───────────
  preload(): void {
    this.preloadFromGTRS()   // ⭐ 一行搞定，自动与 GTRS.json 对齐
  }

  // ─── 额外初始化（可选，必须调用 super.create()） ─────────
  create(): void {
    super.create()  // ⚠️ 第一行必须调用！框架初始化在这里完成

    // 读取难度配置（只能在 create() 之后读取）
    const gameStore = useGameStore()
    this.moveInterval = gameStore.customConfig?.speed ?? 200

    // 键盘输入
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT)
      .on('down', () => { /* 处理输入 */ })
    
    // 触摸/鼠标输入
    this.input.on('pointerdown', this.handlePointer, this)
  }

  // ✅ 必须实现：创建游戏对象
  // ⚠️ 此时 cellSize / gridCols / offsetX 均已就绪（super.create() 初始化）
  protected createGameObjects(): void {
    // 背景（GTRS key = 'bg'）
    this.add.image(this.screenW / 2, this.screenH / 2, 'bg')
      .setDisplaySize(this.screenW, this.screenH)

    // 玩家（格子中心）
    const pos = this.gridToPixelCenter(
      Math.floor(this.gridCols / 2),
      Math.floor(this.gridRows / 2)
    )
    this.player = this.add.image(pos.x, pos.y, 'player')
      .setDisplaySize(this.cellSize, this.cellSize)

    // 背景音乐
    this.sound.play('bgm_main', { loop: true, volume: 0.6 })
  }

  // ✅ 必须实现：游戏主循环（每帧调用，delta 单位毫秒）
  protected gameLoop(_time: number, delta: number): void {
    // 基于时间驱动（推荐，不受帧率影响）
    this.moveTimer += delta
    if (this.moveTimer >= this.moveInterval) {
      this.moveTimer = 0
      this.tick()
    }
  }

  // ✅ 必须实现：游戏结束
  protected handleGameOver(): void {
    if (this.isGameOver) return
    this.isGameOver = true

    const audio = useAudioStore()
    audio.playDieSound()

    // 延迟后通知 Vue 层跳转结束页面
    this.time.delayedCall(500, () => {
      this.game.events.emit('gameover', this.score)
    })
  }

  // ─── 私有方法 ──────────────────────────────────────────────
  private tick(): void {
    // 游戏核心逻辑（每"刻"执行一次）
    // this.addScore(10)         // 加分（自动触发 HUD 更新 + 升关检测）
    // this.handleGameOver()    // 条件满足时结束游戏
  }

  private handlePointer(pointer: Phaser.Input.Pointer): void {
    // 像素坐标 → 格子坐标
    const col = Math.floor((pointer.x - this.offsetX) / this.cellSize)
    const row = Math.floor((pointer.y - this.offsetY) / this.cellSize)
    if (col >= 0 && col < this.gridCols && row >= 0 && row < this.gridRows) {
      // 处理格子点击
    }
  }
}
```

### 框架提供的完整 API

```typescript
// ─── 分数 ────────────────────────────────────────────────
this.addScore(points)           // 加分（自动应用难度倍率，触发关卡升级检测）
this.score                      // 当前分数（只读）

// ─── 暂停 ────────────────────────────────────────────────
this.pauseGame()                // 暂停
this.resumeGame()               // 恢复
this.togglePause()              // 切换
this.isPaused                   // 当前是否暂停

// ─── 游戏结束 ─────────────────────────────────────────────
this.isGameOver                 // 是否已结束（用于防止重复触发）
// 手动 emit（必须在 handleGameOver 中调用）：
this.game.events.emit('gameover', this.score)

// ─── 屏幕适配（super.create() 后自动初始化） ─────────────
this.screenW / this.screenH    // 屏幕尺寸（像素）
this.cellSize                   // 格子像素大小
this.gridCols / this.gridRows  // 格子数（来自 difficulty.json）
this.offsetX / this.offsetY    // 游戏区域左上角偏移（居中用）

// ─── 坐标转换 ─────────────────────────────────────────────
this.gridToPixel(col, row)          // 格子左上角像素坐标 → { x, y }
this.gridToPixelCenter(col, row)    // 格子中心像素坐标 → { x, y }

// ─── 音效（内置，无需外部文件） ───────────────────────────
const audio = useAudioStore()
audio.playClickSound()  // 点击音
audio.playWinSound()    // 胜利音
audio.playDieSound()    // 失败音
audio.playEatSound()    // 吃到物品音
```

### Phaser 3.90 兼容性注意

```typescript
// ❌ Image/Sprite 不支持 setStrokeStyle()
sprite.setStrokeStyle(4, 0xffffff)  // TypeError!

// ✅ 用 Rectangle 实现边框
const border = this.add.rectangle(x, y, w, h).setStrokeStyle(2, 0xffffff)
// 或叠加两个 Rectangle（一大一小）
```

---

## 六、修改 PhaserGame.vue

**必须执行！** 模板默认引用占位场景 `MyGameScene`，需替换为你实际的场景类。

打开 `src/components/game/PhaserGame.vue`，找到并修改：

```typescript
// ❌ 模板默认（占位符）
import MyGameScene from '@/scenes/MyGameScene'
scene: [MyGameScene]

// ✅ 替换为你的场景类（以拼图游戏为例）
import PuzzleGameScene from '@/scenes/PuzzleGameScene'
scene: [PuzzleGameScene]
```

> 如果你的游戏逻辑直接写在 `MyGameScene.ts` 里（没有新建文件），此步可跳过。

---

## 七、数据库注册

### 7.1 生成可执行 SQL

```powershell
# 在游戏目录下执行（替换各占位符为实际值）
cd kids-game-house/games/你的游戏

$gtrs = Get-Content "src/config/GTRS.json" -Raw -Encoding UTF8
$singleLine = ($gtrs -replace "`r`n", " " -replace "`n", " " -replace "\s+", " ").Trim()
$sql = Get-Content "register-game.sql" -Raw -Encoding UTF8

$replacements = @{
    '__GAME_CODE__'  = 'my-puzzle'        # 游戏 code
    '__GAME_NAME__'  = '拼图游戏'          # 游戏名称
    '__GAME_URL__'   = 'http://localhost:5173'
    '__CATEGORY__'   = 'PUZZLE'           # MATH/LANGUAGE/SCIENCE/ART/PUZZLE
    '__GRADE__'      = '6-10岁'
    '__DESCRIPTION__'= '经典拼图游戏，锻炼观察力和记忆力'
    '__THEME_NAME__' = '拼图游戏默认主题'
    '__AUTHOR_NAME__'= '官方团队'
    '__THEME_DESC__' = '拼图游戏默认主题'
}

foreach ($key in $replacements.Keys) { $sql = $sql -replace $key, $replacements[$key] }
$sql = $sql -replace '__GTRS_JSON__', $singleLine

[System.IO.File]::WriteAllText(
    "$PWD\register-game-filled.sql", $sql,
    [System.Text.UTF8Encoding]::new($true)  # UTF-8 with BOM，避免中文乱码
)
Write-Host "✅ 已生成：register-game-filled.sql"
```

### 7.2 验证并执行

```powershell
# 验证：检查是否还有未替换的占位符（无输出 = 替换完成）
Select-String -Path "register-game-filled.sql" -Pattern "__[A-Z_]+__"

# 执行 SQL
mysql -u your_user -p your_database < register-game-filled.sql
```

### 7.3 测试通过后上架

```sql
UPDATE t_game
SET status = 2,
    publish_time = UNIX_TIMESTAMP(NOW()) * 1000,
    update_time = UNIX_TIMESTAMP(NOW()) * 1000
WHERE game_code = 'my-puzzle' AND deleted = 0;
```

### 关键表结构说明

**`t_game` 表**（游戏表，注意是 `t_` 前缀）：

| 字段 | 必填 | 说明 |
|------|------|------|
| `game_code` | ✅ | 与目录名一致 |
| `game_name` | ✅ | 游戏名称 |
| `game_url` | ✅ | `http://localhost:5173`（开发环境）|
| `category` | ✅ | `MATH`/`LANGUAGE`/`SCIENCE`/`ART`/`PUZZLE` |
| `grade` | ✅ | 适龄段，如 `6-10岁` |
| `status` | ✅ | `0`=草稿，`2`=上架 |
| `create_time`/`update_time` | ✅ | `UNIX_TIMESTAMP(NOW()) * 1000`（毫秒）|
| `deleted` | ✅ | 插入时填 `0` |

**`t_theme_info` 表**（主题表，有 `t_` 前缀，DATETIME 类型）：

| 字段 | 说明 |
|------|------|
| `owner_type` | 固定 `'GAME'` |
| `owner_id` | 对应 `t_game.game_id` |
| `config_json` | 完整 GTRS JSON（单行）|
| `created_at`/`updated_at` | `NOW()`（DATETIME，不是毫秒时间戳）|

---

## 附录 A：常用代码片段

### A.1 绘制网格背景

```typescript
protected createGameObjects(): void {
  // 网格线
  const graphics = this.add.graphics()
  graphics.lineStyle(1, 0x333333, 0.4)
  for (let c = 0; c <= this.gridCols; c++) {
    const x = this.offsetX + c * this.cellSize
    graphics.lineBetween(x, this.offsetY, x, this.offsetY + this.gridRows * this.cellSize)
  }
  for (let r = 0; r <= this.gridRows; r++) {
    const y = this.offsetY + r * this.cellSize
    graphics.lineBetween(this.offsetX, y, this.offsetX + this.gridCols * this.cellSize, y)
  }
}
```

### A.2 移动物体到格子位置

```typescript
// 立即移动
const pos = this.gridToPixelCenter(col, row)
this.player.setPosition(pos.x, pos.y)

// 平滑移动（Tween）
this.tweens.add({
  targets: this.player,
  x: pos.x, y: pos.y,
  duration: 150,
  ease: 'Linear'
})
```

### A.3 点击/触摸输入

```typescript
create(): void {
  super.create()
  // 鼠标/触摸
  this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
    const col = Math.floor((ptr.x - this.offsetX) / this.cellSize)
    const row = Math.floor((ptr.y - this.offsetY) / this.cellSize)
    if (col >= 0 && col < this.gridCols && row >= 0 && row < this.gridRows) {
      this.handleCellClick(col, row)
    }
  })
  // 键盘方向键
  const cursors = this.input.keyboard!.createCursorKeys()
  cursors.left.on('down', () => this.move(-1, 0))
  cursors.right.on('down', () => this.move(1, 0))
  cursors.up.on('down', () => this.move(0, -1))
  cursors.down.on('down', () => this.move(0, 1))
}
```

### A.4 文字显示

```typescript
// 在游戏区域内显示文字
const text = this.add.text(
  this.offsetX + this.gridCols * this.cellSize / 2,
  this.offsetY - 20,
  '关卡 1', {
    fontSize: `${Math.floor(this.cellSize * 0.5)}px`,
    color: '#ffffff',
    fontFamily: 'Arial'
  }
).setOrigin(0.5)
```

### A.5 图片显示与缩放

```typescript
// 适配格子大小的图片
const img = this.add.image(pos.x, pos.y, 'player')
  .setDisplaySize(this.cellSize * 0.8, this.cellSize * 0.8)  // 80% 格子大小

// 全屏背景
this.add.image(this.screenW / 2, this.screenH / 2, 'bg')
  .setDisplaySize(this.screenW, this.screenH)
```

---

## 附录 B：常见错误与解决

| 错误现象 | 根本原因 | 解决方案 |
|----------|---------|---------|
| 游戏画面空白 | `createGameObjects()` 未实现或未放置对象 | 确认三个抽象方法都已实现；检查 `super.create()` 已调用 |
| 图片不显示 | 资源路径错误或文件不存在 | 检查 GTRS.json 路径（不含 `/public/`）；确认文件在 `public/` 下存在 |
| 分数不更新 | 直接赋值 `this.score` | 改用 `this.addScore(points)` |
| 结束后无法跳转 | 没有 emit `gameover` 事件 | `handleGameOver()` 末尾加 `this.game.events.emit('gameover', this.score)` |
| 屏幕适配错乱 | 覆盖 `create()` 未调用 `super.create()` | 在覆盖的 `create()` 第一行加 `super.create()` |
| TypeScript 编译报错 | 抽象方法未实现 | 确认三个 abstract 方法都在子类中实现 |
| `useGameStore()` 报错 | 在类顶层调用 Pinia | 移到 `create()` 或具体方法内再调用 |
| 坐标超出边界 | 未做边界检测 | `col < 0 \|\| col >= this.gridCols` 等判断 |
| 音频不播放 | 浏览器自动播放限制 | 正常，用户首次交互后才能播放；点击"开始"按钮触发即可 |
| 图片显示 `setStrokeStyle` 报错 | Phaser 3.90 Image 不支持 | 用 `this.add.rectangle()` 实现边框 |
| WAV 文件无法在浏览器播放 | 必须转为 MP3 | 用 audio-converter 或 ffmpeg 转换 |
