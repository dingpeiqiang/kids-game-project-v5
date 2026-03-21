# /api/theme/my-available-themes 优先级规则实现

## 📋 问题描述

`/api/theme/my-available-themes` 接口返回的主题列表中，**没有标记哪个主题是用户当前使用的主题**。

### 优先级规则回顾

| 优先级 | 来源 | 说明 |
|--------|------|------|
| **⭐⭐⭐ 最高** | `user_theme_preference` 表 | 用户个人偏好设置 |
| **⭐ 最低** | `theme_info.is_default` | 系统默认主题 |

### 问题影响

前端在显示主题列表时，**无法知道哪个主题是用户当前正在使用的**，导致：
- ❌ 无法正确显示"✓ 已使用"标识
- ❌ 用户体验不清晰
- ❌ 可能导致重复点击"使用"按钮

## ✅ 解决方案

### 修改内容

在 `/api/theme/my-available-themes` 接口返回的主题列表中，为每个主题添加 **`isCurrent`** 字段。

#### 新增字段说明

```json
{
  "themeId": 5,
  "themeName": "活力橙",
  "authorName": "官方团队",
  "price": 0,
  "status": "on_sale",
  // ⭐ 新增字段
  "isCurrent": true,  // 表示这是用户当前使用的主题
  // ... 其他字段
}
```

### 实现逻辑

```java
// 1. 查询用户当前使用的主题 ID（从 user_theme_preference 表）
Long currentThemeId = null;
try {
    UserThemePreference preference = userThemePreferenceMapper.selectUserCurrentTheme(
        userId, ownerType, ownerId);
    if (preference != null) {
        currentThemeId = preference.getThemeId();
    }
} catch (Exception e) {
    log.warn("获取用户主题偏好失败，不影响主题列表返回", e);
}

// 2. 为每个主题标记 isCurrent
for (ThemeInfo theme : themes) {
    Map<String, Object> themeMap = ...;
    
    // ⭐ 标记是否为用户当前使用的主题（优先级最高）
    Boolean isCurrent = (currentThemeId != null && theme.getThemeId().equals(currentThemeId));
    themeMap.put("isCurrent", isCurrent != null ? isCurrent : false);
}
```

## 📊 完整流程

### 修改前

```
GET /api/theme/my-available-themes?ownerType=GAME&ownerId=665
  ↓
查询 theme_info 表
  ↓
返回主题列表 [
  {themeId: 1, themeName: "清新绿", is_default: 1},
  {themeId: 2, themeName: "活力橙", is_default: 0},
  {themeId: 3, themeName: "暗黑风", is_default: 0}
]
  ↓
❌ 前端不知道哪个是用户当前使用的主题
```

### 修改后

```
GET /api/theme/my-available-themes?ownerType=GAME&ownerId=665
  ↓
1. 查询 theme_info 表
2. 查询 user_theme_preference 表 ⭐
  ↓
返回主题列表 [
  {themeId: 1, themeName: "清新绿", isCurrent: false},
  {themeId: 2, themeName: "活力橙", isCurrent: true},  ⭐ 标记了
  {themeId: 3, themeName: "暗黑风", isCurrent: false}
]
  ↓
✅ 前端可以正确显示"✓ 已使用"标识
```

## 🎯 实际场景示例

### 场景 1：用户设置了个人偏好

**数据库状态：**
```sql
-- theme_info 表
theme_id | theme_name | is_default
---------|------------|-----------
    1    |   清新绿    |     1
    2    |   活力橙    |     0
    3    |   暗黑风    |     0

-- user_theme_preference 表
user_id | owner_type | owner_id | theme_id
--------|------------|----------|----------
   31   |   GAME     |   665    |    2
```

**API 请求：**
```http
GET /api/theme/my-available-themes?ownerType=GAME&ownerId=665
```

**API 响应：**
```json
{
  "list": [
    {
      "themeId": 1,
      "themeName": "清新绿",
      "isDefault": true,
      "isCurrent": false  ← 虽然不是默认，但用户没用它
    },
    {
      "themeId": 2,
      "themeName": "活力橙",
      "isDefault": false,
      "isCurrent": true  ← ⭐ 用户当前使用的主题
    },
    {
      "themeId": 3,
      "themeName": "暗黑风",
      "isDefault": false,
      "isCurrent": false
    }
  ],
  "total": 3
}
```

### 场景 2：用户未设置个人偏好

**数据库状态：**
```sql
-- theme_info 表
theme_id | theme_name | is_default
---------|------------|-----------
    1    |   清新绿    |     1
    2    |   活力橙    |     0

-- user_theme_preference 表
(无记录)
```

**API 响应：**
```json
{
  "list": [
    {
      "themeId": 1,
      "themeName": "清新绿",
      "isDefault": true,
      "isCurrent": false  ← 虽然是默认主题，但用户还没明确选择
    },
    {
      "themeId": 2,
      "themeName": "活力橙",
      "isDefault": false,
      "isCurrent": false
    }
  ],
  "total": 2
}
```

**说明：**
- `isCurrent: false` 表示用户还没有明确选择使用哪个主题
- 前端可以根据 `isDefault: true` 显示默认推荐

