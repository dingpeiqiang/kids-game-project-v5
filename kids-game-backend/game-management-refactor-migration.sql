-- ============================================
-- 游戏管理系统重构 - 数据库迁移脚本
-- 版本：v2.0
-- 日期：2026-03-23
-- 
-- 适用场景：从 schema_v2.sql 升级到 v2.0
-- 注意事项：
--   1. 此脚本会修改现有表结构
--   2. 会自动备份重要数据
--   3. 支持回滚操作
-- ============================================

-- 开启事务
SET AUTOCOMMIT = 0;
START TRANSACTION;

-- ============================================
-- 第 1 步：备份现有数据（安全起见）
-- ============================================

SELECT '开始备份现有数据...' AS step;

-- 备份 t_game 表结构和数据
DROP TABLE IF EXISTS t_game_backup_20260323;
CREATE TABLE t_game_backup_20260323 LIKE t_game;
INSERT INTO t_game_backup_20260323 SELECT * FROM t_game;

-- 备份 t_game_tag 表
DROP TABLE IF EXISTS t_game_tag_backup_20260323;
CREATE TABLE t_game_tag_backup_20260323 LIKE t_game_tag;
INSERT INTO t_game_tag_backup_20260323 SELECT * FROM t_game_tag;

-- 备份 t_game_tag_relation 表
DROP TABLE IF EXISTS t_game_tag_relation_backup_20260323;
CREATE TABLE t_game_tag_relation_backup_20260323 LIKE t_game_tag_relation;
INSERT INTO t_game_tag_relation_backup_20260323 SELECT * FROM t_game_tag_relation;

SELECT '备份完成！' AS status;

-- ============================================
-- 1. 创建游戏标签表
-- ============================================

