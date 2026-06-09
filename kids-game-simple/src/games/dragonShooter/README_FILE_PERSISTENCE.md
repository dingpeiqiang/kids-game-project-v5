# 🗂️ 路线文件持久化系统

## 📋 功能概述

实现将路线图编辑器保存的路线**自动生成文件到代码目录**，并在关卡管理中**选择已有路线并关联到关卡**。

---

## 🎯 工作流程

### 整体架构

```
┌─────────────────┐
│  路线编辑器      │
│  (浏览器中)     │
└────────┬────────┘
         │ 1. 绘制路线
         │ 2. 点击保存
         ▼
┌─────────────────┐
│  下载 JSON 文件  │
│  (自动触发)     │
└────────┬────────┘
         │ 3. 移动到 inbox/
         ▼
┌─────────────────┐
│  npm run        │
│  save-routes    │
└────────┬────────┘
         │ 4. 处理文件
         │ 5. 生成代码
         ▼
┌─────────────────┐
│ generated_      │
│ routes.ts       │
└────────┬────────┘
         │ 6. 导入使用
         ▼
┌─────────────────┐
│  index.ts       │
│  (游戏运行)     │
└─────────────────┘
```

---

## 📁 目录结构

```
dragonShooter/
├── index.ts                    # 主文件
├── routeManager.ts             # 路线管理器（Node.js）
├── saveRoutes.ts               # 保存脚本（Node.js）
├── routes/                     # 路线文件目录
│   ├── level_routes.json      # 关卡专属路线
│   ├── custom_routes.json     # 自定义路线
│   ├── inbox/                 # 待处理文件
│   │   └── processed/         # 已处理归档
│   └── backup/                # 备份文件
├── generated_routes.ts         # 自动生成的代码（gitignore）
└── README_FILE_PERSISTENCE.md # 本文档
```

---

## 🚀 使用方法

### 方法一：完整流程（推荐）

#### 步骤1：在游戏中绘制路线

1. 启动游戏
2. 点击 **"✏️ 绘制路线"**
3. 在画布上绘制龙的移动路线
4. 点击 **"💾 保存"** 按钮
5. 输入路线名称（例如："第7关 - 螺旋挑战"）
6. 浏览器会自动下载 JSON 文件

#### 步骤2：移动文件到 inbox

将下载的 JSON 文件移动到：
```
games/simple-game/src/games/dragonShooter/routes/inbox/
```

#### 步骤3：运行保存脚本

在项目根目录运行：
```bash
cd games/simple-game
npm run save-routes
```

或者直接使用 ts-node：
```bash
npx ts-node src/games/dragonShooter/saveRoutes.ts
```

#### 步骤4：查看生成的代码

脚本会生成 `generated_routes.ts` 文件，包含：
```typescript
export const LEVEL_SPECIFIC_ROUTES: Record<number, CustomRoute> = {
  7: {
    id: 'level_7_spiral',
    name: '第7关 - 螺旋挑战',
    points: [
      { x: 180.00, y: -200.00 },
      { x: 180.00, y: -199.00 },
      // ... 1600个点
    ]
  }
}
```

#### 步骤5：在 index.ts 中导入

修改 `index.ts`，替换硬编码的路线配置：

```typescript
// 原来：
const LEVEL_SPECIFIC_ROUTES: Record<number, CustomRoute> = {
  1: { ... },
  3: { ... },
  // ...
}

// 改为：
import { LEVEL_SPECIFIC_ROUTES } from './generated_routes'
```

#### 步骤6：重新编译和运行

```bash
npm run dev
```

现在游戏中就会使用新生成的路线了！

---

### 方法二：快速命令

#### 仅处理 inbox 文件
```bash
npm run save-routes -- --process
```

#### 仅生成代码
```bash
npm run save-routes -- --generate
```

#### 列出所有路线文件
```bash
npm run save-routes -- --list
```

#### 备份所有路线
```bash
npm run save-routes -- --backup
```

#### 查看帮助
```bash
npm run save-routes -- --help
```

---

## 🔧 配置 package.json

在 `games/simple-game/package.json` 中添加脚本：

```json
{
  "scripts": {
    "save-routes": "ts-node src/games/dragonShooter/saveRoutes.ts"
  }
}
```

---

## 📊 文件格式说明

### level_routes.json

```json
{
  "version": "1.0",
  "lastModified": "2026-05-01T12:00:00.000Z",
  "routes": {
    "1": {
      "id": "level_1_easy",
      "name": "第1关 - 简单波浪",
      "points": [
        { "x": 180.00, "y": -200.00 },
        { "x": 180.00, "y": -199.00 },
        ...
      ]
    },
    "3": { ... },
    "5": { ... }
  }
}
```

### custom_routes.json

```json
{
  "version": "1.0",
  "lastModified": "2026-05-01T12:00:00.000Z",
  "routes": [
    {
      "id": "my_custom_route_1",
      "name": "我的自定义路线",
      "points": [ ... ]
    },
    {
      "id": "my_custom_route_2",
      "name": "另一条路线",
      "points": [ ... ]
    }
  ]
}
```

---

## 🎮 关卡管理中使用

### 显示可用路线

在关卡管理界面，可以显示所有可用的路线文件：

```typescript
// 伪代码
function drawLevelManager() {
  // ... 现有代码 ...
  
  // 显示可用路线列表
  const availableRoutes = listRouteFiles()
  
  availableRoutes.forEach((file, index) => {
    const y = startY + index * itemHeight
    ctx.fillText(`📄 ${file}`, 25, y + 25)
    
    // 点击选择按钮
    ctx.fillText('选择', BASE_W - 50, y + 25)
  })
}
```

