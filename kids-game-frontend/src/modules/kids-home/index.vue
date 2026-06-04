<template>
  <div class="kids-home-container">
    <!-- 背景装饰 - 动态星星 -->
    <div class="bg-stars">
      <div v-for="i in 20" :key="i" class="bg-star" :style="getStarStyle(i)"></div>
    </div>

    <!-- 顶部栏 -->
    <BaseHeader variant="kids" class="kids-header">
      <template #left>
        <h1 class="logo">
          <span class="logo-icon">⭐</span>
          <span class="logo-text">星光游学</span>
        </h1>
        <div class="header-decoration">
          <span class="decoration-star">✨</span>
          <span class="decoration-star">🌟</span>
          <span class="decoration-star">✨</span>
        </div>
      </template>

      <template #center>
        <div class="level-badge" :class="`level-${getLevelClass(userLevel)}`">
          <span class="level-icon">🏆</span>
          <span class="level-number">Lv.{{ userLevel }}</span>
          <div class="level-progress" :style="{ width: getLevelProgress() + '%' }"></div>
        </div>
      </template>

      <template #right>
        <button @click="showNotifications = true" class="notification-btn" title="通知">
          <span class="notification-icon">🔔</span>
          <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
        </button>
        <!-- 创作者中心入口 -->
        <router-link to="/creator-center" class="creator-center-link" title="创作者中心">
          <button class="theme-btn">
            <span class="theme-icon">🎨</span>
          </button>
        </router-link>
        <div class="user-info" @click="showAvatarPicker = true">
          <div class="user-avatar" :class="{ animate: avatarAnimating }">
            <img v-if="isImageUrl(userStore.avatar)" :src="userStore.avatar" alt="头像" class="avatar-image" />
            <span v-else class="avatar-emoji">{{ userStore.avatar || '🐱' }}</span>
          </div>
          <div class="user-details">
            <span class="user-name">{{ userStore.username }}</span>
            <span class="user-role">小小探险家</span>
          </div>
        </div>
        <button @click="logout" class="exit-btn" title="退出">
          <span class="exit-icon">🚪</span>
        </button>
      </template>
    </BaseHeader>

    <!-- 主内容区 -->
    <main class="kids-main">
      <!-- 欢迎横幅 -->
      <section class="welcome-banner">
        <div class="banner-bg">
          <div class="banner-shape shape-1"></div>
          <div class="banner-shape shape-2"></div>
          <div class="banner-shape shape-3"></div>
        </div>
        <div class="welcome-content">
          <div class="welcome-emoji">🎉</div>
          <h2 class="welcome-title">
            欢迎回来，{{ userStore.username }}！
          </h2>
          <p class="welcome-subtitle">今天要开启什么精彩的冒险呢？</p>
          <div class="welcome-stats">
            <div class="stat-card stat-float">
              <div class="stat-icon-wrapper">
                <span class="stat-icon">⚡</span>
              </div>
              <div class="stat-info">
                <span class="stat-label">疲劳点</span>
                <span class="stat-value" :class="{ warning: fatiguePoints <= 3 }">
                  {{ fatiguePoints }}/10
                </span>
              </div>
              <div class="stat-progress">
                <div class="progress-bar" :style="{ width: (fatiguePoints / 10 * 100) + '%', background: getFatigueColor() }"></div>
              </div>
            </div>
            <div class="stat-card stat-float">
              <div class="stat-icon-wrapper">
                <span class="stat-icon">📚</span>
              </div>
              <div class="stat-info">
                <span class="stat-label">年级</span>
                <span class="stat-value">{{ currentGradeName }}</span>
              </div>
              <div class="stat-decoration">🎓</div>
            </div>
            <div class="stat-card stat-float">
              <div class="stat-icon-wrapper stat-icon-fire">
                <span class="stat-icon">🔥</span>
              </div>
              <div class="stat-info">
                <span class="stat-label">连胜</span>
                <span class="stat-value">{{ winStreak }}</span>
              </div>
              <div class="stat-decoration">🏅</div>
            </div>
            <div class="stat-card stat-float">
              <div class="stat-icon-wrapper">
                <span class="stat-icon">💎</span>
              </div>
              <div class="stat-info">
                <span class="stat-label">积分</span>
                <span class="stat-value">{{ totalPoints }}</span>
              </div>
              <div class="stat-decoration">✨</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 快速入口 -->
      <section class="quick-actions">
        <div class="action-card" @click="goToLeaderboard">
          <div class="action-icon-wrapper">
            <span class="action-icon">🏆</span>
          </div>
          <span class="action-title">排行榜</span>
          <span class="action-desc">看看谁最厉害</span>
        </div>
        <div class="action-card" @click="goToRecords">
          <div class="action-icon-wrapper">
            <span class="action-icon">📊</span>
          </div>
          <span class="action-title">我的记录</span>
          <span class="action-desc">查看成长历程</span>
        </div>
        <div class="action-card" @click="showSettings = true">
          <div class="action-icon-wrapper">
            <span class="action-icon">⚙️</span>
          </div>
          <span class="action-title">设置</span>
          <span class="action-desc">个性化配置</span>
        </div>
      </section>

      <!-- 创作者中心模块 -->
      <section class="creator-center-module">
        <div class="module-header">
          <h3 class="module-title">
            <span class="title-icon">🎨</span>
            <span class="title-text">创作者中心</span>
          </h3>
          <router-link to="/creator-center" class="module-link">更多功能 →</router-link>
        </div>
        <div class="module-content">
          <div class="creator-features">
            <div class="feature-card" @click="navigateToCreatorCenter('my-themes')">
              <div class="feature-icon-wrapper">
                <span class="feature-icon">🎨</span>
              </div>
              <div class="feature-info">
                <h4 class="feature-title">我的主题</h4>
                <p class="feature-desc">管理你的个性化主题</p>
              </div>
            </div>
            <div class="feature-card" @click="navigateToCreatorCenter('create')">
              <div class="feature-icon-wrapper">
                <span class="feature-icon">✨</span>
              </div>
              <div class="feature-info">
                <h4 class="feature-title">主题创作</h4>
                <p class="feature-desc">打造专属主题风格</p>
              </div>
            </div>
            <div class="feature-card" @click="navigateToCreatorCenter('store')">
              <div class="feature-icon-wrapper">
                <span class="feature-icon">🛍️</span>
              </div>
              <div class="feature-info">
                <h4 class="feature-title">主题商店</h4>
                <p class="feature-desc">发现精美主题</p>
              </div>
            </div>
            <div class="feature-card" @click="navigateToCreatorCenter('theme-switcher')">
              <div class="feature-icon-wrapper">
                <span class="feature-icon">🎯</span>
              </div>
              <div class="feature-info">
                <h4 class="feature-title">切换主题</h4>
                <p class="feature-desc">更换系统主题</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 家长信息卡片 -->
      <section class="parents-section" v-if="parents.length > 0">
        <h3 class="section-title">
          <span class="title-icon">👨‍👩‍👧</span>
          <span class="title-text">我的家长</span>
          <span class="title-count">{{ parents.length }}位</span>
        </h3>
        <div class="parents-slider">
          <div class="parents-track">
            <div
              v-for="parent in parents"
              :key="parent.parentId"
              class="parent-card"
              :class="{ primary: parent.isPrimary }"
            >
              <div class="parent-avatar-wrapper">
                <span class="parent-avatar">{{ parent.avatar || '👨' }}</span>
                <span v-if="parent.isPrimary" class="primary-badge">主要</span>
              </div>
              <div class="parent-info">
                <span class="parent-name">{{ parent.nickname || parent.username }}</span>
                <span class="parent-role">{{ getRoleName(parent.roleType) }}</span>
              </div>
              <div class="parent-status online"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- 游戏分类 -->
      <section class="categories-section">
        <h3 class="section-title">
          <span class="title-icon">🎮</span>
          <span class="title-text">游戏分类</span>
        </h3>
        <div class="categories-grid">
          <div
            v-for="category in categories"
            :key="category.id"
            class="category-card"
            :class="{ active: currentCategory === category.id }"
            @click="selectCategory(category.id)"
          >
            <span class="category-icon">{{ category.icon }}</span>
            <span class="category-name">{{ category.name }}</span>
            <span class="category-count">{{ category.count }}个</span>
          </div>
        </div>
      </section>

      <!-- 游戏列表 -->
      <GameListSection
        variant="kids"
        :show-categories="false"
        :show-count="false"
        :show-view-all="false"
        :categories="categories"
        :current-category="currentCategory"
        :current-category-name="getCurrentCategoryName()"
        :filtered-games="filteredGames"
        :is-loading="gameStore.isLoading"
        @select-category="selectCategory"
        @play-game="handleGameClick"
      />

      <!-- 每日推荐 -->
      <section class="daily-recommend">
        <h3 class="section-title">
          <span class="title-icon">⭐</span>
          <span class="title-text">每日推荐</span>
          <span class="title-badge">今日精选</span>
        </h3>
        <div class="recommend-card">
          <div class="recommend-content">
            <div class="recommend-icon">🌟</div>
            <div class="recommend-info">
              <h4 class="recommend-title">算术大冒险</h4>
              <p class="recommend-desc">通过有趣的算术游戏，提升你的数学能力！</p>
              <div class="recommend-stats">
                <span>⭐ 4.8分</span>
                <span>👥 10k+人玩</span>
                <span class="hot-stat">🔥 超热门</span>
              </div>
            </div>
          </div>
          <button class="recommend-play-btn">立即开始</button>
        </div>
      </section>
    </main>

    <!-- 底部导航 - 移动端 -->
    <nav class="bottom-nav">
      <div class="nav-item" :class="{ active: currentPage === 'home' }" @click="currentPage = 'home'">
        <span class="nav-icon">🏠</span>
        <span class="nav-text">首页</span>
      </div>
      <div class="nav-item" :class="{ active: currentPage === 'games' }" @click="currentPage = 'games'">
        <span class="nav-icon">🎮</span>
        <span class="nav-text">游戏</span>
      </div>
      <div class="nav-item" :class="{ active: currentPage === 'rank' }" @click="goToLeaderboard">
        <span class="nav-icon">🏆</span>
        <span class="nav-text">排行</span>
      </div>
      <div class="nav-item" :class="{ active: currentPage === 'profile' }" @click="showSettings = true">
        <span class="nav-icon">👤</span>
        <span class="nav-text">我的</span>
      </div>
    </nav>

    <!-- 提示消息 -->
    <div v-if="toast.show" class="toast-message" :class="`toast-${toast.type}`">
      <span class="toast-icon">{{ toast.icon }}</span>
      <span class="toast-text">{{ toast.message }}</span>
    </div>

    <!-- 确认弹窗 -->
    <KidSimpleConfirmModal
      v-model:show="modal.show"
      :title="modal.title"
      :message="modal.message"
      :cancel-text="modal.cancelText"
      :confirm-text="modal.confirmText"
      @cancel="modal.onCancel"
      @confirm="modal.onConfirm"
    />

    <!-- 退出登录确认弹窗 -->
    <KidUnifiedModalV2
      v-model:show="showLogoutConfirm"
      title="退出登录"
      type="question"
      icon="🚪"
      :closable="true"
      @confirm="confirmLogout"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/core/store/user.store';
