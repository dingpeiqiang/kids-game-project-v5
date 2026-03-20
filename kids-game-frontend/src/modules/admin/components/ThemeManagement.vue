<template>
  <div class="theme-management">
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <div class="search-filters">
        <input
          v-model="filters.themeName"
          placeholder="搜索主题名称..."
          class="search-input"
          @keyup.enter="loadThemes"
        />
        
        <select v-model="filters.status" class="filter-select">
          <option value="">全部状态</option>
          <option value="on_sale">上架中</option>
          <option value="offline">已下架</option>
          <option value="pending">审核中</option>
        </select>
        
        <button @click="loadThemes" class="btn-search">🔍 搜索</button>
      </div>
      
      <div class="batch-actions">
        <button @click="showCreateModal = true" class="btn-create">
          ➕ 创建官方主题
        </button>
      </div>
    </div>
    
    <!-- 主题列表 -->
    <div class="theme-grid">
      <div 
        v-for="theme in themes" 
        :key="theme.themeId" 
        class="theme-card"
        :class="{ 'disabled': theme.status === 'offline' }"
      >
        <div class="card-cover" :style="getCoverStyle(theme.thumbnailUrl)">
          <span class="cover-icon">🎨</span>
        </div>
        
        <div class="card-body">
          <div class="theme-title">{{ theme.themeName }}</div>
          
          <div class="theme-meta">
            <span class="tag author">👤 {{ theme.authorName }}</span>
            <span class="tag price">💰 {{ theme.price || 0 }}币</span>
          </div>
          
          <div class="theme-stats">
            <span>📥 {{ theme.downloadCount || 0 }}次下载</span>
            <span>💵 收益：{{ theme.totalRevenue || 0 }}币</span>
          </div>
          
          <div class="status-badge" :class="theme.status">
            {{ getStatusText(theme.status) }}
          </div>
        </div>
        
        <div class="card-actions">
          <button @click="viewThemeDetail(theme)" class="btn-view">👁️ 查看</button>
          <button @click="editTheme(theme)" class="btn-edit">✏️ 编辑</button>
          <button 
            @click="toggleThemeStatus(theme)" 
            class="btn-toggle"
          >
            {{ theme.status === 'on_sale' ? '📥 下架' : '📤 上架' }}
          </button>
          <button @click="deleteTheme(theme)" class="btn-delete">🗑️ 删除</button>
        </div>
      </div>
    </div>
    
    <!-- 分页 -->
    <div class="pagination">
      <button 
        :disabled="pagination.current <= 1"
        @click="goToPage(pagination.current - 1)"
      >
        ⬅️ 上一页
      </button>
      
      <span class="page-info">
        第 {{ pagination.current }} / {{ pagination.totalPages }} 页
        （共 {{ pagination.total }} 个主题）
      </span>
      
      <button 
        :disabled="pagination.current >= pagination.totalPages"
        @click="goToPage(pagination.current + 1)"
      >
        下一页 ➡️
      </button>
      
      <select v-model="pagination.size" @change="loadThemes" class="page-size">
        <option :value="10">10 个/页</option>
        <option :value="20">20 个/页</option>
        <option :value="50">50 个/页</option>
      </select>
    </div>
    
    <!-- 创建/编辑弹窗 -->
    <KidModal
      v-model:show="showCreateModal"
      title="➕ 创建官方主题"
      size="lg"
      closable
      show-footer
      confirm-text="💾 保存"
      cancel-text="取消"
      @confirm="submitForm"
    >
      <div class="form-group">
        <label class="form-label">主题名称 *</label>
        <input v-model="formData.themeName" type="text" class="form-input" placeholder="请输入主题名称" />
      </div>
      
      <div class="form-group">
        <label class="form-label">作者名称</label>
        <input v-model="formData.authorName" type="text" class="form-input" placeholder="官方" />
      </div>
      
      <div class="form-group">
        <label class="form-label">价格（游戏币）</label>
        <input v-model.number="formData.price" type="number" class="form-input" placeholder="0 表示免费" min="0" />
      </div>
      
      <div class="form-group">
        <label class="form-label">缩略图 URL</label>
        <input v-model="formData.thumbnailUrl" type="text" class="form-input" placeholder="https://..." />
      </div>
      
      <div class="form-group">
        <label class="form-label">描述</label>
        <textarea v-model="formData.description" class="form-textarea" placeholder="主题描述..." rows="4"></textarea>
      </div>
      
      <div class="form-group">
        <label class="form-label">主题配置 JSON *</label>
        <div class="json-editor-hint">包含 assets 和 styles 的完整配置</div>
        <textarea 
          v-model="formData.configJson" 
          class="form-textarea code-editor" 
          placeholder='{"default": {"assets": {...}, "styles": {...}}}'
          rows="12"
        ></textarea>
      </div>
      
      <div class="form-group">
        <label class="form-label">状态</label>
        <select v-model="formData.status" class="form-select">
          <option value="pending">审核中</option>
          <option value="on_sale">上架</option>
          <option value="offline">下架</option>
        </select>
      </div>
    </KidModal>
    
    <!-- 详情弹窗 -->
    <KidModal
      v-model:show="showDetailModal"
      title="🎨 {{ selectedTheme?.themeName }}"
      size="lg"
      closable
      :show-footer="false"
    >
      <div v-if="selectedTheme" class="detail-content">
        <div class="detail-row">
          <span class="detail-label">主题 ID:</span>
          <span class="detail-value">{{ selectedTheme.themeId }}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">作者 ID:</span>
          <span class="detail-value">{{ selectedTheme.authorId }}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">作者名称:</span>
          <span class="detail-value">{{ selectedTheme.authorName }}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">价格:</span>
          <span class="detail-value">{{ selectedTheme.price || 0 }} 游戏币</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">状态:</span>
          <span class="detail-value">{{ getStatusText(selectedTheme.status) }}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">下载次数:</span>
          <span class="detail-value">{{ selectedTheme.downloadCount || 0 }}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">总收益:</span>
          <span class="detail-value">{{ selectedTheme.totalRevenue || 0 }} 游戏币</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">创建时间:</span>
          <span class="detail-value">{{ formatDate(selectedTheme.createdAt) }}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">更新时间:</span>
          <span class="detail-value">{{ formatDate(selectedTheme.updatedAt) }}</span>
        </div>
        
        <div class="detail-row full-width">
          <span class="detail-label">描述:</span>
          <span class="detail-value">{{ selectedTheme.description || '无' }}</span>
        </div>
        
        <div class="detail-row full-width">
          <span class="detail-label">配置 JSON:</span>
          <pre class="json-preview">{{ JSON.stringify(selectedTheme.configJson, null, 2) }}</pre>
        </div>
      </div>
    </KidModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import axios from 'axios';
