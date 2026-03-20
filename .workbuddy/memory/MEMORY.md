# 项目长期记忆

## 贪吃蛇游戏 GTRS 规范适配（完成于 2026-03-20）

### 项目路径
`kids-game-house/snake-vue3/`

### GTRS 规范核心约定
- **GTRS v1.0.0**：4 个顶级字段 `specMeta` / `themeInfo` / `globalStyle` / `resources`
- **资源结构**：`resources.images.scene`（场景图）、`resources.audio.bgm`（背景乐）、`resources.audio.effect`（音效）
- **key 命名规范**：英文小写+下划线，例如 `snake_head`、`food_apple`、`scene_bg_main`、`effect_eat`

### 关键文件
| 文件 | 说明 |
|------|------|
| `src/config/GTRS.json` | **纯占位符**，枚举本游戏合法 key，src 全空，不作运行兜底 |
| `src/components/game/PhaserGame.ts` | Phaser 游戏引擎封装，完全从 GTRS 读取资源 |
| `src/stores/theme.ts` | Vue UI 层主题状态，从 GTRS globalStyle 提取颜色 |
| `src/utils/gtrs-validator.ts` | GTRS JSON Schema 严格校验工具（Ajv） |

> ⚠️ `public/games/.../gtrs-theme.json` 已删除（多余）

### 设计决策：无主题必须报错
- `GTRS.json` 是纯结构定义（key 枚举），**src 全空**，不可直接运行
- 游戏运行时 `GTRS` 变量初始值为 `null`
- `assertGTRS()` 函数：未加载时直接 `throw`，快速定位问题
- `loadTheme()` 任何失败（未登录 / HTTP 错误 / GTRS 校验不通过）均直接 `throw`，不静默降级
- `start(difficulty, themeId)` 中 `themeId` 必填，否则 `throw`

### 路径规范
- 资源路径 **不含** `/public/` 前缀：`/games/snake-vue3/themes/default/...`
- `normalizeSrcPaths()` 函数自动兼容旧格式 `/public/xxx` → `/xxx`

### Phaser 资源加载规则
- Phaser key = GTRS scene key（完全对应，无映射）
- `loadGTRSImages()` 遍历 `resources.images.scene` 批量加载
- `getThemeAssetKey()` 优先级：食物类型映射 > 直接 key 命中 > 兼容别名

### 主题加载链路
后端 API `/api/theme/download?id=xxx` → 提取 `configJson` → `validateGTRSTheme()` 校验  
→ 通过：`applyGTRS()` 直接赋值（不 deepMerge）  
→ 失败：直接 `throw`，由 Vue 组件显示报错 UI

### CSS 变量（applyThemeToDocument）
从 `ThemeConfig.colors.*` 写入 `--theme-primary`、`--theme-secondary`、`--theme-background` 等  
`ThemeConfig.colors` 从 GTRS `globalStyle` 字段提取（`primaryColor` / `secondaryColor` / `bgColor` / `textColor`）

### 音频文件
- 实际文件同时存在 `.mp3` 和 `.wav`，统一使用 **mp3** 格式
- 音频路径：`/games/snake-vue3/themes/default/audio/bgm_main.mp3` 等