import { useGameStore } from '@/core/store/game.store';
import { useThemeStore } from '@/core/store';
import { handleApiError } from '@/utils/error-handler.util';
import { gameApi } from '@/services/game-api.service';
import { modal } from '@/composables/useUnifiedModalV2';
import KidUnifiedModalV2 from '@/components/ui/KidUnifiedModalV2.vue';
import GameListSection from '@/components/game/GameListSection.vue';
import BaseHeader from '@/components/layout/BaseHeader.vue';
import { gameThemeLoader } from '@/core/game-theme/GameThemeLoader';

const router = useRouter();
const userStore = useUserStore();
const gameStore = useGameStore();
const themeStore = useThemeStore();

// 状态
const currentCategory = ref('all');
const showNotifications = ref(false);
const showAvatarPicker = ref(false);
const showSettings = ref(false);
const showLogoutConfirm = ref(false);
const unreadCount = ref(2);
const currentPage = ref('home');
const avatarAnimating = ref(false);

// 提示消息
const toast = ref({
  show: false,
  message: '',
  type: 'info',
  icon: '💡'
});

function showToast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
  const icons = {
    info: '💡',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  toast.value = {
    show: true,
    message,
    type,
    icon: icons[type]
  };
  setTimeout(() => {
    toast.value.show = false;
  }, 3000);
}

