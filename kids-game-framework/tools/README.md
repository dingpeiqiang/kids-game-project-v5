# 游戏开发工具

本目录包含游戏开发过程中使用的各种工具。

## 工具目录

| 工具 | 说明 |
|------|------|
| [ai-image-generator/](ai-image-generator) | AI 图片生成工具 (DALL-E/Stable Diffusion) |
| [ai-audio-generator/](ai-audio-generator) | AI 音频生成工具 (Suno/11 Labs/程序化) |
| [gtrs-generator/](gtrs-generator) | GTRS 主题资源生成器 |
| [theme-resource-generator/](theme-resource-generator) | 主题资源生成器 |
| [image-optimizer/](image-optimizer) | 图片优化工具 |
| [audio-converter/](audio-converter) | 音频格式转换工具 |
| [shared-scripts/](shared-scripts) | 共享脚本 |

## 快速开始

### 1. 创建新游戏

```bash
# 在框架目录执行
cd ..
node bin/create-game.js 贪吃蛇 --code SNAKE --id 1
```

### 2. AI 生成图片素材

```bash
# 进入 AI 图片生成器
cd tools/ai-image-generator
npm install

# 使用 DALL-E 3 生成游戏角色 (需要 OPENAI_API_KEY)
node src/index.js --prompt "可爱的蓝色卡通蛇角色" -o output/snake.png

# 批量生成
node src/batch.js
```

### 3. AI 生成音效

```bash
# 进入 AI 音频生成器
cd tools/ai-audio-generator
npm install

# 程序化生成音效 (免费，无需 API)
node src/sfx.js coin output/coin.wav
node src/sfx.js explosion output/explosion.wav
node src/sfx.js list  # 查看所有预设

# 语音合成 (需要 ELEVEN_LABS_API_KEY)
export ELEVEN_LABS_API_KEY=your_key
node src/voice.js "游戏开始" output/voice.mp3
```

### 4. 生成 GTRS 资源

```bash
# 进入 GTRS 资源生成器
cd tools/gtrs-generator
npm install
node src/generate-resources.mjs
```

### 5. 优化图片资源

```bash
cd tools/image-optimizer
npm install
# 查看使用说明
```

### 6. 转换音频格式

```bash
cd tools/audio-converter
npm install
# 查看使用说明
```

## 工具详细说明

### ai-image-generator

AI 图片生成工具，支持 DALL-E 3/2 和 Stable Diffusion。

- **DALL-E**: 需要 OpenAI API Key
- **Stable Diffusion**: 支持本地/远程 SD 服务
- **批量生成**: 支持配置文件批量生成游戏素材

### ai-audio-generator

AI 音频生成工具，支持三种模式：

- **程序化生成**: 纯代码生成 10+ 种预设游戏音效 (免费)
- **Suno AI**: 生成背景音乐 (需配置)
- **11 Labs**: 语音合成 (需配置)

### gtrs-generator

GTRS 主题资源生成器，用于生成符合 GTRS 规范的游戏主题资源。

### theme-resource-generator

主题资源生成器，功能与 gtrs-generator 类似。

### image-optimizer

图片优化工具，支持 PNG/JPEG 压缩、尺寸调整、批量处理。

### audio-converter

音频转换工具，支持 WAV 转 MP3、音频格式统一。

### shared-scripts

共享脚本，包含各种辅助脚本。

---

**注意**：自动化测试工具位于项目根目录的 `kids-game-auto-test`，不在本工具目录中。
