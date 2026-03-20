<template>
  <div class="home-container">
    <!-- 页面消息提示 -->
    <div v-if="pageMessage" class="page-message" :class="pageMessageType">
      <span class="message-icon">{{ getMessageIcon(pageMessageType) }}</span>
      <span class="message-text">{{ pageMessage }}</span>
    </div>

    <!-- 头部导航 -->
    <header class="home-header">
      <div class="header-left">
        <h1 class="logo">🎮 儿童游戏平台</h1>
        <button @click="showGradeSelector = true" class="grade-btn">
          📚 {{ currentGradeName }}
        </button>
      </div>
      <div class="header-center">
        <SearchBox
          :games="gameStore.gameList"
          @search="handleSearch"
          @select="handleGameSelect"
        />
      </div>
      <div class="header-right">
        <div v-if="userStore.currentUser" class="user-info">
          <span class="user-avatar">{{ userStore.avatar }}</span>
          <span class="user-name">{{ userStore.username }}</span>
        </div>
        <button @click="showParentModal = true" class="parent-btn">
          👨‍👩‍👧 家长区
        </button>
        <button @click="handleLogout" class="logout-btn" title="退出登录">
          🚪 退出
        </button>
        <button class="hamburger-btn" @click="showMobileMenu = true">
          ☰
        </button>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="home-main">
      <!-- 搜索结果 -->
      <section v-if="searchKeyword" class="search-results-section">
        <h2 class="section-title">
          🔍 搜索结果：{{ searchKeyword }}
          <button @click="clearSearch" class="clear-search-btn">清除</button>
        </h2>
        <div v-if="searchResults.length === 0" class="empty">
          未找到相关游戏
        </div>
        <div v-else class="game-grid">
          <UnifiedGameCard
            v-for="game in searchResults"
            :key="game.gameId"
            :game="game"
            variant="blue-purple"
            @play="startGame(game)"
          />
        </div>
      </section>

      <!-- 正常内容 -->
      <template v-else>
        <!-- Banner 轮播 -->
        <section class="banner-section">
          <div class="banner-container">
            <div
              v-for="(banner, index) in banners"
              :key="banner.id"
              class="banner-slide"
              :class="{ active: currentBannerIndex === index }"
            >
              <div class="banner-content">
                <h2>{{ banner.title }}</h2>
                <p>{{ banner.description }}</p>
                <button
                  v-if="banner.action"
                  @click="handleBannerAction(banner)"
                  class="banner-btn"
                >
                  {{ banner.btnText }}
                </button>
              </div>
            </div>
          </div>
          <div class="banner-indicators">
            <div
              v-for="(banner, index) in banners"
              :key="index"
              class="indicator"
              :class="{ active: currentBannerIndex === index }"
              @click="currentBannerIndex = index"
            ></div>
          </div>
        </section>

        <!-- 游戏分类 -->
        <section class="category-section">
          <div class="category-tabs">
            <button
              v-for="category in categories"
              :key="category.id"
              class="category-tab"
              :class="{ active: currentCategory === category.id }"
              @click="currentCategory = category.id"
            >
              {{ category.name }}
            </button>
          </div>
        </section>

        <!-- 今日推荐 -->
        <section class="recommended-section">
          <h2 class="section-title">🔥 今日推荐</h2>
          <div class="game-grid">
            <GameCard
              v-for="game in recommendedGames"
              :key="game.gameId"
              :game="game"
              @play="startGame(game)"
            />
          </div>
        </section>

        <!-- 游戏列表 -->
        <section class="game-list-section">
          <h2 class="section-title">
            🎮 {{ currentCategoryName }}
          </h2>
          <div v-if="gameStore.isLoading" class="loading">
            加载中...
          </div>
          <div v-else-if="filteredGames.length === 0" class="empty">
            该分类暂无游戏
          </div>
          <div v-else class="game-grid">
            <UnifiedGameCard
              v-for="game in filteredGames"
              :key="game.gameId"
              :game="game"
              variant="blue-purple"
              @play="startGame(game)"
            />
          </div>
        </section>

        <!-- 最近游戏 -->
        <section v-if="recentGames.length > 0" class="recent-section">
          <h2 class="section-title">🕒 最近游戏</h2>
          <div class="game-grid small-grid">
            <GameCard
              v-for="game in recentGames"
              :key="game.gameId"
              :game="game"
              :size="'small'"
              @play="startGame(game)"
            />
          </div>
        </section>
      </template>
    </main>

    <!-- 个人中心 -->
    <aside class="profile-section">
      <div class="profile-card">
        <div class="avatar-section" @click="changeAvatar">
          <span class="avatar">{{ userStore.avatar }}</span>
          <span class="avatar-tip">点击更换</span>
        </div>
        <h3>{{ userStore.username }}</h3>
        <div class="stats">
          <div class="stat-item">
            <span class="stat-label">疲劳点</span>
            <span class="stat-value" :class="{ low: !userStore.hasFatiguePoints }">
              {{ userStore.currentUser?.fatiguePoints || 0 }}
            </span>
          </div>
          <div class="stat-item">
            <span class="stat-label">年级</span>
            <span class="stat-value">{{ currentGradeName }}</span>
          </div>
        </div>
        <div v-if="!userStore.hasFatiguePoints" class="points-notice">
          <p>💡 疲劳点不足</p>
          <button @click="goToAnswer" class="answer-btn">
            答题赚取
          </button>
        </div>
      </div>
    </aside>

    <!-- 家长验证弹窗 -->
    <KidModal
      v-model:show="showParentModal"
      title="家长验证"
      size="sm"
      :show-cancel="false"
      confirm-text="确认"
      @confirm="verifyParent"
    >
      <input
        v-model="parentPassword"
        type="password"
        placeholder="请输入家长密码"
        class="parent-password-input"
        @keyup.enter="verifyParent"
      />
    </KidModal>

    <!-- 学龄选择弹窗 -->
    <KidUnifiedModalV2
      v-model:show="showGradeSelector"
      title="选择年级"
      type="info"
      icon="📚"
      :closable="true"
    >
      <template #default>
        <div class="grade-options">
          <button
            v-for="grade in grades"
            :key="grade.id"
            class="grade-option"
            :class="{ active: currentGrade === grade.id }"
            @click="selectGrade(grade.id)"
          >
            {{ grade.name }}
          </button>
        </div>
      </template>
    </KidUnifiedModalV2>

    <!-- 移动端菜单 -->
    <div v-if="showMobileMenu" class="mobile-menu" @click="showMobileMenu = false">
      <div class="mobile-menu-content" @click.stop>
        <button class="close-btn" @click="showMobileMenu = false">✕</button>
        <nav class="mobile-nav">
          <router-link to="/" class="nav-item">首页</router-link>
          <router-link to="/answer" class="nav-item">答题中心</router-link>
          <button @click="showParentModal = true; showMobileMenu = false" class="nav-item">
            家长区
          </button>
          <button @click="logout" class="nav-item">退出登录</button>
        </nav>
      </div>
    </div>

    <!-- 全屏Loading遮罩 -->
    <GlobalLoading :loading="isLoading" message="处理中..." />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/core/store/user.store';