// 确认弹窗
const modal = ref({
  show: false,
  title: '',
  message: '',
  icon: '💡',
  confirmText: '确定',
  cancelText: '取消',
  onConfirm: () => {},
  onCancel: () => {}
});

function showConfirm(options: {
  title: string;
  message: string;
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}) {
  // 逐个属性更新，保持响应式
  modal.value.show = true;
  modal.value.title = options.title;
  modal.value.message = options.message;
  modal.value.icon = options.icon || '💡';
  modal.value.confirmText = options.confirmText || '确定';
  modal.value.cancelText = options.cancelText || '取消';
  modal.value.onConfirm = () => {
    options.onConfirm();
    modal.value.show = false;
  };
  modal.value.onCancel = () => {
    options.onCancel?.();
    modal.value.show = false;
  };
}

// 数据
const categories = ref([
  { id: 'all', name: '全部', icon: '🎯', count: 0 },
  { id: 'creative', name: '手工', icon: '🎨', count: 3 },
  { id: 'puzzle', name: '益智', icon: '🧩', count: 4 },
  { id: 'math', name: '数学', icon: '🔢', count: 2 },
  { id: 'adventure', name: '冒险', icon: '⚔️', count: 2 },
  { id: 'music', name: '音乐', icon: '🎵', count: 1 },
  { id: 'sports', name: '运动', icon: '⚽', count: 1 },
]);

