<template>
  <div class="account-select">
    <div class="bg-decoration" aria-hidden="true">
      <div class="floating-icon icon-1">🎮</div>
      <div class="floating-icon icon-2">⭐</div>
      <div class="floating-icon icon-3">🌟</div>
      <div class="floating-icon icon-4">✨</div>
      <div class="floating-icon icon-5">🎯</div>
      <div class="floating-icon icon-6">💎</div>
    </div>

    <div class="select-wrapper">
      <div class="select-header">
        <div class="header-icon">👋</div>
        <h1 class="header-title">选择账号</h1>
        <p class="header-sub">请选择要使用的账号进入游戏</p>
      </div>

      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载账号信息...</p>
      </div>

      <div v-else class="accounts-grid">
        <!-- 当前账号 -->
        <div class="account-card current-account" :class="{ selected: selectedId === currentAccount.id }" @click="selectAccount(currentAccount)">
          <div class="card-glow"></div>
          <div class="card-badge">当前登录</div>
          <div class="card-avatar-wrapper">
            <div class="card-avatar" :style="{ background: currentAccount.avatarBg }">
              <span class="avatar-emoji">{{ currentAccount.avatar }}</span>
            </div>
            <div class="avatar-ring"></div>
          </div>
          <div class="card-info">
            <h3 class="card-name">{{ currentAccount.nickname }}</h3>
            <span class="card-role">{{ currentAccount.roleLabel }}</span>
            <span class="card-username">@{{ currentAccount.username }}</span>
          </div>
          <div class="card-footer">
            <button class="card-btn" :class="{ primary: selectedId === currentAccount.id }">
              {{ selectedId === currentAccount.id ? '已选择' : '选择此账号' }}
            </button>
          </div>
        </div>

        <!-- 孩子账号 -->
        <div
          v-for="kid in kidAccounts"
          :key="kid.id"
          class="account-card kid-account"
          :class="{ selected: selectedId === kid.id }"
          @click="selectAccount(kid)"
        >
          <div class="card-glow"></div>
          <div class="card-avatar-wrapper">
            <div class="card-avatar kid-avatar" :style="{ background: kid.avatarBg }">
              <span class="avatar-emoji">{{ kid.avatar }}</span>
            </div>
            <div class="avatar-ring kid-ring"></div>
          </div>
          <div class="card-info">
            <h3 class="card-name">{{ kid.nickname }}</h3>
            <span class="card-role">{{ kid.roleLabel }}</span>
            <span class="card-username">@{{ kid.username }}</span>
            <div class="kid-stats" v-if="kid.grade">
              <span class="stat-tag">{{ kid.gradeName }}</span>
              <span class="stat-tag coins">⚡{{ kid.fatiguePoints ?? 0 }}</span>
            </div>
          </div>
          <div class="card-footer">
            <button class="card-btn kid-btn" :class="{ active: selectedId === kid.id }">
              {{ selectedId === kid.id ? '已选择' : '选择此账号' }}
            </button>
          </div>
        </div>
      </div>

      <div class="select-actions">
        <button
          class="confirm-btn"
          :disabled="!selectedId || isNavigating"
          @click="confirmSelection"
        >
          <span v-if="isNavigating" class="btn-loading"></span>
          <span v-else>进入游戏</span>
        </button>
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/core/store/user.store';
import { parentApi } from '@/services/parent-api.service';
import { toast } from '@/services/toast.service';
import { clearAllAuth } from '@/utils/auth';
import type { Kid } from '@/services/api.types';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const isLoading = ref(true);
const isNavigating = ref(false);
const selectedId = ref<string>('');

interface AccountCard {
  id: string;
  type: 'parent' | 'kid' | 'admin';
  username: string;
  nickname: string;
  avatar: string;
  avatarBg: string;
  roleLabel: string;
  grade?: string;
  gradeName?: string;
  fatiguePoints?: number;
  rawData?: Kid;
}

const kidAccounts = ref<AccountCard[]>([]);

const gradeMap: Record<string, string> = {
  '1': '一年级',
  '2': '二年级',
  '3': '三年级',
  '4': '四年级',
  '5': '五年级',
  '6': '六年级',
};

const avatarColors = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
];

const currentAccount = computed<AccountCard>(() => {
  if (userStore.parentUser) {
    return {
      id: `parent-${userStore.parentUser.parentId}`,
      type: 'parent',
      username: userStore.parentUser.username,
      nickname: userStore.parentUser.nickname || userStore.parentUser.username,
      avatar: userStore.parentUser.avatar || '👨‍👩‍👧',
      avatarBg: avatarColors[0],
      roleLabel: '家长',
    };
  }
  if (userStore.adminUser) {
    return {
      id: `admin-${userStore.adminUser.adminId}`,
      type: 'admin',
      username: userStore.adminUser.username,
      nickname: userStore.adminUser.nickname || userStore.adminUser.username,
      avatar: userStore.adminUser.avatar || '🛡️',
      avatarBg: avatarColors[0],
      roleLabel: '管理员',
    };
  }
  // 儿童账号
  return {
    id: `kid-${userStore.currentUser?.id}`,
    type: 'kid',
    username: userStore.currentUser?.username || '',
    nickname: userStore.currentUser?.nickname || userStore.currentUser?.username || '',
    avatar: userStore.currentUser?.avatar || '🐱',
    avatarBg: avatarColors[0],
    roleLabel: '小朋友',
    grade: userStore.currentUser?.grade,
    gradeName: gradeMap[userStore.currentUser?.grade || ''] || '',
    fatiguePoints: userStore.currentUser?.fatiguePoints,
  };
});

