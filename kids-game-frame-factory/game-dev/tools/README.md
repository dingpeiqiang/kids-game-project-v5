# 游戏重命名工具使用说明

## 🎯 工具用途

这个工具帮助你**彻底重命名**从贪吃蛇复制的游戏，避免贪吃蛇特有的代码（`SnakeGame`、`snakeStore` 等）嵌入到新游戏中。

## 📦 工具组成

1. **rename-game-helper.js** - 自动化重命名脚本
2. **RENAME_CHECKLIST.md** - 完整的手动检查清单
3. **SKILL.md** - 更新后的开发指南

## 🚀 快速开始

### 方法 A：使用自动化工具（推荐）

```bash
# 1. 进入新游戏目录
cd kids-game-house/games/my-game

# 2. 运行重命名工具
node ../../.lingma/skills/game-dev/tools/rename-game-helper.js snake my-game

# 参数说明:
# - snake: 源游戏名称（复制的参考游戏）
# - my-game: 你的新游戏名称
```

**工具会自动完成**：
- ✅ 修改 `.ts`、`.vue`、`.json` 文件中的 Snake/snake 引用
- ✅ 重命名包含旧名称的文件
- ✅ 跳过框架代码（core/、rendering/、GameOrchestrator.ts）
- ✅ 验证结果并报告残留

### 方法 B：手动执行检查清单

如果不想使用自动化工具，可以手动执行：

```bash
# 1. 按照 RENAM E_CHECKLIST.md 逐步执行
# 2. 使用 IDE 的全局替换功能
# 3. 运行验证命令检查残留
```

## 🔧 自动化工具详细说明

### 工作原理

脚本会执行以下操作：

1. **扫描文件**
   - 遍历 `src/` 目录下所有 `.ts`、`.vue`、`.json` 文件
   - 自动跳过框架代码目录（`core/`、`rendering/`）

2. **内容替换**（按优先级）
   ```javascript
   SnakeGame      → MyGameGame
   useSnakeStore  → useMyGameStore
   Snake          → MyGame (大写)
   snake          → my-game (小写，路径除外)
   'snake/'       → 'my-game/' (导入路径)
   ```

3. **文件重命名**
   - `SnakeGameView.vue` → `MyGameGameView.vue`
   - `snake.ts` → `my-game.ts`

4. **验证结果**
   - 搜索残留的 `Snake`/`snake` 引用
   - 生成报告

### 输出示例

```
🚀 游戏重命名工具

源名称：snake
目标名称：plane-shooter
工作目录：D:/project/plane-shooter

📋 执行步骤:

步骤 1/3: 重命名文件内容...
✅ 更新 src/phaser/game.ts (5 处)
✅ 更新 src/stores/plane-shooter.ts (3 处)
⏭️  跳过框架目录：src/components/core
⏭️  跳过框架目录：src/components/rendering

步骤 2/3: 重命名文件名...
📝 重命名：SnakeGameView.vue → PlaneShooterGameView.vue
📝 重命名：snake.ts → plane-shooter.ts

步骤 3/3: 验证重命名结果...
✅ 验证通过！未发现残留的 snake/Snake 引用

==================================================
✅ 重命名完成！所有检查通过。

📖 完整的检查清单请参考:
   docs/RENAME_CHECKLIST.md
```

## ⚠️ 重要提示

### 必须跳过的文件/目录

自动化工具会自动跳过这些，但手动操作时**绝对不能修改**：

- ❌ `src/components/core/` - 核心层（所有游戏共用）
- ❌ `src/components/rendering/` - 渲染层（所有游戏共用）
- ❌ `src/components/game/GameOrchestrator.ts` - 编排器（所有游戏共用）

### 需要额外处理的文件

**前端路由配置**（不在游戏目录内）：

工具无法修改前端项目的路由配置，需要手动处理：

```typescript
// 文件位置：kids-game-frontend/src/router/index.ts

// ❌ 修改前
{ 
  path: '/snake', 
  component: () => import('@/views/SnakeGameView.vue') 
}

// ✅ 修改后
{ 
  path: '/plane-shooter', 
  component: () => import('@/views/PlaneShooterGameView.vue') 
}
```

## 📋 完整工作流程

### 阶段 1：准备

```bash
# 1. 复制参考游戏
cp -r ../snake ../plane-shooter
cd ../plane-shooter

# 2. 备份（可选但推荐）
git add .
git commit -m "Initial copy from snake"
```

### 阶段 2：执行重命名

```bash
# 运行自动化工具
node ../../.lingma/skills/game-dev/tools/rename-game-helper.js snake plane-shooter
```

### 阶段 3：手动补充

```bash
# 1. 修改 package.json
# 编辑 name 和 displayName

# 2. 更新前端路由
# 编辑 kids-game-frontend/src/router/index.ts

# 3. ⚠️ 关键流程：生成资源 → 注册 → 测试
node generate-resources.mjs              # 步骤 1: 生成 GTRS 资源
mysql -u root -p kids_game < register-game.sql  # 步骤 2: 注册游戏
npm install                              # 步骤 3: 安装依赖
npm run dev                              # 步骤 4: 启动测试
```

**⚠️ 重要提醒**：
- **必须先注册再测试**，否则前端无法找到游戏配置
- **必须先生成资源再注册**，否则 GTRS 路径会错误

### 阶段 4：最终验证

```bash
# 再次运行验证
node ../../.lingma/skills/game-dev/tools/rename-game-helper.js snake plane-shooter

# 或者手动验证
grep -r "snake\|Snake" src/ \
  --exclude-dir=core \
  --exclude-dir=rendering \
  --exclude=GameOrchestrator.ts
```

## 🔍 故障排查

### 问题 1：工具报告大量残留

**原因**：可能有遗漏的替换规则

**解决**：
1. 查看工具输出的具体文件列表
2. 使用 IDE 全局搜索这些关键字
3. 手动替换
4. 重新运行工具验证

### 问题 2：编译错误

**可能原因**：
- 导入路径未更新
- Store 名称未同步修改
- 路由配置指向错误的组件

**解决**：
```bash
# 检查 TypeScript 错误
npx tsc --noEmit

# 根据错误信息定位文件
# 使用 IDE 跳转到错误位置
# 检查是否需要手动修改
```

### 问题 3：运行时错误

**典型错误**：
```
Cannot find module '@/stores/snake'
```

**解决**：
1. 检查 store 文件名是否已修改
2. 检查所有 import 语句
3. 清除缓存并重启开发服务器

```bash
# 清除缓存
rm -rf node_modules/.vite
npm run dev
```

## 💡 最佳实践

1. **先备份再操作**
   ```bash
   git checkout -b rename-snake-to-plane-shooter
   ```

2. **分步验证**
   - 每完成一步就运行验证
   - 不要等全部完成才检查

3. **使用版本控制**
   - 每个重要步骤都提交
   - 方便回退

4. **结合使用工具和清单**
   - 先用自动化工具处理 90% 的工作
   - 再用检查清单手动验证剩余部分

## 📚 相关文档

- **[RENAME_CHECKLIST.md](./RENAME_CHECKLIST.md)** - 完整的手动检查清单
- **[SKILL.md](../SKILL.md)** - 游戏开发完整指南
- **[GAME_DEV_GUIDE.md](./GAME_DEV_GUIDE.md)** - 开发流程详解

## 🆘 需要帮助？

如果遇到问题：

1. 查看工具输出的错误信息
2. 检查 RENAM E_CHECKLIST.md 中的常见问题
3. 询问团队成员
4. 使用 AI 助手分析错误

---

**记住**：重命名是创建新游戏最关键的一步，务必仔细检查每一个环节！
