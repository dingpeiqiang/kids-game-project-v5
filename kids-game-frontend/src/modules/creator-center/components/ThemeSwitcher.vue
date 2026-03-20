<template>
  <section class="theme-switcher">
    <div class="section-header">
      <h2 class="section-title">
        <span class="title-icon">🎯</span>
        <span class="title-text">切换主题</span>
      </h2>
      
      <!-- 搜索框 -->
      <div class="search-box">
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="🔍 搜索主题..."
          class="search-input"
        />
      </div>
    </div>

    <!-- 当前主题 -->
    <div class="current-theme-section">
      <h3 class="section-subtitle">当前使用</h3>
      <div v-if="currentTheme" class="current-theme-card">
        <div class="theme-preview">
          <img 
            v-if="currentTheme.thumbnail" 
            :src="currentTheme.thumbnail" 
            :alt="currentTheme.name"
            class="preview-image"
          />
          <div v-else class="preview-placeholder">
            <span class="placeholder-icon">🎨</span>
          </div>
        </div>
        
        <div class="theme-info">
          <h4 class="theme-name">{{ currentTheme.name }}</h4>
          <p class="theme-author">by {{ currentTheme.author }}</p>
          <p class="theme-desc">{{ currentTheme.description || '暂无描述' }}</p>
        </div>
      </div>
    </div>

    <!-- 可用主题列表 -->
    <div class="available-themes-section">
      <h3 class="section-subtitle">可用主题</h3>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载主题列表...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="filteredThemes.length === 0" class="empty-state">
        <div class="empty-illustration">🔍</div>
        <h3>未找到匹配的主题</h3>
        <p>试试其他关键词吧~</p>
      </div>

      <!-- 主题列表 -->
      <div v-else class="themes-grid">
        <div 
          v-for="theme in filteredThemes" 
          :key="theme.key"
          class="theme-card"
          :class="{ active: currentTheme?.key === theme.key }"
          @click="handleSwitch(theme)"
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
            
            <div v-if="currentTheme?.key === theme.key" class="active-badge">
              ✓ 使用中
            </div>
          </div>

          <div class="theme-info">
            <h4 class="theme-name">{{ theme.name }}</h4>
            <p class="theme-author">by {{ theme.author }}</p>
            <p class="theme-desc">{{ truncate(theme.description, 30) }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ThemeConfig } from '@/core/theme/ThemeManager';
import { useConfirm } from '@/composables/useDialog';

// Props
const props = defineProps<{
  currentTheme: ThemeConfig | null;
  availableThemes: ThemeConfig[];
  loading?: boolean;
}>();

// Emits
const emit = defineEmits<{
  switch: [theme: ThemeConfig];
}>();

// 搜索关键词
const searchQuery = ref('');

// 计算筛选后的主题
const filteredThemes = computed(() => {
  if (!props.availableThemes) return [];
  
  if (!searchQuery.value) {
    return props.availableThemes;
  }
  
  const query = searchQuery.value.toLowerCase();
  return props.availableThemes.filter(theme => 
    theme.name.toLowerCase().includes(query) ||
    theme.author.toLowerCase().includes(query) ||
    (theme.description && theme.description.toLowerCase().includes(query))
  );
});

// 截断文本
function truncate(text: string | undefined, length: number): string {
  if (!text) return '';
  return text.length > length ? text.slice(0, length) + '...' : text;
}

// 处理切换主题
async function handleSwitch(theme: ThemeConfig) {
  if (props.currentTheme?.key === theme.key) return;
  
  const confirmed = await useConfirm({ message: `确定要切换到主题"${theme.name}"吗？`, title: '切换主题' });
  if (confirmed) emit('switch', theme);
}
</script>

<style scoped lang="scss">
.theme-switcher {
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

.search-box {
  width: 100%;
  max-width: 300px;
}

.search-input {
  width: 100%;
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4ECDC4;
    box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.1);
  }
}

.section-subtitle {
  font-size: 18px;
  color: #4a5568;
  margin-bottom: 16px;
  font-weight: 600;
}

.current-theme-section {
  margin-bottom: 32px;
}

.current-theme-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 24px;
  padding: 20px;
  border: 2px solid #4ECDC4;
}

.theme-preview {
  width: 200px;
  height: 150px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  flex-shrink: 0;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-placeholder {
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

.theme-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.theme-name {
  font-size: 20px;
  color: #2d3748;
  margin: 0;
}

.theme-author {
  font-size: 14px;
  color: #718096;
}

.theme-desc {
  font-size: 14px;
  color: #a0aec0;
  line-height: 1.5;
  flex: 1;
}

.available-themes-section {
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
}

.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.theme-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  &.active {
    border: 2px solid #4ECDC4;
    box-shadow: 0 8px 24px rgba(78, 205, 196, 0.3);
  }
}

.theme-thumbnail {
  position: relative;
  height: 160px;
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

.active-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(72, 187, 120, 0.4);
}

.theme-info {
  padding: 16px;
}

.theme-name {
  font-size: 16px;
  color: #2d3748;
  margin: 0 0 8px 0;
}

.theme-author {
  font-size: 13px;
  color: #718096;
  margin: 0 0 8px 0;
}

.theme-desc {
  font-size: 13px;
  color: #a0aec0;
  line-height: 1.5;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
