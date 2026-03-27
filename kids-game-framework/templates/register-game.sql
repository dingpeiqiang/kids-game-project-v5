-- ============================================
-- 游戏注册 SQL 脚本模板
-- 说明：将游戏注册到数据库 t_game 表
-- 表结构参考：schema_v2.sql
-- 使用方法：
--   1. 复制此文件并重命名为 {game_code}.sql
--   2. 替换下方的 {{PLACEHOLDER}} 变量
--   3. 在数据库中执行
-- ============================================

-- 1. 创建游戏记录（t_game 表）
INSERT INTO t_game(
    game_code,
    game_name,
    category,
    grade,
    tags,
    is_featured,
    creator_id,
    publish_time,
    min_fatigue_to_start,
    icon_url,
    cover_url,
    resource_url,
    description,
    module_path,
    game_url,
    game_secret,
    game_config,
    status,
    sort_order,
    consume_points_per_minute,
    online_count,
    create_time,
    update_time,
    deleted
) VALUES(
    '{{GAME_CODE}}',              -- 游戏代码，如：SNAKE, TETRIS
    '{{GAME_NAME}}',              -- 游戏中文名，如：贪吃蛇
    '{{CATEGORY}}',               -- 分类：MATH, LANGUAGE, SCIENCE, ART, ARCADE
    'primary',                    -- 适龄阶段：primary(小学), junior(初中), senior(高中)
    '{{TAGS}}',                  -- 标签列表（逗号分隔），如：经典,休闲,益智
    0,                           -- is_featured: 0-否，1-是
    NULL,                        -- creator_id: 创建人ID
    UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000,  -- publish_time: 上架时间
    0,                           -- min_fatigue_to_start: 启动所需最低疲劳度
    '/images/games/{{GAME_CODE}}_icon.png',
    '/images/games/{{GAME_CODE}}_cover.png',
    '/games/{{GAME_PATH}}',      -- 资源 CDN 地址
    '{{DESCRIPTION}}',            -- 游戏简介
    '../games/{{GAME_PATH}}',    -- 前端模块路径
    '{{GAME_URL}}',               -- game_url: 游戏访问地址（独立部署时使用）
    '{{GAME_SECRET}}',            -- game_secret: 游戏密钥
    NULL,                        -- game_config: 游戏配置 JSON
    2,                           -- status: 0-草稿，1-待审核，2-已上架，3-已下架，4-审核驳回
    {{SORT_ORDER}},              -- 排序顺序，数字越小越靠前
    {{CONSUME_POINTS}},          -- 每分钟消耗疲劳值点数
    0,                           -- online_count: 在线人数
    UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000,
    UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000,
    0                            -- deleted: 逻辑删除
);

-- 获取刚插入的游戏 ID
SET @game_id = LAST_INSERT_ID();

-- 2. 游戏基础参数配置（t_game_config 表）
INSERT INTO t_game_config(
    game_id,
    config_key,
    config_value,
    description,
    create_time,
    update_time,
    deleted
) VALUES
-- 游戏区域参数
(@game_id, 'grid_width', '{{GRID_WIDTH}}', '游戏区域宽度 (格子)', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, 0),
(@game_id, 'grid_height', '{{GRID_HEIGHT}}', '游戏区域高度 (格子)', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, 0),
(@game_id, 'cell_size', '{{CELL_SIZE}}', '每个格子大小 (像素)', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, 0),

-- 难度配置（JSON 格式）
(@game_id, 'easy_mode', '{"speed": {{EASY_SPEED}}, "score_multiplier": {{EASY_MULTIPLIER}}}', '简单模式配置', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, 0),
(@game_id, 'normal_mode', '{"speed": {{NORMAL_SPEED}}, "score_multiplier": {{NORMAL_MULTIPLIER}}}', '普通模式配置', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, 0),
(@game_id, 'hard_mode', '{"speed": {{HARD_SPEED}}, "score_multiplier": {{HARD_MULTIPLIER}}}', '困难模式配置', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, 0),

-- 控制配置
(@game_id, 'enable_touch_control', '{{ENABLE_TOUCH}}', '是否启用触摸控制 (1=启用, 0=禁用)', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, 0),
(@game_id, 'enable_keyboard_control', '{{ENABLE_KEYBOARD}}', '是否启用键盘控制 (1=启用, 0=禁用)', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, 0);

-- 3. 排行榜维度配置（t_leaderboard_config 表）
INSERT INTO t_leaderboard_config(
    game_id,
    dimension_code,
    dimension_name,
    dimension_type,
    sort_order,
    is_enabled,
    create_time,
    update_time,
    deleted
) VALUES
(@game_id, 'highest_score', '最高分数', 'SCORE', 1, 1, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, 0),
(@game_id, 'total_score', '累计分数', 'SCORE', 2, 1, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, 0),
(@game_id, 'games_played', '游戏次数', 'COUNT', 3, 1, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, 0);

-- 4. 游戏模式配置（t_game_mode_config 表）
INSERT INTO t_game_mode_config(
    game_id,
    mode_type,
    mode_name,
    enabled,
    config_json,
    sort_order,
    create_time,
    update_time,
    deleted
) VALUES
(@game_id, 'single_player', '单机模式', 1, '{"difficulty": "normal", "time_limit": 0, "ai_enabled": false, "max_players": 1, "min_players": 1}', 1, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, 0);

-- ============================================
-- 变量说明：
-- {{GAME_CODE}}       - 游戏代码（大写字母+下划线，如 SNAKE）
-- {{GAME_NAME}}       - 游戏中文名
-- {{CATEGORY}}        - 游戏分类：MATH, LANGUAGE, SCIENCE, ART, ARCADE
-- {{TAGS}}            - 标签列表（逗号分隔），如：经典,休闲,益智
-- {{DESCRIPTION}}     - 游戏简介
-- {{SORT_ORDER}}      - 排序数字
-- {{CONSUME_POINTS}}  - 每分钟消耗疲劳值
-- {{GAME_PATH}}       - 游戏目录路径
-- {{GRID_WIDTH}}      - 游戏区域宽度（格子数）
-- {{GRID_HEIGHT}}     - 游戏区域高度（格子数）
-- {{CELL_SIZE}}       - 格子像素大小
-- {{EASY_SPEED}}      - 简单模式速度
-- {{EASY_MULTIPLIER}} - 简单模式得分倍率
-- {{NORMAL_SPEED}}    - 普通模式速度
-- {{NORMAL_MULTIPLIER}}- 普通模式得分倍率
-- {{HARD_SPEED}}      - 困难模式速度
-- {{HARD_MULTIPLIER}} - 困难模式得分倍率
-- {{ENABLE_TOUCH}}    - 是否启用触摸（1或0）
-- {{ENABLE_KEYBOARD}} - 是否启用键盘（1或0）

-- ============================================
-- 验证查询
-- ============================================
-- SELECT * FROM t_game WHERE game_code = '{{GAME_CODE}}';
-- SELECT * FROM t_game_config WHERE game_id = @game_id;
-- SELECT * FROM t_leaderboard_config WHERE game_id = @game_id;
-- SELECT * FROM t_game_mode_config WHERE game_id = @game_id;
