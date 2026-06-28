<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storageService } from '@simple/services/storage'
import { userService } from '@simple/services/userService'
import type { PlatformContext } from '@simple/app/types'
import type { Game } from '@simple/types'
import { getLevelByExp } from '@simple/types/user'
import { AuthModal, MePanel, injectUserStyles } from '@simple/services/userUI'
import { showDailyPop, closeDailyPop } from '@simple/app/ui'
import {
  renderGameCards,
  renderGameCardsFresh,
  createGameCard,
  renderPreview,
  getFavorites,
  toggleFavorite,
  refreshCurrentPage,
  performSearch,
  switchToHome,
  switchToRank,
  switchToTask,
  switchToShop,
  switchToMe,
  showSearchResults,
  renderFavoritesPage,
  refreshBestScores,
} from '@simple/app/gameCards'
import { launchGame } from '@simple/app/gameSession'
import {
  showRank,
  showRankForGame,
  closeRank,
  convertGameIdToNumber,
  clearRankCache,
} from '@simple/app/rank'
import { bindEvents, bindGameCallbacks } from '@simple/app/events'
import { bindEconomyButtons, fetchTasksForBanner, bannerTaskView } from '@simple/app/economyUI'
import { lobbyPathForTab, navigateTo } from '@simple/router/navigation'
import { isLoggedIn as isSharedAuthLoggedIn } from '@/utils/auth'
import '@simple/styles/main.css'
import '@simple/styles/game-shell.css'

const route = useRoute()
const router = useRouter()

const authModal = new AuthModal()
const mePanel = new MePanel(authModal)

const isLoading = ref(true)
const previewAnimFrames = ref<Map<string, number>>(new Map())
const previewObserver = ref<IntersectionObserver | null>(null)
const currentPage = ref<'home' | 'learning' | 'rank' | 'favorites' | 'me' | 'task' | 'shop'>('home')
const searchKeyword = ref('')
const rankCache = ref(new Map<string, import('../services/leaderboardService').LeaderboardEntry[]>())

const isGameRoute = computed(() => route.path.startsWith('/game/'))
const isAuthRoute = computed(() => route.path === '/login' || route.path === '/register')
const showLobbyChrome = computed(() => !isGameRoute.value && !isAuthRoute.value)

const store = computed(() => (userService.isLoggedIn ? userService.current! : storageService.get()))
const avatarContent = computed(() => userService.current?.avatar || '我')
const coinVal = computed(() => userService.current?.coins || store.value.coins)
const studyCoinVal = computed(() => userService.current?.studyCoins ?? 0)

type BannerTask = ReturnType<typeof bannerTaskView>
const bannerTasks = ref<BannerTask[]>([])

async function loadBannerTasks() {
  if (!userService.isLoggedIn) {
    const today = new Date().toDateString()
    const s = store.value
    const signDone = s.dailyRewardCollected === today
    const games = s.todayGames
    bannerTasks.value = [
      bannerTaskView({
        taskId: 0,
        taskCode: 'daily_sign_in',
        taskName: '每日签到',
        targetValue: 1,
        progress: signDone ? 1 : 0,
        status: signDone ? 2 : 0,
      }),
      bannerTaskView({
        taskId: 0,
        taskCode: 'daily_play_3',
        taskName: '玩3局游戏',
        targetValue: 3,
        progress: Math.min(games, 3),
        status: games >= 3 ? 1 : 0,
      }),
    ]
    return
  }
  const rows = await fetchTasksForBanner()
  bannerTasks.value = rows.length ? rows.map(bannerTaskView) : []
}

