import type { Game, PlayerData } from '../types'
import type { AuthModal, MePanel } from '../services/userUI'
import type { LeaderboardEntry } from '../services/leaderboardService'
import type { OrientationManager } from '../utils/orientation'
import type { UserAccount } from '../types/user'

/**
 * 平台上下文接口 —— App 对外暴露给模块的能力与状态
 * 模块函数通过此接口访问 App，避免循环依赖
 */
export interface PlatformContext {
  // 状态
  currentGame: Game | null
  authModal: AuthModal
  mePanel: MePanel
  rankCache: Map<string, LeaderboardEntry[]>
  currentPage: 'home' | 'rank' | 'favorites' | 'me' | 'task' | 'shop'
  searchKeyword: string
  previewAnimFrames: Map<string, number>
  previewObserver: IntersectionObserver | null
  orientationManager: OrientationManager | null
  selectedRating: number
  guideSkipped: boolean

  // 只读计算属性
  readonly store: PlayerData | UserAccount
  readonly userServiceCurrent: UserAccount | null

  // 方法
  renderGameCards(): void
  renderPreview(game: Game, retryCount?: number): void
  createGameCard(game: Game, best: number): HTMLElement
  getFavorites(): string[]
  toggleFavorite(gameId: string): void
  refreshCurrentPage(): void
  performSearch(keyword: string): void
  switchToHome(): void
  switchToRank(): void
  switchToTask(): void
  switchToShop(): void
  switchToMe(): void
  showSearchResults(results: Game[]): void
  showRankForGame(gameId: string): void
  showRank(): void
  closeRank(): void
  renderFavoritesPage(): void
  refreshBestScores(): void
  showScoreFly(score: number, x: number, y: number, isCrit: boolean, isCombo: boolean): void
  renderComments(): Promise<void>
  setRating(rating: number): void
  submitComment(): Promise<void>
  onUserChange(): void
  convertGameIdToNumber(gameId: string): number
  clearRankCache(gameId: string): void
  launchGame(game: Game): void | Promise<void>
  closeResult(): void
  replayGame(): void
  exitGame(): void
  startGame(): Promise<void>
  closeGuide(): void
  closeDailyPop(): void
  setupCustomPowerupBar(gameId: string, powerups: Array<{id: string; icon: string; name: string}>, inventory: string[], onUse: (powerupId: string) => void): void
  removePowerupBar(): void
}