import { useGameStore } from '@/core/store/game.store';
import { handleApiError } from '@/utils/error-handler.util';
import GlobalLoading from '@/components/GlobalLoading.vue';
import ErrorDisplay from '@/components/ErrorDisplay.vue';
import { useConfirm } from '@/composables/useDialog';
import GameCard from '@/components/game/GameCard.vue';
import SearchBox from '@/components/ui/SearchBox.vue';
import KidModal from '@/components/ui/KidModal.vue';
import { modal } from '@/composables/useUnifiedModalV2';
import KidUnifiedModalV2 from '@/components/ui/KidUnifiedModalV2.vue';
import { webSocketService } from '@/services/websocket.service';

const router = useRouter();
const userStore = useUserStore();
const gameStore = useGameStore();

// ===== 状态 =====

const currentCategory = ref('all');
const currentGrade = ref('1');
const currentBannerIndex = ref(0);
const parentPassword = ref('');
const searchKeyword = ref('');
const showParentModal = ref(false);
const showGradeSelector = ref(false);
const showMobileMenu = ref(false);
let bannerTimer: number | null = null;

// 页面内消息提示
const pageMessage = ref('');
const pageMessageType = ref<'success' | 'error' | 'warning' | 'info'>('info');

// 全屏loading
const isLoading = ref(false);

// ===== 数据 =====

