-- ============================================
-- 打蛇解压 H5 游戏 - 关卡配置数据初始化
-- 用途：存储所有关卡的详细参数配置
-- ============================================

-- 获取游戏 ID
SET @snake_shooter_game_id = (SELECT game_id FROM t_game WHERE game_code = 'snake-shooter');

-- 如果游戏不存在，先插入游戏记录
IF @snake_shooter_game_id IS NULL THEN
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
  SET @snake_shooter_game_id = LAST_INSERT_ID();
END IF;

-- ============================================
-- 1. 基础参数配置
-- ============================================

INSERT INTO t_game_config (game_id, config_key, config_value, description, create_time, update_time) VALUES
(@snake_shooter_game_id, 'base_damage', '2', '基础子弹伤害 (点/发)', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@snake_shooter_game_id, 'base_fire_rate', '0.5', '基础射速 (秒/发)', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@snake_shooter_game_id, 'bullet_speed', '300', '子弹飞行速度 (像素/秒)', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@snake_shooter_game_id, 'turret_move_speed', '200', '炮台移动速度 (像素/秒)', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@snake_shooter_game_id, 'snake_base_speed', '50', '蛇基础移动速度 (像素/秒)', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@snake_shooter_game_id, 'snake_wave_amplitude', '30', '蛇波浪移动幅度 (像素)', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@snake_shooter_game_id, 'points_per_joint', '10', '击碎一节蛇身的积分', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@snake_shooter_game_id, 'joint_radius', '12', '蛇关节碰撞半径 (像素)', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@snake_shooter_game_id, 'bullet_radius', '5', '子弹碰撞半径 (像素)', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@snake_shooter_game_id, 'turret_container_size', '40', '炮台容器大小 (像素)', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000);

-- ============================================
-- 2. 关卡梯度配置 (JSON 格式)
-- ============================================

INSERT INTO t_game_config (game_id, config_key, config_value, description, create_time, update_time) VALUES
(@snake_shooter_game_id, 'level_gradient_config', '{
  "intervals": [
    {
      "level_range": [1, 5],
      "joint_hp": 10,
      "joint_count_min": 10,
      "joint_count_max": 25,
      "speed_multiplier": 1.0,
      "fire_rate_multiplier": 1.0,
      "damage_multiplier": 1.0
    },
    {
      "level_range": [6, 10],
      "joint_hp": 20,
      "joint_count_min": 26,
      "joint_count_max": 40,
      "speed_multiplier": 1.1,
      "fire_rate_multiplier": 0.95,
      "damage_multiplier": 1.0
    },
    {
      "level_range": [11, 15],
      "joint_hp": 30,
      "joint_count_min": 41,
      "joint_count_max": 55,
      "speed_multiplier": 1.2,
      "fire_rate_multiplier": 0.9,
      "damage_multiplier": 1.1
    },
    {
      "level_range": [16, 999],
      "joint_hp": 40,
      "joint_count_min": 56,
      "joint_count_max": 80,
      "speed_multiplier": 1.3,
      "fire_rate_multiplier": 0.85,
      "damage_multiplier": 1.2
    }
  ]
}', '关卡梯度配置 (JSON)', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000);

-- ============================================
-- 3. 排行榜维度配置
-- ============================================

INSERT INTO t_leaderboard_dimension (game_id, dimension_code, dimension_name, sort_order, data_type, icon, description, create_time, update_time) VALUES
(@snake_shooter_game_id, 'highest_level', '最高关卡', 1, 'INT', '🏆', '通关的最高关卡数', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@snake_shooter_game_id, 'total_score', '总积分', 2, 'INT', '⭐', '累计获得的总积分', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@snake_shooter_game_id, 'total_joints_destroyed', '摧毁关节总数', 3, 'INT', '💥', '累计击碎的蛇关节数量', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000);

-- ============================================
-- 4. 游戏模式配置
-- ============================================

INSERT INTO t_game_mode_config (game_id, mode_type, mode_name, enabled, config_json, sort_order, create_time, update_time) VALUES
(@snake_shooter_game_id, 'single_player', '单机模式', 1, '{"aiDifficulty": null, "infinite_levels": true, "allow_pause": true}', 1, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000);

-- ============================================
-- 验证数据已插入
-- ============================================

SELECT '✅ 关卡配置初始化完成!' AS status;

-- 查看基础参数配置
SELECT config_key, config_value, description 
FROM t_game_config 
WHERE game_id = @snake_shooter_game_id 
  AND config_key != 'level_gradient_config'
ORDER BY config_key;

-- 查看排行榜维度
SELECT dimension_code, dimension_name, data_type, icon, description 
FROM t_leaderboard_dimension 
WHERE game_id = @snake_shooter_game_id 
ORDER BY sort_order;

-- 查看游戏模式
SELECT mode_type, mode_name, enabled, sort_order 
FROM t_game_mode_config 
WHERE game_id = @snake_shooter_game_id;
