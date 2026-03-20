-- 初始化实际可运行的游戏数据
-- 基于 game-list.json，只保留实际有代码的游戏

-- 清理旧的游戏数据（可选）
-- DELETE FROM t_game WHERE game_code IN ('SNAKE_VUE3');

-- 插入贪吃蛇游戏（独立部署）
INSERT INTO t_game (
    game_code,
    game_name,
    category,
    grade,
    icon_url,
    cover_url,
    description,
    game_url,
    module_path,
    status,
    sort_order,
    consume_points_per_minute,
    create_time,
    update_time
) VALUES (
    'SNAKE_VUE3',
    '贪吃蛇大冒险',
    'PUZZLE',
    '一年级',
    '/images/games/snake-vue3/snake-icon.png',
    '',
    '经典贪吃蛇游戏，控制小蛇吃食物，不断变长，挑战最高分！支持多种难度和稀有食物。',
    'http://localhost:3003',
    NULL,
    1,
    1,
    1,
    UNIX_TIMESTAMP() * 1000,
    UNIX_TIMESTAMP() * 1000
) ON DUPLICATE KEY UPDATE
    game_name = VALUES(game_name),
    category = VALUES(category),
    grade = VALUES(grade),
    icon_url = VALUES(icon_url),
    description = VALUES(description),
    game_url = VALUES(game_url),
    status = VALUES(status),
    sort_order = VALUES(sort_order),
    update_time = VALUES(update_time);

-- 验证插入结果
SELECT game_id, game_code, game_name, category, grade, game_url, status
FROM t_game
WHERE game_code IN ('SNAKE_VUE3')
ORDER BY sort_order;
