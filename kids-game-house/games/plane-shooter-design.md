# 🎮 飞机大战游戏设计文档

**版本**: v1.0  
**创建日期**: 2026-03-27  
**适用项目**: Kids Game Platform - plane-shooter  

---

## 一、游戏概述

### 1.1 游戏简介
飞机大战是一款经典的纵向卷轴射击游戏。玩家控制一架战斗机，通过移动躲避敌机发射的子弹，同时击落不断出现的敌机。游戏目标是获得尽可能高的分数。

### 1.2 核心玩法
- **玩家控制**: 战斗机可以自由移动（支持键盘方向键/WASD 和鼠标/触摸）
- **自动射击**: 战斗机持续自动发射子弹
- **敌机生成**: 敌机从屏幕顶部随机位置生成并向下移动
- **碰撞检测**: 
  - 玩家子弹击中敌机 → 敌机被摧毁，玩家得分
  - 敌机撞击玩家 → 玩家生命数减 1
  - 敌机子弹击中玩家 → 玩家生命数减 1
- **游戏结束**: 当玩家生命数归零时游戏结束

---

## 二、游戏对象设计

### 2.1 玩家飞机 (Player)
```typescript
interface Player {
  position: Vector2;        // 位置
  velocity: Vector2;        // 速度
  speed: number;            // 移动速度
  health: number;           // 当前生命值
  maxHealth: number;        // 最大生命值
  lives: number;            // 剩余生命数
  damage: number;           // 子弹伤害
  fireRate: number;         // 射击频率（毫秒）
  lastFireTime: number;     // 上次射击时间
  width: number;            // 宽度（像素）
  height: number;           // 高度（像素）
}
```

**属性值**:
- 移动速度：400 px/s
- 初始生命数：3
- 子弹伤害：10
- 射击间隔：300ms
- 飞机尺寸：60x80

### 2.2 敌机 (Enemy)
```typescript
interface Enemy {
  type: 'basic' | 'fast' | 'tank';  // 敌机类型
  position: Vector2;                // 位置
  velocity: Vector2;                // 速度
  health: number;                   // 生命值
  damage: number;                   // 碰撞伤害
  scoreValue: number;               // 击毁得分
  fireRate?: number;                // 射击频率（可选）
  width: number;                    // 宽度
  height: number;                   // 高度
}
```

**敌机类型**:

| 类型 | 生命值 | 速度 | 伤害 | 得分 | 特征 |
|------|--------|------|------|------|------|
| **basic** (普通) | 20 | 150 px/s | 10 | 100 | 绿色，直线下降 |
| **fast** (快速) | 10 | 300 px/s | 5 | 200 | 黄色，快速下降 |
| **tank** (坦克) | 50 | 80 px/s | 20 | 500 | 红色，缓慢但血厚 |

### 2.3 子弹 (Bullet)
```typescript
interface Bullet {
  owner: 'player' | 'enemy';  // 所有者
  position: Vector2;          // 位置
  velocity: Vector2;          // 速度
  damage: number;             // 伤害
  width: number;              // 宽度
  height: number;             // 高度
}
```

**子弹属性**:
- 玩家子弹：向上飞行，速度 600 px/s，伤害 10
- 敌机子弹：向下飞行，速度 400 px/s，伤害 10

### 2.4 道具 (PowerUp) - 可选扩展
```typescript
interface PowerUp {
  type: 'health' | 'rapidFire' | 'spreadShot';  // 道具类型
  position: Vector2;                            // 位置
  velocity: Vector2;                            // 速度
  duration?: number;                            // 持续时间（毫秒）
  width: number;                                // 宽度
  height: number;                               // 高度
}
```

**道具类型**:
- ❤️ **health**: 恢复 1 点生命数
- ⚡ **rapidFire**: 射速提升 2 倍，持续 10 秒
- 🔱 **spreadShot**: 散射三发子弹，持续 10 秒

---

## 三、游戏规则

### 3.1 得分系统
| 行为 | 得分 |
|------|------|
| 击毁普通敌机 | +100 |
| 击毁快速敌机 | +200 |
| 击毁坦克敌机 | +500 |
| 拾取道具 | +50 |

### 3.2 难度曲线
游戏根据分数动态调整难度：

