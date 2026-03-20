-- =====================================================
-- 修复主题资源配置 - 使用本地生成的资源
-- =====================================================

-- ============================================
-- 1. 修复贪吃蛇主题配置
-- ============================================

-- 修复贪吃蛇 - 清新绿主题（默认主题）
UPDATE theme_info t
INNER JOIN theme_game_relation r ON t.theme_id = r.theme_id
SET t.config_json = '{
  "default": {
    "name": "清新绿",
    "author": "官方团队",
    "description": "贪吃蛇官方默认主题，清新的绿色风格",
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
      }
    },
    
    "assets": {
      "snakeHead": {
        "type": "image",
        "url": "http://localhost:5173/games/snake-vue3/themes/default/images/snakeHead.png",
        "fallback": {"type": "color", "value": "#00ff00"}
      },
      "snakeBody": {
        "type": "image",
        "url": "http://localhost:5173/games/snake-vue3/themes/default/images/snakeBody.png",
        "fallback": {"type": "color", "value": "#42b983"}
      },
      "snakeTail": {
        "type": "image",
        "url": "http://localhost:5173/games/snake-vue3/themes/default/images/snakeTail.png",
        "fallback": {"type": "color", "value": "#22c55e"}
      },
      "food": {
        "type": "image",
        "url": "http://localhost:5173/games/snake-vue3/themes/default/images/food.png",
        "fallback": {"type": "emoji", "value": "🍎"}
      },
      "background": {
        "type": "image",
        "url": "http://localhost:5173/games/snake-vue3/themes/default/images/background.png",
        "fallback": {"type": "color", "value": "#0a0a1a"}
      },
      "grid": {
        "type": "color",
        "value": "#1e293b"
      }
    },
    
    "audio": {
      "bgm": {
        "type": "audio",
        "url": "http://localhost:5173/games/audio/snake_bgm_default.wav",
        "volume": 0.15,
        "loop": true
      },
      "eat": {
        "type": "audio",
        "url": "http://localhost:5173/games/audio/snake_eat.wav",
        "volume": 0.08
      },
      "die": {
        "type": "audio",
        "url": "http://localhost:5173/games/audio/snake_gameover.wav",
        "volume": 0.12
      }
    }
  }
}'
WHERE t.theme_name = '贪吃蛇 - 清新绿' 
  AND r.game_code = 'snake-vue3';

-- 修复贪吃蛇 - 经典复古主题
UPDATE theme_info t
INNER JOIN theme_game_relation r ON t.theme_id = r.theme_id
SET t.config_json = '{
  "default": {
    "name": "经典复古",
    "author": "官方团队",
    "description": "经典的复古像素风格，重现 80 年代街机游戏的怀旧感觉",
    "version": "1.0.0",
    "gameCode": "snake-vue3",
    
    "styles": {
      "colors": {
        "primary": "#32cd32",
        "secondary": "#228b22",
        "background": "#000000",
        "surface": "#1a1a1a",
        "text": "#ffffff",
        "accent": "#ffff00"
      }
    },
    
    "assets": {
      "snakeHead": {
        "type": "image",
        "url": "http://localhost:5173/games/snake-vue3/themes/retro/images/snakeHead.png",
        "fallback": {"type": "color", "value": "#32cd32"}
      },
      "snakeBody": {
        "type": "image",
        "url": "http://localhost:5173/games/snake-vue3/themes/retro/images/snakeBody.png",
        "fallback": {"type": "color", "value": "#228b22"}
      },
      "snakeTail": {
        "type": "image",
        "url": "http://localhost:5173/games/snake-vue3/themes/retro/images/snakeTail.png",
        "fallback": {"type": "color", "value": "#006400"}
      },
      "food": {
        "type": "image",
        "url": "http://localhost:5173/games/snake-vue3/themes/retro/images/food.png",
        "fallback": {"type": "emoji", "value": "💛"}
      },
      "background": {
        "type": "image",
        "url": "http://localhost:5173/games/snake-vue3/themes/retro/images/background.png",
        "fallback": {"type": "color", "value": "#000000"}
      },
      "grid": {
        "type": "color",
        "value": "#333333"
      }
    },
    
    "audio": {
      "bgm": {
        "type": "audio",
        "url": "http://localhost:5173/games/audio/snake_bgm_retro.wav",
        "volume": 0.1,
        "loop": true
      },
      "eat": {
        "type": "audio",
        "url": "http://localhost:5173/games/audio/snake_eat.wav",
        "volume": 0.08
      },
      "die": {
        "type": "audio",
        "url": "http://localhost:5173/games/audio/snake_gameover.wav",
        "volume": 0.1
      }
    }
  }
}'
WHERE t.theme_name = '贪吃蛇 - 经典复古' 
  AND r.game_code = 'snake-vue3';

