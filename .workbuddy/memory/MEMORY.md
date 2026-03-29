# 项目长期记忆

## 项目结构概览

| 子工程 | 说明 |
|--------|------|
| `kids-game-house/` | 游戏实现（snake 贪吃蛇、tank-battle 坦克大战）|
| `kids-game-frontend/` | 平台前端（Vue3 + Element Plus）|
| `kids-game-backend/` | 平台后端（Spring Boot）|
| `kids-game-auto-test/` | 自动化测试工具 |
| `kids-game-frame-factory/` | 游戏开发框架（模板驱动）|

---

## 游戏开发策略（2026-03-29 v2.0）

**理念**：纯净框架 + 模板驱动 + snake作为最佳实践

**核心变化**：
- ❌ 废弃：复制 snake 代码创建新游戏（会导致snake残留）
- ✅ 新方式：从 frame-factory 模板初始化新游戏

**三层架构**：
```
┌─────────────────────────────────────────────────────────────┐
│  【框架层】kids-game-frame-factory/src/                    │
│  ├── engine/BaseGameEngine.ts    # 游戏引擎基类            │
│  ├── types/                      # 通用类型定义            │
│  └── utils/                       # 工具函数               │
├─────────────────────────────────────────────────────────────┤
│  【模板层】kids-game-frame-factory/templates/game-template/ │
│  ├── src/config/                 # 配置模板                 │
│  ├── src/views/                  # 页面模板（可复用）       │
│  ├── src/components/ui/           # UI组件（可复用）        │
│  ├── src/components/game/         # 游戏容器（可复用）       │
│  ├── src/scenes/GameScene.ts     # 游戏场景 ⚠️ 需重写      │
│  └── src/stores/                 # 状态管理（可复用）        │
├─────────────────────────────────────────────────────────────┤
│  【最佳实践】kids-game-house/games/snake/                  │
│  └── 验证框架可行性，参考实现，不用于复制                    │
└─────────────────────────────────────────────────────────────┘
```

**创建新游戏**：
```bash
# 1. 从模板初始化（不是复制snake！）
cp -r kids-game-frame-factory/templates/game-template games/my-game

# 2. 全局重命名
# - 目录名、package.json、App.vue组件名

# 3. 配置
# - config/GTRS.json
# - config/difficulty.json
# - config/game-config.json

# 4. 实现游戏逻辑（重写 scenes/GameScene.ts）
# - 参考 snake 实现，但不复制代码

# 5. 注册游戏
# - register-game.sql
```

**与snake的关系**：
| 操作 | snake | 模板 |
|------|-------|------|
| 创建新游戏 | ❌ 复制（不推荐） | ✅ 模板初始化 |
| 参考实现 | ✅ 参考 | - |
| UI组件 | ✅ 可复用 | ✅ 可复用 |
| 游戏逻辑 | 参考但不复制 | 重写 |

---

## 框架屏幕适配（4 层配合）

1. **index.html**: `viewport-fit=cover` + `env(safe-area-inset-*)` body padding
2. **App.vue**: `100vw × 100vh` + `overflow: hidden`
3. **GameView.vue**: `h-screen w-full overflow-hidden` + `touch-action: none`
4. **Phaser config**: `mode: RESIZE` + `width: '100%', height: '100%'`

**关键区别**：`RESIZE`（全屏）vs `FIT`（等比缩放）

---

## GTRS 规范（v1.0.0）

**4个顶级字段**：`specMeta` / `themeInfo` / `globalStyle` / `resources`  
**资源结构**：`resources.images.scene`、`resources.audio.bgm`、`resources.audio.effect`  

**设计规则**：
- `GTRS.json` 纯结构定义，src 全空；无主题必须报错（assertGTRS() 直接 throw）
- 资源路径不含 `/public/` 前缀；`normalizeSrcPaths()` 自动兼容旧格式
- `applicableScope` 废弃，统一用 `ownerType=GAME` + `ownerId`

**关键接口**：
- `GET /api/theme/download?id=xxx`（需登录）
- `GET /api/theme/editor-data?id=xxx`（编辑器专用）
- `POST /api/theme/approve?themeId=xxx&approved=true/false`

---

## 贪吃蛇游戏（kids-game-house/games/snake/）

### 道具系统（2026-03-26 修复）
- 碰撞坐标统一为 `col * cellSize + cellSize/2`
- `game.ts` 新增 `itemEffects` + `applyItemEffect()` + `resetItemEffects()`
- `PhaserGame` 用 `onItemEffect` 回调注入（⚠️ Pinia store 不能在 Phaser class 内调用）
- `resetItemEffects()` 逐字段重置，避免路由过渡时访问 undefined