onMounted(async () => {
  userStore.restoreFromStorage();

  // 如果没有任何登录状态，跳转登录页
  if (!userStore.parentUser && !userStore.adminUser && !userStore.currentUser) {
    router.replace('/login');
    return;
  }

  // 如果是家长，加载孩子列表
  if (userStore.parentUser) {
    try {
      const kids = await parentApi.getChildren(userStore.parentUser.parentId);
      kidAccounts.value = kids.map((kid: Kid, index: number) => ({
        id: `kid-${kid.kidId}`,
        type: 'kid' as const,
        username: kid.username,
        nickname: kid.nickname || kid.username,
        avatar: kid.avatar || '🐱',
        avatarBg: avatarColors[(index + 1) % avatarColors.length],
        roleLabel: '小朋友',
        grade: kid.grade,
        gradeName: gradeMap[kid.grade] || '',
        fatiguePoints: kid.fatiguePoints,
        rawData: kid,
      }));
    } catch (err) {
      console.error('获取孩子列表失败:', err);
      toast.warning('获取孩子列表失败，可稍后重试');
    }
  }

  isLoading.value = false;
});

function selectAccount(account: AccountCard) {
  selectedId.value = account.id;
}

async function confirmSelection() {
  if (!selectedId.value || isNavigating.value) return;
  isNavigating.value = true;

  const redirectTarget = typeof route.query.redirect === 'string'
    ? route.query.redirect
    : '/';

  try {
    // 判断选中的是家长还是孩子
    if (selectedId.value.startsWith('kid-')) {
      const kidId = selectedId.value.replace('kid-', '');

      // 如果选中的不是当前登录的孩子账号，需要切换
      if (userStore.parentUser) {
        // 家长选中了孩子，加载孩子信息
        const kid = kidAccounts.value.find(k => k.id === selectedId.value);
        if (kid?.rawData) {
          userStore.currentUser = {
            id: kid.rawData.kidId,
            username: kid.rawData.username,
            nickname: kid.rawData.nickname,
            avatar: kid.rawData.avatar,
            grade: kid.rawData.grade,
            fatiguePoints: kid.rawData.fatiguePoints,
            dailyAnswerPoints: kid.rawData.dailyAnswerPoints,
            parentId: kid.rawData.parentId,
            userType: 'KID',
          };
          localStorage.setItem('userInfo', JSON.stringify(userStore.currentUser));
          // 家长token保留，但切换到孩子身份
          // kidApi需要token，这里保留parentToken
          // 但kidApi使用authToken，所以需要处理
          // 实际上，从家长切换到孩子，API调用需要使用parent token
          // 这里简化处理：使用parent token即可
        }
      }
    } else if (selectedId.value.startsWith('parent-')) {
      // 家长选了自己，清除currentUser（如果有的话）
      // 保持parentUser，导航到home
      userStore.currentUser = null;
      localStorage.removeItem('userInfo');
    } else if (selectedId.value.startsWith('admin-')) {
      // 管理员选了自己
      userStore.currentUser = null;
      localStorage.removeItem('userInfo');
    }

    await router.push(redirectTarget);
  } catch (err) {
    console.error('账号切换失败:', err);
    toast.error('切换账号失败，请重试');
  } finally {
    isNavigating.value = false;
  }
}

async function handleLogout() {
  try {
    await userStore.logoutAll();
  } catch {
    // ignore
  }
  clearAllAuth();
  router.replace('/login');
}
</script>