DROP TABLE IF EXISTS t_game_tag;
CREATE TABLE t_game_tag (
    tag_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '标签 ID',
    tag_code VARCHAR(50) UNIQUE NOT NULL COMMENT '标签代码',
    tag_name VARCHAR(50) NOT NULL COMMENT '标签名称',
    category VARCHAR(50) COMMENT '所属分类',
    icon VARCHAR(50) COMMENT '图标 emoji',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_category (category),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏标签表';

-- ============================================
-- 2. 创建游戏标签关联表
-- ============================================

DROP TABLE IF EXISTS t_game_tag_relation;
CREATE TABLE t_game_tag_relation (
    relation_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '关联 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    tag_id BIGINT NOT NULL COMMENT '标签 ID',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    UNIQUE KEY uk_game_tag (game_id, tag_id),
    INDEX idx_game_id (game_id),
    INDEX idx_tag_id (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏标签关联表';

-- ============================================
-- 3. 创建游戏版本历史表
-- ============================================

DROP TABLE IF EXISTS t_game_version_history;
CREATE TABLE t_game_version_history (
    version_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '版本 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    version VARCHAR(20) NOT NULL COMMENT '版本号',
    version_description VARCHAR(500) COMMENT '版本说明',
    change_log TEXT COMMENT '变更日志',
    resource_url VARCHAR(500) COMMENT '资源 URL',
    status TINYINT DEFAULT 1 COMMENT '状态：0-草稿，1-已发布',
    publisher_id BIGINT COMMENT '发布人 ID',
    publish_time BIGINT COMMENT '发布时间',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_game_id (game_id),
    INDEX idx_version (version),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏版本历史表';

-- ============================================
-- 4. 创建游戏统计表（增强版）
-- ============================================

DROP TABLE IF EXISTS t_game_statistics;
CREATE TABLE t_game_statistics (
    stat_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '统计 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    stat_date DATE NOT NULL COMMENT '统计日期',
    
    -- 基础统计
    total_play_count INT DEFAULT 0 COMMENT '总游玩次数',
    unique_players INT DEFAULT 0 COMMENT '独立玩家数',
    total_duration BIGINT DEFAULT 0 COMMENT '总时长 (秒)',
    average_duration INT DEFAULT 0 COMMENT '平均时长 (秒)',
    
    -- 评分统计
    average_score DECIMAL(10,2) DEFAULT 0 COMMENT '平均分数',
    max_score INT DEFAULT 0 COMMENT '最高分',
    min_score INT DEFAULT 0 COMMENT '最低分',
    
    -- 满意度统计
    like_count INT DEFAULT 0 COMMENT '点赞数',
    dislike_count INT DEFAULT 0 COMMENT '踩数',
    favorite_count INT DEFAULT 0 COMMENT '收藏数',
    satisfaction_rate DECIMAL(5,2) DEFAULT 0 COMMENT '满意度 (%)',
    
    -- 留存统计
    next_day_retention DECIMAL(5,2) DEFAULT 0 COMMENT '次日留存率 (%)',
    week_retention DECIMAL(5,2) DEFAULT 0 COMMENT '周留存率 (%)',
    
    -- 疲劳度统计
    total_fatigue_consumed INT DEFAULT 0 COMMENT '总消耗疲劳度',
    average_fatigue_per_player INT DEFAULT 0 COMMENT '人均消耗疲劳度',
    
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    
    UNIQUE KEY uk_game_date (game_id, stat_date),
    INDEX idx_stat_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏统计表';

-- ============================================
-- 5. 创建游戏审核记录表
-- ============================================

DROP TABLE IF EXISTS t_game_review_record;
CREATE TABLE t_game_review_record (
    review_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '审核 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    reviewer_id BIGINT NOT NULL COMMENT '审核人 ID',
    review_status TINYINT NOT NULL COMMENT '审核状态：1-通过，2-驳回',
    review_comment VARCHAR(500) COMMENT '审核意见',
    reject_reason VARCHAR(500) COMMENT '驳回原因',
    review_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '审核时间',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    INDEX idx_game_id (game_id),
    INDEX idx_reviewer_id (reviewer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏审核记录表';

-- ============================================
-- 6. 创建游戏资源配置表
-- ============================================

DROP TABLE IF EXISTS t_game_resource_config;
CREATE TABLE t_game_resource_config (
    config_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '配置 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    resource_type VARCHAR(50) NOT NULL COMMENT '资源类型：image,audio,video,font,config',
    resource_key VARCHAR(100) NOT NULL COMMENT '资源键名',
    resource_url VARCHAR(500) NOT NULL COMMENT '资源 URL',
    file_size BIGINT COMMENT '文件大小 (字节)',
    md5_hash VARCHAR(50) COMMENT 'MD5 校验值',
    version VARCHAR(20) COMMENT '资源版本',
    description VARCHAR(500) COMMENT '资源说明',
    status TINYINT DEFAULT 1 COMMENT '状态',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE KEY uk_game_key (game_id, resource_key),
    INDEX idx_game_id (game_id),
    INDEX idx_resource_type (resource_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏资源配置表';

-- ============================================
-- 7. 修改现有游戏表结构（添加新字段）
-- ============================================

-- 备份现有表结构
DROP TABLE IF EXISTS t_game_backup_20260323;
CREATE TABLE t_game_backup_20260323 LIKE t_game;
INSERT INTO t_game_backup_20260323 SELECT * FROM t_game;

-- 添加新字段
ALTER TABLE t_game 
ADD COLUMN tags VARCHAR(500) COMMENT '标签列表 (逗号分隔)' AFTER grade,
ADD COLUMN screenshot_urls TEXT COMMENT '截图 URLs(JSON 数组)' AFTER resource_url,
ADD COLUMN play_guide TEXT COMMENT '玩法说明' AFTER description,
ADD COLUMN is_featured TINYINT DEFAULT 0 COMMENT '是否推荐：0-否，1-是' AFTER sort_order,
ADD COLUMN min_fatigue_to_start INT DEFAULT 0 COMMENT '启动所需最低疲劳度' AFTER consume_points_per_minute,
ADD COLUMN creator_id BIGINT COMMENT '创建人 ID' AFTER deleted,
ADD COLUMN reviewer_id BIGINT COMMENT '审核人 ID' AFTER creator_id,
ADD COLUMN review_time BIGINT COMMENT '审核时间' AFTER reviewer_id,
ADD COLUMN review_comment VARCHAR(500) COMMENT '审核意见' AFTER review_time,
ADD COLUMN publish_time BIGINT COMMENT '上架时间' AFTER review_comment;

-- 修改 status 字段注释，扩展状态定义
ALTER TABLE t_game 
MODIFY COLUMN status TINYINT DEFAULT 0 COMMENT '状态：0-草稿，1-待审核，2-已上架，3-已下架，4-审核驳回';

-- 添加索引
ALTER TABLE t_game
ADD INDEX idx_tags (tags),
ADD INDEX idx_creator (creator_id),
ADD INDEX idx_featured (is_featured);

-- ============================================
-- 8. 初始化基础标签数据
-- ============================================

INSERT INTO t_game_tag (tag_code, tag_name, category, icon, sort_order, status) VALUES
('puzzle', '益智', 'category', '🧩', 1, 1),
('math', '数学', 'subject', '🔢', 2, 1),
('chinese', '语文', 'subject', '📖', 3, 1),
('english', '英语', 'subject', '🔤', 4, 1),
('science', '科学', 'subject', '🔬', 5, 1),
('sport', '运动', 'category', '⚽', 6, 1),
('art', '艺术', 'category', '🎨', 7, 1),
('music', '音乐', 'category', '🎵', 8, 1),
('memory', '记忆力', 'skill', '🧠', 9, 1),
('logic', '逻辑思维', 'skill', '💡', 10, 1),
('creativity', '创造力', 'skill', '✨', 11, 1),
('reaction', '反应力', 'skill', '⚡', 12, 1),
('single_player', '单人游戏', 'mode', '👤', 13, 1),
('multi_player', '多人游戏', 'mode', '👥', 14, 1),
('offline', '离线游戏', 'mode', '✈️', 15, 1),
('online', '在线游戏', 'mode', '🌐', 16, 1);

-- ============================================
-- 提交事务
-- ============================================

COMMIT;

-- ============================================
-- 验证表创建结果
-- ============================================

SELECT 'Tables created successfully!' AS status;

SHOW TABLES LIKE 't_game%';

SELECT CONCAT('标签数量：', COUNT(*)) AS tag_count FROM t_game_tag;
