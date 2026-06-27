/**
 * 终端应用路由（儿童游玩）
 */
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { isLoggedIn } from '@/utils/auth';
import { isEmbeddedCanvasGame } from '@simple/games/embeddedCanvasGames';
import { setAppRouter } from '@simple/router/navigation';

const LobbyTab = () => import('@simple/views/lobby/LobbyTabView.vue');
const PlatformShell = () => import('@simple/layouts/PlatformShell.vue');

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/modules/login/index.vue'),
    meta: { title: '登录', requiresAuth: false, guestOnly: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/modules/register/index.vue'),
    meta: { title: '注册', requiresAuth: false, guestOnly: true },
  },
  {
    path: '/account-select',
    name: 'AccountSelect',
    component: () => import('@/modules/account-select/index.vue'),
    meta: { title: '选择账号', requiresAuth: false },
  },
  {
    path: '/',
    component: PlatformShell,
    meta: { requiresAuth: true },
    redirect: { name: 'LobbyHome' },
    children: [
      { path: 'home', name: 'LobbyHome', component: LobbyTab, meta: { title: '游戏中心' } },
      { path: 'learning', name: 'LobbyLearning', component: LobbyTab, meta: { title: '学习中心' } },
      { path: 'task', name: 'LobbyTask', component: LobbyTab, meta: { title: '任务中心' } },
      { path: 'shop', name: 'LobbyShop', component: LobbyTab, meta: { title: '商城' } },
      { path: 'rank', name: 'LobbyRank', component: LobbyTab, meta: { title: '排行榜' } },
      { path: 'favorites', name: 'LobbyFavorites', component: LobbyTab, meta: { title: '我的收藏' } },
      { path: 'me', name: 'LobbyMe', component: LobbyTab, meta: { title: '我的' } },
    ],
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
    path: '/wrong-book',
    name: 'WrongBook',
    component: () => import('@/modules/wrong-book/index.vue'),
    meta: { title: '错题本', requiresAuth: true },
  },
  {
    path: '/collection',
    name: 'Collection',
    component: () => import('@/modules/collection/index.vue'),
    meta: { title: '收藏夹', requiresAuth: true },
  },
  {
    path: '/learning-report',
    name: 'LearningReport',
    component: () => import('@/modules/learning-report/index.vue'),
    meta: { title: '学习报告', requiresAuth: true },
  },
  {
    path: '/teacher',
    name: 'Teacher',
    component: () => import('@/modules/teacher/index.vue'),
    meta: { title: '教师中心', requiresAuth: true },
  },
  {
    path: '/theme-demo',
    name: 'ThemeDemo',
    component: () => import('@/modules/theme-demo/index.vue'),
    meta: { title: '主题演示', requiresAuth: false },
  },
  {
    path: '/admin/:pathMatch(.*)*',
    redirect: '/home',
  },
  {
    path: '/parent',
    redirect: '/home',
  },
  {
    path: '/creator-center/:pathMatch(.*)*',
    redirect: '/home',
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: () => (isLoggedIn() ? '/home' : '/login'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

setAppRouter(router);

router.beforeEach((to, _from, next) => {
  const title = to.meta.title as string | undefined;
  if (title) {
    document.title = `${title} - 星光游学`;
  }

  const requiresAuth = to.meta.requiresAuth !== false;
  const guestOnly = to.meta.guestOnly === true;
  const loggedIn = isLoggedIn();

  if (requiresAuth && !loggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } });
    return;
  }

  if (guestOnly && loggedIn) {
    const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '/home';
    next(redirect);
    return;
  }

  next();
});

export default router;