<style scoped>
.account-select {
  min-height: 100dvh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #533483 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1rem, 3vh, 2rem);
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.floating-icon {
  position: absolute;
  opacity: 0.15;
  animation: floatAround 8s ease-in-out infinite;
}

.icon-1 {
  top: 10%;
  left: 8%;
  font-size: 3rem;
  animation-delay: 0s;
}
.icon-2 {
  top: 20%;
  right: 12%;
  font-size: 2.5rem;
  animation-delay: 1.5s;
}
.icon-3 {
  bottom: 25%;
  left: 6%;
  font-size: 3.5rem;
  animation-delay: 3s;
}
.icon-4 {
  bottom: 15%;
  right: 10%;
  font-size: 2rem;
  animation-delay: 4.5s;
}
.icon-5 {
  top: 50%;
  left: 15%;
  font-size: 2.8rem;
  animation-delay: 2s;
}
.icon-6 {
  top: 40%;
  right: 20%;
  font-size: 2.2rem;
  animation-delay: 5s;
}

@keyframes floatAround {
  0%, 100% {
    opacity: 0.12;
    transform: translateY(0) rotate(0deg) scale(1);
  }
  25% {
    opacity: 0.2;
    transform: translateY(-15px) rotate(5deg) scale(1.1);
  }
  50% {
    opacity: 0.15;
    transform: translateY(-8px) rotate(-3deg) scale(1);
  }
  75% {
    opacity: 0.22;
    transform: translateY(-20px) rotate(8deg) scale(1.08);
  }
}

/* 内容区 */
.select-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(1.5rem, 4vh, 2.5rem);
}

/* 头部 */
.select-header {
  text-align: center;
  animation: fadeInDown 0.6s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header-icon {
  font-size: clamp(2.5rem, 6vh, 3.5rem);
  margin-bottom: 0.5rem;
  animation: wave 1.5s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(10deg); }
  75% { transform: rotate(-10deg); }
}

.header-title {
  margin: 0;
  font-size: clamp(1.5rem, 3.5vh, 2rem);
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.02em;
}

.header-sub {
  margin: 0.5rem 0 0;
  font-size: clamp(0.85rem, 1.8vh, 1rem);
  color: rgba(255, 255, 255, 0.65);
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.7);
  padding: 3rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 账号卡片网格 */
.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: clamp(1rem, 2vw, 1.5rem);
  width: 100%;
  justify-items: center;
}

/* 账号卡片 */
.account-card {
  position: relative;
  width: 100%;
  max-width: 260px;
  background: rgba(255, 255, 255, 0.07);
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: clamp(1.25rem, 3vh, 1.75rem);
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  animation: fadeInUp 0.5s ease-out both;
  overflow: hidden;
}

.account-card:nth-child(1) { animation-delay: 0.1s; }
.account-card:nth-child(2) { animation-delay: 0.2s; }
.account-card:nth-child(3) { animation-delay: 0.3s; }
.account-card:nth-child(4) { animation-delay: 0.4s; }
.account-card:nth-child(5) { animation-delay: 0.5s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.account-card:hover {
  transform: translateY(-6px);
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}

.account-card.selected {
  border-color: rgba(255, 215, 0, 0.6);
  background: rgba(255, 215, 0, 0.08);
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.15);
  transform: translateY(-4px);
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.03) 0%, transparent 70%);
  pointer-events: none;
  transition: opacity 0.3s;
  opacity: 0;
}

.account-card:hover .card-glow {
  opacity: 1;
}

.card-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  letter-spacing: 0.04em;
}

/* 头像 */
.card-avatar-wrapper {
  position: relative;
}

.card-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s;
}

.account-card:hover .card-avatar {
  transform: scale(1.05);
}

.avatar-emoji {
  font-size: 2.2rem;
  line-height: 1;
}

.avatar-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  animation: ringPulse 2s ease-in-out infinite;
}

.kid-ring {
  border-color: rgba(78, 205, 196, 0.3);
}

@keyframes ringPulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.06); opacity: 1; }
}

/* 卡片信息 */
.card-info {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}

.card-name {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-role {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.card-username {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.35);
}

.kid-stats {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.25rem;
}

.stat-tag {
  font-size: 0.65rem;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
}

.stat-tag.coins {
  background: rgba(255, 215, 0, 0.15);
  color: #ffd700;
}

/* 卡片按钮 */
.card-footer {
  width: 100%;
  margin-top: 0.25rem;
}

.card-btn {
  width: 100%;
  padding: 0.6rem 1rem;
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  letter-spacing: 0.02em;
}

.card-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.35);
}

.card-btn.primary,
.card-btn.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-color: transparent;
  color: #fff;
}

.kid-btn.active {
  background: linear-gradient(135deg, #4ecdc4, #45b7d1);
}

/* 操作按钮 */
.select-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  max-width: 300px;
  animation: fadeInUp 0.5s ease-out 0.3s both;
}

.confirm-btn {
  width: 100%;
  padding: 0.85rem 1.5rem;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  letter-spacing: 0.04em;
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 28px rgba(102, 126, 234, 0.55);
}

.confirm-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.btn-loading {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.logout-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  cursor: pointer;
  transition: color 0.2s;
}

.logout-btn:hover {
  color: rgba(255, 255, 255, 0.8);
}

/* 响应式 */
@media (max-width: 640px) {
  .accounts-grid {
    grid-template-columns: 1fr;
    max-width: 300px;
    margin: 0 auto;
  }

  .account-card {
    max-width: 100%;
  }

  .card-avatar {
    width: 60px;
    height: 60px;
  }

  .avatar-emoji {
    font-size: 1.8rem;
  }
}
</style>