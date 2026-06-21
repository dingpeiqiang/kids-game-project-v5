<template>
  <div class="answer-container">
    <header class="answer-header">
      <button @click="goBack" class="back-btn">← 返回</button>
      <h1>📝 答题中心</h1>
      <div class="points-display">
        <span class="points-label">游学币</span>
        <span class="points-value">{{ userStore.currentUser?.fatiguePoints || 0 }}</span>
      </div>
    </header>

    <GlobalLoading :loading="isSubmitting" message="提交中..." />
    <GlobalLoading :loading="isLoadingQuestion" message="加载题目..." />

    <main class="answer-main">
      <!-- 欢迎界面：选择练习模式 -->
      <div v-if="phase === 'welcome'" class="welcome-screen">
        <h2>🎉 欢迎来到答题中心</h2>
        <p>通过答题获得游学币，解锁更多游戏！</p>
        <div class="stats-info">
          <div class="stat-item">
            <span class="stat-label">每题获得</span>
            <span class="stat-value">+{{ parentStore.answerPointsPerQuestion }} 游学币</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">今日还可获得</span>
            <span class="stat-value">{{ dailyAnswerRemaining }} 游学币</span>
          </div>
        </div>

        <!-- 练习模式选择 -->
        <div class="practice-options">
          <div class="option-group">
            <label class="option-label">题目数量</label>
            <div class="count-buttons">
              <button
                v-for="n in [5, 10, 15, 20]"
                :key="n"
                class="count-btn"
                :class="{ active: practiceConfig.questionCount === n }"
                @click="practiceConfig.questionCount = n"
              >{{ n }} 题</button>
            </div>
          </div>
          <div class="option-group">
            <label class="option-label">难度</label>
            <div class="count-buttons">
              <button
                v-for="d in difficultyOptions"
                :key="d.value"
                class="count-btn"
                :class="{ active: practiceConfig.difficultyRange === d.value }"
                @click="practiceConfig.difficultyRange = d.value"
              >{{ d.label }}</button>
            </div>
          </div>
        </div>

        <button @click="startPractice" class="start-btn" :disabled="dailyAnswerRemaining === 0">
          {{ dailyAnswerRemaining === 0 ? '今日答题游学币已达上限' : '开始练习' }}
        </button>
      </div>

      <!-- 答题界面 -->
      <div v-else-if="phase === 'practice' && currentQuestion" class="practice-screen">
        <!-- 进度与题号导航 -->
        <div class="progress-bar">
          <div class="progress-info">
            <span>第 {{ currentIndex + 1 }} / {{ session?.totalCount || practiceConfig.questionCount }} 题</span>
            <span v-if="timerText" class="timer" :class="{ urgent: timerUrgent }">⏱ {{ timerText }}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <!-- 题号导航 -->
          <div class="question-nav">
            <button
              v-for="(item, idx) in answeredList"
              :key="idx"
              class="nav-dot"
              :class="{
                current: idx === currentIndex,
                correct: item.submitted && item.isCorrect,
                wrong: item.submitted && !item.isCorrect,
                unanswered: !item.submitted
              }"
              @click="jumpTo(idx)"
              :disabled="idx > currentIndex && !item.submitted"
            >{{ idx + 1 }}</button>
          </div>
        </div>

        <!-- 题目卡片 -->
        <div class="question-card">
          <div class="question-header">
            <div class="question-meta">
              <span class="meta-tag type-tag">{{ typeLabel(currentQuestion.type) }}</span>
              <span v-if="currentQuestion.difficulty" class="meta-tag difficulty-tag">
                难度 {{ '★'.repeat(currentQuestion.difficulty) }}
              </span>
              <span class="meta-tag points-tag">+{{ parentStore.answerPointsPerQuestion }} 游学币</span>
            </div>
            <div class="question-actions-top">
              <button
                class="icon-btn"
                :class="{ active: isMarked }"
                @click="toggleMark"
                :disabled="showResult"
                :title="isMarked ? '取消标记' : '标记本题'"
              >🚩</button>
              <button
                class="icon-btn"
                :class="{ active: isCollected }"
                @click="toggleCollect"
                :disabled="showResult"
                :title="isCollected ? '取消收藏' : '收藏本题'"
              >⭐</button>
            </div>
          </div>

          <!-- 媒体附件（图片/音频） -->
          <div v-if="mediaList.length" class="question-media">
            <template v-for="(media, idx) in mediaList" :key="idx">
              <img v-if="media.type === 'image'" :src="media.url" class="media-image" :alt="media.description || ''" />
              <audio v-if="media.type === 'audio'" :src="media.url" controls class="media-audio"></audio>
              <video v-if="media.type === 'video'" :src="media.url" controls class="media-video"></video>
            </template>
          </div>

          <!-- 题干 -->
          <div class="question-content">
            <h3 class="question-text">{{ currentQuestion.content }}</h3>
          </div>

          <!-- 答题区域 -->
          <!-- 单选 / 判断 -->
          <div v-if="isChoiceType" class="question-options">
            <button
              v-for="(option, index) in displayOptions"
              :key="index"
              class="option-btn"
              :class="optionClass(index)"
              @click="selectSingle(index)"
              :disabled="showResult"
            >
              <span class="option-label">{{ optionLabel(index) }}</span>
              <span class="option-text">{{ option }}</span>
            </button>
          </div>

          <!-- 多选 -->
          <div v-else-if="normalizedType === 'multiple'" class="question-options">
            <button
              v-for="(option, index) in displayOptions"
              :key="index"
              class="option-btn"
              :class="optionClass(index)"
              @click="toggleMultiple(index)"
              :disabled="showResult"
            >
              <span class="option-label">{{ optionLabel(index) }}</span>
              <span class="option-text">{{ option }}</span>
              <span v-if="showResult && isCorrectOption(index)" class="check-icon">✓</span>
            </button>
          </div>

          <!-- 填空（多空） -->
          <div v-else-if="normalizedType === 'fill'" class="fill-answer">
            <div v-for="(blank, idx) in fillBlanks" :key="idx" class="fill-blank">
              <label class="fill-label">第 {{ idx + 1 }} 空</label>
              <input
                v-model="fillBlanks[idx]"
                type="text"
                class="fill-input"
                :placeholder="`请输入第 ${idx + 1} 空的答案`"
                :disabled="showResult"
                maxlength="200"
              />
            </div>
          </div>

          <!-- 简答 -->
          <div v-else-if="normalizedType === 'short_answer'" class="short-answer">
            <textarea
              v-model="shortAnswer"
              class="short-input"
              placeholder="请输入你的答案..."
              :disabled="showResult"
              rows="5"
              maxlength="2000"
            ></textarea>
            <p v-if="showResult && !isCorrect && matchedKeywords.length" class="keyword-hint">
              提示：你的答案包含了关键词 {{ matchedKeywords.join('、') }}，但仍需人工复核。
            </p>
          </div>

          <!-- 结果展示 -->
          <div v-if="showResult" class="result-message">
            <div :class="['result', isCorrect ? 'correct' : 'wrong']">
              <span class="result-icon">{{ isCorrect ? '✅' : '❌' }}</span>
              <span class="result-text">
                <template v-if="isCorrect">
                  回答正确！{{ lastEarnedPoints > 0 ? `获得 ${lastEarnedPoints} 游学币` : '今日答题游学币已达上限' }}
                </template>
                <template v-else>
                  回答错误！正确答案：{{ correctAnswerDisplay }}
                </template>
              </span>
            </div>
            <div v-if="resultAnalysis" class="result-analysis">
              <strong>解析：</strong>{{ resultAnalysis }}
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="question-actions">
            <button
              v-if="!showResult"
              @click="submitAnswer"
              class="action-btn submit-btn"
              :disabled="!canSubmit || isSubmitting"
            >{{ isSubmitting ? '提交中...' : '提交答案' }}</button>
            <button
              v-else
              @click="nextQuestion"
              class="action-btn next-btn"
            >{{ isLastQuestion ? '完成练习' : '下一题' }}</button>
            <button @click="exitPractice" class="action-btn exit-btn">退出</button>
          </div>
        </div>
      </div>
    </main>

    <!-- 完成弹窗 -->
    <KidUnifiedModalV2
      v-model:show="showCompleteModal"
      title="练习完成！"
      type="result"
      icon="🎉"
      :stats="[
        { label: '答题数量', value: `${answeredCount} 题` },
        { label: '正确数量', value: `${correctCount} 题` },
        { label: '正确率', value: `${accuracyPercent}%` },
        { label: '获得游学币', value: `+${totalPointsEarned}` }
      ]"
      :actions="[
        { text: '返回首页', variant: 'primary', onClick: goBack },
        { text: '继续答题', variant: 'secondary', onClick: backToWelcome }
      ]"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/core/store/user.store';
