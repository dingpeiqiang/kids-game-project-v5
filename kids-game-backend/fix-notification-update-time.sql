-- ================================================
-- t_notification 表 update_time 字段默认值修复脚本
-- 日期：2026-03-23
-- 问题：Field 'update_time' doesn't have a default value
-- ================================================

-- ================================================
-- 1. 检查当前表结构
-- ================================================

-- 查看表结构
DESC t_notification;

-- 检查 update_time 字段的定义
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'kids_game_db' 
  AND TABLE_NAME = 't_notification' 
  AND COLUMN_NAME IN ('create_time', 'update_time');

-- ================================================
-- 2. 修复方案 1: 修改字段添加默认值（推荐）
-- ================================================

-- 为 update_time 添加默认值（当前时间戳毫秒）
ALTER TABLE t_notification
MODIFY COLUMN update_time BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间';

-- ================================================
-- 3. 修复方案 2: 如果方案 1 不支持，使用此方式
-- ================================================

-- 备选方案：先删除再添加（不推荐，会丢失数据）
-- ⚠️ 仅在方案 1 失败时使用
/*
ALTER TABLE t_notification
DROP COLUMN update_time;

ALTER TABLE t_notification
ADD COLUMN update_time BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间' AFTER create_time;
*/

-- ================================================
-- 4. 验证修复结果
-- ================================================

-- 再次查看表结构
DESC t_notification;

-- 验证字段默认值
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'kids_game_db' 
  AND TABLE_NAME = 't_notification' 
  AND COLUMN_NAME IN ('create_time', 'update_time');

-- ================================================
-- 5. 测试 INSERT 操作
-- ================================================

-- 测试不指定 update_time 的 INSERT（应该成功）
INSERT INTO t_notification (
    user_id, 
    user_type, 
    type, 
    title, 
    content, 
    status, 
    is_read, 
    create_time, 
    deleted
) VALUES (
    1, 
    0, 
    'TEST', 
    '测试通知', 
    '这是一条测试通知', 
    0, 
    0, 
    UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, 
    0
);

-- 验证插入的数据
SELECT 
    notification_id,
    user_id,
    title,
    create_time,
    update_time,
    FROM_UNIXTIME(create_time / 1000) AS create_time_formatted,
    FROM_UNIXTIME(update_time / 1000) AS update_time_formatted
FROM t_notification
WHERE title = '测试通知'
ORDER BY notification_id DESC
LIMIT 1;

-- 清理测试数据
DELETE FROM t_notification WHERE title = '测试通知';

-- ================================================
-- 6. 完成提示
-- ================================================

SELECT 't_notification 表 update_time 默认值修复完成！' AS fix_status,
       NOW() AS completion_time;
