import type { Game, PlayerData } from '../types'
import type { AuthModal, MePanel } from '../services/userUI'
import type { LeaderboardEntry } from '../services/leaderboardService'
import type { OrientationManager } from '../utils/orientation'
import type { UserAccount } from '../types/user'

/**
 * 平台上下文 —— 大厅壳（PlatformShell）与 gameCards / rank 等模块的桥接
 */
export interface PlatformContext {
  authModal: AuthModal
  mePanel: MePanel
  rankCache: Map<string, LeaderboardEntry[]>
  currentPage: 'home' | 'learning' | 'rank' | 'favorites' | 'me' | 'task' | 'shop'
  searchKeyword: string
  previewAnimFrames: Map<string, number>
  previewObserver: IntersectionObserver | null
  orientationManager: OrientationManager | null

  readonly store: PlayerData | UserAccount
  readonly userServiceCurrent: UserAccount | null

  renderGameCards(): void
  renderPreview(game: Game, retryCount?: number, canvas?: HTMLCanvasElement): void
  createGameCard(game: Game, best: number): HTMLElement
  getFavorites(): string[]
  toggleFavorite(gameId: string): void
  refreshCurrentPage(): void
  performSearch(keyword: string): void
  switchToHome(): void
  switchToLearning(): void
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
  onUserChange(): void
  convertGameIdToNumber(gameId: string): number
  clearRankCache(gameId: string): void
  launchGame(game: Game): void | Promise<void>
  closeDailyPop(): void
}