# 重构与规整说明（v5）

本仓库已完成 **双前端 Monorepo** 收敛，开发请以以下文档为准：

| 文档 | 内容 |
|------|------|
| [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md) | 包边界、别名、勿用路径 |
| [kids-game-frontend/src/docs/04-architecture/dual-frontend.md](./kids-game-frontend/src/docs/04-architecture/dual-frontend.md) | 管理端 / 终端拆分 |
| [docs/CODEBASE_CLEANUP.md](./docs/CODEBASE_CLEANUP.md) | 重复文件与清理清单 |
| [kids-game-frontend/src/docs/05-guides/canvas-games.md](./kids-game-frontend/src/docs/05-guides/canvas-games.md) | 内置游戏注册表 |

## 已废弃

- `kids-game-frame-factory/`：从 Git 主线删除，勿恢复引用。
- 根目录 GCRS 周报类 `.md`：迁入 `docs/archive/` 或删除。
- `kids-game-frontend/src/modules/game/gameRegistry.ts`：空占位，应删除；注册表仅在 `kids-game-simple/src/games/gameRegistry.ts`。

## 命令

```bash
pnpm install
pnpm dev:all
pnpm build
```