| 分数段 | 敌机生成频率 | 敌机类型比例 | 备注 |
|--------|-------------|-------------|------|
| 0-500 | 每 1.5 秒 | 100% basic | 新手阶段 |
| 500-1500 | 每 1.2 秒 | 70% basic, 30% fast | 入门阶段 |
| 1500-3000 | 每 1.0 秒 | 50% basic, 40% fast, 10% tank | 进阶阶段 |
| 3000+ | 每 0.8 秒 | 40% basic, 40% fast, 20% tank | 挑战阶段 |

### 3.3 生命系统
- 初始生命数：3
- 受伤机制：
  - 被敌机撞击：-1 生命
  - 被子弹击中：-1 生命
  - 坠出边界：-1 生命
- 无敌时间：受伤后 2 秒内无敌（闪烁效果）

### 3.4 游戏结束条件
- 生命数归零 → 游戏结束
- 显示最终分数和星级评价

---

## 四、星级评价系统

| 分数范围 | 星级 | 评价文本 |
|---------|------|---------|
| < 1000 | ⭐ | 继续努力 |
| 1000-2999 | ⭐⭐ | 表现不错 |
| 3000-4999 | ⭐⭐⭐ | 非常优秀 |
| 5000-7999 | ⭐⭐⭐⭐ | 王牌飞行员 |
| ≥ 8000 | ⭐⭐⭐⭐⭐ | 传奇飞行员 |

---

## 五、GTRS 资源配置

### 5.1 图片资源清单
```
public/themes/default/images/scene/
├── background.png (720x1280)      # 星空背景
├── grid.png (720x1280)            # 网格线（可选）
├── player.png (60x80)             # 玩家飞机
├── enemy_basic.png (50x50)        # 普通敌机
├── enemy_fast.png (40x40)         # 快速敌机
├── enemy_tank.png (70x70)         # 坦克敌机
├── bullet_player.png (10x20)      # 玩家子弹
└── bullet_enemy.png (10x20)       # 敌机子弹
```

### 5.2 音频资源清单
```
public/themes/default/audio/
├── bgm_main.mp3         # 主背景音乐（激昂战斗音乐）
├── bgm_gameplay.mp3     # 游戏进行音乐
├── bgm_gameover.mp3     # 游戏结束音乐
├── button_click.mp3     # UI 按钮音效
├── shoot.mp3            # 射击音效
├── explosion.mp3        # 爆炸音效
└── powerup.mp3          # 道具音效（可选）
```

### 5.3 GTRS.json 配置结构
```json
{
  "$comment": "GTRS v1.0.0 飞机大战内置默认主题",
  "specMeta": {
    "compatibleVersion": "1.0.0",
    "specName": "GTRS",
    "specVersion": "1.0.0"
  },
  "themeInfo": {
    "themeId": "plane_shooter_default",
    "gameId": "plane-shooter",
    "themeName": "飞机大战 - 默认主题",
    "isDefault": true,
    "author": "官方",
    "description": "飞机大战默认主题配置"
  },
  "globalStyle": {
    "bgColor": "#0a0a1a",
    "borderRadius": "8px",
    "fontFamily": "Arial, sans-serif",
    "primaryColor": "#4ade80",
    "secondaryColor": "#22c55e",
    "textColor": "#ffffff"
  },
  "resources": {
    "images": {
      "scene": {
        "background": "images/scene/background.png",
        "grid": "images/scene/grid.png",
        "player": "images/scene/player.png",
        "enemy_basic": "images/scene/enemy_basic.png",
        "enemy_fast": "images/scene/enemy_fast.png",
        "enemy_tank": "images/scene/enemy_tank.png",
        "bullet_player": "images/scene/bullet_player.png",
        "bullet_enemy": "images/scene/bullet_enemy.png"
      }
    },
    "audio": {
      "bgm": {
        "bgm_main": "audio/bgm_main.mp3",
        "bgm_gameplay": "audio/bgm_gameplay.mp3",
        "bgm_gameover": "audio/bgm_gameover.mp3"
      },
      "effect": {
        "button_click": "audio/button_click.mp3",
        "shoot": "audio/shoot.mp3",
        "explosion": "audio/explosion.mp3",
        "powerup": "audio/powerup.mp3"
      }
    }
  }
}
```

---

## 六、技术实现要点

