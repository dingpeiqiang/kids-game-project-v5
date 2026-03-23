# Schema 一致性核对报告

**日期**: 2026-03-23  
**核对范围**: Entity 模型 vs schema_v2.sql vs migration 脚本

---

## ⚠️ 发现的不一致问题

### 问题 1: t_game 表字段不一致

#### schema_v2.sql (旧版本)
```sql
CREATE TABLE t_game (
    -- ... 基础字段
    status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    sort_order INT DEFAULT 0,
    consume_points_per_minute INT DEFAULT 1,
    online_count INT DEFAULT 0,
    total_play_count BIGINT DEFAULT 0,        -- ❌ 这个字段在 Entity 中没有
    total_play_duration BIGINT DEFAULT 0,     -- ❌ 这个字段在 Entity 中没有
    average_rating DECIMAL(3,2) DEFAULT 0.00, -- ❌ 这个字段在 Entity 中没有
    create_time BIGINT,
    update_time BIGINT,
    deleted TINYINT
);
```

#### Game.java (Entity 实体)
```java
private Integer status;                    // ✅ 但注释不同（5 状态 vs 2 状态）
private Integer sortOrder;                 // ✅
private Integer consumePointsPerMinute;    // ✅
private Integer onlineCount;               // ✅
// ❌ 缺少 totalPlayCount 字段
// ❌ 缺少 totalPlayDuration 字段
// ❌ 缺少 averageRating 字段
private Long createTime;                   // ✅
private Long updateTime;                   // ✅
private Integer deleted;                   // ✅

// ➕ 新增字段（schema_v2.sql 中没有）
private String tags;                       // ❌ 迁移脚本中有
private String screenshotUrls;             // ❌ 迁移脚本中有
private String playGuide;                  // ❌ 迁移脚本中有
private Integer isFeatured;                // ❌ 迁移脚本中有
private String version;                    // ❌ 迁移脚本中有
private String versionDescription;         // ❌ 迁移脚本中有
private Long creatorId;                    // ❌ 迁移脚本中有
private Long reviewerId;                   // ❌ 迁移脚本中有
private Long reviewTime;                   // ❌ 迁移脚本中有
private String reviewComment;              // ❌ 迁移脚本中有
private Long publishTime;                  // ❌ 迁移脚本中有
private Integer minFatigueToStart;         // ❌ 迁移脚本中有
```

**结论**: 
- schema_v2.sql 有 3 个统计字段在 Entity 中没有对应
- Entity 有 12 个新字段在 schema_v2.sql 中没有定义

---

### 问题 2: t_game_tag 表结构不一致

#### schema_v2.sql
```sql
CREATE TABLE t_game_tag (
    tag_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tag_name VARCHAR(50) NOT NULL,
    tag_type VARCHAR(20) DEFAULT 'CATEGORY' COMMENT '标签类型：CATEGORY, FEATURE, RECOMMEND',
    sort_order INT DEFAULT 0,
    create_time BIGINT,
    deleted TINYINT,
    UNIQUE KEY uk_tag_name_type (tag_name, tag_type, deleted)
);
```

#### GameTag.java (Entity)
```java
@TableField("tag_code")
private String tagCode;      // ❌ schema_v2.sql 中没有 tag_code 字段

@TableField("tag_name")
private String tagName;      // ✅

// ❌ 没有 tag_type 字段
@TableField("category")
private String category;     // ❌ schema_v2.sql 中没有 category 字段

@TableField("icon")
private String icon;         // ❌ schema_v2.sql 中没有 icon 字段

@TableField("sort_order")
private Integer sortOrder;   // ✅

@TableField("status")
private Integer status;      // ❌ schema_v2.sql 中没有 status 字段
```

**结论**: 
- schema_v2.sql 使用 `tag_type`，Entity 使用 `category`
- Entity 多了 `tagCode`, `icon`, `status` 字段
- 唯一键定义不一致

---

### 问题 3: t_game_tag_relation 表主键命名不一致

#### schema_v2.sql
```sql
CREATE TABLE t_game_tag_relation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',  -- ❌ 字段名是 id
    game_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    create_time BIGINT,
    deleted TINYINT,                                    -- ❌ 有 deleted 字段
    UNIQUE KEY uk_game_tag (game_id, tag_id, deleted)
);
```

