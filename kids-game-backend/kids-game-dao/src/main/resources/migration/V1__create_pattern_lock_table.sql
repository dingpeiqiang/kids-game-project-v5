CREATE TABLE IF NOT EXISTS `t_pattern_lock` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID（家长或儿童）',
    `user_type` VARCHAR(20) NOT NULL COMMENT '用户类型：PARENT-家长, KID-儿童',
    `encrypted_pattern` VARCHAR(255) NOT NULL COMMENT '加密后的图案数据',
    `salt` VARCHAR(255) NOT NULL COMMENT '加密盐值',
    `create_time` BIGINT NOT NULL COMMENT '创建时间',
    `update_time` BIGINT NOT NULL COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除, 1-已删除',
    INDEX `idx_user_id_type` (`user_id`, `user_type`),
    UNIQUE KEY `uk_user_id_type` (`user_id`, `user_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图案解锁表';
