<template>
  <div class="item-effects-bar" v-if="hasEffects">
    <!-- 加速 -->
    <div class="item-effect" v-if="itemEffects.speedUp" title="加速">
      <span class="item-effect__icon">⚡</span>
      <span class="item-effect__label">加速</span>
    </div>

    <!-- 减速 -->
    <div class="item-effect" v-if="itemEffects.slowDown" title="减速">
      <span class="item-effect__icon">🐢</span>
      <span class="item-effect__label">减速</span>
    </div>

    <!-- 无敌 -->
    <div class="item-effect item-effect--gold" v-if="itemEffects.invincibility" title="无敌">
      <span class="item-effect__icon">🛡️</span>
      <span class="item-effect__label">无敌</span>
    </div>

    <!-- 双倍得分 -->
    <div class="item-effect item-effect--purple" v-if="itemEffects.doubleScore" title="双倍得分">
      <span class="item-effect__icon">💎</span>
      <span class="item-effect__label">2x</span>
    </div>

    <!-- 速度倍率 -->
    <div class="item-effect" v-if="itemEffects.speedMultiplier !== 1" :title="`速度 x${itemEffects.speedMultiplier}`">
      <span class="item-effect__icon">🏃</span>
      <span class="item-effect__label">x{{ itemEffects.speedMultiplier }}</span>
    </div>

    <!-- 得分倍率 -->
    <div class="item-effect item-effect--gold" v-if="itemEffects.scoreMultiplier !== 1" :title="`得分 x${itemEffects.scoreMultiplier}`">
      <span class="item-effect__icon">💰</span>
      <span class="item-effect__label">x{{ itemEffects.scoreMultiplier }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ItemEffectsState } from '../../types/ui.types'

const props = defineProps<{
  /** 道具效果状态 */
  itemEffects: ItemEffectsState
}>()

const hasEffects = computed(() => {
  const e = props.itemEffects
  return e.speedUp || e.slowDown || e.invincibility || e.doubleScore ||
    e.speedMultiplier !== 1 || e.scoreMultiplier !== 1
})
</script>

<style scoped>
.item-effects-bar {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(31, 41, 55, 0.9);
  border-radius: 10px;
  backdrop-filter: blur(4px);
}

.item-effect {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(55, 65, 81, 0.8);
  border-radius: 6px;
  font-size: 12px;
}

.item-effect--gold {
  background: rgba(251, 191, 36, 0.3);
  border: 1px solid #fbbf24;
}

.item-effect--purple {
  background: rgba(168, 85, 247, 0.3);
  border: 1px solid #a855f7;
}

.item-effect__icon {
  font-size: 14px;
}

.item-effect__label {
  font-weight: bold;
  color: #ffffff;
}
</style>
