<template>
  <div class="learning-report">
    <!-- 页面头部：标题 + 孩子选择 -->
    <div class="report-header">
      <div class="header-left">
        <h2 class="report-title">
          <span class="title-icon">📊</span>
          <span>孩子学情报表</span>
        </h2>
        <p class="report-subtitle">全面了解孩子的学习情况与薄弱环节</p>
      </div>
      <div class="header-right">
        <el-select
          v-if="children.length > 0"
          v-model="selectedKidId"
          placeholder="选择孩子"
          class="kid-select"
          @change="handleKidChange"
        >
          <el-option
            v-for="kid in children"
            :key="kid.kidId"
            :label="kid.nickname || kid.username"
            :value="kid.kidId"
          >
            <span class="kid-option">
              <span class="kid-option-avatar">{{ kid.avatar || '👶' }}</span>
              <span>{{ kid.nickname || kid.username }}</span>
            </span>
          </el-option>
        </el-select>
      </div>
    </div>

    <!-- 无孩子提示 -->
    <el-card v-if="!loadingChildren && children.length === 0" class="empty-card" shadow="never">
      <div class="empty-state">
        <span class="empty-icon">👪</span>
        <p>暂未绑定孩子，请先在家长主页绑定孩子。</p>
      </div>
    </el-card>

    <template v-else-if="selectedKid">
      <!-- 学情总览 -->
      <el-card class="section-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title"><span class="card-icon">📈</span>学情总览</span>
            <span class="card-meta" v-if="selectedKid">
              {{ selectedKid.nickname || selectedKid.username }} 的累计学习数据
            </span>
          </div>
        </template>
        <div v-loading="loadingOverview" class="overview-grid">
          <div class="overview-item item-blue">
            <div class="overview-icon">📝</div>
            <div class="overview-info">
              <span class="overview-value">{{ overview?.totalAnswered ?? 0 }}</span>
              <span class="overview-label">累计答题数</span>
            </div>
          </div>
          <div class="overview-item item-green">
            <div class="overview-icon">✅</div>
            <div class="overview-info">
              <span class="overview-value">{{ overview?.accuracy ?? 0 }}%</span>
              <span class="overview-label">正确率</span>
            </div>
          </div>
          <div class="overview-item item-orange">
            <div class="overview-icon">🪙</div>
            <div class="overview-info">
              <span class="overview-value">{{ overview?.totalPoints ?? 0 }}</span>
              <span class="overview-label">获得游学币</span>
            </div>
          </div>
          <div class="overview-item item-purple">
            <div class="overview-icon">⏱️</div>
            <div class="overview-info">
              <span class="overview-value">{{ formatDuration(overview?.totalDuration ?? 0) }}</span>
              <span class="overview-label">练习时长</span>
            </div>
          </div>
          <div class="overview-item item-red">
            <div class="overview-icon">❌</div>
            <div class="overview-info">
              <span class="overview-value">{{ overview?.wrongCount ?? 0 }}</span>
              <span class="overview-label">错题数</span>
            </div>
          </div>
          <div class="overview-item item-cyan">
            <div class="overview-icon">⭐</div>
            <div class="overview-info">
              <span class="overview-value">{{ overview?.collectedCount ?? 0 }}</span>
              <span class="overview-label">收藏数</span>
            </div>
          </div>
          <div class="overview-item item-pink">
            <div class="overview-icon">🔥</div>
            <div class="overview-info">
              <span class="overview-value">{{ overview?.streakDays ?? 0 }}</span>
              <span class="overview-label">连续答题天数</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 答题趋势 -->
      <el-card class="section-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title"><span class="card-icon">📉</span>答题趋势</span>
            <div class="trend-tabs">
              <button
                class="trend-tab"
                :class="{ active: trendDays === 7 }"
                @click="changeTrendDays(7)"
              >近 7 天</button>
              <button
                class="trend-tab"
                :class="{ active: trendDays === 30 }"
                @click="changeTrendDays(30)"
              >近 30 天</button>
            </div>
          </div>
        </template>
        <div v-loading="loadingTrend" class="trend-body">
          <div v-if="trendPoints.length === 0 && !loadingTrend" class="empty-state small">
            <span class="empty-icon">📭</span>
            <p>暂无答题趋势数据</p>
          </div>
          <template v-else>
            <div class="trend-legend">
              <span class="legend-item"><span class="legend-dot dot-high"></span>正确率≥80%</span>
              <span class="legend-item"><span class="legend-dot dot-mid"></span>60%≤正确率&lt;80%</span>
              <span class="legend-item"><span class="legend-dot dot-low"></span>正确率&lt;60%</span>
              <span class="legend-tip">柱高表示当日答题数，颜色表示正确率</span>
            </div>
            <div class="trend-chart">
              <div
                v-for="point in trendPoints"
                :key="point.date"
                class="trend-bar-wrapper"
                :title="`${formatDate(point.date)}：答题 ${point.answered} 题，正确率 ${point.accuracy}%`"
              >
                <span class="trend-bar-value">{{ point.accuracy }}%</span>
                <div class="trend-bar-track">
                  <div
                    class="trend-bar"
                    :class="getAccuracyClass(point.accuracy)"
                    :style="{ height: barHeight(point.answered) }"
                  ></div>
                </div>
                <span class="trend-bar-date">{{ formatDate(point.date) }}</span>
              </div>
            </div>
          </template>
        </div>
      </el-card>

      <!-- 薄弱知识点 -->
      <el-card class="section-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title"><span class="card-icon">🎯</span>薄弱知识点</span>
            <span class="card-meta">正确率低于 60%，按正确率升序</span>
          </div>
        </template>
        <div v-loading="loadingWeak">
          <div v-if="weakPointsFiltered.length === 0 && !loadingWeak" class="empty-state small">
            <span class="empty-icon">🎉</span>
            <p>暂无薄弱知识点，继续保持！</p>
          </div>
          <div v-else class="weak-list">
            <div v-for="item in weakPointsFiltered" :key="item.knowledgePointId" class="weak-item">
              <div class="weak-name">{{ item.name }}</div>
              <div class="weak-stats">
                <span class="weak-stat">答题 <b>{{ item.total }}</b></span>
                <span class="weak-stat">正确 <b>{{ item.correct }}</b></span>
                <span class="weak-stat">错误 <b class="text-red">{{ item.wrongCount }}</b></span>
              </div>
              <div class="weak-accuracy">
                <el-tag :type="getAccuracyTagType(item.accuracy)" effect="light" round>
                  正确率 {{ item.accuracy }}%
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 错题本概览 -->
      <el-card class="section-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title"><span class="card-icon">📒</span>错题本概览</span>
          </div>
        </template>
        <div v-loading="loadingWrong">
          <div v-if="!wrongBook && !loadingWrong" class="empty-state small">
            <span class="empty-icon">📭</span>
            <p>暂无错题本数据</p>
          </div>
          <template v-else>
            <div class="wrongbook-stats">
              <div class="wb-stat wb-total">
                <span class="wb-value">{{ wrongBook?.total ?? 0 }}</span>
                <span class="wb-label">错题总数</span>
              </div>
              <div class="wb-stat wb-pending">
                <span class="wb-value">{{ wrongBook?.pending ?? 0 }}</span>
                <span class="wb-label">待复习</span>
              </div>
              <div class="wb-stat wb-reviewing">
                <span class="wb-value">{{ wrongBook?.reviewing ?? 0 }}</span>
                <span class="wb-label">复习中</span>
              </div>
              <div class="wb-stat wb-mastered">
                <span class="wb-value">{{ wrongBook?.mastered ?? 0 }}</span>
                <span class="wb-label">已掌握</span>
              </div>
            </div>
            <div v-if="wrongBookSubjects.length > 0" class="wrongbook-subjects">
              <h4 class="sub-title">学科分布</h4>
              <div class="subject-bars">
                <div
                  v-for="subject in wrongBookSubjects"
                  :key="subject.subjectId"
                  class="subject-bar-item"
                >
                  <div class="subject-bar-head">
                    <span class="subject-name">{{ subject.subjectName }}</span>
                    <span class="subject-count">{{ subject.count }} 题</span>
                  </div>
                  <div class="subject-bar-track">
                    <div
                      class="subject-bar-fill"
                      :style="{ width: subjectBarWidth(subject.count) }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </el-card>

      <!-- 最近答题记录 -->
      <el-card class="section-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title"><span class="card-icon">🕒</span>最近答题记录</span>
            <span class="card-meta">最近 10 条</span>
          </div>
        </template>
        <div v-loading="loadingRecent">
          <div v-if="recentRecords.length === 0 && !loadingRecent" class="empty-state small">
            <span class="empty-icon">📭</span>
            <p>暂无答题记录</p>
          </div>
          <div v-else class="recent-list">
            <div v-for="record in recentRecords" :key="record.recordId" class="recent-item">
              <div class="recent-status" :class="record.isCorrect ? 'correct' : 'wrong'">
                {{ record.isCorrect ? '✓' : '✗' }}
              </div>
              <div class="recent-content">
                <div class="recent-question">{{ truncate(record.content, 40) }}</div>
                <div class="recent-meta">
                  <el-tag v-if="record.subjectName" size="small" type="info" effect="plain">
                    {{ record.subjectName }}
                  </el-tag>
                  <span class="recent-time">用时 {{ formatAnswerTime(record.answerTime) }}</span>
                  <span class="recent-date">{{ formatDateTime(record.createTime) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/core/store/user.store';
import { parentApi } from '@/services/parent-api.service';
import { parentReportApi } from '@/services/parent-report-api.service';
import type { KidWeakPointItem, KidWrongBookOverview } from '@/services/parent-report-api.service';
import type { LearningOverview, TrendData, TrendPoint, RecentRecordItem } from '@/services/learning-report-api.service';
import type { Kid } from '@/services/api.types';
import { handleApiError } from '@/utils/error-handler.util';

const userStore = useUserStore();

// ===== 孩子选择 =====
const children = ref<Kid[]>([]);
const loadingChildren = ref(false);
const selectedKidId = ref<number | null>(null);
const selectedKid = computed(() => children.value.find(c => c.kidId === selectedKidId.value) || null);

// ===== 各模块加载状态 =====
const loadingOverview = ref(false);
const loadingTrend = ref(false);
const loadingWeak = ref(false);
const loadingWrong = ref(false);
const loadingRecent = ref(false);

// ===== 数据 =====
const overview = ref<LearningOverview | null>(null);
const trendData = ref<TrendData | null>(null);
const weakPoints = ref<KidWeakPointItem[]>([]);
const wrongBook = ref<KidWrongBookOverview | null>(null);
const recentRecords = ref<RecentRecordItem[]>([]);

// ===== 趋势天数 =====
const trendDays = ref<7 | 30>(7);

// ===== 计算属性 =====
const trendPoints = computed<TrendPoint[]>(() => trendData.value?.points ?? []);

const weakPointsFiltered = computed(() =>
  weakPoints.value
    .filter(item => item.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy),
);

const trendMaxAnswered = computed(() => {
  const max = Math.max(...trendPoints.value.map(p => p.answered), 0);
  return max > 0 ? max : 1;
});

const wrongBookSubjects = computed(() => wrongBook.value?.bySubject ?? []);

const wrongBookSubjectMax = computed(() => {
  const max = Math.max(...wrongBookSubjects.value.map(s => s.count), 0);
  return max > 0 ? max : 1;
});

// ===== 工具方法 =====
/** 时长格式化（秒 → 中文） */
function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0分钟';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}分钟`;
  const hours = Math.floor(mins / 60);
  const remain = mins % 60;
  return remain > 0 ? `${hours}小时${remain}分钟` : `${hours}小时`;
}

/** 单题用时格式化（秒） */
function formatAnswerTime(seconds: number): string {
  if (!seconds || seconds < 0) return '0秒';
  if (seconds < 60) return `${seconds}秒`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}分${secs}秒` : `${mins}分钟`;
}

/** 日期格式化（YYYY-MM-DD → MM-DD） */
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length >= 3) return `${parts[1]}-${parts[2]}`;
  return dateStr.slice(5);
}

/** 时间戳格式化（毫秒 → YYYY-MM-DD HH:mm） */
function formatDateTime(timestamp: number): string {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 文本截断 */
function truncate(text: string, max: number): string {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

/** 正确率对应柱状颜色 class */
function getAccuracyClass(accuracy: number): string {
  if (accuracy >= 80) return 'bar-high';
  if (accuracy >= 60) return 'bar-mid';
  return 'bar-low';
}

/** 正确率对应 el-tag 类型 */
function getAccuracyTagType(accuracy: number): 'success' | 'warning' | 'danger' {
  if (accuracy >= 80) return 'success';
  if (accuracy >= 60) return 'warning';
  return 'danger';
}

/** 趋势柱高（相对最大答题数） */
function barHeight(answered: number): string {
  const ratio = answered / trendMaxAnswered.value;
  return `${Math.max(ratio * 100, 4)}%`;
}

/** 学科分布条宽 */
function subjectBarWidth(count: number): string {
  return `${Math.max((count / wrongBookSubjectMax.value) * 100, 2)}%`;
}

// ===== 数据加载 =====
async function loadChildren() {
  const parentId = userStore.parentUser?.parentId;
  if (!parentId) {
    ElMessage.warning('未获取到家长信息，请重新登录');
    return;
  }
  loadingChildren.value = true;
  try {
    const kids = await parentApi.getChildren(parentId);
    children.value = kids ?? [];
    if (children.value.length > 0) {
      selectedKidId.value = children.value[0].kidId;
    }
  } catch (err) {
    const error = handleApiError(err);
    ElMessage.error(error.message || '加载孩子列表失败');
  } finally {
    loadingChildren.value = false;
  }
}

async function loadOverview() {
  if (!selectedKidId.value) return;
  loadingOverview.value = true;
  try {
    overview.value = await parentReportApi.kidOverview(selectedKidId.value);
  } catch (err) {
    const error = handleApiError(err);
    ElMessage.error(error.message || '加载学情总览失败');
  } finally {
    loadingOverview.value = false;
  }
}

async function loadTrend() {
  if (!selectedKidId.value) return;
  loadingTrend.value = true;
  try {
    trendData.value = await parentReportApi.kidTrend(selectedKidId.value, trendDays.value);
  } catch (err) {
    const error = handleApiError(err);
    ElMessage.error(error.message || '加载答题趋势失败');
  } finally {
    loadingTrend.value = false;
  }
}

async function loadWeakPoints() {
  if (!selectedKidId.value) return;
  loadingWeak.value = true;
  try {
    const data = await parentReportApi.kidWeakPoints(selectedKidId.value);
    weakPoints.value = data?.items ?? [];
  } catch (err) {
    const error = handleApiError(err);
    ElMessage.error(error.message || '加载薄弱知识点失败');
  } finally {
    loadingWeak.value = false;
  }
}

async function loadWrongBook() {
  if (!selectedKidId.value) return;
  loadingWrong.value = true;
  try {
    wrongBook.value = await parentReportApi.kidWrongBook(selectedKidId.value);
  } catch (err) {
    const error = handleApiError(err);
    ElMessage.error(error.message || '加载错题本概览失败');
  } finally {
    loadingWrong.value = false;
  }
}

async function loadRecent() {
  if (!selectedKidId.value) return;
  loadingRecent.value = true;
  try {
    recentRecords.value = await parentReportApi.kidRecent(selectedKidId.value, 10);
  } catch (err) {
    const error = handleApiError(err);
    ElMessage.error(error.message || '加载最近答题记录失败');
  } finally {
    loadingRecent.value = false;
  }
}

/** 加载某孩子全部报表数据 */
async function loadAllData() {
  if (!selectedKidId.value) return;
  await Promise.all([
    loadOverview(),
    loadTrend(),
    loadWeakPoints(),
    loadWrongBook(),
    loadRecent(),
  ]);
}

function handleKidChange() {
  loadAllData();
}

function changeTrendDays(days: 7 | 30) {
  if (trendDays.value === days) return;
  trendDays.value = days;
  loadTrend();
}

// ===== 生命周期 =====
onMounted(async () => {
  await loadChildren();
});
</script>

<style scoped>
.learning-report {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ========== 头部 ========== */
.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  background: linear-gradient(135deg, #ffffff 0%, #f6f9ff 100%);
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.08);
}

.report-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: #2c3e50;
}

.title-icon {
  font-size: 1.6rem;
}

.report-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.85rem;
  color: #8492a6;
}

.kid-select {
  width: 220px;
}

.kid-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.kid-option-avatar {
  font-size: 1.2rem;
}

/* ========== 卡片通用 ========== */
.section-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.section-card :deep(.el-card__header) {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f0f2f5;
}

.section-card :deep(.el-card__body) {
  padding: 1.5rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: #2c3e50;
}

.card-icon {
  font-size: 1.2rem;
}

.card-meta {
  font-size: 0.8rem;
  color: #909399;
}

/* ========== 学情总览 ========== */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.overview-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 12px;
  background: #f7f9fc;
  transition: transform 0.2s;
}

.overview-item:hover {
  transform: translateY(-3px);
}

.overview-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 1.4rem;
  flex-shrink: 0;
}

.overview-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.overview-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1.2;
}

.overview-label {
  font-size: 0.78rem;
  color: #909399;
}

.item-blue .overview-icon { background: #e6f0ff; }
.item-green .overview-icon { background: #e8f8ee; }
.item-orange .overview-icon { background: #fff3e0; }
.item-purple .overview-icon { background: #f3e8ff; }
.item-red .overview-icon { background: #fde8e8; }
.item-cyan .overview-icon { background: #e0f7fa; }
.item-pink .overview-icon { background: #fce4ec; }

/* ========== 答题趋势 ========== */
.trend-tabs {
  display: flex;
  gap: 0.4rem;
}

.trend-tab {
  padding: 0.3rem 0.9rem;
  border: 1px solid #dcdfe6;
  background: #fff;
  border-radius: 16px;
  font-size: 0.8rem;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s;
}

.trend-tab:hover {
  border-color: #667eea;
  color: #667eea;
}

.trend-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: #fff;
}

.trend-body {
  min-height: 220px;
}

.trend-legend {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  font-size: 0.78rem;
  color: #909399;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.legend-dot.dot-high { background: #67c23a; }
.legend-dot.dot-mid { background: #e6a23c; }
.legend-dot.dot-low { background: #f56c6c; }

.legend-tip {
  margin-left: auto;
  color: #c0c4cc;
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  gap: 0.4rem;
  height: 180px;
  padding: 0.5rem 0;
  overflow-x: auto;
}

.trend-bar-wrapper {
  flex: 1;
  min-width: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  gap: 0.25rem;
}

.trend-bar-value {
  font-size: 0.7rem;
  color: #606266;
  font-weight: 600;
  white-space: nowrap;
}

.trend-bar-track {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.trend-bar {
  width: 70%;
  border-radius: 6px 6px 0 0;
  transition: height 0.3s ease;
  min-height: 4px;
}

.trend-bar.bar-high { background: linear-gradient(180deg, #85ce61 0%, #67c23a 100%); }
.trend-bar.bar-mid { background: linear-gradient(180deg, #ebb563 0%, #e6a23c 100%); }
.trend-bar.bar-low { background: linear-gradient(180deg, #f78989 0%, #f56c6c 100%); }

.trend-bar-date {
  font-size: 0.68rem;
  color: #909399;
  white-space: nowrap;
}

/* ========== 薄弱知识点 ========== */
.weak-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.weak-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1rem;
  background: #fafbfc;
  border-radius: 10px;
  border-left: 3px solid #f56c6c;
  flex-wrap: wrap;
}

.weak-name {
  flex: 1;
  min-width: 140px;
  font-weight: 600;
  color: #2c3e50;
}

.weak-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.82rem;
  color: #606266;
}

.weak-stat b {
  color: #2c3e50;
}

.text-red {
  color: #f56c6c !important;
}

.weak-accuracy {
  flex-shrink: 0;
}

/* ========== 错题本概览 ========== */
.wrongbook-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.wb-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 1.1rem;
  border-radius: 12px;
  background: #f7f9fc;
}

.wb-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: #2c3e50;
}

.wb-label {
  font-size: 0.8rem;
  color: #909399;
}

.wb-total { background: #fde8e8; }
.wb-total .wb-value { color: #f56c6c; }
.wb-pending { background: #fff3e0; }
.wb-pending .wb-value { color: #e6a23c; }
.wb-reviewing { background: #e6f0ff; }
.wb-reviewing .wb-value { color: #409eff; }
.wb-mastered { background: #e8f8ee; }
.wb-mastered .wb-value { color: #67c23a; }

.sub-title {
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #2c3e50;
}

.subject-bars {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.subject-bar-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.subject-bar-head {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  color: #606266;
}

.subject-name {
  font-weight: 500;
}

.subject-count {
  color: #909399;
}

.subject-bar-track {
  height: 10px;
  background: #f0f2f5;
  border-radius: 5px;
  overflow: hidden;
}

.subject-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 5px;
  transition: width 0.3s ease;
}

/* ========== 最近答题记录 ========== */
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.recent-item {
  display: flex;
  gap: 0.85rem;
  padding: 0.75rem 1rem;
  background: #fafbfc;
  border-radius: 10px;
  transition: background 0.2s;
}

.recent-item:hover {
  background: #f4f6f9;
}

.recent-status {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.recent-status.correct {
  background: #67c23a;
}

.recent-status.wrong {
  background: #f56c6c;
}

.recent-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.recent-question {
  font-size: 0.9rem;
  color: #2c3e50;
  line-height: 1.5;
  word-break: break-all;
}

.recent-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: #909399;
  flex-wrap: wrap;
}

/* ========== 空状态 ========== */
.empty-card {
  border-radius: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1rem;
  color: #909399;
  text-align: center;
}

.empty-state.small {
  padding: 1.5rem 1rem;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.empty-state.small .empty-icon {
  font-size: 2rem;
}

/* ========== 响应式 ========== */
@media (max-width: 992px) {
  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .wrongbook-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .learning-report {
    padding: 1rem;
  }

  .report-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .kid-select {
    width: 100%;
  }

  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .weak-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .weak-stats {
    gap: 0.75rem;
  }

  .trend-chart {
    height: 150px;
  }

  .legend-tip {
    display: none;
  }
}

@media (max-width: 480px) {
  .overview-grid,
  .wrongbook-stats {
    grid-template-columns: 1fr;
  }
}
</style>
