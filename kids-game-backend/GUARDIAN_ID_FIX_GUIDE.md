# guardian_id 字段缺失问题修复指南

## 📋 问题描述

**错误信息**：
```
Unknown column 'guardian_id' in 'field list'
```

**原因分析**：
- `t_user_control_config` 表缺少 `guardian_id` 字段
- 该字段在 `schema_v2.sql` 中已定义，但数据库可能未执行或执行的是旧版本

---

## 🔍 问题诊断

### **步骤 1: 检查当前表结构**

```sql
-- 查看表结构
DESC t_user_control_config;

-- 检查 guardian_id 字段是否存在
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'kids_game_db' 
  AND TABLE_NAME = 't_user_control_config' 
  AND COLUMN_NAME = 'guardian_id';
```

**预期结果**：
- 如果查询返回空 → 字段不存在，需要添加
- 如果查询返回一行 → 字段已存在，检查其他问题

---

## 🔧 解决方案

### **方案 1: 执行修复脚本（推荐）**

**适用场景**：保留现有数据，只添加缺失字段

**执行步骤**：

```bash
# 方式 A: 使用命令行
mysql -u root -p kids_game_db < fix-guardian-id-column.sql

# 方式 B: 使用 MySQL Workbench
# 1. 打开 fix-guardian-id-column.sql 文件
# 2. 点击 Execute
```

**修复脚本内容**：[`fix-guardian-id-column.sql`](./fix-guardian-id-column.sql)

---

### **方案 2: 手动添加字段**

**适用场景**：想逐步执行，了解每一步操作

#### **Step 1: 添加 guardian_id 字段**

```sql
-- MySQL 8.0+ (安全方式，如果字段已存在不会报错)
ALTER TABLE t_user_control_config
ADD COLUMN IF NOT EXISTS guardian_id BIGINT COMMENT '监护人用户 ID' AFTER user_id;

-- 或者所有 MySQL 版本通用（字段不存在时执行）
ALTER TABLE t_user_control_config
ADD COLUMN guardian_id BIGINT COMMENT '监护人用户 ID' AFTER user_id;
```

#### **Step 2: 添加索引**

```sql
-- 添加 guardian_id 索引
CREATE INDEX IF NOT EXISTS idx_guardian_id ON t_user_control_config(guardian_id);
```

#### **Step 3: 添加唯一约束**

```sql
-- 先检查是否已有同名索引
SHOW INDEX FROM t_user_control_config WHERE Key_name = 'uk_user_guardian';

-- 如果不存在，添加唯一约束
ALTER TABLE t_user_control_config
ADD UNIQUE KEY uk_user_guardian (user_id, guardian_id, deleted);
```

#### **Step 4: 验证**

```sql
-- 查看表结构
DESC t_user_control_config;

-- 测试查询
SELECT config_id, user_id, guardian_id
FROM t_user_control_config
LIMIT 5;
```

---

### **方案 3: 重新执行完整 schema**

**适用场景**：全新数据库或可以重建的测试环境

**⚠️ 警告**：此操作会删除并重建表，**会丢失数据**！

```bash
# 备份数据（如果需要）
mysqldump -u root -p kids_game_db t_user_control_config > backup_config.sql

# 执行完整 schema
mysql -u root -p kids_game_db < kids-game-web/src/main/resources/schema_v2.sql
```

---

## 📊 完整的 t_user_control_config 表结构

**标准结构**（schema_v2.sql）：

```sql
CREATE TABLE t_user_control_config (
    config_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '配置 ID',
    user_id BIGINT NOT NULL COMMENT '儿童用户 ID',
    guardian_id BIGINT COMMENT '监护人用户 ID',  -- ← 缺失的字段
    
    daily_duration INT DEFAULT 60 COMMENT '每日时长上限（分钟）',
    single_duration INT DEFAULT 30 COMMENT '单次时长上限（分钟）',
    allowed_time_start VARCHAR(10) DEFAULT '06:00' COMMENT '允许游戏开始时间',
    allowed_time_end VARCHAR(10) DEFAULT '22:00' COMMENT '允许游戏结束时间',
    answer_get_points INT DEFAULT 1 COMMENT '答对 1 题获得的疲劳点数',
    daily_answer_limit INT DEFAULT 10 COMMENT '每日答题赚点上限',
    blocked_games TEXT COMMENT '屏蔽的游戏 ID 列表（JSON 数组）',
    
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    
    UNIQUE KEY uk_user_guardian (user_id, guardian_id, deleted),
    INDEX idx_user_id (user_id),
    INDEX idx_guardian_id (guardian_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户管控配置表';
```

