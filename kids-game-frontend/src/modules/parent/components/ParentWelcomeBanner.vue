<template>
  <section class="welcome-banner">
    <div class="welcome-content">
      <div class="welcome-header">
        <h2 class="welcome-title">
          你好，家长！👨‍👩‍👧
        </h2>
        <div class="welcome-decoration">🌟</div>
      </div>
      <p class="welcome-subtitle">今天要玩什么游戏呢？</p>
      <div class="welcome-stats">
        <div class="stat-item">
          <span class="stat-icon">🎮</span>
          <div class="stat-content">
            <span class="stat-label">游戏次数</span>
            <span class="stat-value">{{ stats?.game?.todayCount || 0 }}</span>
          </div>
        </div>
        <div class="stat-item">
          <span class="stat-icon">⏱️</span>
          <div class="stat-content">
            <span class="stat-label">游戏时长</span>
            <span class="stat-value">{{ formatDuration(stats?.game?.todayDuration || 0) }}</span>
          </div>
        </div>
        <div class="stat-item">
          <span class="stat-icon">📝</span>
          <div class="stat-content">
            <span class="stat-label">答题次数</span>
            <span class="stat-value">{{ stats?.answer?.todayCount || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- 孩子列表 -->
      <div class="children-section">
        <div class="children-title">
          <span>👶</span>
          <span>我的孩子</span>
          <span class="children-count">({{ children?.length || 0 }})</span>
          <button class="add-child-btn secondary" @click="$emit('bind-child')">
            <span class="add-icon">🔗</span>
            <span>绑定已有孩子</span>
          </button>
        </div>
        <div v-if="children && children.length > 0" class="children-list">
          <div
            v-for="child in children"
            :key="child.kidId"
            class="child-card"
          >
            <div class="child-card-header">
              <div class="child-avatar">
                <span v-if="child.avatar" class="avatar-placeholder">{{ child.avatar }}</span>
                <span v-else class="avatar-placeholder">👦</span>
              </div>
              <div class="child-info">
                <div class="child-name">{{ child.nickname || '未设置昵称' }}</div>
              </div>
            </div>
            <div class="child-card-body">
              <div class="child-details">
                <span class="child-grade">{{ child.grade || '未设置年级' }}</span>
                <span class="child-points">
                  积分: {{ child.dailyAnswerPoints || 0 }}
                </span>
              </div>
              <div class="child-actions">
                <button class="action-btn manage-btn" @click="$emit('manage-child', child)">
                  <span>⚙️</span>
                  <span>管理</span>
                </button>
                <button class="action-btn delete-btn" @click="$emit('delete-child', child)">
                  <span>🗑️</span>
                  <span>删除</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-children">
          <span>还没有绑定孩子</span>
          <button class="add-child-btn secondary" @click="$emit('bind-child')">
            <span class="add-icon">🔗</span>
            <span>立即绑定</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Kid } from '@/services/api.types';

defineProps<{
  stats?: {
    game?: {
      todayCount?: number;
      todayDuration?: number;
    };
    answer?: {
      todayCount?: number;
    };
  };
  children?: Kid[];
}>();

defineEmits<{
  'bind-child': [];
  'manage-child': [child: Kid];
  'delete-child': [child: Kid];
}>();

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}小时${mins > 0 ? `${mins}分钟` : ''}`;
}
</script>

<style scoped>
.welcome-banner {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 215, 0, 0.3);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.welcome-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.welcome-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-title {
  font-size: 1.8rem;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.welcome-decoration {
  font-size: 2.5rem;
  animation: twinkle 2s infinite;
}

@keyframes twinkle {
  0%, 100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1) rotate(10deg);
  }
}

.welcome-title {
  font-size: 1.8rem;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.welcome-subtitle {
  font-size: 1.1rem;
  color: #666;
  margin: 0;
  font-weight: 500;
}

.children-section {
  margin: 1.5rem 0;
}

.children-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.children-title > *:nth-child(-n+3) {
  flex-shrink: 0;
}

.children-title > .add-child-btn {
  margin-left: auto;
}

.children-count {
  color: #999;
  font-size: 0.9rem;
  font-weight: normal;
}

.children-actions {
  display: flex;
  gap: 0.5rem;
}

.add-child-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.add-child-btn.secondary {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
}

.add-child-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.add-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.no-children {
  padding: 2rem;
  text-align: center;
  background: #f9fafb;
  border-radius: 12px;
  color: #999;
  font-size: 0.95rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.no-children .add-child-btn {
  margin-top: 0.5rem;
}

.children-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.child-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: white;
  padding: 1.25rem;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s;
  cursor: pointer;
  min-height: 150px;
}

.child-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  border-color: #667eea;
}

.child-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.child-card-header .child-info {
  flex: 1;
  min-width: 0;
}

.child-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.child-avatar {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  border-radius: 50%;
  border: 2px solid #667eea;
  font-size: 2rem;
  flex-shrink: 0;
}

.avatar-placeholder {
  font-size: 1.5rem;
}

.child-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.child-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.child-details {
  display: flex;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: #666;
  flex-wrap: wrap;
}

.child-grade {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  font-weight: 500;
}

.child-points {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  font-weight: 500;
}

.child-actions {
  display: flex;
  gap: 0.5rem;
  opacity: 1;
  margin-top: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  flex: 1;
}

.manage-btn {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #333;
}

.manage-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(253, 230, 138, 0.4);
}

.delete-btn {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
}

.delete-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(254, 202, 202, 0.4);
}

.welcome-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.stat-icon {
  font-size: 2rem;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  color: #666;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

@media (max-width: 768px) {
  .welcome-stats {
    grid-template-columns: 1fr;
  }

  .welcome-title {
    font-size: 1.4rem;
  }

  .children-list {
    grid-template-columns: 1fr;
  }

  .child-card {
    min-height: auto;
  }

  .children-title {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .add-child-btn {
    width: 100%;
    justify-content: center;
    margin-top: 0.5rem;
  }
}
</style>