import { useParentStore } from '@/core/store/parent.store';
import { practiceApi } from '@/services/practice-api.service';
import { questionApi } from '@/services/question-api.service';
import { collectionApi } from '@/services/collection-api.service';
import { handleApiError } from '@/utils/error-handler.util';
import { toast } from '@/services/toast.service';
import GlobalLoading from '@/components/GlobalLoading.vue';
import KidUnifiedModalV2 from '@/components/ui/KidUnifiedModalV2.vue';
import { parseQuestionOptions, JUDGMENT_OPTIONS } from '@/utils/question-options';
import type { Question, DailySession } from '@/services/api.types';
import type { AnswerSubmitResult } from '@/services/question-api.service';

const router = useRouter();
const userStore = useUserStore();
const parentStore = useParentStore();

// ===== 题型常量 =====
const difficultyOptions = [
  { value: 'ALL', label: '全部' },
  { value: 'EASY', label: '简单' },
  { value: 'MEDIUM', label: '中等' },
  { value: 'HARD', label: '困难' },
];

const TYPE_LABELS: Record<string, string> = {
  single: '单选题', choice: '单选题',
  multiple: '多选题',
  judge: '判断题', judgment: '判断题',
  fill: '填空题',
  short_answer: '简答题',
  image: '图片题',
  audio: '音频题',
};

