<template>
  <GameGuideShell
    :guide="guide"
    :accent="accent"
    :custom-panel="customPanel"
    @start="emit('start', $event)"
    @cancel="emit('cancel')"
  />
</template>

<script setup lang="ts">
import type { Component } from 'vue';
import type { GameGuide } from '@simple/types';
import GameGuideShell from '@simple/platform/gameGuide/GameGuideShell.vue';

defineProps<{
  guide: GameGuide;
  accent: string;
  customPanel?: Component;
}>();

const emit = defineEmits<{
  start: [skipNext: boolean];
  cancel: [];
}>();
</script>