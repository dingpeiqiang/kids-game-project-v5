<template>
  <div 
    v-if="visible"
    class="performance-monitor fixed top-2 right-2 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-[9999] select-none pointer-events-none backdrop-blur-sm"
    :class="sizeClass"
  >
    <!-- FPS 显示 -->
    <div class="fps-row flex items-center gap-2 mb-2">
      <span class="label opacity-70">FPS</span>
      <span 
        class="value font-bold text-base"
        :class="fpsColor"
      >
        {{ metrics.fps }}
      </span>
      <span class="unit opacity-50">Hz</span>
    </div>
    
    <!-- 帧时间 -->
    <div class="frametime-row flex items-center gap-2 mb-2">
      <span class="label opacity-70 w-12">Frame</span>
      <span class="value">{{ metrics.frameTime.toFixed(1) }}</span>
      <span class="unit opacity-50">ms</span>
    </div>
    
    <!-- 内存使用 -->
    <div class="memory-row flex items-center gap-2 mb-2">
      <span class="label opacity-70 w-12">Memory</span>
      <span class="value">{{ metrics.memoryUsage.toFixed(1) }}</span>
      <span class="unit opacity-50">MB</span>
    </div>
    
    <!-- 渲染时间 -->
    <div class="render-row flex items-center gap-2 mb-2" v-if="showAdvanced">
      <span class="label opacity-70 w-12">Render</span>
      <span class="value">{{ metrics.renderTime.toFixed(1) }}</span>
      <span class="unit opacity-50">ms</span>
    </div>
    
    <!-- 更新时间 -->
    <div class="update-row flex items-center gap-2" v-if="showAdvanced">
      <span class="label opacity-70 w-12">Update</span>
      <span class="value">{{ metrics.updateTime.toFixed(1) }}</span>
      <span class="unit opacity-50">ms</span>
    </div>
    
    <!-- 性能警告 -->
    <div 
      v-if="issues.length > 0"
      class="issues mt-2 pt-2 border-t border-red-500/30"
    >
      <div 
        v-for="(issue, index) in issues" 
        :key="index"
        class="issue text-red-400 text-xs mb-1"
      >
        ⚠️ {{ issue }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { PerformanceMonitor, type PerformanceMetrics } from '../utils/PerformanceMonitor'

interface Props {
  visible?: boolean
  showAdvanced?: boolean
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  showAdvanced: false,
  size: 'medium'
})

// 性能监控器
const monitor = PerformanceMonitor.getInstance()

// 响应式数据
const metrics = ref<PerformanceMetrics>({
  fps: 0,
  frameTime: 0,
  memoryUsage: 0,
  renderTime: 0,
  updateTime: 0,
  objectCount: 0
})

const issues = ref<string[]>([])

// 尺寸类
const sizeClass = computed(() => {
  switch (props.size) {
    case 'small':
      return 'text-xs min-w-[120px]'
    case 'medium':
      return 'text-sm min-w-[150px]'
    case 'large':
      return 'text-base min-w-[180px]'
    default:
      return 'text-sm min-w-[150px]'
  }
})

// FPS 颜色（根据性能）
const fpsColor = computed(() => {
  if (metrics.value.fps >= 55) return 'text-green-400'
  if (metrics.value.fps >= 30) return 'text-yellow-400'
  return 'text-red-400'
})

// 更新指标
let unsubscribe: (() => void) | null = null

onMounted(() => {
  // 订阅性能更新
  unsubscribe = monitor.onMetricsUpdate((newMetrics) => {
    metrics.value = newMetrics
    
    // 检查性能问题
    const detectedIssues = monitor.checkPerformanceIssues()
    issues.value = detectedIssues
  })
  
  // 启动监控循环
  startMonitoringLoop()
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
  stopMonitoringLoop()
})

// 监控循环
let animationId: number | null = null

const startMonitoringLoop = () => {
  const loop = () => {
    monitor.beginFrame()
    animationId = requestAnimationFrame(loop)
    monitor.endFrame()
  }
  loop()
}

const stopMonitoringLoop = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

// 手动打印报告的方法
const printReport = () => {
  monitor.printReport()
}

defineExpose({
  printReport
})
</script>

<style scoped>
.performance-monitor {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.label {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.value {
  tabular-nums: true;
  font-feature-settings: 'tnum';
}

/* 动画效果 */
@keyframes pulse-warning {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.issue {
  animation: pulse-warning 2s infinite;
}
</style>
