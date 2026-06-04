<template>
  <div v-if="loading" class="global-loading-overlay">
    <div class="loading-card">
      <div class="loading-emoji">{{ randomEmoji }}</div>
      <div class="loading-spinner-container">
        <div class="loading-spinner"></div>
      </div>
      <p class="loading-message">{{ message }}</p>
      <div class="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  loading: boolean;
  message?: string;
}>();

const emojis = ['🎮', '⭐', '🌟', '✨', '🎨', '🎪', '🎭', '🎯', '🚀', '💫'];
const randomEmoji = ref(emojis[Math.floor(Math.random() * emojis.length)]);
</script>

<style scoped>
.global-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(102, 126, 234, 0.15);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: slideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.loading-card {
  background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
  border-radius: 32px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3);
  animation: popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  border: 3px solid rgba(102, 126, 234, 0.1);
  min-width: 320px;
}

@keyframes popIn {
  0% {
    opacity: 0;
    transform: scale(0.5) translateY(20px);
  }
  60% {
    transform: scale(1.1) translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.loading-emoji {
  font-size: 4rem;
  animation: bounce 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15px);
  }
}

.loading-spinner-container {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
}

.loading-spinner {
  width: 80px;
  height: 80px;
  border: 6px solid rgba(102, 126, 234, 0.15);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  position: absolute;
  top: 0;
  left: 0;
}

.loading-spinner::before {
  content: '';
  position: absolute;
  top: 6px;
  left: 6px;
  right: 6px;
  bottom: 6px;
  border: 6px solid rgba(118, 75, 162, 0.15);
  border-top-color: #764ba2;
  border-radius: 50%;
  animation: spin 1.2s linear infinite reverse;
}

.loading-spinner::after {
  content: '';
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  bottom: 12px;
  border: 6px solid rgba(102, 126, 234, 0.15);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-message {
  font-size: 1.3rem;
  font-weight: 600;
  color: #667eea;
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.loading-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.loading-dots span {
  width: 12px;
  height: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  animation: dotBounce 1.4s ease-in-out infinite;
}

.loading-dots span:nth-child(1) {
  animation-delay: 0s;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dotBounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .loading-card {
    padding: 2rem;
    min-width: 280px;
  }

  .loading-emoji {
    font-size: 3rem;
  }

  .loading-spinner-container {
    width: 60px;
    height: 60px;
  }

  .loading-spinner {
    width: 60px;
    height: 60px;
    border-width: 4px;
  }

  .loading-spinner::before {
    top: 4px;
    left: 4px;
    right: 4px;
    bottom: 4px;
    border-width: 4px;
  }

  .loading-spinner::after {
    top: 8px;
    left: 8px;
    right: 8px;
    bottom: 8px;
    border-width: 4px;
  }

  .loading-message {
    font-size: 1.1rem;
  }
}
</style>

