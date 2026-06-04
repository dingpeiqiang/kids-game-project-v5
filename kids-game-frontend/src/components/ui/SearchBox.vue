<template>
  <div class="search-box">
    <div class="search-input-wrapper">
      <span class="search-icon">🔍</span>
      <input
        ref="searchInput"
        v-model="keyword"
        type="text"
        class="search-input"
        placeholder="搜索游戏名称、描述..."
        @input="handleInput"
        @keyup.enter="handleSearch"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      <button
        v-if="keyword"
        class="clear-button"
        @click="handleClear"
        title="清除搜索"
      >
        ✕
      </button>
    </div>
    <div v-if="showSuggestions && suggestions.length > 0" class="search-suggestions">
      <div
        v-for="(item, index) in suggestions"
        :key="item.gameId"
        class="suggestion-item"
        :class="{ highlighted: index === highlightedIndex }"
        @click="selectSuggestion(item)"
        @mouseenter="highlightedIndex = index"
      >
        <span class="suggestion-icon">{{ item.icon || '🎮' }}</span>
        <div class="suggestion-info">
          <span class="suggestion-name">{{ item.gameName }}</span>
          <span class="suggestion-desc">{{ item.description || '' }}</span>
        </div>
      </div>
    </div>
    <div v-else-if="showSuggestions && keyword && suggestions.length === 0" class="no-results">
      <span class="no-results-icon">🔍</span>
      <span class="no-results-text">未找到相关游戏</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';

interface Props {
  games: any[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  search: [keyword: string];
  select: [game: any];
}>();

const keyword = ref('');
const searchInput = ref<HTMLInputElement>();
const showSuggestions = ref(false);
const suggestions = ref<any[]>([]);
const highlightedIndex = ref(-1);

// 搜索游戏
const searchGames = (keyword: string) => {
  if (!keyword.trim()) {
    return [];
  }

  const lowerKeyword = keyword.toLowerCase();
  return props.games.filter(game => {
    const nameMatch = game.gameName?.toLowerCase().includes(lowerKeyword);
    const descMatch = game.description?.toLowerCase().includes(lowerKeyword);
    const categoryMatch = game.category?.toLowerCase().includes(lowerKeyword);
    return nameMatch || descMatch || categoryMatch;
  }).slice(0, 8); // 最多显示8个建议
};

function handleInput() {
  suggestions.value = searchGames(keyword.value);
  highlightedIndex.value = -1;
}

function handleSearch() {
  if (keyword.value.trim()) {
    emit('search', keyword.value);
    showSuggestions.value = false;
  }
}

function handleFocus() {
  if (keyword.value.trim()) {
    suggestions.value = searchGames(keyword.value);
    showSuggestions.value = true;
  }
}

function handleBlur() {
  // 延迟隐藏，以便点击建议项
  setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
}

function handleClear() {
  keyword.value = '';
  suggestions.value = [];
  showSuggestions.value = false;
  emit('search', '');
}

function selectSuggestion(game: any) {
  keyword.value = game.gameName;
  showSuggestions.value = false;
  emit('select', game);
}

// 监听外部游戏列表变化
watch(() => props.games, () => {
  if (keyword.value.trim()) {
    suggestions.value = searchGames(keyword.value);
  }
});

// 键盘导航
watch(keyword, async (newValue) => {
  if (newValue.trim()) {
    suggestions.value = searchGames(newValue);
    showSuggestions.value = true;
  } else {
    suggestions.value = [];
    showSuggestions.value = false;
  }
});
</script>

<style scoped>
.search-box {
  position: relative;
  width: 100%;
  max-width: 500px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  border: 2px solid transparent;
}

.search-input-wrapper:focus-within {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.search-icon {
  padding: 0 12px;
  font-size: 1.1rem;
  color: #999;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 12px 8px;
  font-size: 0.95rem;
  background: transparent;
  color: #333;
}

.search-input::placeholder {
  color: #aaa;
}

.clear-button {
  padding: 8px 12px;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  margin-right: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #666;
  transition: all 0.2s;
}

.clear-button:hover {
  background: #e5e7eb;
  color: #333;
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-height: 400px;
  overflow-y: auto;
  z-index: 100;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f3f4f6;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item.highlighted {
  background: #f9fafb;
}

.suggestion-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.suggestion-info {
  flex: 1;
  min-width: 0;
}

.suggestion-name {
  display: block;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
  margin-bottom: 2px;
}

.suggestion-desc {
  display: block;
  font-size: 0.8rem;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-results {
  padding: 20px;
  text-align: center;
  color: #999;
}

.no-results-icon {
  display: block;
  font-size: 2rem;
  margin-bottom: 8px;
}

.no-results-text {
  font-size: 0.9rem;
}

/* 滚动条样式 */
.search-suggestions::-webkit-scrollbar {
  width: 6px;
}

.search-suggestions::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.search-suggestions::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.search-suggestions::-webkit-scrollbar-thumb:hover {
  background: #999;
}

@media (max-width: 768px) {
  .search-box {
    max-width: 100%;
  }

  .search-input {
    padding: 10px 6px;
    font-size: 0.9rem;
  }

  .search-suggestions {
    max-height: 300px;
  }

  .suggestion-item {
    padding: 10px 12px;
  }
}
</style>
