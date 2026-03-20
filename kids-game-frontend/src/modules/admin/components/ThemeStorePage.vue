<template>
  <div class="theme-store-page">
    <!-- 页面头部 -->
    <header class="store-header">
      <div class="header-content">
        <h1 class="page-title">🎨 主题商店</h1>
        <p class="page-subtitle">发现精美主题，让游戏焕然一新</p>
      </div>
      
      <!-- 搜索筛选栏 -->
      <div class="filter-bar">
        <div class="search-box">
          <input
            v-model="filters.keyword"
            type="text"
            placeholder="搜索主题..."
            class="search-input"
            @keyup.enter="loadThemes"
          />
          <button @click="loadThemes" class="btn-search">🔍</button>
        </div>
        
        <div class="filter-group">
          <select v-model="filters.scope" class="filter-select" @change="loadThemes">
            <option value="">全部范围</option>
            <option value="all">通用主题</option>
            <option value="specific">专属主题</option>
          </select>
          
          <select v-model="filters.sort" class="filter-select" @change="loadThemes">
            <option value="newest">最新上架</option>
            <option value="popular">最受欢迎</option>
            <option value="price_asc">价格从低到高</option>
            <option value="price_desc">价格从高到低</option>
          </select>
          
          <select v-model="filters.priceRange" class="filter-select" @change="loadThemes">
            <option value="">全部价格</option>
            <option value="free">免费</option>
            <option value="paid">付费</option>
            <option value="under_50">50 币以下</option>
            <option value="under_100">100 币以下</option>
          </select>
        </div>
      </div>
    </header>

    <!-- 主体内容 -->
    <main class="store-main">
      <!-- 左侧边栏 - 分类 -->
      <aside class="category-sidebar">
        <div class="sidebar-section">
          <h3 class="sidebar-title">💰 价格</h3>
          <div class="category-list">
            <label class="category-item">
              <input
                type="checkbox"
                :checked="filters.freeOnly"
                @change="toggleFreeOnly"
              />
              <span>免费主题</span>
            </label>
          </div>
        </div>
        
        <div class="sidebar-section">
          <h3 class="sidebar-title">📊 排序</h3>
          <div class="category-list">
            <label
              v-for="sort in sortOptions"
              :key="sort.value"
              class="category-item"
            >
              <input
                type="radio"
                :value="sort.value"
                v-model="filters.sort"
                @change="loadThemes"
              />
              <span>{{ sort.label }}</span>
            </label>
          </div>
        </div>
      </aside>

      <!-- 主题列表 -->
      <div class="theme-list-container">
        <div class="list-header">
          <span class="result-count">共 {{ pagination.total }} 个主题</span>
          <div class="view-toggle">
            <button
              :class="['view-btn', 'active']"
              title="网格视图"
            >
              ⊞
            </button>
            <button class="view-btn" title="列表视图">
              ☰
            </button>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner">⏳</div>
          <p>加载中...</p>
        </div>

        <!-- 主题网格 -->
        <div v-else class="theme-grid">
          <div
            v-for="theme in themes"
            :key="theme.themeId"
            class="theme-card"
            :class="{ 
              'is-free': theme.price === 0,
              'is-paid': theme.price > 0,
              'is-owned': ownedThemeIds.includes(theme.themeId)
            }"
          >
            <!-- 主题封面 -->
            <div class="card-cover">
              <div class="cover-image" :style="getCoverStyle(theme)"></div>
              
              <!-- 标签 -->
              <div class="cover-badges">
                <span v-if="theme.price === 0" class="badge free">免费</span>
                <span v-else class="badge paid">💰 {{ theme.price }}币</span>
                <span v-if="ownedThemeIds.includes(theme.themeId)" class="badge owned">已拥有</span>
                <span v-if="theme.isDefault" class="badge default">热门</span>
              </div>
              
              <!-- 快速操作 -->
              <div class="quick-actions">
                <button
                  @click="viewThemeDetail(theme)"
                  class="action-btn"
                  title="查看详情"
                >
                  👁️
                </button>
              </div>
            </div>

            <!-- 卡片内容 -->
            <div class="card-content">
              <h3 class="theme-name">{{ theme.themeName }}</h3>
              <div class="theme-author">👤 {{ theme.authorName }}</div>
              
              <p class="theme-description">
                {{ theme.description || '暂无描述' }}
              </p>
              
              <div class="theme-stats">
                <span class="stat">📥 {{ theme.downloadCount || 0 }}</span>
                <span class="stat">⭐ {{ theme.rating || 0 }}</span>
              </div>
            </div>

            <!-- 卡片底部 -->
            <div class="card-footer">
              <button
                v-if="ownedThemeIds.includes(theme.themeId)"
                @click="useTheme(theme)"
                class="btn-use"
              >
                ✅ 使用
              </button>
              <button
                v-else-if="theme.price === 0"
                @click="claimFreeTheme(theme)"
                class="btn-claim"
              >
                🎁 领取
              </button>
              <button
                v-else
                @click="openBuyDialog(theme)"
                class="btn-buy"
                :disabled="userBalance < theme.price"
              >
                💰 购买
              </button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && themes.length === 0" class="empty-state">
          <div class="empty-icon">🎨</div>
          <p>暂无主题</p>
          <button @click="resetFilters" class="btn-reset">重置筛选</button>
        </div>

        <!-- 分页 -->
        <div v-if="pagination.totalPages > 1" class="pagination">
          <button
            :disabled="pagination.current <= 1"
            @click="goToPage(pagination.current - 1)"
            class="btn-page"
          >
            ⬅️ 上一页
          </button>
          
          <div class="page-numbers">
            <button
              v-for="page in visiblePages"
              :key="page"
              :class="['page-number', { active: page === pagination.current }]"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
          </div>
          
          <button
            :disabled="pagination.current >= pagination.totalPages"
            @click="goToPage(pagination.current + 1)"
            class="btn-page"
          >
            下一页 ➡️
          </button>
        </div>
      </div>
    </main>

    <!-- 主题详情弹窗 -->
    <transition name="fade">
      <div v-if="showDetailModal" class="detail-overlay" @click.self="showDetailModal = false">
        <div class="detail-modal">
          <div class="detail-header">
            <h2>{{ selectedTheme?.themeName }}</h2>
            <button @click="showDetailModal = false" class="btn-close">✕</button>
          </div>
          
          <div class="detail-content">
            <div class="detail-cover" :style="getCoverStyle(selectedTheme)"></div>
            
            <div class="detail-info">
              <div class="info-row">
                <span class="label">作者：</span>
                <span class="value">{{ selectedTheme?.authorName }}</span>
              </div>
              
              <div class="info-row">
                <span class="label">价格：</span>
                <span :class="['value', 'price', selectedTheme?.price === 0 ? 'free' : 'paid']">
                  {{ selectedTheme?.price === 0 ? '免费' : selectedTheme?.price + ' 游戏币' }}
                </span>
              </div>
              
              <div class="info-row">
                <span class="label">下载次数：</span>
                <span class="value">{{ selectedTheme?.downloadCount || 0 }}</span>
              </div>
              
              <div class="info-row">
                <span class="label">描述：</span>
                <p class="value description">{{ selectedTheme?.description || '暂无描述' }}</p>
              </div>
            </div>
          </div>
          
          <div class="detail-footer">
            <button @click="showDetailModal = false" class="btn-cancel">关闭</button>
            <button
              v-if="ownedThemeIds.includes(selectedTheme?.themeId || 0)"
              @click="useTheme(selectedTheme)"
              class="btn-use"
            >
              ✅ 使用主题
            </button>
            <button
              v-else-if="selectedTheme?.price === 0"
              @click="claimFreeTheme(selectedTheme)"
              class="btn-claim"
            >
              🎁 免费领取
            </button>
            <button
              v-else
              @click="openBuyDialog(selectedTheme)"
              class="btn-buy"
              :disabled="userBalance < (selectedTheme?.price || 0)"
            >
              💰 购买（{{ selectedTheme?.price }}币）
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 购买确认弹窗 -->
    <transition name="fade">
      <div v-if="showBuyDialog" class="buy-overlay" @click.self="showBuyDialog = false">
        <div class="buy-dialog">
          <div class="buy-header">
            <h3>💰 确认购买</h3>
            <button @click="showBuyDialog = false" class="btn-close">✕</button>
          </div>
          
          <div class="buy-content">
            <div v-if="buyingTheme" class="theme-preview">
              <div class="preview-cover" :style="getCoverStyle(buyingTheme)"></div>
              <h4>{{ buyingTheme.themeName }}</h4>
              <p class="author">👤 {{ buyingTheme.authorName }}</p>
              <p class="price">💰 价格：{{ buyingTheme.price }} 游戏币</p>
            </div>
            
            <div class="balance-info">
              <p>当前余额：<span class="balance">{{ userBalance }}</span> 游戏币</p>
              <p v-if="userBalance < (buyingTheme?.price || 0)" class="insufficient">
                ⚠️ 余额不足
              </p>
            </div>
          </div>
          
          <div class="buy-footer">
            <button @click="showBuyDialog = false" class="btn-cancel">取消</button>
            <button
              @click="confirmPurchase"
              class="btn-confirm"
              :disabled="userBalance < (buyingTheme?.price || 0)"
            >
              ✅ 确认购买
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import axios from 'axios';
import { dialog } from '@/composables/useDialog';

