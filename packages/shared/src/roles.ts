/**
 * 管理端角色与菜单权限
 */

export type AdminPortalRole = 'admin' | 'parent';

export interface AdminMenuItemDef {
  id: string;
  name: string;
  icon: string;
  path: string;
  /** 可见角色，不填则仅 admin */
  roles?: AdminPortalRole[];
}

/** 仅系统管理员可见的菜单 id */
const ADMIN_ONLY_IDS = new Set([
  'users',
  'relations',
  'docs',
  'themes',
  'game-resources',
  'creator-center',
]);

export const ALL_ADMIN_MENU_ITEMS: AdminMenuItemDef[] = [
  { id: 'dashboard', name: '仪表盘', icon: '📊', path: '/admin/dashboard', roles: ['admin', 'parent'] },
  { id: 'parent-home', name: '家长中心', icon: '👨‍👩‍👧', path: '/parent', roles: ['parent', 'admin'] },
  { id: 'users', name: '用户管理', icon: '👥', path: '/admin/users' },
  { id: 'relations', name: '关系管理', icon: '🔗', path: '/admin/relations' },
  { id: 'configs', name: '管控配置', icon: '⚙️', path: '/admin/configs', roles: ['admin', 'parent'] },
  { id: 'stats', name: '统计报表', icon: '📈', path: '/admin/stats', roles: ['admin', 'parent'] },
  { id: 'games', name: '游戏管理', icon: '🎮', path: '/admin/games' },
  { id: 'questions', name: '题库管理', icon: '📝', path: '/admin/questions' },
  { id: 'docs', name: '项目手册', icon: '📚', path: '/admin/docs' },
  { id: 'themes', name: '主题管理', icon: '🎨', path: '/admin/themes' },
  { id: 'game-resources', name: '游戏资源管理', icon: '🖼️', path: '/admin/game-resources' },
  { id: 'creator-center', name: '创作者中心', icon: '✨', path: '/admin/creator-center' },
];

export function getMenuItemsForRole(role: AdminPortalRole): AdminMenuItemDef[] {
  return ALL_ADMIN_MENU_ITEMS.filter((item) => {
    if (item.roles) {
      return item.roles.includes(role);
    }
    if (ADMIN_ONLY_IDS.has(item.id)) {
      return role === 'admin';
    }
    return role === 'admin';
  });
}

export function isPathAllowedForRole(path: string, role: AdminPortalRole): boolean {
  const items = getMenuItemsForRole(role);
  if (items.some((i) => i.path === path)) return true;
  if (items.some((i) => path.startsWith(i.path) && i.path.length > 1)) return true;
  if (path.startsWith('/creator-center')) {
    return role === 'admin';
  }
  return false;
}

export function getDefaultAdminLanding(role: AdminPortalRole): string {
  if (role === 'parent') return '/parent';
  return '/admin/dashboard';
}