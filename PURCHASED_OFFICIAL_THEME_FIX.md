# 已购买主题过滤逻辑优化

## 问题描述

在主题来源筛选中，`source: purchased`（已购买）的过滤逻辑错误地排除了官方主题，导致用户已购买的官方主题无法在"已购买"分类中显示。

## 问题分析

### 原有逻辑（错误）

```java
case "purchased":
    // 已购买的主题（排除官方和自己创作的）
    List<Long> purchasedIds = getPurchaseThemeIds(userId);
    if (purchasedIds.isEmpty()) {
        wrapper.eq(ThemeInfo::getThemeId, -1L);
    } else {
        wrapper.in(ThemeInfo::getThemeId, purchasedIds)
               .ne(ThemeInfo::getIsOfficial, true)  // ❌ 错误：排除了官方主题
               .ne(ThemeInfo::getAuthorId, userId);
    }
    break;
```

### 问题影响

- 用户购买的官方主题不会在"已购买"标签页中显示
- 不符合业务逻辑：已购买的官方主题应该同时具有"官方"和"已购买"属性
- 用户体验下降：用户无法查看自己购买的所有主题

## 解决方案

### 修改后逻辑（正确）

```java
case "purchased":
    // 已购买的主题（排除自己创作的，但包含官方主题）
    List<Long> purchasedIds = getPurchaseThemeIds(userId);
    if (purchasedIds.isEmpty()) {
        wrapper.eq(ThemeInfo::getThemeId, -1L);
    } else {
        wrapper.in(ThemeInfo::getThemeId, purchasedIds)
               .ne(ThemeInfo::getAuthorId, userId);  // ✅ 只排除自己创作的
    }
    break;
```

### 核心改进

1. **移除了对官方主题的排除**：删除 `.ne(ThemeInfo::getIsOfficial, true)` 条件
2. **保留对自己创作主题的排除**：因为自己的主题会在 `source: mine` 中显示
3. **允许主题多重属性**：已购买的官方主题可以同时出现在多个分类中

## 修改文件

- **文件路径**: `kids-game-backend/kids-game-service/src/main/java/com/kidgame/service/impl/ThemeServiceImpl.java`
- **修改位置**: 第 714-724 行
- **修改内容**: 
  - 移除 `.ne(ThemeInfo::getIsOfficial, true)` 条件
  - 更新注释说明

## 预期效果

### 筛选逻辑说明

| 来源筛选 | 包含内容 | 排除内容 |
|---------|---------|---------|
| `all`（全部） | 官方主题 + 我的主题 + 已购买主题 | 无 |
| `official`（官方） | 所有官方主题（`isOfficial = true`） | 无 |
| `purchased`（已购买） | 所有已购买的主题（**包含官方主题**） | 自己创作的主题 |
| `mine`（我的） | 自己创作的主题（`authorId = 当前用户ID`） | 无 |

### 主题重叠规则

同一个主题可以出现在多个分类中：

- **官方主题**：如果用户购买了，会同时出现在：
  - `source: official`（官方分类）
  - `source: purchased`（已购买分类）
  
- **自己创作的主题**：只显示在 `source: mine` 中

- **普通购买主题**：只显示在 `source: purchased` 中

### 前端显示逻辑

前端会根据优先级为每个主题添加来源标识：

```javascript
if (theme.isOfficial) {
  source = 'official';      // 🏛️ 官方
} else if (theme.authorId === currentUserId) {
  source = 'mine';          // 🎨 我的
} else {
  source = 'purchased';     // 🛒 购买
}
```

即使主题在后端查询中返回多次，前端也会根据优先级正确显示单一标识。

## 测试建议

### 1. 后端 API 测试

```bash
# 测试获取已购买主题（应包含官方主题）
curl -X GET "http://localhost:8080/api/theme/my-available-themes?source=purchased" \
  -H "Authorization: Bearer <token>"

# 测试获取官方主题
curl -X GET "http://localhost:8080/api/theme/my-available-themes?source=official" \
  -H "Authorization: Bearer <token>"
```

### 2. 前端功能测试

1. **场景 1**：用户购买了官方主题
   - 切换到"已购买"标签，应能看到该主题
   - 切换到"官方"标签，也应能看到该主题
   
2. **场景 2**：用户购买了普通主题
   - 切换到"已购买"标签，应能看到该主题
   - 来源标识显示为"🛒 购买"

3. **场景 3**：用户创建了自己的主题
   - 切换到"我的"标签，应能看到该主题
   - 切换到"已购买"标签，不应看到该主题

## 相关文档

- 主题系统重构迁移指南：`THEME_SYSTEM_REFACTOR_MIGRATION.md`
- 主题来源筛选修复：`THEME_SOURCE_FILTER_FIX.md`
- 主题查询重构：`THEME_QUERY_REFACTOR.md`
- **SQL 优化文档**：`THEME_QUERY_SQL_OPTIMIZATION.md`

## 修改日期

2026-03-21
