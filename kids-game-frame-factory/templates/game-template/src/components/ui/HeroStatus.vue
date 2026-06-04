<template>
  <div class="hero-status">
    <div class="health-bar">
      <span v-for="(state, index) in healthStates" :key="index" class="heart-icon">
        {{ state === 'full' ? '❤️' : state === 'half' ? '💔' : '🖤' }}
      </span>
    </div>
    <div class="coin-counter">
      💰 {{ coins }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  healthStates: string[]
  coins: number
}>()
</script>

<style scoped>
.hero-status {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  gap: 20px;
  font-family: 'Press Start 2P', monospace;
  color: white;
  z-index: 100;
}

.health-bar {
  display: flex;
  gap: 5px;
}

.coin-counter {
  background: rgba(0, 0, 0, 0.5);
  padding: 5px 10px;
  border-radius: 4px;
}
</style>
