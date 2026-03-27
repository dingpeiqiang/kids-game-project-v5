# AI 图片生成器

使用 AI (DALL-E 3 / Stable Diffusion) 自动生成游戏素材。

## 功能特性

- 🎨 **DALL-E 3/2 支持** - OpenAI 官方图片生成
- 🖼️ **Stable Diffusion 支持** - 本地/远程 SD 服务
- 📦 **批量生成** - 配置文件批量生成多张素材
- 🎮 **游戏预设** - 内置角色、道具、UI、场景等游戏素材提示词

## 安装

```bash
cd tools/ai-image-generator
npm install
```

## 快速开始

### 环境配置

```bash
# DALL-E 需要 OpenAI API Key
export OPENAI_API_KEY=sk-xxx

# Stable Diffusion (可选，本地部署)
export SD_URL=http://localhost:7860
```

### 单张生成

```bash
# 使用 DALL-E 3 生成游戏角色
node src/index.js \
  --prompt "一个可爱的蓝色卡通小蛇角色，游戏精灵风格，正面视角" \
  --output output/characters/snake_head.png

# 使用 DALL-E 2 (更便宜)
node src/index.js \
  --provider dalle2 \
  --prompt "游戏背景森林" \
  --output output/forest.png

# 使用 Stable Diffusion
node src/index.js \
  --provider sd \
  --prompt "像素风格城堡背景" \
  --output output/castle.png \
  --width 512 --height 512
```

### 批量生成

```bash
# 使用默认配置批量生成
node src/batch.js

# 自定义配置文件
node src/batch.js --config my-prompts.json
```

## 命令行参数

| 参数 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--prompt` | `-p` | 图片描述提示词 | (必填) |
| `--output` | `-o` | 输出文件路径 | (必填) |
| `--provider` | | AI 提供商: dalle3, dalle2, sd | dalle3 |
| `--size` | | DALL-E 尺寸: 1024x1024, 1792x1024 | 1024x1024 |
| `--quality` | | DALL-E 质量: standard, hd | standard |
| `--style` | | DALL-E 风格: vivid, natural | vivid |
| `--width` | | SD 宽度像素 | 512 |
| `--height` | | SD 高度像素 | 512 |
| `--steps` | | SD 采样步数 | 20 |

## 提示词技巧

### 游戏素材提示词模板

```
[风格] + [主体] + [细节] + [用途] + [格式]

示例:
- "可爱的蓝色卡通蛇角色，游戏精灵风格，正面视角，透明背景"
- "像素风格城堡背景，16位游戏，复古，1920x1080"
- "金色奖杯图标，游戏UI风格，简洁扁平，透明背景"
```

### 常用风格

- **卡通**: `cartoon style, kawaii, game sprite`
- **像素**: `pixel art, 8-bit, retro game`
- **扁平**: `flat design, minimalist, ui icon`
- **写实**: `realistic, 3D render, detailed`

## 预设素材类型

批量生成支持以下游戏素材类型：

| 类型 | 说明 | 示例 |
|------|------|------|
| `characters/` | 角色精灵 | 蛇头、蛇身、敌人 |
| `items/` | 道具图标 | 食物、药水、宝石 |
| `scenes/` | 场景背景 | 草地、沙漠、冰雪 |
| `ui/` | 界面元素 | 按钮、面板、分数框 |
| `icons/` | 图标 | 货币、等级、勋章 |

## 配置文件格式

```json
{
  "provider": "dalle3",
  "outputDir": "output",
  "prompts": [
    {
      "key": "snake_head",
      "prompt": "可爱的蓝色卡通蛇头",
      "output": "characters/snake_head.png"
    }
  ]
}
```

## 注意事项

- ⚠️ DALL-E API 需要付费，请确保 API 余额充足
- ⏱️ 生成需要几秒钟时间，请耐心等待
- 📝 提示词越详细，生成效果越好
- 🖼️ DALL-E 3 生成 1024x1024 约 $0.04/张
