# 双前端架构

## 应用划分

| 包 | 端口（开发） | 用户 | 说明 |
|----|-------------|------|------|
| `kids-game-simple` | 3001 | 儿童（家长可同账号游玩） | 终端 SPA，Capacitor 打包 |
| `kids-game-frontend` | 3000 | 系统管理员、家长 | 管理 SPA，`/admin` 内按角色菜单 |

## 共享

- `packages/shared`：`roles`、`auth` 工具、`API_CONSTANTS`
- `kids-game-simple` 通过 Vite alias `@` 指向 `kids-game-frontend/src`，共用业务模块与资源

## 管理端路由

- 入口：`kids-game-frontend/src/router/admin-routes.ts`
- 家长默认：`/admin/parent`
- 管理员默认：`/admin/dashboard`
- 旧 `/parent` → `/admin/parent`
- 创作者中心：`/admin/creator-center`（仅管理员菜单）；旧 `/creator-center` 重定向至此
- 开发专用：`/theme-demo`、`/modal-demo` 等仅在 `import.meta.env.DEV` 注册

## 环境变量

- `VITE_APP_SHELL`：`admin` | `simple`
- `VITE_PLAY_URL` / `VITE_ADMIN_URL`：跨应用跳转

## 本地启动

```bash
pnpm install
pnpm dev:all   # 或分别 dev:admin / dev:simple
```

Windows 一键（后端 + 双前端）：根目录 `start-dev-all.bat`

生产构建：`build-production.bat` 或 `pnpm build`

## 跨端跳转

- 管理端（3000）访问 `/game/*`、`/answer`、`/home` 等儿童路径 → 重定向到 `VITE_PLAY_URL`（默认 3001），**保留完整 path 与 query**（如 `/game/snake/play`）。
- 终端访问 `/admin/*` → `VITE_ADMIN_URL`。

## 认证

`kids-game-frontend/src/utils/auth.ts` 转发至 `@kids-game/shared`，两应用逻辑一致。

## 游戏运行方式

| 方式 | 位置 |
|------|------|
| 平台列表 + iframe 外链 | `kids-game-frontend/src/modules/game/index.vue` |
| 终端内置 Canvas | `kids-game-simple/src/games/` + `gameRegistry.ts` |
| 独立工程（可选） | `kids-game-house/` |

详见 [终端 Canvas 游戏](../05-guides/canvas-games.md)。