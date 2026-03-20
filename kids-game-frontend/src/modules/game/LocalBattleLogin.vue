<template>
  <div class="login-container">
    <!-- 头部 -->
    <header class="login-header">
      <button @click="goBack" class="back-btn">← 返回</button>
      <div class="game-title">本地对战登录</div>
      <div class="spacer"></div>
    </header>

    <!-- 主内容 -->
    <main class="login-content">
      <!-- 玩家信息展示 -->
      <div class="players-info">
        <div class="player-card player1">
          <div class="player-avatar">{{ player1Avatar }}</div>
          <div class="player-name">{{ player1Name }}</div>
          <div class="player-status">{{ player1Status }}</div>
        </div>
        <div class="vs-badge">VS</div>
        <div class="player-card player2" :class="{ waiting: !player2LoggedIn, ready: player2LoggedIn }">
          <div class="player-avatar">{{ player2Avatar }}</div>
          <div class="player-name">{{ player2Name }}</div>
          <div class="player-status">{{ player2Status }}</div>
        </div>
      </div>

      <!-- 登录表单 -->
      <div v-if="!bothLoggedIn" class="login-form">
        <h2 class="form-title">{{ currentPlayerLoginTitle }}</h2>

        <div class="form-group">
          <label>用户名</label>
          <input
            v-model="formData.username"
            type="text"
            placeholder="请输入用户名"
            @keyup.enter="handleLogin"
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label>密码</label>
          <input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            @keyup.enter="handleLogin"
            :disabled="isLoading"
          />
        </div>

        <button
          @click="handleLogin"
          class="login-btn"
          :disabled="isLoading || !canSubmit"
        >
          <span v-if="!isLoading">{{ loginButtonText }}</span>
          <span v-else>登录中...</span>
        </button>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>

      <!-- 已登录状态 -->
      <div v-else class="ready-state">
        <div class="countdown-container">
          <div class="countdown-text">游戏将在 {{ countdown }} 秒后开始</div>
          <div class="countdown-bar">
            <div class="countdown-fill" :style="{ width: countdownProgress + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- 提示信息 -->
      <div class="tips">
        <div class="tip-item">
          <span class="tip-icon">👥</span>
          <span class="tip-text">玩家 1 默认使用当前登录用户，玩家 2 需要另一个账号</span>
        </div>
        <div class="tip-item">
          <span class="tip-icon">🎮</span>
          <span class="tip-text">玩家 1 使用屏幕左侧区域（WASD 键）</span>
        </div>
        <div class="tip-item">
          <span class="tip-icon">🎮</span>
          <span class="tip-text">玩家 2 使用屏幕右侧区域（方向键）</span>
        </div>
        <div class="tip-item">
          <span class="tip-icon">⚡</span>
          <span class="tip-text">各自独立答题，根据分数和生命值判断胜负</span>
        </div>
      </div>
    </main>

    <!-- Loading -->
    <GlobalLoading :loading="isLoading" message="登录中..." />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/core/store/user.store';
import { kidApi } from '@/services'; // ⭐ 添加统一 API 服务
import GlobalLoading from '@/components/GlobalLoading.vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// ===== 状态 =====

const isLoading = ref(false);
const errorMessage = ref('');
const countdown = ref(5);
const countdownProgress = ref(100);
let countdownTimer: number | null = null;

// 当前登录的玩家（1 或 2）
const currentPlayer = ref(1);

// 玩家登录状态
const player1LoggedIn = ref(false);
const player2LoggedIn = ref(false);

// 表单数据
const formData = ref({
  username: '',
  password: '',
});

// 玩家1信息
const player1Name = ref('玩家1');
const player1Avatar = ref('P');

// 玩家2信息
const player2Name = ref('玩家2');
const player2Avatar = ref('?');

// ===== 计算属性 =====

const gameType = computed(() => route.params.type as string);

const bothLoggedIn = computed(() => player1LoggedIn.value && player2LoggedIn.value);

const canSubmit = computed(() => {
  return formData.value.username.trim() !== '' && formData.value.password.trim() !== '';
});

const currentPlayerLoginTitle = computed(() => {
  return currentPlayer.value === 1 ? '玩家1 登录' : '玩家2 登录';
});

const loginButtonText = computed(() => {
  return player1LoggedIn.value ? '玩家2 登录' : '登录';
});

const player1Status = computed(() => {
  return player1LoggedIn.value ? '已登录' : '未登录';
});

const player2Status = computed(() => {
  return player2LoggedIn.value ? '已登录' : '未登录';
});

// ===== 方法 =====

function goBack() {
  router.push(`/game/${gameType.value}`);
}

