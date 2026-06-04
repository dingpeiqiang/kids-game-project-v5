<template>
  <div v-if="message" class="error-display" :class="type">
    <div class="error-icon">{{ icon }}</div>
    <div class="error-content">
      <p class="error-message">{{ message }}</p>
      <button @click="$emit('close')" class="error-close">✕</button>
    </div>
    <div class="error-decorations">
      <span class="decoration-star">⭐</span>
      <span class="decoration-star">✨</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  message: string;
  type?: 'error' | 'warning' | 'info';
}>();

defineEmits<{
  close: [];
}>();

const icon = computed(() => {
  const icons = {
    error: '🎭',
    warning: '⚡',
    info: '💡'
  };
  return icons[props.type || 'error'];
});
</script>

<style scoped>
.error-display {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  background: linear-gradient(135deg, #ffffff 0%, #fff5f5 100%);
  border-radius: 20px;
  padding: 1.2rem 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 10px 40px rgba(239, 68, 68, 0.2);
  animation: slideDown 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  border: 3px solid rgba(239, 68, 68, 0.2);
  min-width: 350px;
  max-width: 90%;
}

.error-display.warning {
  background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
  box-shadow: 0 10px 40px rgba(245, 158, 11, 0.2);
  border-color: rgba(245, 158, 11, 0.2);
}

.error-display.info {
  background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
  box-shadow: 0 10px 40px rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.2);
}

@keyframes slideDown {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(-30px) scale(0.8);
  }
  60% {
    transform: translateX(-50%) translateY(5px) scale(1.05);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

.error-icon {
  font-size: 2.5rem;
  animation: wiggle 0.6s ease-in-out;
}

@keyframes wiggle {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(10deg);
  }
}

.error-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.error-message {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #dc2626;
  flex: 1;
  line-height: 1.4;
}

.error-display.warning .error-message {
  color: #d97706;
}

.error-display.info .error-message {
  color: #2563eb;
}

.error-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(220, 38, 38, 0.2);
  background: transparent;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  color: #dc2626;
}

.error-display.warning .error-close {
  border-color: rgba(217, 119, 6, 0.2);
  color: #d97706;
}

.error-display.info .error-close {
  border-color: rgba(37, 99, 235, 0.2);
  color: #2563eb;
}

.error-close:hover {
  transform: scale(1.1) rotate(90deg);
  background: rgba(220, 38, 38, 0.1);
}

.error-display.warning .error-close:hover {
  background: rgba(217, 119, 6, 0.1);
}

.error-display.info .error-close:hover {
  background: rgba(37, 99, 235, 0.1);
}

.error-decorations {
  position: absolute;
  top: -8px;
  right: -8px;
  pointer-events: none;
}

.decoration-star {
  position: absolute;
  font-size: 1.2rem;
  animation: twinkle 1.5s ease-in-out infinite;
}

.decoration-star:nth-child(1) {
  top: 0;
  right: 20px;
  animation-delay: 0s;
}

.decoration-star:nth-child(2) {
  top: 15px;
  right: -5px;
  animation-delay: 0.5s;
}

@keyframes twinkle {
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@media (max-width: 768px) {
  .error-display {
    top: 60px;
    padding: 1rem 1.5rem;
    min-width: 280px;
    flex-direction: column;
    text-align: center;
  }

  .error-icon {
    font-size: 2rem;
  }

  .error-message {
    font-size: 1rem;
  }

  .error-content {
    width: 100%;
    justify-content: space-between;
  }

  .error-close {
    width: 28px;
    height: 28px;
  }

  .error-decorations {
    top: -5px;
    right: -5px;
  }
}
</style>
