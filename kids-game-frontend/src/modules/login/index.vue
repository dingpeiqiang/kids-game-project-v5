<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <!-- 游戏手柄 -->
      <div class="gamepad gamepad-1">🎮</div>
      <div class="gamepad gamepad-2">🎮</div>
      <div class="gamepad gamepad-3">🎮</div>
      <!-- 星星组合 -->
      <div class="star-group star-group-1">
        <span class="star small">✨</span>
        <span class="star medium">⭐</span>
        <span class="star small">✨</span>
      </div>
      <div class="star-group star-group-2">
        <span class="star small">⭐</span>
        <span class="star large">🌟</span>
        <span class="star small">⭐</span>
      </div>
      <div class="star-group star-group-3">
        <span class="star medium">✨</span>
        <span class="star small">⭐</span>
      </div>
      <div class="star-group star-group-4">
        <span class="star large">🌟</span>
        <span class="star small">✨</span>
        <span class="star medium">⭐</span>
      </div>
    </div>

    <div class="login-wrapper">
      <!-- 左侧插画 -->
      <div class="illustration-section">
        <div class="illustration-content">
          <div class="logo-display">
            <div class="logo-icon-wrapper">
              <!-- 主游戏手柄 -->
              <span class="logo-gamepad">🎮</span>
              <!-- 主星星 -->
              <span class="logo-star">⭐</span>
              <!-- 装饰星星 1 -->
              <span class="logo-star-deco star-deco-1">✨</span>
              <!-- 装饰星星 2 -->
              <span class="logo-star-deco star-deco-2">🌟</span>
              <!-- 装饰星星 3 -->
              <span class="logo-star-deco star-deco-3">✨</span>
              <!-- 装饰星星 4 -->
              <span class="logo-star-deco star-deco-4">⭐</span>
            </div>
            <h1 class="brand-name">星光游学</h1>
            <span class="brand-name-en">StarPlay</span>
          </div>
          <p class="illustration-desc">
            在游戏中学习，在挑战中成长
          </p>
          <div class="feature-list">
            <div class="feature-item feature-1">
              <span class="feature-icon">🎮</span>
              <span>百款小游戏</span>
            </div>
            <div class="feature-item feature-2">
              <span class="feature-icon">🧠</span>
              <span>脑力大挑战</span>
            </div>
            <div class="feature-item feature-3">
              <span class="feature-icon">🏅</span>
              <span>成就解锁</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="login-form-section">
        <div class="login-card">
          <div class="card-header">
            <div class="brand-logo">
              <span class="brand-gamepad">🎮</span>
              <span>星光游学</span>
              <span class="brand-star">⭐</span>
            </div>
            <h1 class="welcome-title">欢迎回来，玩家!</h1>
            <p class="welcome-subtitle">登录继续你的冒险之旅</p>
          </div>

          <!-- 错误提示 -->
          <ErrorDisplay v-if="errorMessage" :message="errorMessage" @close="errorMessage = ''" />

          <!-- 全屏Loading遮罩 -->
          <GlobalLoading :loading="isLoading" message="登录中..." />

          <!-- 统一登录表单 -->
          <form @submit.prevent="handleLogin" class="login-form">
            <div class="form-group">
              <label for="username">
                <span class="label-icon">🎯</span>
                玩家账号
              </label>
              <input
                id="username"
                v-model="formData.username"
                type="text"
                placeholder="输入你的游戏账号"
                :disabled="isLoading"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="password">
                <span class="label-icon">🔐</span>
                冒险密码
              </label>
              <input
                id="password"
                v-model="formData.password"
                type="password"
                placeholder="输入密码开始冒险"
                :disabled="isLoading"
                class="form-input"
              />
            </div>

            <button type="submit" class="submit-btn" :disabled="isLoading || !formData.username || !formData.password">
              <span class="btn-icon">🎮</span>
              <span v-if="!isLoading">开始游戏</span>
              <span v-else>正在登录...</span>
            </button>
          </form>

          <div class="divider">
            <span class="divider-text">还没有账号?</span>
          </div>
          
          <div class="register-section">
            <p class="register-text">
              <span class="register-icon">⭐</span>
              <a @click="goToRegister" class="register-link">创建新角色，开启冒险之旅</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/core/store/user.store';
