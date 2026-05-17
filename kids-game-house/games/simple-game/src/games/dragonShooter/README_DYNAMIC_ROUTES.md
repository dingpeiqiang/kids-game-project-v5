# 🔄 动态路线加载系统

## 📋 功能概述

游戏**基于 JSON 文件动态生成路线图**，无需编译，支持热更新和灵活配置。

---

## ✨ 核心特性

### 1. **运行时加载** ✅
- 游戏启动时自动从 JSON 文件加载路线
- 无需生成 TypeScript 代码
- 修改 JSON 后刷新即可生效

### 2. **热更新支持** ✅
- 可以在游戏中重新加载路线
- 无需重启游戏
- 适合快速迭代和测试

### 3. **灵活配置** ✅
- 可以轻松切换不同的路线包
- 支持多个路线文件
- 可以动态添加/删除路线

### 4. **降级处理** ✅
- 如果 JSON 文件不存在，使用默认路线
- 保证游戏始终可玩
- 友好的错误提示

---

## 📁 文件结构

```
dragonShooter/
├── index.ts                 # 主文件（使用 routeLoader）
├── routeLoader.ts           # 路线加载器（新增）
├── routes/                  # 路线文件目录
│   ├── level_routes.json   # 关卡专属路线
│   └── custom_routes.json  # 自定义路线
├── routeManager.ts          # Node.js 管理器（可选，用于开发工具）
└── saveRoutes.ts            # 保存脚本（可选，用于开发工具）
```

---

## 🚀 使用方法

### 步骤1：准备 JSON 文件

创建 `routes/level_routes.json`：

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
    "3": {
      "id": "level_3_zigzag",
      "name": "第3关 - Z字形",
      "points": [ ... ]
    }
  }
}
```

创建 `routes/custom_routes.json`：

```json
{
  "version": "1.0",
  "lastModified": "2026-05-01T12:00:00.000Z",
  "routes": [
    {
      "id": "my_custom_route_1",
      "name": "我的自定义路线",
      "points": [ ... ]
    }
  ]
}
```

### 步骤2：启动游戏

```bash
npm run dev
```

游戏会自动：
1. 加载 `routes/level_routes.json`
2. 加载 `routes/custom_routes.json`
3. 如果文件不存在，使用默认路线
4. 控制台显示加载统计信息

### 步骤3：修改路线

编辑 JSON 文件后，只需：
1. 保存文件
2. 刷新浏览器
3. 新路线立即生效

---

## 🔧 API 使用

### RouteLoader 类

```typescript
import { routeLoader } from './routeLoader'

// 加载路线（游戏启动时自动调用）
await routeLoader.loadRoutes()

// 获取关卡路线
const route = routeLoader.getLevelRoute(5)

// 获取所有关卡路线
const allLevelRoutes = routeLoader.getAllLevelRoutes()

// 获取自定义路线
const customRoutes = routeLoader.getCustomRoutes()

// 获取所有可用路线
const allRoutes = routeLoader.getAllRoutes()

// 重新加载路线（热更新）
await routeLoader.reload()

// 添加自定义路线（运行时）
routeLoader.addCustomRoute({
  id: 'new_route',
  name: '新路线',
  points: [ ... ]
})

// 删除自定义路线
routeLoader.removeCustomRoute('route_id')

// 获取可用关卡列表
const levels = routeLoader.getAvailableLevels()

