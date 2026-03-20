# 本地对抗模式 - 双独立实例架构

## 📋 架构概览

### 核心理念

本地对抗模式采用**双独立实例**架构，每个玩家拥有完全隔离的游戏实例，模式层仅负责：

1. **物理切屏** - 将屏幕分为左右两个区域
2. **数据整合** - 收集两个游戏实例的状态数据
3. **规则控制** - 判定胜负、协调回合

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│              模式管理层 (LocalBattleModeDual)            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 职责:                                           │   │
│  │ 1. 容器分割（物理切屏）                          │   │
│  │ 2. 创建/销毁游戏实例                            │   │
│  │ 3. 数据收集（监听游戏事件）                      │   │
│  │ 4. 规则判定（对比结果、判定胜负）                │   │
│  └─────────────────────────────────────────────────┘   │
└──────────┬───────────────────────────────────┬──────────┘
           │                                   │
           │ 创建                              │ 创建
           ▼                                   ▼
┌─────────────────────┐           ┌─────────────────────┐
│  游戏实例1 (完全独立)│           │  游戏实例2 (完全独立) │
│  ┌───────────────┐  │           │  ┌───────────────┐  │
│  │ 状态          │  │           │  │ 状态          │  │
│  │ - 分数        │  │           │  │ - 分数        │  │
│  │ - 生命值      │  │           │  │ - 生命值      │  │
│  │ - 当前题目    │  │           │  │ - 当前题目    │  │
│  └───────────────┘  │           │  └───────────────┘  │
│  ┌───────────────┐  │           │  ┌───────────────┐  │
│  │ 生命周期      │  │           │  │ 生命周期      │  │
│  │ - 初始化      │  │           │  │ - 初始化      │  │
│  │ - 启动        │  │           │  │ - 启动        │  │
│  │ - 暂停/恢复   │  │           │  │ - 暂停/恢复   │  │
│  │ - 结束        │  │           │  │ - 结束        │  │
│  └───────────────┘  │           │  └───────────────┘  │
│  ┌───────────────┐  │           │  ┌───────────────┐  │
│  │ 渲染上下文    │  │           │  │ 渲染上下文    │  │
│  │ - 独立容器    │  │           │  │ - 独立容器    │  │
│  │ - 独立画布    │  │           │  │ - 独立画布    │  │
│  └───────────────┘  │           │  └───────────────┘  │
│  ┌───────────────┐  │           │  ┌───────────────┐  │
│  │ 输入处理      │  │           │  │ 输入处理      │  │
│  │ - 独立监听    │  │           │  │ - 独立监听    │  │
│  │ - 独立响应    │  │           │  │ - 独立响应    │  │
│  └───────────────┘  │           │  └───────────────┘  │
└─────────────────────┘           └─────────────────────┘
           │                                   │
           ▼                                   ▼
┌─────────────────────┐           ┌─────────────────────┐
│  容器1 (左屏/上屏)   │           │  容器2 (右屏/下屏)   │
│  - 粉色主题          │           │  - 青色主题          │
│  - Player 1 标签     │           │  - Player 2 标签     │
└─────────────────────┘           └─────────────────────┘
```

## 🎯 核心特性

### 1. 完全隔离

两个游戏实例之间**完全独立**，互不干扰：

| 维度 | 游戏实例1 | 游戏实例2 |
|------|-----------|-----------|
| **状态** | 独立分数、生命值、题目 | 独立分数、生命值、题目 |
| **渲染** | 独立容器、独立画布 | 独立容器、独立画布 |
| **输入** | 独立监听、独立响应 | 独立监听、独立响应 |
| **生命周期** | 独立初始化、启动、结束 | 独立初始化、启动、结束 |
| **资源** | 独立加载、独立销毁 | 独立加载、独立销毁 |

### 2. 物理切屏

模式层只负责**容器分割**，不干预游戏渲染：

```typescript
// 模式层创建两个独立容器
container1.style.left = '0';
container1.style.width = '50%';     // 左半屏

container2.style.left = '50%';
container2.style.width = '50%';     // 右半屏

// 游戏实例在自己的容器内独立渲染
game1.render(container1);  // 在左屏渲染
game2.render(container2);  // 在右屏渲染
```

### 3. 数据整合

模式层通过**事件监听**收集两个游戏的数据：

```typescript
// 监听游戏1事件
gameInstance1.on('state_change', (state) => {
  this.gameState1 = state;  // 收集游戏1数据
});

gameInstance1.on('game_end', (result) => {
  this.collectGameData(1, result);  // 收集游戏1结果
});

// 监听游戏2事件
gameInstance2.on('state_change', (state) => {
  this.gameState2 = state;  // 收集游戏2数据
});

