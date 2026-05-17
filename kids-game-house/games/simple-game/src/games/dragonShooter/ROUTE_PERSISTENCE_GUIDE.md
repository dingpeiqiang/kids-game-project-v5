# 📦 路线持久化到文件使用指南

## 📋 功能概述

实现了将关卡路线配置导出/导入为 JSON 文件的功能，方便：
- **版本控制**：将路线配置纳入 Git 管理
- **分享交流**：与其他开发者分享路线设计
- **备份恢复**：防止浏览器数据丢失
- **团队协作**：多人共同维护路线配置

---

## 🎯 使用方法

### 1. 导出路线到文件

#### 步骤：
1. 进入游戏开始界面
2. 点击 **"🎯 关卡管理"** 按钮
3. 在关卡管理界面底部，点击 **"📥 导出"** 按钮（蓝色）
4. 浏览器会自动下载 JSON 文件

#### 文件名格式：
```
dragon_routes_[时间戳].json
例如：dragon_routes_1714550400000.json
```

#### 文件内容示例：
```json
{
  "version": "1.0",
  "exportDate": "2026-05-01T12:00:00.000Z",
  "levelSpecificRoutes": {
    "1": {
      "id": "level_1_easy",
      "name": "第1关 - 简单波浪",
      "points": [
        { "x": 180, "y": -200 },
        { "x": 180, "y": -199 },
        ...
      ]
    },
    "3": { ... },
    "5": { ... },
    "10": { ... }
  },
  "customRoutes": [
    {
      "id": "my_custom_route_1",
      "name": "我的自定义路线",
      "points": [ ... ]
    }
  ],
  "totalLevels": 4,
  "totalCustomRoutes": 1
}
```

---

### 2. 从文件导入路线

#### 步骤：
1. 进入游戏开始界面
2. 点击 **"🎯 关卡管理"** 按钮
3. 在关卡管理界面底部，点击 **"📤 导入"** 按钮（橙色）
4. 选择之前导出的 JSON 文件
5. 系统自动加载并合并路线配置

#### 导入行为：
- ✅ **关卡专属路线**：直接覆盖现有配置
- ✅ **自定义路线**：追加到现有路线列表
- ✅ **同时保存**：自动保存到 localStorage

#### 控制台输出：
```
✅ 已导入 4 个关卡路线
✅ 已导入 1 条自定义路线
✅ 路线导入成功
```

---

### 3. 将路线嵌入代码

如果你想将路线直接写入代码（而不是使用 JSON 文件），可以：

#### 方法一：手动复制
1. 打开导出的 JSON 文件
2. 复制 `levelSpecificRoutes` 部分
3. 粘贴到 `index.ts` 中的 `LEVEL_SPECIFIC_ROUTES` 对象

#### 方法二：使用代码片段（开发中）
未来会添加"生成代码片段"功能，自动生成可直接嵌入的代码。

---

## 📁 文件存储位置建议

### 推荐目录结构：
```
kids-game-house/
└── games/
    └── simple-game/
        └── src/
            └── games/
                └── dragonShooter/
                    ├── index.ts              # 主文件
                    ├── routes/               # 新建：路线配置目录
                    │   ├── level_routes.json # 关卡专属路线
                    │   ├── custom_routes.json # 自定义路线
                    │   └── backup/           # 备份目录
                    │       ├── routes_2026-05-01.json
                    │       └── routes_2026-04-30.json
                    ├── README.md
                    └── LEVEL_MANAGER_GUIDE.md
```

### Git 配置：
在 `.gitignore` 中添加：
```gitignore
# 不忽略路线配置文件（需要版本控制）
!games/simple-game/src/games/dragonShooter/routes/*.json

# 但忽略备份文件
games/simple-game/src/games/dragonShooter/routes/backup/*
```

---

## 🔧 高级用法

### 1. 批量导出多个版本

你可以定期导出路线配置作为备份：

```bash
# 创建备份脚本 (backup-routes.sh)
#!/bin/bash
DATE=$(date +%Y-%m-%d)
cp dragon_routes_*.json routes/backup/routes_${DATE}.json
echo "✅ 备份完成: routes/backup/routes_${DATE}.json"
```

### 2. 合并多个路线文件

如果你有多个路线文件，可以手动合并：

```javascript
// merge-routes.js
const fs = require('fs')

const file1 = JSON.parse(fs.readFileSync('routes_v1.json', 'utf8'))
const file2 = JSON.parse(fs.readFileSync('routes_v2.json', 'utf8'))

// 合并关卡路线
const merged = {
  version: '1.0',
  exportDate: new Date().toISOString(),
  levelSpecificRoutes: {
    ...file1.levelSpecificRoutes,
    ...file2.levelSpecificRoutes
  },
  customRoutes: [
    ...file1.customRoutes,
    ...file2.customRoutes
  ]
}

fs.writeFileSync('merged_routes.json', JSON.stringify(merged, null, 2))
console.log('✅ 合并完成')
```

### 3. 验证路线文件

导入前可以验证文件格式：

```javascript
// validate-routes.js
const fs = require('fs')

const data = JSON.parse(fs.readFileSync('dragon_routes.json', 'utf8'))

// 检查必需字段
if (!data.version || !data.levelSpecificRoutes) {
  console.error('❌ 无效的文件格式')
  process.exit(1)
}

// 检查每个关卡的路线
Object.entries(data.levelSpecificRoutes).forEach(([level, route]) => {
  if (!route.id || !route.name || !route.points) {
    console.error(`❌ 第${level}关路线格式错误`)
    process.exit(1)
  }
  
  if (route.points.length < 1600) {
    console.warn(`⚠️  第${level}关路线点数不足: ${route.points.length}`)
  }
})

console.log('✅ 验证通过')
```

---

## 🔄 工作流程建议