const parents = ref<any[]>([]);

// 带主题信息的游戏列表
const gamesWithThemes = ref<any[]>([]);

// 计算属性
const userLevel = computed(() => {
  const points = totalPoints.value;
  if (points < 100) return 1;
  if (points < 300) return 2;
  if (points < 600) return 3;
  if (points < 1000) return 4;
  return 5;
});

const fatiguePoints = computed(() => {
  return userStore.currentUser?.fatiguePoints || 10;
});

const totalPoints = computed(() => {
  return userStore.currentUser?.dailyAnswerPoints || 0;
});

const currentGradeName = computed(() => {
  const grade = userStore.currentUser?.grade;
  const gradeMap: Record<string, string> = {
    '1': '一年级',
    '2': '二年级',
    '3': '三年级',
    '4': '四年级',
    '5': '五年级',
    '6': '六年级',
  };
  return gradeMap[grade || ''] || '未设置';
});

const winStreak = computed(() => {
  return Math.floor(Math.random() * 10) + 1;
});

// 主题功能已移动到创作者中心

const filteredGames = computed(() => {
  let games = gamesWithThemes.value.length > 0 ? gamesWithThemes.value : gameStore.gameList;
  
  if (currentCategory.value !== 'all') {
    games = games.filter(game => game.category === currentCategory.value);
  }
  
  // 添加默认值（如果还没有）
  games.forEach(game => {
    if (!game.rating) game.rating = (Math.random() * 2 + 3).toFixed(1);
    if (!game.playCount) game.playCount = Math.floor(Math.random() * 5000) + 500;
    if (!game.isNew) game.isNew = Math.random() > 0.85;
    if (!game.isHot) game.isHot = Math.random() > 0.8;
  });
  
  return games;
});

// 为每个游戏加载默认主题名称
async function loadDefaultThemesForGames() {
  try {
    const gamesWithThemes = await Promise.all(
      gameStore.gameList.map(async (game: any) => {
        try {
          // 获取游戏的主题列表
          const themes = await gameThemeLoader.getGameThemes(game.gameCode);
          
          // 查找默认主题（第一个主题作为默认）
          const defaultTheme = themes && themes.length > 0 ? themes[0] : null;
          
          return {
            ...game,
            defaultThemeName: defaultTheme ? defaultTheme.themeName : undefined,
          };
        } catch (error) {
          console.warn(`[KidsHome] 加载游戏 ${game.gameCode} 的主题失败:`, error);
          return { ...game, defaultThemeName: undefined };
        }
      })
    );
    
    // 更新游戏列表（添加主题信息）
    // 注意：这里不直接修改 gameStore，只影响当前显示的数据
    return gamesWithThemes;
  } catch (error) {
    console.error('[KidsHome] 批量加载主题失败:', error);
    return gameStore.gameList;
  }
}

// 方法
function getStarStyle(index: number) {
  const size = Math.random() * 20 + 10;
  const left = Math.random() * 100;
  const top = Math.random() * 100;
  const delay = Math.random() * 3;
  const duration = Math.random() * 2 + 2;
  
  return {
    '--star-size': `${size}px`,
    '--star-left': `${left}%`,
    '--star-top': `${top}%`,
    '--star-delay': `${delay}s`,
    '--star-duration': `${duration}s`,
  };
}

function getLevelClass(level: number): string {
  if (level <= 2) return 'bronze';
  if (level <= 4) return 'silver';
  return 'gold';
}

