# 🐍 贪吃蛇关卡系统实现指南

## 📋 目录

1. [架构概述](#架构概述)
2. [核心组件](#核心组件)
3. [使用示例](#使用示例)
4. [配置文件说明](#配置文件说明)
5. [最佳实践](#最佳实践)

---

## 🏗️ 架构概述

### 分层设计

```
┌─────────────────────────────────────┐
│  Framework Layer (框架层)           │
│  - kids-game-frame-factory          │
│  - ILevelConfig 统一接口            │
│  - LevelOrchestrator 流程控制       │
└─────────────────────────────────────┘
              ↓ 继承/扩展
┌─────────────────────────────────────┐
│  Game Layer (游戏层)                │
│  - SnakeLevelConfig 特定配置        │
│  - SnakeLevelOrchestrator 编排器    │
│  - SnakeLevelLoader 加载器          │
└─────────────────────────────────────┘
              ↓ 具体实现
┌─────────────────────────────────────┐
│  Instance Layer (实例层)            │
│  - snake_level_1.json 第 1 关配置     │
│  - snake_level_2.json 第 2 关配置     │
│  - ...                              │
└─────────────────────────────────────┘
```

---

## 🎯 核心组件

### 1. 类型定义 (`src/types/snake-level.types.ts`)

```typescript
import { ILevelConfig } from 'kids-game-frame-factory'

// 贪吃蛇特定参数
export interface SnakeLevelParams {
  gridSize: number          // 网格大小
  speed: number             // 蛇移动速度
  obstacleCount: number     // 障碍物数量
  foodScore: number         // 食物分数
  // ... 更多参数
}

// 贪吃蛇关卡配置
export type SnakeLevelConfig = ILevelConfig<SnakeLevelParams>
```

### 2. 关卡编排器 (`src/core/SnakeLevelOrchestrator.ts`)

```typescript
export class SnakeLevelOrchestrator extends LevelOrchestrator {
  
  // 重写配置解析器
  protected createConfigParser(): IConfigParser {
    return new SnakeConfigParser(this.scene)
  }
  
  // 重写关卡生成器
  protected createLevelSpawner(): ILevelSpawner {
    return new SnakeLevelSpawner(this.scene)
  }
}
```

### 3. 配置加载器 (`src/utils/SnakeLevelLoader.ts`)

```typescript
export class SnakeLevelLoader {
  // 从 JSON 文件加载
  static async loadFromJSON(levelId: string): Promise<SnakeLevelConfig>
  
  // 批量加载
  static async loadMultiple(levelIds: string[]): Promise<SnakeLevelConfig[]>
}
```

---

## 🚀 使用示例

### 场景 1: 在 Phaser 场景中使用

```typescript
import { ComponentGameScene } from './scenes/ComponentGameScene'
import { SnakeLevelOrchestrator } from './core/SnakeLevelOrchestrator'
import { SnakeLevelLoader } from './utils/SnakeLevelLoader'

export class SnakeGameScene extends ComponentGameScene {
  private orchestrator: SnakeLevelOrchestrator
  
  async create() {
    super.create()
    
    // 1. 加载关卡配置
    const levelConfig = await SnakeLevelLoader.loadFromJSON('snake_level_1')
    
    // 2. 创建编排器
    this.orchestrator = new SnakeLevelOrchestrator(this)
    
    // 3. 设置进度回调（显示加载界面）
    this.orchestrator.onProgress((event) => {
      console.log(
        `[${event.phase}] ${event.message} (${Math.round(event.progress * 100)}%)`
      )
      
      // 更新 UI 进度条
      this.updateProgressBar(event.progress, event.message)
    })
    
    // 4. 运行关卡（自动执行 6 个阶段）
    try {
      const result = await this.orchestrator.runLevel(levelConfig)
      
      // 5. 显示结算界面
      if (result.success) {
        this.showVictoryScreen(result)
      } else {
        this.showDefeatScreen(result)
      }
      
    } catch (error) {
      console.error('关卡运行失败:', error)
      this.showError(error.message)
    }
  }
  
  private updateProgressBar(progress: number, message: string): void {
    // TODO: 更新加载 UI
  }
  
  private showVictoryScreen(result: any): void {
    // TODO: 显示胜利界面
    console.log('🎉 通关！星级:', result.stars, '分数:', result.score)
  }
}
```

### 场景 2: 在 Vue 组件中调用

```vue
<template>
  <div class="game-container">
    <!-- 加载进度 -->
    <div v-if="loading" class="loading-overlay">
      <div class="progress-bar">
        <div :style="{ width: progress + '%' }"></div>
      </div>
      <p>{{ loadingMessage }}</p>
    </div>
    
    <!-- 游戏画布 -->
    <canvas ref="gameCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { SnakeLevelLoader } from '@/utils/SnakeLevelLoader'

const loading = ref(true)
const progress = ref(0)
const loadingMessage = ref('加载中...')

onMounted(async () => {
  try {
    // 加载第 1 关
    const config = await SnakeLevelLoader.loadFromJSON('snake_level_1')
    
    // 启动游戏
    startGame(config)
    
  } catch (error) {
    console.error('加载失败:', error)
  } finally {
    loading.value = false
  }
})

function startGame(config: any) {
  // 初始化 Phaser 游戏
  // ...
}
</script>
```

---

## 📄 配置文件说明

### snake_level_1.json 结构

```json
{
  "info": {
    "id": "snake_level_1",
    "name": "初出茅庐",
    "difficulty": "easy"
  },
  
  "objectives": [
    {
      "id": "obj_score",
      "type": "score",
      "description": "达到 500 分",
      "targetValue": 500
    }
  ],
  
  "params": {
    "gridSize": 20,
    "speed": 120,
    "obstacleCount": 0
  },
  
  "resources": {
    "backgrounds": ["bg_forest"],
    "sprites": ["snake_head", "apple"]
  }
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `info` | Object | ✅ | 关卡基本信息 |
| `info.id` | String | ✅ | 关卡唯一标识 |
| `info.name` | String | ✅ | 关卡显示名称 |
| `info.difficulty` | String | ✅ | 难度等级 |
| `objectives` | Array | ✅ | 目标列表 |
| `params` | Object | ✅ | 游戏参数 |
| `resources` | Object | ⚠️ | 资源配置 |
| `victoryCondition` | Object | ✅ | 胜利条件 |
| `timeLimit` | Number | ⚠️ | 时间限制（秒） |

---

## 🎨 最佳实践

### 1. 关卡设计原则

✅ **难度曲线平滑**
```json
// 第 1 关：教学关
{ "speed": 120, "obstacleCount": 0 }

// 第 2 关：引入障碍
{ "speed": 130, "obstacleCount": 2 }

// 第 3 关：提高速度
{ "speed": 140, "obstacleCount": 3 }
```

❌ **难度跳跃过大**
```json
// 不推荐：从 0 障碍直接到 10 障碍
{ "speed": 200, "obstacleCount": 10 }
```

### 2. 资源配置优化

✅ **按关卡差异化加载**
```json
// 第 1 关：森林主题
"resources": {
  "backgrounds": ["bg_forest"],
  "musicTracks": ["forest_bgm"]
}

// 第 2 关：沙漠主题
"resources": {
  "backgrounds": ["bg_desert"],
  "musicTracks": ["desert_adventure"]
}
```

### 3. 目标设计多样性

```json
"objectives": [
  {
    "type": "score",
    "description": "达到 500 分"
  },
  {
    "type": "collect_food",
    "description": "收集 10 个食物"
  },
  {
    "type": "survive_time",
    "description": "存活 180 秒"
  }
]
```

### 4. 性能优化

- ✅ 使用资源缓存，避免重复加载
- ✅ 异步加载配置，阻塞主线程
- ✅ 合理设置时间限制，防止无限游戏

---

## 🔧 开发调试

### 查看日志

```typescript
// 开启详细日志
localStorage.setItem('SNAKE_DEBUG', 'true')

// 控制台输出示例：
// 🎮 [LevelOrchestrator] 开始运行关卡：初出茅庐
// ✅ [阶段 1] 解锁验证通过
// 📦 [ResourceLoader] 待加载资源：8 个
// ✅ [阶段 2] 资源加载完成：8 个
// 🐍 [SnakeConfigParser] 开始解析配置
// ✅ [阶段 4] 关卡生成完成
```

### 测试工具

```typescript
// 快速测试所有关卡
const levels = ['snake_level_1', 'snake_level_2', 'snake_level_3']
for (const levelId of levels) {
  const config = await SnakeLevelLoader.loadFromJSON(levelId)
  console.log(`✅ ${config.info.name}: 难度=${config.info.difficulty}`)
}
```

---

## 📊 数据流转

```
玩家点击关卡
    ↓
SnakeLevelLoader.loadFromJSON()
    ↓
返回 SnakeLevelConfig
    ↓
SnakeLevelOrchestrator.runLevel()
    ↓
[阶段 1] 解锁验证
[阶段 2] 资源加载
[阶段 3] 配置解析
[阶段 4] 关卡生成
[阶段 5] 关卡运行
[阶段 6] 关卡结算
    ↓
返回 ILevelResult
    ↓
显示结算界面
```

---

## 🎯 下一步计划

1. ✅ 完成框架层核心组件
2. ✅ 创建贪吃蛇类型定义
3. ✅ 实现配置加载器
4. ⏳ 实现关卡编排器（TODO: 完成 Phaser 集成）
5. ⏳ 创建 JSON 配置文件（TODO: 20 个关卡）
6. ⏳ 集成到现有游戏（TODO: 替换旧关卡系统）

---

## 📚 相关文档

- [GCRS 规范文档](./GCRS_SPEC.md)
- [框架层 API](../../kids-game-frame-factory/README.md)
- [Phaser 集成指南](./PHASER_INTEGRATION.md)