---

## ✅ 验证清单

修复完成后，请执行以下检查：

- [ ] **字段检查**：`DESC t_user_control_config;` 显示 guardian_id
- [ ] **索引检查**：`SHOW INDEX FROM t_user_control_config;` 显示 idx_guardian_id
- [ ] **唯一约束**：显示 uk_user_guardian 索引
- [ ] **查询测试**：包含 guardian_id 的 SELECT 语句执行成功
- [ ] **关联查询**：JOIN t_user 的查询执行成功

**验证 SQL**：

```sql
-- 1. 检查字段
SELECT COLUMN_NAME 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'kids_game_db' 
  AND TABLE_NAME = 't_user_control_config' 
  AND COLUMN_NAME = 'guardian_id';
-- 应该返回 1 行

-- 2. 检查索引
SHOW INDEX FROM t_user_control_config WHERE Key_name IN ('idx_guardian_id', 'uk_user_guardian');
-- 应该返回 2 行

-- 3. 测试查询
SELECT 
    c.config_id,
    c.user_id,
    c.guardian_id,
    u.username AS guardian_username
FROM t_user_control_config c
LEFT JOIN t_user u ON c.guardian_id = u.user_id
WHERE c.deleted = 0
LIMIT 5;
-- 应该正常返回结果
```

---

## 🎯 字段用途说明

### **guardian_id 字段的作用**

`t_user_control_config` 表支持**多监护人场景**：

- **一个儿童可以有多个监护人**（父母、祖父母等）
- **每个监护人可以为儿童设置独立的管控规则**
- **通过 guardian_id 区分是哪个监护人设置的规则**

**示例数据**：

| config_id | user_id (儿童) | guardian_id (家长) | daily_duration | 说明 |
|-----------|---------------|-------------------|----------------|------|
| 1 | 100 (小明) | 50 (爸爸) | 60 | 爸爸设置的规则 |
| 2 | 100 (小明) | 51 (妈妈) | 90 | 妈妈设置的规则 |
| 3 | 101 (小红) | 50 (爸爸) | 60 | 爸爸给小红设置的规则 |

**查询示例**：

```sql
-- 查询某个儿童的所有管控配置（来自不同监护人）
SELECT 
    c.config_id,
    c.user_id,
    c.daily_duration,
    u.username AS guardian_username,
    u.nickname AS guardian_nickname
FROM t_user_control_config c
LEFT JOIN t_user u ON c.guardian_id = u.user_id
WHERE c.user_id = 100  -- 儿童 ID
  AND c.deleted = 0;
```

---

## 📚 相关文档

- [schema_v2.sql](./kids-game-web/src/main/resources/schema_v2.sql) - 完整数据库结构
- [user-management-migration.sql](./user-management-migration.sql) - 用户管理迁移脚本
- [USER_MANAGEMENT_TABLE_DESIGN_SPEC.md](./USER_MANAGEMENT_TABLE_DESIGN_SPEC.md) - 表设计规范
- [fix-guardian-id-column.sql](./fix-guardian-id-column.sql) - 修复脚本

---

## ⚠️ 注意事项

1. **生产环境谨慎操作**：先在测试环境验证
2. **备份数据**：执行 ALTER TABLE 前务必备份
3. **业务低峰期**：大表 ALTER 可能锁表
4. **检查外键**：如果有外键约束，需要先处理

---

**修复完成时间**: 预计 5 分钟  
**风险等级**: 低（仅添加字段）  
**建议执行人员**: 开发人员或 DBA
