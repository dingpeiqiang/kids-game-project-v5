# 重命名检查清单 - 避免贪吃蛇代码污染

## ⚠️ 为什么这很重要？

由于新游戏是通过**复制贪吃蛇游戏**快速创建的，如果重命名不彻底，会导致：
- ❌ 贪吃蛇特有的代码（`SnakeGame`、`snakeStore`）嵌入到新游戏中
- ❌ 路由引用错误的组件
- ❌ Store 引用混乱
- ❌ 代码难以维护和调试

## 📋 完整检查清单（按顺序执行）

### 阶段 1：文件重命名

#### ✅ package.json
- [ ] `name` 字段已从 `@kids-game/snake` 改为 `@kids-game/你的游戏名`
- [ ] `displayName` 字段已更新为新游戏的中文名

#### ✅ Vue 组件文件
- [ ] `src/views/SnakeGameView.vue` → `src/views/你的游戏名 GameView.vue`
- [ ] `src/components/Snake*.vue` → `src/components/你的游戏名*.vue`
- [ ] 检查 `src/phaser/` 目录下的文件（如果有）

#### ✅ TypeScript 文件
- [ ] `src/stores/snake.ts` → `src/stores/你的游戏名.ts`
- [ ] `src/phaser/SnakeGame.ts` → `src/phaser/你的游戏名 Game.ts`（如果有）
- [ ] 其他包含 `Snake` 的 `.ts` 文件名

### 阶段 2：代码内容替换

#### ✅ 使用 IDE 全局替换（Ctrl+Shift+H）

**替换规则表**：

| 查找 | 替换为 | 影响范围 | 优先级 |
|------|--------|---------|--------|
| `SnakeGame` | `你的游戏名 Game` | 所有业务文件 | 🔴 高 |
| `snake` | `你的游戏名` (小写) | 所有业务文件 | 🔴 高 |
| `Snake` | `你的游戏名` | 除框架代码外 | 🔴 高 |
| `useSnakeStore` | `use 你的游戏名 Store` | 所有使用 store 的地方 | 🔴 高 |
| `snake/` (导入路径) | `你的游戏名/` | import 语句 | 🔴 高 |

**禁止替换的文件/目录**（跳过这些）：
- 🟢 `src/components/core/` - 核心层必须保留原样
- 🟢 `src/components/rendering/` - 渲染层必须保留原样
- 🟢 `src/components/game/GameOrchestrator.ts` - 编排器必须保留原样

#### ✅ 检查替换结果

替换后，重点检查以下文件类型：

1. **路由配置文件** (`router/*.ts`)
   ```typescript
   // ❌ 错误示例
   { path: '/snake', component: () => import('@/views/SnakeGameView.vue') }
   
   // ✅ 正确示例
   { path: '/plane-shooter', component: () => import('@/views/PlaneShooterGameView.vue') }
   ```

2. **Store 文件** (`stores/*.ts`)
   ```typescript
   // ❌ 错误示例
   import { useSnakeStore } from './snake'
   
   // ✅ 正确示例
   import { usePlaneShooterStore } from './plane-shooter'
   ```

3. **Vue 组件** (`*.vue`)
   - 检查 `<script>` 标签中的 import 语句
   - 检查 `setup()` 函数中的 store 调用
   - 检查模板中的组件引用

4. **TypeScript 逻辑文件** (`*.ts`)
   - 检查所有 import 语句
   - 检查类名、函数名、变量名

### 阶段 3：验证

#### ✅ 运行验证命令

在项目根目录执行：

```bash
# 进入新游戏目录
cd kids-game-house/games/你的游戏名

# 搜索是否还有 snake/Snake 关键字（排除框架代码）
grep -r "snake\|Snake" src/ \
  --exclude-dir=core \
  --exclude-dir=rendering \
  --exclude=GameOrchestrator.ts

# Windows PowerShell 版本
Select-String -Path "src/**/*.ts" -Pattern "snake|Snake" | 
  Where-Object { $_.Path -notmatch "core|rendering|GameOrchestrator" }
```

**期望结果**：
- ✅ 无输出（完美！）
- ⚠️ 如果有输出，逐个检查并替换

#### ✅ 手动检查关键点

1. **导入语句检查**
   ```typescript
   // 检查所有这些文件中的 import
   - src/main.ts
   - src/App.vue
   - src/router/*.ts
   - src/views/*GameView.vue
   - src/stores/*.ts
   ```

