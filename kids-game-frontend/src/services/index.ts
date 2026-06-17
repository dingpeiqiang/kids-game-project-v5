/**
 * HTTP 唯一出口：apiClient + 领域 *Api
 */
export * from './api.types';
export { apiClient } from './api-client.service';
export type { RequestOptions } from './api-client.service';

export { authApi } from './auth-api.service';
export type {
  UnifiedAuthResult,
  ParentRegisterPayload,
  ParentRegisterResult,
} from './auth-api.service';

export { shopApi } from './shop-api.service';
export type { ShopProduct, ShopPurchaseResult } from './shop-api.service';

export { taskApi } from './task-api.service';
export type { UserTaskItem, TaskDefinition } from './task-api.service';

export { kidApi } from './kid-api.service';
export { parentApi } from './parent-api.service';
export { gameApi } from './game-api.service';
export { questionApi } from './question-api.service';
export type {
  AnswerSubmitResult,
  QuestionPageResult,
  QuestionSavePayload,
} from './question-api.service';

export { themeApi } from './theme-api.service';
export type {
  CloudThemeInfo,
  ThemeListParams,
  ThemeUploadPayload,
  UserThemePreference,
  ThemeDraft,
} from './theme-api.service';

export { notificationApi } from './notification-api.service';
export type { Notification } from './notification-api.service';

export { leaderboardApi } from './leaderboard-api.service';
export { statsApi } from './stats-api.service';
export { adminApi } from './admin-api.service';
export type {
  PageResult,
  DashboardOverview,
  TodayStats,
  TrendStats,
  AdminUser,
  AdminGame,
  GameCreateParams,
  GameUpdateParams,
  GameStats,
  AdminQuestion,
  QuestionCreateDTO,
  QuestionUpdateDTO,
} from './admin-api.service';

export { gameModeApi } from './game-mode-api.service';
export { draftApi } from './draft-api.service';

export { themeService } from './theme.service';
export { toast, ToastService } from './toast.service';
export { webSocketService } from './websocket.service';