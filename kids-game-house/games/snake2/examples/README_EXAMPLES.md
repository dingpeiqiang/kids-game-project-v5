# 📝 示例代码使用指南

**版本**: v1.3.0-dev  
**创建时间**: 2026-04-05  

---

## 📦 示例代码说明

本目录包含 7 个完整的示例代码，展示如何使用 GCRS 关卡系统开发贪吃蛇游戏。

### 示例列表

1. **basic-snake-game.ts** - 基础贪吃蛇游戏
2. **custom-level.ts** - 自定义关卡配置
3. **event-handling.ts** - 事件处理示例
4. **custom-objectives.ts** - 自定义目标系统
5. **food-effects.ts** - 食物效果演示
6. **ui-integration.ts** - UI 组件集成
7. **complete-game.ts** - 完整游戏示例

---

## 🔧 运行示例

### 方法 1: 在现有项目中运行

1. **复制示例文件到项目**
   ```bash
   # 将示例复制到 src/examples 目录
   cp examples/basic-snake-game.ts src/examples/
   ```

2. **在 HTML 中引用**
   ```html
   <div id="game-container"></div>
   <script type="module" src="/src/examples/basic-snake-game.ts"></script>
   ```

3. **运行项目**
   ```bash
   npm run dev
   ```

---

### 方法 2: 创建独立的测试页面

1. **创建 HTML 文件**
   ```html
   <!DOCTYPE html>
   <html lang="zh-CN">
   <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>贪吃蛇示例</title>
     <style>
       body {
         margin: 0;
         padding: 20px;
         display: flex;
         justify-content: center;
         background: #1a1a2e;
       }
       #game-container {
         border: 2px solid #4a4a6a;
         border-radius: 8px;
       }
     </style>
   </head>
   <body>
     <div id="game-container"></div>
     <script type="module" src="./basic-snake-game.ts"></script>
   </body>
   </html>
   ```

2. **运行 Vite 服务器**
   ```bash
   npx vite .
   ```

---

## 📖 示例详解

### 示例 1: basic-snake-game.ts

**功能**: 最基础的贪吃蛇游戏实现

**核心代码**:
```typescript
// 创建游戏逻辑
const gameLogic = new SnakeGameLogic(scene)

// 启动游戏
gameLogic.startGame()

// 监听事件
eventBus.on(GameEventType.SCORE_CHANGED, (event) => {
  console.log(`分数：${event.payload.score}`)
})
```

**学习要点**:
- 如何创建游戏实例
- 如何监听游戏事件
- 如何处理键盘输入

---

### 示例 2: custom-level.ts

**功能**: 自定义关卡配置

**核心代码**:
```typescript
const levelConfig: LevelConfig = {
  levelId: 1,
  levelName: '我的第一关',
  gridConfig: {
    rows: 20,
    cols: 20,
    cellSize: 20
  },
  objectives: [
    {
      id: 'score_goal',
      type: 'score',
      title: '获得高分',
      description: '达到 100 分',
      target: 100
    }
  ]
}
```

**学习要点**:
- 如何配置关卡参数
- 如何设置游戏目标
- 如何调整网格大小

---

### 示例 3: event-handling.ts

**功能**: 完整的事件处理示例

**核心代码**:
```typescript
const eventBus = EventBus.getInstance()

// 监听游戏开始
eventBus.on(GameEventType.GAME_START, () => {
  console.log('游戏开始！')
})

// 监听游戏结束
eventBus.on(GameEventType.GAME_OVER, (event) => {
  console.log(`游戏结束，最终分数：${event.payload.finalScore}`)
})
```

**学习要点**:
- EventBus 单例模式
- 事件类型枚举
- 事件回调处理

---

### 示例 4: custom-objectives.ts

**功能**: 自定义目标系统

**核心代码**:
```typescript
const objectives: Objective[] = [
  {
    id: 'collect_food',
    type: 'collect',
    title: '美食家',
    description: '收集 20 个食物',
    target: 20,
    current: 0,
    completed: false
  },
  {
    id: 'speed_run',
    type: 'time',
    title: '速度之王',
    description: '在 60 秒内完成',
    target: 60,
    current: 0,
    completed: false
  }
]
```

**学习要点**:
- Objective 接口定义
- 不同类型的目标
- 目标进度跟踪

---

### 示例 5: food-effects.ts

**功能**: 展示不同食物的效果

**核心代码**:
```typescript
import { FoodType, applyFoodEffect } from '../types/FoodTypes'

// 加速效果
const speedUpFood = createFood(position, FoodType.SPEED_UP)
applyFoodEffect(speedUpFood, gameState)

// 无敌效果
const invincibleFood = createFood(position, FoodType.INVINCIBLE)
applyFoodEffect(invincibleFood, gameState)
```

**学习要点**:
- 6 种食物类型
- 食物效果应用
- 效果持续时间管理

---

### 示例 6: ui-integration.ts

**功能**: UI 组件集成

**核心代码**:
```typescript
import { createApp } from 'vue'
import LevelProgressBar from '../components/ui/LevelProgressBar.vue'

// 创建进度条
const app = createApp(LevelProgressBar, {
  progress: 75,
  visible: true,
  loadingText: '加载中...'
})

app.mount('#progress-container')
```

**学习要点**:
- Vue 组件创建
- Props 传递
- 事件处理

---

### 示例 7: complete-game.ts

**功能**: 完整的游戏实现（综合所有功能）

**包含内容**:
- 完整的游戏流程
- 所有功能的综合应用
- 最佳实践示范

**学习要点**:
- 综合应用能力
- 架构设计
- 代码组织

---

## 🎯 学习路径建议

### 初学者
1. basic-snake-game.ts (基础)
2. event-handling.ts (事件)
3. custom-level.ts (关卡)
4. complete-game.ts (综合)

### 进阶开发者
1. custom-objectives.ts (目标系统)
2. food-effects.ts (食物效果)
3. ui-integration.ts (UI 集成)
4. complete-game.ts (参考实现)

---

## ❓ 常见问题

### Q1: 示例无法运行？

**A**: 确保已安装所有依赖：
```bash
npm install
```

### Q2: TypeScript 报错？

**A**: 检查 tsconfig.json 配置：
```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true
  }
}
```

### Q3: Phaser 类型找不到？

**A**: 安装 Phaser 类型定义：
```bash
npm install phaser
```

---

## 📚 相关文档

- 📖 [QUICK_START.md](../QUICK_START.md) - 快速开始指南
- 📖 [API_REFERENCE.md](../API_REFERENCE.md) - API 参考文档
- 📖 [LEARNING_PATH.md](../LEARNING_PATH.md) - 学习路线图

---

**最后更新**: 2026-04-05  
**维护者**: GCRS 开发团队  
**版本**: v1.3.0-dev
