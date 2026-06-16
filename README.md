# 儿童游戏平台

> 面向儿童的安全、健康在线游戏平台（用户、游戏库、家长管控、游学币度等）

## Monorepo 一览

| 目录 | 职责 | 开发端口 |
|------|------|----------|
| `kids-game-backend` | Spring Boot API | 8080 |
| `kids-game-frontend` | **管理端**（管理员 / 家长，`/admin` 按角色菜单） | 3000 |
| `kids-game-simple` | **终端**（儿童游玩、答题；Capacitor） | 3001 |
| `packages/shared` | 共享类型、角色、鉴权、`API` 常量 | — |
| `kids-game-house` | 独立游戏工程与构建产物（可选） | 按游戏 |

更细的目录约定见 [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)。

## 快速开始

```bash
pnpm install
pnpm dev:all          # 管理端 + 终端（并行）
# Windows 含后端：deploy\start-dev-all.bat
pnpm dev:admin        # 仅管理端
pnpm dev:simple       # 仅终端
pnpm run build        # shared + admin + simple
# Windows 生产构建：deploy\build-production.bat
```

| 环境 | 地址 |
|------|------|
| 管理端 | http://localhost:3000 |
| 终端 | http://localhost:3001 |
| API / 文档 | http://localhost:8080 、http://localhost:8080/doc.html |

## 双前端架构（要点）

- **业务源码主仓**：`kids-game-frontend/src`（模块、组件、API、样式）。
- **终端包**：`kids-game-simple` 仅保留独立入口、`@simple` 路由与轻量游戏实现；Vite 将 `@` 别名指向前端 `src`，共用 `public`。
- **共享包**：`@kids-game/shared`，两应用鉴权与角色逻辑一致。
- **跨应用跳转**：`VITE_ADMIN_URL` / `VITE_PLAY_URL`；终端访问 `/admin`、`/parent`、`/creator-center` 会重定向到管理端。

完整说明：[dual-frontend.md](./kids-game-frontend/src/docs/04-architecture/dual-frontend.md)。

## 目录结构（精简）

```
kids-game-project-v5-master/
├── package.json              # 根脚本（pnpm workspace）
├── pnpm-workspace.yaml
├── deploy/                   # 构建部署脚本（统一管理）
│   ├── deploy.cmd            # 统一入口（交互式菜单）
│   ├── deploy.bat            # Docker 部署（Windows）
│   ├── deploy.sh             # Docker 部署（Linux/Mac）
│   ├── start-dev-all.bat     # 本地：后端 + 双前端
│   └── build-production.bat  # 生产构建双前端
├── kids-game-backend/        # Java 多模块后端
├── kids-game-frontend/       # 管理端 + 共用业务源码
│   └── src/docs/             # 项目手册（推荐从这里读文档）
├── kids-game-simple/         # 终端 SPA
│   └── src/                  # 路由、Canvas 游戏、GTRS 工具
├── packages/shared/            # @kids-game/shared
├── kids-game-house/          # 独立游戏（如 snake）
└── docs/                     # 仓库级说明与归档
```

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Spring Boot 3、MySQL、MyBatis-Plus、Redis、JWT、Knife4j |
| 前端 | Vue 3、TypeScript、Vite、Pinia、Tailwind / SCSS |
| 游戏 | Phaser 3（部分模块）、Canvas 轻量游戏（`kids-game-simple/src/games`） |
| 主题 | GTRS 规范（见前端手册「项目指南」） |

## 文档入口（请优先使用）

| 文档 | 说明 |
|------|------|
| [QUICK_START](./kids-game-frontend/src/docs/QUICK_START.md) | 环境与本机启动 |
| [开发指南](./kids-game-frontend/src/docs/03-development/index.md) | 规范与流程 |
| [架构](./kids-game-frontend/src/docs/04-architecture/index.md) | 系统设计 |
| [双前端](./kids-game-frontend/src/docs/04-architecture/dual-frontend.md) | admin / simple 拆分 |
| [部署文档](./deploy/README.md) | 构建部署脚本与指南 |

根目录历史 **GCRS 周报类** 材料已迁至 `docs/archive/`，避免与当前 v5 双前端结构混淆。

## 核心功能

- **用户**：儿童 / 家长注册登录、验证码登录；儿童与家长均可游玩，家长额外具备管控与记录查看。
- **游戏**：列表、筛选、会话；终端内多类游戏（含 `kids-game-simple` 自研路由游戏）。
- **家长管控**：时长、时段、屏蔽、远程暂停、游戏与答题记录。
- **游学币度**：消耗与答题恢复、日重置、Redis 缓存。

## 环境变量

- 管理端 / 终端：各包下 `.env.development`、`.env.production`（勿提交密钥；参考 `.env.example` 若存在）。
- `VITE_APP_SHELL`：`admin` | `simple`（由各自 `vite.config` 注入）。

## 编码与协作

- Java：[CODING_STANDARDS.md](./CODING_STANDARDS.md)
- 重构说明：[REFACTORING_GUIDE.md](./REFACTORING_GUIDE.md)
- 提交信息：`feat` / `fix` / `docs` / `refactor` 等常规约定

## 常见问题

- **后端起不来**：检查 MySQL、Redis 与 `application` 配置。
- **前端 401 / 接口失败**：确认 8080 已启动、Vite `proxy` 指向正确。
- **终端改了 `frontend` 代码不生效**：确认改的是 `kids-game-frontend/src`，终端通过 `@` 引用该目录。

---

**版本**：5.0.0（Monorepo） · **维护**：KidsGame 团队