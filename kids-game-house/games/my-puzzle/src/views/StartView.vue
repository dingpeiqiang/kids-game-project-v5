<script setup lang="ts">
/**
 * 开始界面
 */
import GameButton from '@/components/ui/GameButton.vue'

const emit = defineEmits<{
  start: []
}>()

function handleStart() {
  emit('start')
}
</script>

<template>
  <div class="start-view">
    <div class="content">
      <!-- 游戏标题 -->
      <h1 class="title">拼图游戏</h1>
      <p class="subtitle">基于 Kids Game Frame Factory</p>

      <!-- 开始按钮 -->
      <div class="actions">
        <GameButton 
          text="开始游戏" 
          size="large"
          @click="handleStart"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.start-view {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.content {
  text-align: center;
}

.title {
  font-size: 48px;
  color: #4ade80;
  margin-bottom: 16px;
  text-shadow: 0 0 20px rgba(74, 222, 128, 0.5);
}

.subtitle {
  font-size: 18px;
  color: #94a3b8;
  margin-bottom: 60px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}
</style>