interface ThemeInfo {
  themeId: number;
  themeName: string;
  authorName: string;
  price: number;
  status: string;
  applicableScope: string;
  thumbnailUrl?: string;
  description?: string;
  downloadCount: number;
  rating?: number;
  isDefault?: boolean;
  configJson?: any;
}

// 状态
const themes = ref<ThemeInfo[]>([]);
const loading = ref(false);
const userBalance = ref(1000); // TODO: 从 API 获取
const ownedThemeIds = ref<number[]>([]); // TODO: 从 API 获取

const showDetailModal = ref(false);
const showBuyDialog = ref(false);
const selectedTheme = ref<ThemeInfo | null>(null);
const buyingTheme = ref<ThemeInfo | null>(null);

const filters = reactive({
  keyword: '',
  scope: '',
  sort: 'newest',
  priceRange: '',
  freeOnly: false,
});

const pagination = reactive({
  current: 1,
  size: 12,
  total: 0,
  totalPages: 1,
});

const sortOptions = [
  { value: 'newest', label: '最新上架' },
  { value: 'popular', label: '最受欢迎' },
  { value: 'price_asc', label: '价格从低到高' },
  { value: 'price_desc', label: '价格从高到低' },
];

// 获取认证头
function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
}

// 加载主题列表
async function loadThemes() {
  loading.value = true;
  try {
    // 后端支持的参数：ownerType, ownerId, status, page, pageSize
    const params: any = {
      status: 'on_sale',
      page: pagination.current,
      pageSize: pagination.size,
    };
    
    // 范围筛选：all -> APPLICATION, specific -> GAME
    if (filters.scope === 'all') {
      params.ownerType = 'APPLICATION';
    } else if (filters.scope === 'specific') {
      params.ownerType = 'GAME';
    }
    
    // 价格筛选
    if (filters.priceRange === 'free') {
      params.maxPrice = 0;
    } else if (filters.priceRange === 'paid') {
      params.minPrice = 1;
    } else if (filters.priceRange === 'under_50') {
      params.maxPrice = 50;
    } else if (filters.priceRange === 'under_100') {
      params.maxPrice = 100;
    }
    
    const response = await axios.get('/api/theme/list', {
      params,
      ...getAuthHeaders()
    });
    
    if (response.data.code === 200) {
      themes.value = response.data.data?.list || response.data.data || [];
      pagination.total = response.data.data?.total || 0;
      pagination.totalPages = Math.ceil(pagination.total / pagination.size);
    }
  } catch (error: any) {
    console.error('[ThemeStore] 加载主题失败:', error);
  } finally {
    loading.value = false;
  }
}