function typeLabel(type: string): string {
  return TYPE_LABELS[type] || '题目';
}

/** 归一化题型（与后端一致：choice→single, judgment→judge） */
function normalizeType(type: string): string {
  if (!type) return 'single';
  const t = type.trim().toLowerCase();
  if (t === 'choice') return 'single';
  if (t === 'judgment') return 'judge';
  return t;
}

// ===== 阶段状态 =====
type Phase = 'welcome' | 'practice';
const phase = ref<Phase>('welcome');

const practiceConfig = ref({
  questionCount: 5,
  difficultyRange: 'ALL',
});

const session = ref<DailySession | null>(null);
const currentQuestion = ref<Question | null>(null);
const currentIndex = ref(0);
const isLoadingQuestion = ref(false);
const isSubmitting = ref(false);
const showCompleteModal = ref(false);

// 答题状态
const selectedSingle = ref<number | null>(null);
const selectedMultiple = ref<Set<number>>(new Set());
const fillBlanks = ref<string[]>([]);
const shortAnswer = ref('');
const isMarked = ref(false);
const isCollected = ref(false);

// 结果状态
const showResult = ref(false);
const isCorrect = ref(false);
const lastEarnedPoints = ref(0);
const revealedCorrectAnswer = ref('');
const resultAnalysis = ref('');
const matchedKeywords = ref<string[]>([]);
const lastSubmitResult = ref<AnswerSubmitResult | null>(null);

// 已答题目记录（用于题号导航）
interface AnsweredItem {
  questionId: number;
  question: Question;
  userAnswer: string;
  isCorrect: boolean;
  points: number;
  submitted: boolean;
  marked: boolean;
  collected: boolean;
}
const answeredList = ref<AnsweredItem[]>([]);

const todayEarnedPoints = ref(0);

// ===== 倒计时 =====
const timerSeconds = ref(0);
let timerHandle: number | null = null;
const timerText = computed(() => {
  if (timerSeconds.value <= 0) return '';
  const m = Math.floor(timerSeconds.value / 60);
  const s = timerSeconds.value % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
});
const timerUrgent = computed(() => timerSeconds.value > 0 && timerSeconds.value <= 10);