async function handleLogin() {
  if (!canSubmit.value) return;

  errorMessage.value = '';
  isLoading.value = true;

  console.log('[LocalBattleLogin] 开始登录，当前玩家:', currentPlayer.value);
  console.log('[LocalBattleLogin] player1LoggedIn:', player1LoggedIn.value);
  console.log('[LocalBattleLogin] player2LoggedIn:', player2LoggedIn.value);

  try {
    // ⭐ 使用统一 API 服务
    const result = await kidApi.login(formData.value.username, formData.value.password);
      
    console.log('[LocalBattleLogin] 登录成功，数据:', result);
      
    const playerInfo = {
      id: (result as any).id,
      username: result.username,
      nickname: result.nickname || result.username,
      token: (result as any).token,
      userType: (result as any).userType || 'KID', // 账户类型
    };

    if (currentPlayer.value === 1) {
      // 保存玩家1信息到 sessionStorage
      console.log('[LocalBattleLogin] 保存玩家1信息');
      sessionStorage.setItem('player1Info', JSON.stringify(playerInfo));
      player1Name.value = playerInfo.nickname || playerInfo.username;
      player1Avatar.value = (playerInfo.nickname || playerInfo.username).charAt(0).toUpperCase();
      player1LoggedIn.value = true;

      console.log('[LocalBattleLogin] 玩家1登录完成，player1LoggedIn =', player1LoggedIn.value);

      // 切换到玩家2登录
      currentPlayer.value = 2;
    } else {
      // 保存玩家2信息到 sessionStorage
      console.log('[LocalBattleLogin] 保存玩家2信息');
      sessionStorage.setItem('player2Info', JSON.stringify(playerInfo));
      player2Name.value = playerInfo.nickname || playerInfo.username;
      player2Avatar.value = (playerInfo.nickname || playerInfo.username).charAt(0).toUpperCase();
      player2LoggedIn.value = true;

      console.log('[LocalBattleLogin] 玩家2登录完成，player2LoggedIn =', player2LoggedIn.value);
      console.log('[LocalBattleLogin] bothLoggedIn =', player1LoggedIn.value && player2LoggedIn.value);

      // 两个玩家都登录完成，开始倒计时
      console.log('[LocalBattleLogin] 开始倒计时');
      startCountdown();
    }

    // 清空表单
    formData.value.username = '';
    formData.value.password = '';
  } catch (err: any) {
    console.error('[LocalBattleLogin] 登录失败:', err);
    errorMessage.value = err.message || '登录失败，请重试';
  } finally {
    isLoading.value = false;
  }
}

function startCountdown() {
  console.log('[LocalBattleLogin] startCountdown 被调用');
  countdown.value = 5;
  countdownProgress.value = 100;

  console.log('[LocalBattleLogin] 倒计时开始，初始值:', countdown.value);

  countdownTimer = window.setInterval(() => {
    countdown.value--;
    countdownProgress.value = (countdown.value / 5) * 100;

    console.log('[LocalBattleLogin] 倒计时:', countdown.value);

    if (countdown.value <= 0) {
      console.log('[LocalBattleLogin] 倒计时结束，开始游戏');
      clearInterval(countdownTimer!);
      startBattle();
    }
  }, 1000);
}

function startBattle() {
  // 跳转到游戏页面，带上对战模式参数
  router.push({
    path: `/game/${gameType.value}/play`,
    query: { mode: 'local' },
  });
}

// ===== 生命周期 =====

