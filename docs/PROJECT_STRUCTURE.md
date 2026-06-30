# 项目结构说明（v5 · 单前端）

## 工作区（pnpm）

`pnpm-workspace.yaml` 仅包含 **`kids-game-frontend`**。

后端 `kids-game-backend` 为 Maven 工程，不在 pnpm workspace 内。

## 唯一 Web 应用：`kids-game-frontend`

| 路径 | 职责 |
|------|------|
| `src/shell/` | 终端壳：路由、Canvas/3D 平台、大厅、游玩页 |
| `src/modules/`、`src/components/`、`src/services/` 等 | 业务页面与 API（原 client-core） |
| `src/games/` | 全部 Canvas/生命周期游戏（须从 `packages` 迁入后保留） |
| `src/shared/` | 鉴权、角色、API 常量（原 `@kids-game/shared`） |
| `public/` | 静态资源、`themes/`、`games/` |

**别名（Vite / TS）**

- `@/*` → `src/*`
- `@shell/*` → `src/shell/*`
- `@kids-game/shared` → `src/shared/index.ts`

入口：`index.html` → `src/shell/main.ts`，端口 **3000**，构建输出 **`dist`**。

## 从 packages 迁入（一次性）

若仓库仍保留 `packages/client-core`、`packages/shared`：

```bash
pnpm integrate:packages   # 复制 games、shared 等到 frontend/src
pnpm install
pnpm check:frontend
pnpm remove:packages      # 验证通过后删除 packages/
```

## 改什么去哪

| 改什么 | 改哪里 |
|--------|--------|
| 游戏玩法 | `kids-game-frontend/src/games/` |
| 登录、大厅、后台 | `kids-game-frontend/src/modules/` |
| 路由 | `kids-game-frontend/src/shell/router/` |
| 鉴权 / 管理菜单 | `kids-game-frontend/src/shared/` + `src/utils/auth.ts` |
| 终端触控 / Canvas 壳 | `kids-game-frontend/src/shell/platform/` |

## 本地脚本

| 脚本 | 作用 |
|------|------|
| `pnpm dev` | 前端开发 |
| `pnpm build` | 生产构建（含 audit） |
| `pnpm integrate:packages` | 合并 `packages/*` → `frontend/src` |
| `pnpm remove:packages` | 删除根目录 `packages/` |