<template>
  <div class="collection-container">
    <header class="page-header">
      <button @click="goBack" class="back-btn">← 返回</button>
      <h1>⭐ 收藏夹</h1>
      <div class="header-stat">
        <span class="stat-emoji">📚</span>
        <span class="stat-num">{{ total }}</span>
        <span class="stat-name">道收藏</span>
      </div>
    </header>

    <GlobalLoading :loading="loading" message="加载收藏..." />

    <main class="page-main">
      <!-- 空状态 -->
      <div v-if="collectionList.length === 0 && !loading" class="empty-tip">
        <span class="empty-emoji">📭</span>
        <p>暂无收藏题目</p>
        <p class="empty-sub">答题时点击 ⭐ 即可收藏题目</p>
      </div>

      <!-- 收藏列表 -->
      <div v-for="item in collectionList" :key="item.collectionId" class="collection-card">
        <div class="card-header" @click="toggleExpand(item.collectionId)">
          <div class="card-meta">
            <span class="meta-tag type-tag">{{ typeLabel(item.question?.type) }}</span>
            <span class="meta-tag time-tag">📅 {{ formatTime(item.createTime) }}</span>
          </div>
          <span class="expand-icon">{{ expandedId === item.collectionId ? '▼' : '▶' }}</span>
        </div>

        <div class="card-content" @click="toggleExpand(item.collectionId)">
          {{ truncate(item.question?.content || '题目内容加载中...', 80) }}
        </div>

        <div v-if="item.note" class="card-note">
          <span class="note-icon">📝</span>
          <span class="note-text">{{ item.note }}</span>
        </div>

        <!-- 展开详情 -->
        <div v-if="expandedId === item.collectionId" class="card-detail">
          <div class="detail-section">
            <h4>📝 题目内容</h4>
            <p class="detail-text">{{ item.question?.content || '题目内容加载中...' }}</p>
          </div>

          <div v-if="item.question && hasOptions(item.question)" class="detail-section">
            <h4>📋 选项</h4>
            <div v-for="(opt, idx) in parseOptions(item.question)" :key="idx" class="option-row">
              <span class="opt-letter" :class="{ correct: isCorrectOption(idx, item.question) }">{{ String.fromCharCode(65 + idx) }}</span>
              <span class="opt-text">{{ opt }}</span>
              <span v-if="isCorrectOption(idx, item.question)" class="check-icon">✓</span>
            </div>
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
            <button @click="removeCollection(item)" class="action-btn remove-action">❌ 取消收藏</button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { collectionApi } from '@/services/collection-api.service';
import { handleApiError } from '@/utils/error-handler.util';
import { toast } from '@/services/toast.service';
import GlobalLoading from '@/components/GlobalLoading.vue';
import { parseQuestionOptions, JUDGMENT_OPTIONS } from '@/utils/question-options';
import type { QuestionCollection, Question } from '@/services/api.types';

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

function typeLabel(type?: string): string {
  if (!type) return '题目';
  return TYPE_LABELS[type] || '题目';
}

function normalizeType(type: string): string {
  if (!type) return 'single';
  const t = type.trim().toLowerCase();
  if (t === 'choice') return 'single';
  if (t === 'judgment') return 'judge';
  return t;
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

function isCorrectOption(index: number, question: Question): boolean {
  if (!question.correctAnswer) return false;
  const letter = String.fromCharCode(65 + index);
  return question.correctAnswer.split(',').map((s) => s.trim().toUpperCase()).includes(letter);
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '...' : text;
}

function formatTime(time?: number): string {
  if (!time) return '未知';
  const d = new Date(time);
  return `${d.getMonth() + 1}/${d.getDate()}`;
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
const collectionList = ref<QuestionCollection[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 10;
const expandedId = ref<number | null>(null);

const totalPages = computed(() => Math.ceil(total.value / pageSize) || 1);

// ===== 数据加载 =====
async function loadList() {
  loading.value = true;
  try {
    const result = await collectionApi.page({ page: page.value, size: pageSize });
    collectionList.value = result.list;
    total.value = result.total;
  } catch (err) {
    const error = handleApiError(err);
    toast.error(error.message);
  } finally {
    loading.value = false;
  }
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

function toggleExpand(collectionId: number) {
  expandedId.value = expandedId.value === collectionId ? null : collectionId;
}

// ===== 操作 =====
async function removeCollection(item: QuestionCollection) {
  if (!confirm('确定取消收藏此题吗？')) return;
  try {
    await collectionApi.remove(item.questionId);
    toast.success('已取消收藏');
    // 如果当前页只剩一条且不是第一页，回到上一页
    if (collectionList.value.length === 1 && page.value > 1) {
      page.value--;
    }
    await loadList();
  } catch (err) {
    const error = handleApiError(err);
    toast.error(error.message);
  }
}

function goBack() {
  router.back();
}

// ===== 生命周期 =====
onMounted(() => {
  loadList();
});
</script>

<style scoped>
.collection-container {
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

.header-stat {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: #fef3c7;
  border-radius: 20px;
}

.header-stat .stat-emoji { font-size: 1.2rem; }
.header-stat .stat-num { font-size: 1.3rem; font-weight: bold; color: #f59e0b; }
.header-stat .stat-name { font-size: 0.85rem; color: #92400e; }

.page-main {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

/* 空状态 */
.empty-tip {
  background: white;
  border-radius: 20px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.empty-emoji { font-size: 3rem; display: block; margin-bottom: 1rem; }
.empty-tip p { color: #666; font-size: 1.1rem; margin: 0.5rem 0; }
.empty-sub { font-size: 0.9rem !important; color: #999 !important; }

/* 收藏卡片 */
.collection-card {
  background: white;
  border-radius: 16px;
  padding: 1.2rem 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.collection-card:hover { box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15); }

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
.time-tag { background: #f3f4f6; color: #6b7280; }

.expand-icon { color: #999; font-size: 0.8rem; }

.card-content {
  color: #333;
  font-size: 1rem;
  line-height: 1.5;
  cursor: pointer;
  margin-bottom: 0.6rem;
}

.card-note {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  padding: 0.5rem 0.8rem;
  background: #fef3c7;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #92400e;
}

.note-icon { flex-shrink: 0; }
.note-text { flex: 1; word-break: break-all; }

/* 展开详情 */
.card-detail {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.detail-section { margin-bottom: 1rem; }
.detail-section h4 { margin: 0 0 0.4rem; font-size: 0.95rem; color: #667eea; }
.detail-text { margin: 0; color: #333; line-height: 1.6; font-size: 0.95rem; }
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

.opt-letter.correct { background: #10b981; }
.opt-text { color: #333; font-size: 0.95rem; flex: 1; }
.check-icon { color: #10b981; font-weight: bold; }

.detail-actions {
  display: flex;
  gap: 0.6rem;
  margin-top: 1rem;
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

/* 响应式 */
@media (max-width: 768px) {
  .page-header { flex-direction: column; gap: 0.8rem; }
}
</style>
