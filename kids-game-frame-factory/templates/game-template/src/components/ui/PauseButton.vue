<script setup lang="ts">
/**
 * 暂停按钮组件
 */
import { ref } from 'vue'

interface Props {
  isPaused?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isPaused: false
})

const emit = defineEmits<{
  toggle: []
}>()

function handleClick() {
  emit('toggle')
}
</script>

<template>
  <button 
    class="pause-button"
    :class="{ paused: isPaused }"
    @click="handleClick"
  >
    <!-- 播放图标 -->
    <svg v-if="isPaused" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
    </svg>
    <!-- 暂停图标 -->
    <svg v-else viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>
  </button>
</template>

<style scoped>
.pause-button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.pause-button:hover {
  background: rgba(0, 0, 0, 0.7);
  transform: scale(1.05);
}

.pause-button:active {
  transform: scale(0.95);
}

.pause-button.paused {
  background: rgba(74, 222, 128, 0.8);
}

.pause-button svg {
  width: 20px;
  height: 20px;
}
</style>