const banners = ref([
  {
    id: 1,
    title: '新游戏上线',
    description: '快来体验最新的颜色配对游戏！',
    btnText: '立即玩',
    action: 'game',
    gameId: 'creative-1',
  },
  {
    id: 2,
    title: '答题赢疲劳点',
    description: '每天答题，轻松获得疲劳点',
    btnText: '去答题',
    action: 'answer',
  },
  {
    id: 3,
    title: '周末活动',
    description: '周末双倍疲劳点奖励！',
    btnText: '了解更多',
    action: null,
  },
]);

const categories = ref([
  { id: 'all', name: '全部' },
  { id: 'creative', name: '手工创意' },
  { id: 'puzzle', name: '益智拼图' },
  { id: 'math', name: '数字算数' },
  { id: 'adventure', name: '闯关冒险' },
]);

const grades = ref([
  { id: '1', name: '小班' },
  { id: '2', name: '中班' },
  { id: '3', name: '大班' },
  { id: '4', name: '一年级' },
  { id: '5', name: '二年级' },
  { id: '6', name: '三年级' },
  { id: '7', name: '四年级' },
  { id: '8', name: '五年级' },
  { id: '9', name: '六年级' },
]);

// ===== 计算属性 =====

const currentGradeName = computed(() => {
  const grade = grades.value.find(g => g.id === currentGrade.value);
  return grade?.name || '一年级';
});

const currentCategoryName = computed(() => {
  const category = categories.value.find(c => c.id === currentCategory.value);
  return category?.name || '全部';
});

const filteredGames = computed(() => {
  const games = gameStore.gameList.filter(game => {
    // 学龄过滤
    if (!game.grade.includes(currentGrade.value)) {
      return false;
    }
    // 分类过滤
    if (currentCategory.value !== 'all' && game.category !== currentCategory.value) {
      return false;
    }
    return true;
  });
  return games;
});

const searchResults = computed(() => {
  if (!searchKeyword.value.trim()) {
    return [];
  }
  return gameStore.searchGames(searchKeyword.value);
});

const recommendedGames = computed(() => {
  return gameStore.gameList.slice(0, 3);
});

const recentGames = computed(() => {
  return gameStore.getRecentGames().slice(0, 3);
});

// ===== 方法 =====

function getMessageIcon(type: string): string {
  const iconMap: Record<string, string> = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };
  return iconMap[type] || 'ℹ️';
}

function showMessage(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
  pageMessage.value = message;
  pageMessageType.value = type;
  setTimeout(() => {
    pageMessage.value = '';
  }, 3000);
}

function handleSearch(keyword: string) {
  searchKeyword.value = keyword;
}

function handleGameSelect(game: any) {
  startGame(game);
}

function clearSearch() {
  searchKeyword.value = '';
}

async function startGame(game: any) {
  // 检查疲劳点
  if (!userStore.hasFatiguePoints) {
    showMessage('疲劳点不足，请先答题赚取！', 'warning');
    router.push('/answer');
    return;
  }

  try {
    await gameStore.startGame(game.gameId);
    router.push(`/game/${game.gameCode}`);
  } catch (err: any) {
    showMessage(err.message || '启动游戏失败', 'error');
  }
}

function handleBannerAction(banner: any) {
  if (banner.action === 'game' && banner.gameId) {
    const game = gameStore.getGameById(parseInt(banner.gameId));
    if (game) {
      startGame(game);
    }
  } else if (banner.action === 'answer') {
    router.push('/answer');
  }
}

function goToAnswer() {
  router.push('/answer');
}

async function verifyParent() {
  if (parentPassword.value === '123456') {
    showParentModal.value = false;
    router.push('/parent');
  } else {
    showMessage('密码错误', 'error');
  }
}

function selectGrade(gradeId: string) {
  currentGrade.value = gradeId;
  showGradeSelector.value = false;
  showMessage(`已切换到${grades.value.find(g => g.id === gradeId)?.name}`, 'info');
  // 刷新游戏列表
  loadGames();
}

function changeAvatar() {
  const avatars = ['🐱', '🐶', '🐰', '🐻', '🐼', '🦊', '🦁', '🐯'];
  const currentAvatar = userStore.avatar;
  const currentIndex = avatars.indexOf(currentAvatar);
  const nextIndex = (currentIndex + 1) % avatars.length;
  userStore.updateUserInfo({ avatar: avatars[nextIndex] });
}

