-- Meow Fuzzyface 游戏初始化脚本
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
    'meow-fuzzyface',
    '猫咪大作战',
    '一款类似 Vampire Survivors 的生存游戏，躲避怪物，收集道具，升级角色！',
    'action',
    '1-6',
    '/games/meow-fuzzyface',
    'http://localhost:5180',
    '/images/meow-fuzzyface.png',
    'on_sale',
    'all',
    'meow-fuzzyface',
    '../games',
    'default',
    'single_player',
    '{"fps": 60, "pixelArt": true}'
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