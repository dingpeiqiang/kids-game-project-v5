/**
 * 管理端路由（系统管理员 + 家长，/admin 内按角色显示菜单）
 */
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import {
  getCurrentUserType,
  isLoggedIn,
} from '@/utils/auth';
import {
  getDefaultAdminLanding,
  isPathAllowedForRole,
  type AdminPortalRole,
} from '@kids-game/shared';

const PLAY_URL = import.meta.env.VITE_PLAY_URL || 'http://localhost:3001';

function portalRole(): AdminPortalRole | null {
  const t = getCurrentUserType();
  if (t === 'admin') return 'admin';
  if (t === 'parent') return 'parent';
  return null;
}

const routes: RouteRecordRaw[] = [
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
    path: '/',
    name: 'Root',
    redirect: () => {
      const role = portalRole();
      if (!role) return '/login';
      return getDefaultAdminLanding(role);
    },
  },
  {
    path: '/parent',
    name: 'Parent',
    component: () => import('@/modules/parent/index.vue'),
    meta: { title: '家长中心', requiresAuth: true },
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/modules/admin/index.vue'),
    meta: { title: '管理后台', requiresAuth: true, requiresPortal: true },
    redirect: () => {
      const role = portalRole();
      return role ? getDefaultAdminLanding(role) : '/login';
    },
    children: [
      {
        path: 'dashboard',
        meta: { title: '仪表盘', menuId: 'dashboard' },
        component: () => import('@/modules/admin/components/DashboardOverview.vue'),
      },
      {
        path: 'users',
        meta: { title: '用户管理', menuId: 'users', adminOnly: true },
        component: () => import('@/views/admin/UserManagement.vue'),
      },
      {
        path: 'relations',
        meta: { title: '关系管理', menuId: 'relations', adminOnly: true },
        component: () => import('@/views/admin/RelationManagement.vue'),
      },
      {
        path: 'configs',
        meta: { title: '管控配置', menuId: 'configs' },
        component: () => import('@/views/admin/ControlConfig.vue'),
      },
      {
        path: 'stats',
        meta: { title: '统计报表', menuId: 'stats' },
        component: () => import('@/views/admin/UserStats.vue'),
      },
      {
        path: 'games',
        meta: { title: '游戏管理', menuId: 'games', adminOnly: true },
        component: () => import('@/modules/admin/components/GameManagement.vue'),
      },
      {
        path: 'questions',
        meta: { title: '题库管理', menuId: 'questions', adminOnly: true },
        component: () => import('@/modules/admin/components/QuestionManagement.vue'),
      },
      {
        path: 'docs',
        meta: { title: '项目手册', menuId: 'docs', adminOnly: true },
        component: () => import('@/modules/admin/components/DocViewer.vue'),
      },
      {
        path: 'themes',
        meta: { title: '主题管理', menuId: 'themes', adminOnly: true },
        component: () => import('@/modules/admin/components/ThemeManagement.vue'),
      },
      {
        path: 'game-resources',
        meta: { title: '游戏资源', menuId: 'game-resources', adminOnly: true },
        component: () => import('@/modules/admin/components/TestResourceManager.vue'),
      },
      {
        path: 'creator-center',
        meta: { title: '创作者中心', menuId: 'creator-center', adminOnly: true },
        component: () => import('@/modules/creator-center/index.vue'),
      },
      {
        path: 'creator-center/gtrs-editor',
        name: 'GTRSThemeCreatorV2',
        meta: { title: 'GTRS主题编辑器', menuId: 'creator-center', adminOnly: true },
        component: () => import('@/modules/creator-center/GTRSThemeCreatorV2.vue'),
      },
    ],
  },
  {
    path: '/creator-center',
    redirect: '/admin/creator-center',
  },
  {
    path: '/creator-center/gtrs-editor',
    redirect: '/admin/creator-center/gtrs-editor',
  },
  {
    path: '/admin/gtrs-theme-creator',
    redirect: '/admin/creator-center/gtrs-editor',
  },
  {
    path: '/admin/gtrs-theme-creator-v2',
    redirect: '/admin/creator-center/gtrs-editor',
  },
  {
    path: '/game/:pathMatch(.*)*',
    beforeEnter: (to) => {
      const base = PLAY_URL.replace(/\/$/, '');
      const path = to.path.startsWith('/') ? to.path : `/${to.path}`;
      const query = to.fullPath.includes('?') ? to.fullPath.slice(to.fullPath.indexOf('?')) : '';
      window.location.href = `${base}${path}${query}`;
      return false;
    },
    component: () => import('@/modules/login/index.vue'),
  },
  {
    path: '/answer',
    beforeEnter: () => {
      window.location.href = `${PLAY_URL.replace(/\/$/, '')}/answer`;
      return false;
    },
    component: () => import('@/modules/login/index.vue'),
  },
  {
    path: '/home',
    beforeEnter: () => {
      window.location.href = PLAY_URL;
      return false;
    },
    component: () => import('@/modules/login/index.vue'),
  },
  ...(import.meta.env.DEV
    ? ([
        {
          path: '/theme-demo',
          name: 'ThemeDemo',
          component: () => import('@/modules/theme-demo/index.vue'),
          meta: { title: '主题演示', requiresAuth: false },
        },
        {
          path: '/modal-demo',
          name: 'ModalDemo',
          component: () => import('@/views/ModalDemo.vue'),
          meta: { title: '弹窗组件演示', requiresAuth: false },
        },
        {
          path: '/test-modal-optimization',
          name: 'TestModalOptimization',
          component: () => import('@/views/TestModalOptimization.vue'),
          meta: { title: '弹窗样式优化测试', requiresAuth: false },
        },
      ] as RouteRecordRaw[])
    : []),
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - 星光游学管理端`;
  }

  const requiresAuth = to.meta.requiresAuth !== false;
  const loggedIn = isLoggedIn();
  const userType = getCurrentUserType();
  const role = portalRole();

  if (userType === 'kid' && loggedIn) {
    window.location.href = PLAY_URL;
    return;
  }

  if (requiresAuth && !loggedIn) {
    next('/login');
    return;
  }

  if (to.meta.adminOnly && role !== 'admin') {
    next(role ? getDefaultAdminLanding(role) : '/login');
    return;
  }

  if (to.path.startsWith('/admin/') && role) {
    if (!isPathAllowedForRole(to.path, role)) {
      next(getDefaultAdminLanding(role));
      return;
    }
  }

  if (to.path === '/login' && loggedIn && role) {
    next(getDefaultAdminLanding(role));
    return;
  }

  next();
});

export default router;