-- 修复贪吃蛇 - 活力橙主题
UPDATE theme_info t
INNER JOIN theme_game_relation r ON t.theme_id = r.theme_id
SET t.config_json = '{
  "default": {
    "name": "活力橙",
    "author": "官方团队",
    "description": "充满活力的橙色主题，给你不一样的游戏体验",
    "version": "1.0.0",
    "gameCode": "snake-vue3",
    
    "styles": {
      "colors": {
        "primary": "#ff6600",
        "secondary": "#ff9933",
        "background": "#1a1a2e",
        "surface": "#2d2d44",
        "text": "#ffffff",
        "accent": "#00ffff"
      }
    },
    
    "assets": {
      "snakeHead": {
        "type": "image",
        "url": "http://localhost:5173/games/snake-vue3/themes/orange/images/snakeHead.png",
        "fallback": {"type": "color", "value": "#ff6600"}
      },
      "snakeBody": {
        "type": "image",
        "url": "http://localhost:5173/games/snake-vue3/themes/orange/images/snakeBody.png",
        "fallback": {"type": "color", "value": "#ff9933"}
      },
      "snakeTail": {
        "type": "image",
        "url": "http://localhost:5173/games/snake-vue3/themes/orange/images/snakeTail.png",
        "fallback": {"type": "color", "value": "#cc5500"}
      },
      "food": {
        "type": "image",
        "url": "http://localhost:5173/games/snake-vue3/themes/orange/images/food.png",
        "fallback": {"type": "emoji", "value": "💠"}
      },
      "background": {
        "type": "image",
        "url": "http://localhost:5173/games/snake-vue3/themes/orange/images/background.png",
        "fallback": {"type": "color", "value": "#1a1a2e"}
      },
      "grid": {
        "type": "color",
        "value": "#2d2d44"
      }
    },
    
    "audio": {
      "bgm": {
        "type": "audio",
        "url": "http://localhost:5173/games/audio/snake_bgm_orange.wav",
        "volume": 0.12,
        "loop": true
      },
      "eat": {
        "type": "audio",
        "url": "http://localhost:5173/games/audio/snake_eat.wav",
        "volume": 0.08
      },
      "die": {
        "type": "audio",
        "url": "http://localhost:5173/games/audio/snake_gameover.wav",
        "volume": 0.1
      }
    }
  }
}'
WHERE t.theme_name = '贪吃蛇 - 活力橙' 
  AND r.game_code = 'snake-vue3';

-- ============================================
-- 2. 修复植物大战僵尸主题配置
-- ============================================