#### GameTagRelation.java (Entity)
```java
@TableId(value = "relation_id", type = IdType.AUTO)
private Long relationId;    // ❌ Entity 使用 relation_id

@TableField("game_id")
private Long gameId;        // ✅

@TableField("tag_id")
private Long tagId;         // ✅

@TableField("create_time")
private Long createTime;    // ✅

// ❌ 没有 deleted 字段
```

**结论**:
- 主键字段名不一致：`id` vs `relation_id`
- Entity 缺少 `deleted` 字段

---

## 📋 完整对比表

### t_game 表字段对比

| 序号 | 字段名 | schema_v2.sql | Game.java | migration 脚本 | 状态 |
|------|--------|---------------|-----------|----------------|------|
| 1 | game_id | ✅ | ✅ | ✅ | 一致 |
| 2 | game_code | ✅ | ✅ | ✅ | 一致 |
| 3 | game_name | ✅ | ✅ | ✅ | 一致 |
| 4 | category | ✅ | ✅ | ✅ | 一致 |
| 5 | grade | ✅ | ✅ | ✅ | 一致 |
| 6 | tags | ❌ | ✅ | ✅ | **新增** |
| 7 | icon_url | ✅ | ✅ | ✅ | 一致 |
| 8 | cover_url | ✅ | ✅ | ✅ | 一致 |
| 9 | resource_url | ✅ | ✅ | ✅ | 一致 |
| 10 | screenshot_urls | ❌ | ✅ | ✅ | **新增** |
| 11 | description | ✅ | ✅ | ✅ | 一致 |
| 12 | play_guide | ❌ | ✅ | ✅ | **新增** |
| 13 | is_featured | ❌ | ✅ | ✅ | **新增** |
| 14 | module_path | ✅ | ✅ | ✅ | 一致 |
| 15 | game_url | ✅ | ✅ | ✅ | 一致 |
| 16 | game_secret | ✅ | ✅ | ✅ | 一致 |
| 17 | game_config | ✅ | ✅ | ✅ | 一致 |
| 18 | version | ❌ | ✅ | ✅ | **新增** |
| 19 | version_description | ❌ | ✅ | ✅ | **新增** |
| 20 | creator_id | ❌ | ✅ | ✅ | **新增** |
| 21 | reviewer_id | ❌ | ✅ | ✅ | **新增** |
| 22 | review_time | ❌ | ✅ | ✅ | **新增** |
| 23 | review_comment | ❌ | ✅ | ✅ | **新增** |
| 24 | publish_time | ❌ | ✅ | ✅ | **新增** |
| 25 | status | ✅ (2 状态) | ✅ (5 状态) | ✅ (5 状态) | **注释不同** |
| 26 | sort_order | ✅ | ✅ | ✅ | 一致 |
| 27 | consume_points_per_minute | ✅ | ✅ | ✅ | 一致 |
| 28 | min_fatigue_to_start | ❌ | ✅ | ✅ | **新增** |
| 29 | online_count | ✅ | ✅ | ✅ | 一致 |
| 30 | total_play_count | ✅ | ❌ | ❌ | **缺失** |
| 31 | total_play_duration | ✅ | ❌ | ❌ | **缺失** |
| 32 | average_rating | ✅ | ❌ | ❌ | **缺失** |
| 33 | create_time | ✅ | ✅ | ✅ | 一致 |
| 34 | update_time | ✅ | ✅ | ✅ | 一致 |
| 35 | deleted | ✅ | ✅ | ✅ | 一致 |

**统计**:
- 总字段数：35 个
- 完全一致：20 个 (57%)
- 新增字段：12 个 (34%)
- 缺失字段：3 个 (9%)
- 注释不同：1 个 (3%)

---

### t_game_tag 表字段对比

