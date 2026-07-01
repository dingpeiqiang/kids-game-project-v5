# kids-game-frontend 代码结构规划

> v5 单前端应用。入口：`index.html` → `src/shell/main.ts`。详见 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)。

## 分层

| 层 | 路径 | 职责 |
|----|------|------|
| 终端壳 | `src/shell/` | 路由、大厅、游玩宿主、Canvas/3D 平台、虚拟触控 |
| 业务域 | `src/modules/` | 登录、答题、家长/教师/管理、创作中心 |
| 全局 UI | `src/components/` | 跨模块复用组件（layout / game / ui / theme） |
| 游戏库 | `src/games/` | 各款小游戏 + `*.lifecycle.ts` 接入壳 |
| 共享内核 | `src/shared/`、`src/core/` | 角色/鉴权常量、Pinia、主题、HTTP 基座 |
| API | `src/services/`、`src/api/` | 领域 API（新接口优先 `services/*`） |

## 目录树（目标形态）

```text
kids-game-frontend/src/
├── shell/           main.ts, router/, views/, platform/, engine3d/, services/
├── modules/         按功能分子目录；game/core/ 为多模式架构
├── games/<id>/      index.ts, *.lifecycle.ts, guide.ts, logic/, render/
├── components/
├── services/
├── composables/
├── core/            store, theme, network, config
├── shared/          @kids-game/shared 落地
├── utils/ styles/ configs/ types/
└── docs/            前端内嵌开发文档
```

## 路径别名

| 别名 | 指向 |
|------|------|
| `@/*` | `src/*` |
| `@shell/*` | `src/shell/*` |
| `@kids-game/shared` | `src/shared/index.ts` |

## 依赖边界

- **games** 通过 `*.lifecycle.ts` 依赖 **shell/platform**，不直接 import 业务 `modules/*` 页面。
- **shared** 不依赖 Vue 页面组件。
- **shell** 调 **services** 上报分数/测验，不写题库 CRUD 逻辑。

## 新游戏清单

1. 创建 `src/games/<gameId>/`，含 `index.ts`、`<gameId>.lifecycle.ts`、`guide.ts`。
2. 在 `gameRegistry.ts` / `registerGtrsCanvasGames.ts` 注册。
3. 配置横竖屏：`gameOrientation.ts`（若适用）。
4. 运行 `pnpm audit` 通过后再合入。

## 改什么去哪

| 需求 | 位置 |
|------|------|
| 路由 / 大厅 Tab | `shell/router/`、`shell/views/lobby/` |
| 游玩页 / Canvas 宿主 | `shell/views/GamePlayHost.vue`、`shell/platform/` |
| 虚拟摇杆 | `shell/platform/mobileControls/` |
| 登录与权限 | `modules/login`、`utils/auth.ts`、`shared/` |
| 管理端 | `shell/router/adminRoutes.ts`、`modules/admin/` |
| 游戏玩法 | `games/<gameId>/` |
| 主题 GTRS | `core/theme/`、`modules/creator-center/`、`configs/` |

## 演进（渐进收敛）

| 现状 | 建议 |
|------|------|
| `views/admin` 与 `modules/admin` 并存 | 已收敛：路由指向 `modules/admin/components/`；勿恢复 `views/admin` |
| `api/` 与 `services/` 并存 | 新接口只加 `services/*-api.service.ts` |
| `utils/auth` 与 `shared/auth` | 业务用 `@/utils/auth`，常量/角色用 `@kids-game/shared` |

## 校验命令

```bash
cd kids-game-frontend
pnpm dev
pnpm type-check
pnpm type-check:shell
pnpm audit              # 含 audit-src-layout（games/shared 边界、禁止 views/admin）
pnpm build
```

## 相关文档

- 多模式游戏核心：`kids-game-frontend/src/docs/04-architecture/game-architecture.md`
- GTRS / Canvas：`kids-game-frontend/src/docs/05-guides/`