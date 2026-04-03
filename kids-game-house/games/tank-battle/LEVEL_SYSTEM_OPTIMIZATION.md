# 坦克大战关卡系统优化报告

**更新时间**: 2026-04-03

## 📊 优化概览

### 已完成优化

| 模块 | 优化前 | 优化后 | 状态 |
|------|--------|--------|------|
| 关卡数量 | 1 关 | 5 关完整体系 | ✅ |
| 难度曲线 | 简单线性 | 平滑递进 | ✅ |
| Boss 战 | 无 | 独立第 5 关 | ✅ |
| 特殊事件 | 无 | 6 种事件类型 | ✅ |
| 星级评价 | 有配置无实现 | 完整计算逻辑 | ✅ |
| 道具系统 | 4 种 | 扩展支持 | ✅ |

---

## 🎮 关卡配置体系

### 关卡进度

```
tank_level_1 (训练关卡)
    ↓ 通关后解锁
tank_level_2 (初次战斗)
    ↓ 通关后解锁
tank_level_3 (钢铁防线)
    ↓ 通关后解锁
tank_level_4 (腹背受敌)
    ↓ 通关后解锁
tank_level_5 (最终决战 - Boss)
```

### 各关卡配置

#### tank_level_1 - 训练关卡
```json
{
  "enemyCount": 5,
  "enemyTypes": ["light"],
  "timeLimit": 120,
  "difficulty": "easy",
  "mapLayout": "training"
}
```

#### tank_level_2 - 初次战斗
```json
{
  "enemyCount": 8,
  "enemyTypes": ["light", "medium"],
  "timeLimit": 180,
  "difficulty": "easy",
  "mapLayout": "forest",
  "specialEvents": ["airdrop_1"]
}
```

#### tank_level_3 - 钢铁防线
```json
{
  "enemyCount": 12,
  "enemyTypes": ["light", "medium", "heavy"],
  "timeLimit": 240,
  "difficulty": "normal",
  "mapLayout": "steel",
  "steelWallRatio": 0.4,
  "specialEvents": ["reinforcement_1", "airdrop_1"]
}
```

#### tank_level_4 - 腹背受敌
```json
{
  "enemyCount": 15,
  "enemyTypes": ["medium", "heavy"],
  "timeLimit": 300,
  "difficulty": "hard",
  "mapLayout": "desert",
  "multiSpawnPoints": true,
  "spawnPointCount": 5,
  "specialEvents": ["wave_attack_1", "wave_attack_2", "final_wave"]
}
```

#### tank_level_5 - 最终决战 (Boss)
```json
{
  "enemyCount": 20,
  "enemyTypes": ["light", "medium", "heavy"],
  "timeLimit": 360,
  "difficulty": "expert",
  "mapLayout": "final",
  "hasBoss": true,
  "bossSpawnTime": 180,
  "bossHealth": 50,
  "specialEvents": ["opening_assault", "mid_game_assault", "boss_warning", "boss_spawn", "boss_enraged"]
}
```

---

## 🎯 特殊事件系统

### 事件类型

| 事件类型 | 描述 | 参数 |
|----------|------|------|
| `airdrop` | 空投道具 | `type`, `count` |
| `reinforcement` | 敌人增援 | `enemyType`, `count` |
| `wave_attack` | 波次攻击 | `enemyType`, `count` |
| `boss_warning` | Boss 出现警告 | - |
| `boss_spawn` | Boss 生成 | `bossType`, `health` |
| `boss_enraged` | Boss 狂暴 | `speedMultiplier`, `damageMultiplier` |
| `freeze_all` | 冰冻所有敌人 | `duration` |
| `screen_bomb` | 全屏炸弹 | - |

### 事件配置示例

```json
{
  "id": "boss_spawn",
  "type": "boss_spawn",
  "triggerTime": 180,
  "description": "Boss 出现",
  "reward": {
    "bossType": "heavy_boss",
    "health": 50
  }
}
```

---

## ⭐ 星级评价系统

### 评价标准

| 星级 | 分数阈值 | 完成度 | 特殊条件 |
|------|----------|--------|----------|
| ⭐1 | 500 | 60% | - |
| ⭐2 | 800 | 80% | - |
| ⭐3 | 1000 | 100% | 时间奖励 ≥ 60s |

### 计算逻辑

```typescript
// StarRatingSystem.calculateRating()
1. 按星级从高到低排序
2. 对每个标准检查：
   - scoreThreshold: 分数是否达标
   - completionThreshold: 完成度是否达标
   - timeBonusThreshold: 剩余时间是否达标
   - specialCondition: 特殊条件（如 no_deaths）
3. 返回达标的最高星级
```

---

## 🔥 Boss 系统

### Boss 属性

| 属性 | 值 |
|------|-----|
| 生命值 | 50 |
| 移动速度 | 40 |
| 伤害值 | 30 |
| 击杀得分 | 1000 |

### Boss 技能

| 技能 | 冷却时间 | 效果 |
|------|----------|------|
| spread_shot | 5s | 扩散射击 |
| dash | 8s | 冲刺攻击 |
| summon | 15s | 召唤小兵 |

### 狂暴状态

- **触发条件**: Boss 血量 < 30%
- **速度倍率**: x1.5
- **伤害倍率**: x1.5
- **视觉特效**: 闪烁 + 缩放动画

---

## 📁 新增文件

| 文件 | 说明 |
|------|------|
| `config/levels/tank_level_2.json` | 第 2 关配置 |
| `config/levels/tank_level_3.json` | 第 3 关配置 |
| `config/levels/tank_level_4.json` | 第 4 关配置 |
| `config/levels/tank_level_5.json` | 第 5 关配置 (Boss) |
| `utils/StarRatingSystem.ts` | 星级评价系统 |
| `utils/SpecialEventManager.ts` | 特殊事件管理器 |
| `managers/BossManager.ts` | Boss 管理器 |

---

## 🔧 更新文件

| 文件 | 改动 |
|------|------|
| `types/level-types.ts` | 新增特殊事件类型、Boss 类型、星级评价类型 |
| `core/TankGameOrchestrator.ts` | 集成特殊事件系统、统计数据、星级计算 |
| `managers/EntityManager.ts` | 新增 ENEMY_BOSS 类型 |
| `core/TankConfigParser.ts` | 支持 Boss 配置解析 |

---

## 📈 难度曲线

```
难度系数
    │
5.0 │                                                    ████
    │                                              █████
4.0 │                                         █████
    │                                    █████
3.0 │                               █████
    │                          █████
2.0 │                     █████
    │                █████
1.0 │           █████
    │      █████
0.0 │████
    └──────────────────────────────────────────────────→ 关卡
         1    2    3    4    5
```

### 难度参数变化

| 关卡 | 敌人数量 | 生成间隔 | 敌人类型 |
|------|----------|----------|----------|
| 1 | 5 | 3000ms | light |
| 2 | 8 | 2500ms | light, medium |
| 3 | 12 | 2000ms | light, medium, heavy |
| 4 | 15 | 1800ms | medium, heavy |
| 5 | 20 | 1500ms | light, medium, heavy + Boss |

---

## 🚀 下一步优化

1. **关卡进度存档系统**: 实现 localStorage 保存关卡进度
2. **更多道具类型**: 添加手榴弹、护盾等
3. **音效增强**: 为 Boss 战添加专属 BGM
4. **视觉效果**: Boss 战专属屏幕特效
5. **无尽模式**: 整合 InfiniteLevelGenerator 生成无限关卡
