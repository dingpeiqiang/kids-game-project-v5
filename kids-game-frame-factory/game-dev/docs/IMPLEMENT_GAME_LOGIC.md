# 🎮 按设计完成游戏开发 - 避免代码复用陷阱

## ⚠️ 问题诊断

**症状**：测试时发现游戏内容还是贪吃蛇！

**原因**：只做了表面工作（重命名、配置），**没有实现真实的游戏逻辑**！

## 🔍 核心架构理解

### 可复用框架 vs 游戏特定逻辑

```
┌─────────────────────────────────────┐
│   可复用框架代码（保留，不要改）     │
│   ├── core/          核心层         │
│   ├── rendering/     渲染层         │
│   └── GameOrchestrator.ts 编排器    │
└─────────────────────────────────────┘
              ↓ 使用
┌─────────────────────────────────────┐
│   游戏特定逻辑（必须自己实现！）     │
│   ├── logic/         游戏管理器     │ ← ⭐ 这里决定是什么游戏
│   ├── control/       输入控制       │ ← ⭐ 这里决定怎么玩
│   ├── scenes/        游戏场景       │ ← ⭐ 这里初始化游戏
│   └── ui/            UI 界面        │ ← ⭐ 这里显示内容
└─────────────────────────────────────┘
```

**关键认知**：
- ✅ **框架代码**：所有游戏共用，负责渲染、适配、资源加载等通用功能
- ❌ **游戏逻辑**：每个游戏独有，负责具体玩法规则

## 📋 实现步骤（以飞机大战为例）

### 步骤 1：修改 Phaser 游戏场景

**文件位置**：`src/scenes/ComponentGameScene.ts`

```typescript
// ❌ 错误示例：还是调用的贪吃蛇 GameManager
import { SnakeGameManager } from '../logic/SnakeGameManager';

export class ComponentGameScene extends Phaser.Scene {
  private gameManager: SnakeGameManager; // ❌ 这是蛇的管理器！
  
  create() {
    this.gameManager = new SnakeGameManager(this); // ❌ 启动的是贪吃蛇
  }
}

// ✅ 正确示例：使用飞机大战的 GameManager
import { PlaneShooterGameManager } from '../logic/PlaneShooterGameManager';

export class ComponentGameScene extends Phaser.Scene {
  private gameManager: PlaneShooterGameManager; // ✅ 飞机大战管理器
  
  create() {
    // ✅ 初始化飞机大战逻辑
    this.gameManager = new PlaneShooterGameManager(this);
    this.gameManager.start();
  }
  
  update(time: number, delta: number) {
    // ✅ 每帧更新飞机大战状态
    if (this.gameManager) {
      this.gameManager.update(time, delta);
    }
  }
}
```

**检查点**：
- [ ] import 的是否是你自己的 GameManager？
- [ ] 实例化的是否是你自己的 GameManager？
- [ ] update() 调用的是否是你自己的 GameManager？

### 步骤 2：实现游戏管理器（最核心！）

**文件位置**：`src/logic/PlaneShooterGameManager.ts`

