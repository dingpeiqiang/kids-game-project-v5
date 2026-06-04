<template>
  <div 
    class="game-card"
    :class="{ 'disabled': game.status === 0 }"
  >
    <!-- 卡片头部：封面 -->
    <div class="card-header">
      <div class="card-cover" :style="getCoverStyle(game)">
        <div v-if="!game.coverUrl && !game.iconUrl" class="cover-placeholder">
          <span>{{ getGameIcon(game.category) }}</span>
        </div>
      </div>
      
      <!-- 右上角状态 -->
      <div class="card-status">
        <span v-if="game.status === 2" class="status-badge on-sale">✓ 已上架</span>
        <span v-else-if="game.status === 3" class="status-badge off-sale">🚫 已下架</span>
        <span v-else-if="game.status === 1" class="status-badge pending">⏳ 待审核</span>
        <span v-else-if="game.status === 0" class="status-badge draft">📝 草稿</span>
        <span v-else-if="game.status === 4" class="status-badge rejected">❌ 驳回</span>
      </div>
      
      <!-- 推荐标签 -->
      <div v-if="game.isFeatured === 1" class="card-featured">
        ⭐ 推荐
      </div>
    </div>

    <!-- 卡片主体 -->
    <div class="card-body">
      <!-- 游戏名称（悬停显示描述） -->
      <h3 class="game-name" :class="{ 'has-desc': !!game.description }">
        <span class="name-text">{{ game.gameName }}</span>
        <span v-if="game.description" class="name-popup">
          <div class="popup-title">游戏描述</div>
          <div class="popup-content">{{ game.description }}</div>
        </span>
      </h3>
      
      <!-- 标签区域 -->
      <div class="game-tags">
        <div class="tag-row">
          <span v-if="game.category" class="tag tag-category">
            {{ getCategoryIcon(game.category) }} {{ getCategoryText(game.category) }}
          </span>
          <span v-if="game.grade" class="tag tag-grade">{{ game.grade }}</span>
        </div>
        
        <div class="tag-row tag-row-right">
          <span v-if="game.creatorId" class="tag tag-creator">👤 创建</span>
        </div>
      </div>

      <!-- 归属信息 -->
      <div class="game-meta">
        <div class="meta-simple">
          <span class="meta-icon">🎮</span>
          <span>{{ game.gameCode }}</span>
        </div>
        <div class="meta-simple">
          <span class="meta-icon">💰</span>
          <span>{{ game.consumePointsPerMinute || 1 }}点/分钟</span>
        </div>
      </div>
      
      <!-- 统计数据 -->
      <div class="game-stats">
        <div class="stat-item">
          <span class="stat-icon">👥</span>
          <span class="stat-value">{{ game.onlineCount || 0 }}人</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">📊</span>
          <span class="stat-value">权重：{{ game.sortOrder || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">⚡</span>
          <span class="stat-value">{{ game.minFatigueToStart || 0 }}点</span>
        </div>
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
  game: any;
}>();

// 获取游戏图标
function getGameIcon(category?: string): string {
  const icons: Record<string, string> = {
    math: '🔢',
    chinese: '📖',
    english: '🔤',
    science: '🔬',
    art: '🎨',
    music: '🎵',
    sports: '⚽',
    default: '🎮'
  };
  return icons[category || 'default'] || '🎮';
}

// 获取分类文本
function getCategoryText(category: string): string {
  const texts: Record<string, string> = {
    math: '数学',
    chinese: '语文',
    english: '英语',
    science: '科学',
    art: '艺术',
    music: '音乐',
    sports: '体育'
  };
  return texts[category] || category;
}

// 获取分类图标
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    math: '🔢',
    chinese: '📖',
    english: '🔤',
    science: '🔬',
    art: '🎨',
    music: '🎵',
    sports: '⚽'
  };
  return icons[category] || '📚';
}

// 获取封面样式
function getCoverStyle(game: any) {
  const gradientBg = { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };

  const url = game.coverUrl || game.iconUrl;
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
</script>

<style scoped lang="scss">
// 游戏卡片
.game-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 0, 0, 0.04);

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  &.disabled {
    opacity: 0.6;
    filter: grayscale(0.5);
  }
}

// 卡片头部
.card-header {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.card-cover {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-placeholder {
  font-size: 64px;
  opacity: 0.8;
}

// 状态标签
.card-status {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 6px;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  &.on-sale {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  }

  &.off-sale {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
  }

  &.pending {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
  }

  &.draft {
    background: linear-gradient(135deg, #6b7280, #4b5563);
    color: white;
  }

  &.rejected {
    background: linear-gradient(135deg, #dc2626, #b91c1c);
    color: white;
  }
}

// 推荐标签
.card-featured {
  position: absolute;
  top: 12px;
  left: 12px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

// 卡片主体
.card-body {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// 游戏名称
.game-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  position: relative;
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: #667eea;
  }

  &.has-desc:hover .name-popup {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
}

.name-popup {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  min-width: 280px;
  max-width: 400px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 10;
  opacity: 0;
  visibility: hidden;
  transform: translateY(8px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  .popup-title {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .popup-content {
    font-size: 14px;
    line-height: 1.6;
    color: #374151;
    max-height: 200px;
    overflow-y: auto;
  }
}

// 标签区域
.game-tags {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &.tag-category {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    color: #1e40af;
  }

  &.tag-grade {
    background: #f3f4f6;
    color: #4b5563;
  }

  &.tag-creator {
    background: #fef3c7;
    color: #92400e;
  }
}

// 归属信息
.game-meta {
  display: flex;
  gap: 16px;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}

.meta-simple {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;

  .meta-icon {
    font-size: 16px;
  }
}

// 统计数据
.game-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;

  .stat-icon {
    font-size: 14px;
  }

  .stat-value {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

// 卡片底部
.card-footer {
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
