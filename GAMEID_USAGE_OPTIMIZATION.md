# gameId 与 gameCode 字段使用优化

## 📋 问题背景

在 GTRS主题编辑器的发布逻辑中，之前同时使用了 `gameId` 和 `gameCode` 两个字段，但存在以下混淆：

1. **路由参数**：`routeGameId` - 数据库主键（Long 类型）
2. **前端表单**：`themeInfo.gameId` - 格式为 `game_xxx_yyy` 的字符串
3. **后端接口**：同时接收 `ownerId` 和 `gameCode` 两个字段

### 原有问题

```typescript
// ❌ 旧逻辑：没有明确区分两个字段的用途
const rawGameId = themeData.value.themeInfo.gameId  // "game_snake_v3"
const gameCode = rawGameId.replace(/^game_/, '').toUpperCase().replace(/-/g, '_')  // "SNAKE_VUE3"
const ownerId = routeGameId || null  // 数据库主键

uploadData: {
  gameCode: gameCode,   // 作用不明确
  ownerId: ownerId      // 作用不明确
}
```

---

## ✅ 优化方案

### 字段职责明确化

| 字段 | 来源 | 用途 | 必要性 |
|------|------|------|--------|
| **ownerId** | 路由参数 `routeGameId` | **数据库关联游戏**（外键） | ⭐⭐⭐ 必需 |
| **gameCode** | 从 `themeInfo.gameId` 转换 | **资源加载标识符**（文件系统路径） | ⭐⭐ 辅助 |

### 核心原则

**如果已传递 `gameId`（数据库主键），则 `gameCode` 仅作为资源加载的标识符，不再用于业务逻辑查询。**

---

## 🔧 实现细节

### 1. 路由参数传递

#### DIY 模式
```typescript
router.push({
  path: '/creator-center/gtrs-editor',
  query: {
    themeId: '123',     // 原主题 ID（用于加载模板）
    gameId: '1'         // 数据库主键（用于新主题的 ownerId）
  }
})
```

#### 编辑模式
```typescript
router.push({
  path: '/creator-center/gtrs-editor',
  query: {
    themeId: '123',     // 原主题 ID
    gameId: '1',        // 数据库主键
    mode: 'edit'        // 标记为编辑模式
  }
})
```

### 2. 发布逻辑优化

```typescript
// ⭐ 直接使用路由传入的 gameId 作为 ownerId
const ownerId = routeGameId || null

// ⭐ gameCode 从 themeData 中提取（仅用于资源加载标识）
const rawGameId = themeData.value.themeInfo.gameId  // 如 "game_snake_v3"
const gameCode = rawGameId
  ? rawGameId.replace(/^game_/, '').toUpperCase().replace(/-/g, '_')
  : null  // "game_snake_v3" → "SNAKE_VUE3"

// ⭐ 构建上传数据
const uploadData = {
  name: themeData.value.themeInfo.themeName,
  authorName: currentAuthorName,
  price: publishData?.price ?? 0,
  description: publishData?.description || '',
  thumbnail: '',
  config: themeData.value,       // 完整的 GTRS主题数据
  ownerType: 'GAME',
  gameCode: gameCode,            // ⭐ 仅用于资源加载标识
  ownerId: ownerId,              // ⭐ 数据库主键，用于关联游戏（优先级最高）
  status: 'pending'
}
```

### 3. 后端处理逻辑

后端接收到数据后：

```java
// ThemeUploadDTO.java
public class ThemeUploadDTO {
    private Long ownerId;        // ⭐ 数据库主键（优先使用此字段）
    private String gameCode;     // ⭐ 资源加载标识符（辅助字段）
    
    // ... 其他字段
}

// ThemeService.java
public Theme createTheme(ThemeUploadDTO dto) {
    Game game = null;
    
    // ⭐ 优先级：ownerId > gameCode
    if (dto.getOwnerId() != null) {
        // 直接通过数据库主键查询游戏
        game = gameRepository.findById(dto.getOwnerId());
    } else if (dto.getGameCode() != null) {
        // 降级：通过 gameCode 查询
        game = gameRepository.findByGameCode(dto.getGameCode());
    }
    
    if (game == null) {
        throw new IllegalArgumentException("未找到对应的游戏");
    }
    
    // ... 创建主题逻辑
}
```

---

## 🎯 优势对比

