<template>
  <div class="wrong-book-container">
    <header class="page-header">
      <button @click="goBack" class="back-btn">← 返回</button>
      <h1>📒 错题本</h1>
      <button @click="startBatchReview" class="review-btn" :disabled="reviewing || stats.pending === 0">
        {{ reviewing ? `复习中 ${reviewIndex + 1}/${reviewQueue.length}` : '🎯 开始复习' }}
      </button>
    </header>

    <GlobalLoading :loading="loading" message="加载错题..." />
    <GlobalLoading :loading="submitting" message="提交中..." />

    <main class="page-main">
      <!-- 统计卡片 -->
      <div class="stats-cards">
        <div class="stat-card stat-total">
          <span class="stat-emoji">📚</span>
          <div class="stat-info">
            <span class="stat-num">{{ stats.total }}</span>
            <span class="stat-name">错题总数</span>
          </div>
        </div>
        <div class="stat-card stat-pending">
          <span class="stat-emoji">⏰</span>
          <div class="stat-info">
            <span class="stat-num">{{ stats.pending }}</span>
            <span class="stat-name">待复习</span>
          </div>
        </div>
        <div class="stat-card stat-mastered">
          <span class="stat-emoji">✅</span>
          <div class="stat-info">
            <span class="stat-num">{{ stats.mastered }}</span>
            <span class="stat-name">已掌握</span>
          </div>
        </div>
      </div>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <select v-model="filter.subjectId" @change="resetAndLoad" class="filter-select">
          <option :value="undefined">全部学科</option>
          <option v-for="s in subjects" :key="s.subjectId" :value="s.subjectId">{{ s.subjectName }}</option>
        </select>
        <select v-model="filter.masteryLevel" @change="resetAndLoad" class="filter-select">
          <option :value="undefined">全部掌握度</option>
          <option :value="0">未掌握</option>
          <option :value="1">了解</option>
          <option :value="2">熟悉</option>
          <option :value="3">掌握</option>
        </select>
        <select v-model="filter.status" @change="resetAndLoad" class="filter-select">
          <option :value="undefined">全部状态</option>
          <option :value="1">待复习</option>
          <option :value="2">复习中</option>
        </select>
      </div>

      <!-- 错题列表 -->
      <div v-if="wrongList.length === 0 && !loading" class="empty-tip">
        <span class="empty-emoji">🎉</span>
        <p>暂无错题，继续加油！</p>
      </div>

      <div v-for="item in wrongList" :key="item.wrongId" class="wrong-card">
        <div class="card-header" @click="toggleExpand(item.wrongId)">
          <div class="card-meta">
            <span class="meta-tag type-tag">{{ typeLabel(item.question?.type) }}</span>
            <span class="meta-tag wrong-count-tag">❌ 错 {{ item.wrongCount }} 次</span>
            <span class="meta-tag mastery-tag" :class="`mastery-${item.masteryLevel}`">
              {{ masteryLabel(item.masteryLevel) }}
            </span>
          </div>
          <span class="expand-icon">{{ expandedId === item.wrongId ? '▼' : '▶' }}</span>
        </div>

        <div class="card-content" @click="toggleExpand(item.wrongId)">
          {{ truncate(item.question?.content || '题目内容加载中...', 80) }}
        </div>

        <div class="card-footer">
          <span class="time-text">最近错误：{{ formatTime(item.lastWrongTime) }}</span>
          <div class="mastery-progress">
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: (item.masteryLevel / 3 * 100) + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- 展开详情 -->
        <div v-if="expandedId === item.wrongId" class="card-detail">
          <div class="detail-section">
            <h4>📝 题目内容</h4>
            <p class="detail-text">{{ item.question?.content || '题目内容加载中...' }}</p>
          </div>

          <div v-if="item.question && hasOptions(item.question)" class="detail-section">
            <h4>📋 选项</h4>
            <div v-for="(opt, idx) in parseOptions(item.question)" :key="idx" class="option-row">
              <span class="opt-letter">{{ String.fromCharCode(65 + idx) }}</span>
              <span class="opt-text">{{ opt }}</span>
            </div>
          </div>

          <div v-if="item.lastWrongAnswer" class="detail-section">
            <h4>❌ 我的错误答案</h4>
            <p class="detail-text wrong-answer">{{ formatAnswer(item.lastWrongAnswer, item.question) }}</p>
          </div>

          <div v-if="item.question?.correctAnswer" class="detail-section">
            <h4>✅ 正确答案</h4>
            <p class="detail-text correct-answer">{{ formatAnswer(item.question.correctAnswer, item.question) }}</p>
          </div>

          <div v-if="item.question?.analysis" class="detail-section">
            <h4>💡 解析</h4>
            <p class="detail-text">{{ item.question.analysis }}</p>
          </div>

          <div class="detail-actions">
            <button @click="openReview(item)" class="action-btn review-action">📝 复习</button>
            <button @click="markMastered(item)" class="action-btn mastered-action">✅ 标记已掌握</button>
            <button @click="removeWrong(item)" class="action-btn remove-action">🗑 移除</button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="total > pageSize" class="pagination">
        <button @click="prevPage" :disabled="page === 1" class="page-btn">上一页</button>
        <span class="page-info">{{ page }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="page >= totalPages" class="page-btn">下一页</button>
      </div>
    </main>

    <!-- 复习弹窗 -->
    <div v-if="reviewModal.show" class="review-modal-overlay" @click.self="closeReview">
      <div class="review-modal">
        <div class="modal-header">
          <h3>📝 复习错题</h3>
          <button @click="closeReview" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div v-if="reviewModal.question" class="review-question">
            <div class="question-meta">
              <span class="meta-tag type-tag">{{ typeLabel(reviewModal.question.type) }}</span>
            </div>
            <p class="question-content">{{ reviewModal.question.content }}</p>

            <!-- 选项题 -->
            <div v-if="isChoiceType(reviewModal.question.type)" class="review-options">
              <button
                v-for="(opt, idx) in parseOptions(reviewModal.question)"
                :key="idx"
                class="review-option"
                :class="{ selected: reviewModal.selectedIdx === idx }"
                @click="reviewModal.selectedIdx = idx"
              >
                <span class="opt-letter">{{ String.fromCharCode(65 + idx) }}</span>
                <span>{{ opt }}</span>
              </button>
            </div>

            <!-- 填空题 -->
            <div v-else-if="normalizeType(reviewModal.question.type) === 'fill'" class="review-fill">
              <div v-for="(_, idx) in reviewModal.fillBlanks" :key="idx" class="fill-row">
                <label>第 {{ idx + 1 }} 空</label>
                <input v-model="reviewModal.fillBlanks[idx]" type="text" class="fill-input" placeholder="请输入答案" />
              </div>
            </div>

            <!-- 简答题 -->
            <div v-else class="review-short">
              <textarea v-model="reviewModal.shortAnswer" class="short-input" placeholder="请输入你的答案..." rows="4"></textarea>
            </div>

            <!-- 复习结果 -->
            <div v-if="reviewModal.result !== null" class="review-result" :class="reviewModal.result ? 'correct' : 'wrong'">
              <span class="result-icon">{{ reviewModal.result ? '✅' : '❌' }}</span>
              <span>{{ reviewModal.result ? '回答正确！' : '回答错误！' }}</span>
            </div>
            <div v-if="reviewModal.result === false && reviewModal.question?.correctAnswer" class="review-correct">
              <strong>正确答案：</strong>{{ formatAnswer(reviewModal.question.correctAnswer, reviewModal.question) }}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button v-if="reviewModal.result === null" @click="submitReview" class="modal-btn primary" :disabled="!canSubmitReview">提交答案</button>
          <button v-else @click="nextReview" class="modal-btn primary">{{ reviewIndex < reviewQueue.length - 1 ? '下一题' : '完成复习' }}</button>
          <button @click="closeReview" class="modal-btn secondary">退出</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { wrongBookApi } from '@/services/wrong-book-api.service';
import { questionApi } from '@/services/question-api.service';
import { subjectApi } from '@/services/subject-api.service';
import { handleApiError } from '@/utils/error-handler.util';
import { toast } from '@/services/toast.service';
import GlobalLoading from '@/components/GlobalLoading.vue';
import { parseQuestionOptions, JUDGMENT_OPTIONS } from '@/utils/question-options';
import type { WrongQuestion, Question, Subject } from '@/services/api.types';

const router = useRouter();

// ===== 常量 =====
const TYPE_LABELS: Record<string, string> = {
  single: '单选题', choice: '单选题',
  multiple: '多选题',
  judge: '判断题', judgment: '判断题',
  fill: '填空题',
  short_answer: '简答题',
  image: '图片题',
  audio: '音频题',
};

const MASTERY_LABELS: Record<number, string> = {
  0: '未掌握', 1: '了解', 2: '熟悉', 3: '掌握',
};

function typeLabel(type?: string): string {
  if (!type) return '题目';
  return TYPE_LABELS[type] || '题目';
}

function masteryLabel(level: number): string {
  return MASTERY_LABELS[level] || '未掌握';
}

function normalizeType(type: string): string {
  if (!type) return 'single';
  const t = type.trim().toLowerCase();
  if (t === 'choice') return 'single';
  if (t === 'judgment') return 'judge';
  return t;
}

function isChoiceType(type: string): boolean {
  const t = normalizeType(type);
  return t === 'single' || t === 'judge';
}

function parseOptions(question: Question): string[] {
  const parsed = parseQuestionOptions(question.options);
  if ((question.type === 'judgment' || question.type === 'judge') && parsed.length === 0) {
    return [...JUDGMENT_OPTIONS];
  }
  return parsed;
}

function hasOptions(question: Question): boolean {
  const t = normalizeType(question.type);
  return t === 'single' || t === 'multiple' || t === 'judge';
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '...' : text;
}

function formatTime(time?: number): string {
  if (!time) return '未知';
  const d = new Date(time);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function formatAnswer(answer: string, question?: Question): string {
  if (!answer || !question) return answer || '';
  const t = normalizeType(question.type);
  if (t === 'fill') return answer.split('|||').join('；');
  if (t === 'short_answer') return answer;
  const opts = parseOptions(question);
  const letters = answer.split(',').map((s) => s.trim());
  const parts = letters.map((letter) => {
    if (letter.length === 1 && /[A-Z]/i.test(letter)) {
      const idx = letter.toUpperCase().charCodeAt(0) - 65;
      if (idx >= 0 && idx < opts.length) return `${letter}. ${opts[idx]}`;
    }
    return letter;
  });
  return parts.join('；');
}

// ===== 状态 =====
const loading = ref(false);
const submitting = ref(false);
const wrongList = ref<WrongQuestion[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 10;
const expandedId = ref<number | null>(null);
const subjects = ref<Subject[]>([]);

const stats = reactive({ total: 0, pending: 0, mastered: 0, reviewing: 0 });

const filter = reactive({
  subjectId: undefined as number | undefined,
  masteryLevel: undefined as number | undefined,
  status: undefined as number | undefined,
});

const totalPages = computed(() => Math.ceil(total.value / pageSize) || 1);

// ===== 复习流程 =====
const reviewing = ref(false);
const reviewQueue = ref<WrongQuestion[]>([]);
const reviewIndex = ref(0);

const reviewModal = reactive({
  show: false,
  question: null as Question | null,
  wrongQuestion: null as WrongQuestion | null,
  selectedIdx: null as number | null,
  fillBlanks: [] as string[],
  shortAnswer: '',
  result: null as boolean | null,
  prevWrongCount: 0,
});

const canSubmitReview = computed(() => {
  const q = reviewModal.question;
  if (!q) return false;
  const t = normalizeType(q.type);
  if (t === 'fill') return reviewModal.fillBlanks.some((b) => b.trim().length > 0);
  if (t === 'short_answer') return reviewModal.shortAnswer.trim().length > 0;
  return reviewModal.selectedIdx !== null;
});

// ===== 数据加载 =====
async function loadStats() {
  try {
    const s = await wrongBookApi.stats();
    stats.total = s.total ?? 0;
    stats.pending = s.pending ?? 0;
    stats.mastered = s.mastered ?? 0;
    stats.reviewing = s.reviewing ?? 0;
  } catch (err) {
    console.error('加载统计失败:', err);
  }
}

async function loadSubjects() {
  try {
    subjects.value = await subjectApi.list();
  } catch (err) {
    console.error('加载学科失败:', err);
  }
}

async function loadList() {
  loading.value = true;
  try {
    const result = await wrongBookApi.page({
      subjectId: filter.subjectId,
      masteryLevel: filter.masteryLevel,
      status: filter.status,
      page: page.value,
      size: pageSize,
    });
    wrongList.value = result.list;
    total.value = result.total;
  } catch (err) {
    const error = handleApiError(err);
    toast.error(error.message);
  } finally {
    loading.value = false;
  }
}

async function loadAll() {
  await Promise.all([loadStats(), loadSubjects(), loadList()]);
}

function resetAndLoad() {
  page.value = 1;
  loadList();
}

function prevPage() {
  if (page.value > 1) {
    page.value--;
    loadList();
  }
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++;
    loadList();
  }
}

function toggleExpand(wrongId: number) {
  expandedId.value = expandedId.value === wrongId ? null : wrongId;
}

// ===== 操作 =====
async function markMastered(item: WrongQuestion) {
  if (!confirm('确定将此题标记为已掌握吗？')) return;
  try {
    await wrongBookApi.markMastered(item.questionId);
    toast.success('已标记为掌握');
    await loadAll();
  } catch (err) {
    const error = handleApiError(err);
    toast.error(error.message);
  }
}

async function removeWrong(item: WrongQuestion) {
  if (!confirm('确定将此题移出错题本吗？')) return;
  try {
    await wrongBookApi.remove(item.questionId);
    toast.success('已移出错题本');
    await loadAll();
  } catch (err) {
    const error = handleApiError(err);
    toast.error(error.message);
  }
}

// ===== 复习流程 =====
async function startBatchReview() {
  try {
    loading.value = true;
    const dueList = await wrongBookApi.listDueReview();
    if (dueList.length === 0) {
      toast.info('暂无待复习的错题');
      return;
    }
    reviewQueue.value = dueList;
    reviewIndex.value = 0;
    reviewing.value = true;
    await loadReviewQuestion(dueList[0]);
  } catch (err) {
    const error = handleApiError(err);
    toast.error(error.message);
  } finally {
    loading.value = false;
  }
}

async function loadReviewQuestion(wq: WrongQuestion) {
  let question = wq.question;
  if (!question) {
    try {
      question = await questionApi.getDetail(wq.questionId);
    } catch (err) {
      const error = handleApiError(err);
      toast.error(error.message);
      closeReview();
      return;
    }
  }
  reviewModal.question = question;
  reviewModal.wrongQuestion = wq;
  reviewModal.selectedIdx = null;
  reviewModal.shortAnswer = '';
  reviewModal.result = null;
  reviewModal.prevWrongCount = wq.wrongCount;
  // 初始化填空
  if (normalizeType(question.type) === 'fill' && question.correctAnswer) {
    const blankCount = question.correctAnswer.split('|||').length;
    reviewModal.fillBlanks = new Array(blankCount).fill('');
  } else {
    reviewModal.fillBlanks = [];
  }
  reviewModal.show = true;
}

function openReview(item: WrongQuestion) {
  reviewQueue.value = [item];
  reviewIndex.value = 0;
  reviewing.value = false;
  loadReviewQuestion(item);
}

function closeReview() {
  reviewModal.show = false;
  reviewModal.question = null;
  reviewModal.wrongQuestion = null;
  reviewModal.result = null;
  if (reviewing.value) {
    reviewing.value = false;
    loadAll();
  }
}

function buildReviewAnswer(): string {
  const q = reviewModal.question;
  if (!q) return '';
  const t = normalizeType(q.type);
  if (t === 'fill') return reviewModal.fillBlanks.map((b) => b.trim()).join('|||');
  if (t === 'short_answer') return reviewModal.shortAnswer.trim();
  if (reviewModal.selectedIdx !== null) {
    const opts = parseOptions(q);
    return opts[reviewModal.selectedIdx] || '';
  }
  return '';
}

async function submitReview() {
  if (!reviewModal.question || !canSubmitReview.value) return;
  submitting.value = true;
  try {
    const userAnswer = buildReviewAnswer();
    const updated = await wrongBookApi.review({
      questionId: reviewModal.question.questionId,
      userAnswer,
    });
    // 通过 wrongCount 变化判断对错
    reviewModal.result = updated.wrongCount <= reviewModal.prevWrongCount;
    if (reviewModal.wrongQuestion) {
      reviewModal.wrongQuestion.wrongCount = updated.wrongCount;
      reviewModal.wrongQuestion.masteryLevel = updated.masteryLevel;
    }
    if (reviewModal.result) {
      toast.success('回答正确！');
    } else {
      toast.warning('回答错误，继续加油！');
    }
  } catch (err) {
    const error = handleApiError(err);
    toast.error(error.message);
  } finally {
    submitting.value = false;
  }
}

async function nextReview() {
  if (reviewIndex.value < reviewQueue.value.length - 1) {
    reviewIndex.value++;
    await loadReviewQuestion(reviewQueue.value[reviewIndex.value]);
  } else {
    toast.success('复习完成！');
    closeReview();
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
.wrong-book-container {
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

.review-btn {
  padding: 0.6rem 1.4rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.review-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
.review-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.page-main {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-emoji { font-size: 2rem; }
.stat-info { display: flex; flex-direction: column; }
.stat-num { font-size: 1.8rem; font-weight: bold; color: #667eea; }
.stat-name { font-size: 0.85rem; color: #666; }

.stat-total .stat-num { color: #667eea; }
.stat-pending .stat-num { color: #f59e0b; }
.stat-mastered .stat-num { color: #10b981; }

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 0.8rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filter-select {
  flex: 1;
  min-width: 120px;
  padding: 0.6rem 0.8rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  font-size: 0.95rem;
  cursor: pointer;
}

.filter-select:focus { outline: none; border-color: #667eea; }

/* 空状态 */
.empty-tip {
  background: white;
  border-radius: 20px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.empty-emoji { font-size: 3rem; display: block; margin-bottom: 1rem; }
.empty-tip p { color: #666; font-size: 1.1rem; }

/* 错题卡片 */
.wrong-card {
  background: white;
  border-radius: 16px;
  padding: 1.2rem 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.wrong-card:hover { box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15); }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  margin-bottom: 0.6rem;
}

.card-meta { display: flex; gap: 0.4rem; flex-wrap: wrap; }

.meta-tag {
  padding: 0.2rem 0.6rem;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
}

.type-tag { background: #eef2ff; color: #667eea; }
.wrong-count-tag { background: #fee2e2; color: #dc2626; }
.mastery-tag { background: #f3f4f6; color: #6b7280; }
.mastery-0 { background: #fee2e2; color: #dc2626; }
.mastery-1 { background: #fef3c7; color: #92400e; }
.mastery-2 { background: #dbeafe; color: #2563eb; }
.mastery-3 { background: #d1fae5; color: #059669; }

.expand-icon { color: #999; font-size: 0.8rem; }

.card-content {
  color: #333;
  font-size: 1rem;
  line-height: 1.5;
  cursor: pointer;
  margin-bottom: 0.6rem;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.time-text { font-size: 0.8rem; color: #999; }

.mastery-progress { flex: 1; max-width: 120px; }
.progress-track { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); transition: width 0.3s; }

/* 展开详情 */
.card-detail {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.detail-section { margin-bottom: 1rem; }
.detail-section h4 { margin: 0 0 0.4rem; font-size: 0.95rem; color: #667eea; }
.detail-text { margin: 0; color: #333; line-height: 1.6; font-size: 0.95rem; }
.wrong-answer { color: #dc2626; background: #fee2e2; padding: 0.5rem 0.8rem; border-radius: 8px; }
.correct-answer { color: #059669; background: #d1fae5; padding: 0.5rem 0.8rem; border-radius: 8px; }

.option-row {
  display: flex;
  gap: 0.6rem;
  padding: 0.4rem 0;
  align-items: center;
}

.opt-letter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: bold;
  flex-shrink: 0;
}

.opt-text { color: #333; font-size: 0.95rem; }

.detail-actions {
  display: flex;
  gap: 0.6rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.review-action { background: #eef2ff; color: #667eea; }
.mastered-action { background: #d1fae5; color: #059669; }
.remove-action { background: #fee2e2; color: #dc2626; }

.action-btn:hover { transform: translateY(-1px); }

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.page-btn {
  padding: 0.5rem 1.2rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  font-size: 0.95rem;
  color: #667eea;
}

.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.page-info { color: white; font-size: 0.95rem; font-weight: 600; }

/* 复习弹窗 */
.review-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.review-modal {
  background: white;
  border-radius: 20px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.modal-header h3 { margin: 0; color: #667eea; }

.close-btn {
  width: 32px; height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  font-size: 1.4rem;
  cursor: pointer;
  color: #666;
}

.modal-body { padding: 1.5rem; overflow-y: auto; flex: 1; }

.question-meta { margin-bottom: 0.8rem; }
.question-content { font-size: 1.1rem; color: #333; line-height: 1.6; margin: 0 0 1rem; }

.review-options { display: flex; flex-direction: column; gap: 0.6rem; }

.review-option {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.review-option:hover { border-color: #667eea; }
.review-option.selected { border-color: #667eea; background: #eef2ff; }

.review-fill { display: flex; flex-direction: column; gap: 0.8rem; }
.fill-row { display: flex; flex-direction: column; gap: 0.3rem; }
.fill-row label { font-size: 0.85rem; color: #666; }
.fill-input {
  padding: 0.6rem 0.8rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 1rem;
}
.fill-input:focus { outline: none; border-color: #667eea; }

.short-input {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
}
.short-input:focus { outline: none; border-color: #667eea; }

.review-result {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1rem;
  border-radius: 12px;
  margin-top: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.review-result.correct { background: #d1fae5; color: #059669; }
.review-result.wrong { background: #fee2e2; color: #dc2626; }

.review-correct {
  margin-top: 0.6rem;
  padding: 0.6rem 0.8rem;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #333;
}

.modal-footer {
  display: flex;
  gap: 0.8rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #f3f4f6;
}

.modal-btn {
  flex: 1;
  padding: 0.8rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.modal-btn.primary { background: #667eea; color: white; }
.modal-btn.primary:disabled { opacity: 0.6; cursor: not-allowed; }
.modal-btn.secondary { background: #e5e7eb; color: #666; }

/* 响应式 */
@media (max-width: 768px) {
  .page-header { flex-direction: column; gap: 0.8rem; }
  .stats-cards { grid-template-columns: 1fr; }
  .filter-bar { flex-direction: column; }
  .card-footer { flex-direction: column; align-items: flex-start; }
  .mastery-progress { max-width: 100%; width: 100%; }
}
</style>
