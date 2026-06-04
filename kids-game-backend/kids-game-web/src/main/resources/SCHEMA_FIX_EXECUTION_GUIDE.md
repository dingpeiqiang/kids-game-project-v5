# schema_v2.sql 修正 - 执行指南

## 📋 概述

本文档提供详细的步骤来验证和应用 `schema_v2.sql` 的修正到实际数据库。

---

## ⚠️ 重要提醒

**在执行任何操作之前，请务必备份现有数据库！**

```bash
# 备份整个数据库
mysqldump -u root -p kidgame > backup_kidgame_$(date +%Y%m%d_%H%M%S).sql

# 或者只备份结构（用于对比）
mysqldump -u root -p --no-data kidgame > backup_structure_$(date +%Y%m%d_%H%M%S).sql
```

---

## 🔍 第一步：了解当前状态

### 1.1 查询数据库当前表数量

```sql
SELECT COUNT(*) AS table_count 
FROM information_schema.tables 
WHERE table_schema = 'kidgame' 
  AND table_type = 'BASE TABLE';
```

**预期结果**: 约 52 个表

### 1.2 检查关键表的当前结构

```sql
-- 检查 t_theme_info.owner_type 默认值
DESC t_theme_info;

-- 检查 t_user_theme_preference 结构
DESC t_user_theme_preference;

-- 检查 t_theme_assets 外键
SELECT 
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'kidgame'
  AND TABLE_NAME = 't_theme_assets'
  AND CONSTRAINT_NAME = 'fk_theme_assets_theme';
```

---

## ✅ 第二步：验证修正后的 schema_v2.sql

### 2.1 语法检查

在测试环境执行以下命令检查 SQL 语法：

```bash
# 使用 mysql 客户端检查（不实际执行）
mysql -u minimalgame -pminimalgame123 -h localhost kidgame < schema_v2.sql --dry-run
```

### 2.2 逐表验证

执行验证脚本：

```bash
mysql -u minimalgame -pminimalgame123 -h localhost kidgame < verify-schema-fix.sql
```

---

## 🔧 第三步：应用修正（两种方案）

### 方案 A：增量修正（推荐，适用于生产环境）

**优点**: 
- 不影响现有数据
- 风险低
- 可回滚

**步骤**:

1. **执行修正脚本**
   ```bash
   mysql -u minimalgame -pminimalgame123 -h localhost kidgame < schema_v2_fix.sql
   ```

2. **验证修正结果**
   ```bash
   mysql -u minimalgame -pminimalgame123 -h localhost kidgame < verify-schema-fix.sql
   ```

3. **检查关键点**
   ```sql
   -- 1. 检查 t_theme_info.owner_type 默认值
   SELECT COLUMN_DEFAULT FROM information_schema.COLUMNS 
   WHERE TABLE_SCHEMA = 'kidgame' 
     AND TABLE_NAME = 't_theme_info' 
     AND COLUMN_NAME = 'owner_type';
   -- 预期：GAME
   
   -- 2. 检查 t_user_theme_preference 结构
   DESC t_user_theme_preference;
   -- 应该包含：owner_type, owner_id 字段
   
   -- 3. 检查新增表是否存在
   SELECT TABLE_NAME FROM information_schema.TABLES 
   WHERE TABLE_SCHEMA = 'kidgame' 
     AND TABLE_NAME IN (
       't_game_resource_config',
       't_game_review_record',
       't_game_statistics',
       't_game_version_history',
       't_leaderboard_dimension',
       't_user_achievement',
       't_user_action_log',
       't_user_level',
       't_user_request',
       't_relation_confirmation'
     );
   -- 预期：返回 10 个表（不包括 t_theme_game_relation，该表已废弃）
   ```

### 方案 B：完全重建（仅适用于测试环境或全新部署）

**警告**: 此方案会删除所有现有数据！

**步骤**:

1. **备份数据（如果需要保留）**
   ```bash
   mysqldump -u root -p kidgame > backup_data_only.sql --no-create-info
   ```

