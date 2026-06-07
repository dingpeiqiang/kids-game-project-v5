# 高仿DNF闯关游戏 - 实施规划（更新版）

## 一、概述

在 `simple-game` 项目下策划一个高仿 **DNF（Dungeon & Fighter）** 风格的横版动作闯关游戏，游戏名为 **`dnfRpg`**。

与现有 `contraRpg`（偏射击）不同，本游戏核心为**近战格斗+技能连招+地下城闯关**，还原 DNF 的核心体验：
- 角色选择（鬼剑士/格斗家）
- 地下城房间式关卡推进
- 普通攻击 + 技能连招
- 怪物击飞/浮空/倒地
- 装备掉落与角色成长
- 精英怪 + Boss 战

---

## 二、目录结构（已创建）

```
src/games/dnfRpg/
├── index.ts                     # 入口，导出 initDnfRpg ✅
├── game.ts                      # 主游戏类 ✅
├── config.ts                    # 所有可配置常量 ✅
├── types.ts                     # 所有接口/类型定义 ✅（但有 Bug）
├── logic/
│   ├── player.ts                # 玩家逻辑 ✅
│   ├── combat.ts                # 战斗系统 ✅
│   ├── enemies.ts               # 敌人AI ✅
│   ├── dungeon.ts               # 地下城房间管理 ✅
│   └── equipment.ts             # 装备/道具系统 ✅
├── render/
│   ├── player.ts                # 玩家渲染 ✅
│   ├── enemies.ts               # 敌人渲染 ✅
│   ├── dungeon.ts               # 地下城场景渲染 ✅
│   ├── effects.ts               # 特效渲染 ✅
│   └── ui.ts                    # HUD/UI渲染 ✅
├── levels/
│   ├── level1.ts                # 第1关：格兰之森 ✅
│   ├── level2.ts                # 第2关：天空之城 ✅
│   ├── level3.ts                # 第3关：暗黑城 ✅
│   └── level4.ts                # 第4关：王的遗迹 ✅
└── data/
    ├── classes.ts               # 职业数据 ✅
    ├── skills.ts                # 技能数据 ✅
    └── equipment.ts             # 装备数据 ✅
```

---

## 三、当前状态分析

### 已实现的功能
所有核心代码已编写完成，包括：
- ✅ 角色选择界面（鬼剑士/格斗家）
- ✅ 玩家移动/跳跃/4段连击/技能系统
- ✅ 敌人AI（巡逻/追逐/攻击/射击）
- ✅ 战斗系统（伤害计算/浮空/击退/倒地/保护）
- ✅ 特效系统（打击粒子/震波/浮动文字）
- ✅ 掉落系统（金币/血瓶/装备）
- ✅ 关卡系统（4关，每关3-5个房间）
- ✅ Boss战（多阶段攻击模式）
- ✅ 触屏虚拟按钮
- ✅ 注册到项目（games/index.ts, data/games.ts）

### 已知 Bug（需修复）

#### Bug 1：`types.ts` 缺少 `Bullet` 接口定义
- **影响文件**：`game.ts`, `render/effects.ts`, `logic/enemies.ts`
- **描述**：三个文件都从 `./types` 导入了 `Bullet` 类型并使用，但 `types.ts` 中没有定义 `Bullet` 接口
- **修复**：在 `types.ts` 中添加 `Bullet` 接口

#### Bug 2：`config.ts` 缺少 `PARTICLE_MAX` 常量
- **影响文件**：`game.ts` 第518行
- **描述**：使用了 `C.PARTICLE_MAX` 但 config.ts 中没有定义
- **修复**：在 `config.ts` 中添加 `PARTICLE_MAX` 常量（建议值 200）

#### Bug 3：`App.ts` 中缺少 `case 'dnfRpg'` 启动分支
- **影响文件**：`src/App.ts`
- **描述**：第41行已添加 `import`，但 `startGame()` 方法的 `switch` 语句中缺少 `case 'dnfRpg'`
- **修复**：在 switch 中添加 `case 'dnfRpg': initDnfRpg(gameEngine, () => this.endGame()); break`

---

## 四、实施步骤

### 步骤 1：修复 Bug

#### 1.1 修复 `types.ts` - 添加 `Bullet` 接口
在 `types.ts` 中添加：
```typescript
export interface Bullet {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  damage: number
  isPlayerBullet: boolean
  color: string
}
```

#### 1.2 修复 `config.ts` - 添加 `PARTICLE_MAX`
在 `config.ts` 末尾添加：
```typescript
export const PARTICLE_MAX = 200
```

#### 1.3 修复 `App.ts` - 添加启动分支
在 `src/App.ts` 的 `switch` 语句中添加：
```typescript
case 'dnfRpg': initDnfRpg(gameEngine, () => this.endGame()); break
```

### 步骤 2：编译验证
```bash
npx tsc --noEmit
```

### 步骤 3：手动功能测试
1. 打开游戏 → 看到角色选择界面
2. 选择鬼剑士 → 进入格兰之森
3. 移动/跳跃/攻击/技能测试
4. 清怪 → 门打开 → 进入下一房间
5. Boss战 → 击败Boss → 进入下一关
6. 全部通关 → 结算界面
7. 触屏操作验证

---

## 五、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 渲染方式 | Canvas 2D（沿用项目风格） | 所有现有游戏均使用 Canvas 2D，保持一致 |
| 游戏循环 | requestAnimationFrame（沿用） | 项目标准模式 |
| 触屏控制 | 虚拟按钮（参考 contraRpg） | 已验证的触屏方案，可直接复用模式 |
| 碰撞检测 | AABB（轴对齐矩形） | 项目规范要求，适合2D格斗 |
| 动画帧 | 纯代码绘制（无精灵图） | 项目使用代码绘制角色和特效 |
| 关卡数 | 4关（与 contraRpg 一致） | 保持项目一致性，难度递进 |

---

## 六、验证步骤

1. `npx tsc --noEmit` 编译检查零 error
2. 手动测试流程：选择职业 → 进入地下城 → 清怪过关 → 技能释放 → 击败Boss → 结算
3. 触屏操作验证：方向键 + 技能按钮响应正常
4. 边界情况：玩家死亡、关卡切换、装备掉落拾取