# 📁 一个路线一个文件 - 使用指南

## 🎯 设计理念

**每个路线都是独立的 JSON 文件**，便于管理、版本控制和团队协作。

---

## 📂 目录结构

```
routes/
├── index.json              # 路线索引文件（必需）
├── levels/                 # 关卡路线目录
│   ├── level_1.json       # 第1关 - 简单波浪
│   ├── level_3.json       # 第3关 - Z字形
│   ├── level_5.json       # 第5关 - 螺旋挑战
│   └── level_10.json      # 第10关 - BOSS战场
├── custom/                 # 自定义路线目录
│   └── (用户创建的路线)
├── inbox/                  # 待处理路线（从浏览器导出）
│   └── processed/         # 已处理归档
└── backup/                # 备份目录
```

---

## 📄 文件格式

### 1. 索引文件 (index.json)

```json
{
  "version": "1.0",
  "lastModified": "2026-05-01T12:14:43.028Z",
  "levels": {
    "1": "level_1.json",
    "3": "level_3.json",
    "5": "level_5.json",
    "10": "level_10.json"
  },
  "custom": []
}
```

**作用：**
- 映射关卡号到文件名
- 列出所有自定义路线文件
- 游戏启动时首先加载此文件

### 2. 单个路线文件 (level_X.json)

```json
{
  "version": "1.0",
  "lastModified": "2026-05-01T12:14:43.023Z",
  "route": {
    "id": "level_1_easy",
    "name": "第1关 - 简单波浪",
    "points": [
      { "x": 180, "y": -200 },
      { "x": 180.31, "y": -199.35 },
      ...
    ]
  }
}
```

**特点：**
- 每个文件只包含一个路线
- 易于单独编辑和版本控制
- 文件大小适中（约 125KB/文件）

---

## 🚀 工作流程

### 方案A：直接编辑 JSON 文件（推荐）

#### 步骤1：编辑路线文件

打开 `routes/levels/level_1.json`，修改 `route.points` 数组：

```json
{
  "route": {
    "id": "level_1_custom",
    "name": "第1关 - 自定义路线",
    "points": [
      { "x": 180, "y": -200 },
      { "x": 200, "y": -180 },
      { "x": 160, "y": -160 },
      // ... 更多点
    ]
  }
}
```

#### 步骤2：更新索引文件（如果需要）

如果添加了新关卡，编辑 `routes/index.json`：

```json
{
  "levels": {
    "1": "level_1.json",
    "2": "level_2.json",  // 新增
    "3": "level_3.json",
    ...
  }
}
```

#### 步骤3：刷新游戏

```bash
# 开发服务器会自动重新加载
# 或者手动刷新浏览器页面
```

---

### 方案B：使用路线编辑器 + 拆分脚本

#### 步骤1：在游戏中绘制路线

1. 启动游戏
2. 进入路线编辑器
3. 绘制新路线
4. 点击"保存并下载"

#### 步骤2：运行拆分脚本

```bash
cd kids-game-house/games/simple-game/src/games/dragonShooter
npx ts-node splitRoutesToFiles.ts
```

**脚本功能：**
- 读取 `level_routes.json` 或 `custom_routes.json`
- 自动拆分为独立文件
- 生成 `index.json` 索引
- 保存到 `levels/` 和 `custom/` 目录

#### 步骤3：验证结果

```bash
# 查看生成的文件
tree /F routes

# 应该看到：
# routes/
# ├── index.json
# ├── levels/
# │   ├── level_1.json
# │   ├── level_3.json
# │   └── ...
# └── custom/
#     └── ...
```

---

## 🔧 常用操作

### 添加新关卡路线

#### 方法1：手动创建文件

1. 创建 `routes/levels/level_7.json`
2. 复制现有文件作为模板
3. 修改 `route.id`, `route.name`, `route.points`
4. 在 `index.json` 中添加映射：`"7": "level_7.json"`

#### 方法2：使用生成脚本

```bash
# 编辑 generateInitialRoutes.ts，添加新的关卡类型
# 然后运行：
npx ts-node generateInitialRoutes.ts
npx ts-node splitRoutesToFiles.ts
```

### 删除关卡路线

1. 删除对应的 JSON 文件：`routes/levels/level_3.json`
2. 从 `index.json` 中移除映射：删除 `"3": "level_3.json"`
3. 刷新游戏

### 批量修改路线

```bash
# 1. 导出所有路线为单个文件（可选）
# 2. 使用文本编辑器批量替换
# 3. 重新拆分
npx ts-node splitRoutesToFiles.ts
```

### 版本控制

```bash
# Git 跟踪所有路线文件
git add routes/levels/*.json
git add routes/custom/*.json
git add routes/index.json
git commit -m "更新第1关和第3关路线"
```

