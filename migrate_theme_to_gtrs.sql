-- =====================================================
-- GTRS v1.0.0 主题数据迁移脚本
-- 功能：将旧版主题配置迁移到GTRS规范
-- =====================================================

-- 1. 备份现有主题数据（重要！）
CREATE TABLE IF NOT EXISTS `theme_info_backup_20250318` AS
SELECT * FROM `theme_info`;

-- 2. 查看现有主题数据（用于确认）
SELECT
    theme_id,
    theme_name,
    owner_type,
    owner_id,
    status,
    JSON_LENGTH(config_json) as config_size,
    JSON_EXTRACT(config_json, '$.version') as old_version,
    JSON_EXTRACT(config_json, '$.gameCode') as game_code,
    JSON_EXTRACT(config_json, '$.specMeta.specName') as spec_name
FROM `theme_info`
LIMIT 10;

-- 3. 标记需要迁移的主题（非GTRS格式的主题）
-- 这些主题将被更新为GTRS规范
UPDATE `theme_info`
SET `status` = 'pending_migration'
WHERE
    `status` = 'on_sale'
    AND JSON_EXTRACT(config_json, '$.specMeta.specName') IS NULL;

-- 4. 为已标记的主题生成GTRS格式配置
-- 注意：这是一个模板SQL，实际迁移需要通过应用层执行
-- 下面的SQL展示了如何为单个主题更新配置

-- 示例：迁移单个主题（贪吃蛇游戏）
/*
UPDATE `theme_info`
SET
    `config_json` = JSON_SET(
        JSON_SET(
            JSON_SET(
                JSON_SET(
                    JSON_OBJECT(
                        -- 1. specMeta
                        'specMeta', JSON_OBJECT(
                            'specName', 'GTRS',
                            'specVersion', '1.0.0',
                            'compatibleVersion', '1.0.0'
                        ),
                        -- 2. themeInfo
                        'themeInfo', JSON_OBJECT(
                            'themeId', CONCAT('game_', owner_id, '_theme_', theme_id),
                            'gameId', CONCAT('game_', owner_id),
                            'themeName', theme_name,
                            'isDefault', IF(is_default = 1, TRUE, FALSE),
                            'author', author_name,
                            'description', COALESCE(description, '')
                        ),
                        -- 3. globalStyle
                        'globalStyle', JSON_OBJECT(
                            'primaryColor', '#FF6B6B',
                            'secondaryColor', '#4ECDC4',
                            'bgColor', '#1A1A1A',
                            'textColor', '#FFFFFF',
                            'fontFamily', 'Arial, sans-serif',
                            'borderRadius', '8px'
                        ),
                        -- 4. resources
                        'resources', JSON_OBJECT(
                            'images', JSON_OBJECT(
                                'login', JSON_OBJECT(),
                                'scene', JSON_OBJECT(),
                                'ui', JSON_OBJECT(),
                                'icon', JSON_OBJECT(),
                                'effect', JSON_OBJECT()
                            ),
                            'audio', JSON_OBJECT(
                                'bgm', JSON_OBJECT(),
                                'effect', JSON_OBJECT(),
                                'voice', JSON_OBJECT()
                            ),
                            'video', JSON_OBJECT()
                        )
                    ),
                    -- 迁移旧版图片资源
                    '$.resources.images.scene.snakeHead',
                    JSON_OBJECT(
                        'src', JSON_EXTRACT(config_json, '$.resources.images.snakeHead.url'),
                        'type', JSON_EXTRACT(config_json, '$.resources.images.snakeHead.type'),
                        'alias', '蛇头'
                    )
                ),
                '$.resources.images.scene.snakeBody',
                JSON_OBJECT(
                    'src', JSON_EXTRACT(config_json, '$.resources.images.snakeBody.url'),
                    'type', JSON_EXTRACT(config_json, '$.resources.images.snakeBody.type'),
                    'alias', '蛇身'
                )
            ),
            '$.resources.audio.bgm.bgm_main',
            JSON_OBJECT(
                'src', JSON_EXTRACT(config_json, '$.resources.audio.bgm_main.url'),
                'type', 'mp3',
                'volume', COALESCE(JSON_EXTRACT(config_json, '$.resources.audio.bgm_main.volume'), 0.5),
                'alias', '主背景音乐'
            )
        )
    ),
    `status` = 'on_sale'
WHERE
    `theme_id` = 1;
*/

-- 5. 批量更新主题状态（迁移完成后）
-- UPDATE `theme_info`
-- SET `status` = 'on_sale'
-- WHERE `status` = 'pending_migration';

-- 6. 验证迁移结果
SELECT
    theme_id,
    theme_name,
    JSON_EXTRACT(config_json, '$.specMeta.specName') as spec_name,
    JSON_EXTRACT(config_json, '$.specMeta.specVersion') as spec_version,
    JSON_EXTRACT(config_json, '$.themeInfo.themeId') as theme_id_field,
    JSON_EXTRACT(config_json, '$.themeInfo.gameId') as game_id_field,
    JSON_LENGTH(config_json, '$.resources.images.login') as login_images,
    JSON_LENGTH(config_json, '$.resources.images.scene') as scene_images,
    JSON_LENGTH(config_json, '$.resources.audio.bgm') as bgm_count,
    JSON_LENGTH(config_json, '$.resources.audio.effect') as effect_count
FROM `theme_info`
WHERE
    JSON_EXTRACT(config_json, '$.specMeta.specName') = 'GTRS'
LIMIT 10;

-- 7. 回滚脚本（如果迁移失败，恢复备份数据）
/*
-- ⚠️ 警告：此操作会覆盖当前数据！
-- DELETE FROM `theme_info`;
-- INSERT INTO `theme_info` SELECT * FROM `theme_info_backup_20250318`;
*/

-- 8. 清理备份表（确认迁移成功后执行）
-- DROP TABLE IF EXISTS `theme_info_backup_20250318`;

-- =====================================================
-- 迁移说明
-- =====================================================
/*
1. 此SQL脚本提供了数据迁移的框架
2. 实际迁移建议通过Java应用层执行（ThemeMigrationService）
3. Java服务提供了更智能的资源分类和迁移逻辑
4. 迁移前务必备份数据！
5. 迁移后验证所有主题的GTRS格式正确性

推荐迁移流程：
1. 执行备份（步骤1）
2. 通过Java API调用迁移服务
3. 验证迁移结果（步骤6）
4. 确认无误后清理备份（步骤8）
*/
