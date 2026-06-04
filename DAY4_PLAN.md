# 📅 GCRS 关卡系统 - Day 4 工作计划

**周次**: 2026-W14  
**日期**: 2026-04-02  
**阶段**: Phase 3 - UI 组件实现  
**状态**: 🔄 准备开始

---

## 📊 今日目标

### 总体目标

```
完成率：45% → 55% (+10%)
任务完成：5/11 → 6/11
```

### 今日任务清单

```
⏳ Task 3.1: 加载进度条 (上午)
⏳ Task 3.2: 目标显示列表 (下午)
⏳ 文档更新 (晚上)
```

---

## 🎯 Task 3.1: 加载进度条

### 时间安排
**上午 (9:00 - 12:00)** - 3 小时

---

### 功能需求

#### 基础功能
```
✅ 显示当前加载进度（0-100%）
✅ 平滑的进度条动画
✅ 百分比数字显示
✅ 加载完成提示
```

#### 增强功能
```
✅ 渐变色进度条
✅ 呼吸灯效果
✅ 加载提示文字
✅ 完成后自动淡出
```

---

### 技术设计

#### 组件结构

**文件**: `src/components/ui/LevelProgressBar.vue`

```vue
<template>
  <div class="progress-container" v-if="visible">
    <!-- 进度条背景 -->
    <div class="progress-bar-bg">
      <!-- 进度条填充 -->
      <div 
        class="progress-bar-fill"
        :style="{ width: progress + '%' }"
      >
        <!-- 渐变效果 -->
        <div class="progress-gradient"></div>
        
        <!-- 呼吸灯效果 -->
        <div class="progress-breath"></div>
      </div>
      
      <!-- 百分比显示 -->
      <div class="progress-text">{{ Math.round(progress) }}%</div>
    </div>
    
    <!-- 加载提示 -->
    <div class="loading-hint">
      {{ loadingText }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue'

export default defineComponent({
  name: 'LevelProgressBar',
  
  props: {
    // 当前进度（0-100）
    progress: {
      type: Number,
      default: 0,
      validator: (value: number) => value >= 0 && value <= 100
    },
    
    // 是否可见
    visible: {
      type: Boolean,
      default: true
    },
    
    // 加载提示文字
    loadingText: {
      type: String,
      default: '正在加载关卡...'
    },
    
    // 加载完成后自动隐藏延迟（毫秒）
    autoHideDelay: {
      type: Number,
      default: 500
    }
  },
  
  setup(props, { emit }) {
    const internalProgress = ref(0)
    
    // 监听进度变化
    watch(() => props.progress, (newProgress) => {
      internalProgress.value = newProgress
      
      // 进度达到 100% 时自动隐藏
      if (newProgress >= 100) {
        setTimeout(() => {
          emit('update:visible', false)
          emit('complete')
        }, props.autoHideDelay)
      }
    })
    
    return {
      internalProgress
    }
  }
})
</script>

<style scoped>
.progress-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  width: 400px;
}

.progress-bar-bg {
  position: relative;
  width: 100%;
  height: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.progress-bar-fill {
  position: relative;
  height: 100%;
  transition: width 0.3s ease-out;
  background: linear-gradient(
    90deg,
    #4CAF50,
    #8BC34A,
    #CDDC39
  );
  border-radius: 10px;
  overflow: hidden;
}

.progress-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.2) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.2) 75%,
    transparent 75%,
    transparent
  );
  background-size: 20px 20px;
  animation: gradient-move 1s linear infinite;
}

.progress-breath {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.4) 0%,
    transparent 70%
  );
  animation: breath 2s ease-in-out infinite;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  font-size: 14px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.loading-hint {
  margin-top: 10px;
  text-align: center;
  color: white;
  font-size: 16px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

@keyframes gradient-move {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 20px 20px;
  }
}

@keyframes breath {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}
</style>
```

---

### 使用示例

```typescript
// 在 LevelComponentGameScene 中使用
import LevelProgressBar from '../components/ui/LevelProgressBar.vue'

// 创建进度条
const progressBar = h(LevelProgressBar, {
  progress: this.loadProgress,
  visible: this.showProgressBar,
  loadingText: '正在加载关卡资源...',
  autoHideDelay: 500,
  onUpdateVisible: (visible: boolean) => {
    this.showProgressBar = visible
  },
  onComplete: () => {
    console.log('✅ 加载完成！')
  }
})

// 监听加载进度
this.eventBus.on(GameEventType.LOAD_PROGRESS, (event) => {
  this.loadProgress = event.payload.progress
})

// 加载完成后隐藏
this.eventBus.on(GameEventType.LEVEL_LOADED, () => {
  setTimeout(() => {
    this.showProgressBar = false
  }, 500)
})
```

