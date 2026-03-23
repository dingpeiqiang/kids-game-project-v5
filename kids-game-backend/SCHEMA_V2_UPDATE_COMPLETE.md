# Schema V2 更新完成总结

## ✅ 更新完成

**文件**: `kids-game-web/src/main/resources/schema_v2.sql`  
**版本**: v2.0 → v2.1  
**更新时间**: 2026-03-23  
**基准**: ss.sql (实际数据库导出)

---

## 📊 新增内容统计

### 新增表 (7 个)
| 序号 | 表名 | 说明 | 优先级 |
|------|------|------|--------|
| 1 | `theme_assets` | 主题资源文件表 (带外键约束) | 🔴 高 |
| 2 | `t_game_config` | 游戏配置表 (58 条记录) | 🔴 高 |
| 3 | `t_game_mode_config` | 游戏模式配置表 (19 条记录) | 🟡 中 |
| 4 | `draft_category` | 草稿分类表 (4 条记录) | 🟡 中 |
| 5 | `draft_category_relation` | 草稿分类关联表 | 🟡 中 |
| 6 | `t_notification` | 通知消息表 (3 条记录) | 🟡 中 |
| 7 | `user_theme_preference` | 用户主题偏好表 (1 条记录) | 🟡 中 |

### 新增视图 (1 个)
- `v_draft_statistics` - 草稿统计视图

### 新增存储过程 (1 个)
- `sp_cleanup_expired_drafts` - 清理过期草稿的存储过程

### 字段修正 (4 处)
```sql
-- 1. t_game 表字段长度修正
game_url:    VARCHAR(255) → VARCHAR(500)
game_secret: VARCHAR(255) → VARCHAR(100)

-- 2. t_system_config 新增字段
+ config_type VARCHAR(20) DEFAULT 'STRING'
+ status TINYINT DEFAULT 1

-- 3. t_game_session 新增字段
+ session_token VARCHAR(100)

-- 4. t_daily_stats 新增统计字段
+ total_fatigue_points INT DEFAULT 0
+ total_consumed_points INT DEFAULT 0
```

---

## 📈 schema_v2.sql 变化对比

### 更新前
- **总行数**: 638 行
- **表数量**: 28 个
- **缺失**: 7 个重要表、1 个视图、1 个存储过程

### 更新后
- **总行数**: 847 行 (+209 行)
- **表数量**: 35 个 (+7 个)
- **视图**: 1 个
- **存储过程**: 1 个

---

## 🎯 更新内容详解

### 1. theme_assets (主题资源表)
**特性**:
- 带外键约束 (`FOREIGN KEY (theme_id) REFERENCES theme_info(theme_id)`)
- 支持资源去重 (`file_hash` 字段)
- 自动级联删除 (`ON DELETE CASCADE`)

**字段**:
```sql
asset_id, theme_id, asset_key, asset_type, 
file_path, file_size, file_hash, created_at
```

---

### 2. t_game_config (游戏配置表)
**用途**: 存储游戏的独立配置项

**字段**:
```sql
config_id, game_id, config_key, config_value, 
description, create_time, update_time, deleted
```

**唯一约束**: `uk_game_key (game_id, config_key, deleted)`

---

### 3. t_game_mode_config (游戏模式配置表)
**用途**: 配置游戏的不同模式 (单人/本地对战/团队/在线对战)

**字段**:
```sql
id, game_id, mode_type, mode_name, enabled, 
config_json, sort_order, create_time, update_time, deleted
```

---

### 4. draft_category (草稿分类表)
**用途**: 草稿的多级分类管理

**特性**:
- 支持树形结构 (`parent_id`)
- 自动更新时间戳 (`updated_at ON UPDATE CURRENT_TIMESTAMP`)

**字段**:
```sql
category_id, category_name, category_code, content_type, 
parent_id, sort_order, description, created_at, updated_at
```

---

### 5. draft_category_relation (草稿分类关联表)
**用途**: 草稿与分类的多对多关联

**特性**:
- 双外键约束 (引用 draft 和 draft_category)
- 级联删除

**字段**:
```sql
id, draft_id, category_id, created_at
```

---

### 6. t_notification (通知消息表)
**用途**: 系统通知消息

**字段**:
```sql
notification_id, user_id, user_type, type, title, content, 
status, is_read, related_id, sender_id, sender_type, 
extra_data, create_time, update_time, expire_time, deleted
```

---

### 7. user_theme_preference (用户主题偏好表)
**用途**: 用户对每个游戏/应用的主题偏好

