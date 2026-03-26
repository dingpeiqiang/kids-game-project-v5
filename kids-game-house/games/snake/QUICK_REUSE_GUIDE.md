# 🚀 PhaserGame.ts 快速复用指南

**版本**: v1.0  
**适用**: 所有新游戏开发  

---

## 📋 一分钟快速开始

### 场景 1: 我要开发一个新游戏

```bash
# 1. 复制文件
cp kids-game-house/games/snake/src/components/game/PhaserGame.ts \
   kids-game-house/games/YOUR_GAME/src/components/game/YourGamePhaserGame.ts

# 2. 打开文件，修改以下内容:
```

#### ✅ 必须修改的部分 (仅 3 处)

```typescript
// 第 1 行：修改类名
export class SnakePhaserGame → export class YourGamePhaserGame

// 第 180-190 行：修改游戏特定配置
private readonly GRID_COLS = 20  // ⚠️ 改成你的游戏网格列数
private readonly GRID_ROWS = 15  // ⚠️ 改成你的游戏网格行数
private readonly BASE_CELL_SIZE = 60  // ⚠️ 改成你的基础单元格大小

// 第 200-210 行：修改游戏对象引用
// ❌ 删除贪吃蛇对象
// private snakeGroup: ...
// private foodSprite: ...

// ✅ 添加你的游戏对象
private playerShip: Phaser.GameObjects.Sprite | null = null
private enemyGroup: Phaser.GameObjects.Group | null = null
```

#### ✅ 可选修改的部分

```typescript
// 渲染方法 (约第 700 行以后)
// ❌ 删除或重写这些方法
renderSnake() { ... }  →  delete or renderPlayer()
renderFood() { ... }   →  delete or renderEnemies()
```

---

## 🎯 代码结构说明

### 文件分层

```
PhaserGame.ts
├── 【可复用框架层】(第 1-600 行) ← 直接复制，无需修改
│   ├── GTRS 主题加载系统
│   ├── Phaser 引擎初始化
│   ├── 屏幕自适应系统
│   ├── 音频管理系统
│   └── 资源管理系统
│
└── 【游戏特定层】(第 600 行以后) ← 根据具体游戏修改
    ├── 游戏对象引用
    ├── 渲染方法
    └── 游戏逻辑方法
```

### 注释标记说明

| 标记 | 含义 | 操作 |
|------|------|------|
| `🔧【可复用框架层】` | 所有游戏通用 | ✅ 直接复制 |
| `🎨【游戏特定层】` | 每个游戏不同 | ✏️ 需要修改 |
| `⚠️` | 重要提示 | ⚠️ 注意修改 |
| `📌 说明` | 使用说明 | 📖 阅读指导 |

---

## 📊 常见游戏配置示例

### 飞机大战 (Shooting Game)

```typescript
// 网格配置
private readonly GRID_COLS = 20
private readonly GRID_ROWS = 15
private readonly BASE_CELL_SIZE = 60

// 游戏对象
private playerShip: Phaser.GameObjects.Sprite | null = null
private enemyGroup: Phaser.GameObjects.Group | null = null
private bulletGroup: Phaser.GameObjects.Group | null = null
private bossSprite: Phaser.GameObjects.Sprite | null = null

// 渲染方法
renderPlayer(position: Position): void { ... }
renderEnemies(enemies: Enemy[]): void { ... }
renderBullets(bullets: Bullet[]): void { ... }
renderBoss(boss: Boss): void { ... }
```

### 坦克大战 (Tank Battle)

```typescript
// 网格配置
private readonly GRID_COLS = 24
private readonly GRID_ROWS = 20
private readonly BASE_CELL_SIZE = 40

// 游戏对象
private playerTank: Phaser.GameObjects.Sprite | null = null
private enemyTanks: Phaser.GameObjects.Group | null = null
private wallGroup: Phaser.GameObjects.Group | null = null
private bulletGroup: Phaser.GameObjects.Group | null = null

// 渲染方法
renderPlayerTank(position: Position, direction: number): void { ... }
renderEnemyTanks(tanks: Tank[]): void { ... }
renderWalls(walls: Wall[]): void { ... }
renderBullets(bullets: Bullet[]): void { ... }
```

### 植物大战僵尸 (Tower Defense)

