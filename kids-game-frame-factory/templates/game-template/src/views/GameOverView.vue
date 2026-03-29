<script setup lang="ts">
/**
 * 游戏结束界面
 */
import { computed } from 'vue'
import GameButton from '@/components/ui/GameButton.vue'
import ScorePanel from '@/components/ui/ScorePanel.vue'

const props = defineProps<{
  score: number
}>()

const emit = defineEmits<{
  restart: []
  home: []
}>()

// 判断是否是新纪录
const isNewRecord = computed(() => {
  // TODO: 实现最高分逻辑
  return false
})

function handleRestart() {
  emit('restart')
}

function handleHome() {
  emit('home')
}
</script>

<template>
  <div class="gameover-view">
    <div class="content">
      <h2 class="title">游戏结束</h2>

      <!-- 分数面板 -->
      <ScorePanel 
        :score="score"
        :is-new-record="isNewRecord"
      />

      <!-- 操作按钮 -->
      <div class="actions">
        <GameButton 
          text="再来一局" 
          size="large"
          @click="handleRestart"
        />
        <GameButton 
          text="返回主页" 
          variant="secondary"
          @click="handleHome"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.gameover-view {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.content {
  text-align: center;
  width: 100%;
  max-width: 400px;
  padding: 0 20px;
}

.title {
  font-size: 42px;
  color: #ff6b6b;
  margin-bottom: 40px;
  text-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 40px;
}
</style>
