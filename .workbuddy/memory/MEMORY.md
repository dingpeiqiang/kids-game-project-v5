# 项目长期记忆

## 项目结构概览

| 子工程 | 说明 |
|--------|------|
| `kids-game-house/` | 游戏实现（snake 贪吃蛇、tank-battle 坦克大战）|
| `kids-game-frontend/` | 平台前端（Vue3 + Element Plus）|
| `kids-game-backend/` | 平台后端（Spring Boot）|
| `kids-game-auto-test/` | 自动化测试工具 |

---

## 游戏开发策略（2026-03-28 更新）

**决策**：废弃 kids-game-frame-factory 的组件化架构，改用「存量游戏示例 + game-dev Skill」方案。

**原因**：
1. kids-game-frame-factory 维护成本高（18项遗留问题）
2. 框架复杂度高，上手成本大
3. 实际项目中，直接参考已有游戏更高效

**新方案**：
- 参考游戏：`kids-game-house/games/snake/`（成熟完整）
- Skill 指南：`.workbuddy/skills/game-dev/`（整合 GTRS 规范、游戏克隆指南）
- 开发清单：`.workbuddy/skills/game-dev/docs/CHECKLIST.md`

### game-dev Skill 文件结构
```
.workbuddy/skills/game-dev/
├── SKILL.md                    # 主入口
├── docs/
│   ├── GAME_DEV_GUIDE.md       # 完整开发指南
│   ├── GTRS_GUIDE.md          # GTRS 资源配置规范
│   └── CHECKLIST.md           # 开发检查清单
└── templates/
    ├── GTRS.template.json     # GTRS 配置模板
    ├── difficulty.template.json # 难度配置模板
    ├── register-game.template.sql # 数据库注册模板
    ├── generate-resources.template.mjs # 资源生成脚本模板
    └── i18n.template.json      # 国际化模板
```

### 克隆新游戏步骤
1. `cp -r kids-game-house/games/snake games/my-game`
2. 全局重命名类名和组件名
3. 修改 `src/config/GTRS.json`
4. 修改 `src/phaser/game.ts` 游戏逻辑
5. 执行 `register-game.sql` 注册数据库
6. 参考 CHECKLIST.md 逐项检查

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

## 游戏开发策略（2026-03-28 更新）

**决策**：废弃 kids-game-frame-factory 的组件化架构，改用「存量游戏示例 + game-dev Skill」方案。

**原因**：
1. kids-game-frame-factory 维护成本高（18项遗留问题）
2. 框架复杂度高，上手成本大
3. 实际项目中，直接参考已有游戏更高效

**新方案**：
- 参考游戏：`kids-game-house/games/snake/`（成熟完整）
- Skill 指南：`.workbuddy/skills/game-dev/`（整合 GTRS 规范、游戏克隆指南）
- 开发清单：`.workbuddy/skills/game-dev/docs/CHECKLIST.md`

### game-dev Skill 文件结构
```
.workbuddy/skills/game-dev/
├── SKILL.md                    # 主入口
├── docs/
│   ├── GAME_DEV_GUIDE.md       # 完整开发指南
│   ├── GTRS_GUIDE.md          # GTRS 资源配置规范
│   └── CHECKLIST.md           # 开发检查清单
└── templates/
    ├── GTRS.template.json     # GTRS 配置模板
    ├── difficulty.template.json # 难度配置模板
    ├── register-game.template.sql # 数据库注册模板
    ├── generate-resources.template.mjs # 资源生成脚本模板
    └── i18n.template.json      # 国际化模板
```

### 克隆新游戏步骤
1. `cp -r kids-game-house/games/snake games/my-game`
2. 全局重命名类名和组件名
3. 修改 `src/config/GTRS.json`
4. 修改 `src/phaser/game.ts` 游戏逻辑
5. 执行 `register-game.sql` 注册数据库
6. 参考 CHECKLIST.md 逐项检查

---

## 技术规范

- **IDE 沙箱**：禁止原生 `confirm()`/`alert()`，用 ElMessageBox/ElMessage
- **音频格式**：统一 `.mp3`
- **前后端 Schema 同步**：`gtrs-schema.json` 两份必须同步
- **类型检查**：用 `npx tsc --noEmit`（非 vue-tsc）
- **UI 缩放**：用 `useResponsiveUI()` 工具函数（设计基准 720×1280）
  - `uiScaleRef` 是 Vue `computed ref`，在组件 computed 内自动响应式
  - `GameButton` props 传原始设计尺寸数字（如 `:fontSize="26"`），内部自行缩放