**特性**:
- 唯一约束：`uk_user_owner (user_id, owner_type, owner_id)`
- 每个用户对每个游戏/应用只有一个当前主题

**字段**:
```sql
preference_id, user_id, owner_type, owner_id, theme_id, 
is_active, created_at, updated_at
```

---

### 8. v_draft_statistics (统计视图)
**用途**: 按作者、类型、状态统计草稿

**SQL**:
```sql
CREATE OR REPLACE VIEW v_draft_statistics AS
SELECT 
    author_id,
    author_type,
    content_type,
    status,
    COUNT(*) AS draft_count,
    SUM(content_size) AS total_size,
    MIN(created_at) AS first_created_at,
    MAX(updated_at) AS last_updated_at
FROM draft
GROUP BY author_id, author_type, content_type, status;
```

---

### 9. sp_cleanup_expired_drafts (存储过程)
**用途**: 定期清理过期的草稿

**参数**:
- `p_days`: 天数阈值
- `p_author_id`: 作者 ID (可选)
- `p_content_type`: 内容类型 (可选)

**功能**: 删除超过指定天数未更新的草稿状态草稿

---

## 🔍 字段差异修正说明

### 问题 1: game_url 长度不足
**原因**: 独立部署的游戏 URL 可能很长 (包含 CDN 路径)  
**解决**: VARCHAR(255) → VARCHAR(500)

### 问题 2: game_secret 过长
**原因**: 密钥通常为固定长度的哈希值  
**解决**: VARCHAR(255) → VARCHAR(100)

### 问题 3: t_system_config 缺少控制字段
**原因**: 设计时遗漏  
**解决**: 添加 `config_type` 和 `status` 字段

### 问题 4: t_game_session 缺少会话令牌
**原因**: 设计时未考虑会话验证需求  
**解决**: 添加 `session_token` 字段

### 问题 5: t_daily_stats 统计维度不足
**原因**: 后续业务需要疲劳点统计  
**解决**: 添加 `total_fatigue_points` 和 `total_consumed_points`

---

## ✅ 验证清单

执行以下 SQL 验证更新成功:

```sql
-- 1. 检查新表是否存在
SELECT TABLE_NAME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'kidsgame' 
  AND TABLE_NAME IN (
    'theme_assets', 
    't_game_config', 
    't_game_mode_config', 
    'draft_category', 
    'draft_category_relation', 
    't_notification', 
    'user_theme_preference'
  );

-- 2. 检查视图
SHOW FULL TABLES WHERE TABLE_TYPE = 'VIEW';

-- 3. 检查存储过程
SHOW PROCEDURE STATUS WHERE Db = 'kidsgame' AND Name = 'sp_cleanup_expired_drafts';

-- 4. 检查字段修正
DESC t_game;          -- 检查 game_url 和 game_secret
DESC t_system_config; -- 检查 config_type 和 status
DESC t_game_session;  -- 检查 session_token
DESC t_daily_stats;   -- 检查 fatigue 相关字段
```

---

## 📝 后续工作建议

### 立即执行 (今天)
- [ ] 在开发环境测试新的 schema_v2.sql
- [ ] 验证所有新功能正常工作
- [ ] 检查是否有 Entity 类需要同步更新

### 本周内执行
- [ ] 根据新表创建对应的 Java Entity 类
- [ ] 更新 Mapper 接口
- [ ] 编写 Service 层代码
- [ ] 前端适配新功能

### 数据迁移准备 (下周)
- [ ] 制定 t_kid/t_parent → t_user 迁移计划
- [ ] 准备迁移脚本
- [ ] 测试环境验证
- [ ] 生产环境部署计划

---

## 📞 相关文档

- **主方案**: `DATABASE_GOVERNANCE_PLAN.md` - 完整治理方案
- **现状分析**: `DATABASE_SUMMARY_20260323.md` - 数据库现状
- **补充脚本**: `schema_v2_add_missing_tables.sql` - 原始补充脚本
- **数据库导出**: `ss.sql` - 实际数据库 DDL

---

## 🎉 完成标志

schema_v2.sql 更新完成的标志:

1. ✅ 包含所有实际在用的表 (35 个)
2. ✅ 包含必要的视图 (1 个)
3. ✅ 包含必要的存储过程 (1 个)
4. ✅ 字段定义与实际数据库一致
5. ✅ 外键约束正确定义
6. ✅ 字符集统一为 utf8mb4_unicode_ci

---

**更新人**: AI Assistant  
**更新日期**: 2026-03-23  
**版本**: v2.1  
**状态**: ✅ 已完成
