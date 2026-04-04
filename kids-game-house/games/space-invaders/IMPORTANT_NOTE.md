# ⚠️ 重要：目录结构说明

## 📁 项目结构

```
realtime-multiplayer-space-invaders-main/          ← 外层目录（不要在这里执行 npm 命令）
└── realtime-multiplayer-space-invaders-main/      ← 内层目录（实际项目根目录）
    ├── package.json                                ← package.json 在这里
    ├── server.js
    ├── .env
    └── ...
```

## 🚀 正确的操作步骤

### 1. 进入正确的目录
```bash
cd realtime-multiplayer-space-invaders-main/realtime-multiplayer-space-invaders-main
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
```bash
# 复制模板文件
cp .env-sample .env

# 编辑 .env 文件，填入你的 Ably API 密钥
```

### 4. 启动开发服务器
```bash
npm run dev
```

## 💡 快速提示

**Windows PowerShell 用户：**
```powershell
cd realtime-multiplayer-space-invaders-main\realtime-multiplayer-space-invaders-main
npm install
npm run dev
```

**或者直接使用启动脚本：**
```powershell
.\dev.bat
```

## ❌ 常见错误

**错误信息：**
```
npm error enoent Could not read package.json
```

**原因：** 在外层目录执行了 npm 命令

**解决方法：** 进入内层的 `realtime-multiplayer-space-invaders-main` 目录

---

**记住：所有的 npm 命令都要在内层目录执行！** 🎯
