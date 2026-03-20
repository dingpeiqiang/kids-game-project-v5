<template>
  <div class="theme-switcher" v-if="visible">
    <!-- 主题切换按钮 -->
    <button class="theme-toggle-btn" @click="toggleMenu" :title="currentTheme?.themeName || '选择主题'">
      <span class="btn-icon">🎨</span>
      <span v-if="showLabel" class="btn-label">主题</span>
      <span v-if="currentTheme && !showLabel" class="theme-indicator"></span>
    </button>

    <!-- 主题菜单 -->
    <transition name="slide-fade">
      <div v-if="showMenu" class="theme-menu" @click.stop>
        <div class="menu-header">
          <h4>🎨 选择主题</h4>
          <button @click="closeMenu" class="btn-close">✕</button>
        </div>

        <div class="menu-content">
          <!-- 当前主题 -->
          <div v-if="currentTheme" class="current-theme">
            <div class="theme-label">当前主题</div>
            <div
              class="theme-item active"
              @click="selectTheme(currentTheme)"
            >
              <div class="theme-preview" :style="getThemePreviewStyle(currentTheme)"></div>
              <div class="theme-info">
                <div class="theme-name">{{ currentTheme.themeName }}</div>
                <div class="theme-author">👤 {{ currentTheme.authorName }}</div>
              </div>
              <div class="theme-check">✅</div>
            </div>
          </div>

          <!-- 可用主题列表 -->
          <div class="available-themes">
            <div class="section-title">可用主题</div>
            
            <div v-if="loading" class="loading">
              <span class="loading-spinner">⏳</span>
              <span>加载中...</span>
            </div>

            <div
              v-for="theme in availableThemes"
              :key="theme.themeId"
              class="theme-item"
              :class="{ 
                active: currentTheme?.themeId === theme.themeId,
                'is-free': theme.price === 0,
                'is-paid': theme.price > 0
              }"
              @click="selectTheme(theme)"
            >
              <div class="theme-preview" :style="getThemePreviewStyle(theme)"></div>
              <div class="theme-info">
                <div class="theme-name">{{ theme.themeName }}</div>
                <div class="theme-meta">
                  <span class="theme-author">👤 {{ theme.authorName }}</span>
                  <span v-if="theme.price > 0" class="theme-price">💰 {{ theme.price }}币</span>
                  <span v-else class="theme-free">免费</span>
                </div>
              </div>
              <div v-if="!hasPurchased(theme)" class="lock-icon">🔒</div>
            </div>

            <div v-if="!loading && availableThemes.length === 0" class="empty-tip">
              暂无可用主题
            </div>
          </div>
        </div>

        <div class="menu-footer">
          <button @click="openThemeStore" class="btn-store">
            🛒 主题商店
          </button>
        </div>
      </div>
    </transition>

    <!-- 购买确认弹窗 -->
    <transition name="fade">
      <div v-if="showBuyConfirm" class="buy-confirm-overlay" @click.self="showBuyConfirm = false">
        <div class="buy-confirm-modal">
          <div class="modal-header">
            <h3>💰 购买主题</h3>
            <button @click="showBuyConfirm = false" class="btn-close-icon">✕</button>
          </div>
          
          <div class="modal-body">
            <div v-if="selectedTheme" class="theme-detail">
              <div class="theme-cover" :style="getThemePreviewStyle(selectedTheme)"></div>
              <div class="theme-name">{{ selectedTheme.themeName }}</div>
              <div class="theme-author">👤 {{ selectedTheme.authorName }}</div>
              <div class="theme-price">💰 价格：{{ selectedTheme.price }} 游戏币</div>
              <div class="theme-desc">{{ selectedTheme.description || '暂无描述' }}</div>
            </div>
            
            <div class="balance-info">
              当前余额：<span class="balance">{{ userBalance }}</span> 游戏币
            </div>
            
            <div v-if="userBalance < (selectedTheme?.price || 0)" class="insufficient-balance">
              ⚠️ 游戏币不足，请充值
            </div>
          </div>
          
          <div class="modal-footer">
            <button @click="showBuyConfirm = false" class="btn-cancel">取消</button>
            <button
              @click="confirmPurchase"
              class="btn-buy"
              :disabled="userBalance < (selectedTheme?.price || 0)"
            >
              ✅ 确认购买（{{ selectedTheme?.price || 0 }}币）
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import axios from 'axios';

