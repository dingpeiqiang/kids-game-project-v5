# RPG Shooter 模块化重构指南

## 📁 目录结构

```
rpgShooter/
├── config.ts          # 游戏配置常量
├── types.ts           # TypeScript类型定义
├── state.ts           # 状态管理
├── player.ts          # 玩家逻辑
├── enemies.ts         # 敌人系统（待实现）
├── bullets.ts         # 子弹系统（待实现）
├── powerups.ts        # 道具系统（待实现）
├── particles.ts       # 粒子特效（待实现）
├── collision.ts       # 碰撞检测（待实现）
├── rendering.ts       # 渲染函数（待实现）
├── input.ts           # 输入处理（待实现）
└── index.ts           # 模块导出
```

## ✅ 已完成模块

1. **config.ts** - 游戏配置常量
   - 游戏基础参数
   - 等级属性表
   - 敌人类型定义
   - 掉落物配置

2. **types.ts** - 完整类型定义
   - 所有游戏对象接口
   - 游戏状态接口
   - Boss和连击奖励类型

3. **state.ts** - 状态管理
   - 初始化状态
   - 重置状态功能

4. **player.ts** - 玩家逻辑
   - 属性初始化
   - 升级系统
   - 移动控制
   - 受伤处理

## 🚧 待实现模块

### enemies.ts - 敌人系统
```typescript
// 需要实现的功能：
- spawnEnemy() - 生成敌人
- updateEnemies() - 更新敌人位置和AI
- drawEnemy() - 绘制敌人
- 敌人类型特殊行为
```

### bullets.ts - 子弹系统
```typescript
// 需要实现的功能：
- shoot() - 玩家射击
- updateBullets() - 更新子弹位置
- spawnEnemyBullet() - 敌人生成弹幕
- updateEnemyBullets() - 更新敌人子弹
- 追踪子弹逻辑
- 穿透子弹逻辑
```

### powerups.ts - 道具系统
```typescript
// 需要实现的功能：
- spawnDrop() - 生成掉落物
- usePowerup() - 使用道具
- updateDrops() - 更新掉落物
- 自动收集逻辑
- 各种道具效果实现
```

### particles.ts - 粒子特效
```typescript
// 需要实现的功能：
- explode() - 爆炸特效
- updateParticles() - 更新粒子
- drawParticles() - 绘制粒子
- 特殊特效（升级、击杀等）
```

### collision.ts - 碰撞检测
```typescript
// 需要实现的功能：
- rectCollide() - 矩形碰撞
- circleCollide() - 圆形碰撞
- 子弹-敌人碰撞
- 玩家-敌人碰撞
- 玩家-掉落物碰撞
```

### rendering.ts - 渲染函数
```typescript
// 需要实现的功能：
- drawBackground() - 背景绘制
- drawPlayer() - 玩家绘制
- drawHUD() - HUD界面
- drawFloatTexts() - 浮动文字
- 屏幕震动和闪光效果
```

### input.ts - 输入处理
```typescript
// 需要实现的功能：
- handleMove() - 鼠标/触摸移动
- handleTap() - 点击事件
- 键盘事件绑定
- 输入状态更新
```

## 📝 使用示例

```typescript
// 在主文件 rpgShooter.ts 中
import { GAME_CONFIG } from './rpgShooter/config';
import { createInitialState } from './rpgShooter/state';
import { updatePlayer, levelUp, playerHit } from './rpgShooter/player';
// ... 导入其他模块

export function initRpgShooter(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  
  // 创建游戏状态
  const state = createInitialState();
  
  // 游戏循环
  function update() {
    const now = Date.now();
    const dt = now - lastTime;
    lastTime = now;
    
    // 更新玩家
    updatePlayer(state, dt);
    
    // 更新其他系统...
  }
  
  function render() {
    // 渲染游戏...
  }
}
```

## 🎯 下一步计划

### Phase 1: 核心系统（优先级高）
1. ✅ config.ts
2. ✅ types.ts
3. ✅ state.ts
4. ✅ player.ts
5. ⏳ bullets.ts - 子弹系统
6. ⏳ enemies.ts - 敌人系统
7. ⏳ collision.ts - 碰撞检测

### Phase 2: 增强功能（优先级中）
8. ⏳ powerups.ts - 道具系统
9. ⏳ particles.ts - 粒子特效
10. ⏳ rendering.ts - 渲染优化

### Phase 3: 完善体验（优先级低）
11. ⏳ input.ts - 输入处理
12. ⏳ audio.ts - 音效管理
13. ⏳ utils.ts - 工具函数

## 💡 模块化优势

1. **可维护性**：每个模块职责单一，易于理解和修改
2. **可测试性**：可以单独测试每个模块
3. **可扩展性**：添加新功能只需新增或修改对应模块
4. **团队协作**：不同开发者可以同时处理不同模块
5. **代码复用**：通用功能可以在多个游戏中复用

## 🔧 迁移步骤

1. 逐个创建模块文件
2. 将原 rpgShooter.ts 中的代码拆分到各模块
3. 在 rpgShooter.ts 中导入并使用新模块
4. 测试确保功能正常
5. 删除旧代码

## 📊 进度跟踪

- [x] 创建目录结构
- [x] config.ts
- [x] types.ts
- [x] state.ts
- [x] player.ts
- [ ] enemies.ts
- [ ] bullets.ts
- [ ] collision.ts
- [ ] powerups.ts
- [ ] particles.ts
- [ ] rendering.ts
- [ ] input.ts
- [ ] 主文件重构
- [ ] 全面测试
