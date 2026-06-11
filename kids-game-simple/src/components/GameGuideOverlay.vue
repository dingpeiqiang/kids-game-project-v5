<template>
  <div class="guide-overlay" @click.self="emit('cancel')">
    <div class="guide-card">
      <div class="guide-header">
        <span class="guide-icon">{{ guide.icon }}</span>
        <div>
          <div class="guide-name">{{ guide.name }}</div>
          <div class="guide-desc">{{ guide.desc }}</div>
        </div>
      </div>
      <div v-for="(op, i) in guide.ops" :key="i" class="guide-op">
        <span class="op-icon" :style="{ background: accent + '33' }">{{ op.icon }}</span>
        <span v-html="op.text" />
      </div>
      <div class="guide-tips">
        <div class="tips-title">{{ guide.tipsTitle }}</div>
        <div class="tips-text">{{ guide.tips }}</div>
      </div>
      <label class="skip">
        <input v-model="skipNext" type="checkbox" />
        不再显示本游戏引导
      </label>
      <button type="button" class="start-btn" @click="emit('start', skipNext)">开始游戏</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { GameGuide } from '@simple/types';

defineProps<{
  guide: GameGuide;
  accent: string;
}>();

const emit = defineEmits<{
  start: [skipNext: boolean];
  cancel: [];
}>();

const skipNext = ref(false);
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
  color: #222;
  max-width: 420px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 16px;
  padding: 20px;
}
.guide-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.guide-icon {
  font-size: 2rem;
}
.guide-name {
  font-weight: 700;
  font-size: 1.1rem;
}
.guide-desc {
  font-size: 0.9rem;
  opacity: 0.75;
}
.guide-op {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 0.9rem;
}
.op-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  flex-shrink: 0;
}
.guide-tips {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 10px;
  margin: 12px 0;
  font-size: 0.85rem;
  white-space: pre-line;
}
.tips-title {
  font-weight: 600;
  margin-bottom: 6px;
}
.skip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  margin-bottom: 12px;
}
.start-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: #4d96ff;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
}
</style>