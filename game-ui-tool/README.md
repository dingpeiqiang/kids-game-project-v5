# game-ui-tool

基于 sd-webui-aki API 的游戏图片素材生成工具库，专为 AI 游戏开发场景设计。

> **📌 重要：所有生成的素材均为 PNG 格式**，适合游戏开发使用（支持透明背景）。

## 🎯 使用场景

当 AI（如 CodeBuddy Agent）进行游戏编码时，需要生成具体游戏的图片素材：

```
用户: "帮我创建一个贪吃蛇游戏"
    ↓
AI 编写游戏代码
    ↓
AI 调用 game-ui-tool 生成游戏素材
    ↓
生成: 蛇头、蛇身、食物、背景等 PNG 素材
    ↓
素材自动保存到项目目录
```

## ✨ 核心功能

| 功能 | 说明 |
|------|------|
| `txt2img()` | 文生图 - 根据描述生成图片 |
| `img2img()` | 图生图 - 基于参考图生成 |
| `inpainting()` | 局部重绘 - 修复局部区域 |
| `generateWithStyle()` | 使用游戏风格快速生成 |
| `generateFromTemplate()` | 使用 Prompt 模板生成 |
| `batchGenerate()` | 批量生成多张素材 |

## 🎮 10 种游戏风格预设

| 风格 | 说明 | 适用场景 |
|------|------|----------|
| `pixel-art` | 像素艺术 | 复古游戏、角色、道具 |
| `cartoon` | 卡通风格 | 儿童游戏、UI元素 |
| `fantasy` | 奇幻风格 | 魔法、精灵、龙 |
| `scifi` | 科幻风格 | 太空、机器人 |
| `medieval` | 中世纪 | 城堡、骑士 |
| `horror` | 恐怖风格 | 万圣节、怪物 |
| `minimalist` | 简约风格 | UI图标、按钮 |
| `chibi` | Q版风格 | 可爱角色 |
| `watercolor` | 水彩风格 | 背景、装饰 |
| `hand-drawn` | 手绘风格 | 道具、特效 |

## 📁 Prompt 模板分类

### 角色类
- `hero` - 主角英雄
- `villain` - 反派Boss
- `npc` - 商店NPC
- `monster` - 怪物敌人

### 道具类
- `sword` - 武器剑
- `potion` - 药水
- `chest` - 宝箱
- `gem` - 宝石

### 场景类
- `forest` - 森林
- `dungeon` - 地牢
- `castle` - 城堡
- `village` - 村庄

### UI类
- `button` - 按钮
- `icon` - 图标
- `frame` - 边框
- `badge` - 徽章

## 🚀 快速开始

### 安装依赖

```bash
cd game-ui-tool
npm install
```

### 基本使用

```typescript
import { SDWebUI, GAME_STYLES } from './src/index.js';

const sd = new SDWebUI('http://localhost:7860');

// 检查 API 连接
const connected = await sd.ping();
console.log('API连接:', connected ? '✅' : '❌');

// 文生图
const result = await sd.txt2img({
  prompt: 'cute cat game character',
  width: 256,
  height: 256,
  steps: 20,
});

// 使用风格生成
const sprite = await sd.generateWithStyle(
  'snake head, green color',
  'pixel-art',
  { width: 64, height: 64 }
);

// 使用模板生成
const sword = await sd.generateFromTemplate(
  '道具',
  'sword',
  'fantasy',
  { width: 128, height: 128 }
);

// 批量生成
const foods = await sd.batchGenerate(
  ['apple', 'orange', 'banana'],
  'pixel-art',
  { width: 32, height: 32 }
);

// 保存到文件
import fs from 'fs';
fs.writeFileSync('sprite.png', SDWebUI.base64ToBuffer(result.images[0].base64));
```

### AI 集成示例

