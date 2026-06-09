# 🎯 关卡管理系统使用指南

## 📋 功能概述

将原来的"预设路线选择"升级为**关卡管理系统**，支持为每个关卡独立配置和管理专属路线。

---

## ✨ 新功能特性

### 1. **关卡专属路线配置**
- 每个关卡可以配置独立的路线
- 支持多种路线类型（波浪、Z字形、螺旋、BOSS）
- 优先级：关卡专属 > 自定义路线 > 预设路线

### 2. **可视化管理界面**
- 清晰展示已配置的关卡列表
- 显示关卡号、路线名称、路线类型
- 支持编辑和添加新关卡

### 3. **智能路线分配**
- 游戏自动根据关卡号匹配对应路线
- 未配置的关卡使用默认路线
- 控制台实时显示使用的路线信息

---

## 🚀 快速开始

### 进入关卡管理界面

1. 启动游戏
2. 在开始界面点击 **"🎯 关卡管理"** 按钮
3. 进入关卡管理界面

### 查看已配置的关卡

当前已预配置的关卡：

| 关卡 | 路线类型 | 难度 | 特点 |
|------|---------|------|------|
| 第1关 | 波浪 | ⭐ | 简单平滑，适合新手 |
| 第3关 | Z字形 | ⭐⭐⭐ | 左右急转，考验反应 |
| 第5关 | 螺旋 | ⭐⭐⭐⭐ | 旋转下降，视觉冲击 |
| 第10关 | BOSS | ⭐⭐⭐⭐⭐ | 复杂曲线，终极挑战 |

---

## 🎮 界面操作说明

### 关卡列表区域

每个关卡条目包含：
- **关卡号**：金色大字显示（如"第5关"）
- **路线名称**：白色文字显示完整名称
- **路线类型标签**：彩色标签显示类型
  - 🔵 波浪（蓝色）
  - 🔴 Z字形（红色）
  - 🟠 螺旋（橙色）
  - 🟡 BOSS（金色）
  - 🟢 自定义（绿色）
- **编辑按钮**：右侧黄色按钮 ✏️

### 底部按钮

- **➕ 添加**：添加新关卡配置（开发中）
- **⬅️ 返回**：返回开始界面

### 交互操作

1. **点击关卡条目**
   - 显示该关卡的路线详情
   - 浮动文字提示路线名称

2. **点击编辑按钮**
   - 打开该关卡的路线编辑器（开发中）
   - 可以为该关卡绘制新路线

3. **点击添加按钮**
   - 弹出对话框输入关卡号（开发中）
   - 为新关卡配置路线

---

## 💻 代码配置方法

### 位置
文件：`games/simple-game/src/games/dragonShooter/index.ts`  
行号：约 461-560 行

### 配置语法

```typescript
const LEVEL_SPECIFIC_ROUTES: Record<number, CustomRoute> = {
  // 关卡号: {
  //   id: '唯一标识',
  //   name: '显示名称',
  //   points: 路线点数组
  // }
}
```

### 添加新关卡示例

#### 方法一：使用内置生成器

```typescript
// 为第7关添加Z字形路线
7: {
  id: 'level_7_zigzag',
  name: '第7关 - Z字挑战',
  points: generateLevelRoute(7, 'zigzag')
}
```

支持的类型：
- `'wave'` - 波浪路线
- `'zigzag'` - Z字形路线
- `'spiral'` - 螺旋路线
- `'boss'` - BOSS路线

#### 方法二：完全自定义

```typescript
// 为第8关添加完全自定义的路线
8: {
  id: 'level_8_custom',
  name: '第8关 - 我的设计',
  points: [
    { x: 180, y: -200 },  // 起点（画面外上方）
    { x: 180, y: 0 },     // 进入画面
    { x: 250, y: 100 },   // 向右移动
    { x: 100, y: 200 },   // 向左移动
    { x: 180, y: 300 },   // 回到中间
    { x: 180, y: 640 },   // 到达底部
    { x: 180, y: 840 }    // 终点（画面外下方）
    // ... 需要至少1600个点
  ]
}
```

---

## 🛠️ 高级功能（开发中）

### 1. 可视化编辑关卡路线

