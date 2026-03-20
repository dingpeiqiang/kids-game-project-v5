<template>
  <div class="parent-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div v-for="i in 15" :key="i" class="bg-circle" :style="getCircleStyle(i)"></div>
    </div>

    <!-- 顶部导航 -->
    <ParentHeader
      :avatar="userStore.parentAvatar"
      :username="userStore.parentUsername"
      :unread-count="unreadCount"
      @show-notifications="showNotifications = true"
      @show-avatar-picker="showAvatarPicker = true"
      @logout="logout"
    />

    <!-- 主内容区 -->
    <main class="parent-main">
      <!-- 数据概览卡片 -->
      <section class="dashboard-stats">
        <div class="stat-card stat-primary">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">🎮</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats?.game?.todayCount || 0 }}</span>
            <span class="stat-label">今日游戏</span>
            <div class="stat-trend up">
              <span>↑ 12%</span>
              <span>较昨日</span>
            </div>
          </div>
        </div>

        <div class="stat-card stat-secondary">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">⏱️</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ formatDuration(stats?.game?.todayDuration || 0) }}</span>
            <span class="stat-label">游戏时长</span>
            <div class="stat-trend up">
              <span>↑ 8%</span>
              <span>较昨日</span>
            </div>
          </div>
        </div>

        <div class="stat-card stat-accent">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">📝</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats?.answer?.todayCount || 0 }}</span>
            <span class="stat-label">答题次数</span>
            <div class="stat-trend down">
              <span>↓ 3%</span>
              <span>较昨日</span>
            </div>
          </div>
        </div>

        <div class="stat-card stat-success">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">✅</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats?.answer?.correctRate || 0 }}%</span>
            <span class="stat-label">正确率</span>
            <div class="stat-trend up">
              <span>↑ 5%</span>
              <span>较昨日</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 欢迎横幅 -->
      <ParentWelcomeBanner
        :stats="stats"
        :children="children"
        @bind-child="openBindChildModal"
        @manage-child="manageChild"
        @delete-child="deleteChild"
      />

      <!-- 快速操作 -->
      <section class="quick-actions">
        <h3 class="section-title">
          <span class="title-icon">⚡</span>
          <span class="title-text">快速操作</span>
        </h3>
        <div class="actions-grid">
          <div class="action-card" @click="goToManage">
            <div class="action-icon-wrapper">
              <span class="action-icon">🎛️</span>
            </div>
            <span class="action-title">游戏管控</span>
            <span class="action-desc">管理游戏权限</span>
          </div>
          <div class="action-card" @click="showRecords = true">
            <div class="action-icon-wrapper">
              <span class="action-icon">📊</span>
            </div>
            <span class="action-title">游戏记录</span>
            <span class="action-desc">查看历史数据</span>
          </div>
          <div class="action-card" @click="showAnswerRecords = true">
            <div class="action-icon-wrapper">
              <span class="action-icon">📈</span>
            </div>
            <span class="action-title">答题分析</span>
            <span class="action-desc">学习效果报告</span>
          </div>
          <div class="action-card" @click="showSettings = true">
            <div class="action-icon-wrapper">
              <span class="action-icon">⚙️</span>
            </div>
            <span class="action-title">系统设置</span>
            <span class="action-desc">个性化配置</span>
          </div>
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

      <!-- 游戏分类与列表 -->
      <section class="games-section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="title-icon">🎮</span>
            <span class="title-text">游戏库</span>
          </h3>
          <div class="category-tabs">
            <button
              v-for="category in categories"
              :key="category.id"
              class="category-tab"
              :class="{ active: currentCategory === category.id }"
              @click="selectCategory(category.id)"
            >
              <span class="tab-icon">{{ category.icon }}</span>
              <span class="tab-name">{{ category.name }}</span>
              <span class="tab-count">{{ category.count }}</span>
            </button>
          </div>
        </div>

        <div v-if="gameStore.isLoading" class="games-loading">
          <div class="loading-spinner"></div>
          <p>加载游戏...</p>
        </div>

        <div v-else-if="filteredGames.length === 0" class="games-empty">
          <span class="empty-icon">🎁</span>
          <p>该分类下暂无游戏</p>
        </div>

        <div v-else class="games-grid">
          <div
            v-for="game in filteredGames"
            :key="game.gameId"
            class="game-card"
            @click="playGame(game)"
          >
            <div class="game-cover">
              <div class="game-icon">{{ game.gameIcon || '🎮' }}</div>
              <div class="game-badges">
                <span v-if="game.isNew" class="game-badge badge-new">NEW</span>
                <span v-if="game.isHot" class="game-badge badge-hot">🔥 热门</span>
              </div>
            </div>
            <div class="game-info">
              <h4 class="game-name">{{ game.gameName }}</h4>
              <p class="game-desc">{{ game.description || '这是一个有趣的游戏！' }}</p>
              <div class="game-meta">
                <span class="game-rating">
                  <span class="rating-star">⭐</span>
                  <span>{{ game.rating || 4.5 }}</span>
                </span>
                <span class="game-category">{{ getCategoryName(game.category) }}</span>
              </div>
            </div>
            <div class="game-action">
              <button class="game-play-btn">
                <span class="play-icon">▶</span>
                <span>试玩</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 活动通知 -->
      <section class="notifications-panel">
        <h3 class="section-title">
          <span class="title-icon">📢</span>
          <span class="title-text">最新通知</span>
          <span class="view-all-link" @click="showNotifications = true">查看全部</span>
        </h3>
        <div class="notifications-list">
          <div class="notification-item unread">
            <div class="notification-icon">🎉</div>
            <div class="notification-content">
              <h4 class="notification-title">新游戏上线</h4>
              <p class="notification-desc">算术大冒险游戏已上线，快来体验吧！</p>
              <span class="notification-time">2小时前</span>
            </div>
            <span class="notification-badge">3</span>
          </div>
          <div class="notification-item">
            <div class="notification-icon">📊</div>
            <div class="notification-content">
              <h4 class="notification-title">周报已生成</h4>
              <p class="notification-desc">您孩子的学习周报已生成，点击查看详情</p>
              <span class="notification-time">5小时前</span>
            </div>
          </div>
          <div class="notification-item">
            <div class="notification-icon">🏆</div>
            <div class="notification-content">
              <h4 class="notification-title">恭喜获得成就</h4>
              <p class="notification-desc">您的孩子达成了"小小数学家"成就！</p>
              <span class="notification-time">昨天</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 学习数据趋势 -->
      <section class="trends-panel">
        <h3 class="section-title">
          <span class="title-icon">📈</span>
          <span class="title-text">学习趋势</span>
        </h3>
        <div class="trends-grid">
          <div class="trend-card">
            <div class="trend-header">
              <span class="trend-icon">⏰</span>
              <span class="trend-title">游戏时长趋势</span>
            </div>
            <div class="trend-chart">
              <div class="chart-bar" v-for="(value, index) in [65, 80, 45, 90, 75, 85, 70]" :key="index" :style="{ height: value + '%' }"></div>
            </div>
            <div class="trend-labels">
              <span>周一</span>
              <span>周二</span>
              <span>周三</span>
              <span>周四</span>
              <span>周五</span>
              <span>周六</span>
              <span>周日</span>
            </div>
          </div>

          <div class="trend-card">
            <div class="trend-header">
              <span class="trend-icon">🎯</span>
              <span class="trend-title">正确率变化</span>
            </div>
            <div class="trend-chart">
              <div class="chart-bar" v-for="(value, index) in [78, 82, 85, 88, 90, 87, 92]" :key="index" :style="{ height: value + '%' }"></div>
            </div>
            <div class="trend-labels">
              <span>周一</span>
              <span>周二</span>
              <span>周三</span>
              <span>周四</span>
              <span>周五</span>
              <span>周六</span>
              <span>周日</span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 管理面板 -->
    <ParentManagePanel
      :show="showManagePanel"
      :all-games="allGames"
      :children="children"
      :is-loading="isLoading"
      :rules="rules"
      @close="showManagePanel = false"
      @bind-child="openBindChildModal"
      @block-game="handleBlockGame"
      @unblock-game="handleUnblockGame"
      @save-rules="saveRules"
    />

    <!-- 全屏Loading -->
    <GlobalLoading :loading="isLoading" message="处理中..." />

    <!-- 模态框 -->
    <ParentModals
      :show-notifications="showNotifications"
      :show-avatar-picker="showAvatarPicker"
      :show-logout-confirm="showLogoutConfirm"
      :user-id="userStore.parentUser?.parentId || 0"
      :user-type="1"
      :avatars="avatars"
      :current-avatar="userStore.avatar"
      @close-notifications="showNotifications = false"
      @close-avatar-picker="showAvatarPicker = false"
      @close-logout-confirm="showLogoutConfirm = false"
      @change-avatar="changeAvatar"
      @confirm-logout="confirmLogout"
      @notifications-loaded="unreadCount = $event"
    />

    <!-- 绑定已有孩子模态框 -->
    <div v-if="showBindChildModal" class="modal-overlay" @click.self="showBindChildModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>绑定已有孩子</h3>
          <button class="close-btn" @click="showBindChildModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="search-section">
            <div class="search-input-wrapper">
              <span class="search-icon">🔍</span>
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="搜索孩子用户名或昵称"
                @keyup.enter="searchKids"
                class="search-input"
              />
              <button class="search-btn" @click="searchKids">搜索</button>
            </div>
          </div>

          <div v-if="searchResults.length > 0" class="search-results">
            <div class="results-header">搜索结果</div>
            <div class="kid-list">
              <div
                v-for="kid in searchResults"
                :key="kid.kidId"
                class="kid-item"
                :class="{ selected: selectedKid?.kidId === kid.kidId }"
                @click="selectKid(kid)"
              >
                <div class="kid-avatar">{{ kid.avatar || '👶' }}</div>
                <div class="kid-info">
                  <div class="kid-name">{{ kid.nickname || kid.username }}</div>
                  <div class="kid-username">@{{ kid.username }}</div>
                </div>
                <div class="kid-select-icon" v-if="selectedKid?.kidId === kid.kidId">✓</div>
              </div>
            </div>
          </div>

          <div v-if="selectedKid" class="selected-kid-info">
            <div class="selected-kid-title">已选择孩子</div>
            <div class="selected-kid-detail">
              <span class="selected-kid-avatar">{{ selectedKid.avatar || '👶' }}</span>
              <span class="selected-kid-name">{{ selectedKid.nickname || selectedKid.username }}</span>
            </div>

            <div class="form-group">
              <label>角色类型</label>
              <select v-model="bindChildFormData.roleType">
                <option :value="1">父亲</option>
                <option :value="2">母亲</option>
                <option :value="3">监护人</option>
                <option :value="4">辅导员</option>
              </select>
            </div>

            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" v-model="bindChildFormData.isPrimary" />
                <span>设为主要监护人</span>
              </label>
            </div>
          </div>

          <div v-if="searchKeyword && searchResults.length === 0 && !searching" class="no-results">
            <span class="no-results-icon">🔍</span>
            <p>未找到匹配的孩子，请尝试其他关键词</p>
          </div>

          <div v-if="searching" class="searching">
            <div class="loading-spinner small"></div>
            <p>搜索中...</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showBindChildModal = false">取消</button>
          <button class="btn btn-primary" @click="requestBindChild" :disabled="!selectedKid">
            请求绑定
          </button>
        </div>
      </div>
    </div>

    <!-- 删除孩子确认框 -->
    <KidUnifiedModalV2
      v-model:show="showDeleteChildConfirm"
      title="确认删除"
      type="error"
      icon="❌"
      :closable="true"
      @confirm="confirmDeleteChild"
    >
      <template #default>
        <p>确定要删除孩子 <strong>{{ selectedChild?.nickname }}</strong> 吗？</p>
        <p class="warning-text">此操作不可恢复！</p>
      </template>
    </KidUnifiedModalV2>

    <!-- 孩子管理模态框 -->
    <div v-if="showChildManageModal" class="modal-overlay" @click.self="showChildManageModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>管理孩子 - {{ selectedChild?.nickname }}</h3>
          <button class="close-btn" @click="showChildManageModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="child-manage-section">
            <h4>🎮 游戏权限</h4>
            <div class="game-permissions">
              <div class="permission-item">
                <label>每日游戏时长限制</label>
                <div class="input-wrapper">
                  <input type="number" v-model.number="rules.dailyDuration" min="0" max="180" />
                  <span class="input-suffix">分钟</span>
                </div>
              </div>
              <div class="permission-item">
                <label>单次游戏时长限制</label>
                <div class="input-wrapper">
                  <input type="number" v-model.number="rules.singleDuration" min="0" max="60" />
                  <span class="input-suffix">分钟</span>
                </div>
              </div>
              <div class="permission-item">
                <label>游戏时间范围</label>
                <div class="time-range">
                  <input type="time" v-model="rules.startTime" />
                  <span class="time-separator">至</span>
                  <input type="time" v-model="rules.endTime" />
                </div>
              </div>
              <div class="permission-item checkbox-item">
                <label>
                  <input type="checkbox" v-model="rules.enableFatiguePoints" />
                  <span>启用疲劳点系统</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showChildManageModal = false">取消</button>
          <button class="btn btn-primary" @click="saveRules">保存设置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/core/store/user.store';