function startTimer(seconds: number) {
  stopTimer();
  if (seconds <= 0) return;
  timerSeconds.value = seconds;
  timerHandle = window.setInterval(() => {
    timerSeconds.value--;
    if (timerSeconds.value <= 0) {
      stopTimer();
      if (!showResult.value && canSubmit.value) {
        toast.warning('时间到，自动提交！');
        submitAnswer();
      }
    }
  }, 1000);
}

function stopTimer() {
  if (timerHandle !== null) {
    clearInterval(timerHandle);
  }
  timerHandle = null;
  timerSeconds.value = 0;
}

// ===== 计算属性 =====
const dailyAnswerRemaining = computed(() => {
  const limit = parentStore.dailyAnswerLimit;
  return Math.max(0, limit - todayEarnedPoints.value);
});

const normalizedType = computed(() => normalizeType(currentQuestion.value?.type || ''));

const isChoiceType = computed(() => {
  const t = normalizedType.value;
  return t === 'single' || t === 'judge';
});

const displayOptions = computed(() => {
  if (!currentQuestion.value) return [];
  const type = currentQuestion.value.type;
  const parsed = parseQuestionOptions(currentQuestion.value.options);
  if ((type === 'judgment' || type === 'judge') && parsed.length === 0) {
    return [...JUDGMENT_OPTIONS];
  }
  return parsed;
});

const mediaList = computed<{ type: string; url: string; description?: string }[]>(() => {
  if (!currentQuestion.value?.mediaUrls) return [];
  try {
    const parsed = JSON.parse(currentQuestion.value.mediaUrls);
    if (Array.isArray(parsed)) {
      return parsed.map((m: unknown) => {
        if (typeof m === 'string') return { type: 'image', url: m };
        const obj = m as { type?: string; url?: string; description?: string };
        return { type: obj.type || 'image', url: obj.url || '', description: obj.description };
      });
    }
  } catch {
    // 非 JSON，按逗号分隔当图片
    return currentQuestion.value.mediaUrls.split(',').filter(Boolean).map((url) => ({
      type: 'image',
      url: url.trim(),
    }));
  }
  return [];
});

const canSubmit = computed(() => {
  if (!currentQuestion.value || showResult.value) return false;
  const t = normalizedType.value;
  if (t === 'fill') return fillBlanks.value.some((b) => b.trim().length > 0);
  if (t === 'short_answer') return shortAnswer.value.trim().length > 0;
  if (t === 'multiple') return selectedMultiple.value.size > 0;
  return selectedSingle.value !== null;
});

const isLastQuestion = computed(() => {
  const total = session.value?.totalCount || practiceConfig.value.questionCount;
  return currentIndex.value >= total - 1;
});

const progressPercent = computed(() => {
  const total = session.value?.totalCount || practiceConfig.value.questionCount;
  return total > 0 ? ((currentIndex.value + 1) / total) * 100 : 0;
});

const answeredCount = computed(() => answeredList.value.filter((a) => a.submitted).length);
const correctCount = computed(() => answeredList.value.filter((a) => a.isCorrect).length);
const totalPointsEarned = computed(() =>
  answeredList.value.reduce((sum, a) => sum + a.points, 0),
);
const accuracyPercent = computed(() => {
  if (answeredCount.value === 0) return 0;
  return Math.round((correctCount.value / answeredCount.value) * 100);
});

const correctAnswerDisplay = computed(() => {
  if (!revealedCorrectAnswer.value) return '';
  const q = currentQuestion.value;
  if (!q) return revealedCorrectAnswer.value;
  const t = normalizedType.value;
  if (t === 'fill') return revealedCorrectAnswer.value.split('|||').join('；');
  if (t === 'short_answer') return revealedCorrectAnswer.value;
  // 单选/多选/判断：将字母转为 "A. 选项文本"
  const opts = displayOptions.value;
  const letters = revealedCorrectAnswer.value.split(',').map((s) => s.trim());
  const parts = letters.map((letter) => {
    if (letter.length === 1 && /[A-Z]/i.test(letter)) {
      const idx = letter.toUpperCase().charCodeAt(0) - 65;
      if (idx >= 0 && idx < opts.length) return `${letter}. ${opts[idx]}`;
    }
    return letter;
  });
  return parts.join('；');
});

