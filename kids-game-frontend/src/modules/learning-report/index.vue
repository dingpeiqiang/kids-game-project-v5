<template>
  <div class="report-container">
    <header class="page-header">
      <button @click="goBack" class="back-btn">← 返回</button>
      <h1>📊 学习报告</h1>
      <div class="header-spacer"></div>
    </header>

    <GlobalLoading :loading="loading" message="加载学习报告..." />

    <main class="page-main">
      <!-- 总览卡片 -->
      <section class="section-card">
        <h2 class="section-title">🏆 学习总览</h2>
        <div class="overview-grid">
          <div class="overview-item">
            <span class="ov-emoji">📝</span>
            <span class="ov-num">{{ overview.totalAnswered }}</span>
            <span class="ov-label">累计答题</span>
          </div>
          <div class="overview-item">
            <span class="ov-emoji">🎯</span>
            <span class="ov-num">{{ accuracyPercent }}%</span>
            <span class="ov-label">正确率</span>
          </div>
          <div class="overview-item">
            <span class="ov-emoji">💰</span>
            <span class="ov-num">{{ overview.totalPoints }}</span>
            <span class="ov-label">游学币</span>
          </div>
          <div class="overview-item">
            <span class="ov-emoji">⏱️</span>
            <span class="ov-num">{{ formatDuration(overview.totalDuration) }}</span>
            <span class="ov-label">练习时长</span>
          </div>
          <div class="overview-item">
            <span class="ov-emoji">❌</span>
            <span class="ov-num">{{ overview.wrongCount }}</span>
            <span class="ov-label">错题数</span>
          </div>
          <div class="overview-item">
            <span class="ov-emoji">⭐</span>
            <span class="ov-num">{{ overview.collectedCount }}</span>
            <span class="ov-label">收藏数</span>
          </div>
          <div class="overview-item highlight">
            <span class="ov-emoji">🔥</span>
            <span class="ov-num">{{ overview.streakDays }}</span>
            <span class="ov-label">连续天数</span>
          </div>
        </div>
      </section>

      <!-- 答题趋势 -->
      <section class="section-card">
        <h2 class="section-title">📈 答题趋势（近7天）</h2>
        <div v-if="trendPoints.length === 0" class="empty-section">暂无趋势数据</div>
        <div v-else class="trend-chart">
          <div v-for="(point, idx) in trendPoints" :key="idx" class="trend-bar-group">
            <div class="trend-bar-wrapper">
              <div class="trend-accuracy">{{ Math.round(point.accuracy) }}%</div>
              <div class="trend-bar" :style="{ height: getBarHeight(point.answered) + 'px' }">
                <span class="bar-count">{{ point.answered }}</span>
              </div>
            </div>
            <span class="trend-date">{{ formatDate(point.date) }}</span>
          </div>
        </div>
        <div class="trend-legend">
          <span class="legend-item"><span class="legend-color bar"></span>柱高=答题数</span>
          <span class="legend-item"><span class="legend-color text">%</span>上方=正确率</span>
        </div>
      </section>

      <!-- 知识点掌握度 -->
      <section class="section-card">
        <h2 class="section-title">🧠 知识点掌握度</h2>
        <div v-if="knowledgeItems.length === 0" class="empty-section">暂无知识点数据</div>
        <div v-else class="knowledge-list">
          <div v-for="item in knowledgeItems" :key="item.knowledgePointId" class="knowledge-item">
            <div class="knowledge-header">
              <span class="knowledge-name">{{ item.name }}</span>
              <span class="knowledge-accuracy" :class="accuracyClass(item.accuracy)">{{ Math.round(item.accuracy) }}%</span>
            </div>
            <div class="knowledge-meta">
              <span>答题 {{ item.total }} 题</span>
              <span>正确 {{ item.correct }} 题</span>
              <span class="mastery-badge" :class="`mastery-${item.masteryLevel}`">{{ masteryLabel(item.masteryLevel) }}</span>
            </div>
            <div class="mastery-bar">
              <div class="mastery-fill" :style="{ width: (item.masteryLevel / 3 * 100) + '%' }"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- 学科分布 -->
      <section class="section-card">
        <h2 class="section-title">📚 学科分布</h2>
        <div v-if="subjectItems.length === 0" class="empty-section">暂无学科数据</div>
        <div v-else class="subject-list">
          <div v-for="item in subjectItems" :key="item.subjectId" class="subject-item">
            <div class="subject-header">
              <span class="subject-name">{{ item.subjectName }}</span>
              <span class="subject-accuracy" :class="accuracyClass(item.accuracy)">{{ Math.round(item.accuracy) }}%</span>
            </div>
            <div class="subject-bar-wrapper">
              <div class="subject-bar" :style="{ width: getSubjectWidth(item.total) + '%' }">
                <span class="subject-count">{{ item.total }} 题</span>
              </div>
            </div>
            <div class="subject-meta">正确 {{ item.correct }} / {{ item.total }} 题</div>
          </div>
        </div>
      </section>

      <!-- 难度分析 -->
      <section class="section-card">
        <h2 class="section-title">⚡ 难度分析</h2>
        <div v-if="difficultyItems.length === 0" class="empty-section">暂无难度数据</div>
        <div v-else class="difficulty-list">
          <div v-for="item in difficultyItems" :key="item.difficulty" class="difficulty-item">
            <div class="diff-header">
              <span class="diff-name">{{ difficultyLabel(item.difficulty) }}</span>
              <span class="diff-accuracy" :class="accuracyClass(item.accuracy)">{{ Math.round(item.accuracy) }}%</span>
            </div>
            <div class="diff-stats">
              <span>共 {{ item.total }} 题</span>
              <span>正确 {{ item.correct }} 题</span>
            </div>
            <div class="diff-bar">
              <div class="diff-fill" :style="{ width: Math.round(item.accuracy) + '%' }" :class="accuracyClass(item.accuracy)"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- 最近答题记录 -->
      <section class="section-card">
        <h2 class="section-title">🕒 最近答题记录</h2>
        <div v-if="recentRecords.length === 0" class="empty-section">暂无答题记录</div>
        <div v-else class="recent-list">
          <div v-for="record in recentRecords" :key="record.recordId" class="recent-item">
            <div class="recent-icon" :class="record.isCorrect ? 'correct' : 'wrong'">
              {{ record.isCorrect ? '✅' : '❌' }}
            </div>
            <div class="recent-content">
              <div class="recent-question">{{ truncate(record.content, 60) }}</div>
              <div class="recent-meta">
                <span class="meta-tag type-tag">{{ typeLabel(record.questionType) }}</span>
                <span v-if="record.subjectName" class="meta-tag subject-tag">{{ record.subjectName }}</span>
                <span class="meta-tag time-tag">{{ formatTime(record.createTime) }}</span>
                <span class="meta-tag duration-tag">⏱ {{ record.answerTime }}s</span>
              </div>
              <div class="recent-answers">
                <span class="answer-label">你的答案：</span>
                <span :class="record.isCorrect ? 'answer-correct' : 'answer-wrong'">{{ record.userAnswer || '未作答' }}</span>
                <span v-if="!record.isCorrect" class="answer-correct-text">（正确：{{ record.correctAnswer }}）</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { learningReportApi } from '@/services/learning-report-api.service';
