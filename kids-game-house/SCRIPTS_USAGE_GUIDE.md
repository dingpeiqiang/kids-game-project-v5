# 🛠️ 批处理脚本使用指南

**更新日期**: 2026-03-26  
**状态**: ✅ 已更新为新目录结构

---

## 📋 可用脚本列表

### 构建和部署

| 脚本 | 功能 | 说明 |
|------|------|------|
| `build-all-games.bat` | 构建所有游戏 | 依次构建 4 个游戏的生产版本 |
| `start-all-games.bat` | 启动所有游戏 | 同时启动所有游戏的开发服务器 |
| `stop-all-games.bat` | 停止所有游戏 | 关闭所有开发服务器 |
| `install-dependencies.bat` | 安装依赖 | 为所有游戏安装 npm 包 |

### 资源和工具

| 脚本 | 功能 | 说明 |
|------|------|------|
| `generate-resources.bat` | 生成资源 | 调用 GTRS 生成器创建游戏资源 |
| `register-game.bat` | 注册游戏 | 将新游戏注册到平台数据库 |
| `diagnose.bat` | 诊断问题 | 检查环境和依赖状态 |

---

## 🚀 常用场景

### 场景 1: 开始新一天的开发

```batch
# 1. 启动所有游戏（自动打开多个命令行窗口）
start-all-games.bat

# 等待所有服务器启动...
# 访问地址:
# - 飞机大战：http://localhost:8081
# - 贪吃蛇：http://localhost:3003
# - 坦克大战：http://localhost:3004
# - 植物大战僵尸：http://localhost:3005
```

### 场景 2: 构建生产版本

```batch
# 构建所有游戏的生产版本
build-all-games.bat

# 构建完成后，各游戏的 dist 目录包含：
# - games/plane-shooter/dist/
# - games/snake/dist/
# - games/tank-battle/dist/
# - games/plants-vs-zombie/dist/
```

### 场景 3: 安装或更新依赖

```batch
# 为所有游戏安装依赖
install-dependencies.bat

# 这会在每个游戏目录下执行 npm install
```

### 场景 4: 生成新的游戏资源

```batch
# 使用 GTRS 生成器
cd tools/gtrs-generator/src
node generate-resources.mjs --game=my-new-game

# 或使用 PowerShell 脚本
cd tools/audio-converter
.\convert-to-mp3.ps1 -InputDir assets\audio
```

---

## 📝 脚本详细说明

### build-all-games.bat

**功能**: 构建所有游戏的生产版本

**执行流程**:
```
[1/4] 构建飞机大战 → [2/4] 构建贪吃蛇 → [3/4] 构建坦克大战 → [4/4] 构建植物大战僵尸
```

**输出位置**:
- `games/plane-shooter/dist/`
- `games/snake/dist/`
- `games/tank-battle/dist/`
- `games/plants-vs-zombie/dist/`

**预计耗时**: ~5-10 分钟（取决于网络速度）

---

### start-all-games.bat

**功能**: 同时启动所有游戏的开发服务器

**端口分配**:
- 飞机大战：8081
- 贪吃蛇：3003
- 坦克大战：3004
- 植物大战僵尸：3005

**特点**:
- ✅ 每个游戏在独立的命令行窗口
- ✅ 支持热重载
- ✅ 自动打开浏览器（可选）

---

### stop-all-games.bat

**功能**: 停止所有正在运行的游戏服务器

**使用方法**:
```batch
# 运行停止脚本
stop-all-games.bat

# 这会关闭所有由 start-all-games.bat 启动的进程
```

---

### install-dependencies.bat

**功能**: 为所有游戏安装 npm 依赖

**执行流程**:
```
for each game in games/:
    cd games/{game-name}
    npm install
```

**使用场景**:
- 首次设置开发环境
- 添加了新的依赖包
- node_modules 损坏需要重新安装

---

## 🔧 自定义脚本

### 添加新游戏到批处理