## 💡 前端使用建议

### 主题卡片显示逻辑

```vue
<div class="theme-card" v-for="theme in themes" :key="theme.themeId">
  <!-- 主题名称 -->
  <h3>{{ theme.themeName }}</h3>
  
  <!-- 状态标识 -->
  <div class="status-badge">
    <!-- ⭐ 优先显示 isCurrent -->
    <span v-if="theme.isCurrent" class="badge-used">
      ✓ 已使用
    </span>
    
    <!-- 其次显示 isDefault -->
    <span v-else-if="theme.isDefault" class="badge-default">
      默认推荐
    </span>
  </div>
  
  <!-- 操作按钮 -->
  <div class="actions">
    <button 
      v-if="!theme.isCurrent" 
      @click="useTheme(theme)"
    >
      使用
    </button>
    <button 
      v-else 
      disabled
    >
      已使用
    </button>
  </div>
</div>
```

### 优先级判断逻辑

```typescript
// 主题状态优先级判断
function getThemeStatus(theme: ThemeInfo): 'used' | 'default' | 'normal' {
  // ⭐⭐⭐ 最高优先级：用户当前使用的
  if (theme.isCurrent) {
    return 'used';
  }
  
  // ⭐ 次优先级：系统默认的
  if (theme.isDefault) {
    return 'default';
  }
  
  // 普通主题
  return 'normal';
}
```

## 🔍 代码修改详情

### 修改文件

- ✅ `kids-game-backend/kids-game-service/src/main/java/com/kidgame/service/impl/ThemeServiceImpl.java`
  - 方法：`getMyAvailableThemesWithPage()`
  - 行号：第 654-716 行

### 关键改动

#### 1. 查询用户当前主题（新增）
```java
// ⭐ 3. 获取用户当前使用的主题 ID（用于标记 isCurrent）
Long currentThemeId = null;
try {
    UserThemePreference preference = userThemePreferenceMapper.selectUserCurrentTheme(
        userId, ownerType, ownerId);
    if (preference != null) {
        currentThemeId = preference.getThemeId();
        log.info("用户当前主题偏好 - userId: {}, ownerType: {}, ownerId: {}, themeId: {}", 
                userId, ownerType, ownerId, currentThemeId);
    }
} catch (Exception e) {
    log.warn("获取用户主题偏好失败，不影响主题列表返回", e);
}
```

#### 2. 标记 isCurrent 字段（新增）
```java
// ⭐ 标记是否为用户当前使用的主题（优先级最高）
Boolean isCurrent = (currentThemeId != null && theme.getThemeId().equals(currentThemeId));
themeMap.put("isCurrent", isCurrent != null ? isCurrent : false);
```

### 性能优化

#### 查询次数
- **修改前**：1 次查询（只查 theme_info）
- **修改后**：2 次查询（theme_info + user_theme_preference）

#### 性能影响
- ✅ **影响很小** - user_theme_preference 表有索引，查询非常快
- ✅ **值得的代价** - 提升了用户体验

#### 索引保证
```sql
-- user_theme_preference 表已有索引
CREATE UNIQUE INDEX idx_user_owner 
ON user_theme_preference(user_id, owner_type, owner_id);
```

## 🧪 测试验证

### 测试步骤

1. **准备数据**
   ```sql
   -- 确保有用户偏好记录
   INSERT INTO user_theme_preference 
   (user_id, owner_type, owner_id, theme_id, is_active)
   VALUES (31, 'GAME', 665, 2, 1)
   ON DUPLICATE KEY UPDATE theme_id = 2;
   ```

2. **调用 API**
   ```bash
   GET http://localhost:8080/api/theme/my-available-themes?ownerType=GAME&ownerId=665&source=all&page=1&pageSize=20
   ```

3. **检查响应**
   ```json
   {
     "list": [
       {"themeId": 2, "themeName": "活力橙", "isCurrent": true},  ← 应该标记为 true
       ...
     ]
   }
   ```

### 预期结果

- ✅ 用户当前使用的主题（来自 user_theme_preference）标记为 `isCurrent: true`
- ✅ 其他主题标记为 `isCurrent: false`
- ✅ 即使 `isDefault: true`，如果不是用户选择的，也应该是 `isCurrent: false`

## 📋 总结

### 核心改进

- ✅ **新增了 isCurrent 字段** - 标记用户当前使用的主题
- ✅ **体现了优先级规则** - user_theme_preference > theme_info.is_default
- ✅ **提升了用户体验** - 前端可以正确显示使用状态

### 优先级规则（最终版）

| 判断依据 | 字段 | 优先级 | 说明 |
|----------|------|--------|------|
| **用户选择** | `isCurrent: true` | ⭐⭐⭐ 最高 | 来自 user_theme_preference |
| **系统默认** | `isDefault: true` | ⭐ 最低 | 来自 theme_info.is_default |

### 前端显示建议

```
if (theme.isCurrent) {
  显示 "✓ 已使用"
  禁用"使用"按钮
} else if (theme.isDefault) {
  显示 "默认推荐"
  启用"使用"按钮
} else {
  正常显示
  启用"使用"按钮
}
```

## 完成时间
2026-03-22
