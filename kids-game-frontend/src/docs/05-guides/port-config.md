# 端口配置说明（v5 双前端）

## 日常开发端口

| 服务 | 端口 | 配置 | 访问 |
|------|------|------|------|
| **管理端** `kids-game-frontend` | **3000** | `kids-game-frontend/vite.config.ts` | http://localhost:3000 |
| **终端** `kids-game-simple` | **3001** | `kids-game-simple/vite.config.ts` | http://localhost:3001 |
| **后端 API** | **8080** | `kids-game-backend` `application.yml` | http://localhost:8080 |
| MySQL | 3306 | 数据源配置 | localhost:3306 |
| Redis | 6379 | 缓存配置 | localhost:6379 |

## 访问入口

### 管理端（3000）

- 登录：http://localhost:3000/login
- 管理员：http://localhost:3000/admin/dashboard
- 家长：http://localhost:3000/admin/parent
- 旧路径 `/parent` 会重定向到 `/admin/parent`

### 终端（3001）

- 儿童首页：http://localhost:3001/
- 登录：http://localhost:3001/login
- 游戏：http://localhost:3001/game/:type/play
- 访问 `/admin`、`/creator-center` 会跳转到 `VITE_ADMIN_URL`（默认 3000）

### 后端（8080）

- Knife4j：http://localhost:8080/doc.html
- 主题、游戏等：`/api/*`（前端 Vite proxy 到 8080）

## 跨应用环境变量

| 变量 | 使用方 | 说明 |
|------|--------|------|
| `VITE_ADMIN_URL` | 终端 | 管理端基址，默认 `http://localhost:3000` |
| `VITE_PLAY_URL` | 管理端 | 终端基址，默认 `http://localhost:3001` |
| `VITE_APP_SHELL` | 两前端 | `admin` / `simple`（构建标识） |

## 可选：kids-game-house 独立游戏

独立工程端口以各子项目 `vite.config.ts` 为准（如 snake 可能为 3005），**与** 3000/3001 双前端并行开发时使用。平台主路径不依赖 house 常驻端口。

## 启动命令（根目录）

```bash
pnpm dev:admin    # 3000
pnpm dev:simple   # 3001
pnpm dev:all      # 3000 + 3001
deploy\start-dev-all.bat # 8080 + 3000 + 3001
```

详见 [QUICK_START.md](../QUICK_START.md)、[双前端架构](../04-architecture/dual-frontend.md)。