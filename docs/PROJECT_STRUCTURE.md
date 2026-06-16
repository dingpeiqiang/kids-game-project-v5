# 项目结构说明（v5 Monorepo）

本文描述当前仓库**有效**目录与代码归属，避免在已废弃路径上开发。

## 工作区（pnpm）

`pnpm-workspace.yaml` 包含：

- `packages/*` → `@kids-game/shared`
- `kids-game-frontend`
- `kids-game-simple`

后端 `kids-game-backend` 为 Maven 工程，不在 pnpm workspace 内，但与前端通过 `/api` 联调。

## 前端代码归属

| 改什么 | 改哪里 |
|--------|--------|
| 登录、首页、答题、管理后台页面 | `kids-game-frontend/src/modules/` |
| 管理端路由 | `kids-game-frontend/src/router/admin-routes.ts` |
| 终端路由、跨端重定向 | `kids-game-simple/src/router/index.ts` |
| 鉴权（统一） | `packages/shared/src/auth.ts` + `kids-game-frontend/src/utils/auth.ts` |
| Canvas 轻量游戏（贪吃蛇、马里奥等） | `kids-game-simple/src/games/` |
| 终端入口 | `kids-game-simple/src/main.ts` |
| 静态资源（共用） | `kids-game-frontend/public/` |

**不要**在根目录新建业务代码；**不要**依赖已移除的 `kids-game-frame-factory`（历史工厂模板，已从主线剥离）。

## 别名约定（终端）

在 `kids-game-simple/vite.config.ts`：

- `@` → `kids-game-frontend/src`
- `@simple` → `kids-game-simple/src`

终端内引用共用模块用 `@/...`，仅终端特有代码用 `@simple/...`。

## 后端

```
kids-game-backend/
├── kids-game-common/
├── kids-game-dao/
├── kids-game-service/
└── kids-game-web/          # 启动模块（Spring Boot）
```

## 独立游戏（可选）

`kids-game-house/` 存放可单独构建的游戏（如 snake），与平台双前端可并行存在；平台内游玩以 `kids-game-frontend` + `kids-game-simple` 为主路径。

## 文档位置

| 类型 | 路径 |
|------|------|
| 对外 README | 仓库根 `README.md` |
| 运维 / 开发手册 | `kids-game-frontend/src/docs/` |
| 仓库级补充 | `docs/`（本文件、归档） |
| 历史周报（GCRS） | `docs/archive/` |

## 本地脚本

| 脚本 | 作用 |
|------|------|
| `deploy/start-dev-all.bat` | 后端 + 管理端 + 终端 |
| `deploy/build-production.bat` | `pnpm build`（shared + 双前端 dist） |
| `deploy/deploy.cmd` | 统一部署入口（交互式菜单） |
| [CODEBASE_CLEANUP.md](./CODEBASE_CLEANUP.md) | 重复文件与归档清单 |
| [deploy/README.md](../deploy/README.md) | 构建部署脚本说明 |