# 儿童游戏平台

> 专业的儿童在线游戏平台，提供安全、健康的游戏体验

## 项目简介

本项目是一个面向儿童的游戏平台，包含完整的用户管理系统、游戏库、家长管控、疲劳度管理等核心功能。

## 技术栈

### 后端
- **框架**: Spring Boot 3.x
- **数据库**: MySQL 8.0
- **ORM**: MyBatis-Plus
- **缓存**: Redis
- **认证**: JWT + BCrypt
- **文档**: Knife4j (Swagger)
- **云存储**: 腾讯云 COS

### 前端
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI 组件**: 自定义儿童友好组件库
- **状态管理**: Pinia
- **HTTP 客户端**: Axios
- **样式**: Tailwind CSS + SCSS

### 游戏引擎
- **引擎**: Phaser 3.80
- **语言**: TypeScript
- **框架**: Vue 3 + Phaser 集成

## 🎮 GCRS 关卡系统

### 简介

**GCRS (Game Configuration & Resource Specification)** - 游戏配置与资源规范

本项目实现了基于 GCRS 规范的关卡系统，采用分层架构设计，支持快速开发和扩展。

### 核心特性

✅ **分层架构**
- Framework Layer: 基础框架层
- Game Type Layer: 游戏类型层
- Instance Layer: 实例层

✅ **组件化设计**
- SnakeMovementComponent: 蛇移动组件
- CollisionDetectionComponent: 碰撞检测组件
- FoodSpawnerComponent: 食物生成组件
- LevelProgressBar.vue: 加载进度条
- ObjectiveList.vue: 目标列表

✅ **事件驱动**
- EventBus 单例模式
- 完整的事件类型系统
- 松耦合的组件通信

✅ **丰富的食物系统**
- 6 种食物类型（普通、奖励、特殊、加速、减速、无敌）
- 不同的分数和效果
- 概率生成机制
- 完整的配置数据库

### 技术栈

- **语言**: TypeScript 5.x
- **游戏引擎**: Phaser 3.80
- **UI 框架**: Vue 3 + Composition API
- **构建工具**: Vite
- **类型系统**: 完整的 TypeScript 类型定义

### 代码统计

| 类别 | 文件数 | 代码行数 | 质量 |
|------|--------|----------|------|
| 游戏逻辑 | 1 | 526 行 | ⭐⭐⭐⭐⭐ |
| 类型定义 | 1 | 326 行 | ⭐⭐⭐⭐⭐ |
| UI 组件 | 2 | 529 行 | ⭐⭐⭐⭐⭐ |
| 组件集成 | 3 | +11 行 | ⭐⭐⭐⭐⭐ |
| **总计** | **7** | **1392 行** | **优秀** |

### 文档体系

| 类别 | 文件数 | 文档行数 | 覆盖度 |
|------|--------|----------|--------|
| 进度报告 | 4 | 1727 行 | 95% |
| 总结报告 | 5 | 3191 行 | 90% |
| 技术指南 | 2 | 1328 行 | 100% |
| 计划清单 | 2 | 1208 行 | 100% |
| 展示文档 | 2 | 650 行 | 95% |
| 索引文档 | 1 | 332 行 | 100% |
| **总计** | **16** | **8436 行** | **优秀** |

### 快速开始

#### 安装依赖

```bash
cd kids-game-house/games/snake
npm install
```

#### 运行游戏

```bash
npm run dev
```

访问：`http://localhost:5173/`

### 重要文档

📚 **[完整文档索引](./DOCUMENT_INDEX.md)** - 所有文档的分类索引

📊 **[本周工作总结](./WEEKLY_FINAL_SUMMARY.md)** - Day 1-4 完整回顾

📅 **[下周工作计划](./NEXT_WEEK_PLAN_D5-D7.md)** - Day 5-7 详细计划

🎨 **[项目成果展示](./PROJECT_SHOWCASE.md)** - 功能演示和技术亮点

### 开发进度

```
总任务数：11 个
已完成：7 个 ✅ 
进行中：0 个
未开始：4 个

完成率：64% (7/11)
超额完成本周目标（55%）！
```

