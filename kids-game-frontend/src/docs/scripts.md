# 脚本工具使用指南

本文档介绍项目中使用的各种脚本工具及其使用方法。

---

## 📁 脚本位置

```
kids-game-project-v5/
├── set-env-vars.bat          # 环境变量配置 (Windows)
├── set-env-vars.ps1         # 环境变量配置 (PowerShell)
├── generate-resources.js     # 资源生成脚本
├── generate-theme-resources-pro.js  # 主题资源生成器
├── nginx.conf.example        # Nginx 配置示例
│
├── kids-game-backend/
│   ├── start-backend.bat     # 启动后端
│   ├── compile.bat          # 编译项目
│   ├── rebuild-backend.bat   # 重新构建后端
│   ├── export-ddl.bat       # 导出 DDL
│   └── run-migration.bat    # 运行迁移脚本
│
├── kids-game-frontend/
│   ├── clear-vite-cache.bat  # 清理 Vite 缓存
│   └── scripts/             # 前端脚本目录
│
└── kids-game-house/
    ├── install-dependencies.bat  # 安装游戏依赖
    ├── start-all-games.bat       # 启动所有游戏
    ├── stop-all-games.bat        # 停止所有游戏
    ├── build-all-games.bat       # 构建所有游戏
    └── diagnose.bat              # 诊断脚本
```

---

## 🎯 脚本分类

### 1. 环境配置脚本

#### set-env-vars.bat / set-env-vars.ps1

**功能**: 配置项目环境变量

**使用方法**:

```bash
# Windows CMD
set-env-vars.bat

# Windows PowerShell
.\set-env-vars.ps1
```

**配置内容**:
- 数据库连接信息
- Redis 连接信息
- JWT 密钥

---

### 2. 后端脚本

#### start-backend.bat

**功能**: 启动后端服务

```bash
cd kids-game-backend
start-backend.bat
```

#### compile.bat

**功能**: 编译后端项目

```bash
cd kids-game-backend
compile.bat
```

#### rebuild-backend.bat

**功能**: 清理并重新构建后端

```bash
cd kids-game-backend
rebuild-backend.bat
```

#### export-ddl.bat

**功能**: 导出数据库 DDL 语句

```bash
cd kids-game-backend
export-ddl.bat
```

#### run-migration.bat

**功能**: 运行数据库迁移脚本

```bash
cd kids-game-backend
run-migration.bat <script_name>.sql
```

**示例**:
```bash
run-migration.bat init-snake-themes.sql
```

---

### 3. 前端脚本

#### clear-vite-cache.bat

**功能**: 清理 Vite 构建缓存

```bash
cd kids-game-frontend
clear-vite-cache.bat
```

**使用场景**:
- 构建异常时
- 资源加载问题
- 热更新失效

---

### 4. 游戏脚本

#### install-dependencies.bat

**功能**: 安装所有游戏依赖

```bash
cd kids-game-house
install-dependencies.bat
```

#### start-all-games.bat

**功能**: 启动所有游戏服务

```bash
cd kids-game-house
start-all-games.bat
```

**启动的游戏**:
| 游戏 | 代码 | 端口 |
|------|------|------|
| 贪吃蛇大冒险 | snake-vue3 | 3003 |
| 植物大战僵尸 | plants-vs-zombie | 3004 |

#### stop-all-games.bat

**功能**: 停止所有游戏服务

```bash
cd kids-game-house
stop-all-games.bat
```

#### build-all-games.bat

**功能**: 构建所有游戏生产版本

```bash
cd kids-game-house
build-all-games.bat
```

#### diagnose.bat

**功能**: 诊断游戏运行状态

```bash
cd kids-game-house
diagnose.bat
```

**检查内容**:
- 端口占用情况
- 进程运行状态
- 依赖安装情况

---

### 5. 资源生成脚本

#### generate-resources.js

**功能**: 生成基础游戏资源

```bash
node generate-resources.js
```

**前提条件**:
```bash
npm install canvas
```

#### generate-theme-resources-pro.js

**功能**: 生成专业版主题资源（图片 + 音频）

```bash
# 安装 canvas 依赖
cd kids-game-frontend
npm install canvas

# 运行脚本
cd ..
node generate-theme-resources-pro.js
```

**输出位置**:
```
kids-game-frontend/dist/games/
kids-game-frontend/assets/games/
```

**生成的主题**:
- 贪吃蛇：清新绿、经典复古、活力橙
- PVZ：阳光活力、月夜幽深、卡通萌系

#### 完整资源生成指南

详细的主题资源生成说明，请参考 [完整主题资源生成器指南](../COMPLETE_RESOURCE_GENERATOR_GUIDE.md)（根目录）

---

## 📋 使用流程

### 新项目初始化

```bash
# 1. 配置环境变量
set-env-vars.bat

# 2. 初始化数据库
cd kids-game-backend
mysql -u root -p kids_game < src/main/resources/schema.sql

# 3. 启动后端
start-backend.bat

# 4. 启动前端
cd ../kids-game-frontend
npm install
npm run dev

# 5. 安装游戏依赖（可选）
cd ../kids-game-house
install-dependencies.bat
start-all-games.bat
```

### 日常开发

```bash
# 启动后端
cd kids-game-backend
start-backend.bat

# 启动前端（新终端）
cd kids-game-frontend
npm run dev

# 启动游戏（新终端）
cd kids-game-house
start-all-games.bat
```

---

## ⚠️ 注意事项

### 权限问题

Windows 系统可能需要管理员权限运行脚本：
```bash
# 右键 -> 以管理员身份运行
```

### 路径问题

确保在项目根目录执行脚本，或使用绝对路径。

### 端口冲突

如果端口被占用，先停止占用进程：
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <进程ID> /F
```

---

## 🛠️ 自定义脚本

### 创建新的批处理脚本

```batch
@echo off
REM 脚本说明

echo 开始执行...

REM 脚本内容
cd kids-game-backend
mvn clean compile

echo 执行完成
pause
```

### 创建 PowerShell 脚本

```powershell
# 脚本说明
Write-Host "开始执行..."

# 脚本内容
Set-Location "kids-game-backend"
mvn clean compile

Write-Host "执行完成"
```

---

## 📞 获取帮助

如遇到脚本问题，请检查：
1. 脚本文件是否存在
2. 是否有执行权限
3. 是否安装了必要依赖
4. 查看脚本输出错误信息

---

**最后更新**: 2026-03-20
**版本**: v1.0.0