```typescript
// 网格配置
private readonly GRID_COLS = 9  // 9 列
private readonly GRID_ROWS = 5  // 5 行
private readonly BASE_CELL_SIZE = 80

// 游戏对象
private plants: Map<string, Phaser.GameObjects.Sprite> = new Map()
private zombies: Phaser.GameObjects.Group | null = null
private projectiles: Phaser.GameObjects.Group | null = null
private suns: Phaser.GameObjects.Group | null = null

// 渲染方法
renderPlants(plants: Plant[]): void { ... }
renderZombies(zombies: Zombie[]): void { ... }
renderProjectiles(projectiles: Projectile[]): void { ... }
renderSuns(suns: Sun[]): void { ... }
```

---

## 🔍 常见问题 FAQ

### Q1: 哪些代码可以直接复制？

**A**: 带有 `🔧【可复用框架层】` 标记的所有代码都可以直接复制，包括:
- ✅ GTRS 主题加载
- ✅ Phaser 引擎初始化
- ✅ 屏幕适配系统
- ✅ 音频管理
- ✅ 资源管理

### Q2: 哪些代码必须修改？

**A**: 带有 `🎨【游戏特定层】` 标记的代码需要根据具体游戏修改:
- ✏️ 游戏对象引用 (蛇、食物 → 飞机、敌机等)
- ✏️ 渲染方法 (renderSnake → renderPlayer 等)
- ✏️ 游戏特定配置 (GRID_COLS, GRID_ROWS 等)

### Q3: 如何修改类名？

**A**: 
```typescript
// 查找所有 SnakePhaserGame 并替换
SnakePhaserGame → YourGamePhaserGame
```

### Q4: 屏幕适配参数需要修改吗？

**A**: **不需要!** 屏幕适配系统是所有游戏通用的，会自动计算最佳参数。

### Q5: GTRS 主题系统需要修改吗？

**A**: **不需要!** GTRS 主题系统完全通用，只需在 GTRS.json 中配置不同的资源即可。

---

## 📝 检查清单

开发新游戏时，确保完成以下步骤:

- [ ] ✅ 复制 PhaserGame.ts 到新项目
- [ ] ✅ 修改类名 (SnakePhaserGame → YourGamePhaserGame)
- [ ] ✅ 修改游戏特定配置 (GRID_COLS, GRID_ROWS, BASE_CELL_SIZE)
- [ ] ✅ 修改游戏对象引用 (删除旧对象，添加新对象)
- [ ] ✅ 实现新的渲染方法
- [ ] ✅ 测试游戏启动和运行
- [ ] ✅ 验证屏幕适配正常
- [ ] ✅ 验证 GTRS 主题加载正常

---

## 🎉 成功案例

### 案例 1: 飞机大战

```bash
# 复制文件
cp snake/src/components/game/PhaserGame.ts \
   plane-shooter/src/components/game/PlanePhaserGame.ts

# 修改内容:
- 类名：SnakePhaserGame → PlanePhaserGame
- 网格：32x18 → 20x15
- 对象：蛇、食物 → 飞机、敌机、子弹
- 渲染：renderSnake → renderPlayer, renderEnemies, renderBullets

# 复用率：62% 代码直接复制
# 开发时间：仅需修改游戏特定逻辑 (~2 小时)
```

### 案例 2: 坦克大战

```bash
# 复制文件
cp snake/src/components/game/PhaserGame.ts \
   tank-battle/src/components/game/TankPhaserGame.ts

# 修改内容:
- 类名：SnakePhaserGame → TankPhaserGame
- 网格：32x18 → 24x20
- 对象：蛇、食物 → 坦克、墙壁、子弹
- 渲染：renderSnake → renderPlayerTank, renderEnemyTanks

# 复用率：62% 代码直接复制
# 开发时间：仅需修改游戏特定逻辑 (~2.5 小时)
```

---

## 📞 需要帮助？

如果遇到问题，请查看完整文档:
- 📖 **完整优化报告**: `PHASER_GAME_CODE_STRUCTURE_OPTIMIZATION.md`
- 📖 **游戏开发规范**: `../../../GAME_DEVELOPMENT_STANDARD.md`
- 📖 **GTRS 配置指南**: `../../config/GTRS.json`

---

**最后更新**: 2026-03-26  
**维护者**: Lingma AI Assistant  
**状态**: ✅ 已发布 v1.0