2. **Store 使用检查**
   ```typescript
   // 在你的游戏代码中搜索
   - useStore(
   - store.dispatch(
   - store.getters[
   - 从 './stores/
   ```

3. **路由检查**
   - 打开前端项目的路由配置文件
   - 确认指向新游戏的组件，不是 SnakeGameView

### 阶段 4：测试验证

#### ✅ 正确的启动顺序（⚠️ 关键！）

**必须按照以下顺序执行**：

```bash
# 步骤 1: 生成 GTRS 资源
node generate-resources.mjs

# ✅ 验证：检查 dist/ 目录是否生成
ls dist/
# 应该看到：images/, audio/, themes/ 等目录

# 步骤 2: 注册游戏到数据库
mysql -u root -p kids_game < register-game.sql

# ✅ 验证：查询数据库
# SELECT * FROM t_game WHERE game_name = '你的游戏名';
# SELECT * FROM t_theme_info WHERE theme_name = '你的游戏名主题';

# 步骤 3: 安装依赖并启动开发服务器
npm install
npm run dev

# ✅ 访问游戏 URL 测试
# http://localhost:5173/games/你的游戏名/
```

**⚠️ 重要提醒**：
- **必须先注册再测试**，否则前端无法找到游戏配置
- **必须先生成资源再注册**，否则 GTRS 路径会错误
- 如果启动失败，检查数据库是否已注册、资源是否已生成

#### ✅ 编译测试

```bash
# 安装依赖
npm install

# 类型检查
npx tsc --noEmit

# 开发模式运行
npm run dev
```

**检查项**：
- [ ] 无编译错误
- [ ] 无 TypeScript 类型错误
- [ ] 能正常启动开发服务器

#### ✅ 运行时测试

访问新游戏的路由（如 `/plane-shooter`），检查：
- [ ] 页面能正常加载
- [ ] 控制台无错误（F12 查看）
- [ ] Store 状态正常
- [ ] 游戏逻辑正常运行

## 🔧 常见问题修复

### 问题 1：导入路径错误

**错误**：
```typescript
import { SnakeGameStore } from '@/stores/snake'
```

**修复**：
```typescript
import { PlaneShooterStore } from '@/stores/plane-shooter'
```

### 问题 2：路由指向旧组件

**错误**：
```typescript
{ path: '/my-game', component: () => import('@/views/SnakeGameView.vue') }
```

**修复**：
```typescript
{ path: '/my-game', component: () => import('@/views/MyGameGameView.vue') }
```

### 问题 3：Store 名称冲突

**错误**：
```typescript
const gameStore = useSnakeStore() // 新游戏还在用贪吃蛇的 store
```

**修复**：
```typescript
const gameStore = useMyGameStore() // 使用新游戏的 store
```

## 📝 重命名完成确认

在完成所有检查后，填写以下确认：

- [ ] ✅ package.json 已更新
- [ ] ✅ 所有 Vue 文件名已重命名
- [ ] ✅ 所有 TypeScript 文件名已重命名
- [ ] ✅ 代码中的 Snake/snake 已替换（除框架代码）
- [ ] ✅ Store 已重命名并更新引用
- [ ] ✅ 路由配置已更新
- [ ] ✅ grep 验证无残留
- [ ] ✅ 编译测试通过
- [ ] ✅ 运行时测试通过

## 💡 最佳实践建议

1. **使用 IDE 的智能替换功能**
   - VSCode: Ctrl+Shift+H（在文件中替换）
   - WebStorm: Ctrl+Shift+R（全局替换）
   - 使用正则表达式更精确

2. **分批次替换**
   - 先替换文件名
   - 再替换代码内容
   - 最后验证

3. **保留框架代码**
   - `core/`、`rendering/`、`GameOrchestrator.ts` 不要动
   - 这些是所有游戏共用的

4. **使用版本控制**
   ```bash
   # 重命名前创建分支
   git checkout -b rename-snake-to-mygame
   
   # 每完成一步就提交
   git add .
   git commit -m "Rename Snake to MyGame - step 1: files"
   ```

## 🆘 如果发现大量错误

如果验证时发现到处都是 `snake`/`Snake`：

1. **不要慌**，这是正常的
2. **回退重来**：
   ```bash
   git reset --hard HEAD
   ```
3. **按照本清单重新执行**，每一步都验证
4. **寻求帮助**：询问团队或使用 AI 助手

---

**最后提醒**：重命名是创建新游戏最关键的一步，务必仔细检查每一个环节！
