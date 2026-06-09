# 🚀 RPG Shooter 模块化 - 快速开始指南

## 📋 前置条件

- TypeScript 基础
- 了解 Canvas 2D API
- 熟悉 ES6 模块系统

## 🎯 5分钟上手

### Step 1: 查看现有模块

```bash
# 进入模块目录
cd kids-game-house/games/simple-game/src/games/rpgShooter

# 查看文件列表
ls
```

你会看到：
```
✅ config.ts       - 游戏配置
✅ types.ts        - 类型定义
✅ state.ts        - 状态管理
✅ player.ts       - 玩家逻辑
✅ bullets.ts      - 子弹系统（含弹幕）
✅ index.ts        - 统一导出
📚 *.md           - 文档
```

### Step 2: 理解核心概念

#### 游戏状态 (GameState)
所有游戏数据都存储在 `GameState` 对象中：

```typescript
import { GameState } from './rpgShooter/types';

const state: GameState = {
  playerX: 200,
  playerY: 300,
  playerHP: 6,
  score: 0,
  // ... 更多字段
};
```

#### 纯函数操作
所有函数都接收 `state` 作为参数：

```typescript
import { updatePlayer, shoot } from './rpgShooter';

// 更新玩家位置
updatePlayer(state, dt);

// 射击
shoot(state);
```

### Step 3: 简单示例

创建一个测试文件 `test.ts`：

```typescript
import { createInitialState } from './rpgShooter/state';
import { levelUp } from './rpgShooter/player';
import { shoot } from './rpgShooter/bullets';

// 1. 创建游戏状态
const state = createInitialState();
console.log('初始等级:', state.playerLevel); // 输出: 1

// 2. 模拟升级
levelUp(state);
console.log('升级后等级:', state.playerLevel); // 输出: 2
console.log('升级后HP:', state.playerHP); // 输出: 7

// 3. 模拟射击
state.targetX = 300;
state.targetY = 200;
shoot(state);
console.log('子弹数量:', state.bullets.length); // 输出: 1
```

## 🔧 实际使用

### 在原有 rpgShooter.ts 中使用

#### 方式1: 渐进式替换（推荐）

保留原有代码，逐步替换为模块调用：

```typescript
// 原 rpgShooter.ts

import { 
  createInitialState,
  updatePlayer,
  shoot,
  levelUp
} from './rpgShooter';

export function initRpgShooter(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  
  // ✅ 使用新模块创建状态
  const state = createInitialState();
  
  let lastTime = Date.now();
  
  function update() {
    const now = Date.now();
    const dt = now - lastTime;
    lastTime = now;
    
    if (state.gameStarted && !state.gameEnded) {
      // ✅ 使用模块函数
      updatePlayer(state, dt);
      shoot(state);
      
      // 其他逻辑暂时保留原样
      // ...
    }
    
    requestAnimationFrame(update);
  }
  
  update();
}
```

#### 方式2: 完全重构（最终目标）

将所有逻辑迁移到模块中：

```typescript
// 新的 rpgShooter.ts（简洁版）

import { GameEngine } from '../services/gameEngine';
import { createInitialState } from './rpgShooter/state';
import { update } from './rpgShooter/gameLoop';
import { render } from './rpgShooter/rendering';
import { setupInput } from './rpgShooter/input';

export function initRpgShooter(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  
  const state = createInitialState();
  setupInput(canvas, state);
  
  let lastTime = Date.now();
  
  function loop() {
    const now = Date.now();
    const dt = now - lastTime;
    lastTime = now;
    
    update(state, dt);
    render(ctx, state);
    
    if (!state.gameEnded) {
      requestAnimationFrame(loop);
    } else {
      setTimeout(onEnd, 600);
    }
  }
  
  loop();
}
```

## 🎮 添加新功能示例

### 示例1: 添加新武器

#### Step 1: 在 config.ts 中添加配置

```typescript
// config.ts
export const WEAPONS = {
  normal: { cd: 200, damage: 1, color: '#00E5FF' },
  shotgun: { cd: 400, damage: 1, color: '#FFD700', count: 5 }
};
```

#### Step 2: 在 bullets.ts 中实现

```typescript
// bullets.ts
import { WEAPONS } from './config';

export function shootWeapon(state: GameState, weaponType: string) {
  const weapon = WEAPONS[weaponType];
  const now = Date.now();
  
  if (now - state.lastShot < weapon.cd) return;
  state.lastShot = now;
  
  // 散弹枪：发射多发子弹
  if (weaponType === 'shotgun') {
    for (let i = 0; i < weapon.count; i++) {
      const angle = state.shootAngle + (i - 2) * 0.2;
      state.bullets.push({
        x: state.playerX,
        y: state.playerY,
        vx: Math.cos(angle) * GAME_CONFIG.BULLET_SPEED,
        vy: Math.sin(angle) * GAME_CONFIG.BULLET_SPEED,
        atk: weapon.damage * state.playerATK,
        color: weapon.color,
        tracking: false
      });
    }
  }
}
```

