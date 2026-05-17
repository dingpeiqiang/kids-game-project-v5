# 🔧 路线文件加载问题修复

## ❌ 问题现象

游戏启动时出现以下错误：

```
⚠️  加载索引文件失败: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
⚠️  加载路线文件失败: /games/dragonShooter/routes/levels/level_1.json SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## 🔍 问题原因

JSON 文件放在 `src/games/dragonShooter/routes/` 目录下，但 **Vite 只会将 `public/` 目录下的文件作为静态资源提供**。

当浏览器请求 `/games/dragonShooter/routes/index.json` 时，Vite 找不到该文件，返回了 HTML（index.html），导致 JSON 解析失败。

## ✅ 解决方案

### 步骤1：创建 public 目录结构

```bash
cd kids-game-house/games/simple-game
mkdir -p public/games/dragonShooter/routes
```

### 步骤2：复制路线文件到 public

```bash
# 将 routes 目录的所有内容复制到 public
cp -r src/games/dragonShooter/routes/* public/games/dragonShooter/routes/
```

### 步骤3：修改 Vite 配置

将 `vite.config.ts` 中的 `base` 从 `'./'` 改为 `'/'`：

```typescript
export default defineConfig({
  base: '/',  // ✅ 使用绝对路径
  // ...
})
```

### 步骤4：重启开发服务器

```bash
# 停止当前服务器（Ctrl+C）
# 然后重新启动
npm run dev
```

## 📂 最终目录结构

```
kids-game-house/games/simple-game/
├── public/                          # ✅ Vite 静态资源目录
│   └── games/
│       └── dragonShooter/
│           └── routes/              # ✅ 路线文件（从这里加载）
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
│           ├── routes/              # ⚠️ 源文件（仅用于编辑和版本控制）
│           │   ├── index.json
│           │   └── levels/
│           ├── routeLoader.ts       # 加载器代码
│           └── index.ts             # 主文件
└── vite.config.ts                   # Vite 配置
```

## 🎯 工作原理

### Vite 的 public 目录

- `public/` 目录下的文件会被**原样复制**到构建输出目录
- 在开发环境中，这些文件可以通过**根路径**访问
- 例如：`public/games/dragonShooter/routes/index.json` → `http://localhost:5100/games/dragonShooter/routes/index.json`

### 路径映射

```
文件系统路径                                    URL 路径
public/games/dragonShooter/routes/index.json  →  /games/dragonShooter/routes/index.json
public/games/dragonShooter/routes/levels/     →  /games/dragonShooter/routes/levels/
```

### routeLoader.ts 中的路径

```typescript
// ✅ 正确的路径（相对于网站根目录）
const response = await fetch('/games/dragonShooter/routes/index.json')

// ❌ 错误的路径（会导致 404）
const response = await fetch('./routes/index.json')
const response = await fetch('../routes/index.json')
```

## 🔄 工作流程

### 开发阶段

1. **编辑路线文件**
   ```bash
   # 可以直接编辑 public/ 目录下的文件
   code public/games/dragonShooter/routes/levels/level_1.json
   
   # 或者编辑 src/ 目录下的源文件，然后同步
   code src/games/dragonShooter/routes/levels/level_1.json
   cp src/games/dragonShooter/routes/* public/games/dragonShooter/routes/ -r
   ```

2. **刷新浏览器**
   - Vite 会自动检测到文件变化
   - 无需重启服务器
   - 直接刷新页面即可看到更新

### 生产构建

```bash
npm run build
```

Vite 会自动将 `public/` 目录的内容复制到 `dist/` 目录：

```
dist/
└── games/
    └── dragonShooter/
        └── routes/          # ✅ 自动复制
            ├── index.json
            └── levels/
```

## 🛠️ 自动化同步脚本（可选）

可以创建一个脚本来自动同步 src 和 public 目录：

### syncRoutes.ps1 (PowerShell)

```powershell
# 同步路线文件从 src 到 public
$srcPath = "src/games/dragonShooter/routes"
$publicPath = "public/games/dragonShooter/routes"

Write-Host "🔄 同步路线文件..."
Copy-Item -Path "$srcPath/*" -Destination $publicPath -Recurse -Force
Write-Host "✅ 同步完成"
```

### package.json 脚本

```json
{
  "scripts": {
    "dev": "vite",
    "sync-routes": "powershell -ExecutionPolicy Bypass -File syncRoutes.ps1",
    "dev:watch": "npm run sync-routes && vite"
  }
}
```

## 📝 最佳实践

### 1. 双目录策略

- **src/routes/** - 源代码，纳入 Git 版本控制
- **public/routes/** - 运行时文件，由 Vite 提供

### 2. 编辑流程

```bash
# 方法1：直接编辑 public/ 目录（推荐，简单快速）
code public/games/dragonShooter/routes/levels/level_1.json

# 方法2：编辑 src/ 目录，然后同步（适合团队协作）
code src/games/dragonShooter/routes/levels/level_1.json
npm run sync-routes
```

### 3. 版本控制

```bash
# 只提交 src/ 目录的变更
git add src/games/dragonShooter/routes/
git commit -m "更新第1关路线"

# public/ 目录可以选择性提交或忽略
# 如果忽略，需要在部署时重新生成
```

### 4. .gitignore 配置

```gitignore
# 选项1：忽略 public/routes/（每次构建时重新生成）
public/games/dragonShooter/routes/

# 选项2：不忽略（方便开发和测试）
# 不添加任何规则
```

## ❓ 常见问题

### Q1: 为什么要用两个目录？

**A:** 
- `src/` 是 TypeScript 源代码目录，Vite 会处理这些文件
- `public/` 是静态资源目录，Vite 会原样提供这些文件
- JSON 文件不是代码，应该放在 `public/` 目录

### Q2: 可以只用一个目录吗？

**A:** 可以，但不推荐：
- 如果只保留 `public/`，无法享受 TypeScript 的类型检查
- 如果只保留 `src/`，需要配置 Vite 提供这些文件（复杂）

### Q3: 修改后需要重启服务器吗？

**A:** 
- **不需要**！Vite 会自动检测 `public/` 目录的文件变化
- 只需刷新浏览器即可

### Q4: 生产环境怎么办？

**A:** 
- `npm run build` 会自动将 `public/` 复制到 `dist/`
- 无需额外配置

## ✅ 验证

重启服务器后，应该看到：

```
🔄 加载路线配置...
🔄 开始加载路线...
✅ 使用索引文件加载路线
✅ 已加载 4 个关卡路线
✅ 路线加载完成: 4 个关卡, 0 条自定义路线, 共 6404 个点
✅ 路线加载完成
```

不再有 `Unexpected token '<'` 错误！🎉
