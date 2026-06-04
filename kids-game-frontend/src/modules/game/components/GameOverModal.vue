<template>
  <KidUnifiedModalV2
    :show="true"
    title="游戏结束！"
    type="gameover"
    icon="🎉"
    :stats="stats"
    :actions="actions"
    @update:show="$emit('close')"
  />
</template>

<script setup lang="ts">
import KidUnifiedModalV2 from '@/components/ui/KidUnifiedModalV2.vue';

const props = defineProps<{
  score: number;
  duration: string;
}>();

const emit = defineEmits<{
  close: [];
  restart: [];
  exit: [];
}>();

const stats = [
  { label: '得分', value: props.score },
  { label: '时长', value: props.duration },
  { label: '消耗疲劳点', value: 1 },
];

const actions = [
  {
    text: '再玩一次',
    variant: 'primary' as const,
    onClick: () => emit('restart'),
  },
  {
    text: '返回首页',
    variant: 'secondary' as const,
    onClick: () => emit('exit'),
  },
];
</script>

<style scoped>
/* 所有样式都已移至 KidGameModal 组件 */
</style>