import type {
  LearningOverview,
  TrendPoint,
  KnowledgeMasteryItem,
  SubjectDistributionItem,
  DifficultyAnalysisItem,
  RecentRecordItem,
} from '@/services/learning-report-api.service';
import { handleApiError } from '@/utils/error-handler.util';
import { toast } from '@/services/toast.service';
import GlobalLoading from '@/components/GlobalLoading.vue';

const router = useRouter();

// ===== 常量 =====
const TYPE_LABELS: Record<string, string> = {
  single: '单选', choice: '单选',
  multiple: '多选',
  judge: '判断', judgment: '判断',
  fill: '填空',
  short_answer: '简答',
  image: '图片',
  audio: '音频',
};

const MASTERY_LABELS: Record<number, string> = {
  0: '未掌握', 1: '了解', 2: '熟悉', 3: '掌握',
};

const DIFFICULTY_LABELS: Record<number, string> = {
  1: '⭐ 简单', 2: '⭐⭐ 较易', 3: '⭐⭐⭐ 中等', 4: '⭐⭐⭐⭐ 较难', 5: '⭐⭐⭐⭐⭐ 困难',
};

function typeLabel(type?: string): string {
  if (!type) return '题目';
  return TYPE_LABELS[type] || '题目';
}

function masteryLabel(level: number): string {
  return MASTERY_LABELS[level] || '未掌握';
}

