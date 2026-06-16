# 代码库清理清单（A–D）

维护者在合并或本地整理时可按本清单执行。✅ 表示已在文档/约定层完成；🔧 表示建议在本地 Git 中执行。

## A — 重复与死代码扫描

| 项 | 状态 | 说明 |
|----|------|------|
| Canvas 游戏注册表 | ✅ | **唯一**：`kids-game-simple/src/games/gameRegistry.ts` |
| `kids-game-frontend/src/modules/game/gameRegistry.ts` | 🔧 | 空文件，无引用，**应删除** |
| `kids-game-simple/src/App.ts` | ✅ | 已迁至 `src/legacy/App.ts`（停用） |
| 业务模块 | ✅ | 终端通过 `@` 复用 `kids-game-frontend/src/modules`，勿在 simple 再复制一份 |
| 鉴权 | ✅ | `@kids-game/shared` + `kids-game-frontend/src/utils/auth.ts` |
| `kids-game-frontend/src/router/index.ts` | ✅ | 已废弃，转发 `admin-routes.ts` |

**扫描命令示例**（根目录）：

```bash
rg "gameRegistry" --glob "*.{ts,vue}"
rg "from '@/modules" kids-game-simple
```

## B — 文档与过时引用

| 项 | 状态 |
|----|------|
| 根 `README.md` | ✅ v5 双前端 |
| `QUICK_START.md` | ✅ 3000/3001、pnpm |
| `port-config.md` | ✅ 同上 |
| `frame-factory` 提及 | ✅ 仅在废弃说明文档中保留 |
| `HYBRID_ARCHITECTURE.md` | 🔧 若为空，以 `dual-frontend.md` 为准 |
| GCRS 根目录周报 | �� 移入 `docs/archive/` 或删除 |

## C — 游戏层职责

见 [canvas-games.md](../kids-game-frontend/src/docs/05-guides/canvas-games.md)：

- **壳 / 路由**：`kids-game-frontend/src/modules/game/`
- **实现**：`kids-game-simple/src/games/<id>/`
- **引擎**：`kids-game-simple/src/services/gameEngine.ts`

## D — 根目录与脚本

| 文件 | 用途 |
|------|------|
| `deploy/start-dev-all.bat` | 后端 + 管理端 + 终端 |
| `deploy/build-production.bat` | `pnpm build` |
| `deploy/deploy.cmd` | 统一部署入口 |
| `pnpm-workspace.yaml` | workspace 定义 |
| [deploy/README.md](../deploy/README.md) | 构建部署脚本说明 |

## 勿提交

- `node_modules/`、`**/dist/`、含密钥的 `.env.*`
- `pnpm-lock.yaml` **应提交**