**计划功能：**
- 点击关卡的编辑按钮
- 进入路线编辑模式
- 为该关卡绘制专属路线
- 保存后自动关联到该关卡

**实现思路：**
```typescript
// 伪代码
function editLevelRoute(level: number) {
  state.phase = 'routeEdit'
  state.editingLevel = level  // 记录正在编辑的关卡
  
  // 加载该关卡的现有路线（如果有）
  const existingRoute = LEVEL_SPECIFIC_ROUTES[level]
  if (existingRoute) {
    routeEditor.loadRoute(existingRoute.points)
  }
}

// 保存时
function saveLevelRoute(level: number, points: RoutePoint[]) {
  LEVEL_SPECIFIC_ROUTES[level] = {
    id: `level_${level}_custom`,
    name: `第${level}关 - 自定义路线`,
    points: points
  }
  saveCustomRoutes()  // 持久化保存
}
```

### 2. 添加新关卡向导

**计划功能：**
- 点击"添加"按钮
- 弹出对话框输入关卡号
- 选择路线类型或绘制新路线
- 确认添加到配置

**实现思路：**
```typescript
// 伪代码
function addNewLevel() {
  const level = prompt('请输入关卡号：')
  if (!level || isNaN(level)) return
  
  const type = confirm('使用预设类型？\n确定=波浪，取消=自定义')
    ? 'wave' 
    : 'custom'
  
  if (type === 'wave') {
    LEVEL_SPECIFIC_ROUTES[level] = {
      id: `level_${level}_wave`,
      name: `第${level}关 - 波浪路线`,
      points: generateLevelRoute(level, 'wave')
    }
  } else {
    // 进入编辑模式
    editLevelRoute(level)
  }
}
```

### 3. 路线预览功能

**计划功能：**
- 点击关卡条目
- 在小窗口中预览路线动画
- 看到龙沿该路线移动的效果

---

## 📊 技术实现细节

### 路线优先级系统

```typescript
function getRouteForDragon(dragonId: number, level: number): CustomRoute {
  // 1. 首先检查是否有该关卡的专属路线
  const levelRoute = LEVEL_SPECIFIC_ROUTES[level]
  if (levelRoute) {
    console.log(`🎯 使用第 ${level} 关专属路线`)
    return levelRoute
  }
  
  // 2. 如果有自定义路线，随机选择一个
  if (customRoutes.length > 0) {
    return customRoutes[dragonId % customRoutes.length]
  }
  
  // 3. 否则使用预设路线
  return PRESET_ROUTES[dragonId % PRESET_ROUTES.length]
}
```

### 关卡路线生成器

```typescript
function generateLevelRoute(level: number, type: string): RoutePoint[] {
  const points: RoutePoint[] = []
  const totalPoints = 1600  // 固定1600点确保足够长
  
  switch (type) {
    case 'wave':
      // 简单波浪：振幅小，频率低
      for (let i = 0; i <= totalPoints; i++) {
        const progress = i / totalPoints
        points.push({
          x: CENTER_X + Math.sin(progress * Math.PI * 4) * 40,
          y: -200 + progress * (BASE_H + 400)
        })
      }
      break
      
    case 'zigzag':
      // Z字形：左右快速切换
      for (let i = 0; i <= totalPoints; i++) {
        const progress = i / totalPoints
        const zigzag = Math.sin(progress * Math.PI * 12) > 0 ? 1 : -1
        points.push({
          x: CENTER_X + zigzag * 80,
          y: -200 + progress * (BASE_H + 400)
        })
      }
      break
      
    case 'spiral':
      // 螺旋：旋转下降
      for (let i = 0; i <= totalPoints; i++) {
        const progress = i / totalPoints
        const radius = 60 + progress * 30
        points.push({
          x: CENTER_X + Math.cos(progress * Math.PI * 16) * radius,
          y: -200 + progress * (BASE_H + 400)
        })
      }
      break
      
    case 'boss':
      // BOSS路线：复杂曲线
      for (let i = 0; i <= totalPoints; i++) {
        const progress = i / totalPoints
        const wave1 = Math.sin(progress * Math.PI * 6) * 50
        const wave2 = Math.cos(progress * Math.PI * 10) * 30
        points.push({
          x: CENTER_X + wave1 + wave2,
          y: -200 + progress * (BASE_H + 400)
        })
      }
      break
  }
  
  return points
}
```

