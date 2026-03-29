# 🚀 游戏重命名快速参考卡

## ⚡ 30 秒快速开始

```bash
# 1. 进入新游戏目录
cd kids-game-house/games/你的游戏名

# 2. 运行自动化工具（一行命令搞定）
node ../../.lingma/skills/game-dev/tools/rename-game-helper.js snake 你的游戏名

# 3. 手动补充（修改 package.json 和路由）

# 4. ⚠️ 关键流程：生成资源 → 注册 → 测试
node generate-resources.mjs              # 步骤 1: 生成 GTRS 资源
mysql -u root -p kids_game < register-game.sql  # 步骤 2: 注册游戏
npm run dev                              # 步骤 3: 启动测试
```

## 📋 核心检查清单（6 项必做）

- [ ] **package.json** - name 和 displayName 已更新
- [ ] **全局替换** - Snake/snake → 你的游戏名（排除框架代码）
- [ ] **文件重命名** - SnakeGameView.vue → 你的游戏名 GameView.vue
- [ ] **路由更新** - 前端路由指向新组件
- [ ] **生成资源** - `node generate-resources.mjs` ✅
- [ ] **注册游戏** - SQL 脚本已执行 ✅
- [ ] **验证通过** - grep 无残留

⚠️ **关键顺序**：生成资源 → 注册 → 测试（不可颠倒）！

## 🎯 关键规则

### ✅ 必须替换的
| 原文 | 替换为 |
|------|--------|
| `SnakeGame` | `你的游戏名 Game` |
| `snake` (小写) | `你的游戏名` (小写) |
| `Snake` (大写) | `你的游戏名` (大写) |
| `useSnakeStore` | `use 你的游戏名 Store` |

### ❌ 禁止替换的
- `src/components/core/` - 核心层
- `src/components/rendering/` - 渲染层
- `src/components/game/GameOrchestrator.ts` - 编排器

## 🔍 验证命令

```bash
# 检查是否有残留
grep -r "snake\|Snake" src/ \
  --exclude-dir=core \
  --exclude-dir=rendering

# 期望结果：无输出（完美✅）
```

## 🆘 常见错误示例

### 错误 1：Store 引用未更新
```typescript
// ❌ 错误
import { useSnakeStore } from '@/stores/snake'

// ✅ 正确
import { usePlaneShooterStore } from '@/stores/plane-shooter'
```

### 错误 2：路由指向旧组件
```typescript
// ❌ 错误
{ path: '/my-game', component: () => import('@/views/SnakeGameView.vue') }

// ✅ 正确
{ path: '/my-game', component: () => import('@/views/MyGameGameView.vue') }
```

## 📚 完整文档索引

| 文档 | 用途 | 位置 |
|------|------|------|
| **SKILL.md** | 主文档，快速流程 | 根目录 |
| **RENAME_CHECKLIST.md** | 详细检查清单 | docs/ |
| **rename-game-helper.js** | 自动化工具 | tools/ |
| **tools/README.md** | 工具使用说明 | tools/ |

## 💡 最佳实践

1. **先备份** - `git checkout -b rename-branch`
2. **用工具** - 自动化处理 90% 工作
3. **再验证** - 运行 grep 检查残留
4. **填清单** - 确保所有项目完成

## 🎓 核心理念

> **不要从零开始，参考真实游戏 + 修改参数 = 新游戏**
> 
> 但一定要**彻底重命名**，避免代码污染！

---

**需要帮助？** 查看完整文档：[docs/RENAME_CHECKLIST.md](./docs/RENAME_CHECKLIST.md)
