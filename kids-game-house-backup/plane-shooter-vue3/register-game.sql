-- ============================================
-- 飞机大战游戏注册 SQL 脚本
-- 说明：将游戏注册到数据库
-- 创建时间：2026-03-26
-- ============================================

-- 1. 在游戏表中注册新游戏
INSERT INTO t_game (
    game_code,
    game_name,
    category,
    grade,
    icon_url,
    cover_url,
    description,
    game_url,
    module_path,
    status,
    sort_order,
    consume_points_per_minute,
    create_time,
    update_time
) VALUES (
    'plane-shooter',                -- 游戏 code
    '飞机大战',                      -- 游戏名称
    'SHOOTER',                      -- 类型：射击类
    '三年级',                       -- 年级
    'http://localhost:8081/favicon.ico',  -- 图标 URL（占位）
    '',                             -- 封面图
    '经典纵向卷轴射击游戏，玩家控制战斗机与敌机作战，躲避子弹并消灭所有敌人。支持多种武器升级和道具收集。',  -- 描述
    'http://localhost:8081',        -- 端口号 8081
    NULL,
    1,                              -- 状态：active
    20,                             -- 排序（在贪吃蛇之后）
    1,                              -- 每分钟消耗积分
    UNIX_TIMESTAMP() * 1000,
    UNIX_TIMESTAMP() * 1000
) ON DUPLICATE KEY UPDATE
    game_name = VALUES(game_name),
    category = VALUES(category),
    grade = VALUES(grade),
    icon_url = VALUES(icon_url),
    description = VALUES(description),
    game_url = VALUES(game_url),
    status = VALUES(status),
    sort_order = VALUES(sort_order),
    update_time = VALUES(update_time);

-- 验证游戏插入
SELECT 
    game_id AS '游戏 ID',
    game_code AS '游戏代码',
    game_name AS '游戏名称',
    category AS '类型',
    grade AS '年级',
    game_url AS '游戏 URL',
    status AS '状态'
FROM t_game
WHERE game_code = 'plane-shooter';

-- 2. 插入游戏的默认主题
INSERT INTO t_theme_info (
    theme_name, 
    author_id,
    author_name,
    owner_type,
    owner_id,
    price,
    status,
    thumbnail_url,
    description,
    config_json,
    download_count,
    total_revenue,
    created_at,
    updated_at
)
SELECT 
    '飞机大战 - 默认主题',                                    -- 主题名称
    1,                                                       -- 作者 ID
    '系统管理员',                                             -- 作者名称
    'GAME',                                                  -- 所有者类型
    (SELECT game_id FROM t_game WHERE game_code = 'plane-shooter'),  -- 自动获取游戏 ID
    0,                                                       -- 免费主题
    'on_sale',                                               -- 状态
    NULL,                                                    -- 缩略图
    '飞机大战游戏默认主题配置，包含太空背景、战斗机和敌机资源',  -- 描述
    '{
      "$comment": "GTRS v1.0.0 飞机大战游戏内置默认主题",
      "specMeta": {
        "compatibleVersion": "1.0.0",
        "specName": "GTRS",
        "specVersion": "1.0.0"
      },
      "themeInfo": {
        "themeId": "plane_shooter_default",
        "gameId": "plane-shooter",
        "themeName": "飞机大战 - 默认主题",
        "isDefault": true,
        "author": "官方",
        "description": "飞机大战默认主题配置"
      },
      "globalStyle": {
        "bgColor": "#0a0a28",
        "borderRadius": "8px",
        "fontFamily": "Arial, sans-serif",
        "primaryColor": "#4ade80",
        "secondaryColor": "#3b82f6",
        "textColor": "#ffffff"
      },
      "resources": {
        "images": {
          "login": {},
          "scene": {
            "scene_bg_main": {
              "alias": "太空背景",
              "src": "/themes/default/assets/scene/background.png",
              "type": "png"
            },
            "scene_bg_stars": {
              "alias": "星空",
              "src": "/themes/default/assets/scene/stars.png",
              "type": "png"
            },
            "scene_grid": {
              "alias": "网格",
              "src": "/themes/default/assets/scene/grid.png",
              "type": "png"
            }
          },
          "ui": {},
          "icon": {},
          "effect": {}
        },
        "audio": {
          "bgm": {
            "bgm_main": {
              "alias": "主菜单音乐",
              "src": "/themes/default/assets/audio/bgm_main.wav",
              "type": "wav",
              "volume": 0.6
            },
            "bgm_gameplay": {
              "alias": "游戏音乐",
              "src": "/themes/default/assets/audio/bgm_gameplay.wav",
              "type": "wav",
              "volume": 0.5
            },
            "bgm_victory": {
              "alias": "胜利音乐",
              "src": "/themes/default/assets/audio/bgm_victory.wav",
              "type": "wav",
              "volume": 0.7
            },
            "bgm_defeat": {
              "alias": "失败音乐",
              "src": "/themes/default/assets/audio/bgm_defeat.wav",
              "type": "wav",
              "volume": 0.5
            }
          },
          "effect": {
            "effect_fire": {
              "alias": "射击音效",
              "src": "/themes/default/assets/audio/effect_fire.wav",
              "type": "wav",
              "volume": 0.6
            },
            "effect_explosion": {
              "alias": "爆炸音效",
              "src": "/themes/default/assets/audio/effect_explosion.wav",
              "type": "wav",
              "volume": 0.7
            },
            "effect_hit": {
              "alias": "击中音效",
              "src": "/themes/default/assets/audio/effect_hit.wav",
              "type": "wav",
              "volume": 0.5
            },
            "effect_powerup": {
              "alias": "道具音效",
              "src": "/themes/default/assets/audio/effect_powerup.wav",
              "type": "wav",
              "volume": 0.6
            },
            "effect_button_click": {
              "alias": "按钮音效",
              "src": "/themes/default/assets/audio/effect_button_click.wav",
              "type": "wav",
              "volume": 0.5
            }
          },
          "voice": {}
        },
        "video": {}
      }
    }',                                         -- GTRS 配置
    0,
    0,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM t_theme_info 
    WHERE theme_name = '飞机大战 - 默认主题' 
    AND owner_id = (SELECT game_id FROM t_game WHERE game_code = 'plane-shooter')
);

-- 3. 查询验证
SELECT 
    theme_id AS '主题 ID',
    theme_name AS '主题名称',
    owner_type AS '所有者类型',
    owner_id AS '所有者 ID',
    price AS '价格',
    status AS '状态',
    download_count AS '下载次数',
    description AS '描述'
FROM t_theme_info
WHERE owner_type = 'GAME' 
  AND owner_id = (SELECT game_id FROM t_game WHERE game_code = 'plane-shooter')
ORDER BY theme_id;

-- 4. 完成提示
SELECT '✅ 飞机大战游戏和主题注册完成！' AS '执行结果';
