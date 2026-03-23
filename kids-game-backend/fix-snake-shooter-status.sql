-- ============================================
-- 修复游戏状态 - 将待审核游戏改为已上架
-- 说明：解决 "游戏不存在或已下架" 错误
-- ============================================

-- 将所有状态为 1 (待审核) 的 game_code='snake-shooter' 游戏更新为状态 2 (已上架)
UPDATE t_game 
SET status = 2,  -- ON_SALE
    update_time = UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000,
    publish_time = UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000
WHERE game_code = 'snake-shooter' 
  AND status = 1;  -- 只更新待审核状态的游戏

-- 验证更新结果
SELECT 
    game_id,
    game_code,
    game_name,
    status,
    CASE status
        WHEN 0 THEN '草稿'
        WHEN 1 THEN '待审核'
        WHEN 2 THEN '已上架'
        WHEN 3 THEN '已下架'
        WHEN 4 THEN '审核驳回'
        ELSE '未知'
    END AS status_desc,
    publish_time,
    update_time
FROM t_game
WHERE game_code = 'snake-shooter';
