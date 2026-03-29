# game-dev Skill 优化总结

## 📋 优化概述

对 `.lingma/skills/game-dev/SKILL.md` 进行了全面优化，使其与项目实际架构保持一致。

---

## ✨ 主要优化点

### 1. **明确可复用框架代码位置**

#### 优化前
- 模糊地提到 "基于 framework"
- 没有明确指出框架代码在哪里
- 容易让人误解为存在独立的 `shared/game-framework` 目录

#### 优化后
```markdown
**架构基础**:基于贪吃蛇游戏中的可复用框架代码（位于 `games/snake/src/components/`），包含:
- **核心层**:ResourceLoader、AdaptationManager、AudioManager 等
- **编排器**:GameOrchestrator 统一调度各组件
- **渲染层**:BackgroundRenderer、GridRenderer、ParticleRenderer 等
```

✅ **清晰指出**:框架代码在 `kids-game-house/games/snake/src/components/`

---

### 2. **新增复制框架代码步骤**

#### 优化前
- 只说"复制游戏目录"
- 没有强调哪些是框架代码需要保留

#### 优化后
```markdown
### 3. 复制框架代码（关键步骤）

⚠️ **重要**:从贪吃蛇游戏复制可复用框架组件:

```bash
# 复制核心组件（必须保留）
cp -r ../snake/src/components/core ./src/components/
cp -r ../snake/src/components/game/GameOrchestrator.ts ./src/components/game/
cp -r ../snake/src/components/rendering/BackgroundRenderer.ts ./src/components/rendering/
cp -r ../snake/src/components/rendering/GridRenderer.ts ./src/components/rendering/
cp -r ../snake/src/components/rendering/ParticleRenderer.ts ./src/components/rendering/
```

这些是**可复用框架代码**,所有游戏共享，不要修改它们!
```

✅ **明确指令**:必须复制框架代码，且禁止修改

---

### 3. **三层架构图解**

#### 优化前
- 简单列出目录结构
- 没有分层说明

#### 优化后
```markdown
my-game/
├── src/
│   ├── components/
│   │   ├── core/              # 🔧 核心层（从 snake 复制，禁止修改）
│   │   ├── rendering/         # 🎨 渲染层（从 snake 复制，可扩展）
│   │   ├── game/              # 🎮 游戏编排
│   │   ├── logic/             # 🧠 游戏逻辑层（需要修改）
│   │   ├── control/           # 🎛️ 控制层（需要修改）
│   │   └── ui/                # 💎 UI 组件层（需要修改）
```

**架构说明**:
- 🔧 **核心层**:所有游戏共用，从 snake 复制，禁止修改
- 🎨 **渲染层**:通用渲染器，从 snake 复制，可按需扩展
- 🎮 **编排层**:GameOrchestrator 统一调度
- 🧠 **逻辑层**:每个游戏的特定业务逻辑，需要自己实现
- 💎 **UI 层**:游戏特定的界面展示
```

✅ **清晰分层**:用 emoji 和注释标明每层的职责和修改规则

---

### 4. **6 步创建新游戏流程**

#### 优化前
```markdown
1. 参考 snake 游戏复制目录
2. 修改 package.json
3. 修改 GTRS.json
4. 编辑游戏逻辑文件
5. 执行 register-game.sql
```

#### 优化后
```markdown
1. **复制参考游戏**
   ```bash
   cp -r ../snake my-game
   cd my-game
   ```

2. **重命名代码**（不要改动框架代码）
   - 修改 `package.json` 的 name 和 displayName
   - 全局替换 Snake → MyGame
   - 重命名 Vue 文件

3. **复制框架代码**（必须保留）
   ```bash
   cp -r ../snake/src/components/core ./src/components/
   cp -r ../snake/src/components/rendering/*.ts ./src/components/rendering/
   cp -r ../snake/src/components/game/GameOrchestrator.ts ./src/components/game/
   ```

4. **修改配置**
   - GTRS.json: gameId, gameName, themeName
   - difficulty.json: 难度参数
   - phaser/game.ts: 游戏规则

5. **实现游戏逻辑**
   - logic/: 游戏特定逻辑
   - control/: 输入控制
   - ui/: UI 界面

6. **注册与测试**
   - 执行 register-game.sql
   - 运行 node generate-resources.mjs
   - npm run dev 测试
