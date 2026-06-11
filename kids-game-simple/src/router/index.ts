/**
 * 终端应用路由（儿童游玩）
 */
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { isLoggedIn } from '@/utils/auth';
import { isEmbeddedCanvasGame } from '@simple/games/embeddedCanvasGames';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'KidsHome',
    component: () => import('@/modules/kids-home/index.vue'),
    meta: { title: '趣玩乐园', requiresAuth: true },
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/modules/home/index.vue'),
    meta: { title: '首页', requiresAuth: true },
  },
  {
    path: '/game/:type',
    name: 'GameMode',
    component: () => import('@/modules/game/GameModeSelect.vue'),
    meta: { title: '选择游戏模式', requiresAuth: true },
    props: true,
    beforeEnter: (to) => {
      const code = String(to.params.type ?? '');
      if (isEmbeddedCanvasGame(code)) {
        return { path: `/game/${code}/play`, query: to.query };
      }
      return true;
    },
  },
  {
    path: '/game/:type/local-login',
    name: 'LocalBattleLogin',
    component: () => import('@/modules/game/LocalBattleLogin.vue'),
    meta: { title: '本地对战登录', requiresAuth: true },
    props: true,
  },
  {
    path: '/game/:type/play',
    name: 'Game',
    component: () => import('@simple/views/GamePlayHost.vue'),
    meta: { title: '游戏', requiresAuth: true },
    props: true,
  },
  {
    path: '/answer',
    name: 'Answer',
    component: () => import('@/modules/answer/index.vue'),
    meta: { title: '答题挑战', requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/modules/login/index.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/modules/register/index.vue'),
    meta: { title: '注册', requiresAuth: false },
  },
  
  {
    path: '/theme-demo',
    name: 'ThemeDemo',
    component: () => import('@/modules/theme-demo/index.vue'),
    meta: { title: '主题演示', requiresAuth: false },
  },
  {
    path: '/admin/:pathMatch(.*)*',
    redirect: '/',
    component: () => import('@/modules/login/index.vue'),
  },
  {
    path: '/parent',
    redirect: '/',
    component: () => import('@/modules/login/index.vue'),
  },
  {
    path: '/creator-center/:pathMatch(.*)*',
    redirect: '/',
    component: () => import('@/modules/login/index.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - 趣玩乐园`;
  }

  const requiresAuth = to.meta.requiresAuth !== false;
  const loggedIn = isLoggedIn();

  if (requiresAuth && !loggedIn) {
    next('/login');
    return;
  }

  if (to.path === '/login' && loggedIn) {
    next('/');
    return;
  }

  next();
});

export default router;