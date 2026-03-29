# 🎨 主题资源生成器

**版本**: v1.0  
**用途**: 从 GDD 自动生成符合设计的主题资源  
**特点**: 严格校验，无降级方案

---

## 🚀 快速开始

### 安装依赖

```bash
cd kids-game-house/tools/theme-resource-generator
npm install
```

### 基本使用

```bash
# 从 GDD 生成资源
npm run generate -- \
  -g ../../games/plane-shooter/GAME_DESIGN_DOCUMENT.md \
  -o ./output/plane-shooter-theme \
  -t plane-shooter \
  -s cartoon
```

---

## 📖 命令说明

### 1. generate - 生成资源

**用途**: 从 GDD 自动读取需求，生成主题资源

**参数**:
- `-g, --gdd <path>`: GDD 文件路径（必需）
- `-o, --output <path>`: 输出目录（必需）
- `-t, --theme <name>`: 主题名称（必需）
- `-s, --style <style>`: 美术风格（可选，默认 cartoon）
  - `cartoon` - 卡通风格
  - `pixel` - 像素风格
  - `realistic` - 写实风格

**示例**:

```bash
# 生成飞机大战主题资源
npm run generate -- \
  -g ../../games/plane-shooter/GAME_DESIGN_DOCUMENT.md \
  -o ./output/plane-shooter \
  -t plane-shooter-theme \
  -s cartoon

# 生成贪吃蛇主题资源
npm run generate -- \
  -g ../../games/snake/GAME_DESIGN_DOCUMENT.md \
  -o ./output/snake-theme \
  -t snake-classic
```

**输出**:
- PNG 图片资源（玩家、敌人、子弹、道具等）
- MP3 音频占位符（需要后续替换真实音频）
- GTRS 配置文件 (config.json)

---

### 2. validate - 验证资源

**用途**: 检查现有资源是否符合 GDD 要求

**参数**:
- `-g, --gdd <path>`: GDD 文件路径（必需）
- `-r, --resources <path>`: 资源目录（必需）

**示例**:

```bash
# 验证生成的资源
npm run validate -- \
  -g ../../games/plane-shooter/GAME_DESIGN_DOCUMENT.md \
  -r ./output/plane-shooter

# 验证上传到 GTRS 的资源
npm run validate -- \
  -g ../../games/plane-shooter/GAME_DESIGN_DOCUMENT.md \
  -r /path/to/gtrs/downloaded/resources
```

**输出**:
- ✅ 所有资源存在且匹配
- ❌ 缺失的资源列表

---

### 3. clean - 清理资源

**用途**: 删除生成的资源文件

**参数**:
- `-o, --output <path>`: 输出目录（必需）

**示例**:

```bash
npm run clean -- -o ./output/plane-shooter
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

## 🎨 生成的资源样式

### 玩家飞机（cartoon 风格）
- 绿色三角形飞机
- 带半透明驾驶舱
- 深色描边

### 敌机（按类型区分）
- **小型**: 红色椭圆，大眼睛
- **中型**: 橙色椭圆，中等眼睛
- **大型**: 深红椭圆，凶恶表情

### 子弹
- **玩家子弹**: 蓝色细长椭圆
- **敌机子弹**: 红色圆形

### 道具
- 彩色圆形，带首字母标识
- 加速 (S) - 蓝色
- 散弹 (S) - 紫色
- 护盾 (S) - 绿色
- 生命 (L) - 粉色
- 炸弹 (B) - 橙色

---

## ⚠️ 重要提示

### 1. 严格校验模式

工具默认启用严格校验：

- ✅ GDD 中所有"必需"资源必须生成
- ❌ 缺少任何必需资源会报错退出
- ⚠️ 音频目前生成占位符，需要手动替换

### 2. 不允许降级方案

**原则**: 没有资源就报错，不使用几何图形代替

这意味着：
- 必须先使用本工具生成资源
- 或者手动准备所有资源文件
- 不能在没有资源的情况下运行游戏

### 3. 音频资源

当前版本生成音频占位符（空文件），因为：

- 音频生成需要专业库或 API
- 建议使用真实的音频文件替换

**TODO**: 集成音频生成库（如 `tone.js` 或调用外部 API）

---

## 📁 输出目录结构

```
output/plane-shooter-theme/
├── images/
│   ├── player.png              # 玩家飞机
│   ├── enemy_small.png         # 小型敌机
│   ├── enemy_medium.png        # 中型敌机
│   ├── enemy_large.png         # 大型敌机
│   ├── bullet_player.png       # 玩家子弹
│   ├── bullet_enemy.png        # 敌机子弹
│   ├── powerup_speed.png       # 加速道具
│   ├── powerup_spread.png      # 散弹道具
│   └── powerup_shield.png      # 护盾道具
├── audio/
│   ├── bgm_main.mp3            # 背景音乐（占位符）
│   ├── sfx_shoot.mp3           # 射击音效（占位符）
│   └── sfx_explosion.mp3       # 爆炸音效（占位符）
└── config.json                 # GTRS 配置文件
```

---

## 🔧 高级用法

### 自定义资源样式

修改 `src/core/resource-generator.js`:

```javascript
createPlayerSVG() {
  // 自定义玩家飞机样式
  return `
    <svg width="256" height="256">
      <!-- 你的设计 -->
    </svg>
  `;
}
```

### 批量生成多个主题

创建脚本 `batch-generate.js`:

```javascript
import { execSync } from 'child_process';

