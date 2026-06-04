<template>
  <div class="game-advanced-filter">
    <!-- 快速筛选工具栏 -->
    <div class="filter-toolbar">
      <!-- 搜索框 -->
      <div class="search-section">
        <div class="search-wrapper">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索游戏名称、描述或标签..."
            class="search-input"
            @input="onSearchInput"
          />
          <button class="search-btn" @click="applySearch">
            <span class="search-icon">🔍</span>
          </button>
          <button v-if="searchKeyword" class="clear-btn" @click="clearSearch">
            <span class="clear-icon">×</span>
          </button>
        </div>
      </div>

      <!-- 快速筛选按钮 -->
      <div class="quick-filters">
        <button
          v-for="filter in quickFilters"
          :key="filter.id"
          class="quick-filter-btn"
          :class="{ active: activeQuickFilter === filter.id }"
          @click="toggleQuickFilter(filter.id)"
        >
          <span class="filter-icon">{{ filter.icon }}</span>
          <span class="filter-label">{{ filter.label }}</span>
          <span v-if="filter.badge" class="filter-badge">{{ filter.badge }}</span>
        </button>
      </div>
    </div>

    <!-- 高级筛选面板 -->
    <div v-if="showAdvancedPanel" class="advanced-filter-panel">
      <div class="panel-header">
        <h3 class="panel-title">高级筛选</h3>
        <button class="collapse-btn" @click="toggleAdvancedPanel">
          <span class="collapse-icon">▲</span>
        </button>
      </div>

      <div class="filter-sections">
        <!-- 分类筛选 -->
        <div class="filter-section">
          <h4 class="section-title">
            <span class="section-icon">📂</span>
            游戏分类
          </h4>
          <div class="category-filters">
            <div class="main-categories">
              <div
                v-for="category in categories"
                :key="category.id"
                class="category-item"
                :class="{ active: selectedCategory === category.id }"
                @click="selectCategory(category.id)"
              >
                <span class="category-icon">{{ category.icon }}</span>
                <span class="category-name">{{ category.name }}</span>
                <span class="category-count">{{ category.count }}</span>
              </div>
            </div>

            <!-- 子分类 -->
            <div v-if="selectedCategory && subCategories[selectedCategory]" class="sub-categories">
              <div class="sub-category-header">
                <span class="sub-title">子分类</span>
                <button
                  v-if="selectedSubCategory"
                  class="clear-sub-btn"
                  @click="clearSubCategory"
                >
                  清除
                </button>
              </div>
              <div class="sub-category-grid">
                <button
                  v-for="subCat in subCategories[selectedCategory]"
                  :key="subCat.id"
                  class="sub-category-btn"
                  :class="{ active: selectedSubCategory === subCat.id }"
                  @click="selectSubCategory(subCat.id)"
                >
                  {{ subCat.name }}
                  <span class="sub-count">{{ subCat.count }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 难度筛选 -->
        <div class="filter-section">
          <h4 class="section-title">
            <span class="section-icon">🎯</span>
            难度级别
          </h4>
          <div class="difficulty-filters">
            <button
              v-for="diff in difficulties"
              :key="diff.id"
              class="difficulty-btn"
              :class="{
                active: selectedDifficulties.includes(diff.id),
                [diff.id]: true
              }"
              @click="toggleDifficulty(diff.id)"
            >
              <span class="diff-icon">{{ diff.icon }}</span>
              <span class="diff-label">{{ diff.label }}</span>
            </button>
          </div>
        </div>

        <!-- 标签筛选 -->
        <div class="filter-section">
          <h4 class="section-title">
            <span class="section-icon">🏷️</span>
            游戏标签
          </h4>
          <div class="tag-filters">
            <div class="tag-cloud">
              <button
                v-for="tag in popularTags"
                :key="tag.id"
                class="tag-btn"
                :class="{ active: selectedTags.includes(tag.id) }"
                @click="toggleTag(tag.id)"
              >
                {{ tag.name }}
                <span class="tag-count">{{ tag.count }}</span>
              </button>
            </div>
            <div v-if="selectedTags.length > 0" class="selected-tags">
              <div class="selected-header">已选标签：</div>
              <div class="selected-tags-list">
                <span
                  v-for="tagId in selectedTags"
                  :key="tagId"
                  class="selected-tag"
                >
                  {{ getTagName(tagId) }}
                  <button class="remove-tag-btn" @click="removeTag(tagId)">
                    ×
                  </button>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 玩家数量筛选 -->
        <div class="filter-section">
          <h4 class="section-title">
            <span class="section-icon">👥</span>
            玩家人数
          </h4>
          <div class="player-count-filters">
            <div class="player-range">
              <label class="range-label">最少玩家：{{ minPlayers }}人</label>
              <input
                v-model="minPlayers"
                type="range"
                min="1"
                max="10"
                step="1"
                class="range-slider"
                @input="onPlayerRangeChange"
              />
            </div>
            <div class="player-range">
              <label class="range-label">最多玩家：{{ maxPlayers }}人</label>
              <input
                v-model="maxPlayers"
                type="range"
                min="1"
                max="20"
                step="1"
                class="range-slider"
                @input="onPlayerRangeChange"
              />
            </div>
          </div>
        </div>

        <!-- 排序选项 -->
        <div class="filter-section">
          <h4 class="section-title">
            <span class="section-icon">↕️</span>
            排序方式
          </h4>
          <div class="sort-options">
            <div class="sort-buttons">
              <button
                v-for="sort in sortOptions"
                :key="sort.id"
                class="sort-btn"
                :class="{ active: sortBy === sort.id }"
                @click="selectSort(sort.id)"
              >
                {{ sort.label }}
              </button>
            </div>
            <div class="sort-order">
              <button
                class="order-btn"
                :class="{ active: sortOrder === 'asc' }"
                @click="setSortOrder('asc')"
              >
                升序
              </button>
              <button
                class="order-btn"
                :class="{ active: sortOrder === 'desc' }"
                @click="setSortOrder('desc')"
              >
                降序
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="apply-btn" @click="applyFilters">
          <span class="apply-icon">✓</span>
          应用筛选
        </button>
        <button class="reset-btn" @click="resetFilters">
          <span class="reset-icon">↺</span>
          重置筛选
        </button>
        <button class="save-preset-btn" @click="saveFilterPreset">
          <span class="save-icon">💾</span>
          保存预设
        </button>
      </div>
    </div>

    <!-- 展开/收起按钮 -->
    <div class="expand-bar">
      <button class="expand-btn" @click="toggleAdvancedPanel">
        <span class="expand-icon">{{ showAdvancedPanel ? '收起筛选' : '展开高级筛选' }}</span>
        <span class="expand-arrow">{{ showAdvancedPanel ? '▲' : '▼' }}</span>
      </button>
      <div v-if="activeFilterCount > 0" class="active-filters-info">
        <span class="info-text">
          已激活{{ activeFilterCount }}个筛选条件
        </span>
        <button class="clear-all-btn" @click="resetFilters">
          清除全部
        </button>
      </div>
    </div>

    <!-- 筛选结果统计 -->
    <div v-if="filteredGames.length > 0" class="filter-stats">
      <div class="stats-item">
        <span class="stats-label">找到</span>
        <span class="stats-value">{{ filteredGames.length }}</span>
        <span class="stats-label">款游戏</span>
      </div>
      <div v-if="selectedCategory" class="stats-item">
        <span class="stats-label">分类：</span>
        <span class="stats-value">{{ getCategoryName(selectedCategory) }}</span>
      </div>
      <div v-if="selectedSubCategory" class="stats-item">
        <span class="stats-label">子类：</span>
        <span class="stats-value">{{ getSubCategoryName(selectedSubCategory) }}</span>
      </div>
      <div v-if="selectedDifficulties.length > 0" class="stats-item">
        <span class="stats-label">难度：</span>
        <span class="stats-value">{{ selectedDifficulties.map(d => getDifficultyName(d)).join('、') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { GameFilterCriteria, GameCategory, GameSubCategory, GameThemeTag, GameDifficulty } from '@/types/game.types'

// Props
interface Props {
  games?: any[] // 游戏列表
  onFilterChange?: (criteria: GameFilterCriteria) => void
  onSearch?: (keyword: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  games: () => [],
  onFilterChange: () => {},
  onSearch: () => {}
})

// Emits
const emit = defineEmits<{
  filterChange: [criteria: GameFilterCriteria]
  search: [keyword: string]
  reset: []
}>()

// 搜索关键词
const searchKeyword = ref('')
const searchTimeout = ref<NodeJS.Timeout>()

// 筛选状态
const showAdvancedPanel = ref(false)
const activeQuickFilter = ref<string>('')

// 分类筛选
const selectedCategory = ref<GameCategory | ''>('')
const selectedSubCategory = ref<GameSubCategory | ''>('')

// 难度筛选
const selectedDifficulties = ref<GameDifficulty[]>([])

// 标签筛选
const selectedTags = ref<GameThemeTag[]>([])

// 玩家数量筛选
const minPlayers = ref(1)
const maxPlayers = ref(20)

// 排序选项
const sortBy = ref<'name' | 'difficulty' | 'rating' | 'popularity' | 'playCount' | 'recent'>('popularity')
const sortOrder = ref<'asc' | 'desc'>('desc')

// 分类数据（模拟）
const categories = ref([
  { id: 'educational' as GameCategory, name: '教育类', icon: '📚', count: 45 },
  { id: 'entertainment' as GameCategory, name: '娱乐类', icon: '🎉', count: 38 },
  { id: 'puzzle' as GameCategory, name: '益智类', icon: '🧩', count: 32 },
  { id: 'action' as GameCategory, name: '动作类', icon: '⚡', count: 27 },
  { id: 'adventure' as GameCategory, name: '冒险类', icon: '🗺️', count: 21 },
  { id: 'strategy' as GameCategory, name: '策略类', icon: '♟️', count: 18 },
  { id: 'simulation' as GameCategory, name: '模拟类', icon: '🏭', count: 15 },
  { id: 'sports' as GameCategory, name: '体育类', icon: '⚽', count: 12 },
  { id: 'music' as GameCategory, name: '音乐类', icon: '🎵', count: 9 },
  { id: 'art' as GameCategory, name: '艺术类', icon: '🎨', count: 7 },
])

const subCategories = ref<Record<GameCategory, any[]>>({
  educational: [
    { id: 'math', name: '数学游戏', count: 15 },
    { id: 'language', name: '语言学习', count: 12 },
    { id: 'science', name: '科学探索', count: 10 },
    { id: 'geography', name: '地理知识', count: 5 },
    { id: 'history', name: '历史故事', count: 3 },
  ],
  entertainment: [
    { id: 'shooting', name: '射击游戏', count: 10 },
    { id: 'racing', name: '赛车游戏', count: 8 },
    { id: 'platform', name: '平台跳跃', count: 7 },
    { id: 'fighting', name: '格斗游戏', count: 6 },
    { id: 'arcade', name: '街机游戏', count: 5 },
  ],
  puzzle: [
    { id: 'memory', name: '记忆游戏', count: 8 },
    { id: 'pattern', name: '模式识别', count: 7 },
    { id: 'maze', name: '迷宫解谜', count: 6 },
    { id: 'matching', name: '配对游戏', count: 5 },
    { id: 'logic', name: '逻辑推理', count: 4 },
  ],
  action: [],
  adventure: [],
  strategy: [],
  simulation: [],
  sports: [],
  music: [],
  art: [],
})

// 难度选项
const difficulties = ref([
  { id: 'easy' as GameDifficulty, label: '简单', icon: '😊' },
  { id: 'medium' as GameDifficulty, label: '中等', icon: '😐' },
  { id: 'hard' as GameDifficulty, label: '困难', icon: '😅' },
  { id: 'expert' as GameDifficulty, label: '专家', icon: '🤯' },
])

// 热门标签
const popularTags = ref([
  { id: 'math' as GameThemeTag, name: '数学', count: 28 },
  { id: 'puzzle' as GameThemeTag, name: '解谜', count: 25 },
  { id: 'adventure' as GameThemeTag, name: '冒险', count: 22 },
  { id: 'action' as GameThemeTag, name: '动作', count: 20 },
  { id: 'cartoon' as GameThemeTag, name: '卡通', count: 18 },
  { id: 'multiplayer' as GameThemeTag, name: '多人游戏', count: 16 },
  { id: 'educational' as GameThemeTag, name: '教育', count: 15 },
  { id: 'science' as GameThemeTag, name: '科学', count: 12 },
  { id: 'arcade' as GameThemeTag, name: '街机', count: 10 },
  { id: 'strategy' as GameThemeTag, name: '策略', count: 8 },
  { id: 'language' as GameThemeTag, name: '语言', count: 7 },
  { id: 'music' as GameThemeTag, name: '音乐', count: 6 },
])

// 快速筛选
const quickFilters = ref([
  { id: 'popular', label: '热门游戏', icon: '🔥', badge: '24' },
  { id: 'new', label: '最新上架', icon: '🆕', badge: '8' },
  { id: 'multiplayer', label: '多人游戏', icon: '👥', badge: '16' },
  { id: 'educational', label: '教育游戏', icon: '📚', badge: '45' },
  { id: 'free', label: '免费游戏', icon: '🆓', badge: '32' },
  { id: 'offline', label: '离线游戏', icon: '📴', badge: '28' },
])

// 排序选项
const sortOptions = ref([
  { id: 'popularity', label: '热门度' },
  { id: 'rating', label: '评分' },
  { id: 'name', label: '名称' },
  { id: 'difficulty', label: '难度' },
  { id: 'playCount', label: '游玩次数' },
  { id: 'recent', label: '最近更新' },
])

// 计算属性
const activeFilterCount = computed(() => {
  let count = 0
  if (selectedCategory.value) count++
  if (selectedSubCategory.value) count++
  if (selectedDifficulties.value.length > 0) count++
  if (selectedTags.value.length > 0) count++
  if (minPlayers.value > 1 || maxPlayers.value < 20) count++
  if (searchKeyword.value) count++
  return count
})

const filteredGames = computed(() => {
  // 这里应该根据筛选条件过滤游戏列表
  // 暂时返回所有游戏
  return props.games
})

// 辅助函数
function getCategoryName(categoryId: GameCategory): string {
  const category = categories.value.find(c => c.id === categoryId)
  return category?.name || categoryId
}

function getSubCategoryName(subCategoryId: GameSubCategory): string {
  if (!selectedCategory.value) return subCategoryId
  const subCat = subCategories.value[selectedCategory.value]?.find(sc => sc.id === subCategoryId)
  return subCat?.name || subCategoryId
}

function getDifficultyName(difficultyId: GameDifficulty): string {
  const diff = difficulties.value.find(d => d.id === difficultyId)
  return diff?.label || difficultyId
}

function getTagName(tagId: GameThemeTag): string {
  const tag = popularTags.value.find(t => t.id === tagId)
  return tag?.name || tagId
}

// 搜索相关方法
function onSearchInput() {
  // 防抖处理
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  searchTimeout.value = setTimeout(() => {
    applySearch()
  }, 500)
}

function applySearch() {
  emit('search', searchKeyword.value)
  applyFilters()
}

function clearSearch() {
  searchKeyword.value = ''
  emit('search', '')
  applyFilters()
}

// 筛选相关方法
function toggleQuickFilter(filterId: string) {
  if (activeQuickFilter.value === filterId) {
    activeQuickFilter.value = ''
  } else {
    activeQuickFilter.value = filterId
  }
  // 根据快速筛选应用相应的筛选条件
  applyQuickFilter(filterId)
}

function applyQuickFilter(filterId: string) {
  // 根据快速筛选ID应用不同的筛选条件
  const criteria: Partial<GameFilterCriteria> = {}
  
  switch (filterId) {
    case 'popular':
      criteria.sortBy = 'popularity'
      criteria.sortOrder = 'desc'
      break
    case 'new':
      criteria.sortBy = 'recent'
      criteria.sortOrder = 'desc'
      break
    case 'multiplayer':
      criteria.tags = ['multiplayer' as GameThemeTag]
      break
    case 'educational':
      criteria.category = 'educational'
      break
    case 'free':
      // 这里可能需要额外的字段来表示免费游戏
      break
    case 'offline':
      criteria.tags = ['offline' as GameThemeTag]
      break
  }
  
  emit('filterChange', criteria as GameFilterCriteria)
}

function selectCategory(categoryId: GameCategory) {
  if (selectedCategory.value === categoryId) {
    selectedCategory.value = ''
    selectedSubCategory.value = ''
  } else {
    selectedCategory.value = categoryId
  }
}

function selectSubCategory(subCategoryId: GameSubCategory) {
  selectedSubCategory.value = subCategoryId
}

function clearSubCategory() {
  selectedSubCategory.value = ''
}

function toggleDifficulty(difficultyId: GameDifficulty) {
  const index = selectedDifficulties.value.indexOf(difficultyId)
  if (index === -1) {
    selectedDifficulties.value.push(difficultyId)
  } else {
    selectedDifficulties.value.splice(index, 1)
  }
}

function toggleTag(tagId: GameThemeTag) {
  const index = selectedTags.value.indexOf(tagId)
  if (index === -1) {
    selectedTags.value.push(tagId)
  } else {
    selectedTags.value.splice(index, 1)
  }
}

function removeTag(tagId: GameThemeTag) {
  const index = selectedTags.value.indexOf(tagId)
  if (index !== -1) {
    selectedTags.value.splice(index, 1)
  }
}

function onPlayerRangeChange() {
  // 确保最小玩家数不大于最大玩家数
  if (minPlayers.value > maxPlayers.value) {
    minPlayers.value = maxPlayers.value
  }
}

function selectSort(sortId: typeof sortBy.value) {
  sortBy.value = sortId
}

function setSortOrder(order: 'asc' | 'desc') {
  sortOrder.value = order
}

function applyFilters() {
  const criteria: GameFilterCriteria = {
    category: selectedCategory.value || undefined,
    subCategory: selectedSubCategory.value || undefined,
    tags: selectedTags.value.length > 0 ? selectedTags.value : undefined,
    difficulty: selectedDifficulties.value.length > 0 ? selectedDifficulties.value : undefined,
    minPlayers: minPlayers.value > 1 ? minPlayers.value : undefined,
    maxPlayers: maxPlayers.value < 20 ? maxPlayers.value : undefined,
    sortBy: sortBy.value,
    sortOrder: sortOrder.value,
    keyword: searchKeyword.value || undefined,
  }
  
  emit('filterChange', criteria)
}

function resetFilters() {
  selectedCategory.value = ''
  selectedSubCategory.value = ''
  selectedDifficulties.value = []
  selectedTags.value = []
  minPlayers.value = 1
  maxPlayers.value = 20
  sortBy.value = 'popularity'
  sortOrder.value = 'desc'
  searchKeyword.value = ''
  activeQuickFilter.value = ''
  
  emit('reset')
  emit('filterChange', {})
}

function toggleAdvancedPanel() {
  showAdvancedPanel.value = !showAdvancedPanel.value
}

function saveFilterPreset() {
  // 保存筛选预设
  const preset = {
    name: '我的筛选预设',
    criteria: {
      category: selectedCategory.value,
      subCategory: selectedSubCategory.value,
      tags: selectedTags.value,
      difficulties: selectedDifficulties.value,
      minPlayers: minPlayers.value,
      maxPlayers: maxPlayers.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
    },
    timestamp: new Date().toISOString(),
  }
  
  // 保存到本地存储
  const presets = JSON.parse(localStorage.getItem('game-filter-presets') || '[]')
  presets.push(preset)
  localStorage.setItem('game-filter-presets', JSON.stringify(presets))
  
  alert('筛选预设已保存！')
}

// 生命周期
onMounted(() => {
  // 加载保存的筛选预设
  // ...
})
</script>

<style scoped lang="scss">
.game-advanced-filter {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 24px;
}

/* 快速筛选工具栏 */
.filter-toolbar {
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
  border-bottom: 1px solid #e2e8f0;
}

.search-section {
  margin-bottom: 16px;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  padding-right: 48px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  color: #4a5568;
  background: white;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4ECDC4;
    box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.1);
  }

  &::placeholder {
    color: #a0aec0;
  }
}

