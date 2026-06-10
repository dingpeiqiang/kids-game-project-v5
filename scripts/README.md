# 根目录脚本说明

| 脚本 | 位置 | 说明 |
|------|------|------|
| 全栈开发 | `../start-dev-all.bat` | 后端 8080 + 管理端 3000 + 终端 3001 |
| 生产构建 | `../build-production.bat` | `pnpm build`（shared + 双前端） |

Monorepo 日常命令在仓库根 `package.json`：`pnpm dev:all`、`pnpm dev:admin`、`pnpm dev:simple`。

后端、house 子项目内另有 `start-*.bat`，见各目录 README。