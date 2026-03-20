<template>
  <transition name="fade">
    <div v-if="show" class="theme-selector-overlay" @click.self="$emit('close')">
      <div class="theme-selector-modal">
        <div class="modal-header">
          <h3>🎨 为游戏添加主题</h3>
          <button @click="$emit('close')" class="btn-close-icon">✕</button>
        </div>
        
        <div class="modal-body">
          <!-- 游戏信息 -->
          <div class="game-info">
            <span class="game-label">当前游戏：</span>
            <span class="game-name">{{ gameInfo?.gameName || gameInfo?.gameCode }}</span>
          </div>
          
          <!-- 搜索筛选 -->
          <div class="filter-bar">
            <input
              v-model="filters.keyword"
              type="text"
              placeholder="搜索主题名称..."
              class="search-input"
              @keyup.enter="loadAvailableThemes"
            />
            <select v-model="filters.scope" class="filter-select" @change="loadAvailableThemes">
              <option value="">全部范围</option>
              <option value="all">通用主题</option>
              <option value="specific">专属主题</option>
            </select>
            <select v-model="filters.status" class="filter-select" @change="loadAvailableThemes">
              <option value="on_sale">上架中</option>
              <option value="offline">已下架</option>
              <option value="pending">审核中</option>
            </select>
            <button @click="loadAvailableThemes" class="btn-search">🔍 搜索</button>
          </div>
          
          <!-- 已关联主题 -->
          <div class="section">
            <h4 class="section-title">已关联主题（{{ associatedThemes.length }}）</h4>
            <div class="theme-list">
              <div
                v-for="theme in associatedThemes"
                :key="theme.themeId"
                class="theme-item associated"
              >
                <div class="theme-cover" :style="getThemeCoverStyle(theme.thumbnailUrl)">
                  <span v-if="theme.isDefault" class="default-badge">⭐ 默认</span>
                </div>
                <div class="theme-info">
                  <div class="theme-name">{{ theme.themeName }}</div>
                  <div class="theme-meta">
                    <span class="tag scope">{{ theme.applicableScope === 'all' ? '通用' : '专属' }}</span>
                    <span class="tag status">{{ getStatusText(theme.status) }}</span>
                  </div>
                </div>
                <div class="theme-actions">
                  <button
                    v-if="!theme.isDefault"
                    @click="setAsDefault(theme)"
                    class="btn-default"
                    title="设为默认"
                  >
                    ⭐
                  </button>
                  <button
                    @click="removeTheme(theme)"
                    class="btn-remove"
                    title="移除关联"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div v-if="associatedThemes.length === 0" class="empty-tip">
                暂无已关联主题
              </div>
            </div>
          </div>
          
          <!-- 可添加主题 -->
          <div class="section">
            <h4 class="section-title">可添加主题（{{ availableThemes.length }}）</h4>
            <div class="theme-list">
              <div
                v-for="theme in availableThemes"
                :key="theme.themeId"
                class="theme-item available"
                :class="{ selected: selectedThemeIds.includes(theme.themeId) }"
                @click="toggleSelect(theme)"
              >
                <div class="theme-cover" :style="getThemeCoverStyle(theme.thumbnailUrl)">
                  <span v-if="theme.isDefault" class="default-badge">⭐ 默认</span>
                </div>
                <div class="theme-info">
                  <div class="theme-name">{{ theme.themeName }}</div>
                  <div class="theme-meta">
                    <span class="tag author">👤 {{ theme.authorName }}</span>
                    <span class="tag price">💰 {{ theme.price || 0 }}币</span>
                  </div>
                  <div class="theme-desc">{{ theme.description || '暂无描述' }}</div>
                </div>
                <div class="theme-select">
                  <input
                    type="checkbox"
                    :checked="selectedThemeIds.includes(theme.themeId)"
                    @click.stop
                  />
                </div>
              </div>
              <div v-if="availableThemes.length === 0" class="empty-tip">
                暂无可添加的主题
              </div>
            </div>
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
            <span class="page-info">
              第 {{ pagination.current }} / {{ pagination.totalPages }} 页
            </span>
            <button
              :disabled="pagination.current >= pagination.totalPages"
              @click="goToPage(pagination.current + 1)"
              class="btn-page"
            >
              下一页 ➡️
            </button>
          </div>
        </div>
        
        <div class="modal-footer">
          <div class="selected-info">
            已选择 <strong>{{ selectedThemeIds.length }}</strong> 个主题
          </div>
          <div class="footer-actions">
            <button @click="$emit('close')" class="btn-cancel">取消</button>
            <button
              @click="confirmAddThemes"
              class="btn-confirm"
              :disabled="selectedThemeIds.length === 0"
            >
              ✅ 添加选中的主题（{{ selectedThemeIds.length }}）
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import axios from 'axios';
import { dialog, useConfirm } from '@/composables/useDialog';

