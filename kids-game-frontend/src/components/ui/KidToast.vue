<template>
  <Transition name="toast">
    <div v-if="visible" class="kid-toast" :class="[`variant-${variant}`, `position-${position}`]">
      <span v-if="icon" class="toast-icon">{{ icon }}</span>
      <span class="toast-message">{{ message }}</span>
      <button v-if="closable" class="toast-close" @click="handleClose">✕</button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';

interface Props {
  message: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  position?: 'top' | 'top-right' | 'bottom';
  duration?: number;
  closable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
  position: 'top',
  duration: 3000,
  closable: true,
});

const emit = defineEmits<{
  close: [];
}>();

const visible = ref(false);
let timer: number | null = null;

// 根据variant返回对应的图标
const icon = computed(() => {
  const iconMap = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };
  return iconMap[props.variant];
});

function show() {
  visible.value = true;
  if (props.duration > 0) {
    startTimer();
  }
}

function hide() {
  visible.value = false;
}

function startTimer() {
  if (timer) {
    clearTimeout(timer);
  }
  timer = window.setTimeout(() => {
    hide();
  }, props.duration);
}

function handleClose() {
  hide();
  emit('close');
}

onMounted(() => {
  show();
});

watch(() => props.message, () => {
  visible.value = true;
  if (props.duration > 0) {
    startTimer();
  }
});
</script>

<style scoped>
.kid-toast {
  position: fixed;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  min-width: 300px;
  max-width: 90vw;
  font-weight: 500;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Variants */
.variant-success {
  background: linear-gradient(135deg, #4ECDC4 0%, #95E1D3 100%);
  color: white;
}

.variant-error {
  background: linear-gradient(135deg, #FF6B9D 0%, #C44569 100%);
  color: white;
}

.variant-warning {
  background: linear-gradient(135deg, #FFE66D 0%, #FFB347 100%);
  color: #333;
}

.variant-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* Positions */
.position-top {
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
}

.position-top-right {
  top: 100px;
  right: 20px;
}

.position-bottom {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.toast-icon {
  font-size: 1.3rem;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  font-size: 0.95rem;
  word-break: break-word;
}

.toast-close {
  background: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.9rem;
  color: inherit;
  transition: background 0.2s;
  flex-shrink: 0;
}

.toast-close:hover {
  background: rgba(255, 255, 255, 0.5);
}

@media (max-width: 768px) {
  .kid-toast {
    min-width: 280px;
    max-width: 85vw;
    padding: 12px 16px;
  }

  .toast-message {
    font-size: 0.9rem;
  }
}
</style>
