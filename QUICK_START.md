# 🚀 关卡系统快速开始指南

**5 分钟上手贪吃蛇新关卡系统**

---

## ⚡ 快速开始（3 步搞定）

### 步骤 1: 准备环境（1 分钟）

确保你已经安装了必要的依赖：

```bash
# 进入项目根目录
cd kids-game-house/games/snake

# 安装依赖（如果需要）
npm install
```

---

### 步骤 2: 创建你的第一个关卡配置（2 分钟）

在 `config/levels/` 目录下创建文件 `my_first_level.json`:

```json
{
  "info": {
    "id": "my_level_1",
    "name": "我的第一关",
    "description": "欢迎来到贪吃蛇新世界！",
    "difficulty": "easy"
  },
  
  "objectives": [
    {
      "id": "obj_1",
      "type": "score",
      "description": "达到 300 分",
      "targetValue": 300
    }
  ],
  
  "params": {
    "gridSize": 20,
    "initialLength": 3,
    "speed": 100,
    "obstacleCount": 0,
    "foodScore": 10,
    "bonusScore": 20
  },
  
  "victoryCondition": {
    "type": "all_objectives"
  },
  
  "timeLimit": 180,
  
  "starCriteria": [
    {"stars": 1, "scoreThreshold": 300},
    {"stars": 2, "scoreThreshold": 500},
    {"stars": 3, "scoreThreshold": 700}
  ]
}
```

**修改参数试试**:
- 把 `speed` 改成 150（更快）
- 把 `obstacleCount` 改成 5（增加障碍）
- 把 `targetValue` 改成 1000（更高目标）

---

### 步骤 3: 在游戏中加载（2 分钟）

在你的游戏场景中添加代码：

```typescript
// 在 SnakeGameScene.ts 中
import { SnakeLevelLoader } from '@/utils/SnakeLevelLoader'
import { SnakeLevelOrchestrator } from '@/core/SnakeLevelOrchestrator'

export class SnakeGameScene extends Phaser.Scene {
  private orchestrator: SnakeLevelOrchestrator
  
  async create() {
    // 加载你刚创建的关卡配置
    const levelConfig = await SnakeLevelLoader.loadFromJSON('my_first_level')
    
    // 创建编排器
    this.orchestrator = new SnakeLevelOrchestrator(this)
    
    // 监听进度
    this.orchestrator.onProgress((event) => {
      console.log(
        `[${event.phase}] ${event.message}`,
        `${Math.round(event.progress * 100)}%`
      )
    })
    
    // 运行关卡
    try {
      const result = await this.orchestrator.runLevel(levelConfig)
      
      if (result.success) {
        console.log('🎉 通关成功!')
        console.log('星级:', result.stars)
        console.log('分数:', result.score)
      } else {
        console.log('😢 挑战失败')
      }
      
    } catch (error) {
      console.error('游戏出错:', error)
    }
  }
}
```

---

## 🎮 运行游戏

```bash
# 启动开发服务器
npm run dev

# 打开浏览器访问
# http://localhost:5173
```

看到控制台输出类似内容表示成功：

```
📖 [LevelLoader] 加载关卡配置：my_first_level
🎮 [LevelOrchestrator] 开始运行关卡：我的第一关
✅ [阶段 1] 解锁验证通过
📦 [ResourceLoader] 待加载资源：4 个
✅ [阶段 2] 资源加载完成：4 个
🐍 [SnakeConfigParser] 开始解析配置
✅ [阶段 4] 关卡生成完成
🎉 通关成功!
星级：3
分数：750
```

---

## 🔧 常见问题

### Q1: 找不到模块错误？

**A**: 确保导入路径正确：
```typescript
// ❌ 错误
import { xxx } from 'kids-game-frame-factory'

// ✅ 正确
import { xxx } from '../../../kids-game-frame-factory/src/index'
```

或者在 `tsconfig.json` 中配置路径映射：
```json
{
  "compilerOptions": {
    "paths": {
      "kids-game-frame-factory": ["../../kids-game-frame-factory/src/index"]
    }
  }
}
```

### Q2: 资源配置不生效？

**A**: 检查资源文件是否存在：
```bash
# 确认这些文件存在
ls public/assets/images/bg_forest.png
ls public/assets/audio/forest_bgm.mp3
```

如果资源不存在，可以先从配置中移除：
```json
{
  "resources": {}  // 留空或省略
}
```

### Q3: 如何调试？

**A**: 开启调试模式：
```typescript
// 在 main.ts 中添加
if (process.env.NODE_ENV === 'development') {
  localStorage.setItem('SNAKE_DEBUG', 'true')
}
```

然后查看浏览器控制台的详细日志。

---

## 📚 进阶学习

### 推荐学习路径

1. **阅读完整文档**
   - [LEVEL_SYSTEM_IMPLEMENTATION.md](./docs/LEVEL_SYSTEM_IMPLEMENTATION.md)
   - 了解架构设计和最佳实践

2. **研究示例配置**
   - [snake_level_1.json](./config/levels/snake_level_1.json)
   - 学习完整的配置结构

3. **查看框架源码**
   - [LevelOrchestrator.ts](../../kids-game-frame-factory/src/core/LevelOrchestrator.ts)
   - 理解 6 个阶段的实现

4. **尝试扩展**
   - 添加新的目标类型
   - 设计特殊的障碍物
   - 创建独特的胜利条件

---

## 🎯 下一步

### 今天就可以完成

- ✅ 创建 3 个不同的关卡配置
- ✅ 调整难度参数测试效果
- ✅ 添加不同的目标类型

### 本周可以完成

- ✅ 实现完整的 UI 界面
- ✅ 集成到现有游戏中
- ✅ 编写单元测试

---

## 💬 获取帮助

遇到问题？

- 📖 查看 [完整文档](./docs/LEVEL_SYSTEM_IMPLEMENTATION.md)
- 💬 加入讨论群
- 📧 发送邮件至 dev@kidsgame.com

---

**祝你开发愉快！** 🎉