// ===== 方法 =====

function optionLabel(index: number): string {
  if (normalizedType.value === 'judge') return '';
  return String.fromCharCode(65 + index);
}

function optionClass(index: number): Record<string, boolean> {
  const t = normalizedType.value;
  const isSelected = t === 'multiple'
    ? selectedMultiple.value.has(index)
    : selectedSingle.value === index;
  const isCorrectOpt = showResult.value && isCorrectOption(index);
  const isWrongPick = showResult.value && isSelected && !isCorrectOption(index);
  return {
    selected: isSelected && !showResult.value,
    correct: isCorrectOpt,
    wrong: isWrongPick,
  };
}

function isCorrectOption(index: number): boolean {
  if (!showResult.value || !revealedCorrectAnswer.value) return false;
  const letter = String.fromCharCode(65 + index);
  return revealedCorrectAnswer.value.split(',').map((s) => s.trim().toUpperCase()).includes(letter);
}

function selectSingle(index: number) {
  if (showResult.value) return;
  selectedSingle.value = index;
}

function toggleMultiple(index: number) {
  if (showResult.value) return;
  const next = new Set(selectedMultiple.value);
  if (next.has(index)) next.delete(index);
  else next.add(index);
  selectedMultiple.value = next;
}

async function toggleMark() {
  isMarked.value = !isMarked.value;
}

async function toggleCollect() {
  if (!currentQuestion.value) return;
  try {
    const newCollected = !isCollected.value;
    await collectionApi.toggle({ questionId: currentQuestion.value.questionId });
    isCollected.value = newCollected;
    toast.success(newCollected ? '已收藏' : '已取消收藏');
  } catch (err) {
    const error = handleApiError(err);
    toast.error(error.message);
  }
}

/** 组装用户答案字符串 */
function buildUserAnswer(): string {
  const t = normalizedType.value;
  if (t === 'fill') return fillBlanks.value.map((b) => b.trim()).join('|||');
  if (t === 'short_answer') return shortAnswer.value.trim();
  if (t === 'multiple') {
    const letters = Array.from(selectedMultiple.value)
      .sort((a, b) => a - b)
      .map((i) => String.fromCharCode(65 + i));
    return letters.join(',');
  }
  // single / judge：提交选项文本
  if (selectedSingle.value !== null) {
    return displayOptions.value[selectedSingle.value];
  }
  return '';
}

async function startPractice() {
  if (!userStore.currentUser) return;
  try {
    isLoadingQuestion.value = true;
    const result = await practiceApi.start({
      questionCount: practiceConfig.value.questionCount,
      difficultyRange: practiceConfig.value.difficultyRange,
      source: 'DAILY',
    });
    session.value = result;
    answeredList.value = [];
    currentIndex.value = 0;
    phase.value = 'practice';
    await loadNextQuestion();
  } catch (err) {
    // 会话接口失败，回退到旧随机抽题模式
    console.warn('练习会话启动失败，回退到随机抽题:', err);
    await fallbackStart();
  } finally {
    isLoadingQuestion.value = false;
  }
}

/** 回退：使用 questionApi.getRandom 逐题抽取 */
async function fallbackStart() {
  phase.value = 'practice';
  session.value = {
    sessionId: 0,
    userId: userStore.currentUser?.id || 0,
    totalCount: practiceConfig.value.questionCount,
    answeredCount: 0,
    correctCount: 0,
    pointsEarned: 0,
    source: 'DAILY',
    status: 0,
  } as DailySession;
  answeredList.value = [];
  currentIndex.value = 0;
  await loadNextQuestion();
}

