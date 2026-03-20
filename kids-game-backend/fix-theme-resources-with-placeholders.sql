-- =====================================================
-- 修复主题资源配置 - 使用正确的图片 + 音频结构
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
        "url": "https://placehold.co/64x64/00ff00/ffffff?text=Snake+Head&font=noto",
        "fallback": {"type": "color", "value": "#00ff00"}
      },
      "snakeBody": {
        "type": "image",
        "url": "https://placehold.co/48x48/42b983/ffffff?text=Body&font=noto",
        "fallback": {"type": "color", "value": "#42b983"}
      },
      "snakeTail": {
        "type": "image",
        "url": "https://placehold.co/32x32/22c55e/ffffff?text=Tai&font=noto",
        "fallback": {"type": "color", "value": "#22c55e"}
      },
      "food": {
        "type": "image",
        "url": "https://placehold.co/32x32/ff0000/ffffff?text=Apple&font=noto",
        "fallback": {"type": "emoji", "value": "🍎"}
      },
      "background": {
        "type": "color",
        "value": "#0a0a1a"
      },
      "grid": {
        "type": "color",
        "value": "#1e293b"
      }
    },
    
    "audio": {
      "bgm": {
        "type": "audio",
        "url": "",
        "volume": 0.15,
        "loop": true
      },
      "eat": {
        "type": "audio",
        "url": "",
        "volume": 0.08
      },
      "die": {
        "type": "audio",
        "url": "",
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
        "url": "https://placehold.co/64x64/32cd32/000000?text=Retro+Snake&font=noto",
        "fallback": {"type": "color", "value": "#32cd32"}
      },
      "snakeBody": {
        "type": "image",
        "url": "https://placehold.co/48x48/228b22/000000?text=Retro+Body&font=noto",
        "fallback": {"type": "color", "value": "#228b22"}
      },
      "snakeTail": {
        "type": "image",
        "url": "https://placehold.co/32x32/006400/000000?text=Retro+Tai&font=noto",
        "fallback": {"type": "color", "value": "#006400"}
      },
      "food": {
        "type": "image",
        "url": "https://placehold.co/32x32/ffff00/000000?text=Retro+Food&font=noto",
        "fallback": {"type": "emoji", "value": "💛"}
      },
      "background": {
        "type": "color",
        "value": "#000000"
      },
      "grid": {
        "type": "color",
        "value": "#333333"
      }
    },
    
    "audio": {
      "bgm": {
        "type": "audio",
        "url": "",
        "volume": 0.1,
        "loop": true
      },
      "eat": {
        "type": "audio",
        "url": "",
        "volume": 0.08
      },
      "die": {
        "type": "audio",
        "url": "",
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
        "url": "https://placehold.co/64x64/ff6600/ffffff?text=Orange+Snake&font=noto",
        "fallback": {"type": "color", "value": "#ff6600"}
      },
      "snakeBody": {
        "type": "image",
        "url": "https://placehold.co/48x48/ff9933/ffffff?text=Orange+Body&font=noto",
        "fallback": {"type": "color", "value": "#ff9933"}
      },
      "snakeTail": {
        "type": "image",
        "url": "https://placehold.co/32x32/cc5500/ffffff?text=Orange+Tai&font=noto",
        "fallback": {"type": "color", "value": "#cc5500"}
      },
      "food": {
        "type": "image",
        "url": "https://placehold.co/32x32/00ffff/000000?text=Orange+Food&font=noto",
        "fallback": {"type": "emoji", "value": "💠"}
      },
      "background": {
        "type": "color",
        "value": "#1a1a2e"
      },
      "grid": {
        "type": "color",
        "value": "#2d2d44"
      }
    },
    
    "audio": {
      "bgm": {
        "type": "audio",
        "url": "",
        "volume": 0.12,
        "loop": true
      },
      "eat": {
        "type": "audio",
        "url": "",
        "volume": 0.08
      },
      "die": {
        "type": "audio",
        "url": "",
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
        "url": "https://placehold.co/64x64/4caf50/ffffff?text=Player&font=noto",
        "fallback": {"type": "emoji", "value": "🌻"}
      },
      "enemy": {
        "type": "image",
        "url": "https://placehold.co/64x64/757575/ffffff?text=Enemy&font=noto",
        "fallback": {"type": "emoji", "value": "🧟"}
      },
      "projectile": {
        "type": "image",
        "url": "https://placehold.co/16x16/4caf50/ffffff?text=Pea&font=noto",
        "fallback": {"type": "emoji", "value": "🟢"}
      },
      "sun": {
        "type": "image",
        "url": "https://placehold.co/48x48/ffeb3b/000000?text=Sun&font=noto",
        "fallback": {"type": "emoji", "value": "☀️"}
      },
      "background": {
        "type": "image",
        "url": "https://placehold.co/800x600/1a472a/ffffff?text=Game+BG&font=noto",
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
            "url": "https://placehold.co/64x64/ffeb3b/000000?text=Sunflower&font=noto",
            "fallback": {"type": "emoji", "value": "🌻"}
          },
          "peashooter": {
            "type": "image",
            "url": "https://placehold.co/64x64/4caf50/ffffff?text=Peashooter&font=noto",
            "fallback": {"type": "emoji", "value": "🌱"}
          },
          "wallnut": {
            "type": "image",
            "url": "https://placehold.co/64x64/8d6e63/ffffff?text=Wallnut&font=noto",
            "fallback": {"type": "emoji", "value": "🥔"}
          },
          "cherrybomb": {
            "type": "image",
            "url": "https://placehold.co/64x64/f44336/ffffff?text=Cherry+Bomb&font=noto",
            "fallback": {"type": "emoji", "value": "🍒"}
          },
          "snowpea": {
            "type": "image",
            "url": "https://placehold.co/64x64/03a9f4/ffffff?text=Snow+Pea&font=noto",
            "fallback": {"type": "emoji", "value": "❄️"}
          }
        },
        "zombies": {
          "normal": {
            "type": "image",
            "url": "https://placehold.co/64x64/757575/ffffff?text=Normal+Zombie&font=noto",
            "fallback": {"type": "emoji", "value": "🧟"}
          },
          "cone": {
            "type": "image",
            "url": "https://placehold.co/64x64/ff9800/ffffff?text=Cone+Zombie&font=noto",
            "fallback": {"type": "emoji", "value": "🧟"}
          },
          "bucket": {
            "type": "image",
            "url": "https://placehold.co/64x64/607d8b/ffffff?text=Bucket+Zombie&font=noto",
            "fallback": {"type": "emoji", "value": "🧟"}
          },
          "imp": {
            "type": "image",
            "url": "https://placehold.co/48x48/9e9e9e/ffffff?text=Imp&font=noto",
            "fallback": {"type": "emoji", "value": "👶"}
          }
        },
        "projectile": {
          "type": "image",
          "url": "https://placehold.co/16x16/4caf50/ffffff?text=Pea&font=noto",
          "fallback": {"type": "emoji", "value": "🟢"}
        },
        "sun": {
          "type": "image",
          "url": "https://placehold.co/48x48/ffeb3b/000000?text=Sun&font=noto",
          "fallback": {"type": "emoji", "value": "☀️"}
        }
      }
    },
    
    "audio": {
      "bgm": {
        "type": "audio",
        "url": "",
        "volume": 0.15,
        "loop": true
      },
      "shoot": {
        "type": "audio",
        "url": "",
        "volume": 0.1
      },
      "hit": {
        "type": "audio",
        "url": "",
        "volume": 0.1
      },
      "collect": {
        "type": "audio",
        "url": "",
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
        "url": "https://placehold.co/64x64/673ab7/ffffff?text=Moon+Player&font=noto",
        "fallback": {"type": "emoji", "value": "🌙"}
      },
      "enemy": {
        "type": "image",
        "url": "https://placehold.co/64x64/424242/ffffff?text=Moon+Zombie&font=noto",
        "fallback": {"type": "emoji", "value": "🧟"}
      },
      "projectile": {
        "type": "image",
        "url": "https://placehold.co/16x16/9c27b0/ffffff?text=Moon+Pea&font=noto",
        "fallback": {"type": "emoji", "value": "🟣"}
      },
      "sun": {
        "type": "image",
        "url": "https://placehold.co/48x48/cddc39/000000?text=Moon&font=noto",
        "fallback": {"type": "emoji", "value": "🌙"}
      },
      "background": {
        "type": "image",
        "url": "https://placehold.co/800x600/0f0216/ffffff?text=Moonlight+BG&font=noto",
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
            "url": "https://placehold.co/64x64/cddc39/000000?text=Moon+Flower&font=noto",
            "fallback": {"type": "emoji", "value": "🌙"}
          },
          "peashooter": {
            "type": "image",
            "url": "https://placehold.co/64x64/9c27b0/ffffff?text=Moon+Shooter&font=noto",
            "fallback": {"type": "emoji", "value": "🟣"}
          },
          "wallnut": {
            "type": "image",
            "url": "https://placehold.co/64x64/5d4037/ffffff?text=Moon+Nut&font=noto",
            "fallback": {"type": "emoji", "value": "🥔"}
          },
          "cherrybomb": {
            "type": "image",
            "url": "https://placehold.co/64x64/7b1fa2/ffffff?text=Moon+Bomb&font=noto",
            "fallback": {"type": "emoji", "value": "🍇"}
          },
          "snowpea": {
            "type": "image",
            "url": "https://placehold.co/64x64/ab47bc/ffffff?text=Moon+Snow&font=noto",
            "fallback": {"type": "emoji", "value": "💜"}
          }
        },
        "zombies": {
          "normal": {
            "type": "image",
            "url": "https://placehold.co/64x64/424242/ffffff?text=Moon+Zombie&font=noto",
            "fallback": {"type": "emoji", "value": "🧟"}
          },
          "cone": {
            "type": "image",
            "url": "https://placehold.co/64x64/ff9800/ffffff?text=Moon+Cone&font=noto",
            "fallback": {"type": "emoji", "value": "🧟"}
          },
          "bucket": {
            "type": "image",
            "url": "https://placehold.co/64x64/607d8b/ffffff?text=Moon+Bucket&font=noto",
            "fallback": {"type": "emoji", "value": "🧟"}
          },
          "imp": {
            "type": "image",
            "url": "https://placehold.co/48x48/9e9e9e/ffffff?text=Moon+Imp&font=noto",
            "fallback": {"type": "emoji", "value": "👶"}
          }
        },
        "projectile": {
          "type": "image",
          "url": "https://placehold.co/16x16/9c27b0/ffffff?text=Moon+Pea&font=noto",
          "fallback": {"type": "emoji", "value": "🟣"}
        },
        "sun": {
          "type": "image",
          "url": "https://placehold.co/48x48/cddc39/000000?text=Moon&font=noto",
          "fallback": {"type": "emoji", "value": "🌙"}
        }
      }
    },
    
    "audio": {
      "bgm": {
        "type": "audio",
        "url": "",
        "volume": 0.1,
        "loop": true
      },
      "shoot": {
        "type": "audio",
        "url": "",
        "volume": 0.1
      },
      "hit": {
        "type": "audio",
        "url": "",
        "volume": 0.12
      },
      "collect": {
        "type": "audio",
        "url": "",
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
        "url": "https://placehold.co/64x64/e91e63/ffffff?text=Cute+Player&font=noto",
        "fallback": {"type": "emoji", "value": "🌸"}
      },
      "enemy": {
        "type": "image",
        "url": "https://placehold.co/64x64/9e9e9e/ffffff?text=Cute+Ghost&font=noto",
        "fallback": {"type": "emoji", "value": "👻"}
      },
      "projectile": {
        "type": "image",
        "url": "https://placehold.co/16x16/f06292/ffffff?text=Heart&font=noto",
        "fallback": {"type": "emoji", "value": "💖"}
      },
      "sun": {
        "type": "image",
        "url": "https://placehold.co/48x48/ff9800/ffffff?text=Star&font=noto",
        "fallback": {"type": "emoji", "value": "⭐"}
      },
      "background": {
        "type": "image",
        "url": "https://placehold.co/800x600/fce4ec/000000?text=Cute+BG&font=noto",
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
            "url": "https://placehold.co/64x64/f06292/ffffff?text=Sakura&font=noto",
            "fallback": {"type": "emoji", "value": "🌸"}
          },
          "peashooter": {
            "type": "image",
            "url": "https://placehold.co/64x64/ec407a/ffffff?text=Tulip&font=noto",
            "fallback": {"type": "emoji", "value": "🌷"}
          },
          "wallnut": {
            "type": "image",
            "url": "https://placehold.co/64x64/a1887f/ffffff?text=Kiwi&font=noto",
            "fallback": {"type": "emoji", "value": "🥝"}
          },
          "cherrybomb": {
            "type": "image",
            "url": "https://placehold.co/64x64/f44336/ffffff?text=Strawberry&font=noto",
            "fallback": {"type": "emoji", "value": "🍓"}
          },
          "snowpea": {
            "type": "image",
            "url": "https://placehold.co/64x64/ab47bc/ffffff?text=Love&font=noto",
            "fallback": {"type": "emoji", "value": "💗"}
          }
        },
        "zombies": {
          "normal": {
            "type": "image",
            "url": "https://placehold.co/64x64/bdbdbd/ffffff?text=Cute+Ghost&font=noto",
            "fallback": {"type": "emoji", "value": "👻"}
          },
          "cone": {
            "type": "image",
            "url": "https://placehold.co/64x64/ffa726/ffffff?text=Cute+Cone&font=noto",
            "fallback": {"type": "emoji", "value": "👻"}
          },
          "bucket": {
            "type": "image",
            "url": "https://placehold.co/64x64/78909c/ffffff?text=Cute+Bucket&font=noto",
            "fallback": {"type": "emoji", "value": "👻"}
          },
          "imp": {
            "type": "image",
            "url": "https://placehold.co/48x48/e0e0e0/ffffff?text=Baby&font=noto",
            "fallback": {"type": "emoji", "value": "👶"}
          }
        },
        "projectile": {
          "type": "image",
          "url": "https://placehold.co/16x16/f06292/ffffff?text=Heart&font=noto",
          "fallback": {"type": "emoji", "value": "💖"}
        },
        "sun": {
          "type": "image",
          "url": "https://placehold.co/48x48/ff9800/ffffff?text=Star&font=noto",
          "fallback": {"type": "emoji", "value": "⭐"}
        }
      }
    },
    
    "audio": {
      "bgm": {
        "type": "audio",
        "url": "",
        "volume": 0.12,
        "loop": true
      },
      "shoot": {
        "type": "audio",
        "url": "",
        "volume": 0.08
      },
      "hit": {
        "type": "audio",
        "url": "",
        "volume": 0.1
      },
      "collect": {
        "type": "audio",
        "url": "",
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
