# 🎨 坦克大战 - 资源清单

## 资源概览

- **总资源数**: 约 30 个文件
- **图片资源**: 22 个
- **音频资源**: 7 个
- **生成方式**: Sharp 程序化生成 + WebAudio

---

## 📷 图片资源详细清单

### 场景资源 (Scene)

#### 背景
| Key | 文件名 | 尺寸 | 描述 | 生成参数 |
|-----|--------|------|------|---------|
| `bg_main` | bg_main.png | 1920x1080 | 深绿色军事风格背景，带网格纹理 | 深绿渐变 + 网格线 |

#### 坦克精灵
| Key | 文件名 | 尺寸 | 描述 | 生成参数 |
|-----|--------|------|------|---------|
| `player_tank_up` | player_tank_up.png | 64x64 | 玩家坦克，向上方向 | 蓝绿色坦克，白色炮管 |
| `player_tank_down` | player_tank_down.png | 64x64 | 玩家坦克，向下方向 | 蓝绿色坦克，白色炮管 |
| `player_tank_left` | player_tank_left.png | 64x64 | 玩家坦克，向左方向 | 蓝绿色坦克，白色炮管 |
| `player_tank_right` | player_tank_right.png | 64x64 | 玩家坦克，向右方向 | 蓝绿色坦克，白色炮管 |
| `enemy_tank_1` | enemy_tank_1.png | 64x64 | 敌方坦克类型 1（基础） | 红色坦克，黑色炮管 |
| `enemy_tank_2` | enemy_tank_2.png | 64x64 | 敌方坦克类型 2（快速） | 黄色坦克，细长炮管 |
| `enemy_tank_3` | enemy_tank_3.png | 64x64 | 敌方坦克类型 3（重型） | 深红色坦克，粗炮管 |

#### 子弹精灵
| Key | 文件名 | 尺寸 | 描述 | 生成参数 |
|-----|--------|------|------|---------|
| `bullet_player` | bullet_player.png | 16x16 | 玩家子弹，绿色能量弹 | 圆形，荧光绿 |
| `bullet_enemy` | bullet_enemy.png | 16x16 | 敌人子弹，红色能量弹 | 圆形，橙红色 |

#### 障碍物
| Key | 文件名 | 尺寸 | 描述 | 生成参数 |
|-----|--------|------|------|---------|
| `wall_brick` | wall_brick.png | 64x64 | 砖墙，可被摧毁 | 棕色砖块纹理 |
| `wall_steel` | wall_steel.png | 64x64 | 钢墙，不可摧毁 | 灰色金属质感 |
| `base_home` | base_home.png | 64x64 | 基地（老鹰/旗帜） | 金色鹰徽或旗帜 |
| `base_destroyed` | base_destroyed.png | 64x64 | 被摧毁的基地 | 破碎的鹰徽 |

#### 特效
| Key | 文件名 | 尺寸 | 描述 | 生成参数 |
|-----|--------|------|------|---------|
| `explosion_1` | explosion_1.png | 64x64 | 爆炸动画帧 1 | 小火球，橙红色 |
| `explosion_2` | explosion_2.png | 64x64 | 爆炸动画帧 2 | 中等火球，黄橙色 |
| `explosion_3` | explosion_3.png | 64x64 | 爆炸动画帧 3 | 大火球，黄色 |

#### 道具
| Key | 文件名 | 尺寸 | 描述 | 生成参数 |
|-----|--------|------|------|---------|
| `prop_star` | prop_star.png | 48x48 | 道具：星级（增强火力） | 金色五角星，发光效果 |
| `prop_clock` | prop_clock.png | 48x48 | 道具：时钟（冻结敌人） | 蓝色时钟图标 |
| `prop_shield` | prop_shield.png | 48x48 | 道具：护盾（无敌保护） | 紫色盾牌图标 |

#### UI 元素
| Key | 文件名 | 尺寸 | 描述 | 生成参数 |
|-----|--------|------|------|---------|
| `ui_heart` | ui_heart.png | 32x32 | UI: 生命值图标 | 红色爱心 |
| `ui_pause` | ui_pause.png | 48x48 | UI: 暂停图标 | 双竖线图标 |
| `btn_restart` | btn_restart.png | 200x60 | 重新开始按钮 | 绿色圆角矩形 |

---

## 🎵 音频资源详细清单

