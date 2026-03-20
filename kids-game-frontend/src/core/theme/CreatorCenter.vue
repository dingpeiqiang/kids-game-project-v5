<template>
  <div class="creator-center" @click.stop>
    <div class="center-header">
      <h2 class="center-title">创作者中心</h2>
      <button class="btn-close" @click="$emit('close')">×</button>
    </div>

    <div class="center-content">
      <div class="earnings-section">
        <h3 class="section-title">收益统计</h3>
        <div class="earnings-cards">
          <div class="earning-card">
            <div class="earning-label">总收益</div>
            <div class="earning-value">{{ earnings.total }}</div>
            <div class="earning-currency">趣乐币</div>
          </div>
          <div class="earning-card pending">
            <div class="earning-label">待结算</div>
            <div class="earning-value">{{ earnings.pending }}</div>
            <div class="earning-currency">趣乐币</div>
          </div>
          <div class="earning-card withdrawn">
            <div class="earning-label">已提现</div>
            <div class="earning-value">{{ earnings.withdrawn }}</div>
            <div class="earning-currency">趣乐币</div>
          </div>
        </div>
        <button class="btn-withdraw" @click="handleWithdraw" :disabled="earnings.pending < 100">
          提现（满 100 趣乐币可提现）
        </button>
      </div>

      <div class="themes-section">
        <div class="themes-header">
          <h3 class="section-title">我的主题</h3>
          <button class="btn-create" @click="$emit('create')">
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            创建新主题
          </button>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>

        <div v-else-if="myThemes.length === 0" class="empty-state">
          <p>还没有上传任何主题</p>
          <button class="btn-create-empty" @click="$emit('create')">
            创建第一个主题
          </button>
        </div>

        <div v-else class="themes-list">
          <div v-for="theme in myThemes" :key="theme.id" class="theme-item">
            <div class="theme-item-info">
              <div class="theme-item-thumbnail">
                <img
                  v-if="theme.thumbnail"
                  :src="theme.thumbnail"
                  :alt="theme.name"
                  class="thumbnail-img"
                />
                <div v-else class="thumbnail-placeholder">
                  <span>{{ theme.name.charAt(0) }}</span>
                </div>
              </div>
              <div class="theme-item-details">
                <h4 class="theme-item-name">{{ theme.name }}</h4>
                <div class="theme-item-meta">
                  <span class="theme-item-price">{{ theme.price }} 趣乐币</span>
                  <span class="theme-item-downloads">
                    <svg class="icon-small" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                    </svg>
                    {{ theme.downloadCount }}
                  </span>
                  <span v-if="theme.rating" class="theme-item-rating">
                    <svg class="icon-small" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                      />
                    </svg>
                    {{ theme.rating.toFixed(1) }}
                  </span>
                </div>
                <div class="theme-item-earnings">
                  收益：{{ theme.earnings || 0 }} 趣乐币
                </div>
              </div>
            </div>
            <div class="theme-item-actions">
              <span
                :class="['status-badge', theme.status === 'on_sale' ? 'status-on' : 'status-off']"
              >
                {{ theme.status === 'on_sale' ? '销售中' : '已下架' }}
              </span>
              <button
                class="btn-action"
                @click="toggleThemeSale(theme)"
                :disabled="isToggling"
              >
                {{ theme.status === 'on_sale' ? '下架' : '上架' }}
              </button>
              <button class="btn-action btn-edit" @click="$emit('edit', theme)">
                编辑
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { themeManager, type CloudThemeInfo } from './ThemeManager';

const emit = defineEmits<{
  close: [];
  create: [];
  edit: [theme: CloudThemeInfo];
}>();

const loading = ref(false);
const isToggling = ref(false);

const earnings = ref({
  total: 0,
  pending: 0,
  withdrawn: 0,
});

const myThemes = ref<CloudThemeInfo[]>([]);

onMounted(() => {
  loadMyThemes();
  loadEarnings();
});

