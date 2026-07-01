/**
 * 管理端 / 家长门户路由（挂载于同一 Vue Router，与终端大厅共存）
 */
import type { RouteRecordRaw } from 'vue-router';
import {
  getCurrentUserType,
  getDefaultAdminLanding,
  isPathAllowedForRole,
  type AdminPortalRole,
} from '@kids-game/shared';

export function portalRole(): AdminPortalRole | null {
  const t = getCurrentUserType();
  if (t === 'admin') return 'admin';
  if (t === 'parent') return 'parent';
  return null;
}

export const adminPortalRoutes: RouteRecordRaw[] = [
  {
    path: '/parent',
    name: 'Parent',
    component: () => import('@/modules/parent/index.vue'),
    meta: { title: '家长中心', requiresAuth: true, portal: 'parent' },
  },
  {
    path: '/parent/learning-report',
    name: 'ParentLearningReport',
    component: () => import('@/modules/parent/components/ParentLearningReport.vue'),
    meta: { title: '孩子学情', requiresAuth: true, portal: 'parent' },
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/modules/admin/index.vue'),
    meta: { title: '管理后台', requiresAuth: true, portal: 'admin' },
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
        component: () => import('@/modules/admin/components/UserManagement.vue'),
      },
      {
        path: 'relations',
        meta: { title: '关系管理', menuId: 'relations', adminOnly: true },
        component: () => import('@/modules/admin/components/RelationManagement.vue'),
      },
      {
        path: 'configs',
        meta: { title: '管控配置', menuId: 'configs' },
        component: () => import('@/modules/admin/components/ControlConfig.vue'),
      },
      {
        path: 'stats',
        meta: { title: '统计报表', menuId: 'stats' },
        component: () => import('@/modules/admin/components/UserStats.vue'),
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
];

export function applyAdminPortalGuards(
  to: import('vue-router').RouteLocationNormalized,
  next: import('vue-router').NavigationGuardNext,
  _loggedIn: boolean,
): boolean {
  const role = portalRole();

  if (to.meta.adminOnly && role !== 'admin') {
    next(role ? getDefaultAdminLanding(role) : '/login');
    return true;
  }

  if (to.path.startsWith('/admin/') && role) {
    if (!isPathAllowedForRole(to.path, role)) {
      next(getDefaultAdminLanding(role));
      return true;
    }
  }

  const portal = to.meta.portal as string | undefined;
  if (portal === 'admin' && role && role !== 'admin' && to.path.startsWith('/admin')) {
    next(getDefaultAdminLanding(role));
    return true;
  }

  return false;
}