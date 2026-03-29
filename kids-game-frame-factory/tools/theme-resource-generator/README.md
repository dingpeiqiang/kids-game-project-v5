# 🎨 主题资源生成器

**版本**: v2.0  
**用途**: 从 GDD 自动生成符合设计的主题资源  
**特点**: 严格校验，无降级方案，**GTRS v1.0.0 规范合规**

---

## 🆕 v2.0 变更

| 变更项 | v1.0（旧） | v2.0（新） |
|--------|-----------|-----------|
| CLI 必填参数 | `-g -o -t` | `-g -o -t -c`（新增 `--theme-code`）|
| 输出目录 | `-o` 直接写入 | `-o` 作为根目录，写入 `<root>/themes/<code>/` |
| 图片目录 | `output/*.png` | `output/themes/<code>/images/*.png` |
| 音频目录 | `output/*.mp3` | `output/themes/<code>/audio/*.mp3` |
| 配置文件 | `config.json`（非标准） | `GTRS.json`（GTRS v1.0.0 规范） |
| 资源路径 | `images/xxx.png`（相对路径） | `/themes/<code>/images/xxx.png`（绝对路径）|
| GTRS 结构 | 非标准 | 标准：`specMeta` / `themeInfo` / `globalStyle` / `resources` |
| validate 命令 | 仅检查文件存在 | 还检查 GTRS.json 规范合规性 |

---

## 🚀 快速开始

### 安装依赖

```bash
cd kids-game-frame-factory/tools/theme-resource-generator
npm install
```

### 基本使用

```bash
# 从 GDD 生成资源（指定 theme-code 是必须的）
npm run generate -- \
  -g ../../games/plane-shooter/GAME_DESIGN_DOCUMENT.md \
  -o ./output \
  -t "飞机大战默认主题" \
  -c plane_shooter_default \
  --game-id plane-shooter \
  -s cartoon
```

生成结果：
```
output/
└── themes/
    └── plane_shooter_default/
        ├── images/
        │   ├── player.png
        │   ├── enemy_small.png
        │   └── ...
        ├── audio/
        │   └── bgm_main.mp3（如有模板）
        └── GTRS.json          ← 符合 GTRS v1.0.0 规范
```

---

## 📖 命令说明

### 1. generate - 生成资源

**用途**: 从 GDD 自动读取需求，生成主题资源

**参数**:
- `-g, --gdd <path>`: GDD 文件路径（必需）
- `-o, --output <path>`: 输出**根目录**（必需，资源写入 `<root>/themes/<theme-code>/`）
- `-t, --theme <name>`: 主题名称，用于 GTRS themeInfo（必需）
- `-c, --theme-code <code>`: **主题代码**（必需，全小写+下划线，决定路径前缀 `/themes/{code}/`）
- `--game-id <id>`: 关联游戏 ID，用于 GTRS themeInfo.gameId（可选）
- `-s, --style <style>`: 美术风格（可选，默认 cartoon）
  - `cartoon` - 卡通风格
  - `pixel` - 像素风格
  - `realistic` - 写实风格

**示例**:

```bash
# 生成飞机大战默认主题
npm run generate -- \
  -g ../../games/plane-shooter/GAME_DESIGN_DOCUMENT.md \
  -o ./output \
  -t "飞机大战默认主题" \
  -c plane_shooter_default \
  --game-id plane-shooter

# 生成贪吃蛇节日主题
npm run generate -- \
  -g ../../games/snake/GAME_DESIGN_DOCUMENT.md \
  -o ./output \
  -t "贪吃蛇节日主题" \
  -c snake_festival \
  --game-id snake \
  -s cartoon
```

**输出**:
- PNG 图片资源（写入 `<output>/themes/<code>/images/`）
- MP3 音频（如有模板，写入 `<output>/themes/<code>/audio/`）
- `GTRS.json`（写入 `<output>/themes/<code>/`，符合 GTRS v1.0.0 规范）

---

### 2. validate - 验证资源

**用途**: 检查现有资源是否符合 GDD，并验证 GTRS.json 规范合规性

**参数**:
- `-g, --gdd <path>`: GDD 文件路径（必需）
- `-r, --resources <path>`: 主题资源目录（必需，即 `themes/<code>/` 下的目录）

**示例**:

```bash
# 验证生成的资源
npm run validate -- \
  -g ../../games/plane-shooter/GAME_DESIGN_DOCUMENT.md \
  -r ./output/themes/plane_shooter_default
```

**校验内容**:
- ✅ `images/` 子目录中所有图片资源存在
- ✅ `audio/` 子目录中所有音频资源存在
- ✅ `GTRS.json` 存在且符合 v1.0.0 规范（`specMeta` / `themeInfo` / `globalStyle` / `resources`）
- ✅ 所有资源 `src` 路径以 `/themes/{themeCode}/` 开头，不含 `/public/` 前缀

---

### 3. clean - 清理资源

**用途**: 删除生成的资源文件