function difficultyLabel(level: number): string {
  return DIFFICULTY_LABELS[level] || `难度 ${level}`;
}

function accuracyClass(accuracy: number): string {
  if (accuracy >= 80) return 'acc-high';
  if (accuracy >= 60) return 'acc-mid';
  return 'acc-low';
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '...' : text;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 60) return `${seconds || 0}秒`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}分${s > 0 ? s + '秒' : ''}`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}时${rm > 0 ? rm + '分' : ''}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatTime(time?: number): string {
  if (!time) return '未知';
  const d = new Date(time);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// ===== 状态 =====
const loading = ref(false);
const overview = reactive<LearningOverview>({
  totalAnswered: 0,
  totalCorrect: 0,
  accuracy: 0,
  totalPoints: 0,
  totalDuration: 0,
  wrongCount: 0,
  collectedCount: 0,
  streakDays: 0,
});
const trendPoints = ref<TrendPoint[]>([]);
const knowledgeItems = ref<KnowledgeMasteryItem[]>([]);
const subjectItems = ref<SubjectDistributionItem[]>([]);
const difficultyItems = ref<DifficultyAnalysisItem[]>([]);
const recentRecords = ref<RecentRecordItem[]>([]);

const accuracyPercent = computed(() => Math.round(overview.accuracy || 0));

const maxAnswered = computed(() => {
  if (trendPoints.value.length === 0) return 1;
  return Math.max(...trendPoints.value.map((p) => p.answered), 1);
});

const maxSubjectTotal = computed(() => {
  if (subjectItems.value.length === 0) return 1;
  return Math.max(...subjectItems.value.map((s) => s.total), 1);
});

function getBarHeight(answered: number): number {
  if (maxAnswered.value === 0) return 0;
  return Math.max(20, (answered / maxAnswered.value) * 120);
}

function getSubjectWidth(total: number): number {
  if (maxSubjectTotal.value === 0) return 0;
  return Math.max(15, (total / maxSubjectTotal.value) * 100);
}

// ===== 数据加载 =====
async function loadAll() {
  loading.value = true;
  try {
    const [overviewData, trendData, knowledgeData, subjectData, difficultyData, recentData] = await Promise.all([
      learningReportApi.overview(),
      learningReportApi.trend(7),
      learningReportApi.knowledgeMastery(),
      learningReportApi.subjectDistribution(),
      learningReportApi.difficultyAnalysis(),
      learningReportApi.recent(10),
    ]);

    Object.assign(overview, overviewData);
    trendPoints.value = trendData.points ?? [];
    knowledgeItems.value = knowledgeData.items ?? [];
    subjectItems.value = subjectData.items ?? [];
    difficultyItems.value = difficultyData.items ?? [];
    recentRecords.value = recentData ?? [];
  } catch (err) {
    const error = handleApiError(err);
    toast.error(error.message);
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.back();
}

// ===== 生命周期 =====
onMounted(() => {
  loadAll();
});
</script>

<style scoped>
.report-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.back-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: #667eea;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #667eea;
}

.header-spacer { width: 60px; }

.page-main {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

/* 区块卡片 */
.section-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.section-title {
  margin: 0 0 1.2rem;
  font-size: 1.2rem;
  color: #667eea;
}

.empty-section {
  text-align: center;
  color: #999;
  padding: 2rem 0;
  font-size: 0.95rem;
}

/* 总览 */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.overview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.8rem 0.5rem;
  border-radius: 12px;
  background: #f9fafb;
  text-align: center;
}

.overview-item.highlight {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.ov-emoji { font-size: 1.8rem; margin-bottom: 0.3rem; }
.ov-num { font-size: 1.4rem; font-weight: bold; color: #667eea; }
.overview-item.highlight .ov-num { color: #f59e0b; }
.ov-label { font-size: 0.8rem; color: #666; margin-top: 0.2rem; }

/* 趋势图 */
.trend-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 180px;
  padding: 1rem 0.5rem 0;
  border-bottom: 2px solid #e5e7eb;
}

.trend-bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.trend-bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 150px;
}

.trend-accuracy {
  font-size: 0.75rem;
  color: #10b981;
  font-weight: 600;
  margin-bottom: 0.2rem;
}

.trend-bar {
  width: 32px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 6px 6px 0 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 0.2rem;
  min-height: 20px;
  transition: height 0.3s;
}

.bar-count {
  font-size: 0.7rem;
  color: white;
  font-weight: 600;
}

.trend-date {
  font-size: 0.75rem;
  color: #999;
  margin-top: 0.4rem;
}

.trend-legend {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-top: 0.8rem;
  font-size: 0.8rem;
  color: #666;
}

.legend-item { display: flex; align-items: center; gap: 0.3rem; }
.legend-color.bar { display: inline-block; width: 12px; height: 12px; background: #667eea; border-radius: 2px; }
.legend-color.text { color: #10b981; font-weight: 600; }

/* 知识点 */
.knowledge-list { display: flex; flex-direction: column; gap: 1rem; }

.knowledge-item {
  padding: 0.8rem;
  background: #f9fafb;
  border-radius: 12px;
}

.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
}

.knowledge-name { font-weight: 600; color: #333; font-size: 0.95rem; }
.knowledge-accuracy { font-weight: bold; font-size: 0.95rem; }
.acc-high { color: #10b981; }
.acc-mid { color: #f59e0b; }
.acc-low { color: #ef4444; }

.knowledge-meta {
  display: flex;
  gap: 0.8rem;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.mastery-badge {
  padding: 0.1rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
}

.mastery-0 { background: #fee2e2; color: #dc2626; }
.mastery-1 { background: #fef3c7; color: #92400e; }
.mastery-2 { background: #dbeafe; color: #2563eb; }
.mastery-3 { background: #d1fae5; color: #059669; }

.mastery-bar { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
.mastery-fill { height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); transition: width 0.3s; }

/* 学科分布 */
.subject-list { display: flex; flex-direction: column; gap: 1rem; }

.subject-item {
  padding: 0.8rem;
  background: #f9fafb;
  border-radius: 12px;
}

.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.subject-name { font-weight: 600; color: #333; font-size: 0.95rem; }
.subject-accuracy { font-weight: bold; font-size: 0.95rem; }

.subject-bar-wrapper { height: 24px; background: #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 0.3rem; }

.subject-bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.3s;
  min-width: 60px;
}

.subject-count { font-size: 0.8rem; color: white; font-weight: 600; }
.subject-meta { font-size: 0.8rem; color: #666; }

/* 难度分析 */
.difficulty-list { display: flex; flex-direction: column; gap: 0.8rem; }

.difficulty-item {
  padding: 0.8rem;
  background: #f9fafb;
  border-radius: 12px;
}

.diff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.3rem;
}

.diff-name { font-weight: 600; color: #333; font-size: 0.95rem; }
.diff-accuracy { font-weight: bold; font-size: 0.95rem; }

.diff-stats {
  display: flex;
  gap: 0.8rem;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.diff-bar { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
.diff-fill { height: 100%; transition: width 0.3s; }
.diff-fill.acc-high { background: #10b981; }
.diff-fill.acc-mid { background: #f59e0b; }
.diff-fill.acc-low { background: #ef4444; }

/* 最近记录 */
.recent-list { display: flex; flex-direction: column; gap: 0.8rem; }

.recent-item {
  display: flex;
  gap: 0.8rem;
  padding: 0.8rem;
  background: #f9fafb;
  border-radius: 12px;
}

.recent-icon { font-size: 1.4rem; flex-shrink: 0; }
.recent-content { flex: 1; min-width: 0; }

.recent-question {
  color: #333;
  font-size: 0.95rem;
  line-height: 1.4;
  margin-bottom: 0.4rem;
}

.recent-meta { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.4rem; }

.meta-tag {
  padding: 0.15rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
}

.type-tag { background: #eef2ff; color: #667eea; }
.subject-tag { background: #dbeafe; color: #2563eb; }
.time-tag { background: #f3f4f6; color: #6b7280; }
.duration-tag { background: #fef3c7; color: #92400e; }

.recent-answers { font-size: 0.85rem; color: #666; }
.answer-label { color: #999; }
.answer-correct { color: #059669; font-weight: 600; }
.answer-wrong { color: #dc2626; font-weight: 600; }
.answer-correct-text { color: #059669; }

/* 响应式 */
@media (max-width: 768px) {
  .page-header { flex-direction: column; gap: 0.8rem; }
  .overview-grid { grid-template-columns: repeat(2, 1fr); }
  .trend-chart { padding: 1rem 0.2rem 0; }
  .trend-bar { width: 24px; }
}
</style>