### 关联路线到关卡

当用户点击"选择"时：

```typescript
// 伪代码
function selectRouteForLevel(level: number, filename: string) {
  const routeData = getRouteFile(filename)
  
  // 更新关卡配置
  LEVEL_SPECIFIC_ROUTES[level] = {
    id: routeData.id,
    name: routeData.name,
    points: routeData.points
  }
  
  // 保存到文件
  saveLevelRoutes(LEVEL_SPECIFIC_ROUTES)
  
  // 重新生成代码
  generateTypeScriptCode()
  
  console.log(`✅ 已将 ${filename} 关联到第${level}关`)
}
```

---

## 💡 高级用法

### 1. 批量处理多个路线

将多个 JSON 文件放入 `inbox/` 目录，然后运行：
```bash
npm run save-routes
```

脚本会自动处理所有文件并合并。

### 2. 版本控制

将 `routes/` 目录纳入 Git 管理：

```gitignore
# .gitignore

# 不忽略路线文件
!src/games/dragonShooter/routes/*.json
!src/games/dragonShooter/routes/inbox/**/*.json

# 但忽略生成的代码
src/games/dragonShooter/generated_routes.ts

# 忽略备份
src/games/dragonShooter/routes/backup/*
```

### 3. 自动化脚本

创建 `watch-routes.sh` 监听文件变化：

```bash
#!/bin/bash

# 监听 inbox 目录
while true; do
  files=$(ls routes/inbox/*.json 2>/dev/null | wc -l)
  
  if [ "$files" -gt 0 ]; then
    echo "📥 发现新文件，自动处理..."
    npm run save-routes
    sleep 5
  fi
  
  sleep 2
done
```

### 4. CI/CD 集成

在部署前自动生成最新代码：

```yaml
# .github/workflows/deploy.yml
jobs:
  build:
    steps:
      - name: Generate routes code
        run: npm run save-routes -- --generate
      
      - name: Build game
        run: npm run build
```

---

## ⚠️ 注意事项

### 1. 文件大小
- 每个关卡约 1600 个点
- JSON 格式约 50-100KB
- 建议定期清理不需要的路线

### 2. 命名规范
- 关卡路线：`level_X_description.json`
- 自定义路线：`custom_name.json`
- 避免特殊字符和空格

### 3. 备份策略
- 每次生成代码前自动备份
- 保留最近 7 天的备份
- 重要版本手动备份到 `backup/` 目录

### 4. 团队协作
- 提交 `routes/*.json` 到 Git
- 不提交 `generated_routes.ts`（自动生成）
- 团队成员拉取后运行 `npm run save-routes -- --generate`

---

## 🐛 常见问题

### Q1: 为什么不能直接写入文件系统？
**A:** 浏览器出于安全考虑，不允许网页直接写入本地文件系统。所以我们采用"下载到 inbox → Node.js 脚本处理"的方案。

### Q2: 如何避免每次都手动移动文件？
**A:** 可以：
1. 设置浏览器默认下载目录为 `inbox/`
2. 使用自动化脚本监听下载目录
3. 开发浏览器扩展自动保存

### Q3: 生成的代码太大怎么办？
**A:** 
1. 只保留必要的关卡路线
2. 压缩点数据（减少精度）
3. 使用懒加载（按需加载关卡）

### Q4: 可以回滚到之前的版本吗？
**A:** 可以：
1. 从 `backup/` 目录找到备份文件
2. 恢复到 `routes/` 目录
3. 重新运行生成脚本

### Q5: 如何在不同项目间共享路线？
**A:** 
1. 导出 `routes/` 目录
2. 分享给其他项目
3. 对方导入后运行生成脚本

---

## 🚀 未来计划

### Phase 1: 基础功能（已完成）✅
- [x] Node.js 路线管理器
- [x] 保存脚本
- [x] 自动生成 TypeScript 代码
- [x] 文件归档和备份

### Phase 2: 增强功能（计划中）📋
- [ ] 浏览器扩展（自动保存到 inbox）
- [ ] 文件监听（自动处理新文件）
- [ ] 路线预览工具
- [ ] 批量编辑功能

### Phase 3: 高级功能（规划中）💡
- [ ] WebDAV 同步
- [ ] 云端存储
- [ ] 路线市场
- [ ] 协作编辑

---

## 📞 技术支持

遇到问题时：

1. **检查文件路径**
   ```bash
   ls -la routes/inbox/
   ```

2. **查看脚本输出**
   ```bash
   npm run save-routes -- --verbose
   ```

3. **验证 JSON 格式**
   ```bash
   cat routes/inbox/file.json | jq .
   ```

4. **查看日志**
   - 控制台输出
   - `routes/inbox/processed/` 目录

---

## 🎉 总结

通过路线文件持久化系统，你可以：

✅ **自动生成代码**：从 JSON 文件生成 TypeScript 代码  
✅ **版本控制**：将路线配置纳入 Git 管理  
✅ **团队协作**：多人共同维护路线库  
✅ **灵活管理**：随时添加、删除、修改路线  

**最佳实践：**
1. 每次绘制完路线立即保存
2. 定期运行保存脚本
3. 提交路线文件到 Git
4. 重要版本手动备份

祝你设计出精彩的关卡路线！🐉✨