.search-btn {
  position: absolute;
  right: 40px;
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #718096;
  transition: color 0.2s;

  &:hover {
    color: #4ECDC4;
  }
}

.clear-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #a0aec0;
  font-size: 18px;
  transition: color 0.2s;

  &:hover {
    color: #e53e3e;
  }
}

.quick-filters {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: #edf2f7;
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 2px;
  }
}

.quick-filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  color: #4a5568;
  font-size: 13px;
  font-weight: 500;

  &:hover {
    background: #f7fafc;
    border-color: #cbd5e0;
  }

  &.active {
    background: linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%);
    border-color: #4ECDC4;
    color: white;
    box-shadow: 0 2px 8px rgba(78, 205, 196, 0.3);
  }
}

.filter-icon {
  font-size: 14px;
}

.filter-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

/* 高级筛选面板 */
.advanced-filter-panel {
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #4a5568;
}

.collapse-btn {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: #718096;
  transition: color 0.2s;

  &:hover {
    color: #4ECDC4;
  }
}

.filter-sections {
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.filter-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
}

.section-icon {
  font-size: 16px;
}

/* 分类筛选 */
.category-filters {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-categories {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #edf2f7;
    border-color: #cbd5e0;
  }

  &.active {
    background: linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%);
    border-color: #4ECDC4;
    color: white;
  }
}