interface ThemeInfo {
  themeId: number;
  themeName: string;
  authorName: string;
  price: number;
  thumbnailUrl?: string;
  description?: string;
  configJson?: any;
}

const props = defineProps<{
  gameCode: string;
  gameId: number;
  showLabel?: boolean;
}>();

const emit = defineEmits<{
  themeChange: [theme: ThemeInfo];
}>();

// 状态
const visible = ref(true);
const showMenu = ref(false);
const showBuyConfirm = ref(false);
const loading = ref(false);
const currentTheme = ref<ThemeInfo | null>(null);
const availableThemes = ref<ThemeInfo[]>([]);
const selectedTheme = ref<ThemeInfo | null>(null);
const userBalance = ref(0);
const purchasedThemeIds = ref<number[]>([]);

// 获取认证头
function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
}

// 切换菜单
function toggleMenu() {
  showMenu.value = !showMenu.value;
  if (showMenu.value) {
    loadThemes();
  }
}

// 关闭菜单
function closeMenu() {
  showMenu.value = false;
}

// 加载主题列表
async function loadThemes() {
  loading.value = true;
  try {
    const response = await axios.get('/api/theme/list', {
      params: {
        ownerType: 'GAME',
        ownerId: props.gameId,
        status: 'on_sale',
      },
      ...getAuthHeaders()
    });

    if (response.data.code === 200) {
      availableThemes.value = response.data.data?.list || response.data.data || [];
      
      // 查找默认主题
      const defaultTheme = availableThemes.value.find(t => t.isDefault);
      if (defaultTheme && !currentTheme.value) {
        currentTheme.value = defaultTheme;
        emit('themeChange', defaultTheme);
      }
    }
  } catch (error: any) {
    console.error('[ThemeSwitcher] 加载主题失败:', error);
  } finally {
    loading.value = false;
  }
}

// 选择主题
async function selectTheme(theme: ThemeInfo) {
  // 检查是否已购买（免费主题视为已购买）
  if (theme.price > 0 && !hasPurchased(theme)) {
    // 需要购买
    selectedTheme.value = theme;
    showBuyConfirm.value = true;
    return;
  }

  // 应用主题
  await applyTheme(theme);
  closeMenu();
}

// 应用主题
async function applyTheme(theme: ThemeInfo) {
  try {
    // 如果是付费主题，下载主题配置
    if (theme.price > 0) {
      const response = await axios.get('/api/theme/download', {
        params: { id: theme.themeId },
        ...getAuthHeaders()
      });

      if (response.data.code === 200) {
        theme.configJson = response.data.data?.config || response.data.data;
      }
    }

    currentTheme.value = theme;
    emit('themeChange', theme);

    // 保存到本地存储
    localStorage.setItem(`theme_${props.gameCode}`, JSON.stringify({
      themeId: theme.themeId,
      themeName: theme.themeName,
    }));

    console.log('[ThemeSwitcher] 应用主题:', theme.themeName);
  } catch (error: any) {
    console.error('[ThemeSwitcher] 应用主题失败:', error);
    alert('应用主题失败：' + (error.response?.data?.message || error.message));
  }
}

// 检查是否已购买
function hasPurchased(theme: ThemeInfo): boolean {
  // 免费主题视为已购买
  if (theme.price === 0) return true;
  
  // 检查已购买列表
  return purchasedThemeIds.value.includes(theme.themeId);
}

// 打开主题商店
function openThemeStore() {
  closeMenu();
  // TODO: 跳转到主题商店页面
  alert('主题商店开发中...');
}

// 确认购买
async function confirmPurchase() {
  if (!selectedTheme.value) return;

  try {
    const response = await axios.post(
      '/api/theme/buy',
      { themeId: selectedTheme.value.themeId },
      getAuthHeaders()
    );

    if (response.data.code === 200) {
      alert('购买成功！');
      purchasedThemeIds.value.push(selectedTheme.value.themeId);
      
      // 自动应用主题
      await applyTheme(selectedTheme.value);
      
      showBuyConfirm.value = false;
      selectedTheme.value = null;
    } else {
      alert('购买失败：' + (response.data.msg || '未知错误'));
    }
  } catch (error: any) {
    console.error('[ThemeSwitcher] 购买失败:', error);
    alert('购买失败：' + (error.response?.data?.message || error.message));
  }
}