async function onBannerClaim(task: BannerTask) {
  if (!task.canClaim || !task.taskId) return
  const { apiTaskClaim } = await import('@simple/services/apiClient')
  const claim = await apiTaskClaim(task.taskId)
  if (claim.ok && claim.data && (claim.data as Record<string, unknown>).success === true) {
    const w = (claim.data as Record<string, unknown>).wallet as
      | { coins?: number; studyCoins?: number; exp?: number }
      | undefined
    if (userService.current && w) {
      if (w.coins != null) userService.current.coins = w.coins
      if (w.studyCoins != null) userService.current.studyCoins = w.studyCoins
      if (w.exp != null) userService.current.exp = w.exp
      userService.saveUser(userService.current)
    }
    await loadBannerTasks()
    window.dispatchEvent(new CustomEvent('ugp:userChange'))
  } else {
    const { showToast } = await import('@simple/services/userUI')
    showToast(String((claim.data as Record<string, unknown>)?.message ?? claim.msg ?? '领取失败'), 'error')
  }
}

function syncLobbyPageFromRoute() {
  const name = route.name
  const map: Record<string, typeof currentPage.value> = {
    LobbyHome: 'home',
    LobbyTask: 'task',
    LobbyShop: 'shop',
    LobbyRank: 'rank',
    LobbyFavorites: 'favorites',
    LobbyMe: 'me',
  }
  if (typeof name === 'string' && map[name]) {
    currentPage.value = map[name]
  }
}

function navigateLobbyTab(tab: string) {
  const path = lobbyPathForTab(tab)
  if (route.path !== path) {
    void router.push(path)
  }
}

const buildContext = (): PlatformContext => {
  return {
    authModal,
    mePanel,
    get rankCache() {
      return rankCache.value
    },
    get currentPage() {
      return currentPage.value
    },
    set currentPage(v) {
      currentPage.value = v
    },
    get searchKeyword() {
      return searchKeyword.value
    },
    set searchKeyword(v) {
      searchKeyword.value = v
    },
    get previewAnimFrames() {
      return previewAnimFrames.value
    },
    get previewObserver() {
      return previewObserver.value
    },
    set previewObserver(v) {
      previewObserver.value = v
    },
    orientationManager: null,
    get store() {
      return store.value
    },
    get userServiceCurrent() {
      return userService.current
    },
    renderGameCards: () => renderGameCards(buildContext()),
    createGameCard: (game, best) => createGameCard(buildContext(), game, best),
    renderPreview: (game, retryCount, canvas) => renderPreview(buildContext(), game, retryCount, canvas),
    getFavorites: () => getFavorites(buildContext()),
    toggleFavorite: (gameId) => toggleFavorite(buildContext(), gameId),
    refreshCurrentPage: () => refreshCurrentPage(buildContext()),
    performSearch: (keyword: string) => performSearch(buildContext(), keyword),
    switchToHome: () => {
      navigateLobbyTab('home')
      switchToHome(buildContext())
    },
    switchToLearning: () => {
      navigateLobbyTab('learning')
    },
    switchToRank: () => {
      navigateLobbyTab('rank')
      switchToRank(buildContext())
    },
    switchToTask: () => {
      navigateLobbyTab('task')
      switchToTask(buildContext())
    },
    switchToShop: () => {
      navigateLobbyTab('shop')
      switchToShop(buildContext())
    },
    switchToMe: () => {
      navigateLobbyTab('me')
      switchToMe(buildContext())
    },
    showSearchResults: (results: Game[]) => showSearchResults(buildContext(), results),
    showRankForGame: (gameId) => showRankForGame(buildContext(), gameId),
    showRank: () => showRank(buildContext()),
    closeRank: () => closeRank(),
    renderFavoritesPage: () => renderFavoritesPage(buildContext()),
    refreshBestScores: () => refreshBestScores(),
    onUserChange: () => onUserChange(),
    convertGameIdToNumber: (gameId) => convertGameIdToNumber(gameId),
    clearRankCache: (gameId) => clearRankCache(buildContext(), gameId),
    launchGame: (game) => launchGame(buildContext(), game),
    closeDailyPop: () => closeDailyPop(),
  }
}

let platformContext: PlatformContext | null = null
function ctx(): PlatformContext {
  if (!platformContext) platformContext = buildContext()
  return platformContext
}

