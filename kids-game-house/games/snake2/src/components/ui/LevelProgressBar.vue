<!-- ============================================================================
     🎮 关卡加载进度条组件
     ============================================================================
     
     📌 说明:
       显示关卡加载进度
       提供平滑的动画效果和视觉反馈
     ============================================================================ -->

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

/**
 * 🎯 关卡加载进度条组件
 * 
 * @remarks
 * 用于显示关卡加载过程中的进度
 * 支持渐变色、呼吸灯动画效果
 * 加载完成后自动淡出
 */
export default defineComponent({
  name: 'LevelProgressBar',
  
  props: {
    /**
     * 当前进度（0-100）
     */
    progress: {
      type: Number,
      default: 0,
      validator: (value: number) => value >= 0 && value <= 100
    },
    
    /**
     * 是否可见
     */
    visible: {
      type: Boolean,
      default: true
    },
    
    /**
     * 加载提示文字
     */
    loadingText: {
      type: String,
      default: '正在加载关卡...'
    },
    
    /**
     * 加载完成后自动隐藏延迟（毫秒）
     */
    autoHideDelay: {
      type: Number,
      default: 500
    }
  },
  
  emits: [
    /**
     * 更新 visible 属性
     * @param {boolean} visible - 新的可见性状态
     */
    'update:visible',
    
    /**
     * 加载完成事件
     */
    'complete'
  ],
  
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
/* ========== 容器样式 ========== */
.progress-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  width: 400px;
  max-width: 90vw;
}

/* ========== 进度条背景 ========== */
.progress-bar-bg {
  position: relative;
  width: 100%;
  height: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

/* ========== 进度条填充 ========== */
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
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

/* ========== 渐变斜纹效果 ========== */
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

/* ========== 呼吸灯效果 ========== */
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

/* ========== 百分比文字 ========== */
.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  font-size: 14px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 10;
}

/* ========== 加载提示 ========== */
.loading-hint {
  margin-top: 10px;
  text-align: center;
  color: white;
  font-size: 16px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* ========== 动画定义 ========== */

/* 斜纹移动动画 */
@keyframes gradient-move {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 20px 20px;
  }
}

/* 呼吸动画 */
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
