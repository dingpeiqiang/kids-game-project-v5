# 飞机大战游戏资源清单

## 📊 资源概览

- **游戏名称**: 飞机大战 (Plane Shooter)
- **游戏代码**: `plane-shooter`
- **画布尺寸**: 720 x 1280 (竖屏)
- **网格大小**: 40x40 像素
- **网格系统**: 18 列 × 32 行

---

## 🖼️ 图片资源（PNG）

### Scene 场景资源 (3 张)

| 文件名 | 尺寸 | GTRS Key | 说明 |
|--------|------|----------|------|
| `background.png` | 720×1280 | `scene_bg_main` | 太空渐变背景 |
| `stars.png` | 720×1280 | `scene_bg_stars` | 星空点缀层 |
| `grid.png` | 720×1280 | `scene_grid` | 网格参考线 |

### Sprite 精灵资源 (10 张)

| 文件名 | 尺寸 | GTRS Key | 说明 |
|--------|------|----------|------|
| `player_plane.png` | 60×80 | `player_plane` | 玩家战斗机 |
| `enemy_small.png` | 40×40 | `enemy_small` | 小型敌机（红色） |
| `enemy_medium.png` | 50×60 | `enemy_medium` | 中型敌机（紫色） |
| `enemy_large.png` | 80×80 | `enemy_large` | 大型敌机（金色） |
| `enemy_boss.png` | 150×150 | `enemy_boss` | Boss 母舰 |
| `bullet_player_1.png` | 10×20 | `bullet_player_1` | 玩家子弹 1 级（绿色） |
| `bullet_player_2.png` | 20×20 | `bullet_player_2` | 玩家子弹 2 级（蓝色） |
| `bullet_player_3.png` | 30×20 | `bullet_player_3` | 玩家子弹 3 级（金色散射） |
| `bullet_enemy.png` | 10×10 | `bullet_enemy` | 敌方子弹（红色） |

### Icon 图标资源 (5 张)

| 文件名 | 尺寸 | GTRS Key | 说明 |
|--------|------|----------|------|
| `powerup_weapon.png` | 30×30 | `powerup_weapon` | 武器强化道具（红色） |
| `powerup_speed.png` | 30×30 | `powerup_speed` | 速度提升道具（黄色） |
| `powerup_shield.png` | 30×30 | `powerup_shield` | 护盾道具（蓝色） |
| `powerup_health.png` | 30×30 | `powerup_health` | 生命回复道具（绿色） |
| `powerup_bomb.png` | 30×30 | `powerup_bomb` | 全屏炸弹道具（紫色） |

### Effect 特效资源 (4 张)

| 文件名 | 尺寸 | GTRS Key | 说明 |
|--------|------|----------|------|
| `explosion_1.png` | 80×80 | `effect_explosion_1` | 爆炸帧 1（白黄核心） |
| `explosion_2.png` | 80×80 | `effect_explosion_2` | 爆炸帧 2（橙黄色） |
| `explosion_3.png` | 80×80 | `effect_explosion_3` | 爆炸帧 3（红色） |
| `explosion_4.png` | 80×80 | `effect_explosion_4` | 爆炸帧 4（深红烟雾） |

---

## 🎵 音频资源（WAV）

### BGM 背景音乐 (4 首)

| 文件名 | 时长 | GTRS Key | 说明 | 频率 | 类型 |
|--------|------|----------|------|------|------|
| `bgm_main.wav` | 180s | `bgm_main` | 主菜单音乐 | 440Hz | melody |
| `bgm_gameplay.wav` | 120s | `bgm_gameplay` | 游戏进行音乐 | 523Hz | melody |
| `bgm_victory.wav` | 30s | `bgm_victory` | 胜利音乐 | 659Hz | melody |
| `bgm_defeat.wav` | 20s | `bgm_defeat` | 失败音乐 | 330Hz | melody |

### SFX 音效 (5 首)

| 文件名 | 时长 | GTRS Key | 说明 | 类型 | 音量 |
|--------|------|----------|------|------|------|
| `effect_fire.wav` | 0.2s | `effect_fire` | 射击音效 | fire | 0.6 |
| `effect_explosion.wav` | 0.5s | `effect_explosion` | 爆炸音效 | explosion | 0.7 |
| `effect_hit.wav` | 0.15s | `effect_hit` | 击中音效 | hit | 0.5 |
| `effect_powerup.wav` | 0.3s | `effect_powerup` | 道具拾取音效 | powerup | 0.6 |
| `effect_button_click.wav` | 0.1s | `effect_button_click` | UI 点击音效 | sine | 0.5 |

---

## 📁 目录结构

```
kids-game-house/plane-shooter-vue3/
├── public/
│   └── themes/
│       └── default/
│           ├── assets/
│           │   ├── scene/
│           │   │   ├── background.png
│           │   │   ├── stars.png
│           │   │   └── grid.png
│           │   ├── sprite/
│           │   │   ├── player_plane.png
│           │   │   ├── enemy_small.png
│           │   │   ├── enemy_medium.png
│           │   │   ├── enemy_large.png
│           │   │   ├── enemy_boss.png
│           │   │   ├── bullet_player_1.png
│           │   │   ├── bullet_player_2.png
│           │   │   ├── bullet_player_3.png
│           │   │   └── bullet_enemy.png
│           │   ├── icon/
│           │   │   ├── powerup_weapon.png
│           │   │   ├── powerup_speed.png
│           │   │   ├── powerup_shield.png
│           │   │   ├── powerup_health.png
│           │   │   └── powerup_bomb.png
│           │   ├── effect/
│           │   │   ├── explosion_1.png
│           │   │   ├── explosion_2.png
│           │   │   ├── explosion_3.png
│           │   │   └── explosion_4.png
│           │   └── audio/
│           │       ├── bgm_main.wav
│           │       ├── bgm_gameplay.wav
│           │       ├── bgm_victory.wav
│           │       ├── bgm_defeat.wav
│           │       ├── effect_fire.wav
│           │       ├── effect_explosion.wav
│           │       ├── effect_hit.wav
│           │       ├── effect_powerup.wav
│           │       └── effect_button_click.wav
│           └── GTRS.json
├── src/
│   └── config/
│       └── GTRS.json
└── scripts/
    └── generate-resources.mjs
```

---

## 🔧 使用方法

### 1. 安装依赖

```bash
cd kids-game-house/plane-shooter-vue3/scripts
npm install
```

### 2. 生成资源

```bash
npm run generate
# 或者
node generate-resources.mjs
```

### 3. 验证输出

检查以下目录是否生成：
- `public/themes/default/assets/scene/` - 场景图片
- `public/themes/default/assets/sprite/` - 精灵图片
- `public/themes/default/assets/icon/` - 图标
- `public/themes/default/assets/effect/` - 特效
- `public/themes/default/assets/audio/` - 音频
- `public/themes/default/GTRS.json` - 配置文件
- `src/config/GTRS.json` - 配置文件

---

## 📝 备注

1. **所有 PNG 图片**均使用 Sharp 库程序化生成，无需手动绘制
2. **所有 WAV 音频**直接通过算法生成，无需录音
3. **GTRS 配置**会自动生成并复制到两个位置
4. **资源路径**统一使用 `/themes/default/assets/` 前缀
5. **颜色设计**:
   - 玩家：绿色系 (#4ade80)
   - 敌人：红色、紫色、金色系
   - 道具：多彩区分功能
   - 背景：深蓝太空色 (#0a0a28)

---

**文档结束**