### 下一步计划

- [ ] **Day 5**: UI 组件集成到游戏 + 编写集成测试
- [ ] **Day 6**: 最终测试和优化
- [ ] **Day 7**: 文档完善 + v1.3.0 版本发布

**目标**: 完成率 64% → 100%

---

```
kids-game-project/
├── kids-game-backend/        # 后端服务
│   ├── kids-game-common/     # 公共模块
│   ├── kids-game-dao/        # 数据访问层
│   ├── kids-game-service/    # 业务逻辑层
│   └── kids-game-web/        # Web 层
├── kids-game-frontend/       # 前端项目
│   ├── src/
│   │   ├── services/         # API 服务
│   │   ├── core/            # 核心功能
│   │   ├── modules/         # 业务模块
│   │   ├── docs/            # 📚 项目手册文档
│   │   └── components/      # 通用组件
│   └── assets/              # 静态资源
├── kids-game-house/          # 独立游戏目录
│   ├── games/               # 游戏集合
│   │   └── snake/          # 🐍 贪吃蛇（GCRS 规范实现）
│   │       ├── src/
│   │       │   ├── scenes/         # 游戏场景
│   │       │   ├── components/     # UI 和逻辑组件
│   │       │   ├── types/          # TypeScript 类型定义
│   │       │   └── core/           # 核心框架
│   │       └── docs/              # 📚 游戏开发文档
│   └── game-dev/           # 游戏开发工具
├── kids-game-frame-factory/ # 游戏框架工厂
├── kids-game-auto-test/    # 自动化测试
├── README.md               # 📖 项目主文档（本文档）
├── DOCUMENT_INDEX.md       # 📚 完整文档索引
├── WEEKLY_FINAL_SUMMARY.md # 📊 本周工作总结
└── NEXT_WEEK_PLAN_D5-D7.md # 📅 下周工作计划
│   ├── snake-vue3/          # 贪吃蛇游戏
│   └── plants-vs-zombie/    # 植物大战僵尸游戏
├── 学习资料/                  # 学习资料文档
├── docs/                     # 项目文档
└── README.md                 # 本文件
```

## 📚 项目手册

详细的项目文档位于 `kids-game-frontend/src/docs/` 目录：

| 章节 | 内容 |
|------|------|
| [快速开始](./kids-game-frontend/src/docs/QUICK_START.md) | 5分钟快速启动项目 |
| [开发指南](./kids-game-frontend/src/docs/03-development/index.md) | 开发环境配置、编码规范 |
| [API 参考](./kids-game-frontend/src/docs/02-api-reference/index.md) | RESTful API 接口文档 |
| [架构设计](./kids-game-frontend/src/docs/04-architecture/index.md) | 系统架构设计 |
| [项目指南](./kids-game-frontend/src/docs/05-guides/index.md) | GTRS 主题系统、游戏开发 |
| [部署运维](./kids-game-frontend/src/docs/07-deployment/index.md) | 环境配置、部署指南 |
| [运维手册](./kids-game-frontend/src/docs/06-operations/index.md) | 日志查看、故障处理 |

## 快速开始

### 🚀 一键启动（推荐）

**开发模式（混合架构 - 独立部署）**：
```bash
# 根目录执行
start-dev-all.bat
```
- ✅ 自动启动后端、前端、所有游戏
- 🌐 访问主平台：http://localhost:5173
- 🔥 支持热重载，快速迭代

### 分步启动

#### 后端启动

```bash
# 1. 配置数据库（修改 application.yml）
# 2. 启动 Redis
# 3. 运行启动脚本
cd kids-game-backend
mvn spring-boot:run
```

### 前端启动

```bash
cd kids-game-frontend
npm install
npm run dev
```

### 🎮 游戏平台启动

**独立游戏模块**位于 `kids-game-house/` 目录，支持混合架构：

#### 方式一：独立部署（开发环境）
```bash
cd kids-game-house

# 安装依赖
install-dependencies.bat

# 启动所有游戏（独立端口）
start-all-games.bat

# 访问各游戏：
# - 贪吃蛇：http://localhost:3003
# - 飞机大战：http://localhost:3002
# - 染色体：http://localhost:3001
```

