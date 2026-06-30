# @kids-game/client-core（方案 C）

## 职责

`packages/client-core` 是**管理端**与**终端**共用的业务源码包，包含：

| 目录 | 内容 |
|------|------|
| `modules/` | 登录、大厅、答题、家长/教师/管理后台页面等 |
| `games/` | 全部内置 Canvas / GTRS 游戏 |
| `services/`、`api/`、`utils/` | HTTP、鉴权、业务 API |
| `components/`、`composables/`、`core/` | UI、状态、主题、网络 |
| `styles/` | 全局样式 |

## 应用壳（薄层）

| 包 | 仅保留 |
|----|--------|
| `kids-game-frontend` | `main.ts`、`App.vue`、`router/admin-routes.ts`、`public/`、Element Plus 入口 |
| `kids-game-simple` | `main.ts`、`App.vue`、`router/`、`platform/`、`services/apiClient`（Capacitor）、`public/`、Android |

两应用的 Vite 将别名 **`@` → `packages/client-core/src`**，终端另设 **`@simple` → `kids-game-simple/src`**。

## 依赖

- `@kids-game/shared`：角色、鉴权常量（两应用 + client-core）
- `@kids-game/client-core`：在 `kids-game-frontend`、`kids-game-simple` 的 `package.json` 中 `workspace:*`

管理端专用：`element-plus`、`echarts` 等仅在 **frontend** 安装；client-core 中对应为 **optional peerDependencies**。

## 改代码去哪

| 需求 | 路径 |
|------|------|
| 游戏玩法 | `packages/client-core/src/games/<id>/` |
| 大厅 / 答题 / 登录 | `packages/client-core/src/modules/` |
| 管理后台 | `packages/client-core/src/modules/admin/` |
| 终端路由、Canvas 壳 | `kids-game-simple/src/` |
| 管理端路由 | `kids-game-frontend/src/router/` |

## 维护脚本

```bash
# 从 frontend/src + simple/src/games 重新生成 client-core（慎用，会覆盖）
node scripts/migrate-client-core.mjs

# 删除 simple 内重复的 games 目录
node scripts/cleanup-simple-games.mjs

# 将 simple 壳内 ../games 引用改为 @/games
node scripts/fix-simple-game-imports.mjs
```

## 历史 frontend 副本

`kids-game-frontend/src` 下除入口与路由外的业务目录应逐步删除，仅以 client-core 为准。可运行：

```bash
node scripts/cleanup-frontend-dupes.mjs
```

（保留 `main.ts`、`App.vue`、`router/`、`docs/`、`vite-env.d.ts`。）