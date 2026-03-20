<template>
  <section class="my-themes">
    <div class="section-header">
      <h2 class="section-title">
        <span class="title-icon">🎨</span>
        <span class="title-text">主题管理</span>
      </h2>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在加载主题...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="themes.length === 0" class="empty-state">
      <div class="empty-illustration">🎨</div>
      <h3>暂无主题</h3>
      <p>请先从主题商店下载一个主题，然后基于它进行DIY</p>
    </div>

    <!-- 主题列表 -->
    <div v-else class="my-themes-grid">
      <div 
        v-for="theme in themes" 
        :key="theme.id || theme.themeId"
        class="my-theme-card"
        :class="{ offline: theme.status === 'offline' }"
      >
        <!-- 主题标签 -->
        <div class="theme-badge">
          <!-- 来源标签 -->
          <span v-if="theme.sourceIcon" class="badge-source">
            {{ theme.sourceIcon }} {{ theme.sourceLabel }}
          </span>
          <!-- 状态标签（仅我的主题显示） -->
          <span v-if="theme.source === 'mine' && theme.status" class="badge-status" :class="theme.status">
            {{ theme.status === 'on_sale' ? '在售' : '下架' }}
          </span>
          <!-- 适用范围标签 ⭐ UPDATED -->
          <span class="badge-scope" :class="getOwnerTypeClass(theme.ownerType)">
            {{ getOwnerTypeLabel(theme.ownerType) }}
          </span>
        </div>

        <div class="theme-info">
          <h3 class="theme-name">{{ theme.name || theme.themeName }}</h3>
          <p class="theme-desc">{{ theme.description || '暂无描述' }}</p>
          
          <!-- 游戏名称（仅游戏主题显示） ⭐ UPDATED -->
          <div v-if="theme.ownerType === 'GAME' && theme.gameName" class="game-info">
            <span class="game-label">适用游戏：</span>
            <span class="game-name">{{ theme.gameName }}</span>
          </div>
          
          <div class="theme-stats">
            <div class="stat-item">
              <span class="stat-icon">⬇️</span>
              <span class="stat-value">{{ theme.downloadCount || 0 }}</span>
              <span class="stat-label">下载</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">⭐</span>
              <span class="stat-value">{{ theme.rating || 'N/A' }}</span>
              <span class="stat-label">评分</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">📅</span>
              <span class="stat-value">{{ formatDate(theme.createdAt) }}</span>
              <span class="stat-label">创建</span>
            </div>
          </div>
        </div>

        <!-- 根据主题来源显示不同操作按钮 -->
        <div class="theme-actions">
          <!-- 官方主题操作 -->
          <template v-if="theme.source === 'official'">
            <button class="btn-action btn-view" @click="handleView(theme)">
              👁️ 查看
            </button>
            <button class="btn-action btn-diy" @click="handleDIY(theme)">
              ✨ DIY
            </button>
          </template>

          <!-- 我的主题操作 -->
          <template v-else-if="theme.source === 'mine'">
            <button 
              class="btn-action btn-toggle"
              @click="handleToggle(theme)"
              :disabled="isToggling"
            >
              {{ theme.status === 'on_sale' ? '⬇️ 下架' : '⬆️ 上架' }}
            </button>
            <button class="btn-action btn-edit" @click="handleEdit(theme)">
              ✏️ 编辑
            </button>
            <button class="btn-action btn-stats" @click="handleStats(theme)">
              📊 数据
            </button>
            <button class="btn-action btn-delete" @click="handleDelete(theme)">
              🗑️ 删除
            </button>
          </template>

          <!-- 购买的主题操作 -->
          <template v-else-if="theme.source === 'purchased'">
            <button class="btn-action btn-view" @click="handleView(theme)">
              👁️ 查看
            </button>
            <button class="btn-action btn-use" @click="handleUse(theme)">
              🎯 使用
            </button>
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

// Props
defineProps<{
  themes: any[];
  loading?: boolean;
}>();

// Emits
const emit = defineEmits<{
  create: [];
  view: [theme: any];
  diy: [theme: any];
  use: [theme: any];
  toggle: [theme: CloudThemeInfo];
  edit: [theme: CloudThemeInfo];
  stats: [theme: CloudThemeInfo];
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

// ⭐ 辅助函数：获取类型标签
function getOwnerTypeLabel(ownerType?: 'GAME' | 'APPLICATION'): string {
  if (ownerType === 'GAME') return '🎮 游戏';
  if (ownerType === 'APPLICATION') return '📱 应用';
  return '📱 应用'; // 默认
}

// ⭐ 辅助函数：获取样式类名
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

// 处理查看数据
function handleStats(theme: CloudThemeInfo) {
  emit('stats', theme);
}

// 处理删除
async function handleDelete(theme: CloudThemeInfo) {
  const confirmed = await useConfirm({ message: `确定要删除主题"${theme.name || theme.themeName}"吗？此操作不可恢复!`, title: '删除确认', confirmVariant: 'danger' });
  if (confirmed) emit('delete', theme);
}
</script>

<style scoped lang="scss">
.my-themes {
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

.btn-create {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(78, 205, 196, 0.4);
  }
}

.icon {
  font-size: 18px;
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

.btn-go-official {
  margin-top: 16px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  }
}

.my-themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.my-theme-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  &.offline {
    opacity: 0.7;
    
    .theme-name {
      color: #a0aec0;
    }
  }
}

.theme-badge {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  flex-wrap: wrap;
}

.badge-source {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.badge-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;

  &.on_sale {
    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
    color: white;
  }

  &.offline {
    background: linear-gradient(135deg, #a0aec0 0%, #718096 100%);
    color: white;
  }
}

.badge-scope {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  
  &.all {
    background: linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%);
    color: white;
  }
  
  &.specific {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
  }
}

.game-info {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(240, 147, 251, 0.1);
  border-radius: 8px;
  font-size: 13px;
  
  .game-label {
    color: #718096;
  }
  
  .game-name {
    color: #2d3748;
    font-weight: 600;
    margin-left: 4px;
  }
}

.badge-default {
  padding: 4px 12px;
  background: linear-gradient(135deg, #ecc94b 0%, #d69e2e 100%);
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.theme-info {
  padding: 16px;
}

.theme-name {
  font-size: 18px;
  color: #2d3748;
  margin-bottom: 8px;
}

.theme-desc {
  font-size: 14px;
  color: #718096;
  line-height: 1.5;
  margin-bottom: 16px;
}

.theme-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-icon {
  font-size: 20px;
}

.stat-value {
  font-size: 16px;
  font-weight: bold;
  color: #2d3748;
}

.stat-label {
  font-size: 12px;
  color: #718096;
}

.theme-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
}

.btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;

  &.btn-view {
    background: rgba(102, 126, 234, 0.1);
    color: #667eea;

    &:hover {
      background: rgba(102, 126, 234, 0.2);
    }
  }

  &.btn-diy {
    background: rgba(240, 147, 251, 0.1);
    color: #d53f8c;

    &:hover {
      background: rgba(240, 147, 251, 0.2);
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

  &.btn-stats {
    background: rgba(236, 197, 75, 0.1);
    color: #d69e2e;

    &:hover {
      background: rgba(236, 197, 75, 0.2);
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
</style>
