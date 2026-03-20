<template>
  <KidUnifiedModalV2
    :show="true"
    title="游戏已暂停"
    type="info"
    icon="⏸️"
    :closable="false"
    :show-cancel="false"
    confirm-text="继续游戏"
    confirm-variant="success"
    @confirm="$emit('resume')"
    @update:show="$emit('exit')"
  />
</template>

<script setup lang="ts">
import KidUnifiedModalV2 from '@/components/ui/KidUnifiedModalV2.vue';

defineEmits<{
  resume: [];
  exit: [];
}>();
</script>

<style scoped>
/* 所有样式都已移至 KidAlertDialog 组件 */
</style>
