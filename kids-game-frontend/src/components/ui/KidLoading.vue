<template>
  <div class="kid-loading" :class="[`size-${size}`]">
    <div class="spinner">
      <div class="spinner-circle"></div>
      <div class="spinner-circle"></div>
      <div class="spinner-circle"></div>
    </div>
    <p v-if="text" class="loading-text">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

withDefaults(defineProps<Props>(), {
  size: 'md',
});
</script>

<style scoped>
.kid-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.spinner {
  display: flex;
  gap: 8px;
}

.spinner-circle {
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite both;
}

.size-sm .spinner-circle {
  width: 20px;
  height: 20px;
  background: #FF6B9D;
}

.size-md .spinner-circle {
  width: 30px;
  height: 30px;
  background: #FF6B9D;
}

.size-lg .spinner-circle {
  width: 40px;
  height: 40px;
  background: #FF6B9D;
}

.spinner-circle:nth-child(1) {
  animation-delay: -0.32s;
  background: #FF6B9D;
}

.spinner-circle:nth-child(2) {
  animation-delay: -0.16s;
  background: #4ECDC4;
}

.spinner-circle:nth-child(3) {
  animation-delay: 0s;
  background: #FFE66D;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.loading-text {
  margin: 0;
  color: #666;
  font-size: 1rem;
}

.size-sm .loading-text {
  font-size: 0.9rem;
}

.size-lg .loading-text {
  font-size: 1.1rem;
}
</style>
