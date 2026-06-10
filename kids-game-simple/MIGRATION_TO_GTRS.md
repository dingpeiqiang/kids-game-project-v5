# kids-game-simple 迁移到 GTRS 框架

## 背景

- **GTRS**（Game Theme Resource Specification）v1.0.0：统一 `specMeta` + `themeInfo` + `globalStyle` + `resources` 的主题 JSON 规范。
- **TRS**（`kids-game-trs`）：早期主题运行时（`ThemeManager`、`ThemeLoader`、Phaser 场景基类等），资源结构较扁平。
- **kids-game-simple**：多游戏聚合平台（Vite + TS，非 Vue），需在不改 `gameRegistry` 大量注册表的前提下接入 GTRS。

## 仓库内参考

| 位置 | 说明 |
|------|------|
| `kids-game-frontend/src/types/gtrs-theme.ts` | GTRS 类型定义（已对齐到 simple） |
| `kids-game-frontend/src/docs/05-guides/gtrs-integration.md` | Phaser 集成、资源路径与 GTRS 示例 |
| `kids-game-backend` `ThemeMigrationService` | 旧 `config_json` → GTRS |
| `kids-game-trs` | TRS 参考实现（逐步废弃，逻辑迁移到 GTRS 加载器） |

## 已在 simple 中落地的模块

| 文件 | 职责 |
|------|------|
| `src/types/gtrs-theme.ts` | GTRS 类型 |
| `src/services/gtrsThemeLoader.ts` | 加载 API / 静态 JSON / 默认主题；`migrateTRSOrLegacyToGTRS` |
| `src/games/gameThemeBridge.ts` | `prepareGameTheme`、纹理 key、`localStorage` 选中主题 |
| `src/games/gameRegistry.ts` | `initGame` 内统一调用 `prepareGameTheme`（失败不阻断游戏） |
| `src/utils/GTRSThemeApplier.ts` | `getCanvasPaletteForGame`、`applyGlobalStyleToDocument`（CSS 变量） |
| `src/utils/gtrsColor.ts` | `hexToRgba`、`darkenHex` |
| `public/themes/snake/gtrs.json` | 贪吃蛇默认 GTRS（颜色元数据） |
| `src/games/snake.ts` | 已接入 `getCanvasPaletteForGame('snake')` |

## 加载顺序

1. 后端 `GET /api/theme/{themeId}` 或 `GET /api/theme/default?gameId=`
2. 静态文件：`/themes/{gameId}/gtrs.json`、`/resources/{gameId}/GTRS.json`
3. 内置 `buildDefaultGTRS(gameId)`（纯色/空资源兜底）

## TRS → GTRS 映射要点

| TRS / 旧字段 | GTRS |
|--------------|------|
| 扁平 `images.*` | `resources.images.scene` 等分类 |
| `style` / `globalStyle` 混用 | `globalStyle`（`bgColor` / `primaryColor`） |
| 无 `specMeta` | 写入 `specName: GTRS`, `specVersion: 1.0.0` |
| 字符串资源路径 | `ImageResource { src, type, alias }` |

后端批量迁移见 `kids-game-frontend/src/docs/05-guides/gtrs-migration.md`（`migrate_theme_to_gtrs.sql` / `ThemeMigrationService`）。

## 游戏侧接入（待逐步完成）

1. 在 `public/themes/{gameId}/gtrs.json` 放置默认 GTRS（或走后端 `theme_info.config_json`）。
2. Phaser 游戏在 `preload` 使用 `getCachedGTRSTheme(gameId)` + `resolveGTRSResourceUrl` 或扩展 `GTRSThemeApplier`。
3. Canvas 自绘游戏读取 `globalStyle` 设置背景色/主色。
4. 3D 游戏（Babylon/Three）在 `init` 前调用 `prepareGameTheme`（已由 `initGame` 统一触发）。

示例纹理 key：`getPhaserTextureKey(gameId, 'scene', 'background')` → `gtrs_snake_scene_background`。

## 验证

```bash
cd kids-game-simple
npm run type-check
npm run dev
```

进入任意游戏，控制台应出现主题加载成功或 `[GameRegistry] GTRS theme prep failed ... using defaults`（无主题资源时属正常）。

## 后续工作清单

- [x] `GTRSThemeApplier`（Canvas 调色板 + CSS 变量；Phaser preload 待补）
- [ ] `themeService` 与大厅 UI 主题切换（若与 frontend 共用后端）
- [x] snake：`public/themes/snake/gtrs.json` + Canvas 接主题色
- [ ] eliminate、tetris 等 `gtrs.json` 与贴图资源
- [ ] 单元测试：`migrateTRSOrLegacyToGTRS`、`isGTRSFormat`
- [ ] 与 `kids-game-trs` 依赖解耦，删除重复 TRS 包引用（若曾引入）