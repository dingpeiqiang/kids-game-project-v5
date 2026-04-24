-- ========================================
-- 儿童游戏平台 - 数据库初始化脚本
-- 基于 schema_v2.sql 简化版（仅包含核心表）
-- 此脚本会在 MySQL 容器首次启动时自动执行
-- ========================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS kids_game 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

USE kids_game;

-- ================================================
-- 1. 用户体系（简化版）
-- ================================================

-- 统一用户表
DROP TABLE IF EXISTS t_user;
CREATE TABLE t_user (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户 ID',
    user_type TINYINT NOT NULL COMMENT '用户类型：0-儿童，1-家长，2-管理员',
    username VARCHAR(50) NOT NULL COMMENT '登录账号',
    password VARCHAR(255) NOT NULL COMMENT '加密密码',
    nickname VARCHAR(50) NOT NULL COMMENT '昵称',
    avatar VARCHAR(255) COMMENT '头像 URL',
    status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常，2-锁定',
    fatigue_points INT DEFAULT 0 COMMENT '疲劳点数',
    last_login_time BIGINT COMMENT '最后登录时间',
    last_login_ip VARCHAR(50) COMMENT '最后登录 IP',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE KEY uk_username_type (username, user_type),
    INDEX idx_user_type (user_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='统一用户表';

-- 角色表
DROP TABLE IF EXISTS t_role;
CREATE TABLE t_role (
    role_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '角色 ID',
    role_code VARCHAR(50) UNIQUE NOT NULL COMMENT '角色编码',
    role_name VARCHAR(50) NOT NULL COMMENT '角色名称',
    description VARCHAR(255) COMMENT '角色描述',
    status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    sort_order INT DEFAULT 0 COMMENT '排序',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 用户角色关联表
DROP TABLE IF EXISTS t_user_role;
CREATE TABLE t_user_role (
    user_role_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户角色 ID',
    user_id BIGINT NOT NULL COMMENT '用户 ID',
    role_id BIGINT NOT NULL COMMENT '角色 ID',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE KEY uk_user_role (user_id, role_id, deleted),
    INDEX idx_user_id (user_id),
    INDEX idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

-- ================================================
-- 2. 游戏模块（核心表）
-- ================================================

-- 游戏表
DROP TABLE IF EXISTS t_game;
CREATE TABLE t_game (
    game_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '游戏 ID',
    game_code VARCHAR(50) UNIQUE NOT NULL COMMENT '游戏编码',
    game_name VARCHAR(100) NOT NULL COMMENT '游戏名称',
    category VARCHAR(50) COMMENT '游戏分类',
    grade VARCHAR(20) COMMENT '适龄阶段',
    tags VARCHAR(500) COMMENT '标签列表（逗号分隔）',
    is_featured TINYINT DEFAULT 0 COMMENT '是否推荐：0-否，1-是',
    icon_url VARCHAR(255) COMMENT '游戏图标 URL',
    cover_url VARCHAR(255) COMMENT '游戏封面 URL',
    resource_url VARCHAR(255) COMMENT '游戏资源 CDN 地址',
    description TEXT COMMENT '游戏描述',
    module_path VARCHAR(255) COMMENT '前端模块路径',
    game_url VARCHAR(255) COMMENT '游戏访问地址 URL',
    game_secret VARCHAR(255) COMMENT '游戏密钥',
    game_config JSON COMMENT '游戏配置（JSON）',
    status TINYINT DEFAULT 0 COMMENT '状态：0-草稿，1-待审核，2-已上架，3-已下架，4-审核驳回',
    sort_order INT DEFAULT 0 COMMENT '排序',
    consume_points_per_minute INT DEFAULT 1 COMMENT '每分钟消耗疲劳点数',
    online_count INT DEFAULT 0 COMMENT '在线人数',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_category (category),
    INDEX idx_grade (grade),
    INDEX idx_status (status),
    INDEX idx_tags (tags),
    INDEX idx_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏信息表';

-- 游戏记录表
DROP TABLE IF EXISTS t_game_record;
CREATE TABLE t_game_record (
    record_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '记录 ID',
    user_id BIGINT NOT NULL COMMENT '儿童用户 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    session_id BIGINT COMMENT '会话 ID',
    duration BIGINT DEFAULT 0 COMMENT '游戏时长（秒）',
    score INT DEFAULT 0 COMMENT '游戏分数',
    consume_points INT DEFAULT 0 COMMENT '消耗疲劳点',
    play_date VARCHAR(20) COMMENT '游玩日期',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_user_id (user_id),
    INDEX idx_game_id (game_id),
    INDEX idx_play_date (play_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏记录表';

-- ================================================
-- 3. 初始化数据
-- ================================================

-- 插入默认角色
INSERT INTO t_role (role_code, role_name, description, status, sort_order) VALUES 
('SUPER_ADMIN', '超级管理员', '拥有所有权限', 1, 1),
('PARENT', '家长', '家长用户', 1, 2),
('KID', '儿童', '儿童用户', 1, 3);

-- 插入默认管理员用户（密码: admin123，BCrypt 加密）
-- 注意：生产环境请修改密码
INSERT INTO t_user (user_type, username, password, nickname, status) VALUES 
(2, 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '管理员', 1);

-- 为管理员分配超级管理员角色
INSERT INTO t_user_role (user_id, role_id)
SELECT u.user_id, r.role_id 
FROM t_user u, t_role r
WHERE u.username = 'admin' AND r.role_code = 'SUPER_ADMIN';

-- 插入示例游戏数据（status=2 表示已上架）
INSERT INTO t_game (game_code, game_name, category, description, game_url, status, sort_order, is_featured) VALUES 
('snake', '贪吃蛇', 'CLASSIC', '经典贪吃蛇游戏', 'http://localhost:3001', 2, 1, 1),
('plane-shooter', '飞机大战', 'SHOOTING', '射击类游戏', 'http://localhost:3002', 2, 2, 1),
('pvz', '植物大战僵尸', 'STRATEGY', '策略塔防游戏', 'http://localhost:3003', 2, 3, 1),
('tank-battle', '坦克大战', 'ACTION', '经典坦克对战', 'http://localhost:3004', 2, 4, 0);
