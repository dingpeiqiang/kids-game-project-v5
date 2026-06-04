<template>
  <div class="leaderboard-container">
    <!-- 维度切换标签 -->
    <div class="dimension-tabs" v-if="dimensions.length > 1">
      <button
        v-for="dim in dimensions"
        :key="dim.dimensionCode"
        :class="['dimension-tab', { active: currentDimension === dim.dimensionCode }]"
        @click="switchDimension(dim.dimensionCode)"
      >
        <span class="dimension-icon">{{ dim.icon }}</span>
        <span class="dimension-name">{{ dim.dimensionName }}</span>
      </button>
    </div>

    <!-- 排行类型切换 -->
    <div class="rank-type-selector">
      <button
        v-for="type in rankTypes"
        :key="type.value"
        :class="['rank-type-btn', { active: currentRankType === type.value }]"
        @click="switchRankType(type.value)"
      >
        {{ type.label }}
      </button>
    </div>

    <!-- 排行榜列表 -->
    <div class="leaderboard-list">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="leaderboardData.length === 0" class="empty-state">
        <div class="empty-icon">📊</div>
        <p>暂无排行数据</p>
      </div>

      <div v-else class="rank-items">
        <div
          v-for="(item, index) in leaderboardData"
          :key="item.userId"
          :class="['rank-item', { 'is-user': item.userId === currentUserId }]"
        >
          <!-- 排名 -->
          <div class="rank-number">
            <span v-if="item.rank === 1" class="medal gold">🥇</span>
            <span v-else-if="item.rank === 2" class="medal silver">🥈</span>
            <span v-else-if="item.rank === 3" class="medal bronze">🥉</span>
            <span v-else class="rank-text">{{ item.rank }}</span>
          </div>

          <!-- 用户信息 -->
          <div class="user-info">
            <div class="avatar" v-if="item.avatarUrl">
              <img :src="item.avatarUrl" :alt="item.nickname || item.username" />
            </div>
            <div class="avatar" v-else>
              {{ (item.nickname || item.username).charAt(0).toUpperCase() }}
            </div>
            <div class="user-details">
              <div class="username">{{ item.nickname || item.username }}</div>
              <div class="update-time" v-if="item.createTime">
                {{ formatTime(item.createTime) }}
              </div>
            </div>
          </div>

          <!-- 分数值 -->
          <div class="rank-value">
            <span class="value-number">{{ formatValue(item) }}</span>
            <span class="value-unit" v-if="currentConfig?.dataType === 'DECIMAL'">%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 我的排名（固定在底部） -->
    <div v-if="myRank && myRank.userRank > 0" class="my-rank-footer">
      <div class="my-rank-content">
        <div class="my-rank-label">我的排名</div>
        <div class="my-rank-info">
          <span class="my-rank-number">#{{ myRank.userRank }}</span>
          <span class="my-rank-value">{{ formatMyRankValue(myRank) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { leaderboardApi } from '@/services/leaderboard-api.service';
import type { LeaderboardConfig, LeaderboardData, LeaderboardRank } from '@/services/api.types';

// Props
interface Props {
  gameId: number;
  currentUserId?: number;
}

const props = withDefaults(defineProps<Props>(), {
  currentUserId: undefined,
});

// 排行类型选项
const rankTypes = [
  { value: 'ALL', label: '总榜' },
  { value: 'DAILY', label: '日榜' },
  { value: 'MONTHLY', label: '月榜' },
  { value: 'YEARLY', label: '年榜' },
];

// 状态
const loading = ref(false);
const dimensions = ref<LeaderboardConfig[]>([]);
const currentDimension = ref<string>('');
const currentRankType = ref<string>('ALL');
const leaderboardData = ref<LeaderboardRank[]>([]);
const myRank = ref<any>(null);
const currentConfig = ref<LeaderboardConfig | null>(null);

// 加载排行榜配置
const loadConfigs = async () => {
  try {
    const configs = await leaderboardApi.getLeaderboardConfigs(props.gameId);
    dimensions.value = configs;
    if (configs.length > 0) {
      currentDimension.value = configs[0].dimensionCode;
      currentConfig.value = configs[0];
    }
  } catch (error) {
    console.error('加载排行榜配置失败:', error);
  }
};

// 加载排行榜数据
const loadLeaderboard = async () => {
  if (!currentDimension.value) return;

  loading.value = true;
  try {
    // 获取排行榜数据
    leaderboardData.value = await leaderboardApi.getLeaderboard(
      props.gameId,
      currentDimension.value,
      currentRankType.value,
      100
    );

    // 获取我的排名
    if (props.currentUserId) {
      myRank.value = await leaderboardApi.getUserBestRank(
        props.currentUserId,
        props.gameId,
        currentDimension.value
      );
    }
  } catch (error) {
    console.error('加载排行榜数据失败:', error);
  } finally {
    loading.value = false;
  }
};

// 切换维度
const switchDimension = (dimensionCode: string) => {
  currentDimension.value = dimensionCode;
  currentConfig.value = dimensions.value.find(d => d.dimensionCode === dimensionCode) || null;
  loadLeaderboard();
};

// 切换排行类型
const switchRankType = (rankType: string) => {
  currentRankType.value = rankType;
  loadLeaderboard();
};

// 格式化显示值
const formatValue = (item: LeaderboardRank) => {
  if (!currentConfig.value) return item.dimensionValue.toString();

  if (currentConfig.value.dataType === 'DECIMAL') {
    return item.decimalValue?.toFixed(2) || '0.00';
  } else if (currentConfig.value.dataType === 'LONG') {
    // 如果是时间，格式化为分：秒
    if (currentDimension.value === 'SPEED' || currentDimension.value === 'COMPLETION_TIME') {
      const seconds = Math.floor(item.dimensionValue / 1000);
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return item.dimensionValue.toLocaleString();
  }
  return item.dimensionValue.toString();
};

// 格式化我的排名值
const formatMyRankValue = (rank: any) => {
  if (!currentConfig.value) return rank.userValue.toString();

  if (currentConfig.value.dataType === 'DECIMAL') {
    return rank.userValue.toFixed(2) + '%';
  } else if (currentConfig.value.dataType === 'LONG') {
    if (currentDimension.value === 'SPEED' || currentDimension.value === 'COMPLETION_TIME') {
      const seconds = Math.floor(rank.userValue / 1000);
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return rank.userValue.toLocaleString();
  }
  return rank.userValue.toString();
};

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 今天
  if (diff < 24 * 60 * 60 * 1000) {
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  // 最近 7 天
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days}天前`;
  }

  // 其他显示日期
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

// 监听变化
watch(() => currentDimension, loadLeaderboard);
watch(() => currentRankType, loadLeaderboard);

// 生命周期
onMounted(() => {
  loadConfigs();
});
</script>

<style scoped>
.leaderboard-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
}

/* 维度切换标签 */
.dimension-tabs {
  display: flex;
  gap: 8px;
  padding: 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.dimension-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s;
}

.dimension-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.dimension-icon {
  font-size: 18px;
}

/* 排行类型选择器 */
.rank-type-selector {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.rank-type-btn {
  flex: 1;
  padding: 8px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s;
}

.rank-type-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

/* 排行榜列表 */
.leaderboard-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.loading-state p,
.empty-state p {
  color: #94a3b8;
  font-size: 14px;
}

/* 排行项 */
.rank-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.3s;
}

.rank-item.is-user {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
}

.rank-number {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.medal {
  font-size: 28px;
}

.rank-text {
  font-size: 18px;
  font-weight: bold;
  color: #64748b;
}

.user-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 16px;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.username {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.update-time {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.rank-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex-shrink: 0;
}

.value-number {
  font-size: 20px;
  font-weight: bold;
  color: #667eea;
}

.value-unit {
  font-size: 12px;
  color: #94a3b8;
}

/* 我的排名底部栏 */
.my-rank-footer {
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-top: 2px solid rgba(255, 255, 255, 0.3);
}

.my-rank-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.my-rank-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.my-rank-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.my-rank-number {
  font-size: 24px;
  font-weight: bold;
  color: white;
}

.my-rank-value {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
}
</style>
