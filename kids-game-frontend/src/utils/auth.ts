/**
 * 认证工具（实现见 @kids-game/shared，此处保留原路径以兼容存量引用）
 */
export {
  API_CONSTANTS,
} from '@kids-game/shared';

export {
  type ClientUserType,
  DEFAULT_PLAY_APP_URL,
  DEFAULT_ADMIN_APP_URL,
  getCurrentUserType,
  isLoggedIn,
  clearAllAuth,
  getCurrentUserId,
  getCurrentUserName,
  checkAndRedirectToLogin,
  validateGameStartPermission,
} from '@kids-game/shared';