// 切换免费筛选
function toggleFreeOnly() {
  filters.freeOnly = !filters.freeOnly;
  loadThemes();
}

// 查看详情
function viewThemeDetail(theme: ThemeInfo) {
  selectedTheme.value = theme;
  showDetailModal.value = true;
}

// 打开购买对话框
function openBuyDialog(theme: ThemeInfo) {
  buyingTheme.value = theme;
  showBuyDialog.value = true;
}

// 确认购买
async function confirmPurchase() {
  if (!buyingTheme.value) return;
  
  try {
    const response = await axios.post(
      '/api/theme/buy',
      { themeId: buyingTheme.value.themeId },
      getAuthHeaders()
    );
    
    if (response.data.code === 200) {
      await dialog.success('购买成功！');
      ownedThemeIds.value.push(buyingTheme.value.themeId);
      userBalance.value -= buyingTheme.value.price;
      showBuyDialog.value = false;
      loadThemes(); // 刷新列表
    } else {
      await dialog.error('购买失败：' + (response.data.msg || '未知错误'));
    }
  } catch (error: any) {
    console.error('[ThemeStore] 购买失败:', error);
    await dialog.error('购买失败：' + (error.response?.data?.message || error.message));
  }
}

// 领取免费主题
async function claimFreeTheme(theme: ThemeInfo | null) {
  if (!theme) return;
  
  try {
    const response = await axios.post(
      '/api/theme/buy',
      { themeId: theme.themeId },
      getAuthHeaders()
    );
    
    if (response.data.code === 200) {
      await dialog.success('领取成功！');
      ownedThemeIds.value.push(theme.themeId);
      loadThemes();
    } else {
      await dialog.error('领取失败：' + (response.data.message || '未知错误'));
    }
  } catch (error: any) {
    console.error('[ThemeStore] 领取失败:', error);
    await dialog.error('操作失败：' + (error.response?.data?.message || error.message));
  }
}

