-- 检查并插入贪吃蛇游戏主题
-- 执行此脚本以确保贪吃蛇游戏有可用的主题

-- 1. 检查现有主题
SELECT 
    theme_id AS '主题ID',
    theme_name AS '主题名称',
    owner_type AS '所有者类型',
    owner_id AS '所有者ID',
    price AS '价格',
    status AS '状态',
    download_count AS '下载次数'
FROM t_theme_info
WHERE status = 'on_sale'
ORDER BY theme_id;

-- 2. 如果没有主题，插入默认主题
-- 注意：这里假设贪吃蛇游戏的 ID 是 3，请根据实际情况调整

-- 插入一个免费的贪吃蛇默认主题（如果不存在）
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
    '默认绿色主题',
    1,
    '系统管理员',
    'GAME',
    3,  -- 贪吃蛇游戏ID，请根据实际情况调整
    0,  -- 免费主题
    'on_sale',
    NULL,
    '贪吃蛇游戏的默认绿色主题',
    '{
  "default": {
    "name": "默认绿色主题",
    "description": "经典的绿色贪吃蛇主题",
    "author": "系统管理员",
    "version": "1.0.0",
    "colors": {
      "primary": "#4ade80",
      "secondary": "#22c55e",
      "background": "#1e293b",
      "surface": "#334155",
      "text": "#ffffff",
      "textSecondary": "#94a3b8",
      "accent": "#fbbf24",
      "success": "#22c55e",
      "warning": "#f59e0b",
      "error": "#ef4444"
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
      "food": {
        "type": "emoji",
        "value": "🍎"
      },
      "specialFood": {
        "type": "emoji",
        "value": "⭐"
      },
      "background": {
        "type": "color",
        "value": "#1e293b"
      },
      "grid": {
        "type": "color",
        "value": "#334155"
      }
    },
    "audio": {
      "bgm": {
        "enabled": true,
        "volume": 0.15
      },
      "eat": {
        "enabled": true,
        "volume": 0.08
      },
      "die": {
        "enabled": true,
        "volume": 0.12
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
    WHERE theme_name = '默认绿色主题' 
    AND owner_id = 3
);

-- 3. 插入一个应用级别的通用主题（可选）
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
    '经典蓝色主题',
    1,
    '系统管理员',
    'APPLICATION',
    NULL,  -- 应用主题不需要 owner_id
    0,  -- 免费
    'on_sale',
    NULL,
    '适用于所有游戏的经典蓝色主题',
    '{
  "default": {
    "name": "经典蓝色主题",
    "description": "适用于所有游戏的经典蓝色主题",
    "author": "系统管理员",
    "version": "1.0.0",
    "colors": {
      "primary": "#3b82f6",
      "secondary": "#2563eb",
      "background": "#0f172a",
      "surface": "#1e293b",
      "text": "#ffffff",
      "textSecondary": "#94a3b8",
      "accent": "#fbbf24",
      "success": "#22c55e",
      "warning": "#f59e0b",
      "error": "#ef4444"
    },
    "assets": {
      "snakeHead": {
        "type": "emoji",
        "value": "🐍"
      },
      "snakeBody": {
        "type": "color",
        "value": "#3b82f6"
      },
      "snakeTail": {
        "type": "color",
        "value": "#2563eb"
      },
      "food": {
        "type": "emoji",
        "value": "🍎"
      },
      "specialFood": {
        "type": "emoji",
        "value": "⭐"
      },
      "background": {
        "type": "color",
        "value": "#0f172a"
      },
      "grid": {
        "type": "color",
        "value": "#1e293b"
      }
    },
    "audio": {
      "bgm": {
        "enabled": true,
        "volume": 0.15
      },
      "eat": {
        "enabled": true,
        "volume": 0.08
      },
      "die": {
        "enabled": true,
        "volume": 0.12
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
    WHERE theme_name = '经典蓝色主题' 
    AND owner_type = 'APPLICATION'
);

-- 4. 再次显示所有可用的主题
SELECT 
    theme_id AS '主题ID',
    theme_name AS '主题名称',
    owner_type AS '所有者类型',
    owner_id AS '所有者ID',
    price AS '价格',
    status AS '状态',
    download_count AS '下载次数'
FROM t_theme_info
WHERE status = 'on_sale'
ORDER BY theme_id;

-- 5. 显示提示信息
SELECT '✅ 主题初始化完成！' AS '提示',
       '如果看到主题列表，说明数据已就绪' AS '说明',
       '请重启后端服务并刷新前端页面' AS '下一步';
