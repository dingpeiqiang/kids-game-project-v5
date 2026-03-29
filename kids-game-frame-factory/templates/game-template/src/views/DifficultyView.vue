<script setup lang="ts">
/**
 * 难度选择界面
 */
import { ref } from 'vue'
import GameButton from '@/components/ui/GameButton.vue'
import DifficultySelector from '@/components/ui/DifficultySelector.vue'
import difficultyConfig from '@/config/difficulty.json'

const emit = defineEmits<{
  select: [difficulty: string]
  back: []
}>()

const selectedDifficulty = ref('normal')

function handleSelect(difficulty: string) {
  selectedDifficulty.value = difficulty
}

function handleStart() {
  emit('select', selectedDifficulty.value)
}

function handleBack() {
  emit('back')
}
</script>

<template>
  <div class="difficulty-view">
    <div class="content">
      <h2 class="title">选择难度</h2>

      <!-- 难度选择器 -->
      <DifficultySelector
        :difficulties="difficultyConfig.difficulties"
        :model-value="selectedDifficulty"
        @update:model-value="handleSelect"
      />

      <!-- 操作按钮 -->
      <div class="actions">
        <GameButton 
          text="开始挑战" 
          size="large"
          @click="handleStart"
        />
        <GameButton 
          text="返回" 
          variant="secondary"
          @click="handleBack"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.difficulty-view {
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
  font-size: 36px;
  color: #ffffff;
  margin-bottom: 40px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 40px;
}
</style>
