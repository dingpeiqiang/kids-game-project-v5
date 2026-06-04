<template>
  <div class="admin-dashboard">
    <!-- 顶部数据卡片 -->
    <div class="stats-cards">
      <div class="stat-card stat-users">
        <div class="stat-icon-wrapper">
          <span class="stat-icon">👥</span>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ overview.totalUsers || 0 }}</div>
          <div class="stat-label">总用户数</div>
          <div class="stat-trend positive">
            <span class="trend-icon">↑</span>
            <span>+{{ overview.todayNewUsers || 0 }} 今日新增</span>
          </div>
        </div>
        <div class="stat-chart">
          <div class="mini-chart">
            <div v-for="(h, i) in [30, 45, 35, 50, 40, 55, 45]" :key="i" class="chart-bar" :style="{ height: h + '%' }"></div>
          </div>
        </div>
      </div>

      <div class="stat-card stat-active">
        <div class="stat-icon-wrapper">
          <span class="stat-icon">🔥</span>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ overview.activeUsers || 0 }}</div>
          <div class="stat-label">活跃用户</div>
          <div class="stat-trend">
            <span class="online-dot"></span>
            <span>在线：{{ overview.onlineUsers || 0 }}</span>
          </div>
        </div>
        <div class="stat-chart">
          <div class="mini-chart">
            <div v-for="(h, i) in [25, 35, 40, 30, 45, 50, 40]" :key="i" class="chart-bar" :style="{ height: h + '%' }"></div>
          </div>
        </div>
      </div>

      <div class="stat-card stat-games">
        <div class="stat-icon-wrapper">
          <span class="stat-icon">🎮</span>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ overview.totalGames || 0 }}</div>
          <div class="stat-label">游戏总数</div>
          <div class="stat-trend positive">
            <span class="trend-icon">✓</span>
            <span>已上架：{{ overview.publishedGames || 0 }}</span>
          </div>
        </div>
        <div class="stat-chart">
          <div class="mini-chart">
            <div v-for="(h, i) in [20, 30, 40, 35, 50, 45, 55]" :key="i" class="chart-bar" :style="{ height: h + '%' }"></div>
          </div>
        </div>
      </div>

      <div class="stat-card stat-answers">
        <div class="stat-icon-wrapper">
          <span class="stat-icon">📝</span>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ overview.totalAnswers || 0 }}</div>
          <div class="stat-label">答题总数</div>
          <div class="stat-trend">
            <span class="accuracy-rate">{{ (overview.answerCorrectRate || 0).toFixed(1) }}%</span>
            <span>正确率</span>
          </div>
        </div>
        <div class="stat-chart">
          <div class="mini-chart">
            <div v-for="(h, i) in [40, 35, 45, 50, 40, 55, 60]" :key="i" class="chart-bar" :style="{ height: h + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <!-- 用户趋势图 -->
      <div class="chart-card chart-primary">
        <div class="chart-header">
          <h3 class="chart-title">
            <span class="title-icon">📈</span>
            <span>用户增长趋势</span>
          </h3>
          <div class="chart-legend">
            <span class="legend-item">
              <span class="legend-dot"></span>
              <span>新增用户</span>
            </span>
          </div>
        </div>
        <div ref="userTrendChart" class="chart-container"></div>
      </div>

      <!-- 游戏类型分布 -->
      <div class="chart-card chart-secondary">
        <div class="chart-header">
          <h3 class="chart-title">
            <span class="title-icon">🎯</span>
            <span>游戏类型分布</span>
          </h3>
        </div>
        <div ref="gameCategoryChart" class="chart-container"></div>
      </div>
    </div>

    <!-- 数据对比区域 -->
    <div class="comparison-section">
      <div class="comparison-card">
        <h3 class="comparison-title">
          <span class="title-icon">📊</span>
          <span>本周数据对比</span>
        </h3>
        <div class="comparison-grid">
          <div class="comparison-item">
            <div class="comparison-icon-wrapper">
              <span class="comparison-icon">👤</span>
            </div>
            <div class="comparison-content">
              <div class="comparison-label">用户增长</div>
              <div class="comparison-value">+24.5%</div>
              <div class="comparison-sub">较上周</div>
            </div>
            <div class="comparison-trend up">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </div>
          </div>
          <div class="comparison-item">
            <div class="comparison-icon-wrapper">
              <span class="comparison-icon">⏱️</span>
            </div>
            <div class="comparison-content">
              <div class="comparison-label">游戏时长</div>
              <div class="comparison-value">+18.3%</div>
              <div class="comparison-sub">较上周</div>
            </div>
            <div class="comparison-trend up">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </div>
          </div>
          <div class="comparison-item">
            <div class="comparison-icon-wrapper">
              <span class="comparison-icon">✅</span>
            </div>
            <div class="comparison-content">
              <div class="comparison-label">正确率</div>
              <div class="comparison-value">85.2%</div>
              <div class="comparison-sub">平均正确率</div>
            </div>
            <div class="comparison-trend stable">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
          </div>
          <div class="comparison-item">
            <div class="comparison-icon-wrapper">
              <span class="comparison-icon">🏆</span>
            </div>
            <div class="comparison-content">
              <div class="comparison-label">成就解锁</div>
              <div class="comparison-value">+156</div>
              <div class="comparison-sub">本周新增</div>
            </div>
            <div class="comparison-trend up">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最新动态 -->
    <div class="latest-section">
      <div class="latest-card">
        <h3 class="latest-title">
          <span class="title-icon">🆕</span>
          <span>最新注册用户</span>
        </h3>
        <div v-if="loading" class="loading">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>
        <ul v-else class="latest-list">
          <li v-for="(user, index) in latestUsers" :key="user.userId" class="latest-item">
            <div class="user-avatar">
              <img v-if="user.avatar" :src="user.avatar" :alt="user.nickname || user.username" @error="handleAvatarError" />
              <span v-else>👤</span>
            </div>
            <div class="user-info">
              <span class="user-name">{{ user.nickname || user.username }}</span>
              <span class="user-time">{{ formatTime(user.createTime) }}</span>
            </div>
            <span class="user-type" :class="'type-' + user.userType">
              {{ getUserTypeText(user.userType) }}
            </span>
          </li>
        </ul>
      </div>

      <div class="latest-card">
        <h3 class="latest-title">
          <span class="title-icon">⏰</span>
          <span>最新答题记录</span>
        </h3>
        <div v-if="loading" class="loading">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>
        <ul v-else class="latest-list">
          <li v-for="(record, index) in latestAnswerRecords" :key="index" class="latest-item">
            <span class="record-icon" :class="record.isCorrect ? 'correct' : 'incorrect'">
              {{ record.isCorrect ? '✓' : '✗' }}
            </span>
            <div class="record-info">
              <span class="record-text">用户 ID: {{ record.userId }}</span>
              <span class="record-time">{{ formatTime(record.createTime) }}</span>
            </div>
            <span :class="['result-badge', record.isCorrect ? 'correct' : 'incorrect']">
              {{ record.isCorrect ? '正确' : '错误' }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { adminApi, type DashboardOverview } from '@/services/admin-api.service';

// 状态
const overview = ref<DashboardOverview>({} as DashboardOverview);
const latestUsers = ref<any[]>([]);
const latestAnswerRecords = ref<any[]>([]);
const loading = ref(true);

// 图表实例
const userTrendChart = ref<HTMLElement | null>(null);
const gameCategoryChart = ref<HTMLElement | null>(null);
let userTrendChartInstance: echarts.ECharts | null = null;
let gameCategoryChartInstance: echarts.ECharts | null = null;

// 获取仪表盘数据
async function loadDashboardOverview() {
  try {
    overview.value = await adminApi.getDashboardOverview();
  } catch (error) {
    console.error('加载仪表盘数据失败:', error);
  }
}

// 获取最新用户
async function loadLatestUsers() {
  try {
    latestUsers.value = await adminApi.getLatestUsers(5);
  } catch (error) {
    console.error('加载最新用户失败:', error);
  }
}

// 获取最新答题记录
async function loadLatestAnswerRecords() {
  try {
    latestAnswerRecords.value = await adminApi.getLatestAnswerRecords(5);
  } catch (error) {
    console.error('加载最新答题记录失败:', error);
  } finally {
    loading.value = false;
  }
}

// 初始化图表
function initCharts() {
  if (userTrendChart.value) {
    userTrendChartInstance = echarts.init(userTrendChart.value);
    const option: EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#FF6B9D',
        borderWidth: 1,
        textStyle: {
          color: '#333'
        }
      },
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        axisLabel: {
          color: '#666'
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false
        },
        axisLabel: {
          color: '#666'
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0'
          }
        }
      },
      series: [
        {
          name: '新增用户',
          type: 'line',
          smooth: true,
          data: overview.value.todayNewUsers ? [120, 132, 101, 134, 90, 230, 210] : [0, 0, 0, 0, 0, 0, 0],
          itemStyle: {
            color: '#FF6B9D'
          },
          lineStyle: {
            width: 3,
            color: '#FF6B9D'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(255, 107, 157, 0.3)' },
                { offset: 1, color: 'rgba(255, 107, 157, 0)' }
              ]
            }
          }
        }
      ]
    };
    userTrendChartInstance.setOption(option);
  }

  if (gameCategoryChart.value) {
    gameCategoryChartInstance = echarts.init(gameCategoryChart.value);
    const option: EChartsOption = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#FF6B9D',
        borderWidth: 1,
        textStyle: {
          color: '#333'
        }
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        textStyle: {
          color: '#666'
        }
      },
      series: [
        {
          name: '游戏类型',
          type: 'pie',
          radius: ['40%', '70%'],
          data: [
            { value: 40, name: '数学', itemStyle: { color: '#FF6B9D' } },
            { value: 30, name: '语文', itemStyle: { color: '#4ECDC4' } },
            { value: 20, name: '英语', itemStyle: { color: '#FFE66D' } },
            { value: 10, name: '科学', itemStyle: { color: '#45B7D1' } }
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(255, 107, 157, 0.3)'
            }
          },
          label: {
            color: '#666'
          }
        }
      ]
    };
    gameCategoryChartInstance.setOption(option);
  }
}

