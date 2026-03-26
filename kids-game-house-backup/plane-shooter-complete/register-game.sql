-- ============================================
-- 贪吃蛇游戏注册 SQL 脚本
-- 说明：将贪吃蛇游戏注册到数据库 t_game 表
-- 创建时间：2026-03-13
-- ============================================

-- 1. 创建游戏记录
INSERT INTO t_game(game_code, game_name, category, grade, icon_url, cover_url, description, status, sort_order, consume_points_per_minute, module_path, create_time, update_time)
VALUES(
    'SNAKE_VUE3', 
    '贪吃蛇大冒险', 
    'puzzle', 
    'primary',  -- 适龄阶段：小学
    '/images/games/snake_icon.png',
    '/images/games/snake_icon.png',  -- 封面暂时使用同一图标
    '经典贪吃蛇游戏，控制小蛇吃食物，不断变长，挑战最高分！支持多种难度和稀有食物。锻炼手眼协调能力和反应速度！',
    1,  -- status: 1=启用
    5,  -- sort_order: 排序顺序
    1,  -- consume_points_per_minute: 每分钟消耗 1 点疲劳值
    '../games/snake-vue3/SnakeGame',
    UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000,
    UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000
);

-- 获取刚插入的游戏 ID
SET @game_id = LAST_INSERT_ID();

-- 2. 游戏基础参数配置
INSERT INTO t_game_config(game_id, config_key, config_value, description, create_time, update_time) VALUES
-- 游戏基础参数
(@game_id, 'grid_width', '30', '游戏区域宽度 (格子)', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@game_id, 'grid_height', '20', '游戏区域高度 (格子)', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@game_id, 'cell_size', '20', '每个格子大小 (像素)', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@game_id, 'initial_length', '3', '蛇初始长度', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@game_id, 'win_score', '1000', '获胜目标分数', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),

-- 难度配置
(@game_id, 'easy_mode', '{"speed": 150, "score_multiplier": 1.0, "rare_food_chance": 0.3}', '简单模式：速度慢，稀有食物概率高', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@game_id, 'normal_mode', '{"speed": 100, "score_multiplier": 1.5, "rare_food_chance": 0.2}', '普通模式：中等速度，平衡配置', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@game_id, 'hard_mode', '{"speed": 60, "score_multiplier": 2.0, "rare_food_chance": 0.1}', '困难模式：速度快，稀有食物概率低', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),

-- 积分配置（JSON 格式）
(@game_id, 'points_config', '{"apple": 10, "strawberry": 30, "coin": 50}', '不同类型食物的积分配置', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),

-- 颜色配置（JSON 格式）
(@game_id, 'colors_config', '{"snake_head": "#4ade80", "snake_body_start": "#4ade80", "snake_body_end": "#059669", "food_apple": "#ef4444", "food_strawberry": "#fbbf24", "food_coin": "#3b82f6", "grid_background": "#1e293b", "grid_line": "#334155"}', '游戏颜色配置', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),

-- 控制配置
(@game_id, 'enable_touch_control', '1', '是否启用触摸控制 (1-启用，0-禁用)', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@game_id, 'enable_keyboard_control', '1', '是否启用键盘控制 (1-启用，0-禁用)', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),

-- 食物出现概率配置
(@game_id, 'food_chance', '{"apple": 0.7, "strawberry": 0.2, "coin": 0.1}', '不同类型食物的出现概率', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),

-- 游戏规则配置
(@game_id, 'max_snake_length', '100', '蛇的最大长度限制', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@game_id, 'speed_increase_factor', '0.95', '分数增加时速度倍率（越小越快）', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000);

-- 3. 排行榜维度配置
INSERT INTO t_leaderboard_dimension(game_id, dimension_code, dimension_name, sort_order, data_type, icon, description, create_time, update_time) VALUES
(@game_id, 'highest_score', '最高分数', 1, 'INT', '🏆', '单局游戏获得的最高分数', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@game_id, 'total_score', '累计分数', 2, 'INT', '💰', '所有游戏累计总分数', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@game_id, 'games_played', '游戏次数', 3, 'INT', '🎮', '总游戏次数', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@game_id, 'longest_snake', '最长蛇身', 4, 'INT', '🐍', '最长的蛇身长度', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@game_id, 'total_food_eaten', '总食物数', 5, 'INT', '🍎', '累计吃到的食物总数', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000);

-- 4. 游戏模式配置
INSERT INTO t_game_mode_config(game_id, mode_type, mode_name, enabled, config_json, sort_order, create_time, update_time) VALUES
-- 单机模式
(@game_id, 'single_player', '单机模式', 1, 
 '{"difficulty": "normal", "time_limit": 0, "ai_enabled": false, "max_players": 1, "min_players": 1, "grid_width": 30, "grid_height": 20}', 
 1,
 UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000,
 UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),

-- 本地对战模式
(@game_id, 'local_battle', '本地对战', 1, 
 '{"difficulty": "normal", "time_limit": 300, "ai_enabled": false, "max_players": 2, "min_players": 2, "grid_width": 15, "grid_height": 20, "split_screen": true, "score_to_win": 500}', 
 2,
 UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000,
 UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000);

-- 5. 疲劳度配置（每分钟消耗点数）
INSERT INTO t_game_config(game_id, config_key, config_value, description, create_time, update_time) VALUES
(@game_id, 'consume_points_per_minute', '1', '每分钟消耗疲劳点数', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000);

-- ============================================
-- 验证查询
-- ============================================
-- SELECT * FROM t_game WHERE game_code = 'SNAKE_VUE3';
-- SELECT * FROM t_game_config WHERE game_id = @game_id ORDER BY config_key;
-- SELECT * FROM t_leaderboard_dimension WHERE game_id = @game_id;
-- SELECT * FROM t_game_mode_config WHERE game_id = @game_id;

-- ============================================
-- 说明:
-- 1. 执行此 SQL 后，游戏将注册到数据库中
-- 2. 前端会通过 UnifiedGameManager 动态加载该游戏
-- 3. 游戏使用 Vue3 + Canvas 实现，支持响应式设计
-- 4. 游戏配置可通过 admin 后台进行修改