.category-icon {
  font-size: 14px;
}

.category-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
}

.category-count {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
}

.category-item.active .category-count {
  background: rgba(255, 255, 255, 0.3);
}

.sub-categories {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e2e8f0;
}

.sub-category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.sub-title {
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
}

.clear-sub-btn {
  background: none;
  border: 1px solid #e2e8f0;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  color: #718096;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #cbd5e0;
    color: #4a5568;
  }
}

.sub-category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 6px;
}

.sub-category-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #cbd5e0;
  }

  &.active {
    background: #4ECDC4;
    border-color: #4ECDC4;
    color: white;
  }
}

.sub-count {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.2);
  padding: 1px 5px;
  border-radius: 8px;
}

.sub-category-btn.active .sub-count {
  background: rgba(255, 255, 255, 0.3);
}

/* 难度筛选 */
.difficulty-filters {
  display: flex;
  gap: 8px;
}

.difficulty-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  color: #4a5568;

  &:hover {
    background: #edf2f7;
    border-color: #cbd5e0;
  }

  &.active {
    color: white;
    border-color: currentColor;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &.easy.active {
    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  }

  &.medium.active {
    background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
  }

  &.hard.active {
    background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
  }

  &.expert.active {
    background: linear-gradient(135deg, #805ad5 0%, #6b46c1 100%);
  }
}

.diff-icon {
  font-size: 16px;
}

.diff-label {
  font-size: 12px;
  font-weight: 600;
}

/* 标签筛选 */
.tag-filters {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 12px;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #cbd5e0;
    transform: translateY(-1px);
  }

  &.active {
    background: linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%);
    border-color: #4ECDC4;
    color: white;
  }
}

