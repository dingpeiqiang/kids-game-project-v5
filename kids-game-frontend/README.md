# kids-game-frontend

统一 Web 前端（业务 + 游戏 + 终端壳）。开发端口 **3000**，构建产物 **`dist`**。

## 快速开始

```bash
pnpm install   # 在仓库根目录
pnpm dev       # 或 cd kids-game-frontend && pnpm dev
```

## 结构说明

- 仓库级概览：[../docs/PROJECT_STRUCTURE.md](../docs/PROJECT_STRUCTURE.md)
- **前端分层与落位**：[../docs/kids-game-frontend-structure.md](../docs/kids-game-frontend-structure.md)
- 游戏多模式架构：`src/docs/04-architecture/game-architecture.md`

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 本地开发 |
| `pnpm type-check` | TypeScript 检查 |
| `pnpm type-check:shell` | 壳层 TS 检查 |
| `pnpm audit` | 游戏注册 / lifecycle / 触控 / 方向审计 |
| `pnpm build` | 生产构建（含 audit） |