---

### 测试要点

```typescript
describe('LevelProgressBar 测试', () => {
  it('应该正确显示进度百分比', () => {
    const wrapper = mount(LevelProgressBar, {
      props: { progress: 50 }
    })
    
    expect(wrapper.text()).toContain('50%')
  })
  
  it('应该在进度达到 100% 后自动隐藏', async () => {
    const wrapper = mount(LevelProgressBar, {
      props: { 
        progress: 0,
        autoHideDelay: 100
      }
    })
    
    await wrapper.setProps({ progress: 100 })
    
    await new Promise(resolve => setTimeout(resolve, 150))
    
    expect(wrapper.emitted('complete')).toBeDefined()
  })
  
  it('应该支持自定义加载提示文字', () => {
    const wrapper = mount(LevelProgressBar, {
      props: { loadingText: '加载中...' }
    })
    
    expect(wrapper.text()).toContain('加载中...')
  })
})
```

---

## 🎯 Task 3.2: 目标显示列表

### 时间安排
**下午 (14:00 - 17:00)** - 3 小时

---

### 功能需求

#### 基础功能
```
✅ 显示关卡目标列表
✅ 标记已完成的目标
✅ 动态更新目标状态
✅ 支持多个目标同时显示
```

#### 增强功能
```
✅ 目标完成动画
✅ 图标区分不同类型目标
✅ 进度显示（例如：收集 5/10 个食物）
✅ 完成音效提示
```

---

### 技术设计

#### 组件结构

**文件**: `src/components/ui/ObjectiveList.vue`

```vue
<template>
  <div class="objective-list" v-if="objectives.length > 0">
    <div 
      v-for="(objective, index) in objectives" 
      :key="objective.id"
      class="objective-item"
      :class="{ completed: objective.completed }"
    >
      <!-- 目标图标 -->
      <div class="objective-icon">
        <span v-if="getIcon(objective.type)">{{ getIcon(objective.type) }}</span>
      </div>
      
      <!-- 目标描述 -->
      <div class="objective-content">
        <div class="objective-title">{{ objective.title }}</div>
        <div class="objective-description">
          {{ objective.description }}
          
          <!-- 进度显示 -->
          <span v-if="objective.current !== undefined && objective.target !== undefined">
            ({{ objective.current }}/{{ objective.target }})
          </span>
        </div>
        
        <!-- 进度条（如果有进度信息） -->
        <div 
          v-if="objective.current !== undefined && objective.target !== undefined"
          class="objective-progress"
        >
          <div 
            class="objective-progress-bar"
            :style="{ width: getProgressPercent(objective) + '%' }"
          ></div>
        </div>
      </div>
      
      <!-- 完成标记 -->
      <div class="objective-check">
        <span v-if="objective.completed">✓</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Objective } from '../types/level-types'

export default defineComponent({
  name: 'ObjectiveList',
  
  props: {
    objectives: {
      type: Array as PropType<Objective[]>,
      default: () => []
    }
  },
  
  setup() {
    const getIcon = (type: string): string => {
      const icons: Record<string, string> = {
        collect: '🍎',      // 收集类目标
        score: '⭐',        // 分数类目标
        time: '⏱️',        // 时间类目标
        survival: '🛡️',    // 生存类目标
        length: '🐍'       // 长度类目标
      }
      return icons[type] || '🎯'
    }
    
    const getProgressPercent = (objective: Objective): number => {
      if (objective.current === undefined || objective.target === undefined) {
        return 0
      }
      return Math.min(100, (objective.current / objective.target) * 100)
    }
    
    return {
      getIcon,
      getProgressPercent
    }
  }
})
</script>

<style scoped>
.objective-list {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 100;
}

.objective-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  min-width: 280px;
}

.objective-item.completed {
  background: rgba(200, 255, 200, 0.95);
  transform: translateX(-10px);
}

.objective-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
}

.objective-content {
  flex: 1;
}

.objective-title {
  font-weight: bold;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.objective-description {
  font-size: 12px;
  color: #666;
}

.objective-progress {
  position: relative;
  height: 4px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
}

.objective-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s ease;
}

.objective-check {
  font-size: 20px;
  color: #4CAF50;
  opacity: 0;
  transform: scale(0);
  transition: all 0.3s ease;
}

.objective-item.completed .objective-check {
  opacity: 1;
  transform: scale(1);
}
</style>
```

