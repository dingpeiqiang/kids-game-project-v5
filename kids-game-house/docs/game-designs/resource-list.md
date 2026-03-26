# 坦克大战 资源清单

## 图片资源 (PNG)

### Scene (场景)
| 文件名 | 尺寸 | 用途 | 路径 |
|-------|------|------|------|
| background.png | 720×1280 | 游戏主背景 | /themes/default/images/scene/ |
| grid.png | 720×1280 | 网格背景 | /themes/default/images/scene/ |
| wall_brick.png | 30×30 | 砖墙障碍物 | /themes/default/images/scene/ |
| wall_steel.png | 30×30 | 钢墙障碍物 | /themes/default/images/scene/ |
| grass.png | 30×30 | 草地掩护 | /themes/default/images/scene/ |
| water.png | 30×30 | 水域障碍 | /themes/default/images/scene/ |
| base.png | 60×60 | 基地 (完好) | /themes/default/images/scene/ |
| base_destroyed.png | 60×60 | 基地 (被毁) | /themes/default/images/scene/ |

### Sprite (精灵)
#### 玩家坦克
| 文件名 | 尺寸 | 用途 | 路径 |
|-------|------|------|------|
| player_tank_up.png | 48×48 | 玩家坦克向上 | /themes/default/images/sprite/ |
| player_tank_down.png | 48×48 | 玩家坦克向下 | /themes/default/images/sprite/ |
| player_tank_left.png | 48×48 | 玩家坦克向左 | /themes/default/images/sprite/ |
| player_tank_right.png | 48×48 | 玩家坦克向右 | /themes/default/images/sprite/ |

#### 敌方坦克 - 普通型
| 文件名 | 尺寸 | 用途 | 路径 |
|-------|------|------|------|
| enemy_basic_up.png | 48×48 | 普通坦克向上 | /themes/default/images/sprite/ |
| enemy_basic_down.png | 48×48 | 普通坦克向下 | /themes/default/images/sprite/ |
| enemy_basic_left.png | 48×48 | 普通坦克向左 | /themes/default/images/sprite/ |
| enemy_basic_right.png | 48×48 | 普通坦克向右 | /themes/default/images/sprite/ |

#### 敌方坦克 - 快速型
| 文件名 | 尺寸 | 用途 | 路径 |
|-------|------|------|------|
| enemy_fast_up.png | 42×42 | 快速坦克向上 | /themes/default/images/sprite/ |
| enemy_fast_down.png | 42×42 | 快速坦克向下 | /themes/default/images/sprite/ |
| enemy_fast_left.png | 42×42 | 快速坦克向左 | /themes/default/images/sprite/ |
| enemy_fast_right.png | 42×42 | 快速坦克向右 | /themes/default/images/sprite/ |

#### 敌方坦克 - 重型
| 文件名 | 尺寸 | 用途 | 路径 |
|-------|------|------|------|
| enemy_heavy_up.png | 54×54 | 重型坦克向上 | /themes/default/images/sprite/ |
| enemy_heavy_down.png | 54×54 | 重型坦克向下 | /themes/default/images/sprite/ |
| enemy_heavy_left.png | 54×54 | 重型坦克向左 | /themes/default/images/sprite/ |
| enemy_heavy_right.png | 54×54 | 重型坦克向右 | /themes/default/images/sprite/ |

#### 子弹
| 文件名 | 尺寸 | 用途 | 路径 |
|-------|------|------|------|
| bullet_player.png | 12×12 | 玩家子弹 | /themes/default/images/sprite/ |
| bullet_enemy.png | 12×12 | 敌人子弹 | /themes/default/images/sprite/ |

### Icon (图标)
#### 道具
| 文件名 | 尺寸 | 用途 | 路径 |
|-------|------|------|------|
| powerup_star.png | 30×30 | 武器升级道具 | /themes/default/images/icon/ |
| powerup_clock.png | 30×30 | 时间冻结道具 | /themes/default/images/icon/ |
| powerup_shovel.png | 30×30 | 基地加固道具 | /themes/default/images/icon/ |
| powerup_life.png | 30×30 | 额外生命道具 | /themes/default/images/icon/ |

### Effect (特效)
#### 爆炸动画
| 文件名 | 尺寸 | 用途 | 路径 |
|-------|------|------|------|
| explosion_1.png | 60×60 | 爆炸帧 1 | /themes/default/images/effect/ |
| explosion_2.png | 60×60 | 爆炸帧 2 | /themes/default/images/effect/ |
| explosion_3.png | 60×60 | 爆炸帧 3 | /themes/default/images/effect/ |
| explosion_4.png | 60×60 | 爆炸帧 4 | /themes/default/images/effect/ |

## 音频资源 (MP3)

### BGM (背景音乐)
| 文件名 | 时长 | 风格 | 音量 | 路径 |
|-------|------|------|------|------|
| bgm_main.mp3 | 180s | 激昂军旅进行曲 | 0.5 | /themes/default/audio/ |
| bgm_gameplay.mp3 | 120s | 紧张战斗音乐 | 0.4 | /themes/default/audio/ |
| bgm_victory.mp3 | 30s | 凯旋庆祝 | 0.6 | /themes/default/audio/ |
| bgm_defeat.mp3 | 20s | 低沉悲伤 | 0.5 | /themes/default/audio/ |

### SFX (音效)
| 文件名 | 时长 | 用途 | 音量 | 路径 |
|-------|------|------|------|------|
| sfx_fire.mp3 | 0.2s | 坦克开火 | 0.6 | /themes/default/audio/ |
| sfx_explosion.mp3 | 0.5s | 坦克爆炸 | 0.7 | /themes/default/audio/ |
| sfx_hit.mp3 | 0.15s | 子弹击中墙壁 | 0.5 | /themes/default/audio/ |
| sfx_powerup_appear.mp3 | 0.3s | 道具出现 | 0.6 | /themes/default/audio/ |
| sfx_powerup_pickup.mp3 | 0.4s | 拾取道具 | 0.6 | /themes/default/audio/ |
| sfx_base_destroyed.mp3 | 1.0s | 基地被毁 | 0.8 | /themes/default/audio/ |
| sfx_button_click.mp3 | 0.1s | UI 按钮点击 | 0.4 | /themes/default/audio/ |

## 资源统计

### 图片总数
- **Scene**: 8 张
- **Sprite**: 22 张 (玩家 4 + 敌人 12 + 子弹 2 + 其他 4)
- **Icon**: 4 张
- **Effect**: 4 张
- **总计**: 38 张 PNG 图片

### 音频总数
- **BGM**: 4 首
- **SFX**: 7 首
- **总计**: 11 首 MP3 音频

## 备注

1. 所有 PNG 图片需要支持透明通道
2. 坦克精灵需要保持方向一致性 (向上为默认方向)
3. 爆炸特效使用序列帧动画
4. 音频采样率统一为 44100 Hz，比特率 128 kbps
