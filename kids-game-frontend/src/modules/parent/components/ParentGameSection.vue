<template>
  <GameListSection
    variant="parent"
    :show-categories="true"
    :show-count="true"
    :show-view-all="true"
    :categories="categories"
    :current-category="currentCategory"
    current-category-name="全部游戏"
    :filtered-games="filteredGames"
    :is-loading="isLoading"
    @select-category="$emit('selectCategory', $event)"
    @play-game="$emit('playGame', $event)"
  />
</template>

<script setup lang="ts">
import { watch } from 'vue';
import GameListSection from '@/components/game/GameListSection.vue';

interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

interface Game {
  gameId: number;
  gameCode: string;
  gameName: string;
  category: string;
  grade: string;
  rating?: number;
  playCount?: number;
  isNew?: boolean;
  isHot?: boolean;
}

const props = defineProps<{
  categories: Category[];
  currentCategory: string;
  filteredGames: Game[];
  isLoading: boolean;
}>();

defineEmits<{
  selectCategory: [categoryId: string];
  playGame: [game: Game];
}>();

// 监听 filteredGames 变化，输出调试信息
watch(() => props.filteredGames, (newGames) => {
  console.log('[ParentGameSection] filteredGames 变化:', {
    length: newGames.length,
    games: newGames.map(g => ({ id: g.gameId, name: g.gameName, category: g.category }))
  });
}, { immediate: true });
</script>

