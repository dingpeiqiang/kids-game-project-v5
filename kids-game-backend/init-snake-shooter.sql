-- ============================================
-- 打蛇解压 H5 游戏 - 数据库初始化脚本
-- 版本：V1.0 (阶段 1: 核心玩法原型)
-- 说明：炮台射击类解压游戏，独立于现有贪吃蛇
-- ============================================

-- 1. 创建游戏记录
INSERT INTO t_game(game_code, game_name, category, icon_url, cover_url, description, status, sort_order, module_path, create_time, update_time)
VALUES(
    'snake-shooter', 
    '打蛇解压', 
    'casual', 
    '/images/games/snake_shooter_icon.png',
    '/images/games/snake_shooter_cover.jpg',
    '控制炮台射击蛇关节，无限闯关的解压神器！无需操作自动射击，体验关节破碎的爽快感！',
  1,  -- status: 1=启用
  1,  -- sort_order
   '../games/snake-shooter/SnakeShooterGame',
  UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000,
  UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000
);

-- 获取刚插入的游戏 ID
SET @game_id = LAST_INSERT_ID();

-- 2. 游戏基础参数配置
INSERT INTO t_game_config(game_id, config_key, config_value, description) VALUES
-- 基础战斗参数
(@game_id, 'base_damage', '2', '基础子弹伤害 (点/发)'),
(@game_id, 'base_fire_rate', '0.5', '基础射速 (秒/发)'),
(@game_id, 'bullet_count', '1', '基础发射子弹数量'),
(@game_id, 'bullet_speed', '300', '子弹飞行速度 (像素/秒)'),

-- 蛇基础参数
(@game_id, 'base_joint_hp', '10', '基础关节血量 (1-5 关)'),
(@game_id, 'base_snake_joints', '10', '基础蛇关节数量'),
(@game_id, 'snake_move_speed', '50', '蛇移动速度 (像素/秒)'),
(@game_id, 'wave_amplitude', '30', '波浪移动幅度 (像素)'),

-- 炮台参数
(@game_id, 'turret_move_speed', '200', '炮台移动速度 (像素/秒)'),
(@game_id, 'turret_rotate_speed', '3.0', '炮台旋转速度 (弧度/秒)'),
(@game_id, 'turret_width', '40', '炮台宽度 (像素)'),
(@game_id, 'turret_height', '40', '炮台高度 (像素)'),

-- 关卡梯度配置 (JSON 格式存储详细参数)
(@game_id, 'level_1_to_5', '{"joint_hp":10,"joint_count_min":10,"joint_count_max":25,"speed_multiplier":1.0}', '1-5 关配置：血量/节数范围/速度倍率'),
(@game_id, 'level_6_to_10', '{"joint_hp":20,"joint_count_min":26,"joint_count_max":40,"speed_multiplier":1.1}', '6-10 关配置'),
(@game_id, 'level_11_to_15', '{"joint_hp":30,"joint_count_min":41,"joint_count_max":55,"speed_multiplier":1.2}', '11-15 关配置'),
(@game_id, 'level_16_plus', '{"joint_hp":40,"joint_count_min":56,"joint_count_increment":5,"speed_multiplier":1.3}', '16+ 关配置');

-- 3. 排行榜维度配置
INSERT INTO t_leaderboard_dimension(game_id, dimension_code, dimension_name, sort_order, data_type, icon, description) VALUES
(@game_id, 'highest_level', '最高关卡', 1, 'INT', '🏆', '通关的最高关卡数（核心排序维度）'),
(@game_id, 'total_score', '总积分', 2, 'INT', '⭐', '累计获得的总积分（每节蛇对应固定积分）');

-- 4. 游戏模式配置（单机模式）
INSERT INTO t_game_mode_config(game_id, mode_type, mode_name, enabled, config_json, sort_order) VALUES
(@game_id, 'single_player', '单机模式', 1, 
 '{"aiDifficulty": null, "aiResponseDelay": null, "aiErrorRate": null, "infinite_levels": true, "score_per_joint": 10}', 
 1);

-- 5. 初始化默认数据（可选：用于测试）
-- INSERT INTO t_user_game_record(user_id, game_id, highest_level, total_score, play_count) 
-- VALUES (1, @game_id, 0, 0, 0)
-- ON DUPLICATE KEY UPDATE update_time = UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000;

-- ============================================
-- 验证查询
-- ============================================
-- SELECT * FROM t_game WHERE game_code = 'snake-shooter';
-- SELECT * FROM t_game_config WHERE game_id = @game_id ORDER BY config_key;
-- SELECT * FROM t_leaderboard_dimension WHERE game_id = @game_id;
-- SELECT * FROM t_game_mode_config WHERE game_id = @game_id;
