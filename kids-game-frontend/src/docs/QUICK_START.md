# 快速启动指南

## 环境

- Node.js >= 18、pnpm >= 8（推荐 `corepack enable`）
- Java 17、Maven 3.8+
- MySQL 8.0+、Redis

## 一键启动（推荐）

在**仓库根目录**：

```bash
pnpm install
pnpm dev:all
```

Windows（含后端）：

```bat
start-dev-all.bat
```

## 分步启动

**后端**：

```bash
cd kids-game-backend
mvn -pl kids-game-web -am spring-boot:run
```

**管理端**：

```bash
pnpm dev:admin
```

**终端（儿童端）**：

```bash
pnpm dev:simple
```

## 访问地址

| 服务 | 地址 |
|------|------|
| 管理端 | http://localhost:3000 |
| 终端 | http://localhost:3001 |
| API | http://localhost:8080 |
| API 文档 | http://localhost:8080/doc.html |

家长 / 管理员登录后使用管理端；儿童账号在终端游玩。跨端跳转见 [双前端架构](./04-architecture/dual-frontend.md)。

## 可选：独立游戏（kids-game-house）

仅开发独立 Phaser 工程时使用，**不是**双前端日常联调必需：

```bash
cd kids-game-house
# 见 kids-game-house/README.md
```

## 生产构建

```bash
pnpm run build
# 或 build-production.bat
```

产出：`kids-game-frontend/dist`、`kids-game-simple/dist`。