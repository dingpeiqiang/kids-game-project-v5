# 数据库 Schema 治理方案

## 📊 现状分析 (基于 ss.sql - 2026-03-23 导出)

### 数据库基本信息
- **数据库**: kidgame
- **服务器版本**: MySQL 8.0.45-0ubuntu0.24.04.1
- **导出时间**: 2026-03-23 15:54:00
- **总表数**: 38 个业务表 + 3 个备份表 + 1 个视图

---

## 🎯 核心问题识别

### 问题 1: 用户表双轨制 ⚠️
**现状**:
- `t_kid` (319 条记录) - 旧儿童表
- `t_parent` (214 条记录) - 旧家长表  
- `t_user` (109 条记录) - 新统一用户表

**风险**:
- 数据不一致：新旧表并存
- 维护复杂：需要同时维护两套逻辑
- 外键约束：旧表引用可能导致迁移困难

**解决方案**: 分阶段迁移到 t_user

---

### 问题 2: 废弃表未清理 ⚠️
**应废弃的表**:
1. `t_game_lock` - 已被 `t_blocked_game` 替代
2. `t_parent_limit` - 已被 `t_user_control_config` 替代
3. `t_leaderboard_dimension` - 已被 `t_leaderboard_config` 替代

**备份表** (可删除):
- `theme_info_backup_20250318`
- `t_game_permission_backup_20240308`

---

### 问题 3: schema_v2.sql 缺失严重 ⚠️
**缺失的关键表** (共 12 个):
1. `theme_assets` - 主题资源表 (带外键)
2. `draft_category` - 草稿分类表
3. `draft_category_relation` - 草稿分类关联表
4. `t_game_config` - 游戏配置表
5. `t_game_mode_config` - 游戏模式配置表
6. `t_notification` - 通知消息表
7. `t_leaderboard_dimension` - (虽废弃但代码可能引用)
8. `user_theme_preference` - 用户主题偏好表
9. `v_draft_statistics` - 草稿统计视图
10. `sp_cleanup_expired_drafts` - 清理存储过程
11. `tr_draft_update_version` - 自动版本触发器

**字段差异**:
```sql
-- t_game 表
实际：game_url VARCHAR(500), game_secret VARCHAR(100)
Schema: game_url VARCHAR(255), game_secret VARCHAR(255)  ❌

-- t_system_config 表
实际：config_type VARCHAR(20), status TINYINT
Schema: 无这些字段  ❌

-- t_game_session 表
实际：session_token VARCHAR(100)
Schema: 无此字段  ❌
```

---

### 问题 4: 标准不统一 ⚠️

**时间字段混乱**:
```
BIGINT (毫秒时间戳):
- t_user.create_time, t_game.create_time
- 优点：跨时区，易排序
- 缺点：不可读，需转换

DATETIME:
- theme_info.created_at, draft.created_at
- 优点：可读性好，MySQL 原生支持
- 缺点：时区敏感
```

**字符集不统一**:
```
utf8mb4_unicode_ci:  t_game, t_question, t_user
utf8mb4_0900_ai_ci:  theme_info, draft, t_notification
```

---

## 🛠️ 实施方案

### 阶段一：Schema 修复 (第 1 周)

#### 任务 1.1: 补充缺失表定义
**文件**: `kids-game-web/src/main/resources/schema_v2.sql`

需要添加的表 (按优先级):
1. **theme_assets** - 高优先级 (生产环境正在使用)
2. **t_game_config** - 高优先级 (游戏配置依赖)
3. **draft_category** 相关 - 中优先级 (草稿功能需要)
4. **t_notification** - 中优先级 (通知功能需要)

#### 任务 1.2: 修正字段定义
```sql
-- 修正 t_game 字段
ALTER TABLE t_game 
MODIFY COLUMN game_url VARCHAR(500) COMMENT '游戏访问地址 URL（独立部署时使用）',
MODIFY COLUMN game_secret VARCHAR(100) COMMENT '游戏密钥（用于签名验证）';

-- 修正 t_system_config
ALTER TABLE t_system_config
ADD COLUMN config_type VARCHAR(20) DEFAULT 'STRING' COMMENT '配置类型：STRING-字符串，INT-整数，JSON-JSON对象' AFTER config_value,
ADD COLUMN status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用' AFTER config_group;

-- 修正 t_game_session
ALTER TABLE t_game_session
ADD COLUMN session_token VARCHAR(100) COMMENT '会话令牌（用于游戏验证）' AFTER game_id;
```

#### 任务 1.3: 统一标准
**决策**:
- 时间字段：新表使用 DATETIME，旧表保持 BIGINT (渐进式迁移)
- 字符集：统一使用 `utf8mb4_unicode_ci`

---

### 阶段二：数据迁移 (第 2-3 周)