async function loadMyThemes(): Promise<void> {
  loading.value = true;
  try {
    myThemes.value = await themeManager.getMyCloudThemes();
  } catch (e) {
    console.error('[CreatorCenter] Failed to load themes:', e);
  } finally {
    loading.value = false;
  }
}

async function loadEarnings(): Promise<void> {
  try {
    earnings.value = await themeManager.getCreatorEarnings();
  } catch (e) {
    console.error('[CreatorCenter] Failed to load earnings:', e);
  }
}

async function toggleThemeSale(theme: CloudThemeInfo): Promise<void> {
  if (isToggling.value) return;

  isToggling.value = true;
  try {
    const newStatus = theme.status !== 'on_sale';
    const success = await themeManager.toggleThemeSale(theme.id, newStatus);
    if (success) {
      theme.status = newStatus ? 'on_sale' : 'offline';
      await loadMyThemes();
    } else {
      alert('操作失败，请重试');
    }
  } catch (e) {
    console.error('[CreatorCenter] Toggle sale failed:', e);
    alert('操作失败');
  } finally {
    isToggling.value = false;
  }
}

function handleWithdraw(): void {
  if (earnings.value.pending < 100) {
    alert('收益未满 100 趣乐币，无法提现');
    return;
  }
  alert('提现功能开发中...');
}
</script>

<style scoped>
.creator-center {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 900px;
  max-height: 90vh;
  background: #1a1a2e;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.center-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #2d2d44;
}

.center-title {
  margin: 0;
  color: #fff;
  font-size: 24px;
  font-weight: 600;
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

.center-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.earnings-section {
  background: #2d2d44;
  padding: 24px;
  border-radius: 12px;
}

.section-title {
  margin: 0 0 20px 0;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.earnings-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.earning-card {
  background: #1a1a2e;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}

.earning-card.pending {
  border: 2px solid #ffd700;
}

.earning-card.withdrawn {
  border: 2px solid #42b983;
}

.earning-label {
  color: #888;
  font-size: 13px;
  margin-bottom: 8px;
}

.earning-value {
  color: #fff;
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 4px;
}

.earning-currency {
  color: #666;
  font-size: 12px;
}

.btn-withdraw {
  width: 100%;
  padding: 12px;
  background: #ffd700;
  border: none;
  border-radius: 8px;
  color: #1a1a2e;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-withdraw:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-withdraw:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #444;
  color: #888;
}

.themes-section {
  flex: 1;
}

.themes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: #42b983;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-create:hover {
  background: #3aa876;
}

.icon {
  width: 18px;
  height: 18px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #888;
  gap: 16px;
  background: #2d2d44;
  border-radius: 12px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #3d3d5c;
  border-top-color: #42b983;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-create-empty {
  padding: 10px 24px;
  background: #42b983;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-create-empty:hover {
  background: #3aa876;
}

.themes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.theme-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #2d2d44;
  border-radius: 12px;
  transition: background 0.2s;
}

.theme-item:hover {
  background: #353550;
}

.theme-item-info {
  display: flex;
  gap: 16px;
  flex: 1;
}

.theme-item-thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #42b983, #3d5afe);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 32px;
  font-weight: bold;
}

.theme-item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.theme-item-name {
  margin: 0;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.theme-item-meta {
  display: flex;
  gap: 16px;
  color: #888;
  font-size: 13px;
}

.theme-item-price {
  color: #ffd700;
  font-weight: 500;
}

.theme-item-downloads,
.theme-item-rating {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-small {
  width: 14px;
  height: 14px;
}

.theme-item-earnings {
  color: #42b983;
  font-size: 13px;
  font-weight: 500;
}

.theme-item-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.status-on {
  background: rgba(66, 185, 131, 0.2);
  color: #42b983;
}

.status-badge.status-off {
  background: rgba(136, 136, 136, 0.2);
  color: #888;
}

.btn-action {
  padding: 6px 14px;
  background: #3d3d5c;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-action:hover:not(:disabled) {
  background: #4d4d6c;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-action.btn-edit {
  background: #3d5afe;
}

.btn-action.btn-edit:hover {
  background: #2f45e6;
}
</style>