import KidModal from '@/components/ui/KidModal.vue';
import { dialog, useConfirm } from '@/composables/useDialog';

const API_BASE = '/api';

interface ThemeInfo {
  themeId: number;
  authorId: number;
  themeName: string;
  authorName: string;
  price: number;
  status: 'on_sale' | 'offline' | 'pending';
  downloadCount: number;
  totalRevenue: number;
  thumbnailUrl?: string;
  description?: string;
  configJson: any;
  createdAt: string;
  updatedAt: string;
}

// 响应式数据
const themes = ref<ThemeInfo[]>([]);
const loading = ref(false);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDetailModal = ref(false);
const selectedTheme = ref<ThemeInfo | null>(null);

const formData = reactive<Partial<ThemeInfo>>({
  themeName: '',
  authorName: '官方',
  price: 0,
  thumbnailUrl: '',
  description: '',
  configJson: null,
  status: 'pending',
});

const filters = reactive({
  themeName: '',
  status: '',
});

const pagination = reactive({
  current: 1,
  size: 20,
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

// 加载主题列表
async function loadThemes() {
  loading.value = true;
  try {
    const params: any = {
      status: filters.status || undefined,
      page: pagination.current,
      pageSize: pagination.size,
    };
    
    const response = await axios.get(`${API_BASE}/theme/list`, { 
      params,
      ...getAuthHeaders()
    });
    
    if (response.data.success && response.data.data) {
      themes.value = response.data.data.list || [];
      pagination.total = response.data.data.total || 0;
      pagination.totalPages = Math.ceil(pagination.total / pagination.size);
    }
  } catch (error: any) {
    console.error('[ThemeManagement] 加载主题列表失败:', error);
    await dialog.error('加载主题列表失败：' + (error.response?.data?.message || error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
}

// 翻页
function goToPage(page: number) {
  if (page < 1 || page > pagination.totalPages) return;
  pagination.current = page;
  loadThemes();
}

// 查看主题详情
function viewThemeDetail(theme: ThemeInfo) {
  selectedTheme.value = theme;
  showDetailModal.value = true;
}

// 编辑主题
function editTheme(theme: ThemeInfo) {
  Object.assign(formData, theme);
  showEditModal.value = true;
  showCreateModal.value = true; // 复用创建弹窗
}

// 切换主题状态
async function toggleThemeStatus(theme: ThemeInfo) {
  const newStatus = theme.status === 'on_sale' ? 'offline' : 'on_sale';
  const action = newStatus === 'on_sale' ? '上架' : '下架';
  const onSale = newStatus === 'on_sale';
  
  const confirmed = await useConfirm({ message: `确定要${action}主题"${theme.themeName}"吗？`, title: '确认操作' });
  if (!confirmed) return;
  
  try {
    const response = await axios.post(
      `${API_BASE}/theme/toggle-sale`,
      null,
      {
        params: { themeId: theme.themeId, onSale },
        ...getAuthHeaders()
      }
    );
    
    if (response.data.success) {
      await dialog.success(`${action}成功！`);
      loadThemes();
    } else {
      await dialog.error(`${action}失败：` + (response.data.message || '未知错误'));
    }
  } catch (error: any) {
    console.error('[ThemeManagement] 切换状态失败:', error);
    await dialog.error('操作失败：' + (error.response?.data?.message || error.message || '未知错误'));
  }
}

// 删除主题
async function deleteTheme(theme: ThemeInfo) {
  const confirmed = await useConfirm({ message: `确定要删除主题"${theme.themeName}"吗？此操作不可恢复！`, title: '删除确认', confirmVariant: 'danger' });
  if (!confirmed) return;
  
  try {
    const response = await axios.post(
      `${API_BASE}/theme/delete`,
      { themeId: theme.themeId },
      getAuthHeaders()
    );
    
    if (response.data.success) {
      await dialog.success('删除成功！');
      loadThemes();
    } else {
      await dialog.error('删除失败：' + (response.data.message || '未知错误'));
    }
  } catch (error: any) {
    console.error('[ThemeManagement] 删除失败:', error);
    await dialog.error('删除失败：' + (error.response?.data?.message || error.message || '未知错误'));
  }
}

// 提交表单
async function submitForm() {
  if (!formData.themeName) {
    await dialog.warning('请输入主题名称');
    return;
  }
  
  try {
    let configJsonObj;
    try {
      configJsonObj = typeof formData.configJson === 'string' 
        ? JSON.parse(formData.configJson) 
        : formData.configJson;
    } catch (e) {
      await dialog.error('主题配置 JSON 格式错误，请检查');
      return;
    }
    
    const payload = {
      themeName: formData.themeName,
      authorName: formData.authorName,
      price: formData.price || 0,
      thumbnailUrl: formData.thumbnailUrl,
      description: formData.description,
      config: configJsonObj,
      status: formData.status,
    };
    
    const response = await axios.post(
      `${API_BASE}/theme/upload`,
      payload,
      getAuthHeaders()
    );
    
    if (response.data.code === 200) {
      await dialog.success('保存成功！');
      showCreateModal.value = false;
      loadThemes();
    } else {
      await dialog.error('保存失败：' + (response.data.msg || '未知错误'));
    }
  } catch (error: any) {
    console.error('[ThemeManagement] 保存失败:', error);
    await dialog.error('保存失败：' + (error.response?.data?.message || error.message || '未知错误'));
  }
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

// 获取封面样式
function getCoverStyle(thumbnailUrl?: string) {
  if (thumbnailUrl) {
    return {
      backgroundImage: `url(${thumbnailUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return {};
}

// 格式化日期
function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleString('zh-CN');
  } catch {
    return dateStr;
  }
}

// 生命周期
onMounted(() => {
  loadThemes();
});
</script>

<style scoped>
.theme-management {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100%;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-filters {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.search-input:focus,
.filter-select:focus {
  border-color: #42b983;
}

.btn-search,
.btn-create {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-search {
  background: #42b983;
  color: white;
}

.btn-search:hover {
  background: #36a96d;
}

.btn-create {
  background: #409eff;
  color: white;
}

.btn-create:hover {
  background: #3a90e8;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.theme-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.theme-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.theme-card.disabled {
  opacity: 0.6;
  filter: grayscale(0.5);
}

.card-cover {
  height: 160px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.cover-icon {
  font-size: 64px;
  opacity: 0.8;
}

.card-body {
  padding: 15px;
}

.theme-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.theme-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.tag {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.tag.author {
  background: #e6f7ff;
  color: #1890ff;
}

.tag.price {
  background: #fff7e6;
  color: #fa8c16;
}

.theme-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.on_sale {
  background: #e6ffed;
  color: #52c41a;
}

.status-badge.offline {
  background: #f5f5f5;
  color: #999;
}

.status-badge.pending {
  background: #fff7e6;
  color: #fa8c16;
}

.card-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 15px;
  border-top: 1px solid #f0f0f0;
}

.card-actions button {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
}

.card-actions button:hover {
  background: #f5f7fa;
}

.btn-view {
  color: #409eff;
  border-color: #409eff;
}

.btn-edit {
  color: #42b983;
  border-color: #42b983;
}

.btn-toggle {
  color: #e6a23c;
  border-color: #e6a23c;
}

.btn-delete {
  color: #f56c6c;
  border-color: #f56c6c;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pagination button {
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination button:not(:disabled):hover {
  background: #f5f7fa;
}

.page-info {
  font-size: 14px;
  color: #666;
}

.page-size {
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.theme-form-modal,
.theme-detail-modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eaeaea;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.btn-close-icon {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.btn-close-icon:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: #42b983;
}

.form-textarea {
  resize: vertical;
  font-family: 'Courier New', monospace;
}

.form-textarea.code-editor {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
}

.json-editor-hint {
  font-size: 12px;
  color: #999;
  margin-bottom: 6px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid #eaeaea;
}

.btn-cancel,
.btn-submit,
.btn-close {
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  border: none;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e8e8e8;
}

.btn-submit {
  background: #42b983;
  color: white;
}

.btn-submit:hover {
  background: #36a96d;
}

.btn-close {
  background: #409eff;
  color: white;
}

.btn-close:hover {
  background: #3a90e8;
}

/* Detail modal styles */
.detail-content {
  display: grid;
  gap: 12px;
}

.detail-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 10px;
  align-items: start;
}

.detail-row.full-width {
  grid-template-columns: 1fr;
}

.detail-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
  padding-top: 4px;
}

.detail-value {
  font-size: 14px;
  color: #333;
}

.json-preview {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  overflow-x: auto;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
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
</style>
