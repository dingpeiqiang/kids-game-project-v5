/**
 * 统一路由导航（替代 window.location.href）
 */
import type { Router } from 'vue-router';

let routerInstance: Router | null = null;

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

/** 大厅 Tab 与路由路径 */
export const LOBBY_TAB_ROUTES: Record<string, string> = {
  home: '/home',
  task: '/task',
  shop: '/shop',
  rank: '/rank',
  favorites: '/favorites',
  me: '/me',
};

export function lobbyPathForTab(tab: string): string {
  return LOBBY_TAB_ROUTES[tab] ?? '/home';
}