import GlobalLoading from '@/components/GlobalLoading.vue';
import ErrorDisplay from '@/components/ErrorDisplay.vue';
import { toast } from '@/services/toast.service';

const router = useRouter();
const userStore = useUserStore();

// ===== 状态 =====

const isLoading = ref(false);
const errorMessage = ref('');
const formData = ref({
  username: '',
  password: '',
});

// ===== 方法 =====

async function handleLogin() {
  errorMessage.value = '';

  if (!formData.value.username) {
    toast.warning('请输入用户名或手机号');
    return;
  }

  if (!formData.value.password) {
    toast.warning('请输入密码');
    return;
  }

  try {
    isLoading.value = true;
    console.log('开始登录...', formData.value.username);

    // 调用统一登录接口
    const result = await userStore.unifiedLogin(formData.value.username, formData.value.password);
    console.log('登录成功:', result);

    // 根据用户类型跳转
    if (result.userType === 0) {
      // 儿童
      toast.success('登录成功！开始游戏吧~');
      await router.push('/');
    } else if (result.userType === 1) {
      // 家长
      toast.success('家长登录成功！');
      await router.push('/parent');
    } else if (result.userType === 2) {
      // 管理员
      toast.success('管理员登录成功！');
      await router.push('/admin');
    } else {
      toast.error('未知用户类型');
    }
  } catch (err: any) {
    console.error('登录失败:', err);
    const errorMsg = err.response?.data?.message || err.message || '登录失败，请检查用户名和密码';
    errorMessage.value = errorMsg;
    toast.error(errorMsg);
  } finally {
    isLoading.value = false;
  }
}

function goToRegister() {
  router.push('/register');
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 - 游戏手柄 + 星星组合 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

/* 游戏手柄 */
.gamepad {
  position: absolute;
  font-size: 3rem;
  opacity: 0.4;
  animation: floatGamepad 6s ease-in-out infinite;
}

.gamepad-1 {
  top: 15%;
  left: 8%;
  animation-delay: 0s;
  font-size: 4rem;
}

.gamepad-2 {
  bottom: 20%;
  right: 10%;
  animation-delay: 2s;
  font-size: 3.5rem;
}

.gamepad-3 {
  top: 50%;
  right: 25%;
  animation-delay: 4s;
  font-size: 2.5rem;
}

@keyframes floatGamepad {
  0%, 100% {
    opacity: 0.4;
    transform: translateY(0) rotate(-5deg);
  }
  50% {
    opacity: 0.6;
    transform: translateY(-20px) rotate(5deg);
  }
}

/* 星星组合 */
.star-group {
  position: absolute;
  display: flex;
  gap: 0.5rem;
  opacity: 0.7;
  animation: twinkleGroup 4s ease-in-out infinite;
}

.star-group-1 {
  top: 10%;
  right: 15%;
  animation-delay: 0s;
}

.star-group-2 {
  bottom: 25%;
  left: 12%;
  animation-delay: 1s;
}

.star-group-3 {
  top: 65%;
  left: 5%;
  animation-delay: 2s;
}

.star-group-4 {
  bottom: 10%;
  right: 5%;
  animation-delay: 3s;
}

@keyframes twinkleGroup {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.star {
  display: inline-block;
}

.star.small {
  font-size: 1.5rem;
  animation: twinkle 2s ease-in-out infinite;
}

.star.medium {
  font-size: 2rem;
  animation: twinkle 2.5s ease-in-out infinite;
}

.star.large {
  font-size: 2.5rem;
  animation: twinkle 3s ease-in-out infinite;
}

.star-group-1 .star:nth-child(1) { animation-delay: 0s; }
.star-group-1 .star:nth-child(2) { animation-delay: 0.3s; }
.star-group-1 .star:nth-child(3) { animation-delay: 0.6s; }

.star-group-2 .star:nth-child(1) { animation-delay: 0.2s; }
.star-group-2 .star:nth-child(2) { animation-delay: 0.5s; }
.star-group-2 .star:nth-child(3) { animation-delay: 0.8s; }

.star-group-3 .star:nth-child(1) { animation-delay: 0.4s; }
.star-group-3 .star:nth-child(2) { animation-delay: 0.7s; }

.star-group-4 .star:nth-child(1) { animation-delay: 0.1s; }
.star-group-4 .star:nth-child(2) { animation-delay: 0.4s; }
.star-group-4 .star:nth-child(3) { animation-delay: 0.7s; }

@keyframes twinkle {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.3) rotate(180deg);
  }
}