-- 修复 PVZ - 阳光活力主题（默认主题）
UPDATE theme_info t
INNER JOIN theme_game_relation r ON t.theme_id = r.theme_id
SET t.config_json = '{
  "default": {
    "name": "阳光活力",
    "author": "官方团队",
    "description": "植物大战僵尸官方默认主题，充满活力的阳光风格",
    "version": "1.0.0",
    "gameCode": "plants-vs-zombie",
    
    "styles": {
      "colors": {
        "primary": "#4caf50",
        "secondary": "#8bc34a",
        "background": "#1a472a",
        "surface": "#2d5a3d",
        "text": "#ffffff",
        "accent": "#ffeb3b"
      }
    },
    
    "assets": {
      "player": {
        "type": "image",
        "url": "http://localhost:5173/games/plants-vs-zombie/themes/default/images/plant_sunflower.png",
        "fallback": {"type": "emoji", "value": "🌻"}
      },
      "enemy": {
        "type": "image",
        "url": "http://localhost:5173/games/plants-vs-zombie/themes/default/images/zombie_normal.png",
        "fallback": {"type": "emoji", "value": "🧟"}
      },
      "projectile": {
        "type": "image",
        "url": "http://localhost:5173/games/plants-vs-zombie/themes/default/images/pea.png",
        "fallback": {"type": "emoji", "value": "🟢"}
      },
      "sun": {
        "type": "image",
        "url": "http://localhost:5173/games/plants-vs-zombie/themes/default/images/sun.png",
        "fallback": {"type": "emoji", "value": "☀️"}
      },
      "background": {
        "type": "image",
        "url": "http://localhost:5173/games/plants-vs-zombie/themes/default/images/gameBg.png",
        "fallback": {"type": "color", "value": "#1a472a"}
      },
      "ground": {
        "type": "color",
        "value": "#2d5a3d"
      }
    },
    
    "gameSpecific": {
      "pvz": {
        "plants": {
          "sunflower": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/default/images/plant_sunflower.png",
            "fallback": {"type": "emoji", "value": "🌻"}
          },
          "peashooter": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/default/images/plant_peashooter.png",
            "fallback": {"type": "emoji", "value": "🌱"}
          },
          "wallnut": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/default/images/plant_wallnut.png",
            "fallback": {"type": "emoji", "value": "🥔"}
          },
          "cherrybomb": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/default/images/plant_cherrybomb.png",
            "fallback": {"type": "emoji", "value": "🍒"}
          },
          "snowpea": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/default/images/plant_snowpea.png",
            "fallback": {"type": "emoji", "value": "❄️"}
          }
        },
        "zombies": {
          "normal": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/default/images/zombie_normal.png",
            "fallback": {"type": "emoji", "value": "🧟"}
          },
          "cone": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/default/images/zombie_conehead.png",
            "fallback": {"type": "emoji", "value": "🧟"}
          },
          "bucket": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/default/images/zombie_buckethead.png",
            "fallback": {"type": "emoji", "value": "🧟"}
          },
          "imp": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/default/images/zombie_imp.png",
            "fallback": {"type": "emoji", "value": "👶"}
          }
        },
        "projectile": {
          "type": "image",
          "url": "http://localhost:5173/games/plants-vs-zombie/themes/default/images/pea.png",
          "fallback": {"type": "emoji", "value": "🟢"}
        },
        "sun": {
          "type": "image",
          "url": "http://localhost:5173/games/plants-vs-zombie/themes/default/images/sun.png",
          "fallback": {"type": "emoji", "value": "☀️"}
        }
      }
    },
    
    "audio": {
      "bgm": {
        "type": "audio",
        "url": "http://localhost:5173/games/audio/pvz_bgm_default.wav",
        "volume": 0.15,
        "loop": true
      },
      "shoot": {
        "type": "audio",
        "url": "http://localhost:5173/games/audio/pvz_shoot.wav",
        "volume": 0.1
      },
      "hit": {
        "type": "audio",
        "url": "http://localhost:5173/games/audio/pvz_hit.wav",
        "volume": 0.1
      },
      "collect": {
        "type": "audio",
        "url": "http://localhost:5173/games/audio/pvz_collect.wav",
        "volume": 0.15
      }
    }
  }
}'
WHERE t.theme_name = '植物大战僵尸 - 阳光活力' 
  AND r.game_code = 'plants-vs-zombie';

