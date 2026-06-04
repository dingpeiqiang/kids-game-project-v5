<script setup lang="ts">
/**
 * 暂停按钮组件
 */
interface Props {
  isPaused?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isPaused: false
})

const emit = defineEmits<{
  click: []
}>()

function handleClick() {
  emit('click')
}
</script>

<template>
  <button
    class="pause-button"
    :title="isPaused ? '继续' : '暂停'"
    @click="handleClick"
  >
    <!-- 暂停图标 -->
    <svg v-if="!isPaused" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1"/>
      <rect x="14" y="4" width="4" height="16" rx="1"/>
    </svg>
    <!-- 继续图标 -->
    <svg v-else viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21"/>
    </svg>
  </button>
</template>

<style scoped>
.pause-button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, transform 0.1s;
  backdrop-filter: blur(4px);
}

.pause-button:hover {
  background: rgba(0, 0, 0, 0.7);
  border-color: rgba(255, 255, 255, 0.5);
}

.pause-button:active {
  transform: scale(0.92);
}

.pause-button svg {
  width: 20px;
  height: 20px;
}
</style>
