<template>
  <div class="simple-home">
    <!-- 顶部栏 -->
    <header class="top-bar">
      <div class="top-left">
        <h1 class="logo">🎮 趣玩乐园</h1>
      </div>
      <div class="top-center">
        <div class="search-box">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索游戏..."
            class="search-input"
            @keyup.enter="handleSearch"
          />
          <button class="search-btn" @click="handleSearch">🔍</button>
        </div>
      </div>
      <div class="top-right">
        <div v-if="userStore.currentUser" class="user-info">
          <span class="avatar">{{ userStore.avatar }}</span>
          <span class="username">{{ userStore.username }}</span>
        </div>
        <button @click="goToParentCenter" class="center-btn parent-btn">
          👨‍👩‍👧 家长中心
        </button>
        <button @click="goToAdminCenter" class="center-btn admin-btn">
          🛡️ 管理中心
        </button>
        <button @click="handleLogout" class="logout-btn" title="退出登录">
          🚪 退出
        </button>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="main-content">
      <!-- 加载状态 -->
      <div v-if="gameStore.isLoading" class="loading">
        <div class="loader"></div>
        <p>正在加载游戏...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="gameStore.error" class="error">
        <p>{{ gameStore.error }}</p>
        <button @click="reloadGames" class="retry-btn">重试</button>
      </div>

      <!-- 搜索结果 -->
      <section v-else-if="searchKeyword" class="search-results">
        <h2 class="section-title">
          🔍 搜索结果：{{ searchKeyword }}
          <button @click="clearSearch" class="clear-btn">清除</button>
        </h2>
        <div v-if="filteredGames.length === 0" class="empty">未找到相关游戏</div>
        <div v-else class="game-grid">
          <div
            v-for="game in filteredGames"
            :key="game.gameId"
            class="game-card"
            @click="startGame(game)"
          >
            <div class="game-icon">{{ game.iconUrl || '🎮' }}</div>
            <div class="game-name">{{ game.gameName }}</div>
            <div class="game-category">{{ game.category }}</div>
          </div>
        </div>
      </section>

      <!-- 游戏列表 -->
      <template v-else>
        <section class="game-section">
          <h2 class="section-title">🎯 全部游戏</h2>
          <div v-if="gameStore.gameList.length === 0" class="empty">
            暂无游戏，请稍后再来
          </div>
          <div v-else class="game-grid">
            <div
              v-for="game in gameStore.gameList"
              :key="game.gameId"
              class="game-card"
              @click="startGame(game)"
            >
              <div class="game-icon">{{ game.iconUrl || '🎮' }}</div>
              <div class="game-name">{{ game.gameName }}</div>
              <div class="game-category">{{ game.category }}</div>
            </div>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/core/store/user.store';
import { useGameStore } from '@/core/store/game.store';
import type { Game } from '@/services/api.types';

const router = useRouter();
const userStore = useUserStore();
const gameStore = useGameStore();

const searchKeyword = ref('');

// 搜索过滤
const filteredGames = computed(() => {
  if (!searchKeyword.value.trim()) return gameStore.gameList;
  return gameStore.searchGames(searchKeyword.value);
});

function handleSearch() {
  // 搜索已在 computed 中处理
}

function clearSearch() {
  searchKeyword.value = '';
}

function startGame(game: Game) {
  router.push(`/game/${game.gameCode}`);
}

function reloadGames() {
  gameStore.loadGameList(userStore.currentUser?.grade);
}

function handleLogout() {
  userStore.logoutKid();
  router.push('/login');
}

/** 将登录信息同步到 cookie，供 3000 管理端跨端口读取 */
function syncAuthToCookie(): void {
  try {
    const token = localStorage.getItem('authToken') || localStorage.getItem('parentToken');
    const userInfo = localStorage.getItem('userInfo');
    const parentInfo = localStorage.getItem('parentInfo');
    const adminInfo = localStorage.getItem('adminInfo');

    if (token) {
      document.cookie = `cross_auth_token=${encodeURIComponent(token)}; path=/; max-age=300; SameSite=Lax`;
    }
    if (userInfo) document.cookie = `cross_user_info=${encodeURIComponent(userInfo)}; path=/; max-age=300; SameSite=Lax`;
    if (parentInfo) document.cookie = `cross_parent_info=${encodeURIComponent(parentInfo)}; path=/; max-age=300; SameSite=Lax`;
    if (adminInfo) document.cookie = `cross_admin_info=${encodeURIComponent(adminInfo)}; path=/; max-age=300; SameSite=Lax`;
  } catch (e) {
    console.warn('[SimpleHome] syncAuthToCookie failed:', e);
  }
}

function goToParentCenter() {
  syncAuthToCookie();
  window.open('http://localhost:3000/parent', '_blank');
}

function goToAdminCenter() {
  syncAuthToCookie();
  window.open('http://localhost:3000/admin/dashboard', '_blank');
}

onMounted(async () => {
  userStore.restoreFromStorage();

  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }

  await gameStore.loadGameList(userStore.currentUser?.grade);
});
</script>

<style scoped>
.simple-home {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

/* 顶部栏 */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
  gap: 0.5rem;
}

.top-left .logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin: 0;
  white-space: nowrap;
}

.top-center {
  flex: 1;
  max-width: 400px;
  margin: 0 1rem;
}

.search-box {
  display: flex;
  background: #f0f0f0;
  border-radius: 24px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: border-color 0.3s;
}

.search-box:focus-within {
  border-color: #667eea;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.5rem 1rem;
  font-size: 0.95rem;
  outline: none;
}

.search-btn {
  border: none;
  background: transparent;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  font-size: 1rem;
}

.top-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.username {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.center-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
  transition: all 0.3s;
  white-space: nowrap;
}

.parent-btn {
  background: linear-gradient(135deg, #f59e0b, #f97316);
}

.parent-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.admin-btn {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.admin-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.logout-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s;
  white-space: nowrap;
}

.logout-btn:hover {
  background: #fee2e2;
  border-color: #ef4444;
  color: #ef4444;
}

/* 主内容 */
.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: white;
}

.loader {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 4rem;
  color: white;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 20px;
  background: white;
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.retry-btn:hover {
  transform: scale(1.05);
}

.section-title {
  color: white;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.clear-btn {
  font-size: 0.85rem;
  padding: 0.25rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  background: transparent;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.empty {
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
}

/* 游戏网格 */
.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}

.game-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 1.5rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.game-card:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.game-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.game-name {
  color: white;
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.game-category {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
}

/* 响应式 */
@media (max-width: 768px) {
  .top-bar {
    padding: 0.5rem 1rem;
    flex-direction: column;
    align-items: stretch;
  }

  .top-center {
    max-width: none;
    margin: 0;
  }

  .top-right {
    justify-content: center;
  }

  .main-content {
    padding: 1rem;
  }

  .game-grid {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 0.75rem;
  }

  .game-card {
    padding: 1rem 0.75rem;
  }

  .game-icon {
    font-size: 2rem;
  }
}
</style>