**优势：**
- ✅ 可以查看每个文件的变更历史
- ✅ 可以轻松回滚单个路线
- ✅ 合并冲突更容易解决
- ✅ Code Review 更清晰

---

## 📊 文件统计

当前路线文件：

| 文件 | 大小 | 点数 | 说明 |
|------|------|------|------|
| level_1.json | ~125KB | 1601 | 第1关 - 简单波浪 |
| level_3.json | ~125KB | 1601 | 第3关 - Z字形 |
| level_5.json | ~125KB | 1601 | 第5关 - 螺旋挑战 |
| level_10.json | ~125KB | 1601 | 第10关 - BOSS战场 |
| **总计** | **~500KB** | **6404** | **4个关卡** |

---

## 🎮 游戏中的使用

### 自动加载

游戏启动时自动执行：

```typescript
// index.ts
await routeLoader.loadRoutes()

// routeLoader.ts 内部流程：
// 1. 加载 index.json
// 2. 根据索引加载每个关卡文件
// 3. 加载自定义路线
// 4. 缓存到内存
```

### 获取路线

```typescript
// 获取第1关路线
const route = routeLoader.getLevelRoute(1)

// 获取所有关卡路线
const allRoutes = routeLoader.getAllLevelRoutes()

// 获取可用关卡列表
const levels = routeLoader.getAvailableLevels()  // [1, 3, 5, 10]

// 获取统计信息
const stats = routeLoader.getStats()
// { levelCount: 4, customCount: 0, totalPoints: 6404 }
```

### 热更新

```typescript
// 在游戏中重新加载路线（无需重启）
await routeLoader.reload()
```

---

## 🛠️ 高级用法

### 自定义路线目录结构

你可以创建子目录来组织路线：

```
routes/levels/
├── easy/
│   ├── level_1.json
│   └── level_2.json
├── medium/
│   ├── level_3.json
│   └── level_4.json
└── hard/
    ├── level_5.json
    └── level_10.json
```

需要修改 `routeLoader.ts` 中的路径逻辑。

### 路线元数据

可以在路线文件中添加额外信息：

```json
{
  "version": "1.0",
  "lastModified": "2026-05-01T12:00:00.000Z",
  "route": {
    "id": "level_1_easy",
    "name": "第1关 - 简单波浪",
    "difficulty": "easy",
    "author": "张三",
    "description": "适合新手的简单波浪路线",
    "tags": ["beginner", "wave"],
    "points": [...]
  }
}
```

### 路线预览图

可以为每个路线生成预览图：

```
routes/previews/
├── level_1.png
├── level_3.png
└── ...
```

在关卡管理界面显示缩略图。

---

## ❓ 常见问题

### Q1: 为什么要用索引文件？

**A:** 浏览器无法列出目录内容（安全限制），所以需要索引文件告诉游戏有哪些路线文件。

### Q2: 可以直接编辑 JSON 文件吗？

**A:** 可以！这是推荐的方式。JSON 文件是人类可读的，可以用任何文本编辑器修改。

### Q3: 如何批量生成路线？

**A:** 使用 `generateInitialRoutes.ts` 脚本，然后运行 `splitRoutesToFiles.ts` 拆分。

### Q4: 文件太大怎么办？

**A:** 
- 可以减少路线点数（从 1601 降到 800）
- 可以使用坐标压缩算法
- 可以按难度分目录存储

### Q5: 如何备份路线？

**A:** 
```bash
# 手动备份
cp -r routes routes_backup_20260501

# 或使用备份脚本
npm run backup-routes
```

### Q6: 团队协作时如何处理冲突？

**A:** 
- 每个开发者负责不同的关卡文件
- 使用 Git 分支管理
- 合并前进行 Code Review
- 利用独立文件的优势，冲突更容易解决

---

## 📝 最佳实践

1. **命名规范**
   - 关卡文件：`level_{关卡号}.json`
   - 自定义文件：`custom_{名称}.json`
   - 保持文件名简洁明了

2. **版本控制**
   - 每次修改后提交 Git
   - 使用有意义的 commit message
   - 定期备份重要路线

3. **文件组织**
   - 保持 `index.json` 与文件同步
   - 定期清理未使用的路线文件
   - 使用 `backup/` 目录归档旧版本

4. **性能优化**
   - 路线点数控制在合理范围（800-2000）
   - 避免重复的路线
   - 按需加载（未来可优化）

5. **文档维护**
   - 在路线文件中添加注释
   - 记录修改历史和原因
   - 更新相关文档

---

## 🎉 总结

**一个路线一个文件**的优势：

✅ **灵活性**：每个路线独立管理  
✅ **版本控制**：Git 追踪更精确  
✅ **协作友好**：减少合并冲突  
✅ **易于调试**：问题定位更快  
✅ **可扩展性**：支持任意数量的路线  

开始使用吧！🚀
