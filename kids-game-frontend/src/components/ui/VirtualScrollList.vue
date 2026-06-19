<template>
  <div
    ref="containerRef"
    class="virtual-scroll-container"
    @scroll="handleScroll"
  >
    <!-- 空白占位，模拟已滚动区域 -->
    <div class="virtual-scroll-spacer" :style="{ height: spacerHeight + 'px' }"></div>
    
    <!-- 可视区域内的卡片 -->
    <div class="virtual-scroll-content">
      <slot
        v-for="(item, index) in visibleItems"
        :key="itemKey(item, index)"
        :item="item"
        :index="index + visibleStart"
      ></slot>
    </div>
    
    <!-- 底部空白占位 -->
    <div class="virtual-scroll-spacer" :style="{ height: bottomSpacerHeight + 'px' }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

interface Props {
  items: any[];
  itemHeight: number;
  buffer?: number;
}

const props = withDefaults(defineProps<Props>(), {
  buffer: 2,
});

const containerRef = ref<HTMLElement | null>(null);
const scrollTop = ref(0);

// 可视区域起始索引
const visibleStart = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight) - props.buffer;
  return Math.max(0, start);
});

// 可视区域结束索引
const visibleEnd = computed(() => {
  const containerHeight = containerRef.value?.clientHeight || 0;
  const end = Math.floor((scrollTop.value + containerHeight) / props.itemHeight) + props.buffer;
  return Math.min(props.items.length, end);
});

// 可视区域内的项
const visibleItems = computed(() => {
  return props.items.slice(visibleStart.value, visibleEnd.value);
});

// 顶部占位高度
const spacerHeight = computed(() => {
  return visibleStart.value * props.itemHeight;
});

// 底部占位高度
const bottomSpacerHeight = computed(() => {
  const totalHeight = props.items.length * props.itemHeight;
  const renderedHeight = (visibleEnd.value - visibleStart.value) * props.itemHeight;
  return Math.max(0, totalHeight - spacerHeight.value - renderedHeight);
});

function handleScroll() {
  if (containerRef.value) {
    scrollTop.value = containerRef.value.scrollTop;
  }
}

function itemKey(item: any, index: number): string {
  if (item && typeof item === 'object' && 'gameId' in item) {
    return String(item.gameId);
  }
  return String(index);
}

// 监听窗口大小变化，重新计算
function handleResize() {
  if (containerRef.value) {
    scrollTop.value = containerRef.value.scrollTop;
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// 监听 items 变化，保持滚动位置
watch(() => props.items.length, () => {
  if (containerRef.value) {
    scrollTop.value = containerRef.value.scrollTop;
  }
});
</script>

<style scoped>
.virtual-scroll-container {
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
}

.virtual-scroll-spacer {
  width: 100%;
}

.virtual-scroll-content {
  position: relative;
}
</style>