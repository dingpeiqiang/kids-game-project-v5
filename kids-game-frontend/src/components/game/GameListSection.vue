<template>
  <section class="games-section" :class="[variant]">
    <!-- 游戏分类 -->
    <div v-if="showCategories" class="category-section">
      <h3 class="section-title-with-icon">
        <span>🎮</span>
        <span>游戏分类</span>
      </h3>
      <div class="category-tabs">
        <button
          v-for="category in categories"
          :key="category.id"
          class="category-btn"
          :class="{ active: currentCategory === category.id }"
          @click="$emit('selectCategory', category.id)"
        >
          <span class="category-icon">{{ category.icon }}</span>
          <span class="category-name">{{ category.name }}</span>
          <span v-if="category.count" class="category-count">{{ category.count }}</span>
        </button>
      </div>
    </div>

    <!-- 游戏列表标题 -->
    <div class="game-list-section">
      <h3 class="section-title-with-icon">
        <span>{{ currentCategoryIcon }}</span>
        <span>{{ currentCategoryName }}</span>
        <span v-if="showCount && filteredGames.length > 0" class="game-count">({{ filteredGames.length }}个游戏)</span>
      </h3>

      <!-- 加载中 -->
      <div v-if="isLoading" class="loading">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="filteredGames.length === 0" class="empty">
        <div class="empty-icon">🎁</div>
        <p>这个分类还没有游戏哦~</p>
        <button v-if="showViewAll" @click="$emit('selectCategory', 'all')" class="view-all-btn">
          查看全部游戏
        </button>
      </div>

      <!-- 游戏网格 -->
      <div v-else class="game-grid">
        <UnifiedGameCard
          v-for="game in filteredGames"
          :key="game.gameId"
          :game="game"
          :default-theme-name="game.defaultThemeName"
          variant="blue-purple"
          @play="$emit('playGame', game)"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import UnifiedGameCard from './UnifiedGameCard.vue';

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
  defaultThemeName?: string; // 默认主题名称
}

const props = withDefaults(defineProps<{
  variant?: 'kids' | 'parent';
  showCategories?: boolean;
  showCount?: boolean;
  showViewAll?: boolean;
  categories: Category[];
  currentCategory: string;
  currentCategoryName: string;
  filteredGames: Game[];
  isLoading: boolean;
}>(), {
  variant: 'kids',
  showCategories: false,
  showCount: true,
  showViewAll: true,
  categories: () => [],
  filteredGames: () => [],
  isLoading: false,
});

defineEmits<{
  selectCategory: [categoryId: string];
  playGame: [game: Game];
}>();

// 当前分类图标
const currentCategoryIcon = computed(() => {
  if (props.currentCategory === 'all') return '🎯';
  const category = props.categories.find(c => c.id === props.currentCategory);
  return category?.icon || '🎮';
});
</script>

<style scoped>
/* 儿童风格 */
.games-section.kids {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

/* 家长风格 */
.games-section.parent {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 分类区域 */
.category-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
}

.section-title-with-icon {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.3rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 1.5rem;
}

.game-count {
  font-size: 0.9rem;
  color: #667eea;
  font-weight: normal;
}

/* 分类标签 */
.category-tabs {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  color: #666;
}

.category-btn:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.category-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.category-icon {
  font-size: 1.2rem;
}

.category-name {
  font-size: 0.95rem;
}

.category-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.1rem 0.5rem;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: bold;
}

.category-btn:not(.active) .category-count {
  background: #f3f4f6;
  color: #666;
}

/* 游戏列表区域 */
.game-list-section {
  min-height: 400px;
}

/* 加载和空状态 */
.loading,
.empty {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  margin: 0 auto 1.5rem;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.view-all-btn {
  margin-top: 1.5rem;
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.view-all-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

/* 游戏网格 */
.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* 响应式 */
@media (max-width: 1024px) {
  .game-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1.25rem;
  }
}

@media (max-width: 768px) {
  .games-section {
    padding: 1.5rem;
    border-radius: 20px;
  }

  .category-tabs {
    gap: 0.5rem;
  }

  .category-btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.9rem;
  }

  .section-title-with-icon {
    font-size: 1.15rem;
  }

  .game-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .games-section {
    padding: 1.25rem;
    border-radius: 16px;
  }

  .category-tabs {
    gap: 0.5rem;
  }

  .category-btn {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }

  .category-icon {
    font-size: 1rem;
  }

  .section-title-with-icon {
    font-size: 1.05rem;
  }

  .game-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 0.875rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
  }

  .empty-icon {
    font-size: 4rem;
  }
}
</style>