### 自定义配置系统（2026-03-28）
- `CustomGameConfig` 存在 `gameStore.customConfig`，`DifficultyView.vue` 写入
- 优先级：`customConfig > DIFFICULTY_CONFIGS[difficulty]`
- 废弃 sessionStorage 方案，改 Pinia store 直接传递

---

## 认证安全策略

**严格模式**：所有 `/api/theme/**` 需登录。  
**公开接口**：`/api/auth/*`、`/api/kid/login`、`/api/parent/login`、`/api/game/list`、`/api/game/code/*`、`/api/game/config/**`、`/api/question/random`

---

## 硬编码审计（2026-03-22）

- BCryptGenerator.java：移除硬编码密码，改命令行参数
- ThemeStorePage.vue：用户ID从 `userStore.currentUser?.id` 动态获取
- 前端新增：`api.types.ts`（GAME_STATUS、THEME_STATUS、USER_TYPE 枚举）
- 后端新增：`UserRelation.java`（PERMISSION_*、STATUS_* 常量）
- `UnifiedGameManager.ts` 使用 `envConfig.resourceBaseUrl`

---

## 游戏框架 v4.0 设计（2026-03-29 v4.1）

**核心理念**：零耦合 + 模板复制 + 游戏完全独立 + 统一管理

### 整合内容

所有游戏开发相关的资源都纳入 frame-factory 统一管理：

| 资源类型 | 位置 | 说明 |
|----------|------|------|
| 游戏项目模板 | `templates/game-template/` | 完整游戏项目结构 |
| 配置模板 | `templates/*.template.json` | GTRS、难度、i18n 等配置 |
| 开发文档 | `docs/` | 开发指南、GTRS规范、检查清单 |
| SQL 模板 | `templates/register-game.template.sql` | 数据库注册 |

### frame-factory 结构（v4.1）
```
kids-game-frame-factory/
├── docs/                           # 📚 开发文档
│   ├── GAME_DEV_GUIDE.md          # 游戏开发完整指南
│   ├── GTRS_GUIDE.md              # GTRS 资源配置规范
│   └── CHECKLIST.md               # 开发检查清单
│
├── templates/                       # 📋 配置模板
│   ├── game-template/             # ⭐ 游戏项目模板
│   ├── GTRS.template.json         # GTRS 配置模板
│   ├── difficulty.template.json   # 难度配置模板
│   ├── i18n.template.json          # 国际化模板
│   ├── register-game.template.sql # 数据库注册模板
│   └── generate-resources.mjs     # 资源生成脚本
│
└── README.md                       # 框架入口
```

### 关键原则

❌ **禁止**：`import { ... } from '@/frame-factory'`（依赖耦合）  
✅ **正确**：frame-factory 只提供模板文件，复制后游戏完全独立

### 创建新游戏流程

```bash
# 1. 复制模板
cp -r kids-game-frame-factory/templates/game-template games/my-game

# 2. 全局重命名（IDE 重构）
# - 目录名、package.json、App.vue

# 3. 配置
# - src/config/GTRS.json
# - src/config/difficulty.json

# 4. 实现游戏逻辑（重写 scenes/GameScene.ts）
# - 参考 snake，不复制代码

# 5. 注册
# - register-game.sql
```

### 与其他游戏的关系

| 目的 | 来源 | 方式 |
|------|------|------|
| 参考实现 | `kids-game-house/games/snake/` | 阅读参考 |
| 创建新游戏 | `templates/game-template/` | 复制模板 |
| Skill 指南 | `/game-dev` | IDE 中使用 |

### 框架升级策略

框架升级只影响新的游戏项目，已有游戏不受影响（独立副本）。

---

## 技术规范

- **IDE 沙箱**：禁止原生 `confirm()`/`alert()`，用 ElMessageBox/ElMessage
- **音频格式**：统一 `.mp3`
- **前后端 Schema 同步**：`gtrs-schema.json` 两份必须同步
- **类型检查**：用 `npx tsc --noEmit`（非 vue-tsc）
- **UI 缩放**：用 `useResponsiveUI()` 工具函数（设计基准 720×1280）
  - `uiScaleRef` 是 Vue `computed ref`，在组件 computed 内自动响应式
  - `GameButton` props 传原始设计尺寸数字（如 `:fontSize="26"`），内部自行缩放
