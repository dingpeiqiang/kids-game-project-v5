# 🎵 音频资源模板目录

**用途**: 存放预定义的音频模板文件，用于主题资源生成

---

## 📁 目录结构

```
templates/audio/
├── bgm_main.mp3           # 背景音乐模板
├── sfx_shoot.mp3          # 射击音效模板
├── sfx_explosion.mp3      # 爆炸音效模板
├── sfx_powerup.mp3        # 道具拾取音效模板
└── README.md              # 使用说明
```

---

## 🎯 如何提供音频模板

### 方案 1: 使用开源音效库（推荐）

#### Freesound.org
- 网址：https://freesound.org/
- 许可：CC0 (公共领域) 或 CC-BY (署名)
- 下载后重命名为标准名称

#### Kenney.nl
- 网址：https://kenney.nl/sounds
- 许可：CC0 (完全免费)
- 包含大量游戏音效

#### OpenGameArt.org
- 网址：https://opengameart.org/
- 许可：多种开源许可
- 专门的游戏美术和音效资源

### 方案 2: 自己录制

**工具推荐**:
- Audacity (免费开源)
- Adobe Audition (专业)
- GarageBand (Mac)

**录制建议**:
- 格式：MP3 或 WAV
- 采样率：44.1kHz
- 位深度：16-bit
- 时长：音效 0.1-2 秒，BGM 2-3 分钟

### 方案 3: AI 生成

**工具推荐**:
- AIVA (AI 作曲)
- Soundraw (AI 音乐生成)
- Boomy (AI 音乐创作)

---

## 📋 必需音频清单

根据 GDD 常见需求，至少需要以下模板：

### 背景音乐 (BGM)

| 文件名 | 用途 | 时长 | 风格建议 |
|--------|------|------|---------|
| `bgm_main.mp3` | 主背景音乐 | 2-3 分钟 | 欢快、轻松 |
| `bgm_gameover.mp3` | 游戏结束 | 10-30 秒 | 低沉、遗憾 |
| `bgm_victory.mp3` | 胜利音乐 | 10-30 秒 | 激昂、庆祝 |

### 音效 (SFX)

| 文件名 | 用途 | 时长 | 风格建议 |
|--------|------|------|---------|
| `sfx_shoot.mp3` | 射击音效 | 0.1-0.3 秒 | 短促、有力 |
| `sfx_explosion.mp3` | 爆炸音效 | 0.3-0.8 秒 | 震撼、冲击 |
| `sfx_powerup.mp3` | 道具拾取 | 0.2-0.5 秒 | 清脆、愉悦 |
| `sfx_hit.mp3` | 击中音效 | 0.1-0.3 秒 | 沉闷、打击 |
| `sfx_score.mp3` | 得分音效 | 0.2-0.4 秒 | 明亮、积极 |

---

## 🔧 音频处理步骤

### 1. 下载/录制音频

从上述来源获取音频文件。

### 2. 转换为 MP3

使用 FFmpeg 批量转换：

```bash
# 安装 FFmpeg
# Windows: choco install ffmpeg
# Mac: brew install ffmpeg

# 转换为 MP3
ffmpeg -i input.wav -codec:a libmp3lame -qscale:a 2 output.mp3
```

### 3. 重命名

按照标准命名规范：

```bash
# 示例
mv "explosion_sound.wav" sfx_explosion.mp3
mv "background_music_loop.mp3" bgm_main.mp3
```

### 4. 复制到模板目录

```bash
cp /path/to/audio/files/*.mp3 templates/audio/
```

### 5. 验证

运行生成工具测试：

```bash
npm run generate -- -g GDD.md -o output -t theme
```

---

## ⚠️ 注意事项

### 1. 版权许可

确保使用的音频符合以下许可之一：
- ✅ CC0 (公共领域)
- ✅ CC-BY (署名即可)
- ✅ MIT / BSD
- ✅ 自己原创

**禁止使用**:
- ❌ 商业版权音乐
- ❌ 未授权的影视游戏原声

### 2. 音频质量

**最低要求**:
- 比特率：≥128 kbps
- 采样率：44.1 kHz
- 无爆音、无底噪

**推荐参数**:
- 比特率：192-320 kbps
- 采样率：44.1 kHz 或 48 kHz
- 立体声（BGM）或单声道（音效）

### 3. 文件大小

**合理范围**:
- 音效：10KB - 200KB
- BGM: 500KB - 3MB

---

## 🎨 不同游戏的音频配置

### 飞机大战示例

```json
{
  "bgm": ["bgm_main"],
  "sfx": [
    "sfx_shoot",
    "sfx_explosion",
    "sfx_powerup",
    "sfx_hit"
  ]
}
```

### 坦克大战示例

```json
{
  "bgm": ["bgm_main", "bgm_gameover"],
  "sfx": [
    "sfx_shoot",
    "sfx_explosion",
    "sfx_hit",
    "sfx_engine"
  ]
}
```

### 贪吃蛇示例

```json
{
  "bgm": ["bgm_main"],
  "sfx": [
    "sfx_eat",
    "sfx_gameover",
    "sfx_score"
  ]
}
```

---

## 📞 获取帮助

### 找不到合适的音效？

1. **Freesound 搜索技巧**:
   - 使用英文关键词：shoot, explosion, powerup
   - 筛选许可：勾选 "Creative Commons 0"
   - 按质量排序：选择高评分的

2. **请求协助**:
   - 联系团队中的音频设计师
   - 在论坛发帖求助
   - 考虑外包制作

### 不会处理音频？

1. **学习资源**:
   - YouTube 教程：搜索 "Audacity tutorial"
   - B 站教程：搜索 "Audacity 教程"
   - 官方文档：Audacity 官网

2. **在线工具**:
   - AudioTrimmer.com (剪辑)
   - MP3Cut.net (裁剪)
   - AudioJoiner.com (合并)

---

<div align="center">

## 🎯 目标

**让每个游戏都有高质量的音频资源！**

**零容忍降级方案：**
- ❌ 不允许空文件
- ❌ 不允许占位符
- ✅ 必须是真实可用的音频

</div>

---

**模板版本**: v1.0  
**最后更新**: 2026-03-27  
**维护者**: Kids Game Team