onMounted(() => {
  console.log('[LocalBattleLogin] 页面加载');

  // 清理旧的 session 数据（只清理 sessionStorage）
  sessionStorage.removeItem('player1Info');
  sessionStorage.removeItem('player2Info');

  // 重置玩家2的状态
  player2Name.value = '玩家2';
  player2Avatar.value = '?';
  player2LoggedIn.value = false;

  // 检查当前是否已登录（任意用户类型）
  const userInfo = localStorage.getItem('userInfo');
  const parentInfo = localStorage.getItem('parentInfo');
  console.log('[LocalBattleLogin] localStorage userInfo:', userInfo);
  console.log('[LocalBattleLogin] localStorage parentInfo:', parentInfo);

  // 优先使用当前登录的用户作为玩家 1
  const currentUserInfo = parentInfo || userInfo;

  if (currentUserInfo) {
    try {
      const user = JSON.parse(currentUserInfo);
      console.log('[LocalBattleLogin] 检测到当前登录用户:', user);
      console.log('[LocalBattleLogin] user 字段:', Object.keys(user));
    
      // 使用当前登录用户作为玩家 1
      // 统一使用 nickname（如果有），否则使用 username
      const displayName = user.nickname || user.username || '玩家 1';
      console.log('[LocalBattleLogin] 玩家 1 显示名称:', displayName);
    
      player1Name.value = displayName;
      player1Avatar.value = displayName.charAt(0).toUpperCase();
      player1LoggedIn.value = true;
    
      // 保存到 sessionStorage（保持数据结构一致）
      sessionStorage.setItem('player1Info', JSON.stringify({
        id: user.id,
        username: user.username,
        nickname: user.nickname || user.username,
        phone: user.phone,
        token: user.token,
        userType: user.userType,
      }));

      // 切换到玩家2登录
      currentPlayer.value = 2;
      console.log('[LocalBattleLogin] 玩家1使用当前登录账号，等待玩家2登录');
      console.log('[LocalBattleLogin] player1LoggedIn =', player1LoggedIn.value);
      console.log('[LocalBattleLogin] player1Name =', player1Name.value);
    } catch (err) {
      console.error('[LocalBattleLogin] 解析用户信息失败:', err);
      // 解析失败，重置玩家1状态
      player1Name.value = '玩家1';
      player1Avatar.value = 'P';
      player1LoggedIn.value = false;
      currentPlayer.value = 1;
    }
  } else {
    // 未登录，重置玩家1状态
    console.log('[LocalBattleLogin] 当前未登录，需要玩家1登录');
    player1Name.value = '玩家1';
    player1Avatar.value = 'P';
    player1LoggedIn.value = false;
    currentPlayer.value = 1;
  }

  console.log('[LocalBattleLogin] 初始化完成');
  console.log('[LocalBattleLogin] player1LoggedIn:', player1LoggedIn.value);
  console.log('[LocalBattleLogin] player2LoggedIn:', player2LoggedIn.value);
  console.log('[LocalBattleLogin] currentPlayer:', currentPlayer.value);
});

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
});
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  min-height: 100dvh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

/* 头部 */
.login-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.back-btn {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.game-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: #667eea;
  text-align: center;
  flex: 1;
}

.spacer {
  width: 80px;
}

/* 主内容 */
.login-content {
  flex: 1;
  padding: 2rem 1.5rem;
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
}

/* 玩家信息展示 */
.players-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.player-card {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  flex: 1;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.player-card.player1 {
  border: 3px solid #ff6b9d;
  background: linear-gradient(135deg, #fff5f8 0%, #fff 100%);
}

.player-card.player2 {
  border: 3px solid #4ecdc4;
  background: linear-gradient(135deg, #f0fffe 0%, #fff 100%);
}

.player-card.player2.waiting {
  opacity: 0.6;
  border-color: #ccc;
}

.player-card.player2.ready {
  opacity: 1;
  border-color: #4ecdc4;
}

.player-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
  margin: 0 auto 1rem;
}

.player-card.player1 .player-avatar {
  background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
}

.player-card.player2 .player-avatar {
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
}

.player-name {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.5rem;
}

.player-status {
  font-size: 0.9rem;
  color: #666;
}

.vs-badge {
  font-size: 2rem;
  font-weight: bold;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

/* 登录表单 */
.login-form {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-title {
  font-size: 1.5rem;
  color: #667eea;
  margin: 0 0 2rem 0;
  text-align: center;
  font-weight: bold;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.875rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.login-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.9rem;
  text-align: center;
}

/* 准备状态 */
.ready-state {
  animation: slideUp 0.5s ease-out;
}

.countdown-container {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  margin-top: 1rem;
}

.countdown-text {
  font-size: 1.5rem;
  color: #667eea;
  text-align: center;
  margin-bottom: 1rem;
  font-weight: bold;
}

.countdown-bar {
  width: 100%;
  height: 10px;
  background: #e5e7eb;
  border-radius: 5px;
  overflow: hidden;
}

.countdown-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 5px;
  transition: width 1s linear;
}

/* 提示信息 */
.tips {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 1.5rem;
  margin-top: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e0e0e0;
}

.tip-item:last-child {
  border-bottom: none;
}

.tip-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.tip-text {
  font-size: 0.95rem;
  color: #666;
}

/* 响应式 */
@media (max-width: 768px) {
  .login-header {
    padding: 0.75rem 1rem;
  }

  .back-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }

  .game-title {
    font-size: 1rem;
  }

  .spacer {
    width: 60px;
  }

  .login-content {
    padding: 1.5rem 1rem;
  }

  .players-info {
    flex-direction: column;
    gap: 1rem;
  }

  .player-card {
    width: 100%;
  }

  .vs-badge {
    transform: rotate(90deg);
  }
}

@media (max-width: 480px) {
  .login-header {
    padding: 0.5rem 0.75rem;
  }

  .game-title {
    font-size: 0.9rem;
  }

  .player-card {
    padding: 1.5rem;
  }

  .player-avatar {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }

  .player-name {
    font-size: 1rem;
  }
}
</style>