const games = ['plane-shooter', 'tank-battle', 'snake'];

for (const game of games) {
  execSync(`npm run generate -- -g ../../games/${game}/GAME_DESIGN_DOCUMENT.md -o ./output/${game}-theme -t ${game}`);
}
```

---

## 🐛 常见问题

### Q1: 为什么生成的图片很丑？

**A**: 这是占位图！目的是：
- 确保资源文件存在
- 符合 GDD 的尺寸和命名要求
- 可以用真实美术资源替换

### Q2: 音频文件是空的怎么办？

**A**: 需要手动替换：
1. 录制或使用音频编辑软件制作
2. 替换 `audio/` 目录下的占位符文件
3. 重新运行 `validate` 确认

### Q3: 如何添加新的资源类型？

**A**: 
1. 在 GDD 中添加资源需求表格
2. 在 `gdd-parser.js` 中添加解析逻辑
3. 在 `resource-generator.js` 中添加生成方法

### Q4: 可以跳过某些资源的生成吗？

**A**: 不可以！严格模式下：
- GDD 中标记为"必需"的资源必须生成
- 如果不需要，应该从 GDD 中删除该需求

---

## 📊 与其他工具集成

### 与 GTRS 系统集成

1. 生成资源
2. 压缩为 ZIP
3. 上传到 GTRS 后台
4. 获取主题 ID

### 与游戏开发流程集成

```bash
# 1. 编写 GDD
vim GAME_DESIGN_DOCUMENT.md

# 2. 生成资源
npm run generate -- -g GAME_DESIGN_DOCUMENT.md -o theme -t my-game

# 3. 验证资源
npm run validate -- -g GAME_DESIGN_DOCUMENT.md -r theme

# 4. 上传到 GTRS
# (手动或使用 API)

# 5. 在游戏中使用
await game.start('medium', 'my-theme-id')
```

---

## 🎯 最佳实践

### 1. 先写 GDD，再生成资源

```markdown
好的流程:
GDD 完成 → 评审通过 → 生成资源 → 替换优化

坏的流程:
边做边想 → 随意生成 → 反复修改
```

### 2. 资源命名规范

- ✅ `player_ship.png` - 语义化命名
- ❌ `image1.png` - 无意义命名

### 3. 及时验证

每次修改 GDD 后都运行：

```bash
npm run validate -- -g GAME_DESIGN_DOCUMENT.md -r resources
```

### 4. 版本控制

将生成的资源纳入 Git 管理：

```bash
git add output/theme-name/
git commit -m "feat: 生成飞机大战主题资源"
```

---

## 📞 技术支持

遇到问题？

1. 查看本文档
2. 检查 GDD 格式是否正确
3. 联系技术团队

---

**工具版本**: v1.0  
**最后更新**: 2026-03-27  
**维护者**: Kids Game Team
