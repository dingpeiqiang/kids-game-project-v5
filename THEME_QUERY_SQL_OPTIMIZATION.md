# 主题查询 SQL 优化

## 问题分析

### 原始 SQL（复杂且有问题）

```sql
SELECT theme_id, author_id, is_official, owner_type, owner_id, 
       theme_name, author_name, price, status, download_count, 
       total_revenue, thumbnail_url, description, config_json, 
       is_default, created_at, updated_at 
FROM theme_info 
WHERE (
    status = ? 
    AND owner_type = ? 
    AND (
        -- ❌ 问题 1: 复杂的嵌套 OR，难以理解和维护
        (is_official = ? OR (author_id = ?)) 
        OR 
        (theme_id IN (?,?,?,?,?,?) AND is_official <> ? AND author_id <> ?)
    )
)
```

### 问题点

1. **逻辑复杂**：多层嵌套的 `OR` 条件，难以理解
2. **性能隐患**：`IN` 子查询在复杂条件下可能影响索引使用
3. **语义不清**：无法直观看出业务逻辑
4. **维护困难**：修改逻辑需要理解复杂的布尔表达式

---

## 优化方案

### 核心思路

**按场景拆分查询条件，简化每个场景的逻辑**

### 优化后的代码结构

```java
private LambdaQueryWrapper<ThemeInfo> buildQueryWrapper(Long userId, String ownerType, Long ownerId, String source) {
    LambdaQueryWrapper<ThemeInfo> wrapper = new LambdaQueryWrapper<>();

    // 基础条件：已上架
    wrapper.eq(ThemeInfo::getStatus, "on_sale");

    // 适用范围筛选
    if (ownerType != null && !ownerType.isEmpty()) {
        wrapper.eq(ThemeInfo::getOwnerType, ownerType);
        if ("GAME".equals(ownerType) && ownerId != null) {
            wrapper.eq(ThemeInfo::getOwnerId, ownerId);
        }
    }

    // ⭐ 来源筛选 - 简化逻辑
    switch (source) {
        case "official":
            // 官方主题：只显示官方的
            wrapper.eq(ThemeInfo::getIsOfficial, true);
            break;

        case "purchased":
            // 已购买的主题：查询已购买 ID 列表，排除自己创作的
            List<Long> purchasedIds = getPurchaseThemeIds(userId);
            if (purchasedIds.isEmpty()) {
                // 没有购买记录，返回空结果
                wrapper.eq(ThemeInfo::getThemeId, -1L);
            } else {
                // 在已购买列表中，且不是自己创作的（包含官方主题）
                wrapper.in(ThemeInfo::getThemeId, purchasedIds)
                       .ne(ThemeInfo::getAuthorId, userId);
            }
            break;

        case "mine":
            // 自己创作的主题
            wrapper.eq(ThemeInfo::getAuthorId, userId);
            break;

        default: // "all"
            // 全部可用主题：官方 OR 我的 OR 已购买的
            List<Long> allPurchasedIds = getPurchaseThemeIds(userId);
            
            if (allPurchasedIds.isEmpty()) {
                // 没有购买记录：只显示官方和我的
                wrapper.and(w -> w
                    .eq(ThemeInfo::getIsOfficial, true)
                    .or(or -> or.eq(ThemeInfo::getAuthorId, userId))
                );
            } else {
                // 有购买记录：官方 OR 我的 OR 已购买的（排除自己创作的重复项）
                wrapper.and(w -> w
                    .eq(ThemeInfo::getIsOfficial, true)  // 官方主题
                    .or(or -> or
                        .eq(ThemeInfo::getAuthorId, userId)  // 我的主题
                        .or(in -> in
                            .in(ThemeInfo::getThemeId, allPurchasedIds)  // 已购买
                            .ne(ThemeInfo::getAuthorId, userId)  // 排除自己创作的
                        )
                    )
                );
            }
            break;
    }

    return wrapper;
}
```

---

## 优化后生成的 SQL

### 场景 1: `source = "official"`（官方主题）

```sql
SELECT ... FROM theme_info 
WHERE status = 'on_sale' 
  AND owner_type = ? 
  AND is_official = true
```

✅ **优点**：简单清晰，只用一个条件

---

### 场景 2: `source = "purchased"`（已购买）

#### 情况 A: 用户有购买记录

```sql
SELECT ... FROM theme_info 
WHERE status = 'on_sale' 
  AND owner_type = ? 
  AND theme_id IN (?, ?, ?, ...)  -- 已购买的主题 ID 列表
  AND author_id <> ?               -- 排除自己创作的
```

✅ **优点**：
- 直接使用 `IN` 列表查询，高效
- 只排除自己创作的，**包含官方主题**

#### 情况 B: 用户没有购买记录

```sql
SELECT ... FROM theme_info 
WHERE status = 'on_sale' 
  AND owner_type = ? 
  AND theme_id = -1  -- 快速返回空结果
```

✅ **优点**：避免无意义的查询

---

### 场景 3: `source = "mine"`（我的）