.login-wrapper {
  display: flex;
  gap: 3rem;
  max-width: 1200px;
  width: 100%;
  position: relative;
  z-index: 1;
}

/* 左侧插画区 */
.illustration-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  animation: slideInLeft 0.8s ease-out;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.illustration-content {
  text-align: center;
}

.logo-display {
  margin-bottom: 2rem;
  animation: fadeInUp 1s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  position: relative;
  margin-bottom: 1rem;
  animation: glow 2s ease-in-out infinite;
}

.logo-gamepad {
  font-size: 7rem;
  z-index: 1;
  animation: gamepadPulse 2s ease-in-out infinite;
}

.logo-star {
  font-size: 3rem;
  position: absolute;
  top: -10px;
  right: 15px;
  z-index: 2;
  animation: starPulse 1.5s ease-in-out infinite;
}

/* 装饰小星星 */
.logo-star-deco {
  position: absolute;
  font-size: 1.5rem;
  z-index: 3;
  animation: starFloat 3s ease-in-out infinite;
}

.star-deco-1 {
  top: -20px;
  left: -20px;
  animation-delay: 0s;
}

.star-deco-2 {
  top: 50px;
  left: -30px;
  animation-delay: 0.5s;
  font-size: 1.8rem;
}

.star-deco-3 {
  bottom: -15px;
  right: -10px;
  animation-delay: 1s;
}

.star-deco-4 {
  top: 30px;
  right: 30px;
  animation-delay: 1.5s;
  font-size: 1.2rem;
}

/* 游戏道具装饰 */
.game-props {
  position: absolute;
  font-size: 2rem;
  z-index: 4;
  animation: propBounce 4s ease-in-out infinite;
  filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
}

.props-1 {
  top: -30px;
  left: 30px;
  animation-delay: 0s;
  font-size: 2.2rem;
}

.props-2 {
  bottom: -25px;
  left: 10px;
  animation-delay: 1s;
  font-size: 1.8rem;
}

.props-3 {
  top: 20px;
  right: 0px;
  animation-delay: 2s;
  font-size: 1.6rem;
}

.props-4 {
  bottom: 10px;
  right: 45px;
  animation-delay: 3s;
  font-size: 1.5rem;
}

@keyframes propBounce {
  0%, 100% {
    opacity: 0.7;
    transform: translateY(0) rotate(0deg) scale(1);
  }
  50% {
    opacity: 1;
    transform: translateY(-15px) rotate(15deg) scale(1.1);
  }
}

/* 粒子效果 */
.particle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: rgba(255, 215, 0, 0.8);
  border-radius: 50%;
  z-index: 5;
  animation: particleFloat 3s ease-in-out infinite;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
}

.particle-1 {
  top: -20px;
  left: 0px;
  animation-delay: 0s;
}

.particle-2 {
  top: 60px;
  left: -25px;
  animation-delay: 0.5s;
  background: rgba(255, 107, 107, 0.8);
  box-shadow: 0 0 10px rgba(255, 107, 107, 0.8);
}

.particle-3 {
  top: -10px;
  right: 25px;
  animation-delay: 1s;
  background: rgba(102, 126, 234, 0.8);
  box-shadow: 0 0 10px rgba(102, 126, 234, 0.8);
}

.particle-4 {
  bottom: -15px;
  right: 20px;
  animation-delay: 1.5s;
  background: rgba(118, 75, 162, 0.8);
  box-shadow: 0 0 10px rgba(118, 75, 162, 0.8);
}