let userChangeTimer: ReturnType<typeof setTimeout> | null = null
function onUserChange() {
  if (userChangeTimer) clearTimeout(userChangeTimer)
  userChangeTimer = setTimeout(() => {
    userChangeTimer = null
    refreshBestScores()
    void renderGameCardsFresh(ctx())
    void loadBannerTasks()

    if (!userService.isLoggedIn) return
    const today = new Date().toDateString()
    if (userService.current?.dailyRewardCollected !== today) {
      setTimeout(() => showDailyPop(), 1200)
    }
  }, 150)
}

function applyLobbyViewForRoute() {
  syncLobbyPageFromRoute()
  const c = ctx()
  const page = currentPage.value
  if (page === 'home') switchToHome(c)
  else if (page === 'rank') switchToRank(c)
  else if (page === 'task') switchToTask(c)
  else if (page === 'shop') switchToShop(c)
  else if (page === 'favorites') {
    c.currentPage = 'favorites'
    renderFavoritesPage(c)
  } else if (page === 'me') switchToMe(c)
}

onMounted(async () => {
  await nextTick()
  injectUserStyles()
  bindEvents(ctx())
  bindGameCallbacks()
  bindEconomyButtons()

  const userAvatar = document.getElementById('userAvatar')
  userAvatar?.addEventListener('click', () => {
    mePanel.open()
  })

  await userService.whenReady()
  // 登录页 / 账号选择写入 token 后进入大厅时，userService 可能仍为空会话，需与 shared auth 对齐
  if (isSharedAuthLoggedIn()) {
    await userService.ensurePlayableSession()
  }
  void renderGameCards(ctx())
  await loadBannerTasks()
  applyLobbyViewForRoute()

  window.addEventListener('ugp:userChange', () => onUserChange())
  window.addEventListener('ugp:tasksRefresh', () => loadBannerTasks())

  setTimeout(() => {
    isLoading.value = false
  }, 500)

  if (!userService.isLoggedIn && !isSharedAuthLoggedIn() && showLobbyChrome.value) {
    authModal.open(() => onUserChange())
    authModal.requireLogin = true
  } else if (userService.isLoggedIn) {
    onUserChange()
  }
})

onUnmounted(() => {
  window.removeEventListener('ugp:userChange', () => onUserChange())
})

watch(
  () => route.fullPath,
  () => {
    if (showLobbyChrome.value) {
      applyLobbyViewForRoute()
    }
  },
)
</script>