import { useGameStore } from '@/core/store/game.store';
import { handleApiError } from '@/utils/error-handler.util';
import { parentApi } from '@/services/parent-api.service';
import { kidApi } from '@/services/kid-api.service';
import { gameApi } from '@/services/game-api.service';
import GlobalLoading from '@/components/GlobalLoading.vue';
import ParentHeader from './components/ParentHeader.vue';
import ParentWelcomeBanner from './components/ParentWelcomeBanner.vue';
import ParentManagePanel from './components/ParentManagePanel.vue';
import ParentModals from './components/ParentModals.vue';
import { modal } from '@/composables/useUnifiedModalV2';
import KidUnifiedModalV2 from '@/components/ui/KidUnifiedModalV2.vue';

const router = useRouter();
const userStore = useUserStore();
const gameStore = useGameStore();

// 状态
const currentCategory = ref('all');
const showManagePanel = ref(false);
const showNotifications = ref(false);
const showAvatarPicker = ref(false);
const showLogoutConfirm = ref(false);
const showRecords = ref(false);
const showAnswerRecords = ref(false);
const showSettings = ref(false);
const unreadCount = ref(2);
const isLoading = ref(false);
const errorMessage = ref('');

// 孩子管理相关
const showDeleteChildConfirm = ref(false);
const showChildManageModal = ref(false);
const showBindChildModal = ref(false);
const selectedChild = ref<any>(null);
const selectedKid = ref<any>(null);
const searchKeyword = ref('');
const searchResults = ref<any[]>([]);
const searching = ref(false);
const bindChildFormData = ref({
  roleType: 3,
  isPrimary: false,
});

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

