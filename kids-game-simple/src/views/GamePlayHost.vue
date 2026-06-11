<template>
  <CanvasGamePlay v-if="useCanvas" :game-id="gameCode" />
  <IframeGamePlay v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { isEmbeddedCanvasGame } from '@simple/games/embeddedCanvasGames';
import CanvasGamePlay from '@simple/components/CanvasGamePlay.vue';
import IframeGamePlay from '@/modules/game/index.vue';

const route = useRoute();
const gameCode = computed(() => String(route.params.type ?? ''));
const useCanvas = computed(() => isEmbeddedCanvasGame(gameCode.value));
</script>