---

### 使用示例

```typescript
// 在 SnakeGameLogic 中管理目标
class SnakeGameLogic {
  private objectives: Objective[] = [
    {
      id: 'collect_food',
      type: 'collect',
      title: '收集食物',
      description: '收集 10 个食物',
      target: 10,
      current: 0,
      completed: false
    },
    {
      id: 'reach_score',
      type: 'score',
      title: '获得高分',
      description: '达到 100 分',
      target: 100,
      current: 0,
      completed: false
    }
  ]
  
  // 更新目标进度
  public updateObjective(objectiveId: string, currentValue: number): void {
    const objective = this.objectives.find(o => o.id === objectiveId)
    if (objective) {
      objective.current = currentValue
      
      // 检查是否完成
      if (currentValue >= objective.target!) {
        objective.completed = true
        this.emitObjectiveComplete(objective)
      }
      
      // 通知 UI 更新
      this.eventBus.emit({
        type: GameEventType.OBJECTIVE_UPDATED,
        payload: { objectives: this.objectives }
      })
    }
  }
}
```

---

### 测试要点

```typescript
describe('ObjectiveList 测试', () => {
  it('应该正确显示目标列表', () => {
    const objectives = [
      {
        id: 'test',
        type: 'collect',
        title: '测试目标',
        description: '收集物品',
        target: 10,
        current: 5,
        completed: false
      }
    ]
    
    const wrapper = mount(ObjectiveList, {
      props: { objectives }
    })
    
    expect(wrapper.text()).toContain('测试目标')
    expect(wrapper.text()).toContain('(5/10)')
  })
  
  it('应该标记已完成的目标', async () => {
    const objectives = [
      {
        id: 'test',
        type: 'collect',
        title: '测试目标',
        description: '收集物品',
        target: 10,
        current: 10,
        completed: true
      }
    ]
    
    const wrapper = mount(ObjectiveList, {
      props: { objectives }
    })
    
    expect(wrapper.classes()).toContain('completed')
  })
})
```

---

## 📝 晚上工作 (19:00 - 21:00)

### 任务清单

```
✅ 编写使用文档
✅ 创建示例代码
✅ 更新进度报告
✅ 准备 Day 5 任务
```

---

### 产出物

**文档**:
- `DAY4_PROGRESS_REPORT.md` - Day 4 进度报告
- `UI_COMPONENT_GUIDE.md` - UI 组件使用指南

**示例**:
- `examples/progress-bar-example.ts` - 进度条示例
- `examples/objective-list-example.ts` - 目标列表示例

---

## 🎯 成功标准

### 功能完整性

```
✅ 进度条能正确显示加载进度
✅ 目标列表能显示和更新
✅ 动画效果流畅自然
✅ 事件通知正常
```

---

### 代码质量

```
✅ TypeScript 编译通过
✅ 无 ESLint 警告
✅ 注释覆盖率 > 80%
✅ 单元测试通过
```

---

### 性能指标

```
✅ 渲染帧率 > 60 FPS
✅ 内存占用 < 100MB
✅ 无明显卡顿
```

---

## 🚨 风险管理

### 技术风险

1. **Vue 3 Composition API 使用问题**
   - 概率：低
   - 影响：低
   - 应对：参考官方文档和现有组件

2. **与 Phaser 渲染冲突**
   - 概率：中
   - 影响：中
   - 应对：使用合适的 z-index 层级

3. **性能问题**
   - 概率：低
   - 影响：中
   - 应对：使用虚拟 DOM，优化动画

---

## 📞 支持和反馈

### 获取帮助

- 📚 **查看文档**: `/docs/` 目录
- 💬 **技术讨论**: 游戏开发交流群
- 📧 **邮件联系**: dev@kidsgame.com
- 🐛 **提交 Issue**: GitHub Issues

---

## 🎊 总结

### Day 4 目标

✅ **完成 UI 组件基础**
- LevelProgressBar.vue
- ObjectiveList.vue

✅ **保证代码质量**
- 完整的类型定义
- 清晰的注释
- 详细的文档

✅ **为后续开发打下基础**
- 可复用的 UI 组件
- 统一的样式规范
- 良好的架构设计

**准备好了吗？让我们开始 Day 4 的工作！** 🚀

---

**最后更新**: 2026-04-02  
**状态**: 🔄 准备开始  
**下次更新**: 2026-04-02 晚上 (Day 4 完成总结)
