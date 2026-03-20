# 儿童游戏平台 - 项目手册

欢迎来到儿童游戏平台项目手册！本文档是项目的核心知识库，包含所有重要的技术文档、开发指南和架构设计。

---

## 📚 文档导航

### 1. 快速开始
- [项目简介](#项目简介)
- [快速开始指南](01-quick-start/index.md)
- [用户指南](USER_GUIDE.md)

### 开发指南
- [编码规范](03-development/index.md)
- [AI 编码指南](03-development/ai-coding-guide.md)
- [API 设计规范](03-development/api-guidelines.md)
- [UI 组件设计](03-development/ui-components.md)
- [后端开发指南](03-development/backend-dev-guide.md)

### 3. API 参考
- [API 参考文档](02-api-reference/index.md)
- [主题 API 参考](04-architecture/theme-api-reference.md)

### 4. 架构设计
- [架构设计文档](04-architecture/index.md)
- [游戏核心架构](04-architecture/game-architecture.md)
- [云存储实现](04-architecture/cos-implementation.md)
- [主题数据库设计](04-architecture/theme-database-design.md)
- [主题关系设计](04-architecture/theme-relation-design.md)
- [独立游戏部署](04-architecture/game-sync-deploy.md)

### 5. 项目指南
- [项目指南索引](05-guides/index.md)
- [GTRS 主题系统概述](05-guides/gtrs-overview.md)
- [GTRS 迁移指南](05-guides/gtrs-migration.md)
- [GTRS 游戏集成指南](05-guides/gtrs-integration.md)
- [主题资源模板规范](05-guides/theme-resource-spec.md)
- [主题快速开始](05-guides/theme-quickstart.md)
- [游戏开发对接文档](05-guides/game-development.md)
- [贪吃蛇游戏开发](05-guides/snake-game-dev.md)
- [Phaser 最佳实践](05-guides/phaser-best-practice.md)
- [端口配置说明](05-guides/port-config.md)

### 6. 部署运维
- [部署指南](07-deployment/index.md)
- [环境要求](07-deployment/requirements.md)
- [开发环境部署](07-deployment/dev-environment.md)
- [运维手册](06-operations/index.md)
- [日志查看](06-operations/logs.md)
- [SQL 脚本使用](06-operations/sql-scripts.md)
- [脚本工具使用指南](scripts.md)

---

## 🎯 项目简介

儿童游戏平台是一个面向儿童的游戏聚合平台，支持多种类型的游戏接入，提供统一的用户管理、主题系统和游戏数据管理。

### 核心功能

- **游戏管理**：支持多种游戏类型的接入和管理
- **主题系统**：统一的主题配置和资源管理（GTRS）
- **用户系统**：完整的用户注册、登录、权限管理
- **创作者中心**：支持用户创建和分享自定义主题
- **游戏大厅**：统一的游戏入口和体验

### 技术栈

- **前端**：Vue 3 + TypeScript + Vite
- **后端**：Spring Boot + MySQL
- **游戏引擎**：Phaser 3
- **部署**：Docker + Nginx

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- Java 17+
- MySQL 8.0+
- Maven 3.8+

### 项目结构

```
kids-game-project/
├── kids-game-frontend/     # 前端项目
│   └── src/docs/          # 项目手册（本文档）
├── kids-game-backend/      # 后端项目
├── kids-game-house/        # 独立游戏目录
│   ├── snake-vue3/        # 贪吃蛇游戏
│   └── plants-vs-zombie/  # 植物大战僵尸游戏
└── docs/                   # 项目文档
```

### 启动项目

1. **启动后端**
   ```bash
   cd kids-game-backend
   mvn spring-boot:run
   ```

2. **启动前端**
   ```bash
   cd kids-game-frontend
   npm run dev
   ```

3. **启动游戏**（可选）
   ```bash
   cd kids-game-house/snake-vue3
   npm run dev
   ```

---

## 📖 重要文档索引

### 核心规范

| 文档 | 路径 | 说明 |
|------|------|------|
| 开发指南 | `03-development/index.md` | 开发环境配置、编码规范 |
| AI 编码指南 | `03-development/ai-coding-guide.md` | 使用 AI 辅助开发的指南 |
| 主题 API 参考 | `04-architecture/theme-api-reference.md` | 主题系统 API 文档 |
| 云存储实现 | `04-architecture/cos-implementation.md` | 腾讯云 COS 实现 |
| 主题数据库设计 | `04-architecture/theme-database-design.md` | 数据库脚本汇总 |

### 后端文档

后端相关文档位于 `kids-game-backend/` 目录：

| 文档 | 说明 |
|------|------|
| `CONTROLLER_LOG_GUIDE.md` | 接口日志功能说明 |
| `COS_TEMPORARY_CREDENTIAL.md` | 腾讯云 COS 上传功能 |
| `MIGRATION_GUIDE.md` | 数据库迁移指南 |

### 游戏文档

| 文档 | 路径 | 说明 |
|------|------|------|
| 独立游戏部署 | `kids-game-house/README.md` | 独立游戏部署中心说明 |

### 项目指南

| 文档 | 路径 | 说明 |
|------|------|------|
| GTRS 概述 | `05-guides/gtrs-overview.md` | GTRS 主题系统概述 |
| GTRS 迁移 | `05-guides/gtrs-migration.md` | GTRS 迁移指南 |
| GTRS 集成 | `05-guides/gtrs-integration.md` | GTRS 游戏集成指南 |
| 主题资源规范 | `05-guides/theme-resource-spec.md` | 主题资源模板规范 |
| 主题快速开始 | `05-guides/theme-quickstart.md` | 主题快速开始指南 |
| 游戏开发对接 | `05-guides/game-development.md` | 游戏开发对接文档 |
| 贪吃蛇开发 | `05-guides/snake-game-dev.md` | 贪吃蛇游戏开发指南 |
| Phaser 最佳实践 | `05-guides/phaser-best-practice.md` | Phaser 3 最优配置 |
| 端口配置 | `05-guides/port-config.md` | 端口配置说明 |

### 部署运维

| 文档 | 路径 | 说明 |
|------|------|------|
| 部署指南 | `07-deployment/index.md` | 完整部署指南 |
| 环境要求 | `07-deployment/requirements.md` | 部署环境要求 |
| 开发环境 | `07-deployment/dev-environment.md` | 开发环境部署 |
| 运维手册 | `06-operations/index.md` | 运维操作指南 |
| 日志查看 | `06-operations/logs.md` | 日志分析指南 |
| SQL 脚本 | `06-operations/sql-scripts.md` | 数据库脚本使用 |
| 脚本工具 | `scripts.md` | 项目脚本使用指南 |

---

## 🎨 主题系统（GTRS）

GTRS（Game Theme Resource System）是项目的核心功能之一，提供统一的主题配置和资源管理。

### 主要特性

- **统一配置格式**：所有游戏使用相同的主题配置结构
- **多类型资源支持**：支持颜色、Emoji、图片、音频
- **实时预览**：所见即所得的主题编辑体验
- **资源上传**：支持本地存储和云存储（COS/OSS）
- **游戏集成**：简单的 API 集成方式

### 快速链接

- [GTRS 概述](05-guides/gtrs-overview.md)
- [主题快速开始](05-guides/theme-quickstart.md)
- [主题资源规范](05-guides/theme-resource-spec.md)

---

## 🔧 开发资源

### 前端组件

- **KidFriendlyModal**：儿童友好弹窗组件
- **ThemeCreator**：主题创作组件
- **ThemePreview**：主题预览组件
- **FileUpload**：文件上传组件

### 后端服务

- **ThemeService**：主题管理服务
- **ResourceUploadService**：资源上传服务
- **CosCredentialService**：COS 临时密钥服务

### 工具类

- **BaseApiService**：API 基础服务
- **ThemeManager**：主题管理器
- **GameThemeLoader**：游戏主题加载器

---

## 📞 支持

如有问题或建议，请：

1. 查阅相关文档
2. 检查浏览器/后端控制台日志
3. 参考项目指南中的故障排除部分

---

## 🛠️ 常用开发命令

详细脚本使用说明请参阅 [脚本工具使用指南](scripts.md)

### 后端开发

```bash
# 编译项目
cd kids-game-backend
mvn clean compile -DskipTests

# 启动服务
cd kids-game-backend/kids-game-web
mvn spring-boot:run

# 完整构建
cd kids-game-backend
mvn clean install -DskipTests
```

### 前端开发

```bash
# 安装依赖
cd kids-game-frontend
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 清理缓存（如遇问题）
rm -rf node_modules/.vite
rm -rf dist
npm run dev
```

### 游戏开发

```bash
# 贪吃蛇游戏
cd kids-game-house/snake-vue3
npm install
npm run dev

# 植物大战僵尸
cd kids-game-house/plants-vs-zombie
npm install
npm run dev
```

---

## 📝 更新日志

### 2026-03-20
- 整理项目手册，统一文档结构
- 删除 150+ 个临时性文档和脚本
- 建立清晰的文档导航体系
- 清理后端临时 SQL 和脚本文件
- 清理前端临时脚本文件
- 清理 house 目录临时脚本文件

### 2026-03-19
- 完成项目手册初步整理
- 整合核心文档到统一目录

---

**让我们一起为孩子们创造更美好的数字世界！** 🌈✨
