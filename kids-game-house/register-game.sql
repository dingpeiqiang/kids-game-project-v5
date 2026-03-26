-- ============================================
-- 坦克大战 游戏注册 SQL 脚本
-- 说明：将坦克大战游戏注册到数据库
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
    'TANK_BATTLE',              -- 游戏 code
    '坦克大战',                  -- 游戏名称
    'STRATEGY',                 -- 类型：策略类
    '三年级',                   -- 年级
    '/themes/default/images/icon/powerup_star.png',  -- 图标 (使用星星道具)
    '',                         -- 封面图
    '经典坦克射击游戏！保护基地，消灭所有敌人！支持多种地形和道具系统，考验你的战术策略能力。',
    'http://localhost:3002',    -- 端口号 3002
    NULL,
    1,                          -- 状态：active
    3,                          -- 排序
    1,                          -- 每分钟消耗积分
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
WHERE game_code = 'TANK_BATTLE';

-- 2. 插入坦克大战的默认主题
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
    '钢铁防线主题',
    1,
    '系统管理员',
    'GAME',
    (SELECT game_id FROM t_game WHERE game_code = 'TANK_BATTLE'),  -- 自动获取游戏 ID
    0,  -- 免费主题
    'on_sale',
    NULL,
    '坦克大战默认主题，经典的绿色坦克和砖墙钢墙地形',
    '{
  "default": {
    "name": "钢铁防线主题",
    "description": "经典坦克大战主题",
    "author": "系统管理员",
    "version": "1.0.0",
    "colors": {
      "primary": "#4ade80",
      "secondary": "#22c55e",
      "background": "#1a1a2e",
      "surface": "#1e293b",
      "text": "#ffffff",
      "textSecondary": "#94a3b8",
      "accent": "#fbbf24",
      "success": "#22c55e",
      "warning": "#f59e0b",
      "error": "#ef4444"
    },
    "assets": {
      "playerTank": {
        "type": "image",
        "value": "/themes/default/images/sprite/player_tank_up.png"
      },
      "enemyBasic": {
        "type": "image",
        "value": "/themes/default/images/sprite/enemy_basic_up.png"
      },
      "enemyFast": {
        "type": "image",
        "value": "/themes/default/images/sprite/enemy_fast_up.png"
      },
      "enemyHeavy": {
        "type": "image",
        "value": "/themes/default/images/sprite/enemy_heavy_up.png"
      },
      "bulletPlayer": {
        "type": "image",
        "value": "/themes/default/images/sprite/bullet_player.png"
      },
      "bulletEnemy": {
        "type": "image",
        "value": "/themes/default/images/sprite/bullet_enemy.png"
      },
      "wallBrick": {
        "type": "image",
        "value": "/themes/default/images/scene/wall_brick.png"
      },
      "wallSteel": {
        "type": "image",
        "value": "/themes/default/images/scene/wall_steel.png"
      },
      "grass": {
        "type": "image",
        "value": "/themes/default/images/scene/grass.png"
      },
      "water": {
        "type": "image",
        "value": "/themes/default/images/scene/water.png"
      },
      "base": {
        "type": "image",
        "value": "/themes/default/images/scene/base.png"
      },
      "powerupStar": {
        "type": "image",
        "value": "/themes/default/images/icon/powerup_star.png"
      },
      "powerupClock": {
        "type": "image",
        "value": "/themes/default/images/icon/powerup_clock.png"
      },
      "powerupShovel": {
        "type": "image",
        "value": "/themes/default/images/icon/powerup_shovel.png"
      },
      "powerupLife": {
        "type": "image",
        "value": "/themes/default/images/icon/powerup_life.png"
      }
    },
    "audio": {
      "bgmMain": {
        "enabled": true,
        "volume": 0.5,
        "src": "/themes/default/audio/bgm_main.wav"
      },
      "bgmGameplay": {
        "enabled": true,
        "volume": 0.4,
        "src": "/themes/default/audio/bgm_gameplay.wav"
      },
      "bgmVictory": {
        "enabled": true,
        "volume": 0.6,
        "src": "/themes/default/audio/bgm_victory.wav"
      },
      "bgmDefeat": {
        "enabled": true,
        "volume": 0.5,
        "src": "/themes/default/audio/bgm_defeat.wav"
      },
      "sfxFire": {
        "enabled": true,
        "volume": 0.6,
        "src": "/themes/default/audio/sfx_fire.wav"
      },
      "sfxExplosion": {
        "enabled": true,
        "volume": 0.7,
        "src": "/themes/default/audio/sfx_explosion.wav"
      },
      "sfxHit": {
        "enabled": true,
        "volume": 0.5,
        "src": "/themes/default/audio/sfx_hit.wav"
      },
      "sfxPowerupAppear": {
        "enabled": true,
        "volume": 0.6,
        "src": "/themes/default/audio/sfx_powerup_appear.wav"
      },
      "sfxPowerupPickup": {
        "enabled": true,
        "volume": 0.6,
        "src": "/themes/default/audio/sfx_powerup_pickup.wav"
      },
      "sfxBaseDestroyed": {
        "enabled": true,
        "volume": 0.8,
        "src": "/themes/default/audio/sfx_base_destroyed.wav"
      },
      "sfxButtonClick": {
        "enabled": true,
        "volume": 0.4,
        "src": "/themes/default/audio/sfx_button_click.wav"
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
    WHERE theme_name = '钢铁防线主题' 
    AND owner_id = (SELECT game_id FROM t_game WHERE game_code = 'TANK_BATTLE')
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
  AND owner_id = (SELECT game_id FROM t_game WHERE game_code = 'TANK_BATTLE')
ORDER BY theme_id;

-- 4. 完成提示
SELECT '✅ 坦克大战游戏和主题注册完成！' AS '执行结果';