function getLevelProgress(): number {
  const progress = (totalPoints.value % 100) / 100 * 100;
  return Math.round(progress);
}

function getFatigueColor(): string {
  const points = fatiguePoints.value;
  if (points <= 3) return 'linear-gradient(90deg, #ef4444, #dc2626)';
  if (points <= 6) return 'linear-gradient(90deg, #f59e0b, #d97706)';
  return 'linear-gradient(90deg, #10b981, #059669)';
}

function getRoleName(roleType: number): string {
  const roles: Record<number, string> = {
    1: '爸爸',
    2: '妈妈',
    3: '监护人',
    4: '辅导员',
  };
  return roles[roleType] || '家长';
}

function formatPlayCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

function getCurrentCategoryName(): string {
  const category = categories.value.find(c => c.id === currentCategory.value);
  return category ? category.name : '全部游戏';
}

function selectCategory(categoryId: string) {
  currentCategory.value = categoryId;
}

// 主题功能已移动到创作者中心

async function handleGameClick(game: any) {
  try {
    if (fatiguePoints.value <= 0) {
      showToast('疲劳点不足，休息一下再来吧！', 'warning');
      return;
    }

    const sessionId = await gameApi.start(userStore.currentUser?.id, game.gameId);

    gameStore.currentSession = {
      sessionId,
      gameId: game.gameId,
      gameCode: game.gameCode,
      gameName: game.gameName,
      userId: userStore.currentUser?.kidId,
      startTime: Date.now(),
      duration: 0,
      score: 0,
      status: 'playing' as const
    };

    router.push(`/game/${game.gameCode}`);
  } catch (err) {
    const error = handleApiError(err);
    showToast(error.message, 'error');
  }
}

function goToLeaderboard() {
  router.push('/leaderboard');
}

function goToRecords() {
  router.push('/records');
}

// 导航到创作者中心
function navigateToCreatorCenter(tabId?: string) {
  if (tabId) {
    router.push(`/creator-center?tab=${tabId}`);
  } else {
    router.push('/creator-center');
  }
}

function logout() {
  showLogoutConfirm.value = true;
}

function confirmLogout() {
  userStore.logoutKid();
  showLogoutConfirm.value = false;
  router.push('/login');
  showToast('已退出登录', 'info');
}

function isImageUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/');
}

// 生命周期
onMounted(async () => {
  // 初始化主题系统
  themeStore.init();

  userStore.restoreFromStorage();

  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }

  // 加载游戏列表
  await gameStore.loadGameList(userStore.currentUser?.grade);
  
  // 为游戏加载默认主题名称
  gamesWithThemes.value = await loadDefaultThemesForGames();
  
  // 更新分类数量
  categories.value.forEach(cat => {
    if (cat.id === 'all') {
      cat.count = gameStore.gameList.length;
    } else {
      cat.count = gameStore.gameList.filter(g => g.category === cat.id).length;
    }
  });
  
  // 头像动画
  avatarAnimating.value = true;
  setTimeout(() => {
    avatarAnimating.value = false;
  }, 600);
});

onUnmounted(() => {
  themeStore.cleanup();
});
</script>

<style scoped>
/* ========== 容器与背景 ========== */
.kids-home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #ffecd2 100%);
  position: relative;
  overflow-x: hidden;
}

.bg-stars {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.bg-star {
  position: absolute;
  width: var(--star-size);
  height: var(--star-size);
  background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%);
  border-radius: 50%;
  left: var(--star-left);
  top: var(--star-top);
  animation: float var(--star-duration) ease-in-out infinite;
  animation-delay: var(--star-delay);
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-20px) scale(1.2);
    opacity: 1;
  }
}

/* ========== 顶部导航栏 ========== */
.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.logo-icon {
  font-size: 2rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.logo-text {
  font-size: 1.4rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-decoration {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.decoration-star {
  font-size: 1.2rem;
  animation: starTwinkle 1.5s ease-in-out infinite;
}

.decoration-star:nth-child(2) {
  animation-delay: 0.5s;
}

.decoration-star:nth-child(3) {
  animation-delay: 1s;
}

@keyframes starTwinkle {
  0%, 100% { opacity: 1; transform: rotate(0deg); }
  50% { opacity: 0.5; transform: rotate(15deg); }
}

.level-badge {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.5rem;
  border-radius: 25px;
  font-weight: bold;
  overflow: hidden;
}

.level-badge.level-bronze {
  background: linear-gradient(135deg, #cd7f32, #b87333);
  color: white;
}

.level-badge.level-silver {
  background: linear-gradient(135deg, #d1d5db, #9ca3af);
  color: white;
}

.level-badge.level-gold {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #333;
}

.level-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.8);
  transition: width 0.5s ease;
}

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-3px); }
}

