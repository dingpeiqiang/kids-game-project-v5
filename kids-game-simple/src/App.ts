import './styles/main.css'
import type { Game } from './types'
import type { PlatformContext } from './app/types'
import type { LeaderboardEntry } from './services/leaderboardService'
import { storageService } from './services/storage'
import { audioService } from './services/audio'
import { gameEngine } from './services/gameEngine'
import { userService } from './services/userService'
import { AuthModal, MePanel, injectUserStyles } from './services/userUI'
import { OrientationManager } from './utils/orientation'

import { renderUI, showDailyPop, closeDailyPop } from './app/ui'
import { renderGameCards, createGameCard, renderPreview, getFavorites, toggleFavorite, refreshCurrentPage, performSearch, switchToHome, switchToRank, showSearchResults, renderFavoritesPage, refreshBestScores, showScoreFly } from './app/gameCards'
import { launchGame, showGameGuide, closeGuide, cancelGuide, startGame, endGame, showResult, syncScoreAsync, closeResult, replayGame, exitGame, setRating, submitComment, renderComments, updateCommentStats, formatTime } from './app/gameSession'
import { showRank, showRankForGame, closeRank, initRankGameSelector, renderRank, calculateRank, convertGameIdToNumber, clearRankCache } from './app/rank'
import { bindEvents, bindGameCallbacks } from './app/events'
import { setupCustomPowerupBar, removePowerupBar } from './app/powerup'

class App {
  // ---- 状态字段 ----
  currentGame: Game | null = null
  previewAnimFrames: Map<string, number> = new Map()
  previewObserver: IntersectionObserver | null = null
  orientationManager: OrientationManager | null = null
  rankCache: Map<string, LeaderboardEntry[]> = new Map()
  currentPage: 'home' | 'rank' | 'favorites' | 'me' = 'home'
  searchKeyword: string = ''
  selectedRating: number = 0
  guideSkipped: boolean = false

  // ---- 子系统 ----
  authModal: AuthModal
  mePanel: MePanel

  constructor() {
    this.authModal = new AuthModal()
    this.mePanel = new MePanel(this.authModal)
  }

  /** 构建模块间通信上下文 */
  private buildContext(): PlatformContext {
    const self = this
    return {
      // 可变状态引用（通过 getter/setter 代理）
      get currentGame() { return self.currentGame },
      set currentGame(v) { self.currentGame = v },
      get rankCache() { return self.rankCache },
      get currentPage() { return self.currentPage },
      set currentPage(v) { self.currentPage = v },
      get searchKeyword() { return self.searchKeyword },
      set searchKeyword(v) { self.searchKeyword = v },
      get previewAnimFrames() { return self.previewAnimFrames },
      get previewObserver() { return self.previewObserver },
      set previewObserver(v) { self.previewObserver = v },
      get orientationManager() { return self.orientationManager },
      set orientationManager(v) { self.orientationManager = v },
      get selectedRating() { return self.selectedRating },
      set selectedRating(v) { self.selectedRating = v },
      get guideSkipped() { return self.guideSkipped },
      set guideSkipped(v) { self.guideSkipped = v },

      authModal: this.authModal,
      mePanel: this.mePanel,

      // 只读计算属性
      get store() { return userService.isLoggedIn ? userService.current! : storageService.get() },
      get userServiceCurrent() { return userService.current },

      // 方法绑定
      renderGameCards: () => renderGameCards(this.buildContext()),
      createGameCard: (game, best, rank) => createGameCard(this.buildContext(), game, best, rank),
      renderPreview: (game, retryCount) => renderPreview(this.buildContext(), game, retryCount),
      getFavorites: () => getFavorites(this.buildContext()),
      toggleFavorite: (gameId) => toggleFavorite(this.buildContext(), gameId),
      refreshCurrentPage: () => refreshCurrentPage(this.buildContext()),
      performSearch: (keyword: string) => performSearch(this.buildContext(), keyword),
      switchToHome: () => switchToHome(this.buildContext()),
      switchToRank: () => switchToRank(this.buildContext()),
      showSearchResults: (results: Game[]) => showSearchResults(this.buildContext(), results),
      showRankForGame: (gameId) => showRankForGame(this.buildContext(), gameId),
      showRank: () => showRank(this.buildContext()),
      closeRank: () => closeRank(),
      renderFavoritesPage: () => renderFavoritesPage(this.buildContext()),
      refreshBestScores: () => refreshBestScores(),
      showScoreFly: (score, x, y, isCrit, isCombo) => showScoreFly(score, x, y, isCrit, isCombo),
      renderComments: () => renderComments(this.buildContext()),
      setRating: (rating) => setRating(this.buildContext(), rating),
      submitComment: () => submitComment(this.buildContext()),
      onUserChange: () => this.onUserChange(),
      convertGameIdToNumber: (gameId) => convertGameIdToNumber(gameId),
      clearRankCache: (gameId) => clearRankCache(this.buildContext(), gameId),
      launchGame: (game) => launchGame(this.buildContext(), game),
      closeResult: () => closeResult(this.buildContext()),
      replayGame: () => replayGame(this.buildContext()),
      exitGame: () => exitGame(this.buildContext()),
      startGame: () => startGame(this.buildContext()),
      closeGuide: () => closeGuide(this.buildContext()),
      closeDailyPop: () => closeDailyPop(),
      setupCustomPowerupBar: (gameId, powerups, inventory, onUse) => setupCustomPowerupBar(this.buildContext(), gameId, powerups, inventory, onUse),
      removePowerupBar: () => removePowerupBar(),
    }
  }