2. **删除现有数据库**
   ```sql
   DROP DATABASE IF EXISTS kidgame;
   CREATE DATABASE kidgame DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **执行完整的 schema_v2.sql**
   ```bash
   mysql -u minimalgame -pminimalgame123 -h localhost kidgame < schema_v2.sql
   ```

4. **恢复数据（如果需要）**
   ```bash
   mysql -u minimalgame -pminimalgame123 -h localhost kidgame < backup_data_only.sql
   ```

5. **验证表结构**
   ```bash
   mysql -u minimalgame -pminimalgame123 -h localhost kidgame < verify-schema-fix.sql
   ```

---

## 📊 第四步：验证修正结果

### 4.1 自动验证

运行验证脚本查看所有关键点：

```bash
mysql -u minimalgame -pminimalgame123 -h localhost kidgame < verify-schema-fix.sql
```

### 4.2 手动验证清单

逐项检查以下项目：

#### 表结构验证

- [ ] `t_theme_info.owner_type` 默认值为 `'GAME'`
- [ ] `t_user_theme_preference` 包含 `owner_type` 和 `owner_id` 字段
- [ ] `t_user_theme_preference` 的唯一键为 `uk_user_owner(user_id, owner_type, owner_id)`
- [ ] `t_theme_assets` 的外键引用正确的表名 `t_theme_info`
- [ ] `t_game` 包含 `screenshot_urls` 和 `play_guide` 字段
- [ ] `t_game.game_url` 长度为 VARCHAR(500)
- [ ] `t_game.game_secret` 长度为 VARCHAR(100)
- [ ] `t_system_config` 包含 `config_type` 和 `status` 字段
- [ ] `t_system_config.config_value` 类型为 TEXT
- [ ] `t_game_session` 包含 `session_token` 字段
- [ ] `t_daily_stats.stat_date` 类型为 DATE
- [ ] `t_daily_stats` 包含 `total_fatigue_points` 和 `total_consumed_points` 字段

#### 新增表验证

- [ ] `t_game_resource_config` 存在
- [ ] `t_game_review_record` 存在
- [ ] `t_game_statistics` 存在
- [ ] `t_game_version_history` 存在
- [ ] `t_leaderboard_dimension` 存在
- [ ] `t_user_achievement` 存在
- [ ] `t_user_action_log` 存在
- [ ] `t_user_level` 存在
- [ ] `t_user_request` 存在
- [ ] `t_relation_confirmation` 存在

#### 总数验证

- [ ] 表总数约为 52 个（包括视图）

---

## 🐛 常见问题与解决方案

### 问题 1: 外键约束失败

**错误信息**: 
```
Cannot add foreign key constraint
```

**原因**: 引用的表不存在或表名不匹配

**解决方案**:
```sql
-- 检查被引用的表是否存在
SHOW TABLES LIKE 't_theme_info';

-- 如果外键已存在，先删除再重新创建
ALTER TABLE t_theme_assets DROP FOREIGN KEY fk_theme_assets_theme;
ALTER TABLE t_theme_assets
ADD CONSTRAINT fk_theme_assets_theme 
    FOREIGN KEY (theme_id) REFERENCES t_theme_info(theme_id) ON DELETE CASCADE;
