<template>
  <div class="answer-container">
    <header class="answer-header">
      <button @click="goBack" class="back-btn">← 返回</button>
      <h1>📝 答题中心</h1>
      <div class="points-display">
        <span class="points-label">疲劳点</span>
        <span class="points-value">{{ userStore.currentUser?.fatiguePoints || 0 }}</span>
      </div>
    </header>

    <!-- 全屏Loading遮罩 -->
    <GlobalLoading :loading="isSubmitting" message="提交中..." />

    <main class="answer-main">
      <div v-if="!currentQuestion" class="welcome-screen">
        <h2>🎉 欢迎来到答题中心</h2>
        <p>通过答题获得疲劳点，解锁更多游戏！</p>
        <div class="stats-info">
          <div class="stat-item">
            <span class="stat-label">每题获得</span>
            <span class="stat-value">+{{ parentStore.answerPointsPerQuestion }} 疲劳点</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">今日剩余</span>
            <span class="stat-value">{{ dailyAnswerLimit }} 次</span>
          </div>
        </div>
        <button @click="startQuiz" class="start-btn" :disabled="dailyAnswerLimit === 0">
          {{ dailyAnswerLimit === 0 ? '今日答题次数已用完' : '开始答题' }}
        </button>
      </div>

      <div v-else class="question-screen">
        <div class="question-card">
          <div class="question-header">
            <span class="question-number">题目 {{ currentQuestionIndex + 1 }}</span>
            <span class="question-points">+{{ parentStore.answerPointsPerQuestion }} 疲劳点</span>
          </div>
          <div class="question-content">
            <h3 class="question-text">{{ currentQuestion.content }}</h3>
          </div>
          <div class="question-options">
            <button
              v-for="(option, index) in parseOptions(currentQuestion.options)"
              :key="index"
              class="option-btn"
              :class="{
                selected: selectedOption === index,
                correct: showResult && isCorrect,
                wrong: showResult && !isCorrect && selectedOption === index,
              }"
              @click="selectOption(index)"
              :disabled="showResult"
            >
              <span class="option-label">{{ ['A', 'B', 'C', 'D'][index] }}</span>
              <span class="option-text">{{ option }}</span>
            </button>
          </div>
          <div v-if="showResult" class="result-message">
            <div v-if="isCorrect" class="result correct">
              <span class="result-icon">✅</span>
              <span class="result-text">回答正确！获得 {{ parentStore.answerPointsPerQuestion }} 疲劳点</span>
            </div>
            <div v-else class="result wrong">
              <span class="result-icon">❌</span>
              <span class="result-text">回答错误！正确答案是：{{ correctAnswerLetter }}</span>
            </div>
          </div>
          <div class="question-actions">
            <button
              v-if="!showResult"
              @click="submitAnswer"
              class="action-btn submit-btn"
              :disabled="selectedOption === null || isSubmitting"
            >
              {{ isSubmitting ? '提交中...' : '提交答案' }}
            </button>
            <button
              v-else
              @click="nextQuestion"
              class="action-btn next-btn"
            >
              {{ isLastQuestion ? '完成' : '下一题' }}
            </button>
            <button
              @click="exitQuiz"
              class="action-btn exit-btn"
            >
              退出
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- 完成弹窗 -->
    <KidUnifiedModalV2
      v-model:show="showCompleteModal"
      title="答题完成！"
      type="result"
      icon="🎉"
      :stats="[
        { label: '答题数量', value: `${quizResults.length} 题` },
        { label: '正确数量', value: `${correctCount} 题` },
        { label: '获得疲劳点', value: `+${totalPointsEarned}` }
      ]"
      :actions="[
        { text: '返回首页', variant: 'primary', onClick: goBack }
      ]"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/core/store/user.store';
import { useParentStore } from '@/core/store/parent.store';
import { questionApi } from '@/services/question-api.service';
import { handleApiError } from '@/utils/error-handler.util';
import { toast } from '@/services/toast.service';
import GlobalLoading from '@/components/GlobalLoading.vue';
import ErrorDisplay from '@/components/ErrorDisplay.vue';
import KidUnifiedModalV2 from '@/components/ui/KidUnifiedModalV2.vue';

const router = useRouter();
const userStore = useUserStore();
const parentStore = useParentStore();

// ===== 状态 =====

const currentQuestion = ref<any>(null);
const currentQuestionIndex = ref(0);
const selectedOption = ref<number | null>(null);
const showResult = ref(false);
const isCorrect = ref(false);
const isSubmitting = ref(false);
const showCompleteModal = ref(false);

const quizResults = ref<any[]>([]);
const dailyAnswerCount = ref(0);

// ===== 计算属性 =====

const dailyAnswerLimit = computed(() => {
  const limit = parentStore.dailyAnswerLimit;
  const remaining = limit - dailyAnswerCount.value;
  return Math.max(0, remaining);
});

const correctAnswerLetter = computed(() => {
  if (!currentQuestion.value) return '';
  const correctIndex = parseOptions(currentQuestion.value.options).findIndex(
    opt => opt === currentQuestion.value.correctAnswer
  );
  return ['A', 'B', 'C', 'D'][correctIndex] || '';
});

const isLastQuestion = computed(() => {
  return currentQuestionIndex.value >= 4; // 每次回答5题
});