```

✅ **详细步骤**:每一步都有具体的命令和说明

---

### 5. **新增技术规范**

```markdown
- **框架代码**:核心层和渲染层代码禁止修改，只能扩展
- **设计先行**:必须先完成 GDD 设计文档并通过评审
```

✅ **强调规范**:框架代码不可修改，设计先行原则

---

### 6. **完善文档链接**

```markdown
## 更多信息

- 📖 **游戏开发完整指南**:[docs/GAME_DEV_GUIDE.md](./docs/GAME_DEV_GUIDE.md)
- 📦 **GTRS 资源规范**:[docs/GTRS_GUIDE.md](./docs/GTRS_GUIDE.md)
- ✅ **检查清单**:[docs/CHECKLIST.md](./docs/CHECKLIST.md)
- 🐍 **贪吃蛇游戏源码**:`kids-game-house/games/snake/`
- 🏗️ **可复用框架代码**:`kids-game-house/games/snake/src/components/`
- 📚 **设计先行文档**:`kids-game-house/docs/README_DESIGN_FIRST.md`
```

✅ **完整索引**:用 emoji 标注不同类型的文档

---

## 📊 优化效果对比

| 方面 | 优化前 | 优化后 |
|------|--------|--------|
| **框架定位** | ❌ 模糊 | ✅ 清晰（snake/src/components） |
| **框架代码复制** | ❌ 未提及 | ✅ 明确命令 + 警告 |
| **架构分层** | ❌ 无分层 | ✅ 三层架构 + emoji 标注 |
| **操作步骤** | ⚠️ 5 步简略 | ✅ 6 步详细 + 代码示例 |
| **修改规则** | ❌ 未说明 | ✅ 明确哪些能改/不能改 |
| **文档链接** | ⚠️ 3 个 | ✅ 6 个完整链接 |

---

## 🎯 核心价值

### 解决的核心问题

1. **框架代码在哪里？**
   - 之前：找不到 `shared/game-framework`
   - 现在：明确在 `games/snake/src/components/`

2. **如何复用框架？**
   - 之前：不知道要复制哪些文件
   - 现在：明确的 `cp` 命令复制 3 个目录

3. **哪些能改，哪些不能改？**
   - 之前：没有说明
   - 现在：🔧核心层和🎨渲染层禁止修改，🧠逻辑层需要自己实现

4. **完整的开发流程是什么？**
   - 之前：5 步，缺少框架代码复制
   - 现在：6 步，包含所有关键环节

---

## 🔗 相关文档

- **主 Skill 文档**:`.lingma/skills/game-dev/SKILL.md`
- **游戏开发指南**:`.lingma/skills/game-dev/docs/GAME_DEV_GUIDE.md`
- **GTRS 规范**:`.lingma/skills/game-dev/docs/GTRS_GUIDE.md`
- **检查清单**:`.lingma/skills/game-dev/docs/CHECKLIST.md`
- **设计先行**:`kids-game-house/docs/README_DESIGN_FIRST.md`

---

## 📝 后续建议

### 短期（可选优化）

1. **添加自动化脚本**
   ```powershell
   # kids-game-house/tools/create-game.ps1
   # 一键创建新游戏并复制框架代码
   ```

2. **创建框架代码清单**
   ```markdown
   ## 必须复制的框架文件
   - [ ] core/ResourceLoader.ts
   - [ ] core/AdaptationManager.ts
   - [ ] core/AudioManager.ts
   - [ ] rendering/BackgroundRenderer.ts
   - [ ] rendering/GridRenderer.ts
   - [ ] rendering/ParticleRenderer.ts
   - [ ] game/GameOrchestrator.ts
   ```

3. **更新 GAME_DEV_GUIDE.md**
   - 同样需要明确框架代码位置和复制步骤

### 长期（架构优化）

考虑将可复用框架代码真正抽取到独立目录：
```
kids-game-house/
├── shared/
│   └── game-framework/      # 独立的框架包
│       ├── core/
│       ├── rendering/
│       ├── components/
│       └── package.json     # 可作为 npm 包安装
├── games/
│   ├── snake/
│   └── my-game/
```

---

## ✅ 总结

本次优化聚焦于**明确框架代码位置和复用方式**,解决了:
1. ✅ 框架在哪里的问题
2. ✅ 如何复制框架代码
3. ✅ 哪些代码能改/不能改
4. ✅ 完整的 6 步开发流程

使 game-dev skill 真正成为**可操作的实战指南**,而非概念性的介绍。
