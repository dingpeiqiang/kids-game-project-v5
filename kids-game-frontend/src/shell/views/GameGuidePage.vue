<template>
  <div class="game-guide-page">
    <div v-if="loading" class="game-guide-page__loading">加载玩法介绍…</div>
    <GameGuideShell
      v-else-if="guide"
      :guide="guide"
      :accent="accent"
      :custom-panel="customPanel"
      @start="onStart"
      @cancel="onCancel"
    />
    <div v-else class="game-guide-page__empty">暂无玩法介绍</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, type Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { GameGuide } from '@shell/types';
import { getGameRegistration } from '@/games/gameRegistry';
import { hasGameGuide, loadGameGuideModule } from '@shell/platform/gameGuide';
import { mergeGuideWithControlHint } from '@shell/platform/mobileControls';
import GameGuideShell from '@shell/platform/gameGuide/GameGuideShell.vue';
import { storageService } from '@shell/services/storage';
import { userService } from '@shell/services/userService';

const route = useRoute();
const router = useRouter();

const gameId = computed(() => String(route.params.gameId ?? ''));
const registration = computed(() => getGameRegistration(gameId.value));
const accent = computed(() => registration.value?.game.color?.split(',')[0] ?? '#4D96FF');

const loading = ref(true);
const guide = ref<GameGuide | undefined>();
const customPanel = ref<Component | undefined>();

function onCancel() {
  router.back();
}

function onStart(skipNext: boolean) {
  if (skipNext) {
    if (userService.isLoggedIn) userService.skipGuide(gameId.value);
    else storageService.skipGuide(gameId.value);
  }
  router.push({ path: `/game/${gameId.value}/play` });
}

onMounted(async () => {
  if (!registration.value) {
    router.replace('/');
    return;
  }
  if (!hasGameGuide(gameId.value)) {
    loading.value = false;
    return;
  }
  const mod = await loadGameGuideModule(gameId.value);
  guide.value = mod?.guide
    ? mergeGuideWithControlHint(gameId.value, mod.guide)
    : undefined;
  customPanel.value = mod?.GuidePage;
  loading.value = false;
});
</script>

<style scoped>
.game-guide-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.game-guide-page__loading,
.game-guide-page__empty {
  color: #666;
  padding: 24px;
}
</style>