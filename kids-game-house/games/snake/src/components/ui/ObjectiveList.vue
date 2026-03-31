<!-- ============================================================================
     🎯 关卡目标显示列表组件
     ============================================================================
     
     📌 说明:
       显示当前关卡的所有目标
       实时更新目标完成状态
       提供完成动画和视觉反馈
     ============================================================================ -->

<template>
  <div class="objective-list" v-if="objectives.length > 0">
    <!-- 单个目标 -->
    <div 
      v-for="(objective, index) in objectives" 
      :key="objective.id"
      class="objective-item"
      :class="{ completed: objective.completed }"
      :style="{ animationDelay: index * 0.1 + 's' }"
    >
      <!-- 目标图标 -->
      <div class="objective-icon">
        <span v-if="getIcon(objective.type)">{{ getIcon(objective.type) }}</span>
      </div>
      
      <!-- 目标内容 -->
      <div class="objective-content">
        <!-- 目标标题 -->
        <div class="objective-title">{{ objective.title }}</div>
        
        <!-- 目标描述 -->
        <div class="objective-description">
          {{ objective.description }}
          
          <!-- 进度显示（如果有） -->
          <span 
            v-if="hasProgress(objective)"
            class="objective-progress-text"
          >
            ({{ objective.current }}/{{ objective.target }})
          </span>
        </div>
        
        <!-- 进度条（如果有进度信息） -->
        <div 
          v-if="hasProgress(objective)"
          class="objective-progress-bar-container"
        >
          <div 
            class="objective-progress-bar-fill"
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
import type { Objective } from '../types/level-types'

/**
 * 🎯 关卡目标显示列表组件
 * 
 * @remarks
 * 用于显示和管理关卡目标的 UI 展示
 * 支持多种目标类型（收集、分数、时间等）
 * 自动根据目标类型显示不同的图标
 * 提供完成动画效果
 */
export default defineComponent({
  name: 'ObjectiveList',
  
  props: {
    /**
     * 目标列表
     */
    objectives: {
      type: Array as PropType<Objective[]>,
      default: () => []
    }
  },
  
  setup() {
    /**
     * 根据目标类型获取对应图标
     * 
     * @param type - 目标类型
     * @returns Emoji 图标
     */
    const getIcon = (type: string): string => {
      const icons: Record<string, string> = {
        collect: '🍎',      // 收集类目标
        score: '⭐',        // 分数类目标
        time: '⏱️',        // 时间类目标
        survival: '🛡️',    // 生存类目标
        length: '🐍',      // 长度类目标
        avoid: '⚠️',       // 躲避类目标
        combo: '🔥'        // 连击类目标
      }
      return icons[type] || '🎯'
    }
    
    /**
     * 判断目标是否有进度信息
     * 
     * @param objective - 目标对象
     * @returns 是否有进度
     */
    const hasProgress = (objective: Objective): boolean => {
      return objective.current !== undefined && 
             objective.target !== undefined &&
             typeof objective.current === 'number' &&
             typeof objective.target === 'number'
    }
    
    /**
     * 计算进度百分比
     * 
     * @param objective - 目标对象
     * @returns 进度百分比（0-100）
     */
    const getProgressPercent = (objective: Objective): number => {
      if (!hasProgress(objective)) {
        return 0
      }
      return Math.min(100, (objective.current / objective.target) * 100)
    }
    
    return {
      getIcon,
      hasProgress,
      getProgressPercent
    }
  }
})
</script>

<style scoped>
/* ========== 列表容器 ========== */
.objective-list {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 100;
  max-width: 350px;
}

/* ========== 单个目标项 ========== */
.objective-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 280px;
  animation: slide-in 0.3s ease-out backwards;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ========== 已完成状态 ========== */
.objective-item.completed {
  background: rgba(200, 255, 200, 0.95);
  transform: translateX(-10px);
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);
}

/* ========== 目标图标 ========== */
.objective-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  flex-shrink: 0;
}

/* ========== 目标内容区域 ========== */
.objective-content {
  flex: 1;
  min-width: 0; /* 允许文字截断 */
}

/* ========== 目标标题 ========== */
.objective-title {
  font-weight: bold;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ========== 目标描述 ========== */
.objective-description {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.objective-progress-text {
  font-weight: bold;
  color: #4CAF50;
  font-size: 11px;
}

/* ========== 进度条容器 ========== */
.objective-progress-bar-container {
  position: relative;
  height: 4px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
}

/* ========== 进度条填充 ========== */
.objective-progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s ease;
  border-radius: 2px;
}

/* ========== 完成标记 ========== */
.objective-check {
  font-size: 20px;
  color: #4CAF50;
  opacity: 0;
  transform: scale(0);
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  flex-shrink: 0;
}

.objective-item.completed .objective-check {
  opacity: 1;
  transform: scale(1);
}

/* ========== 响应式设计 ========== */
@media (max-width: 768px) {
  .objective-list {
    top: auto;
    bottom: 20px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
  
  .objective-item {
    min-width: 0;
  }
}
</style>
