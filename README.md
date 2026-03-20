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

### 前端
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI 组件**: 自定义组件库
- **状态管理**: Pinia
- **HTTP 客户端**: Fetch API

### 游戏引擎
- **引擎**: Phaser 3.80
- **语言**: TypeScript

## 项目结构

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
├── kids-game-frontend/       # 前端（Vue 3 + Phaser）
├── docs/                     # 📚 项目文档
└── README.md                 # 本文件
```

## 快速开始

### 后端启动

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

### 游戏平台启动

游戏模块基于 Phaser 3.80 引擎开发，集成在前端项目中。

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