-- 修复 PVZ - 月夜幽深主题
UPDATE theme_info t
INNER JOIN theme_game_relation r ON t.theme_id = r.theme_id
SET t.config_json = '{
  "default": {
    "name": "月夜幽深",
    "author": "官方团队",
    "description": "神秘的月夜风格，在月光下守护你的花园",
    "version": "1.0.0",
    "gameCode": "plants-vs-zombie",
    
    "styles": {
      "colors": {
        "primary": "#673ab7",
        "secondary": "#512da8",
        "background": "#0f0216",
        "surface": "#1e1b4b",
        "text": "#e9d5ff",
        "accent": "#cddc39"
      }
    },
    
    "assets": {
      "player": {
        "type": "image",
        "url": "http://localhost:5173/games/plants-vs-zombie/themes/moon/images/plant_sunflower.png",
        "fallback": {"type": "emoji", "value": "🌙"}
      },
      "enemy": {
        "type": "image",
        "url": "http://localhost:5173/games/plants-vs-zombie/themes/moon/images/zombie_normal.png",
        "fallback": {"type": "emoji", "value": "🧟"}
      },
      "projectile": {
        "type": "image",
        "url": "http://localhost:5173/games/plants-vs-zombie/themes/moon/images/pea.png",
        "fallback": {"type": "emoji", "value": "🟣"}
      },
      "sun": {
        "type": "image",
        "url": "http://localhost:5173/games/plants-vs-zombie/themes/moon/images/sun.png",
        "fallback": {"type": "emoji", "value": "🌙"}
      },
      "background": {
        "type": "image",
        "url": "http://localhost:5173/games/plants-vs-zombie/themes/moon/images/gameBg.png",
        "fallback": {"type": "color", "value": "#0f0216"}
      },
      "ground": {
        "type": "color",
        "value": "#1e1b4b"
      }
    },
    
    "gameSpecific": {
      "pvz": {
        "plants": {
          "sunflower": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/moon/images/plant_sunflower.png",
            "fallback": {"type": "emoji", "value": "🌙"}
          },
          "peashooter": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/moon/images/plant_peashooter.png",
            "fallback": {"type": "emoji", "value": "🟣"}
          },
          "wallnut": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/moon/images/plant_wallnut.png",
            "fallback": {"type": "emoji", "value": "🥔"}
          },
          "cherrybomb": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/moon/images/plant_cherrybomb.png",
            "fallback": {"type": "emoji", "value": "🍇"}
          },
          "snowpea": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/moon/images/plant_snowpea.png",
            "fallback": {"type": "emoji", "value": "💜"}
          }
        },
        "zombies": {
          "normal": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/moon/images/zombie_normal.png",
            "fallback": {"type": "emoji", "value": "🧟"}
          },
          "cone": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/moon/images/zombie_conehead.png",
            "fallback": {"type": "emoji", "value": "🧟"}
          },
          "bucket": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/moon/images/zombie_buckethead.png",
            "fallback": {"type": "emoji", "value": "🧟"}
          },
          "imp": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/moon/images/zombie_imp.png",
            "fallback": {"type": "emoji", "value": "👶"}
          }
        },
        "projectile": {
          "type": "image",
          "url": "http://localhost:5173/games/plants-vs-zombie/themes/moon/images/pea.png",
          "fallback": {"type": "emoji", "value": "🟣"}
        },
        "sun": {
          "type": "image",
          "url": "http://localhost:5173/games/plants-vs-zombie/themes/moon/images/sun.png",
          "fallback": {"type": "emoji", "value": "🌙"}
        }
      }
    },
    
    "audio": {
      "bgm": {
        "type": "audio",
        "url": "http://localhost:5173/games/audio/pvz_bgm_moon.wav",
        "volume": 0.1,
        "loop": true
      },
      "shoot": {
        "type": "audio",
        "url": "http://localhost:5173/games/audio/pvz_shoot.wav",
        "volume": 0.1
      },
      "hit": {
        "type": "audio",
        "url": "http://localhost:5173/games/audio/pvz_hit.wav",
        "volume": 0.12
      },
      "collect": {
        "type": "audio",
        "url": "http://localhost:5173/games/audio/pvz_collect.wav",
        "volume": 0.1
      }
    }
  }
}'
WHERE t.theme_name = '植物大战僵尸 - 月夜幽深' 
  AND r.game_code = 'plants-vs-zombie';