| 序号 | 字段名 | schema_v2.sql | GameTag.java | migration 脚本 | 状态 |
|------|--------|---------------|--------------|----------------|------|
| 1 | tag_id | ✅ | ✅ | ✅ | 一致 |
| 2 | tag_code | ❌ | ✅ | ✅ | **新增** |
| 3 | tag_name | ✅ | ✅ | ✅ | 一致 |
| 4 | tag_type | ✅ | ❌ | ❌ | **已废弃** |
| 5 | category | ❌ | ✅ | ✅ | **新增** |
| 6 | icon | ❌ | ✅ | ✅ | **新增** |
| 7 | sort_order | ✅ | ✅ | ✅ | 一致 |
| 8 | status | ❌ | ✅ | ✅ | **新增** |
| 9 | create_time | ✅ | ✅ | ✅ | 一致 |
| 10 | update_time | ❌ | ✅ | ✅ | **新增** |
| 11 | deleted | ✅ | ✅ | ✅ | 一致 |

**统计**:
- 总字段数：11 个
- 完全一致：5 个 (45%)
- 新增字段：5 个 (45%)
- 已废弃：1 个 (9%)

---

### t_game_tag_relation 表字段对比

| 序号 | 字段名 | schema_v2.sql | GameTagRelation.java | migration 脚本 | 状态 |
|------|--------|---------------|----------------------|----------------|------|
| 1 | id/relation_id | ✅ (id) | ✅ (relation_id) | ✅ (relation_id) | **命名不一致** |
| 2 | game_id | ✅ | ✅ | ✅ | 一致 |
| 3 | tag_id | ✅ | ✅ | ✅ | 一致 |
| 4 | create_time | ✅ | ✅ | ✅ | 一致 |
| 5 | deleted | ✅ | ❌ | ❌ | **缺失** |

**统计**:
- 总字段数：5 个
- 完全一致：3 个 (60%)
- 命名不一致：1 个 (20%)
- 缺失字段：1 个 (20%)

---

## 🔧 需要修复的问题

### 高优先级（阻塞性问题）

#### 1. Game.java 缺少统计字段
**问题**: schema_v2.sql 有 3 个统计字段在 Entity 中没有
```sql
total_play_count BIGINT DEFAULT 0
total_play_duration BIGINT DEFAULT 0
average_rating DECIMAL(3,2) DEFAULT 0.00
```

**解决方案**: 
- 方案 A：在 Game.java 中添加这 3 个字段（推荐）
- 方案 B：从 schema_v2.sql 和 migration 脚本中删除这 3 个字段（因为这些数据应该在 t_game_statistics 表中）

**建议**: 选择方案 B，因为统计表已经单独建表了

#### 2. GameTag.java 字段映射错误
**问题**: `tag_type` vs `category` 命名不一致

**解决方案**: 
- 修改 GameTag.java，将 `category` 改为 `tagType`
- 或者修改 migration 脚本，将 `tag_type` 改为 `category`

**建议**: 修改 Entity，使用 `tagType` 保持一致性

#### 3. GameTagRelation.java 主键命名不一致
**问题**: schema_v2.sql 使用 `id`，migration 使用 `relation_id`

**解决方案**: 
- 统一使用 `relation_id`（更具描述性）
- 更新 schema_v2.sql

**建议**: 修改 schema_v2.sql

---

### 中优先级（需要统一）

#### 4. status 字段注释不一致
**问题**: 
- schema_v2.sql: `状态：0-禁用，1-启用`
- Entity/migration: `状态：0-草稿，1-待审核，2-已上架，3-已下架，4-审核驳回`

**解决方案**: 更新 schema_v2.sql 的注释

#### 5. GameTagRelation 缺少 deleted 字段
**问题**: Entity 中没有逻辑删除字段

**解决方案**: 在 GameTagRelation.java 中添加 `@TableLogic private Integer deleted;`

---

## 📝 行动计划

### 第一步：修复 Entity（立即执行）

1. **Game.java** - 移除冗余统计字段
```java
// 删除以下 3 个字段（已在 t_game_statistics 表中）
// private Long totalPlayCount;
// private Long totalPlayDuration;
// private Double averageRating;
```

2. **GameTag.java** - 修改字段名
```java
// 将 category 改为 tagType
@TableField("tag_type")
private String tagType;

// 删除 category 字段
// @TableField("category")
// private String category;
```

3. **GameTagRelation.java** - 添加逻辑删除
```java
@TableLogic
private Integer deleted;
```