  init() {
    // 注入用户系统样式
    injectUserStyles()

    // 音频需在用户交互后初始化（浏览器自动播放策略）
    const initAudio = () => {
      audioService.initOnGesture()
      document.removeEventListener('click', initAudio)
      document.removeEventListener('touchstart', initAudio)
    }
    document.addEventListener('click', initAudio, { once: true })
    document.addEventListener('touchstart', initAudio, { once: true })

    renderUI(this.buildContext())
    bindEvents(this.buildContext())
    bindGameCallbacks()

    // 监听窗口大小变化

    // 监听用户变更事件
    window.addEventListener('ugp:userChange', () => this.onUserChange())

    // 等待异步会话恢复完成后，再决定是否弹出登录框
    setTimeout(() => {
      if (!userService.isLoggedIn) {
        this.authModal.open(() => this.onUserChange())
      }
    }, 1200)

    // 检查每日奖励
    const data = storageService.get()
    if (data.hasDoubleCard) {
      setTimeout(() => showDailyPop(), 800)
    }

    // 隐藏loading
    setTimeout(() => {
      const loading = document.getElementById('loading')
      loading?.classList.add('hide')
    }, 500)
  }

  /** 用户登录/退出后刷新 */
  private onUserChange() {
    const u = userService.current
    const avatarEl = document.getElementById('userAvatar')
    const coinEl = document.getElementById('coinCount')
    const todayEl = document.getElementById('todayGames')
    if (avatarEl) avatarEl.textContent = u ? u.avatar : '我'
    if (coinEl) coinEl.textContent = String(u ? u.coins : storageService.get().coins)
    if (todayEl) todayEl.textContent = String(u ? u.todayGames : storageService.get().todayGames)
    refreshBestScores()
    renderGameCards(this.buildContext())
  }

  // ---- 对外公开 API（供游戏层通过 `app.xxx()` 调用） ----

  setupCustomPowerupBar(
    gameId: string,
    powerups: Array<{ id: string; icon: string; name: string }>,
    inventory: string[],
    onUse: (powerupId: string) => void
  ) {
    setupCustomPowerupBar(this.buildContext(), gameId, powerups, inventory, onUse)
  }

  updatePowerupCount(type: string, count: number) {
    const el = document.getElementById(`powerup_${type}`)
    if (el) {
      el.textContent = count > 0 ? String(count) : ''
    }
  }

  removePowerupBar() {
    removePowerupBar()
  }
}

export const app = new App()