async function logout() {
  const confirmed = await useConfirm({ message: '确定要退出登录吗？', title: '退出登录' });
  if (confirmed) {
    userStore.logoutKid();
    router.push('/login');
  }
}

function handleLogout() {
  logout();
}

async function loadGames() {
  try {
    isLoading.value = true;
    // 儿童登录时，传递 kidId 以获取授权的游戏列表
    const kidId = userStore.currentUser?.id;
    await gameStore.loadGameList(currentGrade.value, currentCategory.value, kidId);
  } catch (err) {
    console.error('加载游戏列表失败:', err);
    const error = handleApiError(err);
    // 使用默认数据确保页面可显示
    if (gameStore.gameList.length === 0) {
      showMessage('游戏列表加载失败，显示推荐游戏', 'warning');
    } else {
      showMessage(error.message, 'error');
    }
  } finally {
    isLoading.value = false;
  }
}

// ===== Banner 自动轮播 =====

function startBannerAutoPlay() {
  stopBannerAutoPlay();
  bannerTimer = window.setInterval(() => {
    currentBannerIndex.value = (currentBannerIndex.value + 1) % banners.value.length;
  }, 5000);
}

function stopBannerAutoPlay() {
  if (bannerTimer) {
    clearInterval(bannerTimer);
    bannerTimer = null;
  }
}

// ===== 生命周期 =====

onMounted(async () => {
  // 恢复用户状态
  userStore.restoreFromStorage();

  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }

  // 刷新用户疲劳点数据
  try {
    await userStore.refreshFatiguePoints();
  } catch (err) {
    console.error('刷新疲劳点失败:', err);
  }

  // 恢复最近游戏
  gameStore.restoreRecentGames();

  // 加载游戏列表
  await loadGames();

  // 连接 WebSocket
  if (userStore.currentUser) {
    try {
      await webSocketService.initialize(userStore.currentUser.id);

      // 监听疲劳点更新
      webSocketService.onFatiguePointsUpdate((points: number) => {
        userStore.updateFatiguePoints(points);
        showMessage(`疲劳点更新：${points}`, 'info');
      });

      // 监听游戏暂停
      webSocketService.onGamePause((reason: string) => {
        showMessage(`游戏被暂停：${reason}`, 'warning');
      });
    } catch (err) {
      console.error('WebSocket 连接失败:', err);
      // WebSocket 连接失败不影响正常使用
    }
  }

  // 启动 Banner 自动轮播
  startBannerAutoPlay();
});

onUnmounted(() => {
  stopBannerAutoPlay();
  webSocketService.disconnect();
});
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

/* 页面消息提示 */
.page-message {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  padding: 1.2rem 2rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  min-width: 320px;
  max-width: 90%;
  border: 3px solid;
}

@keyframes popIn {
  0% {
    opacity: 0;
    transform: translateX(-50%) scale(0.8) translateY(-10px);
  }
  60% {
    transform: translateX(-50%) scale(1.05) translateY(5px);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) scale(1) translateY(0);
  }
}

.page-message.success {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-color: rgba(34, 197, 94, 0.3);
  color: #059669;
}

.page-message.info {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-color: rgba(59, 130, 246, 0.3);
  color: #2563eb;
}

.message-icon {
  font-size: 2rem;
  animation: bounce 0.6s ease-in-out;
}

@keyframes bounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
}

.message-text {
  font-size: 1.1rem;
  font-weight: 600;
  flex: 1;
}