### 背景音乐 (BGM)
| Key | 文件名 | 时长 | 描述 | 获取方式 |
|-----|--------|------|------|---------|
| `bgm_main` | bgm_main.mp3 | 120s | 激昂的战斗音乐，循环播放 | WebAudio / MP3 |

### 音效 (SFX)
| Key | 文件名 | 时长 | 描述 | 频率范围 | 获取方式 |
|-----|--------|------|------|----------|---------|
| `sfx_shot` | sfx_shot.wav | 0.3s | 射击音效，短促有力 | 200-800Hz | WebAudio |
| `sfx_explosion` | sfx_explosion.wav | 0.8s | 爆炸音效，震撼低频 | 50-400Hz | WebAudio |
| `sfx_hit` | sfx_hit.wav | 0.2s | 击中音效，金属碰撞 | 800-2000Hz | WebAudio |
| `sfx_start` | sfx_start.wav | 1.0s | 游戏开始音效，ascending | 300-1200Hz | WebAudio |
| `sfx_gameover` | sfx_gameover.wav | 2.0s | 游戏结束音效，descending | 1000-100Hz | WebAudio |
| `sfx_prop` | sfx_prop.wav | 0.5s | 道具拾取音效，欢快 | 600-1500Hz | WebAudio |

---

## 🛠️ 资源生成脚本

### generate-resources.mjs

**功能**:
1. 使用 Sharp 库生成所有图片资源
2. 输出到指定目录
3. 自动生成 GTRS.json 配置

**依赖**:
```bash
npm install sharp
```

**使用方法**:
```bash
node generate-resources.mjs
```

### generate-audio.mjs (可选)

**功能**:
1. 使用 WebAudio API 生成简单音效
2. 导出为 WAV 格式

**替代方案**:
- 开发阶段使用 WebAudio 实时合成
- 生产阶段使用预录制的 MP3/WAV 文件

---

## 📁 输出目录结构

```
tank-battle/
├── public/
│   └── themes/
│       └── tank_default/
│           ├── assets/
│           │   ├── scene/
│           │   │   ├── bg_main.png
│           │   │   ├── player_tank_up.png
│           │   │   ├── player_tank_down.png
│           │   │   ├── player_tank_left.png
│           │   │   ├── player_tank_right.png
│           │   │   ├── enemy_tank_1.png
│           │   │   ├── enemy_tank_2.png
│           │   │   ├── enemy_tank_3.png
│           │   │   ├── bullet_player.png
│           │   │   ├── bullet_enemy.png
│           │   │   ├── wall_brick.png
│           │   │   ├── wall_steel.png
│           │   │   ├── base_home.png
│           │   │   ├── base_destroyed.png
│           │   │   ├── explosion_1.png
│           │   │   ├── explosion_2.png
│           │   │   ├── explosion_3.png
│           │   │   ├── prop_star.png
│           │   │   ├── prop_clock.png
│           │   │   ├── prop_shield.png
│           │   │   ├── ui_heart.png
│           │   │   ├── ui_pause.png
│           │   │   └── btn_restart.png
│           │   └── audio/
│           │       ├── bgm_main.mp3
│           │       ├── sfx_shot.wav
│           │       ├── sfx_explosion.wav
│           │       ├── sfx_hit.wav
│           │       ├── sfx_start.wav
│           │       ├── sfx_gameover.wav
│           │       └── sfx_prop.wav
│           └── GTRS.json
├── src/
│   └── ... (源代码)
└── package.json
```

---

## ⚡ 资源优化建议

### 图片压缩
- 使用 TinyPNG 或 ImageOptim 进行无损压缩
- 目标：减少 30-50% 文件大小

### 音频压缩
- BGM 使用 MP3 格式，128kbps
- SFX 使用 WAV 格式，保持质量

### 加载策略
1. **首屏必需**: 背景、玩家坦克、基础障碍物
2. **按需加载**: 道具、特殊敌人
3. **预加载**: 下一关资源

---

## 📊 资源统计表

| 类别 | 数量 | 总大小（预估） |
|------|------|---------------|
| 背景 | 1 | ~100KB |
| 坦克 | 7 | ~50KB |
| 子弹 | 2 | ~5KB |
| 障碍物 | 3 | ~20KB |
| 特效 | 3 | ~20KB |
| 道具 | 3 | ~15KB |
| UI | 3 | ~10KB |
| 音频 | 7 | ~2MB |
| **总计** | **29** | **~2.2MB** |

---

**文档版本**: 1.0.0  
**创建日期**: 2026-03-31  
**最后更新**: 2026-03-31
