-- =============================================
-- 游戏注册脚本
-- 执行方式: mysql -u root -p kids_game < register-game.sql
-- =============================================

-- 游戏配置变量（修改这里）
SET @GAME_ID = '__GAME_ID__';
SET @GAME_NAME = '__GAME_NAME__';
SET @GAME_CODE = '__GAME_CODE__';
SET @GAME_EMOJI = '__EMOJI__';
SET @GAME_DESC = '__DESCRIPTION__';

-- =============================================
-- 以下内容通常不需要修改
-- =============================================

-- 1. 创建游戏记录（如果不存在）
INSERT IGNORE INTO game (
    id,
    name,
    code,
    icon,
    description,
    status,
    difficulty_count,
    created_at,
    updated_at
) VALUES (
    @GAME_ID,
    @GAME_NAME,
    @GAME_CODE,
    @GAME_EMOJI,
    @GAME_DESC,
    'ACTIVE',
    3,
    NOW(),
    NOW()
);

-- 2. 创建游戏难度配置
INSERT IGNORE INTO game_difficulty (
    game_id,
    difficulty_id,
    name,
    grid_cols,
    grid_rows,
    speed,
    initial_lives,
    score_multiplier
) VALUES
(@GAME_ID, 'easy', '简单', 15, 12, 300, 3, 1.0),
(@GAME_ID, 'normal', '普通', 20, 15, 200, 3, 1.5),
(@GAME_ID, 'hard', '困难', 25, 18, 150, 2, 2.0);

-- 3. 创建默认主题
INSERT IGNORE INTO theme (
    id,
    name,
    game_id,
    type,
    status,
    creator_id,
    created_at,
    updated_at
) VALUES (
    CONCAT(@GAME_ID, '-default'),
    CONCAT(@GAME_NAME, '-默认主题'),
    @GAME_ID,
    'DEFAULT',
    'APPROVED',
    1,
    NOW(),
    NOW()
);

-- 验证结果
SELECT '游戏注册完成！' AS status;
SELECT * FROM game WHERE id = @GAME_ID;
SELECT * FROM game_difficulty WHERE game_id = @GAME_ID;