---

## 🔍 调试技巧

### 1. 查看当前使用的路线

在游戏运行时，打开浏览器控制台（F12），会看到日志：
```
🎯 使用第 5 关专属路线
```

### 2. 查看所有已配置的关卡

在控制台输入：
```javascript
console.table(Object.keys(LEVEL_SPECIFIC_ROUTES).map(Number).sort((a, b) => a - b))
```

### 3. 测试特定关卡

修改代码临时设置关卡号：
```typescript
state.level = 7  // 强制设置为第7关测试
```

### 4. 清除所有关卡配置

在控制台输入：
```javascript
LEVEL_SPECIFIC_ROUTES = {}
```

---

## 📝 最佳实践

### ✅ 推荐做法

1. **为关键关卡配置专属路线**
   - 第1关：简单入门
   - 第5/10/15关：BOSS关卡
   - 其他关卡可使用默认路线

2. **路线命名规范**
   ```typescript
   name: '第X关 - 描述性名称'
   // 例如：'第5关 - 螺旋挑战'
   ```

3. **ID命名规范**
   ```typescript
   id: 'level_X_type'
   // 例如：'level_5_spiral'
   ```

4. **保持1600个点**
   - 确保路线足够长
   - 龙能完整显示在画面中

### ❌ 避免的做法

1. **不要为所有关卡都配置路线**
   - 只配置关键关卡
   - 其他关卡使用默认即可

2. **不要使用过短的路线**
   - 少于500点会导致龙很快消失

3. **不要让X轴偏移过大**
   - 超过150像素会让龙飞出屏幕

---

## 🎯 未来扩展计划

### Phase 1: 基础功能（已完成）✅
- [x] 关卡管理界面
- [x] 显示已配置的关卡
- [x] 关卡专属路线配置
- [x] 路线类型标签

### Phase 2: 编辑功能（开发中）🚧
- [ ] 点击编辑按钮进入路线编辑器
- [ ] 为特定关卡绘制路线
- [ ] 保存后自动关联关卡

### Phase 3: 添加功能（计划中）📋
- [ ] 添加新关卡向导
- [ ] 输入关卡号
- [ ] 选择或绘制路线

### Phase 4: 高级功能（规划中）💡
- [ ] 路线预览动画
- [ ] 批量导入/导出配置
- [ ] 分享关卡配置
- [ ] 关卡难度评分

---

## 📞 常见问题

### Q1: 为什么我配置的关卡没有生效？
**A:** 检查以下几点：
1. 关卡号是否正确（数字类型）
2. 是否在 `LEVEL_SPECIFIC_ROUTES` 对象中
3. 路线是否有至少1600个点
4. 刷新游戏页面

### Q2: 如何让多个关卡使用同一种路线类型？
**A:** 可以使用循环批量配置：
```typescript
for (let i = 2; i <= 4; i++) {
  LEVEL_SPECIFIC_ROUTES[i] = {
    id: `level_${i}_wave`,
    name: `第${i}关 - 波浪练习`,
    points: generateLevelRoute(i, 'wave')
  }
}
```

### Q3: 可以删除某个关卡的配置吗？
**A:** 可以，使用 delete 关键字：
```typescript
delete LEVEL_SPECIFIC_ROUTES[5]  // 删除第5关的配置
```

### Q4: 如何备份我的关卡配置？
**A:** 复制 `LEVEL_SPECIFIC_ROUTES` 的代码保存到文本文件，或者导出为JSON：
```javascript
JSON.stringify(LEVEL_SPECIFIC_ROUTES, null, 2)
```

---

## 🎉 总结

关卡管理系统让你能够：

1. **精确控制**每个关卡的龙的移动路线
2. **可视化管理**所有已配置的关卡
3. **灵活配置**不同类型的路线
4. **逐步扩展**更多高级功能

**建议工作流程：**
1. 先用代码配置关键关卡（BOSS关等）
2. 测试游戏效果
3. 根据需要调整路线参数
4. 未来可使用可视化编辑器优化

祝你设计出精彩的关卡路线！🐉✨
