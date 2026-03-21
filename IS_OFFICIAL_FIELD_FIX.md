# 主题表添加 is_official 字段

## 问题描述

主题表中缺少 `is_official` 字段，导致无法区分官方主题和用户主题。

## 解决方案

### 1. 数据库迁移

创建 SQL 脚本添加 `is_official` 字段：

```sql
-- 添加 is_official 字段（如果不存在）
ALTER TABLE theme_info
ADD COLUMN IF NOT EXISTS `is_official` TINYINT(1) DEFAULT 0
COMMENT '是否为官方主题：0-否，1-是'
AFTER `author_id`;

-- 为新字段添加索引
ALTER TABLE theme_info
ADD INDEX IF NOT EXISTS idx_is_official (is_official);
```

### 2. 实体类更新

**文件**: `ThemeInfo.java`

在 `authorId` 字段后添加 `isOfficial` 字段：

```java
/**
 * 作者 ID
 */
@TableField("author_id")
private Long authorId;

/**
 * 是否为官方主题：0-否，1-是
 */
@TableField("is_official")
private Boolean isOfficial;

/**
 * 所有者类型：GAME-游戏，APPLICATION-应用
 */
@TableField("owner_type")
private String ownerType;
```

### 3. DTO 更新

**文件**: `ThemeUploadDTO.java`

添加 `isOfficial` 字段，支持在上传时指定：

```java
/**
 * 作者名称别名（兼容前端字段）
 */
private String author;

/**
 * 是否为官方主题：0-否，1-是
 */
private Boolean isOfficial;

/**
 * 价格（游戏币）
 */
private Integer price;
```

### 4. Service 层更新

**文件**: `ThemeServiceImpl.java`

在创建主题时设置 `isOfficial` 字段：

```java
// 创建主题信息
ThemeInfo theme = new ThemeInfo();
theme.setAuthorId(authorId);

// 所有者类型和ID
theme.setOwnerType(themeData.getOwnerType() != null ? themeData.getOwnerType() : "GAME");
theme.setOwnerId(ownerId);

// ⭐ 是否为官方主题
theme.setIsOfficial(themeData.getIsOfficial() != null ? themeData.getIsOfficial() : false);

// 作者名称
String authorName = themeData.getAuthorName();
if (authorName == null || authorName.isEmpty()) {
    authorName = themeData.getAuthor();
}
theme.setAuthorName(authorName != null ? authorName : "创作者");

// ... 其他字段设置
```

### 5. 前端更新

**文件**: `creator-center/index.vue`

在加载主题列表时，根据 `isOfficial` 字段设置正确的来源标签：

```javascript
// 使用统一的分页数据格式
const themes = result.list || [];

// 使用 ownerType + ownerId，并映射显示字段
// ⭐ 根据 isOfficial 字段判断是否为官方主题
officialThemes.value = themes.map((theme: any) => ({
  ...theme,
  // 映射显示字段
  name: theme.themeName || theme.name,
  author: theme.authorName || theme.author,
  ownerType: theme.ownerType || 'GAME',
  ownerId: theme.ownerId ?? theme.gameId,
  // ⭐ 根据 isOfficial 字段设置来源
  source: theme.isOfficial ? 'official' : 'user',
  sourceLabel: theme.isOfficial ? '官方' : '用户',
  sourceIcon: theme.isOfficial ? '🏛️' : '👤',
}));
```

## 字段说明

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|---------|------|
| `is_official` | `TINYINT(1)` | `0` | 是否为官方主题：0-否，1-是 |

## 使用场景

### 1. 区分主题来源

```sql
-- 查询所有官方主题
SELECT * FROM theme_info WHERE is_official = 1;

-- 查询所有用户主题
SELECT * FROM theme_info WHERE is_official = 0;
```

### 2. 前端显示

根据 `isOfficial` 字段显示不同的标签：
- `isOfficial = 1`：显示"🏛️ 官方"标签
- `isOfficial = 0`：显示"👤 用户"标签

### 3. 筛选功能

前端筛选功能可以根据 `isOfficial` 字段过滤：
- 选择"官方"：`isOfficial = true`
- 选择"购买"：用户已购买的主题
- 选择"我的"：用户创建的主题

## 数据迁移

### 初始化官方主题

如果需要将某些主题标记为官方主题：

```sql
-- 将 author_id = 1 的主题标记为官方主题（假设 1 是官方账号）
UPDATE theme_info
SET is_official = 1
WHERE author_id = 1;

-- 或者根据主题名称标记
UPDATE theme_info
SET is_official = 1
WHERE theme_name LIKE '%官方%' OR author_name LIKE '%官方%';
```

### 查看当前数据

```sql
SELECT
    theme_id,
    theme_name,
    author_name,
    is_official,
    status
FROM theme_info
ORDER BY theme_id;
```

## 注意事项

1. **默认值**：新创建的主题默认不是官方主题（`is_official = 0`）
2. **安全性**：只有管理员或官方账号才能创建官方主题（需要在 Controller 层添加权限检查）
3. **不可修改**：用户上传的主题不能修改为官方主题（需要后端权限控制）
4. **索引优化**：已添加 `idx_is_official` 索引，提高查询性能

## 修改文件清单

### 后端
1. ✅ `kids-game-backend/add-is-official-to-theme-info.sql` - 数据库迁移脚本（新建）
2. ✅ `kids-game-backend/kids-game-dao/src/main/java/com/kidgame/dao/entity/ThemeInfo.java` - 实体类更新
3. ✅ `kids-game-backend/kids-game-service/src/main/java/com/kidgame/service/dto/ThemeUploadDTO.java` - DTO 更新
4. ✅ `kids-game-backend/kids-game-service/src/main/java/com/kidgame/service/impl/ThemeServiceImpl.java` - Service 层更新

### 前端
1. ✅ `kids-game-frontend/src/modules/creator-center/index.vue` - 根据字段判断来源标签

## 测试验证

### 1. 数据库验证
```sql
-- 检查字段是否存在
DESCRIBE theme_info;

-- 查看数据
SELECT theme_id, theme_name, is_official FROM theme_info;
```

### 2. 后端验证
- 上传主题时，测试 `isOfficial` 参数是否生效
- 验证主题列表查询是否正确返回 `isOfficial` 字段

### 3. 前端验证
- 刷新主题列表页面
- 检查官方主题是否显示"🏛️ 官方"标签
- 检查用户主题是否显示"👤 用户"标签
- 测试筛选功能是否正常工作

## 后续优化建议

1. **权限控制**：在 Controller 层添加权限检查，只有管理员才能创建官方主题
2. **批量操作**：提供批量标记官方主题的管理功能
3. **官方主题标识**：在主题卡片上添加视觉上的官方标识（如徽章、边框等）
