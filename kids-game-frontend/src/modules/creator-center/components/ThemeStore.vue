<template>
  <section class="theme-store">
    <div class="section-header">
      <h2 class="section-title">
        <span class="title-icon">🛍️</span>
        <span class="title-text">主题商店</span>
      </h2>
      
      <!-- 筛选器 -->
      <div class="store-filters">
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
      <p>正在加载主题商店...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="filteredThemes.length === 0" class="empty-state">
      <div class="empty-illustration">🏪</div>
      <h3>暂无主题</h3>
      <p>换个筛选条件看看吧~</p>
    </div>

    <!-- 主题列表 -->
    <div v-else class="store-grid">
      <div 
        v-for="theme in filteredThemes" 
        :key="theme.id"
        class="store-theme-card"
      >
        <div class="theme-thumbnail">
          <img 
            v-if="theme.thumbnail" 
            :src="theme.thumbnail" 
            :alt="theme.name"
            class="thumbnail-image"
          />
          <div v-else class="thumbnail-placeholder">
            <span class="placeholder-icon">🎨</span>
          </div>
          
          <div class="price-tag" :class="{ free: theme.price === 0 }">
            {{ theme.price === 0 ? '免费' : `¥${theme.price}` }}
          </div>
        </div>

        <div class="theme-info">
          <h3 class="theme-name">{{ theme.name }}</h3>
          <p class="theme-author">by {{ theme.author }}</p>
          <p class="theme-desc">{{ theme.description || '暂无描述' }}</p>
          
          <div class="theme-stats">
            <div class="stat-item">
              <span class="stat-icon">⬇️</span>
              <span>{{ theme.downloadCount || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">⭐</span>
              <span>{{ theme.rating || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <div class="theme-actions">
          <button class="btn-action btn-preview" @click="handlePreview(theme)">
            👁️ 预览
          </button>
          <button 
            class="btn-action btn-buy" 
            @click="handleBuyOrDownload(theme)"
          >
            {{ theme.price > 0 ? '购买' : '获取' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { CloudThemeInfo } from '@/core/theme/ThemeManager';

// Props
const props = defineProps<{
  themes: CloudThemeInfo[];
  loading?: boolean;
}>();

// Emits
const emit = defineEmits<{
  preview: [theme: CloudThemeInfo];
  buy: [theme: CloudThemeInfo];
  download: [themeId: string];
}>();

// 筛选器配置
const filters = [
  { id: 'all', label: '全部' },
  { id: 'free', label: '免费' },
  { id: 'paid', label: '付费' },
  { id: 'hot', label: '热门' },
  { id: 'new', label: '最新' },
];

// 当前筛选
const currentFilter = ref('all');

// 计算筛选后的主题
const filteredThemes = computed(() => {
  let result = [...props.themes];
  
  switch (currentFilter.value) {
    case 'free':
      return result.filter(t => t.price === 0);
    case 'paid':
      return result.filter(t => t.price > 0);
    case 'hot':
      return result.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
    case 'new':
      return result.sort((a, b) => b.createdAt - a.createdAt);
    default:
      return result;
  }
});

// 处理预览
function handlePreview(theme: CloudThemeInfo) {
  emit('preview', theme);
}

// 处理购买或下载
function handleBuyOrDownload(theme: CloudThemeInfo) {
  // TODO: 检查是否已购买逻辑
  emit('buy', theme);
}
</script>

<style scoped lang="scss">
.theme-store {
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

.store-filters {
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

.store-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.store-theme-card {
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

.theme-thumbnail {
  position: relative;
  height: 180px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 64px;
  opacity: 0.5;
}

.price-tag {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 20px;
  font-weight: bold;
  font-size: 14px;

  &.free {
    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  }
}

.theme-info {
  padding: 16px;
}

.theme-name {
  font-size: 18px;
  color: #2d3748;
  margin-bottom: 8px;
}

.theme-author {
  font-size: 14px;
  color: #718096;
  margin-bottom: 8px;
}

.theme-desc {
  font-size: 14px;
  color: #a0aec0;
  line-height: 1.5;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.theme-stats {
  display: flex;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #718096;
}

.stat-icon {
  font-size: 16px;
}

.theme-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
}

.btn-action {
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &.btn-preview {
    background: rgba(102, 126, 234, 0.1);
    color: #667eea;

    &:hover {
      background: rgba(102, 126, 234, 0.2);
    }
  }

  &.btn-buy {
    background: linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%);
    color: white;

    &:hover:not(.owned) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(78, 205, 196, 0.4);
    }

    &.owned {
      background: #e2e8f0;
      color: #718096;
      cursor: default;
    }
  }
}
</style>
