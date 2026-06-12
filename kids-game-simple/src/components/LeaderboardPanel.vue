<template>
  <div class="leaderboard-panel" v-if="visible">
    <!-- 遮罩层 -->
    <div class="overlay" @click="close"></div>

    <!-- 面板内容 -->
    <div class="panel-content">
      <!-- 标题栏 -->
      <div class="panel-header">
        <h2>🏆 排行榜</h2>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <!-- 切换标签 -->
      <div class="tab-bar">
        <button
          v-for="tab in tabs"
          :key="tab.type"
          :class="['tab-btn', { active: currentTab === tab.type }]"
          @click="switchTab(tab.type)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 我的排名 -->
      <div class="my-rank" v-if="myRank">
        <div class="my-rank-info">
          <span class="my-label">我的排名</span>
          <span class="my-rank-num" :class="getRankClass(myRank.rank)">
            {{ myRank.rank ? '#' + myRank.rank : '未上榜' }}
          </span>
          <span class="my-score">{{ formatScore(myRank.score) }} 分</span>
        </div>
      </div>
      <!-- 加载状态 -->
      <div class="loading" v-if="loading">
        <div class="spinner"></div>
        <span>加载中...</span>
      </div>

      <!-- 排行榜列表 -->
      <div class="rank-list" v-else>
        <div
          v-for="(entry, index) in leaderboard"
          :key="entry.userId"
          :class="['rank-item', { 'is-me': entry.userId === currentUserId }]"
        >
          <div class="rank-badge" :class="getRankClass(entry.rank)">
            <span v-if="entry.rank > 3">{{ entry.rank }}</span>
            <span v-else>{{ getRankEmoji(entry.rank) }}</span>
          </div>
          <div class="user-info">
            <div class="avatar">{{ entry.avatar || '👤' }}</div>
            <div class="user-details">
              <span class="username">{{ entry.nickname || entry.username }}</span>
              <span class="user-id" v-if="entry.userId === currentUserId">（我）</span>
            </div>
          </div>
          <div class="score">{{ formatScore(entry.score) }}</div>
        </div>

        <!-- 空状态 -->
        <div class="empty" v-if="leaderboard.length === 0">
          <div class="empty-icon">📭</div>
          <div class="empty-text">暂无数据</div>
          <div class="empty-hint">快来成为第一个上榜的玩家吧！</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { userService } from '../services/userService'
import type { LeaderboardEntry, UserRankInfo } from '../services/leaderboardService'
import { tokenStore } from '../services/apiClient'

// Props
const props = defineProps<{
  visible: boolean
  gameId: string
}>()

// Emits
const emit = defineEmits<{
  close: []
}>()

// 状态
const currentTab = ref<'ALL' | 'DAILY' | 'MONTHLY' | 'YEARLY'>('ALL')
const tabs = [
  { type: 'ALL' as const, label: '总榜' },
  { type: 'DAILY' as const, label: '日榜' },
  { type: 'MONTHLY' as const, label: '月榜' },
  { type: 'YEARLY' as const, label: '年榜' }
]

const loading = ref(false)
const leaderboard = ref<LeaderboardEntry[]>([])
const myRank = ref<UserRankInfo | null>(null)
const currentUserId = ref<number | null>(null)

// 初始化
onMounted(() => {
  const userId = tokenStore.getUserId()
  if (userId) {
    currentUserId.value = Number(userId)
  }
})

// 监听 visible 变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    loadData()
  }
})

// 加载数据
async function loadData() {
  loading.value = true

  try {
    // 获取排行榜
    const list = await userService.getGameLeaderboard(props.gameId, currentTab.value, 50)
    leaderboard.value = list
    
    // 获取我的排名
    const rank = tokenStore.getAccess()
      ? await userService.getMyGameRank(props.gameId)
      : null
    myRank.value = rank
  } catch (e) {
    console.error('加载排行榜失败:', e)
  } finally {
    loading.value = false
  }
}

// 切换标签
function switchTab(type: 'ALL' | 'DAILY' | 'MONTHLY' | 'YEARLY') {
  currentTab.value = type
  loadData()
}

// 关闭面板
function close() {
  emit('close')
}

// 格式化分数
function formatScore(score: number): string {
  if (score >= 10000) {
    return (score / 10000).toFixed(1) + 'w'
  }
  if (score >= 1000) {
    return (score / 1000).toFixed(1) + 'k'
  }
  return String(score)
}

// 获取排名样式类
function getRankClass(rank: number | null): string {
  if (rank === null || rank === 0) return ''
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver'
  if (rank === 3) return 'bronze'
  return ''
}

// 获取排名表情
function getRankEmoji(rank: number): string {
  switch (rank) {
    case 1: return '🥇'
    case 2: return '🥈'
    case 3: return '🥉'
    default: return String(rank)
  }
}
</script>

<style scoped>
.leaderboard-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
}

.panel-content {
  position: relative;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(180deg, rgba(255, 215, 0, 0.2) 0%, transparent 100%);
}

.panel-header h2 {
  margin: 0;
  font-size: 24px;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 18px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.tab-bar {
  display: flex;
  padding: 0 15px;
  gap: 8px;
  background: rgba(0, 0, 0, 0.2);
}

.tab-btn {
  flex: 1;
  padding: 12px 8px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.tab-btn.active {
  color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background: #ffd700;
  border-radius: 3px;
}

.my-rank {
  margin: 15px;
  padding: 15px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.05) 100%);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.my-rank-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.my-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.my-rank-num {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
}

.my-rank-num.gold { color: #ffd700; }
.my-rank-num.silver { color: #c0c0c0; }
.my-rank-num.bronze { color: #cd7f32; }

.my-score {
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
  margin-left: auto;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.7);
  gap: 15px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #ffd700;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.rank-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 15px 15px;
}

.rank-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: all 0.2s;
}

.rank-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.rank-item.is-me {
  background: rgba(255, 215, 0, 0.15);
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.rank-badge {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
}

.rank-badge.gold {
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  color: #fff;
  font-size: 20px;
}

.rank-badge.silver {
  background: linear-gradient(135deg, #e0e0e0 0%, #a0a0a0 100%);
  color: #fff;
}

.rank-badge.bronze {
  background: linear-gradient(135deg, #cd7f32 0%, #8b4513 100%);
  color: #fff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  margin-left: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  color: #fff;
  font-size: 15px;
  font-weight: 500;
}

.user-id {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.score {
  color: #ffd700;
  font-size: 18px;
  font-weight: bold;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 15px;
}

.empty-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 18px;
  margin-bottom: 8px;
}

.empty-hint {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}
</style>