// 获取主题预览样式
function getThemePreviewStyle(theme: ThemeInfo) {
  if (theme.thumbnailUrl) {
    return {
      backgroundImage: `url(${theme.thumbnailUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  
  // 使用主题配置中的主色
  if (theme.configJson?.default?.styles?.color_primary) {
    return {
      backgroundColor: theme.configJson.default.styles.color_primary,
    };
  }
  
  // 默认渐变色
  return {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  };
}

// 加载用户余额
async function loadUserBalance() {
  try {
    // TODO: 调用获取余额的 API
    // const response = await axios.get('/api/user/balance', getAuthHeaders());
    // userBalance.value = response.data.data.balance || 0;
    userBalance.value = 1000; // 临时模拟数据
  } catch (error: any) {
    console.error('[ThemeSwitcher] 加载余额失败:', error);
  }
}

// 加载已购买主题
async function loadPurchasedThemes() {
  try {
    // TODO: 调用获取已购买主题的 API
    // const response = await axios.get('/api/theme/purchased', getAuthHeaders());
    // purchasedThemeIds.value = response.data.data.map((t: any) => t.themeId);
  } catch (error: any) {
    console.error('[ThemeSwitcher] 加载已购买主题失败:', error);
  }
}

// 加载保存的主题
function loadSavedTheme() {
  const saved = localStorage.getItem(`theme_${props.gameCode}`);
  if (saved) {
    try {
      const savedTheme = JSON.parse(saved);
      // 在可用主题中查找
      const theme = availableThemes.value.find(t => t.themeId === savedTheme.themeId);
      if (theme) {
        currentTheme.value = theme;
      }
    } catch (e) {
      console.error('[ThemeSwitcher] 加载保存的主题失败:', e);
    }
  }
}

// 生命周期
onMounted(() => {
  loadUserBalance();
  loadPurchasedThemes();
});

// 点击外部关闭菜单
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.theme-switcher') && showMenu.value) {
    closeMenu();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.theme-switcher {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 999;
}

/* 主题切换按钮 */
.theme-toggle-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 16px;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  transition: all 0.3s;
  position: relative;
}

.theme-toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.btn-icon {
  font-size: 24px;
}

.btn-label {
  font-size: 12px;
  margin-top: 4px;
}

.theme-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
}

/* 主题菜单 */
.theme-menu {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 360px;
  max-height: 500px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.menu-header h4 {
  margin: 0;
  font-size: 16px;
  color: #1f2937;
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #9ca3af;
}

.btn-close:hover {
  color: #1f2937;
}

.menu-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* 当前主题 */
.current-theme {
  margin-bottom: 20px;
}

.theme-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
  margin-bottom: 8px;
}

.theme-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.theme-item:hover {
  border-color: #667eea;
  background: #f5f3ff;
}

.theme-item.active {
  border-color: #667eea;
  background: #ede9fe;
}

.theme-preview {
  width: 60px;
  height: 40px;
  border-radius: 8px;
  flex-shrink: 0;
}

.theme-info {
  flex: 1;
  min-width: 0;
}

.theme-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.theme-author {
  font-size: 12px;
  color: #6b7280;
}

.theme-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
}

.theme-price {
  color: #d97706;
  font-weight: 600;
}

.theme-free {
  color: #10b981;
  font-weight: 600;
}

.theme-check {
  font-size: 18px;
  color: #10b981;
}

.lock-icon {
  font-size: 16px;
}

/* 可用主题 */
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 12px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: #9ca3af;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-tip {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
  font-size: 14px;
}

/* 菜单底部 */
.menu-footer {
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.btn-store {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-store:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 购买确认弹窗 */
.buy-confirm-overlay {
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

.buy-confirm-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
}

.btn-close-icon {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #9ca3af;
}

.modal-body {
  padding: 20px;
}

.theme-detail {
  text-align: center;
  margin-bottom: 16px;
}

.theme-cover {
  width: 100%;
  height: 120px;
  border-radius: 12px;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.theme-detail .theme-name {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.theme-detail .theme-author {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.theme-detail .theme-price {
  font-size: 16px;
  color: #d97706;
  font-weight: 600;
  margin-bottom: 8px;
}

.theme-detail .theme-desc {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}

.balance-info {
  text-align: center;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 12px;
}

.balance {
  font-size: 18px;
  font-weight: 600;
  color: #10b981;
}

.insufficient-balance {
  text-align: center;
  padding: 12px;
  background: #fef3c7;
  color: #d97706;
  border-radius: 8px;
  font-size: 14px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel,
.btn-buy {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  border: none;
}

.btn-cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-buy {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-buy:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-buy:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