gameInstance2.on('game_end', (result) => {
  this.collectGameData(2, result);  // 收集游戏2结果
});
```

### 4. 规则控制

模式层根据收集的数据进行**规则判定**：

```typescript
private applyGameRules(): void {
  const score1 = this.gameState1.score || 0;
  const score2 = this.gameState2.score || 0;

  let winner: string;
  if (score1 > score2) {
    winner = 'player1';
  } else if (score2 > score1) {
    winner = 'player2';
  } else {
    winner = 'draw';
  }

  // 触发规则判定事件
  this.emit('battle_end', {
    winner,
    player1: { score: score1, state: this.gameState1 },
    player2: { score: score2, state: this.gameState2 },
  });
}
```

## 📖 使用示例

### 基础用法

```typescript
import { LocalBattleModeDual } from './core/modes/LocalBattleModeDual';
import { ArithmeticGameV2 } from './arithmetic/ArithmeticGameV2';

// 1. 创建模式
const battleMode = new LocalBattleModeDual({
  splitType: 'vertical', // 垂直分屏
});

// 2. 初始化（设置物理切屏）
const container = document.getElementById('game-container');
await battleMode.initialize({}, container);

// 3. 创建并启动两个独立游戏
await battleMode.createAndStartGames(
  // 游戏创建函数（每次创建新实例）
  (gameContainer: HTMLElement) => {
    return new ArithmeticGameV2(gameContainer);
  },
  // 玩家1配置
  { gameType: 'arithmetic', difficulty: 'medium', player: { id: 'player1' } },
  // 玩家2配置
  { gameType: 'arithmetic', difficulty: 'medium', player: { id: 'player2' } }
);

// 4. 监听规则判定
battleMode.on('battle_end', (data) => {
  console.log('获胜者:', data.winner);
  console.log('玩家1得分:', data.player1.score);
  console.log('玩家2得分:', data.player2.score);
});
```

### 实时监控

```typescript
// 定时获取两个游戏的状态对比
const interval = setInterval(() => {
  const combinedState = battleMode.getCombinedState();
  
  console.log('玩家1:', combinedState.game1.score);
  console.log('玩家2:', combinedState.game2.score);
  console.log('分数差:', combinedState.comparison.scoreDifference);
}, 2000);
```

### 控制游戏

```typescript
// 暂停两个游戏
battleMode.pauseGames();

// 恢复两个游戏
battleMode.resumeGames();

// 重启两个游戏
battleMode.restartGames();

// 销毁游戏实例
await battleMode.destroyGames();
```

## 🔄 数据流

```
游戏实例1                    模式层                    游戏实例2
   │                          │                          │
   │  state_change 事件      │                          │
   ├─────────────────────────►│                          │
   │                          │  收集 gameState1         │
   │                          │                          │
   │                          │◄─────────────────────────┤
   │                          │  state_change 事件      │
   │                          │  收集 gameState2         │
   │                          │                          │
   │                          │  对比状态               │
   │                          │  判定胜负               │
   │                          │                          │
   │◄─────────────────────────┤  battle_end 事件        │
   │                          ├─────────────────────────►│
   │  显示结果                │  显示结果                │
   │                          │                          │
```

## 💡 设计优势

### ✅ 完全隔离
- 两个游戏实例互不干扰
- 状态、渲染、输入完全独立
- 避免状态同步问题

### ✅ 职责清晰
- 模式层：容器分割、数据收集、规则控制
- 游戏层：游戏逻辑、渲染、输入处理

### ✅ 易于扩展
- 支持不同难度的游戏（玩家1简单、玩家2困难）
- 支持不同类型的游戏（玩家1算数、玩家2五子棋）
- 支持自定义规则（三局两胜、积分制等）

### ✅ 资源高效
- 游戏实例可以复用
- 容器独立管理
- 销毁时自动清理

## 🎮 适用场景

### 1. 本地双人同屏对战
- 两人共用一个设备
- 左右分屏独立游戏
- 最终对比得分

### 2. 差异化难度对战
- 玩家1简单难度
- 玩家2困难难度
- 测试不同水平

### 3. 多轮积分赛
- 进行多轮对战
- 累计每轮得分
- 最终判定总排名

### 4. 不同类型游戏对战
- 玩家1玩算数游戏
- 玩家2玩五子棋
- 对比得分或用时

## 📝 注意事项

### 1. 游戏创建函数
```typescript
// ✅ 正确：每次创建新实例
(gameContainer: HTMLElement) => new ArithmeticGameV2(gameContainer)

// ❌ 错误：复用同一个实例
const game = new ArithmeticGameV2();
(gameContainer) => game
```

### 2. 容器清理
```typescript
// 游戏结束时必须清理
await battleMode.destroyGames();

// 或者页面卸载时自动清理
window.addEventListener('beforeunload', async () => {
  await battleMode.cleanup();
});
```

### 3. 事件监听清理
```typescript
// 对战结束后停止定时器
battleMode.on('battle_end', () => {
  clearInterval(monitorInterval);
});
```

## 🔗 相关文件

- `LocalBattleModeDual.ts` - 双独立实例模式实现
- `DualInstanceUsage.ts` - 使用示例
- `BaseGameMode.ts` - 模式基类
- `GameCoreAdapter.ts` - 游戏核心适配器