// 获取用户类型文本
function getUserTypeText(type: number): string {
  const types: { [key: number]: string } = {
    0: '儿童',
    1: '家长',
    2: '管理员'
  };
  return types[type] || '未知';
}

// 格式化时间
function formatTime(time?: string): string {
  if (!time) return '刚刚';
  const now = Date.now();
  const timestamp = new Date(time).getTime();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return `${days}天前`;
}

// 头像加载错误处理
function handleAvatarError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  const parent = img.parentElement;
  if (parent) {
    const fallback = document.createElement('span');
    fallback.textContent = '👤';
    parent.appendChild(fallback);
  }
}

// 页面挂载时加载数据
onMounted(async () => {
  await loadDashboardOverview();
  await loadLatestUsers();
  await loadLatestAnswerRecords();
  
  // 延迟初始化图表，确保数据已加载
  setTimeout(() => {
    initCharts();
  }, 100);
});

// 窗口大小变化时重新渲染图表
window.addEventListener('resize', () => {
  userTrendChartInstance?.resize();
  gameCategoryChartInstance?.resize();
});
</script>

<style scoped>
.admin-dashboard {
  background: transparent;
  min-height: auto;
  position: relative;
  z-index: 1;
}

/* ========== 统计卡片 ========== */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
}

.stat-card.stat-users::before { background: linear-gradient(180deg, #FF9DCB, #FF6B9D); }
.stat-card.stat-active::before { background: linear-gradient(180deg, #7DD8D0, #4ECDC4); }
.stat-card.stat-games::before { background: linear-gradient(180deg, #FFE66D, #FFD93D); }
.stat-card.stat-answers::before { background: linear-gradient(180deg, #7DD8D0, #45B7D1); }

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.stat-icon-wrapper {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.stat-users .stat-icon-wrapper { background: linear-gradient(135deg, #FF9DCB, #FF6B9D); }
.stat-active .stat-icon-wrapper { background: linear-gradient(135deg, #7DD8D0, #4ECDC4); }
.stat-games .stat-icon-wrapper { background: linear-gradient(135deg, #FFE66D, #FFD93D); }
.stat-answers .stat-icon-wrapper { background: linear-gradient(135deg, #7DD8D0, #45B7D1); }

.stat-icon {
  font-size: 1.8rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: #333;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #999;
  font-weight: 500;
}

.stat-trend.positive {
  color: #4ECDC4;
}

.trend-icon {
  font-weight: bold;
}

.online-dot {
  width: 8px;
  height: 8px;
  background: #4ECDC4;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.accuracy-rate {
  font-weight: bold;
  color: #FF6B9D;
  font-size: 0.9rem;
}

.stat-chart {
  height: 40px;
}

.mini-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 100%;
}

.chart-bar {
  flex: 1;
  border-radius: 3px 3px 0 0;
  min-width: 4px;
  transition: all 0.3s;
}

.stat-users .chart-bar { background: linear-gradient(180deg, #FF9DCB, #FF6B9D); opacity: 0.3; }
.stat-active .chart-bar { background: linear-gradient(180deg, #7DD8D0, #4ECDC4); opacity: 0.3; }
.stat-games .chart-bar { background: linear-gradient(180deg, #FFE66D, #FFD93D); opacity: 0.3; }
.stat-answers .chart-bar { background: linear-gradient(180deg, #7DD8D0, #45B7D1); opacity: 0.3; }

/* ========== 图表区域 ========== */
.charts-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.chart-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.chart-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-icon {
  font-size: 1.4rem;
}

.chart-legend {
  display: flex;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #666;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #FF6B9D;
}

.chart-container {
  height: 300px;
  width: 100%;
}

/* ========== 数据对比区域 ========== */
.comparison-section {
  margin-bottom: 2rem;
}

.comparison-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.comparison-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.comparison-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 107, 157, 0.03);
  border-radius: 16px;
  border: 1px solid rgba(255, 107, 157, 0.1);
  transition: all 0.3s;
}

.comparison-item:hover {
  background: rgba(255, 107, 157, 0.06);
  transform: translateY(-3px);
}

.comparison-icon-wrapper {
  width: 45px;
  height: 45px;
  border-radius: 12px;
  background: linear-gradient(135deg, #FF9DCB, #FF6B9D);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.comparison-icon {
  font-size: 1.5rem;
}

.comparison-content {
  flex: 1;
}

.comparison-label {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.comparison-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: #333;
  margin-bottom: 0.25rem;
}

.comparison-sub {
  font-size: 0.75rem;
  color: #999;
}

.comparison-trend {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.comparison-trend.up {
  background: rgba(78, 205, 196, 0.15);
  color: #4ECDC4;
}

.comparison-trend.stable {
  background: rgba(255, 230, 109, 0.15);
  color: #FFD93D;
}

.comparison-trend.down {
  background: rgba(255, 107, 157, 0.15);
  color: #FF6B9D;
}

/* ========== 最新动态 ========== */
.latest-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.latest-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.latest-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #999;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 107, 157, 0.2);
  border-top-color: #FF6B9D;
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.latest-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.latest-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 0;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s;
}

.latest-item:hover {
  background: rgba(255, 107, 157, 0.03);
  border-radius: 8px;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.latest-item:last-child {
  border-bottom: none;
}

.user-avatar,
.record-icon {
  font-size: 1.5rem;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FF9DCB, #FF6B9D);
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.record-icon.correct {
  background: linear-gradient(135deg, #7DD8D0, #4ECDC4);
}

.record-icon.incorrect {
  background: linear-gradient(135deg, #FF9DCB, #FF6B9D);
}

.user-info,
.record-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-name,
.record-text {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.user-time,
.record-time {
  font-size: 0.75rem;
  color: #999;
}

.user-type {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.user-type.type-0 {
  background: rgba(78, 205, 196, 0.15);
  color: #4ECDC4;
}

.user-type.type-1 {
  background: rgba(255, 107, 157, 0.15);
  color: #FF6B9D;
}

.user-type.type-2 {
  background: rgba(255, 230, 109, 0.15);
  color: #FFD93D;
}

.result-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.result-badge.correct {
  background: rgba(78, 205, 196, 0.15);
  color: #4ECDC4;
}

.result-badge.incorrect {
  background: rgba(255, 107, 157, 0.15);
  color: #FF6B9D;
}

/* ========== 响应式设计 ========== */
@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .comparison-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .stat-card {
    padding: 1.25rem;
  }

  .charts-section {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .chart-card {
    padding: 1rem;
  }

  .comparison-grid {
    grid-template-columns: 1fr;
  }

  .latest-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .admin-dashboard {
    padding: 0.5rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .chart-container {
    height: 250px;
  }
}
</style>