async function loadNextQuestion() {
  if (!userStore.currentUser) return;
  isLoadingQuestion.value = true;
  resetQuestionState();
  try {
    let question: Question;
    if (session.value?.sessionId) {
      question = await practiceApi.nextQuestion(session.value.sessionId);
    } else {
      const excludeIds = answeredList.value.map((a) => a.questionId);
      question = await questionApi.getRandom({
        grade: userStore.currentUser.grade,
        excludeQuestionIds: excludeIds,
        difficultyRange: practiceConfig.value.difficultyRange,
      });
    }
    currentQuestion.value = question;
    // 初始化填空空数
    if (normalizeType(question.type) === 'fill' && question.correctAnswer) {
      const blankCount = question.correctAnswer.split('|||').length;
      fillBlanks.value = new Array(blankCount).fill('');
    }
    // 启动倒计时
    if (question.timeLimit && question.timeLimit > 0) {
      startTimer(question.timeLimit);
    }
    // 检查收藏状态
    try {
      isCollected.value = await collectionApi.check(question.questionId);
    } catch {
      isCollected.value = false;
    }
  } catch (err) {
    console.error('加载题目失败:', err);
    toast.error('加载题目失败');
    currentQuestion.value = null;
  } finally {
    isLoadingQuestion.value = false;
  }
}

function resetQuestionState() {
  selectedSingle.value = null;
  selectedMultiple.value = new Set();
  fillBlanks.value = [];
  shortAnswer.value = '';
  isMarked.value = false;
  isCollected.value = false;
  showResult.value = false;
  isCorrect.value = false;
  lastEarnedPoints.value = 0;
  revealedCorrectAnswer.value = '';
  resultAnalysis.value = '';
  matchedKeywords.value = [];
  lastSubmitResult.value = null;
  stopTimer();
}

async function submitAnswer() {
  if (!currentQuestion.value || !canSubmit.value || !userStore.currentUser) return;
  isSubmitting.value = true;
  stopTimer();
  try {
    const q = currentQuestion.value;
    const userAnswer = buildUserAnswer();
    let result: AnswerSubmitResult;
    if (session.value?.sessionId) {
      result = await practiceApi.submit(session.value.sessionId, {
        questionId: q.questionId,
        userAnswer,
        answerTime: 0,
        marked: isMarked.value,
        collected: isCollected.value,
      });
    } else {
      result = await questionApi.submitAnswer({
        kidId: userStore.currentUser.id,
        questionId: q.questionId,
        userAnswer,
        marked: isMarked.value,
        collected: isCollected.value,
      });
    }

    const earned = result.getPoints ?? result.points ?? 0;
    lastEarnedPoints.value = earned;
    isCorrect.value = result.isCorrect;
    showResult.value = true;
    revealedCorrectAnswer.value = result.correctAnswer ?? '';
    resultAnalysis.value = result.analysis ?? '';
    matchedKeywords.value = result.matchedKeywords ?? [];
    lastSubmitResult.value = result;

    // 记录到已答列表
    const existingIdx = answeredList.value.findIndex((a) => a.questionId === q.questionId);
    const item: AnsweredItem = {
      questionId: q.questionId,
      question: q,
      userAnswer,
      isCorrect: result.isCorrect,
      points: earned,
      submitted: true,
      marked: isMarked.value,
      collected: isCollected.value,
    };
    if (existingIdx >= 0) {
      answeredList.value[existingIdx] = item;
    } else {
      answeredList.value.push(item);
    }

    // 更新游学币
    if (typeof result.currentPoints === 'number') {
      userStore.updateFatiguePoints(result.currentPoints);
    } else if (result.isCorrect && earned > 0) {
      userStore.updateFatiguePoints((userStore.currentUser?.fatiguePoints || 0) + earned);
    }
    if (earned > 0) todayEarnedPoints.value += earned;
  } catch (err) {
    const error = handleApiError(err);
    toast.error(error.message);
  } finally {
    isSubmitting.value = false;
  }
}

async function nextQuestion() {
  if (isLastQuestion.value) {
    await finishPractice();
  } else {
    currentIndex.value++;
    await loadNextQuestion();
  }
}

async function finishPractice() {
  if (session.value?.sessionId) {
    try {
      await practiceApi.finish(session.value.sessionId);
    } catch (err) {
      console.warn('结束会话失败:', err);
    }
  }
  showCompleteModal.value = true;
}