**参数**:
- `-o, --output <path>`: 输出目录路径（必需）

**示例**:

```bash
npm run clean -- -o ./output/themes/plane_shooter_default
```

---

## 📋 GDD 格式要求

工具会从 GDD 的以下章节提取资源需求：

### 图片资源清单

```markdown
### 4.1 图片资源清单

| 资源名称 | 用途 | 数量 | 格式建议 | 优先级 |
|---------|------|------|---------|--------|
| player_ship | 玩家飞机 | 1 | PNG | 必需 |
| enemy_small | 小型敌机 | 1 | PNG | 必需 |
```

### 音频资源清单

```markdown
### 4.2 音频资源清单

| 资源名称 | 用途 | 时长 | 格式建议 | 优先级 |
|---------|------|------|---------|--------|
| bgm_main | 背景音乐 | 2-3 分钟 | MP3 | 必需 |
| sfx_shoot | 射击音效 | 0.1-0.2 秒 | WAV | 必需 |
```

### 游戏对象章节（自动识别）

工具还会自动从以下章节提取需求：

- **玩家角色** → 生成 `player.png`
- **敌对单位** → 生成 `enemy_small.png`, `enemy_medium.png`, `enemy_large.png`
- **子弹设计** → 生成 `bullet_player.png`, `bullet_enemy.png`
- **道具设计** → 生成 `powerup_speed.png`, `powerup_spread.png` 等

---

## 📁 输出目录结构（v2.0）

```
output/                               ← -o 参数指定的根目录
└── themes/
    └── plane_shooter_default/        ← -c 参数指定的 theme-code
        ├── images/                   ← 图片资源（路径：/themes/plane_shooter_default/images/）
        │   ├── player.png
        │   ├── enemy_small.png
        │   ├── enemy_medium.png
        │   ├── enemy_large.png
        │   ├── bullet_player.png
        │   ├── bullet_enemy.png
        │   ├── powerup_speed.png
        │   └── ...
        ├── audio/                    ← 音频资源（路径：/themes/plane_shooter_default/audio/）
        │   ├── bgm_main.mp3
        │   └── sfx_shoot.mp3
        └── GTRS.json                 ← GTRS v1.0.0 规范配置
```

### GTRS.json 结构示例

```json
{
  "specMeta": { "specName": "GTRS", "specVersion": "1.0.0", "compatibleVersion": "1.0.0" },
  "themeInfo": {
    "themeCode": "plane_shooter_default",
    "themeName": "飞机大战默认主题",
    "gameId": "plane-shooter",
    "ownerType": "GAME",
    "ownerId": "plane-shooter"
  },
  "globalStyle": { "bgColor": "#0a0a28", "..." : "..." },
  "resources": {
    "images": {
      "scene":  { "player": { "alias": "玩家飞机", "src": "/themes/plane_shooter_default/images/player.png", "type": "png" } },
      "ui":     {},
      "icon":   {},
      "effect": {}
    },
    "audio": {
      "bgm":    { "bgm_main": { "alias": "背景音乐", "src": "/themes/plane_shooter_default/audio/bgm_main.mp3", "type": "mp3", "volume": 0.6 } },
      "effect": {},
      "voice":  {}
    },
    "video": {}
  }
}
```

---

## ⚠️ 重要提示

### 1. theme-code 命名规范

- 只允许小写字母、数字、下划线
- 示例：`snake_default`、`plane_shooter_festival`、`tank_battle_night`
- ❌ 不允许：`snake-theme`（连字符）、`Snake_Default`（大写）

### 2. 部署说明

生成完成后，将 `themes/` 目录复制到目标游戏的 `public/` 目录：

```bash
cp -r output/themes/plane_shooter_default/  game/public/themes/
```

Web 访问路径示例：`http://localhost:3000/themes/plane_shooter_default/images/player.png`

### 3. 音频资源

当前版本只能从模板复制音频，不支持程序化生成。  
**建议**：先将 `.mp3` 文件放入 `templates/audio/` 目录，再运行生成。

---

## 🔧 高级用法

### 批量生成多个主题

```bash
# 同一游戏多个主题
npm run generate -- -g ./snake/GDD.md -o ./output -t "贪吃蛇经典主题" -c snake_classic --game-id snake
npm run generate -- -g ./snake/GDD.md -o ./output -t "贪吃蛇节日主题" -c snake_festival --game-id snake -s cartoon
```

### 与游戏开发流程集成

```bash
# 1. 编写 GDD
# 2. 生成资源
npm run generate -- -g GDD.md -o ./output -t "我的主题" -c my_theme --game-id my-game

# 3. 验证资源（包含 GTRS 规范校验）
npm run validate -- -g GDD.md -r ./output/themes/my_theme

# 4. 复制到游戏 public 目录
cp -r ./output/themes/ ../my-game/public/

# 5. 上传 GTRS.json 到主题系统
```

---

**工具版本**: v2.0  
**最后更新**: 2026-03-29  
**维护者**: Kids Game Team
