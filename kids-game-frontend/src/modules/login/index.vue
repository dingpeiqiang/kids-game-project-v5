<template>
  <div class="login-container">
    <div class="bg-decoration" aria-hidden="true">
      <div class="gamepad gamepad-1">🎮</div>
      <div class="gamepad gamepad-2">🎮</div>
      <div class="gamepad gamepad-3">🎮</div>
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
      <div class="illustration-section">
        <div class="illustration-content">
          <div class="logo-display">
            <div class="logo-icon-wrapper">
              <span class="logo-gamepad">🎮</span>
              <span class="logo-star">⭐</span>
              <span class="logo-star-deco star-deco-1">✨</span>
              <span class="logo-star-deco star-deco-2">🌟</span>
              <span class="logo-star-deco star-deco-3">✨</span>
              <span class="logo-star-deco star-deco-4">⭐</span>
            </div>
            <h1 class="brand-name">星光游学</h1>
            <span class="brand-name-en">StarPlay</span>
          </div>
          <p class="illustration-desc">在游戏中学习，在挑战中成长</p>
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

      <div class="login-form-section">
        <div class="login-glass">

          <header v-show="false" class="login-panel__head">
            <div class="login-panel__avatar" aria-hidden="true">��</div>
            <h1 class="login-panel__title">欢迎回来，玩家!</h1>
            <p class="login-panel__sub">登录继续你的冒险之旅</p>
          </header>

          <h2 class="login-glass__title">欢迎回来</h2>
          <p class="login-glass__sub">登录继续冒险</p>

          <ErrorDisplay v-if="errorMessage" :message="errorMessage" @close="errorMessage = ''" />
          <GlobalLoading :loading="isLoading" message="登录中..." />

          <form class="login-glass__form" @submit.prevent="handleLogin">
            <label class="login-glass__label" for="username">账号</label>
            <input
              id="username"
              v-model="formData.username"
              type="text"
              class="login-glass__input"
              placeholder="用户名或手机号"
              autocomplete="username"
              :disabled="isLoading"
            />
            <label class="login-glass__label" for="password">密码</label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              class="login-glass__input"
              placeholder="请输入密码"
              autocomplete="current-password"
              :disabled="isLoading"
            />
            <button
              type="submit"
              class="login-glass__btn"
              :disabled="isLoading || !formData.username || !formData.password"
            >
              {{ isLoading ? '登录中…' : '开始游戏' }}
            </button>
          </form>

          <p class="login-glass__foot">
            没有账号？
            <button type="button" class="login-glass__link" @click="goToRegister">注册</button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { getDefaultAdminLanding } from '@kids-game/shared';
import { useUserStore } from '@/core/store/user.store';
import GlobalLoading from '@/components/GlobalLoading.vue';
import ErrorDisplay from '@/components/ErrorDisplay.vue';
import { toast } from '@/services/toast.service';
import { loadParentLoginUsername, saveParentLoginUsername } from '@/utils/auth-session';
import { clearAllAuth } from '@/utils/auth';

const APP_SHELL = import.meta.env.VITE_APP_SHELL || 'legacy';
const isPlayShell = APP_SHELL === 'simple';
const isAdminShell = APP_SHELL === 'admin';
const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:3000';
const PLAY_URL = import.meta.env.VITE_PLAY_URL || 'http://localhost:3001';

const router = useRouter();
const userStore = useUserStore();

const isLoading = ref(false);
const errorMessage = ref('');
const formData = ref({
  username: '',
  password: '',
});

onMounted(() => {
  document.documentElement.classList.add('login-page-active');
  document.body.classList.add('login-page-active');
  const savedUsername = loadParentLoginUsername();
  if (savedUsername) {
    formData.value.username = savedUsername;
  }
});

