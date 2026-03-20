<template>
  <section class="official-themes">
    <div class="section-header">
      <h2 class="section-title">
        <span class="title-icon">🏛️</span>
        <span class="title-text">官方主题</span>
      </h2>
      
      <!-- 筛选器 -->
      <div class="theme-filters">
        <button 
          v-for="filter in filters" 
          :key="filter.id"
          class="filter-btn"
          :class="{ active: currentFilter === filter.id }"
          @click="currentFilter = filter.id"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在加载官方主题...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="filteredThemes.length === 0" class="empty-state">
      <div class="empty-illustration">🎨</div>
      <h3>暂无官方主题</h3>
      <p>敬请期待更多精彩主题!</p>
    </div>

    <!-- 主题列表 -->
    <div v-else class="official-themes-grid">
      <div 
        v-for="theme in filteredThemes" 
        :key="theme.id"
        class="official-theme-card"
      >
        <div class="theme-header">
          <div class="theme-type-badge" :class="theme.type">
            {{ theme.type === 'game' ? '🎮 游戏' : '💼 应用' }}
          </div>
          <span class="theme-category">{{ theme.category }}</span>
        </div>
        
        <div class="theme-info">
          <h3 class="theme-name">{{ theme.name }}</h3>
          <p class="theme-desc">{{ theme.description }}</p>
        </div>
        
        <div class="theme-actions">
          <button class="btn-action btn-view" @click="handleView(theme)">
            <span class="action-icon">👁️</span>
            <span>查看</span>
          </button>
          <button class="btn-action btn-diy" @click="handleDIY(theme)">
            <span class="action-icon">✨</span>
            <span>DIY</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { CloudThemeInfo } from '@/core/theme/ThemeManager';

// Props
const props = defineProps<{
  themes: Array<{
    id: string;
    name: string;
    type: 'game' | 'app';
    category: string;
    description: string;
    baseThemeKey: string;
    styleOverrides?: any;
    assetOverrides?: any;
  }>;
  loading?: boolean;
}>();

// Emits
const emit = defineEmits<{
  view: [theme: any];
  diy: [theme: any];
}>();

// 筛选器配置
const filters = [
  { id: 'all', label: '全部' },
  { id: 'game', label: '🎮 游戏' },
  { id: 'app', label: '💼 应用' },
];

// 当前筛选
const currentFilter = ref('all');

// 计算筛选后的主题
const filteredThemes = computed(() => {
  if (currentFilter.value === 'all') {
    return props.themes;
  }
  return props.themes.filter(theme => theme.type === currentFilter.value);
});

// 处理查看
function handleView(theme: any) {
  emit('view', theme);
}

// 处理 DIY
function handleDIY(theme: any) {
  emit('diy', theme);
}
</script>

<style scoped lang="scss">
.official-themes {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 24px;
    color: #2d3748;
  }

  .title-icon {
    font-size: 28px;
  }
}

.theme-filters {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(78, 205, 196, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  color: #666;

  &:hover {
    background: white;
    border-color: #4ECDC4;
  }

  &.active {
    background: linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%);
    color: white;
    border-color: transparent;
    box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
  }
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: #4ECDC4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-illustration {
  font-size: 64px;
  margin-bottom: 16px;
}

.official-themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.official-theme-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

.theme-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.theme-type-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;

  &.game {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  &.app {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
  }
}

.theme-category {
  font-size: 12px;
  color: #718096;
}

.theme-info {
  padding: 16px;
}

.theme-name {
  font-size: 18px;
  color: #2d3748;
  margin-bottom: 8px;
}

.theme-desc {
  font-size: 14px;
  color: #718096;
  line-height: 1.5;
}

.theme-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
}

.btn-action {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &.btn-view {
    background: rgba(102, 126, 234, 0.1);
    color: #667eea;

    &:hover {
      background: rgba(102, 126, 234, 0.2);
    }
  }

  &.btn-diy {
    background: linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%);
    color: white;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(78, 205, 196, 0.4);
    }
  }
}

.action-icon {
  font-size: 16px;
}
</style>