.particle-5 {
  bottom: 30px;
  left: 15px;
  animation-delay: 2s;
  background: rgba(240, 147, 251, 0.8);
  box-shadow: 0 0 10px rgba(240, 147, 251, 0.8);
}

.particle-6 {
  top: 40px;
  left: 50px;
  animation-delay: 2.5s;
  background: rgba(255, 215, 0, 0.8);
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
}

@keyframes particleFloat {
  0%, 100% {
    opacity: 0.4;
    transform: translate(0, 0) scale(1);
  }
  25% {
    opacity: 0.8;
    transform: translate(8px, -12px) scale(1.2);
  }
  50% {
    opacity: 1;
    transform: translate(0, -20px) scale(1);
  }
  75% {
    opacity: 0.8;
    transform: translate(-8px, -12px) scale(1.1);
  }
}

@keyframes starFloat {
  0%, 100% {
    opacity: 0.6;
    transform: translate(0, 0) rotate(0deg) scale(1);
  }
  25% {
    opacity: 1;
    transform: translate(5px, -10px) rotate(90deg) scale(1.2);
  }
  50% {
    opacity: 0.8;
    transform: translate(0, -15px) rotate(180deg) scale(1);
  }
  75% {
    opacity: 1;
    transform: translate(-5px, -10px) rotate(270deg) scale(1.1);
  }
}

@keyframes gamepadPulse {
  0%, 100% {
    transform: scale(1) rotate(-10deg);
    filter: drop-shadow(0 0 10px rgba(255, 107, 107, 0.5));
  }
  50% {
    transform: scale(1.05) rotate(10deg);
    filter: drop-shadow(0 0 20px rgba(255, 107, 107, 0.8));
  }
}

@keyframes starPulse {
  0%, 100% {
    transform: scale(1) rotate(0deg);
    filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.8));
  }
  50% {
    transform: scale(1.2) rotate(20deg);
    filter: drop-shadow(0 0 25px rgba(255, 215, 0, 1));
  }
}

@keyframes glow {
  0%, 100% {
    filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.6));
  }
  50% {
    filter: drop-shadow(0 0 30px rgba(255, 215, 0, 0.9));
  }
}

.brand-name {
  font-size: 3rem;
  font-weight: 800;
  margin: 0.5rem 0;
  background: linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
}

.brand-name-en {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

@keyframes scorePop {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* 高亮卡片 */
.highlight-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 107, 107, 0.3));
  backdrop-filter: blur(10px);
  padding: 1.2rem 1.8rem;
  border-radius: 20px;
  border: 2px solid rgba(255, 215, 0, 0.5);
  margin-top: 2rem;
  animation: highlightGlow 3s ease-in-out infinite;
  cursor: pointer;
  transition: all 0.3s;
}

.highlight-box:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 30px rgba(255, 215, 0, 0.4);
}

@keyframes highlightGlow {
  0%, 100% {
    border-color: rgba(255, 215, 0, 0.5);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
  }
  50% {
    border-color: rgba(255, 215, 0, 0.8);
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  }
}

.highlight-icon {
  font-size: 2.5rem;
  animation: rocketFloat 2s ease-in-out infinite;
}

@keyframes rocketFloat {
  0%, 100% {
    transform: translateY(0) rotate(-5deg);
  }
  50% {
    transform: translateY(-8px) rotate(5deg);
  }
}

.highlight-text {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.highlight-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: white;
}

.highlight-subtitle {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.9);
  opacity: 0.9;
}

.illustration-desc {
  font-size: 1.2rem;
  margin-bottom: 3rem;
  opacity: 0.95;
  line-height: 1.6;
  position: relative;
}

.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background: #ffd700;
  margin-left: 2px;
  vertical-align: middle;
  animation: cursorBlink 1s step-end infinite;
}

@keyframes cursorBlink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.1rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  border-radius: 50px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.1rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  border-radius: 50px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.feature-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.feature-item:hover::before {
  left: 100%;
}

.feature-1:hover {
  border-color: #ffd700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.feature-2:hover {
  border-color: #ff6b6b;
  box-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
}

