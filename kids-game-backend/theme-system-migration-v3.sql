-- Theme System Migration V3 - 主题与游戏多对多关系
-- 设计思路：主题独立存在，通过关系表关联游戏，支持跨游戏复用

-- ============================================
-- 1. 主题信息表（独立，不直接关联游戏）
-- ============================================
CREATE TABLE IF NOT EXISTS `theme_info` (
    `theme_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主题 ID',
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
    `applicable_scope` VARCHAR(50) DEFAULT 'all' COMMENT '适用范围：all-全游戏/specific-指定游戏',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`theme_id`),
    INDEX `idx_author_id` (`author_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_applicable_scope` (`applicable_scope`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='主题信息表（独立）';

-- ============================================
-- 2. 主题 - 游戏关系表（多对多）
-- ============================================
CREATE TABLE IF NOT EXISTS `theme_game_relation` (
    `relation_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '关系 ID',
    `theme_id` BIGINT NOT NULL COMMENT '主题 ID',
    `game_id` BIGINT NOT NULL COMMENT '游戏 ID',
    `game_code` VARCHAR(50) NOT NULL COMMENT '游戏代码',
    `is_default` TINYINT DEFAULT 0 COMMENT '是否为该游戏的默认主题：0-否，1-是',
    `sort_order` INT DEFAULT 0 COMMENT '排序权重',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`relation_id`),
    UNIQUE KEY `uk_theme_game` (`theme_id`, `game_id`) COMMENT '同一主题对同一游戏只能有一条关系',
    INDEX `idx_game_id` (`game_id`),
    INDEX `idx_game_code` (`game_code`),
    INDEX `idx_is_default` (`is_default`),
    CONSTRAINT `fk_theme_game_theme` FOREIGN KEY (`theme_id`) REFERENCES `theme_info`(`theme_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='主题 - 游戏关系表（多对多）';

-- ============================================
-- 3. 主题资产表（可选，用于存储主题的资源文件）
-- ============================================
CREATE TABLE IF NOT EXISTS `theme_assets` (
    `asset_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '资产 ID',
    `theme_id` BIGINT NOT NULL COMMENT '主题 ID',
    `asset_key` VARCHAR(100) NOT NULL COMMENT '资源键（如：bg_main）',
    `asset_type` VARCHAR(20) NOT NULL COMMENT '资源类型：image/audio/font/other',
    `file_path` VARCHAR(500) NOT NULL COMMENT '文件路径',
    `file_size` INT DEFAULT 0 COMMENT '文件大小（字节）',
    `file_hash` VARCHAR(64) COMMENT '文件哈希（用于去重）',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`asset_id`),
    INDEX `idx_theme_id` (`theme_id`),
    INDEX `idx_asset_key` (`asset_key`),
    CONSTRAINT `fk_theme_assets_theme` FOREIGN KEY (`theme_id`) REFERENCES `theme_info`(`theme_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='主题资源文件表';

-- ============================================
-- 初始化数据示例
-- ============================================

-- 示例 1: 创建一个通用主题（适用于所有游戏）
INSERT INTO `theme_info` 
(`author_id`, `theme_name`, `author_name`, `price`, `status`, `applicable_scope`, `config_json`) 
VALUES 
(1, '经典复古主题', '游戏官方', 0, 'on_sale', 'all', 
 '{"default": {"name": "经典复古", "assets": {}, "styles": {"color_primary": "#42b983", "font_family": "Arial"}}}');

-- 示例 2: 创建一个特定游戏主题（只适用于贪吃蛇）
INSERT INTO `theme_info` 
(`author_id`, `theme_name`, `author_name`, `price`, `status`, `applicable_scope`, `config_json`) 
VALUES 
(1, '贪吃蛇专属主题', '游戏官方', 100, 'on_sale', 'specific', 
 '{"default": {"name": "贪吃蛇专属", "assets": {"snake_body": "images/snake.png"}, "styles": {}}}');

-- 示例 3: 为贪吃蛇游戏设置默认主题
INSERT INTO `theme_game_relation` 
(`theme_id`, `game_id`, `game_code`, `is_default`, `sort_order`) 
VALUES 
(1, 1, 'snake-vue3', 1, 1);

-- 示例 4: 将经典复古主题应用到多个游戏
INSERT INTO `theme_game_relation` 
(`theme_id`, `game_id`, `game_code`, `is_default`, `sort_order`) 
VALUES 
(1, 1, 'snake-vue3', 0, 2),
(1, 2, 'snake-shooter', 0, 1),
(1, 3, 'plane-shooter', 0, 1);
