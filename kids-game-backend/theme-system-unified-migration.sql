-- Theme System Unified Configuration Migration
-- 统一主题配置结构 - 支持样式/图片/音频资源
-- Date: 2026-03-16

-- ============================================
-- 1. 更新 theme_info 表结构
-- ============================================

-- 如果表不存在，创建新表
CREATE TABLE IF NOT EXISTS `theme_info` (
    `theme_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主题 ID',
    `author_id` BIGINT NOT NULL COMMENT '作者 ID',
    `theme_name` VARCHAR(100) NOT NULL COMMENT '主题名称',
    `author_name` VARCHAR(50) COMMENT '作者名称',
    `applicable_scope` VARCHAR(50) DEFAULT 'all' COMMENT '适用范围：all-通用/specific-游戏专属',
    `price` INT DEFAULT 0 COMMENT '价格（游戏币）',
    `status` VARCHAR(20) DEFAULT 'pending' COMMENT '状态：on_sale/offline/pending',
    `download_count` INT DEFAULT 0 COMMENT '下载次数',
    `total_revenue` INT DEFAULT 0 COMMENT '总收益',
    `thumbnail_url` VARCHAR(500) COMMENT '缩略图 URL',
    `description` TEXT COMMENT '描述',
    `config_json` JSON NOT NULL COMMENT '完整主题配置 (包含 styles/assets/audio)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`theme_id`),
    INDEX `idx_author_id` (`author_id`),
    INDEX `idx_applicable_scope` (`applicable_scope`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='主题信息表';

-- ============================================
-- 2. 主题 - 游戏关系表 (仅游戏主题使用)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='主题 - 游戏关系表';

-- ============================================
-- 3. 数据迁移 (如果已有旧数据)
-- ============================================

-- 如果存在旧的 theme_info 表且有 data，迁移 config_json 到新结构
-- 注意：这是一个示例脚本，实际迁移需要根据现有数据结构调整

-- 示例：将旧的主题配置转换为新结构
-- UPDATE theme_info 
-- SET config_json = JSON_OBJECT(
--     'default', JSON_OBJECT(
--         'name', theme_name,
--         'author', author_name,
--         'styles', COALESCE(JSON_EXTRACT(config_json, '$.styles'), JSON_OBJECT()),
--         'assets', COALESCE(JSON_EXTRACT(config_json, '$.assets'), JSON_OBJECT()),
--         'audio', JSON_OBJECT()
--     )
-- )
-- WHERE config_json IS NOT NULL;

-- ============================================
-- 4. 初始化示例数据
-- ============================================

-- 示例 1: 应用主题 - 粉彩风格 (用于首页/个人中心等)
INSERT INTO `theme_info` 
(`author_id`, `theme_name`, `author_name`, `applicable_scope`, `price`, `status`, `config_json`, `description`) 
VALUES 
(1, '粉彩应用主题', '官方设计师', 'all', 0, 'on_sale', 
'{
  "default": {
    "name": "粉彩主题",
    "author": "官方设计师",
    "description": "活泼可爱的粉彩风格，适用于首页和个人中心",
    "version": "1.0.0",
    
    "styles": {
      "colors": {
        "primary": "#FF6B9D",
        "secondary": "#4ECDC4",
        "background": "#f9fafb",
        "surface": "#ffffff",
        "text": "#1f2937",
        "accent": "#FFE66D",
        "success": "#4ECDC4",
        "warning": "#FFE66D",
        "error": "#FF6B9D"
      },
      "typography": {
        "fontFamily": "\"Inter\", \"Microsoft YaHei\", sans-serif",
        "fontSizes": {
          "xs": "0.75rem",
          "sm": "0.875rem",
          "base": "1rem",
          "lg": "1.125rem",
          "xl": "1.25rem"
        }
      },
      "radius": {
        "sm": "0.375rem",
        "base": "0.5rem",
        "lg": "1rem"
      },
      "shadows": {
        "sm": "0 1px 2px rgba(0,0,0,0.05)",
        "base": "0 4px 6px rgba(0,0,0,0.1)"
      }
    },
    
    "assets": {
      "bg_main": {
        "type": "color",
        "value": "#f9fafb"
      },
      "bg_sidebar": {
        "type": "color",
        "value": "#ffffff"
      },
      "icon_logo": {
        "type": "emoji",
        "value": "🌈"
      },
      "icon_home": {
        "type": "emoji",
        "value": "🏠"
      },
      "icon_game": {
        "type": "emoji",
        "value": "🎮"
      },
      "icon_user": {
        "type": "emoji",
        "value": "👤"
      },
      "btn_primary_bg": {
        "type": "color",
        "value": "#FF6B9D"
      }
    },
    
    "audio": {
      "sfx_click": {
        "type": "audio",
        "url": "",
        "volume": 0.4
      },
      "sfx_notification": {
        "type": "audio",
        "url": "",
        "volume": 0.45
      }
    }
  }
}', 
'清新活泼的粉彩风格主题，适用于平台首页、个人中心、商城等非游戏页面');

-- 示例 2: 游戏主题 - 贪吃蛇经典绿色主题
SET @snake_game_id = (SELECT game_id FROM game WHERE game_code = 'snake-vue3' LIMIT 1);

INSERT INTO `theme_info` 
(`author_id`, `theme_name`, `author_name`, `applicable_scope`, `price`, `status`, `config_json`, `description`) 
VALUES 
(1, '贪吃蛇 - 经典绿色', '官方设计师', 'specific', 0, 'on_sale', 
'{
  "default": {
    "name": "经典绿色主题",
    "author": "官方设计师",
    "description": "传统经典的绿色贪吃蛇风格",
    "version": "1.0.0",
    "gameCode": "snake-vue3",
    
    "styles": {
      "colors": {
        "primary": "#4ade80",
        "secondary": "#22c55e",
        "background": "#1e293b",
        "surface": "#334155",
        "text": "#ffffff",
        "accent": "#fbbf24"
      },
      "typography": {
        "fontFamily": "\"Press Start 2P\", cursive",
        "fontSizes": {
          "title": "40px",
          "subtitle": "24px",
          "body": "16px"
        }
      },
      "radius": {
        "base": "8px"
      },
      "shadows": {
        "glow": "0 0 10px rgba(74,222,128,0.5)"
      }
    },
    
    "assets": {
      "snakeHead": {
        "type": "emoji",
        "value": "🐍"
      },
      "snakeBody": {
        "type": "color",
        "value": "#4ade80"
      },
      "snakeTail": {
        "type": "color",
        "value": "#22c55e"
      },
      "food_normal": {
        "type": "emoji",
        "value": "🍎"
      },
      "food_special": {
        "type": "emoji",
        "value": "⭐"
      },
      "gameBg": {
        "type": "color",
        "value": "#1e293b"
      },
      "gridLine": {
        "type": "color",
        "value": "#334155"
      }
    },
    
    "audio": {
      "bgmGameplay": {
        "type": "audio",
        "url": "",
        "loop": true,
        "volume": 0.15
      },
      "sfxEat": {
        "type": "audio",
        "url": "",
        "volume": 0.1
      },
      "sfxDie": {
        "type": "audio",
        "url": "",
        "volume": 0.15
      }
    }
  }
}', 
'经典绿色贪吃蛇主题，还原传统游戏体验');

-- 关联到贪吃蛇游戏
INSERT INTO `theme_game_relation` 
(`theme_id`, `game_id`, `game_code`, `is_default`, `sort_order`) 
VALUES 
(LAST_INSERT_ID(), 
 COALESCE(@snake_game_id, 1), 
 'snake-vue3', 
 1, 
 1);

-- ============================================
-- 5. 验证查询
-- ============================================

-- 查看所有主题
SELECT 
  theme_id,
  theme_name,
  applicable_scope,
  status,
  JSON_EXTRACT(config_json, '$.default.name') as config_name
FROM theme_info
ORDER BY created_at DESC;

-- 查看某个游戏的所有主题
SELECT 
  t.theme_id,
  t.theme_name,
  t.price,
  r.is_default,
  r.sort_order
FROM theme_info t
LEFT JOIN theme_game_relation r ON t.theme_id = r.theme_id
WHERE r.game_code = 'snake-vue3'
  AND t.status = 'on_sale'
ORDER BY r.is_default DESC, r.sort_order ASC;