const correctCount = computed(() => {
  return quizResults.value.filter(r => r.isCorrect).length;
});

const totalPointsEarned = computed(() => {
  return quizResults.value.reduce((sum, r) => sum + r.points, 0);
});

// ===== 方法 =====

function parseOptions(options: string): string[] {
  try {
    return JSON.parse(options);
  } catch {
    return options.split(',').map(o => o.trim());
  }
}

async function loadQuestion() {
  if (!userStore.currentUser) return;

  try {
    currentQuestion.value = await questionApi.getRandom(userStore.currentUser.grade);
    selectedOption.value = null;
    showResult.value = false;
  } catch (err) {
    console.error('加载题目失败:', err);
    toast.error('加载题目失败');
    exitQuiz();
  }
}

function selectOption(index: number) {
  if (showResult.value) return;
  selectedOption.value = index;
}

async function submitAnswer() {
  if (!currentQuestion.value || selectedOption.value === null) return;
  if (!userStore.currentUser) return;

  isSubmitting.value = true;

  try {
    const options = parseOptions(currentQuestion.value.options);
    const userAnswer = options[selectedOption.value];

    const result = await questionApi.submitAnswer(
      userStore.currentUser.id,
      currentQuestion.value.questionId,
      userAnswer
    );

    isCorrect.value = result.isCorrect;
    showResult.value = true;

    // 记录结果
    quizResults.value.push({
      questionId: currentQuestion.value.questionId,
      isCorrect: result.isCorrect,
      points: result.points,
    });

    // 更新疲劳点
    if (result.isCorrect && result.points > 0) {
      userStore.updateFatiguePoints((userStore.currentUser?.fatiguePoints || 0) + result.points);
    }
  } catch (err: any) {
    const error = handleApiError(err);
    toast.error(error.message);
  } finally {
    isSubmitting.value = false;
  }
}

async function nextQuestion() {
  if (isLastQuestion.value) {
    // 完成答题
    showCompleteModal.value = true;
  } else {
    // 下一题
    currentQuestionIndex.value++;
    await loadQuestion();
  }
}

function startQuiz() {
  currentQuestionIndex.value = 0;
  quizResults.value = [];
  dailyAnswerCount.value = 0;
  loadQuestion();
}

function exitQuiz() {
  if (confirm('确定要退出答题吗？')) {
    router.back();
  }
}

function goBack() {
  router.push('/');
}

// ===== 生命周期 =====

onMounted(async () => {
  if (!userStore.currentUser) {
    router.push('/login');
    return;
  }

  // 加载管控规则
  if (userStore.currentUser.id) {
    try {
      await parentStore.loadParentLimit(userStore.currentUser.id);
    } catch (err) {
      console.error('加载管控规则失败:', err);
    }
  }
});

onUnmounted(() => {
  // 清理
});
</script>

<style scoped>
.answer-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 头部 */
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

.points-label {
  font-size: 0.9rem;
  color: #92400e;
}

.points-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #f59e0b;
}

/* 主内容 */
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

.welcome-screen h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #667eea;
}

.welcome-screen p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 2rem;
}

.stats-info {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
}

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

.start-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.start-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

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
  align-items: center;
  margin-bottom: 1.5rem;
}

.question-number {
  font-size: 1.1rem;
  color: #666;
}

.question-points {
  padding: 0.5rem 1rem;
  background: #d1fae5;
  color: #059669;
  border-radius: 20px;
  font-weight: 600;
}

.question-content {
  margin-bottom: 2rem;
}

.question-text {
  font-size: 1.3rem;
  color: #333;
  line-height: 1.6;
}

.question-options {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

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

.option-btn:hover:not(:disabled) {
  border-color: #667eea;
  background: #f0f9ff;
}

.option-btn.selected {
  border-color: #667eea;
  background: #eef2ff;
}

.option-btn.correct {
  border-color: #10b981;
  background: #d1fae5;
}

.option-btn.wrong {
  border-color: #ef4444;
  background: #fee2e2;
}

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
}

.option-text {
  flex: 1;
  font-size: 1.1rem;
  color: #333;
}

.result-message {
  margin-bottom: 1.5rem;
}

.result {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 500;
}

.result.correct {
  background: #d1fae5;
  color: #059669;
}

.result.wrong {
  background: #fee2e2;
  color: #dc2626;
}

.result-icon {
  font-size: 1.5rem;
}

.question-actions {
  display: flex;
  gap: 1rem;
}

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

.submit-btn {
  background: #667eea;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background: #5a67d8;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.next-btn {
  background: #10b981;
  color: white;
}

.next-btn:hover {
  background: #059669;
}

.exit-btn {
  background: #e5e7eb;
  color: #666;
}

.exit-btn:hover {
  background: #d1d5db;
}

/* 完成弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  min-width: 300px;
  max-width: 90%;
  text-align: center;
}

.complete-modal {
  padding: 3rem;
}

.complete-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.complete-modal h2 {
  margin: 0 0 2rem 0;
  color: #667eea;
}

.complete-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 2rem;
}

.complete-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
}

/* 响应式 */
@media (max-width: 768px) {
  .answer-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .stats-info {
    flex-direction: column;
  }

  .question-options {
    grid-template-columns: 1fr;
  }

  .question-actions {
    flex-direction: column;
  }
}
</style>
