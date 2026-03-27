# 🎨 主题资源生成系统 - 使用指南

**版本**: v1.0  
**最后更新**: 2026-03-27  

---

## 🚀 一句话总结

从 GDD 自动生成符合设计的主题资源，**严格校验，不允许降级方案**。

---

## 📋 快速开始（3 分钟上手）

### 步骤 1: 安装工具

```bash
cd kids-game-house/tools/theme-resource-generator
npm install
```

### 步骤 2: 准备 GDD

确保你的游戏设计文档包含资源需求章节，例如：

```markdown
### 4.1 图片资源清单

| 资源名称 | 用途 | 数量 | 格式 | 优先级 |
|---------|------|------|------|--------|
| player | 玩家飞机 | 1 | PNG | 必需 |
| enemy_small | 小型敌机 | 1 | PNG | 必需 |
```

### 步骤 3: 生成资源

```bash
npm run generate -- \
  -g ../../games/plane-shooter/GAME_DESIGN_DOCUMENT.md \
  -o ./output/plane-shooter-theme \
  -t plane-shooter-theme
```

### 步骤 4: 验证资源

```bash
npm run validate -- \
  -g ../../games/plane-shooter/GAME_DESIGN_DOCUMENT.md \
  -r ./output/plane-shooter-theme
```

**完成!** 🎉 生成的资源可以直接上传到 GTRS 系统。

---

## ⚠️ 核心原则

### 1. 严格校验

- ✅ **必须**有 GDD 才能生成
- ✅ **必须**所有资源都生成成功
- ❌ **不允许**缺失任何"必需"资源
- ❌ **不允许**使用几何图形降级方案

### 2. 自动化流程

```
GDD → 解析需求 → 生成资源 → 严格校验 → 输出
```

全程无需手动操作，一键完成！

### 3. 占位图策略

当前生成的是**程序化占位图**：

- ✅ 保证资源文件存在
- ✅ 符合尺寸和命名要求
- ✅ 可以立即用于开发测试
- ⚠️ **需要**后续替换为真实美术资源

---

## 📖 详细用法

### 命令 1: generate - 生成资源

**最常用命令**

```bash
npm run generate -- \
  -g <GDD 路径> \
  -o <输出目录> \
  -t <主题名称> \
  [-s <美术风格>]
```

**参数说明**:
- `-g`: GDD 文件路径（必需）
- `-o`: 输出目录（必需）
- `-t`: 主题名称（必需）
- `-s`: 美术风格（可选）
  - `cartoon` - 卡通风格（默认）
  - `pixel` - 像素风格
  - `realistic` - 写实风格

**示例**:

```bash
# 生成飞机大战主题
npm run generate -- \
  -g ../../games/plane-shooter/GAME_DESIGN_DOCUMENT.md \
  -o ./output/plane-shooter \
  -t plane-shooter-cartoon \
  -s cartoon

# 生成坦克大战主题
npm run generate -- \
  -g ../../games/tank-battle/GAME_DESIGN_DOCUMENT.md \
  -o ./output/tank-battle \
  -t tank-battle-pixel \
  -s pixel
```

**输出内容**:
- `images/` - 所有图片资源（PNG）
- `audio/` - 所有音频资源（MP3 占位符）
- `config.json` - GTRS 配置文件

---

### 命令 2: validate - 验证资源

**检查资源是否完整**

```bash
npm run validate -- \
  -g <GDD 路径> \
  -r <资源目录>
```

**示例**:

```bash
# 验证刚生成的资源
npm run validate -- \
  -g ../../games/plane-shooter/GAME_DESIGN_DOCUMENT.md \
  -r ./output/plane-shooter

# 验证从 GTRS 下载的资源
npm run validate -- \
  -g ../../games/plane-shooter/GAME_DESIGN_DOCUMENT.md \
  -r /path/to/gtrs/resources
```

**输出**:
- ✅ `所有资源验证通过！`
- ❌ `缺少资源：player.png, enemy_small.png`

---

### 命令 3: clean - 清理资源

