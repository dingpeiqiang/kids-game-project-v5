<template>
  <div class="pattern-unlock-container">
    <div class="pattern-unlock-content">
      <!-- 顶部标题区域 -->
      <div class="header">
        <h1 class="title">🔐 图案解锁</h1>
        <p class="subtitle">{{ currentUserType === 'parent' ? '家长账号' : '孩子账号' }}</p>
      </div>

      <!-- 用户信息展示 -->
      <div v-if="currentUser" class="user-info">
        <div class="avatar-wrapper">
          <span class="avatar">{{ currentUserType === 'parent' ? '👨‍👩‍👧' : currentUser.avatar || '👶' }}</span>
        </div>
        <div class="user-details">
          <p class="user-name">{{ currentUser.nickname || currentUser.username }}</p>
          <p class="user-type">{{ currentUserType === 'parent' ? '家长' : '儿童' }}</p>
        </div>
      </div>

      <!-- 错误提示 -->
      <ErrorDisplay 
        v-if="errorMessage" 
        :message="errorMessage" 
        @close="errorMessage = ''" 
        type="error"
      />

      <!-- 图案解锁组件 -->
      <div class="pattern-wrapper">
        <PatternLock
          :title="patternTitle"
          :subtitle="patternSubtitle"
          :is-error="hasError"
          @complete="handlePatternComplete"
          @error="handlePatternError"
        />
      </div>

      <!-- 切换账号按钮 -->
      <div class="switch-account">
        <button 
          class="switch-btn" 
          @click="switchUserType"
          :disabled="isLoading"
        >
          切换到{{ currentUserType === 'parent' ? '孩子' : '家长' }}账号
        </button>
      </div>

      <!-- 登录选项 -->
      <div class="login-options">
        <button class="login-option-btn" @click="goToLogin">
          🔑 使用密码登录
        </button>
      </div>

      <!-- 失败次数提示 -->
      <div v-if="failedAttempts > 0" class="attempts-info">
        <span class="attempts-label">剩余尝试次数：</span>
        <span class="attempts-count">{{ maxAttempts - failedAttempts }} / {{ maxAttempts }}</span>
      </div>

      <!-- 锁定提示 -->
      <div v-if="isLocked" class="locked-message">
        <span class="locked-icon">🔒</span>
        <span class="locked-text">账号已锁定，请稍后再试</span>
        <span class="locked-time">剩余 {{ lockTimeRemaining }} 秒</span>
      </div>

      <!-- 全屏Loading遮罩 -->
      <GlobalLoading :loading="isLoading" message="验证中..." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/core/store/user.store';
import { getDefaultAdminLanding } from '@kids-game/shared';

const APP_SHELL = import.meta.env.VITE_APP_SHELL || 'legacy';
const isPlayShell = APP_SHELL === 'simple';
const isAdminShell = APP_SHELL === 'admin';
import PatternLock from '@/components/PatternLock.vue';
import ErrorDisplay from '@/components/ErrorDisplay.vue';
import GlobalLoading from '@/components/GlobalLoading.vue';

const router = useRouter();
const userStore = useUserStore();

// ===== 状态 =====

const isLoading = ref(false);
const errorMessage = ref('');
const hasError = ref(false);
const failedAttempts = ref(0);
const maxAttempts = 5;
const isLocked = ref(false);
const lockTimeRemaining = ref(0);
let lockTimer: ReturnType<typeof setInterval> | null = null;

// 当前用户类型
const currentUserType = ref<'parent' | 'kid'>('parent');

// ===== 计算属性 =====

const currentUser = computed(() => {
  return currentUserType.value === 'parent' 
    ? userStore.parentUser 
    : userStore.currentUser;
});

const patternTitle = computed(() => {
  if (isLocked.value) return '账号已锁定';
  return currentUserType.value === 'parent' ? '家长图案解锁' : '孩子图案解锁';
});

const patternSubtitle = computed(() => {
  if (isLocked.value) return '请稍后再试';
  return '请绘制解锁图案';
});

// ===== 方法 =====

// 处理图案绘制完成
async function handlePatternComplete(pattern: string) {
  if (isLocked.value || isLoading.value) return;

  hasError.value = false;
  isLoading.value = true;

  try {
    let isValid = false;
    
    if (currentUserType.value === 'parent') {
      isValid = await userStore.validateParentPattern(pattern);
    } else {
      isValid = await userStore.validateKidPattern(pattern);
    }

    if (isValid) {
      // 验证成功
      handleSuccess();
    } else {
      // 验证失败
      handleFailure();
    }
  } catch (err: any) {
    console.error('图案验证失败:', err);
    errorMessage.value = '验证失败，请重试';
    hasError.value = true;
  } finally {
    isLoading.value = false;
  }
}

function landingAfterUnlock(type: 'parent' | 'kid') {
  if (type === 'kid') {
    if (isAdminShell) {
      window.location.href = import.meta.env.VITE_PLAY_URL || 'http://localhost:3001';
      return;
    }
    router.push('/');
    return;
  }
  if (isPlayShell) {
    window.location.href = `${(import.meta.env.VITE_ADMIN_URL || 'http://localhost:3000').replace(/\/$/, '')}${getDefaultAdminLanding('parent')}`;
    return;
  }
  router.push(getDefaultAdminLanding('parent'));
}