const avatars = ref(['👨‍👩‍👧', '👨', '👩', '🧑', '👴', '👵', '🧓', '👶', '👦', '👧']);

const stats = ref({
  game: {
    todayCount: 5,
    todayDuration: 120,
  },
  answer: {
    todayCount: 15,
    correctRate: 85,
  },
});

const allGames = ref<any[]>([]);
const children = ref<any[]>([]);

const rules = ref({
  dailyDuration: 60,
  singleDuration: 30,
  startTime: '',
  endTime: '',
  enableFatiguePoints: true,
  maxFatiguePoints: 10,
});

// 计算属性
const filteredGames = computed(() => {
  let games = gameStore.gameList;
  
  if (currentCategory.value !== 'all') {
    games = games.filter(game => game.category === currentCategory.value);
  }
  
  games.forEach(game => {
    if (!game.isNew) game.isNew = Math.random() > 0.85;
    if (!game.isHot) game.isHot = Math.random() > 0.8;
    if (!game.rating) game.rating = (Math.random() * 2 + 3).toFixed(1);
    if (!game.playCount) game.playCount = Math.floor(Math.random() * 10000) + 500;
  });
  
  return games;
});

// 方法
function getCircleStyle(index: number) {
  const size = Math.random() * 100 + 50;
  const left = Math.random() * 100;
  const top = Math.random() * 100;
  const delay = Math.random() * 5;
  const duration = Math.random() * 10 + 10;
  
  return {
    '--circle-size': `${size}px`,
    '--circle-left': `${left}%`,
    '--circle-top': `${top}%`,
    '--circle-delay': `${delay}s`,
    '--circle-duration': `${duration}s`,
  };
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}小时${mins > 0 ? `${mins}分钟` : ''}`;
}

function getCategoryName(categoryId: string): string {
  const category = categories.value.find(c => c.id === categoryId);
  return category ? category.name : '全部';
}

function selectCategory(categoryId: string) {
  currentCategory.value = categoryId;
}

async function handleBlockGame(kidId: number, gameId: number) {
  errorMessage.value = '';
  try {
    await parentApi.blockGame(kidId, gameId);
  } catch (err: any) {
    const error = handleApiError(err);
    errorMessage.value = error.message;
  }
}

async function handleUnblockGame(kidId: number, gameId: number) {
  errorMessage.value = '';
  try {
    await parentApi.unblockGame(kidId, gameId);
  } catch (err: any) {
    const error = handleApiError(err);
    errorMessage.value = error.message;
  }
}

async function saveRules() {
  errorMessage.value = '';
  try {
    isLoading.value = true;
    await new Promise(resolve => setTimeout(resolve, 500));
    showManagePanel.value = false;
    showChildManageModal.value = false;
  } catch (err: any) {
    const error = handleApiError(err);
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
}

const playGame = async (game: any) => {
  errorMessage.value = '';
  try {
    isLoading.value = true;
    const parentId = userStore.parentUser?.parentId;
    if (!parentId) {
      throw new Error('无法获取家长 ID');
    }

    const sessionGame = gameStore.gameList.find(g => g.gameId === game.gameId);
    if (!sessionGame) {
      throw new Error(`游戏不存在 (ID: ${game.gameId})`);
    }

    const sessionId = await gameApi.start(parentId, game.gameId);
    
    gameStore.currentSession = {
      sessionId,
      gameId: game.gameId,
      gameCode: sessionGame.gameCode,
      gameName: sessionGame.gameName,
      userId: parentId,
      startTime: Date.now(),
      duration: 0,
      score: 0,
      status: 'playing' as const
    };

    router.push(`/game/${sessionGame.gameCode}`);
  } catch (err: any) {
    const error = handleApiError(err);
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
};

function goToManage() {
  showManagePanel.value = true;
}

// 导航到创作者中心
function navigateToCreatorCenter(tabId?: string) {
  if (tabId) {
    router.push(`/creator-center?tab=${tabId}`);
  } else {
    router.push('/creator-center');
  }
}

// 孩子管理方法
function manageChild(child: any) {
  selectedChild.value = child;
  showChildManageModal.value = true;
}

function deleteChild(child: any) {
  selectedChild.value = child;
  showDeleteChildConfirm.value = true;
}

async function confirmDeleteChild() {
  errorMessage.value = '';
  try {
    isLoading.value = true;
    await new Promise(resolve => setTimeout(resolve, 500));
    children.value = children.value.filter(c => c.kidId !== selectedChild.value.kidId);
    showDeleteChildConfirm.value = false;
    selectedChild.value = null;
  } catch (err: any) {
    const error = handleApiError(err);
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
}

async function requestBindChild() {
  errorMessage.value = '';
  try {
    isLoading.value = true;

    if (!selectedKid.value) {
      errorMessage.value = '请选择要绑定的孩子';
      return;
    }

    await parentApi.requestBindKid(
      userStore.parentUser!.parentId,
      selectedKid.value.username,
      bindChildFormData.value.roleType,
      bindChildFormData.value.isPrimary
    );

    showBindChildModal.value = false;
    selectedKid.value = null;
    searchKeyword.value = '';
    searchResults.value = [];
    bindChildFormData.value = {
      roleType: 3,
      isPrimary: false,
    };

    await loadChildren();
  } catch (err: any) {
    const error = handleApiError(err);
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
}

function openBindChildModal() {
  selectedKid.value = null;
  searchKeyword.value = '';
  searchResults.value = [];
  bindChildFormData.value = {
    roleType: 3,
    isPrimary: false,
  };
  showBindChildModal.value = true;
}

async function searchKids() {
  errorMessage.value = '';
  try {
    if (!searchKeyword.value.trim()) {
      errorMessage.value = '请输入搜索关键词';
      return;
    }

    searching.value = true;
    const results = await kidApi.search(searchKeyword.value.trim());
    searchResults.value = results;
  } catch (err: any) {
    const error = handleApiError(err);
    errorMessage.value = error.message;
  } finally {
    searching.value = false;
  }
}

function selectKid(kid: any) {
  selectedKid.value = kid;
}

function changeAvatar(avatar: string) {
  userStore.updateUserInfo({ avatar });
}

function logout() {
  showLogoutConfirm.value = true;
}

function confirmLogout() {
  userStore.logoutParent();
  showLogoutConfirm.value = false;
  router.push('/login');
}

async function loadGames() {
  errorMessage.value = '';
  try {
    isLoading.value = true;
    await gameStore.loadGameList();
    allGames.value = [...gameStore.gameList];
  } catch (err) {
    const error = handleApiError(err);
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
}

async function loadChildren() {
  if (!userStore.parentUser?.parentId) return;

  errorMessage.value = '';
  try {
    const kids = await parentApi.getChildren(userStore.parentUser.parentId);
    children.value = kids;
  } catch (err) {
    console.error('加载孩子列表失败:', err);
  }
}

function updateCategoryCount() {
  const total = gameStore.gameList.length;
  categories.value.forEach(cat => {
    if (cat.id === 'all') {
      cat.count = total;
    } else {
      cat.count = gameStore.gameList.filter(g => g.category === cat.id).length;
    }
  });
}

onMounted(() => {
  userStore.restoreFromStorage();

  if (!userStore.isParentLoggedIn) {
    if (userStore.isLoggedIn) {
      router.push('/');
    } else {
      router.push('/login');
    }
    return;
  }

  loadGames();
  loadChildren();
  updateCategoryCount();
});
</script>

<style scoped>
/* ========== 容器与背景 ========== */
.parent-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFB6E6 0%, #A6E3E9 50%, #FFE66D 100%);
  position: relative;
  overflow-x: hidden;
}

.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.bg-circle {
  position: absolute;
  width: var(--circle-size);
  height: var(--circle-size);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  left: var(--circle-left);
  top: var(--circle-top);
  animation: float var(--circle-duration) ease-in-out infinite;
  animation-delay: var(--circle-delay);
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-30px) rotate(180deg); }
}

/* ========== 主内容区 ========== */
.parent-main {
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
  z-index: 1;
}

/* ========== 数据概览卡片 ========== */
.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
}

.stat-card.stat-primary::before { background: linear-gradient(180deg, #FF9DCB, #FF6B9D); }
.stat-card.stat-secondary::before { background: linear-gradient(180deg, #7DD8D0, #4ECDC4); }
.stat-card.stat-accent::before { background: linear-gradient(180deg, #FFE66D, #FFD93D); }
.stat-card.stat-success::before { background: linear-gradient(180deg, #7DD8D0, #4ECDC4); }

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.stat-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-primary .stat-icon-wrapper { background: linear-gradient(135deg, #FF9DCB, #FF6B9D); }
.stat-secondary .stat-icon-wrapper { background: linear-gradient(135deg, #7DD8D0, #4ECDC4); }
.stat-accent .stat-icon-wrapper { background: linear-gradient(135deg, #FFE66D, #FFD93D); }
.stat-success .stat-icon-wrapper { background: linear-gradient(135deg, #7DD8D0, #4ECDC4); }

.stat-icon {
  font-size: 2rem;
}

.stat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: #333;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 0.25rem;
}

.stat-trend.up { color: #10b981; }
.stat-trend.down { color: #ef4444; }

/* ========== 快速操作 ========== */
.quick-actions {
  margin-bottom: 2rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1.5rem;
}

.title-icon {
  font-size: 1.8rem;
}

.title-text {
  flex: 1;
}

.view-all-link {
  font-size: 0.9rem;
  color: white;
  text-decoration: underline;
  cursor: pointer;
  opacity: 0.9;
}

.view-all-link:hover {
  opacity: 1;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.action-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.action-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg, #FF9DCB, #FF6B9D);
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
}

/* ========== 游戏分类与列表 ========== */
.games-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.category-tabs {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid transparent;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  color: #666;
}

.category-tab:hover {
  background: white;
  transform: translateY(-2px);
}

.category-tab.active {
  background: white;
  border-color: #FF6B9D;
  color: #FF6B9D;
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
}

.tab-icon {
  font-size: 1.2rem;
}

.tab-count {
  font-size: 0.75rem;
  background: rgba(255, 107, 157, 0.15);
  padding: 0.1rem 0.5rem;
  border-radius: 10px;
  color: #FF6B9D;
  font-weight: 600;
}

.games-loading,
.games-empty {
  text-align: center;
  padding: 3rem;
  color: white;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: spin 1s linear infinite;
}

.loading-spinner.small {
  width: 30px;
  height: 30px;
  border-width: 3px;
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.game-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.game-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.game-cover {
  position: relative;
  background: linear-gradient(135deg, #FF6B9D 0%, #4ECDC4 50%, #45B7D1 100%);
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
}

.game-icon {
  font-size: 4rem;
  transition: transform 0.3s;
}

.game-card:hover .game-icon {
  transform: scale(1.1);
}

.game-badges {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 0.5rem;
}

.game-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: bold;
  color: white;
}

.badge-new { background: #10b981; }
.badge-hot { background: #ef4444; }

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

.game-category {
  background: rgba(255, 107, 157, 0.15);
  color: #FF6B9D;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-weight: 600;
}

.game-action {
  padding: 1rem 1.25rem;
  border-top: 1px solid #f3f4f6;
}

.game-play-btn {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #FF6B9D 0%, #4ECDC4 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.game-play-btn:hover {
  background: linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
}

.play-icon {
  font-size: 0.8rem;
}

/* ========== 活动通知 ========== */
.notifications-panel {
  margin-bottom: 2rem;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
}

.notification-item:hover {
  transform: translateX(5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.notification-item.unread {
  background: linear-gradient(135deg, rgba(255, 107, 157, 0.08), rgba(78, 205, 196, 0.08));
  border-left: 3px solid #FF6B9D;
}

.notification-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.25rem 0;
}

.notification-desc {
  font-size: 0.9rem;
  color: #666;
  margin: 0 0 0.5rem 0;
  line-height: 1.5;
}

.notification-time {
  font-size: 0.8rem;
  color: #999;
}

.notification-badge {
  width: 8px;
  height: 8px;
  background: #FF6B9D;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ========== 学习趋势 ========== */
.trends-panel {
  margin-bottom: 2rem;
}

.trends-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.trend-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.trend-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.trend-icon {
  font-size: 1.5rem;
}

.trend-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 150px;
  margin-bottom: 1rem;
  gap: 0.5rem;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(180deg, #FF6B9D 0%, #4ECDC4 100%);
  border-radius: 8px 8px 0 0;
  min-width: 20px;
  transition: all 0.3s;
}

.chart-bar:hover {
  opacity: 0.8;
  transform: scaleY(1.05);
}

.trend-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #999;
}

/* ========== 模态框样式 ========== */
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
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
  width: 90%;
  max-width: 600px;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  transition: color 0.3s;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

/* 搜索相关 */
.search-section {
  margin-bottom: 1.5rem;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s;
}

.search-input-wrapper:focus-within {
  border-color: #FF6B9D;
  background: white;
}

.search-icon {
  font-size: 1.2rem;
  margin-left: 0.5rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem 0.5rem;
  border: none;
  background: transparent;
  font-size: 1rem;
  outline: none;
}

.search-btn {
  padding: 0.5rem 1.25rem;
  background: linear-gradient(135deg, #FF6B9D 0%, #4ECDC4 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
}

.search-results {
  margin-bottom: 1.5rem;
}

.results-header {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.kid-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.kid-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: all 0.3s;
}

.kid-item:last-child {
  border-bottom: none;
}

.kid-item:hover {
  background: #f9fafb;
}

.kid-item.selected {
  background: rgba(255, 107, 157, 0.12);
  border-color: #FF6B9D;
}

.kid-avatar {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FF9DCB, #FF6B9D);
  border-radius: 50%;
  font-size: 2rem;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(255, 107, 157, 0.25);
}

.kid-info {
  flex: 1;
}

.kid-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.kid-username {
  font-size: 0.875rem;
  color: #666;
}

.kid-select-icon {
  color: #FF6B9D;
  font-weight: bold;
  font-size: 1.25rem;
}

.selected-kid-info {
  padding: 1rem;
  background: rgba(255, 107, 157, 0.08);
  border: 2px solid #FF6B9D;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.selected-kid-title {
  font-weight: 600;
  color: #FF6B9D;
  margin-bottom: 0.75rem;
}

.selected-kid-detail {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.selected-kid-avatar {
  font-size: 2rem;
}

.selected-kid-name {
  font-weight: 600;
  color: #333;
}

/* 表单 */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #FF6B9D;
}

.form-group.checkbox-group {
  display: flex;
  align-items: center;
}

.form-group.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin-bottom: 0;
}

.form-group.checkbox-group input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: #666;
  background: #f9fafb;
  border-radius: 12px;
}

.no-results-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

.searching {
  text-align: center;
  padding: 2rem;
  color: #666;
}

/* 孩子管理 */
.child-manage-section {
  margin-bottom: 1.5rem;
}

.child-manage-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #333;
}

.game-permissions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 12px;
}

.permission-item label {
  min-width: 140px;
  font-weight: 500;
  color: #333;
}

.permission-item .input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.permission-item input[type="number"],
.permission-item input[type="time"] {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1rem;
}

.input-suffix {
  color: #666;
  font-size: 0.9rem;
}

.time-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-separator {
  color: #666;
}

.permission-item.checkbox-item {
  padding: 0.75rem 1rem;
}

.permission-item.checkbox-item label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin-bottom: 0;
}

.permission-item.checkbox-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin: 0;
}

/* 按钮 */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #FF6B9D 0%, #4ECDC4 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
}

.btn-secondary {
  background: #f3f4f6;
  color: #333;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
}

.btn-danger:hover {
  background: #fecaca;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.warning-text {
  color: #dc2626;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

/* ========== 响应式设计 ========== */
@media (max-width: 1024px) {
  .parent-main {
    padding: 1.5rem;
  }

  .dashboard-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .games-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }

  .trends-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .parent-main {
    padding: 1rem;
    padding-bottom: 20px;
  }

  .dashboard-stats {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .stat-card {
    padding: 1.25rem;
  }

  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .category-tabs {
    gap: 0.5rem;
  }

  .category-tab {
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
  }

  .games-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .category-tabs {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .category-tab {
    white-space: nowrap;
  }
}

@media (max-width: 480px) {
  .actions-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    max-width: 95%;
  }
}
</style>