```

### 问题 2: 字段已存在

**错误信息**:
```
Duplicate column name 'xxx'
```

**原因**: 字段已经在数据库中存在

**解决方案**:
```sql
-- 使用 MODIFY 代替 ADD
ALTER TABLE t_game
MODIFY COLUMN screenshot_urls TEXT COMMENT '截图 URLs';
```

或者跳过该字段的添加。

### 问题 3: 数据类型不匹配

**错误信息**:
```
Data too long for column 'xxx'
```

**原因**: 现有数据超出新的字段长度限制

**解决方案**:
1. 检查现有数据
2. 调整字段长度
3. 清理或迁移数据

---

## 📈 性能影响评估

### 新增索引

本次修正新增的索引：

| 表名 | 索引名 | 字段 | 类型 |
|------|--------|------|------|
| t_game | idx_tags | tags | 普通索引 |
| t_game | idx_creator | creator_id | 普通索引 |
| t_game | idx_featured | is_featured | 普通索引 |
| t_user_theme_preference | idx_owner_type_owner_id | owner_type, owner_id | 复合索引 |
| ... | ... | ... | ... |

**性能影响**: 
- ✅ 正面影响：提升查询性能
- ⚠️ 注意事项：插入/更新操作略微变慢

### 存储空间

预估新增表的存储空间：

| 表名 | 预估每行字节数 | 预估 10 万行占用 |
|------|---------------|----------------|
| t_game_resource_config | ~800 bytes | ~80 MB |
| t_game_review_record | ~600 bytes | ~60 MB |
| t_game_statistics | ~200 bytes | ~20 MB |
| 其他表 | ~500 bytes | ~50 MB |
| **合计** | - | **~210 MB** |

---

## 🔄 回滚方案

如果需要回滚到修正前的状态：

### 方案 A: 回滚增量修改

```sql
-- 1. 删除新增的表
DROP TABLE IF EXISTS t_game_resource_config;
DROP TABLE IF EXISTS t_game_review_record;
DROP TABLE IF EXISTS t_game_statistics;
DROP TABLE IF EXISTS t_game_version_history;
DROP TABLE IF EXISTS t_leaderboard_dimension;
DROP TABLE IF EXISTS t_user_achievement;
DROP TABLE IF EXISTS t_user_action_log;
DROP TABLE IF EXISTS t_user_level;
DROP TABLE IF EXISTS t_user_request;
DROP TABLE IF EXISTS t_relation_confirmation;

-- 2. 删除新增字段（示例）
ALTER TABLE t_game DROP COLUMN screenshot_urls;
ALTER TABLE t_game DROP COLUMN play_guide;
ALTER TABLE t_system_config DROP COLUMN config_type;
ALTER TABLE t_system_config DROP COLUMN status;
ALTER TABLE t_game_session DROP COLUMN session_token;
ALTER TABLE t_daily_stats DROP COLUMN total_fatigue_points;
ALTER TABLE t_daily_stats DROP COLUMN total_consumed_points;

-- 3. 恢复原字段定义
ALTER TABLE t_theme_info MODIFY COLUMN owner_type VARCHAR(20) NOT NULL;
ALTER TABLE t_daily_stats MODIFY COLUMN stat_date VARCHAR(20);
ALTER TABLE t_system_config MODIFY COLUMN config_value VARCHAR(500);
```

### 方案 B: 从备份恢复

```bash
# 从备份文件恢复
mysql -u minimalgame -pminimalgame123 -h localhost kidgame < backup_kidgame_YYYYMMDD_HHMMSS.sql
```

---

## 📝 执行记录模板

记录执行过程以便追溯：

```markdown
## 执行记录

**执行人**: ___________  
**执行时间**: ___________  
**执行环境**: □ 测试环境  □ 生产环境  

### 执行步骤

- [ ] 1. 数据库备份完成
- [ ] 2. 执行修正脚本
- [ ] 3. 验证修正结果
- [ ] 4. 应用程序测试
- [ ] 5. 性能测试

### 遇到的问题

1. ________________
   解决方案：________________

2. ________________
   解决方案：________________

### 验证结果

- 表总数：_____
- 新增表数：_____
- 修改表数：_____
- 验证通过率：_____%

### 签字确认

执行人签字：___________  
复核人签字：___________  
日期：___________  
```

---

## 🎯 成功标准

修正成功的标志：

1. ✅ 所有 SQL 语句执行无错误
2. ✅ 表结构与 schema_v2.sql 定义一致
3. ✅ 验证脚本所有检查项通过
4. ✅ 应用程序正常运行
5. ✅ 性能测试达标

---

## 📞 支持与联系

如有问题，请参考以下文档：

1. `schema_v2_comparison_report.md` - 详细对比报告
2. `SCHEMA_FIX_SUMMARY.md` - 修正总结
3. `verify-schema-fix.sql` - 验证脚本

---

**文档版本**: v1.0  
**最后更新**: 2026-03-28  
**状态**: ✅ 已完成
