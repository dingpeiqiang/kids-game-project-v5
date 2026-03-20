-- 更新游戏 URL 为统一服务器地址

-- 贪吃蛇
UPDATE t_game
SET game_url = 'http://localhost:3000/games/snake-vue3'
WHERE game_code = 'SNAKE_VUE3';

-- 验证更新结果
SELECT
    game_id AS ID,
    game_code AS 游戏代码,
    game_name AS 游戏名称,
    game_url AS 访问地址,
    category AS 分类,
    grade AS 年级,
    status AS 状态
FROM t_game
WHERE game_code = 'SNAKE_VUE3'
ORDER BY sort_order;