-- 修复 PVZ - 卡通萌系主题
UPDATE theme_info t
INNER JOIN theme_game_relation r ON t.theme_id = r.theme_id
SET t.config_json = '{
  "default": {
    "name": "卡通萌系",
    "author": "官方团队",
    "description": "可爱的卡通风格，植物和僵尸都变得萌萌哒",
    "version": "1.0.0",
    "gameCode": "plants-vs-zombie",
    
    "styles": {
      "colors": {
        "primary": "#e91e63",
        "secondary": "#f06292",
        "background": "#fce4ec",
        "surface": "#f8bbd9",
        "text": "#880e4f",
        "accent": "#ff9800"
      }
    },
    
    "assets": {
      "player": {
        "type": "image",
        "url": "http://localhost:5173/games/plants-vs-zombie/themes/cute/images/plant_sunflower.png",
        "fallback": {"type": "emoji", "value": "🌸"}
      },
      "enemy": {
        "type": "image",
        "url": "http://localhost:5173/games/plants-vs-zombie/themes/cute/images/zombie_normal.png",
        "fallback": {"type": "emoji", "value": "👻"}
      },
      "projectile": {
        "type": "image",
        "url": "http://localhost:5173/games/plants-vs-zombie/themes/cute/images/pea.png",
        "fallback": {"type": "emoji", "value": "💖"}
      },
      "sun": {
        "type": "image",
        "url": "http://localhost:5173/games/plants-vs-zombie/themes/cute/images/sun.png",
        "fallback": {"type": "emoji", "value": "⭐"}
      },
      "background": {
        "type": "image",
        "url": "http://localhost:5173/games/plants-vs-zombie/themes/cute/images/gameBg.png",
        "fallback": {"type": "color", "value": "#fce4ec"}
      },
      "ground": {
        "type": "color",
        "value": "#f8bbd9"
      }
    },
    
    "gameSpecific": {
      "pvz": {
        "plants": {
          "sunflower": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/cute/images/plant_sunflower.png",
            "fallback": {"type": "emoji", "value": "🌸"}
          },
          "peashooter": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/cute/images/plant_peashooter.png",
            "fallback": {"type": "emoji", "value": "🌷"}
          },
          "wallnut": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/cute/images/plant_wallnut.png",
            "fallback": {"type": "emoji", "value": "🥝"}
          },
          "cherrybomb": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/cute/images/plant_cherrybomb.png",
            "fallback": {"type": "emoji", "value": "🍓"}
          },
          "snowpea": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/cute/images/plant_snowpea.png",
            "fallback": {"type": "emoji", "value": "💗"}
          }
        },
        "zombies": {
          "normal": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/cute/images/zombie_normal.png",
            "fallback": {"type": "emoji", "value": "👻"}
          },
          "cone": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/cute/images/zombie_conehead.png",
            "fallback": {"type": "emoji", "value": "👻"}
          },
          "bucket": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/cute/images/zombie_buckethead.png",
            "fallback": {"type": "emoji", "value": "👻"}
          },
          "imp": {
            "type": "image",
            "url": "http://localhost:5173/games/plants-vs-zombie/themes/cute/images/zombie_imp.png",
            "fallback": {"type": "emoji", "value": "👶"}
          }
        },
        "projectile": {
          "type": "image",
          "url": "http://localhost:5173/games/plants-vs-zombie/themes/cute/images/pea.png",
          "fallback": {"type": "emoji", "value": "💖"}
        },
        "sun": {
          "type": "image",
          "url": "http://localhost:5173/games/plants-vs-zombie/themes/cute/images/sun.png",
          "fallback": {"type": "emoji", "value": "⭐"}
        }
      }
    },
    
    "audio": {
      "bgm": {
        "type": "audio",
        "url": "http://localhost:5173/games/audio/pvz_bgm_cute.wav",
        "volume": 0.12,
        "loop": true
      },
      "shoot": {
        "type": "audio",
        "url": "http://localhost:5173/games/audio/pvz_shoot.wav",
        "volume": 0.08
      },
      "hit": {
        "type": "audio",
        "url": "http://localhost:5173/games/audio/pvz_hit.wav",
        "volume": 0.1
      },
      "collect": {
        "type": "audio",
        "url": "http://localhost:5173/games/audio/pvz_collect.wav",
        "volume": 0.15
      }
    }
  }
}'
WHERE t.theme_name = '植物大战僵尸 - 卡通萌系' 
  AND r.game_code = 'plants-vs-zombie';

-- ============================================
-- 3. 验证修复结果
-- ============================================

-- 查询所有贪吃蛇主题的配置
SELECT 
  t.theme_id,
  t.theme_name,
  JSON_EXTRACT(t.config_json, '$.default.name') as config_name,
  JSON_EXTRACT(t.config_json, '$.default.assets.snakeHead.url') as snake_head_url,
  JSON_EXTRACT(t.config_json, '$.default.audio.bgm.url') as bgm_url
FROM theme_info t
INNER JOIN theme_game_relation r ON t.theme_id = r.theme_id
WHERE r.game_code = 'snake-vue3'
ORDER BY t.theme_id;

-- 查询所有植物大战僵尸主题的配置
SELECT 
  t.theme_id,
  t.theme_name,
  JSON_EXTRACT(t.config_json, '$.default.name') as config_name,
  JSON_EXTRACT(t.config_json, '$.default.gameSpecific.pvz.plants.sunflower.url') as sunflower_url,
  JSON_EXTRACT(t.config_json, '$.default.audio.bgm.url') as bgm_url
FROM theme_info t
INNER JOIN theme_game_relation r ON t.theme_id = r.theme_id
WHERE r.game_code = 'plants-vs-zombie'
ORDER BY t.theme_id;
