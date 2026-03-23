/**
 * 路由配置
 */
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'KidsHome',
    component: () => import('@/modules/kids-home/index.vue'),
    meta: { title: '趣玩乐园', requiresAuth: true, requireParent: false },
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/modules/home/index.vue'),
    meta: { title: '首页', requiresAuth: true, requireParent: false },
  },
  {
    path: '/game/:type',
    name: 'GameMode',
    component: () => import('@/modules/game/GameModeSelect.vue'),
    meta: { title: '选择游戏模式', requiresAuth: true, requireParent: false },
    props: true,
  },
  {
    path: '/game/:type/local-login',
    name: 'LocalBattleLogin',
    component: () => import('@/modules/game/LocalBattleLogin.vue'),
    meta: { title: '本地对战登录', requiresAuth: true, requireParent: false },
    props: true,
  },
  {
    path: '/game/:type/play',
    name: 'Game',
    component: () => import('@/modules/game/index.vue'),
    meta: { title: '游戏', requiresAuth: true, requireParent: false },
    props: true,
  },
  {
    path: '/parent',
    name: 'Parent',
    component: () => import('@/modules/parent/index.vue'),
    meta: { title: '家长管控', requiresAuth: true, requireParent: true },
  },
  {
    path: '/answer',
    name: 'Answer',
    component: () => import('@/modules/answer/index.vue'),
    meta: { title: '答题挑战', requiresAuth: true, requireParent: false },
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
  // 后台管理路由
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/modules/admin/index.vue'),
    meta: { title: '系统管理后台', requiresAuth: true, requireAdmin: true },
    redirect: '/admin/dashboard', // 默认跳转到仪表盘
    children: [
      {
        path: 'dashboard',
        component: () => import('@/modules/admin/components/DashboardOverview.vue'),
      },
      {
        path: 'users',
        component: () => import('@/views/admin/UserManagement.vue'),
      },
      {
        path: 'relations',
        component: () => import('@/views/admin/RelationManagement.vue'),
      },
      {
        path: 'configs',
        component: () => import('@/views/admin/ControlConfig.vue'),
      },
      {
        path: 'stats',
        component: () => import('@/views/admin/UserStats.vue'),
      },
      {
        path: 'games',
        component: () => import('@/modules/admin/components/GameManagement.vue'),
      },
      {
        path: 'questions',
        component: () => import('@/modules/admin/components/QuestionManagement.vue'),
      },
      {
        path: 'docs',
        component: () => import('@/modules/admin/components/DocViewer.vue'),
      },
      {
        path: 'themes',
        component: () => import('@/modules/admin/components/ThemeManagement.vue'),
      },
    ],
  },
  // 主题演示路由（开发测试用）
  {
    path: '/theme-demo',
    name: 'ThemeDemo',
    component: () => import('@/modules/theme-demo/index.vue'),
    meta: { title: '主题演示', requiresAuth: false },
  },
  // 创作者中心
  {
    path: '/creator-center',
    name: 'CreatorCenter',
    component: () => import('@/modules/creator-center/index.vue'),
    meta: { title: '创作者中心', requiresAuth: true, requireParent: false },
  },
  // GTRS 主题编辑器（旧版）- 已废弃，重定向到新版
  {
    path: '/admin/gtrs-theme-creator',
    name: 'GTRSThemeCreatorOld',
    redirect: '/creator-center/gtrs-editor',
  },

  // GTRS 主题编辑器 V2（功能完整版）- 创作者中心专用
  {
    path: '/creator-center/gtrs-editor',
    name: 'GTRSThemeCreatorV2',
    component: () => import('@/modules/creator-center/GTRSThemeCreatorV2.vue'),
    meta: { title: 'GTRS主题编辑器', requiresAuth: true, requireParent: false },
  },
  // 兼容旧路由 - 重定向到新路由
  {
    path: '/admin/gtrs-theme-creator-v2',
    name: 'GTRSThemeCreatorV2Old',
    redirect: '/creator-center/gtrs-editor',
  },
  // 弹窗组件演示
  {
    path: '/modal-demo',
    name: 'ModalDemo',
    component: () => import('@/views/ModalDemo.vue'),
    meta: { title: '弹窗组件演示', requiresAuth: false },
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

// 导入认证工具
import { isLoggedIn as checkAuth, getCurrentUserType } from '@/utils/auth';

// 检查是否已登录（儿童）
function isLoggedIn(): boolean {
  return checkAuth();
}

// 检查家长是否已登录
function isParentLoggedIn(): boolean {
  return checkAuth() && getCurrentUserType() === 'parent';
}

// 检查管理员是否已登录
function isAdminLoggedIn(): boolean {
  return checkAuth() && getCurrentUserType() === 'admin';
}

// 路由守卫
router.beforeEach((to, from, next) => {
  console.log('[Router] 路由跳转:', from.path, '->', to.path);

  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 儿童游戏平台`;
  }

  // 检查是否需要登录
  const requiresAuth = to.meta.requiresAuth !== false;
  const requireParent = to.meta.requireParent === true;
  const requireAdmin = to.meta.requireAdmin === true;
  const loggedIn = isLoggedIn();
  const parentLoggedIn = isParentLoggedIn();
  const adminLoggedIn = isAdminLoggedIn();

  console.log('[Router] 需要登录:', requiresAuth, '需要家长登录:', requireParent, '需要管理员登录:', requireAdmin, '已登录:', loggedIn, '家长已登录:', parentLoggedIn, '管理员已登录:', adminLoggedIn);

  if (requiresAuth && !loggedIn && !parentLoggedIn && !adminLoggedIn) {
    // 未登录，跳转到登录页
    console.log('[Router] 未登录，跳转到登录页');
    next('/login');
  } else if (requireParent && !parentLoggedIn) {
    // 需要家长登录但未登录
    console.log('[Router] 需要家长登录，跳转到登录页');
    next('/login');
  } else if (requireAdmin && !adminLoggedIn) {
    // 需要管理员登录但未登录
    console.log('[Router] 需要管理员登录，跳转到登录页');
    next('/login');
  } else if (to.path === '/login' && (loggedIn || parentLoggedIn || adminLoggedIn)) {
    // 已登录访问登录页，根据用户类型跳转
    console.log('[Router] 已登录访问登录页，跳转到对应首页');
    if (adminLoggedIn) {
      next('/admin');
    } else if (parentLoggedIn) {
      next('/parent');
    } else {
      next('/');
    }
  } else if (to.path === '/' && parentLoggedIn) {
    // 家长登录后访问儿童首页，重定向到家长首页
    console.log('[Router] 家长登录后访问儿童首页，重定向到家长首页');
    next('/parent');
  } else {
    // 正常跳转
    console.log('[Router] 正常跳转');
    next();
  }
});

// 导航错误处理
router.onError((error) => {
  console.error('路由错误:', error);
});

export default router;
