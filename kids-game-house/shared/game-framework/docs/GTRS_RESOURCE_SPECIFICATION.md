# 🎨 GTRS 主题资源规范

**版本**: v1.0.0  
**日期**: 2026-03-27  
**适用范围**: 所有儿童游戏平台的游戏主题

---

## 📋 目录

1. [概述](#概述)
2. [规范结构](#规范结构)
3. [资源命名规范](#资源命名规范)
4. [资源分类与 Key 规范](#资源分类与-key 规范)
5. [文件组织规范](#文件组织规范)
6. [质量要求](#质量要求)
7. [校验流程](#校验流程)
8. [示例](#示例)

---

## 概述

### 什么是 GTRS？

**GTRS** (Game Theme Resource Specification) - 游戏主题资源规范

是一套完整的标准，用于：
- ✅ 统一游戏主题资源的组织结构
- ✅ 规范资源文件的命名和分类
- ✅ 确保主题在不同游戏间的兼容性
- ✅ 支持主题的动态加载和切换

---

### 核心原则

1. **语义化命名**: 使用有意义的英文命名，避免拼音或无意义字符
2. **分类清晰**: 按功能分类（scene、ui、effect、icon 等）
3. **格式统一**: 图片使用 PNG，音频使用 MP3/WAV
4. **向下兼容**: 遵循版本号规范，保证兼容性

---

## 规范结构

### GTRS JSON Schema 结构

```json
{
  "specMeta": {
    "specName": "GTRS",
    "specVersion": "1.0.0",
    "compatibleVersion": "1.0.0"
  },
  "themeInfo": {
    "themeId": "snake_default",
    "gameId": "1",
    "themeName": "贪吃蛇默认主题",
    "isDefault": true,
    "author": "系统管理员",
    "description": "贪吃蛇游戏默认主题"
  },
  "globalStyle": {
    "primaryColor": "#4ade80",
    "secondaryColor": "#22c55e",
    "bgColor": "#1a1a2e",
    "textColor": "#ffffff"
  },
  "resources": {
    "images": {
      "scene": { /* 场景资源 */ },
      "ui": { /* UI 资源 */ },
      "effect": { /* 特效资源 */ },
      "icon": { /* 图标资源 */ }
    },
    "audio": {
      "bgm": { /* 背景音乐 */ },
      "effect": { /* 音效 */ },
      "voice": { /* 语音 */ }
    },
    "video": { /* 视频资源（可选） */ }
  }
}
```

---

## 资源命名规范

### 基本规则

```
<类别>_<对象>_<状态/方向>.<扩展名>
```

**示例**:
- `sprite_player_tank_up.png` - 玩家坦克向上
- `effect_explosion_01.png` - 爆炸特效第 1 帧
- `bgm_main_theme.mp3` - 主旋律背景音乐

---

### 命名约定

| 部分 | 规则 | 示例 |
|------|------|------|
| **类别** | 小写英文，下划线分隔 | `sprite`, `scene`, `bgm` |
| **对象** | 小写英文，语义化命名 | `player`, `enemy`, `explosion` |
| **状态** | 小写英文，描述状态 | `up`, `down`, `active`, `disabled` |
| **序号** | 两位数字，从 01 开始 | `01`, `02`, `03` |

---

### ❌ 错误命名示例

```
❌ tian_ke.png          # 拼音
❌ playerTank.png       # 驼峰命名
❌ 玩家坦克.png         # 中文
❌ a.png               # 无意义
❌ tank(1).png         # 特殊字符
```

---

### ✅ 正确命名示例

```
✅ sprite_player_tank_up.png
✅ scene_brick_wall.png
✅ effect_explosion_01.png
✅ bgm_main_theme.mp3
✅ sfx_bullet_fire.wav
```

---

## 资源分类与 Key 规范

### 1. 图片资源分类

#### Scene（场景资源）

| Key 前缀 | 用途 | 示例 |
|---------|------|------|
| `scene_bg_*` | 背景图片 | `scene_bg_main`, `scene_bg_grid` |
| `scene_tile_*` | 地砖贴图 | `scene_tile_grass`, `scene_tile_water` |
| `scene_obj_*` | 场景物体 | `scene_obj_tree`, `scene_obj_rock` |

**完整示例**:
```json
"scene": {
  "scene_bg_main": {
    "src": "/themes/snake/images/scene/bg_main.png",
    "type": "image/png",
    "alias": "主背景"
  },
  "scene_bg_grid": {
    "src": "/themes/snake/images/scene/bg_grid.png",
    "type": "image/png",
    "alias": "网格背景"
  },
  "scene_tile_grass": {
    "src": "/themes/snake/images/scene/tile_grass.png",
    "type": "image/png",
    "alias": "草地砖"
  }
}
```

---

#### Sprite（精灵动画）

| Key 前缀 | 用途 | 示例 |
|---------|------|------|
| `sprite_player_*` | 玩家角色 | `sprite_player_head`, `sprite_player_body` |
| `sprite_enemy_*` | 敌人角色 | `sprite_enemy_basic`, `sprite_enemy_boss` |
| `sprite_item_*` | 道具物品 | `sprite_item_star`, `sprite_item_clock` |

**完整示例**:
```json
"sprite_player": {
  "sprite_player_head": {
    "src": "/themes/snake/images/sprite/player_head.png",
    "type": "image/png",
    "alias": "蛇头"
  },
  "sprite_player_body": {
    "src": "/themes/snake/images/sprite/player_body.png",
    "type": "image/png",
    "alias": "蛇身"
  },
  "sprite_player_tail": {
    "src": "/themes/snake/images/sprite/player_tail.png",
    "type": "image/png",
    "alias": "蛇尾"
  }
}
```

---

#### Effect（特效资源）

| Key 前缀 | 用途 | 示例 |
|---------|------|------|
| `effect_explosion_*` | 爆炸特效 | `effect_explosion_01`, `effect_explosion_02` |
| `effect_particle_*` | 粒子特效 | `effect_particle_star`, `effect_particle_spark` |
| `effect_hit_*` | 击中特效 | `effect_hit_01`, `effect_hit_02` |

---

#### Icon（图标资源）

| Key 前缀 | 用途 | 示例 |
|---------|------|------|
| `icon_item_*` | 道具图标 | `icon_item_star`, `icon_item_heart` |
| `icon_ui_*` | UI 图标 | `icon_ui_pause`, `icon_ui_play` |
| `icon_skill_*` | 技能图标 | `icon_skill_dash`, `icon_skill_shield` |

---

### 2. 音频资源分类

#### BGM（背景音乐）

| Key 前缀 | 用途 | 示例 |
|---------|------|------|
| `bgm_main_*` | 主旋律音乐 | `bgm_main_theme`, `bgm_main_loop` |
| `bgm_gameplay_*` | 游戏进行音乐 | `bgm_gameplay_action`, `bgm_gameplay_calm` |
| `bgm_victory_*` | 胜利音乐 | `bgm_victory_fanfare` |
| `bgm_defeat_*` | 失败音乐 | `bgm_defeat_sad` |

**完整示例**:
```json
"bgm": {
  "bgm_main": {
    "src": "/themes/snake/audio/bgm_main.mp3",
    "volume": 0.6,
    "loop": true,
    "alias": "主旋律"
  },
  "bgm_gameplay": {
    "src": "/themes/snake/audio/bgm_gameplay.mp3",
    "volume": 0.5,
    "loop": true,
    "alias": "游戏进行中"
  },
  "bgm_victory": {
    "src": "/themes/snake/audio/bgm_victory.mp3",
    "volume": 0.7,
    "loop": false,
    "alias": "胜利"
  }
}
```

---

#### SFX（音效）

| Key 前缀 | 用途 | 示例 |
|---------|------|------|
| `sfx_fire_*` | 射击音效 | `sfx_fire_bullet`, `sfx_fire_laser` |
| `sfx_explosion_*` | 爆炸音效 | `sfx_explosion_small`, `sfx_explosion_large` |
| `sfx_hit_*` | 击中音效 | `sfx_hit_metal`, `sfx_hit_flesh` |
| `sfx_powerup_*` | 道具音效 | `sfx_powerup_appear`, `sfx_powerup_pickup` |

---

## 文件组织规范

### 目录结构

```
themes/<theme_id>/
├── images/
│   ├── scene/           # 场景资源
│   │   ├── bg_main.png
│   │   ├── bg_grid.png
│   │   └── tile_grass.png
│   ├── sprite/          # 精灵动画
│   │   ├── player_head.png
│   │   ├── player_body.png
│   │   └── enemy_basic.png
│   ├── effect/          # 特效资源
│   │   ├── explosion_01.png
│   │   └── particle_star.png
│   └── icon/            # 图标资源
│       ├── item_star.png
│       └── ui_pause.png
├── audio/
│   ├── bgm/             # 背景音乐
│   │   ├── bgm_main.mp3
│   │   └── bgm_gameplay.mp3
│   └── sfx/             # 音效
│       ├── sfx_fire.wav
│       └── sfx_explosion.wav
└── config.json          # GTRS 配置文件
```

---

### 文件大小限制

| 资源类型 | 最大尺寸 | 推荐尺寸 | 说明 |
|---------|---------|---------|------|
| **Scene BG** | 2MB | 500KB | 背景图片可稍大 |
| **Sprite** | 512KB | 128KB | 精灵图建议合并 |
| **Effect** | 256KB | 64KB | 特效单帧较小 |
| **Icon** | 64KB | 32KB | 图标尽量小 |
| **BGM** | 10MB | 3MB | 背景音乐压缩 |
| **SFX** | 1MB | 256KB | 音效短小 |

---

## 质量要求

### 图片质量

#### 技术规范

| 指标 | 要求 | 说明 |
|------|------|------|
| **格式** | PNG-24 / PNG-8 | 支持透明通道 |
| **色彩模式** | RGBA | 必须包含 Alpha 通道 |
| **尺寸** | 2 的幂次方 | 如 64x64, 128x128 |
| **DPI** | 72 DPI | 屏幕显示标准 |
| **压缩** | 无损压缩 | 使用 TinyPNG 等工具 |

---

#### 视觉规范

1. **风格统一**: 同一主题的所有资源风格一致
2. **色彩协调**: 符合 globalStyle 定义的色彩体系
3. **边缘清晰**: 像素艺术需保持硬边缘
4. **透明处理**: 透明区域裁剪干净，无杂边

---

### 音频质量

#### 技术规范

| 指标 | 要求 | 说明 |
|------|------|------|
| **格式** | **MP3（强制）** | ⚠️ **必须使用 MP3 格式，禁止使用 WAV** |
| **采样率** | 44.1kHz | 标准 CD 音质 |
| **位深** | 16-bit | 标准数字音频 |
| **声道** | 立体声 (BGM) / 单声道 (SFX) | 根据类型选择 |
| **比特率** | 128kbps (BGM) / 64kbps (SFX) | 平衡音质和体积 |

---

#### 听觉规范

1. **音量平衡**: 所有音频音量标准化到 -6dB
2. **循环无缝**: BGM 循环点平滑过渡
3. **无爆音**: 音频首尾淡入淡出
4. **风格匹配**: 与游戏主题风格一致

---

## 校验流程

### 自动校验

使用提供的校验工具：

```bash
# 1. Schema 校验
node tools/validate-gtrs.js themes/snake/config.json

# 2. 资源文件检查
node tools/check-resources.js themes/snake/

# 3. 生成报告
node tools/generate-report.js themes/snake/ > report.md
```

---

### 人工审核清单

#### 视觉审核

- [ ] 所有图片风格统一
- [ ] 颜色符合主题设定
- [ ] 透明背景处理干净
- [ ] 无明显瑕疵或噪点
- [ ] 尺寸比例协调

---

#### 听觉审核

- [ ] 音量平衡一致
- [ ] 循环过渡自然
- [ ] 无爆音或底噪
- [ ] 音质清晰
- [ ] 风格与主题匹配

---

#### 技术审核

- [ ] 文件命名符合规范
- [ ] 目录结构正确
- [ ] 文件大小在限制内
- [ ] 格式符合要求
- [ ] JSON 配置无语法错误

---

## 示例

### 贪吃蛇主题示例

#### 目录结构

```
themes/snake_default/
├── images/
│   ├── scene/
│   │   ├── scene_bg_main.png (800KB)
│   │   └── scene_bg_grid.png (200KB)
│   ├── sprite/
│   │   ├── sprite_player_head.png (64x64)
│   │   ├── sprite_player_body.png (48x48)
│   │   └── sprite_player_tail.png (32x32)
│   ├── effect/
│   │   └── effect_eat_01.png (32x32)
│   └── icon/
│       ├── icon_food_apple.png (32x32)
│       └── icon_food_banana.png (32x32)
├── audio/
│   ├── bgm/
│   │   ├── bgm_main.mp3 (3MB, 128kbps)
│   │   └── bgm_gameplay.mp3 (2.5MB, 128kbps)
│   └── sfx/
│       ├── sfx_eat.wav (50KB)
│       ├── sfx_crash.wav (80KB)
│       └── sfx_powerup.wav (120KB)
└── config.json (15KB)
```

---

#### Config.json 示例

```json
{
  "specMeta": {
    "specName": "GTRS",
    "specVersion": "1.0.0",
    "compatibleVersion": "1.0.0"
  },
  "themeInfo": {
    "themeId": "snake_default",
    "gameId": "1",
    "themeName": "贪吃蛇默认主题",
    "isDefault": true,
    "author": "系统管理员",
    "description": "贪吃蛇游戏默认主题，经典的绿色蛇和红色食物"
  },
  "globalStyle": {
    "primaryColor": "#4ade80",
    "secondaryColor": "#ef4444",
    "bgColor": "#1a1a2e",
    "textColor": "#ffffff"
  },
  "resources": {
    "images": {
      "scene": {
        "scene_bg_main": {
          "src": "/themes/snake_default/images/scene/scene_bg_main.png",
          "type": "image/png",
          "alias": "主背景"
        },
        "scene_bg_grid": {
          "src": "/themes/snake_default/images/scene/scene_bg_grid.png",
          "type": "image/png",
          "alias": "网格背景"
        }
      },
      "sprite": {
        "sprite_player_head": {
          "src": "/themes/snake_default/images/sprite/sprite_player_head.png",
          "type": "image/png",
          "alias": "蛇头"
        },
        "sprite_player_body": {
          "src": "/themes/snake_default/images/sprite/sprite_player_body.png",
          "type": "image/png",
          "alias": "蛇身"
        }
      }
    },
    "audio": {
      "bgm": {
        "bgm_main": {
          "src": "/themes/snake_default/audio/bgm/bgm_main.mp3",
          "volume": 0.6,
          "loop": true,
          "alias": "主旋律"
        }
      },
      "effect": {
        "sfx_eat": {
          "src": "/themes/snake_default/audio/sfx/sfx_eat.wav",
          "volume": 0.8,
          "alias": "吃东西音效"
        }
      }
    }
  }
}
```

---

## 附录

### A. 常用工具推荐

#### 图片处理
- **Aseprite** - 像素艺术绘制
- **Photoshop** - 专业图像处理
- **TinyPNG** - 在线压缩工具
- **TexturePacker** - 精灵图打包

---

#### 音频处理
- **Audacity** - 免费音频编辑
- **FL Studio** - 音乐制作
- **BFXR** - 8 位音效生成
- **LMMS** - 免费音乐制作

---

### B. 音频格式强制要求

⚠️ **重要通知**: 

**所有音频资源必须使用 MP3 格式**

- ✅ **背景音乐 (BGM)**: MP3, 128kbps, 44.1kHz, 立体声
- ✅ **音效 (SFX)**: MP3, 64kbps, 44.1kHz, 单声道/立体声均可
- ❌ **禁止使用**: WAV、OGG、WEBM 等其他格式

**原因**:
1. 浏览器兼容性更好
2. 文件体积更小（约为 WAV 的 1/10）
3. 加载速度更快
4. 项目统一规范要求

**转换方法**:
```bash
# 使用 FFmpeg 转换
ffmpeg -i input.wav -codec:a libmp3lame -b:a 128k output.mp3

# 批量转换脚本
node tools/convert-audio-to-mp3.js themes/snake/audio/
```

提供 PSD/AI 模板文件，包含：
- 标准画布尺寸
- 参考网格线
- 色彩预设
- 图层样式

---

### C. 常见问题

**Q: 可以使用非 2 的幂次方尺寸吗？**  
A: 不建议，可能导致内存浪费或性能问题。

**Q: 音频必须用 MP3 吗？**  
**A**: ⚠️ **是的，强制要求！** 所有音频（包括 BGM 和 SFX）都必须使用 MP3 格式。WAV、OGG、WEBM 等其他格式不被允许。

**Q: 如何命多名词？**  
A: 使用最通用的英文名称，如 `player` 而非 `hero`。

---

**最后更新**: 2026-03-27  
**维护者**: Sitech AI Team  
**版本**: v1.0.0
