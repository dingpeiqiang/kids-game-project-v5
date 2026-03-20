<template>
  <button class="exit-button" :title="tooltip" @click="handleExit">
    <span class="exit-icon">{{ icon }}</span>
    <span v-if="showText" class="exit-text">退出</span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  icon?: string;
  showText?: boolean;
  tooltip?: string;
}

const props = withDefaults(defineProps<Props>(), {
  icon: '🚪',
  showText: false,
  tooltip: '退出登录'
});

const emit = defineEmits<{
  exit: [];
}>();

function handleExit() {
  emit('exit');
}
</script>

<style scoped lang="scss">
.exit-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: #f5f5f5;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;

  &:hover {
    background: #ff4757;
    color: white;
    transform: translateX(2px);
  }

  &:active {
    transform: scale(0.95);
  }

  .exit-icon {
    font-size: 18px;
    line-height: 1;
  }

  .exit-text {
    font-size: 14px;
    font-weight: 500;
  }
}

@media (max-width: 768px) {
  .exit-button {
    padding: 6px 12px;

    .exit-icon {
      font-size: 16px;
    }

    .exit-text {
      font-size: 13px;
    }
  }
}
</style>
