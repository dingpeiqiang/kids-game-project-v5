# 📥 路线编辑器 - 导出 JSON 功能使用指南

## 🎯 功能概述

路线编辑器现已支持**导出当前绘制的路线为 JSON 文件**，方便保存、分享和导入到其他项目。

---

## 🚀 使用步骤

### 1. 进入路线编辑模式

```
开始界面 → 点击"✏️ 绘制路线"按钮
```

### 2. 绘制路线

- 在画布上滑动鼠标/手指绘制路线
- 龙会沿着你绘制的路线移动
- 可以在边框外绘制，让龙从画面外进入游戏区域

### 3. 导出 JSON 文件

绘制完成后，底部有 **4 个按钮**：

```
┌──────────┬──────────┬──────────┬──────────┐
│ 🗑️ 清除  │ 💾 保存  │ 📥 导出  │ ⬅️ 返回  │
└──────────┴──────────┴──────────┴──────────┘
```

点击 **"📥 导出"** 按钮即可下载 JSON 文件。

---

## 📄 导出的 JSON 文件格式

导出的 JSON 文件符合 `routes` 目录的标准格式：

```json
{
  "version": "1.0",
  "lastModified": "2026-05-01T12:00:00.000Z",
  "route": {
    "id": "route_1714550400000",
    "name": "自定义路线_2026/5/1",
    "points": [
      { "x": 180, "y": -200 },
      { "x": 185, "y": -195 },
      { "x": 190, "y": -190 },
      // ... 更多点
    ]
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `version` | string | 版本号（固定为 "1.0"） |
| `lastModified` | string | ISO 8601 格式的时间戳 |
| `route.id` | string | 唯一标识符（使用时间戳生成） |
| `route.name` | string | 路线名称（自动生成） |
| `route.points` | array | 路线点数组，每个点包含 x, y 坐标 |

---

## 💡 使用场景

### 场景1：备份自定义路线

```
1. 在游戏中绘制满意的路线
2. 点击"📥 导出"
3. 浏览器下载 JSON 文件
4. 保存到安全位置
```

**优点：**
- ✅ 防止丢失精心设计的路线
- ✅ 可以分享给朋友
- ✅ 便于版本管理

---

### 场景2：团队协作

```
开发者A:
1. 设计新关卡路线
2. 导出 JSON 文件
3. 发送给开发者B

开发者B:
1. 收到 JSON 文件
2. 放入 src/games/dragonShooter/routes/custom/
3. 运行 npm run sync-routes
4. 在游戏中测试
```

---

### 场景3：路线库建设

```
1. 设计多种类型的路线
   - 波浪型
   - Z字形
   - 螺旋型
   - BOSS战型
2. 分别导出为 JSON 文件
3. 建立路线库目录
4. 需要时快速导入使用
```

---

## 🔧 高级用法

### 1. 批量导出所有自定义路线

目前只能逐个导出。未来可以添加"批量导出"功能。

### 2. 手动编辑 JSON 文件

导出的 JSON 文件可以用文本编辑器打开并修改：

```bash
# 用 VS Code 打开
code route_1714550400000.json

# 修改路线名称
"route": {
  "name": "我的超级路线",  // ← 修改这里
  "points": [...]
}

# 调整坐标
"points": [
  { "x": 200, "y": -200 },  // ← 修改 X 坐标
  { "x": 180, "y": -180 },  // ← 修改 Y 坐标
]
```

### 3. 合并多个路线文件

可以手动合并多个 JSON 文件为一个大的路线包：

```json
{
  "version": "1.0",
  "lastModified": "2026-05-01T12:00:00.000Z",
  "routes": [
    { /* 路线1 */ },
    { /* 路线2 */ },
    { /* 路线3 */ }
  ]
}
```

---

## 📂 文件管理

### 推荐的目录结构

```
my-routes/                    # 我的路线库
├── wave_routes/             # 波浪型路线
│   ├── route_wave_01.json
│   ├── route_wave_02.json
│   └── route_wave_03.json
├── zigzag_routes/           # Z字形路线
│   ├── route_zigzag_01.json
│   └── route_zigzag_02.json
├── spiral_routes/           # 螺旋型路线
│   └── route_spiral_01.json
└── boss_routes/             # BOSS战路线
    └── route_boss_final.json
```

### 命名规范

```
✅ 推荐：
route_wave_easy_01.json      # 类型_难度_序号
route_boss_final.json        # 特殊用途
custom_my_design.json        # 自定义名称

❌ 避免：
1.json                       # 不清晰
route.JSON                   # 大小写不一致
my super route.json          # 空格可能导致问题
```

---

## 🔄 导入路线

### 方法1：手动放入目录

```bash
# 1. 将下载的 JSON 文件移动到 custom 目录
mv ~/Downloads/route_1714550400000.json \
   src/games/dragonShooter/routes/custom/

# 2. 同步到 public
npm run sync-routes

