<template>
  <div class="game-theme-selector">
    <div v-if="loading" class="loading">
      <span>加载主题中...</span>
    </div>

    <div v-else-if="themes.length === 0" class="empty">
      <span>暂无可用主题</span>
    </div>

        <div class="theme-list">
          <div class="theme-list-header">
            <span class="theme-count">共 {{ themes.length }} 个主题</span>
            <button @click="refreshThemes" class="refresh-btn" :disabled="loading" title="刷新列表">
              🔄 刷新
            </button>
          </div>
          <button
            v-for="theme in themes"
            :key="theme.themeId"
            class="theme-item"
            :class="{ active: selectedThemeId === theme.themeId }"
            @click="selectTheme(theme)"
          >
        <div class="theme-thumbnail">
          <img v-if="getThumbnailUrl(theme)" :src="getThumbnailUrl(theme)" :alt="theme.themeName" />
          <div v-else class="thumbnail-placeholder">
            <span>🎨</span>
          </div>
        </div>
        <div class="theme-info">
          <div class="theme-name">{{ theme.themeName }}</div>
          <div class="theme-author">{{ getAuthor(theme) || '未知' }}</div>
          <div v-if="getPrice(theme)" class="theme-price">
            <span>💰 {{ getPrice(theme) }}</span>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { gameThemeLoader, type GameThemeConfig } from '@/core/game-theme/GameThemeLoader';

interface Props {
  gameCode: string;
  modelValue?: number; // v-model: 选中的主题ID
  forceRefresh?: boolean; // 是否强制刷新
}

const props = withDefaults(defineProps<Props>(), {
  forceRefresh: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
  (e: 'theme-selected', theme: GameThemeConfig): void;
}>();

const loading = ref(false);
const themes = ref<GameThemeConfig[]>([]);
const selectedThemeId = ref<number | undefined>(props.modelValue);

// 加载游戏主题列表
async function loadThemes() {
  loading.value = true;
  try {
    themes.value = await gameThemeLoader.getGameThemes(props.gameCode, props.forceRefresh);
    console.log('[GameThemeSelector] 主题列表加载完成:', themes.value.length);
  } catch (error) {
    console.error('[GameThemeSelector] 加载主题列表失败:', error);
  } finally {
    loading.value = false;
  }
}

// 刷新主题列表
async function refreshThemes() {
  loading.value = true;
  try {
    themes.value = await gameThemeLoader.refreshGameThemes(props.gameCode);
    console.log('[GameThemeSelector] 主题列表已刷新:', themes.value.length);
  } catch (error) {
    console.error('[GameThemeSelector] 刷新主题列表失败:', error);
  } finally {
    loading.value = false;
  }
}

// 暴露刷新方法给父组件
defineExpose({
  refresh: refreshThemes,
});

// 选择主题
async function selectTheme(theme: GameThemeConfig) {
  selectedThemeId.value = theme.themeId;
  emit('update:modelValue', theme.themeId);
  emit('theme-selected', theme);
  
  console.log('[GameThemeSelector] 主题已选择:', theme.themeName);
}

// 获取作者信息
function getAuthor(theme: GameThemeConfig): string | undefined {
  // 尝试访问嵌套结构 (config.default.author)
  if ((theme.config as any)?.default?.author) {
    return (theme.config as any).default.author;
  }
  // 尝试访问扁平结构 (config.author)
  if ((theme.config as any)?.author) {
    return (theme.config as any).author;
  }
  return undefined;
}

// 获取价格信息
function getPrice(theme: GameThemeConfig): number | undefined {
  // 尝试访问嵌套结构 (config.default.price)
  if ((theme.config as any)?.default?.price) {
    return (theme.config as any).default.price;
  }
  // 尝试访问扁平结构 (config.price)
  if ((theme.config as any)?.price) {
    return (theme.config as any).price;
  }
  return undefined;
}

// 获取缩略图 URL
function getThumbnailUrl(theme: GameThemeConfig): string | undefined {
  // 尝试访问嵌套结构
  const thumbnailAsset = (theme.config as any)?.default?.assets?.thumbnail;
  if (thumbnailAsset?.type === 'image') {
    return thumbnailAsset.url;
  }
  // 尝试访问扁平结构
  const flatThumbnail = (theme.config as any)?.assets?.thumbnail;
  if (flatThumbnail?.type === 'image') {
    return flatThumbnail.url;
  }
  return undefined;
}

// 监听 gameCode 变化
watch(() => props.gameCode, () => {
  loadThemes();
}, { immediate: true });

// 监听 forceRefresh 变化
watch(() => props.forceRefresh, (newVal) => {
  if (newVal) {
    refreshThemes();
  }
});

// 监听 modelValue 变化
watch(() => props.modelValue, (newValue) => {
  selectedThemeId.value = newValue;
});

onMounted(() => {
  loadThemes();
});
</script>

<style scoped lang="scss">
.game-theme-selector {
  width: 100%;
  min-height: 200px;
}

.loading,
.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #718096;
  font-size: 14px;
}

.theme-list {
  width: 100%;
}

.theme-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 4px;
}

.theme-count {
  font-size: 13px;
  color: #718096;
  font-weight: 500;
}

.refresh-btn {
  padding: 6px 12px;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  color: #4a5568;
}

.refresh-btn:hover:not(:disabled) {
  background: #edf2f7;
  border-color: #cbd5e0;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  min-height: 200px;
}

.theme-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #4ECDC4;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(78, 205, 196, 0.2);
  }

  &.active {
    border-color: #4ECDC4;
    background: rgba(78, 205, 196, 0.1);
    box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
  }
}

.theme-thumbnail {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 8px;
  overflow: hidden;
  background: #f7fafc;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: #cbd5e0;
}

.theme-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.theme-name {
  font-weight: 600;
  color: #2d3748;
  font-size: 14px;
}

.theme-author {
  font-size: 12px;
  color: #718096;
}

.theme-price {
  font-size: 12px;
  color: #ed8936;
  font-weight: 500;
}
</style>