interface GameInfo {
  gameId: number;
  gameCode: string;
  gameName?: string;
}

interface ThemeInfo {
  themeId: number;
  themeName: string;
  authorName: string;
  price: number;
  status: string;
  applicableScope: string;
  thumbnailUrl?: string;
  description?: string;
  isDefault?: boolean;
}

const props = defineProps<{
  show: boolean;
  gameInfo: GameInfo | null;
}>();

const emit = defineEmits<{
  close: [];
  added: [themeIds: number[]];
  removed: [themeId: number];
  defaultSet: [themeId: number];
}>();

// 状态
const associatedThemes = ref<ThemeInfo[]>([]);
const availableThemes = ref<ThemeInfo[]>([]);
const selectedThemeIds = ref<number[]>([]);
const loading = ref(false);

const filters = reactive({
  keyword: '',
  scope: '',
  status: 'on_sale',
});

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0,
  totalPages: 1,
});

// 获取认证头
function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
}

// 加载已关联主题
async function loadAssociatedThemes() {
  if (!props.gameInfo) return;
  
  try {
    const response = await axios.get('/api/theme/list', {
      params: {
        ownerType: 'GAME',
        ownerId: props.gameInfo.gameId,
      },
      ...getAuthHeaders()
    });
    
    if (response.data.code === 200) {
      associatedThemes.value = response.data.data?.list || response.data.data || [];
    }
  } catch (error: any) {
    console.error('[ThemeSelector] 加载已关联主题失败:', error);
  }
}

// 加载可添加主题
async function loadAvailableThemes() {
  if (!props.gameInfo) return;
  
  loading.value = true;
  try {
    // 后端支持的参数：ownerType, ownerId, status, page, pageSize
    const params: any = {
      ownerType: 'GAME',
      ownerId: props.gameInfo.gameId,
      status: filters.status || 'on_sale',
      page: pagination.current,
      pageSize: pagination.size,
    };
    
    const response = await axios.get('/api/theme/list', {
      params,
      ...getAuthHeaders()
    });
    
    if (response.data.success) {
      const allThemes = response.data.data.list || [];
      
      // 过滤掉已关联的主题
      const associatedIds = new Set(associatedThemes.value.map(t => t.themeId));
      availableThemes.value = allThemes.filter(t => !associatedIds.has(t.themeId));
      
      pagination.total = response.data.data.total || 0;
      pagination.totalPages = Math.ceil(pagination.total / pagination.size);
    }
  } catch (error: any) {
    console.error('[ThemeSelector] 加载可添加主题失败:', error);
  } finally {
    loading.value = false;
  }
}

// 切换主题选择
function toggleSelect(theme: ThemeInfo) {
  const index = selectedThemeIds.indexOf(theme.themeId);
  if (index > -1) {
    selectedThemeIds.value.splice(index, 1);
  } else {
    selectedThemeIds.value.push(theme.themeId);
  }
}

// 设为默认主题
async function setAsDefault(theme: ThemeInfo) {
  if (!props.gameInfo) return;
  
  const confirmed = await useConfirm({ message: `确定将"${theme.themeName}"设为默认主题吗？`, title: '确认操作' });
  if (!confirmed) return;
  
  try {
    const response = await axios.post(
      '/api/theme/set-default',
      {
        gameId: props.gameInfo.gameId,
        themeId: theme.themeId,
      },
      getAuthHeaders()
    );
    
    if (response.data.success) {
      await dialog.success('设置成功！');
      await loadAssociatedThemes();
      emit('defaultSet', theme.themeId);
    } else {
      await dialog.error('设置失败：' + (response.data.message || '未知错误'));
    }
  } catch (error: any) {
    console.error('[ThemeSelector] 设置默认主题失败:', error);
    await dialog.error('操作失败：' + (error.response?.data?.message || error.message));
  }
}

// 移除主题关联
async function removeTheme(theme: ThemeInfo) {
  const confirmed = await useConfirm({ message: `确定要移除"${theme.themeName}"的关联吗？`, title: '移除确认', confirmVariant: 'danger' });
  if (!confirmed) return;
  
  try {
    const response = await axios.delete('/api/theme/game-relation', {
      params: {
        themeId: theme.themeId,
        gameId: props.gameInfo?.gameId,
      },
      ...getAuthHeaders()
    });
    
    if (response.data.code === 200) {
      await dialog.success('移除成功！');
      await loadAssociatedThemes();
      await loadAvailableThemes();
      emit('removed', theme.themeId);
    } else {
      await dialog.error('移除失败：' + (response.data.message || '未知错误'));
    }
  } catch (error: any) {
    console.error('[ThemeSelector] 移除主题失败:', error);
    await dialog.error('操作失败：' + (error.response?.data?.message || error.message));
  }
}