/* 主题切换器 */
/* 创作者中心链接 */
.creator-center-link {
  text-decoration: none;
}

.theme-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.theme-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.theme-icon {
  font-size: 1.3rem;
}

/* 主题功能已移动到创作者中心 */

.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: white;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-info:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  overflow: hidden;
  transition: all 0.3s;
}

.user-avatar.animate {
  animation: avatarPop 0.6s ease-out;
}

@keyframes avatarPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.user-role {
  font-size: 0.7rem;
  color: #8b5cf6;
  font-weight: 500;
}

.exit-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.exit-btn:hover {
  background: #fee2e2;
  transform: scale(1.05);
}

.exit-icon {
  font-size: 1.2rem;
}

/* ========== 主内容区 ========== */
.kids-main {
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
  z-index: 1;
}

/* ========== 欢迎横幅 ========== */
.welcome-banner {
  position: relative;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%);
  border-radius: 24px;
  padding: 2.5rem;
  margin-bottom: 2rem;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(255, 215, 0, 0.3);
}

.banner-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.banner-shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.08;
}

.shape-1 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #a8edea, #fed6e3);
  top: -50px;
  right: -50px;
  animation: floatShape 8s ease-in-out infinite;
}

.shape-2 {
  width: 150px;
  height: 150px;
  background: linear-gradient(135deg, #ffecd2, #fcb69f);
  bottom: -30px;
  left: -30px;
  animation: floatShape 6s ease-in-out infinite reverse;
}

.shape-3 {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #a8edea, #fed6e3);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: floatShape 10s ease-in-out infinite;
}

@keyframes floatShape {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-30px) rotate(180deg); }
}

.welcome-content {
  position: relative;
  text-align: center;
}

.welcome-emoji {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce 1s ease-in-out infinite;
}

