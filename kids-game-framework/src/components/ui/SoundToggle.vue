<template>
  <button
    class="sound-toggle"
    :class="[`sound-toggle--${size}`]"
    @click="handleClick"
    :title="enabled ? '关闭声音' : '开启声音'"
  >
    <span class="sound-toggle__icon">{{ enabled ? '🔊' : '🔇' }}</span>
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  /** 是否启用声音 */
  enabled?: boolean
  /** 按钮尺寸 */
  size?: 'small' | 'medium' | 'large'
}>(), {
  enabled: true,
  size: 'medium'
})

const emit = defineEmits<{
  toggle: [enabled: boolean]
}>()

function handleClick() {
  emit('toggle', !arguments[0])
}
</script>

<style scoped>
.sound-toggle {
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

.sound-toggle:hover {
  background: rgba(75, 85, 99, 0.9);
  transform: scale(1.05);
}

.sound-toggle:active {
  transform: scale(0.95);
}

.sound-toggle--small {
  width: 32px;
  height: 32px;
  font-size: 14px;
}

.sound-toggle--medium {
  width: 40px;
  height: 40px;
  font-size: 18px;
}

.sound-toggle--large {
  width: 48px;
  height: 48px;
  font-size: 22px;
}

.sound-toggle__icon {
  line-height: 1;
}
</style>
