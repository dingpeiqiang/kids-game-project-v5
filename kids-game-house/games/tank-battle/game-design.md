# 🎮 坦克大战 - 游戏设计文档

## 1. 游戏概述

### 1.1 游戏名称
**坦克大战 (Tank Battle)**

### 1.2 游戏类型
动作射击类 (Action/Shooter)

### 1.3 目标用户
6-14 岁儿童及青少年

### 1.4 游戏简介
经典的坦克大战游戏，玩家控制一辆坦克在地图上移动，消灭敌人坦克，保护基地。游戏采用卡通风格，色彩明快，操作简单，适合儿童游玩。

---

## 2. 玩法规则

### 2.1 操作方式

#### 键盘控制
- **方向键 (↑↓←→)** 或 **WASD**: 移动坦克
- **空格键 (Space)** 或 **J 键**: 发射子弹
- **P 键** 或 **ESC**: 暂停/继续游戏

#### 触屏控制（可选）
- 虚拟摇杆：移动坦克
- 开火按钮：发射子弹

### 2.2 胜利条件
- 消灭所有敌方坦克
- 保护己方基地不被摧毁
- 在限定时间内完成关卡

### 2.3 失败条件
- 玩家坦克被击毁
- 基地被敌人摧毁
- 超时未完成关卡

### 2.4 游戏规则
1. 玩家有 3 条生命
2. 每关有固定数量的敌人
3. 敌人会不断从地图边缘生成
4. 子弹可以摧毁普通障碍物
5. 钢墙不可摧毁，需要绕行

---

## 3. 游戏流程

### 3.1 开始阶段
```
LoadingView → StartView → DifficultyView → GameView
```

1. **LoadingView**: 资源加载（10 步进度条）
2. **StartView**: 游戏标题、最高分、开始按钮
3. **DifficultyView**: 选择难度和主题
4. **GameView**: 进入游戏主场景

### 3.2 游戏进行阶段
1. 玩家坦克出现在基地附近
2. 敌人坦克从地图顶部和两侧生成
3. 玩家移动并射击，消灭敌人
4. 敌人 AI 自动寻路并攻击
5. 收集道具获得增益效果

### 3.3 游戏结束阶段
1. 胜利：显示得分，进入下一关
2. 失败：显示 GameOverView，提供重新开始选项

---

## 4. 资源清单

### 4.1 图片资源清单

| 资源名称 (key) | 用途描述 | 数量 | 尺寸 | 生成方式 | 优先级 |
|--------------|---------|------|------|---------|--------|
| bg_main | 游戏背景，深绿色军事风格 | 1 | 1920x1080 | Sharp 程序化生成 | 必需 |
| player_tank_up/down/left/right | 玩家坦克（四个方向） | 4 | 64x64 | Sharp 程序化生成 | 必需 |
| enemy_tank_1/2/3 | 敌方坦克（三种类型） | 3 | 64x64 | Sharp 程序化生成 | 必需 |
| bullet_player | 玩家子弹，绿色能量弹 | 1 | 16x16 | Sharp 程序化生成 | 必需 |
| bullet_enemy | 敌人子弹，红色能量弹 | 1 | 16x16 | Sharp 程序化生成 | 必需 |
| wall_brick | 砖墙障碍物 | 1 | 64x64 | Sharp 程序化生成 | 必需 |
| wall_steel | 钢墙障碍物 | 1 | 64x64 | Sharp 程序化生成 | 必需 |
| base_home | 基地（老鹰/旗帜） | 1 | 64x64 | Sharp 程序化生成 | 必需 |
| base_destroyed | 被摧毁的基地 | 1 | 64x64 | Sharp 程序化生成 | 必需 |
| explosion_1/2/3 | 爆炸动画帧 | 3 | 64x64 | Sharp 程序化生成 | 必需 |
| prop_star | 道具：星级（增强火力） | 1 | 48x48 | Sharp 程序化生成 | 可选 |
| prop_clock | 道具：时钟（冻结敌人） | 1 | 48x48 | Sharp 程序化生成 | 可选 |
| prop_shield | 道具：护盾（无敌保护） | 1 | 48x48 | Sharp 程序化生成 | 可选 |
| ui_heart | UI: 生命值图标 | 1 | 32x32 | Sharp 程序化生成 | 必需 |
| ui_pause | UI: 暂停图标 | 1 | 48x48 | Sharp 程序化生成 | 必需 |
| btn_restart | 重新开始按钮 | 1 | 200x60 | Sharp 程序化生成 | 必需 |

### 4.2 音频资源清单

