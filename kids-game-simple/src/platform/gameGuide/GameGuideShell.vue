<template>
  <div class="guide-overlay" @click.self="emit('cancel')">
    <div class="guide-card">
      <component
        :is="panelComponent"
        :guide="guide"
        :accent="accent"
      />
      <label class="skip">
        <input v-model="skipNext" type="checkbox" />
        不再显示本游戏引导
      </label>
      <button type="button" class="start-btn" :style="{ background: accent }" @click="emit('start', skipNext)">
        开始游戏
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type Component } from 'vue';
import type { GameGuide } from '../../types';
import GameGuideDefaultPanel from './GameGuideDefaultPanel.vue';

const props = defineProps<{
  guide: GameGuide;
  accent: string;
  /** 游戏目录提供的自定义介绍页组件 */
  customPanel?: Component;
}>();

const emit = defineEmits<{
  start: [skipNext: boolean];
  cancel: [];
}>();

const skipNext = ref(false);

const panelComponent = computed(() => props.customPanel ?? GameGuideDefaultPanel);
</script>

<style scoped>
.guide-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.guide-card {
  background: #fff;
  max-width: 420px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 16px;
  padding: 20px;
}
.skip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  margin: 12px 0;
}
.start-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
}
</style>