function jumpTo(idx: number) {
  if (idx === currentIndex.value) return;
  const item = answeredList.value[idx];
  if (!item) return;
  currentIndex.value = idx;
  // 回显已答题目
  currentQuestion.value = item.question;
  resetQuestionState();
  showResult.value = true;
  isCorrect.value = item.isCorrect;
  // 回显用户选择
  const t = normalizeType(item.question.type);
  if (t === 'single' || t === 'judge') {
    const opts = parseQuestionOptions(item.question.options);
    selectedSingle.value = opts.findIndex((o) => o === item.userAnswer);
  } else if (t === 'multiple') {
    const letters = item.userAnswer.split(',').map((s) => s.trim());
    const next = new Set<number>();
    letters.forEach((letter) => {
      if (letter.length === 1) {
        const idx = letter.toUpperCase().charCodeAt(0) - 65;
        if (idx >= 0) next.add(idx);
      }
    });
    selectedMultiple.value = next;
  } else if (t === 'fill') {
    fillBlanks.value = item.userAnswer.split('|||');
  } else if (t === 'short_answer') {
    shortAnswer.value = item.userAnswer;
  }
  revealedCorrectAnswer.value = item.question.correctAnswer || '';
}

function backToWelcome() {
  phase.value = 'welcome';
  session.value = null;
  currentQuestion.value = null;
  answeredList.value = [];
  resetQuestionState();
}

function exitPractice() {
  if (confirm('确定要退出练习吗？已答题目将不计入本次会话。')) {
    stopTimer();
    if (session.value?.sessionId) {
      practiceApi.abandon(session.value.sessionId).catch(() => undefined);
    }
    router.back();
  }
}

function goBack() {
  router.push('/');
}

async function refreshTodayPoints() {
  if (!userStore.currentUser?.id) return;
  try {
    todayEarnedPoints.value = await questionApi.getTodayAnswerPoints(userStore.currentUser.id);
  } catch {
    todayEarnedPoints.value = userStore.currentUser.dailyAnswerPoints ?? 0;
  }
}

// ===== 生命周期 =====
onMounted(async () => {
  if (!userStore.currentUser) {
    router.push('/login');
    return;
  }
  if (userStore.currentUser.id) {
    try {
      await parentStore.loadParentLimit(userStore.currentUser.id);
      await refreshTodayPoints();
    } catch (err) {
      console.error('加载管控规则失败:', err);
    }
  }
});

onUnmounted(() => {
  stopTimer();
});
</script>

<style scoped>
.answer-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.answer-header {
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

.answer-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #667eea;
}

.points-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #fef3c7;
  border-radius: 20px;
}