```typescript
// AI 游戏开发时的素材生成调用
async function generateGameAssets(gameType: string, requirements: string[]) {
  const sd = new SDWebUI('http://localhost:7860');
  const assets: Record<string, string> = {};
  
  for (const req of requirements) {
    // 根据需求选择风格和模板
    const style = gameType === 'retro' ? 'pixel-art' : 'cartoon';
    const result = await sd.generateWithStyle(req, style);
    
    // 保存到项目目录
    const filename = `${req.replace(/\s+/g, '_')}.png`;
    fs.writeFileSync(`./assets/${filename}`, SDWebUI.base64ToBuffer(result.images[0].base64));
    assets[req] = filename;
  }
  
  return assets;
}

// AI 调用示例
const snakeAssets = await generateGameAssets('retro', [
  'snake head',
  'snake body',
  'food apple',
  'game background',
  'score display'
]);
```

## 📋 API 参考

### SDWebUI 类

```typescript
// 构造函数
new SDWebUI(baseUrl?: string)

// 连接检查
ping(): Promise<boolean>

// 文生图
txt2img(params: Txt2ImgParams): Promise<GenerationResult>

// 图生图
img2img(params: Img2ImgParams): Promise<GenerationResult>

// 局部重绘
inpainting(params: InpaintingParams): Promise<GenerationResult>

// 使用风格生成
generateWithStyle(prompt: string, style: string, options?: Partial<GenerationOptions>): Promise<GenerationResult>

// 使用模板生成
generateFromTemplate(category: string, template: string, style: string, options?: Partial<GenerationOptions>): Promise<GenerationResult>

// 批量生成
batchGenerate(prompts: string[], style: string, options?: Partial<GenerationOptions>): Promise<GenerationResult[]>

// 模型管理
getModels(): Promise<SDModel[]>
setModel(modelName: string): Promise<void>

// 实用方法
static base64ToBuffer(base64: string): Buffer
base64ToDataUrl(base64: string): string
fileToBase64(filePath: string): Promise<string>
```

### 参数类型

```typescript
interface Txt2ImgParams {
  prompt: string;
  negativePrompt?: string;
  width?: number;        // 默认 512
  height?: number;       // 默认 512
  steps?: number;       // 默认 25
  cfgScale?: number;     // 默认 7
  seed?: number;         // -1 随机
  sampler?: string;      // 默认 'Euler'
  batchSize?: number;    // 默认 1
  batchCount?: number;   // 默认 1
  restoreFaces?: boolean;
  enableHiresFix?: boolean;
  model?: string;
}

interface GenerationResult {
  images: Array<{
    base64: string;
    seed?: number;
  }>;
  info: {
    seed: number;
    steps: number;
    cfgScale: number;
    width: number;
    height: number;
  };
}
```

## 📁 输出目录建议

建议 AI 在生成素材时，按以下结构保存：

```
games/{game-name}/
├── assets/
│   ├── characters/     # 角色图片
│   │   ├── hero.png
│   │   └── enemy.png
│   ├── items/          # 道具图片
│   │   ├── coin.png
│   │   └── potion.png
│   ├── backgrounds/    # 背景图片
│   │   └── bg1.png
│   └── ui/             # UI元素
│       ├── button.png
│       └── icon.png
└── config/
    └── assets.json     # 素材映射配置
```

## ⚙️ 配置

### API 地址

默认: `http://localhost:7860`

可通过环境变量配置:
```bash
export SD_API_URL=http://192.168.1.100:7860
```

### 超时设置

默认超时 5 分钟（300000ms），适合高分辨率图片生成。

## 📝 注意事项

1. **依赖 sd-webui-aki**: 需要本地部署 [sd-webui-aki](https://github.com/AUTOMATIC1111/stable-diffusion-webui) 并开启 API 模式
2. **PNG 格式**: 所有生成的素材均为 PNG 格式，支持透明背景，适合游戏开发
3. **建议尺寸**: 像素游戏用 32-128px，现代游戏用 512-1024px
4. **批量生成**: 建议单次不超过 4 张，避免超时
5. **负面提示词**: 强烈建议添加，避免低质量结果

## 🔗 相关链接

- [sd-webui-aki](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
- [Stable Diffusion](https://stability.ai/stable-diffusion)
- [kids-game-frame-factory](https://github.com/your-org/kids-game-frame-factory)