```typescript
export class PlaneShooterGameManager {
  private scene: Phaser.Scene;
  
  // ⭐ 飞机大战特有的元素
  private player: Phaser.GameObjects.Sprite;      // 玩家飞机
  private enemies: Phaser.GameObjects.Group;      // 敌机群
  private bullets: Phaser.GameObjects.Group;      // 子弹群
  private score: number = 0;                      // 分数
  private health: number = 3;                     // 生命值
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  start() {
    console.log('🚀 飞机大战开始！');
    
    // ⭐ 初始化飞机大战的元素
    this.createPlayer();      // 创建玩家飞机
    this.createEnemies();     // 创建敌机
    this.createBullets();     // 创建子弹
    this.setupControls();     // 设置控制
    this.startEnemySpawner(); // 开始生成敌机
  }
  
  update(time: number, delta: number) {
    // ⭐ 每帧更新飞机大战状态
    
    // 1. 更新玩家位置（根据输入）
    this.updatePlayer(delta);
    
    // 2. 更新子弹位置
    this.updateBullets(delta);
    
    // 3. 更新敌人位置和 AI
    this.updateEnemies(delta);
    
    // 4. 碰撞检测（核心玩法！）
    this.checkCollisions();
  }
  
  // ⭐ 飞机大战特有逻辑
  
  private createPlayer() {
    // 创建玩家飞机（在屏幕底部中央）
    this.player = this.scene.add.sprite(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.height - 100,
      'player' // 飞机图片资源
    );
    this.player.setInteractive();
    this.player.setScale(2);
  }
  
  private createEnemies() {
    // 创建敌机群
    this.enemies = this.scene.add.group({
      classType: Phaser.GameObjects.Sprite,
      maxSize: 20,
      runChildUpdate: true
    });
  }
  
  private createBullets() {
    // 创建子弹群
    this.bullets = this.scene.add.group({
      classType: Phaser.GameObjects.Sprite,
      maxSize: 100
    });
  }
  
  private setupControls() {
    // 设置触摸/鼠标控制
    this.scene.input.on('pointermove', (pointer) => {
      if (this.player?.active) {
        this.player.x = pointer.x;
      }
    });
    
    // 自动发射子弹
    this.scene.time.addEvent({
      delay: 200,
      callback: this.shootBullet,
      callbackScope: this,
      loop: true
    });
  }
  
  private shootBullet() {
    if (!this.player?.active) return;
    
    const bullet = this.bullets.get(this.player.x, this.player.y - 20, 'bullet');
    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.body.setVelocityY(-500); // 子弹向上飞
    }
  }
  
  private startEnemySpawner() {
    // 定期生成敌机
    this.scene.time.addEvent({
      delay: 1000,
      callback: () => {
        const x = Phaser.Math.Between(50, this.scene.cameras.main.width - 50);
        const enemy = this.enemies.get(x, -50, 'enemy');
        if (enemy) {
          enemy.setActive(true);
          enemy.setVisible(true);
          enemy.body.setVelocityY(100); // 敌机向下飞
        }
      },
      loop: true
    });
  }
  
  private updatePlayer(delta: number) {
    // 更新玩家位置（已经在 setupControls 中处理）
  }
  
  private updateBullets(delta: number) {
    // 移除超出屏幕的子弹
    this.bullets.children.each((bullet: any) => {
      if (bullet.active && bullet.y < 0) {
        bullet.setActive(false);
        bullet.setVisible(false);
      }
    });
  }
  
  private updateEnemies(delta: number) {
    // 移除超出屏幕的敌机
    this.enemies.children.each((enemy: any) => {
      if (enemy.active && enemy.y > this.scene.cameras.main.height + 50) {
        enemy.setActive(false);
        enemy.setVisible(false);
      }
    });
  }
  
  private checkCollisions() {
    // ⭐ 核心玩法：碰撞检测
    
    // 子弹击中敌机
    this.scene.physics.collideOverlaps(
      this.bullets.getChildren(),
      this.enemies.getChildren(),
      (bullet: any, enemy: any) => {
        bullet.setActive(false);
        bullet.setVisible(false);
        enemy.setActive(false);
        enemy.setVisible(false);
        
        // 加分
        this.score += 10;
        this.emitScoreChange();
        
        // 播放爆炸特效
        this.playExplosionEffect(enemy.x, enemy.y);
      }
    );
    
    // 敌机撞击玩家
    this.scene.physics.collideOverlaps(
      this.player,
      this.enemies.getChildren(),
      (player: any, enemy: any) => {
        enemy.setActive(false);
        enemy.setVisible(false);
        
        // 扣血
        this.health -= 1;
        this.emitHealthChange();
        
        if (this.health <= 0) {
          this.gameOver();
        }
      }
    );
  }
  
  private playExplosionEffect(x: number, y: number) {
    // TODO: 播放爆炸动画和音效
  }
  
  private emitScoreChange() {
    // TODO: 通知 UI 更新分数
  }
  
  private emitHealthChange() {
    // TODO: 通知 UI 更新生命值
  }
  
  private gameOver() {
    console.log('💥 游戏结束！得分：', this.score);
    // TODO: 显示游戏结束界面
  }
  
  public getScore(): number {
    return this.score;
  }
  
  public getHealth(): number {
    return this.health;
  }
}
```

**检查点**：
- [ ] 是否有玩家飞机（不是蛇头）？
- [ ] 是否有敌机（不是食物）？
- [ ] 是否有子弹（不是蛇身）？
- [ ] 是否是射击玩法（不是吃食物）？
- [ ] 碰撞检测是否正确（子弹打敌机，不是蛇头吃食物）？

### 步骤 3：对比贪吃蛇 vs 飞机大战

| 元素 | 贪吃蛇 | 飞机大战 | 你必须修改的地方 |
|------|--------|----------|----------------|
| **玩家** | 蛇头 + 蛇身 | 飞机 | 创建 Sprite，不是蛇 |
| **敌人** | 食物（红色方块） | 敌机 | 从上方生成，向下移动 |
| **攻击方式** | 吃食物（撞上去） | 发射子弹 | 定时发射，向上飞行 |
| **移动方式** | 方向键控制 | 触摸/鼠标跟随 | 实时跟随指针 |
| **得分规则** | 吃食物 +10 分 | 击落敌机 +10 分 | 子弹 hit 敌机 |
| **失败条件** | 撞墙或撞自己 | 被敌机撞击 | enemy hit player |
| **AI 逻辑** | 无（食物不动） | 敌机向下飞 | 定时生成，自动下移 |

### 步骤 4：修改 UI 组件

**文件位置**：`src/ui/GameView.vue`