```sql
SELECT ... FROM theme_info 
WHERE status = 'on_sale' 
  AND owner_type = ? 
  AND author_id = ?
```

✅ **优点**：最简单，直接查作者 ID

---

### 场景 4: `source = "all"`（全部）

#### 情况 A: 用户没有购买记录

```sql
SELECT ... FROM theme_info 
WHERE status = 'on_sale' 
  AND owner_type = ? 
  AND (
      is_official = true        -- 官方主题
      OR author_id = ?          -- 我的主题
  )
```

✅ **优点**：逻辑清晰，只有两个条件

#### 情况 B: 用户有购买记录

```sql
SELECT ... FROM theme_info 
WHERE status = 'on_sale' 
  AND owner_type = ? 
  AND (
      is_official = true                    -- 官方主题
      OR author_id = ?                      -- 我的主题
      OR (
          theme_id IN (?, ?, ?, ...)        -- 已购买的主题
          AND author_id <> ?                -- 排除自己创作的（避免重复）
      )
  )
```

✅ **优点**：
- 虽然仍有 OR，但逻辑分层清晰
- 每个分支独立，易于理解
- **包含了已购买的官方主题**

---

## 优化效果对比

| 维度 | 优化前 | 优化后 |
|-----|-------|-------|
| **代码可读性** | ❌ 复杂嵌套，难以理解 | ✅ 按场景拆分，逻辑清晰 |
| **SQL 复杂度** | ❌ 多层 OR 嵌套 | ✅ 分层清晰，各场景独立 |
| **维护成本** | ❌ 修改困难 | ✅ 易于扩展和调试 |
| **业务语义** | ❌ 不直观 | ✅ 一目了然 |
| **性能** | ⚠️ 复杂条件可能影响索引 | ✅ 简单条件更利于索引优化 |
| **逻辑正确性** | ❌ 错误排除了官方主题 | ✅ 正确处理各种场景 |

---

## 关键改进点

### 1. 分场景处理

将复杂的 `default` 分支拆分为多个明确的场景：
- `official` → 只查官方
- `purchased` → 查已购买列表
- `mine` → 查自己的
- `all` → 综合查询

### 2. 简化 `all` 场景逻辑

**优化前**：
```java
// 先包一层官方 + 我的
wrapper.and(w -> w
    .eq(ThemeInfo::getIsOfficial, true)
    .or(or -> or.eq(ThemeInfo::getAuthorId, userId))
);

// 再 OR 已购买的（排除官方和自己的）
if (!allPurchasedIds.isEmpty()) {
    wrapper.or(or -> or
        .in(ThemeInfo::getThemeId, allPurchasedIds)
        .ne(ThemeInfo::getIsOfficial, true)  // ❌ 错误：排除了官方
        .ne(ThemeInfo::getAuthorId, userId)
    );
}
```

**优化后**：
```java
if (allPurchasedIds.isEmpty()) {
    // 没有购买记录：简单处理
    wrapper.and(w -> w
        .eq(ThemeInfo::getIsOfficial, true)
        .or(or -> or.eq(ThemeInfo::getAuthorId, userId))
    );
} else {
    // 有购买记录：三层 OR，逻辑清晰
    wrapper.and(w -> w
        .eq(ThemeInfo::getIsOfficial, true)  // 官方
        .or(or -> or
            .eq(ThemeInfo::getAuthorId, userId)  // 我的
            .or(in -> in
                .in(ThemeInfo::getThemeId, allPurchasedIds)  // 已购买
                .ne(ThemeInfo::getAuthorId, userId)  // 排除重复
            )
        )
    );
}
```

### 3. 正确处理官方主题

- **`purchased` 场景**：不再排除官方主题
- **`all` 场景**：允许已购买的官方主题被多次包含（前端会去重）

---

## 测试建议

### 1. 单元测试

```java
@Test
public void testOfficialSource() {
    // 验证 source=official 只返回官方主题
}

@Test
public void testPurchasedSource() {
    // 验证 source=purchased 包含官方主题
}

@Test
public void testAllSource() {
    // 验证 source=all 包含所有可用主题
}
```

### 2. SQL 执行计划分析

```sql
-- 检查索引使用情况
EXPLAIN SELECT ... FROM theme_info 
WHERE status = 'on_sale' 
  AND is_official = true;

EXPLAIN SELECT ... FROM theme_info 
WHERE status = 'on_sale' 
  AND theme_id IN (?, ?, ?);
```

### 3. 性能对比测试

- 大数据量下的查询响应时间
- 不同 source 参数的查询效率
- 有/无购买记录的场景对比

---

## 总结

通过**分场景简化逻辑**的策略：

1. ✅ **降低了 SQL 复杂度**
2. ✅ **提升了代码可读性**
3. ✅ **修正了业务逻辑错误**（官方主题过滤问题）
4. ✅ **便于后续维护和优化**

虽然 `all` 场景下仍然会生成带有 OR 的 SQL，但这是在业务需求下的最优解，且逻辑层次更加清晰。