#### Step 3: 在 index.ts 中导出

```typescript
// index.ts
export { shootWeapon } from './bullets';
```

#### Step 4: 使用新武器

```typescript
import { shootWeapon } from './rpgShooter';

// 切换武器
let currentWeapon = 'normal';

// 按空格切换
document.onkeydown = (e) => {
  if (e.code === 'Space') {
    currentWeapon = currentWeapon === 'normal' ? 'shotgun' : 'normal';
  }
};

// 射击时使用
function update() {
  shootWeapon(state, currentWeapon);
}
```

### 示例2: 添加新敌人类型

#### Step 1: 在 config.ts 中定义

```typescript
export const ENEMY_TYPES = [
  // ... 现有敌人
  { 
    w: 25, h: 25, hp: 3, score: 30, exp: 20,
    color: '#00FF00', shape: 'jumper', speedMult: 1.5 
  }
];
```

#### Step 2: 在 enemies.ts 中实现行为

```typescript
// enemies.ts
export function updateJumperEnemy(enemy: Enemy, state: GameState) {
  // 跳跃式移动
  const time = Date.now() * 0.003;
  enemy.x += Math.cos(time) * 2;
  enemy.y += Math.sin(time * 2) * 1;
}
```

## 🐛 调试技巧

### 1. 打印状态

```typescript
// 查看当前状态
console.log('Player HP:', state.playerHP);
console.log('Enemies:', state.enemies.length);
console.log('Score:', state.score);
```

### 2. 可视化调试

```typescript
// 在画布上显示调试信息
function drawDebugInfo(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = '#fff';
  ctx.font = '12px monospace';
  ctx.fillText(`FPS: ${Math.round(1000 / dt)}`, 10, 20);
  ctx.fillText(`Bullets: ${state.bullets.length}`, 10, 35);
  ctx.fillText(`Energy: ${state.energy}`, 10, 50);
}
```

### 3. 性能监控

```typescript
// 监测帧率
let frameCount = 0;
let lastFpsTime = Date.now();

function monitorPerformance() {
  frameCount++;
  const now = Date.now();
  
  if (now - lastFpsTime >= 1000) {
    console.log('FPS:', frameCount);
    frameCount = 0;
    lastFpsTime = now;
  }
}
```

## 📚 学习路径

### Day 1: 理解架构
- [ ] 阅读 MODULE_README.md
- [ ] 查看 types.ts 了解数据结构
- [ ] 运行简单示例

### Day 2: 实践操作
- [ ] 尝试修改 config.ts 的参数
- [ ] 添加一个简单的道具效果
- [ ] 调试并观察效果

### Day 3: 扩展功能
- [ ] 实现 enemies.ts 模块
- [ ] 添加新的敌人类型
- [ ] 测试弹幕系统

### Day 4: 优化完善
- [ ] 性能分析和优化
- [ ] 添加单元测试
- [ ] 编写文档

## 💡 常见问题

### Q1: 为什么要模块化？
**A:** 
- 代码更易维护
- 功能易扩展
- 便于团队协作
- 提高代码质量

### Q2: 如何处理模块间的依赖？
**A:** 
通过 `GameState` 传递数据，避免直接依赖：
```typescript
// ✅ 好的做法
function moduleA(state: GameState) {
  state.sharedData = value;
}

function moduleB(state: GameState) {
  use(state.sharedData);
}
```

### Q3: 性能会下降吗？
**A:** 
不会，反而可能提升：
- 更好的代码组织利于优化
- 可以针对性优化瓶颈模块
- 减少不必要的计算

### Q4: 如何测试单个模块？
**A:**
```typescript
import { createInitialState } from './state';
import { levelUp } from './player';

// 创建测试状态
const state = createInitialState();

// 测试升级功能
levelUp(state);
console.assert(state.playerLevel === 2, '升级失败');
```

## 🎯 下一步行动

1. **立即开始**
   ```bash
   # 查看现有模块
   cat rpgShooter/config.ts
   
   # 运行测试
   npm run dev
   ```

2. **选择一个任务**
   - [ ] 实现 enemies.ts
   - [ ] 添加新武器
   - [ ] 优化渲染性能

3. **阅读文档**
   - MODULE_README.md - API参考
   - REFACTOR_GUIDE.md - 重构指南
   - IMPLEMENTATION_SUMMARY.md - 实施总结

## 🤝 获取帮助

遇到问题？
1. 查看文档目录下的 .md 文件
2. 检查 TypeScript 编译错误
3. 使用 console.log 调试
4. 参考示例代码

---

**准备好了吗？开始编码吧！** 🚀
