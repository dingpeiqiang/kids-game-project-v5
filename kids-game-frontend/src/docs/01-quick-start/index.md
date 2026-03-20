# 快速开始

欢迎使用 Kids Game Project！本指南将帮助您快速启动项目。

## 📋 环境要求

### 必需软件
- **Node.js**: >= 16.x
- **Java**: JDK 17+
- **MySQL**: 8.0+
- **Redis**: 最新稳定版
- **Maven**: 3.6+

### 推荐工具
- **IDE**: IntelliJ IDEA (后端) / VSCode (前端)
- **数据库工具**: Navicat / MySQL Workbench
- **API 测试**: Postman / Knife4j

## 🚀 一键启动

### Windows 系统

```bash
# 启动全部服务（前端 + 后端）
start-all.bat
```

### 手动启动

#### 1. 启动后端

```bash
cd kids-game-backend
mvn clean install -DskipTests
cd kids-game-web
mvn spring-boot:run
```

后端将在 `http://localhost:8080` 启动

#### 2. 启动前端

```bash
cd kids-game-frontend
npm install  # 首次运行
npm run dev
```

前端将在 `http://localhost:5173` 启动

## 🌐 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端首页 | http://localhost:5173 | 儿童游戏平台 |
| 管理后台 | http://localhost:5173/admin/dashboard | 运营管理系统 |
| 后端 API | http://localhost:8080/api | RESTful API |
| API 文档 | http://localhost:8080/doc.html | Knife4j 接口文档 |
| Swagger UI | http://localhost:8080/swagger-ui.html | Swagger 测试界面 |

## 🔐 默认账号

### 管理员账号
- **账号**: `admin`
- **密码**: `admin123`
- **角色**: 超级管理员

### 测试账号

#### 儿童用户
- **账号**: `kid1`
- **密码**: `123456`

#### 家长用户
- **账号**: `parent1`
- **密码**: `123456`

## 📚 下一步

- [项目介绍](./README.md) - 了解项目详情
- [技术栈](#技术栈) - 查看使用的技术
- [开发指南](./DEVELOPMENT_GUIDE.md) - 开始开发
- [API 文档](./API_REFERENCE.md) - 查看接口说明

## ⚠️ 常见问题

### Q: 后端启动失败？
A: 检查以下几点：
1. MySQL 是否正常运行
2. Redis 是否启动
3. 数据库配置是否正确（application.yml）
4. 端口 8080 是否被占用

### Q: 前端无法连接后端？
A: 确认：
1. 后端服务已启动
2. Vite 代理配置正确（vite.config.ts）
3. 浏览器控制台无 CORS 错误

### Q: 游戏黑屏？
A: 参考 [游戏部署指南](./GAME_DEPLOYMENT.md)

## 🆘 获取帮助

- 查看 [完整文档](./README.md)
- 阅读 [FAQ](./FAQ.md)
- 提交 [Issue](https://github.com/your-repo/issues)

---

**最后更新**: 2026-03-09  
**版本**: v1.0.0
