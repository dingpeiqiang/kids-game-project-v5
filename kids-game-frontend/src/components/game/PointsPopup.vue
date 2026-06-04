<template>
  <Transition name="popup">
    <div v-if="show" class="points-popup" :class="[`type-${type}`]">
      <span class="icon">{{ icon }}</span>
      <span class="text">+{{ points }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  points: number;
  type?: 'normal' | 'streak' | 'bonus';
  duration?: number;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'normal',
  duration: 1000,
});

const show = ref(true);
const icon = ref('⭐');

switch (props.type) {
  case 'streak':
    icon.value = '🔥';
    break;
  case 'bonus':
    icon.value = '🎁';
    break;
}

setTimeout(() => {
  show.value = false;
}, props.duration);
</script>

<style scoped>
.points-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 40px;
  border-radius: 15px;
  font-size: 2rem;
  font-weight: bold;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.points-popup.type-normal {
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8E53 100%);
}

.points-popup.type-streak {
  background: linear-gradient(135deg, #FF6B9D 0%, #C44569 100%);
  animation: pulse 0.5s ease-in-out;
}

.points-popup.type-bonus {
  background: linear-gradient(135deg, #FFE66D 0%, #FF6B9D 100%);
  animation: scale 0.5s ease-in-out;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

@keyframes scale {
  0% {
    transform: scale(0.5);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.popup-enter-active,
.popup-leave-active {
  transition: all 0.5s;
}

.popup-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.5);
}

.popup-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(1.5);
}
</style>
