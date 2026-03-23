<template>
  <div 
    class="theme-card"
    :class="{ 'is-offline': theme.status === 'offline', 'disabled': mode === 'admin' && theme.status === 'offline' }"
  >
    <!-- 卡片头部：封面 -->
    <div class="card-header">
      <div class="card-cover" :style="getCoverStyle(theme)">
        <div v-if="!theme.thumbnailUrl && !thumbnailUrl" class="cover-placeholder">
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
      <div class="theme-tags" v-if="mode !== 'admin'">
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

      <!-- 归属信息（后台管理显示作者和价格） -->
      <div class="theme-meta">
        <template v-if="mode === 'admin'">
          <div class="meta-simple">
            <span class="meta-icon">👤</span>
            <span>{{ theme.authorName }}</span>
          </div>
          <div class="meta-simple">
            <span class="meta-icon">💰</span>
            <span>{{ theme.price || 0 }}币</span>
          </div>
        </template>
        <template v-else-if="theme.gameName || theme.authorName">
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
        </template>
      </div>
      
      <!-- 统计数据 -->
      <div class="theme-stats">
        <template v-if="mode === 'admin'">
          <div class="stat-item">
            <span class="stat-icon">📥</span>
            <span class="stat-value">{{ theme.downloadCount || 0 }}次</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">💵</span>
            <span class="stat-value">{{ theme.totalRevenue || 0 }}币</span>
          </div>
        </template>
        <template v-else>
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
        </template>
      </div>
    </div>

    <!-- 卡片底部：操作按钮（由父组件通过插槽自定义） -->
    <div class="card-footer">
      <slot name="actions">
        <!-- 默认插槽内容，由使用方自定义 -->
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
// Props
defineProps<{
  theme: any;
  mode?: 'creator' | 'admin'; // 'creator': 创作者中心，'admin': 后台管理
  thumbnailUrl?: string;
}>();

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

  const url = theme.thumbnailUrl || theme.coverUrl;
  if (url && url.trim()) {
    return {
      backgroundImage: `url(${url})`,
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
</script>

<style scoped lang="scss">
// 主题卡片
.theme-card {
  background: white;
  border-radius: 12px; // 调整圆角，更柔和
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08); // 更柔和的阴影
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); // 更流畅的过渡
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 0, 0, 0.04); // 细微的边框

  &:hover {
    transform: translateY(-6px); // 更大的悬浮效果
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15); // 更深的阴影
  }

  &.is-offline {
    opacity: 0.7;

    .theme-name {
      color: #a0aec0;
    }
  }

  &.disabled {
    opacity: 0.6;
    filter: grayscale(0.5);
  }
}

// 卡片头部：封面
.card-header {
  position: relative;
  height: 140px; // 调整高度，更适中
  overflow: hidden;
}

.card-cover {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); // 更流畅的缩放

  .theme-card:hover & {
    transform: scale(1.08); // 更大的缩放效果
  }
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  span {
    font-size: 56px; // 调整图标大小
    opacity: 0.6; // 更好的可见度
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
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); // 添加阴影增强立体感

  &.current {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%);
    color: white;
  }

  &.pending {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(217, 119, 6, 0.95) 100%);
    color: white;
  }

  &.offline {
    background: linear-gradient(135deg, rgba(107, 114, 128, 0.95) 0%, rgba(75, 85, 99, 0.95) 100%);
    color: white;
  }
}

// 价格标签
.card-price {
  position: absolute;
  bottom: 8px;
  left: 8px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(234, 179, 8, 0.95) 100%);
  color: white;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); // 添加阴影

  &.free {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%);
  }
}

// 卡片主体
.card-body {
  padding: 16px; // 增加内边距
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px; // 添加间距
}

// 主题名称
.theme-name {
  position: relative;
  font-size: 15px; // 调整字体大小
  font-weight: 600; // 调整字重
  color: #1e293b;
  margin-bottom: 8px;
  line-height: 1.4; // 调整行高

  .name-text {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: help;
    transition: color 0.2s; // 添加颜色过渡
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
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s; // 添加过渡效果

  &.tag-official {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    color: #92400e;
    border: 1px solid #fcd34d;
    box-shadow: 0 1px 3px rgba(251, 191, 36, 0.2); // 添加阴影
  }

  &.tag-mine {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    color: #1e40af;
    border: 1px solid #93c5fd;
    box-shadow: 0 1px 3px rgba(59, 130, 246, 0.2); // 添加阴影
  }

  &.tag-purchased {
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    color: #065f46;
    border: 1px solid #6ee7b7;
    box-shadow: 0 1px 3px rgba(16, 185, 129, 0.2); // 添加阴影
  }

  &.tag-default {
    background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
    color: #5b21b6;
    border: 1px solid #c4b5fd;
    box-shadow: 0 1px 3px rgba(139, 92, 246, 0.2); // 添加阴影
  }

  &.tag-scope {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(102, 126, 234, 0.08) 100%);
    color: #667eea;
    border: 1px solid rgba(102, 126, 234, 0.25);

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
  border-radius: 10px; // 更圆润的边角
  border-left: 3px solid #0284c7;
  padding: 10px 12px; // 增加内边距
  margin-bottom: 10px;
}

.meta-simple {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
  font-weight: 500; // 增加字重
  
  &:not(:last-child) {
    margin-bottom: 6px;
  }
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.meta-icon {
  font-size: 13px; // 稍大一点的图标
}

.meta-label {
  color: #94a3b8; // 更浅的颜色
  font-weight: 500;
}

.meta-value {
  color: #1e293b;
  font-weight: 600; // 加粗数值
}

// 统计数据
.theme-stats {
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  margin-top: auto;
  gap: 12px; // 添加间距
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #64748b;
  flex: 1; // 平均分布
}

.stat-icon {
  font-size: 13px; // 稍大的图标
}

.stat-value {
  font-weight: 600;
  color: #475569;
}

// 卡片底部
.card-footer {
  padding: 12px 16px; // 增加内边距
  border-top: 1px solid #f1f5f9; // 更浅的分隔线
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px; // 增加间距

  // 当按钮数量不是4的倍数时，最后一个按钮填充剩余空间
  button:last-child {
    // 当按钮总数是2或3个时，让最后一个按钮填满剩余空间
    &:nth-child(2):last-child {
      grid-column: span 2;
    }
    &:nth-child(3):last-child {
      grid-column: span 2;
    }
    &:nth-child(5):last-child {
      grid-column: span 2;
    }
    &:nth-child(6):last-child {
      grid-column: 1 / -1;
    }
  }
}
</style>
