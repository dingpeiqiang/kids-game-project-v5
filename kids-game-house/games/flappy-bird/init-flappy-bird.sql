-- Flappy Bird 游戏初始化脚本
-- 运行此脚本在数据库中注册游戏

INSERT INTO t_game (
    game_code,
    game_name,
    description,
    category,
    grade_range,
    resource_url,
    game_url,
    image_url,
    status,
    applicable_scope,
    module_path,
    base_games_path,
    scene_class,
    supported_modes,
    game_config
) VALUES (
    'flappy-bird',
    'Flappy Bird',
    '经典 Flappy Bird 小鸟飞翔游戏，点击屏幕让小鸟飞起来，穿过管道缝隙获得分数！',
    'arcade',
    '1-6',
    '/games/flappy-bird',
    '/games/flappy-bird/index.html',
    '/images/flappy-bird.png',
    'on_sale',
    'all',
    'flappy-bird',
    '../games',
    'default',
    'single_player',
    '{"fps": 60, "pixelArt": true, "pipeGap": 150, "pipeSpeed": 200, "gravity": 400, "jumpVelocity": -300}'
) ON DUPLICATE KEY UPDATE
    game_name = VALUES(game_name),
    description = VALUES(description),
    category = VALUES(category),
    grade_range = VALUES(grade_range),
    resource_url = VALUES(resource_url),
    game_url = VALUES(game_url),
    image_url = VALUES(image_url),
    status = VALUES(status),
    applicable_scope = VALUES(applicable_scope),
    module_path = VALUES(module_path),
    base_games_path = VALUES(base_games_path),
    supported_modes = VALUES(supported_modes),
    game_config = VALUES(game_config);