#### 迁移准备
```sql
-- 1. 完整备份
mysqldump -u kidsgame -p kidsgame > backup_$(date +%Y%m%d_%H%M%S).sql

-- 2. 检查外键依赖
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_NAME IN ('t_kid', 't_parent', 't_parent_limit');
```

#### 迁移步骤

**步骤 1: 迁移 Kid 用户**
```sql
-- 1. 迁移儿童用户到 t_user
INSERT INTO t_user (
    user_type, username, password, nickname, avatar, 
    fatigue_points, daily_answer_points, fatigue_update_time,
    status, create_time, update_time, deleted
)
SELECT 
    0,  -- user_type = 0 (儿童)
    k.username,
    k.password,
    k.nickname,
    k.avatar,
    COALESCE(k.fatigue_points, 10),
    0,  -- daily_answer_points
    UNIX_TIMESTAMP() * 1000,  -- fatigue_update_time
    CASE WHEN k.deleted = 0 THEN 1 ELSE 0 END,
    k.create_time,
    k.update_time,
    k.deleted
FROM t_kid k
WHERE NOT EXISTS (
    SELECT 1 FROM t_user u WHERE u.username = k.username AND u.user_type = 0
);

-- 2. 更新 ID 映射关系 (临时表)
CREATE TEMPORARY TABLE temp_kid_id_mapping (
    old_kid_id BIGINT,
    new_user_id BIGINT
);

INSERT INTO temp_kid_id_mapping
SELECT k.kid_id, u.user_id
FROM t_kid k
JOIN t_user u ON u.username = k.username AND u.user_type = 0;

-- 3. 迁移儿童扩展信息到 t_user_profile
INSERT INTO t_user_profile (
    user_id, profile_type, ext_info_json, create_time, update_time, deleted
)
SELECT 
    m.new_user_id,
    'KID_INFO',
    JSON_OBJECT(
        'grade', k.grade,
        'device_id', k.device_id,
        'fatigue_points', k.fatigue_points,
        'parent_id', k.parent_id
    ),
    k.create_time,
    k.update_time,
    k.deleted
FROM t_kid k
JOIN temp_kid_id_mapping m ON k.kid_id = m.old_kid_id;
```

**步骤 2: 迁移 Parent 用户**
```sql
-- 类似 Kid 迁移逻辑
INSERT INTO t_user (...)
SELECT 1, phone, password, nickname, ... FROM t_parent;
```

**步骤 3: 迁移用户关系**
```sql
INSERT INTO t_user_relation (
    relation_type, user_a, user_b, role_type, is_primary, 
    permission_level, status, create_time, update_time, deleted
)
SELECT 
    1,  -- relation_type = 1 (家长儿童)
    pa.user_id,  -- 家长 user_id
    kd.user_id,  -- 儿童 user_id
    3,  -- role_type = 3 (监护人)
    1,  -- is_primary = 1
    3,  -- permission_level = 3 (完全控制)
    1,  -- status = 1 (已建立)
    k.create_time,
    k.update_time,
    0
FROM t_kid k
JOIN temp_kid_id_mapping kd ON k.kid_id = kd.old_kid_id
JOIN t_parent p ON k.parent_id = p.parent_id
JOIN t_user pa ON pa.username = p.phone AND pa.user_type = 1;
```

**步骤 4: 迁移管控配置**
```sql
INSERT INTO t_user_control_config (
    user_id, daily_duration, single_duration,
    allowed_time_start, allowed_time_end,
    answer_get_points, daily_answer_limit,
    blocked_games, create_time, update_time, deleted
)
SELECT 
    m.new_user_id,
    pl.daily_duration,
    pl.single_duration,
    pl.allowed_time_start,
    pl.allowed_time_end,
    pl.answer_get_points,
    pl.daily_answer_limit,
    pl.blocked_games,
    pl.create_time,
    pl.update_time,
    pl.deleted
FROM t_parent_limit pl
JOIN temp_kid_id_mapping m ON pl.kid_id = m.old_kid_id;
```

**步骤 5: 迁移游戏记录**
```sql
-- 更新 t_game_session 的 user_id
UPDATE t_game_session gs
JOIN temp_kid_id_mapping m ON gs.kid_id = m.old_kid_id
SET gs.user_id = m.new_user_id;

-- 更新 t_answer_record 的 user_id
UPDATE t_answer_record ar
JOIN temp_kid_id_mapping m ON ar.kid_id = m.old_kid_id
SET ar.user_id = m.new_user_id;

-- 更新 t_game_record 的 user_id
UPDATE t_game_record gr
JOIN temp_kid_id_mapping m ON gr.kid_id = m.old_kid_id
SET gr.user_id = m.new_user_id;

-- 更新 t_fatigue_points_log 的 user_id
UPDATE t_fatigue_points_log fpl
JOIN temp_kid_id_mapping m ON fpl.kid_id = m.old_kid_id
SET fpl.user_id = m.new_user_id;

-- 更新 t_blocked_game 的 kid_id
UPDATE t_blocked_game bg
JOIN temp_kid_id_mapping m ON bg.kid_id = m.old_kid_id
SET bg.kid_id = m.new_user_id;
```

