<template>
  <div class="guide-panel">
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
  </div>
</template>

<script setup lang="ts">
import type { GameGuide } from '../../types';

defineProps<{
  guide: GameGuide;
  accent: string;
}>();
</script>

<style scoped>
.guide-panel {
  color: #222;
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
  margin: 12px 0 0;
  font-size: 0.85rem;
  white-space: pre-line;
}
.tips-title {
  font-weight: 600;
  margin-bottom: 6px;
}
</style>