onUnmounted(() => {
  document.documentElement.classList.remove('login-page-active');
  document.body.classList.remove('login-page-active');
});

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
    // 清除之前的登录状态，确保正确识别用户类型
    clearAllAuth();
    isLoading.value = true;
    const result = await userStore.unifiedLogin(formData.value.username, formData.value.password);

    if (result.userType === 0) {
      if (isAdminShell) {
        toast.error('儿童账号请使用儿童游玩端登录');
        userStore.logoutKid();
        window.location.href = PLAY_URL;
        return;
      }
      toast.success('登录成功！');
      await router.push('/');
    } else if (result.userType === 1) {
      toast.success('家长登录成功！');
      saveParentLoginUsername(formData.value.username);
      if (isPlayShell) {
        toast.info('家长请使用管理端进行管控');
        userStore.logoutParent();
        window.location.href = `${ADMIN_URL.replace(/\/$/, '')}/login`;
        return;
      }
      await router.push(getDefaultAdminLanding('parent'));
    } else if (result.userType === 2) {
      toast.success('管理员登录成功！');
      if (isPlayShell) {
        window.location.href = `${ADMIN_URL.replace(/\/$/, '')}${getDefaultAdminLanding('admin')}`;
        return;
      }
      await router.push(getDefaultAdminLanding('admin'));
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
/* —— 一屏布局：固定视口，禁止整页滚动 —— */
.login-container {
  box-sizing: border-box;
  height: 100dvh;
  max-height: 100dvh;
  min-height: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(0.5rem, 1.5vh, 1.25rem) clamp(0.75rem, 2vw, 1.5rem);
  position: relative;
  overflow: hidden;
}

.bg-decoration {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.gamepad {
  position: absolute;
  opacity: 0.35;
  animation: floatGamepad 6s ease-in-out infinite;
}

.gamepad-1 {
  top: 12%;
  left: 6%;
  font-size: clamp(2rem, 5vw, 3.5rem);
  animation-delay: 0s;
}

.gamepad-2 {
  bottom: 18%;
  right: 8%;
  font-size: clamp(1.75rem, 4vw, 3rem);
  animation-delay: 2s;
}

.gamepad-3 {
  top: 48%;
  right: 22%;
  font-size: clamp(1.25rem, 3vw, 2.25rem);
  animation-delay: 4s;
}

@keyframes floatGamepad {
  0%,
  100% {
    opacity: 0.35;
    transform: translateY(0) rotate(-5deg);
  }
  50% {
    opacity: 0.5;
    transform: translateY(-12px) rotate(5deg);
  }
}

.star-group {
  position: absolute;
  display: flex;
  gap: 0.35rem;
  opacity: 0.65;
  animation: twinkleGroup 4s ease-in-out infinite;
}

.star-group-1 {
  top: 8%;
  right: 12%;
}
.star-group-2 {
  bottom: 22%;
  left: 10%;
  animation-delay: 1s;
}
.star-group-3 {
  top: 62%;
  left: 4%;
  animation-delay: 2s;
}
.star-group-4 {
  bottom: 8%;
  right: 4%;
  animation-delay: 3s;
}

@keyframes twinkleGroup {
  0%,
  100% {
    opacity: 0.45;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.08);
  }
}

.star {
  display: inline-block;
}
.star.small {
  font-size: clamp(0.9rem, 2vh, 1.25rem);
  animation: twinkle 2s ease-in-out infinite;
}
.star.medium {
  font-size: clamp(1.1rem, 2.5vh, 1.5rem);
  animation: twinkle 2.5s ease-in-out infinite;
}
.star.large {
  font-size: clamp(1.35rem, 3vh, 1.85rem);
  animation: twinkle 3s ease-in-out infinite;
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.6;
    transform: scale(1) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.2) rotate(180deg);
  }
}

.login-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(1rem, 3vw, 2.5rem);
  max-width: 1180px;
  width: 100%;
  max-height: 100%;
  min-height: 0;
  position: relative;
  z-index: 1;
}

.illustration-section {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  animation: slideInLeft 0.8s ease-out;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.illustration-content {
  text-align: center;
  max-width: 100%;
}

.logo-display {
  margin-bottom: clamp(0.5rem, 1.5vh, 1.25rem);
}

.logo-icon-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: clamp(0.35rem, 1vh, 0.75rem);
  animation: glow 2s ease-in-out infinite;
}

.logo-gamepad {
  font-size: clamp(3rem, 11vh, 5.5rem);
  z-index: 1;
  animation: gamepadPulse 2s ease-in-out infinite;
  line-height: 1;
}

.logo-star {
  position: absolute;
  top: -6%;
  right: 8%;
  font-size: clamp(1.25rem, 3.5vh, 2.25rem);
  z-index: 2;
  animation: starPulse 1.5s ease-in-out infinite;
}

.logo-star-deco {
  position: absolute;
  font-size: clamp(0.85rem, 2vh, 1.25rem);
  z-index: 3;
  animation: starFloat 3s ease-in-out infinite;
}

.star-deco-1 {
  top: -12%;
  left: -8%;
}
.star-deco-2 {
  top: 55%;
  left: -12%;
  animation-delay: 0.5s;
  font-size: clamp(1rem, 2.2vh, 1.4rem);
}
.star-deco-3 {
  bottom: -8%;
  right: -4%;
  animation-delay: 1s;
}
.star-deco-4 {
  top: 28%;
  right: 12%;
  animation-delay: 1.5s;
}

@keyframes starFloat {
  0%,
  100% {
    opacity: 0.6;
    transform: translate(0, 0) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: translate(0, -10px) rotate(180deg);
  }
}

@keyframes gamepadPulse {
  0%,
  100% {
    transform: scale(1) rotate(-8deg);
    filter: drop-shadow(0 0 10px rgba(255, 107, 107, 0.5));
  }
  50% {
    transform: scale(1.04) rotate(8deg);
    filter: drop-shadow(0 0 18px rgba(255, 107, 107, 0.75));
  }
}

@keyframes starPulse {
  0%,
  100% {
    transform: scale(1);
    filter: drop-shadow(0 0 12px rgba(255, 215, 0, 0.75));
  }
  50% {
    transform: scale(1.15) rotate(15deg);
    filter: drop-shadow(0 0 20px rgba(255, 215, 0, 1));
  }
}