如果有新游戏加入，需要更新以下脚本：

**1. 更新 build-all-games.bat**
```batch
echo.
echo [5/5] 构建我的新游戏...
cd /d %~dp0games\my-new-game
call npm run build
```

**2. 更新 start-all-games.bat**
```batch
echo.
echo [5/5] 启动我的新游戏 (端口 3006)
start "My New Game" cmd /k "cd /d %~dp0games\my-new-game && npm run dev"
```

**3. 更新访问地址列表**
```batch
echo   - 我的新游戏：http://localhost:3006
```

---

## ⚠️ 常见问题

### Q1: 脚本报错找不到路径

**解决方案**:
```batch
# 确保在当前目录下执行
cd kids-game-house

# 或者使用绝对路径
D:\工作\sitech\项目\kids-game-house\build-all-games.bat
```

### Q2: npm 命令不识别

**解决方案**:
```batch
# 检查 Node.js 是否安装
node --version

# 如果没有，安装 Node.js LTS 版本
# https://nodejs.org/
```

### Q3: 端口被占用

**解决方案**:
```batch
# 停止所有游戏
stop-all-games.bat

# 或者手动杀死占用端口的进程
# Windows: 使用资源管理器或 netstat 命令
netstat -ano | findstr :8081
taskkill /PID <进程 ID> /F
```

### Q4: 构建失败

**解决方案**:
```batch
# 1. 清理缓存
cd games/plane-shooter
Remove-Item node_modules -Recurse
Remove-Item package-lock.json -Force
npm install

# 2. 重新构建
cd ../../
build-all-games.bat
```

---

## 🎯 最佳实践

### ✅ 推荐做法

1. **每天开始时**
   ```batch
   start-all-games.bat
   ```

2. **提交代码前**
   ```batch
   build-all-games.bat
   ```

3. **添加新依赖后**
   ```batch
   install-dependencies.bat
   ```

4. **下班时**
   ```batch
   stop-all-games.bat
   ```

### ❌ 避免的做法

1. ❌ 不要手动在每个游戏中执行 `npm run build`
2. ❌ 不要在脚本运行时关闭命令行窗口
3. ❌ 不要修改脚本中的路径配置（除非确实需要）
4. ❌ 不要在多个窗口同时构建同一个游戏

---

## 📊 性能参考

| 操作 | 预计耗时 | 备注 |
|------|----------|------|
| **启动所有游戏** | ~30 秒 | 取决于机器性能 |
| **构建所有游戏** | 5-10 分钟 | 取决于网络和机器 |
| **安装所有依赖** | 3-8 分钟 | 首次安装较慢 |
| **热重载** | <1 秒 | 开发时的优势 |

---

## 🔗 相关文档

- 📖 [快速参考卡](./QUICK_REFERENCE_CARD.md) - 日常使用速查
- 📖 [迁移完成报告](./REFACTOR_COMPLETE.md) - 了解迁移详情
- 📖 [最终总结](./REFACTOR_FINAL_SUMMARY.md) - 全面了解重构

---

## 💡 小贴士

### 快速访问游戏

可以将常用地址保存为书签：

```
http://localhost:8081  - 飞机大战
http://localhost:3003  - 贪吃蛇
http://localhost:3004  - 坦克大战
http://localhost:3005  - 植物大战僵尸
```

### 使用 VS Code 工作区

创建 `.code-workspace` 文件来管理所有游戏：

```json
{
  "folders": [
    { "path": "games/plane-shooter" },
    { "path": "games/snake" },
    { "path": "games/tank-battle" },
    { "path": "games/plants-vs-zombie" }
  ]
}
```

### 批量查看日志

使用终端复用工具（如 Windows Terminal）可以同时查看所有游戏的输出日志。

---

**最后更新**: 2026-03-26  
**维护者**: Lingma AI Assistant  
**状态**: ✅ 已更新并测试

🚀 **高效使用这些脚本，让开发更顺畅！**