**删除生成的文件**

```bash
npm run clean -- -o <输出目录>
```

**示例**:

```bash
npm run clean -- -o ./output/plane-shooter
```

---

## 🎨 生成的资源样式

### 卡通风格 (cartoon)

- **玩家飞机**: 绿色三角形，带驾驶舱
- **敌机**: 椭圆身体，大眼睛
- **子弹**: 细长椭圆
- **道具**: 彩色圆形，带字母标识

### 像素风格 (pixel)

- TODO: 实现像素化处理

### 写实风格 (realistic)

- TODO: 实现更逼真的渲染

---

## 📁 输出目录结构

```
output/plane-shooter-theme/
│
├── images/                    # 图片资源目录
│   ├── player.png            # 玩家飞机 (256x256)
│   ├── enemy_small.png       # 小型敌机
│   ├── enemy_medium.png      # 中型敌机
│   ├── enemy_large.png       # 大型敌机
│   ├── bullet_player.png     # 玩家子弹
│   ├── bullet_enemy.png      # 敌机子弹
│   ├── powerup_speed.png     # 加速道具
│   ├── powerup_spread.png    # 散弹道具
│   └── powerup_shield.png    # 护盾道具
│
├── audio/                     # 音频资源目录
│   ├── bgm_main.mp3          # 背景音乐（占位符）
│   ├── sfx_shoot.mp3         # 射击音效（占位符）
│   ├── sfx_explosion.mp3     # 爆炸音效（占位符）
│   └── sfx_powerup.mp3       # 道具拾取（占位符）
│
└── config.json               # GTRS 配置文件
```

---

## 🔧 实际工作流

### 场景 1: 新项目启动

```bash
# 1. 编写 GDD
vim games/my-game/GAME_DESIGN_DOCUMENT.md

# 2. 生成初始资源
npm run generate -- \
  -g games/my-game/GAME_DESIGN_DOCUMENT.md \
  -o output/my-game-theme \
  -t my-game-v1

# 3. 验证资源
npm run validate -- \
  -g games/my-game/GAME_DESIGN_DOCUMENT.md \
  -r output/my-game-theme

# 4. 上传到 GTRS
# (使用 GTRS 后台或 API)

# 5. 在游戏中使用
# await game.start('medium', 'my-game-v1-id')
```

### 场景 2: 修改设计后更新

```bash
# 1. 更新 GDD
vim games/my-game/GAME_DESIGN_DOCUMENT.md

# 2. 重新生成资源
npm run generate -- \
  -g games/my-game/GAME_DESIGN_DOCUMENT.md \
  -o output/my-game-theme-v2 \
  -t my-game-v2

# 3. 对比新旧版本
diff output/my-game-theme output/my-game-theme-v2

# 4. 验证新资源
npm run validate -- \
  -g games/my-game/GAME_DESIGN_DOCUMENT.md \
  -r output/my-game-theme-v2

# 5. 上传新版本到 GTRS
```

### 场景 3: 批量生成多个主题

创建脚本 `batch-generate.sh` (Linux/Mac):

```bash
#!/bin/bash

for game in plane-shooter tank-battle snake; do
  echo "Generating theme for $game..."
  npm run generate -- \
    -g ../../games/$game/GAME_DESIGN_DOCUMENT.md \
    -o ./output/$game-theme \
    -t $game-theme
done
```

或 `batch-generate.ps1` (Windows PowerShell):

```powershell
$games = @('plane-shooter', 'tank-battle', 'snake')

foreach ($game in $games) {
  Write-Host "Generating theme for $game..."
  npm run generate -- `
    -g "../../games/$game/GAME_DESIGN_DOCUMENT.md" `
    -o "./output/$game-theme" `
    -t "$game-theme"
}
```

---

## ⚡ 重要提示

### 1. GDD 格式必须正确

工具会从 GDD 提取以下章节：

- `### 4.1 图片资源清单`
- `### 4.2 音频资源清单`
- `### 2.1 玩家角色`
- `### 2.2 敌对单位`
- `### 2.3 子弹设计`
- `### 2.4 道具设计`