// 获取统计信息
const stats = routeLoader.getStats()
console.log(stats)
// { levelCount: 4, customCount: 2, totalPoints: 8000 }
```

---

## 🎮 在游戏中的应用

### 1. 龙的路线分配

```typescript
function getRouteForDragon(dragonId: number, level: number): CustomRoute {
  // 1. 首先检查是否有该关卡的专属路线
  const levelRoute = routeLoader.getLevelRoute(level)
  if (levelRoute) {
    console.log(`🎯 使用第 ${level} 关专属路线: ${levelRoute.name}`)
    return levelRoute
  }
  
  // 2. 如果有自定义路线，随机选择一个
  const customRoutesList = routeLoader.getCustomRoutes()
  if (customRoutesList.length > 0) {
    return customRoutesList[dragonId % customRoutesList.length]
  }
  
  // 3. 否则使用预设路线
  return PRESET_ROUTES[dragonId % PRESET_ROUTES.length]
}
```

### 2. 关卡管理界面

```typescript
function drawLevelManager() {
  // 从 routeLoader 获取已配置的关卡
  const configuredLevels = routeLoader.getAvailableLevels()
  
  // 显示关卡列表
  configuredLevels.forEach((level, index) => {
    const route = routeLoader.getLevelRoute(level)
    ctx.fillText(`第${level}关: ${route.name}`, x, y)
  })
}
```

---

## 📊 JSON 文件格式

### level_routes.json

```json
{
  "version": "1.0",                    // 版本号
  "lastModified": "ISO 8601 时间",     // 最后修改时间
  "routes": {                          // 关卡路线对象
    "关卡号": {
      "id": "唯一标识",
      "name": "显示名称",
      "points": [                      // 路线点数组
        { "x": 数字, "y": 数字 },
        ...
      ]
    }
  }
}
```

### custom_routes.json

```json
{
  "version": "1.0",
  "lastModified": "ISO 8601 时间",
  "routes": [                          // 自定义路线数组
    {
      "id": "唯一标识",
      "name": "显示名称",
      "points": [
        { "x": 数字, "y": 数字 },
        ...
      ]
    }
  ]
}
```

---

## 💡 高级用法

### 1. 热更新路线

在游戏中添加重新加载按钮：

```typescript
// 在关卡管理界面添加"刷新"按钮
async function handleReloadRoutes() {
  console.log('🔄 重新加载路线...')
  await routeLoader.reload()
  
  const stats = routeLoader.getStats()
  console.log(`✅ 重新加载完成: ${stats.levelCount} 个关卡`)
  
  // 显示提示
  showFloatText('路线已刷新', '#4CAF50')
}
```

### 2. 动态添加路线

```typescript
// 从用户绘制的路线添加
function addUserDrawnRoute(name: string, points: RoutePoint[]) {
  const newRoute: CustomRoute = {
    id: `user_${Date.now()}`,
    name: name,
    points: points
  }
  
  routeLoader.addCustomRoute(newRoute)
  console.log(`✅ 已添加用户路线: ${name}`)
}
```

### 3. 路线包切换

```typescript
// 加载不同的路线包
async function loadRoutePack(packName: string) {
  const packUrl = `/games/dragonShooter/routes/packs/${packName}/level_routes.json`
  
  try {
    const response = await fetch(packUrl)
    const data = await response.json()
    
    // 替换当前路线
    Object.assign(LEVEL_SPECIFIC_ROUTES, data.routes)
    
    console.log(`✅ 已加载路线包: ${packName}`)
  } catch (error) {
    console.error(`❌ 加载路线包失败: ${packName}`, error)
  }
}
```

### 4. 路线验证

```typescript
// 验证路线数据
function validateRoute(route: CustomRoute): boolean {
  if (!route.id || !route.name || !route.points) {
    console.error('❌ 路线缺少必需字段')
    return false
  }
  
  if (route.points.length < 100) {
    console.warn('⚠️  路线点数过少:', route.points.length)
    return false
  }
  
  return true
}
```

---

## ⚙️ 配置 Vite

确保 Vite 可以访问 JSON 文件，在 `vite.config.ts` 中添加：

```typescript
export default defineConfig({
  // ... 其他配置
  
  server: {
    // 允许访问 routes 目录
    fs: {
      allow: ['..', './src/games/dragonShooter/routes']
    }
  }
})
```

---

## 🐛 常见问题

### Q1: 为什么路线没有加载？
**A:** 检查以下几点：
1. JSON 文件是否存在于正确位置
2. 文件格式是否正确（使用 JSON 验证工具）
3. 查看浏览器控制台的错误信息
4. 确认文件路径是否正确

### Q2: 如何调试加载问题？
**A:** 
```javascript
// 在控制台输入
console.log('加载状态:', routeLoader.isLoaded())
console.log('可用关卡:', routeLoader.getAvailableLevels())
console.log('统计信息:', routeLoader.getStats())
```

### Q3: 修改 JSON 后不生效？
**A:** 
1. 清除浏览器缓存（Ctrl+Shift+R）
2. 或者在 JSON URL 后添加时间戳：
   ```typescript
   fetch('/routes/level_routes.json?t=' + Date.now())
   ```

### Q4: 可以混合使用硬编码和 JSON 路线吗？
**A:** 可以，routeLoader 会优先使用 JSON 中的路线，如果没有则使用默认路线。

### Q5: 如何在生产环境使用？
**A:** 
1. 将 JSON 文件部署到服务器
2. 确保路径正确
3. 配置 CDN（可选）
4. 启用缓存以提高性能

---

## 🚀 性能优化

### 1. 懒加载
只加载当前需要的关卡路线：

```typescript
async function loadLevelRoute(level: number) {
  const url = `/games/dragonShooter/routes/levels/level_${level}.json`
  const response = await fetch(url)
  return await response.json()
}
```

### 2. 缓存
使用浏览器缓存减少重复加载：

```typescript
const cache = new Map<number, CustomRoute>()

async function getCachedRoute(level: number) {
  if (cache.has(level)) {
    return cache.get(level)
  }
  
  const route = await loadLevelRoute(level)
  cache.set(level, route)
  return route
}
```

### 3. 压缩
对大型路线文件进行压缩：

```bash
# 使用 gzip 压缩
gzip routes/level_routes.json
```

---

## 📝 开发工作流

### 设计路线
1. 在游戏中使用路线编辑器绘制
2. 点击"保存"下载 JSON
3. 将文件放入 `routes/inbox/`

### 处理文件
4. 运行 `npm run save-routes`
5. 脚本自动生成 JSON 文件到 `routes/`

### 测试路线
6. 刷新浏览器
7. 进入对应关卡测试
8. 如果不满意，返回步骤1

### 提交代码
9. 将 `routes/*.json` 添加到 Git
10. 提交并推送

---

## 🎉 总结

通过动态路线加载系统，你可以：

✅ **无需编译**：直接读取 JSON 文件  
✅ **热更新**：修改后立即生效  
✅ **灵活配置**：轻松切换路线包  
✅ **简化流程**：不需要生成代码  

**最佳实践：**
1. 保持 JSON 文件格式正确
2. 定期备份路线文件
3. 使用版本控制管理路线
4. 在生产环境启用缓存

祝你设计出精彩的关卡路线！🐉✨