### 第二步：更新 schema_v2.sql（本次重构）

更新 schema_v2.sql 中的 t_game 表定义，使其与 migration 脚本一致：

```sql
CREATE TABLE t_game (
    game_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_code VARCHAR(50) UNIQUE NOT NULL,
    game_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    grade VARCHAR(20),
    
    -- 新增字段
    tags VARCHAR(500) COMMENT '标签列表（逗号分隔）',
    screenshot_urls TEXT COMMENT '截图 URLs(JSON 数组)',
    play_guide TEXT COMMENT '玩法说明',
    is_featured TINYINT DEFAULT 0 COMMENT '是否推荐：0-否，1-是',
    version VARCHAR(20) DEFAULT '1.0.0' COMMENT '版本号',
    version_description VARCHAR(500) COMMENT '版本说明',
    creator_id BIGINT COMMENT '创建人 ID',
    reviewer_id BIGINT COMMENT '审核人 ID',
    review_time BIGINT COMMENT '审核时间',
    review_comment VARCHAR(500) COMMENT '审核意见',
    publish_time BIGINT COMMENT '上架时间',
    min_fatigue_to_start INT DEFAULT 0 COMMENT '启动所需最低疲劳度',
    
    -- 原有字段
    icon_url VARCHAR(255),
    cover_url VARCHAR(255),
    resource_url VARCHAR(255),
    description TEXT,
    module_path VARCHAR(255),
    game_url VARCHAR(255),
    game_secret VARCHAR(255),
    game_config JSON,
    
    -- 状态字段（更新注释）
    status TINYINT DEFAULT 0 COMMENT '状态：0-草稿，1-待审核，2-已上架，3-已下架，4-审核驳回',
    sort_order INT DEFAULT 0,
    consume_points_per_minute INT DEFAULT 1,
    online_count INT DEFAULT 0,
    
    -- 删除冗余字段
    -- total_play_count BIGINT DEFAULT 0,  -- 已移至 t_game_statistics
    -- total_play_duration BIGINT DEFAULT 0,  -- 已移至 t_game_statistics
    -- average_rating DECIMAL(3,2) DEFAULT 0.00,  -- 已移至 t_game_statistics
    
    create_time BIGINT,
    update_time BIGINT,
    deleted TINYINT,
    
    -- 索引
    INDEX idx_category (category),
    INDEX idx_grade (grade),
    INDEX idx_status (status),
    INDEX idx_tags (tags),
    INDEX idx_creator (creator_id),
    INDEX idx_featured (is_featured)
);
```

### 第三步：验证（执行前测试）

```bash
# 1. 编译检查
mvn clean compile

# 2. 运行应用
mvn spring-boot:run

# 3. 测试数据库连接
curl http://localhost:8080/api/admin/games/list
```

---

## 📊 影响评估

### 影响范围
- **后端代码**: 需要修改 3 个 Entity 文件
- **数据库**: 需要更新 schema_v2.sql
- **已有数据**: 无影响（只是字段移动和重命名）

### 风险评估
- 🔴 **高风险**: 如果不修复，数据库迁移会失败
- 🟡 **中风险**: 如果只修复部分问题，可能导致运行时错误
- 🟢 **低风险**: 全部修复后，系统一致性达到 100%

---

## ✅ 核对结论

### 当前状态
- ❌ **Entity 模型** 与 **schema_v2.sql** 存在多处不一致
- ❌ **migration 脚本** 与 **schema_v2.sql** 存在字段差异
- ⚠️ **部分字段重复定义**（统计字段应该在 statistics 表中）
- ⚠️ **字段命名不统一**（tag_type vs category, id vs relation_id）

### 建议行动
1. **立即停止** 执行 migration 脚本
2. **优先修复** Entity 模型（删除冗余字段、统一命名）
3. **同步更新** schema_v2.sql
4. **重新核对** 所有文件的一致性
5. **测试验证** 后再执行迁移

---

**核对人**: AI Assistant  
**核对时间**: 2026-03-23  
**核对结果**: ⚠️ 发现 5 个不一致问题，需要修复后才能执行迁移  
**建议优先级**: 🔴 高（阻塞性问题）