#### 方式二：整合部署（生产环境）
```bash
# 根目录执行
build-production.bat

# 输出到 kids-game-frontend/dist/
# 游戏资源路径：/games/{gameCode}/
```

📖 **详细说明**: [混合架构指南](./docs/HYBRID_ARCHITECTURE.md)

# 启动所有游戏
start-all-games.bat
```

游戏列表：
- 贪吃蛇: http://localhost:3003
- 植物大战僵尸: http://localhost:3004

详细文档请查看 [游戏部署指南](./kids-game-house/README.md)

## 核心功能

### 用户系统
- ✅ 儿童注册/登录
- ✅ 家长注册/登录
- ✅ 手机号验证码登录
- ✅ 密码加密存储

**重要说明**：
- **儿童和家长都可以玩游戏**
- 用户类型（儿童/家长）的区别仅在于：
  - 家长可以约束其孩子的游戏行为（时长限制、游戏屏蔽、时段控制等）
  - 家长可以查看孩子的游戏记录和答题记录
  - 家长可以管理游戏授权（屏蔽/解锁游戏）
- 游戏会话、疲劳点、排行榜等功能对两种用户完全一致
- 系统根据注册时的角色类型自动识别用户类型

### 游戏管理
- ✅ 游戏列表展示
- ✅ 游戏详情查看
- ✅ 按年级/分类筛选
- ✅ 游戏会话管理

### 家长管控
- ✅ 游戏时长限制
- ✅ 游戏时段控制
- ✅ 游戏屏蔽功能
- ✅ 远程暂停/解锁
- ✅ 游戏记录查询
- ✅ 答题记录查询

### 疲劳度系统
- ✅ 疲劳点消耗
- ✅ 答题获取疲劳点
- ✅ 每日疲劳点重置
- ✅ Redis 缓存优化

## API 文档

后端启动后访问: `http://localhost:8080/doc.html`

## 编码规范

本项目严格遵循 [CODING_STANDARDS.md](./CODING_STANDARDS.md) 中定义的编码规范。

**主要规范**:
- 基于阿里巴巴 Java 开发手册
- 单个文件不超过 500 行
- 方法不超过 50 行
- 避免重复代码
- 使用常量替代魔法值
- 单一职责原则

## 代码重构

详见 [REFACTORING_GUIDE.md](./REFACTORING_GUIDE.md) 了解最近的代码重构工作。

**重构亮点**:
- 提取 JsonUtil 工具类，统一 JSON 处理
- 创建 GameConstants 和 SystemConstants 常量类
- 前端服务模块化（kid-api、parent-api、game-api 等）
- 后端服务类提取私有方法，提高可读性

## 开发指南

### 后端开发

1. 遵循包结构规范
2. 使用 DTO 进行数据传输
3. 统一异常处理
4. 完善日志记录
5. 编写单元测试

### 前端开发

1. 使用 TypeScript 类型定义
2. 组件化开发
3. 模块化 API 服务
4. 统一错误处理
5. 响应式设计

### 提交代码

遵循 Git 提交规范:

```bash
feat(module): 添加新功能
fix(module): 修复 Bug
docs(module): 更新文档
style(module): 代码格式调整
refactor(module): 重构代码
```

## 常见问题

### Q: 后端启动失败？
A: 检查数据库配置和 Redis 是否启动

### Q: 前端接口请求失败？
A: 检查 Vite 代理配置和后端服务是否正常运行

### Q: 游戏黑屏？
A: 参考 [黑屏问题解决方案](https://github.com/your-repo/wiki/Black-Screen-Issue)

## 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: 添加新功能'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 联系我们

- 项目主页: [GitHub](https://github.com/your-repo)
- 问题反馈: [Issues](https://github.com/your-repo/issues)
- 邮箱: support@kidsgame.com

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

**最后更新**: 2026-03-06
**版本**: 1.0.0
**维护者**: KidsGame 开发团队
