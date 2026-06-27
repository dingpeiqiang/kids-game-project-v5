/**
 * kids-game-simple 终端壳大厅路径（与 @simple/router/navigation LOBBY_HOME_PATH 一致）
 */
/** 游戏中心首页 */
export const SIMPLE_SHELL_LOBBY_HOME = '/home';

/** 学习中心首页（simple 壳） */
export const SIMPLE_SHELL_LEARNING_HOME = '/learning';

export function isSimpleAppShell(): boolean {
  return import.meta.env.VITE_APP_SHELL === 'simple';
}

/** 从游戏/模式页返回大厅 */
export function lobbyHomePathForShell(): string {
  if (isSimpleAppShell()) return SIMPLE_SHELL_LOBBY_HOME;
  const parentInfo = localStorage.getItem('parentInfo');
  const userInfo = localStorage.getItem('userInfo');
  if (parentInfo) return '/parent';
  if (userInfo) return '/';
  return '/game';
}