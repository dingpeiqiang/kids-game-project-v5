/**
 * 统一路由导航（替代 window.location.href）
 */
import type { Router } from 'vue-router';
import { isEmbeddedCanvasGame } from '@simple/games/embeddedCanvasGames';

let routerInstance: Router | null = null;

/** 游戏中心首页（退出游戏、无效 gameId 时回退） */
export const LOBBY_HOME_PATH = '/home';

/** 学习中心首页 */
export const LEARNING_HOME_PATH = '/learning';

export function setAppRouter(router: Router) {
  routerInstance = router;
}

export function getAppRouter(): Router | null {
  return routerInstance;
}

export function navigateTo(path: string) {
  if (routerInstance) {
    void routerInstance.push(path);
    return;
  }
  window.location.assign(path);
}

export function navigateToLobbyHome() {
  navigateTo(LOBBY_HOME_PATH);
}

/**
 * 从大厅进入玩法：内置 Canvas → /game/:id/play；其余 → /game/:id（模式选择）
 */
export function navigateToPlayGame(gameId: string) {
  const path = isEmbeddedCanvasGame(gameId)
    ? `/game/${encodeURIComponent(gameId)}/play`
    : `/game/${encodeURIComponent(gameId)}`;
  navigateTo(path);
}

/** 大厅 Tab 与路由路径 */
export const LOBBY_TAB_ROUTES: Record<string, string> = {
  home: '/home',
  learning: '/learning',
  task: '/task',
  shop: '/shop',
  rank: '/rank',
  favorites: '/favorites',
  me: '/me',
};

export function navigateToLearningHome() {
  navigateTo(LEARNING_HOME_PATH);
}

export function lobbyPathForTab(tab: string): string {
  return LOBBY_TAB_ROUTES[tab] ?? LOBBY_HOME_PATH;
}