.points-label { font-size: 0.9rem; color: #92400e; }
.points-value { font-size: 1.2rem; font-weight: bold; color: #f59e0b; }

.answer-main {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

/* 欢迎界面 */
.welcome-screen {
  background: white;
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.welcome-screen h2 { font-size: 2rem; margin-bottom: 1rem; color: #667eea; }
.welcome-screen p { font-size: 1.2rem; color: #666; margin-bottom: 2rem; }

.stats-info {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.stat-item { display: flex; flex-direction: column; gap: 0.25rem; }
.stat-label { font-size: 0.9rem; color: #666; }
.stat-value { font-size: 1.5rem; font-weight: bold; color: #667eea; }

.practice-options {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  text-align: left;
}

.option-group { display: flex; flex-direction: column; gap: 0.5rem; }
.option-label { font-size: 1rem; font-weight: 600; color: #333; }

.count-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.count-btn {
  padding: 0.6rem 1.2rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.count-btn:hover { border-color: #667eea; }
.count-btn.active { border-color: #667eea; background: #eef2ff; color: #667eea; font-weight: 600; }

.start-btn {
  padding: 1rem 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.start-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
.start-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* 进度与导航 */
.progress-bar {
  background: white;
  border-radius: 16px;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  color: #333;
}

.timer { font-weight: 600; color: #667eea; }
.timer.urgent { color: #ef4444; animation: pulse 1s infinite; }

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

.progress-track {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s;
}

.question-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.nav-dot {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
}

.nav-dot.current { border-color: #667eea; background: #667eea; color: white; }
.nav-dot.correct { border-color: #10b981; background: #d1fae5; color: #059669; }
.nav-dot.wrong { border-color: #ef4444; background: #fee2e2; color: #dc2626; }
.nav-dot:disabled { opacity: 0.4; cursor: not-allowed; }

/* 题目卡片 */
.question-card {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.question-meta { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.meta-tag {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.type-tag { background: #eef2ff; color: #667eea; }
.difficulty-tag { background: #fef3c7; color: #92400e; }
.points-tag { background: #d1fae5; color: #059669; }

.question-actions-top { display: flex; gap: 0.5rem; }

.icon-btn {
  width: 36px;
  height: 36px;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s;
}

.icon-btn:hover:not(:disabled) { border-color: #f59e0b; }
.icon-btn.active { background: #fef3c7; border-color: #f59e0b; }
.icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.question-media { margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
.media-image { max-width: 100%; border-radius: 12px; }
.media-audio, .media-video { width: 100%; border-radius: 12px; }

.question-content { margin-bottom: 2rem; }
.question-text { font-size: 1.3rem; color: #333; line-height: 1.6; }

/* 选项 */
.question-options { display: grid; gap: 1rem; margin-bottom: 1.5rem; }

.option-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
}

.option-btn:hover:not(:disabled) { border-color: #667eea; background: #f0f9ff; }
.option-btn.selected { border-color: #667eea; background: #eef2ff; }
.option-btn.correct { border-color: #10b981; background: #d1fae5; }
.option-btn.wrong { border-color: #ef4444; background: #fee2e2; }
.option-btn:disabled { cursor: default; }

.option-label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  font-weight: bold;
  flex-shrink: 0;
}

.option-btn.correct .option-label { background: #10b981; }
.option-btn.wrong .option-label { background: #ef4444; }

.option-text { flex: 1; font-size: 1.1rem; color: #333; }
.check-icon { color: #10b981; font-weight: bold; font-size: 1.2rem; }

/* 填空 */
.fill-answer { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
.fill-blank { display: flex; flex-direction: column; gap: 0.4rem; }
.fill-label { font-size: 0.9rem; color: #666; font-weight: 600; }
.fill-input {
  width: 100%;
  padding: 0.85rem 1.1rem;
  font-size: 1.1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  box-sizing: border-box;
}
.fill-input:focus { outline: none; border-color: #667eea; }
.fill-input:disabled { background: #f9fafb; }

/* 简答 */
.short-answer { margin-bottom: 1.5rem; }
.short-input {
  width: 100%;
  padding: 1rem 1.1rem;
  font-size: 1.05rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  box-sizing: border-box;
  resize: vertical;
  font-family: inherit;
}
.short-input:focus { outline: none; border-color: #667eea; }
.short-input:disabled { background: #f9fafb; }

.keyword-hint {
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  background: #fef3c7;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #92400e;
}

/* 结果 */
.result-message { margin-bottom: 1.5rem; }

.result {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 500;
}

.result.correct { background: #d1fae5; color: #059669; }
.result.wrong { background: #fee2e2; color: #dc2626; }
.result-icon { font-size: 1.5rem; }

.result-analysis {
  margin-top: 0.75rem;
  padding: 0.85rem 1rem;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #4b5563;
  text-align: left;
  line-height: 1.6;
}

/* 操作按钮 */
.question-actions { display: flex; gap: 1rem; }

.action-btn {
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.submit-btn { background: #667eea; color: white; }
.submit-btn:hover:not(:disabled) { background: #5a67d8; }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.next-btn { background: #10b981; color: white; }
.next-btn:hover { background: #059669; }

.exit-btn { background: #e5e7eb; color: #666; }
.exit-btn:hover { background: #d1d5db; }

/* 响应式 */
@media (max-width: 768px) {
  .answer-header { flex-direction: column; gap: 1rem; text-align: center; }
  .stats-info { flex-direction: column; }
  .question-options { grid-template-columns: 1fr; }
  .question-actions { flex-direction: column; }
  .welcome-screen { padding: 2rem 1.5rem; }
  .question-card { padding: 1.5rem; }
}
</style>