# 3. 刷新浏览器测试
```

### 方法2：使用游戏的导入功能

```
1. 点击"📤 导入"按钮（如果已实现）
2. 选择 JSON 文件
3. 自动加载到游戏中
```

---

## ❓ 常见问题

### Q1: 导出的文件在哪里？

**A:** 
- 浏览器会下载到默认下载目录
- 通常是 `~/Downloads` 或 `C:\Users\用户名\Downloads`
- 文件名类似：`route_1714550400000.json`

---

### Q2: 为什么导出失败？

**A:** 可能的原因：
- ❌ 没有绘制足够的点（至少需要 3 个点）
- ❌ 浏览器阻止了下载弹窗
- ❌ 磁盘空间不足

**解决方法：**
- ✅ 确保绘制了完整的路线
- ✅ 允许浏览器下载文件
- ✅ 清理磁盘空间

---

### Q3: 可以修改导出的 JSON 文件吗？

**A:** 
- ✅ 可以！JSON 是人类可读的格式
- ✅ 可以用任何文本编辑器修改
- ✅ 修改后可以直接使用

**注意：**
- 保持 JSON 格式正确
- 不要删除必要的字段
- 坐标值应该是数字

---

### Q4: 如何分享路线给他人？

**A:** 
1. 导出 JSON 文件
2. 通过以下方式分享：
   - 📧 邮件附件
   - 💬 聊天软件发送文件
   - ☁️ 云盘分享链接
   - 📦 GitHub Gist

---

### Q5: 导出的路线可以在其他游戏使用吗？

**A:** 
- ✅ 只要其他游戏使用相同的 JSON 格式
- ✅ 或者编写转换脚本适配不同格式
- ✅ 路线数据是通用的（只有坐标点）

---

## 🎨 最佳实践

### 1. 及时备份

每次设计出满意的路线后立即导出备份。

### 2. 详细命名

使用有意义的文件名，例如：
```
route_wave_beginner_01.json  # 波浪型_新手_第1条
route_boss_hard_final.json   # BOSS战_困难_最终版
```

### 3. 添加注释

在 JSON 文件中添加注释（虽然标准 JSON 不支持注释，但可以添加额外字段）：

```json
{
  "version": "1.0",
  "lastModified": "2026-05-01T12:00:00.000Z",
  "metadata": {
    "author": "张三",
    "difficulty": "easy",
    "description": "适合新手的简单波浪路线",
    "tags": ["beginner", "wave", "smooth"]
  },
  "route": {
    "id": "route_1714550400000",
    "name": "新手波浪",
    "points": [...]
  }
}
```

### 4. 版本管理

对于重要路线，保留多个版本：

```
route_boss_v1.json    # 初版
route_boss_v2.json    # 优化版
route_boss_final.json # 最终版
```

### 5. 分类存储

按类型、难度、用途分类存储路线文件。

---

## 🛠️ 技术细节

### 导出原理

```typescript
// 1. 获取当前绘制的路线点
const canvasPoints = routeEditor.getCurrentPoints()

// 2. 转换为游戏区域坐标
const points = canvasPoints.map(p => ({
  x: p.x - CANVAS_OFFSET_X,
  y: p.y - CANVAS_OFFSET_Y
}))

// 3. 创建 JSON 对象
const jsonData = {
  version: '1.0',
  lastModified: new Date().toISOString(),
  route: { id, name, points }
}

// 4. 转换为字符串
const jsonString = JSON.stringify(jsonData, null, 2)

// 5. 创建 Blob 并触发下载
const blob = new Blob([jsonString], { type: 'application/json' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = `${route.id}.json`
a.click()
```

### 坐标系统

- **画布坐标**：相对于整个 Canvas（640x800）
- **游戏坐标**：相对于游戏区域（360x640）
- **转换公式**：
  ```
  gameX = canvasX - CANVAS_OFFSET_X
  gameY = canvasY - CANVAS_OFFSET_Y
  ```

### 文件大小

- 每条路线约 50-150 KB（取决于点数）
- 1601 个点的路线约 125 KB
- JSON 格式化后会稍大一些

---

## 📚 相关文档

- [PUBLIC_ROUTES_GUIDE.md](./PUBLIC_ROUTES_GUIDE.md) - Public 目录方案完整指南
- [README_ONE_ROUTE_PER_FILE.md](../src/games/dragonShooter/README_ONE_ROUTE_PER_FILE.md) - 一个路线一个文件详细文档
- [ROUTE_PERSISTENCE_GUIDE.md](../src/games/dragonShooter/ROUTE_PERSISTENCE_GUIDE.md) - 路线持久化指南

---

## ✅ 总结

### 核心功能

✅ **一键导出** - 点击按钮即可下载 JSON  
✅ **标准格式** - 符合 routes 目录规范  
✅ **易于编辑** - 人类可读的 JSON 格式  
✅ **便于分享** - 小文件，易传输  

### 工作流程

```
绘制路线 → 点击导出 → 下载 JSON → 保存/分享/导入
```

### 下一步

- 🎨 尝试绘制不同类型的路线
- 📥 导出并备份你的作品
- 🤝 分享给朋友或团队
- 📚 建立自己的路线库

开始创作你的专属路线吧！🚀✨