/* 头部导航 */
.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 500px;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.grade-btn {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.grade-btn:hover {
  background: #764ba2;
  transform: translateY(-2px);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border-radius: 20px;
}

.user-avatar {
  font-size: 1.5rem;
}

.user-name {
  font-weight: 500;
  color: #333;
}

.parent-btn {
  padding: 0.5rem 1rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.parent-btn:hover {
  background: #d97706;
  transform: translateY(-2px);
}

.logout-btn {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.logout-btn:hover {
  background: #dc2626;
  transform: translateY(-2px);
}

.hamburger-btn {
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
}

/* 主内容区 */
.home-main {
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem;
  padding-right: 300px; /* 为右侧个人中心留出空间 */
}

/* Banner 轮播 */
.banner-section {
  margin-bottom: 2rem;
}

.banner-container {
  position: relative;
  height: 300px;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.banner-slide {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
  transition: opacity 0.5s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-slide.active {
  opacity: 1;
}

.banner-content {
  text-align: center;
  color: white;
}

.banner-content h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.banner-content p {
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.banner-btn {
  padding: 0.75rem 2rem;
  background: white;
  color: #f5576c;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
}

.banner-indicators {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
}

.indicator.active {
  background: white;
}

/* 游戏分类 */
.category-section {
  margin-bottom: 2rem;
}

.category-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.category-tab {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.category-tab.active {
  background: white;
  color: #667eea;
  font-weight: bold;
}

/* 搜索结果 */
.search-results-section {
  margin-bottom: 2rem;
}

.clear-search-btn {
  padding: 0.5rem 1rem;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-left: 1rem;
  transition: all 0.3s;
}

.clear-search-btn:hover {
  background: #eef2ff;
  transform: translateY(-2px);
}

/* 游戏列表 */
.section-title {
  color: white;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.loading,
.empty {
  text-align: center;
  color: white;
  padding: 2rem;
}

/* 个人中心 */
.profile-section {
  position: fixed;
  right: 2rem;
  top: 100px;
  width: 260px;
  z-index: 50;
}

.profile-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  text-align: center;
}

.avatar-section {
  position: relative;
  margin-bottom: 1rem;
  display: inline-block;
}

.avatar {
  font-size: 4rem;
  cursor: pointer;
  transition: transform 0.3s;
  display: block;
}

.avatar:hover {
  transform: scale(1.1);
}

.avatar-tip {
  display: block;
  font-size: 0.75rem;
  color: #999;
  margin-top: 0.25rem;
}

.profile-card h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.2rem;
}

.stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 1rem;
  padding: 1rem 0;
  background: #f9fafb;
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
}

.stat-value.low {
  color: #ef4444;
}

.points-notice {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 0.75rem;
  margin-top: 1rem;
}

.points-notice p {
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  color: #92400e;
}

.answer-btn {
  width: 100%;
  padding: 0.6rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.answer-btn:hover {
  background: #d97706;
  transform: translateY(-2px);
}

/* 弹窗 */
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
  border-radius: 16px;
  padding: 2rem;
  min-width: 300px;
  max-width: 90%;
}

.modal h2 {
  margin-top: 0;
  margin-bottom: 1rem;
}

.modal input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-secondary,
.btn-primary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-secondary {
  background: #e5e7eb;
}

.btn-primary {
  background: #667eea;
  color: white;
}

/* 学龄选项 */
.grade-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.grade-option {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.grade-option.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* 移动端菜单 */
.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.mobile-menu-content {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 250px;
  background: white;
  padding: 2rem;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.mobile-nav {
  margin-top: 3rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.nav-item {
  padding: 1rem;
  text-align: left;
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  text-decoration: none;
  color: #333;
  border-radius: 8px;
  transition: background 0.3s;
}

.nav-item:hover {
  background: #f3f4f6;
}

/* 响应式 */
@media (max-width: 1024px) {
  .home-header {
    gap: 1rem;
  }

  .header-center {
    max-width: 300px;
  }

  .home-main {
    padding-right: 2rem;
  }

  .profile-section {
    position: static;
    width: 100%;
    margin-top: 2rem;
  }
}

@media (max-width: 768px) {
  .home-header {
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
  }

  .header-left {
    width: 100%;
    justify-content: space-between;
  }

  .header-center {
    order: 3;
    width: 100%;
    margin-top: 0.5rem;
  }

  .logo {
    font-size: 1.2rem;
  }

  .grade-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .user-info {
    display: none;
  }

  .hamburger-btn {
    display: block;
  }

  .home-main {
    padding: 1rem;
  }

  .banner-container {
    height: 200px;
  }

  .banner-content h2 {
    font-size: 1.5rem;
  }

  .banner-content p {
    font-size: 1rem;
  }

  .game-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .small-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .grade-options {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .home-header {
    padding: 0.5rem;
  }

  .logo {
    font-size: 1rem;
  }

  .game-grid {
    grid-template-columns: 1fr;
  }

  .small-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .category-tabs {
    gap: 0.25rem;
  }

  .category-tab {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }
}


</style>
