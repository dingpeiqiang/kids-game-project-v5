<template>
  <div class="theme-store" @click.stop>
    <div class="store-header">
      <h2 class="store-title">主题商店</h2>
      <div class="store-actions">
        <button class="btn-close" @click="$emit('close')">×</button>
      </div>
    </div>

    <div class="store-content">
      <div class="store-tabs">
        <button
          :class="['store-tab', activeTab === 'all' ? 'active' : '']"
          @click="activeTab = 'all'"
        >
          全部主题
        </button>
        <button
          :class="['store-tab', activeTab === 'free' ? 'active' : '']"
          @click="activeTab = 'free'"
        >
          免费主题
        </button>
        <button
          :class="['store-tab', activeTab === 'paid' ? 'active' : '']"
          @click="activeTab = 'paid'"
        >
          付费主题
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button class="btn-retry" @click="loadThemes">重试</button>
      </div>

      <div v-else-if="themes.length === 0" class="empty-state">
        <p>暂无主题</p>
      </div>

      <div v-else class="theme-grid">
        <div v-for="theme in filteredThemes" :key="theme.id" class="theme-card">
          <div class="theme-thumbnail">
            <img
              v-if="theme.thumbnail"
              :src="theme.thumbnail"
              :alt="theme.name"
              class="thumbnail-img"
            />
            <div v-else class="thumbnail-placeholder">
              <span>{{ theme.name.charAt(0) }}</span>
            </div>
            <div v-if="theme.price === 0" class="free-badge">免费</div>
          </div>

          <div class="theme-info">
            <h3 class="theme-name">{{ theme.name }}</h3>
            <p class="theme-author">作者：{{ theme.author }}</p>
            <div class="theme-meta">
              <span class="theme-downloads">
                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"
                  />
                </svg>
                {{ theme.downloadCount }}
              </span>
              <span v-if="theme.rating" class="theme-rating">
                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                  />
                </svg>
                {{ theme.rating.toFixed(1) }}
              </span>
            </div>
          </div>

          <div class="theme-footer">
            <div class="theme-price">
              <span v-if="theme.price > 0" class="price-value">{{ theme.price }}</span>
              <span v-else class="price-free">免费</span>
              <span class="price-currency">趣乐币</span>
            </div>
            <button
              :class="['btn-buy', theme.price === 0 ? 'btn-free' : '']"
              @click="handleBuy(theme)"
              :disabled="isPurchasing"
            >
              {{ theme.owned ? '已拥有' : theme.price > 0 ? '购买' : '获取' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showConfirmModal" class="modal-overlay" @click="showConfirmModal = false">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">确认购买</h3>
        <p class="modal-desc">
          确定要购买主题 <strong>{{ selectedTheme?.name }}</strong> 吗？
        </p>
        <p class="modal-price">
          价格：<span class="price-highlight">{{ selectedTheme?.price }}</span> 趣乐币
        </p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showConfirmModal = false">取消</button>
          <button class="btn btn-primary" @click="confirmPurchase" :disabled="isPurchasing">
            {{ isPurchasing ? '处理中...' : '确认购买' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { themeManager, type CloudThemeInfo } from './ThemeManager';
import { themeApi } from '@/services/theme-api.service';

const emit = defineEmits<{
  close: [];
  purchased: [themeId: string];
}>();

const activeTab = ref<'all' | 'free' | 'paid'>('all');
const loading = ref(false);
const error = ref('');
const isPurchasing = ref(false);
const showConfirmModal = ref(false);
const selectedTheme = ref<CloudThemeInfo | null>(null);

const themes = ref<CloudThemeInfo[]>([]);

const filteredThemes = computed(() => {
  switch (activeTab.value) {
    case 'free':
      return themes.value.filter((t) => t.price === 0);
    case 'paid':
      return themes.value.filter((t) => t.price > 0);
    default:
      return themes.value;
  }
});

onMounted(() => {
  loadThemes();
});

async function loadThemes(): Promise<void> {
  loading.value = true;
  error.value = '';

  try {
    const themes = await themeApi.getList({ status: 'on_sale' });
    themes.value = themes || [];
  } catch (e) {
    error.value = '网络错误，请稍后重试';
    console.error('[ThemeStore] Failed to load themes:', e);
  } finally {
    loading.value = false;
  }
}

function handleBuy(theme: CloudThemeInfo): void {
  if (theme.owned) {
    downloadTheme(theme.id);
    return;
  }

  selectedTheme.value = theme;
  showConfirmModal.value = true;
}

async function confirmPurchase(): Promise<void> {
  if (!selectedTheme.value) return;

  isPurchasing.value = true;

  try {
    const result = await themeApi.buy(selectedTheme.value.id);
    if (result) {
      await downloadTheme(selectedTheme.value.id);
      emit('purchased', selectedTheme.value.id);
      showConfirmModal.value = false;
      emit('close');
    } else {
      alert('购买失败');
    }
  } catch (e: any) {
    console.error('[ThemeStore] Purchase failed:', e);
    alert(e.message || '购买失败，请重试');
  } finally {
    isPurchasing.value = false;
  }
}

async function downloadTheme(themeId: string): Promise<void> {
  try {
    const success = await themeManager.downloadCloudTheme(themeId);
    if (success) {
      alert('主题下载成功！');
    } else {
      alert('下载失败');
    }
  } catch (e) {
    console.error('[ThemeStore] Download failed:', e);
    alert('下载失败');
  }
}
</script>

<style scoped>
.theme-store {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 1000px;
  max-height: 90vh;
  background: #1a1a2e;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.store-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #2d2d44;
}

.store-title {
  margin: 0;
  color: #fff;
  font-size: 24px;
  font-weight: 600;
}

.store-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.2s;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

.store-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.store-tabs {
  display: flex;
  padding: 0 24px;
  border-bottom: 1px solid #2d2d44;
  gap: 8px;
}

.store-tab {
  padding: 12px 20px;
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.store-tab:hover {
  color: #fff;
}

.store-tab.active {
  color: #42b983;
  border-bottom-color: #42b983;
}

.loading-state,
.error-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #888;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #2d2d44;
  border-top-color: #42b983;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-retry {
  padding: 8px 20px;
  background: #42b983;
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-retry:hover {
  opacity: 0.9;
}

.theme-grid {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.theme-card {
  background: #2d2d44;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.theme-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.theme-thumbnail {
  position: relative;
  width: 100%;
  padding-top: 60%;
  overflow: hidden;
}

.thumbnail-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #42b983, #3d5afe);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 48px;
  font-weight: bold;
}

.free-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 4px 10px;
  background: #42b983;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
}

.theme-info {
  padding: 16px;
}

.theme-name {
  margin: 0 0 8px 0;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.theme-author {
  margin: 0 0 12px 0;
  color: #888;
  font-size: 13px;
}

.theme-meta {
  display: flex;
  gap: 12px;
  color: #666;
  font-size: 13px;
}

.theme-downloads,
.theme-rating {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon {
  width: 14px;
  height: 14px;
}

.theme-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #3d3d5c;
}

.theme-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.price-value {
  color: #ffd700;
  font-size: 18px;
  font-weight: 600;
}

.price-free {
  color: #42b983;
  font-size: 16px;
  font-weight: 600;
}

.price-currency {
  color: #888;
  font-size: 12px;
}

.btn-buy {
  padding: 6px 16px;
  background: #3d5afe;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-buy:hover:not(:disabled) {
  background: #2f45e6;
}

.btn-buy:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-free {
  background: #42b983;
}

.btn-free:hover:not(:disabled) {
  background: #3aa876;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-content {
  background: #1a1a2e;
  padding: 30px;
  border-radius: 16px;
  min-width: 400px;
  max-width: 90vw;
}

.modal-title {
  margin: 0 0 16px 0;
  color: #fff;
  font-size: 20px;
}

.modal-desc {
  margin: 0 0 12px 0;
  color: #aaa;
  font-size: 14px;
}

.modal-price {
  margin: 0 0 24px 0;
  color: #fff;
  font-size: 16px;
}

.price-highlight {
  color: #ffd700;
  font-weight: 600;
  font-size: 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #3d3d5c;
  color: #fff;
}

.btn-secondary:hover {
  background: #4d4d6c;
}

.btn-primary {
  background: #42b983;
  color: #fff;
}

.btn-primary:hover {
  background: #3aa876;
}
</style>
