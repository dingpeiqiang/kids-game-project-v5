/**
 * API 服务统一导出
 * 
 * 使用方式：
 * import { kidApi, parentApi, gameApi, themeApi } from '@/services';
 * 
 * 或按需导入：
 * import { kidApi } from '@/services/kid-api.service';
 */

// ===== 基础类型和常量 =====
export * from './api.types';
export { BaseApiService } from './base-api.service';

// ===== 用户相关 =====
export { kidApi, KidApiService } from './kid-api.service';
export { parentApi, ParentApiService } from './parent-api.service';

// ===== 游戏相关 =====
export { gameApi, GameApiService } from './game-api.service';
export { questionApi, QuestionApiService } from './question-api.service';

// ===== 主题相关 =====
export { themeApi, ThemeApiService } from './theme-api.service';
export type { CloudThemeInfo, ThemeListParams, ThemeUploadPayload } from './theme-api.service';

// ===== 通知相关 =====
export { notificationApi, NotificationApiService } from './notification-api.service';
export type { Notification } from './notification-api.service';

// ===== 排行榜相关 =====
export { leaderboardApi, LeaderboardApiService } from './leaderboard-api.service';

// ===== 统计相关 =====
export { statsApi, StatsApiService } from './stats-api.service';

// ===== 管理员相关 =====
export { adminApi, AdminApiService } from './admin-api.service';

// ===== 游戏模式相关 =====
export { gameModeApi, GameModeApiService } from './game-mode-api.service';

// ===== 其他服务 =====
export { themeService } from './theme.service';
export { toast, ToastService } from './toast.service';
export { webSocketService } from './websocket.service';

// ===== 废弃警告 =====
// api.service 已删除，请使用细分服务：
// - 儿童相关：kidApi
// - 家长相关：parentApi
// - 游戏相关：gameApi
// - 答题相关：questionApi
// - 主题相关：themeApi
// - 通知相关：notificationApi
// - 排行榜相关：leaderboardApi
