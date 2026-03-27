<template>
  <button
    class="pause-button"
    :class="{ 'pause-button--paused': isPaused }"
    @click="handleClick"
    :title="isPaused ? '继续' : '暂停'"
  >
    <span class="pause-button__icon">{{ isPaused ? '▶️' : '⏸️' }}</span>
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  /** 是否暂停状态 */
  isPaused?: boolean
  /** 按钮尺寸 */
  size?: 'small' | 'medium' | 'large'
}>(), {
  isPaused: false,
  size: 'medium'
})

const emit = defineEmits<{
  toggle: []
}>()

function handleClick() {
  emit('toggle')
}
</script>

<style scoped>
.pause-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(55, 65, 81, 0.8);
  border: none;
  color: white;
}

.pause-button:hover {
  background: rgba(75, 85, 99, 0.9);
  transform: scale(1.05);
}

.pause-button:active {
  transform: scale(0.95);
}

.pause-button--small {
  width: 36px;
  height: 36px;
  font-size: 16px;
}

.pause-button--medium {
  width: 48px;
  height: 48px;
  font-size: 24px;
}

.pause-button--large {
  width: 56px;
  height: 56px;
  font-size: 28px;
}

.pause-button__icon {
  line-height: 1;
}
</style>
