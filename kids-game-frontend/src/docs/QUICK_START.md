# 快速启动指南

## 🚀 一键启动（推荐）

### Windows 用户
直接运行启动脚本：

```bash
start-all.bat
```

这个脚本会自动完成以下步骤：
1. ✅ 检查环境（Node.js、Java、MySQL、Redis）
2. ✅ 初始化数据库
3. ✅ 启动后端服务
4. ✅ 启动前端服务
5. ✅ 自动打开浏览器

### 访问地址

启动成功后，可以访问以下地址：

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端首页 | http://localhost:5173 | 儿童游戏平台主页 |
| 管理后台 | http://localhost:5173/admin/dashboard | 运营后台管理系统 |
| 后端 API | http://localhost:8080 | RESTful API 服务 |
| API 文档 | http://localhost:8080/doc.html | Knife4j 接口文档 |

---

## 🔧 手动启动

### 1. 准备环境

确保已安装以下软件：
- Node.js >= 16
- Java 17
- MySQL 8.0+
- Redis

### 2. 初始化数据库

```bash
mysql -u root -p kids-game < kids-game-schema-complete.sql
```

### 3. 启动后端

```bash
cd kids-game-backend
mvn clean package -DskipTests
cd kids-game-web
mvn spring-boot:run
```

后端将在 `http://localhost:8080` 启动

### 4. 启动前端

```bash
cd kids-game-frontend
npm install
npm run dev
```

前端将在 `http://localhost:5173` 启动

---

## 🎯 默认账号

### 儿童账号
系统预置了多个测试儿童账号：
- 用户名：`kid001` ~ `kid010`
- 密码：`123456`

### 家长账号
- 用户名：`parent001`
- 密码：`123456`

### 管理员账号
- 用户名：`admin`
- 密码：`admin123`

---

## ⚠️ 常见问题

### 1. 端口被占用

如果提示端口被占用，可以修改配置文件：
- 前端：`vite.config.ts` 中的 `server.port`
- 后端：`application.properties` 中的 `server.port`

### 2. 数据库连接失败

检查 MySQL 和 Redis 服务是否正常运行：
```bash
# Windows 查看服务
net start | findstr MySQL
net start | findstr Redis
```

### 3. 前端依赖安装失败

尝试使用淘宝镜像：
```bash
npm config set registry https://registry.npmmirror.com
npm install
```

---

## 📞 获取帮助

遇到问题时：
1. 查看项目根目录的 `README.md`
2. 查看 [API 文档](./API_DOCUMENTATION_V2.md)
3. 检查后端日志：`kids-game-backend/logs/`
4. 检查浏览器控制台错误信息（F12）

---

**最后更新**: 2026-03-09  
**版本**: v1.0.0
