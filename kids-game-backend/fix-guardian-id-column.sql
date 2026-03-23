-- ================================================
-- t_user_control_config 表 guardian_id 字段修复脚本
-- 日期：2026-03-23
-- 问题：Unknown column 'guardian_id' in 'field list'
-- ================================================

-- ================================================
-- 1. 检查当前表结构
-- ================================================

-- 查看当前表结构
DESC t_user_control_config;

-- 检查是否有 guardian_id 字段
SELECT COLUMN_NAME 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'kids_game_db' 
  AND TABLE_NAME = 't_user_control_config' 
  AND COLUMN_NAME = 'guardian_id';

-- ================================================
-- 2. 添加 guardian_id 字段（如果不存在）
-- ================================================

-- 方式 1: 使用 ALTER TABLE ADD COLUMN IF NOT EXISTS (MySQL 8.0+)
ALTER TABLE t_user_control_config
ADD COLUMN IF NOT EXISTS guardian_id BIGINT COMMENT '监护人用户 ID' AFTER user_id;

-- 方式 2: 直接 ALTER TABLE（适用于所有 MySQL 版本）
-- ⚠️ 注意：如果字段已存在会报错，请先检查
-- ALTER TABLE t_user_control_config
-- ADD COLUMN guardian_id BIGINT COMMENT '监护人用户 ID' AFTER user_id;

-- ================================================
-- 3. 添加索引和约束
-- ================================================

-- 添加索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_guardian_id ON t_user_control_config(guardian_id);

-- 添加唯一约束（如果不存在）
-- ⚠️ 注意：先检查是否已有同名索引
SHOW INDEX FROM t_user_control_config WHERE Key_name = 'uk_user_guardian';

-- 如果需要添加唯一约束
ALTER TABLE t_user_control_config
ADD UNIQUE KEY uk_user_guardian (user_id, guardian_id, deleted);

-- ================================================
-- 4. 验证修复结果
-- ================================================

-- 再次查看表结构
DESC t_user_control_config;

-- 验证 guardian_id 字段是否存在
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'kids_game_db' 
  AND TABLE_NAME = 't_user_control_config' 
  AND COLUMN_NAME = 'guardian_id';

-- 验证索引
SHOW INDEX FROM t_user_control_config;

-- ================================================
-- 5. 测试查询
-- ================================================

-- 测试包含 guardian_id 的查询
SELECT 
    config_id,
    user_id,
    guardian_id,
    daily_duration,
    single_duration
FROM t_user_control_config
LIMIT 5;

-- 测试关联查询
SELECT 
    c.config_id,
    c.user_id,
    c.guardian_id,
    u.username AS guardian_username,
    u.nickname AS guardian_nickname
FROM t_user_control_config c
LEFT JOIN t_user u ON c.guardian_id = u.user_id
WHERE c.deleted = 0
LIMIT 5;

-- ================================================
-- 6. 完成提示
-- ================================================

SELECT 'guardian_id 字段添加完成！' AS fix_status,
       NOW() AS completion_time;