.feature-3:hover {
  border-color: #667eea;
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.5);
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.feature-icon {
  font-size: 1.5rem;
  animation: iconBounce 2s ease-in-out infinite;
}

.feature-1 .feature-icon {
  animation-delay: 0s;
}

.feature-2 .feature-icon {
  animation-delay: 0.5s;
}

.feature-3 .feature-icon {
  animation-delay: 1s;
}

@keyframes iconBounce {
  0%, 100% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.2) rotate(10deg);
  }
}

.feature-score {
  font-size: 0.85rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffd700, #ff6b6b);
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  margin-left: auto;
  animation: scorePop 3s ease-in-out infinite;
}

.feature-1 .feature-score {
  animation-delay: 0s;
}

.feature-2 .feature-score {
  animation-delay: 1s;
}

.feature-3 .feature-score {
  animation-delay: 2s;
}

@keyframes scorePop {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* 右侧登录表单区 */
.login-form-section {
  flex: 0 0 480px;
  animation: slideInRight 0.8s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.login-card {
  background: white;
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.card-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.brand-logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.welcome-title {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-subtitle {
  color: #666;
  font-size: 1rem;
}

/* 表单样式 */
.login-form {
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.75rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.label-icon {
  font-size: 1.2rem;
}

.form-input {
  width: 100%;
  padding: 1rem 1.25rem;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #f9fafb;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.form-input::placeholder {
  color: #9ca3af;
}

.form-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-icon {
  font-size: 1.3rem;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 分割线 */
.divider {
  display: flex;
  align-items: center;
  margin: 2rem 0;
  color: #d1d5db;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, #e5e7eb, transparent);
}

.divider-text {
  padding: 0 1.5rem;
  font-size: 0.9rem;
  font-weight: 500;
}

/* 注册区域 */
.register-section {
  text-align: center;
}

.register-text {
  color: #666;
  font-size: 0.95rem;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.register-icon {
  font-size: 1.2rem;
  animation: registerStarBounce 2s ease-in-out infinite;
}

@keyframes registerStarBounce {
  0%, 100% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.3) rotate(20deg);
  }
}

.register-link {
  color: #667eea;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.3s;
  text-decoration: none;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.register-link:hover {
  transform: scale(1.05);
  text-decoration: underline;
}

/* 响应式 */
@media (max-width: 1024px) {
  .login-wrapper {
    flex-direction: column;
    gap: 2rem;
  }

  .illustration-section {
    flex: none;
  }

  .login-form-section {
    flex: none;
    width: 100%;
    max-width: 480px;
  }

  .logo-icon-wrapper {
    gap: 0;
  }

  .logo-gamepad {
    font-size: 3.5rem;
  }

  .logo-star {
    font-size: 2rem;
    top: -8px;
    right: 10px;
  }

  .brand-name {
    font-size: 2.2rem;
  }

  .brand-name-en {
    font-size: 1.2rem;
  }

  .illustration-desc {
    font-size: 1rem;
  }
}

@media (max-width: 768px) {
  .login-container {
    padding: 1rem;
  }

  .login-card {
    padding: 2rem;
    border-radius: 20px;
  }

  .logo-icon {
    font-size: 3rem;
  }

  .brand-name {
    font-size: 1.8rem;
  }

  .brand-name-en {
    font-size: 1rem;
  }

  .welcome-title {
    font-size: 1.75rem;
  }

  .feature-list {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }

  .feature-item {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 0.5rem;
  }

  .login-card {
    padding: 1.5rem;
    border-radius: 16px;
  }

  .logo-gamepad {
    font-size: 2rem;
  }

  .logo-star {
    font-size: 1.2rem;
    top: -4px;
    right: 6px;
  }

  .brand-name {
    font-size: 1.5rem;
  }

  .brand-name-en {
    font-size: 0.9rem;
  }

  .illustration-desc {
    font-size: 0.9rem;
  }

  .form-input {
    padding: 0.875rem 1rem;
  }

  .submit-btn {
    padding: 0.875rem;
  }

  .feature-item {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
}
</style>