**确保你的 GDD 包含这些章节！**

### 2. 音频目前是占位符

生成的 `.mp3` 文件是空的（0 字节），因为：

- 音频生成需要专业库或 API
- 建议手动录制或使用音频编辑软件制作

**TODO**: 集成音频生成功能

### 3. 严格模式无法跳过

如果遇到错误：

```
❌ 缺失资源：player.png
```

**解决方法**:
1. 检查 GDD 中是否正确定义了该资源
2. 如果不需要，从 GDD 中删除该需求
3. 不要试图跳过或绕过校验

---

## 🐛 常见问题

### Q1: 为什么报错"找不到 GDD 文件"？

**A**: 检查路径是否正确：

```bash
# ❌ 错误：相对路径不对
-g GAME_DESIGN_DOCUMENT.md

# ✅ 正确：使用完整相对路径
-g ../../games/plane-shooter/GAME_DESIGN_DOCUMENT.md
```

### Q2: 如何添加自定义资源类型？

**A**: 
1. 在 GDD 的表格中添加新资源
2. 在 `src/core/resource-generator.js` 中添加生成方法
3. 重新运行生成命令

### Q3: 生成的图片太丑怎么办？

**A**: 
- 这是正常的！这是占位图，用于开发测试
- 联系美术设计师制作真实资源
- 用真实资源替换占位图

### Q4: 可以只生成部分资源吗？

**A**: 不可以！严格模式下：
- 必须生成 GDD 中所有"必需"资源
- 如果有不需要的资源，从 GDD 中删除

### Q5: 如何查看生成的日志？

**A**: 工具会自动输出详细日志：

```
🎨 主题资源生成器 v1.0

✔ 解析 GDD 文档
✔ 验证资源需求完整性
✔ 生成主题资源
  ✅ 生成图片：player.png
  ✅ 生成图片：enemy_small.png
  ...
✔ 严格校验生成的资源
✅ 资源生成完成！
```

---

## 📊 与其他工具对比

| 功能 | 本工具 | 手动准备 | GTRS 后台 |
|------|-------|---------|----------|
| 从 GDD 读取需求 | ✅ 自动 | ❌ 手动 | ❌ 手动 |
| 批量生成资源 | ✅ 一键完成 | ❌ 逐个制作 | ⚠️ 部分支持 |
| 严格校验 | ✅ 强制 | ❌ 无 | ⚠️ 基础校验 |
| 占位图生成 | ✅ 支持 | ❌ 不支持 | ❌ 不支持 |
| 配置文件生成 | ✅ 自动 | ❌ 手动 | ✅ 自动 |

---

## 🎯 最佳实践

### 1. 先写 GDD，再生成资源

```
✅ 好：GDD 完成 → 评审通过 → 生成资源
❌ 坏：边做边想 → 随意生成 → 反复修改
```

### 2. 使用版本管理

```bash
# 每次生成使用不同的主题名
output/plane-shooter-v1/
output/plane-shooter-v2/
output/plane-shooter-v3/
```

### 3. 及时验证

每次修改 GDD 后都运行验证：

```bash
npm run validate -- -g GAME_DESIGN_DOCUMENT.md -r resources
```

### 4. 替换真实资源

```bash
# 1. 生成占位图
npm run generate -- ...

# 2. 用真实资源替换
cp /path/to/artist/player.png output/theme/images/player.png

# 3. 验证
npm run validate -- ...
```

---

## 📞 技术支持

遇到问题？

1. **查看本文档**
2. **检查 GDD 格式**
3. **查看 README.md**
4. **联系技术团队**

---

<div align="center">

## 🎉 总结

**核心理念**:

> **从 GDD 自动生成，严格校验，无降级方案！**

**立即开始**:

```bash
npm install
npm run generate -- -g GDD.md -o output -t theme
npm run validate -- -g GDD.md -r output
```

</div>

---

**文档版本**: v1.0  
**最后更新**: 2026-03-27  
**维护者**: Kids Game Team
