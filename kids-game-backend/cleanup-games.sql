-- 删除未实现的占位游戏
-- 这些游戏没有实际代码实现，需要从数据库中清理

-- 删除数字拼图
DELETE FROM t_game WHERE game_code = 'NUMBER_PUZZLE';

-- 删除图形匹配
DELETE FROM t_game WHERE game_code = 'SHAPE_MATCH';

-- 删除数学闯关
DELETE FROM t_game WHERE game_code = 'MATH_CHALLENGE';

-- 删除打地鼠
DELETE FROM t_game WHERE game_code = 'WHACK_A_MOLE';

-- 删除英语单词卡片
DELETE FROM t_game WHERE game_code = 'ENGLISH_CARDS';

-- 删除探险岛屿
DELETE FROM t_game WHERE game_code = 'ADVENTURE_ISLAND';

-- 验证删除结果
SELECT '删除后剩余的游戏:' AS info;
SELECT game_id, game_code, game_name, category, game_url, status
FROM t_game
ORDER BY sort_order;

-- 只保留以下1个实际可运行的游戏:
SELECT game_id, game_code, game_name, category, game_url, status
FROM t_game
WHERE game_code IN ('SNAKE_VUE3')
ORDER BY sort_order;
