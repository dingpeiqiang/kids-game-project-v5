-- 注册飞机大战游戏到平台
-- 包含游戏配置和默认主题

-- ========================================
-- 1. 插入飞机大战游戏
-- ========================================

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
    'PLANE_SHOOTER',
    '飞机大战',
    'SHOOTER',
    '三年级',
    '/images/games/plane-shooter/icon.png',
    '',
    '经典太空射击游戏！驾驶战机，击落敌机，收集道具，挑战最高分！支持多种难度和武器升级系统。',
    'http://localhost:3003',
    NULL,
    1,
    2,
    1,
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
WHERE game_code = 'PLANE_SHOOTER';

-- ========================================
-- 2. 插入飞机大战的默认主题
-- ========================================

-- 插入免费的飞机大战默认主题（如果不存在）
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
    '星际战士主题',
    1,
    '系统管理员',
    'GAME',
    (SELECT game_id FROM t_game WHERE game_code = 'PLANE_SHOOTER'),  -- 自动获取飞机大战的游戏 ID
    0,  -- 免费主题
    'on_sale',
    NULL,
    '飞机大战的默认星际战士主题，包含蓝色战机和经典太空背景',
    '{
  "default": {
    "name": "星际战士主题",
    "description": "经典的太空射击主题",
    "author": "系统管理员",
    "version": "1.0.0",
    "colors": {
      "primary": "#4ade80",
      "secondary": "#22c55e",
      "background": "#0f0f2d",
      "surface": "#1a1a2e",
      "text": "#ffffff",
      "textSecondary": "#94a3b8",
      "accent": "#fbbf24",
      "success": "#22c55e",
      "warning": "#f59e0b",
      "error": "#ef4444"
    },
    "assets": {
      "playerPlane": {
        "type": "image",
        "value": "/themes/default/images/scene/player_blue.png"
      },
      "enemyBasic": {
        "type": "image",
        "value": "/themes/default/images/scene/enemy_basic.png"
      },
      "enemyFast": {
        "type": "image",
        "value": "/themes/default/images/scene/enemy_fast.png"
      },
      "enemyTank": {
        "type": "image",
        "value": "/themes/default/images/scene/enemy_tank.png"
      },
      "boss": {
        "type": "image",
        "value": "/themes/default/images/scene/boss.png"
      },
      "bulletPlayer": {
        "type": "image",
        "value": "/themes/default/images/scene/bullet_player.png"
      },
      "bulletEnemy": {
        "type": "image",
        "value": "/themes/default/images/scene/bullet_enemy.png"
      },
      "powerupWeapon": {
        "type": "image",
        "value": "/themes/default/images/scene/powerup_weapon.png"
      },
      "powerupHealth": {
        "type": "image",
        "value": "/themes/default/images/scene/powerup_health.png"
      },
      "powerupShield": {
        "type": "image",
        "value": "/themes/default/images/scene/powerup_shield.png"
      },
      "background": {
        "type": "image",
        "value": "/themes/default/images/scene/bg_stars.png"
      }
    },
    "audio": {
      "bgmMain": {
        "enabled": true,
        "volume": 0.6,
        "src": "/themes/default/audio/bgm_main.mp3"
      },
      "bgmGameplay": {
        "enabled": true,
        "volume": 0.6,
        "src": "/themes/default/audio/bgm_gameplay.mp3"
      },
      "bgmBoss": {
        "enabled": true,
        "volume": 0.7,
        "src": "/themes/default/audio/bgm_boss.mp3"
      },
      "bgmGameover": {
        "enabled": true,
        "volume": 0.5,
        "src": "/themes/default/audio/bgm_gameover.mp3"
      },
      "effectShoot": {
        "enabled": true,
        "volume": 0.5,
        "src": "/themes/default/audio/shoot.mp3"
      },
      "effectExplosion": {
        "enabled": true,
        "volume": 0.5,
        "src": "/themes/default/audio/explosion.mp3"
      },
      "effectPowerup": {
        "enabled": true,
        "volume": 0.5,
        "src": "/themes/default/audio/powerup.mp3"
      },
      "effectButton": {
        "enabled": true,
        "volume": 0.3,
        "src": "/themes/default/audio/button_click.mp3"
      }
    }
  }
}',
    0,
    0,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM t_theme_info 
    WHERE theme_name = '星际战士主题' 
    AND owner_id = (SELECT game_id FROM t_game WHERE game_code = 'PLANE_SHOOTER')
);

