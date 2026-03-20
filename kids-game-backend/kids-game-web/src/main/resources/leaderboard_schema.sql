-- ========================================
-- 通用游戏排行榜表
-- 支持任意游戏、多维度的排行榜
-- ========================================

-- 游戏排行榜配置表（定义每个游戏的排行维度）
DROP TABLE IF EXISTS t_leaderboard_config;
CREATE TABLE t_leaderboard_config (
    config_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '配置 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    dimension_code VARCHAR(50) NOT NULL COMMENT '维度代码：SCORE/HIGHEST_LEVEL/DURATION/ACCURACY 等',
    dimension_name VARCHAR(100) NOT NULL COMMENT '维度名称：如"最高分"/"最高关卡"/"最长时长"/"正确率"',
    sort_order VARCHAR(10) NOT NULL DEFAULT 'DESC' COMMENT '排序方式：ASC-升序，DESC-降序',
    data_type VARCHAR(20) NOT NULL DEFAULT 'INT' COMMENT '数据类型：INT/LONG/DECIMAL',
    icon VARCHAR(50) COMMENT '维度图标',
    description VARCHAR(255) COMMENT '维度描述',
    is_enabled INT DEFAULT 1 COMMENT '是否启用：0-否，1-是',
    display_order INT DEFAULT 0 COMMENT '显示顺序',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE KEY uk_game_dimension (game_id, dimension_code),
    INDEX idx_game_id (game_id),
    INDEX idx_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏排行榜配置表';

-- 游戏排行榜数据表（存储所有游戏的排行数据）
DROP TABLE IF EXISTS t_leaderboard_data;
CREATE TABLE t_leaderboard_data (
    data_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '数据 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    user_id BIGINT NOT NULL COMMENT '用户 ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    nickname VARCHAR(100) COMMENT '昵称',
    avatar_url VARCHAR(255) COMMENT '头像 URL',
    dimension_code VARCHAR(50) NOT NULL COMMENT '维度代码',
    dimension_value BIGINT NOT NULL COMMENT '维度值（统一用 BIGINT 存储，不同类型在应用层转换）',
    decimal_value DECIMAL(10,2) DEFAULT 0 COMMENT '小数值（用于百分比等精度要求高的场景）',
    rank_date VARCHAR(20) COMMENT '排行日期（YYYY-MM-DD，用于日榜）',
    rank_month VARCHAR(7) COMMENT '排行月份（YYYY-MM，用于月榜）',
    rank_year VARCHAR(4) COMMENT '排行年份（YYYY，用于年榜）',
    rank_type VARCHAR(20) DEFAULT 'ALL' COMMENT '排行类型：ALL-总榜，DAILY-日榜，MONTHLY-月榜，YEARLY-年榜',
    extra_data JSON COMMENT '额外数据（用于存储通关时间、使用角色等扩展信息）',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE KEY uk_game_user_dimension_rank (game_id, user_id, dimension_code, rank_type, rank_date, rank_month, rank_year),
    INDEX idx_game_dimension (game_id, dimension_code),
    INDEX idx_game_dimension_value (game_id, dimension_code, dimension_value),
    INDEX idx_user (user_id),
    INDEX idx_rank_type (rank_type),
    INDEX idx_rank_date (rank_date),
    INDEX idx_rank_month (rank_month),
    INDEX idx_rank_year (rank_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏排行榜数据表';

-- ========================================
-- 初始化排行榜配置示例
-- ========================================

-- 示例 1：打蛇游戏 - 积分排行榜
INSERT INTO t_leaderboard_config (game_id, dimension_code, dimension_name, sort_order, data_type, icon, description, is_enabled, display_order)
VALUES 
(11, 'TOTAL_SCORE', '总积分', 'DESC', 'INT', '🏆', '累计获得的总积分', 1, 1),
(11, 'HIGHEST_LEVEL', '最高关卡', 'DESC', 'INT', '🎯', '达到的最高关卡数', 1, 2);

-- 示例 2：数学大冒险 - 多个维度
INSERT INTO t_leaderboard_config (game_id, dimension_code, dimension_name, sort_order, data_type, icon, description, is_enabled, display_order)
VALUES 
(1, 'SCORE', '最高分数', 'DESC', 'INT', '🏆', '单局最高分数', 1, 1),
(1, 'ACCURACY', '正确率', 'DESC', 'DECIMAL', '🎯', '答题正确率（%）', 1, 2),
(1, 'SPEED', '最快完成', 'ASC', 'LONG', '⚡', '最短完成时间（秒）', 1, 3);

-- 示例 3：拼图游戏 - 多个维度
INSERT INTO t_leaderboard_config (game_id, dimension_code, dimension_name, sort_order, data_type, icon, description, is_enabled, display_order)
VALUES 
(4, 'COMPLETION_TIME', '最快完成', 'ASC', 'LONG', '⚡', '最短完成时间（秒）', 1, 1),
(4, 'MOVES', '最少步数', 'ASC', 'INT', '🎲', '最少移动步数', 1, 2);

-- ========================================
-- 使用说明
-- ========================================
-- 1. 新增游戏时，在 t_leaderboard_config 表中配置该游戏的排行维度
-- 2. 游戏结束时，调用统一接口更新 t_leaderboard_data 表
-- 3. 前端通过游戏 ID 和维度代码获取排行榜数据
-- 4. 支持总榜、日榜、月榜、年榜多种排行类型
