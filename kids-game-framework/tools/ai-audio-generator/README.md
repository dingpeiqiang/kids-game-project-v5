# AI 音频生成器

使用 AI 生成游戏音效、背景音乐和语音。

## 功能特性

- 🎵 **程序化音效** - 纯代码生成，无需 API，直接可用
- 🎶 **音乐生成** - 支持 Suno AI (需配置)
- 🎤 **语音合成** - 支持 11 Labs (需配置)
- 🚀 **预设音效** - 内置 10+ 种常用游戏音效

## 安装

```bash
cd tools/ai-audio-generator
npm install
```

## 快速开始

### 程序化音效 (免费，无需 API)

```bash
# 列出所有可用音效
node src/sfx.js list

# 生成吃金币音效
node src/sfx.js coin output/coin.wav

# 生成爆炸音效
node src/sfx.js explosion output/explosion.wav

# 生成跳跃音效
node src/sfx.js jump output/jump.wav

# 生成游戏结束
node src/sfx.js gameover output/gameover.wav
```

### 可用预设音效

| 类型 | 说明 |
|------|------|
| `coin` | 吃金币 |
| `explosion` | 爆炸 |
| `jump` | 跳跃 |
| `click` | 按钮点击 |
| `gameover` | 游戏结束 |
| `levelup` | 升级/得分 |
| `move` | 移动/滑行 |
| `error` | 错误/警告 |
| `pickup` | 拾取道具 |
| `shoot` | 发射/射击 |

### 语音合成 (需要 11 Labs API)

```bash
# 设置 API Key
export ELEVEN_LABS_API_KEY=your_api_key

# 生成语音
node src/voice.js "游戏开始" output/voice_start.mp3
node src/voice.js "恭喜通关" output/voice_win.mp3

# 列出可用声音
node src/voice.js list

# 指定声音
node src/voice.js "准备好了吗" output/voice_start.mp3 --voice Adam
```

### 可用声音

| ID | 描述 |
|----|------|
| Rachel | 温暖女声 |
| Adam | 自然男声 |
| Sam | 年轻男声 |
| Dora | 活泼女声 |
| Arnold | 成熟男声 |
| Bella | 柔和女声 |

### 音乐生成 (需要 Suno API)

```bash
# 设置 API Key (需要第三方 Suno API 或自托管)
export SUNO_API_KEY=your_api_key

# 生成背景音乐
node src/index.js --type music --prompt "欢快的卡通背景音乐" -o output/bgm.mp3

# 生成战斗音乐
node src/index.js --type music --prompt "紧张刺激的战斗音乐" -o output/battle.mp3
```

## 高级用法

### 批量生成音效

```javascript
// 创建批量脚本
const sounds = ['coin', 'jump', 'explosion', 'click'];
for (const sound of sounds) {
  console.log(`生成 ${sound}...`);
  // 调用 sfx.js
}
```

### 程序化生成原理

预设音效使用 Web Audio API 风格的合成技术：

- **正弦波** - 基础音调
- **方波** - 复古游戏音色
- **白噪音** - 爆炸、冲击
- **频率调制** - 上升/下降音
- **包络控制** - 淡入淡出

## 环境变量

| 变量 | 说明 |
|------|------|
| `ELEVEN_LABS_API_KEY` | 11 Labs API 密钥 |
| `SUNO_API_KEY` | Suno API 密钥 |
| `SUNO_URL` | Suno API 地址 |

## 获取 API Key

- **11 Labs**: https://elevenlabs.io/api
- **Suno**: (官方 API 尚未公开，需使用第三方服务)

## 注意事项

- ⚠️ 预设音效完全免费，适合原型和简单游戏
- 💰 11 Labs 语音合成按字符计费
- 🎵 音乐生成依赖外部服务，可能不稳定
- 📁 输出格式为 WAV (程序化) 或 MP3 (API)