### 6.1 Phaser 场景结构
```typescript
// PhaserGame.ts
class PlaneShooterScene extends BaseScene {
  private player!: Player;
  private enemies!: Phaser.GameObjects.Group;
  private playerBullets!: Phaser.GameObjects.Group;
  private enemyBullets!: Phaser.GameObjects.Group;
  private powerUps!: Phaser.GameObjects.Group;
  
  preload(): void {
    // 加载 GTRS 资源
  }
  
  create(): void {
    // 创建背景
    // 创建玩家
    // 创建敌机群
    // 创建子弹群
    // 设置碰撞检测
    // 设置输入控制
    // 启动定时生成敌机
  }
  
  update(time: number, delta: number): void {
    // 更新玩家位置
    // 更新子弹位置
    // 更新敌机位置
    // 自动射击
    // 边界检测
    // 难度调整
  }
}
```

### 6.2 碰撞检测矩阵
| 碰撞对 | 检测结果 | 处理方式 |
|--------|---------|---------|
| 玩家子弹 vs 敌机 | 重叠 | 敌机扣血，子弹销毁 |
| 玩家子弹 vs 敌机子弹 | 重叠 | 双方销毁 |
| 敌机子弹 vs 玩家 | 重叠 | 玩家扣血，子弹销毁 |
| 敌机 vs 玩家 | 重叠 | 双方扣血 |
| 玩家 vs 道具 | 重叠 | 触发道具效果 |

### 6.3 性能优化
- **对象池**: 子弹、敌机使用对象池复用
- **分组管理**: 使用 Phaser.Group 批量管理游戏对象
- **离屏销毁**: 对象飞出屏幕立即销毁
- **碰撞层优化**: 设置合理的碰撞层级，减少不必要的检测

---

## 七、UI 界面设计

### 7.1 游戏内 UI
```
┌─────────────────────────────────┐
│ [返回]  分数：01234   ❤️❤️❤️  │  ← 顶部工具栏
├─────────────────────────────────┤
│                                 │
│         (游戏画面区域)           │
│                                 │
│           ✈️ (玩家)              │
│                                 │
│      👾 👾    👾                │  ← 敌机
│         💥                      │  ← 爆炸效果
│      ↓ ↓ ↓                      │  ← 敌机子弹
│      ↑ ↑ ↑                      │  ← 玩家子弹
│                                 │
└─────────────────────────────────┘
```

### 7.2 开始界面 (StartView)
- 游戏标题："飞机大战"
- 副标题："保卫领空，击落所有敌机！"
- 开始按钮
- 操作说明：
  - 键盘：方向键/WASD 移动，空格键射击
  - 鼠标/触摸：拖动飞机移动
  - 自动射击已开启

### 7.3 游戏结束界面 (GameOverView)
- 游戏结束文本
- 最终分数显示
- 星级评价（⭐⭐⭐⭐）
- 评价文本（"王牌飞行员"）
- 再来一局按钮
- 返回首页按钮

---

## 八、开发检查清单

### 8.1 核心功能
- [ ] 玩家飞机移动控制
- [ ] 自动射击系统
- [ ] 敌机生成和移动 AI
- [ ] 子弹发射和飞行
- [ ] 碰撞检测系统
- [ ] 得分计算
- [ ] 生命数系统
- [ ] 游戏结束判定

### 8.2 游戏体验
- [ ] 难度曲线平滑
- [ ] 星级评价准确
- [ ] 无敌时间闪烁效果
- [ ] 爆炸动画效果
- [ ] 音效播放正常

### 8.3 平台集成
- [ ] GTRS 资源配置正确
- [ ] 与 Pinia Store 通信正常
- [ ] 游戏状态同步正常
- [ ] 暂停/恢复功能正常
- [ ] 积分系统对接完成

---

## 九、扩展功能（可选）

### 9.1 道具系统
- 医疗包：恢复生命
- 快速射击：射速提升
- 散射：一次发射多颗子弹
- 护盾：短暂无敌

### 9.2 BOSS 战
- 每 3000 分出现 BOSS
- BOSS 有大量生命值
- BOSS 有多种攻击模式
- 击毁 BOSS 获得额外奖励

### 9.3 成就系统
- 首次击落敌机
- 连续击落 10 架敌机
- 无伤通关
- 达到特定分数

---

**文档结束**
