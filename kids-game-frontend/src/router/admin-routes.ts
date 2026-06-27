/**
 * 管理端路由（系统管理员 + 家长，/admin 内按角色显示菜单）
 * 3000 端口无独立登录页，未认证时跳转到 3001 终端登录。
 * 从 3001 跳转时通过 URL ?token= 携带认证令牌。
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

const LOGIN_PORTAL_URL = import.meta.env.VITE_LOGIN_PORTAL_URL || (import.meta.env.DEV ? 'http://localhost:3001/login' : '/login');
const REGISTER_PORTAL_URL = import.meta.env.VITE_REGISTER_PORTAL_URL || (import.meta.env.DEV ? 'http://localhost:3001/register' : '/register');

function portalRole(): AdminPortalRole | null {
  const t = getCurrentUserType();
  if (t === 'admin') return 'admin';
  if (t === 'parent') return 'parent';
  return null;
}

/** 从 cookie 中提取并存储 3001 传递的跨端口认证信息 */
function consumeCrossPortAuth(): void {
  try {
    const cookies = document.cookie.split(';').reduce((acc, c) => {
      const [k, v] = c.trim().split('=');
      if (k && v) acc[k] = decodeURIComponent(v);
      return acc;
    }, {} as Record<string, string>);

    if (cookies.cross_auth_token) {
      // 根据 user info 判断 token 类型并存储
      const adminInfo = cookies.cross_admin_info;
      const parentInfo = cookies.cross_parent_info;
      const userInfo = cookies.cross_user_info;

      if (adminInfo) {
        localStorage.setItem('adminInfo', adminInfo);
        localStorage.setItem('authToken', cookies.cross_auth_token);
      } else if (parentInfo) {
        localStorage.setItem('parentInfo', parentInfo);
        localStorage.setItem('parentToken', cookies.cross_auth_token);
      } else if (userInfo) {
        localStorage.setItem('userInfo', userInfo);
        localStorage.setItem('authToken', cookies.cross_auth_token);
      }

      // 清理跨端口 cookie（仅用于一次性传输）
      document.cookie = 'cross_auth_token=; path=/; max-age=0';
      document.cookie = 'cross_user_info=; path=/; max-age=0';
      document.cookie = 'cross_parent_info=; path=/; max-age=0';
      document.cookie = 'cross_admin_info=; path=/; max-age=0';
    }
  } catch (e) {
    console.warn('[admin-routes] consumeCrossPortAuth failed:', e);
  }
}

// 启动时立即消费跨端口认证
consumeCrossPortAuth();

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    beforeEnter: () => {
      // 3000 管理端无独立登录页，统一跳转到 3001 终端登录
      window.location.href = LOGIN_PORTAL_URL;
      return false;
    },
  },
  {
    path: '/register',
    name: 'Register',
    beforeEnter: () => {
      window.location.href = REGISTER_PORTAL_URL;
      return false;
    },
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
    path: '/parent/learning-report',
    name: 'ParentLearningReport',
    component: () => import('@/modules/parent/components/ParentLearningReport.vue'),
    meta: { title: '孩子学情', requiresAuth: true },
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
        path: 'subjects',
        meta: { title: '学科管理', menuId: 'subjects', adminOnly: true },
        component: () => import('@/modules/admin/components/SubjectManagement.vue'),
      },
      {
        path: 'knowledge-points',
        meta: { title: '知识点管理', menuId: 'knowledge-points', adminOnly: true },
        component: () => import('@/modules/admin/components/KnowledgePointManagement.vue'),
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
    redirect: '/',
  },
  {
    path: '/answer',
    redirect: '/',
  },
  {
    path: '/home',
    redirect: '/',
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
  const role = portalRole();

  // 3000 无独立登录页，未认证时跳转到 3001 终端登录
  if (requiresAuth && !loggedIn) {
    window.location.href = LOGIN_PORTAL_URL;
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