| 资源名称 (key) | 用途 | 时长 | 获取方式 | 优先级 |
|--------------|------|------|---------|--------|
| bgm_main | 背景音乐，激昂的战斗音乐 | 120s | WebAudio / MP3 | 必需 |
| sfx_shot | 射击音效，短促有力 | 0.3s | WebAudio | 必需 |
| sfx_explosion | 爆炸音效，震撼低频 | 0.8s | WebAudio | 必需 |
| sfx_hit | 击中音效，金属碰撞 | 0.2s | WebAudio | 必需 |
| sfx_start | 游戏开始音效 | 1.0s | WebAudio | 必需 |
| sfx_gameover | 游戏结束音效 | 2.0s | WebAudio | 必需 |
| sfx_prop | 道具拾取音效 | 0.5s | WebAudio | 可选 |

---

## 5. 技术实现要点

### 5.1 使用的 Phaser API
- `Phaser.Scene`: 游戏场景基类
- `Phaser.Physics.Arcade`: 物理引擎
- `Phaser.GameObjects.Sprite`: 精灵动画
- `Phaser.GameObjects.TileSprite`: 平铺背景
- `Phaser.Input.Keyboard`: 键盘输入
- `Phaser.Time.Timeline`: 时间线控制
- `Phaser.Geom.Intersects`: 几何碰撞检测

### 5.2 关键算法

#### 坦克移动
```typescript
// 网格化移动，每次移动一个单元格
const cellSize = 64;
const speed = 200; // pixels per second

// 方向向量
const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};
```

#### 子弹碰撞检测
```typescript
// AABB 碰撞检测
function checkCollision(bullet, target): boolean {
  return Phaser.Geom.Intersects.RectangleToRectangle(
    bullet.getBounds(),
    target.getBounds()
  );
}
```

#### 敌人 AI 寻路
```typescript
// 简单随机 + 追踪混合 AI
- 70% 概率随机移动
- 30% 概率朝玩家方向移动
- 遇到障碍物时随机转向
- 定期发射子弹
```

### 5.3 数据结构

#### 关卡配置
```typescript
interface LevelConfig {
  level: number;
  enemyCount: number;
  enemySpawnInterval: number;
  timeLimit?: number;
  mapLayout: number[][]; // 0=空地，1=砖墙，2=钢墙，3=基地
}
```

#### 坦克属性
```typescript
interface TankStats {
  speed: number;
  health: number;
  damage: number;
  fireRate: number; // bullets per second
  bulletSpeed: number;
}
```

---

## 6. 难度设计

### 6.1 简单难度 (Easy)
- 敌人数量：5 辆
- 敌人生成间隔：3000ms
- 敌人速度：较慢 (150px/s)
- 敌人血量：1
- 玩家生命：5
- 限时：无限制

### 6.2 中等难度 (Medium)
- 敌人数量：10 辆
- 敌人生成间隔：2500ms
- 敌人速度：正常 (200px/s)
- 敌人血量：1-2（混合类型）
- 玩家生命：3
- 限时：180 秒

### 6.3 困难难度 (Hard)
- 敌人数量：15 辆
- 敌人生成间隔：2000ms
- 敌人速度：较快 (250px/s)
- 敌人血量：2-3（包含 Boss）
- 玩家生命：2
- 限时：120 秒

### 6.4 专家难度 (Expert)
- 敌人数量：20 辆
- 敌人生成间隔：1500ms
- 敌人速度：快 (300px/s)
- 敌人血量：3（Boss 级）
- 玩家生命：1
- 限时：90 秒

---

## 7. 教育价值

### 7.1 培养能力
- **手眼协调**: 精确控制坦克移动和射击
- **策略思维**: 规划路线，优先消灭威胁
- **反应能力**: 快速躲避敌人子弹
- **空间感知**: 理解地图布局和掩体使用

### 7.2 学习价值
- 了解经典游戏文化
- 培养对编程和游戏的兴趣
- 锻炼逻辑思维能力

### 7.3 安全健康
- 无暴力血腥内容
- 卡通风格，色彩明快
- 适龄提示，防沉迷建议

---

## 8. 扩展玩法（可选）

### 8.1 双人模式
- 玩家 2 使用不同按键
- 合作对抗敌人
- 可互相救援

### 8.2 特殊坦克类型
- **快速坦克**: 移动速度快，血量低
- **重型坦克**: 移动速度慢，血量高，可破坏钢墙
- **散射坦克**: 一次发射多颗子弹

### 8.3 特殊地形
- **河流**: 坦克无法通过，子弹可以飞过
- **草地**: 坦克可以隐藏其中
- **传送门**: 瞬间传送到地图另一侧

---

## 9. 性能优化建议

### 9.1 资源加载
- 使用对象池管理子弹和敌人
- 预加载常用资源
- 按需加载关卡资源

### 9.2 渲染优化
- 只渲染屏幕内的对象
- 使用 Sprite Sheet 减少 Draw Call
- 合理设置物理更新频率

### 9.3 内存管理
- 及时销毁不在视野的对象
- 复用子弹和爆炸特效
- 避免频繁的垃圾回收

---

**文档版本**: 1.0.0  
**创建日期**: 2026-03-31  
**适用框架**: Phaser 3.90 + Vue 3 + TypeScript