<template>
  <div class="platform-shell">
    <div id="loading" v-if="isLoading && showLobbyChrome">
      <div class="loader"></div>
      <p>正在加载平台...</p>
    </div>

    <template v-if="showLobbyChrome">
      <div class="top-bar" id="topBar">
        <div class="top-left">
          <img class="brand-icon" :src="'/icon-512x512.png'" alt="图标" />
          <img class="brand-text-img" :src="'/星光游学App文字.png'" alt="星光游学" />
        </div>
        <div class="top-right">
          <div class="search-box" id="searchBox">
            <input type="text" id="searchInput" placeholder="搜索..." v-model="searchKeyword" />
            <button class="search-btn" id="searchBtn" type="button">🔍</button>
          </div>
          <div class="coin-display">
            <div class="coin-item">
              <span class="coin-label">金</span>
              <span id="coinCount">{{ coinVal }}</span>
            </div>
            <div class="coin-divider"></div>
            <div class="coin-item study-coin">
              <span class="coin-label">游</span>
              <span id="studyCoinCount">{{ studyCoinVal }}</span>
            </div>
          </div>
          <div class="user-avatar" id="userAvatar" :title="userService.current?.username || '点击登录'">
            {{ avatarContent }}
          </div>
        </div>
      </div>

      <div class="main-container" id="mainView">
        <RouterView v-slot="{ Component }">
          <component :is="Component" />
        </RouterView>

        <div id="homeContent">
          <div class="learning-quick-access" v-if="userService.isLoggedIn">
            <div class="learning-qa-title">📚 学习中心</div>
            <div class="learning-qa-grid">
              <div class="learning-qa-card" @click="navigateTo('/answer')">
                <div class="lqa-icon">✏️</div>
                <div class="lqa-label">答题赚币</div>
              </div>
              <div class="learning-qa-card" @click="navigateTo('/wrong-book')">
                <div class="lqa-icon">📕</div>
                <div class="lqa-label">错题本</div>
              </div>
              <div class="learning-qa-card" @click="navigateTo('/collection')">
                <div class="lqa-icon">⭐</div>
                <div class="lqa-label">收藏夹</div>
              </div>
              <div class="learning-qa-card" @click="navigateTo('/learning-report')">
                <div class="lqa-icon">📊</div>
                <div class="lqa-label">学习报告</div>
              </div>
            </div>
          </div>
          <div id="categorySections"></div>
        </div>

        <div id="searchResults" style="display: none">
          <div class="search-header">
            <div class="search-title">🔍 搜索结果</div>
            <button class="btn btn-secondary" id="btnCloseSearch" type="button">返回</button>
          </div>
          <div class="search-count" id="searchCount"></div>
          <div id="searchGameList" class="game-grid"></div>
          <div class="no-results" id="noResults" style="display: none">
            <div class="no-results-icon">��</div>
            <div class="no-results-text">没有找到相关游戏</div>
          </div>
        </div>

        <div id="favoritesContent" style="display: none">
          <div class="favorites-header">
            <div class="favorites-title">❤️ 我的收藏</div>
          </div>
          <div class="favorites-count" id="favoritesCount"></div>
          <div id="favoritesGameList" class="game-grid"></div>
          <div class="no-favorites" id="noFavorites" style="display: none">
            <div class="no-favorites-icon">��</div>
            <div class="no-favorites-text">暂无收藏游戏</div>
            <div class="no-favorites-hint">点击游戏卡片底部的收藏标签即可收藏</div>
          </div>
        </div>

        <div id="rankContent" class="rank-page" style="display: none">
          <div class="rank-page-panel">
            <div class="rank-header">
              <div class="rank-title">🏆 排行榜</div>
            </div>
            <div class="rank-game-selector">
              <span class="selector-icon">🎮</span>
              <select id="rankGameSelect" class="rank-game-select"></select>
            </div>
            <div class="rank-tabs">
              <div class="rank-tab active" data-tab="global">🌐 全局</div>
              <div class="rank-tab" data-tab="daily">📅 今日</div>
              <div class="rank-tab" data-tab="friend">👥 好友</div>
            </div>
            <div class="rank-podium" id="rankPodium"></div>
            <div class="my-rank-card" id="myRankCard" style="display: none">
              <div class="my-rank-info">
                <div class="my-rank-label">我的排名</div>
                <div class="my-rank-value" id="myRankPosition">-</div>
              </div>
              <div class="my-rank-score">
                <div class="my-rank-label">分数</div>
                <div class="my-rank-value" id="myRankScore">0</div>
              </div>
              <button class="my-rank-btn" id="btnScrollToMyRank" type="button">📍 定位到我的排名</button>
            </div>
            <div class="rank-list" id="rankList"></div>
          </div>
        </div>

        <div id="taskContent" class="page-content" style="display: none">
          <div class="page-header">
            <div class="page-title">📋 任务中心</div>
          </div>
          <div id="taskPageList" class="task-list"></div>
        </div>

        <div id="shopContent" class="page-content" style="display: none">
          <div class="page-header">
            <div class="page-title">🛒 商城</div>
          </div>
          <p class="page-hint">100 金币可兑换 1 游学币，金币主要通过完成任务获得</p>
          <div id="shopPageList" class="shop-list"></div>
        </div>

        <div id="meContent" class="page-content" style="display: none"></div>
      </div>

      <div class="bottom-nav bottom-nav--6" id="bottomNav">
        <div
          class="nav-item"
          :class="{ active: currentPage === 'home' }"
          data-page="home"
          @click="navigateLobbyTab('home')"
        >
          <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
          <span>首页</span>
        </div>
        <div
          class="nav-item"
          :class="{ active: currentPage === 'task' }"
          data-page="task"
          id="navTask"
          @click="navigateLobbyTab('task')"
        >
          <svg viewBox="0 0 24 24">
            <path
              d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z"
            />
          </svg>
          <span>任务</span>
        </div>
        <div
          class="nav-item"
          :class="{ active: currentPage === 'shop' }"
          data-page="shop"
          id="navShop"
          @click="navigateLobbyTab('shop')"
        >
          <svg viewBox="0 0 24 24">
            <path
              d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0020 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"
            />
          </svg>
          <span>商城</span>
        </div>
        <div
          class="nav-item"
          :class="{ active: currentPage === 'rank' }"
          data-page="rank"
          @click="navigateLobbyTab('rank')"
        >
          <svg viewBox="0 0 24 24"><path d="M7.5 21H2V9l10-7 10 7v12h-5.5v-7h-9v7zm7-11.5L18.5 17H15v-7.5z" /></svg>
          <span>排行</span>
        </div>
        <div
          class="nav-item"
          :class="{ active: currentPage === 'favorites' }"
          data-page="favorites"
          @click="navigateLobbyTab('favorites')"
        >
          <svg viewBox="0 0 24 24">
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
          </svg>
          <span>收藏</span>
        </div>
        <div
          class="nav-item"
          :class="{ active: currentPage === 'me' }"
          data-page="me"
          @click="navigateLobbyTab('me')"
        >
          <svg viewBox="0 0 24 24">
            <path
              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
            />
          </svg>
          <span>我的</span>
        </div>
      </div>
    </template>

    <RouterView v-else />

    <!-- 游戏层与全局浮层（全路由可用） -->
    <div id="game-layer" class="game-layer-root">
      <button type="button" class="game-shell-toggle" id="gameShellToggle" aria-label="Toggle header">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
        </svg>
      </button>
      <div id="game-shell" class="game-shell">
        <header class="game-shell-chrome" id="gameShellChrome">
          <button type="button" class="game-shell-btn game-shell-btn--back" id="gameShellBack" aria-label="返回">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
          <div class="game-shell-title-wrap">
            <span class="game-shell-title" id="gameShellTitle">游戏</span>
            <span class="game-shell-combo" id="gameShellCombo"></span>
          </div>
          <div class="game-shell-hud">
            <div class="game-shell-score" aria-live="polite">
              <span class="game-shell-score-label">得分</span>
              <span class="game-shell-score-value" id="gameShellScore">0</span>
            </div>
            <button type="button" class="game-shell-btn game-shell-btn--pause" id="gameShellPause" aria-label="暂停">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            </button>
          </div>
        </header>
        <div class="game-shell-body">
          <div class="game-viewport" id="game-viewport">
            <div id="gameCanvas" class="game-canvas-host"></div>
          </div>
          <footer class="game-shell-footer">
            <div class="game-shell-powerup-slot" id="gameShellPowerupSlot"></div>
          </footer>
        </div>
      </div>
      <div
        class="game-pause-overlay"
        id="gamePauseOverlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gamePauseTitle"
      >
        <div class="game-pause-card">
          <div class="game-pause-title" id="gamePauseTitle">游戏暂停</div>
          <p class="game-pause-hint">休息一下，准备好了再继续</p>
          <div class="game-pause-actions">
            <button type="button" class="btn btn-primary" id="gamePauseResume">继续游戏</button>
            <button type="button" class="btn btn-secondary" id="gamePauseQuit">退出本局</button>
          </div>
        </div>
      </div>
      <div
        class="game-pause-overlay game-exit-overlay"
        id="gameExitConfirmOverlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gameExitConfirmTitle"
      >
        <div class="game-pause-card">
          <div class="game-pause-title" id="gameExitConfirmTitle">退出游戏？</div>
          <p class="game-pause-hint">本局进度将不会保存到结算</p>
          <div class="game-pause-actions">
            <button type="button" class="btn btn-primary" id="gameExitStay">继续玩</button>
            <button type="button" class="btn btn-secondary" id="gameExitConfirm">退出到大厅</button>
          </div>
        </div>
      </div>
    </div>

    <div id="rotate-overlay">
      <div class="rotate-device">
        <div class="rotate-icon">📱</div>
        <div class="rotate-title">横屏畅玩</div>
        <div class="rotate-text">切换至横屏模式，获得最佳游戏体验</div>
        <button class="rotate-btn" id="rotateBtn" type="button">切换到横屏</button>
        <div class="rotate-dismiss" id="rotateDismiss">继续竖屏（体验不佳）</div>
        <div class="rotate-auto-hint" id="rotateAutoHint">或手动旋转设备</div>
      </div>
    </div>

    <div id="result-overlay">
      <div class="result-card">
        <div class="result-icon" id="resultIcon"></div>
        <div class="result-title" id="resultTitle">本局结束!</div>
        <div class="result-score" id="resultScore">0</div>
        <div class="result-best" id="resultBest">历史最高: 0</div>
        <div
          class="result-stats"
          id="resultStats"
          style="display: none; margin: 12px 0; padding: 12px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 12px"
        ></div>
        <div class="result-rank" id="resultRank" style="display: none">
          <div class="rank-badge" id="rankBadge"></div>
          <div class="rank-text" id="rankText"></div>
        </div>
        <div class="buff-list" id="resultBuffs"></div>
        <div class="btn-group">
          <button class="btn btn-secondary" id="btnBack" type="button">返回大厅</button>
          <button class="btn btn-primary" id="btnReplay" type="button">再来一局</button>
        </div>
        <div style="margin-top: 12px">
          <a href="#" id="btnResetGuide" style="font-size: 11px; color: #bbb; text-decoration: none">重看游戏引导</a>
        </div>
      </div>
    </div>

    <div id="daily-overlay">
      <div class="daily-card">
        <div class="dc-icon">🎁</div>
        <div class="dc-title">每日签到</div>
        <div class="dc-desc">签到可获得金币、游学币与经验值（以签到配置为准）</div>
        <button class="dc-btn" id="btnClaimDaily" type="button">领取奖励</button>
      </div>
    </div>

    <div id="guide-overlay">
      <div class="guide-card">
        <div class="guide-header">
          <div class="guide-icon" id="guideIcon">🎯</div>
          <div class="guide-title-section">
            <div class="guide-name" id="guideName">游戏名称</div>
            <div class="guide-desc" id="guideDesc">游戏描述</div>
          </div>
        </div>
        <div class="guide-ops" id="guideOps"></div>
        <div class="guide-tips" id="guideTips"></div>
        <div class="guide-skip">
          <label><input type="checkbox" id="guideSkipCheck" />不再显示本游戏引导</label>
        </div>
        <button class="guide-btn" id="btnStartGame" type="button">开始游戏</button>
        <div class="comment-section" id="commentSection">
          <div class="comment-header">
            <div class="comment-title">📝 游戏评论</div>
            <div class="comment-stats" id="commentStats"></div>
          </div>
          <div class="comment-input-area">
            <div class="rating-stars" id="ratingStars">
              <span class="star" data-rating="1">★</span>
              <span class="star" data-rating="2">★</span>
              <span class="star" data-rating="3">★</span>
              <span class="star" data-rating="4">★</span>
              <span class="star" data-rating="5">★</span>
            </div>
            <textarea id="commentInput" placeholder="分享你的游戏感受..." maxlength="200"></textarea>
            <button class="btn btn-comment" id="btnSubmitComment" type="button">发布评论</button>
          </div>
          <div class="comment-list" id="commentList">
            <div class="no-comments" id="noComments">暂无评论，快来发表第一条吧！</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>