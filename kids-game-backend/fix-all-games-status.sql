-- ============================================
-- 批量修复游戏状态 - 将待审核游戏改为已上架
-- 说明：解决 "游戏不存在或已下架" 错误
-- 执行时间：2026-03-24
-- ============================================

-- 1. 备份当前数据（可选）
-- UPDATE t_game 
-- SET status_backup = status,
--     update_time = UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000
-- WHERE status = 1;

-- 2. 将所有状态为 1 (待审核) 的游戏更新为状态 2 (已上架)
-- 注意：仅更新应该上架的游戏，可以根据 game_code 或其他条件过滤
UPDATE t_game 
SET status = 2,  -- ON_SALE
    update_time = UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000,
    publish_time = COALESCE(publish_time, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000)
WHERE status = 1;  -- 只更新待审核状态的游戏

-- 3. 验证更新结果
SELECT 
    game_id,
    game_code,
    game_name,
    status AS status_code,
    CASE status
        WHEN 0 THEN '草稿'
        WHEN 1 THEN '待审核'
        WHEN 2 THEN '已上架'
        WHEN 3 THEN '已下架'
        WHEN 4 THEN '审核驳回'
        ELSE '未知'
    END AS status_desc,
    FROM_UNIXTIME(publish_time / 1000) AS publish_time_str,
    FROM_UNIXTIME(update_time / 1000) AS update_time_str
FROM t_game
ORDER BY game_id DESC
LIMIT 20;

-- 4. 统计信息
SELECT 
    CASE status
        WHEN 0 THEN '草稿'
        WHEN 1 THEN '待审核'
        WHEN 2 THEN '已上架'
        WHEN 3 THEN '已下架'
        WHEN 4 THEN '审核驳回'
        ELSE '未知'
    END AS status_desc,
    COUNT(*) AS count
FROM t_game
GROUP BY status;

-- ============================================
-- 执行完成后，请检查:
-- 1. 确认没有重要游戏被误上架
-- 2. 如有需要下架的游戏，执行:
--    UPDATE t_game SET status = 3 WHERE game_code = 'xxx';
-- ============================================