.tag-count {
  font-size: 10px;
  background: rgba(255, 255, 255, 0.2);
  padding: 1px 5px;
  border-radius: 10px;
}

.tag-btn.active .tag-count {
  background: rgba(255, 255, 255, 0.3);
}

.selected-tags {
  background: #f1f5f9;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e2e8f0;
}

.selected-header {
  font-size: 12px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
}

.selected-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.selected-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: white;
  border: 1px solid #4ECDC4;
  border-radius: 20px;
  font-size: 12px;
  color: #4ECDC4;
}

.remove-tag-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 14px;
  color: #a0aec0;
  cursor: pointer;
  line-height: 1;

  &:hover {
    color: #e53e3e;
  }
}

/* 玩家数量筛选 */
.player-count-filters {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.player-range {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.range-label {
  font-size: 12px;
  font-weight: 600;
  color: #4a5568;
}

.range-slider {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    background: #4ECDC4;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

/* 排序选项 */
.sort-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sort-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 6px;
}

.sort-btn {
  padding: 8px 10px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #cbd5e0;
  }

  &.active {
    background: #4ECDC4;
    border-color: #4ECDC4;
    color: white;
  }
}

.sort-order {
  display: flex;
  gap: 8px;
}

.order-btn {
  flex: 1;
  padding: 8px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #cbd5e0;
  }

  &.active {
    background: #4ECDC4;
    border-color: #4ECDC4;
    color: white;
  }
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
  background: white;
}

.apply-btn,
.reset-btn,
.save-preset-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.apply-btn {
  background: linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%);
  color: white;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
  }
}

.reset-btn {
  background: white;
  border: 2px solid #e2e8f0;
  color: #718096;

  &:hover {
    border-color: #cbd5e0;
    color: #4a5568;
  }
}

.save-preset-btn {
  background: white;
  border: 2px solid #4ECDC4;
  color: #4ECDC4;

  &:hover {
    background: #f7fafc;
  }
}

/* 展开/收起区域 */
.expand-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: white;
  border-top: 1px solid #e2e8f0;
}

.expand-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  padding: 8px;
  font-size: 14px;
  color: #4ECDC4;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #45B7D1;
  }
}

.expand-icon {
  font-weight: 500;
}

.expand-arrow {
  font-size: 12px;
}

.active-filters-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-text {
  font-size: 13px;
  color: #718096;
}

.clear-all-btn {
  background: none;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  color: #718096;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #cbd5e0;
    color: #4a5568;
  }
}

/* 筛选结果统计 */
.filter-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.stats-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
}

.stats-label {
  color: #718096;
}

.stats-value {
  font-weight: 600;
  color: #4a5568;
}
</style>