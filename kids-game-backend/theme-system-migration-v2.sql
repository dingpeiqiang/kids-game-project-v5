-- Theme System Migration V2 - Add game relation
-- 为现有主题表添加游戏关联字段

-- 如果表不存在，先创建基础表结构
CREATE TABLE IF NOT EXISTS `theme_info` (
    `theme_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主题 ID',
    `game_id` BIGINT NOT NULL COMMENT '关联游戏 ID',
    `game_code` VARCHAR(50) NOT NULL COMMENT '游戏代码（如：snake-vue3）',
    `author_id` BIGINT NOT NULL COMMENT '作者 ID',
    `theme_name` VARCHAR(100) NOT NULL COMMENT '主题名称',
    `author_name` VARCHAR(50) COMMENT '作者名称',
    `price` INT DEFAULT 0 COMMENT '价格（游戏币）',
    `status` VARCHAR(20) DEFAULT 'pending' COMMENT '状态：on_sale/offline/pending',
    `download_count` INT DEFAULT 0 COMMENT '下载次数',
    `total_revenue` INT DEFAULT 0 COMMENT '总收益',
    `thumbnail_url` VARCHAR(500) COMMENT '缩略图 URL',
    `description` TEXT COMMENT '描述',
    `config_json` JSON NOT NULL COMMENT '主题配置（包含资源/样式）',
    `is_default` TINYINT DEFAULT 0 COMMENT '是否为默认主题：0-否，1-是',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`theme_id`),
    INDEX `idx_game_id` (`game_id`),
    INDEX `idx_game_code` (`game_code`),
    INDEX `idx_author_id` (`author_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_price` (`price`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏主题信息表';

-- 如果表已存在但没有 game_id 和 game_code 字段，添加它们
-- 注意：如果表已存在且有数据，需要手动设置 game_id 和 game_code