// 使用主题
function useTheme(theme: ThemeInfo | null) {
  if (!theme) return;
  
  // 保存到本地存储
  localStorage.setItem('current_theme', JSON.stringify({
    themeId: theme.themeId,
    themeName: theme.themeName,
  }));
  
  await dialog.success(`已应用主题：${theme.themeName}`);
  
  // TODO: 通知游戏应用主题
  window.postMessage({
    type: 'THEME_CHANGE',
    theme: theme,
  }, '*');
}

// 翻页
function goToPage(page: number) {
  if (page < 1 || page > pagination.totalPages) return;
  pagination.current = page;
  loadThemes();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 可见的页码
const visiblePages = computed(() => {
  const pages = [];
  const current = pagination.current;
  const total = pagination.totalPages;
  
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
    pages.push(i);
  }
  
  return pages;
});

// 重置筛选
function resetFilters() {
  Object.assign(filters, {
    keyword: '',
    scope: '',
    sort: 'newest',
    priceRange: '',
    freeOnly: false,
  });
  pagination.current = 1;
  loadThemes();
}

// 获取封面样式
function getCoverStyle(theme: ThemeInfo | null) {
  if (!theme) return {};
  
  if (theme.thumbnailUrl) {
    return {
      backgroundImage: `url(${theme.thumbnailUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  
  return {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  };
}

// 生命周期
onMounted(() => {
  loadThemes();
  // TODO: 加载用户余额和已拥有主题列表
});
</script>

<style scoped>
.theme-store-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

/* 页面头部 */
.store-header {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.header-content {
  text-align: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  gap: 8px;
  flex: 1;
  min-width: 300px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.search-input:focus {
  border-color: #667eea;
}

.btn-search {
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  transition: transform 0.3s;
}

.btn-search:hover {
  transform: scale(1.05);
}

.filter-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  outline: none;
}

.filter-select:focus {
  border-color: #667eea;
}

/* 主体内容 */
.store-main {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

/* 侧边栏 */
.category-sidebar {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

.sidebar-section {
  margin-bottom: 24px;
}

.sidebar-section:last-child {
  margin-bottom: 0;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #4b5563;
}

.category-item:hover {
  color: #667eea;
}

/* 主题列表容器 */
.theme-list-container {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.result-count {
  font-size: 14px;
  color: #6b7280;
}

.view-toggle {
  display: flex;
  gap: 8px;
}

.view-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.3s;
}

.view-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* 主题网格 */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.theme-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.theme-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* 卡片封面 */
.card-cover {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: transform 0.3s;
}

.theme-card:hover .cover-image {
  transform: scale(1.05);
}

.cover-badges {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.badge.free {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.badge.paid {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.badge.owned {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.badge.default {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.quick-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.theme-card:hover .quick-actions {
  opacity: 1;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s;
}

.action-btn:hover {
  transform: scale(1.1);
}

/* 卡片内容 */
.card-content {
  padding: 16px;
}

.theme-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.theme-author {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
}

.theme-description {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.theme-stats {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #6b7280;
}

/* 卡片底部 */
.card-footer {
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
}

.card-footer button {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-use {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-claim {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-buy {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.btn-buy:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-use:hover,
.btn-claim:hover,
.btn-buy:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  font-size: 48px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.btn-reset {
  margin-top: 16px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-page {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-page:not(:disabled):hover {
  background: #f3f4f6;
}

.page-numbers {
  display: flex;
  gap: 8px;
}

.page-number {
  min-width: 36px;
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.page-number.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* 弹窗 */
.detail-overlay,
.buy-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.detail-modal,
.buy-dialog {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.detail-header,
.buy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.detail-header h2,
.buy-header h3 {
  margin: 0;
  font-size: 20px;
  color: #1f2937;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #9ca3af;
}

.btn-close:hover {
  color: #1f2937;
}

.detail-content {
  padding: 20px;
}

.detail-cover {
  width: 100%;
  height: 240px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin-bottom: 20px;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  gap: 12px;
}

.info-row .label {
  font-weight: 600;
  color: #6b7280;
  min-width: 80px;
}

.info-row .value {
  color: #1f2937;
}

.info-row .price.free {
  color: #10b981;
  font-weight: 600;
}

.info-row .price.paid {
  color: #f59e0b;
  font-weight: 600;
}

.description {
  flex: 1;
  line-height: 1.6;
}

.detail-footer,
.buy-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

.detail-footer button,
.buy-footer button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

/* 购买对话框 */
.buy-content {
  padding: 20px;
}

.theme-preview {
  text-align: center;
  margin-bottom: 20px;
}

.preview-cover {
  width: 100%;
  height: 160px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin-bottom: 16px;
}

.theme-preview h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #1f2937;
}

.theme-preview .author {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.theme-preview .price {
  font-size: 16px;
  color: #f59e0b;
  font-weight: 600;
}

.balance-info {
  text-align: center;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.balance-info .balance {
  font-size: 20px;
  font-weight: 600;
  color: #10b981;
}

.balance-info .insufficient {
  color: #f59e0b;
  font-weight: 600;
  margin-top: 8px;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .store-main {
    grid-template-columns: 1fr;
  }
  
  .category-sidebar {
    display: none;
  }
  
  .filter-bar {
    flex-direction: column;
  }
  
  .search-box {
    min-width: 100%;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .filter-select {
    flex: 1;
  }
  
  .theme-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}
</style>