@keyframes glow {
  0%,
  100% {
    filter: drop-shadow(0 0 16px rgba(255, 215, 0, 0.5));
  }
  50% {
    filter: drop-shadow(0 0 24px rgba(255, 215, 0, 0.8));
  }
}

.brand-name {
  font-size: clamp(1.6rem, 4.2vh, 2.75rem);
  font-weight: 800;
  margin: 0.25rem 0;
  background: linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-name-en {
  font-size: clamp(0.75rem, 1.8vh, 1.15rem);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.25em;
  text-transform: uppercase;
}

.illustration-desc {
  font-size: clamp(0.9rem, 1.8vh, 1.1rem);
  margin: 0 auto clamp(0.5rem, 1.5vh, 1.25rem);
  max-width: 22em;
  opacity: 0.95;
  line-height: 1.5;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: clamp(0.4rem, 1vh, 0.65rem);
  align-items: center;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: clamp(0.85rem, 1.6vh, 1rem);
  font-weight: 600;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: clamp(0.45rem, 1.2vh, 0.75rem) clamp(1rem, 2.5vw, 1.5rem);
  border-radius: 50px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s;
  max-width: 100%;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.feature-1:hover {
  border-color: #ffd700;
  box-shadow: 0 0 16px rgba(255, 215, 0, 0.45);
}
.feature-2:hover {
  border-color: #ff6b6b;
}
.feature-3:hover {
  border-color: #667eea;
}

.feature-icon {
  font-size: clamp(1.1rem, 2vh, 1.4rem);
  animation: iconBounce 2s ease-in-out infinite;
}

.feature-2 .feature-icon {
  animation-delay: 0.5s;
}
.feature-3 .feature-icon {
  animation-delay: 1s;
}

@keyframes iconBounce {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15) rotate(8deg);
  }
}

.login-form-section {
  flex: 0 1 440px;
  width: 100%;
  max-width: 440px;
  min-height: 0;
  animation: slideInRight 0.8s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 登录面板：毛玻璃，与渐变背景融合 */
.login-glass {
  padding: clamp(1.1rem, 2.8vh, 1.65rem) clamp(1.1rem, 2.5vw, 1.5rem);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  max-height: calc(100dvh - 2rem);
}

.login-glass__title {
  margin: 0 0 0.25rem;
  text-align: center;
  font-size: clamp(1.25rem, 3vh, 1.5rem);
  font-weight: 800;
  color: #fff;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.login-glass__sub {
  margin: 0 0 clamp(0.85rem, 2vh, 1.15rem);
  text-align: center;
  font-size: clamp(0.8rem, 1.5vh, 0.9rem);
  color: rgba(255, 255, 255, 0.82);
}

.login-glass__form {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.login-glass__label {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.88);
  letter-spacing: 0.04em;
}

.login-glass__label:first-of-type {
  margin-top: 0;
}

.login-glass__input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.7rem 0.85rem;
  font-size: 1rem;
  color: #fff;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 12px;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
}

.login-glass__input::placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.login-glass__input:focus {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.55);
}

.login-glass__input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-glass__btn {
  margin-top: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 700;
  color: #5b4bb4;
  background: rgba(255, 255, 255, 0.92);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
}

.login-glass__btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
}

.login-glass__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-glass__foot {
  margin: clamp(0.85rem, 2vh, 1rem) 0 0;
  text-align: center;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.75);
}

.login-glass__link {
  padding: 0;
  margin-left: 0.25rem;
  border: none;
  background: none;
  font: inherit;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.login-glass__link:hover {
  color: #ffe082;
}

/* 矮屏：减左侧高度，避免挤压右侧卡片 */
@media (max-height: 780px) {
  .feature-list {
    display: none;
  }

  .illustration-desc {
    margin-bottom: 0.35rem;
  }

  .logo-gamepad {
    font-size: clamp(2.5rem, 9vh, 4rem);
  }
}

@media (max-height: 680px) {
  .brand-name-en {
    display: none;
  }

  .logo-star-deco {
    display: none;
  }

  .login-glass {
    padding: 1rem 1.1rem;
  }
}

@media (max-width: 1024px) {
  .login-wrapper {
    flex-direction: column;
    gap: clamp(0.65rem, 2vh, 1rem);
    max-width: 440px;
  }

  .illustration-section {
    flex: 0 0 auto;
  }

  .login-form-section {
    flex: 0 0 auto;
    max-width: 100%;
  }

  .feature-list {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.4rem;
  }

  .feature-item {
    padding: 0.4rem 0.85rem;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 0.5rem;
  }

  .login-glass {
    padding: 1rem 0.9rem;
    border-radius: 16px;
  }
}
</style>

<style>
html.login-page-active,
body.login-page-active {
  overflow: hidden !important;
  height: 100%;
  max-height: 100dvh;
}

html.login-page-active #app {
  min-height: 0;
  height: 100%;
  max-height: 100dvh;
  overflow: hidden;
}
</style>