### 优化前
```typescript
console.log('发布主题:', {
  gameCode: 'SNAKE_VUE3',
  ownerId: 1,
  // ❌ 不清楚哪个字段是主要的
})
```

### 优化后
```typescript
console.log('发布主题:', {
  gameCode: 'SNAKE_VUE3',      // ⭐ 注释：仅用于资源加载标识
  ownerId: 1,                  // ⭐ 注释：数据库主键，用于关联游戏（优先级最高）
  routeGameId: 1,              // ⭐ 显示路由传入的值
  isEditMode: false,           // ⭐ 显示当前模式
  hasRouteThemeId: true        // ⭐ 显示是否有原主题
})
```

---

## 📝 工作流程

### DIY 流程完整链路

```
1. 用户在创作者中心点击"✨ DIY"按钮
   ↓
2. handleDIYTheme(theme) 跳转时携带：
   - query.themeId = 原主题 ID（加载模板）
   - query.gameId = 数据库主键（新主题的 ownerId）
   ↓
3. GTRSThemeCreatorV2 读取参数：
   - routeThemeId = 原主题 ID
   - routeGameId = 数据库主键
   - isEditMode = false（DIY 模式）
   ↓
4. 用户编辑主题，填写基本信息：
   - themeInfo.gameId = "game_snake_v3"（前端格式）
   ↓
5. 发布主题时：
   - ownerId = routeGameId（数据库主键，优先级最高）
   - gameCode = "SNAKE_VUE3"（仅用于资源加载）
   ↓
6. 后端接收后：
   - 优先使用 ownerId 查询游戏（精确匹配）
   - 使用 gameCode 验证资源路径（辅助校验）
```

### 编辑模式完整链路

```
1. 用户在创作者中心点击"✏️ 修改"按钮
   ↓
2. handleEdit(theme) 跳转时携带：
   - query.themeId = 原主题 ID
   - query.gameId = 数据库主键
   - query.mode = 'edit'
   ↓
3. GTRSThemeCreatorV2 读取参数：
   - routeThemeId = 原主题 ID
   - routeGameId = 数据库主键
   - isEditMode = true（编辑模式）
   ↓
4. 用户编辑主题（不可修改主题 ID 和游戏）
   ↓
5. 发布主题时：
   - ownerId = routeGameId（保持原游戏关联）
   - gameCode = "SNAKE_VUE3"（保持原资源路径）
   ↓
6. 后端接收后：
   - 更新原主题配置
   - 保持 ownerId 不变
```

---

## 🔍 验证方法

### 浏览器控制台检查

打开 GTRS 编辑器页面，在控制台执行：

```javascript
// DIY 模式应该看到：
this.$route.query
// { themeId: "123", gameId: "1" }

// 编辑模式应该看到：
this.$route.query
// { themeId: "123", gameId: "1", mode: "edit" }
```

### 发布时日志检查

发布主题时，控制台会输出详细日志：

```javascript
发布主题：{
  name: "清新绿主题",
  authorName: "张三",
  gameCode: "SNAKE_VUE3",      // ⭐ 仅用于资源加载
  ownerId: 1,                  // ⭐ 数据库主键
  routeGameId: 1,              // ⭐ 路由传入的值
  isEditMode: false,           // ⭐ 是否为编辑模式
  hasRouteThemeId: true,       // ⭐ 是否有原主题
  config: "...(省略 GTRS 数据)"
}
```

---

## 📁 修改文件清单

1. **GTRSThemeCreatorV2.vue**
   - 优化 `publishTheme` 函数的注释和日志
   - 明确 `ownerId` 和 `gameCode` 的职责
   - 增加调试信息输出

2. **BasicInfoPanel.vue**（之前已优化）
   - 游戏选择器存储 `dbGameId`（数据库主键）
   - 降级策略：`gameName || name || gameCode || '未知游戏'`

---

## ✅ 总结

### 核心改进
- ✅ **明确字段职责**：`ownerId` 用于数据库关联，`gameCode` 用于资源加载
- ✅ **简化查询逻辑**：后端优先使用 `ownerId`，避免多次查询
- ✅ **增强调试能力**：详细的日志输出，便于排查问题
- ✅ **提升代码可读性**：清晰的注释说明每个字段的用途

### 遵循原则
**如果已传递 `gameId`（数据库主键），就不需要再通过 `gameCode` 进行业务查询。**

---

**完成时间**：2026-03-22  
**优化目标**：明确 gameId 与 gameCode 的职责分工，减少冗余查询
