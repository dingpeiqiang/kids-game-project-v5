# 📁 Public 目录方案 - 使用指南

## 🎯 方案概述

将路线 JSON 文件放在 `public/` 目录，Vite 会自动将其作为静态资源提供。

**优势：**
- ✅ Vite 原生支持，无需额外配置
- ✅ 简单可靠，零复杂度
- ✅ 开发和生产环境一致
- ✅ 自动热更新

---

## 📂 目录结构

```
kids-game-house/games/simple-game/
├── public/                          # ✅ Vite 静态资源目录
│   └── games/
│       └── dragonShooter/
│           └── routes/              # ✅ 运行时路线文件
│               ├── index.json
│               ├── levels/
│               │   ├── level_1.json
│               │   ├── level_3.json
│               │   ├── level_5.json
│               │   └── level_10.json
│               ├── custom/
│               ├── inbox/
│               └── backup/
├── src/
│   └── games/
│       └── dragonShooter/
│           ├── routes/              # ⚠️ 源代码（编辑用）
│           │   ├── index.json
│           │   └── levels/
│           ├── routeLoader.ts
│           └── index.ts
├── syncRoutes.ts                    # ✅ 同步脚本
├── vite.config.ts                   # Vite 配置（简单）
└── package.json
```

---

## 🔄 工作流程

### 直接编辑 public 目录（唯一方式）

**路线文件直接在 public 目录中维护！**

1. **编辑路线文件**
   ```bash
   code public/games/dragonShooter/routes/levels/level_1.json
   ```

2. **保存文件**

3. **刷新浏览器**
   - Vite 会自动检测到变化
   - 无需重启服务器
   - 直接刷新即可看到更新

**优点：**
- ✅ 最简单，无需同步
- ✅ 修改立即生效
- ✅ 完全手动控制
- ✅ 适合快速迭代

---

## 🚀 启动游戏

### 1. 启动开发服务器

```bash
cd kids-game-house/games/simple-game
npm run dev
```

### 2. 验证路线加载

打开浏览器控制台，应该看到：

```
🔄 加载路线配置...
🔄 开始加载路线...
✅ 使用索引文件加载路线
✅ 已加载 4 个关卡路线
✅ 路线加载完成: 4 个关卡, 0 条自定义路线, 共 6404 个点
✅ 路线加载完成
```

### 3. 测试路线功能

- 进入关卡管理界面
- 查看已配置的关卡
- 开始闯关测试

---

## 🛠️ 常用命令

### 启动开发服务器

```bash
npm run dev
```

### 生产构建

```bash
npm run build
```

Vite 会自动将 `public/` 目录复制到 `dist/` 目录。

---

## 📝 版本控制策略

### 推荐：直接提交 public 目录

**.gitignore:**
```gitignore
# 不忽略任何路线文件
```

**工作流程：**
1. 编辑 `public/` 目录的路线文件
2. 提交所有变更
   ```bash
   git add public/games/dragonShooter/routes/
   git commit -m "更新第1关路线"
   ```

**优点：**
- ✅ 开发更方便
- ✅ 无需构建即可查看
- ✅ 适合小团队
- ✅ 完全手动控制

---

## 🔧 高级用法

### 1. 批量修改路线

使用文本编辑器批量替换：

```bash
# 1. 使用 VS Code 全局搜索替换
# Ctrl+Shift+F 打开全局搜索

# 搜索: "x": 180
# 替换为: "x": 200

# 2. 选择要修改的文件
# ☑️ level_1.json
# ☑️ level_3.json

# 3. 点击“全部替换”

# 4. 刷新浏览器查看效果
```

---

### 2. 备份路线文件
}
```

快捷键：`Ctrl+Shift+B`

---

## 🏗️ 生产部署

### 构建流程

```bash
# 1. 同步路线文件
npm run sync-routes

# 2. 构建项目
npm run build

# 3. 验证 dist 目录
ls dist/games/dragonShooter/routes/
# 应该看到: index.json, levels/, custom/, etc.
```

### 部署到服务器

Vite 构建后，`public/` 目录的内容会自动复制到 `dist/` 目录：

```
dist/
└── games/
    └── dragonShooter/
        └── routes/          # ✅ 自动复制
            ├── index.json
            └── levels/
```

直接部署 `dist/` 目录即可。

---

## ❓ 常见问题

### Q1: 为什么要用两个目录？

**A:** 
- `src/` - 源代码，便于版本控制和协作
- `public/` - 运行时文件，Vite 直接提供

可以只用一个目录，但双目录更灵活。

---

### Q2: 修改后需要重启服务器吗？

**A:** 
- **不需要**！Vite 会自动检测 `public/` 目录的变化
- 只需刷新浏览器即可

---

### Q3: 可以删除 src 目录吗？

**A:** 
- 可以，路线文件只需要在 `public/` 目录
- `src/` 目录中的 routes 可以保留作为参考
- 也可以完全删除，只维护 `public/` 目录

---

### Q4: 生产环境需要特殊配置吗？

**A:** 
- 不需要！
- `npm run build` 会自动处理
- Nginx/Apache 直接提供静态文件

---

## 🎓 技术要点

### Vite 的 public 目录

- `public/` 目录下的文件会被**原样复制**到构建输出
- 在开发环境中，通过**根路径**访问
- 例如：`public/games/routes/index.json` → `http://localhost:5100/games/routes/index.json`

### 路径映射

```
文件系统: public/games/dragonShooter/routes/index.json
URL:      /games/dragonShooter/routes/index.json
```

### routeLoader.ts 中的路径

```typescript
// ✅ 正确的路径
const response = await fetch('/games/dragonShooter/routes/index.json')
```

---

## ✅ 总结

### 优势

✅ **简单可靠**：Vite 原生支持  
✅ **零配置**：无需自定义插件  
✅ **热更新**：修改后刷新即可  
✅ **生产友好**：构建时自动处理  

### 工作流程

1. **编辑文件** → `public/games/dragonShooter/routes/`
2. **保存文件**
3. **刷新浏览器** → 查看更新

### 下一步

1. **重启开发服务器**测试
2. **验证路线加载**
3. **开始开发**

现在请**重启开发服务器**测试吧！🚀✨