.welcome-title {
  font-size: 2.2rem;
  font-weight: 800;
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-subtitle {
  font-size: 1.2rem;
  color: #666;
  margin: 0 0 2rem 0;
  font-weight: 500;
}

.welcome-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-card.stat-float {
  animation: cardFloat 3s ease-in-out infinite;
}

.stat-card:nth-child(1) { animation-delay: 0s; }
.stat-card:nth-child(2) { animation-delay: 0.5s; }
.stat-card:nth-child(3) { animation-delay: 1s; }
.stat-card:nth-child(4) { animation-delay: 1.5s; }

@keyframes cardFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.stat-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-icon-wrapper {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.stat-icon-wrapper.stat-icon-fire {
  background: linear-gradient(135deg, #ff6b35, #ff8e53);
  border: 2px solid #ff8e53;
  position: relative;
  overflow: hidden;
  animation: firePulse 1.5s ease-in-out infinite;
}

.stat-icon-wrapper.stat-icon-fire .stat-icon {
  font-size: 2rem;
  position: relative;
  z-index: 2;
}

@keyframes firePulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

.stat-icon {
  font-size: 1.8rem;
}

.stat-info {
  text-align: left;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.25rem;
  display: block;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #333;
  display: block;
}

.stat-value.warning {
  color: #ef4444;
}

.stat-progress {
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  margin-top: 0.5rem;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.stat-decoration {
  position: absolute;
  bottom: 10px;
  right: 10px;
  font-size: 1.5rem;
  opacity: 0.3;
}

/* ========== 快速入口 ========== */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.action-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.action-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.action-icon {
  font-size: 2rem;
}

.action-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
  display: block;
  margin-bottom: 0.5rem;
}

.action-desc {
  font-size: 0.85rem;
  color: #666;
}

/* ========== 家长信息 ========== */
.parents-section {
  margin-bottom: 2rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 1.5rem;
}

.title-icon {
  font-size: 1.8rem;
}

.title-text {
  flex: 1;
}

.title-count {
  font-size: 0.9rem;
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

.title-badge {
  font-size: 0.75rem;
  background: linear-gradient(135deg, #f472b6, #ec4899);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 600;
}

.parents-slider {
  overflow-x: auto;
  padding-bottom: 0.5rem;
  -webkit-overflow-scrolling: touch;
}

.parents-slider::-webkit-scrollbar {
  height: 4px;
}

.parents-slider::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.3);
  border-radius: 2px;
}

.parents-track {
  display: flex;
  gap: 1rem;
  padding: 0.5rem;
}

.parent-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  border-radius: 16px;
  padding: 1rem 1.25rem;
  min-width: 250px;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.parent-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.parent-card.primary {
  border: 2px solid #f472b6;
  background: linear-gradient(135deg, #fce7f3, #fff);
}

.parent-avatar-wrapper {
  position: relative;
}

.parent-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.primary-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: linear-gradient(135deg, #f472b6, #ec4899);
  color: white;
  font-size: 0.6rem;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  font-weight: bold;
}

.parent-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.parent-name {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.parent-role {
  font-size: 0.8rem;
  color: #666;
}

.parent-status {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 10px #10b981;
}

/* ========== 游戏分类 ========== */
.categories-section {
  margin-bottom: 2rem;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
}

.category-card {
  background: white;
  border-radius: 16px;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
}

.category-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.category-card.active {
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  color: white;
  border-color: transparent;
}

.category-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.category-name {
  font-size: 0.95rem;
  font-weight: 600;
  display: block;
  margin-bottom: 0.25rem;
}

.category-count {
  font-size: 0.75rem;
  opacity: 0.8;
}

/* ========== 游戏列表 ========== */
.games-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.view-all-btn {
  padding: 0.5rem 1.25rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.view-all-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.games-loading,
.games-empty {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e5e7eb;
  border-top-color: #8b5cf6;
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 1rem;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.game-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}

.game-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.game-cover {
  position: relative;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
}

.game-icon {
  font-size: 4rem;
  transition: transform 0.3s;
}

.game-card:hover .game-icon {
  transform: scale(1.1);
}

.game-tags {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 0.5rem;
}

.game-tag {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: bold;
}

.tag-new {
  background: #10b981;
  color: white;
}

.tag-hot {
  background: linear-gradient(135deg, #ff6b35, #ff8e53);
  color: white;
  font-weight: 900;
  font-size: 0.7rem;
  padding: 0.3rem 0.75rem;
  animation: firePulseTag 1.5s ease-in-out infinite;
  border-radius: 4px;
  border: 1.5px solid #ff9c70;
}

@keyframes firePulseTag {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

.game-info {
  padding: 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.game-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.game-desc {
  font-size: 0.85rem;
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.game-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.8rem;
  color: #999;
}

.game-rating {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.rating-star {
  color: #fbbf24;
}

.game-play-btn {
  padding: 0.75rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  color: white;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.game-play-btn:hover {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
}

.play-icon {
  font-size: 0.8rem;
}

/* ========== 每日推荐 ========== */
.daily-recommend {
  margin-bottom: 2rem;
}

.recommend-card {
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  border-radius: 24px;
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  color: white;
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3);
}

.recommend-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
}

.recommend-icon {
  font-size: 4rem;
  animation: pulse 2s ease-in-out infinite;
}

.recommend-info {
  flex: 1;
}

.recommend-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
}

.recommend-desc {
  font-size: 0.95rem;
  opacity: 0.9;
  margin: 0 0 1rem 0;
}

.recommend-stats {
  display: flex;
  gap: 1.5rem;
  font-size: 0.85rem;
  opacity: 0.9;
}

.hot-stat {
  background: linear-gradient(135deg, #ff6b35, #ff8e53);
  padding: 0.3rem 0.75rem;
  border-radius: 4px;
  font-weight: 800;
  animation: firePulseTag 1.5s ease-in-out infinite;
  border: 1.5px solid #ff9c70;
}

.recommend-play-btn {
  padding: 1rem 2rem;
  background: white;
  color: #8b5cf6;
  border: none;
  border-radius: 25px;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.recommend-play-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

/* ========== 底部导航 ========== */
.bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: white;
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.1);
  z-index: 100;
  padding: 0.5rem;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.3s;
  flex: 1;
}

.nav-item.active {
  color: #8b5cf6;
}

.nav-item.active .nav-icon {
  transform: scale(1.2);
}

.nav-icon {
  font-size: 1.5rem;
  transition: transform 0.3s;
}

.nav-text {
  font-size: 0.75rem;
  font-weight: 500;
}

/* ========== 响应式设计 ========== */
@media (max-width: 1024px) {
  .kids-main {
    padding: 1.5rem;
  }

  .welcome-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .games-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }

  .quick-actions {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .bottom-nav {
    display: flex;
  }

  .kids-main {
    padding: 1rem;
    padding-bottom: 80px;
  }

  .header-center {
    display: none;
  }

  .header-decoration {
    display: none;
  }

  .welcome-banner {
    padding: 1.5rem;
  }

  .welcome-emoji {
    font-size: 3rem;
  }

  .welcome-title {
    font-size: 1.5rem;
  }

  .welcome-subtitle {
    font-size: 1rem;
  }

  .welcome-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-icon-wrapper {
    width: 40px;
    height: 40px;
  }

  .stat-icon {
    font-size: 1.5rem;
  }

  .stat-value {
    font-size: 1.2rem;
  }

  .quick-actions {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .action-card {
    padding: 1rem;
  }

  .action-icon-wrapper {
    width: 45px;
    height: 45px;
  }

  .action-icon {
    font-size: 1.5rem;
  }

  .action-title {
    font-size: 0.95rem;
  }

  .action-desc {
    font-size: 0.75rem;
  }

  .categories-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }

  .category-icon {
    font-size: 1.5rem;
  }

  .category-name {
    font-size: 0.85rem;
  }

  .games-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1rem;
  }

  .game-cover {
    padding: 1.5rem;
    min-height: 120px;
  }

  .game-icon {
    font-size: 3rem;
  }

  .game-info {
    padding: 1rem;
  }

  .game-name {
    font-size: 1rem;
  }

  .recommend-card {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
  }

  .recommend-content {
    flex-direction: column;
  }

  .recommend-stats {
    justify-content: center;
    flex-wrap: wrap;
  }

  .recommend-play-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .kids-header {
    padding: 0.75rem 1rem;
  }

  .logo-text {
    font-size: 1.1rem;
  }

  .user-details {
    display: none;
  }

  .notification-btn,
  .exit-btn,
  .theme-btn {
    width: 36px;
    height: 36px;
  }

  .user-avatar {
    width: 36px;
    height: 36px;
    font-size: 1.5rem;
  }

  .welcome-banner {
    padding: 1.25rem;
  }

  .welcome-stats {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    grid-template-columns: 1fr;
  }

  .categories-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .games-grid {
    grid-template-columns: 1fr;
  }
}

/* ========== 提示消息 ========== */
.toast-message {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 1000;
  animation: toastSlide 0.3s ease-out;
  min-width: 300px;
  max-width: 90%;
}

@keyframes toastSlide {
  from {
    transform: translateX(-50%) translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

.toast-icon {
  font-size: 1.5rem;
}

.toast-text {
  font-size: 0.95rem;
  color: #333;
  font-weight: 500;
}

.toast-info {
  border-left: 4px solid #8b5cf6;
}

.toast-success {
  border-left: 4px solid #10b981;
}

.toast-warning {
  border-left: 4px solid #f59e0b;
}

.toast-error {
  border-left: 4px solid #ef4444;
}

/* ========== 创作者中心模块 ========== */
.creator-center-module {
  background: linear-gradient(135deg, #f8f9ff 0%, #e6e9ff 100%);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 32px;
  border: 2px solid #e0e7ff;
  box-shadow: 0 8px 24px rgba(78, 205, 196, 0.1);
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.module-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.title-icon {
  font-size: 24px;
}

.title-text {
  background: linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.module-link {
  color: #4ECDC4;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.module-link:hover {
  color: #45B7D1;
  transform: translateX(2px);
}

.creator-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.feature-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(78, 205, 196, 0.15);
  border-color: #4ECDC4;
}

.feature-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-icon {
  font-size: 28px;
  color: white;
}

.feature-info {
  flex: 1;
}

.feature-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
}

.feature-desc {
  font-size: 13px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .creator-features {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .creator-center-module {
    padding: 20px;
  }
  
  .feature-card {
    flex-direction: column;
    text-align: center;
    padding: 16px;
  }
  
  .feature-icon-wrapper {
    width: 48px;
    height: 48px;
  }
  
  .feature-icon {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .creator-features {
    grid-template-columns: 1fr;
  }
  
  .module-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .module-link {
    align-self: flex-end;
  }
}</style>