-- ========================================
-- 3. 插入备用主题（可选）
-- ========================================

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
    '红色闪电主题',
    1,
    '系统管理员',
    'GAME',
    (SELECT game_id FROM t_game WHERE game_code = 'PLANE_SHOOTER'),
    0,
    'on_sale',
    NULL,
    '红色涂装的闪电战机主题',
    '{
  "default": {
    "name": "红色闪电主题",
    "description": "充满力量的红色主题",
    "author": "系统管理员",
    "version": "1.0.0",
    "colors": {
      "primary": "#ef4444",
      "secondary": "#dc2626",
      "background": "#0f0f2d",
      "surface": "#1a1a2e",
      "text": "#ffffff",
      "textSecondary": "#94a3b8",
      "accent": "#fbbf24",
      "success": "#22c55e",
      "warning": "#f59e0b",
      "error": "#ef4444"
    },
    "assets": {
      "playerPlane": {
        "type": "image",
        "value": "/themes/default/images/scene/player_red.png"
      },
      "enemyBasic": {
        "type": "image",
        "value": "/themes/default/images/scene/enemy_basic.png"
      },
      "enemyFast": {
        "type": "image",
        "value": "/themes/default/images/scene/enemy_fast.png"
      },
      "enemyTank": {
        "type": "image",
        "value": "/themes/default/images/scene/enemy_tank.png"
      },
      "boss": {
        "type": "image",
        "value": "/themes/default/images/scene/boss.png"
      },
      "bulletPlayer": {
        "type": "image",
        "value": "/themes/default/images/scene/bullet_player.png"
      },
      "bulletEnemy": {
        "type": "image",
        "value": "/themes/default/images/scene/bullet_enemy.png"
      },
      "powerupWeapon": {
        "type": "image",
        "value": "/themes/default/images/scene/powerup_weapon.png"
      },
      "powerupHealth": {
        "type": "image",
        "value": "/themes/default/images/scene/powerup_health.png"
      },
      "powerupShield": {
        "type": "image",
        "value": "/themes/default/images/scene/powerup_shield.png"
      },
      "background": {
        "type": "image",
        "value": "/themes/default/images/scene/bg_stars.png"
      }
    },
    "audio": {
      "bgmMain": {
        "enabled": true,
        "volume": 0.6,
        "src": "/themes/default/audio/bgm_main.mp3"
      },
      "bgmGameplay": {
        "enabled": true,
        "volume": 0.6,
        "src": "/themes/default/audio/bgm_gameplay.mp3"
      },
      "bgmBoss": {
        "enabled": true,
        "volume": 0.7,
        "src": "/themes/default/audio/bgm_boss.mp3"
      },
      "bgmGameover": {
        "enabled": true,
        "volume": 0.5,
        "src": "/themes/default/audio/bgm_gameover.mp3"
      },
      "effectShoot": {
        "enabled": true,
        "volume": 0.5,
        "src": "/themes/default/audio/shoot.mp3"
      },
      "effectExplosion": {
        "enabled": true,
        "volume": 0.5,
        "src": "/themes/default/audio/explosion.mp3"
      },
      "effectPowerup": {
        "enabled": true,
        "volume": 0.5,
        "src": "/themes/default/audio/powerup.mp3"
      },
      "effectButton": {
        "enabled": true,
        "volume": 0.3,
        "src": "/themes/default/audio/button_click.mp3"
      }
    }
  }
}',
    0,
    0,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM t_theme_info 
    WHERE theme_name = '红色闪电主题' 
    AND owner_id = (SELECT game_id FROM t_game WHERE game_code = 'PLANE_SHOOTER')
);

-- ========================================
-- 4. 查询验证
-- ========================================

-- 查询所有飞机大战相关主题
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
  AND owner_id = (SELECT game_id FROM t_game WHERE game_code = 'PLANE_SHOOTER')
ORDER BY theme_id;

-- ========================================
-- 5. 完成提示
-- ========================================

SELECT '✅ 飞机大战游戏和主题注册完成！' AS '执行结果';
