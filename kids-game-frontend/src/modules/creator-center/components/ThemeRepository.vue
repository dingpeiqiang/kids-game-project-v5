<template>
  <section class="theme-repository">
    <div class="section-header">
      <h2 class="section-title">
        <span class="title-icon">{{ mode === 'repository' ? '🏪' : '🎨' }}</span>
        <span class="title-text">{{ mode === 'repository' ? '主题仓库' : '我的主题' }}</span>
      </h2>
      <p class="section-desc">{{ getSectionDescription() }}</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在加载主题仓库...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="themes.length === 0" class="empty-state">
      <div class="empty-illustration">🏪</div>
      <h3>暂无主题</h3>
      <p>请先从主题商店下载一个主题，然后基于它进行 DIY</p>
    </div>

    <!-- 主题列表 -->
    <div v-else class="repository-themes-grid">
      <div 
        v-for="theme in themes" 
        :key="theme.id || theme.themeId"
        class="theme-card"
        :class="{ 'is-offline': theme.status === 'offline' }"
      >
        <!-- 卡片头部：封面 -->
        <div class="card-header">
          <div class="card-cover" :style="getCoverStyle(theme)">
            <div v-if="!theme.thumbnailUrl" class="cover-placeholder">
              <span>🎨</span>
            </div>
          </div>
          
          <!-- 右上角状态 -->
          <div class="card-status">
            <span v-if="theme.isCurrent" class="status-badge current">✓ 使用中</span>
            <span v-else-if="theme.status === 'pending'" class="status-badge pending">⏳ 审核中</span>
            <span v-else-if="theme.status === 'offline'" class="status-badge offline">🚫 下架</span>
          </div>
          
          <!-- 价格标签 -->
          <div class="card-price" :class="{ free: theme.price === 0 }">
            {{ theme.price === 0 ? '免费' : `¥${theme.price}` }}
          </div>
        </div>

        <!-- 卡片主体 -->
        <div class="card-body">
          <!-- 主题名称（悬停显示描述） -->
          <h3 class="theme-name" :class="{ 'has-desc': !!theme.description }">
            <span class="name-text">{{ theme.name || theme.themeName }}</span>
            <span v-if="theme.description" class="name-popup">
              <div class="popup-title">主题描述</div>
              <div class="popup-content">{{ theme.description }}</div>
            </span>
          </h3>
          
          <!-- 标签区域 -->
          <div class="theme-tags">
            <!-- 第一行：来源 + 默认 -->
            <div class="tag-row">
              <span v-if="theme.isOfficial" class="tag tag-official">🏛️ 官方</span>
              <span v-else-if="theme.source === 'mine'" class="tag tag-mine">🎨 我的</span>
              <span v-else-if="theme.source === 'purchased'" class="tag tag-purchased">🛒 已购</span>
              <span v-if="theme.isDefault" class="tag tag-default">⭐ 默认</span>
            </div>
            
            <!-- 第二行：适用范围 -->
            <div class="tag-row tag-row-right">
              <span class="tag tag-scope" :class="getOwnerTypeClass(theme.ownerType)">
                {{ getOwnerTypeIcon(theme.ownerType) }} {{ getOwnerTypeText(theme.ownerType) }}
              </span>
            </div>
          </div>

          <!-- 归属信息 -->
          <div class="theme-meta" v-if="theme.gameName || theme.authorName">
            <div v-if="theme.gameName" class="meta-item">
              <span class="meta-icon">🎮</span>
              <span class="meta-label">游戏:</span>
              <span class="meta-value">{{ theme.gameName }}</span>
            </div>
            <div v-if="theme.authorName" class="meta-item">
              <span class="meta-icon">👤</span>
              <span class="meta-label">作者:</span>
              <span class="meta-value">{{ theme.authorName }}</span>
            </div>
          </div>
          
          <!-- 统计数据 -->
          <div class="theme-stats">
            <div class="stat-item">
              <span class="stat-icon">⬇️</span>
              <span class="stat-value">{{ theme.downloadCount || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">⭐</span>
              <span class="stat-value">{{ theme.rating || 'N/A' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">📅</span>
              <span class="stat-value">{{ formatDate(theme.createdAt) }}</span>
            </div>
          </div>
        </div>

        <!-- 卡片底部：操作按钮 -->
        <div class="card-footer">
          <!-- 官方主题操作 -->
          <template v-if="theme.source === 'official'">
            <button class="btn-action btn-view" @click="handleView(theme)">👁️ 查看</button>
            <button class="btn-action btn-diy" @click="handleDIY(theme)">✨ DIY</button>
            <button v-if="!theme.isDefault" class="btn-action btn-use" @click="handleUse(theme)">🎯 使用</button>
          </template>

          <!-- 我的主题操作 -->
          <template v-else-if="theme.source === 'mine' || !theme.source">
            <template v-if="theme.status === 'pending'">
              <div class="pending-hint">
                <span class="pending-icon">⏳</span>
                <span class="pending-text">审核中，请稍候...</span>
              </div>
            </template>
            <template v-else>
              <button class="btn-action btn-view" @click="handleView(theme)">👁️ 查看</button>
              <button class="btn-action btn-diy" @click="handleDIY(theme)">✨ DIY</button>
              <button class="btn-action btn-toggle" @click="handleToggle(theme)" :disabled="isToggling">
                {{ theme.status === 'on_sale' ? '⬇️ 下架' : '⬆️ 上架' }}
              </button>
              <button class="btn-action btn-edit" @click="handleEdit(theme)">✏️ 修改</button>
              <button class="btn-action btn-delete" @click="handleDelete(theme)">🗑️ 删除</button>
              <button v-if="!theme.isDefault" class="btn-action btn-use" @click="handleUse(theme)">🎯 使用</button>
            </template>
          </template>

          <!-- 已购主题操作 -->
          <template v-else-if="theme.source === 'purchased'">
            <button class="btn-action btn-view" @click="handleView(theme)">👁️ 查看</button>
            <button class="btn-action btn-diy" @click="handleDIY(theme)">✨ DIY</button>
            <button v-if="!theme.isDefault" class="btn-action btn-use" @click="handleUse(theme)">🎯 使用</button>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { CloudThemeInfo } from '@/core/theme/ThemeManager';
import { useConfirm } from '@/composables/useDialog';

// Props - 支持模式切换
const props = defineProps<{
  themes: any[];
  loading?: boolean;
  mode?: 'repository' | 'mine'; // 'repository': 主题仓库，'mine': 我的主题
}>();

// 获取分区描述文本
function getSectionDescription() {
  if (props.mode === 'mine') {
    return '展示我创作的主题（支持上架、下架、编辑等操作）';
  }
  return '展示所有可用主题（官方 + 购买 + 我的）';
}

// Emits
const emit = defineEmits<{
  view: [theme: any];
  diy: [theme: any];
  use: [theme: any];
  toggle: [theme: CloudThemeInfo];
  edit: [theme: CloudThemeInfo];
  delete: [theme: CloudThemeInfo];
}>();

// 操作锁
const isToggling = ref(false);

// 格式化日期
function formatDate(date: string | number | undefined) {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return 'N/A';
  }
}

// 获取封面样式
function getCoverStyle(theme: any) {
  const gradientBg = { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };

  if (theme.thumbnailUrl && theme.thumbnailUrl.trim()) {
    return {
      backgroundImage: `url(${theme.thumbnailUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      ...gradientBg,
    };
  }
  return gradientBg;
}

// 获取类型图标
function getOwnerTypeIcon(ownerType?: 'GAME' | 'APPLICATION'): string {
  if (ownerType === 'GAME') return '🎮';
  return '📱';
}

// 获取类型文本
function getOwnerTypeText(ownerType?: 'GAME' | 'APPLICATION'): string {
  if (ownerType === 'GAME') return '游戏主题';
  return '应用主题';
}

// 获取类型样式类名
function getOwnerTypeClass(ownerType?: 'GAME' | 'APPLICATION'): string {
  if (ownerType === 'GAME') return 'game';
  return 'application';
}

// 查看主题
function handleView(theme: any) {
  emit('view', theme);
}

// DIY 主题
function handleDIY(theme: any) {
  emit('diy', theme);
}

// 使用主题
function handleUse(theme: any) {
  emit('use', theme);
}

// 处理切换上下架
async function handleToggle(theme: CloudThemeInfo) {
  if (isToggling.value) return;
  
  isToggling.value = true;
  try {
    emit('toggle', theme);
  } finally {
    isToggling.value = false;
  }
}

// 处理编辑
function handleEdit(theme: CloudThemeInfo) {
  emit('edit', theme);
}

// 处理删除
async function handleDelete(theme: CloudThemeInfo) {
  const confirmed = await useConfirm({ message: `确定要删除主题"${theme.name}"吗？此操作不可恢复!`, title: '删除确认', confirmVariant: 'danger' });
  if (confirmed) emit('delete', theme);
}
</script>

<style scoped lang="scss">
// 页面标题
.section-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  color: #2d3748;

  .title-icon {
    font-size: 28px;
  }
}

.section-desc {
  font-size: 14px;
  color: #718096;
  margin-left: 38px;
}

// 加载/空状态
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

// 主题卡片网格
.repository-themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

// 主题卡片
.theme-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  }

  &.is-offline {
    opacity: 0.7;

    .theme-name {
      color: #a0aec0;
    }
  }
}

// 卡片头部：封面
.card-header {
  position: relative;
  height: 120px;
  overflow: hidden;
}

.card-cover {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: transform 0.3s ease;

  .theme-card:hover & {
    transform: scale(1.05);
  }
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  span {
    font-size: 40px;
    opacity: 0.5;
  }
}

// 右上角状态
.card-status {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-badge {
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  backdrop-filter: blur(8px);

  &.current {
    background: rgba(16, 185, 129, 0.9);
    color: white;
  }

  &.pending {
    background: rgba(245, 158, 11, 0.9);
    color: white;
  }

  &.offline {
    background: rgba(107, 114, 128, 0.9);
    color: white;
  }
}

// 价格标签
.card-price {
  position: absolute;
  bottom: 8px;
  left: 8px;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(245, 158, 11, 0.9);
  color: white;
  backdrop-filter: blur(8px);

  &.free {
    background: rgba(16, 185, 129, 0.9);
  }
}

// 卡片主体
.card-body {
  padding: 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

// 主题名称
.theme-name {
  position: relative;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 10px;
  line-height: 1.3;

  .name-text {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: help;
  }

  &:hover .name-text {
    color: #3b82f6;
  }

  &.has-desc:hover .name-popup {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
}

// 标签区域
.theme-tags {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.tag-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;

  &.tag-row-right {
    justify-content: flex-end;
  }
}

.tag {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;

  &.tag-official {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    color: #92400e;
    border: 1px solid #fcd34d;
  }

  &.tag-mine {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    color: #1e40af;
    border: 1px solid #93c5fd;
  }

  &.tag-purchased {
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    color: #065f46;
    border: 1px solid #6ee7b7;
  }

  &.tag-default {
    background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
    color: #5b21b6;
    border: 1px solid #c4b5fd;
  }

  &.tag-scope {
    background: rgba(102, 126, 234, 0.1);
    color: #667eea;
    border: 1px solid rgba(102, 126, 234, 0.2);

    &.game {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
    }

    &.application {
      background: rgba(236, 72, 153, 0.1);
      color: #db2777;
    }
  }
}

// 悬浮卡片（悬停时显示）
.name-popup {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  min-width: 200px;
  max-width: 280px;
  padding: 14px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08);
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 20px;
    width: 12px;
    height: 12px;
    background: white;
    transform: rotate(45deg);
    box-shadow: -2px -2px 4px rgba(0, 0, 0, 0.04);
  }

  .popup-title {
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }

  .popup-content {
    font-size: 13px;
    color: #334155;
    line-height: 1.6;
    word-break: break-word;
  }
}

// 归属信息
.theme-meta {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  border-left: 3px solid #0284c7;
  padding: 8px 10px;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.meta-icon {
  font-size: 12px;
}

.meta-label {
  color: #64748b;
  font-weight: 500;
}

.meta-value {
  color: #1e293b;
  font-weight: 600;
}

// 统计数据
.theme-stats {
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
  margin-top: auto;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
}

.stat-icon {
  font-size: 12px;
}

.stat-value {
  font-weight: 600;
  color: #475569;
}

// 卡片底部
.card-footer {
  padding: 10px 14px;
  border-top: 1px solid #e2e8f0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 8px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 11px;

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

  &.btn-use {
    background: rgba(72, 187, 120, 0.1);
    color: #38a169;

    &:hover {
      background: rgba(72, 187, 120, 0.2);
    }
  }

  &.btn-toggle {
    background: rgba(102, 126, 234, 0.1);
    color: #667eea;

    &:hover:not(:disabled) {
      background: rgba(102, 126, 234, 0.2);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &.btn-edit {
    background: rgba(78, 205, 196, 0.1);
    color: #4ECDC4;

    &:hover {
      background: rgba(78, 205, 196, 0.2);
    }
  }

  &.btn-delete {
    background: rgba(244, 67, 54, 0.1);
    color: #F44336;

    &:hover {
      background: rgba(244, 67, 54, 0.2);
    }
  }
}

// 审核中提示
.pending-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(234, 179, 8, 0.1) 100%);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #d97706;
  grid-column: 1 / -1;

  .pending-icon {
    font-size: 14px;
    animation: pulse 2s ease-in-out infinite;
  }

  .pending-text {
    color: #92400e;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// 响应式
@media (max-width: 640px) {
  .repository-themes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