### 个人开发流程：

1. **设计阶段**
   - 使用可视化编辑器绘制路线
   - 测试游戏效果
   - 调整直到满意

2. **保存阶段**
   - 点击"导出"按钮保存为 JSON 文件
   - 将文件移动到 `routes/` 目录
   - 提交到 Git

3. **分享阶段**
   - 推送代码到远程仓库
   - 团队成员拉取最新代码
   - 其他人导入你的路线文件

### 团队协作流程：

1. **分支管理**
   ```bash
   # 创建路线设计分支
   git checkout -b feature/new-level-routes
   
   # 设计新关卡路线
   # ... 在游戏中绘制和测试 ...
   
   # 导出路线
   # ... 点击导出按钮 ...
   
   # 提交
   git add routes/level_routes.json
   git commit -m "添加第7-9关路线配置"
   git push origin feature/new-level-routes
   ```

2. **代码审查**
   - 创建 Pull Request
   - 团队成员审查路线配置
   - 讨论优化建议

3. **合并上线**
   - 审查通过后合并到主分支
   - 部署新版本
   - 所有玩家可以使用新路线

---

## 📊 数据格式说明

### 完整数据结构：

```typescript
interface RouteExport {
  version: string              // 版本号，用于兼容性检查
  exportDate: string           // 导出时间（ISO 8601格式）
  levelSpecificRoutes: {       // 关卡专属路线
    [level: number]: {
      id: string               // 唯一标识
      name: string             // 显示名称
      points: RoutePoint[]     // 路线点数组
    }
  }
  customRoutes: CustomRoute[]  // 自定义路线列表
  totalLevels: number          // 关卡数量
  totalCustomRoutes: number    // 自定义路线数量
}

interface RoutePoint {
  x: number  // X坐标
  y: number  // Y坐标
}

interface CustomRoute {
  id: string
  name: string
  points: RoutePoint[]
}
```

### 关键字段说明：

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| version | string | 文件格式版本 | "1.0" |
| exportDate | string | 导出时间 | "2026-05-01T12:00:00.000Z" |
| levelSpecificRoutes | object | 关卡专属路线 | {1: {...}, 3: {...}} |
| customRoutes | array | 自定义路线列表 | [{...}, {...}] |
| points | array | 路线点数组 | [{x:180,y:-200}, ...] |

---

## ⚠️ 注意事项

### 1. 文件大小
- 每个关卡约 1600 个点
- 每个点约 30 字节（JSON格式）
- 单个关卡约 48KB
- 4个关卡约 200KB

**建议：**
- 定期清理不需要的路线
- 压缩后再分享（ZIP格式）
- 只导出必要的关卡

### 2. 兼容性
- 当前版本：1.0
- 未来可能增加新字段
- 旧版本文件仍可导入（忽略未知字段）

### 3. 数据安全
- JSON 文件包含完整路线数据
- 不要分享给不可信的人
- 敏感项目考虑加密

### 4. 浏览器限制
- 文件大小限制：通常 50MB
- 本地存储限制：通常 5-10MB
- 建议定期导出备份

---

## 🐛 常见问题

### Q1: 导出的文件在哪里？
**A:** 浏览器的默认下载目录，通常是：
- Windows: `C:\Users\[用户名]\Downloads`
- Mac: `/Users/[用户名]/Downloads`
- Linux: `/home/[用户名]/Downloads`

### Q2: 导入后没有看到新路线？
**A:** 检查以下几点：
1. 文件格式是否正确（必须是 JSON）
2. 是否刷新了页面
3. 查看控制台是否有错误信息
4. 确认导入的是正确的文件

### Q3: 可以修改导出的 JSON 文件吗？
**A:** 可以，但要注意：
- 保持 JSON 格式正确
- 不要删除必需字段
- 修改后重新导入测试
- 建议先备份原文件

### Q4: 如何恢复到之前的版本？
**A:** 
1. 找到之前的备份文件
2. 点击"导入"按钮
3. 选择备份文件
4. 刷新页面

### Q5: 可以在不同设备间同步吗？
**A:** 可以：
1. 在设备A导出路线文件
2. 通过邮件/云盘传输到设备B
3. 在设备B导入文件
4. 完成同步

---

## 🚀 未来计划

### Phase 1: 基础功能（已完成）✅
- [x] 导出路线到 JSON 文件
- [x] 从 JSON 文件导入路线
- [x] 隐藏的文件输入元素
- [x] 浮动提示反馈

### Phase 2: 增强功能（计划中）📋
- [ ] 生成代码片段功能
- [ ] 路线预览动画
- [ ] 批量导入/导出
- [ ] 路线压缩/解压

### Phase 3: 高级功能（规划中）💡
- [ ] 云端同步（可选）
- [ ] 路线市场（分享平台）
- [ ] 版本对比工具
- [ ] 自动备份机制

---

## 📞 技术支持

如果遇到问题：

1. **查看控制台日志**
   - 打开浏览器开发者工具（F12）
   - 查看 Console 标签
   - 寻找错误或警告信息

2. **检查文件格式**
   - 使用 JSON 验证工具
   - 确保没有语法错误
   - 检查必需字段是否存在

3. **联系开发者**
   - 提供错误信息
   - 附上问题文件（如果可能）
   - 说明操作步骤

---

## 🎉 总结

通过路线持久化到文件功能，你可以：

✅ **版本控制**：将路线配置纳入 Git 管理  
✅ **分享交流**：轻松与其他开发者分享  
✅ **备份恢复**：防止数据丢失  
✅ **团队协作**：多人共同维护  

**最佳实践：**
1. 定期导出备份
2. 使用有意义的文件名
3. 纳入版本控制系统
4. 与团队共享标准格式

祝你设计出精彩的关卡路线！🐉✨