---

### 阶段三：验证与测试 (第 4 周)

#### 数据验证
```sql
-- 1. 验证用户迁移完整性
SELECT 
    'Kid 迁移' as type,
    (SELECT COUNT(*) FROM t_kid WHERE deleted = 0) as old_count,
    (SELECT COUNT(*) FROM t_user WHERE user_type = 0 AND deleted = 0) as new_count
UNION ALL
SELECT 
    'Parent 迁移',
    (SELECT COUNT(*) FROM t_parent WHERE deleted = 0),
    (SELECT COUNT(*) FROM t_user WHERE user_type = 1 AND deleted = 0);

-- 2. 验证关系迁移
SELECT 
    'User Relation' as type,
    (SELECT COUNT(*) FROM t_kid k JOIN t_parent p ON k.parent_id = p.parent_id) as expected,
    (SELECT COUNT(*) FROM t_user_relation WHERE relation_type = 1) as actual;

-- 3. 验证管控配置
SELECT 
    'Control Config' as type,
    (SELECT COUNT(*) FROM t_parent_limit) as expected,
    (SELECT COUNT(*) FROM t_user_control_config) as actual;
```

#### 功能测试清单
- [ ] 儿童登录功能
- [ ] 家长登录功能
- [ ] 游戏时长管控
- [ ] 疲劳点系统
- [ ] 主题购买与应用
- [ ] 草稿保存与发布
- [ ] 排行榜查询
- [ ] 通知消息接收

---

### 阶段四：清理废弃表 (第 5 周)

```sql
-- 确认迁移成功后执行

-- 1. 重命名旧表 (保留 30 天)
RENAME TABLE t_kid TO t_kid_backup_20260323;
RENAME TABLE t_parent TO t_parent_backup_20260323;
RENAME TABLE t_parent_limit TO t_parent_limit_backup_20260323;
RENAME TABLE t_game_lock TO t_game_lock_backup_20260323;
RENAME TABLE t_leaderboard_dimension TO t_leaderboard_dimension_backup_20260323;

-- 2. 更新代码引用 (Java Entity/Mapper/Service)

-- 3. 观察 30 天后删除
-- DROP TABLE t_kid_backup_20260323;
-- DROP TABLE t_parent_backup_20260323;
-- ...
```

---

## 📅 时间表

| 阶段 | 任务 | 负责人 | 预计时间 | 状态 |
|------|------|--------|----------|------|
| 一 | Schema 修复 | 后端团队 | 3 天 | ⏳ 待开始 |
| 二 | 数据迁移 | DBA+ 后端 | 1 周 | ⏳ 待开始 |
| 三 | 验证测试 | 测试团队 | 1 周 | ⏳ 待开始 |
| 四 | 清理废弃 | 后端团队 | 2 天 | ⏳ 待开始 |

---

## 🎯 关键成功因素

### 必须满足的前提条件
1. ✅ 完整的数据备份
2. ✅ 回滚方案准备
3. ✅ 测试环境验证通过
4. ✅ 所有相关人员知晓变更

### 风险控制
- **迁移失败**: 立即恢复备份，分析原因
- **数据不一致**: 编写对账脚本，逐项验证
- **性能问题**: 在低峰期执行，分批迁移

---

## 📝 后续优化建议

### 短期 (1-2 个月)
1. **统一时间字段标准**: 逐步将 BIGINT 改为 DATETIME
2. **统一字符集**: 全部转为 utf8mb4_unicode_ci
3. **添加监控**: 慢查询监控，表空间监控

### 中期 (3-6 个月)
1. **读写分离**: 游戏记录/答题记录分库
2. **归档策略**: 历史数据归档 (超过 6 个月的记录)
3. **索引优化**: 根据实际查询优化索引

### 长期 (6-12 个月)
1. **微服务拆分**: 用户服务、游戏服务、主题服务独立数据库
2. **缓存层引入**: Redis 缓存热点数据
3. **分库分表**: 用户量增长后的水平扩展

---

## 🔗 相关文档

- [SCHEMA_V2_UPDATE_SUMMARY.md](./SCHEMA_V2_UPDATE_SUMMARY.md)
- [SCHEMA_V2_COMPARISON.md](./SCHEMA_V2_COMPARISON.md)
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

---

## 📞 联系方式

如有疑问，请联系:
- 项目负责人：[待填写]
- DBA: [待填写]
- 后端开发：[待填写]

---

**最后更新日期**: 2026-03-23  
**版本**: v1.0  
**状态**: 草案
