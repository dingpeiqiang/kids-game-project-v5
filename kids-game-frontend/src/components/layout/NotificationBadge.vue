<template>
  <button class="notification-badge" @click="handleClick">
    <span class="notification-icon">🔔</span>
    <span v-if="count > 0" class="badge-count">{{ displayCount }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  count?: number;
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
});

const emit = defineEmits<{
  click: [];
}>();

// 显示数量（最多99）
const displayCount = computed(() => {
  return props.count > 99 ? '99+' : props.count;
});

function handleClick() {
  emit('click');
}
</script>

<style scoped lang="scss">
.notification-badge {
  position: relative;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  &:active {
    transform: scale(0.95);
  }

  .notification-icon {
    font-size: 20px;
    line-height: 1;
  }

  .badge-count {
    position: absolute;
    top: 0;
    right: 0;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    background: #ff4757;
    color: white;
    font-size: 10px;
    font-weight: 600;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    animation: bounceIn 0.3s ease;
  }
}

@keyframes bounceIn {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .notification-badge {
    width: 36px;
    height: 36px;

    .notification-icon {
      font-size: 18px;
    }

    .badge-count {
      min-width: 16px;
      height: 16px;
      font-size: 9px;
    }
  }
}
</style>