// 确认添加主题
async function confirmAddThemes() {
  if (!props.gameInfo || selectedThemeIds.value.length === 0) return;
  
  const confirmed = await useConfirm({
    message: `确定要为"${props.gameInfo.gameName || props.gameInfo.gameCode}"添加 ${selectedThemeIds.value.length} 个主题吗？`,
    title: '批量添加'
  });
  if (!confirmed) return;
  
  try {
    // 批量添加
    const promises = selectedThemeIds.value.map(themeId =>
      axios.post(
        '/api/theme/game-relation',
        {
          themeId,
          gameId: props.gameInfo!.gameId,
          gameCode: props.gameInfo!.gameCode,
          isDefault: false,
        },
        getAuthHeaders()
      )
    );
    
    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.data.success).length;
    
    await dialog.success(`成功添加 ${successCount} / ${selectedThemeIds.value.length} 个主题！`);
    
    await loadAssociatedThemes();
    await loadAvailableThemes();
    emit('added', selectedThemeIds.value);
    
    // 重置选择
    selectedThemeIds.value = [];
  } catch (error: any) {
    console.error('[ThemeSelector] 批量添加主题失败:', error);
    await dialog.error('添加失败：' + (error.response?.data?.message || error.message));
  }
}

// 翻页
function goToPage(page: number) {
  if (page < 1 || page > pagination.totalPages) return;
  pagination.current = page;
  loadAvailableThemes();
}

// 获取封面样式
function getThemeCoverStyle(thumbnailUrl?: string) {
  if (thumbnailUrl) {
    return {
      backgroundImage: `url(${thumbnailUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };
}

// 获取状态文本
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    on_sale: '✓ 上架中',
    offline: '✗ 已下架',
    pending: '⏳ 审核中',
  };
  return statusMap[status] || status;
}

// 监听显示状态变化
watch(() => props.show, (newVal) => {
  if (newVal && props.gameInfo) {
    loadAssociatedThemes();
    loadAvailableThemes();
  }
});

// 初始化
onMounted(() => {
  if (props.show && props.gameInfo) {
    loadAssociatedThemes();
    loadAvailableThemes();
  }
});
</script>

<style scoped>
.theme-selector-overlay {
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

.theme-selector-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modal-slide-in 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
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

.btn-close-icon:hover {
  color: #1f2937;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.game-info {
  background: #f3f4f6;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.game-label {
  font-weight: 600;
  color: #6b7280;
}

.game-name {
  font-weight: 600;
  color: #1f2937;
  margin-left: 8px;
}

.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.search-input:focus,
.filter-select:focus {
  border-color: #667eea;
}

.btn-search {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-search:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
}

.theme-list {
  display: grid;
  gap: 12px;
}

.theme-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.3s;
}

.theme-item.associated {
  background: #f9fafb;
}

.theme-item.available {
  background: white;
  cursor: pointer;
}

.theme-item.available:hover {
  border-color: #667eea;
  background: #f5f3ff;
}

.theme-item.available.selected {
  border-color: #667eea;
  background: #ede9fe;
}

.theme-cover {
  width: 80px;
  height: 60px;
  border-radius: 6px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.default-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}

.theme-info {
  flex: 1;
  min-width: 0;
}

.theme-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
}

.theme-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.tag.author {
  background: #e0e7ff;
  color: #4338ca;
}

.tag.price {
  background: #fef3c7;
  color: #d97706;
}

.tag.scope {
  background: #dbeafe;
  color: #1e40af;
}

.tag.status {
  background: #d1fae5;
  color: #059669;
}

.theme-desc {
  font-size: 13px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.theme-actions,
.theme-select {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.theme-actions button {
  width: 36px;
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.theme-actions button:hover {
  background: #f3f4f6;
  transform: scale(1.05);
}

.btn-default:hover {
  border-color: #fbbf24;
  background: #fef3c7;
}

.btn-remove:hover {
  border-color: #ef4444;
  background: #fee2e2;
}

.theme-select input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.empty-tip {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
  font-size: 14px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-top: 1px solid #e5e7eb;
  margin-top: 16px;
}

.btn-page {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-page:not(:disabled):hover {
  background: #f3f4f6;
}

.page-info {
  font-size: 14px;
  color: #6b7280;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 16px 16px;
}

.selected-info {
  font-size: 14px;
  color: #6b7280;
}

.selected-info strong {
  color: #667eea;
  font-size: 16px;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  border: none;
}

.btn-cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes modal-slide-in {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