// 处理验证成功
function handleSuccess() {
  userStore.confirmPatternVerified();
  userStore.switchUserType(currentUserType.value);
  landingAfterUnlock(currentUserType.value);
}

// 处理验证失败
function handleFailure() {
  failedAttempts.value++;
  hasError.value = true;
  
  if (failedAttempts.value >= maxAttempts) {
    lockAccount();
  } else {
    errorMessage.value = `图案不正确，剩余 ${maxAttempts - failedAttempts.value} 次尝试机会`;
  }
}

// 锁定账号
function lockAccount() {
  isLocked.value = true;
  lockTimeRemaining.value = 60; // 锁定60秒
  
  if (lockTimer) {
    clearInterval(lockTimer);
  }
  
  lockTimer = setInterval(() => {
    lockTimeRemaining.value--;
    if (lockTimeRemaining.value <= 0) {
      unlockAccount();
    }
  }, 1000);
}

// 解锁账号
function unlockAccount() {
  isLocked.value = false;
  failedAttempts.value = 0;
  hasError.value = false;
  errorMessage.value = '';
  
  if (lockTimer) {
    clearInterval(lockTimer);
    lockTimer = null;
  }
}

// 处理图案错误
function handlePatternError(message: string) {
  errorMessage.value = message;
  hasError.value = true;
}

// 切换用户类型
function switchUserType() {
  const targetType = currentUserType.value === 'parent' ? 'kid' : 'parent';
  
  // 检查目标用户是否存在
  if (targetType === 'parent' && !userStore.parentUser) {
    errorMessage.value = '家长账号未登录';
    return;
  }
  
  if (targetType === 'kid' && !userStore.currentUser) {
    errorMessage.value = '孩子账号未登录';
    return;
  }
  
  // 检查目标用户是否设置了图案解锁
  const hasPattern = targetType === 'parent' 
    ? userStore.parentHasPatternLock()
    : userStore.kidHasPatternLock();
  
  if (!hasPattern) {
    errorMessage.value = `${targetType === 'parent' ? '家长' : '孩子'}账号未设置图案解锁`;
    return;
  }
  
  // 切换用户类型并重置状态
  currentUserType.value = targetType;
  failedAttempts.value = 0;
  hasError.value = false;
  errorMessage.value = '';
}

// 跳转到密码登录页面
function goToLogin() {
  router.push('/login');
}

// ===== 生命周期 =====

onMounted(() => {
  // 检查是否有已登录的家长用户
  if (!userStore.parentUser) {
    // 如果没有家长用户，跳转到登录页面
    router.push('/login');
    return;
  }
  
  // 检查家长是否设置了图案解锁
  if (!userStore.parentHasPatternLock()) {
    // 如果没设置图案解锁，跳转到登录页面
    router.push('/login');
    return;
  }
  
  // 默认显示家长账号的图案解锁
  currentUserType.value = 'parent';
});

onUnmounted(() => {
  if (lockTimer) {
    clearInterval(lockTimer);
  }
});
</script>

<style scoped>
.pattern-unlock-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

.pattern-unlock-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  50% {
    transform: translate(-25%, -25%) rotate(180deg);
  }
}

.pattern-unlock-content {
  background: white;
  border-radius: 24px;
  padding: 3rem;
  max-width: 420px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 头部标题 */
.header {
  margin-bottom: 1.5rem;
}

.title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  font-size: 1rem;
  color: #666;
  margin: 0;
}

/* 用户信息 */
.user-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
}

.avatar-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar {
  font-size: 2.5rem;
}

.user-details {
  text-align: left;
}

.user-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.25rem 0;
}

.user-type {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}

/* 图案解锁包装器 */
.pattern-wrapper {
  margin-bottom: 1.5rem;
}

/* 切换账号按钮 */
.switch-account {
  margin-bottom: 1rem;
}

.switch-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.switch-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.switch-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 登录选项 */
.login-options {
  margin-bottom: 1rem;
}

.login-option-btn {
  padding: 0.75rem 1.5rem;
  background: transparent;
  color: #666;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s;
}

.login-option-btn:hover {
  background: #f3f4f6;
}

/* 尝试次数提示 */
.attempts-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #ef4444;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.attempts-label {
  font-weight: 500;
}

.attempts-count {
  font-weight: 700;
}

/* 锁定提示 */
.locked-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-radius: 16px;
  margin-bottom: 1rem;
}

.locked-icon {
  font-size: 2rem;
}

.locked-text {
  font-size: 1rem;
  font-weight: 600;
  color: #dc2626;
}

.locked-time {
  font-size: 0.9rem;
  color: #ef4444;
}

/* 响应式 */
@media (max-width: 480px) {
  .pattern-unlock-content {
    padding: 2rem;
  }
  
  .title {
    font-size: 1.5rem;
  }
  
  .user-info {
    padding: 0.75rem;
  }
  
  .avatar-wrapper {
    width: 56px;
    height: 56px;
  }
  
  .avatar {
    font-size: 2rem;
  }
}
</style>