```vue
<template>
  <div class="game-view">
    <!-- ⭐ 飞机大战的 UI，不是贪吃蛇的 -->
    
    <!-- 分数面板 -->
    <div class="score-panel">
      <span>得分：</span>
      <span class="score">{{ score }}</span>
    </div>
    
    <!-- 生命值 -->
    <div class="health-bar">
      <span v-for="i in health" :key="i" class="heart">❤️</span>
    </div>
    
    <!-- 暂停按钮 -->
    <button @click="togglePause" class="pause-btn">
      {{ isPaused ? '继续' : '暂停' }}
    </button>
    
    <!-- Phaser 游戏容器 -->
    <PhaserGame 
      ref="phaserGame"
      :config="gameConfig"
      @ready="onGameReady"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ComponentGameScene } from '@/scenes/ComponentGameScene';

const score = ref(0);
const health = ref(3);
const isPaused = ref(false);

const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // ⭐ 飞机大战不需要重力
      debug: false
    }
  },
  scene: [ComponentGameScene],
  transparent: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

const onGameReady = (game: Phaser.Game) => {
  console.log('🎮 飞机大战已启动');
  // TODO: 监听游戏事件（得分、死亡等）
};

const togglePause = () => {
  isPaused.value = !isPaused.value;
  // TODO: 暂停/恢复游戏
};
</script>

<style scoped>
.game-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.score-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  font-size: 24px;
  color: white;
  z-index: 100;
}

.health-bar {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 5px;
  z-index: 100;
}

.pause-btn {
  position: absolute;
  top: 20px;
  right: 150px;
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 8px;
  z-index: 100;
}
</style>
```

### 步骤 5：验证游戏内容

**快速检查方法**：

```bash
# 1. 检查 GameManager 是否是你的
grep -r "class.*GameManager" src/logic/
# 应该看到：class PlaneShooterGameManager（不是 SnakeGameManager）

# 2. 检查 Scene 使用的是哪个 Manager
grep -r "new.*GameManager" src/scenes/
# 应该看到：new PlaneShooterGameManager（不是 SnakeGameManager）

# 3. 检查游戏元素
grep -r "createPlayer\|createEnemies\|shootBullet" src/logic/
# 应该有输出（飞机大战的方法）

# 4. 运行游戏并观察
npm run dev
# 访问 http://localhost:3005/games/plane-shooter/
# ⭐ 如果看到的是飞机在射击，不是蛇在吃东西 → 成功！
# ⭐ 如果看到的还是蛇 → 回到步骤 1-4 重新检查
```

## ✅ 最终检查清单

在提交代码前，确保：

### 代码层面
- [ ] **Scene 文件**：使用了你自己的 GameManager
- [ ] **GameManager**：实现了完整的游戏逻辑
- [ ] **玩家对象**：是飞机/坦克/角色，不是蛇
- [ ] **敌对对象**：是敌机/僵尸/障碍，不是食物
- [ ] **攻击方式**：是射击/放置，不是吃食物
- [ ] **移动逻辑**：符合你的游戏设计
- [ ] **碰撞规则**：正确的得分和失败条件

### 运行时验证
- [ ] **启动游戏**：能看到你的游戏画面
- [ ] **控制测试**：操作方式符合设计
- [ ] **玩法测试**：核心玩法正常运行
- [ ] **UI 测试**：分数、生命等显示正确
- [ ] **音效测试**：背景音乐和音效正常

### 设计一致性
- [ ] **对照 GDD**：是否符合游戏设计文档
- [ ] **年级适配**：难度是否适合目标年级
- [ ] **教学目标**：是否达成教学目的

## 🆘 常见问题

### Q1: 我改了代码，为什么运行还是贪吃蛇？

**A**: 可能原因：
1. **缓存问题** - 清除浏览器缓存并硬刷新（Ctrl+Shift+R）
2. **路由错误** - 检查路由是否指向新游戏的组件
3. **文件未保存** - 确认修改的文件已保存
4. **编译未更新** - 重启开发服务器

```bash
# 解决步骤
rm -rf node_modules/.vite
npm run dev
# 浏览器 Ctrl+Shift+R 硬刷新
```

### Q2: 我不知道如何实现我的游戏逻辑怎么办？

**A**: 分步骤进行：
1. **参考类似游戏** - 找相似的游戏参考代码
2. **拆解核心玩法** - 列出最关键的两个机制
3. **逐个实现** - 先实现移动，再实现交互
4. **测试验证** - 每步都测试是否能运行

### Q3: 框架代码和游戏逻辑怎么区分？

**A**: 简单判断方法：
- **框架代码**：所有游戏都需要（渲染、适配、资源加载）→ 不要改
- **游戏逻辑**：你的游戏特有（玩家、敌人、规则）→ 必须改

## 💡 最佳实践

1. **先理解后动手**
   - 理解框架的架构
   - 理解哪些要改，哪些不改

2. **小步快跑**
   - 先实现最简单的版本
   - 逐步添加功能
   - 每步都测试

3. **对照设计文档**
   - 时刻记住你要做什么游戏
   - 不要偏离设计目标

4. **善用调试工具**
   - Phaser Debug 模式
   - 浏览器开发者工具
   - 控制台日志

---

**记住**：框架只是工具，真正的游戏内容要靠你实现！🎮
